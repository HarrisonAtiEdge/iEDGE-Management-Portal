// import { z } from "zod";

// export const EMPLOYEE_PROFILE_COLLECTION = "EmployeeProfile";
// export const EMPLOYEE_PROFILE_PATH = "/employee-profile";
// export const EMPLOYEE_PROFILE_ROLES = ["main_admin", "financial_admin", "finance"];

// export function canManageEmployeeProfiles(role: unknown) {
//   return EMPLOYEE_PROFILE_ROLES.includes(String(role || "").trim().toLowerCase());
// }

// export function canCreateEmployeeAccounts(role: unknown) {
//   return String(role || "").trim().toLowerCase() === "main_admin";
// }

// export const employeeAccountSchema = z.object({
//   role: z.string().trim().min(1, "Select a login role.").max(100),
//   password: z.string().min(6, "Use a password with at least 6 characters."),
//   mobileCountryCode: z.string().trim().regex(/^\+[1-9]\d{0,2}$/, "Enter a country calling code, such as +92.").default("+92"),
//   financialLimit: z.number().finite().min(0).default(0),
//   budgetRequestVisibility: z.enum(["role", "own", "assigned", "all"]).default("role"),
//   purchaseOrderVisibility: z.enum(["own", "all"]).default("own"),
// });
// export type EmployeeAccountInput = z.input<typeof employeeAccountSchema>;

// export interface EmployeeSourceUser {
//   id: string;
//   displayName?: string;
//   name?: string;
//   email?: string;
//   role?: string;
//   accountStatus?: string;
//   isActive?: boolean;
//   mobileCountryCode?: string;
//   mobileNo?: string;
//   region?: string;
//   reportingTo?: string;
//   designation?: string;
//   department?: string;
//   personalEmail?: string;
//   phone?: string;
//   employeeCode?: string;
//   company?: string;
// }

// export function isActiveEmployeeUser(user: EmployeeSourceUser) {
//   return user.accountStatus === "approved" && user.isActive !== false;
// }

// const text = z.string().trim().max(500);
// const date = z.string().refine((value) => {
//   if (!value) return true;
//   return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
//     !Number.isNaN(Date.parse(value)) &&
//     new Date(value).toISOString().slice(0, 10) === value;
// }, "Enter a valid date.");
// const amount = z.preprocess((value) => {
//   if (value === null || value === "" || (typeof value === "string" && !value.trim())) return null;
//   return typeof value === "string" ? Number(value) : value;
// }, z.number().finite().min(0, "Amounts cannot be negative.").max(1_000_000_000).nullable());
// const totalSalaryAmount = amount.refine((value) => value === null || Number(value.toFixed(2)) === value,
//   "Enter a total salary with no more than 2 decimal places.");

// export function calculateEmployeeSalary(totalSalary: number) {
//   if (!Number.isFinite(totalSalary) || totalSalary < 0 || totalSalary > 1_000_000_000 || Number(totalSalary.toFixed(2)) !== totalSalary) {
//     throw new RangeError("Total salary must be a non-negative amount with no more than 2 decimal places.");
//   }
//   const totalCents = Math.round(totalSalary * 100);
//   const basicCents = Math.round(totalCents * 6452 / 10000);
//   const housingCents = Math.round(totalCents * 2903 / 10000);
//   // Assign any one-cent rounding difference to utility so the split always
//   // reconciles to the entered total, including salaries with decimal amounts.
//   const utilityCents = totalCents - basicCents - housingCents;
//   return {
//     totalSalary: totalCents / 100,
//     basicSalary: basicCents / 100,
//     housingAllowance: housingCents / 100,
//     utilityAllowance: utilityCents / 100,
//   };
// }

