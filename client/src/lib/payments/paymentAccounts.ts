import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
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
  accountNumber: string;
  bankName: string;
  iban?: string;
  branchName?: string;
  branchCode?: string;
  currency?: string;
  openingBalance?: number;
  currentBalance?: number;
  notes?: string;
  isActive?: boolean;
}

export async function fetchPaymentAccounts(): Promise<PaymentAccount[]> {
  const q = query(
    collection(db, ...COLLECTION_PATH),
    orderBy("accountName", "asc")
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data: any = d.data();

    return {
      id: d.id,
      accountName: data.accountName || "",
      accountNumber: data.accountNumber || "",
      bankName: data.bankName || "",
      iban: data.iban || "",
      branchName: data.branchName || "",
      branchCode: data.branchCode || "",
      currency: data.currency || "PKR",
      balance:
        typeof data.currentBalance === "number"
          ? data.currentBalance
          : typeof data.openingBalance === "number"
          ? data.openingBalance
          : 0,
      openingBalance:
        typeof data.openingBalance === "number" ? data.openingBalance : 0,
      currentBalance:
        typeof data.currentBalance === "number" ? data.currentBalance : 0,
      notes: data.notes || "",
      isActive: data.isActive !== false,
      createdAt: data.createdAt || null,
      updatedAt: data.updatedAt || null,
    } as PaymentAccount;
  });
}

export async function createPaymentAccount(input: CreatePaymentAccountInput) {
  const payload = {
    accountName: input.accountName.trim(),
    accountNumber: input.accountNumber.trim(),
    bankName: input.bankName.trim(),
    iban: String(input.iban || "").trim(),
    branchName: String(input.branchName || "").trim(),
    branchCode: String(input.branchCode || "").trim(),
    currency: String(input.currency || "PKR").trim() || "PKR",
    openingBalance: Number(input.openingBalance || 0),
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
  if (input.accountNumber !== undefined) {
    payload.accountNumber = input.accountNumber.trim();
  }
  if (input.bankName !== undefined) {
    payload.bankName = input.bankName.trim();
  }
  if (input.iban !== undefined) {
    payload.iban = String(input.iban || "").trim();
  }
  if (input.branchName !== undefined) {
    payload.branchName = String(input.branchName || "").trim();
  }
  if (input.branchCode !== undefined) {
    payload.branchCode = String(input.branchCode || "").trim();
  }
  if (input.currency !== undefined) {
    payload.currency = String(input.currency || "PKR").trim() || "PKR";
  }
  if (input.openingBalance !== undefined) {
    payload.openingBalance = Number(input.openingBalance || 0);
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