// export const BUDGET_WORKFLOW_CONFIG_ID = "budgetRequests";

// export type BudgetRequestVisibility = "role" | "all" | "assigned" | "own";
// export type RoleBudgetRequestVisibility = Exclude<
//   BudgetRequestVisibility,
//   "role"
// >;

// export interface BudgetApprovalLevel {
//   id: string;
//   name: string;
//   order: number;
//   userIds: string[];
//   roleIds: string[];
// }

// export interface BudgetApprovalWorkflowConfig {
//   id?: string;
//   module: "budget_requests";
//   enabled: boolean;
//   version: number;
//   levels: BudgetApprovalLevel[];
//   createdAt?: any;
//   updatedAt?: any;
//   updatedBy?: string;
// }

// export interface BudgetApprovalWorkflowSnapshot {
//   configId: string;
//   configVersion: number;
//   levels: BudgetApprovalLevel[];
//   currentLevelIndex: number;
//   state: "pending" | "approved" | "returned";
//   initializedAt: any;
//   completedAt?: any;
// }

// export function normalizeWorkflowKey(value: any): string {
//   return String(value || "")
//     .toLowerCase()
//     .trim()
//     .replace(/[\s-]+/g, "_");
// }

// export function uniqueStrings(values: any[]): string[] {
//   return Array.from(
//     new Set(
//       values
//         .map((value) => String(value || "").trim())
//         .filter(Boolean),
//     ),
//   );
// }

// export function createApprovalLevel(order: number): BudgetApprovalLevel {
//   return {
//     id: `level_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
//     name: `Approval Level ${order}`,
//     order,
//     userIds: [],
//     roleIds: [],
//   };
// }

// export function sanitizeApprovalLevels(
//   levels: BudgetApprovalLevel[] = [],
// ): BudgetApprovalLevel[] {
//   return [...levels]
//     .map((level, index) => ({
//       id:
//         String(level?.id || "").trim() ||
//         `level_${index + 1}_${Math.random().toString(36).slice(2, 8)}`,
//       name:
//         String(level?.name || "").trim() || `Approval Level ${index + 1}`,
//       order: index + 1,
//       userIds: uniqueStrings(Array.isArray(level?.userIds) ? level.userIds : []),
//       roleIds: uniqueStrings(Array.isArray(level?.roleIds) ? level.roleIds : []),
//     }))
//     .sort((a, b) => a.order - b.order)
//     .map((level, index) => ({ ...level, order: index + 1 }));
// }

// export function createWorkflowSnapshot(
//   config: BudgetApprovalWorkflowConfig,
// ): BudgetApprovalWorkflowSnapshot {
//   return {
//     configId: BUDGET_WORKFLOW_CONFIG_ID,
//     configVersion: Number(config?.version || 1),
//     levels: sanitizeApprovalLevels(config?.levels || []),
//     currentLevelIndex: 0,
//     state: "pending",
//     initializedAt: new Date(),
//   };
// }

// export function getCurrentApprovalLevel(
//   request: any,
// ): BudgetApprovalLevel | null {
//   const levels = Array.isArray(request?.approvalWorkflow?.levels)
//     ? request.approvalWorkflow.levels
//     : [];
//   const index = Number(request?.approvalWorkflow?.currentLevelIndex ?? 0);

//   if (!Number.isInteger(index) || index < 0 || index >= levels.length) {
//     return null;
//   }

//   return levels[index] || null;
// }

// export function getUserIdentityValues(user: any): string[] {
//   return uniqueStrings([
//     user?.id,
//     user?.uid,
//     user?.userId,
//     user?.firebaseUid,
//     user?.authUid,
//     user?.email,
//   ]).map((value) => value.toLowerCase());
// }

// export function getRequestOwnerIdentityValues(request: any): string[] {
//   return uniqueStrings([
//     request?.submittedBy,
//     request?.createdBy,
//     request?.requestedBy,
//     request?.requesterId,
//     request?.userId,
//     request?.uid,
//     request?.createdById,
//     request?.submittedById,
//     request?.createdByEmail,
//     request?.submittedByEmail,
//     request?.email,
//   ]).map((value) => value.toLowerCase());
// }

