import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isWeekend,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LEAVE_TYPES,
  isTimeOff,
  REQUEST_STATUS_STYLES,
  formatDateRange,
  formatDateValue,
  formatDays,
  formatLeaveDuration,
  getLeaveType,
  leaveCoversDay,
  parseDateValue,
  toDateValue,
  type LeaveRequest,
} from "@/lib/employeeRequests";
import { Avatar, StatusChip, panelClass } from "./shared";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_LANES = 3;

// Month view of pending and approved leave, work from home and short leave,
// with the selected day's details and upcoming time off alongside.
export default function LeaveCalendar({
  requests,
  showNames,
  scopeToggle,
}: {
  requests: LeaveRequest[];
  showNames: boolean;
  scopeToggle?: React.ReactNode;
}) {
  const today = toDateValue(new Date());
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(today);

  const visibleRequests = useMemo(
    () =>
      requests.filter(
        (request) =>
          (request.status === "approved" || request.status === "pending") &&
          isTimeOff(request),
      ),
    [requests],
  );

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
      }),
    [month],
  );

  // Each request keeps one row ("lane") for its whole span, so a multi-day
  // request reads as one continuous bar across the week.
  const laneByRequest = useMemo(() => {
    const gridStart = toDateValue(days[0]);
    const gridEnd = toDateValue(days[days.length - 1]);

    const inView = visibleRequests
      .filter(
        (request) =>
          request.startDate <= gridEnd && request.endDate >= gridStart,
      )
      .sort(
        (a, b) =>
          a.startDate.localeCompare(b.startDate) ||
          b.endDate.localeCompare(a.endDate),
      );

    const laneEnds: string[] = [];
    const lanes = new Map<string, number>();

    inView.forEach((request) => {
      let lane = laneEnds.findIndex((end) => end < request.startDate);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = request.endDate;
      lanes.set(request.id, lane);
    });

    return lanes;
  }, [visibleRequests, days]);

  const laneCount = Math.min(
    MAX_LANES,
    Math.max(0, ...Array.from(laneByRequest.values()).map((lane) => lane + 1)),
  );

  const selectedRequests = useMemo(
    () =>
      visibleRequests
        .filter((request) => leaveCoversDay(request, selectedDay))
        .sort((a, b) => a.userName.localeCompare(b.userName)),
    [visibleRequests, selectedDay],
  );

  const upcoming = useMemo(
    () =>
      visibleRequests
        .filter((request) => request.endDate >= today)
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .slice(0, 6),
    [visibleRequests, today],
  );

  return (
    <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1fr_360px]">
      <div className={`${panelClass} p-4 md:p-6`}>
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Previous month"
              onClick={() => setMonth((value) => subMonths(value, 1))}
              className="h-10 w-10 rounded-2xl border-slate-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="min-w-[10rem] text-center text-lg font-bold tracking-tight text-slate-950">
              {format(month, "MMMM yyyy")}
            </h2>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Next month"
              onClick={() => setMonth((value) => addMonths(value, 1))}
              className="h-10 w-10 rounded-2xl border-slate-200"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setMonth(startOfMonth(new Date()));
                setSelectedDay(today);
              }}
              className="h-10 rounded-2xl border-slate-200 px-4"
            >
              Today
            </Button>
          </div>

          {scopeToggle}
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-7 pb-2">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="px-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200">
              {days.map((day) => {
                const dayValue = toDateValue(day);
                const inMonth = isSameMonth(day, month);
                const isToday = dayValue === today;
                const isSelected = dayValue === selectedDay;
                const isMonday = day.getDay() === 1;
                const isSunday = day.getDay() === 0;

                const dayRequests = visibleRequests.filter((request) =>
                  leaveCoversDay(request, dayValue),
                );
                const hidden = dayRequests.filter(
                  (request) => (laneByRequest.get(request.id) ?? 0) >= MAX_LANES,
                ).length;

                return (
                  <button
                    key={dayValue}
                    type="button"
                    onClick={() => setSelectedDay(dayValue)}
                    className={`flex min-h-[7.5rem] flex-col py-2 text-left transition ${
                      isSelected
                        ? "bg-blue-50/70"
                        : !inMonth
                          ? "bg-slate-50/80 hover:bg-slate-100/70"
                          : isWeekend(day)
                            ? "bg-slate-50/40 hover:bg-slate-50"
                            : "bg-white hover:bg-slate-50/70"
                    }`}
                  >
                    <span
                      className={`mx-2 mb-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                        isToday
                          ? "bg-blue-600 text-white shadow-sm"
                          : isSelected
                            ? "text-blue-700"
                            : inMonth
                              ? "text-slate-700"
                              : "text-slate-300"
                      }`}
                    >
                      {format(day, "d")}
                    </span>

                    <div className="space-y-1">
                      {Array.from({ length: laneCount }, (_, lane) => {
                        const request = dayRequests.find(
                          (item) => laneByRequest.get(item.id) === lane,
                        );

                        if (!request) {
                          return <div key={lane} className="h-5" />;
                        }

                        const leaveType = getLeaveType(request.leaveType);
                        const isStart =
                          request.startDate === dayValue || isMonday;
                        const isEnd = request.endDate === dayValue || isSunday;

                        return (
                          <div
                            key={lane}
                            title={`${request.userName} · ${leaveType.label} · ${formatLeaveDuration(
                              request,
                            )} · ${REQUEST_STATUS_STYLES[request.status].label}`}
                            className={`flex h-5 items-center truncate px-2 text-[11px] font-semibold ${
                              request.status === "approved"
                                ? `${leaveType.bar} text-white`
                                : `${leaveType.chip} ring-1 ring-inset`
                            } ${isStart ? "ml-1.5 rounded-l-md" : ""} ${
                              isEnd ? "mr-1.5 rounded-r-md" : ""
                            } ${inMonth ? "" : "opacity-50"}`}
                          >
                            {isStart
                              ? showNames
                                ? request.userName
                                : leaveType.label
                              : " "}
                          </div>
                        );
                      })}

                      {hidden > 0 && (
                        <div className="px-2 text-[11px] font-semibold text-slate-500">
                          +{hidden} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
          {LEAVE_TYPES.filter((type) => !type.deductionOnly).map((type) => (
            <span key={type.value} className="inline-flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${type.dot}`} />
              {type.label}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 sm:ml-auto">
            <span className="h-2.5 w-5 rounded-sm bg-slate-500" />
            Approved
            <span className="ml-2 h-2.5 w-5 rounded-sm bg-slate-100 ring-1 ring-inset ring-slate-300" />
            Pending
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-1 2xl:content-start">
        <div className={`${panelClass} p-5`}>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {selectedDay === today ? "Today" : "Selected day"}
          </div>
          <h3 className="mt-1 text-lg font-bold text-slate-950">
            {formatDateValue(selectedDay, "EEEE, dd MMMM")}
          </h3>

          <div className="mt-4 space-y-3">
            {selectedRequests.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                {showNames
                  ? "Everyone is in the office on this day."
                  : "Nothing planned on this day."}
              </p>
            ) : (
              selectedRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3"
                >
                  <Avatar name={request.userName} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-900">
                      {request.userName}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {getLeaveType(request.leaveType).label} ·{" "}
                      {request.leaveType === "short_leave"
                        ? formatLeaveDuration(request)
                        : formatDateRange(request)}
                    </div>
                  </div>
                  <StatusChip status={request.status} />
                </div>
              ))
            )}
          </div>
        </div>

        <div className={`${panelClass} p-5`}>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Coming up
          </div>
          <h3 className="mt-1 text-lg font-bold text-slate-950">
            Upcoming time off
          </h3>

          <div className="mt-4 space-y-2">
            {upcoming.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                Nothing planned yet.
              </p>
            ) : (
              upcoming.map((request) => {
                const leaveType = getLeaveType(request.leaveType);
                const start = parseDateValue(request.startDate);

                return (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => {
                      if (start) setMonth(startOfMonth(start));
                      setSelectedDay(request.startDate);
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-slate-50"
                  >
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-slate-950 text-white">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                        {start ? format(start, "MMM") : ""}
                      </span>
                      <span className="text-base font-black leading-none">
                        {start ? format(start, "d") : "-"}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {showNames ? request.userName : leaveType.label}
                      </div>
                      <div className="flex items-center gap-1.5 truncate text-xs text-slate-500">
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${leaveType.dot}`}
                        />
                        {showNames ? `${leaveType.label} · ` : ""}
                        {request.leaveType === "short_leave"
                          ? formatLeaveDuration(request)
                          : formatDays(request.days)}
                        {request.status === "pending" && " · pending"}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
