import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// One amount the vendor is owed: a Purchase Order, the vendor's share of a
// Budget Request, or a Record payment (which is paid when recorded).
export type VendorStatementBill = {
  key: string;
  sourceLabel: string;
  reference: string;
  purpose: string;
  projectName: string;
  projectCode: string;
  date: Date | null;
  payable: number;
  paid: number;
  pending: number;
};

// One payment made to the vendor against a bill.
export type VendorStatementPayment = {
  id: string;
  billKey: string;
  sourceLabel: string;
  reference: string;
  purpose: string;
  projectName: string;
  projectCode: string;
  date: Date | null;
  amount: number;
  // Remaining on the bill right after this payment.
  pendingAfter: number;
  accountName: string;
  paymentMethod: string;
  transactionReference: string;
  // True when one payment covered several vendors and this is this vendor's
  // calculated share of it.
  isShare: boolean;
};

export type VendorStatement = {
  vendorName: string;
  address: string;
  ntn: string;
  paymentTerms: string;
  openingBalance: number;
  bills: VendorStatementBill[];
  payments: VendorStatementPayment[];
};

const NO_PROJECT = "__general__";

const formatAmount = (value: number) =>
  `PKR ${Number(value || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date: Date | null) =>
  date
    ? date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

const toInputDate = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const getProjectKey = (item: { projectName: string; projectCode: string }) =>
  item.projectName && item.projectName !== "-"
    ? item.projectName
    : item.projectCode || NO_PROJECT;

const getProjectLabel = (item: { projectName: string; projectCode: string }) => {
  const name = item.projectName && item.projectName !== "-" ? item.projectName : "";

  if (name && item.projectCode && item.projectCode !== name) {
    return `${name} · ${item.projectCode}`;
  }

  return name || item.projectCode || "General (no project)";
};

const csvValue = (value: unknown) => {
  const text = String(value ?? "");
  const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
};

function SummaryCard({
  label,
  value,
  hint,
  tone = "slate",
}: {
  label: string;
  value: number;
  hint?: string;
  tone?: "slate" | "emerald" | "amber";
}) {
  const tones = {
    slate: "border-slate-200 bg-white text-slate-950",
    emerald: "border-emerald-100 bg-emerald-50/60 text-emerald-900",
    amber: "border-amber-100 bg-amber-50/60 text-amber-900",
  };

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-bold tabular-nums">
        {formatAmount(value)}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default function VendorAccountStatement({
  open,
  onOpenChange,
  statement,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statement: VendorStatement | null;
}) {
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Each vendor's statement opens with clean filters.
  useEffect(() => {
    setSearch("");
    setProjectFilter("all");
    setDateFrom("");
    setDateTo("");
  }, [statement?.vendorName]);

  const totals = useMemo(() => {
    if (!statement) return { payable: 0, paid: 0, outstanding: 0 };

    const billsPayable = statement.bills.reduce((sum, bill) => sum + bill.payable, 0);
    const paid = statement.bills.reduce((sum, bill) => sum + bill.paid, 0);
    const pending = statement.bills.reduce((sum, bill) => sum + bill.pending, 0);

    return {
      payable: statement.openingBalance + billsPayable,
      paid,
      outstanding: statement.openingBalance + pending,
    };
  }, [statement]);

  const projects = useMemo(() => {
    if (!statement) return [];

    const map = new Map<
      string,
      { key: string; label: string; bills: number; payable: number; paid: number; pending: number }
    >();

    statement.bills.forEach((bill) => {
      const key = getProjectKey(bill);
      const existing = map.get(key) || {
        key,
        label: getProjectLabel(bill),
        bills: 0,
        payable: 0,
        paid: 0,
        pending: 0,
      };

      existing.bills += 1;
      existing.payable += bill.payable;
      existing.paid += bill.paid;
      existing.pending += bill.pending;
      map.set(key, existing);
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.key === NO_PROJECT) return 1;
      if (b.key === NO_PROJECT) return -1;
      return b.pending - a.pending || a.label.localeCompare(b.label);
    });
  }, [statement]);

  const matchesFilters = (
    item: VendorStatementPayment | VendorStatementBill,
    searchableText: string[],
  ) => {
    if (projectFilter !== "all" && getProjectKey(item) !== projectFilter) {
      return false;
    }

    if (dateFrom || dateTo) {
      if (!item.date) return false;
      const day = toInputDate(item.date);
      if (dateFrom && day < dateFrom) return false;
      if (dateTo && day > dateTo) return false;
    }

    const query = search.trim().toLowerCase();
    if (!query) return true;

    return searchableText.join(" ").toLowerCase().includes(query);
  };

  const filteredPayments = useMemo(() => {
    if (!statement) return [];

    return statement.payments
      .filter((payment) =>
        matchesFilters(payment, [
          payment.purpose,
          payment.reference,
          payment.sourceLabel,
          getProjectLabel(payment),
          payment.accountName,
          payment.paymentMethod,
          payment.transactionReference,
        ]),
      )
      .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statement, search, projectFilter, dateFrom, dateTo]);

  const outstandingBills = useMemo(() => {
    if (!statement) return [];

    return statement.bills
      .filter((bill) => bill.pending > 0.009)
      .filter((bill) =>
        matchesFilters(bill, [
          bill.purpose,
          bill.reference,
          bill.sourceLabel,
          getProjectLabel(bill),
        ]),
      )
      .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statement, search, projectFilter, dateFrom, dateTo]);

  const filteredPaidTotal = filteredPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );
  const hasFilters = Boolean(
    search.trim() || projectFilter !== "all" || dateFrom || dateTo,
  );

  const clearFilters = () => {
    setSearch("");
    setProjectFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const downloadCsv = () => {
    if (!statement) return;

    const rows = [
      [
        "Date",
        "Purpose",
        "Source",
        "Reference",
        "Project",
        "Paid From Account",
        "Payment Method",
        "Transaction Reference",
        "Amount Paid",
        "Pending After Payment",
      ],
      ...filteredPayments.map((payment) => [
        formatDate(payment.date),
        payment.purpose,
        payment.sourceLabel,
        payment.reference,
        getProjectLabel(payment),
        payment.accountName || "-",
        payment.paymentMethod || "-",
        payment.transactionReference || "-",
        payment.amount.toFixed(2),
        payment.pendingAfter.toFixed(2),
      ]),
    ];

    const blob = new Blob(
      [rows.map((row) => row.map(csvValue).join(",")).join("\n")],
      { type: "text/csv;charset=utf-8;" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${statement.vendorName.replace(/[^a-z0-9]+/gi, "-")}-account-statement.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const inputClass =
    "h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-6xl flex-col gap-0 overflow-hidden rounded-3xl p-0">
        {statement && (
          <>
            <DialogHeader className="border-b border-slate-100 px-4 py-4 text-left sm:px-6 sm:py-5">
              <div className="flex flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Account Statement
                  </p>
                  <DialogTitle className="mt-1 break-words text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                    {statement.vendorName}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-sm text-slate-500">
                    {[
                      statement.address,
                      statement.ntn ? `NTN ${statement.ntn}` : "",
                      statement.paymentTerms
                        ? `Terms: ${statement.paymentTerms}`
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Vendor statement of payments and balances"}
                  </DialogDescription>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 rounded-xl"
                  onClick={downloadCsv}
                  disabled={filteredPayments.length === 0}
                >
                  <Download className="h-4 w-4" />
                  Download CSV
                </Button>
              </div>
            </DialogHeader>

            <div className="min-w-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-6 sm:py-6">
              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                  label="Opening Balance"
                  value={statement.openingBalance}
                  hint="Carried forward from the supplier record"
                />
                <SummaryCard
                  label="Total Payable"
                  value={totals.payable}
                  hint="Opening balance plus all bills"
                />
                <SummaryCard label="Total Paid" value={totals.paid} tone="emerald" />
                <SummaryCard
                  label="Outstanding"
                  value={totals.outstanding}
                  hint="As of today"
                  tone="amber"
                />
              </section>

              <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className={`${inputClass} w-full pl-9`}
                    placeholder="Search purpose, reference, account, cheque..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>

                <select
                  className={`${inputClass} lg:w-56`}
                  value={projectFilter}
                  onChange={(event) => setProjectFilter(event.target.value)}
                >
                  <option value="all">All projects</option>
                  {projects.map((project) => (
                    <option key={project.key} value={project.key}>
                      {project.label}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                  <input
                    type="date"
                    className={`${inputClass} w-full min-w-0`}
                    value={dateFrom}
                    max={dateTo || undefined}
                    onChange={(event) => setDateFrom(event.target.value)}
                    aria-label="From date"
                  />
                  <span className="text-xs text-slate-400">to</span>
                  <input
                    type="date"
                    className={`${inputClass} w-full min-w-0`}
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(event) => setDateTo(event.target.value)}
                    aria-label="To date"
                  />
                </div>

                {hasFilters && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="gap-1 rounded-xl text-slate-500"
                    onClick={clearFilters}
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                )}
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">
                  Project-wise Balance
                </h3>

                {projects.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                    No bills or purchase orders found for this vendor.
                  </p>
                ) : (
                  <>
                  {/* Below md: one card per project. */}
                  <div className="space-y-2 md:hidden">
                    {projects.map((project) => (
                      <button
                        key={project.key}
                        type="button"
                        onClick={() =>
                          setProjectFilter(
                            projectFilter === project.key ? "all" : project.key,
                          )
                        }
                        className={`w-full rounded-2xl border p-3 text-left transition ${
                          projectFilter === project.key
                            ? "border-slate-400 bg-slate-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="min-w-0 break-words text-sm font-medium text-slate-800">
                            {project.label}
                          </p>
                          <span className="shrink-0 text-xs text-slate-400">
                            {project.bills} bill{project.bills === 1 ? "" : "s"}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                          <div className="min-w-0">
                            <p className="text-slate-400">Payable</p>
                            <p className="break-words font-medium tabular-nums">
                              {formatAmount(project.payable)}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-slate-400">Paid</p>
                            <p className="break-words font-medium tabular-nums text-emerald-700">
                              {formatAmount(project.paid)}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-slate-400">Pending</p>
                            <p
                              className={`break-words font-semibold tabular-nums ${
                                project.pending > 0.009
                                  ? "text-amber-700"
                                  : "text-slate-400"
                              }`}
                            >
                              {formatAmount(project.pending)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
                    <table className="w-full table-fixed text-sm">
                      <colgroup>
                        <col className="w-[34%]" />
                        <col className="w-[10%]" />
                        <col className="w-[18.66%]" />
                        <col className="w-[18.66%]" />
                        <col className="w-[18.66%]" />
                      </colgroup>
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Project</th>
                          <th className="px-4 py-3 text-right font-semibold">Bills</th>
                          <th className="px-4 py-3 text-right font-semibold">Payable</th>
                          <th className="px-4 py-3 text-right font-semibold">Paid</th>
                          <th className="px-4 py-3 text-right font-semibold">Pending</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {projects.map((project) => (
                          <tr
                            key={project.key}
                            className={
                              projectFilter === project.key ? "bg-slate-50" : ""
                            }
                          >
                            <td className="break-words px-4 py-3">
                              <button
                                type="button"
                                className="text-left font-medium text-slate-800 hover:underline"
                                onClick={() =>
                                  setProjectFilter(
                                    projectFilter === project.key
                                      ? "all"
                                      : project.key,
                                  )
                                }
                                title="Filter the statement by this project"
                              >
                                {project.label}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                              {project.bills}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums">
                              {formatAmount(project.payable)}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-emerald-700">
                              {formatAmount(project.paid)}
                            </td>
                            <td
                              className={`px-4 py-3 text-right font-semibold tabular-nums ${
                                project.pending > 0.009
                                  ? "text-amber-700"
                                  : "text-slate-400"
                              }`}
                            >
                              {formatAmount(project.pending)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  </>
                )}
              </section>

              <section>
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Payment History
                  </h3>
                  <p className="text-xs text-slate-500">
                    {filteredPayments.length} payment
                    {filteredPayments.length === 1 ? "" : "s"} ·{" "}
                    {formatAmount(filteredPaidTotal)}
                    {hasFilters ? " (filtered)" : ""}
                  </p>
                </div>

                {filteredPayments.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                    <FileText className="h-5 w-5 text-slate-400" />
                    {hasFilters
                      ? "No payments match these filters."
                      : "No payments have been made to this vendor yet."}
                  </div>
                ) : (
                  <>
                  {/* Below lg: one card per payment. */}
                  <div className="space-y-2 lg:hidden">
                    {filteredPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="rounded-2xl border border-slate-200 bg-white p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="break-words text-sm font-medium text-slate-800">
                              {payment.purpose}
                            </p>
                            <p className="mt-0.5 break-words text-xs text-slate-500">
                              {formatDate(payment.date)} · {payment.sourceLabel} ·{" "}
                              {payment.reference}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-semibold tabular-nums text-emerald-700">
                              {formatAmount(payment.amount)}
                            </p>
                            {payment.isShare && (
                              <p className="text-[11px] text-slate-400">
                                vendor share
                              </p>
                            )}
                          </div>
                        </div>
                        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-slate-100 pt-2 text-xs">
                          <div className="min-w-0">
                            <dt className="text-slate-400">Project</dt>
                            <dd className="break-words text-slate-700">
                              {getProjectLabel(payment)}
                            </dd>
                          </div>
                          <div className="min-w-0">
                            <dt className="text-slate-400">Pending after</dt>
                            <dd className="tabular-nums text-slate-700">
                              {formatAmount(payment.pendingAfter)}
                            </dd>
                          </div>
                          <div className="min-w-0">
                            <dt className="text-slate-400">Paid from</dt>
                            <dd className="break-words text-slate-700">
                              {payment.accountName || "-"}
                            </dd>
                          </div>
                          <div className="min-w-0">
                            <dt className="text-slate-400">Method</dt>
                            <dd className="break-words text-slate-700">
                              {payment.paymentMethod || "-"}
                              {payment.transactionReference
                                ? ` · ${payment.transactionReference}`
                                : ""}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    ))}
                  </div>

                  <div className="hidden overflow-hidden rounded-2xl border border-slate-200 lg:block">
                    <table className="w-full table-fixed text-sm">
                      <colgroup>
                        <col className="w-[10%]" />
                        <col className="w-[24%]" />
                        <col className="w-[14%]" />
                        <col className="w-[13%]" />
                        <col className="w-[14%]" />
                        <col className="w-[13%]" />
                        <col className="w-[12%]" />
                      </colgroup>
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-3 py-3 text-left font-semibold">Date</th>
                          <th className="px-3 py-3 text-left font-semibold">Purpose</th>
                          <th className="px-3 py-3 text-left font-semibold">Project</th>
                          <th className="px-3 py-3 text-left font-semibold">Paid From</th>
                          <th className="px-3 py-3 text-left font-semibold">Method / Ref</th>
                          <th className="px-3 py-3 text-right font-semibold">Amount Paid</th>
                          <th className="px-3 py-3 text-right font-semibold">Pending</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredPayments.map((payment) => (
                          <tr key={payment.id} className="align-top">
                            <td className="px-3 py-3 text-slate-600">
                              {formatDate(payment.date)}
                            </td>
                            <td className="break-words px-3 py-3">
                              <p className="font-medium text-slate-800">
                                {payment.purpose}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {payment.sourceLabel} · {payment.reference}
                              </p>
                            </td>
                            <td className="break-words px-3 py-3 text-slate-700">
                              {getProjectLabel(payment)}
                            </td>
                            <td className="break-words px-3 py-3 text-slate-700">
                              {payment.accountName || "-"}
                            </td>
                            <td className="px-3 py-3">
                              <p className="break-words text-slate-700">
                                {payment.paymentMethod || "-"}
                              </p>
                              {payment.transactionReference && (
                                <p className="mt-0.5 break-all text-xs text-slate-500">
                                  {payment.transactionReference}
                                </p>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right font-semibold tabular-nums text-emerald-700">
                              {formatAmount(payment.amount)}
                              {payment.isShare && (
                                <p
                                  className="mt-0.5 text-[11px] font-normal text-slate-400"
                                  title="One payment covered several vendors; this is this vendor's share."
                                >
                                  vendor share
                                </p>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums text-slate-600">
                              {formatAmount(payment.pendingAfter)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  </>
                )}
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">
                  Outstanding Bills
                </h3>

                {outstandingBills.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                    {hasFilters
                      ? "No outstanding bills match these filters."
                      : "Nothing is pending for this vendor."}
                  </p>
                ) : (
                  <>
                  {/* Below md: one card per outstanding bill. */}
                  <div className="space-y-2 md:hidden">
                    {outstandingBills.map((bill) => (
                      <div
                        key={bill.key}
                        className="rounded-2xl border border-slate-200 bg-white p-3"
                      >
                        <p className="break-words text-sm font-medium text-slate-800">
                          {bill.sourceLabel} · {bill.reference}
                        </p>
                        <p className="mt-0.5 line-clamp-2 break-words text-xs text-slate-500">
                          {formatDate(bill.date)} · {getProjectLabel(bill)} ·{" "}
                          {bill.purpose}
                        </p>
                        <div className="mt-2 grid grid-cols-3 gap-2 border-t border-slate-100 pt-2 text-xs">
                          <div className="min-w-0">
                            <p className="text-slate-400">Payable</p>
                            <p className="break-words tabular-nums">
                              {formatAmount(bill.payable)}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-slate-400">Paid</p>
                            <p className="break-words tabular-nums text-emerald-700">
                              {formatAmount(bill.paid)}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-slate-400">Pending</p>
                            <p className="break-words font-semibold tabular-nums text-amber-700">
                              {formatAmount(bill.pending)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
                    <table className="w-full table-fixed text-sm">
                      <colgroup>
                        <col className="w-[12%]" />
                        <col className="w-[28%]" />
                        <col className="w-[18%]" />
                        <col className="w-[14%]" />
                        <col className="w-[14%]" />
                        <col className="w-[14%]" />
                      </colgroup>
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-3 py-3 text-left font-semibold">Date</th>
                          <th className="px-3 py-3 text-left font-semibold">Bill</th>
                          <th className="px-3 py-3 text-left font-semibold">Project</th>
                          <th className="px-3 py-3 text-right font-semibold">Payable</th>
                          <th className="px-3 py-3 text-right font-semibold">Paid</th>
                          <th className="px-3 py-3 text-right font-semibold">Pending</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {outstandingBills.map((bill) => (
                          <tr key={bill.key} className="align-top">
                            <td className="px-3 py-3 text-slate-600">
                              {formatDate(bill.date)}
                            </td>
                            <td className="break-words px-3 py-3">
                              <p className="font-medium text-slate-800">
                                {bill.sourceLabel} · {bill.reference}
                              </p>
                              <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                                {bill.purpose}
                              </p>
                            </td>
                            <td className="break-words px-3 py-3 text-slate-700">
                              {getProjectLabel(bill)}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums">
                              {formatAmount(bill.payable)}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums text-emerald-700">
                              {formatAmount(bill.paid)}
                            </td>
                            <td className="px-3 py-3 text-right font-semibold tabular-nums text-amber-700">
                              {formatAmount(bill.pending)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  </>
                )}
              </section>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
