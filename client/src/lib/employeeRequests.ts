import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { differenceInCalendarDays, format, isValid, parse } from "date-fns";
import { db } from "@/lib/firebase";
import { createNotification } from "@/hooks/useNotifications";

const PANEL_ID = "IEDGE-SYSTEM";

// Firestore layout:
//   Panels/IEDGE-SYSTEM/Employee Requests and Approvals/{kind doc}/requests/{id}
// where the kind doc is leaveRequests, SalaryAdvance or documentsRequests, and
//   Panels/IEDGE-SYSTEM/Employee Requests and Approvals/approvers
// holds the users the main admin has allowed to review requests.
export const EMPLOYEE_REQUESTS_COLLECTION = "Employee Requests and Approvals";

export type RequestKind = "leave" | "advance" | "document";

export const REQUEST_KINDS: Record<
  RequestKind,
  { label: string; docId: string; chip: string }
> = {
  leave: {
    label: "Leave & Time Off",
    docId: "leaveRequests",
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
  advance: {
    label: "Salary Advance / Loan",
    docId: "SalaryAdvance",
    chip: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  },
  document: {
    label: "Letters & Documents",
    docId: "documentsRequests",
    chip: "bg-sky-50 text-sky-700 ring-sky-100",
  },
};

export const REQUEST_KIND_ORDER: RequestKind[] = ["leave", "advance", "document"];

// Notification types that belong to this module; unread ones light the
// sidebar dot on the requests tab.
export const REQUEST_NOTIFICATION_TYPES = ["employee_request", "leave_request"];

const kindDoc = (kind: RequestKind) =>
  doc(
    db,
    "Panels",
    PANEL_ID,
    EMPLOYEE_REQUESTS_COLLECTION,
    REQUEST_KINDS[kind].docId,
  );

export const requestsCollection = (kind: RequestKind) =>
  collection(kindDoc(kind), "requests");

// ---------------------------------------------------------------------------
// Approvers
// ---------------------------------------------------------------------------

// The main admin reviews every request. They can also give any other user
// access for some departments, or all of them, optionally until a given date:
// either to approve requests and record absences, or only to record absences
// (e.g. finance, for payroll). A department is an employee's role (sales,
// finance, operation, ...). Nobody can approve their own request except the
// main admin.

export const MAIN_ADMIN_ROLE = "main_admin";

export const normalizeDepartment = (value?: string | null) =>
  String(value || "")
    .trim()
    .toLowerCase();

export const isMainAdmin = (role?: string | null) =>
  normalizeDepartment(role) === MAIN_ADMIN_ROLE;

export interface RequestApprover {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  // false: may only record absences, not approve requests.
  canApprove: boolean;
  allDepartments: boolean;
  // Normalized department (role) keys; ignored when allDepartments is set.
  departments: string[];
  // Last day the access applies (YYYY-MM-DD); "" means no end.
  until: string;
  addedById: string;
  addedByName: string;
}

const approversDoc = () =>
  doc(db, "Panels", PANEL_ID, EMPLOYEE_REQUESTS_COLLECTION, "approvers");

function mapApprovers(data: any): RequestApprover[] {
  const list = Array.isArray(data?.approvers) ? data.approvers : [];

  return list
    .filter((item: any) => item?.userId)
    .map((item: any) => ({
      userId: String(item.userId),
      userName: item.userName || item.userEmail || "Unknown user",
      userEmail: item.userEmail || "",
      userRole: item.userRole || "",
      canApprove: item.canApprove !== false,
      allDepartments: Boolean(item.allDepartments),
      departments: Array.isArray(item.departments)
        ? item.departments.map(normalizeDepartment).filter(Boolean)
        : [],
      until: item.until || "",
      addedById: item.addedById || "",
      addedByName: item.addedByName || "",
    }));
}

export function subscribeToApprovers(
  onChange: (approvers: RequestApprover[]) => void,
) {
  return onSnapshot(
    approversDoc(),
    (snapshot) => onChange(mapApprovers(snapshot.data())),
    (error) => {
      console.error("Failed to load request approvers:", error);
      onChange([]);
    },
  );
}

export const isApproverActive = (
  approver: RequestApprover,
  today = toDateValue(new Date()),
) => !approver.until || approver.until >= today;

export const approverCoversDepartment = (
  approver: RequestApprover,
  department?: string | null,
) =>
  approver.allDepartments ||
  approver.departments.includes(normalizeDepartment(department));

// What a user may do: everything for the main admin, otherwise what their
// active assignment (if any) allows, for its departments.
export function getApprovalAccess(
  userId: string,
  role: string | null | undefined,
  approvers: RequestApprover[],
) {
  const mainAdmin = isMainAdmin(role);
  const assignment = approvers.find(
    (approver) => approver.userId === userId && isApproverActive(approver),
  );

  return {
    isMainAdmin: mainAdmin,
    // Receives and approves requests.
    isApprover: mainAdmin || Boolean(assignment?.canApprove),
    // Records absences and past leave; sees the team in their departments.
    canRecord: mainAdmin || Boolean(assignment),
    assignment,
    // Whether employees in this department are in their scope.
    coversDepartment: (department?: string | null) =>
      mainAdmin ||
      Boolean(assignment && approverCoversDepartment(assignment, department)),
  };
}

export type ApprovalAccess = ReturnType<typeof getApprovalAccess>;

export const canReviewRequest = (
  request: { userId: string; userRole: string; status: RequestStatus },
  viewerId: string,
  access: ApprovalAccess,
) =>
  access.isApprover &&
  request.status === "pending" &&
  access.coversDepartment(request.userRole) &&
  (request.userId !== viewerId || access.isMainAdmin);

export async function saveApprover(
  approver: Omit<RequestApprover, "addedById" | "addedByName">,
  actor: { id: string; name: string },
  describeScope: string,
) {
  const entry: RequestApprover = {
    ...approver,
    departments: approver.allDepartments
      ? []
      : Array.from(new Set(approver.departments.map(normalizeDepartment))),
    addedById: actor.id,
    addedByName: actor.name,
  };

  let isNew = true;

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(approversDoc());
    const current = mapApprovers(snapshot.data());
    isNew = !current.some((item) => item.userId === entry.userId);

    transaction.set(
      approversDoc(),
      {
        approvers: [
          ...current.filter((item) => item.userId !== entry.userId),
          entry,
        ],
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  });

  await createNotification({
    recipientId: entry.userId,
    type: "employee_request",
    recordId: "approvers",
    message: `${actor.name} ${isNew ? "gave you" : "updated your"} access to ${
      entry.canApprove
        ? "approve employee requests and record absences"
        : "record employee absences"
    } for ${describeScope}${
      entry.until ? ` until ${formatDateValue(entry.until)}` : ""
    }.`,
    createdById: actor.id,
    createdByName: actor.name,
  });
}

export async function removeApprover(
  approver: RequestApprover,
  actor: { id: string; name: string },
) {
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(approversDoc());

    transaction.set(
      approversDoc(),
      {
        approvers: mapApprovers(snapshot.data()).filter(
          (item) => item.userId !== approver.userId,
        ),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  });

  await createNotification({
    recipientId: approver.userId,
    type: "employee_request",
    recordId: "approvers",
    message: `${actor.name} removed your access to employee requests.`,
    createdById: actor.id,
    createdByName: actor.name,
  });
}

// ---------------------------------------------------------------------------
// Statuses
// ---------------------------------------------------------------------------

export type RequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export const REQUEST_STATUS_STYLES: Record<
  RequestStatus,
  { label: string; chip: string }
> = {
  pending: {
    label: "Pending",
    chip: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  approved: {
    label: "Approved",
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  rejected: {
    label: "Rejected",
    chip: "bg-rose-50 text-rose-700 ring-rose-200",
  },
  cancelled: {
    label: "Cancelled",
    chip: "bg-slate-100 text-slate-500 ring-slate-200",
  },
};

export const REQUEST_STATUS_ORDER: RequestStatus[] = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
];

// ---------------------------------------------------------------------------
// Leave, work from home and short leave
// ---------------------------------------------------------------------------

export type LeaveType =
  | "annual"
  | "sick"
  | "casual"
  | "unpaid"
  | "other"
  | "absent"
  | "work_from_home"
  | "short_leave";

export const LEAVE_TYPES: Array<{
  value: LeaveType;
  label: string;
  // Days off count towards "leave taken"; work from home and short leave
  // (hours on one day) do not.
  countsAsLeave: boolean;
  // Only recorded by an admin, never requested by the employee.
  recordOnly?: boolean;
  chip: string;
  bar: string;
  dot: string;
}> = [
  {
    value: "annual",
    label: "Annual Leave",
    countsAsLeave: true,
    chip: "bg-blue-50 text-blue-700 ring-blue-100",
    bar: "bg-blue-500",
    dot: "bg-blue-500",
  },
  {
    value: "casual",
    label: "Casual Leave",
    countsAsLeave: true,
    chip: "bg-amber-50 text-amber-700 ring-amber-100",
    bar: "bg-amber-500",
    dot: "bg-amber-500",
  },
  {
    // Stored as "sick" so existing requests keep their type.
    value: "sick",
    label: "Medical Leave",
    countsAsLeave: true,
    chip: "bg-rose-50 text-rose-700 ring-rose-100",
    bar: "bg-rose-500",
    dot: "bg-rose-500",
  },
  {
    value: "unpaid",
    label: "Unpaid Leave",
    countsAsLeave: true,
    chip: "bg-slate-100 text-slate-700 ring-slate-200",
    bar: "bg-slate-500",
    dot: "bg-slate-500",
  },
  {
    value: "other",
    label: "Other Leave",
    countsAsLeave: true,
    chip: "bg-violet-50 text-violet-700 ring-violet-100",
    bar: "bg-violet-500",
    dot: "bg-violet-500",
  },
  {
    value: "absent",
    label: "Absent",
    countsAsLeave: true,
    recordOnly: true,
    chip: "bg-red-50 text-red-700 ring-red-200",
    bar: "bg-red-700",
    dot: "bg-red-700",
  },
  {
    value: "short_leave",
    label: "Short Leave",
    countsAsLeave: false,
    chip: "bg-orange-50 text-orange-700 ring-orange-100",
    bar: "bg-orange-500",
    dot: "bg-orange-500",
  },
  {
    value: "work_from_home",
    label: "Work From Home",
    countsAsLeave: false,
    chip: "bg-teal-50 text-teal-700 ring-teal-100",
    bar: "bg-teal-500",
    dot: "bg-teal-500",
  },
];

// The types an employee chooses in the leave form (work from home and short
// leave have their own forms; absences are only recorded by admins).
export const DAY_LEAVE_TYPES = LEAVE_TYPES.filter(
  (type) => type.countsAsLeave && !type.recordOnly,
);

// The types an admin can record for an employee.
export const RECORDABLE_LEAVE_TYPES = LEAVE_TYPES.filter(
  (type) => type.countsAsLeave,
);

export const getLeaveType = (value?: string) =>
  LEAVE_TYPES.find((type) => type.value === value) ||
  LEAVE_TYPES.find((type) => type.value === "other")!;

// A single-day leave can be taken as a half day.
export type LeaveDayPortion = "full" | "first_half" | "second_half";

export const LEAVE_DAY_PORTIONS: Array<{
  value: LeaveDayPortion;
  label: string;
}> = [
  { value: "full", label: "Full day" },
  { value: "first_half", label: "First half" },
  { value: "second_half", label: "Second half" },
];

// ---------------------------------------------------------------------------
// Salary advance / loan
// ---------------------------------------------------------------------------

export type AdvanceType = "advance" | "loan";

export const ADVANCE_TYPES: Array<{
  value: AdvanceType;
  label: string;
  description: string;
}> = [
  {
    value: "advance",
    label: "Salary Advance",
    description: "Part of your salary early, usually repaid next month",
  },
  {
    value: "loan",
    label: "Loan",
    description: "A larger amount repaid in monthly instalments",
  },
];

export const INSTALLMENT_OPTIONS = [1, 2, 3, 4, 5, 6, 9, 12, 18, 24];

export const getAdvanceType = (value?: string) =>
  ADVANCE_TYPES.find((type) => type.value === value) || ADVANCE_TYPES[0];

// ---------------------------------------------------------------------------
// Letters & documents
// ---------------------------------------------------------------------------

export type DocumentType =
  | "experience_letter"
  | "employment_letter"
  | "salary_certificate"
  | "noc"
  | "payslip"
  | "other";

export const DOCUMENT_TYPES: Array<{
  value: DocumentType;
  label: string;
  description: string;
}> = [
  {
    value: "employment_letter",
    label: "Employment Letter",
    description: "Confirms you currently work here",
  },
  {
    value: "experience_letter",
    label: "Experience Letter",
    description: "Your role and period of employment",
  },
  {
    value: "salary_certificate",
    label: "Salary Certificate",
    description: "For a bank, visa or rental application",
  },
  {
    value: "noc",
    label: "NOC",
    description: "No Objection Certificate for travel, visa or study",
  },
  {
    value: "payslip",
    label: "Payslip Copy",
    description: "A copy of the payslip for a given month",
  },
  {
    value: "other",
    label: "Other Document",
    description: "Anything else from HR",
  },
];

export const getDocumentType = (value?: string) =>
  DOCUMENT_TYPES.find((type) => type.value === value) ||
  DOCUMENT_TYPES[DOCUMENT_TYPES.length - 1];

// ---------------------------------------------------------------------------
// Request shapes
// ---------------------------------------------------------------------------

interface BaseRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  status: RequestStatus;
  reason: string;
  reviewedById: string;
  reviewedByName: string;
  // Reason given when a request is rejected.
  reviewNote: string;
  reviewedAt: Date | null;
  createdAt: Date | null;
}

export interface LeaveRequest extends BaseRequest {
  kind: "leave";
  leaveType: LeaveType;
  // Inclusive range, stored as YYYY-MM-DD.
  startDate: string;
  endDate: string;
  dayPortion: LeaveDayPortion;
  days: number;
  // Short leave only: HH:mm on startDate.
  startTime: string;
  endTime: string;
  hours: number;
  // Set when an admin recorded the leave or absence for the employee.
  recordedById: string;
  recordedByName: string;
}

export interface AdvanceRequest extends BaseRequest {
  kind: "advance";
  advanceType: AdvanceType;
  amount: number;
  installments: number;
  monthlyDeduction: number;
  neededBy: string;
}

export interface DocumentRequest extends BaseRequest {
  kind: "document";
  documentType: DocumentType;
  addressedTo: string;
  neededBy: string;
  // Payslip copies: the month, as YYYY-MM.
  period: string;
}

export type EmployeeRequest = LeaveRequest | AdvanceRequest | DocumentRequest;

export type LeaveInput = Pick<
  LeaveRequest,
  "leaveType" | "startDate" | "endDate" | "dayPortion" | "startTime" | "endTime" | "reason"
>;

export type AdvanceInput = Pick<
  AdvanceRequest,
  "advanceType" | "amount" | "installments" | "neededBy" | "reason"
>;

export type DocumentInput = Pick<
  DocumentRequest,
  "documentType" | "addressedTo" | "neededBy" | "period" | "reason"
>;

// ---------------------------------------------------------------------------
// Dates, times and amounts
// ---------------------------------------------------------------------------

export const DATE_VALUE_FORMAT = "yyyy-MM-dd";

export function parseDateValue(value?: string) {
  if (!value) return undefined;
  const date = parse(value, DATE_VALUE_FORMAT, new Date());
  return isValid(date) ? date : undefined;
}

export const toDateValue = (date: Date) => format(date, DATE_VALUE_FORMAT);

export function formatDateValue(value?: string, pattern = "dd MMM yyyy") {
  const date = parseDateValue(value);
  return date ? format(date, pattern) : "-";
}

export function formatDateRange(range: { startDate: string; endDate: string }) {
  if (range.startDate === range.endDate) {
    return formatDateValue(range.startDate);
  }

  const start = parseDateValue(range.startDate);
  const end = parseDateValue(range.endDate);

  if (start && end && start.getFullYear() === end.getFullYear()) {
    return `${format(start, "dd MMM")} – ${format(end, "dd MMM yyyy")}`;
  }

  return `${formatDateValue(range.startDate)} – ${formatDateValue(
    range.endDate,
  )}`;
}

// Saturday and Sunday are the weekend.
const isWeekendDay = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

// Annual leave is one continuous block, so every day inside it counts,
// weekends included (the sandwich rule). All other leave counts working days
// (Mon-Fri) only. Both ends are included; a single half day counts as 0.5.
export function countLeaveDays(
  startDate: string,
  endDate: string,
  dayPortion: LeaveDayPortion = "full",
  leaveType: LeaveType = "annual",
) {
  const start = parseDateValue(startDate);
  const end = parseDateValue(endDate);
  if (!start || !end || end < start) return 0;

  const calendarDays = differenceInCalendarDays(end, start) + 1;
  let days = calendarDays;

  if (leaveType !== "annual") {
    days = 0;
    for (let offset = 0; offset < calendarDays; offset += 1) {
      const day = new Date(start);
      day.setDate(start.getDate() + offset);
      if (!isWeekendDay(day)) days += 1;
    }
  }

  return days === 1 && calendarDays === 1 && dayPortion !== "full" ? 0.5 : days;
}

export const formatDays = (days: number) =>
  `${days} ${days === 1 ? "day" : "days"}`;

const timeToMinutes = (value: string) => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value || "");
  return match ? Number(match[1]) * 60 + Number(match[2]) : NaN;
};

