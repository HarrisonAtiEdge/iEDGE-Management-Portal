import { useEffect, useMemo, useState } from "react";
import { onSnapshot, query, where } from "firebase/firestore";
import {
  CalendarDays,
  ClipboardList,
  Clock3,
  Inbox,
  Palmtree,
  Plus,
  Info,
  Search,
  Sun,
  UserX,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNotifications } from "@/hooks/useNotifications";
import {
  REQUEST_KINDS,
  REQUEST_KIND_ORDER,
  REQUEST_NOTIFICATION_TYPES,
  REQUEST_STATUS_ORDER,
  REQUEST_STATUS_STYLES,
  cancelRequest,
  canReviewRequest,
  describeRequest,
  formatDateRange,
  formatDateValue,
  formatDays,
  formatLeaveDuration,
  getApprovalAccess,
  getLeaveAllowanceProblem,
  getLeaveBalance,
  getLeaveType,
  getRequestTitle,
  isLeaveRecordUpdated,
  isTimeOff,
  isPaidLeaveType,
  leaveCoversDay,
  mapRequest,
  recordLeave,
  removeRecordedLeave,
  requestsCollection,
  reviewRequest,
  sortRequests,
  submitAdvanceRequest,
  submitDocumentRequest,
  submitLeaveRequest,
  setLeaveRecordUpdated,
  subscribeToApprovers,
  subscribeToLeaveRecordStatus,
  subscribeToLeaveRecordStatuses,
  toDateValue,
  updateRecordedLeave,
  type EmployeeRequest,
  type LeaveRecordStatus,
  type LeaveRequest,
  type RequestApprover,
  type RequestKind,
  type RequestStatus,
} from "@/lib/employeeRequests";

import { Button } from "@/components/ui/button";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ApproverSettings from "@/components/EmployeeRequests/ApproverSettings";
import AttendancePanel from "@/components/EmployeeRequests/AttendancePanel";
import { canManageAttendance } from "@/lib/attendance";
import LeaveBalancePanel from "@/components/EmployeeRequests/LeaveBalancePanel";
import LeaveCalendar from "@/components/EmployeeRequests/LeaveCalendar";
import LeaveRecordsPanel from "@/components/EmployeeRequests/LeaveRecordsPanel";
import NewRequestDialog from "@/components/EmployeeRequests/NewRequestDialog";
import RecordLeaveDialog from "@/components/EmployeeRequests/RecordLeaveDialog";
import RequestCard from "@/components/EmployeeRequests/RequestCard";
import {
  EmptyState,
  PillGroup,
  StatTile,
  fieldLabelClass,
} from "@/components/EmployeeRequests/shared";

type TabKey =
  | "approvals"
  | "calendar"
  | "mine"
  | "attendance"
  | "absences"
  | "approvers";
type KindFilter = RequestKind | "all";
type StatusFilter = RequestStatus | "all";

const KIND_FILTER_LABELS: Record<RequestKind, string> = {
  leave: "Leave & Time Off",
  advance: "Salary Advance",
  document: "Documents",
};

const emptyByKind = (): Record<RequestKind, EmployeeRequest[]> => ({
  leave: [],
  advance: [],
  document: [],
});

