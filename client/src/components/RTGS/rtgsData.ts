// Shared data layer for the RTGS module.
//
// RTGS data lives in the same Firebase project as the rest of the app, under
// the paths the standalone RTGS app (still in daily use) already reads and
// writes. Every path, document ID and field name here must stay exactly as
// that app expects so both apps keep sharing letters, vendors and serials.
import {
  collection,
  doc,
  documentId,
  getDocs,
  query,
  runTransaction,
  setDoc,
  where,
  type DocumentReference,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { fetchPaymentAccounts } from "@/lib/payments/paymentAccounts";
import {
  matchPaymentAccount,
  preparePaymentWrites,
  type RtgsLinkedPayment,
  type RtgsPaymentPlan,
} from "./rtgsPayables";
import { prepareTransferWrites, type RtgsLetterTransfer, type RtgsTransferPlan } from "./rtgsTransfer";

export const RTGS_ROOT = "rtgs-panel/rtgs-record";

export const RTGS_PATHS = {
  iedgeAccounts: `${RTGS_ROOT}/iedge-records`,
  vendors: `${RTGS_ROOT}/vendors-records`,
  signatures: `${RTGS_ROOT}/signature`,
  usedSerials: "used-serials",
  iedgeForms: `${RTGS_ROOT}/iedgeforms`,
  travelForms: `${RTGS_ROOT}/travel-tourism-forms`,
  otherForms: `${RTGS_ROOT}/other-forms`,
} as const;

// Roles allowed into the RTGS module (sidebar + routes).
export const RTGS_ROLES = [
  "main_admin",
  "financial_admin",
  "finance_admin",
  "finance",
] as const;

export function canAccessRtgs(role: unknown): boolean {
  const normalized = String(role || "").trim().toLowerCase();
  return (RTGS_ROLES as readonly string[]).includes(normalized);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** An account record in rtgs-panel/rtgs-record/iedge-records (ID 1001, 1002, …). */
export interface IedgeAccount {
  id: string;
  accountTitle: string;
  accountNumber?: string;
  bank?: string;
  branch?: string;
  city?: string;
  prefix?: string;
}

/** An account from this app, linked to its RTGS account ID. */
export interface RtgsFromAccount {
  /** "payment:<id>" (Finance → Accounts) or "cheque:<id>" (older cheque accounts). */
  key: string;
  /** The Finance → Accounts account, when it is one. */
  paymentAccountId: string | null;
  /** null until the account is first used in a saved letter. */
  rtgsId: string | null;
  accountTitle: string;
  accountNumber: string;
  bank: string;
  branch: string;
  city: string;
}

export interface RtgsVendor {
  id: string;
  accountTitle: string;
  address: string;
  mobileNumber: string;
  accountNo: string;
  bank: string;
  branch: string;
}

export interface RtgsSignature {
  id: string;
  name: string;
  designation: string;
  company: string;
  phoneNumber: string;
  email: string;
  recordId?: string;
}

export interface RtgsSignatory {
  id: string;
  name: string;
  designation: string;
  company: string;
  contact: string;
}

export interface RtgsLetterFrom {
  accountTitle?: string;
  accountNumber?: string;
  bank?: string;
  branch?: string;
  city?: string;
  chequeNumber?: string;
  amount?: string;
  inWords?: string;
}

export interface RtgsLetterTo {
  accountTitle?: string;
  address?: string;
  mobileNumber?: string;
  accountNo?: string;
  bank?: string;
  branch?: string;
}

export interface RtgsRecord {
  id: string;
  serialNo?: string;
  date?: string;
  prefix?: string;
  from?: RtgsLetterFrom;
  to?: RtgsLetterTo;
  signatories?: RtgsSignatory[];
  // Nested shape is what the original app writes; kept for compatibility.
  createdby?: {
    firstName?: { firstName?: string };
    lastName?: { lastName?: string };
  };
  letterHTML?: string;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  // Set only by this app, when the letter paid budget requests / POs.
  projectCode?: string;
  linkedPayments?: RtgsLinkedPayment[];
  paymentAccountId?: string;
  paymentAccountName?: string;
  // Set only by this app, when the letter was an account to account transfer.
  transfer?: RtgsLetterTransfer;
  /** Client-side only: which iedge account the record belongs to. */
  accountId?: string;
  /** Client-side only: the collection the record was read from. */
  sourceCollection?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const normalizeAccountNumber = (value: unknown) =>
  String(value || "")
    .replace(/[^0-9a-z]/gi, "")
    .toUpperCase();

const normalizeTitle = (value: unknown) =>
  String(value || "").trim().toLowerCase();

const byNumericId = <T extends { id: string }>(a: T, b: T) => {
  const first = Number(a.id);
  const second = Number(b.id);
  if (!Number.isNaN(first) && !Number.isNaN(second)) return first - second;
  return a.id.localeCompare(b.id);
};

export const nextNumericId = (ids: Array<string | number | undefined>, start = 1001) => {
  const numbers = ids
    .map((id) => Number.parseInt(String(id ?? ""), 10))
    .filter((id) => !Number.isNaN(id));
  return numbers.length > 0 ? Math.max(...numbers) + 1 : start;
};

/** Serial prefix: IE / IE T&T for the two original accounts, initials otherwise. */
export function accountPrefix(account: {
  id?: string | null;
  accountTitle?: string;
  prefix?: string;
}): string {
  if (account.id === "1001") return "IE";
  if (account.id === "1002") return "IE T&T";
  if (account.prefix?.trim()) return account.prefix.trim().toUpperCase();

  const initials = String(account.accountTitle || "")
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

  return initials || `ACC${account.id ?? ""}`;
}

/** Where the RTGS form saves letters for an account. */
export function formsCollectionFor(rtgsId: string | null): string {
  if (rtgsId === "1001") return RTGS_PATHS.iedgeForms;
  if (rtgsId === "1002") return RTGS_PATHS.travelForms;
  return RTGS_PATHS.otherForms;
}

export function letterDate(date = new Date()): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
}

export function recordTime(value?: Timestamp | Date): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  return typeof value.toMillis === "function" ? value.toMillis() : 0;
}

export function createdByName(record: RtgsRecord): string {
  return (
    [record.createdby?.firstName?.firstName, record.createdby?.lastName?.lastName]
      .filter(Boolean)
      .join(" ") || "N/A"
  );
}

export function splitDisplayName(displayName: string | undefined | null) {
  const parts = String(displayName || "").trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function fetchIedgeAccounts(): Promise<IedgeAccount[]> {
  const snapshot = await getDocs(collection(db, RTGS_PATHS.iedgeAccounts));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }) as IedgeAccount)
    .sort(byNumericId);
}

