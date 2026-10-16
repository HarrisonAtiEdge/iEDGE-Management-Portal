import { useEffect, useMemo, useState } from "react";
import { addDays, endOfMonth, format } from "date-fns";
import { ChevronLeft, ChevronRight, Clock, Pencil, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_ATTENDANCE_SETTINGS,
  applyLateDeductions,
  formatClock,
  formatMinutes,
  getAppliedLateDeductions,
  getAttendanceStatus,
  getDueLateDeductions,
  isWorkingDay,
  saveAttendanceSettings,
  subscribeToAttendanceRange,
  subscribeToAttendanceSettings,
  subscribeToUserAttendance,
  summarizeAttendance,
  type AttendanceRecord,
  type AttendanceSettings,
} from "@/lib/attendance";
import {
  formatDateValue,
  formatDays,
  formatTime,
  getLeaveType,
  isTimeOff,
  leaveCoversDay,
  parseDateValue,
  toDateValue,
  type LeaveRequest,
  type RequestActor,
} from "@/lib/employeeRequests";
import AttendanceEditDialog from "./AttendanceEditDialog";
import {
  Avatar,
  EmptyState,
  PillGroup,
  StatTile,
  fieldInputClass,
  fieldLabelClass,
  humanizeRole,
  panelClass,
} from "./shared";
import { useActiveUsers } from "./useActiveUsers";

type ManagerView = "day" | "month" | "settings";
type DayFilter = "all" | "late" | "early" | "missing" | "leave";

const currentMonth = () => format(new Date(), "yyyy-MM");

const monthRange = (month: string) => {
  const start = parseDateValue(`${month}-01`) || new Date();
  return { start: toDateValue(start), end: toDateValue(endOfMonth(start)) };
};

const monthLabel = (month: string) =>
  formatDateValue(`${month}-01`, "MMMM yyyy");

