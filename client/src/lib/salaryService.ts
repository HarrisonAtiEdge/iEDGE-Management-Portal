import {
  collection, doc, getDocFromServer, getDocsFromServer, limit, onSnapshot, orderBy, query,
  runTransaction, serverTimestamp, where, type Transaction,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { employeeProfileDetailsWithDefaults, isActiveEmployeeUser, type EmployeeProfile, type EmployeeProfileDetails, type EmployeeSourceUser } from "./employeeProfileModel";
import {
  calculateSalary, canAccessSalary, canApproveSalary, defaultSalaryInput, roundMoney, salaryMonthBounds,
  salaryApprovalIssues, salaryInputSchema, salarySettingsSchema, salaryTotals, taxForMonthsWithoutRuns, taxPolicySchema,
  type SalaryEmployee, type SalaryInput, type SalaryRun, type SalarySettings, type TaxPolicy, type Versioned,
} from "./salaryModel";
import { salaryAccountEntries, salaryPaymentIssues, salaryPaymentSchema, salaryTransferLetterSchema, type SalaryPayment, type SalaryTransferLetter } from "./salaryPayment";

const panel = ["Panels", "IEDGE-SYSTEM"] as const;
const runs = collection(db, ...panel, "Salary");
const policies = collection(db, ...panel, "SalaryTaxPolicies");
const settingsRef = doc(db, ...panel, "SalarySettings", "payroll");
const accountEntries = collection(db, ...panel, "salaryPayments");
const userRef = (uid: string) => doc(db, ...panel, "users", uid);
const profileRef = (uid: string) => doc(db, ...panel, "EmployeeProfile", uid);
const runRef = (id: string) => doc(runs, id);
const rowsRef = (id: string) => collection(runRef(id), "employees");
const rowRef = (id: string, uid: string) => doc(rowsRef(id), uid);
const letterRef = (id: string, accountKey: string) => doc(collection(runRef(id), "letters"), accountKey.replace(/\//g, "_"));

async function requireActor(transaction: Transaction, permission: "prepare" | "approve" | "settings" = "prepare") {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Please sign in again.");
  const snapshot = await transaction.get(userRef(uid));
  const user = { ...snapshot.data(), id: uid } as EmployeeSourceUser;
  if (!snapshot.exists() || !isActiveEmployeeUser(user) || !canAccessSalary(user.role)) throw new Error("Only active Finance, Financial Admin, and Main Admin users can access salary management.");
  if (permission === "approve" && !canApproveSalary(user.role)) throw new Error("Only Main Admin and Financial Admin can approve payroll or record payments.");
  if (permission === "settings" && user.role !== "main_admin") throw new Error("Only Main Admin can change salary settings and tax policies.");
  return uid;
}
function audit(transaction: Transaction, id: string, actor: string, action: string, details: Record<string, unknown> = {}) {
  transaction.set(doc(collection(runRef(id), "audit")), { action, actorId: actor, ...details, createdAt: serverTimestamp() });
}
const changed = (uid: string) => ({ updatedById: uid, updatedAt: serverTimestamp() });

export function subscribeSalarySettings(onValue: (value: Versioned<SalarySettings> | null) => void, onError: (error: Error) => void) {
  return onSnapshot(settingsRef, (snapshot) => onValue(snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } as Versioned<SalarySettings> : null), onError);
}
export function subscribeSalaryPolicies(onValue: (values: Versioned<TaxPolicy>[]) => void, onError: (error: Error) => void) {
  return onSnapshot(policies, (snapshot) => onValue(snapshot.docs.map((s) => ({ ...s.data(), id: s.id }) as Versioned<TaxPolicy>).sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))), onError);
}
export function subscribeSalaryRuns(onValue: (values: SalaryRun[]) => void, onError: (error: Error) => void, month = "") {
  const selection = month ? query(runs, where("month", "==", month)) : query(runs, orderBy("month", "desc"), limit(60));
  return onSnapshot(selection, (snapshot) => onValue(snapshot.docs.map((s) => ({ ...s.data(), id: s.id }) as SalaryRun)), onError);
}
export function subscribeSalaryEmployees(id: string, onValue: (values: SalaryEmployee[]) => void, onError: (error: Error) => void) {
  return onSnapshot(rowsRef(id), (snapshot) => onValue(snapshot.docs.map((s) => ({ ...s.data(), id: s.id }) as SalaryEmployee).sort((a, b) => a.profile.personal.fullName.localeCompare(b.profile.personal.fullName))), onError);
}
export async function fetchSalaryAudit(id: string) {
  const snapshot = await getDocsFromServer(query(collection(runRef(id), "audit"), orderBy("createdAt", "desc"), limit(100)));
  return snapshot.docs.map((s) => ({ ...s.data(), id: s.id })) as Array<{ id: string; actorId: string; action: string; createdAt?: { toDate(): Date }; reason?: string; employeeName?: string }>;
}
export async function saveSalarySettings(input: SalarySettings, expectedRevision: number | null) {
  const details = salarySettingsSchema.parse(input);
  await runTransaction(db, async (transaction) => {
    const [uid, existing] = await Promise.all([requireActor(transaction, "settings"), transaction.get(settingsRef)]);
    if ((existing.exists() ? existing.data().revision : null) !== expectedRevision) throw new Error("Settings changed. Reload the form before saving.");
    transaction.set(settingsRef, { ...details, revision: (expectedRevision ?? -1) + 1, ...changed(uid) });
  });
}
export async function saveSalaryTaxPolicy(input: TaxPolicy, existing?: { id: string; revision: number }) {
  const details = taxPolicySchema.parse(input);
  const reference = existing ? doc(policies, existing.id) : doc(policies);
  await runTransaction(db, async (transaction) => {
    const [uid, snapshot] = await Promise.all([requireActor(transaction, "settings"), transaction.get(reference)]);
    if ((snapshot.exists() ? snapshot.data().revision : undefined) !== existing?.revision) throw new Error("The tax policy changed. Reopen it before saving.");
    transaction.set(reference, { ...details, revision: existing ? existing.revision + 1 : 0, ...changed(uid) });
  });
  return reference.id;
}

