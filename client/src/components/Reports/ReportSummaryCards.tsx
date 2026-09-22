import {
  Briefcase,
  HandCoins,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { ProjectReportRow } from "@/lib/reports/types";
import { formatCompactMoney, formatPercent } from "@/lib/reports/format";

type Props = {
  rows: ProjectReportRow[];
};

export default function ReportSummaryCards({ rows }: Props) {
  const totals = rows.reduce(
    (acc, row) => {
      acc.estimateTotal += row.estimateTotal;
      acc.totalCost += row.totalCost;
      acc.invoicedTotal += row.invoicedTotal;
      // Only invoiced projects have a real profit figure — estimate-only
      // projects contribute nothing here, same as the table shows "-" for
      // them instead of a projected number.
      acc.profit += row.profit ?? 0;
      return acc;
    },
    { estimateTotal: 0, totalCost: 0, invoicedTotal: 0, profit: 0 },
  );

  const avgMargin =
    totals.invoicedTotal > 0 ? (totals.profit / totals.invoicedTotal) * 100 : 0;
  const profitable = rows.filter(
    (row) => row.profit !== null && row.profit > 0,
  ).length;

  const cards = [
    {
      label: "Projects",
      value: String(rows.length),
      sub: `${profitable} profitable`,
      icon: Briefcase,
      accent: "bg-slate-100 text-slate-600",
    },
    {
      label: "Estimated Value",
      value: formatCompactMoney(totals.estimateTotal),
      sub: "Sum of all estimates",
      icon: Receipt,
      accent: "bg-blue-100 text-blue-600",
    },
    {
      label: "Total Cost",
      value: formatCompactMoney(totals.totalCost),
      sub: "Approved budget + reimbursements",
      icon: Wallet,
      accent: "bg-amber-100 text-amber-600",
    },
    {
      label: "Invoiced",
      value: formatCompactMoney(totals.invoicedTotal),
      sub: "Sum of all invoices raised",
      icon: HandCoins,
      accent: "bg-purple-100 text-purple-600",
    },
    {
      label: "Profit",
      value: formatCompactMoney(totals.profit),
      sub: `${formatPercent(avgMargin)} avg. margin`,
      icon: totals.profit >= 0 ? TrendingUp : TrendingDown,
      accent:
        totals.profit >= 0
          ? "bg-emerald-100 text-emerald-600"
          : "bg-red-100 text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {card.label}
            </p>

            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.accent}`}
            >
              <card.icon className="h-4 w-4" />
            </div>
          </div>

          <p className="mt-3 text-2xl font-black tracking-[-0.02em] text-slate-950">
            {card.value}
          </p>

          <p className="mt-1 text-xs text-slate-400">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
