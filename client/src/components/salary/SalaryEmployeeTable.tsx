import { useEffect, useState, type ReactNode } from "react";
import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadSalaryPayslip, salaryMoney } from "@/components/salary/salaryExports";
import type { SalaryEmployee, SalaryRun } from "@/lib/salaryModel";

// Saves on Enter or when leaving the field, so typing "12" isn't saved as 1 then 12.
function UnpaidDaysInput({ row, disabled, onChange }: { row: SalaryEmployee; disabled: boolean; onChange: (value: number) => boolean }) {
  const saved = row.input.unpaidDays;
  const [value, setValue] = useState(String(saved));
  useEffect(() => setValue(String(saved)), [saved]);
  function commit() {
    const next = Number(value);
    if (value.trim() === "" || !Number.isFinite(next) || next < 0) { setValue(String(saved)); return; }
    if (next !== saved && !onChange(next)) setValue(String(saved));
  }
  return <Input
    aria-label={`Unpaid days for ${row.profile.personal.fullName}`}
    className="h-8 w-20 px-2 text-right"
    type="number" min={0} step="any" value={value} disabled={disabled}
    onChange={(event) => setValue(event.target.value)}
    onBlur={commit}
    onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
  />;
}

function Figure({ label, strong, children }: { label: string; strong?: boolean; children: ReactNode }) {
  return <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <div className={`mt-1 whitespace-nowrap text-sm ${strong ? "font-semibold" : ""}`}>{children}</div>
  </div>;
}

export default function SalaryEmployeeTable({ run, rows, disabled, actionsDisabled, onReview, onRemove, onUnpaidDaysChange }: {
  run: SalaryRun;
  rows: SalaryEmployee[];
  disabled: boolean;
  // Stays on while unpaid days save in the background; the fields themselves don't lock.
  actionsDisabled: boolean;
  onReview: (row: SalaryEmployee) => void;
  onRemove: (row: SalaryEmployee) => void;
  onUnpaidDaysChange: (row: SalaryEmployee, unpaidDays: number) => boolean;
}) {
  const money = (value: number) => salaryMoney(value, run.currency);
  const draft = run.status === "draft";
  const removable = draft || run.status === "submitted";
  // Rows wrap as whole figures rather than a wide table, so nothing scrolls sideways.
  return <div className="divide-y">{rows.map((row) => {
    const name = row.profile.personal.fullName;
    return <div key={row.id} className="grid items-start gap-x-6 gap-y-3 p-4 md:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)]">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words font-medium">{name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{row.profile.employment.employeeCode || "ID pending"} · {row.profile.employment.department || "Department pending"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{row.calculation.paidDays} / {row.calculation.denominator} paid days</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {draft && <Button variant="outline" size="sm" disabled={actionsDisabled} onClick={() => onReview(row)}>Review</Button>}
          <Button variant="ghost" size="icon" aria-label={`Download payslip for ${name}`} onClick={() => downloadSalaryPayslip(run, row)} disabled={disabled}><Download className="h-4 w-4" /></Button>
          {removable && <Button variant="ghost" size="icon" aria-label={`Remove ${name} from payroll`} disabled={actionsDisabled} onClick={() => onRemove(row)}><Trash2 className="h-4 w-4" /></Button>}
        </div>
      </div>
      <div className="min-w-0 space-y-1">{run.settings.components.map((component) => <p key={component.id} className="flex flex-wrap justify-between gap-x-3 text-xs">
        <span className="min-w-0 text-muted-foreground">{component.name} {component.percentage}%</span>
        <span className="whitespace-nowrap">{money(row.calculation.components.find((item) => item.id === component.id)?.amount ?? 0)}</span>
      </p>)}</div>
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-6 gap-y-2 md:col-span-2 2xl:col-span-1">
        <Figure label="Gross">{money(row.calculation.gross)}</Figure>
        <Figure label="Unpaid days">{draft ? <UnpaidDaysInput row={row} disabled={disabled} onChange={(value) => onUnpaidDaysChange(row, value)} /> : row.input.unpaidDays}</Figure>
        <Figure label="Taxable income">{money(row.calculation.taxable)}</Figure>
        <Figure label="Tax">{money(row.calculation.incomeTax)}</Figure>
        <Figure label="Deductions">{money(row.calculation.otherDeductions)}</Figure>
        <Figure label="Net pay" strong>{money(row.calculation.net)}</Figure>
      </div>
    </div>;
  })}</div>;
}
