// Edit/delete rules for Purchase Orders, shared by the PO List (to show or hide
// the actions) and the Create/Edit PO page (to re-check before saving, in case
// the PO was approved or paid after the edit was opened).

const PURCHASE_ORDER_ADMIN_ROLE_KEYS = ["main_admin", "admin", "administrator"];

const getRoleKey = (value: any) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");

const normalizeText = (value: any) =>
  String(value || "")
    .toLowerCase()
    .trim();

export function isPurchaseOrderAdminRole(role: any): boolean {
  return PURCHASE_ORDER_ADMIN_ROLE_KEYS.includes(getRoleKey(role));
}

// approvalStatus only becomes "approved" once the final approval level is
// completed; intermediate levels keep it "pending".
export function isPurchaseOrderFinallyApproved(po: any): boolean {
  return (
    normalizeText(po?.approvalStatus) === "approved" ||
    normalizeText(po?.approvalWorkflow?.state) === "approved"
  );
}

const getReleaseAmount = (entry: any) => {
  const amount = Number(
    entry?.amount ??
      entry?.releaseAmount ??
      entry?.releasedAmount ??
      entry?.paymentAmount ??
      0,
  );

  return Number.isFinite(amount) ? amount : 0;
};

export function hasPurchaseOrderPaymentReleased(po: any): boolean {
  const history = Array.isArray(po?.paymentReleaseHistory)
    ? po.paymentReleaseHistory
    : [];

  return (
    history.some((entry: any) => getReleaseAmount(entry) > 0) ||
    getReleaseAmount(po?.paymentDetails) > 0 ||
    getReleaseAmount(po?.latestPaymentRelease) > 0 ||
    Number(po?.totalReleasedAmount || 0) > 0
  );
}

// Why a PO can no longer be edited, or "" if it can.
export function getPurchaseOrderEditLockReason(po: any): string {
  if (isPurchaseOrderFinallyApproved(po)) {
    return "This Purchase Order has been approved and can no longer be edited.";
  }

  if (hasPurchaseOrderPaymentReleased(po)) {
    return "Payment has already been released for this Purchase Order, so it can no longer be edited.";
  }

  if (po?.status === "Paid") {
    return "This Purchase Order is marked as Paid and can no longer be edited.";
  }

  return "";
}
