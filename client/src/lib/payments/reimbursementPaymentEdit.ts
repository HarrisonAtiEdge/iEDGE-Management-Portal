// Corrections to a reimbursement payment after Finance has released it.
//
// Account balances and statements are calculated from these same fields (see
// getAccountReleaseEntries), so a correction reaches them with no other write.
// Every correction is logged on the record in paymentEditHistory, in the same
// transaction as the change, so neither can be saved without the other.
import {
  arrayUnion,
  deleteField,
  runTransaction,
  serverTimestamp,
  type DocumentReference,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { localDateValue, paymentMomentFor } from "@/lib/payments/dates";
import { paymentAccountPickerName } from "@/lib/payments/paymentAccounts";
import type { PaymentAccount } from "@/lib/payments/types";

export const REIMBURSEMENT_PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "wire", label: "Online Transfer" },
];

export interface ReimbursementPaymentValues {
  paymentMethod: string;
  amount: number;
  /** YYYY-MM-DD */
  paymentDate: string;
  account: PaymentAccount | null;
  chequeNumbers: string[];
  transactionReference: string;
  paymentNotes: string;
}

export interface PaymentEditChange {
  field: keyof ReimbursementPaymentValues;
  label: string;
  from: string;
  to: string;
}

export interface PaymentEditActor {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface PaymentEditEntry {
  id: string;
  editedAt: any;
  editedBy: string;
  editedByName: string;
  editedByEmail: string;
  editedByRole: string;
  reason: string;
  changes: PaymentEditChange[];
}

/** Shown to the user as is; nothing was saved. */
export class PaymentEditError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentEditError";
  }
}

const NOT_SET = "Not set";

