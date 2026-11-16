import { collection, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Estimate } from "@/types";

// Edit history and copies for estimates.
//
// Every in-place edit (and inline status change) writes one entry to
// Panels/IEDGE-SYSTEM/estimates/{id}/editHistory listing the fields that
// changed, who changed them and when. Saving an edit as a copy leaves the
// original untouched and writes a "copy" entry on the original instead.
// Creating an invoice from an estimate writes an "invoice" entry on it.
// Copies are numbered from the original: IE-200123-1, IE-200123-2, …

export type EstimateCopyPurpose = "revision" | "invoice";

// What the person chose in the popup shown before the edit form opens.
// A copy always starts from the estimate's own fields.
export type EstimateEditChoice =
  | { kind: "edit" }
  | { kind: "copy"; purpose: EstimateCopyPurpose };

export interface EstimateChange {
  field: string;
  label: string;
  before: string;
  after: string;
}

export interface EstimateHistoryEntry {
  id: string;
  type: "edit" | "status" | "copy" | "invoice";
  editedAt?: any;
  editedById?: string;
  editedByName?: string;
  editedByEmail?: string;
  isCreator?: boolean;
  editNumber?: number;
  changes?: EstimateChange[];
  copyEstimateId?: string;
  copyEstimateNo?: string;
  copyPurpose?: EstimateCopyPurpose;
}

export interface EstimateEditor {
  id: string;
  name: string;
  email: string;
}

export const estimateHistoryCollection = (estimateId: string) =>
  collection(db, "Panels", "IEDGE-SYSTEM", "estimates", estimateId, "editHistory");

export const newEstimateHistoryRef = (estimateId: string) =>
  doc(estimateHistoryCollection(estimateId));

// Per-original counter for copy numbers, so a deleted copy's number is never reused.
export const estimateCopyCounterRef = (rootEstimateId: string) =>
  doc(
    db,
    "Panels",
    "IEDGE-SYSTEM",
    "counters",
    "estimateCopies",
    "estimates",
    rootEstimateId,
  );

export const buildHistoryEntry = (
  editor: EstimateEditor,
  creatorId: string,
  entry: Omit<
    EstimateHistoryEntry,
    "id" | "editedAt" | "editedById" | "editedByName" | "editedByEmail" | "isCreator"
  >,
) => ({
  ...entry,
  editedAt: serverTimestamp(),
  editedById: editor.id,
  editedByName: editor.name,
  editedByEmail: editor.email,
  isCreator: Boolean(creatorId) && creatorId === editor.id,
});

export const getEstimateCreatorId = (estimate: any) =>
  String(estimate?.createdBy || estimate?.createdById || estimate?.userId || "");

// The original an estimate belongs to: itself, or the estimate it was copied from.
export const getEstimateRoot = (estimate: Estimate) => ({
  id: String(estimate.copyOfEstimateId || estimate.id || ""),
  estimateNo: String(estimate.copyOfEstimateNo || estimate.estimateNo || ""),
});

export const formatHistoryDateTime = (value: any) => {
  if (!value) return "";

  let d: Date | null = null;

  if (value instanceof Date) d = value;
  else if (typeof value?.toDate === "function") d = value.toDate();
  else if (typeof value?.seconds === "number") d = new Date(value.seconds * 1000);
  else if (typeof value === "string" || typeof value === "number") d = new Date(value);

  if (!d || Number.isNaN(d.getTime())) return "";

  return `${d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

const text = (v: any) => String(v ?? "").trim();
const yesNo = (v: any, fallback: boolean) =>
  (typeof v === "boolean" ? v : fallback) ? "Yes" : "No";
const money = (v: any) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return `Rs ${n.toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;
};
const plainNumber = (v: any) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return text(v);
  return n.toLocaleString("en-PK", { maximumFractionDigits: 2 });
};

type FieldSpec = { field: string; label: string; read: (e: any) => string };

