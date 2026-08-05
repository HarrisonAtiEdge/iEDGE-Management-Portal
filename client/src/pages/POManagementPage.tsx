import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import jsPDF from "jspdf";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Copy,
  Eye,
  FileText,
  Pencil,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useFirestoreQuery } from "@/hooks/useFirestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  type BudgetApprovalWorkflowConfig,
  createWorkflowSnapshot,
  enrichApprovalLevelsWithRoleMetadata,
  getCurrentApprovalLevel,
  getCurrentApproverRoleLabel,
  getPendingApprovalFields,
  isCurrentRequestApprover,
} from "@/lib/budgetApprovalWorkflow";
import { useToast } from "@/hooks/use-toast";

const PANEL_ID = "IEDGE-SYSTEM";
const CREATE_PO_ROUTE = "/create-po";
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

function isFinancePurchaseOrderRole(role: any) {
  return PURCHASE_ORDER_FINANCE_ROLE_KEYS.has(getRoleKey(role));
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
  const isAdmin = ["main_admin", "admin", "administrator"].includes(
    profileRoleKey,
  );

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
  return ["main_admin", "admin", "administrator"].includes(
    getRoleKey(user?.role),
  );
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

function getPOPaymentLabel(po: PurchaseOrder) {
  const releasedAmount = getTotalReleasedAmount(po);
  const remainingAmount = getPORemainingAmount(po);

  if (releasedAmount <= 0) return "Unpaid";
  if (remainingAmount <= 0.009) return "Fully Released";
  return "Partially Released";
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
          <Badge
            variant={
              remainingAmount <= 0.009 && releasedAmount > 0
                ? "default"
                : releasedAmount > 0
                  ? "secondary"
                  : "outline"
            }
          >
            {getPOPaymentLabel(po)}
          </Badge>
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
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);
  const [paymentReleaseOpen, setPaymentReleaseOpen] = useState(false);
  const [paymentReleasePO, setPaymentReleasePO] =
    useState<PurchaseOrder | null>(null);
  const [rejectionOpen, setRejectionOpen] = useState(false);
  const [rejectionPO, setRejectionPO] = useState<PurchaseOrder | null>(null);
  const [rejectionLoading, setRejectionLoading] = useState(false);

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

          const status = isOverDue({
            dueDate: data.dueDate,
            status: data.status,
          })
            ? "Over Due"
            : data.status;

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
        const pendingFields = getPendingApprovalFields(
          snapshot as any,
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
    const totalPayable = visiblePurchaseOrders.reduce(
      (sum, item) => sum + safeNumber(item.totalAmount),
      0,
    );

    const overDue = visiblePurchaseOrders
      .filter((item) => item.status === "Over Due")
      .reduce((sum, item) => sum + safeNumber(item.totalAmount), 0);

    const open = visiblePurchaseOrders
      .filter((item) => item.status === "Open" || item.status === "Draft")
      .reduce((sum, item) => sum + safeNumber(item.totalAmount), 0);

    const paid = visiblePurchaseOrders
      .filter((item) => item.status === "Paid")
      .reduce((sum, item) => sum + safeNumber(item.totalAmount), 0);

    return { totalPayable, overDue, open, paid };
  }, [visiblePurchaseOrders]);

  const chartData = useMemo(() => {
    const grouped = new Map<
      string,
      {
        date: string;
        totalPayable: number;
        overDue: number;
        open: number;
        paid: number;
      }
    >();

    visiblePurchaseOrders.forEach((item) => {
      const rawDate = item.issueDate || "No Date";

      const label =
        rawDate === "No Date"
          ? rawDate
          : new Date(rawDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
            });

      const existing = grouped.get(label) || {
        date: label,
        totalPayable: 0,
        overDue: 0,
        open: 0,
        paid: 0,
      };

      existing.totalPayable += safeNumber(item.totalAmount);

      if (item.status === "Over Due") {
        existing.overDue += safeNumber(item.totalAmount);
      }

      if (item.status === "Open" || item.status === "Draft") {
        existing.open += safeNumber(item.totalAmount);
      }

      if (item.status === "Paid") {
        existing.paid += safeNumber(item.totalAmount);
      }

      grouped.set(label, existing);
    });

    return Array.from(grouped.values()).slice(-8);
  }, [visiblePurchaseOrders]);

  const filteredPurchaseOrders = useMemo(() => {
    const search = normalizeText(searchTerm);
    if (!search) return visiblePurchaseOrders;

    return visiblePurchaseOrders.filter((po) => {
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
  }, [visiblePurchaseOrders, searchTerm]);

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

  const canApprovePO = (po: PurchaseOrder) => {
    if (!hasPurchaseOrderAccess || !isPOApprovalRequired()) return false;
    if (isPOApproved(po)) return false;

    const state = normalizeText(
      po.approvalWorkflow?.state || po.approvalStatus,
    );
    if (state === "returned" || state === "rejected") return false;

    return isCurrentRequestApprover(
      getPOWithResolvedWorkflow(po),
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

  const handleEditPO = (po: PurchaseOrder) => {
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
        getPendingApprovalFields(
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
        status: po.status === "Draft" ? "Open" : po.status,
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
        ...getPendingApprovalFields(snapshot as any, 0),
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

    if (remainingAmount <= 0.009) {
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
      releasedAt: new Date(),
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
      updateData.paymentReleasedAt = serverTimestamp();
      updateData.releasePaymentAt = serverTimestamp();
      updateData.paymentFullyReleasedAt = serverTimestamp();
    } else {
      updateData.partialPaymentReleasedAt = serverTimestamp();
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
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground">
            PO management only. Create PO now opens on a separate page instead
            of a popup.
          </p>
        </div>

        <Button className="rounded-2xl" onClick={handleCreatePO}>
          <Plus className="h-4 w-4 mr-2" />
          Create PO
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-5 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="rounded-3xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Payable
                    </p>
                    <p className="text-xl font-bold mt-1">
                      {formatCurrency(totals.totalPayable)}
                    </p>
                  </div>
                  <Wallet className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Over Due</p>
                    <p className="text-xl font-bold mt-1">
                      {formatCurrency(totals.overDue)}
                    </p>
                  </div>
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Open / Draft
                    </p>
                    <p className="text-xl font-bold mt-1">
                      {formatCurrency(totals.open)}
                    </p>
                  </div>
                  <FileText className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Paid</p>
                    <p className="text-xl font-bold mt-1">
                      {formatCurrency(totals.paid)}
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="xl:col-span-7">
          <Card className="rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle>PO Summary Graph</CardTitle>
              <CardDescription>
                Date-wise view of total payable, overdue, open and paid values.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar
                      dataKey="totalPayable"
                      name="Total Payable"
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey="overDue"
                      name="Over Due"
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey="open"
                      name="Open / Draft"
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar dataKey="paid" name="Paid" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-3xl shadow-sm">
        <CardHeader className="space-y-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Purchase Order List
            </CardTitle>
            <CardDescription>
              {userCanViewAllPurchaseOrders
                ? "Showing all Purchase Orders, including orders created by other users."
                : "Showing Purchase Orders created by you or currently assigned to you for approval."}
            </CardDescription>
          </div>

          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search PO, estimate, supplier, project, status..."
              className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11"
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-2xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>P.O.</TableHead>
                  <TableHead>ESTIMATE #</TableHead>
                  <TableHead>SUPPLIER</TableHead>
                  <TableHead>DATE</TableHead>
                  <TableHead className="text-right">TOTAL</TableHead>
                  <TableHead className="text-right">RELEASED</TableHead>
                  <TableHead className="text-right">REMAINING</TableHead>
                  <TableHead>PAYMENT</TableHead>
                  <TableHead>APPROVAL</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>ACTION</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredPurchaseOrders.length > 0 ? (
                  filteredPurchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">
                        {po.poNumber}
                      </TableCell>

                      <TableCell>{po.estimateNumber || "-"}</TableCell>

                      <TableCell>{po.supplierName || "-"}</TableCell>

                      <TableCell>
                        {formatDateDisplay(po.issueDate) || "-"}
                      </TableCell>

                      <TableCell className="text-right">
                        {formatCurrency(po.totalAmount || 0)}
                      </TableCell>

                      <TableCell className="text-right">
                        {formatCurrency(getTotalReleasedAmount(po))}
                      </TableCell>

                      <TableCell className="text-right">
                        {formatCurrency(getPORemainingAmount(po))}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            getPORemainingAmount(po) <= 0.009 &&
                            getTotalReleasedAmount(po) > 0
                              ? "default"
                              : getTotalReleasedAmount(po) > 0
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {getPOPaymentLabel(po)}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            isPOApproved(po)
                              ? "default"
                              : normalizeText(
                                    po.approvalWorkflow?.state ||
                                      po.approvalStatus,
                                  ) === "returned" ||
                                  normalizeText(po.approvalStatus) ===
                                    "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                          className="max-w-[180px] truncate"
                          title={getPOApprovalLabel(po)}
                        >
                          {getPOApprovalLabel(po)}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Select
                          disabled={!isPOApproved(po)}
                          value={
                            po.status === "Over Due" ? "Over Due" : po.status
                          }
                          onValueChange={(value) =>
                            handleStatusChange(po, value as PurchaseOrderStatus)
                          }
                        >
                          <SelectTrigger className="w-[130px]">
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

                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {canApprovePO(po) && (
                            <>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="h-9 w-9 rounded-xl border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                title="Approve Purchase Order"
                                aria-label="Approve Purchase Order"
                                onClick={() => handleApprovePO(po)}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="h-9 w-9 rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                title="Return Purchase Order"
                                aria-label="Return Purchase Order"
                                onClick={() => openRejectPO(po)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}

                          {(normalizeText(po.approvalWorkflow?.state) ===
                            "returned" ||
                            normalizeText(po.approvalStatus) ===
                              "rejected") && (
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="h-9 w-9 rounded-xl"
                              title="Resubmit for approval"
                              aria-label="Resubmit Purchase Order for approval"
                              onClick={() => handleResubmitPO(po)}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            type="button"
                            size="icon"
                            className="h-9 w-9 rounded-xl"
                            title={
                              getTotalReleasedAmount(po) > 0
                                ? "Release More"
                                : "Release Payment"
                            }
                            aria-label={
                              getTotalReleasedAmount(po) > 0
                                ? "Release more payment"
                                : "Release payment"
                            }
                            onClick={() => handleOpenPaymentRelease(po)}
                            disabled={
                              !isFinanceUser ||
                              !isPOApproved(po) ||
                              po.status === "Cancelled" ||
                              getPORemainingAmount(po) <= 0.009
                            }
                          >
                            <Banknote className="h-4 w-4" />
                          </Button>

                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-9 w-9 rounded-xl"
                            title="Edit"
                            aria-label="Edit purchase order"
                            onClick={() => handleEditPO(po)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-9 w-9 rounded-xl"
                            title="View"
                            aria-label="View purchase order"
                            onClick={() => handleViewPO(po)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-9 w-9 rounded-xl"
                            title="Duplicate"
                            aria-label="Duplicate purchase order"
                            onClick={() => handleDuplicatePO(po)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>

                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-9 w-9 rounded-xl"
                            title="Open PDF"
                            aria-label="Open purchase order PDF"
                            onClick={() => handleGeneratePOPdf(po)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="text-center text-muted-foreground py-8"
                    >
                      {searchTerm.trim()
                        ? "No matching purchase orders found."
                        : "No purchase orders found."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {paymentReleasePO && (
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
    </div>
  );
}
