// How each employee in an approved payroll is paid, and the letters that go to
// the bank. Pure logic only, so it can be tested without Firebase or a browser.
import numberToWords from "number-to-words";
import { z } from "zod";
import { roundMoney, type SalaryEmployee } from "./salaryModel";

export const SALARY_PAYMENT_METHODS = [
  { value: "rtgs", label: "RTGS/RAAST" },
  { value: "cheque", label: "Cheque" },
  { value: "cash", label: "Cash" },
  { value: "transfer", label: "Transfer" },
] as const;
export type SalaryPaymentMethod = (typeof SALARY_PAYMENT_METHODS)[number]["value"];

const line = z.string().trim().max(300);
const accountSchema = z.object({
  key: z.string().min(1).max(200),
  accountTitle: line, accountNumber: line, bank: line, branch: line, city: line,
});
export type SalaryFromAccount = z.infer<typeof accountSchema>;

export const salaryPaymentSchema = z.object({
  method: z.enum(["rtgs", "cheque", "cash", "transfer"]).nullable(),
  fromAccount: accountSchema.nullable(),
  chequeNumber: z.string().trim().max(60),
  chequeDate: z.string().regex(/^$|^\d{4}-\d{2}-\d{2}$/, "Enter a valid cheque date."),
  rtgsSerialNo: z.string().trim().max(60),
});
export type SalaryPayment = z.infer<typeof salaryPaymentSchema>;

export const emptySalaryPayment = (): SalaryPayment => ({ method: null, fromAccount: null, chequeNumber: "", chequeDate: "", rtgsSerialNo: "" });

// A Transfer's date is on its letter instead.
export const salaryPaymentRequiresChequeDate = (method: SalaryPaymentMethod | null) => !!method && method !== "transfer";

const salaryAccountId = (account: SalaryFromAccount | null) => account?.key.startsWith("payment:") ? account.key.slice("payment:".length) : "";

/** What is still missing before this employee can be recorded as paid. */
export function salaryPaymentIssues(payment?: SalaryPayment | null): string[] {
  if (!payment?.method) return ["Payment method"];
  const missing: string[] = [];
  // Balances only exist for Finance → Accounts accounts, so salary must come from one.
  if (!salaryAccountId(payment.fromAccount)) missing.push("From account");
  if (!payment.chequeNumber.trim()) missing.push("Cheque number");
  if (salaryPaymentRequiresChequeDate(payment.method) && !payment.chequeDate) missing.push("Cheque date");
  return missing;
}

/** Applies a change. Moving into a Transfer group drops the old number, so the group's is used. */
export function changePayment(current: SalaryPayment, values: Partial<SalaryPayment>): SalaryPayment {
  const next = { ...current, ...values };
  const joinedGroup = next.method === "transfer" && (current.method !== "transfer" || current.fromAccount?.key !== next.fromAccount?.key);
  return joinedGroup && values.chequeNumber === undefined ? { ...next, chequeNumber: "" } : next;
}

/**
 * One transfer is one cheque: everyone paid by Transfer from an account shares a
 * cheque number. The person typing wins; otherwise the first number found is used.
 */
export function sameTransferCheque<T extends { userId: string; payment: SalaryPayment }>(list: T[], typedBy?: string): T[] {
  const numbers = new Map<string, string>();
  for (const { userId, payment } of list) {
    const key = payment.method === "transfer" ? payment.fromAccount?.key : undefined;
    if (!key) continue;
    if (userId === typedBy) numbers.set(key, payment.chequeNumber);
    else if (!numbers.get(key) && payment.chequeNumber.trim() && !list.some((item) => item.userId === typedBy && item.payment.method === "transfer" && item.payment.fromAccount?.key === key)) numbers.set(key, payment.chequeNumber);
  }
  return list.map((item) => {
    const key = item.payment.method === "transfer" ? item.payment.fromAccount?.key : undefined;
    return key ? { ...item, payment: { ...item.payment, chequeNumber: numbers.get(key) ?? "" } } : item;
  });
}

