import { MAX_APPLICANTS } from "./constants";
import { dateToIso, isoToDate, parseTypedDate, todayIso } from "./format";
import type { Applicant, ApplicantStatus, QuoteOption } from "./types";

// Application Details: the travellers on an estimate, imported from the
// passport-details Excel sheet. The sheet has one row per applicant under a
// header row like:
//
//   S.no | Full Name | GIVEN NAME | SURNAME | PASSPORT NUMBER |
//   DATE OF EXPIRY | DATE OF BIRTH | Cancel/Refund
//
// Columns are found by their header, so their order doesn't matter and
// common variations (Passport No, DOB, Expiry Date…) are understood.

const newApplicantId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export function createApplicant(overrides: Partial<Applicant> = {}): Applicant {
  return {
    id: newApplicantId(),
    fullName: "",
    givenName: "",
    surname: "",
    passportNumber: "",
    passportExpiry: "",
    dateOfBirth: "",
    status: "",
    ...overrides,
  };
}

/** Collapses spaces and capitalises, as names are on passports: " imran  younas" → "IMRAN YOUNAS". */
export const cleanName = (value: unknown) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();

/** "cc 690 3854" → "CC6903854". */
export const cleanPassportNumber = (value: unknown) =>
  String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

/** The name to show: the full name, else given name and surname. */
export const applicantDisplayName = (applicant: Applicant) =>
  applicant.fullName.trim() || [applicant.givenName, applicant.surname].map((part) => part.trim()).filter(Boolean).join(" ");

/**
 * Reads a status typed in the sheet's Cancel/Refund column. Blank, or
 * anything not recognised, means the booking stands.
 */
export function applicantStatusFromText(value: unknown): ApplicantStatus {
  const text = String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  if (!text) return "";
  if (text.includes("noshow")) return "no-show";
  if (text.includes("nonrefund")) return "cancelled-non-refundable";
  if (text.includes("refund")) return "cancelled-refund";
  if (text.includes("cancel")) return "cancelled";
  return "";
}

/** An Excel date serial (days since 30 Dec 1899) as yyyy-MM-dd. */
export function excelSerialToIso(serial: number): string {
  if (!Number.isFinite(serial) || serial < 1 || serial > 2958465) return "";
  const date = new Date(Math.round((serial - 25569) * 86_400_000));
  return [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()]
    .map((part, index) => String(part).padStart(index === 0 ? 4 : 2, "0"))
    .join("-");
}

/**
 * A birth date is never in the future, so a two-digit year that lands there
 * belongs to the century before: 11-Jul-59 → 1959, not 2059.
 */
export function pastDate(iso: string): string {
  const date = isoToDate(iso);
  if (!date || iso <= todayIso()) return iso;
  date.setFullYear(date.getFullYear() - 100);
  return dateToIso(date);
}

/** A date cell: an Excel date, a JS Date, or text such as 29-Apr-34 or 29/04/2034. */
function sheetDate(value: unknown, birthDate: boolean): string {
  let iso = "";
  if (typeof value === "number") iso = excelSerialToIso(value);
  else if (value instanceof Date && !Number.isNaN(value.getTime())) iso = dateToIso(value);
  else if (String(value ?? "").trim()) iso = parseTypedDate(String(value)) ?? "";
  return birthDate && iso ? pastDate(iso) : iso;
}

type ApplicantColumn = "fullName" | "givenName" | "surname" | "passportNumber" | "passportExpiry" | "dateOfBirth" | "status";

// Header text with everything but letters removed, e.g. "DATE OF EXPIRY" → "dateofexpiry".
const COLUMN_HEADERS: Record<ApplicantColumn, string[]> = {
  fullName: ["fullname", "name", "applicantname", "passengername", "travellername", "travelername"],
  givenName: ["givenname", "givennames", "firstname", "forename"],
  surname: ["surname", "lastname", "familyname"],
  passportNumber: ["passportnumber", "passportno", "passport", "ppno", "ppnumber", "passportnum"],
  passportExpiry: ["dateofexpiry", "expirydate", "passportexpiry", "passportexpirydate", "expiry", "doe", "validtill", "validuntil"],
  dateOfBirth: ["dateofbirth", "dob", "birthdate", "birthday"],
  status: ["cancelrefund", "cancelledrefund", "cancellation", "status", "refund", "cancel"],
};

export const APPLICANT_COLUMN_LABELS: Record<ApplicantColumn, string> = {
  fullName: "Full Name",
  givenName: "Given Name",
  surname: "Surname",
  passportNumber: "Passport Number",
  passportExpiry: "Date of Expiry",
  dateOfBirth: "Date of Birth",
  status: "Cancel/Refund",
};

const headerKey = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

/** Which column each field is in, for one candidate header row. */
function matchHeader(row: unknown[]): Partial<Record<ApplicantColumn, number>> {
  const columns: Partial<Record<ApplicantColumn, number>> = {};
  row.forEach((cell, index) => {
    const key = headerKey(cell);
    if (!key) return;
    const field = (Object.keys(COLUMN_HEADERS) as ApplicantColumn[]).find(
      (name) => columns[name] === undefined && COLUMN_HEADERS[name].includes(key),
    );
    if (field) columns[field] = index;
  });
  return columns;
}

