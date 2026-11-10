import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateEmployeeSalary, canCreateEmployeeAccounts, canManageEmployeeProfiles, employeeAccountSchema, employeeProfileDetailsSchema, employeeProfileDetailsWithDefaults, employeeProfileIncompleteFields, employeeProfileMissingFields, employeeProfileSharedUserFields,
  employeeProfileToDraft, initialEmployeeProfile, isActiveEmployeeUser, updatePayrollTotalSalary,
} from "./employeeProfileModel";

const user = {
  id: "employee-1", displayName: "Test Employee", email: "employee@example.com",
  role: "sales", accountStatus: "approved", isActive: true,
  mobileCountryCode: "+92", mobileNo: "03001234567", designation: "Executive",
  region: "Karachi", reportingTo: "manager-1",
};

test("only approved users who have not been deactivated are imported", () => {
  assert.equal(isActiveEmployeeUser(user), true);
  assert.equal(isActiveEmployeeUser({ ...user, isActive: undefined }), true);
  assert.equal(isActiveEmployeeUser({ ...user, isActive: false }), false);
  assert.equal(isActiveEmployeeUser({ ...user, accountStatus: "pending" }), false);
  assert.equal(isActiveEmployeeUser({ ...user, accountStatus: "rejected" }), false);
});

test("profile access is limited to the three requested roles", () => {
  for (const role of ["main_admin", "financial_admin", "finance"]) assert.equal(canManageEmployeeProfiles(role), true);
  for (const role of ["admin", "operational_admin", "operation", "sales", "", undefined]) assert.equal(canManageEmployeeProfiles(role), false);
});

test("onboarding copies known user details without inventing joining dates or salary", () => {
  const profile = initialEmployeeProfile({ ...user, financialLimit: 50000 } as typeof user);
  assert.equal(profile.personal.fullName, user.displayName);
  assert.equal(profile.personal.phone, "+92 03001234567");
  assert.equal(profile.employment.reportingTo, "manager-1");
  assert.equal(profile.employment.joiningDate, "");
  assert.equal(profile.payroll.basicSalary, null);
  assert.equal("financialLimit" in profile, false);
  profile.personal.fullName = "Edited Name";
  assert.equal(user.displayName, "Test Employee");
});

test("blank total salary remains unknown while an explicit zero is retained", () => {
  const draft = employeeProfileToDraft(initialEmployeeProfile(user));
  assert.equal(employeeProfileDetailsSchema.parse(draft).payroll.totalSalary, null);
  draft.payroll = updatePayrollTotalSalary(draft.payroll, "0");
  const saved = employeeProfileDetailsSchema.parse(draft);
  assert.equal(saved.payroll.totalSalary, 0);
  assert.equal(saved.payroll.basicSalary, 0);
  assert.equal(employeeProfileMissingFields(saved).includes("Total salary"), false);
  assert.equal(employeeProfileToDraft(saved).payroll.totalSalary, "0");
  assert.equal(employeeProfileToDraft(saved).payroll.basicSalary, "0");
});

test("invalid salary amounts and calendar dates cannot be saved", () => {
  for (const invalid of ["-1", "NaN", "Infinity", "not a salary"]) {
    const draft = employeeProfileToDraft(initialEmployeeProfile(user));
    draft.payroll.totalSalary = invalid;
    assert.equal(employeeProfileDetailsSchema.safeParse(draft).success, false);
  }
  const draft = employeeProfileToDraft(initialEmployeeProfile(user));
  draft.employment.joiningDate = "2026-02-30";
  assert.equal(employeeProfileDetailsSchema.safeParse(draft).success, false);
  draft.employment.joiningDate = "2026-11-01";
  draft.employment.probationEndDate = "2026-10-01";
  assert.equal(employeeProfileDetailsSchema.safeParse(draft).success, false);
});

test("bank transfer profiles need bank details and preserve leading zeros in identifiers", () => {
  const draft = employeeProfileToDraft(initialEmployeeProfile(user));
  draft.payroll.paymentMethod = "bank_transfer";
  draft.personal.nationalId = "00123-1234567-0";
  draft.payroll.accountNumber = "000123456789";
  let saved = employeeProfileDetailsSchema.parse(draft);
  assert.ok(employeeProfileMissingFields(saved).includes("Bank name"));
  assert.equal(saved.personal.nationalId, "00123-1234567-0");
  assert.equal(saved.payroll.accountNumber, "000123456789");
  draft.payroll.paymentMethod = "cash";
  saved = employeeProfileDetailsSchema.parse(draft);
  assert.equal(employeeProfileMissingFields(saved).includes("Bank name"), false);
});

