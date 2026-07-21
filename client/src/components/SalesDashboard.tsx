import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import {
  AlertTriangle,
  ArrowDownUp,
  BriefcaseBusiness,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Eye,
  Filter,
  Search,
  Target,
  Users,
  X,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { SalesRecord } from "@shared/schema";
import { mapSalesRecordForBackwardCompatibility } from "@shared/schema";

type ProjectStatus =
  | "Lead"
  | "Discussion"
  | "Negotiation"
  | "Won"
  | "Lost"
  | "Invoiced"
  | "Payment Received";

type StatusFilter = "All" | ProjectStatus;
type DeadlineFilter = "All" | "Overdue" | "Next 7 Days" | "No Deadline";
type SortOption = "newest" | "deadline" | "progress" | "highestValue";

type TeamMember = {
  name: string;
  role: string;
};

type SalesAccessPermissions = {
  canViewRecord: boolean;
  isOwner: boolean;
  isSupervisor: boolean;
  isCustodian: boolean;
  isAssignedAdmin: boolean;
};

type DashboardProject = SalesRecord & {
  id: string;
};

const PANEL_ID = "IEDGE-SYSTEM";
const PAGE_SIZE = 10;

const STATUS_OPTIONS: StatusFilter[] = [
  "All",
  "Lead",
  "Discussion",
  "Negotiation",
  "Won",
  "Lost",
  "Invoiced",
  "Payment Received",
];

const DEADLINE_OPTIONS: DeadlineFilter[] = [
  "All",
  "Overdue",
  "Next 7 Days",
  "No Deadline",
];

function normalizeRole(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function toNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.min(maximum, Math.max(minimum, value));
}

function getDateFromValue(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date) return value;

  if (typeof value === "object") {
    const timestamp = value as {
      toDate?: () => Date;
      seconds?: number;
    };

    if (typeof timestamp.toDate === "function") {
      return timestamp.toDate();
    }

    if (typeof timestamp.seconds === "number") {
      return new Date(timestamp.seconds * 1000);
    }
  }

  if (typeof value === "number") {
    if (value < 100000000000) return null;

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    const looksLikeDate =
      /^\d{4}-\d{1,2}-\d{1,2}/.test(trimmed) ||
      /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/.test(trimmed) ||
      trimmed.includes("T");

    if (!looksLikeDate) return null;

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function formatDate(value: unknown, fallback = "Not set") {
  const date = getDateFromValue(value);

  if (!date) return fallback;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: unknown, fallback = "Not available") {
  const date = getDateFromValue(value);

  if (!date) return fallback;

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value: unknown) {
  return `₨ ${Math.round(toNumber(value)).toLocaleString()}`;
}

function getProjectOwnerName(record: any) {
  return String(
    record?.salesPersonName ||
      record?.projectOwnerName ||
      record?.ownerName ||
      record?.assignedToName ||
      record?.createdByName ||
      "",
  ).trim();
}

function getProjectDescription(record: any) {
  return String(
    record?.projectDescription ||
      record?.description ||
      record?.scopeOfWork ||
      record?.remarks ||
      record?.notes ||
      "No project description has been added yet.",
  ).trim();
}

function getProjectStatus(record: any): ProjectStatus {
  const rawStatus = String(
    record?.projectStatus ||
      record?.status ||
      record?.currentStatus ||
      record?.pipelineStatus ||
      record?.salesStatus ||
      "",
  )
    .trim()
    .toLowerCase();

  const paymentStatus = String(record?.paymentStatus || "")
    .trim()
    .toLowerCase();

  if (
    rawStatus.includes("payment received") ||
    rawStatus === "paid" ||
    paymentStatus.includes("paid") ||
    paymentStatus.includes("received")
  ) {
    return "Payment Received";
  }

  if (
    rawStatus.includes("invoice") ||
    rawStatus.includes("invoiced") ||
    record?.invoiceNo ||
    record?.invoiceNumber
  ) {
    return "Invoiced";
  }

  if (
    rawStatus.includes("lost") ||
    rawStatus.includes("rejected") ||
    rawStatus.includes("cancelled") ||
    rawStatus.includes("canceled")
  ) {
    return "Lost";
  }

  if (
    rawStatus.includes("won") ||
    rawStatus.includes("approved") ||
    rawStatus.includes("complete") ||
    rawStatus.includes("completed") ||
    rawStatus.includes("closed") ||
    toNumber(record?.wonValue) > 0
  ) {
    return "Won";
  }

  if (
    rawStatus.includes("negotiation") ||
    rawStatus.includes("review") ||
    rawStatus.includes("pending") ||
    rawStatus.includes("approval")
  ) {
    return "Negotiation";
  }

  if (
    rawStatus.includes("discussion") ||
    rawStatus.includes("progress") ||
    rawStatus.includes("active") ||
    rawStatus.includes("working") ||
    rawStatus.includes("ongoing")
  ) {
    return "Discussion";
  }

  return "Lead";
}

function getProjectStartDate(record: any) {
  return (
    record?.projectStartDate ||
    record?.startDate ||
    record?.projectDate ||
    record?.eventDate ||
    record?.createdAt
  );
}

function getProjectDeadline(record: any) {
  return (
    record?.deadline ||
    record?.projectDeadline ||
    record?.dueDate ||
    record?.endDate ||
    record?.completionDate ||
    record?.nextFollowUp ||
    record?.nextFollowUpDate ||
    record?.followUpDate
  );
}

function getProjectLastActivity(record: any) {
  return (
    record?.updatedAt ||
    record?.latestAdminRemarkAt ||
    record?.lastCommentAt ||
    record?.createdAt
  );
}

function getRecordTimestamp(record: any) {
  const date = getDateFromValue(getProjectLastActivity(record));
  return date?.getTime() || 0;
}

function getProjectProgress(record: any) {
  const explicitProgress = [
    record?.progress,
    record?.progressPercent,
    record?.progressPercentage,
    record?.completionPercentage,
    record?.projectProgress,
  ].find((value) => value !== undefined && value !== null && value !== "");

  if (explicitProgress !== undefined) {
    return clamp(toNumber(explicitProgress));
  }

  switch (getProjectStatus(record)) {
    case "Payment Received":
      return 100;
    case "Invoiced":
      return 90;
    case "Won":
      return 80;
    case "Negotiation":
      return 60;
    case "Discussion":
      return 35;
    case "Lost":
      return 100;
    default:
      return 15;
  }
}

function isClosedStatus(status: ProjectStatus) {
  return status === "Payment Received" || status === "Lost";
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getDaysFromToday(value: unknown) {
  const date = getDateFromValue(value);
  if (!date) return null;

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  return Math.ceil(
    (target.getTime() - startOfToday().getTime()) / (1000 * 60 * 60 * 24),
  );
}

function isProjectOverdue(record: any) {
  const deadline = getProjectDeadline(record);
  const days = getDaysFromToday(deadline);
  const status = getProjectStatus(record);

  return days !== null && days < 0 && !isClosedStatus(status);
}

function getDeadlineLabel(record: any) {
  const deadline = getProjectDeadline(record);
  const days = getDaysFromToday(deadline);

  if (days === null) return "No deadline";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days > 1) return `${days} days left`;
  if (days === -1) return "1 day overdue";
  return `${Math.abs(days)} days overdue`;
}

function getInitials(value: unknown) {
  const text = String(value || "Project").trim();
  const words = text.split(/\s+/).filter(Boolean);

  if (!words.length) return "PR";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function getNameList(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) => getNameList(item));
  }

  if (typeof value === "object") {
    const item = value as Record<string, unknown>;
    const name =
      item.name ||
      item.displayName ||
      item.fullName ||
      item.userName ||
      item.email;

    return name ? [String(name).trim()] : [];
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getTeamMembers(record: any): TeamMember[] {
  const members: TeamMember[] = [];

  const addMembers = (value: unknown, role: string) => {
    getNameList(value).forEach((name) => {
      if (!name) return;

      const alreadyAdded = members.some(
        (member) => member.name.toLowerCase() === name.toLowerCase(),
      );

      if (!alreadyAdded) {
        members.push({ name, role });
      }
    });
  };

  addMembers(
    record?.salesPersonName ||
      record?.projectOwnerName ||
      record?.ownerName ||
      record?.assignedToName,
    "Project Owner",
  );

  addMembers(record?.assignedAdminName, "Assigned Admin");
  addMembers(
    record?.supervisorNames ||
      record?.supervisorsNames ||
      record?.projectSupervisorNames,
    "Supervisor",
  );
  addMembers(
    record?.projectCustodianNames ||
      record?.custodianNames ||
      record?.projectCustodiansNames,
    "Custodian",
  );
  addMembers(record?.adminParticipantNames, "Admin Participant");
  addMembers(record?.teamMembers || record?.assignedTeamMembers, "Team Member");

  if (!members.length) {
    const fallbackOwner = getProjectOwnerName(record);
    if (fallbackOwner) {
      members.push({ name: fallbackOwner, role: "Project Owner" });
    }
  }

  return members;
}

function getSalesRecordPermissions(
  record: any,
  currentUserId: string,
): SalesAccessPermissions {
  const projectCustodians = normalizeStringArray(record?.projectCustodians);
  const supervisors = normalizeStringArray(record?.supervisors);
  const adminParticipantIds = normalizeStringArray(record?.adminParticipantIds);
  const canViewUserIds = normalizeStringArray(
    record?.canViewUserIds?.length
      ? record?.canViewUserIds
      : record?.accessUserIds,
  );

  const isOwner = String(record?.salesPersonId || "") === currentUserId;
  const isSupervisor = supervisors.includes(currentUserId);
  const isCustodian = projectCustodians.includes(currentUserId);
  const isAssignedAdmin =
    String(record?.assignedAdminId || "") === currentUserId ||
    adminParticipantIds.includes(currentUserId);

  const canViewRecord =
    isOwner ||
    isSupervisor ||
    isCustodian ||
    isAssignedAdmin ||
    canViewUserIds.includes(currentUserId);

  return {
    canViewRecord,
    isOwner,
    isSupervisor,
    isCustodian,
    isAssignedAdmin,
  };
}

function getStatusClasses(status: ProjectStatus) {
  switch (status) {
    case "Payment Received":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "Invoiced":
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
    case "Won":
      return "bg-green-50 text-green-700 ring-1 ring-green-200";
    case "Lost":
      return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
    case "Negotiation":
      return "bg-orange-50 text-orange-700 ring-1 ring-orange-200";
    case "Discussion":
      return "bg-teal-50 text-teal-700 ring-1 ring-teal-200";
    default:
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  }
}

function getProgressBarClasses(record: any) {
  if (isProjectOverdue(record)) return "bg-rose-500";

  switch (getProjectStatus(record)) {
    case "Payment Received":
      return "bg-emerald-500";
    case "Invoiced":
      return "bg-blue-500";
    case "Won":
      return "bg-green-500";
    case "Lost":
      return "bg-rose-500";
    case "Negotiation":
      return "bg-orange-500";
    case "Discussion":
      return "bg-teal-500";
    default:
      return "bg-amber-500";
  }
}

function getCommentItems(record: any) {
  const rawComments = Array.isArray(record?.comments) ? record.comments : [];

  return rawComments
    .map((comment: any, index: number) => {
      if (typeof comment === "string") {
        return {
          id: `comment-${index}`,
          text: comment,
          userName: "Unknown User",
          timestamp: null,
        };
      }

      if (!comment || typeof comment !== "object") return null;

      const text = String(
        comment?.text ||
          comment?.comment ||
          comment?.message ||
          comment?.remark ||
          "",
      ).trim();

      if (!text) return null;

      return {
        id: `comment-${index}`,
        text,
        userName: String(
          comment?.userName ||
            comment?.createdByName ||
            comment?.authorName ||
            "Unknown User",
        ),
        timestamp:
          comment?.timestamp ||
          comment?.createdAt ||
          comment?.updatedAt ||
          null,
      };
    })
    .filter(Boolean)
    .sort((first: any, second: any) => {
      const firstTime = getDateFromValue(first.timestamp)?.getTime() || 0;
      const secondTime = getDateFromValue(second.timestamp)?.getTime() || 0;
      return secondTime - firstTime;
    });
}

function formatFieldLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatUnknownValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Not set";

  const date = getDateFromValue(value);
  if (date) return formatDateTime(date);

  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (Array.isArray(value)) {
    if (!value.length) return "Not set";

    return value
      .map((item) => {
        if (typeof item === "object") {
          return getNameList(item)[0] || JSON.stringify(item);
        }

        return String(item);
      })
      .join(", ");
  }

  if (typeof value === "object") {
    const names = getNameList(value);
    if (names.length) return names.join(", ");

    try {
      return JSON.stringify(value);
    } catch {
      return "Additional data";
    }
  }

  return String(value);
}

function getAdditionalProjectDetails(record: any) {
  const hiddenKeys = new Set([
    "id",
    "projectName",
    "projectCode",
    "client",
    "projectDescription",
    "description",
    "scopeOfWork",
    "remarks",
    "notes",
    "projectStatus",
    "status",
    "currentStatus",
    "pipelineStatus",
    "salesStatus",
    "progress",
    "progressPercent",
    "progressPercentage",
    "completionPercentage",
    "projectProgress",
    "salesPersonName",
    "projectOwnerName",
    "ownerName",
    "assignedToName",
    "assignedAdminName",
    "supervisorNames",
    "supervisorsNames",
    "projectSupervisorNames",
    "projectCustodianNames",
    "custodianNames",
    "projectCustodiansNames",
    "adminParticipantNames",
    "teamMembers",
    "assignedTeamMembers",
    "comments",
    "createdAt",
    "updatedAt",
    "projectStartDate",
    "startDate",
    "projectDate",
    "eventDate",
    "deadline",
    "projectDeadline",
    "dueDate",
    "endDate",
    "completionDate",
    "nextFollowUp",
    "nextFollowUpDate",
    "followUpDate",
    "canViewUserIds",
    "accessUserIds",
    "canEditUserIds",
    "canManageMeetingUserIds",
    "canCreateEstimateUserIds",
    "canCommentUserIds",
    "projectCustodians",
    "supervisors",
    "adminParticipantIds",
  ]);

  return Object.entries(record || {})
    .filter(([key, value]) => {
      if (hiddenKeys.has(key)) return false;
      if (value === undefined || value === null || value === "") return false;
      if (Array.isArray(value) && !value.length) return false;
      return true;
    })
    .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey));
}

function MetricCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        {description}
      </p>
    </div>
  );
}

function ProjectDetailModal({
  project,
  onClose,
}: {
  project: DashboardProject;
  onClose: () => void;
}) {
  const status = getProjectStatus(project);
  const progress = getProjectProgress(project);
  const teamMembers = getTeamMembers(project);
  const comments = getCommentItems(project);
  const additionalDetails = getAdditionalProjectDetails(project);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClasses(
                  status,
                )}`}
              >
                {status}
              </span>

              {isProjectOverdue(project) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 ring-1 ring-rose-200">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Overdue
                </span>
              )}
            </div>

            <h2 className="mt-3 truncate text-2xl font-bold text-slate-950">
              {project?.projectName || "Untitled Project"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {project?.projectCode || "No project code"} · {project?.client || "No client"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-950"
            aria-label="Close project details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(92vh-105px)] overflow-y-auto bg-slate-50/70 p-6">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Project Progress
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Uses the saved percentage when available; otherwise it is
                      estimated from the current status.
                    </p>
                  </div>

                  <p className="text-3xl font-bold text-slate-950">{progress}%</p>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${getProgressBarClasses(
                      project,
                    )}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-bold text-slate-950">
                  Project Description
                </h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {getProjectDescription(project)}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-bold text-slate-950">
                    Project Team
                  </h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {teamMembers.length} member(s)
                  </span>
                </div>

                {teamMembers.length > 0 ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {teamMembers.map((member) => (
                      <div
                        key={`${member.name}-${member.role}`}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                          {getInitials(member.name)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {member.name}
                          </p>
                          <p className="text-xs text-slate-500">{member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    No team member names are saved on this project.
                  </p>
                )}
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-bold text-slate-950">
                    Project Comments
                  </h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {comments.length}
                  </span>
                </div>

                {comments.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {comments.map((comment: any) => (
                      <div
                        key={comment.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {comment.userName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDateTime(comment.timestamp, "No date")}
                          </p>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          {comment.text}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    No project comments have been added yet.
                  </p>
                )}
              </div>

              {additionalDetails.length > 0 && (
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-base font-bold text-slate-950">
                    Additional Project Information
                  </h3>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {additionalDetails.map(([key, value]) => (
                      <div
                        key={key}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          {formatFieldLabel(key)}
                        </p>
                        <p className="mt-1 break-words text-sm font-medium text-slate-800">
                          {formatUnknownValue(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-bold text-slate-950">Timeline</h3>

                <div className="mt-4 space-y-4">
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <CalendarDays className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Started
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatDate(getProjectStartDate(project))}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <CalendarClock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Deadline
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatDate(getProjectDeadline(project))}
                      </p>
                      <p
                        className={`mt-1 text-xs font-semibold ${
                          isProjectOverdue(project)
                            ? "text-rose-600"
                            : "text-slate-500"
                        }`}
                      >
                        {getDeadlineLabel(project)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <Clock3 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Last Activity
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatDateTime(getProjectLastActivity(project))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-bold text-slate-950">
                  Financial Summary
                </h3>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="text-sm text-slate-500">Projected Value</span>
                    <span className="text-sm font-bold text-slate-950">
                      {formatCurrency(project?.projectedValue)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="text-sm text-slate-500">Won Value</span>
                    <span className="text-sm font-bold text-slate-950">
                      {formatCurrency((project as any)?.wonValue)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="text-sm text-slate-500">Estimate Amount</span>
                    <span className="text-sm font-bold text-slate-950">
                      {formatCurrency(
                        (project as any)?.estimateAmount ||
                          (project as any)?.estimateValue ||
                          (project as any)?.quotedAmount,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-bold text-slate-950">
                  Record Information
                </h3>

                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Record ID
                    </p>
                    <p className="mt-1 break-all font-medium text-slate-800">
                      {project.id}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Created At
                    </p>
                    <p className="mt-1 font-medium text-slate-800">
                      {formatDateTime((project as any)?.createdAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Updated At
                    </p>
                    <p className="mt-1 font-medium text-slate-800">
                      {formatDateTime((project as any)?.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SalesDashboard2() {
  const { userProfile, currentUser } = useAuth();

  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [teamFilter, setTeamFilter] = useState("All");
  const [deadlineFilter, setDeadlineFilter] =
    useState<DeadlineFilter>("All");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProject, setSelectedProject] =
    useState<DashboardProject | null>(null);

  const actorId = currentUser?.uid || userProfile?.id || "";
  const role = normalizeRole(userProfile?.role);
  const department = normalizeRole((userProfile as any)?.department);
  const canViewAllProjects =
    role.includes("admin") ||
    role === "management" ||
    department.includes("management");

  useEffect(() => {
    if (!userProfile && !currentUser) return;

    setLoading(true);
    setLoadError("");

    const salesRecordsQuery = query(
      collection(db, "Panels", PANEL_ID, "salesRecords"),
      orderBy("updatedAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      salesRecordsQuery,
      (snapshot) => {
        const mappedProjects = snapshot.docs.map((document) => {
          const rawData = { id: document.id, ...document.data() };
          return mapSalesRecordForBackwardCompatibility(
            rawData,
          ) as DashboardProject;
        });

        const visibleProjects = canViewAllProjects
          ? mappedProjects
          : mappedProjects.filter((project) => {
              if (!actorId) return false;
              return getSalesRecordPermissions(project, actorId).canViewRecord;
            });

        setProjects(visibleProjects);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to load sales dashboard:", error);
        setLoadError(
          "The sales dashboard could not read project records. Please check Firestore permissions for Panels / IEDGE-SYSTEM / salesRecords.",
        );
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [userProfile, currentUser, actorId, canViewAllProjects]);

  const statusCounts = useMemo(() => {
    const counts: Record<ProjectStatus, number> = {
      Lead: 0,
      Discussion: 0,
      Negotiation: 0,
      Won: 0,
      Lost: 0,
      Invoiced: 0,
      "Payment Received": 0,
    };

    projects.forEach((project) => {
      counts[getProjectStatus(project)] += 1;
    });

    return counts;
  }, [projects]);

  const teamMemberNames = useMemo(() => {
    const names = new Set<string>();

    projects.forEach((project) => {
      getTeamMembers(project).forEach((member) => names.add(member.name));
    });

    return Array.from(names).sort((first, second) =>
      first.localeCompare(second),
    );
  }, [projects]);

  const teamWorkload = useMemo(() => {
    const workload = new Map<
      string,
      { name: string; projects: number; active: number; overdue: number }
    >();

    projects.forEach((project) => {
      const status = getProjectStatus(project);
      const projectMembers = getTeamMembers(project);

      projectMembers.forEach((member) => {
        const current = workload.get(member.name) || {
          name: member.name,
          projects: 0,
          active: 0,
          overdue: 0,
        };

        current.projects += 1;
        if (!isClosedStatus(status)) current.active += 1;
        if (isProjectOverdue(project)) current.overdue += 1;

        workload.set(member.name, current);
      });
    });

    return Array.from(workload.values())
      .sort((first, second) => {
        if (second.projects !== first.projects) {
          return second.projects - first.projects;
        }
        return first.name.localeCompare(second.name);
      })
      .slice(0, 8);
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    const nextProjects = projects.filter((project: any) => {
      const status = getProjectStatus(project);
      const teamMembers = getTeamMembers(project);
      const deadline = getProjectDeadline(project);
      const daysUntilDeadline = getDaysFromToday(deadline);

      const searchableText = [
        project?.projectCode,
        project?.projectName,
        project?.client,
        getProjectDescription(project),
        getProjectOwnerName(project),
        status,
        ...teamMembers.map((member) => member.name),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !search || searchableText.includes(search);
      const matchesStatus = statusFilter === "All" || status === statusFilter;
      const matchesTeam =
        teamFilter === "All" ||
        teamMembers.some((member) => member.name === teamFilter);

      const matchesDeadline =
        deadlineFilter === "All" ||
        (deadlineFilter === "Overdue" && isProjectOverdue(project)) ||
        (deadlineFilter === "Next 7 Days" &&
          daysUntilDeadline !== null &&
          daysUntilDeadline >= 0 &&
          daysUntilDeadline <= 7 &&
          !isClosedStatus(status)) ||
        (deadlineFilter === "No Deadline" && !getDateFromValue(deadline));

      return matchesSearch && matchesStatus && matchesTeam && matchesDeadline;
    });

    nextProjects.sort((first: any, second: any) => {
      if (sortBy === "deadline") {
        const firstDeadline =
          getDateFromValue(getProjectDeadline(first))?.getTime() ||
          Number.MAX_SAFE_INTEGER;
        const secondDeadline =
          getDateFromValue(getProjectDeadline(second))?.getTime() ||
          Number.MAX_SAFE_INTEGER;

        return firstDeadline - secondDeadline;
      }

      if (sortBy === "progress") {
        return getProjectProgress(second) - getProjectProgress(first);
      }

      if (sortBy === "highestValue") {
        return toNumber(second?.projectedValue) - toNumber(first?.projectedValue);
      }

      return getRecordTimestamp(second) - getRecordTimestamp(first);
    });

    return nextProjects;
  }, [
    projects,
    searchTerm,
    statusFilter,
    teamFilter,
    deadlineFilter,
    sortBy,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProjects.length / PAGE_SIZE),
  );

  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredProjects.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredProjects, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, teamFilter, deadlineFilter, sortBy]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const summary = useMemo(() => {
    const active = projects.filter(
      (project) => !isClosedStatus(getProjectStatus(project)),
    ).length;

    const completed = projects.filter(
      (project) => getProjectStatus(project) === "Payment Received",
    ).length;

    const overdue = projects.filter(isProjectOverdue).length;

    const averageProgress = projects.length
      ? Math.round(
          projects.reduce(
            (total, project) => total + getProjectProgress(project),
            0,
          ) / projects.length,
        )
      : 0;

    const totalPipelineValue = projects.reduce(
      (total, project: any) => total + toNumber(project?.projectedValue),
      0,
    );

    return {
      active,
      completed,
      overdue,
      averageProgress,
      totalPipelineValue,
    };
  }, [projects]);

  const upcomingDeadlines = useMemo(() => {
    return projects
      .filter((project) => {
        const deadline = getProjectDeadline(project);
        return (
          getDateFromValue(deadline) &&
          !isClosedStatus(getProjectStatus(project))
        );
      })
      .sort((first, second) => {
        const firstDate =
          getDateFromValue(getProjectDeadline(first))?.getTime() || 0;
        const secondDate =
          getDateFromValue(getProjectDeadline(second))?.getTime() || 0;
        return firstDate - secondDate;
      })
      .slice(0, 6);
  }, [projects]);

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setTeamFilter("All");
    setDeadlineFilter("All");
    setSortBy("newest");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white px-10 py-8 text-center shadow-sm">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-slate-200 border-t-orange-600" />
          <p className="mt-4 text-sm font-semibold text-slate-600">
            Loading live sales projects...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-orange-600">
                <Target className="h-4 w-4" />
                Live Sales Operations
              </div>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Sales Project Dashboard
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                View every accessible sales project, assigned team members,
                start dates, deadlines, current status, progress, values, and
                supporting project information in one place.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">
                {projects.length} live record(s)
              </span>
              <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                Real-time Firestore updates
              </span>
            </div>
          </div>
        </div>

        {loadError && (
          <div className="flex items-start gap-3 rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4 text-rose-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm font-medium leading-6">{loadError}</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            title="Total Projects"
            value={projects.length}
            description="All sales projects currently visible to your account."
            icon={<BriefcaseBusiness className="h-5 w-5" />}
          />
          <MetricCard
            title="Active Projects"
            value={summary.active}
            description="Projects still moving through the sales and delivery process."
            icon={<Clock3 className="h-5 w-5" />}
          />
          <MetricCard
            title="Completed"
            value={summary.completed}
            description="Projects where payment has been received."
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
          <MetricCard
            title="Overdue"
            value={summary.overdue}
            description="Open projects whose saved deadline has passed."
            icon={<AlertTriangle className="h-5 w-5" />}
          />
          <MetricCard
            title="Average Progress"
            value={`${summary.averageProgress}%`}
            description={`Current pipeline value: ${formatCurrency(
              summary.totalPipelineValue,
            )}`}
            icon={<CircleDollarSign className="h-5 w-5" />}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Pipeline Overview
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Click a status to filter the project list.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStatusFilter("All")}
                className="self-start rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Clear status
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {STATUS_OPTIONS.filter(
                (status): status is ProjectStatus => status !== "All",
              ).map((status) => {
                const count = statusCounts[status];
                const percentage = projects.length
                  ? Math.round((count / projects.length) * 100)
                  : 0;

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                      statusFilter === status
                        ? "border-orange-300 bg-orange-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800">
                        {status}
                      </p>
                      <span className="text-lg font-bold text-slate-950">
                        {count}
                      </span>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-slate-900"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      {percentage}% of visible projects
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Upcoming Deadlines
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Nearest open-project deadlines.
                </p>
              </div>
              <CalendarClock className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-4 space-y-3">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setSelectedProject(project)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-orange-200 hover:bg-orange-50"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        isProjectOverdue(project)
                          ? "bg-rose-100 text-rose-700"
                          : "bg-white text-slate-700"
                      }`}
                    >
                      <CalendarDays className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {(project as any)?.projectName || "Untitled Project"}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatDate(getProjectDeadline(project))}
                      </p>
                    </div>

                    <span
                      className={`text-xs font-bold ${
                        isProjectOverdue(project)
                          ? "text-rose-600"
                          : "text-slate-500"
                      }`}
                    >
                      {getDeadlineLabel(project)}
                    </span>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    No upcoming deadlines
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Add a deadline to project records to display them here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Team Workload
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Project allocation across owners, admins, supervisors,
                custodians, and saved team members.
              </p>
            </div>

            {teamFilter !== "All" && (
              <button
                type="button"
                onClick={() => setTeamFilter("All")}
                className="self-start rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Clear team filter
              </button>
            )}
          </div>

          {teamWorkload.length > 0 ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {teamWorkload.map((member) => (
                <button
                  key={member.name}
                  type="button"
                  onClick={() => setTeamFilter(member.name)}
                  className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                    teamFilter === member.name
                      ? "border-orange-300 bg-orange-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                      {getInitials(member.name)}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {member.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {member.projects} assigned project(s)
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-white px-3 py-2">
                      <p className="text-xs text-slate-400">Active</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {member.active}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white px-3 py-2">
                      <p className="text-xs text-slate-400">Overdue</p>
                      <p
                        className={`mt-1 text-lg font-bold ${
                          member.overdue > 0
                            ? "text-rose-600"
                            : "text-slate-900"
                        }`}
                      >
                        {member.overdue}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <Users className="mx-auto h-7 w-7 text-slate-400" />
              <p className="mt-3 text-sm font-semibold text-slate-700">
                No team assignments found
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Save owner or team-member names in the sales records to show
                workload here.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                All Project Details
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Search and filter projects, then open any row for complete
                details.
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
              <div className="relative min-w-0 md:min-w-[300px]">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search project, code, client, or team member..."
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <div className="relative">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as StatusFilter)
                  }
                  className="h-11 rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status === "All" ? "All Statuses" : status}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={teamFilter}
                onChange={(event) => setTeamFilter(event.target.value)}
                className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              >
                <option value="All">All Team Members</option>
                {teamMemberNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={deadlineFilter}
                onChange={(event) =>
                  setDeadlineFilter(event.target.value as DeadlineFilter)
                }
                className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              >
                {DEADLINE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option === "All" ? "All Deadlines" : option}
                  </option>
                ))}
              </select>

              <div className="relative">
                <ArrowDownUp className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value as SortOption)
                  }
                  className="h-11 rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                >
                  <option value="newest">Newest Activity</option>
                  <option value="deadline">Nearest Deadline</option>
                  <option value="progress">Highest Progress</option>
                  <option value="highestValue">Highest Value</option>
                </select>
              </div>

              <button
                type="button"
                onClick={resetFilters}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-900">
                {paginatedProjects.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-900">
                {filteredProjects.length}
              </span>{" "}
              matching project(s)
            </p>

            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((page) => Math.max(1, page - 1))
                }
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="px-3 text-sm font-semibold text-slate-700">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {paginatedProjects.length > 0 ? (
            <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
              <div className="min-w-[1540px]">
                <div className="grid grid-cols-[120px_260px_170px_220px_130px_150px_140px_210px_150px_100px] border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <div>Code</div>
                  <div>Project</div>
                  <div>Client</div>
                  <div>Assigned Team</div>
                  <div>Started</div>
                  <div>Deadline</div>
                  <div>Status</div>
                  <div>Progress</div>
                  <div>Projected Value</div>
                  <div className="text-center">Action</div>
                </div>

                <div className="divide-y divide-slate-100">
                  {paginatedProjects.map((project: any) => {
                    const status = getProjectStatus(project);
                    const progress = getProjectProgress(project);
                    const teamMembers = getTeamMembers(project);
                    const displayedMembers = teamMembers.slice(0, 3);
                    const remainingMembers = Math.max(
                      0,
                      teamMembers.length - displayedMembers.length,
                    );

                    return (
                      <div
                        key={project.id}
                        className="grid grid-cols-[120px_260px_170px_220px_130px_150px_140px_210px_150px_100px] items-center px-4 py-4 text-sm text-slate-700 transition hover:bg-slate-50"
                      >
                        <div className="pr-4 font-bold text-slate-900">
                          {project?.projectCode || "No code"}
                        </div>

                        <div className="pr-4">
                          <p className="line-clamp-1 font-bold text-slate-950">
                            {project?.projectName || "Untitled Project"}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                            {getProjectDescription(project)}
                          </p>
                        </div>

                        <div className="pr-4">
                          <p className="line-clamp-2 font-medium">
                            {project?.client || "No client"}
                          </p>
                        </div>

                        <div className="pr-4">
                          {displayedMembers.length > 0 ? (
                            <div className="space-y-2">
                              {displayedMembers.map((member) => (
                                <div
                                  key={`${project.id}-${member.name}-${member.role}`}
                                  className="flex items-center gap-2"
                                >
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-700">
                                    {getInitials(member.name)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-semibold text-slate-800">
                                      {member.name}
                                    </p>
                                    <p className="truncate text-[10px] text-slate-400">
                                      {member.role}
                                    </p>
                                  </div>
                                </div>
                              ))}

                              {remainingMembers > 0 && (
                                <p className="text-xs font-semibold text-slate-500">
                                  +{remainingMembers} more
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Not assigned
                            </span>
                          )}
                        </div>

                        <div className="pr-4 text-xs font-medium text-slate-600">
                          {formatDate(getProjectStartDate(project))}
                        </div>

                        <div className="pr-4">
                          <p
                            className={`text-xs font-bold ${
                              isProjectOverdue(project)
                                ? "text-rose-600"
                                : "text-slate-700"
                            }`}
                          >
                            {formatDate(getProjectDeadline(project))}
                          </p>
                          <p
                            className={`mt-1 text-[10px] font-semibold ${
                              isProjectOverdue(project)
                                ? "text-rose-500"
                                : "text-slate-400"
                            }`}
                          >
                            {getDeadlineLabel(project)}
                          </p>
                        </div>

                        <div className="pr-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${getStatusClasses(
                              status,
                            )}`}
                          >
                            {status}
                          </span>
                        </div>

                        <div className="pr-5">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-bold text-slate-700">
                              {progress}%
                            </span>
                            {isProjectOverdue(project) && (
                              <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                            )}
                          </div>

                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${getProgressBarClasses(
                                project,
                              )}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="pr-4 font-bold text-slate-900">
                          {formatCurrency(project?.projectedValue)}
                        </div>

                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => setSelectedProject(project)}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-orange-600"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
              <Search className="mx-auto h-8 w-8 text-slate-400" />
              <h3 className="mt-4 text-lg font-bold text-slate-900">
                No projects found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                No project matches the current search and filters.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
              >
                Reset Filters
              </button>
            </div>
          )}

          {filteredProjects.length > PAGE_SIZE && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((page) => Math.max(1, page - 1))
                }
                className="flex h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .filter(
                  (page) =>
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1,
                )
                .map((page, index, visiblePages) => {
                  const previousPage = visiblePages[index - 1];
                  const showEllipsis = previousPage && page - previousPage > 1;

                  return (
                    <div key={page} className="flex items-center gap-2">
                      {showEllipsis && (
                        <span className="px-1 text-sm font-bold text-slate-400">
                          ...
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-bold transition ${
                          currentPage === page
                            ? "bg-orange-600 text-white"
                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  );
                })}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                className="flex h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}
