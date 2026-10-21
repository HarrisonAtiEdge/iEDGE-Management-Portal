// Budget requests and purchase orders an RTGS letter can pay, and the
// payment releases that mark them paid.
//
// Payments are recorded exactly as the Budget Requests and Purchase Orders
// pages record them (an entry appended to paymentReleaseHistory plus the
// status and total fields), so those pages, Account Statement and account
// balances pick them up unchanged. Budget requests are paid per vendor, as on
// the Budget Requests page; the vendor grouping here mirrors that page's
// getBudgetVendorGroups / getVendorPaymentEntries / getLinkedPOForVendor, and
// the PO rules mirror POManagementPage. Keep them in step if those change.
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  type DocumentReference,
  type Transaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { PaymentAccount } from "@/lib/payments/types";

const PANEL_ID = "IEDGE-SYSTEM";
const COMBINED_LOCAL_VENDOR_GROUP_KEY = "local-vendors:combined";
const PO_WORKFLOW_CONFIG_ID = "purchase_order_approval";

// Budget request statuses the Budget Requests page allows a payment release in.
const PAYABLE_REQUEST_STATUSES = new Set([
  "approved",
  "po_created",
  "po_submitted",
  "po_approved",
  "po_issued",
  "ready_for_payment",
  "payment_partially_released",
]);

// Finance (who release budget request and PO payments on those pages) and the
// main admin.
const PAYMENT_ROLES = new Set(["finance", "financial_admin", "finance_admin", "main_admin"]);