// This directory is read-only: opening Salary never imports profiles or writes data.
export async function fetchSalaryDirectory() {
  const [users, profiles] = await Promise.all([
    getDocsFromServer(query(collection(db, ...panel, "users"), where("accountStatus", "==", "approved"))),
    getDocsFromServer(collection(db, ...panel, "EmployeeProfile")),
  ]);
  const active = new Set(users.docs.filter((s) => isActiveEmployeeUser({ ...s.data(), id: s.id } as EmployeeSourceUser)).map((s) => s.id));
  return profiles.docs.filter((s) => active.has(s.id)).map((s) => ({ ...s.data(), ...employeeProfileDetailsWithDefaults(s.data()), id: s.id }) as EmployeeProfile)
    .filter((p) => p.employment.employmentStatus === "active");
}
export async function createSalaryRun(month: string, policyId: string, notes: string) {
  const period = salaryMonthBounds(month);
  return runTransaction(db, async (transaction) => {
    const [uid, settingsSnapshot, policySnapshot] = await Promise.all([requireActor(transaction), transaction.get(settingsRef), transaction.get(doc(policies, policyId))]);
    if (!settingsSnapshot.exists()) throw new Error("Save payroll settings first.");
    if (!policySnapshot.exists()) throw new Error("Save a tax policy first.");
    const settings = salarySettingsSchema.parse(settingsSnapshot.data());
    const policy = taxPolicySchema.parse(policySnapshot.data());
    if (policy.status !== "active" || policy.effectiveFrom > period.start || policy.effectiveTo < period.end) throw new Error("Choose an active policy covering the full selected month.");
    if (settings.currency !== policy.currency) throw new Error("The policy currency must match payroll settings.");
    const baseId = `${month}_${settings.currency}`;
    const existing = await transaction.get(runRef(baseId));
    // A month can have several runs, so a new one must never overwrite an earlier one.
    const id = existing.exists() ? `${baseId}_${doc(runs).id}` : baseId;
    transaction.set(runRef(id), {
      month, currency: settings.currency, notes: notes.trim().slice(0, 2000), status: "draft", revision: 0,
      settings, policy, policyId, settingsRevision: settingsSnapshot.data().revision, policyRevision: policySnapshot.data().revision,
      createdById: uid, createdAt: serverTimestamp(), ...changed(uid),
    });
    audit(transaction, id, uid, "created");
    return id;
  });
}
// Reads each earlier run once for everyone, rather than once per employee.
async function priorSalaryTotals(run: SalaryRun, userIds: string[]) {
  const snapshots = await getDocsFromServer(query(runs, where("currency", "==", run.currency)));
  const priorRuns = snapshots.docs.map((s) => ({ ...s.data(), id: s.id }) as SalaryRun).filter((r) =>
    (r.status === "approved" || r.status === "paid") && r.month < run.month && r.month >= run.policy.effectiveFrom.slice(0, 7));
  const lists = await Promise.all(priorRuns.map((r) => getDocsFromServer(rowsRef(r.id))));
  const rows = lists.flatMap((list, index) => list.docs.map((s) => ({ ...s.data(), id: s.id, month: priorRuns[index].month }) as SalaryEmployee & { month: string }));
  return new Map(userIds.map((userId) => {
    const own = rows.filter((row) => row.id === userId);
    // Salary is already in the annual formula, so only carry forward other taxable income.
    const otherTaxable = own.reduce((sum, row) => sum + (row.calculation.otherTaxableIncome ?? 0), 0);
    return [userId, { ytdTaxable: Math.round(otherTaxable * 100) / 100, ytdTaxPaid: salaryTotals(own).tax, months: own.map((row) => row.month) }];
  }));
}
type PriorTotals = Awaited<ReturnType<typeof priorSalaryTotals>> extends Map<string, infer T> ? T : never;
function inputWithPriorTax(run: Pick<SalaryRun, "month" | "settings" | "policy">, profile: EmployeeProfileDetails, input: SalaryInput, prior: PriorTotals): SalaryInput {
  const recorded = { ...input, ytdTaxable: prior.ytdTaxable, ytdTaxPaid: prior.ytdTaxPaid };
  return { ...recorded, ytdTaxPaid: roundMoney(prior.ytdTaxPaid + taxForMonthsWithoutRuns(profile, run.month, run.settings, run.policy, recorded, prior.months)) };
}
export async function fetchPriorSalaryTotals(run: SalaryRun, userId: string, profile: EmployeeProfileDetails, input: SalaryInput) {
  const { ytdTaxable, ytdTaxPaid } = inputWithPriorTax(run, profile, input, (await priorSalaryTotals(run, [userId])).get(userId)!);
  return { ytdTaxable, ytdTaxPaid };
}
const readEmployee = async (transaction: Transaction, runId: string, userId: string) => {
  const [user, profile, existing] = await Promise.all([transaction.get(userRef(userId)), transaction.get(profileRef(userId)), transaction.get(rowRef(runId, userId))]);
  return { userId, user, profile, existing };
};
// Checks an employee and calculates their row. Throws without writing anything.
function buildSalaryRow(run: SalaryRun, { userId, user, profile: profileSnapshot, existing }: Awaited<ReturnType<typeof readEmployee>>, input: SalaryInput, expectedRevision: number | null, uid: string) {
  if ((existing.exists() ? existing.data().revision : null) !== expectedRevision) throw new Error("This salary changed. Reopen it before saving.");
  if (!user.exists() || !isActiveEmployeeUser({ ...user.data(), id: userId } as EmployeeSourceUser)) throw new Error("This user is no longer active.");
  if (!profileSnapshot.exists()) throw new Error("Create the employee profile first.");
  const profile = employeeProfileDetailsWithDefaults(profileSnapshot.data());
  if (profile.employment.employmentStatus !== "active") throw new Error("This employee is no longer active.");
  const calculation = calculateSalary(profile, run.month, run.settings, run.policy, input);
  // Payment details survive a return to draft, so they aren't re-entered.
  const payment = existing.exists() ? existing.data().payment : undefined;
  const revision = (expectedRevision ?? -1) + 1;
  return { profile, calculation, revision, row: { userId, profile, profileRevision: profileSnapshot.data().revision ?? 0, input, calculation, revision, ...(payment ? { payment } : {}), ...changed(uid) } };
}
export async function saveSalaryEmployee(runId: string, userId: string, input: SalaryInput, expectedRevision: number | null) {
  const cleanInput = salaryInputSchema.parse(input);
  return runTransaction(db, async (transaction) => {
    const [uid, runSnapshot, employee] = await Promise.all([requireActor(transaction), transaction.get(runRef(runId)), readEmployee(transaction, runId, userId)]);
    if (!runSnapshot.exists() || runSnapshot.data().status !== "draft") throw new Error("Only draft payroll can be edited.");
    const run = runSnapshot.data() as SalaryRun;
    const { row, profile, calculation, revision } = buildSalaryRow(run, employee, cleanInput, expectedRevision, uid);
    transaction.set(rowRef(runId, userId), row);
    transaction.update(runRef(runId), { revision: run.revision + 1, ...changed(uid) });
    audit(transaction, runId, uid, employee.existing.exists() ? "salary_updated" : "employee_added", { employeeId: userId, employeeName: profile.personal.fullName, input: cleanInput, calculation });
    return revision;
  }, { maxAttempts: 10 });
}
// Saves many employees with fresh prior tax in one transaction. One failing doesn't stop the rest.
async function saveWithPriorTax(run: SalaryRun, items: Array<{ userId: string; input?: SalaryInput; revision: number | null }>) {
  const prior = await priorSalaryTotals(run, items.map((item) => item.userId));
  return runTransaction(db, async (transaction) => {
    const [uid, runSnapshot, employees] = await Promise.all([requireActor(transaction), transaction.get(runRef(run.id)), Promise.all(items.map((item) => readEmployee(transaction, run.id, item.userId)))]);
    if (!runSnapshot.exists() || runSnapshot.data().status !== "draft") throw new Error("Only draft payroll can be edited.");
    const current = runSnapshot.data() as SalaryRun;
    const added: string[] = [], failures: Array<{ userId: string; message: string }> = [];
    employees.forEach((employee, index) => {
      const { userId, input: existingInput, revision } = items[index];
      try {
        const base = salaryInputSchema.parse({ ...(existingInput ?? defaultSalaryInput(current.month, current.policy)), ytdTaxable: prior.get(userId)!.ytdTaxable, ytdTaxPaid: prior.get(userId)!.ytdTaxPaid });
        // Building first runs every check, so an ineligible employee reports why.
        const checked = buildSalaryRow(current, employee, base, revision, uid);
        const input = salaryInputSchema.parse(inputWithPriorTax(current, checked.profile, base, prior.get(userId)!));
        const { row, profile, calculation } = buildSalaryRow(current, employee, input, revision, uid);
        transaction.set(rowRef(run.id, userId), row);
        audit(transaction, run.id, uid, revision === null ? "employee_added" : "salary_updated", { employeeId: userId, employeeName: profile.personal.fullName, input, calculation });
        added.push(userId);
      } catch (e) { failures.push({ userId, message: e instanceof Error ? e.message : "Could not save this employee." }); }
    });
    if (added.length) transaction.update(runRef(run.id), { revision: current.revision + 1, ...changed(uid) });
    return { added, failures };
  }, { maxAttempts: 10 });
}
export const addSalaryEmployees = (run: SalaryRun, userIds: string[]) => saveWithPriorTax(run, userIds.map((userId) => ({ userId, revision: null })));
/** Refreshes prior tax for everyone already in a draft run. Other inputs are kept. */
export const recalculateSalaryTax = (run: SalaryRun, rows: SalaryEmployee[]) => saveWithPriorTax(run, rows.map((row) => ({ userId: row.userId, input: row.input, revision: row.revision })));
export async function addSalaryEmployee(run: SalaryRun, userId: string) {
  const { failures } = await addSalaryEmployees(run, [userId]);
  if (failures.length) throw new Error(failures[0].message);
}
export async function removeSalaryEmployee(runId: string, userId: string, expectedRevision: number) {
  await runTransaction(db, async (transaction) => {
    const [uid, run, existing] = await Promise.all([requireActor(transaction), transaction.get(runRef(runId)), transaction.get(rowRef(runId, userId))]);
    if (!run.exists() || !["draft", "submitted"].includes(run.data().status)) throw new Error("Return payroll to draft to remove an employee after approval.");
    if (!existing.exists() || existing.data().revision !== expectedRevision) throw new Error("This salary changed. Reload before removing it.");
    transaction.delete(rowRef(runId, userId));
    transaction.update(runRef(runId), { revision: run.data().revision + 1, ...changed(uid) });
    audit(transaction, runId, uid, "employee_removed", { employeeId: userId, employeeName: existing.data().profile.personal.fullName });
  });
}
// Payment details never change payroll amounts, so they stay editable through
// review and after approval, until the run is recorded as paid.
export async function saveSalaryPayments(runId: string, updates: Array<{ userId: string; payment: SalaryPayment }>) {
  const clean = updates.map((update) => ({ userId: update.userId, payment: salaryPaymentSchema.parse(update.payment) }));
  await runTransaction(db, async (transaction) => {
    const [uid, run, snapshots] = await Promise.all([requireActor(transaction), transaction.get(runRef(runId)), Promise.all(clean.map((update) => transaction.get(rowRef(runId, update.userId))))]);
    if (!run.exists() || !["submitted", "approved"].includes(run.data().status)) throw new Error("Payment details can only be changed during review or after approval.");
    clean.forEach((update, index) => {
      const snapshot = snapshots[index];
      if (!snapshot.exists()) throw new Error("An employee was removed from this payroll. Reload and try again.");
      const missing = update.payment.method ? salaryPaymentIssues(update.payment) : [];
      if (missing.length) throw new Error(`${snapshot.data().profile.personal.fullName}: enter ${missing.join(", ")}.`);
    });
    clean.forEach((update) => transaction.update(rowRef(runId, update.userId), { payment: update.payment, ...changed(uid) }));
    transaction.update(runRef(runId), { revision: run.data().revision + 1, ...changed(uid) });
    audit(transaction, runId, uid, "payment_details_updated", { employeeCount: clean.length });
  });
}
export async function markSalaryRtgsLetter(runId: string, userId: string, serialNo: string) {
  await runTransaction(db, async (transaction) => {
    const [uid, row] = await Promise.all([requireActor(transaction), transaction.get(rowRef(runId, userId))]);
    if (!row.exists()) throw new Error("This employee is no longer in the payroll.");
    transaction.update(rowRef(runId, userId), { "payment.rtgsSerialNo": serialNo, ...changed(uid) });
    audit(transaction, runId, uid, "rtgs_letter_created", { employeeId: userId, employeeName: row.data().profile.personal.fullName, serialNo });
  });
}
export async function fetchSalaryTransferLetter(runId: string, accountKey: string) {
  const snapshot = await getDocFromServer(letterRef(runId, accountKey));
  return snapshot.exists() ? salaryTransferLetterSchema.parse(snapshot.data()) : null;
}
export async function saveSalaryTransferLetter(runId: string, accountKey: string, letter: SalaryTransferLetter) {
  const clean = salaryTransferLetterSchema.parse(letter);
  await runTransaction(db, async (transaction) => {
    const [uid, run] = await Promise.all([requireActor(transaction), transaction.get(runRef(runId))]);
    if (!run.exists() || !["approved", "paid"].includes(run.data().status)) throw new Error("Approve payroll before saving a transfer letter.");
    transaction.set(letterRef(runId, accountKey), { ...clean, ...changed(uid) });
    audit(transaction, runId, uid, "transfer_letter_saved", { accountKey });
  });
}
export type SalaryAction = "submit" | "approve" | "return_to_draft" | "mark_paid" | "cancel";
export async function transitionSalaryRun(id: string, expectedRevision: number, action: SalaryAction, options: { reason?: string; paymentDate?: string; paymentReference?: string } = {}) {
  const rows = (await getDocsFromServer(rowsRef(id))).docs.map((s) => ({ ...s.data(), id: s.id }) as SalaryEmployee);
  await runTransaction(db, async (transaction) => {
    // Every employee's records are checked at once, not one after another.
    const toCheck = action === "submit" || action === "approve" ? rows : [];
    const [uid, snapshot, sources] = await Promise.all([
      requireActor(transaction, action === "submit" ? "prepare" : "approve"),
      transaction.get(runRef(id)),
      Promise.all(toCheck.map(async (row) => {
        const [source, profile] = await Promise.all([transaction.get(userRef(row.userId)), transaction.get(profileRef(row.userId))]);
        return { row, source, profile };
      })),
    ]);
    if (!snapshot.exists() || snapshot.data().revision !== expectedRevision) throw new Error("Payroll changed. Review the latest amounts before continuing.");
    const run = snapshot.data() as SalaryRun;
    const transitions: Record<SalaryAction, { from: SalaryRun["status"][]; to: SalaryRun["status"] }> = {
      submit: { from: ["draft"], to: "submitted" }, approve: { from: ["submitted"], to: "approved" },
      return_to_draft: { from: ["submitted", "approved", "cancelled"], to: "draft" },
      mark_paid: { from: ["approved"], to: "paid" }, cancel: { from: ["draft", "submitted", "approved"], to: "cancelled" },
    };
    if (!transitions[action].from.includes(run.status)) throw new Error("This action is unavailable for the current payroll status.");
    if ((action === "return_to_draft" || action === "cancel") && !options.reason?.trim()) throw new Error("Enter a reason for this action.");
    if (action === "mark_paid") {
      const incomplete = rows.flatMap((row) => { const missing = salaryPaymentIssues(row.payment); return missing.length ? [`${row.profile.personal.fullName} (${missing.join(", ")})`] : []; });
      if (incomplete.length) throw new Error(`Complete the payment details first: ${incomplete.join("; ")}.`);
      if (!options.paymentDate || !/^\d{4}-\d{2}-\d{2}$/.test(options.paymentDate) || Number.isNaN(Date.parse(options.paymentDate)) || new Date(options.paymentDate).toISOString().slice(0, 10) !== options.paymentDate || !options.paymentReference?.trim()) throw new Error("Enter a valid payment date and payment reference.");
    }
    if (action === "submit" || action === "approve") {
      if (!rows.length) throw new Error("Add at least one employee before submitting payroll.");
      // Read the header first: every row change increments it, so this rejects
      // concurrent edits made before OR after the directory snapshot was read.
      for (const { row, source, profile } of sources) {
        if (!source.exists() || !isActiveEmployeeUser({ ...source.data(), id: row.userId } as EmployeeSourceUser) || !profile.exists() || profile.data().employment?.employmentStatus !== "active") throw new Error(`${row.profile.personal.fullName} is no longer active. Return payroll to draft and review this employee.`);
        if ((profile.data().revision ?? 0) !== row.profileRevision) throw new Error(`${row.profile.personal.fullName}'s profile changed. Reopen their salary and save it again before approval.`);
        const missing = salaryApprovalIssues(row.profile);
        if (missing.length) throw new Error(`${row.profile.personal.fullName}: complete ${missing.join(", ")} in Employee Profile, then reopen and save this salary.`);
        const checked = calculateSalary(row.profile, run.month, run.settings, run.policy, row.input);
        const stable = (value: unknown): string => JSON.stringify(value, (_key, item) => item && typeof item === "object" && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map((key) => [key, item[key]])) : item);
        if (stable(checked) !== stable(row.calculation)) throw new Error("Salary calculations changed. Reopen and save the affected employee before approval.");
      }
    }
    const next = {
      status: transitions[action].to, revision: run.revision + 1, employeeCount: rows.length, totals: salaryTotals(rows), ...changed(uid),
      ...(action === "approve" ? { approvedById: uid, approvedAt: serverTimestamp() } : {}),
      ...(action === "mark_paid" ? { paidById: uid, paidAt: serverTimestamp(), paymentDate: options.paymentDate, paymentReference: options.paymentReference!.trim().slice(0, 300) } : {}),
    };
    // A paid run can't be reopened, so this is the single point money leaves the accounts.
    if (action === "mark_paid") {
      for (const entry of salaryAccountEntries(id, run.month, rows, options.paymentDate!, options.paymentReference!.trim())) {
        transaction.set(doc(accountEntries, entry.id), { ...entry, status: "completed", createdById: uid, createdAt: serverTimestamp() });
      }
    }
    transaction.update(runRef(id), next);
    audit(transaction, id, uid, action, { reason: options.reason?.trim().slice(0, 2000) || "", ...(action === "mark_paid" ? { paymentDate: options.paymentDate, paymentReference: options.paymentReference } : {}) });
  });
}
