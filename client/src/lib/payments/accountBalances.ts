// // Calculates each payment account's balance from the transactions that
// // reference it, instead of trusting the stored `currentBalance` field (which is
// // only updated by account transfers, not by payments received or released).
// //
// //   current = opening + received - released - cheque records
// //             + transfers in - transfers out
// //
// // When an account has an opening balance date, the opening balance is the
// // balance on that day, so only transactions dated on or after it are counted.
// // Transactions with no usable date are always counted.

// export type AccountBalanceBreakdown = {
//   opening: number;
//   received: number;
//   released: number;
//   chequeRecords: number;
//   transfersIn: number;
//   transfersOut: number;
//   current: number;
// };

// export type AccountBalanceSources = {
//   // Panels/IEDGE-SYSTEM/payments: invoice payments received (depositTo).
//   payments: any[];
//   // Panels/IEDGE-SYSTEM/accountTransfers.
//   transfers: any[];
//   // Documents whose payment releases can be charged to an account:
//   // invoiceRequests, PO, claimReimbursements and meetingUpdates.
//   releaseDocuments: any[];
//   // Panels/IEDGE-SYSTEM/Record: cheque records.
//   records: any[];
// };

// const VOID_STATUSES = new Set(["cancelled", "canceled", "deleted", "void"]);

// const toAmount = (...values: any[]) => {
//   for (const value of values) {
//     if (value === undefined || value === null || value === "") continue;

//     const amount = Number(String(value).replace(/,/g, ""));
//     if (Number.isFinite(amount)) return amount;
//   }

//   return 0;
// };

// const roundMoney = (value: number) => Math.round(value * 100) / 100;

// const padDatePart = (value: number) => String(value).padStart(2, "0");

// // Local calendar day (YYYY-MM-DD) of the first usable stored date: a Firestore
// // Timestamp, Date, epoch millis or date string. "" when none is usable.
// const toDayKey = (...values: any[]) => {
//   for (const value of values) {
//     if (value === undefined || value === null || value === "") continue;

//     if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
//       return value.trim();
//     }

//     const date =
//       typeof value?.toDate === "function"
//         ? value.toDate()
//         : value instanceof Date
//           ? value
//           : typeof value?.seconds === "number"
//             ? new Date(value.seconds * 1000)
//             : new Date(value);

//     if (!(date instanceof Date) || Number.isNaN(date.getTime())) continue;

//     return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(
//       date.getDate(),
//     )}`;
//   }

//   return "";
// };

// const isVoided = (source: any) =>
//   VOID_STATUSES.has(String(source?.status || "").trim().toLowerCase());

// const getEntryAccountId = (entry: any) =>
//   String(
//     entry?.selectedAccountId ||
//       entry?.selectedAccount?.id ||
//       entry?.paymentAccountId ||
//       "",
//   ).trim();

// const getReleaseAmount = (entry: any) =>
//   toAmount(
//     entry?.amount,
//     entry?.releaseAmount,
//     entry?.releasedAmount,
//     entry?.paymentAmount,
//     entry?.paidAmount,
//   );

// // The payment releases recorded on one document. New releases are appended to
// // paymentReleaseHistory, and older documents keep a single paymentDetails /
// // latestPaymentRelease (the same entry is duplicated there, so the history is
// // used whenever it exists). Reimbursements store the account and paidAmount on
// // the document itself.
// export function getAccountReleaseEntries(source: any): any[] {
//   if (!source || isVoided(source)) return [];

//   const history = Array.isArray(source.paymentReleaseHistory)
//     ? source.paymentReleaseHistory.filter(
//         (entry: any) => getReleaseAmount(entry) > 0,
//       )
//     : [];

//   if (history.length > 0) return history;

//   const legacyEntry = source.paymentDetails || source.latestPaymentRelease;

//   if (legacyEntry && getReleaseAmount(legacyEntry) > 0) {
//     return [legacyEntry];
//   }

