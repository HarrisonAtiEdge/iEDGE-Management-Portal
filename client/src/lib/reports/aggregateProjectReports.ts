// Pure aggregation: takes raw Firestore rows in, returns report rows out.
// No Firestore calls, no React, no formatting for display — that separation
// is what makes this safe to unit-test and safe to extend (a new cost
// source is a new .forEach block here, nothing else has to change).

import type {
  BudgetRequestEntry,
  ProjectReportRow,
  ReportsRawData,
  RtdClientActivity,
} from "./types";

const normalize = (value: any) => String(value ?? "").trim();

const toNumber = (value: any) => {
  const parsed = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
};

const isApproved = (status: any) => normalize(status).toLowerCase() === "approved";

// A Budget Request's `status` keeps moving through post-approval stages
// (expense_submitted, bill_submitted_to_finance, bill_received_by_finance,
// payment_released, ...) — checking for the literal "approved" string alone
// stops counting a request as cost the moment it progresses past that
// stage, undercounting real spend. Excluding only the states that mean "not
// actually approved yet/at all" is the correct, forward-compatible check.
const NOT_YET_APPROVED_STATUSES = new Set([
  "pending_workflow_configuration",
  "pending_approval",
  "rejected",
  "returned_to_creator",
  "changes_requested",
]);

const isApprovedOrLater = (status: any) => {
  const value = normalize(status).toLowerCase();
  return Boolean(value) && !NOT_YET_APPROVED_STATUSES.has(value);
};

const isPaidStatus = (status: any) => normalize(status).toLowerCase() === "paid";

// Voided/cancelled invoices never represented real revenue — excluded from
// both the invoiced total and the payment-status calculation entirely.
const isVoidStatus = (status: any) => {
  const value = normalize(status).toLowerCase();
  return value === "void" || value === "cancelled";
};

const DAY_MS = 24 * 60 * 60 * 1000;

const daysSince = (dateValue: string | null) => {
  if (!dateValue) return null;
  const then = new Date(`${dateValue}T00:00:00`).getTime();
  if (Number.isNaN(then)) return null;
  return Math.max(0, Math.floor((Date.now() - then) / DAY_MS));
};

const getDateValue = (value: any): string | null => {
  if (!value) return null;

  // Firestore Timestamp
  if (typeof value?.toDate === "function") {
    return value.toDate().toISOString().slice(0, 10);
  }

  const text = String(value).trim();
  if (!text) return null;

  // Already a plain YYYY-MM-DD date string (the common case here).
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
};

const trackDateRange = (
  row: { earliestDate: string | null; latestDate: string | null },
  dateValue: string | null,
) => {
  if (!dateValue) return;
  if (!row.earliestDate || dateValue < row.earliestDate) row.earliestDate = dateValue;
  if (!row.latestDate || dateValue > row.latestDate) row.latestDate = dateValue;
};

type MutableRow = {
  projectCode: string;
  clientCandidates: Map<string, number>;
  estimateTotal: number;
  estimateCount: number;
  estimateNumbers: string[];
  budgetRequestCost: number;
  budgetRequestCount: number;
  budgetRequestEntries: BudgetRequestEntry[];
  reimbursementCost: number;
  reimbursementCount: number;
  invoicedTotal: number;
  invoiceCount: number;
  invoiceNumbers: string[];
  paidInvoiceCount: number;
  unpaidInvoiceDates: string[];
  earliestDate: string | null;
  latestDate: string | null;
};

function createRow(projectCode: string): MutableRow {
  return {
    projectCode,
    clientCandidates: new Map(),
    estimateTotal: 0,
    estimateCount: 0,
    estimateNumbers: [],
    budgetRequestCost: 0,
    budgetRequestCount: 0,
    budgetRequestEntries: [],
    reimbursementCost: 0,
    reimbursementCount: 0,
    invoicedTotal: 0,
    invoiceCount: 0,
    invoiceNumbers: [],
    paidInvoiceCount: 0,
    unpaidInvoiceDates: [],
    earliestDate: null,
    latestDate: null,
  };
}

function getOrCreate(map: Map<string, MutableRow>, projectCode: string) {
  const existing = map.get(projectCode);
  if (existing) return existing;

  const created = createRow(projectCode);
  map.set(projectCode, created);
  return created;
}