// Same account number, or an account number and the IBAN that ends with it.
const sameAccountNumber = (first: unknown, second: unknown) => {
  const a = normalizeAccountNumber(first);
  const b = normalizeAccountNumber(second);
  if (!a || !b) return false;
  if (a === b) return true;
  return Math.min(a.length, b.length) >= 6 && (a.endsWith(b) || b.endsWith(a));
};

/**
 * The "From" accounts: the accounts under Finance → Accounts, plus any older
 * cheque account that isn't one of them (so nothing listed before goes
 * missing). Each is linked to its RTGS account ID by account number or IBAN
 * (falling back to the exact title), which keeps its serial series.
 */
export async function fetchFromAccounts(): Promise<RtgsFromAccount[]> {
  const [paymentAccounts, chequeSnapshot, iedgeAccounts] = await Promise.all([
    fetchPaymentAccounts(),
    getDocs(collection(db, "chequeAccounts")),
    fetchIedgeAccounts(),
  ]);
  const activePaymentAccounts = paymentAccounts.filter((account) => account.isActive !== false);

  const candidates = [
    ...activePaymentAccounts.map((account) => ({
      key: `payment:${account.id}`,
      paymentAccountId: account.id,
      title: account.accountName || account.bankName || "",
      numbers: [account.accountNumber, account.iban],
      bank: account.bankName || "",
      branch: account.branchName || "",
      city: account.city || "",
    })),
    ...chequeSnapshot.docs
      .map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }))
      .filter(
        (account) =>
          account.isActive !== false && !matchPaymentAccount(activePaymentAccounts, String(account.accountNo || "")),
      )
      .map((account) => ({
        key: `cheque:${account.id}`,
        paymentAccountId: null,
        title: String(account.accountTitle || ""),
        numbers: [account.accountNo],
        bank: String(account.bank || ""),
        branch: String(account.branch || ""),
        city: String(account.city || ""),
      })),
  ];

  return candidates
    .map((account) => {
      const match =
        iedgeAccounts.find((item) =>
          account.numbers.some((number) => sameAccountNumber(item.accountNumber, number)),
        ) ||
        iedgeAccounts.find(
          (item) => normalizeTitle(item.accountTitle) === normalizeTitle(account.title),
        );

      return {
        key: account.key,
        paymentAccountId: account.paymentAccountId,
        rtgsId: match?.id ?? null,
        accountTitle: account.title,
        accountNumber: String(account.numbers.find((number) => String(number || "").trim()) || ""),
        bank: account.bank || match?.bank || "",
        branch: account.branch || match?.branch || "",
        city: account.city || match?.city || "",
      };
    })
    .sort((a, b) => {
      // Linked accounts first, in RTGS ID order; new ones after, by title.
      if (a.rtgsId && b.rtgsId) return byNumericId({ id: a.rtgsId }, { id: b.rtgsId });
      if (a.rtgsId) return -1;
      if (b.rtgsId) return 1;
      return a.accountTitle.localeCompare(b.accountTitle);
    });
}

