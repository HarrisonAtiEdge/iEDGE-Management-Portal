import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { DocumentReference } from "firebase/firestore";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { localDateValue } from "@/lib/payments/dates";
import {
  fetchPaymentAccounts,
  paymentAccountPickerName,
} from "@/lib/payments/paymentAccounts";
import {
  diffPaymentValues,
  PaymentEditError,
  REIMBURSEMENT_PAYMENT_METHODS,
  savePaymentEdit,
  type PaymentEditEntry,
  type ReimbursementPaymentValues,
} from "@/lib/payments/reimbursementPaymentEdit";
import type { PaymentAccount } from "@/lib/payments/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const NO_ACCOUNT = "none";

const parseChequeNumbers = (value: string) =>
  value
    .split(/[\n,]/g)
    .map((item) => item.trim())
    .filter(Boolean);

const formatEditedAt = (value: any) => {
  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value);

  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : date.toLocaleString("en-PK", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

interface ReimbursementPaymentEditModalProps {
  docRef: DocumentReference;
  /** Meeting updates keep the payment inside `reimbursement`. */
  nested: boolean;
  values: ReimbursementPaymentValues;
  claimant: string;
  approvedAmount: number;
  onClose: () => void;
  onSaved: () => void;
}

/** Corrects a released reimbursement payment and logs what changed. */
export default function ReimbursementPaymentEditModal({
  docRef,
  nested,
  values,
  claimant,
  approvedAmount,
  onClose,
  onSaved,
}: ReimbursementPaymentEditModalProps) {
  const { userProfile, currentUser } = useAuth();
  const { toast } = useToast();

  const [storedAccounts, setStoredAccounts] = useState<PaymentAccount[]>([]);
  const [paymentMethod, setPaymentMethod] = useState(values.paymentMethod);
  const [amount, setAmount] = useState(String(values.amount));
  const [paymentDate, setPaymentDate] = useState(values.paymentDate);
  const [accountId, setAccountId] = useState(values.account?.id || NO_ACCOUNT);
  const [chequeNumbers, setChequeNumbers] = useState(values.chequeNumbers.join(", "));
  const [transactionReference, setTransactionReference] = useState(
    values.transactionReference,
  );
  const [paymentNotes, setPaymentNotes] = useState(values.paymentNotes);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchPaymentAccounts()
      .then((accounts) => {
        if (!cancelled) setStoredAccounts(accounts);
      })
      .catch((error) => {
        console.error("Failed to load payment accounts:", error);
        toast({
          title: "Failed to load payment accounts",
          variant: "destructive",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [toast]);

  // The account already on the payment stays listed even if it's been retired.
  const accounts = useMemo(() => {
    const active = storedAccounts.filter((account) => account.isActive !== false);
    const current = values.account;

    return current && !active.some((account) => account.id === current.id)
      ? [current, ...active]
      : active;
  }, [storedAccounts, values.account]);

  const isCheque = paymentMethod === "cheque";

  const after: ReimbursementPaymentValues = {
    paymentMethod,
    amount: Math.round(Number(amount) * 100) / 100,
    paymentDate,
    account: accounts.find((account) => account.id === accountId) || null,
    chequeNumbers: parseChequeNumbers(chequeNumbers),
    transactionReference: transactionReference.trim(),
    paymentNotes: paymentNotes.trim(),
  };

  const changes = diffPaymentValues(values, after);

  // Same as the release form: only a cheque keeps its account and numbers.
  const handleMethodChange = (value: string) => {
    setPaymentMethod(value);

    if (value !== "cheque") {
      setAccountId(NO_ACCOUNT);
      setChequeNumbers("");
    }
  };

  const validationError = () => {
    if (!paymentMethod) return "Select the payment method.";
    if (!(after.amount > 0)) return "Enter a valid paid amount.";
    if (!paymentDate) return "Select the payment date.";
    if (paymentDate > localDateValue()) return "The payment date can't be in the future.";
    if (isCheque && !after.account) return "Select the account the cheque is drawn on.";
    if (isCheque && after.chequeNumbers.length === 0) {
      return "Enter at least one cheque number.";
    }
    if (changes.length === 0) return "Nothing has changed.";
    if (!reason.trim()) return "Enter the reason for this change.";
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const problem = validationError();

    if (problem) {
      toast({ title: problem, variant: "destructive" });
      return;
    }

    setSaving(true);

    try {
      await savePaymentEdit({
        ref: docRef,
        nested,
        opened: values,
        after,
        reason: reason.trim(),
        actor: {
          id: userProfile?.id || currentUser?.uid || "",
          name:
            userProfile?.displayName ||
            currentUser?.displayName ||
            currentUser?.email ||
            "Unknown",
          email: currentUser?.email || "",
          role: String(userProfile?.role || ""),
        },
      });

      toast({ title: "Payment updated", description: "The change was added to its history." });
      onSaved();
      onClose();
    } catch (error) {
      console.error("Reimbursement payment edit failed:", error);
      toast({
        title: "Payment not updated",
        description:
          error instanceof PaymentEditError ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Released Payment</DialogTitle>
          <DialogDescription>
            {claimant} · Approved Rs {approvedAmount.toLocaleString()}. Account balances and
            statements update with this change.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-paid-amount">Paid Amount</Label>
              <Input
                id="edit-paid-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-payment-date">Payment Date</Label>
              <Input
                id="edit-payment-date"
                type="date"
                max={localDateValue()}
                value={paymentDate}
                onChange={(event) => setPaymentDate(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={handleMethodChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {REIMBURSEMENT_PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_ACCOUNT}>No account</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {paymentAccountPickerName(account)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(isCheque || chequeNumbers) && (
            <div className="space-y-1.5">
              <Label htmlFor="edit-cheque-numbers">Cheque Numbers</Label>
              <Input
                id="edit-cheque-numbers"
                value={chequeNumbers}
                onChange={(event) => setChequeNumbers(event.target.value)}
                placeholder="Separate several numbers with commas"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="edit-transaction-reference">Transaction Reference</Label>
            <Input
              id="edit-transaction-reference"
              value={transactionReference}
              onChange={(event) => setTransactionReference(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-payment-notes">Payment Notes</Label>
            <Textarea
              id="edit-payment-notes"
              rows={2}
              value={paymentNotes}
              onChange={(event) => setPaymentNotes(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-reason">Reason for Change</Label>
            <Textarea
              id="edit-reason"
              rows={2}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Why is this payment being corrected?"
            />
          </div>

          {changes.length > 0 && (
            <div className="rounded-xl border bg-muted/40 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Will be saved to the history
              </p>
              <PaymentChangeList changes={changes} />
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PaymentChangeList({ changes }: { changes: PaymentEditEntry["changes"] }) {
  return (
    <ul className="space-y-1.5 text-sm">
      {changes.map((change) => (
        <li key={change.field}>
          <span className="text-muted-foreground">{change.label}: </span>
          <span className="break-words">{change.from}</span>
          <ArrowRight className="mx-1 inline h-3 w-3 text-muted-foreground" />
          <span className="break-words font-medium">{change.to}</span>
        </li>
      ))}
    </ul>
  );
}

/** Every correction to a released payment, newest first. */
export function PaymentEditHistory({
  entries,
  releasedBy,
}: {
  entries: PaymentEditEntry[];
  releasedBy?: string;
}) {
  return (
    <div className="rounded-xl border p-3">
      <p className="text-xs text-muted-foreground">Payment Change History</p>

      {entries.length === 0 ? (
        <p className="mt-1 text-sm text-foreground">
          No changes since the payment was released.
        </p>
      ) : (
        <ol className="mt-2 space-y-3">
          {[...entries].reverse().map((entry) => (
            <li key={entry.id} className="border-t pt-3 first:border-t-0 first:pt-0">
              <p className="text-sm font-medium text-foreground">
                {entry.editedByName || "Unknown"}
              </p>
              <p className="text-xs text-muted-foreground">{formatEditedAt(entry.editedAt)}</p>
              <div className="mt-2">
                <PaymentChangeList changes={entry.changes || []} />
              </div>
              <p className="mt-2 text-sm text-foreground">
                <span className="text-muted-foreground">Reason: </span>
                {entry.reason}
              </p>
            </li>
          ))}
        </ol>
      )}

      {releasedBy && (
        <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
          Originally released by {releasedBy}
        </p>
      )}
    </div>
  );
}
