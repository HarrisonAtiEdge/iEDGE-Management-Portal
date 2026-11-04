// import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import { CheckCircle2, ClipboardCheck, Loader2, Pencil, RefreshCw, Search, ShieldCheck, UserPlus, UserRound, Users } from "lucide-react";
// import { useAuth } from "@/contexts/AuthContext";
// import { useToast } from "@/hooks/use-toast";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Badge } from "@/components/ui/badge";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Card, CardContent } from "@/components/ui/card";
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import {
//   canCreateEmployeeAccounts, canManageEmployeeProfiles, employeeAccountSchema, employeeProfileDetailsSchema,
//   employeeProfileIncompleteFields, employeeProfileMissingFields, employeeProfileToDraft, initialEmployeeProfile, updatePayrollTotalSalary,
//   type EmployeeProfile as Profile, type EmployeeSourceUser,
// } from "@/lib/employeeProfileModel";
// import { createEmployeeWithAccount, fetchEmployeeAccountRoles, importActiveEmployeeProfiles, saveEmployeeProfile, subscribeToEmployeeProfiles } from "@/lib/employeeProfiles";

// type Section = "personal" | "employment" | "emergency" | "payroll";
// type EditorTab = Section | "onboarding" | "account";
// type EditorIncompleteField = { label: string; section: EditorTab; fieldIds: string[]; hint?: string };
// const editorTabs: Array<{ key: EditorTab; label: string }> = [
//   { key: "personal", label: "Personal" }, { key: "employment", label: "Employment" },
//   { key: "emergency", label: "Emergency" }, { key: "payroll", label: "Salary & Bank" },
//   { key: "onboarding", label: "Onboarding" },
// ];
// type FieldSpec = { key: string; label: string; type?: string; placeholder?: string; options?: Array<[string, string]>; wide?: boolean; readOnly?: boolean };
// const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";
// const sections: Record<Section, { title: string; description: string; fields: FieldSpec[] }> = {
//   personal: {
//     title: "Personal details", description: "Identity and contact information for the employee's company record.",
//     fields: [
//       { key: "fullName", label: "Employee name", placeholder: "Name as shown on identity document" },
//       { key: "email", label: "Work / account email address", type: "email" },
//       { key: "personalEmail", label: "Employee personal email address", type: "email" },
//       { key: "phone", label: "Employee contact number", type: "tel", placeholder: "+92 300 1234567" },
//       { key: "fatherName", label: "Father's / guardian's name" },
//       { key: "dateOfBirth", label: "Date of birth", type: "date" },
//       { key: "gender", label: "Gender", options: [["male", "Male"], ["female", "Female"], ["other", "Other"], ["prefer_not_to_say", "Prefer not to say"]] },
//       { key: "maritalStatus", label: "Marital status", options: [["single", "Single"], ["married", "Married"], ["other", "Other"]] },
//       { key: "nationality", label: "Nationality" },
//       { key: "nationalId", label: "National ID / CNIC", placeholder: "Identity document number" },
//       { key: "passportNumber", label: "Passport number" },
//       { key: "taxNumber", label: "Tax registration / NTN" },
//       { key: "currentAddress", label: "Employee address (current)", wide: true },
//       { key: "permanentAddress", label: "Permanent address", wide: true },
//     ],
//   },
//   employment: {
//     title: "Employment details", description: "Joining information and the employee's position in the company.",
//     fields: [
//       { key: "employeeCode", label: "Employee ID", placeholder: "e.g. IEDGE-001" },
//       { key: "joiningDate", label: "Date of joining", type: "date" },
//       { key: "department", label: "Department" },
//       { key: "designation", label: "Designation / job title" },
//       { key: "company", label: "Company" },
//       { key: "employmentType", label: "Employment type", options: [["permanent", "Permanent"], ["contract", "Contract"], ["probation", "Probation"], ["part_time", "Part time"], ["intern", "Intern"], ["consultant", "Consultant"]] },
//       { key: "employmentStatus", label: "Employment status", options: [["active", "Active"], ["resigned", "Resigned"], ["terminated", "Terminated"]] },
//       { key: "workingHours", label: "Working hours", placeholder: "e.g. 9:00 AM to 6:00 PM, Monday to Friday" },
//       { key: "probationRequired", label: "Probation applies?", options: [["yes", "Yes"], ["no", "No"]] },
//       { key: "probationPeriod", label: "Probation period", placeholder: "e.g. 3 months" },
//       { key: "probationEndDate", label: "Probation end date", type: "date" },
//       { key: "workLocation", label: "Office / work location" },
//       { key: "region", label: "Region" },
//       { key: "reportingTo", label: "Reporting manager" },
//     ],
//   },
//   emergency: {
//     title: "Emergency contact", description: "The person the company should contact in an emergency.",
//     fields: [
//       { key: "name", label: "Contact name" }, { key: "relationship", label: "Relationship" },
//       { key: "phone", label: "Contact phone", type: "tel" }, { key: "address", label: "Contact address", wide: true },
//     ],
//   },
//   payroll: {
//     title: "Salary and bank details", description: "Enter the total monthly salary to calculate basic salary (64.52%), house rent (29.03%), and utility (6.45%). The amounts are rounded to 2 decimals and add up to the total. Additional allowances and increments are recorded separately.",
//     fields: [
//       { key: "currency", label: "Currency", placeholder: "PKR" },
//       { key: "effectiveFrom", label: "Salary effective date", type: "date" },
//       { key: "totalSalary", label: "Total monthly salary (100%)", type: "number", placeholder: "Enter total salary" },
//       { key: "basicSalary", label: "Basic salary (64.52%)", type: "number", readOnly: true, placeholder: "Calculated automatically" },
//       { key: "housingAllowance", label: "House rent allowance (29.03%)", type: "number", readOnly: true, placeholder: "Calculated automatically" },
//       { key: "utilityAllowance", label: "Utility allowance (6.45%)", type: "number", readOnly: true, placeholder: "Calculated automatically" },
//       { key: "incrementAmount", label: "Salary increment amount", type: "number" },
//       { key: "incrementEffectiveFrom", label: "Increment effective date", type: "date" },
//       { key: "transportAllowance", label: "Additional transport allowance", type: "number" },
//       { key: "otherAllowances", label: "Other additional allowances", type: "number" },
//       { key: "paymentMethod", label: "Payment method", options: [["bank_transfer", "Bank transfer"], ["cash", "Cash"], ["cheque", "Cheque"]] },
//       { key: "bankName", label: "Bank name" },
//       { key: "branchName", label: "Bank branch name" },
//       { key: "branchCode", label: "Bank branch code" },
//       { key: "branchAddress", label: "Bank branch address", wide: true },
//       { key: "accountTitle", label: "Bank account title" },
//       { key: "accountNumber", label: "Bank account number" },
//       { key: "iban", label: "IBAN", placeholder: "International bank account number" },
//     ],
//   },
// };

// function displayDate(value: string) {
//   return value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Not recorded";
// }

// function ProfileEditor({ profile, users, onClose, onUserSaved }: {
//   profile: Profile | null;
//   users: EmployeeSourceUser[];
//   onClose: () => void;
//   onUserSaved: (user: EmployeeSourceUser) => void;
// }) {
//   const { toast } = useToast();
//   const isNew = profile === null;
//   const [draft, setDraft] = useState(() => {
//     const result = employeeProfileToDraft(profile || initialEmployeeProfile({ id: "" }));
//     const loginUser = profile && users.find((user) => user.id === profile.userId);
//     if (loginUser?.email) result.personal.email = loginUser.email;
//     return result;
//   });
//   const [tab, setTab] = useState<EditorTab>(isNew ? "account" : "personal");
//   const [account, setAccount] = useState({ role: "", password: "", mobileCountryCode: "+92" });
//   const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
//   const [loadingRoles, setLoadingRoles] = useState(isNew);
//   const [rolesError, setRolesError] = useState("");
//   const [rolesAttempt, setRolesAttempt] = useState(0);
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [saveError, setSaveError] = useState("");
//   const [saving, setSaving] = useState(false);
//   const [focusField, setFocusField] = useState<string | null>(null);
//   const incomplete: EditorIncompleteField[] = useMemo(() => [
//     ...employeeProfileIncompleteFields(draft),
//     ...(isNew ? [
//       ...(!account.role.trim() ? [{ label: "Login role", section: "account" as const, fieldIds: ["account.role"] }] : []),
//       ...(!account.password ? [{ label: "Password", section: "account" as const, fieldIds: ["account.password"] }] : []),
//       ...(!account.mobileCountryCode.trim() ? [{ label: "Country calling code", section: "account" as const, fieldIds: ["account.mobileCountryCode"] }] : []),
//     ] : []),
//   ], [draft, isNew, account]);
//   const incompleteById = new Map<string, typeof incomplete[number]>(
//     incomplete.flatMap((field) => field.fieldIds.map((id) => [id, field] as const)),
//   );

//   useEffect(() => {
//     if (!isNew) return;
//     let cancelled = false;
//     setLoadingRoles(true);
//     setRolesError("");
//     fetchEmployeeAccountRoles().then((items) => { if (!cancelled) setRoles(items); })
//       .catch((error) => { if (!cancelled) setRolesError(error instanceof Error ? error.message : "Unable to load login roles."); })
//       .finally(() => { if (!cancelled) setLoadingRoles(false); });
//     return () => { cancelled = true; };
//   }, [isNew, rolesAttempt]);

//   useEffect(() => {
//     if (!focusField) return;
//     const frame = requestAnimationFrame(() => {
//       document.getElementById(focusField)?.focus();
//       setFocusField(null);
//     });
//     return () => cancelAnimationFrame(frame);
//   }, [focusField, tab]);

//   async function save(event: React.FormEvent) {
//     event.preventDefault();
//     if (saving) return;
//     const result = employeeProfileDetailsSchema.safeParse(draft);
//     if (!result.success) {
//       const fieldErrors: Record<string, string> = {};
//       result.error.issues.forEach((issue) => { fieldErrors[issue.path.join(".")] = issue.message; });
//       setErrors(fieldErrors);
//       setTab(String(result.error.issues[0].path[0]) as EditorTab);
//       return;
//     }
//     if (isNew) {
//       const credentials = employeeAccountSchema.safeParse(account);
//       if (!credentials.success) {
//         setErrors(Object.fromEntries(credentials.error.issues.map((issue) => [`account.${issue.path.join(".")}`, issue.message])));
//         setTab("account");
//         return;
//       }
//       if (!result.data.personal.email) {
//         setErrors({ "personal.email": "A login email is required to create an employee account." });
//         setTab("personal");
//         return;
//       }
//     }
//     setErrors({});
//     setSaveError("");
//     setSaving(true);
//     try {
//       const user = profile
//         ? await saveEmployeeProfile(profile.userId, draft, profile.revision)
//         : await createEmployeeWithAccount(draft, account);
//       onUserSaved(user);
//       toast({ title: isNew ? "Employee and user created" : "Employee profile saved", description: `${result.data.personal.fullName}'s user account and employee profile are synchronized.` });
//       onClose();
//     } catch (error) {
//       setSaveError(error instanceof Error ? error.message : "Unable to save this profile. Please try again.");
//     } finally {
//       setSaving(false);
//     }
//   }

//   return (
//     <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
//       <DialogContent className="flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-4xl flex-col overflow-hidden p-0" onEscapeKeyDown={(event) => { if (saving) event.preventDefault(); }}>
//         <DialogHeader className="border-b px-6 pb-4 pt-6">
//           <DialogTitle className="flex items-center gap-2"><UserRound className="h-5 w-5 text-primary" />{profile?.personal.fullName || "Create Employee & User"}</DialogTitle>
//           <DialogDescription>{isNew ? "Create a login account and employee profile together. Add joining details now or finish the profile later." : "Shared contact and employment details are also saved to User Management. Salary, bank, and identity details stay in this profile."}</DialogDescription>
//           <div className={`mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm ${incomplete.length ? "border-amber-300 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/20" : "border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/20"}`}>
//             <p role="status" aria-live="polite" aria-atomic="true" className="flex items-center gap-2 font-medium">
//               {incomplete.length ? <ClipboardCheck className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" /> : <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />}
//               {incomplete.length ? `${incomplete.length} field${incomplete.length === 1 ? "" : "s"} to complete` : "All profile details complete"}
//             </p>
//             {incomplete.length > 0 && <Button type="button" size="sm" variant="outline" disabled={saving} onClick={() => {
//               setTab(incomplete[0].section);
//               setFocusField(incomplete[0].fieldIds[0]);
//             }}>Go to incomplete field</Button>}
//           </div>
//         </DialogHeader>
//         <form id="employee-profile-form" onSubmit={save} noValidate className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
//           <fieldset disabled={saving} className="min-w-0">
//             <Tabs value={tab} onValueChange={(value) => setTab(value as EditorTab)}>
//               <TabsList className="mb-5 flex h-auto w-full flex-wrap justify-start gap-1">
//                 {(isNew ? [{ key: "account" as const, label: "Login account" }, ...editorTabs] : editorTabs).map(({ key, label }) => {
//                   const count = incomplete.filter((field) => field.section === key).length;
//                   return <TabsTrigger key={key} value={key} className="gap-2" aria-label={count ? `${label}, ${count} field${count === 1 ? "" : "s"} to complete` : label}>
//                     {label}{count > 0 && <span aria-hidden="true" className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] leading-none text-amber-900 dark:bg-amber-900 dark:text-amber-100">{count}</span>}
//                   </TabsTrigger>;
//                 })}
//               </TabsList>
//               {isNew && <TabsContent value="account" className="space-y-5">
//                 <div><h3 className="font-semibold">Login account</h3><p className="mt-1 text-sm text-muted-foreground">Enter the employee's name and login email in Personal. Choose their access role and initial password here.</p></div>
//                 {rolesError && <div role="alert" className="space-y-2 text-sm text-destructive"><p>{rolesError}</p><Button type="button" variant="outline" size="sm" onClick={() => setRolesAttempt((value) => value + 1)}>Retry loading roles</Button></div>}
//                 <div className="grid gap-4 sm:grid-cols-2">
//                   <div className="space-y-2"><Label htmlFor="account.role">Login role {incompleteById.has("account.role") && <span className="text-xs text-amber-800 dark:text-amber-400">Incomplete</span>}</Label>
//                     <select id="account.role" value={account.role} disabled={loadingRoles} className={`${selectClass} ${incompleteById.has("account.role") ? "border-amber-500" : ""}`} onChange={(event) => setAccount((previous) => ({ ...previous, role: event.target.value }))} aria-invalid={Boolean(errors["account.role"])} aria-describedby={errors["account.role"] ? "account.role-error" : undefined}>
//                       <option value="">{loadingRoles ? "Loading roles..." : "Select role"}</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
//                     </select>{errors["account.role"] && <p id="account.role-error" className="text-sm text-destructive">{errors["account.role"]}</p>}
//                   </div>
//                   <div className="space-y-2"><Label htmlFor="account.password">Initial password {incompleteById.has("account.password") && <span className="text-xs text-amber-800 dark:text-amber-400">Incomplete</span>}</Label>
//                     <Input id="account.password" type="password" autoComplete="new-password" value={account.password} className={incompleteById.has("account.password") ? "border-amber-500" : ""} onChange={(event) => setAccount((previous) => ({ ...previous, password: event.target.value }))} aria-invalid={Boolean(errors["account.password"])} aria-describedby={errors["account.password"] ? "account.password-error" : undefined} />
//                     {errors["account.password"] && <p id="account.password-error" className="text-sm text-destructive">{errors["account.password"]}</p>}
//                   </div>
//                   <div className="space-y-2"><Label htmlFor="account.mobileCountryCode">Country calling code</Label>
//                     <Input id="account.mobileCountryCode" value={account.mobileCountryCode} onChange={(event) => setAccount((previous) => ({ ...previous, mobileCountryCode: event.target.value }))} placeholder="+92" aria-invalid={Boolean(errors["account.mobileCountryCode"])} aria-describedby={errors["account.mobileCountryCode"] ? "account.mobileCountryCode-error" : undefined} />
//                     {errors["account.mobileCountryCode"] && <p id="account.mobileCountryCode-error" className="text-sm text-destructive">{errors["account.mobileCountryCode"]}</p>}
//                   </div>
//                 </div>
//               </TabsContent>}
//               {(Object.entries(sections) as Array<[Section, typeof sections[Section]]>).map(([section, config]) => (
//                 <TabsContent key={section} value={section} className="space-y-5">
//                   <div><h3 className="font-semibold">{config.title}</h3><p className="mt-1 text-sm text-muted-foreground">{config.description}</p></div>
//                   <div className="grid gap-4 sm:grid-cols-2">
//                     {section === "employment" && <div className="space-y-2 sm:col-span-2"><Label htmlFor="employment.employeeName">Employee name</Label><Input id="employment.employeeName" value={draft.personal.fullName} readOnly /><p className="text-xs text-muted-foreground">Edit the employee's name in Personal details.</p></div>}
//                     {config.fields.map((field) => {
//                       const id = `${section}.${field.key}`;
//                       const missing = incompleteById.get(id);
//                       const missingClass = missing ? "border-amber-500 bg-amber-50/40 dark:border-amber-700 dark:bg-amber-950/10" : "";
//                       const descriptionId = errors[id] ? `${id}-error` : missing ? `${id}-incomplete` : undefined;
//                       const value = (draft[section] as Record<string, string>)[field.key];
//                       let options = field.options;
//                       if (section === "employment" && field.key === "reportingTo") {
//                         options = users.filter((user) => user.id !== profile?.userId).map((user) => [user.id, user.displayName || user.email || user.id]);
//                         if (value && !options.some(([key]) => key === value)) options.push([value, value]);
//                       }
//                       const change = (next: string) => setDraft((previous) => {
//                         if (section === "payroll" && field.key === "totalSalary") {
//                           return { ...previous, payroll: updatePayrollTotalSalary(previous.payroll, next) };
//                         }
//                         return { ...previous, [section]: {
//                           ...previous[section], [field.key]: next,
//                           ...(section === "employment" && field.key === "employmentType" && next === "probation" ? { probationRequired: "yes" } : {}),
//                         } };
//                       });
//                       return (
//                         <div key={id} className={`space-y-2 ${field.wide ? "sm:col-span-2" : ""}`}>
//                           <Label htmlFor={id} className="flex flex-wrap items-center gap-2">{field.label}{missing && <span className="text-xs font-normal text-amber-800 dark:text-amber-400">Incomplete</span>}</Label>
//                           {options ? (
//                             <select id={id} value={value} onChange={(event) => change(event.target.value)} className={`${selectClass} ${missingClass}`} aria-invalid={Boolean(errors[id])} aria-describedby={descriptionId}>
//                               <option value="">Not recorded</option>
//                               {options.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
//                             </select>
//                           ) : field.wide ? (
//                             <Textarea id={id} value={value} onChange={(event) => change(event.target.value)} maxLength={500} className={missingClass} aria-invalid={Boolean(errors[id])} aria-describedby={descriptionId} />
//                           ) : (
//                             <Input id={id} type={field.type || "text"} value={value} onChange={(event) => change(field.key === "currency" ? event.target.value.toUpperCase() : event.target.value)}
//                               readOnly={field.readOnly || (!isNew && section === "personal" && field.key === "email")}
//                               placeholder={field.placeholder} min={field.type === "number" ? "0" : undefined} step={field.type === "number" ? "0.01" : undefined}
//                               className={`${missingClass} ${field.readOnly ? "bg-muted/50 text-muted-foreground" : ""}`} aria-invalid={Boolean(errors[id])} aria-describedby={descriptionId} />
//                           )}
//                           {errors[id] && <p id={`${id}-error`} className="text-sm text-destructive">{errors[id]}</p>}
//                           {!errors[id] && missing && <p id={`${id}-incomplete`} className="text-xs text-amber-800 dark:text-amber-400">{missing.hint || "Needed to complete this profile."}</p>}
//                           {!isNew && section === "personal" && field.key === "email" && <p className="text-xs text-muted-foreground">This is the login email. Use Personal email for another contact address.</p>}
//                         </div>
//                       );
//                     })}
//                   </div>
//                 </TabsContent>
//               ))}
//               <TabsContent value="onboarding" className="space-y-5">
//                 <div><h3 className="font-semibold">Joining checklist</h3><p className="mt-1 text-sm text-muted-foreground">Record documents received and any joining arrangements.</p></div>
//                 {([
//                   ["identityDocumentReceived", "Identity document copy received"],
//                   ["contractSigned", "Employment contract signed"],
//                   ["bankDetailsVerified", "Bank details verified"],
//                 ] as const).map(([key, label]) => (
//                   <div key={key} className="flex items-center gap-3 rounded-lg border p-4">
//                     <Checkbox id={key} checked={draft.onboarding[key]} onCheckedChange={(checked) => setDraft((previous) => ({ ...previous, onboarding: { ...previous.onboarding, [key]: checked === true } }))} />
//                     <Label htmlFor={key}>{label}</Label>
//                   </div>
//                 ))}
//                 <div className="space-y-2"><Label htmlFor="onboarding.notes">Joining notes</Label>
//                   <Textarea id="onboarding.notes" value={draft.onboarding.notes} maxLength={3000} rows={5} onChange={(event) => setDraft((previous) => ({ ...previous, onboarding: { ...previous.onboarding, notes: event.target.value } }))} />
//                 </div>
//               </TabsContent>
//             </Tabs>
//           </fieldset>
//           {saveError && <p role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{saveError}</p>}
//         </form>
//         <DialogFooter className="border-t px-6 py-4 sm:items-center">
//           <p className="mr-auto text-xs text-muted-foreground">Partial profiles can be saved and completed later.</p>
//           <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
//           <Button type="submit" form="employee-profile-form" disabled={saving || (isNew && (loadingRoles || Boolean(rolesError)))}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isNew ? "Create Employee & User" : "Save changes"}</Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }

// export default function EmployeeProfile() {
//   const { currentUser, userProfile } = useAuth();
//   const { toast } = useToast();
//   const canManage = canManageEmployeeProfiles(userProfile?.role);
//   const canCreate = canCreateEmployeeAccounts(userProfile?.role);
//   const [users, setUsers] = useState<EmployeeSourceUser[]>([]);
//   const [profiles, setProfiles] = useState<Profile[]>([]);
//   const [loadingUsers, setLoadingUsers] = useState(true);
//   const [loadingProfiles, setLoadingProfiles] = useState(true);
//   const [sourceError, setSourceError] = useState("");
//   const [profileError, setProfileError] = useState("");
//   const [importError, setImportError] = useState("");
//   const [refreshing, setRefreshing] = useState(false);
//   const [preparingProfiles, setPreparingProfiles] = useState(0);
//   const [search, setSearch] = useState("");
//   const [department, setDepartment] = useState("");
//   const [status, setStatus] = useState("");
//   const [editing, setEditing] = useState<Profile | null>(null);
//   const [creating, setCreating] = useState(false);
//   const generation = useRef(0);
//   const initialProfileIds = useRef<Promise<ReadonlySet<string>> | null>(null);
//   const latestProfileIds = useRef<ReadonlySet<string> | null>(null);

//   const refresh = useCallback(async (notify = false) => {
//     const request = ++generation.current;
//     setLoadingUsers(true);
//     setRefreshing(true);
//     setSourceError("");
//     setImportError("");
//     let directoryLoaded = false;
//     try {
//       const result = await importActiveEmployeeProfiles({
//         existingProfileIds: latestProfileIds.current || initialProfileIds.current || undefined,
//         onUsersLoaded: (loadedUsers) => {
//           directoryLoaded = true;
//           if (request !== generation.current) return;
//           setUsers(loadedUsers);
//           setLoadingUsers(false);
//         },
//         onProgress: (remaining) => { if (request === generation.current) setPreparingProfiles(remaining); },
//       });
//       if (request !== generation.current) return;
//       if (notify) toast({ title: "Active employees refreshed", description: `${result.created} new profile${result.created === 1 ? "" : "s"} added. Existing profiles were preserved.` });
//     } catch (error) {
//       if (request === generation.current) {
//         const message = error instanceof Error ? error.message : "Unable to import active users.";
//         if (directoryLoaded) setImportError(message);
//         else setSourceError(message);
//       }
//     } finally {
//       if (request === generation.current) {
//         setLoadingUsers(false);
//         setRefreshing(false);
//         setPreparingProfiles(0);
//       }
//     }
//   }, [toast]);

//   useEffect(() => {
//     if (!canManage || !currentUser) return;
//     setLoadingProfiles(true);
//     setProfileError("");
//     latestProfileIds.current = null;
//     let resolveProfiles!: (ids: ReadonlySet<string>) => void;
//     let rejectProfiles!: (error: Error) => void;
//     initialProfileIds.current = new Promise((resolve, reject) => { resolveProfiles = resolve; rejectProfiles = reject; });
//     const unsubscribe = subscribeToEmployeeProfiles((records, serverConfirmed) => {
//       setProfiles(records);
//       setLoadingProfiles(false);
//       setProfileError("");
//       if (serverConfirmed) {
//         const ids = new Set(records.map((record) => record.id));
//         latestProfileIds.current = ids;
//         resolveProfiles(ids);
//       }
//     }, (error) => { rejectProfiles(error); setProfileError(error.message); setLoadingProfiles(false); });
//     void refresh();
//     return () => {
//       generation.current++;
//       rejectProfiles(new Error("Employee profile loading was cancelled."));
//       unsubscribe();
//       initialProfileIds.current = null;
//       latestProfileIds.current = null;
//     };
//   }, [canManage, currentUser?.uid, refresh]);

//   const savedProfileIds = useMemo(() => new Set(profiles.map((profile) => profile.id)), [profiles]);
//   const activeProfiles = useMemo(() => {
//     const byUser = new Map(profiles.map((profile) => [profile.id, profile]));
//     return users.map((user): Profile => byUser.get(user.id) || {
//       ...initialEmployeeProfile(user), id: user.id, userId: user.id, schemaVersion: 1,
//       revision: 0, sourceRole: user.role || "", createdById: "", updatedById: "",
//     }).sort((a, b) => a.personal.fullName.localeCompare(b.personal.fullName));
//   }, [profiles, users]);
//   const departments = useMemo(() => Array.from(new Set(activeProfiles.map((profile) => profile.employment.department).filter(Boolean))).sort(), [activeProfiles]);
//   const complete = activeProfiles.filter((profile) => employeeProfileMissingFields(profile).length === 0).length;
//   const filtered = activeProfiles.filter((profile) => {
//     const haystack = [profile.personal.fullName, profile.personal.email, profile.personal.personalEmail, profile.employment.employeeCode, profile.employment.designation, profile.employment.department, profile.employment.company].join(" ").toLowerCase();
//     const isComplete = employeeProfileMissingFields(profile).length === 0;
//     return haystack.includes(search.toLowerCase().trim()) && (!department || profile.employment.department === department) &&
//       (!status || (status === "complete" ? isComplete : !isComplete));
//   });
//   const loading = loadingUsers || loadingProfiles;
//   const error = sourceError || profileError;

//   if (!canManage) return (
//     <div className="mx-auto max-w-lg p-10 text-center"><ShieldCheck className="mx-auto mb-4 h-10 w-10 text-muted-foreground" /><h1 className="text-xl font-semibold">Employee profiles are restricted</h1>
//       <p className="mt-2 text-muted-foreground">Only Finance, Financial Admin, and Main Admin can access employee profiles.</p></div>
//   );

//   return (
//     <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
//       <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
//         <div><div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary"><UserRound className="h-4 w-4" />People & Payroll</div>
//           <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Employee Profile</h1>
//           <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Keep joining details, emergency contacts, and salary information together for your active employees.</p>
//         </div>
//         <div className="flex flex-wrap gap-2">
//           {canCreate && <Button onClick={() => setCreating(true)}><UserPlus className="mr-2 h-4 w-4" />Create Employee & User</Button>}
//           <Button variant="outline" disabled={refreshing} onClick={() => void refresh(true)}><RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />Refresh active users</Button>
//         </div>
//       </div>
//       <div className="grid gap-4 sm:grid-cols-3">
//         {[
//           { label: "Active employees", value: users.length, icon: Users },
//           { label: "Details complete", value: complete, icon: CheckCircle2 },
//           { label: "Needs details", value: Math.max(0, users.length - complete), icon: ClipboardCheck },
//         ].map(({ label, value, icon: Icon }) => <Card key={label}><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-semibold">{loading ? "—" : value}</p></div><div className="rounded-xl bg-primary/10 p-3 text-primary"><Icon className="h-6 w-6" /></div></CardContent></Card>)}
//       </div>
//       <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
//         <p>Import active users or create an employee and login account together. Saving a profile also updates shared details in User Management. Refresh adds missing profiles without replacing saved salary or joining details.</p>
//       </div>
//       {preparingProfiles > 0 && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Preparing {preparingProfiles} missing profile{preparingProfiles === 1 ? "" : "s"}. Existing profiles are ready to use.</p>}
//       {importError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50/50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950/20"><p>Some missing profiles could not be prepared: {importError}</p><Button variant="outline" size="sm" disabled={refreshing} onClick={() => void refresh(true)}>Retry missing profiles</Button></div>}
//       {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"><p>{error}</p>
//         <Button variant="outline" size="sm" onClick={() => profileError ? window.location.reload() : void refresh()} disabled={loadingUsers}>Retry</Button></div>}
//       <Card>
//         <CardContent className="p-0">
//           <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
//             <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search employees" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search name, email, employee ID, designation, or company" /></div>
//             <select aria-label="Filter by department" className={`${selectClass} md:w-48`} value={department} onChange={(event) => setDepartment(event.target.value)}><option value="">All departments</option>{departments.map((item) => <option key={item} value={item}>{item.replace(/_/g, " ")}</option>)}</select>
//             <select aria-label="Filter by profile status" className={`${selectClass} md:w-44`} value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All profiles</option><option value="complete">Details complete</option><option value="incomplete">Needs details</option></select>
//           </div>
//           {loading ? <div className="flex items-center justify-center gap-3 p-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Loading active employee profiles…</div> : filtered.length === 0 ? (
//             <div className="p-14 text-center"><Users className="mx-auto mb-3 h-9 w-9 text-muted-foreground" /><h2 className="font-semibold">{activeProfiles.length ? "No matching employees" : "No active employee profiles yet"}</h2><p className="mt-2 text-sm text-muted-foreground">{activeProfiles.length ? "Try another search or filter." : "Approved, active users from User Management will appear here."}</p></div>
//           ) : <Table>
//             <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Department & Designation</TableHead><TableHead>Joining date</TableHead><TableHead>Employment status</TableHead><TableHead>Profile status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
//             <TableBody>{filtered.map((profile) => {
//               const missing = employeeProfileMissingFields(profile);
//               return <TableRow key={profile.id}>
//                 <TableCell><p className="font-medium">{profile.personal.fullName}</p><p className="mt-1 text-xs text-muted-foreground">{profile.personal.email}</p><p className="mt-1 text-xs text-muted-foreground">{profile.employment.employeeCode || "Employee ID pending"}</p></TableCell>
//                 <TableCell><p className="capitalize">{profile.employment.department.replace(/_/g, " ") || "Not recorded"}</p><p className="mt-1 text-xs text-muted-foreground">{profile.employment.designation || "Designation pending"}</p>{profile.employment.company && <p className="mt-1 text-xs text-muted-foreground">{profile.employment.company}</p>}</TableCell>
//                 <TableCell className="whitespace-nowrap text-sm">{displayDate(profile.employment.joiningDate)}</TableCell>
//                 <TableCell><Badge variant={profile.employment.employmentStatus === "active" ? "outline" : "secondary"} className="capitalize">{profile.employment.employmentStatus}</Badge></TableCell>
//                 <TableCell><Badge variant={missing.length ? "secondary" : "default"}>{missing.length ? "Needs details" : "Details complete"}</Badge>{missing.length > 0 && <p className="mt-2 max-w-52 text-xs text-muted-foreground" title={missing.join(", ")}>{missing.length} field{missing.length === 1 ? "" : "s"} to complete</p>}</TableCell>
//                 <TableCell className="text-right"><Button variant="outline" size="sm" disabled={Boolean(error) || !savedProfileIds.has(profile.id)} aria-label={`Edit profile for ${profile.personal.fullName}`} onClick={() => setEditing(profile)}>{savedProfileIds.has(profile.id) ? <><Pencil className="mr-2 h-3.5 w-3.5" />Profile</> : <><Loader2 className={`mr-2 h-3.5 w-3.5 ${preparingProfiles ? "animate-spin" : ""}`} />{importError ? "Profile pending" : "Preparing..."}</>}</Button></TableCell>
//               </TableRow>;
//             })}</TableBody>
//           </Table>}
//           {!loading && <p className="border-t px-4 py-3 text-xs text-muted-foreground">Showing {filtered.length} of {activeProfiles.length} active employee profiles</p>}
//         </CardContent>
//       </Card>
//       {(editing || creating) && <ProfileEditor key={editing ? `${editing.id}-${editing.revision}` : "new"} profile={editing} users={users}
//         onClose={() => { setEditing(null); setCreating(false); }}
//         onUserSaved={(user) => setUsers((previous) => previous.some((item) => item.id === user.id) ? previous.map((item) => item.id === user.id ? user : item) : [...previous, user])} />}
//     </div>
//   );
// }

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  canCreateEmployeeAccounts,
  canManageEmployeeProfiles,
  employeeAccountSchema,
  employeeProfileDetailsSchema,
  employeeProfileIncompleteFields,
  employeeProfileMissingFields,
  employeeProfileToDraft,
  initialEmployeeProfile,
  updatePayrollTotalSalary,
  type EmployeeProfile as Profile,
  type EmployeeSourceUser,
} from "@/lib/employeeProfileModel";
import {
  createEmployeeWithAccount,
  fetchEmployeeAccountRoles,
  importActiveEmployeeProfiles,
  saveEmployeeProfile,
  subscribeToEmployeeProfiles,
} from "@/lib/employeeProfiles";

