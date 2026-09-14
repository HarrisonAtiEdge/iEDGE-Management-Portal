// import { useEffect, useMemo, useRef, useState } from "react";
// import { useLocation } from "wouter";
// import { useAuth } from "@/contexts/AuthContext";
// import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { useFirestoreQuery } from "@/hooks/useFirestore";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import InvoiceRequestModal from "@/components/BudgetRequestModal";
// import PaymentReleaseModal from "@/components/PaymentReleaseModal";
// import ExpenseSheetModal from "@/components/ExpenseSheetModal";
// import InvoiceDetailsModal from "@/components/BudgetDetailsModal";
// import { InvoiceRequest } from "@shared/schema";
// import { useToast } from "@/hooks/use-toast";
// import RejectionModal from "@/components/RejectionModal";
// import PaymentHistoryModal from "@/components/PaymentHistoryModal";
// import { openBudgetRequestPrintPreview } from "@/lib/budgetRequestPrintPreview";

// import {
//   BUDGET_WORKFLOW_CONFIG_ID,
//   type BudgetApprovalWorkflowConfig,
//   canUserViewBudgetRequest,
//   createWorkflowSnapshot,
//   enrichApprovalLevelsWithRoleMetadata,
//   getCurrentApproverRoleLabel,
//   getCurrentApprovalLevel,
//   getEffectiveBudgetRequestVisibility,
//   getPendingApprovalFields,
//   getWorkflowStatusLabel,
//   isCurrentRequestApprover,
//   sanitizeApprovalLevels,
// } from "@/lib/budgetApprovalWorkflow";

// function formatPKR(value: number | string | undefined) {
//   if (value === null || value === undefined) return "0.00";

//   const num =
//     typeof value === "number"
//       ? value
//       : parseFloat(String(value).replace(/,/g, "")) || 0;

//   return num.toLocaleString("en-PK", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });
// }

// function safeNumber(value: any) {
//   const parsed = Number(String(value ?? 0).replace(/,/g, ""));
//   return Number.isFinite(parsed) ? parsed : 0;
// }

// function roundMoney(value: any) {
//   return Math.round(safeNumber(value) * 100) / 100;
// }

// function getPaymentReleaseAmount(entry: any) {
//   return roundMoney(
//     entry?.amount ??
//       entry?.releaseAmount ??
//       entry?.releasedAmount ??
//       entry?.paymentAmount ??
//       0,
//   );
// }

// function getPaymentReleaseHistory(invoice: any): any[] {
//   const history = Array.isArray(invoice?.paymentReleaseHistory)
//     ? invoice.paymentReleaseHistory
//     : [];

//   if (history.length > 0) {
//     return history.filter((entry: any) => getPaymentReleaseAmount(entry) > 0);
//   }

//   const legacyPayment =
//     invoice?.paymentDetails || invoice?.latestPaymentRelease;

//   if (legacyPayment && getPaymentReleaseAmount(legacyPayment) > 0) {
//     return [
//       {
//         ...legacyPayment,
//         releasedAt:
//           legacyPayment?.releasedAt ||
//           invoice?.paymentReleasedAt ||
//           invoice?.releasePaymentAt ||
//           invoice?.updatedAt ||
//           null,
//       },
//     ];
//   }

//   return [];
// }

// function getPaymentHistoryCount(invoice: any): number {
//   if (Array.isArray(invoice?.paymentReleaseHistory)) {
//     return invoice.paymentReleaseHistory.length;
//   }

//   if (invoice?.paymentDetails || invoice?.latestPaymentRelease) {
//     return 1;
//   }

//   return 0;
// }

// function getChequeFilterText(invoice: any): string {
//   const chequeValues: string[] = [];

//   const addValue = (value: any) => {
//     if (value === null || value === undefined) return;

//     if (Array.isArray(value)) {
//       value.forEach(addValue);
//       return;
//     }

//     if (typeof value === "object") {
//       addValue(value?.chequeNumber);
//       addValue(value?.chequeNo);
//       addValue(value?.checkNumber);
//       addValue(value?.number);
//       addValue(value?.transactionReference);
//       addValue(value?.referenceNumber);
//       return;
//     }

//     const text = String(value).trim();

//     if (text) {
//       chequeValues.push(text);
//     }
//   };

//   [
//     invoice?.chequeNumber,
//     invoice?.chequeNo,
//     invoice?.checkNumber,
//     invoice?.chequeNumbers,

//     invoice?.paymentDetails?.chequeNumber,
//     invoice?.paymentDetails?.chequeNo,
//     invoice?.paymentDetails?.checkNumber,
//     invoice?.paymentDetails?.chequeNumbers,

//     invoice?.latestPaymentRelease?.chequeNumber,
//     invoice?.latestPaymentRelease?.chequeNo,
//     invoice?.latestPaymentRelease?.checkNumber,
//     invoice?.latestPaymentRelease?.chequeNumbers,
//   ].forEach(addValue);

//   getPaymentReleaseHistory(invoice).forEach((entry: any) => {
//     addValue(entry?.chequeNumber);
//     addValue(entry?.chequeNo);
//     addValue(entry?.checkNumber);
//     addValue(entry?.chequeNumbers);
//     addValue(entry?.cheques);

//     if (normalizeText(entry?.paymentMethod) === "cheque") {
//       addValue(entry?.transactionReference);
//       addValue(entry?.referenceNumber);
//     }
//   });

//   return chequeValues.join(" ");
// }

// function getRequestDetailsItems(invoice: any): any[] {
//   const items = Array.isArray(invoice?.items) ? invoice.items : [];

//   const lineItems = Array.isArray(invoice?.lineItems) ? invoice.lineItems : [];

//   const approvalItems = Array.isArray(invoice?.approvalItems)
//     ? invoice.approvalItems
//     : [];

//   const availableArrays = [items, lineItems, approvalItems].filter(
//     (itemArray) => itemArray.length > 0,
//   );

//   if (availableArrays.length === 0) {
//     return [];
//   }

//   const baseItems = availableArrays.reduce((longest, current) =>
//     current.length > longest.length ? current : longest,
//   );

//   const findMatchingItem = (
//     source: any[],
//     baseItem: any,
//     index: number,
//   ): any | undefined => {
//     if (!source.length) {
//       return undefined;
//     }

//     if (baseItem?.id !== null && baseItem?.id !== undefined) {
//       const matchById = source.find(
//         (item: any) => String(item?.id) === String(baseItem.id),
//       );

//       if (matchById) {
//         return matchById;
//       }
//     }

//     return source[index];
//   };

//   return baseItems.map((baseItem: any, index: number) => {
//     const approvalItem = findMatchingItem(approvalItems, baseItem, index);

//     const legacyLineItem = findMatchingItem(lineItems, baseItem, index);

//     const currentItem = findMatchingItem(items, baseItem, index);

//     return {
//       ...(approvalItem || {}),
//       ...(legacyLineItem || {}),
//       ...(currentItem || {}),
//     };
//   });
// }

// function getDescriptionSearchText(invoice: any): string {
//   const searchableValues: string[] = [];

//   const addValue = (value: any) => {
//     if (value === null || value === undefined) return;

//     if (Array.isArray(value)) {
//       value.forEach(addValue);
//       return;
//     }

//     if (typeof value === "string" || typeof value === "number") {
//       const text = String(value).trim();

//       if (text) {
//         searchableValues.push(text);
//       }
//     }
//   };

//   const addItem = (item: any) => {
//     if (!item || typeof item !== "object") return;

//     [
//       item?.name,
//       item?.itemName,
//       item?.title,
//       item?.productName,
//       item?.service,
//       item?.serviceName,
//       item?.description,
//       item?.itemDescription,
//       item?.details,
//       item?.detail,
//       item?.comment,
//       item?.requesterComment,
//       item?.notes,
//       item?.remarks,
//       item?.purpose,
//       item?.specification,
//       item?.specifications,
//       item?.category,
//       item?.vendor,
//       item?.vendorName,
//       item?.supplier,
//       item?.supplierName,

//       item?.original?.name,
//       item?.original?.itemName,
//       item?.original?.title,
//       item?.original?.service,
//       item?.original?.serviceName,
//       item?.original?.description,
//       item?.original?.itemDescription,
//       item?.original?.details,
//       item?.original?.detail,
//       item?.original?.comment,
//       item?.original?.notes,
//       item?.original?.remarks,
//     ].forEach(addValue);
//   };

//   [
//     invoice?.description,
//     invoice?.itemDescription,
//     invoice?.requestDescription,
//     invoice?.requestDetails?.description,
//     invoice?.requestDetails?.itemDescription,
//     invoice?.details,
//     invoice?.detail,
//     invoice?.message,
//     invoice?.comment,
//     invoice?.notes,
//     invoice?.remarks,
//     invoice?.purpose,
//   ].forEach(addValue);

//   getRequestDetailsItems(invoice).forEach(addItem);

//   [
//     invoice?.requestItems,
//     invoice?.budgetItems,
//     invoice?.expenseItems,
//     invoice?.selectedItems,
//     invoice?.requestDetails?.items,
//     invoice?.requestDetails?.lineItems,
//     invoice?.requestDetails?.approvalItems,
//   ].forEach((itemArray) => {
//     if (Array.isArray(itemArray)) {
//       itemArray.forEach(addItem);
//     }
//   });

//   return searchableValues.join(" ");
// }

// function getApprovedPaymentAmount(invoice: any): number {
//   return roundMoney(
//     invoice?.approvedAmount ??
//       invoice?.totalApprovedAmount ??
//       invoice?.approvedTotal ??
//       invoice?.totalAmount ??
//       invoice?.amount ??
//       0,
//   );
// }

// function getTotalReleasedAmount(invoice: any): number {
//   const explicitReleasedAmount = roundMoney(invoice?.totalReleasedAmount);

//   if (explicitReleasedAmount > 0) {
//     return explicitReleasedAmount;
//   }

//   return roundMoney(
//     getPaymentReleaseHistory(invoice).reduce(
//       (sum, entry) => sum + getPaymentReleaseAmount(entry),
//       0,
//     ),
//   );
// }

// function getRemainingPaymentBalance(invoice: any): number {
//   const explicitRemaining = invoice?.remainingReleaseAmount;

//   if (explicitRemaining !== undefined && explicitRemaining !== null) {
//     return roundMoney(Math.max(safeNumber(explicitRemaining), 0));
//   }

//   return roundMoney(
//     Math.max(
//       getApprovedPaymentAmount(invoice) - getTotalReleasedAmount(invoice),
//       0,
//     ),
//   );
// }

// function isPaymentFullyReleased(invoice: any): boolean {
//   const approvedAmount = getApprovedPaymentAmount(invoice);

//   const releasedAmount = getTotalReleasedAmount(invoice);

//   const remainingAmount = getRemainingPaymentBalance(invoice);

//   const status = normalizeText(invoice?.status);

//   const paymentStatus = normalizeText(
//     invoice?.paymentStatus || invoice?.releasePaymentStatus,
//   );

//   if (
//     approvedAmount > 0 &&
//     (remainingAmount <= 0.009 || releasedAmount >= approvedAmount - 0.009)
//   ) {
//     return true;
//   }

//   return Boolean(
//     status === "payment_released" ||
//       paymentStatus === "released" ||
//       paymentStatus === "payment_released" ||
//       invoice?.paymentReleasedAt ||
//       invoice?.releasePaymentAt,
//   );
// }

// function hasPartialPaymentReleased(invoice: any): boolean {
//   return (
//     getTotalReleasedAmount(invoice) > 0 && !isPaymentFullyReleased(invoice)
//   );
// }

// function normalizeText(value: any) {
//   return String(value || "")
//     .toLowerCase()
//     .trim();
// }

// const ROLE_LABELS: Record<string, string> = {
//   admin: "Admin",
//   main_admin: "Admin",
//   super_admin: "Super Admin",

//   finance: "Finance",
//   financial_admin: "Finance Admin",
//   finance_admin: "Finance Admin",

//   operation: "Operation",
//   operations: "Operation",
//   operational_admin: "Operation Admin",
//   operation_admin: "Operation Admin",

//   creative: "Creative",
//   sales: "Sales",
// };

// function getRoleKey(role: any): string {
//   return String(role || "")
//     .toLowerCase()
//     .trim()
//     .replace(/[\s-]+/g, "_");
// }

// function formatRoleLabel(role: any): string {
//   const roleKey = getRoleKey(role);

//   if (!roleKey) {
//     return "";
//   }

//   return (
//     ROLE_LABELS[roleKey] ||
//     String(role || "")
//       .replace(/_/g, " ")
//       .replace(/\b\w/g, (letter) => letter.toUpperCase())
//       .trim()
//   );
// }

// function getFirstTextValue(values: any[]): string {
//   for (const value of values) {
//     const text = String(value || "").trim();

//     if (text) {
//       return text;
//     }
//   }

//   return "";
// }

// function getEstimateNumber(invoice: any): string {
//   return getFirstTextValue([
//     invoice?.estimateNumber,
//     invoice?.estimateNo,
//     invoice?.estimateValue,
//     invoice?.selectedEstimate,
//     invoice?.selectEstimate,
//   ]);
// }

// function getDirectReturnedRole(invoice?: any): string {
//   const directRole = getFirstTextValue([
//     invoice?.returnedToRole,
//     invoice?.returnToRole,
//     invoice?.returnedRole,
//     invoice?.returnedTo,
//     invoice?.creatorRole,
//     invoice?.createdByRole,
//     invoice?.submittedByRole,
//     invoice?.requestedByRole,
//     invoice?.requesterRole,
//     invoice?.userRole,
//     invoice?.departmentRole,
//     invoice?.department,
//     invoice?.team,
//   ]);

//   return getRoleKey(directRole);
// }

// function getReturnedToRoleStatusLabel(invoice?: any): string {
//   const savedRoleLabel = getFirstTextValue([
//     invoice?.returnedToRoleLabel,
//     invoice?.returnToRoleLabel,
//   ]);

//   const role = getDirectReturnedRole(invoice);

//   const roleLabel = savedRoleLabel || formatRoleLabel(role);

//   return roleLabel ? `Returned To ${roleLabel}` : "Returned To Role";
// }

// function formatStatus(status: string) {
//   return String(status || "unknown")
//     .replace(/_/g, " ")
//     .replace(/^pending /, "")
//     .replace(/\b\w/g, (letter) => letter.toUpperCase());
// }

// function getDateFromValue(value: any): Date | null {
//   if (!value) return null;

//   if (value instanceof Date) {
//     return Number.isNaN(value.getTime()) ? null : value;
//   }

//   if (typeof value?.toDate === "function") {
//     const date = value.toDate();

//     return Number.isNaN(date?.getTime?.()) ? null : date;
//   }

//   if (typeof value?.seconds === "number") {
//     const date = new Date(value.seconds * 1000);

//     return Number.isNaN(date.getTime()) ? null : date;
//   }

//   if (typeof value === "string") {
//     const trimmed = value.trim();

//     const ymd = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);

//     if (ymd) {
//       const date = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));

//       return Number.isNaN(date.getTime()) ? null : date;
//     }

//     const dmy = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);

//     if (dmy) {
//       const date = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));

//       return Number.isNaN(date.getTime()) ? null : date;
//     }

//     const date = new Date(trimmed);

//     return Number.isNaN(date.getTime()) ? null : date;
//   }

//   if (typeof value === "number") {
//     const date = new Date(value);

//     return Number.isNaN(date.getTime()) ? null : date;
//   }

//   return null;
// }

// function getRequestDate(invoice: any): Date | null {
//   return (
//     getDateFromValue(invoice?.submitDate) ||
//     getDateFromValue(invoice?.submittedAt) ||
//     getDateFromValue(invoice?.submissionDate) ||
//     getDateFromValue(invoice?.requestDate) ||
//     getDateFromValue(invoice?.createdAt) ||
//     getDateFromValue(invoice?.date) ||
//     getDateFromValue(invoice?.created_at) ||
//     getDateFromValue(invoice?.timestamp) ||
//     getDateFromValue(invoice?.updatedAt)
//   );
// }

// function getRequestIdSequence(invoice: any): number | null {
//   const requestId = String(invoice?.requestId || "").trim();

//   const sequenceMatch = requestId.match(/(\d+)(?!.*\d)/);

//   if (!sequenceMatch) {
//     return null;
//   }

//   const sequence = Number(sequenceMatch[1]);

//   return Number.isFinite(sequence) ? sequence : null;
// }

// function compareRequestIdsAscending(a: any, b: any): number {
//   const aSequence = getRequestIdSequence(a);

//   const bSequence = getRequestIdSequence(b);

//   if (aSequence !== null && bSequence !== null && aSequence !== bSequence) {
//     return aSequence - bSequence;
//   }

//   if (aSequence !== null && bSequence === null) {
//     return -1;
//   }

//   if (aSequence === null && bSequence !== null) {
//     return 1;
//   }

//   const aDate = getRequestDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;

//   const bDate = getRequestDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;

//   if (aDate !== bDate) {
//     return aDate - bDate;
//   }

//   return String(a?.id || "").localeCompare(String(b?.id || ""));
// }

// function isAdminRole(role: any): boolean {
//   return ["admin", "main_admin", "super_admin"].includes(getRoleKey(role));
// }

// function isFinanceApproverRole(role: any): boolean {
//   return ["finance", "financial_admin", "finance_admin"].includes(
//     getRoleKey(role),
//   );
// }

// function isOperationRole(role: any): boolean {
//   return ["operation", "operations"].includes(getRoleKey(role));
// }

// type BillWorkflowStatus =
//   | "not_submitted"
//   | "submitted_to_finance"
//   | "submitted_without_bill"
//   | "received_by_finance";

// function getBillWorkflowStatus(invoice: any): BillWorkflowStatus {
//   const explicitStatus = normalizeText(
//     invoice?.billStatus || invoice?.billWorkflowStatus,
//   );

//   if (
//     explicitStatus === "received_by_finance" ||
//     explicitStatus === "bill_received_by_finance" ||
//     invoice?.billReceivedByFinance === true ||
//     normalizeText(invoice?.status) === "bill_received_by_finance"
//   ) {
//     return "received_by_finance";
//   }

//   if (
//     explicitStatus === "submitted_without_bill" ||
//     explicitStatus === "bill_submitted_without_bill" ||
//     invoice?.billSubmittedWithoutBill === true ||
//     normalizeText(invoice?.status) === "bill_submitted_without_bill"
//   ) {
//     return "submitted_without_bill";
//   }

//   if (
//     explicitStatus === "submitted_to_finance" ||
//     explicitStatus === "bill_submitted_to_finance" ||
//     invoice?.billSubmittedToFinance === true ||
//     normalizeText(invoice?.status) === "bill_submitted_to_finance"
//   ) {
//     return "submitted_to_finance";
//   }

//   return "not_submitted";
// }

// function hasBillBeenSubmittedToFinance(invoice: any): boolean {
//   return [
//     "submitted_to_finance",
//     "submitted_without_bill",
//     "received_by_finance",
//   ].includes(getBillWorkflowStatus(invoice));
// }

// function hasFinanceReceivedBill(invoice: any): boolean {
//   return getBillWorkflowStatus(invoice) === "received_by_finance";
// }

// function hasBeenSubmittedWithoutBill(invoice: any): boolean {
//   return getBillWorkflowStatus(invoice) === "submitted_without_bill";
// }

// function getBillHistory(invoice: any): any[] {
//   return Array.isArray(invoice?.billHistory) ? invoice.billHistory : [];
// }

// function getBillHistoryActionLabel(entry: any): string {
//   const action = normalizeText(entry?.action || entry?.status || entry?.type);

//   if (
//     action === "submitted_to_finance" ||
//     action === "bill_submitted_to_finance"
//   ) {
//     return "Bill Submitted to Finance";
//   }

//   if (
//     action === "submitted_without_bill" ||
//     action === "bill_submitted_without_bill"
//   ) {
//     return "Submitted Without Bill";
//   }

//   if (
//     action === "received_by_finance" ||
//     action === "bill_received_by_finance"
//   ) {
//     return "Bill Received by Finance";
//   }

//   return formatStatus(action || "Bill Update");
// }

// function formatBillHistoryDate(value: any): string {
//   const date = getDateFromValue(value);

//   if (!date) {
//     return "-";
//   }

//   return date.toLocaleString("en-PK", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// }

// function canRoleCreateBudgetRequest(role: any): boolean {
//   const roleKey = getRoleKey(role);

//   if (!roleKey) {
//     return false;
//   }

//   return !isAdminRole(roleKey);
// }

// function getLatestApprovalAction(invoice: any): string {
//   const approvalHistory = Array.isArray(invoice?.approvalHistory)
//     ? invoice.approvalHistory
//     : [];

//   const latest = approvalHistory[approvalHistory.length - 1];

//   return normalizeText(latest?.action || latest?.status || "");
// }

// function wasReturnedToCreator(invoice: any): boolean {
//   const status = normalizeText(invoice?.status);

//   if (
//     ["rejected", "returned_to_creator", "changes_requested"].includes(status)
//   ) {
//     return true;
//   }

//   if (
//     status === "pending_operational_admin" &&
//     getLatestApprovalAction(invoice) === "rejected"
//   ) {
//     return true;
//   }

//   return Boolean(invoice?.returnedToCreator || invoice?.needsCreatorRevision);
// }

// function isWaitingForAdminApproval(invoice: any): boolean {
//   const status = normalizeText(invoice?.status);

//   if (status === "pending_main_admin" || status === "pending_admin") {
//     return true;
//   }

//   if (
//     status === "pending_operational_admin" &&
//     !wasReturnedToCreator(invoice)
//   ) {
//     return true;
//   }

//   return false;
// }

// function hasAdminApprovedBudgetRequest(invoice: any): boolean {
//   const status = normalizeText(invoice?.status);

//   const workflow = invoice?.approvalWorkflow;

//   if (workflow && Array.isArray(workflow?.levels)) {
//     const currentLevelIndex = Number(workflow?.currentLevelIndex || 0);

//     const approvalHistory = Array.isArray(invoice?.approvalHistory)
//       ? invoice.approvalHistory
//       : [];

//     return (
//       status === "approved" ||
//       workflow?.state === "approved" ||
//       currentLevelIndex > 0 ||
//       approvalHistory.some(
//         (entry: any) => normalizeText(entry?.action) === "approved",
//       )
//     );
//   }

//   const afterAdminApprovalStatuses = [
//     "pending_finance",
//     "approved",
//     "po_created",
//     "po_submitted",
//     "po_approved",
//     "po_issued",
//     "ready_for_payment",
//     "payment_released",
//     "expense_submitted",
//     "expense_completed",
//   ];

//   if (afterAdminApprovalStatuses.includes(status)) {
//     return true;
//   }

//   if (
//     invoice?.adminApprovedAt ||
//     invoice?.adminApprovedBy ||
//     invoice?.adminApprovedById
//   ) {
//     return true;
//   }

//   const approvalHistory = Array.isArray(invoice?.approvalHistory)
//     ? invoice.approvalHistory
//     : [];

//   return approvalHistory.some((history: any) => {
//     const action = normalizeText(history?.action || history?.status);

//     const approverRole = getRoleKey(
//       history?.approverRole || history?.role || history?.userRole,
//     );

//     return action === "approved" && isAdminRole(approverRole);
//   });
// }

// function getStatusLabel(status: string, invoice?: any): string {
//   const normalizedStatus = normalizeText(status);

//   if (invoice && wasReturnedToCreator(invoice)) {
//     return getReturnedToRoleStatusLabel(invoice);
//   }

//   if (normalizedStatus === "pending_workflow_configuration") {
//     const budgetRole = getFirstTextValue([
//       invoice?.budgetRole,
//       invoice?.approvalBudgetRole,
//       invoice?.submittedByRoleLabel,
//       invoice?.submittedByRole,
//     ]);

//     return budgetRole
//       ? `Workflow Not Configured: ${formatRoleLabel(budgetRole)}`
//       : "Budget Role Workflow Not Configured";
//   }

//   if (
//     normalizedStatus === "pending_main_admin" ||
//     normalizedStatus === "pending_admin"
//   ) {
//     return "Pending Admin";
//   }

//   if (normalizedStatus === "pending_operational_admin") {
//     return "Pending Admin";
//   }

//   if (normalizedStatus === "pending_finance") {
//     return "Pending Finance";
//   }

//   if (normalizedStatus === "pending_approval") {
//     return invoice ? getWorkflowStatusLabel(invoice) : "Pending Approval";
//   }

//   if (normalizedStatus === "payment_partially_released") {
//     return "Payment Partially Released";
//   }

//   if (normalizedStatus === "bill_submitted_to_finance") {
//     return "Bill Submitted to Finance";
//   }

//   if (normalizedStatus === "bill_received_by_finance") {
//     return "Bill Received by Finance";
//   }

//   if (normalizedStatus === "bill_submitted_without_bill") {
//     return "Submitted Without Bill";
//   }