function noteClient(row: MutableRow, client: any) {
  const name = normalize(client);
  if (!name) return;
  row.clientCandidates.set(name, (row.clientCandidates.get(name) || 0) + 1);
}

function pickClientName(row: MutableRow): { client: string; candidates: string[] } {
  const entries = Array.from(row.clientCandidates.entries());
  if (entries.length === 0) return { client: "", candidates: [] };

  entries.sort((a, b) => b[1] - a[1]);
  return { client: entries[0][0], candidates: entries.map(([name]) => name) };
}

export function buildProjectReports(raw: ReportsRawData): ProjectReportRow[] {
  const rows = new Map<string, MutableRow>();

  // Estimates seed which project codes exist and hold the "quoted" revenue.
  raw.estimates.forEach((estimate) => {
    const projectCode = normalize(estimate.projectCode);
    if (!projectCode) return;

    const row = getOrCreate(rows, projectCode);
    row.estimateTotal += toNumber(estimate.total);
    row.estimateCount += 1;
    if (estimate.estimateNo) row.estimateNumbers.push(normalize(estimate.estimateNo));
    noteClient(row, estimate.client);
    trackDateRange(row, getDateValue(estimate.date));
  });

  // Invoices join STRICTLY by their own projectCode field — no inference
  // through sourceEstimateId or any other lookup. An invoice with no
  // projectCode of its own is excluded from every project row rather than
  // guessed at, so a project's numbers never pick up a document that isn't
  // actually tagged with that project code.
  raw.invoices.forEach((invoice) => {
    if (isVoidStatus(invoice.status)) return;

    const projectCode = normalize(invoice.projectCode);
    if (!projectCode) return;

    const row = getOrCreate(rows, projectCode);
    row.invoicedTotal += toNumber(invoice.total);
    row.invoiceCount += 1;
    if (invoice.invoiceNo) row.invoiceNumbers.push(normalize(invoice.invoiceNo));
    noteClient(row, invoice.client);

    const invoiceDate = getDateValue(invoice.invoiceDate);
    trackDateRange(row, invoiceDate);

    if (isPaidStatus(invoice.status)) {
      row.paidInvoiceCount += 1;
    } else if (invoiceDate) {
      row.unpaidInvoiceDates.push(invoiceDate);
    }
  });

  // Only approved-or-later budget requests and approved reimbursements
  // count as real cost — pending/rejected amounts aren't committed spend.
  raw.budgetRequests.forEach((request) => {
    const projectCode = normalize(request.projectCode);
    if (!projectCode || !isApprovedOrLater(request.status)) return;

    const amount = toNumber(request.approvedAmount ?? request.totalAmount);
    const row = getOrCreate(rows, projectCode);
    row.budgetRequestCost += amount;
    row.budgetRequestCount += 1;
    row.budgetRequestEntries.push({
      id: normalize(request.id),
      number: normalize(request.requestId) || `#${normalize(request.id)}`,
      amount,
    });
    noteClient(row, request.clientName);
  });

  raw.reimbursements.forEach((claim) => {
    const projectCode = normalize(claim.projectCode);
    if (!projectCode || !isApproved(claim.status)) return;

    const row = getOrCreate(rows, projectCode);
    row.reimbursementCost += toNumber(claim.claimAmount);
    row.reimbursementCount += 1;
  });

  // Project names live on the sales record that originated the project
  // code, not on the estimate/invoice docs themselves.
  const projectNameByCode = new Map<string, string>();
  raw.salesRecords.forEach((record) => {
    const projectCode = normalize(record.projectCode);
    const projectName = normalize(record.projectName);
    if (projectCode && projectName && !projectNameByCode.has(projectCode)) {
      projectNameByCode.set(projectCode, projectName);
    }
  });

  return Array.from(rows.values())
    .map((row): ProjectReportRow => {
      const totalCost = row.budgetRequestCost + row.reimbursementCost;
      const hasInvoice = row.invoiceCount > 0;

      // Profit is only ever real once something has actually been billed —
      // an estimate is a quote, not revenue, so "estimate_only" projects
      // show no profit figure at all rather than a projected one.
      const profit = hasInvoice ? row.invoicedTotal - totalCost : null;
      const profitMargin =
        hasInvoice && row.invoicedTotal > 0
          ? ((profit as number) / row.invoicedTotal) * 100
          : null;

      const { client, candidates } = pickClientName(row);

      const status: ProjectReportRow["status"] =
        row.estimateCount === 0
          ? "no_estimate_data"
          : hasInvoice
            ? "invoiced"
            : "estimate_only";

      const paymentStatus: ProjectReportRow["paymentStatus"] =
        row.invoiceCount === 0
          ? "no_invoice"
          : row.paidInvoiceCount === row.invoiceCount
            ? "fully_paid"
            : row.paidInvoiceCount === 0
              ? "unpaid"
              : "partially_paid";

      // Oldest still-unpaid invoice is the most overdue one, so that's the
      // day count shown — it's the longest any money has been outstanding.
      const oldestUnpaidDate =
        row.unpaidInvoiceDates.length > 0
          ? row.unpaidInvoiceDates.reduce((earliest, date) =>
              date < earliest ? date : earliest,
            )
          : null;

      return {
        projectCode: row.projectCode,
        projectName: projectNameByCode.get(row.projectCode) || row.projectCode,
        client,
        clientCandidates: candidates,
        estimateTotal: row.estimateTotal,
        estimateCount: row.estimateCount,
        estimateNumbers: row.estimateNumbers,
        budgetRequestCost: row.budgetRequestCost,
        budgetRequestCount: row.budgetRequestCount,
        budgetRequestEntries: row.budgetRequestEntries,
        reimbursementCost: row.reimbursementCost,
        reimbursementCount: row.reimbursementCount,
        totalCost,
        invoicedTotal: row.invoicedTotal,
        invoiceCount: row.invoiceCount,
        invoiceNumbers: row.invoiceNumbers,
        paymentStatus,
        paidInvoiceCount: row.paidInvoiceCount,
        daysOutstanding: daysSince(oldestUnpaidDate),
        profit,
        profitBasis: hasInvoice ? "invoiced" : "none",
        profitMargin,
        billingVariance: hasInvoice ? row.invoicedTotal - row.estimateTotal : null,
        status,
        earliestDate: row.earliestDate,
        latestDate: row.latestDate,
      };
    })
    .sort((a, b) => a.projectCode.localeCompare(b.projectCode));
}