// export const employeeProfileDetailsSchema = z.object({
//   personal: z.object({
//     fullName: text.min(1, "Full name is required."),
//     email: z.union([z.literal(""), z.string().trim().email("Enter a valid email address.")]),
//     personalEmail: z.union([z.literal(""), z.string().trim().email("Enter a valid personal email address.")]).default(""),
//     phone: text,
//     fatherName: text,
//     dateOfBirth: date,
//     gender: z.enum(["", "male", "female", "other", "prefer_not_to_say"]),
//     maritalStatus: z.enum(["", "single", "married", "other"]),
//     nationality: text,
//     nationalId: text,
//     passportNumber: text,
//     taxNumber: text,
//     currentAddress: text,
//     permanentAddress: text,
//   }),
//   employment: z.object({
//     employeeCode: text,
//     joiningDate: date,
//     department: text,
//     designation: text,
//     company: text.default(""),
//     employmentType: z.enum(["", "permanent", "contract", "probation", "part_time", "intern", "consultant"]),
//     employmentStatus: z.enum(["active", "resigned", "terminated"]).default("active"),
//     workingHours: text.default(""),
//     probationRequired: z.enum(["", "yes", "no"]).default(""),
//     probationPeriod: text.default(""),
//     probationEndDate: date,
//     workLocation: text,
//     region: text,
//     reportingTo: text,
//   }),
//   emergency: z.object({ name: text, relationship: text, phone: text, address: text }),
//   payroll: z.object({
//     currency: z.string().trim().regex(/^[A-Z]{3}$/, "Use a three-letter currency code, such as PKR."),
//     totalSalary: totalSalaryAmount.default(null),
//     basicSalary: amount,
//     housingAllowance: amount,
//     utilityAllowance: amount.default(null),
//     transportAllowance: amount,
//     otherAllowances: amount,
//     incrementAmount: amount.default(null),
//     incrementEffectiveFrom: date.default(""),
//     effectiveFrom: date,
//     paymentMethod: z.enum(["", "bank_transfer", "cash", "cheque"]),
//     bankName: text,
//     branchName: text.default(""),
//     branchCode: text.default(""),
//     branchAddress: text.default(""),
//     accountTitle: text,
//     accountNumber: text,
//     iban: z.string().trim().max(34, "IBAN cannot exceed 34 characters."),
//   }),
//   onboarding: z.object({
//     identityDocumentReceived: z.boolean(),
//     contractSigned: z.boolean(),
//     bankDetailsVerified: z.boolean(),
//     notes: z.string().trim().max(3000),
//   }),
// }).superRefine((details, context) => {
//   if (details.employment.employmentType === "probation" && details.employment.probationRequired === "no") {
//     context.addIssue({ code: "custom", path: ["employment", "probationRequired"], message: "Probation must apply when the employment type is Probation." });
//   }
//   if (details.employment.joiningDate && details.employment.probationEndDate &&
//     details.employment.probationEndDate < details.employment.joiningDate) {
//     context.addIssue({ code: "custom", path: ["employment", "probationEndDate"], message: "Probation cannot end before the joining date." });
//   }
// }).transform((details) => details.payroll.totalSalary === null ? details : {
//   ...details,
//   payroll: { ...details.payroll, ...calculateEmployeeSalary(details.payroll.totalSalary) },
// });

// export type EmployeeProfileDetails = z.output<typeof employeeProfileDetailsSchema>;
// export type EmployeeProfileDraft = Omit<EmployeeProfileDetails, "payroll"> & {
//   payroll: Omit<EmployeeProfileDetails["payroll"], "totalSalary" | "basicSalary" | "housingAllowance" | "utilityAllowance" | "transportAllowance" | "otherAllowances" | "incrementAmount"> & {
//     totalSalary: string;
//     basicSalary: string;
//     housingAllowance: string;
//     utilityAllowance: string;
//     transportAllowance: string;
//     otherAllowances: string;
//     incrementAmount: string;
//   };
// };

// export function updatePayrollTotalSalary(payroll: EmployeeProfileDraft["payroll"], value: string): EmployeeProfileDraft["payroll"] {
//   const total = totalSalaryAmount.safeParse(value);
//   if (!total.success || total.data === null) {
//     return { ...payroll, totalSalary: value, basicSalary: "", housingAllowance: "", utilityAllowance: "" };
//   }
//   const breakdown = calculateEmployeeSalary(total.data);
//   return {
//     ...payroll, totalSalary: value,
//     basicSalary: breakdown.basicSalary.toFixed(2),
//     housingAllowance: breakdown.housingAllowance.toFixed(2),
//     utilityAllowance: breakdown.utilityAllowance.toFixed(2),
//   };
// }

// export interface EmployeeProfile extends EmployeeProfileDetails {
//   id: string;
//   userId: string;
//   schemaVersion: number;
//   revision: number;
//   sourceRole: string;
//   createdAt?: { toDate(): Date };
//   updatedAt?: { toDate(): Date };
//   createdById: string;
//   updatedById: string;
// }