//   if (normalizedStatus === "rejected") {
//     return getReturnedToRoleStatusLabel(invoice);
//   }

//   return formatStatus(status);
// }

// type BudgetRequestType = "project" | "general" | "asset";

// const COMBINED_LOCAL_VENDOR_GROUP_KEY = "local-vendors:combined";

// type BudgetVendorWorkflow = {
//   key: string;
//   name: string;
//   vendorNames: string[];
//   isLocalVendorGroup: boolean;
//   supplierId: string;
//   supplier: any | null;
//   items: any[];
//   totalAmount: number;
//   linkedPO: any | null;
//   releasedAmount: number;
//   remainingAmount: number;
// };

// function formatRequestDate(invoice: any) {
//   const date = getRequestDate(invoice);

//   if (!date) {
//     return "-";
//   }

//   return date.toLocaleDateString("en-PK", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// }

// function getDateInputValue(date: Date | null) {
//   if (!date) {
//     return "";
//   }

//   const year = date.getFullYear();

//   const month = String(date.getMonth() + 1).padStart(2, "0");

//   const day = String(date.getDate()).padStart(2, "0");

//   return `${year}-${month}-${day}`;
// }

// function isFirebaseIdLike(value: any): boolean {
//   const text = String(value || "").trim();

//   return /^[A-Za-z0-9_-]{20,}$/.test(text) && !text.includes("@");
// }

// function getSafeDisplayText(value: any): string {
//   const text = String(value || "").trim();

//   if (!text || isFirebaseIdLike(text)) {
//     return "";
//   }

//   return text;
// }

// const CREATOR_NAME_OVERRIDES: Record<string, string> = {};

// function getTableStatusSortRank(invoice: any): number {
//   const status = normalizeText(invoice?.status);

//   if (status === "pending_approval") {
//     return 0;
//   }

//   if (status === "pending_workflow_configuration") {
//     return 1;
//   }

//   if (wasReturnedToCreator(invoice)) {
//     return 2;
//   }

//   if (
//     [
//       "approved",
//       "po_created",
//       "po_submitted",
//       "po_approved",
//       "po_issued",
//       "ready_for_payment",
//       "payment_partially_released",
//     ].includes(status)
//   ) {
//     return 3;
//   }

//   if (status === "pending_finance") {
//     return 4;
//   }

//   if (status.startsWith("pending")) {
//     return 5;
//   }

//   if (
//     [
//       "payment_released",
//       "bill_submitted_to_finance",
//       "bill_submitted_without_bill",
//       "bill_received_by_finance",
//       "expense_submitted",
//       "expense_completed",
//     ].includes(status)
//   ) {
//     return 6;
//   }

//   return 7;
// }

// type ReleasePaymentPriorityPredicate = (invoice: any) => boolean;

// export function isFinanceReleasePaymentPriorityRequest(invoice: any): boolean {
//   const status = normalizeText(invoice?.status);

//   if (
//     isPaymentFullyReleased(invoice) ||
//     getRemainingPaymentBalance(invoice) <= 0.009 ||
//     invoice?.expenseSubmitted ||
//     status === "expense_submitted" ||
//     status === "expense_completed"
//   ) {
//     return false;
//   }

//   if (
//     [
//       "po_created",
//       "po_submitted",
//       "po_approved",
//       "po_issued",
//       "ready_for_payment",
//       "payment_partially_released",
//     ].includes(status)
//   ) {
//     return true;
//   }

//   if (status !== "approved") {
//     return false;
//   }

//   const rawType = normalizeText(invoice?.invoiceType || invoice?.type);

//   const looksLikeProject =
//     rawType === "project" ||
//     (!rawType &&
//       Boolean(
//         invoice?.clientName ||
//           invoice?.project ||
//           invoice?.projectName ||
//           invoice?.projectCode,
//       ));

//   if (!looksLikeProject) {
//     return true;
//   }

//   return Boolean(
//     invoice?.poSubmitted ||
//       invoice?.poCreated ||
//       invoice?.purchaseOrderCreated ||
//       invoice?.purchaseOrderSubmitted ||
//       invoice?.poId ||
//       invoice?.poNumber ||
//       invoice?.poDocId ||
//       invoice?.purchaseOrderId ||
//       invoice?.purchaseOrderNumber ||
//       invoice?.poCreatedAt ||
//       invoice?.purchaseOrderCreatedAt,
//   );
// }

// export function getFinanceTableStatusSortRank(
//   invoice: any,
//   isReleasePaymentRequest?: ReleasePaymentPriorityPredicate,
// ): number {
//   const status = normalizeText(invoice?.status);

//   if (status === "pending_approval") {
//     return 0;
//   }

//   if (status === "pending_workflow_configuration") {
//     return 1;
//   }

//   if (status === "pending_finance") {
//     return 2;
//   }

//   if (
//     getBillWorkflowStatus(invoice) === "submitted_to_finance" &&
//     !hasFinanceReceivedBill(invoice)
//   ) {
//     return 3;
//   }

//   const needsPaymentRelease = isReleasePaymentRequest
//     ? isReleasePaymentRequest(invoice)
//     : isFinanceReleasePaymentPriorityRequest(invoice);

//   if (needsPaymentRelease) {
//     return 4;
//   }

//   if (
//     [
//       "approved",
//       "po_created",
//       "po_submitted",
//       "po_approved",
//       "po_issued",
//       "ready_for_payment",
//       "payment_partially_released",
//       "payment_released",
//       "bill_submitted_to_finance",
//       "bill_submitted_without_bill",
//       "bill_received_by_finance",
//       "expense_submitted",
//       "expense_completed",
//     ].includes(status)
//   ) {
//     return 5;
//   }

//   if (isWaitingForAdminApproval(invoice) && !wasReturnedToCreator(invoice)) {
//     return 6;
//   }

//   return 7;
// }

// export function compareBudgetRequestsForTable(
//   a: any,
//   b: any,
//   currentUserRole?: any,
//   isReleasePaymentRequest?: ReleasePaymentPriorityPredicate,
// ): number {
//   const useFinancePriority = isFinanceApproverRole(currentUserRole);

//   const aStatusRank = useFinancePriority
//     ? getFinanceTableStatusSortRank(a, isReleasePaymentRequest)
//     : getTableStatusSortRank(a);

//   const bStatusRank = useFinancePriority
//     ? getFinanceTableStatusSortRank(b, isReleasePaymentRequest)
//     : getTableStatusSortRank(b);

//   if (aStatusRank !== bStatusRank) {
//     return aStatusRank - bStatusRank;
//   }

//   // Within the same priority group, show the newest request first — a
//   // freshly created request should be visible immediately at the top
//   // instead of landing at the bottom of its group (and often a later
//   // page) behind everything already there.
//   return -compareRequestIdsAscending(a, b);
// }

// export default function InvoiceRequests() {
//   const PANEL_ID = "IEDGE-SYSTEM";

//   const { userProfile } = useAuth();

//   const { toast } = useToast();

//   const currentUserRole = String(userProfile?.role || "");

//   const [, setLocation] = useLocation();

//   const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

//   const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

//   const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

//   const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

//   const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRequest | null>(
//     null,
//   );

//   // Request ids just approved/rejected by the current user this session —
//   // kept near the top of the sort (see sortedInvoices) so the row doesn't
//   // jump to a different page the instant its status/rank changes.
//   const [recentlyActedOnIds, setRecentlyActedOnIds] = useState<Set<string>>(
//     new Set(),
//   );

//   const [isPaymentHistoryModalOpen, setIsPaymentHistoryModalOpen] =
//     useState(false);

//   const [paymentHistoryInvoice, setPaymentHistoryInvoice] =
//     useState<InvoiceRequest | null>(null);

//   const [billHistoryInvoice, setBillHistoryInvoice] =
//     useState<InvoiceRequest | null>(null);

//   const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);

//   const [rejectionLoading, setRejectionLoading] = useState(false);

//   const [searchTerm, setSearchTerm] = useState("");

//   const [typeFilter, setTypeFilter] = useState<"all" | BudgetRequestType>(
//     "all",
//   );

//   const [statusFilter, setStatusFilter] = useState("all");

//   const [dateFrom, setDateFrom] = useState("");

//   const [dateTo, setDateTo] = useState("");

//   const [monthFilter, setMonthFilter] = useState("");

//   const [createdByFilter, setCreatedByFilter] = useState("all");

//   const [projectCodeFilter, setProjectCodeFilter] = useState("");

//   const [vendorFilter, setVendorFilter] = useState("");

//   const [estimateFilter, setEstimateFilter] = useState("");

//   const [chequeFilter, setChequeFilter] = useState("");

//   const [currentPage, setCurrentPage] = useState(1);

//   const [pageSize, setPageSize] = useState(10);

//   const [sortOrder, setSortOrder] = useState<
//     "default" | "ascending" | "descending"
//   >("default");

//   const { data: invoices = [], loading } = useFirestoreQuery<InvoiceRequest>(
//     `Panels/${PANEL_ID}/invoiceRequests`,
//   );

//   const { data: expenseSheets = [] } = useFirestoreQuery<any>(
//     `Panels/${PANEL_ID}/expenseSheets`,
//   );

//   const { data: purchaseOrders = [] } = useFirestoreQuery<any>(
//     `Panels/${PANEL_ID}/PO`,
//   );

//   const { data: suppliers = [] } = useFirestoreQuery<any>(
//     `Panels/${PANEL_ID}/suppliers`,
//   );

//   const { data: users = [] } = useFirestoreQuery<any>("users");

//   const { data: panelUsers = [] } = useFirestoreQuery<any>(
//     `Panels/${PANEL_ID}/users`,
//   );

//   const { data: workflowConfigs = [] } = useFirestoreQuery<any>(
//     `Panels/${PANEL_ID}/workflowConfigs`,
//   );

//   const { data: roleConfigs = [] } = useFirestoreQuery<any>(
//     `Panels/${PANEL_ID}/sidebarConfig`,
//   );

//   const workflowRepairSignaturesRef = useRef<Map<string, string>>(new Map());

//   const workflowRoleResolutionContext = useMemo(
//     () => ({
//       roles: roleConfigs || [],

//       users: [...(users || []), ...(panelUsers || [])],
//     }),
//     [roleConfigs, users, panelUsers],
//   );

//   function getBudgetRoleWorkflowConfigId(roleValue: any): string {
//     const roleKey = getRoleKey(roleValue);

//     return roleKey
//       ? `${BUDGET_WORKFLOW_CONFIG_ID}__role__${roleKey}`
//       : `${BUDGET_WORKFLOW_CONFIG_ID}__role`;
//   }

//   const budgetWorkflowConfigs = useMemo<BudgetApprovalWorkflowConfig[]>(() => {
//     return (workflowConfigs || [])
//       .filter((config: any) => {
//         const id = String(config?.id || "").trim();

//         return (
//           id === BUDGET_WORKFLOW_CONFIG_ID ||
//           id.startsWith(`${BUDGET_WORKFLOW_CONFIG_ID}__role__`) ||
//           config?.workflowScope === "role" ||
//           Boolean(
//             config?.budgetRoleKey || config?.budgetRoleId || config?.budgetRole,
//           )
//         );
//       })
//       .map((config: any) => {
//         const budgetRole = String(config?.budgetRole || "").trim();

//         const budgetRoleId = String(config?.budgetRoleId || "").trim();

//         const budgetRoleKey = getRoleKey(
//           config?.budgetRoleKey || budgetRoleId || budgetRole,
//         );

//         return {
//           ...config,

//           module: "budget_requests",

//           workflowScope: config?.workflowScope || "role",

//           budgetRole,
//           budgetRoleId,
//           budgetRoleKey,

//           enabled: config.enabled !== false,

//           version: Number(config.version || 1),

//           levels: enrichApprovalLevelsWithRoleMetadata(
//             config.levels || [],
//             roleConfigs || [],
//             [...(users || []), ...(panelUsers || [])],
//           ),
//         } as BudgetApprovalWorkflowConfig;
//       });
//   }, [workflowConfigs, roleConfigs, users, panelUsers]);

//   function getRequestBudgetRoleValue(request: any): string {
//     const directRole = getFirstTextValue([
//       request?.budgetRoleId,
//       request?.budgetRoleKey,
//       request?.budgetRole,
//       request?.submittedByRole,
//       request?.createdByRole,
//       request?.requestedByRole,
//       request?.requesterRole,
//       request?.userRole,
//     ]);

//     if (directRole) {
//       return directRole;
//     }

//     const ownerValues = [
//       request?.submittedBy,
//       request?.createdBy,
//       request?.requestedBy,
//       request?.requesterId,
//       request?.userId,
//       request?.uid,
//       request?.createdById,
//       request?.submittedById,
//       request?.createdByEmail,
//       request?.submittedByEmail,
//       request?.email,
//     ]
//       .map((value) =>
//         String(value || "")
//           .trim()
//           .toLowerCase(),
//       )
//       .filter(Boolean);

//     if (!ownerValues.length) {
//       return "";
//     }

//     const matchedUser = (workflowRoleResolutionContext.users || []).find(
//       (user: any) => {
//         const identities = [
//           user?.id,
//           user?.uid,
//           user?.userId,
//           user?.firebaseUid,
//           user?.authUid,
//           user?.email,
//         ]
//           .map((value) =>
//             String(value || "")
//               .trim()
//               .toLowerCase(),
//           )
//           .filter(Boolean);

//         return ownerValues.some((value) => identities.includes(value));
//       },
//     );

//     return String(matchedUser?.role || "").trim();
//   }

//   function getRequestBudgetRoleKey(request: any): string {
//     return getRoleKey(
//       request?.budgetRoleKey ||
//         request?.budgetRoleId ||
//         getRequestBudgetRoleValue(request),
//     );
//   }

//   function getRequestBudgetRoleName(request: any): string {
//     const savedName = getFirstTextValue([
//       request?.budgetRole,
//       request?.approvalBudgetRole,
//       request?.submittedByRoleLabel,
//     ]);

//     if (savedName) {
//       return savedName;
//     }

//     const roleValue = getRequestBudgetRoleValue(request);

//     const roleKey = getRoleKey(roleValue);

//     const roleRecord = (roleConfigs || []).find((role: any) =>
//       [role?.id, role?.name, role?.label, role?.displayName].some(
//         (value) => getRoleKey(value) === roleKey,
//       ),
//     );

//     return getFirstTextValue([
//       roleRecord?.name,
//       roleRecord?.label,
//       roleRecord?.displayName,

//       roleValue ? formatRoleLabel(roleValue) : "",
//     ]);
//   }

//   function getBudgetWorkflowConfigForRole(
//     roleValue: any,
//   ): BudgetApprovalWorkflowConfig | null {
//     const roleKey = getRoleKey(roleValue);

//     if (!roleKey) {
//       return null;
//     }

//     const expectedConfigId = getBudgetRoleWorkflowConfigId(roleKey);

//     return (
//       budgetWorkflowConfigs.find((config: any) => {
//         const configId = String(config?.id || "").trim();

//         const configRoleKey = getRoleKey(
//           config?.budgetRoleKey ||
//             config?.budgetRoleId ||
//             config?.budgetRole ||
//             "",
//         );

//         return configId === expectedConfigId || configRoleKey === roleKey;
//       }) || null
//     );
//   }

//   function getBudgetWorkflowConfigForRequest(
//     request: any,
//   ): BudgetApprovalWorkflowConfig | null {
//     const budgetRoleKey = getRequestBudgetRoleKey(request);

//     if (budgetRoleKey) {
//       return getBudgetWorkflowConfigForRole(budgetRoleKey);
//     }

//     return (
//       budgetWorkflowConfigs.find(
//         (config) => String(config?.id || "") === BUDGET_WORKFLOW_CONFIG_ID,
//       ) || null
//     );
//   }

//   function createBudgetRoleWorkflowSnapshot(config: any) {
//     return {
//       ...createWorkflowSnapshot(config),

//       workflowScope: "role",

//       budgetRole: String(config?.budgetRole || "").trim(),

//       budgetRoleId: String(config?.budgetRoleId || "").trim(),

//       budgetRoleKey: getRoleKey(
//         config?.budgetRoleKey ||
//           config?.budgetRoleId ||
//           config?.budgetRole ||
//           "",
//       ),
//     };
//   }

//   const CREATE_PO_ROUTE = "/create-po";

//   useEffect(() => {
//     if (!invoices || invoices.length === 0 || roleConfigs.length === 0) {
//       return;
//     }

//     const initializeOrRepairRequests = async () => {
//       for (const invoice of invoices || []) {
//         const request: any = invoice;

//         const requestId = String(request?.id || "").trim();

//         if (!requestId) {
//           continue;
//         }

//         const status = normalizeText(request?.status);

//         const isPendingSubmission =
//           status === "" || status === "draft" || status.startsWith("pending");

//         if (!isPendingSubmission) {
//           continue;
//         }

//         const budgetRoleValue = getRequestBudgetRoleValue(request);

//         const budgetRoleKey = getRequestBudgetRoleKey(request);

//         const budgetRoleName = getRequestBudgetRoleName(request);

//         const budgetRoleConfig = getBudgetWorkflowConfigForRequest(request);

//         const existingWorkflow = request?.approvalWorkflow;

//         const hasWorkflow = Boolean(
//           existingWorkflow &&
//             Array.isArray(existingWorkflow?.levels) &&
//             existingWorkflow.levels.length > 0,
//         );

//         const isResubmission =
//           existingWorkflow?.state === "returned" ||
//           (status === "pending_workflow_configuration" &&
//             Boolean(request?.resubmittedAt || request?.editDate));

//         if (
//           !budgetRoleConfig ||
//           budgetRoleConfig.enabled === false ||
//           budgetRoleConfig.levels.length === 0
//         ) {
//           if (hasWorkflow && !isResubmission && status === "pending_approval") {
//             continue;
//           }

//           const repairSignature = JSON.stringify({
//             status: "pending_workflow_configuration",

//             budgetRoleKey,
//           });

//           if (
//             workflowRepairSignaturesRef.current.get(requestId) ===
//             repairSignature
//           ) {
//             continue;
//           }

//           workflowRepairSignaturesRef.current.set(requestId, repairSignature);

//           const alreadyMarked =
//             status === "pending_workflow_configuration" &&
//             String(request?.currentApprover || "") === "" &&
//             Number(request?.currentApprovalLevel || 0) === 0 &&
//             getRoleKey(
//               request?.budgetRoleKey || request?.budgetRoleId || "",
//             ) === budgetRoleKey;

//           if (!alreadyMarked) {
//             try {
//               await updateDoc(
//                 doc(db, "Panels", PANEL_ID, "invoiceRequests", requestId),
//                 {
//                   status: "pending_workflow_configuration",

//                   workflowScope: "role",

//                   budgetRole:
//                     budgetRoleName || formatRoleLabel(budgetRoleValue),

//                   budgetRoleId: budgetRoleValue || "",

//                   budgetRoleKey,

//                   approvalBudgetRole:
//                     budgetRoleName || formatRoleLabel(budgetRoleValue),

//                   approvalBudgetRoleKey: budgetRoleKey,

//                   currentApprovalLevel: 0,

//                   currentApprovalLevelId: "",

//                   currentApprovalLevelName: "",

//                   currentApproverUserIds: [],

//                   currentApproverRoleIds: [],

//                   currentApproverRoleNames: [],

//                   currentApprover: "",

//                   updatedAt: serverTimestamp(),
//                 },
//               );
//             } catch (error) {
//               workflowRepairSignaturesRef.current.delete(requestId);

//               console.error(
//                 "Failed to mark missing Budget Role workflow:",
//                 error,
//               );
//             }
//           }

//           continue;
//         }

//         let snapshot: any;

//         if (isResubmission) {
//           snapshot = createBudgetRoleWorkflowSnapshot(budgetRoleConfig);
//         } else if (hasWorkflow) {
//           snapshot = {
//             ...existingWorkflow,

//             workflowScope: existingWorkflow?.workflowScope || "role",

//             budgetRole:
//               existingWorkflow?.budgetRole ||
//               (budgetRoleConfig as any)?.budgetRole ||
//               budgetRoleName ||
//               "",

//             budgetRoleId:
//               existingWorkflow?.budgetRoleId ||
//               (budgetRoleConfig as any)?.budgetRoleId ||
//               budgetRoleValue ||
//               "",

//             budgetRoleKey: getRoleKey(
//               existingWorkflow?.budgetRoleKey ||
//                 (budgetRoleConfig as any)?.budgetRoleKey ||
//                 budgetRoleKey,
//             ),

//             levels: enrichApprovalLevelsWithRoleMetadata(
//               existingWorkflow.levels || [],

//               workflowRoleResolutionContext.roles,

//               workflowRoleResolutionContext.users,
//             ),

//             currentLevelIndex: Number(existingWorkflow?.currentLevelIndex || 0),

//             state: "pending" as const,
//           };
//         } else {
//           snapshot = createBudgetRoleWorkflowSnapshot(budgetRoleConfig);
//         }

//         const currentLevelIndex = Number(snapshot?.currentLevelIndex || 0);

//         const currentLevel = snapshot?.levels?.[currentLevelIndex];

//         if (!currentLevel) {
//           continue;
//         }

//         if (
//           currentLevel?.userIds?.length > 0 &&
//           workflowRoleResolutionContext.users.length === 0 &&
//           (currentLevel?.roleIds?.length || 0) === 0
//         ) {
//           continue;
//         }

//         const pendingFields = getPendingApprovalFields(
//           snapshot,
//           currentLevelIndex,
//         );

//         const requestWithResolvedWorkflow = {
//           ...request,
//           ...pendingFields,
//         };

//         const resolvedRoleLabel = getCurrentApproverRoleLabel(
//           requestWithResolvedWorkflow,
//           workflowRoleResolutionContext,
//         );

//         const resolvedPendingFields = {
//           ...pendingFields,

//           currentApprover:
//             resolvedRoleLabel || pendingFields.currentApprover || "",
//         };

//         const currentRoleNames = Array.isArray(
//           request?.currentApproverRoleNames,
//         )
//           ? request.currentApproverRoleNames
//           : [];

//         const expectedRoleNames = Array.isArray(
//           resolvedPendingFields.currentApproverRoleNames,
//         )
//           ? resolvedPendingFields.currentApproverRoleNames
//           : [];

//         const currentConfigId = String(
//           request?.approvalWorkflow?.configId || "",
//         );

//         const expectedConfigId = String(snapshot?.configId || "");

//         const shouldRepair =
//           !hasWorkflow ||
//           isResubmission ||
//           status !== "pending_approval" ||
//           currentConfigId !== expectedConfigId ||
//           String(request?.currentApprover || "") !==
//             String(resolvedPendingFields.currentApprover || "") ||
//           JSON.stringify(currentRoleNames) !==
//             JSON.stringify(expectedRoleNames) ||
//           JSON.stringify(request?.currentApproverRoleIds || []) !==
//             JSON.stringify(resolvedPendingFields.currentApproverRoleIds || []);

//         if (!shouldRepair) {
//           continue;
//         }

//         const repairSignature = JSON.stringify({
//           status: "pending_approval",

//           budgetRoleKey,

//           configId: expectedConfigId,

//           currentLevelIndex,

//           roleIds: resolvedPendingFields.currentApproverRoleIds,

//           roleNames: resolvedPendingFields.currentApproverRoleNames,

//           currentApprover: resolvedPendingFields.currentApprover,
//         });

//         if (
//           workflowRepairSignaturesRef.current.get(requestId) === repairSignature
//         ) {
//           continue;
//         }

//         workflowRepairSignaturesRef.current.set(requestId, repairSignature);

//         try {
//           await updateDoc(
//             doc(db, "Panels", PANEL_ID, "invoiceRequests", requestId),
//             {
//               ...resolvedPendingFields,

//               workflowScope: "role",

//               budgetRole:
//                 (budgetRoleConfig as any)?.budgetRole ||
//                 budgetRoleName ||
//                 formatRoleLabel(budgetRoleValue),

//               budgetRoleId:
//                 (budgetRoleConfig as any)?.budgetRoleId ||
//                 budgetRoleValue ||
//                 "",

//               budgetRoleKey:
//                 getRoleKey((budgetRoleConfig as any)?.budgetRoleKey) ||
//                 budgetRoleKey,

//               approvalBudgetRole:
//                 (budgetRoleConfig as any)?.budgetRole || budgetRoleName || "",

//               approvalBudgetRoleKey:
//                 getRoleKey((budgetRoleConfig as any)?.budgetRoleKey) ||
//                 budgetRoleKey,

//               returnedToCreator: false,

//               needsCreatorRevision: false,

//               returnedToRole: "",

//               returnedToRoleLabel: "",

//               workflowInitializedAt:
//                 request?.workflowInitializedAt || serverTimestamp(),

//               updatedAt: serverTimestamp(),
//             },
//           );
//         } catch (error) {
//           workflowRepairSignaturesRef.current.delete(requestId);

//           console.error(
//             "Failed to initialize or repair Budget Role workflow:",
//             error,
//           );
//         }
//       }
//     };

