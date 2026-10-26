import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import jsPDF from "jspdf";
import {
  collection,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import {
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";

import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useFirestoreQuery } from "@/hooks/useFirestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import PaymentReleaseModal from "@/components/PaymentReleaseModal";
import RejectionModal from "@/components/RejectionModal";
import type { PaymentReleaseSubmitArgs } from "@/lib/payments/types";
import { paymentMomentFor } from "@/lib/payments/dates";
import {
  type BudgetApprovalWorkflowConfig,
  createWorkflowSnapshot,
  enrichApprovalLevelsWithRoleMetadata,
  getCurrentApprovalLevel,
  getCurrentApproverRoleLabel,
  getPendingApprovalFields,
  isUserAssignedToApprovalLevel,
} from "@/lib/budgetApprovalWorkflow";
import { useToast } from "@/hooks/use-toast";
import {
  getPurchaseOrderEditLockReason,
  hasPurchaseOrderPaymentReleased,
  isPurchaseOrderAdminRole,
  isPurchaseOrderFinallyApproved,
} from "@/lib/purchaseOrderRules";

const PANEL_ID = "IEDGE-SYSTEM";
const CREATE_PO_ROUTE = "/create-po";
const PO_RECORDS_PER_PAGE = 10;
const PURCHASE_ORDER_WORKFLOW_CONFIG_ID = "purchase_order_approval";

const PURCHASE_ORDER_FINANCE_ROLE_KEYS = new Set([
  "finance",
  "finance_member",
  "member_of_finance",
  "financial_admin",
  "finance_admin",
  "finance_head",
  "head_of_finance",
  "finance_manager",
  "financial_manager",
  // Same Accounts roles that can release payments on Vendor Summary.
  "accounts",
  "account",
  "accountant",
  "accounts_manager",
]);

const PURCHASE_ORDER_OPERATION_HEAD_ROLE_KEYS = new Set([
  "operational_admin",
  "operation_admin",
  "operation_head",
  "operations_head",
  "head_of_operation",
  "head_of_operations",
  "operation_manager",
  "operations_manager",
]);

const poCollectionRef = collection(db, "Panels", PANEL_ID, "PO");

type PurchaseOrderStatus = "Draft" | "Open" | "Paid" | "Cancelled" | "Over Due";

type POStatusFilter = "all" | PurchaseOrderStatus;

const PO_STATUS_FILTERS: { value: POStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Draft", label: "Draft" },
  { value: "Open", label: "Open" },
  { value: "Over Due", label: "Over Due" },
  { value: "Paid", label: "Paid" },
  { value: "Cancelled", label: "Cancelled" },
];

type PillTone = "neutral" | "success" | "warning" | "danger" | "info";

const PILL_TONE_CLASSES: Record<PillTone, string> = {
  neutral: "bg-slate-100 text-slate-600 ring-slate-500/10",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
  danger: "bg-rose-50 text-rose-700 ring-rose-600/20",
  info: "bg-sky-50 text-sky-700 ring-sky-600/20",
};

function StatusPill({
  tone,
  title,
  children,
}: {
  tone: PillTone;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      title={title}
      className={`inline-flex max-w-[180px] items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${PILL_TONE_CLASSES[tone]}`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      <span className="truncate">{children}</span>
    </span>
  );
}

// Page numbers to show around the current page, with "…" for the gaps.
function getPageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: (number | "…")[] = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push("…");
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < totalPages - 1) pages.push("…");
  pages.push(totalPages);

  return pages;
}

type EstimateLineItem = {
  service: string;
  qty: string;
  rate: string;
  amount: number;
};

