import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PaymentAccount } from "@/lib/payments/types";

const PANEL_ID = "IEDGE-SYSTEM";
const COLLECTION_PATH = ["Panels", PANEL_ID, "paymentAccounts"] as const;

export interface CreatePaymentAccountInput {
  accountName: string;
  nickname?: string;
  accountNumber: string;
  bankName: string;
  iban?: string;
  swiftCode?: string;
  branchName?: string;
  branchCode?: string;
  city?: string;
  currency?: string;
  openingBalance?: number;
  openingBalanceDate?: string;
  currentBalance?: number;
  notes?: string;
  isActive?: boolean;
}

export const paymentAccountsCollection = () =>
  collection(db, ...COLLECTION_PATH);

// "Nickname · Account Title" for account pickers, or just the title when the
// account has no nickname. Letters and statements keep the bank's title.
export function paymentAccountPickerName(
  account: Pick<PaymentAccount, "nickname" | "accountName" | "bankName">,
) {
  const title = account.accountName || account.bankName || "Unnamed Account";
  const nickname = String(account.nickname || "").trim();

  return nickname && nickname !== title ? `${nickname} · ${title}` : title;
}

export function sortPaymentAccounts(accounts: PaymentAccount[]) {
  return [...accounts].sort((a, b) =>
    String(a.accountName || a.bankName || "").localeCompare(
      String(b.accountName || b.bankName || ""),
    ),
  );
}

// Sorted in the browser: a Firestore orderBy("accountName") would silently
// leave out any account document that has no accountName field.
export async function fetchPaymentAccounts(): Promise<PaymentAccount[]> {
  const snap = await getDocs(paymentAccountsCollection());

  return sortPaymentAccounts(
    snap.docs.map((d) => mapPaymentAccount(d.id, d.data())),
  );
}

export function mapPaymentAccount(id: string, data: any): PaymentAccount {
  return {
    id,
    accountName: data.accountName || "",
    nickname: data.nickname || "",
    accountNumber: data.accountNumber || "",
    bankName: data.bankName || "",
    iban: data.iban || "",
    swiftCode: data.swiftCode || "",
    branchName: data.branchName || "",
    branchCode: data.branchCode || "",
    city: data.city || "",
    currency: data.currency || "PKR",
    balance:
      typeof data.currentBalance === "number"
        ? data.currentBalance
        : typeof data.openingBalance === "number"
        ? data.openingBalance
        : 0,
    openingBalance:
      typeof data.openingBalance === "number" ? data.openingBalance : 0,
    openingBalanceDate: data.openingBalanceDate || "",
    currentBalance:
      typeof data.currentBalance === "number" ? data.currentBalance : 0,
    notes: data.notes || "",
    isActive: data.isActive !== false,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  } as PaymentAccount;
}

export async function createPaymentAccount(input: CreatePaymentAccountInput) {
  const payload = {
    accountName: input.accountName.trim(),
    nickname: String(input.nickname || "").trim(),
    accountNumber: input.accountNumber.trim(),
    bankName: input.bankName.trim(),
    iban: String(input.iban || "").trim(),
    swiftCode: String(input.swiftCode || "").trim(),
    branchName: String(input.branchName || "").trim(),
    branchCode: String(input.branchCode || "").trim(),
    city: String(input.city || "").trim(),
    currency: String(input.currency || "PKR").trim() || "PKR",
    openingBalance: Number(input.openingBalance || 0),
    openingBalanceDate: String(input.openingBalanceDate || "").trim(),
    currentBalance: Number(
      input.currentBalance ?? input.openingBalance ?? 0
    ),
    notes: String(input.notes || "").trim(),
    isActive: input.isActive !== false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  return await addDoc(collection(db, ...COLLECTION_PATH), payload);
}

export async function updatePaymentAccount(
  accountId: string,
  input: Partial<CreatePaymentAccountInput>
) {
  const payload: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (input.accountName !== undefined) {
    payload.accountName = input.accountName.trim();
  }
  if (input.nickname !== undefined) {
    payload.nickname = String(input.nickname || "").trim();
  }
  if (input.accountNumber !== undefined) {
    payload.accountNumber = input.accountNumber.trim();
  }
  if (input.bankName !== undefined) {
    payload.bankName = input.bankName.trim();
  }
  if (input.iban !== undefined) {
    payload.iban = String(input.iban || "").trim();
  }
  if (input.swiftCode !== undefined) {
    payload.swiftCode = String(input.swiftCode || "").trim();
  }
  if (input.branchName !== undefined) {
    payload.branchName = String(input.branchName || "").trim();
  }
  if (input.branchCode !== undefined) {
    payload.branchCode = String(input.branchCode || "").trim();
  }
  if (input.city !== undefined) {
    payload.city = String(input.city || "").trim();
  }
  if (input.currency !== undefined) {
    payload.currency = String(input.currency || "PKR").trim() || "PKR";
  }
  if (input.openingBalance !== undefined) {
    payload.openingBalance = Number(input.openingBalance || 0);
  }
  if (input.openingBalanceDate !== undefined) {
    payload.openingBalanceDate = String(input.openingBalanceDate || "").trim();
  }
  if (input.currentBalance !== undefined) {
    payload.currentBalance = Number(input.currentBalance || 0);
  }
  if (input.notes !== undefined) {
    payload.notes = String(input.notes || "").trim();
  }
  if (input.isActive !== undefined) {
    payload.isActive = input.isActive;
  }

  await updateDoc(doc(db, ...COLLECTION_PATH, accountId), payload);
}