//     void initializeOrRepairRequests();
//   }, [
//     budgetWorkflowConfigs,
//     invoices,
//     roleConfigs,
//     users,
//     panelUsers,
//     workflowRoleResolutionContext,
//   ]);

//   function getRequestType(invoice: any): BudgetRequestType {
//     const rawType = normalizeText(invoice?.invoiceType || invoice?.type);

//     if (rawType === "project") {
//       return "project";
//     }

//     if (rawType === "asset" || rawType === "assets") {
//       return "asset";
//     }

//     if (rawType === "general") {
//       return "general";
//     }

//     return invoice?.clientName ||
//       invoice?.project ||
//       invoice?.projectName ||
//       invoice?.projectCode
//       ? "project"
//       : "general";
//   }

//   function hasPaymentReleased(invoice: any): boolean {
//     return isPaymentFullyReleased(invoice);
//   }

//   function getExpenseAmount(invoice: any): number {
//     return safeNumber(
//       invoice?.approvedAmount ??
//         invoice?.totalApprovedAmount ??
//         invoice?.approvedTotal ??
//         invoice?.totalAmount ??
//         invoice?.amount ??
//         0,
//     );
//   }

//   function getExpensePaymentSnapshot(invoice: any) {
//     const history = getPaymentReleaseHistory(invoice);

//     const latestPayment =
//       history[history.length - 1] ||
//       invoice?.paymentDetails ||
//       invoice?.latestPaymentRelease ||
//       null;

//     const totalReleasedAmount = roundMoney(
//       history.reduce(
//         (sum: number, entry: any) => sum + getPaymentReleaseAmount(entry),
//         0,
//       ),
//     );

//     const vendors = Array.from(
//       new Set(
//         history
//           .flatMap((entry: any) => [
//             entry?.paymentVendorName,
//             entry?.vendorName,
//             entry?.supplierName,

//             ...(Array.isArray(entry?.paymentVendorNames)
//               ? entry.paymentVendorNames
//               : []),

//             ...(Array.isArray(entry?.localVendorNames)
//               ? entry.localVendorNames
//               : []),

//             ...(Array.isArray(entry?.vendors) ? entry.vendors : []),
//           ])
//           .map((value: any) => String(value || "").trim())
//           .filter(Boolean),
//       ),
//     );

//     return {
//       ...(latestPayment || {}),

//       amount: totalReleasedAmount || getPaymentReleaseAmount(latestPayment),

//       releasedAmount:
//         totalReleasedAmount || getPaymentReleaseAmount(latestPayment),

//       totalReleasedAmount,

//       remainingAmount: getRemainingPaymentBalance(invoice),

//       vendors,

//       paymentReleaseHistory: history,
//     };
//   }

//   function isExpenseLinkedToRequest(expense: any, invoice: any): boolean {
//     const requestId = String(invoice?.requestId || "").trim();

//     const invoiceDocId = String(invoice?.id || "").trim();

//     const poId = String(invoice?.poId || "").trim();

//     const poNumber = String(invoice?.poNumber || "").trim();

//     const expenseRequestLinks = [
//       expense?.linkedRequestId,
//       expense?.budgetRequestId,
//       expense?.sourceRequestId,
//       expense?.requestId,
//       expense?.invoiceNumber,
//     ]
//       .filter(Boolean)
//       .map((value) => String(value).trim());

//     const expenseDocLinks = [
//       expense?.linkedInvoiceId,
//       expense?.invoiceRequestId,
//       expense?.sourceInvoiceId,
//       expense?.budgetRequestDocId,
//       expense?.linkedRequestDocId,
//     ]
//       .filter(Boolean)
//       .map((value) => String(value).trim());

//     const expensePoLinks = [
//       expense?.poId,
//       expense?.poNumber,
//       expense?.sourcePOId,
//       expense?.sourcePONumber,
//     ]
//       .filter(Boolean)
//       .map((value) => String(value).trim());

//     return (
//       Boolean(requestId && expenseRequestLinks.includes(requestId)) ||
//       Boolean(invoiceDocId && expenseDocLinks.includes(invoiceDocId)) ||
//       Boolean(poId && expensePoLinks.includes(poId)) ||
//       Boolean(poNumber && expensePoLinks.includes(poNumber))
//     );
//   }

//   function hasExpenseSheet(invoice: InvoiceRequest): boolean {
//     return Boolean(
//       expenseSheets?.some((expense: any) =>
//         isExpenseLinkedToRequest(expense, invoice),
//       ),
//     );
//   }

//   function canShowExpenseAction(invoice: InvoiceRequest): boolean {
//     if (!userProfile || !isOperationRole(userProfile.role)) {
//       return false;
//     }

//     if (
//       (invoice as any).expenseSubmitted ||
//       String(invoice.status) === "expense_submitted"
//     ) {
//       return true;
//     }

//     return hasPaymentReleased(invoice);
//   }

//   function buildExpenseSource(invoice: InvoiceRequest) {
//     const request: any = invoice;

//     const requestType = getRequestType(request);

//     const projectName = request.projectName || request.project || "";

//     const requestItems = getRequestDetailsItems(request);

//     const linkedPurchaseOrders = getLinkedPurchaseOrders(request);

//     const firstLinkedPO = linkedPurchaseOrders[0] || null;

//     const paymentReleaseHistory = getPaymentReleaseHistory(request);

//     const paymentDetails = getExpensePaymentSnapshot(request);

//     const vendorName =
//       request.vendorName ||
//       request.supplierName ||
//       getFirstVendorName(request) ||
//       "";

//     const amount = getExpenseAmount(request);

//     return {
//       ...request,

//       sourceRequestStatus: request.status || "",

//       sourceType: "budget_request",

//       invoiceNumber: request.requestId || "",

//       requestId: request.requestId || "",

//       linkedRequestId: request.requestId || "",

//       budgetRequestId: request.requestId || "",

//       sourceRequestId: request.requestId || "",

//       linkedRequestDocId: request.id || "",

//       invoiceRequestId: request.id || "",

//       linkedInvoiceId: request.id || "",

//       sourceInvoiceId: request.id || "",

//       budgetRequestDocId: request.id || "",

//       invoiceType: requestType,

//       requestType,

//       estimateId: request.estimateId || "",

//       estimateNumber: getEstimateNumber(request),

//       clientName: request.clientName || "",

//       projectName,

//       project: projectName,

//       projectCode: request.projectCode || "",

//       title: request.title || request.subject || "",

//       subject: request.subject || request.title || "",

//       message:
//         request.message ||
//         request.notes ||
//         request.remarks ||
//         request.description ||
//         "",

//       vendorName,

//       supplierName: request.supplierName || vendorName,

//       supplierId: request.supplierId || request.vendorId || "",

//       amount,

//       totalAmount: amount,

//       approvedAmount: amount,

//       totalApprovedAmount: amount,

//       totalReleasedAmount: getTotalReleasedAmount(request),

//       remainingReleaseAmount: getRemainingPaymentBalance(request),

//       poId:
//         request.poId ||
//         firstLinkedPO?.id ||
//         firstLinkedPO?.poId ||
//         firstLinkedPO?.poDocId ||
//         "",

//       poNumber:
//         request.poNumber ||
//         firstLinkedPO?.poNumber ||
//         firstLinkedPO?.purchaseOrderNumber ||
//         "",

//       poDetails: firstLinkedPO,

//       purchaseOrders: linkedPurchaseOrders,

//       paymentDetails,

//       latestPaymentRelease:
//         paymentReleaseHistory[paymentReleaseHistory.length - 1] ||
//         request.latestPaymentRelease ||
//         null,

//       paymentReleaseHistory,

//       approvalItems: requestItems,

//       lineItems: requestItems,

//       items: requestItems,

//       approvalRequired: false,

//       requiresApproval: false,

//       adminApprovalRequired: false,

//       autoApproved: true,

//       autoApprovedReason:
//         "Created from approved Budget Request after payment release.",

//       dueDate: request.dueDate || new Date(),
//     };
//   }

//   function openExpenseModal(invoice: InvoiceRequest) {
//     const expenseSource = buildExpenseSource(invoice);

//     localStorage.setItem(
//       "submitExpenseFromBudgetRequest",
//       JSON.stringify(expenseSource),
//     );

//     localStorage.setItem("expenseSheetSource", JSON.stringify(expenseSource));

//     setSelectedInvoice(expenseSource as any);

//     setIsExpenseModalOpen(true);
//   }

//   async function handleExpenseSubmitted() {
//     const request: any = selectedInvoice;

//     try {
//       if (request?.id) {
//         await updateDoc(
//           doc(db, "Panels", PANEL_ID, "invoiceRequests", request.id),
//           {
//             status: "expense_submitted",

//             expenseSubmitted: true,

//             expenseStatus: "submitted",

//             expenseApprovalRequired: false,

//             expenseRequiresApproval: false,

//             expenseSubmittedAt: serverTimestamp(),

//             updatedAt: serverTimestamp(),
//           },
//         );
//       }

//       toast({
//         title: "Expense submitted",

//         description:
//           "Expense submitted successfully. No further approval is required.",
//       });
//     } catch (error) {
//       console.error("Failed to mark expense as submitted:", error);
//     } finally {
//       setIsExpenseModalOpen(false);

//       setSelectedInvoice(null);

//       localStorage.removeItem("submitExpenseFromBudgetRequest");

//       localStorage.removeItem("expenseSheetSource");
//     }
//   }

//   async function handlePaymentReleased() {
//     toast({
//       title: "Payment release saved",

//       description:
//         "The payment release history has been updated successfully. Finance can submit the bill after the payment is fully released.",
//     });

//     setIsPaymentModalOpen(false);

//     setSelectedInvoice(null);
//   }

//   function getCurrentUserDisplayName(): string {
//     return getFirstTextValue([
//       userProfile?.displayName,
//       (userProfile as any)?.name,
//       (userProfile as any)?.fullName,
//       userProfile?.email,
//       getCurrentUserId(),
//     ]);
//   }

//   function canFinanceSubmitBill(invoice: InvoiceRequest): boolean {
//     if (!userProfile || !isFinanceApproverRole(userProfile.role)) {
//       return false;
//     }

//     if (!hasPaymentReleased(invoice)) {
//       return false;
//     }

//     return !hasBillBeenSubmittedToFinance(invoice);
//   }

//   function canFinanceConfirmBillReceived(invoice: InvoiceRequest): boolean {
//     if (!userProfile || !isFinanceApproverRole(userProfile.role)) {
//       return false;
//     }

//     return (
//       getBillWorkflowStatus(invoice) === "submitted_to_finance" &&
//       !hasFinanceReceivedBill(invoice)
//     );
//   }

//   async function handleSubmitBillToFinance(invoice: InvoiceRequest) {
//     if (!canFinanceSubmitBill(invoice)) {
//       toast({
//         title: "Action not allowed",

//         description:
//           "The bill can only be submitted by Finance after the payment has been fully released.",

//         variant: "destructive",
//       });

//       return;
//     }

//     const request: any = invoice;

//     const actorId = getCurrentUserId();

//     const actorName = getCurrentUserDisplayName();

//     const actorRole = getRoleKey(userProfile?.role);

//     const billHistory = getBillHistory(request);

//     const adminNotifications = Array.isArray(request?.adminBillNotifications)
//       ? request.adminBillNotifications
//       : [];

//     const requestNumber = String(
//       request?.requestId || request?.id || "",
//     ).trim();

//     const actionAt = new Date();

//     try {
//       await updateDoc(
//         doc(db, "Panels", PANEL_ID, "invoiceRequests", invoice.id),
//         {
//           status: "bill_submitted_to_finance",

//           billStatus: "submitted_to_finance",

//           billWorkflowStatus: "submitted_to_finance",

//           billSubmittedToFinance: true,

//           billSubmittedAt: serverTimestamp(),

//           billSubmittedBy: actorName,

//           billSubmittedById: actorId,

//           billSubmittedByRole: actorRole,

//           billReceivedByFinance: false,

//           billReceivedAt: null,

//           billHistory: [
//             ...billHistory,
//             {
//               action: "submitted_to_finance",

//               status: "bill_submitted_to_finance",

//               actor: actorName,

//               actorId,

//               actorRole,

//               timestamp: actionAt,

//               note: "Finance submitted the bill.",
//             },
//           ],

//           adminBillNotificationUnread: true,

//           adminBillNotifications: [
//             ...adminNotifications,
//             {
//               type: "bill_submitted_to_finance",

//               requestId: requestNumber,

//               message: `Finance submitted the bill for request ${requestNumber}.`,

//               createdAt: actionAt,

//               read: false,
//             },
//           ],

//           updatedAt: serverTimestamp(),
//         },
//       );

//       toast({
//         title: "Bill submitted to Finance",

//         description:
//           "Finance can now confirm receipt by clicking Bill Received. Admin can see the updated request status and bill history.",
//       });
//     } catch (error: any) {
//       console.error("Failed to submit bill to Finance:", error);

//       toast({
//         title: "Error",

//         description: error?.message || "Failed to submit the bill to Finance.",

//         variant: "destructive",
//       });
//     }
//   }

//   async function handleSubmitWithoutBill(invoice: InvoiceRequest) {
//     if (!canFinanceSubmitBill(invoice)) {
//       toast({
//         title: "Action not allowed",

//         description:
//           "Submit Without Bill is available to Finance only after the payment has been fully released.",

//         variant: "destructive",
//       });

//       return;
//     }

//     const request: any = invoice;

//     const actorId = getCurrentUserId();

//     const actorName = getCurrentUserDisplayName();

//     const actorRole = getRoleKey(userProfile?.role);

//     const billHistory = getBillHistory(request);

//     const adminNotifications = Array.isArray(request?.adminBillNotifications)
//       ? request.adminBillNotifications
//       : [];

//     const requestNumber = String(
//       request?.requestId || request?.id || "",
//     ).trim();

//     const actionAt = new Date();

//     try {
//       await updateDoc(
//         doc(db, "Panels", PANEL_ID, "invoiceRequests", invoice.id),
//         {
//           status: "bill_submitted_without_bill",

//           billStatus: "submitted_without_bill",

//           billWorkflowStatus: "submitted_without_bill",

//           billSubmittedToFinance: false,

//           billSubmittedWithoutBill: true,

//           billUnavailable: true,

//           billRequired: false,

//           billSubmittedAt: null,

//           billSubmittedWithoutBillAt: serverTimestamp(),

//           billSubmittedWithoutBillBy: actorName,

//           billSubmittedWithoutBillById: actorId,

//           billSubmittedWithoutBillByRole: actorRole,

//           billReceivedByFinance: false,

//           billReceivedAt: null,

//           billWorkflowCompletedAt: serverTimestamp(),

//           billHistory: [
//             ...billHistory,
//             {
//               action: "submitted_without_bill",

//               status: "bill_submitted_without_bill",

//               actor: actorName,

//               actorId,

//               actorRole,

//               timestamp: actionAt,

//               billAvailable: false,

//               note: "Finance submitted the request without a bill because no bill was available.",
//             },
//           ],

//           adminBillNotificationUnread: true,

//           adminBillNotifications: [
//             ...adminNotifications,
//             {
//               type: "bill_submitted_without_bill",

//               requestId: requestNumber,

//               message: `Finance submitted request ${requestNumber} without a bill because no bill was available.`,

//               createdAt: actionAt,

//               read: false,
//             },
//           ],

//           updatedAt: serverTimestamp(),
//         },
//       );

//       toast({
//         title: "Submitted without bill",

//         description:
//           "The request has been submitted without a bill. Admin can see this status and the bill history. No Bill Received confirmation is required.",
//       });
//     } catch (error: any) {
//       console.error("Failed to submit without bill:", error);

//       toast({
//         title: "Error",

//         description:
//           error?.message || "Failed to submit the request without a bill.",

//         variant: "destructive",
//       });
//     }
//   }

//   async function handleBillReceivedByFinance(invoice: InvoiceRequest) {
//     if (!canFinanceConfirmBillReceived(invoice)) {
//       toast({
//         title: "Action not allowed",

//         description:
//           "Bill Received is available to Finance only after the bill has been submitted.",

//         variant: "destructive",
//       });

//       return;
//     }

//     const request: any = invoice;

//     const actorId = getCurrentUserId();

//     const actorName = getCurrentUserDisplayName();

//     const actorRole = getRoleKey(userProfile?.role);

//     const billHistory = getBillHistory(request);

//     const adminNotifications = Array.isArray(request?.adminBillNotifications)
//       ? request.adminBillNotifications
//       : [];

//     const requestNumber = String(
//       request?.requestId || request?.id || "",
//     ).trim();

//     const actionAt = new Date();

//     try {
//       await updateDoc(
//         doc(db, "Panels", PANEL_ID, "invoiceRequests", invoice.id),
//         {
//           status: "bill_received_by_finance",

//           billStatus: "received_by_finance",

//           billWorkflowStatus: "received_by_finance",

//           billSubmittedToFinance: true,

//           billReceivedByFinance: true,

//           billReceivedAt: serverTimestamp(),

//           billReceivedBy: actorName,

//           billReceivedById: actorId,

//           billReceivedByRole: actorRole,

//           billHistory: [
//             ...billHistory,
//             {
//               action: "received_by_finance",

//               status: "bill_received_by_finance",

//               actor: actorName,

//               actorId,

//               actorRole,

//               timestamp: actionAt,

//               note: "Finance confirmed that the bill was received.",
//             },
//           ],

//           adminBillNotificationUnread: true,

//           adminBillNotifications: [
//             ...adminNotifications,
//             {
//               type: "bill_received_by_finance",

//               requestId: requestNumber,

//               message: `Finance confirmed Bill Received for request ${requestNumber}.`,

//               createdAt: actionAt,

//               read: false,
//             },
//           ],

//           updatedAt: serverTimestamp(),
//         },
//       );

//       toast({
//         title: "Bill received",

//         description:
//           "The bill has been confirmed as received by Finance. Admin can see the completed bill handoff history on this request.",
//       });
//     } catch (error: any) {
//       console.error("Failed to confirm Bill Received:", error);

//       toast({
//         title: "Error",

//         description:
//           error?.message || "Failed to confirm that the bill was received.",

//         variant: "destructive",
//       });
//     }
//   }

//   function normalizeVendorIdentity(value: any): string {
//     return String(value || "")
//       .trim()
//       .toLowerCase()
//       .replace(/&/g, " and ")
//       .replace(/[^a-z0-9]+/g, " ")
//       .replace(/\s+/g, " ")
//       .trim();
//   }

//   function getSupplierDisplayName(supplier: any): string {
//     return getFirstTextValue([
//       supplier?.supplierName,
//       supplier?.vendorName,
//       supplier?.name,
//       supplier?.companyName,
//       supplier?.businessName,
//       supplier?.title,
//     ]);
//   }

//   function getSupplierNames(supplier: any): string[] {
//     return [
//       supplier?.supplierName,
//       supplier?.vendorName,
//       supplier?.name,
//       supplier?.companyName,
//       supplier?.businessName,
//       supplier?.title,
//     ]
//       .map((value) => String(value || "").trim())
//       .filter(Boolean);
//   }

//   function getItemVendorName(item: any): string {
//     return getFirstTextValue([
//       item?.vendor,
//       item?.vendorName,
//       item?.supplier,
//       item?.supplierName,
//       item?.payee,
//       item?.payeeName,
//       item?.original?.vendor,
//       item?.original?.vendorName,
//       item?.original?.supplier,
//       item?.original?.supplierName,
//     ]);
//   }

//   function getItemSupplierId(item: any): string {
//     return getFirstTextValue([
//       item?.supplierId,
//       item?.vendorId,
//       item?.supplierDocId,
//       item?.vendorDocId,
//       item?.original?.supplierId,
//       item?.original?.vendorId,
//     ]);
//   }

//   function getItemApprovedAmount(item: any): number {
//     const units = safeNumber(
//       item?.approvedUnits ?? item?.units ?? item?.quantity ?? item?.qty,
//     );

//     const rate = safeNumber(
//       item?.approvedUnitRate ?? item?.unitRate ?? item?.rate ?? item?.price,
//     );

//     const tax = safeNumber(item?.tax ?? item?.taxAmount);

//     return roundMoney(
//       item?.approvedTotal ??
//         item?.approvedAmount ??
//         item?.total ??
//         item?.amount ??
//         units * rate + tax,
//     );
//   }

//   function findSupplierForVendorGroup(group: {
//     name: string;
//     supplierId: string;
//   }): any | null {
//     if (group.supplierId) {
//       const byId = suppliers.find(
//         (supplier: any) => String(supplier?.id || "") === group.supplierId,
//       );

//       if (byId) {
//         return byId;
//       }
//     }

//     const normalizedVendor = normalizeVendorIdentity(group.name);

//     if (!normalizedVendor) {
//       return null;
//     }

//     return (
//       suppliers.find((supplier: any) =>
//         getSupplierNames(supplier).some(
//           (name) => normalizeVendorIdentity(name) === normalizedVendor,
//         ),
//       ) || null
//     );
//   }

//   function getBudgetVendorGroups(invoice: any) {
//     type VendorGroup = {
//       key: string;
//       name: string;
//       vendorNames: string[];
//       isLocalVendorGroup: boolean;
//       supplierId: string;
//       items: any[];
//       totalAmount: number;
//     };

//     const groups = new Map<string, VendorGroup>();

//     const addVendorName = (group: VendorGroup, vendorName: string) => {
//       const normalizedVendorName = normalizeVendorIdentity(vendorName);

//       if (!normalizedVendorName) {
//         return;
//       }

//       const alreadyAdded = group.vendorNames.some(
//         (name) => normalizeVendorIdentity(name) === normalizedVendorName,
//       );

//       if (!alreadyAdded) {
//         group.vendorNames.push(vendorName);
//       }
//     };

//     const requestItems = getRequestDetailsItems(invoice).filter(
//       (item: any) =>
//         !["rejected", "declined", "cancelled"].includes(
//           normalizeText(item?.status),
//         ),
//     );

//     requestItems.forEach((item: any) => {
//       const vendorName = getItemVendorName(item);

//       if (!vendorName) {
//         return;
//       }

//       const savedSupplierId = getItemSupplierId(item);

//       const currentSupplier = findSupplierForVendorGroup({
//         name: vendorName,

//         supplierId: savedSupplierId,
//       });

//       const amount = getItemApprovedAmount(item);

//       if (currentSupplier) {
//         const supplierId = String(currentSupplier?.id || savedSupplierId || "");

//         const key = `supplier:${supplierId}`;

//         const existing = groups.get(key);

//         if (existing) {
//           existing.items.push(item);

//           existing.totalAmount = roundMoney(existing.totalAmount + amount);

//           addVendorName(existing, vendorName);

//           return;
//         }

//         groups.set(key, {
//           key,

//           name: getSupplierDisplayName(currentSupplier) || vendorName,

//           vendorNames: [vendorName],

//           isLocalVendorGroup: false,

//           supplierId,

//           items: [item],

//           totalAmount: amount,
//         });

//         return;
//       }

//       const existingLocalGroup = groups.get(COMBINED_LOCAL_VENDOR_GROUP_KEY);

//       if (existingLocalGroup) {
//         existingLocalGroup.items.push(item);

//         existingLocalGroup.totalAmount = roundMoney(
//           existingLocalGroup.totalAmount + amount,
//         );

//         addVendorName(existingLocalGroup, vendorName);

//         return;
//       }

//       groups.set(COMBINED_LOCAL_VENDOR_GROUP_KEY, {
//         key: COMBINED_LOCAL_VENDOR_GROUP_KEY,

//         name: "Local Vendors",

//         vendorNames: [vendorName],

//         isLocalVendorGroup: true,

//         supplierId: "",

//         items: [item],

//         totalAmount: amount,
//       });
//     });

//     if (groups.size === 0) {
//       const directVendorName = getFirstTextValue([
//         invoice?.vendorName,
//         invoice?.supplierName,
//         invoice?.payeeName,
//         invoice?.payee,
//       ]);

//       if (directVendorName) {
//         const savedSupplierId = getFirstTextValue([
//           invoice?.supplierId,
//           invoice?.vendorId,
//         ]);

//         const currentSupplier = findSupplierForVendorGroup({
//           name: directVendorName,

//           supplierId: savedSupplierId,
//         });

//         if (currentSupplier) {
//           const supplierId = String(
//             currentSupplier?.id || savedSupplierId || "",
//           );

//           groups.set(`supplier:${supplierId}`, {
//             key: `supplier:${supplierId}`,

//             name: getSupplierDisplayName(currentSupplier) || directVendorName,

//             vendorNames: [directVendorName],

//             isLocalVendorGroup: false,

//             supplierId,

//             items: [],

//             totalAmount: getApprovedPaymentAmount(invoice),
//           });
//         } else {
//           groups.set(COMBINED_LOCAL_VENDOR_GROUP_KEY, {
//             key: COMBINED_LOCAL_VENDOR_GROUP_KEY,