export function canLinkRtgsPayments(role: unknown): boolean {
  return PAYMENT_ROLES.has(
    String(role || "").toLowerCase().trim().replace(/[\s-]+/g, "_"),
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RtgsPayableKind = "budget_request" | "purchase_order";

/** One vendor's share of a budget request, as the Budget Requests page pays it. */
interface BudgetVendorGroup {
  key: string;
  name: string;
  vendorNames: string[];
  isLocalVendorGroup: boolean;
  supplierId: string;
  supplierNames: string[];
  hasSupplier: boolean;
  items: any[];
  totalAmount: number;
  /** How many vendor groups the request has (changes how history is matched). */
  groupCount: number;
  linkedPoId: string;
  linkedPoNumber: string;
}

export interface RtgsPayable {
  /** "br:<docId>:<vendorKey>" or "po:<docId>". */
  key: string;
  kind: RtgsPayableKind;
  docId: string;
  /** Budget request ID or PO number. */
  number: string;
  title: string;
  vendorName: string;
  projectCode: string;
  approvedAmount: number;
  outstanding: number;
  /** Payables for the same spend (a budget request vendor and its PO). */
  linkedKeys: string[];
  /** Budget requests only. */
  vendorGroup?: BudgetVendorGroup;
  /** Budget requests only: the whole request's approved amount. */
  requestApprovedAmount?: number;
}

export interface RtgsAllocation {
  payable: RtgsPayable;
  amount: number;
  outstandingAfter: number;
}

export interface RtgsPaymentPlan {
  serialNo: string;
  projectCode: string;
  /** The letter's "To" account title. */
  payeeName: string;
  chequeNumber: string;
  account: PaymentAccount;
  allocations: RtgsAllocation[];
  actor: { id: string; name: string; email: string };
}

/** What the letter stores about each payment it made. */
export interface RtgsLinkedPayment {
  kind: RtgsPayableKind;
  docId: string;
  number: string;
  vendorName: string;
  releaseId: string;
  outstandingBefore: number;
  amount: number;
  outstandingAfter: number;
}

export class PayablesChangedError extends Error {
  constructor(number: string) {
    super(`${number} was paid or changed by someone else since it was loaded.`);
    this.name = "PayablesChangedError";
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const normalizeText = (value: unknown) => String(value || "").toLowerCase().trim();

const normalizeCode = (value: unknown) => String(value || "").trim().toUpperCase();

const firstText = (values: unknown[]) => {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return "";
};

const safeNumber = (value: unknown) => {
  const parsed = Number(String(value ?? 0).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

export const roundMoney = (value: unknown) => Math.round(safeNumber(value) * 100) / 100;

const normalizeVendorIdentity = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const releaseAmount = (entry: any) =>
  roundMoney(entry?.amount ?? entry?.releaseAmount ?? entry?.releasedAmount ?? entry?.paymentAmount ?? 0);

const sumReleases = (entries: any[]) =>
  roundMoney(entries.reduce((sum, entry) => sum + releaseAmount(entry), 0));

function releaseHistory(source: any): any[] {
  const history = Array.isArray(source?.paymentReleaseHistory) ? source.paymentReleaseHistory : [];
  if (history.length > 0) return history.filter((entry: any) => releaseAmount(entry) > 0);

  const legacy = source?.paymentDetails || source?.latestPaymentRelease;
  return legacy && releaseAmount(legacy) > 0 ? [legacy] : [];
}

const releaseType = (releasedBefore: number, fullyReleased: boolean) =>
  releasedBefore <= 0 ? (fullyReleased ? "full" : "advance") : fullyReleased ? "final" : "partial";

export const releaseIdFor = (serialNo: string, index: number) => `${serialNo}-${index + 1}`;

export const formatRs = (value: number) =>
  `Rs ${roundMoney(value).toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;

const normalizeAccountNumber = (value: unknown) => String(value ?? "").replace(/[^a-z0-9]/gi, "").toUpperCase();

/**
 * The payment account (Accounts tab) for an RTGS "From" cheque account, by
 * account number or IBAN, matched the same way Account Statement matches them.
 */
export function matchPaymentAccount(accounts: PaymentAccount[], accountNumber: string | undefined) {
  const key = normalizeAccountNumber(accountNumber);
  if (!key) return null;

  const numbers = (account: PaymentAccount) =>
    [account.accountNumber, account.iban].map(normalizeAccountNumber).filter(Boolean);

  return (
    accounts.find((account) => numbers(account).includes(key)) ||
    (key.length >= 6
      ? accounts.find((account) => numbers(account).some((saved) => saved.endsWith(key) || key.endsWith(saved)))
      : undefined) ||
    null
  );
}

// --- Budget requests (mirrors BudgetRequests.tsx) --------------------------

function requestItems(request: any): any[] {
  const sources = [request?.items, request?.lineItems, request?.approvalItems].map((items) =>
    Array.isArray(items) ? items : [],
  );
  const [items, lineItems, approvalItems] = sources;
  const available = sources.filter((list) => list.length > 0);
  if (available.length === 0) return [];

  const base = available.reduce((longest, current) => (current.length > longest.length ? current : longest));
  const match = (source: any[], item: any, index: number) => {
    if (item?.id !== null && item?.id !== undefined) {
      const byId = source.find((candidate) => String(candidate?.id) === String(item.id));
      if (byId) return byId;
    }
    return source[index];
  };

  return base.map((item: any, index: number) => ({
    ...(match(approvalItems, item, index) || {}),
    ...(match(lineItems, item, index) || {}),
    ...(match(items, item, index) || {}),
  }));
}

const requestApprovedAmount = (request: any) =>
  roundMoney(
    request?.approvedAmount ??
      request?.totalApprovedAmount ??
      request?.approvedTotal ??
      request?.totalAmount ??
      request?.amount ??
      0,
  );

function isRequestFullyPaid(request: any): boolean {
  const approved = requestApprovedAmount(request);
  const explicitReleased = roundMoney(request?.totalReleasedAmount);
  const released = explicitReleased > 0 ? explicitReleased : sumReleases(releaseHistory(request));
  const remaining =
    request?.remainingReleaseAmount !== undefined && request?.remainingReleaseAmount !== null
      ? roundMoney(Math.max(safeNumber(request.remainingReleaseAmount), 0))
      : roundMoney(Math.max(approved - released, 0));

  if (approved > 0 && (remaining <= 0.009 || released >= approved - 0.009)) return true;

  const paymentStatus = normalizeText(request?.paymentStatus || request?.releasePaymentStatus);
  return Boolean(
    normalizeText(request?.status) === "payment_released" ||
      paymentStatus === "released" ||
      paymentStatus === "payment_released" ||
      request?.paymentReleasedAt ||
      request?.releasePaymentAt,
  );
}

function isRequestPayable(request: any): boolean {
  return (
    PAYABLE_REQUEST_STATUSES.has(normalizeText(request?.status)) &&
    !request?.expenseSubmitted &&
    !isRequestFullyPaid(request)
  );
}

const supplierNames = (supplier: any): string[] =>
  [supplier?.supplierName, supplier?.vendorName, supplier?.name, supplier?.companyName, supplier?.businessName, supplier?.title]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

const itemVendorName = (item: any) =>
  firstText([
    item?.vendor,
    item?.vendorName,
    item?.supplier,
    item?.supplierName,
    item?.payee,
    item?.payeeName,
    item?.original?.vendor,
    item?.original?.vendorName,
    item?.original?.supplier,
    item?.original?.supplierName,
  ]);

const itemSupplierId = (item: any) =>
  firstText([
    item?.supplierId,
    item?.vendorId,
    item?.supplierDocId,
    item?.vendorDocId,
    item?.original?.supplierId,
    item?.original?.vendorId,
  ]);

function itemApprovedAmount(item: any): number {
  const units = safeNumber(item?.approvedUnits ?? item?.units ?? item?.quantity ?? item?.qty);
  const rate = safeNumber(item?.approvedUnitRate ?? item?.unitRate ?? item?.rate ?? item?.price);
  const tax = safeNumber(item?.tax ?? item?.taxAmount);
  return roundMoney(item?.approvedTotal ?? item?.approvedAmount ?? item?.total ?? item?.amount ?? units * rate + tax);
}

function findSupplier(suppliers: any[], name: string, supplierId: string): any | null {
  if (supplierId) {
    const byId = suppliers.find((supplier) => String(supplier?.id || "") === supplierId);
    if (byId) return byId;
  }
  const normalized = normalizeVendorIdentity(name);
  if (!normalized) return null;
  return (
    suppliers.find((supplier) =>
      supplierNames(supplier).some((candidate) => normalizeVendorIdentity(candidate) === normalized),
    ) || null
  );
}

type DraftGroup = Omit<BudgetVendorGroup, "groupCount" | "linkedPoId" | "linkedPoNumber"> & {
  supplier: any | null;
};

function vendorGroups(request: any, suppliers: any[]): DraftGroup[] {
  const groups = new Map<string, DraftGroup>();

  const addName = (group: DraftGroup, name: string) => {
    const normalized = normalizeVendorIdentity(name);
    if (normalized && !group.vendorNames.some((existing) => normalizeVendorIdentity(existing) === normalized)) {
      group.vendorNames.push(name);
    }
  };

  const addToGroup = (vendorName: string, savedSupplierId: string, item: any | null, amount: number) => {
    const supplier = findSupplier(suppliers, vendorName, savedSupplierId);
    const supplierId = supplier ? String(supplier?.id || savedSupplierId || "") : "";
    const key = supplier ? `supplier:${supplierId}` : COMBINED_LOCAL_VENDOR_GROUP_KEY;
    const existing = groups.get(key);

    if (existing) {
      if (item) existing.items.push(item);
      existing.totalAmount = roundMoney(existing.totalAmount + amount);
      addName(existing, vendorName);
      return;
    }

    groups.set(key, {
      key,
      name: supplier ? firstText([...supplierNames(supplier), vendorName]) : "Local Vendors",
      vendorNames: [vendorName],
      isLocalVendorGroup: !supplier,
      supplierId,
      supplierNames: supplier ? supplierNames(supplier) : [],
      hasSupplier: Boolean(supplier),
      supplier,
      items: item ? [item] : [],
      totalAmount: amount,
    });
  };

  requestItems(request)
    .filter((item) => !["rejected", "declined", "cancelled"].includes(normalizeText(item?.status)))
    .forEach((item) => {
      const vendorName = itemVendorName(item);
      if (vendorName) addToGroup(vendorName, itemSupplierId(item), item, itemApprovedAmount(item));
    });

  if (groups.size === 0) {
    const directVendor = firstText([request?.vendorName, request?.supplierName, request?.payeeName, request?.payee]);
    if (directVendor) {
      addToGroup(
        directVendor,
        firstText([request?.supplierId, request?.vendorId]),
        null,
        requestApprovedAmount(request),
      );
    }
  }

  const result = Array.from(groups.values());
  if (result.length === 1 && result[0].totalAmount <= 0) {
    result[0].totalAmount = requestApprovedAmount(request);
  }
  return result;
}

/** The release entries that belong to one vendor of a budget request. */
function vendorEntries(history: any[], group: BudgetVendorGroup): any[] {
  const names = new Set(
    [group.name, ...group.vendorNames, ...group.supplierNames].map(normalizeVendorIdentity).filter(Boolean),
  );

  const scoped = history.filter((entry: any) => {
    if (String(entry?.paymentVendorKey || "") === group.key) return true;

    const entrySupplierId = firstText([entry?.paymentSupplierId, entry?.supplierId, entry?.vendorId]);

    if (
      group.isLocalVendorGroup &&
      !entrySupplierId &&
      (entry?.combinedLocalVendorPayment === true ||
        normalizeText(entry?.paymentScopeType) === "local_vendors_combined" ||
        (entry?.directPaymentRelease === true && entry?.vendorExistsInDatabase !== true))
    ) {
      return true;
    }

    if (group.supplierId && entrySupplierId && group.supplierId === entrySupplierId) return true;

    return [
      entry?.paymentVendorName,
      ...(Array.isArray(entry?.paymentVendorNames) ? entry.paymentVendorNames : []),
      ...(Array.isArray(entry?.localVendorNames) ? entry.localVendorNames : []),
      entry?.vendorName,
      entry?.supplierName,
      ...(Array.isArray(entry?.vendors) ? entry.vendors : []),
    ]
      .map(normalizeVendorIdentity)
      .some((name) => name && names.has(name));
  });

  if (scoped.length > 0) return scoped;

  if (group.groupCount === 1) {
    return history.filter(
      (entry: any) => !entry?.paymentVendorKey && !entry?.paymentSupplierId && !entry?.paymentVendorName,
    );
  }
  return [];
}

function linkedPurchaseOrders(request: any, purchaseOrders: any[]): any[] {
  const requestId = String(request?.requestId || "").trim();
  const docId = String(request?.id || "").trim();
  const estimateId = String(request?.estimateId || "").trim();
  const estimateNumber = firstText([
    request?.estimateNumber,
    request?.estimateNo,
    request?.estimateValue,
    request?.selectedEstimate,
    request?.selectEstimate,
  ]);
  const clean = (values: unknown[]) => values.filter(Boolean).map((value) => String(value).trim());

  return purchaseOrders.filter((po: any) => {
    const docLinks = clean([
      po?.invoiceRequestId,
      po?.linkedInvoiceId,
      po?.sourceInvoiceId,
      po?.budgetRequestDocId,
      po?.sourceBudgetRequestId,
      po?.requestDocId,
      po?.invoiceId,
    ]);
    const requestLinks = clean([
      po?.requestId,
      po?.budgetRequestId,
      po?.linkedRequestId,
      po?.sourceRequestId,
      po?.invoiceNumber,
      po?.budgetRequestNumber,
    ]);
    const estimateLinks = clean([po?.estimateId, po?.estimateNumber, po?.estimateNo, po?.selectedEstimate]);

    return (
      (docId && docLinks.includes(docId)) ||
      (requestId && requestLinks.includes(requestId)) ||
      (estimateId && estimateLinks.includes(estimateId)) ||
      (estimateNumber && estimateLinks.includes(estimateNumber))
    );
  });
}

const poVendorName = (po: any) =>
  firstText([
    po?.vendorName,
    po?.supplierName,
    po?.vendor,
    po?.supplier,
    po?.partyName,
    po?.supplierDetails?.supplierName,
    po?.supplierDetails?.vendorName,
    po?.supplierSnapshot?.supplierName,
    po?.supplierSnapshot?.vendorName,
  ]);

const poVendorId = (po: any) =>
  firstText([
    po?.supplierId,
    po?.vendorId,
    po?.supplierDocId,
    po?.vendorDocId,
    po?.supplierDetails?.id,
    po?.supplierSnapshot?.id,
  ]);

function linkedPOForVendor(candidates: any[], group: DraftGroup, groupCount: number): any | null {
  if (!group.supplier) return null;
  const names = new Set([group.name, ...group.supplierNames].map(normalizeVendorIdentity).filter(Boolean));

  const matched = candidates.find((po: any) => {
    const supplierId = poVendorId(po);
    if (group.supplierId && supplierId && group.supplierId === supplierId) return true;
    const vendor = normalizeVendorIdentity(poVendorName(po));
    return Boolean(vendor && names.has(vendor));
  });
  if (matched) return matched;

  return candidates.length === 1 && groupCount === 1 ? candidates[0] : null;
}

function budgetRequestPayables(requests: any[], purchaseOrders: any[], suppliers: any[]): RtgsPayable[] {
  return requests.flatMap((request) => {
    const projectCode = normalizeCode(request?.projectCode);
    if (!projectCode || !isRequestPayable(request)) return [];

    const drafts = vendorGroups(request, suppliers);
    const candidates = linkedPurchaseOrders(request, purchaseOrders);
    const history = releaseHistory(request);
    const approvedTotal =
      requestApprovedAmount(request) || roundMoney(drafts.reduce((sum, group) => sum + group.totalAmount, 0));

    return drafts.flatMap((draft): RtgsPayable[] => {
      const linkedPO = linkedPOForVendor(candidates, draft, drafts.length);
      // Budget Requests asks for a PO before paying a vendor saved as a supplier.
      if (draft.supplier && !linkedPO) return [];

      const { supplier: _supplier, ...rest } = draft;
      const group: BudgetVendorGroup = {
        ...rest,
        groupCount: drafts.length,
        linkedPoId: firstText([linkedPO?.id, linkedPO?.poId, linkedPO?.poDocId]),
        linkedPoNumber: firstText([linkedPO?.poNumber, linkedPO?.purchaseOrderNumber]),
      };
      const outstanding = roundMoney(Math.max(group.totalAmount - sumReleases(vendorEntries(history, group)), 0));
      if (outstanding <= 0.009) return [];

      return [
        {
          key: `br:${request.id}:${group.key}`,
          kind: "budget_request",
          docId: request.id,
          number: firstText([request?.requestId, request.id]),
          title: firstText([request?.subject, request?.title, request?.projectName, request?.project]),
          vendorName: group.isLocalVendorGroup ? group.vendorNames.join(", ") : group.name,
          projectCode,
          approvedAmount: group.totalAmount,
          outstanding,
          linkedKeys: group.linkedPoId ? [`po:${group.linkedPoId}`] : [],
          vendorGroup: group,
          requestApprovedAmount: approvedTotal,
        },
      ];
    });
  });
}

// --- Purchase orders (mirrors POManagementPage.tsx) -------------------------

// Same as the PO page: the first value that is a finite number.
const firstFinite = (...values: unknown[]) => {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const poApprovedAmount = (po: any) =>
  roundMoney(firstFinite(po?.totalApprovedAmount, po?.approvedAmount, po?.totalAmount));

const poReleasedAmount = (po: any) =>
  roundMoney(sumReleases(releaseHistory(po)) || firstFinite(po?.totalReleasedAmount));

const poOutstanding = (po: any) => roundMoney(Math.max(poApprovedAmount(po) - poReleasedAmount(po), 0));

const isPOApproved = (po: any, approvalRequired: boolean) =>
  !approvalRequired ||
  normalizeText(po?.approvalStatus) === "approved" ||
  normalizeText(po?.approvalWorkflow?.state) === "approved";

const isPOPayable = (po: any, approvalRequired: boolean) =>
  normalizeText(po?.status) !== "cancelled" && isPOApproved(po, approvalRequired);

const estimateProjectCode = (estimate: any) =>
  normalizeCode(estimate?.projectCode || estimate?.projectcode || estimate?.project_code || estimate?.code);

function purchaseOrderPayables(
  purchaseOrders: any[],
  requests: any[],
  estimates: any[],
  approvalRequired: boolean,
): RtgsPayable[] {
  const requestsByDocId = new Map(requests.map((request) => [String(request.id), request]));
  const requestsByNumber = new Map(
    requests.filter((request) => request?.requestId).map((request) => [String(request.requestId).trim(), request]),
  );

  // Estimate id or number -> project code.
  const estimateCodes = new Map<string, string>();
  estimates.forEach((estimate) => {
    const code = estimateProjectCode(estimate);
    if (!code) return;
    estimateCodes.set(String(estimate.id), code);
    [estimate?.estimateNumber, estimate?.estimateNo, estimate?.estimateCode].forEach((number) => {
      const key = String(number || "").trim();
      if (key && !estimateCodes.has(key)) estimateCodes.set(key, code);
    });
  });

  const projectCodeFor = (po: any) => {
    const own = normalizeCode(po?.projectCode);
    if (own) return own;

    const request =
      [po?.sourceInvoiceId, po?.invoiceRequestId, po?.budgetRequestDocId, po?.sourceBudgetRequestId, po?.requestDocId]
        .map((id) => requestsByDocId.get(String(id || "").trim()))
        .find(Boolean) ||
      [po?.sourceRequestId, po?.requestId, po?.budgetRequestId]
        .map((id) => requestsByNumber.get(String(id || "").trim()))
        .find(Boolean);
    const requestCode = normalizeCode(request?.projectCode);
    if (requestCode) return requestCode;

    return (
      [po?.estimateId, po?.estimateNumber, po?.estimateNo]
        .map((key) => estimateCodes.get(String(key || "").trim()))
        .find(Boolean) || ""
    );
  };

  return purchaseOrders.flatMap((po): RtgsPayable[] => {
    if (!isPOPayable(po, approvalRequired)) return [];
    const projectCode = projectCodeFor(po);
    const outstanding = poOutstanding(po);
    if (!projectCode || outstanding <= 0.009) return [];

    return [
      {
        key: `po:${po.id}`,
        kind: "purchase_order",
        docId: po.id,
        number: firstText([po?.poNumber, po.id]),
        title: firstText([po?.sourceProjectName, po?.estimateNumber]),
        vendorName: poVendorName(po),
        projectCode,
        approvedAmount: poApprovedAmount(po),
        outstanding,
        linkedKeys: [],
      },
    ];
  });
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export interface RtgsProject {
  code: string;
  projectName: string;
  client: string;
}

/** Every project code, from the sales records (the list estimates pick from). */
export async function fetchRtgsProjects(): Promise<RtgsProject[]> {
  const snapshot = await getDocs(collection(db, "Panels", PANEL_ID, "salesRecords"));
  const byCode = new Map<string, RtgsProject>();
  snapshot.docs.forEach((d) => {
    const data = d.data();
    const code = normalizeCode(data.projectCode);
    if (code && !byCode.has(code)) {
      byCode.set(code, {
        code,
        projectName: String(data.projectName || "").trim(),
        client: String(data.client || "").trim(),
      });
    }
  });
  return Array.from(byCode.values());
}

/** Every budget request vendor and PO that still has an outstanding balance. */
export async function fetchRtgsPayables(): Promise<RtgsPayable[]> {
  const [requestSnap, poSnap, supplierSnap, estimateSnap, workflowSnap] = await Promise.all([
    getDocs(collection(db, "Panels", PANEL_ID, "invoiceRequests")),
    getDocs(collection(db, "Panels", PANEL_ID, "PO")),
    getDocs(collection(db, "Panels", PANEL_ID, "suppliers")),
    getDocs(collection(db, "Panels", PANEL_ID, "estimates")),
    getDoc(doc(db, "Panels", PANEL_ID, "workflowConfigs", PO_WORKFLOW_CONFIG_ID)),
  ]);

  const rows = (snapshot: typeof requestSnap) => snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  const requests = rows(requestSnap);
  const purchaseOrders = rows(poSnap);
  const workflow = workflowSnap.exists() ? workflowSnap.data() : null;
  const approvalRequired = Boolean(
    workflow && workflow.enabled !== false && Array.isArray(workflow.levels) && workflow.levels.length > 0,
  );

  const budgetPayables = budgetRequestPayables(requests, purchaseOrders, rows(supplierSnap));
  const poPayables = purchaseOrderPayables(purchaseOrders, requests, rows(estimateSnap), approvalRequired);

  // A budget request vendor and its PO are the same spend: link both ways so
  // they can't be paid twice from one letter.
  const poKeys = new Set(poPayables.map((payable) => payable.key));
  budgetPayables.forEach((payable) => {
    payable.linkedKeys = payable.linkedKeys.filter((key) => poKeys.has(key));
    payable.linkedKeys.forEach((key) => {
      poPayables.find((po) => po.key === key)?.linkedKeys.push(payable.key);
    });
  });

  return [...budgetPayables, ...poPayables];
}

// ---------------------------------------------------------------------------
// Allocation
// ---------------------------------------------------------------------------

/** Pays each payable in turn until the amount runs out. */
export function allocateRtgsAmount(payables: RtgsPayable[], amount: number) {
  let left = roundMoney(Math.max(amount, 0));
  const allocations: RtgsAllocation[] = payables.map((payable) => {
    const paid = roundMoney(Math.min(payable.outstanding, left));
    left = roundMoney(left - paid);
    return { payable, amount: paid, outstandingAfter: roundMoney(payable.outstanding - paid) };
  });
  return { allocations, unallocated: left };
}

export function linkedPaymentsFor(plan: Pick<RtgsPaymentPlan, "serialNo" | "allocations">): RtgsLinkedPayment[] {
  return plan.allocations.map((allocation, index) => ({
    kind: allocation.payable.kind,
    docId: allocation.payable.docId,
    number: allocation.payable.number,
    vendorName: allocation.payable.vendorName,
    releaseId: releaseIdFor(plan.serialNo, index),
    outstandingBefore: allocation.payable.outstanding,
    amount: allocation.amount,
    outstandingAfter: allocation.outstandingAfter,
  }));
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

function baseEntry(plan: RtgsPaymentPlan, allocation: RtgsAllocation, releaseId: string, releasedAt: Date) {
  const { account, actor } = plan;
  return {
    id: releaseId,
    paymentMethod: "bank_transfer",
    amount: allocation.amount,
    transactionName: `RTGS ${plan.serialNo} - ${plan.payeeName}`,
    transactionReference: plan.serialNo,
    paymentNotes: `Paid by RTGS letter ${plan.serialNo} for project ${plan.projectCode}.`,
    bankReceiptUrl: "",
    bankReceiptUrls: [],
    chequeNumber: plan.chequeNumber,
    chequeNumbers: [plan.chequeNumber],
    selectedAccount: {
      id: account.id,
      accountName: account.accountName || "",
      accountNumber: account.accountNumber || "",
      bankName: account.bankName || "",
      currency: account.currency || "PKR",
    },
    selectedAccountId: account.id,
    selectedAccountName: account.accountName || "",
    releasedBy: actor.id,
    releasedByName: actor.name,
    releasedByEmail: actor.email,
    releasedAt,
    paidVia: "rtgs",
    rtgsSerialNo: plan.serialNo,
    rtgsProjectCode: plan.projectCode,
  };
}

// Kept so a later correction in Payment History can restore the approval
// status (same rule as PaymentReleaseModal).
function workflowBaseStatus(request: any): string {
  const existing = String(request?.paymentWorkflowBaseStatus || "").trim();
  if (existing) return existing;

  const status = normalizeText(request?.status);
  if (status && !["payment_released", "payment_partially_released"].includes(status)) {
    return String(request.status);
  }

  const hasPurchaseOrder = Boolean(
    request?.poId ||
      request?.poNumber ||
      request?.poDocId ||
      request?.purchaseOrderId ||
      request?.purchaseOrderNumber ||
      request?.poCreated ||
      request?.poSubmitted ||
      request?.purchaseOrderCreated ||
      request?.purchaseOrderSubmitted,
  );
  return hasPurchaseOrder ? "ready_for_payment" : "approved";
}

function workflowBasePaymentStatus(request: any): string {
  const existing = String(request?.paymentWorkflowBasePaymentStatus || "").trim();
  if (existing) return existing;

  const current = normalizeText(request?.paymentStatus || request?.releasePaymentStatus);
  if (current && !["released", "partial", "payment_released", "payment_partially_released"].includes(current)) {
    return String(request?.paymentStatus || request?.releasePaymentStatus || "");
  }
  return "";
}

function budgetRequestUpdate(
  request: any,
  items: Array<{ allocation: RtgsAllocation; releaseId: string }>,
  plan: RtgsPaymentPlan,
  releasedAt: Date,
): Record<string, unknown> {
  const existingHistory = releaseHistory(request);
  const baseStatus = workflowBaseStatus(request);
  const basePaymentStatus = workflowBasePaymentStatus(request);

  const newEntries = items.map(({ allocation, releaseId }) => {
    const group = allocation.payable.vendorGroup!;
    const releasedBefore = sumReleases(vendorEntries(existingHistory, group));
    const releasedAfter = roundMoney(releasedBefore + allocation.amount);
    const remainingAfter = roundMoney(Math.max(group.totalAmount - releasedAfter, 0));
    const fullyReleased = group.totalAmount > 0 && remainingAfter <= 0.009;

    return {
      ...baseEntry(plan, allocation, releaseId, releasedAt),
      releaseType: releaseType(releasedBefore, fullyReleased),
      approvedAmount: group.totalAmount,
      releasedBefore,
      releasedAfter,
      remainingAfter,
      vendors: group.vendorNames.length > 0 ? group.vendorNames : [group.name],
      paymentWorkflowBaseStatus: baseStatus,
      paymentWorkflowBasePaymentStatus: basePaymentStatus,
      paymentScope: "vendor",
      paymentScopeType: group.isLocalVendorGroup ? "local_vendors_combined" : "vendor",
      combinedLocalVendorPayment: group.isLocalVendorGroup,
      paymentVendorKey: group.key,
      paymentVendorName: group.name,
      paymentVendorNames: group.vendorNames,
      localVendorNames: group.isLocalVendorGroup ? group.vendorNames : [],
      paymentSupplierId: group.supplierId,
      directPaymentRelease: !group.hasSupplier,
      vendorExistsInDatabase: group.hasSupplier,
      poId: group.linkedPoId,
      poNumber: group.linkedPoNumber,
      vendorApprovedAmount: group.totalAmount,
      vendorReleasedBefore: releasedBefore,
      vendorReleasedAfter: releasedAfter,
      vendorRemainingAfter: remainingAfter,
      ...(group.isLocalVendorGroup
        ? { paymentItems: group.items, items: group.items, itemCount: group.items.length }
        : {}),
    };
  });

  const history = [...existingHistory, ...newEntries];
  const approved = requestApprovedAmount(request) || roundMoney(items[0].allocation.payable.requestApprovedAmount);
  const releasedAfter = sumReleases(history);
  const remainingAfter = roundMoney(Math.max(approved - releasedAfter, 0));
  const fullyReleased = approved > 0 && remainingAfter <= 0.009;
  const latest = newEntries[newEntries.length - 1];

  return {
    status: fullyReleased ? "payment_released" : "payment_partially_released",
    paymentStatus: fullyReleased ? "released" : "partial",
    paymentWorkflowBaseStatus: baseStatus,
    paymentWorkflowBasePaymentStatus: basePaymentStatus,
    paymentReleased: fullyReleased,
    paymentPartiallyReleased: releasedAfter > 0 && !fullyReleased,
    releasePaymentCreated: true,
    totalApprovedAmount: approved,
    totalReleasedAmount: releasedAfter,
    remainingReleaseAmount: remainingAfter,
    transactionName: latest.transactionName,
    latestTransactionName: latest.transactionName,
    latestPaymentRelease: latest,
    paymentDetails: latest,
    paymentReleaseHistory: history,
    updatedAt: serverTimestamp(),
    ...(fullyReleased
      ? {
          paymentReleasedAt: serverTimestamp(),
          releasePaymentAt: serverTimestamp(),
          paymentFullyReleasedAt: serverTimestamp(),
        }
      : { partialPaymentReleasedAt: serverTimestamp() }),
  };
}

function purchaseOrderUpdate(
  po: any,
  allocation: RtgsAllocation,
  releaseId: string,
  plan: RtgsPaymentPlan,
  releasedAt: Date,
): Record<string, unknown> {
  const approvedAmount = poApprovedAmount(po);
  const existingHistory = releaseHistory(po);
  const releasedBefore = sumReleases(existingHistory);
  const releasedAfter = roundMoney(releasedBefore + allocation.amount);
  const remainingAfter = roundMoney(Math.max(approvedAmount - releasedAfter, 0));
  const fullyReleased = approvedAmount > 0 && remainingAfter <= 0.009;
  const supplierName = String(po?.supplierName || "");

  const entry = {
    ...baseEntry(plan, allocation, releaseId, releasedAt),
    releaseType: releaseType(releasedBefore, fullyReleased),
    approvedAmount,
    releasedBefore,
    releasedAfter,
    remainingAfter,
    supplierName,
    parties: supplierName ? [supplierName] : [],
    sourceType: "purchase_order",
    sourceId: po.id,
    poNumber: String(po?.poNumber || ""),
  };

  const storedStatus = po?.status === "Over Due" ? "Open" : po?.status || "Open";
  const nextStatus = fullyReleased
    ? "Paid"
    : storedStatus === "Draft" || storedStatus === "Paid"
      ? "Open"
      : storedStatus;

  return {
    status: nextStatus,
    paymentStatus: fullyReleased ? "released" : "partial",
    paymentReleased: fullyReleased,
    paymentPartiallyReleased: !fullyReleased,
    releasePaymentCreated: true,
    totalApprovedAmount: approvedAmount,
    totalReleasedAmount: releasedAfter,
    remainingReleaseAmount: remainingAfter,
    transactionName: entry.transactionName,
    latestTransactionName: entry.transactionName,
    latestPaymentRelease: entry,
    paymentDetails: entry,
    paymentReleaseHistory: [...existingHistory, entry],
    updatedAt: serverTimestamp(),
    ...(fullyReleased
      ? {
          paymentReleasedAt: serverTimestamp(),
          releasePaymentAt: serverTimestamp(),
          paymentFullyReleasedAt: serverTimestamp(),
        }
      : { partialPaymentReleasedAt: serverTimestamp() }),
  };
}

/**
 * Reads every document the plan pays (inside the letter's transaction, before
 * any write), refuses if any outstanding balance changed since it was loaded,
 * and returns the updates that mark them paid.
 */
export async function preparePaymentWrites(
  transaction: Transaction,
  plan: RtgsPaymentPlan,
): Promise<Array<{ ref: DocumentReference; data: Record<string, unknown> }>> {
  const releasedAt = new Date();
  const byDocument = new Map<string, Array<{ allocation: RtgsAllocation; releaseId: string }>>();

  plan.allocations.forEach((allocation, index) => {
    const key = `${allocation.payable.kind}:${allocation.payable.docId}`;
    byDocument.set(key, [
      ...(byDocument.get(key) || []),
      { allocation, releaseId: releaseIdFor(plan.serialNo, index) },
    ]);
  });

  const groups = Array.from(byDocument.values());
  const refs = groups.map(([{ allocation }]) =>
    doc(
      db,
      "Panels",
      PANEL_ID,
      allocation.payable.kind === "budget_request" ? "invoiceRequests" : "PO",
      allocation.payable.docId,
    ),
  );
  const snapshots = await Promise.all(refs.map((ref) => transaction.get(ref)));

  return groups.map((items, index) => {
    const snapshot = snapshots[index];
    const first = items[0].allocation.payable;
    if (!snapshot.exists()) throw new PayablesChangedError(first.number);
    const source: any = { id: snapshot.id, ...snapshot.data() };

    if (first.kind === "purchase_order") {
      if (normalizeText(source.status) === "cancelled" || Math.abs(poOutstanding(source) - first.outstanding) > 0.009) {
        throw new PayablesChangedError(first.number);
      }
      const [{ allocation, releaseId }] = items;
      return { ref: refs[index], data: purchaseOrderUpdate(source, allocation, releaseId, plan, releasedAt) };
    }

    const history = releaseHistory(source);
    items.forEach(({ allocation: { payable } }) => {
      const group = payable.vendorGroup!;
      const outstanding = roundMoney(Math.max(group.totalAmount - sumReleases(vendorEntries(history, group)), 0));
      if (!isRequestPayable(source) || Math.abs(outstanding - payable.outstanding) > 0.009) {
        throw new PayablesChangedError(payable.number);
      }
    });
    return { ref: refs[index], data: budgetRequestUpdate(source, items, plan, releasedAt) };
  });
}