//   if (
//     getEntryAccountId(source) &&
//     String(source.paymentStatus || "").toLowerCase() === "paid" &&
//     toAmount(source.paidAmount) > 0
//   ) {
//     return [{ ...source, amount: toAmount(source.paidAmount) }];
//   }

//   return [];
// }

// export function calculateAccountBalances(
//   accounts: Array<{
//     id: string;
//     openingBalance?: number;
//     openingBalanceDate?: string;
//   }>,
//   sources: AccountBalanceSources,
// ): Record<string, AccountBalanceBreakdown> {
//   const balances: Record<string, AccountBalanceBreakdown> = {};
//   const openingDays: Record<string, string> = {};

//   accounts.forEach((account) => {
//     openingDays[account.id] = toDayKey(account.openingBalanceDate);
//     balances[account.id] = {
//       opening: toAmount(account.openingBalance),
//       received: 0,
//       released: 0,
//       chequeRecords: 0,
//       transfersIn: 0,
//       transfersOut: 0,
//       current: 0,
//     };
//   });

//   const add = (
//     accountId: string,
//     field: Exclude<keyof AccountBalanceBreakdown, "opening" | "current">,
//     amount: number,
//     day: string,
//   ) => {
//     const balance = balances[accountId];
//     if (!balance || !(amount > 0)) return;

//     // Already included in the opening balance.
//     const openingDay = openingDays[accountId];
//     if (openingDay && day && day < openingDay) return;

//     balance[field] += amount;
//   };

//   sources.payments.forEach((payment) => {
//     if (isVoided(payment)) return;

//     add(
//       String(payment?.depositTo || "").trim(),
//       "received",
//       toAmount(payment?.amount, payment?.actualReceivedAmount),
//       toDayKey(payment?.paymentDate, payment?.createdAt),
//     );
//   });

//   sources.releaseDocuments.forEach((document) => {
//     // Sales meeting updates keep the reimbursement in a nested object.
//     const source = document?.reimbursement?.enabled
//       ? document.reimbursement
//       : document;

//     getAccountReleaseEntries(source).forEach((entry) => {
//       add(
//         getEntryAccountId(entry),
//         "released",
//         getReleaseAmount(entry),
//         toDayKey(
//           entry?.releasedAt,
//           entry?.paymentDate,
//           entry?.createdAt,
//           entry?.paymentReleasedAt,
//           source?.paymentReleasedAt,
//           source?.updatedAt,
//           source?.submittedAt,
//         ),
//       );
//     });
//   });

//   sources.records.forEach((record) => {
//     if (isVoided(record)) return;

//     // Vendor manual payments also write each allocation into the PO payment
//     // history (counted above), so their summary Record is skipped here.
//     if (record?.sourceType === "po_manual_payment") return;

//     // Only cheque records drawn on a Payment Account; older records point at
//     // the separate Cheque/Online account lists.
//     if (record?.accountSource !== "paymentAccounts") return;

//     add(
//       String(record?.accountId || "").trim(),
//       "chequeRecords",
//       toAmount(record?.chequeAmount),
//       toDayKey(
//         record?.chequeDate,
//         record?.selectedDate,
//         record?.createdAt,
//         record?.updatedAt,
//       ),
//     );
//   });

//   sources.transfers.forEach((transfer) => {
//     if (String(transfer?.status || "completed").toLowerCase() !== "completed") {
//       return;
//     }

//     const amount = toAmount(transfer?.amount);
//     const day = toDayKey(
//       transfer?.transferDate,
//       transfer?.createdAt,
//       transfer?.createdAtISO,
//     );

//     add(
//       String(transfer?.fromAccountId || "").trim(),
//       "transfersOut",
//       amount,
//       day,
//     );
//     add(String(transfer?.toAccountId || "").trim(), "transfersIn", amount, day);
//   });

//   Object.values(balances).forEach((balance) => {
//     balance.current = roundMoney(
//       balance.opening +
//         balance.received -
//         balance.released -
//         balance.chequeRecords +
//         balance.transfersIn -
//         balance.transfersOut,
//     );
//   });