// Hours between two HH:mm times on the same day; 0 when invalid.
export function countHours(startTime: string, endTime: string) {
  const minutes = timeToMinutes(endTime) - timeToMinutes(startTime);
  return Number.isFinite(minutes) && minutes > 0
    ? Math.round((minutes / 60) * 100) / 100
    : 0;
}

export function formatHours(hours: number) {
  const totalMinutes = Math.round(hours * 60);
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (wholeHours === 0) return `${minutes}m`;
  return minutes ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`;
}

export function formatTime(value: string) {
  const date = parse(value || "", "HH:mm", new Date());
  return isValid(date) ? format(date, "h:mm a") : value || "-";
}

export const formatMoney = (value: number) =>
  `Rs ${Math.round(Number(value) || 0).toLocaleString("en-PK")}`;

// Duration shown for a leave-type request: hours for short leave, days
// (and half-day portion) otherwise.
export function formatLeaveDuration(request: LeaveRequest) {
  if (request.leaveType === "short_leave") {
    return `${formatTime(request.startTime)} – ${formatTime(
      request.endTime,
    )} · ${formatHours(request.hours)}`;
  }

  const portion =
    request.dayPortion !== "full"
      ? ` · ${
          LEAVE_DAY_PORTIONS.find(
            (option) => option.value === request.dayPortion,
          )?.label
        }`
      : "";

  return `${formatDays(request.days)}${portion}`;
}

// ---------------------------------------------------------------------------
// Overlaps
// ---------------------------------------------------------------------------

export const leaveCoversDay = (request: LeaveRequest, day: string) =>
  request.startDate <= day && day <= request.endDate;

export const datesOverlap = (
  a: { startDate: string; endDate: string },
  b: { startDate: string; endDate: string },
) => a.startDate <= b.endDate && b.startDate <= a.endDate;

// The employee's own pending/approved leave that the new one would clash
// with. Short leave may fall on a work-from-home day, and the two halves of
// one day may be taken separately.
export function findLeaveClash(
  existing: LeaveRequest[],
  candidate: Pick<
    LeaveRequest,
    "leaveType" | "startDate" | "endDate" | "dayPortion" | "startTime" | "endTime"
  >,
) {
  return existing.find((other) => {
    if (other.status !== "pending" && other.status !== "approved") {
      return false;
    }
    if (!datesOverlap(candidate, other)) return false;

    const candidateShort = candidate.leaveType === "short_leave";
    const otherShort = other.leaveType === "short_leave";

    if (candidateShort && otherShort) {
      return (
        timeToMinutes(candidate.startTime) < timeToMinutes(other.endTime) &&
        timeToMinutes(other.startTime) < timeToMinutes(candidate.endTime)
      );
    }

    if (candidateShort || otherShort) {
      const dayRequest = candidateShort ? other : candidate;
      return dayRequest.leaveType !== "work_from_home";
    }

    const bothHalfDays =
      candidate.dayPortion !== "full" &&
      other.dayPortion !== "full" &&
      candidate.startDate === candidate.endDate &&
      other.startDate === other.endDate;

    return !(bothHalfDays && candidate.dayPortion !== other.dayPortion);
  });
}

// ---------------------------------------------------------------------------
// Paid leave balances
// ---------------------------------------------------------------------------

// Paid leave per calendar year: 14 annual + 8 casual + 8 medical = 30 days.
export type PaidLeaveType = "annual" | "casual" | "sick";

export const PAID_LEAVE_TYPES: PaidLeaveType[] = ["annual", "casual", "sick"];

export const LEAVE_ENTITLEMENTS: Record<PaidLeaveType, number> = {
  annual: 14,
  casual: 8,
  sick: 8,
};

export const isPaidLeaveType = (type: string): type is PaidLeaveType =>
  (PAID_LEAVE_TYPES as string[]).includes(type);

export interface LeaveBalance {
  year: string;
  types: Record<
    PaidLeaveType,
    {
      entitlement: number;
      approved: number;
      pending: number;
      // Absent days taken from this balance.
      absent: number;
      remaining: number;
    }
  >;
  absentDays: number;
  // Absent days beyond the paid balances.
  absentUnpaid: number;
  // Approved unpaid and other leave (not taken from paid leave).
  unpaidTaken: number;
  // Approved days off this year, absences included.
  leaveTaken: number;
  // This year's pending or approved annual leave (one block per year).
  annualBlock?: LeaveRequest;
}

// An employee's balances for a year (leave counts in the year it starts).
// Absences come out of annual leave first, then casual, then are unpaid.
// excludeId leaves one entry out, e.g. the one being edited.
export function getLeaveBalance(
  requests: LeaveRequest[],
  userId: string,
  year: string,
  excludeId?: string,
): LeaveBalance {
  const active = requests.filter(
    (request) =>
      request.userId === userId &&
      request.id !== excludeId &&
      request.startDate.startsWith(year) &&
      (request.status === "approved" || request.status === "pending"),
  );

  const sum = (type: LeaveType, status: RequestStatus) =>
    active
      .filter(
        (request) => request.leaveType === type && request.status === status,
      )
      .reduce((total, request) => total + request.days, 0);

  const used = (type: PaidLeaveType) =>
    sum(type, "approved") + sum(type, "pending");

  const absentDays = sum("absent", "approved");
  const fromAnnual = Math.min(
    absentDays,
    Math.max(0, LEAVE_ENTITLEMENTS.annual - used("annual")),
  );
  const fromCasual = Math.min(
    absentDays - fromAnnual,
    Math.max(0, LEAVE_ENTITLEMENTS.casual - used("casual")),
  );
  const absentFrom: Record<PaidLeaveType, number> = {
    annual: fromAnnual,
    casual: fromCasual,
    sick: 0,
  };

  const types = {} as LeaveBalance["types"];
  PAID_LEAVE_TYPES.forEach((type) => {
    types[type] = {
      entitlement: LEAVE_ENTITLEMENTS[type],
      approved: sum(type, "approved"),
      pending: sum(type, "pending"),
      absent: absentFrom[type],
      remaining: Math.max(
        0,
        LEAVE_ENTITLEMENTS[type] - used(type) - absentFrom[type],
      ),
    };
  });

  return {
    year,
    types,
    absentDays,
    absentUnpaid: absentDays - fromAnnual - fromCasual,
    unpaidTaken: sum("unpaid", "approved") + sum("other", "approved"),
    leaveTaken: active
      .filter(
        (request) =>
          request.status === "approved" &&
          getLeaveType(request.leaveType).countsAsLeave,
      )
      .reduce((total, request) => total + request.days, 0),
    annualBlock: active.find((request) => request.leaveType === "annual"),
  };
}

// Why a leave of this type and length can't be taken, or null if it can.
export function getLeaveAllowanceProblem(
  balance: LeaveBalance,
  leaveType: LeaveType,
  days: number,
) {
  if (!isPaidLeaveType(leaveType)) return null;

  if (leaveType === "annual" && balance.annualBlock) {
    return `Annual leave is taken as one block per year, and ${
      balance.year
    } already has annual leave on ${formatDateRange(balance.annualBlock)}.`;
  }

  const { remaining } = balance.types[leaveType];
  if (days > remaining) {
    return `Only ${formatDays(remaining)} of ${getLeaveType(
      leaveType,
    ).label.toLowerCase()} left in ${
      balance.year
    }. Choose fewer days or Unpaid Leave.`;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Leave record status
// ---------------------------------------------------------------------------

// Leave taken before the portal isn't in it, so employees only see their
// balance once an admin or finance has recorded their previous leave and
// absences and marked their leave record as updated. This is done once per
// employee; from then on the portal holds all their leave. Main admins
// (Leadership) always see their balance.
//   Panels/IEDGE-SYSTEM/Employee Requests and Approvals/leaveBalances/employees/{userId}

const leaveBalancesDoc = () =>
  doc(db, "Panels", PANEL_ID, EMPLOYEE_REQUESTS_COLLECTION, "leaveBalances");

const leaveRecordsCollection = () =>
  collection(leaveBalancesDoc(), "employees");

export interface LeaveRecordStatus {
  userId: string;
  updated: boolean;
  updatedByName: string;
  updatedAt: Date | null;
}

const mapLeaveRecordStatus = (
  userId: string,
  data: any,
): LeaveRecordStatus => ({
  userId,
  updated: data?.verified === true,
  updatedByName: data?.verifiedByName || "",
  updatedAt: toDate(data?.verifiedAt),
});

// Every employee's status, keyed by user id (for admins and finance).
export function subscribeToLeaveRecordStatuses(
  onChange: (statuses: Record<string, LeaveRecordStatus>) => void,
) {
  return onSnapshot(
    leaveRecordsCollection(),
    (snapshot) => {
      const statuses: Record<string, LeaveRecordStatus> = {};
      snapshot.docs.forEach((statusDoc) => {
        statuses[statusDoc.id] = mapLeaveRecordStatus(
          statusDoc.id,
          statusDoc.data(),
        );
      });
      onChange(statuses);
    },
    (error) => {
      console.error("Failed to load leave record statuses:", error);
      onChange({});
    },
  );
}

// One employee's own status.
export function subscribeToLeaveRecordStatus(
  userId: string,
  onChange: (status: LeaveRecordStatus) => void,
) {
  return onSnapshot(
    doc(leaveRecordsCollection(), userId),
    (snapshot) => onChange(mapLeaveRecordStatus(userId, snapshot.data())),
    (error) => {
      console.error("Failed to load leave record status:", error);
      onChange(mapLeaveRecordStatus(userId, null));
    },
  );
}

// Main admins (Leadership) always see their remaining leave; everyone else
// once their leave record has been marked as updated.
export const isLeaveRecordUpdated = (
  status: LeaveRecordStatus | undefined,
  role?: string | null,
) => isMainAdmin(role) || Boolean(status?.updated);

export async function setLeaveRecordUpdated(
  employee: { id: string; name: string },
  actor: { id: string; name: string },
  updated: boolean,
) {
  // Keeps a real document at the parent path for the Firebase console.
  try {
    await setDoc(
      leaveBalancesDoc(),
      { name: "Leave record status", updatedAt: serverTimestamp() },
      { merge: true },
    );
  } catch (error) {
    console.warn("Could not update leave balances document:", error);
  }

  await setDoc(
    doc(leaveRecordsCollection(), employee.id),
    {
      userId: employee.id,
      userName: employee.name,
      verified: updated,
      ...(updated
        ? {
            verifiedById: actor.id,
            verifiedByName: actor.name,
            verifiedAt: serverTimestamp(),
          }
        : {
            unverifiedById: actor.id,
            unverifiedByName: actor.name,
            unverifiedAt: serverTimestamp(),
          }),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

const toDate = (value: any): Date | null => {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toNumber = (value: any) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

function mapBase(id: string, data: any) {
  return {
    id,
    userId: data.userId || "",
    userName: data.userName || data.userEmail || "Unknown user",
    userEmail: data.userEmail || "",
    userRole: data.userRole || "",
    status: (REQUEST_STATUS_ORDER.includes(data.status)
      ? data.status
      : "pending") as RequestStatus,
    reason: data.reason || "",
    reviewedById: data.reviewedById || "",
    reviewedByName: data.reviewedByName || "",
    reviewNote: data.reviewNote || "",
    reviewedAt: toDate(data.reviewedAt),
    createdAt: toDate(data.createdAt),
  };
}

export function mapRequest(
  kind: RequestKind,
  id: string,
  data: any,
): EmployeeRequest {
  const base = mapBase(id, data);

  if (kind === "advance") {
    const amount = toNumber(data.amount);
    const installments = Math.max(1, toNumber(data.installments) || 1);

    return {
      ...base,
      kind,
      advanceType: getAdvanceType(data.advanceType).value,
      amount,
      installments,
      monthlyDeduction:
        toNumber(data.monthlyDeduction) || Math.round(amount / installments),
      neededBy: data.neededBy || "",
    };
  }

  if (kind === "document") {
    return {
      ...base,
      kind,
      documentType: getDocumentType(data.documentType).value,
      addressedTo: data.addressedTo || "",
      neededBy: data.neededBy || "",
      period: data.period || "",
    };
  }

  const dayPortion: LeaveDayPortion = LEAVE_DAY_PORTIONS.some(
    (portion) => portion.value === data.dayPortion,
  )
    ? data.dayPortion
    : "full";
  const startDate = data.startDate || "";

  return {
    ...base,
    kind,
    leaveType: getLeaveType(data.leaveType).value,
    startDate,
    endDate: data.endDate || startDate,
    dayPortion,
    days:
      typeof data.days === "number"
        ? data.days
        : countLeaveDays(
            startDate,
            data.endDate || startDate,
            dayPortion,
            getLeaveType(data.leaveType).value,
          ),
    startTime: data.startTime || "",
    endTime: data.endTime || "",
    hours: toNumber(data.hours),
    recordedById: data.recordedById || "",
    recordedByName: data.recordedByName || "",
  };
}

// Newest first.
export const sortRequests = <T extends EmployeeRequest>(requests: T[]) =>
  [...requests].sort(
    (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0),
  );

// Short description used in titles and notifications.
export function getRequestTitle(request: EmployeeRequest) {
  if (request.kind === "advance") {
    return getAdvanceType(request.advanceType).label;
  }
  if (request.kind === "document") {
    return getDocumentType(request.documentType).label;
  }
  return getLeaveType(request.leaveType).label;
}

export function describeRequest(request: EmployeeRequest) {
  const title = getRequestTitle(request).toLowerCase();

  if (request.kind === "advance") {
    return `${title} of ${formatMoney(request.amount)}`;
  }
  if (request.kind === "document") {
    return title;
  }
  if (request.leaveType === "short_leave") {
    return `${title} (${formatDateValue(request.startDate)}, ${formatTime(
      request.startTime,
    )} – ${formatTime(request.endTime)})`;
  }
  return `${title} (${formatDateRange(request)}, ${formatDays(request.days)})`;
}

// ---------------------------------------------------------------------------
// Writing
// ---------------------------------------------------------------------------

export type RequestActor = {
  id: string;
  name: string;
  email?: string;
  role?: string;
};

// Main admins, plus active approvers whose departments include the
// employee's, are told about a new request.
async function notifyApprovers(
  actor: RequestActor,
  requestId: string,
  message: string,
) {
  // Best effort: the request is saved even if notifications fail.
  try {
    const [users, approversSnapshot] = await Promise.all([
      getDocs(collection(db, "Panels", PANEL_ID, "users")),
      getDoc(approversDoc()),
    ]);

    const recipients = new Set<string>(
      users.docs
        .filter((userDoc) => isMainAdmin(userDoc.data().role))
        .map((userDoc) => userDoc.id),
    );

    mapApprovers(approversSnapshot.data())
      .filter(
        (approver) =>
          approver.canApprove &&
          isApproverActive(approver) &&
          approverCoversDepartment(approver, actor.role),
      )
      .forEach((approver) => recipients.add(approver.userId));

    recipients.delete(actor.id);

    await Promise.all(
      Array.from(recipients).map((recipientId) =>
        createNotification({
          recipientId,
          type: "employee_request",
          recordId: requestId,
          message,
          createdById: actor.id,
          createdByName: actor.name,
        }),
      ),
    );
  } catch (error) {
    console.error("Failed to notify request approvers:", error);
  }
}

// Keeps a real document at each kind's path so the request collections are
// easy to find in the Firebase console.
async function touchKindDoc(kind: RequestKind) {
  try {
    await setDoc(
      kindDoc(kind),
      { name: REQUEST_KINDS[kind].label, updatedAt: serverTimestamp() },
      { merge: true },
    );
  } catch (error) {
    console.warn("Could not update request group document:", error);
  }
}

async function addRequest(
  kind: RequestKind,
  actor: RequestActor,
  fields: Record<string, any>,
) {
  await touchKindDoc(kind);

  const ref = await addDoc(requestsCollection(kind), {
    userId: actor.id,
    userName: actor.name,
    userEmail: actor.email || "",
    userRole: actor.role || "",
    ...fields,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const request = mapRequest(kind, ref.id, fields);
  await notifyApprovers(
    actor,
    ref.id,
    `${actor.name} requested ${describeRequest(request)}.`,
  );

  return ref;
}

function buildLeaveFields(input: LeaveInput) {
  const isShort = input.leaveType === "short_leave";
  const endDate = isShort ? input.startDate : input.endDate;
  const dayPortion =
    !isShort && input.startDate === endDate ? input.dayPortion : "full";

  return {
    leaveType: input.leaveType,
    startDate: input.startDate,
    endDate,
    dayPortion,
    days: isShort
      ? 0
      : countLeaveDays(input.startDate, endDate, dayPortion, input.leaveType),
    startTime: isShort ? input.startTime : "",
    endTime: isShort ? input.endTime : "",
    hours: isShort ? countHours(input.startTime, input.endTime) : 0,
    reason: input.reason.trim(),
  };
}

export function submitLeaveRequest(actor: RequestActor, input: LeaveInput) {
  return addRequest("leave", actor, buildLeaveFields(input));
}

// An admin records leave or an absence for an employee, e.g. days they were
// already away. It is saved as approved straight away and nobody is notified.
export async function recordLeave(
  recorder: RequestActor,
  employee: RequestActor,
  input: LeaveInput,
) {
  await touchKindDoc("leave");

  return addDoc(requestsCollection("leave"), {
    userId: employee.id,
    userName: employee.name,
    userEmail: employee.email || "",
    userRole: employee.role || "",
    ...buildLeaveFields(input),
    status: "approved",
    recordedById: recorder.id,
    recordedByName: recorder.name,
    reviewedById: recorder.id,
    reviewedByName: recorder.name,
    reviewNote: "",
    reviewedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateRecordedLeave(
  request: LeaveRequest,
  recorder: RequestActor,
  input: LeaveInput,
) {
  await updateDoc(doc(requestsCollection("leave"), request.id), {
    ...buildLeaveFields(input),
    updatedById: recorder.id,
    updatedByName: recorder.name,
    updatedAt: serverTimestamp(),
  });
}

// Recorded entries are cancelled rather than deleted, keeping who removed them.
export async function removeRecordedLeave(
  request: LeaveRequest,
  recorder: RequestActor,
) {
  await updateDoc(doc(requestsCollection("leave"), request.id), {
    status: "cancelled",
    removedById: recorder.id,
    removedByName: recorder.name,
    removedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function submitAdvanceRequest(actor: RequestActor, input: AdvanceInput) {
  const amount = Math.round(Number(input.amount) || 0);
  const installments = Math.max(1, Number(input.installments) || 1);

  return addRequest("advance", actor, {
    advanceType: input.advanceType,
    amount,
    installments,
    monthlyDeduction: Math.round(amount / installments),
    neededBy: input.neededBy,
    reason: input.reason.trim(),
  });
}

export function submitDocumentRequest(
  actor: RequestActor,
  input: DocumentInput,
) {
  return addRequest("document", actor, {
    documentType: input.documentType,
    addressedTo: input.addressedTo.trim(),
    neededBy: input.neededBy,
    period: input.documentType === "payslip" ? input.period : "",
    reason: input.reason.trim(),
  });
}

export async function reviewRequest(
  request: EmployeeRequest,
  reviewer: RequestActor,
  decision: "approved" | "rejected",
  rejectionReason = "",
) {
  const note = decision === "rejected" ? rejectionReason.trim() : "";

  await updateDoc(doc(requestsCollection(request.kind), request.id), {
    status: decision,
    reviewedById: reviewer.id,
    reviewedByName: reviewer.name,
    reviewNote: note,
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await createNotification({
    recipientId: request.userId,
    type: "employee_request",
    recordId: request.id,
    message: `Your ${describeRequest(request)} was ${decision} by ${
      reviewer.name
    }${note ? `: "${note}"` : "."}`,
    createdById: reviewer.id,
    createdByName: reviewer.name,
  });
}

export async function cancelRequest(request: EmployeeRequest) {
  await updateDoc(doc(requestsCollection(request.kind), request.id), {
    status: "cancelled",
    updatedAt: serverTimestamp(),
  });
}