// export function initialEmployeeProfile(user: EmployeeSourceUser): EmployeeProfileDetails {
//   return {
//     personal: {
//       fullName: user.displayName || user.name || user.email || user.id,
//       email: user.email || "",
//       personalEmail: user.personalEmail || "",
//       phone: user.phone || [user.mobileCountryCode, user.mobileNo].filter(Boolean).join(" "),
//       fatherName: "", dateOfBirth: "", gender: "", maritalStatus: "", nationality: "",
//       nationalId: "", passportNumber: "", taxNumber: "", currentAddress: "", permanentAddress: "",
//     },
//     employment: {
//       employeeCode: user.employeeCode || "", joiningDate: "", department: user.department || user.role || "",
//       designation: user.designation || "", company: user.company || "", employmentType: "", employmentStatus: "active",
//       workingHours: "", probationRequired: "", probationPeriod: "", probationEndDate: "",
//       workLocation: "", region: user.region || "", reportingTo: user.reportingTo || "",
//     },
//     emergency: { name: "", relationship: "", phone: "", address: "" },
//     payroll: {
//       currency: "PKR", totalSalary: null, basicSalary: null, housingAllowance: null, utilityAllowance: null, transportAllowance: null,
//       otherAllowances: null, incrementAmount: null, incrementEffectiveFrom: "",
//       effectiveFrom: "", paymentMethod: "", bankName: "", branchName: "", branchCode: "", branchAddress: "",
//       accountTitle: "", accountNumber: "", iban: "",
//     },
//     onboarding: { identityDocumentReceived: false, contractSigned: false, bankDetailsVerified: false, notes: "" },
//   };
// }

// // Only these account/contact fields are shared. Authentication permissions and
// // sensitive HR/payroll information never come from this profile projection.
// export function employeeProfileSharedUserFields(profile: EmployeeProfileDetails, countryCode = "") {
//   const phone = profile.personal.phone.trim();
//   const explicitCode = phone.match(/^(\+[1-9]\d{0,2})\s+(.+)$/);
//   let mobileCountryCode = countryCode;
//   let mobileNo = phone;
//   if (explicitCode) {
//     mobileCountryCode = explicitCode[1];
//     mobileNo = explicitCode[2].trim();
//   } else if (countryCode && phone.startsWith(countryCode)) {
//     mobileNo = phone.slice(countryCode.length).trim();
//   } else if (phone.startsWith("+")) {
//     // Preserve an explicitly international number rather than guessing its prefix.
//     mobileCountryCode = "";
//   }
//   if (!phone) mobileCountryCode = "";
//   return {
//     displayName: profile.personal.fullName,
//     email: profile.personal.email,
//     personalEmail: profile.personal.personalEmail,
//     phone: [mobileCountryCode, mobileNo].filter(Boolean).join(" "),
//     mobileCountryCode, mobileNo,
//     employeeCode: profile.employment.employeeCode,
//     designation: profile.employment.designation,
//     department: profile.employment.department,
//     company: profile.employment.company,
//     region: profile.employment.region,
//     reportingTo: profile.employment.reportingTo,
//   };
// }

// type StoredEmployeeProfileDetails = {
//   [Section in keyof EmployeeProfileDetails]?: Partial<EmployeeProfileDetails[Section]>;
// };

// // Apply new field defaults in memory, keeping older records editable without
// // migrating or writing any existing documents just because they were loaded.
// export function employeeProfileDetailsWithDefaults(stored: StoredEmployeeProfileDetails): EmployeeProfileDetails {
//   const defaults = initialEmployeeProfile({ id: "" });
//   const details: EmployeeProfileDetails = {
//     personal: { ...defaults.personal, ...stored.personal },
//     employment: { ...defaults.employment, ...stored.employment },
//     emergency: { ...defaults.emergency, ...stored.emergency },
//     payroll: { ...defaults.payroll, ...stored.payroll },
//     onboarding: { ...defaults.onboarding, ...stored.onboarding },
//   };
//   // An older profile's basic salary is never reinterpreted as its total.
//   // Recalculate in memory only when an explicit, valid total was recorded.
//   const total = totalSalaryAmount.safeParse(details.payroll.totalSalary);
//   if (total.success && total.data !== null) Object.assign(details.payroll, calculateEmployeeSalary(total.data));
//   return details;
// }