//             name: "Local Vendors",

//             vendorNames: [directVendorName],

//             isLocalVendorGroup: true,

//             supplierId: "",

//             items: [],

//             totalAmount: getApprovedPaymentAmount(invoice),
//           });
//         }
//       }
//     }

//     const result = Array.from(groups.values());

//     if (result.length === 1 && result[0].totalAmount <= 0) {
//       result[0].totalAmount = getApprovedPaymentAmount(invoice);
//     }

//     return result;
//   }

//   function getLinkedPurchaseOrders(invoice: any): any[] {
//     const requestId = String(invoice?.requestId || "").trim();

//     const invoiceDocId = String(invoice?.id || "").trim();

//     const estimateId = String(invoice?.estimateId || "").trim();

//     const estimateNumber = getEstimateNumber(invoice);

//     return purchaseOrders.filter((po: any) => {
//       const poRequestDocLinks = [
//         po?.invoiceRequestId,
//         po?.linkedInvoiceId,
//         po?.sourceInvoiceId,
//         po?.budgetRequestDocId,
//         po?.sourceBudgetRequestId,
//         po?.requestDocId,
//         po?.invoiceId,
//       ]
//         .filter(Boolean)
//         .map((value) => String(value).trim());

//       const poRequestIdLinks = [
//         po?.requestId,
//         po?.budgetRequestId,
//         po?.linkedRequestId,
//         po?.sourceRequestId,
//         po?.invoiceNumber,
//         po?.budgetRequestNumber,
//       ]
//         .filter(Boolean)
//         .map((value) => String(value).trim());

//       const poEstimateLinks = [
//         po?.estimateId,
//         po?.estimateNumber,
//         po?.estimateNo,
//         po?.selectedEstimate,
//       ]
//         .filter(Boolean)
//         .map((value) => String(value).trim());

//       return (
//         Boolean(invoiceDocId && poRequestDocLinks.includes(invoiceDocId)) ||
//         Boolean(requestId && poRequestIdLinks.includes(requestId)) ||
//         Boolean(estimateId && poEstimateLinks.includes(estimateId)) ||
//         Boolean(estimateNumber && poEstimateLinks.includes(estimateNumber))
//       );
//     });
//   }

//   function getPOVendorName(po: any): string {
//     return getFirstTextValue([
//       po?.vendorName,
//       po?.supplierName,
//       po?.vendor,
//       po?.supplier,
//       po?.partyName,
//       po?.supplierDetails?.supplierName,
//       po?.supplierDetails?.vendorName,
//       po?.supplierSnapshot?.supplierName,
//       po?.supplierSnapshot?.vendorName,
//     ]);
//   }

//   function getPOVendorId(po: any): string {
//     return getFirstTextValue([
//       po?.supplierId,
//       po?.vendorId,
//       po?.supplierDocId,
//       po?.vendorDocId,
//       po?.supplierDetails?.id,
//       po?.supplierSnapshot?.id,
//     ]);
//   }

//   function getLinkedPOForVendor(
//     invoice: any,
//     group: {
//       name: string;
//       supplierId: string;
//     },
//     supplier: any | null,
//   ): any | null {
//     if (!supplier) {
//       return null;
//     }

//     const candidates = getLinkedPurchaseOrders(invoice);

//     const supplierId = String(supplier?.id || group.supplierId || "").trim();

//     const vendorNames = new Set(
//       [group.name, ...(supplier ? getSupplierNames(supplier) : [])]
//         .map(normalizeVendorIdentity)
//         .filter(Boolean),
//     );

//     const matched = candidates.find((po: any) => {
//       const poSupplierId = getPOVendorId(po);

//       if (supplierId && poSupplierId && supplierId === poSupplierId) {
//         return true;
//       }

//       const poVendorName = normalizeVendorIdentity(getPOVendorName(po));

//       return Boolean(poVendorName && vendorNames.has(poVendorName));
//     });

//     if (matched) {
//       return matched;
//     }

//     if (
//       candidates.length === 1 &&
//       getBudgetVendorGroups(invoice).length === 1
//     ) {
//       return candidates[0];
//     }

//     return null;
//   }

//   function getVendorPaymentEntries(
//     invoice: any,
//     group: {
//       key: string;
//       name: string;
//       vendorNames?: string[];
//       isLocalVendorGroup?: boolean;
//       supplierId: string;
//     },
//     supplier: any | null,
//   ): any[] {
//     const history = getPaymentReleaseHistory(invoice);

//     const supplierId = String(supplier?.id || group.supplierId || "").trim();

//     const isLocalVendorGroup = Boolean(
//       group.isLocalVendorGroup || group.key === COMBINED_LOCAL_VENDOR_GROUP_KEY,
//     );

//     const vendorNames = new Set(
//       [
//         group.name,

//         ...(Array.isArray(group.vendorNames) ? group.vendorNames : []),

//         ...(supplier ? getSupplierNames(supplier) : []),
//       ]
//         .map(normalizeVendorIdentity)
//         .filter(Boolean),
//     );

//     const scoped = history.filter((entry: any) => {
//       if (String(entry?.paymentVendorKey || "") === group.key) {
//         return true;
//       }

//       const entrySupplierId = getFirstTextValue([
//         entry?.paymentSupplierId,
//         entry?.supplierId,
//         entry?.vendorId,
//       ]);

//       if (
//         isLocalVendorGroup &&
//         !entrySupplierId &&
//         (entry?.combinedLocalVendorPayment === true ||
//           normalizeText(entry?.paymentScopeType) === "local_vendors_combined" ||
//           (entry?.directPaymentRelease === true &&
//             entry?.vendorExistsInDatabase !== true))
//       ) {
//         return true;
//       }

//       if (supplierId && entrySupplierId && supplierId === entrySupplierId) {
//         return true;
//       }

//       const entryVendorNames = [
//         entry?.paymentVendorName,

//         ...(Array.isArray(entry?.paymentVendorNames)
//           ? entry.paymentVendorNames
//           : []),

//         ...(Array.isArray(entry?.localVendorNames)
//           ? entry.localVendorNames
//           : []),

//         entry?.vendorName,
//         entry?.supplierName,

//         ...(Array.isArray(entry?.vendors) ? entry.vendors : []),
//       ]
//         .map(normalizeVendorIdentity)
//         .filter(Boolean);

//       return entryVendorNames.some((name) => vendorNames.has(name));
//     });

//     if (scoped.length > 0) {
//       return scoped;
//     }

//     if (getBudgetVendorGroups(invoice).length === 1) {
//       return history.filter(
//         (entry: any) =>
//           !entry?.paymentVendorKey &&
//           !entry?.paymentSupplierId &&
//           !entry?.paymentVendorName,
//       );
//     }

//     return [];
//   }

//   function getVendorWorkflowGroups(invoice: any): BudgetVendorWorkflow[] {
//     return getBudgetVendorGroups(invoice).map((group) => {
//       const supplier = findSupplierForVendorGroup(group);

//       const linkedPO = supplier
//         ? getLinkedPOForVendor(invoice, group, supplier)
//         : null;

//       const releasedAmount = roundMoney(
//         getVendorPaymentEntries(invoice, group, supplier).reduce(
//           (sum, entry) => sum + getPaymentReleaseAmount(entry),
//           0,
//         ),
//       );

//       const remainingAmount = roundMoney(
//         Math.max(group.totalAmount - releasedAmount, 0),
//       );

//       return {
//         ...group,

//         supplierId: String(supplier?.id || group.supplierId || ""),

//         supplier,

//         linkedPO,

//         releasedAmount,

//         remainingAmount,
//       };
//     });
//   }

//   function getFirstVendorName(invoice: any): string {
//     const firstGroup = getVendorWorkflowGroups(invoice)[0];

//     return firstGroup?.vendorNames?.[0] || firstGroup?.name || "";
//   }

//   function getVendorFilterText(invoice: any): string {
//     return getVendorWorkflowGroups(invoice)
//       .flatMap((group) =>
//         group.vendorNames.length > 0 ? group.vendorNames : [group.name],
//       )
//       .join(" ");
//   }

//   function canProcessVendorActions(invoice: InvoiceRequest): boolean {
//     if (!userProfile || !isFinanceApproverRole(userProfile.role)) {
//       return false;
//     }

//     if (hasPaymentReleased(invoice)) {
//       return false;
//     }

//     if ((invoice as any).expenseSubmitted) {
//       return false;
//     }

//     return [
//       "approved",
//       "po_created",
//       "po_submitted",
//       "po_approved",
//       "po_issued",
//       "ready_for_payment",
//       "payment_partially_released",
//     ].includes(normalizeText(invoice.status));
//   }

//   function canCreatePOForVendor(
//     invoice: InvoiceRequest,
//     vendor: BudgetVendorWorkflow,
//   ): boolean {
//     return Boolean(
//       canProcessVendorActions(invoice) &&
//         vendor.supplier &&
//         !vendor.linkedPO &&
//         vendor.remainingAmount > 0.009,
//     );
//   }

//   function canReleasePaymentForVendor(
//     invoice: InvoiceRequest,
//     vendor: BudgetVendorWorkflow,
//   ): boolean {
//     if (!canProcessVendorActions(invoice)) {
//       return false;
//     }

//     if (vendor.remainingAmount <= 0.009) {
//       return false;
//     }

//     return vendor.supplier ? Boolean(vendor.linkedPO) : true;
//   }

//   function handleCreatePO(
//     invoice: InvoiceRequest,
//     vendor: BudgetVendorWorkflow,
//   ) {
//     const request: any = invoice;

//     if (!vendor.supplier) {
//       toast({
//         title: "Vendor not found",

//         description:
//           "This vendor is not saved in the Supplier database. Use Direct Payment Release instead.",

//         variant: "destructive",
//       });

//       return;
//     }

//     if (vendor.linkedPO) {
//       toast({
//         title: "PO already exists",

//         description: `A Purchase Order already exists for ${vendor.name}.`,
//       });

//       return;
//     }

//     const supplierName = getSupplierDisplayName(vendor.supplier) || vendor.name;

//     const vendorGroups = getVendorWorkflowGroups(request);

//     const vendorIndex = vendorGroups.findIndex(
//       (group) => group.key === vendor.key,
//     );

//     localStorage.setItem(
//       "createPOFromBudgetRequest",
//       JSON.stringify({
//         invoiceRequestId: request.id,

//         budgetRequestDocId: request.id,

//         budgetRequestId: request.requestId,

//         requestId: request.requestId,

//         invoiceType: getRequestType(request),

//         requestType: getRequestType(request),

//         sourceType: "budget_request",

//         purchaseOrderMode: "single_vendor",

//         returnToBudgetRequests: true,

//         updateBudgetRequestAfterPO: true,

//         vendorGroupKey: vendor.key,

//         vendorIndex: Math.max(vendorIndex, 0),

//         vendorCount: vendorGroups.length,

//         estimateId: request.estimateId || "",

//         estimateNumber: getEstimateNumber(request),

//         clientName: request.clientName || "",

//         projectName: request.projectName || request.project || "",

//         project: request.project || request.projectName || "",

//         projectCode: request.projectCode || "",

//         title: request.title || request.subject || "",

//         subject: request.subject || "",

//         message: request.message || "",

//         supplierId: vendor.supplier.id || vendor.supplierId,

//         vendorId: vendor.supplier.id || vendor.supplierId,

//         supplierName,

//         vendorName: supplierName,

//         requestedVendorName: vendor.name,

//         supplierDetails: vendor.supplier,

//         supplierSnapshot: vendor.supplier,

//         vendorDatabaseRecord: vendor.supplier,

//         totalAmount: vendor.totalAmount,

//         approvedAmount: vendor.totalAmount,

//         approvalItems: vendor.items,

//         lineItems: vendor.items,

//         items: vendor.items,
//       }),
//     );

//     setLocation(CREATE_PO_ROUTE);
//   }

//   function openVendorPayment(
//     invoice: InvoiceRequest,
//     vendor: BudgetVendorWorkflow,
//   ) {
//     const request: any = invoice;

//     const isCombinedLocalVendorPayment = Boolean(
//       vendor.isLocalVendorGroup ||
//         vendor.key === COMBINED_LOCAL_VENDOR_GROUP_KEY,
//     );

//     const paymentVendorNames = [
//       ...new Set(
//         (vendor.vendorNames || [])
//           .map((name) => String(name || "").trim())
//           .filter(Boolean),
//       ),
//     ];

//     const supplierName = vendor.supplier
//       ? getSupplierDisplayName(vendor.supplier) || vendor.name
//       : isCombinedLocalVendorPayment
//         ? "Local Vendors"
//         : vendor.name;

//     setSelectedInvoice({
//       ...request,

//       invoiceNumber: request.requestId,

//       paymentScope: "vendor",

//       paymentScopeType: isCombinedLocalVendorPayment
//         ? "local_vendors_combined"
//         : "vendor",

//       combinedLocalVendorPayment: isCombinedLocalVendorPayment,

//       paymentVendorKey: vendor.key,

//       paymentVendorName: supplierName,

//       paymentVendorNames,

//       localVendorNames: isCombinedLocalVendorPayment ? paymentVendorNames : [],

//       paymentSupplierId: vendor.supplier?.id || vendor.supplierId || "",

//       paymentScopeApprovedAmount: vendor.totalAmount,

//       paymentScopeReleasedAmount: vendor.releasedAmount,

//       paymentScopeRemainingAmount: vendor.remainingAmount,

//       directPaymentRelease: !vendor.supplier,

//       vendorExistsInDatabase: Boolean(vendor.supplier),

//       vendorName: supplierName,

//       supplierName,

//       supplierId: vendor.supplier?.id || vendor.supplierId || "",

//       supplierDetails: vendor.supplier || null,

//       amount: vendor.remainingAmount,

//       dueDate: new Date(),

//       poId:
//         vendor.linkedPO?.id ||
//         vendor.linkedPO?.poId ||
//         vendor.linkedPO?.poDocId ||
//         "",

//       poNumber:
//         vendor.linkedPO?.poNumber || vendor.linkedPO?.purchaseOrderNumber || "",

//       approvalItems: vendor.items,

//       lineItems: vendor.items,

//       items: vendor.items,
//     } as any);

//     setIsPaymentModalOpen(true);
//   }

//   function getCurrentUserId() {
//     return String(
//       userProfile?.id ||
//         (userProfile as any)?.uid ||
//         (userProfile as any)?.userId ||
//         (userProfile as any)?.firebaseUid ||
//         (userProfile as any)?.authUid ||
//         userProfile?.email ||
//         "",
//     ).trim();
//   }

//   const usersByLookup = useMemo(() => {
//     const map = new Map<string, any>();

//     const allUsers = [...(users || []), ...(panelUsers || [])];

//     allUsers.forEach((user: any) => {
//       [
//         user?.id,
//         user?.uid,
//         user?.userId,
//         user?.firebaseUid,
//         user?.authUid,
//         user?.email,
//       ].forEach((key) => {
//         const lookupKey = String(key || "")
//           .trim()
//           .toLowerCase();

//         if (lookupKey) {
//           map.set(lookupKey, user);
//         }
//       });
//     });

//     return map;
//   }, [users, panelUsers]);

//   function getCurrentUserRecordFromUsersCollection() {
//     const lookupValues = [
//       userProfile?.id,
//       (userProfile as any)?.uid,
//       (userProfile as any)?.userId,
//       (userProfile as any)?.firebaseUid,
//       (userProfile as any)?.authUid,
//       userProfile?.email,
//     ];

//     for (const value of lookupValues) {
//       const lookupKey = String(value || "")
//         .trim()
//         .toLowerCase();

//       if (!lookupKey) {
//         continue;
//       }

//       const matchedUser = usersByLookup.get(lookupKey);

//       if (matchedUser) {
//         return matchedUser;
//       }
//     }

//     return null;
//   }

//   function getEffectiveCurrentUser() {
//     const userRecord = getCurrentUserRecordFromUsersCollection();

//     return {
//       ...(userRecord || {}),
//       ...(userProfile || {}),

//       id: getCurrentUserId(),

//       role: currentUserRole || userRecord?.role || "",

//       department:
//         (userProfile as any)?.department || userRecord?.department || "",
//     };
//   }

//   async function handleApprove(invoice: InvoiceRequest) {
//     if (!userProfile) {
//       return;
//     }

//     const effectiveUser = getEffectiveCurrentUser();

//     const workflow = (invoice as any)?.approvalWorkflow;

//     const levels = enrichApprovalLevelsWithRoleMetadata(
//       Array.isArray(workflow?.levels) ? workflow.levels : [],

//       workflowRoleResolutionContext.roles,

//       workflowRoleResolutionContext.users,
//     );

//     const currentLevelIndex = Number(workflow?.currentLevelIndex ?? 0);

//     const invoiceWithResolvedWorkflow = {
//       ...(invoice as any),

//       approvalWorkflow: {
//         ...workflow,
//         levels,
//       },
//     };

//     const currentLevel = getCurrentApprovalLevel(invoiceWithResolvedWorkflow);

//     if (
//       !currentLevel ||
//       !isCurrentRequestApprover(invoiceWithResolvedWorkflow, effectiveUser)
//     ) {
//       toast({
//         title: "Action not allowed",

//         description:
//           "This request is not assigned to you at the current approval level.",

//         variant: "destructive",
//       });

//       return;
//     }

//     const approvalHistory = Array.isArray((invoice as any).approvalHistory)
//       ? (invoice as any).approvalHistory
//       : [];

//     const approverId = getCurrentUserId();

//     const approverName =
//       userProfile.displayName ||
//       (userProfile as any)?.name ||
//       userProfile.email ||
//       approverId;

//     const nextLevelIndex = currentLevelIndex + 1;

//     const hasNextLevel = nextLevelIndex < levels.length;

//     const updatePayload: Record<string, any> = {
//       approvalHistory: [
//         ...approvalHistory,

//         {
//           approver: approverName,

//           approverId,

//           approverRole: getRoleKey(userProfile.role),

//           action: "approved",

//           levelId: currentLevel.id,

//           levelName: currentLevel.name,

//           levelNumber: currentLevelIndex + 1,

//           timestamp: new Date(),

//           notes: "",
//         },
//       ],

//       returnedToCreator: false,

//       needsCreatorRevision: false,

//       returnedToRole: "",

//       returnedToRoleLabel: "",

//       rejectionComment: "",

//       updatedAt: serverTimestamp(),
//     };

//     if (hasNextLevel) {
//       Object.assign(
//         updatePayload,

//         getPendingApprovalFields(
//           {
//             ...workflow,

//             levels,

//             state: "pending",
//           },

//           nextLevelIndex,
//         ),
//       );
//     } else {
//       Object.assign(updatePayload, {
//         status: "approved",

//         approvalWorkflow: {
//           ...workflow,

//           levels,

//           currentLevelIndex,

//           state: "approved",

//           completedAt: new Date(),
//         },

//         currentApprovalLevel: levels.length,

//         currentApprovalLevelId: "",

//         currentApprovalLevelName: "",

//         currentApproverUserIds: [],

//         currentApproverRoleIds: [],

//         currentApproverRoleNames: [],

//         currentApprover: "",

//         approvedAt: serverTimestamp(),

//         approvedBy: approverName,

//         approvedById: approverId,
//       });
//     }

//     try {
//       await updateDoc(
//         doc(db, "Panels", PANEL_ID, "invoiceRequests", invoice.id),
//         updatePayload,
//       );

//       toast({
//         title: hasNextLevel ? "Approval recorded" : "Request approved",

//         description: hasNextLevel
//           ? "The request has moved to the next configured approval level."
//           : "The Budget Request has completed its Budget Role approval workflow.",
//       });

//       // Approving moves this request out of "needs my action" in the sort,
//       // which can otherwise yank it off to a different page right as the
//       // Release Payment button becomes available — pin it near the top so
//       // it stays visible in place instead of appearing to vanish.
//       setRecentlyActedOnIds((prev) => {
//         const next = new Set(prev);
//         next.add(invoice.id);
//         return next;
//       });
//     } catch (error: any) {
//       console.error("Failed to approve budget request:", error);

//       toast({
//         title: "Error",

//         description: error.message || "Failed to approve budget request",

//         variant: "destructive",
//       });
//     }
//   }

//   function getBudgetRequestOwnerId(invoice: any) {
//     return String(
//       invoice?.submittedBy ||
//         invoice?.createdBy ||
//         invoice?.requestedBy ||
//         invoice?.requesterId ||
//         invoice?.userId ||
//         invoice?.uid ||
//         invoice?.createdById ||
//         invoice?.submittedById ||
//         invoice?.createdByEmail ||
//         invoice?.submittedByEmail ||
//         invoice?.email ||
//         "",
//     ).trim();
//   }

//   function isOwnBudgetRequest(invoice: any) {
//     const currentUserId = getCurrentUserId().toLowerCase();

//     const ownerId = getBudgetRequestOwnerId(invoice).toLowerCase();

//     return Boolean(currentUserId && ownerId && currentUserId === ownerId);
//   }

//   function getCurrentUserRoleRecord() {
//     const effectiveUser = getEffectiveCurrentUser();

//     const roleKey = getRoleKey(effectiveUser?.role);

//     return (roleConfigs || []).find((role: any) => {
//       return (
//         getRoleKey(role?.id) === roleKey || getRoleKey(role?.name) === roleKey
//       );
//     });
//   }

//   function getCurrentUserBudgetRequestVisibility() {
//     const userRecord = getCurrentUserRecordFromUsersCollection();

//     const roleRecord = getCurrentUserRoleRecord();

//     return getEffectiveBudgetRequestVisibility({
//       userRecord: {
//         ...(userRecord || {}),

//         budgetRequestVisibility:
//           (userProfile as any)?.budgetRequestVisibility ||
//           userRecord?.budgetRequestVisibility,

//         canViewAllBudgetRequests:
//           (userProfile as any)?.canViewAllBudgetRequests ??
//           userRecord?.canViewAllBudgetRequests,
//       },

//       roleRecord,
//     });
//   }

//   function canCurrentUserAccessBudgetRequest(invoice: any) {
//     return canUserViewBudgetRequest({
//       request: invoice,

//       user: getEffectiveCurrentUser(),

//       visibility: getCurrentUserBudgetRequestVisibility(),
//     });
//   }

//   function getUserRoleLabel(user: any): string {
//     const role = getFirstTextValue([
//       user?.role,
//       user?.userRole,
//       user?.departmentRole,
//       user?.department,
//       user?.team,
//     ]);

//     return getRoleKey(role);
//   }

//   function getBudgetRequestOwnerRole(invoice: any): string {
//     const directRole = getDirectReturnedRole(invoice);

//     if (directRole) {
//       return directRole;
//     }

//     const ownerLookupValues = [
//       invoice?.createdBy,
//       invoice?.submittedBy,
//       invoice?.requestedBy,
//       invoice?.requesterId,
//       invoice?.createdById,
//       invoice?.submittedById,
//       invoice?.userId,
//       invoice?.uid,
//       invoice?.createdByEmail,
//       invoice?.submittedByEmail,
//       invoice?.email,
//     ];

//     for (const value of ownerLookupValues) {
//       const lookupKey = String(value || "")
//         .trim()
//         .toLowerCase();

//       if (!lookupKey) {
//         continue;
//       }

//       const matchedUser = usersByLookup.get(lookupKey);

//       const matchedRole = getUserRoleLabel(matchedUser);

//       if (matchedRole) {
//         return matchedRole;
//       }
//     }

//     const currentUserLookupValues = [
//       userProfile?.id,
//       (userProfile as any)?.uid,
//       (userProfile as any)?.userId,
//       (userProfile as any)?.firebaseUid,
//       (userProfile as any)?.authUid,
//       userProfile?.email,
//     ]
//       .map((value) =>
//         String(value || "")
//           .trim()
//           .toLowerCase(),
//       )
//       .filter(Boolean);

//     const isCurrentUserOwner = ownerLookupValues
//       .map((value) =>
//         String(value || "")
//           .trim()
//           .toLowerCase(),
//       )
//       .filter(Boolean)
//       .some((ownerKey) => currentUserLookupValues.includes(ownerKey));

//     if (isCurrentUserOwner) {
//       return getRoleKey(userProfile?.role);
//     }

//     return "";
//   }

//   async function handleReject(
//     invoice: InvoiceRequest,
//     rejectionComment: string,
//   ) {
//     if (!userProfile) {
//       return;
//     }

//     const effectiveUser = getEffectiveCurrentUser();

//     const workflow = (invoice as any)?.approvalWorkflow;

//     const levels = enrichApprovalLevelsWithRoleMetadata(
//       Array.isArray(workflow?.levels) ? workflow.levels : [],

//       workflowRoleResolutionContext.roles,

//       workflowRoleResolutionContext.users,
//     );

//     const currentLevelIndex = Number(workflow?.currentLevelIndex ?? 0);

//     const resolvedInvoice = {
//       ...(invoice as any),

