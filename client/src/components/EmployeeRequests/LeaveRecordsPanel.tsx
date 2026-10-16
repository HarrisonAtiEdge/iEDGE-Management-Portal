import { useMemo, useState } from "react";
import { CheckCircle2, Search, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PAID_LEAVE_TYPES,
  formatDateValue,
  getLeaveBalance,
  getLeaveType,
  isMainAdmin,
  setLeaveRecordUpdated,
  toDateValue,
  type LeaveRecordStatus,
  type LeaveRequest,
  type RequestActor,
} from "@/lib/employeeRequests";
import {
  Avatar,
  EmptyState,
  PillGroup,
  humanizeRole,
  panelClass,
} from "./shared";
import { useActiveUsers } from "./useActiveUsers";

type StatusFilter = "not_updated" | "updated" | "all";

// Every active employee the viewer covers, with whether their previous leave
// has been recorded ("updated"). Employees only see their own remaining
// leave once their record is updated. Main admins always see theirs, so
// they aren't listed; nor is the viewer, whose own record someone else
// updates.
export default function LeaveRecordsPanel({
  actor,
  coversDepartment,
  leaveRequests,
  statuses,
  year,
  onRecord,
}: {
  actor: RequestActor;
  coversDepartment: (department?: string | null) => boolean;
  leaveRequests: LeaveRequest[];
  statuses: Record<string, LeaveRecordStatus>;
  year: string;
  // Open Record Absence for this employee.
  onRecord: (employeeId: string) => void;
}) {
  const { toast } = useToast();
  const users = useActiveUsers();

  const [filter, setFilter] = useState<StatusFilter>("not_updated");
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState("");

  const employees = useMemo(
    () =>
      users.filter(
        (user) =>
          !isMainAdmin(user.role) &&
          user.id !== actor.id &&
          coversDepartment(user.role),
      ),
    [users, actor.id, coversDepartment],
  );

  const isUpdated = (userId: string) => Boolean(statuses[userId]?.updated);
  const updatedCount = employees.filter((user) => isUpdated(user.id)).length;

  const visible = employees.filter((user) => {
    if (filter === "updated" && !isUpdated(user.id)) return false;
    if (filter === "not_updated" && isUpdated(user.id)) return false;

    const term = search.trim().toLowerCase();
    return (
      !term ||
      [user.name, user.email, user.role].join(" ").toLowerCase().includes(term)
    );
  });

  async function setUpdated(employee: RequestActor, updated: boolean) {
    try {
      setSavingId(employee.id);
      await setLeaveRecordUpdated(employee, actor, updated);
      toast({
        title: updated ? "Leave record updated" : "Marked as not updated",
        description: updated
          ? `${employee.name} can now see their remaining leave.`
          : `${employee.name} will see the update message instead of their balance.`,
      });
    } catch (error: any) {
      console.error("Failed to update leave record status:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to save",
        variant: "destructive",
      });
    } finally {
      setSavingId("");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <PillGroup
          options={[
            {
              value: "not_updated" as StatusFilter,
              label: "Not updated",
              count: employees.length - updatedCount,
            },
            {
              value: "updated" as StatusFilter,
              label: "Updated",
              count: updatedCount,
            },
            {
              value: "all" as StatusFilter,
              label: "All",
              count: employees.length,
            },
          ]}
          value={filter}
          onChange={setFilter}
        />

        <div className="relative w-full lg:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employees"
            className="h-11 rounded-2xl border-slate-200 bg-white pl-10 shadow-sm"
          />
        </div>
      </div>

      <p className="text-sm text-slate-500">
        Record each employee's leave and absences from before the portal, then
        mark their record as updated. Until then they see a message asking them
        to send their previous leave dates to Leadership instead of their
        remaining leave. Main admins always see their remaining leave, so they
        aren't listed.
      </p>

      {visible.length === 0 ? (
        <EmptyState
          title={
            filter === "not_updated" && employees.length > 0
              ? "Everyone's leave record is updated"
              : "No employees found"
          }
          text={
            filter === "not_updated" && employees.length > 0
              ? "All employees in your departments can see their remaining leave."
              : "Try another filter or clear the search."
          }
        />
      ) : (
        <div className={`${panelClass} divide-y divide-slate-100`}>
          {visible.map((employee) => {
            const status = statuses[employee.id];
            const updated = Boolean(status?.updated);
            const balance = getLeaveBalance(leaveRequests, employee.id, year);

            return (
              <div
                key={employee.id}
                className="flex flex-col gap-4 p-5 xl:flex-row xl:items-center xl:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3 xl:w-72">
                  <Avatar name={employee.name} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-slate-950">
                      {employee.name}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {employee.role ? humanizeRole(employee.role) : "No role"}
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-wrap gap-2">
                  {PAID_LEAVE_TYPES.map((type) => {
                    const item = balance.types[type];

                    return (
                      <span
                        key={type}
                        className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200"
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${getLeaveType(type).dot}`}
                        />
                        {getLeaveType(type).label.replace(" Leave", "")}{" "}
                        <span className="font-bold text-slate-900">
                          {item.approved + item.absent + item.late}/
                          {item.entitlement}
                        </span>
                      </span>
                    );
                  })}
                  {balance.absentDays > 0 && (
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                      {balance.absentDays} absent
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                  {updated ? (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200"
                      title={
                        status?.updatedByName
                          ? `Updated by ${status.updatedByName}${
                              status.updatedAt
                                ? ` on ${formatDateValue(
                                    toDateValue(status.updatedAt),
                                  )}`
                                : ""
                            }`
                          : undefined
                      }
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Updated
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                      Not updated
                    </span>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onRecord(employee.id)}
                    className="h-9 gap-1.5 rounded-2xl border-slate-200 bg-white px-3.5 text-sm"
                  >
                    <UserX className="h-4 w-4" />
                    Record leave
                  </Button>

                  {updated ? (
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={savingId === employee.id}
                      onClick={() => setUpdated(employee, false)}
                      className="h-9 rounded-2xl px-3.5 text-sm text-slate-500"
                    >
                      Undo
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      disabled={savingId === employee.id}
                      onClick={() => setUpdated(employee, true)}
                      className="h-9 rounded-2xl bg-slate-950 px-3.5 text-sm text-white hover:bg-slate-800"
                    >
                      {savingId === employee.id ? "Saving..." : "Mark as updated"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
