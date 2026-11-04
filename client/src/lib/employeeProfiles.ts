import {
  collection, doc, getDocFromServer, getDocsFromServer, onSnapshot, query, runTransaction, serverTimestamp, where,
  type Transaction,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, deleteUser, signOut, updateProfile } from "firebase/auth";
import { auth, db, secondaryAuth } from "@/lib/firebase";
import {
  canCreateEmployeeAccounts, canManageEmployeeProfiles, EMPLOYEE_PROFILE_COLLECTION, employeeAccountSchema,
  employeeProfileDetailsSchema, employeeProfileDetailsWithDefaults, employeeProfileSharedUserFields,
  initialEmployeeProfile, isActiveEmployeeUser,
  type EmployeeAccountInput, type EmployeeProfile, type EmployeeProfileDraft, type EmployeeSourceUser,
} from "./employeeProfileModel";

const PANEL_ID = "IEDGE-SYSTEM";
export const employeeProfilesCollection = () => collection(db, "Panels", PANEL_ID, EMPLOYEE_PROFILE_COLLECTION);
const userDoc = (id: string) => doc(db, "Panels", PANEL_ID, "users", id);
const profileDoc = (id: string) => doc(employeeProfilesCollection(), id);

async function requireManager(transaction: Transaction, accountCreation = false) {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("Please sign in again.");
  const snapshot = await transaction.get(userDoc(userId));
  const user = { ...snapshot.data(), id: userId } as EmployeeSourceUser;
  if (!snapshot.exists() || !isActiveEmployeeUser(user) || !canManageEmployeeProfiles(user.role)) {
    throw new Error("Only active Finance, Financial Admin, and Main Admin users can manage employee profiles.");
  }
  if (accountCreation && !canCreateEmployeeAccounts(user.role)) throw new Error("Only Main Admin can create employee login accounts.");
  return userId;
}

