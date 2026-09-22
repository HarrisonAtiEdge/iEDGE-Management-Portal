import { Info } from "lucide-react";
import type { RtdClientActivity } from "@/lib/reports/types";
import { formatMoney } from "@/lib/reports/format";

type Props = {
  activity: RtdClientActivity | null;
};

export default function RtdClientActivityPanel({ activity }: Props) {
  if (!activity) return null;

  const marginClass =
    activity.margin > 0
      ? "text-emerald-600"
      : activity.margin < 0
        ? "text-red-600"
        : "text-slate-500";

  return (
    <div className="rounded-3xl border border-blue-200 bg-blue-50/40 p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <div>
          <h2 className="font-bold text-slate-950">
            RTD Activity — {activity.client}
          </h2>
          <p className="text-sm text-slate-500">
            RTD (Records / Estimate / Invoice) has no project code — it's
            tracked per client only, so this is kept separate from the
            project table above rather than attributed to any one project.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RtdStat
          label="Payment Requirements"
          value={formatMoney(activity.recordsTotal)}
          sub={`${activity.recordsCount} record(s)`}
        />
        <RtdStat
          label="RTD Estimates"
          value={formatMoney(activity.estimatesTotal)}
          sub={`${activity.estimatesCount} estimate(s)`}
        />
        <RtdStat
          label="RTD Invoiced"
          value={formatMoney(activity.invoicedTotal)}
          sub={`${activity.invoicesCount} invoice(s)`}
        />
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            RTD Margin
          </p>
          <p className={`mt-1 text-sm font-bold ${marginClass}`}>
            {formatMoney(activity.margin)}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            Invoiced minus payment requirements
          </p>
        </div>
      </div>
    </div>
  );
}

function RtdStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
    </div>
  );
}
