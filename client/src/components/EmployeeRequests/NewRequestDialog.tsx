import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import {
  ArrowLeft,
  Banknote,
  ChevronRight,
  Clock3,
  FileText,
  House,
  Palmtree,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ADVANCE_TYPES,
  DAY_LEAVE_TYPES,
  DOCUMENT_TYPES,
  INSTALLMENT_OPTIONS,
  LEAVE_DAY_PORTIONS,
  REQUEST_STATUS_STYLES,
  countHours,
  countLeaveDays,
  findLeaveClash,
  getLeaveAllowanceProblem,
  getLeaveBalance,
  getLeaveType,
  isPaidLeaveType,
  formatDateRange,
  formatDateValue,
  formatDays,
  formatHours,
  formatMoney,
  parseDateValue,
  toDateValue,
  type AdvanceInput,
  type AdvanceType,
  type DocumentInput,
  type DocumentType,
  type LeaveDayPortion,
  type LeaveInput,
  type LeaveRequest,
  type LeaveType,
} from "@/lib/employeeRequests";
import { fieldInputClass, fieldLabelClass } from "./shared";

export type NewRequestOption =
  | "leave"
  | "short_leave"
  | "work_from_home"
  | "advance"
  | "document";

const OPTIONS: Array<{
  value: NewRequestOption;
  title: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
}> = [
  {
    value: "leave",
    title: "Leave",
    description: "Annual, sick, casual or unpaid days off",
    icon: <Palmtree className="h-5 w-5" />,
    accent: "bg-emerald-50 text-emerald-600",
  },
  {
    value: "short_leave",
    title: "Short Leave",
    description: "A few hours off on one day",
    icon: <Clock3 className="h-5 w-5" />,
    accent: "bg-orange-50 text-orange-600",
  },
  {
    value: "work_from_home",
    title: "Work From Home",
    description: "Work remotely for a day or more",
    icon: <House className="h-5 w-5" />,
    accent: "bg-teal-50 text-teal-600",
  },
  {
    value: "advance",
    title: "Salary Advance / Loan",
    description: "Request money in advance, repaid from salary",
    icon: <Banknote className="h-5 w-5" />,
    accent: "bg-indigo-50 text-indigo-600",
  },
  {
    value: "document",
    title: "Letter / Document",
    description: "Experience letter, salary certificate, NOC and more",
    icon: <FileText className="h-5 w-5" />,
    accent: "bg-sky-50 text-sky-600",
  },
];

type SubmitHandlers = {
  onSubmitLeave: (input: LeaveInput) => Promise<void>;
  onSubmitAdvance: (input: AdvanceInput) => Promise<void>;
  onSubmitDocument: (input: DocumentInput) => Promise<void>;
};