function Chip({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tone}`}
    >
      {children}
    </span>
  );
}

const TONES = {
  good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  late: "bg-amber-50 text-amber-700 ring-amber-200",
  early: "bg-orange-50 text-orange-700 ring-orange-200",
  missing: "bg-rose-50 text-rose-700 ring-rose-200",
  muted: "bg-slate-100 text-slate-500 ring-slate-200",
  leave: "bg-blue-50 text-blue-700 ring-blue-100",
};

// Status chips for one day's record.
function RecordChips({
  record,
  today,
}: {
  record: AttendanceRecord;
  today: string;
}) {
  const status = getAttendanceStatus(record);

  return (
    <div className="flex flex-wrap gap-1.5">
      {record.excused ? (
        <Chip tone={TONES.muted}>Excused</Chip>
      ) : status.isLate ? (
        <Chip tone={TONES.late}>Late {formatMinutes(status.lateMinutes)}</Chip>
      ) : record.checkIn && isWorkingDay(record.date) ? (
        <Chip tone={TONES.good}>On time</Chip>
      ) : null}
      {status.leftEarly && (
        <Chip tone={TONES.early}>
          Left {formatMinutes(status.earlyMinutes)} early
        </Chip>
      )}
      {status.noCheckOut && (
        <Chip tone={record.date < today ? TONES.missing : TONES.muted}>
          {record.date < today ? "No check-out" : "Still in"}
        </Chip>
      )}
    </div>
  );
}

function OfficeHoursNote({ settings }: { settings: AttendanceSettings }) {
  return (
    <p className="inline-flex items-center gap-2 text-sm text-slate-500">
      <Clock className="h-4 w-4 text-slate-400" />
      Office hours {formatTime(settings.startTime)} – {formatTime(settings.endTime)},
      Mon–Fri · late after {settings.graceMinutes} min grace · leaving before{" "}
      {formatTime(settings.endTime)} is early
    </p>
  );
}

export default function AttendancePanel({
  userId,
  actor,
  canManage,
  leaveRequests,
}: {
  userId: string;
  actor: RequestActor;
  // Main admin, finance and financial admins: everyone's attendance.
  canManage: boolean;
  // Leave the viewer can see: shows who is on leave and applied deductions.
  leaveRequests: LeaveRequest[];
}) {
  const [settings, setSettings] = useState<AttendanceSettings>(
    DEFAULT_ATTENDANCE_SETTINGS,
  );
  useEffect(() => subscribeToAttendanceSettings(setSettings), []);

  const [view, setView] = useState<ManagerView>("day");

  if (!canManage) {
    return <MyAttendance userId={userId} settings={settings} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <PillGroup
          options={[
            { value: "day" as ManagerView, label: "Day" },
            { value: "month" as ManagerView, label: "Monthly summary" },
            { value: "settings" as ManagerView, label: "Settings" },
          ]}
          value={view}
          onChange={setView}
        />
        <OfficeHoursNote settings={settings} />
      </div>

      {view === "day" && (
        <DayView
          settings={settings}
          actor={actor}
          leaveRequests={leaveRequests}
        />
      )}
      {view === "month" && (
        <MonthView
          settings={settings}
          actor={actor}
          leaveRequests={leaveRequests}
        />
      )}
      {view === "settings" && (
        <SettingsView settings={settings} actor={actor} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Employee: own attendance for a month
// ---------------------------------------------------------------------------

function MyAttendance({
  userId,
  settings,
}: {
  userId: string;
  settings: AttendanceSettings;
}) {
  const [month, setMonth] = useState(currentMonth);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const today = toDateValue(new Date());

  useEffect(() => subscribeToUserAttendance(userId, setRecords), [userId]);

  const monthRecords = records
    .filter((record) => record.date.startsWith(month))
    .sort((a, b) => b.date.localeCompare(a.date));
  const summary = summarizeAttendance(monthRecords).get(userId);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <OfficeHoursNote settings={settings} />
        <Input
          type="month"
          value={month}
          onChange={(event) => setMonth(event.target.value || currentMonth())}
          className="h-11 w-full rounded-2xl border-slate-200 bg-white shadow-sm lg:w-52"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatTile
          label="Days checked in"
          value={summary?.daysPresent ?? 0}
          hint={monthLabel(month)}
          icon={<Clock className="h-5 w-5" />}
          accent="bg-emerald-50 text-emerald-600"
        />
        <StatTile
          label="Late arrivals"
          value={summary?.lateCount ?? 0}
          hint={`After ${settings.graceMinutes} min grace`}
          icon={<Clock className="h-5 w-5" />}
          accent="bg-amber-50 text-amber-600"
        />
        <StatTile
          label="Left early"
          value={summary?.earlyCount ?? 0}
          hint={`Before ${formatTime(settings.endTime)}`}
          icon={<Clock className="h-5 w-5" />}
          accent="bg-orange-50 text-orange-600"
        />
      </div>

      {monthRecords.length === 0 ? (
        <EmptyState
          title="No attendance this month"
          text='Use "Check in" at the top of the page when you arrive and "Check out" when you leave.'
        />
      ) : (
        <div className={`${panelClass} divide-y divide-slate-100`}>
          {monthRecords.map((record) => (
            <div
              key={record.id}
              className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between md:px-6"
            >
              <div className="text-sm font-semibold text-slate-900 md:w-44">
                {formatDateValue(record.date, "EEE, dd MMM")}
              </div>
              <div className="text-sm text-slate-600 md:w-52">
                In {formatClock(record.checkIn)} · Out{" "}
                {formatClock(record.checkOut)}
              </div>
              <div className="md:flex-1 md:text-right">
                <RecordChips record={record} today={today} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Managers: everyone on one day
// ---------------------------------------------------------------------------

function DayView({
  settings,
  actor,
  leaveRequests,
}: {
  settings: AttendanceSettings;
  actor: RequestActor;
  leaveRequests: LeaveRequest[];
}) {
  const users = useActiveUsers();
  const today = toDateValue(new Date());
  const [day, setDay] = useState(today);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filter, setFilter] = useState<DayFilter>("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<{
    employee: RequestActor;
    date: string;
    record: AttendanceRecord | null;
  } | null>(null);

  useEffect(() => subscribeToAttendanceRange(day, day, setRecords), [day]);

  const working = isWorkingDay(day);

  const rows = useMemo(
    () =>
      users.map((user) => {
        const record = records.find((item) => item.userId === user.id) || null;
        const leave = leaveRequests.find(
          (request) =>
            request.userId === user.id &&
            request.status === "approved" &&
            isTimeOff(request) &&
            request.leaveType !== "work_from_home" &&
            leaveCoversDay(request, day),
        );
        const remote = leaveRequests.find(
          (request) =>
            request.userId === user.id &&
            request.status === "approved" &&
            request.leaveType === "work_from_home" &&
            leaveCoversDay(request, day),
        );
        const status = record ? getAttendanceStatus(record) : null;
        const missing =
          !record?.checkIn && !leave && !remote && working && day <= today;

        return { user, record, leave, remote, status, missing };
      }),
    [users, records, leaveRequests, day, working, today],
  );

  const counts = {
    present: rows.filter((row) => row.record?.checkIn).length,
    late: rows.filter((row) => row.status?.isLate).length,
    early: rows.filter((row) => row.status?.leftEarly).length,
    missing: rows.filter((row) => row.missing).length,
    leave: rows.filter((row) => row.leave).length,
  };

  const term = search.trim().toLowerCase();
  const visible = rows.filter((row) => {
    if (filter === "late" && !row.status?.isLate) return false;
    if (filter === "early" && !row.status?.leftEarly) return false;
    if (filter === "missing" && !row.missing) return false;
    if (filter === "leave" && !row.leave) return false;
    return (
      !term ||
      [row.user.name, row.user.role].join(" ").toLowerCase().includes(term)
    );
  });

  const shiftDay = (amount: number) => {
    const date = parseDateValue(day);
    if (date) setDay(toDateValue(addDays(date, amount)));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Previous day"
            onClick={() => shiftDay(-1)}
            className="h-11 w-11 rounded-2xl border-slate-200"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input
            type="date"
            value={day}
            onChange={(event) => setDay(event.target.value || today)}
            className="h-11 w-44 rounded-2xl border-slate-200 bg-white shadow-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Next day"
            onClick={() => shiftDay(1)}
            className="h-11 w-11 rounded-2xl border-slate-200"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="ml-1 text-sm font-semibold text-slate-700">
            {formatDateValue(day, "EEEE")}
            {!working && " · weekend"}
          </span>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employees"
            className="h-11 rounded-2xl border-slate-200 bg-white pl-10 shadow-sm"
          />
        </div>
      </div>

      <PillGroup
        options={[
          { value: "all" as DayFilter, label: "Everyone", count: rows.length },
          { value: "late" as DayFilter, label: "Late", count: counts.late },
          { value: "early" as DayFilter, label: "Left early", count: counts.early },
          {
            value: "missing" as DayFilter,
            label: "Not checked in",
            count: counts.missing,
          },
          { value: "leave" as DayFilter, label: "On leave", count: counts.leave },
        ]}
        value={filter}
        onChange={setFilter}
      />

      <p className="text-sm text-slate-500">
        {counts.present} checked in · {counts.late} late · {counts.early} left
        early · {counts.missing} not checked in · {counts.leave} on leave
      </p>

      {visible.length === 0 ? (
        <EmptyState
          title="Nobody here"
          text="Try another filter or day, or clear the search."
        />
      ) : (
        <div className={`${panelClass} divide-y divide-slate-100`}>
          {visible.map(({ user, record, leave, remote, missing }) => (
            <div
              key={user.id}
              className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:px-6"
            >
              <div className="flex min-w-0 items-center gap-3 md:w-64">
                <Avatar name={user.name} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-slate-950">
                    {user.name}
                  </div>
                  <div className="truncate text-xs text-slate-500">
                    {user.role ? humanizeRole(user.role) : "No role"}
                  </div>
                </div>
              </div>

              <div className="text-sm text-slate-600 md:w-52">
                {record?.checkIn
                  ? `In ${formatClock(record.checkIn)} · Out ${formatClock(
                      record.checkOut,
                    )}`
                  : "—"}
              </div>

              <div className="flex flex-1 flex-wrap items-center gap-1.5">
                {record?.checkIn ? (
                  <RecordChips record={record} today={today} />
                ) : leave ? (
                  <Chip tone={TONES.leave}>
                    On leave · {getLeaveType(leave.leaveType).label}
                  </Chip>
                ) : remote ? (
                  <Chip tone={TONES.muted}>Working from home</Chip>
                ) : missing ? (
                  <Chip tone={TONES.missing}>Not checked in</Chip>
                ) : !working ? (
                  <Chip tone={TONES.muted}>Weekend</Chip>
                ) : null}
                {record?.note && (
                  <span className="text-xs text-slate-500">“{record.note}”</span>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing({ employee: user, date: day, record })}
                className="h-9 gap-1.5 self-start rounded-2xl border-slate-200 bg-white px-3.5 text-sm md:self-auto"
              >
                <Pencil className="h-4 w-4" />
                {record ? "Edit" : "Add"}
              </Button>
            </div>
          ))}
        </div>
      )}

      <AttendanceEditDialog
        target={editing}
        settings={settings}
        actor={actor}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Managers: monthly totals and late deductions
// ---------------------------------------------------------------------------

function MonthView({
  settings,
  actor,
  leaveRequests,
}: {
  settings: AttendanceSettings;
  actor: RequestActor;
  leaveRequests: LeaveRequest[];
}) {
  const { toast } = useToast();
  const users = useActiveUsers();
  const [month, setMonth] = useState(currentMonth);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [applyingId, setApplyingId] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const { start, end } = monthRange(month);
    return subscribeToAttendanceRange(start, end, setRecords);
  }, [month]);

  const summaries = useMemo(() => summarizeAttendance(records), [records]);
  const rule = settings.lateRule;
  const term = search.trim().toLowerCase();

  const rows = users
    .filter(
      (user) =>
        !term ||
        [user.name, user.role].join(" ").toLowerCase().includes(term),
    )
    .map((user) => {
      const summary = summaries.get(user.id) || {
        userId: user.id,
        userName: user.name,
        daysPresent: 0,
        lateCount: 0,
        lateDates: [],
        earlyCount: 0,
        noCheckOutCount: 0,
      };
      const applied = getAppliedLateDeductions(leaveRequests, user.id, month);
      const due = getDueLateDeductions(summary.lateCount, rule);

      return { user, summary, applied: applied.length, due };
    })
    .sort(
      (a, b) =>
        b.summary.lateCount - a.summary.lateCount ||
        a.user.name.localeCompare(b.user.name),
    );

  async function apply(row: (typeof rows)[number]) {
    try {
      setApplyingId(row.user.id);
      await applyLateDeductions(
        row.user,
        row.summary,
        rule,
        row.applied,
        monthLabel(month),
        actor,
      );
      toast({
        title: "Late deduction applied",
        description: `${row.user.name}: ${formatDays(
          (row.due - row.applied) * rule.deductDays,
        )} taken from casual leave (then unpaid). Remove it from Leave Records › Recorded entries to undo.`,
      });
    } catch (error: any) {
      console.error("Failed to apply late deduction:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to apply the deduction",
        variant: "destructive",
      });
    } finally {
      setApplyingId("");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-slate-500">
          {rule.enabled
            ? `Late rule: every ${rule.lates} late arrivals in a month = ${formatDays(
                rule.deductDays,
              )} from casual leave (then unpaid), applied when you click Apply.`
            : "Late rule is off, so late arrivals are only tracked. Turn it on in Settings."}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employees"
              className="h-11 rounded-2xl border-slate-200 bg-white pl-10 shadow-sm"
            />
          </div>
          <Input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value || currentMonth())}
            className="h-11 w-full rounded-2xl border-slate-200 bg-white shadow-sm sm:w-52"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No employees found" text="Clear the search." />
      ) : (
        <div className={`${panelClass} divide-y divide-slate-100`}>
          {rows.map((row) => {
            const { user, summary, applied, due } = row;
            const pending = Math.max(0, due - applied);

            return (
              <div
                key={user.id}
                className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:px-6"
              >
                <div className="flex min-w-0 items-center gap-3 lg:w-64">
                  <Avatar name={user.name} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-slate-950">
                      {user.name}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {user.role ? humanizeRole(user.role) : "No role"}
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-wrap items-center gap-1.5">
                  <Chip tone={TONES.good}>{summary.daysPresent} days in</Chip>
                  <Chip tone={summary.lateCount ? TONES.late : TONES.muted}>
                    {summary.lateCount} late
                  </Chip>
                  <Chip tone={summary.earlyCount ? TONES.early : TONES.muted}>
                    {summary.earlyCount} left early
                  </Chip>
                  {summary.noCheckOutCount > 0 && (
                    <Chip tone={TONES.missing}>
                      {summary.noCheckOutCount} no check-out
                    </Chip>
                  )}
                  {summary.lateDates.length > 0 && (
                    <span className="text-xs text-slate-500">
                      Late on{" "}
                      {summary.lateDates
                        .map((date) => formatDateValue(date, "d MMM"))
                        .join(", ")}
                    </span>
                  )}
                </div>

                {rule.enabled && (
                  <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
                    {applied > 0 && (
                      <span className="text-xs font-medium text-slate-500">
                        {formatDays(applied * rule.deductDays)} deducted
                      </span>
                    )}
                    {pending > 0 ? (
                      <Button
                        type="button"
                        disabled={applyingId === user.id}
                        onClick={() => apply(row)}
                        className="h-9 rounded-2xl bg-slate-950 px-3.5 text-sm text-white hover:bg-slate-800"
                      >
                        {applyingId === user.id
                          ? "Applying..."
                          : `Apply ${formatDays(pending * rule.deductDays)}`}
                      </Button>
                    ) : (
                      due === 0 && (
                        <span className="text-xs text-slate-400">
                          No deduction
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Managers: office hours and the late rule
// ---------------------------------------------------------------------------

function SettingsView({
  settings,
  actor,
}: {
  settings: AttendanceSettings;
  actor: RequestActor;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(settings), [settings]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();

    if (!form.startTime || !form.endTime || form.endTime <= form.startTime) {
      toast({
        title: "Check the office hours",
        description: "The end time must be after the start time.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      await saveAttendanceSettings(
        {
          ...form,
          graceMinutes: Math.max(0, Math.round(Number(form.graceMinutes) || 0)),
          lateRule: {
            ...form.lateRule,
            lates: Math.max(1, Math.round(Number(form.lateRule.lates) || 1)),
          },
        },
        actor,
      );
      toast({ title: "Attendance settings saved" });
    } catch (error: any) {
      console.error("Failed to save attendance settings:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className={`${panelClass} max-w-3xl space-y-6 p-5 md:p-6`}>
      <div>
        <h3 className="text-base font-bold text-slate-950">Office hours</h3>
        <p className="mt-1 text-sm text-slate-500">
          New check-ins use these. Past days keep the hours they were recorded
          with.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label className={fieldLabelClass}>Start</Label>
          <Input
            type="time"
            value={form.startTime}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, startTime: event.target.value }))
            }
            className={fieldInputClass}
          />
        </div>
        <div className="space-y-2">
          <Label className={fieldLabelClass}>End</Label>
          <Input
            type="time"
            value={form.endTime}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, endTime: event.target.value }))
            }
            className={fieldInputClass}
          />
        </div>
        <div className="space-y-2">
          <Label className={fieldLabelClass}>Grace on arrival (min)</Label>
          <Input
            type="number"
            min={0}
            value={form.graceMinutes}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                graceMinutes: Number(event.target.value),
              }))
            }
            className={fieldInputClass}
          />
        </div>
      </div>

      <div className="space-y-4 border-t border-slate-100 pt-5">
        <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700">
          <Checkbox
            checked={form.lateRule.enabled}
            onCheckedChange={(checked) =>
              setForm((previous) => ({
                ...previous,
                lateRule: { ...previous.lateRule, enabled: checked === true },
              }))
            }
            className="mt-0.5"
          />
          <span>
            <span className="font-semibold text-slate-900">
              Deduct leave for late coming.
            </span>{" "}
            Admins still review and apply each deduction in the monthly summary.
          </span>
        </label>

        {form.lateRule.enabled && (
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
            Every
            <Input
              type="number"
              min={1}
              value={form.lateRule.lates}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  lateRule: {
                    ...previous.lateRule,
                    lates: Number(event.target.value),
                  },
                }))
              }
              className="h-10 w-20 rounded-2xl border-slate-200 bg-slate-50/80"
            />
            late arrivals in a month =
            <div className="inline-flex rounded-2xl bg-slate-100 p-1">
              {([0.5, 1] as const).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() =>
                    setForm((previous) => ({
                      ...previous,
                      lateRule: { ...previous.lateRule, deductDays: days },
                    }))
                  }
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    form.lateRule.deductDays === days
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {days === 0.5 ? "Half day" : "1 day"}
                </button>
              ))}
            </div>
            from casual leave, then unpaid.
          </div>
        )}
      </div>

      <div className="flex justify-end border-t border-slate-100 pt-5">
        <Button
          type="submit"
          disabled={saving}
          className="h-11 rounded-2xl bg-slate-950 px-6 text-white shadow-sm hover:bg-slate-800"
        >
          {saving ? "Saving..." : "Save settings"}
        </Button>
      </div>
    </form>
  );
}
