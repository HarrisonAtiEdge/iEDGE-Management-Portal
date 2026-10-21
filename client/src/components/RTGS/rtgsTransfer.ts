// An RTGS letter that moves money between two of the company's own accounts
// (Finance → Accounts). It is recorded exactly like a transfer made on the
// Accounts page (PaymentTransactions): the same balance check, both stored
// balances updated, and one accountTransfers record, so balances, Account
// Statement and the transfers list pick it up unchanged.
import {
  collection,
  doc,
  serverTimestamp,
  type DocumentReference,
  type Transaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { PaymentAccount } from "@/lib/payments/types";
import { formatRs } from "./rtgsPayables";

const PANEL_ID = "IEDGE-SYSTEM";

// Same fields, in the same order, as the Accounts page transfer.
const BALANCE_FIELDS = ["currentBalance", "balance", "availableBalance", "ledgerBalance", "openingBalance"] as const;

export interface RtgsTransferPlan {
  transferId: string;
  serialNo: string;
  amount: number;
  chequeNumber: string;
  from: PaymentAccount;
  to: PaymentAccount;
  actor: { uid: string; name: string; email: string };
}

/** What the letter stores about the transfer it made. */
export interface RtgsLetterTransfer {
  transferId: string;
  fromAccountId: string;
  fromAccountName: string;
  toAccountId: string;
  toAccountName: string;
  amount: number;
}

export class TransferError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransferError";
  }
}

export const accountLabel = (account: { accountName?: string; bankName?: string }) =>
  account.accountName || account.bankName || "Unnamed account";

/** A new transfer record ID (no network call), so the letter can store it. */
export const newTransferId = () => doc(collection(db, "Panels", PANEL_ID, "accountTransfers")).id;

export const letterTransferFor = (plan: RtgsTransferPlan): RtgsLetterTransfer => ({
  transferId: plan.transferId,
  fromAccountId: plan.from.id,
  fromAccountName: accountLabel(plan.from),
  toAccountId: plan.to.id,
  toAccountName: accountLabel(plan.to),
  amount: plan.amount,
});

function balanceInfo(data: Record<string, unknown>) {
  for (const field of BALANCE_FIELDS) {
    const raw = data[field];
    if (raw !== undefined && raw !== null && raw !== "") {
      const value = Number(raw);
      if (Number.isFinite(value)) return { field, value };
    }
  }
  return null;
}

/**
 * Reads both accounts inside the letter's transaction (before any write),
 * applies the Accounts page's checks, and returns the writes for the transfer.
 */
export async function prepareTransferWrites(
  transaction: Transaction,
  plan: RtgsTransferPlan,
): Promise<Array<{ ref: DocumentReference; data: Record<string, unknown>; create?: boolean }>> {
  if (plan.from.id === plan.to.id) {
    throw new TransferError("The From and To accounts can't be the same.");
  }

  const fromRef = doc(db, "Panels", PANEL_ID, "paymentAccounts", plan.from.id);
  const toRef = doc(db, "Panels", PANEL_ID, "paymentAccounts", plan.to.id);
  const [fromSnap, toSnap] = await Promise.all([transaction.get(fromRef), transaction.get(toRef)]);

  if (!fromSnap.exists()) throw new TransferError("The From account no longer exists.");
  if (!toSnap.exists()) throw new TransferError("The To account no longer exists.");

  const fromData = fromSnap.data() as Record<string, unknown>;
  const toData = toSnap.data() as Record<string, unknown>;
  const fromBalance = balanceInfo(fromData);
  const toBalance = balanceInfo(toData);
  const fromName = String(fromData.accountName || fromData.bankName || "") || accountLabel(plan.from);
  const toName = String(toData.accountName || toData.bankName || "") || accountLabel(plan.to);

  if (!fromBalance) throw new TransferError(`${fromName} has no balance recorded on the Accounts page.`);
  if (!toBalance) throw new TransferError(`${toName} has no balance recorded on the Accounts page.`);
  if (fromBalance.value < plan.amount) {
    throw new TransferError(`Not enough balance in ${fromName}. Available balance is ${formatRs(fromBalance.value)}.`);
  }

  const fromAfter = fromBalance.value - plan.amount;
  const toAfter = toBalance.value + plan.amount;
  const { actor } = plan;

  return [
    { ref: fromRef, data: { [fromBalance.field]: fromAfter, updatedAt: serverTimestamp() } },
    { ref: toRef, data: { [toBalance.field]: toAfter, updatedAt: serverTimestamp() } },
    {
      ref: doc(db, "Panels", PANEL_ID, "accountTransfers", plan.transferId),
      create: true,
      data: {
        transferName: `RTGS ${plan.serialNo}: ${fromName} → ${toName}`,
        fromAccountId: plan.from.id,
        fromAccountName: fromName,
        toAccountId: plan.to.id,
        toAccountName: toName,
        amount: plan.amount,
        description: `RTGS letter ${plan.serialNo}`,
        createdById: actor.uid,
        createdByName: actor.name,
        createdByEmail: actor.email,
        createdBy: { uid: actor.uid, name: actor.name, email: actor.email },
        fromBalanceBefore: fromBalance.value,
        fromBalanceAfter: fromAfter,
        toBalanceBefore: toBalance.value,
        toBalanceAfter: toAfter,
        status: "completed",
        createdAt: serverTimestamp(),
        createdAtISO: new Date().toISOString(),
        chequeNumber: plan.chequeNumber,
        paidVia: "rtgs",
        rtgsSerialNo: plan.serialNo,
      },
    },
  ];
}
