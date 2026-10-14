import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LEAVE_DAY_PORTIONS,
  PAID_LEAVE_TYPES,
  RECORDABLE_LEAVE_TYPES,
  REQUEST_STATUS_STYLES,
  countLeaveDays,
  findLeaveClash,
  formatDateRange,
  formatDateValue,
  formatDays,
  getLeaveAllowanceProblem,
  getLeaveBalance,
  getLeaveType,
  isLeaveRecordUpdated,
  isMainAdmin,
  isPaidLeaveType,
  parseDateValue,
  toDateValue,
  type LeaveBalance,
  type LeaveDayPortion,
  type LeaveInput,
  type LeaveRecordStatus,
  type LeaveRequest,
  type LeaveType,
  type RequestActor,
} from "@/lib/employeeRequests";
import { ChoicePills, InfoBox, SummaryBox } from "./NewRequestDialog";
import { fieldLabelClass, humanizeRole } from "./shared";
import { useActiveUsers } from "./useActiveUsers";

// The selected employee's leave so far in the year: paid leave taken out of
// each allowance, absences, and unpaid leave.
function TakenSummary({ balance }: { balance: LeaveBalance }) {
  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Leave taken in {balance.year}
        </span>
        <span className="text-xs font-semibold text-slate-600">
          {formatDays(balance.leaveTaken)} in total
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PAID_LEAVE_TYPES.map((type) => {
          const item = balance.types[type];
          const taken = item.approved + item.absent;

          return (
            <div key={type} className="rounded-xl bg-slate-50 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${getLeaveType(type).dot}`}
                />
                {getLeaveType(type).label.replace(" Leave", "")}
              </div>
              <div className="mt-1 text-sm font-bold text-slate-950">
                {taken} / {item.entitlement}
              </div>
              <div className="text-[11px] text-slate-500">
                {item.remaining} left
                {item.pending > 0 && ` · ${item.pending} pending`}
              </div>
            </div>
          );
        })}

        <div className="rounded-xl bg-red-50 px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-red-700">
            <span className="h-1.5 w-1.5 rounded-full bg-red-700" />
            Absent / Unpaid
          </div>
          <div className="mt-1 text-sm font-bold text-red-900">
            {balance.absentDays} absent
          </div>
          <div className="text-[11px] text-red-700">
            {balance.absentUnpaid + balance.unpaidTaken} unpaid
          </div>
        </div>
      </div>

      {balance.absentDays > 0 && (
        <p className="mt-2 text-[11px] text-slate-500">
          Absences are included in Annual and Casual above (annual first);
          beyond those they are unpaid.
        </p>
      )}
    </div>
  );
}