export async function fetchVendors(): Promise<RtgsVendor[]> {
  const snapshot = await getDocs(collection(db, RTGS_PATHS.vendors));
  return snapshot.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        accountTitle: data.accountTitle || "",
        address: data.address || "",
        mobileNumber: data.mobileNumber || "",
        accountNo: data.accountNo || "",
        bank: data.bank || "",
        branch: data.branch || "",
      };
    })
    .sort(byNumericId);
}

export async function fetchSignatures(): Promise<RtgsSignature[]> {
  const snapshot = await getDocs(collection(db, RTGS_PATHS.signatures));
  return snapshot.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name || "",
        designation: data.designation || "",
        company: data.company || "",
        phoneNumber: data.phoneNumber || "",
        email: data.email || "",
        recordId: data.recordId,
      };
    })
    .sort((a, b) => nextNumericId([a.recordId]) - nextNumericId([b.recordId]));
}

/** Every saved letter, tagged with the account it belongs to. */
export async function fetchRecords(iedgeAccounts: IedgeAccount[]): Promise<RtgsRecord[]> {
  const read = async (path: string, accountId?: string) => {
    const snapshot = await getDocs(collection(db, path));
    return snapshot.docs.map(
      (d) =>
        ({
          id: d.id,
          ...d.data(),
          accountId,
          sourceCollection: path,
        }) as RtgsRecord,
    );
  };

  const matchAccount = (record: RtgsRecord) => {
    const title = normalizeTitle(record.from?.accountTitle);
    const prefix = String(record.prefix || "").trim().toUpperCase();
    return iedgeAccounts.find(
      (account) =>
        (title && title === normalizeTitle(account.accountTitle)) ||
        (prefix && prefix === accountPrefix(account)),
    );
  };

  // The original app also reads per-account collections for accounts other
  // than 1001/1002, so those are included even though nothing writes to them yet.
  const otherAccounts = iedgeAccounts.filter(
    (account) => account.id !== "1001" && account.id !== "1002",
  );

  const [iedge, travel, other, ...perAccount] = await Promise.all([
    read(RTGS_PATHS.iedgeForms, "1001"),
    read(RTGS_PATHS.travelForms, "1002"),
    read(RTGS_PATHS.otherForms),
    ...otherAccounts.map((account) =>
      read(`${RTGS_ROOT}/account-${account.id}-forms`, account.id),
    ),
  ]);

  const otherTagged = other.map((record) => ({
    ...record,
    accountId: matchAccount(record)?.id || "unassigned",
  }));

  return [...iedge, ...travel, ...otherTagged, ...perAccount.flat()];
}

