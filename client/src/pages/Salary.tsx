import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Banknote, CheckCircle2, ClipboardList, Download, FileText, History, Loader2, Plus, RefreshCw, Search, Settings2, ShieldCheck, Trash2, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SalaryEmployeeEditor, SalaryField, SalarySettingsEditor, TaxPolicyEditor, salarySelectClass } from "@/components/salary/SalaryForms";
import SalaryEmployeePicker from "@/components/salary/SalaryEmployeePicker";
import SalaryEmployeeTable from "@/components/salary/SalaryEmployeeTable";
import SalaryPaymentPanel from "@/components/salary/SalaryPaymentPanel";
import { downloadSalaryPayslip, exportSalaryBank, exportSalaryRegister, salaryBankIssues, salaryMoney } from "@/components/salary/salaryExports";
import { calculateSalary, canAccessSalary, canApproveSalary, defaultSalaryInput, salaryMonthBounds, salaryTotals, type SalaryEmployee, type SalaryRun, type SalarySettings, type TaxPolicy, type Versioned } from "@/lib/salaryModel";
import { addSalaryEmployees, createSalaryRun, recalculateSalaryTax, fetchSalaryAudit, fetchSalaryDirectory, removeSalaryEmployee, saveSalaryEmployee, subscribeSalaryEmployees, subscribeSalaryPolicies, subscribeSalaryRuns, subscribeSalarySettings, transitionSalaryRun, type SalaryAction } from "@/lib/salaryService";
import type { EmployeeProfile } from "@/lib/employeeProfileModel";

const currentMonth = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; };
const errorMessage = (e: unknown) => e instanceof Error ? e.message : "Something went wrong. Please try again.";
const statusStyle: Record<SalaryRun["status"], string> = {
  draft: "border-slate-300 bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-200",
  submitted: "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  approved: "border-blue-300 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  paid: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  cancelled: "border-red-300 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200",
};
const actionLabels: Record<SalaryAction, string> = { submit: "Submit for approval", approve: "Approve payroll", return_to_draft: "Return to draft", mark_paid: "Record payment", cancel: "Cancel payroll" };

