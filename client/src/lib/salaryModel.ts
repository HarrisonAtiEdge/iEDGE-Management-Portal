import { z } from "zod";
import { employeeProfileDetailsSchema, type EmployeeProfileDetails } from "./employeeProfileModel";
import type { SalaryPayment } from "./salaryPayment";

export const SALARY_PATH = "/salary";
export const SALARY_ROLES = ["main_admin", "financial_admin", "finance"] as const;
export const canAccessSalary = (role: unknown) => SALARY_ROLES.some((item) => item === role);
export const canApproveSalary = (role: unknown) => role === "main_admin" || role === "financial_admin";
const money = z.number().finite().min(0).max(1_000_000_000).refine((n) => Number(n.toFixed(2)) === n, "Use at most 2 decimal places.");
const signedMoney = z.number().finite().min(-1_000_000_000).max(1_000_000_000).refine((n) => Number(n.toFixed(2)) === n, "Use at most 2 decimal places.");
const required = z.string().trim().min(1).max(200);
const identifier = z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/, "Use letters, numbers, underscores, or hyphens for IDs.");
const date = z.string().refine((s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s, "Enter a valid date.");
const currency = z.string().trim().regex(/^[A-Z]{3}$/, "Use a 3-letter currency code.");
export const roundMoney = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export const componentSchema = z.object({ id: identifier, name: required, percentage: z.number().finite().min(0).max(100), taxable: z.boolean() });
export const deductionSchema = z.object({
  id: identifier, name: required, kind: z.enum(["fixed", "percent_gross", "percent_basic"]),
  value: money, preTax: z.boolean(),
}).refine((d) => d.kind === "fixed" || d.value <= 100, "Deduction percentage cannot exceed 100.");
export const salarySettingsSchema = z.object({
  companyName: required, companyAddress: z.string().trim().max(1000), currency,
  proration: z.enum(["calendar_days", "fixed_days", "none"]), fixedDays: z.number().int().min(1).max(366),
  applyProfileIncrement: z.boolean(),
  profileAllowances: z.array(z.object({ id: identifier, name: required, source: z.enum(["transportAllowance", "otherAllowances"]), taxable: z.boolean(), prorate: z.boolean() })).max(2),
  basicComponentId: identifier,
  components: z.array(componentSchema).min(1).max(30), deductions: z.array(deductionSchema).max(30),
}).superRefine((s, ctx) => {
  if (Math.abs(s.components.reduce((sum, c) => sum + c.percentage, 0) - 100) > 0.000001) ctx.addIssue({ code: "custom", path: ["components"], message: "Salary component percentages must total 100%." });
  if (!s.components.some((c) => c.id === s.basicComponentId)) ctx.addIssue({ code: "custom", path: ["basicComponentId"], message: "Select the component used as basic salary." });
  for (const [key, entries] of [["components", s.components], ["deductions", s.deductions]] as const) {
    if (new Set(entries.map((c) => c.id)).size !== entries.length) ctx.addIssue({ code: "custom", path: [key], message: "Each item must have a unique ID." });
  }
  if (new Set(s.profileAllowances.map((a) => a.source)).size !== s.profileAllowances.length) ctx.addIssue({ code: "custom", path: ["profileAllowances"], message: "Each profile allowance source can only be included once." });
});
export type SalarySettings = z.infer<typeof salarySettingsSchema>;
export type Versioned<T> = T & { id: string; revision: number; updatedById?: string; updatedAt?: unknown };
export const taxPolicySchema = z.object({
  name: required, taxYear: required, currency, effectiveFrom: date, effectiveTo: date,
  status: z.enum(["draft", "active", "archived"]), source: z.string().trim().max(1000),
  brackets: z.array(z.object({ lower: money, upper: money.nullable(), fixedTax: money, rate: z.number().finite().min(0).max(100) })).min(1).max(50),
  surcharge: z.object({ enabled: z.boolean(), threshold: money, rate: z.number().finite().min(0).max(100) }),
}).superRefine((p, ctx) => {
  if (p.effectiveTo < p.effectiveFrom) ctx.addIssue({ code: "custom", path: ["effectiveTo"], message: "The end date must follow the start date." });
  if (!Number.isNaN(Date.parse(p.effectiveFrom))) {
    const start = new Date(p.effectiveFrom);
    const expectedEnd = new Date(Date.UTC(start.getUTCFullYear() + 1, start.getUTCMonth(), 1) - 86400000).toISOString().slice(0, 10);
    if (start.getUTCDate() !== 1 || p.effectiveTo !== expectedEnd) ctx.addIssue({ code: "custom", path: ["effectiveTo"], message: "Annual tax brackets require a full 12-month tax year, starting on the first day of a month and ending on the last day of the twelfth month." });
  }
  p.brackets.forEach((b, i) => {
    const previous = p.brackets[i - 1];
    if (i === 0 && (b.lower !== 0 || b.fixedTax !== 0)) ctx.addIssue({ code: "custom", path: ["brackets", i], message: "The first bracket must start at zero with zero fixed tax." });
    if (b.upper !== null && b.upper <= b.lower) ctx.addIssue({ code: "custom", path: ["brackets", i], message: "Upper limit must exceed lower limit." });
    if (i < p.brackets.length - 1 && b.upper === null) ctx.addIssue({ code: "custom", path: ["brackets", i], message: "Only the last bracket can be open-ended." });
    if (i === p.brackets.length - 1 && b.upper !== null) ctx.addIssue({ code: "custom", path: ["brackets", i], message: "Leave the last upper limit blank to cover all higher incomes." });
    if (previous) {
      if (previous.upper !== b.lower) ctx.addIssue({ code: "custom", path: ["brackets", i], message: "Brackets must be contiguous with no gaps or overlaps." });
      const expected = roundMoney(previous.fixedTax + (b.lower - previous.lower) * previous.rate / 100);
      if (Math.abs(expected - b.fixedTax) > 0.01) ctx.addIssue({ code: "custom", path: ["brackets", i, "fixedTax"], message: `Fixed tax must be ${expected} to continue the previous bracket.` });
    }
  });
});
export type TaxPolicy = z.infer<typeof taxPolicySchema>;
export const adjustmentSchema = z.object({ id: identifier, name: required, amount: money, taxable: z.boolean() });
export const salaryInputSchema = z.object({
  unpaidDays: z.number().finite().min(0).max(366), additions: z.array(adjustmentSchema).max(30),
  deductions: z.array(deductionSchema).max(30),
  // Taxable income outside monthly salary only (bonuses, allowances, pre-tax
  // deductions, other employers). Salary itself comes from the annual formula.
  ytdTaxable: signedMoney, ytdTaxPaid: money, annualTaxCredit: money,
  remainingPeriods: z.number().int().min(0).max(60), notes: z.string().trim().max(2000),
});
export type SalaryInput = z.infer<typeof salaryInputSchema>;
export interface SalaryCalculation {
  monthlySalary: number; incrementApplied: number; eligibleDays: number; unpaidDays: number; denominator: number; paidDays: number;
  components: Array<{ id: string; name: string; percentage: number; amount: number; taxable: boolean }>;
  earnings: Array<{ name: string; amount: number; taxable: boolean }>;
  deductions: Array<{ name: string; amount: number; preTax: boolean }>;
  gross: number; taxable: number; otherTaxableIncome: number;
  taxYearDays: number; daysWorkedInYear: number; annualStandardSalary: number; annualGrossSalary: number; medicalAllowance: number; annualTaxableSalary: number;
  projectedAnnualTaxable: number; annualBaseTax: number; annualSurcharge: number;
  projectedAnnualTax: number; incomeTax: number; otherDeductions: number; net: number;
}
export type SalaryStatus = "draft" | "submitted" | "approved" | "paid" | "cancelled";
export interface SalaryRun {
  id: string; month: string; currency: string; notes: string; status: SalaryStatus; revision: number;
  settings: SalarySettings; policy: TaxPolicy; policyId: string; settingsRevision: number; policyRevision: number;
  createdById: string; createdAt?: unknown; updatedAt?: unknown; updatedById?: string;
  paymentDate?: string; paymentReference?: string; employeeCount?: number;
  totals?: { gross: number; tax: number; deductions: number; net: number };
}
export interface SalaryEmployee {
  id: string; userId: string; revision: number; profileRevision: number;
  profile: EmployeeProfileDetails; input: SalaryInput; calculation: SalaryCalculation; payment?: SalaryPayment;
  updatedById?: string; updatedAt?: unknown;
}

export function salaryMonthBounds(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || Number(month.slice(0, 4)) < 1900 || Number(month.slice(0, 4)) > 9999) throw new Error("Select a valid payroll year and month.");
  const [year, index] = month.split("-").map(Number);
  const days = new Date(Date.UTC(year, index, 0)).getUTCDate();
  return { start: `${month}-01`, end: `${month}-${days}`, days };
}
export function remainingTaxPeriods(month: string, end: string) {
  const [year, index] = month.split("-").map(Number);
  return Math.max(0, (Number(end.slice(0, 4)) - year) * 12 + Number(end.slice(5, 7)) - index);
}
export function defaultSalaryInput(month: string, policy: TaxPolicy): SalaryInput {
  return { unpaidDays: 0, additions: [], deductions: [], ytdTaxable: 0, ytdTaxPaid: 0, annualTaxCredit: 0, remainingPeriods: remainingTaxPeriods(month, policy.effectiveTo), notes: "" };
}
// An employee's first month in the tax year: their joining month, or the year's
// first month for existing staff.
const taxYearFirstMonth = (joiningDate: string, policy: Pick<TaxPolicy, "effectiveFrom">) => (joiningDate > policy.effectiveFrom ? joiningDate : policy.effectiveFrom).slice(0, 7);
export function calculateAnnualTax(income: number, policyInput: TaxPolicy) {
  const policy = taxPolicySchema.parse(policyInput);
  if (!Number.isFinite(income) || income < 0) throw new Error("Invalid annual taxable income.");
  const bracket = policy.brackets.find((b) => income >= b.lower && (b.upper === null || income <= b.upper));
  if (!bracket) throw new Error("The tax policy does not cover this income.");
  const base = roundMoney(bracket.fixedTax + (income - bracket.lower) * bracket.rate / 100);
  const surcharge = policy.surcharge.enabled && income > policy.surcharge.threshold ? roundMoney(base * policy.surcharge.rate / 100) : 0;
  return { base, surcharge, total: roundMoney(base + surcharge) };
}
const daysBetween = (from: string, to: string) => Math.max(0, Math.round((Date.parse(to) - Date.parse(from)) / 86400000));
const daysInclusive = (from: string, to: string) => daysBetween(from, to) + 1;
// Medical allowance is 10/110 of gross, i.e. 10% on top of the taxable 100 parts.
const medicalShare = (gross: number) => roundMoney(gross / 110 * 10);
export function calculateAnnualTaxableSalary(monthlySalary: number, joiningDate: string, policy: Pick<TaxPolicy, "effectiveFrom" | "effectiveTo">) {
  // Payroll policy: both counts use plain date subtraction, so 1 July to 30 June
  // is 364 days and anyone employed all year is taxed on the full annual salary.
  const taxYearDays = daysBetween(policy.effectiveFrom, policy.effectiveTo);
  const daysWorkedInYear = daysBetween(joiningDate > policy.effectiveFrom ? joiningDate : policy.effectiveFrom, policy.effectiveTo);
  const annualStandardSalary = roundMoney(monthlySalary * 12);
  const annualGrossSalary = roundMoney(annualStandardSalary / taxYearDays * daysWorkedInYear);
  const medicalAllowance = medicalShare(annualGrossSalary);
  return { taxYearDays, daysWorkedInYear, annualStandardSalary, annualGrossSalary, medicalAllowance, annualTaxableSalary: roundMoney(annualGrossSalary - medicalAllowance) };
}
function splitComponents(total: number, items: SalarySettings["components"]) {
  let remainingCents = Math.round(total * 100);
  return items.map((item, index) => {
    const cents = index === items.length - 1 ? remainingCents : Math.min(remainingCents, Math.round(total * item.percentage));
    remainingCents -= cents;
    return { ...item, amount: cents / 100 };
  });
}