// Lets an admin (or a user with record access) mark an employee absent, or
// enter leave they already took, on any dates. Saved as approved; the
// employee is not notified.
export default function RecordLeaveDialog({
  open,
  onOpenChange,
  isMobile,
  recorderId,
  allowSelf,
  coversDepartment,
  leaveRequests,
  recordStatuses,
  editing,
  initialEmployeeId = "",
  onRecord,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMobile: boolean;
  recorderId: string;
  // The main admin may also record their own leave.
  allowSelf: boolean;
  // Which employees (by department/role) the recorder may record for.
  coversDepartment: (department?: string | null) => boolean;
  // All leave the recorder can see, for overlap and balance checks.
  leaveRequests: LeaveRequest[];
  // Whose leave record is marked as updated, by user id.
  recordStatuses: Record<string, LeaveRecordStatus>;
  // The recorded entry being corrected, if any.
  editing: LeaveRequest | null;
  // Employee to start with, e.g. from the leave records list.
  initialEmployeeId?: string;
  onRecord: (
    employee: RequestActor,
    input: LeaveInput,
    markRecordUpdated: boolean,
  ) => Promise<void>;
  onUpdate: (request: LeaveRequest, input: LeaveInput) => Promise<void>;
}) {
  const { toast } = useToast();

  const users = useActiveUsers(open);
  const [employeeId, setEmployeeId] = useState("");
  const [markRecordUpdated, setMarkRecordUpdated] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>("absent");
  const [range, setRange] = useState<DateRange | undefined>();
  const [dayPortion, setDayPortion] = useState<LeaveDayPortion>("full");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Start from the entry being edited, or a blank absence.
  useEffect(() => {
    if (!open) return;

    setEmployeeId(editing?.userId || initialEmployeeId);
    setMarkRecordUpdated(false);
    setLeaveType(editing?.leaveType || "absent");
    setRange(
      editing
        ? {
            from: parseDateValue(editing.startDate),
            to: parseDateValue(editing.endDate),
          }
        : undefined,
    );
    setDayPortion(editing?.dayPortion || "full");
    setNote(editing?.reason || "");
  }, [open, editing, initialEmployeeId]);

  const employees = useMemo(() => {
    const list = users.filter(
      (user) =>
        ((allowSelf || user.id !== recorderId) &&
          coversDepartment(user.role)) ||
        user.id === editing?.userId,
    );

    // The employee of an entry being edited stays selectable even if they
    // have since been deactivated.
    if (editing && !list.some((user) => user.id === editing.userId)) {
      list.push({
        id: editing.userId,
        name: editing.userName,
        email: editing.userEmail,
        role: editing.userRole,
      });
    }

    return list;
  }, [users, recorderId, allowSelf, coversDepartment, editing]);
  const employee = employees.find((user) => user.id === employeeId);
  const recordStatus = employeeId ? recordStatuses[employeeId] : undefined;
  const recordUpdated = isLeaveRecordUpdated(recordStatus, employee?.role);

  const startDate = range?.from ? toDateValue(range.from) : "";
  const endDate = range?.to ? toDateValue(range.to) : startDate;
  const isSingleDay = Boolean(startDate) && startDate === endDate;
  const portion = isSingleDay ? dayPortion : "full";
  const days = startDate
    ? countLeaveDays(startDate, endDate, portion, leaveType)
    : 0;

  const employeeLeave = useMemo(
    () =>
      leaveRequests.filter(
        (request) =>
          request.userId === employeeId && request.id !== editing?.id,
      ),
    [leaveRequests, employeeId, editing],
  );

  const balance = getLeaveBalance(
    employeeLeave,
    employeeId,
    (startDate || toDateValue(new Date())).slice(0, 4),
  );
  const allowanceProblem = employeeId
    ? getLeaveAllowanceProblem(balance, leaveType, days)
    : null;
  const clash =
    employeeId && startDate
      ? findLeaveClash(employeeLeave, {
          leaveType,
          startDate,
          endDate,
          dayPortion: portion,
          startTime: "",
          endTime: "",
        })
      : undefined;

  const fail = (title: string, description: string) =>
    toast({ title, description, variant: "destructive" });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!employee) return fail("Choose an employee", "Select who was away.");
    if (!startDate) {
      return fail("Pick the dates", "Select the first and last day.");
    }
    if (days === 0) {
      return fail(
        "Only weekend days selected",
        "Pick dates that include at least one working day.",
      );
    }
    if (allowanceProblem) return fail("Not enough leave", allowanceProblem);
    if (clash) {
      return fail(
        "Dates overlap",
        `${employee.name} already has ${REQUEST_STATUS_STYLES[
          clash.status
        ].label.toLowerCase()} ${getLeaveType(
          clash.leaveType,
        ).label.toLowerCase()} on ${formatDateRange(clash)}.`,
      );
    }

    const input: LeaveInput = {
      leaveType,
      startDate,
      endDate,
      dayPortion: portion,
      startTime: "",
      endTime: "",
      reason: note,
    };

    try {
      setSaving(true);
      if (editing) {
        await onUpdate(editing, input);
      } else {
        await onRecord(employee, input, markRecordUpdated);
      }
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to record leave:", error);
      fail("Error", error?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-[1.75rem] border-0 p-0 shadow-2xl">
        <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight text-slate-950">
              {editing ? "Edit recorded absence" : "Record Absence"}
            </DialogTitle>
          </DialogHeader>
          <p className="mt-1 text-sm text-slate-500">
            Mark an employee absent or enter leave they already took. It's
            saved as approved and counts toward their leave.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
          <div className="space-y-2">
            <Label className={fieldLabelClass}>Employee *</Label>
            <select
              value={employeeId}
              disabled={Boolean(editing)}
              onChange={(event) => setEmployeeId(event.target.value)}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-200 focus:ring-4 focus:ring-blue-50 disabled:opacity-70"
            >
              <option value="">Select an employee</option>
              {employees.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                  {user.role ? ` · ${humanizeRole(user.role)}` : ""}
                </option>
              ))}
            </select>

            {employee && <TakenSummary balance={balance} />}

            {employee && !isMainAdmin(employee.role) && (
              <p
                className={`text-xs font-medium ${
                  recordStatus?.updated ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                {recordStatus?.updated
                  ? `Leave record updated${
                      recordStatus.updatedByName
                        ? ` by ${recordStatus.updatedByName}`
                        : ""
                    }${
                      recordStatus.updatedAt
                        ? ` on ${formatDateValue(
                            toDateValue(recordStatus.updatedAt),
                          )}`
                        : ""
                    }, so ${employee.name} can see their remaining leave.`
                  : `Leave record not updated yet, so ${employee.name} sees a message instead of their remaining leave.`}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className={fieldLabelClass}>Type</Label>
            <ChoicePills
              options={RECORDABLE_LEAVE_TYPES.map((type) => ({
                value: type.value,
                label: type.label,
                dot: type.dot,
              }))}
              value={leaveType}
              onChange={setLeaveType}
            />
            {employeeId && (
              <p className="text-sm text-slate-500">
                {leaveType === "absent"
                  ? `Taken from annual leave first (${formatDays(
                      balance.types.annual.remaining,
                    )} left), then casual (${formatDays(
                      balance.types.casual.remaining,
                    )} left), then unpaid.`
                  : isPaidLeaveType(leaveType)
                    ? `${formatDays(
                        balance.types[leaveType].remaining,
                      )} of ${balance.types[leaveType].entitlement} left in ${
                        balance.year
                      }.`
                    : "Not taken from paid leave."}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className={fieldLabelClass}>Dates</Label>
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="flex justify-center rounded-2xl border border-slate-200 bg-white p-2">
                <Calendar
                  mode="range"
                  selected={range}
                  onSelect={setRange}
                  numberOfMonths={isMobile ? 1 : 2}
                  weekStartsOn={1}
                  defaultMonth={range?.from || new Date()}
                />
              </div>

              <div className="flex flex-1 flex-col gap-3">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                  <InfoBox
                    label="From"
                    value={
                      startDate
                        ? formatDateValue(startDate, "EEE, dd MMM yyyy")
                        : "Select a day"
                    }
                  />
                  <InfoBox
                    label="To"
                    value={
                      endDate
                        ? formatDateValue(endDate, "EEE, dd MMM yyyy")
                        : "Select a day"
                    }
                  />
                </div>

                {isSingleDay && (
                  <div className="inline-flex rounded-2xl bg-slate-100 p-1">
                    {LEAVE_DAY_PORTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setDayPortion(option.value)}
                        className={`flex-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                          dayPortion === option.value
                            ? "bg-white text-slate-950 shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}

                <SummaryBox
                  label={leaveType === "absent" ? "Days absent" : "Total leave"}
                  value={days > 0 ? formatDays(days) : "—"}
                />

                {allowanceProblem && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                    {allowanceProblem}
                  </div>
                )}

                {clash && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    Overlaps{" "}
                    {getLeaveType(clash.leaveType).label.toLowerCase()} on{" "}
                    {formatDateRange(clash)}.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className={fieldLabelClass}>Note</Label>
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. Didn't come in and didn't inform anyone"
              className="min-h-[90px] rounded-2xl border-slate-200 bg-slate-50/80 shadow-none"
            />
          </div>

          {!editing && employee && !recordUpdated && (
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <Checkbox
                checked={markRecordUpdated}
                onCheckedChange={(checked) =>
                  setMarkRecordUpdated(checked === true)
                }
                className="mt-0.5"
              />
              <span>
                <span className="font-semibold text-slate-900">
                  All of {employee.name}'s previous leave is now recorded.
                </span>{" "}
                Mark their leave record as updated so they can see their
                remaining leave.
              </span>
            </label>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 rounded-2xl border-slate-200 bg-white px-5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="h-11 rounded-2xl bg-slate-950 px-6 text-white shadow-sm hover:bg-slate-800"
            >
              {saving ? "Saving..." : editing ? "Save changes" : "Record"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