export interface SalaryAccountEntry {
  id: string;
  runId: string;
  month: string;
  method: SalaryPaymentMethod;
  accountId: string;
  accountName: string;
  amount: number;
  date: string;
  chequeNumber: string;
  paymentReference: string;
  description: string;
  employeeIds: string[];
}

/**
 * What a paid run takes out of each account. Fixed IDs mean a run can never be
 * deducted twice. A Transfer is one bank debit, so it is one entry per account;
 * the other methods each clear individually, so each employee is one entry.
 */
export function salaryAccountEntries(runId: string, month: string, rows: SalaryEmployee[], paymentDate: string, paymentReference: string): SalaryAccountEntry[] {
  const entries: SalaryAccountEntry[] = [];
  const transfers = new Map<string, SalaryAccountEntry>();
  for (const row of rows) {
    const payment = row.payment, accountId = salaryAccountId(payment?.fromAccount ?? null);
    if (!payment?.method || !accountId || !(row.calculation.net > 0)) continue;
    const shared = { runId, month, method: payment.method, accountId, accountName: payment.fromAccount!.accountTitle, paymentReference };
    if (payment.method === "transfer") {
      const entry = transfers.get(accountId) ?? { ...shared, id: `${runId}_transfer_${accountId}`, amount: 0, date: paymentDate, chequeNumber: payment.chequeNumber || "", description: "", employeeIds: [] };
      entry.amount = roundMoney(entry.amount + row.calculation.net);
      entry.employeeIds.push(row.userId);
      entry.description = `Salary ${month} - Transfer to ${entry.employeeIds.length} employee${entry.employeeIds.length === 1 ? "" : "s"}`;
      transfers.set(accountId, entry);
      continue;
    }
    const label = SALARY_PAYMENT_METHODS.find((method) => method.value === payment.method)!.label;
    entries.push({
      ...shared, id: `${runId}_${row.userId}`, amount: row.calculation.net,
      date: payment.chequeDate || paymentDate,
      chequeNumber: payment.chequeNumber || "",
      description: `Salary ${month} - ${row.profile.personal.fullName} (${label})`,
      employeeIds: [row.userId],
    });
  }
  return [...entries, ...Array.from(transfers.values())];
}

const titleCase = (text: string) => text.replace(/,/g, "").replace(/\b\w/g, (c) => c.toUpperCase());

/** "Rupees One Million Five Hundred Twenty-Nine Thousand Two Hundred Only" */
export function amountInWords(value: number): string {
  const cents = Math.round(value * 100);
  const rupees = Math.floor(cents / 100), paisa = cents % 100;
  return `Rupees ${titleCase(numberToWords.toWords(rupees))}${paisa ? ` and ${titleCase(numberToWords.toWords(paisa))} Paisa` : ""} Only`;
}

/** "1,529,200", or "99,553.72" when there are paisa. */
export function letterAmount(value: number): string {
  const digits = Number.isInteger(value) ? 0 : 2;
  return value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

// ---------------------------------------------------------------------------
// RTGS / RAAST: one letter per employee
// ---------------------------------------------------------------------------

// "2026-11-05" -> "November 05, 2026", the format RTGS letters use.
function letterDateFrom(isoDate: string) {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "2-digit" });
}

export interface SalaryRtgsDraft {
  userId: string;
  employeeName: string;
  date: string;
  to: { accountTitle: string; address: string; mobileNumber: string; accountNo: string; bank: string; branch: string };
  amount: number;
  inWords: string;
  chequeNumber: string;
}

export function rtgsDraftFor(row: SalaryEmployee): SalaryRtgsDraft {
  const { personal, payroll } = row.profile;
  return {
    userId: row.userId,
    employeeName: personal.fullName,
    date: letterDateFrom(row.payment?.chequeDate ?? ""),
    to: {
      accountTitle: payroll.accountTitle || personal.fullName,
      address: personal.currentAddress || personal.permanentAddress || "",
      mobileNumber: personal.phone || "",
      accountNo: payroll.iban || payroll.accountNumber || "",
      bank: payroll.bankName || "",
      branch: payroll.branchName || "",
    },
    amount: row.calculation.net,
    inWords: amountInWords(row.calculation.net),
    chequeNumber: row.payment?.chequeNumber || "",
  };
}