//       approvalWorkflow: {
//         ...workflow,
//         levels,
//       },
//     };

//     const currentLevel = getCurrentApprovalLevel(resolvedInvoice);

//     if (
//       !currentLevel ||
//       !isCurrentRequestApprover(resolvedInvoice, effectiveUser)
//     ) {
//       toast({
//         title: "Action not allowed",

//         description:
//           "This request is not assigned to you at the current approval level.",

//         variant: "destructive",
//       });

//       return;
//     }

//     const ownerId = getBudgetRequestOwnerId(invoice);

//     const returnedToRole = getBudgetRequestOwnerRole(invoice);

//     const returnedToRoleLabel = formatRoleLabel(returnedToRole);

//     const roleKey = getRoleKey(userProfile.role);

//     const approvalHistory = Array.isArray((invoice as any).approvalHistory)
//       ? (invoice as any).approvalHistory
//       : [];

//     setRejectionLoading(true);

//     try {
//       await updateDoc(
//         doc(db, "Panels", PANEL_ID, "invoiceRequests", invoice.id),
//         {
//           status: "rejected",

//           approvalWorkflow: {
//             ...workflow,

//             levels,

//             currentLevelIndex,

//             state: "returned",
//           },

//           currentApprovalLevel: 0,

//           currentApprovalLevelId: "",

//           currentApprovalLevelName: "",

//           currentApproverUserIds: [],

//           currentApproverRoleIds: [],

//           currentApproverRoleNames: [],

//           currentApprover: ownerId,

//           returnedToRole,

//           returnedToRoleLabel,

//           returnedToCreator: true,

//           needsCreatorRevision: true,

//           rejectionComment,

//           rejectedAt: serverTimestamp(),

//           rejectedBy: userProfile.displayName || userProfile.email || "",

//           rejectedByRole: roleKey,

//           approvalHistory: [
//             ...approvalHistory,

//             {
//               approver:
//                 userProfile.displayName ||
//                 (userProfile as any)?.name ||
//                 userProfile.email ||
//                 roleKey,

//               approverId: getCurrentUserId(),

//               approverRole: roleKey,

//               action: "rejected",

//               levelId: currentLevel.id,

//               levelName: currentLevel.name,

//               levelNumber: currentLevelIndex + 1,

//               timestamp: new Date(),

//               notes: rejectionComment,
//             },
//           ],

//           updatedAt: serverTimestamp(),
//         },
//       );

//       toast({
//         title: "Request returned",

//         description: `Budget request has been sent back to ${
//           returnedToRoleLabel || "the requester"
//         } for changes.`,
//       });

//       setIsRejectionModalOpen(false);

//       setSelectedInvoice(null);
//     } catch (error: any) {
//       console.error("Failed to reject budget request:", error);

//       toast({
//         title: "Error",

//         description: error.message || "Failed to reject budget request",

//         variant: "destructive",
//       });
//     } finally {
//       setRejectionLoading(false);
//     }
//   }

//   function getBudgetRequestStatusLabel(invoice: any): string {
//     if (wasReturnedToCreator(invoice)) {
//       const role = getBudgetRequestOwnerRole(invoice);

//       const savedRoleLabel = getFirstTextValue([
//         invoice?.returnedToRoleLabel,
//         invoice?.returnToRoleLabel,
//       ]);

//       const roleLabel = savedRoleLabel || formatRoleLabel(role);

//       return roleLabel ? `Returned To ${roleLabel}` : "Returned To Role";
//     }

//     if (normalizeText(invoice?.status) === "pending_approval") {
//       return getWorkflowStatusLabel(invoice, workflowRoleResolutionContext);
//     }

//     return getStatusLabel(invoice?.status || "", invoice);
//   }

//   function getStatusBadgeColor(status: string, invoice?: any): string {
//     if (invoice && wasReturnedToCreator(invoice)) {
//       return "border-red-200 bg-red-50 text-red-700";
//     }

//     switch (status) {
//       case "approved":
//       case "payment_released":
//       case "bill_submitted_without_bill":
//       case "bill_received_by_finance":
//       case "expense_submitted":
//       case "expense_completed":
//         return "border-green-200 bg-green-50 text-green-700";

//       case "bill_submitted_to_finance":
//         return "border-cyan-200 bg-cyan-50 text-cyan-700";

//       case "rejected":
//       case "returned_to_creator":
//       case "changes_requested":
//         return "border-red-200 bg-red-50 text-red-700";

//       case "pending_workflow_configuration":
//         return "border-violet-200 bg-violet-50 text-violet-700";

//       case "pending_operational_admin":
//       case "pending_main_admin":
//       case "pending_admin":
//       case "pending_finance":
//       case "pending_approval":
//         return "border-amber-200 bg-amber-50 text-amber-700";

//       case "payment_partially_released":
//         return "border-blue-200 bg-blue-50 text-blue-700";

//       default:
//         return "border-slate-200 bg-slate-50 text-slate-700";
//     }
//   }

//   function getCurrentStep(invoice: InvoiceRequest): string {
//     const status = normalizeText(invoice.status || "");

//     if (status === "pending_workflow_configuration") {
//       const budgetRole = getRequestBudgetRoleName(invoice);

//       return budgetRole
//         ? `Configure ${budgetRole} Budget Role Workflow`
//         : "Budget Role Workflow Not Configured";
//     }

//     if (hasBeenSubmittedWithoutBill(invoice)) {
//       return "Submitted Without Bill / Admin Notified";
//     }

//     if (hasFinanceReceivedBill(invoice)) {
//       return "Bill Received by Finance / Admin Notified";
//     }

//     if (hasBillBeenSubmittedToFinance(invoice)) {
//       return "Bill Submitted to Finance / Waiting for Finance Confirmation";
//     }

//     if (hasPaymentReleased(invoice)) {
//       return "Payment Released / Finance to Submit Bill or Submit Without Bill";
//     }

//     if (
//       (invoice as any).expenseSubmitted ||
//       status === "expense_submitted" ||
//       hasExpenseSheet(invoice)
//     ) {
//       return "Expense Submitted / No Approval Required";
//     }

//     const vendorWorkflows = getVendorWorkflowGroups(invoice);

//     const pendingPOCount = vendorWorkflows.filter(
//       (vendor) =>
//         vendor.supplier && !vendor.linkedPO && vendor.remainingAmount > 0.009,
//     ).length;

//     const directPaymentCount = vendorWorkflows.filter(
//       (vendor) => !vendor.supplier && vendor.remainingAmount > 0.009,
//     ).length;

//     if (pendingPOCount > 0) {
//       return `${pendingPOCount} Vendor PO${
//         pendingPOCount === 1 ? "" : "s"
//       } Pending`;
//     }

//     if (directPaymentCount > 0) {
//       return `${directPaymentCount} Direct Payment${
//         directPaymentCount === 1 ? "" : "s"
//       } Pending`;
//     }

//     if (hasPartialPaymentReleased(invoice)) {
//       return `Partial Payment Released / Remaining Rs ${formatPKR(
//         getRemainingPaymentBalance(invoice),
//       )}`;
//     }

//     if (vendorWorkflows.some((vendor) => vendor.linkedPO)) {
//       return "Vendor PO Created / Ready for Payment";
//     }

//     if (wasReturnedToCreator(invoice)) {
//       return `${getBudgetRequestStatusLabel(
//         invoice,
//       )} / Waiting for Resubmission`;
//     }

//     switch (status) {
//       case "pending_approval":
//         return (
//           getCurrentApproverRoleLabel(invoice, workflowRoleResolutionContext) ||
//           "Pending Approval"
//         );

//       case "pending_operational_admin":
//       case "pending_main_admin":
//       case "pending_admin":
//         return "Admin Approval";

//       case "pending_finance":
//         return "Finance Approval";

//       case "approved":
//         return "Vendor Validation / Action Required";

//       case "po_created":
//       case "po_submitted":
//       case "po_approved":
//       case "po_issued":
//       case "ready_for_payment":
//         return "PO Created / Ready for Payment";

//       case "payment_partially_released":
//         return `Partial Payment Released / Remaining Rs ${formatPKR(
//           getRemainingPaymentBalance(invoice),
//         )}`;

//       case "payment_released":
//         return "Payment Released / Finance to Submit Bill or Submit Without Bill";

//       case "bill_submitted_to_finance":
//         return "Bill Submitted to Finance / Waiting for Finance Confirmation";

//       case "bill_submitted_without_bill":
//         return "Submitted Without Bill / Admin Notified";

//       case "bill_received_by_finance":
//         return "Bill Received by Finance / Admin Notified";

//       case "expense_submitted":
//       case "expense_completed":
//         return "Expense Submitted / No Approval Required";

//       case "rejected":
//       case "returned_to_creator":
//       case "changes_requested":
//         return getBudgetRequestStatusLabel(invoice);

//       default:
//         return "Unknown";
//     }
//   }

//   function canApprove(invoice: InvoiceRequest): boolean {
//     if (!userProfile) {
//       return false;
//     }

//     return isCurrentRequestApprover(invoice, getEffectiveCurrentUser());
//   }

//   function canEdit(invoice: InvoiceRequest): boolean {
//     if (!isOwnBudgetRequest(invoice)) {
//       return false;
//     }

//     if (wasReturnedToCreator(invoice)) {
//       return true;
//     }

//     if (hasAdminApprovedBudgetRequest(invoice)) {
//       return false;
//     }

//     const status = normalizeText(invoice.status);

//     const workflowHistory = Array.isArray((invoice as any)?.approvalHistory)
//       ? (invoice as any).approvalHistory
//       : [];

//     return (
//       status === "draft" ||
//       status === "" ||
//       status === "pending_workflow_configuration" ||
//       (status === "pending_approval" && workflowHistory.length === 0) ||
//       status === "pending_main_admin" ||
//       status === "pending_admin" ||
//       status === "pending_operational_admin"
//     );
//   }

//   function getEditableInvoice(invoice: InvoiceRequest): InvoiceRequest {
//     if (!wasReturnedToCreator(invoice)) {
//       return invoice;
//     }

//     const existingWorkflow = (invoice as any)?.approvalWorkflow;

//     const budgetRoleConfig = getBudgetWorkflowConfigForRequest(invoice);

//     const hasExistingLevels =
//       existingWorkflow &&
//       Array.isArray(existingWorkflow?.levels) &&
//       existingWorkflow.levels.length > 0;

//     let snapshot: any = null;

//     if (
//       budgetRoleConfig &&
//       budgetRoleConfig.enabled !== false &&
//       budgetRoleConfig.levels.length > 0
//     ) {
//       snapshot = createBudgetRoleWorkflowSnapshot(budgetRoleConfig);
//     } else if (hasExistingLevels) {
//       snapshot = {
//         ...existingWorkflow,

//         levels: sanitizeApprovalLevels(existingWorkflow.levels),

//         currentLevelIndex: 0,

//         state: "pending" as const,
//       };
//     }

//     if (!snapshot) {
//       const budgetRole = getRequestBudgetRoleName(invoice);

//       toast({
//         title: "Budget Role workflow not configured",

//         description: budgetRole
//           ? `Configure the Budget Request approval workflow for Budget Role ${budgetRole} before resubmitting.`
//           : "Configure a Budget Role workflow before resubmitting this request.",

//         variant: "destructive",
//       });

//       return invoice;
//     }

//     return {
//       ...(invoice as any),

//       ...getPendingApprovalFields(snapshot, 0),

//       returnedToCreator: false,

//       needsCreatorRevision: false,

//       returnedToRole: "",

//       returnedToRoleLabel: "",

//       rejectionComment: "",

//       resubmittedAt: new Date(),
//     } as InvoiceRequest;
//   }

//   function canReleasePayment(invoice: InvoiceRequest): boolean {
//     return getVendorWorkflowGroups(invoice).some((vendor) =>
//       canReleasePaymentForVendor(invoice, vendor),
//     );
//   }

//   function canSubmitExpense(invoice: InvoiceRequest): boolean {
//     if (
//       (invoice as any).expenseSubmitted ||
//       String(invoice.status) === "expense_submitted"
//     ) {
//       return false;
//     }

//     return canShowExpenseAction(invoice) && !hasExpenseSheet(invoice);
//   }

//   function getExpenseSheetStatus(invoice: InvoiceRequest): string | null {
//     if (
//       (invoice as any).expenseSubmitted ||
//       String(invoice.status) === "expense_submitted"
//     ) {
//       return "submitted";
//     }

//     const expenseSheet = expenseSheets?.find((expense: any) =>
//       isExpenseLinkedToRequest(expense, invoice),
//     );

//     return expenseSheet?.status || expenseSheet?.expenseStatus || null;
//   }

//   const canCreateInvoices = canRoleCreateBudgetRequest(currentUserRole);

//   function getCurrentUserBudgetRole() {
//     const effectiveUser = getEffectiveCurrentUser();

//     return String(effectiveUser?.role || currentUserRole || "").trim();
//   }

//   function getCurrentUserBudgetRoleWorkflow() {
//     return getBudgetWorkflowConfigForRole(getCurrentUserBudgetRole());
//   }

//   const creatorNamesByLookup = useMemo(() => {
//     const map = new Map<string, string>();

//     (invoices || []).forEach((invoice: any) => {
//       const name = getFirstTextValue([
//         getSafeDisplayText(invoice?.createdByName),

//         getSafeDisplayText(invoice?.submittedByName),

//         getSafeDisplayText(invoice?.requestedByName),

//         getSafeDisplayText(invoice?.requesterName),

//         getSafeDisplayText(invoice?.creatorName),

//         getSafeDisplayText(invoice?.createdByDisplayName),

//         getSafeDisplayText(invoice?.submittedByDisplayName),

//         getSafeDisplayText(invoice?.userName),

//         getSafeDisplayText(invoice?.displayName),

//         getSafeDisplayText(invoice?.employeeName),

//         getSafeDisplayText(invoice?.name),
//       ]);

//       if (!name) {
//         return;
//       }

//       [
//         invoice?.createdBy,
//         invoice?.submittedBy,
//         invoice?.requestedBy,
//         invoice?.requesterId,
//         invoice?.createdById,
//         invoice?.submittedById,
//         invoice?.userId,
//         invoice?.uid,
//         invoice?.createdByEmail,
//         invoice?.submittedByEmail,
//         invoice?.email,
//       ].forEach((key) => {
//         const lookupKey = String(key || "")
//           .trim()
//           .toLowerCase();

//         if (lookupKey && !map.has(lookupKey)) {
//           map.set(lookupKey, name);
//         }
//       });
//     });

//     return map;
//   }, [invoices]);

//   function getCreatedByName(invoice: any): string {
//     const directName = getFirstTextValue([
//       getSafeDisplayText(invoice?.createdByName),

//       getSafeDisplayText(invoice?.submittedByName),

//       getSafeDisplayText(invoice?.requestedByName),

//       getSafeDisplayText(invoice?.requesterName),

//       getSafeDisplayText(invoice?.creatorName),

//       getSafeDisplayText(invoice?.createdByDisplayName),

//       getSafeDisplayText(invoice?.submittedByDisplayName),

//       getSafeDisplayText(invoice?.userName),

//       getSafeDisplayText(invoice?.displayName),

//       getSafeDisplayText(invoice?.employeeName),

//       getSafeDisplayText(invoice?.name),
//     ]);

//     if (directName) {
//       return directName;
//     }

//     const lookupValues = [
//       invoice?.createdBy,
//       invoice?.submittedBy,
//       invoice?.requestedBy,
//       invoice?.requesterId,
//       invoice?.createdById,
//       invoice?.submittedById,
//       invoice?.userId,
//       invoice?.uid,
//       invoice?.createdByEmail,
//       invoice?.submittedByEmail,
//       invoice?.email,
//     ];

//     for (const value of lookupValues) {
//       const rawKey = String(value || "").trim();

//       const lookupKey = rawKey.toLowerCase();

//       if (!lookupKey) {
//         continue;
//       }

//       const overrideName = getSafeDisplayText(
//         CREATOR_NAME_OVERRIDES[rawKey] || CREATOR_NAME_OVERRIDES[lookupKey],
//       );

//       if (overrideName) {
//         return overrideName;
//       }

//       const nameFromAnotherRequest = getSafeDisplayText(
//         creatorNamesByLookup.get(lookupKey),
//       );

//       if (nameFromAnotherRequest) {
//         return nameFromAnotherRequest;
//       }

//       const matchedUser = usersByLookup.get(lookupKey);

//       const matchedUserName = getFirstTextValue([
//         getSafeDisplayText(matchedUser?.displayName),

//         getSafeDisplayText(matchedUser?.name),

//         getSafeDisplayText(matchedUser?.fullName),

//         getSafeDisplayText(matchedUser?.email),
//       ]);

//       if (matchedUserName) {
//         return matchedUserName;
//       }
//     }

//     const currentUserLookupValues = [
//       userProfile?.id,
//       (userProfile as any)?.uid,
//       (userProfile as any)?.userId,
//       (userProfile as any)?.firebaseUid,
//       (userProfile as any)?.authUid,
//       userProfile?.email,
//     ]
//       .map((value) =>
//         String(value || "")
//           .trim()
//           .toLowerCase(),
//       )
//       .filter(Boolean);

//     const isCurrentUserOwner = lookupValues
//       .map((value) =>
//         String(value || "")
//           .trim()
//           .toLowerCase(),
//       )
//       .filter(Boolean)
//       .some((ownerKey) => currentUserLookupValues.includes(ownerKey));

//     if (isCurrentUserOwner) {
//       const currentUserName = getFirstTextValue([
//         getSafeDisplayText(userProfile?.displayName),

//         getSafeDisplayText((userProfile as any)?.name),

//         getSafeDisplayText((userProfile as any)?.fullName),

//         getSafeDisplayText(userProfile?.email),
//       ]);

//       if (currentUserName) {
//         return currentUserName;
//       }
//     }

//     const emailFallback = getFirstTextValue([
//       getSafeDisplayText(invoice?.createdByEmail),

//       getSafeDisplayText(invoice?.submittedByEmail),

//       getSafeDisplayText(invoice?.email),
//     ]);

//     return emailFallback || "Unknown User";
//   }

//   function getInvoiceWithCreator(invoice: InvoiceRequest): InvoiceRequest {
//     const createdByName = getCreatedByName(invoice);

//     const returnedToRole = wasReturnedToCreator(invoice)
//       ? getBudgetRequestOwnerRole(invoice)
//       : getDirectReturnedRole(invoice);

//     const returnedToRoleLabel = formatRoleLabel(returnedToRole);

//     return {
//       ...(invoice as any),

//       createdByName,

//       submittedByName: (invoice as any)?.submittedByName || createdByName,

//       requestedByName: (invoice as any)?.requestedByName || createdByName,

//       returnedToRole,

//       returnedToRoleLabel,
//     } as InvoiceRequest;
//   }

//   function openDetailsModal(invoice: InvoiceRequest) {
//     setSelectedInvoice(getInvoiceWithCreator(invoice));

//     setIsDetailsModalOpen(true);
//   }

//   function handlePrintPreview(invoice: InvoiceRequest) {
//     const printableInvoice = getInvoiceWithCreator(invoice);

//     const opened = openBudgetRequestPrintPreview({
//       invoice: printableInvoice,

//       createdByName: getCreatedByName(printableInvoice),

//       requestType: getRequestType(printableInvoice),

//       statusLabel: getBudgetRequestStatusLabel(printableInvoice),

//       vendorName: getVendorFilterText(printableInvoice),
//     });

//     if (!opened) {
//       toast({
//         title: "Print preview blocked",

//         description:
//           "Please allow pop-ups for this website, then try opening the print preview again.",

//         variant: "destructive",
//       });
//     }
//   }

//   const visibleInvoicesForFilterOptions = useMemo(() => {
//     return (invoices || []).filter((invoice: any) =>
//       canCurrentUserAccessBudgetRequest(invoice),
//     );
//   }, [
//     invoices,
//     userProfile,
//     currentUserRole,
//     roleConfigs,
//     usersByLookup,
//     panelUsers,
//   ]);

//   const createdByOptions = useMemo(() => {
//     const names: string[] = Array.from(
//       new Set<string>(
//         visibleInvoicesForFilterOptions
//           .map((invoice: any) => getCreatedByName(invoice))
//           .filter((name) => String(name || "").trim()),
//       ),
//     );

//     return names.sort((a, b) => a.localeCompare(b));
//   }, [visibleInvoicesForFilterOptions, usersByLookup, creatorNamesByLookup]);

//   const statusOptions = useMemo(() => {
//     const uniqueStatuses = Array.from(
//       new Set<string>(
//         (invoices || [])
//           .map((invoice: any) => String(invoice?.status || "").trim())
//           .filter(Boolean),
//       ),
//     );

//     return uniqueStatuses.sort();
//   }, [invoices]);

//   const filteredInvoices = useMemo(() => {
//     const search = normalizeText(searchTerm);

//     const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;

//     const toDate = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

//     return (invoices || []).filter((invoice: any) => {
//       if (!canCurrentUserAccessBudgetRequest(invoice)) {
//         return false;
//       }

//       const requestType = getRequestType(invoice);

//       const requestDate = getRequestDate(invoice);

//       const requestDateInputValue = getDateInputValue(requestDate);

//       const createdByName = getCreatedByName(invoice);

//       const projectCode = String(invoice?.projectCode || "").trim();

//       const vendorName = getVendorFilterText(invoice);

//       const chequeFilterText = getChequeFilterText(invoice);

//       const descriptionSearchText = getDescriptionSearchText(invoice);

//       const estimateNumber = getEstimateNumber(invoice);

//       const budgetRole = getRequestBudgetRoleName(invoice);

//       const haystack = normalizeText(
//         [
//           invoice.requestId,
//           invoice.title,
//           invoice.subject,
//           invoice.clientName,
//           invoice.projectName,
//           invoice.project,
//           projectCode,
//           invoice.totalAmount,
//           invoice.approvedAmount,
//           invoice.vendorName,
//           invoice.supplierName,
//           vendorName,
//           estimateNumber,
//           chequeFilterText,
//           descriptionSearchText,
//           budgetRole,
//           createdByName,
//           invoice.createdByName,
//           invoice.submittedByName,
//           invoice.requestedByName,
//           invoice.createdByEmail,
//           invoice.submittedByEmail,
//         ].join(" "),
//       );

//       const matchesSearch = !search || haystack.includes(search);

//       const matchesType = typeFilter === "all" || requestType === typeFilter;

//       const matchesStatus =
//         statusFilter === "all" ||
//         normalizeText(invoice.status) === statusFilter;

//       const matchesCreatedBy =
//         createdByFilter === "all" || createdByName === createdByFilter;

//       const matchesProjectCode =
//         !projectCodeFilter ||
//         normalizeText(projectCode).includes(normalizeText(projectCodeFilter));

//       const matchesVendor =
//         !vendorFilter ||
//         normalizeText(vendorName).includes(normalizeText(vendorFilter));

//       const matchesEstimate =
//         !estimateFilter ||
//         normalizeText(estimateNumber).includes(normalizeText(estimateFilter));

//       const matchesCheque =
//         !chequeFilter ||
//         normalizeText(chequeFilterText).includes(normalizeText(chequeFilter));

//       let matchesDate = true;

//       if (fromDate && (!requestDate || requestDate < fromDate)) {
//         matchesDate = false;
//       }

//       if (toDate && (!requestDate || requestDate > toDate)) {
//         matchesDate = false;
//       }

//       const matchesMonth =
//         !monthFilter || requestDateInputValue.startsWith(monthFilter);

//       return (
//         matchesSearch &&
//         matchesType &&
//         matchesStatus &&
//         matchesCreatedBy &&
//         matchesProjectCode &&
//         matchesVendor &&
//         matchesEstimate &&
//         matchesCheque &&
//         matchesDate &&
//         matchesMonth
//       );
//     });
//   }, [
//     invoices,
//     searchTerm,
//     typeFilter,
//     statusFilter,
//     dateFrom,
//     dateTo,
//     monthFilter,
//     createdByFilter,
//     projectCodeFilter,
//     vendorFilter,
//     estimateFilter,
//     chequeFilter,
//     userProfile,
//     currentUserRole,
//     roleConfigs,
//     usersByLookup,
//     purchaseOrders,
//     suppliers,
//   ]);

//   const sortedInvoices = useMemo(() => {
//     const invoicesToSort = [...filteredInvoices];

//     if (sortOrder === "default") {
//       return invoicesToSort.sort((a, b) => {
//         const aPinned = recentlyActedOnIds.has(a.id);
//         const bPinned = recentlyActedOnIds.has(b.id);

//         if (aPinned !== bPinned) {
//           return aPinned ? -1 : 1;
//         }

//         const aAssignedRank = canApprove(a) ? 0 : 1;

//         const bAssignedRank = canApprove(b) ? 0 : 1;

//         if (aAssignedRank !== bAssignedRank) {
//           return aAssignedRank - bAssignedRank;
//         }

