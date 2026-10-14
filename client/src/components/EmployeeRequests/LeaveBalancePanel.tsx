import {
  PAID_LEAVE_TYPES,
  formatDays,
  getLeaveType,
  type LeaveBalance,
} from "@/lib/employeeRequests";
import { panelClass } from "./shared";

// The employee's leave for the year: paid leave left out of 14 annual +
// 8 casual + 8 medical, including leave and absences an admin or finance
// recorded for them (absences come out of annual first, then casual).
export default function LeaveBalancePanel({
  balance,
}: {
  balance: LeaveBalance;
}) {
  const nothingYet =
    balance.leaveTaken === 0 &&
    PAID_LEAVE_TYPES.every((type) => balance.types[type].pending === 0);
  const unpaidDays = balance.absentUnpaid + balance.unpaidTaken;

  return (
    <div className={`${panelClass} p-5 md:p-6`}>
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Paid leave {balance.year}
          </div>
          <h2 className="mt-1 text-lg font-bold text-slate-950">
            Your leave balance
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          {nothingYet
            ? "No leave taken yet this year, you have all 30 paid days."
            : `${formatDays(balance.leaveTaken)} taken this year · annual leave is one block per year`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PAID_LEAVE_TYPES.map((type) => {
          const item = balance.types[type];
          const leaveType = getLeaveType(type);
          const share = (days: number) =>
            `${Math.min(100, (days / item.entitlement) * 100)}%`;

          return (
            <div key={type} className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <span className={`h-2 w-2 rounded-full ${leaveType.dot}`} />
                  {leaveType.label}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {item.approved + item.absent} / {item.entitlement} taken
                </span>
              </div>

              <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                {formatDays(item.remaining)}
                <span className="ml-1.5 text-sm font-semibold text-slate-400">
                  left
                </span>
              </div>

              <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-slate-200">
                <div className={leaveType.bar} style={{ width: share(item.approved) }} />
                <div className="bg-red-700" style={{ width: share(item.absent) }} />
                <div
                  className={`${leaveType.bar} opacity-40`}
                  style={{ width: share(item.pending) }}
                />
              </div>

              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                <span>{item.approved} leave</span>
                {item.absent > 0 && (
                  <span className="font-medium text-red-700">
                    {item.absent} absent
                  </span>
                )}
                {item.pending > 0 && <span>{item.pending} pending</span>}
              </div>
            </div>
          );
        })}

        <div className="rounded-2xl bg-red-50 p-4">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-red-800">
            <span className="h-2 w-2 rounded-full bg-red-700" />
            Absent / Unpaid
          </div>

          <div className="mt-2 text-2xl font-black tracking-tight text-red-900">
            {formatDays(balance.absentDays)}
            <span className="ml-1.5 text-sm font-semibold text-red-700/70">
              absent
            </span>
          </div>

          <div className="mt-3 space-y-1 text-xs text-red-800">
            <p>
              {balance.absentDays > 0
                ? "Recorded by admin or finance, taken from annual then casual leave."
                : "No absences recorded."}
            </p>
            <p className="font-semibold">{formatDays(unpaidDays)} unpaid</p>
          </div>
        </div>
      </div>
    </div>
  );
}
