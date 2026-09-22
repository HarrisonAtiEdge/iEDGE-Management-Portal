import { useState } from "react";
import { FileSpreadsheet, FileText, RotateCcw, Search } from "lucide-react";
import type {
  ExportRowLimit,
  ProjectReportRow,
  ReportFiltersState,
} from "@/lib/reports/types";
import {
  DEFAULT_REPORT_FILTERS,
  EXPORT_ROW_LIMIT_OPTIONS,
  RESULTS_PER_PAGE_OPTIONS,
} from "@/lib/reports/types";
import {
  exportProjectReportsToExcel,
  exportProjectReportsToPdf,
} from "@/lib/reports/exportReports";

type Props = {
  filters: ReportFiltersState;
  onChange: (next: ReportFiltersState) => void;
  projectOptions: { code: string; name: string }[];
  clients: string[];
  exportRows: ProjectReportRow[];
};

const fieldClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100";

export default function ReportFilters({
  filters,
  onChange,
  projectOptions,
  clients,
  exportRows,
}: Props) {
  const update = (patch: Partial<ReportFiltersState>) =>
    onChange({ ...filters, ...patch });

  const isDefault =
    JSON.stringify(filters) === JSON.stringify(DEFAULT_REPORT_FILTERS);

  const [exportLimit, setExportLimit] = useState<ExportRowLimit>("all");

  const rowsToExport =
    exportLimit === "all" ? exportRows : exportRows.slice(0, exportLimit);

  const handleExportExcel = () => {
    if (rowsToExport.length === 0) return;
    exportProjectReportsToExcel(rowsToExport);
  };

  const handleExportPdf = () => {
    if (rowsToExport.length === 0) return;
    exportProjectReportsToPdf(rowsToExport);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
        <div className="xl:col-span-2">
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">
            Search
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className={`${fieldClass} pl-9`}
              placeholder="Project code or client..."
              value={filters.search}
              onChange={(event) => update({ search: event.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">
            Project
          </label>
          <select
            className={fieldClass}
            value={filters.projectCode}
            onChange={(event) => update({ projectCode: event.target.value })}
          >
            <option value="all">All Projects</option>
            {projectOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">
            Client
          </label>
          <select
            className={fieldClass}
            value={filters.client}
            onChange={(event) => update({ client: event.target.value })}
          >
            <option value="all">All Clients</option>
            {clients.map((client) => (
              <option key={client} value={client}>
                {client}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">
            Status
          </label>
          <select
            className={fieldClass}
            value={filters.status}
            onChange={(event) =>
              update({ status: event.target.value as ReportFiltersState["status"] })
            }
          >
            <option value="all">All Statuses</option>
            <option value="estimate_only">Estimate Only</option>
            <option value="invoiced">Invoiced</option>
            <option value="no_estimate_data">No Estimate on File</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">
            Payment
          </label>
          <select
            className={fieldClass}
            value={filters.paymentFilter}
            onChange={(event) =>
              update({
                paymentFilter: event.target
                  .value as ReportFiltersState["paymentFilter"],
              })
            }
          >
            <option value="all">All</option>
            <option value="fully_paid">100% Paid</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="no_invoice">Not Invoiced Yet</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">
            Profitability
          </label>
          <select
            className={fieldClass}
            value={filters.profitFilter}
            onChange={(event) =>
              update({
                profitFilter: event.target
                  .value as ReportFiltersState["profitFilter"],
              })
            }
          >
            <option value="all">All</option>
            <option value="profitable">Profitable</option>
            <option value="breakeven">Break-even</option>
            <option value="loss">Loss-making</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">
            From Date
          </label>
          <input
            type="date"
            className={fieldClass}
            value={filters.dateFrom}
            onChange={(event) => update({ dateFrom: event.target.value })}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">
            To Date
          </label>
          <input
            type="date"
            className={fieldClass}
            value={filters.dateTo}
            onChange={(event) => update({ dateTo: event.target.value })}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">
            Results per page
          </label>
          <select
            className={fieldClass}
            value={String(filters.resultsPerPage)}
            onChange={(event) =>
              update({
                resultsPerPage: (event.target.value === "all"
                  ? "all"
                  : Number(event.target.value)) as ReportFiltersState["resultsPerPage"],
              })
            }
          >
            {RESULTS_PER_PAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "Show All" : `${option} per page`}
              </option>
            ))}
          </select>
        </div>

        <div className="xl:col-span-2">
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">
            Export
          </label>
          <select
            className={fieldClass}
            value={String(exportLimit)}
            onChange={(event) =>
              setExportLimit(
                (event.target.value === "all"
                  ? "all"
                  : Number(event.target.value)) as ExportRowLimit,
              )
            }
          >
            {EXPORT_ROW_LIMIT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "All matching rows" : `Top ${option} rows`}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            type="button"
            disabled={rowsToExport.length === 0}
            onClick={handleExportExcel}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </button>

          <button
            type="button"
            disabled={rowsToExport.length === 0}
            onClick={handleExportPdf}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileText className="h-4 w-4" />
            PDF
          </button>

          <button
            type="button"
            disabled={isDefault}
            onClick={() => onChange(DEFAULT_REPORT_FILTERS)}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
}