// export function employeeProfileToDraft(stored: StoredEmployeeProfileDetails): EmployeeProfileDraft {
//   const profile = employeeProfileDetailsWithDefaults(stored);
//   return {
//     personal: { ...profile.personal }, employment: { ...profile.employment },
//     emergency: { ...profile.emergency }, onboarding: { ...profile.onboarding },
//     payroll: {
//       ...profile.payroll,
//       totalSalary: profile.payroll.totalSalary === null ? "" : String(profile.payroll.totalSalary),
//       basicSalary: profile.payroll.basicSalary === null ? "" : String(profile.payroll.basicSalary),
//       housingAllowance: profile.payroll.housingAllowance === null ? "" : String(profile.payroll.housingAllowance),
//       utilityAllowance: profile.payroll.utilityAllowance === null ? "" : String(profile.payroll.utilityAllowance),
//       transportAllowance: profile.payroll.transportAllowance === null ? "" : String(profile.payroll.transportAllowance),
//       otherAllowances: profile.payroll.otherAllowances === null ? "" : String(profile.payroll.otherAllowances),
//       incrementAmount: profile.payroll.incrementAmount === null ? "" : String(profile.payroll.incrementAmount),
//     },
//   };
// }

// export type EmployeeProfileSection = Exclude<keyof EmployeeProfileDetails, "onboarding">;
// type EmployeeProfileFieldId = {
//   [Section in EmployeeProfileSection]: `${Section}.${Extract<keyof EmployeeProfileDetails[Section], string>}`;
// }[EmployeeProfileSection];

// export interface IncompleteEmployeeProfileField {
//   label: string;
//   section: EmployeeProfileSection;
//   fieldIds: EmployeeProfileFieldId[];
//   hint?: string;
// }

// const isUnrecorded = (value: unknown) => value == null || (typeof value === "string" && value.trim() === "");

// // Both the list and editor use these same completion requirements. Accept raw
// // draft values so the editor updates even before a partially entered form is valid.
// export function employeeProfileIncompleteFields(profile: EmployeeProfileDetails | EmployeeProfileDraft): IncompleteEmployeeProfileField[] {
//   const required: Array<[EmployeeProfileFieldId, string]> = [
//     ["personal.fullName", "Full name"], ["personal.email", "Email"],
//     ["personal.phone", "Phone"], ["personal.nationalId", "National ID / CNIC"],
//     ["employment.employeeCode", "Employee ID"], ["employment.joiningDate", "Joining date"],
//     ["employment.department", "Department"], ["employment.designation", "Designation"],
//     ["employment.company", "Company"], ["employment.employmentType", "Employment type"],
//     ["employment.workingHours", "Working hours"], ["employment.probationRequired", "Probation applies"],
//     ["emergency.name", "Emergency contact"], ["emergency.phone", "Emergency phone"],
//     ["payroll.totalSalary", "Total salary"], ["payroll.effectiveFrom", "Salary effective date"],
//     ["payroll.paymentMethod", "Payment method"],
//   ];
//   if (profile.employment.probationRequired === "yes" || profile.employment.employmentType === "probation") {
//     required.push(["employment.probationPeriod", "Probation period"]);
//   }
//   if (Number(profile.payroll.incrementAmount) > 0) {
//     required.push(["payroll.incrementEffectiveFrom", "Increment effective date"]);
//   }
//   if (profile.payroll.paymentMethod === "bank_transfer") {
//     required.push(["payroll.bankName", "Bank name"], ["payroll.accountTitle", "Account title"]);
//   }
//   const missing: IncompleteEmployeeProfileField[] = [];
//   for (const [fieldId, label] of required) {
//     const [section, key] = fieldId.split(".") as [EmployeeProfileSection, string];
//     if (isUnrecorded((profile[section] as Record<string, unknown>)[key])) {
//       missing.push({ label, section, fieldIds: [fieldId] });
//     }
//   }
//   if (profile.payroll.paymentMethod === "bank_transfer" &&
//     isUnrecorded(profile.payroll.accountNumber) && isUnrecorded(profile.payroll.iban)) {
//     missing.push({ label: "Account number / IBAN", section: "payroll",
//       fieldIds: ["payroll.accountNumber", "payroll.iban"], hint: "Enter an account number or IBAN." });
//   }
//   return missing;
// }

// export function employeeProfileMissingFields(profile: EmployeeProfileDetails) {
//   return employeeProfileIncompleteFields(profile).map((field) => field.label);
// }

import { z } from "zod";

export const EMPLOYEE_PROFILE_COLLECTION = "EmployeeProfile";
export const EMPLOYEE_PROFILE_PATH = "/employee-profile";
export const EMPLOYEE_PROFILE_ROLES = [
  "main_admin",
  "financial_admin",
  "finance",
];

