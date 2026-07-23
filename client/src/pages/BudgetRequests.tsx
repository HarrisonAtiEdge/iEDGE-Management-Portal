

// import { useEffect, useMemo, useState } from "react";
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
//   const parsed = Number(value);
//   return Number.isFinite(parsed) ? parsed : 0;
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

// function formatRoleLabel(role: any): string {
//   const roleKey = getRoleKey(role);
//   if (!roleKey) return "";

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
//     if (text) return text;
//   }
//   return "";
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
//   if (!sequenceMatch) return null;

//   const sequence = Number(sequenceMatch[1]);
//   return Number.isFinite(sequence) ? sequence : null;
// }

// function compareRequestIdsAscending(a: any, b: any): number {
//   const aSequence = getRequestIdSequence(a);
//   const bSequence = getRequestIdSequence(b);

//   if (aSequence !== null && bSequence !== null && aSequence !== bSequence) {
//     return aSequence - bSequence;
//   }

//   if (aSequence !== null && bSequence === null) return -1;
//   if (aSequence === null && bSequence !== null) return 1;

//   const aDate = getRequestDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
//   const bDate = getRequestDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
//   if (aDate !== bDate) return aDate - bDate;

//   return String(a?.id || "").localeCompare(String(b?.id || ""));
// }

// function getTableStatusSortRank(invoice: any): number {
//   const status = normalizeText(invoice?.status);

//   if (isWaitingForAdminApproval(invoice) && !wasReturnedToCreator(invoice)) {
//     return 0;
//   }

//   if (
//     wasReturnedToCreator(invoice) ||
//     ["rejected", "returned_to_creator", "changes_requested"].includes(status)
//   ) {
//     return 1;
//   }

//   // IMPORTANT:
//   // Finance approval changes status from "pending_finance" to "approved".
//   // Keep both statuses in the same sort rank so approved requests do not jump
//   // to the last pages after Finance approves them.
//   if (status === "pending_finance" || status === "approved") {
//     return 2;
//   }

//   if (status.startsWith("pending")) {
//     return 3;
//   }

//   if (
//     [
//       "po_created",
//       "po_submitted",
//       "po_approved",
//       "po_issued",
//       "ready_for_payment",
//       "payment_released",
//       "expense_submitted",
//       "expense_completed",
//     ].includes(status)
//   ) {
//     return 4;
//   }

//   return 5;
// }

// function compareBudgetRequestsForTable(a: any, b: any): number {
//   const aStatusRank = getTableStatusSortRank(a);
//   const bStatusRank = getTableStatusSortRank(b);

//   if (aStatusRank !== bStatusRank) {
//     return aStatusRank - bStatusRank;
//   }

//   return compareRequestIdsAscending(a, b);
// }

// function formatRequestDate(invoice: any) {
//   const date = getRequestDate(invoice);
//   if (!date) return "-";

//   return date.toLocaleDateString("en-PK", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// }

// function getDateInputValue(date: Date | null) {
//   if (!date) return "";

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
//   if (!text) return "";
//   if (isFirebaseIdLike(text)) return "";

//   return text;
// }

// function getUserDisplayName(user: any): string {
//   return getFirstTextValue([
//     getSafeDisplayText(user?.displayName),
//     getSafeDisplayText(user?.name),
//     getSafeDisplayText(user?.fullName),
//     getSafeDisplayText(user?.userName),
//     getSafeDisplayText(user?.username),
//     getSafeDisplayText(user?.employeeName),
//     getSafeDisplayText(user?.email),
//   ]);
// }

// const CREATOR_NAME_OVERRIDES: Record<string, string> = {
//   // Example:
//   // "wVS6kzCFiYM5dFQSEZ5P7Y8SChg1": "Bilal Tariq",
// };

// function getRoleKey(role: any): string {
//   return String(role || "")
//     .toLowerCase()
//     .trim()
//     .replace(/[\s-]+/g, "_");
// }

// function isAdminRole(role: any): boolean {
//   const roleKey = getRoleKey(role);

//   return ["admin", "main_admin", "super_admin"].includes(roleKey);
// }

// function isFinanceApproverRole(role: any): boolean {
//   const roleKey = getRoleKey(role);

//   return ["finance", "financial_admin", "finance_admin"].includes(roleKey);
// }

// function isOperationRole(role: any): boolean {
//   const roleKey = getRoleKey(role);

//   return ["operation", "operations"].includes(roleKey);
// }

// function canRoleCreateBudgetRequest(role: any): boolean {
//   const roleKey = getRoleKey(role);
//   if (!roleKey) return false;

//   return !isAdminRole(roleKey);
// }

// function canRoleSeeAllBudgetRequests(role: any): boolean {
//   return isAdminRole(role) || isFinanceApproverRole(role);
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

//   if (
//     normalizedStatus === "pending_main_admin" ||
//     normalizedStatus === "pending_admin"
//   ) {
//     return "Pending Admin";
//   }

//   if (normalizedStatus === "pending_operational_admin") return "Pending Admin";
//   if (normalizedStatus === "pending_finance") return "Pending Finance";
//   if (normalizedStatus === "rejected")
//     return getReturnedToRoleStatusLabel(invoice);

//   return formatStatus(status);
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
//   const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
//   const [rejectionLoading, setRejectionLoading] = useState(false);

//   const [searchTerm, setSearchTerm] = useState("");
//   const [typeFilter, setTypeFilter] = useState<"all" | "project" | "general">(
//     "all",
//   );
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [dateFrom, setDateFrom] = useState("");
//   const [dateTo, setDateTo] = useState("");
//   const [monthFilter, setMonthFilter] = useState("");
//   const [createdByFilter, setCreatedByFilter] = useState("all");
//   const [projectCodeFilter, setProjectCodeFilter] = useState("");
//   const [vendorFilter, setVendorFilter] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pageSize, setPageSize] = useState(10);

//   const { data: invoices = [], loading } = useFirestoreQuery<InvoiceRequest>(
//     `Panels/${PANEL_ID}/invoiceRequests`,
//   );

//   const { data: expenseSheets = [] } = useFirestoreQuery<any>(
//     `Panels/${PANEL_ID}/expenseSheets`,
//   );

//   const { data: purchaseOrders = [] } = useFirestoreQuery<any>(
//     `Panels/${PANEL_ID}/purchaseOrders`,
//   );

//   const { data: users = [] } = useFirestoreQuery<any>("users");

//   const { data: panelUsers = [] } = useFirestoreQuery<any>(
//     `Panels/${PANEL_ID}/users`,
//   );

//   const CREATE_PO_ROUTE = "/create-po";

//   function getRequestType(invoice: any): "general" | "project" {
//     const rawType = String(
//       invoice?.invoiceType || invoice?.type || "",
//     ).toLowerCase();

//     if (rawType === "project") return "project";
//     if (rawType === "general") return "general";

//     return invoice?.clientName ||
//       invoice?.project ||
//       invoice?.projectName ||
//       invoice?.projectCode
//       ? "project"
//       : "general";
//   }

//   function isProjectRequest(invoice: any): boolean {
//     return getRequestType(invoice) === "project";
//   }

//   function getLinkedPO(invoice: any): any | null {
//     const requestId = String(invoice?.requestId || "").trim();
//     const invoiceDocId = String(invoice?.id || "").trim();
//     const estimateId = String(invoice?.estimateId || "").trim();
//     const estimateNumber = String(
//       invoice?.estimateNumber ||
//         invoice?.estimateNo ||
//         invoice?.estimateValue ||
//         invoice?.selectedEstimate ||
//         invoice?.selectEstimate ||
//         "",
//     ).trim();

//     return (
//       purchaseOrders.find((po: any) => {
//         const poRequestDocLinks = [
//           po?.invoiceRequestId,
//           po?.linkedInvoiceId,
//           po?.sourceInvoiceId,
//           po?.budgetRequestDocId,
//           po?.sourceBudgetRequestId,
//           po?.requestDocId,
//           po?.invoiceId,
//         ]
//           .filter(Boolean)
//           .map((value) => String(value).trim());

//         const poRequestIdLinks = [
//           po?.requestId,
//           po?.budgetRequestId,
//           po?.linkedRequestId,
//           po?.sourceRequestId,
//           po?.invoiceNumber,
//           po?.budgetRequestNumber,
//         ]
//           .filter(Boolean)
//           .map((value) => String(value).trim());

//         const poEstimateLinks = [
//           po?.estimateId,
//           po?.estimateNumber,
//           po?.estimateNo,
//           po?.selectedEstimate,
//         ]
//           .filter(Boolean)
//           .map((value) => String(value).trim());

//         return (
//           Boolean(invoiceDocId && poRequestDocLinks.includes(invoiceDocId)) ||
//           Boolean(requestId && poRequestIdLinks.includes(requestId)) ||
//           Boolean(estimateId && poEstimateLinks.includes(estimateId)) ||
//           Boolean(estimateNumber && poEstimateLinks.includes(estimateNumber))
//         );
//       }) || null
//     );
//   }

//   function hasPOAlready(invoice: any): boolean {
//     const status = normalizeText(invoice?.status);
//     const poStatus = normalizeText(
//       invoice?.poStatus || invoice?.purchaseOrderStatus,
//     );

//     const statusSaysPOCreated = [
//       "po_created",
//       "po_submitted",
//       "po_approved",
//       "po_issued",
//       "ready_for_payment",
//     ].includes(status);

//     const poStatusSaysCreated = [
//       "created",
//       "submitted",
//       "approved",
//       "issued",
//       "ready_for_payment",
//     ].includes(poStatus);

//     const hasDirectPOFields = Boolean(
//       invoice?.poSubmitted ||
//         invoice?.poCreated ||
//         invoice?.purchaseOrderCreated ||
//         invoice?.purchaseOrderSubmitted ||
//         invoice?.poId ||
//         invoice?.poNumber ||
//         invoice?.poDocId ||
//         invoice?.purchaseOrderId ||
//         invoice?.purchaseOrderNumber ||
//         invoice?.poCreatedAt ||
//         invoice?.purchaseOrderCreatedAt,
//     );

//     return Boolean(
//       statusSaysPOCreated ||
//         poStatusSaysCreated ||
//         hasDirectPOFields ||
//         getLinkedPO(invoice),
//     );
//   }

//   function hasPaymentReleased(invoice: any): boolean {
//     const status = normalizeText(invoice?.status);
//     const paymentStatus = normalizeText(
//       invoice?.paymentStatus || invoice?.releasePaymentStatus,
//     );

//     return Boolean(
//       status === "payment_released" ||
//         paymentStatus === "released" ||
//         paymentStatus === "payment_released" ||
//         invoice?.paymentReleased ||
//         invoice?.releasePaymentCreated ||
//         invoice?.paymentReleaseId ||
//         invoice?.paymentId ||
//         invoice?.paymentReleasedAt ||
//         invoice?.releasePaymentAt,
//     );
//   }

//   function getExpenseAmount(invoice: any): number {
//     return safeNumber(
//       invoice?.approvedAmount || invoice?.totalAmount || invoice?.amount,
//     );
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
//     if (!userProfile || userProfile.role !== "operation") return false;

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
//     const vendorName =
//       request.vendorName ||
//       request.supplierName ||
//       getFirstVendorName(request) ||
//       request.clientName ||
//       "";
//     const amount = getExpenseAmount(request);

//     return {
//       ...request,
//       invoiceNumber: request.requestId,
//       linkedRequestId: request.requestId,
//       budgetRequestId: request.requestId,
//       invoiceRequestId: request.id,
//       linkedInvoiceId: request.id,
//       sourceInvoiceId: request.id,
//       sourceType: "budget_request",
//       approvalRequired: false,
//       requiresApproval: false,
//       adminApprovalRequired: false,
//       autoApproved: true,
//       autoApprovedReason:
//         "Created from approved budget request. No further approval required.",
//       expenseStatus: "submitted",
//       status: "submitted",
//       invoiceType: requestType,
//       requestType,
//       amount,
//       totalAmount: amount,
//       approvedAmount: amount,
//       vendorName,
//       supplierName: request.supplierName || vendorName,
//       clientName: request.clientName || "",
//       projectName,
//       project: projectName,
//       projectCode: request.projectCode || "",
//       poId: request.poId || "",
//       poNumber: request.poNumber || "",
//       dueDate: new Date(),
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
//     } catch (error: any) {
//       console.error("Failed to mark expense as submitted:", error);
//       toast({
//         title: "Expense submitted",
//         description:
//           "Expense was submitted, but the request status could not be updated.",
//       });
//     } finally {
//       setIsExpenseModalOpen(false);
//       setSelectedInvoice(null);
//       localStorage.removeItem("submitExpenseFromBudgetRequest");
//       localStorage.removeItem("expenseSheetSource");
//     }
//   }

//   async function handlePaymentReleased() {
//     const request: any = selectedInvoice;

//     try {
//       if (request?.id) {
//         await updateDoc(
//           doc(db, "Panels", PANEL_ID, "invoiceRequests", request.id),
//           {
//             status: "payment_released",
//             paymentReleased: true,
//             paymentStatus: "released",
//             paymentReleasedAt: serverTimestamp(),
//             updatedAt: serverTimestamp(),
//           },
//         );
//       }

//       toast({
//         title: "Payment released",
//         description: "Payment has been released successfully.",
//       });
//     } catch (error: any) {
//       console.error("Failed to mark payment as released:", error);
//       toast({
//         title: "Payment released",
//         description:
//           "Payment was released, but the request status could not be updated.",
//       });
//     } finally {
//       setIsPaymentModalOpen(false);
//       setSelectedInvoice(null);
//     }
//   }

//   function getFirstVendorName(invoice: any): string {
//     const lineItems = Array.isArray(invoice?.lineItems)
//       ? invoice.lineItems
//       : [];
//     const approvedItems = Array.isArray(invoice?.approvalItems)
//       ? invoice.approvalItems
//       : [];
//     const allItems = [...approvedItems, ...lineItems];

//     const matchedItem = allItems.find(
//       (item: any) =>
//         item?.vendor ||
//         item?.vendorName ||
//         item?.supplier ||
//         item?.supplierName ||
//         item?.original?.vendor ||
//         item?.original?.supplier,
//     );

//     return (
//       matchedItem?.vendor ||
//       matchedItem?.vendorName ||
//       matchedItem?.supplier ||
//       matchedItem?.supplierName ||
//       matchedItem?.original?.vendor ||
//       matchedItem?.original?.supplier ||
//       ""
//     );
//   }

//   function getVendorFilterText(invoice: any): string {
//     return getFirstTextValue([
//       invoice?.vendorName,
//       invoice?.supplierName,
//       getFirstVendorName(invoice),
//     ]);
//   }

//   function handleCreatePO(invoice: InvoiceRequest) {
//     const request: any = invoice;

//     localStorage.setItem(
//       "createPOFromBudgetRequest",
//       JSON.stringify({
//         invoiceRequestId: request.id,
//         budgetRequestDocId: request.id,
//         budgetRequestId: request.requestId,
//         requestId: request.requestId,
//         invoiceType: getRequestType(request),
//         sourceType: "budget_request",
//         returnToBudgetRequests: true,
//         updateBudgetRequestAfterPO: true,

//         estimateId: request.estimateId || "",
//         estimateNumber:
//           request.estimateNumber ||
//           request.estimateNo ||
//           request.estimateValue ||
//           request.selectedEstimate ||
//           request.selectEstimate ||
//           "",

//         clientName: request.clientName || "",
//         projectName: request.projectName || request.project || "",
//         project: request.project || request.projectName || "",
//         projectCode: request.projectCode || "",
//         title: request.title || request.subject || "",
//         subject: request.subject || "",
//         message: request.message || "",

//         supplierId: request.supplierId || request.vendorId || "",
//         supplierName:
//           request.supplierName ||
//           request.vendorName ||
//           getFirstVendorName(request),
//         vendorName:
//           request.vendorName ||
//           request.supplierName ||
//           getFirstVendorName(request),

//         totalAmount: Number(request.totalAmount || 0),
//         approvedAmount: Number(
//           request.approvedAmount || request.totalAmount || 0,
//         ),

//         approvalItems: request.approvalItems || [],
//         lineItems: request.lineItems || [],
//         items: request.items || request.lineItems || [],
//       }),
//     );

//     setLocation(CREATE_PO_ROUTE);
//   }

//   async function handleApprove(invoice: InvoiceRequest) {
//     if (!userProfile) return;

//     const roleKey = getRoleKey(userProfile.role);
//     const status = normalizeText(invoice.status);
//     const approvalHistory = Array.isArray((invoice as any).approvalHistory)
//       ? (invoice as any).approvalHistory
//       : [];

//     let newStatus = status;
//     let currentApprover = String((invoice as any).currentApprover || "");

//     const updatePayload: Record<string, any> = {
//       approvalHistory: [
//         ...approvalHistory,
//         {
//           approver:
//             userProfile.displayName ||
//             (userProfile as any)?.name ||
//             userProfile.email ||
//             roleKey,
//           approverRole: roleKey,
//           action: "approved",
//           timestamp: new Date(),
//           notes: "",
//         },
//       ],
//       returnedToCreator: false,
//       needsCreatorRevision: false,
//       returnedToRole: "",
//       returnedToRoleLabel: "",
//       updatedAt: serverTimestamp(),
//     };

//     if (isAdminRole(roleKey) && isWaitingForAdminApproval(invoice)) {
//       newStatus = "pending_finance";
//       currentApprover = "finance";
//       updatePayload.adminApprovedAt = serverTimestamp();
//       updatePayload.adminApprovedBy =
//         userProfile.displayName || userProfile.email || "";
//       updatePayload.adminApprovedById =
//         userProfile.id ||
//         (userProfile as any)?.uid ||
//         (userProfile as any)?.userId ||
//         userProfile.email ||
//         "";
//     } else if (isFinanceApproverRole(roleKey) && status === "pending_finance") {
//       newStatus = "approved";
//       currentApprover = "";
//       updatePayload.financeApprovedAt = serverTimestamp();
//       updatePayload.financeApprovedBy =
//         userProfile.displayName || userProfile.email || "";
//       updatePayload.financeApprovedById =
//         userProfile.id ||
//         (userProfile as any)?.uid ||
//         (userProfile as any)?.userId ||
//         userProfile.email ||
//         "";
//       updatePayload.approvedAt = serverTimestamp();
//     } else {
//       toast({
//         title: "Action not allowed",
//         description:
//           "This request is not currently assigned to your approval stage.",
//         variant: "destructive",
//       });
//       return;
//     }

//     try {
//       await updateDoc(
//         doc(db, "Panels", PANEL_ID, "invoiceRequests", invoice.id),
//         {
//           ...updatePayload,
//           status: newStatus,
//           currentApprover,
//         },
//       );

//       toast({
//         title: "Success",
//         description: "Budget request approved successfully",
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

//   async function handleReject(
//     invoice: InvoiceRequest,
//     rejectionComment: string,
//   ) {
//     if (!userProfile) return;

//     try {
//       setRejectionLoading(true);

//       const roleKey = getRoleKey(userProfile.role);
//       const ownerId = getBudgetRequestOwnerId(invoice);
//       const approvalHistory = Array.isArray((invoice as any).approvalHistory)
//         ? (invoice as any).approvalHistory
//         : [];

//       const returnedToRole = getBudgetRequestOwnerRole(invoice);
//       const returnedToRoleLabel = formatRoleLabel(returnedToRole);

//       await updateDoc(
//         doc(db, "Panels", PANEL_ID, "invoiceRequests", invoice.id),
//         {
//           status: "rejected",
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
//               approverRole: roleKey,
//               action: "rejected",
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
//           returnedToRoleLabel || "the original role"
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

//   function getStatusBadgeColor(status: string, invoice?: any): string {
//     if (invoice && wasReturnedToCreator(invoice)) {
//       return "border-red-200 bg-red-50 text-red-700";
//     }

//     switch (status) {
//       case "approved":
//       case "payment_released":
//       case "expense_submitted":
//       case "expense_completed":
//         return "border-green-200 bg-green-50 text-green-700";
//       case "rejected":
//       case "returned_to_creator":
//       case "changes_requested":
//         return "border-red-200 bg-red-50 text-red-700";
//       case "pending_operational_admin":
//       case "pending_main_admin":
//       case "pending_admin":
//       case "pending_finance":
//         return "border-amber-200 bg-amber-50 text-amber-700";
//       default:
//         return "border-slate-200 bg-slate-50 text-slate-700";
//     }
//   }

//   function getTypeBadgeColor(type: "general" | "project") {
//     return type === "project"
//       ? "border-indigo-200 bg-indigo-50 text-indigo-700"
//       : "border-slate-200 bg-slate-50 text-slate-700";
//   }

//   function getCurrentStep(invoice: InvoiceRequest): string {
//     const status = normalizeText(invoice.status || "");

//     if (
//       (invoice as any).expenseSubmitted ||
//       status === "expense_submitted" ||
//       hasExpenseSheet(invoice)
//     ) {
//       return "Expense Submitted / No Approval Required";
//     }

//     if (hasPaymentReleased(invoice)) {
//       return "Payment Released / Ready for Expense";
//     }

//     if (isProjectRequest(invoice) && hasPOAlready(invoice)) {
//       return "PO Created / Ready for Payment";
//     }

//     if (wasReturnedToCreator(invoice)) {
//       return `${getBudgetRequestStatusLabel(invoice)} / Waiting for Resubmission`;
//     }

//     switch (status) {
//       case "pending_operational_admin":
//       case "pending_main_admin":
//       case "pending_admin":
//         return "Admin Approval";
//       case "pending_finance":
//         return "Finance Approval";
//       case "approved":
//         return isProjectRequest(invoice) ? "Ready for PO" : "Ready for Payment";
//       case "po_created":
//       case "po_submitted":
//       case "po_approved":
//       case "po_issued":
//       case "ready_for_payment":
//         return "PO Created / Ready for Payment";
//       case "payment_released":
//         return "Payment Released / Ready for Expense";
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
//     if (!userProfile) return false;

//     const roleKey = getRoleKey(userProfile.role);

//     if (isAdminRole(roleKey)) {
//       return isWaitingForAdminApproval(invoice);
//     }

//     if (isFinanceApproverRole(roleKey)) {
//       return normalizeText(invoice.status) === "pending_finance";
//     }

//     return false;
//   }

//   function canEdit(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;

//     if (!isOwnBudgetRequest(invoice)) return false;

//     if (hasAdminApprovedBudgetRequest(invoice)) return false;

//     const status = normalizeText(invoice.status);

//     return (
//       wasReturnedToCreator(invoice) ||
//       status === "draft" ||
//       status === "pending_main_admin" ||
//       status === "pending_admin" ||
//       status === "pending_operational_admin" ||
//       status === ""
//     );
//   }

//   function getEditableInvoice(invoice: InvoiceRequest): InvoiceRequest {
//     if (hasAdminApprovedBudgetRequest(invoice)) return invoice;

//     if (!wasReturnedToCreator(invoice)) return invoice;

//     return {
//       ...(invoice as any),
//       status: "pending_main_admin",
//       currentApprover: "main_admin",
//       returnedToCreator: false,
//       needsCreatorRevision: false,
//       returnedToRole: "",
//       returnedToRoleLabel: "",
//       resubmittedAt: new Date(),
//     } as InvoiceRequest;
//   }

//   function canReleasePayment(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;

//     const isFinanceUser = isFinanceApproverRole(userProfile.role);
//     if (!isFinanceUser) return false;

//     if (hasPaymentReleased(invoice)) return false;

//     if (
//       (invoice as any).expenseSubmitted ||
//       String(invoice.status) === "expense_submitted"
//     ) {
//       return false;
//     }

//     const status = normalizeText(invoice.status);
//     const readyForPayment = [
//       "approved",
//       "po_created",
//       "po_submitted",
//       "po_approved",
//       "po_issued",
//       "ready_for_payment",
//     ].includes(status);

//     if (!readyForPayment) return false;

//     if (!isProjectRequest(invoice)) return true;

//     return hasPOAlready(invoice);
//   }

//   function canCreatePO(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;

//     return (
//       isFinanceApproverRole(userProfile.role) &&
//       normalizeText(invoice.status) === "approved" &&
//       isProjectRequest(invoice) &&
//       !hasPOAlready(invoice) &&
//       !hasPaymentReleased(invoice)
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

//     if (!expenseSheets) return null;

//     const expenseSheet = expenseSheets.find((expense: any) =>
//       isExpenseLinkedToRequest(expense, invoice),
//     );

//     return expenseSheet?.status || expenseSheet?.expenseStatus || null;
//   }

//   const canCreateInvoices = canRoleCreateBudgetRequest(currentUserRole);

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

//       if (!lookupKey) continue;

//       const matchedUser = usersByLookup.get(lookupKey);
//       if (matchedUser) return matchedUser;
//     }

//     return null;
//   }

//   function canCurrentUserSeeAllBudgetRequests() {
//     const userRecord = getCurrentUserRecordFromUsersCollection();
//     const effectiveRole = getRoleKey(currentUserRole || userRecord?.role);

//     if (canRoleSeeAllBudgetRequests(effectiveRole)) return true;

//     if (!isOperationRole(effectiveRole)) return false;

//     return Boolean(
//       (userProfile as any)?.canViewAllBudgetRequests ||
//         userRecord?.canViewAllBudgetRequests,
//     );
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

//         if (lookupKey) map.set(lookupKey, user);
//       });
//     });

//     return map;
//   }, [users, panelUsers]);

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
//     if (directRole) return directRole;

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

//       if (!lookupKey) continue;

//       const matchedUser = usersByLookup.get(lookupKey);
//       const matchedRole = getUserRoleLabel(matchedUser);

//       if (matchedRole) return matchedRole;
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

//     if (isCurrentUserOwner) return getRoleKey(userProfile?.role);

//     return "";
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

//     return getStatusLabel(invoice?.status || "", invoice);
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

//       if (!name) return;

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

//         if (lookupKey && !map.has(lookupKey)) map.set(lookupKey, name);
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

//     if (directName) return directName;

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

//       if (!lookupKey) continue;

//       const overrideName = getSafeDisplayText(
//         CREATOR_NAME_OVERRIDES[rawKey] || CREATOR_NAME_OVERRIDES[lookupKey],
//       );

//       if (overrideName) return overrideName;

//       const nameFromAnotherRequest = getSafeDisplayText(
//         creatorNamesByLookup.get(lookupKey),
//       );

//       if (nameFromAnotherRequest) return nameFromAnotherRequest;

//       const matchedUser = usersByLookup.get(lookupKey);
//       const matchedName = getSafeDisplayText(getUserDisplayName(matchedUser));

//       if (matchedName) return matchedName;
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

//     const ownerLookupValues = lookupValues
//       .map((value) =>
//         String(value || "")
//           .trim()
//           .toLowerCase(),
//       )
//       .filter(Boolean);

//     const isCurrentUserOwner = ownerLookupValues.some((ownerKey) =>
//       currentUserLookupValues.includes(ownerKey),
//     );

//     if (isCurrentUserOwner) {
//       const currentUserName = getFirstTextValue([
//         getSafeDisplayText(userProfile?.displayName),
//         getSafeDisplayText((userProfile as any)?.name),
//         getSafeDisplayText((userProfile as any)?.fullName),
//         getSafeDisplayText(userProfile?.email),
//       ]);

//       if (currentUserName) return currentUserName;
//     }

//     const emailFallback = getFirstTextValue([
//       getSafeDisplayText(invoice?.createdByEmail),
//       getSafeDisplayText(invoice?.submittedByEmail),
//       getSafeDisplayText(invoice?.email),
//     ]);

//     if (emailFallback) return emailFallback;

//     return "Unknown User";
//   }

//   const visibleInvoicesForFilterOptions = useMemo(() => {
//     return (invoices || []).filter((invoice: any) => {
//       const canSeeAllRequests = canCurrentUserSeeAllBudgetRequests();
//       return canSeeAllRequests || isOwnBudgetRequest(invoice);
//     });
//   }, [invoices, userProfile, currentUserRole, usersByLookup]);

//   const createdByOptions = useMemo(() => {
//     const names = Array.from(
//       new Set(
//         visibleInvoicesForFilterOptions
//           .map((invoice: any) => getCreatedByName(invoice))
//           .filter((name) => String(name || "").trim()),
//       ),
//     );

//     return names.sort((a, b) => a.localeCompare(b));
//   }, [
//     visibleInvoicesForFilterOptions,
//     usersByLookup,
//     creatorNamesByLookup,
//     userProfile,
//   ]);

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

//   const statusOptions = useMemo(() => {
//     const uniqueStatuses = Array.from(
//       new Set(
//         (invoices || []).map((invoice) => invoice.status).filter(Boolean),
//       ),
//     );

//     return uniqueStatuses.sort();
//   }, [invoices]);

//   const filteredInvoices = useMemo(() => {
//     const search = normalizeText(searchTerm);
//     const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
//     const toDate = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

//     return (invoices || []).filter((invoice: any) => {
//       const requestType = getRequestType(invoice);
//       const requestDate = getRequestDate(invoice);
//       const requestDateInputValue = getDateInputValue(requestDate);
//       const createdByName = getCreatedByName(invoice);
//       const projectCode = String(invoice?.projectCode || "").trim();
//       const vendorName = getVendorFilterText(invoice);

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
//           createdByName,
//           (invoice as any).createdByName,
//           (invoice as any).submittedByName,
//           (invoice as any).requestedByName,
//           (invoice as any).createdByEmail,
//           (invoice as any).submittedByEmail,
//         ].join(" "),
//       );

//       const matchesSearch = !search || haystack.includes(search);
//       const matchesType = typeFilter === "all" || requestType === typeFilter;
//       const matchesStatus =
//         statusFilter === "all" || invoice.status === statusFilter;
//       const matchesMonth =
//         !monthFilter || requestDateInputValue.startsWith(monthFilter);
//       const matchesCreatedBy =
//         createdByFilter === "all" ||
//         normalizeText(createdByName) === normalizeText(createdByFilter);
//       const matchesProjectCode =
//         !normalizeText(projectCodeFilter) ||
//         normalizeText(projectCode).includes(normalizeText(projectCodeFilter));
//       const matchesVendor =
//         !normalizeText(vendorFilter) ||
//         normalizeText(vendorName).includes(normalizeText(vendorFilter));
//       const matchesFrom = !fromDate || (requestDate && requestDate >= fromDate);
//       const matchesTo = !toDate || (requestDate && requestDate <= toDate);
//       const canSeeAllRequests = canCurrentUserSeeAllBudgetRequests();
//       const matchesOwnership = canSeeAllRequests || isOwnBudgetRequest(invoice);

//       return (
//         matchesOwnership &&
//         matchesSearch &&
//         matchesType &&
//         matchesStatus &&
//         matchesMonth &&
//         matchesCreatedBy &&
//         matchesProjectCode &&
//         matchesVendor &&
//         matchesFrom &&
//         matchesTo
//       );
//     });
//   }, [
//     dateFrom,
//     dateTo,
//     invoices,
//     monthFilter,
//     searchTerm,
//     statusFilter,
//     typeFilter,
//     createdByFilter,
//     projectCodeFilter,
//     vendorFilter,
//     userProfile,
//     currentUserRole,
//     usersByLookup,
//     creatorNamesByLookup,
//   ]);

//   const summary = useMemo(() => {
//     const totalAmount = filteredInvoices.reduce(
//       (sum, invoice: any) => sum + safeNumber(invoice.totalAmount),
//       0,
//     );

//     const projectCount = filteredInvoices.filter(
//       (invoice) => getRequestType(invoice) === "project",
//     ).length;

//     const generalCount = filteredInvoices.filter(
//       (invoice) => getRequestType(invoice) === "general",
//     ).length;

//     const approvedCount = filteredInvoices.filter(
//       (invoice) => invoice.status === "approved",
//     ).length;

//     return { totalAmount, projectCount, generalCount, approvedCount };
//   }, [filteredInvoices]);

//   const sortedInvoices = useMemo(() => {
//     return [...filteredInvoices].sort(compareBudgetRequestsForTable);
//   }, [filteredInvoices]);

//   const totalPages = Math.max(1, Math.ceil(sortedInvoices.length / pageSize));
//   const startIndex = (currentPage - 1) * pageSize;
//   const paginatedInvoices = sortedInvoices.slice(
//     startIndex,
//     startIndex + pageSize,
//   );
//   const showingFrom = sortedInvoices.length === 0 ? 0 : startIndex + 1;
//   const showingTo = Math.min(startIndex + pageSize, sortedInvoices.length);

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
//     pageSize,
//   ]);

//   useEffect(() => {
//     if (currentPage > totalPages) setCurrentPage(totalPages);
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
//     setPageSize(10);
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
//             <p className="mt-2 max-w-2xl text-sm text-slate-500">
//               Review project and general budget requests, send requests through
//               Admin and Finance approval, release payments, or create POs.
//             </p>
//           </div>

//           {canCreateInvoices && (
//             <Button
//               className="h-11 rounded-2xl px-5 shadow-sm"
//               onClick={() => {
//                 setSelectedInvoice(null);
//                 setIsInvoiceModalOpen(true);
//               }}
//               data-testid="button-new-invoice-request"
//             >
//               + New Request
//             </Button>
//           )}
//         </div>

//         <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
//                 Filtered Value
//               </p>
//               <p className="mt-3 text-2xl font-semibold text-slate-950">
//                 Rs {formatPKR(summary.totalAmount)}
//               </p>
//               <p className="mt-1 text-xs text-slate-400">
//                 Approved waiting: {summary.approvedCount}
//               </p>
//             </CardContent>
//           </Card>
//         </div>

//         <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//           <CardContent className="space-y-4 p-5">
//             <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
//               <div className="xl:col-span-2">
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Search
//                 </label>
//                 <input
//                   value={searchTerm}
//                   onChange={(event) => setSearchTerm(event.target.value)}
//                   placeholder="Request ID, client, project, title..."
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Created By
//                 </label>
//                 <select
//                   value={createdByFilter}
//                   onChange={(event) => setCreatedByFilter(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 >
//                   <option value="all">All Creators</option>
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
//                   onChange={(event) =>
//                     setProjectCodeFilter(event.target.value)
//                   }
//                   placeholder="Enter project code..."
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Request Type
//                 </label>
//                 <select
//                   value={typeFilter}
//                   onChange={(event) =>
//                     setTypeFilter(
//                       event.target.value as "all" | "project" | "general",
//                     )
//                   }
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 >
//                   <option value="all">All Types</option>
//                   <option value="project">Project</option>
//                   <option value="general">General</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Status
//                 </label>
//                 <select
//                   value={statusFilter}
//                   onChange={(event) => setStatusFilter(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 >
//                   <option value="all">All Statuses</option>
//                   {statusOptions.map((status) => (
//                     <option key={status} value={status}>
//                       {getStatusLabel(status)}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Month
//                 </label>
//                 <input
//                   type="month"
//                   value={monthFilter}
//                   onChange={(event) => setMonthFilter(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>
//             </div>

//             <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Vendor
//                 </label>
//                 <input
//                   value={vendorFilter}
//                   onChange={(event) => setVendorFilter(event.target.value)}
//                   placeholder="Enter vendor name..."
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   From Date
//                 </label>
//                 <input
//                   type="date"
//                   value={dateFrom}
//                   onChange={(event) => setDateFrom(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   To Date
//                 </label>
//                 <input
//                   type="date"
//                   value={dateTo}
//                   onChange={(event) => setDateTo(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Rows
//                 </label>
//                 <select
//                   value={pageSize}
//                   onChange={(event) => setPageSize(Number(event.target.value))}
//                   className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
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

//         <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm">
//           <CardContent className="p-0">
//             <div className="overflow-x-auto">
//               <table className="w-full min-w-[1250px]">
//                 <thead>
//                   <tr className="border-b border-slate-200 bg-slate-50/80">
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Request ID
//                     </th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Type
//                     </th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Client / Title
//                     </th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Project
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
//                       <td colSpan={10} className="px-6 py-12 text-center">
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
//                         type === "general"
//                           ? (invoice as any).title ||
//                             (invoice as any).subject ||
//                             "General Request"
//                           : (invoice as any).clientName || "-";

//                       const projectName =
//                         type === "project"
//                           ? (invoice as any).projectName ||
//                             (invoice as any).project ||
//                             (invoice as any).projectCode ||
//                             "-"
//                           : "-";

//                       const createdByName = getCreatedByName(invoice);

//                       return (
//                         <tr
//                           key={invoice.id}
//                           className="transition hover:bg-slate-50/80"
//                         >
//                           <td
//                             className="px-5 py-4 text-sm font-semibold text-slate-900"
//                             data-testid={`text-request-id-${invoice.id}`}
//                           >
//                             {invoice.requestId || "-"}
//                           </td>

//                           <td className="px-5 py-4">
//                             <Badge
//                               variant="outline"
//                               className={`rounded-full px-3 py-1 ${getTypeBadgeColor(
//                                 type,
//                               )}`}
//                             >
//                               {type === "project" ? "Project" : "General"}
//                             </Badge>
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-700">
//                             <div className="font-medium text-slate-900">
//                               {displayClientOrTitle}
//                             </div>
//                             {(invoice as any).projectCode &&
//                               type === "project" && (
//                                 <div className="mt-1 text-xs text-slate-400">
//                                   Code: {(invoice as any).projectCode}
//                                 </div>
//                               )}
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-600">
//                             {projectName}
//                           </td>

//                           <td
//                             className="px-5 py-4 text-sm font-medium text-slate-700"
//                             data-testid={`text-created-by-${invoice.id}`}
//                           >
//                             {createdByName}
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-600">
//                             {formatRequestDate(invoice)}
//                           </td>

//                           <td className="px-5 py-4 text-sm font-semibold text-slate-900">
//                             Rs {formatPKR(invoice.totalAmount)}
//                           </td>

//                           <td className="px-5 py-4">
//                             <Badge
//                               variant="outline"
//                               className={`rounded-full px-3 py-1 ${getStatusBadgeColor(
//                                 invoice.status,
//                                 invoice,
//                               )}`}
//                             >
//                               {getBudgetRequestStatusLabel(invoice)}
//                             </Badge>
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-500">
//                             {getCurrentStep(invoice)}
//                           </td>

//                           <td className="px-5 py-4">
//                             <div className="flex flex-wrap gap-2">
//                               <Button
//                                 variant="outline"
//                                 size="sm"
//                                 className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
//                                 onClick={() => openDetailsModal(invoice)}
//                                 data-testid={`button-view-details-${invoice.id}`}
//                               >
//                                 View
//                               </Button>

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
//                                           "This request can no longer be edited because it has already been approved by Admin.",
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

//                               {canReleasePayment(invoice) && (
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   className="rounded-xl border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
//                                   onClick={() => {
//                                     const linkedPO = getLinkedPO(invoice);

//                                     setSelectedInvoice({
//                                       ...invoice,
//                                       invoiceNumber: invoice.requestId,
//                                       vendorName:
//                                         (invoice as any).vendorName ||
//                                         (invoice as any).supplierName ||
//                                         (invoice as any).clientName,
//                                       amount:
//                                         (invoice as any).approvedAmount ||
//                                         invoice.totalAmount,
//                                       dueDate: new Date(),
//                                       poId:
//                                         (invoice as any).poId ||
//                                         (invoice as any).poDocId ||
//                                         linkedPO?.id ||
//                                         linkedPO?.poId ||
//                                         linkedPO?.poDocId ||
//                                         "",
//                                       poNumber:
//                                         (invoice as any).poNumber ||
//                                         (invoice as any).purchaseOrderNumber ||
//                                         linkedPO?.poNumber ||
//                                         linkedPO?.purchaseOrderNumber ||
//                                         "",
//                                     } as any);
//                                     setIsPaymentModalOpen(true);
//                                   }}
//                                   data-testid={`button-release-payment-${invoice.id}`}
//                                 >
//                                   Release Payment
//                                 </Button>
//                               )}

//                               {canCreatePO(invoice) && (
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   className="rounded-xl border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
//                                   onClick={() => handleCreatePO(invoice)}
//                                   data-testid={`button-create-po-${invoice.id}`}
//                                 >
//                                   Create PO
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

//               <div className="flex items-center gap-2">
//                 <Button
//                   type="button"
//                   variant="outline"
//                   size="sm"
//                   className="rounded-xl border-slate-200"
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
//                     type="button"
//                     variant={page === currentPage ? "default" : "outline"}
//                     size="sm"
//                     className="h-9 w-9 rounded-xl p-0"
//                     onClick={() => setCurrentPage(page)}
//                   >
//                     {page}
//                   </Button>
//                 ))}

//                 <Button
//                   type="button"
//                   variant="outline"
//                   size="sm"
//                   className="rounded-xl border-slate-200"
//                   disabled={currentPage === totalPages}
//                   onClick={() =>
//                     setCurrentPage((page) => Math.min(totalPages, page + 1))
//                   }
//                 >
//                   Next
//                 </Button>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       <InvoiceRequestModal
//         isOpen={isInvoiceModalOpen}
//         onClose={() => {
//           setIsInvoiceModalOpen(false);
//           setSelectedInvoice(null);
//         }}
//         onSuccess={() => {
//           setIsInvoiceModalOpen(false);
//           setSelectedInvoice(null);
//         }}
//         editingInvoice={selectedInvoice}
//       />

//       <PaymentReleaseModal
//         isOpen={isPaymentModalOpen}
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

// import { useEffect, useMemo, useState } from "react";
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
//   const parsed = Number(value);
//   return Number.isFinite(parsed) ? parsed : 0;
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

// function formatRoleLabel(role: any): string {
//   const roleKey = getRoleKey(role);
//   if (!roleKey) return "";

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
//     if (text) return text;
//   }
//   return "";
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
//   if (!sequenceMatch) return null;

//   const sequence = Number(sequenceMatch[1]);
//   return Number.isFinite(sequence) ? sequence : null;
// }

// function compareRequestIdsAscending(a: any, b: any): number {
//   const aSequence = getRequestIdSequence(a);
//   const bSequence = getRequestIdSequence(b);

//   if (aSequence !== null && bSequence !== null && aSequence !== bSequence) {
//     return aSequence - bSequence;
//   }

//   if (aSequence !== null && bSequence === null) return -1;
//   if (aSequence === null && bSequence !== null) return 1;

//   const aDate = getRequestDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
//   const bDate = getRequestDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
//   if (aDate !== bDate) return aDate - bDate;

//   return String(a?.id || "").localeCompare(String(b?.id || ""));
// }

// function getTableStatusSortRank(invoice: any): number {
//   const status = normalizeText(invoice?.status);

//   if (isWaitingForAdminApproval(invoice) && !wasReturnedToCreator(invoice)) {
//     return 0;
//   }

//   if (
//     wasReturnedToCreator(invoice) ||
//     ["rejected", "returned_to_creator", "changes_requested"].includes(status)
//   ) {
//     return 1;
//   }

//   // IMPORTANT:
//   // Requests that are ready for payment release must appear before
//   // Pending Finance requests, so Finance users can find and release
//   // payments without going to later pages.
//   if (
//     [
//       "approved",
//       "po_created",
//       "po_submitted",
//       "po_approved",
//       "po_issued",
//       "ready_for_payment",
//     ].includes(status)
//   ) {
//     return 2;
//   }

//   if (status === "pending_finance") {
//     return 3;
//   }

//   if (status.startsWith("pending")) {
//     return 4;
//   }

//   if (
//     ["payment_released", "expense_submitted", "expense_completed"].includes(
//       status,
//     )
//   ) {
//     return 5;
//   }

//   return 6;
// }

// function compareBudgetRequestsForTable(a: any, b: any): number {
//   const aStatusRank = getTableStatusSortRank(a);
//   const bStatusRank = getTableStatusSortRank(b);

//   if (aStatusRank !== bStatusRank) {
//     return aStatusRank - bStatusRank;
//   }

//   return compareRequestIdsAscending(a, b);
// }

// function formatRequestDate(invoice: any) {
//   const date = getRequestDate(invoice);
//   if (!date) return "-";

//   return date.toLocaleDateString("en-PK", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// }

// function getDateInputValue(date: Date | null) {
//   if (!date) return "";

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
//   if (!text) return "";
//   if (isFirebaseIdLike(text)) return "";

//   return text;
// }

// function getUserDisplayName(user: any): string {
//   return getFirstTextValue([
//     getSafeDisplayText(user?.displayName),
//     getSafeDisplayText(user?.name),
//     getSafeDisplayText(user?.fullName),
//     getSafeDisplayText(user?.userName),
//     getSafeDisplayText(user?.username),
//     getSafeDisplayText(user?.employeeName),
//     getSafeDisplayText(user?.email),
//   ]);
// }

// const CREATOR_NAME_OVERRIDES: Record<string, string> = {
//   // Example:
//   // "wVS6kzCFiYM5dFQSEZ5P7Y8SChg1": "Bilal Tariq",
// };

// function getRoleKey(role: any): string {
//   return String(role || "")
//     .toLowerCase()
//     .trim()
//     .replace(/[\s-]+/g, "_");
// }

// function isAdminRole(role: any): boolean {
//   const roleKey = getRoleKey(role);

//   return ["admin", "main_admin", "super_admin"].includes(roleKey);
// }

// function isFinanceApproverRole(role: any): boolean {
//   const roleKey = getRoleKey(role);

//   return ["finance", "financial_admin", "finance_admin"].includes(roleKey);
// }

// function isOperationRole(role: any): boolean {
//   const roleKey = getRoleKey(role);

//   return ["operation", "operations"].includes(roleKey);
// }

// function canRoleCreateBudgetRequest(role: any): boolean {
//   const roleKey = getRoleKey(role);
//   if (!roleKey) return false;

//   return !isAdminRole(roleKey);
// }

// function canRoleSeeAllBudgetRequests(role: any): boolean {
//   return isAdminRole(role) || isFinanceApproverRole(role);
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

//   if (
//     normalizedStatus === "pending_main_admin" ||
//     normalizedStatus === "pending_admin"
//   ) {
//     return "Pending Admin";
//   }

//   if (normalizedStatus === "pending_operational_admin") return "Pending Admin";
//   if (normalizedStatus === "pending_finance") return "Pending Finance";
//   if (normalizedStatus === "rejected")
//     return getReturnedToRoleStatusLabel(invoice);

//   return formatStatus(status);
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
//   const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
//   const [rejectionLoading, setRejectionLoading] = useState(false);

//   const [searchTerm, setSearchTerm] = useState("");
//   const [typeFilter, setTypeFilter] = useState<"all" | "project" | "general">(
//     "all",
//   );
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [dateFrom, setDateFrom] = useState("");
//   const [dateTo, setDateTo] = useState("");
//   const [monthFilter, setMonthFilter] = useState("");
//   const [createdByFilter, setCreatedByFilter] = useState("all");
//   const [projectCodeFilter, setProjectCodeFilter] = useState("");
//   const [vendorFilter, setVendorFilter] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pageSize, setPageSize] = useState(10);

//   const { data: invoices = [], loading } = useFirestoreQuery<InvoiceRequest>(
//     `Panels/${PANEL_ID}/invoiceRequests`,
//   );

//   const { data: expenseSheets = [] } = useFirestoreQuery<any>(
//     `Panels/${PANEL_ID}/expenseSheets`,
//   );

//   const { data: purchaseOrders = [] } = useFirestoreQuery<any>(
//     `Panels/${PANEL_ID}/purchaseOrders`,
//   );

//   const { data: users = [] } = useFirestoreQuery<any>("users");

//   const { data: panelUsers = [] } = useFirestoreQuery<any>(
//     `Panels/${PANEL_ID}/users`,
//   );

//   const CREATE_PO_ROUTE = "/create-po";

//   function getRequestType(invoice: any): "general" | "project" {
//     const rawType = String(
//       invoice?.invoiceType || invoice?.type || "",
//     ).toLowerCase();

//     if (rawType === "project") return "project";
//     if (rawType === "general") return "general";

//     return invoice?.clientName ||
//       invoice?.project ||
//       invoice?.projectName ||
//       invoice?.projectCode
//       ? "project"
//       : "general";
//   }

//   function isProjectRequest(invoice: any): boolean {
//     return getRequestType(invoice) === "project";
//   }

//   function getLinkedPO(invoice: any): any | null {
//     const requestId = String(invoice?.requestId || "").trim();
//     const invoiceDocId = String(invoice?.id || "").trim();
//     const estimateId = String(invoice?.estimateId || "").trim();
//     const estimateNumber = String(
//       invoice?.estimateNumber ||
//         invoice?.estimateNo ||
//         invoice?.estimateValue ||
//         invoice?.selectedEstimate ||
//         invoice?.selectEstimate ||
//         "",
//     ).trim();

//     return (
//       purchaseOrders.find((po: any) => {
//         const poRequestDocLinks = [
//           po?.invoiceRequestId,
//           po?.linkedInvoiceId,
//           po?.sourceInvoiceId,
//           po?.budgetRequestDocId,
//           po?.sourceBudgetRequestId,
//           po?.requestDocId,
//           po?.invoiceId,
//         ]
//           .filter(Boolean)
//           .map((value) => String(value).trim());

//         const poRequestIdLinks = [
//           po?.requestId,
//           po?.budgetRequestId,
//           po?.linkedRequestId,
//           po?.sourceRequestId,
//           po?.invoiceNumber,
//           po?.budgetRequestNumber,
//         ]
//           .filter(Boolean)
//           .map((value) => String(value).trim());

//         const poEstimateLinks = [
//           po?.estimateId,
//           po?.estimateNumber,
//           po?.estimateNo,
//           po?.selectedEstimate,
//         ]
//           .filter(Boolean)
//           .map((value) => String(value).trim());

//         return (
//           Boolean(invoiceDocId && poRequestDocLinks.includes(invoiceDocId)) ||
//           Boolean(requestId && poRequestIdLinks.includes(requestId)) ||
//           Boolean(estimateId && poEstimateLinks.includes(estimateId)) ||
//           Boolean(estimateNumber && poEstimateLinks.includes(estimateNumber))
//         );
//       }) || null
//     );
//   }

//   function hasPOAlready(invoice: any): boolean {
//     const status = normalizeText(invoice?.status);
//     const poStatus = normalizeText(
//       invoice?.poStatus || invoice?.purchaseOrderStatus,
//     );

//     const statusSaysPOCreated = [
//       "po_created",
//       "po_submitted",
//       "po_approved",
//       "po_issued",
//       "ready_for_payment",
//     ].includes(status);

//     const poStatusSaysCreated = [
//       "created",
//       "submitted",
//       "approved",
//       "issued",
//       "ready_for_payment",
//     ].includes(poStatus);

//     const hasDirectPOFields = Boolean(
//       invoice?.poSubmitted ||
//         invoice?.poCreated ||
//         invoice?.purchaseOrderCreated ||
//         invoice?.purchaseOrderSubmitted ||
//         invoice?.poId ||
//         invoice?.poNumber ||
//         invoice?.poDocId ||
//         invoice?.purchaseOrderId ||
//         invoice?.purchaseOrderNumber ||
//         invoice?.poCreatedAt ||
//         invoice?.purchaseOrderCreatedAt,
//     );

//     return Boolean(
//       statusSaysPOCreated ||
//         poStatusSaysCreated ||
//         hasDirectPOFields ||
//         getLinkedPO(invoice),
//     );
//   }

//   function hasPaymentReleased(invoice: any): boolean {
//     const status = normalizeText(invoice?.status);
//     const paymentStatus = normalizeText(
//       invoice?.paymentStatus || invoice?.releasePaymentStatus,
//     );

//     return Boolean(
//       status === "payment_released" ||
//         paymentStatus === "released" ||
//         paymentStatus === "payment_released" ||
//         invoice?.paymentReleased ||
//         invoice?.releasePaymentCreated ||
//         invoice?.paymentReleaseId ||
//         invoice?.paymentId ||
//         invoice?.paymentReleasedAt ||
//         invoice?.releasePaymentAt,
//     );
//   }

//   function getExpenseAmount(invoice: any): number {
//     return safeNumber(
//       invoice?.approvedAmount || invoice?.totalAmount || invoice?.amount,
//     );
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
//     if (!userProfile || userProfile.role !== "operation") return false;

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
//     const vendorName =
//       request.vendorName ||
//       request.supplierName ||
//       getFirstVendorName(request) ||
//       request.clientName ||
//       "";
//     const amount = getExpenseAmount(request);

//     return {
//       ...request,
//       invoiceNumber: request.requestId,
//       linkedRequestId: request.requestId,
//       budgetRequestId: request.requestId,
//       invoiceRequestId: request.id,
//       linkedInvoiceId: request.id,
//       sourceInvoiceId: request.id,
//       sourceType: "budget_request",
//       approvalRequired: false,
//       requiresApproval: false,
//       adminApprovalRequired: false,
//       autoApproved: true,
//       autoApprovedReason:
//         "Created from approved budget request. No further approval required.",
//       expenseStatus: "submitted",
//       status: "submitted",
//       invoiceType: requestType,
//       requestType,
//       amount,
//       totalAmount: amount,
//       approvedAmount: amount,
//       vendorName,
//       supplierName: request.supplierName || vendorName,
//       clientName: request.clientName || "",
//       projectName,
//       project: projectName,
//       projectCode: request.projectCode || "",
//       poId: request.poId || "",
//       poNumber: request.poNumber || "",
//       dueDate: new Date(),
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
//     } catch (error: any) {
//       console.error("Failed to mark expense as submitted:", error);
//       toast({
//         title: "Expense submitted",
//         description:
//           "Expense was submitted, but the request status could not be updated.",
//       });
//     } finally {
//       setIsExpenseModalOpen(false);
//       setSelectedInvoice(null);
//       localStorage.removeItem("submitExpenseFromBudgetRequest");
//       localStorage.removeItem("expenseSheetSource");
//     }
//   }

//   async function handlePaymentReleased() {
//     const request: any = selectedInvoice;

//     try {
//       if (request?.id) {
//         await updateDoc(
//           doc(db, "Panels", PANEL_ID, "invoiceRequests", request.id),
//           {
//             status: "payment_released",
//             paymentReleased: true,
//             paymentStatus: "released",
//             paymentReleasedAt: serverTimestamp(),
//             updatedAt: serverTimestamp(),
//           },
//         );
//       }

//       toast({
//         title: "Payment released",
//         description: "Payment has been released successfully.",
//       });
//     } catch (error: any) {
//       console.error("Failed to mark payment as released:", error);
//       toast({
//         title: "Payment released",
//         description:
//           "Payment was released, but the request status could not be updated.",
//       });
//     } finally {
//       setIsPaymentModalOpen(false);
//       setSelectedInvoice(null);
//     }
//   }

//   function getFirstVendorName(invoice: any): string {
//     const lineItems = Array.isArray(invoice?.lineItems)
//       ? invoice.lineItems
//       : [];
//     const approvedItems = Array.isArray(invoice?.approvalItems)
//       ? invoice.approvalItems
//       : [];
//     const allItems = [...approvedItems, ...lineItems];

//     const matchedItem = allItems.find(
//       (item: any) =>
//         item?.vendor ||
//         item?.vendorName ||
//         item?.supplier ||
//         item?.supplierName ||
//         item?.original?.vendor ||
//         item?.original?.supplier,
//     );

//     return (
//       matchedItem?.vendor ||
//       matchedItem?.vendorName ||
//       matchedItem?.supplier ||
//       matchedItem?.supplierName ||
//       matchedItem?.original?.vendor ||
//       matchedItem?.original?.supplier ||
//       ""
//     );
//   }

//   function getVendorFilterText(invoice: any): string {
//     return getFirstTextValue([
//       invoice?.vendorName,
//       invoice?.supplierName,
//       getFirstVendorName(invoice),
//     ]);
//   }

//   function handleCreatePO(invoice: InvoiceRequest) {
//     const request: any = invoice;

//     localStorage.setItem(
//       "createPOFromBudgetRequest",
//       JSON.stringify({
//         invoiceRequestId: request.id,
//         budgetRequestDocId: request.id,
//         budgetRequestId: request.requestId,
//         requestId: request.requestId,
//         invoiceType: getRequestType(request),
//         sourceType: "budget_request",
//         returnToBudgetRequests: true,
//         updateBudgetRequestAfterPO: true,

//         estimateId: request.estimateId || "",
//         estimateNumber:
//           request.estimateNumber ||
//           request.estimateNo ||
//           request.estimateValue ||
//           request.selectedEstimate ||
//           request.selectEstimate ||
//           "",

//         clientName: request.clientName || "",
//         projectName: request.projectName || request.project || "",
//         project: request.project || request.projectName || "",
//         projectCode: request.projectCode || "",
//         title: request.title || request.subject || "",
//         subject: request.subject || "",
//         message: request.message || "",

//         supplierId: request.supplierId || request.vendorId || "",
//         supplierName:
//           request.supplierName ||
//           request.vendorName ||
//           getFirstVendorName(request),
//         vendorName:
//           request.vendorName ||
//           request.supplierName ||
//           getFirstVendorName(request),

//         totalAmount: Number(request.totalAmount || 0),
//         approvedAmount: Number(
//           request.approvedAmount || request.totalAmount || 0,
//         ),

//         approvalItems: request.approvalItems || [],
//         lineItems: request.lineItems || [],
//         items: request.items || request.lineItems || [],
//       }),
//     );

//     setLocation(CREATE_PO_ROUTE);
//   }

//   async function handleApprove(invoice: InvoiceRequest) {
//     if (!userProfile) return;

//     const roleKey = getRoleKey(userProfile.role);
//     const status = normalizeText(invoice.status);
//     const approvalHistory = Array.isArray((invoice as any).approvalHistory)
//       ? (invoice as any).approvalHistory
//       : [];

//     let newStatus = status;
//     let currentApprover = String((invoice as any).currentApprover || "");

//     const updatePayload: Record<string, any> = {
//       approvalHistory: [
//         ...approvalHistory,
//         {
//           approver:
//             userProfile.displayName ||
//             (userProfile as any)?.name ||
//             userProfile.email ||
//             roleKey,
//           approverRole: roleKey,
//           action: "approved",
//           timestamp: new Date(),
//           notes: "",
//         },
//       ],
//       returnedToCreator: false,
//       needsCreatorRevision: false,
//       returnedToRole: "",
//       returnedToRoleLabel: "",
//       updatedAt: serverTimestamp(),
//     };

//     if (isAdminRole(roleKey) && isWaitingForAdminApproval(invoice)) {
//       newStatus = "pending_finance";
//       currentApprover = "finance";
//       updatePayload.adminApprovedAt = serverTimestamp();
//       updatePayload.adminApprovedBy =
//         userProfile.displayName || userProfile.email || "";
//       updatePayload.adminApprovedById =
//         userProfile.id ||
//         (userProfile as any)?.uid ||
//         (userProfile as any)?.userId ||
//         userProfile.email ||
//         "";
//     } else if (isFinanceApproverRole(roleKey) && status === "pending_finance") {
//       newStatus = "approved";
//       currentApprover = "";
//       updatePayload.financeApprovedAt = serverTimestamp();
//       updatePayload.financeApprovedBy =
//         userProfile.displayName || userProfile.email || "";
//       updatePayload.financeApprovedById =
//         userProfile.id ||
//         (userProfile as any)?.uid ||
//         (userProfile as any)?.userId ||
//         userProfile.email ||
//         "";
//       updatePayload.approvedAt = serverTimestamp();
//     } else {
//       toast({
//         title: "Action not allowed",
//         description:
//           "This request is not currently assigned to your approval stage.",
//         variant: "destructive",
//       });
//       return;
//     }

//     try {
//       await updateDoc(
//         doc(db, "Panels", PANEL_ID, "invoiceRequests", invoice.id),
//         {
//           ...updatePayload,
//           status: newStatus,
//           currentApprover,
//         },
//       );

//       toast({
//         title: "Success",
//         description: "Budget request approved successfully",
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

//   async function handleReject(
//     invoice: InvoiceRequest,
//     rejectionComment: string,
//   ) {
//     if (!userProfile) return;

//     try {
//       setRejectionLoading(true);

//       const roleKey = getRoleKey(userProfile.role);
//       const ownerId = getBudgetRequestOwnerId(invoice);
//       const approvalHistory = Array.isArray((invoice as any).approvalHistory)
//         ? (invoice as any).approvalHistory
//         : [];

//       const returnedToRole = getBudgetRequestOwnerRole(invoice);
//       const returnedToRoleLabel = formatRoleLabel(returnedToRole);

//       await updateDoc(
//         doc(db, "Panels", PANEL_ID, "invoiceRequests", invoice.id),
//         {
//           status: "rejected",
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
//               approverRole: roleKey,
//               action: "rejected",
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
//           returnedToRoleLabel || "the original role"
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

//   function getStatusBadgeColor(status: string, invoice?: any): string {
//     if (invoice && wasReturnedToCreator(invoice)) {
//       return "border-red-200 bg-red-50 text-red-700";
//     }

//     switch (status) {
//       case "approved":
//       case "payment_released":
//       case "expense_submitted":
//       case "expense_completed":
//         return "border-green-200 bg-green-50 text-green-700";
//       case "rejected":
//       case "returned_to_creator":
//       case "changes_requested":
//         return "border-red-200 bg-red-50 text-red-700";
//       case "pending_operational_admin":
//       case "pending_main_admin":
//       case "pending_admin":
//       case "pending_finance":
//         return "border-amber-200 bg-amber-50 text-amber-700";
//       default:
//         return "border-slate-200 bg-slate-50 text-slate-700";
//     }
//   }

//   function getTypeBadgeColor(type: "general" | "project") {
//     return type === "project"
//       ? "border-indigo-200 bg-indigo-50 text-indigo-700"
//       : "border-slate-200 bg-slate-50 text-slate-700";
//   }

//   function getCurrentStep(invoice: InvoiceRequest): string {
//     const status = normalizeText(invoice.status || "");

//     if (
//       (invoice as any).expenseSubmitted ||
//       status === "expense_submitted" ||
//       hasExpenseSheet(invoice)
//     ) {
//       return "Expense Submitted / No Approval Required";
//     }

//     if (hasPaymentReleased(invoice)) {
//       return "Payment Released / Ready for Expense";
//     }

//     if (isProjectRequest(invoice) && hasPOAlready(invoice)) {
//       return "PO Created / Ready for Payment";
//     }

//     if (wasReturnedToCreator(invoice)) {
//       return `${getBudgetRequestStatusLabel(invoice)} / Waiting for Resubmission`;
//     }

//     switch (status) {
//       case "pending_operational_admin":
//       case "pending_main_admin":
//       case "pending_admin":
//         return "Admin Approval";
//       case "pending_finance":
//         return "Finance Approval";
//       case "approved":
//         return isProjectRequest(invoice) ? "Ready for PO" : "Ready for Payment";
//       case "po_created":
//       case "po_submitted":
//       case "po_approved":
//       case "po_issued":
//       case "ready_for_payment":
//         return "PO Created / Ready for Payment";
//       case "payment_released":
//         return "Payment Released / Ready for Expense";
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
//     if (!userProfile) return false;

//     const roleKey = getRoleKey(userProfile.role);

//     if (isAdminRole(roleKey)) {
//       return isWaitingForAdminApproval(invoice);
//     }

//     if (isFinanceApproverRole(roleKey)) {
//       return normalizeText(invoice.status) === "pending_finance";
//     }

//     return false;
//   }

//   function canEdit(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;

//     if (!isOwnBudgetRequest(invoice)) return false;

//     if (hasAdminApprovedBudgetRequest(invoice)) return false;

//     const status = normalizeText(invoice.status);

//     return (
//       wasReturnedToCreator(invoice) ||
//       status === "draft" ||
//       status === "pending_main_admin" ||
//       status === "pending_admin" ||
//       status === "pending_operational_admin" ||
//       status === ""
//     );
//   }

//   function getEditableInvoice(invoice: InvoiceRequest): InvoiceRequest {
//     if (hasAdminApprovedBudgetRequest(invoice)) return invoice;

//     if (!wasReturnedToCreator(invoice)) return invoice;

//     return {
//       ...(invoice as any),
//       status: "pending_main_admin",
//       currentApprover: "main_admin",
//       returnedToCreator: false,
//       needsCreatorRevision: false,
//       returnedToRole: "",
//       returnedToRoleLabel: "",
//       resubmittedAt: new Date(),
//     } as InvoiceRequest;
//   }

//   function canReleasePayment(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;

//     const isFinanceUser = isFinanceApproverRole(userProfile.role);
//     if (!isFinanceUser) return false;

//     if (hasPaymentReleased(invoice)) return false;

//     if (
//       (invoice as any).expenseSubmitted ||
//       String(invoice.status) === "expense_submitted"
//     ) {
//       return false;
//     }

//     const status = normalizeText(invoice.status);
//     const readyForPayment = [
//       "approved",
//       "po_created",
//       "po_submitted",
//       "po_approved",
//       "po_issued",
//       "ready_for_payment",
//     ].includes(status);

//     if (!readyForPayment) return false;

//     if (!isProjectRequest(invoice)) return true;

//     return hasPOAlready(invoice);
//   }

//   function canCreatePO(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;

//     return (
//       isFinanceApproverRole(userProfile.role) &&
//       normalizeText(invoice.status) === "approved" &&
//       isProjectRequest(invoice) &&
//       !hasPOAlready(invoice) &&
//       !hasPaymentReleased(invoice)
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

//     if (!expenseSheets) return null;

//     const expenseSheet = expenseSheets.find((expense: any) =>
//       isExpenseLinkedToRequest(expense, invoice),
//     );

//     return expenseSheet?.status || expenseSheet?.expenseStatus || null;
//   }

//   const canCreateInvoices = canRoleCreateBudgetRequest(currentUserRole);

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

//       if (!lookupKey) continue;

//       const matchedUser = usersByLookup.get(lookupKey);
//       if (matchedUser) return matchedUser;
//     }

//     return null;
//   }

//   function canCurrentUserSeeAllBudgetRequests() {
//     const userRecord = getCurrentUserRecordFromUsersCollection();
//     const effectiveRole = getRoleKey(currentUserRole || userRecord?.role);

//     if (canRoleSeeAllBudgetRequests(effectiveRole)) return true;

//     if (!isOperationRole(effectiveRole)) return false;

//     return Boolean(
//       (userProfile as any)?.canViewAllBudgetRequests ||
//         userRecord?.canViewAllBudgetRequests,
//     );
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

//         if (lookupKey) map.set(lookupKey, user);
//       });
//     });

//     return map;
//   }, [users, panelUsers]);

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
//     if (directRole) return directRole;

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

//       if (!lookupKey) continue;

//       const matchedUser = usersByLookup.get(lookupKey);
//       const matchedRole = getUserRoleLabel(matchedUser);

//       if (matchedRole) return matchedRole;
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

//     if (isCurrentUserOwner) return getRoleKey(userProfile?.role);

//     return "";
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

//     return getStatusLabel(invoice?.status || "", invoice);
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

//       if (!name) return;

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

//         if (lookupKey && !map.has(lookupKey)) map.set(lookupKey, name);
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

//     if (directName) return directName;

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

//       if (!lookupKey) continue;

//       const overrideName = getSafeDisplayText(
//         CREATOR_NAME_OVERRIDES[rawKey] || CREATOR_NAME_OVERRIDES[lookupKey],
//       );

//       if (overrideName) return overrideName;

//       const nameFromAnotherRequest = getSafeDisplayText(
//         creatorNamesByLookup.get(lookupKey),
//       );

//       if (nameFromAnotherRequest) return nameFromAnotherRequest;

//       const matchedUser = usersByLookup.get(lookupKey);
//       const matchedName = getSafeDisplayText(getUserDisplayName(matchedUser));

//       if (matchedName) return matchedName;
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

//     const ownerLookupValues = lookupValues
//       .map((value) =>
//         String(value || "")
//           .trim()
//           .toLowerCase(),
//       )
//       .filter(Boolean);

//     const isCurrentUserOwner = ownerLookupValues.some((ownerKey) =>
//       currentUserLookupValues.includes(ownerKey),
//     );

//     if (isCurrentUserOwner) {
//       const currentUserName = getFirstTextValue([
//         getSafeDisplayText(userProfile?.displayName),
//         getSafeDisplayText((userProfile as any)?.name),
//         getSafeDisplayText((userProfile as any)?.fullName),
//         getSafeDisplayText(userProfile?.email),
//       ]);

//       if (currentUserName) return currentUserName;
//     }

//     const emailFallback = getFirstTextValue([
//       getSafeDisplayText(invoice?.createdByEmail),
//       getSafeDisplayText(invoice?.submittedByEmail),
//       getSafeDisplayText(invoice?.email),
//     ]);

//     if (emailFallback) return emailFallback;

//     return "Unknown User";
//   }

//   const visibleInvoicesForFilterOptions = useMemo(() => {
//     return (invoices || []).filter((invoice: any) => {
//       const canSeeAllRequests = canCurrentUserSeeAllBudgetRequests();
//       return canSeeAllRequests || isOwnBudgetRequest(invoice);
//     });
//   }, [invoices, userProfile, currentUserRole, usersByLookup]);

//   const createdByOptions = useMemo(() => {
//     const names = Array.from(
//       new Set(
//         visibleInvoicesForFilterOptions
//           .map((invoice: any) => getCreatedByName(invoice))
//           .filter((name) => String(name || "").trim()),
//       ),
//     );

//     return names.sort((a, b) => a.localeCompare(b));
//   }, [
//     visibleInvoicesForFilterOptions,
//     usersByLookup,
//     creatorNamesByLookup,
//     userProfile,
//   ]);

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

//   const statusOptions = useMemo(() => {
//     const uniqueStatuses = Array.from(
//       new Set(
//         (invoices || []).map((invoice) => invoice.status).filter(Boolean),
//       ),
//     );

//     return uniqueStatuses.sort();
//   }, [invoices]);

//   const filteredInvoices = useMemo(() => {
//     const search = normalizeText(searchTerm);
//     const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
//     const toDate = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

//     return (invoices || []).filter((invoice: any) => {
//       const requestType = getRequestType(invoice);
//       const requestDate = getRequestDate(invoice);
//       const requestDateInputValue = getDateInputValue(requestDate);
//       const createdByName = getCreatedByName(invoice);
//       const projectCode = String(invoice?.projectCode || "").trim();
//       const vendorName = getVendorFilterText(invoice);

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
//           createdByName,
//           (invoice as any).createdByName,
//           (invoice as any).submittedByName,
//           (invoice as any).requestedByName,
//           (invoice as any).createdByEmail,
//           (invoice as any).submittedByEmail,
//         ].join(" "),
//       );

//       const matchesSearch = !search || haystack.includes(search);
//       const matchesType = typeFilter === "all" || requestType === typeFilter;
//       const matchesStatus =
//         statusFilter === "all" || invoice.status === statusFilter;
//       const matchesMonth =
//         !monthFilter || requestDateInputValue.startsWith(monthFilter);
//       const matchesCreatedBy =
//         createdByFilter === "all" ||
//         normalizeText(createdByName) === normalizeText(createdByFilter);
//       const matchesProjectCode =
//         !normalizeText(projectCodeFilter) ||
//         normalizeText(projectCode).includes(normalizeText(projectCodeFilter));
//       const matchesVendor =
//         !normalizeText(vendorFilter) ||
//         normalizeText(vendorName).includes(normalizeText(vendorFilter));
//       const matchesFrom = !fromDate || (requestDate && requestDate >= fromDate);
//       const matchesTo = !toDate || (requestDate && requestDate <= toDate);
//       const canSeeAllRequests = canCurrentUserSeeAllBudgetRequests();
//       const matchesOwnership = canSeeAllRequests || isOwnBudgetRequest(invoice);

//       return (
//         matchesOwnership &&
//         matchesSearch &&
//         matchesType &&
//         matchesStatus &&
//         matchesMonth &&
//         matchesCreatedBy &&
//         matchesProjectCode &&
//         matchesVendor &&
//         matchesFrom &&
//         matchesTo
//       );
//     });
//   }, [
//     dateFrom,
//     dateTo,
//     invoices,
//     monthFilter,
//     searchTerm,
//     statusFilter,
//     typeFilter,
//     createdByFilter,
//     projectCodeFilter,
//     vendorFilter,
//     userProfile,
//     currentUserRole,
//     usersByLookup,
//     creatorNamesByLookup,
//   ]);

//   const summary = useMemo(() => {
//     const totalAmount = filteredInvoices.reduce(
//       (sum, invoice: any) => sum + safeNumber(invoice.totalAmount),
//       0,
//     );

//     const projectCount = filteredInvoices.filter(
//       (invoice) => getRequestType(invoice) === "project",
//     ).length;

//     const generalCount = filteredInvoices.filter(
//       (invoice) => getRequestType(invoice) === "general",
//     ).length;

//     const approvedCount = filteredInvoices.filter(
//       (invoice) => invoice.status === "approved",
//     ).length;

//     return { totalAmount, projectCount, generalCount, approvedCount };
//   }, [filteredInvoices]);

//   const sortedInvoices = useMemo(() => {
//     return [...filteredInvoices].sort(compareBudgetRequestsForTable);
//   }, [filteredInvoices]);

//   const totalPages = Math.max(1, Math.ceil(sortedInvoices.length / pageSize));
//   const startIndex = (currentPage - 1) * pageSize;
//   const paginatedInvoices = sortedInvoices.slice(
//     startIndex,
//     startIndex + pageSize,
//   );
//   const showingFrom = sortedInvoices.length === 0 ? 0 : startIndex + 1;
//   const showingTo = Math.min(startIndex + pageSize, sortedInvoices.length);

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
//     pageSize,
//   ]);

//   useEffect(() => {
//     if (currentPage > totalPages) setCurrentPage(totalPages);
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
//     setPageSize(10);
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
//             <p className="mt-2 max-w-2xl text-sm text-slate-500">
//               Review project and general budget requests, send requests through
//               Admin and Finance approval, release payments, or create POs.
//             </p>
//           </div>

//           {canCreateInvoices && (
//             <Button
//               className="h-11 rounded-2xl px-5 shadow-sm"
//               onClick={() => {
//                 setSelectedInvoice(null);
//                 setIsInvoiceModalOpen(true);
//               }}
//               data-testid="button-new-invoice-request"
//             >
//               + New Request
//             </Button>
//           )}
//         </div>

//         <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
//                 Filtered Value
//               </p>
//               <p className="mt-3 text-2xl font-semibold text-slate-950">
//                 Rs {formatPKR(summary.totalAmount)}
//               </p>
//               <p className="mt-1 text-xs text-slate-400">
//                 Approved waiting: {summary.approvedCount}
//               </p>
//             </CardContent>
//           </Card>
//         </div>

//         <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//           <CardContent className="space-y-4 p-5">
//             <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
//               <div className="xl:col-span-2">
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Search
//                 </label>
//                 <input
//                   value={searchTerm}
//                   onChange={(event) => setSearchTerm(event.target.value)}
//                   placeholder="Request ID, client, project, title..."
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Created By
//                 </label>
//                 <select
//                   value={createdByFilter}
//                   onChange={(event) => setCreatedByFilter(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 >
//                   <option value="all">All Creators</option>
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
//                   onChange={(event) =>
//                     setProjectCodeFilter(event.target.value)
//                   }
//                   placeholder="Enter project code..."
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Request Type
//                 </label>
//                 <select
//                   value={typeFilter}
//                   onChange={(event) =>
//                     setTypeFilter(
//                       event.target.value as "all" | "project" | "general",
//                     )
//                   }
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 >
//                   <option value="all">All Types</option>
//                   <option value="project">Project</option>
//                   <option value="general">General</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Status
//                 </label>
//                 <select
//                   value={statusFilter}
//                   onChange={(event) => setStatusFilter(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 >
//                   <option value="all">All Statuses</option>
//                   {statusOptions.map((status) => (
//                     <option key={status} value={status}>
//                       {getStatusLabel(status)}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Month
//                 </label>
//                 <input
//                   type="month"
//                   value={monthFilter}
//                   onChange={(event) => setMonthFilter(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>
//             </div>

//             <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Vendor
//                 </label>
//                 <input
//                   value={vendorFilter}
//                   onChange={(event) => setVendorFilter(event.target.value)}
//                   placeholder="Enter vendor name..."
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   From Date
//                 </label>
//                 <input
//                   type="date"
//                   value={dateFrom}
//                   onChange={(event) => setDateFrom(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   To Date
//                 </label>
//                 <input
//                   type="date"
//                   value={dateTo}
//                   onChange={(event) => setDateTo(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Rows
//                 </label>
//                 <select
//                   value={pageSize}
//                   onChange={(event) => setPageSize(Number(event.target.value))}
//                   className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
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

//         <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm">
//           <CardContent className="p-0">
//             <div className="overflow-x-auto">
//               <table className="w-full min-w-[1250px]">
//                 <thead>
//                   <tr className="border-b border-slate-200 bg-slate-50/80">
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Request ID
//                     </th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Type
//                     </th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Client / Title
//                     </th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Project
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
//                       <td colSpan={10} className="px-6 py-12 text-center">
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
//                         type === "general"
//                           ? (invoice as any).title ||
//                             (invoice as any).subject ||
//                             "General Request"
//                           : (invoice as any).clientName || "-";

//                       const projectName =
//                         type === "project"
//                           ? (invoice as any).projectName ||
//                             (invoice as any).project ||
//                             (invoice as any).projectCode ||
//                             "-"
//                           : "-";

//                       const createdByName = getCreatedByName(invoice);

//                       return (
//                         <tr
//                           key={invoice.id}
//                           className="transition hover:bg-slate-50/80"
//                         >
//                           <td
//                             className="px-5 py-4 text-sm font-semibold text-slate-900"
//                             data-testid={`text-request-id-${invoice.id}`}
//                           >
//                             {invoice.requestId || "-"}
//                           </td>

//                           <td className="px-5 py-4">
//                             <Badge
//                               variant="outline"
//                               className={`rounded-full px-3 py-1 ${getTypeBadgeColor(
//                                 type,
//                               )}`}
//                             >
//                               {type === "project" ? "Project" : "General"}
//                             </Badge>
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-700">
//                             <div className="font-medium text-slate-900">
//                               {displayClientOrTitle}
//                             </div>
//                             {(invoice as any).projectCode &&
//                               type === "project" && (
//                                 <div className="mt-1 text-xs text-slate-400">
//                                   Code: {(invoice as any).projectCode}
//                                 </div>
//                               )}
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-600">
//                             {projectName}
//                           </td>

//                           <td
//                             className="px-5 py-4 text-sm font-medium text-slate-700"
//                             data-testid={`text-created-by-${invoice.id}`}
//                           >
//                             {createdByName}
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-600">
//                             {formatRequestDate(invoice)}
//                           </td>

//                           <td className="px-5 py-4 text-sm font-semibold text-slate-900">
//                             Rs {formatPKR(invoice.totalAmount)}
//                           </td>

//                           <td className="px-5 py-4">
//                             <Badge
//                               variant="outline"
//                               className={`rounded-full px-3 py-1 ${getStatusBadgeColor(
//                                 invoice.status,
//                                 invoice,
//                               )}`}
//                             >
//                               {getBudgetRequestStatusLabel(invoice)}
//                             </Badge>
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-500">
//                             {getCurrentStep(invoice)}
//                           </td>

//                           <td className="px-5 py-4">
//                             <div className="flex flex-wrap gap-2">
//                               <Button
//                                 variant="outline"
//                                 size="sm"
//                                 className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
//                                 onClick={() => openDetailsModal(invoice)}
//                                 data-testid={`button-view-details-${invoice.id}`}
//                               >
//                                 View
//                               </Button>

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
//                                           "This request can no longer be edited because it has already been approved by Admin.",
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

//                               {canReleasePayment(invoice) && (
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   className="rounded-xl border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
//                                   onClick={() => {
//                                     const linkedPO = getLinkedPO(invoice);

//                                     setSelectedInvoice({
//                                       ...invoice,
//                                       invoiceNumber: invoice.requestId,
//                                       vendorName:
//                                         (invoice as any).vendorName ||
//                                         (invoice as any).supplierName ||
//                                         (invoice as any).clientName,
//                                       amount:
//                                         (invoice as any).approvedAmount ||
//                                         invoice.totalAmount,
//                                       dueDate: new Date(),
//                                       poId:
//                                         (invoice as any).poId ||
//                                         (invoice as any).poDocId ||
//                                         linkedPO?.id ||
//                                         linkedPO?.poId ||
//                                         linkedPO?.poDocId ||
//                                         "",
//                                       poNumber:
//                                         (invoice as any).poNumber ||
//                                         (invoice as any).purchaseOrderNumber ||
//                                         linkedPO?.poNumber ||
//                                         linkedPO?.purchaseOrderNumber ||
//                                         "",
//                                     } as any);
//                                     setIsPaymentModalOpen(true);
//                                   }}
//                                   data-testid={`button-release-payment-${invoice.id}`}
//                                 >
//                                   Release Payment
//                                 </Button>
//                               )}

//                               {canCreatePO(invoice) && (
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   className="rounded-xl border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
//                                   onClick={() => handleCreatePO(invoice)}
//                                   data-testid={`button-create-po-${invoice.id}`}
//                                 >
//                                   Create PO
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

//               <div className="flex items-center gap-2">
//                 <Button
//                   type="button"
//                   variant="outline"
//                   size="sm"
//                   className="rounded-xl border-slate-200"
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
//                     type="button"
//                     variant={page === currentPage ? "default" : "outline"}
//                     size="sm"
//                     className="h-9 w-9 rounded-xl p-0"
//                     onClick={() => setCurrentPage(page)}
//                   >
//                     {page}
//                   </Button>
//                 ))}

//                 <Button
//                   type="button"
//                   variant="outline"
//                   size="sm"
//                   className="rounded-xl border-slate-200"
//                   disabled={currentPage === totalPages}
//                   onClick={() =>
//                     setCurrentPage((page) => Math.min(totalPages, page + 1))
//                   }
//                 >
//                   Next
//                 </Button>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       <InvoiceRequestModal
//         isOpen={isInvoiceModalOpen}
//         onClose={() => {
//           setIsInvoiceModalOpen(false);
//           setSelectedInvoice(null);
//         }}
//         onSuccess={() => {
//           setIsInvoiceModalOpen(false);
//           setSelectedInvoice(null);
//         }}
//         editingInvoice={selectedInvoice}
//       />

//       <PaymentReleaseModal
//         isOpen={isPaymentModalOpen}
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

// import { useEffect, useMemo, useState } from "react";
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

//   // Backward compatibility for older records that only saved a single paymentDetails object.
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
//   if (explicitReleasedAmount > 0) return explicitReleasedAmount;

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

// function getReleaseDateLabel(value: any) {
//   if (!value) return "-";

//   let date: Date | null = null;

//   if (value instanceof Date) date = value;
//   else if (typeof value?.toDate === "function") date = value.toDate();
//   else if (typeof value?.seconds === "number")
//     date = new Date(value.seconds * 1000);
//   else date = new Date(value);

//   if (!date || Number.isNaN(date.getTime())) return "-";

//   return date.toLocaleString("en-PK", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// }

// function getPaymentMethodLabel(method?: string) {
//   switch (method) {
//     case "cash":
//       return "Cash";
//     case "cheque":
//       return "Cheque";
//     case "bank_transfer":
//       return "Bank Transfer";
//     case "wire":
//       return "Online Transfer";
//     default:
//       return method ? formatStatus(method) : "-";
//   }
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

// function formatRoleLabel(role: any): string {
//   const roleKey = getRoleKey(role);
//   if (!roleKey) return "";

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
//     if (text) return text;
//   }
//   return "";
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
//   if (!sequenceMatch) return null;

//   const sequence = Number(sequenceMatch[1]);
//   return Number.isFinite(sequence) ? sequence : null;
// }

// function compareRequestIdsAscending(a: any, b: any): number {
//   const aSequence = getRequestIdSequence(a);
//   const bSequence = getRequestIdSequence(b);

//   if (aSequence !== null && bSequence !== null && aSequence !== bSequence) {
//     return aSequence - bSequence;
//   }

//   if (aSequence !== null && bSequence === null) return -1;
//   if (aSequence === null && bSequence !== null) return 1;

//   const aDate = getRequestDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
//   const bDate = getRequestDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
//   if (aDate !== bDate) return aDate - bDate;

//   return String(a?.id || "").localeCompare(String(b?.id || ""));
// }

// function getTableStatusSortRank(invoice: any): number {
//   const status = normalizeText(invoice?.status);

//   if (isWaitingForAdminApproval(invoice) && !wasReturnedToCreator(invoice)) {
//     return 0;
//   }

//   if (
//     wasReturnedToCreator(invoice) ||
//     ["rejected", "returned_to_creator", "changes_requested"].includes(status)
//   ) {
//     return 1;
//   }

//   // IMPORTANT:
//   // Requests that are ready for payment release must appear before
//   // Pending Finance requests, so Finance users can find and release
//   // payments without going to later pages.
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
//     return 2;
//   }

//   if (status === "pending_finance") {
//     return 3;
//   }

//   if (status.startsWith("pending")) {
//     return 4;
//   }

//   if (
//     ["payment_released", "expense_submitted", "expense_completed"].includes(
//       status,
//     )
//   ) {
//     return 5;
//   }

//   return 6;
// }

// function compareBudgetRequestsForTable(a: any, b: any): number {
//   const aStatusRank = getTableStatusSortRank(a);
//   const bStatusRank = getTableStatusSortRank(b);

//   if (aStatusRank !== bStatusRank) {
//     return aStatusRank - bStatusRank;
//   }

//   return compareRequestIdsAscending(a, b);
// }

// function formatRequestDate(invoice: any) {
//   const date = getRequestDate(invoice);
//   if (!date) return "-";

//   return date.toLocaleDateString("en-PK", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// }

// function getDateInputValue(date: Date | null) {
//   if (!date) return "";

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
//   if (!text) return "";
//   if (isFirebaseIdLike(text)) return "";

//   return text;
// }

// function getUserDisplayName(user: any): string {
//   return getFirstTextValue([
//     getSafeDisplayText(user?.displayName),
//     getSafeDisplayText(user?.name),
//     getSafeDisplayText(user?.fullName),
//     getSafeDisplayText(user?.userName),
//     getSafeDisplayText(user?.username),
//     getSafeDisplayText(user?.employeeName),
//     getSafeDisplayText(user?.email),
//   ]);
// }

// const CREATOR_NAME_OVERRIDES: Record<string, string> = {
//   // Example:
//   // "wVS6kzCFiYM5dFQSEZ5P7Y8SChg1": "Bilal Tariq",
// };

// function getRoleKey(role: any): string {
//   return String(role || "")
//     .toLowerCase()
//     .trim()
//     .replace(/[\s-]+/g, "_");
// }

// function isAdminRole(role: any): boolean {
//   const roleKey = getRoleKey(role);

//   return ["admin", "main_admin", "super_admin"].includes(roleKey);
// }

// function isFinanceApproverRole(role: any): boolean {
//   const roleKey = getRoleKey(role);

//   return ["finance", "financial_admin", "finance_admin"].includes(roleKey);
// }

// function isOperationRole(role: any): boolean {
//   const roleKey = getRoleKey(role);

//   return ["operation", "operations"].includes(roleKey);
// }

// function canRoleCreateBudgetRequest(role: any): boolean {
//   const roleKey = getRoleKey(role);
//   if (!roleKey) return false;

//   return !isAdminRole(roleKey);
// }

// function canRoleSeeAllBudgetRequests(role: any): boolean {
//   return isAdminRole(role) || isFinanceApproverRole(role);
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

//   if (
//     normalizedStatus === "pending_main_admin" ||
//     normalizedStatus === "pending_admin"
//   ) {
//     return "Pending Admin";
//   }

//   if (normalizedStatus === "pending_operational_admin") return "Pending Admin";
//   if (normalizedStatus === "pending_finance") return "Pending Finance";
//   if (normalizedStatus === "payment_partially_released") {
//     return "Payment Partially Released";
//   }
//   if (normalizedStatus === "rejected")
//     return getReturnedToRoleStatusLabel(invoice);

//   return formatStatus(status);
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
//   const [isPaymentHistoryModalOpen, setIsPaymentHistoryModalOpen] =
//     useState(false);
//   const [paymentHistoryInvoice, setPaymentHistoryInvoice] =
//     useState<InvoiceRequest | null>(null);
//   const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
//   const [rejectionLoading, setRejectionLoading] = useState(false);

//   const [searchTerm, setSearchTerm] = useState("");
//   const [typeFilter, setTypeFilter] = useState<"all" | "project" | "general">(
//     "all",
//   );
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [dateFrom, setDateFrom] = useState("");
//   const [dateTo, setDateTo] = useState("");
//   const [monthFilter, setMonthFilter] = useState("");
//   const [createdByFilter, setCreatedByFilter] = useState("all");
//   const [projectCodeFilter, setProjectCodeFilter] = useState("");
//   const [vendorFilter, setVendorFilter] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pageSize, setPageSize] = useState(10);

//   const { data: invoices = [], loading } = useFirestoreQuery<InvoiceRequest>(
//     `Panels/${PANEL_ID}/invoiceRequests`,
//   );

//   const { data: expenseSheets = [] } = useFirestoreQuery<any>(
//     `Panels/${PANEL_ID}/expenseSheets`,
//   );

//   const { data: purchaseOrders = [] } = useFirestoreQuery<any>(
//     `Panels/${PANEL_ID}/purchaseOrders`,
//   );

//   const { data: users = [] } = useFirestoreQuery<any>("users");

//   const { data: panelUsers = [] } = useFirestoreQuery<any>(
//     `Panels/${PANEL_ID}/users`,
//   );

//   const CREATE_PO_ROUTE = "/create-po";

//   function getRequestType(invoice: any): "general" | "project" {
//     const rawType = String(
//       invoice?.invoiceType || invoice?.type || "",
//     ).toLowerCase();

//     if (rawType === "project") return "project";
//     if (rawType === "general") return "general";

//     return invoice?.clientName ||
//       invoice?.project ||
//       invoice?.projectName ||
//       invoice?.projectCode
//       ? "project"
//       : "general";
//   }

//   function isProjectRequest(invoice: any): boolean {
//     return getRequestType(invoice) === "project";
//   }

//   function getLinkedPO(invoice: any): any | null {
//     const requestId = String(invoice?.requestId || "").trim();
//     const invoiceDocId = String(invoice?.id || "").trim();
//     const estimateId = String(invoice?.estimateId || "").trim();
//     const estimateNumber = String(
//       invoice?.estimateNumber ||
//         invoice?.estimateNo ||
//         invoice?.estimateValue ||
//         invoice?.selectedEstimate ||
//         invoice?.selectEstimate ||
//         "",
//     ).trim();

//     return (
//       purchaseOrders.find((po: any) => {
//         const poRequestDocLinks = [
//           po?.invoiceRequestId,
//           po?.linkedInvoiceId,
//           po?.sourceInvoiceId,
//           po?.budgetRequestDocId,
//           po?.sourceBudgetRequestId,
//           po?.requestDocId,
//           po?.invoiceId,
//         ]
//           .filter(Boolean)
//           .map((value) => String(value).trim());

//         const poRequestIdLinks = [
//           po?.requestId,
//           po?.budgetRequestId,
//           po?.linkedRequestId,
//           po?.sourceRequestId,
//           po?.invoiceNumber,
//           po?.budgetRequestNumber,
//         ]
//           .filter(Boolean)
//           .map((value) => String(value).trim());

//         const poEstimateLinks = [
//           po?.estimateId,
//           po?.estimateNumber,
//           po?.estimateNo,
//           po?.selectedEstimate,
//         ]
//           .filter(Boolean)
//           .map((value) => String(value).trim());

//         return (
//           Boolean(invoiceDocId && poRequestDocLinks.includes(invoiceDocId)) ||
//           Boolean(requestId && poRequestIdLinks.includes(requestId)) ||
//           Boolean(estimateId && poEstimateLinks.includes(estimateId)) ||
//           Boolean(estimateNumber && poEstimateLinks.includes(estimateNumber))
//         );
//       }) || null
//     );
//   }

//   function hasPOAlready(invoice: any): boolean {
//     const status = normalizeText(invoice?.status);
//     const poStatus = normalizeText(
//       invoice?.poStatus || invoice?.purchaseOrderStatus,
//     );

//     const statusSaysPOCreated = [
//       "po_created",
//       "po_submitted",
//       "po_approved",
//       "po_issued",
//       "ready_for_payment",
//     ].includes(status);

//     const poStatusSaysCreated = [
//       "created",
//       "submitted",
//       "approved",
//       "issued",
//       "ready_for_payment",
//     ].includes(poStatus);

//     const hasDirectPOFields = Boolean(
//       invoice?.poSubmitted ||
//         invoice?.poCreated ||
//         invoice?.purchaseOrderCreated ||
//         invoice?.purchaseOrderSubmitted ||
//         invoice?.poId ||
//         invoice?.poNumber ||
//         invoice?.poDocId ||
//         invoice?.purchaseOrderId ||
//         invoice?.purchaseOrderNumber ||
//         invoice?.poCreatedAt ||
//         invoice?.purchaseOrderCreatedAt,
//     );

//     return Boolean(
//       statusSaysPOCreated ||
//         poStatusSaysCreated ||
//         hasDirectPOFields ||
//         getLinkedPO(invoice),
//     );
//   }

//   function hasPaymentReleased(invoice: any): boolean {
//     return isPaymentFullyReleased(invoice);
//   }

//   function hasAnyPaymentRelease(invoice: any): boolean {
//     return (
//       getTotalReleasedAmount(invoice) > 0 ||
//       getPaymentReleaseHistory(invoice).length > 0
//     );
//   }

//   function getExpenseAmount(invoice: any): number {
//     return safeNumber(
//       invoice?.approvedAmount || invoice?.totalAmount || invoice?.amount,
//     );
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
//     if (!userProfile || userProfile.role !== "operation") return false;

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
//     const vendorName =
//       request.vendorName ||
//       request.supplierName ||
//       getFirstVendorName(request) ||
//       request.clientName ||
//       "";
//     const amount = getExpenseAmount(request);

//     return {
//       ...request,
//       invoiceNumber: request.requestId,
//       linkedRequestId: request.requestId,
//       budgetRequestId: request.requestId,
//       invoiceRequestId: request.id,
//       linkedInvoiceId: request.id,
//       sourceInvoiceId: request.id,
//       sourceType: "budget_request",
//       approvalRequired: false,
//       requiresApproval: false,
//       adminApprovalRequired: false,
//       autoApproved: true,
//       autoApprovedReason:
//         "Created from approved budget request. No further approval required.",
//       expenseStatus: "submitted",
//       status: "submitted",
//       invoiceType: requestType,
//       requestType,
//       amount,
//       totalAmount: amount,
//       approvedAmount: amount,
//       vendorName,
//       supplierName: request.supplierName || vendorName,
//       clientName: request.clientName || "",
//       projectName,
//       project: projectName,
//       projectCode: request.projectCode || "",
//       poId: request.poId || "",
//       poNumber: request.poNumber || "",
//       dueDate: new Date(),
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
//     } catch (error: any) {
//       console.error("Failed to mark expense as submitted:", error);
//       toast({
//         title: "Expense submitted",
//         description:
//           "Expense was submitted, but the request status could not be updated.",
//       });
//     } finally {
//       setIsExpenseModalOpen(false);
//       setSelectedInvoice(null);
//       localStorage.removeItem("submitExpenseFromBudgetRequest");
//       localStorage.removeItem("expenseSheetSource");
//     }
//   }

//   async function handlePaymentReleased() {
//     // PaymentReleaseModal already updates the request with the latest partial/full
//     // release totals. Do not overwrite it here, otherwise partial releases would be
//     // forced into the final payment_released state.
//     toast({
//       title: "Payment release saved",
//       description: "The payment release history has been updated successfully.",
//     });

//     setIsPaymentModalOpen(false);
//     setSelectedInvoice(null);
//   }

//   function getFirstVendorName(invoice: any): string {
//     const lineItems = Array.isArray(invoice?.lineItems)
//       ? invoice.lineItems
//       : [];
//     const approvedItems = Array.isArray(invoice?.approvalItems)
//       ? invoice.approvalItems
//       : [];
//     const allItems = [...approvedItems, ...lineItems];

//     const matchedItem = allItems.find(
//       (item: any) =>
//         item?.vendor ||
//         item?.vendorName ||
//         item?.supplier ||
//         item?.supplierName ||
//         item?.original?.vendor ||
//         item?.original?.supplier,
//     );

//     return (
//       matchedItem?.vendor ||
//       matchedItem?.vendorName ||
//       matchedItem?.supplier ||
//       matchedItem?.supplierName ||
//       matchedItem?.original?.vendor ||
//       matchedItem?.original?.supplier ||
//       ""
//     );
//   }

//   function getVendorFilterText(invoice: any): string {
//     return getFirstTextValue([
//       invoice?.vendorName,
//       invoice?.supplierName,
//       getFirstVendorName(invoice),
//     ]);
//   }

//   function handleCreatePO(invoice: InvoiceRequest) {
//     const request: any = invoice;

//     localStorage.setItem(
//       "createPOFromBudgetRequest",
//       JSON.stringify({
//         invoiceRequestId: request.id,
//         budgetRequestDocId: request.id,
//         budgetRequestId: request.requestId,
//         requestId: request.requestId,
//         invoiceType: getRequestType(request),
//         sourceType: "budget_request",
//         returnToBudgetRequests: true,
//         updateBudgetRequestAfterPO: true,

//         estimateId: request.estimateId || "",
//         estimateNumber:
//           request.estimateNumber ||
//           request.estimateNo ||
//           request.estimateValue ||
//           request.selectedEstimate ||
//           request.selectEstimate ||
//           "",

//         clientName: request.clientName || "",
//         projectName: request.projectName || request.project || "",
//         project: request.project || request.projectName || "",
//         projectCode: request.projectCode || "",
//         title: request.title || request.subject || "",
//         subject: request.subject || "",
//         message: request.message || "",

//         supplierId: request.supplierId || request.vendorId || "",
//         supplierName:
//           request.supplierName ||
//           request.vendorName ||
//           getFirstVendorName(request),
//         vendorName:
//           request.vendorName ||
//           request.supplierName ||
//           getFirstVendorName(request),

//         totalAmount: Number(request.totalAmount || 0),
//         approvedAmount: Number(
//           request.approvedAmount || request.totalAmount || 0,
//         ),

//         approvalItems: request.approvalItems || [],
//         lineItems: request.lineItems || [],
//         items: request.items || request.lineItems || [],
//       }),
//     );

//     setLocation(CREATE_PO_ROUTE);
//   }

//   async function handleApprove(invoice: InvoiceRequest) {
//     if (!userProfile) return;

//     const roleKey = getRoleKey(userProfile.role);
//     const status = normalizeText(invoice.status);
//     const approvalHistory = Array.isArray((invoice as any).approvalHistory)
//       ? (invoice as any).approvalHistory
//       : [];

//     let newStatus = status;
//     let currentApprover = String((invoice as any).currentApprover || "");

//     const updatePayload: Record<string, any> = {
//       approvalHistory: [
//         ...approvalHistory,
//         {
//           approver:
//             userProfile.displayName ||
//             (userProfile as any)?.name ||
//             userProfile.email ||
//             roleKey,
//           approverRole: roleKey,
//           action: "approved",
//           timestamp: new Date(),
//           notes: "",
//         },
//       ],
//       returnedToCreator: false,
//       needsCreatorRevision: false,
//       returnedToRole: "",
//       returnedToRoleLabel: "",
//       updatedAt: serverTimestamp(),
//     };

//     if (isAdminRole(roleKey) && isWaitingForAdminApproval(invoice)) {
//       newStatus = "pending_finance";
//       currentApprover = "finance";
//       updatePayload.adminApprovedAt = serverTimestamp();
//       updatePayload.adminApprovedBy =
//         userProfile.displayName || userProfile.email || "";
//       updatePayload.adminApprovedById =
//         userProfile.id ||
//         (userProfile as any)?.uid ||
//         (userProfile as any)?.userId ||
//         userProfile.email ||
//         "";
//     } else if (isFinanceApproverRole(roleKey) && status === "pending_finance") {
//       newStatus = "approved";
//       currentApprover = "";
//       updatePayload.financeApprovedAt = serverTimestamp();
//       updatePayload.financeApprovedBy =
//         userProfile.displayName || userProfile.email || "";
//       updatePayload.financeApprovedById =
//         userProfile.id ||
//         (userProfile as any)?.uid ||
//         (userProfile as any)?.userId ||
//         userProfile.email ||
//         "";
//       updatePayload.approvedAt = serverTimestamp();
//     } else {
//       toast({
//         title: "Action not allowed",
//         description:
//           "This request is not currently assigned to your approval stage.",
//         variant: "destructive",
//       });
//       return;
//     }

//     try {
//       await updateDoc(
//         doc(db, "Panels", PANEL_ID, "invoiceRequests", invoice.id),
//         {
//           ...updatePayload,
//           status: newStatus,
//           currentApprover,
//         },
//       );

//       toast({
//         title: "Success",
//         description: "Budget request approved successfully",
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

//   async function handleReject(
//     invoice: InvoiceRequest,
//     rejectionComment: string,
//   ) {
//     if (!userProfile) return;

//     try {
//       setRejectionLoading(true);

//       const roleKey = getRoleKey(userProfile.role);
//       const ownerId = getBudgetRequestOwnerId(invoice);
//       const approvalHistory = Array.isArray((invoice as any).approvalHistory)
//         ? (invoice as any).approvalHistory
//         : [];

//       const returnedToRole = getBudgetRequestOwnerRole(invoice);
//       const returnedToRoleLabel = formatRoleLabel(returnedToRole);

//       await updateDoc(
//         doc(db, "Panels", PANEL_ID, "invoiceRequests", invoice.id),
//         {
//           status: "rejected",
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
//               approverRole: roleKey,
//               action: "rejected",
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
//           returnedToRoleLabel || "the original role"
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

//   function getStatusBadgeColor(status: string, invoice?: any): string {
//     if (invoice && wasReturnedToCreator(invoice)) {
//       return "border-red-200 bg-red-50 text-red-700";
//     }

//     switch (status) {
//       case "approved":
//       case "payment_released":
//       case "expense_submitted":
//       case "expense_completed":
//         return "border-green-200 bg-green-50 text-green-700";
//       case "rejected":
//       case "returned_to_creator":
//       case "changes_requested":
//         return "border-red-200 bg-red-50 text-red-700";
//       case "pending_operational_admin":
//       case "pending_main_admin":
//       case "pending_admin":
//       case "pending_finance":
//         return "border-amber-200 bg-amber-50 text-amber-700";
//       case "payment_partially_released":
//         return "border-blue-200 bg-blue-50 text-blue-700";
//       default:
//         return "border-slate-200 bg-slate-50 text-slate-700";
//     }
//   }

//   function getTypeBadgeColor(type: "general" | "project") {
//     return type === "project"
//       ? "border-indigo-200 bg-indigo-50 text-indigo-700"
//       : "border-slate-200 bg-slate-50 text-slate-700";
//   }

//   function getCurrentStep(invoice: InvoiceRequest): string {
//     const status = normalizeText(invoice.status || "");

//     if (
//       (invoice as any).expenseSubmitted ||
//       status === "expense_submitted" ||
//       hasExpenseSheet(invoice)
//     ) {
//       return "Expense Submitted / No Approval Required";
//     }

//     if (hasPaymentReleased(invoice)) {
//       return "Payment Released / Ready for Expense";
//     }

//     if (hasPartialPaymentReleased(invoice)) {
//       return `Partial Payment Released / Remaining Rs ${formatPKR(
//         getRemainingPaymentBalance(invoice),
//       )}`;
//     }

//     if (isProjectRequest(invoice) && hasPOAlready(invoice)) {
//       return "PO Created / Ready for Payment";
//     }

//     if (wasReturnedToCreator(invoice)) {
//       return `${getBudgetRequestStatusLabel(invoice)} / Waiting for Resubmission`;
//     }

//     switch (status) {
//       case "pending_operational_admin":
//       case "pending_main_admin":
//       case "pending_admin":
//         return "Admin Approval";
//       case "pending_finance":
//         return "Finance Approval";
//       case "approved":
//         return isProjectRequest(invoice) ? "Ready for PO" : "Ready for Payment";
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
//         return "Payment Released / Ready for Expense";
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
//     if (!userProfile) return false;

//     const roleKey = getRoleKey(userProfile.role);

//     if (isAdminRole(roleKey)) {
//       return isWaitingForAdminApproval(invoice);
//     }

//     if (isFinanceApproverRole(roleKey)) {
//       return normalizeText(invoice.status) === "pending_finance";
//     }

//     return false;
//   }

//   function canEdit(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;

//     if (!isOwnBudgetRequest(invoice)) return false;

//     if (hasAdminApprovedBudgetRequest(invoice)) return false;

//     const status = normalizeText(invoice.status);

//     return (
//       wasReturnedToCreator(invoice) ||
//       status === "draft" ||
//       status === "pending_main_admin" ||
//       status === "pending_admin" ||
//       status === "pending_operational_admin" ||
//       status === ""
//     );
//   }

//   function getEditableInvoice(invoice: InvoiceRequest): InvoiceRequest {
//     if (hasAdminApprovedBudgetRequest(invoice)) return invoice;

//     if (!wasReturnedToCreator(invoice)) return invoice;

//     return {
//       ...(invoice as any),
//       status: "pending_main_admin",
//       currentApprover: "main_admin",
//       returnedToCreator: false,
//       needsCreatorRevision: false,
//       returnedToRole: "",
//       returnedToRoleLabel: "",
//       resubmittedAt: new Date(),
//     } as InvoiceRequest;
//   }

//   function canReleasePayment(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;

//     const isFinanceUser = isFinanceApproverRole(userProfile.role);
//     if (!isFinanceUser) return false;

//     if (hasPaymentReleased(invoice)) return false;

//     if (getRemainingPaymentBalance(invoice) <= 0.009) return false;

//     if (
//       (invoice as any).expenseSubmitted ||
//       String(invoice.status) === "expense_submitted"
//     ) {
//       return false;
//     }

//     const status = normalizeText(invoice.status);
//     const readyForPayment = [
//       "approved",
//       "po_created",
//       "po_submitted",
//       "po_approved",
//       "po_issued",
//       "ready_for_payment",
//       "payment_partially_released",
//     ].includes(status);

//     if (!readyForPayment) return false;

//     if (!isProjectRequest(invoice)) return true;

//     return hasPOAlready(invoice);
//   }

//   function canCreatePO(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;

//     return (
//       isFinanceApproverRole(userProfile.role) &&
//       normalizeText(invoice.status) === "approved" &&
//       isProjectRequest(invoice) &&
//       !hasPOAlready(invoice) &&
//       !hasPaymentReleased(invoice)
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

//     if (!expenseSheets) return null;

//     const expenseSheet = expenseSheets.find((expense: any) =>
//       isExpenseLinkedToRequest(expense, invoice),
//     );

//     return expenseSheet?.status || expenseSheet?.expenseStatus || null;
//   }

//   const canCreateInvoices = canRoleCreateBudgetRequest(currentUserRole);

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

//       if (!lookupKey) continue;

//       const matchedUser = usersByLookup.get(lookupKey);
//       if (matchedUser) return matchedUser;
//     }

//     return null;
//   }

//   function canCurrentUserSeeAllBudgetRequests() {
//     const userRecord = getCurrentUserRecordFromUsersCollection();
//     const effectiveRole = getRoleKey(currentUserRole || userRecord?.role);

//     if (canRoleSeeAllBudgetRequests(effectiveRole)) return true;

//     if (!isOperationRole(effectiveRole)) return false;

//     return Boolean(
//       (userProfile as any)?.canViewAllBudgetRequests ||
//         userRecord?.canViewAllBudgetRequests,
//     );
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

//         if (lookupKey) map.set(lookupKey, user);
//       });
//     });

//     return map;
//   }, [users, panelUsers]);

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
//     if (directRole) return directRole;

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

//       if (!lookupKey) continue;

//       const matchedUser = usersByLookup.get(lookupKey);
//       const matchedRole = getUserRoleLabel(matchedUser);

//       if (matchedRole) return matchedRole;
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

//     if (isCurrentUserOwner) return getRoleKey(userProfile?.role);

//     return "";
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

//     return getStatusLabel(invoice?.status || "", invoice);
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

//       if (!name) return;

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

//         if (lookupKey && !map.has(lookupKey)) map.set(lookupKey, name);
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

//     if (directName) return directName;

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

//       if (!lookupKey) continue;

//       const overrideName = getSafeDisplayText(
//         CREATOR_NAME_OVERRIDES[rawKey] || CREATOR_NAME_OVERRIDES[lookupKey],
//       );

//       if (overrideName) return overrideName;

//       const nameFromAnotherRequest = getSafeDisplayText(
//         creatorNamesByLookup.get(lookupKey),
//       );

//       if (nameFromAnotherRequest) return nameFromAnotherRequest;

//       const matchedUser = usersByLookup.get(lookupKey);
//       const matchedName = getSafeDisplayText(getUserDisplayName(matchedUser));

//       if (matchedName) return matchedName;
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

//     const ownerLookupValues = lookupValues
//       .map((value) =>
//         String(value || "")
//           .trim()
//           .toLowerCase(),
//       )
//       .filter(Boolean);

//     const isCurrentUserOwner = ownerLookupValues.some((ownerKey) =>
//       currentUserLookupValues.includes(ownerKey),
//     );

//     if (isCurrentUserOwner) {
//       const currentUserName = getFirstTextValue([
//         getSafeDisplayText(userProfile?.displayName),
//         getSafeDisplayText((userProfile as any)?.name),
//         getSafeDisplayText((userProfile as any)?.fullName),
//         getSafeDisplayText(userProfile?.email),
//       ]);

//       if (currentUserName) return currentUserName;
//     }

//     const emailFallback = getFirstTextValue([
//       getSafeDisplayText(invoice?.createdByEmail),
//       getSafeDisplayText(invoice?.submittedByEmail),
//       getSafeDisplayText(invoice?.email),
//     ]);

//     if (emailFallback) return emailFallback;

//     return "Unknown User";
//   }

//   const visibleInvoicesForFilterOptions = useMemo(() => {
//     return (invoices || []).filter((invoice: any) => {
//       const canSeeAllRequests = canCurrentUserSeeAllBudgetRequests();
//       return canSeeAllRequests || isOwnBudgetRequest(invoice);
//     });
//   }, [invoices, userProfile, currentUserRole, usersByLookup]);

//   const createdByOptions = useMemo(() => {
//     const names = Array.from(
//       new Set(
//         visibleInvoicesForFilterOptions
//           .map((invoice: any) => getCreatedByName(invoice))
//           .filter((name) => String(name || "").trim()),
//       ),
//     );

//     return names.sort((a, b) => a.localeCompare(b));
//   }, [
//     visibleInvoicesForFilterOptions,
//     usersByLookup,
//     creatorNamesByLookup,
//     userProfile,
//   ]);

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

//   const statusOptions = useMemo(() => {
//     const uniqueStatuses = Array.from(
//       new Set(
//         (invoices || []).map((invoice) => invoice.status).filter(Boolean),
//       ),
//     );

//     return uniqueStatuses.sort();
//   }, [invoices]);

//   const filteredInvoices = useMemo(() => {
//     const search = normalizeText(searchTerm);
//     const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
//     const toDate = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

//     return (invoices || []).filter((invoice: any) => {
//       const requestType = getRequestType(invoice);
//       const requestDate = getRequestDate(invoice);
//       const requestDateInputValue = getDateInputValue(requestDate);
//       const createdByName = getCreatedByName(invoice);
//       const projectCode = String(invoice?.projectCode || "").trim();
//       const vendorName = getVendorFilterText(invoice);

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
//           createdByName,
//           (invoice as any).createdByName,
//           (invoice as any).submittedByName,
//           (invoice as any).requestedByName,
//           (invoice as any).createdByEmail,
//           (invoice as any).submittedByEmail,
//         ].join(" "),
//       );

//       const matchesSearch = !search || haystack.includes(search);
//       const matchesType = typeFilter === "all" || requestType === typeFilter;
//       const matchesStatus =
//         statusFilter === "all" || invoice.status === statusFilter;
//       const matchesMonth =
//         !monthFilter || requestDateInputValue.startsWith(monthFilter);
//       const matchesCreatedBy =
//         createdByFilter === "all" ||
//         normalizeText(createdByName) === normalizeText(createdByFilter);
//       const matchesProjectCode =
//         !normalizeText(projectCodeFilter) ||
//         normalizeText(projectCode).includes(normalizeText(projectCodeFilter));
//       const matchesVendor =
//         !normalizeText(vendorFilter) ||
//         normalizeText(vendorName).includes(normalizeText(vendorFilter));
//       const matchesFrom = !fromDate || (requestDate && requestDate >= fromDate);
//       const matchesTo = !toDate || (requestDate && requestDate <= toDate);
//       const canSeeAllRequests = canCurrentUserSeeAllBudgetRequests();
//       const matchesOwnership = canSeeAllRequests || isOwnBudgetRequest(invoice);

//       return (
//         matchesOwnership &&
//         matchesSearch &&
//         matchesType &&
//         matchesStatus &&
//         matchesMonth &&
//         matchesCreatedBy &&
//         matchesProjectCode &&
//         matchesVendor &&
//         matchesFrom &&
//         matchesTo
//       );
//     });
//   }, [
//     dateFrom,
//     dateTo,
//     invoices,
//     monthFilter,
//     searchTerm,
//     statusFilter,
//     typeFilter,
//     createdByFilter,
//     projectCodeFilter,
//     vendorFilter,
//     userProfile,
//     currentUserRole,
//     usersByLookup,
//     creatorNamesByLookup,
//   ]);

//   const summary = useMemo(() => {
//     const totalAmount = filteredInvoices.reduce(
//       (sum, invoice: any) => sum + safeNumber(invoice.totalAmount),
//       0,
//     );

//     const projectCount = filteredInvoices.filter(
//       (invoice) => getRequestType(invoice) === "project",
//     ).length;

//     const generalCount = filteredInvoices.filter(
//       (invoice) => getRequestType(invoice) === "general",
//     ).length;

//     const approvedCount = filteredInvoices.filter(
//       (invoice) => invoice.status === "approved",
//     ).length;

//     return { totalAmount, projectCount, generalCount, approvedCount };
//   }, [filteredInvoices]);

//   const sortedInvoices = useMemo(() => {
//     return [...filteredInvoices].sort(compareBudgetRequestsForTable);
//   }, [filteredInvoices]);

//   const totalPages = Math.max(1, Math.ceil(sortedInvoices.length / pageSize));
//   const startIndex = (currentPage - 1) * pageSize;
//   const paginatedInvoices = sortedInvoices.slice(
//     startIndex,
//     startIndex + pageSize,
//   );
//   const showingFrom = sortedInvoices.length === 0 ? 0 : startIndex + 1;
//   const showingTo = Math.min(startIndex + pageSize, sortedInvoices.length);

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
//     pageSize,
//   ]);

//   useEffect(() => {
//     if (currentPage > totalPages) setCurrentPage(totalPages);
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
//     setPageSize(10);
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
//             <p className="mt-2 max-w-2xl text-sm text-slate-500">
//               Review project and general budget requests, send requests through
//               Admin and Finance approval, release payments, or create POs.
//             </p>
//           </div>

//           {canCreateInvoices && (
//             <Button
//               className="h-11 rounded-2xl px-5 shadow-sm"
//               onClick={() => {
//                 setSelectedInvoice(null);
//                 setIsInvoiceModalOpen(true);
//               }}
//               data-testid="button-new-invoice-request"
//             >
//               + New Request
//             </Button>
//           )}
//         </div>

//         <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
//                 Filtered Value
//               </p>
//               <p className="mt-3 text-2xl font-semibold text-slate-950">
//                 Rs {formatPKR(summary.totalAmount)}
//               </p>
//               <p className="mt-1 text-xs text-slate-400">
//                 Approved waiting: {summary.approvedCount}
//               </p>
//             </CardContent>
//           </Card>
//         </div>

//         <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//           <CardContent className="space-y-4 p-5">
//             <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
//               <div className="xl:col-span-2">
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Search
//                 </label>
//                 <input
//                   value={searchTerm}
//                   onChange={(event) => setSearchTerm(event.target.value)}
//                   placeholder="Request ID, client, project, title..."
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Created By
//                 </label>
//                 <select
//                   value={createdByFilter}
//                   onChange={(event) => setCreatedByFilter(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 >
//                   <option value="all">All Creators</option>
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
//                   placeholder="Enter project code..."
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Request Type
//                 </label>
//                 <select
//                   value={typeFilter}
//                   onChange={(event) =>
//                     setTypeFilter(
//                       event.target.value as "all" | "project" | "general",
//                     )
//                   }
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 >
//                   <option value="all">All Types</option>
//                   <option value="project">Project</option>
//                   <option value="general">General</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Status
//                 </label>
//                 <select
//                   value={statusFilter}
//                   onChange={(event) => setStatusFilter(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 >
//                   <option value="all">All Statuses</option>
//                   {statusOptions.map((status) => (
//                     <option key={status} value={status}>
//                       {getStatusLabel(status)}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Month
//                 </label>
//                 <input
//                   type="month"
//                   value={monthFilter}
//                   onChange={(event) => setMonthFilter(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>
//             </div>

//             <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Vendor
//                 </label>
//                 <input
//                   value={vendorFilter}
//                   onChange={(event) => setVendorFilter(event.target.value)}
//                   placeholder="Enter vendor name..."
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   From Date
//                 </label>
//                 <input
//                   type="date"
//                   value={dateFrom}
//                   onChange={(event) => setDateFrom(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   To Date
//                 </label>
//                 <input
//                   type="date"
//                   value={dateTo}
//                   onChange={(event) => setDateTo(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Rows
//                 </label>
//                 <select
//                   value={pageSize}
//                   onChange={(event) => setPageSize(Number(event.target.value))}
//                   className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
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

//         <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm">
//           <CardContent className="p-0">
//             <div className="overflow-x-auto">
//               <table className="w-full min-w-[1400px]">
//                 <thead>
//                   <tr className="border-b border-slate-200 bg-slate-50/80">
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Request ID
//                     </th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Type
//                     </th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Client / Title
//                     </th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Project
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
//                       <td colSpan={11} className="px-6 py-12 text-center">
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
//                         type === "general"
//                           ? (invoice as any).title ||
//                             (invoice as any).subject ||
//                             "General Request"
//                           : (invoice as any).clientName || "-";

//                       const projectName =
//                         type === "project"
//                           ? (invoice as any).projectName ||
//                             (invoice as any).project ||
//                             (invoice as any).projectCode ||
//                             "-"
//                           : "-";

//                       const createdByName = getCreatedByName(invoice);
//                       const approvedPaymentAmount =
//                         getApprovedPaymentAmount(invoice);
//                       const totalReleasedAmount =
//                         getTotalReleasedAmount(invoice);
//                       const remainingPaymentBalance =
//                         getRemainingPaymentBalance(invoice);
//                       const paymentHistory = getPaymentReleaseHistory(invoice);
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

//                       return (
//                         <tr
//                           key={invoice.id}
//                           className="transition hover:bg-slate-50/80"
//                         >
//                           <td
//                             className="px-5 py-4 text-sm font-semibold text-slate-900"
//                             data-testid={`text-request-id-${invoice.id}`}
//                           >
//                             {invoice.requestId || "-"}
//                           </td>

//                           <td className="px-5 py-4">
//                             <Badge
//                               variant="outline"
//                               className={`rounded-full px-3 py-1 ${getTypeBadgeColor(
//                                 type,
//                               )}`}
//                             >
//                               {type === "project" ? "Project" : "General"}
//                             </Badge>
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-700">
//                             <div className="font-medium text-slate-900">
//                               {displayClientOrTitle}
//                             </div>
//                             {(invoice as any).projectCode &&
//                               type === "project" && (
//                                 <div className="mt-1 text-xs text-slate-400">
//                                   Code: {(invoice as any).projectCode}
//                                 </div>
//                               )}
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-600">
//                             {projectName}
//                           </td>

//                           <td
//                             className="px-5 py-4 text-sm font-medium text-slate-700"
//                             data-testid={`text-created-by-${invoice.id}`}
//                           >
//                             {createdByName}
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-600">
//                             {formatRequestDate(invoice)}
//                           </td>

//                           <td className="px-5 py-4 text-sm font-semibold text-slate-900">
//                             Rs{" "}
//                             {formatPKR(
//                               approvedPaymentAmount || invoice.totalAmount,
//                             )}
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-600">
//                             <div className="space-y-2">
//                               <div className="flex items-center justify-between gap-3">
//                                 <span className="text-xs text-slate-500">
//                                   Released
//                                 </span>
//                                 <span className="font-semibold text-slate-900">
//                                   Rs {formatPKR(totalReleasedAmount)}
//                                 </span>
//                               </div>
//                               <div className="h-2 overflow-hidden rounded-full bg-slate-100">
//                                 <div
//                                   className="h-full rounded-full bg-slate-950"
//                                   style={{
//                                     width: `${paymentProgressPercent}%`,
//                                   }}
//                                 />
//                               </div>
//                               <div className="flex items-center justify-between gap-3">
//                                 <span className="text-xs text-slate-500">
//                                   Balance
//                                 </span>
//                                 <span className="font-semibold text-slate-900">
//                                   Rs {formatPKR(remainingPaymentBalance)}
//                                 </span>
//                               </div>
//                             </div>
//                           </td>

//                           <td className="px-5 py-4">
//                             <Badge
//                               variant="outline"
//                               className={`rounded-full px-3 py-1 ${getStatusBadgeColor(
//                                 invoice.status,
//                                 invoice,
//                               )}`}
//                             >
//                               {getBudgetRequestStatusLabel(invoice)}
//                             </Badge>
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-500">
//                             {getCurrentStep(invoice)}
//                           </td>

//                           <td className="px-5 py-4">
//                             <div className="flex flex-wrap gap-2">
//                               <Button
//                                 variant="outline"
//                                 size="sm"
//                                 className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
//                                 onClick={() => openDetailsModal(invoice)}
//                                 data-testid={`button-view-details-${invoice.id}`}
//                               >
//                                 View
//                               </Button>

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
//                                           "This request can no longer be edited because it has already been approved by Admin.",
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

//                               {canReleasePayment(invoice) && (
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   className="rounded-xl border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
//                                   onClick={() => {
//                                     const linkedPO = getLinkedPO(invoice);

//                                     setSelectedInvoice({
//                                       ...invoice,
//                                       invoiceNumber: invoice.requestId,
//                                       vendorName:
//                                         (invoice as any).vendorName ||
//                                         (invoice as any).supplierName ||
//                                         (invoice as any).clientName,
//                                       amount: remainingPaymentBalance,
//                                       approvedAmount: approvedPaymentAmount,
//                                       totalApprovedAmount:
//                                         approvedPaymentAmount,
//                                       totalReleasedAmount,
//                                       remainingReleaseAmount:
//                                         remainingPaymentBalance,
//                                       dueDate: new Date(),
//                                       poId:
//                                         (invoice as any).poId ||
//                                         (invoice as any).poDocId ||
//                                         linkedPO?.id ||
//                                         linkedPO?.poId ||
//                                         linkedPO?.poDocId ||
//                                         "",
//                                       poNumber:
//                                         (invoice as any).poNumber ||
//                                         (invoice as any).purchaseOrderNumber ||
//                                         linkedPO?.poNumber ||
//                                         linkedPO?.purchaseOrderNumber ||
//                                         "",
//                                     } as any);
//                                     setIsPaymentModalOpen(true);
//                                   }}
//                                   data-testid={`button-release-payment-${invoice.id}`}
//                                 >
//                                   Release Payment
//                                 </Button>
//                               )}

//                               {hasAnyPaymentRelease(invoice) && (
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
//                                   History ({paymentHistory.length})
//                                 </Button>
//                               )}

//                               {canCreatePO(invoice) && (
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   className="rounded-xl border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
//                                   onClick={() => handleCreatePO(invoice)}
//                                   data-testid={`button-create-po-${invoice.id}`}
//                                 >
//                                   Create PO
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

//               <div className="flex items-center gap-2">
//                 <Button
//                   type="button"
//                   variant="outline"
//                   size="sm"
//                   className="rounded-xl border-slate-200"
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
//                     type="button"
//                     variant={page === currentPage ? "default" : "outline"}
//                     size="sm"
//                     className="h-9 w-9 rounded-xl p-0"
//                     onClick={() => setCurrentPage(page)}
//                   >
//                     {page}
//                   </Button>
//                 ))}

//                 <Button
//                   type="button"
//                   variant="outline"
//                   size="sm"
//                   className="rounded-xl border-slate-200"
//                   disabled={currentPage === totalPages}
//                   onClick={() =>
//                     setCurrentPage((page) => Math.min(totalPages, page + 1))
//                   }
//                 >
//                   Next
//                 </Button>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       <InvoiceRequestModal
//         isOpen={isInvoiceModalOpen}
//         onClose={() => {
//           setIsInvoiceModalOpen(false);
//           setSelectedInvoice(null);
//         }}
//         onSuccess={() => {
//           setIsInvoiceModalOpen(false);
//           setSelectedInvoice(null);
//         }}
//         editingInvoice={selectedInvoice}
//       />

//       <PaymentReleaseModal
//         isOpen={isPaymentModalOpen}
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
//       />

//       {isPaymentHistoryModalOpen && paymentHistoryInvoice && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
//           <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-xl">
//             <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-slate-200 bg-white/95 p-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
//               <div>
//                 <h2 className="text-lg font-semibold text-slate-950">
//                   Payment Release History
//                 </h2>
//                 <p className="mt-1 text-sm text-slate-500">
//                   Request ID: {paymentHistoryInvoice.requestId || "-"}
//                 </p>
//               </div>

//               <Button
//                 type="button"
//                 variant="outline"
//                 className="rounded-2xl border-slate-200"
//                 onClick={() => {
//                   setIsPaymentHistoryModalOpen(false);
//                   setPaymentHistoryInvoice(null);
//                 }}
//               >
//                 Close
//               </Button>
//             </div>

//             <div className="grid gap-4 border-b border-slate-100 p-5 md:grid-cols-3">
//               <div className="rounded-2xl bg-slate-50 p-4">
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                   Total Approved
//                 </p>
//                 <p className="mt-2 text-xl font-semibold text-slate-950">
//                   Rs{" "}
//                   {formatPKR(getApprovedPaymentAmount(paymentHistoryInvoice))}
//                 </p>
//               </div>
//               <div className="rounded-2xl bg-slate-50 p-4">
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                   Released So Far
//                 </p>
//                 <p className="mt-2 text-xl font-semibold text-slate-950">
//                   Rs {formatPKR(getTotalReleasedAmount(paymentHistoryInvoice))}
//                 </p>
//               </div>
//               <div className="rounded-2xl bg-slate-50 p-4">
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                   Remaining Balance
//                 </p>
//                 <p className="mt-2 text-xl font-semibold text-slate-950">
//                   Rs{" "}
//                   {formatPKR(getRemainingPaymentBalance(paymentHistoryInvoice))}
//                 </p>
//               </div>
//             </div>

//             <div className="p-5">
//               {getPaymentReleaseHistory(paymentHistoryInvoice).length === 0 ? (
//                 <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">
//                   No payment releases have been recorded yet.
//                 </div>
//               ) : (
//                 <div className="overflow-x-auto rounded-2xl border border-slate-200">
//                   <table className="w-full min-w-[850px] text-sm">
//                     <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
//                       <tr>
//                         <th className="px-4 py-3 text-left font-semibold">
//                           Date
//                         </th>
//                         <th className="px-4 py-3 text-left font-semibold">
//                           Type
//                         </th>
//                         <th className="px-4 py-3 text-left font-semibold">
//                           Method
//                         </th>
//                         <th className="px-4 py-3 text-left font-semibold">
//                           Amount
//                         </th>
//                         <th className="px-4 py-3 text-left font-semibold">
//                           Reference / Cheque
//                         </th>
//                         <th className="px-4 py-3 text-left font-semibold">
//                           Released By
//                         </th>
//                         <th className="px-4 py-3 text-left font-semibold">
//                           Notes
//                         </th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-slate-100">
//                       {[...getPaymentReleaseHistory(paymentHistoryInvoice)]
//                         .reverse()
//                         .map((entry: any, index: number) => (
//                           <tr
//                             key={
//                               entry?.id ||
//                               `${entry?.releasedAt || "release"}-${index}`
//                             }
//                           >
//                             <td className="px-4 py-3 text-slate-600">
//                               {getReleaseDateLabel(entry?.releasedAt)}
//                             </td>
//                             <td className="px-4 py-3">
//                               <Badge
//                                 variant="outline"
//                                 className="rounded-full border-slate-200 bg-slate-50 px-3 py-1 text-slate-700"
//                               >
//                                 {entry?.releaseType || "release"}
//                               </Badge>
//                             </td>
//                             <td className="px-4 py-3 text-slate-700">
//                               {getPaymentMethodLabel(entry?.paymentMethod)}
//                             </td>
//                             <td className="px-4 py-3 font-semibold text-slate-950">
//                               Rs {formatPKR(getPaymentReleaseAmount(entry))}
//                             </td>
//                             <td className="px-4 py-3 text-slate-600">
//                               <div>{entry?.transactionReference || "-"}</div>
//                               {Array.isArray(entry?.chequeNumbers) &&
//                                 entry.chequeNumbers.length > 0 && (
//                                   <div className="mt-1 text-xs text-slate-500">
//                                     Cheques: {entry.chequeNumbers.join(", ")}
//                                   </div>
//                                 )}
//                             </td>
//                             <td className="px-4 py-3 text-slate-600">
//                               {entry?.releasedByName || "-"}
//                             </td>
//                             <td className="px-4 py-3 text-slate-600">
//                               {entry?.paymentNotes || "-"}
//                             </td>
//                           </tr>
//                         ))}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

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








// import { useEffect, useMemo, useState } from "react";
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

//   // Backward compatibility for older records that only saved a single paymentDetails object.
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
//   if (explicitReleasedAmount > 0) return explicitReleasedAmount;

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

// function getReleaseDateLabel(value: any) {
//   if (!value) return "-";

//   let date: Date | null = null;

//   if (value instanceof Date) date = value;
//   else if (typeof value?.toDate === "function") date = value.toDate();
//   else if (typeof value?.seconds === "number")
//     date = new Date(value.seconds * 1000);
//   else date = new Date(value);

//   if (!date || Number.isNaN(date.getTime())) return "-";

//   return date.toLocaleString("en-PK", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// }

// function getPaymentMethodLabel(method?: string) {
//   switch (method) {
//     case "cash":
//       return "Cash";
//     case "cheque":
//       return "Cheque";
//     case "bank_transfer":
//       return "Bank Transfer";
//     case "wire":
//       return "Online Transfer";
//     default:
//       return method ? formatStatus(method) : "-";
//   }
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

// function formatRoleLabel(role: any): string {
//   const roleKey = getRoleKey(role);
//   if (!roleKey) return "";

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
//     if (text) return text;
//   }
//   return "";
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
//   if (!sequenceMatch) return null;

//   const sequence = Number(sequenceMatch[1]);
//   return Number.isFinite(sequence) ? sequence : null;
// }

// function compareRequestIdsAscending(a: any, b: any): number {
//   const aSequence = getRequestIdSequence(a);
//   const bSequence = getRequestIdSequence(b);

//   if (aSequence !== null && bSequence !== null && aSequence !== bSequence) {
//     return aSequence - bSequence;
//   }

//   if (aSequence !== null && bSequence === null) return -1;
//   if (aSequence === null && bSequence !== null) return 1;

//   const aDate = getRequestDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
//   const bDate = getRequestDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
//   if (aDate !== bDate) return aDate - bDate;

//   return String(a?.id || "").localeCompare(String(b?.id || ""));
// }

// function getTableStatusSortRank(invoice: any): number {
//   const status = normalizeText(invoice?.status);

//   if (isWaitingForAdminApproval(invoice) && !wasReturnedToCreator(invoice)) {
//     return 0;
//   }

//   if (
//     wasReturnedToCreator(invoice) ||
//     ["rejected", "returned_to_creator", "changes_requested"].includes(status)
//   ) {
//     return 1;
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
//     return 2;
//   }

//   if (status === "pending_finance") {
//     return 3;
//   }

//   if (status.startsWith("pending")) {
//     return 4;
//   }

//   if (
//     ["payment_released", "expense_submitted", "expense_completed"].includes(
//       status,
//     )
//   ) {
//     return 5;
//   }

//   return 6;
// }

// type ReleasePaymentPriorityPredicate = (invoice: any) => boolean;

// /**
//  * Lightweight fallback used by dashboards or other request views that do not
//  * have access to the full purchase-order collection. The request-list page
//  * passes its richer canReleasePayment predicate so linked POs are also handled.
//  */
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

//   if (status !== "approved") return false;

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

//   if (!looksLikeProject) return true;

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

// /**
//  * Finance users use this workflow priority:
//  * 1. Requests currently waiting for Finance approval.
//  * 2. Requests ready for a full or partial payment release.
//  * 3. Requests already approved or completed by Finance.
//  * 4. Requests currently waiting for Admin approval.
//  * 5. Every other request.
//  *
//  * Apply this ranking before pagination in every Finance dashboard/list view.
//  */
// export function getFinanceTableStatusSortRank(
//   invoice: any,
//   isReleasePaymentRequest?: ReleasePaymentPriorityPredicate,
// ): number {
//   const status = normalizeText(invoice?.status);

//   // Priority 1: Finance's own outstanding approval work.
//   if (status === "pending_finance") {
//     return 0;
//   }

//   // Priority 2: Requests requiring payment-release action from Finance.
//   const needsPaymentRelease = isReleasePaymentRequest
//     ? isReleasePaymentRequest(invoice)
//     : isFinanceReleasePaymentPriorityRequest(invoice);

//   if (needsPaymentRelease) {
//     return 1;
//   }

//   // Priority 3: Requests that passed Finance approval or completed later
//   // workflow stages but do not currently require a payment-release action.
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
//       "expense_submitted",
//       "expense_completed",
//     ].includes(status)
//   ) {
//     return 2;
//   }

//   // Priority 4: Requests still assigned to an Admin approval stage.
//   if (isWaitingForAdminApproval(invoice) && !wasReturnedToCreator(invoice)) {
//     return 3;
//   }

//   // Priority 5: Rejected, returned, draft, other-role pending, and unknown
//   // workflow statuses.
//   return 4;
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

//   return compareRequestIdsAscending(a, b);
// }

// function formatRequestDate(invoice: any) {
//   const date = getRequestDate(invoice);
//   if (!date) return "-";

//   return date.toLocaleDateString("en-PK", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// }

// function getDateInputValue(date: Date | null) {
//   if (!date) return "";

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
//   if (!text) return "";
//   if (isFirebaseIdLike(text)) return "";

//   return text;
// }

// function getUserDisplayName(user: any): string {
//   return getFirstTextValue([
//     getSafeDisplayText(user?.displayName),
//     getSafeDisplayText(user?.name),
//     getSafeDisplayText(user?.fullName),
//     getSafeDisplayText(user?.userName),
//     getSafeDisplayText(user?.username),
//     getSafeDisplayText(user?.employeeName),
//     getSafeDisplayText(user?.email),
//   ]);
// }

// const CREATOR_NAME_OVERRIDES: Record<string, string> = {
//   // Example:
//   // "wVS6kzCFiYM5dFQSEZ5P7Y8SChg1": "Bilal Tariq",
// };

// function getRoleKey(role: any): string {
//   return String(role || "")
//     .toLowerCase()
//     .trim()
//     .replace(/[\s-]+/g, "_");
// }

// function isAdminRole(role: any): boolean {
//   const roleKey = getRoleKey(role);

//   return ["admin", "main_admin", "super_admin"].includes(roleKey);
// }

// function isFinanceApproverRole(role: any): boolean {
//   const roleKey = getRoleKey(role);

//   return ["finance", "financial_admin", "finance_admin"].includes(roleKey);
// }

// function isOperationRole(role: any): boolean {
//   const roleKey = getRoleKey(role);

//   return ["operation", "operations"].includes(roleKey);
// }

// function canRoleCreateBudgetRequest(role: any): boolean {
//   const roleKey = getRoleKey(role);
//   if (!roleKey) return false;

//   return !isAdminRole(roleKey);
// }

// function canRoleSeeAllBudgetRequests(role: any): boolean {
//   return isAdminRole(role) || isFinanceApproverRole(role);
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

//   if (
//     normalizedStatus === "pending_main_admin" ||
//     normalizedStatus === "pending_admin"
//   ) {
//     return "Pending Admin";
//   }

//   if (normalizedStatus === "pending_operational_admin") return "Pending Admin";
//   if (normalizedStatus === "pending_finance") return "Pending Finance";
//   if (normalizedStatus === "payment_partially_released") {
//     return "Payment Partially Released";
//   }
//   if (normalizedStatus === "rejected")
//     return getReturnedToRoleStatusLabel(invoice);

//   return formatStatus(status);
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
//   const [isPaymentHistoryModalOpen, setIsPaymentHistoryModalOpen] =
//     useState(false);
//   const [paymentHistoryInvoice, setPaymentHistoryInvoice] =
//     useState<InvoiceRequest | null>(null);
//   const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
//   const [rejectionLoading, setRejectionLoading] = useState(false);

//   const [searchTerm, setSearchTerm] = useState("");
//   const [typeFilter, setTypeFilter] = useState<"all" | "project" | "general">(
//     "all",
//   );
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [dateFrom, setDateFrom] = useState("");
//   const [dateTo, setDateTo] = useState("");
//   const [monthFilter, setMonthFilter] = useState("");
//   const [createdByFilter, setCreatedByFilter] = useState("all");
//   const [projectCodeFilter, setProjectCodeFilter] = useState("");
//   const [vendorFilter, setVendorFilter] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pageSize, setPageSize] = useState(10);

//   const { data: invoices = [], loading } = useFirestoreQuery<InvoiceRequest>(
//     `Panels/${PANEL_ID}/invoiceRequests`,
//   );

//   const { data: expenseSheets = [] } = useFirestoreQuery<any>(
//     `Panels/${PANEL_ID}/expenseSheets`,
//   );

//   const { data: purchaseOrders = [] } = useFirestoreQuery<any>(
//     `Panels/${PANEL_ID}/purchaseOrders`,
//   );

//   const { data: users = [] } = useFirestoreQuery<any>("users");

//   const { data: panelUsers = [] } = useFirestoreQuery<any>(
//     `Panels/${PANEL_ID}/users`,
//   );

//   const CREATE_PO_ROUTE = "/create-po";

//   function getRequestType(invoice: any): "general" | "project" {
//     const rawType = String(
//       invoice?.invoiceType || invoice?.type || "",
//     ).toLowerCase();

//     if (rawType === "project") return "project";
//     if (rawType === "general") return "general";

//     return invoice?.clientName ||
//       invoice?.project ||
//       invoice?.projectName ||
//       invoice?.projectCode
//       ? "project"
//       : "general";
//   }

//   function isProjectRequest(invoice: any): boolean {
//     return getRequestType(invoice) === "project";
//   }

//   function getLinkedPO(invoice: any): any | null {
//     const requestId = String(invoice?.requestId || "").trim();
//     const invoiceDocId = String(invoice?.id || "").trim();
//     const estimateId = String(invoice?.estimateId || "").trim();
//     const estimateNumber = String(
//       invoice?.estimateNumber ||
//         invoice?.estimateNo ||
//         invoice?.estimateValue ||
//         invoice?.selectedEstimate ||
//         invoice?.selectEstimate ||
//         "",
//     ).trim();

//     return (
//       purchaseOrders.find((po: any) => {
//         const poRequestDocLinks = [
//           po?.invoiceRequestId,
//           po?.linkedInvoiceId,
//           po?.sourceInvoiceId,
//           po?.budgetRequestDocId,
//           po?.sourceBudgetRequestId,
//           po?.requestDocId,
//           po?.invoiceId,
//         ]
//           .filter(Boolean)
//           .map((value) => String(value).trim());

//         const poRequestIdLinks = [
//           po?.requestId,
//           po?.budgetRequestId,
//           po?.linkedRequestId,
//           po?.sourceRequestId,
//           po?.invoiceNumber,
//           po?.budgetRequestNumber,
//         ]
//           .filter(Boolean)
//           .map((value) => String(value).trim());

//         const poEstimateLinks = [
//           po?.estimateId,
//           po?.estimateNumber,
//           po?.estimateNo,
//           po?.selectedEstimate,
//         ]
//           .filter(Boolean)
//           .map((value) => String(value).trim());

//         return (
//           Boolean(invoiceDocId && poRequestDocLinks.includes(invoiceDocId)) ||
//           Boolean(requestId && poRequestIdLinks.includes(requestId)) ||
//           Boolean(estimateId && poEstimateLinks.includes(estimateId)) ||
//           Boolean(estimateNumber && poEstimateLinks.includes(estimateNumber))
//         );
//       }) || null
//     );
//   }

//   function hasPOAlready(invoice: any): boolean {
//     const status = normalizeText(invoice?.status);
//     const poStatus = normalizeText(
//       invoice?.poStatus || invoice?.purchaseOrderStatus,
//     );

//     const statusSaysPOCreated = [
//       "po_created",
//       "po_submitted",
//       "po_approved",
//       "po_issued",
//       "ready_for_payment",
//     ].includes(status);

//     const poStatusSaysCreated = [
//       "created",
//       "submitted",
//       "approved",
//       "issued",
//       "ready_for_payment",
//     ].includes(poStatus);

//     const hasDirectPOFields = Boolean(
//       invoice?.poSubmitted ||
//         invoice?.poCreated ||
//         invoice?.purchaseOrderCreated ||
//         invoice?.purchaseOrderSubmitted ||
//         invoice?.poId ||
//         invoice?.poNumber ||
//         invoice?.poDocId ||
//         invoice?.purchaseOrderId ||
//         invoice?.purchaseOrderNumber ||
//         invoice?.poCreatedAt ||
//         invoice?.purchaseOrderCreatedAt,
//     );

//     return Boolean(
//       statusSaysPOCreated ||
//         poStatusSaysCreated ||
//         hasDirectPOFields ||
//         getLinkedPO(invoice),
//     );
//   }

//   function hasPaymentReleased(invoice: any): boolean {
//     return isPaymentFullyReleased(invoice);
//   }

//   function hasAnyPaymentRelease(invoice: any): boolean {
//     return (
//       getTotalReleasedAmount(invoice) > 0 ||
//       getPaymentReleaseHistory(invoice).length > 0
//     );
//   }

//   function getExpenseAmount(invoice: any): number {
//     return safeNumber(
//       invoice?.approvedAmount || invoice?.totalAmount || invoice?.amount,
//     );
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
//     if (!userProfile || userProfile.role !== "operation") return false;

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
//     const vendorName =
//       request.vendorName ||
//       request.supplierName ||
//       getFirstVendorName(request) ||
//       request.clientName ||
//       "";
//     const amount = getExpenseAmount(request);

//     return {
//       ...request,
//       invoiceNumber: request.requestId,
//       linkedRequestId: request.requestId,
//       budgetRequestId: request.requestId,
//       invoiceRequestId: request.id,
//       linkedInvoiceId: request.id,
//       sourceInvoiceId: request.id,
//       sourceType: "budget_request",
//       approvalRequired: false,
//       requiresApproval: false,
//       adminApprovalRequired: false,
//       autoApproved: true,
//       autoApprovedReason:
//         "Created from approved budget request. No further approval required.",
//       expenseStatus: "submitted",
//       status: "submitted",
//       invoiceType: requestType,
//       requestType,
//       amount,
//       totalAmount: amount,
//       approvedAmount: amount,
//       vendorName,
//       supplierName: request.supplierName || vendorName,
//       clientName: request.clientName || "",
//       projectName,
//       project: projectName,
//       projectCode: request.projectCode || "",
//       poId: request.poId || "",
//       poNumber: request.poNumber || "",
//       dueDate: new Date(),
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
//     } catch (error: any) {
//       console.error("Failed to mark expense as submitted:", error);
//       toast({
//         title: "Expense submitted",
//         description:
//           "Expense was submitted, but the request status could not be updated.",
//       });
//     } finally {
//       setIsExpenseModalOpen(false);
//       setSelectedInvoice(null);
//       localStorage.removeItem("submitExpenseFromBudgetRequest");
//       localStorage.removeItem("expenseSheetSource");
//     }
//   }

//   async function handlePaymentReleased() {
//     // PaymentReleaseModal already updates the request with the latest partial/full
//     // release totals. Do not overwrite it here, otherwise partial releases would be
//     // forced into the final payment_released state.
//     toast({
//       title: "Payment release saved",
//       description: "The payment release history has been updated successfully.",
//     });

//     setIsPaymentModalOpen(false);
//     setSelectedInvoice(null);
//   }

//   function getFirstVendorName(invoice: any): string {
//     const lineItems = Array.isArray(invoice?.lineItems)
//       ? invoice.lineItems
//       : [];
//     const approvedItems = Array.isArray(invoice?.approvalItems)
//       ? invoice.approvalItems
//       : [];
//     const allItems = [...approvedItems, ...lineItems];

//     const matchedItem = allItems.find(
//       (item: any) =>
//         item?.vendor ||
//         item?.vendorName ||
//         item?.supplier ||
//         item?.supplierName ||
//         item?.original?.vendor ||
//         item?.original?.supplier,
//     );

//     return (
//       matchedItem?.vendor ||
//       matchedItem?.vendorName ||
//       matchedItem?.supplier ||
//       matchedItem?.supplierName ||
//       matchedItem?.original?.vendor ||
//       matchedItem?.original?.supplier ||
//       ""
//     );
//   }

//   function getVendorFilterText(invoice: any): string {
//     return getFirstTextValue([
//       invoice?.vendorName,
//       invoice?.supplierName,
//       getFirstVendorName(invoice),
//     ]);
//   }

//   function handleCreatePO(invoice: InvoiceRequest) {
//     const request: any = invoice;

//     localStorage.setItem(
//       "createPOFromBudgetRequest",
//       JSON.stringify({
//         invoiceRequestId: request.id,
//         budgetRequestDocId: request.id,
//         budgetRequestId: request.requestId,
//         requestId: request.requestId,
//         invoiceType: getRequestType(request),
//         sourceType: "budget_request",
//         returnToBudgetRequests: true,
//         updateBudgetRequestAfterPO: true,

//         estimateId: request.estimateId || "",
//         estimateNumber:
//           request.estimateNumber ||
//           request.estimateNo ||
//           request.estimateValue ||
//           request.selectedEstimate ||
//           request.selectEstimate ||
//           "",

//         clientName: request.clientName || "",
//         projectName: request.projectName || request.project || "",
//         project: request.project || request.projectName || "",
//         projectCode: request.projectCode || "",
//         title: request.title || request.subject || "",
//         subject: request.subject || "",
//         message: request.message || "",

//         supplierId: request.supplierId || request.vendorId || "",
//         supplierName:
//           request.supplierName ||
//           request.vendorName ||
//           getFirstVendorName(request),
//         vendorName:
//           request.vendorName ||
//           request.supplierName ||
//           getFirstVendorName(request),

//         totalAmount: Number(request.totalAmount || 0),
//         approvedAmount: Number(
//           request.approvedAmount || request.totalAmount || 0,
//         ),

//         approvalItems: request.approvalItems || [],
//         lineItems: request.lineItems || [],
//         items: request.items || request.lineItems || [],
//       }),
//     );

//     setLocation(CREATE_PO_ROUTE);
//   }

//   async function handleApprove(invoice: InvoiceRequest) {
//     if (!userProfile) return;

//     const roleKey = getRoleKey(userProfile.role);
//     const status = normalizeText(invoice.status);
//     const approvalHistory = Array.isArray((invoice as any).approvalHistory)
//       ? (invoice as any).approvalHistory
//       : [];

//     let newStatus = status;
//     let currentApprover = String((invoice as any).currentApprover || "");

//     const updatePayload: Record<string, any> = {
//       approvalHistory: [
//         ...approvalHistory,
//         {
//           approver:
//             userProfile.displayName ||
//             (userProfile as any)?.name ||
//             userProfile.email ||
//             roleKey,
//           approverRole: roleKey,
//           action: "approved",
//           timestamp: new Date(),
//           notes: "",
//         },
//       ],
//       returnedToCreator: false,
//       needsCreatorRevision: false,
//       returnedToRole: "",
//       returnedToRoleLabel: "",
//       updatedAt: serverTimestamp(),
//     };

//     if (isAdminRole(roleKey) && isWaitingForAdminApproval(invoice)) {
//       newStatus = "pending_finance";
//       currentApprover = "finance";
//       updatePayload.adminApprovedAt = serverTimestamp();
//       updatePayload.adminApprovedBy =
//         userProfile.displayName || userProfile.email || "";
//       updatePayload.adminApprovedById =
//         userProfile.id ||
//         (userProfile as any)?.uid ||
//         (userProfile as any)?.userId ||
//         userProfile.email ||
//         "";
//     } else if (isFinanceApproverRole(roleKey) && status === "pending_finance") {
//       newStatus = "approved";
//       currentApprover = "";
//       updatePayload.financeApprovedAt = serverTimestamp();
//       updatePayload.financeApprovedBy =
//         userProfile.displayName || userProfile.email || "";
//       updatePayload.financeApprovedById =
//         userProfile.id ||
//         (userProfile as any)?.uid ||
//         (userProfile as any)?.userId ||
//         userProfile.email ||
//         "";
//       updatePayload.approvedAt = serverTimestamp();
//     } else {
//       toast({
//         title: "Action not allowed",
//         description:
//           "This request is not currently assigned to your approval stage.",
//         variant: "destructive",
//       });
//       return;
//     }

//     try {
//       await updateDoc(
//         doc(db, "Panels", PANEL_ID, "invoiceRequests", invoice.id),
//         {
//           ...updatePayload,
//           status: newStatus,
//           currentApprover,
//         },
//       );

//       toast({
//         title: "Success",
//         description: "Budget request approved successfully",
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

//   async function handleReject(
//     invoice: InvoiceRequest,
//     rejectionComment: string,
//   ) {
//     if (!userProfile) return;

//     try {
//       setRejectionLoading(true);

//       const roleKey = getRoleKey(userProfile.role);
//       const ownerId = getBudgetRequestOwnerId(invoice);
//       const approvalHistory = Array.isArray((invoice as any).approvalHistory)
//         ? (invoice as any).approvalHistory
//         : [];

//       const returnedToRole = getBudgetRequestOwnerRole(invoice);
//       const returnedToRoleLabel = formatRoleLabel(returnedToRole);

//       await updateDoc(
//         doc(db, "Panels", PANEL_ID, "invoiceRequests", invoice.id),
//         {
//           status: "rejected",
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
//               approverRole: roleKey,
//               action: "rejected",
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
//           returnedToRoleLabel || "the original role"
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

//   function getStatusBadgeColor(status: string, invoice?: any): string {
//     if (invoice && wasReturnedToCreator(invoice)) {
//       return "border-red-200 bg-red-50 text-red-700";
//     }

//     switch (status) {
//       case "approved":
//       case "payment_released":
//       case "expense_submitted":
//       case "expense_completed":
//         return "border-green-200 bg-green-50 text-green-700";
//       case "rejected":
//       case "returned_to_creator":
//       case "changes_requested":
//         return "border-red-200 bg-red-50 text-red-700";
//       case "pending_operational_admin":
//       case "pending_main_admin":
//       case "pending_admin":
//       case "pending_finance":
//         return "border-amber-200 bg-amber-50 text-amber-700";
//       case "payment_partially_released":
//         return "border-blue-200 bg-blue-50 text-blue-700";
//       default:
//         return "border-slate-200 bg-slate-50 text-slate-700";
//     }
//   }

//   function getTypeBadgeColor(type: "general" | "project") {
//     return type === "project"
//       ? "border-indigo-200 bg-indigo-50 text-indigo-700"
//       : "border-slate-200 bg-slate-50 text-slate-700";
//   }

//   function getCurrentStep(invoice: InvoiceRequest): string {
//     const status = normalizeText(invoice.status || "");

//     if (
//       (invoice as any).expenseSubmitted ||
//       status === "expense_submitted" ||
//       hasExpenseSheet(invoice)
//     ) {
//       return "Expense Submitted / No Approval Required";
//     }

//     if (hasPaymentReleased(invoice)) {
//       return "Payment Released / Ready for Expense";
//     }

//     if (hasPartialPaymentReleased(invoice)) {
//       return `Partial Payment Released / Remaining Rs ${formatPKR(
//         getRemainingPaymentBalance(invoice),
//       )}`;
//     }

//     if (isProjectRequest(invoice) && hasPOAlready(invoice)) {
//       return "PO Created / Ready for Payment";
//     }

//     if (wasReturnedToCreator(invoice)) {
//       return `${getBudgetRequestStatusLabel(invoice)} / Waiting for Resubmission`;
//     }

//     switch (status) {
//       case "pending_operational_admin":
//       case "pending_main_admin":
//       case "pending_admin":
//         return "Admin Approval";
//       case "pending_finance":
//         return "Finance Approval";
//       case "approved":
//         return isProjectRequest(invoice) ? "Ready for PO" : "Ready for Payment";
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
//         return "Payment Released / Ready for Expense";
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
//     if (!userProfile) return false;

//     const roleKey = getRoleKey(userProfile.role);

//     if (isAdminRole(roleKey)) {
//       return isWaitingForAdminApproval(invoice);
//     }

//     if (isFinanceApproverRole(roleKey)) {
//       return normalizeText(invoice.status) === "pending_finance";
//     }

//     return false;
//   }

//   function canEdit(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;

//     if (!isOwnBudgetRequest(invoice)) return false;

//     if (hasAdminApprovedBudgetRequest(invoice)) return false;

//     const status = normalizeText(invoice.status);

//     return (
//       wasReturnedToCreator(invoice) ||
//       status === "draft" ||
//       status === "pending_main_admin" ||
//       status === "pending_admin" ||
//       status === "pending_operational_admin" ||
//       status === ""
//     );
//   }

//   function getEditableInvoice(invoice: InvoiceRequest): InvoiceRequest {
//     if (hasAdminApprovedBudgetRequest(invoice)) return invoice;

//     if (!wasReturnedToCreator(invoice)) return invoice;

//     return {
//       ...(invoice as any),
//       status: "pending_main_admin",
//       currentApprover: "main_admin",
//       returnedToCreator: false,
//       needsCreatorRevision: false,
//       returnedToRole: "",
//       returnedToRoleLabel: "",
//       resubmittedAt: new Date(),
//     } as InvoiceRequest;
//   }

//   function canReleasePayment(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;

//     const isFinanceUser = isFinanceApproverRole(userProfile.role);
//     if (!isFinanceUser) return false;

//     if (hasPaymentReleased(invoice)) return false;

//     if (getRemainingPaymentBalance(invoice) <= 0.009) return false;

//     if (
//       (invoice as any).expenseSubmitted ||
//       String(invoice.status) === "expense_submitted"
//     ) {
//       return false;
//     }

//     const status = normalizeText(invoice.status);
//     const readyForPayment = [
//       "approved",
//       "po_created",
//       "po_submitted",
//       "po_approved",
//       "po_issued",
//       "ready_for_payment",
//       "payment_partially_released",
//     ].includes(status);

//     if (!readyForPayment) return false;

//     if (!isProjectRequest(invoice)) return true;

//     return hasPOAlready(invoice);
//   }

//   function canCreatePO(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;

//     return (
//       isFinanceApproverRole(userProfile.role) &&
//       normalizeText(invoice.status) === "approved" &&
//       isProjectRequest(invoice) &&
//       !hasPOAlready(invoice) &&
//       !hasPaymentReleased(invoice)
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

//     if (!expenseSheets) return null;

//     const expenseSheet = expenseSheets.find((expense: any) =>
//       isExpenseLinkedToRequest(expense, invoice),
//     );

//     return expenseSheet?.status || expenseSheet?.expenseStatus || null;
//   }

//   const canCreateInvoices = canRoleCreateBudgetRequest(currentUserRole);

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

//       if (!lookupKey) continue;

//       const matchedUser = usersByLookup.get(lookupKey);
//       if (matchedUser) return matchedUser;
//     }

//     return null;
//   }

//   function canCurrentUserSeeAllBudgetRequests() {
//     const userRecord = getCurrentUserRecordFromUsersCollection();
//     const effectiveRole = getRoleKey(currentUserRole || userRecord?.role);

//     if (canRoleSeeAllBudgetRequests(effectiveRole)) return true;

//     if (!isOperationRole(effectiveRole)) return false;

//     return Boolean(
//       (userProfile as any)?.canViewAllBudgetRequests ||
//         userRecord?.canViewAllBudgetRequests,
//     );
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

//         if (lookupKey) map.set(lookupKey, user);
//       });
//     });

//     return map;
//   }, [users, panelUsers]);

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
//     if (directRole) return directRole;

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

//       if (!lookupKey) continue;

//       const matchedUser = usersByLookup.get(lookupKey);
//       const matchedRole = getUserRoleLabel(matchedUser);

//       if (matchedRole) return matchedRole;
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

//     if (isCurrentUserOwner) return getRoleKey(userProfile?.role);

//     return "";
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

//     return getStatusLabel(invoice?.status || "", invoice);
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

//       if (!name) return;

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

//         if (lookupKey && !map.has(lookupKey)) map.set(lookupKey, name);
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

//     if (directName) return directName;

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

//       if (!lookupKey) continue;

//       const overrideName = getSafeDisplayText(
//         CREATOR_NAME_OVERRIDES[rawKey] || CREATOR_NAME_OVERRIDES[lookupKey],
//       );

//       if (overrideName) return overrideName;

//       const nameFromAnotherRequest = getSafeDisplayText(
//         creatorNamesByLookup.get(lookupKey),
//       );

//       if (nameFromAnotherRequest) return nameFromAnotherRequest;

//       const matchedUser = usersByLookup.get(lookupKey);
//       const matchedName = getSafeDisplayText(getUserDisplayName(matchedUser));

//       if (matchedName) return matchedName;
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

//     const ownerLookupValues = lookupValues
//       .map((value) =>
//         String(value || "")
//           .trim()
//           .toLowerCase(),
//       )
//       .filter(Boolean);

//     const isCurrentUserOwner = ownerLookupValues.some((ownerKey) =>
//       currentUserLookupValues.includes(ownerKey),
//     );

//     if (isCurrentUserOwner) {
//       const currentUserName = getFirstTextValue([
//         getSafeDisplayText(userProfile?.displayName),
//         getSafeDisplayText((userProfile as any)?.name),
//         getSafeDisplayText((userProfile as any)?.fullName),
//         getSafeDisplayText(userProfile?.email),
//       ]);

//       if (currentUserName) return currentUserName;
//     }

//     const emailFallback = getFirstTextValue([
//       getSafeDisplayText(invoice?.createdByEmail),
//       getSafeDisplayText(invoice?.submittedByEmail),
//       getSafeDisplayText(invoice?.email),
//     ]);

//     if (emailFallback) return emailFallback;

//     return "Unknown User";
//   }

//   const visibleInvoicesForFilterOptions = useMemo(() => {
//     return (invoices || []).filter((invoice: any) => {
//       const canSeeAllRequests = canCurrentUserSeeAllBudgetRequests();
//       return canSeeAllRequests || isOwnBudgetRequest(invoice);
//     });
//   }, [invoices, userProfile, currentUserRole, usersByLookup]);

//   const createdByOptions = useMemo(() => {
//     const names = Array.from(
//       new Set(
//         visibleInvoicesForFilterOptions
//           .map((invoice: any) => getCreatedByName(invoice))
//           .filter((name) => String(name || "").trim()),
//       ),
//     );

//     return names.sort((a, b) => a.localeCompare(b));
//   }, [
//     visibleInvoicesForFilterOptions,
//     usersByLookup,
//     creatorNamesByLookup,
//     userProfile,
//   ]);

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

//   const statusOptions = useMemo(() => {
//     const uniqueStatuses = Array.from(
//       new Set(
//         (invoices || []).map((invoice) => invoice.status).filter(Boolean),
//       ),
//     );

//     return uniqueStatuses.sort();
//   }, [invoices]);

//   const filteredInvoices = useMemo(() => {
//     const search = normalizeText(searchTerm);
//     const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
//     const toDate = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

//     return (invoices || []).filter((invoice: any) => {
//       const requestType = getRequestType(invoice);
//       const requestDate = getRequestDate(invoice);
//       const requestDateInputValue = getDateInputValue(requestDate);
//       const createdByName = getCreatedByName(invoice);
//       const projectCode = String(invoice?.projectCode || "").trim();
//       const vendorName = getVendorFilterText(invoice);

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
//           createdByName,
//           (invoice as any).createdByName,
//           (invoice as any).submittedByName,
//           (invoice as any).requestedByName,
//           (invoice as any).createdByEmail,
//           (invoice as any).submittedByEmail,
//         ].join(" "),
//       );

//       const matchesSearch = !search || haystack.includes(search);
//       const matchesType = typeFilter === "all" || requestType === typeFilter;
//       const matchesStatus =
//         statusFilter === "all" || invoice.status === statusFilter;
//       const matchesMonth =
//         !monthFilter || requestDateInputValue.startsWith(monthFilter);
//       const matchesCreatedBy =
//         createdByFilter === "all" ||
//         normalizeText(createdByName) === normalizeText(createdByFilter);
//       const matchesProjectCode =
//         !normalizeText(projectCodeFilter) ||
//         normalizeText(projectCode).includes(normalizeText(projectCodeFilter));
//       const matchesVendor =
//         !normalizeText(vendorFilter) ||
//         normalizeText(vendorName).includes(normalizeText(vendorFilter));
//       const matchesFrom = !fromDate || (requestDate && requestDate >= fromDate);
//       const matchesTo = !toDate || (requestDate && requestDate <= toDate);
//       const canSeeAllRequests = canCurrentUserSeeAllBudgetRequests();
//       const matchesOwnership = canSeeAllRequests || isOwnBudgetRequest(invoice);

//       return (
//         matchesOwnership &&
//         matchesSearch &&
//         matchesType &&
//         matchesStatus &&
//         matchesMonth &&
//         matchesCreatedBy &&
//         matchesProjectCode &&
//         matchesVendor &&
//         matchesFrom &&
//         matchesTo
//       );
//     });
//   }, [
//     dateFrom,
//     dateTo,
//     invoices,
//     monthFilter,
//     searchTerm,
//     statusFilter,
//     typeFilter,
//     createdByFilter,
//     projectCodeFilter,
//     vendorFilter,
//     userProfile,
//     currentUserRole,
//     usersByLookup,
//     creatorNamesByLookup,
//   ]);

//   const summary = useMemo(() => {
//     const totalAmount = filteredInvoices.reduce(
//       (sum, invoice: any) => sum + safeNumber(invoice.totalAmount),
//       0,
//     );

//     const projectCount = filteredInvoices.filter(
//       (invoice) => getRequestType(invoice) === "project",
//     ).length;

//     const generalCount = filteredInvoices.filter(
//       (invoice) => getRequestType(invoice) === "general",
//     ).length;

//     const approvedCount = filteredInvoices.filter(
//       (invoice) => invoice.status === "approved",
//     ).length;

//     return { totalAmount, projectCount, generalCount, approvedCount };
//   }, [filteredInvoices]);

//   const sortedInvoices = useMemo(() => {
//     return [...filteredInvoices].sort((a, b) =>
//       compareBudgetRequestsForTable(
//         a,
//         b,
//         currentUserRole,
//         canReleasePayment,
//       ),
//     );
//   }, [filteredInvoices, currentUserRole, purchaseOrders, userProfile]);

//   const totalPages = Math.max(1, Math.ceil(sortedInvoices.length / pageSize));
//   const startIndex = (currentPage - 1) * pageSize;
//   const paginatedInvoices = sortedInvoices.slice(
//     startIndex,
//     startIndex + pageSize,
//   );
//   const showingFrom = sortedInvoices.length === 0 ? 0 : startIndex + 1;
//   const showingTo = Math.min(startIndex + pageSize, sortedInvoices.length);

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
//     pageSize,
//   ]);

//   useEffect(() => {
//     if (currentPage > totalPages) setCurrentPage(totalPages);
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
//     setPageSize(10);
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
//             <p className="mt-2 max-w-2xl text-sm text-slate-500">
//               Review project and general budget requests, send requests through
//               Admin and Finance approval, release payments, or create POs.
//             </p>
//           </div>

//           {canCreateInvoices && (
//             <Button
//               className="h-11 rounded-2xl px-5 shadow-sm"
//               onClick={() => {
//                 setSelectedInvoice(null);
//                 setIsInvoiceModalOpen(true);
//               }}
//               data-testid="button-new-invoice-request"
//             >
//               + New Request
//             </Button>
//           )}
//         </div>

//         <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
//                 Filtered Value
//               </p>
//               <p className="mt-3 text-2xl font-semibold text-slate-950">
//                 Rs {formatPKR(summary.totalAmount)}
//               </p>
//               <p className="mt-1 text-xs text-slate-400">
//                 Approved waiting: {summary.approvedCount}
//               </p>
//             </CardContent>
//           </Card>
//         </div>

//         <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//           <CardContent className="space-y-4 p-5">
//             <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
//               <div className="xl:col-span-2">
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Search
//                 </label>
//                 <input
//                   value={searchTerm}
//                   onChange={(event) => setSearchTerm(event.target.value)}
//                   placeholder="Request ID, client, project, title..."
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Created By
//                 </label>
//                 <select
//                   value={createdByFilter}
//                   onChange={(event) => setCreatedByFilter(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 >
//                   <option value="all">All Creators</option>
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
//                   placeholder="Enter project code..."
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Request Type
//                 </label>
//                 <select
//                   value={typeFilter}
//                   onChange={(event) =>
//                     setTypeFilter(
//                       event.target.value as "all" | "project" | "general",
//                     )
//                   }
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 >
//                   <option value="all">All Types</option>
//                   <option value="project">Project</option>
//                   <option value="general">General</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Status
//                 </label>
//                 <select
//                   value={statusFilter}
//                   onChange={(event) => setStatusFilter(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 >
//                   <option value="all">All Statuses</option>
//                   {statusOptions.map((status) => (
//                     <option key={status} value={status}>
//                       {getStatusLabel(status)}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Month
//                 </label>
//                 <input
//                   type="month"
//                   value={monthFilter}
//                   onChange={(event) => setMonthFilter(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>
//             </div>

//             <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Vendor
//                 </label>
//                 <input
//                   value={vendorFilter}
//                   onChange={(event) => setVendorFilter(event.target.value)}
//                   placeholder="Enter vendor name..."
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   From Date
//                 </label>
//                 <input
//                   type="date"
//                   value={dateFrom}
//                   onChange={(event) => setDateFrom(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   To Date
//                 </label>
//                 <input
//                   type="date"
//                   value={dateTo}
//                   onChange={(event) => setDateTo(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Rows
//                 </label>
//                 <select
//                   value={pageSize}
//                   onChange={(event) => setPageSize(Number(event.target.value))}
//                   className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
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

//         <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm">
//           <CardContent className="p-0">
//             <div className="overflow-x-auto">
//               <table className="w-full min-w-[1400px]">
//                 <thead>
//                   <tr className="border-b border-slate-200 bg-slate-50/80">
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Request ID
//                     </th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Type
//                     </th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Client / Title
//                     </th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Project
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
//                       <td colSpan={11} className="px-6 py-12 text-center">
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
//                         type === "general"
//                           ? (invoice as any).title ||
//                             (invoice as any).subject ||
//                             "General Request"
//                           : (invoice as any).clientName || "-";

//                       const projectName =
//                         type === "project"
//                           ? (invoice as any).projectName ||
//                             (invoice as any).project ||
//                             (invoice as any).projectCode ||
//                             "-"
//                           : "-";

//                       const createdByName = getCreatedByName(invoice);
//                       const approvedPaymentAmount =
//                         getApprovedPaymentAmount(invoice);
//                       const totalReleasedAmount =
//                         getTotalReleasedAmount(invoice);
//                       const remainingPaymentBalance =
//                         getRemainingPaymentBalance(invoice);
//                       const paymentHistory = getPaymentReleaseHistory(invoice);
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

//                       return (
//                         <tr
//                           key={invoice.id}
//                           className="transition hover:bg-slate-50/80"
//                         >
//                           <td
//                             className="px-5 py-4 text-sm font-semibold text-slate-900"
//                             data-testid={`text-request-id-${invoice.id}`}
//                           >
//                             {invoice.requestId || "-"}
//                           </td>

//                           <td className="px-5 py-4">
//                             <Badge
//                               variant="outline"
//                               className={`rounded-full px-3 py-1 ${getTypeBadgeColor(
//                                 type,
//                               )}`}
//                             >
//                               {type === "project" ? "Project" : "General"}
//                             </Badge>
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-700">
//                             <div className="font-medium text-slate-900">
//                               {displayClientOrTitle}
//                             </div>
//                             {(invoice as any).projectCode &&
//                               type === "project" && (
//                                 <div className="mt-1 text-xs text-slate-400">
//                                   Code: {(invoice as any).projectCode}
//                                 </div>
//                               )}
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-600">
//                             {projectName}
//                           </td>

//                           <td
//                             className="px-5 py-4 text-sm font-medium text-slate-700"
//                             data-testid={`text-created-by-${invoice.id}`}
//                           >
//                             {createdByName}
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-600">
//                             {formatRequestDate(invoice)}
//                           </td>

//                           <td className="px-5 py-4 text-sm font-semibold text-slate-900">
//                             Rs{" "}
//                             {formatPKR(
//                               approvedPaymentAmount || invoice.totalAmount,
//                             )}
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-600">
//                             <div className="space-y-2">
//                               <div className="flex items-center justify-between gap-3">
//                                 <span className="text-xs text-slate-500">
//                                   Released
//                                 </span>
//                                 <span className="font-semibold text-slate-900">
//                                   Rs {formatPKR(totalReleasedAmount)}
//                                 </span>
//                               </div>
//                               <div className="h-2 overflow-hidden rounded-full bg-slate-100">
//                                 <div
//                                   className="h-full rounded-full bg-slate-950"
//                                   style={{
//                                     width: `${paymentProgressPercent}%`,
//                                   }}
//                                 />
//                               </div>
//                               <div className="flex items-center justify-between gap-3">
//                                 <span className="text-xs text-slate-500">
//                                   Balance
//                                 </span>
//                                 <span className="font-semibold text-slate-900">
//                                   Rs {formatPKR(remainingPaymentBalance)}
//                                 </span>
//                               </div>
//                             </div>
//                           </td>

//                           <td className="px-5 py-4">
//                             <Badge
//                               variant="outline"
//                               className={`rounded-full px-3 py-1 ${getStatusBadgeColor(
//                                 invoice.status,
//                                 invoice,
//                               )}`}
//                             >
//                               {getBudgetRequestStatusLabel(invoice)}
//                             </Badge>
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-500">
//                             {getCurrentStep(invoice)}
//                           </td>

//                           <td className="px-5 py-4">
//                             <div className="flex flex-wrap gap-2">
//                               <Button
//                                 variant="outline"
//                                 size="sm"
//                                 className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
//                                 onClick={() => openDetailsModal(invoice)}
//                                 data-testid={`button-view-details-${invoice.id}`}
//                               >
//                                 View
//                               </Button>

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
//                                           "This request can no longer be edited because it has already been approved by Admin.",
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

//                               {canReleasePayment(invoice) && (
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   className="rounded-xl border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
//                                   onClick={() => {
//                                     const linkedPO = getLinkedPO(invoice);

//                                     setSelectedInvoice({
//                                       ...invoice,
//                                       invoiceNumber: invoice.requestId,
//                                       vendorName:
//                                         (invoice as any).vendorName ||
//                                         (invoice as any).supplierName ||
//                                         (invoice as any).clientName,
//                                       amount: remainingPaymentBalance,
//                                       approvedAmount: approvedPaymentAmount,
//                                       totalApprovedAmount:
//                                         approvedPaymentAmount,
//                                       totalReleasedAmount,
//                                       remainingReleaseAmount:
//                                         remainingPaymentBalance,
//                                       dueDate: new Date(),
//                                       poId:
//                                         (invoice as any).poId ||
//                                         (invoice as any).poDocId ||
//                                         linkedPO?.id ||
//                                         linkedPO?.poId ||
//                                         linkedPO?.poDocId ||
//                                         "",
//                                       poNumber:
//                                         (invoice as any).poNumber ||
//                                         (invoice as any).purchaseOrderNumber ||
//                                         linkedPO?.poNumber ||
//                                         linkedPO?.purchaseOrderNumber ||
//                                         "",
//                                     } as any);
//                                     setIsPaymentModalOpen(true);
//                                   }}
//                                   data-testid={`button-release-payment-${invoice.id}`}
//                                 >
//                                   Release Payment
//                                 </Button>
//                               )}

//                               {hasAnyPaymentRelease(invoice) && (
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
//                                   History ({paymentHistory.length})
//                                 </Button>
//                               )}

//                               {canCreatePO(invoice) && (
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   className="rounded-xl border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
//                                   onClick={() => handleCreatePO(invoice)}
//                                   data-testid={`button-create-po-${invoice.id}`}
//                                 >
//                                   Create PO
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

//               <div className="flex items-center gap-2">
//                 <Button
//                   type="button"
//                   variant="outline"
//                   size="sm"
//                   className="rounded-xl border-slate-200"
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
//                     type="button"
//                     variant={page === currentPage ? "default" : "outline"}
//                     size="sm"
//                     className="h-9 w-9 rounded-xl p-0"
//                     onClick={() => setCurrentPage(page)}
//                   >
//                     {page}
//                   </Button>
//                 ))}

//                 <Button
//                   type="button"
//                   variant="outline"
//                   size="sm"
//                   className="rounded-xl border-slate-200"
//                   disabled={currentPage === totalPages}
//                   onClick={() =>
//                     setCurrentPage((page) => Math.min(totalPages, page + 1))
//                   }
//                 >
//                   Next
//                 </Button>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       <InvoiceRequestModal
//         isOpen={isInvoiceModalOpen}
//         onClose={() => {
//           setIsInvoiceModalOpen(false);
//           setSelectedInvoice(null);
//         }}
//         onSuccess={() => {
//           setIsInvoiceModalOpen(false);
//           setSelectedInvoice(null);
//         }}
//         editingInvoice={selectedInvoice}
//       />

//       <PaymentReleaseModal
//         isOpen={isPaymentModalOpen}
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
//       />

//       {isPaymentHistoryModalOpen && paymentHistoryInvoice && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
//           <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-xl">
//             <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-slate-200 bg-white/95 p-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
//               <div>
//                 <h2 className="text-lg font-semibold text-slate-950">
//                   Payment Release History
//                 </h2>
//                 <p className="mt-1 text-sm text-slate-500">
//                   Request ID: {paymentHistoryInvoice.requestId || "-"}
//                 </p>
//               </div>

//               <Button
//                 type="button"
//                 variant="outline"
//                 className="rounded-2xl border-slate-200"
//                 onClick={() => {
//                   setIsPaymentHistoryModalOpen(false);
//                   setPaymentHistoryInvoice(null);
//                 }}
//               >
//                 Close
//               </Button>
//             </div>

//             <div className="grid gap-4 border-b border-slate-100 p-5 md:grid-cols-3">
//               <div className="rounded-2xl bg-slate-50 p-4">
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                   Total Approved
//                 </p>
//                 <p className="mt-2 text-xl font-semibold text-slate-950">
//                   Rs{" "}
//                   {formatPKR(getApprovedPaymentAmount(paymentHistoryInvoice))}
//                 </p>
//               </div>
//               <div className="rounded-2xl bg-slate-50 p-4">
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                   Released So Far
//                 </p>
//                 <p className="mt-2 text-xl font-semibold text-slate-950">
//                   Rs {formatPKR(getTotalReleasedAmount(paymentHistoryInvoice))}
//                 </p>
//               </div>
//               <div className="rounded-2xl bg-slate-50 p-4">
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                   Remaining Balance
//                 </p>
//                 <p className="mt-2 text-xl font-semibold text-slate-950">
//                   Rs{" "}
//                   {formatPKR(getRemainingPaymentBalance(paymentHistoryInvoice))}
//                 </p>
//               </div>
//             </div>

//             <div className="p-5">
//               {getPaymentReleaseHistory(paymentHistoryInvoice).length === 0 ? (
//                 <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">
//                   No payment releases have been recorded yet.
//                 </div>
//               ) : (
//                 <div className="overflow-x-auto rounded-2xl border border-slate-200">
//                   <table className="w-full min-w-[850px] text-sm">
//                     <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
//                       <tr>
//                         <th className="px-4 py-3 text-left font-semibold">
//                           Date
//                         </th>
//                         <th className="px-4 py-3 text-left font-semibold">
//                           Type
//                         </th>
//                         <th className="px-4 py-3 text-left font-semibold">
//                           Method
//                         </th>
//                         <th className="px-4 py-3 text-left font-semibold">
//                           Amount
//                         </th>
//                         <th className="px-4 py-3 text-left font-semibold">
//                           Reference / Cheque
//                         </th>
//                         <th className="px-4 py-3 text-left font-semibold">
//                           Released By
//                         </th>
//                         <th className="px-4 py-3 text-left font-semibold">
//                           Notes
//                         </th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-slate-100">
//                       {[...getPaymentReleaseHistory(paymentHistoryInvoice)]
//                         .reverse()
//                         .map((entry: any, index: number) => (
//                           <tr
//                             key={
//                               entry?.id ||
//                               `${entry?.releasedAt || "release"}-${index}`
//                             }
//                           >
//                             <td className="px-4 py-3 text-slate-600">
//                               {getReleaseDateLabel(entry?.releasedAt)}
//                             </td>
//                             <td className="px-4 py-3">
//                               <Badge
//                                 variant="outline"
//                                 className="rounded-full border-slate-200 bg-slate-50 px-3 py-1 text-slate-700"
//                               >
//                                 {entry?.releaseType || "release"}
//                               </Badge>
//                             </td>
//                             <td className="px-4 py-3 text-slate-700">
//                               {getPaymentMethodLabel(entry?.paymentMethod)}
//                             </td>
//                             <td className="px-4 py-3 font-semibold text-slate-950">
//                               Rs {formatPKR(getPaymentReleaseAmount(entry))}
//                             </td>
//                             <td className="px-4 py-3 text-slate-600">
//                               <div>{entry?.transactionReference || "-"}</div>
//                               {Array.isArray(entry?.chequeNumbers) &&
//                                 entry.chequeNumbers.length > 0 && (
//                                   <div className="mt-1 text-xs text-slate-500">
//                                     Cheques: {entry.chequeNumbers.join(", ")}
//                                   </div>
//                                 )}
//                             </td>
//                             <td className="px-4 py-3 text-slate-600">
//                               {entry?.releasedByName || "-"}
//                             </td>
//                             <td className="px-4 py-3 text-slate-600">
//                               {entry?.paymentNotes || "-"}
//                             </td>
//                           </tr>
//                         ))}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

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



// import { useEffect, useMemo, useState } from "react";
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

//   // Backward compatibility for older records that only saved a single paymentDetails object.
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
//     if (text) chequeValues.push(text);
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
//   if (explicitReleasedAmount > 0) return explicitReleasedAmount;

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

// function getReleaseDateLabel(value: any) {
//   if (!value) return "-";

//   let date: Date | null = null;

//   if (value instanceof Date) date = value;
//   else if (typeof value?.toDate === "function") date = value.toDate();
//   else if (typeof value?.seconds === "number")
//     date = new Date(value.seconds * 1000);
//   else date = new Date(value);

//   if (!date || Number.isNaN(date.getTime())) return "-";

//   return date.toLocaleString("en-PK", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// }

// function getPaymentMethodLabel(method?: string) {
//   switch (method) {
//     case "cash":
//       return "Cash";
//     case "cheque":
//       return "Cheque";
//     case "bank_transfer":
//       return "Bank Transfer";
//     case "wire":
//       return "Online Transfer";
//     default:
//       return method ? formatStatus(method) : "-";
//   }
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

// function formatRoleLabel(role: any): string {
//   const roleKey = getRoleKey(role);
//   if (!roleKey) return "";

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
//     if (text) return text;
//   }
//   return "";
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
//   if (!sequenceMatch) return null;

//   const sequence = Number(sequenceMatch[1]);
//   return Number.isFinite(sequence) ? sequence : null;
// }

// function compareRequestIdsAscending(a: any, b: any): number {
//   const aSequence = getRequestIdSequence(a);
//   const bSequence = getRequestIdSequence(b);

//   if (aSequence !== null && bSequence !== null && aSequence !== bSequence) {
//     return aSequence - bSequence;
//   }

//   if (aSequence !== null && bSequence === null) return -1;
//   if (aSequence === null && bSequence !== null) return 1;

//   const aDate = getRequestDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
//   const bDate = getRequestDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
//   if (aDate !== bDate) return aDate - bDate;

//   return String(a?.id || "").localeCompare(String(b?.id || ""));
// }

// function getTableStatusSortRank(invoice: any): number {
//   const status = normalizeText(invoice?.status);

//   if (isWaitingForAdminApproval(invoice) && !wasReturnedToCreator(invoice)) {
//     return 0;
//   }

//   if (
//     wasReturnedToCreator(invoice) ||
//     ["rejected", "returned_to_creator", "changes_requested"].includes(status)
//   ) {
//     return 1;
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
//     return 2;
//   }

//   if (status === "pending_finance") {
//     return 3;
//   }

//   if (status.startsWith("pending")) {
//     return 4;
//   }

//   if (
//     ["payment_released", "expense_submitted", "expense_completed"].includes(
//       status,
//     )
//   ) {
//     return 5;
//   }

//   return 6;
// }

// type ReleasePaymentPriorityPredicate = (invoice: any) => boolean;

// /**
//  * Lightweight fallback used by dashboards or other request views that do not
//  * have access to the full purchase-order collection. The request-list page
//  * passes its richer canReleasePayment predicate so linked POs are also handled.
//  */
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

//   if (status !== "approved") return false;

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

//   if (!looksLikeProject) return true;

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

// /**
//  * Finance users use this workflow priority:
//  * 1. Requests currently waiting for Finance approval.
//  * 2. Requests ready for a full or partial payment release.
//  * 3. Requests already approved or completed by Finance.
//  * 4. Requests currently waiting for Admin approval.
//  * 5. Every other request.
//  *
//  * Apply this ranking before pagination in every Finance dashboard/list view.
//  */
// export function getFinanceTableStatusSortRank(
//   invoice: any,
//   isReleasePaymentRequest?: ReleasePaymentPriorityPredicate,
// ): number {
//   const status = normalizeText(invoice?.status);

//   // Priority 1: Finance's own outstanding approval work.
//   if (status === "pending_finance") {
//     return 0;
//   }

//   // Priority 2: Requests requiring payment-release action from Finance.
//   const needsPaymentRelease = isReleasePaymentRequest
//     ? isReleasePaymentRequest(invoice)
//     : isFinanceReleasePaymentPriorityRequest(invoice);

//   if (needsPaymentRelease) {
//     return 1;
//   }

//   // Priority 3: Requests that passed Finance approval or completed later
//   // workflow stages but do not currently require a payment-release action.
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
//       "expense_submitted",
//       "expense_completed",
//     ].includes(status)
//   ) {
//     return 2;
//   }

//   // Priority 4: Requests still assigned to an Admin approval stage.
//   if (isWaitingForAdminApproval(invoice) && !wasReturnedToCreator(invoice)) {
//     return 3;
//   }

//   // Priority 5: Rejected, returned, draft, other-role pending, and unknown
//   // workflow statuses.
//   return 4;
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

//   return compareRequestIdsAscending(a, b);
// }

// function formatRequestDate(invoice: any) {
//   const date = getRequestDate(invoice);
//   if (!date) return "-";

//   return date.toLocaleDateString("en-PK", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// }

// function getDateInputValue(date: Date | null) {
//   if (!date) return "";

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
//   if (!text) return "";
//   if (isFirebaseIdLike(text)) return "";

//   return text;
// }

// function getUserDisplayName(user: any): string {
//   return getFirstTextValue([
//     getSafeDisplayText(user?.displayName),
//     getSafeDisplayText(user?.name),
//     getSafeDisplayText(user?.fullName),
//     getSafeDisplayText(user?.userName),
//     getSafeDisplayText(user?.username),
//     getSafeDisplayText(user?.employeeName),
//     getSafeDisplayText(user?.email),
//   ]);
// }

// const CREATOR_NAME_OVERRIDES: Record<string, string> = {
//   // Example:
//   // "wVS6kzCFiYM5dFQSEZ5P7Y8SChg1": "Bilal Tariq",
// };

// function getRoleKey(role: any): string {
//   return String(role || "")
//     .toLowerCase()
//     .trim()
//     .replace(/[\s-]+/g, "_");
// }

// function isAdminRole(role: any): boolean {
//   const roleKey = getRoleKey(role);

//   return ["admin", "main_admin", "super_admin"].includes(roleKey);
// }

// function isFinanceApproverRole(role: any): boolean {
//   const roleKey = getRoleKey(role);

//   return ["finance", "financial_admin", "finance_admin"].includes(roleKey);
// }

// function isOperationRole(role: any): boolean {
//   const roleKey = getRoleKey(role);

//   return ["operation", "operations"].includes(roleKey);
// }

// function canRoleCreateBudgetRequest(role: any): boolean {
//   const roleKey = getRoleKey(role);
//   if (!roleKey) return false;

//   return !isAdminRole(roleKey);
// }

// function canRoleSeeAllBudgetRequests(role: any): boolean {
//   return isAdminRole(role) || isFinanceApproverRole(role);
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

//   if (
//     normalizedStatus === "pending_main_admin" ||
//     normalizedStatus === "pending_admin"
//   ) {
//     return "Pending Admin";
//   }

//   if (normalizedStatus === "pending_operational_admin") return "Pending Admin";
//   if (normalizedStatus === "pending_finance") return "Pending Finance";
//   if (normalizedStatus === "payment_partially_released") {
//     return "Payment Partially Released";
//   }
//   if (normalizedStatus === "rejected")
//     return getReturnedToRoleStatusLabel(invoice);

//   return formatStatus(status);
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
//   const [isPaymentHistoryModalOpen, setIsPaymentHistoryModalOpen] =
//     useState(false);
//   const [paymentHistoryInvoice, setPaymentHistoryInvoice] =
//     useState<InvoiceRequest | null>(null);
//   const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
//   const [rejectionLoading, setRejectionLoading] = useState(false);

//   const [searchTerm, setSearchTerm] = useState("");
//   const [typeFilter, setTypeFilter] = useState<"all" | "project" | "general">(
//     "all",
//   );
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [dateFrom, setDateFrom] = useState("");
//   const [dateTo, setDateTo] = useState("");
//   const [monthFilter, setMonthFilter] = useState("");
//   const [createdByFilter, setCreatedByFilter] = useState("all");
//   const [projectCodeFilter, setProjectCodeFilter] = useState("");
//   const [vendorFilter, setVendorFilter] = useState("");
//   const [chequeFilter, setChequeFilter] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pageSize, setPageSize] = useState(10);

//   const { data: invoices = [], loading } = useFirestoreQuery<InvoiceRequest>(
//     `Panels/${PANEL_ID}/invoiceRequests`,
//   );

//   const { data: expenseSheets = [] } = useFirestoreQuery<any>(
//     `Panels/${PANEL_ID}/expenseSheets`,
//   );

//   const { data: purchaseOrders = [] } = useFirestoreQuery<any>(
//     `Panels/${PANEL_ID}/purchaseOrders`,
//   );

//   const { data: users = [] } = useFirestoreQuery<any>("users");

//   const { data: panelUsers = [] } = useFirestoreQuery<any>(
//     `Panels/${PANEL_ID}/users`,
//   );

//   const CREATE_PO_ROUTE = "/create-po";

//   function getRequestType(invoice: any): "general" | "project" {
//     const rawType = String(
//       invoice?.invoiceType || invoice?.type || "",
//     ).toLowerCase();

//     if (rawType === "project") return "project";
//     if (rawType === "general") return "general";

//     return invoice?.clientName ||
//       invoice?.project ||
//       invoice?.projectName ||
//       invoice?.projectCode
//       ? "project"
//       : "general";
//   }

//   function isProjectRequest(invoice: any): boolean {
//     return getRequestType(invoice) === "project";
//   }

//   function getLinkedPO(invoice: any): any | null {
//     const requestId = String(invoice?.requestId || "").trim();
//     const invoiceDocId = String(invoice?.id || "").trim();
//     const estimateId = String(invoice?.estimateId || "").trim();
//     const estimateNumber = String(
//       invoice?.estimateNumber ||
//         invoice?.estimateNo ||
//         invoice?.estimateValue ||
//         invoice?.selectedEstimate ||
//         invoice?.selectEstimate ||
//         "",
//     ).trim();

//     return (
//       purchaseOrders.find((po: any) => {
//         const poRequestDocLinks = [
//           po?.invoiceRequestId,
//           po?.linkedInvoiceId,
//           po?.sourceInvoiceId,
//           po?.budgetRequestDocId,
//           po?.sourceBudgetRequestId,
//           po?.requestDocId,
//           po?.invoiceId,
//         ]
//           .filter(Boolean)
//           .map((value) => String(value).trim());

//         const poRequestIdLinks = [
//           po?.requestId,
//           po?.budgetRequestId,
//           po?.linkedRequestId,
//           po?.sourceRequestId,
//           po?.invoiceNumber,
//           po?.budgetRequestNumber,
//         ]
//           .filter(Boolean)
//           .map((value) => String(value).trim());

//         const poEstimateLinks = [
//           po?.estimateId,
//           po?.estimateNumber,
//           po?.estimateNo,
//           po?.selectedEstimate,
//         ]
//           .filter(Boolean)
//           .map((value) => String(value).trim());

//         return (
//           Boolean(invoiceDocId && poRequestDocLinks.includes(invoiceDocId)) ||
//           Boolean(requestId && poRequestIdLinks.includes(requestId)) ||
//           Boolean(estimateId && poEstimateLinks.includes(estimateId)) ||
//           Boolean(estimateNumber && poEstimateLinks.includes(estimateNumber))
//         );
//       }) || null
//     );
//   }

//   function hasPOAlready(invoice: any): boolean {
//     const status = normalizeText(invoice?.status);
//     const poStatus = normalizeText(
//       invoice?.poStatus || invoice?.purchaseOrderStatus,
//     );

//     const statusSaysPOCreated = [
//       "po_created",
//       "po_submitted",
//       "po_approved",
//       "po_issued",
//       "ready_for_payment",
//     ].includes(status);

//     const poStatusSaysCreated = [
//       "created",
//       "submitted",
//       "approved",
//       "issued",
//       "ready_for_payment",
//     ].includes(poStatus);

//     const hasDirectPOFields = Boolean(
//       invoice?.poSubmitted ||
//         invoice?.poCreated ||
//         invoice?.purchaseOrderCreated ||
//         invoice?.purchaseOrderSubmitted ||
//         invoice?.poId ||
//         invoice?.poNumber ||
//         invoice?.poDocId ||
//         invoice?.purchaseOrderId ||
//         invoice?.purchaseOrderNumber ||
//         invoice?.poCreatedAt ||
//         invoice?.purchaseOrderCreatedAt,
//     );

//     return Boolean(
//       statusSaysPOCreated ||
//         poStatusSaysCreated ||
//         hasDirectPOFields ||
//         getLinkedPO(invoice),
//     );
//   }

//   function hasPaymentReleased(invoice: any): boolean {
//     return isPaymentFullyReleased(invoice);
//   }

//   function hasAnyPaymentRelease(invoice: any): boolean {
//     return (
//       getTotalReleasedAmount(invoice) > 0 ||
//       getPaymentReleaseHistory(invoice).length > 0
//     );
//   }

//   function getExpenseAmount(invoice: any): number {
//     return safeNumber(
//       invoice?.approvedAmount || invoice?.totalAmount || invoice?.amount,
//     );
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
//     if (!userProfile || userProfile.role !== "operation") return false;

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
//     const vendorName =
//       request.vendorName ||
//       request.supplierName ||
//       getFirstVendorName(request) ||
//       request.clientName ||
//       "";
//     const amount = getExpenseAmount(request);

//     return {
//       ...request,
//       invoiceNumber: request.requestId,
//       linkedRequestId: request.requestId,
//       budgetRequestId: request.requestId,
//       invoiceRequestId: request.id,
//       linkedInvoiceId: request.id,
//       sourceInvoiceId: request.id,
//       sourceType: "budget_request",
//       approvalRequired: false,
//       requiresApproval: false,
//       adminApprovalRequired: false,
//       autoApproved: true,
//       autoApprovedReason:
//         "Created from approved budget request. No further approval required.",
//       expenseStatus: "submitted",
//       status: "submitted",
//       invoiceType: requestType,
//       requestType,
//       amount,
//       totalAmount: amount,
//       approvedAmount: amount,
//       vendorName,
//       supplierName: request.supplierName || vendorName,
//       clientName: request.clientName || "",
//       projectName,
//       project: projectName,
//       projectCode: request.projectCode || "",
//       poId: request.poId || "",
//       poNumber: request.poNumber || "",
//       dueDate: new Date(),
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
//     } catch (error: any) {
//       console.error("Failed to mark expense as submitted:", error);
//       toast({
//         title: "Expense submitted",
//         description:
//           "Expense was submitted, but the request status could not be updated.",
//       });
//     } finally {
//       setIsExpenseModalOpen(false);
//       setSelectedInvoice(null);
//       localStorage.removeItem("submitExpenseFromBudgetRequest");
//       localStorage.removeItem("expenseSheetSource");
//     }
//   }

//   async function handlePaymentReleased() {
//     // PaymentReleaseModal already updates the request with the latest partial/full
//     // release totals. Do not overwrite it here, otherwise partial releases would be
//     // forced into the final payment_released state.
//     toast({
//       title: "Payment release saved",
//       description: "The payment release history has been updated successfully.",
//     });

//     setIsPaymentModalOpen(false);
//     setSelectedInvoice(null);
//   }

//   function getFirstVendorName(invoice: any): string {
//     const lineItems = Array.isArray(invoice?.lineItems)
//       ? invoice.lineItems
//       : [];
//     const approvedItems = Array.isArray(invoice?.approvalItems)
//       ? invoice.approvalItems
//       : [];
//     const allItems = [...approvedItems, ...lineItems];

//     const matchedItem = allItems.find(
//       (item: any) =>
//         item?.vendor ||
//         item?.vendorName ||
//         item?.supplier ||
//         item?.supplierName ||
//         item?.original?.vendor ||
//         item?.original?.supplier,
//     );

//     return (
//       matchedItem?.vendor ||
//       matchedItem?.vendorName ||
//       matchedItem?.supplier ||
//       matchedItem?.supplierName ||
//       matchedItem?.original?.vendor ||
//       matchedItem?.original?.supplier ||
//       ""
//     );
//   }

//   function getVendorFilterText(invoice: any): string {
//     return getFirstTextValue([
//       invoice?.vendorName,
//       invoice?.supplierName,
//       getFirstVendorName(invoice),
//     ]);
//   }

//   function handleCreatePO(invoice: InvoiceRequest) {
//     const request: any = invoice;

//     localStorage.setItem(
//       "createPOFromBudgetRequest",
//       JSON.stringify({
//         invoiceRequestId: request.id,
//         budgetRequestDocId: request.id,
//         budgetRequestId: request.requestId,
//         requestId: request.requestId,
//         invoiceType: getRequestType(request),
//         sourceType: "budget_request",
//         returnToBudgetRequests: true,
//         updateBudgetRequestAfterPO: true,

//         estimateId: request.estimateId || "",
//         estimateNumber:
//           request.estimateNumber ||
//           request.estimateNo ||
//           request.estimateValue ||
//           request.selectedEstimate ||
//           request.selectEstimate ||
//           "",

//         clientName: request.clientName || "",
//         projectName: request.projectName || request.project || "",
//         project: request.project || request.projectName || "",
//         projectCode: request.projectCode || "",
//         title: request.title || request.subject || "",
//         subject: request.subject || "",
//         message: request.message || "",

//         supplierId: request.supplierId || request.vendorId || "",
//         supplierName:
//           request.supplierName ||
//           request.vendorName ||
//           getFirstVendorName(request),
//         vendorName:
//           request.vendorName ||
//           request.supplierName ||
//           getFirstVendorName(request),

//         totalAmount: Number(request.totalAmount || 0),
//         approvedAmount: Number(
//           request.approvedAmount || request.totalAmount || 0,
//         ),

//         approvalItems: request.approvalItems || [],
//         lineItems: request.lineItems || [],
//         items: request.items || request.lineItems || [],
//       }),
//     );

//     setLocation(CREATE_PO_ROUTE);
//   }

//   async function handleApprove(invoice: InvoiceRequest) {
//     if (!userProfile) return;

//     const roleKey = getRoleKey(userProfile.role);
//     const status = normalizeText(invoice.status);
//     const approvalHistory = Array.isArray((invoice as any).approvalHistory)
//       ? (invoice as any).approvalHistory
//       : [];

//     let newStatus = status;
//     let currentApprover = String((invoice as any).currentApprover || "");

//     const updatePayload: Record<string, any> = {
//       approvalHistory: [
//         ...approvalHistory,
//         {
//           approver:
//             userProfile.displayName ||
//             (userProfile as any)?.name ||
//             userProfile.email ||
//             roleKey,
//           approverRole: roleKey,
//           action: "approved",
//           timestamp: new Date(),
//           notes: "",
//         },
//       ],
//       returnedToCreator: false,
//       needsCreatorRevision: false,
//       returnedToRole: "",
//       returnedToRoleLabel: "",
//       updatedAt: serverTimestamp(),
//     };

//     if (isAdminRole(roleKey) && isWaitingForAdminApproval(invoice)) {
//       newStatus = "pending_finance";
//       currentApprover = "finance";
//       updatePayload.adminApprovedAt = serverTimestamp();
//       updatePayload.adminApprovedBy =
//         userProfile.displayName || userProfile.email || "";
//       updatePayload.adminApprovedById =
//         userProfile.id ||
//         (userProfile as any)?.uid ||
//         (userProfile as any)?.userId ||
//         userProfile.email ||
//         "";
//     } else if (isFinanceApproverRole(roleKey) && status === "pending_finance") {
//       newStatus = "approved";
//       currentApprover = "";
//       updatePayload.financeApprovedAt = serverTimestamp();
//       updatePayload.financeApprovedBy =
//         userProfile.displayName || userProfile.email || "";
//       updatePayload.financeApprovedById =
//         userProfile.id ||
//         (userProfile as any)?.uid ||
//         (userProfile as any)?.userId ||
//         userProfile.email ||
//         "";
//       updatePayload.approvedAt = serverTimestamp();
//     } else {
//       toast({
//         title: "Action not allowed",
//         description:
//           "This request is not currently assigned to your approval stage.",
//         variant: "destructive",
//       });
//       return;
//     }

//     try {
//       await updateDoc(
//         doc(db, "Panels", PANEL_ID, "invoiceRequests", invoice.id),
//         {
//           ...updatePayload,
//           status: newStatus,
//           currentApprover,
//         },
//       );

//       toast({
//         title: "Success",
//         description: "Budget request approved successfully",
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

//   async function handleReject(
//     invoice: InvoiceRequest,
//     rejectionComment: string,
//   ) {
//     if (!userProfile) return;

//     try {
//       setRejectionLoading(true);

//       const roleKey = getRoleKey(userProfile.role);
//       const ownerId = getBudgetRequestOwnerId(invoice);
//       const approvalHistory = Array.isArray((invoice as any).approvalHistory)
//         ? (invoice as any).approvalHistory
//         : [];

//       const returnedToRole = getBudgetRequestOwnerRole(invoice);
//       const returnedToRoleLabel = formatRoleLabel(returnedToRole);

//       await updateDoc(
//         doc(db, "Panels", PANEL_ID, "invoiceRequests", invoice.id),
//         {
//           status: "rejected",
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
//               approverRole: roleKey,
//               action: "rejected",
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
//           returnedToRoleLabel || "the original role"
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

//   function getStatusBadgeColor(status: string, invoice?: any): string {
//     if (invoice && wasReturnedToCreator(invoice)) {
//       return "border-red-200 bg-red-50 text-red-700";
//     }

//     switch (status) {
//       case "approved":
//       case "payment_released":
//       case "expense_submitted":
//       case "expense_completed":
//         return "border-green-200 bg-green-50 text-green-700";
//       case "rejected":
//       case "returned_to_creator":
//       case "changes_requested":
//         return "border-red-200 bg-red-50 text-red-700";
//       case "pending_operational_admin":
//       case "pending_main_admin":
//       case "pending_admin":
//       case "pending_finance":
//         return "border-amber-200 bg-amber-50 text-amber-700";
//       case "payment_partially_released":
//         return "border-blue-200 bg-blue-50 text-blue-700";
//       default:
//         return "border-slate-200 bg-slate-50 text-slate-700";
//     }
//   }

//   function getTypeBadgeColor(type: "general" | "project") {
//     return type === "project"
//       ? "border-indigo-200 bg-indigo-50 text-indigo-700"
//       : "border-slate-200 bg-slate-50 text-slate-700";
//   }

//   function getCurrentStep(invoice: InvoiceRequest): string {
//     const status = normalizeText(invoice.status || "");

//     if (
//       (invoice as any).expenseSubmitted ||
//       status === "expense_submitted" ||
//       hasExpenseSheet(invoice)
//     ) {
//       return "Expense Submitted / No Approval Required";
//     }

//     if (hasPaymentReleased(invoice)) {
//       return "Payment Released / Ready for Expense";
//     }

//     if (hasPartialPaymentReleased(invoice)) {
//       return `Partial Payment Released / Remaining Rs ${formatPKR(
//         getRemainingPaymentBalance(invoice),
//       )}`;
//     }

//     if (isProjectRequest(invoice) && hasPOAlready(invoice)) {
//       return "PO Created / Ready for Payment";
//     }

//     if (wasReturnedToCreator(invoice)) {
//       return `${getBudgetRequestStatusLabel(invoice)} / Waiting for Resubmission`;
//     }

//     switch (status) {
//       case "pending_operational_admin":
//       case "pending_main_admin":
//       case "pending_admin":
//         return "Admin Approval";
//       case "pending_finance":
//         return "Finance Approval";
//       case "approved":
//         return isProjectRequest(invoice) ? "Ready for PO" : "Ready for Payment";
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
//         return "Payment Released / Ready for Expense";
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
//     if (!userProfile) return false;

//     const roleKey = getRoleKey(userProfile.role);

//     if (isAdminRole(roleKey)) {
//       return isWaitingForAdminApproval(invoice);
//     }

//     if (isFinanceApproverRole(roleKey)) {
//       return normalizeText(invoice.status) === "pending_finance";
//     }

//     return false;
//   }

//   function canEdit(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;

//     if (!isOwnBudgetRequest(invoice)) return false;

//     if (hasAdminApprovedBudgetRequest(invoice)) return false;

//     const status = normalizeText(invoice.status);

//     return (
//       wasReturnedToCreator(invoice) ||
//       status === "draft" ||
//       status === "pending_main_admin" ||
//       status === "pending_admin" ||
//       status === "pending_operational_admin" ||
//       status === ""
//     );
//   }

//   function getEditableInvoice(invoice: InvoiceRequest): InvoiceRequest {
//     if (hasAdminApprovedBudgetRequest(invoice)) return invoice;

//     if (!wasReturnedToCreator(invoice)) return invoice;

//     return {
//       ...(invoice as any),
//       status: "pending_main_admin",
//       currentApprover: "main_admin",
//       returnedToCreator: false,
//       needsCreatorRevision: false,
//       returnedToRole: "",
//       returnedToRoleLabel: "",
//       resubmittedAt: new Date(),
//     } as InvoiceRequest;
//   }

//   function canReleasePayment(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;

//     const isFinanceUser = isFinanceApproverRole(userProfile.role);
//     if (!isFinanceUser) return false;

//     if (hasPaymentReleased(invoice)) return false;

//     if (getRemainingPaymentBalance(invoice) <= 0.009) return false;

//     if (
//       (invoice as any).expenseSubmitted ||
//       String(invoice.status) === "expense_submitted"
//     ) {
//       return false;
//     }

//     const status = normalizeText(invoice.status);
//     const readyForPayment = [
//       "approved",
//       "po_created",
//       "po_submitted",
//       "po_approved",
//       "po_issued",
//       "ready_for_payment",
//       "payment_partially_released",
//     ].includes(status);

//     if (!readyForPayment) return false;

//     if (!isProjectRequest(invoice)) return true;

//     return hasPOAlready(invoice);
//   }

//   function canCreatePO(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;

//     return (
//       isFinanceApproverRole(userProfile.role) &&
//       normalizeText(invoice.status) === "approved" &&
//       isProjectRequest(invoice) &&
//       !hasPOAlready(invoice) &&
//       !hasPaymentReleased(invoice)
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

//     if (!expenseSheets) return null;

//     const expenseSheet = expenseSheets.find((expense: any) =>
//       isExpenseLinkedToRequest(expense, invoice),
//     );

//     return expenseSheet?.status || expenseSheet?.expenseStatus || null;
//   }

//   const canCreateInvoices = canRoleCreateBudgetRequest(currentUserRole);

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

//       if (!lookupKey) continue;

//       const matchedUser = usersByLookup.get(lookupKey);
//       if (matchedUser) return matchedUser;
//     }

//     return null;
//   }

//   function canCurrentUserSeeAllBudgetRequests() {
//     const userRecord = getCurrentUserRecordFromUsersCollection();
//     const effectiveRole = getRoleKey(currentUserRole || userRecord?.role);

//     if (canRoleSeeAllBudgetRequests(effectiveRole)) return true;

//     if (!isOperationRole(effectiveRole)) return false;

//     return Boolean(
//       (userProfile as any)?.canViewAllBudgetRequests ||
//         userRecord?.canViewAllBudgetRequests,
//     );
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

//         if (lookupKey) map.set(lookupKey, user);
//       });
//     });

//     return map;
//   }, [users, panelUsers]);

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
//     if (directRole) return directRole;

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

//       if (!lookupKey) continue;

//       const matchedUser = usersByLookup.get(lookupKey);
//       const matchedRole = getUserRoleLabel(matchedUser);

//       if (matchedRole) return matchedRole;
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

//     if (isCurrentUserOwner) return getRoleKey(userProfile?.role);

//     return "";
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

//     return getStatusLabel(invoice?.status || "", invoice);
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

//       if (!name) return;

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

//         if (lookupKey && !map.has(lookupKey)) map.set(lookupKey, name);
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

//     if (directName) return directName;

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

//       if (!lookupKey) continue;

//       const overrideName = getSafeDisplayText(
//         CREATOR_NAME_OVERRIDES[rawKey] || CREATOR_NAME_OVERRIDES[lookupKey],
//       );

//       if (overrideName) return overrideName;

//       const nameFromAnotherRequest = getSafeDisplayText(
//         creatorNamesByLookup.get(lookupKey),
//       );

//       if (nameFromAnotherRequest) return nameFromAnotherRequest;

//       const matchedUser = usersByLookup.get(lookupKey);
//       const matchedName = getSafeDisplayText(getUserDisplayName(matchedUser));

//       if (matchedName) return matchedName;
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

//     const ownerLookupValues = lookupValues
//       .map((value) =>
//         String(value || "")
//           .trim()
//           .toLowerCase(),
//       )
//       .filter(Boolean);

//     const isCurrentUserOwner = ownerLookupValues.some((ownerKey) =>
//       currentUserLookupValues.includes(ownerKey),
//     );

//     if (isCurrentUserOwner) {
//       const currentUserName = getFirstTextValue([
//         getSafeDisplayText(userProfile?.displayName),
//         getSafeDisplayText((userProfile as any)?.name),
//         getSafeDisplayText((userProfile as any)?.fullName),
//         getSafeDisplayText(userProfile?.email),
//       ]);

//       if (currentUserName) return currentUserName;
//     }

//     const emailFallback = getFirstTextValue([
//       getSafeDisplayText(invoice?.createdByEmail),
//       getSafeDisplayText(invoice?.submittedByEmail),
//       getSafeDisplayText(invoice?.email),
//     ]);

//     if (emailFallback) return emailFallback;

//     return "Unknown User";
//   }

//   const visibleInvoicesForFilterOptions = useMemo(() => {
//     return (invoices || []).filter((invoice: any) => {
//       const canSeeAllRequests = canCurrentUserSeeAllBudgetRequests();
//       return canSeeAllRequests || isOwnBudgetRequest(invoice);
//     });
//   }, [invoices, userProfile, currentUserRole, usersByLookup]);

//   const createdByOptions = useMemo(() => {
//     const names = Array.from(
//       new Set(
//         visibleInvoicesForFilterOptions
//           .map((invoice: any) => getCreatedByName(invoice))
//           .filter((name) => String(name || "").trim()),
//       ),
//     );

//     return names.sort((a, b) => a.localeCompare(b));
//   }, [
//     visibleInvoicesForFilterOptions,
//     usersByLookup,
//     creatorNamesByLookup,
//     userProfile,
//   ]);

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

//   const statusOptions = useMemo(() => {
//     const uniqueStatuses = Array.from(
//       new Set(
//         (invoices || []).map((invoice) => invoice.status).filter(Boolean),
//       ),
//     );

//     return uniqueStatuses.sort();
//   }, [invoices]);

//   const filteredInvoices = useMemo(() => {
//     const search = normalizeText(searchTerm);
//     const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
//     const toDate = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

//     return (invoices || []).filter((invoice: any) => {
//       const requestType = getRequestType(invoice);
//       const requestDate = getRequestDate(invoice);
//       const requestDateInputValue = getDateInputValue(requestDate);
//       const createdByName = getCreatedByName(invoice);
//       const projectCode = String(invoice?.projectCode || "").trim();
//       const vendorName = getVendorFilterText(invoice);
//       const chequeFilterText = getChequeFilterText(invoice);

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
//           createdByName,
//           (invoice as any).createdByName,
//           (invoice as any).submittedByName,
//           (invoice as any).requestedByName,
//           (invoice as any).createdByEmail,
//           (invoice as any).submittedByEmail,
//         ].join(" "),
//       );

//       const matchesSearch = !search || haystack.includes(search);
//       const matchesType = typeFilter === "all" || requestType === typeFilter;
//       const matchesStatus =
//         statusFilter === "all" || invoice.status === statusFilter;
//       const matchesMonth =
//         !monthFilter || requestDateInputValue.startsWith(monthFilter);
//       const matchesCreatedBy =
//         createdByFilter === "all" ||
//         normalizeText(createdByName) === normalizeText(createdByFilter);
//       const matchesProjectCode =
//         !normalizeText(projectCodeFilter) ||
//         normalizeText(projectCode).includes(normalizeText(projectCodeFilter));
//       const matchesVendor =
//         !normalizeText(vendorFilter) ||
//         normalizeText(vendorName).includes(normalizeText(vendorFilter));
//       const matchesCheque =
//         !normalizeText(chequeFilter) ||
//         normalizeText(chequeFilterText).includes(normalizeText(chequeFilter));
//       const matchesFrom = !fromDate || (requestDate && requestDate >= fromDate);
//       const matchesTo = !toDate || (requestDate && requestDate <= toDate);
//       const canSeeAllRequests = canCurrentUserSeeAllBudgetRequests();
//       const matchesOwnership = canSeeAllRequests || isOwnBudgetRequest(invoice);

//       return (
//         matchesOwnership &&
//         matchesSearch &&
//         matchesType &&
//         matchesStatus &&
//         matchesMonth &&
//         matchesCreatedBy &&
//         matchesProjectCode &&
//         matchesVendor &&
//         matchesCheque &&
//         matchesFrom &&
//         matchesTo
//       );
//     });
//   }, [
//     dateFrom,
//     dateTo,
//     invoices,
//     monthFilter,
//     searchTerm,
//     statusFilter,
//     typeFilter,
//     createdByFilter,
//     projectCodeFilter,
//     vendorFilter,
//     chequeFilter,
//     userProfile,
//     currentUserRole,
//     usersByLookup,
//     creatorNamesByLookup,
//   ]);

//   const summary = useMemo(() => {
//     const totalAmount = filteredInvoices.reduce(
//       (sum, invoice: any) => sum + safeNumber(invoice.totalAmount),
//       0,
//     );

//     const projectCount = filteredInvoices.filter(
//       (invoice) => getRequestType(invoice) === "project",
//     ).length;

//     const generalCount = filteredInvoices.filter(
//       (invoice) => getRequestType(invoice) === "general",
//     ).length;

//     const approvedCount = filteredInvoices.filter(
//       (invoice) => invoice.status === "approved",
//     ).length;

//     return { totalAmount, projectCount, generalCount, approvedCount };
//   }, [filteredInvoices]);

//   const sortedInvoices = useMemo(() => {
//     return [...filteredInvoices].sort((a, b) =>
//       compareBudgetRequestsForTable(
//         a,
//         b,
//         currentUserRole,
//         canReleasePayment,
//       ),
//     );
//   }, [filteredInvoices, currentUserRole, purchaseOrders, userProfile]);

//   const totalPages = Math.max(1, Math.ceil(sortedInvoices.length / pageSize));
//   const startIndex = (currentPage - 1) * pageSize;
//   const paginatedInvoices = sortedInvoices.slice(
//     startIndex,
//     startIndex + pageSize,
//   );
//   const showingFrom = sortedInvoices.length === 0 ? 0 : startIndex + 1;
//   const showingTo = Math.min(startIndex + pageSize, sortedInvoices.length);

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
//     chequeFilter,
//     pageSize,
//   ]);

//   useEffect(() => {
//     if (currentPage > totalPages) setCurrentPage(totalPages);
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
//     setChequeFilter("");
//     setPageSize(10);
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
//             <p className="mt-2 max-w-2xl text-sm text-slate-500">
//               Review project and general budget requests, send requests through
//               Admin and Finance approval, release payments, or create POs.
//             </p>
//           </div>

//           {canCreateInvoices && (
//             <Button
//               className="h-11 rounded-2xl px-5 shadow-sm"
//               onClick={() => {
//                 setSelectedInvoice(null);
//                 setIsInvoiceModalOpen(true);
//               }}
//               data-testid="button-new-invoice-request"
//             >
//               + New Request
//             </Button>
//           )}
//         </div>

//         <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
//                 Filtered Value
//               </p>
//               <p className="mt-3 text-2xl font-semibold text-slate-950">
//                 Rs {formatPKR(summary.totalAmount)}
//               </p>
//               <p className="mt-1 text-xs text-slate-400">
//                 Approved waiting: {summary.approvedCount}
//               </p>
//             </CardContent>
//           </Card>
//         </div>

//         <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//           <CardContent className="space-y-4 p-5">
//             <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
//               <div className="xl:col-span-2">
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Search
//                 </label>
//                 <input
//                   value={searchTerm}
//                   onChange={(event) => setSearchTerm(event.target.value)}
//                   placeholder="Request ID, client, project, title..."
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Created By
//                 </label>
//                 <select
//                   value={createdByFilter}
//                   onChange={(event) => setCreatedByFilter(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 >
//                   <option value="all">All Creators</option>
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
//                   placeholder="Enter project code..."
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Request Type
//                 </label>
//                 <select
//                   value={typeFilter}
//                   onChange={(event) =>
//                     setTypeFilter(
//                       event.target.value as "all" | "project" | "general",
//                     )
//                   }
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 >
//                   <option value="all">All Types</option>
//                   <option value="project">Project</option>
//                   <option value="general">General</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Status
//                 </label>
//                 <select
//                   value={statusFilter}
//                   onChange={(event) => setStatusFilter(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 >
//                   <option value="all">All Statuses</option>
//                   {statusOptions.map((status) => (
//                     <option key={status} value={status}>
//                       {getStatusLabel(status)}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Month
//                 </label>
//                 <input
//                   type="month"
//                   value={monthFilter}
//                   onChange={(event) => setMonthFilter(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>
//             </div>

//             <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Vendor
//                 </label>
//                 <input
//                   value={vendorFilter}
//                   onChange={(event) => setVendorFilter(event.target.value)}
//                   placeholder="Enter vendor name..."
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Cheque Number
//                 </label>
//                 <input
//                   value={chequeFilter}
//                   onChange={(event) => setChequeFilter(event.target.value)}
//                   placeholder="Enter cheque number..."
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   From Date
//                 </label>
//                 <input
//                   type="date"
//                   value={dateFrom}
//                   onChange={(event) => setDateFrom(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   To Date
//                 </label>
//                 <input
//                   type="date"
//                   value={dateTo}
//                   onChange={(event) => setDateTo(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Rows
//                 </label>
//                 <select
//                   value={pageSize}
//                   onChange={(event) => setPageSize(Number(event.target.value))}
//                   className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
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

//         <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm">
//           <CardContent className="p-0">
//             <div className="overflow-x-auto">
//               <table className="w-full min-w-[1400px]">
//                 <thead>
//                   <tr className="border-b border-slate-200 bg-slate-50/80">
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Request ID
//                     </th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Type
//                     </th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Client / Title
//                     </th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Project
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
//                       <td colSpan={11} className="px-6 py-12 text-center">
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
//                         type === "general"
//                           ? (invoice as any).title ||
//                             (invoice as any).subject ||
//                             "General Request"
//                           : (invoice as any).clientName || "-";

//                       const projectName =
//                         type === "project"
//                           ? (invoice as any).projectName ||
//                             (invoice as any).project ||
//                             (invoice as any).projectCode ||
//                             "-"
//                           : "-";

//                       const createdByName = getCreatedByName(invoice);
//                       const approvedPaymentAmount =
//                         getApprovedPaymentAmount(invoice);
//                       const totalReleasedAmount =
//                         getTotalReleasedAmount(invoice);
//                       const remainingPaymentBalance =
//                         getRemainingPaymentBalance(invoice);
//                       const paymentHistory = getPaymentReleaseHistory(invoice);
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

//                       return (
//                         <tr
//                           key={invoice.id}
//                           className="transition hover:bg-slate-50/80"
//                         >
//                           <td
//                             className="px-5 py-4 text-sm font-semibold text-slate-900"
//                             data-testid={`text-request-id-${invoice.id}`}
//                           >
//                             {invoice.requestId || "-"}
//                           </td>

//                           <td className="px-5 py-4">
//                             <Badge
//                               variant="outline"
//                               className={`rounded-full px-3 py-1 ${getTypeBadgeColor(
//                                 type,
//                               )}`}
//                             >
//                               {type === "project" ? "Project" : "General"}
//                             </Badge>
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-700">
//                             <div className="font-medium text-slate-900">
//                               {displayClientOrTitle}
//                             </div>
//                             {(invoice as any).projectCode &&
//                               type === "project" && (
//                                 <div className="mt-1 text-xs text-slate-400">
//                                   Code: {(invoice as any).projectCode}
//                                 </div>
//                               )}
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-600">
//                             {projectName}
//                           </td>

//                           <td
//                             className="px-5 py-4 text-sm font-medium text-slate-700"
//                             data-testid={`text-created-by-${invoice.id}`}
//                           >
//                             {createdByName}
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-600">
//                             {formatRequestDate(invoice)}
//                           </td>

//                           <td className="px-5 py-4 text-sm font-semibold text-slate-900">
//                             Rs{" "}
//                             {formatPKR(
//                               approvedPaymentAmount || invoice.totalAmount,
//                             )}
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-600">
//                             <div className="space-y-2">
//                               <div className="flex items-center justify-between gap-3">
//                                 <span className="text-xs text-slate-500">
//                                   Released
//                                 </span>
//                                 <span className="font-semibold text-slate-900">
//                                   Rs {formatPKR(totalReleasedAmount)}
//                                 </span>
//                               </div>
//                               <div className="h-2 overflow-hidden rounded-full bg-slate-100">
//                                 <div
//                                   className="h-full rounded-full bg-slate-950"
//                                   style={{
//                                     width: `${paymentProgressPercent}%`,
//                                   }}
//                                 />
//                               </div>
//                               <div className="flex items-center justify-between gap-3">
//                                 <span className="text-xs text-slate-500">
//                                   Balance
//                                 </span>
//                                 <span className="font-semibold text-slate-900">
//                                   Rs {formatPKR(remainingPaymentBalance)}
//                                 </span>
//                               </div>
//                             </div>
//                           </td>

//                           <td className="px-5 py-4">
//                             <Badge
//                               variant="outline"
//                               className={`rounded-full px-3 py-1 ${getStatusBadgeColor(
//                                 invoice.status,
//                                 invoice,
//                               )}`}
//                             >
//                               {getBudgetRequestStatusLabel(invoice)}
//                             </Badge>
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-500">
//                             {getCurrentStep(invoice)}
//                           </td>

//                           <td className="px-5 py-4">
//                             <div className="flex flex-wrap gap-2">
//                               <Button
//                                 variant="outline"
//                                 size="sm"
//                                 className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
//                                 onClick={() => openDetailsModal(invoice)}
//                                 data-testid={`button-view-details-${invoice.id}`}
//                               >
//                                 View
//                               </Button>

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
//                                           "This request can no longer be edited because it has already been approved by Admin.",
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

//                               {canReleasePayment(invoice) && (
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   className="rounded-xl border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
//                                   onClick={() => {
//                                     const linkedPO = getLinkedPO(invoice);

//                                     setSelectedInvoice({
//                                       ...invoice,
//                                       invoiceNumber: invoice.requestId,
//                                       vendorName:
//                                         (invoice as any).vendorName ||
//                                         (invoice as any).supplierName ||
//                                         (invoice as any).clientName,
//                                       amount: remainingPaymentBalance,
//                                       approvedAmount: approvedPaymentAmount,
//                                       totalApprovedAmount:
//                                         approvedPaymentAmount,
//                                       totalReleasedAmount,
//                                       remainingReleaseAmount:
//                                         remainingPaymentBalance,
//                                       dueDate: new Date(),
//                                       poId:
//                                         (invoice as any).poId ||
//                                         (invoice as any).poDocId ||
//                                         linkedPO?.id ||
//                                         linkedPO?.poId ||
//                                         linkedPO?.poDocId ||
//                                         "",
//                                       poNumber:
//                                         (invoice as any).poNumber ||
//                                         (invoice as any).purchaseOrderNumber ||
//                                         linkedPO?.poNumber ||
//                                         linkedPO?.purchaseOrderNumber ||
//                                         "",
//                                     } as any);
//                                     setIsPaymentModalOpen(true);
//                                   }}
//                                   data-testid={`button-release-payment-${invoice.id}`}
//                                 >
//                                   Release Payment
//                                 </Button>
//                               )}

//                               {hasAnyPaymentRelease(invoice) && (
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
//                                   History ({paymentHistory.length})
//                                 </Button>
//                               )}

//                               {canCreatePO(invoice) && (
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   className="rounded-xl border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
//                                   onClick={() => handleCreatePO(invoice)}
//                                   data-testid={`button-create-po-${invoice.id}`}
//                                 >
//                                   Create PO
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

//               <div className="flex items-center gap-2">
//                 <Button
//                   type="button"
//                   variant="outline"
//                   size="sm"
//                   className="rounded-xl border-slate-200"
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
//                     type="button"
//                     variant={page === currentPage ? "default" : "outline"}
//                     size="sm"
//                     className="h-9 w-9 rounded-xl p-0"
//                     onClick={() => setCurrentPage(page)}
//                   >
//                     {page}
//                   </Button>
//                 ))}

//                 <Button
//                   type="button"
//                   variant="outline"
//                   size="sm"
//                   className="rounded-xl border-slate-200"
//                   disabled={currentPage === totalPages}
//                   onClick={() =>
//                     setCurrentPage((page) => Math.min(totalPages, page + 1))
//                   }
//                 >
//                   Next
//                 </Button>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       <InvoiceRequestModal
//         isOpen={isInvoiceModalOpen}
//         onClose={() => {
//           setIsInvoiceModalOpen(false);
//           setSelectedInvoice(null);
//         }}
//         onSuccess={() => {
//           setIsInvoiceModalOpen(false);
//           setSelectedInvoice(null);
//         }}
//         editingInvoice={selectedInvoice}
//       />

//       <PaymentReleaseModal
//         isOpen={isPaymentModalOpen}
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
//       />

//       {isPaymentHistoryModalOpen && paymentHistoryInvoice && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
//           <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-xl">
//             <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-slate-200 bg-white/95 p-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
//               <div>
//                 <h2 className="text-lg font-semibold text-slate-950">
//                   Payment Release History
//                 </h2>
//                 <p className="mt-1 text-sm text-slate-500">
//                   Request ID: {paymentHistoryInvoice.requestId || "-"}
//                 </p>
//               </div>

//               <Button
//                 type="button"
//                 variant="outline"
//                 className="rounded-2xl border-slate-200"
//                 onClick={() => {
//                   setIsPaymentHistoryModalOpen(false);
//                   setPaymentHistoryInvoice(null);
//                 }}
//               >
//                 Close
//               </Button>
//             </div>

//             <div className="grid gap-4 border-b border-slate-100 p-5 md:grid-cols-3">
//               <div className="rounded-2xl bg-slate-50 p-4">
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                   Total Approved
//                 </p>
//                 <p className="mt-2 text-xl font-semibold text-slate-950">
//                   Rs{" "}
//                   {formatPKR(getApprovedPaymentAmount(paymentHistoryInvoice))}
//                 </p>
//               </div>
//               <div className="rounded-2xl bg-slate-50 p-4">
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                   Released So Far
//                 </p>
//                 <p className="mt-2 text-xl font-semibold text-slate-950">
//                   Rs {formatPKR(getTotalReleasedAmount(paymentHistoryInvoice))}
//                 </p>
//               </div>
//               <div className="rounded-2xl bg-slate-50 p-4">
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                   Remaining Balance
//                 </p>
//                 <p className="mt-2 text-xl font-semibold text-slate-950">
//                   Rs{" "}
//                   {formatPKR(getRemainingPaymentBalance(paymentHistoryInvoice))}
//                 </p>
//               </div>
//             </div>

//             <div className="p-5">
//               {getPaymentReleaseHistory(paymentHistoryInvoice).length === 0 ? (
//                 <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">
//                   No payment releases have been recorded yet.
//                 </div>
//               ) : (
//                 <div className="overflow-x-auto rounded-2xl border border-slate-200">
//                   <table className="w-full min-w-[850px] text-sm">
//                     <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
//                       <tr>
//                         <th className="px-4 py-3 text-left font-semibold">
//                           Date
//                         </th>
//                         <th className="px-4 py-3 text-left font-semibold">
//                           Type
//                         </th>
//                         <th className="px-4 py-3 text-left font-semibold">
//                           Method
//                         </th>
//                         <th className="px-4 py-3 text-left font-semibold">
//                           Amount
//                         </th>
//                         <th className="px-4 py-3 text-left font-semibold">
//                           Reference / Cheque
//                         </th>
//                         <th className="px-4 py-3 text-left font-semibold">
//                           Released By
//                         </th>
//                         <th className="px-4 py-3 text-left font-semibold">
//                           Notes
//                         </th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-slate-100">
//                       {[...getPaymentReleaseHistory(paymentHistoryInvoice)]
//                         .reverse()
//                         .map((entry: any, index: number) => (
//                           <tr
//                             key={
//                               entry?.id ||
//                               `${entry?.releasedAt || "release"}-${index}`
//                             }
//                           >
//                             <td className="px-4 py-3 text-slate-600">
//                               {getReleaseDateLabel(entry?.releasedAt)}
//                             </td>
//                             <td className="px-4 py-3">
//                               <Badge
//                                 variant="outline"
//                                 className="rounded-full border-slate-200 bg-slate-50 px-3 py-1 text-slate-700"
//                               >
//                                 {entry?.releaseType || "release"}
//                               </Badge>
//                             </td>
//                             <td className="px-4 py-3 text-slate-700">
//                               {getPaymentMethodLabel(entry?.paymentMethod)}
//                             </td>
//                             <td className="px-4 py-3 font-semibold text-slate-950">
//                               Rs {formatPKR(getPaymentReleaseAmount(entry))}
//                             </td>
//                             <td className="px-4 py-3 text-slate-600">
//                               <div>{entry?.transactionReference || "-"}</div>
//                               {Array.isArray(entry?.chequeNumbers) &&
//                                 entry.chequeNumbers.length > 0 && (
//                                   <div className="mt-1 text-xs text-slate-500">
//                                     Cheques: {entry.chequeNumbers.join(", ")}
//                                   </div>
//                                 )}
//                             </td>
//                             <td className="px-4 py-3 text-slate-600">
//                               {entry?.releasedByName || "-"}
//                             </td>
//                             <td className="px-4 py-3 text-slate-600">
//                               {entry?.paymentNotes || "-"}
//                             </td>
//                           </tr>
//                         ))}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

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






// import { useEffect, useMemo, useState } from "react";
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

//   // Backward compatibility for older records that only saved a single paymentDetails object.
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
//     if (text) chequeValues.push(text);
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

// /**
//  * Returns the same merged item rows that are shown in Request Details.
//  *
//  * Request Details can contain the same item across `items`, `lineItems`, and
//  * `approvalItems`. Some older records save the description in only one of
//  * those arrays, so searching a single array can miss the displayed value.
//  */
// function getRequestDetailsItems(invoice: any): any[] {
//   const items = Array.isArray(invoice?.items) ? invoice.items : [];
//   const lineItems = Array.isArray(invoice?.lineItems) ? invoice.lineItems : [];
//   const approvalItems = Array.isArray(invoice?.approvalItems)
//     ? invoice.approvalItems
//     : [];

//   const availableArrays = [items, lineItems, approvalItems].filter(
//     (itemArray) => itemArray.length > 0,
//   );

//   if (availableArrays.length === 0) return [];

//   const baseItems = availableArrays.reduce((longest, current) =>
//     current.length > longest.length ? current : longest,
//   );

//   const findMatchingItem = (
//     source: any[],
//     baseItem: any,
//     index: number,
//   ): any | undefined => {
//     if (!source.length) return undefined;

//     if (baseItem?.id !== null && baseItem?.id !== undefined) {
//       const matchById = source.find(
//         (item: any) => String(item?.id) === String(baseItem.id),
//       );

//       if (matchById) return matchById;
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
//       if (text) searchableValues.push(text);
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

//   // Request-level fields shown in the detail view or used by legacy records.
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

//   // Primary source: use the same merged rows displayed by Request Details.
//   getRequestDetailsItems(invoice).forEach(addItem);

//   // Also cover optional/legacy arrays that are not rendered by the current
//   // Request Details modal but may exist on older requests.
//   [
//     invoice?.requestItems,
//     invoice?.budgetItems,
//     invoice?.expenseItems,
//     invoice?.selectedItems,
//     invoice?.requestDetails?.items,
//     invoice?.requestDetails?.lineItems,
//     invoice?.requestDetails?.approvalItems,
//   ].forEach((itemArray) => {
//     if (Array.isArray(itemArray)) itemArray.forEach(addItem);
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
//   if (explicitReleasedAmount > 0) return explicitReleasedAmount;

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

// function getReleaseDateLabel(value: any) {
//   if (!value) return "-";

//   let date: Date | null = null;

//   if (value instanceof Date) date = value;
//   else if (typeof value?.toDate === "function") date = value.toDate();
//   else if (typeof value?.seconds === "number")
//     date = new Date(value.seconds * 1000);
//   else date = new Date(value);

//   if (!date || Number.isNaN(date.getTime())) return "-";

//   return date.toLocaleString("en-PK", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// }

// function getPaymentMethodLabel(method?: string) {
//   switch (method) {
//     case "cash":
//       return "Cash";
//     case "cheque":
//       return "Cheque";
//     case "bank_transfer":
//       return "Bank Transfer";
//     case "wire":
//       return "Online Transfer";
//     default:
//       return method ? formatStatus(method) : "-";
//   }
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

// function formatRoleLabel(role: any): string {
//   const roleKey = getRoleKey(role);
//   if (!roleKey) return "";

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
//     if (text) return text;
//   }
//   return "";
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
//   if (!sequenceMatch) return null;

//   const sequence = Number(sequenceMatch[1]);
//   return Number.isFinite(sequence) ? sequence : null;
// }

// function compareRequestIdsAscending(a: any, b: any): number {
//   const aSequence = getRequestIdSequence(a);
//   const bSequence = getRequestIdSequence(b);

//   if (aSequence !== null && bSequence !== null && aSequence !== bSequence) {
//     return aSequence - bSequence;
//   }

//   if (aSequence !== null && bSequence === null) return -1;
//   if (aSequence === null && bSequence !== null) return 1;

//   const aDate = getRequestDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
//   const bDate = getRequestDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
//   if (aDate !== bDate) return aDate - bDate;

//   return String(a?.id || "").localeCompare(String(b?.id || ""));
// }

// function getTableStatusSortRank(invoice: any): number {
//   const status = normalizeText(invoice?.status);

//   if (isWaitingForAdminApproval(invoice) && !wasReturnedToCreator(invoice)) {
//     return 0;
//   }

//   if (
//     wasReturnedToCreator(invoice) ||
//     ["rejected", "returned_to_creator", "changes_requested"].includes(status)
//   ) {
//     return 1;
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
//     return 2;
//   }

//   if (status === "pending_finance") {
//     return 3;
//   }

//   if (status.startsWith("pending")) {
//     return 4;
//   }

//   if (
//     ["payment_released", "expense_submitted", "expense_completed"].includes(
//       status,
//     )
//   ) {
//     return 5;
//   }

//   return 6;
// }

// type ReleasePaymentPriorityPredicate = (invoice: any) => boolean;

// /**
//  * Lightweight fallback used by dashboards or other request views that do not
//  * have access to the full purchase-order collection. The request-list page
//  * passes its richer canReleasePayment predicate so linked POs are also handled.
//  */
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

//   if (status !== "approved") return false;

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

//   if (!looksLikeProject) return true;

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

// /**
//  * Finance users use this workflow priority:
//  * 1. Requests currently waiting for Finance approval.
//  * 2. Requests ready for a full or partial payment release.
//  * 3. Requests already approved or completed by Finance.
//  * 4. Requests currently waiting for Admin approval.
//  * 5. Every other request.
//  *
//  * Apply this ranking before pagination in every Finance dashboard/list view.
//  */
// export function getFinanceTableStatusSortRank(
//   invoice: any,
//   isReleasePaymentRequest?: ReleasePaymentPriorityPredicate,
// ): number {
//   const status = normalizeText(invoice?.status);

//   // Priority 1: Finance's own outstanding approval work.
//   if (status === "pending_finance") {
//     return 0;
//   }

//   // Priority 2: Requests requiring payment-release action from Finance.
//   const needsPaymentRelease = isReleasePaymentRequest
//     ? isReleasePaymentRequest(invoice)
//     : isFinanceReleasePaymentPriorityRequest(invoice);

//   if (needsPaymentRelease) {
//     return 1;
//   }

//   // Priority 3: Requests that passed Finance approval or completed later
//   // workflow stages but do not currently require a payment-release action.
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
//       "expense_submitted",
//       "expense_completed",
//     ].includes(status)
//   ) {
//     return 2;
//   }

//   // Priority 4: Requests still assigned to an Admin approval stage.
//   if (isWaitingForAdminApproval(invoice) && !wasReturnedToCreator(invoice)) {
//     return 3;
//   }

//   // Priority 5: Rejected, returned, draft, other-role pending, and unknown
//   // workflow statuses.
//   return 4;
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

//   return compareRequestIdsAscending(a, b);
// }

// function formatRequestDate(invoice: any) {
//   const date = getRequestDate(invoice);
//   if (!date) return "-";

//   return date.toLocaleDateString("en-PK", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// }

// function getDateInputValue(date: Date | null) {
//   if (!date) return "";

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
//   if (!text) return "";
//   if (isFirebaseIdLike(text)) return "";

//   return text;
// }

// function getUserDisplayName(user: any): string {
//   return getFirstTextValue([
//     getSafeDisplayText(user?.displayName),
//     getSafeDisplayText(user?.name),
//     getSafeDisplayText(user?.fullName),
//     getSafeDisplayText(user?.userName),
//     getSafeDisplayText(user?.username),
//     getSafeDisplayText(user?.employeeName),
//     getSafeDisplayText(user?.email),
//   ]);
// }

// const CREATOR_NAME_OVERRIDES: Record<string, string> = {
//   // Example:
//   // "wVS6kzCFiYM5dFQSEZ5P7Y8SChg1": "Bilal Tariq",
// };

// function getRoleKey(role: any): string {
//   return String(role || "")
//     .toLowerCase()
//     .trim()
//     .replace(/[\s-]+/g, "_");
// }

// function isAdminRole(role: any): boolean {
//   const roleKey = getRoleKey(role);

//   return ["admin", "main_admin", "super_admin"].includes(roleKey);
// }

// function isFinanceApproverRole(role: any): boolean {
//   const roleKey = getRoleKey(role);

//   return ["finance", "financial_admin", "finance_admin"].includes(roleKey);
// }

// function isOperationRole(role: any): boolean {
//   const roleKey = getRoleKey(role);

//   return ["operation", "operations"].includes(roleKey);
// }

// function canRoleCreateBudgetRequest(role: any): boolean {
//   const roleKey = getRoleKey(role);
//   if (!roleKey) return false;

//   return !isAdminRole(roleKey);
// }

// function canRoleSeeAllBudgetRequests(role: any): boolean {
//   return isAdminRole(role) || isFinanceApproverRole(role);
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

//   if (
//     normalizedStatus === "pending_main_admin" ||
//     normalizedStatus === "pending_admin"
//   ) {
//     return "Pending Admin";
//   }

//   if (normalizedStatus === "pending_operational_admin") return "Pending Admin";
//   if (normalizedStatus === "pending_finance") return "Pending Finance";
//   if (normalizedStatus === "payment_partially_released") {
//     return "Payment Partially Released";
//   }
//   if (normalizedStatus === "rejected")
//     return getReturnedToRoleStatusLabel(invoice);

//   return formatStatus(status);
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
//   const [isPaymentHistoryModalOpen, setIsPaymentHistoryModalOpen] =
//     useState(false);
//   const [paymentHistoryInvoice, setPaymentHistoryInvoice] =
//     useState<InvoiceRequest | null>(null);
//   const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
//   const [rejectionLoading, setRejectionLoading] = useState(false);

//   const [searchTerm, setSearchTerm] = useState("");
//   const [typeFilter, setTypeFilter] = useState<"all" | "project" | "general">(
//     "all",
//   );
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [dateFrom, setDateFrom] = useState("");
//   const [dateTo, setDateTo] = useState("");
//   const [monthFilter, setMonthFilter] = useState("");
//   const [createdByFilter, setCreatedByFilter] = useState("all");
//   const [projectCodeFilter, setProjectCodeFilter] = useState("");
//   const [vendorFilter, setVendorFilter] = useState("");
//   const [chequeFilter, setChequeFilter] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pageSize, setPageSize] = useState(10);

//   const { data: invoices = [], loading } = useFirestoreQuery<InvoiceRequest>(
//     `Panels/${PANEL_ID}/invoiceRequests`,
//   );

//   const { data: expenseSheets = [] } = useFirestoreQuery<any>(
//     `Panels/${PANEL_ID}/expenseSheets`,
//   );

//   const { data: purchaseOrders = [] } = useFirestoreQuery<any>(
//     `Panels/${PANEL_ID}/purchaseOrders`,
//   );

//   const { data: users = [] } = useFirestoreQuery<any>("users");

//   const { data: panelUsers = [] } = useFirestoreQuery<any>(
//     `Panels/${PANEL_ID}/users`,
//   );

//   const CREATE_PO_ROUTE = "/create-po";

//   function getRequestType(invoice: any): "general" | "project" {
//     const rawType = String(
//       invoice?.invoiceType || invoice?.type || "",
//     ).toLowerCase();

//     if (rawType === "project") return "project";
//     if (rawType === "general") return "general";

//     return invoice?.clientName ||
//       invoice?.project ||
//       invoice?.projectName ||
//       invoice?.projectCode
//       ? "project"
//       : "general";
//   }

//   function isProjectRequest(invoice: any): boolean {
//     return getRequestType(invoice) === "project";
//   }

//   function getLinkedPO(invoice: any): any | null {
//     const requestId = String(invoice?.requestId || "").trim();
//     const invoiceDocId = String(invoice?.id || "").trim();
//     const estimateId = String(invoice?.estimateId || "").trim();
//     const estimateNumber = String(
//       invoice?.estimateNumber ||
//         invoice?.estimateNo ||
//         invoice?.estimateValue ||
//         invoice?.selectedEstimate ||
//         invoice?.selectEstimate ||
//         "",
//     ).trim();

//     return (
//       purchaseOrders.find((po: any) => {
//         const poRequestDocLinks = [
//           po?.invoiceRequestId,
//           po?.linkedInvoiceId,
//           po?.sourceInvoiceId,
//           po?.budgetRequestDocId,
//           po?.sourceBudgetRequestId,
//           po?.requestDocId,
//           po?.invoiceId,
//         ]
//           .filter(Boolean)
//           .map((value) => String(value).trim());

//         const poRequestIdLinks = [
//           po?.requestId,
//           po?.budgetRequestId,
//           po?.linkedRequestId,
//           po?.sourceRequestId,
//           po?.invoiceNumber,
//           po?.budgetRequestNumber,
//         ]
//           .filter(Boolean)
//           .map((value) => String(value).trim());

//         const poEstimateLinks = [
//           po?.estimateId,
//           po?.estimateNumber,
//           po?.estimateNo,
//           po?.selectedEstimate,
//         ]
//           .filter(Boolean)
//           .map((value) => String(value).trim());

//         return (
//           Boolean(invoiceDocId && poRequestDocLinks.includes(invoiceDocId)) ||
//           Boolean(requestId && poRequestIdLinks.includes(requestId)) ||
//           Boolean(estimateId && poEstimateLinks.includes(estimateId)) ||
//           Boolean(estimateNumber && poEstimateLinks.includes(estimateNumber))
//         );
//       }) || null
//     );
//   }

//   function hasPOAlready(invoice: any): boolean {
//     const status = normalizeText(invoice?.status);
//     const poStatus = normalizeText(
//       invoice?.poStatus || invoice?.purchaseOrderStatus,
//     );

//     const statusSaysPOCreated = [
//       "po_created",
//       "po_submitted",
//       "po_approved",
//       "po_issued",
//       "ready_for_payment",
//     ].includes(status);

//     const poStatusSaysCreated = [
//       "created",
//       "submitted",
//       "approved",
//       "issued",
//       "ready_for_payment",
//     ].includes(poStatus);

//     const hasDirectPOFields = Boolean(
//       invoice?.poSubmitted ||
//         invoice?.poCreated ||
//         invoice?.purchaseOrderCreated ||
//         invoice?.purchaseOrderSubmitted ||
//         invoice?.poId ||
//         invoice?.poNumber ||
//         invoice?.poDocId ||
//         invoice?.purchaseOrderId ||
//         invoice?.purchaseOrderNumber ||
//         invoice?.poCreatedAt ||
//         invoice?.purchaseOrderCreatedAt,
//     );

//     return Boolean(
//       statusSaysPOCreated ||
//         poStatusSaysCreated ||
//         hasDirectPOFields ||
//         getLinkedPO(invoice),
//     );
//   }

//   function hasPaymentReleased(invoice: any): boolean {
//     return isPaymentFullyReleased(invoice);
//   }

//   function hasAnyPaymentRelease(invoice: any): boolean {
//     return (
//       getTotalReleasedAmount(invoice) > 0 ||
//       getPaymentReleaseHistory(invoice).length > 0
//     );
//   }

//   function getExpenseAmount(invoice: any): number {
//     return safeNumber(
//       invoice?.approvedAmount || invoice?.totalAmount || invoice?.amount,
//     );
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
//     if (!userProfile || userProfile.role !== "operation") return false;

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
//     const vendorName =
//       request.vendorName ||
//       request.supplierName ||
//       getFirstVendorName(request) ||
//       request.clientName ||
//       "";
//     const amount = getExpenseAmount(request);

//     return {
//       ...request,
//       invoiceNumber: request.requestId,
//       linkedRequestId: request.requestId,
//       budgetRequestId: request.requestId,
//       invoiceRequestId: request.id,
//       linkedInvoiceId: request.id,
//       sourceInvoiceId: request.id,
//       sourceType: "budget_request",
//       approvalRequired: false,
//       requiresApproval: false,
//       adminApprovalRequired: false,
//       autoApproved: true,
//       autoApprovedReason:
//         "Created from approved budget request. No further approval required.",
//       expenseStatus: "submitted",
//       status: "submitted",
//       invoiceType: requestType,
//       requestType,
//       amount,
//       totalAmount: amount,
//       approvedAmount: amount,
//       vendorName,
//       supplierName: request.supplierName || vendorName,
//       clientName: request.clientName || "",
//       projectName,
//       project: projectName,
//       projectCode: request.projectCode || "",
//       poId: request.poId || "",
//       poNumber: request.poNumber || "",
//       dueDate: new Date(),
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
//     } catch (error: any) {
//       console.error("Failed to mark expense as submitted:", error);
//       toast({
//         title: "Expense submitted",
//         description:
//           "Expense was submitted, but the request status could not be updated.",
//       });
//     } finally {
//       setIsExpenseModalOpen(false);
//       setSelectedInvoice(null);
//       localStorage.removeItem("submitExpenseFromBudgetRequest");
//       localStorage.removeItem("expenseSheetSource");
//     }
//   }

//   async function handlePaymentReleased() {
//     // PaymentReleaseModal already updates the request with the latest partial/full
//     // release totals. Do not overwrite it here, otherwise partial releases would be
//     // forced into the final payment_released state.
//     toast({
//       title: "Payment release saved",
//       description: "The payment release history has been updated successfully.",
//     });

//     setIsPaymentModalOpen(false);
//     setSelectedInvoice(null);
//   }

//   function getFirstVendorName(invoice: any): string {
//     const lineItems = Array.isArray(invoice?.lineItems)
//       ? invoice.lineItems
//       : [];
//     const approvedItems = Array.isArray(invoice?.approvalItems)
//       ? invoice.approvalItems
//       : [];
//     const allItems = [...approvedItems, ...lineItems];

//     const matchedItem = allItems.find(
//       (item: any) =>
//         item?.vendor ||
//         item?.vendorName ||
//         item?.supplier ||
//         item?.supplierName ||
//         item?.original?.vendor ||
//         item?.original?.supplier,
//     );

//     return (
//       matchedItem?.vendor ||
//       matchedItem?.vendorName ||
//       matchedItem?.supplier ||
//       matchedItem?.supplierName ||
//       matchedItem?.original?.vendor ||
//       matchedItem?.original?.supplier ||
//       ""
//     );
//   }

//   function getVendorFilterText(invoice: any): string {
//     return getFirstTextValue([
//       invoice?.vendorName,
//       invoice?.supplierName,
//       getFirstVendorName(invoice),
//     ]);
//   }

//   function handleCreatePO(invoice: InvoiceRequest) {
//     const request: any = invoice;

//     localStorage.setItem(
//       "createPOFromBudgetRequest",
//       JSON.stringify({
//         invoiceRequestId: request.id,
//         budgetRequestDocId: request.id,
//         budgetRequestId: request.requestId,
//         requestId: request.requestId,
//         invoiceType: getRequestType(request),
//         sourceType: "budget_request",
//         returnToBudgetRequests: true,
//         updateBudgetRequestAfterPO: true,

//         estimateId: request.estimateId || "",
//         estimateNumber:
//           request.estimateNumber ||
//           request.estimateNo ||
//           request.estimateValue ||
//           request.selectedEstimate ||
//           request.selectEstimate ||
//           "",

//         clientName: request.clientName || "",
//         projectName: request.projectName || request.project || "",
//         project: request.project || request.projectName || "",
//         projectCode: request.projectCode || "",
//         title: request.title || request.subject || "",
//         subject: request.subject || "",
//         message: request.message || "",

//         supplierId: request.supplierId || request.vendorId || "",
//         supplierName:
//           request.supplierName ||
//           request.vendorName ||
//           getFirstVendorName(request),
//         vendorName:
//           request.vendorName ||
//           request.supplierName ||
//           getFirstVendorName(request),

//         totalAmount: Number(request.totalAmount || 0),
//         approvedAmount: Number(
//           request.approvedAmount || request.totalAmount || 0,
//         ),

//         approvalItems: request.approvalItems || [],
//         lineItems: request.lineItems || [],
//         items: request.items || request.lineItems || [],
//       }),
//     );

//     setLocation(CREATE_PO_ROUTE);
//   }

//   async function handleApprove(invoice: InvoiceRequest) {
//     if (!userProfile) return;

//     const roleKey = getRoleKey(userProfile.role);
//     const status = normalizeText(invoice.status);
//     const approvalHistory = Array.isArray((invoice as any).approvalHistory)
//       ? (invoice as any).approvalHistory
//       : [];

//     let newStatus = status;
//     let currentApprover = String((invoice as any).currentApprover || "");

//     const updatePayload: Record<string, any> = {
//       approvalHistory: [
//         ...approvalHistory,
//         {
//           approver:
//             userProfile.displayName ||
//             (userProfile as any)?.name ||
//             userProfile.email ||
//             roleKey,
//           approverRole: roleKey,
//           action: "approved",
//           timestamp: new Date(),
//           notes: "",
//         },
//       ],
//       returnedToCreator: false,
//       needsCreatorRevision: false,
//       returnedToRole: "",
//       returnedToRoleLabel: "",
//       updatedAt: serverTimestamp(),
//     };

//     if (isAdminRole(roleKey) && isWaitingForAdminApproval(invoice)) {
//       newStatus = "pending_finance";
//       currentApprover = "finance";
//       updatePayload.adminApprovedAt = serverTimestamp();
//       updatePayload.adminApprovedBy =
//         userProfile.displayName || userProfile.email || "";
//       updatePayload.adminApprovedById =
//         userProfile.id ||
//         (userProfile as any)?.uid ||
//         (userProfile as any)?.userId ||
//         userProfile.email ||
//         "";
//     } else if (isFinanceApproverRole(roleKey) && status === "pending_finance") {
//       newStatus = "approved";
//       currentApprover = "";
//       updatePayload.financeApprovedAt = serverTimestamp();
//       updatePayload.financeApprovedBy =
//         userProfile.displayName || userProfile.email || "";
//       updatePayload.financeApprovedById =
//         userProfile.id ||
//         (userProfile as any)?.uid ||
//         (userProfile as any)?.userId ||
//         userProfile.email ||
//         "";
//       updatePayload.approvedAt = serverTimestamp();
//     } else {
//       toast({
//         title: "Action not allowed",
//         description:
//           "This request is not currently assigned to your approval stage.",
//         variant: "destructive",
//       });
//       return;
//     }

//     try {
//       await updateDoc(
//         doc(db, "Panels", PANEL_ID, "invoiceRequests", invoice.id),
//         {
//           ...updatePayload,
//           status: newStatus,
//           currentApprover,
//         },
//       );

//       toast({
//         title: "Success",
//         description: "Budget request approved successfully",
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

//   async function handleReject(
//     invoice: InvoiceRequest,
//     rejectionComment: string,
//   ) {
//     if (!userProfile) return;

//     try {
//       setRejectionLoading(true);

//       const roleKey = getRoleKey(userProfile.role);
//       const ownerId = getBudgetRequestOwnerId(invoice);
//       const approvalHistory = Array.isArray((invoice as any).approvalHistory)
//         ? (invoice as any).approvalHistory
//         : [];

//       const returnedToRole = getBudgetRequestOwnerRole(invoice);
//       const returnedToRoleLabel = formatRoleLabel(returnedToRole);

//       await updateDoc(
//         doc(db, "Panels", PANEL_ID, "invoiceRequests", invoice.id),
//         {
//           status: "rejected",
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
//               approverRole: roleKey,
//               action: "rejected",
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
//           returnedToRoleLabel || "the original role"
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

//   function getStatusBadgeColor(status: string, invoice?: any): string {
//     if (invoice && wasReturnedToCreator(invoice)) {
//       return "border-red-200 bg-red-50 text-red-700";
//     }

//     switch (status) {
//       case "approved":
//       case "payment_released":
//       case "expense_submitted":
//       case "expense_completed":
//         return "border-green-200 bg-green-50 text-green-700";
//       case "rejected":
//       case "returned_to_creator":
//       case "changes_requested":
//         return "border-red-200 bg-red-50 text-red-700";
//       case "pending_operational_admin":
//       case "pending_main_admin":
//       case "pending_admin":
//       case "pending_finance":
//         return "border-amber-200 bg-amber-50 text-amber-700";
//       case "payment_partially_released":
//         return "border-blue-200 bg-blue-50 text-blue-700";
//       default:
//         return "border-slate-200 bg-slate-50 text-slate-700";
//     }
//   }

//   function getTypeBadgeColor(type: "general" | "project") {
//     return type === "project"
//       ? "border-indigo-200 bg-indigo-50 text-indigo-700"
//       : "border-slate-200 bg-slate-50 text-slate-700";
//   }

//   function getCurrentStep(invoice: InvoiceRequest): string {
//     const status = normalizeText(invoice.status || "");

//     if (
//       (invoice as any).expenseSubmitted ||
//       status === "expense_submitted" ||
//       hasExpenseSheet(invoice)
//     ) {
//       return "Expense Submitted / No Approval Required";
//     }

//     if (hasPaymentReleased(invoice)) {
//       return "Payment Released / Ready for Expense";
//     }

//     if (hasPartialPaymentReleased(invoice)) {
//       return `Partial Payment Released / Remaining Rs ${formatPKR(
//         getRemainingPaymentBalance(invoice),
//       )}`;
//     }

//     if (isProjectRequest(invoice) && hasPOAlready(invoice)) {
//       return "PO Created / Ready for Payment";
//     }

//     if (wasReturnedToCreator(invoice)) {
//       return `${getBudgetRequestStatusLabel(invoice)} / Waiting for Resubmission`;
//     }

//     switch (status) {
//       case "pending_operational_admin":
//       case "pending_main_admin":
//       case "pending_admin":
//         return "Admin Approval";
//       case "pending_finance":
//         return "Finance Approval";
//       case "approved":
//         return isProjectRequest(invoice) ? "Ready for PO" : "Ready for Payment";
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
//         return "Payment Released / Ready for Expense";
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
//     if (!userProfile) return false;

//     const roleKey = getRoleKey(userProfile.role);

//     if (isAdminRole(roleKey)) {
//       return isWaitingForAdminApproval(invoice);
//     }

//     if (isFinanceApproverRole(roleKey)) {
//       return normalizeText(invoice.status) === "pending_finance";
//     }

//     return false;
//   }

//   function canEdit(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;

//     if (!isOwnBudgetRequest(invoice)) return false;

//     if (hasAdminApprovedBudgetRequest(invoice)) return false;

//     const status = normalizeText(invoice.status);

//     return (
//       wasReturnedToCreator(invoice) ||
//       status === "draft" ||
//       status === "pending_main_admin" ||
//       status === "pending_admin" ||
//       status === "pending_operational_admin" ||
//       status === ""
//     );
//   }

//   function getEditableInvoice(invoice: InvoiceRequest): InvoiceRequest {
//     if (hasAdminApprovedBudgetRequest(invoice)) return invoice;

//     if (!wasReturnedToCreator(invoice)) return invoice;

//     return {
//       ...(invoice as any),
//       status: "pending_main_admin",
//       currentApprover: "main_admin",
//       returnedToCreator: false,
//       needsCreatorRevision: false,
//       returnedToRole: "",
//       returnedToRoleLabel: "",
//       resubmittedAt: new Date(),
//     } as InvoiceRequest;
//   }

//   function canReleasePayment(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;

//     const isFinanceUser = isFinanceApproverRole(userProfile.role);
//     if (!isFinanceUser) return false;

//     if (hasPaymentReleased(invoice)) return false;

//     if (getRemainingPaymentBalance(invoice) <= 0.009) return false;

//     if (
//       (invoice as any).expenseSubmitted ||
//       String(invoice.status) === "expense_submitted"
//     ) {
//       return false;
//     }

//     const status = normalizeText(invoice.status);
//     const readyForPayment = [
//       "approved",
//       "po_created",
//       "po_submitted",
//       "po_approved",
//       "po_issued",
//       "ready_for_payment",
//       "payment_partially_released",
//     ].includes(status);

//     if (!readyForPayment) return false;

//     if (!isProjectRequest(invoice)) return true;

//     return hasPOAlready(invoice);
//   }

//   function canCreatePO(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;

//     return (
//       isFinanceApproverRole(userProfile.role) &&
//       normalizeText(invoice.status) === "approved" &&
//       isProjectRequest(invoice) &&
//       !hasPOAlready(invoice) &&
//       !hasPaymentReleased(invoice)
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

//     if (!expenseSheets) return null;

//     const expenseSheet = expenseSheets.find((expense: any) =>
//       isExpenseLinkedToRequest(expense, invoice),
//     );

//     return expenseSheet?.status || expenseSheet?.expenseStatus || null;
//   }

//   const canCreateInvoices = canRoleCreateBudgetRequest(currentUserRole);

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

//       if (!lookupKey) continue;

//       const matchedUser = usersByLookup.get(lookupKey);
//       if (matchedUser) return matchedUser;
//     }

//     return null;
//   }

//   function canCurrentUserSeeAllBudgetRequests() {
//     const userRecord = getCurrentUserRecordFromUsersCollection();
//     const effectiveRole = getRoleKey(currentUserRole || userRecord?.role);

//     if (canRoleSeeAllBudgetRequests(effectiveRole)) return true;

//     if (!isOperationRole(effectiveRole)) return false;

//     return Boolean(
//       (userProfile as any)?.canViewAllBudgetRequests ||
//         userRecord?.canViewAllBudgetRequests,
//     );
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

//         if (lookupKey) map.set(lookupKey, user);
//       });
//     });

//     return map;
//   }, [users, panelUsers]);

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
//     if (directRole) return directRole;

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

//       if (!lookupKey) continue;

//       const matchedUser = usersByLookup.get(lookupKey);
//       const matchedRole = getUserRoleLabel(matchedUser);

//       if (matchedRole) return matchedRole;
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

//     if (isCurrentUserOwner) return getRoleKey(userProfile?.role);

//     return "";
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

//     return getStatusLabel(invoice?.status || "", invoice);
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

//       if (!name) return;

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

//         if (lookupKey && !map.has(lookupKey)) map.set(lookupKey, name);
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

//     if (directName) return directName;

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

//       if (!lookupKey) continue;

//       const overrideName = getSafeDisplayText(
//         CREATOR_NAME_OVERRIDES[rawKey] || CREATOR_NAME_OVERRIDES[lookupKey],
//       );

//       if (overrideName) return overrideName;

//       const nameFromAnotherRequest = getSafeDisplayText(
//         creatorNamesByLookup.get(lookupKey),
//       );

//       if (nameFromAnotherRequest) return nameFromAnotherRequest;

//       const matchedUser = usersByLookup.get(lookupKey);
//       const matchedName = getSafeDisplayText(getUserDisplayName(matchedUser));

//       if (matchedName) return matchedName;
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

//     const ownerLookupValues = lookupValues
//       .map((value) =>
//         String(value || "")
//           .trim()
//           .toLowerCase(),
//       )
//       .filter(Boolean);

//     const isCurrentUserOwner = ownerLookupValues.some((ownerKey) =>
//       currentUserLookupValues.includes(ownerKey),
//     );

//     if (isCurrentUserOwner) {
//       const currentUserName = getFirstTextValue([
//         getSafeDisplayText(userProfile?.displayName),
//         getSafeDisplayText((userProfile as any)?.name),
//         getSafeDisplayText((userProfile as any)?.fullName),
//         getSafeDisplayText(userProfile?.email),
//       ]);

//       if (currentUserName) return currentUserName;
//     }

//     const emailFallback = getFirstTextValue([
//       getSafeDisplayText(invoice?.createdByEmail),
//       getSafeDisplayText(invoice?.submittedByEmail),
//       getSafeDisplayText(invoice?.email),
//     ]);

//     if (emailFallback) return emailFallback;

//     return "Unknown User";
//   }

//   const visibleInvoicesForFilterOptions = useMemo(() => {
//     return (invoices || []).filter((invoice: any) => {
//       const canSeeAllRequests = canCurrentUserSeeAllBudgetRequests();
//       return canSeeAllRequests || isOwnBudgetRequest(invoice);
//     });
//   }, [invoices, userProfile, currentUserRole, usersByLookup]);

//   const createdByOptions = useMemo(() => {
//     const names = Array.from(
//       new Set(
//         visibleInvoicesForFilterOptions
//           .map((invoice: any) => getCreatedByName(invoice))
//           .filter((name) => String(name || "").trim()),
//       ),
//     );

//     return names.sort((a, b) => a.localeCompare(b));
//   }, [
//     visibleInvoicesForFilterOptions,
//     usersByLookup,
//     creatorNamesByLookup,
//     userProfile,
//   ]);

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

//   const statusOptions = useMemo(() => {
//     const uniqueStatuses = Array.from(
//       new Set(
//         (invoices || []).map((invoice) => invoice.status).filter(Boolean),
//       ),
//     );

//     return uniqueStatuses.sort();
//   }, [invoices]);

//   const filteredInvoices = useMemo(() => {
//     const search = normalizeText(searchTerm);
//     const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
//     const toDate = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

//     return (invoices || []).filter((invoice: any) => {
//       const requestType = getRequestType(invoice);
//       const requestDate = getRequestDate(invoice);
//       const requestDateInputValue = getDateInputValue(requestDate);
//       const createdByName = getCreatedByName(invoice);
//       const projectCode = String(invoice?.projectCode || "").trim();
//       const vendorName = getVendorFilterText(invoice);
//       const chequeFilterText = getChequeFilterText(invoice);
//       const descriptionSearchText = getDescriptionSearchText(invoice);

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
//           descriptionSearchText,
//           createdByName,
//           (invoice as any).createdByName,
//           (invoice as any).submittedByName,
//           (invoice as any).requestedByName,
//           (invoice as any).createdByEmail,
//           (invoice as any).submittedByEmail,
//         ].join(" "),
//       );

//       const matchesSearch = !search || haystack.includes(search);
//       const matchesType = typeFilter === "all" || requestType === typeFilter;
//       const matchesStatus =
//         statusFilter === "all" || invoice.status === statusFilter;
//       const matchesMonth =
//         !monthFilter || requestDateInputValue.startsWith(monthFilter);
//       const matchesCreatedBy =
//         createdByFilter === "all" ||
//         normalizeText(createdByName) === normalizeText(createdByFilter);
//       const matchesProjectCode =
//         !normalizeText(projectCodeFilter) ||
//         normalizeText(projectCode).includes(normalizeText(projectCodeFilter));
//       const matchesVendor =
//         !normalizeText(vendorFilter) ||
//         normalizeText(vendorName).includes(normalizeText(vendorFilter));
//       const matchesCheque =
//         !normalizeText(chequeFilter) ||
//         normalizeText(chequeFilterText).includes(normalizeText(chequeFilter));
//       const matchesFrom = !fromDate || (requestDate && requestDate >= fromDate);
//       const matchesTo = !toDate || (requestDate && requestDate <= toDate);
//       const canSeeAllRequests = canCurrentUserSeeAllBudgetRequests();
//       const matchesOwnership = canSeeAllRequests || isOwnBudgetRequest(invoice);

//       return (
//         matchesOwnership &&
//         matchesSearch &&
//         matchesType &&
//         matchesStatus &&
//         matchesMonth &&
//         matchesCreatedBy &&
//         matchesProjectCode &&
//         matchesVendor &&
//         matchesCheque &&
//         matchesFrom &&
//         matchesTo
//       );
//     });
//   }, [
//     dateFrom,
//     dateTo,
//     invoices,
//     monthFilter,
//     searchTerm,
//     statusFilter,
//     typeFilter,
//     createdByFilter,
//     projectCodeFilter,
//     vendorFilter,
//     chequeFilter,
//     userProfile,
//     currentUserRole,
//     usersByLookup,
//     creatorNamesByLookup,
//   ]);

//   const summary = useMemo(() => {
//     const totalAmount = filteredInvoices.reduce(
//       (sum, invoice: any) => sum + safeNumber(invoice.totalAmount),
//       0,
//     );

//     const projectCount = filteredInvoices.filter(
//       (invoice) => getRequestType(invoice) === "project",
//     ).length;

//     const generalCount = filteredInvoices.filter(
//       (invoice) => getRequestType(invoice) === "general",
//     ).length;

//     const approvedCount = filteredInvoices.filter(
//       (invoice) => invoice.status === "approved",
//     ).length;

//     return { totalAmount, projectCount, generalCount, approvedCount };
//   }, [filteredInvoices]);

//   const sortedInvoices = useMemo(() => {
//     return [...filteredInvoices].sort((a, b) =>
//       compareBudgetRequestsForTable(
//         a,
//         b,
//         currentUserRole,
//         canReleasePayment,
//       ),
//     );
//   }, [filteredInvoices, currentUserRole, purchaseOrders, userProfile]);

//   const totalPages = Math.max(1, Math.ceil(sortedInvoices.length / pageSize));
//   const startIndex = (currentPage - 1) * pageSize;
//   const paginatedInvoices = sortedInvoices.slice(
//     startIndex,
//     startIndex + pageSize,
//   );
//   const showingFrom = sortedInvoices.length === 0 ? 0 : startIndex + 1;
//   const showingTo = Math.min(startIndex + pageSize, sortedInvoices.length);

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
//     chequeFilter,
//     pageSize,
//   ]);

//   useEffect(() => {
//     if (currentPage > totalPages) setCurrentPage(totalPages);
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
//     setChequeFilter("");
//     setPageSize(10);
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
//             <p className="mt-2 max-w-2xl text-sm text-slate-500">
//               Review project and general budget requests, send requests through
//               Admin and Finance approval, release payments, or create POs.
//             </p>
//           </div>

//           {canCreateInvoices && (
//             <Button
//               className="h-11 rounded-2xl px-5 shadow-sm"
//               onClick={() => {
//                 setSelectedInvoice(null);
//                 setIsInvoiceModalOpen(true);
//               }}
//               data-testid="button-new-invoice-request"
//             >
//               + New Request
//             </Button>
//           )}
//         </div>

//         <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
//                 Filtered Value
//               </p>
//               <p className="mt-3 text-2xl font-semibold text-slate-950">
//                 Rs {formatPKR(summary.totalAmount)}
//               </p>
//               <p className="mt-1 text-xs text-slate-400">
//                 Approved waiting: {summary.approvedCount}
//               </p>
//             </CardContent>
//           </Card>
//         </div>

//         <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//           <CardContent className="space-y-4 p-5">
//             <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
//               <div className="xl:col-span-2">
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Search
//                 </label>
//                 <input
//                   value={searchTerm}
//                   onChange={(event) => setSearchTerm(event.target.value)}
//                   placeholder="Request ID, item, description, client, project..."
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Created By
//                 </label>
//                 <select
//                   value={createdByFilter}
//                   onChange={(event) => setCreatedByFilter(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 >
//                   <option value="all">All Creators</option>
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
//                   placeholder="Enter project code..."
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Request Type
//                 </label>
//                 <select
//                   value={typeFilter}
//                   onChange={(event) =>
//                     setTypeFilter(
//                       event.target.value as "all" | "project" | "general",
//                     )
//                   }
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 >
//                   <option value="all">All Types</option>
//                   <option value="project">Project</option>
//                   <option value="general">General</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Status
//                 </label>
//                 <select
//                   value={statusFilter}
//                   onChange={(event) => setStatusFilter(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 >
//                   <option value="all">All Statuses</option>
//                   {statusOptions.map((status) => (
//                     <option key={status} value={status}>
//                       {getStatusLabel(status)}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Month
//                 </label>
//                 <input
//                   type="month"
//                   value={monthFilter}
//                   onChange={(event) => setMonthFilter(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>
//             </div>

//             <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Vendor
//                 </label>
//                 <input
//                   value={vendorFilter}
//                   onChange={(event) => setVendorFilter(event.target.value)}
//                   placeholder="Enter vendor name..."
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Cheque Number
//                 </label>
//                 <input
//                   value={chequeFilter}
//                   onChange={(event) => setChequeFilter(event.target.value)}
//                   placeholder="Enter cheque number..."
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   From Date
//                 </label>
//                 <input
//                   type="date"
//                   value={dateFrom}
//                   onChange={(event) => setDateFrom(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   To Date
//                 </label>
//                 <input
//                   type="date"
//                   value={dateTo}
//                   onChange={(event) => setDateTo(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">
//                   Rows
//                 </label>
//                 <select
//                   value={pageSize}
//                   onChange={(event) => setPageSize(Number(event.target.value))}
//                   className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
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

//         <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm">
//           <CardContent className="p-0">
//             <div className="overflow-x-auto">
//               <table className="w-full min-w-[1400px]">
//                 <thead>
//                   <tr className="border-b border-slate-200 bg-slate-50/80">
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Request ID
//                     </th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Type
//                     </th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Client / Title
//                     </th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Project
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
//                       <td colSpan={11} className="px-6 py-12 text-center">
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
//                         type === "general"
//                           ? (invoice as any).title ||
//                             (invoice as any).subject ||
//                             "General Request"
//                           : (invoice as any).clientName || "-";

//                       const projectName =
//                         type === "project"
//                           ? (invoice as any).projectName ||
//                             (invoice as any).project ||
//                             (invoice as any).projectCode ||
//                             "-"
//                           : "-";

//                       const createdByName = getCreatedByName(invoice);
//                       const approvedPaymentAmount =
//                         getApprovedPaymentAmount(invoice);
//                       const totalReleasedAmount =
//                         getTotalReleasedAmount(invoice);
//                       const remainingPaymentBalance =
//                         getRemainingPaymentBalance(invoice);
//                       const paymentHistory = getPaymentReleaseHistory(invoice);
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

//                       return (
//                         <tr
//                           key={invoice.id}
//                           className="transition hover:bg-slate-50/80"
//                         >
//                           <td
//                             className="px-5 py-4 text-sm font-semibold text-slate-900"
//                             data-testid={`text-request-id-${invoice.id}`}
//                           >
//                             {invoice.requestId || "-"}
//                           </td>

//                           <td className="px-5 py-4">
//                             <Badge
//                               variant="outline"
//                               className={`rounded-full px-3 py-1 ${getTypeBadgeColor(
//                                 type,
//                               )}`}
//                             >
//                               {type === "project" ? "Project" : "General"}
//                             </Badge>
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-700">
//                             <div className="font-medium text-slate-900">
//                               {displayClientOrTitle}
//                             </div>
//                             {(invoice as any).projectCode &&
//                               type === "project" && (
//                                 <div className="mt-1 text-xs text-slate-400">
//                                   Code: {(invoice as any).projectCode}
//                                 </div>
//                               )}
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-600">
//                             {projectName}
//                           </td>

//                           <td
//                             className="px-5 py-4 text-sm font-medium text-slate-700"
//                             data-testid={`text-created-by-${invoice.id}`}
//                           >
//                             {createdByName}
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-600">
//                             {formatRequestDate(invoice)}
//                           </td>

//                           <td className="px-5 py-4 text-sm font-semibold text-slate-900">
//                             Rs{" "}
//                             {formatPKR(
//                               approvedPaymentAmount || invoice.totalAmount,
//                             )}
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-600">
//                             <div className="space-y-2">
//                               <div className="flex items-center justify-between gap-3">
//                                 <span className="text-xs text-slate-500">
//                                   Released
//                                 </span>
//                                 <span className="font-semibold text-slate-900">
//                                   Rs {formatPKR(totalReleasedAmount)}
//                                 </span>
//                               </div>
//                               <div className="h-2 overflow-hidden rounded-full bg-slate-100">
//                                 <div
//                                   className="h-full rounded-full bg-slate-950"
//                                   style={{
//                                     width: `${paymentProgressPercent}%`,
//                                   }}
//                                 />
//                               </div>
//                               <div className="flex items-center justify-between gap-3">
//                                 <span className="text-xs text-slate-500">
//                                   Balance
//                                 </span>
//                                 <span className="font-semibold text-slate-900">
//                                   Rs {formatPKR(remainingPaymentBalance)}
//                                 </span>
//                               </div>
//                             </div>
//                           </td>

//                           <td className="px-5 py-4">
//                             <Badge
//                               variant="outline"
//                               className={`rounded-full px-3 py-1 ${getStatusBadgeColor(
//                                 invoice.status,
//                                 invoice,
//                               )}`}
//                             >
//                               {getBudgetRequestStatusLabel(invoice)}
//                             </Badge>
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-500">
//                             {getCurrentStep(invoice)}
//                           </td>

//                           <td className="px-5 py-4">
//                             <div className="flex flex-wrap gap-2">
//                               <Button
//                                 variant="outline"
//                                 size="sm"
//                                 className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
//                                 onClick={() => openDetailsModal(invoice)}
//                                 data-testid={`button-view-details-${invoice.id}`}
//                               >
//                                 View
//                               </Button>

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
//                                           "This request can no longer be edited because it has already been approved by Admin.",
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

//                               {canReleasePayment(invoice) && (
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   className="rounded-xl border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
//                                   onClick={() => {
//                                     const linkedPO = getLinkedPO(invoice);

//                                     setSelectedInvoice({
//                                       ...invoice,
//                                       invoiceNumber: invoice.requestId,
//                                       vendorName:
//                                         (invoice as any).vendorName ||
//                                         (invoice as any).supplierName ||
//                                         (invoice as any).clientName,
//                                       amount: remainingPaymentBalance,
//                                       approvedAmount: approvedPaymentAmount,
//                                       totalApprovedAmount:
//                                         approvedPaymentAmount,
//                                       totalReleasedAmount,
//                                       remainingReleaseAmount:
//                                         remainingPaymentBalance,
//                                       dueDate: new Date(),
//                                       poId:
//                                         (invoice as any).poId ||
//                                         (invoice as any).poDocId ||
//                                         linkedPO?.id ||
//                                         linkedPO?.poId ||
//                                         linkedPO?.poDocId ||
//                                         "",
//                                       poNumber:
//                                         (invoice as any).poNumber ||
//                                         (invoice as any).purchaseOrderNumber ||
//                                         linkedPO?.poNumber ||
//                                         linkedPO?.purchaseOrderNumber ||
//                                         "",
//                                     } as any);
//                                     setIsPaymentModalOpen(true);
//                                   }}
//                                   data-testid={`button-release-payment-${invoice.id}`}
//                                 >
//                                   Release Payment
//                                 </Button>
//                               )}

//                               {hasAnyPaymentRelease(invoice) && (
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
//                                   History ({paymentHistory.length})
//                                 </Button>
//                               )}

//                               {canCreatePO(invoice) && (
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   className="rounded-xl border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
//                                   onClick={() => handleCreatePO(invoice)}
//                                   data-testid={`button-create-po-${invoice.id}`}
//                                 >
//                                   Create PO
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

//               <div className="flex items-center gap-2">
//                 <Button
//                   type="button"
//                   variant="outline"
//                   size="sm"
//                   className="rounded-xl border-slate-200"
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
//                     type="button"
//                     variant={page === currentPage ? "default" : "outline"}
//                     size="sm"
//                     className="h-9 w-9 rounded-xl p-0"
//                     onClick={() => setCurrentPage(page)}
//                   >
//                     {page}
//                   </Button>
//                 ))}

//                 <Button
//                   type="button"
//                   variant="outline"
//                   size="sm"
//                   className="rounded-xl border-slate-200"
//                   disabled={currentPage === totalPages}
//                   onClick={() =>
//                     setCurrentPage((page) => Math.min(totalPages, page + 1))
//                   }
//                 >
//                   Next
//                 </Button>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       <InvoiceRequestModal
//         isOpen={isInvoiceModalOpen}
//         onClose={() => {
//           setIsInvoiceModalOpen(false);
//           setSelectedInvoice(null);
//         }}
//         onSuccess={() => {
//           setIsInvoiceModalOpen(false);
//           setSelectedInvoice(null);
//         }}
//         editingInvoice={selectedInvoice}
//       />

//       <PaymentReleaseModal
//         isOpen={isPaymentModalOpen}
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
//       />

//       {isPaymentHistoryModalOpen && paymentHistoryInvoice && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
//           <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-xl">
//             <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-slate-200 bg-white/95 p-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
//               <div>
//                 <h2 className="text-lg font-semibold text-slate-950">
//                   Payment Release History
//                 </h2>
//                 <p className="mt-1 text-sm text-slate-500">
//                   Request ID: {paymentHistoryInvoice.requestId || "-"}
//                 </p>
//               </div>

//               <Button
//                 type="button"
//                 variant="outline"
//                 className="rounded-2xl border-slate-200"
//                 onClick={() => {
//                   setIsPaymentHistoryModalOpen(false);
//                   setPaymentHistoryInvoice(null);
//                 }}
//               >
//                 Close
//               </Button>
//             </div>

//             <div className="grid gap-4 border-b border-slate-100 p-5 md:grid-cols-3">
//               <div className="rounded-2xl bg-slate-50 p-4">
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                   Total Approved
//                 </p>
//                 <p className="mt-2 text-xl font-semibold text-slate-950">
//                   Rs{" "}
//                   {formatPKR(getApprovedPaymentAmount(paymentHistoryInvoice))}
//                 </p>
//               </div>
//               <div className="rounded-2xl bg-slate-50 p-4">
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                   Released So Far
//                 </p>
//                 <p className="mt-2 text-xl font-semibold text-slate-950">
//                   Rs {formatPKR(getTotalReleasedAmount(paymentHistoryInvoice))}
//                 </p>
//               </div>
//               <div className="rounded-2xl bg-slate-50 p-4">
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                   Remaining Balance
//                 </p>
//                 <p className="mt-2 text-xl font-semibold text-slate-950">
//                   Rs{" "}
//                   {formatPKR(getRemainingPaymentBalance(paymentHistoryInvoice))}
//                 </p>
//               </div>
//             </div>

//             <div className="p-5">
//               {getPaymentReleaseHistory(paymentHistoryInvoice).length === 0 ? (
//                 <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">
//                   No payment releases have been recorded yet.
//                 </div>
//               ) : (
//                 <div className="overflow-x-auto rounded-2xl border border-slate-200">
//                   <table className="w-full min-w-[850px] text-sm">
//                     <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
//                       <tr>
//                         <th className="px-4 py-3 text-left font-semibold">
//                           Date
//                         </th>
//                         <th className="px-4 py-3 text-left font-semibold">
//                           Type
//                         </th>
//                         <th className="px-4 py-3 text-left font-semibold">
//                           Method
//                         </th>
//                         <th className="px-4 py-3 text-left font-semibold">
//                           Amount
//                         </th>
//                         <th className="px-4 py-3 text-left font-semibold">
//                           Reference / Cheque
//                         </th>
//                         <th className="px-4 py-3 text-left font-semibold">
//                           Released By
//                         </th>
//                         <th className="px-4 py-3 text-left font-semibold">
//                           Notes
//                         </th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-slate-100">
//                       {[...getPaymentReleaseHistory(paymentHistoryInvoice)]
//                         .reverse()
//                         .map((entry: any, index: number) => (
//                           <tr
//                             key={
//                               entry?.id ||
//                               `${entry?.releasedAt || "release"}-${index}`
//                             }
//                           >
//                             <td className="px-4 py-3 text-slate-600">
//                               {getReleaseDateLabel(entry?.releasedAt)}
//                             </td>
//                             <td className="px-4 py-3">
//                               <Badge
//                                 variant="outline"
//                                 className="rounded-full border-slate-200 bg-slate-50 px-3 py-1 text-slate-700"
//                               >
//                                 {entry?.releaseType || "release"}
//                               </Badge>
//                             </td>
//                             <td className="px-4 py-3 text-slate-700">
//                               {getPaymentMethodLabel(entry?.paymentMethod)}
//                             </td>
//                             <td className="px-4 py-3 font-semibold text-slate-950">
//                               Rs {formatPKR(getPaymentReleaseAmount(entry))}
//                             </td>
//                             <td className="px-4 py-3 text-slate-600">
//                               <div>{entry?.transactionReference || "-"}</div>
//                               {Array.isArray(entry?.chequeNumbers) &&
//                                 entry.chequeNumbers.length > 0 && (
//                                   <div className="mt-1 text-xs text-slate-500">
//                                     Cheques: {entry.chequeNumbers.join(", ")}
//                                   </div>
//                                 )}
//                             </td>
//                             <td className="px-4 py-3 text-slate-600">
//                               {entry?.releasedByName || "-"}
//                             </td>
//                             <td className="px-4 py-3 text-slate-600">
//                               {entry?.paymentNotes || "-"}
//                             </td>
//                           </tr>
//                         ))}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

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









import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFirestoreQuery } from "@/hooks/useFirestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import InvoiceRequestModal from "@/components/BudgetRequestModal";
import PaymentReleaseModal from "@/components/PaymentReleaseModal";
import ExpenseSheetModal from "@/components/ExpenseSheetModal";
import InvoiceDetailsModal from "@/components/BudgetDetailsModal";
import { InvoiceRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import RejectionModal from "@/components/RejectionModal";
import PaymentHistoryModal from "@/components/PaymentHistoryModal";

function formatPKR(value: number | string | undefined) {
    if (value === null || value === undefined) return "0.00";
    const num =
        typeof value === "number"
            ? value
            : parseFloat(String(value).replace(/,/g, "")) || 0;

    return num.toLocaleString("en-PK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function safeNumber(value: any) {
    const parsed = Number(String(value ?? 0).replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
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

function getPaymentReleaseHistory(invoice: any): any[] {
    const history = Array.isArray(invoice?.paymentReleaseHistory)
        ? invoice.paymentReleaseHistory
        : [];

    if (history.length > 0) {
        return history.filter((entry: any) => getPaymentReleaseAmount(entry) > 0);
    }

    // Backward compatibility for older records that only saved a single paymentDetails object.
    const legacyPayment =
        invoice?.paymentDetails || invoice?.latestPaymentRelease;
    if (legacyPayment && getPaymentReleaseAmount(legacyPayment) > 0) {
        return [
            {
                ...legacyPayment,
                releasedAt:
                    legacyPayment?.releasedAt ||
                    invoice?.paymentReleasedAt ||
                    invoice?.releasePaymentAt ||
                    invoice?.updatedAt ||
                    null,
            },
        ];
    }

    return [];
}

function getPaymentHistoryCount(invoice: any): number {
    if (Array.isArray(invoice?.paymentReleaseHistory)) {
        return invoice.paymentReleaseHistory.length;
    }

    if (invoice?.paymentDetails || invoice?.latestPaymentRelease) {
        return 1;
    }

    return 0;
}

function getChequeFilterText(invoice: any): string {
    const chequeValues: string[] = [];

    const addValue = (value: any) => {
        if (value === null || value === undefined) return;

        if (Array.isArray(value)) {
            value.forEach(addValue);
            return;
        }

        if (typeof value === "object") {
            addValue(value?.chequeNumber);
            addValue(value?.chequeNo);
            addValue(value?.checkNumber);
            addValue(value?.number);
            addValue(value?.transactionReference);
            addValue(value?.referenceNumber);
            return;
        }

        const text = String(value).trim();
        if (text) chequeValues.push(text);
    };

    [
        invoice?.chequeNumber,
        invoice?.chequeNo,
        invoice?.checkNumber,
        invoice?.chequeNumbers,
        invoice?.paymentDetails?.chequeNumber,
        invoice?.paymentDetails?.chequeNo,
        invoice?.paymentDetails?.checkNumber,
        invoice?.paymentDetails?.chequeNumbers,
        invoice?.latestPaymentRelease?.chequeNumber,
        invoice?.latestPaymentRelease?.chequeNo,
        invoice?.latestPaymentRelease?.checkNumber,
        invoice?.latestPaymentRelease?.chequeNumbers,
    ].forEach(addValue);

    getPaymentReleaseHistory(invoice).forEach((entry: any) => {
        addValue(entry?.chequeNumber);
        addValue(entry?.chequeNo);
        addValue(entry?.checkNumber);
        addValue(entry?.chequeNumbers);
        addValue(entry?.cheques);

        if (normalizeText(entry?.paymentMethod) === "cheque") {
            addValue(entry?.transactionReference);
            addValue(entry?.referenceNumber);
        }
    });

    return chequeValues.join(" ");
}

/**
 * Returns the same merged item rows that are shown in Request Details.
 *
 * Request Details can contain the same item across `items`, `lineItems`, and
 * `approvalItems`. Some older records save the description in only one of
 * those arrays, so searching a single array can miss the displayed value.
 */
function getRequestDetailsItems(invoice: any): any[] {
    const items = Array.isArray(invoice?.items) ? invoice.items : [];
    const lineItems = Array.isArray(invoice?.lineItems) ? invoice.lineItems : [];
    const approvalItems = Array.isArray(invoice?.approvalItems)
        ? invoice.approvalItems
        : [];

    const availableArrays = [items, lineItems, approvalItems].filter(
        (itemArray) => itemArray.length > 0,
    );

    if (availableArrays.length === 0) return [];

    const baseItems = availableArrays.reduce((longest, current) =>
        current.length > longest.length ? current : longest,
    );

    const findMatchingItem = (
        source: any[],
        baseItem: any,
        index: number,
    ): any | undefined => {
        if (!source.length) return undefined;

        if (baseItem?.id !== null && baseItem?.id !== undefined) {
            const matchById = source.find(
                (item: any) => String(item?.id) === String(baseItem.id),
            );

            if (matchById) return matchById;
        }

        return source[index];
    };

    return baseItems.map((baseItem: any, index: number) => {
        const approvalItem = findMatchingItem(approvalItems, baseItem, index);
        const legacyLineItem = findMatchingItem(lineItems, baseItem, index);
        const currentItem = findMatchingItem(items, baseItem, index);

        return {
            ...(approvalItem || {}),
            ...(legacyLineItem || {}),
            ...(currentItem || {}),
        };
    });
}

function getDescriptionSearchText(invoice: any): string {
    const searchableValues: string[] = [];

    const addValue = (value: any) => {
        if (value === null || value === undefined) return;

        if (Array.isArray(value)) {
            value.forEach(addValue);
            return;
        }

        if (typeof value === "string" || typeof value === "number") {
            const text = String(value).trim();
            if (text) searchableValues.push(text);
        }
    };

    const addItem = (item: any) => {
        if (!item || typeof item !== "object") return;

        [
            item?.name,
            item?.itemName,
            item?.title,
            item?.productName,
            item?.service,
            item?.serviceName,
            item?.description,
            item?.itemDescription,
            item?.details,
            item?.detail,
            item?.comment,
            item?.requesterComment,
            item?.notes,
            item?.remarks,
            item?.purpose,
            item?.specification,
            item?.specifications,
            item?.category,
            item?.vendor,
            item?.vendorName,
            item?.supplier,
            item?.supplierName,
            item?.original?.name,
            item?.original?.itemName,
            item?.original?.title,
            item?.original?.service,
            item?.original?.serviceName,
            item?.original?.description,
            item?.original?.itemDescription,
            item?.original?.details,
            item?.original?.detail,
            item?.original?.comment,
            item?.original?.notes,
            item?.original?.remarks,
        ].forEach(addValue);
    };

    // Request-level fields shown in the detail view or used by legacy records.
    [
        invoice?.description,
        invoice?.itemDescription,
        invoice?.requestDescription,
        invoice?.requestDetails?.description,
        invoice?.requestDetails?.itemDescription,
        invoice?.details,
        invoice?.detail,
        invoice?.message,
        invoice?.comment,
        invoice?.notes,
        invoice?.remarks,
        invoice?.purpose,
    ].forEach(addValue);

    // Primary source: use the same merged rows displayed by Request Details.
    getRequestDetailsItems(invoice).forEach(addItem);

    // Also cover optional/legacy arrays that are not rendered by the current
    // Request Details modal but may exist on older requests.
    [
        invoice?.requestItems,
        invoice?.budgetItems,
        invoice?.expenseItems,
        invoice?.selectedItems,
        invoice?.requestDetails?.items,
        invoice?.requestDetails?.lineItems,
        invoice?.requestDetails?.approvalItems,
    ].forEach((itemArray) => {
        if (Array.isArray(itemArray)) itemArray.forEach(addItem);
    });

    return searchableValues.join(" ");
}

function getApprovedPaymentAmount(invoice: any): number {
    return roundMoney(
        invoice?.approvedAmount ??
        invoice?.totalApprovedAmount ??
        invoice?.approvedTotal ??
        invoice?.totalAmount ??
        invoice?.amount ??
        0,
    );
}

function getTotalReleasedAmount(invoice: any): number {
    const explicitReleasedAmount = roundMoney(invoice?.totalReleasedAmount);
    if (explicitReleasedAmount > 0) return explicitReleasedAmount;

    return roundMoney(
        getPaymentReleaseHistory(invoice).reduce(
            (sum, entry) => sum + getPaymentReleaseAmount(entry),
            0,
        ),
    );
}

function getRemainingPaymentBalance(invoice: any): number {
    const explicitRemaining = invoice?.remainingReleaseAmount;
    if (explicitRemaining !== undefined && explicitRemaining !== null) {
        return roundMoney(Math.max(safeNumber(explicitRemaining), 0));
    }

    return roundMoney(
        Math.max(
            getApprovedPaymentAmount(invoice) - getTotalReleasedAmount(invoice),
            0,
        ),
    );
}

function isPaymentFullyReleased(invoice: any): boolean {
    const approvedAmount = getApprovedPaymentAmount(invoice);
    const releasedAmount = getTotalReleasedAmount(invoice);
    const remainingAmount = getRemainingPaymentBalance(invoice);
    const status = normalizeText(invoice?.status);
    const paymentStatus = normalizeText(
        invoice?.paymentStatus || invoice?.releasePaymentStatus,
    );

    if (
        approvedAmount > 0 &&
        (remainingAmount <= 0.009 || releasedAmount >= approvedAmount - 0.009)
    ) {
        return true;
    }

    return Boolean(
        status === "payment_released" ||
        paymentStatus === "released" ||
        paymentStatus === "payment_released" ||
        invoice?.paymentReleasedAt ||
        invoice?.releasePaymentAt,
    );
}

function hasPartialPaymentReleased(invoice: any): boolean {
    return (
        getTotalReleasedAmount(invoice) > 0 && !isPaymentFullyReleased(invoice)
    );
}

function getReleaseDateLabel(value: any) {
    if (!value) return "-";

    let date: Date | null = null;

    if (value instanceof Date) date = value;
    else if (typeof value?.toDate === "function") date = value.toDate();
    else if (typeof value?.seconds === "number")
        date = new Date(value.seconds * 1000);
    else date = new Date(value);

    if (!date || Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("en-PK", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
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
            return method ? formatStatus(method) : "-";
    }
}

function normalizeText(value: any) {
    return String(value || "")
        .toLowerCase()
        .trim();
}

const ROLE_LABELS: Record<string, string> = {
    admin: "Admin",
    main_admin: "Admin",
    super_admin: "Super Admin",
    finance: "Finance",
    financial_admin: "Finance Admin",
    finance_admin: "Finance Admin",
    operation: "Operation",
    operations: "Operation",
    operational_admin: "Operation Admin",
    operation_admin: "Operation Admin",
    creative: "Creative",
    sales: "Sales",
};

function formatRoleLabel(role: any): string {
    const roleKey = getRoleKey(role);
    if (!roleKey) return "";

    return (
        ROLE_LABELS[roleKey] ||
        String(role || "")
            .replace(/_/g, " ")
            .replace(/\b\w/g, (letter) => letter.toUpperCase())
            .trim()
    );
}

function getFirstTextValue(values: any[]): string {
    for (const value of values) {
        const text = String(value || "").trim();
        if (text) return text;
    }
    return "";
}

function getDirectReturnedRole(invoice?: any): string {
    const directRole = getFirstTextValue([
        invoice?.returnedToRole,
        invoice?.returnToRole,
        invoice?.returnedRole,
        invoice?.returnedTo,
        invoice?.creatorRole,
        invoice?.createdByRole,
        invoice?.submittedByRole,
        invoice?.requestedByRole,
        invoice?.requesterRole,
        invoice?.userRole,
        invoice?.departmentRole,
        invoice?.department,
        invoice?.team,
    ]);

    return getRoleKey(directRole);
}

function getReturnedToRoleStatusLabel(invoice?: any): string {
    const savedRoleLabel = getFirstTextValue([
        invoice?.returnedToRoleLabel,
        invoice?.returnToRoleLabel,
    ]);
    const role = getDirectReturnedRole(invoice);
    const roleLabel = savedRoleLabel || formatRoleLabel(role);

    return roleLabel ? `Returned To ${roleLabel}` : "Returned To Role";
}

function formatStatus(status: string) {
    return String(status || "unknown")
        .replace(/_/g, " ")
        .replace(/^pending /, "")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getDateFromValue(value: any): Date | null {
    if (!value) return null;

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value?.toDate === "function") {
        const date = value.toDate();
        return Number.isNaN(date?.getTime?.()) ? null : date;
    }

    if (typeof value?.seconds === "number") {
        const date = new Date(value.seconds * 1000);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    if (typeof value === "string") {
        const trimmed = value.trim();

        const ymd = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
        if (ymd) {
            const date = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
            return Number.isNaN(date.getTime()) ? null : date;
        }

        const dmy = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
        if (dmy) {
            const date = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
            return Number.isNaN(date.getTime()) ? null : date;
        }

        const date = new Date(trimmed);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    if (typeof value === "number") {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    return null;
}

function getRequestDate(invoice: any): Date | null {
    return (
        getDateFromValue(invoice?.submitDate) ||
        getDateFromValue(invoice?.submittedAt) ||
        getDateFromValue(invoice?.submissionDate) ||
        getDateFromValue(invoice?.requestDate) ||
        getDateFromValue(invoice?.createdAt) ||
        getDateFromValue(invoice?.date) ||
        getDateFromValue(invoice?.created_at) ||
        getDateFromValue(invoice?.timestamp) ||
        getDateFromValue(invoice?.updatedAt)
    );
}

function getRequestIdSequence(invoice: any): number | null {
    const requestId = String(invoice?.requestId || "").trim();
    const sequenceMatch = requestId.match(/(\d+)(?!.*\d)/);
    if (!sequenceMatch) return null;

    const sequence = Number(sequenceMatch[1]);
    return Number.isFinite(sequence) ? sequence : null;
}

function compareRequestIdsAscending(a: any, b: any): number {
    const aSequence = getRequestIdSequence(a);
    const bSequence = getRequestIdSequence(b);

    if (aSequence !== null && bSequence !== null && aSequence !== bSequence) {
        return aSequence - bSequence;
    }

    if (aSequence !== null && bSequence === null) return -1;
    if (aSequence === null && bSequence !== null) return 1;

    const aDate = getRequestDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bDate = getRequestDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    if (aDate !== bDate) return aDate - bDate;

    return String(a?.id || "").localeCompare(String(b?.id || ""));
}

function getTableStatusSortRank(invoice: any): number {
    const status = normalizeText(invoice?.status);

    if (isWaitingForAdminApproval(invoice) && !wasReturnedToCreator(invoice)) {
        return 0;
    }

    if (
        wasReturnedToCreator(invoice) ||
        ["rejected", "returned_to_creator", "changes_requested"].includes(status)
    ) {
        return 1;
    }

    if (
        [
            "approved",
            "po_created",
            "po_submitted",
            "po_approved",
            "po_issued",
            "ready_for_payment",
            "payment_partially_released",
        ].includes(status)
    ) {
        return 2;
    }

    if (status === "pending_finance") {
        return 3;
    }

    if (status.startsWith("pending")) {
        return 4;
    }

    if (
        ["payment_released", "expense_submitted", "expense_completed"].includes(
            status,
        )
    ) {
        return 5;
    }

    return 6;
}

type ReleasePaymentPriorityPredicate = (invoice: any) => boolean;

/**
 * Lightweight fallback used by dashboards or other request views that do not
 * have access to the full purchase-order collection. The request-list page
 * passes its richer canReleasePayment predicate so linked POs are also handled.
 */
export function isFinanceReleasePaymentPriorityRequest(invoice: any): boolean {
    const status = normalizeText(invoice?.status);

    if (
        isPaymentFullyReleased(invoice) ||
        getRemainingPaymentBalance(invoice) <= 0.009 ||
        invoice?.expenseSubmitted ||
        status === "expense_submitted" ||
        status === "expense_completed"
    ) {
        return false;
    }

    if (
        [
            "po_created",
            "po_submitted",
            "po_approved",
            "po_issued",
            "ready_for_payment",
            "payment_partially_released",
        ].includes(status)
    ) {
        return true;
    }

    if (status !== "approved") return false;

    const rawType = normalizeText(invoice?.invoiceType || invoice?.type);
    const looksLikeProject =
        rawType === "project" ||
        (!rawType &&
            Boolean(
                invoice?.clientName ||
                invoice?.project ||
                invoice?.projectName ||
                invoice?.projectCode,
            ));

    if (!looksLikeProject) return true;

    return Boolean(
        invoice?.poSubmitted ||
        invoice?.poCreated ||
        invoice?.purchaseOrderCreated ||
        invoice?.purchaseOrderSubmitted ||
        invoice?.poId ||
        invoice?.poNumber ||
        invoice?.poDocId ||
        invoice?.purchaseOrderId ||
        invoice?.purchaseOrderNumber ||
        invoice?.poCreatedAt ||
        invoice?.purchaseOrderCreatedAt,
    );
}

/**
 * Finance users use this workflow priority:
 * 1. Requests currently waiting for Finance approval.
 * 2. Requests ready for a full or partial payment release.
 * 3. Requests already approved or completed by Finance.
 * 4. Requests currently waiting for Admin approval.
 * 5. Every other request.
 *
 * Apply this ranking before pagination in every Finance dashboard/list view.
 */
export function getFinanceTableStatusSortRank(
    invoice: any,
    isReleasePaymentRequest?: ReleasePaymentPriorityPredicate,
): number {
    const status = normalizeText(invoice?.status);

    // Priority 1: Finance's own outstanding approval work.
    if (status === "pending_finance") {
        return 0;
    }

    // Priority 2: Requests requiring payment-release action from Finance.
    const needsPaymentRelease = isReleasePaymentRequest
        ? isReleasePaymentRequest(invoice)
        : isFinanceReleasePaymentPriorityRequest(invoice);

    if (needsPaymentRelease) {
        return 1;
    }

    // Priority 3: Requests that passed Finance approval or completed later
    // workflow stages but do not currently require a payment-release action.
    if (
        [
            "approved",
            "po_created",
            "po_submitted",
            "po_approved",
            "po_issued",
            "ready_for_payment",
            "payment_partially_released",
            "payment_released",
            "expense_submitted",
            "expense_completed",
        ].includes(status)
    ) {
        return 2;
    }

    // Priority 4: Requests still assigned to an Admin approval stage.
    if (isWaitingForAdminApproval(invoice) && !wasReturnedToCreator(invoice)) {
        return 3;
    }

    // Priority 5: Rejected, returned, draft, other-role pending, and unknown
    // workflow statuses.
    return 4;
}

export function compareBudgetRequestsForTable(
    a: any,
    b: any,
    currentUserRole?: any,
    isReleasePaymentRequest?: ReleasePaymentPriorityPredicate,
): number {
    const useFinancePriority = isFinanceApproverRole(currentUserRole);
    const aStatusRank = useFinancePriority
        ? getFinanceTableStatusSortRank(a, isReleasePaymentRequest)
        : getTableStatusSortRank(a);
    const bStatusRank = useFinancePriority
        ? getFinanceTableStatusSortRank(b, isReleasePaymentRequest)
        : getTableStatusSortRank(b);

    if (aStatusRank !== bStatusRank) {
        return aStatusRank - bStatusRank;
    }

    return compareRequestIdsAscending(a, b);
}

function formatRequestDate(invoice: any) {
    const date = getRequestDate(invoice);
    if (!date) return "-";

    return date.toLocaleDateString("en-PK", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function getDateInputValue(date: Date | null) {
    if (!date) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function isFirebaseIdLike(value: any): boolean {
    const text = String(value || "").trim();

    return /^[A-Za-z0-9_-]{20,}$/.test(text) && !text.includes("@");
}

function getSafeDisplayText(value: any): string {
    const text = String(value || "").trim();
    if (!text) return "";
    if (isFirebaseIdLike(text)) return "";

    return text;
}

function getUserDisplayName(user: any): string {
    return getFirstTextValue([
        getSafeDisplayText(user?.displayName),
        getSafeDisplayText(user?.name),
        getSafeDisplayText(user?.fullName),
        getSafeDisplayText(user?.userName),
        getSafeDisplayText(user?.username),
        getSafeDisplayText(user?.employeeName),
        getSafeDisplayText(user?.email),
    ]);
}

const CREATOR_NAME_OVERRIDES: Record<string, string> = {
    // Example:
    // "wVS6kzCFiYM5dFQSEZ5P7Y8SChg1": "Bilal Tariq",
};

function getRoleKey(role: any): string {
    return String(role || "")
        .toLowerCase()
        .trim()
        .replace(/[\s-]+/g, "_");
}

function isAdminRole(role: any): boolean {
    const roleKey = getRoleKey(role);

    return ["admin", "main_admin", "super_admin"].includes(roleKey);
}

function isFinanceApproverRole(role: any): boolean {
    const roleKey = getRoleKey(role);

    return ["finance", "financial_admin", "finance_admin"].includes(roleKey);
}

function isOperationRole(role: any): boolean {
    const roleKey = getRoleKey(role);

    return ["operation", "operations"].includes(roleKey);
}

function canRoleCreateBudgetRequest(role: any): boolean {
    const roleKey = getRoleKey(role);
    if (!roleKey) return false;

    return !isAdminRole(roleKey);
}

function canRoleSeeAllBudgetRequests(role: any): boolean {
    return isAdminRole(role) || isFinanceApproverRole(role);
}

function getLatestApprovalAction(invoice: any): string {
    const approvalHistory = Array.isArray(invoice?.approvalHistory)
        ? invoice.approvalHistory
        : [];
    const latest = approvalHistory[approvalHistory.length - 1];

    return normalizeText(latest?.action || latest?.status || "");
}

function wasReturnedToCreator(invoice: any): boolean {
    const status = normalizeText(invoice?.status);

    if (
        ["rejected", "returned_to_creator", "changes_requested"].includes(status)
    ) {
        return true;
    }

    if (
        status === "pending_operational_admin" &&
        getLatestApprovalAction(invoice) === "rejected"
    ) {
        return true;
    }

    return Boolean(invoice?.returnedToCreator || invoice?.needsCreatorRevision);
}

function isWaitingForAdminApproval(invoice: any): boolean {
    const status = normalizeText(invoice?.status);

    if (status === "pending_main_admin" || status === "pending_admin") {
        return true;
    }

    if (
        status === "pending_operational_admin" &&
        !wasReturnedToCreator(invoice)
    ) {
        return true;
    }

    return false;
}

function hasAdminApprovedBudgetRequest(invoice: any): boolean {
    const status = normalizeText(invoice?.status);

    const afterAdminApprovalStatuses = [
        "pending_finance",
        "approved",
        "po_created",
        "po_submitted",
        "po_approved",
        "po_issued",
        "ready_for_payment",
        "payment_released",
        "expense_submitted",
        "expense_completed",
    ];

    if (afterAdminApprovalStatuses.includes(status)) {
        return true;
    }

    if (
        invoice?.adminApprovedAt ||
        invoice?.adminApprovedBy ||
        invoice?.adminApprovedById
    ) {
        return true;
    }

    const approvalHistory = Array.isArray(invoice?.approvalHistory)
        ? invoice.approvalHistory
        : [];

    return approvalHistory.some((history: any) => {
        const action = normalizeText(history?.action || history?.status);
        const approverRole = getRoleKey(
            history?.approverRole || history?.role || history?.userRole,
        );

        return action === "approved" && isAdminRole(approverRole);
    });
}

function getStatusLabel(status: string, invoice?: any): string {
    const normalizedStatus = normalizeText(status);

    if (invoice && wasReturnedToCreator(invoice)) {
        return getReturnedToRoleStatusLabel(invoice);
    }

    if (
        normalizedStatus === "pending_main_admin" ||
        normalizedStatus === "pending_admin"
    ) {
        return "Pending Admin";
    }

    if (normalizedStatus === "pending_operational_admin") return "Pending Admin";
    if (normalizedStatus === "pending_finance") return "Pending Finance";
    if (normalizedStatus === "payment_partially_released") {
        return "Payment Partially Released";
    }
    if (normalizedStatus === "rejected")
        return getReturnedToRoleStatusLabel(invoice);

    return formatStatus(status);
}

export default function InvoiceRequests() {
    const PANEL_ID = "IEDGE-SYSTEM";

    const { userProfile } = useAuth();
    const { toast } = useToast();
    const currentUserRole = String(userProfile?.role || "");
    const [, setLocation] = useLocation();

    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRequest | null>(
        null,
    );
    const [isPaymentHistoryModalOpen, setIsPaymentHistoryModalOpen] =
        useState(false);
    const [paymentHistoryInvoice, setPaymentHistoryInvoice] =
        useState<InvoiceRequest | null>(null);
    const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
    const [rejectionLoading, setRejectionLoading] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState<"all" | "project" | "general">(
        "all",
    );
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [monthFilter, setMonthFilter] = useState("");
    const [createdByFilter, setCreatedByFilter] = useState("all");
    const [projectCodeFilter, setProjectCodeFilter] = useState("");
    const [vendorFilter, setVendorFilter] = useState("");
    const [chequeFilter, setChequeFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const { data: invoices = [], loading } = useFirestoreQuery<InvoiceRequest>(
        `Panels/${PANEL_ID}/invoiceRequests`,
    );

    const { data: expenseSheets = [] } = useFirestoreQuery<any>(
        `Panels/${PANEL_ID}/expenseSheets`,
    );

    const { data: purchaseOrders = [] } = useFirestoreQuery<any>(
        `Panels/${PANEL_ID}/purchaseOrders`,
    );

    const { data: users = [] } = useFirestoreQuery<any>("users");

    const { data: panelUsers = [] } = useFirestoreQuery<any>(
        `Panels/${PANEL_ID}/users`,
    );

    const CREATE_PO_ROUTE = "/create-po";

    function getRequestType(invoice: any): "general" | "project" {
        const rawType = String(
            invoice?.invoiceType || invoice?.type || "",
        ).toLowerCase();

        if (rawType === "project") return "project";
        if (rawType === "general") return "general";

        return invoice?.clientName ||
            invoice?.project ||
            invoice?.projectName ||
            invoice?.projectCode
            ? "project"
            : "general";
    }

    function isProjectRequest(invoice: any): boolean {
        return getRequestType(invoice) === "project";
    }

    function getLinkedPO(invoice: any): any | null {
        const requestId = String(invoice?.requestId || "").trim();
        const invoiceDocId = String(invoice?.id || "").trim();
        const estimateId = String(invoice?.estimateId || "").trim();
        const estimateNumber = String(
            invoice?.estimateNumber ||
            invoice?.estimateNo ||
            invoice?.estimateValue ||
            invoice?.selectedEstimate ||
            invoice?.selectEstimate ||
            "",
        ).trim();

        return (
            purchaseOrders.find((po: any) => {
                const poRequestDocLinks = [
                    po?.invoiceRequestId,
                    po?.linkedInvoiceId,
                    po?.sourceInvoiceId,
                    po?.budgetRequestDocId,
                    po?.sourceBudgetRequestId,
                    po?.requestDocId,
                    po?.invoiceId,
                ]
                    .filter(Boolean)
                    .map((value) => String(value).trim());

                const poRequestIdLinks = [
                    po?.requestId,
                    po?.budgetRequestId,
                    po?.linkedRequestId,
                    po?.sourceRequestId,
                    po?.invoiceNumber,
                    po?.budgetRequestNumber,
                ]
                    .filter(Boolean)
                    .map((value) => String(value).trim());

                const poEstimateLinks = [
                    po?.estimateId,
                    po?.estimateNumber,
                    po?.estimateNo,
                    po?.selectedEstimate,
                ]
                    .filter(Boolean)
                    .map((value) => String(value).trim());

                return (
                    Boolean(invoiceDocId && poRequestDocLinks.includes(invoiceDocId)) ||
                    Boolean(requestId && poRequestIdLinks.includes(requestId)) ||
                    Boolean(estimateId && poEstimateLinks.includes(estimateId)) ||
                    Boolean(estimateNumber && poEstimateLinks.includes(estimateNumber))
                );
            }) || null
        );
    }

    function hasPOAlready(invoice: any): boolean {
        const status = normalizeText(invoice?.status);
        const poStatus = normalizeText(
            invoice?.poStatus || invoice?.purchaseOrderStatus,
        );

        const statusSaysPOCreated = [
            "po_created",
            "po_submitted",
            "po_approved",
            "po_issued",
            "ready_for_payment",
        ].includes(status);

        const poStatusSaysCreated = [
            "created",
            "submitted",
            "approved",
            "issued",
            "ready_for_payment",
        ].includes(poStatus);

        const hasDirectPOFields = Boolean(
            invoice?.poSubmitted ||
            invoice?.poCreated ||
            invoice?.purchaseOrderCreated ||
            invoice?.purchaseOrderSubmitted ||
            invoice?.poId ||
            invoice?.poNumber ||
            invoice?.poDocId ||
            invoice?.purchaseOrderId ||
            invoice?.purchaseOrderNumber ||
            invoice?.poCreatedAt ||
            invoice?.purchaseOrderCreatedAt,
        );

        return Boolean(
            statusSaysPOCreated ||
            poStatusSaysCreated ||
            hasDirectPOFields ||
            getLinkedPO(invoice),
        );
    }

    function hasPaymentReleased(invoice: any): boolean {
        return isPaymentFullyReleased(invoice);
    }

    function hasAnyPaymentRelease(invoice: any): boolean {
        return (
            getTotalReleasedAmount(invoice) > 0 ||
            getPaymentReleaseHistory(invoice).length > 0
        );
    }

    // function canManagePaymentHistory(invoice: InvoiceRequest): boolean {
    //     if (!userProfile) return false;

    //     const allowedRole =
    //         isAdminRole(userProfile.role) ||
    //         isFinanceApproverRole(userProfile.role);

    //     if (!allowedRole) return false;

    //     return (
    //         hasAdminApprovedBudgetRequest(invoice) ||
    //         hasAnyPaymentRelease(invoice) ||
    //         getPaymentHistoryCount(invoice) > 0
    //     );
    // }

    function canManagePaymentHistory(invoice: InvoiceRequest): boolean {
  if (!userProfile) return false;

  // Only Finance roles may edit existing payment releases.
  if (!isFinanceApproverRole(userProfile.role)) {
    return false;
  }

  // Finance can edit existing entries only.
  return getPaymentHistoryCount(invoice) > 0;
}

    function getExpenseAmount(invoice: any): number {
        return safeNumber(
            invoice?.approvedAmount || invoice?.totalAmount || invoice?.amount,
        );
    }

    function isExpenseLinkedToRequest(expense: any, invoice: any): boolean {
        const requestId = String(invoice?.requestId || "").trim();
        const invoiceDocId = String(invoice?.id || "").trim();
        const poId = String(invoice?.poId || "").trim();
        const poNumber = String(invoice?.poNumber || "").trim();

        const expenseRequestLinks = [
            expense?.linkedRequestId,
            expense?.budgetRequestId,
            expense?.sourceRequestId,
            expense?.requestId,
            expense?.invoiceNumber,
        ]
            .filter(Boolean)
            .map((value) => String(value).trim());

        const expenseDocLinks = [
            expense?.linkedInvoiceId,
            expense?.invoiceRequestId,
            expense?.sourceInvoiceId,
            expense?.budgetRequestDocId,
        ]
            .filter(Boolean)
            .map((value) => String(value).trim());

        const expensePoLinks = [
            expense?.poId,
            expense?.poNumber,
            expense?.sourcePOId,
            expense?.sourcePONumber,
        ]
            .filter(Boolean)
            .map((value) => String(value).trim());

        return (
            Boolean(requestId && expenseRequestLinks.includes(requestId)) ||
            Boolean(invoiceDocId && expenseDocLinks.includes(invoiceDocId)) ||
            Boolean(poId && expensePoLinks.includes(poId)) ||
            Boolean(poNumber && expensePoLinks.includes(poNumber))
        );
    }

    function hasExpenseSheet(invoice: InvoiceRequest): boolean {
        return Boolean(
            expenseSheets?.some((expense: any) =>
                isExpenseLinkedToRequest(expense, invoice),
            ),
        );
    }

    function canShowExpenseAction(invoice: InvoiceRequest): boolean {
        if (!userProfile || userProfile.role !== "operation") return false;

        if (
            (invoice as any).expenseSubmitted ||
            String(invoice.status) === "expense_submitted"
        ) {
            return true;
        }

        return hasPaymentReleased(invoice);
    }

    function buildExpenseSource(invoice: InvoiceRequest) {
        const request: any = invoice;
        const requestType = getRequestType(request);
        const projectName = request.projectName || request.project || "";
        const vendorName =
            request.vendorName ||
            request.supplierName ||
            getFirstVendorName(request) ||
            request.clientName ||
            "";
        const amount = getExpenseAmount(request);

        return {
            ...request,
            invoiceNumber: request.requestId,
            linkedRequestId: request.requestId,
            budgetRequestId: request.requestId,
            invoiceRequestId: request.id,
            linkedInvoiceId: request.id,
            sourceInvoiceId: request.id,
            sourceType: "budget_request",
            approvalRequired: false,
            requiresApproval: false,
            adminApprovalRequired: false,
            autoApproved: true,
            autoApprovedReason:
                "Created from approved budget request. No further approval required.",
            expenseStatus: "submitted",
            status: "submitted",
            invoiceType: requestType,
            requestType,
            amount,
            totalAmount: amount,
            approvedAmount: amount,
            vendorName,
            supplierName: request.supplierName || vendorName,
            clientName: request.clientName || "",
            projectName,
            project: projectName,
            projectCode: request.projectCode || "",
            poId: request.poId || "",
            poNumber: request.poNumber || "",
            dueDate: new Date(),
        };
    }

    function openExpenseModal(invoice: InvoiceRequest) {
        const expenseSource = buildExpenseSource(invoice);

        localStorage.setItem(
            "submitExpenseFromBudgetRequest",
            JSON.stringify(expenseSource),
        );
        localStorage.setItem("expenseSheetSource", JSON.stringify(expenseSource));

        setSelectedInvoice(expenseSource as any);
        setIsExpenseModalOpen(true);
    }

    async function handleExpenseSubmitted() {
        const request: any = selectedInvoice;

        try {
            if (request?.id) {
                await updateDoc(
                    doc(db, "Panels", PANEL_ID, "invoiceRequests", request.id),
                    {
                        status: "expense_submitted",
                        expenseSubmitted: true,
                        expenseStatus: "submitted",
                        expenseApprovalRequired: false,
                        expenseRequiresApproval: false,
                        expenseSubmittedAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                    },
                );
            }

            toast({
                title: "Expense submitted",
                description:
                    "Expense submitted successfully. No further approval is required.",
            });
        } catch (error: any) {
            console.error("Failed to mark expense as submitted:", error);
            toast({
                title: "Expense submitted",
                description:
                    "Expense was submitted, but the request status could not be updated.",
            });
        } finally {
            setIsExpenseModalOpen(false);
            setSelectedInvoice(null);
            localStorage.removeItem("submitExpenseFromBudgetRequest");
            localStorage.removeItem("expenseSheetSource");
        }
    }

    async function handlePaymentReleased() {
        // PaymentReleaseModal already updates the request with the latest partial/full
        // release totals. Do not overwrite it here, otherwise partial releases would be
        // forced into the final payment_released state.
        toast({
            title: "Payment release saved",
            description: "The payment release history has been updated successfully.",
        });

        setIsPaymentModalOpen(false);
        setSelectedInvoice(null);
    }

    function getFirstVendorName(invoice: any): string {
        const lineItems = Array.isArray(invoice?.lineItems)
            ? invoice.lineItems
            : [];
        const approvedItems = Array.isArray(invoice?.approvalItems)
            ? invoice.approvalItems
            : [];
        const allItems = [...approvedItems, ...lineItems];

        const matchedItem = allItems.find(
            (item: any) =>
                item?.vendor ||
                item?.vendorName ||
                item?.supplier ||
                item?.supplierName ||
                item?.original?.vendor ||
                item?.original?.supplier,
        );

        return (
            matchedItem?.vendor ||
            matchedItem?.vendorName ||
            matchedItem?.supplier ||
            matchedItem?.supplierName ||
            matchedItem?.original?.vendor ||
            matchedItem?.original?.supplier ||
            ""
        );
    }

    function getVendorFilterText(invoice: any): string {
        return getFirstTextValue([
            invoice?.vendorName,
            invoice?.supplierName,
            getFirstVendorName(invoice),
        ]);
    }

    function handleCreatePO(invoice: InvoiceRequest) {
        const request: any = invoice;

        localStorage.setItem(
            "createPOFromBudgetRequest",
            JSON.stringify({
                invoiceRequestId: request.id,
                budgetRequestDocId: request.id,
                budgetRequestId: request.requestId,
                requestId: request.requestId,
                invoiceType: getRequestType(request),
                sourceType: "budget_request",
                returnToBudgetRequests: true,
                updateBudgetRequestAfterPO: true,

                estimateId: request.estimateId || "",
                estimateNumber:
                    request.estimateNumber ||
                    request.estimateNo ||
                    request.estimateValue ||
                    request.selectedEstimate ||
                    request.selectEstimate ||
                    "",

                clientName: request.clientName || "",
                projectName: request.projectName || request.project || "",
                project: request.project || request.projectName || "",
                projectCode: request.projectCode || "",
                title: request.title || request.subject || "",
                subject: request.subject || "",
                message: request.message || "",

                supplierId: request.supplierId || request.vendorId || "",
                supplierName:
                    request.supplierName ||
                    request.vendorName ||
                    getFirstVendorName(request),
                vendorName:
                    request.vendorName ||
                    request.supplierName ||
                    getFirstVendorName(request),

                totalAmount: Number(request.totalAmount || 0),
                approvedAmount: Number(
                    request.approvedAmount || request.totalAmount || 0,
                ),

                approvalItems: request.approvalItems || [],
                lineItems: request.lineItems || [],
                items: request.items || request.lineItems || [],
            }),
        );

        setLocation(CREATE_PO_ROUTE);
    }

    async function handleApprove(invoice: InvoiceRequest) {
        if (!userProfile) return;

        const roleKey = getRoleKey(userProfile.role);
        const status = normalizeText(invoice.status);
        const approvalHistory = Array.isArray((invoice as any).approvalHistory)
            ? (invoice as any).approvalHistory
            : [];

        let newStatus = status;
        let currentApprover = String((invoice as any).currentApprover || "");

        const updatePayload: Record<string, any> = {
            approvalHistory: [
                ...approvalHistory,
                {
                    approver:
                        userProfile.displayName ||
                        (userProfile as any)?.name ||
                        userProfile.email ||
                        roleKey,
                    approverRole: roleKey,
                    action: "approved",
                    timestamp: new Date(),
                    notes: "",
                },
            ],
            returnedToCreator: false,
            needsCreatorRevision: false,
            returnedToRole: "",
            returnedToRoleLabel: "",
            updatedAt: serverTimestamp(),
        };

        if (isAdminRole(roleKey) && isWaitingForAdminApproval(invoice)) {
            newStatus = "pending_finance";
            currentApprover = "finance";
            updatePayload.adminApprovedAt = serverTimestamp();
            updatePayload.adminApprovedBy =
                userProfile.displayName || userProfile.email || "";
            updatePayload.adminApprovedById =
                userProfile.id ||
                (userProfile as any)?.uid ||
                (userProfile as any)?.userId ||
                userProfile.email ||
                "";
        } else if (isFinanceApproverRole(roleKey) && status === "pending_finance") {
            newStatus = "approved";
            currentApprover = "";
            updatePayload.financeApprovedAt = serverTimestamp();
            updatePayload.financeApprovedBy =
                userProfile.displayName || userProfile.email || "";
            updatePayload.financeApprovedById =
                userProfile.id ||
                (userProfile as any)?.uid ||
                (userProfile as any)?.userId ||
                userProfile.email ||
                "";
            updatePayload.approvedAt = serverTimestamp();
        } else {
            toast({
                title: "Action not allowed",
                description:
                    "This request is not currently assigned to your approval stage.",
                variant: "destructive",
            });
            return;
        }

        try {
            await updateDoc(
                doc(db, "Panels", PANEL_ID, "invoiceRequests", invoice.id),
                {
                    ...updatePayload,
                    status: newStatus,
                    currentApprover,
                },
            );

            toast({
                title: "Success",
                description: "Budget request approved successfully",
            });
        } catch (error: any) {
            console.error("Failed to approve budget request:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to approve budget request",
                variant: "destructive",
            });
        }
    }

    async function handleReject(
        invoice: InvoiceRequest,
        rejectionComment: string,
    ) {
        if (!userProfile) return;

        try {
            setRejectionLoading(true);

            const roleKey = getRoleKey(userProfile.role);
            const ownerId = getBudgetRequestOwnerId(invoice);
            const approvalHistory = Array.isArray((invoice as any).approvalHistory)
                ? (invoice as any).approvalHistory
                : [];

            const returnedToRole = getBudgetRequestOwnerRole(invoice);
            const returnedToRoleLabel = formatRoleLabel(returnedToRole);

            await updateDoc(
                doc(db, "Panels", PANEL_ID, "invoiceRequests", invoice.id),
                {
                    status: "rejected",
                    currentApprover: ownerId,
                    returnedToRole,
                    returnedToRoleLabel,
                    returnedToCreator: true,
                    needsCreatorRevision: true,
                    rejectionComment,
                    rejectedAt: serverTimestamp(),
                    rejectedBy: userProfile.displayName || userProfile.email || "",
                    rejectedByRole: roleKey,
                    approvalHistory: [
                        ...approvalHistory,
                        {
                            approver:
                                userProfile.displayName ||
                                (userProfile as any)?.name ||
                                userProfile.email ||
                                roleKey,
                            approverRole: roleKey,
                            action: "rejected",
                            timestamp: new Date(),
                            notes: rejectionComment,
                        },
                    ],
                    updatedAt: serverTimestamp(),
                },
            );

            toast({
                title: "Request returned",
                description: `Budget request has been sent back to ${returnedToRoleLabel || "the original role"
                    } for changes.`,
            });

            setIsRejectionModalOpen(false);
            setSelectedInvoice(null);
        } catch (error: any) {
            console.error("Failed to reject budget request:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to reject budget request",
                variant: "destructive",
            });
        } finally {
            setRejectionLoading(false);
        }
    }

    function getStatusBadgeColor(status: string, invoice?: any): string {
        if (invoice && wasReturnedToCreator(invoice)) {
            return "border-red-200 bg-red-50 text-red-700";
        }

        switch (status) {
            case "approved":
            case "payment_released":
            case "expense_submitted":
            case "expense_completed":
                return "border-green-200 bg-green-50 text-green-700";
            case "rejected":
            case "returned_to_creator":
            case "changes_requested":
                return "border-red-200 bg-red-50 text-red-700";
            case "pending_operational_admin":
            case "pending_main_admin":
            case "pending_admin":
            case "pending_finance":
                return "border-amber-200 bg-amber-50 text-amber-700";
            case "payment_partially_released":
                return "border-blue-200 bg-blue-50 text-blue-700";
            default:
                return "border-slate-200 bg-slate-50 text-slate-700";
        }
    }

    function getTypeBadgeColor(type: "general" | "project") {
        return type === "project"
            ? "border-indigo-200 bg-indigo-50 text-indigo-700"
            : "border-slate-200 bg-slate-50 text-slate-700";
    }

    function getCurrentStep(invoice: InvoiceRequest): string {
        const status = normalizeText(invoice.status || "");

        if (
            (invoice as any).expenseSubmitted ||
            status === "expense_submitted" ||
            hasExpenseSheet(invoice)
        ) {
            return "Expense Submitted / No Approval Required";
        }

        if (hasPaymentReleased(invoice)) {
            return "Payment Released / Ready for Expense";
        }

        if (hasPartialPaymentReleased(invoice)) {
            return `Partial Payment Released / Remaining Rs ${formatPKR(
                getRemainingPaymentBalance(invoice),
            )}`;
        }

        if (isProjectRequest(invoice) && hasPOAlready(invoice)) {
            return "PO Created / Ready for Payment";
        }

        if (wasReturnedToCreator(invoice)) {
            return `${getBudgetRequestStatusLabel(invoice)} / Waiting for Resubmission`;
        }

        switch (status) {
            case "pending_operational_admin":
            case "pending_main_admin":
            case "pending_admin":
                return "Admin Approval";
            case "pending_finance":
                return "Finance Approval";
            case "approved":
                return isProjectRequest(invoice) ? "Ready for PO" : "Ready for Payment";
            case "po_created":
            case "po_submitted":
            case "po_approved":
            case "po_issued":
            case "ready_for_payment":
                return "PO Created / Ready for Payment";
            case "payment_partially_released":
                return `Partial Payment Released / Remaining Rs ${formatPKR(
                    getRemainingPaymentBalance(invoice),
                )}`;
            case "payment_released":
                return "Payment Released / Ready for Expense";
            case "expense_submitted":
            case "expense_completed":
                return "Expense Submitted / No Approval Required";
            case "rejected":
            case "returned_to_creator":
            case "changes_requested":
                return getBudgetRequestStatusLabel(invoice);
            default:
                return "Unknown";
        }
    }

    function canApprove(invoice: InvoiceRequest): boolean {
        if (!userProfile) return false;

        const roleKey = getRoleKey(userProfile.role);

        if (isAdminRole(roleKey)) {
            return isWaitingForAdminApproval(invoice);
        }

        if (isFinanceApproverRole(roleKey)) {
            return normalizeText(invoice.status) === "pending_finance";
        }

        return false;
    }

    function canEdit(invoice: InvoiceRequest): boolean {
        if (!userProfile) return false;

        if (!isOwnBudgetRequest(invoice)) return false;

        if (hasAdminApprovedBudgetRequest(invoice)) return false;

        const status = normalizeText(invoice.status);

        return (
            wasReturnedToCreator(invoice) ||
            status === "draft" ||
            status === "pending_main_admin" ||
            status === "pending_admin" ||
            status === "pending_operational_admin" ||
            status === ""
        );
    }

    function getEditableInvoice(invoice: InvoiceRequest): InvoiceRequest {
        if (hasAdminApprovedBudgetRequest(invoice)) return invoice;

        if (!wasReturnedToCreator(invoice)) return invoice;

        return {
            ...(invoice as any),
            status: "pending_main_admin",
            currentApprover: "main_admin",
            returnedToCreator: false,
            needsCreatorRevision: false,
            returnedToRole: "",
            returnedToRoleLabel: "",
            resubmittedAt: new Date(),
        } as InvoiceRequest;
    }

    function canReleasePayment(invoice: InvoiceRequest): boolean {
        if (!userProfile) return false;

        const isFinanceUser = isFinanceApproverRole(userProfile.role);
        if (!isFinanceUser) return false;

        if (hasPaymentReleased(invoice)) return false;

        if (getRemainingPaymentBalance(invoice) <= 0.009) return false;

        if (
            (invoice as any).expenseSubmitted ||
            String(invoice.status) === "expense_submitted"
        ) {
            return false;
        }

        const status = normalizeText(invoice.status);
        const readyForPayment = [
            "approved",
            "po_created",
            "po_submitted",
            "po_approved",
            "po_issued",
            "ready_for_payment",
            "payment_partially_released",
        ].includes(status);

        if (!readyForPayment) return false;

        if (!isProjectRequest(invoice)) return true;

        return hasPOAlready(invoice);
    }

    function canCreatePO(invoice: InvoiceRequest): boolean {
        if (!userProfile) return false;

        return (
            isFinanceApproverRole(userProfile.role) &&
            normalizeText(invoice.status) === "approved" &&
            isProjectRequest(invoice) &&
            !hasPOAlready(invoice) &&
            !hasPaymentReleased(invoice)
        );
    }

    function canSubmitExpense(invoice: InvoiceRequest): boolean {
        if (
            (invoice as any).expenseSubmitted ||
            String(invoice.status) === "expense_submitted"
        ) {
            return false;
        }

        return canShowExpenseAction(invoice) && !hasExpenseSheet(invoice);
    }

    function getExpenseSheetStatus(invoice: InvoiceRequest): string | null {
        if (
            (invoice as any).expenseSubmitted ||
            String(invoice.status) === "expense_submitted"
        ) {
            return "submitted";
        }

        if (!expenseSheets) return null;

        const expenseSheet = expenseSheets.find((expense: any) =>
            isExpenseLinkedToRequest(expense, invoice),
        );

        return expenseSheet?.status || expenseSheet?.expenseStatus || null;
    }

    const canCreateInvoices = canRoleCreateBudgetRequest(currentUserRole);

    function getCurrentUserId() {
        return String(
            userProfile?.id ||
            (userProfile as any)?.uid ||
            (userProfile as any)?.userId ||
            (userProfile as any)?.firebaseUid ||
            (userProfile as any)?.authUid ||
            userProfile?.email ||
            "",
        ).trim();
    }

    function getBudgetRequestOwnerId(invoice: any) {
        return String(
            invoice?.submittedBy ||
            invoice?.createdBy ||
            invoice?.requestedBy ||
            invoice?.requesterId ||
            invoice?.userId ||
            invoice?.uid ||
            invoice?.createdById ||
            invoice?.submittedById ||
            invoice?.createdByEmail ||
            invoice?.submittedByEmail ||
            invoice?.email ||
            "",
        ).trim();
    }

    function isOwnBudgetRequest(invoice: any) {
        const currentUserId = getCurrentUserId().toLowerCase();
        const ownerId = getBudgetRequestOwnerId(invoice).toLowerCase();

        return Boolean(currentUserId && ownerId && currentUserId === ownerId);
    }

    function getCurrentUserRecordFromUsersCollection() {
        const lookupValues = [
            userProfile?.id,
            (userProfile as any)?.uid,
            (userProfile as any)?.userId,
            (userProfile as any)?.firebaseUid,
            (userProfile as any)?.authUid,
            userProfile?.email,
        ];

        for (const value of lookupValues) {
            const lookupKey = String(value || "")
                .trim()
                .toLowerCase();

            if (!lookupKey) continue;

            const matchedUser = usersByLookup.get(lookupKey);
            if (matchedUser) return matchedUser;
        }

        return null;
    }

    function canCurrentUserSeeAllBudgetRequests() {
        const userRecord = getCurrentUserRecordFromUsersCollection();
        const effectiveRole = getRoleKey(currentUserRole || userRecord?.role);

        if (canRoleSeeAllBudgetRequests(effectiveRole)) return true;

        if (!isOperationRole(effectiveRole)) return false;

        return Boolean(
            (userProfile as any)?.canViewAllBudgetRequests ||
            userRecord?.canViewAllBudgetRequests,
        );
    }

    const usersByLookup = useMemo(() => {
        const map = new Map<string, any>();
        const allUsers = [...(users || []), ...(panelUsers || [])];

        allUsers.forEach((user: any) => {
            [
                user?.id,
                user?.uid,
                user?.userId,
                user?.firebaseUid,
                user?.authUid,
                user?.email,
            ].forEach((key) => {
                const lookupKey = String(key || "")
                    .trim()
                    .toLowerCase();

                if (lookupKey) map.set(lookupKey, user);
            });
        });

        return map;
    }, [users, panelUsers]);

    function getUserRoleLabel(user: any): string {
        const role = getFirstTextValue([
            user?.role,
            user?.userRole,
            user?.departmentRole,
            user?.department,
            user?.team,
        ]);

        return getRoleKey(role);
    }

    function getBudgetRequestOwnerRole(invoice: any): string {
        const directRole = getDirectReturnedRole(invoice);
        if (directRole) return directRole;

        const ownerLookupValues = [
            invoice?.createdBy,
            invoice?.submittedBy,
            invoice?.requestedBy,
            invoice?.requesterId,
            invoice?.createdById,
            invoice?.submittedById,
            invoice?.userId,
            invoice?.uid,
            invoice?.createdByEmail,
            invoice?.submittedByEmail,
            invoice?.email,
        ];

        for (const value of ownerLookupValues) {
            const lookupKey = String(value || "")
                .trim()
                .toLowerCase();

            if (!lookupKey) continue;

            const matchedUser = usersByLookup.get(lookupKey);
            const matchedRole = getUserRoleLabel(matchedUser);

            if (matchedRole) return matchedRole;
        }

        const currentUserLookupValues = [
            userProfile?.id,
            (userProfile as any)?.uid,
            (userProfile as any)?.userId,
            (userProfile as any)?.firebaseUid,
            (userProfile as any)?.authUid,
            userProfile?.email,
        ]
            .map((value) =>
                String(value || "")
                    .trim()
                    .toLowerCase(),
            )
            .filter(Boolean);

        const isCurrentUserOwner = ownerLookupValues
            .map((value) =>
                String(value || "")
                    .trim()
                    .toLowerCase(),
            )
            .filter(Boolean)
            .some((ownerKey) => currentUserLookupValues.includes(ownerKey));

        if (isCurrentUserOwner) return getRoleKey(userProfile?.role);

        return "";
    }

    function getBudgetRequestStatusLabel(invoice: any): string {
        if (wasReturnedToCreator(invoice)) {
            const role = getBudgetRequestOwnerRole(invoice);
            const savedRoleLabel = getFirstTextValue([
                invoice?.returnedToRoleLabel,
                invoice?.returnToRoleLabel,
            ]);
            const roleLabel = savedRoleLabel || formatRoleLabel(role);

            return roleLabel ? `Returned To ${roleLabel}` : "Returned To Role";
        }

        return getStatusLabel(invoice?.status || "", invoice);
    }

    const creatorNamesByLookup = useMemo(() => {
        const map = new Map<string, string>();

        (invoices || []).forEach((invoice: any) => {
            const name = getFirstTextValue([
                getSafeDisplayText(invoice?.createdByName),
                getSafeDisplayText(invoice?.submittedByName),
                getSafeDisplayText(invoice?.requestedByName),
                getSafeDisplayText(invoice?.requesterName),
                getSafeDisplayText(invoice?.creatorName),
                getSafeDisplayText(invoice?.createdByDisplayName),
                getSafeDisplayText(invoice?.submittedByDisplayName),
                getSafeDisplayText(invoice?.userName),
                getSafeDisplayText(invoice?.displayName),
                getSafeDisplayText(invoice?.employeeName),
                getSafeDisplayText(invoice?.name),
            ]);

            if (!name) return;

            [
                invoice?.createdBy,
                invoice?.submittedBy,
                invoice?.requestedBy,
                invoice?.requesterId,
                invoice?.createdById,
                invoice?.submittedById,
                invoice?.userId,
                invoice?.uid,
                invoice?.createdByEmail,
                invoice?.submittedByEmail,
                invoice?.email,
            ].forEach((key) => {
                const lookupKey = String(key || "")
                    .trim()
                    .toLowerCase();

                if (lookupKey && !map.has(lookupKey)) map.set(lookupKey, name);
            });
        });

        return map;
    }, [invoices]);

    function getCreatedByName(invoice: any): string {
        const directName = getFirstTextValue([
            getSafeDisplayText(invoice?.createdByName),
            getSafeDisplayText(invoice?.submittedByName),
            getSafeDisplayText(invoice?.requestedByName),
            getSafeDisplayText(invoice?.requesterName),
            getSafeDisplayText(invoice?.creatorName),
            getSafeDisplayText(invoice?.createdByDisplayName),
            getSafeDisplayText(invoice?.submittedByDisplayName),
            getSafeDisplayText(invoice?.userName),
            getSafeDisplayText(invoice?.displayName),
            getSafeDisplayText(invoice?.employeeName),
            getSafeDisplayText(invoice?.name),
        ]);

        if (directName) return directName;

        const lookupValues = [
            invoice?.createdBy,
            invoice?.submittedBy,
            invoice?.requestedBy,
            invoice?.requesterId,
            invoice?.createdById,
            invoice?.submittedById,
            invoice?.userId,
            invoice?.uid,
            invoice?.createdByEmail,
            invoice?.submittedByEmail,
            invoice?.email,
        ];

        for (const value of lookupValues) {
            const rawKey = String(value || "").trim();
            const lookupKey = rawKey.toLowerCase();

            if (!lookupKey) continue;

            const overrideName = getSafeDisplayText(
                CREATOR_NAME_OVERRIDES[rawKey] || CREATOR_NAME_OVERRIDES[lookupKey],
            );

            if (overrideName) return overrideName;

            const nameFromAnotherRequest = getSafeDisplayText(
                creatorNamesByLookup.get(lookupKey),
            );

            if (nameFromAnotherRequest) return nameFromAnotherRequest;

            const matchedUser = usersByLookup.get(lookupKey);
            const matchedName = getSafeDisplayText(getUserDisplayName(matchedUser));

            if (matchedName) return matchedName;
        }

        const currentUserLookupValues = [
            userProfile?.id,
            (userProfile as any)?.uid,
            (userProfile as any)?.userId,
            (userProfile as any)?.firebaseUid,
            (userProfile as any)?.authUid,
            userProfile?.email,
        ]
            .map((value) =>
                String(value || "")
                    .trim()
                    .toLowerCase(),
            )
            .filter(Boolean);

        const ownerLookupValues = lookupValues
            .map((value) =>
                String(value || "")
                    .trim()
                    .toLowerCase(),
            )
            .filter(Boolean);

        const isCurrentUserOwner = ownerLookupValues.some((ownerKey) =>
            currentUserLookupValues.includes(ownerKey),
        );

        if (isCurrentUserOwner) {
            const currentUserName = getFirstTextValue([
                getSafeDisplayText(userProfile?.displayName),
                getSafeDisplayText((userProfile as any)?.name),
                getSafeDisplayText((userProfile as any)?.fullName),
                getSafeDisplayText(userProfile?.email),
            ]);

            if (currentUserName) return currentUserName;
        }

        const emailFallback = getFirstTextValue([
            getSafeDisplayText(invoice?.createdByEmail),
            getSafeDisplayText(invoice?.submittedByEmail),
            getSafeDisplayText(invoice?.email),
        ]);

        if (emailFallback) return emailFallback;

        return "Unknown User";
    }

    const visibleInvoicesForFilterOptions = useMemo(() => {
        return (invoices || []).filter((invoice: any) => {
            const canSeeAllRequests = canCurrentUserSeeAllBudgetRequests();
            return canSeeAllRequests || isOwnBudgetRequest(invoice);
        });
    }, [invoices, userProfile, currentUserRole, usersByLookup]);

    const createdByOptions = useMemo(() => {
        const names = Array.from(
            new Set(
                visibleInvoicesForFilterOptions
                    .map((invoice: any) => getCreatedByName(invoice))
                    .filter((name) => String(name || "").trim()),
            ),
        );

        return names.sort((a, b) => a.localeCompare(b));
    }, [
        visibleInvoicesForFilterOptions,
        usersByLookup,
        creatorNamesByLookup,
        userProfile,
    ]);

    function getInvoiceWithCreator(invoice: InvoiceRequest): InvoiceRequest {
        const createdByName = getCreatedByName(invoice);
        const returnedToRole = wasReturnedToCreator(invoice)
            ? getBudgetRequestOwnerRole(invoice)
            : getDirectReturnedRole(invoice);
        const returnedToRoleLabel = formatRoleLabel(returnedToRole);

        return {
            ...(invoice as any),
            createdByName,
            submittedByName: (invoice as any)?.submittedByName || createdByName,
            requestedByName: (invoice as any)?.requestedByName || createdByName,
            returnedToRole,
            returnedToRoleLabel,
        } as InvoiceRequest;
    }

    function openDetailsModal(invoice: InvoiceRequest) {
        setSelectedInvoice(getInvoiceWithCreator(invoice));
        setIsDetailsModalOpen(true);
    }

    const statusOptions = useMemo(() => {
        const uniqueStatuses = Array.from(
            new Set(
                (invoices || []).map((invoice) => invoice.status).filter(Boolean),
            ),
        );

        return uniqueStatuses.sort();
    }, [invoices]);

    const filteredInvoices = useMemo(() => {
        const search = normalizeText(searchTerm);
        const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
        const toDate = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

        return (invoices || []).filter((invoice: any) => {
            const requestType = getRequestType(invoice);
            const requestDate = getRequestDate(invoice);
            const requestDateInputValue = getDateInputValue(requestDate);
            const createdByName = getCreatedByName(invoice);
            const projectCode = String(invoice?.projectCode || "").trim();
            const vendorName = getVendorFilterText(invoice);
            const chequeFilterText = getChequeFilterText(invoice);
            const descriptionSearchText = getDescriptionSearchText(invoice);

            const haystack = normalizeText(
                [
                    invoice.requestId,
                    invoice.title,
                    invoice.subject,
                    invoice.clientName,
                    invoice.projectName,
                    invoice.project,
                    projectCode,
                    invoice.totalAmount,
                    invoice.approvedAmount,
                    invoice.vendorName,
                    invoice.supplierName,
                    vendorName,
                    descriptionSearchText,
                    createdByName,
                    (invoice as any).createdByName,
                    (invoice as any).submittedByName,
                    (invoice as any).requestedByName,
                    (invoice as any).createdByEmail,
                    (invoice as any).submittedByEmail,
                ].join(" "),
            );

            const matchesSearch = !search || haystack.includes(search);
            const matchesType = typeFilter === "all" || requestType === typeFilter;
            const matchesStatus =
                statusFilter === "all" || invoice.status === statusFilter;
            const matchesMonth =
                !monthFilter || requestDateInputValue.startsWith(monthFilter);
            const matchesCreatedBy =
                createdByFilter === "all" ||
                normalizeText(createdByName) === normalizeText(createdByFilter);
            const matchesProjectCode =
                !normalizeText(projectCodeFilter) ||
                normalizeText(projectCode).includes(normalizeText(projectCodeFilter));
            const matchesVendor =
                !normalizeText(vendorFilter) ||
                normalizeText(vendorName).includes(normalizeText(vendorFilter));
            const matchesCheque =
                !normalizeText(chequeFilter) ||
                normalizeText(chequeFilterText).includes(normalizeText(chequeFilter));
            const matchesFrom = !fromDate || (requestDate && requestDate >= fromDate);
            const matchesTo = !toDate || (requestDate && requestDate <= toDate);
            const canSeeAllRequests = canCurrentUserSeeAllBudgetRequests();
            const matchesOwnership = canSeeAllRequests || isOwnBudgetRequest(invoice);

            return (
                matchesOwnership &&
                matchesSearch &&
                matchesType &&
                matchesStatus &&
                matchesMonth &&
                matchesCreatedBy &&
                matchesProjectCode &&
                matchesVendor &&
                matchesCheque &&
                matchesFrom &&
                matchesTo
            );
        });
    }, [
        dateFrom,
        dateTo,
        invoices,
        monthFilter,
        searchTerm,
        statusFilter,
        typeFilter,
        createdByFilter,
        projectCodeFilter,
        vendorFilter,
        chequeFilter,
        userProfile,
        currentUserRole,
        usersByLookup,
        creatorNamesByLookup,
    ]);

    const summary = useMemo(() => {
        const totalAmount = filteredInvoices.reduce(
            (sum, invoice: any) => sum + safeNumber(invoice.totalAmount),
            0,
        );

        const projectCount = filteredInvoices.filter(
            (invoice) => getRequestType(invoice) === "project",
        ).length;

        const generalCount = filteredInvoices.filter(
            (invoice) => getRequestType(invoice) === "general",
        ).length;

        const approvedCount = filteredInvoices.filter(
            (invoice) => invoice.status === "approved",
        ).length;

        return { totalAmount, projectCount, generalCount, approvedCount };
    }, [filteredInvoices]);

    const sortedInvoices = useMemo(() => {
        return [...filteredInvoices].sort((a, b) =>
            compareBudgetRequestsForTable(
                a,
                b,
                currentUserRole,
                canReleasePayment,
            ),
        );
    }, [filteredInvoices, currentUserRole, purchaseOrders, userProfile]);

    const totalPages = Math.max(1, Math.ceil(sortedInvoices.length / pageSize));
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedInvoices = sortedInvoices.slice(
        startIndex,
        startIndex + pageSize,
    );
    const showingFrom = sortedInvoices.length === 0 ? 0 : startIndex + 1;
    const showingTo = Math.min(startIndex + pageSize, sortedInvoices.length);

    useEffect(() => {
        setCurrentPage(1);
    }, [
        searchTerm,
        typeFilter,
        statusFilter,
        dateFrom,
        dateTo,
        monthFilter,
        createdByFilter,
        projectCodeFilter,
        vendorFilter,
        chequeFilter,
        pageSize,
    ]);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    function clearFilters() {
        setSearchTerm("");
        setTypeFilter("all");
        setStatusFilter("all");
        setDateFrom("");
        setDateTo("");
        setMonthFilter("");
        setCreatedByFilter("all");
        setProjectCodeFilter("");
        setVendorFilter("");
        setChequeFilter("");
        setPageSize(10);
    }

    function getVisiblePages() {
        const pages: number[] = [];
        const firstPage = Math.max(1, currentPage - 2);
        const lastPage = Math.min(totalPages, currentPage + 2);

        for (let page = firstPage; page <= lastPage; page += 1) {
            pages.push(page);
        }

        return pages;
    }

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/60 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto space-y-6">
                <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="mt-2 max-w-2xl text-sm text-slate-500">
                            Review project and general budget requests, send requests through
                            Admin and Finance approval, release payments, or create POs.
                        </p>
                    </div>

                    {canCreateInvoices && (
                        <Button
                            className="h-11 rounded-2xl px-5 shadow-sm"
                            onClick={() => {
                                setSelectedInvoice(null);
                                setIsInvoiceModalOpen(true);
                            }}
                            data-testid="button-new-invoice-request"
                        >
                            + New Request
                        </Button>
                    )}
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
                        <CardContent className="p-5">
                            <p className="text-sm font-medium text-slate-500">
                                Filtered Requests
                            </p>
                            <p className="mt-3 text-3xl font-semibold text-slate-950">
                                {filteredInvoices.length}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                                Total records after filters
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
                        <CardContent className="p-5">
                            <p className="text-sm font-medium text-slate-500">
                                Project Requests
                            </p>
                            <p className="mt-3 text-3xl font-semibold text-slate-950">
                                {summary.projectCount}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                                PO flow after approval
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
                        <CardContent className="p-5">
                            <p className="text-sm font-medium text-slate-500">
                                General Requests
                            </p>
                            <p className="mt-3 text-3xl font-semibold text-slate-950">
                                {summary.generalCount}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                                Payment release flow
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
                        <CardContent className="p-5">
                            <p className="text-sm font-medium text-slate-500">
                                Filtered Value
                            </p>
                            <p className="mt-3 text-2xl font-semibold text-slate-950">
                                Rs {formatPKR(summary.totalAmount)}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                                Approved waiting: {summary.approvedCount}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
                    <CardContent className="space-y-4 p-5">
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
                            <div className="xl:col-span-2">
                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                    Search
                                </label>
                                <input
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    placeholder="Request ID, item, description, client, project..."
                                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                    Created By
                                </label>
                                <select
                                    value={createdByFilter}
                                    onChange={(event) => setCreatedByFilter(event.target.value)}
                                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                                >
                                    <option value="all">All Creators</option>
                                    {createdByOptions.map((name) => (
                                        <option key={name} value={name}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                    Project Code
                                </label>
                                <input
                                    value={projectCodeFilter}
                                    onChange={(event) => setProjectCodeFilter(event.target.value)}
                                    placeholder="Enter project code..."
                                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                    Request Type
                                </label>
                                <select
                                    value={typeFilter}
                                    onChange={(event) =>
                                        setTypeFilter(
                                            event.target.value as "all" | "project" | "general",
                                        )
                                    }
                                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                                >
                                    <option value="all">All Types</option>
                                    <option value="project">Project</option>
                                    <option value="general">General</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                    Status
                                </label>
                                <select
                                    value={statusFilter}
                                    onChange={(event) => setStatusFilter(event.target.value)}
                                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                                >
                                    <option value="all">All Statuses</option>
                                    {statusOptions.map((status) => (
                                        <option key={status} value={status}>
                                            {getStatusLabel(status)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                    Month
                                </label>
                                <input
                                    type="month"
                                    value={monthFilter}
                                    onChange={(event) => setMonthFilter(event.target.value)}
                                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                                />
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                    Vendor
                                </label>
                                <input
                                    value={vendorFilter}
                                    onChange={(event) => setVendorFilter(event.target.value)}
                                    placeholder="Enter vendor name..."
                                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                    Cheque Number
                                </label>
                                <input
                                    value={chequeFilter}
                                    onChange={(event) => setChequeFilter(event.target.value)}
                                    placeholder="Enter cheque number..."
                                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                    From Date
                                </label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(event) => setDateFrom(event.target.value)}
                                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                    To Date
                                </label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(event) => setDateTo(event.target.value)}
                                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                    Rows
                                </label>
                                <select
                                    value={pageSize}
                                    onChange={(event) => setPageSize(Number(event.target.value))}
                                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>

                            <div className="flex items-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-11 w-full rounded-2xl border-slate-200 bg-white"
                                    onClick={clearFilters}
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1400px]">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/80">
                                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Request ID
                                        </th>
                                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Type
                                        </th>
                                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Client / Title
                                        </th>
                                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Project
                                        </th>
                                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Created By
                                        </th>
                                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Submit Date
                                        </th>
                                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Total Amount
                                        </th>
                                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Released / Balance
                                        </th>
                                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Status
                                        </th>
                                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Current Step
                                        </th>
                                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {paginatedInvoices.length === 0 ? (
                                        <tr>
                                            <td colSpan={11} className="px-6 py-12 text-center">
                                                <p className="text-sm font-medium text-slate-600">
                                                    No budget requests found
                                                </p>
                                                <p className="mt-1 text-sm text-slate-400">
                                                    Try changing your filters or create a new request.
                                                </p>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedInvoices.map((invoice) => {
                                            const type = getRequestType(invoice);

                                            const displayClientOrTitle =
                                                type === "general"
                                                    ? (invoice as any).title ||
                                                    (invoice as any).subject ||
                                                    "General Request"
                                                    : (invoice as any).clientName || "-";

                                            const projectName =
                                                type === "project"
                                                    ? (invoice as any).projectName ||
                                                    (invoice as any).project ||
                                                    (invoice as any).projectCode ||
                                                    "-"
                                                    : "-";

                                            const createdByName = getCreatedByName(invoice);
                                            const approvedPaymentAmount =
                                                getApprovedPaymentAmount(invoice);
                                            const totalReleasedAmount =
                                                getTotalReleasedAmount(invoice);
                                            const remainingPaymentBalance =
                                                getRemainingPaymentBalance(invoice);
                                            //   const paymentHistory = getPaymentReleaseHistory(invoice);
                                            const paymentProgressPercent = approvedPaymentAmount
                                                ? Math.min(
                                                    100,
                                                    Math.max(
                                                        0,
                                                        (totalReleasedAmount / approvedPaymentAmount) *
                                                        100,
                                                    ),
                                                )
                                                : 0;

                                            return (
                                                <tr
                                                    key={invoice.id}
                                                    className="transition hover:bg-slate-50/80"
                                                >
                                                    <td
                                                        className="px-5 py-4 text-sm font-semibold text-slate-900"
                                                        data-testid={`text-request-id-${invoice.id}`}
                                                    >
                                                        {invoice.requestId || "-"}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <Badge
                                                            variant="outline"
                                                            className={`rounded-full px-3 py-1 ${getTypeBadgeColor(
                                                                type,
                                                            )}`}
                                                        >
                                                            {type === "project" ? "Project" : "General"}
                                                        </Badge>
                                                    </td>

                                                    <td className="px-5 py-4 text-sm text-slate-700">
                                                        <div className="font-medium text-slate-900">
                                                            {displayClientOrTitle}
                                                        </div>
                                                        {(invoice as any).projectCode &&
                                                            type === "project" && (
                                                                <div className="mt-1 text-xs text-slate-400">
                                                                    Code: {(invoice as any).projectCode}
                                                                </div>
                                                            )}
                                                    </td>

                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {projectName}
                                                    </td>

                                                    <td
                                                        className="px-5 py-4 text-sm font-medium text-slate-700"
                                                        data-testid={`text-created-by-${invoice.id}`}
                                                    >
                                                        {createdByName}
                                                    </td>

                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {formatRequestDate(invoice)}
                                                    </td>

                                                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                                                        Rs{" "}
                                                        {formatPKR(
                                                            approvedPaymentAmount || invoice.totalAmount,
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <span className="text-xs text-slate-500">
                                                                    Released
                                                                </span>
                                                                <span className="font-semibold text-slate-900">
                                                                    Rs {formatPKR(totalReleasedAmount)}
                                                                </span>
                                                            </div>
                                                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                                                <div
                                                                    className="h-full rounded-full bg-slate-950"
                                                                    style={{
                                                                        width: `${paymentProgressPercent}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="flex items-center justify-between gap-3">
                                                                <span className="text-xs text-slate-500">
                                                                    Balance
                                                                </span>
                                                                <span className="font-semibold text-slate-900">
                                                                    Rs {formatPKR(remainingPaymentBalance)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <Badge
                                                            variant="outline"
                                                            className={`rounded-full px-3 py-1 ${getStatusBadgeColor(
                                                                invoice.status,
                                                                invoice,
                                                            )}`}
                                                        >
                                                            {getBudgetRequestStatusLabel(invoice)}
                                                        </Badge>
                                                    </td>

                                                    <td className="px-5 py-4 text-sm text-slate-500">
                                                        {getCurrentStep(invoice)}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <div className="flex flex-wrap gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                                                onClick={() => openDetailsModal(invoice)}
                                                                data-testid={`button-view-details-${invoice.id}`}
                                                            >
                                                                View
                                                            </Button>

                                                            {canEdit(invoice) && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="rounded-xl border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                                                    onClick={() => {
                                                                        if (!canEdit(invoice)) {
                                                                            toast({
                                                                                title: "Edit not allowed",
                                                                                description:
                                                                                    "This request can no longer be edited because it has already been approved by Admin.",
                                                                                variant: "destructive",
                                                                            });
                                                                            return;
                                                                        }

                                                                        setSelectedInvoice(
                                                                            getEditableInvoice(invoice),
                                                                        );
                                                                        setIsInvoiceModalOpen(true);
                                                                    }}
                                                                    data-testid={`button-edit-${invoice.id}`}
                                                                >
                                                                    Edit
                                                                </Button>
                                                            )}

                                                            {canReleasePayment(invoice) && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="rounded-xl border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                                                    onClick={() => {
                                                                        const linkedPO = getLinkedPO(invoice);

                                                                        setSelectedInvoice({
                                                                            ...invoice,
                                                                            invoiceNumber: invoice.requestId,
                                                                            vendorName:
                                                                                (invoice as any).vendorName ||
                                                                                (invoice as any).supplierName ||
                                                                                (invoice as any).clientName,
                                                                            amount: remainingPaymentBalance,
                                                                            approvedAmount: approvedPaymentAmount,
                                                                            totalApprovedAmount:
                                                                                approvedPaymentAmount,
                                                                            totalReleasedAmount,
                                                                            remainingReleaseAmount:
                                                                                remainingPaymentBalance,
                                                                            dueDate: new Date(),
                                                                            poId:
                                                                                (invoice as any).poId ||
                                                                                (invoice as any).poDocId ||
                                                                                linkedPO?.id ||
                                                                                linkedPO?.poId ||
                                                                                linkedPO?.poDocId ||
                                                                                "",
                                                                            poNumber:
                                                                                (invoice as any).poNumber ||
                                                                                (invoice as any).purchaseOrderNumber ||
                                                                                linkedPO?.poNumber ||
                                                                                linkedPO?.purchaseOrderNumber ||
                                                                                "",
                                                                        } as any);
                                                                        setIsPaymentModalOpen(true);
                                                                    }}
                                                                    data-testid={`button-release-payment-${invoice.id}`}
                                                                >
                                                                    Release Payment
                                                                </Button>
                                                            )}

                                                            {/* {(hasAnyPaymentRelease(invoice) ||
                                                                canManagePaymentHistory(invoice) ||
                                                                getPaymentHistoryCount(invoice) > 0) && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                                                        onClick={() => {
                                                                            setPaymentHistoryInvoice(invoice);
                                                                            setIsPaymentHistoryModalOpen(true);
                                                                        }}
                                                                        data-testid={`button-payment-history-${invoice.id}`}
                                                                    >
                                                                        History ({getPaymentHistoryCount(invoice)})
                                                                    </Button>
                                                                )} */}


                                                                {getPaymentHistoryCount(invoice) > 0 && (
  <Button
    variant="outline"
    size="sm"
    className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
    onClick={() => {
      setPaymentHistoryInvoice(invoice);
      setIsPaymentHistoryModalOpen(true);
    }}
    data-testid={`button-payment-history-${invoice.id}`}
  >
    History ({getPaymentHistoryCount(invoice)})
  </Button>
)}

                                                            {canCreatePO(invoice) && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="rounded-xl border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                                                                    onClick={() => handleCreatePO(invoice)}
                                                                    data-testid={`button-create-po-${invoice.id}`}
                                                                >
                                                                    Create PO
                                                                </Button>
                                                            )}

                                                            {canShowExpenseAction(invoice) && (
                                                                <>
                                                                    {canSubmitExpense(invoice) ? (
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="rounded-xl border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
                                                                            onClick={() => openExpenseModal(invoice)}
                                                                            data-testid={`button-submit-expense-${invoice.id}`}
                                                                        >
                                                                            Submit Expense
                                                                        </Button>
                                                                    ) : (
                                                                        <div
                                                                            className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500"
                                                                            data-testid={`text-expense-status-${invoice.id}`}
                                                                        >
                                                                            {getExpenseSheetStatus(invoice) ===
                                                                                "rejected"
                                                                                ? "Expense Sheet Rejected"
                                                                                : "Expense Submitted — No Approval Required"}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-slate-500">
                                Showing{" "}
                                <span className="font-medium text-slate-700">
                                    {showingFrom}
                                </span>{" "}
                                to{" "}
                                <span className="font-medium text-slate-700">{showingTo}</span>{" "}
                                of{" "}
                                <span className="font-medium text-slate-700">
                                    {sortedInvoices.length}
                                </span>{" "}
                                requests
                            </p>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl border-slate-200"
                                    disabled={currentPage === 1}
                                    onClick={() =>
                                        setCurrentPage((page) => Math.max(1, page - 1))
                                    }
                                >
                                    Previous
                                </Button>

                                {getVisiblePages().map((page) => (
                                    <Button
                                        key={page}
                                        type="button"
                                        variant={page === currentPage ? "default" : "outline"}
                                        size="sm"
                                        className="h-9 w-9 rounded-xl p-0"
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </Button>
                                ))}

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl border-slate-200"
                                    disabled={currentPage === totalPages}
                                    onClick={() =>
                                        setCurrentPage((page) => Math.min(totalPages, page + 1))
                                    }
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <InvoiceRequestModal
                isOpen={isInvoiceModalOpen}
                onClose={() => {
                    setIsInvoiceModalOpen(false);
                    setSelectedInvoice(null);
                }}
                onSuccess={() => {
                    setIsInvoiceModalOpen(false);
                    setSelectedInvoice(null);
                }}
                editingInvoice={selectedInvoice}
            />

            <PaymentReleaseModal
                isOpen={isPaymentModalOpen}
                onClose={() => {
                    setIsPaymentModalOpen(false);
                    setSelectedInvoice(null);
                }}
                onSuccess={handlePaymentReleased}
                invoice={selectedInvoice}
            />

            {selectedInvoice && (
                <ExpenseSheetModal
                    isOpen={isExpenseModalOpen}
                    onClose={() => {
                        setIsExpenseModalOpen(false);
                        setSelectedInvoice(null);
                        localStorage.removeItem("submitExpenseFromBudgetRequest");
                        localStorage.removeItem("expenseSheetSource");
                    }}
                    onSuccess={handleExpenseSubmitted}
                />
            )}

            <InvoiceDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedInvoice(null);
                }}
                invoice={selectedInvoice}
            />


            {/* <PaymentHistoryModal
  isOpen={isPaymentHistoryModalOpen}
  invoice={paymentHistoryInvoice}
  canEdit={
    Boolean(paymentHistoryInvoice) &&
    canManagePaymentHistory(
      paymentHistoryInvoice as InvoiceRequest,
    )
  }
  onClose={() => {
    setIsPaymentHistoryModalOpen(false);
    setPaymentHistoryInvoice(null);
  }}
  onSuccess={() => {
    setIsPaymentHistoryModalOpen(false);
    setPaymentHistoryInvoice(null);
  }}
/> */}

<PaymentHistoryModal
  isOpen={isPaymentHistoryModalOpen}
  invoice={paymentHistoryInvoice}
  canEdit={
    Boolean(paymentHistoryInvoice) &&
    isFinanceApproverRole(userProfile?.role) &&
    getPaymentHistoryCount(paymentHistoryInvoice) > 0
  }
  onClose={() => {
    setIsPaymentHistoryModalOpen(false);
    setPaymentHistoryInvoice(null);
  }}
  onSuccess={() => {
    setIsPaymentHistoryModalOpen(false);
    setPaymentHistoryInvoice(null);
  }}
/>

            <RejectionModal
                isOpen={isRejectionModalOpen}
                onClose={() => {
                    setIsRejectionModalOpen(false);
                    setSelectedInvoice(null);
                }}
                onConfirm={(comment) =>
                    selectedInvoice && handleReject(selectedInvoice, comment)
                }
                itemType="invoice request"
                loading={rejectionLoading}
            />
        </div>
    );
}