//         return compareBudgetRequestsForTable(
//           a,
//           b,
//           currentUserRole,
//           canReleasePayment,
//         );
//       });
//     }

//     return invoicesToSort.sort((a, b) => {
//       const comparison = compareRequestIdsAscending(a, b);

//       return sortOrder === "ascending" ? comparison : -comparison;
//     });
//   }, [
//     filteredInvoices,
//     currentUserRole,
//     purchaseOrders,
//     suppliers,
//     userProfile,
//     panelUsers,
//     users,
//     roleConfigs,
//     sortOrder,
//     recentlyActedOnIds,
//   ]);

//   const summary = useMemo(() => {
//     return filteredInvoices.reduce(
//       (acc, invoice: any) => {
//         const type = getRequestType(invoice);

//         if (type === "project") {
//           acc.projectCount += 1;
//         }

//         if (type === "general") {
//           acc.generalCount += 1;
//         }

//         if (type === "asset") {
//           acc.assetCount += 1;
//         }

//         acc.totalAmount += safeNumber(invoice?.totalAmount || invoice?.amount);

//         if (normalizeText(invoice?.status) === "approved") {
//           acc.approvedCount += 1;
//         }

//         if (normalizeText(invoice?.status) === "pending_approval") {
//           acc.pendingCount += 1;
//         }

//         return acc;
//       },

//       {
//         projectCount: 0,

//         generalCount: 0,

//         assetCount: 0,

//         totalAmount: 0,

//         approvedCount: 0,

//         pendingCount: 0,
//       },
//     );
//   }, [filteredInvoices]);

//   const totalPages = Math.max(1, Math.ceil(sortedInvoices.length / pageSize));

//   const startIndex = (currentPage - 1) * pageSize;

//   const paginatedInvoices = sortedInvoices.slice(
//     startIndex,
//     startIndex + pageSize,
//   );

//   const showingFrom = sortedInvoices.length === 0 ? 0 : startIndex + 1;

//   const showingTo = Math.min(
//     startIndex + pageSize,

//     sortedInvoices.length,
//   );

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [
//     searchTerm,
//     typeFilter,
//     statusFilter,
//     dateFrom,
//     dateTo,
//     monthFilter,
//     createdByFilter,
//     projectCodeFilter,
//     vendorFilter,
//     estimateFilter,
//     chequeFilter,
//     pageSize,
//     sortOrder,
//   ]);

//   useEffect(() => {
//     if (currentPage > totalPages) {
//       setCurrentPage(totalPages);
//     }
//   }, [currentPage, totalPages]);

//   function clearFilters() {
//     setSearchTerm("");

//     setTypeFilter("all");

//     setStatusFilter("all");

//     setDateFrom("");

//     setDateTo("");

//     setMonthFilter("");

//     setCreatedByFilter("all");

//     setProjectCodeFilter("");

//     setVendorFilter("");

//     setEstimateFilter("");

//     setChequeFilter("");

//     setPageSize(10);

//     setSortOrder("default");
//   }

//   function getVisiblePages() {
//     const pages: number[] = [];

//     const firstPage = Math.max(1, currentPage - 2);

//     const lastPage = Math.min(totalPages, currentPage + 2);

//     for (let page = firstPage; page <= lastPage; page += 1) {
//       pages.push(page);
//     }

//     return pages;
//   }

//   function openNewRequest() {
//     const budgetRole = getCurrentUserBudgetRole();

//     if (!budgetRole) {
//       toast({
//         title: "Role required",

//         description:
//           "Your user account does not have a Role assigned. Assign a Role in User Management before creating a Budget Request.",

//         variant: "destructive",
//       });

//       return;
//     }

//     const budgetRoleWorkflow = getCurrentUserBudgetRoleWorkflow();

//     if (
//       !budgetRoleWorkflow ||
//       budgetRoleWorkflow.enabled === false ||
//       budgetRoleWorkflow.levels.length === 0
//     ) {
//       toast({
//         title: "Budget Role workflow not configured",

//         description: `Ask an administrator to configure the Budget Request approval workflow for Budget Role ${formatRoleLabel(
//           budgetRole,
//         )} before creating a request.`,

//         variant: "destructive",
//       });

//       return;
//     }

//     setSelectedInvoice(null);

//     setIsInvoiceModalOpen(true);
//   }

//   if (loading) {
//     return (
//       <div className="flex h-64 items-center justify-center">
//         <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-slate-50/60 px-4 py-6 sm:px-6 lg:px-8">
//       <div className="mx-auto space-y-6">
//         <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
//           <div>
//             <h1 className="text-2xl font-bold tracking-tight text-slate-950">
//               Budget Requests
//             </h1>

//             <p className="mt-2 max-w-2xl text-sm text-slate-500">
//               Review Project, General, and Asset budget requests, follow each
//               Budget Role's configured approval hierarchy, release payments, or
//               create POs.
//             </p>
//           </div>

//           {canCreateInvoices && (
//             <Button
//               className="h-11 rounded-2xl px-5 shadow-sm"
//               onClick={openNewRequest}
//               data-testid="button-new-invoice-request"
//             >
//               + New Request
//             </Button>
//           )}
//         </div>

//         <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
//           <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//             <CardContent className="p-5">
//               <p className="text-sm font-medium text-slate-500">
//                 Filtered Requests
//               </p>

//               <p className="mt-3 text-3xl font-semibold text-slate-950">
//                 {filteredInvoices.length}
//               </p>

//               <p className="mt-1 text-xs text-slate-400">
//                 Total records after filters
//               </p>
//             </CardContent>
//           </Card>

//           <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//             <CardContent className="p-5">
//               <p className="text-sm font-medium text-slate-500">
//                 Project Requests
//               </p>

//               <p className="mt-3 text-3xl font-semibold text-slate-950">
//                 {summary.projectCount}
//               </p>

//               <p className="mt-1 text-xs text-slate-400">
//                 PO flow after approval
//               </p>
//             </CardContent>
//           </Card>

//           <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//             <CardContent className="p-5">
//               <p className="text-sm font-medium text-slate-500">
//                 General Requests
//               </p>

//               <p className="mt-3 text-3xl font-semibold text-slate-950">
//                 {summary.generalCount}
//               </p>

//               <p className="mt-1 text-xs text-slate-400">
//                 Payment release flow
//               </p>
//             </CardContent>
//           </Card>

//           <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//             <CardContent className="p-5">
//               <p className="text-sm font-medium text-slate-500">
//                 Asset Requests
//               </p>

//               <p className="mt-3 text-3xl font-semibold text-slate-950">
//                 {summary.assetCount}
//               </p>

//               <p className="mt-1 text-xs text-slate-400">
//                 Dynamic vendor workflow
//               </p>
//             </CardContent>
//           </Card>

//           <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//             <CardContent className="p-5">
//               <p className="text-sm font-medium text-slate-500">
//                 Filtered Value
//               </p>

//               <p className="mt-3 text-2xl font-semibold text-slate-950">
//                 Rs {formatPKR(summary.totalAmount)}
//               </p>

//               <p className="mt-1 text-xs text-slate-400">
//                 Pending approvals: {summary.pendingCount}
//               </p>
//             </CardContent>
//           </Card>
//         </div>

//         <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//           <CardContent className="p-5">
//             <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
//               <div className="xl:col-span-2">
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Search
//                 </label>

//                 <input
//                   value={searchTerm}
//                   onChange={(event) => setSearchTerm(event.target.value)}
//                   placeholder="Request ID, title, description, Budget Role..."
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Type
//                 </label>

//                 <select
//                   value={typeFilter}
//                   onChange={(event) =>
//                     setTypeFilter(
//                       event.target.value as "all" | BudgetRequestType,
//                     )
//                   }
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none"
//                 >
//                   <option value="all">All Types</option>

//                   <option value="project">Project</option>

//                   <option value="general">General</option>

//                   <option value="asset">Asset</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Status
//                 </label>

//                 <select
//                   value={statusFilter}
//                   onChange={(event) => setStatusFilter(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none"
//                 >
//                   <option value="all">All Statuses</option>

//                   {statusOptions.map((status) => (
//                     <option key={status} value={normalizeText(status)}>
//                       {getStatusLabel(status)}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Created By
//                 </label>

//                 <select
//                   value={createdByFilter}
//                   onChange={(event) => setCreatedByFilter(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none"
//                 >
//                   <option value="all">All Users</option>

//                   {createdByOptions.map((name) => (
//                     <option key={name} value={name}>
//                       {name}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Project Code
//                 </label>

//                 <input
//                   value={projectCodeFilter}
//                   onChange={(event) => setProjectCodeFilter(event.target.value)}
//                   placeholder="Project code"
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Vendor
//                 </label>

//                 <input
//                   value={vendorFilter}
//                   onChange={(event) => setVendorFilter(event.target.value)}
//                   placeholder="Vendor"
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Estimate No
//                 </label>

//                 <input
//                   value={estimateFilter}
//                   onChange={(event) => setEstimateFilter(event.target.value)}
//                   placeholder="Estimate number"
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Cheque No
//                 </label>

//                 <input
//                   value={chequeFilter}
//                   onChange={(event) => setChequeFilter(event.target.value)}
//                   placeholder="Cheque number"
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Date From
//                 </label>

//                 <input
//                   type="date"
//                   value={dateFrom}
//                   onChange={(event) => setDateFrom(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Date To
//                 </label>

//                 <input
//                   type="date"
//                   value={dateTo}
//                   onChange={(event) => setDateTo(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Month
//                 </label>

//                 <input
//                   type="month"
//                   value={monthFilter}
//                   onChange={(event) => setMonthFilter(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Sort
//                 </label>

//                 <select
//                   value={sortOrder}
//                   onChange={(event) =>
//                     setSortOrder(
//                       event.target.value as
//                         | "default"
//                         | "ascending"
//                         | "descending",
//                     )
//                   }
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none"
//                   data-testid="select-budget-request-sort-order"
//                 >
//                   <option value="default">Default Order</option>

//                   <option value="ascending">Ascending</option>

//                   <option value="descending">Descending</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Rows
//                 </label>

//                 <select
//                   value={pageSize}
//                   onChange={(event) => setPageSize(Number(event.target.value))}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none"
//                 >
//                   <option value={5}>5</option>

//                   <option value={10}>10</option>

//                   <option value={20}>20</option>

//                   <option value={50}>50</option>
//                 </select>
//               </div>

//               <div className="flex items-end">
//                 <Button
//                   type="button"
//                   variant="outline"
//                   className="h-11 w-full rounded-2xl border-slate-200 bg-white"
//                   onClick={clearFilters}
//                 >
//                   Clear Filters
//                 </Button>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {/* ========================================================
//             UPDATED TABLE
//             Type, Budget Role and Project columns have been removed
//            ======================================================== */}

//         <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm">
//           <CardContent className="p-0">
//             <div className="overflow-x-auto">
//               <table className="w-full min-w-[1300px]">
//                 <thead>
//                   <tr className="border-b border-slate-200 bg-slate-50/80">
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Request ID
//                     </th>

//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Client / Title
//                     </th>

//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Created By
//                     </th>

//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Submit Date
//                     </th>

//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Total Amount
//                     </th>

//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Released / Balance
//                     </th>

//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Status
//                     </th>

//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Current Step
//                     </th>

//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Actions
//                     </th>
//                   </tr>
//                 </thead>

//                 <tbody className="divide-y divide-slate-100">
//                   {paginatedInvoices.length === 0 ? (
//                     <tr>
//                       <td colSpan={9} className="px-6 py-12 text-center">
//                         <p className="text-sm font-medium text-slate-600">
//                           No budget requests found
//                         </p>

//                         <p className="mt-1 text-sm text-slate-400">
//                           Try changing your filters or create a new request.
//                         </p>
//                       </td>
//                     </tr>
//                   ) : (
//                     paginatedInvoices.map((invoice) => {
//                       const type = getRequestType(invoice);

//                       const displayClientOrTitle =
//                         type === "general" || type === "asset"
//                           ? (invoice as any).title ||
//                             (invoice as any).subject ||
//                             (type === "asset"
//                               ? "Asset Request"
//                               : "General Request")
//                           : (invoice as any).clientName || "-";

//                       const createdByName = getCreatedByName(invoice);

//                       const approvedPaymentAmount =
//                         getApprovedPaymentAmount(invoice);

//                       const totalReleasedAmount =
//                         getTotalReleasedAmount(invoice);

//                       const remainingPaymentBalance =
//                         getRemainingPaymentBalance(invoice);

//                       const paymentProgressPercent = approvedPaymentAmount
//                         ? Math.min(
//                             100,
//                             Math.max(
//                               0,
//                               (totalReleasedAmount / approvedPaymentAmount) *
//                                 100,
//                             ),
//                           )
//                         : 0;

//                       const vendorWorkflowGroups =
//                         getVendorWorkflowGroups(invoice);

//                       return (
//                         <tr
//                           key={invoice.id}
//                           className="transition hover:bg-slate-50/80"
//                         >
//                           <td
//                             className="px-5 py-4 text-sm font-semibold text-slate-900"
//                             data-testid={`text-request-id-${invoice.id}`}
//                           >
//                             {(invoice as any).requestId || invoice.id}
//                           </td>

//                           <td className="px-5 py-4">
//                             <p className="text-sm font-medium text-slate-800">
//                               {displayClientOrTitle}
//                             </p>

//                             {getEstimateNumber(invoice) && (
//                               <p className="mt-1 text-xs text-slate-400">
//                                 Estimate: {getEstimateNumber(invoice)}
//                               </p>
//                             )}
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-600">
//                             {createdByName}
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-500">
//                             {formatRequestDate(invoice)}
//                           </td>

//                           <td className="px-5 py-4 text-sm font-semibold text-slate-900">
//                             Rs {formatPKR((invoice as any).totalAmount || 0)}
//                           </td>

//                           <td className="px-5 py-4">
//                             <div className="min-w-[180px]">
//                               <div className="flex items-center justify-between gap-3 text-xs">
//                                 <span className="text-slate-500">Released</span>

//                                 <span className="font-semibold text-slate-700">
//                                   Rs {formatPKR(totalReleasedAmount)}
//                                 </span>
//                               </div>

//                               <div className="mt-1 flex items-center justify-between gap-3 text-xs">
//                                 <span className="text-slate-500">Balance</span>

//                                 <span className="font-semibold text-slate-700">
//                                   Rs {formatPKR(remainingPaymentBalance)}
//                                 </span>
//                               </div>

//                               <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
//                                 <div
//                                   className="h-full rounded-full bg-slate-700 transition-all"
//                                   style={{
//                                     width: `${paymentProgressPercent}%`,
//                                   }}
//                                 />
//                               </div>
//                             </div>
//                           </td>

//                           <td className="px-5 py-4">
//                             <Badge
//                               variant="outline"
//                               className={getStatusBadgeColor(
//                                 normalizeText(invoice.status),
//                                 invoice,
//                               )}
//                             >
//                               {getBudgetRequestStatusLabel(invoice)}
//                             </Badge>
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-500">
//                             {getCurrentStep(invoice)}
//                           </td>

//                           <td className="px-5 py-4">
//                             <div className="flex min-w-[320px] flex-wrap gap-2">
//                               <Button
//                                 variant="outline"
//                                 size="sm"
//                                 className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
//                                 onClick={() => openDetailsModal(invoice)}
//                                 data-testid={`button-view-details-${invoice.id}`}
//                               >
//                                 View
//                               </Button>

//                               <Button
//                                 variant="outline"
//                                 size="sm"
//                                 className="rounded-xl border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
//                                 onClick={() => handlePrintPreview(invoice)}
//                                 data-testid={`button-print-preview-${invoice.id}`}
//                               >
//                                 Print Preview
//                               </Button>

//                               {canApprove(invoice) && (
//                                 // Approve now lives inside the details
//                                 // modal (next to the status badge), not
//                                 // here — opening "View" is how you approve.
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   className="rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
//                                   onClick={() => {
//                                     setSelectedInvoice(invoice);

//                                     setIsRejectionModalOpen(true);
//                                   }}
//                                   data-testid={`button-return-${invoice.id}`}
//                                 >
//                                   Return
//                                 </Button>
//                               )}

//                               {canEdit(invoice) && (
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   className="rounded-xl border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
//                                   onClick={() => {
//                                     if (!canEdit(invoice)) {
//                                       toast({
//                                         title: "Edit not allowed",

//                                         description:
//                                           "This request can no longer be edited because approval has already progressed.",

//                                         variant: "destructive",
//                                       });

//                                       return;
//                                     }

//                                     setSelectedInvoice(
//                                       getEditableInvoice(invoice),
//                                     );

//                                     setIsInvoiceModalOpen(true);
//                                   }}
//                                   data-testid={`button-edit-${invoice.id}`}
//                                 >
//                                   Edit
//                                 </Button>
//                               )}

//                               {getPaymentHistoryCount(invoice) > 0 && (
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
//                                   onClick={() => {
//                                     setPaymentHistoryInvoice(invoice);

//                                     setIsPaymentHistoryModalOpen(true);
//                                   }}
//                                   data-testid={`button-payment-history-${invoice.id}`}
//                                 >
//                                   History ({getPaymentHistoryCount(invoice)})
//                                 </Button>
//                               )}

//                               {vendorWorkflowGroups.map((vendor) => {
//                                 const vendorTestId = vendor.key.replace(
//                                   /[^a-zA-Z0-9_-]/g,
//                                   "-",
//                                 );

//                                 const vendorActionLabel =
//                                   vendor.isLocalVendorGroup
//                                     ? `Local Vendors (${vendor.vendorNames.length})`
//                                     : vendor.name;

//                                 if (vendor.remainingAmount <= 0.009) {
//                                   return (
//                                     <div
//                                       key={vendor.key}
//                                       className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700"
//                                     >
//                                       {vendorActionLabel}: Paid
//                                     </div>
//                                   );
//                                 }

//                                 if (canCreatePOForVendor(invoice, vendor)) {
//                                   return (
//                                     <Button
//                                       key={vendor.key}
//                                       variant="outline"
//                                       size="sm"
//                                       className="rounded-xl border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
//                                       onClick={() =>
//                                         handleCreatePO(invoice, vendor)
//                                       }
//                                       title={`Create a separate PO for ${vendorActionLabel}`}
//                                       data-testid={`button-create-po-${invoice.id}-${vendorTestId}`}
//                                     >
//                                       Create PO
//                                       {" · "}
//                                       {vendorActionLabel}
//                                     </Button>
//                                   );
//                                 }

//                                 if (
//                                   canReleasePaymentForVendor(invoice, vendor)
//                                 ) {
//                                   const isDirectPayment = !vendor.supplier;

//                                   return (
//                                     <Button
//                                       key={vendor.key}
//                                       variant="outline"
//                                       size="sm"
//                                       className={
//                                         isDirectPayment
//                                           ? "rounded-xl border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
//                                           : "rounded-xl border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
//                                       }
//                                       onClick={() =>
//                                         openVendorPayment(invoice, vendor)
//                                       }
//                                       title={`${
//                                         isDirectPayment
//                                           ? "Direct payment release"
//                                           : "Release payment against PO"
//                                       } for ${vendorActionLabel}`}
//                                       data-testid={`button-${
//                                         isDirectPayment
//                                           ? "direct-payment"
//                                           : "release-payment"
//                                       }-${invoice.id}-${vendorTestId}`}
//                                     >
//                                       {isDirectPayment
//                                         ? "Direct Payment Release"
//                                         : "Release Payment"}

//                                       {" · "}

//                                       {vendorActionLabel}
//                                     </Button>
//                                   );
//                                 }

//                                 if (
//                                   canProcessVendorActions(invoice) &&
//                                   vendor.supplier &&
//                                   vendor.linkedPO
//                                 ) {
//                                   return (
//                                     <div
//                                       key={vendor.key}
//                                       className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
//                                     >
//                                       {vendorActionLabel}: PO linked
//                                     </div>
//                                   );
//                                 }

//                                 return null;
//                               })}

//                               {canProcessVendorActions(invoice) &&
//                                 vendorWorkflowGroups.length === 0 && (
//                                   <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
//                                     Vendor is missing from the request.
//                                   </div>
//                                 )}

//                               {canFinanceSubmitBill(invoice) && (
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   className="rounded-xl border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
//                                   onClick={() =>
//                                     handleSubmitBillToFinance(invoice)
//                                   }
//                                   data-testid={`button-submit-bill-finance-${invoice.id}`}
//                                 >
//                                   Submit Bill
//                                 </Button>
//                               )}

//                               {canFinanceSubmitBill(invoice) && (
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   className="rounded-xl border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
//                                   onClick={() =>
//                                     handleSubmitWithoutBill(invoice)
//                                   }
//                                   data-testid={`button-submit-without-bill-${invoice.id}`}
//                                 >
//                                   Submit Without Bill
//                                 </Button>
//                               )}

//                               {canFinanceConfirmBillReceived(invoice) && (
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   className="rounded-xl border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
//                                   onClick={() =>
//                                     handleBillReceivedByFinance(invoice)
//                                   }
//                                   data-testid={`button-bill-received-${invoice.id}`}
//                                 >
//                                   Bill Received
//                                 </Button>
//                               )}

//                               {getBillHistory(invoice).length > 0 && (
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
//                                   onClick={() => setBillHistoryInvoice(invoice)}
//                                   data-testid={`button-bill-history-${invoice.id}`}
//                                 >
//                                   Bill History ({getBillHistory(invoice).length}
//                                   )
//                                 </Button>
//                               )}

//                               {canShowExpenseAction(invoice) && (
//                                 <>
//                                   {canSubmitExpense(invoice) ? (
//                                     <Button
//                                       variant="outline"
//                                       size="sm"
//                                       className="rounded-xl border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
//                                       onClick={() => openExpenseModal(invoice)}
//                                       data-testid={`button-submit-expense-${invoice.id}`}
//                                     >
//                                       Submit Expense
//                                     </Button>
//                                   ) : (
//                                     <div
//                                       className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500"
//                                       data-testid={`text-expense-status-${invoice.id}`}
//                                     >
//                                       {getExpenseSheetStatus(invoice) ===
//                                       "rejected"
//                                         ? "Expense Sheet Rejected"
//                                         : "Expense Submitted — No Approval Required"}
//                                     </div>
//                                   )}
//                                 </>
//                               )}
//                             </div>
//                           </td>
//                         </tr>
//                       );
//                     })
//                   )}
//                 </tbody>
//               </table>
//             </div>

//             <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
//               <p className="text-sm text-slate-500">
//                 Showing{" "}
//                 <span className="font-medium text-slate-700">
//                   {showingFrom}
//                 </span>{" "}
//                 to{" "}
//                 <span className="font-medium text-slate-700">{showingTo}</span>{" "}
//                 of{" "}
//                 <span className="font-medium text-slate-700">
//                   {sortedInvoices.length}
//                 </span>{" "}
//                 requests
//               </p>

//               <div className="flex flex-wrap items-center gap-2">
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   disabled={currentPage === 1}
//                   onClick={() => setCurrentPage(1)}
//                 >
//                   First
//                 </Button>

//                 <Button
//                   variant="outline"
//                   size="sm"
//                   disabled={currentPage === 1}
//                   onClick={() =>
//                     setCurrentPage((page) => Math.max(1, page - 1))
//                   }
//                 >
//                   Previous
//                 </Button>

//                 {getVisiblePages().map((page) => (
//                   <Button
//                     key={page}
//                     variant={page === currentPage ? "default" : "outline"}
//                     size="sm"
//                     onClick={() => setCurrentPage(page)}
//                   >
//                     {page}
//                   </Button>
//                 ))}

//                 <Button
//                   variant="outline"
//                   size="sm"
//                   disabled={currentPage === totalPages}
//                   onClick={() =>
//                     setCurrentPage((page) => Math.min(totalPages, page + 1))
//                   }
//                 >
//                   Next
//                 </Button>

//                 <Button
//                   variant="outline"
//                   size="sm"
//                   disabled={currentPage === totalPages}
//                   onClick={() => setCurrentPage(totalPages)}
//                 >
//                   Last
//                 </Button>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {billHistoryInvoice && (
//         <div
//           className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
//           role="dialog"
//           aria-modal="true"
//           aria-label="Bill submission history"
//         >
//           <Card className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-3xl border-slate-200 bg-white shadow-2xl">
//             <CardContent className="p-0">
//               <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
//                 <div>
//                   <h2 className="text-lg font-semibold text-slate-950">
//                     Bill Submission History
//                   </h2>

//                   <p className="mt-1 text-sm text-slate-500">
//                     Request{" "}
//                     {String(
//                       (billHistoryInvoice as any)?.requestId ||
//                         billHistoryInvoice.id,
//                     )}
//                   </p>
//                 </div>

//                 <Button
//                   type="button"
//                   variant="outline"
//                   size="sm"
//                   className="rounded-xl"
//                   onClick={() => setBillHistoryInvoice(null)}
//                 >
//                   Close
//                 </Button>
//               </div>

//               <div className="max-h-[65vh] space-y-3 overflow-y-auto p-6">
//                 {getBillHistory(billHistoryInvoice).length === 0 ? (
//                   <p className="text-sm text-slate-500">
//                     No bill history is available for this request.
//                   </p>
//                 ) : (
//                   [...getBillHistory(billHistoryInvoice)]
//                     .reverse()
//                     .map((entry: any, index: number) => (
//                       <div
//                         key={`${String(entry?.action || entry?.status || "bill")}-${index}`}
//                         className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
//                       >
//                         <div className="flex flex-wrap items-center justify-between gap-2">
//                           <p className="text-sm font-semibold text-slate-900">
//                             {getBillHistoryActionLabel(entry)}
//                           </p>

//                           <span className="text-xs text-slate-500">
//                             {formatBillHistoryDate(
//                               entry?.timestamp || entry?.createdAt,
//                             )}
//                           </span>
//                         </div>

//                         <p className="mt-2 text-sm text-slate-600">
//                           By:{" "}
//                           {getFirstTextValue([
//                             entry?.actor,
//                             entry?.actorName,
//                             entry?.by,
//                             formatRoleLabel(entry?.actorRole || entry?.role),
//                           ]) || "Unknown User"}
//                         </p>

//                         {entry?.note && (
//                           <p className="mt-1 text-sm text-slate-500">
//                             {String(entry.note)}
//                           </p>
//                         )}
//                       </div>
//                     ))
//                 )}
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       )}