test("saving accepts only employee details, excluding login permissions and audit metadata", () => {
  const draft = employeeProfileToDraft(initialEmployeeProfile(user));
  const parsed = employeeProfileDetailsSchema.parse({ ...draft, role: "main_admin", userId: "another-user", revision: 999 });
  assert.equal("role" in parsed, false);
  assert.equal("userId" in parsed, false);
  assert.equal("revision" in parsed, false);
});

test("personal email stays separate from the account email and must be a valid address", () => {
  const draft = employeeProfileToDraft(initialEmployeeProfile(user));
  draft.personal.personalEmail = "personal@example.com";
  const saved = employeeProfileDetailsSchema.parse(draft);
  assert.equal(saved.personal.email, user.email);
  assert.equal(saved.personal.personalEmail, "personal@example.com");
  draft.personal.personalEmail = "invalid-email";
  assert.equal(employeeProfileDetailsSchema.safeParse(draft).success, false);
});

test("increment amounts are numeric and do not change the recorded basic salary", () => {
  const draft = employeeProfileToDraft(initialEmployeeProfile(user));
  draft.payroll.basicSalary = "100000";
  draft.payroll.incrementAmount = "12500.50";
  draft.payroll.incrementEffectiveFrom = "2026-12-01";
  const saved = employeeProfileDetailsSchema.parse(draft);
  assert.equal(saved.payroll.basicSalary, 100000);
  assert.equal(saved.payroll.incrementAmount, 12500.5);
  assert.equal(saved.payroll.incrementEffectiveFrom, "2026-12-01");
  assert.equal(employeeProfileToDraft(saved).payroll.incrementAmount, "12500.5");
  draft.payroll.incrementAmount = "-1";
  assert.equal(employeeProfileDetailsSchema.safeParse(draft).success, false);
  draft.payroll.incrementAmount = "";
  assert.equal(employeeProfileDetailsSchema.parse(draft).payroll.incrementAmount, null);
});

test("probation and employment status choices are validated independently of login account access", () => {
  const draft = employeeProfileToDraft(initialEmployeeProfile(user));
  draft.employment.employmentType = "probation";
  draft.employment.probationRequired = "no";
  assert.equal(employeeProfileDetailsSchema.safeParse(draft).success, false);
  draft.employment.probationRequired = "yes";
  assert.ok(employeeProfileMissingFields(employeeProfileDetailsSchema.parse(draft)).includes("Probation period"));
  draft.employment.probationPeriod = "3 months";
  for (const status of ["active", "resigned", "terminated"] as const) {
    draft.employment.employmentStatus = status;
    const saved = employeeProfileDetailsSchema.parse(draft);
    assert.equal(saved.employment.employmentStatus, status);
    assert.equal(saved.employment.probationPeriod, "3 months");
    assert.equal("isActive" in saved, false);
  }
});

test("bank branch codes preserve leading zeros and all branch details survive editing", () => {
  const draft = employeeProfileToDraft(initialEmployeeProfile(user));
  draft.payroll.branchName = "Main Branch";
  draft.payroll.branchCode = "0007";
  draft.payroll.branchAddress = "Office Road, Karachi";
  draft.employment.company = "IEDGE";
  draft.employment.workingHours = "9:00 AM to 6:00 PM, Monday to Friday";
  const saved = employeeProfileDetailsSchema.parse(draft);
  assert.equal(saved.payroll.branchCode, "0007");
  assert.equal(saved.payroll.branchAddress, draft.payroll.branchAddress);
  assert.equal(employeeProfileToDraft(saved).payroll.branchName, "Main Branch");
  assert.equal(saved.employment.company, "IEDGE");
  assert.equal(saved.employment.workingHours, draft.employment.workingHours);
});

