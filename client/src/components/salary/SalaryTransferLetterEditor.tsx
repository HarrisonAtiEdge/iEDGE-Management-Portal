import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Download, Loader2, Plus, Printer, RotateCcw, Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchSignatures, letterDate, type RtgsSignature } from "@/components/RTGS/rtgsData";
import { downloadLetterPdf, printLetter } from "@/components/RTGS/rtgsLetter";
import { salaryMoney } from "@/components/salary/salaryExports";
import { salarySelectClass } from "@/components/salary/SalaryForms";
import type { SalaryEmployee, SalaryRun } from "@/lib/salaryModel";
import {
  buildTransferLetterHTML, defaultTransferLetter, payrollTransferTotal, syncTransferTotals, transferLetterTotal,
  type SalaryFromAccount, type SalaryTransferLetter,
} from "@/lib/salaryPayment";
import { fetchSalaryTransferLetter, saveSalaryTransferLetter } from "@/lib/salaryService";

const errorText = (e: unknown) => e instanceof Error ? e.message : "Something went wrong. Please try again.";
const newRowId = () => `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const inPlace = "w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-black outline-none hover:border-slate-300 focus:border-slate-500";

// Looks like the printed letter, but every piece of text can be typed over.
function Text({ value, onChange, label, className = "" }: { value: string; onChange: (value: string) => void; label: string; className?: string }) {
  return <input aria-label={label} className={`${inPlace} ${className}`} value={value} onChange={(event) => onChange(event.target.value)} />;
}
function Detail({ label, children }: { label: string; children: ReactNode }) {
  return <div className="grid grid-cols-[130px_1fr] items-center gap-2"><span className="font-bold">{label}</span>{children}</div>;
}

export default function SalaryTransferLetterEditor({ run, account, rows, onClose }: { run: SalaryRun; account: SalaryFromAccount; rows: SalaryEmployee[]; onClose: () => void }) {
  const { toast } = useToast();
  const [letter, setLetter] = useState<SalaryTransferLetter | null>(null);
  const [signatures, setSignatures] = useState<RtgsSignature[]>([]);
  const [saving, setSaving] = useState(false), [downloading, setDownloading] = useState(false), [error, setError] = useState("");
  const payrollTotal = useMemo(() => payrollTransferTotal(rows), [rows]);

  useEffect(() => {
    let active = true;
    Promise.all([fetchSalaryTransferLetter(run.id, account.key), fetchSignatures().catch(() => [] as RtgsSignature[])])
      .then(([saved, list]) => {
        if (!active) return;
        setSignatures(list);
        setLetter(saved ?? defaultTransferLetter(rows, account, letterDate(), list[0]));
      })
      .catch((e) => { if (active) setError(errorText(e)); });
    return () => { active = false; };
    // Load once when opened; later payroll changes are offered through Rebuild.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run.id, account.key]);

  const patch = (values: Partial<SalaryTransferLetter>) => setLetter((current) => current && { ...current, ...values });
  const changeRows = (next: SalaryTransferLetter["rows"]) => setLetter((current) => current && syncTransferTotals({ ...current, rows: next }));
  const field = (key: keyof SalaryTransferLetter) => ({ value: String(letter?.[key] ?? ""), onChange: (value: string) => patch({ [key]: value }) });

  async function save() {
    if (!letter) return;
    setSaving(true); setError("");
    try { await saveSalaryTransferLetter(run.id, account.key, letter); toast({ title: "Transfer letter saved" }); }
    catch (e) { setError(errorText(e)); } finally { setSaving(false); }
  }
  function print() {
    if (letter && !printLetter(buildTransferLetterHTML(letter))) setError("Allow pop-ups for this site to print the letter.");
  }
  async function download() {
    if (!letter) return;
    setDownloading(true); setError("");
    try { await downloadLetterPdf(buildTransferLetterHTML(letter), `Salary Transfer - ${account.accountTitle} - ${run.month}.pdf`); }
    catch (e) { setError(errorText(e)); } finally { setDownloading(false); }
  }
  function rebuild() {
    if (window.confirm("Rebuild this letter from the payroll? Your edits to it will be replaced.")) setLetter(defaultTransferLetter(rows, account, letterDate(), signatures[0]));
  }
  function chooseSigner(id: string) {
    const signer = signatures.find((item) => item.id === id);
    if (signer) patch({ signatoryName: signer.name, signatoryDesignation: signer.designation, signatoryCompany: signer.company });
  }
  const total = letter ? transferLetterTotal(letter) : 0;

  return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
    <DialogContent className="max-h-[95dvh] max-w-4xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Salary transfer letter</DialogTitle>
        <DialogDescription>{run.month} · {account.accountTitle}. Click any text to change it. Add a row to split an employee across two accounts.</DialogDescription>
      </DialogHeader>
      {!letter ? (error ? <p role="alert" className="text-sm text-destructive">{error}</p> : <p role="status" className="flex items-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading letter…</p>) : <>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" disabled={saving} onClick={() => void save()}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save</Button>
          <Button type="button" variant="outline" onClick={print}><Printer className="mr-2 h-4 w-4" />Print</Button>
          <Button type="button" variant="outline" disabled={downloading} onClick={() => void download()}>{downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}PDF</Button>
          <Button type="button" variant="ghost" onClick={rebuild}><RotateCcw className="mr-2 h-4 w-4" />Rebuild from payroll</Button>
          {signatures.length > 0 && <select aria-label="Choose signatory" className={`${salarySelectClass} ml-auto w-56`} value="" onChange={(e) => chooseSigner(e.target.value)}>
            <option value="">Choose signatory…</option>
            {signatures.map((signature) => <option key={signature.id} value={signature.id}>{signature.name}</option>)}
          </select>}
        </div>
        {total !== payrollTotal && <p role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">This letter totals {salaryMoney(total, run.currency)}, but payroll shows {salaryMoney(payrollTotal, run.currency)} for these employees.</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="space-y-1 rounded border bg-white p-8 text-sm text-black shadow-sm">
          <div className="flex items-center gap-1"><span className="font-bold">Dated:</span><Text label="Date" {...field("date")} /></div>
          <div className="pt-3 font-bold">
            <Text label="Addressee" {...field("addressee")} className="font-bold" />
            <Text label="Bank" {...field("bank")} className="font-bold" />
            <Text label="City" {...field("city")} className="font-bold" />
          </div>
          <Text label="Subject" {...field("subject")} className="py-2 text-center font-bold underline" />
          <Text label="Salutation" {...field("salutation")} />
          <textarea aria-label="Introduction" rows={2} className={inPlace} value={letter.intro} onChange={(e) => patch({ intro: e.target.value })} />
          <Text label="From heading" {...field("fromHeading")} className="font-bold underline" />
          <div className="space-y-1 pl-3">
            <Detail label="Account Title:"><Text label="From account title" {...field("accountTitle")} /></Detail>
            <Detail label="Account Number:"><Text label="From account number" {...field("accountNumber")} /></Detail>
            <Detail label="Bank:"><Text label="From bank" {...field("fromBank")} /></Detail>
            <Detail label="Branch:"><Text label="From branch" {...field("branch")} /></Detail>
            <Detail label="Amount:"><Text label="Amount" {...field("amount")} /></Detail>
            <Detail label="Cheque number:"><Text label="Cheque number" {...field("chequeNumber")} /></Detail>
            <Detail label="In Words:"><Text label="Amount in words" {...field("inWords")} /></Detail>
          </div>
          <Text label="To heading" {...field("toHeading")} className="font-bold underline" />
          <table className="w-full border-collapse">
            <thead><tr className="bg-slate-100">
              <th className="w-16 border border-black"><Text label="Serial column heading" {...field("serialHeader")} className="text-center font-bold" /></th>
              <th className="border border-black"><Text label="Title column heading" {...field("titleHeader")} className="font-bold" /></th>
              <th className="border border-black"><Text label="Account column heading" {...field("accountHeader")} className="font-bold" /></th>
              <th className="w-32 border border-black"><Text label="Amount column heading" {...field("amountHeader")} className="text-right font-bold" /></th>
              <th className="w-9" />
            </tr></thead>
            <tbody>
              {letter.rows.map((row, index) => <tr key={row.id}>
                <td className="border border-black text-center">{index + 1}</td>
                <td className="border border-black"><Text label={`Account title, row ${index + 1}`} value={row.accountTitle} onChange={(accountTitle) => changeRows(letter.rows.map((item) => item.id === row.id ? { ...item, accountTitle } : item))} /></td>
                <td className="border border-black"><Text label={`Account number, row ${index + 1}`} value={row.accountNumber} onChange={(accountNumber) => changeRows(letter.rows.map((item) => item.id === row.id ? { ...item, accountNumber } : item))} /></td>
                <td className="border border-black"><input aria-label={`Amount, row ${index + 1}`} className={`${inPlace} text-right`} type="number" min={0} step="any" value={row.amount} onChange={(e) => { const amount = Math.max(0, Number(e.target.value) || 0); changeRows(letter.rows.map((item) => item.id === row.id ? { ...item, amount } : item)); }} /></td>
                <td className="text-center"><Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label={`Remove row ${index + 1}`} onClick={() => changeRows(letter.rows.filter((item) => item.id !== row.id))}><Trash2 className="h-3.5 w-3.5" /></Button></td>
              </tr>)}
              <tr>
                <td colSpan={3} className="border border-black px-2 text-right font-bold">Total</td>
                <td className="border border-black"><Text label="Total" {...field("totalText")} className="text-right font-bold" /></td>
              </tr>
              <tr><td colSpan={4} className="border border-black px-2 text-center font-bold">{letter.inWords}</td></tr>
            </tbody>
          </table>
          <Button type="button" variant="outline" size="sm" className="mt-2 border-slate-300 bg-white text-black hover:bg-slate-100" onClick={() => changeRows([...letter.rows, { id: newRowId(), accountTitle: "", accountNumber: "", amount: 0 }])}><Plus className="mr-2 h-4 w-4" />Add row</Button>
          <div className="pt-3">
            <Text label="Closing" {...field("closing")} />
            <Text label="Regards" {...field("regards")} />
          </div>
          <div className="w-72 pt-8">
            <div className="border-t border-black pt-1"><Text label="Signatory name" {...field("signatoryName")} className="font-bold" /></div>
            <Text label="Signatory designation" {...field("signatoryDesignation")} />
            <Text label="Signatory company" {...field("signatoryCompany")} />
          </div>
        </div>
      </>}
    </DialogContent>
  </Dialog>;
}
