// // Calculates each payment account's balance from the transactions that
// // reference it, instead of trusting the stored `currentBalance` field (which is
// // only updated by account transfers, not by payments received or released).
// //
// //   current = opening + received - released - cheque records
// //             + transfers in - transfers out

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
//   accounts: Array<{ id: string; openingBalance?: number }>,
//   sources: AccountBalanceSources,
// ): Record<string, AccountBalanceBreakdown> {
//   const balances: Record<string, AccountBalanceBreakdown> = {};

//   accounts.forEach((account) => {
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
//   ) => {
//     const balance = balances[accountId];
//     if (!balance || !(amount > 0)) return;

//     balance[field] += amount;
//   };

//   sources.payments.forEach((payment) => {
//     if (isVoided(payment)) return;

//     add(
//       String(payment?.depositTo || "").trim(),
//       "received",
//       toAmount(payment?.amount, payment?.actualReceivedAmount),
//     );
//   });

//   sources.releaseDocuments.forEach((document) => {
//     // Sales meeting updates keep the reimbursement in a nested object.
//     const source = document?.reimbursement?.enabled
//       ? document.reimbursement
//       : document;

//     getAccountReleaseEntries(source).forEach((entry) => {
//       add(getEntryAccountId(entry), "released", getReleaseAmount(entry));
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
//     );
//   });

//   sources.transfers.forEach((transfer) => {
//     if (String(transfer?.status || "completed").toLowerCase() !== "completed") {
//       return;
//     }

//     const amount = toAmount(transfer?.amount);

//     add(String(transfer?.fromAccountId || "").trim(), "transfersOut", amount);
//     add(String(transfer?.toAccountId || "").trim(), "transfersIn", amount);
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

// Calculates each payment account's balance from the transactions that
// reference it, instead of trusting the stored `currentBalance` field (which is
// only updated by account transfers, not by payments received or released).
//
//   current = opening + received - released - cheque records
//             + transfers in - transfers out
//
// When an account has an opening balance date, the opening balance is the
// balance on that day, so only transactions dated on or after it are counted.
// Transactions with no usable date are always counted.

export type AccountBalanceBreakdown = {
  opening: number;
  received: number;
  released: number;
  chequeRecords: number;
  transfersIn: number;
  transfersOut: number;
  current: number;
};

export type AccountBalanceSources = {
  // Panels/IEDGE-SYSTEM/payments: invoice payments received (depositTo).
  payments: any[];
  // Panels/IEDGE-SYSTEM/accountTransfers.
  transfers: any[];
  // Documents whose payment releases can be charged to an account:
  // invoiceRequests, PO, claimReimbursements and meetingUpdates.
  releaseDocuments: any[];
  // Panels/IEDGE-SYSTEM/Record: cheque records.
  records: any[];
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

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const padDatePart = (value: number) => String(value).padStart(2, "0");

// Local calendar day (YYYY-MM-DD) of the first usable stored date: a Firestore
// Timestamp, Date, epoch millis or date string. "" when none is usable.
const toDayKey = (...values: any[]) => {
  for (const value of values) {
    if (value === undefined || value === null || value === "") continue;

    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
      return value.trim();
    }

    const date =
      typeof value?.toDate === "function"
        ? value.toDate()
        : value instanceof Date
          ? value
          : typeof value?.seconds === "number"
            ? new Date(value.seconds * 1000)
            : new Date(value);

    if (!(date instanceof Date) || Number.isNaN(date.getTime())) continue;

    return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(
      date.getDate(),
    )}`;
  }

  return "";
};

const isVoided = (source: any) =>
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

  if (
    getEntryAccountId(source) &&
    String(source.paymentStatus || "").toLowerCase() === "paid" &&
    toAmount(source.paidAmount) > 0
  ) {
    return [{ ...source, amount: toAmount(source.paidAmount) }];
  }

  return [];
}

export function calculateAccountBalances(
  accounts: Array<{
    id: string;
    openingBalance?: number;
    openingBalanceDate?: string;
  }>,
  sources: AccountBalanceSources,
): Record<string, AccountBalanceBreakdown> {
  const balances: Record<string, AccountBalanceBreakdown> = {};
  const openingDays: Record<string, string> = {};

  accounts.forEach((account) => {
    openingDays[account.id] = toDayKey(account.openingBalanceDate);
    balances[account.id] = {
      opening: toAmount(account.openingBalance),
      received: 0,
      released: 0,
      chequeRecords: 0,
      transfersIn: 0,
      transfersOut: 0,
      current: 0,
    };
  });

  const add = (
    accountId: string,
    field: Exclude<keyof AccountBalanceBreakdown, "opening" | "current">,
    amount: number,
    day: string,
  ) => {
    const balance = balances[accountId];
    if (!balance || !(amount > 0)) return;

    // Already included in the opening balance.
    const openingDay = openingDays[accountId];
    if (openingDay && day && day < openingDay) return;

    balance[field] += amount;
  };

  sources.payments.forEach((payment) => {
    if (isVoided(payment)) return;

    add(
      String(payment?.depositTo || "").trim(),
      "received",
      toAmount(payment?.amount, payment?.actualReceivedAmount),
      toDayKey(payment?.paymentDate, payment?.createdAt),
    );
  });

  sources.releaseDocuments.forEach((document) => {
    // Sales meeting updates keep the reimbursement in a nested object.
    const source = document?.reimbursement?.enabled
      ? document.reimbursement
      : document;

    getAccountReleaseEntries(source).forEach((entry) => {
      add(
        getEntryAccountId(entry),
        "released",
        getReleaseAmount(entry),
        toDayKey(
          entry?.releasedAt,
          entry?.paymentDate,
          entry?.createdAt,
          entry?.paymentReleasedAt,
          source?.paymentReleasedAt,
          source?.updatedAt,
          source?.submittedAt,
        ),
      );
    });
  });

  sources.records.forEach((record) => {
    if (isVoided(record)) return;

    // Vendor manual payments also write each allocation into the PO payment
    // history (counted above), so their summary Record is skipped here.
    if (record?.sourceType === "po_manual_payment") return;

    // Only cheque records drawn on a Payment Account; older records point at
    // the separate Cheque/Online account lists.
    if (record?.accountSource !== "paymentAccounts") return;

    add(
      String(record?.accountId || "").trim(),
      "chequeRecords",
      toAmount(record?.chequeAmount),
      toDayKey(
        record?.chequeDate,
        record?.selectedDate,
        record?.createdAt,
        record?.updatedAt,
      ),
    );
  });

  sources.transfers.forEach((transfer) => {
    if (String(transfer?.status || "completed").toLowerCase() !== "completed") {
      return;
    }

    const amount = toAmount(transfer?.amount);
    const day = toDayKey(transfer?.createdAt, transfer?.createdAtISO);

    add(
      String(transfer?.fromAccountId || "").trim(),
      "transfersOut",
      amount,
      day,
    );
    add(String(transfer?.toAccountId || "").trim(), "transfersIn", amount, day);
  });

  Object.values(balances).forEach((balance) => {
    balance.current = roundMoney(
      balance.opening +
        balance.received -
        balance.released -
        balance.chequeRecords +
        balance.transfersIn -
        balance.transfersOut,
    );
  });

  return balances;
}