export function canManageEmployeeProfiles(role: unknown) {
  return EMPLOYEE_PROFILE_ROLES.includes(
    String(role || "")
      .trim()
      .toLowerCase(),
  );
}

export function canCreateEmployeeAccounts(role: unknown) {
  return (
    String(role || "")
      .trim()
      .toLowerCase() === "main_admin"
  );
}

export const employeeAccountSchema = z.object({
  role: z.string().trim().min(1, "Select a login role.").max(100),
  password: z.string().min(6, "Use a password with at least 6 characters."),
  mobileCountryCode: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{0,2}$/, "Enter a country calling code, such as +92.")
    .default("+92"),
  financialLimit: z.number().finite().min(0).default(0),
  budgetRequestVisibility: z
    .enum(["role", "own", "assigned", "all"])
    .default("role"),
  purchaseOrderVisibility: z.enum(["own", "all"]).default("own"),
});
export type EmployeeAccountInput = z.input<typeof employeeAccountSchema>;

export interface EmployeeSourceUser {
  id: string;
  displayName?: string;
  name?: string;
  email?: string;
  role?: string;
  accountStatus?: string;
  isActive?: boolean;
  mobileCountryCode?: string;
  mobileNo?: string;
  region?: string;
  reportingTo?: string;
  designation?: string;
  department?: string;
  personalEmail?: string;
  phone?: string;
  employeeCode?: string;
  company?: string;
}

export function isActiveEmployeeUser(user: EmployeeSourceUser) {
  return user.accountStatus === "approved" && user.isActive !== false;
}

const text = z.string().trim().max(500);
const date = z.string().refine((value) => {
  if (!value) return true;
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}, "Enter a valid date.");
const amount = z.preprocess((value) => {
  if (
    value === null ||
    value === "" ||
    (typeof value === "string" && !value.trim())
  )
    return null;
  return typeof value === "string" ? Number(value) : value;
}, z.number().finite().min(0, "Amounts cannot be negative.").max(1_000_000_000).nullable());
const totalSalaryAmount = amount.refine(
  (value) => value === null || Number(value.toFixed(2)) === value,
  "Enter a total salary with no more than 2 decimal places.",
);
const taxableSalaryAmount = amount.refine(
  (value) => value === null || Number(value.toFixed(2)) === value,
  "Enter a taxable salary with no more than 2 decimal places.",
);

export function calculateEmployeeSalary(totalSalary: number) {
  if (
    !Number.isFinite(totalSalary) ||
    totalSalary < 0 ||
    totalSalary > 1_000_000_000 ||
    Number(totalSalary.toFixed(2)) !== totalSalary
  ) {
    throw new RangeError(
      "Total salary must be a non-negative amount with no more than 2 decimal places.",
    );
  }
  const totalCents = Math.round(totalSalary * 100);
  const basicCents = Math.round((totalCents * 6452) / 10000);
  const housingCents = Math.round((totalCents * 2903) / 10000);
  // Assign any one-cent rounding difference to utility so the split always
  // reconciles to the entered total, including salaries with decimal amounts.
  const utilityCents = totalCents - basicCents - housingCents;
  return {
    totalSalary: totalCents / 100,
    basicSalary: basicCents / 100,
    housingAllowance: housingCents / 100,
    utilityAllowance: utilityCents / 100,
  };
}