//   return balances;
// }

// The one ledger of money moving in or out of the payment accounts. Both the
// Accounts tab and the Account Statement read their data through
// useAccountLedgerData and turn it into this ledger with buildAccountLedger:
// the statement lists its entries and the Accounts tab adds them up, so an
// account's balance is always the statement's closing balance. Calculated from
// the transactions that reference an account, instead of trusting the stored
// `currentBalance` field (which is only updated by account transfers, not by
// payments received or released).
//
//   current = opening + received - released - cheque records
//             + transfers in - transfers out + manual credits - manual debits
//
// When an account has an opening balance date, the opening balance is the
// balance on that day, so only transactions dated on or after it are counted.
// Transactions with no usable date are always counted.

import type { PaymentAccount } from "@/lib/payments/types";

export type AccountBalanceBreakdown = {
  opening: number;
  received: number;
  released: number;
  chequeRecords: number;
  transfersIn: number;
  transfersOut: number;
  manualCredits: number;
  manualDebits: number;
  current: number;
};

export type SalesRecordDoc = {
  id: string;
  sourcePath: "panel" | "root";
  data: any;
};

export type MeetingUpdateDoc = {
  id: string;
  recordId: string;
  sourcePath: "panel" | "root";
  data: any;
};

// Everything that can move money on a payment account. Each document carries
// its Firestore id.
export type AccountLedgerData = {
  // Panels/IEDGE-SYSTEM/paymentAccounts.
  accounts: PaymentAccount[];
  // Panels/IEDGE-SYSTEM/payments: invoice payments received (depositTo).
  payments: any[];
  // Panels/IEDGE-SYSTEM/invoiceRequests: budget request payment releases.
  invoiceRequests: any[];
  // Panels/IEDGE-SYSTEM/PO: purchase order payment releases.
  purchaseOrders: any[];
  // Panels/IEDGE-SYSTEM/claimReimbursements.
  claimReimbursements: any[];
  // Panels/IEDGE-SYSTEM/Record: cheque records.
  records: any[];
  // Panels/IEDGE-SYSTEM/accountTransfers.
  transfers: any[];
  // Panels/IEDGE-SYSTEM/accountStatementManualEntries.
  manualEntries: any[];
  // Sales records at the panel path and the legacy root path.
  salesRecords: SalesRecordDoc[];
  // Sales meeting updates with a reimbursement, from both paths.
  meetingUpdates: MeetingUpdateDoc[];
};

export type AccountLedgerKind =
  | "invoice_payment"
  | "budget_request"
  | "purchase_order"
  | "claim_reimbursement"
  | "meeting_reimbursement"
  | "record"
  | "manual"
  | "transfer_out"
  | "transfer_in";

// One ledger line. accountId is the Payment Account it is charged to, or ""
// when it is not linked to one: it is then only listed under "All accounts"
// on the statement and counts towards no balance.
export type AccountLedgerEntry = {
  key: string;
  kind: AccountLedgerKind;
  accountId: string;
  credit: number;
  debit: number;
  date: Date | null;
  // Local calendar day of `date` (YYYY-MM-DD), "" when undated.
  day: string;
  // The payment, request, PO, claim, meeting update, record, manual entry or
  // transfer the line comes from.
  document: any;
  // The payment release, for releases.
  release?: any;
  // A budget request marked as released with no release recorded.
  unrecordedRelease?: boolean;
  meetingUpdate?: MeetingUpdateDoc;
};

// Money moved on one account by one transaction. accountId is the id stored
// on the transaction, which may not be a Payment Account.
export type AccountMovement = {
  accountId: string;
  credit: number;
  debit: number;
  date: Date | null;
};

type BalanceAccount = {
  id: string;
  openingBalance?: number;
  openingBalanceDate?: string;
  accountNumber?: string;
  iban?: string;
};

const VOID_STATUSES = new Set(["cancelled", "canceled", "deleted", "void"]);

