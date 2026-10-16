import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { format } from "date-fns";
import { db } from "@/lib/firebase";
import {
  EMPLOYEE_REQUESTS_COLLECTION,
  hasBuiltInRequestAccess,
  isMainAdmin,
  parseDateValue,
  recordLeave,
  toDateValue,
  type LeaveRequest,
  type RequestActor,
} from "@/lib/employeeRequests";

const PANEL_ID = "IEDGE-SYSTEM";

// Firestore layout:
//   Panels/IEDGE-SYSTEM/Employee Requests and Approvals/attendance
//     office hours and the late coming rule
//   .../attendance/records/{userId}_{YYYY-MM-DD}
//     one employee's check-in and check-out for one day
//
// Employees check in and out themselves. The main admin, finance and
// financial admins see everyone's attendance, correct or excuse entries,
// change the office hours and the late rule, and apply late deductions.

export const canManageAttendance = (role?: string | null) =>
  isMainAdmin(role) || hasBuiltInRequestAccess(role);

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface LateRule {
  // When on, every `lates` late arrivals in a month deduct `deductDays`
  // (from casual leave, then unpaid) once an admin applies it.
  enabled: boolean;
  lates: number;
  deductDays: 0.5 | 1;
}

export interface AttendanceSettings {
  // Office hours, HH:mm. Arriving after start + grace is late; leaving
  // before end is early (no grace).
  startTime: string;
  endTime: string;
  graceMinutes: number;
  lateRule: LateRule;
}

export const DEFAULT_ATTENDANCE_SETTINGS: AttendanceSettings = {
  startTime: "09:00",
  endTime: "17:00",
  graceMinutes: 30,
  lateRule: { enabled: false, lates: 3, deductDays: 0.5 },
};

const attendanceDoc = () =>
  doc(db, "Panels", PANEL_ID, EMPLOYEE_REQUESTS_COLLECTION, "attendance");

const recordsCollection = () => collection(attendanceDoc(), "records");

const isTime = (value: any) =>
  typeof value === "string" && /^\d{2}:\d{2}$/.test(value);

function mapSettings(data: any): AttendanceSettings {
  const defaults = DEFAULT_ATTENDANCE_SETTINGS;
  const rule = data?.lateRule || {};

  return {
    startTime: isTime(data?.startTime) ? data.startTime : defaults.startTime,
    endTime: isTime(data?.endTime) ? data.endTime : defaults.endTime,
    graceMinutes: Number.isFinite(Number(data?.graceMinutes))
      ? Math.max(0, Number(data.graceMinutes))
      : defaults.graceMinutes,
    lateRule: {
      enabled: rule.enabled === true,
      lates:
        Number(rule.lates) >= 1
          ? Math.round(Number(rule.lates))
          : defaults.lateRule.lates,
      deductDays: Number(rule.deductDays) === 1 ? 1 : 0.5,
    },
  };
}

export function subscribeToAttendanceSettings(
  onChange: (settings: AttendanceSettings) => void,
) {
  return onSnapshot(
    attendanceDoc(),
    (snapshot) => onChange(mapSettings(snapshot.data())),
    (error) => {
      console.error("Failed to load attendance settings:", error);
      onChange(DEFAULT_ATTENDANCE_SETTINGS);
    },
  );
}