export function calculateSalary(profile: EmployeeProfileDetails, month: string, settingsInput: SalarySettings, policyInput: TaxPolicy, inputValue: SalaryInput): SalaryCalculation {
  profile = employeeProfileDetailsSchema.parse(profile);
  const settings = salarySettingsSchema.parse(settingsInput), policy = taxPolicySchema.parse(policyInput), input = salaryInputSchema.parse(inputValue);
  const period = salaryMonthBounds(month);
  if (policy.status !== "active" || policy.effectiveFrom > period.start || policy.effectiveTo < period.end) throw new Error("Select an active tax policy covering the entire payroll month.");
  if (policy.currency !== settings.currency || profile.payroll.currency !== settings.currency) throw new Error("Employee, settings, and tax policy currencies must match.");
  if (profile.payroll.totalSalary === null) throw new Error("Enter the employee's total salary in Employee Profile first.");
  if (!profile.employment.joiningDate) throw new Error("Enter the employee's joining date first.");
  if (profile.employment.joiningDate > period.end) throw new Error("This employee joins after the selected payroll month.");
  const joining = profile.employment.joiningDate > period.start ? profile.employment.joiningDate : period.start;
  if (!profile.payroll.effectiveFrom || profile.payroll.effectiveFrom > joining) throw new Error("Salary must be effective by the start of this employee's payable period. Review other mid-month salary changes as separate adjustments.");
  if (input.remainingPeriods > remainingTaxPeriods(month, policy.effectiveTo)) throw new Error("Remaining periods cannot exceed the months left in this tax policy.");
  const calendarEligible = daysInclusive(joining, period.end);
  const denominator = settings.proration === "fixed_days" ? settings.fixedDays : period.days;
  const eligibleDays = settings.proration === "none" ? denominator : settings.proration === "fixed_days" ? (joining === period.start ? denominator : Math.min(denominator, calendarEligible)) : calendarEligible;
  if (settings.proration === "none" && input.unpaidDays > 0) throw new Error("Enable proration in Settings to deduct unpaid days.");
  if (input.unpaidDays > eligibleDays) throw new Error("Unpaid days cannot exceed eligible days.");
  const paidDays = eligibleDays - input.unpaidDays;
  const ratio = paidDays / denominator;
  const increment = settings.applyProfileIncrement ? profile.payroll.incrementAmount || 0 : 0;
  if (increment > 0 && !profile.payroll.incrementEffectiveFrom) throw new Error("Enter the increment effective date in Employee Profile first.");
  if (increment > 0 && profile.payroll.incrementEffectiveFrom > period.start && profile.payroll.incrementEffectiveFrom <= period.end) throw new Error("This month has a mid-month increment. Review it as a separate earning adjustment, or update the salary effective from the next month.");
  const incrementApplied = increment > 0 && profile.payroll.incrementEffectiveFrom <= period.start ? increment : 0;
  const monthlySalary = roundMoney(profile.payroll.totalSalary + incrementApplied);
  const prorated = roundMoney(monthlySalary * ratio);
  const components = splitComponents(prorated, settings.components);
  const recurring = settings.profileAllowances.map((a) => ({ name: a.name, amount: roundMoney((profile.payroll[a.source] || 0) * (a.prorate ? ratio : 1)), taxable: a.taxable })).filter((a) => a.amount > 0);
  const earnings = [...recurring, ...input.additions.map(({ name, amount, taxable }) => ({ name, amount, taxable }))];
  const gross = roundMoney(prorated + earnings.reduce((sum, a) => sum + a.amount, 0));
  const basic = components.find((c) => c.id === settings.basicComponentId)!.amount;
  const deductions = [...settings.deductions, ...input.deductions].map((d) => ({ name: d.name, preTax: d.preTax,
    amount: roundMoney(d.kind === "fixed" ? d.value : (d.kind === "percent_gross" ? gross : basic) * d.value / 100) }));
  const preTax = deductions.filter((d) => d.preTax).reduce((sum, d) => sum + d.amount, 0);
  // Component tax flags remain in old snapshots for compatibility, but never
  // determine the tax base.
  const otherTaxableIncome = roundMoney(earnings.filter((a) => a.taxable).reduce((sum, a) => sum + a.amount, 0) - preTax);
  const taxable = roundMoney(Math.max(0, prorated - medicalShare(prorated) + otherTaxableIncome));
  const annualSalary = calculateAnnualTaxableSalary(monthlySalary, profile.employment.joiningDate, policy);
  // Future months add recurring items only, excluding one-off adjustments.
  const fullComponents = splitComponents(monthlySalary, settings.components);
  const fullGross = roundMoney(monthlySalary + settings.profileAllowances.reduce((sum, a) => sum + (profile.payroll[a.source] || 0), 0));
  const fullBasic = fullComponents.find((c) => c.id === settings.basicComponentId)!.amount;
  const futurePreTax = settings.deductions.filter((d) => d.preTax).reduce((sum, d) => sum + roundMoney(d.kind === "fixed" ? d.value : (d.kind === "percent_gross" ? fullGross : fullBasic) * d.value / 100), 0);
  const futureOtherTaxable = roundMoney(settings.profileAllowances.filter((a) => a.taxable).reduce((sum, a) => sum + (profile.payroll[a.source] || 0), 0) - futurePreTax);
  const projectedAnnualTaxable = roundMoney(Math.max(0, annualSalary.annualTaxableSalary + input.ytdTaxable + otherTaxableIncome + futureOtherTaxable * input.remainingPeriods));
  const annual = calculateAnnualTax(projectedAnnualTaxable, policy);
  // Spread over this month and the months left, so the count follows the joining
  // month: 12 from July, 11 from August, 9 from October.
  const incomeTax = roundMoney(Math.max(0, annual.total - input.annualTaxCredit - input.ytdTaxPaid) / (input.remainingPeriods + 1));
  const otherDeductions = roundMoney(deductions.reduce((sum, d) => sum + d.amount, 0));
  const net = roundMoney(gross - otherDeductions - incomeTax);
  if (net < 0) throw new Error("Deductions and tax exceed gross salary. Review the employee's inputs.");
  return { monthlySalary, incrementApplied, eligibleDays, unpaidDays: input.unpaidDays, denominator, paidDays, components, earnings, deductions, gross, taxable, otherTaxableIncome, ...annualSalary, projectedAnnualTaxable, annualBaseTax: annual.base, annualSurcharge: annual.surcharge, projectedAnnualTax: annual.total, incomeTax, otherDeductions, net };
}