export const employeeProfileDetailsSchema = z
  .object({
    personal: z.object({
      fullName: text.min(1, "Full name is required."),
      email: z.union([
        z.literal(""),
        z.string().trim().email("Enter a valid email address."),
      ]),
      personalEmail: z
        .union([
          z.literal(""),
          z.string().trim().email("Enter a valid personal email address."),
        ])
        .default(""),
      phone: text,
      fatherName: text,
      dateOfBirth: date,
      gender: z.enum(["", "male", "female", "other", "prefer_not_to_say"]),
      maritalStatus: z.enum(["", "single", "married", "other"]),
      nationality: text,
      nationalId: text,
      passportNumber: text,
      taxNumber: text,
      currentAddress: text,
      permanentAddress: text,
    }),
    employment: z.object({
      employeeCode: text,
      joiningDate: date,
      department: text,
      designation: text,
      company: text.default(""),
      employmentType: z.enum([
        "",
        "permanent",
        "contract",
        "probation",
        "part_time",
        "intern",
        "consultant",
      ]),
      employmentStatus: z
        .enum(["active", "resigned", "terminated"])
        .default("active"),
      workingHours: text.default(""),
      probationRequired: z.enum(["", "yes", "no"]).default(""),
      probationPeriod: text.default(""),
      probationEndDate: date,
      workLocation: text,
      region: text,
      reportingTo: text,
    }),
    emergency: z.object({
      name: text,
      relationship: text,
      phone: text,
      address: text,
    }),
    payroll: z.object({
      currency: z
        .string()
        .trim()
        .regex(/^[A-Z]{3}$/, "Use a three-letter currency code, such as PKR."),
      totalSalary: totalSalaryAmount.default(null),
      taxableSalary: taxableSalaryAmount.default(null),
      basicSalary: amount,
      housingAllowance: amount,
      utilityAllowance: amount.default(null),
      transportAllowance: amount,
      otherAllowances: amount,
      incrementAmount: amount.default(null),
      incrementEffectiveFrom: date.default(""),
      effectiveFrom: date,
      paymentMethod: z.enum(["", "bank_transfer", "cash", "cheque"]),
      bankName: text,
      branchName: text.default(""),
      branchCode: text.default(""),
      branchAddress: text.default(""),
      accountTitle: text,
      accountNumber: text,
      iban: z.string().trim().max(34, "IBAN cannot exceed 34 characters."),
    }),
    onboarding: z.object({
      identityDocumentReceived: z.boolean(),
      contractSigned: z.boolean(),
      bankDetailsVerified: z.boolean(),
      notes: z.string().trim().max(3000),
    }),
  })
  .superRefine((details, context) => {
    if (
      details.employment.employmentType === "probation" &&
      details.employment.probationRequired === "no"
    ) {
      context.addIssue({
        code: "custom",
        path: ["employment", "probationRequired"],
        message: "Probation must apply when the employment type is Probation.",
      });
    }
    if (
      details.employment.joiningDate &&
      details.employment.probationEndDate &&
      details.employment.probationEndDate < details.employment.joiningDate
    ) {
      context.addIssue({
        code: "custom",
        path: ["employment", "probationEndDate"],
        message: "Probation cannot end before the joining date.",
      });
    }
  })
  .transform((details) =>
    details.payroll.totalSalary === null
      ? details
      : {
          ...details,
          payroll: {
            ...details.payroll,
            ...calculateEmployeeSalary(details.payroll.totalSalary),
          },
        },
  );

export type EmployeeProfileDetails = z.output<
  typeof employeeProfileDetailsSchema
>;
export type EmployeeProfileDraft = Omit<EmployeeProfileDetails, "payroll"> & {
  payroll: Omit<
    EmployeeProfileDetails["payroll"],
    | "totalSalary"
    | "taxableSalary"
    | "basicSalary"
    | "housingAllowance"
    | "utilityAllowance"
    | "transportAllowance"
    | "otherAllowances"
    | "incrementAmount"
  > & {
    totalSalary: string;
    taxableSalary: string;
    basicSalary: string;
    housingAllowance: string;
    utilityAllowance: string;
    transportAllowance: string;
    otherAllowances: string;
    incrementAmount: string;
  };
};

export function updatePayrollTotalSalary(
  payroll: EmployeeProfileDraft["payroll"],
  value: string,
): EmployeeProfileDraft["payroll"] {
  const total = totalSalaryAmount.safeParse(value);
  if (!total.success || total.data === null) {
    return {
      ...payroll,
      totalSalary: value,
      basicSalary: "",
      housingAllowance: "",
      utilityAllowance: "",
    };
  }
  const breakdown = calculateEmployeeSalary(total.data);
  return {
    ...payroll,
    totalSalary: value,
    basicSalary: breakdown.basicSalary.toFixed(2),
    housingAllowance: breakdown.housingAllowance.toFixed(2),
    utilityAllowance: breakdown.utilityAllowance.toFixed(2),
  };
}

export interface EmployeeProfile extends EmployeeProfileDetails {
  id: string;
  userId: string;
  schemaVersion: number;
  revision: number;
  sourceRole: string;
  createdAt?: { toDate(): Date };
  updatedAt?: { toDate(): Date };
  createdById: string;
  updatedById: string;
}