/** The same fields the RTGS form insists on before it will save a letter. */
export function rtgsDraftIssues(draft: SalaryRtgsDraft): string[] {
  const missing: string[] = [];
  if (!draft.to.accountTitle.trim()) missing.push("Account title");
  if (!draft.to.accountNo.trim()) missing.push("IBAN / account number");
  if (!draft.to.bank.trim()) missing.push("Bank");
  if (!(draft.amount > 0)) missing.push("Amount");
  if (!draft.inWords.trim()) missing.push("Amount in words");
  if (!draft.chequeNumber.trim()) missing.push("Cheque number");
  if (!draft.date.trim()) missing.push("Date");
  return missing;
}

// ---------------------------------------------------------------------------
// Transfer: one letter listing every employee paid from an account
// ---------------------------------------------------------------------------

const letterText = z.string().max(2000);
const letterLine = z.string().max(300);
export const salaryTransferLetterSchema = z.object({
  date: letterLine, addressee: letterLine, bank: letterLine, city: letterLine, subject: letterLine,
  salutation: letterLine, intro: letterText,
  fromHeading: letterLine, accountTitle: letterLine, accountNumber: letterLine, fromBank: letterLine, branch: letterLine,
  amount: letterLine, chequeNumber: letterLine, inWords: letterLine,
  toHeading: letterLine, serialHeader: letterLine, titleHeader: letterLine, accountHeader: letterLine, amountHeader: letterLine,
  rows: z.array(z.object({
    id: z.string().min(1).max(100), accountTitle: letterLine, accountNumber: letterLine,
    amount: z.number().finite().min(0).max(1_000_000_000),
  })).max(500),
  totalText: letterLine,
  closing: letterText, regards: letterLine, signatoryName: letterLine, signatoryDesignation: letterLine, signatoryCompany: letterLine,
});
export type SalaryTransferLetter = z.infer<typeof salaryTransferLetterSchema>;

export const transferLetterTotal = (letter: Pick<SalaryTransferLetter, "rows">) => roundMoney(letter.rows.reduce((sum, row) => sum + row.amount, 0));

/** Refreshes the three figures that repeat the total, after the rows change. */
export function syncTransferTotals(letter: SalaryTransferLetter): SalaryTransferLetter {
  const total = transferLetterTotal(letter);
  return { ...letter, amount: `PKR. ${letterAmount(total)}/-`, totalText: `Rs: ${letterAmount(total)}/-`, inWords: amountInWords(total) };
}

export const transferRowsFor = (rows: SalaryEmployee[], accountKey: string) =>
  rows.filter((row) => row.payment?.method === "transfer" && row.payment.fromAccount?.key === accountKey);

export const payrollTransferTotal = (rows: SalaryEmployee[]) => roundMoney(rows.reduce((sum, row) => sum + row.calculation.net, 0));

export function defaultTransferLetter(rows: SalaryEmployee[], account: SalaryFromAccount, date: string, signatory?: { name: string; designation: string; company: string }): SalaryTransferLetter {
  return syncTransferTotals({
    date, addressee: "The Branch Manager", bank: account.bank, city: account.city,
    subject: `FUNDS TRANSFER – ${account.accountTitle.toUpperCase()}`,
    salutation: "Dear Sir,",
    intro: "With reference to the subject matter, kindly transfer below the mentioned amount in respective accounts:",
    fromHeading: "Transfer Funds From:",
    accountTitle: account.accountTitle, accountNumber: account.accountNumber, fromBank: account.bank, branch: account.branch,
    amount: "", chequeNumber: rows.find((row) => row.payment?.chequeNumber)?.payment?.chequeNumber ?? "", inWords: "",
    toHeading: "Transfer to Following Accounts:",
    serialHeader: "S. No", titleHeader: "Title of Account", accountHeader: "Account Number", amountHeader: "Amount",
    rows: rows.map((row) => ({
      id: row.userId,
      accountTitle: row.profile.payroll.accountTitle || row.profile.personal.fullName,
      accountNumber: row.profile.payroll.accountNumber || row.profile.payroll.iban || "",
      amount: row.calculation.net,
    })),
    totalText: "",
    closing: "Looking forward to your support.", regards: "Best Regards",
    signatoryName: signatory?.name || "", signatoryDesignation: signatory?.designation || "", signatoryCompany: signatory?.company || "",
  });
}

