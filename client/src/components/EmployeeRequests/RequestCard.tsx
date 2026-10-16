import { format } from "date-fns";
import {
  Banknote,
  CalendarClock,
  CalendarRange,
  Check,
  Clock3,
  FileText,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatDateRange,
  formatDateValue,
  formatLeaveDuration,
  formatMoney,
  getAdvanceType,
  getDocumentType,
  type EmployeeRequest,
} from "@/lib/employeeRequests";
import {
  Avatar,
  KindChip,
  LeaveTypeChip,
  StatusChip,
  humanizeRole,
} from "./shared";

function Detail({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-slate-400">{icon}</span>
      {children}
    </span>
  );
}

function RequestDetails({ request }: { request: EmployeeRequest }) {
  if (request.kind === "advance") {
    return (
      <>
        <Detail icon={<Banknote className="h-4 w-4" />}>
          <span className="font-semibold text-slate-800">
            {formatMoney(request.amount)}
          </span>
        </Detail>
        <Detail icon={<CalendarClock className="h-4 w-4" />}>
          {request.installments === 1
            ? "Repaid in 1 month"
            : `${request.installments} instalments of ${formatMoney(
                request.monthlyDeduction,
              )}`}
        </Detail>
        {request.neededBy && (
          <Detail icon={<CalendarRange className="h-4 w-4" />}>
            Needed by {formatDateValue(request.neededBy)}
          </Detail>
        )}
      </>
    );
  }

  if (request.kind === "document") {
    return (
      <>
        {request.period && (
          <Detail icon={<CalendarRange className="h-4 w-4" />}>
            For {formatDateValue(`${request.period}-01`, "MMMM yyyy")}
          </Detail>
        )}
        {request.addressedTo && (
          <Detail icon={<FileText className="h-4 w-4" />}>
            Addressed to {request.addressedTo}
          </Detail>
        )}
        {request.neededBy && (
          <Detail icon={<CalendarClock className="h-4 w-4" />}>
            Needed by {formatDateValue(request.neededBy)}
          </Detail>
        )}
      </>
    );
  }

  return (
    <>
      <Detail icon={<CalendarRange className="h-4 w-4" />}>
        <span className="font-semibold text-slate-800">
          {formatDateRange(request)}
        </span>
      </Detail>
      <Detail icon={<Clock3 className="h-4 w-4" />}>
        {formatLeaveDuration(request)}
      </Detail>
    </>
  );
}

export default function RequestCard({
  request,
  showUser,
  showKind,
  balanceNote,
  canReview,
  canCancel,
  canEditRecord = false,
  onApprove,
  onReject,
  onCancel,
  onEditRecord,
  onRemoveRecord,
}: {
  request: EmployeeRequest;
  showUser: boolean;
  showKind: boolean;
  // Leave under review: the employee's balance for this type.
  balanceNote?: { text: string; warning: boolean };
  canReview: boolean;
  canCancel: boolean;
  // Recorded absences: the viewer may correct or remove them.
  canEditRecord?: boolean;
  onApprove: () => void;
  onReject: () => void;
  onCancel: () => void;
  onEditRecord?: () => void;
  onRemoveRecord?: () => void;
}) {
  const recordedBy =
    request.kind === "leave" ? request.recordedByName : "";

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-100 hover:shadow-lg">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {showUser && <Avatar name={request.userName} />}

          <div className="min-w-0">
            {showUser && (
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-bold text-slate-950">
                  {request.userName}
                </h3>
                {request.userRole && (
                  <span className="text-xs font-medium text-slate-400">
                    {humanizeRole(request.userRole)}
                  </span>
                )}
              </div>
            )}

            <div
              className={`flex flex-wrap items-center gap-2 ${
                showUser ? "mt-2" : ""
              }`}
            >
              {showKind && <KindChip kind={request.kind} />}
              {request.kind === "leave" ? (
                <LeaveTypeChip type={request.leaveType} />
              ) : (
                <span className="text-sm font-bold text-slate-900">
                  {request.kind === "advance"
                    ? getAdvanceType(request.advanceType).label
                    : getDocumentType(request.documentType).label}
                </span>
              )}
              <StatusChip status={request.status} />
              {recordedBy && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  Recorded by {recordedBy}
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
              <RequestDetails request={request} />
            </div>

            {request.reason && (
              <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                {request.reason}
              </p>
            )}

            {balanceNote && request.status === "pending" && (
              <p
                className={`mt-3 text-xs font-medium ${
                  balanceNote.warning ? "text-amber-700" : "text-slate-500"
                }`}
              >
                {balanceNote.text}
              </p>
            )}

            {!recordedBy &&
              request.reviewedByName &&
              (request.status === "approved" ||
                request.status === "rejected") && (
                <p className="mt-3 text-xs text-slate-500">
                  {request.status === "approved" ? "Approved" : "Rejected"} by{" "}
                  <span className="font-semibold text-slate-700">
                    {request.reviewedByName}
                  </span>
                  {request.reviewedAt &&
                    ` on ${format(request.reviewedAt, "dd MMM yyyy")}`}
                  {request.status === "rejected" && request.reviewNote && (
                    <span className="text-slate-600">
                      {" "}
                      — “{request.reviewNote}”
                    </span>
                  )}
                </p>
              )}

            {request.createdAt && (
              <p className="mt-1 text-xs text-slate-400">
                Requested {format(request.createdAt, "dd MMM yyyy, h:mm a")}
              </p>
            )}
          </div>
        </div>

        {(canReview || canCancel || canEditRecord) && (
          <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
            {canReview && (
              <>
                <Button
                  type="button"
                  onClick={onApprove}
                  className="h-10 gap-1.5 rounded-2xl bg-emerald-600 px-4 text-white hover:bg-emerald-700"
                >
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onReject}
                  className="h-10 gap-1.5 rounded-2xl border-rose-200 bg-white px-4 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                >
                  <X className="h-4 w-4" />
                  Reject
                </Button>
              </>
            )}

            {canEditRecord && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onEditRecord}
                  className="h-10 gap-1.5 rounded-2xl border-slate-200 bg-white px-4"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onRemoveRecord}
                  className="h-10 gap-1.5 rounded-2xl border-rose-200 bg-white px-4 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              </>
            )}

            {canCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="h-10 rounded-2xl border-slate-200 bg-white px-4 text-slate-600"
              >
                Cancel request
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
