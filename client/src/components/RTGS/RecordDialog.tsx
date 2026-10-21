import { useEffect, useRef, useState } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Loader2, Plus, Printer, Trash2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LetterFrame, { type LetterFrameHandle } from "./LetterFrame";
import { createdByName, type RtgsRecord } from "./rtgsData";
import { printLetter, recordLetterHTML } from "./rtgsLetter";
import { formatRs } from "./rtgsPayables";

type Mode = "preview" | "fields" | "html";

interface RecordDialogProps {
  record: RtgsRecord | null;
  accountLabel: string;
  onClose: () => void;
  onUpdated: (record: RtgsRecord) => void;
}

const FROM_FIELDS: Array<[keyof NonNullable<RtgsRecord["from"]>, string]> = [
  ["accountTitle", "Account Title"],
  ["accountNumber", "Account Number"],
  ["bank", "Bank"],
  ["branch", "Branch"],
  ["city", "City"],
  ["chequeNumber", "Cheque Number"],
  ["amount", "Amount"],
  ["inWords", "Amount in Words"],
];

const TO_FIELDS: Array<[keyof NonNullable<RtgsRecord["to"]>, string]> = [
  ["accountTitle", "Account Title"],
  ["accountNo", "Account / IBAN Number"],
  ["address", "Address"],
  ["mobileNumber", "Mobile Number"],
  ["bank", "Bank"],
  ["branch", "Branch"],
];

const SIGNATORY_FIELDS = [
  ["name", "Name"],
  ["designation", "Designation"],
  ["company", "Company"],
  ["contact", "Contact"],
] as const;

const cloneForEditing = (record: RtgsRecord): RtgsRecord => ({
  ...record,
  from: { ...record.from },
  to: { ...record.to },
  signatories: (record.signatories || []).map((signatory) => ({ ...signatory })),
});

