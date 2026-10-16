import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { CalendarClock, Pencil, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  formatDateValue,
  isApproverActive,
  hasBuiltInRequestAccess,
  isMainAdmin,
  normalizeDepartment,
  removeApprover,
  saveApprover,
  toDateValue,
  type RequestApprover,
} from "@/lib/employeeRequests";
import {
  Avatar,
  EmptyState,
  fieldInputClass,
  fieldLabelClass,
  humanizeRole,
  panelClass,
} from "./shared";

const PANEL_ID = "IEDGE-SYSTEM";

type SystemUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Department = { key: string; name: string };

type FormState = {
  userId: string;
  canApprove: boolean;
  allDepartments: boolean;
  departments: string[];
  until: string;
};

const emptyForm: FormState = {
  userId: "",
  canApprove: true,
  allDepartments: true,
  departments: [],
  until: "",
};

// Lets the main admin choose who, besides themselves, can approve employee
// requests (and record absences) or only record absences, for which
// departments (roles) and until when.
export default function ApproverSettings({
  approvers,
  actor,
}: {
  approvers: RequestApprover[];
  actor: { id: string; name: string };
}) {
  const { toast } = useToast();

  const [users, setUsers] = useState<SystemUser[]>([]);
  const [roleNames, setRoleNames] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<RequestApprover | null>(
    null,
  );

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(
      collection(db, "Panels", PANEL_ID, "users"),
      (snapshot) => {
        setUsers(
          snapshot.docs
            .filter((userDoc) => {
              const data = userDoc.data();
              return (
                data.accountStatus !== "rejected" && data.isActive !== false
              );
            })
            .map((userDoc) => {
              const data = userDoc.data();
              return {
                id: userDoc.id,
                name: data.displayName || data.name || data.email || "Unknown user",
                email: data.email || "",
                role: data.role || "",
              };
            })
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
      },
      (error) => console.error("Failed to load users:", error),
    );

    // Roles double as departments; their display names live on the
    // sidebar configuration documents.
    const unsubscribeRoles = onSnapshot(
      collection(db, "Panels", PANEL_ID, "sidebarConfig"),
      (snapshot) => {
        const names: Record<string, string> = {};
        snapshot.docs.forEach((roleDoc) => {
          names[normalizeDepartment(roleDoc.id)] =
            roleDoc.data().name || humanizeRole(roleDoc.id);
        });
        setRoleNames(names);
      },
      (error) => console.error("Failed to load roles:", error),
    );

    return () => {
      unsubscribeUsers();
      unsubscribeRoles();
    };
  }, []);

  const departments = useMemo<Department[]>(() => {
    const keys = new Set<string>(Object.keys(roleNames));
    users.forEach((user) => {
      const key = normalizeDepartment(user.role);
      if (key) keys.add(key);
    });
    keys.delete("main_admin");

    return Array.from(keys)
      .map((key) => ({ key, name: roleNames[key] || humanizeRole(key) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [roleNames, users]);

  const departmentName = (key: string) =>
    departments.find((department) => department.key === key)?.name ||
    humanizeRole(key);

  const describeScope = (approver: {
    allDepartments: boolean;
    departments: string[];
  }) =>
    approver.allDepartments
      ? "all departments"
      : approver.departments.map(departmentName).join(", ");

  // Main admins, finance and financial admins already review everything.
  const selectableUsers = users.filter(
    (user) => !isMainAdmin(user.role) && !hasBuiltInRequestAccess(user.role),
  );
  const today = toDateValue(new Date());

  const sortedApprovers = [...approvers].sort(
    (a, b) =>
      Number(isApproverActive(b, today)) - Number(isApproverActive(a, today)) ||
      a.userName.localeCompare(b.userName),
  );

  function startEdit(approver: RequestApprover) {
    setEditing(true);
    setForm({
      userId: approver.userId,
      canApprove: approver.canApprove,
      allDepartments: approver.allDepartments,
      departments: approver.departments,
      until: approver.until,
    });
  }

  function resetForm() {
    setEditing(false);
    setForm(emptyForm);
  }

  function toggleDepartment(key: string) {
    setForm((previous) => ({
      ...previous,
      allDepartments: false,
      departments: previous.departments.includes(key)
        ? previous.departments.filter((item) => item !== key)
        : [...previous.departments, key],
    }));
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();

    const user = users.find((item) => item.id === form.userId);

    if (!user) {
      toast({
        title: "Choose a user",
        description: "Select who should be able to approve requests.",
        variant: "destructive",
      });
      return;
    }

    if (!form.allDepartments && form.departments.length === 0) {
      toast({
        title: "Choose departments",
        description: "Pick at least one department, or All departments.",
        variant: "destructive",
      });
      return;
    }

    if (form.until && form.until < today) {
      toast({
        title: "Check the end date",
        description: "The end date can't be in the past.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      await saveApprover(
        {
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          userRole: user.role,
          canApprove: form.canApprove,
          allDepartments: form.allDepartments,
          departments: form.departments,
          until: form.until,
        },
        actor,
        describeScope(form),
      );
      toast({
        title: editing ? "Access updated" : "Access given",
        description: `${user.name} can now ${
          form.canApprove ? "approve requests and record absences" : "record absences"
        } for ${describeScope(form)}.`,
      });
      resetForm();
    } catch (error: any) {
      console.error("Failed to save approver:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to save the approver",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function confirmRemove() {
    if (!removeTarget) return;

    try {
      await removeApprover(removeTarget, actor);
      toast({
        title: "Approver removed",
        description: `${removeTarget.userName} can no longer approve requests.`,
      });
      if (form.userId === removeTarget.userId) resetForm();
    } catch (error: any) {
      console.error("Failed to remove approver:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to remove the approver",
        variant: "destructive",
      });
    } finally {
      setRemoveTarget(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
      <form onSubmit={handleSave} className={`${panelClass} space-y-5 p-5 md:p-6 xl:self-start`}>
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            <UserPlus className="h-4 w-4" />
            {editing ? "Edit approver" : "Add approver"}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            You review every request. Anyone you add here can also approve
            requests, or only record absences, for the departments you choose.
          </p>
        </div>

        <div className="space-y-2">
          <Label className={fieldLabelClass}>User *</Label>
          <select
            value={form.userId}
            disabled={editing}
            onChange={(event) => {
              const existing = approvers.find(
                (approver) => approver.userId === event.target.value,
              );
              if (existing) {
                startEdit(existing);
              } else {
                setForm((previous) => ({
                  ...previous,
                  userId: event.target.value,
                }));
              }
            }}
            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-200 focus:ring-4 focus:ring-blue-50 disabled:opacity-70"
          >
            <option value="">Select a user</option>
            {selectableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
                {user.role ? ` · ${humanizeRole(user.role)}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label className={fieldLabelClass}>Access</Label>
          <div className="grid grid-cols-1 gap-2">
            {[
              {
                value: true,
                title: "Approve requests & record absences",
                text: "Receives requests and can approve or reject them.",
              },
              {
                value: false,
                title: "Record absences only",
                text: "e.g. finance: marks absences and past leave, no approvals.",
              },
            ].map((option) => (
              <button
                key={option.title}
                type="button"
                onClick={() =>
                  setForm((previous) => ({
                    ...previous,
                    canApprove: option.value,
                  }))
                }
                className={`rounded-2xl p-3.5 text-left transition ${
                  form.canApprove === option.value
                    ? "bg-slate-950 text-white shadow-sm"
                    : "bg-white ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="text-sm font-bold">{option.title}</div>
                <div
                  className={`mt-0.5 text-xs ${
                    form.canApprove === option.value
                      ? "text-slate-300"
                      : "text-slate-500"
                  }`}
                >
                  {option.text}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className={fieldLabelClass}>Departments</Label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setForm((previous) => ({
                  ...previous,
                  allDepartments: true,
                  departments: [],
                }))
              }
              className={`rounded-2xl px-3.5 py-2 text-sm font-semibold transition ${
                form.allDepartments
                  ? "bg-slate-950 text-white shadow-sm"
                  : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
              }`}
            >
              All departments
            </button>
            {departments.map((department) => {
              const selected =
                !form.allDepartments &&
                form.departments.includes(department.key);

              return (
                <button
                  key={department.key}
                  type="button"
                  onClick={() => toggleDepartment(department.key)}
                  className={`rounded-2xl px-3.5 py-2 text-sm font-semibold transition ${
                    selected
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {department.name}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-400">
            Departments are the users' roles in User Management.
          </p>
        </div>

        <div className="space-y-2">
          <Label className={fieldLabelClass}>Access until</Label>
          <div className="flex gap-2">
            <Input
              type="date"
              value={form.until}
              min={today}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  until: event.target.value,
                }))
              }
              className={`${fieldInputClass} flex-1`}
            />
            {form.until && (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setForm((previous) => ({ ...previous, until: "" }))
                }
                className="h-11 rounded-2xl border-slate-200 px-4"
              >
                No end
              </Button>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Leave empty to keep access until you remove it.
          </p>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          {editing && (
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              className="h-11 rounded-2xl border-slate-200 bg-white px-5"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={saving}
            className="h-11 rounded-2xl bg-slate-950 px-6 text-white shadow-sm hover:bg-slate-800"
          >
            {saving ? "Saving..." : editing ? "Save changes" : "Add approver"}
          </Button>
        </div>
      </form>

      <div className="space-y-4">
        <div className={`${panelClass} flex items-center gap-3 p-5`}>
          <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-950">
              Main admin, Finance & Financial admin · All departments
            </div>
            <div className="text-xs text-slate-500">
              Always receive and can approve every request and record
              absences. Nobody but the main admin approves their own.
            </div>
          </div>
        </div>

        {sortedApprovers.length === 0 ? (
          <EmptyState
            title="No other approvers yet"
            text="Add a user on the left to share the approval work, for all departments or only some."
          />
        ) : (
          sortedApprovers.map((approver) => {
            const active = isApproverActive(approver, today);

            return (
              <div
                key={approver.userId}
                className={`rounded-[1.5rem] border bg-white p-5 shadow-sm transition ${
                  active ? "border-slate-200" : "border-slate-200 opacity-70"
                }`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar name={approver.userName} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-bold text-slate-950">
                          {approver.userName}
                        </h3>
                        {approver.userRole && (
                          <span className="text-xs font-medium text-slate-400">
                            {humanizeRole(approver.userRole)}
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                            active
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : "bg-slate-100 text-slate-500 ring-slate-200"
                          }`}
                        >
                          {active ? "Active" : "Expired"}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                            approver.canApprove
                              ? "bg-blue-50 text-blue-700 ring-blue-100"
                              : "bg-amber-50 text-amber-700 ring-amber-200"
                          }`}
                        >
                          {approver.canApprove ? "Approves" : "Record only"}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {approver.allDepartments ? (
                          <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-semibold text-white">
                            All departments
                          </span>
                        ) : (
                          approver.departments.map((key) => (
                            <span
                              key={key}
                              className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-100"
                            >
                              {departmentName(key)}
                            </span>
                          ))
                        )}
                      </div>

                      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500">
                        <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                        {approver.until
                          ? `${active ? "Until" : "Ended"} ${formatDateValue(
                              approver.until,
                            )}`
                          : "No end date"}
                        {approver.addedByName &&
                          ` · added by ${approver.addedByName}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => startEdit(approver)}
                      className="h-10 gap-1.5 rounded-2xl border-slate-200 bg-white px-4"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setRemoveTarget(approver)}
                      className="h-10 gap-1.5 rounded-2xl border-rose-200 bg-white px-4 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <AlertDialog
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
      >
        <AlertDialogContent className="rounded-[1.75rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this approver?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget &&
                `${removeTarget.userName} will lose access to employee requests and absences.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">Keep</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              className="rounded-2xl bg-rose-600 hover:bg-rose-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