// export function isRequestOwnedByUser(request: any, user: any): boolean {
//   const userValues = getUserIdentityValues(user);
//   const ownerValues = getRequestOwnerIdentityValues(request);
//   return ownerValues.some((value) => userValues.includes(value));
// }

// export function isUserAssignedToApprovalLevel(
//   level: BudgetApprovalLevel | null,
//   user: any,
// ): boolean {
//   if (!level || !user) return false;

//   const userValues = getUserIdentityValues(user);
//   const assignedUsers = uniqueStrings(level.userIds || []).map((value) =>
//     value.toLowerCase(),
//   );
//   const userRole = normalizeWorkflowKey(user?.role);
//   const assignedRoles = uniqueStrings(level.roleIds || []).map(
//     normalizeWorkflowKey,
//   );

//   return (
//     assignedUsers.some((value) => userValues.includes(value)) ||
//     Boolean(userRole && assignedRoles.includes(userRole))
//   );
// }

// export function isCurrentRequestApprover(request: any, user: any): boolean {
//   const workflowState = String(request?.approvalWorkflow?.state || "pending");
//   const status = normalizeWorkflowKey(request?.status);

//   if (workflowState !== "pending" || status !== "pending_approval") {
//     return false;
//   }

//   return isUserAssignedToApprovalLevel(getCurrentApprovalLevel(request), user);
// }

// export function getEffectiveBudgetRequestVisibility(args: {
//   userRecord?: any;
//   roleRecord?: any;
// }): RoleBudgetRequestVisibility {
//   const { userRecord, roleRecord } = args;
//   const userVisibility = String(
//     userRecord?.budgetRequestVisibility || "",
//   ).trim() as BudgetRequestVisibility;

//   if (["all", "assigned", "own"].includes(userVisibility)) {
//     return userVisibility as RoleBudgetRequestVisibility;
//   }

//   if (userRecord?.canViewAllBudgetRequests === true) return "all";

//   const roleVisibility = String(
//     roleRecord?.budgetRequestVisibility || "",
//   ).trim() as RoleBudgetRequestVisibility;

//   if (["all", "assigned", "own"].includes(roleVisibility)) {
//     return roleVisibility;
//   }

//   return "own";
// }

// export function canUserViewBudgetRequest(args: {
//   request: any;
//   user: any;
//   visibility: RoleBudgetRequestVisibility;
// }): boolean {
//   const { request, user, visibility } = args;

//   if (visibility === "all") return true;
//   if (isRequestOwnedByUser(request, user)) return true;
//   if (visibility === "own") return false;

//   return isCurrentRequestApprover(request, user);
// }

// export function getPendingApprovalFields(
//   snapshot: BudgetApprovalWorkflowSnapshot,
//   currentLevelIndex = 0,
// ) {
//   const level = snapshot.levels[currentLevelIndex];

//   return {
//     status: "pending_approval",
//     approvalWorkflow: {
//       ...snapshot,
//       currentLevelIndex,
//       state: "pending" as const,
//     },
//     currentApprovalLevel: currentLevelIndex + 1,
//     currentApprovalLevelId: level?.id || "",
//     currentApprovalLevelName: level?.name || "",
//     currentApproverUserIds: level?.userIds || [],
//     currentApproverRoleIds: level?.roleIds || [],
//     currentApprover: level?.name || "",
//   };
// }

// export function getWorkflowStatusLabel(request: any): string {
//   const status = normalizeWorkflowKey(request?.status);

//   if (status === "pending_approval") {
//     const level = getCurrentApprovalLevel(request);
//     return level?.name ? `Pending: ${level.name}` : "Pending Approval";
//   }

//   if (status === "approved") return "Approved";
//   if (["rejected", "returned_to_creator", "changes_requested"].includes(status)) {
//     return "Returned for Changes";
//   }

//   return String(request?.status || "Unknown")
//     .replace(/_/g, " ")
//     .replace(/\b\w/g, (letter) => letter.toUpperCase());
// }






export const BUDGET_WORKFLOW_CONFIG_ID = "budgetRequests";

export type BudgetRequestVisibility = "role" | "all" | "assigned" | "own";
export type RoleBudgetRequestVisibility = Exclude<
  BudgetRequestVisibility,
  "role"
>;