export default function Salary() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const role = userProfile?.role, allowed = canAccessSalary(role), approver = canApproveSalary(role), administrator = role === "main_admin";
  const [tab, setTab] = useState("payroll"), [settings, setSettings] = useState<Versioned<SalarySettings> | null>(null), [policies, setPolicies] = useState<Versioned<TaxPolicy>[]>([]), [runs, setRuns] = useState<SalaryRun[]>([]);
  const [directory, setDirectory] = useState<EmployeeProfile[]>([]), [directoryLoading, setDirectoryLoading] = useState(false);
  const [loading, setLoading] = useState({ settings: true, policies: true, runs: true }), [errors, setErrors] = useState<Record<string, string>>({}), [attempt, setAttempt] = useState(0);
  const [selectedId, setSelectedId] = useState(""), [rows, setRows] = useState<SalaryEmployee[]>([]), [rowsLoading, setRowsLoading] = useState(false), [monthFilter, setMonthFilter] = useState(""), [search, setSearch] = useState(""), [department, setDepartment] = useState("");
  const [busy, setBusy] = useState(""), [newOpen, setNewOpen] = useState(false), [newMonth, setNewMonth] = useState(currentMonth), [newPolicy, setNewPolicy] = useState(""), [newNotes, setNewNotes] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false), [policyEditor, setPolicyEditor] = useState<Versioned<TaxPolicy> | "new" | null>(null), [employeeEditor, setEmployeeEditor] = useState<SalaryEmployee | null>(null);
  const [action, setAction] = useState<SalaryAction | null>(null), [reason, setReason] = useState(""), [paymentDate, setPaymentDate] = useState(""), [paymentReference, setPaymentReference] = useState("");
  const [auditOpen, setAuditOpen] = useState(false), [audit, setAudit] = useState<Awaited<ReturnType<typeof fetchSalaryAudit>>>([]), [auditLoading, setAuditLoading] = useState(false);
  // Unpaid days show straight away and save in the background, one at a time.
  const [unpaidEdits, setUnpaidEdits] = useState<Record<string, number>>({}), [pendingSaves, setPendingSaves] = useState(0);
  const saveQueue = useRef<Promise<void>>(Promise.resolve()), savedRevisions = useRef<Record<string, number>>({}), latestRows = useRef<SalaryEmployee[]>([]);
  const run = runs.find((item) => item.id === selectedId) || null;
  const setError = useCallback((key: string, message: string) => setErrors((previous) => ({ ...previous, [key]: message })), []);
  const reloadDirectory = useCallback(async () => {
    setDirectoryLoading(true);
    try { setDirectory(await fetchSalaryDirectory()); setError("directory", ""); } catch (e) { setError("directory", errorMessage(e)); } finally { setDirectoryLoading(false); }
  }, [setError]);
  useEffect(() => {
    if (!allowed) return;
    setLoading((previous) => ({ ...previous, settings: true, policies: true })); setErrors({});
    const unsubscribers = [
      subscribeSalarySettings((value) => { setSettings(value); setLoading((v) => ({ ...v, settings: false })); }, (e) => { setError("settings", e.message); setLoading((v) => ({ ...v, settings: false })); }),
      subscribeSalaryPolicies((value) => { setPolicies(value); setLoading((v) => ({ ...v, policies: false })); }, (e) => { setError("policies", e.message); setLoading((v) => ({ ...v, policies: false })); }),
    ];
    void reloadDirectory();
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [allowed, attempt, reloadDirectory, setError]);
  useEffect(() => {
    if (!allowed) return;
    setLoading((previous) => ({ ...previous, runs: true })); setError("runs", "");
    return subscribeSalaryRuns((value) => { setRuns(value); setSelectedId((current) => value.some((r) => r.id === current) ? current : value[0]?.id || ""); setLoading((v) => ({ ...v, runs: false })); }, (e) => { setError("runs", e.message); setLoading((v) => ({ ...v, runs: false })); }, monthFilter);
  }, [allowed, attempt, monthFilter, setError]);
  useEffect(() => {
    setRows([]); setUnpaidEdits({}); setSearch(""); setDepartment(""); setEmployeeEditor(null); setAction(null); setAuditOpen(false); setError("rows", "");
    if (!allowed || !selectedId) return;
    setRowsLoading(true);
    return subscribeSalaryEmployees(selectedId, (value) => { setRows(value); setRowsLoading(false); }, (e) => { setError("rows", e.message); setRowsLoading(false); });
  }, [allowed, selectedId, attempt, setError]);
  latestRows.current = rows;
  useEffect(() => {
    // Saved values take over from the on-screen ones as they arrive.
    setUnpaidEdits((edits) => {
      const pending = Object.entries(edits).filter(([userId, days]) => rows.find((row) => row.userId === userId)?.input.unpaidDays !== days);
      return pending.length === Object.keys(edits).length ? edits : Object.fromEntries(pending);
    });
  }, [rows]);
  const displayRows = useMemo(() => !run ? rows : rows.map((row) => {
    const unpaidDays = unpaidEdits[row.userId];
    if (unpaidDays === undefined) return row;
    const input = { ...row.input, unpaidDays };
    try { return { ...row, input, calculation: calculateSalary(row.profile, run.month, run.settings, run.policy, input) }; } catch { return row; }
  }), [rows, run, unpaidEdits]);
  const totals = useMemo(() => salaryTotals(displayRows), [displayRows]);
  const filteredRows = displayRows.filter((row) => (!department || row.profile.employment.department === department) && [row.profile.personal.fullName, row.profile.employment.employeeCode, row.profile.employment.department, row.profile.employment.designation, row.profile.employment.company].join(" ").toLowerCase().includes(search.trim().toLowerCase()));
  const departments = Array.from(new Set(rows.map((row) => row.profile.employment.department).filter(Boolean))).sort();
  const candidates = useMemo(() => directory.filter((profile) => !rows.some((row) => row.userId === profile.id)), [directory, rows]);
  const candidateOptions = useMemo(() => candidates.map((profile) => {
    let issue: string | undefined;
    if (!run) issue = "Select a payroll run first.";
    else {
      try { calculateSalary(profile, run.month, run.settings, run.policy, defaultSalaryInput(run.month, run.policy)); }
      catch (error) { const message = errorMessage(error); issue = message.startsWith("[") ? "Complete invalid salary details in Employee Profile first." : message; }
    }
    return { id: profile.id, name: profile.personal.fullName, employeeCode: profile.employment.employeeCode, department: profile.employment.department, company: profile.employment.company, issue };
  }), [candidates, run]);
  const errorsList = Object.entries(errors).filter(([, message]) => message);
  const initialLoading = loading.settings || loading.policies || loading.runs;
  const validPolicies = policies.filter((policy) => { try { const period = salaryMonthBounds(newMonth); return policy.status === "active" && policy.effectiveFrom <= period.start && policy.effectiveTo >= period.end && policy.currency === settings?.currency; } catch { return false; } });
  const runHasError = !!errors.rows || !!errors.runs;
  const runBusy = !!busy || rowsLoading || loading.runs || runHasError;
  const actionsBusy = runBusy || pendingSaves > 0;

  async function work(key: string, fn: () => Promise<void>) {
    if (busy) return;
    setBusy(key); setError("action", "");
    try { await fn(); } catch (e) { setError("action", errorMessage(e)); toast({ title: "Unable to complete action", description: errorMessage(e), variant: "destructive" }); } finally { setBusy(""); }
  }
  async function createRun() {
    await work("create", async () => { const id = await createSalaryRun(newMonth, newPolicy, newNotes); setSelectedId(id); setMonthFilter(newMonth); setNewOpen(false); setTab("payroll"); toast({ title: "Payroll draft created", description: "Add employees and review their salary and tax figures." }); });
  }
  async function addSelectedEmployees(ids: string[]) {
    if (!run || !ids.length) return;
    const chosen = candidates.filter((profile) => ids.includes(profile.id));
    await work("add_employees", async () => {
      const outcome = await addSalaryEmployees(run, chosen.map((profile) => profile.id));
      const added = outcome.added.length;
      const failures = outcome.failures.map((failure) => `${chosen.find((profile) => profile.id === failure.userId)?.personal.fullName}: ${failure.message}`);
      toast({ title: `${added} employee${added === 1 ? "" : "s"} added`, description: failures.length ? `${failures.length} could not be added. Review the message and retry the missing employees.` : "Review each employee's prior tax figures before submission." });
      if (failures.length) setError("action", failures.join(" "));
    });
  }
  function removeEmployee(row: SalaryEmployee) {
    if (!run) return;
    if (run.status !== "draft" && !window.confirm(`Remove ${row.profile.personal.fullName} from this payroll? To add them back, return the payroll to draft.`)) return;
    void work("remove", () => removeSalaryEmployee(run.id, row.userId, row.revision));
  }
  function saveUnpaidDays(row: SalaryEmployee, unpaidDays: number) {
    if (!run) return false;
    try { calculateSalary(row.profile, run.month, run.settings, run.policy, { ...row.input, unpaidDays }); }
    catch (e) { toast({ title: "Unable to change unpaid days", description: errorMessage(e), variant: "destructive" }); return false; }
    const runId = run.id, userId = row.userId, revisionKey = `${runId}/${userId}`;
    setUnpaidEdits((edits) => ({ ...edits, [userId]: unpaidDays }));
    setPendingSaves((count) => count + 1);
    saveQueue.current = saveQueue.current.then(async () => {
      const current = latestRows.current.find((item) => item.userId === userId) ?? row;
      try {
        // A save can finish before its update reaches the page, so remember its revision.
        const revision = Math.max(current.revision, savedRevisions.current[revisionKey] ?? 0);
        savedRevisions.current[revisionKey] = await saveSalaryEmployee(runId, userId, { ...current.input, unpaidDays }, revision);
      } catch (e) {
        setUnpaidEdits(({ [userId]: _failed, ...edits }) => edits);
        toast({ title: `Unpaid days not saved for ${row.profile.personal.fullName}`, description: errorMessage(e), variant: "destructive" });
      } finally { setPendingSaves((count) => count - 1); }
    });
    return true;
  }
  async function recalculateTax() {
    if (!run) return;
    await work("recalculate_tax", async () => {
      const { added, failures } = await recalculateSalaryTax(run, rows);
      toast({ title: `Tax recalculated for ${added.length} employee${added.length === 1 ? "" : "s"}`, description: failures.length ? `${failures.length} could not be updated.` : undefined });
      if (failures.length) setError("action", failures.map((failure) => `${rows.find((row) => row.userId === failure.userId)?.profile.personal.fullName}: ${failure.message}`).join(" "));
    });
  }
  async function performAction() {
    if (!run || !action) return;
    await work(action, async () => { await transitionSalaryRun(run.id, run.revision, action, { reason, paymentDate, paymentReference }); setAction(null); toast({ title: "Payroll updated" }); });
  }
  function openAction(next: SalaryAction) { setAction(next); setReason(""); setPaymentDate(""); setPaymentReference(""); }
  async function openAudit() { if (!run) return; setAuditOpen(true); setAuditLoading(true); setAudit([]); try { setAudit(await fetchSalaryAudit(run.id)); } catch (e) { setError("action", errorMessage(e)); } finally { setAuditLoading(false); } }

  if (!allowed) return <div className="p-10 text-center"><ShieldCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground" /><h1 className="text-xl font-semibold">Salary access is restricted</h1><p className="mt-2 text-muted-foreground">Finance, Financial Admin, and Main Admin can manage payroll.</p></div>;
  return <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary"><Wallet className="h-4 w-4" />People & Payroll</div><h1 className="text-3xl font-bold tracking-tight">Salary</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Prepare monthly payroll, review tax, and keep a clear record of every payment.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => { setAttempt((n) => n + 1); }} disabled={!!busy || initialLoading}><RefreshCw className={`mr-2 h-4 w-4 ${initialLoading ? "animate-spin" : ""}`} />Refresh</Button><Button onClick={() => { setNewOpen(true); setNewPolicy(""); setNewNotes(""); }} disabled={!settings || initialLoading || !!busy}><Plus className="mr-2 h-4 w-4" />New payroll</Button></div></div>
    {errorsList.length > 0 && <div role="alert" className="space-y-1 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{errorsList.map(([key, message]) => <p key={key}>{message}</p>)}</div>}
    {!loading.settings && !settings && !errors.settings && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-5"><div><p className="font-semibold">Set up payroll before your first salary run</p><p className="mt-1 text-sm text-muted-foreground">Save salary components, deductions, and a dated tax policy. No default tax policy is applied.</p></div><Button variant="outline" onClick={() => administrator ? setSettingsOpen(true) : setTab("settings")}>Payroll setup<ArrowRight className="ml-2 h-4 w-4" /></Button></div>}
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="mb-5 flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/60 p-1"><TabsTrigger value="payroll" className="gap-2"><ClipboardList className="h-4 w-4" />Payroll</TabsTrigger><TabsTrigger value="tax" className="gap-2"><FileText className="h-4 w-4" />Tax policies</TabsTrigger><TabsTrigger value="settings" className="gap-2"><Settings2 className="h-4 w-4" />Settings</TabsTrigger><TabsTrigger value="reports" className="gap-2"><Download className="h-4 w-4" />Reports & payslips</TabsTrigger></TabsList>
      <TabsContent value="payroll" className="space-y-5">
        <div className="grid gap-5 xl:grid-cols-[250px_1fr]">
          <aside className="space-y-3"><div className="flex items-center justify-between"><h2 className="font-semibold">Payroll runs</h2><span className="text-xs text-muted-foreground">Latest {runs.length}</span></div><SalaryField label="Filter by year & month"><Input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} /></SalaryField>{monthFilter && <Button size="sm" variant="ghost" onClick={() => setMonthFilter("")}>Show all months</Button>}
            <div className="max-h-[600px] space-y-2 overflow-y-auto pr-1">{loading.runs ? <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading payroll…</p> : runs.filter((r) => !monthFilter || r.month === monthFilter).map((r) => <button key={r.id} type="button" aria-pressed={r.id === selectedId} disabled={!!busy} onClick={() => setSelectedId(r.id)} className={`w-full rounded-xl border p-4 text-left transition-colors hover:border-primary/50 ${r.id === selectedId ? "border-primary bg-primary/5 shadow-sm" : "bg-card"}`}><div className="flex items-center justify-between gap-2"><span className="font-semibold">{r.month}</span><span className="text-xs text-muted-foreground">{r.currency}</span></div><div className="mt-3 flex items-center justify-between"><Badge variant="outline" className={`capitalize ${statusStyle[r.status]}`}>{r.status}</Badge><span className="text-xs text-muted-foreground">{r.employeeCount ?? "Draft"}{r.employeeCount !== undefined ? " employees" : ""}</span></div></button>)}{!loading.runs && runs.filter((r) => !monthFilter || r.month === monthFilter).length === 0 && <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">No payroll for this selection. Choose a year and month to start a new run.</p>}</div>
          </aside>
          <div className="min-w-0 space-y-5">{run ? <>
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border bg-card p-5"><div><div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-semibold">{run.month} payroll</h2><Badge variant="outline" className={`capitalize ${statusStyle[run.status]}`}>{run.status}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{run.settings.companyName} · {run.policy.name} · Tax year {run.policy.taxYear}</p>{run.notes && <p className="mt-2 text-sm text-muted-foreground">{run.notes}</p>}</div><Button variant="ghost" size="sm" onClick={() => void openAudit()}><History className="mr-2 h-4 w-4" />History</Button></div>
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">{[["Gross salary", totals.gross, Wallet], ["Income tax", totals.tax, FileText], ["Other deductions", totals.deductions, ClipboardList], ["Net payable", totals.net, Banknote]].map(([label, amount, Icon]) => { const StatIcon = Icon as typeof Wallet; return <Card key={String(label)}><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground">{String(label)}</p><StatIcon className="h-4 w-4 text-primary" /></div><p className="mt-3 break-words text-xl font-semibold tracking-tight">{rowsLoading ? "…" : salaryMoney(Number(amount), run.currency)}</p><p className="mt-2 text-xs text-muted-foreground">{rows.length} employee{rows.length === 1 ? "" : "s"}</p></CardContent></Card>; })}</div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/20 p-4"><div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span className={run.status === "draft" ? "font-semibold text-primary" : ""}>Prepare</span><ArrowRight className="h-3 w-3" /><span className={run.status === "submitted" ? "font-semibold text-primary" : ""}>Review</span><ArrowRight className="h-3 w-3" /><span className={run.status === "approved" ? "font-semibold text-primary" : ""}>Approved</span><ArrowRight className="h-3 w-3" /><span className={run.status === "paid" ? "font-semibold text-primary" : ""}>Paid</span></div><div className="flex flex-wrap gap-2">{run.status === "draft" && <Button size="sm" variant="outline" disabled={actionsBusy || !rows.length} onClick={() => void recalculateTax()}>{busy === "recalculate_tax" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Recalculate tax</Button>}{run.status === "draft" && <Button size="sm" disabled={actionsBusy || !rows.length} onClick={() => openAction("submit")}>Submit for approval</Button>}{approver && run.status === "submitted" && <Button size="sm" disabled={runBusy} onClick={() => openAction("approve")}><CheckCircle2 className="mr-2 h-4 w-4" />Approve</Button>}{approver && run.status === "approved" && <Button size="sm" disabled={runBusy} onClick={() => openAction("mark_paid")}>Record payment</Button>}{approver && ["submitted", "approved", "cancelled"].includes(run.status) && <Button size="sm" variant="outline" disabled={runBusy} onClick={() => openAction("return_to_draft")}>{run.status === "cancelled" ? "Restore draft" : "Return to draft"}</Button>}{approver && ["draft", "submitted", "approved"].includes(run.status) && <Button size="sm" variant="ghost" disabled={actionsBusy} onClick={() => openAction("cancel")}>Cancel run</Button>}</div></div>
            {run.status === "paid" && <p className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">Payment recorded on {run.paymentDate} · Reference: {run.paymentReference}. This records payment status; it does not transfer funds.</p>}
            {run.status === "draft" && <div className="space-y-3 rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium">Add active employees</h3>
                <Button size="sm" variant="ghost" disabled={directoryLoading || !!busy} onClick={() => void reloadDirectory()}>
                  <RefreshCw className={"mr-2 h-3.5 w-3.5" + (directoryLoading ? " animate-spin" : "")} />Refresh profiles
                </Button>
              </div>
              <SalaryEmployeePicker key={run.id} employees={candidateOptions} loading={directoryLoading} disabled={runBusy || !!errors.directory} adding={busy === "add_employees"} onAdd={addSelectedEmployees} />
              <p className="text-xs leading-relaxed text-muted-foreground">Select the employees to add, then click Add selected. Only approved, active users with active employee profiles are listed. Employees needing salary details remain visible with the reason they cannot be selected. Employees already in this payroll are excluded.</p>
            </div>}
            <Card><CardContent className="p-0"><div className="flex flex-col gap-3 border-b p-4 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search payroll employees" className="pl-9" placeholder="Search name, employee ID, company…" value={search} onChange={(e) => setSearch(e.target.value)} /></div><select className={`${salarySelectClass} sm:w-48`} aria-label="Department filter" value={department} onChange={(e) => setDepartment(e.target.value)}><option value="">All departments</option>{departments.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>{rowsLoading ? <div className="flex items-center justify-center gap-2 p-12 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading salary records…</div> : !rows.length ? <div className="p-12 text-center"><Wallet className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><h3 className="font-medium">Your payroll draft is ready</h3><p className="mt-2 text-sm text-muted-foreground">Add employees, then review earnings, deductions, and prior tax figures.</p></div> : <SalaryEmployeeTable run={run} rows={filteredRows} disabled={runBusy} actionsDisabled={actionsBusy} onReview={setEmployeeEditor} onRemove={removeEmployee} onUnpaidDaysChange={saveUnpaidDays} />}<p className="border-t px-4 py-3 text-xs text-muted-foreground">{filteredRows.length} of {rows.length} employees · {run.currency} · Salary and tax amounts use this run's saved settings.</p></CardContent></Card>
          {["submitted", "approved", "paid"].includes(run.status) && rows.length > 0 && <SalaryPaymentPanel run={run} rows={rows} disabled={runBusy} onRemove={removeEmployee} />}
          </> : <div className="flex min-h-96 flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center"><ClipboardList className="mb-4 h-12 w-12 text-muted-foreground/60" /><h2 className="text-xl font-semibold">Monthly payroll starts here</h2><p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">Choose a payroll run or create one for a year and month. Employee profiles supply the salary and bank details.</p><Button className="mt-5" disabled={!settings || initialLoading} onClick={() => setNewOpen(true)}><Plus className="mr-2 h-4 w-4" />Create payroll</Button></div>}</div>
        </div>
      </TabsContent>
      <TabsContent value="tax" className="space-y-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-semibold">Tax policies</h2><p className="mt-1 text-sm text-muted-foreground">Maintain annual brackets by tax year and effective dates. Every amount and rate is editable.</p></div>{administrator && <Button onClick={() => setPolicyEditor("new")}><Plus className="mr-2 h-4 w-4" />New tax policy</Button>}</div>{!administrator && <p className="text-sm text-muted-foreground">Main Admin manages tax policies. Finance and Financial Admin can review saved policies.</p>}{loading.policies ? <p className="p-8 text-muted-foreground">Loading tax policies…</p> : !policies.length ? <div className="rounded-xl border border-dashed p-10 text-center"><FileText className="mx-auto mb-3 h-9 w-9 text-muted-foreground" /><h3 className="font-semibold">No tax policy saved</h3><p className="mt-2 text-sm text-muted-foreground">Create a policy, load the attached table into its form, choose the applicable dates, and save.</p></div> : policies.map((p) => <Card key={p.id}><CardContent className="space-y-4 p-5"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-semibold">{p.name} <Badge className="ml-2 capitalize" variant="outline">{p.status}</Badge></h3><p className="mt-2 text-xs text-muted-foreground">Tax year {p.taxYear} · {p.effectiveFrom} → {p.effectiveTo} · {p.currency}</p>{p.source && <p className="mt-1 break-words text-xs text-muted-foreground">Source: {p.source}</p>}</div>{administrator && <Button variant="outline" size="sm" onClick={() => setPolicyEditor(p)}>Edit policy</Button>}</div><Table><TableHeader><TableRow><TableHead>Annual taxable income</TableHead><TableHead>Fixed tax</TableHead><TableHead>Rate on excess</TableHead></TableRow></TableHeader><TableBody>{p.brackets.map((b, i) => <TableRow key={i}><TableCell>{i === 0 && b.upper === null ? "All annual taxable income" : `${i === 0 ? "Up to" : "Above"} ${salaryMoney(i === 0 ? b.upper! : b.lower, p.currency)}${i > 0 && b.upper !== null ? ` up to ${salaryMoney(b.upper, p.currency)}` : ""}`}</TableCell><TableCell>{salaryMoney(b.fixedTax, p.currency)}</TableCell><TableCell>{b.rate}%</TableCell></TableRow>)}</TableBody></Table>{p.surcharge.enabled && <p className="text-xs text-muted-foreground">Surcharge: {p.surcharge.rate}% of calculated tax when annual taxable income exceeds {salaryMoney(p.surcharge.threshold, p.currency)}.</p>}</CardContent></Card>)}</TabsContent>
      <TabsContent value="settings" className="space-y-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-semibold">Payroll settings</h2><p className="mt-1 text-sm text-muted-foreground">Control salary components, tax treatment, proration, and recurring deductions.</p></div>{administrator && <Button onClick={() => setSettingsOpen(true)}><Settings2 className="mr-2 h-4 w-4" />{settings ? "Edit settings" : "Set up payroll"}</Button>}</div><div className="rounded-xl border bg-muted/20 p-4 text-sm"><p><strong>Preparation:</strong> Finance, Financial Admin, Main Admin.</p><p className="mt-2"><strong>Approval and payment:</strong> Main Admin and Financial Admin.</p><p className="mt-2"><strong>Settings and tax policies:</strong> Main Admin.</p></div>{settings ? <Card><CardContent className="space-y-5 p-5"><div><h3 className="font-semibold">{settings.companyName}</h3><p className="mt-1 text-sm text-muted-foreground">{settings.companyAddress}</p><p className="mt-2 text-sm">Currency: {settings.currency} · Proration: {settings.proration.replace(/_/g, " ")}{settings.proration === "fixed_days" ? ` (${settings.fixedDays} days)` : ""}</p></div><Table><TableHeader><TableRow><TableHead>Salary component</TableHead><TableHead>Percentage</TableHead></TableRow></TableHeader><TableBody>{settings.components.map((c) => <TableRow key={c.id}><TableCell>{c.name}{c.id === settings.basicComponentId ? " (basic)" : ""}</TableCell><TableCell>{c.percentage}%</TableCell></TableRow>)}</TableBody></Table><p className="text-sm text-muted-foreground">Income tax uses each employee's annual taxable salary: total monthly salary × 12, adjusted for days worked in the tax year, less the medical allowance. Separately marked taxable allowances/earnings are added and pre-tax deductions reduce it.</p><p className="text-sm text-muted-foreground">Profile increments: {settings.applyProfileIncrement ? "Added separately after their effective date" : "Not added separately"}</p><div><h4 className="text-sm font-medium">Profile allowances</h4>{settings.profileAllowances.length ? settings.profileAllowances.map((a) => <p key={a.id} className="mt-2 text-sm text-muted-foreground">{a.name} · {a.taxable ? "Taxable" : "Non-taxable"} · {a.prorate ? "Prorated" : "Full amount"}</p>) : <p className="mt-2 text-sm text-muted-foreground">No additional profile allowances included.</p>}</div><div><h4 className="text-sm font-medium">Recurring deductions</h4>{settings.deductions.length ? settings.deductions.map((d) => <p key={d.id} className="mt-2 text-sm text-muted-foreground">{d.name}: {d.kind === "fixed" ? salaryMoney(d.value, settings.currency) : `${d.value}% of ${d.kind === "percent_basic" ? "basic" : "gross"}`} · {d.preTax ? "Pre-tax" : "Post-tax"}</p>) : <p className="mt-2 text-sm text-muted-foreground">No recurring deductions configured.</p>}</div></CardContent></Card> : <p className="rounded-xl border border-dashed p-8 text-sm text-muted-foreground">Main Admin needs to save the payroll settings before salary runs can be created.</p>}</TabsContent>
      <TabsContent value="reports" className="space-y-5"><div><h2 className="text-xl font-semibold">Reports & payslips</h2><p className="mt-1 text-sm text-muted-foreground">Select a saved payroll run to export its register, tax figures, and payslips.</p></div><SalaryField label="Payroll year, month & currency"><select className={salarySelectClass} value={selectedId} onChange={(e) => setSelectedId(e.target.value)}><option value="">Choose payroll</option>{runs.map((r) => <option key={r.id} value={r.id}>{r.month} · {r.currency} · {r.status}</option>)}</select></SalaryField>{run && <><div className="grid gap-4 md:grid-cols-2"><Card><CardContent className="p-5"><FileText className="mb-3 h-6 w-6 text-primary" /><h3 className="font-semibold">Salary & tax register</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Employee earnings, withholding, deductions, net pay, and annual tax projections for {run.month}.</p><Button className="mt-4" variant="outline" disabled={runBusy || !rows.length} onClick={() => exportSalaryRegister(run, rows)}><Download className="mr-2 h-4 w-4" />Export full run CSV</Button></CardContent></Card><Card><CardContent className="p-5"><Banknote className="mb-3 h-6 w-6 text-primary" /><h3 className="font-semibold">Bank payment register</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Account details and net amounts for bank-transfer employees. Available after approval; check your bank's upload format.</p><Button className="mt-4" variant="outline" disabled={runBusy || !rows.length || !["approved", "paid"].includes(run.status) || salaryBankIssues(rows).length > 0} onClick={() => { try { exportSalaryBank(run, rows); } catch (e) { setError("action", errorMessage(e)); } }}><Download className="mr-2 h-4 w-4" />Export bank CSV</Button>{salaryBankIssues(rows).length > 0 && <p className="mt-2 text-xs text-destructive">{salaryBankIssues(rows).length} employee(s) have incomplete bank details.</p>}</CardContent></Card></div><Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Taxable income</TableHead><TableHead>Income tax</TableHead><TableHead>Net pay</TableHead><TableHead>Payslip</TableHead></TableRow></TableHeader><TableBody>{rows.map((e) => <TableRow key={e.id}><TableCell>{e.profile.personal.fullName}</TableCell><TableCell>{salaryMoney(e.calculation.taxable, run.currency)}</TableCell><TableCell>{salaryMoney(e.calculation.incomeTax, run.currency)}</TableCell><TableCell>{salaryMoney(e.calculation.net, run.currency)}</TableCell><TableCell><Button size="sm" variant="outline" disabled={runBusy} onClick={() => downloadSalaryPayslip(run, e)}><Download className="mr-2 h-3.5 w-3.5" />PDF</Button></TableCell></TableRow>)}</TableBody></Table></CardContent></Card></>}</TabsContent>
    </Tabs>
    {settingsOpen && <SalarySettingsEditor initial={settings} onClose={() => setSettingsOpen(false)} />}
    {policyEditor && <TaxPolicyEditor initial={policyEditor === "new" ? undefined : policyEditor} onClose={() => setPolicyEditor(null)} />}
    {employeeEditor && run && <SalaryEmployeeEditor run={run} employee={employeeEditor} profile={directory.find((p) => p.id === employeeEditor.userId) || employeeEditor.profile} onClose={() => setEmployeeEditor(null)} />}
    <Dialog open={newOpen} onOpenChange={(open) => { if (!busy) setNewOpen(open); }}><DialogContent><DialogHeader><DialogTitle>Create monthly payroll</DialogTitle><DialogDescription>Select a year and month, then choose a tax policy that covers the whole month.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void createRun(); }}><SalaryField label="Payroll year & month"><Input type="month" required value={newMonth} onChange={(e) => { setNewMonth(e.target.value); setNewPolicy(""); }} /></SalaryField><SalaryField label="Tax policy"><select className={salarySelectClass} required value={newPolicy} onChange={(e) => setNewPolicy(e.target.value)}><option value="">Select an active policy</option>{validPolicies.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.taxYear}</option>)}</select></SalaryField>{!validPolicies.length && <p className="text-sm text-amber-800 dark:text-amber-300">No active policy covers this month in {settings?.currency || "the configured currency"}. Main Admin must save one in Tax policies.</p>}<SalaryField label="Payroll notes"><Textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} maxLength={2000} /></SalaryField>{errors.action && <p role="alert" className="text-sm text-destructive">{errors.action}</p>}<DialogFooter><Button type="button" variant="outline" disabled={!!busy} onClick={() => setNewOpen(false)}>Cancel</Button><Button type="submit" disabled={!!busy || !newPolicy || !settings}>{busy === "create" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create draft</Button></DialogFooter></form></DialogContent></Dialog>
    <Dialog open={!!action} onOpenChange={(open) => { if (!open && !busy) setAction(null); }}><DialogContent><DialogHeader><DialogTitle>{action ? actionLabels[action] : "Payroll action"}</DialogTitle><DialogDescription>{run?.month} · {rows.length} employees · Net payable {run ? salaryMoney(totals.net, run.currency) : ""}</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void performAction(); }}>{action === "submit" && <p className="text-sm text-muted-foreground">Review prior taxable income and tax paid for every employee. Submitting locks the draft for review.</p>}{action === "approve" && <p className="text-sm text-muted-foreground">Confirm these salary and tax figures. Employee details and payroll amounts will remain fixed until the run is explicitly returned to draft.</p>}{action === "mark_paid" && <><SalaryField label="Payment date"><Input type="date" value={paymentDate} required onChange={(e) => setPaymentDate(e.target.value)} /></SalaryField><SalaryField label="Payment / transaction reference"><Input value={paymentReference} required maxLength={300} onChange={(e) => setPaymentReference(e.target.value)} /></SalaryField><p className="text-xs text-muted-foreground">Record this after paying employees. Each employee's net pay is deducted from their From account's balance, and this can't be undone. This action does not initiate a bank transfer.</p></>}{(action === "return_to_draft" || action === "cancel") && <SalaryField label="Reason"><Textarea required value={reason} onChange={(e) => setReason(e.target.value)} maxLength={2000} /></SalaryField>}{errors.action && <p role="alert" className="text-sm text-destructive">{errors.action}</p>}<DialogFooter><Button type="button" variant="outline" disabled={!!busy} onClick={() => setAction(null)}>Close</Button><Button disabled={!!busy} type="submit">{!!busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{action ? actionLabels[action] : "Confirm"}</Button></DialogFooter></form></DialogContent></Dialog>
    <Dialog open={auditOpen} onOpenChange={setAuditOpen}><DialogContent className="max-h-[85dvh] overflow-y-auto"><DialogHeader><DialogTitle>Payroll history</DialogTitle><DialogDescription>{run?.month} · Changes recorded by the salary workflow.</DialogDescription></DialogHeader>{auditLoading ? <p className="p-6 text-muted-foreground">Loading history…</p> : <div className="space-y-3">{audit.map((entry) => <div key={entry.id} className="rounded-lg border p-3"><p className="text-sm font-medium capitalize">{entry.action.replace(/_/g, " ")}{entry.employeeName ? ` · ${entry.employeeName}` : ""}</p><p className="mt-1 break-words text-xs text-muted-foreground">By {entry.actorId} · {entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleString() : "Pending timestamp"}</p>{entry.reason && <p className="mt-2 text-sm">{entry.reason}</p>}</div>)}{!audit.length && <p className="text-sm text-muted-foreground">No history available.</p>}</div>}</DialogContent></Dialog>
  </div>;
}
