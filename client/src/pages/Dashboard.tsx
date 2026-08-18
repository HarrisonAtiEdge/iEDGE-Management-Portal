// import {
//   useCallback,
//   useEffect,
//   useMemo,
//   useState,
//   type ReactNode,
// } from "react";
// import {
//   collection,
//   collectionGroup,
//   doc,
//   getDoc,
//   getDocs,
//   onSnapshot,
//   type DocumentData,
//   type QueryDocumentSnapshot,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { useAuth } from "@/contexts/AuthContext";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import InvoiceRequestModal from "@/components/BudgetRequestModal";
// import {
//   Activity,
//   AlertTriangle,
//   ArrowDownRight,
//   ArrowUpRight,
//   BadgeCheck,
//   Banknote,
//   BarChart3,
//   Building2,
//   CalendarClock,
//   CheckCircle2,
//   CircleDollarSign,
//   Clock3,
//   CreditCard,
//   FileCheck2,
//   FileSpreadsheet,
//   FileText,
//   Landmark,
//   ListChecks,
//   PackageCheck,
//   Plus,
//   ReceiptText,
//   RefreshCcw,
//   TrendingUp,
//   Users,
//   Wallet,
//   XCircle,
//   type LucideIcon,
// } from "lucide-react";
// import {
//   Area,
//   AreaChart,
//   Bar,
//   BarChart,
//   CartesianGrid,
//   Cell,
//   ResponsiveContainer,
//   Tooltip,
//   XAxis,
//   YAxis,
// } from "recharts";

// const PANEL_ID = "IEDGE-SYSTEM";

// type AnyRow = Record<string, any> & { id: string };

// type ActivityItem = {
//   id: string;
//   module: string;
//   title: string;
//   description: string;
//   status: string;
//   date: Date | null;
// };

// type MoneyEvent = {
//   date: Date | null;
//   amount: number;
// };

// type DashboardData = {
//   invoiceRequests: AnyRow[];
//   estimates: AnyRow[];
//   estimateInvoices: AnyRow[];
//   payments: AnyRow[];
//   expenseSheets: AnyRow[];
//   directClaims: AnyRow[];
//   meetingClaims: AnyRow[];
//   records: AnyRow[];
//   purchaseOrders: AnyRow[];
//   manualEntries: AnyRow[];
//   openingBalance: number;
// };

// const EMPTY_DATA: DashboardData = {
//   invoiceRequests: [],
//   estimates: [],
//   estimateInvoices: [],
//   payments: [],
//   expenseSheets: [],
//   directClaims: [],
//   meetingClaims: [],
//   records: [],
//   purchaseOrders: [],
//   manualEntries: [],
//   openingBalance: 0,
// };

// const normalizeText = (value: any) =>
//   String(value || "")
//     .trim()
//     .toLowerCase();

// const safeNumber = (value: any): number => {
//   if (value === null || value === undefined || value === "") return 0;

//   const parsed =
//     typeof value === "number"
//       ? value
//       : Number(String(value).replace(/,/g, ""));

//   return Number.isFinite(parsed) ? parsed : 0;
// };

// const firstText = (...values: any[]): string => {
//   for (const value of values) {
//     if (value === null || value === undefined || typeof value === "object") {
//       continue;
//     }

//     const text = String(value).trim();
//     if (text) return text;
//   }

//   return "";
// };

// const toDate = (value: any): Date | null => {
//   if (!value) return null;

//   try {
//     if (value instanceof Date) {
//       return Number.isNaN(value.getTime()) ? null : value;
//     }

//     if (typeof value?.toDate === "function") {
//       const date = value.toDate();
//       return Number.isNaN(date?.getTime?.()) ? null : date;
//     }

//     if (typeof value?.seconds === "number") {
//       const date = new Date(value.seconds * 1000);
//       return Number.isNaN(date.getTime()) ? null : date;
//     }

//     if (typeof value === "string") {
//       const trimmed = value.trim();

//       const ymd = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
//       if (ymd) {
//         const date = new Date(
//           Number(ymd[1]),
//           Number(ymd[2]) - 1,
//           Number(ymd[3]),
//         );
//         return Number.isNaN(date.getTime()) ? null : date;
//       }

//       const dmy = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
//       if (dmy) {
//         const date = new Date(
//           Number(dmy[3]),
//           Number(dmy[2]) - 1,
//           Number(dmy[1]),
//         );
//         return Number.isNaN(date.getTime()) ? null : date;
//       }
//     }

//     const date = new Date(value);
//     return Number.isNaN(date.getTime()) ? null : date;
//   } catch {
//     return null;
//   }
// };

// const getEntityDate = (source: any): Date | null =>
//   toDate(source?.paymentReleasedAt) ||
//   toDate(source?.releasePaymentAt) ||
//   toDate(source?.releasedAt) ||
//   toDate(source?.paymentDate) ||
//   toDate(source?.submittedAt) ||
//   toDate(source?.createdAt) ||
//   toDate(source?.updatedAt) ||
//   toDate(source?.invoiceDate) ||
//   toDate(source?.date) ||
//   toDate(source?.issueDate) ||
//   null;

// const getRequestDate = (source: any): Date | null =>
//   toDate(source?.submitDate) ||
//   toDate(source?.submittedAt) ||
//   toDate(source?.submissionDate) ||
//   toDate(source?.requestDate) ||
//   toDate(source?.createdAt) ||
//   toDate(source?.date) ||
//   toDate(source?.updatedAt) ||
//   null;

// const formatPKR = (value: any): string =>
//   `Rs ${safeNumber(value).toLocaleString("en-PK", {
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 2,
//   })}`;

// const formatCompactPKR = (value: any): string => {
//   const number = safeNumber(value);

//   if (Math.abs(number) >= 1_000_000_000) {
//     return `Rs ${(number / 1_000_000_000).toFixed(1)}B`;
//   }

//   if (Math.abs(number) >= 1_000_000) {
//     return `Rs ${(number / 1_000_000).toFixed(1)}M`;
//   }

//   if (Math.abs(number) >= 1_000) {
//     return `Rs ${(number / 1_000).toFixed(1)}K`;
//   }

//   return formatPKR(number);
// };

// const formatRelativeTime = (date: Date | null): string => {
//   if (!date) return "Date unavailable";

//   const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60_000);

//   if (diffMinutes < 1) return "Just now";
//   if (diffMinutes < 60) return `${diffMinutes} min ago`;
//   if (diffMinutes < 1_440) return `${Math.floor(diffMinutes / 60)} hr ago`;
//   if (diffMinutes < 10_080)
//     return `${Math.floor(diffMinutes / 1_440)} days ago`;

//   return date.toLocaleDateString("en-PK", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// };

// const humanize = (value: any): string =>
//   String(value || "Unknown")
//     .replace(/_/g, " ")
//     .replace(/\b\w/g, (letter) => letter.toUpperCase());

// const getApprovedRequestAmount = (request: any): number =>
//   safeNumber(
//     request?.approvedAmount ??
//       request?.totalApprovedAmount ??
//       request?.approvedTotal ??
//       request?.totalAmount ??
//       request?.amount,
//   );

// const getReleaseAmount = (entry: any): number =>
//   safeNumber(
//     entry?.amount ??
//       entry?.releaseAmount ??
//       entry?.releasedAmount ??
//       entry?.paymentAmount,
//   );

// const getPaymentReleaseHistory = (request: any): any[] => {
//   const history = Array.isArray(request?.paymentReleaseHistory)
//     ? request.paymentReleaseHistory
//     : [];

//   const validHistory = history.filter(
//     (entry: any) => getReleaseAmount(entry) > 0,
//   );

//   if (validHistory.length > 0) return validHistory;

//   const legacy = request?.paymentDetails || request?.latestPaymentRelease;
//   if (legacy && getReleaseAmount(legacy) > 0) {
//     return [
//       {
//         ...legacy,
//         releasedAt:
//           legacy?.releasedAt ||
//           request?.paymentReleasedAt ||
//           request?.releasePaymentAt ||
//           request?.updatedAt,
//       },
//     ];
//   }

//   return [];
// };

// const getReleasedRequestAmount = (request: any): number => {
//   const explicit = safeNumber(request?.totalReleasedAmount);
//   if (explicit > 0) return explicit;

//   const historyTotal = getPaymentReleaseHistory(request).reduce(
//     (sum, entry) => sum + getReleaseAmount(entry),
//     0,
//   );

//   if (historyTotal > 0) return historyTotal;

//   const status = normalizeText(request?.status);
//   if (
//     ["payment_released", "released"].includes(status) ||
//     request?.paymentReleased === true
//   ) {
//     return getApprovedRequestAmount(request);
//   }

//   return safeNumber(
//     request?.releasedAmount ??
//       request?.paidAmount ??
//       request?.paymentAmount,
//   );
// };

// const getRemainingRequestAmount = (request: any): number => {
//   if (
//     request?.remainingReleaseAmount !== undefined &&
//     request?.remainingReleaseAmount !== null
//   ) {
//     return Math.max(safeNumber(request.remainingReleaseAmount), 0);
//   }

//   return Math.max(
//     getApprovedRequestAmount(request) - getReleasedRequestAmount(request),
//     0,
//   );
// };

// const isFullyReleased = (request: any): boolean => {
//   const approved = getApprovedRequestAmount(request);
//   const released = getReleasedRequestAmount(request);
//   const remaining = getRemainingRequestAmount(request);
//   const status = normalizeText(request?.status);

//   if (approved > 0 && (remaining <= 0.009 || released >= approved - 0.009)) {
//     return true;
//   }

//   return ["payment_released", "released"].includes(status);
// };

// const isPartiallyReleased = (request: any): boolean =>
//   getReleasedRequestAmount(request) > 0 && !isFullyReleased(request);

// const getInvoiceStatus = (invoice: any): string => {
//   const raw = normalizeText(invoice?.status || invoice?.paymentStatus);

//   if (raw === "paid") return "paid";
//   if (["partially paid", "partially_paid", "partial"].includes(raw)) {
//     return "partial";
//   }

//   return "unpaid";
// };

// const getClaimStatus = (claim: any): string => {
//   const status = normalizeText(claim?.status || claim?.approvalStatus);

//   if (status === "approved") return "approved";
//   if (status === "rejected") return "rejected";
//   return "pending";
// };

// const getClaimAmount = (claim: any): number =>
//   safeNumber(
//     claim?.claimAmount ??
//       claim?.amount ??
//       claim?.approvedAmount ??
//       claim?.paidAmount,
//   );

// const getClaimPaidAmount = (claim: any): number => {
//   if (normalizeText(claim?.paymentStatus) !== "paid") return 0;

//   return safeNumber(
//     claim?.paidAmount ??
//       claim?.approvedAmount ??
//       claim?.claimAmount ??
//       claim?.amount,
//   );
// };

// const getExpenseAmount = (expense: any): number =>
//   safeNumber(expense?.totalAmount ?? expense?.amount);

// const getPurchaseOrderAmount = (purchaseOrder: any): number =>
//   safeNumber(
//     purchaseOrder?.totalAmount ??
//       purchaseOrder?.total ??
//       purchaseOrder?.amount,
//   );

// const getEstimateAmount = (estimate: any): number =>
//   safeNumber(estimate?.total ?? estimate?.totalAmount ?? estimate?.amount);

// const getEstimateInvoiceAmount = (invoice: any): number =>
//   safeNumber(invoice?.total ?? invoice?.totalAmount ?? invoice?.amount);

// const getVendorNames = (request: any): string[] => {
//   const names = new Set<string>();

//   const direct = firstText(
//     request?.vendorName,
//     request?.supplierName,
//     request?.payeeName,
//     request?.payee,
//   );
//   if (direct) names.add(direct);

//   const items = [
//     ...(Array.isArray(request?.approvalItems) ? request.approvalItems : []),
//     ...(Array.isArray(request?.lineItems) ? request.lineItems : []),
//     ...(Array.isArray(request?.items) ? request.items : []),
//   ];

//   items.forEach((item: any) => {
//     const name = firstText(
//       item?.vendor,
//       item?.vendorName,
//       item?.supplier,
//       item?.supplierName,
//       item?.original?.vendor,
//       item?.original?.supplier,
//     );

//     if (name) names.add(name);
//   });

//   return Array.from(names);
// };

// const isOverdueDate = (value: any): boolean => {
//   const date = toDate(value);
//   if (!date) return false;

//   const today = new Date();
//   today.setHours(0, 0, 0, 0);
//   date.setHours(0, 0, 0, 0);

//   return date < today;
// };

// const snapshotToRows = (
//   snapshot: { docs: QueryDocumentSnapshot<DocumentData>[] },
// ): AnyRow[] =>
//   snapshot.docs.map((document) => ({
//     id: document.id,
//     ...document.data(),
//   }));

// const FULL_DASHBOARD_ROLES = new Set([
//   "main_admin",
//   "mainadmin",
//   "finance",
//   "finance_admin",
//   "financial_admin",
// ]);

// const SCOPE_FIELD_NAMES = [
//   "id",
//   "uid",
//   "userId",
//   "userUID",
//   "profileId",
//   "employeeId",
//   "employeeUID",
//   "email",
//   "userEmail",
//   "employeeEmail",
//   "displayName",
//   "fullName",
//   "name",
//   "createdBy",
//   "createdById",
//   "createdByUid",
//   "createdByEmail",
//   "creatorId",
//   "creatorEmail",
//   "submittedBy",
//   "submittedById",
//   "submittedByUid",
//   "submittedByEmail",
//   "requestedBy",
//   "requestedById",
//   "requestedByEmail",
//   "owner",
//   "ownerId",
//   "ownerEmail",
//   "assignedTo",
//   "assignedToId",
//   "assignedUserId",
//   "assignedUserEmail",
//   "assignee",
//   "assigneeId",
//   "assigneeEmail",
//   "personId",
//   "personEmail",
//   "salesPersonId",
//   "salesPersonEmail",
//   "teamMemberId",
//   "teamMemberEmail",
//   "department",
//   "departmentId",
//   "team",
//   "teamId",
//   "role",
//   "createdByRole",
//   "assignedRole",
//   "projectId",
//   "projectCode",
//   "assignedProjectId",
// ];

// const NESTED_SCOPE_FIELD_NAMES = [
//   "createdByUser",
//   "submittedByUser",
//   "requestedByUser",
//   "ownerUser",
//   "assignedUser",
//   "assigneeUser",
//   "employee",
//   "user",
//   "profile",
//   "teamMembers",
//   "assignedUsers",
//   "assignedToUsers",
//   "members",
//   "assignedProjects",
//   "projectIds",
//   "allowedProjectIds",
// ];

// const addScopeValue = (target: Set<string>, value: any) => {
//   if (value === null || value === undefined || value === "") return;

//   if (Array.isArray(value)) {
//     value.forEach((item) => addScopeValue(target, item));
//     return;
//   }

//   if (typeof value === "object") {
//     SCOPE_FIELD_NAMES.forEach((field) => addScopeValue(target, value?.[field]));
//     return;
//   }

//   const normalized = normalizeText(value);
//   if (normalized) target.add(normalized);
// };

// const collectScopeValues = (source: any): Set<string> => {
//   const values = new Set<string>();
//   if (!source) return values;

//   SCOPE_FIELD_NAMES.forEach((field) => addScopeValue(values, source?.[field]));
//   NESTED_SCOPE_FIELD_NAMES.forEach((field) =>
//     addScopeValue(values, source?.[field]),
//   );

//   return values;
// };

// const rowMatchesUserScope = (row: AnyRow, profile: any): boolean => {
//   const profileScope = collectScopeValues(profile);
//   if (profileScope.size === 0) return false;

//   const rowScope = collectScopeValues(row);
//   for (const value of rowScope) {
//     if (profileScope.has(value)) return true;
//   }

//   return false;
// };

// type RestrictedActivity = {
//   id: string;
//   module: string;
//   title: string;
//   description: string;
//   status: string;
//   date: Date | null;
// };

// const getRestrictedRoleConfig = (roleKey: string) => {
//   if (["operation", "operations", "operational_admin", "operation_admin"].includes(roleKey)) {
//     return {
//       title: "Operations Workspace",
//       description:
//         "Track the requests, estimates, expenses and reimbursements assigned to your operational scope.",
//       visibleModules: ["requests", "estimates", "expenses", "claims"],
//     };
//   }

//   if (["sales", "sales_admin", "business_development"].includes(roleKey)) {
//     return {
//       title: "Sales Workspace",
//       description:
//         "Track your estimates, client invoices, budget requests and submitted expenses without finance-level information.",
//       visibleModules: ["estimates", "invoices", "requests", "expenses"],
//     };
//   }

//   if (["creative", "creative_team", "design", "production"].includes(roleKey)) {
//     return {
//       title: "Creative Workspace",
//       description:
//         "View your assigned requests, submitted expenses, reimbursement claims and recent workflow updates.",
//       visibleModules: ["requests", "expenses", "claims", "activity"],
//     };
//   }

//   return {
//     title: "My Workspace",
//     description:
//       "View only the operational records assigned to your account, team, department or projects.",
//     visibleModules: ["requests", "estimates", "expenses", "claims"],
//   };
// };

// function RestrictedDashboard({
//   userProfile,
//   roleKey,
//   data,
//   refreshing,
//   lastUpdated,
//   unavailableModules,
//   canCreateInvoices,
//   onRefresh,
//   onCreateBudgetRequest,
// }: {
//   userProfile: any;
//   roleKey: string;
//   data: DashboardData;
//   refreshing: boolean;
//   lastUpdated: Date | null;
//   unavailableModules: string[];
//   canCreateInvoices: boolean;
//   onRefresh: () => void;
//   onCreateBudgetRequest: () => void;
// }) {
//   const config = getRestrictedRoleConfig(roleKey);

//   const dashboard = useMemo(() => {
//     const requestsPending = data.invoiceRequests.filter((request) => {
//       const status = normalizeText(request?.status);
//       return ![
//         "approved",
//         "rejected",
//         "returned_to_creator",
//         "changes_requested",
//         "payment_released",
//         "released",
//         "completed",
//       ].includes(status);
//     }).length;

//     const requestsReturned = data.invoiceRequests.filter((request) =>
//       ["rejected", "returned_to_creator", "changes_requested"].includes(
//         normalizeText(request?.status),
//       ),
//     ).length;

//     const requestsCompleted = data.invoiceRequests.filter((request) =>
//       [
//         "approved",
//         "payment_released",
//         "released",
//         "completed",
//         "paid",
//       ].includes(normalizeText(request?.status)),
//     ).length;

//     const claims = [...data.directClaims, ...data.meetingClaims];
//     const pendingClaims = claims.filter(
//       (claim) => getClaimStatus(claim) === "pending",
//     ).length;

//     const activities: RestrictedActivity[] = [
//       ...data.invoiceRequests.map((request) => ({
//         id: `request-${request.id}`,
//         module: "Budget Request",
//         title: firstText(
//           request?.requestId,
//           request?.title,
//           request?.subject,
//           "Budget request",
//         ),
//         description: firstText(
//           request?.projectName,
//           request?.project,
//           request?.clientName,
//           "Workflow updated",
//         ),
//         status: request?.status || "submitted",
//         date: getRequestDate(request),
//       })),
//       ...data.estimates.map((estimate) => ({
//         id: `estimate-${estimate.id}`,
//         module: "Estimate",
//         title: firstText(
//           estimate?.estimateNo,
//           estimate?.title,
//           estimate?.subject,
//           "Estimate",
//         ),
//         description: firstText(
//           estimate?.projectName,
//           estimate?.clientName,
//           estimate?.client,
//           "Estimate updated",
//         ),
//         status: estimate?.status || "draft",
//         date: getEntityDate(estimate),
//       })),
//       ...data.estimateInvoices.map((invoice) => ({
//         id: `invoice-${invoice.id}`,
//         module: "Client Invoice",
//         title: firstText(invoice?.invoiceNo, invoice?.subject, "Invoice"),
//         description: firstText(
//           invoice?.projectName,
//           invoice?.clientName,
//           invoice?.client,
//           "Invoice updated",
//         ),
//         status: invoice?.status || invoice?.paymentStatus || "unpaid",
//         date: getEntityDate(invoice),
//       })),
//       ...data.expenseSheets.map((expense) => ({
//         id: `expense-${expense.id}`,
//         module: "Expense Sheet",
//         title: firstText(
//           expense?.expenseId,
//           expense?.title,
//           expense?.projectName,
//           "Expense sheet",
//         ),
//         description: firstText(
//           expense?.projectName,
//           expense?.project,
//           expense?.clientName,
//           "Expense submitted",
//         ),
//         status: expense?.status || expense?.paymentStatus || "submitted",
//         date: getEntityDate(expense),
//       })),
//       ...claims.map((claim) => ({
//         id: `claim-${claim.id}`,
//         module: "Reimbursement",
//         title: firstText(
//           claim?.description,
//           claim?.foodItem,
//           claim?.claimType,
//           "Reimbursement claim",
//         ),
//         description: firstText(
//           claim?.projectName,
//           claim?.meetingTitle,
//           "Claim updated",
//         ),
//         status:
//           normalizeText(claim?.paymentStatus) === "paid"
//             ? "paid"
//             : claim?.status || claim?.approvalStatus || "pending",
//         date: getEntityDate(claim),
//       })),
//     ]
//       .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))
//       .slice(0, 10);

//     return {
//       requestsPending,
//       requestsReturned,
//       requestsCompleted,
//       pendingClaims,
//       activities,
//       totalWorkspaceRecords:
//         data.invoiceRequests.length +
//         data.estimates.length +
//         data.estimateInvoices.length +
//         data.expenseSheets.length +
//         claims.length,
//       claimsCount: claims.length,
//     };
//   }, [data]);

//   const moduleCards = [
//     {
//       key: "requests",
//       title: "My Budget Requests",
//       subtitle: "Requests created by or assigned to your user scope.",
//       icon: FileText,
//       items: [
//         { label: "Total", value: String(data.invoiceRequests.length) },
//         { label: "In Progress", value: String(dashboard.requestsPending) },
//         { label: "Returned", value: String(dashboard.requestsReturned), className: "text-rose-600" },
//         { label: "Completed", value: String(dashboard.requestsCompleted), className: "text-emerald-600" },
//       ],
//     },
//     {
//       key: "estimates",
//       title: "My Estimates",
//       subtitle: "Estimates assigned to your account, team or projects.",
//       icon: FileSpreadsheet,
//       items: [
//         { label: "Total", value: String(data.estimates.length) },
//         { label: "Approved", value: String(data.estimates.filter((item) => normalizeText(item?.status) === "approved").length), className: "text-emerald-600" },
//         { label: "Invoiced", value: String(data.estimates.filter((item) => ["invoiced", "payment received"].includes(normalizeText(item?.status))).length), className: "text-blue-600" },
//         { label: "Other", value: String(data.estimates.filter((item) => !["approved", "invoiced", "payment received"].includes(normalizeText(item?.status))).length) },
//       ],
//     },
//     {
//       key: "invoices",
//       title: "My Client Invoices",
//       subtitle: "Invoice workflow status without financial totals.",
//       icon: ReceiptText,
//       items: [
//         { label: "Total", value: String(data.estimateInvoices.length) },
//         { label: "Paid", value: String(data.estimateInvoices.filter((item) => getInvoiceStatus(item) === "paid").length), className: "text-emerald-600" },
//         { label: "Partial", value: String(data.estimateInvoices.filter((item) => getInvoiceStatus(item) === "partial").length), className: "text-blue-600" },
//         { label: "Unpaid", value: String(data.estimateInvoices.filter((item) => getInvoiceStatus(item) === "unpaid").length), className: "text-amber-600" },
//       ],
//     },
//     {
//       key: "expenses",
//       title: "My Expense Sheets",
//       subtitle: "Expense sheets submitted by or assigned to you.",
//       icon: CreditCard,
//       items: [
//         { label: "Total", value: String(data.expenseSheets.length) },
//         { label: "Pending", value: String(data.expenseSheets.filter((item) => normalizeText(item?.status || item?.paymentStatus).includes("pending")).length), className: "text-amber-600" },
//         { label: "Approved", value: String(data.expenseSheets.filter((item) => normalizeText(item?.status || item?.paymentStatus).includes("approved")).length), className: "text-emerald-600" },
//         { label: "Other", value: String(data.expenseSheets.filter((item) => !normalizeText(item?.status || item?.paymentStatus).includes("pending") && !normalizeText(item?.status || item?.paymentStatus).includes("approved")).length) },
//       ],
//     },
//     {
//       key: "claims",
//       title: "My Reimbursements",
//       subtitle: "Your submitted and assigned reimbursement claims.",
//       icon: Users,
//       items: [
//         { label: "Total", value: String(dashboard.claimsCount) },
//         { label: "Pending", value: String(dashboard.pendingClaims), className: "text-amber-600" },
//         { label: "Approved", value: String([...data.directClaims, ...data.meetingClaims].filter((item) => getClaimStatus(item) === "approved").length), className: "text-emerald-600" },
//         { label: "Rejected", value: String([...data.directClaims, ...data.meetingClaims].filter((item) => getClaimStatus(item) === "rejected").length), className: "text-rose-600" },
//       ],
//     },
//     {
//       key: "activity",
//       title: "Workflow Activity",
//       subtitle: "Recent updates visible inside your role scope.",
//       icon: Activity,
//       items: [
//         { label: "Recent Updates", value: String(dashboard.activities.length) },
//         { label: "Workspace Records", value: String(dashboard.totalWorkspaceRecords) },
//         { label: "Pending Requests", value: String(dashboard.requestsPending), className: "text-amber-600" },
//         { label: "Returned Requests", value: String(dashboard.requestsReturned), className: "text-rose-600" },
//       ],
//     },
//   ].filter((card) => config.visibleModules.includes(card.key));

//   return (
//     <div className="min-h-screen bg-slate-50/80 p-4 text-slate-900 sm:p-6">
//       <div className="mx-auto space-y-6">
//         <section className="overflow-hidden rounded-[32px] bg-slate-950 p-6 text-white shadow-xl shadow-slate-200/70 sm:p-8">
//           <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
//             <div>
//               <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">
//                 <BadgeCheck className="h-3.5 w-3.5" />
//                 Role-Based Access
//               </div>

//               <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
//                 {config.title}
//               </h1>
//               <p className="mt-2 text-lg font-bold text-white">
//                 Welcome back, {userProfile?.displayName || userProfile?.name || "Team Member"}
//               </p>
//               <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
//                 {config.description}
//               </p>

//               <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-300">
//                 <span className="rounded-full bg-white/10 px-3 py-1.5 font-semibold">
//                   Role: {humanize(userProfile?.role || "User")}
//                 </span>
//                 <span className="rounded-full bg-white/10 px-3 py-1.5 font-semibold">
//                   Updated: {lastUpdated ? formatRelativeTime(lastUpdated) : "Now"}
//                 </span>
//                 <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 font-semibold text-emerald-200">
//                   Restricted financial access
//                 </span>
//               </div>
//             </div>

//             <div className="flex flex-wrap gap-2">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={onRefresh}
//                 disabled={refreshing}
//                 className="h-11 rounded-2xl border-white/15 bg-white/10 px-4 text-white hover:bg-white/15 hover:text-white"
//               >
//                 <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
//                 {refreshing ? "Refreshing" : "Refresh"}
//               </Button>

//               {canCreateInvoices && (
//                 <Button
//                   type="button"
//                   onClick={onCreateBudgetRequest}
//                   className="h-11 rounded-2xl bg-white px-4 font-bold text-slate-950 hover:bg-slate-100"
//                 >
//                   <Plus className="mr-2 h-4 w-4" />
//                   New Budget Request
//                 </Button>
//               )}
//             </div>
//           </div>

//           <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
//             <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
//               <p className="text-xs font-semibold text-slate-300">Workspace Records</p>
//               <p className="mt-2 text-2xl font-black">{dashboard.totalWorkspaceRecords}</p>
//             </div>
//             <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
//               <p className="text-xs font-semibold text-slate-300">Requests In Progress</p>
//               <p className="mt-2 text-2xl font-black">{dashboard.requestsPending}</p>
//             </div>
//             <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
//               <p className="text-xs font-semibold text-slate-300">Returned Requests</p>
//               <p className="mt-2 text-2xl font-black">{dashboard.requestsReturned}</p>
//             </div>
//             <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
//               <p className="text-xs font-semibold text-slate-300">Pending Claims</p>
//               <p className="mt-2 text-2xl font-black">{dashboard.pendingClaims}</p>
//             </div>
//           </div>
//         </section>

//         {unavailableModules.length > 0 && (
//           <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
//             <div className="flex items-start gap-3">
//               <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
//               <div>
//                 <p className="font-bold">Some role-scoped modules are unavailable.</p>
//                 <p className="mt-1 text-xs leading-5">
//                   Your available workspace data is still displayed. Check the matching Firestore role rules for: {unavailableModules.join(", ")}.
//                 </p>
//               </div>
//             </div>
//           </div>
//         )}

//         <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
//           <MetricCard
//             title="My Requests"
//             value={String(data.invoiceRequests.length)}
//             subtitle="Only requests inside your role scope"
//             icon={FileText}
//             tone="blue"
//           />
//           <MetricCard
//             title="Waiting For Review"
//             value={String(dashboard.requestsPending)}
//             subtitle="Requests still moving through workflow"
//             icon={Clock3}
//             tone="amber"
//           />
//           <MetricCard
//             title="Completed"
//             value={String(dashboard.requestsCompleted)}
//             subtitle="Approved or completed requests"
//             icon={CheckCircle2}
//             tone="emerald"
//           />
//           <MetricCard
//             title="Needs Attention"
//             value={String(dashboard.requestsReturned + dashboard.pendingClaims)}
//             subtitle="Returned requests and pending claims"
//             icon={AlertTriangle}
//             tone="rose"
//           />
//         </section>

//         <section>
//           <div className="mb-4">
//             <h2 className="text-xl font-black text-slate-950">Role-Specific Modules</h2>
//             <p className="mt-1 text-sm text-slate-500">
//               Financial balances, payment releases, cheque records, vendor exposure and administrative reports are hidden for this role.
//             </p>
//           </div>

//           <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
//             {moduleCards.map((card) => (
//               <ModuleCard key={card.key} {...card} />
//             ))}
//           </div>
//         </section>

//         <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//           <CardContent className="p-5 sm:p-6">
//             <div className="flex items-start justify-between gap-4">
//               <div>
//                 <h2 className="text-lg font-black text-slate-950">My Recent Activity</h2>
//                 <p className="mt-1 text-xs text-slate-500">
//                   Recent workflow updates matched to your user, team, department or assigned projects.
//                 </p>
//               </div>
//               <Activity className="h-5 w-5 text-slate-400" />
//             </div>

//             <div className="mt-5 divide-y divide-slate-100">
//               {dashboard.activities.length === 0 ? (
//                 <div className="py-12 text-center">
//                   <CalendarClock className="mx-auto h-7 w-7 text-slate-300" />
//                   <p className="mt-3 text-sm font-semibold text-slate-500">
//                     No role-scoped activity was found.
//                   </p>
//                   <p className="mt-1 text-xs text-slate-400">
//                     Make sure your records contain a matching user, team, department or project identifier.
//                   </p>
//                 </div>
//               ) : (
//                 dashboard.activities.map((activity) => (
//                   <div key={activity.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
//                     <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
//                       <Activity className="h-4 w-4" />
//                     </div>
//                     <div className="min-w-0 flex-1">
//                       <div className="flex flex-wrap items-center gap-2">
//                         <p className="truncate text-sm font-black text-slate-900">{activity.title}</p>
//                         <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{activity.module}</span>
//                       </div>
//                       <p className="mt-1 truncate text-xs text-slate-500">{activity.description}</p>
//                     </div>
//                     <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
//                       <StatusBadge status={activity.status} />
//                       <span className="text-[11px] font-semibold text-slate-400">{formatRelativeTime(activity.date)}</span>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }

// function MetricCard({
//   title,
//   value,
//   subtitle,
//   icon: Icon,
//   tone = "slate",
//   trend,
// }: {
//   title: string;
//   value: string;
//   subtitle: string;
//   icon: LucideIcon;
//   tone?: "slate" | "emerald" | "blue" | "amber" | "rose" | "violet";
//   trend?: "up" | "down";
// }) {
//   const toneClasses = {
//     slate: "bg-slate-100 text-slate-700",
//     emerald: "bg-emerald-50 text-emerald-700",
//     blue: "bg-blue-50 text-blue-700",
//     amber: "bg-amber-50 text-amber-700",
//     rose: "bg-rose-50 text-rose-700",
//     violet: "bg-violet-50 text-violet-700",
//   };

//   return (
//     <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm">
//       <CardContent className="p-5">
//         <div className="flex items-start justify-between gap-4">
//           <div className="min-w-0">
//             <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
//               {title}
//             </p>
//             <p className="mt-3 truncate text-2xl font-black tracking-tight text-slate-950 xl:text-3xl">
//               {value}
//             </p>
//           </div>

//           <div
//             className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${toneClasses[tone]}`}
//           >
//             <Icon className="h-5 w-5" />
//           </div>
//         </div>

//         <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
//           {trend === "up" && <ArrowUpRight className="h-4 w-4 text-emerald-600" />}
//           {trend === "down" && <ArrowDownRight className="h-4 w-4 text-rose-600" />}
//           <p className="truncate text-xs font-medium text-slate-500">
//             {subtitle}
//           </p>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

// function AlertCard({
//   title,
//   value,
//   description,
//   icon,
//   tone,
// }: {
//   title: string;
//   value: string;
//   description: string;
//   icon: ReactNode;
//   tone: "amber" | "blue" | "rose" | "emerald";
// }) {
//   const classes = {
//     amber: "border-amber-200 bg-amber-50/70 text-amber-800",
//     blue: "border-blue-200 bg-blue-50/70 text-blue-800",
//     rose: "border-rose-200 bg-rose-50/70 text-rose-800",
//     emerald: "border-emerald-200 bg-emerald-50/70 text-emerald-800",
//   };

//   return (
//     <div className={`rounded-2xl border p-4 ${classes[tone]}`}>
//       <div className="flex items-start justify-between gap-3">
//         <div>
//           <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">
//             {title}
//           </p>
//           <p className="mt-2 text-2xl font-black">{value}</p>
//           <p className="mt-1 text-xs font-medium leading-5 opacity-75">
//             {description}
//           </p>
//         </div>
//         <div className="rounded-xl bg-white/70 p-2.5 shadow-sm">{icon}</div>
//       </div>
//     </div>
//   );
// }

// function ModuleCard({
//   title,
//   subtitle,
//   icon: Icon,
//   items,
// }: {
//   title: string;
//   subtitle: string;
//   icon: LucideIcon;
//   items: Array<{ label: string; value: string; className?: string }>;
// }) {
//   return (
//     <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//       <CardContent className="p-5">
//         <div className="flex items-start justify-between gap-3">
//           <div>
//             <h3 className="font-black text-slate-950">{title}</h3>
//             <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>
//           </div>
//           <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
//             <Icon className="h-5 w-5" />
//           </div>
//         </div>

//         <div className="mt-5 space-y-3">
//           {items.map((item) => (
//             <div
//               key={item.label}
//               className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
//             >
//               <span className="text-sm font-medium text-slate-500">
//                 {item.label}
//               </span>
//               <span
//                 className={`text-sm font-black text-slate-950 ${item.className || ""}`}
//               >
//                 {item.value}
//               </span>
//             </div>
//           ))}
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

// function StatusBadge({ status }: { status: string }) {
//   const normalized = normalizeText(status);

//   const classes = normalized.includes("partial")
//     ? "border-blue-200 bg-blue-50 text-blue-700"
//     : normalized.includes("paid") ||
//         normalized.includes("approved") ||
//         normalized.includes("released")
//       ? "border-emerald-200 bg-emerald-50 text-emerald-700"
//       : normalized.includes("reject") || normalized.includes("cancel")
//         ? "border-rose-200 bg-rose-50 text-rose-700"
//         : normalized.includes("pending") ||
//             normalized.includes("unpaid") ||
//             normalized.includes("open")
//           ? "border-amber-200 bg-amber-50 text-amber-700"
//           : "border-slate-200 bg-slate-50 text-slate-600";

//   return (
//     <span
//       className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${classes}`}
//     >
//       {humanize(status)}
//     </span>
//   );
// }

// export default function Dashboard() {
//   const { userProfile } = useAuth();

//   const roleKey = normalizeText(userProfile?.role).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
//   const hasFullDashboardAccess = FULL_DASHBOARD_ROLES.has(roleKey);
//   const canCreateInvoices = [
//     "operation",
//     "operations",
//     "operational_admin",
//     "operation_admin",
//     "creative",
//     "sales",
//   ].includes(roleKey);

//   const [data, setData] = useState<DashboardData>(EMPTY_DATA);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
//   const [unavailableModules, setUnavailableModules] = useState<string[]>([]);
//   const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

//   const loadDashboardData = useCallback(async (silent = false) => {
//     if (silent) setRefreshing(true);
//     else setLoading(true);

//     const unavailable = new Set<string>();

//     const readCollection = async (
//       path: string[],
//       label: string,
//     ): Promise<AnyRow[]> => {
//       try {
//         const snapshot = await getDocs(
//           collection(db, path[0], ...path.slice(1)),
//         );
//         return snapshotToRows(snapshot as any);
//       } catch (error) {
//         console.warn(`Dashboard could not read ${label}:`, error);
//         unavailable.add(label);
//         return [];
//       }
//     };

//     const restrictToCurrentScope = (rows: AnyRow[]) =>
//       rows.filter((row) => rowMatchesUserScope(row, userProfile));

//     try {
//       if (!hasFullDashboardAccess) {
//         const [
//           invoiceRequests,
//           estimates,
//           estimateInvoices,
//           expenseSheets,
//           directClaims,
//         ] = await Promise.all([
//           readCollection(["Panels", PANEL_ID, "invoiceRequests"], "Budget Requests"),
//           readCollection(["Panels", PANEL_ID, "estimates"], "Estimates"),
//           readCollection(
//             ["Panels", PANEL_ID, "estimateInvoices"],
//             "Estimate Invoices",
//           ),
//           readCollection(["Panels", PANEL_ID, "expenseSheets"], "Budget Expenses"),
//           readCollection(
//             ["Panels", PANEL_ID, "claimReimbursements"],
//             "Reimbursements",
//           ),
//         ]);

//         setData({
//           ...EMPTY_DATA,
//           invoiceRequests: restrictToCurrentScope(invoiceRequests),
//           estimates: restrictToCurrentScope(estimates),
//           estimateInvoices: restrictToCurrentScope(estimateInvoices),
//           expenseSheets: restrictToCurrentScope(expenseSheets),
//           directClaims: restrictToCurrentScope(directClaims),
//         });

//         setUnavailableModules(Array.from(unavailable));
//         setLastUpdated(new Date());
//         return;
//       }

//       const [
//         invoiceRequests,
//         estimates,
//         estimateInvoices,
//         payments,
//         expenseSheets,
//         directClaims,
//         records,
//         poRows,
//         purchaseOrderRows,
//         manualEntries,
//       ] = await Promise.all([
//         readCollection(["Panels", PANEL_ID, "invoiceRequests"], "Budget Requests"),
//         readCollection(["Panels", PANEL_ID, "estimates"], "Estimates"),
//         readCollection(
//           ["Panels", PANEL_ID, "estimateInvoices"],
//           "Estimate Invoices",
//         ),
//         readCollection(["Panels", PANEL_ID, "payments"], "Payments"),
//         readCollection(["Panels", PANEL_ID, "expenseSheets"], "Budget Expenses"),
//         readCollection(
//           ["Panels", PANEL_ID, "claimReimbursements"],
//           "Reimbursements",
//         ),
//         readCollection(["Panels", PANEL_ID, "Record"], "Records"),
//         readCollection(["Panels", PANEL_ID, "PO"], "Purchase Orders"),
//         readCollection(
//           ["Panels", PANEL_ID, "purchaseOrders"],
//           "Legacy Purchase Orders",
//         ),
//         readCollection(
//           ["Panels", PANEL_ID, "accountStatementManualEntries"],
//           "Manual Statement Entries",
//         ),
//       ]);

//       let openingBalance = 0;
//       try {
//         const settingsSnapshot = await getDoc(
//           doc(
//             db,
//             "Panels",
//             PANEL_ID,
//             "accountStatementSettings",
//             "main",
//           ),
//         );

//         openingBalance = settingsSnapshot.exists()
//           ? safeNumber(settingsSnapshot.data()?.openingBalance)
//           : 0;
//       } catch (error) {
//         console.warn("Dashboard could not read Account Statement settings:", error);
//         unavailable.add("Account Statement Settings");
//       }

//       let meetingClaims: AnyRow[] = [];
//       try {
//         const meetingSnapshot = await getDocs(collectionGroup(db, "meetingUpdates"));

//         meetingClaims = meetingSnapshot.docs
//           .map((meetingDocument) => ({
//             id: meetingDocument.id,
//             path: meetingDocument.ref.path,
//             ...meetingDocument.data(),
//           }))
//           .filter((meeting: any) => meeting?.reimbursement?.enabled)
//           .map((meeting: any) => ({
//             id: meeting.id,
//             path: meeting.path,
//             ...meeting.reimbursement,
//             personName:
//               meeting.reimbursement?.approvalSubmittedByName ||
//               meeting.reimbursement?.personName ||
//               meeting.personName ||
//               "Unknown",
//             submittedAt:
//               meeting.reimbursement?.approvalSubmittedAt ||
//               meeting.reimbursement?.submittedAt ||
//               meeting.submittedAt ||
//               meeting.createdAt ||
//               null,
//             meetingUpdatedAt: meeting.updatedAt || null,
//           }));
//       } catch (error) {
//         console.warn("Dashboard could not read nested reimbursements:", error);
//         unavailable.add("Nested Reimbursements");
//       }

//       const poMap = new Map<string, AnyRow>();
//       [...poRows, ...purchaseOrderRows].forEach((purchaseOrder) => {
//         const key = firstText(
//           purchaseOrder?.poNumber,
//           purchaseOrder?.purchaseOrderNumber,
//           purchaseOrder?.id,
//         );

//         if (!poMap.has(key)) poMap.set(key, purchaseOrder);
//       });

//       setData({
//         invoiceRequests,
//         estimates,
//         estimateInvoices,
//         payments,
//         expenseSheets,
//         directClaims,
//         meetingClaims,
//         records,
//         purchaseOrders: Array.from(poMap.values()),
//         manualEntries,
//         openingBalance,
//       });

//       setUnavailableModules(Array.from(unavailable));
//       setLastUpdated(new Date());
//     } catch (error) {
//       console.error("Failed to load dashboard data:", error);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, [hasFullDashboardAccess, userProfile]);

//   useEffect(() => {
//     loadDashboardData();
//   }, [loadDashboardData]);

//   useEffect(() => {
//     const watchedCollections = hasFullDashboardAccess
//       ? [
//           "invoiceRequests",
//           "estimates",
//           "estimateInvoices",
//           "payments",
//           "expenseSheets",
//           "claimReimbursements",
//           "Record",
//           "PO",
//           "purchaseOrders",
//           "accountStatementManualEntries",
//         ]
//       : [
//           "invoiceRequests",
//           "estimates",
//           "estimateInvoices",
//           "expenseSheets",
//           "claimReimbursements",
//         ];

//     let refreshTimer: ReturnType<typeof setTimeout> | null = null;
//     const initialSnapshots = new Set<string>();

//     const unsubscribers = watchedCollections.map((collectionName) =>
//       onSnapshot(
//         collection(db, "Panels", PANEL_ID, collectionName),
//         () => {
//           if (!initialSnapshots.has(collectionName)) {
//             initialSnapshots.add(collectionName);
//             return;
//           }

//           if (refreshTimer) clearTimeout(refreshTimer);
//           refreshTimer = setTimeout(() => loadDashboardData(true), 700);
//         },
//         (error) => {
//           console.warn(`Dashboard listener failed for ${collectionName}:`, error);
//         },
//       ),
//     );

//     return () => {
//       if (refreshTimer) clearTimeout(refreshTimer);
//       unsubscribers.forEach((unsubscribe) => unsubscribe());
//     };
//   }, [hasFullDashboardAccess, loadDashboardData]);

//   const summary = useMemo(() => {
//     const now = new Date();
//     const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

//     const incomeEvents: MoneyEvent[] = [];
//     const expenseEvents: MoneyEvent[] = [];

//     data.payments.forEach((payment) => {
//       const amount = safeNumber(payment?.amount);
//       const date =
//         toDate(payment?.paymentDate) ||
//         toDate(payment?.createdAt) ||
//         toDate(payment?.updatedAt);

//       if (amount > 0) incomeEvents.push({ amount, date });

//       const taxDebit =
//         safeNumber(payment?.whtAmount) + safeNumber(payment?.sstAmount);
//       if (taxDebit > 0) expenseEvents.push({ amount: taxDebit, date });
//     });

//     data.invoiceRequests.forEach((request) => {
//       const history = getPaymentReleaseHistory(request);

//       if (history.length > 0) {
//         history.forEach((release) => {
//           const amount = getReleaseAmount(release);
//           if (amount <= 0) return;

//           expenseEvents.push({
//             amount,
//             date:
//               toDate(release?.releasedAt) ||
//               toDate(release?.createdAt) ||
//               getEntityDate(request),
//           });
//         });
//       } else {
//         const releasedAmount = getReleasedRequestAmount(request);
//         if (releasedAmount > 0) {
//           expenseEvents.push({
//             amount: releasedAmount,
//             date: getEntityDate(request),
//           });
//         }
//       }
//     });

//     data.directClaims.forEach((claim) => {
//       const paidAmount = getClaimPaidAmount(claim);
//       if (paidAmount > 0) {
//         expenseEvents.push({
//           amount: paidAmount,
//           date:
//             toDate(claim?.paymentReleasedAt) ||
//             toDate(claim?.updatedAt) ||
//             getEntityDate(claim),
//         });
//       }
//     });

//     data.meetingClaims.forEach((claim) => {
//       const paidAmount = getClaimPaidAmount(claim);
//       if (paidAmount > 0) {
//         expenseEvents.push({
//           amount: paidAmount,
//           date:
//             toDate(claim?.paymentReleasedAt) ||
//             toDate(claim?.updatedAt) ||
//             toDate(claim?.meetingUpdatedAt) ||
//             getEntityDate(claim),
//         });
//       }
//     });

//     data.records.forEach((record) => {
//       const chequeAmount = safeNumber(record?.chequeAmount);
//       if (chequeAmount > 0) {
//         expenseEvents.push({
//           amount: chequeAmount,
//           date: getEntityDate(record),
//         });
//       }
//     });

//     data.manualEntries.forEach((entry) => {
//       const date = toDate(entry?.date) || getEntityDate(entry);
//       const debit = safeNumber(entry?.debit);
//       const credit = safeNumber(entry?.credit);

//       if (debit > 0) expenseEvents.push({ amount: debit, date });
//       if (credit > 0) incomeEvents.push({ amount: credit, date });
//     });

//     const totalIncome = incomeEvents.reduce((sum, item) => sum + item.amount, 0);
//     const totalExpense = expenseEvents.reduce(
//       (sum, item) => sum + item.amount,
//       0,
//     );
//     const balance = data.openingBalance + totalIncome - totalExpense;

//     const monthIncome = incomeEvents
//       .filter((item) => item.date && item.date >= monthStart)
//       .reduce((sum, item) => sum + item.amount, 0);

//     const monthExpense = expenseEvents
//       .filter((item) => item.date && item.date >= monthStart)
//       .reduce((sum, item) => sum + item.amount, 0);

//     const budgetTotalAmount = data.invoiceRequests.reduce(
//       (sum, request) => sum + getApprovedRequestAmount(request),
//       0,
//     );
//     const budgetReleasedAmount = data.invoiceRequests.reduce(
//       (sum, request) => sum + getReleasedRequestAmount(request),
//       0,
//     );
//     const budgetRemainingAmount = data.invoiceRequests.reduce(
//       (sum, request) => sum + getRemainingRequestAmount(request),
//       0,
//     );

//     const budgetPendingAdmin = data.invoiceRequests.filter((request) =>
//       [
//         "pending_operational_admin",
//         "pending_main_admin",
//         "pending_admin",
//       ].includes(normalizeText(request?.status)),
//     ).length;

//     const budgetPendingFinance = data.invoiceRequests.filter(
//       (request) => normalizeText(request?.status) === "pending_finance",
//     ).length;

//     const budgetReadyForPayment = data.invoiceRequests.filter((request) => {
//       const status = normalizeText(request?.status);
//       return (
//         [
//           "approved",
//           "po_created",
//           "po_submitted",
//           "po_approved",
//           "po_issued",
//           "ready_for_payment",
//           "payment_partially_released",
//         ].includes(status) && !isFullyReleased(request)
//       );
//     }).length;

//     const budgetPartial = data.invoiceRequests.filter(isPartiallyReleased).length;
//     const budgetReleased = data.invoiceRequests.filter(isFullyReleased).length;
//     const budgetRejected = data.invoiceRequests.filter((request) =>
//       ["rejected", "returned_to_creator", "changes_requested"].includes(
//         normalizeText(request?.status),
//       ),
//     ).length;

//     const estimateTotalAmount = data.estimates.reduce(
//       (sum, estimate) => sum + getEstimateAmount(estimate),
//       0,
//     );

//     const estimateApproved = data.estimates.filter(
//       (estimate) => normalizeText(estimate?.status) === "approved",
//     ).length;

//     const estimateInvoiced = data.estimates.filter((estimate) =>
//       ["invoiced", "payment received"].includes(
//         normalizeText(estimate?.status),
//       ),
//     ).length;

//     const invoiceTotalAmount = data.estimateInvoices.reduce(
//       (sum, invoice) => sum + getEstimateInvoiceAmount(invoice),
//       0,
//     );

//     const paidInvoices = data.estimateInvoices.filter(
//       (invoice) => getInvoiceStatus(invoice) === "paid",
//     );
//     const partialInvoices = data.estimateInvoices.filter(
//       (invoice) => getInvoiceStatus(invoice) === "partial",
//     );
//     const unpaidInvoices = data.estimateInvoices.filter(
//       (invoice) => getInvoiceStatus(invoice) === "unpaid",
//     );

//     const paidInvoiceAmount = paidInvoices.reduce(
//       (sum, invoice) => sum + getEstimateInvoiceAmount(invoice),
//       0,
//     );

//     const receivedInvoiceAmount = data.payments.reduce(
//       (sum, payment) => sum + safeNumber(payment?.amount),
//       0,
//     );

//     const invoiceOutstanding = Math.max(
//       invoiceTotalAmount - receivedInvoiceAmount,
//       0,
//     );

//     const poTotalAmount = data.purchaseOrders.reduce(
//       (sum, purchaseOrder) => sum + getPurchaseOrderAmount(purchaseOrder),
//       0,
//     );

//     const poPaid = data.purchaseOrders.filter(
//       (purchaseOrder) => normalizeText(purchaseOrder?.status) === "paid",
//     ).length;

//     const poOpen = data.purchaseOrders.filter((purchaseOrder) =>
//       ["open", "draft"].includes(normalizeText(purchaseOrder?.status)),
//     ).length;

//     const poOverdue = data.purchaseOrders.filter((purchaseOrder) => {
//       const status = normalizeText(purchaseOrder?.status);
//       return (
//         !["paid", "cancelled"].includes(status) &&
//         (status === "over due" ||
//           status === "overdue" ||
//           isOverdueDate(purchaseOrder?.dueDate))
//       );
//     }).length;

//     const expenseSheetAmount = data.expenseSheets.reduce(
//       (sum, expense) => sum + getExpenseAmount(expense),
//       0,
//     );

//     const allClaims = [...data.directClaims, ...data.meetingClaims];
//     const reimbursementAmount = allClaims.reduce(
//       (sum, claim) => sum + getClaimAmount(claim),
//       0,
//     );
//     const reimbursementPending = allClaims.filter(
//       (claim) => getClaimStatus(claim) === "pending",
//     ).length;
//     const reimbursementApproved = allClaims.filter(
//       (claim) => getClaimStatus(claim) === "approved",
//     ).length;
//     const reimbursementPaid = allClaims.filter(
//       (claim) => normalizeText(claim?.paymentStatus) === "paid",
//     ).length;
//     const reimbursementPaidAmount = allClaims.reduce(
//       (sum, claim) => sum + getClaimPaidAmount(claim),
//       0,
//     );

//     const recordChequeAmount = data.records.reduce(
//       (sum, record) => sum + safeNumber(record?.chequeAmount),
//       0,
//     );
//     const recordItemAmount = data.records.reduce(
//       (sum, record) => sum + safeNumber(record?.totalItemAmount),
//       0,
//     );
//     const recordRemaining = data.records.reduce(
//       (sum, record) => sum + safeNumber(record?.remainingBalance),
//       0,
//     );

//     const vendorNames = new Set<string>();
//     data.invoiceRequests.forEach((request) => {
//       getVendorNames(request).forEach((name) => vendorNames.add(name));
//     });

//     const vendorOverdue = data.invoiceRequests.reduce((sum, request) => {
//       const remaining = getRemainingRequestAmount(request);
//       const dueDate =
//         request?.dueDate || request?.paymentDueDate || request?.invoiceDueDate;

//       return remaining > 0 && dueDate && isOverdueDate(dueDate)
//         ? sum + remaining
//         : sum;
//     }, 0);

//     const lastSixMonths = Array.from({ length: 6 }, (_, index) => {
//       const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
//       return {
//         key: `${date.getFullYear()}-${date.getMonth()}`,
//         label: date.toLocaleDateString("en-PK", { month: "short" }),
//         income: 0,
//         expense: 0,
//       };
//     });

//     const monthMap = new Map(lastSixMonths.map((item) => [item.key, item]));

//     incomeEvents.forEach((event) => {
//       if (!event.date) return;
//       const key = `${event.date.getFullYear()}-${event.date.getMonth()}`;
//       const bucket = monthMap.get(key);
//       if (bucket) bucket.income += event.amount;
//     });

//     expenseEvents.forEach((event) => {
//       if (!event.date) return;
//       const key = `${event.date.getFullYear()}-${event.date.getMonth()}`;
//       const bucket = monthMap.get(key);
//       if (bucket) bucket.expense += event.amount;
//     });

//     const activities: ActivityItem[] = [
//       ...data.invoiceRequests.map((request) => ({
//         id: `budget-${request.id}`,
//         module: "Budget Request",
//         title: firstText(
//           request?.requestId,
//           request?.title,
//           request?.subject,
//           "Budget request",
//         ),
//         description: firstText(
//           request?.projectName,
//           request?.project,
//           request?.clientName,
//           request?.vendorName,
//           "Budget workflow updated",
//         ),
//         status: request?.status || "submitted",
//         date: getRequestDate(request),
//       })),
//       ...data.payments.map((payment) => ({
//         id: `payment-${payment.id}`,
//         module: "Payment Received",
//         title: firstText(
//           payment?.invoiceNo,
//           payment?.reference,
//           payment?.paymentReference,
//           "Invoice payment",
//         ),
//         description: `${firstText(payment?.client, "Payment received")} · ${formatPKR(
//           payment?.amount,
//         )}`,
//         status: "paid",
//         date:
//           toDate(payment?.paymentDate) ||
//           toDate(payment?.createdAt) ||
//           toDate(payment?.updatedAt),
//       })),
//       ...data.estimateInvoices.map((invoice) => ({
//         id: `invoice-${invoice.id}`,
//         module: "Estimate Invoice",
//         title: firstText(invoice?.invoiceNo, invoice?.subject, "Invoice"),
//         description: `${firstText(invoice?.client, "Client invoice")} · ${formatPKR(
//           getEstimateInvoiceAmount(invoice),
//         )}`,
//         status: invoice?.status || "unpaid",
//         date:
//           toDate(invoice?.invoiceDate) ||
//           toDate(invoice?.createdAt) ||
//           toDate(invoice?.updatedAt),
//       })),
//       ...data.purchaseOrders.map((purchaseOrder) => ({
//         id: `po-${purchaseOrder.id}`,
//         module: "Purchase Order",
//         title: firstText(
//           purchaseOrder?.poNumber,
//           purchaseOrder?.purchaseOrderNumber,
//           "Purchase order",
//         ),
//         description: `${firstText(
//           purchaseOrder?.supplierName,
//           purchaseOrder?.vendorName,
//           "Supplier",
//         )} · ${formatPKR(getPurchaseOrderAmount(purchaseOrder))}`,
//         status: purchaseOrder?.status || "draft",
//         date:
//           toDate(purchaseOrder?.createdAt) ||
//           toDate(purchaseOrder?.issueDate) ||
//           toDate(purchaseOrder?.updatedAt),
//       })),
//       ...data.expenseSheets.map((expense) => ({
//         id: `expense-${expense.id}`,
//         module: "Budget Expense",
//         title: firstText(
//           expense?.expenseId,
//           expense?.projectName,
//           expense?.project,
//           "Expense sheet",
//         ),
//         description: `${firstText(
//           expense?.clientName,
//           expense?.submittedByName,
//           "Expense submitted",
//         )} · ${formatPKR(getExpenseAmount(expense))}`,
//         status: expense?.paymentStatus || expense?.status || "submitted",
//         date:
//           toDate(expense?.submittedAt) ||
//           toDate(expense?.createdAt) ||
//           toDate(expense?.updatedAt),
//       })),
//       ...data.directClaims.map((claim) => ({
//         id: `claim-${claim.id}`,
//         module: "Reimbursement",
//         title: firstText(
//           claim?.description,
//           claim?.foodItem,
//           claim?.claimType,
//           "Reimbursement claim",
//         ),
//         description: `${firstText(
//           claim?.submittedByName,
//           claim?.personName,
//           "Employee",
//         )} · ${formatPKR(getClaimAmount(claim))}`,
//         status:
//           normalizeText(claim?.paymentStatus) === "paid"
//             ? "paid"
//             : claim?.status || claim?.approvalStatus || "pending",
//         date:
//           toDate(claim?.submittedAt) ||
//           toDate(claim?.createdAt) ||
//           toDate(claim?.updatedAt),
//       })),
//       ...data.records.map((record) => ({
//         id: `record-${record.id}`,
//         module: "Record",
//         title: firstText(
//           record?.statementTitle,
//           record?.accountTitle,
//           record?.chequeNumber,
//           "Financial record",
//         ),
//         description: `${firstText(record?.bank, record?.accountNo, "Account")} · ${formatPKR(
//           record?.chequeAmount,
//         )}`,
//         status: record?.status || "recorded",
//         date:
//           toDate(record?.createdAt) ||
//           toDate(record?.selectedDate) ||
//           toDate(record?.updatedAt),
//       })),
//     ]
//       .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))
//       .slice(0, 12);

//     const workflowData = [
//       { name: "Admin", value: budgetPendingAdmin, color: "#f59e0b" },
//       { name: "Finance", value: budgetPendingFinance, color: "#8b5cf6" },
//       { name: "Ready", value: budgetReadyForPayment, color: "#3b82f6" },
//       { name: "Partial", value: budgetPartial, color: "#06b6d4" },
//       { name: "Released", value: budgetReleased, color: "#10b981" },
//       { name: "Returned", value: budgetRejected, color: "#f43f5e" },
//     ];

//     return {
//       totalIncome,
//       totalExpense,
//       balance,
//       monthIncome,
//       monthExpense,
//       incomeEvents,
//       expenseEvents,
//       budgetTotalAmount,
//       budgetReleasedAmount,
//       budgetRemainingAmount,
//       budgetPendingAdmin,
//       budgetPendingFinance,
//       budgetReadyForPayment,
//       budgetPartial,
//       budgetReleased,
//       budgetRejected,
//       estimateTotalAmount,
//       estimateApproved,
//       estimateInvoiced,
//       invoiceTotalAmount,
//       paidInvoices: paidInvoices.length,
//       partialInvoices: partialInvoices.length,
//       unpaidInvoices: unpaidInvoices.length,
//       paidInvoiceAmount,
//       receivedInvoiceAmount,
//       invoiceOutstanding,
//       poTotalAmount,
//       poPaid,
//       poOpen,
//       poOverdue,
//       expenseSheetAmount,
//       reimbursementAmount,
//       reimbursementPending,
//       reimbursementApproved,
//       reimbursementPaid,
//       reimbursementPaidAmount,
//       recordChequeAmount,
//       recordItemAmount,
//       recordRemaining,
//       vendorCount: vendorNames.size,
//       vendorOverdue,
//       cashFlowData: lastSixMonths,
//       workflowData,
//       activities,
//     };
//   }, [data]);

//   const roleAlerts = useMemo(() => {
//     if (["finance", "financial_admin", "finance_admin"].includes(roleKey)) {
//       return [
//         {
//           title: "Finance Approval",
//           value: String(summary.budgetPendingFinance),
//           description: "Requests currently waiting for finance approval.",
//           icon: <Landmark className="h-5 w-5" />,
//           tone: "amber" as const,
//         },
//         {
//           title: "Release Payment",
//           value: String(summary.budgetReadyForPayment),
//           description: "Approved requests that still require payment release.",
//           icon: <Banknote className="h-5 w-5" />,
//           tone: "blue" as const,
//         },
//         {
//           title: "Partial Releases",
//           value: String(summary.budgetPartial),
//           description: "Requests with a remaining payment balance.",
//           icon: <CircleDollarSign className="h-5 w-5" />,
//           tone: "blue" as const,
//         },
//         {
//           title: "Reimbursement Payment",
//           value: String(
//             Math.max(
//               summary.reimbursementApproved - summary.reimbursementPaid,
//               0,
//             ),
//           ),
//           description: "Approved reimbursement claims awaiting payment.",
//           icon: <Users className="h-5 w-5" />,
//           tone: "emerald" as const,
//         },
//       ];
//     }

//     if (["admin", "main_admin", "super_admin"].includes(roleKey)) {
//       return [
//         {
//           title: "Admin Approval",
//           value: String(summary.budgetPendingAdmin),
//           description: "Budget requests requiring an admin decision.",
//           icon: <BadgeCheck className="h-5 w-5" />,
//           tone: "amber" as const,
//         },
//         {
//           title: "Returned Requests",
//           value: String(summary.budgetRejected),
//           description: "Requests returned to their creators for correction.",
//           icon: <XCircle className="h-5 w-5" />,
//           tone: "rose" as const,
//         },
//         {
//           title: "Pending Reimbursements",
//           value: String(summary.reimbursementPending),
//           description: "Reimbursement claims waiting for review.",
//           icon: <Clock3 className="h-5 w-5" />,
//           tone: "blue" as const,
//         },
//         {
//           title: "Overdue Purchase Orders",
//           value: String(summary.poOverdue),
//           description: "Open purchase orders whose due date has passed.",
//           icon: <AlertTriangle className="h-5 w-5" />,
//           tone: "rose" as const,
//         },
//       ];
//     }

//     return [
//       {
//         title: "Admin Queue",
//         value: String(summary.budgetPendingAdmin),
//         description: "Requests currently moving through admin approval.",
//         icon: <Clock3 className="h-5 w-5" />,
//         tone: "amber" as const,
//       },
//       {
//         title: "Finance Queue",
//         value: String(summary.budgetPendingFinance),
//         description: "Requests currently waiting for finance review.",
//         icon: <Landmark className="h-5 w-5" />,
//         tone: "blue" as const,
//       },
//       {
//         title: "Returned To Team",
//         value: String(summary.budgetRejected),
//         description: "Requests that require correction and resubmission.",
//         icon: <XCircle className="h-5 w-5" />,
//         tone: "rose" as const,
//       },
//       {
//         title: "Expense Submitted",
//         value: String(data.expenseSheets.length),
//         description: "Budget expense sheets recorded in the system.",
//         icon: <ReceiptText className="h-5 w-5" />,
//         tone: "emerald" as const,
//       },
//     ];
//   }, [data.expenseSheets.length, roleKey, summary]);

//   if (loading) {
//     return (
//       <div className="flex min-h-[70vh] items-center justify-center bg-slate-50">
//         <div className="rounded-3xl border border-slate-200 bg-white px-10 py-8 text-center shadow-sm">
//           <div className="mx-auto h-11 w-11 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
//           <p className="mt-4 text-sm font-bold text-slate-700">
//             Building your system dashboard...
//           </p>
//           <p className="mt-1 text-xs text-slate-400">
//             Loading finance, requests, invoices, POs, records and expenses.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   if (!hasFullDashboardAccess) {
//     return (
//       <>
//         <RestrictedDashboard
//           userProfile={userProfile}
//           roleKey={roleKey}
//           data={data}
//           refreshing={refreshing}
//           lastUpdated={lastUpdated}
//           unavailableModules={unavailableModules}
//           canCreateInvoices={canCreateInvoices}
//           onRefresh={() => loadDashboardData(true)}
//           onCreateBudgetRequest={() => setIsInvoiceModalOpen(true)}
//         />

//         {canCreateInvoices && (
//           <InvoiceRequestModal
//             isOpen={isInvoiceModalOpen}
//             onClose={() => setIsInvoiceModalOpen(false)}
//             onSuccess={() => {
//               setIsInvoiceModalOpen(false);
//               loadDashboardData(true);
//             }}
//           />
//         )}
//       </>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-slate-50/80 p-4 text-slate-900 sm:p-6">
//       <div className="mx-auto space-y-6">
//         <section className="overflow-hidden rounded-[32px] bg-slate-950 p-6 text-white shadow-xl shadow-slate-200/70 sm:p-8">
//           <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
//             <div>
//               <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">
//                 <Activity className="h-3.5 w-3.5" />
//                 Live System Overview
//               </div>

//               <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-[-0.04em] sm:text-4xl">
//                 Welcome back, {userProfile?.displayName || "Team Member"}
//               </h1>

//               <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
//                 A complete operational and financial view of budget requests,
//                 estimates, invoices, purchase orders, payments, expenses,
//                 reimbursements, records and vendors.
//               </p>

//               <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-300">
//                 <span className="rounded-full bg-white/10 px-3 py-1.5 font-semibold">
//                   Role: {humanize(userProfile?.role || "User")}
//                 </span>
//                 <span className="rounded-full bg-white/10 px-3 py-1.5 font-semibold">
//                   Updated: {lastUpdated ? formatRelativeTime(lastUpdated) : "Now"}
//                 </span>
//                 {unavailableModules.length > 0 && (
//                   <span className="rounded-full bg-amber-400/15 px-3 py-1.5 font-semibold text-amber-200">
//                     {unavailableModules.length} source(s) unavailable
//                   </span>
//                 )}
//               </div>
//             </div>

//             <div className="flex flex-wrap gap-2">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => loadDashboardData(true)}
//                 disabled={refreshing}
//                 className="h-11 rounded-2xl border-white/15 bg-white/10 px-4 text-white hover:bg-white/15 hover:text-white"
//               >
//                 <RefreshCcw
//                   className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
//                 />
//                 {refreshing ? "Refreshing" : "Refresh"}
//               </Button>

//               {canCreateInvoices && (
//                 <Button
//                   type="button"
//                   onClick={() => setIsInvoiceModalOpen(true)}
//                   className="h-11 rounded-2xl bg-white px-4 font-bold text-slate-950 hover:bg-slate-100"
//                 >
//                   <Plus className="mr-2 h-4 w-4" />
//                   New Budget Request
//                 </Button>
//               )}
//             </div>
//           </div>

//           <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
//             <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
//               <p className="text-xs font-semibold text-slate-300">Opening Balance</p>
//               <p className="mt-2 text-xl font-black">
//                 {formatCompactPKR(data.openingBalance)}
//               </p>
//             </div>
//             <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
//               <p className="text-xs font-semibold text-slate-300">System Records</p>
//               <p className="mt-2 text-xl font-black">
//                 {(
//                   data.invoiceRequests.length +
//                   data.estimates.length +
//                   data.estimateInvoices.length +
//                   data.purchaseOrders.length +
//                   data.expenseSheets.length +
//                   data.records.length
//                 ).toLocaleString()}
//               </p>
//             </div>
//             <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
//               <p className="text-xs font-semibold text-slate-300">Budget Pipeline</p>
//               <p className="mt-2 text-xl font-black">
//                 {formatCompactPKR(summary.budgetTotalAmount)}
//               </p>
//             </div>
//             <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
//               <p className="text-xs font-semibold text-slate-300">Outstanding Invoices</p>
//               <p className="mt-2 text-xl font-black">
//                 {formatCompactPKR(summary.invoiceOutstanding)}
//               </p>
//             </div>
//           </div>
//         </section>

//         {unavailableModules.length > 0 && (
//           <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
//             <div className="flex items-start gap-3">
//               <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
//               <div>
//                 <p className="font-bold">Some dashboard sources could not be read.</p>
//                 <p className="mt-1 text-xs leading-5">
//                   Check Firestore permissions for: {unavailableModules.join(", ")}.
//                   All available modules are still displayed.
//                 </p>
//               </div>
//             </div>
//           </div>
//         )}

//         <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
//           <MetricCard
//             title="Current Balance"
//             value={formatCompactPKR(summary.balance)}
//             subtitle={`Opening + ${formatCompactPKR(summary.totalIncome)} income - ${formatCompactPKR(summary.totalExpense)} expense`}
//             icon={Wallet}
//             tone={summary.balance >= 0 ? "emerald" : "rose"}
//             trend={summary.balance >= 0 ? "up" : "down"}
//           />
//           <MetricCard
//             title="Total Income"
//             value={formatCompactPKR(summary.totalIncome)}
//             subtitle={`${formatCompactPKR(summary.monthIncome)} received this month`}
//             icon={TrendingUp}
//             tone="emerald"
//             trend="up"
//           />
//           <MetricCard
//             title="Total Expense"
//             value={formatCompactPKR(summary.totalExpense)}
//             subtitle={`${formatCompactPKR(summary.monthExpense)} released this month`}
//             icon={ArrowDownRight}
//             tone="rose"
//             trend="down"
//           />
//           <MetricCard
//             title="Remaining Releases"
//             value={formatCompactPKR(summary.budgetRemainingAmount)}
//             subtitle={`${summary.budgetReadyForPayment} request(s) ready for payment`}
//             icon={CircleDollarSign}
//             tone="blue"
//           />
//         </section>

//         <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//           <div className="mb-4 flex items-center justify-between gap-4">
//             <div>
//               <h2 className="text-lg font-black text-slate-950">Priority Actions</h2>
//               <p className="mt-1 text-xs text-slate-500">
//                 The most important tasks for your current role.
//               </p>
//             </div>
//             <ListChecks className="h-5 w-5 text-slate-400" />
//           </div>

//           <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
//             {roleAlerts.map((alert) => (
//               <AlertCard key={alert.title} {...alert} />
//             ))}
//           </div>
//         </section>

//         <section className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
//           <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//             <CardContent className="p-5 sm:p-6">
//               <div className="flex items-start justify-between gap-4">
//                 <div>
//                   <h2 className="text-lg font-black text-slate-950">
//                     Income vs Expense
//                   </h2>
//                   <p className="mt-1 text-xs text-slate-500">
//                     Account Statement cash movement for the last six months.
//                   </p>
//                 </div>
//                 <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
//                   <BarChart3 className="h-5 w-5" />
//                 </div>
//               </div>

//               <div className="mt-6 h-[310px]">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <AreaChart data={summary.cashFlowData}>
//                     <defs>
//                       <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
//                         <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
//                         <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
//                       </linearGradient>
//                       <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
//                         <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.22} />
//                         <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
//                       </linearGradient>
//                     </defs>
//                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
//                     <XAxis dataKey="label" tickLine={false} axisLine={false} />
//                     <YAxis
//                       tickLine={false}
//                       axisLine={false}
//                       tickFormatter={(value) => formatCompactPKR(value).replace("Rs ", "")}
//                     />
//                     <Tooltip formatter={(value: any) => formatPKR(value)} />
//                     <Area
//                       type="monotone"
//                       dataKey="income"
//                       name="Income"
//                       stroke="#10b981"
//                       strokeWidth={3}
//                       fill="url(#incomeGradient)"
//                     />
//                     <Area
//                       type="monotone"
//                       dataKey="expense"
//                       name="Expense"
//                       stroke="#f43f5e"
//                       strokeWidth={3}
//                       fill="url(#expenseGradient)"
//                     />
//                   </AreaChart>
//                 </ResponsiveContainer>
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//             <CardContent className="p-5 sm:p-6">
//               <div className="flex items-start justify-between gap-4">
//                 <div>
//                   <h2 className="text-lg font-black text-slate-950">
//                     Budget Workflow
//                   </h2>
//                   <p className="mt-1 text-xs text-slate-500">
//                     Current distribution of budget request stages.
//                   </p>
//                 </div>
//                 <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
//                   <FileCheck2 className="h-5 w-5" />
//                 </div>
//               </div>

//               <div className="mt-6 h-[220px]">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={summary.workflowData}>
//                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
//                     <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
//                     <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
//                     <Tooltip />
//                     <Bar dataKey="value" radius={[8, 8, 0, 0]}>
//                       {summary.workflowData.map((item) => (
//                         <Cell key={item.name} fill={item.color} />
//                       ))}
//                     </Bar>
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>

//               <div className="mt-4 grid grid-cols-2 gap-3">
//                 <div className="rounded-2xl bg-slate-50 p-3">
//                   <p className="text-xs font-semibold text-slate-500">Released</p>
//                   <p className="mt-1 text-lg font-black text-emerald-600">
//                     {formatCompactPKR(summary.budgetReleasedAmount)}
//                   </p>
//                 </div>
//                 <div className="rounded-2xl bg-slate-50 p-3">
//                   <p className="text-xs font-semibold text-slate-500">Remaining</p>
//                   <p className="mt-1 text-lg font-black text-blue-600">
//                     {formatCompactPKR(summary.budgetRemainingAmount)}
//                   </p>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </section>

//         <section>
//           <div className="mb-4 flex items-end justify-between gap-4">
//             <div>
//               <h2 className="text-xl font-black text-slate-950">Module Overview</h2>
//               <p className="mt-1 text-sm text-slate-500">
//                 Live totals from every major front-end module.
//               </p>
//             </div>
//           </div>

//           <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
//             <ModuleCard
//               title="Budget Requests"
//               subtitle="Approval, payment-release and remaining-balance status."
//               icon={FileText}
//               items={[
//                 { label: "Total Requests", value: String(data.invoiceRequests.length) },
//                 { label: "Approved Value", value: formatCompactPKR(summary.budgetTotalAmount) },
//                 { label: "Partial Releases", value: String(summary.budgetPartial), className: "text-blue-600" },
//                 { label: "Fully Released", value: String(summary.budgetReleased), className: "text-emerald-600" },
//               ]}
//             />

//             <ModuleCard
//               title="Estimates"
//               subtitle="Estimate pipeline and converted estimate records."
//               icon={FileSpreadsheet}
//               items={[
//                 { label: "Total Estimates", value: String(data.estimates.length) },
//                 { label: "Estimate Value", value: formatCompactPKR(summary.estimateTotalAmount) },
//                 { label: "Approved", value: String(summary.estimateApproved), className: "text-emerald-600" },
//                 { label: "Invoiced", value: String(summary.estimateInvoiced), className: "text-blue-600" },
//               ]}
//             />

//             <ModuleCard
//               title="Estimate Invoices"
//               subtitle="Paid, unpaid and partially-paid client invoices."
//               icon={ReceiptText}
//               items={[
//                 { label: "Total Invoices", value: String(data.estimateInvoices.length) },
//                 { label: "Invoice Value", value: formatCompactPKR(summary.invoiceTotalAmount) },
//                 { label: "Paid / Partial", value: `${summary.paidInvoices} / ${summary.partialInvoices}`, className: "text-emerald-600" },
//                 { label: "Outstanding", value: formatCompactPKR(summary.invoiceOutstanding), className: "text-amber-600" },
//               ]}
//             />

//             <ModuleCard
//               title="Purchase Orders"
//               subtitle="Purchase-order totals, open orders and overdue items."
//               icon={PackageCheck}
//               items={[
//                 { label: "Total POs", value: String(data.purchaseOrders.length) },
//                 { label: "PO Value", value: formatCompactPKR(summary.poTotalAmount) },
//                 { label: "Open / Paid", value: `${summary.poOpen} / ${summary.poPaid}` },
//                 { label: "Overdue", value: String(summary.poOverdue), className: "text-rose-600" },
//               ]}
//             />

//             <ModuleCard
//               title="Budget Expenses"
//               subtitle="Submitted expense sheets and recorded expense value."
//               icon={CreditCard}
//               items={[
//                 { label: "Expense Sheets", value: String(data.expenseSheets.length) },
//                 { label: "Submitted Value", value: formatCompactPKR(summary.expenseSheetAmount) },
//                 { label: "This Month Cash Out", value: formatCompactPKR(summary.monthExpense) },
//                 { label: "Total Cash Out", value: formatCompactPKR(summary.totalExpense), className: "text-rose-600" },
//               ]}
//             />

//             <ModuleCard
//               title="Reimbursements"
//               subtitle="Direct and sales-meeting reimbursement claims."
//               icon={Users}
//               items={[
//                 { label: "Total Claims", value: String(data.directClaims.length + data.meetingClaims.length) },
//                 { label: "Claim Value", value: formatCompactPKR(summary.reimbursementAmount) },
//                 { label: "Pending / Approved", value: `${summary.reimbursementPending} / ${summary.reimbursementApproved}` },
//                 { label: "Paid Amount", value: formatCompactPKR(summary.reimbursementPaidAmount), className: "text-emerald-600" },
//               ]}
//             />

//             <ModuleCard
//               title="Records & Cheques"
//               subtitle="Cheque records, item amounts and remaining balances."
//               icon={Landmark}
//               items={[
//                 { label: "Total Records", value: String(data.records.length) },
//                 { label: "Cheque Amount", value: formatCompactPKR(summary.recordChequeAmount) },
//                 { label: "Item Amount", value: formatCompactPKR(summary.recordItemAmount) },
//                 { label: "Remaining", value: formatCompactPKR(summary.recordRemaining), className: summary.recordRemaining < 0 ? "text-rose-600" : "text-emerald-600" },
//               ]}
//             />

//             <ModuleCard
//               title="Vendors"
//               subtitle="Vendor exposure derived from budget requests and releases."
//               icon={Building2}
//               items={[
//                 { label: "Unique Vendors", value: String(summary.vendorCount) },
//                 { label: "Paid to Vendors", value: formatCompactPKR(summary.budgetReleasedAmount) },
//                 { label: "Remaining Payable", value: formatCompactPKR(summary.budgetRemainingAmount), className: "text-blue-600" },
//                 { label: "Overdue Payable", value: formatCompactPKR(summary.vendorOverdue), className: "text-rose-600" },
//               ]}
//             />
//           </div>
//         </section>

//         <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
//           <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//             <CardContent className="p-5 sm:p-6">
//               <div className="flex items-start justify-between gap-4">
//                 <div>
//                   <h2 className="text-lg font-black text-slate-950">
//                     Recent System Activity
//                   </h2>
//                   <p className="mt-1 text-xs text-slate-500">
//                     Latest updates across requests, invoices, POs, expenses,
//                     reimbursements and records.
//                   </p>
//                 </div>
//                 <Activity className="h-5 w-5 text-slate-400" />
//               </div>

//               <div className="mt-5 divide-y divide-slate-100">
//                 {summary.activities.length === 0 ? (
//                   <div className="py-12 text-center">
//                     <CalendarClock className="mx-auto h-7 w-7 text-slate-300" />
//                     <p className="mt-3 text-sm font-semibold text-slate-500">
//                       No recent activity found.
//                     </p>
//                   </div>
//                 ) : (
//                   summary.activities.map((activity) => (
//                     <div
//                       key={activity.id}
//                       className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"
//                     >
//                       <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
//                         <Activity className="h-4 w-4" />
//                       </div>

//                       <div className="min-w-0 flex-1">
//                         <div className="flex flex-wrap items-center gap-2">
//                           <p className="truncate text-sm font-black text-slate-900">
//                             {activity.title}
//                           </p>
//                           <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
//                             {activity.module}
//                           </span>
//                         </div>
//                         <p className="mt-1 truncate text-xs text-slate-500">
//                           {activity.description}
//                         </p>
//                       </div>

//                       <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
//                         <StatusBadge status={activity.status} />
//                         <span className="text-[11px] font-semibold text-slate-400">
//                           {formatRelativeTime(activity.date)}
//                         </span>
//                       </div>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </CardContent>
//           </Card>

//           <div className="space-y-6">
//             <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//               <CardContent className="p-5">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <h2 className="font-black text-slate-950">Financial Health</h2>
//                     <p className="mt-1 text-xs text-slate-500">
//                       Key collection and payment indicators.
//                     </p>
//                   </div>
//                   <Wallet className="h-5 w-5 text-slate-400" />
//                 </div>

//                 <div className="mt-5 space-y-4">
//                   <div>
//                     <div className="flex justify-between text-xs font-semibold text-slate-500">
//                       <span>Invoice Collection</span>
//                       <span>
//                         {summary.invoiceTotalAmount > 0
//                           ? Math.min(
//                               (summary.receivedInvoiceAmount /
//                                 summary.invoiceTotalAmount) *
//                                 100,
//                               100,
//                             ).toFixed(0)
//                           : 0}
//                         %
//                       </span>
//                     </div>
//                     <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
//                       <div
//                         className="h-full rounded-full bg-emerald-500"
//                         style={{
//                           width: `${
//                             summary.invoiceTotalAmount > 0
//                               ? Math.min(
//                                   (summary.receivedInvoiceAmount /
//                                     summary.invoiceTotalAmount) *
//                                     100,
//                                   100,
//                                 )
//                               : 0
//                           }%`,
//                         }}
//                       />
//                     </div>
//                   </div>

//                   <div>
//                     <div className="flex justify-between text-xs font-semibold text-slate-500">
//                       <span>Budget Released</span>
//                       <span>
//                         {summary.budgetTotalAmount > 0
//                           ? Math.min(
//                               (summary.budgetReleasedAmount /
//                                 summary.budgetTotalAmount) *
//                                 100,
//                               100,
//                             ).toFixed(0)
//                           : 0}
//                         %
//                       </span>
//                     </div>
//                     <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
//                       <div
//                         className="h-full rounded-full bg-blue-500"
//                         style={{
//                           width: `${
//                             summary.budgetTotalAmount > 0
//                               ? Math.min(
//                                   (summary.budgetReleasedAmount /
//                                     summary.budgetTotalAmount) *
//                                     100,
//                                   100,
//                                 )
//                               : 0
//                           }%`,
//                         }}
//                       />
//                     </div>
//                   </div>

//                   <div>
//                     <div className="flex justify-between text-xs font-semibold text-slate-500">
//                       <span>Reimbursements Paid</span>
//                       <span>
//                         {summary.reimbursementApproved > 0
//                           ? Math.min(
//                               (summary.reimbursementPaid /
//                                 summary.reimbursementApproved) *
//                                 100,
//                               100,
//                             ).toFixed(0)
//                           : 0}
//                         %
//                       </span>
//                     </div>
//                     <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
//                       <div
//                         className="h-full rounded-full bg-violet-500"
//                         style={{
//                           width: `${
//                             summary.reimbursementApproved > 0
//                               ? Math.min(
//                                   (summary.reimbursementPaid /
//                                     summary.reimbursementApproved) *
//                                     100,
//                                   100,
//                                 )
//                               : 0
//                           }%`,
//                         }}
//                       />
//                     </div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//               <CardContent className="p-5">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <h2 className="font-black text-slate-950">System Snapshot</h2>
//                     <p className="mt-1 text-xs text-slate-500">
//                       Record counts across connected modules.
//                     </p>
//                   </div>
//                   <CheckCircle2 className="h-5 w-5 text-slate-400" />
//                 </div>

//                 <div className="mt-5 grid grid-cols-2 gap-3">
//                   {[
//                     ["Requests", data.invoiceRequests.length],
//                     ["Estimates", data.estimates.length],
//                     ["Invoices", data.estimateInvoices.length],
//                     ["Payments", data.payments.length],
//                     ["POs", data.purchaseOrders.length],
//                     ["Expenses", data.expenseSheets.length],
//                     ["Claims", data.directClaims.length + data.meetingClaims.length],
//                     ["Records", data.records.length],
//                   ].map(([label, value]) => (
//                     <div key={String(label)} className="rounded-2xl bg-slate-50 p-3">
//                       <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
//                         {label}
//                       </p>
//                       <p className="mt-1 text-xl font-black text-slate-950">
//                         {Number(value).toLocaleString()}
//                       </p>
//                     </div>
//                   ))}
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </section>
//       </div>

//       {canCreateInvoices && (
//         <InvoiceRequestModal
//           isOpen={isInvoiceModalOpen}
//           onClose={() => setIsInvoiceModalOpen(false)}
//           onSuccess={() => {
//             setIsInvoiceModalOpen(false);
//             loadDashboardData(true);
//           }}
//         />
//       )}
//     </div>
//   );
// }

// import {
//   useCallback,
//   useEffect,
//   useMemo,
//   useState,
//   type ReactNode,
// } from "react";
// import {
//   collection,
//   collectionGroup,
//   doc,
//   getDoc,
//   getDocs,
//   onSnapshot,
//   type DocumentData,
//   type QueryDocumentSnapshot,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { useAuth } from "@/contexts/AuthContext";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import InvoiceRequestModal from "@/components/BudgetRequestModal";
// import {
//   Activity,
//   AlertTriangle,
//   ArrowDownRight,
//   ArrowUpRight,
//   BadgeCheck,
//   Banknote,
//   BarChart3,
//   Building2,
//   CalendarClock,
//   CheckCircle2,
//   CircleDollarSign,
//   Clock3,
//   CreditCard,
//   Download,
//   FileCheck2,
//   FileSpreadsheet,
//   FileText,
//   Landmark,
//   ListChecks,
//   PackageCheck,
//   Plus,
//   ReceiptText,
//   RefreshCcw,
//   TrendingUp,
//   Users,
//   Wallet,
//   XCircle,
//   type LucideIcon,
// } from "lucide-react";
// import {
//   Area,
//   AreaChart,
//   Bar,
//   BarChart,
//   CartesianGrid,
//   Cell,
//   ResponsiveContainer,
//   Tooltip,
//   XAxis,
//   YAxis,
// } from "recharts";

// const PANEL_ID = "IEDGE-SYSTEM";

// type AnyRow = Record<string, any> & { id: string };

// type ActivityItem = {
//   id: string;
//   module: string;
//   title: string;
//   description: string;
//   status: string;
//   date: Date | null;
// };

// type MoneyEvent = {
//   date: Date | null;
//   amount: number;
// };

// type DashboardData = {
//   invoiceRequests: AnyRow[];
//   estimates: AnyRow[];
//   estimateInvoices: AnyRow[];
//   payments: AnyRow[];
//   expenseSheets: AnyRow[];
//   directClaims: AnyRow[];
//   meetingClaims: AnyRow[];
//   records: AnyRow[];
//   purchaseOrders: AnyRow[];
//   manualEntries: AnyRow[];
//   openingBalance: number;
// };

// const EMPTY_DATA: DashboardData = {
//   invoiceRequests: [],
//   estimates: [],
//   estimateInvoices: [],
//   payments: [],
//   expenseSheets: [],
//   directClaims: [],
//   meetingClaims: [],
//   records: [],
//   purchaseOrders: [],
//   manualEntries: [],
//   openingBalance: 0,
// };

// const normalizeText = (value: any) =>
//   String(value || "")
//     .trim()
//     .toLowerCase();

// const safeNumber = (value: any): number => {
//   if (value === null || value === undefined || value === "") return 0;

//   const parsed =
//     typeof value === "number"
//       ? value
//       : Number(String(value).replace(/,/g, ""));

//   return Number.isFinite(parsed) ? parsed : 0;
// };

// const firstText = (...values: any[]): string => {
//   for (const value of values) {
//     if (value === null || value === undefined || typeof value === "object") {
//       continue;
//     }

//     const text = String(value).trim();
//     if (text) return text;
//   }

//   return "";
// };

// const toDate = (value: any): Date | null => {
//   if (!value) return null;

//   try {
//     if (value instanceof Date) {
//       return Number.isNaN(value.getTime()) ? null : value;
//     }

//     if (typeof value?.toDate === "function") {
//       const date = value.toDate();
//       return Number.isNaN(date?.getTime?.()) ? null : date;
//     }

//     if (typeof value?.seconds === "number") {
//       const date = new Date(value.seconds * 1000);
//       return Number.isNaN(date.getTime()) ? null : date;
//     }

//     if (typeof value === "string") {
//       const trimmed = value.trim();

//       const ymd = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
//       if (ymd) {
//         const date = new Date(
//           Number(ymd[1]),
//           Number(ymd[2]) - 1,
//           Number(ymd[3]),
//         );
//         return Number.isNaN(date.getTime()) ? null : date;
//       }

//       const dmy = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
//       if (dmy) {
//         const date = new Date(
//           Number(dmy[3]),
//           Number(dmy[2]) - 1,
//           Number(dmy[1]),
//         );
//         return Number.isNaN(date.getTime()) ? null : date;
//       }
//     }

//     const date = new Date(value);
//     return Number.isNaN(date.getTime()) ? null : date;
//   } catch {
//     return null;
//   }
// };

// const getEntityDate = (source: any): Date | null =>
//   toDate(source?.paymentReleasedAt) ||
//   toDate(source?.releasePaymentAt) ||
//   toDate(source?.releasedAt) ||
//   toDate(source?.paymentDate) ||
//   toDate(source?.submittedAt) ||
//   toDate(source?.createdAt) ||
//   toDate(source?.updatedAt) ||
//   toDate(source?.invoiceDate) ||
//   toDate(source?.date) ||
//   toDate(source?.issueDate) ||
//   null;

// const getRequestDate = (source: any): Date | null =>
//   toDate(source?.submitDate) ||
//   toDate(source?.submittedAt) ||
//   toDate(source?.submissionDate) ||
//   toDate(source?.requestDate) ||
//   toDate(source?.createdAt) ||
//   toDate(source?.date) ||
//   toDate(source?.updatedAt) ||
//   null;

// const formatPKR = (value: any): string =>
//   `Rs ${safeNumber(value).toLocaleString("en-PK", {
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 2,
//   })}`;

// const formatCompactPKR = (value: any): string => {
//   const number = safeNumber(value);

//   if (Math.abs(number) >= 1_000_000_000) {
//     return `Rs ${(number / 1_000_000_000).toFixed(1)}B`;
//   }

//   if (Math.abs(number) >= 1_000_000) {
//     return `Rs ${(number / 1_000_000).toFixed(1)}M`;
//   }

//   if (Math.abs(number) >= 1_000) {
//     return `Rs ${(number / 1_000).toFixed(1)}K`;
//   }

//   return formatPKR(number);
// };

// const formatRelativeTime = (date: Date | null): string => {
//   if (!date) return "Date unavailable";

//   const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60_000);

//   if (diffMinutes < 1) return "Just now";
//   if (diffMinutes < 60) return `${diffMinutes} min ago`;
//   if (diffMinutes < 1_440) return `${Math.floor(diffMinutes / 60)} hr ago`;
//   if (diffMinutes < 10_080)
//     return `${Math.floor(diffMinutes / 1_440)} days ago`;

//   return date.toLocaleDateString("en-PK", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// };

// const humanize = (value: any): string =>
//   String(value || "Unknown")
//     .replace(/_/g, " ")
//     .replace(/\b\w/g, (letter) => letter.toUpperCase());

// const getApprovedRequestAmount = (request: any): number =>
//   safeNumber(
//     request?.approvedAmount ??
//       request?.totalApprovedAmount ??
//       request?.approvedTotal ??
//       request?.totalAmount ??
//       request?.amount,
//   );

// const getReleaseAmount = (entry: any): number =>
//   safeNumber(
//     entry?.amount ??
//       entry?.releaseAmount ??
//       entry?.releasedAmount ??
//       entry?.paymentAmount,
//   );

// const getPaymentReleaseHistory = (request: any): any[] => {
//   const history = Array.isArray(request?.paymentReleaseHistory)
//     ? request.paymentReleaseHistory
//     : [];

//   const validHistory = history.filter(
//     (entry: any) => getReleaseAmount(entry) > 0,
//   );

//   if (validHistory.length > 0) return validHistory;

//   const legacy = request?.paymentDetails || request?.latestPaymentRelease;
//   if (legacy && getReleaseAmount(legacy) > 0) {
//     return [
//       {
//         ...legacy,
//         releasedAt:
//           legacy?.releasedAt ||
//           request?.paymentReleasedAt ||
//           request?.releasePaymentAt ||
//           request?.updatedAt,
//       },
//     ];
//   }

//   return [];
// };

// const getReleasedRequestAmount = (request: any): number => {
//   const explicit = safeNumber(request?.totalReleasedAmount);
//   if (explicit > 0) return explicit;

//   const historyTotal = getPaymentReleaseHistory(request).reduce(
//     (sum, entry) => sum + getReleaseAmount(entry),
//     0,
//   );

//   if (historyTotal > 0) return historyTotal;

//   const status = normalizeText(request?.status);
//   if (
//     ["payment_released", "released"].includes(status) ||
//     request?.paymentReleased === true
//   ) {
//     return getApprovedRequestAmount(request);
//   }

//   return safeNumber(
//     request?.releasedAmount ??
//       request?.paidAmount ??
//       request?.paymentAmount,
//   );
// };

// const getRemainingRequestAmount = (request: any): number => {
//   if (
//     request?.remainingReleaseAmount !== undefined &&
//     request?.remainingReleaseAmount !== null
//   ) {
//     return Math.max(safeNumber(request.remainingReleaseAmount), 0);
//   }

//   return Math.max(
//     getApprovedRequestAmount(request) - getReleasedRequestAmount(request),
//     0,
//   );
// };

// const isFullyReleased = (request: any): boolean => {
//   const approved = getApprovedRequestAmount(request);
//   const released = getReleasedRequestAmount(request);
//   const remaining = getRemainingRequestAmount(request);
//   const status = normalizeText(request?.status);

//   if (approved > 0 && (remaining <= 0.009 || released >= approved - 0.009)) {
//     return true;
//   }

//   return ["payment_released", "released"].includes(status);
// };

// const isPartiallyReleased = (request: any): boolean =>
//   getReleasedRequestAmount(request) > 0 && !isFullyReleased(request);

// const getInvoiceStatus = (invoice: any): string => {
//   const raw = normalizeText(invoice?.status || invoice?.paymentStatus);

//   if (raw === "paid") return "paid";
//   if (["partially paid", "partially_paid", "partial"].includes(raw)) {
//     return "partial";
//   }

//   return "unpaid";
// };

// const getClaimStatus = (claim: any): string => {
//   const status = normalizeText(claim?.status || claim?.approvalStatus);

//   if (status === "approved") return "approved";
//   if (status === "rejected") return "rejected";
//   return "pending";
// };

// const getClaimAmount = (claim: any): number =>
//   safeNumber(
//     claim?.claimAmount ??
//       claim?.amount ??
//       claim?.approvedAmount ??
//       claim?.paidAmount,
//   );

// const getClaimPaidAmount = (claim: any): number => {
//   if (normalizeText(claim?.paymentStatus) !== "paid") return 0;

//   return safeNumber(
//     claim?.paidAmount ??
//       claim?.approvedAmount ??
//       claim?.claimAmount ??
//       claim?.amount,
//   );
// };

// const getExpenseAmount = (expense: any): number =>
//   safeNumber(expense?.totalAmount ?? expense?.amount);

// const getPurchaseOrderAmount = (purchaseOrder: any): number =>
//   safeNumber(
//     purchaseOrder?.totalAmount ??
//       purchaseOrder?.total ??
//       purchaseOrder?.amount,
//   );

// const getEstimateAmount = (estimate: any): number =>
//   safeNumber(estimate?.total ?? estimate?.totalAmount ?? estimate?.amount);

// const getEstimateInvoiceAmount = (invoice: any): number =>
//   safeNumber(invoice?.total ?? invoice?.totalAmount ?? invoice?.amount);

// const getVendorNames = (request: any): string[] => {
//   const names = new Set<string>();

//   const direct = firstText(
//     request?.vendorName,
//     request?.supplierName,
//     request?.payeeName,
//     request?.payee,
//   );
//   if (direct) names.add(direct);

//   const items = [
//     ...(Array.isArray(request?.approvalItems) ? request.approvalItems : []),
//     ...(Array.isArray(request?.lineItems) ? request.lineItems : []),
//     ...(Array.isArray(request?.items) ? request.items : []),
//   ];

//   items.forEach((item: any) => {
//     const name = firstText(
//       item?.vendor,
//       item?.vendorName,
//       item?.supplier,
//       item?.supplierName,
//       item?.original?.vendor,
//       item?.original?.supplier,
//     );

//     if (name) names.add(name);
//   });

//   return Array.from(names);
// };

// const isOverdueDate = (value: any): boolean => {
//   const date = toDate(value);
//   if (!date) return false;

//   const today = new Date();
//   today.setHours(0, 0, 0, 0);
//   date.setHours(0, 0, 0, 0);

//   return date < today;
// };

// const snapshotToRows = (
//   snapshot: { docs: QueryDocumentSnapshot<DocumentData>[] },
// ): AnyRow[] =>
//   snapshot.docs.map((document) => ({
//     id: document.id,
//     ...document.data(),
//   }));

// type FinancialSnapshot = {
//   totalReceivable: number;
//   totalPayable: number;
//   overallProfit: number;
//   overallLoss: number;
//   totalIncome: number;
//   totalExpense: number;
// };

// const SNAPSHOT_ROLES = new Set([
//   "finance",
//   "finance_admin",
//   "financial_admin",
//   "operation",
//   "operations",
//   "operational_admin",
//   "operation_admin",
// ]);

// const buildFinancialSnapshot = (source: DashboardData): FinancialSnapshot => {
//   const incomeEvents: MoneyEvent[] = [];
//   const expenseEvents: MoneyEvent[] = [];

//   source.payments.forEach((payment) => {
//     const amount = safeNumber(payment?.amount);
//     const date =
//       toDate(payment?.paymentDate) ||
//       toDate(payment?.createdAt) ||
//       toDate(payment?.updatedAt);

//     if (amount > 0) incomeEvents.push({ amount, date });

//     const taxDebit =
//       safeNumber(payment?.whtAmount) + safeNumber(payment?.sstAmount);
//     if (taxDebit > 0) expenseEvents.push({ amount: taxDebit, date });
//   });

//   source.invoiceRequests.forEach((request) => {
//     const history = getPaymentReleaseHistory(request);

//     if (history.length > 0) {
//       history.forEach((release) => {
//         const amount = getReleaseAmount(release);
//         if (amount <= 0) return;

//         expenseEvents.push({
//           amount,
//           date:
//             toDate(release?.releasedAt) ||
//             toDate(release?.createdAt) ||
//             getEntityDate(request),
//         });
//       });
//       return;
//     }

//     const releasedAmount = getReleasedRequestAmount(request);
//     if (releasedAmount > 0) {
//       expenseEvents.push({
//         amount: releasedAmount,
//         date: getEntityDate(request),
//       });
//     }
//   });

//   [...source.directClaims, ...source.meetingClaims].forEach((claim) => {
//     const paidAmount = getClaimPaidAmount(claim);
//     if (paidAmount <= 0) return;

//     expenseEvents.push({
//       amount: paidAmount,
//       date:
//         toDate(claim?.paymentReleasedAt) ||
//         toDate(claim?.updatedAt) ||
//         toDate(claim?.meetingUpdatedAt) ||
//         getEntityDate(claim),
//     });
//   });

//   source.records.forEach((record) => {
//     const chequeAmount = safeNumber(record?.chequeAmount);
//     if (chequeAmount > 0) {
//       expenseEvents.push({
//         amount: chequeAmount,
//         date: getEntityDate(record),
//       });
//     }
//   });

//   source.manualEntries.forEach((entry) => {
//     const date = toDate(entry?.date) || getEntityDate(entry);
//     const debit = safeNumber(entry?.debit);
//     const credit = safeNumber(entry?.credit);

//     if (debit > 0) expenseEvents.push({ amount: debit, date });
//     if (credit > 0) incomeEvents.push({ amount: credit, date });
//   });

//   const totalIncome = incomeEvents.reduce((sum, item) => sum + item.amount, 0);
//   const totalExpense = expenseEvents.reduce(
//     (sum, item) => sum + item.amount,
//     0,
//   );

//   const invoiceTotalAmount = source.estimateInvoices.reduce(
//     (sum, invoice) => sum + getEstimateInvoiceAmount(invoice),
//     0,
//   );
//   const receivedInvoiceAmount = source.payments.reduce(
//     (sum, payment) => sum + safeNumber(payment?.amount),
//     0,
//   );

//   const totalReceivable = Math.max(
//     invoiceTotalAmount - receivedInvoiceAmount,
//     0,
//   );
//   const totalPayable = source.invoiceRequests.reduce(
//     (sum, request) => sum + getRemainingRequestAmount(request),
//     0,
//   );

//   const netResult = totalIncome - totalExpense;

//   return {
//     totalReceivable,
//     totalPayable,
//     overallProfit: Math.max(netResult, 0),
//     overallLoss: Math.max(-netResult, 0),
//     totalIncome,
//     totalExpense,
//   };
// };

// const loadFinancialSnapshotSourceData = async (): Promise<DashboardData> => {
//   const readRows = async (path: string[]): Promise<AnyRow[]> => {
//     const snapshot = await getDocs(collection(db, path[0], ...path.slice(1)));
//     return snapshotToRows(snapshot as any);
//   };

//   const [
//     invoiceRequests,
//     estimateInvoices,
//     payments,
//     directClaims,
//     records,
//     manualEntries,
//   ] = await Promise.all([
//     readRows(["Panels", PANEL_ID, "invoiceRequests"]),
//     readRows(["Panels", PANEL_ID, "estimateInvoices"]),
//     readRows(["Panels", PANEL_ID, "payments"]),
//     readRows(["Panels", PANEL_ID, "claimReimbursements"]),
//     readRows(["Panels", PANEL_ID, "Record"]),
//     readRows(["Panels", PANEL_ID, "accountStatementManualEntries"]),
//   ]);

//   let meetingClaims: AnyRow[] = [];
//   const meetingSnapshot = await getDocs(collectionGroup(db, "meetingUpdates"));

//   meetingClaims = meetingSnapshot.docs
//     .map((meetingDocument) => ({
//       id: meetingDocument.id,
//       path: meetingDocument.ref.path,
//       ...meetingDocument.data(),
//     }))
//     .filter((meeting: any) => meeting?.reimbursement?.enabled)
//     .map((meeting: any) => ({
//       id: meeting.id,
//       path: meeting.path,
//       ...meeting.reimbursement,
//       submittedAt:
//         meeting.reimbursement?.approvalSubmittedAt ||
//         meeting.reimbursement?.submittedAt ||
//         meeting.submittedAt ||
//         meeting.createdAt ||
//         null,
//       meetingUpdatedAt: meeting.updatedAt || null,
//     }));

//   return {
//     ...EMPTY_DATA,
//     invoiceRequests,
//     estimateInvoices,
//     payments,
//     directClaims,
//     meetingClaims,
//     records,
//     manualEntries,
//   };
// };

// const sanitizePdfText = (value: any): string =>
//   String(value ?? "")
//     .normalize("NFKD")
//     .replace(/[\u0300-\u036f]/g, "")
//     .replace(/[^\x20-\x7E]/g, "?")
//     .replace(/\\/g, "\\\\")
//     .replace(/\(/g, "\\(")
//     .replace(/\)/g, "\\)");

// const downloadFinancialSnapshotPdf = ({
//   snapshot,
//   generatedBy,
//   role,
// }: {
//   snapshot: FinancialSnapshot;
//   generatedBy: string;
//   role: string;
// }) => {
//   const encoder = new TextEncoder();
//   const pageWidth = 595.28;
//   const pageHeight = 841.89;
//   const commands: string[] = [];

//   const text = (
//     value: string,
//     x: number,
//     y: number,
//     size: number,
//     font: "F1" | "F2" = "F1",
//     color = "0.059 0.090 0.165",
//   ) => {
//     commands.push(
//       `BT /${font} ${size} Tf ${color} rg 1 0 0 1 ${x} ${y} Tm (${sanitizePdfText(value)}) Tj ET`,
//     );
//   };

//   const rect = (
//     x: number,
//     y: number,
//     width: number,
//     height: number,
//     fill: string,
//     stroke?: string,
//   ) => {
//     if (stroke) {
//       commands.push(
//         `q ${fill} rg ${stroke} RG 0.8 w ${x} ${y} ${width} ${height} re B Q`,
//       );
//     } else {
//       commands.push(`q ${fill} rg ${x} ${y} ${width} ${height} re f Q`);
//     }
//   };

//   const drawMetric = ({
//     x,
//     y,
//     label,
//     value,
//     accent,
//     note,
//   }: {
//     x: number;
//     y: number;
//     label: string;
//     value: number;
//     accent: string;
//     note: string;
//   }) => {
//     rect(x, y, 241, 112, "0.984 0.988 0.996", "0.886 0.910 0.941");
//     rect(x, y, 6, 112, accent);
//     text(label.toUpperCase(), x + 20, y + 82, 9, "F2", "0.392 0.455 0.545");
//     text(formatPKR(value), x + 20, y + 48, 20, "F2");
//     text(note, x + 20, y + 22, 8.5, "F1", "0.392 0.455 0.545");
//   };

//   rect(0, 690, pageWidth, pageHeight - 690, "0.059 0.090 0.165");
//   text("FINANCIAL SNAPSHOT", 48, 790, 25, "F2", "1 1 1");
//   text(
//     "Quick summary of receivables, payables, profit and loss",
//     48,
//     762,
//     11,
//     "F1",
//     "0.797 0.835 0.882",
//   );
//   text(
//     `Generated: ${new Date().toLocaleString("en-PK")}`,
//     48,
//     728,
//     9,
//     "F1",
//     "0.797 0.835 0.882",
//   );
//   text(
//     `Prepared by: ${generatedBy} (${humanize(role)})`,
//     48,
//     710,
//     9,
//     "F1",
//     "0.797 0.835 0.882",
//   );

//   drawMetric({
//     x: 48,
//     y: 548,
//     label: "Total Receivable From Clients",
//     value: snapshot.totalReceivable,
//     accent: "0.231 0.510 0.965",
//     note: "Outstanding client invoice value",
//   });
//   drawMetric({
//     x: 306,
//     y: 548,
//     label: "Total Payable To Vendors",
//     value: snapshot.totalPayable,
//     accent: "0.961 0.620 0.043",
//     note: "Remaining approved vendor releases",
//   });
//   drawMetric({
//     x: 48,
//     y: 416,
//     label: "Overall Profit",
//     value: snapshot.overallProfit,
//     accent: "0.063 0.725 0.506",
//     note: "Positive recorded income less expenses",
//   });
//   drawMetric({
//     x: 306,
//     y: 416,
//     label: "Overall Loss",
//     value: snapshot.overallLoss,
//     accent: "0.957 0.247 0.369",
//     note: "Expense excess over recorded income",
//   });

//   const isProfit = snapshot.overallProfit > 0;
//   const isLoss = snapshot.overallLoss > 0;
//   const resultLabel = isProfit
//     ? "NET RESULT: PROFIT"
//     : isLoss
//       ? "NET RESULT: LOSS"
//       : "NET RESULT: BREAK EVEN";
//   const resultValue = isProfit
//     ? snapshot.overallProfit
//     : isLoss
//       ? snapshot.overallLoss
//       : 0;
//   const resultFill = isProfit
//     ? "0.925 0.992 0.961"
//     : isLoss
//       ? "1 0.945 0.949"
//       : "0.945 0.961 0.980";
//   const resultColor = isProfit
//     ? "0.018 0.498 0.349"
//     : isLoss
//       ? "0.745 0.078 0.165"
//       : "0.278 0.333 0.412";

//   rect(48, 304, 499, 82, resultFill);
//   text(resultLabel, 66, 356, 10, "F2", resultColor);
//   text(formatPKR(resultValue), 66, 326, 18, "F2", resultColor);
//   text(
//     `Recorded income: ${formatPKR(snapshot.totalIncome)}`,
//     300,
//     345,
//     8.5,
//     "F1",
//     "0.392 0.455 0.545",
//   );
//   text(
//     `Recorded expenses: ${formatPKR(snapshot.totalExpense)}`,
//     300,
//     325,
//     8.5,
//     "F1",
//     "0.392 0.455 0.545",
//   );

//   text("REPORT BASIS", 48, 250, 11, "F2");
//   commands.push("q 0.886 0.910 0.941 RG 0.8 w 48 240 m 547 240 l S Q");
//   text(
//     "Receivable = client invoice totals less recorded client payments.",
//     48,
//     216,
//     9,
//     "F1",
//     "0.278 0.333 0.412",
//   );
//   text(
//     "Payable = approved budget request value remaining for vendor release.",
//     48,
//     197,
//     9,
//     "F1",
//     "0.278 0.333 0.412",
//   );
//   text(
//     "Profit/Loss = recorded cash income less recorded expenses and releases.",
//     48,
//     178,
//     9,
//     "F1",
//     "0.278 0.333 0.412",
//   );
//   text(
//     "This snapshot is generated from live dashboard data at download time.",
//     48,
//     159,
//     9,
//     "F1",
//     "0.278 0.333 0.412",
//   );

//   commands.push("q 0.886 0.910 0.941 RG 0.8 w 48 78 m 547 78 l S Q");
//   text("IEDGE SYSTEM - CONFIDENTIAL FINANCIAL SUMMARY", 48, 56, 8, "F2", "0.392 0.455 0.545");
//   text("Page 1 of 1", 493, 56, 8, "F1", "0.392 0.455 0.545");

//   const streamData = `${commands.join("\n")}\n`;
//   const objects = [
//     "<< /Type /Catalog /Pages 2 0 R >>",
//     "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
//     "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
//     "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
//     "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
//     `<< /Length ${encoder.encode(streamData).length} >>\nstream\n${streamData}endstream`,
//   ];

//   let pdf = "%PDF-1.4\n% IEDGE Financial Snapshot\n";
//   const offsets: number[] = [0];

//   objects.forEach((object, index) => {
//     offsets[index + 1] = encoder.encode(pdf).length;
//     pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
//   });

//   const xrefOffset = encoder.encode(pdf).length;
//   pdf += `xref\n0 ${objects.length + 1}\n`;
//   pdf += "0000000000 65535 f \n";
//   offsets.slice(1).forEach((offset) => {
//     pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
//   });
//   pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
//   pdf += `startxref\n${xrefOffset}\n%%EOF`;

//   const blob = new Blob([encoder.encode(pdf)], { type: "application/pdf" });
//   const url = URL.createObjectURL(blob);
//   const link = document.createElement("a");
//   const stamp = new Date()
//     .toISOString()
//     .replace(/[:T]/g, "-")
//     .replace(/\.\d{3}Z$/, "");

//   link.href = url;
//   link.download = `financial-snapshot-${stamp}.pdf`;
//   document.body.appendChild(link);
//   link.click();
//   link.remove();
//   window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
// };

// const FULL_DASHBOARD_ROLES = new Set([
//   "main_admin",
//   "mainadmin",
//   "finance",
//   "finance_admin",
//   "financial_admin",
// ]);

// const SCOPE_FIELD_NAMES = [
//   "id",
//   "uid",
//   "userId",
//   "userUID",
//   "profileId",
//   "employeeId",
//   "employeeUID",
//   "email",
//   "userEmail",
//   "employeeEmail",
//   "displayName",
//   "fullName",
//   "name",
//   "createdBy",
//   "createdById",
//   "createdByUid",
//   "createdByEmail",
//   "creatorId",
//   "creatorEmail",
//   "submittedBy",
//   "submittedById",
//   "submittedByUid",
//   "submittedByEmail",
//   "requestedBy",
//   "requestedById",
//   "requestedByEmail",
//   "owner",
//   "ownerId",
//   "ownerEmail",
//   "assignedTo",
//   "assignedToId",
//   "assignedUserId",
//   "assignedUserEmail",
//   "assignee",
//   "assigneeId",
//   "assigneeEmail",
//   "personId",
//   "personEmail",
//   "salesPersonId",
//   "salesPersonEmail",
//   "teamMemberId",
//   "teamMemberEmail",
//   "department",
//   "departmentId",
//   "team",
//   "teamId",
//   "role",
//   "createdByRole",
//   "assignedRole",
//   "projectId",
//   "projectCode",
//   "assignedProjectId",
// ];

// const NESTED_SCOPE_FIELD_NAMES = [
//   "createdByUser",
//   "submittedByUser",
//   "requestedByUser",
//   "ownerUser",
//   "assignedUser",
//   "assigneeUser",
//   "employee",
//   "user",
//   "profile",
//   "teamMembers",
//   "assignedUsers",
//   "assignedToUsers",
//   "members",
//   "assignedProjects",
//   "projectIds",
//   "allowedProjectIds",
// ];

// const addScopeValue = (target: Set<string>, value: any) => {
//   if (value === null || value === undefined || value === "") return;

//   if (Array.isArray(value)) {
//     value.forEach((item) => addScopeValue(target, item));
//     return;
//   }

//   if (typeof value === "object") {
//     SCOPE_FIELD_NAMES.forEach((field) => addScopeValue(target, value?.[field]));
//     return;
//   }

//   const normalized = normalizeText(value);
//   if (normalized) target.add(normalized);
// };

// const collectScopeValues = (source: any): Set<string> => {
//   const values = new Set<string>();
//   if (!source) return values;

//   SCOPE_FIELD_NAMES.forEach((field) => addScopeValue(values, source?.[field]));
//   NESTED_SCOPE_FIELD_NAMES.forEach((field) =>
//     addScopeValue(values, source?.[field]),
//   );

//   return values;
// };

// const rowMatchesUserScope = (row: AnyRow, profile: any): boolean => {
//   const profileScope = collectScopeValues(profile);
//   if (profileScope.size === 0) return false;

//   const rowScope = collectScopeValues(row);
//   for (const value of rowScope) {
//     if (profileScope.has(value)) return true;
//   }

//   return false;
// };

// type RestrictedActivity = {
//   id: string;
//   module: string;
//   title: string;
//   description: string;
//   status: string;
//   date: Date | null;
// };

// const getRestrictedRoleConfig = (roleKey: string) => {
//   if (["operation", "operations", "operational_admin", "operation_admin"].includes(roleKey)) {
//     return {
//       title: "Operations Workspace",
//       description:
//         "Track the requests, estimates, expenses and reimbursements assigned to your operational scope.",
//       visibleModules: ["requests", "estimates", "expenses", "claims"],
//     };
//   }

//   if (["sales", "sales_admin", "business_development"].includes(roleKey)) {
//     return {
//       title: "Sales Workspace",
//       description:
//         "Track your estimates, client invoices, budget requests and submitted expenses without finance-level information.",
//       visibleModules: ["estimates", "invoices", "requests", "expenses"],
//     };
//   }

//   if (["creative", "creative_team", "design", "production"].includes(roleKey)) {
//     return {
//       title: "Creative Workspace",
//       description:
//         "View your assigned requests, submitted expenses, reimbursement claims and recent workflow updates.",
//       visibleModules: ["requests", "expenses", "claims", "activity"],
//     };
//   }

//   return {
//     title: "My Workspace",
//     description:
//       "View only the operational records assigned to your account, team, department or projects.",
//     visibleModules: ["requests", "estimates", "expenses", "claims"],
//   };
// };

// function RestrictedDashboard({
//   userProfile,
//   roleKey,
//   data,
//   refreshing,
//   lastUpdated,
//   unavailableModules,
//   canCreateInvoices,
//   canDownloadSnapshot,
//   snapshotGenerating,
//   onRefresh,
//   onCreateBudgetRequest,
//   onDownloadSnapshot,
// }: {
//   userProfile: any;
//   roleKey: string;
//   data: DashboardData;
//   refreshing: boolean;
//   lastUpdated: Date | null;
//   unavailableModules: string[];
//   canCreateInvoices: boolean;
//   canDownloadSnapshot: boolean;
//   snapshotGenerating: boolean;
//   onRefresh: () => void;
//   onCreateBudgetRequest: () => void;
//   onDownloadSnapshot: () => void;
// }) {
//   const config = getRestrictedRoleConfig(roleKey);

//   const dashboard = useMemo(() => {
//     const requestsPending = data.invoiceRequests.filter((request) => {
//       const status = normalizeText(request?.status);
//       return ![
//         "approved",
//         "rejected",
//         "returned_to_creator",
//         "changes_requested",
//         "payment_released",
//         "released",
//         "completed",
//       ].includes(status);
//     }).length;

//     const requestsReturned = data.invoiceRequests.filter((request) =>
//       ["rejected", "returned_to_creator", "changes_requested"].includes(
//         normalizeText(request?.status),
//       ),
//     ).length;

//     const requestsCompleted = data.invoiceRequests.filter((request) =>
//       [
//         "approved",
//         "payment_released",
//         "released",
//         "completed",
//         "paid",
//       ].includes(normalizeText(request?.status)),
//     ).length;

//     const claims = [...data.directClaims, ...data.meetingClaims];
//     const pendingClaims = claims.filter(
//       (claim) => getClaimStatus(claim) === "pending",
//     ).length;

//     const activities: RestrictedActivity[] = [
//       ...data.invoiceRequests.map((request) => ({
//         id: `request-${request.id}`,
//         module: "Budget Request",
//         title: firstText(
//           request?.requestId,
//           request?.title,
//           request?.subject,
//           "Budget request",
//         ),
//         description: firstText(
//           request?.projectName,
//           request?.project,
//           request?.clientName,
//           "Workflow updated",
//         ),
//         status: request?.status || "submitted",
//         date: getRequestDate(request),
//       })),
//       ...data.estimates.map((estimate) => ({
//         id: `estimate-${estimate.id}`,
//         module: "Estimate",
//         title: firstText(
//           estimate?.estimateNo,
//           estimate?.title,
//           estimate?.subject,
//           "Estimate",
//         ),
//         description: firstText(
//           estimate?.projectName,
//           estimate?.clientName,
//           estimate?.client,
//           "Estimate updated",
//         ),
//         status: estimate?.status || "draft",
//         date: getEntityDate(estimate),
//       })),
//       ...data.estimateInvoices.map((invoice) => ({
//         id: `invoice-${invoice.id}`,
//         module: "Client Invoice",
//         title: firstText(invoice?.invoiceNo, invoice?.subject, "Invoice"),
//         description: firstText(
//           invoice?.projectName,
//           invoice?.clientName,
//           invoice?.client,
//           "Invoice updated",
//         ),
//         status: invoice?.status || invoice?.paymentStatus || "unpaid",
//         date: getEntityDate(invoice),
//       })),
//       ...data.expenseSheets.map((expense) => ({
//         id: `expense-${expense.id}`,
//         module: "Expense Sheet",
//         title: firstText(
//           expense?.expenseId,
//           expense?.title,
//           expense?.projectName,
//           "Expense sheet",
//         ),
//         description: firstText(
//           expense?.projectName,
//           expense?.project,
//           expense?.clientName,
//           "Expense submitted",
//         ),
//         status: expense?.status || expense?.paymentStatus || "submitted",
//         date: getEntityDate(expense),
//       })),
//       ...claims.map((claim) => ({
//         id: `claim-${claim.id}`,
//         module: "Reimbursement",
//         title: firstText(
//           claim?.description,
//           claim?.foodItem,
//           claim?.claimType,
//           "Reimbursement claim",
//         ),
//         description: firstText(
//           claim?.projectName,
//           claim?.meetingTitle,
//           "Claim updated",
//         ),
//         status:
//           normalizeText(claim?.paymentStatus) === "paid"
//             ? "paid"
//             : claim?.status || claim?.approvalStatus || "pending",
//         date: getEntityDate(claim),
//       })),
//     ]
//       .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))
//       .slice(0, 10);

//     return {
//       requestsPending,
//       requestsReturned,
//       requestsCompleted,
//       pendingClaims,
//       activities,
//       totalWorkspaceRecords:
//         data.invoiceRequests.length +
//         data.estimates.length +
//         data.estimateInvoices.length +
//         data.expenseSheets.length +
//         claims.length,
//       claimsCount: claims.length,
//     };
//   }, [data]);

//   const moduleCards = [
//     {
//       key: "requests",
//       title: "My Budget Requests",
//       subtitle: "Requests created by or assigned to your user scope.",
//       icon: FileText,
//       items: [
//         { label: "Total", value: String(data.invoiceRequests.length) },
//         { label: "In Progress", value: String(dashboard.requestsPending) },
//         { label: "Returned", value: String(dashboard.requestsReturned), className: "text-rose-600" },
//         { label: "Completed", value: String(dashboard.requestsCompleted), className: "text-emerald-600" },
//       ],
//     },
//     {
//       key: "estimates",
//       title: "My Estimates",
//       subtitle: "Estimates assigned to your account, team or projects.",
//       icon: FileSpreadsheet,
//       items: [
//         { label: "Total", value: String(data.estimates.length) },
//         { label: "Approved", value: String(data.estimates.filter((item) => normalizeText(item?.status) === "approved").length), className: "text-emerald-600" },
//         { label: "Invoiced", value: String(data.estimates.filter((item) => ["invoiced", "payment received"].includes(normalizeText(item?.status))).length), className: "text-blue-600" },
//         { label: "Other", value: String(data.estimates.filter((item) => !["approved", "invoiced", "payment received"].includes(normalizeText(item?.status))).length) },
//       ],
//     },
//     {
//       key: "invoices",
//       title: "My Client Invoices",
//       subtitle: "Invoice workflow status without financial totals.",
//       icon: ReceiptText,
//       items: [
//         { label: "Total", value: String(data.estimateInvoices.length) },
//         { label: "Paid", value: String(data.estimateInvoices.filter((item) => getInvoiceStatus(item) === "paid").length), className: "text-emerald-600" },
//         { label: "Partial", value: String(data.estimateInvoices.filter((item) => getInvoiceStatus(item) === "partial").length), className: "text-blue-600" },
//         { label: "Unpaid", value: String(data.estimateInvoices.filter((item) => getInvoiceStatus(item) === "unpaid").length), className: "text-amber-600" },
//       ],
//     },
//     {
//       key: "expenses",
//       title: "My Expense Sheets",
//       subtitle: "Expense sheets submitted by or assigned to you.",
//       icon: CreditCard,
//       items: [
//         { label: "Total", value: String(data.expenseSheets.length) },
//         { label: "Pending", value: String(data.expenseSheets.filter((item) => normalizeText(item?.status || item?.paymentStatus).includes("pending")).length), className: "text-amber-600" },
//         { label: "Approved", value: String(data.expenseSheets.filter((item) => normalizeText(item?.status || item?.paymentStatus).includes("approved")).length), className: "text-emerald-600" },
//         { label: "Other", value: String(data.expenseSheets.filter((item) => !normalizeText(item?.status || item?.paymentStatus).includes("pending") && !normalizeText(item?.status || item?.paymentStatus).includes("approved")).length) },
//       ],
//     },
//     {
//       key: "claims",
//       title: "My Reimbursements",
//       subtitle: "Your submitted and assigned reimbursement claims.",
//       icon: Users,
//       items: [
//         { label: "Total", value: String(dashboard.claimsCount) },
//         { label: "Pending", value: String(dashboard.pendingClaims), className: "text-amber-600" },
//         { label: "Approved", value: String([...data.directClaims, ...data.meetingClaims].filter((item) => getClaimStatus(item) === "approved").length), className: "text-emerald-600" },
//         { label: "Rejected", value: String([...data.directClaims, ...data.meetingClaims].filter((item) => getClaimStatus(item) === "rejected").length), className: "text-rose-600" },
//       ],
//     },
//     {
//       key: "activity",
//       title: "Workflow Activity",
//       subtitle: "Recent updates visible inside your role scope.",
//       icon: Activity,
//       items: [
//         { label: "Recent Updates", value: String(dashboard.activities.length) },
//         { label: "Workspace Records", value: String(dashboard.totalWorkspaceRecords) },
//         { label: "Pending Requests", value: String(dashboard.requestsPending), className: "text-amber-600" },
//         { label: "Returned Requests", value: String(dashboard.requestsReturned), className: "text-rose-600" },
//       ],
//     },
//   ].filter((card) => config.visibleModules.includes(card.key));

//   return (
//     <div className="min-h-screen bg-slate-50/80 p-4 text-slate-900 sm:p-6">
//       <div className="mx-auto space-y-6">
//         <section className="overflow-hidden rounded-[32px] bg-slate-950 p-6 text-white shadow-xl shadow-slate-200/70 sm:p-8">
//           <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
//             <div>
//               <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">
//                 <BadgeCheck className="h-3.5 w-3.5" />
//                 Role-Based Access
//               </div>

//               <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
//                 {config.title}
//               </h1>
//               <p className="mt-2 text-lg font-bold text-white">
//                 Welcome back, {userProfile?.displayName || userProfile?.name || "Team Member"}
//               </p>
//               <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
//                 {config.description}
//               </p>

//               <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-300">
//                 <span className="rounded-full bg-white/10 px-3 py-1.5 font-semibold">
//                   Role: {humanize(userProfile?.role || "User")}
//                 </span>
//                 <span className="rounded-full bg-white/10 px-3 py-1.5 font-semibold">
//                   Updated: {lastUpdated ? formatRelativeTime(lastUpdated) : "Now"}
//                 </span>
//                 <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 font-semibold text-emerald-200">
//                   Restricted financial access
//                 </span>
//               </div>
//             </div>

//             <div className="flex flex-wrap gap-2">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={onRefresh}
//                 disabled={refreshing}
//                 className="h-11 rounded-2xl border-white/15 bg-white/10 px-4 text-white hover:bg-white/15 hover:text-white"
//               >
//                 <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
//                 {refreshing ? "Refreshing" : "Refresh"}
//               </Button>

//               {canDownloadSnapshot && (
//                 <Button
//                   type="button"
//                   onClick={onDownloadSnapshot}
//                   disabled={snapshotGenerating}
//                   className="h-11 rounded-2xl bg-emerald-500 px-4 font-bold text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
//                 >
//                   <Download className="mr-2 h-4 w-4" />
//                   {snapshotGenerating ? "Generating..." : "Snapshot"}
//                 </Button>
//               )}

//               {canCreateInvoices && (
//                 <Button
//                   type="button"
//                   onClick={onCreateBudgetRequest}
//                   className="h-11 rounded-2xl bg-white px-4 font-bold text-slate-950 hover:bg-slate-100"
//                 >
//                   <Plus className="mr-2 h-4 w-4" />
//                   New Budget Request
//                 </Button>
//               )}
//             </div>
//           </div>

//           <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
//             <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
//               <p className="text-xs font-semibold text-slate-300">Workspace Records</p>
//               <p className="mt-2 text-2xl font-black">{dashboard.totalWorkspaceRecords}</p>
//             </div>
//             <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
//               <p className="text-xs font-semibold text-slate-300">Requests In Progress</p>
//               <p className="mt-2 text-2xl font-black">{dashboard.requestsPending}</p>
//             </div>
//             <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
//               <p className="text-xs font-semibold text-slate-300">Returned Requests</p>
//               <p className="mt-2 text-2xl font-black">{dashboard.requestsReturned}</p>
//             </div>
//             <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
//               <p className="text-xs font-semibold text-slate-300">Pending Claims</p>
//               <p className="mt-2 text-2xl font-black">{dashboard.pendingClaims}</p>
//             </div>
//           </div>
//         </section>

//         {unavailableModules.length > 0 && (
//           <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
//             <div className="flex items-start gap-3">
//               <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
//               <div>
//                 <p className="font-bold">Some role-scoped modules are unavailable.</p>
//                 <p className="mt-1 text-xs leading-5">
//                   Your available workspace data is still displayed. Check the matching Firestore role rules for: {unavailableModules.join(", ")}.
//                 </p>
//               </div>
//             </div>
//           </div>
//         )}

//         <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
//           <MetricCard
//             title="My Requests"
//             value={String(data.invoiceRequests.length)}
//             subtitle="Only requests inside your role scope"
//             icon={FileText}
//             tone="blue"
//           />
//           <MetricCard
//             title="Waiting For Review"
//             value={String(dashboard.requestsPending)}
//             subtitle="Requests still moving through workflow"
//             icon={Clock3}
//             tone="amber"
//           />
//           <MetricCard
//             title="Completed"
//             value={String(dashboard.requestsCompleted)}
//             subtitle="Approved or completed requests"
//             icon={CheckCircle2}
//             tone="emerald"
//           />
//           <MetricCard
//             title="Needs Attention"
//             value={String(dashboard.requestsReturned + dashboard.pendingClaims)}
//             subtitle="Returned requests and pending claims"
//             icon={AlertTriangle}
//             tone="rose"
//           />
//         </section>

//         <section>
//           <div className="mb-4">
//             <h2 className="text-xl font-black text-slate-950">Role-Specific Modules</h2>
//             <p className="mt-1 text-sm text-slate-500">
//               Financial balances, payment releases, cheque records, vendor exposure and administrative reports are hidden for this role.
//             </p>
//           </div>

//           {/* <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
//             {moduleCards.map((card) => (
//               <ModuleCard key={card.key} {...card} />
//             ))}
//           </div> */}
//         </section>

//         <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//           <CardContent className="p-5 sm:p-6">
//             <div className="flex items-start justify-between gap-4">
//               <div>
//                 <h2 className="text-lg font-black text-slate-950">My Recent Activity</h2>
//                 <p className="mt-1 text-xs text-slate-500">
//                   Recent workflow updates matched to your user, team, department or assigned projects.
//                 </p>
//               </div>
//               <Activity className="h-5 w-5 text-slate-400" />
//             </div>

//             <div className="mt-5 divide-y divide-slate-100">
//               {dashboard.activities.length === 0 ? (
//                 <div className="py-12 text-center">
//                   <CalendarClock className="mx-auto h-7 w-7 text-slate-300" />
//                   <p className="mt-3 text-sm font-semibold text-slate-500">
//                     No role-scoped activity was found.
//                   </p>
//                   <p className="mt-1 text-xs text-slate-400">
//                     Make sure your records contain a matching user, team, department or project identifier.
//                   </p>
//                 </div>
//               ) : (
//                 dashboard.activities.map((activity) => (
//                   <div key={activity.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
//                     <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
//                       <Activity className="h-4 w-4" />
//                     </div>
//                     <div className="min-w-0 flex-1">
//                       <div className="flex flex-wrap items-center gap-2">
//                         <p className="truncate text-sm font-black text-slate-900">{activity.title}</p>
//                         <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{activity.module}</span>
//                       </div>
//                       <p className="mt-1 truncate text-xs text-slate-500">{activity.description}</p>
//                     </div>
//                     <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
//                       <StatusBadge status={activity.status} />
//                       <span className="text-[11px] font-semibold text-slate-400">{formatRelativeTime(activity.date)}</span>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }

// function MetricCard({
//   title,
//   value,
//   subtitle,
//   icon: Icon,
//   tone = "slate",
//   trend,
// }: {
//   title: string;
//   value: string;
//   subtitle: string;
//   icon: LucideIcon;
//   tone?: "slate" | "emerald" | "blue" | "amber" | "rose" | "violet";
//   trend?: "up" | "down";
// }) {
//   const toneClasses = {
//     slate: "bg-slate-100 text-slate-700",
//     emerald: "bg-emerald-50 text-emerald-700",
//     blue: "bg-blue-50 text-blue-700",
//     amber: "bg-amber-50 text-amber-700",
//     rose: "bg-rose-50 text-rose-700",
//     violet: "bg-violet-50 text-violet-700",
//   };

//   return (
//     <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm">
//       <CardContent className="p-5">
//         <div className="flex items-start justify-between gap-4">
//           <div className="min-w-0">
//             <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
//               {title}
//             </p>
//             <p className="mt-3 truncate text-2xl font-black tracking-tight text-slate-950 xl:text-3xl">
//               {value}
//             </p>
//           </div>

//           <div
//             className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${toneClasses[tone]}`}
//           >
//             <Icon className="h-5 w-5" />
//           </div>
//         </div>

//         <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
//           {trend === "up" && <ArrowUpRight className="h-4 w-4 text-emerald-600" />}
//           {trend === "down" && <ArrowDownRight className="h-4 w-4 text-rose-600" />}
//           <p className="truncate text-xs font-medium text-slate-500">
//             {subtitle}
//           </p>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

// function AlertCard({
//   title,
//   value,
//   description,
//   icon,
//   tone,
// }: {
//   title: string;
//   value: string;
//   description: string;
//   icon: ReactNode;
//   tone: "amber" | "blue" | "rose" | "emerald";
// }) {
//   const classes = {
//     amber: "border-amber-200 bg-amber-50/70 text-amber-800",
//     blue: "border-blue-200 bg-blue-50/70 text-blue-800",
//     rose: "border-rose-200 bg-rose-50/70 text-rose-800",
//     emerald: "border-emerald-200 bg-emerald-50/70 text-emerald-800",
//   };

//   return (
//     <div className={`rounded-2xl border p-4 ${classes[tone]}`}>
//       <div className="flex items-start justify-between gap-3">
//         <div>
//           <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">
//             {title}
//           </p>
//           <p className="mt-2 text-2xl font-black">{value}</p>
//           <p className="mt-1 text-xs font-medium leading-5 opacity-75">
//             {description}
//           </p>
//         </div>
//         <div className="rounded-xl bg-white/70 p-2.5 shadow-sm">{icon}</div>
//       </div>
//     </div>
//   );
// }

// function ModuleCard({
//   title,
//   subtitle,
//   icon: Icon,
//   items,
// }: {
//   title: string;
//   subtitle: string;
//   icon: LucideIcon;
//   items: Array<{ label: string; value: string; className?: string }>;
// }) {
//   return (
//     <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//       <CardContent className="p-5">
//         <div className="flex items-start justify-between gap-3">
//           <div>
//             <h3 className="font-black text-slate-950">{title}</h3>
//             <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>
//           </div>
//           <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
//             <Icon className="h-5 w-5" />
//           </div>
//         </div>

//         <div className="mt-5 space-y-3">
//           {items.map((item) => (
//             <div
//               key={item.label}
//               className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
//             >
//               <span className="text-sm font-medium text-slate-500">
//                 {item.label}
//               </span>
//               <span
//                 className={`text-sm font-black text-slate-950 ${item.className || ""}`}
//               >
//                 {item.value}
//               </span>
//             </div>
//           ))}
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

// function StatusBadge({ status }: { status: string }) {
//   const normalized = normalizeText(status);

//   const classes = normalized.includes("partial")
//     ? "border-blue-200 bg-blue-50 text-blue-700"
//     : normalized.includes("paid") ||
//         normalized.includes("approved") ||
//         normalized.includes("released")
//       ? "border-emerald-200 bg-emerald-50 text-emerald-700"
//       : normalized.includes("reject") || normalized.includes("cancel")
//         ? "border-rose-200 bg-rose-50 text-rose-700"
//         : normalized.includes("pending") ||
//             normalized.includes("unpaid") ||
//             normalized.includes("open")
//           ? "border-amber-200 bg-amber-50 text-amber-700"
//           : "border-slate-200 bg-slate-50 text-slate-600";

//   return (
//     <span
//       className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${classes}`}
//     >
//       {humanize(status)}
//     </span>
//   );
// }

// export default function Dashboard() {
//   const { userProfile } = useAuth();

//   const roleKey = normalizeText(userProfile?.role).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
//   const hasFullDashboardAccess = FULL_DASHBOARD_ROLES.has(roleKey);
//   const canDownloadSnapshot = SNAPSHOT_ROLES.has(roleKey);
//   const canCreateInvoices = [
//     "operation",
//     "operations",
//     "operational_admin",
//     "operation_admin",
//     "creative",
//     "sales",
//   ].includes(roleKey);

//   const [data, setData] = useState<DashboardData>(EMPTY_DATA);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
//   const [unavailableModules, setUnavailableModules] = useState<string[]>([]);
//   const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
//   const [snapshotGenerating, setSnapshotGenerating] = useState(false);

//   const handleDownloadSnapshot = useCallback(async () => {
//     if (!canDownloadSnapshot || snapshotGenerating) return;

//     setSnapshotGenerating(true);

//     try {
//       const source = hasFullDashboardAccess
//         ? data
//         : await loadFinancialSnapshotSourceData();
//       const snapshot = buildFinancialSnapshot(source);

//       downloadFinancialSnapshotPdf({
//         snapshot,
//         generatedBy: firstText(
//           userProfile?.displayName,
//           userProfile?.role,
//           userProfile?.email,
//           "Authorized User",
//         ),
//         role: userProfile?.role || roleKey,
//       });
//     } catch (error) {
//       console.error("Failed to generate financial snapshot:", error);
//       window.alert(
//         "The financial snapshot could not be generated. Please check Firestore permissions for invoices, payments, budget requests, claims, records and manual statement entries.",
//       );
//     } finally {
//       setSnapshotGenerating(false);
//     }
//   }, [
//     canDownloadSnapshot,
//     data,
//     hasFullDashboardAccess,
//     roleKey,
//     snapshotGenerating,
//     userProfile,
//   ]);

//   const loadDashboardData = useCallback(async (silent = false) => {
//     if (silent) setRefreshing(true);
//     else setLoading(true);

//     const unavailable = new Set<string>();

//     const readCollection = async (
//       path: string[],
//       label: string,
//     ): Promise<AnyRow[]> => {
//       try {
//         const snapshot = await getDocs(
//           collection(db, path[0], ...path.slice(1)),
//         );
//         return snapshotToRows(snapshot as any);
//       } catch (error) {
//         console.warn(`Dashboard could not read ${label}:`, error);
//         unavailable.add(label);
//         return [];
//       }
//     };

//     const restrictToCurrentScope = (rows: AnyRow[]) =>
//       rows.filter((row) => rowMatchesUserScope(row, userProfile));

//     try {
//       if (!hasFullDashboardAccess) {
//         const [
//           invoiceRequests,
//           estimates,
//           estimateInvoices,
//           expenseSheets,
//           directClaims,
//         ] = await Promise.all([
//           readCollection(["Panels", PANEL_ID, "invoiceRequests"], "Budget Requests"),
//           readCollection(["Panels", PANEL_ID, "estimates"], "Estimates"),
//           readCollection(
//             ["Panels", PANEL_ID, "estimateInvoices"],
//             "Estimate Invoices",
//           ),
//           readCollection(["Panels", PANEL_ID, "expenseSheets"], "Budget Expenses"),
//           readCollection(
//             ["Panels", PANEL_ID, "claimReimbursements"],
//             "Reimbursements",
//           ),
//         ]);

//         setData({
//           ...EMPTY_DATA,
//           invoiceRequests: restrictToCurrentScope(invoiceRequests),
//           estimates: restrictToCurrentScope(estimates),
//           estimateInvoices: restrictToCurrentScope(estimateInvoices),
//           expenseSheets: restrictToCurrentScope(expenseSheets),
//           directClaims: restrictToCurrentScope(directClaims),
//         });

//         setUnavailableModules(Array.from(unavailable));
//         setLastUpdated(new Date());
//         return;
//       }

//       const [
//         invoiceRequests,
//         estimates,
//         estimateInvoices,
//         payments,
//         expenseSheets,
//         directClaims,
//         records,
//         poRows,
//         purchaseOrderRows,
//         manualEntries,
//       ] = await Promise.all([
//         readCollection(["Panels", PANEL_ID, "invoiceRequests"], "Budget Requests"),
//         readCollection(["Panels", PANEL_ID, "estimates"], "Estimates"),
//         readCollection(
//           ["Panels", PANEL_ID, "estimateInvoices"],
//           "Estimate Invoices",
//         ),
//         readCollection(["Panels", PANEL_ID, "payments"], "Payments"),
//         readCollection(["Panels", PANEL_ID, "expenseSheets"], "Budget Expenses"),
//         readCollection(
//           ["Panels", PANEL_ID, "claimReimbursements"],
//           "Reimbursements",
//         ),
//         readCollection(["Panels", PANEL_ID, "Record"], "Records"),
//         readCollection(["Panels", PANEL_ID, "PO"], "Purchase Orders"),
//         readCollection(
//           ["Panels", PANEL_ID, "purchaseOrders"],
//           "Legacy Purchase Orders",
//         ),
//         readCollection(
//           ["Panels", PANEL_ID, "accountStatementManualEntries"],
//           "Manual Statement Entries",
//         ),
//       ]);

//       let openingBalance = 0;
//       try {
//         const settingsSnapshot = await getDoc(
//           doc(
//             db,
//             "Panels",
//             PANEL_ID,
//             "accountStatementSettings",
//             "main",
//           ),
//         );

//         openingBalance = settingsSnapshot.exists()
//           ? safeNumber(settingsSnapshot.data()?.openingBalance)
//           : 0;
//       } catch (error) {
//         console.warn("Dashboard could not read Account Statement settings:", error);
//         unavailable.add("Account Statement Settings");
//       }

//       let meetingClaims: AnyRow[] = [];
//       try {
//         const meetingSnapshot = await getDocs(collectionGroup(db, "meetingUpdates"));

//         meetingClaims = meetingSnapshot.docs
//           .map((meetingDocument) => ({
//             id: meetingDocument.id,
//             path: meetingDocument.ref.path,
//             ...meetingDocument.data(),
//           }))
//           .filter((meeting: any) => meeting?.reimbursement?.enabled)
//           .map((meeting: any) => ({
//             id: meeting.id,
//             path: meeting.path,
//             ...meeting.reimbursement,
//             personName:
//               meeting.reimbursement?.approvalSubmittedByName ||
//               meeting.reimbursement?.personName ||
//               meeting.personName ||
//               "Unknown",
//             submittedAt:
//               meeting.reimbursement?.approvalSubmittedAt ||
//               meeting.reimbursement?.submittedAt ||
//               meeting.submittedAt ||
//               meeting.createdAt ||
//               null,
//             meetingUpdatedAt: meeting.updatedAt || null,
//           }));
//       } catch (error) {
//         console.warn("Dashboard could not read nested reimbursements:", error);
//         unavailable.add("Nested Reimbursements");
//       }

//       const poMap = new Map<string, AnyRow>();
//       [...poRows, ...purchaseOrderRows].forEach((purchaseOrder) => {
//         const key = firstText(
//           purchaseOrder?.poNumber,
//           purchaseOrder?.purchaseOrderNumber,
//           purchaseOrder?.id,
//         );

//         if (!poMap.has(key)) poMap.set(key, purchaseOrder);
//       });

//       setData({
//         invoiceRequests,
//         estimates,
//         estimateInvoices,
//         payments,
//         expenseSheets,
//         directClaims,
//         meetingClaims,
//         records,
//         purchaseOrders: Array.from(poMap.values()),
//         manualEntries,
//         openingBalance,
//       });

//       setUnavailableModules(Array.from(unavailable));
//       setLastUpdated(new Date());
//     } catch (error) {
//       console.error("Failed to load dashboard data:", error);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, [hasFullDashboardAccess, userProfile]);

//   useEffect(() => {
//     loadDashboardData();
//   }, [loadDashboardData]);

//   useEffect(() => {
//     const watchedCollections = hasFullDashboardAccess
//       ? [
//           "invoiceRequests",
//           "estimates",
//           "estimateInvoices",
//           "payments",
//           "expenseSheets",
//           "claimReimbursements",
//           "Record",
//           "PO",
//           "purchaseOrders",
//           "accountStatementManualEntries",
//         ]
//       : [
//           "invoiceRequests",
//           "estimates",
//           "estimateInvoices",
//           "expenseSheets",
//           "claimReimbursements",
//         ];

//     let refreshTimer: ReturnType<typeof setTimeout> | null = null;
//     const initialSnapshots = new Set<string>();

//     const unsubscribers = watchedCollections.map((collectionName) =>
//       onSnapshot(
//         collection(db, "Panels", PANEL_ID, collectionName),
//         () => {
//           if (!initialSnapshots.has(collectionName)) {
//             initialSnapshots.add(collectionName);
//             return;
//           }

//           if (refreshTimer) clearTimeout(refreshTimer);
//           refreshTimer = setTimeout(() => loadDashboardData(true), 700);
//         },
//         (error) => {
//           console.warn(`Dashboard listener failed for ${collectionName}:`, error);
//         },
//       ),
//     );

//     return () => {
//       if (refreshTimer) clearTimeout(refreshTimer);
//       unsubscribers.forEach((unsubscribe) => unsubscribe());
//     };
//   }, [hasFullDashboardAccess, loadDashboardData]);

//   const summary = useMemo(() => {
//     const now = new Date();
//     const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

//     const incomeEvents: MoneyEvent[] = [];
//     const expenseEvents: MoneyEvent[] = [];

//     data.payments.forEach((payment) => {
//       const amount = safeNumber(payment?.amount);
//       const date =
//         toDate(payment?.paymentDate) ||
//         toDate(payment?.createdAt) ||
//         toDate(payment?.updatedAt);

//       if (amount > 0) incomeEvents.push({ amount, date });

//       const taxDebit =
//         safeNumber(payment?.whtAmount) + safeNumber(payment?.sstAmount);
//       if (taxDebit > 0) expenseEvents.push({ amount: taxDebit, date });
//     });

//     data.invoiceRequests.forEach((request) => {
//       const history = getPaymentReleaseHistory(request);

//       if (history.length > 0) {
//         history.forEach((release) => {
//           const amount = getReleaseAmount(release);
//           if (amount <= 0) return;

//           expenseEvents.push({
//             amount,
//             date:
//               toDate(release?.releasedAt) ||
//               toDate(release?.createdAt) ||
//               getEntityDate(request),
//           });
//         });
//       } else {
//         const releasedAmount = getReleasedRequestAmount(request);
//         if (releasedAmount > 0) {
//           expenseEvents.push({
//             amount: releasedAmount,
//             date: getEntityDate(request),
//           });
//         }
//       }
//     });

//     data.directClaims.forEach((claim) => {
//       const paidAmount = getClaimPaidAmount(claim);
//       if (paidAmount > 0) {
//         expenseEvents.push({
//           amount: paidAmount,
//           date:
//             toDate(claim?.paymentReleasedAt) ||
//             toDate(claim?.updatedAt) ||
//             getEntityDate(claim),
//         });
//       }
//     });

//     data.meetingClaims.forEach((claim) => {
//       const paidAmount = getClaimPaidAmount(claim);
//       if (paidAmount > 0) {
//         expenseEvents.push({
//           amount: paidAmount,
//           date:
//             toDate(claim?.paymentReleasedAt) ||
//             toDate(claim?.updatedAt) ||
//             toDate(claim?.meetingUpdatedAt) ||
//             getEntityDate(claim),
//         });
//       }
//     });

//     data.records.forEach((record) => {
//       const chequeAmount = safeNumber(record?.chequeAmount);
//       if (chequeAmount > 0) {
//         expenseEvents.push({
//           amount: chequeAmount,
//           date: getEntityDate(record),
//         });
//       }
//     });

//     data.manualEntries.forEach((entry) => {
//       const date = toDate(entry?.date) || getEntityDate(entry);
//       const debit = safeNumber(entry?.debit);
//       const credit = safeNumber(entry?.credit);

//       if (debit > 0) expenseEvents.push({ amount: debit, date });
//       if (credit > 0) incomeEvents.push({ amount: credit, date });
//     });

//     const totalIncome = incomeEvents.reduce((sum, item) => sum + item.amount, 0);
//     const totalExpense = expenseEvents.reduce(
//       (sum, item) => sum + item.amount,
//       0,
//     );
//     const balance = data.openingBalance + totalIncome - totalExpense;

//     const monthIncome = incomeEvents
//       .filter((item) => item.date && item.date >= monthStart)
//       .reduce((sum, item) => sum + item.amount, 0);

//     const monthExpense = expenseEvents
//       .filter((item) => item.date && item.date >= monthStart)
//       .reduce((sum, item) => sum + item.amount, 0);

//     const budgetTotalAmount = data.invoiceRequests.reduce(
//       (sum, request) => sum + getApprovedRequestAmount(request),
//       0,
//     );
//     const budgetReleasedAmount = data.invoiceRequests.reduce(
//       (sum, request) => sum + getReleasedRequestAmount(request),
//       0,
//     );
//     const budgetRemainingAmount = data.invoiceRequests.reduce(
//       (sum, request) => sum + getRemainingRequestAmount(request),
//       0,
//     );

//     const budgetPendingAdmin = data.invoiceRequests.filter((request) =>
//       [
//         "pending_operational_admin",
//         "pending_main_admin",
//         "pending_admin",
//       ].includes(normalizeText(request?.status)),
//     ).length;

//     const budgetPendingFinance = data.invoiceRequests.filter(
//       (request) => normalizeText(request?.status) === "pending_finance",
//     ).length;

//     const budgetReadyForPayment = data.invoiceRequests.filter((request) => {
//       const status = normalizeText(request?.status);
//       return (
//         [
//           "approved",
//           "po_created",
//           "po_submitted",
//           "po_approved",
//           "po_issued",
//           "ready_for_payment",
//           "payment_partially_released",
//         ].includes(status) && !isFullyReleased(request)
//       );
//     }).length;

//     const budgetPartial = data.invoiceRequests.filter(isPartiallyReleased).length;
//     const budgetReleased = data.invoiceRequests.filter(isFullyReleased).length;
//     const budgetRejected = data.invoiceRequests.filter((request) =>
//       ["rejected", "returned_to_creator", "changes_requested"].includes(
//         normalizeText(request?.status),
//       ),
//     ).length;

//     const estimateTotalAmount = data.estimates.reduce(
//       (sum, estimate) => sum + getEstimateAmount(estimate),
//       0,
//     );

//     const estimateApproved = data.estimates.filter(
//       (estimate) => normalizeText(estimate?.status) === "approved",
//     ).length;

//     const estimateInvoiced = data.estimates.filter((estimate) =>
//       ["invoiced", "payment received"].includes(
//         normalizeText(estimate?.status),
//       ),
//     ).length;

//     const invoiceTotalAmount = data.estimateInvoices.reduce(
//       (sum, invoice) => sum + getEstimateInvoiceAmount(invoice),
//       0,
//     );

//     const paidInvoices = data.estimateInvoices.filter(
//       (invoice) => getInvoiceStatus(invoice) === "paid",
//     );
//     const partialInvoices = data.estimateInvoices.filter(
//       (invoice) => getInvoiceStatus(invoice) === "partial",
//     );
//     const unpaidInvoices = data.estimateInvoices.filter(
//       (invoice) => getInvoiceStatus(invoice) === "unpaid",
//     );

//     const paidInvoiceAmount = paidInvoices.reduce(
//       (sum, invoice) => sum + getEstimateInvoiceAmount(invoice),
//       0,
//     );

//     const receivedInvoiceAmount = data.payments.reduce(
//       (sum, payment) => sum + safeNumber(payment?.amount),
//       0,
//     );

//     const invoiceOutstanding = Math.max(
//       invoiceTotalAmount - receivedInvoiceAmount,
//       0,
//     );

//     const poTotalAmount = data.purchaseOrders.reduce(
//       (sum, purchaseOrder) => sum + getPurchaseOrderAmount(purchaseOrder),
//       0,
//     );

//     const poPaid = data.purchaseOrders.filter(
//       (purchaseOrder) => normalizeText(purchaseOrder?.status) === "paid",
//     ).length;

//     const poOpen = data.purchaseOrders.filter((purchaseOrder) =>
//       ["open", "draft"].includes(normalizeText(purchaseOrder?.status)),
//     ).length;

//     const poOverdue = data.purchaseOrders.filter((purchaseOrder) => {
//       const status = normalizeText(purchaseOrder?.status);
//       return (
//         !["paid", "cancelled"].includes(status) &&
//         (status === "over due" ||
//           status === "overdue" ||
//           isOverdueDate(purchaseOrder?.dueDate))
//       );
//     }).length;

//     const expenseSheetAmount = data.expenseSheets.reduce(
//       (sum, expense) => sum + getExpenseAmount(expense),
//       0,
//     );

//     const allClaims = [...data.directClaims, ...data.meetingClaims];
//     const reimbursementAmount = allClaims.reduce(
//       (sum, claim) => sum + getClaimAmount(claim),
//       0,
//     );
//     const reimbursementPending = allClaims.filter(
//       (claim) => getClaimStatus(claim) === "pending",
//     ).length;
//     const reimbursementApproved = allClaims.filter(
//       (claim) => getClaimStatus(claim) === "approved",
//     ).length;
//     const reimbursementPaid = allClaims.filter(
//       (claim) => normalizeText(claim?.paymentStatus) === "paid",
//     ).length;
//     const reimbursementPaidAmount = allClaims.reduce(
//       (sum, claim) => sum + getClaimPaidAmount(claim),
//       0,
//     );

//     const recordChequeAmount = data.records.reduce(
//       (sum, record) => sum + safeNumber(record?.chequeAmount),
//       0,
//     );
//     const recordItemAmount = data.records.reduce(
//       (sum, record) => sum + safeNumber(record?.totalItemAmount),
//       0,
//     );
//     const recordRemaining = data.records.reduce(
//       (sum, record) => sum + safeNumber(record?.remainingBalance),
//       0,
//     );

//     const vendorNames = new Set<string>();
//     data.invoiceRequests.forEach((request) => {
//       getVendorNames(request).forEach((name) => vendorNames.add(name));
//     });

//     const vendorOverdue = data.invoiceRequests.reduce((sum, request) => {
//       const remaining = getRemainingRequestAmount(request);
//       const dueDate =
//         request?.dueDate || request?.paymentDueDate || request?.invoiceDueDate;

//       return remaining > 0 && dueDate && isOverdueDate(dueDate)
//         ? sum + remaining
//         : sum;
//     }, 0);

//     const lastSixMonths = Array.from({ length: 6 }, (_, index) => {
//       const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
//       return {
//         key: `${date.getFullYear()}-${date.getMonth()}`,
//         label: date.toLocaleDateString("en-PK", { month: "short" }),
//         income: 0,
//         expense: 0,
//       };
//     });

//     const monthMap = new Map(lastSixMonths.map((item) => [item.key, item]));

//     incomeEvents.forEach((event) => {
//       if (!event.date) return;
//       const key = `${event.date.getFullYear()}-${event.date.getMonth()}`;
//       const bucket = monthMap.get(key);
//       if (bucket) bucket.income += event.amount;
//     });

//     expenseEvents.forEach((event) => {
//       if (!event.date) return;
//       const key = `${event.date.getFullYear()}-${event.date.getMonth()}`;
//       const bucket = monthMap.get(key);
//       if (bucket) bucket.expense += event.amount;
//     });

//     const activities: ActivityItem[] = [
//       ...data.invoiceRequests.map((request) => ({
//         id: `budget-${request.id}`,
//         module: "Budget Request",
//         title: firstText(
//           request?.requestId,
//           request?.title,
//           request?.subject,
//           "Budget request",
//         ),
//         description: firstText(
//           request?.projectName,
//           request?.project,
//           request?.clientName,
//           request?.vendorName,
//           "Budget workflow updated",
//         ),
//         status: request?.status || "submitted",
//         date: getRequestDate(request),
//       })),
//       ...data.payments.map((payment) => ({
//         id: `payment-${payment.id}`,
//         module: "Payment Received",
//         title: firstText(
//           payment?.invoiceNo,
//           payment?.reference,
//           payment?.paymentReference,
//           "Invoice payment",
//         ),
//         description: `${firstText(payment?.client, "Payment received")} · ${formatPKR(
//           payment?.amount,
//         )}`,
//         status: "paid",
//         date:
//           toDate(payment?.paymentDate) ||
//           toDate(payment?.createdAt) ||
//           toDate(payment?.updatedAt),
//       })),
//       ...data.estimateInvoices.map((invoice) => ({
//         id: `invoice-${invoice.id}`,
//         module: "Estimate Invoice",
//         title: firstText(invoice?.invoiceNo, invoice?.subject, "Invoice"),
//         description: `${firstText(invoice?.client, "Client invoice")} · ${formatPKR(
//           getEstimateInvoiceAmount(invoice),
//         )}`,
//         status: invoice?.status || "unpaid",
//         date:
//           toDate(invoice?.invoiceDate) ||
//           toDate(invoice?.createdAt) ||
//           toDate(invoice?.updatedAt),
//       })),
//       ...data.purchaseOrders.map((purchaseOrder) => ({
//         id: `po-${purchaseOrder.id}`,
//         module: "Purchase Order",
//         title: firstText(
//           purchaseOrder?.poNumber,
//           purchaseOrder?.purchaseOrderNumber,
//           "Purchase order",
//         ),
//         description: `${firstText(
//           purchaseOrder?.supplierName,
//           purchaseOrder?.vendorName,
//           "Supplier",
//         )} · ${formatPKR(getPurchaseOrderAmount(purchaseOrder))}`,
//         status: purchaseOrder?.status || "draft",
//         date:
//           toDate(purchaseOrder?.createdAt) ||
//           toDate(purchaseOrder?.issueDate) ||
//           toDate(purchaseOrder?.updatedAt),
//       })),
//       ...data.expenseSheets.map((expense) => ({
//         id: `expense-${expense.id}`,
//         module: "Budget Expense",
//         title: firstText(
//           expense?.expenseId,
//           expense?.projectName,
//           expense?.project,
//           "Expense sheet",
//         ),
//         description: `${firstText(
//           expense?.clientName,
//           expense?.submittedByName,
//           "Expense submitted",
//         )} · ${formatPKR(getExpenseAmount(expense))}`,
//         status: expense?.paymentStatus || expense?.status || "submitted",
//         date:
//           toDate(expense?.submittedAt) ||
//           toDate(expense?.createdAt) ||
//           toDate(expense?.updatedAt),
//       })),
//       ...data.directClaims.map((claim) => ({
//         id: `claim-${claim.id}`,
//         module: "Reimbursement",
//         title: firstText(
//           claim?.description,
//           claim?.foodItem,
//           claim?.claimType,
//           "Reimbursement claim",
//         ),
//         description: `${firstText(
//           claim?.submittedByName,
//           claim?.personName,
//           "Employee",
//         )} · ${formatPKR(getClaimAmount(claim))}`,
//         status:
//           normalizeText(claim?.paymentStatus) === "paid"
//             ? "paid"
//             : claim?.status || claim?.approvalStatus || "pending",
//         date:
//           toDate(claim?.submittedAt) ||
//           toDate(claim?.createdAt) ||
//           toDate(claim?.updatedAt),
//       })),
//       ...data.records.map((record) => ({
//         id: `record-${record.id}`,
//         module: "Record",
//         title: firstText(
//           record?.statementTitle,
//           record?.accountTitle,
//           record?.chequeNumber,
//           "Financial record",
//         ),
//         description: `${firstText(record?.bank, record?.accountNo, "Account")} · ${formatPKR(
//           record?.chequeAmount,
//         )}`,
//         status: record?.status || "recorded",
//         date:
//           toDate(record?.createdAt) ||
//           toDate(record?.selectedDate) ||
//           toDate(record?.updatedAt),
//       })),
//     ]
//       .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))
//       .slice(0, 12);

//     const workflowData = [
//       { name: "Admin", value: budgetPendingAdmin, color: "#f59e0b" },
//       { name: "Finance", value: budgetPendingFinance, color: "#8b5cf6" },
//       { name: "Ready", value: budgetReadyForPayment, color: "#3b82f6" },
//       { name: "Partial", value: budgetPartial, color: "#06b6d4" },
//       { name: "Released", value: budgetReleased, color: "#10b981" },
//       { name: "Returned", value: budgetRejected, color: "#f43f5e" },
//     ];

//     return {
//       totalIncome,
//       totalExpense,
//       balance,
//       monthIncome,
//       monthExpense,
//       incomeEvents,
//       expenseEvents,
//       budgetTotalAmount,
//       budgetReleasedAmount,
//       budgetRemainingAmount,
//       budgetPendingAdmin,
//       budgetPendingFinance,
//       budgetReadyForPayment,
//       budgetPartial,
//       budgetReleased,
//       budgetRejected,
//       estimateTotalAmount,
//       estimateApproved,
//       estimateInvoiced,
//       invoiceTotalAmount,
//       paidInvoices: paidInvoices.length,
//       partialInvoices: partialInvoices.length,
//       unpaidInvoices: unpaidInvoices.length,
//       paidInvoiceAmount,
//       receivedInvoiceAmount,
//       invoiceOutstanding,
//       poTotalAmount,
//       poPaid,
//       poOpen,
//       poOverdue,
//       expenseSheetAmount,
//       reimbursementAmount,
//       reimbursementPending,
//       reimbursementApproved,
//       reimbursementPaid,
//       reimbursementPaidAmount,
//       recordChequeAmount,
//       recordItemAmount,
//       recordRemaining,
//       vendorCount: vendorNames.size,
//       vendorOverdue,
//       cashFlowData: lastSixMonths,
//       workflowData,
//       activities,
//     };
//   }, [data]);

//   const roleAlerts = useMemo(() => {
//     if (["finance", "financial_admin", "finance_admin"].includes(roleKey)) {
//       return [
//         {
//           title: "Finance Approval",
//           value: String(summary.budgetPendingFinance),
//           description: "Requests currently waiting for finance approval.",
//           icon: <Landmark className="h-5 w-5" />,
//           tone: "amber" as const,
//         },
//         {
//           title: "Release Payment",
//           value: String(summary.budgetReadyForPayment),
//           description: "Approved requests that still require payment release.",
//           icon: <Banknote className="h-5 w-5" />,
//           tone: "blue" as const,
//         },
//         {
//           title: "Partial Releases",
//           value: String(summary.budgetPartial),
//           description: "Requests with a remaining payment balance.",
//           icon: <CircleDollarSign className="h-5 w-5" />,
//           tone: "blue" as const,
//         },
//         {
//           title: "Reimbursement Payment",
//           value: String(
//             Math.max(
//               summary.reimbursementApproved - summary.reimbursementPaid,
//               0,
//             ),
//           ),
//           description: "Approved reimbursement claims awaiting payment.",
//           icon: <Users className="h-5 w-5" />,
//           tone: "emerald" as const,
//         },
//       ];
//     }

//     if (["admin", "main_admin", "super_admin"].includes(roleKey)) {
//       return [
//         {
//           title: "Admin Approval",
//           value: String(summary.budgetPendingAdmin),
//           description: "Budget requests requiring an admin decision.",
//           icon: <BadgeCheck className="h-5 w-5" />,
//           tone: "amber" as const,
//         },
//         {
//           title: "Returned Requests",
//           value: String(summary.budgetRejected),
//           description: "Requests returned to their creators for correction.",
//           icon: <XCircle className="h-5 w-5" />,
//           tone: "rose" as const,
//         },
//         {
//           title: "Pending Reimbursements",
//           value: String(summary.reimbursementPending),
//           description: "Reimbursement claims waiting for review.",
//           icon: <Clock3 className="h-5 w-5" />,
//           tone: "blue" as const,
//         },
//         {
//           title: "Overdue Purchase Orders",
//           value: String(summary.poOverdue),
//           description: "Open purchase orders whose due date has passed.",
//           icon: <AlertTriangle className="h-5 w-5" />,
//           tone: "rose" as const,
//         },
//       ];
//     }

//     return [
//       {
//         title: "Admin Queue",
//         value: String(summary.budgetPendingAdmin),
//         description: "Requests currently moving through admin approval.",
//         icon: <Clock3 className="h-5 w-5" />,
//         tone: "amber" as const,
//       },
//       {
//         title: "Finance Queue",
//         value: String(summary.budgetPendingFinance),
//         description: "Requests currently waiting for finance review.",
//         icon: <Landmark className="h-5 w-5" />,
//         tone: "blue" as const,
//       },
//       {
//         title: "Returned To Team",
//         value: String(summary.budgetRejected),
//         description: "Requests that require correction and resubmission.",
//         icon: <XCircle className="h-5 w-5" />,
//         tone: "rose" as const,
//       },
//       {
//         title: "Expense Submitted",
//         value: String(data.expenseSheets.length),
//         description: "Budget expense sheets recorded in the system.",
//         icon: <ReceiptText className="h-5 w-5" />,
//         tone: "emerald" as const,
//       },
//     ];
//   }, [data.expenseSheets.length, roleKey, summary]);

//   if (loading) {
//     return (
//       <div className="flex min-h-[70vh] items-center justify-center bg-slate-50">
//         <div className="rounded-3xl border border-slate-200 bg-white px-10 py-8 text-center shadow-sm">
//           <div className="mx-auto h-11 w-11 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
//           <p className="mt-4 text-sm font-bold text-slate-700">
//             Building your system dashboard...
//           </p>
//           <p className="mt-1 text-xs text-slate-400">
//             Loading finance, requests, invoices, POs, records and expenses.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   if (!hasFullDashboardAccess) {
//     return (
//       <>
//         <RestrictedDashboard
//           userProfile={userProfile}
//           roleKey={roleKey}
//           data={data}
//           refreshing={refreshing}
//           lastUpdated={lastUpdated}
//           unavailableModules={unavailableModules}
//           canCreateInvoices={canCreateInvoices}
//           canDownloadSnapshot={canDownloadSnapshot}
//           snapshotGenerating={snapshotGenerating}
//           onRefresh={() => loadDashboardData(true)}
//           onCreateBudgetRequest={() => setIsInvoiceModalOpen(true)}
//           onDownloadSnapshot={handleDownloadSnapshot}
//         />

//         {canCreateInvoices && (
//           <InvoiceRequestModal
//             isOpen={isInvoiceModalOpen}
//             onClose={() => setIsInvoiceModalOpen(false)}
//             onSuccess={() => {
//               setIsInvoiceModalOpen(false);
//               loadDashboardData(true);
//             }}
//           />
//         )}
//       </>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-slate-50/80 p-4 text-slate-900 sm:p-6">
//       <div className="mx-auto space-y-6">
//         <section className="overflow-hidden rounded-[32px] bg-slate-950 p-6 text-white shadow-xl shadow-slate-200/70 sm:p-8">
//           <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
//             <div>
//               <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">
//                 <Activity className="h-3.5 w-3.5" />
//                 Live System Overview
//               </div>

//               <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-[-0.04em] sm:text-4xl">
//                 Welcome back, {userProfile?.displayName || "Team Member"}
//               </h1>

//               <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
//                 A complete operational and financial view of budget requests,
//                 estimates, invoices, purchase orders, payments, expenses,
//                 reimbursements, records and vendors.
//               </p>

//               <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-300">
//                 <span className="rounded-full bg-white/10 px-3 py-1.5 font-semibold">
//                   Role: {humanize(userProfile?.role || "User")}
//                 </span>
//                 <span className="rounded-full bg-white/10 px-3 py-1.5 font-semibold">
//                   Updated: {lastUpdated ? formatRelativeTime(lastUpdated) : "Now"}
//                 </span>
//                 {unavailableModules.length > 0 && (
//                   <span className="rounded-full bg-amber-400/15 px-3 py-1.5 font-semibold text-amber-200">
//                     {unavailableModules.length} source(s) unavailable
//                   </span>
//                 )}
//               </div>
//             </div>

//             <div className="flex flex-wrap gap-2">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => loadDashboardData(true)}
//                 disabled={refreshing}
//                 className="h-11 rounded-2xl border-white/15 bg-white/10 px-4 text-white hover:bg-white/15 hover:text-white"
//               >
//                 <RefreshCcw
//                   className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
//                 />
//                 {refreshing ? "Refreshing" : "Refresh"}
//               </Button>

//               {canDownloadSnapshot && (
//                 <Button
//                   type="button"
//                   onClick={handleDownloadSnapshot}
//                   disabled={snapshotGenerating}
//                   className="h-11 rounded-2xl bg-emerald-500 px-4 font-bold text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
//                 >
//                   <Download className="mr-2 h-4 w-4" />
//                   {snapshotGenerating ? "Generating..." : "Snapshot"}
//                 </Button>
//               )}

//               {canCreateInvoices && (
//                 <Button
//                   type="button"
//                   onClick={() => setIsInvoiceModalOpen(true)}
//                   className="h-11 rounded-2xl bg-white px-4 font-bold text-slate-950 hover:bg-slate-100"
//                 >
//                   <Plus className="mr-2 h-4 w-4" />
//                   New Budget Request
//                 </Button>
//               )}
//             </div>
//           </div>

//           <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
//             <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
//               <p className="text-xs font-semibold text-slate-300">Opening Balance</p>
//               <p className="mt-2 text-xl font-black">
//                 {formatCompactPKR(data.openingBalance)}
//               </p>
//             </div>
//             <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
//               <p className="text-xs font-semibold text-slate-300">System Records</p>
//               <p className="mt-2 text-xl font-black">
//                 {(
//                   data.invoiceRequests.length +
//                   data.estimates.length +
//                   data.estimateInvoices.length +
//                   data.purchaseOrders.length +
//                   data.expenseSheets.length +
//                   data.records.length
//                 ).toLocaleString()}
//               </p>
//             </div>
//             <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
//               <p className="text-xs font-semibold text-slate-300">Budget Pipeline</p>
//               <p className="mt-2 text-xl font-black">
//                 {formatCompactPKR(summary.budgetTotalAmount)}
//               </p>
//             </div>
//             <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
//               <p className="text-xs font-semibold text-slate-300">Outstanding Invoices</p>
//               <p className="mt-2 text-xl font-black">
//                 {formatCompactPKR(summary.invoiceOutstanding)}
//               </p>
//             </div>
//           </div>
//         </section>

//         {unavailableModules.length > 0 && (
//           <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
//             <div className="flex items-start gap-3">
//               <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
//               <div>
//                 <p className="font-bold">Some dashboard sources could not be read.</p>
//                 <p className="mt-1 text-xs leading-5">
//                   Check Firestore permissions for: {unavailableModules.join(", ")}.
//                   All available modules are still displayed.
//                 </p>
//               </div>
//             </div>
//           </div>
//         )}

//         <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
//           <MetricCard
//             title="Current Balance"
//             value={formatCompactPKR(summary.balance)}
//             subtitle={`Opening + ${formatCompactPKR(summary.totalIncome)} income - ${formatCompactPKR(summary.totalExpense)} expense`}
//             icon={Wallet}
//             tone={summary.balance >= 0 ? "emerald" : "rose"}
//             trend={summary.balance >= 0 ? "up" : "down"}
//           />
//           <MetricCard
//             title="Total Income"
//             value={formatCompactPKR(summary.totalIncome)}
//             subtitle={`${formatCompactPKR(summary.monthIncome)} received this month`}
//             icon={TrendingUp}
//             tone="emerald"
//             trend="up"
//           />
//           <MetricCard
//             title="Total Expense"
//             value={formatCompactPKR(summary.totalExpense)}
//             subtitle={`${formatCompactPKR(summary.monthExpense)} released this month`}
//             icon={ArrowDownRight}
//             tone="rose"
//             trend="down"
//           />
//           <MetricCard
//             title="Remaining Releases"
//             value={formatCompactPKR(summary.budgetRemainingAmount)}
//             subtitle={`${summary.budgetReadyForPayment} request(s) ready for payment`}
//             icon={CircleDollarSign}
//             tone="blue"
//           />
//         </section>

//         <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//           <div className="mb-4 flex items-center justify-between gap-4">
//             <div>
//               <h2 className="text-lg font-black text-slate-950">Priority Actions</h2>
//               <p className="mt-1 text-xs text-slate-500">
//                 The most important tasks for your current role.
//               </p>
//             </div>
//             <ListChecks className="h-5 w-5 text-slate-400" />
//           </div>

//           <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
//             {roleAlerts.map((alert) => (
//               <AlertCard key={alert.title} {...alert} />
//             ))}
//           </div>
//         </section>

//         <section className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
//           <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//             <CardContent className="p-5 sm:p-6">
//               <div className="flex items-start justify-between gap-4">
//                 <div>
//                   <h2 className="text-lg font-black text-slate-950">
//                     Income vs Expense
//                   </h2>
//                   <p className="mt-1 text-xs text-slate-500">
//                     Account Statement cash movement for the last six months.
//                   </p>
//                 </div>
//                 <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
//                   <BarChart3 className="h-5 w-5" />
//                 </div>
//               </div>

//               <div className="mt-6 h-[310px]">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <AreaChart data={summary.cashFlowData}>
//                     <defs>
//                       <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
//                         <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
//                         <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
//                       </linearGradient>
//                       <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
//                         <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.22} />
//                         <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
//                       </linearGradient>
//                     </defs>
//                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
//                     <XAxis dataKey="label" tickLine={false} axisLine={false} />
//                     <YAxis
//                       tickLine={false}
//                       axisLine={false}
//                       tickFormatter={(value) => formatCompactPKR(value).replace("Rs ", "")}
//                     />
//                     <Tooltip formatter={(value: any) => formatPKR(value)} />
//                     <Area
//                       type="monotone"
//                       dataKey="income"
//                       name="Income"
//                       stroke="#10b981"
//                       strokeWidth={3}
//                       fill="url(#incomeGradient)"
//                     />
//                     <Area
//                       type="monotone"
//                       dataKey="expense"
//                       name="Expense"
//                       stroke="#f43f5e"
//                       strokeWidth={3}
//                       fill="url(#expenseGradient)"
//                     />
//                   </AreaChart>
//                 </ResponsiveContainer>
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//             <CardContent className="p-5 sm:p-6">
//               <div className="flex items-start justify-between gap-4">
//                 <div>
//                   <h2 className="text-lg font-black text-slate-950">
//                     Budget Workflow
//                   </h2>
//                   <p className="mt-1 text-xs text-slate-500">
//                     Current distribution of budget request stages.
//                   </p>
//                 </div>
//                 <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
//                   <FileCheck2 className="h-5 w-5" />
//                 </div>
//               </div>

//               <div className="mt-6 h-[220px]">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={summary.workflowData}>
//                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
//                     <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
//                     <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
//                     <Tooltip />
//                     <Bar dataKey="value" radius={[8, 8, 0, 0]}>
//                       {summary.workflowData.map((item) => (
//                         <Cell key={item.name} fill={item.color} />
//                       ))}
//                     </Bar>
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>

//               <div className="mt-4 grid grid-cols-2 gap-3">
//                 <div className="rounded-2xl bg-slate-50 p-3">
//                   <p className="text-xs font-semibold text-slate-500">Released</p>
//                   <p className="mt-1 text-lg font-black text-emerald-600">
//                     {formatCompactPKR(summary.budgetReleasedAmount)}
//                   </p>
//                 </div>
//                 <div className="rounded-2xl bg-slate-50 p-3">
//                   <p className="text-xs font-semibold text-slate-500">Remaining</p>
//                   <p className="mt-1 text-lg font-black text-blue-600">
//                     {formatCompactPKR(summary.budgetRemainingAmount)}
//                   </p>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </section>

//         <section>
//           <div className="mb-4 flex items-end justify-between gap-4">
//             <div>
//               <h2 className="text-xl font-black text-slate-950">Module Overview</h2>
//               <p className="mt-1 text-sm text-slate-500">
//                 Live totals from every major front-end module.
//               </p>
//             </div>
//           </div>

//           <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
//             <ModuleCard
//               title="Budget Requests"
//               subtitle="Approval, payment-release and remaining-balance status."
//               icon={FileText}
//               items={[
//                 { label: "Total Requests", value: String(data.invoiceRequests.length) },
//                 { label: "Approved Value", value: formatCompactPKR(summary.budgetTotalAmount) },
//                 { label: "Partial Releases", value: String(summary.budgetPartial), className: "text-blue-600" },
//                 { label: "Fully Released", value: String(summary.budgetReleased), className: "text-emerald-600" },
//               ]}
//             />

//             <ModuleCard
//               title="Estimates"
//               subtitle="Estimate pipeline and converted estimate records."
//               icon={FileSpreadsheet}
//               items={[
//                 { label: "Total Estimates", value: String(data.estimates.length) },
//                 { label: "Estimate Value", value: formatCompactPKR(summary.estimateTotalAmount) },
//                 { label: "Approved", value: String(summary.estimateApproved), className: "text-emerald-600" },
//                 { label: "Invoiced", value: String(summary.estimateInvoiced), className: "text-blue-600" },
//               ]}
//             />

//             <ModuleCard
//               title="Estimate Invoices"
//               subtitle="Paid, unpaid and partially-paid client invoices."
//               icon={ReceiptText}
//               items={[
//                 { label: "Total Invoices", value: String(data.estimateInvoices.length) },
//                 { label: "Invoice Value", value: formatCompactPKR(summary.invoiceTotalAmount) },
//                 { label: "Paid / Partial", value: `${summary.paidInvoices} / ${summary.partialInvoices}`, className: "text-emerald-600" },
//                 { label: "Outstanding", value: formatCompactPKR(summary.invoiceOutstanding), className: "text-amber-600" },
//               ]}
//             />

//             <ModuleCard
//               title="Purchase Orders"
//               subtitle="Purchase-order totals, open orders and overdue items."
//               icon={PackageCheck}
//               items={[
//                 { label: "Total POs", value: String(data.purchaseOrders.length) },
//                 { label: "PO Value", value: formatCompactPKR(summary.poTotalAmount) },
//                 { label: "Open / Paid", value: `${summary.poOpen} / ${summary.poPaid}` },
//                 { label: "Overdue", value: String(summary.poOverdue), className: "text-rose-600" },
//               ]}
//             />

//             <ModuleCard
//               title="Budget Expenses"
//               subtitle="Submitted expense sheets and recorded expense value."
//               icon={CreditCard}
//               items={[
//                 { label: "Expense Sheets", value: String(data.expenseSheets.length) },
//                 { label: "Submitted Value", value: formatCompactPKR(summary.expenseSheetAmount) },
//                 { label: "This Month Cash Out", value: formatCompactPKR(summary.monthExpense) },
//                 { label: "Total Cash Out", value: formatCompactPKR(summary.totalExpense), className: "text-rose-600" },
//               ]}
//             />

//             <ModuleCard
//               title="Reimbursements"
//               subtitle="Direct and sales-meeting reimbursement claims."
//               icon={Users}
//               items={[
//                 { label: "Total Claims", value: String(data.directClaims.length + data.meetingClaims.length) },
//                 { label: "Claim Value", value: formatCompactPKR(summary.reimbursementAmount) },
//                 { label: "Pending / Approved", value: `${summary.reimbursementPending} / ${summary.reimbursementApproved}` },
//                 { label: "Paid Amount", value: formatCompactPKR(summary.reimbursementPaidAmount), className: "text-emerald-600" },
//               ]}
//             />

//             <ModuleCard
//               title="Records & Cheques"
//               subtitle="Cheque records, item amounts and remaining balances."
//               icon={Landmark}
//               items={[
//                 { label: "Total Records", value: String(data.records.length) },
//                 { label: "Cheque Amount", value: formatCompactPKR(summary.recordChequeAmount) },
//                 { label: "Item Amount", value: formatCompactPKR(summary.recordItemAmount) },
//                 { label: "Remaining", value: formatCompactPKR(summary.recordRemaining), className: summary.recordRemaining < 0 ? "text-rose-600" : "text-emerald-600" },
//               ]}
//             />

//             <ModuleCard
//               title="Vendors"
//               subtitle="Vendor exposure derived from budget requests and releases."
//               icon={Building2}
//               items={[
//                 { label: "Unique Vendors", value: String(summary.vendorCount) },
//                 { label: "Paid to Vendors", value: formatCompactPKR(summary.budgetReleasedAmount) },
//                 { label: "Remaining Payable", value: formatCompactPKR(summary.budgetRemainingAmount), className: "text-blue-600" },
//                 { label: "Overdue Payable", value: formatCompactPKR(summary.vendorOverdue), className: "text-rose-600" },
//               ]}
//             />
//           </div>
//         </section>

//         <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
//           <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//             <CardContent className="p-5 sm:p-6">
//               <div className="flex items-start justify-between gap-4">
//                 <div>
//                   <h2 className="text-lg font-black text-slate-950">
//                     Recent System Activity
//                   </h2>
//                   <p className="mt-1 text-xs text-slate-500">
//                     Latest updates across requests, invoices, POs, expenses,
//                     reimbursements and records.
//                   </p>
//                 </div>
//                 <Activity className="h-5 w-5 text-slate-400" />
//               </div>

//               <div className="mt-5 divide-y divide-slate-100">
//                 {summary.activities.length === 0 ? (
//                   <div className="py-12 text-center">
//                     <CalendarClock className="mx-auto h-7 w-7 text-slate-300" />
//                     <p className="mt-3 text-sm font-semibold text-slate-500">
//                       No recent activity found.
//                     </p>
//                   </div>
//                 ) : (
//                   summary.activities.map((activity) => (
//                     <div
//                       key={activity.id}
//                       className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"
//                     >
//                       <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
//                         <Activity className="h-4 w-4" />
//                       </div>

//                       <div className="min-w-0 flex-1">
//                         <div className="flex flex-wrap items-center gap-2">
//                           <p className="truncate text-sm font-black text-slate-900">
//                             {activity.title}
//                           </p>
//                           <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
//                             {activity.module}
//                           </span>
//                         </div>
//                         <p className="mt-1 truncate text-xs text-slate-500">
//                           {activity.description}
//                         </p>
//                       </div>

//                       <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
//                         <StatusBadge status={activity.status} />
//                         <span className="text-[11px] font-semibold text-slate-400">
//                           {formatRelativeTime(activity.date)}
//                         </span>
//                       </div>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </CardContent>
//           </Card>

//           <div className="space-y-6">
//             <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//               <CardContent className="p-5">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <h2 className="font-black text-slate-950">Financial Health</h2>
//                     <p className="mt-1 text-xs text-slate-500">
//                       Key collection and payment indicators.
//                     </p>
//                   </div>
//                   <Wallet className="h-5 w-5 text-slate-400" />
//                 </div>

//                 <div className="mt-5 space-y-4">
//                   <div>
//                     <div className="flex justify-between text-xs font-semibold text-slate-500">
//                       <span>Invoice Collection</span>
//                       <span>
//                         {summary.invoiceTotalAmount > 0
//                           ? Math.min(
//                               (summary.receivedInvoiceAmount /
//                                 summary.invoiceTotalAmount) *
//                                 100,
//                               100,
//                             ).toFixed(0)
//                           : 0}
//                         %
//                       </span>
//                     </div>
//                     <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
//                       <div
//                         className="h-full rounded-full bg-emerald-500"
//                         style={{
//                           width: `${
//                             summary.invoiceTotalAmount > 0
//                               ? Math.min(
//                                   (summary.receivedInvoiceAmount /
//                                     summary.invoiceTotalAmount) *
//                                     100,
//                                   100,
//                                 )
//                               : 0
//                           }%`,
//                         }}
//                       />
//                     </div>
//                   </div>

//                   <div>
//                     <div className="flex justify-between text-xs font-semibold text-slate-500">
//                       <span>Budget Released</span>
//                       <span>
//                         {summary.budgetTotalAmount > 0
//                           ? Math.min(
//                               (summary.budgetReleasedAmount /
//                                 summary.budgetTotalAmount) *
//                                 100,
//                               100,
//                             ).toFixed(0)
//                           : 0}
//                         %
//                       </span>
//                     </div>
//                     <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
//                       <div
//                         className="h-full rounded-full bg-blue-500"
//                         style={{
//                           width: `${
//                             summary.budgetTotalAmount > 0
//                               ? Math.min(
//                                   (summary.budgetReleasedAmount /
//                                     summary.budgetTotalAmount) *
//                                     100,
//                                   100,
//                                 )
//                               : 0
//                           }%`,
//                         }}
//                       />
//                     </div>
//                   </div>

//                   <div>
//                     <div className="flex justify-between text-xs font-semibold text-slate-500">
//                       <span>Reimbursements Paid</span>
//                       <span>
//                         {summary.reimbursementApproved > 0
//                           ? Math.min(
//                               (summary.reimbursementPaid /
//                                 summary.reimbursementApproved) *
//                                 100,
//                               100,
//                             ).toFixed(0)
//                           : 0}
//                         %
//                       </span>
//                     </div>
//                     <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
//                       <div
//                         className="h-full rounded-full bg-violet-500"
//                         style={{
//                           width: `${
//                             summary.reimbursementApproved > 0
//                               ? Math.min(
//                                   (summary.reimbursementPaid /
//                                     summary.reimbursementApproved) *
//                                     100,
//                                   100,
//                                 )
//                               : 0
//                           }%`,
//                         }}
//                       />
//                     </div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//               <CardContent className="p-5">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <h2 className="font-black text-slate-950">System Snapshot</h2>
//                     <p className="mt-1 text-xs text-slate-500">
//                       Record counts across connected modules.
//                     </p>
//                   </div>
//                   <CheckCircle2 className="h-5 w-5 text-slate-400" />
//                 </div>

//                 <div className="mt-5 grid grid-cols-2 gap-3">
//                   {[
//                     ["Requests", data.invoiceRequests.length],
//                     ["Estimates", data.estimates.length],
//                     ["Invoices", data.estimateInvoices.length],
//                     ["Payments", data.payments.length],
//                     ["POs", data.purchaseOrders.length],
//                     ["Expenses", data.expenseSheets.length],
//                     ["Claims", data.directClaims.length + data.meetingClaims.length],
//                     ["Records", data.records.length],
//                   ].map(([label, value]) => (
//                     <div key={String(label)} className="rounded-2xl bg-slate-50 p-3">
//                       <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
//                         {label}
//                       </p>
//                       <p className="mt-1 text-xl font-black text-slate-950">
//                         {Number(value).toLocaleString()}
//                       </p>
//                     </div>
//                   ))}
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </section>
//       </div>

//       {canCreateInvoices && (
//         <InvoiceRequestModal
//           isOpen={isInvoiceModalOpen}
//           onClose={() => setIsInvoiceModalOpen(false)}
//           onSuccess={() => {
//             setIsInvoiceModalOpen(false);
//             loadDashboardData(true);
//           }}
//         />
//       )}
//     </div>
//   );
// }

// import {
//   useCallback,
//   useEffect,
//   useMemo,
//   useState,
//   type ReactNode,
// } from "react";
// import {
//   collection,
//   collectionGroup,
//   doc,
//   getDoc,
//   getDocs,
//   onSnapshot,
//   type DocumentData,
//   type QueryDocumentSnapshot,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { useAuth } from "@/contexts/AuthContext";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import InvoiceRequestModal from "@/components/BudgetRequestModal";
// import {
//   Activity,
//   AlertTriangle,
//   ArrowDownRight,
//   ArrowUpRight,
//   BadgeCheck,
//   Banknote,
//   BarChart3,
//   Building2,
//   CalendarClock,
//   CheckCircle2,
//   CircleDollarSign,
//   Clock3,
//   CreditCard,
//   Download,
//   FileCheck2,
//   FileSpreadsheet,
//   FileText,
//   Landmark,
//   ListChecks,
//   PackageCheck,
//   Plus,
//   ReceiptText,
//   RefreshCcw,
//   TrendingUp,
//   Users,
//   Wallet,
//   XCircle,
//   type LucideIcon,
// } from "lucide-react";
// import {
//   Area,
//   AreaChart,
//   Bar,
//   BarChart,
//   CartesianGrid,
//   Cell,
//   ResponsiveContainer,
//   Tooltip,
//   XAxis,
//   YAxis,
// } from "recharts";

// const PANEL_ID = "IEDGE-SYSTEM";

// type AnyRow = Record<string, any> & { id: string };

// type ActivityItem = {
//   id: string;
//   module: string;
//   title: string;
//   description: string;
//   status: string;
//   date: Date | null;
// };

// type MoneyEvent = {
//   date: Date | null;
//   amount: number;
// };

// type DashboardData = {
//   invoiceRequests: AnyRow[];
//   estimates: AnyRow[];
//   estimateInvoices: AnyRow[];
//   payments: AnyRow[];
//   expenseSheets: AnyRow[];
//   directClaims: AnyRow[];
//   meetingClaims: AnyRow[];
//   records: AnyRow[];
//   purchaseOrders: AnyRow[];
//   manualEntries: AnyRow[];
//   openingBalance: number;
// };

// const EMPTY_DATA: DashboardData = {
//   invoiceRequests: [],
//   estimates: [],
//   estimateInvoices: [],
//   payments: [],
//   expenseSheets: [],
//   directClaims: [],
//   meetingClaims: [],
//   records: [],
//   purchaseOrders: [],
//   manualEntries: [],
//   openingBalance: 0,
// };

// const normalizeText = (value: any) =>
//   String(value || "")
//     .trim()
//     .toLowerCase();

// const safeNumber = (value: any): number => {
//   if (value === null || value === undefined || value === "") return 0;

//   const parsed =
//     typeof value === "number"
//       ? value
//       : Number(String(value).replace(/,/g, ""));

//   return Number.isFinite(parsed) ? parsed : 0;
// };

// const firstText = (...values: any[]): string => {
//   for (const value of values) {
//     if (value === null || value === undefined || typeof value === "object") {
//       continue;
//     }

//     const text = String(value).trim();
//     if (text) return text;
//   }

//   return "";
// };

// const toDate = (value: any): Date | null => {
//   if (!value) return null;

//   try {
//     if (value instanceof Date) {
//       return Number.isNaN(value.getTime()) ? null : value;
//     }

//     if (typeof value?.toDate === "function") {
//       const date = value.toDate();
//       return Number.isNaN(date?.getTime?.()) ? null : date;
//     }

//     if (typeof value?.seconds === "number") {
//       const date = new Date(value.seconds * 1000);
//       return Number.isNaN(date.getTime()) ? null : date;
//     }

//     if (typeof value === "string") {
//       const trimmed = value.trim();

//       const ymd = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
//       if (ymd) {
//         const date = new Date(
//           Number(ymd[1]),
//           Number(ymd[2]) - 1,
//           Number(ymd[3]),
//         );
//         return Number.isNaN(date.getTime()) ? null : date;
//       }

//       const dmy = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
//       if (dmy) {
//         const date = new Date(
//           Number(dmy[3]),
//           Number(dmy[2]) - 1,
//           Number(dmy[1]),
//         );
//         return Number.isNaN(date.getTime()) ? null : date;
//       }
//     }

//     const date = new Date(value);
//     return Number.isNaN(date.getTime()) ? null : date;
//   } catch {
//     return null;
//   }
// };

// const getEntityDate = (source: any): Date | null =>
//   toDate(source?.paymentReleasedAt) ||
//   toDate(source?.releasePaymentAt) ||
//   toDate(source?.releasedAt) ||
//   toDate(source?.paymentDate) ||
//   toDate(source?.submittedAt) ||
//   toDate(source?.createdAt) ||
//   toDate(source?.updatedAt) ||
//   toDate(source?.invoiceDate) ||
//   toDate(source?.date) ||
//   toDate(source?.issueDate) ||
//   null;

// const getRequestDate = (source: any): Date | null =>
//   toDate(source?.submitDate) ||
//   toDate(source?.submittedAt) ||
//   toDate(source?.submissionDate) ||
//   toDate(source?.requestDate) ||
//   toDate(source?.createdAt) ||
//   toDate(source?.date) ||
//   toDate(source?.updatedAt) ||
//   null;

// const formatPKR = (value: any): string =>
//   `Rs ${safeNumber(value).toLocaleString("en-PK", {
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 2,
//   })}`;

// const formatCompactPKR = (value: any): string => {
//   const number = safeNumber(value);

//   if (Math.abs(number) >= 1_000_000_000) {
//     return `Rs ${(number / 1_000_000_000).toFixed(1)}B`;
//   }

//   if (Math.abs(number) >= 1_000_000) {
//     return `Rs ${(number / 1_000_000).toFixed(1)}M`;
//   }

//   if (Math.abs(number) >= 1_000) {
//     return `Rs ${(number / 1_000).toFixed(1)}K`;
//   }

//   return formatPKR(number);
// };

// const formatRelativeTime = (date: Date | null): string => {
//   if (!date) return "Date unavailable";

//   const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60_000);

//   if (diffMinutes < 1) return "Just now";
//   if (diffMinutes < 60) return `${diffMinutes} min ago`;
//   if (diffMinutes < 1_440) return `${Math.floor(diffMinutes / 60)} hr ago`;
//   if (diffMinutes < 10_080)
//     return `${Math.floor(diffMinutes / 1_440)} days ago`;

//   return date.toLocaleDateString("en-PK", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// };

// const humanize = (value: any): string =>
//   String(value || "Unknown")
//     .replace(/_/g, " ")
//     .replace(/\b\w/g, (letter) => letter.toUpperCase());

// const getApprovedRequestAmount = (request: any): number =>
//   safeNumber(
//     request?.approvedAmount ??
//       request?.totalApprovedAmount ??
//       request?.approvedTotal ??
//       request?.totalAmount ??
//       request?.amount,
//   );

// const getReleaseAmount = (entry: any): number =>
//   safeNumber(
//     entry?.amount ??
//       entry?.releaseAmount ??
//       entry?.releasedAmount ??
//       entry?.paymentAmount,
//   );

// const getPaymentReleaseHistory = (request: any): any[] => {
//   const history = Array.isArray(request?.paymentReleaseHistory)
//     ? request.paymentReleaseHistory
//     : [];

//   const validHistory = history.filter(
//     (entry: any) => getReleaseAmount(entry) > 0,
//   );

//   if (validHistory.length > 0) return validHistory;

//   const legacy = request?.paymentDetails || request?.latestPaymentRelease;
//   if (legacy && getReleaseAmount(legacy) > 0) {
//     return [
//       {
//         ...legacy,
//         releasedAt:
//           legacy?.releasedAt ||
//           request?.paymentReleasedAt ||
//           request?.releasePaymentAt ||
//           request?.updatedAt,
//       },
//     ];
//   }

//   return [];
// };

// const getReleasedRequestAmount = (request: any): number => {
//   const explicit = safeNumber(request?.totalReleasedAmount);
//   if (explicit > 0) return explicit;

//   const historyTotal = getPaymentReleaseHistory(request).reduce(
//     (sum, entry) => sum + getReleaseAmount(entry),
//     0,
//   );

//   if (historyTotal > 0) return historyTotal;

//   const status = normalizeText(request?.status);
//   if (
//     ["payment_released", "released"].includes(status) ||
//     request?.paymentReleased === true
//   ) {
//     return getApprovedRequestAmount(request);
//   }

//   return safeNumber(
//     request?.releasedAmount ??
//       request?.paidAmount ??
//       request?.paymentAmount,
//   );
// };

// const getRemainingRequestAmount = (request: any): number => {
//   if (
//     request?.remainingReleaseAmount !== undefined &&
//     request?.remainingReleaseAmount !== null
//   ) {
//     return Math.max(safeNumber(request.remainingReleaseAmount), 0);
//   }

//   return Math.max(
//     getApprovedRequestAmount(request) - getReleasedRequestAmount(request),
//     0,
//   );
// };

// const isFullyReleased = (request: any): boolean => {
//   const approved = getApprovedRequestAmount(request);
//   const released = getReleasedRequestAmount(request);
//   const remaining = getRemainingRequestAmount(request);
//   const status = normalizeText(request?.status);

//   if (approved > 0 && (remaining <= 0.009 || released >= approved - 0.009)) {
//     return true;
//   }

//   return ["payment_released", "released"].includes(status);
// };

// const isPartiallyReleased = (request: any): boolean =>
//   getReleasedRequestAmount(request) > 0 && !isFullyReleased(request);

// const getInvoiceStatus = (invoice: any): string => {
//   const raw = normalizeText(invoice?.status || invoice?.paymentStatus);

//   if (raw === "paid") return "paid";
//   if (["partially paid", "partially_paid", "partial"].includes(raw)) {
//     return "partial";
//   }

//   return "unpaid";
// };

// const getClaimStatus = (claim: any): string => {
//   const status = normalizeText(claim?.status || claim?.approvalStatus);

//   if (status === "approved") return "approved";
//   if (status === "rejected") return "rejected";
//   return "pending";
// };

// const getClaimAmount = (claim: any): number =>
//   safeNumber(
//     claim?.claimAmount ??
//       claim?.amount ??
//       claim?.approvedAmount ??
//       claim?.paidAmount,
//   );

// const getClaimPaidAmount = (claim: any): number => {
//   if (normalizeText(claim?.paymentStatus) !== "paid") return 0;

//   return safeNumber(
//     claim?.paidAmount ??
//       claim?.approvedAmount ??
//       claim?.claimAmount ??
//       claim?.amount,
//   );
// };

// const getExpenseAmount = (expense: any): number =>
//   safeNumber(expense?.totalAmount ?? expense?.amount);

// const getPurchaseOrderAmount = (purchaseOrder: any): number =>
//   safeNumber(
//     purchaseOrder?.totalAmount ??
//       purchaseOrder?.total ??
//       purchaseOrder?.amount,
//   );

// const getEstimateAmount = (estimate: any): number =>
//   safeNumber(estimate?.total ?? estimate?.totalAmount ?? estimate?.amount);

// const getEstimateInvoiceAmount = (invoice: any): number =>
//   safeNumber(invoice?.total ?? invoice?.totalAmount ?? invoice?.amount);

// const getVendorNames = (request: any): string[] => {
//   const names = new Set<string>();

//   const direct = firstText(
//     request?.vendorName,
//     request?.supplierName,
//     request?.payeeName,
//     request?.payee,
//   );
//   if (direct) names.add(direct);

//   const items = [
//     ...(Array.isArray(request?.approvalItems) ? request.approvalItems : []),
//     ...(Array.isArray(request?.lineItems) ? request.lineItems : []),
//     ...(Array.isArray(request?.items) ? request.items : []),
//   ];

//   items.forEach((item: any) => {
//     const name = firstText(
//       item?.vendor,
//       item?.vendorName,
//       item?.supplier,
//       item?.supplierName,
//       item?.original?.vendor,
//       item?.original?.supplier,
//     );

//     if (name) names.add(name);
//   });

//   return Array.from(names);
// };

// const isOverdueDate = (value: any): boolean => {
//   const date = toDate(value);
//   if (!date) return false;

//   const today = new Date();
//   today.setHours(0, 0, 0, 0);
//   date.setHours(0, 0, 0, 0);

//   return date < today;
// };

// const snapshotToRows = (
//   snapshot: { docs: QueryDocumentSnapshot<DocumentData>[] },
// ): AnyRow[] =>
//   snapshot.docs.map((document) => ({
//     id: document.id,
//     ...document.data(),
//   }));

// type FinancialSnapshot = {
//   totalReceivable: number;
//   totalPayable: number;
//   overallProfit: number;
//   overallLoss: number;
//   totalIncome: number;
//   totalExpense: number;
//   paidInvoiceRevenue: number;
//   paidInvoiceVendorCost: number;
//   paidInvoiceProfit: number;
// };

// const SNAPSHOT_ROLES = new Set([
//   "finance",
//   "finance_admin",
//   "financial_admin",
//   "operation",
//   "operations",
//   "operational_admin",
//   "operation_admin",
// ]);

// const buildFinancialSnapshot = (source: DashboardData): FinancialSnapshot => {
//   const incomeEvents: MoneyEvent[] = [];
//   const expenseEvents: MoneyEvent[] = [];

//   source.payments.forEach((payment) => {
//     const amount = safeNumber(payment?.amount);
//     const date =
//       toDate(payment?.paymentDate) ||
//       toDate(payment?.createdAt) ||
//       toDate(payment?.updatedAt);

//     if (amount > 0) incomeEvents.push({ amount, date });

//     const taxDebit =
//       safeNumber(payment?.whtAmount) + safeNumber(payment?.sstAmount);
//     if (taxDebit > 0) expenseEvents.push({ amount: taxDebit, date });
//   });

//   source.invoiceRequests.forEach((request) => {
//     const history = getPaymentReleaseHistory(request);

//     if (history.length > 0) {
//       history.forEach((release) => {
//         const amount = getReleaseAmount(release);
//         if (amount <= 0) return;

//         expenseEvents.push({
//           amount,
//           date:
//             toDate(release?.releasedAt) ||
//             toDate(release?.createdAt) ||
//             getEntityDate(request),
//         });
//       });
//       return;
//     }

//     const releasedAmount = getReleasedRequestAmount(request);
//     if (releasedAmount > 0) {
//       expenseEvents.push({
//         amount: releasedAmount,
//         date: getEntityDate(request),
//       });
//     }
//   });

//   [...source.directClaims, ...source.meetingClaims].forEach((claim) => {
//     const paidAmount = getClaimPaidAmount(claim);
//     if (paidAmount <= 0) return;

//     expenseEvents.push({
//       amount: paidAmount,
//       date:
//         toDate(claim?.paymentReleasedAt) ||
//         toDate(claim?.updatedAt) ||
//         toDate(claim?.meetingUpdatedAt) ||
//         getEntityDate(claim),
//     });
//   });

//   source.records.forEach((record) => {
//     const chequeAmount = safeNumber(record?.chequeAmount);
//     if (chequeAmount > 0) {
//       expenseEvents.push({
//         amount: chequeAmount,
//         date: getEntityDate(record),
//       });
//     }
//   });

//   source.manualEntries.forEach((entry) => {
//     const date = toDate(entry?.date) || getEntityDate(entry);
//     const debit = safeNumber(entry?.debit);
//     const credit = safeNumber(entry?.credit);

//     if (debit > 0) expenseEvents.push({ amount: debit, date });
//     if (credit > 0) incomeEvents.push({ amount: credit, date });
//   });

//   const totalIncome = incomeEvents.reduce((sum, item) => sum + item.amount, 0);
//   const totalExpense = expenseEvents.reduce(
//     (sum, item) => sum + item.amount,
//     0,
//   );

//   const invoiceTotalAmount = source.estimateInvoices.reduce(
//     (sum, invoice) => sum + getEstimateInvoiceAmount(invoice),
//     0,
//   );
//   const receivedInvoiceAmount = source.payments.reduce(
//     (sum, payment) => sum + safeNumber(payment?.amount),
//     0,
//   );

//   const totalReceivable = Math.max(
//     invoiceTotalAmount - receivedInvoiceAmount,
//     0,
//   );
//   const totalPayable = source.invoiceRequests.reduce(
//     (sum, request) => sum + getRemainingRequestAmount(request),
//     0,
//   );

//   const paidInvoiceRevenue = source.estimateInvoices
//     .filter((invoice) => getInvoiceStatus(invoice) === "paid")
//     .reduce((sum, invoice) => sum + getEstimateInvoiceAmount(invoice), 0);

//   const paidInvoiceVendorCost = source.invoiceRequests.reduce(
//     (sum, request) => sum + getReleasedRequestAmount(request),
//     0,
//   );

//   const paidInvoiceProfit = Math.max(
//     paidInvoiceRevenue - paidInvoiceVendorCost,
//     0,
//   );

//   const netResult = totalIncome - totalExpense;

//   return {
//     totalReceivable,
//     totalPayable,
//     overallProfit: Math.max(netResult, 0),
//     overallLoss: Math.max(-netResult, 0),
//     totalIncome,
//     totalExpense,
//     paidInvoiceRevenue,
//     paidInvoiceVendorCost,
//     paidInvoiceProfit,
//   };
// };

// const loadFinancialSnapshotSourceData = async (): Promise<DashboardData> => {
//   const readRows = async (path: string[]): Promise<AnyRow[]> => {
//     const snapshot = await getDocs(collection(db, path[0], ...path.slice(1)));
//     return snapshotToRows(snapshot as any);
//   };

//   const [
//     invoiceRequests,
//     estimateInvoices,
//     payments,
//     directClaims,
//     records,
//     manualEntries,
//   ] = await Promise.all([
//     readRows(["Panels", PANEL_ID, "invoiceRequests"]),
//     readRows(["Panels", PANEL_ID, "estimateInvoices"]),
//     readRows(["Panels", PANEL_ID, "payments"]),
//     readRows(["Panels", PANEL_ID, "claimReimbursements"]),
//     readRows(["Panels", PANEL_ID, "Record"]),
//     readRows(["Panels", PANEL_ID, "accountStatementManualEntries"]),
//   ]);

//   let meetingClaims: AnyRow[] = [];
//   const meetingSnapshot = await getDocs(collectionGroup(db, "meetingUpdates"));

//   meetingClaims = meetingSnapshot.docs
//     .map((meetingDocument) => ({
//       id: meetingDocument.id,
//       path: meetingDocument.ref.path,
//       ...meetingDocument.data(),
//     }))
//     .filter((meeting: any) => meeting?.reimbursement?.enabled)
//     .map((meeting: any) => ({
//       id: meeting.id,
//       path: meeting.path,
//       ...meeting.reimbursement,
//       submittedAt:
//         meeting.reimbursement?.approvalSubmittedAt ||
//         meeting.reimbursement?.submittedAt ||
//         meeting.submittedAt ||
//         meeting.createdAt ||
//         null,
//       meetingUpdatedAt: meeting.updatedAt || null,
//     }));

//   return {
//     ...EMPTY_DATA,
//     invoiceRequests,
//     estimateInvoices,
//     payments,
//     directClaims,
//     meetingClaims,
//     records,
//     manualEntries,
//   };
// };

// const sanitizePdfText = (value: any): string =>
//   String(value ?? "")
//     .normalize("NFKD")
//     .replace(/[\u0300-\u036f]/g, "")
//     .replace(/[^\x20-\x7E]/g, "?")
//     .replace(/\\/g, "\\\\")
//     .replace(/\(/g, "\\(")
//     .replace(/\)/g, "\\)");

// const downloadFinancialSnapshotPdf = ({
//   snapshot,
//   generatedBy,
//   role,
// }: {
//   snapshot: FinancialSnapshot;
//   generatedBy: string;
//   role: string;
// }) => {
//   const encoder = new TextEncoder();
//   const pageWidth = 595.28;
//   const pageHeight = 841.89;
//   const commands: string[] = [];

//   const text = (
//     value: string,
//     x: number,
//     y: number,
//     size: number,
//     font: "F1" | "F2" = "F1",
//     color = "0.059 0.090 0.165",
//   ) => {
//     commands.push(
//       `BT /${font} ${size} Tf ${color} rg 1 0 0 1 ${x} ${y} Tm (${sanitizePdfText(value)}) Tj ET`,
//     );
//   };

//   const rect = (
//     x: number,
//     y: number,
//     width: number,
//     height: number,
//     fill: string,
//     stroke?: string,
//   ) => {
//     if (stroke) {
//       commands.push(
//         `q ${fill} rg ${stroke} RG 0.8 w ${x} ${y} ${width} ${height} re B Q`,
//       );
//     } else {
//       commands.push(`q ${fill} rg ${x} ${y} ${width} ${height} re f Q`);
//     }
//   };

//   const drawMetric = ({
//     x,
//     y,
//     label,
//     value,
//     accent,
//     note,
//   }: {
//     x: number;
//     y: number;
//     label: string;
//     value: number;
//     accent: string;
//     note: string;
//   }) => {
//     rect(x, y, 241, 112, "0.984 0.988 0.996", "0.886 0.910 0.941");
//     rect(x, y, 6, 112, accent);
//     text(label.toUpperCase(), x + 20, y + 82, 9, "F2", "0.392 0.455 0.545");
//     text(formatPKR(value), x + 20, y + 48, 20, "F2");
//     text(note, x + 20, y + 22, 8.5, "F1", "0.392 0.455 0.545");
//   };

//   rect(0, 690, pageWidth, pageHeight - 690, "0.059 0.090 0.165");
//   text("FINANCIAL SNAPSHOT", 48, 790, 25, "F2", "1 1 1");
//   text(
//     "Quick summary of receivables, payables, profit and loss",
//     48,
//     762,
//     11,
//     "F1",
//     "0.797 0.835 0.882",
//   );
//   text(
//     `Generated: ${new Date().toLocaleString("en-PK")}`,
//     48,
//     728,
//     9,
//     "F1",
//     "0.797 0.835 0.882",
//   );
//   text(
//     `Prepared by: ${generatedBy} (${humanize(role)})`,
//     48,
//     710,
//     9,
//     "F1",
//     "0.797 0.835 0.882",
//   );

//   drawMetric({
//     x: 48,
//     y: 548,
//     label: "Total Receivable From Clients",
//     value: snapshot.totalReceivable,
//     accent: "0.231 0.510 0.965",
//     note: "Outstanding client invoice value",
//   });
//   drawMetric({
//     x: 306,
//     y: 548,
//     label: "Total Payable To Vendors",
//     value: snapshot.totalPayable,
//     accent: "0.961 0.620 0.043",
//     note: "Remaining approved vendor releases",
//   });
//   drawMetric({
//     x: 48,
//     y: 416,
//     label: "Overall Profit",
//     value: snapshot.overallProfit,
//     accent: "0.063 0.725 0.506",
//     note: "Positive recorded income less expenses",
//   });
//   drawMetric({
//     x: 306,
//     y: 416,
//     label: "Overall Loss",
//     value: snapshot.overallLoss,
//     accent: "0.957 0.247 0.369",
//     note: "Expense excess over recorded income",
//   });

//   const isProfit = snapshot.overallProfit > 0;
//   const isLoss = snapshot.overallLoss > 0;
//   const resultLabel = isProfit
//     ? "NET RESULT: PROFIT"
//     : isLoss
//       ? "NET RESULT: LOSS"
//       : "NET RESULT: BREAK EVEN";
//   const resultValue = isProfit
//     ? snapshot.overallProfit
//     : isLoss
//       ? snapshot.overallLoss
//       : 0;
//   const resultFill = isProfit
//     ? "0.925 0.992 0.961"
//     : isLoss
//       ? "1 0.945 0.949"
//       : "0.945 0.961 0.980";
//   const resultColor = isProfit
//     ? "0.018 0.498 0.349"
//     : isLoss
//       ? "0.745 0.078 0.165"
//       : "0.278 0.333 0.412";

//   rect(48, 304, 499, 82, resultFill);
//   text(resultLabel, 66, 356, 10, "F2", resultColor);
//   text(formatPKR(resultValue), 66, 326, 18, "F2", resultColor);
//   text(
//     `Recorded income: ${formatPKR(snapshot.totalIncome)}`,
//     300,
//     345,
//     8.5,
//     "F1",
//     "0.392 0.455 0.545",
//   );
//   text(
//     `Recorded expenses: ${formatPKR(snapshot.totalExpense)}`,
//     300,
//     325,
//     8.5,
//     "F1",
//     "0.392 0.455 0.545",
//   );

//   rect(48, 258, 499, 38, "0.925 0.992 0.961");
//   text("PROFIT FROM PAID INVOICES", 66, 274, 9, "F2", "0.018 0.498 0.349");
//   text(formatPKR(snapshot.paidInvoiceProfit), 363, 272, 13, "F2", "0.018 0.498 0.349");

//   text("REPORT BASIS", 48, 224, 11, "F2");
//   commands.push("q 0.886 0.910 0.941 RG 0.8 w 48 214 m 547 214 l S Q");
//   text(
//     "Receivable = client invoice totals less recorded client payments.",
//     48,
//     190,
//     9,
//     "F1",
//     "0.278 0.333 0.412",
//   );
//   text(
//     "Payable = approved budget request value remaining for vendor release.",
//     48,
//     171,
//     9,
//     "F1",
//     "0.278 0.333 0.412",
//   );
//   text(
//     "Profit/Loss = recorded cash income less recorded expenses and releases.",
//     48,
//     152,
//     9,
//     "F1",
//     "0.278 0.333 0.412",
//   );
//   text(
//     "Paid invoice profit = paid invoice value less vendor payments released to date.",
//     48,
//     133,
//     9,
//     "F1",
//     "0.278 0.333 0.412",
//   );
//   text(
//     "This snapshot is generated from live dashboard data at download time.",
//     48,
//     114,
//     9,
//     "F1",
//     "0.278 0.333 0.412",
//   );

//   commands.push("q 0.886 0.910 0.941 RG 0.8 w 48 78 m 547 78 l S Q");
//   text("IEDGE SYSTEM - CONFIDENTIAL FINANCIAL SUMMARY", 48, 56, 8, "F2", "0.392 0.455 0.545");
//   text("Page 1 of 1", 493, 56, 8, "F1", "0.392 0.455 0.545");

//   const streamData = `${commands.join("\n")}\n`;
//   const objects = [
//     "<< /Type /Catalog /Pages 2 0 R >>",
//     "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
//     "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
//     "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
//     "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
//     `<< /Length ${encoder.encode(streamData).length} >>\nstream\n${streamData}endstream`,
//   ];

//   let pdf = "%PDF-1.4\n% IEDGE Financial Snapshot\n";
//   const offsets: number[] = [0];

//   objects.forEach((object, index) => {
//     offsets[index + 1] = encoder.encode(pdf).length;
//     pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
//   });

//   const xrefOffset = encoder.encode(pdf).length;
//   pdf += `xref\n0 ${objects.length + 1}\n`;
//   pdf += "0000000000 65535 f \n";
//   offsets.slice(1).forEach((offset) => {
//     pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
//   });
//   pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
//   pdf += `startxref\n${xrefOffset}\n%%EOF`;

//   const blob = new Blob([encoder.encode(pdf)], { type: "application/pdf" });
//   const url = URL.createObjectURL(blob);
//   const link = document.createElement("a");
//   const stamp = new Date()
//     .toISOString()
//     .replace(/[:T]/g, "-")
//     .replace(/\.\d{3}Z$/, "");

//   link.href = url;
//   link.download = `financial-snapshot-${stamp}.pdf`;
//   document.body.appendChild(link);
//   link.click();
//   link.remove();
//   window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
// };

// const FULL_DASHBOARD_ROLES = new Set([
//   "main_admin",
//   "mainadmin",
//   "finance",
//   "finance_admin",
//   "financial_admin",
// ]);

// const SCOPE_FIELD_NAMES = [
//   "id",
//   "uid",
//   "userId",
//   "userUID",
//   "profileId",
//   "employeeId",
//   "employeeUID",
//   "email",
//   "userEmail",
//   "employeeEmail",
//   "displayName",
//   "fullName",
//   "name",
//   "createdBy",
//   "createdById",
//   "createdByUid",
//   "createdByEmail",
//   "creatorId",
//   "creatorEmail",
//   "submittedBy",
//   "submittedById",
//   "submittedByUid",
//   "submittedByEmail",
//   "requestedBy",
//   "requestedById",
//   "requestedByEmail",
//   "owner",
//   "ownerId",
//   "ownerEmail",
//   "assignedTo",
//   "assignedToId",
//   "assignedUserId",
//   "assignedUserEmail",
//   "assignee",
//   "assigneeId",
//   "assigneeEmail",
//   "personId",
//   "personEmail",
//   "salesPersonId",
//   "salesPersonEmail",
//   "teamMemberId",
//   "teamMemberEmail",
//   "department",
//   "departmentId",
//   "team",
//   "teamId",
//   "role",
//   "createdByRole",
//   "assignedRole",
//   "projectId",
//   "projectCode",
//   "assignedProjectId",
// ];

// const NESTED_SCOPE_FIELD_NAMES = [
//   "createdByUser",
//   "submittedByUser",
//   "requestedByUser",
//   "ownerUser",
//   "assignedUser",
//   "assigneeUser",
//   "employee",
//   "user",
//   "profile",
//   "teamMembers",
//   "assignedUsers",
//   "assignedToUsers",
//   "members",
//   "assignedProjects",
//   "projectIds",
//   "allowedProjectIds",
// ];

// const addScopeValue = (target: Set<string>, value: any) => {
//   if (value === null || value === undefined || value === "") return;

//   if (Array.isArray(value)) {
//     value.forEach((item) => addScopeValue(target, item));
//     return;
//   }

//   if (typeof value === "object") {
//     SCOPE_FIELD_NAMES.forEach((field) => addScopeValue(target, value?.[field]));
//     return;
//   }

//   const normalized = normalizeText(value);
//   if (normalized) target.add(normalized);
// };

// const collectScopeValues = (source: any): Set<string> => {
//   const values = new Set<string>();
//   if (!source) return values;

//   SCOPE_FIELD_NAMES.forEach((field) => addScopeValue(values, source?.[field]));
//   NESTED_SCOPE_FIELD_NAMES.forEach((field) =>
//     addScopeValue(values, source?.[field]),
//   );

//   return values;
// };

// const rowMatchesUserScope = (row: AnyRow, profile: any): boolean => {
//   const profileScope = collectScopeValues(profile);
//   if (profileScope.size === 0) return false;

//   const rowScope = collectScopeValues(row);
//   for (const value of rowScope) {
//     if (profileScope.has(value)) return true;
//   }

//   return false;
// };

// type RestrictedActivity = {
//   id: string;
//   module: string;
//   title: string;
//   description: string;
//   status: string;
//   date: Date | null;
// };

// const getRestrictedRoleConfig = (roleKey: string) => {
//   if (["operation", "operations", "operational_admin", "operation_admin"].includes(roleKey)) {
//     return {
//       title: "Operations Workspace",
//       description:
//         "Track the requests, estimates, expenses and reimbursements assigned to your operational scope.",
//       visibleModules: ["requests", "estimates", "expenses", "claims"],
//     };
//   }

//   if (["sales", "sales_admin", "business_development"].includes(roleKey)) {
//     return {
//       title: "Sales Workspace",
//       description:
//         "Track your estimates, client invoices, budget requests and submitted expenses without finance-level information.",
//       visibleModules: ["estimates", "invoices", "requests", "expenses"],
//     };
//   }

//   if (["creative", "creative_team", "design", "production"].includes(roleKey)) {
//     return {
//       title: "Creative Workspace",
//       description:
//         "View your assigned requests, submitted expenses, reimbursement claims and recent workflow updates.",
//       visibleModules: ["requests", "expenses", "claims", "activity"],
//     };
//   }

//   return {
//     title: "My Workspace",
//     description:
//       "View only the operational records assigned to your account, team, department or projects.",
//     visibleModules: ["requests", "estimates", "expenses", "claims"],
//   };
// };

// function RestrictedDashboard({
//   userProfile,
//   roleKey,
//   data,
//   refreshing,
//   lastUpdated,
//   unavailableModules,
//   canCreateInvoices,
//   canDownloadSnapshot,
//   snapshotGenerating,
//   financialSnapshot,
//   onRefresh,
//   onCreateBudgetRequest,
//   onDownloadSnapshot,
// }: {
//   userProfile: any;
//   roleKey: string;
//   data: DashboardData;
//   refreshing: boolean;
//   lastUpdated: Date | null;
//   unavailableModules: string[];
//   canCreateInvoices: boolean;
//   canDownloadSnapshot: boolean;
//   snapshotGenerating: boolean;
//   financialSnapshot: FinancialSnapshot | null;
//   onRefresh: () => void;
//   onCreateBudgetRequest: () => void;
//   onDownloadSnapshot: () => void;
// }) {
//   const config = getRestrictedRoleConfig(roleKey);

//   const dashboard = useMemo(() => {
//     const requestsPending = data.invoiceRequests.filter((request) => {
//       const status = normalizeText(request?.status);
//       return ![
//         "approved",
//         "rejected",
//         "returned_to_creator",
//         "changes_requested",
//         "payment_released",
//         "released",
//         "completed",
//       ].includes(status);
//     }).length;

//     const requestsReturned = data.invoiceRequests.filter((request) =>
//       ["rejected", "returned_to_creator", "changes_requested"].includes(
//         normalizeText(request?.status),
//       ),
//     ).length;

//     const requestsCompleted = data.invoiceRequests.filter((request) =>
//       [
//         "approved",
//         "payment_released",
//         "released",
//         "completed",
//         "paid",
//       ].includes(normalizeText(request?.status)),
//     ).length;

//     const claims = [...data.directClaims, ...data.meetingClaims];
//     const pendingClaims = claims.filter(
//       (claim) => getClaimStatus(claim) === "pending",
//     ).length;

//     const activities: RestrictedActivity[] = [
//       ...data.invoiceRequests.map((request) => ({
//         id: `request-${request.id}`,
//         module: "Budget Request",
//         title: firstText(
//           request?.requestId,
//           request?.title,
//           request?.subject,
//           "Budget request",
//         ),
//         description: firstText(
//           request?.projectName,
//           request?.project,
//           request?.clientName,
//           "Workflow updated",
//         ),
//         status: request?.status || "submitted",
//         date: getRequestDate(request),
//       })),
//       ...data.estimates.map((estimate) => ({
//         id: `estimate-${estimate.id}`,
//         module: "Estimate",
//         title: firstText(
//           estimate?.estimateNo,
//           estimate?.title,
//           estimate?.subject,
//           "Estimate",
//         ),
//         description: firstText(
//           estimate?.projectName,
//           estimate?.clientName,
//           estimate?.client,
//           "Estimate updated",
//         ),
//         status: estimate?.status || "draft",
//         date: getEntityDate(estimate),
//       })),
//       ...data.estimateInvoices.map((invoice) => ({
//         id: `invoice-${invoice.id}`,
//         module: "Client Invoice",
//         title: firstText(invoice?.invoiceNo, invoice?.subject, "Invoice"),
//         description: firstText(
//           invoice?.projectName,
//           invoice?.clientName,
//           invoice?.client,
//           "Invoice updated",
//         ),
//         status: invoice?.status || invoice?.paymentStatus || "unpaid",
//         date: getEntityDate(invoice),
//       })),
//       ...data.expenseSheets.map((expense) => ({
//         id: `expense-${expense.id}`,
//         module: "Expense Sheet",
//         title: firstText(
//           expense?.expenseId,
//           expense?.title,
//           expense?.projectName,
//           "Expense sheet",
//         ),
//         description: firstText(
//           expense?.projectName,
//           expense?.project,
//           expense?.clientName,
//           "Expense submitted",
//         ),
//         status: expense?.status || expense?.paymentStatus || "submitted",
//         date: getEntityDate(expense),
//       })),
//       ...claims.map((claim) => ({
//         id: `claim-${claim.id}`,
//         module: "Reimbursement",
//         title: firstText(
//           claim?.description,
//           claim?.foodItem,
//           claim?.claimType,
//           "Reimbursement claim",
//         ),
//         description: firstText(
//           claim?.projectName,
//           claim?.meetingTitle,
//           "Claim updated",
//         ),
//         status:
//           normalizeText(claim?.paymentStatus) === "paid"
//             ? "paid"
//             : claim?.status || claim?.approvalStatus || "pending",
//         date: getEntityDate(claim),
//       })),
//     ]
//       .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))
//       .slice(0, 10);

//     return {
//       requestsPending,
//       requestsReturned,
//       requestsCompleted,
//       pendingClaims,
//       activities,
//       totalWorkspaceRecords:
//         data.invoiceRequests.length +
//         data.estimates.length +
//         data.estimateInvoices.length +
//         data.expenseSheets.length +
//         claims.length,
//       claimsCount: claims.length,
//     };
//   }, [data]);

//   const moduleCards = [
//     {
//       key: "requests",
//       title: "My Budget Requests",
//       subtitle: "Requests created by or assigned to your user scope.",
//       icon: FileText,
//       items: [
//         { label: "Total", value: String(data.invoiceRequests.length) },
//         { label: "In Progress", value: String(dashboard.requestsPending) },
//         { label: "Returned", value: String(dashboard.requestsReturned), className: "text-rose-600" },
//         { label: "Completed", value: String(dashboard.requestsCompleted), className: "text-emerald-600" },
//       ],
//     },
//     {
//       key: "estimates",
//       title: "My Estimates",
//       subtitle: "Estimates assigned to your account, team or projects.",
//       icon: FileSpreadsheet,
//       items: [
//         { label: "Total", value: String(data.estimates.length) },
//         { label: "Approved", value: String(data.estimates.filter((item) => normalizeText(item?.status) === "approved").length), className: "text-emerald-600" },
//         { label: "Invoiced", value: String(data.estimates.filter((item) => ["invoiced", "payment received"].includes(normalizeText(item?.status))).length), className: "text-blue-600" },
//         { label: "Other", value: String(data.estimates.filter((item) => !["approved", "invoiced", "payment received"].includes(normalizeText(item?.status))).length) },
//       ],
//     },
//     {
//       key: "invoices",
//       title: "My Client Invoices",
//       subtitle: "Invoice workflow status without financial totals.",
//       icon: ReceiptText,
//       items: [
//         { label: "Total", value: String(data.estimateInvoices.length) },
//         { label: "Paid", value: String(data.estimateInvoices.filter((item) => getInvoiceStatus(item) === "paid").length), className: "text-emerald-600" },
//         { label: "Partial", value: String(data.estimateInvoices.filter((item) => getInvoiceStatus(item) === "partial").length), className: "text-blue-600" },
//         { label: "Unpaid", value: String(data.estimateInvoices.filter((item) => getInvoiceStatus(item) === "unpaid").length), className: "text-amber-600" },
//       ],
//     },
//     {
//       key: "expenses",
//       title: "My Expense Sheets",
//       subtitle: "Expense sheets submitted by or assigned to you.",
//       icon: CreditCard,
//       items: [
//         { label: "Total", value: String(data.expenseSheets.length) },
//         { label: "Pending", value: String(data.expenseSheets.filter((item) => normalizeText(item?.status || item?.paymentStatus).includes("pending")).length), className: "text-amber-600" },
//         { label: "Approved", value: String(data.expenseSheets.filter((item) => normalizeText(item?.status || item?.paymentStatus).includes("approved")).length), className: "text-emerald-600" },
//         { label: "Other", value: String(data.expenseSheets.filter((item) => !normalizeText(item?.status || item?.paymentStatus).includes("pending") && !normalizeText(item?.status || item?.paymentStatus).includes("approved")).length) },
//       ],
//     },
//     {
//       key: "claims",
//       title: "My Reimbursements",
//       subtitle: "Your submitted and assigned reimbursement claims.",
//       icon: Users,
//       items: [
//         { label: "Total", value: String(dashboard.claimsCount) },
//         { label: "Pending", value: String(dashboard.pendingClaims), className: "text-amber-600" },
//         { label: "Approved", value: String([...data.directClaims, ...data.meetingClaims].filter((item) => getClaimStatus(item) === "approved").length), className: "text-emerald-600" },
//         { label: "Rejected", value: String([...data.directClaims, ...data.meetingClaims].filter((item) => getClaimStatus(item) === "rejected").length), className: "text-rose-600" },
//       ],
//     },
//     {
//       key: "activity",
//       title: "Workflow Activity",
//       subtitle: "Recent updates visible inside your role scope.",
//       icon: Activity,
//       items: [
//         { label: "Recent Updates", value: String(dashboard.activities.length) },
//         { label: "Workspace Records", value: String(dashboard.totalWorkspaceRecords) },
//         { label: "Pending Requests", value: String(dashboard.requestsPending), className: "text-amber-600" },
//         { label: "Returned Requests", value: String(dashboard.requestsReturned), className: "text-rose-600" },
//       ],
//     },
//   ].filter((card) => config.visibleModules.includes(card.key));

//   return (
//     <div className="min-h-screen bg-slate-50/80 p-4 text-slate-900 sm:p-6">
//       <div className="mx-auto space-y-6">
//         <section className="overflow-hidden rounded-[32px] bg-slate-950 p-6 text-white shadow-xl shadow-slate-200/70 sm:p-8">
//           <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
//             <div>
//               <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">
//                 <BadgeCheck className="h-3.5 w-3.5" />
//                 Role-Based Access
//               </div>

//               <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
//                 {config.title}
//               </h1>
//               <p className="mt-2 text-lg font-bold text-white">
//                 Welcome back, {userProfile?.displayName || userProfile?.name || "Team Member"}
//               </p>
//               <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
//                 {config.description}
//               </p>

//               <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-300">
//                 <span className="rounded-full bg-white/10 px-3 py-1.5 font-semibold">
//                   Role: {humanize(userProfile?.role || "User")}
//                 </span>
//                 <span className="rounded-full bg-white/10 px-3 py-1.5 font-semibold">
//                   Updated: {lastUpdated ? formatRelativeTime(lastUpdated) : "Now"}
//                 </span>
//                 <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 font-semibold text-emerald-200">
//                   Restricted financial access
//                 </span>
//               </div>
//             </div>

//             <div className="flex flex-wrap gap-2">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={onRefresh}
//                 disabled={refreshing}
//                 className="h-11 rounded-2xl border-white/15 bg-white/10 px-4 text-white hover:bg-white/15 hover:text-white"
//               >
//                 <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
//                 {refreshing ? "Refreshing" : "Refresh"}
//               </Button>

//               {canDownloadSnapshot && (
//                 <Button
//                   type="button"
//                   onClick={onDownloadSnapshot}
//                   disabled={snapshotGenerating}
//                   className="h-11 rounded-2xl bg-emerald-500 px-4 font-bold text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
//                 >
//                   <Download className="mr-2 h-4 w-4" />
//                   {snapshotGenerating ? "Generating..." : "Snapshot"}
//                 </Button>
//               )}

//               {canCreateInvoices && (
//                 <Button
//                   type="button"
//                   onClick={onCreateBudgetRequest}
//                   className="h-11 rounded-2xl bg-white px-4 font-bold text-slate-950 hover:bg-slate-100"
//                 >
//                   <Plus className="mr-2 h-4 w-4" />
//                   New Budget Request
//                 </Button>
//               )}
//             </div>
//           </div>

//           <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
//             <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
//               <p className="text-xs font-semibold text-slate-300">Workspace Records</p>
//               <p className="mt-2 text-2xl font-black">{dashboard.totalWorkspaceRecords}</p>
//             </div>
//             <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
//               <p className="text-xs font-semibold text-slate-300">Requests In Progress</p>
//               <p className="mt-2 text-2xl font-black">{dashboard.requestsPending}</p>
//             </div>
//             <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
//               <p className="text-xs font-semibold text-slate-300">Returned Requests</p>
//               <p className="mt-2 text-2xl font-black">{dashboard.requestsReturned}</p>
//             </div>
//             <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
//               <p className="text-xs font-semibold text-slate-300">Pending Claims</p>
//               <p className="mt-2 text-2xl font-black">{dashboard.pendingClaims}</p>
//             </div>
//           </div>
//         </section>

//         {unavailableModules.length > 0 && (
//           <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
//             <div className="flex items-start gap-3">
//               <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
//               <div>
//                 <p className="font-bold">Some role-scoped modules are unavailable.</p>
//                 <p className="mt-1 text-xs leading-5">
//                   Your available workspace data is still displayed. Check the matching Firestore role rules for: {unavailableModules.join(", ")}.
//                 </p>
//               </div>
//             </div>
//           </div>
//         )}

//         <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
//           <MetricCard
//             title="My Requests"
//             value={String(data.invoiceRequests.length)}
//             subtitle="Only requests inside your role scope"
//             icon={FileText}
//             tone="blue"
//           />
//           <MetricCard
//             title="Waiting For Review"
//             value={String(dashboard.requestsPending)}
//             subtitle="Requests still moving through workflow"
//             icon={Clock3}
//             tone="amber"
//           />
//           <MetricCard
//             title="Completed"
//             value={String(dashboard.requestsCompleted)}
//             subtitle="Approved or completed requests"
//             icon={CheckCircle2}
//             tone="emerald"
//           />
//           <MetricCard
//             title="Needs Attention"
//             value={String(dashboard.requestsReturned + dashboard.pendingClaims)}
//             subtitle="Returned requests and pending claims"
//             icon={AlertTriangle}
//             tone="rose"
//           />
//         </section>

//         {canDownloadSnapshot && (
//           <Card className="rounded-3xl border-emerald-200 bg-emerald-50/60 shadow-sm">
//             <CardContent className="p-5 sm:p-6">
//               <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
//                 <div>
//                   <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
//                     Paid Invoice Profit
//                   </p>
//                   <h2 className="mt-2 text-2xl font-black text-slate-950">
//                     {financialSnapshot
//                       ? formatCompactPKR(financialSnapshot.paidInvoiceProfit)
//                       : "Loading..."}
//                   </h2>
//                   <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-600">
//                     Total profit earned so far from paid client invoices, calculated as paid invoice value less vendor payments already released.
//                   </p>
//                 </div>

//                 <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:min-w-[430px]">
//                   <div className="rounded-2xl border border-emerald-100 bg-white p-4">
//                     <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Paid Invoice Revenue</p>
//                     <p className="mt-2 text-lg font-black text-slate-950">
//                       {financialSnapshot ? formatCompactPKR(financialSnapshot.paidInvoiceRevenue) : "-"}
//                     </p>
//                   </div>
//                   <div className="rounded-2xl border border-emerald-100 bg-white p-4">
//                     <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Vendor Cost Released</p>
//                     <p className="mt-2 text-lg font-black text-slate-950">
//                       {financialSnapshot ? formatCompactPKR(financialSnapshot.paidInvoiceVendorCost) : "-"}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         )}

//         <section>
//           <div className="mb-4">
//             <h2 className="text-xl font-black text-slate-950">Role-Specific Modules</h2>
//             <p className="mt-1 text-sm text-slate-500">
//               Financial balances, payment releases, cheque records, vendor exposure and administrative reports are hidden for this role.
//             </p>
//           </div>

//           {/* <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
//             {moduleCards.map((card) => (
//               <ModuleCard key={card.key} {...card} />
//             ))}
//           </div> */}
//         </section>

//         <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//           <CardContent className="p-5 sm:p-6">
//             <div className="flex items-start justify-between gap-4">
//               <div>
//                 <h2 className="text-lg font-black text-slate-950">My Recent Activity</h2>
//                 <p className="mt-1 text-xs text-slate-500">
//                   Recent workflow updates matched to your user, team, department or assigned projects.
//                 </p>
//               </div>
//               <Activity className="h-5 w-5 text-slate-400" />
//             </div>

//             <div className="mt-5 divide-y divide-slate-100">
//               {dashboard.activities.length === 0 ? (
//                 <div className="py-12 text-center">
//                   <CalendarClock className="mx-auto h-7 w-7 text-slate-300" />
//                   <p className="mt-3 text-sm font-semibold text-slate-500">
//                     No role-scoped activity was found.
//                   </p>
//                   <p className="mt-1 text-xs text-slate-400">
//                     Make sure your records contain a matching user, team, department or project identifier.
//                   </p>
//                 </div>
//               ) : (
//                 dashboard.activities.map((activity) => (
//                   <div key={activity.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
//                     <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
//                       <Activity className="h-4 w-4" />
//                     </div>
//                     <div className="min-w-0 flex-1">
//                       <div className="flex flex-wrap items-center gap-2">
//                         <p className="truncate text-sm font-black text-slate-900">{activity.title}</p>
//                         <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{activity.module}</span>
//                       </div>
//                       <p className="mt-1 truncate text-xs text-slate-500">{activity.description}</p>
//                     </div>
//                     <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
//                       <StatusBadge status={activity.status} />
//                       <span className="text-[11px] font-semibold text-slate-400">{formatRelativeTime(activity.date)}</span>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }

// function MetricCard({
//   title,
//   value,
//   subtitle,
//   icon: Icon,
//   tone = "slate",
//   trend,
// }: {
//   title: string;
//   value: string;
//   subtitle: string;
//   icon: LucideIcon;
//   tone?: "slate" | "emerald" | "blue" | "amber" | "rose" | "violet";
//   trend?: "up" | "down";
// }) {
//   const toneClasses = {
//     slate: "bg-slate-100 text-slate-700",
//     emerald: "bg-emerald-50 text-emerald-700",
//     blue: "bg-blue-50 text-blue-700",
//     amber: "bg-amber-50 text-amber-700",
//     rose: "bg-rose-50 text-rose-700",
//     violet: "bg-violet-50 text-violet-700",
//   };

//   return (
//     <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm">
//       <CardContent className="p-5">
//         <div className="flex items-start justify-between gap-4">
//           <div className="min-w-0">
//             <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
//               {title}
//             </p>
//             <p className="mt-3 truncate text-2xl font-black tracking-tight text-slate-950 xl:text-3xl">
//               {value}
//             </p>
//           </div>

//           <div
//             className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${toneClasses[tone]}`}
//           >
//             <Icon className="h-5 w-5" />
//           </div>
//         </div>

//         <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
//           {trend === "up" && <ArrowUpRight className="h-4 w-4 text-emerald-600" />}
//           {trend === "down" && <ArrowDownRight className="h-4 w-4 text-rose-600" />}
//           <p className="truncate text-xs font-medium text-slate-500">
//             {subtitle}
//           </p>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

// function AlertCard({
//   title,
//   value,
//   description,
//   icon,
//   tone,
// }: {
//   title: string;
//   value: string;
//   description: string;
//   icon: ReactNode;
//   tone: "amber" | "blue" | "rose" | "emerald";
// }) {
//   const classes = {
//     amber: "border-amber-200 bg-amber-50/70 text-amber-800",
//     blue: "border-blue-200 bg-blue-50/70 text-blue-800",
//     rose: "border-rose-200 bg-rose-50/70 text-rose-800",
//     emerald: "border-emerald-200 bg-emerald-50/70 text-emerald-800",
//   };

//   return (
//     <div className={`rounded-2xl border p-4 ${classes[tone]}`}>
//       <div className="flex items-start justify-between gap-3">
//         <div>
//           <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">
//             {title}
//           </p>
//           <p className="mt-2 text-2xl font-black">{value}</p>
//           <p className="mt-1 text-xs font-medium leading-5 opacity-75">
//             {description}
//           </p>
//         </div>
//         <div className="rounded-xl bg-white/70 p-2.5 shadow-sm">{icon}</div>
//       </div>
//     </div>
//   );
// }

// function ModuleCard({
//   title,
//   subtitle,
//   icon: Icon,
//   items,
// }: {
//   title: string;
//   subtitle: string;
//   icon: LucideIcon;
//   items: Array<{ label: string; value: string; className?: string }>;
// }) {
//   return (
//     <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//       <CardContent className="p-5">
//         <div className="flex items-start justify-between gap-3">
//           <div>
//             <h3 className="font-black text-slate-950">{title}</h3>
//             <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>
//           </div>
//           <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
//             <Icon className="h-5 w-5" />
//           </div>
//         </div>

//         <div className="mt-5 space-y-3">
//           {items.map((item) => (
//             <div
//               key={item.label}
//               className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
//             >
//               <span className="text-sm font-medium text-slate-500">
//                 {item.label}
//               </span>
//               <span
//                 className={`text-sm font-black text-slate-950 ${item.className || ""}`}
//               >
//                 {item.value}
//               </span>
//             </div>
//           ))}
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

// function StatusBadge({ status }: { status: string }) {
//   const normalized = normalizeText(status);

//   const classes = normalized.includes("partial")
//     ? "border-blue-200 bg-blue-50 text-blue-700"
//     : normalized.includes("paid") ||
//         normalized.includes("approved") ||
//         normalized.includes("released")
//       ? "border-emerald-200 bg-emerald-50 text-emerald-700"
//       : normalized.includes("reject") || normalized.includes("cancel")
//         ? "border-rose-200 bg-rose-50 text-rose-700"
//         : normalized.includes("pending") ||
//             normalized.includes("unpaid") ||
//             normalized.includes("open")
//           ? "border-amber-200 bg-amber-50 text-amber-700"
//           : "border-slate-200 bg-slate-50 text-slate-600";

//   return (
//     <span
//       className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${classes}`}
//     >
//       {humanize(status)}
//     </span>
//   );
// }

// export default function Dashboard() {
//   const { userProfile } = useAuth();

//   const roleKey = normalizeText(userProfile?.role).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
//   const hasFullDashboardAccess = FULL_DASHBOARD_ROLES.has(roleKey);
//   const canDownloadSnapshot = SNAPSHOT_ROLES.has(roleKey);
//   const canCreateInvoices = [
//     "operation",
//     "operations",
//     "operational_admin",
//     "operation_admin",
//     "creative",
//     "sales",
//   ].includes(roleKey);

//   const [data, setData] = useState<DashboardData>(EMPTY_DATA);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
//   const [unavailableModules, setUnavailableModules] = useState<string[]>([]);
//   const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
//   const [snapshotGenerating, setSnapshotGenerating] = useState(false);
//   const [financialSnapshot, setFinancialSnapshot] = useState<FinancialSnapshot | null>(null);

//   useEffect(() => {
//     let cancelled = false;

//     if (!canDownloadSnapshot) {
//       setFinancialSnapshot(null);
//       return () => {
//         cancelled = true;
//       };
//     }

//     if (hasFullDashboardAccess) {
//       setFinancialSnapshot(buildFinancialSnapshot(data));
//       return () => {
//         cancelled = true;
//       };
//     }

//     loadFinancialSnapshotSourceData()
//       .then((source) => {
//         if (!cancelled) setFinancialSnapshot(buildFinancialSnapshot(source));
//       })
//       .catch((error) => {
//         console.warn("Dashboard could not load paid-invoice profit summary:", error);
//         if (!cancelled) setFinancialSnapshot(null);
//       });

//     return () => {
//       cancelled = true;
//     };
//   }, [canDownloadSnapshot, data, hasFullDashboardAccess]);

//   const handleDownloadSnapshot = useCallback(async () => {
//     if (!canDownloadSnapshot || snapshotGenerating) return;

//     setSnapshotGenerating(true);

//     try {
//       const source = hasFullDashboardAccess
//         ? data
//         : await loadFinancialSnapshotSourceData();
//       const snapshot = buildFinancialSnapshot(source);
//       setFinancialSnapshot(snapshot);

//       downloadFinancialSnapshotPdf({
//         snapshot,
//         generatedBy: firstText(
//           userProfile?.displayName,
//           userProfile?.role,
//           userProfile?.email,
//           "Authorized User",
//         ),
//         role: userProfile?.role || roleKey,
//       });
//     } catch (error) {
//       console.error("Failed to generate financial snapshot:", error);
//       window.alert(
//         "The financial snapshot could not be generated. Please check Firestore permissions for invoices, payments, budget requests, claims, records and manual statement entries.",
//       );
//     } finally {
//       setSnapshotGenerating(false);
//     }
//   }, [
//     canDownloadSnapshot,
//     data,
//     hasFullDashboardAccess,
//     roleKey,
//     snapshotGenerating,
//     userProfile,
//   ]);

//   const loadDashboardData = useCallback(async (silent = false) => {
//     if (silent) setRefreshing(true);
//     else setLoading(true);

//     const unavailable = new Set<string>();

//     const readCollection = async (
//       path: string[],
//       label: string,
//     ): Promise<AnyRow[]> => {
//       try {
//         const snapshot = await getDocs(
//           collection(db, path[0], ...path.slice(1)),
//         );
//         return snapshotToRows(snapshot as any);
//       } catch (error) {
//         console.warn(`Dashboard could not read ${label}:`, error);
//         unavailable.add(label);
//         return [];
//       }
//     };

//     const restrictToCurrentScope = (rows: AnyRow[]) =>
//       rows.filter((row) => rowMatchesUserScope(row, userProfile));

//     try {
//       if (!hasFullDashboardAccess) {
//         const [
//           invoiceRequests,
//           estimates,
//           estimateInvoices,
//           expenseSheets,
//           directClaims,
//         ] = await Promise.all([
//           readCollection(["Panels", PANEL_ID, "invoiceRequests"], "Budget Requests"),
//           readCollection(["Panels", PANEL_ID, "estimates"], "Estimates"),
//           readCollection(
//             ["Panels", PANEL_ID, "estimateInvoices"],
//             "Estimate Invoices",
//           ),
//           readCollection(["Panels", PANEL_ID, "expenseSheets"], "Budget Expenses"),
//           readCollection(
//             ["Panels", PANEL_ID, "claimReimbursements"],
//             "Reimbursements",
//           ),
//         ]);

//         setData({
//           ...EMPTY_DATA,
//           invoiceRequests: restrictToCurrentScope(invoiceRequests),
//           estimates: restrictToCurrentScope(estimates),
//           estimateInvoices: restrictToCurrentScope(estimateInvoices),
//           expenseSheets: restrictToCurrentScope(expenseSheets),
//           directClaims: restrictToCurrentScope(directClaims),
//         });

//         setUnavailableModules(Array.from(unavailable));
//         setLastUpdated(new Date());
//         return;
//       }

//       const [
//         invoiceRequests,
//         estimates,
//         estimateInvoices,
//         payments,
//         expenseSheets,
//         directClaims,
//         records,
//         poRows,
//         purchaseOrderRows,
//         manualEntries,
//       ] = await Promise.all([
//         readCollection(["Panels", PANEL_ID, "invoiceRequests"], "Budget Requests"),
//         readCollection(["Panels", PANEL_ID, "estimates"], "Estimates"),
//         readCollection(
//           ["Panels", PANEL_ID, "estimateInvoices"],
//           "Estimate Invoices",
//         ),
//         readCollection(["Panels", PANEL_ID, "payments"], "Payments"),
//         readCollection(["Panels", PANEL_ID, "expenseSheets"], "Budget Expenses"),
//         readCollection(
//           ["Panels", PANEL_ID, "claimReimbursements"],
//           "Reimbursements",
//         ),
//         readCollection(["Panels", PANEL_ID, "Record"], "Records"),
//         readCollection(["Panels", PANEL_ID, "PO"], "Purchase Orders"),
//         readCollection(
//           ["Panels", PANEL_ID, "purchaseOrders"],
//           "Legacy Purchase Orders",
//         ),
//         readCollection(
//           ["Panels", PANEL_ID, "accountStatementManualEntries"],
//           "Manual Statement Entries",
//         ),
//       ]);

//       let openingBalance = 0;
//       try {
//         const settingsSnapshot = await getDoc(
//           doc(
//             db,
//             "Panels",
//             PANEL_ID,
//             "accountStatementSettings",
//             "main",
//           ),
//         );

//         openingBalance = settingsSnapshot.exists()
//           ? safeNumber(settingsSnapshot.data()?.openingBalance)
//           : 0;
//       } catch (error) {
//         console.warn("Dashboard could not read Account Statement settings:", error);
//         unavailable.add("Account Statement Settings");
//       }

//       let meetingClaims: AnyRow[] = [];
//       try {
//         const meetingSnapshot = await getDocs(collectionGroup(db, "meetingUpdates"));

//         meetingClaims = meetingSnapshot.docs
//           .map((meetingDocument) => ({
//             id: meetingDocument.id,
//             path: meetingDocument.ref.path,
//             ...meetingDocument.data(),
//           }))
//           .filter((meeting: any) => meeting?.reimbursement?.enabled)
//           .map((meeting: any) => ({
//             id: meeting.id,
//             path: meeting.path,
//             ...meeting.reimbursement,
//             personName:
//               meeting.reimbursement?.approvalSubmittedByName ||
//               meeting.reimbursement?.personName ||
//               meeting.personName ||
//               "Unknown",
//             submittedAt:
//               meeting.reimbursement?.approvalSubmittedAt ||
//               meeting.reimbursement?.submittedAt ||
//               meeting.submittedAt ||
//               meeting.createdAt ||
//               null,
//             meetingUpdatedAt: meeting.updatedAt || null,
//           }));
//       } catch (error) {
//         console.warn("Dashboard could not read nested reimbursements:", error);
//         unavailable.add("Nested Reimbursements");
//       }

//       const poMap = new Map<string, AnyRow>();
//       [...poRows, ...purchaseOrderRows].forEach((purchaseOrder) => {
//         const key = firstText(
//           purchaseOrder?.poNumber,
//           purchaseOrder?.purchaseOrderNumber,
//           purchaseOrder?.id,
//         );

//         if (!poMap.has(key)) poMap.set(key, purchaseOrder);
//       });

//       setData({
//         invoiceRequests,
//         estimates,
//         estimateInvoices,
//         payments,
//         expenseSheets,
//         directClaims,
//         meetingClaims,
//         records,
//         purchaseOrders: Array.from(poMap.values()),
//         manualEntries,
//         openingBalance,
//       });

//       setUnavailableModules(Array.from(unavailable));
//       setLastUpdated(new Date());
//     } catch (error) {
//       console.error("Failed to load dashboard data:", error);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, [hasFullDashboardAccess, userProfile]);

//   useEffect(() => {
//     loadDashboardData();
//   }, [loadDashboardData]);

//   useEffect(() => {
//     const watchedCollections = hasFullDashboardAccess
//       ? [
//           "invoiceRequests",
//           "estimates",
//           "estimateInvoices",
//           "payments",
//           "expenseSheets",
//           "claimReimbursements",
//           "Record",
//           "PO",
//           "purchaseOrders",
//           "accountStatementManualEntries",
//         ]
//       : [
//           "invoiceRequests",
//           "estimates",
//           "estimateInvoices",
//           "expenseSheets",
//           "claimReimbursements",
//         ];

//     let refreshTimer: ReturnType<typeof setTimeout> | null = null;
//     const initialSnapshots = new Set<string>();

//     const unsubscribers = watchedCollections.map((collectionName) =>
//       onSnapshot(
//         collection(db, "Panels", PANEL_ID, collectionName),
//         () => {
//           if (!initialSnapshots.has(collectionName)) {
//             initialSnapshots.add(collectionName);
//             return;
//           }

//           if (refreshTimer) clearTimeout(refreshTimer);
//           refreshTimer = setTimeout(() => loadDashboardData(true), 700);
//         },
//         (error) => {
//           console.warn(`Dashboard listener failed for ${collectionName}:`, error);
//         },
//       ),
//     );

//     return () => {
//       if (refreshTimer) clearTimeout(refreshTimer);
//       unsubscribers.forEach((unsubscribe) => unsubscribe());
//     };
//   }, [hasFullDashboardAccess, loadDashboardData]);

//   const summary = useMemo(() => {
//     const now = new Date();
//     const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

//     const incomeEvents: MoneyEvent[] = [];
//     const expenseEvents: MoneyEvent[] = [];

//     data.payments.forEach((payment) => {
//       const amount = safeNumber(payment?.amount);
//       const date =
//         toDate(payment?.paymentDate) ||
//         toDate(payment?.createdAt) ||
//         toDate(payment?.updatedAt);

//       if (amount > 0) incomeEvents.push({ amount, date });

//       const taxDebit =
//         safeNumber(payment?.whtAmount) + safeNumber(payment?.sstAmount);
//       if (taxDebit > 0) expenseEvents.push({ amount: taxDebit, date });
//     });

//     data.invoiceRequests.forEach((request) => {
//       const history = getPaymentReleaseHistory(request);

//       if (history.length > 0) {
//         history.forEach((release) => {
//           const amount = getReleaseAmount(release);
//           if (amount <= 0) return;

//           expenseEvents.push({
//             amount,
//             date:
//               toDate(release?.releasedAt) ||
//               toDate(release?.createdAt) ||
//               getEntityDate(request),
//           });
//         });
//       } else {
//         const releasedAmount = getReleasedRequestAmount(request);
//         if (releasedAmount > 0) {
//           expenseEvents.push({
//             amount: releasedAmount,
//             date: getEntityDate(request),
//           });
//         }
//       }
//     });

//     data.directClaims.forEach((claim) => {
//       const paidAmount = getClaimPaidAmount(claim);
//       if (paidAmount > 0) {
//         expenseEvents.push({
//           amount: paidAmount,
//           date:
//             toDate(claim?.paymentReleasedAt) ||
//             toDate(claim?.updatedAt) ||
//             getEntityDate(claim),
//         });
//       }
//     });

//     data.meetingClaims.forEach((claim) => {
//       const paidAmount = getClaimPaidAmount(claim);
//       if (paidAmount > 0) {
//         expenseEvents.push({
//           amount: paidAmount,
//           date:
//             toDate(claim?.paymentReleasedAt) ||
//             toDate(claim?.updatedAt) ||
//             toDate(claim?.meetingUpdatedAt) ||
//             getEntityDate(claim),
//         });
//       }
//     });

//     data.records.forEach((record) => {
//       const chequeAmount = safeNumber(record?.chequeAmount);
//       if (chequeAmount > 0) {
//         expenseEvents.push({
//           amount: chequeAmount,
//           date: getEntityDate(record),
//         });
//       }
//     });

//     data.manualEntries.forEach((entry) => {
//       const date = toDate(entry?.date) || getEntityDate(entry);
//       const debit = safeNumber(entry?.debit);
//       const credit = safeNumber(entry?.credit);

//       if (debit > 0) expenseEvents.push({ amount: debit, date });
//       if (credit > 0) incomeEvents.push({ amount: credit, date });
//     });

//     const totalIncome = incomeEvents.reduce((sum, item) => sum + item.amount, 0);
//     const totalExpense = expenseEvents.reduce(
//       (sum, item) => sum + item.amount,
//       0,
//     );
//     const balance = data.openingBalance + totalIncome - totalExpense;

//     const monthIncome = incomeEvents
//       .filter((item) => item.date && item.date >= monthStart)
//       .reduce((sum, item) => sum + item.amount, 0);

//     const monthExpense = expenseEvents
//       .filter((item) => item.date && item.date >= monthStart)
//       .reduce((sum, item) => sum + item.amount, 0);

//     const budgetTotalAmount = data.invoiceRequests.reduce(
//       (sum, request) => sum + getApprovedRequestAmount(request),
//       0,
//     );
//     const budgetReleasedAmount = data.invoiceRequests.reduce(
//       (sum, request) => sum + getReleasedRequestAmount(request),
//       0,
//     );
//     const budgetRemainingAmount = data.invoiceRequests.reduce(
//       (sum, request) => sum + getRemainingRequestAmount(request),
//       0,
//     );

//     const budgetPendingAdmin = data.invoiceRequests.filter((request) =>
//       [
//         "pending_operational_admin",
//         "pending_main_admin",
//         "pending_admin",
//       ].includes(normalizeText(request?.status)),
//     ).length;

//     const budgetPendingFinance = data.invoiceRequests.filter(
//       (request) => normalizeText(request?.status) === "pending_finance",
//     ).length;

//     const budgetReadyForPayment = data.invoiceRequests.filter((request) => {
//       const status = normalizeText(request?.status);
//       return (
//         [
//           "approved",
//           "po_created",
//           "po_submitted",
//           "po_approved",
//           "po_issued",
//           "ready_for_payment",
//           "payment_partially_released",
//         ].includes(status) && !isFullyReleased(request)
//       );
//     }).length;

//     const budgetPartial = data.invoiceRequests.filter(isPartiallyReleased).length;
//     const budgetReleased = data.invoiceRequests.filter(isFullyReleased).length;
//     const budgetRejected = data.invoiceRequests.filter((request) =>
//       ["rejected", "returned_to_creator", "changes_requested"].includes(
//         normalizeText(request?.status),
//       ),
//     ).length;

//     const estimateTotalAmount = data.estimates.reduce(
//       (sum, estimate) => sum + getEstimateAmount(estimate),
//       0,
//     );

//     const estimateApproved = data.estimates.filter(
//       (estimate) => normalizeText(estimate?.status) === "approved",
//     ).length;

//     const estimateInvoiced = data.estimates.filter((estimate) =>
//       ["invoiced", "payment received"].includes(
//         normalizeText(estimate?.status),
//       ),
//     ).length;

//     const invoiceTotalAmount = data.estimateInvoices.reduce(
//       (sum, invoice) => sum + getEstimateInvoiceAmount(invoice),
//       0,
//     );

//     const paidInvoices = data.estimateInvoices.filter(
//       (invoice) => getInvoiceStatus(invoice) === "paid",
//     );
//     const partialInvoices = data.estimateInvoices.filter(
//       (invoice) => getInvoiceStatus(invoice) === "partial",
//     );
//     const unpaidInvoices = data.estimateInvoices.filter(
//       (invoice) => getInvoiceStatus(invoice) === "unpaid",
//     );

//     const paidInvoiceAmount = paidInvoices.reduce(
//       (sum, invoice) => sum + getEstimateInvoiceAmount(invoice),
//       0,
//     );

//     const paidInvoiceVendorCost = budgetReleasedAmount;
//     const paidInvoiceProfit = Math.max(
//       paidInvoiceAmount - paidInvoiceVendorCost,
//       0,
//     );

//     const receivedInvoiceAmount = data.payments.reduce(
//       (sum, payment) => sum + safeNumber(payment?.amount),
//       0,
//     );

//     const invoiceOutstanding = Math.max(
//       invoiceTotalAmount - receivedInvoiceAmount,
//       0,
//     );

//     const poTotalAmount = data.purchaseOrders.reduce(
//       (sum, purchaseOrder) => sum + getPurchaseOrderAmount(purchaseOrder),
//       0,
//     );

//     const poPaid = data.purchaseOrders.filter(
//       (purchaseOrder) => normalizeText(purchaseOrder?.status) === "paid",
//     ).length;

//     const poOpen = data.purchaseOrders.filter((purchaseOrder) =>
//       ["open", "draft"].includes(normalizeText(purchaseOrder?.status)),
//     ).length;

//     const poOverdue = data.purchaseOrders.filter((purchaseOrder) => {
//       const status = normalizeText(purchaseOrder?.status);
//       return (
//         !["paid", "cancelled"].includes(status) &&
//         (status === "over due" ||
//           status === "overdue" ||
//           isOverdueDate(purchaseOrder?.dueDate))
//       );
//     }).length;

//     const expenseSheetAmount = data.expenseSheets.reduce(
//       (sum, expense) => sum + getExpenseAmount(expense),
//       0,
//     );

//     const allClaims = [...data.directClaims, ...data.meetingClaims];
//     const reimbursementAmount = allClaims.reduce(
//       (sum, claim) => sum + getClaimAmount(claim),
//       0,
//     );
//     const reimbursementPending = allClaims.filter(
//       (claim) => getClaimStatus(claim) === "pending",
//     ).length;
//     const reimbursementApproved = allClaims.filter(
//       (claim) => getClaimStatus(claim) === "approved",
//     ).length;
//     const reimbursementPaid = allClaims.filter(
//       (claim) => normalizeText(claim?.paymentStatus) === "paid",
//     ).length;
//     const reimbursementPaidAmount = allClaims.reduce(
//       (sum, claim) => sum + getClaimPaidAmount(claim),
//       0,
//     );

//     const recordChequeAmount = data.records.reduce(
//       (sum, record) => sum + safeNumber(record?.chequeAmount),
//       0,
//     );
//     const recordItemAmount = data.records.reduce(
//       (sum, record) => sum + safeNumber(record?.totalItemAmount),
//       0,
//     );
//     const recordRemaining = data.records.reduce(
//       (sum, record) => sum + safeNumber(record?.remainingBalance),
//       0,
//     );

//     const vendorNames = new Set<string>();
//     data.invoiceRequests.forEach((request) => {
//       getVendorNames(request).forEach((name) => vendorNames.add(name));
//     });

//     const vendorOverdue = data.invoiceRequests.reduce((sum, request) => {
//       const remaining = getRemainingRequestAmount(request);
//       const dueDate =
//         request?.dueDate || request?.paymentDueDate || request?.invoiceDueDate;

//       return remaining > 0 && dueDate && isOverdueDate(dueDate)
//         ? sum + remaining
//         : sum;
//     }, 0);

//     const lastSixMonths = Array.from({ length: 6 }, (_, index) => {
//       const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
//       return {
//         key: `${date.getFullYear()}-${date.getMonth()}`,
//         label: date.toLocaleDateString("en-PK", { month: "short" }),
//         income: 0,
//         expense: 0,
//       };
//     });

//     const monthMap = new Map(lastSixMonths.map((item) => [item.key, item]));

//     incomeEvents.forEach((event) => {
//       if (!event.date) return;
//       const key = `${event.date.getFullYear()}-${event.date.getMonth()}`;
//       const bucket = monthMap.get(key);
//       if (bucket) bucket.income += event.amount;
//     });

//     expenseEvents.forEach((event) => {
//       if (!event.date) return;
//       const key = `${event.date.getFullYear()}-${event.date.getMonth()}`;
//       const bucket = monthMap.get(key);
//       if (bucket) bucket.expense += event.amount;
//     });

//     const activities: ActivityItem[] = [
//       ...data.invoiceRequests.map((request) => ({
//         id: `budget-${request.id}`,
//         module: "Budget Request",
//         title: firstText(
//           request?.requestId,
//           request?.title,
//           request?.subject,
//           "Budget request",
//         ),
//         description: firstText(
//           request?.projectName,
//           request?.project,
//           request?.clientName,
//           request?.vendorName,
//           "Budget workflow updated",
//         ),
//         status: request?.status || "submitted",
//         date: getRequestDate(request),
//       })),
//       ...data.payments.map((payment) => ({
//         id: `payment-${payment.id}`,
//         module: "Payment Received",
//         title: firstText(
//           payment?.invoiceNo,
//           payment?.reference,
//           payment?.paymentReference,
//           "Invoice payment",
//         ),
//         description: `${firstText(payment?.client, "Payment received")} · ${formatPKR(
//           payment?.amount,
//         )}`,
//         status: "paid",
//         date:
//           toDate(payment?.paymentDate) ||
//           toDate(payment?.createdAt) ||
//           toDate(payment?.updatedAt),
//       })),
//       ...data.estimateInvoices.map((invoice) => ({
//         id: `invoice-${invoice.id}`,
//         module: "Estimate Invoice",
//         title: firstText(invoice?.invoiceNo, invoice?.subject, "Invoice"),
//         description: `${firstText(invoice?.client, "Client invoice")} · ${formatPKR(
//           getEstimateInvoiceAmount(invoice),
//         )}`,
//         status: invoice?.status || "unpaid",
//         date:
//           toDate(invoice?.invoiceDate) ||
//           toDate(invoice?.createdAt) ||
//           toDate(invoice?.updatedAt),
//       })),
//       ...data.purchaseOrders.map((purchaseOrder) => ({
//         id: `po-${purchaseOrder.id}`,
//         module: "Purchase Order",
//         title: firstText(
//           purchaseOrder?.poNumber,
//           purchaseOrder?.purchaseOrderNumber,
//           "Purchase order",
//         ),
//         description: `${firstText(
//           purchaseOrder?.supplierName,
//           purchaseOrder?.vendorName,
//           "Supplier",
//         )} · ${formatPKR(getPurchaseOrderAmount(purchaseOrder))}`,
//         status: purchaseOrder?.status || "draft",
//         date:
//           toDate(purchaseOrder?.createdAt) ||
//           toDate(purchaseOrder?.issueDate) ||
//           toDate(purchaseOrder?.updatedAt),
//       })),
//       ...data.expenseSheets.map((expense) => ({
//         id: `expense-${expense.id}`,
//         module: "Budget Expense",
//         title: firstText(
//           expense?.expenseId,
//           expense?.projectName,
//           expense?.project,
//           "Expense sheet",
//         ),
//         description: `${firstText(
//           expense?.clientName,
//           expense?.submittedByName,
//           "Expense submitted",
//         )} · ${formatPKR(getExpenseAmount(expense))}`,
//         status: expense?.paymentStatus || expense?.status || "submitted",
//         date:
//           toDate(expense?.submittedAt) ||
//           toDate(expense?.createdAt) ||
//           toDate(expense?.updatedAt),
//       })),
//       ...data.directClaims.map((claim) => ({
//         id: `claim-${claim.id}`,
//         module: "Reimbursement",
//         title: firstText(
//           claim?.description,
//           claim?.foodItem,
//           claim?.claimType,
//           "Reimbursement claim",
//         ),
//         description: `${firstText(
//           claim?.submittedByName,
//           claim?.personName,
//           "Employee",
//         )} · ${formatPKR(getClaimAmount(claim))}`,
//         status:
//           normalizeText(claim?.paymentStatus) === "paid"
//             ? "paid"
//             : claim?.status || claim?.approvalStatus || "pending",
//         date:
//           toDate(claim?.submittedAt) ||
//           toDate(claim?.createdAt) ||
//           toDate(claim?.updatedAt),
//       })),
//       ...data.records.map((record) => ({
//         id: `record-${record.id}`,
//         module: "Record",
//         title: firstText(
//           record?.statementTitle,
//           record?.accountTitle,
//           record?.chequeNumber,
//           "Financial record",
//         ),
//         description: `${firstText(record?.bank, record?.accountNo, "Account")} · ${formatPKR(
//           record?.chequeAmount,
//         )}`,
//         status: record?.status || "recorded",
//         date:
//           toDate(record?.createdAt) ||
//           toDate(record?.selectedDate) ||
//           toDate(record?.updatedAt),
//       })),
//     ]
//       .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))
//       .slice(0, 12);

//     const workflowData = [
//       { name: "Admin", value: budgetPendingAdmin, color: "#f59e0b" },
//       { name: "Finance", value: budgetPendingFinance, color: "#8b5cf6" },
//       { name: "Ready", value: budgetReadyForPayment, color: "#3b82f6" },
//       { name: "Partial", value: budgetPartial, color: "#06b6d4" },
//       { name: "Released", value: budgetReleased, color: "#10b981" },
//       { name: "Returned", value: budgetRejected, color: "#f43f5e" },
//     ];

//     return {
//       totalIncome,
//       totalExpense,
//       balance,
//       monthIncome,
//       monthExpense,
//       incomeEvents,
//       expenseEvents,
//       budgetTotalAmount,
//       budgetReleasedAmount,
//       budgetRemainingAmount,
//       budgetPendingAdmin,
//       budgetPendingFinance,
//       budgetReadyForPayment,
//       budgetPartial,
//       budgetReleased,
//       budgetRejected,
//       estimateTotalAmount,
//       estimateApproved,
//       estimateInvoiced,
//       invoiceTotalAmount,
//       paidInvoices: paidInvoices.length,
//       partialInvoices: partialInvoices.length,
//       unpaidInvoices: unpaidInvoices.length,
//       paidInvoiceAmount,
//       paidInvoiceVendorCost,
//       paidInvoiceProfit,
//       receivedInvoiceAmount,
//       invoiceOutstanding,
//       poTotalAmount,
//       poPaid,
//       poOpen,
//       poOverdue,
//       expenseSheetAmount,
//       reimbursementAmount,
//       reimbursementPending,
//       reimbursementApproved,
//       reimbursementPaid,
//       reimbursementPaidAmount,
//       recordChequeAmount,
//       recordItemAmount,
//       recordRemaining,
//       vendorCount: vendorNames.size,
//       vendorOverdue,
//       cashFlowData: lastSixMonths,
//       workflowData,
//       activities,
//     };
//   }, [data]);

//   const roleAlerts = useMemo(() => {
//     if (["finance", "financial_admin", "finance_admin"].includes(roleKey)) {
//       return [
//         {
//           title: "Finance Approval",
//           value: String(summary.budgetPendingFinance),
//           description: "Requests currently waiting for finance approval.",
//           icon: <Landmark className="h-5 w-5" />,
//           tone: "amber" as const,
//         },
//         {
//           title: "Release Payment",
//           value: String(summary.budgetReadyForPayment),
//           description: "Approved requests that still require payment release.",
//           icon: <Banknote className="h-5 w-5" />,
//           tone: "blue" as const,
//         },
//         {
//           title: "Partial Releases",
//           value: String(summary.budgetPartial),
//           description: "Requests with a remaining payment balance.",
//           icon: <CircleDollarSign className="h-5 w-5" />,
//           tone: "blue" as const,
//         },
//         {
//           title: "Reimbursement Payment",
//           value: String(
//             Math.max(
//               summary.reimbursementApproved - summary.reimbursementPaid,
//               0,
//             ),
//           ),
//           description: "Approved reimbursement claims awaiting payment.",
//           icon: <Users className="h-5 w-5" />,
//           tone: "emerald" as const,
//         },
//       ];
//     }

//     if (["admin", "main_admin", "super_admin"].includes(roleKey)) {
//       return [
//         {
//           title: "Admin Approval",
//           value: String(summary.budgetPendingAdmin),
//           description: "Budget requests requiring an admin decision.",
//           icon: <BadgeCheck className="h-5 w-5" />,
//           tone: "amber" as const,
//         },
//         {
//           title: "Returned Requests",
//           value: String(summary.budgetRejected),
//           description: "Requests returned to their creators for correction.",
//           icon: <XCircle className="h-5 w-5" />,
//           tone: "rose" as const,
//         },
//         {
//           title: "Pending Reimbursements",
//           value: String(summary.reimbursementPending),
//           description: "Reimbursement claims waiting for review.",
//           icon: <Clock3 className="h-5 w-5" />,
//           tone: "blue" as const,
//         },
//         {
//           title: "Overdue Purchase Orders",
//           value: String(summary.poOverdue),
//           description: "Open purchase orders whose due date has passed.",
//           icon: <AlertTriangle className="h-5 w-5" />,
//           tone: "rose" as const,
//         },
//       ];
//     }

//     return [
//       {
//         title: "Admin Queue",
//         value: String(summary.budgetPendingAdmin),
//         description: "Requests currently moving through admin approval.",
//         icon: <Clock3 className="h-5 w-5" />,
//         tone: "amber" as const,
//       },
//       {
//         title: "Finance Queue",
//         value: String(summary.budgetPendingFinance),
//         description: "Requests currently waiting for finance review.",
//         icon: <Landmark className="h-5 w-5" />,
//         tone: "blue" as const,
//       },
//       {
//         title: "Returned To Team",
//         value: String(summary.budgetRejected),
//         description: "Requests that require correction and resubmission.",
//         icon: <XCircle className="h-5 w-5" />,
//         tone: "rose" as const,
//       },
//       {
//         title: "Expense Submitted",
//         value: String(data.expenseSheets.length),
//         description: "Budget expense sheets recorded in the system.",
//         icon: <ReceiptText className="h-5 w-5" />,
//         tone: "emerald" as const,
//       },
//     ];
//   }, [data.expenseSheets.length, roleKey, summary]);

//   if (loading) {
//     return (
//       <div className="flex min-h-[70vh] items-center justify-center bg-slate-50">
//         <div className="rounded-3xl border border-slate-200 bg-white px-10 py-8 text-center shadow-sm">
//           <div className="mx-auto h-11 w-11 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
//           <p className="mt-4 text-sm font-bold text-slate-700">
//             Building your system dashboard...
//           </p>
//           <p className="mt-1 text-xs text-slate-400">
//             Loading finance, requests, invoices, POs, records and expenses.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   if (!hasFullDashboardAccess) {
//     return (
//       <>
//         <RestrictedDashboard
//           userProfile={userProfile}
//           roleKey={roleKey}
//           data={data}
//           refreshing={refreshing}
//           lastUpdated={lastUpdated}
//           unavailableModules={unavailableModules}
//           canCreateInvoices={canCreateInvoices}
//           canDownloadSnapshot={canDownloadSnapshot}
//           snapshotGenerating={snapshotGenerating}
//           financialSnapshot={financialSnapshot}
//           onRefresh={() => loadDashboardData(true)}
//           onCreateBudgetRequest={() => setIsInvoiceModalOpen(true)}
//           onDownloadSnapshot={handleDownloadSnapshot}
//         />

//         {canCreateInvoices && (
//           <InvoiceRequestModal
//             isOpen={isInvoiceModalOpen}
//             onClose={() => setIsInvoiceModalOpen(false)}
//             onSuccess={() => {
//               setIsInvoiceModalOpen(false);
//               loadDashboardData(true);
//             }}
//           />
//         )}
//       </>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-slate-50/80 p-4 text-slate-900 sm:p-6">
//       <div className="mx-auto space-y-6">
//         <section className="overflow-hidden rounded-[32px] bg-slate-950 p-6 text-white shadow-xl shadow-slate-200/70 sm:p-8">
//           <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
//             <div>
//               <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">
//                 <Activity className="h-3.5 w-3.5" />
//                 Live System Overview
//               </div>

//               <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-[-0.04em] sm:text-4xl">
//                 Welcome back, {userProfile?.displayName || "Team Member"}
//               </h1>

//               <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
//                 A complete operational and financial view of budget requests,
//                 estimates, invoices, purchase orders, payments, expenses,
//                 reimbursements, records and vendors.
//               </p>

//               <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-300">
//                 <span className="rounded-full bg-white/10 px-3 py-1.5 font-semibold">
//                   Role: {humanize(userProfile?.role || "User")}
//                 </span>
//                 <span className="rounded-full bg-white/10 px-3 py-1.5 font-semibold">
//                   Updated: {lastUpdated ? formatRelativeTime(lastUpdated) : "Now"}
//                 </span>
//                 {unavailableModules.length > 0 && (
//                   <span className="rounded-full bg-amber-400/15 px-3 py-1.5 font-semibold text-amber-200">
//                     {unavailableModules.length} source(s) unavailable
//                   </span>
//                 )}
//               </div>
//             </div>

//             <div className="flex flex-wrap gap-2">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => loadDashboardData(true)}
//                 disabled={refreshing}
//                 className="h-11 rounded-2xl border-white/15 bg-white/10 px-4 text-white hover:bg-white/15 hover:text-white"
//               >
//                 <RefreshCcw
//                   className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
//                 />
//                 {refreshing ? "Refreshing" : "Refresh"}
//               </Button>

//               {canDownloadSnapshot && (
//                 <Button
//                   type="button"
//                   onClick={handleDownloadSnapshot}
//                   disabled={snapshotGenerating}
//                   className="h-11 rounded-2xl bg-emerald-500 px-4 font-bold text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
//                 >
//                   <Download className="mr-2 h-4 w-4" />
//                   {snapshotGenerating ? "Generating..." : "Snapshot"}
//                 </Button>
//               )}

//               {canCreateInvoices && (
//                 <Button
//                   type="button"
//                   onClick={() => setIsInvoiceModalOpen(true)}
//                   className="h-11 rounded-2xl bg-white px-4 font-bold text-slate-950 hover:bg-slate-100"
//                 >
//                   <Plus className="mr-2 h-4 w-4" />
//                   New Budget Request
//                 </Button>
//               )}
//             </div>
//           </div>

//           <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
//             <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
//               <p className="text-xs font-semibold text-slate-300">Opening Balance</p>
//               <p className="mt-2 text-xl font-black">
//                 {formatCompactPKR(data.openingBalance)}
//               </p>
//             </div>
//             <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
//               <p className="text-xs font-semibold text-slate-300">System Records</p>
//               <p className="mt-2 text-xl font-black">
//                 {(
//                   data.invoiceRequests.length +
//                   data.estimates.length +
//                   data.estimateInvoices.length +
//                   data.purchaseOrders.length +
//                   data.expenseSheets.length +
//                   data.records.length
//                 ).toLocaleString()}
//               </p>
//             </div>
//             <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
//               <p className="text-xs font-semibold text-slate-300">Budget Pipeline</p>
//               <p className="mt-2 text-xl font-black">
//                 {formatCompactPKR(summary.budgetTotalAmount)}
//               </p>
//             </div>
//             <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
//               <p className="text-xs font-semibold text-slate-300">Outstanding Invoices</p>
//               <p className="mt-2 text-xl font-black">
//                 {formatCompactPKR(summary.invoiceOutstanding)}
//               </p>
//             </div>
//           </div>
//         </section>

//         {unavailableModules.length > 0 && (
//           <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
//             <div className="flex items-start gap-3">
//               <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
//               <div>
//                 <p className="font-bold">Some dashboard sources could not be read.</p>
//                 <p className="mt-1 text-xs leading-5">
//                   Check Firestore permissions for: {unavailableModules.join(", ")}.
//                   All available modules are still displayed.
//                 </p>
//               </div>
//             </div>
//           </div>
//         )}

//         <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
//           <MetricCard
//             title="Current Balance"
//             value={formatCompactPKR(summary.balance)}
//             subtitle={`Opening + ${formatCompactPKR(summary.totalIncome)} income - ${formatCompactPKR(summary.totalExpense)} expense`}
//             icon={Wallet}
//             tone={summary.balance >= 0 ? "emerald" : "rose"}
//             trend={summary.balance >= 0 ? "up" : "down"}
//           />
//           <MetricCard
//             title="Total Income"
//             value={formatCompactPKR(summary.totalIncome)}
//             subtitle={`${formatCompactPKR(summary.monthIncome)} received this month`}
//             icon={TrendingUp}
//             tone="emerald"
//             trend="up"
//           />
//           <MetricCard
//             title="Total Expense"
//             value={formatCompactPKR(summary.totalExpense)}
//             subtitle={`${formatCompactPKR(summary.monthExpense)} released this month`}
//             icon={ArrowDownRight}
//             tone="rose"
//             trend="down"
//           />
//           <MetricCard
//             title="Remaining Releases"
//             value={formatCompactPKR(summary.budgetRemainingAmount)}
//             subtitle={`${summary.budgetReadyForPayment} request(s) ready for payment`}
//             icon={CircleDollarSign}
//             tone="blue"
//           />
//         </section>

//         <section className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm sm:p-6">
//           <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
//             <div>
//               <div className="flex items-center gap-2">
//                 <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
//                   <TrendingUp className="h-5 w-5" />
//                 </div>
//                 <div>
//                   <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
//                     Paid Invoice Profit
//                   </p>
//                   <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
//                     {formatCompactPKR(summary.paidInvoiceProfit)}
//                   </h2>
//                 </div>
//               </div>
//               <p className="mt-3 max-w-2xl text-xs leading-5 text-slate-600">
//                 Total profit earned so far from all paid client invoices. Profit is calculated as paid invoice value less vendor payments already released.
//               </p>
//             </div>

//             <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[440px]">
//               <div className="rounded-2xl border border-emerald-100 bg-white p-4">
//                 <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Paid Invoice Revenue</p>
//                 <p className="mt-2 text-lg font-black text-slate-950">
//                   {formatCompactPKR(summary.paidInvoiceAmount)}
//                 </p>
//                 <p className="mt-1 text-xs text-slate-500">{summary.paidInvoices} paid invoice(s)</p>
//               </div>
//               <div className="rounded-2xl border border-emerald-100 bg-white p-4">
//                 <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Vendor Cost Released</p>
//                 <p className="mt-2 text-lg font-black text-slate-950">
//                   {formatCompactPKR(summary.paidInvoiceVendorCost)}
//                 </p>
//                 <p className="mt-1 text-xs text-slate-500">Released budget/vendor payments</p>
//               </div>
//             </div>
//           </div>
//         </section>

//         <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//           <div className="mb-4 flex items-center justify-between gap-4">
//             <div>
//               <h2 className="text-lg font-black text-slate-950">Priority Actions</h2>
//               <p className="mt-1 text-xs text-slate-500">
//                 The most important tasks for your current role.
//               </p>
//             </div>
//             <ListChecks className="h-5 w-5 text-slate-400" />
//           </div>

//           <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
//             {roleAlerts.map((alert) => (
//               <AlertCard key={alert.title} {...alert} />
//             ))}
//           </div>
//         </section>

//         <section className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
//           <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//             <CardContent className="p-5 sm:p-6">
//               <div className="flex items-start justify-between gap-4">
//                 <div>
//                   <h2 className="text-lg font-black text-slate-950">
//                     Income vs Expense
//                   </h2>
//                   <p className="mt-1 text-xs text-slate-500">
//                     Account Statement cash movement for the last six months.
//                   </p>
//                 </div>
//                 <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
//                   <BarChart3 className="h-5 w-5" />
//                 </div>
//               </div>

//               <div className="mt-6 h-[310px]">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <AreaChart data={summary.cashFlowData}>
//                     <defs>
//                       <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
//                         <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
//                         <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
//                       </linearGradient>
//                       <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
//                         <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.22} />
//                         <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
//                       </linearGradient>
//                     </defs>
//                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
//                     <XAxis dataKey="label" tickLine={false} axisLine={false} />
//                     <YAxis
//                       tickLine={false}
//                       axisLine={false}
//                       tickFormatter={(value) => formatCompactPKR(value).replace("Rs ", "")}
//                     />
//                     <Tooltip formatter={(value: any) => formatPKR(value)} />
//                     <Area
//                       type="monotone"
//                       dataKey="income"
//                       name="Income"
//                       stroke="#10b981"
//                       strokeWidth={3}
//                       fill="url(#incomeGradient)"
//                     />
//                     <Area
//                       type="monotone"
//                       dataKey="expense"
//                       name="Expense"
//                       stroke="#f43f5e"
//                       strokeWidth={3}
//                       fill="url(#expenseGradient)"
//                     />
//                   </AreaChart>
//                 </ResponsiveContainer>
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//             <CardContent className="p-5 sm:p-6">
//               <div className="flex items-start justify-between gap-4">
//                 <div>
//                   <h2 className="text-lg font-black text-slate-950">
//                     Budget Workflow
//                   </h2>
//                   <p className="mt-1 text-xs text-slate-500">
//                     Current distribution of budget request stages.
//                   </p>
//                 </div>
//                 <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
//                   <FileCheck2 className="h-5 w-5" />
//                 </div>
//               </div>

//               <div className="mt-6 h-[220px]">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={summary.workflowData}>
//                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
//                     <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
//                     <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
//                     <Tooltip />
//                     <Bar dataKey="value" radius={[8, 8, 0, 0]}>
//                       {summary.workflowData.map((item) => (
//                         <Cell key={item.name} fill={item.color} />
//                       ))}
//                     </Bar>
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>

//               <div className="mt-4 grid grid-cols-2 gap-3">
//                 <div className="rounded-2xl bg-slate-50 p-3">
//                   <p className="text-xs font-semibold text-slate-500">Released</p>
//                   <p className="mt-1 text-lg font-black text-emerald-600">
//                     {formatCompactPKR(summary.budgetReleasedAmount)}
//                   </p>
//                 </div>
//                 <div className="rounded-2xl bg-slate-50 p-3">
//                   <p className="text-xs font-semibold text-slate-500">Remaining</p>
//                   <p className="mt-1 text-lg font-black text-blue-600">
//                     {formatCompactPKR(summary.budgetRemainingAmount)}
//                   </p>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </section>

//         <section>
//           <div className="mb-4 flex items-end justify-between gap-4">
//             <div>
//               <h2 className="text-xl font-black text-slate-950">Module Overview</h2>
//               <p className="mt-1 text-sm text-slate-500">
//                 Live totals from every major front-end module.
//               </p>
//             </div>
//           </div>

//           <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
//             <ModuleCard
//               title="Budget Requests"
//               subtitle="Approval, payment-release and remaining-balance status."
//               icon={FileText}
//               items={[
//                 { label: "Total Requests", value: String(data.invoiceRequests.length) },
//                 { label: "Approved Value", value: formatCompactPKR(summary.budgetTotalAmount) },
//                 { label: "Partial Releases", value: String(summary.budgetPartial), className: "text-blue-600" },
//                 { label: "Fully Released", value: String(summary.budgetReleased), className: "text-emerald-600" },
//               ]}
//             />

//             <ModuleCard
//               title="Estimates"
//               subtitle="Estimate pipeline and converted estimate records."
//               icon={FileSpreadsheet}
//               items={[
//                 { label: "Total Estimates", value: String(data.estimates.length) },
//                 { label: "Estimate Value", value: formatCompactPKR(summary.estimateTotalAmount) },
//                 { label: "Approved", value: String(summary.estimateApproved), className: "text-emerald-600" },
//                 { label: "Invoiced", value: String(summary.estimateInvoiced), className: "text-blue-600" },
//               ]}
//             />

//             <ModuleCard
//               title="Estimate Invoices"
//               subtitle="Paid, unpaid and partially-paid client invoices."
//               icon={ReceiptText}
//               items={[
//                 { label: "Total Invoices", value: String(data.estimateInvoices.length) },
//                 { label: "Invoice Value", value: formatCompactPKR(summary.invoiceTotalAmount) },
//                 { label: "Paid / Partial", value: `${summary.paidInvoices} / ${summary.partialInvoices}`, className: "text-emerald-600" },
//                 { label: "Outstanding", value: formatCompactPKR(summary.invoiceOutstanding), className: "text-amber-600" },
//               ]}
//             />

//             <ModuleCard
//               title="Purchase Orders"
//               subtitle="Purchase-order totals, open orders and overdue items."
//               icon={PackageCheck}
//               items={[
//                 { label: "Total POs", value: String(data.purchaseOrders.length) },
//                 { label: "PO Value", value: formatCompactPKR(summary.poTotalAmount) },
//                 { label: "Open / Paid", value: `${summary.poOpen} / ${summary.poPaid}` },
//                 { label: "Overdue", value: String(summary.poOverdue), className: "text-rose-600" },
//               ]}
//             />

//             <ModuleCard
//               title="Budget Expenses"
//               subtitle="Submitted expense sheets and recorded expense value."
//               icon={CreditCard}
//               items={[
//                 { label: "Expense Sheets", value: String(data.expenseSheets.length) },
//                 { label: "Submitted Value", value: formatCompactPKR(summary.expenseSheetAmount) },
//                 { label: "This Month Cash Out", value: formatCompactPKR(summary.monthExpense) },
//                 { label: "Total Cash Out", value: formatCompactPKR(summary.totalExpense), className: "text-rose-600" },
//               ]}
//             />

//             <ModuleCard
//               title="Reimbursements"
//               subtitle="Direct and sales-meeting reimbursement claims."
//               icon={Users}
//               items={[
//                 { label: "Total Claims", value: String(data.directClaims.length + data.meetingClaims.length) },
//                 { label: "Claim Value", value: formatCompactPKR(summary.reimbursementAmount) },
//                 { label: "Pending / Approved", value: `${summary.reimbursementPending} / ${summary.reimbursementApproved}` },
//                 { label: "Paid Amount", value: formatCompactPKR(summary.reimbursementPaidAmount), className: "text-emerald-600" },
//               ]}
//             />

//             <ModuleCard
//               title="Records & Cheques"
//               subtitle="Cheque records, item amounts and remaining balances."
//               icon={Landmark}
//               items={[
//                 { label: "Total Records", value: String(data.records.length) },
//                 { label: "Cheque Amount", value: formatCompactPKR(summary.recordChequeAmount) },
//                 { label: "Item Amount", value: formatCompactPKR(summary.recordItemAmount) },
//                 { label: "Remaining", value: formatCompactPKR(summary.recordRemaining), className: summary.recordRemaining < 0 ? "text-rose-600" : "text-emerald-600" },
//               ]}
//             />

//             <ModuleCard
//               title="Vendors"
//               subtitle="Vendor exposure derived from budget requests and releases."
//               icon={Building2}
//               items={[
//                 { label: "Unique Vendors", value: String(summary.vendorCount) },
//                 { label: "Paid to Vendors", value: formatCompactPKR(summary.budgetReleasedAmount) },
//                 { label: "Remaining Payable", value: formatCompactPKR(summary.budgetRemainingAmount), className: "text-blue-600" },
//                 { label: "Overdue Payable", value: formatCompactPKR(summary.vendorOverdue), className: "text-rose-600" },
//               ]}
//             />
//           </div>
//         </section>

//         <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
//           <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//             <CardContent className="p-5 sm:p-6">
//               <div className="flex items-start justify-between gap-4">
//                 <div>
//                   <h2 className="text-lg font-black text-slate-950">
//                     Recent System Activity
//                   </h2>
//                   <p className="mt-1 text-xs text-slate-500">
//                     Latest updates across requests, invoices, POs, expenses,
//                     reimbursements and records.
//                   </p>
//                 </div>
//                 <Activity className="h-5 w-5 text-slate-400" />
//               </div>

//               <div className="mt-5 divide-y divide-slate-100">
//                 {summary.activities.length === 0 ? (
//                   <div className="py-12 text-center">
//                     <CalendarClock className="mx-auto h-7 w-7 text-slate-300" />
//                     <p className="mt-3 text-sm font-semibold text-slate-500">
//                       No recent activity found.
//                     </p>
//                   </div>
//                 ) : (
//                   summary.activities.map((activity) => (
//                     <div
//                       key={activity.id}
//                       className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"
//                     >
//                       <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
//                         <Activity className="h-4 w-4" />
//                       </div>

//                       <div className="min-w-0 flex-1">
//                         <div className="flex flex-wrap items-center gap-2">
//                           <p className="truncate text-sm font-black text-slate-900">
//                             {activity.title}
//                           </p>
//                           <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
//                             {activity.module}
//                           </span>
//                         </div>
//                         <p className="mt-1 truncate text-xs text-slate-500">
//                           {activity.description}
//                         </p>
//                       </div>

//                       <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
//                         <StatusBadge status={activity.status} />
//                         <span className="text-[11px] font-semibold text-slate-400">
//                           {formatRelativeTime(activity.date)}
//                         </span>
//                       </div>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </CardContent>
//           </Card>

//           <div className="space-y-6">
//             <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//               <CardContent className="p-5">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <h2 className="font-black text-slate-950">Financial Health</h2>
//                     <p className="mt-1 text-xs text-slate-500">
//                       Key collection and payment indicators.
//                     </p>
//                   </div>
//                   <Wallet className="h-5 w-5 text-slate-400" />
//                 </div>

//                 <div className="mt-5 space-y-4">
//                   <div>
//                     <div className="flex justify-between text-xs font-semibold text-slate-500">
//                       <span>Invoice Collection</span>
//                       <span>
//                         {summary.invoiceTotalAmount > 0
//                           ? Math.min(
//                               (summary.receivedInvoiceAmount /
//                                 summary.invoiceTotalAmount) *
//                                 100,
//                               100,
//                             ).toFixed(0)
//                           : 0}
//                         %
//                       </span>
//                     </div>
//                     <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
//                       <div
//                         className="h-full rounded-full bg-emerald-500"
//                         style={{
//                           width: `${
//                             summary.invoiceTotalAmount > 0
//                               ? Math.min(
//                                   (summary.receivedInvoiceAmount /
//                                     summary.invoiceTotalAmount) *
//                                     100,
//                                   100,
//                                 )
//                               : 0
//                           }%`,
//                         }}
//                       />
//                     </div>
//                   </div>

//                   <div>
//                     <div className="flex justify-between text-xs font-semibold text-slate-500">
//                       <span>Budget Released</span>
//                       <span>
//                         {summary.budgetTotalAmount > 0
//                           ? Math.min(
//                               (summary.budgetReleasedAmount /
//                                 summary.budgetTotalAmount) *
//                                 100,
//                               100,
//                             ).toFixed(0)
//                           : 0}
//                         %
//                       </span>
//                     </div>
//                     <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
//                       <div
//                         className="h-full rounded-full bg-blue-500"
//                         style={{
//                           width: `${
//                             summary.budgetTotalAmount > 0
//                               ? Math.min(
//                                   (summary.budgetReleasedAmount /
//                                     summary.budgetTotalAmount) *
//                                     100,
//                                   100,
//                                 )
//                               : 0
//                           }%`,
//                         }}
//                       />
//                     </div>
//                   </div>

//                   <div>
//                     <div className="flex justify-between text-xs font-semibold text-slate-500">
//                       <span>Reimbursements Paid</span>
//                       <span>
//                         {summary.reimbursementApproved > 0
//                           ? Math.min(
//                               (summary.reimbursementPaid /
//                                 summary.reimbursementApproved) *
//                                 100,
//                               100,
//                             ).toFixed(0)
//                           : 0}
//                         %
//                       </span>
//                     </div>
//                     <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
//                       <div
//                         className="h-full rounded-full bg-violet-500"
//                         style={{
//                           width: `${
//                             summary.reimbursementApproved > 0
//                               ? Math.min(
//                                   (summary.reimbursementPaid /
//                                     summary.reimbursementApproved) *
//                                     100,
//                                   100,
//                                 )
//                               : 0
//                           }%`,
//                         }}
//                       />
//                     </div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//               <CardContent className="p-5">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <h2 className="font-black text-slate-950">System Snapshot</h2>
//                     <p className="mt-1 text-xs text-slate-500">
//                       Record counts across connected modules.
//                     </p>
//                   </div>
//                   <CheckCircle2 className="h-5 w-5 text-slate-400" />
//                 </div>

//                 <div className="mt-5 grid grid-cols-2 gap-3">
//                   {[
//                     ["Requests", data.invoiceRequests.length],
//                     ["Estimates", data.estimates.length],
//                     ["Invoices", data.estimateInvoices.length],
//                     ["Payments", data.payments.length],
//                     ["POs", data.purchaseOrders.length],
//                     ["Expenses", data.expenseSheets.length],
//                     ["Claims", data.directClaims.length + data.meetingClaims.length],
//                     ["Records", data.records.length],
//                   ].map(([label, value]) => (
//                     <div key={String(label)} className="rounded-2xl bg-slate-50 p-3">
//                       <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
//                         {label}
//                       </p>
//                       <p className="mt-1 text-xl font-black text-slate-950">
//                         {Number(value).toLocaleString()}
//                       </p>
//                     </div>
//                   ))}
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </section>
//       </div>

//       {canCreateInvoices && (
//         <InvoiceRequestModal
//           isOpen={isInvoiceModalOpen}
//           onClose={() => setIsInvoiceModalOpen(false)}
//           onSuccess={() => {
//             setIsInvoiceModalOpen(false);
//             loadDashboardData(true);
//           }}
//         />
//       )}
//     </div>
//   );
// }

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import InvoiceRequestModal from "@/components/BudgetRequestModal";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Download,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Landmark,
  ListChecks,
  PackageCheck,
  Plus,
  ReceiptText,
  RefreshCcw,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PANEL_ID = "IEDGE-SYSTEM";

type AnyRow = Record<string, any> & { id: string };

type ActivityItem = {
  id: string;
  module: string;
  title: string;
  description: string;
  status: string;
  date: Date | null;
};

type MoneyEvent = {
  date: Date | null;
  amount: number;
};

type DashboardData = {
  invoiceRequests: AnyRow[];
  estimates: AnyRow[];
  estimateInvoices: AnyRow[];
  payments: AnyRow[];
  expenseSheets: AnyRow[];
  directClaims: AnyRow[];
  meetingClaims: AnyRow[];
  records: AnyRow[];
  purchaseOrders: AnyRow[];
  manualEntries: AnyRow[];
  openingBalance: number;
};

const EMPTY_DATA: DashboardData = {
  invoiceRequests: [],
  estimates: [],
  estimateInvoices: [],
  payments: [],
  expenseSheets: [],
  directClaims: [],
  meetingClaims: [],
  records: [],
  purchaseOrders: [],
  manualEntries: [],
  openingBalance: 0,
};

const normalizeText = (value: any) =>
  String(value || "")
    .trim()
    .toLowerCase();

const safeNumber = (value: any): number => {
  if (value === null || value === undefined || value === "") return 0;

  const parsed =
    typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));

  return Number.isFinite(parsed) ? parsed : 0;
};

const firstText = (...values: any[]): string => {
  for (const value of values) {
    if (value === null || value === undefined || typeof value === "object") {
      continue;
    }

    const text = String(value).trim();
    if (text) return text;
  }

  return "";
};

const toDate = (value: any): Date | null => {
  if (!value) return null;

  try {
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
        const date = new Date(
          Number(ymd[1]),
          Number(ymd[2]) - 1,
          Number(ymd[3]),
        );
        return Number.isNaN(date.getTime()) ? null : date;
      }

      const dmy = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
      if (dmy) {
        const date = new Date(
          Number(dmy[3]),
          Number(dmy[2]) - 1,
          Number(dmy[1]),
        );
        return Number.isNaN(date.getTime()) ? null : date;
      }
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

const getEntityDate = (source: any): Date | null =>
  toDate(source?.paymentReleasedAt) ||
  toDate(source?.releasePaymentAt) ||
  toDate(source?.releasedAt) ||
  toDate(source?.paymentDate) ||
  toDate(source?.submittedAt) ||
  toDate(source?.createdAt) ||
  toDate(source?.updatedAt) ||
  toDate(source?.invoiceDate) ||
  toDate(source?.date) ||
  toDate(source?.issueDate) ||
  null;

const getRequestDate = (source: any): Date | null =>
  toDate(source?.submitDate) ||
  toDate(source?.submittedAt) ||
  toDate(source?.submissionDate) ||
  toDate(source?.requestDate) ||
  toDate(source?.createdAt) ||
  toDate(source?.date) ||
  toDate(source?.updatedAt) ||
  null;

const formatPKR = (value: any): string =>
  `Rs ${safeNumber(value).toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const formatCompactPKR = (value: any): string => {
  const number = safeNumber(value);

  if (Math.abs(number) >= 1_000_000_000) {
    return `Rs ${(number / 1_000_000_000).toFixed(1)}B`;
  }

  if (Math.abs(number) >= 1_000_000) {
    return `Rs ${(number / 1_000_000).toFixed(1)}M`;
  }

  if (Math.abs(number) >= 1_000) {
    return `Rs ${(number / 1_000).toFixed(1)}K`;
  }

  return formatPKR(number);
};

const formatRelativeTime = (date: Date | null): string => {
  if (!date) return "Date unavailable";

  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60_000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffMinutes < 1_440) return `${Math.floor(diffMinutes / 60)} hr ago`;
  if (diffMinutes < 10_080)
    return `${Math.floor(diffMinutes / 1_440)} days ago`;

  return date.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const humanize = (value: any): string =>
  String(value || "Unknown")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getApprovedRequestAmount = (request: any): number =>
  safeNumber(
    request?.approvedAmount ??
      request?.totalApprovedAmount ??
      request?.approvedTotal ??
      request?.totalAmount ??
      request?.amount,
  );

const getReleaseAmount = (entry: any): number =>
  safeNumber(
    entry?.amount ??
      entry?.releaseAmount ??
      entry?.releasedAmount ??
      entry?.paymentAmount,
  );

const getPaymentReleaseHistory = (request: any): any[] => {
  const history = Array.isArray(request?.paymentReleaseHistory)
    ? request.paymentReleaseHistory
    : [];

  const validHistory = history.filter(
    (entry: any) => getReleaseAmount(entry) > 0,
  );

  if (validHistory.length > 0) return validHistory;

  const legacy = request?.paymentDetails || request?.latestPaymentRelease;
  if (legacy && getReleaseAmount(legacy) > 0) {
    return [
      {
        ...legacy,
        releasedAt:
          legacy?.releasedAt ||
          request?.paymentReleasedAt ||
          request?.releasePaymentAt ||
          request?.updatedAt,
      },
    ];
  }

  return [];
};

const getReleasedRequestAmount = (request: any): number => {
  const explicit = safeNumber(request?.totalReleasedAmount);
  if (explicit > 0) return explicit;

  const historyTotal = getPaymentReleaseHistory(request).reduce(
    (sum, entry) => sum + getReleaseAmount(entry),
    0,
  );

  if (historyTotal > 0) return historyTotal;

  const status = normalizeText(request?.status);
  if (
    ["payment_released", "released"].includes(status) ||
    request?.paymentReleased === true
  ) {
    return getApprovedRequestAmount(request);
  }

  return safeNumber(
    request?.releasedAmount ?? request?.paidAmount ?? request?.paymentAmount,
  );
};

const getRemainingRequestAmount = (request: any): number => {
  if (
    request?.remainingReleaseAmount !== undefined &&
    request?.remainingReleaseAmount !== null
  ) {
    return Math.max(safeNumber(request.remainingReleaseAmount), 0);
  }

  return Math.max(
    getApprovedRequestAmount(request) - getReleasedRequestAmount(request),
    0,
  );
};

const isFullyReleased = (request: any): boolean => {
  const approved = getApprovedRequestAmount(request);
  const released = getReleasedRequestAmount(request);
  const remaining = getRemainingRequestAmount(request);
  const status = normalizeText(request?.status);

  if (approved > 0 && (remaining <= 0.009 || released >= approved - 0.009)) {
    return true;
  }

  return ["payment_released", "released"].includes(status);
};

const isPartiallyReleased = (request: any): boolean =>
  getReleasedRequestAmount(request) > 0 && !isFullyReleased(request);

const getInvoiceStatus = (invoice: any): string => {
  const raw = normalizeText(invoice?.status || invoice?.paymentStatus);

  if (raw === "paid") return "paid";
  if (["partially paid", "partially_paid", "partial"].includes(raw)) {
    return "partial";
  }

  return "unpaid";
};

const getClaimStatus = (claim: any): string => {
  const status = normalizeText(claim?.status || claim?.approvalStatus);

  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  return "pending";
};

const getClaimAmount = (claim: any): number =>
  safeNumber(
    claim?.claimAmount ??
      claim?.amount ??
      claim?.approvedAmount ??
      claim?.paidAmount,
  );

const getClaimPaidAmount = (claim: any): number => {
  if (normalizeText(claim?.paymentStatus) !== "paid") return 0;

  return safeNumber(
    claim?.paidAmount ??
      claim?.approvedAmount ??
      claim?.claimAmount ??
      claim?.amount,
  );
};

const getExpenseAmount = (expense: any): number =>
  safeNumber(expense?.totalAmount ?? expense?.amount);

const getPurchaseOrderAmount = (purchaseOrder: any): number =>
  safeNumber(
    purchaseOrder?.totalAmount ?? purchaseOrder?.total ?? purchaseOrder?.amount,
  );

const getEstimateAmount = (estimate: any): number =>
  safeNumber(estimate?.total ?? estimate?.totalAmount ?? estimate?.amount);

const getEstimateInvoiceAmount = (invoice: any): number =>
  safeNumber(invoice?.total ?? invoice?.totalAmount ?? invoice?.amount);

const getVendorNames = (request: any): string[] => {
  const names = new Set<string>();

  const direct = firstText(
    request?.vendorName,
    request?.supplierName,
    request?.payeeName,
    request?.payee,
  );
  if (direct) names.add(direct);

  const items = [
    ...(Array.isArray(request?.approvalItems) ? request.approvalItems : []),
    ...(Array.isArray(request?.lineItems) ? request.lineItems : []),
    ...(Array.isArray(request?.items) ? request.items : []),
  ];

  items.forEach((item: any) => {
    const name = firstText(
      item?.vendor,
      item?.vendorName,
      item?.supplier,
      item?.supplierName,
      item?.original?.vendor,
      item?.original?.supplier,
    );

    if (name) names.add(name);
  });

  return Array.from(names);
};

const isOverdueDate = (value: any): boolean => {
  const date = toDate(value);
  if (!date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return date < today;
};

const snapshotToRows = (snapshot: {
  docs: QueryDocumentSnapshot<DocumentData>[];
}): AnyRow[] =>
  snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));

type FinancialSnapshot = {
  totalReceivable: number;
  totalPayable: number;
  totalVendorDue: number;
  overallProfit: number;
  overallLoss: number;
  totalIncome: number;
  totalExpense: number;
  paidInvoiceRevenue: number;
  paidInvoiceVendorCost: number;
  paidInvoiceProfit: number;
};

const SNAPSHOT_ROLES = new Set([
  "finance",
  "finance_admin",
  "financial_admin",
  "operation",
  "operations",
  "operational_admin",
  "operation_admin",
]);

const FINANCE_METER_ROLES = new Set([
  "main_admin",
  "mainadmin",
  "finance",
  "finance_admin",
  "financial_admin",
  "operation",
  "operations",
  "operational_admin",
  "operation_admin",
]);

type FinanceMeterLevel = "normal" | "increasing" | "high" | "critical";

type FinanceMeterState = {
  percentage: number;
  level: FinanceMeterLevel;
  label: string;
  description: string;
};

const getFinanceMeterState = (
  totalDueValue: any,
  outstandingValue: any,
): FinanceMeterState => {
  const totalDue = Math.max(safeNumber(totalDueValue), 0);
  const outstanding = Math.max(safeNumber(outstandingValue), 0);
  const percentage =
    totalDue > 0 ? Math.min((outstanding / totalDue) * 100, 100) : 0;

  if (percentage >= 60) {
    return {
      percentage,
      level: "critical",
      label: "Critical",
      description:
        "Vendor outstanding dues have reached a critical level. Immediate payment attention is recommended.",
    };
  }

  if (percentage >= 40) {
    return {
      percentage,
      level: "high",
      label: "High Outstanding",
      description:
        "Vendor outstanding dues are high and require close monitoring and payment planning.",
    };
  }

  if (percentage > 30) {
    return {
      percentage,
      level: "increasing",
      label: "Increasing",
      description:
        "Vendor outstanding dues are increasing and have moved above the normal range.",
    };
  }

  return {
    percentage,
    level: "normal",
    label: "Normal",
    description: "Vendor outstanding dues are within the normal range.",
  };
};

const buildFinancialSnapshot = (source: DashboardData): FinancialSnapshot => {
  const incomeEvents: MoneyEvent[] = [];
  const expenseEvents: MoneyEvent[] = [];

  source.payments.forEach((payment) => {
    const amount = safeNumber(payment?.amount);
    const date =
      toDate(payment?.paymentDate) ||
      toDate(payment?.createdAt) ||
      toDate(payment?.updatedAt);

    if (amount > 0) incomeEvents.push({ amount, date });

    const taxDebit =
      safeNumber(payment?.whtAmount) + safeNumber(payment?.sstAmount);
    if (taxDebit > 0) expenseEvents.push({ amount: taxDebit, date });
  });

  source.invoiceRequests.forEach((request) => {
    const history = getPaymentReleaseHistory(request);

    if (history.length > 0) {
      history.forEach((release) => {
        const amount = getReleaseAmount(release);
        if (amount <= 0) return;

        expenseEvents.push({
          amount,
          date:
            toDate(release?.releasedAt) ||
            toDate(release?.createdAt) ||
            getEntityDate(request),
        });
      });
      return;
    }

    const releasedAmount = getReleasedRequestAmount(request);
    if (releasedAmount > 0) {
      expenseEvents.push({
        amount: releasedAmount,
        date: getEntityDate(request),
      });
    }
  });

  [...source.directClaims, ...source.meetingClaims].forEach((claim) => {
    const paidAmount = getClaimPaidAmount(claim);
    if (paidAmount <= 0) return;

    expenseEvents.push({
      amount: paidAmount,
      date:
        toDate(claim?.paymentReleasedAt) ||
        toDate(claim?.updatedAt) ||
        toDate(claim?.meetingUpdatedAt) ||
        getEntityDate(claim),
    });
  });

  source.records.forEach((record) => {
    const chequeAmount = safeNumber(record?.chequeAmount);
    if (chequeAmount > 0) {
      expenseEvents.push({
        amount: chequeAmount,
        date: getEntityDate(record),
      });
    }
  });

  source.manualEntries.forEach((entry) => {
    const date = toDate(entry?.date) || getEntityDate(entry);
    const debit = safeNumber(entry?.debit);
    const credit = safeNumber(entry?.credit);

    if (debit > 0) expenseEvents.push({ amount: debit, date });
    if (credit > 0) incomeEvents.push({ amount: credit, date });
  });

  const totalIncome = incomeEvents.reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = expenseEvents.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  const invoiceTotalAmount = source.estimateInvoices.reduce(
    (sum, invoice) => sum + getEstimateInvoiceAmount(invoice),
    0,
  );
  const receivedInvoiceAmount = source.payments.reduce(
    (sum, payment) => sum + safeNumber(payment?.amount),
    0,
  );

  const totalReceivable = Math.max(
    invoiceTotalAmount - receivedInvoiceAmount,
    0,
  );
  const totalVendorDue = source.invoiceRequests.reduce(
    (sum, request) => sum + getApprovedRequestAmount(request),
    0,
  );
  const totalPayable = source.invoiceRequests.reduce(
    (sum, request) => sum + getRemainingRequestAmount(request),
    0,
  );

  const paidInvoiceRevenue = source.estimateInvoices
    .filter((invoice) => getInvoiceStatus(invoice) === "paid")
    .reduce((sum, invoice) => sum + getEstimateInvoiceAmount(invoice), 0);

  const paidInvoiceVendorCost = source.invoiceRequests.reduce(
    (sum, request) => sum + getReleasedRequestAmount(request),
    0,
  );

  const paidInvoiceProfit = Math.max(
    paidInvoiceRevenue - paidInvoiceVendorCost,
    0,
  );

  const netResult = totalIncome - totalExpense;

  return {
    totalReceivable,
    totalPayable,
    totalVendorDue,
    overallProfit: Math.max(netResult, 0),
    overallLoss: Math.max(-netResult, 0),
    totalIncome,
    totalExpense,
    paidInvoiceRevenue,
    paidInvoiceVendorCost,
    paidInvoiceProfit,
  };
};

const loadFinancialSnapshotSourceData = async (): Promise<DashboardData> => {
  const readRows = async (path: string[]): Promise<AnyRow[]> => {
    const snapshot = await getDocs(collection(db, path[0], ...path.slice(1)));
    return snapshotToRows(snapshot as any);
  };

  const [
    invoiceRequests,
    estimateInvoices,
    payments,
    directClaims,
    records,
    manualEntries,
  ] = await Promise.all([
    readRows(["Panels", PANEL_ID, "invoiceRequests"]),
    readRows(["Panels", PANEL_ID, "estimateInvoices"]),
    readRows(["Panels", PANEL_ID, "payments"]),
    readRows(["Panels", PANEL_ID, "claimReimbursements"]),
    readRows(["Panels", PANEL_ID, "Record"]),
    readRows(["Panels", PANEL_ID, "accountStatementManualEntries"]),
  ]);

  let meetingClaims: AnyRow[] = [];
  const meetingSnapshot = await getDocs(collectionGroup(db, "meetingUpdates"));

  meetingClaims = meetingSnapshot.docs
    .map((meetingDocument) => ({
      id: meetingDocument.id,
      path: meetingDocument.ref.path,
      ...meetingDocument.data(),
    }))
    .filter((meeting: any) => meeting?.reimbursement?.enabled)
    .map((meeting: any) => ({
      id: meeting.id,
      path: meeting.path,
      ...meeting.reimbursement,
      submittedAt:
        meeting.reimbursement?.approvalSubmittedAt ||
        meeting.reimbursement?.submittedAt ||
        meeting.submittedAt ||
        meeting.createdAt ||
        null,
      meetingUpdatedAt: meeting.updatedAt || null,
    }));

  return {
    ...EMPTY_DATA,
    invoiceRequests,
    estimateInvoices,
    payments,
    directClaims,
    meetingClaims,
    records,
    manualEntries,
  };
};

const sanitizePdfText = (value: any): string =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const downloadFinancialSnapshotPdf = ({
  snapshot,
  generatedBy,
  role,
}: {
  snapshot: FinancialSnapshot;
  generatedBy: string;
  role: string;
}) => {
  const encoder = new TextEncoder();
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const commands: string[] = [];

  const text = (
    value: string,
    x: number,
    y: number,
    size: number,
    font: "F1" | "F2" = "F1",
    color = "0.059 0.090 0.165",
  ) => {
    commands.push(
      `BT /${font} ${size} Tf ${color} rg 1 0 0 1 ${x} ${y} Tm (${sanitizePdfText(value)}) Tj ET`,
    );
  };

  const rect = (
    x: number,
    y: number,
    width: number,
    height: number,
    fill: string,
    stroke?: string,
  ) => {
    if (stroke) {
      commands.push(
        `q ${fill} rg ${stroke} RG 0.8 w ${x} ${y} ${width} ${height} re B Q`,
      );
    } else {
      commands.push(`q ${fill} rg ${x} ${y} ${width} ${height} re f Q`);
    }
  };

  const drawMetric = ({
    x,
    y,
    label,
    value,
    accent,
    note,
  }: {
    x: number;
    y: number;
    label: string;
    value: number;
    accent: string;
    note: string;
  }) => {
    rect(x, y, 241, 112, "0.984 0.988 0.996", "0.886 0.910 0.941");
    rect(x, y, 6, 112, accent);
    text(label.toUpperCase(), x + 20, y + 82, 9, "F2", "0.392 0.455 0.545");
    text(formatPKR(value), x + 20, y + 48, 20, "F2");
    text(note, x + 20, y + 22, 8.5, "F1", "0.392 0.455 0.545");
  };

  rect(0, 690, pageWidth, pageHeight - 690, "0.059 0.090 0.165");
  text("FINANCIAL SNAPSHOT", 48, 790, 25, "F2", "1 1 1");
  text(
    "Quick summary of receivables, payables, profit and loss",
    48,
    762,
    11,
    "F1",
    "0.797 0.835 0.882",
  );
  text(
    `Generated: ${new Date().toLocaleString("en-PK")}`,
    48,
    728,
    9,
    "F1",
    "0.797 0.835 0.882",
  );
  text(
    `Prepared by: ${generatedBy} (${humanize(role)})`,
    48,
    710,
    9,
    "F1",
    "0.797 0.835 0.882",
  );

  drawMetric({
    x: 48,
    y: 548,
    label: "Total Receivable From Clients",
    value: snapshot.totalReceivable,
    accent: "0.231 0.510 0.965",
    note: "Outstanding client invoice value",
  });
  drawMetric({
    x: 306,
    y: 548,
    label: "Total Payable To Vendors",
    value: snapshot.totalPayable,
    accent: "0.961 0.620 0.043",
    note: "Remaining approved vendor releases",
  });
  drawMetric({
    x: 48,
    y: 416,
    label: "Overall Profit",
    value: snapshot.overallProfit,
    accent: "0.063 0.725 0.506",
    note: "Positive recorded income less expenses",
  });
  drawMetric({
    x: 306,
    y: 416,
    label: "Overall Loss",
    value: snapshot.overallLoss,
    accent: "0.957 0.247 0.369",
    note: "Expense excess over recorded income",
  });

  const isProfit = snapshot.overallProfit > 0;
  const isLoss = snapshot.overallLoss > 0;
  const resultLabel = isProfit
    ? "NET RESULT: PROFIT"
    : isLoss
      ? "NET RESULT: LOSS"
      : "NET RESULT: BREAK EVEN";
  const resultValue = isProfit
    ? snapshot.overallProfit
    : isLoss
      ? snapshot.overallLoss
      : 0;
  const resultFill = isProfit
    ? "0.925 0.992 0.961"
    : isLoss
      ? "1 0.945 0.949"
      : "0.945 0.961 0.980";
  const resultColor = isProfit
    ? "0.018 0.498 0.349"
    : isLoss
      ? "0.745 0.078 0.165"
      : "0.278 0.333 0.412";

  rect(48, 304, 499, 82, resultFill);
  text(resultLabel, 66, 356, 10, "F2", resultColor);
  text(formatPKR(resultValue), 66, 326, 18, "F2", resultColor);
  text(
    `Recorded income: ${formatPKR(snapshot.totalIncome)}`,
    300,
    345,
    8.5,
    "F1",
    "0.392 0.455 0.545",
  );
  text(
    `Recorded expenses: ${formatPKR(snapshot.totalExpense)}`,
    300,
    325,
    8.5,
    "F1",
    "0.392 0.455 0.545",
  );

  rect(48, 258, 499, 38, "0.925 0.992 0.961");
  text("PROFIT FROM PAID INVOICES", 66, 274, 9, "F2", "0.018 0.498 0.349");
  text(
    formatPKR(snapshot.paidInvoiceProfit),
    363,
    272,
    13,
    "F2",
    "0.018 0.498 0.349",
  );

  text("REPORT BASIS", 48, 224, 11, "F2");
  commands.push("q 0.886 0.910 0.941 RG 0.8 w 48 214 m 547 214 l S Q");
  text(
    "Receivable = client invoice totals less recorded client payments.",
    48,
    190,
    9,
    "F1",
    "0.278 0.333 0.412",
  );
  text(
    "Payable = approved budget request value remaining for vendor release.",
    48,
    171,
    9,
    "F1",
    "0.278 0.333 0.412",
  );
  text(
    "Profit/Loss = recorded cash income less recorded expenses and releases.",
    48,
    152,
    9,
    "F1",
    "0.278 0.333 0.412",
  );
  text(
    "Paid invoice profit = paid invoice value less vendor payments released to date.",
    48,
    133,
    9,
    "F1",
    "0.278 0.333 0.412",
  );
  text(
    "This snapshot is generated from live dashboard data at download time.",
    48,
    114,
    9,
    "F1",
    "0.278 0.333 0.412",
  );

  commands.push("q 0.886 0.910 0.941 RG 0.8 w 48 78 m 547 78 l S Q");
  text(
    "IEDGE SYSTEM - CONFIDENTIAL FINANCIAL SUMMARY",
    48,
    56,
    8,
    "F2",
    "0.392 0.455 0.545",
  );
  text("Page 1 of 1", 493, 56, 8, "F1", "0.392 0.455 0.545");

  const streamData = `${commands.join("\n")}\n`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${encoder.encode(streamData).length} >>\nstream\n${streamData}endstream`,
  ];

  let pdf = "%PDF-1.4\n% IEDGE Financial Snapshot\n";
  const offsets: number[] = [0];

  objects.forEach((object, index) => {
    offsets[index + 1] = encoder.encode(pdf).length;
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  const blob = new Blob([encoder.encode(pdf)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const stamp = new Date()
    .toISOString()
    .replace(/[:T]/g, "-")
    .replace(/\.\d{3}Z$/, "");

  link.href = url;
  link.download = `financial-snapshot-${stamp}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
};

const FULL_DASHBOARD_ROLES = new Set([
  "main_admin",
  "mainadmin",
  "finance",
  "finance_admin",
  "financial_admin",
]);

const SCOPE_FIELD_NAMES = [
  "id",
  "uid",
  "userId",
  "userUID",
  "profileId",
  "employeeId",
  "employeeUID",
  "email",
  "userEmail",
  "employeeEmail",
  "displayName",
  "fullName",
  "name",
  "createdBy",
  "createdById",
  "createdByUid",
  "createdByEmail",
  "creatorId",
  "creatorEmail",
  "submittedBy",
  "submittedById",
  "submittedByUid",
  "submittedByEmail",
  "requestedBy",
  "requestedById",
  "requestedByEmail",
  "owner",
  "ownerId",
  "ownerEmail",
  "assignedTo",
  "assignedToId",
  "assignedUserId",
  "assignedUserEmail",
  "assignee",
  "assigneeId",
  "assigneeEmail",
  "personId",
  "personEmail",
  "salesPersonId",
  "salesPersonEmail",
  "teamMemberId",
  "teamMemberEmail",
  "department",
  "departmentId",
  "team",
  "teamId",
  "role",
  "createdByRole",
  "assignedRole",
  "projectId",
  "projectCode",
  "assignedProjectId",
];

const NESTED_SCOPE_FIELD_NAMES = [
  "createdByUser",
  "submittedByUser",
  "requestedByUser",
  "ownerUser",
  "assignedUser",
  "assigneeUser",
  "employee",
  "user",
  "profile",
  "teamMembers",
  "assignedUsers",
  "assignedToUsers",
  "members",
  "assignedProjects",
  "projectIds",
  "allowedProjectIds",
];

const addScopeValue = (target: Set<string>, value: any) => {
  if (value === null || value === undefined || value === "") return;

  if (Array.isArray(value)) {
    value.forEach((item) => addScopeValue(target, item));
    return;
  }

  if (typeof value === "object") {
    SCOPE_FIELD_NAMES.forEach((field) => addScopeValue(target, value?.[field]));
    return;
  }

  const normalized = normalizeText(value);
  if (normalized) target.add(normalized);
};

const collectScopeValues = (source: any): Set<string> => {
  const values = new Set<string>();
  if (!source) return values;

  SCOPE_FIELD_NAMES.forEach((field) => addScopeValue(values, source?.[field]));
  NESTED_SCOPE_FIELD_NAMES.forEach((field) =>
    addScopeValue(values, source?.[field]),
  );

  return values;
};

const rowMatchesUserScope = (row: AnyRow, profile: any): boolean => {
  const profileScope = collectScopeValues(profile);
  if (profileScope.size === 0) return false;

  const rowScope = collectScopeValues(row);
  for (const value of rowScope) {
    if (profileScope.has(value)) return true;
  }

  return false;
};

type RestrictedActivity = {
  id: string;
  module: string;
  title: string;
  description: string;
  status: string;
  date: Date | null;
};

const getRestrictedRoleConfig = (roleKey: string) => {
  if (
    [
      "operation",
      "operations",
      "operational_admin",
      "operation_admin",
    ].includes(roleKey)
  ) {
    return {
      title: "Operations Workspace",
      description:
        "Track the requests, estimates, expenses and reimbursements assigned to your operational scope.",
      visibleModules: ["requests", "estimates", "expenses", "claims"],
    };
  }

  if (["sales", "sales_admin", "business_development"].includes(roleKey)) {
    return {
      title: "Sales Workspace",
      description:
        "Track your estimates, client invoices, budget requests and submitted expenses without finance-level information.",
      visibleModules: ["estimates", "invoices", "requests", "expenses"],
    };
  }

  if (["creative", "creative_team", "design", "production"].includes(roleKey)) {
    return {
      title: "Creative Workspace",
      description:
        "View your assigned requests, submitted expenses, reimbursement claims and recent workflow updates.",
      visibleModules: ["requests", "expenses", "claims", "activity"],
    };
  }

  return {
    title: "My Workspace",
    description:
      "View only the operational records assigned to your account, team, department or projects.",
    visibleModules: ["requests", "estimates", "expenses", "claims"],
  };
};

function RestrictedDashboard({
  userProfile,
  roleKey,
  data,
  refreshing,
  lastUpdated,
  unavailableModules,
  canCreateInvoices,
  canDownloadSnapshot,
  canViewFinanceMeter,
  snapshotGenerating,
  financialSnapshot,
  onRefresh,
  onCreateBudgetRequest,
  onDownloadSnapshot,
}: {
  userProfile: any;
  roleKey: string;
  data: DashboardData;
  refreshing: boolean;
  lastUpdated: Date | null;
  unavailableModules: string[];
  canCreateInvoices: boolean;
  canDownloadSnapshot: boolean;
  canViewFinanceMeter: boolean;
  snapshotGenerating: boolean;
  financialSnapshot: FinancialSnapshot | null;
  onRefresh: () => void;
  onCreateBudgetRequest: () => void;
  onDownloadSnapshot: () => void;
}) {
  const config = getRestrictedRoleConfig(roleKey);

  const dashboard = useMemo(() => {
    const requestsPending = data.invoiceRequests.filter((request) => {
      const status = normalizeText(request?.status);
      return ![
        "approved",
        "rejected",
        "returned_to_creator",
        "changes_requested",
        "payment_released",
        "released",
        "completed",
      ].includes(status);
    }).length;

    const requestsReturned = data.invoiceRequests.filter((request) =>
      ["rejected", "returned_to_creator", "changes_requested"].includes(
        normalizeText(request?.status),
      ),
    ).length;

    const requestsCompleted = data.invoiceRequests.filter((request) =>
      [
        "approved",
        "payment_released",
        "released",
        "completed",
        "paid",
      ].includes(normalizeText(request?.status)),
    ).length;

    const claims = [...data.directClaims, ...data.meetingClaims];
    const pendingClaims = claims.filter(
      (claim) => getClaimStatus(claim) === "pending",
    ).length;

    const activities: RestrictedActivity[] = [
      ...data.invoiceRequests.map((request) => ({
        id: `request-${request.id}`,
        module: "Budget Request",
        title: firstText(
          request?.requestId,
          request?.title,
          request?.subject,
          "Budget request",
        ),
        description: firstText(
          request?.projectName,
          request?.project,
          request?.clientName,
          "Workflow updated",
        ),
        status: request?.status || "submitted",
        date: getRequestDate(request),
      })),
      ...data.estimates.map((estimate) => ({
        id: `estimate-${estimate.id}`,
        module: "Estimate",
        title: firstText(
          estimate?.estimateNo,
          estimate?.title,
          estimate?.subject,
          "Estimate",
        ),
        description: firstText(
          estimate?.projectName,
          estimate?.clientName,
          estimate?.client,
          "Estimate updated",
        ),
        status: estimate?.status || "draft",
        date: getEntityDate(estimate),
      })),
      ...data.estimateInvoices.map((invoice) => ({
        id: `invoice-${invoice.id}`,
        module: "Client Invoice",
        title: firstText(invoice?.invoiceNo, invoice?.subject, "Invoice"),
        description: firstText(
          invoice?.projectName,
          invoice?.clientName,
          invoice?.client,
          "Invoice updated",
        ),
        status: invoice?.status || invoice?.paymentStatus || "unpaid",
        date: getEntityDate(invoice),
      })),
      ...data.expenseSheets.map((expense) => ({
        id: `expense-${expense.id}`,
        module: "Expense Sheet",
        title: firstText(
          expense?.expenseId,
          expense?.title,
          expense?.projectName,
          "Expense sheet",
        ),
        description: firstText(
          expense?.projectName,
          expense?.project,
          expense?.clientName,
          "Expense submitted",
        ),
        status: expense?.status || expense?.paymentStatus || "submitted",
        date: getEntityDate(expense),
      })),
      ...claims.map((claim) => ({
        id: `claim-${claim.id}`,
        module: "Reimbursement",
        title: firstText(
          claim?.description,
          claim?.foodItem,
          claim?.claimType,
          "Reimbursement claim",
        ),
        description: firstText(
          claim?.projectName,
          claim?.meetingTitle,
          "Claim updated",
        ),
        status:
          normalizeText(claim?.paymentStatus) === "paid"
            ? "paid"
            : claim?.status || claim?.approvalStatus || "pending",
        date: getEntityDate(claim),
      })),
    ]
      .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))
      .slice(0, 10);

    return {
      requestsPending,
      requestsReturned,
      requestsCompleted,
      pendingClaims,
      activities,
      totalWorkspaceRecords:
        data.invoiceRequests.length +
        data.estimates.length +
        data.estimateInvoices.length +
        data.expenseSheets.length +
        claims.length,
      claimsCount: claims.length,
    };
  }, [data]);

  const moduleCards = [
    {
      key: "requests",
      title: "My Budget Requests",
      subtitle: "Requests created by or assigned to your user scope.",
      icon: FileText,
      items: [
        { label: "Total", value: String(data.invoiceRequests.length) },
        { label: "In Progress", value: String(dashboard.requestsPending) },
        {
          label: "Returned",
          value: String(dashboard.requestsReturned),
          className: "text-rose-600",
        },
        {
          label: "Completed",
          value: String(dashboard.requestsCompleted),
          className: "text-emerald-600",
        },
      ],
    },
    {
      key: "estimates",
      title: "My Estimates",
      subtitle: "Estimates assigned to your account, team or projects.",
      icon: FileSpreadsheet,
      items: [
        { label: "Total", value: String(data.estimates.length) },
        {
          label: "Approved",
          value: String(
            data.estimates.filter(
              (item) => normalizeText(item?.status) === "approved",
            ).length,
          ),
          className: "text-emerald-600",
        },
        {
          label: "Invoiced",
          value: String(
            data.estimates.filter((item) =>
              ["invoiced", "payment received"].includes(
                normalizeText(item?.status),
              ),
            ).length,
          ),
          className: "text-blue-600",
        },
        {
          label: "Other",
          value: String(
            data.estimates.filter(
              (item) =>
                !["approved", "invoiced", "payment received"].includes(
                  normalizeText(item?.status),
                ),
            ).length,
          ),
        },
      ],
    },
    {
      key: "invoices",
      title: "My Client Invoices",
      subtitle: "Invoice workflow status without financial totals.",
      icon: ReceiptText,
      items: [
        { label: "Total", value: String(data.estimateInvoices.length) },
        {
          label: "Paid",
          value: String(
            data.estimateInvoices.filter(
              (item) => getInvoiceStatus(item) === "paid",
            ).length,
          ),
          className: "text-emerald-600",
        },
        {
          label: "Partial",
          value: String(
            data.estimateInvoices.filter(
              (item) => getInvoiceStatus(item) === "partial",
            ).length,
          ),
          className: "text-blue-600",
        },
        {
          label: "Unpaid",
          value: String(
            data.estimateInvoices.filter(
              (item) => getInvoiceStatus(item) === "unpaid",
            ).length,
          ),
          className: "text-amber-600",
        },
      ],
    },
    {
      key: "expenses",
      title: "My Expense Sheets",
      subtitle: "Expense sheets submitted by or assigned to you.",
      icon: CreditCard,
      items: [
        { label: "Total", value: String(data.expenseSheets.length) },
        {
          label: "Pending",
          value: String(
            data.expenseSheets.filter((item) =>
              normalizeText(item?.status || item?.paymentStatus).includes(
                "pending",
              ),
            ).length,
          ),
          className: "text-amber-600",
        },
        {
          label: "Approved",
          value: String(
            data.expenseSheets.filter((item) =>
              normalizeText(item?.status || item?.paymentStatus).includes(
                "approved",
              ),
            ).length,
          ),
          className: "text-emerald-600",
        },
        {
          label: "Other",
          value: String(
            data.expenseSheets.filter(
              (item) =>
                !normalizeText(item?.status || item?.paymentStatus).includes(
                  "pending",
                ) &&
                !normalizeText(item?.status || item?.paymentStatus).includes(
                  "approved",
                ),
            ).length,
          ),
        },
      ],
    },
    {
      key: "claims",
      title: "My Reimbursements",
      subtitle: "Your submitted and assigned reimbursement claims.",
      icon: Users,
      items: [
        { label: "Total", value: String(dashboard.claimsCount) },
        {
          label: "Pending",
          value: String(dashboard.pendingClaims),
          className: "text-amber-600",
        },
        {
          label: "Approved",
          value: String(
            [...data.directClaims, ...data.meetingClaims].filter(
              (item) => getClaimStatus(item) === "approved",
            ).length,
          ),
          className: "text-emerald-600",
        },
        {
          label: "Rejected",
          value: String(
            [...data.directClaims, ...data.meetingClaims].filter(
              (item) => getClaimStatus(item) === "rejected",
            ).length,
          ),
          className: "text-rose-600",
        },
      ],
    },
    {
      key: "activity",
      title: "Workflow Activity",
      subtitle: "Recent updates visible inside your role scope.",
      icon: Activity,
      items: [
        { label: "Recent Updates", value: String(dashboard.activities.length) },
        {
          label: "Workspace Records",
          value: String(dashboard.totalWorkspaceRecords),
        },
        {
          label: "Pending Requests",
          value: String(dashboard.requestsPending),
          className: "text-amber-600",
        },
        {
          label: "Returned Requests",
          value: String(dashboard.requestsReturned),
          className: "text-rose-600",
        },
      ],
    },
  ].filter((card) => config.visibleModules.includes(card.key));

  return (
    <div className="min-h-screen bg-slate-50/80 p-4 text-slate-900 sm:p-6">
      <div className="mx-auto space-y-6">
        <section className="overflow-hidden rounded-[32px] bg-slate-950 p-6 text-white shadow-xl shadow-slate-200/70 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">
                <BadgeCheck className="h-3.5 w-3.5" />
                Role-Based Access
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                {config.title}
              </h1>
              <p className="mt-2 text-lg font-bold text-white">
                Welcome back,{" "}
                {userProfile?.displayName || userProfile?.name || "Team Member"}
              </p>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                {config.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-300">
                <span className="rounded-full bg-white/10 px-3 py-1.5 font-semibold">
                  Role: {humanize(userProfile?.role || "User")}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1.5 font-semibold">
                  Updated:{" "}
                  {lastUpdated ? formatRelativeTime(lastUpdated) : "Now"}
                </span>
                <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 font-semibold text-emerald-200">
                  Restricted financial access
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onRefresh}
                disabled={refreshing}
                className="h-11 rounded-2xl border-white/15 bg-white/10 px-4 text-white hover:bg-white/15 hover:text-white"
              >
                <RefreshCcw
                  className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
                {refreshing ? "Refreshing" : "Refresh"}
              </Button>

              {canDownloadSnapshot && (
                <Button
                  type="button"
                  onClick={onDownloadSnapshot}
                  disabled={snapshotGenerating}
                  className="h-11 rounded-2xl bg-emerald-500 px-4 font-bold text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {snapshotGenerating ? "Generating..." : "Snapshot"}
                </Button>
              )}

              {canCreateInvoices && (
                <Button
                  type="button"
                  onClick={onCreateBudgetRequest}
                  className="h-11 rounded-2xl bg-white px-4 font-bold text-slate-950 hover:bg-slate-100"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Budget Request
                </Button>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs font-semibold text-slate-300">
                Workspace Records
              </p>
              <p className="mt-2 text-2xl font-black">
                {dashboard.totalWorkspaceRecords}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs font-semibold text-slate-300">
                Requests In Progress
              </p>
              <p className="mt-2 text-2xl font-black">
                {dashboard.requestsPending}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs font-semibold text-slate-300">
                Returned Requests
              </p>
              <p className="mt-2 text-2xl font-black">
                {dashboard.requestsReturned}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs font-semibold text-slate-300">
                Pending Claims
              </p>
              <p className="mt-2 text-2xl font-black">
                {dashboard.pendingClaims}
              </p>
            </div>
          </div>
        </section>

        {unavailableModules.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-bold">
                  Some role-scoped modules are unavailable.
                </p>
                <p className="mt-1 text-xs leading-5">
                  Your available workspace data is still displayed. Check the
                  matching Firestore role rules for:{" "}
                  {unavailableModules.join(", ")}.
                </p>
              </div>
            </div>
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="My Requests"
            value={String(data.invoiceRequests.length)}
            subtitle="Only requests inside your role scope"
            icon={FileText}
            tone="blue"
          />
          <MetricCard
            title="Waiting For Review"
            value={String(dashboard.requestsPending)}
            subtitle="Requests still moving through workflow"
            icon={Clock3}
            tone="amber"
          />
          <MetricCard
            title="Completed"
            value={String(dashboard.requestsCompleted)}
            subtitle="Approved or completed requests"
            icon={CheckCircle2}
            tone="emerald"
          />
          <MetricCard
            title="Needs Attention"
            value={String(dashboard.requestsReturned + dashboard.pendingClaims)}
            subtitle="Returned requests and pending claims"
            icon={AlertTriangle}
            tone="rose"
          />
        </section>

        {canDownloadSnapshot && (
          <Card className="rounded-3xl border-emerald-200 bg-emerald-50/60 shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                    Paid Invoice Profit
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    {financialSnapshot
                      ? formatCompactPKR(financialSnapshot.paidInvoiceProfit)
                      : "Loading..."}
                  </h2>
                  <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-600">
                    Total profit earned so far from paid client invoices,
                    calculated as paid invoice value less vendor payments
                    already released.
                  </p>
                </div>

                <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:min-w-[430px]">
                  <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Paid Invoice Revenue
                    </p>
                    <p className="mt-2 text-lg font-black text-slate-950">
                      {financialSnapshot
                        ? formatCompactPKR(financialSnapshot.paidInvoiceRevenue)
                        : "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Vendor Cost Released
                    </p>
                    <p className="mt-2 text-lg font-black text-slate-950">
                      {financialSnapshot
                        ? formatCompactPKR(
                            financialSnapshot.paidInvoiceVendorCost,
                          )
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {canViewFinanceMeter && financialSnapshot && (
          <FinanceMeter
            totalDue={financialSnapshot.totalVendorDue}
            outstandingDue={financialSnapshot.totalPayable}
          />
        )}

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-black text-slate-950">
              Role-Specific Modules
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Financial balances, payment releases, cheque records, vendor
              exposure and administrative reports are hidden for this role.
            </p>
          </div>

          {/* <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {moduleCards.map((card) => (
              <ModuleCard key={card.key} {...card} />
            ))}
          </div> */}
        </section>

        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  My Recent Activity
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Recent workflow updates matched to your user, team, department
                  or assigned projects.
                </p>
              </div>
              <Activity className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-5 divide-y divide-slate-100">
              {dashboard.activities.length === 0 ? (
                <div className="py-12 text-center">
                  <CalendarClock className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-3 text-sm font-semibold text-slate-500">
                    No role-scoped activity was found.
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Make sure your records contain a matching user, team,
                    department or project identifier.
                  </p>
                </div>
              ) : (
                dashboard.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-black text-slate-900">
                          {activity.title}
                        </p>
                        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                          {activity.module}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {activity.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                      <StatusBadge status={activity.status} />
                      <span className="text-[11px] font-semibold text-slate-400">
                        {formatRelativeTime(activity.date)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = "slate",
  trend,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  tone?: "slate" | "emerald" | "blue" | "amber" | "rose" | "violet";
  trend?: "up" | "down";
}) {
  const toneClasses = {
    slate: "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    violet: "bg-violet-50 text-violet-700",
  };

  return (
    <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              {title}
            </p>
            <p className="mt-3 truncate text-2xl font-black tracking-tight text-slate-950 xl:text-3xl">
              {value}
            </p>
          </div>

          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${toneClasses[tone]}`}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
          {trend === "up" && (
            <ArrowUpRight className="h-4 w-4 text-emerald-600" />
          )}
          {trend === "down" && (
            <ArrowDownRight className="h-4 w-4 text-rose-600" />
          )}
          <p className="truncate text-xs font-medium text-slate-500">
            {subtitle}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertCard({
  title,
  value,
  description,
  icon,
  tone,
}: {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
  tone: "amber" | "blue" | "rose" | "emerald";
}) {
  const classes = {
    amber: "border-amber-200 bg-amber-50/70 text-amber-800",
    blue: "border-blue-200 bg-blue-50/70 text-blue-800",
    rose: "border-rose-200 bg-rose-50/70 text-rose-800",
    emerald: "border-emerald-200 bg-emerald-50/70 text-emerald-800",
  };

  return (
    <div className={`rounded-2xl border p-4 ${classes[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">
            {title}
          </p>
          <p className="mt-2 text-2xl font-black">{value}</p>
          <p className="mt-1 text-xs font-medium leading-5 opacity-75">
            {description}
          </p>
        </div>
        <div className="rounded-xl bg-white/70 p-2.5 shadow-sm">{icon}</div>
      </div>
    </div>
  );
}

function FinanceMeter({
  totalDue,
  outstandingDue,
}: {
  totalDue: number;
  outstandingDue: number;
}) {
  const meter = getFinanceMeterState(totalDue, outstandingDue);
  const releasedAmount = Math.max(
    safeNumber(totalDue) - safeNumber(outstandingDue),
    0,
  );
  const markerPosition = Math.min(Math.max(meter.percentage, 2), 98);

  const levelStyles: Record<
    FinanceMeterLevel,
    {
      badge: string;
      bar: string;
      iconBox: string;
      panel: string;
    }
  > = {
    normal: {
      badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
      bar: "bg-emerald-500",
      iconBox: "bg-emerald-100 text-emerald-700",
      panel: "border-emerald-100 bg-emerald-50/40",
    },
    increasing: {
      badge: "border-amber-200 bg-amber-50 text-amber-700",
      bar: "bg-amber-500",
      iconBox: "bg-amber-100 text-amber-700",
      panel: "border-amber-200 bg-amber-50/50",
    },
    high: {
      badge: "border-rose-200 bg-rose-50 text-rose-700",
      bar: "bg-rose-500",
      iconBox: "bg-rose-100 text-rose-700",
      panel: "border-rose-200 bg-rose-50/60",
    },
    critical: {
      badge: "border-red-300 bg-red-100 text-red-800",
      bar: "bg-red-600",
      iconBox: "bg-red-600 text-white",
      panel: "border-red-300 bg-red-50",
    },
  };

  const style = levelStyles[meter.level];
  const StatusIcon =
    meter.level === "normal"
      ? CheckCircle2
      : meter.level === "increasing"
        ? TrendingUp
        : AlertTriangle;

  return (
    <Card className={`rounded-3xl border shadow-sm ${style.panel}`}>
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${style.iconBox}`}
              >
                <StatusIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Finance Meter
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black text-slate-950">
                    Vendor Outstanding Dues
                  </h2>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black ${style.badge}`}
                  >
                    {meter.label}
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-600">
              {meter.description}
            </p>
          </div>

          <div className="flex items-end gap-2 lg:text-right">
            <span className="text-4xl font-black tracking-tight text-slate-950">
              {meter.percentage.toFixed(1)}%
            </span>
            <span className="pb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
              outstanding
            </span>
          </div>
        </div>

        <div className="mt-6">
          <div className="relative pt-5">
            <div className="relative h-4 overflow-hidden rounded-full bg-slate-200/80">
              <div
                className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
                style={{ width: `${meter.percentage}%` }}
              />
              {[30, 40, 60].map((threshold) => (
                <span
                  key={threshold}
                  className="absolute top-0 h-full w-px bg-white/90"
                  style={{ left: `${threshold}%` }}
                />
              ))}
            </div>
            <div
              className="absolute top-0 -translate-x-1/2 text-[10px] font-black text-slate-500"
              style={{ left: `${markerPosition}%` }}
            >
              {meter.percentage.toFixed(0)}%
            </div>
          </div>

          <div className="relative mt-2 h-4 text-[10px] font-bold text-slate-400">
            <span className="absolute left-0">0%</span>
            <span className="absolute -translate-x-1/2" style={{ left: "30%" }}>
              30%
            </span>
            <span className="absolute -translate-x-1/2" style={{ left: "40%" }}>
              40%
            </span>
            <span className="absolute -translate-x-1/2" style={{ left: "60%" }}>
              60%
            </span>
            <span className="absolute right-0">100%</span>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-emerald-100 bg-white/80 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">
                Normal
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">0-30%</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-white/80 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-wide text-amber-700">
                Increasing
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Above 30-40%
              </p>
            </div>
            <div className="rounded-xl border border-rose-100 bg-white/80 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-wide text-rose-700">
                High
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                40-60%
              </p>
            </div>
            <div className="rounded-xl border border-red-200 bg-white/80 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-wide text-red-700">
                Critical
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                60% and above
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/80 bg-white/85 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Total Vendor Due
            </p>
            <p className="mt-2 text-lg font-black text-slate-950">
              {formatCompactPKR(totalDue)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/85 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Outstanding Due
            </p>
            <p
              className={`mt-2 text-lg font-black ${meter.level === "high" || meter.level === "critical" ? "text-rose-700" : "text-slate-950"}`}
            >
              {formatCompactPKR(outstandingDue)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/85 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Paid / Released
            </p>
            <p className="mt-2 text-lg font-black text-emerald-700">
              {formatCompactPKR(releasedAmount)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ModuleCard({
  title,
  subtitle,
  icon: Icon,
  items,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  items: Array<{ label: string; value: string; className?: string }>;
}) {
  return (
    <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-black text-slate-950">{title}</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>
          </div>
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
            >
              <span className="text-sm font-medium text-slate-500">
                {item.label}
              </span>
              <span
                className={`text-sm font-black text-slate-950 ${item.className || ""}`}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = normalizeText(status);

  const classes = normalized.includes("partial")
    ? "border-blue-200 bg-blue-50 text-blue-700"
    : normalized.includes("paid") ||
        normalized.includes("approved") ||
        normalized.includes("released")
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized.includes("reject") || normalized.includes("cancel")
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : normalized.includes("pending") ||
            normalized.includes("unpaid") ||
            normalized.includes("open")
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${classes}`}
    >
      {humanize(status)}
    </span>
  );
}

export default function Dashboard() {
  const { userProfile } = useAuth();

  const roleKey = normalizeText(userProfile?.role)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const hasFullDashboardAccess = FULL_DASHBOARD_ROLES.has(roleKey);
  const canDownloadSnapshot = SNAPSHOT_ROLES.has(roleKey);
  const canViewFinanceMeter = FINANCE_METER_ROLES.has(roleKey);
  const canCreateInvoices = [
    "operation",
    "operations",
    "operational_admin",
    "operation_admin",
    "creative",
    "sales",
  ].includes(roleKey);

  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [unavailableModules, setUnavailableModules] = useState<string[]>([]);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [snapshotGenerating, setSnapshotGenerating] = useState(false);
  const [financialSnapshot, setFinancialSnapshot] =
    useState<FinancialSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!canDownloadSnapshot) {
      setFinancialSnapshot(null);
      return () => {
        cancelled = true;
      };
    }

    if (hasFullDashboardAccess) {
      setFinancialSnapshot(buildFinancialSnapshot(data));
      return () => {
        cancelled = true;
      };
    }

    loadFinancialSnapshotSourceData()
      .then((source) => {
        if (!cancelled) setFinancialSnapshot(buildFinancialSnapshot(source));
      })
      .catch((error) => {
        console.warn(
          "Dashboard could not load paid-invoice profit summary:",
          error,
        );
        if (!cancelled) setFinancialSnapshot(null);
      });

    return () => {
      cancelled = true;
    };
  }, [canDownloadSnapshot, data, hasFullDashboardAccess]);

  const handleDownloadSnapshot = useCallback(async () => {
    if (!canDownloadSnapshot || snapshotGenerating) return;

    setSnapshotGenerating(true);

    try {
      const source = hasFullDashboardAccess
        ? data
        : await loadFinancialSnapshotSourceData();
      const snapshot = buildFinancialSnapshot(source);
      setFinancialSnapshot(snapshot);

      downloadFinancialSnapshotPdf({
        snapshot,
        generatedBy: firstText(
          userProfile?.displayName,
          userProfile?.role,
          userProfile?.email,
          "Authorized User",
        ),
        role: userProfile?.role || roleKey,
      });
    } catch (error) {
      console.error("Failed to generate financial snapshot:", error);
      window.alert(
        "The financial snapshot could not be generated. Please check Firestore permissions for invoices, payments, budget requests, claims, records and manual statement entries.",
      );
    } finally {
      setSnapshotGenerating(false);
    }
  }, [
    canDownloadSnapshot,
    data,
    hasFullDashboardAccess,
    roleKey,
    snapshotGenerating,
    userProfile,
  ]);

  const loadDashboardData = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);

      const unavailable = new Set<string>();

      const readCollection = async (
        path: string[],
        label: string,
      ): Promise<AnyRow[]> => {
        try {
          const snapshot = await getDocs(
            collection(db, path[0], ...path.slice(1)),
          );
          return snapshotToRows(snapshot as any);
        } catch (error) {
          console.warn(`Dashboard could not read ${label}:`, error);
          unavailable.add(label);
          return [];
        }
      };

      const restrictToCurrentScope = (rows: AnyRow[]) =>
        rows.filter((row) => rowMatchesUserScope(row, userProfile));

      try {
        if (!hasFullDashboardAccess) {
          const [
            invoiceRequests,
            estimates,
            estimateInvoices,
            expenseSheets,
            directClaims,
          ] = await Promise.all([
            readCollection(
              ["Panels", PANEL_ID, "invoiceRequests"],
              "Budget Requests",
            ),
            readCollection(["Panels", PANEL_ID, "estimates"], "Estimates"),
            readCollection(
              ["Panels", PANEL_ID, "estimateInvoices"],
              "Estimate Invoices",
            ),
            readCollection(
              ["Panels", PANEL_ID, "expenseSheets"],
              "Budget Expenses",
            ),
            readCollection(
              ["Panels", PANEL_ID, "claimReimbursements"],
              "Reimbursements",
            ),
          ]);

          setData({
            ...EMPTY_DATA,
            invoiceRequests: restrictToCurrentScope(invoiceRequests),
            estimates: restrictToCurrentScope(estimates),
            estimateInvoices: restrictToCurrentScope(estimateInvoices),
            expenseSheets: restrictToCurrentScope(expenseSheets),
            directClaims: restrictToCurrentScope(directClaims),
          });

          setUnavailableModules(Array.from(unavailable));
          setLastUpdated(new Date());
          return;
        }

        const [
          invoiceRequests,
          estimates,
          estimateInvoices,
          payments,
          expenseSheets,
          directClaims,
          records,
          poRows,
          purchaseOrderRows,
          manualEntries,
        ] = await Promise.all([
          readCollection(
            ["Panels", PANEL_ID, "invoiceRequests"],
            "Budget Requests",
          ),
          readCollection(["Panels", PANEL_ID, "estimates"], "Estimates"),
          readCollection(
            ["Panels", PANEL_ID, "estimateInvoices"],
            "Estimate Invoices",
          ),
          readCollection(["Panels", PANEL_ID, "payments"], "Payments"),
          readCollection(
            ["Panels", PANEL_ID, "expenseSheets"],
            "Budget Expenses",
          ),
          readCollection(
            ["Panels", PANEL_ID, "claimReimbursements"],
            "Reimbursements",
          ),
          readCollection(["Panels", PANEL_ID, "Record"], "Records"),
          readCollection(["Panels", PANEL_ID, "PO"], "Purchase Orders"),
          readCollection(
            ["Panels", PANEL_ID, "purchaseOrders"],
            "Legacy Purchase Orders",
          ),
          readCollection(
            ["Panels", PANEL_ID, "accountStatementManualEntries"],
            "Manual Statement Entries",
          ),
        ]);

        let openingBalance = 0;
        try {
          const settingsSnapshot = await getDoc(
            doc(db, "Panels", PANEL_ID, "accountStatementSettings", "main"),
          );

          openingBalance = settingsSnapshot.exists()
            ? safeNumber(settingsSnapshot.data()?.openingBalance)
            : 0;
        } catch (error) {
          console.warn(
            "Dashboard could not read Account Statement settings:",
            error,
          );
          unavailable.add("Account Statement Settings");
        }

        let meetingClaims: AnyRow[] = [];
        try {
          const meetingSnapshot = await getDocs(
            collectionGroup(db, "meetingUpdates"),
          );

          meetingClaims = meetingSnapshot.docs
            .map((meetingDocument) => ({
              id: meetingDocument.id,
              path: meetingDocument.ref.path,
              ...meetingDocument.data(),
            }))
            .filter((meeting: any) => meeting?.reimbursement?.enabled)
            .map((meeting: any) => ({
              id: meeting.id,
              path: meeting.path,
              ...meeting.reimbursement,
              personName:
                meeting.reimbursement?.approvalSubmittedByName ||
                meeting.reimbursement?.personName ||
                meeting.personName ||
                "Unknown",
              submittedAt:
                meeting.reimbursement?.approvalSubmittedAt ||
                meeting.reimbursement?.submittedAt ||
                meeting.submittedAt ||
                meeting.createdAt ||
                null,
              meetingUpdatedAt: meeting.updatedAt || null,
            }));
        } catch (error) {
          console.warn(
            "Dashboard could not read nested reimbursements:",
            error,
          );
          unavailable.add("Nested Reimbursements");
        }

        const poMap = new Map<string, AnyRow>();
        [...poRows, ...purchaseOrderRows].forEach((purchaseOrder) => {
          const key = firstText(
            purchaseOrder?.poNumber,
            purchaseOrder?.purchaseOrderNumber,
            purchaseOrder?.id,
          );

          if (!poMap.has(key)) poMap.set(key, purchaseOrder);
        });

        setData({
          invoiceRequests,
          estimates,
          estimateInvoices,
          payments,
          expenseSheets,
          directClaims,
          meetingClaims,
          records,
          purchaseOrders: Array.from(poMap.values()),
          manualEntries,
          openingBalance,
        });

        setUnavailableModules(Array.from(unavailable));
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [hasFullDashboardAccess, userProfile],
  );

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    const watchedCollections = hasFullDashboardAccess
      ? [
          "invoiceRequests",
          "estimates",
          "estimateInvoices",
          "payments",
          "expenseSheets",
          "claimReimbursements",
          "Record",
          "PO",
          "purchaseOrders",
          "accountStatementManualEntries",
        ]
      : [
          "invoiceRequests",
          "estimates",
          "estimateInvoices",
          "expenseSheets",
          "claimReimbursements",
        ];

    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const initialSnapshots = new Set<string>();

    const unsubscribers = watchedCollections.map((collectionName) =>
      onSnapshot(
        collection(db, "Panels", PANEL_ID, collectionName),
        () => {
          if (!initialSnapshots.has(collectionName)) {
            initialSnapshots.add(collectionName);
            return;
          }

          if (refreshTimer) clearTimeout(refreshTimer);
          refreshTimer = setTimeout(() => loadDashboardData(true), 700);
        },
        (error) => {
          console.warn(
            `Dashboard listener failed for ${collectionName}:`,
            error,
          );
        },
      ),
    );

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [hasFullDashboardAccess, loadDashboardData]);

  const summary = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const incomeEvents: MoneyEvent[] = [];
    const expenseEvents: MoneyEvent[] = [];

    data.payments.forEach((payment) => {
      const amount = safeNumber(payment?.amount);
      const date =
        toDate(payment?.paymentDate) ||
        toDate(payment?.createdAt) ||
        toDate(payment?.updatedAt);

      if (amount > 0) incomeEvents.push({ amount, date });

      const taxDebit =
        safeNumber(payment?.whtAmount) + safeNumber(payment?.sstAmount);
      if (taxDebit > 0) expenseEvents.push({ amount: taxDebit, date });
    });

    data.invoiceRequests.forEach((request) => {
      const history = getPaymentReleaseHistory(request);

      if (history.length > 0) {
        history.forEach((release) => {
          const amount = getReleaseAmount(release);
          if (amount <= 0) return;

          expenseEvents.push({
            amount,
            date:
              toDate(release?.releasedAt) ||
              toDate(release?.createdAt) ||
              getEntityDate(request),
          });
        });
      } else {
        const releasedAmount = getReleasedRequestAmount(request);
        if (releasedAmount > 0) {
          expenseEvents.push({
            amount: releasedAmount,
            date: getEntityDate(request),
          });
        }
      }
    });

    data.directClaims.forEach((claim) => {
      const paidAmount = getClaimPaidAmount(claim);
      if (paidAmount > 0) {
        expenseEvents.push({
          amount: paidAmount,
          date:
            toDate(claim?.paymentReleasedAt) ||
            toDate(claim?.updatedAt) ||
            getEntityDate(claim),
        });
      }
    });

    data.meetingClaims.forEach((claim) => {
      const paidAmount = getClaimPaidAmount(claim);
      if (paidAmount > 0) {
        expenseEvents.push({
          amount: paidAmount,
          date:
            toDate(claim?.paymentReleasedAt) ||
            toDate(claim?.updatedAt) ||
            toDate(claim?.meetingUpdatedAt) ||
            getEntityDate(claim),
        });
      }
    });

    data.records.forEach((record) => {
      const chequeAmount = safeNumber(record?.chequeAmount);
      if (chequeAmount > 0) {
        expenseEvents.push({
          amount: chequeAmount,
          date: getEntityDate(record),
        });
      }
    });

    data.manualEntries.forEach((entry) => {
      const date = toDate(entry?.date) || getEntityDate(entry);
      const debit = safeNumber(entry?.debit);
      const credit = safeNumber(entry?.credit);

      if (debit > 0) expenseEvents.push({ amount: debit, date });
      if (credit > 0) incomeEvents.push({ amount: credit, date });
    });

    const totalIncome = incomeEvents.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
    const totalExpense = expenseEvents.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
    const balance = data.openingBalance + totalIncome - totalExpense;

    const monthIncome = incomeEvents
      .filter((item) => item.date && item.date >= monthStart)
      .reduce((sum, item) => sum + item.amount, 0);

    const monthExpense = expenseEvents
      .filter((item) => item.date && item.date >= monthStart)
      .reduce((sum, item) => sum + item.amount, 0);

    const budgetTotalAmount = data.invoiceRequests.reduce(
      (sum, request) => sum + getApprovedRequestAmount(request),
      0,
    );
    const budgetReleasedAmount = data.invoiceRequests.reduce(
      (sum, request) => sum + getReleasedRequestAmount(request),
      0,
    );
    const budgetRemainingAmount = data.invoiceRequests.reduce(
      (sum, request) => sum + getRemainingRequestAmount(request),
      0,
    );

    const budgetPendingAdmin = data.invoiceRequests.filter((request) =>
      [
        "pending_operational_admin",
        "pending_main_admin",
        "pending_admin",
      ].includes(normalizeText(request?.status)),
    ).length;

    const budgetPendingFinance = data.invoiceRequests.filter(
      (request) => normalizeText(request?.status) === "pending_finance",
    ).length;

    const budgetReadyForPayment = data.invoiceRequests.filter((request) => {
      const status = normalizeText(request?.status);
      return (
        [
          "approved",
          "po_created",
          "po_submitted",
          "po_approved",
          "po_issued",
          "ready_for_payment",
          "payment_partially_released",
        ].includes(status) && !isFullyReleased(request)
      );
    }).length;

    const budgetPartial =
      data.invoiceRequests.filter(isPartiallyReleased).length;
    const budgetReleased = data.invoiceRequests.filter(isFullyReleased).length;
    const budgetRejected = data.invoiceRequests.filter((request) =>
      ["rejected", "returned_to_creator", "changes_requested"].includes(
        normalizeText(request?.status),
      ),
    ).length;

    const estimateTotalAmount = data.estimates.reduce(
      (sum, estimate) => sum + getEstimateAmount(estimate),
      0,
    );

    const estimateApproved = data.estimates.filter(
      (estimate) => normalizeText(estimate?.status) === "approved",
    ).length;

    const estimateInvoiced = data.estimates.filter((estimate) =>
      ["invoiced", "payment received"].includes(
        normalizeText(estimate?.status),
      ),
    ).length;

    const invoiceTotalAmount = data.estimateInvoices.reduce(
      (sum, invoice) => sum + getEstimateInvoiceAmount(invoice),
      0,
    );

    const paidInvoices = data.estimateInvoices.filter(
      (invoice) => getInvoiceStatus(invoice) === "paid",
    );
    const partialInvoices = data.estimateInvoices.filter(
      (invoice) => getInvoiceStatus(invoice) === "partial",
    );
    const unpaidInvoices = data.estimateInvoices.filter(
      (invoice) => getInvoiceStatus(invoice) === "unpaid",
    );

    const paidInvoiceAmount = paidInvoices.reduce(
      (sum, invoice) => sum + getEstimateInvoiceAmount(invoice),
      0,
    );

    const paidInvoiceVendorCost = budgetReleasedAmount;
    const paidInvoiceProfit = Math.max(
      paidInvoiceAmount - paidInvoiceVendorCost,
      0,
    );

    const receivedInvoiceAmount = data.payments.reduce(
      (sum, payment) => sum + safeNumber(payment?.amount),
      0,
    );

    const invoiceOutstanding = Math.max(
      invoiceTotalAmount - receivedInvoiceAmount,
      0,
    );

    const poTotalAmount = data.purchaseOrders.reduce(
      (sum, purchaseOrder) => sum + getPurchaseOrderAmount(purchaseOrder),
      0,
    );

    const poPaid = data.purchaseOrders.filter(
      (purchaseOrder) => normalizeText(purchaseOrder?.status) === "paid",
    ).length;

    const poOpen = data.purchaseOrders.filter((purchaseOrder) =>
      ["open", "draft"].includes(normalizeText(purchaseOrder?.status)),
    ).length;

    const poOverdue = data.purchaseOrders.filter((purchaseOrder) => {
      const status = normalizeText(purchaseOrder?.status);
      return (
        !["paid", "cancelled"].includes(status) &&
        (status === "over due" ||
          status === "overdue" ||
          isOverdueDate(purchaseOrder?.dueDate))
      );
    }).length;

    const expenseSheetAmount = data.expenseSheets.reduce(
      (sum, expense) => sum + getExpenseAmount(expense),
      0,
    );

    const allClaims = [...data.directClaims, ...data.meetingClaims];
    const reimbursementAmount = allClaims.reduce(
      (sum, claim) => sum + getClaimAmount(claim),
      0,
    );
    const reimbursementPending = allClaims.filter(
      (claim) => getClaimStatus(claim) === "pending",
    ).length;
    const reimbursementApproved = allClaims.filter(
      (claim) => getClaimStatus(claim) === "approved",
    ).length;
    const reimbursementPaid = allClaims.filter(
      (claim) => normalizeText(claim?.paymentStatus) === "paid",
    ).length;
    const reimbursementPaidAmount = allClaims.reduce(
      (sum, claim) => sum + getClaimPaidAmount(claim),
      0,
    );

    const recordChequeAmount = data.records.reduce(
      (sum, record) => sum + safeNumber(record?.chequeAmount),
      0,
    );
    const recordItemAmount = data.records.reduce(
      (sum, record) => sum + safeNumber(record?.totalItemAmount),
      0,
    );
    const recordRemaining = data.records.reduce(
      (sum, record) => sum + safeNumber(record?.remainingBalance),
      0,
    );

    const vendorNames = new Set<string>();
    data.invoiceRequests.forEach((request) => {
      getVendorNames(request).forEach((name) => vendorNames.add(name));
    });

    const vendorOverdue = data.invoiceRequests.reduce((sum, request) => {
      const remaining = getRemainingRequestAmount(request);
      const dueDate =
        request?.dueDate || request?.paymentDueDate || request?.invoiceDueDate;

      return remaining > 0 && dueDate && isOverdueDate(dueDate)
        ? sum + remaining
        : sum;
    }, 0);

    const lastSixMonths = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleDateString("en-PK", { month: "short" }),
        income: 0,
        expense: 0,
      };
    });

    const monthMap = new Map(lastSixMonths.map((item) => [item.key, item]));

    incomeEvents.forEach((event) => {
      if (!event.date) return;
      const key = `${event.date.getFullYear()}-${event.date.getMonth()}`;
      const bucket = monthMap.get(key);
      if (bucket) bucket.income += event.amount;
    });

    expenseEvents.forEach((event) => {
      if (!event.date) return;
      const key = `${event.date.getFullYear()}-${event.date.getMonth()}`;
      const bucket = monthMap.get(key);
      if (bucket) bucket.expense += event.amount;
    });

    const activities: ActivityItem[] = [
      ...data.invoiceRequests.map((request) => ({
        id: `budget-${request.id}`,
        module: "Budget Request",
        title: firstText(
          request?.requestId,
          request?.title,
          request?.subject,
          "Budget request",
        ),
        description: firstText(
          request?.projectName,
          request?.project,
          request?.clientName,
          request?.vendorName,
          "Budget workflow updated",
        ),
        status: request?.status || "submitted",
        date: getRequestDate(request),
      })),
      ...data.payments.map((payment) => ({
        id: `payment-${payment.id}`,
        module: "Payment Received",
        title: firstText(
          payment?.invoiceNo,
          payment?.reference,
          payment?.paymentReference,
          "Invoice payment",
        ),
        description: `${firstText(payment?.client, "Payment received")} · ${formatPKR(
          payment?.amount,
        )}`,
        status: "paid",
        date:
          toDate(payment?.paymentDate) ||
          toDate(payment?.createdAt) ||
          toDate(payment?.updatedAt),
      })),
      ...data.estimateInvoices.map((invoice) => ({
        id: `invoice-${invoice.id}`,
        module: "Estimate Invoice",
        title: firstText(invoice?.invoiceNo, invoice?.subject, "Invoice"),
        description: `${firstText(invoice?.client, "Client invoice")} · ${formatPKR(
          getEstimateInvoiceAmount(invoice),
        )}`,
        status: invoice?.status || "unpaid",
        date:
          toDate(invoice?.invoiceDate) ||
          toDate(invoice?.createdAt) ||
          toDate(invoice?.updatedAt),
      })),
      ...data.purchaseOrders.map((purchaseOrder) => ({
        id: `po-${purchaseOrder.id}`,
        module: "Purchase Order",
        title: firstText(
          purchaseOrder?.poNumber,
          purchaseOrder?.purchaseOrderNumber,
          "Purchase order",
        ),
        description: `${firstText(
          purchaseOrder?.supplierName,
          purchaseOrder?.vendorName,
          "Supplier",
        )} · ${formatPKR(getPurchaseOrderAmount(purchaseOrder))}`,
        status: purchaseOrder?.status || "draft",
        date:
          toDate(purchaseOrder?.createdAt) ||
          toDate(purchaseOrder?.issueDate) ||
          toDate(purchaseOrder?.updatedAt),
      })),
      ...data.expenseSheets.map((expense) => ({
        id: `expense-${expense.id}`,
        module: "Budget Expense",
        title: firstText(
          expense?.expenseId,
          expense?.projectName,
          expense?.project,
          "Expense sheet",
        ),
        description: `${firstText(
          expense?.clientName,
          expense?.submittedByName,
          "Expense submitted",
        )} · ${formatPKR(getExpenseAmount(expense))}`,
        status: expense?.paymentStatus || expense?.status || "submitted",
        date:
          toDate(expense?.submittedAt) ||
          toDate(expense?.createdAt) ||
          toDate(expense?.updatedAt),
      })),
      ...data.directClaims.map((claim) => ({
        id: `claim-${claim.id}`,
        module: "Reimbursement",
        title: firstText(
          claim?.description,
          claim?.foodItem,
          claim?.claimType,
          "Reimbursement claim",
        ),
        description: `${firstText(
          claim?.submittedByName,
          claim?.personName,
          "Employee",
        )} · ${formatPKR(getClaimAmount(claim))}`,
        status:
          normalizeText(claim?.paymentStatus) === "paid"
            ? "paid"
            : claim?.status || claim?.approvalStatus || "pending",
        date:
          toDate(claim?.submittedAt) ||
          toDate(claim?.createdAt) ||
          toDate(claim?.updatedAt),
      })),
      ...data.records.map((record) => ({
        id: `record-${record.id}`,
        module: "Record",
        title: firstText(
          record?.statementTitle,
          record?.accountTitle,
          record?.chequeNumber,
          "Financial record",
        ),
        description: `${firstText(record?.bank, record?.accountNo, "Account")} · ${formatPKR(
          record?.chequeAmount,
        )}`,
        status: record?.status || "recorded",
        date:
          toDate(record?.createdAt) ||
          toDate(record?.selectedDate) ||
          toDate(record?.updatedAt),
      })),
    ]
      .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))
      .slice(0, 12);

    const workflowData = [
      { name: "Admin", value: budgetPendingAdmin, color: "#f59e0b" },
      { name: "Finance", value: budgetPendingFinance, color: "#8b5cf6" },
      { name: "Ready", value: budgetReadyForPayment, color: "#3b82f6" },
      { name: "Partial", value: budgetPartial, color: "#06b6d4" },
      { name: "Released", value: budgetReleased, color: "#10b981" },
      { name: "Returned", value: budgetRejected, color: "#f43f5e" },
    ];

    return {
      totalIncome,
      totalExpense,
      balance,
      monthIncome,
      monthExpense,
      incomeEvents,
      expenseEvents,
      budgetTotalAmount,
      budgetReleasedAmount,
      budgetRemainingAmount,
      budgetPendingAdmin,
      budgetPendingFinance,
      budgetReadyForPayment,
      budgetPartial,
      budgetReleased,
      budgetRejected,
      estimateTotalAmount,
      estimateApproved,
      estimateInvoiced,
      invoiceTotalAmount,
      paidInvoices: paidInvoices.length,
      partialInvoices: partialInvoices.length,
      unpaidInvoices: unpaidInvoices.length,
      paidInvoiceAmount,
      paidInvoiceVendorCost,
      paidInvoiceProfit,
      receivedInvoiceAmount,
      invoiceOutstanding,
      poTotalAmount,
      poPaid,
      poOpen,
      poOverdue,
      expenseSheetAmount,
      reimbursementAmount,
      reimbursementPending,
      reimbursementApproved,
      reimbursementPaid,
      reimbursementPaidAmount,
      recordChequeAmount,
      recordItemAmount,
      recordRemaining,
      vendorCount: vendorNames.size,
      vendorOverdue,
      cashFlowData: lastSixMonths,
      workflowData,
      activities,
    };
  }, [data]);

  const roleAlerts = useMemo(() => {
    if (["finance", "financial_admin", "finance_admin"].includes(roleKey)) {
      return [
        {
          title: "Finance Approval",
          value: String(summary.budgetPendingFinance),
          description: "Requests currently waiting for finance approval.",
          icon: <Landmark className="h-5 w-5" />,
          tone: "amber" as const,
        },
        {
          title: "Release Payment",
          value: String(summary.budgetReadyForPayment),
          description: "Approved requests that still require payment release.",
          icon: <Banknote className="h-5 w-5" />,
          tone: "blue" as const,
        },
        {
          title: "Partial Releases",
          value: String(summary.budgetPartial),
          description: "Requests with a remaining payment balance.",
          icon: <CircleDollarSign className="h-5 w-5" />,
          tone: "blue" as const,
        },
        {
          title: "Reimbursement Payment",
          value: String(
            Math.max(
              summary.reimbursementApproved - summary.reimbursementPaid,
              0,
            ),
          ),
          description: "Approved reimbursement claims awaiting payment.",
          icon: <Users className="h-5 w-5" />,
          tone: "emerald" as const,
        },
      ];
    }

    if (["admin", "main_admin", "super_admin"].includes(roleKey)) {
      return [
        {
          title: "Admin Approval",
          value: String(summary.budgetPendingAdmin),
          description: "Budget requests requiring an admin decision.",
          icon: <BadgeCheck className="h-5 w-5" />,
          tone: "amber" as const,
        },
        {
          title: "Returned Requests",
          value: String(summary.budgetRejected),
          description: "Requests returned to their creators for correction.",
          icon: <XCircle className="h-5 w-5" />,
          tone: "rose" as const,
        },
        {
          title: "Pending Reimbursements",
          value: String(summary.reimbursementPending),
          description: "Reimbursement claims waiting for review.",
          icon: <Clock3 className="h-5 w-5" />,
          tone: "blue" as const,
        },
        {
          title: "Overdue Purchase Orders",
          value: String(summary.poOverdue),
          description: "Open purchase orders whose due date has passed.",
          icon: <AlertTriangle className="h-5 w-5" />,
          tone: "rose" as const,
        },
      ];
    }

    return [
      {
        title: "Admin Queue",
        value: String(summary.budgetPendingAdmin),
        description: "Requests currently moving through admin approval.",
        icon: <Clock3 className="h-5 w-5" />,
        tone: "amber" as const,
      },
      {
        title: "Finance Queue",
        value: String(summary.budgetPendingFinance),
        description: "Requests currently waiting for finance review.",
        icon: <Landmark className="h-5 w-5" />,
        tone: "blue" as const,
      },
      {
        title: "Returned To Team",
        value: String(summary.budgetRejected),
        description: "Requests that require correction and resubmission.",
        icon: <XCircle className="h-5 w-5" />,
        tone: "rose" as const,
      },
      {
        title: "Expense Submitted",
        value: String(data.expenseSheets.length),
        description: "Budget expense sheets recorded in the system.",
        icon: <ReceiptText className="h-5 w-5" />,
        tone: "emerald" as const,
      },
    ];
  }, [data.expenseSheets.length, roleKey, summary]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50">
        <div className="rounded-3xl border border-slate-200 bg-white px-10 py-8 text-center shadow-sm">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
          <p className="mt-4 text-sm font-bold text-slate-700">
            Building your system dashboard...
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Loading finance, requests, invoices, POs, records and expenses.
          </p>
        </div>
      </div>
    );
  }

  if (!hasFullDashboardAccess) {
    return (
      <>
        <RestrictedDashboard
          userProfile={userProfile}
          roleKey={roleKey}
          data={data}
          refreshing={refreshing}
          lastUpdated={lastUpdated}
          unavailableModules={unavailableModules}
          canCreateInvoices={canCreateInvoices}
          canDownloadSnapshot={canDownloadSnapshot}
          canViewFinanceMeter={canViewFinanceMeter}
          snapshotGenerating={snapshotGenerating}
          financialSnapshot={financialSnapshot}
          onRefresh={() => loadDashboardData(true)}
          onCreateBudgetRequest={() => setIsInvoiceModalOpen(true)}
          onDownloadSnapshot={handleDownloadSnapshot}
        />

        {canCreateInvoices && (
          <InvoiceRequestModal
            isOpen={isInvoiceModalOpen}
            onClose={() => setIsInvoiceModalOpen(false)}
            onSuccess={() => {
              setIsInvoiceModalOpen(false);
              loadDashboardData(true);
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 p-4 text-slate-900 sm:p-6">
      <div className="mx-auto space-y-6">
        <section className="overflow-hidden rounded-[32px] bg-slate-950 p-6 text-white shadow-xl shadow-slate-200/70 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">
                <Activity className="h-3.5 w-3.5" />
                Live System Overview
              </div>

              <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Welcome back, {userProfile?.displayName || "Team Member"}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                A complete operational and financial view of budget requests,
                estimates, invoices, purchase orders, payments, expenses,
                reimbursements, records and vendors.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span className="rounded-full bg-white/10 px-3 py-1.5 font-semibold">
                  Role: {humanize(userProfile?.role || "User")}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1.5 font-semibold">
                  Updated:{" "}
                  {lastUpdated ? formatRelativeTime(lastUpdated) : "Now"}
                </span>
                {unavailableModules.length > 0 && (
                  <span className="rounded-full bg-amber-400/15 px-3 py-1.5 font-semibold text-amber-200">
                    {unavailableModules.length} source(s) unavailable
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => loadDashboardData(true)}
                disabled={refreshing}
                className="h-11 rounded-2xl border-white/15 bg-white/10 px-4 text-white hover:bg-white/15 hover:text-white"
              >
                <RefreshCcw
                  className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
                {refreshing ? "Refreshing" : "Refresh"}
              </Button>

              {canDownloadSnapshot && (
                <Button
                  type="button"
                  onClick={handleDownloadSnapshot}
                  disabled={snapshotGenerating}
                  className="h-11 rounded-2xl bg-emerald-500 px-4 font-bold text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {snapshotGenerating ? "Generating..." : "Snapshot"}
                </Button>
              )}

              {canCreateInvoices && (
                <Button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(true)}
                  className="h-11 rounded-2xl bg-white px-4 font-bold text-slate-950 hover:bg-slate-100"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Budget Request
                </Button>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs font-semibold text-slate-300">
                Opening Balance
              </p>
              <p className="mt-2 text-xl font-black">
                {formatCompactPKR(data.openingBalance)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs font-semibold text-slate-300">
                System Records
              </p>
              <p className="mt-2 text-xl font-black">
                {(
                  data.invoiceRequests.length +
                  data.estimates.length +
                  data.estimateInvoices.length +
                  data.purchaseOrders.length +
                  data.expenseSheets.length +
                  data.records.length
                ).toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs font-semibold text-slate-300">
                Budget Pipeline
              </p>
              <p className="mt-2 text-xl font-black">
                {formatCompactPKR(summary.budgetTotalAmount)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs font-semibold text-slate-300">
                Outstanding Invoices
              </p>
              <p className="mt-2 text-xl font-black">
                {formatCompactPKR(summary.invoiceOutstanding)}
              </p>
            </div>
          </div>
        </section>

        {unavailableModules.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-bold">
                  Some dashboard sources could not be read.
                </p>
                <p className="mt-1 text-xs leading-5">
                  Check Firestore permissions for:{" "}
                  {unavailableModules.join(", ")}. All available modules are
                  still displayed.
                </p>
              </div>
            </div>
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Current Balance"
            value={formatCompactPKR(summary.balance)}
            subtitle={`Opening + ${formatCompactPKR(summary.totalIncome)} income - ${formatCompactPKR(summary.totalExpense)} expense`}
            icon={Wallet}
            tone={summary.balance >= 0 ? "emerald" : "rose"}
            trend={summary.balance >= 0 ? "up" : "down"}
          />
          <MetricCard
            title="Total Income"
            value={formatCompactPKR(summary.totalIncome)}
            subtitle={`${formatCompactPKR(summary.monthIncome)} received this month`}
            icon={TrendingUp}
            tone="emerald"
            trend="up"
          />
          <MetricCard
            title="Total Expense"
            value={formatCompactPKR(summary.totalExpense)}
            subtitle={`${formatCompactPKR(summary.monthExpense)} released this month`}
            icon={ArrowDownRight}
            tone="rose"
            trend="down"
          />
          <MetricCard
            title="Remaining Releases"
            value={formatCompactPKR(summary.budgetRemainingAmount)}
            subtitle={`${summary.budgetReadyForPayment} request(s) ready for payment`}
            icon={CircleDollarSign}
            tone="blue"
          />
        </section>

        <section className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                    Paid Invoice Profit
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                    {formatCompactPKR(summary.paidInvoiceProfit)}
                  </h2>
                </div>
              </div>
              <p className="mt-3 max-w-2xl text-xs leading-5 text-slate-600">
                Total profit earned so far from all paid client invoices. Profit
                is calculated as paid invoice value less vendor payments already
                released.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[440px]">
              <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Paid Invoice Revenue
                </p>
                <p className="mt-2 text-lg font-black text-slate-950">
                  {formatCompactPKR(summary.paidInvoiceAmount)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {summary.paidInvoices} paid invoice(s)
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Vendor Cost Released
                </p>
                <p className="mt-2 text-lg font-black text-slate-950">
                  {formatCompactPKR(summary.paidInvoiceVendorCost)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Released budget/vendor payments
                </p>
              </div>
            </div>
          </div>
        </section>

        {canViewFinanceMeter && (
          <FinanceMeter
            totalDue={summary.budgetTotalAmount}
            outstandingDue={summary.budgetRemainingAmount}
          />
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                Priority Actions
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                The most important tasks for your current role.
              </p>
            </div>
            <ListChecks className="h-5 w-5 text-slate-400" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {roleAlerts.map((alert) => (
              <AlertCard key={alert.title} {...alert} />
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-950">
                    Income vs Expense
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Account Statement cash movement for the last six months.
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 h-[310px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summary.cashFlowData}>
                    <defs>
                      <linearGradient
                        id="incomeGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.28}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="expenseGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#f43f5e"
                          stopOpacity={0.22}
                        />
                        <stop
                          offset="95%"
                          stopColor="#f43f5e"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) =>
                        formatCompactPKR(value).replace("Rs ", "")
                      }
                    />
                    <Tooltip formatter={(value: any) => formatPKR(value)} />
                    <Area
                      type="monotone"
                      dataKey="income"
                      name="Income"
                      stroke="#10b981"
                      strokeWidth={3}
                      fill="url(#incomeGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      name="Expense"
                      stroke="#f43f5e"
                      strokeWidth={3}
                      fill="url(#expenseGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-950">
                    Budget Workflow
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Current distribution of budget request stages.
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                  <FileCheck2 className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.workflowData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {summary.workflowData.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-500">
                    Released
                  </p>
                  <p className="mt-1 text-lg font-black text-emerald-600">
                    {formatCompactPKR(summary.budgetReleasedAmount)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-500">
                    Remaining
                  </p>
                  <p className="mt-1 text-lg font-black text-blue-600">
                    {formatCompactPKR(summary.budgetRemainingAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Module Overview
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Live totals from every major front-end module.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ModuleCard
              title="Budget Requests"
              subtitle="Approval, payment-release and remaining-balance status."
              icon={FileText}
              items={[
                {
                  label: "Total Requests",
                  value: String(data.invoiceRequests.length),
                },
                {
                  label: "Approved Value",
                  value: formatCompactPKR(summary.budgetTotalAmount),
                },
                {
                  label: "Partial Releases",
                  value: String(summary.budgetPartial),
                  className: "text-blue-600",
                },
                {
                  label: "Fully Released",
                  value: String(summary.budgetReleased),
                  className: "text-emerald-600",
                },
              ]}
            />

            <ModuleCard
              title="Estimates"
              subtitle="Estimate pipeline and converted estimate records."
              icon={FileSpreadsheet}
              items={[
                {
                  label: "Total Estimates",
                  value: String(data.estimates.length),
                },
                {
                  label: "Estimate Value",
                  value: formatCompactPKR(summary.estimateTotalAmount),
                },
                {
                  label: "Approved",
                  value: String(summary.estimateApproved),
                  className: "text-emerald-600",
                },
                {
                  label: "Invoiced",
                  value: String(summary.estimateInvoiced),
                  className: "text-blue-600",
                },
              ]}
            />

            <ModuleCard
              title="Estimate Invoices"
              subtitle="Paid, unpaid and partially-paid client invoices."
              icon={ReceiptText}
              items={[
                {
                  label: "Total Invoices",
                  value: String(data.estimateInvoices.length),
                },
                {
                  label: "Invoice Value",
                  value: formatCompactPKR(summary.invoiceTotalAmount),
                },
                {
                  label: "Paid / Partial",
                  value: `${summary.paidInvoices} / ${summary.partialInvoices}`,
                  className: "text-emerald-600",
                },
                {
                  label: "Outstanding",
                  value: formatCompactPKR(summary.invoiceOutstanding),
                  className: "text-amber-600",
                },
              ]}
            />

            <ModuleCard
              title="Purchase Orders"
              subtitle="Purchase-order totals, open orders and overdue items."
              icon={PackageCheck}
              items={[
                {
                  label: "Total POs",
                  value: String(data.purchaseOrders.length),
                },
                {
                  label: "PO Value",
                  value: formatCompactPKR(summary.poTotalAmount),
                },
                {
                  label: "Open / Paid",
                  value: `${summary.poOpen} / ${summary.poPaid}`,
                },
                {
                  label: "Overdue",
                  value: String(summary.poOverdue),
                  className: "text-rose-600",
                },
              ]}
            />

            <ModuleCard
              title="Budget Expenses"
              subtitle="Submitted expense sheets and recorded expense value."
              icon={CreditCard}
              items={[
                {
                  label: "Expense Sheets",
                  value: String(data.expenseSheets.length),
                },
                {
                  label: "Submitted Value",
                  value: formatCompactPKR(summary.expenseSheetAmount),
                },
                {
                  label: "This Month Cash Out",
                  value: formatCompactPKR(summary.monthExpense),
                },
                {
                  label: "Total Cash Out",
                  value: formatCompactPKR(summary.totalExpense),
                  className: "text-rose-600",
                },
              ]}
            />

            <ModuleCard
              title="Reimbursements"
              subtitle="Direct and sales-meeting reimbursement claims."
              icon={Users}
              items={[
                {
                  label: "Total Claims",
                  value: String(
                    data.directClaims.length + data.meetingClaims.length,
                  ),
                },
                {
                  label: "Claim Value",
                  value: formatCompactPKR(summary.reimbursementAmount),
                },
                {
                  label: "Pending / Approved",
                  value: `${summary.reimbursementPending} / ${summary.reimbursementApproved}`,
                },
                {
                  label: "Paid Amount",
                  value: formatCompactPKR(summary.reimbursementPaidAmount),
                  className: "text-emerald-600",
                },
              ]}
            />

            <ModuleCard
              title="Records & Cheques"
              subtitle="Cheque records, item amounts and remaining balances."
              icon={Landmark}
              items={[
                { label: "Total Records", value: String(data.records.length) },
                {
                  label: "Cheque Amount",
                  value: formatCompactPKR(summary.recordChequeAmount),
                },
                {
                  label: "Item Amount",
                  value: formatCompactPKR(summary.recordItemAmount),
                },
                {
                  label: "Remaining",
                  value: formatCompactPKR(summary.recordRemaining),
                  className:
                    summary.recordRemaining < 0
                      ? "text-rose-600"
                      : "text-emerald-600",
                },
              ]}
            />

            <ModuleCard
              title="Vendors"
              subtitle="Vendor exposure derived from budget requests and releases."
              icon={Building2}
              items={[
                { label: "Unique Vendors", value: String(summary.vendorCount) },
                {
                  label: "Paid to Vendors",
                  value: formatCompactPKR(summary.budgetReleasedAmount),
                },
                {
                  label: "Remaining Payable",
                  value: formatCompactPKR(summary.budgetRemainingAmount),
                  className: "text-blue-600",
                },
                {
                  label: "Overdue Payable",
                  value: formatCompactPKR(summary.vendorOverdue),
                  className: "text-rose-600",
                },
              ]}
            />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-950">
                    Recent System Activity
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Latest updates across requests, invoices, POs, expenses,
                    reimbursements and records.
                  </p>
                </div>
                <Activity className="h-5 w-5 text-slate-400" />
              </div>

              <div className="mt-5 divide-y divide-slate-100">
                {summary.activities.length === 0 ? (
                  <div className="py-12 text-center">
                    <CalendarClock className="mx-auto h-7 w-7 text-slate-300" />
                    <p className="mt-3 text-sm font-semibold text-slate-500">
                      No recent activity found.
                    </p>
                  </div>
                ) : (
                  summary.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                        <Activity className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-black text-slate-900">
                            {activity.title}
                          </p>
                          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                            {activity.module}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {activity.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                        <StatusBadge status={activity.status} />
                        <span className="text-[11px] font-semibold text-slate-400">
                          {formatRelativeTime(activity.date)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-black text-slate-950">
                      Financial Health
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Key collection and payment indicators.
                    </p>
                  </div>
                  <Wallet className="h-5 w-5 text-slate-400" />
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-500">
                      <span>Invoice Collection</span>
                      <span>
                        {summary.invoiceTotalAmount > 0
                          ? Math.min(
                              (summary.receivedInvoiceAmount /
                                summary.invoiceTotalAmount) *
                                100,
                              100,
                            ).toFixed(0)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{
                          width: `${
                            summary.invoiceTotalAmount > 0
                              ? Math.min(
                                  (summary.receivedInvoiceAmount /
                                    summary.invoiceTotalAmount) *
                                    100,
                                  100,
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-500">
                      <span>Budget Released</span>
                      <span>
                        {summary.budgetTotalAmount > 0
                          ? Math.min(
                              (summary.budgetReleasedAmount /
                                summary.budgetTotalAmount) *
                                100,
                              100,
                            ).toFixed(0)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{
                          width: `${
                            summary.budgetTotalAmount > 0
                              ? Math.min(
                                  (summary.budgetReleasedAmount /
                                    summary.budgetTotalAmount) *
                                    100,
                                  100,
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-500">
                      <span>Reimbursements Paid</span>
                      <span>
                        {summary.reimbursementApproved > 0
                          ? Math.min(
                              (summary.reimbursementPaid /
                                summary.reimbursementApproved) *
                                100,
                              100,
                            ).toFixed(0)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-violet-500"
                        style={{
                          width: `${
                            summary.reimbursementApproved > 0
                              ? Math.min(
                                  (summary.reimbursementPaid /
                                    summary.reimbursementApproved) *
                                    100,
                                  100,
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-black text-slate-950">
                      System Snapshot
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Record counts across connected modules.
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-slate-400" />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    ["Requests", data.invoiceRequests.length],
                    ["Estimates", data.estimates.length],
                    ["Invoices", data.estimateInvoices.length],
                    ["Payments", data.payments.length],
                    ["POs", data.purchaseOrders.length],
                    ["Expenses", data.expenseSheets.length],
                    [
                      "Claims",
                      data.directClaims.length + data.meetingClaims.length,
                    ],
                    ["Records", data.records.length],
                  ].map(([label, value]) => (
                    <div
                      key={String(label)}
                      className="rounded-2xl bg-slate-50 p-3"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        {label}
                      </p>
                      <p className="mt-1 text-xl font-black text-slate-950">
                        {Number(value).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      {canCreateInvoices && (
        <InvoiceRequestModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          onSuccess={() => {
            setIsInvoiceModalOpen(false);
            loadDashboardData(true);
          }}
        />
      )}
    </div>
  );
}