const toDate = (value: any): Date | null => {
  if (!value) return null;
  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const methodLabel = (value: string) =>
  REIMBURSEMENT_PAYMENT_METHODS.find((method) => method.value === value)?.label ||
  value ||
  NOT_SET;

const amountLabel = (value: number) =>
  `Rs ${value.toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;

const dayLabel = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value || NOT_SET;

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).toLocaleDateString(
    "en-PK",
    { day: "2-digit", month: "short", year: "numeric" },
  );
};

const accountLabel = (account: PaymentAccount | null) => {
  if (!account) return "No account";

  const name = paymentAccountPickerName(account);
  return account.accountNumber ? `${name} (${account.accountNumber})` : name;
};

/** The payment as saved on a claim, or on a meeting update's `reimbursement`. */
export function readPaymentValues(source: any): ReimbursementPaymentValues {
  const releasedAt = toDate(source?.paymentReleasedAt);
  const chequeNumbers: any[] = Array.isArray(source?.chequeNumbers)
    ? source.chequeNumbers
    : [source?.chequeNumber];

  return {
    paymentMethod: String(source?.paymentType || ""),
    amount: Number(
      source?.paidAmount ??
        source?.approvedAmount ??
        source?.claimAmount ??
        source?.amount ??
        0,
    ),
    paymentDate: String(
      source?.paymentDate || (releasedAt ? localDateValue(releasedAt) : ""),
    ),
    account: source?.selectedAccount?.id ? source.selectedAccount : null,
    chequeNumbers: chequeNumbers
      .map((value) => String(value ?? "").trim())
      .filter(Boolean),
    transactionReference: String(source?.transactionReference || ""),
    paymentNotes: String(source?.paymentNotes || ""),
  };
}

export const getPaymentEditHistory = (source: any): PaymentEditEntry[] =>
  Array.isArray(source?.paymentEditHistory) ? source.paymentEditHistory : [];

export function diffPaymentValues(
  before: ReimbursementPaymentValues,
  after: ReimbursementPaymentValues,
): PaymentEditChange[] {
  const fields: Array<[keyof ReimbursementPaymentValues, string, string, string]> = [
    ["amount", "Paid Amount", amountLabel(before.amount), amountLabel(after.amount)],
    [
      "paymentMethod",
      "Payment Method",
      methodLabel(before.paymentMethod),
      methodLabel(after.paymentMethod),
    ],
    ["paymentDate", "Payment Date", dayLabel(before.paymentDate), dayLabel(after.paymentDate)],
    ["account", "Account", accountLabel(before.account), accountLabel(after.account)],
    [
      "chequeNumbers",
      "Cheque Numbers",
      before.chequeNumbers.join(", ") || NOT_SET,
      after.chequeNumbers.join(", ") || NOT_SET,
    ],
    [
      "transactionReference",
      "Transaction Reference",
      before.transactionReference || NOT_SET,
      after.transactionReference || NOT_SET,
    ],
    ["paymentNotes", "Payment Notes", before.paymentNotes || NOT_SET, after.paymentNotes || NOT_SET],
  ];

  return fields
    .filter(([field, , from, to]) =>
      // Two accounts can share a label, so accounts are compared by id.
      field === "account"
        ? (before.account?.id || "") !== (after.account?.id || "")
        : from !== to,
    )
    .map(([field, label, from, to]) => ({ field, label, from, to }));
}

/** The Firestore update for a correction, or null when nothing changed. */
export function buildPaymentEditUpdate({
  before,
  after,
  reason,
  actor,
  nested,
}: {
  before: ReimbursementPaymentValues;
  after: ReimbursementPaymentValues;
  reason: string;
  actor: PaymentEditActor;
  /** Meeting updates keep the payment inside `reimbursement`. */
  nested: boolean;
}): Record<string, any> | null {
  const changes = diffPaymentValues(before, after);
  if (changes.length === 0) return null;

  const key = (field: string) => (nested ? `reimbursement.${field}` : field);
  const changed = (field: keyof ReimbursementPaymentValues) =>
    changes.some((change) => change.field === field);

  // Timestamps can't be generated by the server inside an array entry.
  const entry: PaymentEditEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    editedAt: new Date(),
    editedBy: actor.id,
    editedByName: actor.name,
    editedByEmail: actor.email,
    editedByRole: actor.role,
    reason,
    changes,
  };

  // paidBy stays as it is: an edit doesn't change who released the payment.
  const update: Record<string, any> = {
    [key("paymentEditHistory")]: arrayUnion(entry),
    [key("updatedAt")]: serverTimestamp(),
  };

  if (changed("amount")) update[key("paidAmount")] = after.amount;
  if (changed("paymentMethod")) update[key("paymentType")] = after.paymentMethod;
  if (changed("transactionReference")) {
    update[key("transactionReference")] = after.transactionReference;
  }
  if (changed("paymentNotes")) update[key("paymentNotes")] = after.paymentNotes;

  if (changed("paymentDate")) {
    update[key("paymentDate")] = after.paymentDate;
    update[key("paymentReleasedAt")] = paymentMomentFor(after.paymentDate);
  }

  if (changed("account")) {
    update[key("selectedAccount")] = after.account ?? deleteField();
    update[key("selectedAccountId")] = after.account?.id ?? deleteField();
  }

  if (changed("chequeNumbers")) {
    const [first] = after.chequeNumbers;
    update[key("chequeNumber")] = first ?? deleteField();
    update[key("chequeNumbers")] = first ? after.chequeNumbers : deleteField();
  }

  return update;
}

/**
 * Saves a correction against the record as it is now, so the history always
 * shows what was really replaced. Refuses if someone else changed the payment
 * after the form was opened, rather than silently undoing their change.
 */
export async function savePaymentEdit({
  ref,
  nested,
  opened,
  after,
  reason,
  actor,
}: {
  ref: DocumentReference;
  nested: boolean;
  /** The values the form was opened with. */
  opened: ReimbursementPaymentValues;
  after: ReimbursementPaymentValues;
  reason: string;
  actor: PaymentEditActor;
}): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.data();
    const source = nested ? data?.reimbursement : data;

    if (String(source?.paymentStatus || "").toLowerCase() !== "paid") {
      throw new PaymentEditError("This reimbursement is no longer marked as paid.");
    }

    const before = readPaymentValues(source);

    if (diffPaymentValues(opened, before).length > 0) {
      throw new PaymentEditError(
        "Someone else changed this payment after you opened it. Close this form, refresh and try again.",
      );
    }

    const update = buildPaymentEditUpdate({ before, after, reason, actor, nested });

    if (!update) throw new PaymentEditError("Nothing has changed.");

    transaction.update(ref, update);
  });
}