test("older profiles receive new field defaults in memory without modifying stored values", () => {
  const current = initialEmployeeProfile(user);
  const { personalEmail, ...personal } = current.personal;
  const { company, employmentStatus, workingHours, probationRequired, probationPeriod, ...employment } = current.employment;
  const { incrementAmount, incrementEffectiveFrom, branchName, branchCode, branchAddress, ...payroll } = current.payroll;
  const legacy = { ...current, personal, employment, payroll };
  const before = JSON.stringify(legacy);
  const normalized = employeeProfileDetailsWithDefaults(legacy);
  const draft = employeeProfileToDraft(legacy);
  assert.equal(normalized.personal.fullName, user.displayName);
  assert.equal(normalized.personal.email, user.email);
  assert.equal(normalized.personal.personalEmail, "");
  assert.equal(normalized.employment.company, "");
  assert.equal(normalized.employment.employmentStatus, "active");
  assert.equal(normalized.employment.probationRequired, "");
  assert.equal(normalized.payroll.incrementAmount, null);
  assert.equal(draft.payroll.incrementAmount, "");
  assert.equal(draft.payroll.branchCode, "");
  assert.equal(employeeProfileDetailsSchema.parse(legacy).employment.company, "");
  assert.equal(JSON.stringify(legacy), before);
});

test("the editor starts with the list's count and updates incomplete fields while a draft is edited", () => {
  const profile = initialEmployeeProfile(user);
  const draft = employeeProfileToDraft(profile);
  const initial = employeeProfileIncompleteFields(draft);
  assert.equal(initial.length, 12);
  assert.deepEqual(initial.map((field) => field.label), employeeProfileMissingFields(profile));
  draft.personal.nationalId = "12345-1234567-1";
  let missing = employeeProfileIncompleteFields(draft);
  assert.equal(missing.length, 11);
  assert.ok(!missing.some((field) => field.fieldIds.includes("personal.nationalId")));
  // Clearing a name makes the draft invalid, but completion must still update.
  draft.personal.fullName = "";
  assert.equal(employeeProfileDetailsSchema.safeParse(draft).success, false);
  missing = employeeProfileIncompleteFields(draft);
  assert.equal(missing.length, 12);
  assert.ok(missing.some((field) => field.section === "personal" && field.fieldIds.includes("personal.fullName")));
});

test("completion marks blank inputs, preserves zero salary, and treats account number or IBAN as one requirement", () => {
  const draft = employeeProfileToDraft(initialEmployeeProfile(user));
  draft.employment.employeeCode = "   ";
  draft.payroll = updatePayrollTotalSalary(draft.payroll, "0");
  draft.payroll.paymentMethod = "bank_transfer";
  draft.payroll.accountNumber = "  ";
  let missing = employeeProfileIncompleteFields(draft);
  assert.ok(missing.some((field) => field.fieldIds.includes("employment.employeeCode")));
  assert.ok(!missing.some((field) => field.fieldIds.includes("payroll.totalSalary")));
  assert.ok(!missing.some((field) => field.fieldIds.includes("personal.personalEmail")));
  const accountRequirement = missing.filter((field) => field.fieldIds.includes("payroll.accountNumber"));
  assert.equal(accountRequirement.length, 1);
  assert.deepEqual(accountRequirement[0].fieldIds, ["payroll.accountNumber", "payroll.iban"]);
  const before = missing.length;
  draft.payroll.iban = "PK00TEST0000000000000000";
  missing = employeeProfileIncompleteFields(draft);
  assert.equal(missing.length, before - 1);
  assert.ok(!missing.some((field) => field.fieldIds.includes("payroll.accountNumber") || field.fieldIds.includes("payroll.iban")));
});

test("conditional completion indicators follow probation and increment changes before saving", () => {
  const draft = employeeProfileToDraft(initialEmployeeProfile(user));
  draft.employment.probationRequired = "yes";
  draft.payroll.incrementAmount = "5000";
  let ids = employeeProfileIncompleteFields(draft).flatMap((field) => field.fieldIds);
  assert.ok(ids.includes("employment.probationPeriod"));
  assert.ok(ids.includes("payroll.incrementEffectiveFrom"));
  draft.employment.probationRequired = "no";
  draft.payroll.incrementAmount = "0";
  ids = employeeProfileIncompleteFields(draft).flatMap((field) => field.fieldIds);
  assert.ok(!ids.includes("employment.probationPeriod"));
  assert.ok(!ids.includes("payroll.incrementEffectiveFrom"));
});

test("account creation preserves Main Admin access and requires valid login credentials", () => {
  assert.equal(canCreateEmployeeAccounts("main_admin"), true);
  for (const role of ["finance", "financial_admin", "sales", undefined]) assert.equal(canCreateEmployeeAccounts(role), false);
  assert.equal(employeeAccountSchema.safeParse({ role: "sales", password: "short" }).success, false);
  assert.equal(employeeAccountSchema.safeParse({ role: "", password: "local-test-password" }).success, false);
  const account = employeeAccountSchema.parse({ role: "sales", password: "local-test-password" });
  assert.equal(account.mobileCountryCode, "+92");
  assert.equal(account.financialLimit, 0);
  assert.equal(account.budgetRequestVisibility, "role");
});

