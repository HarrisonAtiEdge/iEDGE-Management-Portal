import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import {
  REQUEST_KINDS,
  REQUEST_STATUS_STYLES,
  getLeaveType,
  type LeaveType,
  type RequestKind,
  type RequestStatus,
} from "@/lib/employeeRequests";

// Shared building blocks for the Employee / Self Management page.

export const panelClass =
  "rounded-[1.75rem] border border-white bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]";

export const fieldLabelClass =
  "text-xs font-semibold uppercase tracking-[0.2em] text-slate-500";

export const fieldInputClass =
  "h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100";

export function getInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function humanizeRole(role: string) {
  return role
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function StatusChip({ status }: { status: RequestStatus }) {
  const style = REQUEST_STATUS_STYLES[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style.chip}`}
    >
      {style.label}
    </span>
  );
}

export function KindChip({ kind }: { kind: RequestKind }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${REQUEST_KINDS[kind].chip}`}
    >
      {REQUEST_KINDS[kind].label}
    </span>
  );
}

export function LeaveTypeChip({ type }: { type: LeaveType }) {
  const leaveType = getLeaveType(type);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${leaveType.chip}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${leaveType.dot}`} />
      {leaveType.label}
    </span>
  );
}

export function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
      {getInitials(name)}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-2 truncate text-2xl font-black tracking-tight text-slate-950">
            {value}
          </div>
        </div>
        <div className={`shrink-0 rounded-2xl p-3 ${accent}`}>{icon}</div>
      </div>
      <div className="mt-2 text-xs text-slate-400">{hint}</div>
    </div>
  );
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/70 px-6 py-14 text-center">
      <div className="mb-3 rounded-2xl bg-white p-3 text-slate-400 shadow-sm">
        <Inbox className="h-6 w-6" />
      </div>
      <div className="text-sm font-semibold text-slate-700">{title}</div>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>
    </div>
  );
}

// A row of pill buttons, used for filters and choices.
export function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string; count?: number }>;
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
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
            value === option.value
              ? "bg-slate-950 text-white shadow-sm"
              : "bg-white text-slate-600 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
          }`}
        >
          {option.label}
          {option.count !== undefined && (
            <span
              className={`rounded-full px-1.5 text-xs ${
                value === option.value
                  ? "bg-white/15"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {option.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
