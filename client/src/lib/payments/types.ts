// export type PaymentMethod = "cash" | "cheque" | "bank_transfer" | "wire";

// export interface PaymentReleaseFormValues {
//   paymentMethod: PaymentMethod | "";
//   selectedAccountId: string;
//   amount: string;
//   chequeNumber: string;
//   transactionReference: string;
//   paymentNotes: string;
// }

// export interface PaymentAccount {
//   id: string;
//   accountName?: string;
//   accountNumber?: string;
//   bankName?: string;
//   balance?: number;
//   iban?: string;
//   branchName?: string;
//   branchCode?: string;
//   currency?: string;
//   swiftCode?: string;
//   openingBalance?: number;
//   currentBalance?: number;
//   notes?: string;
//   isActive?: boolean;
//   createdAt?: any;
//   updatedAt?: any;
// }

// export interface PaymentReleaseSubmitArgs<T> {
//   context: T;
//   formData: PaymentReleaseFormValues;
//   receiptUrl: string;
//   selectedAccount?: PaymentAccount | null;
//   actor: {
//     uid?: string;
//     email?: string | null;
//     displayName?: string | null;
//     profileId?: string;
//   };
// }

export type PaymentMethod = "cash" | "cheque" | "bank_transfer" | "wire";

export interface PaymentReleaseFormValues {
  paymentMethod: PaymentMethod | "";
  selectedAccountId: string;
  amount: string;
  chequeNumber: string;
  transactionReference: string;
  paymentNotes: string;
}

export interface PaymentAccount {
  id: string;
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  balance?: number;
  iban?: string;
  branchName?: string;
  branchCode?: string;
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