// A transaction makes concurrent imports safe: the existing profile is never
// rewritten, even when two admins open the page at the same time.
export async function initializeEmployeeProfile(userId: string) {
  return runTransaction(db, async (transaction) => {
    const actorId = await requireManager(transaction);
    const existing = await transaction.get(profileDoc(userId));
    if (existing.exists()) return false;
    const source = await transaction.get(userDoc(userId));
    const user = { ...source.data(), id: userId } as EmployeeSourceUser;
    if (!source.exists() || !isActiveEmployeeUser(user)) return false;
    transaction.set(profileDoc(userId), {
      ...initialEmployeeProfile(user), userId, schemaVersion: 1, revision: 0,
      sourceRole: user.role || "", createdById: actorId, updatedById: actorId,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
    return true;
  });
}

export async function fetchActiveEmployeeUsers() {
  const snapshot = await getDocsFromServer(query(
    collection(db, "Panels", PANEL_ID, "users"), where("accountStatus", "==", "approved"),
  ));
  return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as EmployeeSourceUser)
    .filter(isActiveEmployeeUser);
}

interface EmployeeProfileImportOptions {
  existingProfileIds?: ReadonlySet<string> | Promise<ReadonlySet<string>>;
  onUsersLoaded?: (users: EmployeeSourceUser[]) => void;
  onProgress?: (remaining: number) => void;
}

// Reuse the directory's server snapshot instead of checking each saved profile
// in its own transaction. Publish the list before preparing any missing records.
export async function importActiveEmployeeProfiles(options: EmployeeProfileImportOptions = {}) {
  const profileIds = options.existingProfileIds || getDocsFromServer(employeeProfilesCollection())
    .then((snapshot) => new Set(snapshot.docs.map((item) => item.id)));
  const [users, existingIds] = await Promise.all([fetchActiveEmployeeUsers(), profileIds]);
  options.onUsersLoaded?.(users);
  const missing = users.filter((user) => !existingIds.has(user.id));
  options.onProgress?.(missing.length);
  let created = 0;
  // Creation remains race-safe and limited to eight transactions at a time.
  // Saved profiles incur no initialization transactions on subsequent visits.
  for (let offset = 0; offset < missing.length; offset += 8) {
    const results = await Promise.all(missing.slice(offset, offset + 8).map((user) => initializeEmployeeProfile(user.id)));
    created += results.filter(Boolean).length;
    options.onProgress?.(Math.max(0, missing.length - offset - 8));
  }
  return { users, created };
}

export function subscribeToEmployeeProfiles(
  onChange: (profiles: EmployeeProfile[], serverConfirmed: boolean) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(employeeProfilesCollection(), { includeMetadataChanges: true }, (snapshot) => {
    onChange(snapshot.docs.map((item) => {
      const stored = item.data();
      return { ...stored, ...employeeProfileDetailsWithDefaults(stored), id: item.id } as EmployeeProfile;
    }), !snapshot.metadata.fromCache);
  }, onError);
}

export async function saveEmployeeProfile(userId: string, draft: EmployeeProfileDraft, expectedRevision: number) {
  // Parse an explicit allowlist of profile fields; never copy auth permissions
  // or a user's financial approval limit into payroll data.
  const details = employeeProfileDetailsSchema.parse(draft);
  return runTransaction(db, async (transaction) => {
    const actorId = await requireManager(transaction);
    const existing = await transaction.get(profileDoc(userId));
    const source = await transaction.get(userDoc(userId));
    if (!existing.exists()) throw new Error("This profile no longer exists. Refresh the employee list.");
    if (!source.exists() || !isActiveEmployeeUser({ ...source.data(), id: userId } as EmployeeSourceUser)) {
      throw new Error("This user is no longer active. Refresh the employee list.");
    }
    if (existing.data().revision !== expectedRevision) {
      throw new Error("Another administrator updated this profile. Close and reopen it to load their changes before saving.");
    }
    const sourceData = source.data()!;
    if (details.personal.email.toLowerCase() !== String(sourceData.email || "").trim().toLowerCase()) {
      throw new Error("The login email cannot be changed here. Use Personal email for another contact address, or refresh if the login account changed.");
    }
    const shared = employeeProfileSharedUserFields(details, sourceData.mobileCountryCode || "");
    shared.email = sourceData.email || "";
    const synchronized = { ...details, personal: { ...details.personal, email: shared.email, phone: shared.phone } };
    transaction.update(profileDoc(userId), {
      ...synchronized, revision: expectedRevision + 1, updatedAt: serverTimestamp(), updatedById: actorId,
    });
    transaction.update(userDoc(userId), { ...shared, updatedAt: serverTimestamp(), updatedById: actorId });
    return { ...sourceData, ...shared, id: userId } as EmployeeSourceUser;
  });
}

export async function fetchEmployeeAccountRoles() {
  const snapshot = await getDocsFromServer(collection(db, "Panels", PANEL_ID, "sidebarConfig"));
  const roles = new Map([
    ["operation", "Operation"], ["finance", "Finance"], ["operational_admin", "Operational Admin"],
    ["financial_admin", "Financial Admin"], ["main_admin", "Main Admin"], ["sales", "Sales"],
  ]);
  snapshot.docs.forEach((item) => roles.set(item.id, String(item.data().name || item.id)));
  return Array.from(roles, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
}

let creatingAccount = false;

// Firebase Auth uses the existing secondary app, leaving the administrator's
// session intact. The two Firestore documents are committed atomically.
export async function createEmployeeWithAccount(draft: EmployeeProfileDraft, input: EmployeeAccountInput) {
  const details = employeeProfileDetailsSchema.parse(draft);
  const account = employeeAccountSchema.parse(input);
  if (!details.personal.email) throw new Error("A login email address is required to create an employee account.");
  if (creatingAccount) throw new Error("Another employee account is being created. Please wait.");
  creatingAccount = true;
  let credential: Awaited<ReturnType<typeof createUserWithEmailAndPassword>> | undefined;
  let employee: EmployeeSourceUser | undefined;
  let submittedRecords = false;
  let creationActorId = "";
  try {
    // Verify permission before creating an Auth account, and again at commit.
    creationActorId = await runTransaction(db, (transaction) => requireManager(transaction, true));
    credential = await createUserWithEmailAndPassword(secondaryAuth, details.personal.email, account.password);
    const userId = credential.user.uid;
    const shared = employeeProfileSharedUserFields(details, account.mobileCountryCode);
    shared.email = credential.user.email || details.personal.email;
    const synchronized = { ...details, personal: { ...details.personal, email: shared.email, phone: shared.phone } };
    await updateProfile(credential.user, { displayName: shared.displayName });
    const { password: _password, mobileCountryCode: _countryCode, ...permissions } = account;
    const userData = {
      ...shared, ...permissions, accountStatus: "approved", isActive: true,
      canViewAllBudgetRequests: account.budgetRequestVisibility === "all",
      canViewAllPurchaseOrders: account.purchaseOrderVisibility === "all",
    };
    employee = { ...userData, id: userId };
    await runTransaction(db, async (transaction) => {
      const actorId = await requireManager(transaction, true);
      const existingUser = await transaction.get(userDoc(userId));
      const existingProfile = await transaction.get(profileDoc(userId));
      if (existingUser.exists() || existingProfile.exists()) throw new Error("This employee already has a user or profile record.");
      transaction.set(userDoc(userId), {
        ...userData, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), createdById: actorId, updatedById: actorId,
      });
      transaction.set(profileDoc(userId), {
        ...synchronized, userId, schemaVersion: 1, revision: 0, sourceRole: account.role,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(), createdById: actorId, updatedById: actorId,
      });
      submittedRecords = true;
    });
    return employee;
  } catch (error) {
    if (credential) {
      // Recheck after a failed acknowledgement before deleting a newly created
      // Auth account: a successfully committed employee must remain usable.
      let records;
      try {
        records = await Promise.all([getDocFromServer(userDoc(credential.user.uid)), getDocFromServer(profileDoc(credential.user.uid))]);
      } catch {
        throw new Error("The login account was created, but employee records could not be verified. Ask Main Admin to check this email before retrying.");
      }
      if (submittedRecords && records.every((record) => record.exists() && record.data()?.createdById === creationActorId) &&
        records[0].data()?.email === employee?.email && records[1].data()?.userId === credential.user.uid && employee) return employee;
      if (records.some((record) => record.exists())) throw new Error("The login account has an existing employee record. Ask Main Admin to review it before retrying.");
      try { await deleteUser(credential.user); } catch {
        throw new Error("Employee creation failed and the new login account could not be removed. Ask Main Admin to review this email before retrying.");
      }
    }
    throw error;
  } finally {
    if (credential) await signOut(secondaryAuth).catch(() => {});
    creatingAccount = false;
  }
}
