import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { initialEmployeeProfile } from "./employeeProfileModel";
import { calculateAnnualTax, calculateAnnualTaxableSalary, calculateSalary, canAccessSalary, canApproveSalary, defaultSalaryInput, remainingTaxPeriods, roundMoney, salaryApprovalIssues, taxForMonthsWithoutRuns, salaryMonthBounds, salarySettingsSchema, taxPolicySchema, type SalarySettings, type TaxPolicy } from "./salaryModel";

const template = JSON.parse(readFileSync(new URL("../data/salarySetupTemplate.json", import.meta.url), "utf8"));
export const testSettings: SalarySettings = { companyName: "Demo company", companyAddress: "Test address", currency: "PKR", proration: "calendar_days", fixedDays: 30, basicComponentId: "basic", components: template.components, deductions: [], applyProfileIncrement: false, profileAllowances: [] };
export const testPolicy: TaxPolicy = { name: "Supplied image", taxYear: "2025–2026", currency: "PKR", effectiveFrom: "2025-07-01", effectiveTo: "2026-06-30", status: "active", source: "User-provided image", brackets: template.brackets, surcharge: { enabled: false, threshold: 0, rate: 0 } };
export function salaryTestProfile() {
  const profile = initialEmployeeProfile({ id: "employee", displayName: "Test Employee", email: "employee@example.com", employeeCode: "E-001" });
  profile.employment.joiningDate = "2025-07-01";
  profile.personal.nationalId = "12345-1234567-1";
  profile.payroll = { ...profile.payroll, totalSalary: 100000, taxableSalary: 100000, effectiveFrom: "2025-07-01", currency: "PKR", paymentMethod: "cash" };
  return profile;
}
test("salary access and approval roles follow the requested workflow", () => {
  for (const role of ["main_admin", "financial_admin", "finance"]) assert.equal(canAccessSalary(role), true);
  for (const role of ["sales", "operation", undefined]) assert.equal(canAccessSalary(role), false);
  assert.equal(canApproveSalary("finance"), false);
  assert.equal(canApproveSalary("financial_admin"), true);
  assert.equal(canApproveSalary("main_admin"), true);
});
test("the supplied annual brackets calculate correctly at every boundary", () => {
  for (const [income, tax] of [[0, 0], [600000, 0], [600001, 0.01], [1200000, 6000], [1200100, 6011], [2200000, 116000], [2200100, 116023], [3200000, 346000], [3200100, 346030], [4100000, 616000], [4100100, 616035], [5000000, 931000]]) assert.equal(calculateAnnualTax(income, testPolicy).total, tax);
});
test("changing saved bracket data changes tax without changes to the calculation code", () => {
  const policy: TaxPolicy = { ...testPolicy, brackets: [{ lower: 0, upper: null, fixedTax: 0, rate: 10 }] };
  assert.equal(calculateAnnualTax(1000000, policy).total, 100000);
  policy.brackets[0].rate = 20;
  assert.equal(calculateAnnualTax(1000000, policy).total, 200000);
});
test("invalid, discontinuous, overlapping, and incomplete tax brackets are rejected", () => {
  for (const change of [
    (p: TaxPolicy) => { p.brackets[1].lower++; },
    (p: TaxPolicy) => { p.brackets[1].fixedTax = 100; },
    (p: TaxPolicy) => { p.brackets[0].upper = null; },
    (p: TaxPolicy) => { p.brackets.at(-1)!.upper = 5000000; },
    (p: TaxPolicy) => { p.effectiveTo = "2025-01-01"; },
    (p: TaxPolicy) => { p.brackets[0].rate = Number.NaN; },
  ]) { const policy = structuredClone(testPolicy); change(policy); assert.equal(taxPolicySchema.safeParse(policy).success, false); }
});
test("surcharge is optional and applied above the configured income threshold", () => {
  const policy = { ...testPolicy, surcharge: { enabled: true, threshold: 10000000, rate: 9 } };
  assert.equal(calculateAnnualTax(10000000, policy).surcharge, 0);
  const result = calculateAnnualTax(11000000, policy);
  assert.equal(result.surcharge, Math.round(result.base * 9) / 100);
});
test("salary settings require a complete 100% split and a valid basic component", () => {
  assert.equal(salarySettingsSchema.safeParse(testSettings).success, true);
  assert.equal(salarySettingsSchema.safeParse({ ...testSettings, components: [{ ...testSettings.components[0], percentage: 80 }] }).success, false);
  assert.equal(salarySettingsSchema.safeParse({ ...testSettings, basicComponentId: "absent" }).success, false);
});
test("salary components reconcile to the total at cent precision", () => {
  const profile = salaryTestProfile();
  for (const total of [0, 0.01, 0.03, 1, 10000.01, 100000, 250000.99]) {
    profile.payroll.totalSalary = total;
    profile.payroll.taxableSalary = total;
    const result = calculateSalary(profile, "2025-07", testSettings, testPolicy, defaultSalaryInput("2025-07", testPolicy));
    assert.equal(Math.round(result.components.reduce((sum, c) => sum + c.amount, 0) * 100), Math.round(total * 100));
    assert.equal(result.gross, total);
  }
});
test("year and month validation handles leap years and tax periods", () => {
  assert.equal(salaryMonthBounds("2024-02").days, 29);
  assert.equal(salaryMonthBounds("2025-02").days, 28);
  for (const value of ["2025-00", "2025-13", "2025-2", "not-a-month"]) assert.throws(() => salaryMonthBounds(value));
  assert.equal(remainingTaxPeriods("2025-07", "2026-06-30"), 11);
  assert.equal(remainingTaxPeriods("2026-06", "2026-06-30"), 0);
});
test("monthly tax reconciles prior withholding instead of repeating the full annual tax", () => {
  const result = calculateSalary(salaryTestProfile(), "2025-11", testSettings, testPolicy, { ...defaultSalaryInput("2025-11", testPolicy), ytdTaxPaid: 2000 });
  assert.equal(result.projectedAnnualTaxable, 1090909.09);
  assert.equal(result.projectedAnnualTax, 4909.09);
  assert.equal(result.incomeTax, 363.64);
  assert.equal(result.net, 99636.36);
});
test("a full year is withheld in 12 equal deductions, starting in the first month", () => {
  let ytdTaxPaid = 0;
  const months = ["2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"];
  const taxes = months.map((month) => {
    const { incomeTax } = calculateSalary(salaryTestProfile(), month, testSettings, testPolicy, { ...defaultSalaryInput(month, testPolicy), ytdTaxPaid });
    ytdTaxPaid = roundMoney(ytdTaxPaid + incomeTax);
    return incomeTax;
  });
  assert.equal(taxes[0], 409.09);
  for (const tax of taxes) assert.ok(Math.abs(tax - 409.09) <= 0.05);
  assert.equal(ytdTaxPaid, 4909.09);
});
test("any tax still owed in the final month is taken in full", () => {
  const result = calculateSalary(salaryTestProfile(), "2026-06", testSettings, testPolicy, { ...defaultSalaryInput("2026-06", testPolicy), ytdTaxPaid: 4000 });
  assert.equal(result.incomeTax, 909.09);
});
test("new joiners and unpaid leave are prorated according to saved settings", () => {
  const profile = salaryTestProfile(); profile.employment.joiningDate = "2025-07-16"; profile.payroll.effectiveFrom = "2025-07-16";
  const input = { ...defaultSalaryInput("2025-07", testPolicy), unpaidDays: 1 };
  const result = calculateSalary(profile, "2025-07", testSettings, testPolicy, input);
  assert.equal(result.paidDays, 15); assert.equal(result.gross, 48387.1);
  assert.throws(() => calculateSalary(profile, "2025-07", testSettings, testPolicy, { ...input, unpaidDays: 17 }), /Unpaid days/);
});
test("fixed day divisors and no-proration settings are respected", () => {
  const input = { ...defaultSalaryInput("2025-07", testPolicy), unpaidDays: 1 };
  const result = calculateSalary(salaryTestProfile(), "2025-07", { ...testSettings, proration: "fixed_days", fixedDays: 30 }, testPolicy, input);
  assert.equal(result.gross, 96666.67);
  assert.throws(() => calculateSalary(salaryTestProfile(), "2025-07", { ...testSettings, proration: "none" }, testPolicy, input), /Enable proration/);
  const february = calculateSalary(salaryTestProfile(), "2026-02", { ...testSettings, proration: "fixed_days", fixedDays: 30 }, testPolicy, defaultSalaryInput("2026-02", testPolicy));
  assert.equal(february.eligibleDays, 30); assert.equal(february.gross, 100000);
});
test("earnings tax treatment and configured deductions affect the correct amounts", () => {
  const profile = salaryTestProfile();
  const input = { ...defaultSalaryInput("2025-08", testPolicy), additions: [{ id: "reimbursement", name: "Reimbursement", amount: 5000, taxable: false }] };
  const result = calculateSalary(profile, "2025-08", { ...testSettings, deductions: [{ id: "loan", name: "Loan", kind: "fixed", value: 1000, preTax: false }] }, testPolicy, input);
  assert.equal(result.gross, 105000); assert.equal(result.taxable, 90909.09); assert.equal(result.incomeTax, 446.28); assert.equal(result.net, 103553.72);
  const preTax = calculateSalary(profile, "2025-08", { ...testSettings, deductions: [{ id: "pension", name: "Pension", kind: "fixed", value: 1000, preTax: true }] }, testPolicy, defaultSalaryInput("2025-08", testPolicy));
  assert.equal(preTax.taxable, 89909.09); assert.equal(preTax.projectedAnnualTaxable, 1079909.09); assert.equal(preTax.incomeTax, 436.28);
});
test("one-off earnings are not projected into future months", () => {
  const input = { ...defaultSalaryInput("2025-08", testPolicy), additions: [{ id: "bonus", name: "Bonus", amount: 12000, taxable: true }] };
  const result = calculateSalary(salaryTestProfile(), "2025-08", testSettings, testPolicy, input);
  assert.equal(result.projectedAnnualTaxable, 1102909.09); assert.equal(result.incomeTax, 457.19);
});
test("profile allowances are included only when configured and respect tax treatment", () => {
  const profile = salaryTestProfile(); profile.payroll.transportAllowance = 5000;
  const input = defaultSalaryInput("2025-07", testPolicy);
  assert.equal(calculateSalary(profile, "2025-07", testSettings, testPolicy, input).gross, 100000);
  const result = calculateSalary(profile, "2025-07", { ...testSettings, profileAllowances: [{ id: "travel", name: "Travel", source: "transportAllowance", taxable: false, prorate: true }] }, testPolicy, input);
  assert.equal(result.gross, 105000); assert.equal(result.taxable, 90909.09);
});
test("profile increments require explicit enablement and an effective date", () => {
  const profile = salaryTestProfile(); profile.payroll.incrementAmount = 10000; profile.payroll.incrementEffectiveFrom = "2025-08-01";
  const input = defaultSalaryInput("2025-08", testPolicy);
  assert.equal(calculateSalary(profile, "2025-08", testSettings, testPolicy, input).monthlySalary, 100000);
  assert.equal(calculateSalary(profile, "2025-08", { ...testSettings, applyProfileIncrement: true }, testPolicy, input).monthlySalary, 110000);
  profile.payroll.incrementEffectiveFrom = "2025-08-15";
  assert.throws(() => calculateSalary(profile, "2025-08", { ...testSettings, applyProfileIncrement: true }, testPolicy, input), /mid-month increment/);
});
test("missing salary, future joining, currency mismatches and inactive policies cannot be calculated", () => {
  const profile = salaryTestProfile(), input = defaultSalaryInput("2025-07", testPolicy);
  assert.throws(() => calculateSalary({ ...profile, payroll: { ...profile.payroll, totalSalary: null } }, "2025-07", testSettings, testPolicy, input), /total salary/);
  assert.throws(() => calculateSalary({ ...profile, employment: { ...profile.employment, joiningDate: "2026-01-01" } }, "2025-07", testSettings, testPolicy, input), /joins after/);
  assert.throws(() => calculateSalary(profile, "2025-07", { ...testSettings, currency: "USD" }, testPolicy, input), /currencies/);
  assert.throws(() => calculateSalary(profile, "2025-07", testSettings, { ...testPolicy, status: "draft" }, input), /active tax policy/);
});
test("negative net pay and excessive remaining periods are rejected", () => {
  const input = defaultSalaryInput("2025-07", testPolicy);
  assert.throws(() => calculateSalary(salaryTestProfile(), "2025-07", testSettings, testPolicy, { ...input, deductions: [{ id: "loan", name: "Loan", kind: "fixed", value: 200000, preTax: false }] }), /exceed gross/);
  assert.throws(() => calculateSalary(salaryTestProfile(), "2025-07", testSettings, testPolicy, { ...input, remainingPeriods: 12 }), /Remaining periods/);
});
test("approval requires identity and payment details, including bank details only for transfers", () => {
  const profile = salaryTestProfile();
  assert.deepEqual(salaryApprovalIssues(profile), []);
  profile.payroll.paymentMethod = "bank_transfer";
  assert.deepEqual(salaryApprovalIssues(profile), ["Bank name", "Account title", "Account number or IBAN"]);
  profile.payroll.bankName = "Demo bank"; profile.payroll.accountTitle = "Test Employee"; profile.payroll.iban = "PK00000000000000";
  assert.deepEqual(salaryApprovalIssues(profile), []);
});
test("tax policy periods must represent an annual tax year rather than a single payroll month", () => {
  assert.equal(taxPolicySchema.safeParse({ ...testPolicy, effectiveTo: "2025-07-31" }).success, false);
  assert.equal(taxPolicySchema.safeParse({ ...testPolicy, effectiveFrom: "2026-01-01", effectiveTo: "2026-12-31" }).success, true);
});
const fy2026: TaxPolicy = { ...testPolicy, taxYear: "2026–2027", effectiveFrom: "2026-07-01", effectiveTo: "2027-06-30" };
test("annual taxable salary follows the days-worked and medical allowance formula", () => {
  assert.deepEqual(calculateAnnualTaxableSalary(100000, "2026-10-17", fy2026), { taxYearDays: 364, daysWorkedInYear: 256, annualStandardSalary: 1200000, annualGrossSalary: 843956.04, medicalAllowance: 76723.28, annualTaxableSalary: 767232.76 });
});
test("day counts use plain date subtraction, so existing staff work all 364 days and pay tax on the full salary", () => {
  for (const joining of ["2020-01-15", "2026-07-01"]) {
    const result = calculateAnnualTaxableSalary(110000, joining, fy2026);
    assert.equal(result.taxYearDays, 364); assert.equal(result.daysWorkedInYear, 364); assert.equal(result.annualGrossSalary, 1320000);
    assert.equal(result.medicalAllowance, 120000); assert.equal(result.annualTaxableSalary, 1200000);
  }
  assert.equal(calculateAnnualTaxableSalary(100000, "2027-06-30", fy2026).daysWorkedInYear, 0);
  const leapYear = calculateAnnualTaxableSalary(100000, "2027-07-01", { effectiveFrom: "2027-07-01", effectiveTo: "2028-06-30" });
  assert.equal(leapYear.taxYearDays, 365); assert.equal(leapYear.daysWorkedInYear, 365); assert.equal(leapYear.annualGrossSalary, 1200000);
});
test("a mid-year joiner is taxed on the formula and the tax is spread over their remaining months", () => {
  const profile = salaryTestProfile(); profile.employment.joiningDate = "2026-10-17"; profile.payroll.effectiveFrom = "2026-10-17";
  const result = calculateSalary(profile, "2026-10", testSettings, fy2026, defaultSalaryInput("2026-10", fy2026));
  assert.equal(result.daysWorkedInYear, 256); assert.equal(result.taxYearDays, 364); assert.equal(result.annualTaxableSalary, 767232.76);
  assert.equal(result.projectedAnnualTaxable, 767232.76); assert.equal(result.projectedAnnualTax, 1672.33);
  assert.equal(result.incomeTax, 185.81); assert.equal(result.gross, 48387.1); assert.equal(result.taxable, 43988.27); assert.equal(result.net, 48201.29);
});
test("deductions run from the joining month to the end of the tax year", () => {
  const joiner = (date: string) => { const profile = salaryTestProfile(); profile.employment.joiningDate = date; profile.payroll.effectiveFrom = date; return profile; };
  let ytdTaxPaid = 0;
  const october = ["2026-10", "2026-11", "2026-12", "2027-01", "2027-02", "2027-03", "2027-04", "2027-05", "2027-06"].map((month) => {
    const { incomeTax } = calculateSalary(joiner("2026-10-17"), month, testSettings, fy2026, { ...defaultSalaryInput(month, fy2026), ytdTaxPaid });
    ytdTaxPaid = roundMoney(ytdTaxPaid + incomeTax);
    return incomeTax;
  });
  assert.equal(october.length, 9);
  assert.equal(october[0], 185.81);
  for (const tax of october) assert.ok(Math.abs(tax - 185.81) <= 0.05);
  assert.equal(ytdTaxPaid, 1672.33);
  const august = calculateSalary(joiner("2026-08-01"), "2026-08", testSettings, fy2026, defaultSalaryInput("2026-08", fy2026));
  assert.equal(august.daysWorkedInYear, 333); assert.equal(august.projectedAnnualTax, 3980.02); assert.equal(august.incomeTax, 361.82);
  const shoaib = joiner("2026-08-11"); shoaib.payroll.totalSalary = 300000;
  const eleven = calculateSalary(shoaib, "2026-08", testSettings, fy2026, defaultSalaryInput("2026-08", fy2026));
  assert.equal(eleven.projectedAnnualTax, 277942.06); assert.equal(eleven.incomeTax, 25267.46);
});
function firstRunIn(month: string, salary: number, joining: string, monthsWithRuns: string[] = [], ytdTaxPaid = 0) {
  const profile = salaryTestProfile(); profile.employment.joiningDate = joining; profile.payroll.effectiveFrom = joining; profile.payroll.totalSalary = salary;
  const input = { ...defaultSalaryInput(month, fy2026), ytdTaxPaid };
  const assumed = taxForMonthsWithoutRuns(profile, month, testSettings, fy2026, input, monthsWithRuns);
  return { assumed, result: calculateSalary(profile, month, testSettings, fy2026, { ...input, ytdTaxPaid: roundMoney(ytdTaxPaid + assumed) }) };
}
test("the first run in the app charges the joining-date share, not the whole year over the months left", () => {
  for (const [salary, joining, assumed, tax] of [[150000, "2026-07-01", 18000, 4500], [200000, "2026-07-01", 38000, 9500], [300000, "2026-08-11", 75802.38, 25267.46]] as const) {
    const run = firstRunIn("2026-11", salary, joining);
    assert.equal(run.assumed, assumed);
    assert.equal(run.result.incomeTax, tax);
  }
});
test("months with a real payroll run use the tax actually recorded, and only the others are assumed", () => {
  const december = firstRunIn("2026-12", 300000, "2026-08-11", ["2026-11"], 25267.46);
  assert.equal(december.assumed, 75802.38);
  assert.equal(december.result.incomeTax, 25267.46);
  assert.equal(firstRunIn("2026-09", 300000, "2026-08-11", ["2026-08"]).assumed, 0);
});
test("nothing is assumed in the first month or when every month has a run", () => {
  assert.equal(firstRunIn("2026-07", 300000, "2026-07-01").assumed, 0);
  assert.equal(firstRunIn("2026-08", 300000, "2026-07-01", ["2026-07"]).assumed, 0);
  assert.equal(firstRunIn("2026-10", 300000, "2026-10-17").assumed, 0);
  assert.equal(firstRunIn("2026-11", 300000, "2026-10-17", ["2026-10"]).assumed, 0);
  assert.equal(firstRunIn("2026-11", 300000, "2026-07-01", ["2026-07", "2026-08", "2026-09", "2026-10"]).assumed, 0);
  assert.equal(firstRunIn("2026-11", 40000, "2026-07-01").assumed, 0);
});
test("applied increments are included in the monthly salary used for annual tax", () => {
  const profile = salaryTestProfile(); profile.payroll.incrementAmount = 10000; profile.payroll.incrementEffectiveFrom = "2025-07-01";
  const result = calculateSalary(profile, "2025-07", { ...testSettings, applyProfileIncrement: true }, testPolicy, defaultSalaryInput("2025-07", testPolicy));
  assert.equal(result.annualStandardSalary, 1320000); assert.equal(result.annualTaxableSalary, 1200000);
});
test("unpaid days reduce pay but not the annual taxable salary", () => {
  const input = { ...defaultSalaryInput("2025-07", testPolicy), unpaidDays: 5 };
  const result = calculateSalary(salaryTestProfile(), "2025-07", testSettings, testPolicy, input);
  assert.equal(result.paidDays, 26); assert.equal(result.annualTaxableSalary, 1090909.09); assert.equal(result.projectedAnnualTaxable, 1090909.09);
});
test("prior other taxable income adjusts the annual figure and may be negative after pre-tax deductions", () => {
  const input = defaultSalaryInput("2025-08", testPolicy);
  assert.equal(calculateSalary(salaryTestProfile(), "2025-08", testSettings, testPolicy, { ...input, ytdTaxable: 12000 }).projectedAnnualTaxable, 1102909.09);
  assert.equal(calculateSalary(salaryTestProfile(), "2025-08", testSettings, testPolicy, { ...input, ytdTaxable: -1000 }).projectedAnnualTaxable, 1089909.09);
});
test("tax ignores the profile's Taxable Salary and component tax flags", () => {
  const input = defaultSalaryInput("2025-08", testPolicy);
  for (const taxableSalary of [60000, 0, null, 100001]) for (const taxable of [true, false]) {
    const profile = salaryTestProfile(); profile.payroll.taxableSalary = taxableSalary;
    const result = calculateSalary(profile, "2025-08", { ...testSettings, components: testSettings.components.map((c) => ({ ...c, taxable })) }, testPolicy, input);
    assert.equal(result.gross, 100000);
    assert.equal(result.taxable, 90909.09);
    assert.equal(result.projectedAnnualTaxable, 1090909.09);
    assert.equal(result.incomeTax, 446.28);
    assert.equal(result.net, 99553.72);
  }
  const profile = salaryTestProfile(); profile.payroll.taxableSalary = null;
  assert.deepEqual(salaryApprovalIssues(profile), []);
});
test("monthly taxable income is prorated with payable days and respects taxable extras and pre-tax deductions", () => {
  const profile = salaryTestProfile(); profile.payroll.transportAllowance = 5000;
  const input = { ...defaultSalaryInput("2025-07", testPolicy), unpaidDays: 1, additions: [{ id: "bonus", name: "Bonus", amount: 1000, taxable: true }, { id: "expense", name: "Reimbursement", amount: 2000, taxable: false }], deductions: [{ id: "pension", name: "Pension", kind: "fixed" as const, value: 500, preTax: true }] };
  const result = calculateSalary(profile, "2025-07", { ...testSettings, profileAllowances: [{ id: "transport", source: "transportAllowance", name: "Transport", taxable: true, prorate: true }] }, testPolicy, input);
  assert.equal(result.otherTaxableIncome, 5338.71);
  assert.equal(result.taxable, 93315.25);
  assert.equal(result.projectedAnnualTaxable, 1151247.8);
  assert.equal(result.gross, 104612.9);
});