type Section = "personal" | "employment" | "emergency" | "payroll";
type EditorTab = Section | "onboarding" | "account";
type EditorIncompleteField = {
  label: string;
  section: EditorTab;
  fieldIds: string[];
  hint?: string;
};
const editorTabs: Array<{ key: EditorTab; label: string }> = [
  { key: "personal", label: "Personal" },
  { key: "employment", label: "Employment" },
  { key: "emergency", label: "Emergency" },
  { key: "payroll", label: "Salary & Bank" },
  { key: "onboarding", label: "Onboarding" },
];
type FieldSpec = {
  key: string;
  label: string;
  type?: string;
  placeholder?: string;
  hint?: string;
  options?: Array<[string, string]>;
  wide?: boolean;
  readOnly?: boolean;
};
const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";
const sections: Record<
  Section,
  { title: string; description: string; fields: FieldSpec[] }
> = {
  personal: {
    title: "Personal details",
    description:
      "Identity and contact information for the employee's company record.",
    fields: [
      {
        key: "fullName",
        label: "Employee name",
        placeholder: "Name as shown on identity document",
      },
      { key: "email", label: "Work / account email address", type: "email" },
      {
        key: "personalEmail",
        label: "Employee personal email address",
        type: "email",
      },
      {
        key: "phone",
        label: "Employee contact number",
        type: "tel",
        placeholder: "+92 300 1234567",
      },
      { key: "fatherName", label: "Father's / guardian's name" },
      { key: "dateOfBirth", label: "Date of birth", type: "date" },
      {
        key: "gender",
        label: "Gender",
        options: [
          ["male", "Male"],
          ["female", "Female"],
          ["other", "Other"],
          ["prefer_not_to_say", "Prefer not to say"],
        ],
      },
      {
        key: "maritalStatus",
        label: "Marital status",
        options: [
          ["single", "Single"],
          ["married", "Married"],
          ["other", "Other"],
        ],
      },
      { key: "nationality", label: "Nationality" },
      {
        key: "nationalId",
        label: "National ID / CNIC",
        placeholder: "Identity document number",
      },
      { key: "passportNumber", label: "Passport number" },
      { key: "taxNumber", label: "Tax registration / NTN" },
      {
        key: "currentAddress",
        label: "Employee address (current)",
        wide: true,
      },
      { key: "permanentAddress", label: "Permanent address", wide: true },
    ],
  },
  employment: {
    title: "Employment details",
    description:
      "Joining information and the employee's position in the company.",
    fields: [
      {
        key: "employeeCode",
        label: "Employee ID",
        placeholder: "e.g. IEDGE-001",
      },
      { key: "joiningDate", label: "Date of joining", type: "date" },
      { key: "department", label: "Department" },
      { key: "designation", label: "Designation / job title" },
      { key: "company", label: "Company" },
      {
        key: "employmentType",
        label: "Employment type",
        options: [
          ["permanent", "Permanent"],
          ["contract", "Contract"],
          ["probation", "Probation"],
          ["part_time", "Part time"],
          ["intern", "Intern"],
          ["consultant", "Consultant"],
        ],
      },
      {
        key: "employmentStatus",
        label: "Employment status",
        options: [
          ["active", "Active"],
          ["resigned", "Resigned"],
          ["terminated", "Terminated"],
        ],
      },
      {
        key: "workingHours",
        label: "Working hours",
        placeholder: "e.g. 9:00 AM to 6:00 PM, Monday to Friday",
      },
      {
        key: "probationRequired",
        label: "Probation applies?",
        options: [
          ["yes", "Yes"],
          ["no", "No"],
        ],
      },
      {
        key: "probationPeriod",
        label: "Probation period",
        placeholder: "e.g. 3 months",
      },
      { key: "probationEndDate", label: "Probation end date", type: "date" },
      { key: "workLocation", label: "Office / work location" },
      { key: "region", label: "Region" },
      { key: "reportingTo", label: "Reporting manager" },
    ],
  },
  emergency: {
    title: "Emergency contact",
    description: "The person the company should contact in an emergency.",
    fields: [
      { key: "name", label: "Contact name" },
      { key: "relationship", label: "Relationship" },
      { key: "phone", label: "Contact phone", type: "tel" },
      { key: "address", label: "Contact address", wide: true },
    ],
  },
  payroll: {
    title: "Salary and bank details",
    description:
      "Enter the total monthly salary to calculate basic salary (64.52%), house rent (29.03%), and utility (6.45%). The amounts are rounded to 2 decimals and add up to the total. Additional allowances and increments are recorded separately.",
    fields: [
      { key: "currency", label: "Currency", placeholder: "PKR" },
      { key: "effectiveFrom", label: "Salary effective date", type: "date" },
      {
        key: "totalSalary",
        label: "Total monthly salary (100%)",
        type: "number",
        placeholder: "Enter total salary",
      },
      {
        key: "taxableSalary",
        label: "Taxable Salary",
        type: "number",
        placeholder: "Enter monthly taxable salary; 0 if none",
        hint: "Monthly taxable portion of salary, including any taxable increment. Payroll prorates this amount and adds separately marked taxable allowances and earnings. Enter 0 explicitly if this salary has no taxable portion.",
      },
      {
        key: "basicSalary",
        label: "Basic salary (64.52%)",
        type: "number",
        readOnly: true,
        placeholder: "Calculated automatically",
      },
      {
        key: "housingAllowance",
        label: "House rent allowance (29.03%)",
        type: "number",
        readOnly: true,
        placeholder: "Calculated automatically",
      },
      {
        key: "utilityAllowance",
        label: "Utility allowance (6.45%)",
        type: "number",
        readOnly: true,
        placeholder: "Calculated automatically",
      },
      {
        key: "incrementAmount",
        label: "Salary increment amount",
        type: "number",
      },
      {
        key: "incrementEffectiveFrom",
        label: "Increment effective date",
        type: "date",
      },
      {
        key: "transportAllowance",
        label: "Additional transport allowance",
        type: "number",
      },
      {
        key: "otherAllowances",
        label: "Other additional allowances",
        type: "number",
      },
      {
        key: "paymentMethod",
        label: "Payment method",
        options: [
          ["bank_transfer", "Bank transfer"],
          ["cash", "Cash"],
          ["cheque", "Cheque"],
        ],
      },
      { key: "bankName", label: "Bank name" },
      { key: "branchName", label: "Bank branch name" },
      { key: "branchCode", label: "Bank branch code" },
      { key: "branchAddress", label: "Bank branch address", wide: true },
      { key: "accountTitle", label: "Bank account title" },
      { key: "accountNumber", label: "Bank account number" },
      {
        key: "iban",
        label: "IBAN",
        placeholder: "International bank account number",
      },
    ],
  },
};

