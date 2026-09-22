import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ProjectReportRow } from "@/lib/reports/types";
import { formatCompactMoney, formatMoney } from "@/lib/reports/format";

type Props = {
  rows: ProjectReportRow[];
};

const TOP_N = 10;

const tooltipStyle = {
  borderRadius: "16px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
};

const axisTick = { fontSize: 12, fill: "#64748b" };

const STATUS_COLORS = ["#059669", "#f59e0b", "#94a3b8"];

export default function ProjectReportCharts({ rows }: Props) {
  const topProjects = [...rows]
    .sort(
      (a, b) =>
        b.invoicedTotal + b.estimateTotal - (a.invoicedTotal + a.estimateTotal),
    )
    .slice(0, TOP_N)
    .map((row) => ({
      name: row.projectName || row.projectCode,
      Revenue: row.invoicedTotal || row.estimateTotal,
      Cost: row.totalCost,
      // Omitted (not zeroed) for estimate-only projects — there's no real
      // profit figure to plot until something is actually invoiced.
      Profit: row.profit ?? undefined,
    }));

  const statusCounts = rows.reduce(
    (acc, row) => {
      acc[row.status] += 1;
      return acc;
    },
    { invoiced: 0, estimate_only: 0, no_estimate_data: 0 } as Record<
      ProjectReportRow["status"],
      number
    >,
  );

  const pieData = [
    { name: "Invoiced", value: statusCounts.invoiced },
    { name: "Estimate Only", value: statusCounts.estimate_only },
    { name: "No Estimate", value: statusCounts.no_estimate_data },
  ].filter((entry) => entry.value > 0);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
        <div className="mb-4">
          <h2 className="font-bold text-slate-950">
            Revenue, Cost &amp; Profit by Project
          </h2>
          <p className="text-sm text-slate-500">
            Top {Math.min(TOP_N, rows.length)} projects by revenue.
          </p>
        </div>

        {topProjects.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={topProjects}>
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={axisTick}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={axisTick}
                tickFormatter={(value) => formatCompactMoney(Number(value))}
              />
              <Tooltip
                formatter={(value: any) => formatMoney(Number(value))}
                contentStyle={tooltipStyle}
              />
              <Legend />
              <Bar dataKey="Revenue" radius={[8, 8, 0, 0]} fill="#2563eb" />
              <Bar dataKey="Cost" radius={[8, 8, 0, 0]} fill="#f59e0b" />
              <Bar dataKey="Profit" radius={[8, 8, 0, 0]} fill="#059669" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="font-bold text-slate-950">Project Status Mix</h2>
          <p className="text-sm text-slate-500">
            Where each project stands right now.
          </p>
        </div>

        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={108}
                innerRadius={62}
                paddingAngle={4}
                label={({ name, value }) => `${name} (${value})`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[index]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
      No data available for the current filters.
    </div>
  );
}