export default function EmployeeRequests() {
  const { currentUser, userProfile } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const userId = currentUser?.uid || "";
  const role = String(userProfile?.role || "");

  // The main admin reviews everything; other users only the departments the
  // main admin has assigned them on the Approvers tab.
  const [approvers, setApprovers] = useState<RequestApprover[]>([]);
  useEffect(() => subscribeToApprovers(setApprovers), []);

  const access = useMemo(
    () => getApprovalAccess(userId, role, approvers),
    [userId, role, approvers],
  );
  // canRecord: may record absences and see their departments' leave.
  const { isApprover, isMainAdmin, canRecord } = access;

  // Requests from employees this user may oversee (and their own).
  const inScope = (request: EmployeeRequest) =>
    request.userId === userId || access.coversDepartment(request.userRole);

  const actor = useMemo(
    () => ({
      id: userId,
      name:
        userProfile?.displayName ||
        currentUser?.displayName ||
        currentUser?.email ||
        "User",
      email: userProfile?.email || currentUser?.email || "",
      role,
    }),
    [userId, userProfile, currentUser, role],
  );

  const [byKind, setByKind] = useState(emptyByKind);
  const [loadedKinds, setLoadedKinds] = useState<RequestKind[]>([]);

  // null until a tab is picked: approvers then start on Approvals. A tab the
  // user loses access to falls back to the calendar.
  const [chosenTab, setActiveTab] = useState<TabKey | null>(null);
  const activeTab: TabKey =
    (chosenTab === "approvals" && !isApprover) ||
    (chosenTab === "absences" && !canRecord) ||
    (chosenTab === "approvers" && !isMainAdmin)
      ? "calendar"
      : chosenTab ?? (isApprover ? "approvals" : "calendar");
  const [calendarScope, setCalendarScope] = useState<"everyone" | "mine">(
    "everyone",
  );
  const [myKindFilter, setMyKindFilter] = useState<KindFilter>("all");
  const [approvalKindFilter, setApprovalKindFilter] =
    useState<KindFilter>("all");
  const [approvalStatusFilter, setApprovalStatusFilter] =
    useState<StatusFilter>("pending");
  const [approvalSearch, setApprovalSearch] = useState("");

  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{
    request: EmployeeRequest;
    decision: "approved" | "rejected";
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<EmployeeRequest | null>(
    null,
  );

  const [recordOpen, setRecordOpen] = useState(false);
  const [recordEditing, setRecordEditing] = useState<LeaveRequest | null>(
    null,
  );
  const [removeRecordTarget, setRemoveRecordTarget] =
    useState<LeaveRequest | null>(null);
  const [absenceSearch, setAbsenceSearch] = useState("");
  const [recordInitialEmployee, setRecordInitialEmployee] = useState("");
  const [recordsView, setRecordsView] = useState<"employees" | "entries">(
    "employees",
  );

  // Whose leave record is updated (previous leave recorded): everyone's for
  // admins and finance, only their own for other employees.
  const [recordStatuses, setRecordStatuses] = useState<
    Record<string, LeaveRecordStatus>
  >({});
  const [statusesLoaded, setStatusesLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;

    setStatusesLoaded(false);
    const apply = (statuses: Record<string, LeaveRecordStatus>) => {
      setRecordStatuses(statuses);
      setStatusesLoaded(true);
    };

    return canRecord
      ? subscribeToLeaveRecordStatuses(apply)
      : subscribeToLeaveRecordStatus(userId, (status) =>
          apply({ [userId]: status }),
        );
  }, [userId, canRecord]);

  // Employees see their remaining leave only once their record is updated;
  // the main admin always does.
  const myRecordUpdated = isLeaveRecordUpdated(recordStatuses[userId], role);

  // Opening the page clears the request dot in the sidebar.
  const { notifications, markAsRead } = useNotifications();
  useEffect(() => {
    notifications
      .filter(
        (notification) =>
          !notification.read &&
          REQUEST_NOTIFICATION_TYPES.includes(notification.type),
      )
      .forEach((notification) => void markAsRead(notification.id));
    // markAsRead is recreated on every render; notifications drive this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  // Approvers read every request, and recorders every leave request, then
  // filter to their departments here; everyone else reads only their own.
  useEffect(() => {
    if (!userId) return;

    setByKind(emptyByKind());
    setLoadedKinds([]);

    const markLoaded = (kind: RequestKind) =>
      setLoadedKinds((previous) =>
        previous.includes(kind) ? previous : [...previous, kind],
      );

    const unsubscribers = REQUEST_KIND_ORDER.map((kind) =>
      onSnapshot(
        (kind === "leave" ? canRecord : isApprover)
          ? requestsCollection(kind)
          : query(requestsCollection(kind), where("userId", "==", userId)),
        (snapshot) => {
          setByKind((previous) => ({
            ...previous,
            [kind]: snapshot.docs.map((requestDoc) =>
              mapRequest(kind, requestDoc.id, requestDoc.data()),
            ),
          }));
          markLoaded(kind);
        },
        (error) => {
          console.error(`Failed to load ${kind} requests:`, error);
          markLoaded(kind);
          toast({
            title: "Error",
            description: `Failed to load ${REQUEST_KINDS[
              kind
            ].label.toLowerCase()} requests`,
            variant: "destructive",
          });
        },
      ),
    );

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [userId, isApprover, canRecord, toast]);

  const loading = loadedKinds.length < REQUEST_KIND_ORDER.length;
  const today = toDateValue(new Date());
  const currentYear = String(new Date().getFullYear());

  const allRequests = useMemo(
    () => sortRequests(REQUEST_KIND_ORDER.flatMap((kind) => byKind[kind])),
    [byKind],
  );
  const leaveRequests = byKind.leave as LeaveRequest[];

  const myRequests = useMemo(
    () => allRequests.filter((request) => request.userId === userId),
    [allRequests, userId],
  );
  const myLeave = useMemo(
    () => leaveRequests.filter((request) => request.userId === userId),
    [leaveRequests, userId],
  );

  const canReview = (request: EmployeeRequest) =>
    canReviewRequest(request, userId, access);

  // Leave the user may see on the team calendar.
  const teamLeave = useMemo(
    () => leaveRequests.filter(inScope),
    // inScope depends only on userId and access.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [leaveRequests, userId, access],
  );

  const awaitingReview = allRequests.filter(canReview).length;

  const myBalance = useMemo(
    () => getLeaveBalance(myLeave, userId, currentYear),
    [myLeave, userId, currentYear],
  );

  // Absences and past leave recorded by admins, in this user's departments.
  const recordedAbsences = useMemo(() => {
    const search = absenceSearch.trim().toLowerCase();

    return teamLeave
      .filter(
        (request) =>
          request.recordedById &&
          request.status === "approved" &&
          (!search ||
            [request.userName, request.reason, getLeaveType(request.leaveType).label]
              .join(" ")
              .toLowerCase()
              .includes(search)),
      )
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [teamLeave, absenceSearch]);

  const stats = useMemo(() => {
    const nextTimeOff = myLeave
      .filter(
        (request) =>
          request.status === "approved" &&
          request.leaveType !== "work_from_home" &&
          request.endDate >= today,
      )
      .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];

    const approvedToday = teamLeave.filter(
      (request) =>
        request.status === "approved" &&
        isTimeOff(request) &&
        leaveCoversDay(request, today),
    );

    return {
      myPending: myRequests.filter((request) => request.status === "pending")
        .length,
      nextTimeOff,
      offToday: approvedToday.filter(
        (request) => request.leaveType !== "work_from_home",
      ).length,
      remoteToday: approvedToday.filter(
        (request) => request.leaveType === "work_from_home",
      ).length,
    };
  }, [myRequests, myLeave, teamLeave, today]);

  const calendarRequests =
    canRecord && calendarScope === "everyone" ? teamLeave : myLeave;

  // ---------------------------------------------------------------------------
  // Filters
  // ---------------------------------------------------------------------------

  const myFiltered = myRequests.filter(
    (request) => myKindFilter === "all" || request.kind === myKindFilter,
  );

  // Requests from the departments this user reviews (their own only for the
  // main admin, who can approve them).
  const approvalPool = isApprover
    ? allRequests.filter(
        (request) =>
          access.coversDepartment(request.userRole) &&
          (request.userId !== userId || isMainAdmin),
      )
    : [];

  const approvalFiltered = useMemo(() => {
    const search = approvalSearch.trim().toLowerCase();

    return approvalPool.filter((request) => {
      if (
        approvalKindFilter !== "all" &&
        request.kind !== approvalKindFilter
      ) {
        return false;
      }
      if (
        approvalStatusFilter !== "all" &&
        request.status !== approvalStatusFilter
      ) {
        return false;
      }
      if (!search) return true;

      return [
        request.userName,
        request.userEmail,
        request.reason,
        getRequestTitle(request),
        REQUEST_KINDS[request.kind].label,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
  }, [approvalPool, approvalKindFilter, approvalStatusFilter, approvalSearch]);

  const countBy = (
    requests: EmployeeRequest[],
    key: (request: EmployeeRequest) => string,
    value: string,
  ) =>
    value === "all"
      ? requests.length
      : requests.filter((request) => key(request) === value).length;

  // For a pending paid leave: the employee's balance before it, or why it
  // goes over.
  const getBalanceNote = (request: EmployeeRequest) => {
    if (
      request.kind !== "leave" ||
      request.status !== "pending" ||
      !isPaidLeaveType(request.leaveType)
    ) {
      return undefined;
    }

    const balance = getLeaveBalance(
      leaveRequests,
      request.userId,
      request.startDate.slice(0, 4),
      request.id,
    );
    const problem = getLeaveAllowanceProblem(
      balance,
      request.leaveType,
      request.days,
    );
    const item = balance.types[request.leaveType];
    const recordUpdated = isLeaveRecordUpdated(
      recordStatuses[request.userId],
      request.userRole,
    );
    const caveat = recordUpdated
      ? ""
      : " Their previous leave isn't recorded yet, so the real balance may be lower.";

    return problem
      ? { text: `${problem}${caveat}`, warning: true }
      : {
          text: `${getLeaveType(request.leaveType).label} balance: ${formatDays(
            item.remaining,
          )} of ${item.entitlement} left, ${formatDays(
            item.remaining - request.days,
          )} after this.${caveat}`,
          warning: !recordUpdated,
        };
  };

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const requestSent = () =>
    toast({
      title: "Request sent",
      description: "You'll be notified once it has been reviewed.",
    });

  async function confirmReview() {
    if (!reviewTarget) return;

    const { request, decision } = reviewTarget;

    if (decision === "rejected" && !rejectionReason.trim()) {
      toast({
        title: "Add a reason",
        description: "Please tell the employee why the request is rejected.",
        variant: "destructive",
      });
      return;
    }

    try {
      setReviewing(true);
      await reviewRequest(request, actor, decision, rejectionReason);
      toast({
        title: decision === "approved" ? "Request approved" : "Request rejected",
        description: `${request.userName} has been notified.`,
      });
      setReviewTarget(null);
    } catch (error: any) {
      console.error("Failed to review request:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update the request",
        variant: "destructive",
      });
    } finally {
      setReviewing(false);
    }
  }

  async function confirmRemoveRecord() {
    if (!removeRecordTarget) return;

    try {
      await removeRecordedLeave(removeRecordTarget, actor);
      toast({ title: "Recorded entry removed" });
    } catch (error: any) {
      console.error("Failed to remove recorded leave:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to remove the entry",
        variant: "destructive",
      });
    } finally {
      setRemoveRecordTarget(null);
    }
  }

  async function confirmCancel() {
    if (!cancelTarget) return;

    try {
      await cancelRequest(cancelTarget);
      toast({ title: "Request cancelled" });
    } catch (error: any) {
      console.error("Failed to cancel request:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to cancel the request",
        variant: "destructive",
      });
    } finally {
      setCancelTarget(null);
    }
  }

  const renderCard = (
    request: EmployeeRequest,
    options: { showUser: boolean; showKind: boolean },
  ) => (
    <RequestCard
      key={`${request.kind}-${request.id}`}
      request={request}
      showUser={options.showUser}
      showKind={options.showKind}
      balanceNote={options.showUser ? getBalanceNote(request) : undefined}
      canReview={canReview(request)}
      canCancel={request.userId === userId && request.status === "pending"}
      canEditRecord={
        canRecord &&
        request.kind === "leave" &&
        Boolean(request.recordedById) &&
        request.status === "approved" &&
        access.coversDepartment(request.userRole)
      }
      onEditRecord={() => {
        if (request.kind !== "leave") return;
        setRecordEditing(request);
        setRecordOpen(true);
      }}
      onRemoveRecord={() => {
        if (request.kind === "leave") setRemoveRecordTarget(request);
      }}
      onApprove={() => setReviewTarget({ request, decision: "approved" })}
      onReject={() => {
        setRejectionReason("");
        setReviewTarget({ request, decision: "rejected" });
      }}
      onCancel={() => setCancelTarget(request)}
    />
  );

  const tabs: Array<{ key: TabKey; label: string; count?: number }> = [
    ...(isApprover
      ? [{ key: "approvals" as const, label: "Approvals", count: awaitingReview }]
      : []),
    { key: "calendar", label: "Calendar" },
    { key: "mine", label: "My Requests", count: myRequests.length },
    { key: "attendance", label: "Attendance" },
    ...(canRecord
      ? [{ key: "absences" as const, label: "Leave Records" }]
      : []),
    ...(isMainAdmin
      ? [{ key: "approvers" as const, label: "Approvers", count: approvers.length }]
      : []),
  ];

  const kindOptions = (kinds: RequestKind[], pool: EmployeeRequest[]) => [
    { value: "all" as KindFilter, label: "All", count: pool.length },
    ...kinds.map((kind) => ({
      value: kind as KindFilter,
      label: KIND_FILTER_LABELS[kind],
      count: countBy(pool, (request) => request.kind, kind),
    })),
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f9fc] px-4 py-6 text-slate-900 md:px-8 md:py-8">
      <div className="mx-auto space-y-7">
        {/* Header */}
        <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-emerald-100 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-blue-100 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                <ClipboardList className="h-3.5 w-3.5" />
                Requests & Leave
              </span>

              {/* Same names as the sidebar: "Employee Management" for the
                  main admin, approvers and record-only users (e.g. finance),
                  "Self Management" for everyone else. */}
              <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">
                {canRecord ? "Employee Management" : "Self Management"}
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 md:text-base">
                {isApprover
                  ? "Review leave, salary advance and document requests, record absences, see who is away, and make your own requests."
                  : canRecord
                    ? "Record absences and past leave, keep employees' leave records up to date, see who is away, and make your own requests."
                    : "Apply for leave, work from home, a salary advance or an HR letter, and track every request in one place."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 self-start lg:self-auto">
              {canRecord && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setRecordEditing(null);
                    setRecordInitialEmployee("");
                    setRecordOpen(true);
                  }}
                  className="h-12 gap-2 rounded-2xl border-slate-200 bg-white px-6 shadow-sm"
                >
                  <UserX className="h-4 w-4" />
                  Record Absence
                </Button>
              )}
              <Button
                onClick={() => setNewRequestOpen(true)}
                className="h-12 gap-2 rounded-2xl bg-slate-950 px-6 text-white shadow-sm hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                New Request
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {isApprover ? (
            <StatTile
              label="Awaiting your approval"
              value={awaitingReview}
              hint="Pending requests you can review"
              icon={<Inbox className="h-5 w-5" />}
              accent="bg-amber-50 text-amber-600"
            />
          ) : (
            <StatTile
              label="Pending requests"
              value={stats.myPending}
              hint="Waiting for an admin"
              icon={<Clock3 className="h-5 w-5" />}
              accent="bg-amber-50 text-amber-600"
            />
          )}
          <StatTile
            label={`Leave taken in ${currentYear}`}
            value={myRecordUpdated ? formatDays(myBalance.leaveTaken) : "—"}
            hint={
              myRecordUpdated
                ? "Your approved days off this year, absences included"
                : "Shown once Leadership has updated your previous leave"
            }
            icon={<Palmtree className="h-5 w-5" />}
            accent="bg-emerald-50 text-emerald-600"
          />
          <StatTile
            label="Next time off"
            value={
              stats.nextTimeOff
                ? formatDateValue(stats.nextTimeOff.startDate, "dd MMM")
                : "—"
            }
            hint={
              stats.nextTimeOff
                ? `${getLeaveType(stats.nextTimeOff.leaveType).label} · ${formatLeaveDuration(
                    stats.nextTimeOff,
                  )}`
                : "No upcoming approved leave"
            }
            icon={<CalendarDays className="h-5 w-5" />}
            accent="bg-blue-50 text-blue-600"
          />
          {canRecord ? (
            <StatTile
              label="Away today"
              value={stats.offToday}
              hint={`On approved leave · ${stats.remoteToday} working from home`}
              icon={<Sun className="h-5 w-5" />}
              accent="bg-violet-50 text-violet-600"
            />
          ) : (
            <StatTile
              label="Total requests"
              value={myRequests.length}
              hint="All your requests"
              icon={<ClipboardList className="h-5 w-5" />}
              accent="bg-violet-50 text-violet-600"
            />
          )}
        </div>

        {(statusesLoaded || myRecordUpdated) &&
          (myRecordUpdated ? (
            <LeaveBalancePanel balance={myBalance} />
          ) : (
            <div className="flex items-start gap-4 rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5 md:p-6">
              <div className="shrink-0 rounded-2xl bg-white p-3 text-amber-600 shadow-sm">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-amber-950">
                  Your leave balance isn't available yet
                </h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-amber-900">
                  To view your remaining leaves for this year, please update
                  Leadership with the dates of all your previous
                  leaves/absences; your leave balance will be updated on the
                  portal once the information is received and verified.
                </p>
              </div>
            </div>
          ))}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 rounded-[1.5rem] border border-white bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:inline-flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    activeTab === tab.key
                      ? "bg-white/15 text-white"
                      : tab.key === "approvals"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Approvals */}
        {activeTab === "approvals" && isApprover && (
          <div className="space-y-5">
            <div className="flex flex-col gap-3">
              {approvalPool.length > 0 && (
                <PillGroup
                  options={kindOptions(REQUEST_KIND_ORDER, approvalPool)}
                  value={approvalKindFilter}
                  onChange={setApprovalKindFilter}
                />
              )}

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <PillGroup
                  options={[
                    ...REQUEST_STATUS_ORDER.map((status) => ({
                      value: status as StatusFilter,
                      label: REQUEST_STATUS_STYLES[status].label,
                      count: countBy(
                        approvalPool.filter(
                          (request) =>
                            approvalKindFilter === "all" ||
                            request.kind === approvalKindFilter,
                        ),
                        (request) => request.status,
                        status,
                      ),
                    })),
                    { value: "all" as StatusFilter, label: "All" },
                  ]}
                  value={approvalStatusFilter}
                  onChange={setApprovalStatusFilter}
                />

                <div className="relative w-full lg:w-80">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={approvalSearch}
                    onChange={(event) => setApprovalSearch(event.target.value)}
                    placeholder="Search by name, type or reason"
                    className="h-11 rounded-2xl border-slate-200 bg-white pl-10 shadow-sm"
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="rounded-[1.5rem] bg-white p-10 text-center text-sm text-slate-500">
                Loading requests...
              </div>
            ) : approvalFiltered.length === 0 ? (
              <EmptyState
                title={
                  approvalStatusFilter === "pending"
                    ? "You're all caught up"
                    : "No requests found"
                }
                text={
                  approvalStatusFilter === "pending"
                    ? "There are no requests waiting for approval."
                    : "Try another filter or clear the search."
                }
              />
            ) : (
              <div className="space-y-4">
                {approvalFiltered.map((request) =>
                  renderCard(request, { showUser: true, showKind: true }),
                )}
              </div>
            )}
          </div>
        )}

        {/* Calendar */}
        {activeTab === "calendar" && (
          <LeaveCalendar
            requests={calendarRequests}
            showNames={canRecord && calendarScope === "everyone"}
            scopeToggle={
              canRecord ? (
                <div className="inline-flex rounded-2xl bg-slate-100 p-1">
                  {(["everyone", "mine"] as const).map((scope) => (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => setCalendarScope(scope)}
                      className={`rounded-xl px-3.5 py-1.5 text-sm font-semibold transition ${
                        calendarScope === scope
                          ? "bg-white text-slate-950 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {scope === "everyone" ? "Everyone" : "Only me"}
                    </button>
                  ))}
                </div>
              ) : undefined
            }
          />
        )}

        {/* Leave records: employees' update status and recorded entries */}
        {activeTab === "absences" && canRecord && (
          <div className="space-y-5">
            <PillGroup
              options={[
                { value: "employees" as const, label: "Employees" },
                {
                  value: "entries" as const,
                  label: "Recorded entries",
                  count: recordedAbsences.length,
                },
              ]}
              value={recordsView}
              onChange={setRecordsView}
            />

            {recordsView === "employees" ? (
              <LeaveRecordsPanel
                actor={actor}
                coversDepartment={access.coversDepartment}
                leaveRequests={leaveRequests}
                statuses={recordStatuses}
                year={currentYear}
                onRecord={(employeeId) => {
                  setRecordEditing(null);
                  setRecordInitialEmployee(employeeId);
                  setRecordOpen(true);
                }}
              />
            ) : (
              <>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <p className="text-sm text-slate-500">
                    Absences and past leave recorded by admins
                    {isMainAdmin ? "" : " in your departments"}. They're saved as
                    approved and count toward each employee's leave.
                  </p>
                  <div className="relative w-full lg:w-80">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={absenceSearch}
                      onChange={(event) => setAbsenceSearch(event.target.value)}
                      placeholder="Search by name, type or note"
                      className="h-11 rounded-2xl border-slate-200 bg-white pl-10 shadow-sm"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="rounded-[1.5rem] bg-white p-10 text-center text-sm text-slate-500">
                    Loading absences...
                  </div>
                ) : recordedAbsences.length === 0 ? (
                  <EmptyState
                    title="Nothing recorded yet"
                    text='Use "Record Absence" to mark someone absent or enter leave they already took.'
                  />
                ) : (
                  <div className="space-y-4">
                    {recordedAbsences.map((request) =>
                      renderCard(request, { showUser: true, showKind: false }),
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Attendance: own check-ins, or everyone's for the main admin,
            finance and financial admins */}
        {activeTab === "attendance" && (
          <AttendancePanel
            userId={userId}
            actor={actor}
            canManage={canManageAttendance(role)}
            leaveRequests={leaveRequests}
          />
        )}

        {/* Approvers (main admin) */}
        {activeTab === "approvers" && isMainAdmin && (
          <ApproverSettings approvers={approvers} actor={actor} />
        )}

        {/* My requests */}
        {activeTab === "mine" && (
          <div className="space-y-5">
            <PillGroup
              options={kindOptions(REQUEST_KIND_ORDER, myRequests)}
              value={myKindFilter}
              onChange={setMyKindFilter}
            />

            {loading ? (
              <div className="rounded-[1.5rem] bg-white p-10 text-center text-sm text-slate-500">
                Loading your requests...
              </div>
            ) : myFiltered.length === 0 ? (
              <EmptyState
                title="No requests yet"
                text='Use "New Request" to apply for leave, work from home, a salary advance or a document.'
              />
            ) : (
              <div className="space-y-4">
                {myFiltered.map((request) =>
                  renderCard(request, {
                    showUser: false,
                    showKind: myKindFilter === "all",
                  }),
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <NewRequestDialog
        open={newRequestOpen}
        onOpenChange={setNewRequestOpen}
        isMobile={isMobile}
        userId={userId}
        myLeave={myLeave}
        balanceVisible={myRecordUpdated}
        onSubmitLeave={async (input) => {
          await submitLeaveRequest(actor, input);
          requestSent();
        }}
        onSubmitAdvance={async (input) => {
          await submitAdvanceRequest(actor, input);
          requestSent();
        }}
        onSubmitDocument={async (input) => {
          await submitDocumentRequest(actor, input);
          requestSent();
        }}
      />

      {/* Approve / reject */}
      <Dialog
        open={reviewTarget !== null}
        onOpenChange={(open) => {
          if (!open) setReviewTarget(null);
        }}
      >
        <DialogContent className="max-w-lg rounded-[1.75rem] border-0 p-0 shadow-2xl">
          {reviewTarget && (
            <>
              <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold tracking-tight text-slate-950">
                    {reviewTarget.decision === "approved"
                      ? "Approve request"
                      : "Reject request"}
                  </DialogTitle>
                </DialogHeader>
                <p className="mt-1 text-sm text-slate-500">
                  {reviewTarget.request.userName} ·{" "}
                  {describeRequest(reviewTarget.request)}
                </p>
              </div>

              <div className="space-y-4 px-6 py-6">
                {reviewTarget.decision === "approved" ? (
                  <p className="text-sm leading-6 text-slate-600">
                    {reviewTarget.request.userName} will be notified that this
                    request has been approved.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <Label className={fieldLabelClass}>
                      Reason for rejection *
                    </Label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(event) =>
                        setRejectionReason(event.target.value)
                      }
                      placeholder="Let the employee know why"
                      className="min-h-[110px] rounded-2xl border-slate-200 bg-slate-50/80 shadow-none"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setReviewTarget(null)}
                    className="h-11 rounded-2xl border-slate-200 bg-white px-5"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={reviewing}
                    onClick={confirmReview}
                    className={`h-11 rounded-2xl px-6 text-white ${
                      reviewTarget.decision === "approved"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-rose-600 hover:bg-rose-700"
                    }`}
                  >
                    {reviewing
                      ? "Saving..."
                      : reviewTarget.decision === "approved"
                        ? "Approve"
                        : "Reject"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {canRecord && (
        <RecordLeaveDialog
          open={recordOpen}
          onOpenChange={(open) => {
            setRecordOpen(open);
            if (!open) setRecordEditing(null);
          }}
          isMobile={isMobile}
          recorderId={userId}
          allowSelf={isMainAdmin}
          coversDepartment={access.coversDepartment}
          leaveRequests={leaveRequests}
          recordStatuses={recordStatuses}
          editing={recordEditing}
          initialEmployeeId={recordInitialEmployee}
          onRecord={async (employee, input, markRecordUpdated) => {
            await recordLeave(actor, employee, input);
            if (markRecordUpdated) {
              await setLeaveRecordUpdated(employee, actor, true);
            }
            toast({
              title: "Recorded",
              description: `${getLeaveType(input.leaveType).label} recorded for ${employee.name}.${
                markRecordUpdated
                  ? " Their leave record is marked as updated, so they can now see their remaining leave."
                  : ""
              }`,
            });
          }}
          onUpdate={async (request, input) => {
            await updateRecordedLeave(request, actor, input);
            toast({ title: "Recorded entry updated" });
          }}
        />
      )}

      <AlertDialog
        open={removeRecordTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveRecordTarget(null);
        }}
      >
        <AlertDialogContent className="rounded-[1.75rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this recorded entry?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeRecordTarget &&
                `${removeRecordTarget.userName}'s ${getLeaveType(
                  removeRecordTarget.leaveType,
                ).label.toLowerCase()} on ${formatDateRange(
                  removeRecordTarget,
                )} will no longer count toward their leave.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">Keep</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveRecord}
              className="rounded-2xl bg-rose-600 hover:bg-rose-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel own request */}
      <AlertDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
      >
        <AlertDialogContent className="rounded-[1.75rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this request?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelTarget &&
                `Your ${describeRequest(
                  cancelTarget,
                )} will be withdrawn and can no longer be approved.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              className="rounded-2xl bg-rose-600 hover:bg-rose-700"
            >
              Cancel request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