export interface ApplicantImport {
  applicants: Applicant[];
  /** Fields found in the sheet, in its column order. */
  columns: ApplicantColumn[];
  /** Things worth checking before importing, e.g. a row without a passport number. */
  warnings: string[];
  /** Set when nothing could be imported. */
  error: string | null;
}

/** Rows read from a sheet, as arrays of cell values (sheet_to_json with header: 1). */
export function applicantsFromRows(rows: unknown[][]): ApplicantImport {
  const empty = (error: string): ApplicantImport => ({ applicants: [], columns: [], warnings: [], error });

  // The header is the row among the first few that names the most known columns.
  let headerIndex = -1;
  let columns: Partial<Record<ApplicantColumn, number>> = {};
  rows.slice(0, 15).forEach((row, index) => {
    const matched = matchHeader(row);
    if (Object.keys(matched).length > Object.keys(columns).length) {
      headerIndex = index;
      columns = matched;
    }
  });

  const hasName = columns.fullName !== undefined || columns.givenName !== undefined || columns.surname !== undefined;
  if (headerIndex < 0 || !hasName || Object.keys(columns).length < 2) {
    return empty(
      "Couldn't find the header row. The sheet needs columns such as Full Name, Given Name, Surname and Passport Number.",
    );
  }

  const cell = (row: unknown[], field: ApplicantColumn) => {
    const index = columns[field];
    return index === undefined ? "" : row[index];
  };

  const warnings: string[] = [];
  const applicants: Applicant[] = [];
  const seenPassports = new Map<string, number>();

  rows.slice(headerIndex + 1).forEach((row, offset) => {
    const sheetRow = headerIndex + offset + 2;
    const givenName = cleanName(cell(row, "givenName"));
    const surname = cleanName(cell(row, "surname"));
    const fullName = cleanName(cell(row, "fullName")) || [givenName, surname].filter(Boolean).join(" ");
    const passportNumber = cleanPassportNumber(cell(row, "passportNumber"));
    if (!fullName && !passportNumber) return; // blank or a totals row

    const expiryCell = cell(row, "passportExpiry");
    const birthCell = cell(row, "dateOfBirth");
    const applicant = createApplicant({
      fullName,
      givenName,
      surname,
      passportNumber,
      passportExpiry: sheetDate(expiryCell, false),
      dateOfBirth: sheetDate(birthCell, true),
      status: applicantStatusFromText(cell(row, "status")),
    });

    const where = fullName ? `Row ${sheetRow} (${fullName})` : `Row ${sheetRow}`;
    if (!fullName) warnings.push(`${where}: no name.`);
    if (columns.passportNumber !== undefined && !passportNumber) warnings.push(`${where}: no passport number.`);
    if (String(expiryCell ?? "").trim() && !applicant.passportExpiry) warnings.push(`${where}: date of expiry not understood.`);
    if (String(birthCell ?? "").trim() && !applicant.dateOfBirth) warnings.push(`${where}: date of birth not understood.`);
    if (passportNumber) {
      const firstRow = seenPassports.get(passportNumber);
      if (firstRow) warnings.push(`${where}: passport ${passportNumber} is also on row ${firstRow}.`);
      else seenPassports.set(passportNumber, sheetRow);
    }

    applicants.push(applicant);
  });

  if (applicants.length === 0) return empty("The sheet has a header row but no applicants under it.");
  if (applicants.length > MAX_APPLICANTS) {
    return empty(`The sheet has ${applicants.length} applicants; an estimate holds up to ${MAX_APPLICANTS}.`);
  }

  const order = (Object.keys(columns) as ApplicantColumn[]).sort((a, b) => (columns[a] ?? 0) - (columns[b] ?? 0));
  return { applicants, columns: order, warnings, error: null };
}

/**
 * Reads the first sheet of an Excel or CSV file. The xlsx library is loaded
 * only when a file is imported, so it doesn't slow down opening the form.
 */
export async function readApplicantsFile(file: File): Promise<ApplicantImport> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return { applicants: [], columns: [], warnings: [], error: "The file has no sheets." };
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: true, blankrows: false });
  return applicantsFromRows(rows);
}

/** First departure of the first option, the date passports are checked against; "" if none is set. */
export const firstTravelDate = (options: QuoteOption[]) =>
  (options[0]?.flights ?? [])
    .map((segment) => segment.departDate)
    .filter(Boolean)
    .sort()[0] ?? "";

/** True when the passport has expired by `onDate` (yyyy-MM-dd). */
export const passportExpiredBy = (applicant: Applicant, onDate: string) =>
  Boolean(applicant.passportExpiry && onDate && applicant.passportExpiry < onDate);

/** Six months after a date, the validity most countries ask for on arrival. */
export const sixMonthsAfter = (iso: string) => {
  const date = isoToDate(iso);
  if (!date) return "";
  date.setMonth(date.getMonth() + 6);
  return dateToIso(date);
};
