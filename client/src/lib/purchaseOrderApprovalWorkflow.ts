export const PURCHASE_ORDER_WORKFLOW_CONFIG_ID = "purchase_order_approval";

export interface PurchaseOrderApprovalLevel {
  id: string;
  name: string;
  order: number;
  userIds: string[];
  roleIds: string[];
  approverRoleIds?: string[];
  approverRoleNames?: string[];
}

export interface PurchaseOrderApprovalWorkflowConfig {
  id?: string;
  module: "purchase_orders";
  enabled: boolean;
  version: number;
  levels: PurchaseOrderApprovalLevel[];
  createdAt?: any;
  updatedAt?: any;
  updatedBy?: string;
}

export interface PurchaseOrderApprovalWorkflowSnapshot {
  configId: string;
  configVersion: number;
  levels: PurchaseOrderApprovalLevel[];
  currentLevelIndex: number;
  state: "pending" | "approved" | "returned";
  initializedAt: any;
  completedAt?: any;
}

export interface PurchaseOrderApprovalResolutionContext {
  roles?: any[];
  users?: any[];
}

export function normalizePurchaseOrderWorkflowKey(value: any): string {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");
}

export function uniquePurchaseOrderWorkflowStrings(values: any[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  );
}

function formatRoleName(value: any): string {
  return String(value || "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isGenericLevelName(value: any): boolean {
  const text = String(value || "").trim();
  return !text || /^(approval\s*)?level\s*\d*$/i.test(text);
}

export function createPurchaseOrderApprovalLevel(
  order: number,
): PurchaseOrderApprovalLevel {
  return {
    id: `po_level_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: `Approval Level ${order}`,
    order,
    userIds: [],
    roleIds: [],
    approverRoleIds: [],
    approverRoleNames: [],
  };
}

export function sanitizePurchaseOrderApprovalLevels(
  levels: PurchaseOrderApprovalLevel[] = [],
): PurchaseOrderApprovalLevel[] {
  return [...levels]
    .map((level, index) => ({
      id:
        String(level?.id || "").trim() ||
        `po_level_${index + 1}_${Math.random().toString(36).slice(2, 8)}`,
      name:
        String(level?.name || "").trim() || `Approval Level ${index + 1}`,
      order: Number(level?.order || index + 1),
      userIds: uniquePurchaseOrderWorkflowStrings(
        Array.isArray(level?.userIds) ? level.userIds : [],
      ),
      roleIds: uniquePurchaseOrderWorkflowStrings(
        Array.isArray(level?.roleIds) ? level.roleIds : [],
      ),
      approverRoleIds: uniquePurchaseOrderWorkflowStrings(
        Array.isArray(level?.approverRoleIds) ? level.approverRoleIds : [],
      ),
      approverRoleNames: uniquePurchaseOrderWorkflowStrings(
        Array.isArray(level?.approverRoleNames) ? level.approverRoleNames : [],
      ),
    }))
    .sort((a, b) => a.order - b.order)
    .map((level, index) => ({ ...level, order: index + 1 }));
}

export function getPurchaseOrderUserIdentityValues(user: any): string[] {
  return uniquePurchaseOrderWorkflowStrings([
    user?.id,
    user?.uid,
    user?.userId,
    user?.firebaseUid,
    user?.authUid,
    user?.email,
  ]).map((value) => value.toLowerCase());
}

function getRoleRecordName(role: any): string {
  return String(
    role?.name || role?.label || role?.displayName || role?.id || "",
  ).trim();
}

function findRoleRecord(roleValue: any, roles: any[]): any | null {
  const roleKey = normalizePurchaseOrderWorkflowKey(roleValue);
  if (!roleKey) return null;

  return (
    roles.find((role: any) =>
      [role?.id, role?.name, role?.label, role?.displayName].some(
        (value) => normalizePurchaseOrderWorkflowKey(value) === roleKey,
      ),
    ) || null
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
      getPurchaseOrderUserIdentityValues(user).includes(lookupKey),
    ) || null
  );
}

export function enrichPurchaseOrderApprovalLevelsWithRoleMetadata(
  levels: PurchaseOrderApprovalLevel[] = [],
  roles: any[] = [],
  users: any[] = [],
): PurchaseOrderApprovalLevel[] {
  return sanitizePurchaseOrderApprovalLevels(levels).map((level) => {
    const userRoleIds = uniquePurchaseOrderWorkflowStrings(
      (level.userIds || []).map((userId) => {
        const user = findUserRecord(userId, users);
        return getUserRoleValue(user);
      }),
    );

    const approverRoleIds = uniquePurchaseOrderWorkflowStrings([
      ...(level.roleIds || []),
      ...userRoleIds,
      ...(level.approverRoleIds || []),
    ]);

    const resolvedRoleNames = uniquePurchaseOrderWorkflowStrings(
      approverRoleIds.map((roleId) => {
        const roleRecord = findRoleRecord(roleId, roles);
        return getRoleRecordName(roleRecord) || formatRoleName(roleId);
      }),
    );

    const approverRoleNames = uniquePurchaseOrderWorkflowStrings(
      resolvedRoleNames.length > 0
        ? resolvedRoleNames
        : level.approverRoleNames || [],
    ).filter((name) => !isGenericLevelName(name));

    return {
      ...level,
      approverRoleIds,
      approverRoleNames,
    };
  });
}

export function createPurchaseOrderWorkflowSnapshot(
  config: PurchaseOrderApprovalWorkflowConfig,
): PurchaseOrderApprovalWorkflowSnapshot {
  return {
    configId: PURCHASE_ORDER_WORKFLOW_CONFIG_ID,
    configVersion: Number(config?.version || 1),
    levels: sanitizePurchaseOrderApprovalLevels(config?.levels || []),
    currentLevelIndex: 0,
    state: "pending",
    initializedAt: new Date(),
  };
}

export function getCurrentPurchaseOrderApprovalLevel(
  purchaseOrder: any,
): PurchaseOrderApprovalLevel | null {
  const levels = Array.isArray(purchaseOrder?.approvalWorkflow?.levels)
    ? purchaseOrder.approvalWorkflow.levels
    : [];
  const index = Number(
    purchaseOrder?.approvalWorkflow?.currentLevelIndex ?? 0,
  );

  if (!Number.isInteger(index) || index < 0 || index >= levels.length) {
    return null;
  }

  return levels[index] || null;
}

export function isUserAssignedToPurchaseOrderApprovalLevel(
  level: PurchaseOrderApprovalLevel | null,
  user: any,
): boolean {
  if (!level || !user) return false;

  const userValues = getPurchaseOrderUserIdentityValues(user);
  const assignedUsers = uniquePurchaseOrderWorkflowStrings(
    level.userIds || [],
  ).map((value) => value.toLowerCase());
  const userRole = normalizePurchaseOrderWorkflowKey(user?.role);
  const assignedRoles = uniquePurchaseOrderWorkflowStrings(
    level.roleIds || [],
  ).map(normalizePurchaseOrderWorkflowKey);

  return (
    assignedUsers.some((value) => userValues.includes(value)) ||
    Boolean(userRole && assignedRoles.includes(userRole))
  );
}

export function isCurrentPurchaseOrderApprover(
  purchaseOrder: any,
  user: any,
): boolean {
  const workflowState = String(
    purchaseOrder?.approvalWorkflow?.state || "pending",
  );
  const status = normalizePurchaseOrderWorkflowKey(purchaseOrder?.status);

  if (workflowState !== "pending" || status !== "pending_approval") {
    return false;
  }

  return isUserAssignedToPurchaseOrderApprovalLevel(
    getCurrentPurchaseOrderApprovalLevel(purchaseOrder),
    user,
  );
}

export function getPurchaseOrderOwnerIdentityValues(
  purchaseOrder: any,
): string[] {
  return uniquePurchaseOrderWorkflowStrings([
    purchaseOrder?.submittedBy,
    purchaseOrder?.createdBy,
    purchaseOrder?.requestedBy,
    purchaseOrder?.creatorId,
    purchaseOrder?.userId,
    purchaseOrder?.uid,
    purchaseOrder?.createdById,
    purchaseOrder?.submittedById,
    purchaseOrder?.createdByEmail,
    purchaseOrder?.submittedByEmail,
    purchaseOrder?.email,
  ]).map((value) => value.toLowerCase());
}

export function isPurchaseOrderOwnedByUser(
  purchaseOrder: any,
  user: any,
): boolean {
  const userValues = getPurchaseOrderUserIdentityValues(user);
  const ownerValues = getPurchaseOrderOwnerIdentityValues(purchaseOrder);
  return ownerValues.some((value) => userValues.includes(value));
}

export function getPurchaseOrderCurrentApproverRoleNames(
  purchaseOrder: any,
  context: PurchaseOrderApprovalResolutionContext = {},
): string[] {
  const level = getCurrentPurchaseOrderApprovalLevel(purchaseOrder);
  if (!level) return [];

  const enriched = enrichPurchaseOrderApprovalLevelsWithRoleMetadata(
    [
      {
        ...level,
        roleIds: uniquePurchaseOrderWorkflowStrings([
          ...(level.roleIds || []),
          ...(Array.isArray(purchaseOrder?.currentApproverRoleIds)
            ? purchaseOrder.currentApproverRoleIds
            : []),
        ]),
        userIds: uniquePurchaseOrderWorkflowStrings([
          ...(level.userIds || []),
          ...(Array.isArray(purchaseOrder?.currentApproverUserIds)
            ? purchaseOrder.currentApproverUserIds
            : []),
        ]),
        approverRoleNames: uniquePurchaseOrderWorkflowStrings([
          ...(level.approverRoleNames || []),
          ...(Array.isArray(purchaseOrder?.currentApproverRoleNames)
            ? purchaseOrder.currentApproverRoleNames
            : []),
        ]),
      },
    ],
    context.roles || [],
    context.users || [],
  )[0];

  return uniquePurchaseOrderWorkflowStrings(
    enriched?.approverRoleNames || [],
  ).filter((name) => !isGenericLevelName(name));
}

export function getPurchaseOrderCurrentApproverLabel(
  purchaseOrder: any,
  context: PurchaseOrderApprovalResolutionContext = {},
): string {
  return getPurchaseOrderCurrentApproverRoleNames(
    purchaseOrder,
    context,
  ).join(" / ");
}

export function getPurchaseOrderPendingApprovalFields(
  snapshot: PurchaseOrderApprovalWorkflowSnapshot,
  currentLevelIndex = 0,
) {
  const level = snapshot.levels[currentLevelIndex];
  const currentApproverRoleIds = uniquePurchaseOrderWorkflowStrings([
    ...(level?.approverRoleIds || []),
    ...(level?.roleIds || []),
  ]);
  const currentApproverRoleNames = uniquePurchaseOrderWorkflowStrings(
    level?.approverRoleNames || [],
  ).filter((name) => !isGenericLevelName(name));
  const currentApprover = currentApproverRoleNames.join(" / ");

  return {
    status: "pending_approval" as const,
    approvalWorkflow: {
      ...snapshot,
      currentLevelIndex,
      state: "pending" as const,
    },
    currentApprovalLevel: currentLevelIndex + 1,
    currentApprovalLevelId: level?.id || "",
    currentApprovalLevelName: level?.name || "",
    currentApproverUserIds: level?.userIds || [],
    currentApproverRoleIds,
    currentApproverRoleNames,
    currentApprover,
  };
}

export function getPurchaseOrderWorkflowStatusLabel(
  purchaseOrder: any,
  context: PurchaseOrderApprovalResolutionContext = {},
): string {
  const status = normalizePurchaseOrderWorkflowKey(purchaseOrder?.status);

  if (status === "pending_approval") {
    const approver = getPurchaseOrderCurrentApproverLabel(
      purchaseOrder,
      context,
    );
    return approver ? `Pending: ${approver}` : "Pending Approval";
  }

  if (status === "approved") return "Approved";
  if (["returned_to_creator", "changes_requested"].includes(status)) {
    return "Returned for Changes";
  }

  return String(purchaseOrder?.status || "Unknown")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