//       <InvoiceRequestModal
//         isOpen={isInvoiceModalOpen}
//         onClose={() => {
//           setIsInvoiceModalOpen(false);

//           setSelectedInvoice(null);
//         }}
//         onSuccess={() => {
//           setIsInvoiceModalOpen(false);

//           setSelectedInvoice(null);

//           // Jump back to page 1 so the request just created/edited is
//           // actually visible where the newest-first sort now puts it,
//           // regardless of which page was open when the modal was submitted.
//           setCurrentPage(1);
//         }}
//         editingInvoice={selectedInvoice}
//       />

//       <PaymentReleaseModal
//         isOpen={isPaymentModalOpen}
//         title={
//           (selectedInvoice as any)?.directPaymentRelease
//             ? "Direct Payment Release"
//             : "Release Payment"
//         }
//         onClose={() => {
//           setIsPaymentModalOpen(false);

//           setSelectedInvoice(null);
//         }}
//         onSuccess={handlePaymentReleased}
//         invoice={selectedInvoice}
//       />

//       {selectedInvoice && (
//         <ExpenseSheetModal
//           isOpen={isExpenseModalOpen}
//           initialRequest={selectedInvoice}
//           onClose={() => {
//             setIsExpenseModalOpen(false);

//             setSelectedInvoice(null);

//             localStorage.removeItem("submitExpenseFromBudgetRequest");

//             localStorage.removeItem("expenseSheetSource");
//           }}
//           onSuccess={handleExpenseSubmitted}
//         />
//       )}

//       <InvoiceDetailsModal
//         isOpen={isDetailsModalOpen}
//         onClose={() => {
//           setIsDetailsModalOpen(false);

//           setSelectedInvoice(null);
//         }}
//         invoice={selectedInvoice}
//         onApprove={handleApprove}
//         canApprove={selectedInvoice ? canApprove(selectedInvoice) : false}
//       />

//       <PaymentHistoryModal
//         isOpen={isPaymentHistoryModalOpen}
//         invoice={paymentHistoryInvoice}
//         canEdit={
//           Boolean(paymentHistoryInvoice) &&
//           isFinanceApproverRole(userProfile?.role) &&
//           getPaymentHistoryCount(paymentHistoryInvoice) > 0
//         }
//         onClose={() => {
//           setIsPaymentHistoryModalOpen(false);

//           setPaymentHistoryInvoice(null);
//         }}
//         onSuccess={() => {
//           setIsPaymentHistoryModalOpen(false);

//           setPaymentHistoryInvoice(null);
//         }}
//       />

//       <RejectionModal
//         isOpen={isRejectionModalOpen}
//         onClose={() => {
//           setIsRejectionModalOpen(false);

//           setSelectedInvoice(null);
//         }}
//         onConfirm={(comment) =>
//           selectedInvoice && handleReject(selectedInvoice, comment)
//         }
//         itemType="invoice request"
//         loading={rejectionLoading}
//       />
//     </div>
//   );
// }

import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Trash2,
  CalendarIcon,
  X,
  FileText,
  FileSpreadsheet,
  GripVertical,
  Plus,
} from "lucide-react";
import {
  collection,
  serverTimestamp,
  doc,
  updateDoc,
  runTransaction,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const PANEL_ID = "IEDGE-SYSTEM";

type InvoiceType = "general" | "project" | "asset";

type LineItem = {
  id: number;
  date: string;
  service: string;
  description: string;
  vendor: string;
  supplierId: string;
  supplierName: string;
  units: string;
  unitRate: string;
  total: number;
  comment: string;
};

type TableColumnKey =
  | "date"
  | "service"
  | "description"
  | "vendor"
  | "units"
  | "unitRate"
  | "total"
  | "comment"
  | "actions";

type TableColumnConfig = {
  label: string;
  headerClassName: string;
  headerContentClassName: string;
  cellClassName: string;
  render: (item: LineItem) => ReactNode;
};

const DEFAULT_TABLE_COLUMN_ORDER: TableColumnKey[] = [
  "date",
  "service",
  "description",
  "vendor",
  "units",
  "unitRate",
  "total",
  "comment",
  "actions",
];

type BudgetRequestModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editingInvoice?: any | null;
};

type AutoResizeTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  minHeight?: number;
  maxHeight?: number;
  minWidthCh?: number;
  maxWidthCh?: number;
};

function parseAmount(value: any): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const parsed = Number(String(value).replace(/,/g, ""));

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumberWithCommas(
  value: any,
  removeTrailingZeroes = false,
): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const rawValue = String(value).replace(/,/g, "").trim();

  if (!rawValue || rawValue === ".") {
    return rawValue;
  }

  const [integerPart, decimalPart] = rawValue.split(".");

  const safeIntegerPart = integerPart || "0";

  const formattedInteger = safeIntegerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ",",
  );

  if (decimalPart !== undefined) {
    const trimmedDecimal = removeTrailingZeroes
      ? decimalPart.replace(/0+$/, "")
      : decimalPart;

    if (trimmedDecimal) {
      return `${formattedInteger}.${trimmedDecimal}`;
    }

    return removeTrailingZeroes ? formattedInteger : `${formattedInteger}.`;
  }

  return formattedInteger;
}

function formatAmount(value: any): string {
  const amount = parseAmount(value);

  return amount.toLocaleString("en-PK", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,

    maximumFractionDigits: 2,
  });
}

function sanitizeDecimalInput(value: string) {
  let cleanValue = value.replace(/,/g, "").replace(/[^\d.]/g, "");

  const parts = cleanValue.split(".");

  if (parts.length > 2) {
    cleanValue = `${parts[0]}.${parts.slice(1).join("")}`;
  }

  return cleanValue;
}

function formatDateForDisplay(value: any) {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return format(date, "dd MMM yyyy");
}

function normalizeInvoiceType(value: any): InvoiceType {
  if (value === "general" || value === "project" || value === "asset") {
    return value;
  }

  return "project";
}

function getInvoiceTypeLabel(type: InvoiceType) {
  if (type === "project") {
    return "Project";
  }

  if (type === "asset") {
    return "Asset";
  }

  return "General";
}

function getLineItemLabel(type: InvoiceType) {
  return type === "asset" ? "Asset" : "Service";
}

function safeExportFileName(value: string) {
  return value
    .trim()
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function getAutoWidth(value: any, minWidthCh = 10, maxWidthCh = 45) {
  const text = String(value || "");

  const longestLine = text
    .split("\n")
    .reduce((longest, line) => Math.max(longest, line.length), 0);

  return `${Math.min(Math.max(longestLine + 2, minWidthCh), maxWidthCh)}ch`;
}

function AutoResizeTextarea({
  value,
  onChange,
  className = "",
  minHeight = 36,
  maxHeight = 140,
  minWidthCh = 10,
  maxWidthCh = 45,
  style,
  ...props
}: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  function resizeTextarea() {
    const el = textareaRef.current;

    if (!el) return;

    el.style.height = "auto";

    const nextHeight = Math.min(
      Math.max(el.scrollHeight, minHeight),
      maxHeight,
    );

    el.style.height = `${nextHeight}px`;

    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }

  useEffect(() => {
    resizeTextarea();
  }, [value]);

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      rows={1}
      onChange={(e) => {
        onChange?.(e);

        requestAnimationFrame(resizeTextarea);
      }}
      className={`resize-none overflow-hidden text-sm leading-5 ${className}`}
      style={{
        minHeight,
        width: getAutoWidth(value, minWidthCh, maxWidthCh),
        ...style,
      }}
      {...props}
    />
  );
}

function getRoleKey(role: any): string {
  return String(role || "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");
}