/**
 * The number of deductions is set by the joining date, not by which month payroll
 * first ran in this app. Earlier months with no run here count as paid at the
 * standard monthly share, so a first run in November still charges that share
 * instead of squeezing the whole year's tax into the remaining months.
 */
export function taxForMonthsWithoutRuns(profile: EmployeeProfileDetails, month: string, settings: SalarySettings, policy: TaxPolicy, input: SalaryInput, monthsWithRuns: string[]) {
  const first = taxYearFirstMonth(profile.employment.joiningDate, policy);
  const deductions = remainingTaxPeriods(first, policy.effectiveTo) + 1;
  const earlierDeductions = remainingTaxPeriods(first, `${month}-01`);
  const recorded = new Set(monthsWithRuns.filter((item) => item >= first && item < month)).size;
  const missing = Math.max(0, earlierDeductions - recorded);
  if (!missing) return 0;
  const annualTax = calculateSalary(profile, month, settings, policy, { ...input, ytdTaxPaid: 0 }).projectedAnnualTax;
  return roundMoney(Math.max(0, annualTax - input.annualTaxCredit) / deductions * missing);
}

export function salaryTotals(rows: SalaryEmployee[]) {
  const sum = (key: keyof Pick<SalaryCalculation, "gross" | "incomeTax" | "otherDeductions" | "net">) => roundMoney(rows.reduce((total, row) => total + row.calculation[key], 0));
  return { gross: sum("gross"), tax: sum("incomeTax"), deductions: sum("otherDeductions"), net: sum("net") };
}

export function salaryApprovalIssues(profile: EmployeeProfileDetails): string[] {
  const missing: string[] = [];
  if (!profile.employment.employeeCode.trim()) missing.push("Employee ID");
  if (!profile.personal.nationalId.trim()) missing.push("National ID / CNIC");
  if (!profile.payroll.paymentMethod) missing.push("Payment method");
  if (profile.payroll.paymentMethod === "bank_transfer") {
    if (!profile.payroll.bankName.trim()) missing.push("Bank name");
    if (!profile.payroll.accountTitle.trim()) missing.push("Account title");
    if (!profile.payroll.accountNumber.trim() && !profile.payroll.iban.trim()) missing.push("Account number or IBAN");
  }
  return missing;
}