test("synchronized user fields exclude payroll, identity information, and access permissions", () => {
  const profile = initialEmployeeProfile(user);
  profile.personal.nationalId = "12345-1234567-1";
  profile.payroll.basicSalary = 150000;
  profile.payroll.taxableSalary = 80000;
  profile.payroll.accountNumber = "000123456";
  profile.employment.company = "IEDGE";
  const shared = employeeProfileSharedUserFields(profile, "+92");
  assert.equal(shared.displayName, user.displayName);
  assert.equal(shared.email, user.email);
  assert.equal(shared.company, "IEDGE");
  for (const field of ["payroll", "totalSalary", "taxableSalary", "basicSalary", "utilityAllowance", "nationalId", "accountNumber", "role", "financialLimit", "isActive", "accountStatus", "password"]) {
    assert.equal(field in shared, false);
  }
});

test("phone synchronization preserves country codes without duplicating them", () => {
  const profile = initialEmployeeProfile(user);
  for (const phone of ["+92 3001234567", "+923001234567", "3001234567"]) {
    profile.personal.phone = phone;
    const shared = employeeProfileSharedUserFields(profile, "+92");
    assert.equal(shared.mobileCountryCode, "+92");
    assert.equal(shared.mobileNo, "3001234567");
    assert.equal(shared.phone, "+92 3001234567");
  }
  profile.personal.phone = "+44 7700123456";
  assert.equal(employeeProfileSharedUserFields(profile, "+92").phone, "+44 7700123456");
  profile.personal.phone = "";
  assert.equal(employeeProfileSharedUserFields(profile, "+92").phone, "");
});

test("total salary is divided into the requested basic, house rent, and utility percentages", () => {
  assert.deepEqual(calculateEmployeeSalary(100000), {
    totalSalary: 100000, basicSalary: 64520, housingAllowance: 29030, utilityAllowance: 6450,
  });
  assert.deepEqual(calculateEmployeeSalary(25000), {
    totalSalary: 25000, basicSalary: 16130, housingAllowance: 7257.5, utilityAllowance: 1612.5,
  });
});

test("cent rounding reconciles the salary breakdown to the entered total", () => {
  for (const total of [0, 0.01, 0.02, 0.03, 1, 99.99, 100000.01, 123456.78, 1000000000]) {
    const parts = calculateEmployeeSalary(total);
    assert.equal(Math.round((parts.basicSalary + parts.housingAllowance + parts.utilityAllowance) * 100), Math.round(total * 100));
    assert.ok(parts.utilityAllowance >= 0);
  }
  // Exercise small amounts where independently rounded percentages can differ
  // from the total by one cent.
  for (let cents = 1; cents <= 10000; cents++) {
    const parts = calculateEmployeeSalary(cents / 100);
    assert.equal(Math.round((parts.basicSalary + parts.housingAllowance + parts.utilityAllowance) * 100), cents);
    assert.ok(parts.utilityAllowance >= 0);
  }
  assert.deepEqual(calculateEmployeeSalary(100000.01), {
    totalSalary: 100000.01, basicSalary: 64520.01, housingAllowance: 29030, utilityAllowance: 6450,
  });
});

test("editing or clearing the total updates all calculated fields and preserves separate allowances", () => {
  const draft = employeeProfileToDraft(initialEmployeeProfile(user));
  draft.payroll.transportAllowance = "5000";
  draft.payroll.incrementAmount = "2000";
  let payroll = updatePayrollTotalSalary(draft.payroll, "100000");
  assert.equal(payroll.basicSalary, "64520.00");
  assert.equal(payroll.housingAllowance, "29030.00");
  assert.equal(payroll.utilityAllowance, "6450.00");
  payroll = updatePayrollTotalSalary(payroll, "25000");
  assert.equal(payroll.basicSalary, "16130.00");
  assert.equal(payroll.housingAllowance, "7257.50");
  payroll = updatePayrollTotalSalary(payroll, "");
  assert.equal(payroll.basicSalary, "");
  assert.equal(payroll.housingAllowance, "");
  assert.equal(payroll.utilityAllowance, "");
  assert.equal(payroll.transportAllowance, "5000");
  assert.equal(payroll.incrementAmount, "2000");
});

