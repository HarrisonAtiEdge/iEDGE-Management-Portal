// Shared types for the Reports feature. Kept separate from the aggregation
// logic and the UI so any of the three can change independently: a new
// filter only touches the page, a new metric only touches the aggregator,
// a new raw field only touches the data hook.

export type ProjectReportStatus =
  | "estimate_only"
  | "invoiced"
  | "no_estimate_data";

export type InvoicePaymentStatus =
  | "no_invoice"
  | "fully_paid"
  | "partially_paid"
  | "unpaid";

export interface BudgetRequestEntry {
  id: string;
  number: string;
  amount: number;
}

export interface ProjectReportRow {
  projectCode: string;
  projectName: string;

  client: string;
  clientCandidates: string[];

  estimateTotal: number;
  estimateCount: number;
  // The actual estimateNo of every estimate rolled into this project — not
  // just a count — so the report can show exactly which documents it added.
  estimateNumbers: string[];

  budgetRequestCost: number;
  budgetRequestCount: number;
  // Every approved-or-later budget request rolled into this project's cost,
  // by its own request number and amount — not just a total. `id` is the
  // Firestore doc id, used to open that request's full details.
  budgetRequestEntries: BudgetRequestEntry[];

  reimbursementCost: number;
  reimbursementCount: number;

  totalCost: number;

  invoicedTotal: number;
  invoiceCount: number;
  // Same idea for invoices — the actual invoiceNo of every invoice included.
  invoiceNumbers: string[];

  // Payment completeness across every (non-void) invoice raised for this
  // project. "unpaid"/"partially_paid" mean at least one invoice still has
  // money outstanding.
  paymentStatus: InvoicePaymentStatus;
  paidInvoiceCount: number;

  // Days since the oldest invoice that still isn't fully paid was raised —
  // null once everything is paid, or if there's no invoice yet.
  daysOutstanding: number | null;

  // Profit only exists once a project has been invoiced — an estimate is a
  // quote, not revenue, so there is nothing real to show as "profit" for an
  // estimate-only project. Both are null in that case.
  profit: number | null;
  profitBasis: "invoiced" | "none";
  profitMargin: number | null;

  // Invoiced vs estimated — flags over/under-billing relative to the quote.
  // Null when there's no invoice yet to compare.
  billingVariance: number | null;

  status: ProjectReportStatus;

  earliestDate: string | null;
  latestDate: string | null;
}

export interface RtdClientActivity {
  client: string;

  recordsTotal: number;
  recordsCount: number;

  estimatesTotal: number;
  estimatesCount: number;

  invoicedTotal: number;
  invoicesCount: number;

  margin: number;
}

export interface ReportsRawData {
  estimates: any[];
  invoices: any[];
  budgetRequests: any[];
  reimbursements: any[];
  clients: any[];
  salesRecords: any[];
  rtdRecords: any[];
  rtdEstimates: any[];
  rtdInvoices: any[];
}

export const RESULTS_PER_PAGE_OPTIONS = [10, 25, 50, 100, "all"] as const;
export type ResultsPerPage = (typeof RESULTS_PER_PAGE_OPTIONS)[number];

// How many of the currently filtered rows go into a PDF/Excel export. Kept
// separate from ResultsPerPage since on-screen pagination and export size are
// independent choices — you can page through 25 at a time while exporting
// everything that matches the filters.
export const EXPORT_ROW_LIMIT_OPTIONS = [50, 100, 250, 500, "all"] as const;
export type ExportRowLimit = (typeof EXPORT_ROW_LIMIT_OPTIONS)[number];

export interface ReportFiltersState {
  search: string;
  projectCode: string;
  client: string;
  status: "all" | ProjectReportStatus;
  profitFilter: "all" | "profitable" | "loss" | "breakeven";
  paymentFilter: "all" | InvoicePaymentStatus;
  dateFrom: string;
  dateTo: string;
  resultsPerPage: ResultsPerPage;
}

export const DEFAULT_REPORT_FILTERS: ReportFiltersState = {
  search: "",
  projectCode: "all",
  client: "all",
  status: "all",
  profitFilter: "all",
  paymentFilter: "all",
  dateFrom: "",
  dateTo: "",
  resultsPerPage: 25,
};