type PurchaseOrder = {
  id: string;
  poNumber: string;
  estimateId?: string;
  estimateNumber: string;
  supplierId: string;
  supplierName: string;
  supplierAddress?: string;
  issueDate: string;
  dueDate: string;
  items: EstimateLineItem[];
  totalAmount: number;
  status: PurchaseOrderStatus;
  notes?: string;
  source?: "manual" | "budget_request";
  sourceInvoiceId?: string | null;
  sourceRequestId?: string | null;
  sourceProjectName?: string | null;
  sourceClientName?: string | null;
  createdAt?: any;
  updatedAt?: any;

  paymentStatus?: string;
  paymentReleased?: boolean;
  paymentPartiallyReleased?: boolean;
  totalApprovedAmount?: number;
  totalReleasedAmount?: number;
  remainingReleaseAmount?: number;
  transactionName?: string;
  latestTransactionName?: string;
  latestPaymentRelease?: any;
  paymentDetails?: any;
  paymentReleaseHistory?: any[];
  paymentReleasedAt?: any;
  partialPaymentReleasedAt?: any;
  releasePaymentAt?: any;

  approvalStatus?: "pending" | "approved" | "rejected";
  approvalWorkflow?: any;
  approvalHistory?: any[];
  currentApprovalLevel?: number;
  currentApprovalLevelId?: string;
  currentApprovalLevelName?: string;
  currentApproverUserIds?: string[];
  currentApproverRoleIds?: string[];
  currentApproverRoleNames?: string[];
  currentApprover?: string;
  rejectionComment?: string;
  rejectedAt?: any;
  rejectedBy?: string;
  approvedAt?: any;
  approvedBy?: string;
  createdBy?: string;
  createdByName?: string;
  createdById?: string;
  createdByEmail?: string;
  submittedBy?: string;
  submittedById?: string;
  submittedByEmail?: string;
  requestedBy?: string;
  creatorId?: string;
  userId?: string;
  uid?: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatDateDisplay(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB");
}

function getStatusBadgeVariant(status: PurchaseOrderStatus) {
  if (status === "Paid") return "default" as const;
  if (status === "Cancelled" || status === "Over Due")
    return "destructive" as const;
  if (status === "Open") return "secondary" as const;
  return "outline" as const;
}

function isOverDue(po: { dueDate?: string; status: PurchaseOrderStatus }) {
  if (!po.dueDate) return false;
  if (po.status === "Paid" || po.status === "Cancelled") return false;

  const dueDate = new Date(po.dueDate);
  const today = new Date();

  dueDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return dueDate < today;
}

// getPendingApprovalFields is shared with Budget Requests and also sets their
// "pending_approval" status, which isn't a PO status. Keep the PO's own status.
function getPOPendingApprovalFields(snapshot: any, levelIndex: number) {
  const { status: _requestStatus, ...fields } = getPendingApprovalFields(
    snapshot,
    levelIndex,
  );
  return fields;
}

// POs whose status was overwritten with "pending_approval" before that fix:
// read them as the status they would have had.
function getStoredPOStatus(data: any): PurchaseOrderStatus {
  if (data?.status !== "pending_approval") return data?.status;
  return isPurchaseOrderFinallyApproved(data) ? "Open" : "Draft";
}

function asArray(value: any): any[] {
  return Array.isArray(value) ? value : [];
}

function safeText(...values: any[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

function safeNumber(...values: any[]) {
  for (const value of values) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function normalizeText(value: any) {
  return String(value || "")
    .toLowerCase()
    .trim();
}

function getRoleKey(value: any) {
  return normalizeText(value).replace(/[\s-]+/g, "_");
}

// Custom roles created in User Management get an id derived from their name
// (e.g. "Finance Team" -> "finance_team"), so also match on the word itself.
function isFinancePurchaseOrderRole(role: any) {
  const roleKey = getRoleKey(role);
  return (
    PURCHASE_ORDER_FINANCE_ROLE_KEYS.has(roleKey) || roleKey.includes("financ")
  );
}

function isOperationHeadPurchaseOrderRole(role: any) {
  return PURCHASE_ORDER_OPERATION_HEAD_ROLE_KEYS.has(getRoleKey(role));
}

function isOperationHeadText(value: any) {
  const key = getRoleKey(value);
  return key.includes("operation") && key.includes("head");
}

function getRoleItemPath(item: any) {
  return String(typeof item === "string" ? item : item?.path || "").trim();
}

function canAccessPurchaseOrders(profile: any, roleConfigs: any[] = []) {
  if (!profile) return false;

  const profileRoleKey = getRoleKey(profile?.role);
  const isAdmin = isPurchaseOrderAdminRole(profile?.role);

  const assignedRole = roleConfigs.find((role: any) =>
    [role?.id, role?.name, role?.label, role?.displayName].some(
      (value) => getRoleKey(value) === profileRoleKey,
    ),
  );
  const hasModulePermission = Array.isArray(assignedRole?.items)
    ? assignedRole.items.some(
        (item: any) => getRoleItemPath(item) === "/purchase-orders",
      )
    : false;

  // Preserve access for existing Finance/Operations configurations while also
  // allowing any role that the admin grants the Purchase Orders module.
  return Boolean(
    isAdmin ||
      hasModulePermission ||
      isFinancePurchaseOrderRole(profile?.role) ||
      isOperationHeadPurchaseOrderRole(profile?.role) ||
      isOperationHeadText(profile?.designation),
  );
}

function getUserIdentityValues(user: any): string[] {
  return Array.from(
    new Set(
      [
        user?.id,
        user?.uid,
        user?.userId,
        user?.firebaseUid,
        user?.authUid,
        user?.email,
        user?.displayName,
      ]
        .map((value) => normalizeText(value))
        .filter(Boolean),
    ),
  );
}

function getPurchaseOrderOwnerIdentityValues(po: any): string[] {
  return Array.from(
    new Set(
      [
        po?.createdBy,
        po?.createdById,
        po?.createdByEmail,
        po?.createdByName,
        po?.submittedBy,
        po?.submittedById,
        po?.submittedByEmail,
        po?.requestedBy,
        po?.creatorId,
        po?.userId,
        po?.uid,
      ]
        .map((value) => normalizeText(value))
        .filter(Boolean),
    ),
  );
}

function isPurchaseOrderOwnedByUser(po: any, user: any) {
  const userValues = getUserIdentityValues(user);
  const ownerValues = getPurchaseOrderOwnerIdentityValues(po);
  return ownerValues.some((value) => userValues.includes(value));
}

function isPurchaseOrderAssignedToUser(po: any, user: any) {
  const userValues = getUserIdentityValues(user);
  const assignedUsers = [
    ...(Array.isArray(po?.currentApproverUserIds)
      ? po.currentApproverUserIds
      : []),
  ].map((value) => normalizeText(value));

  const userRole = getRoleKey(user?.role);
  const assignedRoles = [
    ...(Array.isArray(po?.currentApproverRoleIds)
      ? po.currentApproverRoleIds
      : []),
  ].map((value) => getRoleKey(value));

  return (
    assignedUsers.some((value) => userValues.includes(value)) ||
    Boolean(userRole && assignedRoles.includes(userRole))
  );
}

function canViewAllPurchaseOrders(user: any) {
  if (user?.purchaseOrderVisibility === "all") return true;
  if (user?.purchaseOrderVisibility === "own") return false;
  if (typeof user?.canViewAllPurchaseOrders === "boolean") {
    return user.canViewAllPurchaseOrders;
  }

  // Backward-compatible default for administrator records created before the
  // per-user Purchase Order visibility field existed.
  return isPurchaseOrderAdminRole(user?.role);
}

function roundMoney(value: any) {
  return Math.round(safeNumber(value) * 100) / 100;
}

function getPaymentReleaseAmount(entry: any) {
  return roundMoney(
    entry?.amount ??
      entry?.releaseAmount ??
      entry?.releasedAmount ??
      entry?.paymentAmount ??
      0,
  );
}

function getPaymentReleaseHistory(source: any): any[] {
  const history = Array.isArray(source?.paymentReleaseHistory)
    ? source.paymentReleaseHistory
    : [];

  if (history.length > 0) {
    return history.filter((entry: any) => getPaymentReleaseAmount(entry) > 0);
  }

  const legacyPayment = source?.paymentDetails || source?.latestPaymentRelease;

  if (legacyPayment && getPaymentReleaseAmount(legacyPayment) > 0) {
    return [legacyPayment];
  }

  return [];
}

function getTotalReleasedAmount(source: any) {
  const calculatedTotal = getPaymentReleaseHistory(source).reduce(
    (sum, entry) => sum + getPaymentReleaseAmount(entry),
    0,
  );

  return roundMoney(calculatedTotal || safeNumber(source?.totalReleasedAmount));
}

function getPOApprovedAmount(source: any) {
  return roundMoney(
    safeNumber(
      source?.totalApprovedAmount,
      source?.approvedAmount,
      source?.totalAmount,
    ),
  );
}

function getPORemainingAmount(source: any) {
  const approvedAmount = getPOApprovedAmount(source);
  const releasedAmount = getTotalReleasedAmount(source);

  return roundMoney(Math.max(approvedAmount - releasedAmount, 0));
}

// Fully released through Payment Release, or marked paid on an older record
// that has no release history to add up.
function isPOPaymentCompleted(po: PurchaseOrder) {
  if (getTotalReleasedAmount(po) > 0 && getPORemainingAmount(po) <= 0.009) {
    return true;
  }

  return (
    po.status === "Paid" ||
    po.paymentReleased === true ||
    ["released", "paid", "completed"].includes(normalizeText(po.paymentStatus))
  );
}

function getPOPaymentLabel(po: PurchaseOrder) {
  if (isPOPaymentCompleted(po)) return "Payment Paid";
  if (getTotalReleasedAmount(po) > 0) return "Partially Released";
  return "Unpaid";
}

function getPOPaymentTone(po: PurchaseOrder): PillTone {
  if (isPOPaymentCompleted(po)) return "success";
  if (getTotalReleasedAmount(po) > 0) return "info";
  return "neutral";
}

function getPaymentMethodLabel(method?: string) {
  switch (method) {
    case "cash":
      return "Cash";
    case "cheque":
      return "Cheque";
    case "bank_transfer":
      return "Bank Transfer";
    case "wire":
      return "Online Transfer";
    default:
      return "-";
  }
}

function formatReleaseDate(value: any) {
  if (!value) return "-";

  let date: Date;

  if (value instanceof Date) {
    date = value;
  } else if (typeof value?.toDate === "function") {
    date = value.toDate();
  } else if (typeof value?.seconds === "number") {
    date = new Date(value.seconds * 1000);
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sanitizeItems(items: EstimateLineItem[]) {
  return items
    .map((item) => {
      const qty = safeNumber(item.qty);
      const rate = safeNumber(item.rate);

      return {
        service: safeText(item.service),
        qty: qty ? String(qty) : "",
        rate: rate ? String(rate) : "",
        amount: safeNumber(item.amount, qty * rate),
      };
    })
    .filter((item) => item.service || item.qty || item.rate || item.amount);
}

function getTotal(items: EstimateLineItem[]) {
  return sanitizeItems(items).reduce(
    (sum, item) => sum + safeNumber(item.amount),
    0,
  );
}

function escapeHtml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function openPdfInCenteredPopup(blob: Blob, title: string) {
  const blobUrl = URL.createObjectURL(blob);
  const safeTitle = escapeHtml(title || "Purchase Order");

  const width = 1120;
  const height = 820;
  const left = Math.max((window.screen.width - width) / 2, 0);
  const top = Math.max((window.screen.height - height) / 2, 0);

  const popup = window.open(
    "",
    title,
    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
  );

  if (!popup) {
    window.open(blobUrl, "_blank");
    return;
  }

  popup.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${safeTitle}</title>
        <style>
          * { box-sizing: border-box; }
          html, body {
            margin: 0;
            height: 100%;
            background: #e5e7eb;
            font-family: Arial, sans-serif;
          }
          .toolbar {
            height: 58px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            padding: 0 18px;
            background: #0f172a;
            color: #fff;
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);
          }
          .title {
            font-size: 15px;
            font-weight: 700;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .actions {
            display: flex;
            gap: 10px;
            flex-shrink: 0;
          }
          button, a {
            border: 0;
            background: #fff;
            color: #0f172a;
            padding: 8px 14px;
            border-radius: 999px;
            font-size: 13px;
            font-weight: 700;
            text-decoration: none;
            cursor: pointer;
          }
          .viewer-wrap {
            height: calc(100% - 58px);
            padding: 18px;
          }
          iframe {
            width: 100%;
            height: 100%;
            border: 0;
            border-radius: 14px;
            background: #fff;
            box-shadow: 0 10px 30px rgba(15, 23, 42, 0.18);
          }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <div class="title">${safeTitle}</div>
          <div class="actions">
            <button onclick="document.querySelector('iframe').contentWindow.print()">Print</button>
            <a href="${blobUrl}" download="${safeTitle}.pdf">Download</a>
          </div>
        </div>
        <div class="viewer-wrap">
          <iframe src="${blobUrl}"></iframe>
        </div>
      </body>
    </html>
  `);

  popup.document.close();
}

function buildPurchaseOrderPdf(po: PurchaseOrder) {
  const pdf = new jsPDF({
    unit: "pt",
    format: "a4",
    orientation: "portrait",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 36;
  const contentWidth = pageWidth - margin * 2;
  const right = pageWidth - margin;
  let y = 34;

  const items = sanitizeItems(po.items);
  const total = getTotal(items);

  const colors = {
    navy: [15, 23, 42] as const,
    slate: [71, 85, 105] as const,
    muted: [100, 116, 139] as const,
    lightText: [226, 232, 240] as const,
    border: [226, 232, 240] as const,
    band: [241, 245, 249] as const,
    soft: [248, 250, 252] as const,
    white: [255, 255, 255] as const,
  };

  function setTextColor(color: readonly [number, number, number]) {
    pdf.setTextColor(color[0], color[1], color[2]);
  }

  function setFillColor(color: readonly [number, number, number]) {
    pdf.setFillColor(color[0], color[1], color[2]);
  }

  function setDrawColor(color: readonly [number, number, number]) {
    pdf.setDrawColor(color[0], color[1], color[2]);
  }

  function textOrDash(value: any) {
    return safeText(value) || "-";
  }

  function checkPageSpace(requiredHeight: number) {
    if (y + requiredHeight > pageHeight - 58) {
      pdf.addPage();
      y = 36;
      drawPageTopLine();
    }
  }

  function drawPageTopLine() {
    setDrawColor(colors.border);
    pdf.line(margin, 26, right, 26);
  }

  function drawFooter() {
    const pageCount = pdf.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);

      setDrawColor(colors.border);
      pdf.line(margin, pageHeight - 34, right, pageHeight - 34);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      setTextColor(colors.muted);
      pdf.text(
        `Generated on ${formatDateDisplay(new Date().toISOString())}`,
        margin,
        pageHeight - 18,
      );
      pdf.text(`Page ${i} of ${pageCount}`, right, pageHeight - 18, {
        align: "right",
      });
    }
  }

  function drawSectionTitle(title: string) {
    checkPageSpace(34);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    setTextColor(colors.navy);
    pdf.text(title, margin, y);

    y += 9;

    setDrawColor(colors.border);
    pdf.line(margin, y, right, y);

    y += 16;
  }

  function drawSimpleInfoList(
    title: string,
    rows: Array<[string, any]>,
    columns = 2,
  ) {
    drawSectionTitle(title);

    const gap = 22;
    const cellWidth = (contentWidth - gap * (columns - 1)) / columns;
    const labelWidth = columns === 1 ? 116 : 84;
    const valueWidth = cellWidth - labelWidth - 10;
    const minRowHeight = 25;

    for (let i = 0; i < rows.length; i += columns) {
      const row = rows.slice(i, i + columns);

      const rowHeight = Math.max(
        minRowHeight,
        ...row.map(([, value]) => {
          const lines = pdf.splitTextToSize(textOrDash(value), valueWidth);
          return Math.max(minRowHeight, 12 + lines.length * 10);
        }),
      );

      checkPageSpace(rowHeight + 6);

      row.forEach(([label, value], index) => {
        const x = margin + index * (cellWidth + gap);
        const valueX = x + labelWidth;

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8.2);
        setTextColor(colors.muted);
        pdf.text(`${label}:`, x, y + 15);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9.2);
        setTextColor(colors.navy);

        const lines = pdf.splitTextToSize(textOrDash(value), valueWidth);
        pdf.text(lines, valueX, y + 15);
      });

      setDrawColor(colors.border);
      pdf.line(margin, y + rowHeight, right, y + rowHeight);

      y += rowHeight + 5;
    }

    y += 10;
  }

  function drawHeader() {
    setFillColor(colors.navy);
    pdf.roundedRect(margin, y, contentWidth, 94, 12, 12, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    setTextColor(colors.white);
    pdf.text("PURCHASE ORDER", margin + 22, y + 35);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    setTextColor(colors.lightText);
    pdf.text("iEDGE System", margin + 22, y + 57);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10.5);
    setTextColor(colors.white);
    pdf.text(textOrDash(po.poNumber), right - 22, y + 32, {
      align: "right",
    });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    setTextColor(colors.lightText);
    pdf.text(textOrDash(po.status), right - 22, y + 52, {
      align: "right",
    });

    y += 116;
  }

  function drawSummaryCards() {
    const gap = 12;
    const cardWidth = (contentWidth - gap * 3) / 4;
    const cardHeight = 68;

    const cards = [
      ["P.O.", po.poNumber || "-"],
      ["Date", formatDateDisplay(po.issueDate) || "-"],
      ["Due Date", formatDateDisplay(po.dueDate) || "-"],
      ["Total", `PKR ${formatNumber(total)}`],
    ];

    checkPageSpace(cardHeight + 22);

    cards.forEach(([label, value], index) => {
      const x = margin + index * (cardWidth + gap);

      setFillColor(colors.white);
      setDrawColor(colors.border);
      pdf.roundedRect(x, y, cardWidth, cardHeight, 10, 10, "FD");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      setTextColor(colors.muted);
      pdf.text(String(label).toUpperCase(), x + 10, y + 18);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(index === 3 ? 10 : 9);
      setTextColor(colors.navy);

      const lines = pdf.splitTextToSize(String(value), cardWidth - 20);
      pdf.text(lines.slice(0, 2), x + 10, y + 39);
    });

    y += cardHeight + 24;
  }

  function drawItemsHeader() {
    checkPageSpace(32);

    setFillColor(colors.band);
    setDrawColor(colors.border);
    pdf.roundedRect(margin, y, contentWidth, 30, 6, 6, "FD");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    setTextColor(colors.slate);

    pdf.text("#", margin + 12, y + 19);
    pdf.text("SERVICE", margin + 44, y + 19);
    pdf.text("QTY", right - 178, y + 19, { align: "right" });
    pdf.text("RATE", right - 94, y + 19, { align: "right" });
    pdf.text("AMOUNT", right - 10, y + 19, { align: "right" });

    y += 30;
  }

  function drawItemsTable() {
    drawSectionTitle("Items");

    if (!items.length) {
      checkPageSpace(44);

      setFillColor(colors.soft);
      setDrawColor(colors.border);
      pdf.roundedRect(margin, y, contentWidth, 42, 8, 8, "FD");

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      setTextColor(colors.muted);
      pdf.text("No items found.", margin + 12, y + 25);

      y += 54;
      return;
    }

    drawItemsHeader();

    items.forEach((item, index) => {
      const serviceLines = pdf.splitTextToSize(
        textOrDash(item.service),
        contentWidth - 280,
      );

      const rowHeight = Math.max(44, 18 + serviceLines.length * 11);

      if (y + rowHeight > pageHeight - 78) {
        pdf.addPage();
        y = 36;
        drawPageTopLine();
        drawItemsHeader();
      }

      setFillColor(index % 2 === 0 ? colors.white : colors.soft);
      setDrawColor(colors.border);
      pdf.rect(margin, y, contentWidth, rowHeight, "FD");

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      setTextColor(colors.navy);
      pdf.text(String(index + 1), margin + 12, y + 18);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.7);
      pdf.text(serviceLines, margin + 44, y + 18);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.text(textOrDash(item.qty), right - 178, y + 18, {
        align: "right",
      });
      pdf.text(formatNumber(safeNumber(item.rate)), right - 94, y + 18, {
        align: "right",
      });

      pdf.setFont("helvetica", "bold");
      pdf.text(formatNumber(safeNumber(item.amount)), right - 10, y + 18, {
        align: "right",
      });

      y += rowHeight;
    });

    y += 18;

    checkPageSpace(62);

    setFillColor(colors.navy);
    pdf.roundedRect(right - 220, y, 220, 44, 8, 8, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    setTextColor(colors.lightText);
    pdf.text("TOTAL", right - 204, y + 18);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    setTextColor(colors.white);
    pdf.text(`PKR ${formatNumber(total)}`, right - 16, y + 30, {
      align: "right",
    });

    y += 66;
  }

  function drawApprovalBox() {
    checkPageSpace(82);
    drawSectionTitle("Approval");

    const boxHeight = 64;

    setFillColor(colors.white);
    setDrawColor(colors.border);
    pdf.roundedRect(margin, y, contentWidth, boxHeight, 8, 8, "FD");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    setTextColor(colors.muted);
    pdf.text("APPROVED BY", margin + 14, y + 20);
    pdf.text("DATE", margin + contentWidth / 2 + 14, y + 20);

    setDrawColor(colors.muted);
    pdf.line(margin + 14, y + 46, margin + contentWidth / 2 - 18, y + 46);
    pdf.line(margin + contentWidth / 2 + 14, y + 46, right - 14, y + 46);

    y += boxHeight + 18;
  }

  drawHeader();
  drawSummaryCards();

  drawSimpleInfoList(
    "Supplier Details",
    [
      ["Supplier Name", po.supplierName || "-"],
      ["Supplier Address", po.supplierAddress || po.supplierName || "-"],
    ],
    1,
  );

  drawSimpleInfoList(
    "Reference Details",
    [
      ["Estimate Number", po.estimateNumber || "-"],
      ["Status", po.status || "-"],
      ["Payment Status", getPOPaymentLabel(po)],
      ["Released Amount", `PKR ${formatNumber(getTotalReleasedAmount(po))}`],
      ["Remaining Amount", `PKR ${formatNumber(getPORemainingAmount(po))}`],
      [
        "Source",
        po.source === "budget_request"
          ? "Budget Request"
          : po.source || "Manual",
      ],
      ["Budget Request ID", po.sourceRequestId || po.sourceInvoiceId || "-"],
      ["Project", po.sourceProjectName || "-"],
      ["Client", po.sourceClientName || "-"],
      ["Notes", po.notes || "-"],
    ],
    2,
  );

  drawItemsTable();
  drawApprovalBox();
  drawFooter();

  return pdf;
}

function PurchaseOrderView({ po }: { po: PurchaseOrder }) {
  const paymentHistory = getPaymentReleaseHistory(po);
  const releasedAmount = getTotalReleasedAmount(po);
  const remainingAmount = getPORemainingAmount(po);

  return (
    <div className="space-y-5 text-sm">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-muted-foreground">P.O.</p>
          <p className="font-semibold">{po.poNumber}</p>
        </div>

        <div>
          <p className="text-muted-foreground">Status</p>
          <Badge variant={getStatusBadgeVariant(po.status)}>{po.status}</Badge>
        </div>

        <div>
          <p className="text-muted-foreground">Estimate Number</p>
          <p className="font-medium">{po.estimateNumber || "-"}</p>
        </div>

        <div>
          <p className="text-muted-foreground">Supplier</p>
          <p className="font-medium whitespace-pre-line">
            {po.supplierAddress || po.supplierName}
          </p>
        </div>

        <div>
          <p className="text-muted-foreground">Date</p>
          <p className="font-medium">{formatDateDisplay(po.issueDate)}</p>
        </div>

        <div>
          <p className="text-muted-foreground">Payment</p>
          <div>
            <StatusPill tone={getPOPaymentTone(po)}>
              {getPOPaymentLabel(po)}
            </StatusPill>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {po.items.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="whitespace-pre-line">
                  {item.service || "-"}
                </TableCell>
                <TableCell className="text-right">{item.qty || "-"}</TableCell>
                <TableCell className="text-right">
                  {formatNumber(safeNumber(item.rate))}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(safeNumber(item.amount))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border p-4 bg-muted/30">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            PO Total
          </p>
          <p className="mt-1 font-semibold">{formatCurrency(po.totalAmount)}</p>
        </div>

        <div className="rounded-2xl border p-4 bg-muted/30">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Released
          </p>
          <p className="mt-1 font-semibold">{formatCurrency(releasedAmount)}</p>
        </div>

        <div className="rounded-2xl border p-4 bg-muted/30">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Remaining
          </p>
          <p className="mt-1 font-semibold">
            {formatCurrency(remainingAmount)}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="font-semibold">Payment Release History</h3>
          <p className="text-xs text-muted-foreground">
            All advance, partial, and final payments recorded against this PO.
          </p>
        </div>

        <div className="rounded-2xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Transaction</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paymentHistory.length > 0 ? (
                [...paymentHistory].reverse().map((entry, index) => (
                  <TableRow key={entry?.id || index}>
                    <TableCell>
                      {formatReleaseDate(entry?.releasedAt)}
                    </TableCell>
                    <TableCell>
                      {getPaymentMethodLabel(entry?.paymentMethod)}
                    </TableCell>
                    <TableCell>{entry?.transactionName || "-"}</TableCell>
                    <TableCell>
                      {entry?.transactionReference ||
                        entry?.chequeNumber ||
                        "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(getPaymentReleaseAmount(entry))}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-6 text-center text-muted-foreground"
                  >
                    No payment has been released for this purchase order.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default function POManagementPage() {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [, navigate] = useLocation();

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<POStatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);
  const [paymentReleaseOpen, setPaymentReleaseOpen] = useState(false);
  const [paymentReleasePO, setPaymentReleasePO] =
    useState<PurchaseOrder | null>(null);
  const [rejectionOpen, setRejectionOpen] = useState(false);
  const [rejectionPO, setRejectionPO] = useState<PurchaseOrder | null>(null);
  const [rejectionLoading, setRejectionLoading] = useState(false);
  const [deletingPO, setDeletingPO] = useState<PurchaseOrder | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { data: workflowConfigs = [] } = useFirestoreQuery<any>(
    `Panels/${PANEL_ID}/workflowConfigs`,
  );
  const { data: roleConfigs = [] } = useFirestoreQuery<any>(
    `Panels/${PANEL_ID}/sidebarConfig`,
  );
  const { data: panelUsers = [] } = useFirestoreQuery<any>(
    `Panels/${PANEL_ID}/users`,
  );
  const { data: globalUsers = [] } = useFirestoreQuery<any>("users");

  const workflowRepairSignaturesRef = useRef<Map<string, string>>(new Map());

  const allUsers = useMemo(
    () => [...(globalUsers || []), ...(panelUsers || [])],
    [globalUsers, panelUsers],
  );

  const effectiveUser = useMemo(() => {
    const lookupValues = [
      userProfile?.id,
      (userProfile as any)?.uid,
      (userProfile as any)?.userId,
      (userProfile as any)?.firebaseUid,
      userProfile?.email,
    ]
      .map((value) =>
        String(value || "")
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean);

    const matchedUser = allUsers.find((user: any) =>
      [user?.id, user?.uid, user?.userId, user?.firebaseUid, user?.email]
        .map((value) =>
          String(value || "")
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean)
        .some((value) => lookupValues.includes(value)),
    );

    return {
      ...(matchedUser || {}),
      ...(userProfile || {}),
      id:
        userProfile?.id ||
        (userProfile as any)?.uid ||
        matchedUser?.id ||
        matchedUser?.uid ||
        "",
      uid:
        (userProfile as any)?.uid ||
        userProfile?.id ||
        matchedUser?.uid ||
        matchedUser?.id ||
        "",
      role: userProfile?.role || matchedUser?.role || "",
      designation:
        (userProfile as any)?.designation || matchedUser?.designation || "",
      department:
        (userProfile as any)?.department || matchedUser?.department || "",
      purchaseOrderVisibility:
        (userProfile as any)?.purchaseOrderVisibility ??
        matchedUser?.purchaseOrderVisibility,
      canViewAllPurchaseOrders:
        (userProfile as any)?.canViewAllPurchaseOrders ??
        matchedUser?.canViewAllPurchaseOrders,
    };
  }, [allUsers, userProfile]);

  const workflowRoleResolutionContext = useMemo(
    () => ({ roles: roleConfigs || [], users: allUsers }),
    [roleConfigs, allUsers],
  );

  const purchaseOrderWorkflowConfig =
    useMemo<BudgetApprovalWorkflowConfig | null>(() => {
      const config = (workflowConfigs || []).find(
        (item: any) => item?.id === PURCHASE_ORDER_WORKFLOW_CONFIG_ID,
      );

      if (!config) return null;

      return {
        ...config,
        module: "purchase_orders",
        enabled: config.enabled !== false,
        version: Number(config.version || 1),
        levels: enrichApprovalLevelsWithRoleMetadata(
          config.levels || [],
          roleConfigs || [],
          allUsers,
        ),
      } as any;
    }, [workflowConfigs, roleConfigs, allUsers]);

  const hasPurchaseOrderAccess = canAccessPurchaseOrders(
    effectiveUser,
    roleConfigs,
  );
  const isFinanceUser = isFinancePurchaseOrderRole(effectiveUser?.role);
  const isAdminUser = isPurchaseOrderAdminRole(effectiveUser?.role);
  const userCanViewAllPurchaseOrders = canViewAllPurchaseOrders(effectiveUser);

  const visiblePurchaseOrders = useMemo(() => {
    if (userCanViewAllPurchaseOrders) return purchaseOrders;

    return purchaseOrders.filter(
      (po) =>
        isPurchaseOrderOwnedByUser(po, effectiveUser) ||
        isPurchaseOrderAssignedToUser(po, effectiveUser),
    );
  }, [purchaseOrders, effectiveUser, userCanViewAllPurchaseOrders]);

  useEffect(() => {
    if (localStorage.getItem("createPOFromBudgetRequest")) {
      navigate(CREATE_PO_ROUTE);
    }
  }, [navigate]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(poCollectionRef, orderBy("createdAt", "desc")),
      (snapshot) => {
        const rows: PurchaseOrder[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Omit<PurchaseOrder, "id">;
          const items = sanitizeItems(asArray(data.items));
          const totalAmount = safeNumber(data.totalAmount, getTotal(items));
          const storedStatus = getStoredPOStatus(data);

          const status = isOverDue({
            dueDate: data.dueDate,
            status: storedStatus,
          })
            ? "Over Due"
            : storedStatus;

          return {
            id: docSnap.id,
            ...data,
            items,
            totalAmount,
            status,
          };
        });

        setPurchaseOrders(rows);
      },
      (error) => {
        console.error("Error loading purchase orders:", error);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (
      !purchaseOrderWorkflowConfig ||
      purchaseOrderWorkflowConfig.enabled === false ||
      purchaseOrderWorkflowConfig.levels.length === 0 ||
      roleConfigs.length === 0
    ) {
      return;
    }

    const initializeOrRepairPurchaseOrders = async () => {
      for (const po of visiblePurchaseOrders) {
        if (!po.id || po.status === "Paid" || po.status === "Cancelled") {
          continue;
        }

        // Never reset a completed approval back to pending: that would take the
        // PO out of Finance's reach for payment release.
        if (isPurchaseOrderFinallyApproved(po)) continue;

        const existingWorkflow = po.approvalWorkflow;
        const workflowState = normalizeText(existingWorkflow?.state);

        if (workflowState === "approved" || workflowState === "returned") {
          continue;
        }

        const hasWorkflow = Boolean(
          existingWorkflow &&
            Array.isArray(existingWorkflow?.levels) &&
            existingWorkflow.levels.length > 0,
        );

        const snapshot = hasWorkflow
          ? {
              ...existingWorkflow,
              levels: enrichApprovalLevelsWithRoleMetadata(
                existingWorkflow.levels || [],
                workflowRoleResolutionContext.roles,
                workflowRoleResolutionContext.users,
              ),
              currentLevelIndex: Number(
                existingWorkflow?.currentLevelIndex || 0,
              ),
              state: "pending" as const,
            }
          : createWorkflowSnapshot(purchaseOrderWorkflowConfig);

        const currentLevelIndex = Number(snapshot.currentLevelIndex || 0);
        const pendingFields = getPOPendingApprovalFields(
          snapshot,
          currentLevelIndex,
        );
        const resolvedPO = { ...po, ...pendingFields };
        const currentApproverLabel = getCurrentApproverRoleLabel(
          resolvedPO,
          workflowRoleResolutionContext,
        );
        const resolvedPendingFields = {
          ...pendingFields,
          currentApprover:
            currentApproverLabel || pendingFields.currentApprover || "",
        };

        const signature = JSON.stringify({
          state: snapshot.state,
          currentLevelIndex,
          userIds: resolvedPendingFields.currentApproverUserIds || [],
          roleIds: resolvedPendingFields.currentApproverRoleIds || [],
          roleNames: resolvedPendingFields.currentApproverRoleNames || [],
          currentApprover: resolvedPendingFields.currentApprover || "",
        });

        if (workflowRepairSignaturesRef.current.get(po.id) === signature) {
          continue;
        }

        const existingSignature = JSON.stringify({
          state: po.approvalWorkflow?.state,
          currentLevelIndex: Number(
            po.approvalWorkflow?.currentLevelIndex || 0,
          ),
          userIds: po.currentApproverUserIds || [],
          roleIds: po.currentApproverRoleIds || [],
          roleNames: po.currentApproverRoleNames || [],
          currentApprover: po.currentApprover || "",
        });

        if (
          existingSignature === signature &&
          po.approvalStatus === "pending"
        ) {
          continue;
        }

        workflowRepairSignaturesRef.current.set(po.id, signature);

        try {
          await updateDoc(doc(db, "Panels", PANEL_ID, "PO", po.id), {
            ...resolvedPendingFields,
            approvalStatus: "pending",
            workflowInitializedAt:
              (po as any)?.workflowInitializedAt || serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          workflowRepairSignaturesRef.current.delete(po.id);
          console.error(
            "Failed to initialize or repair Purchase Order workflow:",
            error,
          );
        }
      }
    };

    void initializeOrRepairPurchaseOrders();
  }, [
    purchaseOrderWorkflowConfig,
    visiblePurchaseOrders,
    roleConfigs,
    workflowRoleResolutionContext,
  ]);

  const totals = useMemo(() => {
    const sumOf = (items: PurchaseOrder[]) =>
      items.reduce((sum, item) => sum + safeNumber(item.totalAmount), 0);

    const overDue = visiblePurchaseOrders.filter(
      (item) => item.status === "Over Due",
    );
    const open = visiblePurchaseOrders.filter(
      (item) => item.status === "Open" || item.status === "Draft",
    );
    const paid = visiblePurchaseOrders.filter((item) => item.status === "Paid");

    return {
      totalPayable: sumOf(visiblePurchaseOrders),
      totalCount: visiblePurchaseOrders.length,
      overDue: sumOf(overDue),
      overDueCount: overDue.length,
      open: sumOf(open),
      openCount: open.length,
      paid: sumOf(paid),
      paidCount: paid.length,
    };
  }, [visiblePurchaseOrders]);

  const statusCounts = useMemo(() => {
    const counts: Record<POStatusFilter, number> = {
      all: visiblePurchaseOrders.length,
      Draft: 0,
      Open: 0,
      "Over Due": 0,
      Paid: 0,
      Cancelled: 0,
    };

    visiblePurchaseOrders.forEach((po) => {
      if (po.status in counts) counts[po.status] += 1;
    });

    return counts;
  }, [visiblePurchaseOrders]);

  const filteredPurchaseOrders = useMemo(() => {
    const search = normalizeText(searchTerm);
    const byStatus =
      statusFilter === "all"
        ? visiblePurchaseOrders
        : visiblePurchaseOrders.filter((po) => po.status === statusFilter);

    if (!search) return byStatus;

    return byStatus.filter((po) => {
      const approvalText = normalizeText(
        po.approvalWorkflow?.state || po.approvalStatus,
      );
      const haystack = normalizeText(
        [
          po.poNumber,
          po.estimateNumber,
          po.supplierName,
          po.supplierAddress,
          po.issueDate,
          po.dueDate,
          po.status,
          po.totalAmount,
          po.source,
          po.sourceRequestId,
          po.sourceInvoiceId,
          po.sourceProjectName,
          po.sourceClientName,
          getPOPaymentLabel(po),
          approvalText,
          po.currentApprover,
          ...(po.currentApproverRoleNames || []),
        ].join(" "),
      );

      return haystack.includes(search);
    });
  }, [visiblePurchaseOrders, searchTerm, statusFilter]);

  const totalPages =
    Math.ceil(filteredPurchaseOrders.length / PO_RECORDS_PER_PAGE) || 1;

  const paginatedPurchaseOrders = useMemo(
    () =>
      filteredPurchaseOrders.slice(
        (currentPage - 1) * PO_RECORDS_PER_PAGE,
        currentPage * PO_RECORDS_PER_PAGE,
      ),
    [filteredPurchaseOrders, currentPage],
  );

  const pageStart =
    filteredPurchaseOrders.length === 0
      ? 0
      : (currentPage - 1) * PO_RECORDS_PER_PAGE + 1;
  const pageEnd = Math.min(
    currentPage * PO_RECORDS_PER_PAGE,
    filteredPurchaseOrders.length,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Stay on a real page when rows disappear (e.g. after a delete).
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const getPOWithResolvedWorkflow = (po: PurchaseOrder) => ({
    ...po,
    approvalWorkflow: po.approvalWorkflow
      ? {
          ...po.approvalWorkflow,
          levels: enrichApprovalLevelsWithRoleMetadata(
            po.approvalWorkflow.levels || [],
            workflowRoleResolutionContext.roles,
            workflowRoleResolutionContext.users,
          ),
        }
      : po.approvalWorkflow,
  });

  const isPOApprovalRequired = () =>
    Boolean(
      purchaseOrderWorkflowConfig &&
        purchaseOrderWorkflowConfig.enabled !== false &&
        purchaseOrderWorkflowConfig.levels.length > 0,
    );

  const isPOApproved = (po: PurchaseOrder) => {
    if (!isPOApprovalRequired()) return true;

    return Boolean(
      normalizeText(po.approvalStatus) === "approved" ||
        normalizeText(po.approvalWorkflow?.state) === "approved",
    );
  };

  const getPOApprovalLabel = (po: PurchaseOrder) => {
    if (!isPOApprovalRequired()) return "Not Required";

    const state = normalizeText(
      po.approvalWorkflow?.state || po.approvalStatus,
    );

    if (state === "approved") return "Approved";
    if (state === "returned" || state === "rejected") return "Returned";

    return (
      getCurrentApproverRoleLabel(
        getPOWithResolvedWorkflow(po),
        workflowRoleResolutionContext,
      ) ||
      po.currentApprover ||
      "Pending Approval"
    );
  };

  const getPOApprovalTone = (po: PurchaseOrder): PillTone => {
    if (!isPOApprovalRequired()) return "neutral";
    if (isPOApproved(po)) return "success";

    const state = normalizeText(
      po.approvalWorkflow?.state || po.approvalStatus,
    );
    if (state === "returned" || state === "rejected") return "danger";

    return "warning";
  };

  const canApprovePO = (po: PurchaseOrder) => {
    if (!hasPurchaseOrderAccess || !isPOApprovalRequired()) return false;
    if (isPOApproved(po)) return false;

    const state = normalizeText(
      po.approvalWorkflow?.state || po.approvalStatus,
    );
    if (state === "returned" || state === "rejected") return false;

    // Not isCurrentRequestApprover: it also requires status "pending_approval",
    // which POs never store (they keep Draft/Open), so it always returned false.
    const resolvedPO = getPOWithResolvedWorkflow(po);
    if (normalizeText(resolvedPO.approvalWorkflow?.state) !== "pending") {
      return false;
    }

    return isUserAssignedToApprovalLevel(
      getCurrentApprovalLevel(resolvedPO),
      effectiveUser,
    );
  };

  const clearCreatePOTransferState = () => {
    localStorage.removeItem("createPOEditData");
    localStorage.removeItem("createPODuplicateData");
    localStorage.removeItem("createPOFromBudgetRequest");
  };

  const buildPOTransferPayload = (po: PurchaseOrder) => {
    const items = sanitizeItems(asArray(po.items));

    return {
      ...po,
      id: po.id,
      purchaseOrderId: po.id,
      editMode: true,
      items,
      totalAmount: safeNumber(po.totalAmount, getTotal(items)),
    };
  };

  const handleCreatePO = () => {
    clearCreatePOTransferState();
    navigate(CREATE_PO_ROUTE);
  };

  // Any non-Admin user can edit a PO they can see, until it is approved.
  // Admins manage POs through Delete instead.
  const canEditPO = (po: PurchaseOrder) =>
    !isAdminUser && !getPurchaseOrderEditLockReason(po);

  const handleEditPO = (po: PurchaseOrder) => {
    if (isAdminUser) {
      toast({
        title: "Edit not allowed",
        description: "Admin users cannot edit Purchase Orders.",
        variant: "destructive",
      });
      return;
    }

    const lockReason = getPurchaseOrderEditLockReason(po);

    if (lockReason) {
      toast({
        title: "Edit not allowed",
        description: lockReason,
        variant: "destructive",
      });
      return;
    }

    const editPayload = buildPOTransferPayload(po);

    localStorage.setItem("createPOEditData", JSON.stringify(editPayload));
    localStorage.removeItem("createPODuplicateData");
    localStorage.removeItem("createPOFromBudgetRequest");

    navigate(`${CREATE_PO_ROUTE}?edit=${encodeURIComponent(po.id)}`);
  };

  const handleDuplicatePO = (po: PurchaseOrder) => {
    const duplicatePayload = buildPOTransferPayload(po);

    delete (duplicatePayload as any).id;
    delete (duplicatePayload as any).purchaseOrderId;
    delete (duplicatePayload as any).editMode;

    [
      "paymentStatus",
      "paymentReleased",
      "paymentPartiallyReleased",
      "totalApprovedAmount",
      "totalReleasedAmount",
      "remainingReleaseAmount",
      "transactionName",
      "latestTransactionName",
      "latestPaymentRelease",
      "paymentDetails",
      "paymentReleaseHistory",
      "paymentReleasedAt",
      "partialPaymentReleasedAt",
      "releasePaymentAt",
      "paymentFullyReleasedAt",
      "releasePaymentCreated",
    ].forEach((field) => delete (duplicatePayload as any)[field]);

    (duplicatePayload as any).status = "Draft";

    localStorage.setItem(
      "createPODuplicateData",
      JSON.stringify(duplicatePayload),
    );
    localStorage.removeItem("createPOEditData");
    localStorage.removeItem("createPOFromBudgetRequest");

    navigate(CREATE_PO_ROUTE);
  };

  const handleViewPO = (po: PurchaseOrder) => {
    setViewingPO(po);
    setViewDialogOpen(true);
  };

  const handleDeletePO = async () => {
    if (!deletingPO) return;

    if (!isAdminUser) {
      toast({
        title: "Delete not allowed",
        description: "Only Admin users can delete a Purchase Order.",
        variant: "destructive",
      });
      return;
    }

    const po = deletingPO;

    try {
      setDeleteLoading(true);

      const batch = writeBatch(db);
      batch.delete(doc(db, "Panels", PANEL_ID, "PO", po.id));

      // A PO created from a Budget Request marks that request as having a PO.
      // Clear the link so the request can get a new PO, but only if the
      // request still points at this PO.
      if (po.source === "budget_request" && po.sourceInvoiceId) {
        const requestRef = doc(
          db,
          "Panels",
          PANEL_ID,
          "invoiceRequests",
          po.sourceInvoiceId,
        );
        const requestSnap = await getDoc(requestRef);

        if (requestSnap.exists() && requestSnap.data()?.poId === po.id) {
          batch.update(requestRef, {
            poCreated: false,
            poSubmitted: false,
            poId: deleteField(),
            poNumber: deleteField(),
            poSubmittedAt: deleteField(),
            updatedAt: serverTimestamp(),
          });
        }
      }

      await batch.commit();

      toast({
        title: "Purchase Order deleted",
        description: `${po.poNumber || "The Purchase Order"} was deleted.`,
      });

      if (viewingPO?.id === po.id) {
        setViewDialogOpen(false);
        setViewingPO(null);
      }

      setDeletingPO(null);
    } catch (error: any) {
      console.error("Failed to delete Purchase Order:", error);
      toast({
        title: "Delete failed",
        description: error?.message || "Could not delete the Purchase Order.",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const getCurrentUserId = () =>
    String(
      effectiveUser?.id ||
        effectiveUser?.uid ||
        effectiveUser?.userId ||
        effectiveUser?.email ||
        "",
    ).trim();

  const handleApprovePO = async (po: PurchaseOrder) => {
    const resolvedPO = getPOWithResolvedWorkflow(po);
    const workflow = resolvedPO.approvalWorkflow;
    const levels = Array.isArray(workflow?.levels) ? workflow.levels : [];
    const currentLevelIndex = Number(workflow?.currentLevelIndex || 0);
    const currentLevel = getCurrentApprovalLevel(resolvedPO);

    if (!currentLevel || !canApprovePO(resolvedPO)) {
      toast({
        title: "Action not allowed",
        description:
          "This Purchase Order is not assigned to you at the current approval level.",
        variant: "destructive",
      });
      return;
    }

    const approvalHistory = Array.isArray(po.approvalHistory)
      ? po.approvalHistory
      : [];
    const approverId = getCurrentUserId();
    const approverName =
      effectiveUser?.displayName ||
      effectiveUser?.name ||
      effectiveUser?.email ||
      approverId;
    const nextLevelIndex = currentLevelIndex + 1;
    const hasNextLevel = nextLevelIndex < levels.length;

    const updatePayload: Record<string, any> = {
      approvalHistory: [
        ...approvalHistory,
        {
          approver: approverName,
          approverId,
          approverRole: getRoleKey(effectiveUser?.role),
          action: "approved",
          levelId: currentLevel.id,
          levelName: currentLevel.name,
          levelNumber: currentLevelIndex + 1,
          timestamp: new Date(),
          notes: "",
        },
      ],
      rejectionComment: "",
      updatedAt: serverTimestamp(),
    };

    if (hasNextLevel) {
      Object.assign(
        updatePayload,
        getPOPendingApprovalFields(
          {
            ...workflow,
            levels,
            state: "pending",
          },
          nextLevelIndex,
        ),
        { approvalStatus: "pending" },
      );
    } else {
      Object.assign(updatePayload, {
        // "Over Due" is only worked out for display; it's never stored.
        status:
          po.status === "Draft" || po.status === "Over Due"
            ? "Open"
            : po.status,
        approvalStatus: "approved",
        approvalWorkflow: {
          ...workflow,
          levels,
          currentLevelIndex,
          state: "approved",
          completedAt: new Date(),
        },
        currentApprovalLevel: levels.length,
        currentApprovalLevelId: "",
        currentApprovalLevelName: "",
        currentApproverUserIds: [],
        currentApproverRoleIds: [],
        currentApproverRoleNames: [],
        currentApprover: "",
        approvedAt: serverTimestamp(),
        approvedBy: approverName,
        approvedById: approverId,
      });
    }

    try {
      await updateDoc(doc(db, "Panels", PANEL_ID, "PO", po.id), updatePayload);

      toast({
        title: hasNextLevel ? "Approval recorded" : "Purchase Order approved",
        description: hasNextLevel
          ? "The Purchase Order moved to the next approval level."
          : "The final approval level has been completed.",
      });
    } catch (error: any) {
      console.error("Failed to approve Purchase Order:", error);
      toast({
        title: "Approval failed",
        description: error.message || "Could not approve the Purchase Order.",
        variant: "destructive",
      });
    }
  };

  const openRejectPO = (po: PurchaseOrder) => {
    if (!canApprovePO(po)) {
      toast({
        title: "Action not allowed",
        description:
          "This Purchase Order is not assigned to you at the current approval level.",
        variant: "destructive",
      });
      return;
    }

    setRejectionPO(po);
    setRejectionOpen(true);
  };

  const handleRejectPO = async (comment: string) => {
    if (!rejectionPO) return;

    const resolvedPO = getPOWithResolvedWorkflow(rejectionPO);
    const currentLevel = getCurrentApprovalLevel(resolvedPO);
    if (!currentLevel || !canApprovePO(resolvedPO)) return;

    const approvalHistory = Array.isArray(rejectionPO.approvalHistory)
      ? rejectionPO.approvalHistory
      : [];
    const workflow = resolvedPO.approvalWorkflow || {};
    const currentLevelIndex = Number(workflow?.currentLevelIndex || 0);
    const approverId = getCurrentUserId();
    const approverName =
      effectiveUser?.displayName ||
      effectiveUser?.name ||
      effectiveUser?.email ||
      approverId;

    setRejectionLoading(true);

    try {
      await updateDoc(doc(db, "Panels", PANEL_ID, "PO", rejectionPO.id), {
        status: "Draft",
        approvalStatus: "rejected",
        approvalWorkflow: {
          ...workflow,
          state: "returned",
        },
        currentApprovalLevel: currentLevelIndex + 1,
        currentApprovalLevelId: "",
        currentApprovalLevelName: "",
        currentApproverUserIds: [],
        currentApproverRoleIds: [],
        currentApproverRoleNames: [],
        currentApprover: "",
        rejectionComment: comment,
        rejectedAt: serverTimestamp(),
        rejectedBy: approverName,
        rejectedById: approverId,
        approvalHistory: [
          ...approvalHistory,
          {
            approver: approverName,
            approverId,
            approverRole: getRoleKey(effectiveUser?.role),
            action: "rejected",
            levelId: currentLevel.id,
            levelName: currentLevel.name,
            levelNumber: currentLevelIndex + 1,
            timestamp: new Date(),
            notes: comment,
          },
        ],
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Purchase Order returned",
        description: "The Purchase Order was returned for correction.",
      });
      setRejectionOpen(false);
      setRejectionPO(null);
    } catch (error: any) {
      console.error("Failed to reject Purchase Order:", error);
      toast({
        title: "Return failed",
        description: error.message || "Could not return the Purchase Order.",
        variant: "destructive",
      });
    } finally {
      setRejectionLoading(false);
    }
  };

  const handleResubmitPO = async (po: PurchaseOrder) => {
    if (!purchaseOrderWorkflowConfig) return;

    const existingWorkflow = po.approvalWorkflow;
    const snapshot =
      existingWorkflow && Array.isArray(existingWorkflow?.levels)
        ? {
            ...existingWorkflow,
            levels: enrichApprovalLevelsWithRoleMetadata(
              existingWorkflow.levels,
              workflowRoleResolutionContext.roles,
              workflowRoleResolutionContext.users,
            ),
            currentLevelIndex: 0,
            state: "pending" as const,
          }
        : createWorkflowSnapshot(purchaseOrderWorkflowConfig);

    try {
      await updateDoc(doc(db, "Panels", PANEL_ID, "PO", po.id), {
        ...getPOPendingApprovalFields(snapshot, 0),
        status: "Draft",
        approvalStatus: "pending",
        rejectionComment: "",
        resubmittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Purchase Order resubmitted",
        description: "The approval workflow has restarted from level one.",
      });
    } catch (error: any) {
      toast({
        title: "Resubmission failed",
        description: error.message || "Could not resubmit the Purchase Order.",
        variant: "destructive",
      });
    }
  };

  const handleOpenPaymentRelease = (po: PurchaseOrder) => {
    const remainingAmount = getPORemainingAmount(po);

    if (!isFinanceUser) {
      toast({
        title: "Finance access required",
        description: "Only Finance users can release Purchase Order payments.",
        variant: "destructive",
      });
      return;
    }

    if (!isPOApproved(po)) {
      toast({
        title: "Approval required",
        description:
          "Complete the Purchase Order approval workflow before releasing payment.",
        variant: "destructive",
      });
      return;
    }

    if (po.status === "Cancelled") {
      toast({
        title: "Payment unavailable",
        description:
          "Payment cannot be released for a cancelled purchase order.",
        variant: "destructive",
      });
      return;
    }

    if (isPOPaymentCompleted(po) || remainingAmount <= 0.009) {
      toast({
        title: "Payment already released",
        description:
          "The complete purchase order amount has already been released.",
      });
      return;
    }

    setPaymentReleasePO(po);
    setPaymentReleaseOpen(true);
  };

  const handleClosePaymentRelease = () => {
    setPaymentReleaseOpen(false);
    setPaymentReleasePO(null);
  };

  const buildPOPaymentUpdateData = (
    args: PaymentReleaseSubmitArgs<PurchaseOrder>,
  ): Record<string, any> => {
    const sourceRecord = args.context || ({} as PurchaseOrder);
    const formData = args.formData as any;
    const releaseAmount = roundMoney(formData.amount);
    const approvedAmount = getPOApprovedAmount(sourceRecord);
    const existingHistory = getPaymentReleaseHistory(sourceRecord);
    const releasedBefore = roundMoney(
      existingHistory.reduce(
        (sum, entry) => sum + getPaymentReleaseAmount(entry),
        0,
      ),
    );
    const releasedAfter = roundMoney(releasedBefore + releaseAmount);
    const remainingAfter = roundMoney(
      Math.max(approvedAmount - releasedAfter, 0),
    );
    const isFullyReleased = approvedAmount > 0 && remainingAfter <= 0.009;

    const chequeNumbers = Array.isArray(formData.chequeNumbers)
      ? formData.chequeNumbers
          .map((value: any) => String(value || "").trim())
          .filter(Boolean)
      : formData.chequeNumber
        ? [String(formData.chequeNumber).trim()]
        : [];

    const receiptUrls = Array.isArray((args as any).receiptUrls)
      ? (args as any).receiptUrls
      : args.receiptUrl
        ? [args.receiptUrl]
        : [];

    // The release date chosen on the form.
    const releasedAt = paymentMomentFor(formData.paymentDate);

    const releaseEntry: Record<string, any> = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      releaseType:
        releasedBefore <= 0
          ? isFullyReleased
            ? "full"
            : "advance"
          : isFullyReleased
            ? "final"
            : "partial",
      paymentMethod: formData.paymentMethod,
      amount: releaseAmount,
      approvedAmount,
      releasedBefore,
      releasedAfter,
      remainingAfter,
      supplierName: sourceRecord.supplierName || "",
      parties: sourceRecord.supplierName ? [sourceRecord.supplierName] : [],
      transactionName: String(formData.transactionName || "").trim(),
      transactionReference: String(formData.transactionReference || "").trim(),
      paymentNotes: String(formData.paymentNotes || "").trim(),
      bankReceiptUrl: receiptUrls[0] || args.receiptUrl || "",
      bankReceiptUrls: receiptUrls,
      releasedBy: args.actor.profileId || args.actor.uid || "",
      releasedByName: args.actor.displayName || args.actor.email || "Unknown",
      releasedByEmail: args.actor.email || "",
      releasedAt,
      paymentDate: formData.paymentDate,
      recordedAt: new Date(),
      sourceType: "purchase_order",
      sourceId: sourceRecord.id,
      poNumber: sourceRecord.poNumber || "",
    };

    if (chequeNumbers.length > 0) {
      releaseEntry.chequeNumber = chequeNumbers[0];
      releaseEntry.chequeNumbers = chequeNumbers;
    }

    if (args.selectedAccount) {
      releaseEntry.selectedAccount = args.selectedAccount;
      releaseEntry.selectedAccountId = args.selectedAccount.id || "";
      releaseEntry.selectedAccountName = args.selectedAccount.accountName || "";
    }

    const currentStoredStatus =
      sourceRecord.status === "Over Due"
        ? "Open"
        : sourceRecord.status || "Open";

    const nextStatus: PurchaseOrderStatus = isFullyReleased
      ? "Paid"
      : currentStoredStatus === "Draft" || currentStoredStatus === "Paid"
        ? "Open"
        : (currentStoredStatus as PurchaseOrderStatus);

    const updateData: Record<string, any> = {
      status: nextStatus,
      paymentStatus: isFullyReleased ? "released" : "partial",
      paymentReleased: isFullyReleased,
      paymentPartiallyReleased: !isFullyReleased,
      releasePaymentCreated: true,
      totalApprovedAmount: approvedAmount,
      totalReleasedAmount: releasedAfter,
      remainingReleaseAmount: remainingAfter,
      transactionName: releaseEntry.transactionName,
      latestTransactionName: releaseEntry.transactionName,
      latestPaymentRelease: releaseEntry,
      paymentDetails: releaseEntry,
      paymentReleaseHistory: [...existingHistory, releaseEntry],
      updatedAt: serverTimestamp(),
    };

    if (isFullyReleased) {
      updateData.paymentReleasedAt = releasedAt;
      updateData.releasePaymentAt = releasedAt;
      updateData.paymentFullyReleasedAt = releasedAt;
    } else {
      updateData.partialPaymentReleasedAt = releasedAt;
    }

    return updateData;
  };

  const handleStatusChange = async (
    po: PurchaseOrder,
    status: PurchaseOrderStatus,
  ) => {
    if (!isPOApproved(po)) {
      toast({
        title: "Approval required",
        description:
          "Complete the Purchase Order approval workflow before changing its operational status.",
        variant: "destructive",
      });
      return;
    }

    if (status === "Paid" && getPORemainingAmount(po) > 0.009) {
      toast({
        title: "Release payment first",
        description:
          "Use the Payment Release option. The PO will be marked Paid automatically after the full amount is released.",
      });

      handleOpenPaymentRelease(po);
      return;
    }

    try {
      await updateDoc(doc(db, "Panels", PANEL_ID, "PO", po.id), {
        status,
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Status updated",
        description: "Purchase order status updated.",
      });
    } catch (error) {
      console.error("Error updating status:", error);

      toast({
        title: "Update failed",
        description: "Could not update status.",
        variant: "destructive",
      });
    }
  };

  const handleGeneratePOPdf = (po: PurchaseOrder) => {
    try {
      const pdf = buildPurchaseOrderPdf(po);
      const blob = pdf.output("blob");

      openPdfInCenteredPopup(blob, po.poNumber || "Purchase Order");
    } catch (error) {
      console.error("Error generating PDF:", error);

      toast({
        title: "PDF failed",
        description: "Could not generate purchase order PDF.",
        variant: "destructive",
      });
    }
  };

  if (!hasPurchaseOrderAccess) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 p-6">
        <Card className="w-full max-w-lg rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-xl font-bold text-slate-950">
              Purchase Order access restricted
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Your role does not currently include the Purchase Orders module. A
              main administrator can enable it from User Management.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Purchase Orders
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {userCanViewAllPurchaseOrders
              ? "All purchase orders, including those created by other users."
              : "Purchase orders you created or that are waiting for your approval."}
          </p>
        </div>

        <Button className="h-10 rounded-xl px-4" onClick={handleCreatePO}>
          <Plus className="mr-2 h-4 w-4" />
          Create PO
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 lg:grid-cols-4">
        {[
          {
            label: "Total Payable",
            value: totals.totalPayable,
            count: totals.totalCount,
          },
          {
            label: "Open / Draft",
            value: totals.open,
            count: totals.openCount,
          },
          {
            label: "Over Due",
            value: totals.overDue,
            count: totals.overDueCount,
            alert: totals.overDueCount > 0,
          },
          { label: "Paid", value: totals.paid, count: totals.paidCount },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-4 sm:p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              {stat.label}
            </p>
            <p
              className={`mt-2 truncate text-lg font-semibold tabular-nums sm:text-xl ${
                stat.alert ? "text-rose-600" : "text-slate-900"
              }`}
            >
              {formatCurrency(stat.value)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {stat.count} {stat.count === 1 ? "order" : "orders"}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div
            className="-mx-1 flex gap-1 overflow-x-auto px-1"
            role="tablist"
            aria-label="Filter purchase orders by status"
          >
            {PO_STATUS_FILTERS.map((filter) => {
              const active = statusFilter === filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {filter.label}
                  <span
                    className={`text-xs tabular-nums ${
                      active ? "text-white/60" : "text-slate-400"
                    }`}
                  >
                    {statusCounts[filter.value]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search PO, supplier, project..."
              aria-label="Search purchase orders"
              className="h-9 rounded-lg border-slate-200 bg-slate-50 pl-9 text-sm focus-visible:bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead className="h-10 text-xs font-medium uppercase tracking-wider text-slate-500">
                  Purchase Order
                </TableHead>
                <TableHead className="h-10 text-xs font-medium uppercase tracking-wider text-slate-500">
                  Supplier
                </TableHead>
                <TableHead className="h-10 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                  Total
                </TableHead>
                <TableHead className="h-10 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                  Released
                </TableHead>
                <TableHead className="h-10 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                  Balance
                </TableHead>
                <TableHead className="h-10 text-xs font-medium uppercase tracking-wider text-slate-500">
                  Payment
                </TableHead>
                <TableHead className="h-10 text-xs font-medium uppercase tracking-wider text-slate-500">
                  Approval
                </TableHead>
                <TableHead className="h-10 text-xs font-medium uppercase tracking-wider text-slate-500">
                  Status
                </TableHead>
                <TableHead className="h-10 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedPurchaseOrders.length > 0 ? (
                paginatedPurchaseOrders.map((po) => {
                  const releasedAmount = getTotalReleasedAmount(po);
                  const remainingAmount = getPORemainingAmount(po);
                  const isReturned =
                    normalizeText(po.approvalWorkflow?.state) === "returned" ||
                    normalizeText(po.approvalStatus) === "rejected";

                  return (
                    <TableRow
                      key={po.id}
                      className="border-slate-100 hover:bg-slate-50/60"
                    >
                      <TableCell className="py-3">
                        <button
                          type="button"
                          onClick={() => handleViewPO(po)}
                          className="whitespace-nowrap font-medium text-slate-900 hover:underline"
                        >
                          {po.poNumber || "-"}
                        </button>
                        <p className="whitespace-nowrap text-xs text-slate-500">
                          {po.estimateNumber || "No estimate"}
                        </p>
                      </TableCell>

                      <TableCell className="py-3">
                        <p
                          className="max-w-[220px] truncate text-slate-700"
                          title={po.supplierName}
                        >
                          {po.supplierName || "-"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDateDisplay(po.issueDate) || "-"}
                        </p>
                      </TableCell>

                      <TableCell className="whitespace-nowrap py-3 text-right font-medium tabular-nums text-slate-900">
                        {formatCurrency(po.totalAmount || 0)}
                      </TableCell>

                      <TableCell className="whitespace-nowrap py-3 text-right tabular-nums text-slate-600">
                        {formatCurrency(releasedAmount)}
                      </TableCell>

                      <TableCell
                        className={`whitespace-nowrap py-3 text-right tabular-nums ${
                          remainingAmount > 0.009
                            ? "text-slate-900"
                            : "text-slate-400"
                        }`}
                      >
                        {formatCurrency(remainingAmount)}
                      </TableCell>

                      <TableCell className="py-3">
                        <StatusPill tone={getPOPaymentTone(po)}>
                          {getPOPaymentLabel(po)}
                        </StatusPill>
                      </TableCell>

                      <TableCell className="py-3">
                        <StatusPill
                          tone={getPOApprovalTone(po)}
                          title={getPOApprovalLabel(po)}
                        >
                          {getPOApprovalLabel(po)}
                        </StatusPill>
                      </TableCell>

                      <TableCell className="py-3">
                        <Select
                          disabled={!isPOApproved(po)}
                          value={
                            po.status === "Over Due" ? "Over Due" : po.status
                          }
                          onValueChange={(value) =>
                            handleStatusChange(po, value as PurchaseOrderStatus)
                          }
                        >
                          <SelectTrigger
                            className="h-8 w-[118px] rounded-lg border-slate-200 text-xs"
                            aria-label={`Status of ${po.poNumber || "purchase order"}`}
                          >
                            <SelectValue />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="Draft">Draft</SelectItem>
                            <SelectItem value="Open">Open</SelectItem>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>

                            {po.status === "Over Due" && (
                              <SelectItem value="Over Due">Over Due</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell className="py-3">
                        <div className="flex items-center justify-end gap-1">
                          {canApprovePO(po) && (
                            <>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                title="Approve Purchase Order"
                                aria-label="Approve Purchase Order"
                                onClick={() => handleApprovePO(po)}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                title="Return Purchase Order"
                                aria-label="Return Purchase Order"
                                onClick={() => openRejectPO(po)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}

                          {isFinanceUser && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-lg border-slate-200 px-2.5 text-xs"
                              title={
                                releasedAmount > 0
                                  ? "Release more payment"
                                  : "Release payment"
                              }
                              onClick={() => handleOpenPaymentRelease(po)}
                              disabled={
                                !isPOApproved(po) ||
                                po.status === "Cancelled" ||
                                isPOPaymentCompleted(po) ||
                                remainingAmount <= 0.009
                              }
                            >
                              <Banknote className="mr-1.5 h-3.5 w-3.5" />
                              Release
                            </Button>
                          )}

                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900"
                            title="View"
                            aria-label="View purchase order"
                            onClick={() => handleViewPO(po)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900"
                                aria-label="More actions"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-44">
                              {canEditPO(po) && (
                                <DropdownMenuItem
                                  onClick={() => handleEditPO(po)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}

                              {isReturned && (
                                <DropdownMenuItem
                                  onClick={() => handleResubmitPO(po)}
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Resubmit
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem
                                onClick={() => handleDuplicatePO(po)}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handleGeneratePOPdf(po)}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                Open PDF
                              </DropdownMenuItem>

                              {isAdminUser && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                                    onClick={() => setDeletingPO(po)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={9} className="py-16 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-900">
                      {searchTerm.trim() || statusFilter !== "all"
                        ? "No matching purchase orders"
                        : "No purchase orders yet"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {searchTerm.trim() || statusFilter !== "all"
                        ? "Try a different search or status filter."
                        : "Create a PO to see it listed here."}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {filteredPurchaseOrders.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-medium tabular-nums text-slate-900">
                {pageStart}–{pageEnd}
              </span>{" "}
              of{" "}
              <span className="font-medium tabular-nums text-slate-900">
                {filteredPurchaseOrders.length}
              </span>
            </p>

            {totalPages > 1 && (
              <nav
                className="flex items-center gap-1"
                aria-label="Purchase order pages"
              >
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-lg"
                  aria-label="Previous page"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {getPageNumbers(currentPage, totalPages).map((page, index) =>
                  page === "…" ? (
                    <span
                      key={`gap-${index}`}
                      className="px-1 text-sm text-slate-400"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      aria-current={page === currentPage ? "page" : undefined}
                      className={`h-8 min-w-8 rounded-lg px-2 text-sm tabular-nums transition-colors ${
                        page === currentPage
                          ? "bg-slate-900 font-medium text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}

                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-lg"
                  aria-label="Next page"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((page) => page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </nav>
            )}
          </div>
        )}
      </div>

      {paymentReleasePO && (
        // Explicit <PurchaseOrder> generic arg removed: esbuild's JSX parser
        // (what Vite/some deploy environments use) doesn't reliably support
        // generic type arguments directly on a JSX tag, unlike tsc. TS still
        // infers T = PurchaseOrder correctly from the `context` prop below.
        <PaymentReleaseModal
          isOpen={paymentReleaseOpen}
          onClose={handleClosePaymentRelease}
          onSuccess={handleClosePaymentRelease}
          title={`Release Payment - ${paymentReleasePO.poNumber || "PO"}`}
          invoice={paymentReleasePO as any}
          context={paymentReleasePO}
          docPath={["Panels", PANEL_ID, "PO", paymentReleasePO.id]}
          buildUpdateData={buildPOPaymentUpdateData}
          amount={getPORemainingAmount(paymentReleasePO)}
          amountLabel="Remaining PO Balance"
          partyLabel="Supplier"
          parties={
            paymentReleasePO.supplierName ? [paymentReleasePO.supplierName] : []
          }
          initialPaymentMethod="bank_transfer"
          amountReadOnly={false}
          allowCheque
          allowReceiptUpload
        />
      )}

      <RejectionModal
        isOpen={rejectionOpen}
        onClose={() => {
          setRejectionOpen(false);
          setRejectionPO(null);
        }}
        onConfirm={handleRejectPO}
        itemType="purchase order"
        loading={rejectionLoading}
      />

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl rounded-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Order Details</DialogTitle>
          </DialogHeader>

          {viewingPO ? <PurchaseOrderView po={viewingPO} /> : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deletingPO)}
        onOpenChange={(open) => {
          if (!open && !deleteLoading) setDeletingPO(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Order?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <span className="font-semibold text-foreground">
                    {deletingPO?.poNumber || "This Purchase Order"}
                  </span>
                  {deletingPO?.supplierName
                    ? ` for ${deletingPO.supplierName}`
                    : ""}{" "}
                  ({formatCurrency(safeNumber(deletingPO?.totalAmount))}) will
                  be permanently deleted. This cannot be undone.
                </p>

                {deletingPO && hasPurchaseOrderPaymentReleased(deletingPO) && (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 font-medium text-amber-800">
                    {formatCurrency(getTotalReleasedAmount(deletingPO))} has
                    already been released against this PO. Its payment history
                    is stored on the PO and will be deleted with it.
                  </p>
                )}

                {deletingPO?.source === "budget_request" &&
                  deletingPO.sourceInvoiceId && (
                    <p>
                      This PO was created from a Budget Request. The request
                      will be unlinked so a new PO can be created for it.
                    </p>
                  )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeletePO}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete PO"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
