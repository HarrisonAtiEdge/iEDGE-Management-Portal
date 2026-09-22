import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useReportsRawData } from "@/lib/reports/useReportsRawData";
import {
  buildProjectReports,
  buildRtdClientActivity,
} from "@/lib/reports/aggregateProjectReports";
import { DEFAULT_REPORT_FILTERS } from "@/lib/reports/types";
import type { ReportFiltersState } from "@/lib/reports/types";
import ReportFilters from "@/components/Reports/ReportFilters";
import ReportSummaryCards from "@/components/Reports/ReportSummaryCards";
import ProjectReportCharts from "@/components/Reports/ProjectReportCharts";
import ProjectReportTable from "@/components/Reports/ProjectReportTable";
import RtdClientActivityPanel from "@/components/Reports/RtdClientActivityPanel";

export default function Reports() {
  const { data, loading, error } = useReportsRawData();
  const [filters, setFilters] = useState<ReportFiltersState>(
    DEFAULT_REPORT_FILTERS,
  );

  const allRows = useMemo(() => buildProjectReports(data), [data]);
  const rtdActivity = useMemo(() => buildRtdClientActivity(data), [data]);

  const projectOptions = useMemo(
    () =>
      allRows
        .map((row) => ({ code: row.projectCode, name: row.projectName }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allRows],
  );

  const clients = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...allRows.map((row) => row.client),
            ...rtdActivity.map((row) => row.client),
          ].filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [allRows, rtdActivity],
  );

  const filteredRows = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return allRows.filter((row) => {
      if (filters.projectCode !== "all" && row.projectCode !== filters.projectCode) {
        return false;
      }

      if (filters.client !== "all" && row.client !== filters.client) {
        return false;
      }

      if (filters.status !== "all" && row.status !== filters.status) {
        return false;
      }

      if (
        filters.paymentFilter !== "all" &&
        row.paymentStatus !== filters.paymentFilter
      ) {
        return false;
      }

      // A project with no profit figure yet (estimate-only) doesn't belong
      // in any of the profit/loss/break-even buckets — those buckets are
      // about invoiced projects only.
      if (filters.profitFilter !== "all") {
        if (row.profit === null) return false;
        if (filters.profitFilter === "profitable" && row.profit <= 0) return false;
        if (filters.profitFilter === "loss" && row.profit >= 0) return false;
        if (
          filters.profitFilter === "breakeven" &&
          Math.abs(row.profit) > 0.009
        ) {
          return false;
        }
      }

      if (filters.dateFrom) {
        if (!row.latestDate || row.latestDate < filters.dateFrom) return false;
      }

      if (filters.dateTo) {
        if (!row.earliestDate || row.earliestDate > filters.dateTo) return false;
      }

      if (search) {
        const haystack = `${row.projectCode} ${row.projectName} ${row.client}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      return true;
    });
  }, [allRows, filters]);

  const selectedRtdActivity = useMemo(() => {
    if (filters.client === "all") return null;
    return (
      rtdActivity.find(
        (row) => row.client.toLowerCase() === filters.client.toLowerCase(),
      ) || null
    );
  }, [rtdActivity, filters.client]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
          Reports
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Per-project profit — estimated value minus approved budget requests
          and reimbursements, compared against what's actually been invoiced.
        </p>
      </div>

      <ReportFilters
        filters={filters}
        onChange={setFilters}
        projectOptions={projectOptions}
        clients={clients}
        exportRows={filteredRows}
      />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white py-20 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading report data...
        </div>
      ) : (
        <>
          <ReportSummaryCards rows={filteredRows} />

          <ProjectReportCharts rows={filteredRows} />

          <RtdClientActivityPanel activity={selectedRtdActivity} />

          <ProjectReportTable
            rows={filteredRows}
            resultsPerPage={filters.resultsPerPage}
          />
        </>
      )}
    </div>
  );
}