const ESTIMATE_FIELDS: FieldSpec[] = [
  { field: "projectCode", label: "Project Code", read: (e) => text(e.projectCode || e.linkedProjectCode || e.salesProjectCode) },
  { field: "client", label: "Client", read: (e) => text(e.client) },
  { field: "address", label: "Client Address", read: (e) => text(e.address) },
  { field: "info", label: "Client Info", read: (e) => text(e.info) },
  { field: "date", label: "Issue Date", read: (e) => text(e.date) },
  { field: "expiryDate", label: "Expiry Date", read: (e) => text(e.expiryDate) },
  { field: "projectOwner", label: "Project Owner", read: (e) => text(e.projectOwner) },
  { field: "subject", label: "Subject", read: (e) => text(e.subject) },
  { field: "poNumber", label: "PO Number", read: (e) => text(e.poNumber) },
  { field: "paymentTerm", label: "Payment Terms", read: (e) => text(e.paymentTerm) },
  { field: "company", label: "Company", read: (e) => text(e.company) },
  { field: "taxType", label: "Tax Type", read: (e) => text(e.taxType) },
  { field: "status", label: "Status", read: (e) => text(e.status || "RFQ Sent") },
  { field: "approvalReceivedOn", label: "Approval Received On", read: (e) => text(e.approvalReceivedOn) },
  { field: "message", label: "Message", read: (e) => text(e.message) },
  { field: "termsConditionTitle", label: "Terms & Conditions", read: (e) => text(e.termsConditionTitle || e.termsTitle) },
  { field: "termsConditionText", label: "Terms & Conditions Text", read: (e) => text(e.termsConditionText || e.termsCondition) },
  { field: "withLogo", label: "Show Logo", read: (e) => yesNo(e.withLogo, true) },
  { field: "addCurrencies", label: "Add Currencies", read: (e) => yesNo(e.addCurrencies, false) },
  { field: "currency1Code", label: "Currency 1", read: (e) => (e.addCurrencies ? text(e.currency1Code) : "") },
  { field: "usdRate", label: "Currency 1 Rate (PKR)", read: (e) => (e.addCurrencies ? plainNumber(e.usdRate) : "") },
  { field: "currency2Code", label: "Currency 2", read: (e) => (e.addCurrencies ? text(e.currency2Code) : "") },
  { field: "euroRate", label: "Currency 2 Rate (PKR)", read: (e) => (e.addCurrencies ? plainNumber(e.euroRate) : "") },
  { field: "perPaxCost", label: "Per Pax Cost", read: (e) => yesNo(e.perPaxCost, false) },
  { field: "numberOfPax", label: "Number of Pax", read: (e) => (e.perPaxCost ? plainNumber(e.numberOfPax) : "") },
  { field: "subtotal", label: "Subtotal", read: (e) => money(e.subtotal ?? 0) },
  { field: "tax", label: "Tax", read: (e) => money(e.tax ?? 0) },
  { field: "whtTotal", label: "WHT", read: (e) => money(e.whtTotal ?? 0) },
  { field: "total", label: "Total", read: (e) => money(e.total ?? 0) },
];

const SERVICE_FIELDS: FieldSpec[] = [
  { field: "detail", label: "Service", read: (s) => text(s.detail) },
  { field: "description", label: "Description", read: (s) => text(s.description) },
  { field: "units", label: "Units", read: (s) => plainNumber(s.units ?? 0) },
  {
    field: "rate",
    label: "Rate",
    read: (s) =>
      s.rateMode === "percent" ? `${plainNumber(s.rate ?? 0)}%` : money(s.rate ?? 0),
  },
  { field: "taxLabel", label: "Tax", read: (s) => text(s.taxLabel) },
  { field: "whtLabel", label: "WHT", read: (s) => text(s.whtLabel) },
  { field: "showFinancialsInPdf", label: "Show amounts in PDF", read: (s) => yesNo(s.showFinancialsInPdf, true) },
];

const describeService = (s: any) => {
  const name = text(s.detail) || "Untitled service";
  const rate = SERVICE_FIELDS.find((f) => f.field === "rate")!.read(s);
  return `${name} (${plainNumber(s.units ?? 0)} × ${rate})`;
};

const listServiceNames = (rows: any[]) =>
  rows
    .map((s, i) => `${i + 1}. ${text(s?.detail) || "Untitled service"}`)
    .join("\n");

// Service rows are matched by rowId. Rows saved before rowIds were stored
// have none, so those are matched by position instead.
const diffServices = (beforeRows: any[], afterRows: any[]): EstimateChange[] => {
  const changes: EstimateChange[] = [];
  const usedBefore = new Set<number>();
  // Before-index of each matched row, in its new order; used to spot dragged rows.
  const matchedOrder: number[] = [];

  afterRows.forEach((row, index) => {
    let beforeIndex = beforeRows.findIndex(
      (old, i) => !usedBefore.has(i) && old?.rowId && old.rowId === row?.rowId,
    );
    if (beforeIndex < 0 && beforeRows[index] && !beforeRows[index].rowId && !usedBefore.has(index)) {
      beforeIndex = index;
    }

    if (beforeIndex < 0) {
      changes.push({ field: "services", label: "Service added", before: "", after: describeService(row) });
      return;
    }

    usedBefore.add(beforeIndex);
    matchedOrder.push(beforeIndex);
    const old = beforeRows[beforeIndex];
    const name = text(row?.detail) || text(old?.detail) || `Row ${index + 1}`;

    for (const spec of SERVICE_FIELDS) {
      const before = spec.read(old ?? {});
      const after = spec.read(row ?? {});
      if (before !== after) {
        changes.push({ field: `services.${spec.field}`, label: `${name} · ${spec.label}`, before, after });
      }
    }
  });

  beforeRows.forEach((old, i) => {
    if (!usedBefore.has(i)) {
      changes.push({ field: "services", label: "Service removed", before: describeService(old), after: "" });
    }
  });

  if (matchedOrder.some((beforeIndex, i) => i > 0 && beforeIndex < matchedOrder[i - 1])) {
    changes.push({
      field: "services.order",
      label: "Service order",
      before: listServiceNames([...matchedOrder].sort((a, b) => a - b).map((i) => beforeRows[i])),
      after: listServiceNames(matchedOrder.map((i) => beforeRows[i])),
    });
  }

  return changes;
};

export const diffEstimates = (before: any, after: any): EstimateChange[] => {
  const changes: EstimateChange[] = [];

  for (const spec of ESTIMATE_FIELDS) {
    const b = spec.read(before ?? {});
    const a = spec.read(after ?? {});
    if (b !== a) changes.push({ field: spec.field, label: spec.label, before: b, after: a });
  }

  const beforeRows = Array.isArray(before?.services) ? before.services : [];
  const afterRows = Array.isArray(after?.services) ? after.services : [];
  return [...changes, ...diffServices(beforeRows, afterRows)];
};