const toAmount = (...values: any[]) => {
  for (const value of values) {
    if (value === undefined || value === null || value === "") continue;

    const amount = Number(String(value).replace(/,/g, ""));
    if (Number.isFinite(amount)) return amount;
  }

  return 0;
};

const firstPositiveAmount = (...values: any[]) => {
  for (const value of values) {
    const amount = toAmount(value);
    if (amount > 0) return amount;
  }

  return 0;
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const padDatePart = (value: number) => String(value).padStart(2, "0");

// The first usable stored date: a Firestore Timestamp, Date, epoch millis or
// date string. A bare YYYY-MM-DD is that local calendar day. null when none
// is usable.
export const toAccountDate = (...values: any[]): Date | null => {
  for (const value of values) {
    if (value === undefined || value === null || value === "") continue;

    if (typeof value === "string") {
      const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (match) {
        return new Date(
          Number(match[1]),
          Number(match[2]) - 1,
          Number(match[3]),
        );
      }
    }

    const date =
      typeof value?.toDate === "function"
        ? value.toDate()
        : value instanceof Date
          ? value
          : typeof value?.seconds === "number"
            ? new Date(value.seconds * 1000)
            : new Date(value);

    if (date instanceof Date && !Number.isNaN(date.getTime())) return date;
  }

  return null;
};

// Local calendar day (YYYY-MM-DD) of the first usable stored date. "" when
// none is usable.
export const toDayKey = (...values: any[]) => {
  const date = toAccountDate(...values);
  if (!date) return "";

  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(
    date.getDate(),
  )}`;
};

// True when a transaction on `day` is already included in an account's
// opening balance.
export const isBeforeOpeningDay = (openingBalanceDate: any, day: string) => {
  const openingDay = toDayKey(openingBalanceDate);
  return Boolean(openingDay && day && day < openingDay);
};

export const isVoided = (source: any) =>
  VOID_STATUSES.has(
    String(source?.status || "")
      .trim()
      .toLowerCase(),
  );

const getEntryAccountId = (entry: any) =>
  String(
    entry?.selectedAccountId ||
      entry?.selectedAccount?.id ||
      entry?.paymentAccountId ||
      "",
  ).trim();

const getReleaseAmount = (entry: any) =>
  toAmount(
    entry?.amount,
    entry?.releaseAmount,
    entry?.releasedAmount,
    entry?.paymentAmount,
    entry?.paidAmount,
  );

// The payment releases recorded on one document. New releases are appended to
// paymentReleaseHistory, and older documents keep a single paymentDetails /
// latestPaymentRelease (the same entry is duplicated there, so the history is
// used whenever it exists). Reimbursements store the account and paidAmount on
// the document itself.
export function getAccountReleaseEntries(source: any): any[] {
  if (!source || isVoided(source)) return [];

  const history = Array.isArray(source.paymentReleaseHistory)
    ? source.paymentReleaseHistory.filter(
        (entry: any) => getReleaseAmount(entry) > 0,
      )
    : [];

  if (history.length > 0) return history;

  const legacyEntry = source.paymentDetails || source.latestPaymentRelease;

  if (legacyEntry && getReleaseAmount(legacyEntry) > 0) {
    return [legacyEntry];
  }

  const paidAmount = firstPositiveAmount(
    source.paidAmount,
    source.approvedAmount,
    source.claimAmount,
    source.amount,
  );

  if (
    getEntryAccountId(source) &&
    String(source.paymentStatus || "").toLowerCase() === "paid" &&
    paidAmount > 0
  ) {
    return [{ ...source, amount: paidAmount }];
  }

  return [];
}

// Payments saved before actualReceivedAmount existed hold the gross payment in
// `amount`, and the bank received it less the WHT/SST withheld. Newer payments
// record the amount actually received in the bank; their WHT/SST is for
// reporting only.
export const getPaymentTaxWithheld = (payment: any) =>
  payment?.actualReceivedAmount === undefined ||
  payment?.actualReceivedAmount === null
    ? toAmount(payment?.whtAmount) + toAmount(payment?.sstAmount)
    : 0;

// An invoice payment received: the payment is credited and any tax withheld
// from it is debited.
export function getPaymentMovement(payment: any): AccountMovement | null {
  if (isVoided(payment)) return null;

  const credit = toAmount(payment?.amount, payment?.actualReceivedAmount);
  if (!(credit > 0)) return null;

  return {
    accountId: String(payment?.depositTo || "").trim(),
    credit,
    debit: getPaymentTaxWithheld(payment),
    date: toAccountDate(payment?.paymentDate, payment?.createdAt),
  };
}

// The payment releases charged to accounts by one document. Sales meeting
// updates keep the reimbursement in a nested object. Vendor manual payments
// are counted once, from their summary cheque Record, so the per-PO
// allocations they write are skipped.
export function getReleaseMovements(
  document: any,
): Array<AccountMovement & { entry: any }> {
  const source = document?.reimbursement?.enabled
    ? document.reimbursement
    : document;

  return getAccountReleaseEntries(source)
    .filter((entry) => !entry?.manualBatchPaymentId)
    .map((entry) => ({
      entry,
      accountId: getEntryAccountId(entry),
      credit: 0,
      debit: getReleaseAmount(entry),
      date: toAccountDate(
        entry?.releasedAt,
        entry?.paymentDate,
        entry?.paymentReleasedAt,
        entry?.createdAt,
        source?.paymentReleasedAt,
        source?.releasePaymentAt,
        source?.updatedAt,
        source?.submittedAt,
      ),
    }));
}

const normalizeAccountNumber = (value: any) =>
  String(value ?? "")
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase();

// Cheque records drawn on a Payment Account carry its id. Older records point
// at the retired cheque/online account lists, which held copies of the same
// bank accounts, so those are matched by account number or IBAN.
export function createChequeRecordAccountResolver(accounts: BalanceAccount[]) {
  const accountIds = new Set(accounts.map((account) => account.id));
  const accountIdByNumber = new Map<string, string>();

  accounts.forEach((account) => {
    [account.accountNumber, account.iban].forEach((number) => {
      const key = normalizeAccountNumber(number);
      if (key && !accountIdByNumber.has(key)) {
        accountIdByNumber.set(key, account.id);
      }
    });
  });

  return (record: any) => {
    const accountId = String(record?.accountId || "").trim();
    if (accountIds.has(accountId)) return accountId;

    for (const number of [record?.accountNo, record?.iban]) {
      const key = normalizeAccountNumber(number);
      if (!key) continue;

      const exact = accountIdByNumber.get(key);
      if (exact) return exact;

      // Account number entered on its own vs. the full IBAN that ends with it.
      if (key.length >= 6) {
        for (const [savedKey, id] of Array.from(accountIdByNumber)) {
          if (savedKey.endsWith(key) || key.endsWith(savedKey)) return id;
        }
      }
    }

    return "";
  };
}

export function getChequeRecordMovement(
  record: any,
  resolveAccountId: (record: any) => string,
): AccountMovement | null {
  if (isVoided(record)) return null;

  const debit = toAmount(record?.chequeAmount);
  if (!(debit > 0)) return null;

  return {
    accountId: resolveAccountId(record),
    credit: 0,
    debit,
    date: toAccountDate(
      record?.chequeDate,
      record?.selectedDate,
      record?.createdAt,
      record?.updatedAt,
    ),
  };
}

// A completed transfer between two accounts, as the money leaving one and
// arriving in the other. Dated by the day chosen on the transfer form; older
// transfers only have the time they were recorded.
export function getTransferMovements(
  transfer: any,
): { outgoing: AccountMovement; incoming: AccountMovement } | null {
  if (String(transfer?.status || "completed").toLowerCase() !== "completed") {
    return null;
  }

  const amount = toAmount(transfer?.amount);
  if (!(amount > 0)) return null;

  const date = toAccountDate(
    transfer?.transferDate,
    transfer?.createdAt,
    transfer?.createdAtISO,
  );

  return {
    outgoing: {
      accountId: String(transfer?.fromAccountId || "").trim(),
      credit: 0,
      debit: amount,
      date,
    },
    incoming: {
      accountId: String(transfer?.toAccountId || "").trim(),
      credit: amount,
      debit: 0,
      date,
    },
  };
}

// An entry added by hand on the Account Statement.
export function getManualEntryMovement(entry: any): AccountMovement | null {
  const debit = toAmount(entry?.debit);
  const credit = toAmount(entry?.credit);
  if (!(debit > 0) && !(credit > 0)) return null;

  return {
    accountId: String(entry?.accountId || "").trim(),
    credit,
    debit,
    date: toAccountDate(entry?.date, entry?.createdAt),
  };
}

// A budget request marked as released but with no release amount recorded.
// The statement lists it under "All accounts" with the request's released or
// total amount; it is not charged to any account.
function getUnrecordedRelease(request: any) {
  if (isVoided(request)) return null;

  const status = String(request?.status || "").toLowerCase();
  const isReleased =
    status === "payment_released" ||
    status === "payment_partially_released" ||
    status === "released" ||
    status === "partial" ||
    request?.paymentReleased === true ||
    request?.paymentPartiallyReleased === true ||
    request?.releasePaymentCreated === true;

  if (!isReleased) return null;

  const entry = {
    ...(request.paymentDetails || request.latestPaymentRelease || {}),
    amount:
      request.paymentDetails?.amount ||
      request.latestPaymentRelease?.amount ||
      request.releasedAmount ||
      request.totalReleasedAmount ||
      request.totalAmount,
    releasedAt:
      request.paymentDetails?.releasedAt ||
      request.latestPaymentRelease?.releasedAt ||
      request.paymentReleasedAt ||
      request.releasePaymentAt ||
      request.updatedAt ||
      request.submittedAt,
  };

  const debit = getReleaseAmount(entry);
  if (!(debit > 0)) return null;

  return { entry, debit, date: toAccountDate(entry.releasedAt) };
}

export function buildAccountLedger(
  data: AccountLedgerData,
): AccountLedgerEntry[] {
  const accountIds = new Set(data.accounts.map((account) => account.id));
  const resolveRecordAccountId = createChequeRecordAccountResolver(
    data.accounts,
  );
  const ledger: AccountLedgerEntry[] = [];

  const add = (
    key: string,
    kind: AccountLedgerKind,
    movement: AccountMovement,
    details: Pick<AccountLedgerEntry, "document"> & Partial<AccountLedgerEntry>,
  ) => {
    ledger.push({
      key,
      kind,
      accountId: accountIds.has(movement.accountId) ? movement.accountId : "",
      credit: movement.credit,
      debit: movement.debit,
      date: movement.date,
      day: toDayKey(movement.date),
      ...details,
    });
  };

  data.payments.forEach((payment) => {
    const movement = getPaymentMovement(payment);
    if (movement) {
      add(`invoice-payment-${payment.id}`, "invoice_payment", movement, {
        document: payment,
      });
    }
  });

  data.invoiceRequests.forEach((request) => {
    const releases = getReleaseMovements(request);

    releases.forEach(({ entry, ...movement }, index) =>
      add(
        `budget-request-${request.id}-${entry?.id || index}`,
        "budget_request",
        movement,
        { document: request, release: entry },
      ),
    );

    if (releases.length > 0) return;

    const unrecorded = getUnrecordedRelease(request);
    if (unrecorded) {
      add(
        `budget-request-${request.id}-unrecorded`,
        "budget_request",
        {
          accountId: "",
          credit: 0,
          debit: unrecorded.debit,
          date: unrecorded.date,
        },
        {
          document: request,
          release: unrecorded.entry,
          unrecordedRelease: true,
        },
      );
    }
  });

  data.purchaseOrders.forEach((po) => {
    getReleaseMovements(po).forEach(({ entry, ...movement }, index) =>
      add(
        `purchase-order-${po.id}-${entry?.id || index}`,
        "purchase_order",
        movement,
        { document: po, release: entry },
      ),
    );
  });

  data.claimReimbursements.forEach((claim) => {
    getReleaseMovements(claim).forEach(({ entry, ...movement }, index) =>
      add(
        `claim-reimbursement-${claim.id}-${index}`,
        "claim_reimbursement",
        movement,
        { document: claim, release: entry },
      ),
    );
  });

  data.meetingUpdates.forEach((meetingUpdate) => {
    if (!meetingUpdate.data?.reimbursement?.enabled) return;

    getReleaseMovements(meetingUpdate.data).forEach(
      ({ entry, ...movement }, index) =>
        add(
          `meeting-reimbursement-${meetingUpdate.sourcePath}-${meetingUpdate.recordId}-${meetingUpdate.id}-${index}`,
          "meeting_reimbursement",
          movement,
          { document: meetingUpdate.data, release: entry, meetingUpdate },
        ),
    );
  });

  data.records.forEach((record) => {
    const movement = getChequeRecordMovement(record, resolveRecordAccountId);
    if (movement) {
      add(`record-cheque-${record.id}`, "record", movement, {
        document: record,
      });
    }
  });

  data.manualEntries.forEach((entry) => {
    const movement = getManualEntryMovement(entry);
    if (movement) {
      add(`manual-${entry.id}`, "manual", movement, { document: entry });
    }
  });

  // Transfers move money between two of our own accounts, so a side is only
  // listed when it is a Payment Account.
  data.transfers.forEach((transfer) => {
    const movements = getTransferMovements(transfer);
    if (!movements) return;

    if (accountIds.has(movements.outgoing.accountId)) {
      add(`transfer-out-${transfer.id}`, "transfer_out", movements.outgoing, {
        document: transfer,
      });
    }
    if (accountIds.has(movements.incoming.accountId)) {
      add(`transfer-in-${transfer.id}`, "transfer_in", movements.incoming, {
        document: transfer,
      });
    }
  });

  return ledger;
}

// Each account's balance: its opening balance plus the ledger lines charged
// to it from the opening balance date on.
export function calculateAccountBalances(
  accounts: BalanceAccount[],
  ledger: AccountLedgerEntry[],
): Record<string, AccountBalanceBreakdown> {
  const balances: Record<string, AccountBalanceBreakdown> = {};
  const openingDates: Record<string, string | undefined> = {};

  accounts.forEach((account) => {
    openingDates[account.id] = account.openingBalanceDate;
    balances[account.id] = {
      opening: toAmount(account.openingBalance),
      received: 0,
      released: 0,
      chequeRecords: 0,
      transfersIn: 0,
      transfersOut: 0,
      manualCredits: 0,
      manualDebits: 0,
      current: 0,
    };
  });

  ledger.forEach((entry) => {
    const balance = balances[entry.accountId];
    if (!balance) return;

    // Already included in the opening balance.
    if (isBeforeOpeningDay(openingDates[entry.accountId], entry.day)) return;

    switch (entry.kind) {
      case "invoice_payment":
        balance.received += entry.credit - entry.debit;
        break;
      case "budget_request":
      case "purchase_order":
      case "claim_reimbursement":
      case "meeting_reimbursement":
        balance.released += entry.debit;
        break;
      case "record":
        balance.chequeRecords += entry.debit;
        break;
      case "transfer_out":
        balance.transfersOut += entry.debit;
        break;
      case "transfer_in":
        balance.transfersIn += entry.credit;
        break;
      case "manual":
        balance.manualCredits += entry.credit;
        balance.manualDebits += entry.debit;
        break;
    }
  });

  Object.values(balances).forEach((balance) => {
    balance.current = roundMoney(
      balance.opening +
        balance.received -
        balance.released -
        balance.chequeRecords +
        balance.transfersIn -
        balance.transfersOut +
        balance.manualCredits -
        balance.manualDebits,
    );
  });

  return balances;
}