test("invalid totals never produce NaN in calculated fields and cannot be saved", () => {
  const draft = employeeProfileToDraft(initialEmployeeProfile(user));
  for (const invalid of ["-1", "NaN", "Infinity", "salary", "1.005", "1000000001"]) {
    draft.payroll = updatePayrollTotalSalary(draft.payroll, invalid);
    assert.equal(draft.payroll.basicSalary, "");
    assert.equal(draft.payroll.housingAllowance, "");
    assert.equal(draft.payroll.utilityAllowance, "");
    assert.equal(employeeProfileDetailsSchema.safeParse(draft).success, false);
  }
});

test("saving recalculates the split from total salary even if derived values were modified", () => {
  const draft = employeeProfileToDraft(initialEmployeeProfile(user));
  draft.payroll.totalSalary = "100000";
  draft.payroll.basicSalary = "1";
  draft.payroll.housingAllowance = "2";
  draft.payroll.utilityAllowance = "3";
  const saved = employeeProfileDetailsSchema.parse(draft);
  assert.equal(saved.payroll.basicSalary, 64520);
  assert.equal(saved.payroll.housingAllowance, 29030);
  assert.equal(saved.payroll.utilityAllowance, 6450);
});

test("legacy salary components are preserved until an explicit total is supplied", () => {
  const current = initialEmployeeProfile(user);
  const { totalSalary, utilityAllowance, ...payroll } = current.payroll;
  payroll.basicSalary = 80000;
  payroll.housingAllowance = 20000;
  const stored = { ...current, payroll };
  const before = JSON.stringify(stored);
  const normalized = employeeProfileDetailsWithDefaults(stored);
  assert.equal(normalized.payroll.totalSalary, null);
  assert.equal(normalized.payroll.utilityAllowance, null);
  assert.equal(normalized.payroll.basicSalary, 80000);
  assert.equal(normalized.payroll.housingAllowance, 20000);
  assert.equal(employeeProfileToDraft(stored).payroll.totalSalary, "");
  assert.equal(JSON.stringify(stored), before);
});

test("taxable salary round-trips independently of total salary and keeps explicit zero", () => {
  const draft = employeeProfileToDraft(initialEmployeeProfile(user));
  draft.payroll = updatePayrollTotalSalary(draft.payroll, "100000");
  draft.payroll.taxableSalary = "60000.25";
  const saved = employeeProfileDetailsSchema.parse(draft);
  assert.equal(saved.payroll.taxableSalary, 60000.25);
  assert.equal(saved.payroll.totalSalary, 100000);
  assert.equal(saved.payroll.basicSalary, 64520);
  assert.equal(employeeProfileToDraft(saved).payroll.taxableSalary, "60000.25");
  assert.equal(updatePayrollTotalSalary(draft.payroll, "120000").taxableSalary, "60000.25");
  draft.payroll.taxableSalary = "0";
  assert.equal(employeeProfileDetailsSchema.parse(draft).payroll.taxableSalary, 0);
  assert.ok(!employeeProfileIncompleteFields(draft).some((f) => f.fieldIds.includes("payroll.taxableSalary")));
  draft.payroll.taxableSalary = "";
  assert.equal(employeeProfileDetailsSchema.parse(draft).payroll.taxableSalary, null);
  assert.ok(!employeeProfileIncompleteFields(draft).some((f) => f.fieldIds.includes("payroll.taxableSalary")));
});
test("invalid taxable salaries are rejected and legacy values stay missing without a database migration", () => {
  const draft = employeeProfileToDraft(initialEmployeeProfile(user));
  for (const invalid of ["-1", "NaN", "Infinity", "not money", "1.005", "1000000001"]) {
    draft.payroll.taxableSalary = invalid;
    assert.equal(employeeProfileDetailsSchema.safeParse(draft).success, false);
  }
  const current = initialEmployeeProfile(user);
  const { taxableSalary: _taxable, ...payroll } = current.payroll;
  const legacy = { ...current, payroll }, before = JSON.stringify(legacy);
  assert.equal(employeeProfileDetailsWithDefaults(legacy).payroll.taxableSalary, null);
  assert.equal(employeeProfileToDraft(legacy).payroll.taxableSalary, "");
  assert.equal(employeeProfileDetailsSchema.parse(legacy).payroll.taxableSalary, null);
  assert.equal(JSON.stringify(legacy), before);
});
