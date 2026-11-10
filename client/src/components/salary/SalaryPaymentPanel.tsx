import { useEffect, useMemo, useState } from "react";
import { FileText, Landmark, Loader2, Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { fetchFromAccounts, type RtgsFromAccount } from "@/components/RTGS/rtgsData";
import { salarySelectClass } from "@/components/salary/SalaryForms";
import SalaryRtgsDialog from "@/components/salary/SalaryRtgsDialog";
import SalaryTransferLetterEditor from "@/components/salary/SalaryTransferLetterEditor";
import { salaryMoney } from "@/components/salary/salaryExports";
import type { SalaryEmployee, SalaryRun } from "@/lib/salaryModel";
import {
  SALARY_PAYMENT_METHODS, changePayment, emptySalaryPayment, salaryPaymentIssues, salaryPaymentRequiresChequeDate, sameTransferCheque, transferRowsFor,
  type SalaryFromAccount, type SalaryPayment, type SalaryPaymentMethod,
} from "@/lib/salaryPayment";
import { saveSalaryPayments } from "@/lib/salaryService";

const errorText = (e: unknown) => e instanceof Error ? e.message : "Something went wrong. Please try again.";
const samePayment = (a: SalaryPayment, b: SalaryPayment) => a.method === b.method && a.fromAccount?.key === b.fromAccount?.key && a.chequeNumber === b.chequeNumber && a.chequeDate === b.chequeDate;
const snapshotOf = ({ key, accountTitle, accountNumber, bank, branch, city }: RtgsFromAccount): SalaryFromAccount => ({ key, accountTitle, accountNumber, bank, branch, city });

export default function SalaryPaymentPanel({ run, rows, disabled, onRemove }: { run: SalaryRun; rows: SalaryEmployee[]; disabled: boolean; onRemove: (row: SalaryEmployee) => void }) {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<RtgsFromAccount[]>([]), [accountsError, setAccountsError] = useState("");
  const [edits, setEdits] = useState<Record<string, SalaryPayment>>({}), [saving, setSaving] = useState(false), [error, setError] = useState("");
  const [bulkMethod, setBulkMethod] = useState<SalaryPaymentMethod | "">(""), [bulkAccount, setBulkAccount] = useState("");
  const [rtgsOpen, setRtgsOpen] = useState(false), [transferAccount, setTransferAccount] = useState<SalaryFromAccount | null>(null);
  const editable = run.status === "submitted" || run.status === "approved";
  const lettersOpen = run.status === "approved" || run.status === "paid";
  const unsaved = Object.keys(edits).length > 0;

  useEffect(() => {
    let active = true;
    fetchFromAccounts()
      .then((list) => { if (active) { setAccounts(list.filter((account) => account.paymentAccountId)); setAccountsError(""); } })
      .catch((e) => { if (active) setAccountsError(`Could not load the account list. ${errorText(e)}`); });
    return () => { active = false; };
  }, []);

  const savedPayment = (row: SalaryEmployee) => row.payment ?? emptySalaryPayment();
  const paymentOf = (row: SalaryEmployee) => edits[row.userId] ?? savedPayment(row);
  // Transfer rows can change each other's cheque number, so every row is rechecked.
  // Only real differences are kept, so undoing a change leaves nothing to save.
  function updatePayments(update: (row: SalaryEmployee, payment: SalaryPayment) => SalaryPayment, typedBy?: string) {
    setEdits((previous) => {
      const all = rows.map((row) => ({ userId: row.userId, payment: update(row, previous[row.userId] ?? savedPayment(row)) }));
      const next: Record<string, SalaryPayment> = {};
      sameTransferCheque(all, typedBy).forEach(({ userId, payment }, index) => { if (!samePayment(payment, savedPayment(rows[index]))) next[userId] = payment; });
      return next;
    });
  }
  const change = (target: SalaryEmployee, values: Partial<SalaryPayment>) => updatePayments((row, payment) => row.userId === target.userId ? changePayment(payment, values) : payment, values.chequeNumber === undefined ? undefined : target.userId);
  const accountByKey = (key: string) => { const account = accounts.find((item) => item.key === key); return account ? snapshotOf(account) : null; };

  function applyToAll() {
    const fromAccount = bulkAccount ? accountByKey(bulkAccount) : null;
    updatePayments((_row, payment) => changePayment(payment, { ...(bulkMethod ? { method: bulkMethod } : {}), ...(fromAccount ? { fromAccount } : {}) }));
  }
  async function save() {
    setSaving(true); setError("");
    try {
      await saveSalaryPayments(run.id, Object.entries(edits).map(([userId, payment]) => ({ userId, payment })));
      setEdits({});
      toast({ title: "Payment details saved" });
    } catch (e) { setError(errorText(e)); } finally { setSaving(false); }
  }

  // Letters use saved details only, so what's on screen is what was recorded.
  const pendingRtgs = useMemo(() => rows.filter((row) => row.payment?.method === "rtgs" && row.payment.fromAccount && !row.payment.rtgsSerialNo), [rows]);
  const transferAccounts = useMemo(() => {
    const seen = new Map<string, SalaryFromAccount>();
    for (const row of rows) if (row.payment?.method === "transfer" && row.payment.fromAccount) seen.set(row.payment.fromAccount.key, row.payment.fromAccount);
    return Array.from(seen.values());
  }, [rows]);
  const controlsDisabled = !editable || disabled || saving;

  return <Card><CardContent className="space-y-4 p-4">
    <div>
      <h3 className="font-medium">Payment method</h3>
      <p className="mt-1 text-sm text-muted-foreground">Choose how each employee is paid and which account it comes from. Every method needs a cheque number, and RTGS/RAAST, Cash and Cheque also need a date. Each RTGS/RAAST employee has their own cheque number; a Transfer has one cheque number for everyone paid from that account.</p>
    </div>
    {accountsError && <p role="alert" className="text-sm text-destructive">{accountsError}</p>}
    {editable && <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/20 p-3">
      <label className="block space-y-1 text-sm"><span className="font-medium">Method for everyone</span>
        <select className={`${salarySelectClass} w-44`} value={bulkMethod} disabled={controlsDisabled} onChange={(e) => setBulkMethod(e.target.value as SalaryPaymentMethod | "")}>
          <option value="">Keep as is</option>
          {SALARY_PAYMENT_METHODS.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
        </select>
      </label>
      <label className="block min-w-56 flex-1 space-y-1 text-sm"><span className="font-medium">From account for everyone</span>
        <select className={salarySelectClass} value={bulkAccount} disabled={controlsDisabled} onChange={(e) => setBulkAccount(e.target.value)}>
          <option value="">Keep as is</option>
          {accounts.map((account) => <option key={account.key} value={account.key}>{account.accountTitle} · {account.accountNumber}</option>)}
        </select>
      </label>
      <Button type="button" variant="outline" disabled={controlsDisabled || (!bulkMethod && !bulkAccount)} onClick={applyToAll}>Apply to all</Button>
    </div>}
    {/* Rows wrap instead of being a wide table, so nothing scrolls sideways. */}
    <div className="divide-y rounded-lg border">{rows.map((row) => {
      const payment = paymentOf(row), needsDate = salaryPaymentRequiresChequeDate(payment.method);
      const name = row.profile.personal.fullName;
      return <div key={row.id} className="grid items-start gap-3 p-3 md:grid-cols-2 2xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="break-words font-medium">{name}</p>
            <p className="mt-1 text-sm font-semibold">{salaryMoney(row.calculation.net, run.currency)}</p>
            {payment.rtgsSerialNo && <p className="mt-1 text-xs text-muted-foreground">RTGS letter {payment.rtgsSerialNo}</p>}
          </div>
          {run.status === "submitted" && <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${name} from payroll`} disabled={controlsDisabled} onClick={() => onRemove(row)}><Trash2 className="h-4 w-4" /></Button>}
        </div>
        <div className="flex min-w-0 flex-wrap gap-x-4 gap-y-2">{SALARY_PAYMENT_METHODS.map((method) => <label key={method.value} className="flex items-center gap-2 text-sm">
          <Checkbox aria-label={`${method.label} for ${name}`} checked={payment.method === method.value} disabled={controlsDisabled} onCheckedChange={(checked) => change(row, { method: checked === true ? method.value : null })} />{method.label}
        </label>)}</div>
        <select aria-label={`From account for ${name}`} className={`${salarySelectClass} min-w-0`} value={payment.fromAccount?.key ?? ""} disabled={controlsDisabled} onChange={(e) => change(row, { fromAccount: accountByKey(e.target.value) })}>
          <option value="">Select account</option>
          {payment.fromAccount && !accounts.some((account) => account.key === payment.fromAccount?.key) && <option value={payment.fromAccount.key}>{payment.fromAccount.accountTitle}</option>}
          {accounts.map((account) => <option key={account.key} value={account.key}>{account.accountTitle} · {account.accountNumber}</option>)}
        </select>
        {payment.method ? <div className="grid min-w-0 gap-2 sm:grid-cols-2">
          <div className="min-w-0">
            <Input aria-label={`Cheque number for ${name}`} aria-invalid={!payment.chequeNumber.trim()} placeholder="Cheque no" className={payment.chequeNumber.trim() ? "" : "border-destructive"} value={payment.chequeNumber} disabled={controlsDisabled} maxLength={60} onChange={(e) => change(row, { chequeNumber: e.target.value })} />
            {payment.method === "transfer" && payment.fromAccount && <p className="mt-1 text-xs text-muted-foreground">Same for this account's transfers</p>}
          </div>
          {needsDate && <Input aria-label={`Cheque date for ${name}`} aria-invalid={!payment.chequeDate} className={`min-w-0 ${payment.chequeDate ? "" : "border-destructive"}`} type="date" value={payment.chequeDate} disabled={controlsDisabled} onChange={(e) => change(row, { chequeDate: e.target.value })} />}
        </div> : <p className="text-sm text-muted-foreground">Choose a method</p>}
      </div>;
    })}</div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={!lettersOpen || unsaved || disabled || !pendingRtgs.length} onClick={() => setRtgsOpen(true)}><Landmark className="mr-2 h-4 w-4" />Create RTGS letters ({pendingRtgs.length})</Button>
        {transferAccounts.map((account) => <Button key={account.key} type="button" variant="outline" disabled={!lettersOpen || unsaved || disabled} onClick={() => setTransferAccount(account)}><FileText className="mr-2 h-4 w-4" />Transfer letter · {account.accountTitle} ({transferRowsFor(rows, account.key).length})</Button>)}
      </div>
      {editable && <Button type="button" disabled={!unsaved || controlsDisabled} onClick={() => void save()}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save payment details</Button>}
    </div>
    {!lettersOpen && <p className="text-xs text-muted-foreground">RTGS and transfer letters can be created after payroll is approved.</p>}
    {lettersOpen && unsaved && <p className="text-xs text-muted-foreground">Save the payment details to create letters.</p>}
    {rows.some((row) => salaryPaymentIssues(row.payment).length > 0) && <p className="text-xs text-muted-foreground">Payment can only be recorded once every employee has complete payment details.</p>}
    {rtgsOpen && <SalaryRtgsDialog run={run} rows={pendingRtgs} accounts={accounts} onClose={() => setRtgsOpen(false)} />}
    {transferAccount && <SalaryTransferLetterEditor run={run} account={transferAccount} rows={transferRowsFor(rows, transferAccount.key)} onClose={() => setTransferAccount(null)} />}
  </CardContent></Card>;
}