export interface BudgetApprovalLevel {
  id: string;
  /** Internal level title. This is not the approver role shown in the request list. */
  name: string;
  order: number;
  userIds: string[];
  roleIds: string[];
  /** Combined role IDs from direct role assignments and assigned users. */
  approverRoleIds?: string[];
  /** Readable role names snapshotted for display, for example Finance Manager. */
  approverRoleNames?: string[];
}

export interface BudgetApprovalWorkflowConfig {
  id?: string;
  module: "budget_requests";
  enabled: boolean;
  version: number;
  levels: BudgetApprovalLevel[];
  createdAt?: any;
  updatedAt?: any;
  updatedBy?: string;
}

export interface BudgetApprovalWorkflowSnapshot {
  configId: string;
  configVersion: number;
  levels: BudgetApprovalLevel[];
  currentLevelIndex: number;
  state: "pending" | "approved" | "returned";
  initializedAt: any;
  completedAt?: any;
}

export interface ApprovalRoleResolutionContext {
  roles?: any[];
  users?: any[];
}

export function normalizeWorkflowKey(value: any): string {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");
}

export function uniqueStrings(values: any[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  );
}

export function formatWorkflowRoleName(value: any): string {
  const text = String(value || "").trim();
  if (!text) return "";

  return text
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

export function isGenericApprovalLevelName(value: any): boolean {
  const text = String(value || "").trim();
  if (!text) return true;

  return /^(approval\s*)?level\s*\d*$/i.test(text);
}

export function createApprovalLevel(order: number): BudgetApprovalLevel {
  return {
    id: `level_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: `Approval Level ${order}`,
    order,
    userIds: [],
    roleIds: [],
    approverRoleIds: [],
    approverRoleNames: [],
  };
}

export function sanitizeApprovalLevels(
  levels: BudgetApprovalLevel[] = [],
): BudgetApprovalLevel[] {
  return [...levels]
    .map((level, index) => ({
      id:
        String(level?.id || "").trim() ||
        `level_${index + 1}_${Math.random().toString(36).slice(2, 8)}`,
      name:
        String(level?.name || "").trim() || `Approval Level ${index + 1}`,
      order: Number(level?.order || index + 1),
      userIds: uniqueStrings(Array.isArray(level?.userIds) ? level.userIds : []),
      roleIds: uniqueStrings(Array.isArray(level?.roleIds) ? level.roleIds : []),
      approverRoleIds: uniqueStrings(
        Array.isArray(level?.approverRoleIds) ? level.approverRoleIds : [],
      ),
      approverRoleNames: uniqueStrings(
        Array.isArray(level?.approverRoleNames) ? level.approverRoleNames : [],
      ),
    }))
    .sort((a, b) => a.order - b.order)
    .map((level, index) => ({ ...level, order: index + 1 }));
}

function getRoleRecordName(role: any): string {
  return String(
    role?.name || role?.label || role?.displayName || role?.id || "",
  ).trim();
}

function findRoleRecord(roleValue: any, roles: any[]): any | null {
  const roleKey = normalizeWorkflowKey(roleValue);
  if (!roleKey) return null;

  return (
    roles.find((role: any) => {
      return [role?.id, role?.name, role?.label, role?.displayName].some(
        (value) => normalizeWorkflowKey(value) === roleKey,
      );
    }) || null
  );
}

function getUserRoleValue(user: any): string {
  return String(
    user?.role || user?.userRole || user?.departmentRole || "",
  ).trim();
}

function findUserRecord(userId: any, users: any[]): any | null {
  const lookupKey = String(userId || "").trim().toLowerCase();
  if (!lookupKey) return null;

  return (
    users.find((user: any) =>
      getUserIdentityValues(user).some((value) => value === lookupKey),
    ) || null
  );
}

/**
 * Adds display-safe role metadata to every workflow level.
 *
 * `roleIds` and `userIds` remain the authorization source. The derived
 * `approverRoleIds` and `approverRoleNames` are the display source used by
 * Status and Current Step. This prevents an internal title such as
 * "Approval Level 1" from being shown as the current approver.
 */
export function enrichApprovalLevelsWithRoleMetadata(
  levels: BudgetApprovalLevel[] = [],
  roles: any[] = [],
  users: any[] = [],
): BudgetApprovalLevel[] {
  return sanitizeApprovalLevels(levels).map((level) => {
    const userRoleIds = uniqueStrings(
      (level.userIds || []).map((userId) => {
        const user = findUserRecord(userId, users);
        return getUserRoleValue(user);
      }),
    );

    const approverRoleIds = uniqueStrings([
      ...(level.roleIds || []),
      ...userRoleIds,
      ...(level.approverRoleIds || []),
    ]);

    const resolvedRoleNames = uniqueStrings(
      approverRoleIds.map((roleId) => {
        const roleRecord = findRoleRecord(roleId, roles);
        return getRoleRecordName(roleRecord) || formatWorkflowRoleName(roleId);
      }),
    );

    const approverRoleNames = uniqueStrings(
      resolvedRoleNames.length > 0
        ? resolvedRoleNames
        : level.approverRoleNames || [],
    ).filter((name) => !isGenericApprovalLevelName(name));

    return {
      ...level,
      approverRoleIds,
      approverRoleNames,
    };
  });
}

export function createWorkflowSnapshot(
  config: BudgetApprovalWorkflowConfig,
): BudgetApprovalWorkflowSnapshot {
  return {
    configId: BUDGET_WORKFLOW_CONFIG_ID,
    configVersion: Number(config?.version || 1),
    levels: sanitizeApprovalLevels(config?.levels || []),
    currentLevelIndex: 0,
    state: "pending",
    initializedAt: new Date(),
  };
}

export function getCurrentApprovalLevel(
  request: any,
): BudgetApprovalLevel | null {
  const levels = Array.isArray(request?.approvalWorkflow?.levels)
    ? request.approvalWorkflow.levels
    : [];
  const index = Number(request?.approvalWorkflow?.currentLevelIndex ?? 0);

  if (!Number.isInteger(index) || index < 0 || index >= levels.length) {
    return null;
  }

  return levels[index] || null;
}

export function getUserIdentityValues(user: any): string[] {
  return uniqueStrings([
    user?.id,
    user?.uid,
    user?.userId,
    user?.firebaseUid,
    user?.authUid,
    user?.email,
  ]).map((value) => value.toLowerCase());
}

export function getRequestOwnerIdentityValues(request: any): string[] {
  return uniqueStrings([
    request?.submittedBy,
    request?.createdBy,
    request?.requestedBy,
    request?.requesterId,
    request?.userId,
    request?.uid,
    request?.createdById,
    request?.submittedById,
    request?.createdByEmail,
    request?.submittedByEmail,
    request?.email,
  ]).map((value) => value.toLowerCase());
}

export function isRequestOwnedByUser(request: any, user: any): boolean {
  const userValues = getUserIdentityValues(user);
  const ownerValues = getRequestOwnerIdentityValues(request);
  return ownerValues.some((value) => userValues.includes(value));
}

export function isUserAssignedToApprovalLevel(
  level: BudgetApprovalLevel | null,
  user: any,
): boolean {
  if (!level || !user) return false;

  const userValues = getUserIdentityValues(user);
  const assignedUsers = uniqueStrings(level.userIds || []).map((value) =>
    value.toLowerCase(),
  );
  const userRole = normalizeWorkflowKey(user?.role);
  const assignedRoles = uniqueStrings(level.roleIds || []).map(
    normalizeWorkflowKey,
  );

  return (
    assignedUsers.some((value) => userValues.includes(value)) ||
    Boolean(userRole && assignedRoles.includes(userRole))
  );
}

export function isCurrentRequestApprover(request: any, user: any): boolean {
  const workflowState = String(request?.approvalWorkflow?.state || "pending");
  const status = normalizeWorkflowKey(request?.status);

  if (workflowState !== "pending" || status !== "pending_approval") {
    return false;
  }

  return isUserAssignedToApprovalLevel(getCurrentApprovalLevel(request), user);
}

export function getEffectiveBudgetRequestVisibility(args: {
  userRecord?: any;
  roleRecord?: any;
}): RoleBudgetRequestVisibility {
  const { userRecord, roleRecord } = args;
  const userVisibility = String(
    userRecord?.budgetRequestVisibility || "",
  ).trim() as BudgetRequestVisibility;

  if (["all", "assigned", "own"].includes(userVisibility)) {
    return userVisibility as RoleBudgetRequestVisibility;
  }

  if (userRecord?.canViewAllBudgetRequests === true) return "all";

  const roleVisibility = String(
    roleRecord?.budgetRequestVisibility || "",
  ).trim() as RoleBudgetRequestVisibility;

  if (["all", "assigned", "own"].includes(roleVisibility)) {
    return roleVisibility;
  }

  return "own";
}

export function canUserViewBudgetRequest(args: {
  request: any;
  user: any;
  visibility: RoleBudgetRequestVisibility;
}): boolean {
  const { request, user, visibility } = args;

  if (visibility === "all") return true;
  if (isRequestOwnedByUser(request, user)) return true;
  if (visibility === "own") return false;

  return isCurrentRequestApprover(request, user);
}

export function resolveCurrentApproverRoleNames(
  request: any,
  context: ApprovalRoleResolutionContext = {},
): string[] {
  const level = getCurrentApprovalLevel(request);
  if (!level) return [];

  const mergedLevel: BudgetApprovalLevel = {
    ...level,
    roleIds: uniqueStrings([
      ...(level.roleIds || []),
      ...(Array.isArray(request?.currentApproverRoleIds)
        ? request.currentApproverRoleIds
        : []),
    ]),
    userIds: uniqueStrings([
      ...(level.userIds || []),
      ...(Array.isArray(request?.currentApproverUserIds)
        ? request.currentApproverUserIds
        : []),
    ]),
    approverRoleIds: uniqueStrings([
      ...(level.approverRoleIds || []),
      ...(Array.isArray(request?.currentApproverRoleIds)
        ? request.currentApproverRoleIds
        : []),
    ]),
    approverRoleNames: uniqueStrings([
      ...(level.approverRoleNames || []),
      ...(Array.isArray(request?.currentApproverRoleNames)
        ? request.currentApproverRoleNames
        : []),
    ]),
  };

  const enriched = enrichApprovalLevelsWithRoleMetadata(
    [mergedLevel],
    context.roles || [],
    context.users || [],
  )[0];

  return uniqueStrings(enriched?.approverRoleNames || []).filter(
    (name) => !isGenericApprovalLevelName(name),
  );
}

export function getCurrentApproverRoleLabel(
  request: any,
  context: ApprovalRoleResolutionContext = {},
): string {
  return resolveCurrentApproverRoleNames(request, context).join(" / ");
}

export function getPendingApprovalFields(
  snapshot: BudgetApprovalWorkflowSnapshot,
  currentLevelIndex = 0,
) {
  const level = snapshot.levels[currentLevelIndex];
  const currentApproverRoleIds = uniqueStrings([
    ...(level?.approverRoleIds || []),
    ...(level?.roleIds || []),
  ]);
  const currentApproverRoleNames = uniqueStrings(
    level?.approverRoleNames || [],
  ).filter((name) => !isGenericApprovalLevelName(name));
  const currentApproverRoleLabel = currentApproverRoleNames.join(" / ");

  return {
    status: "pending_approval",
    approvalWorkflow: {
      ...snapshot,
      currentLevelIndex,
      state: "pending" as const,
    },
    currentApprovalLevel: currentLevelIndex + 1,
    currentApprovalLevelId: level?.id || "",
    // Kept only for audit/internal display. Status and Current Step must not use it.
    currentApprovalLevelName: level?.name || "",
    currentApproverUserIds: level?.userIds || [],
    currentApproverRoleIds,
    currentApproverRoleNames,
    currentApprover: currentApproverRoleLabel,
  };
}

export function getWorkflowStatusLabel(
  request: any,
  context: ApprovalRoleResolutionContext = {},
): string {
  const status = normalizeWorkflowKey(request?.status);

  if (status === "pending_approval") {
    const approverRoleLabel = getCurrentApproverRoleLabel(request, context);
    return approverRoleLabel
      ? `Pending: ${approverRoleLabel}`
      : "Pending Approval";
  }

  if (status === "approved") return "Approved";
  if (["rejected", "returned_to_creator", "changes_requested"].includes(status)) {
    return "Returned for Changes";
  }

  return String(request?.status || "Unknown")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