export default function NewRequestDialog({
  open,
  onOpenChange,
  isMobile,
  userId,
  myLeave,
  balanceVisible,
  ...handlers
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMobile: boolean;
  userId: string;
  // The employee's own leave, to stop overlapping requests and check
  // balances.
  myLeave: LeaveRequest[];
  // False until the employee's previous leave has been recorded: their
  // remaining leave isn't shown yet.
  balanceVisible: boolean;
} & SubmitHandlers) {
  const [option, setOption] = useState<NewRequestOption | null>(null);

  useEffect(() => {
    if (open) setOption(null);
  }, [open]);

  const selected = OPTIONS.find((item) => item.value === option);
  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-[1.75rem] border-0 p-0 shadow-2xl">
        <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-bold tracking-tight text-slate-950">
              {selected && (
                <button
                  type="button"
                  aria-label="Back to request types"
                  onClick={() => setOption(null)}
                  className="rounded-xl p-1.5 text-slate-500 transition hover:bg-white hover:text-slate-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              {selected ? selected.title : "New Request"}
            </DialogTitle>
          </DialogHeader>
          <p className="mt-1 text-sm text-slate-500">
            {selected
              ? selected.description
              : "What would you like to request? An admin will review it."}
          </p>
        </div>

        <div className="px-6 py-6">
          {!selected && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {OPTIONS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setOption(item.value)}
                  className="group flex items-center gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-lg"
                >
                  <div className={`rounded-2xl p-3 ${item.accent}`}>
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-slate-950">
                      {item.title}
                    </div>
                    <div className="mt-0.5 text-xs leading-5 text-slate-500">
                      {item.description}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
                </button>
              ))}
            </div>
          )}

          {(option === "leave" ||
            option === "short_leave" ||
            option === "work_from_home") && (
            <LeaveForm
              key={option}
              mode={option}
              isMobile={isMobile}
              userId={userId}
              myLeave={myLeave}
              balanceVisible={balanceVisible}
              onCancel={close}
              onSubmit={async (input) => {
                await handlers.onSubmitLeave(input);
                close();
              }}
            />
          )}

          {option === "advance" && (
            <AdvanceForm
              onCancel={close}
              onSubmit={async (input) => {
                await handlers.onSubmitAdvance(input);
                close();
              }}
            />
          )}

          {option === "document" && (
            <DocumentForm
              onCancel={close}
              onSubmit={async (input) => {
                await handlers.onSubmitDocument(input);
                close();
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Shared form pieces
// ---------------------------------------------------------------------------

function useSubmit<T>(onSubmit: (input: T) => Promise<void>) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const fail = (title: string, description: string) =>
    toast({ title, description, variant: "destructive" });

  const submit = async (input: T) => {
    try {
      setSubmitting(true);
      await onSubmit(input);
    } catch (error: any) {
      console.error("Failed to submit request:", error);
      fail("Error", error?.message || "Failed to submit the request");
    } finally {
      setSubmitting(false);
    }
  };

  return { submitting, submit, fail };
}

function FormActions({
  submitting,
  onCancel,
}: {
  submitting: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        className="h-11 rounded-2xl border-slate-200 bg-white px-5"
      >
        Cancel
      </Button>
      <Button
        type="submit"
        disabled={submitting}
        className="h-11 rounded-2xl bg-slate-950 px-6 text-white shadow-sm hover:bg-slate-800"
      >
        {submitting ? "Sending..." : "Submit Request"}
      </Button>
    </div>
  );
}

export function ChoicePills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string; dot?: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
            value === option.value
              ? "bg-slate-950 text-white shadow-sm"
              : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
          }`}
        >
          {option.dot && <span className={`h-2 w-2 rounded-full ${option.dot}`} />}
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-950 to-slate-800 p-4 text-white">
      <div className="text-xs font-medium text-slate-300">{label}</div>
      <div className="mt-1 text-2xl font-black tracking-tight">{value}</div>
    </div>
  );
}

export function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="text-xs font-medium text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Leave, short leave and work from home
// ---------------------------------------------------------------------------

function LeaveForm({
  mode,
  isMobile,
  userId,
  myLeave,
  balanceVisible,
  onCancel,
  onSubmit,
}: {
  mode: "leave" | "short_leave" | "work_from_home";
  isMobile: boolean;
  userId: string;
  myLeave: LeaveRequest[];
  balanceVisible: boolean;
  onCancel: () => void;
  onSubmit: (input: LeaveInput) => Promise<void>;
}) {
  const { submitting, submit, fail } = useSubmit(onSubmit);

  const [leaveType, setLeaveType] = useState<LeaveType>(
    mode === "leave" ? "annual" : mode,
  );
  const [range, setRange] = useState<DateRange | undefined>();
  const [singleDay, setSingleDay] = useState<Date | undefined>();
  const [dayPortion, setDayPortion] = useState<LeaveDayPortion>("full");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");

  const isShort = mode === "short_leave";

  const startDate = isShort
    ? singleDay
      ? toDateValue(singleDay)
      : ""
    : range?.from
      ? toDateValue(range.from)
      : "";
  const endDate = isShort
    ? startDate
    : range?.to
      ? toDateValue(range.to)
      : startDate;
  const isSingleDay = Boolean(startDate) && startDate === endDate;
  const portion = mode === "leave" && isSingleDay ? dayPortion : "full";

  const days = startDate
    ? countLeaveDays(startDate, endDate, portion, leaveType)
    : 0;
  const hours = countHours(startTime, endTime);

  // Paid leave balance for the year the leave starts in.
  const balance = getLeaveBalance(
    myLeave,
    userId,
    (startDate || toDateValue(new Date())).slice(0, 4),
  );
  const allowanceProblem =
    mode === "leave" ? getLeaveAllowanceProblem(balance, leaveType, days) : null;
  const noWorkingDays = !isShort && Boolean(startDate) && days === 0;

  const clash = startDate
    ? findLeaveClash(myLeave, {
        leaveType,
        startDate,
        endDate,
        dayPortion: portion,
        startTime,
        endTime,
      })
    : undefined;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!startDate) {
      return fail(
        "Pick your dates",
        isShort ? "Select the day of your short leave." : "Select the first and last day.",
      );
    }
    if (isShort && hours <= 0) {
      return fail("Check the times", "The end time must be after the start time.");
    }
    if (noWorkingDays) {
      return fail(
        "Only weekend days selected",
        "Pick dates that include at least one working day.",
      );
    }
    if (allowanceProblem) {
      return fail("Not enough leave", allowanceProblem);
    }
    if (!reason.trim()) {
      return fail("Add a reason", "Please add a short reason for your request.");
    }
    if (clash) {
      return fail(
        "Dates overlap",
        `You already have ${REQUEST_STATUS_STYLES[
          clash.status
        ].label.toLowerCase()} ${clash.leaveType === "work_from_home" ? "work from home" : "leave"} on ${formatDateRange(clash)}.`,
      );
    }

    void submit({
      leaveType,
      startDate,
      endDate,
      dayPortion: portion,
      startTime,
      endTime,
      reason,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {mode === "leave" && (
        <div className="space-y-2">
          <Label className={fieldLabelClass}>Leave type</Label>
          <ChoicePills
            options={DAY_LEAVE_TYPES.map((type) => ({
              value: type.value,
              label: type.label,
              dot: type.dot,
            }))}
            value={leaveType}
            onChange={setLeaveType}
          />
          {isPaidLeaveType(leaveType) &&
            (balanceVisible ? (
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-slate-800">
                  {formatDays(balance.types[leaveType].remaining)}
                </span>{" "}
                of {balance.types[leaveType].entitlement}{" "}
                {getLeaveType(leaveType).label.toLowerCase()} left in{" "}
                {balance.year}
                {leaveType === "annual"
                  ? " · taken as one block, weekends inside it count"
                  : " · working days only"}
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                {leaveType === "annual"
                  ? "Taken as one block, weekends inside it count."
                  : "Working days only."}{" "}
                Your remaining leave will show here once Leadership has
                updated your previous leave.
              </p>
            ))}
        </div>
      )}

      <div className="space-y-2">
        <Label className={fieldLabelClass}>{isShort ? "Day" : "Dates"}</Label>
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex justify-center rounded-2xl border border-slate-200 bg-white p-2">
            {isShort ? (
              <Calendar
                mode="single"
                selected={singleDay}
                onSelect={setSingleDay}
                weekStartsOn={1}
                defaultMonth={singleDay || new Date()}
              />
            ) : (
              <Calendar
                mode="range"
                selected={range}
                onSelect={setRange}
                numberOfMonths={isMobile ? 1 : 2}
                weekStartsOn={1}
                defaultMonth={range?.from || new Date()}
              />
            )}
          </div>

          <div className="flex flex-1 flex-col gap-3">
            {isShort ? (
              <>
                <InfoBox
                  label="Day"
                  value={
                    startDate
                      ? formatDateValue(startDate, "EEE, dd MMM yyyy")
                      : "Select a day"
                  }
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-500">From</Label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      className={fieldInputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-500">To</Label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                      className={fieldInputClass}
                    />
                  </div>
                </div>
                <SummaryBox
                  label="Total time"
                  value={hours > 0 ? formatHours(hours) : "—"}
                />
              </>
            ) : (
              <>
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

                {mode === "leave" && isSingleDay && (
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
                  label={mode === "work_from_home" ? "Working from home" : "Total leave"}
                  value={days > 0 ? formatDays(days) : "—"}
                />
              </>
            )}

            {allowanceProblem && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                {allowanceProblem}
              </div>
            )}

            {noWorkingDays && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                These dates are all weekend days.
              </div>
            )}

            {clash && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                Overlaps your {REQUEST_STATUS_STYLES[clash.status].label.toLowerCase()}{" "}
                {clash.leaveType === "work_from_home" ? "work from home" : "leave"} on{" "}
                {formatDateRange(clash)}.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className={fieldLabelClass}>Reason *</Label>
        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={
            mode === "work_from_home"
              ? "e.g. Plumber visit at home, will be online all day"
              : isShort
                ? "e.g. Doctor's appointment"
                : "e.g. Family wedding in Lahore"
          }
          className="min-h-[100px] rounded-2xl border-slate-200 bg-slate-50/80 shadow-none"
        />
      </div>

      <FormActions submitting={submitting} onCancel={onCancel} />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Salary advance / loan
// ---------------------------------------------------------------------------

function AdvanceForm({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (input: AdvanceInput) => Promise<void>;
}) {
  const { submitting, submit, fail } = useSubmit(onSubmit);

  const [advanceType, setAdvanceType] = useState<AdvanceType>("advance");
  const [amount, setAmount] = useState("");
  const [installments, setInstallments] = useState(1);
  const [neededBy, setNeededBy] = useState("");
  const [reason, setReason] = useState("");

  const numericAmount = Math.round(Number(amount) || 0);
  const monthly = numericAmount > 0 ? numericAmount / installments : 0;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (numericAmount <= 0) {
      return fail("Enter an amount", "The amount must be more than zero.");
    }
    if (!reason.trim()) {
      return fail("Add a reason", "Please explain what the money is for.");
    }

    void submit({
      advanceType,
      amount: numericAmount,
      installments,
      neededBy,
      reason,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ADVANCE_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => {
              setAdvanceType(type.value);
              setInstallments(type.value === "advance" ? 1 : 6);
            }}
            className={`rounded-[1.25rem] p-4 text-left transition ${
              advanceType === type.value
                ? "bg-slate-950 text-white shadow-sm"
                : "bg-white ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className="text-sm font-bold">{type.label}</div>
            <div
              className={`mt-0.5 text-xs leading-5 ${
                advanceType === type.value ? "text-slate-300" : "text-slate-500"
              }`}
            >
              {type.description}
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className={fieldLabelClass}>Amount (Rs) *</Label>
          <Input
            type="number"
            min={0}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="e.g. 50000"
            className={fieldInputClass}
          />
        </div>

        <div className="space-y-2">
          <Label className={fieldLabelClass}>Repay over</Label>
          <select
            value={installments}
            onChange={(event) => setInstallments(Number(event.target.value))}
            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-200 focus:ring-4 focus:ring-blue-50"
          >
            {INSTALLMENT_OPTIONS.map((months) => (
              <option key={months} value={months}>
                {months} {months === 1 ? "month" : "months"}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label className={fieldLabelClass}>Needed by</Label>
          <Input
            type="date"
            value={neededBy}
            min={toDateValue(new Date())}
            onChange={(event) => setNeededBy(event.target.value)}
            className={fieldInputClass}
          />
        </div>

        <SummaryBox
          label="Monthly salary deduction"
          value={monthly > 0 ? formatMoney(monthly) : "—"}
        />
      </div>

      <div className="space-y-2">
        <Label className={fieldLabelClass}>Reason *</Label>
        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="e.g. Medical bills for a family member"
          className="min-h-[100px] rounded-2xl border-slate-200 bg-slate-50/80 shadow-none"
        />
      </div>

      <FormActions submitting={submitting} onCancel={onCancel} />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Letters & documents
// ---------------------------------------------------------------------------

function DocumentForm({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (input: DocumentInput) => Promise<void>;
}) {
  const { submitting, submit, fail } = useSubmit(onSubmit);

  const [documentType, setDocumentType] =
    useState<DocumentType>("employment_letter");
  const [period, setPeriod] = useState("");
  const [addressedTo, setAddressedTo] = useState("");
  const [neededBy, setNeededBy] = useState("");
  const [reason, setReason] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (documentType === "payslip" && !parseDateValue(`${period}-01`)) {
      return fail("Pick a month", "Choose which month's payslip you need.");
    }
    if (!reason.trim()) {
      return fail("Add the purpose", "Please explain what the document is for.");
    }

    void submit({ documentType, period, addressedTo, neededBy, reason });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label className={fieldLabelClass}>Document</Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DOCUMENT_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setDocumentType(type.value)}
              className={`rounded-[1.25rem] p-4 text-left transition ${
                documentType === type.value
                  ? "bg-slate-950 text-white shadow-sm"
                  : "bg-white ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="text-sm font-bold">{type.label}</div>
              <div
                className={`mt-0.5 text-xs leading-5 ${
                  documentType === type.value
                    ? "text-slate-300"
                    : "text-slate-500"
                }`}
              >
                {type.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {documentType === "payslip" && (
          <div className="space-y-2">
            <Label className={fieldLabelClass}>Month *</Label>
            <Input
              type="month"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className={fieldInputClass}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label className={fieldLabelClass}>Addressed to</Label>
          <Input
            value={addressedTo}
            onChange={(event) => setAddressedTo(event.target.value)}
            placeholder="e.g. Embassy of Germany, Meezan Bank"
            className={fieldInputClass}
          />
        </div>

        <div className="space-y-2">
          <Label className={fieldLabelClass}>Needed by</Label>
          <Input
            type="date"
            value={neededBy}
            min={toDateValue(new Date())}
            onChange={(event) => setNeededBy(event.target.value)}
            className={fieldInputClass}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className={fieldLabelClass}>Purpose *</Label>
        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="e.g. Visa application for a conference in Berlin"
          className="min-h-[100px] rounded-2xl border-slate-200 bg-slate-50/80 shadow-none"
        />
      </div>

      <FormActions submitting={submitting} onCancel={onCancel} />
    </form>
  );
}