function getRoleLabel(role: string) {
  const normalizedRole = getRoleKey(role);

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    main_admin: "Admin",
    super_admin: "Super Admin",
    finance_admin: "Finance Admin",
    financial_admin: "Finance Admin",
    finance: "Finance",
    operation: "Operation",
    operations: "Operation",
    operational_admin: "Operation Admin",
    operation_admin: "Operation Admin",
    creative: "Creative",
    sales: "Sales",
  };

  return (
    roleLabels[normalizedRole] ||
    normalizedRole
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function canRoleCreateBudgetRequest(role: string) {
  const roleKey = getRoleKey(role);

  const blockedRoles = ["admin", "main_admin", "super_admin"];

  return !!roleKey && !blockedRoles.includes(roleKey);
}

export default function InvoiceRequestModal({
  isOpen,
  onClose,
  onSuccess,
  editingInvoice = null,
}: BudgetRequestModalProps) {
  const { userProfile } = useAuth();

  const { toast } = useToast();

  const currentUserRole = getRoleKey(userProfile?.role || "");

  const canSubmitBudgetRequest = canRoleCreateBudgetRequest(currentUserRole);

  const [loading, setLoading] = useState(false);

  const [invoiceType, setInvoiceType] = useState<InvoiceType>("general");

  const [estimates, setEstimates] = useState<any[]>([]);

  const [suppliers, setSuppliers] = useState<any[]>([]);

  const [selectedEstimateId, setSelectedEstimateId] = useState("");

  const [selectedEstimateInput, setSelectedEstimateInput] = useState("");

  const [subject, setSubject] = useState("");

  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    requestId: "",
    clientName: "",
    project: "",
    projectCode: "",
    title: "",
    comment: "",
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: 1,
      date: "",
      service: "",
      description: "",
      vendor: "",
      supplierId: "",
      supplierName: "",
      units: "",
      unitRate: "",
      total: 0,
      comment: "",
    },
  ]);

  const [draggedRowId, setDraggedRowId] = useState<number | null>(null);

  const [dragOverRowId, setDragOverRowId] = useState<number | null>(null);

  function getEmptyLineItem(id = 1): LineItem {
    return {
      id,
      date: "",
      service: "",
      description: "",
      vendor: "",
      supplierId: "",
      supplierName: "",
      units: "",
      unitRate: "",
      total: 0,
      comment: "",
    };
  }

  function resetForm() {
    setInvoiceType("general");

    setSelectedEstimateId("");

    setSelectedEstimateInput("");

    setSubject("");
    setMessage("");

    setFormData({
      requestId: "",
      clientName: "",
      project: "",
      projectCode: "",
      title: "",
      comment: "",
    });

    setLineItems([getEmptyLineItem(1)]);
  }

  function getSupplierDisplayName(supplier: any) {
    return (
      supplier?.supplierName ||
      supplier?.vendorName ||
      supplier?.name ||
      supplier?.companyName ||
      supplier?.businessName ||
      supplier?.title ||
      ""
    );
  }

  function normalizeVendorLookup(value: any) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function findSupplierByVendorValue(value: any) {
    const lookup = normalizeVendorLookup(value);

    if (!lookup) {
      return null;
    }

    return (
      suppliers.find((supplier) => {
        const supplierNames = [
          supplier?.supplierName,
          supplier?.vendorName,
          supplier?.name,
          supplier?.companyName,
          supplier?.businessName,
          supplier?.title,
        ];

        return supplierNames.some(
          (name) => normalizeVendorLookup(name) === lookup,
        );
      }) || null
    );
  }

  function getEstimateProjectCode(estimate: any) {
    return (
      estimate?.projectCode ||
      estimate?.projectcode ||
      estimate?.project_code ||
      estimate?.code ||
      ""
    );
  }

  function getEstimateTitle(estimate: any) {
    return estimate?.subject || estimate?.title || "";
  }

  function getEstimateClientName(estimate: any) {
    return estimate?.client || estimate?.clientName || "";
  }

  function getEstimateProjectName(estimate: any) {
    return (
      estimate?.projectOwner || estimate?.project || estimate?.projectName || ""
    );
  }

  function getEstimateDisplayNo(estimate: any) {
    return String(
      estimate?.estimateNo || estimate?.estimateNumber || estimate?.id || "",
    );
  }

  /*
   * =========================================================
   * ATOMIC REQUEST CREATION + REQUEST ID GENERATION
   * =========================================================
   *
   * Request ID is NOT generated when the form opens.
   * It is generated only when the request is actually saved.
   * Counter increment + request creation happen in one
   * Firestore transaction, so concurrent users receive
   * unique sequential IDs.
   */
  async function createBudgetRequestWithRequestId(
    requestData: Record<string, any>,
  ) {
    const counterRef = doc(
      db,
      "Panels",
      PANEL_ID,
      "counters",
      "invoiceRequests",
    );

    const requestRef = doc(
      collection(db, "Panels", PANEL_ID, "invoiceRequests"),
    );

    return await runTransaction(db, async (transaction) => {
      const counterSnapshot = await transaction.get(counterRef);

      let currentCount = 0;

      if (counterSnapshot.exists()) {
        currentCount = Number(counterSnapshot.data()?.count || 0);
      }

      const nextCount = currentCount + 1;

      const year = new Date().getFullYear();

      const requestId = `PR-${year}-${String(nextCount).padStart(4, "0")}`;

      if (counterSnapshot.exists()) {
        transaction.update(counterRef, {
          count: nextCount,

          updatedAt: serverTimestamp(),
        });
      } else {
        transaction.set(counterRef, {
          count: nextCount,

          createdAt: serverTimestamp(),

          updatedAt: serverTimestamp(),
        });
      }

      transaction.set(requestRef, {
        ...requestData,

        requestId,

        sequenceNumber: nextCount,

        requestYear: year,
      });

      return {
        id: requestRef.id,
        requestId,
        sequenceNumber: nextCount,
      };
    });
  }

  /*
   * Reset new-request form whenever the popup is opened.
   * No Request ID is generated here.
   */
  useEffect(() => {
    if (!isOpen || editingInvoice) {
      return;
    }

    resetForm();
  }, [isOpen, editingInvoice]);

  /* Fetch suppliers. */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const fetchSuppliers = async () => {
      try {
        const snap = await getDocs(
          collection(db, "Panels", PANEL_ID, "suppliers"),
        );

        const data = snap.docs
          .map((d) => ({
            id: d.id,
            ...d.data(),
          }))
          .sort((a, b) =>
            getSupplierDisplayName(a).localeCompare(getSupplierDisplayName(b)),
          );

        setSuppliers(data);
      } catch (error) {
        console.error("Failed to fetch suppliers:", error);
      }
    };

    fetchSuppliers();
  }, [isOpen]);

  /* Fetch estimates only for Project requests. */
  useEffect(() => {
    if (!isOpen || invoiceType !== "project") {
      return;
    }

    const fetchEstimates = async () => {
      try {
        const snap = await getDocs(
          collection(db, "Panels", PANEL_ID, "estimates"),
        );

        setEstimates(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })),
        );
      } catch (error) {
        console.error("Failed to fetch estimates:", error);
      }
    };

    fetchEstimates();
  }, [isOpen, invoiceType]);

  /* Clear Project-specific fields if request type changes. */
  useEffect(() => {
    if (invoiceType !== "project") {
      setSelectedEstimateId("");

      setSelectedEstimateInput("");

      setFormData((prev) => ({
        ...prev,
        clientName: "",
        project: "",
        projectCode: "",
      }));
    }
  }, [invoiceType]);

  useEffect(() => {
    if (!selectedEstimateId || !estimates.length) {
      return;
    }

    const matchedEstimate = estimates.find((e) => e.id === selectedEstimateId);

    if (matchedEstimate) {
      setSelectedEstimateInput(getEstimateDisplayNo(matchedEstimate));
    }
  }, [selectedEstimateId, estimates]);

  function handleEstimateSelect(value: string) {
    setSelectedEstimateInput(value);

    const normalizedValue = value.trim().toLowerCase();

    const est = estimates.find((e) => {
      const displayNo = getEstimateDisplayNo(e).trim().toLowerCase();

      return e.id === value || displayNo === normalizedValue;
    });

    if (!est) {
      setSelectedEstimateId(value);

      setFormData((prev) => ({
        ...prev,
        clientName: "",
        title: "",
        project: "",
        projectCode: "",
      }));

      return;
    }

    setSelectedEstimateId(est.id);

    setFormData((prev) => ({
      ...prev,

      clientName: getEstimateClientName(est),

      title: getEstimateTitle(est),

      project: getEstimateProjectName(est),

      projectCode: getEstimateProjectCode(est),
    }));
  }

  function updateLineItem(id: number, field: keyof LineItem, value: string) {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const updated = {
          ...item,
          [field]: value,
        };

        if (field === "vendor") {
          const matchedSupplier = findSupplierByVendorValue(value);

          updated.supplierId = matchedSupplier?.id || "";

          updated.supplierName = matchedSupplier
            ? getSupplierDisplayName(matchedSupplier)
            : "";
        }

        const units = parseAmount(updated.units);

        const rate = parseAmount(updated.unitRate);

        updated.total = units * rate;

        return updated;
      }),
    );
  }

  function addLineItem() {
    setLineItems((prev) => {
      const nextId =
        prev.length > 0 ? Math.max(...prev.map((item) => item.id || 0)) + 1 : 1;

      return [...prev, getEmptyLineItem(nextId)];
    });
  }

  function removeLineItem(id: number) {
    if (lineItems.length > 1) {
      setLineItems((prev) => prev.filter((i) => i.id !== id));
    }
  }

  function moveLineItemRow(sourceRowId: number, targetRowId: number) {
    if (sourceRowId === targetRowId) {
      return;
    }

    setLineItems((prev) => {
      const sourceIndex = prev.findIndex((item) => item.id === sourceRowId);

      const targetIndex = prev.findIndex((item) => item.id === targetRowId);

      if (sourceIndex === -1 || targetIndex === -1) {
        return prev;
      }

      const nextItems = [...prev];

      const [movedItem] = nextItems.splice(sourceIndex, 1);

      nextItems.splice(targetIndex, 0, movedItem);

      return nextItems;
    });
  }

  function handleRowDragStart(
    event: DragEvent<HTMLSpanElement>,
    rowId: number,
  ) {
    setDraggedRowId(rowId);

    event.dataTransfer.effectAllowed = "move";

    event.dataTransfer.setData("text/plain", String(rowId));
  }

  function handleRowDragOver(
    event: DragEvent<HTMLTableRowElement>,
    rowId: number,
  ) {
    if (draggedRowId === rowId) {
      return;
    }

    event.preventDefault();

    event.dataTransfer.dropEffect = "move";

    setDragOverRowId(rowId);
  }

  function handleRowDrop(
    event: DragEvent<HTMLTableRowElement>,
    targetRowId: number,
  ) {
    event.preventDefault();

    const sourceRowId =
      draggedRowId ?? Number(event.dataTransfer.getData("text/plain"));

    if (Number.isFinite(sourceRowId)) {
      moveLineItemRow(sourceRowId, targetRowId);
    }

    setDraggedRowId(null);
    setDragOverRowId(null);
  }

  function handleRowDragEnd() {
    setDraggedRowId(null);
    setDragOverRowId(null);
  }

  function normalizeLineItemsForSave(items: any[]): LineItem[] {
    return items.map((item, index) => {
      const unitsValue =
        item.units ?? item.unit ?? item.quantity ?? item.qty ?? "";

      const unitRateValue = item.unitRate ?? item.rate ?? item.price ?? "";

      const units = parseAmount(unitsValue);

      const unitRate = parseAmount(unitRateValue);

      const savedTotal = parseAmount(item.total);

      const vendorName =
        item.vendor || item.vendorName || item.supplierName || "";

      const matchedSupplier =
        suppliers.find(
          (supplier) =>
            String(supplier?.id || "") ===
            String(item.supplierId || item.vendorId || ""),
        ) || findSupplierByVendorValue(vendorName);

      return {
        id: item.id || index + 1,

        date: item.date || "",

        service: item.service || "",

        description: item.description || "",

        vendor: vendorName,

        supplierId:
          matchedSupplier?.id || item.supplierId || item.vendorId || "",

        supplierName: matchedSupplier
          ? getSupplierDisplayName(matchedSupplier)
          : item.supplierName || "",

        units: String(unitsValue),

        unitRate: String(unitRateValue),

        total: savedTotal || units * unitRate,

        comment: item.comment || "",
      };
    });
  }

  const totalAmount = lineItems.reduce(
    (sum, item) => sum + parseAmount(item.total),
    0,
  );

  function getRequestNumber() {
    return formData.requestId || editingInvoice?.requestId || "DRAFT";
  }

  function getRequestTitle() {
    return formData.title || subject || "Budget Request";
  }

  function getExportFileName(extension: "pdf" | "xlsx") {
    const baseName = safeExportFileName(
      `${getRequestNumber()}-${getRequestTitle()}`,
    );

    return `${baseName || "budget-request"}.${extension}`;
  }

  function getExportMetaRows() {
    return [
      ["Request ID", getRequestNumber()],

      ["Request Type", getInvoiceTypeLabel(invoiceType)],

      ["Title", getRequestTitle()],

      ["Subject", subject || formData.title || "-"],

      [
        "Estimate No",
        invoiceType === "project" ? selectedEstimateInput || "-" : "-",
      ],

      ["Client", invoiceType === "project" ? formData.clientName || "-" : "-"],

      ["Project", invoiceType === "project" ? formData.project || "-" : "-"],

      [
        "Project Code",
        invoiceType === "project" ? formData.projectCode || "-" : "-",
      ],

      [
        "Prepared By",
        userProfile?.displayName ||
          (userProfile as any)?.name ||
          userProfile?.email ||
          "-",
      ],

      ["Prepared On", formatDateForDisplay(new Date())],

      ["Total", `Rs ${formatAmount(totalAmount)}`],
    ];
  }

  function handleExportPdf() {
    try {
      const exportItems = normalizeLineItemsForSave(lineItems);

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();

      const metaRows = getExportMetaRows();

      pdf.setProperties({
        title: `Budget Request - ${getRequestNumber()}`,
      });

      pdf.setFont("helvetica", "bold");

      pdf.setFontSize(22);

      pdf.text("Budget Request", 40, 44);

      pdf.setFont("helvetica", "normal");

      pdf.setFontSize(10);

      pdf.setTextColor(90);

      pdf.text(
        `Generated ${formatDateForDisplay(new Date())}`,
        pageWidth - 40,
        44,
        {
          align: "right",
        },
      );

      pdf.setTextColor(30);

      metaRows.forEach(([label, value], index) => {
        const column = index % 3;

        const row = Math.floor(index / 3);

        const x = 40 + column * 260;

        const y = 78 + row * 34;

        pdf.setFont("helvetica", "bold");

        pdf.setFontSize(8);

        pdf.setTextColor(100);

        pdf.text(label, x, y);

        pdf.setFont("helvetica", "normal");

        pdf.setFontSize(10);

        pdf.setTextColor(25);

        pdf.text(String(value || "-"), x, y + 14, {
          maxWidth: 220,
        });
      });

      autoTable(pdf, {
        startY: 220,

        head: [
          [
            "#",
            "Date",
            getLineItemLabel(invoiceType),
            "Description",
            "Vendor",
            "Units",
            "Rate",
            "Total",
            "Comment",
          ],
        ],

        body: exportItems.map((item, index) => [
          String(index + 1),

          formatDateForDisplay(item.date) || "-",

          item.service || "-",

          item.description || "-",

          item.vendor || "-",

          item.units || "0",

          formatAmount(item.unitRate),

          formatAmount(item.total),

          item.comment || "-",
        ]),

        foot: [
          [
            "",
            "",
            "",
            "",
            "",
            "",
            "Total",
            `Rs ${formatAmount(totalAmount)}`,
            "",
          ],
        ],

        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 5,
          lineColor: [229, 231, 235],
          lineWidth: 0.5,
          overflow: "linebreak",
          valign: "top",
        },

        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },

        footStyles: {
          fillColor: [248, 250, 252],
          textColor: [15, 23, 42],
          fontStyle: "bold",
        },

        columnStyles: {
          0: {
            cellWidth: 24,
            halign: "center",
          },

          1: {
            cellWidth: 70,
          },

          2: {
            cellWidth: 90,
          },

          3: {
            cellWidth: 150,
          },

          4: {
            cellWidth: 100,
          },

          5: {
            cellWidth: 45,
            halign: "right",
          },

          6: {
            cellWidth: 65,
            halign: "right",
          },

          7: {
            cellWidth: 70,
            halign: "right",
          },

          8: {
            cellWidth: 120,
          },
        },

        margin: {
          left: 40,
          right: 40,
        },
      });

      const lastTableY = (pdf as any).lastAutoTable?.finalY || 220;

      if (message && lastTableY < pdf.internal.pageSize.getHeight() - 70) {
        pdf.setFont("helvetica", "bold");

        pdf.setFontSize(9);

        pdf.text("Message", 40, lastTableY + 28);

        pdf.setFont("helvetica", "normal");

        pdf.setFontSize(9);

        pdf.text(message, 40, lastTableY + 44, {
          maxWidth: pageWidth - 80,
        });
      }

      pdf.save(getExportFileName("pdf"));

      toast({
        title: "PDF exported",
      });
    } catch (error) {
      console.error("Failed to export PDF:", error);

      toast({
        title: "Export failed",

        description: "Could not export the Budget Request PDF.",

        variant: "destructive",
      });
    }
  }

  function handleExportExcel() {
    try {
      const exportItems = normalizeLineItemsForSave(lineItems);

      const rows: Array<Array<string | number>> = [
        ["Budget Request"],

        [],

        ...getExportMetaRows(),

        [],

        ["Line Items"],

        [
          "#",
          "Date",
          getLineItemLabel(invoiceType),
          "Description",
          "Vendor",
          "Units",
          "Rate",
          "Total",
          "Comment",
        ],

        ...exportItems.map((item, index) => [
          index + 1,

          formatDateForDisplay(item.date),

          item.service,

          item.description,

          item.vendor,

          parseAmount(item.units),

          parseAmount(item.unitRate),

          parseAmount(item.total),

          item.comment,
        ]),

        ["", "", "", "", "", "", "Total", totalAmount, ""],
      ];

      if (message) {
        rows.push([], ["Message", message]);
      }

      const worksheet = XLSX.utils.aoa_to_sheet(rows);

      worksheet["!cols"] = [
        { wch: 6 },
        { wch: 14 },
        { wch: 24 },
        { wch: 36 },
        { wch: 24 },
        { wch: 10 },
        { wch: 14 },
        { wch: 14 },
        { wch: 28 },
      ];

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "Budget Request");

      XLSX.writeFile(workbook, getExportFileName("xlsx"));

      toast({
        title: "Excel exported",
      });
    } catch (error) {
      console.error("Failed to export Excel:", error);

      toast({
        title: "Export failed",

        description: "Could not export the Budget Request Excel file.",

        variant: "destructive",
      });
    }
  }

  /*
   * =========================================================
   * SUBMIT - ROLE / BUDGET ROLE BASED
   * =========================================================
   */
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!userProfile || !canSubmitBudgetRequest) {
      toast({
        title: "Permission denied",

        description: "Only Admin users cannot create Budget Requests.",

        variant: "destructive",
      });

      return;
    }

    if (loading) {
      return;
    }

    try {
      setLoading(true);

      const lineItemsForSave = normalizeLineItemsForSave(lineItems);

      const submittedBy =
        (userProfile as any).id ||
        (userProfile as any).uid ||
        (userProfile as any).userId ||
        userProfile.email ||
        "";

      const submittedByName =
        userProfile.displayName ||
        (userProfile as any).name ||
        userProfile.email ||
        "";

      /*
       * Budget Request routing is ROLE based.
       * Department is NOT required.
       *
       * When editing/resubmitting a returned request,
       * preserve the request's original Budget Role.
       */
      const requestBudgetRoleId = String(
        editingInvoice?.budgetRoleId ||
          editingInvoice?.budgetRole ||
          editingInvoice?.submittedByBudgetRole ||
          editingInvoice?.submittedByRole ||
          (userProfile as any)?.role ||
          currentUserRole ||
          "",
      ).trim();

      const requestBudgetRoleKey = getRoleKey(
        editingInvoice?.budgetRoleKey ||
          editingInvoice?.submittedByBudgetRoleKey ||
          requestBudgetRoleId,
      );

      const requestBudgetRoleLabel = String(
        editingInvoice?.budgetRoleLabel ||
          editingInvoice?.submittedByRoleLabel ||
          getRoleLabel(requestBudgetRoleId) ||
          requestBudgetRoleId,
      ).trim();

      if (!requestBudgetRoleId || !requestBudgetRoleKey) {
        toast({
          title: "Budget Role required",

          description:
            "Your user account does not have a Role assigned. Please assign a Role in User Management before creating a Budget Request.",

          variant: "destructive",
        });

        return;
      }

      if (!editingInvoice) {
        const result = await createBudgetRequestWithRequestId({
          invoiceType,

          estimateId: selectedEstimateId || "",

          estimateNumber:
            invoiceType === "project" ? selectedEstimateInput : "",

          clientName: invoiceType === "project" ? formData.clientName : "",

          project: invoiceType === "project" ? formData.project : "",

          projectName: invoiceType === "project" ? formData.project : "",

          projectCode: invoiceType === "project" ? formData.projectCode : "",

          title: formData.title,

          lineItems: lineItemsForSave,

          items: lineItemsForSave,

          totalAmount,

          subject,

          message,

          /*
           * Budget Role ownership.
           * InvoiceRequests.tsx uses these fields
           * to select the correct approval workflow.
           */
          budgetRoleId: requestBudgetRoleId,

          budgetRole: requestBudgetRoleId,

          budgetRoleKey: requestBudgetRoleKey,

          budgetRoleLabel: requestBudgetRoleLabel,

          submittedByBudgetRole: requestBudgetRoleId,

          submittedByBudgetRoleKey: requestBudgetRoleKey,

          status: "pending_workflow_configuration",

          currentApprover: "",

          currentApprovalLevel: 0,

          currentApprovalLevelId: "",

          currentApprovalLevelName: "",

          currentApproverUserIds: [],

          currentApproverRoleIds: [],

          currentApproverRoleNames: [],

          returnedToRole: "",

          returnedToRoleLabel: "",

          returnedToCreator: false,

          needsCreatorRevision: false,

          submittedAt: serverTimestamp(),

          editDate: null,

          submittedBy,

          createdBy: submittedBy,

          /* Existing role fields preserved. */
          submittedByRole: requestBudgetRoleId,

          submittedByRoleLabel: requestBudgetRoleLabel,

          submittedByName,

          createdByName: submittedByName,

          updatedAt: serverTimestamp(),
        });

        setFormData((prev) => ({
          ...prev,
          requestId: result.requestId,
        }));

        toast({
          title: "Budget request submitted",

          description: `Request ${result.requestId} created successfully.`,
        });
      } else {
        await updateDoc(
          doc(db, "Panels", PANEL_ID, "invoiceRequests", editingInvoice.id),
          {
            invoiceType,

            estimateId: selectedEstimateId || "",

            estimateNumber:
              invoiceType === "project" ? selectedEstimateInput : "",

            clientName: invoiceType === "project" ? formData.clientName : "",

            project: invoiceType === "project" ? formData.project : "",

            projectName: invoiceType === "project" ? formData.project : "",

            projectCode: invoiceType === "project" ? formData.projectCode : "",

            title: formData.title,

            lineItems: lineItemsForSave,

            items: lineItemsForSave,

            totalAmount,

            subject,

            message,

            budgetRoleId: requestBudgetRoleId,

            budgetRole: requestBudgetRoleId,

            budgetRoleKey: requestBudgetRoleKey,

            budgetRoleLabel: requestBudgetRoleLabel,

            submittedByBudgetRole: requestBudgetRoleId,

            submittedByBudgetRoleKey: requestBudgetRoleKey,

            submittedByRole: requestBudgetRoleId,

            submittedByRoleLabel: requestBudgetRoleLabel,

            status: "pending_workflow_configuration",

            currentApprover: "",

            currentApprovalLevel: 0,

            currentApprovalLevelId: "",

            currentApprovalLevelName: "",

            currentApproverUserIds: [],

            currentApproverRoleIds: [],

            currentApproverRoleNames: [],

            returnedToRole: "",

            returnedToRoleLabel: "",

            returnedToCreator: false,

            needsCreatorRevision: false,

            editDate: serverTimestamp(),

            resubmittedAt: serverTimestamp(),

            updatedAt: serverTimestamp(),
          },
        );

        toast({
          title: "Budget request resubmitted",

          description: editingInvoice.requestId
            ? `Request ${editingInvoice.requestId} updated successfully.`
            : "Budget request updated successfully.",
        });
      }

      onSuccess?.();

      resetForm();
    } catch (err) {
      console.error("Failed to submit Budget Request:", err);

      toast({
        title: "Error",

        description:
          "Failed to submit Budget Request. No Request ID was consumed if the transaction failed.",

        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  /* Load existing request when editing. */
  useEffect(() => {
    if (!editingInvoice) {
      return;
    }

    setInvoiceType(normalizeInvoiceType(editingInvoice.invoiceType));

    setSelectedEstimateId(editingInvoice.estimateId || "");

    setSelectedEstimateInput(
      editingInvoice.estimateNumber || editingInvoice.estimateId || "",
    );

    setSubject(editingInvoice.subject || "");

    setMessage(editingInvoice.message || "");

    setFormData({
      requestId: editingInvoice.requestId || "",

      clientName: editingInvoice.clientName || "",

      project: editingInvoice.project || editingInvoice.projectName || "",

      projectCode: editingInvoice.projectCode || "",

      title: editingInvoice.title || "",

      comment: editingInvoice.comment || "",
    });

    const sourceItems = editingInvoice.lineItems?.length
      ? editingInvoice.lineItems
      : editingInvoice.items?.length
        ? editingInvoice.items
        : [];

    setLineItems(
      sourceItems.length
        ? normalizeLineItemsForSave(sourceItems)
        : [getEmptyLineItem(1)],
    );
  }, [editingInvoice]);

  const tableColumns: Record<TableColumnKey, TableColumnConfig> = {
    date: {
      label: "Date",

      headerClassName: "min-w-[150px] px-3 text-left font-semibold",

      headerContentClassName: "justify-start",

      cellClassName: "px-3 py-3 align-top",

      render: (item) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-10 w-[180px] justify-start rounded-xl border-slate-200 bg-white text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />

              {item.date ? format(new Date(item.date), "PPP") : "Pick date"}
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-auto rounded-xl p-0">
            <Calendar
              mode="single"
              selected={item.date ? new Date(item.date) : undefined}
              onSelect={(date) =>
                updateLineItem(item.id, "date", date?.toISOString() || "")
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      ),
    },

    service: {
      label: getLineItemLabel(invoiceType),

      headerClassName: "min-w-[160px] px-3 text-left font-semibold",

      headerContentClassName: "justify-start",

      cellClassName: "px-3 py-3 align-top",

      render: (item) => (
        <Input
          className="h-10 rounded-xl border-slate-200 bg-slate-50/60 text-sm"
          value={item.service}
          onChange={(e) => updateLineItem(item.id, "service", e.target.value)}
          placeholder={invoiceType === "asset" ? "Asset name" : "Service"}
        />
      ),
    },

    description: {
      label: "Description",

      headerClassName: "min-w-[240px] px-3 text-left font-semibold",

      headerContentClassName: "justify-start",

      cellClassName: "px-3 py-3 align-top",

      render: (item) => (
        <AutoResizeTextarea
          value={item.description}
          minWidthCh={24}
          maxWidthCh={78}
          minHeight={40}
          maxHeight={160}
          placeholder="Enter description"
          className="rounded-xl border-slate-200 bg-slate-50/60"
          onChange={(e) =>
            updateLineItem(item.id, "description", e.target.value)
          }
        />
      ),
    },

    vendor: {
      label: "Vendor",

      headerClassName: "min-w-[190px] px-3 text-left font-semibold",

      headerContentClassName: "justify-start",

      cellClassName: "px-3 py-3 align-top",

      render: (item) => (
        <>
          <Input
            list={`vendor-options-${item.id}`}
            className="h-10 rounded-xl border-slate-200 bg-slate-50/60 text-sm"
            value={item.vendor}
            onChange={(e) => updateLineItem(item.id, "vendor", e.target.value)}
            placeholder="Enter vendor name"
            required
          />

          <datalist id={`vendor-options-${item.id}`}>
            {suppliers.map((supplier) => {
              const supplierName = getSupplierDisplayName(supplier);

              if (!supplierName) {
                return null;
              }

              return (
                <option key={supplier.id} value={supplierName}>
                  {supplierName}
                </option>
              );
            })}
          </datalist>
        </>
      ),
    },

    units: {
      label: "Units",

      headerClassName: "w-[100px] px-3 text-center font-semibold",

      headerContentClassName: "justify-center",

      cellClassName: "px-3 py-3 align-top",

      render: (item) => (
        <Input
          type="text"
          inputMode="decimal"
          className="h-10 rounded-xl border-slate-200 bg-slate-50/60 text-center text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          value={item.units}
          onChange={(e) =>
            updateLineItem(
              item.id,
              "units",
              sanitizeDecimalInput(e.target.value),
            )
          }
          placeholder="0"
        />
      ),
    },

    unitRate: {
      label: "Rate",

      headerClassName: "w-[130px] px-3 text-center font-semibold",

      headerContentClassName: "justify-center",

      cellClassName: "px-3 py-3 align-top",

      render: (item) => (
        <AutoResizeTextarea
          value={formatNumberWithCommas(item.unitRate)}
          inputMode="decimal"
          minWidthCh={8}
          maxWidthCh={18}
          minHeight={40}
          maxHeight={90}
          className="rounded-xl border-slate-200 bg-slate-50/60 text-center"
          placeholder="0"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
            }
          }}
          onChange={(e) =>
            updateLineItem(
              item.id,
              "unitRate",
              sanitizeDecimalInput(e.target.value),
            )
          }
        />
      ),
    },

    total: {
      label: "Total",

      headerClassName: "w-[130px] px-3 text-right font-semibold",

      headerContentClassName: "justify-end",

      cellClassName:
        "px-3 py-4 text-right align-top font-semibold text-slate-950",

      render: (item) => formatAmount(item.total),
    },

    comment: {
      label: "Comment",

      headerClassName: "min-w-[210px] px-3 text-left font-semibold",

      headerContentClassName: "justify-start",

      cellClassName: "px-3 py-3 align-top",

      render: (item) => (
        <Input
          className="h-10 rounded-xl border-slate-200 bg-slate-50/60 text-sm"
          value={item.comment}
          onChange={(e) => updateLineItem(item.id, "comment", e.target.value)}
          placeholder="Comment"
        />
      ),
    },

    actions: {
      label: "Action",

      headerClassName: "w-[110px] px-3 text-center font-semibold",

      headerContentClassName: "justify-center",

      cellClassName: "px-3 py-4 text-center align-top",

      render: (item) => (
        <div className="flex items-center justify-center gap-1">
          <span
            role="button"
            tabIndex={0}
            draggable
            onDragStart={(event) => handleRowDragStart(event, item.id)}
            onDragEnd={handleRowDragEnd}
            className="inline-flex cursor-grab items-center justify-center rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing"
            title="Drag to reorder row"
          >
            <GripVertical size={18} />
          </span>

          <button
            type="button"
            onClick={() => removeLineItem(item.id)}
            className="rounded-full p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            title="Delete row"
            disabled={lineItems.length === 1}
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        /* Keep popup open for overlay click, Escape key and default Radix close. */
      }}
    >
      <DialogContent
        className="left-0 top-0 h-[100dvh] max-h-none w-screen max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-none border-0 bg-slate-50 p-0 text-slate-950 shadow-none sm:rounded-none [&>button]:hidden"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <div className="flex h-full min-h-0 flex-col">
          <DialogHeader className="border-b border-slate-200 bg-white/95 px-6 py-4 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                    Budget Request
                  </span>

                  <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500">
                    {editingInvoice ? "Editing draft" : "New submission"}
                  </span>

                  {editingInvoice && formData.requestId && (
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {formData.requestId}
                    </span>
                  )}
                </div>

                <DialogTitle className="text-2xl font-semibold tracking-tight text-slate-950">
                  {editingInvoice
                    ? "Edit Budget Request"
                    : "Create Budget Request"}
                </DialogTitle>

                <p className="mt-1 text-sm text-slate-500">
                  Full-screen workspace with controlled close, clean line items,
                  and export-ready request data.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  aria-label="Close budget request popup"
                  className="rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="mx-auto flex w-full flex-col gap-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      Request ID
                    </p>

                    <p className="mt-2 text-xl font-semibold text-slate-950">
                      {editingInvoice
                        ? formData.requestId || "-"
                        : "Assigned on submission"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      Total Amount
                    </p>

                    <p className="mt-2 text-2xl font-semibold text-slate-950">
                      Rs {formatAmount(totalAmount)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      Request Type
                    </p>

                    <p className="mt-2 text-2xl font-semibold capitalize text-slate-950">
                      {getInvoiceTypeLabel(invoiceType)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      {invoiceType === "asset" ? "Asset Rows" : "Service Rows"}
                    </p>

                    <p className="mt-2 text-2xl font-semibold text-slate-950">
                      {lineItems.length}
                    </p>
                  </div>
                </div>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-950">
                        Request Details
                      </h3>

                      <p className="text-sm text-slate-500">
                        Select the request mode and fill the required details.
                      </p>
                    </div>

                    <div className="inline-flex w-fit rounded-full bg-slate-100 p-1">
                      <Button
                        type="button"
                        variant={
                          invoiceType === "general" ? "default" : "ghost"
                        }
                        onClick={() => setInvoiceType("general")}
                        className="rounded-full px-5"
                      >
                        General
                      </Button>

                      <Button
                        type="button"
                        variant={
                          invoiceType === "project" ? "default" : "ghost"
                        }
                        onClick={() => setInvoiceType("project")}
                        className="rounded-full px-5"
                      >
                        Project
                      </Button>

                      <Button
                        type="button"
                        variant={invoiceType === "asset" ? "default" : "ghost"}
                        onClick={() => setInvoiceType("asset")}
                        className="rounded-full px-5"
                      >
                        Asset
                      </Button>
                    </div>
                  </div>

                  <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Request ID
                      </Label>

                      <Input
                        value={editingInvoice ? formData.requestId : ""}
                        readOnly
                        placeholder={
                          editingInvoice
                            ? "Request ID"
                            : "Assigned automatically when submitted"
                        }
                        className="h-11 rounded-xl border-blue-200 bg-blue-50 font-semibold text-blue-800"
                      />

                      {!editingInvoice && (
                        <p className="text-xs text-slate-400">
                          The Request ID will be generated automatically only
                          after this request is successfully saved.
                        </p>
                      )}
                    </div>
                  </div>

                  {invoiceType !== "project" && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {invoiceType === "asset"
                            ? "Asset Title *"
                            : "Title *"}
                        </Label>

                        <Input
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({
                              ...formData,

                              title: e.target.value,
                            })
                          }
                          placeholder={
                            invoiceType === "asset"
                              ? "Enter asset request title"
                              : "Enter request title"
                          }
                          required
                          className="h-11 rounded-xl border-slate-200 bg-slate-50/60"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {invoiceType === "asset"
                            ? "Asset Subject"
                            : "Subject"}
                        </Label>

                        <Input
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder={
                            invoiceType === "asset"
                              ? "Enter asset subject"
                              : "Enter request subject"
                          }
                          className="h-11 rounded-xl border-slate-200 bg-slate-50/60"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {invoiceType === "asset"
                            ? "Asset Details"
                            : "Message"}
                        </Label>

                        <Textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder={
                            invoiceType === "asset"
                              ? "Enter asset details or justification"
                              : "Enter request message"
                          }
                          rows={4}
                          className="rounded-xl border-slate-200 bg-slate-50/60"
                        />
                      </div>
                    </div>
                  )}

                  {invoiceType === "project" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Estimate No *
                        </Label>

                        <Input
                          list="estimate-options"
                          value={selectedEstimateInput}
                          onChange={(e) => handleEstimateSelect(e.target.value)}
                          placeholder="Select or type estimate number"
                          required
                          className="h-11 rounded-xl border-slate-200 bg-slate-50/60"
                        />

                        <datalist id="estimate-options">
                          {estimates.map((e) => (
                            <option
                              key={e.id}
                              value={getEstimateDisplayNo(e)}
                            />
                          ))}
                        </datalist>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Client Name
                          </Label>

                          <Input
                            value={formData.clientName}
                            readOnly
                            className="h-11 rounded-xl border-slate-200 bg-slate-100 text-slate-600"
                            placeholder="Auto-filled from estimate"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Subject
                          </Label>

                          <Input
                            value={formData.title}
                            readOnly
                            className="h-11 rounded-xl border-slate-200 bg-slate-100 text-slate-600"
                            placeholder="Auto-filled from estimate"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Project
                          </Label>

                          <Input
                            value={formData.project}
                            readOnly
                            className="h-11 rounded-xl border-slate-200 bg-slate-100 text-slate-600"
                            placeholder="Auto-filled from estimate"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Project Code *
                          </Label>

                          <Input
                            value={formData.projectCode}
                            onChange={(e) =>
                              setFormData({
                                ...formData,

                                projectCode: e.target.value,
                              })
                            }
                            placeholder="Auto-filled from estimate"
                            required
                            className="h-11 rounded-xl border-slate-200 bg-slate-50/60"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-950">
                        {invoiceType === "asset"
                          ? "Assets & Costing"
                          : "Services & Costing"}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {invoiceType === "asset"
                          ? "Add each asset with vendor, quantity, rate, and comments."
                          : "Add each service row with vendor, units, rate, and comments."}
                      </p>
                    </div>

                    <Button
                      type="button"
                      onClick={addLineItem}
                      variant="outline"
                      className="gap-2 rounded-full border-slate-200 bg-white shadow-sm hover:bg-slate-50"
                    >
                      <Plus className="h-4 w-4" />

                      {invoiceType === "asset"
                        ? "Add Asset Row"
                        : "Add Service Row"}
                    </Button>
                  </div>

                  <div className="overflow-auto">
                    <table className="w-full min-w-[1250px] border-collapse text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr className="h-12 border-b border-slate-200">
                          {DEFAULT_TABLE_COLUMN_ORDER.map((columnKey) => {
                            const column = tableColumns[columnKey];

                            return (
                              <th
                                key={columnKey}
                                scope="col"
                                className={column.headerClassName}
                              >
                                <span
                                  className={`flex items-center gap-1.5 ${column.headerContentClassName}`}
                                >
                                  <span>{column.label}</span>
                                </span>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>

                      <tbody>
                        {lineItems.map((item) => {
                          const isDragging = draggedRowId === item.id;

                          const isDropTarget =
                            dragOverRowId === item.id &&
                            draggedRowId !== item.id;

                          return (
                            <tr
                              key={item.id}
                              onDragOver={(event) =>
                                handleRowDragOver(event, item.id)
                              }
                              onDragLeave={() =>
                                setDragOverRowId((current) =>
                                  current === item.id ? null : current,
                                )
                              }
                              onDrop={(event) => handleRowDrop(event, item.id)}
                              className={`border-b border-slate-100 transition-colors hover:bg-slate-50/70 ${
                                isDragging ? "opacity-60" : ""
                              } ${
                                isDropTarget
                                  ? "bg-blue-50 ring-1 ring-inset ring-blue-200"
                                  : ""
                              }`}
                            >
                              {DEFAULT_TABLE_COLUMN_ORDER.map((columnKey) => {
                                const column = tableColumns[columnKey];

                                return (
                                  <td
                                    key={`${item.id}-${columnKey}`}
                                    className={column.cellClassName}
                                  >
                                    {column.render(item)}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white px-6 py-4 shadow-[0_-8px_30px_rgba(15,23,42,0.04)]">
              <div className="mx-auto flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-8">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      Request ID
                    </p>

                    <p className="text-sm font-semibold text-slate-700">
                      {editingInvoice
                        ? formData.requestId || "-"
                        : "Assigned on submission"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      Request Total
                    </p>

                    <p className="text-xl font-semibold text-slate-950">
                      Rs {formatAmount(totalAmount)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleExportPdf}
                    className="gap-2 rounded-full border-slate-200 bg-white"
                  >
                    <FileText className="h-4 w-4" />
                    PDF
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleExportExcel}
                    className="gap-2 rounded-full border-slate-200 bg-white"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel
                  </Button>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="rounded-full px-7"
                  >
                    {loading
                      ? "Submitting..."
                      : editingInvoice
                        ? "Update & Resubmit"
                        : "Submit Request"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