// ---------------------------------------------------------------------------
// Serial numbers
// ---------------------------------------------------------------------------

async function serialsWithPrefix(path: string, basePrefix: string): Promise<number[]> {
  const snapshot = await getDocs(
    query(
      collection(db, path),
      where(documentId(), ">=", basePrefix),
      where(documentId(), "<", `${basePrefix}`),
    ),
  );
  return snapshot.docs
    .map((d) => Number.parseInt(d.id.substring(basePrefix.length), 10))
    .filter((serial) => !Number.isNaN(serial));
}

/** Next free serial, e.g. "IE-2026-0042", checking saved letters and used-serials. */
export async function nextSerial(prefix: string, rtgsId: string | null): Promise<string> {
  const basePrefix = `${prefix}-${new Date().getFullYear()}-`;
  const [formSerials, usedSerials] = await Promise.all([
    serialsWithPrefix(formsCollectionFor(rtgsId), basePrefix),
    serialsWithPrefix(RTGS_PATHS.usedSerials, basePrefix),
  ]);
  const next = Math.max(0, ...formSerials, ...usedSerials) + 1;
  return `${basePrefix}${String(next).padStart(4, "0")}`;
}

export class SerialTakenError extends Error {
  constructor(serial: string) {
    super(`Document number ${serial} was just used by someone else.`);
    this.name = "SerialTakenError";
  }
}

/**
 * Links a cheque account to the next RTGS account ID (1003, 1004, …) the first
 * time it is used, so the original app and the RTGS List can label its letters.
 */
export async function ensureRtgsAccountId(account: RtgsFromAccount): Promise<string> {
  if (account.rtgsId) return account.rtgsId;

  const existing = await fetchIedgeAccounts();
  const nextId = String(nextNumericId(existing.map((item) => item.id)));
  await setDoc(doc(db, RTGS_PATHS.iedgeAccounts, nextId), {
    accountTitle: account.accountTitle,
    accountNumber: account.accountNumber,
    bank: account.bank,
    branch: account.branch,
    city: account.city,
  });
  return nextId;
}

/**
 * Saves a letter and marks its serial as used in one transaction, refusing if
 * the serial was taken in the meantime (both apps write to the same series).
 * With a payment plan, the budget requests / POs it pays are marked paid in
 * the same transaction; with a transfer plan, the account transfer is
 * recorded in it. Either way the letter and its effects save together or not
 * at all.
 */
export async function saveLetter(
  rtgsId: string | null,
  serial: string,
  prefix: string,
  payload: Record<string, unknown>,
  { payments, transfer }: { payments?: RtgsPaymentPlan; transfer?: RtgsTransferPlan } = {},
): Promise<void> {
  const path = formsCollectionFor(rtgsId);
  const letterRef = doc(db, path, serial);
  const serialRef = doc(db, RTGS_PATHS.usedSerials, serial);

  await runTransaction(db, async (transaction) => {
    const [letterSnap, serialSnap] = await Promise.all([
      transaction.get(letterRef),
      transaction.get(serialRef),
    ]);
    if (letterSnap.exists() || serialSnap.exists()) {
      throw new SerialTakenError(serial);
    }
    // Firestore needs every transaction read before the first write.
    const extraWrites: Array<{ ref: DocumentReference; data: Record<string, unknown>; create?: boolean }> = [
      ...(payments ? await preparePaymentWrites(transaction, payments) : []),
      ...(transfer ? await prepareTransferWrites(transaction, transfer) : []),
    ];

    transaction.set(letterRef, payload);
    transaction.set(serialRef, {
      used: true,
      prefix,
      createdAt: new Date(),
      path,
    });
    extraWrites.forEach(({ ref, data, create }) =>
      create ? transaction.set(ref, data) : transaction.update(ref, data),
    );
  });
}