export function initialEmployeeProfile(
  user: EmployeeSourceUser,
): EmployeeProfileDetails {
  return {
    personal: {
      fullName: user.displayName || user.name || user.email || user.id,
      email: user.email || "",
      personalEmail: user.personalEmail || "",
      phone:
        user.phone ||
        [user.mobileCountryCode, user.mobileNo].filter(Boolean).join(" "),
      fatherName: "",
      dateOfBirth: "",
      gender: "",
      maritalStatus: "",
      nationality: "",
      nationalId: "",
      passportNumber: "",
      taxNumber: "",
      currentAddress: "",
      permanentAddress: "",
    },
    employment: {
      employeeCode: user.employeeCode || "",
      joiningDate: "",
      department: user.department || user.role || "",
      designation: user.designation || "",
      company: user.company || "",
      employmentType: "",
      employmentStatus: "active",
      workingHours: "",
      probationRequired: "",
      probationPeriod: "",
      probationEndDate: "",
      workLocation: "",
      region: user.region || "",
      reportingTo: user.reportingTo || "",
    },
    emergency: { name: "", relationship: "", phone: "", address: "" },
    payroll: {
      currency: "PKR",
      totalSalary: null,
      taxableSalary: null,
      basicSalary: null,
      housingAllowance: null,
      utilityAllowance: null,
      transportAllowance: null,
      otherAllowances: null,
      incrementAmount: null,
      incrementEffectiveFrom: "",
      effectiveFrom: "",
      paymentMethod: "",
      bankName: "",
      branchName: "",
      branchCode: "",
      branchAddress: "",
      accountTitle: "",
      accountNumber: "",
      iban: "",
    },
    onboarding: {
      identityDocumentReceived: false,
      contractSigned: false,
      bankDetailsVerified: false,
      notes: "",
    },
  };
}

// Only these account/contact fields are shared. Authentication permissions and
// sensitive HR/payroll information never come from this profile projection.
export function employeeProfileSharedUserFields(
  profile: EmployeeProfileDetails,
  countryCode = "",
) {
  const phone = profile.personal.phone.trim();
  const explicitCode = phone.match(/^(\+[1-9]\d{0,2})\s+(.+)$/);
  let mobileCountryCode = countryCode;
  let mobileNo = phone;
  if (explicitCode) {
    mobileCountryCode = explicitCode[1];
    mobileNo = explicitCode[2].trim();
  } else if (countryCode && phone.startsWith(countryCode)) {
    mobileNo = phone.slice(countryCode.length).trim();
  } else if (phone.startsWith("+")) {
    // Preserve an explicitly international number rather than guessing its prefix.
    mobileCountryCode = "";
  }
  if (!phone) mobileCountryCode = "";
  return {
    displayName: profile.personal.fullName,
    email: profile.personal.email,
    personalEmail: profile.personal.personalEmail,
    phone: [mobileCountryCode, mobileNo].filter(Boolean).join(" "),
    mobileCountryCode,
    mobileNo,
    employeeCode: profile.employment.employeeCode,
    designation: profile.employment.designation,
    department: profile.employment.department,
    company: profile.employment.company,
    region: profile.employment.region,
    reportingTo: profile.employment.reportingTo,
  };
}

type StoredEmployeeProfileDetails = {
  [Section in keyof EmployeeProfileDetails]?: Partial<
    EmployeeProfileDetails[Section]
  >;
};

// Apply new field defaults in memory, keeping older records editable without
// migrating or writing any existing documents just because they were loaded.
export function employeeProfileDetailsWithDefaults(
  stored: StoredEmployeeProfileDetails,
): EmployeeProfileDetails {
  const defaults = initialEmployeeProfile({ id: "" });
  const details: EmployeeProfileDetails = {
    personal: { ...defaults.personal, ...stored.personal },
    employment: { ...defaults.employment, ...stored.employment },
    emergency: { ...defaults.emergency, ...stored.emergency },
    payroll: { ...defaults.payroll, ...stored.payroll },
    onboarding: { ...defaults.onboarding, ...stored.onboarding },
  };
  // An older profile's basic salary is never reinterpreted as its total.
  // Recalculate in memory only when an explicit, valid total was recorded.
  const total = totalSalaryAmount.safeParse(details.payroll.totalSalary);
  if (total.success && total.data !== null)
    Object.assign(details.payroll, calculateEmployeeSalary(total.data));
  return details;
}