const escapeHtml = (value: unknown) => String(value ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** The printable letter. Styles travel with it because it prints in its own window. */
export function buildTransferLetterHTML(letter: SalaryTransferLetter): string {
  const detail = (label: string, value: string) => `<tr><td class="stl-label">${label}</td><td>${escapeHtml(value)}</td></tr>`;
  const rows = letter.rows.map((row, index) => `<tr>
      <td class="stl-center">${index + 1}</td>
      <td>${escapeHtml(row.accountTitle)}</td>
      <td>${escapeHtml(row.accountNumber)}</td>
      <td class="stl-right">${escapeHtml(letterAmount(row.amount))}</td>
    </tr>`).join("");
  return `<style>
    .stl { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.35; color: #000; padding: 12px 24px; }
    .stl p { margin: 2px 0; }
    .stl-subject { text-align: center; font-weight: bold; text-decoration: underline; margin: 14px 0 !important; }
    .stl-heading { font-weight: bold; text-decoration: underline; margin-top: 10px !important; }
    .stl-details { border-collapse: collapse; margin: 6px 0 6px 12px; }
    .stl-details td { padding: 1px 12px 1px 0; vertical-align: top; }
    .stl-label { font-weight: bold; white-space: nowrap; }
    .stl-list { border-collapse: collapse; width: 100%; margin-top: 6px; }
    .stl-list th, .stl-list td { border: 1px solid #000; padding: 2px 6px; }
    .stl-list th { background: #eee; }
    .stl-center { text-align: center; }
    .stl-right { text-align: right; }
    .stl-sign { margin-top: 34px; }
    .stl-sign-name { border-top: 1px solid #000; display: inline-block; min-width: 220px; padding-top: 4px; font-weight: bold; }
  </style>
  <div class="stl">
    <p><strong>Dated:</strong> ${escapeHtml(letter.date)}</p>
    <br />
    <p><strong>${escapeHtml(letter.addressee)}</strong></p>
    <p><strong>${escapeHtml(letter.bank)},</strong></p>
    <p><strong>${escapeHtml(letter.city)}.</strong></p>
    <p class="stl-subject">${escapeHtml(letter.subject)}</p>
    <p>${escapeHtml(letter.salutation)}</p>
    <p>${escapeHtml(letter.intro)}</p>
    <p class="stl-heading">${escapeHtml(letter.fromHeading)}</p>
    <table class="stl-details">
      ${detail("Account Title:", letter.accountTitle)}
      ${detail("Account Number:", letter.accountNumber)}
      ${detail("Bank:", letter.fromBank)}
      ${detail("Branch:", letter.branch)}
      ${detail("Amount:", letter.amount)}
      ${detail("Cheque number:", letter.chequeNumber)}
      ${detail("In Words:", letter.inWords)}
    </table>
    <p class="stl-heading">${escapeHtml(letter.toHeading)}</p>
    <table class="stl-list">
      <thead><tr>
        <th>${escapeHtml(letter.serialHeader)}</th><th>${escapeHtml(letter.titleHeader)}</th>
        <th>${escapeHtml(letter.accountHeader)}</th><th>${escapeHtml(letter.amountHeader)}</th>
      </tr></thead>
      <tbody>${rows}
        <tr><td colspan="3" class="stl-right"><strong>Total</strong></td><td class="stl-right"><strong>${escapeHtml(letter.totalText)}</strong></td></tr>
        <tr><td colspan="4" class="stl-center"><strong>${escapeHtml(letter.inWords)}</strong></td></tr>
      </tbody>
    </table>
    <br />
    <p>${escapeHtml(letter.closing)}</p>
    <p>${escapeHtml(letter.regards)}</p>
    <div class="stl-sign">
      <p class="stl-sign-name">${escapeHtml(letter.signatoryName)}</p>
      <p>${escapeHtml(letter.signatoryDesignation)}</p>
      <p>${escapeHtml(letter.signatoryCompany)}</p>
    </div>
  </div>`;
}