export async function saveAttendanceSettings(
  settings: AttendanceSettings,
  actor: { id: string; name: string },
) {
  await setDoc(
    attendanceDoc(),
    {
      name: "Attendance",
      ...settings,
      updatedById: actor.id,
      updatedByName: actor.name,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  // The day, YYYY-MM-DD.
  date: string;
  checkIn: Date | null;
  checkOut: Date | null;
  // Office hours that applied that day, so later changes don't rewrite
  // history.
  startTime: string;
  endTime: string;
  graceMinutes: number;
  // Excused days never count as late or early.
  excused: boolean;
  note: string;
  editedByName: string;
}

const recordId = (userId: string, date: string) => `${userId}_${date}`;

const toDate = (value: any): Date | null => {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

function mapRecord(
  snapshot: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>,
): AttendanceRecord | null {
  // Pending server timestamps read as the local estimate, so a fresh
  // check-in shows straight away.
  const data = snapshot.data({ serverTimestamps: "estimate" });
  if (!data) return null;

  return {
    id: snapshot.id,
    userId: data.userId || "",
    userName: data.userName || "Unknown user",
    userRole: data.userRole || "",
    date: data.date || "",
    checkIn: toDate(data.checkIn),
    checkOut: toDate(data.checkOut),
    startTime: isTime(data.startTime)
      ? data.startTime
      : DEFAULT_ATTENDANCE_SETTINGS.startTime,
    endTime: isTime(data.endTime)
      ? data.endTime
      : DEFAULT_ATTENDANCE_SETTINGS.endTime,
    graceMinutes: Number.isFinite(Number(data.graceMinutes))
      ? Number(data.graceMinutes)
      : DEFAULT_ATTENDANCE_SETTINGS.graceMinutes,
    excused: data.excused === true,
    note: data.note || "",
    editedByName: data.editedByName || "",
  };
}

const officeHoursFields = (settings: AttendanceSettings) => ({
  startTime: settings.startTime,
  endTime: settings.endTime,
  graceMinutes: settings.graceMinutes,
});

// One employee's record for one day (e.g. today, for the check-in button).
export function subscribeToAttendanceDay(
  userId: string,
  date: string,
  onChange: (record: AttendanceRecord | null) => void,
) {
  return onSnapshot(
    doc(recordsCollection(), recordId(userId, date)),
    (snapshot) => onChange(snapshot.exists() ? mapRecord(snapshot) : null),
    (error) => {
      console.error("Failed to load attendance:", error);
      onChange(null);
    },
  );
}

// Everyone's records between two days, inclusive (for admins and finance).
export function subscribeToAttendanceRange(
  startDate: string,
  endDate: string,
  onChange: (records: AttendanceRecord[]) => void,
) {
  return onSnapshot(
    query(
      recordsCollection(),
      where("date", ">=", startDate),
      where("date", "<=", endDate),
    ),
    (snapshot) =>
      onChange(
        snapshot.docs
          .map(mapRecord)
          .filter((record): record is AttendanceRecord => Boolean(record)),
      ),
    (error) => {
      console.error("Failed to load attendance:", error);
      onChange([]);
    },
  );
}

// All of one employee's records (their own history).
export function subscribeToUserAttendance(
  userId: string,
  onChange: (records: AttendanceRecord[]) => void,
) {
  return onSnapshot(
    query(recordsCollection(), where("userId", "==", userId)),
    (snapshot) =>
      onChange(
        snapshot.docs
          .map(mapRecord)
          .filter((record): record is AttendanceRecord => Boolean(record)),
      ),
    (error) => {
      console.error("Failed to load attendance:", error);
      onChange([]);
    },
  );
}

async function touchAttendanceDoc() {
  try {
    await setDoc(attendanceDoc(), { name: "Attendance" }, { merge: true });
  } catch (error) {
    console.warn("Could not update attendance document:", error);
  }
}

// Records the arrival time (server time) once per day; checking in again
// the same day changes nothing.
export async function checkIn(user: RequestActor, settings: AttendanceSettings) {
  await touchAttendanceDoc();

  const date = toDateValue(new Date());
  const ref = doc(recordsCollection(), recordId(user.id, date));

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (snapshot.exists() && snapshot.data().checkIn) return;

    transaction.set(
      ref,
      {
        userId: user.id,
        userName: user.name,
        userEmail: user.email || "",
        userRole: user.role || "",
        date,
        checkIn: serverTimestamp(),
        ...officeHoursFields(settings),
        excused: false,
        note: "",
        source: "self",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  });
}

// Records the leaving time (server time); checking out again updates it.
export async function checkOut(userId: string, date: string) {
  await updateDoc(doc(recordsCollection(), recordId(userId, date)), {
    checkOut: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

const atTime = (date: string, time: string) => {
  const day = parseDateValue(date);
  if (!day || !isTime(time)) return null;
  const [hours, minutes] = time.split(":").map(Number);
  day.setHours(hours, minutes, 0, 0);
  return Timestamp.fromDate(day);
};

// An admin adds or corrects an employee's times for a day, or excuses it.
export async function saveAttendanceEntry(
  employee: RequestActor,
  date: string,
  entry: {
    checkInTime: string;
    checkOutTime: string;
    excused: boolean;
    note: string;
  },
  settings: AttendanceSettings,
  actor: { id: string; name: string },
  existing: AttendanceRecord | null,
) {
  await touchAttendanceDoc();

  await setDoc(
    doc(recordsCollection(), recordId(employee.id, date)),
    {
      userId: employee.id,
      userName: employee.name,
      userEmail: employee.email || "",
      userRole: employee.role || "",
      date,
      checkIn: atTime(date, entry.checkInTime),
      checkOut: atTime(date, entry.checkOutTime),
      // A new entry uses today's office hours; a corrected one keeps its own.
      ...(existing
        ? {
            startTime: existing.startTime,
            endTime: existing.endTime,
            graceMinutes: existing.graceMinutes,
          }
        : officeHoursFields(settings)),
      excused: entry.excused,
      note: entry.note.trim(),
      editedById: actor.id,
      editedByName: actor.name,
      editedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(existing ? {} : { source: "admin", createdAt: serverTimestamp() }),
    },
    { merge: true },
  );
}

// ---------------------------------------------------------------------------
// Late and early
// ---------------------------------------------------------------------------

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const minutesOfDay = (date: Date) => date.getHours() * 60 + date.getMinutes();

// Monday to Friday; Saturday and Sunday are the weekend.
export const isWorkingDay = (date: string) => {
  const day = parseDateValue(date);
  return Boolean(day && day.getDay() !== 0 && day.getDay() !== 6);
};

export interface AttendanceStatus {
  isLate: boolean;
  // Minutes after the start time (counted from 9:00, not from the grace).
  lateMinutes: number;
  leftEarly: boolean;
  earlyMinutes: number;
  noCheckOut: boolean;
}

export function getAttendanceStatus(record: AttendanceRecord): AttendanceStatus {
  const working = isWorkingDay(record.date) && !record.excused;
  const start = timeToMinutes(record.startTime);
  const end = timeToMinutes(record.endTime);

  const arrival = record.checkIn ? minutesOfDay(record.checkIn) : null;
  const leaving = record.checkOut ? minutesOfDay(record.checkOut) : null;

  const isLate =
    working && arrival !== null && arrival > start + record.graceMinutes;
  const leftEarly = working && leaving !== null && leaving < end;

  return {
    isLate,
    lateMinutes: isLate && arrival !== null ? arrival - start : 0,
    leftEarly,
    earlyMinutes: leftEarly && leaving !== null ? end - leaving : 0,
    noCheckOut: Boolean(record.checkIn) && !record.checkOut,
  };
}

export const formatClock = (date: Date | null) =>
  date ? format(date, "h:mm a") : "—";

export const formatMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
};

export const toTimeInputValue = (date: Date | null) =>
  date ? format(date, "HH:mm") : "";

// ---------------------------------------------------------------------------
// Monthly summary and late deductions
// ---------------------------------------------------------------------------

export interface AttendanceMonthSummary {
  userId: string;
  userName: string;
  daysPresent: number;
  lateCount: number;
  // Days of each late arrival, in order (deductions use these dates).
  lateDates: string[];
  earlyCount: number;
  noCheckOutCount: number;
}

// Per-employee totals for the given records (normally one month).
export function summarizeAttendance(records: AttendanceRecord[]) {
  const summaries = new Map<string, AttendanceMonthSummary>();

  [...records]
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((record) => {
      const summary = summaries.get(record.userId) || {
        userId: record.userId,
        userName: record.userName,
        daysPresent: 0,
        lateCount: 0,
        lateDates: [],
        earlyCount: 0,
        noCheckOutCount: 0,
      };
      const status = getAttendanceStatus(record);

      if (record.checkIn) summary.daysPresent += 1;
      if (status.isLate) {
        summary.lateCount += 1;
        summary.lateDates.push(record.date);
      }
      if (status.leftEarly) summary.earlyCount += 1;
      if (status.noCheckOut && record.date < toDateValue(new Date())) {
        summary.noCheckOutCount += 1;
      }

      summaries.set(record.userId, summary);
    });

  return summaries;
}

// Late deductions already applied to an employee for a month (YYYY-MM).
export const getAppliedLateDeductions = (
  leaveRequests: LeaveRequest[],
  userId: string,
  month: string,
) =>
  leaveRequests.filter(
    (request) =>
      request.userId === userId &&
      request.leaveType === "late_deduction" &&
      request.status === "approved" &&
      request.startDate.startsWith(month),
  );

// How many deductions the rule asks for, given the month's late arrivals.
export const getDueLateDeductions = (lateCount: number, rule: LateRule) =>
  rule.enabled && rule.lates >= 1 ? Math.floor(lateCount / rule.lates) : 0;

// Records the deductions that are due but not yet applied, each dated on
// the late arrival that triggered it (e.g. the 3rd, 6th...). Each is a
// "Late Deduction" leave entry: it comes out of casual leave, then unpaid,
// and can be removed from Leave Records like any recorded entry.
export async function applyLateDeductions(
  employee: RequestActor,
  summary: AttendanceMonthSummary,
  rule: LateRule,
  alreadyApplied: number,
  monthLabel: string,
  actor: RequestActor,
) {
  const due = getDueLateDeductions(summary.lateCount, rule);

  for (let unit = alreadyApplied; unit < due; unit += 1) {
    const date = summary.lateDates[(unit + 1) * rule.lates - 1];
    if (!date) break;

    await recordLeave(actor, employee, {
      leaveType: "late_deduction",
      startDate: date,
      endDate: date,
      dayPortion: rule.deductDays === 0.5 ? "first_half" : "full",
      startTime: "",
      endTime: "",
      reason: `Late deduction: ${rule.lates} late arrivals in ${monthLabel}.`,
    });
  }
}
