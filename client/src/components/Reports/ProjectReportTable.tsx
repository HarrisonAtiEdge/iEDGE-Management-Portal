import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import type {
  BudgetRequestEntry,
  ProjectReportRow,
  ResultsPerPage,
} from "@/lib/reports/types";
import { formatDate, formatMoney, formatPercent } from "@/lib/reports/format";
import BudgetDetailsModal from "@/components/BudgetDetailsModal";

type Props = {
  rows: ProjectReportRow[];
  resultsPerPage: ResultsPerPage;
  // Raw budget request docs, so a clicked entry can open its full details.
  budgetRequests?: any[];
};

const STATUS_META: Record<
  ProjectReportRow["status"],
  { label: string; className: string }
> = {
  estimate_only: {
    label: "Estimate Only",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  invoiced: {
    label: "Invoiced",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  no_estimate_data: {
    label: "No Estimate",
    className: "border-slate-200 bg-slate-50 text-slate-500",
  },
};

const PAYMENT_META: Record<
  ProjectReportRow["paymentStatus"],
  { label: string; className: string }
> = {
  fully_paid: {
    label: "100% Paid",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  partially_paid: {
    label: "Partially Paid",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  unpaid: {
    label: "Unpaid",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  no_invoice: {
    label: "-",
    className: "border-slate-200 bg-slate-50 text-slate-400",
  },
};

const COLUMN_COUNT = 12;

const PROFIT_BASIS_META: Record<
  ProjectReportRow["profitBasis"],
  { label: string; sub: string }
> = {
  po: {
    label: "PO Value",
    sub: "Sum of PO amounts minus approved cost",
  },
  invoiced: {
    label: "Invoiced Amount",
    sub: "No PO amounts entered on this project's invoices — using invoiced total minus approved cost",
  },
  none: {
    label: "Not Calculated",
    sub: "An estimate is a quote, not revenue — profit only shows once invoiced",
  },
};

export default function ProjectReportTable({
  rows,
  resultsPerPage,
  budgetRequests = [],
}: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selectedBudgetRequestId, setSelectedBudgetRequestId] = useState<
    string | null
  >(null);

  const budgetRequestById = useMemo(() => {
    const map = new Map<string, any>();
    budgetRequests.forEach((request) => {
      if (request?.id) map.set(String(request.id), request);
    });
    return map;
  }, [budgetRequests]);

  const selectedBudgetRequest = selectedBudgetRequestId
    ? budgetRequestById.get(selectedBudgetRequestId) ?? null
    : null;

  // Jump back to page 1 whenever the filtered result set or the page size
  // changes — an old page number could otherwise point past the end (or
  // just at a completely different set of rows the user didn't ask for).
  useEffect(() => {
    setPage(1);
  }, [rows, resultsPerPage]);

  const pageSize = resultsPerPage === "all" ? rows.length || 1 : resultsPerPage;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const startIndex = (currentPage - 1) * pageSize;
  const pageRows =
    resultsPerPage === "all" ? rows : rows.slice(startIndex, startIndex + pageSize);

  const rangeStart = rows.length === 0 ? 0 : startIndex + 1;
  const rangeEnd = resultsPerPage === "all" ? rows.length : Math.min(startIndex + pageSize, rows.length);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="font-bold text-slate-950">Project Reports</h2>
          <p className="text-sm text-slate-500">
            One row per project. Click a row for the cost breakdown.
          </p>
        </div>

        <p className="text-xs font-semibold text-slate-500">
          {rows.length === 0
            ? "No projects"
            : `Showing ${rangeStart}-${rangeEnd} of ${rows.length} project(s)`}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1680px] text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <th className="w-8 px-4 py-4" />
              <th className="px-5 py-4 text-left">Project</th>
              <th className="px-5 py-4 text-left">Client</th>
              <th className="px-5 py-4 text-right">Estimated</th>
              <th className="px-5 py-4 text-right">Cost</th>
              <th className="px-5 py-4 text-right">Invoiced</th>
              <th className="px-5 py-4 text-right">PO Value</th>
              <th className="px-5 py-4 text-left">Payment</th>
              <th className="px-5 py-4 text-center">Days Outstanding</th>
              <th className="px-5 py-4 text-right">Profit</th>
              <th className="px-5 py-4 text-right">Profit %</th>
              <th className="px-5 py-4 text-left">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {pageRows.map((row) => {
              const isOpen = expanded === row.projectCode;
              const status = STATUS_META[row.status];
              const payment = PAYMENT_META[row.paymentStatus];
              const profitClass =
                row.profit === null
                  ? "text-slate-400"
                  : row.profit > 0
                    ? "text-emerald-600"
                    : row.profit < 0
                      ? "text-red-600"
                      : "text-slate-500";
              const isOverdue =
                row.daysOutstanding !== null && row.daysOutstanding >= 7;

              return (
                <Fragment key={row.projectCode}>
                  <tr
                    onClick={() =>
                      setExpanded(isOpen ? null : row.projectCode)
                    }
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="px-4 py-4 text-slate-400">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">
                        {row.projectName}
                      </div>
                      {row.projectName !== row.projectCode ? (
                        <div className="mt-0.5 text-xs text-slate-400">
                          {row.projectCode}
                        </div>
                      ) : null}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {row.client || "-"}
                    </td>

                    <td className="px-5 py-4 text-right text-slate-700">
                      {formatMoney(row.estimateTotal)}
                    </td>

                    <td className="px-5 py-4 text-right text-slate-700">
                      {formatMoney(row.totalCost)}
                    </td>

                    <td className="px-5 py-4 text-right text-slate-700">
                      {row.invoiceCount > 0
                        ? formatMoney(row.invoicedTotal)
                        : "-"}
                    </td>

                    <td className="px-5 py-4 text-right text-slate-700">
                      {row.poAmountCount > 0 ? formatMoney(row.poTotal) : "-"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${payment.className}`}
                      >
                        {payment.label}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      {row.daysOutstanding === null ? (
                        <span className="text-slate-300">-</span>
                      ) : (
                        <span
                          className={
                            isOverdue
                              ? "font-bold text-red-600"
                              : "text-slate-600"
                          }
                        >
                          {row.daysOutstanding} day
                          {row.daysOutstanding === 1 ? "" : "s"}
                        </span>
                      )}
                    </td>

                    <td
                      className={`px-5 py-4 text-right font-bold ${profitClass}`}
                    >
                      {row.profit === null ? "-" : formatMoney(row.profit)}
                    </td>

                    <td
                      className={`px-5 py-4 text-right font-semibold ${profitClass}`}
                    >
                      {row.profitMargin === null
                        ? "-"
                        : formatPercent(row.profitMargin)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>
                  </tr>

                  {isOpen ? (
                    <tr>
                      <td colSpan={COLUMN_COUNT} className="bg-slate-50 px-5 py-5">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                          <DetailStat
                            label="Estimates"
                            value={formatMoney(row.estimateTotal)}
                            sub={`${row.estimateCount} estimate(s)`}
                          />
                          <DetailStat
                            label="Payment Status"
                            value={payment.label}
                            sub={
                              row.invoiceCount > 0
                                ? `${row.paidInvoiceCount} of ${row.invoiceCount} invoice(s) fully paid`
                                : "No invoice raised yet"
                            }
                          />
                          <DetailStat
                            label="Approved Budget Requests"
                            value={formatMoney(row.budgetRequestCost)}
                            sub={`${row.budgetRequestCount} request(s)`}
                          />
                          <DetailStat
                            label="Approved Reimbursements"
                            value={formatMoney(row.reimbursementCost)}
                            sub={`${row.reimbursementCount} claim(s)`}
                          />
                          <DetailStat
                            label="Invoiced"
                            value={formatMoney(row.invoicedTotal)}
                            sub={`${row.invoiceCount} invoice(s)`}
                          />
                          <DetailStat
                            label="Billing vs. Estimate"
                            value={
                              row.billingVariance === null
                                ? "-"
                                : formatMoney(row.billingVariance)
                            }
                            sub={
                              row.billingVariance === null
                                ? "No invoice raised yet"
                                : row.billingVariance >= 0
                                  ? "Billed above the quote"
                                  : "Billed below the quote"
                            }
                          />
                          <DetailStat
                            label="Profit Basis"
                            value={
                              row.profitRevenue === null
                                ? PROFIT_BASIS_META[row.profitBasis].label
                                : `${PROFIT_BASIS_META[row.profitBasis].label}: ${formatMoney(row.profitRevenue)}`
                            }
                            sub={
                              row.profitBasis === "po"
                                ? `${PROFIT_BASIS_META.po.sub} (${row.poAmountCount} PO amount(s))`
                                : PROFIT_BASIS_META[row.profitBasis].sub
                            }
                          />
                          <DetailStat
                            label="Activity Window"
                            value={
                              row.earliestDate
                                ? formatDate(row.earliestDate)
                                : "-"
                            }
                            sub={
                              row.latestDate && row.latestDate !== row.earliestDate
                                ? `to ${formatDate(row.latestDate)}`
                                : undefined
                            }
                          />
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                          <NumbersList
                            label={`Estimate Numbers (${row.estimateCount})`}
                            numbers={row.estimateNumbers}
                            emptyText="No estimates linked to this project code."
                          />
                          <NumbersList
                            label={`Invoice Numbers (${row.invoiceCount})`}
                            numbers={row.invoiceNumbers}
                            emptyText="No invoices linked to this project code yet."
                          />
                          <AmountEntriesList
                            label={`Approved Budget Requests (${row.budgetRequestCount})`}
                            entries={row.budgetRequestEntries}
                            emptyText="No approved budget requests for this project code."
                            onSelect={(entry) =>
                              setSelectedBudgetRequestId(entry.id)
                            }
                            isSelectable={(entry) =>
                              budgetRequestById.has(entry.id)
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}

            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMN_COUNT}
                  className="px-5 py-14 text-center text-slate-500"
                >
                  No projects match the current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {resultsPerPage !== "all" && totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex h-9 items-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <p className="text-xs font-semibold text-slate-500">
            Page {currentPage} of {totalPages}
          </p>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="flex h-9 items-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {selectedBudgetRequest ? (
        <BudgetDetailsModal
          isOpen
          readOnly
          invoice={selectedBudgetRequest}
          onClose={() => setSelectedBudgetRequestId(null)}
        />
      ) : null}
    </div>
  );
}

function NumbersList({
  label,
  numbers,
  emptyText,
}: {
  label: string;
  numbers: string[];
  emptyText: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      {numbers.length === 0 ? (
        <p className="mt-1 text-xs text-slate-400">{emptyText}</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {numbers.map((number, index) => (
            <span
              key={`${number}-${index}`}
              className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700"
            >
              {number}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AmountEntriesList({
  label,
  entries,
  emptyText,
  onSelect,
  isSelectable,
}: {
  label: string;
  entries: BudgetRequestEntry[];
  emptyText: string;
  onSelect?: (entry: BudgetRequestEntry) => void;
  isSelectable?: (entry: BudgetRequestEntry) => boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      {entries.length === 0 ? (
        <p className="mt-1 text-xs text-slate-400">{emptyText}</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {entries.map((entry, index) => {
            const clickable =
              !!onSelect && (isSelectable ? isSelectable(entry) : true);

            const content = (
              <>
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  {entry.number}
                  {clickable ? (
                    <ExternalLink className="h-3 w-3 text-slate-400" />
                  ) : null}
                </span>
                <span className="font-bold text-slate-900">
                  {formatMoney(entry.amount)}
                </span>
              </>
            );

            return (
              <li key={`${entry.id || entry.number}-${index}`}>
                {clickable ? (
                  <button
                    type="button"
                    title="View budget request details"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect?.(entry);
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left text-xs transition hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  >
                    {content}
                  </button>
                ) : (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs">
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function DetailStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-slate-400">{sub}</p> : null}
    </div>
  );
}
