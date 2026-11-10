import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { fetchSignatures, splitDisplayName, type RtgsFromAccount, type RtgsSignature } from "@/components/RTGS/rtgsData";
import { SalaryField } from "@/components/salary/SalaryForms";
import { createSalaryRtgsLetters } from "@/lib/salaryLetters";
import type { SalaryEmployee, SalaryRun } from "@/lib/salaryModel";
import { amountInWords, rtgsDraftFor, rtgsDraftIssues, type SalaryRtgsDraft } from "@/lib/salaryPayment";

const errorText = (e: unknown) => e instanceof Error ? e.message : "Something went wrong. Please try again.";
const toSignatory = (record: RtgsSignature) => ({
  id: record.id, name: record.name, designation: record.designation || "No Designation", company: record.company || "No Company",
  contact: `${record.phoneNumber || "No Phone"} | ${record.email || "No Email"}`,
});

export default function SalaryRtgsDialog({ run, rows, accounts, onClose }: { run: SalaryRun; rows: SalaryEmployee[]; accounts: RtgsFromAccount[]; onClose: () => void }) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<SalaryRtgsDraft[]>(() => rows.map(rtgsDraftFor));
  const [signatures, setSignatures] = useState<RtgsSignature[]>([]), [signerIds, setSignerIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false), [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchSignatures()
      .then((list) => { if (active) { setSignatures(list); setSignerIds(list.slice(0, 1).map((item) => item.id)); } })
      .catch((e) => { if (active) setError(`Could not load authorizers. ${errorText(e)}`); });
    return () => { active = false; };
  }, []);

  const accountFor = (userId: string) => {
    const key = rows.find((row) => row.userId === userId)?.payment?.fromAccount?.key;
    return accounts.find((account) => account.key === key);
  };
  const update = (userId: string, values: Partial<SalaryRtgsDraft>) => setDrafts((list) => list.map((draft) => draft.userId === userId ? { ...draft, ...values } : draft));
  const updateTo = (draft: SalaryRtgsDraft, values: Partial<SalaryRtgsDraft["to"]>) => update(draft.userId, { to: { ...draft.to, ...values } });
  const problems = drafts.flatMap((draft) => {
    const missing = rtgsDraftIssues(draft);
    if (!accountFor(draft.userId)) missing.push("From account is no longer in the account list");
    return missing.length ? [`${draft.employeeName}: ${missing.join(", ")}`] : [];
  });
  const ready = !problems.length && signerIds.length > 0 && !!drafts.length;

  async function create() {
    setSaving(true); setError("");
    try {
      await createSalaryRtgsLetters(drafts.map((draft) => ({ draft, account: accountFor(draft.userId)! })), {
        runId: run.id,
        signatories: signatures.filter((item) => signerIds.includes(item.id)).map(toSignatory),
        actor: splitDisplayName(userProfile?.displayName),
        // Drop each letter as it's made, so a retry after a failure can't repeat it.
        onCreated: (userId) => setDrafts((list) => list.filter((draft) => draft.userId !== userId)),
      });
      toast({ title: "RTGS letters created", description: "Find them in the RTGS List to print or download." });
      onClose();
    } catch (e) { setError(errorText(e)); } finally { setSaving(false); }
  }

  return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
    <DialogContent className="max-h-[90dvh] max-w-4xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Create RTGS letters</DialogTitle>
        <DialogDescription>One letter per employee, filled in from their bank details. Check and edit anything before creating them. Letters are saved to the RTGS List with the next serial numbers.</DialogDescription>
      </DialogHeader>
      <div>
        <div className="space-y-2"><p className="text-sm font-medium">Authorizers</p>
          {signatures.map((signature) => <label key={signature.id} className="flex items-center gap-2 text-sm">
            <Checkbox checked={signerIds.includes(signature.id)} disabled={saving} onCheckedChange={(checked) => setSignerIds((ids) => checked === true ? [...ids, signature.id] : ids.filter((id) => id !== signature.id))} />
            {signature.name}{signature.designation ? ` · ${signature.designation}` : ""}
          </label>)}
          {!signatures.length && <p className="text-sm text-muted-foreground">No authorizers found. Add one under RTGS → Authorizers.</p>}
        </div>
      </div>
      <div className="space-y-4">{drafts.map((draft) => <div key={draft.userId} className="space-y-3 rounded-lg border p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-medium">{draft.employeeName}</h3>
          <p className="text-xs text-muted-foreground">From {accountFor(draft.userId)?.accountTitle ?? "unknown account"}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <SalaryField label="Account title"><Input value={draft.to.accountTitle} disabled={saving} onChange={(e) => updateTo(draft, { accountTitle: e.target.value })} /></SalaryField>
          <SalaryField label="IBAN / account number"><Input value={draft.to.accountNo} disabled={saving} onChange={(e) => updateTo(draft, { accountNo: e.target.value })} /></SalaryField>
          <SalaryField label="Bank"><Input value={draft.to.bank} disabled={saving} onChange={(e) => updateTo(draft, { bank: e.target.value })} /></SalaryField>
          <SalaryField label="Branch"><Input value={draft.to.branch} disabled={saving} onChange={(e) => updateTo(draft, { branch: e.target.value })} /></SalaryField>
          <SalaryField label="Mobile number"><Input value={draft.to.mobileNumber} disabled={saving} onChange={(e) => updateTo(draft, { mobileNumber: e.target.value })} /></SalaryField>
          <SalaryField label="Address"><Input value={draft.to.address} disabled={saving} onChange={(e) => updateTo(draft, { address: e.target.value })} /></SalaryField>
          <SalaryField label="Amount"><Input type="number" min={0} step="any" value={draft.amount} disabled={saving} onChange={(e) => { const amount = Number(e.target.value); update(draft.userId, { amount, inWords: amount > 0 ? amountInWords(amount) : "" }); }} /></SalaryField>
          <SalaryField label="Cheque number"><Input value={draft.chequeNumber} disabled={saving} className={draft.chequeNumber.trim() ? "" : "border-destructive"} onChange={(e) => update(draft.userId, { chequeNumber: e.target.value })} /></SalaryField>
          <SalaryField label="Date"><Input value={draft.date} disabled={saving} className={draft.date.trim() ? "" : "border-destructive"} onChange={(e) => update(draft.userId, { date: e.target.value })} /></SalaryField>
          <div className="sm:col-span-2"><SalaryField label="Amount in words"><Input value={draft.inWords} disabled={saving} onChange={(e) => update(draft.userId, { inWords: e.target.value })} /></SalaryField></div>
        </div>
      </div>)}</div>
      {problems.length > 0 && <div role="status" className="space-y-1 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200"><p className="font-medium">Still needed</p>{problems.map((problem) => <p key={problem}>{problem}</p>)}</div>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button type="button" variant="outline" disabled={saving} onClick={onClose}>Close</Button>
        <Button type="button" disabled={saving || !ready} onClick={() => void create()}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create {drafts.length} letter{drafts.length === 1 ? "" : "s"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