function displayDate(value: string) {
  return value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Not recorded";
}

function ProfileEditor({
  profile,
  users,
  onClose,
  onUserSaved,
}: {
  profile: Profile | null;
  users: EmployeeSourceUser[];
  onClose: () => void;
  onUserSaved: (user: EmployeeSourceUser) => void;
}) {
  const { toast } = useToast();
  const isNew = profile === null;
  const [draft, setDraft] = useState(() => {
    const result = employeeProfileToDraft(
      profile || initialEmployeeProfile({ id: "" }),
    );
    const loginUser =
      profile && users.find((user) => user.id === profile.userId);
    if (loginUser?.email) result.personal.email = loginUser.email;
    return result;
  });
  const [tab, setTab] = useState<EditorTab>(isNew ? "account" : "personal");
  const [account, setAccount] = useState({
    role: "",
    password: "",
    mobileCountryCode: "+92",
  });
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingRoles, setLoadingRoles] = useState(isNew);
  const [rolesError, setRolesError] = useState("");
  const [rolesAttempt, setRolesAttempt] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [focusField, setFocusField] = useState<string | null>(null);
  const incomplete: EditorIncompleteField[] = useMemo(
    () => [
      ...employeeProfileIncompleteFields(draft),
      ...(isNew
        ? [
            ...(!account.role.trim()
              ? [
                  {
                    label: "Login role",
                    section: "account" as const,
                    fieldIds: ["account.role"],
                  },
                ]
              : []),
            ...(!account.password
              ? [
                  {
                    label: "Password",
                    section: "account" as const,
                    fieldIds: ["account.password"],
                  },
                ]
              : []),
            ...(!account.mobileCountryCode.trim()
              ? [
                  {
                    label: "Country calling code",
                    section: "account" as const,
                    fieldIds: ["account.mobileCountryCode"],
                  },
                ]
              : []),
          ]
        : []),
    ],
    [draft, isNew, account],
  );
  const incompleteById = new Map<string, (typeof incomplete)[number]>(
    incomplete.flatMap((field) =>
      field.fieldIds.map((id) => [id, field] as const),
    ),
  );

  useEffect(() => {
    if (!isNew) return;
    let cancelled = false;
    setLoadingRoles(true);
    setRolesError("");
    fetchEmployeeAccountRoles()
      .then((items) => {
        if (!cancelled) setRoles(items);
      })
      .catch((error) => {
        if (!cancelled)
          setRolesError(
            error instanceof Error
              ? error.message
              : "Unable to load login roles.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoadingRoles(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isNew, rolesAttempt]);

  useEffect(() => {
    if (!focusField) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(focusField)?.focus();
      setFocusField(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [focusField, tab]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    const result = employeeProfileDetailsSchema.safeParse(draft);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path.join(".")] = issue.message;
      });
      setErrors(fieldErrors);
      setTab(String(result.error.issues[0].path[0]) as EditorTab);
      return;
    }
    if (isNew) {
      const credentials = employeeAccountSchema.safeParse(account);
      if (!credentials.success) {
        setErrors(
          Object.fromEntries(
            credentials.error.issues.map((issue) => [
              `account.${issue.path.join(".")}`,
              issue.message,
            ]),
          ),
        );
        setTab("account");
        return;
      }
      if (!result.data.personal.email) {
        setErrors({
          "personal.email":
            "A login email is required to create an employee account.",
        });
        setTab("personal");
        return;
      }
    }
    setErrors({});
    setSaveError("");
    setSaving(true);
    try {
      const user = profile
        ? await saveEmployeeProfile(profile.userId, draft, profile.revision)
        : await createEmployeeWithAccount(draft, account);
      onUserSaved(user);
      toast({
        title: isNew ? "Employee and user created" : "Employee profile saved",
        description: `${result.data.personal.fullName}'s user account and employee profile are synchronized.`,
      });
      onClose();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Unable to save this profile. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <DialogContent
        className="flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-4xl flex-col overflow-hidden p-0"
        onEscapeKeyDown={(event) => {
          if (saving) event.preventDefault();
        }}
      >
        <DialogHeader className="border-b px-6 pb-4 pt-6">
          <DialogTitle className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-primary" />
            {profile?.personal.fullName || "Create Employee & User"}
          </DialogTitle>
          <DialogDescription>
            {isNew
              ? "Create a login account and employee profile together. Add joining details now or finish the profile later."
              : "Shared contact and employment details are also saved to User Management. Salary, bank, and identity details stay in this profile."}
          </DialogDescription>
          <div
            className={`mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm ${incomplete.length ? "border-amber-300 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/20" : "border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/20"}`}
          >
            <p
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="flex items-center gap-2 font-medium"
            >
              {incomplete.length ? (
                <ClipboardCheck className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
              )}
              {incomplete.length
                ? `${incomplete.length} field${incomplete.length === 1 ? "" : "s"} to complete`
                : "All profile details complete"}
            </p>
            {incomplete.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() => {
                  setTab(incomplete[0].section);
                  setFocusField(incomplete[0].fieldIds[0]);
                }}
              >
                Go to incomplete field
              </Button>
            )}
          </div>
        </DialogHeader>
        <form
          id="employee-profile-form"
          onSubmit={save}
          noValidate
          className="min-h-0 flex-1 overflow-y-auto px-6 py-4"
        >
          <fieldset disabled={saving} className="min-w-0">
            <Tabs
              value={tab}
              onValueChange={(value) => setTab(value as EditorTab)}
            >
              <TabsList className="mb-5 flex h-auto w-full flex-wrap justify-start gap-1">
                {(isNew
                  ? [
                      { key: "account" as const, label: "Login account" },
                      ...editorTabs,
                    ]
                  : editorTabs
                ).map(({ key, label }) => {
                  const count = incomplete.filter(
                    (field) => field.section === key,
                  ).length;
                  return (
                    <TabsTrigger
                      key={key}
                      value={key}
                      className="gap-2"
                      aria-label={
                        count
                          ? `${label}, ${count} field${count === 1 ? "" : "s"} to complete`
                          : label
                      }
                    >
                      {label}
                      {count > 0 && (
                        <span
                          aria-hidden="true"
                          className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] leading-none text-amber-900 dark:bg-amber-900 dark:text-amber-100"
                        >
                          {count}
                        </span>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              {isNew && (
                <TabsContent value="account" className="space-y-5">
                  <div>
                    <h3 className="font-semibold">Login account</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Enter the employee's name and login email in Personal.
                      Choose their access role and initial password here.
                    </p>
                  </div>
                  {rolesError && (
                    <div
                      role="alert"
                      className="space-y-2 text-sm text-destructive"
                    >
                      <p>{rolesError}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setRolesAttempt((value) => value + 1)}
                      >
                        Retry loading roles
                      </Button>
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="account.role">
                        Login role{" "}
                        {incompleteById.has("account.role") && (
                          <span className="text-xs text-amber-800 dark:text-amber-400">
                            Incomplete
                          </span>
                        )}
                      </Label>
                      <select
                        id="account.role"
                        value={account.role}
                        disabled={loadingRoles}
                        className={`${selectClass} ${incompleteById.has("account.role") ? "border-amber-500" : ""}`}
                        onChange={(event) =>
                          setAccount((previous) => ({
                            ...previous,
                            role: event.target.value,
                          }))
                        }
                        aria-invalid={Boolean(errors["account.role"])}
                        aria-describedby={
                          errors["account.role"]
                            ? "account.role-error"
                            : undefined
                        }
                      >
                        <option value="">
                          {loadingRoles ? "Loading roles..." : "Select role"}
                        </option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                      {errors["account.role"] && (
                        <p
                          id="account.role-error"
                          className="text-sm text-destructive"
                        >
                          {errors["account.role"]}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account.password">
                        Initial password{" "}
                        {incompleteById.has("account.password") && (
                          <span className="text-xs text-amber-800 dark:text-amber-400">
                            Incomplete
                          </span>
                        )}
                      </Label>
                      <Input
                        id="account.password"
                        type="password"
                        autoComplete="new-password"
                        value={account.password}
                        className={
                          incompleteById.has("account.password")
                            ? "border-amber-500"
                            : ""
                        }
                        onChange={(event) =>
                          setAccount((previous) => ({
                            ...previous,
                            password: event.target.value,
                          }))
                        }
                        aria-invalid={Boolean(errors["account.password"])}
                        aria-describedby={
                          errors["account.password"]
                            ? "account.password-error"
                            : undefined
                        }
                      />
                      {errors["account.password"] && (
                        <p
                          id="account.password-error"
                          className="text-sm text-destructive"
                        >
                          {errors["account.password"]}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account.mobileCountryCode">
                        Country calling code
                      </Label>
                      <Input
                        id="account.mobileCountryCode"
                        value={account.mobileCountryCode}
                        onChange={(event) =>
                          setAccount((previous) => ({
                            ...previous,
                            mobileCountryCode: event.target.value,
                          }))
                        }
                        placeholder="+92"
                        aria-invalid={Boolean(
                          errors["account.mobileCountryCode"],
                        )}
                        aria-describedby={
                          errors["account.mobileCountryCode"]
                            ? "account.mobileCountryCode-error"
                            : undefined
                        }
                      />
                      {errors["account.mobileCountryCode"] && (
                        <p
                          id="account.mobileCountryCode-error"
                          className="text-sm text-destructive"
                        >
                          {errors["account.mobileCountryCode"]}
                        </p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              )}
              {(
                Object.entries(sections) as Array<
                  [Section, (typeof sections)[Section]]
                >
              ).map(([section, config]) => (
                <TabsContent
                  key={section}
                  value={section}
                  className="space-y-5"
                >
                  <div>
                    <h3 className="font-semibold">{config.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {config.description}
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {section === "employment" && (
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="employment.employeeName">
                          Employee name
                        </Label>
                        <Input
                          id="employment.employeeName"
                          value={draft.personal.fullName}
                          readOnly
                        />
                        <p className="text-xs text-muted-foreground">
                          Edit the employee's name in Personal details.
                        </p>
                      </div>
                    )}
                    {config.fields.map((field) => {
                      const id = `${section}.${field.key}`;
                      const missing = incompleteById.get(id);
                      const missingClass = missing
                        ? "border-amber-500 bg-amber-50/40 dark:border-amber-700 dark:bg-amber-950/10"
                        : "";
                      const descriptionId =
                        [
                          errors[id]
                            ? `${id}-error`
                            : missing
                              ? `${id}-incomplete`
                              : "",
                          field.hint ? `${id}-hint` : "",
                        ]
                          .filter(Boolean)
                          .join(" ") || undefined;
                      const value = (draft[section] as Record<string, string>)[
                        field.key
                      ];
                      let options = field.options;
                      if (
                        section === "employment" &&
                        field.key === "reportingTo"
                      ) {
                        options = users
                          .filter((user) => user.id !== profile?.userId)
                          .map((user) => [
                            user.id,
                            user.displayName || user.email || user.id,
                          ]);
                        if (value && !options.some(([key]) => key === value))
                          options.push([value, value]);
                      }
                      const change = (next: string) =>
                        setDraft((previous) => {
                          if (
                            section === "payroll" &&
                            field.key === "totalSalary"
                          ) {
                            return {
                              ...previous,
                              payroll: updatePayrollTotalSalary(
                                previous.payroll,
                                next,
                              ),
                            };
                          }
                          return {
                            ...previous,
                            [section]: {
                              ...previous[section],
                              [field.key]: next,
                              ...(section === "employment" &&
                              field.key === "employmentType" &&
                              next === "probation"
                                ? { probationRequired: "yes" }
                                : {}),
                            },
                          };
                        });
                      return (
                        <div
                          key={id}
                          className={`space-y-2 ${field.wide ? "sm:col-span-2" : ""}`}
                        >
                          <Label
                            htmlFor={id}
                            className="flex flex-wrap items-center gap-2"
                          >
                            {field.label}
                            {missing && (
                              <span className="text-xs font-normal text-amber-800 dark:text-amber-400">
                                Incomplete
                              </span>
                            )}
                          </Label>
                          {options ? (
                            <select
                              id={id}
                              value={value}
                              onChange={(event) => change(event.target.value)}
                              className={`${selectClass} ${missingClass}`}
                              aria-invalid={Boolean(errors[id])}
                              aria-describedby={descriptionId}
                            >
                              <option value="">Not recorded</option>
                              {options.map(([key, label]) => (
                                <option key={key} value={key}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          ) : field.wide ? (
                            <Textarea
                              id={id}
                              value={value}
                              onChange={(event) => change(event.target.value)}
                              maxLength={500}
                              className={missingClass}
                              aria-invalid={Boolean(errors[id])}
                              aria-describedby={descriptionId}
                            />
                          ) : (
                            <Input
                              id={id}
                              type={field.type || "text"}
                              value={value}
                              onChange={(event) =>
                                change(
                                  field.key === "currency"
                                    ? event.target.value.toUpperCase()
                                    : event.target.value,
                                )
                              }
                              readOnly={
                                field.readOnly ||
                                (!isNew &&
                                  section === "personal" &&
                                  field.key === "email")
                              }
                              placeholder={field.placeholder}
                              min={field.type === "number" ? "0" : undefined}
                              step={
                                field.type === "number" ? "0.01" : undefined
                              }
                              className={`${missingClass} ${field.readOnly ? "bg-muted/50 text-muted-foreground" : ""}`}
                              aria-invalid={Boolean(errors[id])}
                              aria-describedby={descriptionId}
                            />
                          )}
                          {errors[id] && (
                            <p
                              id={`${id}-error`}
                              className="text-sm text-destructive"
                            >
                              {errors[id]}
                            </p>
                          )}
                          {!errors[id] && missing && (
                            <p
                              id={`${id}-incomplete`}
                              className="text-xs text-amber-800 dark:text-amber-400"
                            >
                              {missing.hint ||
                                "Needed to complete this profile."}
                            </p>
                          )}
                          {field.hint && (
                            <p
                              id={`${id}-hint`}
                              className="text-xs text-muted-foreground"
                            >
                              {field.hint}
                            </p>
                          )}
                          {!isNew &&
                            section === "personal" &&
                            field.key === "email" && (
                              <p className="text-xs text-muted-foreground">
                                This is the login email. Use Personal email for
                                another contact address.
                              </p>
                            )}
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
              ))}
              <TabsContent value="onboarding" className="space-y-5">
                <div>
                  <h3 className="font-semibold">Joining checklist</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Record documents received and any joining arrangements.
                  </p>
                </div>
                {(
                  [
                    [
                      "identityDocumentReceived",
                      "Identity document copy received",
                    ],
                    ["contractSigned", "Employment contract signed"],
                    ["bankDetailsVerified", "Bank details verified"],
                  ] as const
                ).map(([key, label]) => (
                  <div
                    key={key}
                    className="flex items-center gap-3 rounded-lg border p-4"
                  >
                    <Checkbox
                      id={key}
                      checked={draft.onboarding[key]}
                      onCheckedChange={(checked) =>
                        setDraft((previous) => ({
                          ...previous,
                          onboarding: {
                            ...previous.onboarding,
                            [key]: checked === true,
                          },
                        }))
                      }
                    />
                    <Label htmlFor={key}>{label}</Label>
                  </div>
                ))}
                <div className="space-y-2">
                  <Label htmlFor="onboarding.notes">Joining notes</Label>
                  <Textarea
                    id="onboarding.notes"
                    value={draft.onboarding.notes}
                    maxLength={3000}
                    rows={5}
                    onChange={(event) =>
                      setDraft((previous) => ({
                        ...previous,
                        onboarding: {
                          ...previous.onboarding,
                          notes: event.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </TabsContent>
            </Tabs>
          </fieldset>
          {saveError && (
            <p
              role="alert"
              className="mt-5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              {saveError}
            </p>
          )}
        </form>
        <DialogFooter className="border-t px-6 py-4 sm:items-center">
          <p className="mr-auto text-xs text-muted-foreground">
            Partial profiles can be saved and completed later.
          </p>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="employee-profile-form"
            disabled={
              saving || (isNew && (loadingRoles || Boolean(rolesError)))
            }
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isNew ? "Create Employee & User" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function EmployeeProfile() {
  const { currentUser, userProfile } = useAuth();
  const { toast } = useToast();
  const canManage = canManageEmployeeProfiles(userProfile?.role);
  const canCreate = canCreateEmployeeAccounts(userProfile?.role);
  const [users, setUsers] = useState<EmployeeSourceUser[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [sourceError, setSourceError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [importError, setImportError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [preparingProfiles, setPreparingProfiles] = useState(0);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<Profile | null>(null);
  const [creating, setCreating] = useState(false);
  const generation = useRef(0);
  const initialProfileIds = useRef<Promise<ReadonlySet<string>> | null>(null);
  const latestProfileIds = useRef<ReadonlySet<string> | null>(null);

  const refresh = useCallback(
    async (notify = false) => {
      const request = ++generation.current;
      setLoadingUsers(true);
      setRefreshing(true);
      setSourceError("");
      setImportError("");
      let directoryLoaded = false;
      try {
        const result = await importActiveEmployeeProfiles({
          existingProfileIds:
            latestProfileIds.current || initialProfileIds.current || undefined,
          onUsersLoaded: (loadedUsers) => {
            directoryLoaded = true;
            if (request !== generation.current) return;
            setUsers(loadedUsers);
            setLoadingUsers(false);
          },
          onProgress: (remaining) => {
            if (request === generation.current) setPreparingProfiles(remaining);
          },
        });
        if (request !== generation.current) return;
        if (notify)
          toast({
            title: "Active employees refreshed",
            description: `${result.created} new profile${result.created === 1 ? "" : "s"} added. Existing profiles were preserved.`,
          });
      } catch (error) {
        if (request === generation.current) {
          const message =
            error instanceof Error
              ? error.message
              : "Unable to import active users.";
          if (directoryLoaded) setImportError(message);
          else setSourceError(message);
        }
      } finally {
        if (request === generation.current) {
          setLoadingUsers(false);
          setRefreshing(false);
          setPreparingProfiles(0);
        }
      }
    },
    [toast],
  );

  useEffect(() => {
    if (!canManage || !currentUser) return;
    setLoadingProfiles(true);
    setProfileError("");
    latestProfileIds.current = null;
    let resolveProfiles!: (ids: ReadonlySet<string>) => void;
    let rejectProfiles!: (error: Error) => void;
    initialProfileIds.current = new Promise((resolve, reject) => {
      resolveProfiles = resolve;
      rejectProfiles = reject;
    });
    const unsubscribe = subscribeToEmployeeProfiles(
      (records, serverConfirmed) => {
        setProfiles(records);
        setLoadingProfiles(false);
        setProfileError("");
        if (serverConfirmed) {
          const ids = new Set(records.map((record) => record.id));
          latestProfileIds.current = ids;
          resolveProfiles(ids);
        }
      },
      (error) => {
        rejectProfiles(error);
        setProfileError(error.message);
        setLoadingProfiles(false);
      },
    );
    void refresh();
    return () => {
      generation.current++;
      rejectProfiles(new Error("Employee profile loading was cancelled."));
      unsubscribe();
      initialProfileIds.current = null;
      latestProfileIds.current = null;
    };
  }, [canManage, currentUser?.uid, refresh]);

  const savedProfileIds = useMemo(
    () => new Set(profiles.map((profile) => profile.id)),
    [profiles],
  );
  const activeProfiles = useMemo(() => {
    const byUser = new Map(profiles.map((profile) => [profile.id, profile]));
    return users
      .map(
        (user): Profile =>
          byUser.get(user.id) || {
            ...initialEmployeeProfile(user),
            id: user.id,
            userId: user.id,
            schemaVersion: 1,
            revision: 0,
            sourceRole: user.role || "",
            createdById: "",
            updatedById: "",
          },
      )
      .sort((a, b) => a.personal.fullName.localeCompare(b.personal.fullName));
  }, [profiles, users]);
  const departments = useMemo(
    () =>
      Array.from(
        new Set(
          activeProfiles
            .map((profile) => profile.employment.department)
            .filter(Boolean),
        ),
      ).sort(),
    [activeProfiles],
  );
  const complete = activeProfiles.filter(
    (profile) => employeeProfileMissingFields(profile).length === 0,
  ).length;
  const filtered = activeProfiles.filter((profile) => {
    const haystack = [
      profile.personal.fullName,
      profile.personal.email,
      profile.personal.personalEmail,
      profile.employment.employeeCode,
      profile.employment.designation,
      profile.employment.department,
      profile.employment.company,
    ]
      .join(" ")
      .toLowerCase();
    const isComplete = employeeProfileMissingFields(profile).length === 0;
    return (
      haystack.includes(search.toLowerCase().trim()) &&
      (!department || profile.employment.department === department) &&
      (!status || (status === "complete" ? isComplete : !isComplete))
    );
  });
  const loading = loadingUsers || loadingProfiles;
  const error = sourceError || profileError;

  if (!canManage)
    return (
      <div className="mx-auto max-w-lg p-10 text-center">
        <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold">
          Employee profiles are restricted
        </h1>
        <p className="mt-2 text-muted-foreground">
          Only Finance, Financial Admin, and Main Admin can access employee
          profiles.
        </p>
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <UserRound className="h-4 w-4" />
            People & Payroll
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Employee Profile
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Keep joining details, emergency contacts, and salary information
            together for your active employees.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCreate && (
            <Button onClick={() => setCreating(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Create Employee & User
            </Button>
          )}
          <Button
            variant="outline"
            disabled={refreshing}
            onClick={() => void refresh(true)}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh active users
          </Button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Active employees", value: users.length, icon: Users },
          { label: "Details complete", value: complete, icon: CheckCircle2 },
          {
            label: "Needs details",
            value: Math.max(0, users.length - complete),
            icon: ClipboardCheck,
          },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-1 text-3xl font-semibold">
                  {loading ? "—" : value}
                </p>
              </div>
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <Icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          Import active users or create an employee and login account together.
          Saving a profile also updates shared details in User Management.
          Refresh adds missing profiles without replacing saved salary or
          joining details.
        </p>
      </div>
      {preparingProfiles > 0 && (
        <p
          role="status"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Preparing {preparingProfiles} missing profile
          {preparingProfiles === 1 ? "" : "s"}. Existing profiles are ready to
          use.
        </p>
      )}
      {importError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50/50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950/20"
        >
          <p>Some missing profiles could not be prepared: {importError}</p>
          <Button
            variant="outline"
            size="sm"
            disabled={refreshing}
            onClick={() => void refresh(true)}
          >
            Retry missing profiles
          </Button>
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          <p>{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              profileError ? window.location.reload() : void refresh()
            }
            disabled={loadingUsers}
          >
            Retry
          </Button>
        </div>
      )}
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                aria-label="Search employees"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Search name, email, employee ID, designation, or company"
              />
            </div>
            <select
              aria-label="Filter by department"
              className={`${selectClass} md:w-48`}
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
            >
              <option value="">All departments</option>
              {departments.map((item) => (
                <option key={item} value={item}>
                  {item.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by profile status"
              className={`${selectClass} md:w-44`}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">All profiles</option>
              <option value="complete">Details complete</option>
              <option value="incomplete">Needs details</option>
            </select>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-3 p-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading active employee profiles…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-14 text-center">
              <Users className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
              <h2 className="font-semibold">
                {activeProfiles.length
                  ? "No matching employees"
                  : "No active employee profiles yet"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {activeProfiles.length
                  ? "Try another search or filter."
                  : "Approved, active users from User Management will appear here."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department & Designation</TableHead>
                  <TableHead>Joining date</TableHead>
                  <TableHead>Employment status</TableHead>
                  <TableHead>Profile status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((profile) => {
                  const missing = employeeProfileMissingFields(profile);
                  return (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <p className="font-medium">
                          {profile.personal.fullName}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {profile.personal.email}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {profile.employment.employeeCode ||
                            "Employee ID pending"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="capitalize">
                          {profile.employment.department.replace(/_/g, " ") ||
                            "Not recorded"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {profile.employment.designation ||
                            "Designation pending"}
                        </p>
                        {profile.employment.company && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {profile.employment.company}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {displayDate(profile.employment.joiningDate)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            profile.employment.employmentStatus === "active"
                              ? "outline"
                              : "secondary"
                          }
                          className="capitalize"
                        >
                          {profile.employment.employmentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={missing.length ? "secondary" : "default"}
                        >
                          {missing.length
                            ? "Needs details"
                            : "Details complete"}
                        </Badge>
                        {missing.length > 0 && (
                          <p
                            className="mt-2 max-w-52 text-xs text-muted-foreground"
                            title={missing.join(", ")}
                          >
                            {missing.length} field
                            {missing.length === 1 ? "" : "s"} to complete
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            Boolean(error) || !savedProfileIds.has(profile.id)
                          }
                          aria-label={`Edit profile for ${profile.personal.fullName}`}
                          onClick={() => setEditing(profile)}
                        >
                          {savedProfileIds.has(profile.id) ? (
                            <>
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              Profile
                            </>
                          ) : (
                            <>
                              <Loader2
                                className={`mr-2 h-3.5 w-3.5 ${preparingProfiles ? "animate-spin" : ""}`}
                              />
                              {importError ? "Profile pending" : "Preparing..."}
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {!loading && (
            <p className="border-t px-4 py-3 text-xs text-muted-foreground">
              Showing {filtered.length} of {activeProfiles.length} active
              employee profiles
            </p>
          )}
        </CardContent>
      </Card>
      {(editing || creating) && (
        <ProfileEditor
          key={editing ? `${editing.id}-${editing.revision}` : "new"}
          profile={editing}
          users={users}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onUserSaved={(user) =>
            setUsers((previous) =>
              previous.some((item) => item.id === user.id)
                ? previous.map((item) => (item.id === user.id ? user : item))
                : [...previous, user],
            )
          }
        />
      )}
    </div>
  );
}
