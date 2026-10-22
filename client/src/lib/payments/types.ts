export type PaymentMethod = "cash" | "cheque" | "bank_transfer" | "wire";

export interface PaymentReleaseFormValues {
  paymentMethod: PaymentMethod | "";
  selectedAccountId: string;
  amount: string;
  chequeNumber: string;
  transactionReference: string;
  paymentNotes: string;
  // The day the money was released, as YYYY-MM-DD.
  paymentDate: string;
}

export interface PaymentAccount {
  id: string;
  // Account title as per the bank.
  accountName?: string;
  // Short internal name, shown first in account pickers.
  nickname?: string;
  accountNumber?: string;
  bankName?: string;
  balance?: number;
  iban?: string;
  branchName?: string;
  branchCode?: string;
  city?: string;
  currency?: string;
  swiftCode?: string;
  openingBalance?: number;
  // Date the opening balance applies from, as YYYY-MM-DD.
  openingBalanceDate?: string;
  currentBalance?: number;
  notes?: string;
  isActive?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface PaymentReleaseSubmitArgs<T> {
  context: T;
  formData: PaymentReleaseFormValues;
  receiptUrl: string;
  selectedAccount?: PaymentAccount | null;
  actor: {
    uid?: string;
    email?: string | null;
    displayName?: string | null;
    profileId?: string;
  };
}