/** View, print and edit one saved letter (fields or letter text). */
export default function RecordDialog({ record, accountLabel, onClose, onUpdated }: RecordDialogProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("preview");
  const [draft, setDraft] = useState<RtgsRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<LetterFrameHandle>(null);

  useEffect(() => {
    setDraft(record ? cloneForEditing(record) : null);
    setMode("preview");
  }, [record]);

  if (!record || !draft) return null;

  const setTop = (field: "serialNo" | "date" | "prefix", value: string) =>
    setDraft((previous) => (previous ? { ...previous, [field]: value } : previous));

  const setSection = (section: "from" | "to", field: string, value: string) =>
    setDraft((previous) =>
      previous ? { ...previous, [section]: { ...(previous[section] || {}), [field]: value } } : previous,
    );

  const setSignatory = (index: number, field: (typeof SIGNATORY_FIELDS)[number][0], value: string) =>
    setDraft((previous) => {
      if (!previous) return previous;
      const signatories = [...(previous.signatories || [])];
      if (!signatories[index]) return previous;
      signatories[index] = { ...signatories[index], [field]: value };
      return { ...previous, signatories };
    });

  const addSignatory = () =>
    setDraft((previous) =>
      previous
        ? {
            ...previous,
            signatories: [
              ...(previous.signatories || []),
              { id: `new-${Date.now()}`, name: "", designation: "", company: "", contact: "" },
            ],
          }
        : previous,
    );

  const removeSignatory = (index: number) =>
    setDraft((previous) =>
      previous
        ? { ...previous, signatories: (previous.signatories || []).filter((_, i) => i !== index) }
        : previous,
    );

  const missingSource = () => {
    if (record.sourceCollection) return false;
    toast({ title: "This record's location is unknown, so it can't be updated.", variant: "destructive" });
    return true;
  };

  // Field edits clear the stored letter so preview/print rebuild it from the
  // updated fields (same as the original app). Creator info is never changed.
  const saveFields = async () => {
    if (missingSource()) return;
    setSaving(true);
    try {
      const changes = {
        serialNo: draft.serialNo || "",
        date: draft.date || "",
        prefix: draft.prefix || "",
        from: draft.from || {},
        to: draft.to || {},
        signatories: draft.signatories || [],
        letterHTML: "",
      };
      await updateDoc(doc(db, record.sourceCollection!, record.id), {
        ...changes,
        updatedAt: serverTimestamp(),
      });
      onUpdated({ ...record, ...changes, updatedAt: new Date() });
      setMode("preview");
      toast({ title: "RTGS record updated" });
    } catch (error) {
      console.error("Record update failed:", error);
      toast({ title: "Failed to update the RTGS record", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const saveHtml = async () => {
    if (missingSource() || !editorRef.current) return;
    const letterHTML = editorRef.current.getHTML();
    setSaving(true);
    try {
      await updateDoc(doc(db, record.sourceCollection!, record.id), {
        letterHTML,
        updatedAt: serverTimestamp(),
      });
      onUpdated({ ...record, letterHTML, updatedAt: new Date() });
      setMode("preview");
      toast({ title: "Letter text updated" });
    } catch (error) {
      console.error("HTML update failed:", error);
      toast({ title: "Failed to update the letter", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (!printLetter(recordLetterHTML(record))) {
      toast({ title: "Please allow pop-ups to print the letter.", variant: "destructive" });
    }
  };

  const linkedPayments = record.linkedPayments || [];

  const field = (label: string, value: string | undefined, onChange: (value: string) => void) => (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input className="rounded-xl" value={value || ""} onChange={(event) => onChange(event.target.value)} />
    </div>
  );

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {record.serialNo || record.id}
            <Badge variant="secondary">{accountLabel}</Badge>
          </DialogTitle>
          <DialogDescription>
            {record.date || "No date"} · Created by {createdByName(record)}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
          <TabsList>
            <TabsTrigger value="preview" disabled={saving}>Preview</TabsTrigger>
            <TabsTrigger value="fields" disabled={saving}>Edit Fields</TabsTrigger>
            <TabsTrigger value="html" disabled={saving}>Edit Letter Text</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-4 space-y-4">
            {record.transfer && (
              <section className="space-y-1 rounded-2xl border p-3 text-sm">
                <h3 className="font-semibold">Account to account transfer</h3>
                <p>
                  {formatRs(record.transfer.amount)} from {record.transfer.fromAccountName} to{" "}
                  {record.transfer.toAccountName}
                </p>
              </section>
            )}
            {linkedPayments.length > 0 && (
              <section className="space-y-2 rounded-2xl border p-3">
                <h3 className="text-sm font-semibold">
                  Paid with this letter
                  {record.projectCode ? ` · Project ${record.projectCode}` : ""}
                  {record.paymentAccountName ? ` · ${record.paymentAccountName}` : ""}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs text-muted-foreground">
                      <tr>
                        <th className="py-1 pr-3 font-medium">Item</th>
                        <th className="py-1 pr-3 font-medium">Vendor</th>
                        <th className="py-1 pr-3 text-right font-medium">Outstanding</th>
                        <th className="py-1 pr-3 text-right font-medium">Paid</th>
                        <th className="py-1 text-right font-medium">Left Outstanding</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linkedPayments.map((payment) => (
                        <tr key={payment.releaseId} className="border-t">
                          <td className="py-1.5 pr-3">
                            <span className="text-muted-foreground">
                              {payment.kind === "budget_request" ? "Budget Request" : "PO"}
                            </span>{" "}
                            {payment.number}
                          </td>
                          <td className="py-1.5 pr-3">{payment.vendorName || "-"}</td>
                          <td className="py-1.5 pr-3 text-right">{formatRs(payment.outstandingBefore)}</td>
                          <td className="py-1.5 pr-3 text-right">{formatRs(payment.amount)}</td>
                          <td className="py-1.5 text-right">{formatRs(payment.outstandingAfter)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
            <LetterFrame html={recordLetterHTML(record)} className="mx-auto max-w-2xl" />
          </TabsContent>

          <TabsContent value="fields" className="mt-4 space-y-6">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Document Information</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Firebase Document ID</Label>
                  <Input className="rounded-xl bg-muted/40" value={record.id} readOnly />
                </div>
                {field("Document Number", draft.serialNo, (value) => setTop("serialNo", value))}
                {field("Prefix", draft.prefix, (value) => setTop("prefix", value))}
                {field("Date", draft.date, (value) => setTop("date", value))}
                <div className="space-y-1.5">
                  <Label className="text-xs">Created By</Label>
                  <Input
                    className="rounded-xl bg-muted/40"
                    value={createdByName(record)}
                    readOnly
                    disabled
                    title="Created By cannot be edited"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">From Account</h3>
              {linkedPayments.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  This letter paid {linkedPayments.length} budget request / PO item
                  {linkedPayments.length === 1 ? "" : "s"}. Changing the amount here doesn&apos;t change those
                  payments; correct them from Budget Requests or Purchase Orders.
                </p>
              )}
              {record.transfer && (
                <p className="text-xs text-muted-foreground">
                  This letter recorded an account to account transfer. Changing the amount here doesn&apos;t change
                  that transfer or the account balances.
                </p>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {FROM_FIELDS.map(([key, label]) => (
                  <div key={key}>{field(label, draft.from?.[key], (value) => setSection("from", key, value))}</div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">To Account</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {TO_FIELDS.map(([key, label]) => (
                  <div key={key}>{field(label, draft.to?.[key], (value) => setSection("to", key, value))}</div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Signatories</h3>
                <Button size="sm" variant="outline" className="rounded-xl" onClick={addSignatory}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Signatory
                </Button>
              </div>
              {(draft.signatories || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No signatories added.</p>
              ) : (
                (draft.signatories || []).map((signatory, index) => (
                  <div key={signatory.id || index} className="space-y-3 rounded-2xl border p-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {SIGNATORY_FIELDS.map(([key, label]) => (
                        <div key={key}>
                          {field(label, signatory[key], (value) => setSignatory(index, key, value))}
                        </div>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeSignatory(index)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Remove Signatory
                    </Button>
                  </div>
                ))
              )}
            </section>
          </TabsContent>

          <TabsContent value="html" className="mt-4 space-y-2">
            <p className="text-xs text-muted-foreground">
              Click into the letter and edit the text directly. Saving keeps your exact wording for printing.
            </p>
            <LetterFrame
              ref={editorRef}
              html={recordLetterHTML(record)}
              editable
              className="mx-auto max-w-2xl"
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" className="rounded-xl" onClick={handlePrint} disabled={saving}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          {mode === "fields" && (
            <Button className="rounded-xl" onClick={saveFields} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Record
            </Button>
          )}
          {mode === "html" && (
            <Button className="rounded-xl" onClick={saveHtml} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Letter
            </Button>
          )}
          <Button variant="ghost" className="rounded-xl" onClick={onClose} disabled={saving}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
