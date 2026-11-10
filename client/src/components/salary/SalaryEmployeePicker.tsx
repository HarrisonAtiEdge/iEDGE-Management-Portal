import { useEffect, useId, useMemo, useState } from "react";
import { Loader2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export interface SalaryEmployeeOption {
  id: string;
  name: string;
  employeeCode: string;
  department: string;
  company: string;
  issue?: string;
}

export default function SalaryEmployeePicker({ employees, loading, disabled, adding, onAdd }: {
  employees: SalaryEmployeeOption[];
  loading: boolean;
  disabled: boolean;
  adding: boolean;
  onAdd: (ids: string[]) => Promise<void>;
}) {
  const prefix = useId();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selected = new Set(selectedIds);
  const readyIds = useMemo(() => new Set(employees.filter((employee) => !employee.issue).map((employee) => employee.id)), [employees]);
  const filtered = employees.filter((employee) => [employee.name, employee.employeeCode, employee.department, employee.company]
    .join(" ").toLowerCase().includes(search.trim().toLowerCase()));
  const readyShown = filtered.filter((employee) => !employee.issue);
  const selectedReady = selectedIds.filter((id) => readyIds.has(id));
  const allShownSelected = readyShown.length > 0 && readyShown.every((employee) => selected.has(employee.id));
  const someShownSelected = readyShown.some((employee) => selected.has(employee.id));
  const controlsDisabled = disabled || loading || adding;

  // Remove successful additions and employees that are no longer eligible.
  // Failed additions remain selected for retry while they are still eligible.
  useEffect(() => {
    setSelectedIds((previous) => {
      const next = previous.filter((id) => readyIds.has(id));
      return next.length === previous.length ? previous : next;
    });
  }, [readyIds]);

  function selectShown(checked: boolean) {
    const shownIds = new Set(readyShown.map((employee) => employee.id));
    setSelectedIds((previous) => checked
      ? Array.from(new Set([...previous, ...shownIds]))
      : previous.filter((id) => !shownIds.has(id)));
  }

  return <div className="space-y-3">
    <div className="relative">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input aria-label="Search active employees to add" className="pl-9" placeholder="Search name, employee ID, department, or company" value={search} disabled={controlsDisabled} onChange={(event) => setSearch(event.target.value)} />
    </div>
    <div className="overflow-hidden rounded-lg border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-3 py-2.5">
        <label htmlFor={`${prefix}-all`} className="flex items-center gap-2 text-sm font-medium">
          <Checkbox id={`${prefix}-all`} checked={allShownSelected ? true : someShownSelected ? "indeterminate" : false} disabled={controlsDisabled || !readyShown.length} onCheckedChange={(checked) => selectShown(checked === true)} />
          Select all ready shown
        </label>
        <span className="text-xs text-muted-foreground">{filtered.length} of {employees.length} available</span>
      </div>
      {loading ? <p role="status" className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading active employees…</p>
        : !employees.length ? <p className="p-6 text-sm text-muted-foreground">No active employee profiles are available to add. Employees already in this payroll are excluded.</p>
          : !filtered.length ? <p className="p-6 text-sm text-muted-foreground">No employees match your search.</p>
            : <ul aria-label="Active employees available for payroll" className="divide-y">
              {filtered.map((employee) => {
                const id = `${prefix}-${employee.id}`;
                return <li key={employee.id}>
                  <label htmlFor={id} className={`flex items-start gap-3 px-3 py-3 ${employee.issue ? "bg-muted/20" : controlsDisabled ? "" : "cursor-pointer hover:bg-muted/40"}`}>
                    <Checkbox id={id} className="mt-0.5" aria-label={`Select ${employee.name}${employee.employeeCode ? ` (${employee.employeeCode})` : ""}`} aria-describedby={employee.issue ? `${id}-issue` : undefined} checked={!employee.issue && selected.has(employee.id)} disabled={controlsDisabled || !!employee.issue} onCheckedChange={(checked) => setSelectedIds((previous) => checked === true ? Array.from(new Set([...previous, employee.id])) : previous.filter((value) => value !== employee.id))} />
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="block text-sm font-medium">{employee.name}</span>
                      <span className="block text-xs text-muted-foreground">{[employee.employeeCode || "Employee ID pending", employee.department, employee.company].filter(Boolean).join(" · ")}</span>
                      {employee.issue && <span id={`${id}-issue`} className="block text-xs leading-relaxed text-amber-800 dark:text-amber-300">{employee.issue}</span>}
                    </span>
                  </label>
                </li>;
              })}
            </ul>}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{selectedReady.length} employee{selectedReady.length === 1 ? "" : "s"} selected</p>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="ghost" disabled={controlsDisabled || !selectedReady.length} onClick={() => setSelectedIds([])}>Clear selection</Button>
        <Button type="button" size="sm" disabled={controlsDisabled || !selectedReady.length} onClick={() => void onAdd(selectedReady)}>
          {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          {adding ? "Adding employees…" : `Add selected (${selectedReady.length})`}
        </Button>
      </div>
    </div>
  </div>;
}