// RTD (Records/Estimate/Invoice) has no project-code field anywhere in its
// schema — it's only ever linked to a client. Rolled up separately here by
// client name so it's never silently merged into a specific project's
// profit math, which would misattribute cost to the wrong project whenever
// a client has more than one.
export function buildRtdClientActivity(raw: ReportsRawData): RtdClientActivity[] {
  const rows = new Map<string, RtdClientActivity>();

  const getOrCreateClient = (clientRaw: any) => {
    const client = normalize(clientRaw);
    if (!client) return null;

    const existing = rows.get(client);
    if (existing) return existing;

    const created: RtdClientActivity = {
      client,
      recordsTotal: 0,
      recordsCount: 0,
      estimatesTotal: 0,
      estimatesCount: 0,
      invoicedTotal: 0,
      invoicesCount: 0,
      margin: 0,
    };
    rows.set(client, created);
    return created;
  };

  raw.rtdRecords.forEach((record) => {
    const row = getOrCreateClient(record.client);
    if (!row) return;
    row.recordsTotal += toNumber(record.amountRequired);
    row.recordsCount += 1;
  });

  raw.rtdEstimates.forEach((estimate) => {
    const row = getOrCreateClient(estimate.client);
    if (!row) return;
    row.estimatesTotal += toNumber(
      estimate.total ?? estimate.invoiceTotal ?? estimate.estimateAmount,
    );
    row.estimatesCount += 1;
  });

  raw.rtdInvoices.forEach((invoice) => {
    const row = getOrCreateClient(invoice.client);
    if (!row) return;
    row.invoicedTotal += toNumber(invoice.total);
    row.invoicesCount += 1;
  });

  return Array.from(rows.values())
    .map((row) => ({ ...row, margin: row.invoicedTotal - row.recordsTotal }))
    .sort((a, b) => a.client.localeCompare(b.client));
}