export function employeeProfileToDraft(
  stored: StoredEmployeeProfileDetails,
): EmployeeProfileDraft {
  const profile = employeeProfileDetailsWithDefaults(stored);
  return {
    personal: { ...profile.personal },
    employment: { ...profile.employment },
    emergency: { ...profile.emergency },
    onboarding: { ...profile.onboarding },
    payroll: {
      ...profile.payroll,
      totalSalary:
        profile.payroll.totalSalary === null
          ? ""
          : String(profile.payroll.totalSalary),
      taxableSalary:
        profile.payroll.taxableSalary === null
          ? ""
          : String(profile.payroll.taxableSalary),
      basicSalary:
        profile.payroll.basicSalary === null
          ? ""
          : String(profile.payroll.basicSalary),
      housingAllowance:
        profile.payroll.housingAllowance === null
          ? ""
          : String(profile.payroll.housingAllowance),
      utilityAllowance:
        profile.payroll.utilityAllowance === null
          ? ""
          : String(profile.payroll.utilityAllowance),
      transportAllowance:
        profile.payroll.transportAllowance === null
          ? ""
          : String(profile.payroll.transportAllowance),
      otherAllowances:
        profile.payroll.otherAllowances === null
          ? ""
          : String(profile.payroll.otherAllowances),
      incrementAmount:
        profile.payroll.incrementAmount === null
          ? ""
          : String(profile.payroll.incrementAmount),
    },
  };
}

export type EmployeeProfileSection = Exclude<
  keyof EmployeeProfileDetails,
  "onboarding"
>;
type EmployeeProfileFieldId = {
  [Section in EmployeeProfileSection]: `${Section}.${Extract<keyof EmployeeProfileDetails[Section], string>}`;
}[EmployeeProfileSection];

export interface IncompleteEmployeeProfileField {
  label: string;
  section: EmployeeProfileSection;
  fieldIds: EmployeeProfileFieldId[];
  hint?: string;
}

const isUnrecorded = (value: unknown) =>
  value == null || (typeof value === "string" && value.trim() === "");

// Both the list and editor use these same completion requirements. Accept raw
// draft values so the editor updates even before a partially entered form is valid.
export function employeeProfileIncompleteFields(
  profile: EmployeeProfileDetails | EmployeeProfileDraft,
): IncompleteEmployeeProfileField[] {
  const required: Array<[EmployeeProfileFieldId, string]> = [
    ["personal.fullName", "Full name"],
    ["personal.email", "Email"],
    ["personal.phone", "Phone"],
    ["personal.nationalId", "National ID / CNIC"],
    ["employment.employeeCode", "Employee ID"],
    ["employment.joiningDate", "Joining date"],
    ["employment.department", "Department"],
    ["employment.designation", "Designation"],
    ["employment.company", "Company"],
    ["employment.employmentType", "Employment type"],
    ["employment.workingHours", "Working hours"],
    ["employment.probationRequired", "Probation applies"],
    ["emergency.name", "Emergency contact"],
    ["emergency.phone", "Emergency phone"],
    ["payroll.totalSalary", "Total salary"],
    ["payroll.taxableSalary", "Taxable salary"],
    ["payroll.effectiveFrom", "Salary effective date"],
    ["payroll.paymentMethod", "Payment method"],
  ];
  if (
    profile.employment.probationRequired === "yes" ||
    profile.employment.employmentType === "probation"
  ) {
    required.push(["employment.probationPeriod", "Probation period"]);
  }
  if (Number(profile.payroll.incrementAmount) > 0) {
    required.push([
      "payroll.incrementEffectiveFrom",
      "Increment effective date",
    ]);
  }
  if (profile.payroll.paymentMethod === "bank_transfer") {
    required.push(
      ["payroll.bankName", "Bank name"],
      ["payroll.accountTitle", "Account title"],
    );
  }
  const missing: IncompleteEmployeeProfileField[] = [];
  for (const [fieldId, label] of required) {
    const [section, key] = fieldId.split(".") as [
      EmployeeProfileSection,
      string,
    ];
    if (isUnrecorded((profile[section] as Record<string, unknown>)[key])) {
      missing.push({ label, section, fieldIds: [fieldId] });
    }
  }
  if (
    profile.payroll.paymentMethod === "bank_transfer" &&
    isUnrecorded(profile.payroll.accountNumber) &&
    isUnrecorded(profile.payroll.iban)
  ) {
    missing.push({
      label: "Account number / IBAN",
      section: "payroll",
      fieldIds: ["payroll.accountNumber", "payroll.iban"],
      hint: "Enter an account number or IBAN.",
    });
  }
  return missing;
}

export function employeeProfileMissingFields(profile: EmployeeProfileDetails) {
  return employeeProfileIncompleteFields(profile).map((field) => field.label);
}
