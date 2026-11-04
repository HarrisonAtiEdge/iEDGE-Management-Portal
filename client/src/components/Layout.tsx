// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { onAuthStateChanged, signOut } from "firebase/auth";
// import {
//   collection,
//   doc,
//   getDoc,
//   onSnapshot,
//   query,
//   where,
// } from "firebase/firestore";
// import { auth, db } from "@/lib/firebase";
// import { Button } from "@/components/ui/button";
// import type { LucideIcon } from "lucide-react";
// import {
//   ChevronLeft,
//   ChevronRight,
//   ChevronDown,
//   Loader2,
//   LogOut,
//   User,
//   LayoutDashboard,
//   LineChart,
//   BarChart3,
//   UserRound,
//   Archive,
//   Globe,
//   Receipt,
//   Users,
//   PieChart,
//   Settings,
//   Hotel,
//   FileText,
//   Scroll,
//   ScrollText,
//   BedDouble,
//   PlaneTakeoff,
//   CreditCard,
//   HandCoins,
//   WalletCards,
//   BookUser,
//   CalendarCheck,
//   ClipboardList,
//   ReceiptText,
//   Search,
//   X,
//   ExternalLink,
//   TrendingUp,
//   Banknote,
//   PenLine,
// } from "lucide-react";
// import { Link, useLocation } from "wouter";
// import { canAccessRtgs } from "@/components/RTGS/rtgsData";
// import { NotificationBell } from "@/components/NotificationBell";
// import { AttendanceCheckButton } from "@/components/EmployeeRequests/AttendanceCheckButton";
// import { useNotifications } from "@/hooks/useNotifications";
// import { ThemeToggle } from "@/components/theme-toggle";
// import { getAllChequeNumbers } from "@/lib/chequeNumbers";
// import {
//   REQUEST_NOTIFICATION_TYPES,
//   getApprovalAccess,
//   subscribeToApprovers,
//   type RequestApprover,
// } from "@/lib/employeeRequests";

// const PANEL_ID = "IEDGE-SYSTEM";

// interface SidebarItem {
//   path: string;
//   label: string;
//   icon?: string;
//   children?: SidebarItem[];
// }

// type ChequeSearchKind =
//   | "record"
//   | "payment"
//   | "budgetRequest"
//   | "reimbursement"
//   | "statementEntry";

// type GlobalSearchKind = "estimate" | "invoice" | "po" | ChequeSearchKind;

// type GlobalSearchRecord = {
//   id: string;
//   [key: string]: any;
// };

// type GlobalSearchData = Record<GlobalSearchKind, GlobalSearchRecord[]>;

// type GlobalSearchResult = {
//   kind: GlobalSearchKind;
//   label: string;
//   route: string;
//   record: GlobalSearchRecord;
//   primaryNumber: string;
// };

// const GLOBAL_SEARCH_SOURCES: Array<{
//   key: GlobalSearchKind;
//   collectionName: string;
//   label: string;
//   route: string;
// }> = [
//   {
//     key: "estimate",
//     collectionName: "estimates",
//     label: "Estimate",
//     route: "/estimate",
//   },
//   {
//     key: "invoice",
//     collectionName: "estimateInvoices",
//     label: "Invoice",
//     route: "/invoice-estimate",
//   },
//   {
//     key: "po",
//     collectionName: "purchaseOrders",
//     label: "Purchase Order",
//     route: "/purchase-orders",
//   },
// ];

// // Collections that hold cheques. Unlike the sources above, these are matched
// // on cheque numbers only, so a general keyword search is not flooded with
// // payments and ledger entries. ownerField is the field holding the creator's
// // uid, used to limit non-admin users to their own records; null means the
// // collection has no owner field and is only searchable by admin/finance roles.
// const CHEQUE_SEARCH_SOURCES: Array<{
//   key: ChequeSearchKind;
//   collectionName: string;
//   label: string;
//   route: string;
//   ownerField: string | null;
// }> = [
//   {
//     key: "record",
//     collectionName: "Record",
//     label: "Cheque Record",
//     route: "/records",
//     ownerField: "createdBy",
//   },
//   {
//     key: "payment",
//     collectionName: "payments",
//     label: "Payment",
//     route: "/account-statement",
//     ownerField: null,
//   },
//   {
//     key: "budgetRequest",
//     collectionName: "invoiceRequests",
//     label: "Budget Request",
//     route: "/budget-requests",
//     ownerField: "createdBy",
//   },
//   {
//     key: "reimbursement",
//     collectionName: "claimReimbursements",
//     label: "Reimbursement",
//     route: "/reimbursement",
//     ownerField: "createdBy",
//   },
//   {
//     key: "statementEntry",
//     collectionName: "accountStatementManualEntries",
//     label: "Statement Entry",
//     route: "/account-statement",
//     ownerField: "createdById",
//   },
// ];

// const GLOBAL_SEARCH_VIEW_ALL_ROLES = [
//   "main_admin",
//   "admin",
//   "operational_admin",
//   "financial_admin",
//   "finance",
// ];

// const createEmptyGlobalSearchData = (): GlobalSearchData => ({
//   estimate: [],
//   invoice: [],
//   po: [],
//   record: [],
//   payment: [],
//   budgetRequest: [],
//   reimbursement: [],
//   statementEntry: [],
// });

// // The stored cheque number that best matches the search, or "" if none does.
// function getMatchingChequeNumber(
//   record: GlobalSearchRecord,
//   searchTerm: string,
// ): string {
//   const compactSearch = normalizeGlobalSearchValue(searchTerm);
//   if (!compactSearch) return "";

//   const chequeNumbers = getAllChequeNumbers(record);

//   return (
//     chequeNumbers.find(
//       (chequeNumber) =>
//         normalizeGlobalSearchValue(chequeNumber) === compactSearch,
//     ) ||
//     chequeNumbers.find((chequeNumber) =>
//       normalizeGlobalSearchValue(chequeNumber).includes(compactSearch),
//     ) ||
//     ""
//   );
// }

// function getGlobalSearchModuleRoute(result: GlobalSearchResult): string {
//   if (result.kind === "estimate") {
//     const estimateNo = getEstimateNumber(result.record) || result.primaryNumber;
//     const params = new URLSearchParams();
//     params.set("tab", "list");

//     if (estimateNo) {
//       params.set("estimateNo", estimateNo);
//     }

//     return `/estimate?${params.toString()}`;
//   }

//   return result.route;
// }

// function normalizeGlobalSearchValue(value: unknown): string {
//   return String(value ?? "")
//     .normalize("NFKD")
//     .replace(/[\u0300-\u036f]/g, "")
//     .toLowerCase()
//     .replace(/[^a-z0-9]+/g, "")
//     .trim();
// }

// function normalizeGlobalSearchText(value: unknown): string {
//   return String(value ?? "")
//     .normalize("NFKD")
//     .replace(/[\u0300-\u036f]/g, "")
//     .toLowerCase()
//     .replace(/[^a-z0-9]+/g, " ")
//     .replace(/\s+/g, " ")
//     .trim();
// }

// function firstNonEmpty(...values: unknown[]): string {
//   for (const value of values) {
//     const stringValue = String(value ?? "").trim();
//     if (stringValue) return stringValue;
//   }

//   return "";
// }

// function getEstimateNumber(record: any): string {
//   return firstNonEmpty(
//     record?.estimateNo,
//     record?.estimateNumber,
//     record?.sourceEstimateNo,
//     record?.sourceEstimateNumber,
//     record?.linkedEstimateNo,
//   );
// }

// function getInvoiceNumber(record: any): string {
//   return firstNonEmpty(
//     record?.invoiceNo,
//     record?.invoiceNumber,
//     record?.sourceInvoiceNo,
//     record?.sourceInvoiceNumber,
//   );
// }

// function getPONumber(record: any): string {
//   return firstNonEmpty(
//     record?.poNumber,
//     record?.poNo,
//     record?.purchaseOrderNo,
//     record?.purchaseOrderNumber,
//     record?.sourcePoNo,
//     record?.sourcePONumber,
//   );
// }

// function getPrimarySearchNumber(
//   kind: GlobalSearchKind,
//   record: GlobalSearchRecord,
// ): string {
//   if (kind === "estimate") {
//     return getEstimateNumber(record) || record.id;
//   }

//   if (kind === "invoice") {
//     return getInvoiceNumber(record) || record.id;
//   }

//   return getPONumber(record) || record.id;
// }

// function getAllSearchableValues(record: GlobalSearchRecord): string[] {
//   const values: string[] = [String(record?.id || "")];
//   const visited = new WeakSet<object>();

//   const walk = (value: any, depth = 0) => {
//     if (value === null || value === undefined || depth > 10) return;

//     if (value?.toDate && typeof value.toDate === "function") {
//       try {
//         const date = value.toDate();
//         values.push(
//           date.toISOString(),
//           date.toLocaleString("en-GB"),
//           String(date.getTime()),
//         );
//       } catch {
//         // Ignore invalid Firestore timestamps.
//       }
//       return;
//     }

//     if (value instanceof Date) {
//       values.push(
//         value.toISOString(),
//         value.toLocaleString("en-GB"),
//         String(value.getTime()),
//       );
//       return;
//     }

//     if (
//       typeof value === "string" ||
//       typeof value === "number" ||
//       typeof value === "boolean"
//     ) {
//       values.push(String(value));
//       return;
//     }

//     if (Array.isArray(value)) {
//       value.forEach((item) => walk(item, depth + 1));
//       return;
//     }

//     if (typeof value === "object") {
//       if (visited.has(value)) return;
//       visited.add(value);

//       Object.entries(value).forEach(([key, nestedValue]) => {
//         // Field names are searchable too, e.g. "vendor", "status", "description".
//         values.push(key);
//         walk(nestedValue, depth + 1);
//       });
//     }
//   };

//   walk(record);

//   return Array.from(
//     new Set(values.map((value) => String(value || "").trim()).filter(Boolean)),
//   );
// }

// function recordMatchesGlobalSearch(
//   record: GlobalSearchRecord,
//   searchTerm: string,
// ): boolean {
//   const rawSearch = String(searchTerm || "").trim();
//   if (!rawSearch) return false;

//   const compactSearch = normalizeGlobalSearchValue(rawSearch);
//   const searchTokens = normalizeGlobalSearchText(rawSearch)
//     .split(" ")
//     .filter(Boolean);

//   if (!compactSearch && searchTokens.length === 0) return false;

//   const values = getAllSearchableValues(record);

//   // First allow a normal contains match against every individual stored value.
//   if (
//     compactSearch &&
//     values.some((value) =>
//       normalizeGlobalSearchValue(value).includes(compactSearch),
//     )
//   ) {
//     return true;
//   }

//   // Multi-keyword search can match words stored in different fields of the same record.
//   const combinedText = normalizeGlobalSearchText(values.join(" "));

//   return (
//     searchTokens.length > 0 &&
//     searchTokens.every((token) => combinedText.includes(token))
//   );
// }

// function getGlobalSearchScore(
//   record: GlobalSearchRecord,
//   primaryNumber: string,
//   searchTerm: string,
// ): number {
//   const compactSearch = normalizeGlobalSearchValue(searchTerm);
//   if (!compactSearch) return 0;

//   const primary = normalizeGlobalSearchValue(primaryNumber);
//   if (primary === compactSearch) return 1000;
//   if (primary.startsWith(compactSearch)) return 800;
//   if (primary.includes(compactSearch)) return 700;

//   const values = getAllSearchableValues(record).map(normalizeGlobalSearchValue);

//   if (values.some((value) => value === compactSearch)) return 600;
//   if (values.some((value) => value.startsWith(compactSearch))) return 500;
//   if (values.some((value) => value.includes(compactSearch))) return 400;

//   return 100;
// }

// function formatGlobalSearchAmount(value: unknown): string {
//   const amount = Number(value ?? 0);

//   if (!Number.isFinite(amount)) return "-";

//   return `Rs. ${amount.toLocaleString("en-PK", {
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 2,
//   })}`;
// }

// function formatGlobalSearchDate(value: any): string {
//   if (!value) return "-";

//   try {
//     const date =
//       value?.toDate && typeof value.toDate === "function"
//         ? value.toDate()
//         : value instanceof Date
//           ? value
//           : new Date(value);

//     if (Number.isNaN(date.getTime())) {
//       return String(value);
//     }

//     return date.toLocaleDateString("en-GB", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//     });
//   } catch {
//     return String(value);
//   }
// }

// function getSearchResultDetails(record: GlobalSearchRecord) {
//   return {
//     estimateNo: getEstimateNumber(record),
//     invoiceNo: getInvoiceNumber(record),
//     poNo: getPONumber(record),
//     clientOrVendor: firstNonEmpty(
//       record?.client,
//       record?.clientName,
//       record?.vendor,
//       record?.vendorName,
//       record?.supplier,
//       record?.supplierName,
//     ),
//     subject: firstNonEmpty(
//       record?.subject,
//       record?.invoiceSubject,
//       record?.title,
//       record?.project,
//       record?.description,
//       record?.statementTitle,
//     ),
//     chequeNumbers: getAllChequeNumbers(record).join(", "),
//     company: firstNonEmpty(record?.company, record?.companyName),
//     status: firstNonEmpty(record?.status),
//     date: formatGlobalSearchDate(
//       record?.invoiceDate ??
//         record?.poDate ??
//         record?.date ??
//         record?.createdAt ??
//         record?.submittedAt ??
//         record?.selectedDate ??
//         record?.chequeDate,
//     ),
//     amount: formatGlobalSearchAmount(
//       record?.total ??
//         record?.totalAmount ??
//         record?.grandTotal ??
//         record?.netTotal ??
//         record?.chequeAmount ??
//         record?.claimAmount ??
//         record?.amount ??
//         0,
//     ),
//     createdBy: firstNonEmpty(
//       record?.createdByName,
//       record?.creatorName,
//       record?.submittedByName,
//       record?.requestedByName,
//       record?.preparedByName,
//     ),
//   };
// }

// function humanizePreviewKey(key: string): string {
//   return String(key || "")
//     .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
//     .replace(/[_-]+/g, " ")
//     .replace(/\b\w/g, (character) => character.toUpperCase());
// }

// function isPreviewTimestamp(value: any): boolean {
//   return !!value && typeof value?.toDate === "function";
// }

// function isPreviewUrl(value: unknown): boolean {
//   if (typeof value !== "string") return false;

//   return /^https?:\/\//i.test(value.trim());
// }

// function getPreviewPrimitiveText(value: any): string {
//   if (value === null || value === undefined || value === "") return "-";

//   if (isPreviewTimestamp(value)) {
//     try {
//       return value.toDate().toLocaleString("en-GB");
//     } catch {
//       return "-";
//     }
//   }

//   if (value instanceof Date) {
//     return value.toLocaleString("en-GB");
//   }

//   if (typeof value === "boolean") {
//     return value ? "Yes" : "No";
//   }

//   if (typeof value === "number") {
//     return Number.isFinite(value)
//       ? value.toLocaleString("en-PK", { maximumFractionDigits: 2 })
//       : String(value);
//   }

//   return String(value);
// }

// function PreviewPrimitive({ value }: { value: any }) {
//   const text = getPreviewPrimitiveText(value);

//   if (isPreviewUrl(value)) {
//     return (
//       <a
//         href={String(value)}
//         target="_blank"
//         rel="noreferrer"
//         className="break-all font-medium text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-800"
//       >
//         {text}
//       </a>
//     );
//   }

//   return (
//     <span className="whitespace-pre-wrap break-words text-sm font-medium text-slate-800">
//       {text}
//     </span>
//   );
// }

// function PreviewValue({ value, depth = 0 }: { value: any; depth?: number }) {
//   if (
//     value === null ||
//     value === undefined ||
//     typeof value !== "object" ||
//     value instanceof Date ||
//     isPreviewTimestamp(value)
//   ) {
//     return <PreviewPrimitive value={value} />;
//   }

//   if (Array.isArray(value)) {
//     if (value.length === 0) {
//       return <span className="text-sm text-slate-400">No items</span>;
//     }

//     const allPrimitive = value.every(
//       (item) =>
//         item === null ||
//         item === undefined ||
//         typeof item !== "object" ||
//         item instanceof Date ||
//         isPreviewTimestamp(item),
//     );

//     if (allPrimitive) {
//       return (
//         <div className="flex flex-wrap gap-2">
//           {value.map((item, index) => (
//             <span
//               key={index}
//               className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
//             >
//               {getPreviewPrimitiveText(item)}
//             </span>
//           ))}
//         </div>
//       );
//     }

//     return (
//       <div className="space-y-3">
//         {value.map((item, index) => (
//           <div
//             key={index}
//             className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
//           >
//             <div className="mb-3 flex items-center justify-between">
//               <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
//                 Item {index + 1}
//               </span>
//             </div>
//             <PreviewValue value={item} depth={depth + 1} />
//           </div>
//         ))}
//       </div>
//     );
//   }

//   const entries = Object.entries(value);

//   if (entries.length === 0) {
//     return <span className="text-sm text-slate-400">No details</span>;
//   }

//   return (
//     <div
//       className={
//         depth === 0
//           ? "grid grid-cols-1 gap-3 md:grid-cols-2"
//           : "grid grid-cols-1 gap-3"
//       }
//     >
//       {entries.map(([key, nestedValue]) => {
//         const isComplex =
//           nestedValue !== null &&
//           nestedValue !== undefined &&
//           typeof nestedValue === "object" &&
//           !(nestedValue instanceof Date) &&
//           !isPreviewTimestamp(nestedValue);

//         return (
//           <div
//             key={key}
//             className={`rounded-xl border border-slate-200 bg-slate-50 p-4 ${
//               isComplex && depth === 0 ? "md:col-span-2" : ""
//             }`}
//           >
//             <div className="mb-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
//               {humanizePreviewKey(key)}
//             </div>
//             <PreviewValue value={nestedValue} depth={depth + 1} />
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// // ✅ Lucide icon registry
// const LUCIDE_ICONS: Record<string, LucideIcon> = {
//   LayoutDashboard,
//   LineChart,
//   BarChart3,
//   UserRound,
//   User,
//   Archive,
//   Globe,
//   Receipt,
//   Users,
//   PieChart,
//   Settings,
//   Hotel,
//   FileText,
//   Scroll,
//   ScrollText,
//   BedDouble,
//   PlaneTakeoff,
//   CreditCard,
//   HandCoins,
//   WalletCards,
//   BookUser,
//   CalendarCheck,
//   ClipboardList,
//   ReceiptText,
//   TrendingUp,
//   Banknote,
//   PenLine,
// };

// // ✅ Backward compatibility for old FontAwesome names
// const FA_TO_LUCIDE: Record<string, LucideIcon> = {
//   "fas fa-tachometer-alt": LayoutDashboard,
//   "fas fa-chart-line": LineChart,
//   "fas fa-chart-bar": BarChart3,
//   "fas fa-user": User,
//   "fas fa-archive": Archive,
//   "fas fa-globe": Globe,
//   "fas fa-receipt": Receipt,
//   "fas fa-users": Users,
//   "fas fa-chart-pie": PieChart,
//   "fas fa-hotel": Hotel,
// };

// const getSidebarIcon = (icon?: string): LucideIcon | null => {
//   if (!icon) return null;
//   return LUCIDE_ICONS[icon] ?? FA_TO_LUCIDE[icon] ?? null;
// };

// const CONTACTS_DROPDOWN: SidebarItem = {
//   path: "#",
//   label: "Contacts Directory",
//   icon: "BookUser",
//   children: [
//     { path: "/clients", label: "Clients", icon: "Users" },
//     { path: "/suppliers", label: "Suppliers", icon: "BookUser" },
//     { path: "/contact-persons", label: "Contact Persons", icon: "User" },
//   ],
// };

// const FINANCE_DROPDOWN: SidebarItem = {
//   path: "#",
//   label: "Finance",
//   icon: "WalletCards",
//   children: [
//     { path: "/account-statement", label: "Account Statement", icon: "Receipt" },
//     { path: "/budget-requests", label: "Budget Requests", icon: "FileText" },
//     { path: "/expenses", label: "Expenses", icon: "Receipt" },
//     { path: "/accounts", label: "Accounts", icon: "WalletCards" },
//     { path: "/reimbursement", label: "Reimbursement", icon: "HandCoins" },
//     { path: "/purchase-orders", label: "Purchase Orders", icon: "ReceiptText" },
//     {
//       path: "/claim-reimbursement",
//       label: "Claim Reimbursement",
//       icon: "ReceiptText",
//     },
//     { path: "/records", label: "Records", icon: "Archive" },
//     { path: "/vendor-summery", label: "Vendor Summary", icon: "Receipt" },
//   ],
// };

// const TRAVEL_DROPDOWN: SidebarItem = {
//   path: "#",
//   label: "Travel",
//   icon: "PlaneTakeoff",
//   children: [
//     { path: "/travel/ticketing", label: "Ticketing", icon: "PlaneTakeoff" },
//     { path: "/usertravel", label: "Book Hotel", icon: "BedDouble" },
//     { path: "/booking", label: "Bookings", icon: "Hotel" },
//     { path: "/travel/hotel", label: "+ Add Hotels", icon: "Hotel" },
//   ],
// };

// const RTGS_DROPDOWN: SidebarItem = {
//   path: "#",
//   label: "RTGS",
//   icon: "Banknote",
//   children: [
//     { path: "/RTGS/form", label: "RTGS Form", icon: "FileText" },
//     { path: "/RTGS/list", label: "RTGS List", icon: "Archive" },
//     { path: "/RTGS/vendors", label: "RTGS Vendors", icon: "BookUser" },
//     { path: "/RTGS/authorizers", label: "Authorizer", icon: "PenLine" },
//   ],
// };

// // ✅ Main admin fallback tabs
// const AVAILABLE_TABS: SidebarItem[] = [
//   { path: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
//   { path: "/reports", label: "Reports", icon: "TrendingUp" },
//   { path: "/sales-dashboard", label: "Sales Dashboard", icon: "LineChart" },
//   { path: "/project", label: "Projects", icon: "BarChart3" },
//   { path: "/task-calendar", label: "Tasks", icon: "CalendarCheck" },
//   { path: "/estimate", label: "Estimate", icon: "Scroll" },
//   { path: "/rtd-management", label: "RTD Management", icon: "FileText" },
//   { path: "/invoice-estimate", label: "Invoice ", icon: "ScrollText" },
//   { path: "/sales-management", label: "Pipeline Management", icon: "PieChart" },
//   { path: "/users", label: "User Management", icon: "UserRound" },
//   FINANCE_DROPDOWN,
//   TRAVEL_DROPDOWN,
//   CONTACTS_DROPDOWN,
//   // { path: "/records", label: "Records", icon: "Archive" },

//   // { path: "/budget-requests", label: "Budget Request", icon: "HandCoins" },
//   // { path: "/expenses", label: "Expenses", icon: "Receipt" },
//   // { path: "/accounts", label: "Account ledger", icon: "WalletCards" },
//   // { path: "/reimbursement", label: "Reimbursement", icon: "Receipt" },
//   // {
//   //   path: "/estimateInternational",
//   //   label: "International Estimate",
//   //   icon: "Globe",
//   // },

//   { path: "/settings", label: "Settings", icon: "Settings" },

//   // { path: "/accounts", label: "Account ledger", icon: "WalletCards" },
//   // { path: "/reimbursement", label: "Reimbursement", icon: "Receipt" },
// ];

// function normalizeRole(role: unknown): string {
//   return String(role || "")
//     .trim()
//     .toLowerCase();
// }

// // ✅ Ensures admin/main_admin always get Contacts Directory dropdown
// function ensureContactsDropdown(items: SidebarItem[]): SidebarItem[] {
//   const safeItems = Array.isArray(items) ? items : [];

//   const alreadyHasContactsDropdown = safeItems.some(
//     (item) =>
//       item.label === "Contacts Directory" ||
//       item.children?.some(
//         (child) =>
//           child.path === "/clients" ||
//           child.path === "/suppliers" ||
//           child.path === "/contact-persons",
//       ),
//   );

//   if (alreadyHasContactsDropdown) {
//     return safeItems;
//   }

//   // Remove old standalone contact tabs if they exist, then insert dropdown
//   const filteredItems = safeItems.filter(
//     (item) =>
//       item.path !== "/clients" &&
//       item.path !== "/suppliers" &&
//       item.path !== "/contact-persons",
//   );

//   const dashboardIndex = filteredItems.findIndex(
//     (item) => item.path === "/dashboard",
//   );

//   if (dashboardIndex >= 0) {
//     const updated = [...filteredItems];
//     updated.splice(dashboardIndex + 1, 0, CONTACTS_DROPDOWN);
//     return updated;
//   }

//   return [CONTACTS_DROPDOWN, ...filteredItems];
// }

// function ensureFinanceDropdown(items: SidebarItem[]): SidebarItem[] {
//   const safeItems = Array.isArray(items) ? items : [];

//   const alreadyHasFinanceDropdown = safeItems.some(
//     (item) =>
//       item.label === "Finance" &&
//       item.children?.some(
//         (child) =>
//           child.path === "/budget-requests" ||
//           child.path === "/expenses" ||
//           child.path === "/accounts" ||
//           child.path === "/reimbursement",
//       ),
//   );

//   if (alreadyHasFinanceDropdown) {
//     return safeItems;
//   }

//   const filteredItems = safeItems.filter(
//     (item) =>
//       item.path !== "/finance" &&
//       item.path !== "/budget-requests" &&
//       item.path !== "/expenses" &&
//       item.path !== "/accounts" &&
//       item.path !== "/reimbursement" &&
//       item.label !== "Finance" &&
//       item.label !== "Account ledger",
//   );

//   const contactsIndex = filteredItems.findIndex(
//     (item) => item.label === "Contacts Directory",
//   );

//   if (contactsIndex >= 0) {
//     const updated = [...filteredItems];
//     updated.splice(contactsIndex + 1, 0, FINANCE_DROPDOWN);
//     return updated;
//   }

//   const dashboardIndex = filteredItems.findIndex(
//     (item) => item.path === "/dashboard",
//   );

//   if (dashboardIndex >= 0) {
//     const updated = [...filteredItems];
//     updated.splice(dashboardIndex + 1, 0, FINANCE_DROPDOWN);
//     return updated;
//   }

//   return [FINANCE_DROPDOWN, ...filteredItems];
// }

// function ensureRTDManagementTab(items: SidebarItem[]): SidebarItem[] {
//   const safeItems = Array.isArray(items) ? items : [];

//   const alreadyExists = safeItems.some(
//     (item) => item.path === "/rtd-management",
//   );

//   if (alreadyExists) {
//     return safeItems;
//   }

//   const estimateIndex = safeItems.findIndex(
//     (item) => item.path === "/estimate",
//   );

//   const updated = [...safeItems];
//   const rtdItem: SidebarItem = {
//     path: "/rtd-management",
//     label: "RTD Management",
//     icon: "FileText",
//   };

//   if (estimateIndex >= 0) {
//     updated.splice(estimateIndex + 1, 0, rtdItem);
//     return updated;
//   }

//   updated.push(rtdItem);
//   return updated;
// }

// function ensureReportsTab(items: SidebarItem[]): SidebarItem[] {
//   const safeItems = Array.isArray(items) ? items : [];

//   const alreadyExists = safeItems.some((item) => item.path === "/reports");

//   if (alreadyExists) {
//     return safeItems;
//   }

//   const dashboardIndex = safeItems.findIndex(
//     (item) => item.path === "/dashboard",
//   );

//   const reportsItem: SidebarItem = {
//     path: "/reports",
//     label: "Reports",
//     icon: "TrendingUp",
//   };

//   const updated = [...safeItems];

//   if (dashboardIndex >= 0) {
//     updated.splice(dashboardIndex + 1, 0, reportsItem);
//     return updated;
//   }

//   return [reportsItem, ...updated];
// }

// // Every user can make requests (leave, salary advance, documents), so the tab
// // is added for all roles after Tasks (or Dashboard) unless the saved sidebar
// // already has it. Its label is set when rendering: "Employee Management" for
// // the main admin and anyone given approve or record access, "Self
// // Management" for everyone else. A saved entry for the old /leave page is
// // replaced.
// function ensureRequestsTab(items: SidebarItem[]): SidebarItem[] {
//   const safeItems = (Array.isArray(items) ? items : []).filter(
//     (item) => item.path !== "/leave",
//   );

//   const alreadyExists = safeItems.some(
//     (item) =>
//       item.path === "/requests" ||
//       item.children?.some((child) => child.path === "/requests"),
//   );

//   if (alreadyExists) {
//     return safeItems;
//   }

//   const requestsItem: SidebarItem = {
//     path: "/requests",
//     label: "Self Management",
//     icon: "ClipboardList",
//   };

//   const anchorIndex = [
//     safeItems.findIndex((item) => item.path === "/task-calendar"),
//     safeItems.findIndex((item) => item.path === "/dashboard"),
//   ].find((index) => index >= 0);

//   const updated = [...safeItems];

//   if (anchorIndex !== undefined) {
//     updated.splice(anchorIndex + 1, 0, requestsItem);
//     return updated;
//   }

//   updated.push(requestsItem);
//   return updated;
// }

// // RTGS is for the finance team and main admins only — added here rather than
// // in AVAILABLE_TABS so the sidebar config screen can't hand it to other roles.
// // Placed right after the Finance dropdown when the role has one.
// function applyRtgsAccess(items: SidebarItem[], userRole: string): SidebarItem[] {
//   const safeItems = Array.isArray(items) ? items : [];
//   const withoutRtgs = safeItems.filter((item) => item.label !== RTGS_DROPDOWN.label);

//   if (!canAccessRtgs(userRole)) {
//     return withoutRtgs;
//   }

//   const financeIndex = withoutRtgs.findIndex((item) => item.label === "Finance");
//   const updated = [...withoutRtgs];
//   updated.splice(financeIndex >= 0 ? financeIndex + 1 : updated.length, 0, RTGS_DROPDOWN);
//   return updated;
// }

// export default function Layout({ children }: { children: React.ReactNode }) {
//   const [loading, setLoading] = useState(true);
//   const [role, setRole] = useState<string | null>(null);
//   const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);
//   const [userName, setUserName] = useState<string>("User");

//   const [searchUserId, setSearchUserId] = useState<string | null>(null);
//   const [globalSearch, setGlobalSearch] = useState("");
//   const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
//   const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
//   // Cheque collections load only once the search box is first used, so pages
//   // don't keep five extra live listeners open for users who never search.
//   const [chequeSearchActivated, setChequeSearchActivated] = useState(false);
//   const [chequeSearchLoading, setChequeSearchLoading] = useState(false);
//   const [globalSearchData, setGlobalSearchData] = useState<GlobalSearchData>(
//     createEmptyGlobalSearchData,
//   );
//   const [selectedGlobalSearchResult, setSelectedGlobalSearchResult] =
//     useState<GlobalSearchResult | null>(null);

//   const [location, setLocation] = useLocation();

//   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
//   const [sidebarHoverOpen, setSidebarHoverOpen] = useState(false);
//   const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>(
//     {},
//   );

//   const effectiveCollapsed = sidebarCollapsed && !sidebarHoverOpen;

//   const { notifications } = useNotifications();

//   // Unread request notifications (new requests for approvers, decisions for
//   // employees) light the dot on the requests tab; all other unread
//   // notifications keep lighting the Pipeline Management dot.
//   const requestUnreadCount = notifications.filter(
//     (notification) =>
//       !notification.read &&
//       REQUEST_NOTIFICATION_TYPES.includes(notification.type),
//   ).length;
//   const unreadCount = notifications.filter(
//     (notification) =>
//       !notification.read &&
//       !REQUEST_NOTIFICATION_TYPES.includes(notification.type),
//   ).length;

//   // Approver assignments decide whether the requests tab reads "Employee
//   // Management" (main admin, approvers and record-only users such as
//   // finance) or "Self Management" (everyone else).
//   const [requestApprovers, setRequestApprovers] = useState<RequestApprover[]>(
//     [],
//   );

//   useEffect(() => {
//     if (!searchUserId) {
//       setRequestApprovers([]);
//       return;
//     }

//     return subscribeToApprovers(setRequestApprovers);
//   }, [searchUserId]);

//   const managesEmployees = getApprovalAccess(
//     searchUserId || "",
//     role,
//     requestApprovers,
//   ).canRecord;

//   const navItems = useMemo(
//     () =>
//       sidebarItems.map((item) =>
//         item.path === "/requests"
//           ? {
//               ...item,
//               label: managesEmployees
//                 ? "Employee Management"
//                 : "Self Management",
//             }
//           : item,
//       ),
//     [sidebarItems, managesEmployees],
//   );

//   const handleLogout = async () => {
//     await signOut(auth);
//     localStorage.clear();
//     setLocation("/login");
//   };

//   useEffect(() => {
//     try {
//       const saved = localStorage.getItem("iedge_sidebar_collapsed");
//       if (saved === "1") setSidebarCollapsed(true);
//     } catch {
//       // ignore localStorage errors
//     }
//   }, []);

//   useEffect(() => {
//     try {
//       localStorage.setItem(
//         "iedge_sidebar_collapsed",
//         sidebarCollapsed ? "1" : "0",
//       );
//     } catch {
//       // ignore localStorage errors
//     }
//   }, [sidebarCollapsed]);

//   useEffect(() => {
//     let unsubRole: (() => void) | null = null;

//     const unsubAuth = onAuthStateChanged(auth, async (user) => {
//       if (unsubRole) {
//         unsubRole();
//         unsubRole = null;
//       }

//       setLoading(true);

//       if (!user) {
//         setRole(null);
//         setSidebarItems([]);
//         setUserName("Guest");
//         setSearchUserId(null);
//         setGlobalSearch("");
//         setGlobalSearchOpen(false);
//         setSelectedGlobalSearchResult(null);
//         setChequeSearchActivated(false);
//         setGlobalSearchData(createEmptyGlobalSearchData());
//         setLoading(false);
//         setLocation("/login");
//         return;
//       }

//       try {
//         const userRef = doc(db, "Panels", PANEL_ID, "users", user.uid);
//         const userSnap = await getDoc(userRef);

//         if (!userSnap.exists()) {
//           setRole(null);
//           setSidebarItems([]);
//           setUserName(user.displayName || "User");
//           setSearchUserId(null);
//           setLoading(false);
//           return;
//         }

//         const userData = userSnap.data();

//         const userRole = normalizeRole(userData.role);

//         setRole(userRole);
//         setUserName(userData.displayName || user.displayName || "User");
//         setSearchUserId(user.uid);

//         if (!userRole) {
//           setSidebarItems([]);
//           setLoading(false);
//           return;
//         }

//         // ✅ Always read saved Firestore sidebar config first
//         const roleRef = doc(db, "Panels", PANEL_ID, "sidebarConfig", userRole);

//         unsubRole = onSnapshot(
//           roleRef,
//           (snap) => {
//             const savedItems = snap.exists()
//               ? ((snap.data().items || []) as SidebarItem[])
//               : [];

//             let finalItems: SidebarItem[] = [];

//             if (savedItems.length > 0) {
//               finalItems = savedItems;
//             } else if (userRole === "main_admin") {
//               finalItems = AVAILABLE_TABS;
//             } else {
//               finalItems = [];
//             }

//             // ✅ Force Contacts Directory dropdown for admin/main_admin
//             if (userRole === "admin" || userRole === "main_admin") {
//               finalItems = ensureContactsDropdown(finalItems);
//               finalItems = ensureFinanceDropdown(finalItems);
//             }

//             if (userRole === "finance") {
//               finalItems = ensureFinanceDropdown(finalItems);
//             }

//             if (userRole === "main_admin") {
//               finalItems = ensureRTDManagementTab(finalItems);
//             }

//             // Reports shows company-wide profit figures, so it's limited to
//             // the same roles that already see financial data (Finance
//             // dropdown / RTD).
//             if (
//               userRole === "admin" ||
//               userRole === "main_admin" ||
//               userRole === "finance"
//             ) {
//               finalItems = ensureReportsTab(finalItems);
//             }

//             finalItems = ensureRequestsTab(finalItems);

//             finalItems = applyRtgsAccess(finalItems, userRole);

//             setSidebarItems(finalItems);
//             setLoading(false);
//           },
//           (error) => {
//             console.error("Sidebar config load error:", error);

//             if (userRole === "main_admin") {
//               setSidebarItems(AVAILABLE_TABS);
//             } else {
//               setSidebarItems([]);
//             }

//             setLoading(false);
//           },
//         );
//       } catch (error) {
//         console.error("Layout auth/sidebar error:", error);
//         setRole(null);
//         setSidebarItems([]);
//         setSearchUserId(null);
//         setLoading(false);
//       }
//     });

//     return () => {
//       unsubAuth();
//       if (unsubRole) unsubRole();
//     };
//   }, [setLocation]);

//   useEffect(() => {
//     if (!searchUserId || !role) {
//       setGlobalSearchData((previous) => ({
//         ...previous,
//         estimate: [],
//         invoice: [],
//         po: [],
//       }));
//       setGlobalSearchLoading(false);
//       return;
//     }

//     const canViewAllSearchRecords = GLOBAL_SEARCH_VIEW_ALL_ROLES.includes(role);

//     setGlobalSearchLoading(true);

//     let initializedSources = 0;

//     const markSourceInitialized = () => {
//       initializedSources += 1;

//       if (initializedSources >= GLOBAL_SEARCH_SOURCES.length) {
//         setGlobalSearchLoading(false);
//       }
//     };

//     const unsubscribers = GLOBAL_SEARCH_SOURCES.map((source) => {
//       const sourceRef = collection(
//         db,
//         "Panels",
//         PANEL_ID,
//         source.collectionName,
//       );

//       const sourceQuery = canViewAllSearchRecords
//         ? query(sourceRef)
//         : query(sourceRef, where("createdBy", "==", searchUserId));

//       let initialized = false;

//       const markOnce = () => {
//         if (initialized) return;
//         initialized = true;
//         markSourceInitialized();
//       };

//       return onSnapshot(
//         sourceQuery,
//         (snapshot) => {
//           const records = snapshot.docs.map((snapshotDoc) => ({
//             id: snapshotDoc.id,
//             ...snapshotDoc.data(),
//           }));

//           setGlobalSearchData((previous) => ({
//             ...previous,
//             [source.key]: records,
//           }));

//           markOnce();
//         },
//         (error) => {
//           console.warn(
//             `Global search could not read ${source.collectionName}:`,
//             error,
//           );

//           setGlobalSearchData((previous) => ({
//             ...previous,
//             [source.key]: [],
//           }));

//           markOnce();
//         },
//       );
//     });

//     return () => {
//       unsubscribers.forEach((unsubscribe) => unsubscribe());
//     };
//   }, [searchUserId, role]);

//   useEffect(() => {
//     const emptyChequeData = (): Pick<GlobalSearchData, ChequeSearchKind> => ({
//       record: [],
//       payment: [],
//       budgetRequest: [],
//       reimbursement: [],
//       statementEntry: [],
//     });

//     if (!searchUserId || !role || !chequeSearchActivated) {
//       setGlobalSearchData((previous) => ({
//         ...previous,
//         ...emptyChequeData(),
//       }));
//       setChequeSearchLoading(false);
//       return;
//     }

//     const canViewAllSearchRecords = GLOBAL_SEARCH_VIEW_ALL_ROLES.includes(role);

//     const sources = CHEQUE_SEARCH_SOURCES.filter(
//       (source) => canViewAllSearchRecords || source.ownerField,
//     );

//     if (sources.length === 0) {
//       setChequeSearchLoading(false);
//       return;
//     }

//     setChequeSearchLoading(true);

//     let initializedSources = 0;

//     const unsubscribers = sources.map((source) => {
//       const sourceRef = collection(
//         db,
//         "Panels",
//         PANEL_ID,
//         source.collectionName,
//       );

//       const sourceQuery =
//         canViewAllSearchRecords || !source.ownerField
//           ? query(sourceRef)
//           : query(sourceRef, where(source.ownerField, "==", searchUserId));

//       let initialized = false;

//       const markOnce = () => {
//         if (initialized) return;
//         initialized = true;
//         initializedSources += 1;

//         if (initializedSources >= sources.length) {
//           setChequeSearchLoading(false);
//         }
//       };

//       return onSnapshot(
//         sourceQuery,
//         (snapshot) => {
//           // Only documents that actually carry a cheque number are kept.
//           const records = snapshot.docs
//             .map((snapshotDoc) => ({
//               id: snapshotDoc.id,
//               ...snapshotDoc.data(),
//             }))
//             .filter((record) => getAllChequeNumbers(record).length > 0);

//           setGlobalSearchData((previous) => ({
//             ...previous,
//             [source.key]: records,
//           }));

//           markOnce();
//         },
//         (error) => {
//           console.warn(
//             `Global cheque search could not read ${source.collectionName}:`,
//             error,
//           );

//           setGlobalSearchData((previous) => ({
//             ...previous,
//             [source.key]: [],
//           }));

//           markOnce();
//         },
//       );
//     });

//     return () => {
//       unsubscribers.forEach((unsubscribe) => unsubscribe());
//     };
//   }, [searchUserId, role, chequeSearchActivated]);

//   const globalSearchResults = useMemo(() => {
//     const searchValue = String(globalSearch || "").trim();

//     if (normalizeGlobalSearchValue(searchValue).length < 2) {
//       return [];
//     }

//     const keywordResults: GlobalSearchResult[] = GLOBAL_SEARCH_SOURCES.flatMap(
//       (source) =>
//         globalSearchData[source.key]
//           .filter((record) => recordMatchesGlobalSearch(record, searchValue))
//           .map((record) => ({
//             kind: source.key,
//             label: source.label,
//             route: source.route,
//             record,
//             primaryNumber: getPrimarySearchNumber(source.key, record),
//           })),
//     );

//     const chequeResults: GlobalSearchResult[] = CHEQUE_SEARCH_SOURCES.flatMap(
//       (source) =>
//         globalSearchData[source.key].flatMap((record) => {
//           const matchedChequeNumber = getMatchingChequeNumber(
//             record,
//             searchValue,
//           );

//           return matchedChequeNumber
//             ? [
//                 {
//                   kind: source.key,
//                   label: source.label,
//                   route: source.route,
//                   record,
//                   primaryNumber: matchedChequeNumber,
//                 },
//               ]
//             : [];
//         }),
//     );

//     const results = [...keywordResults, ...chequeResults];

//     return results
//       .sort((a, b) => {
//         const aScore = getGlobalSearchScore(
//           a.record,
//           a.primaryNumber,
//           searchValue,
//         );
//         const bScore = getGlobalSearchScore(
//           b.record,
//           b.primaryNumber,
//           searchValue,
//         );

//         if (aScore !== bScore) return bScore - aScore;

//         return a.label.localeCompare(b.label);
//       })
//       .slice(0, 50);
//   }, [globalSearch, globalSearchData]);

//   useEffect(() => {
//     // ✅ Auto-open dropdown if current page is inside it
//     const nextOpenDropdowns: Record<string, boolean> = {};

//     sidebarItems.forEach((item) => {
//       const key = `${item.label}-${item.path}`;
//       const hasActiveChild = item.children?.some(
//         (child) => child.path === location,
//       );

//       if (hasActiveChild) {
//         nextOpenDropdowns[key] = true;
//       }
//     });

//     setOpenDropdowns((prev) => ({
//       ...prev,
//       ...nextOpenDropdowns,
//     }));
//   }, [sidebarItems, location]);

//   const getPageTitle = (items: SidebarItem[], currentPath: string): string => {
//     for (const item of items) {
//       if (item.path === currentPath) return item.label;

//       if (item.children?.length) {
//         const childTitle = getPageTitle(item.children, currentPath);
//         if (childTitle !== "Dashboard") return childTitle;
//       }
//     }

//     return "Dashboard";
//   };

//   const pageTitle = getPageTitle(navItems, location);

//   if (loading) {
//     return (
//       <div className="flex h-screen items-center justify-center">
//         <Loader2 className="h-6 w-6 animate-spin" />
//       </div>
//     );
//   }

//   return (
//     <div className="flex h-screen bg-background text-foreground">
//       <aside
//         className={`bg-card border-r border-border shadow-sm flex flex-col transition-all duration-200 ${
//           effectiveCollapsed ? "w-16 px-2 py-4" : "w-64 p-4"
//         }`}
//         onMouseEnter={() => {
//           if (sidebarCollapsed) setSidebarHoverOpen(true);
//         }}
//         onMouseLeave={() => {
//           if (sidebarCollapsed) setSidebarHoverOpen(false);
//         }}
//       >
//         <div
//           className={`flex items-center mb-6 ${
//             effectiveCollapsed ? "justify-center gap-0" : "justify-between"
//           }`}
//         >
//           {effectiveCollapsed ? (
//             <div className="h-9 w-9 rounded-md pl-3 flex items-center font-bold" />
//           ) : (
//             <h2 className="text-sm font-bold pl-2">iEDGE Management</h2>
//           )}

//           <Button
//             variant="ghost"
//             className={`${effectiveCollapsed ? "ml-0" : ""} h-9 w-9 p-0`}
//             aria-label={
//               sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
//             }
//             title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
//             onClick={() => {
//               setSidebarCollapsed((v) => !v);
//               setSidebarHoverOpen(false);
//             }}
//           >
//             {sidebarCollapsed ? (
//               <ChevronRight className="h-4 w-4" />
//             ) : (
//               <ChevronLeft className="h-4 w-4" />
//             )}
//           </Button>
//         </div>

//         <nav className="space-y-2 overflow-y-auto">
//           {navItems.map((item) => {
//             const Icon = getSidebarIcon(item.icon);
//             const hasChildren = !!item.children?.length;
//             const dropdownKey = `${item.label}-${item.path}`;
//             const isDropdownOpen = !!openDropdowns[dropdownKey];

//             const hasActiveChild = item.children?.some(
//               (child) => child.path === location,
//             );

//             const isActive = location === item.path || hasActiveChild;

//             const showDot =
//               (unreadCount > 0 &&
//                 (item.path === "/sales-management" ||
//                   item.children?.some(
//                     (child) => child.path === "/sales-management",
//                   ))) ||
//               (requestUnreadCount > 0 &&
//                 (item.path === "/requests" ||
//                   item.children?.some((child) => child.path === "/requests")));

//             if (hasChildren) {
//               return (
//                 <div key={dropdownKey} className="space-y-1">
//                   <Button
//                     type="button"
//                     variant={isActive ? "default" : "ghost"}
//                     className={`w-full ${
//                       effectiveCollapsed
//                         ? "justify-center px-2"
//                         : "justify-start"
//                     }`}
//                     title={effectiveCollapsed ? item.label : undefined}
//                     aria-label={item.label}
//                     onClick={() => {
//                       if (effectiveCollapsed) {
//                         setSidebarHoverOpen(true);
//                         return;
//                       }

//                       setOpenDropdowns((prev) => ({
//                         ...prev,
//                         [dropdownKey]: !prev[dropdownKey],
//                       }));
//                     }}
//                   >
//                     <div
//                       className={`flex w-full items-center ${
//                         effectiveCollapsed
//                           ? "justify-center"
//                           : "justify-between"
//                       }`}
//                     >
//                       <div className="flex items-center">
//                         <span className="relative inline-flex items-center justify-center">
//                           {Icon ? (
//                             <Icon
//                               className={`h-4 w-4 ${
//                                 effectiveCollapsed ? "" : "mr-2"
//                               }`}
//                             />
//                           ) : (
//                             <span
//                               className={`font-semibold ${
//                                 effectiveCollapsed ? "" : "mr-2"
//                               }`}
//                             >
//                               {item.label?.[0] || "•"}
//                             </span>
//                           )}

//                           {showDot && effectiveCollapsed && (
//                             <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
//                               <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
//                               <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
//                             </span>
//                           )}
//                         </span>

//                         {!effectiveCollapsed && <span>{item.label}</span>}
//                       </div>

//                       {!effectiveCollapsed && (
//                         <div className="flex items-center gap-2">
//                           {showDot && (
//                             <span className="relative flex h-2.5 w-2.5">
//                               <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
//                               <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
//                             </span>
//                           )}

//                           {isDropdownOpen ? (
//                             <ChevronDown className="h-4 w-4" />
//                           ) : (
//                             <ChevronRight className="h-4 w-4" />
//                           )}
//                         </div>
//                       )}
//                     </div>
//                   </Button>

//                   {!effectiveCollapsed && isDropdownOpen && (
//                     <div className="ml-6 space-y-1 border-l pl-3">
//                       {item.children?.map((child) => {
//                         const ChildIcon = getSidebarIcon(child.icon);

//                         const childShowDot =
//                           (unreadCount > 0 &&
//                             child.path === "/sales-management") ||
//                           (requestUnreadCount > 0 &&
//                             child.path === "/requests");

//                         return (
//                           <Link key={child.path} href={child.path}>
//                             <Button
//                               variant={
//                                 location === child.path ? "default" : "ghost"
//                               }
//                               className="w-full justify-start"
//                               aria-label={child.label}
//                             >
//                               <div className="flex w-full items-center justify-between">
//                                 <div className="flex items-center">
//                                   {ChildIcon ? (
//                                     <ChildIcon className="mr-2 h-4 w-4" />
//                                   ) : (
//                                     <span className="mr-2 font-semibold">
//                                       {child.label?.[0] || "•"}
//                                     </span>
//                                   )}

//                                   <span>{child.label}</span>
//                                 </div>

//                                 {childShowDot && (
//                                   <span className="relative flex h-2.5 w-2.5">
//                                     <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
//                                     <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
//                                   </span>
//                                 )}
//                               </div>
//                             </Button>
//                           </Link>
//                         );
//                       })}
//                     </div>
//                   )}
//                 </div>
//               );
//             }

//             return (
//               <Link key={item.path} href={item.path}>
//                 <Button
//                   variant={location === item.path ? "default" : "ghost"}
//                   className={`w-full ${
//                     effectiveCollapsed ? "justify-center px-2" : "justify-start"
//                   }`}
//                   title={effectiveCollapsed ? item.label : undefined}
//                   aria-label={item.label}
//                 >
//                   <div
//                     className={`flex w-full items-center ${
//                       effectiveCollapsed ? "justify-center" : "justify-between"
//                     }`}
//                   >
//                     <div className="flex items-center">
//                       <span className="relative inline-flex items-center justify-center">
//                         {Icon ? (
//                           <Icon
//                             className={`h-4 w-4 ${
//                               effectiveCollapsed ? "" : "mr-2"
//                             }`}
//                           />
//                         ) : (
//                           <span
//                             className={`font-semibold ${
//                               effectiveCollapsed ? "" : "mr-2"
//                             }`}
//                           >
//                             {item.label?.[0] || "•"}
//                           </span>
//                         )}

//                         {showDot && effectiveCollapsed && (
//                           <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
//                             <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
//                             <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
//                           </span>
//                         )}
//                       </span>

//                       {!effectiveCollapsed && <span>{item.label}</span>}
//                     </div>

//                     {showDot && !effectiveCollapsed && (
//                       <span className="relative flex h-2.5 w-2.5">
//                         <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
//                         <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
//                       </span>
//                     )}
//                   </div>
//                 </Button>
//               </Link>
//             );
//           })}
//         </nav>
//       </aside>

//       <main className="flex-1 flex flex-col">
//         <header className="flex flex-col gap-3 border-b border-border bg-card px-6 py-4 lg:flex-row lg:items-center">
//           <div className="shrink-0 lg:w-52">
//             <h1 className="text-lg font-semibold">{pageTitle}</h1>
//           </div>

//           <div
//             className="relative w-full max-w-2xl lg:mx-auto"
//             onBlur={(event) => {
//               if (!event.currentTarget.contains(event.relatedTarget as Node)) {
//                 setGlobalSearchOpen(false);
//               }
//             }}
//           >
//             <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

//             <input
//               type="text"
//               value={globalSearch}
//               onFocus={() => {
//                 setGlobalSearchOpen(true);
//                 setChequeSearchActivated(true);
//               }}
//               onChange={(event) => {
//                 setGlobalSearch(event.target.value);
//                 setGlobalSearchOpen(true);
//                 setChequeSearchActivated(true);
//               }}
//               placeholder="Search any keyword in Estimate, PO, or Invoice records, or a cheque number"
//               className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-10 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
//               aria-label="Search all Estimate, PO, and Invoice record data, or any cheque number"
//             />

//             {globalSearch && (
//               <button
//                 type="button"
//                 className="absolute right-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground"
//                 onClick={() => {
//                   setGlobalSearch("");
//                   setGlobalSearchOpen(false);
//                 }}
//                 aria-label="Clear global search"
//               >
//                 <X className="h-4 w-4" />
//               </button>
//             )}

//             {globalSearchOpen && globalSearch.trim().length >= 2 && (
//               <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[100] max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-2xl">
//                 <div className="flex items-center justify-between px-3 py-2">
//                   <div>
//                     <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
//                       Global Search
//                     </p>
//                     <p className="mt-0.5 text-sm font-medium text-foreground">
//                       {globalSearchLoading || chequeSearchLoading
//                         ? "Loading records..."
//                         : `${globalSearchResults.length} result${
//                             globalSearchResults.length === 1 ? "" : "s"
//                           }`}
//                     </p>
//                   </div>

//                   <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground">
//                     All Record Fields
//                   </span>
//                 </div>

//                 {!globalSearchLoading &&
//                 !chequeSearchLoading &&
//                 globalSearchResults.length === 0 ? (
//                   <div className="rounded-xl bg-secondary/50 px-4 py-8 text-center">
//                     <Search className="mx-auto h-5 w-5 text-muted-foreground" />
//                     <p className="mt-2 text-sm font-semibold text-foreground">
//                       No matching record found
//                     </p>
//                     <p className="mt-1 text-xs text-muted-foreground">
//                       Search any saved value such as number, client, vendor,
//                       subject, company, status, description, item, amount,
//                       reference, or cheque number.
//                     </p>
//                   </div>
//                 ) : (
//                   <div className="space-y-2">
//                     {globalSearchResults.map((result) => {
//                       const details = getSearchResultDetails(result.record);

//                       return (
//                         <div
//                           key={`${result.kind}-${result.record.id}`}
//                           className="rounded-xl border border-border bg-background p-3 transition hover:border-primary/30 hover:shadow-sm"
//                         >
//                           <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
//                             <div className="min-w-0">
//                               <div className="flex flex-wrap items-center gap-2">
//                                 <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
//                                   {result.label}
//                                 </span>

//                                 <span className="break-all text-sm font-bold text-foreground">
//                                   {result.primaryNumber}
//                                 </span>

//                                 {details.status && (
//                                   <span className="rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] font-semibold capitalize text-secondary-foreground">
//                                     {details.status.replace(/_/g, " ")}
//                                   </span>
//                                 )}
//                               </div>

//                               <div className="mt-3 grid grid-cols-1 gap-x-5 gap-y-2 text-xs sm:grid-cols-2">
//                                 {details.estimateNo && (
//                                   <div>
//                                     <span className="text-muted-foreground">
//                                       Estimate:
//                                     </span>{" "}
//                                     <span className="font-semibold text-foreground">
//                                       {details.estimateNo}
//                                     </span>
//                                   </div>
//                                 )}

//                                 {details.poNo && (
//                                   <div>
//                                     <span className="text-muted-foreground">
//                                       PO:
//                                     </span>{" "}
//                                     <span className="font-semibold text-foreground">
//                                       {details.poNo}
//                                     </span>
//                                   </div>
//                                 )}

//                                 {details.invoiceNo && (
//                                   <div>
//                                     <span className="text-muted-foreground">
//                                       Invoice:
//                                     </span>{" "}
//                                     <span className="font-semibold text-foreground">
//                                       {details.invoiceNo}
//                                     </span>
//                                   </div>
//                                 )}

//                                 {details.chequeNumbers && (
//                                   <div className="min-w-0">
//                                     <span className="text-muted-foreground">
//                                       Cheque No:
//                                     </span>{" "}
//                                     <span className="break-all font-semibold text-foreground">
//                                       {details.chequeNumbers}
//                                     </span>
//                                   </div>
//                                 )}

//                                 {details.clientOrVendor && (
//                                   <div className="min-w-0">
//                                     <span className="text-muted-foreground">
//                                       Client / Vendor:
//                                     </span>{" "}
//                                     <span className="font-semibold text-foreground">
//                                       {details.clientOrVendor}
//                                     </span>
//                                   </div>
//                                 )}

//                                 {details.company && (
//                                   <div>
//                                     <span className="text-muted-foreground">
//                                       Company:
//                                     </span>{" "}
//                                     <span className="font-semibold text-foreground">
//                                       {details.company}
//                                     </span>
//                                   </div>
//                                 )}

//                                 <div>
//                                   <span className="text-muted-foreground">
//                                     Date:
//                                   </span>{" "}
//                                   <span className="font-semibold text-foreground">
//                                     {details.date}
//                                   </span>
//                                 </div>

//                                 <div>
//                                   <span className="text-muted-foreground">
//                                     Amount:
//                                   </span>{" "}
//                                   <span className="font-semibold text-foreground">
//                                     {details.amount}
//                                   </span>
//                                 </div>

//                                 {details.createdBy && (
//                                   <div>
//                                     <span className="text-muted-foreground">
//                                       Created By:
//                                     </span>{" "}
//                                     <span className="font-semibold text-foreground">
//                                       {details.createdBy}
//                                     </span>
//                                   </div>
//                                 )}
//                               </div>

//                               {details.subject && (
//                                 <div className="mt-2 text-xs">
//                                   <span className="text-muted-foreground">
//                                     Subject / Project:
//                                   </span>{" "}
//                                   <span className="font-medium text-foreground">
//                                     {details.subject}
//                                   </span>
//                                 </div>
//                               )}
//                             </div>

//                             <div className="flex shrink-0 flex-wrap gap-2">
//                               <Button
//                                 type="button"
//                                 size="sm"
//                                 className="rounded-lg"
//                                 onClick={() => {
//                                   setSelectedGlobalSearchResult(result);
//                                   setGlobalSearchOpen(false);
//                                 }}
//                               >
//                                 Full Preview
//                               </Button>

//                               <Button
//                                 type="button"
//                                 variant="outline"
//                                 size="sm"
//                                 className="gap-1.5 rounded-lg"
//                                 onClick={() => {
//                                   setGlobalSearchOpen(false);
//                                   setLocation(
//                                     getGlobalSearchModuleRoute(result),
//                                   );
//                                 }}
//                               >
//                                 Open Module
//                                 <ExternalLink className="h-3.5 w-3.5" />
//                               </Button>
//                             </div>
//                           </div>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>

//           <div className="flex shrink-0 flex-wrap items-center gap-4 lg:justify-end">
//             {searchUserId && (
//               <AttendanceCheckButton
//                 userId={searchUserId}
//                 userName={userName}
//                 role={role || ""}
//               />
//             )}
//             <ThemeToggle />
//             <NotificationBell />

//             <div className="flex items-center gap-2">
//               <div className="flex items-center space-x-2 rounded-full bg-secondary px-3 py-3">
//                 <User className="h-4 w-4 text-muted-foreground" />

//                 <span className="text-sm font-medium text-secondary-foreground">
//                   {userName}
//                 </span>

//                 <span className="rounded-full bg-primary px-2 py-1 text-xs capitalize text-primary-foreground">
//                   {role || "no-role"}
//                 </span>
//               </div>

//               <Button
//                 variant="outline"
//                 className="gap-2"
//                 onClick={handleLogout}
//               >
//                 Logout
//                 <LogOut className="h-5 w-5" />
//               </Button>
//             </div>
//           </div>
//         </header>

//         <div className="flex-1 overflow-y-auto p-6">{children}</div>
//       </main>

//       {selectedGlobalSearchResult &&
//         (() => {
//           const selectedDetails = getSearchResultDetails(
//             selectedGlobalSearchResult.record,
//           );

//           return (
//             <div className="fixed inset-0 z-[200] bg-slate-950/70 p-0 backdrop-blur-sm sm:p-4">
//               <div className="mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden bg-slate-50 shadow-2xl sm:rounded-3xl sm:border sm:border-white/20">
//                 <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
//                   <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
//                     <div className="min-w-0">
//                       <div className="flex flex-wrap items-center gap-2">
//                         <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
//                           {selectedGlobalSearchResult.label}
//                         </span>

//                         {selectedDetails.status && (
//                           <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-700">
//                             {selectedDetails.status.replace(/_/g, " ")}
//                           </span>
//                         )}
//                       </div>

//                       <h2 className="mt-3 break-all text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">
//                         {selectedGlobalSearchResult.primaryNumber}
//                       </h2>

//                       <p className="mt-1 text-sm text-slate-500">
//                         Complete Firestore record preview for the selected{" "}
//                         {selectedGlobalSearchResult.label.toLowerCase()}.
//                       </p>
//                     </div>

//                     <div className="flex flex-wrap items-center gap-2">
//                       <Button
//                         type="button"
//                         variant="outline"
//                         className="rounded-xl"
//                         onClick={() => {
//                           setSelectedGlobalSearchResult(null);
//                           setLocation(
//                             getGlobalSearchModuleRoute(
//                               selectedGlobalSearchResult,
//                             ),
//                           );
//                         }}
//                       >
//                         Open Module
//                         <ExternalLink className="ml-2 h-4 w-4" />
//                       </Button>

//                       <Button
//                         type="button"
//                         variant="outline"
//                         className="rounded-xl"
//                         onClick={() => setSelectedGlobalSearchResult(null)}
//                       >
//                         <X className="mr-2 h-4 w-4" />
//                         Close
//                       </Button>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
//                   <div className="space-y-6">
//                     <section>
//                       <div className="mb-3">
//                         <h3 className="text-base font-black text-slate-950">
//                           Record Summary
//                         </h3>
//                         <p className="text-xs text-slate-500">
//                           Important identifying and financial information.
//                         </p>
//                       </div>

//                       <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
//                         <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
//                           <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
//                             Record Type
//                           </p>
//                           <p className="mt-2 font-bold text-slate-950">
//                             {selectedGlobalSearchResult.label}
//                           </p>
//                         </div>

//                         <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
//                           <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
//                             Primary Number
//                           </p>
//                           <p className="mt-2 break-all font-bold text-slate-950">
//                             {selectedGlobalSearchResult.primaryNumber}
//                           </p>
//                         </div>

//                         <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
//                           <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
//                             Date
//                           </p>
//                           <p className="mt-2 font-bold text-slate-950">
//                             {selectedDetails.date}
//                           </p>
//                         </div>

//                         <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
//                           <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
//                             Amount
//                           </p>
//                           <p className="mt-2 font-bold text-slate-950">
//                             {selectedDetails.amount}
//                           </p>
//                         </div>
//                       </div>
//                     </section>

//                     <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
//                       <div className="mb-4">
//                         <h3 className="text-base font-black text-slate-950">
//                           Linked Numbers & Main Details
//                         </h3>
//                         <p className="text-xs text-slate-500">
//                           Estimate, purchase order, invoice, client/vendor,
//                           company, subject, and creator information where
//                           available.
//                         </p>
//                       </div>

//                       <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
//                         <div className="rounded-xl bg-slate-50 p-4">
//                           <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
//                             Estimate Number
//                           </p>
//                           <p className="mt-1 break-all font-semibold text-slate-900">
//                             {selectedDetails.estimateNo || "-"}
//                           </p>
//                         </div>

//                         <div className="rounded-xl bg-slate-50 p-4">
//                           <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
//                             PO Number
//                           </p>
//                           <p className="mt-1 break-all font-semibold text-slate-900">
//                             {selectedDetails.poNo || "-"}
//                           </p>
//                         </div>

//                         <div className="rounded-xl bg-slate-50 p-4">
//                           <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
//                             Invoice Number
//                           </p>
//                           <p className="mt-1 break-all font-semibold text-slate-900">
//                             {selectedDetails.invoiceNo || "-"}
//                           </p>
//                         </div>

//                         <div className="rounded-xl bg-slate-50 p-4">
//                           <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
//                             Client / Vendor
//                           </p>
//                           <p className="mt-1 whitespace-pre-wrap break-words font-semibold text-slate-900">
//                             {selectedDetails.clientOrVendor || "-"}
//                           </p>
//                         </div>

//                         <div className="rounded-xl bg-slate-50 p-4">
//                           <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
//                             Company
//                           </p>
//                           <p className="mt-1 whitespace-pre-wrap break-words font-semibold text-slate-900">
//                             {selectedDetails.company || "-"}
//                           </p>
//                         </div>

//                         <div className="rounded-xl bg-slate-50 p-4">
//                           <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
//                             Created By
//                           </p>
//                           <p className="mt-1 whitespace-pre-wrap break-words font-semibold text-slate-900">
//                             {selectedDetails.createdBy || "-"}
//                           </p>
//                         </div>

//                         <div className="rounded-xl bg-slate-50 p-4 md:col-span-2 xl:col-span-3">
//                           <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
//                             Subject / Project / Description
//                           </p>
//                           <p className="mt-1 whitespace-pre-wrap break-words font-semibold text-slate-900">
//                             {selectedDetails.subject || "-"}
//                           </p>
//                         </div>
//                       </div>
//                     </section>

//                     <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
//                       <div className="mb-4">
//                         <h3 className="text-base font-black text-slate-950">
//                           All Available Record Information
//                         </h3>
//                         <p className="text-xs leading-5 text-slate-500">
//                           Every field currently stored on this Firestore
//                           document is shown below, including nested objects,
//                           line items, payment data, taxes, notes, references,
//                           and uploaded-file links when present.
//                         </p>
//                       </div>

//                       <PreviewValue
//                         value={{
//                           documentId: selectedGlobalSearchResult.record.id,
//                           ...selectedGlobalSearchResult.record,
//                         }}
//                       />
//                     </section>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           );
//         })()}
//     </div>
//   );
// }

"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  LogOut,
  User,
  LayoutDashboard,
  LineChart,
  BarChart3,
  UserRound,
  Archive,
  Globe,
  Receipt,
  Users,
  PieChart,
  Settings,
  Hotel,
  FileText,
  Scroll,
  ScrollText,
  BedDouble,
  PlaneTakeoff,
  CreditCard,
  HandCoins,
  WalletCards,
  BookUser,
  CalendarCheck,
  ClipboardList,
  ReceiptText,
  Search,
  X,
  ExternalLink,
  TrendingUp,
  Banknote,
  PenLine,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { canAccessRtgs } from "@/components/RTGS/rtgsData";
import {
  canManageEmployeeProfiles,
  EMPLOYEE_PROFILE_PATH,
} from "@/lib/employeeProfileModel";
import { NotificationBell } from "@/components/NotificationBell";
import { AttendanceCheckButton } from "@/components/EmployeeRequests/AttendanceCheckButton";
import { useNotifications } from "@/hooks/useNotifications";
import { ThemeToggle } from "@/components/theme-toggle";
import { getAllChequeNumbers } from "@/lib/chequeNumbers";
import {
  REQUEST_NOTIFICATION_TYPES,
  getApprovalAccess,
  subscribeToApprovers,
  type RequestApprover,
} from "@/lib/employeeRequests";

const PANEL_ID = "IEDGE-SYSTEM";

interface SidebarItem {
  path: string;
  label: string;
  icon?: string;
  children?: SidebarItem[];
}

type ChequeSearchKind =
  | "record"
  | "payment"
  | "budgetRequest"
  | "reimbursement"
  | "statementEntry";

type GlobalSearchKind = "estimate" | "invoice" | "po" | ChequeSearchKind;

type GlobalSearchRecord = {
  id: string;
  [key: string]: any;
};

type GlobalSearchData = Record<GlobalSearchKind, GlobalSearchRecord[]>;

type GlobalSearchResult = {
  kind: GlobalSearchKind;
  label: string;
  route: string;
  record: GlobalSearchRecord;
  primaryNumber: string;
};

const GLOBAL_SEARCH_SOURCES: Array<{
  key: GlobalSearchKind;
  collectionName: string;
  label: string;
  route: string;
}> = [
  {
    key: "estimate",
    collectionName: "estimates",
    label: "Estimate",
    route: "/estimate",
  },
  {
    key: "invoice",
    collectionName: "estimateInvoices",
    label: "Invoice",
    route: "/invoice-estimate",
  },
  {
    key: "po",
    collectionName: "purchaseOrders",
    label: "Purchase Order",
    route: "/purchase-orders",
  },
];

// Collections that hold cheques. Unlike the sources above, these are matched
// on cheque numbers only, so a general keyword search is not flooded with
// payments and ledger entries. ownerField is the field holding the creator's
// uid, used to limit non-admin users to their own records; null means the
// collection has no owner field and is only searchable by admin/finance roles.
const CHEQUE_SEARCH_SOURCES: Array<{
  key: ChequeSearchKind;
  collectionName: string;
  label: string;
  route: string;
  ownerField: string | null;
}> = [
  {
    key: "record",
    collectionName: "Record",
    label: "Cheque Record",
    route: "/records",
    ownerField: "createdBy",
  },
  {
    key: "payment",
    collectionName: "payments",
    label: "Payment",
    route: "/account-statement",
    ownerField: null,
  },
  {
    key: "budgetRequest",
    collectionName: "invoiceRequests",
    label: "Budget Request",
    route: "/budget-requests",
    ownerField: "createdBy",
  },
  {
    key: "reimbursement",
    collectionName: "claimReimbursements",
    label: "Reimbursement",
    route: "/reimbursement",
    ownerField: "createdBy",
  },
  {
    key: "statementEntry",
    collectionName: "accountStatementManualEntries",
    label: "Statement Entry",
    route: "/account-statement",
    ownerField: "createdById",
  },
];

const GLOBAL_SEARCH_VIEW_ALL_ROLES = [
  "main_admin",
  "admin",
  "operational_admin",
  "financial_admin",
  "finance",
];

const createEmptyGlobalSearchData = (): GlobalSearchData => ({
  estimate: [],
  invoice: [],
  po: [],
  record: [],
  payment: [],
  budgetRequest: [],
  reimbursement: [],
  statementEntry: [],
});

// The stored cheque number that best matches the search, or "" if none does.
function getMatchingChequeNumber(
  record: GlobalSearchRecord,
  searchTerm: string,
): string {
  const compactSearch = normalizeGlobalSearchValue(searchTerm);
  if (!compactSearch) return "";

  const chequeNumbers = getAllChequeNumbers(record);

  return (
    chequeNumbers.find(
      (chequeNumber) =>
        normalizeGlobalSearchValue(chequeNumber) === compactSearch,
    ) ||
    chequeNumbers.find((chequeNumber) =>
      normalizeGlobalSearchValue(chequeNumber).includes(compactSearch),
    ) ||
    ""
  );
}

function getGlobalSearchModuleRoute(result: GlobalSearchResult): string {
  if (result.kind === "estimate") {
    const estimateNo = getEstimateNumber(result.record) || result.primaryNumber;
    const params = new URLSearchParams();
    params.set("tab", "list");

    if (estimateNo) {
      params.set("estimateNo", estimateNo);
    }

    return `/estimate?${params.toString()}`;
  }

  return result.route;
}

function normalizeGlobalSearchValue(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function normalizeGlobalSearchText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstNonEmpty(...values: unknown[]): string {
  for (const value of values) {
    const stringValue = String(value ?? "").trim();
    if (stringValue) return stringValue;
  }

  return "";
}

function getEstimateNumber(record: any): string {
  return firstNonEmpty(
    record?.estimateNo,
    record?.estimateNumber,
    record?.sourceEstimateNo,
    record?.sourceEstimateNumber,
    record?.linkedEstimateNo,
  );
}

function getInvoiceNumber(record: any): string {
  return firstNonEmpty(
    record?.invoiceNo,
    record?.invoiceNumber,
    record?.sourceInvoiceNo,
    record?.sourceInvoiceNumber,
  );
}

function getPONumber(record: any): string {
  return firstNonEmpty(
    record?.poNumber,
    record?.poNo,
    record?.purchaseOrderNo,
    record?.purchaseOrderNumber,
    record?.sourcePoNo,
    record?.sourcePONumber,
  );
}

function getPrimarySearchNumber(
  kind: GlobalSearchKind,
  record: GlobalSearchRecord,
): string {
  if (kind === "estimate") {
    return getEstimateNumber(record) || record.id;
  }

  if (kind === "invoice") {
    return getInvoiceNumber(record) || record.id;
  }

  return getPONumber(record) || record.id;
}

function getAllSearchableValues(record: GlobalSearchRecord): string[] {
  const values: string[] = [String(record?.id || "")];
  const visited = new WeakSet<object>();

  const walk = (value: any, depth = 0) => {
    if (value === null || value === undefined || depth > 10) return;

    if (value?.toDate && typeof value.toDate === "function") {
      try {
        const date = value.toDate();
        values.push(
          date.toISOString(),
          date.toLocaleString("en-GB"),
          String(date.getTime()),
        );
      } catch {
        // Ignore invalid Firestore timestamps.
      }
      return;
    }

    if (value instanceof Date) {
      values.push(
        value.toISOString(),
        value.toLocaleString("en-GB"),
        String(value.getTime()),
      );
      return;
    }

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      values.push(String(value));
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => walk(item, depth + 1));
      return;
    }

    if (typeof value === "object") {
      if (visited.has(value)) return;
      visited.add(value);

      Object.entries(value).forEach(([key, nestedValue]) => {
        // Field names are searchable too, e.g. "vendor", "status", "description".
        values.push(key);
        walk(nestedValue, depth + 1);
      });
    }
  };

  walk(record);

  return Array.from(
    new Set(values.map((value) => String(value || "").trim()).filter(Boolean)),
  );
}

function recordMatchesGlobalSearch(
  record: GlobalSearchRecord,
  searchTerm: string,
): boolean {
  const rawSearch = String(searchTerm || "").trim();
  if (!rawSearch) return false;

  const compactSearch = normalizeGlobalSearchValue(rawSearch);
  const searchTokens = normalizeGlobalSearchText(rawSearch)
    .split(" ")
    .filter(Boolean);

  if (!compactSearch && searchTokens.length === 0) return false;

  const values = getAllSearchableValues(record);

  // First allow a normal contains match against every individual stored value.
  if (
    compactSearch &&
    values.some((value) =>
      normalizeGlobalSearchValue(value).includes(compactSearch),
    )
  ) {
    return true;
  }

  // Multi-keyword search can match words stored in different fields of the same record.
  const combinedText = normalizeGlobalSearchText(values.join(" "));

  return (
    searchTokens.length > 0 &&
    searchTokens.every((token) => combinedText.includes(token))
  );
}

function getGlobalSearchScore(
  record: GlobalSearchRecord,
  primaryNumber: string,
  searchTerm: string,
): number {
  const compactSearch = normalizeGlobalSearchValue(searchTerm);
  if (!compactSearch) return 0;

  const primary = normalizeGlobalSearchValue(primaryNumber);
  if (primary === compactSearch) return 1000;
  if (primary.startsWith(compactSearch)) return 800;
  if (primary.includes(compactSearch)) return 700;

  const values = getAllSearchableValues(record).map(normalizeGlobalSearchValue);

  if (values.some((value) => value === compactSearch)) return 600;
  if (values.some((value) => value.startsWith(compactSearch))) return 500;
  if (values.some((value) => value.includes(compactSearch))) return 400;

  return 100;
}

function formatGlobalSearchAmount(value: unknown): string {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) return "-";

  return `Rs. ${amount.toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatGlobalSearchDate(value: any): string {
  if (!value) return "-";

  try {
    const date =
      value?.toDate && typeof value.toDate === "function"
        ? value.toDate()
        : value instanceof Date
          ? value
          : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(value);
  }
}

function getSearchResultDetails(record: GlobalSearchRecord) {
  return {
    estimateNo: getEstimateNumber(record),
    invoiceNo: getInvoiceNumber(record),
    poNo: getPONumber(record),
    clientOrVendor: firstNonEmpty(
      record?.client,
      record?.clientName,
      record?.vendor,
      record?.vendorName,
      record?.supplier,
      record?.supplierName,
    ),
    subject: firstNonEmpty(
      record?.subject,
      record?.invoiceSubject,
      record?.title,
      record?.project,
      record?.description,
      record?.statementTitle,
    ),
    chequeNumbers: getAllChequeNumbers(record).join(", "),
    company: firstNonEmpty(record?.company, record?.companyName),
    status: firstNonEmpty(record?.status),
    date: formatGlobalSearchDate(
      record?.invoiceDate ??
        record?.poDate ??
        record?.date ??
        record?.createdAt ??
        record?.submittedAt ??
        record?.selectedDate ??
        record?.chequeDate,
    ),
    amount: formatGlobalSearchAmount(
      record?.total ??
        record?.totalAmount ??
        record?.grandTotal ??
        record?.netTotal ??
        record?.chequeAmount ??
        record?.claimAmount ??
        record?.amount ??
        0,
    ),
    createdBy: firstNonEmpty(
      record?.createdByName,
      record?.creatorName,
      record?.submittedByName,
      record?.requestedByName,
      record?.preparedByName,
    ),
  };
}

function humanizePreviewKey(key: string): string {
  return String(key || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function isPreviewTimestamp(value: any): boolean {
  return !!value && typeof value?.toDate === "function";
}

function isPreviewUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;

  return /^https?:\/\//i.test(value.trim());
}

function getPreviewPrimitiveText(value: any): string {
  if (value === null || value === undefined || value === "") return "-";

  if (isPreviewTimestamp(value)) {
    try {
      return value.toDate().toLocaleString("en-GB");
    } catch {
      return "-";
    }
  }

  if (value instanceof Date) {
    return value.toLocaleString("en-GB");
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value.toLocaleString("en-PK", { maximumFractionDigits: 2 })
      : String(value);
  }

  return String(value);
}

function PreviewPrimitive({ value }: { value: any }) {
  const text = getPreviewPrimitiveText(value);

  if (isPreviewUrl(value)) {
    return (
      <a
        href={String(value)}
        target="_blank"
        rel="noreferrer"
        className="break-all font-medium text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-800"
      >
        {text}
      </a>
    );
  }

  return (
    <span className="whitespace-pre-wrap break-words text-sm font-medium text-slate-800">
      {text}
    </span>
  );
}

function PreviewValue({ value, depth = 0 }: { value: any; depth?: number }) {
  if (
    value === null ||
    value === undefined ||
    typeof value !== "object" ||
    value instanceof Date ||
    isPreviewTimestamp(value)
  ) {
    return <PreviewPrimitive value={value} />;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-sm text-slate-400">No items</span>;
    }

    const allPrimitive = value.every(
      (item) =>
        item === null ||
        item === undefined ||
        typeof item !== "object" ||
        item instanceof Date ||
        isPreviewTimestamp(item),
    );

    if (allPrimitive) {
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((item, index) => (
            <span
              key={index}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
            >
              {getPreviewPrimitiveText(item)}
            </span>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {value.map((item, index) => (
          <div
            key={index}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                Item {index + 1}
              </span>
            </div>
            <PreviewValue value={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  const entries = Object.entries(value);

  if (entries.length === 0) {
    return <span className="text-sm text-slate-400">No details</span>;
  }

  return (
    <div
      className={
        depth === 0
          ? "grid grid-cols-1 gap-3 md:grid-cols-2"
          : "grid grid-cols-1 gap-3"
      }
    >
      {entries.map(([key, nestedValue]) => {
        const isComplex =
          nestedValue !== null &&
          nestedValue !== undefined &&
          typeof nestedValue === "object" &&
          !(nestedValue instanceof Date) &&
          !isPreviewTimestamp(nestedValue);

        return (
          <div
            key={key}
            className={`rounded-xl border border-slate-200 bg-slate-50 p-4 ${
              isComplex && depth === 0 ? "md:col-span-2" : ""
            }`}
          >
            <div className="mb-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
              {humanizePreviewKey(key)}
            </div>
            <PreviewValue value={nestedValue} depth={depth + 1} />
          </div>
        );
      })}
    </div>
  );
}

// ✅ Lucide icon registry
const LUCIDE_ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  LineChart,
  BarChart3,
  UserRound,
  User,
  Archive,
  Globe,
  Receipt,
  Users,
  PieChart,
  Settings,
  Hotel,
  FileText,
  Scroll,
  ScrollText,
  BedDouble,
  PlaneTakeoff,
  CreditCard,
  HandCoins,
  WalletCards,
  BookUser,
  CalendarCheck,
  ClipboardList,
  ReceiptText,
  TrendingUp,
  Banknote,
  PenLine,
};

// ✅ Backward compatibility for old FontAwesome names
const FA_TO_LUCIDE: Record<string, LucideIcon> = {
  "fas fa-tachometer-alt": LayoutDashboard,
  "fas fa-chart-line": LineChart,
  "fas fa-chart-bar": BarChart3,
  "fas fa-user": User,
  "fas fa-archive": Archive,
  "fas fa-globe": Globe,
  "fas fa-receipt": Receipt,
  "fas fa-users": Users,
  "fas fa-chart-pie": PieChart,
  "fas fa-hotel": Hotel,
};

const getSidebarIcon = (icon?: string): LucideIcon | null => {
  if (!icon) return null;
  return LUCIDE_ICONS[icon] ?? FA_TO_LUCIDE[icon] ?? null;
};

const CONTACTS_DROPDOWN: SidebarItem = {
  path: "#",
  label: "Contacts Directory",
  icon: "BookUser",
  children: [
    { path: "/clients", label: "Clients", icon: "Users" },
    { path: "/suppliers", label: "Suppliers", icon: "BookUser" },
    { path: "/contact-persons", label: "Contact Persons", icon: "User" },
  ],
};

const FINANCE_DROPDOWN: SidebarItem = {
  path: "#",
  label: "Finance",
  icon: "WalletCards",
  children: [
    { path: "/account-statement", label: "Account Statement", icon: "Receipt" },
    { path: "/budget-requests", label: "Budget Requests", icon: "FileText" },
    { path: "/expenses", label: "Expenses", icon: "Receipt" },
    { path: "/accounts", label: "Accounts", icon: "WalletCards" },
    { path: "/reimbursement", label: "Reimbursement", icon: "HandCoins" },
    { path: "/purchase-orders", label: "Purchase Orders", icon: "ReceiptText" },
    {
      path: "/claim-reimbursement",
      label: "Claim Reimbursement",
      icon: "ReceiptText",
    },
    { path: "/records", label: "Records", icon: "Archive" },
    { path: "/vendor-summery", label: "Vendor Summary", icon: "Receipt" },
  ],
};

const TRAVEL_DROPDOWN: SidebarItem = {
  path: "#",
  label: "Travel",
  icon: "PlaneTakeoff",
  children: [
    { path: "/travel/ticketing", label: "Ticketing", icon: "PlaneTakeoff" },
    { path: "/usertravel", label: "Book Hotel", icon: "BedDouble" },
    { path: "/booking", label: "Bookings", icon: "Hotel" },
    { path: "/travel/hotel", label: "+ Add Hotels", icon: "Hotel" },
  ],
};

const RTGS_DROPDOWN: SidebarItem = {
  path: "#",
  label: "RTGS",
  icon: "Banknote",
  children: [
    { path: "/RTGS/form", label: "RTGS Form", icon: "FileText" },
    { path: "/RTGS/list", label: "RTGS List", icon: "Archive" },
    { path: "/RTGS/vendors", label: "RTGS Vendors", icon: "BookUser" },
    { path: "/RTGS/authorizers", label: "Authorizer", icon: "PenLine" },
  ],
};

// ✅ Main admin fallback tabs
const AVAILABLE_TABS: SidebarItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { path: "/reports", label: "Reports", icon: "TrendingUp" },
  { path: "/sales-dashboard", label: "Sales Dashboard", icon: "LineChart" },
  { path: "/project", label: "Projects", icon: "BarChart3" },
  { path: "/task-calendar", label: "Tasks", icon: "CalendarCheck" },
  { path: "/estimate", label: "Estimate", icon: "Scroll" },
  { path: "/rtd-management", label: "RTD Management", icon: "FileText" },
  { path: "/invoice-estimate", label: "Invoice ", icon: "ScrollText" },
  { path: "/sales-management", label: "Pipeline Management", icon: "PieChart" },
  { path: "/users", label: "User Management", icon: "UserRound" },
  FINANCE_DROPDOWN,
  TRAVEL_DROPDOWN,
  CONTACTS_DROPDOWN,
  // { path: "/records", label: "Records", icon: "Archive" },

  // { path: "/budget-requests", label: "Budget Request", icon: "HandCoins" },
  // { path: "/expenses", label: "Expenses", icon: "Receipt" },
  // { path: "/accounts", label: "Account ledger", icon: "WalletCards" },
  // { path: "/reimbursement", label: "Reimbursement", icon: "Receipt" },
  // {
  //   path: "/estimateInternational",
  //   label: "International Estimate",
  //   icon: "Globe",
  // },

  { path: "/settings", label: "Settings", icon: "Settings" },

  // { path: "/accounts", label: "Account ledger", icon: "WalletCards" },
  // { path: "/reimbursement", label: "Reimbursement", icon: "Receipt" },
];

function normalizeRole(role: unknown): string {
  return String(role || "")
    .trim()
    .toLowerCase();
}

// ✅ Ensures admin/main_admin always get Contacts Directory dropdown
function ensureContactsDropdown(items: SidebarItem[]): SidebarItem[] {
  const safeItems = Array.isArray(items) ? items : [];

  const alreadyHasContactsDropdown = safeItems.some(
    (item) =>
      item.label === "Contacts Directory" ||
      item.children?.some(
        (child) =>
          child.path === "/clients" ||
          child.path === "/suppliers" ||
          child.path === "/contact-persons",
      ),
  );

  if (alreadyHasContactsDropdown) {
    return safeItems;
  }

  // Remove old standalone contact tabs if they exist, then insert dropdown
  const filteredItems = safeItems.filter(
    (item) =>
      item.path !== "/clients" &&
      item.path !== "/suppliers" &&
      item.path !== "/contact-persons",
  );

  const dashboardIndex = filteredItems.findIndex(
    (item) => item.path === "/dashboard",
  );

  if (dashboardIndex >= 0) {
    const updated = [...filteredItems];
    updated.splice(dashboardIndex + 1, 0, CONTACTS_DROPDOWN);
    return updated;
  }

  return [CONTACTS_DROPDOWN, ...filteredItems];
}

function ensureFinanceDropdown(items: SidebarItem[]): SidebarItem[] {
  const safeItems = Array.isArray(items) ? items : [];

  const alreadyHasFinanceDropdown = safeItems.some(
    (item) =>
      item.label === "Finance" &&
      item.children?.some(
        (child) =>
          child.path === "/budget-requests" ||
          child.path === "/expenses" ||
          child.path === "/accounts" ||
          child.path === "/reimbursement",
      ),
  );

  if (alreadyHasFinanceDropdown) {
    return safeItems;
  }

  const filteredItems = safeItems.filter(
    (item) =>
      item.path !== "/finance" &&
      item.path !== "/budget-requests" &&
      item.path !== "/expenses" &&
      item.path !== "/accounts" &&
      item.path !== "/reimbursement" &&
      item.label !== "Finance" &&
      item.label !== "Account ledger",
  );

  const contactsIndex = filteredItems.findIndex(
    (item) => item.label === "Contacts Directory",
  );

  if (contactsIndex >= 0) {
    const updated = [...filteredItems];
    updated.splice(contactsIndex + 1, 0, FINANCE_DROPDOWN);
    return updated;
  }

  const dashboardIndex = filteredItems.findIndex(
    (item) => item.path === "/dashboard",
  );

  if (dashboardIndex >= 0) {
    const updated = [...filteredItems];
    updated.splice(dashboardIndex + 1, 0, FINANCE_DROPDOWN);
    return updated;
  }

  return [FINANCE_DROPDOWN, ...filteredItems];
}

function ensureRTDManagementTab(items: SidebarItem[]): SidebarItem[] {
  const safeItems = Array.isArray(items) ? items : [];

  const alreadyExists = safeItems.some(
    (item) => item.path === "/rtd-management",
  );

  if (alreadyExists) {
    return safeItems;
  }

  const estimateIndex = safeItems.findIndex(
    (item) => item.path === "/estimate",
  );

  const updated = [...safeItems];
  const rtdItem: SidebarItem = {
    path: "/rtd-management",
    label: "RTD Management",
    icon: "FileText",
  };

  if (estimateIndex >= 0) {
    updated.splice(estimateIndex + 1, 0, rtdItem);
    return updated;
  }

  updated.push(rtdItem);
  return updated;
}

function ensureReportsTab(items: SidebarItem[]): SidebarItem[] {
  const safeItems = Array.isArray(items) ? items : [];

  const alreadyExists = safeItems.some((item) => item.path === "/reports");

  if (alreadyExists) {
    return safeItems;
  }

  const dashboardIndex = safeItems.findIndex(
    (item) => item.path === "/dashboard",
  );

  const reportsItem: SidebarItem = {
    path: "/reports",
    label: "Reports",
    icon: "TrendingUp",
  };

  const updated = [...safeItems];

  if (dashboardIndex >= 0) {
    updated.splice(dashboardIndex + 1, 0, reportsItem);
    return updated;
  }

  return [reportsItem, ...updated];
}

// Every user can make requests (leave, salary advance, documents), so the tab
// is added for all roles after Tasks (or Dashboard) unless the saved sidebar
// already has it. Its label is set when rendering: "Employee Management" for
// the main admin and anyone given approve or record access, "Self
// Management" for everyone else. A saved entry for the old /leave page is
// replaced.
function ensureRequestsTab(items: SidebarItem[]): SidebarItem[] {
  const safeItems = (Array.isArray(items) ? items : []).filter(
    (item) => item.path !== "/leave",
  );

  const alreadyExists = safeItems.some(
    (item) =>
      item.path === "/requests" ||
      item.children?.some((child) => child.path === "/requests"),
  );

  if (alreadyExists) {
    return safeItems;
  }

  const requestsItem: SidebarItem = {
    path: "/requests",
    label: "Self Management",
    icon: "ClipboardList",
  };

  const anchorIndex = [
    safeItems.findIndex((item) => item.path === "/task-calendar"),
    safeItems.findIndex((item) => item.path === "/dashboard"),
  ].find((index) => index >= 0);

  const updated = [...safeItems];

  if (anchorIndex !== undefined) {
    updated.splice(anchorIndex + 1, 0, requestsItem);
    return updated;
  }

  updated.push(requestsItem);
  return updated;
}

// RTGS is for the finance team and main admins only — added here rather than
// in AVAILABLE_TABS so the sidebar config screen can't hand it to other roles.
// Placed right after the Finance dropdown when the role has one.
function applyRtgsAccess(
  items: SidebarItem[],
  userRole: string,
): SidebarItem[] {
  const safeItems = Array.isArray(items) ? items : [];
  const withoutRtgs = safeItems.filter(
    (item) => item.label !== RTGS_DROPDOWN.label,
  );

  if (!canAccessRtgs(userRole)) {
    return withoutRtgs;
  }

  const financeIndex = withoutRtgs.findIndex(
    (item) => item.label === "Finance",
  );
  const updated = [...withoutRtgs];
  updated.splice(
    financeIndex >= 0 ? financeIndex + 1 : updated.length,
    0,
    RTGS_DROPDOWN,
  );
  return updated;
}

// Always include the profile tab for its three authorized roles, including
// roles with an older saved sidebar configuration. Remove stale assignments
// from every other role, including entries nested inside dropdowns.
function applyEmployeeProfileAccess(
  items: SidebarItem[],
  userRole: string | null,
): SidebarItem[] {
  const removeProfiles = (entries: SidebarItem[]): SidebarItem[] =>
    entries
      .filter((item) => item.path !== EMPLOYEE_PROFILE_PATH)
      .map((item) =>
        item.children
          ? { ...item, children: removeProfiles(item.children) }
          : item,
      );
  const result = removeProfiles(items);
  if (!canManageEmployeeProfiles(userRole)) return result;
  const anchor = result.findIndex(
    (item) => item.path === "/users" || item.path === "/requests",
  );
  result.splice(anchor >= 0 ? anchor + 1 : result.length, 0, {
    path: EMPLOYEE_PROFILE_PATH,
    label: "Employee Profile",
    icon: "UserRound",
  });
  return result;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);
  const [userName, setUserName] = useState<string>("User");

  const [searchUserId, setSearchUserId] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
  // Cheque collections load only once the search box is first used, so pages
  // don't keep five extra live listeners open for users who never search.
  const [chequeSearchActivated, setChequeSearchActivated] = useState(false);
  const [chequeSearchLoading, setChequeSearchLoading] = useState(false);
  const [globalSearchData, setGlobalSearchData] = useState<GlobalSearchData>(
    createEmptyGlobalSearchData,
  );
  const [selectedGlobalSearchResult, setSelectedGlobalSearchResult] =
    useState<GlobalSearchResult | null>(null);

  const [location, setLocation] = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarHoverOpen, setSidebarHoverOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>(
    {},
  );

  const effectiveCollapsed = sidebarCollapsed && !sidebarHoverOpen;

  const { notifications } = useNotifications();

  // Unread request notifications (new requests for approvers, decisions for
  // employees) light the dot on the requests tab; all other unread
  // notifications keep lighting the Pipeline Management dot.
  const requestUnreadCount = notifications.filter(
    (notification) =>
      !notification.read &&
      REQUEST_NOTIFICATION_TYPES.includes(notification.type),
  ).length;
  const unreadCount = notifications.filter(
    (notification) =>
      !notification.read &&
      !REQUEST_NOTIFICATION_TYPES.includes(notification.type),
  ).length;

  // Approver assignments decide whether the requests tab reads "Employee
  // Management" (main admin, approvers and record-only users such as
  // finance) or "Self Management" (everyone else).
  const [requestApprovers, setRequestApprovers] = useState<RequestApprover[]>(
    [],
  );

  useEffect(() => {
    if (!searchUserId) {
      setRequestApprovers([]);
      return;
    }

    return subscribeToApprovers(setRequestApprovers);
  }, [searchUserId]);

  const managesEmployees = getApprovalAccess(
    searchUserId || "",
    role,
    requestApprovers,
  ).canRecord;

  const navItems = useMemo(
    () =>
      applyEmployeeProfileAccess(sidebarItems, role).map((item) =>
        item.path === "/requests"
          ? {
              ...item,
              label: managesEmployees
                ? "Employee Management"
                : "Self Management",
            }
          : item,
      ),
    [sidebarItems, managesEmployees, role],
  );

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.clear();
    setLocation("/login");
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("iedge_sidebar_collapsed");
      if (saved === "1") setSidebarCollapsed(true);
    } catch {
      // ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "iedge_sidebar_collapsed",
        sidebarCollapsed ? "1" : "0",
      );
    } catch {
      // ignore localStorage errors
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    let unsubRole: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubRole) {
        unsubRole();
        unsubRole = null;
      }

      setLoading(true);

      if (!user) {
        setRole(null);
        setSidebarItems([]);
        setUserName("Guest");
        setSearchUserId(null);
        setGlobalSearch("");
        setGlobalSearchOpen(false);
        setSelectedGlobalSearchResult(null);
        setChequeSearchActivated(false);
        setGlobalSearchData(createEmptyGlobalSearchData());
        setLoading(false);
        setLocation("/login");
        return;
      }

      try {
        const userRef = doc(db, "Panels", PANEL_ID, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          setRole(null);
          setSidebarItems([]);
          setUserName(user.displayName || "User");
          setSearchUserId(null);
          setLoading(false);
          return;
        }

        const userData = userSnap.data();

        const userRole = normalizeRole(userData.role);

        setRole(userRole);
        setUserName(userData.displayName || user.displayName || "User");
        setSearchUserId(user.uid);

        if (!userRole) {
          setSidebarItems([]);
          setLoading(false);
          return;
        }

        // ✅ Always read saved Firestore sidebar config first
        const roleRef = doc(db, "Panels", PANEL_ID, "sidebarConfig", userRole);

        unsubRole = onSnapshot(
          roleRef,
          (snap) => {
            const savedItems = snap.exists()
              ? ((snap.data().items || []) as SidebarItem[])
              : [];

            let finalItems: SidebarItem[] = [];

            if (savedItems.length > 0) {
              finalItems = savedItems;
            } else if (userRole === "main_admin") {
              finalItems = AVAILABLE_TABS;
            } else {
              finalItems = [];
            }

            // ✅ Force Contacts Directory dropdown for admin/main_admin
            if (userRole === "admin" || userRole === "main_admin") {
              finalItems = ensureContactsDropdown(finalItems);
              finalItems = ensureFinanceDropdown(finalItems);
            }

            if (userRole === "finance") {
              finalItems = ensureFinanceDropdown(finalItems);
            }

            if (userRole === "main_admin") {
              finalItems = ensureRTDManagementTab(finalItems);
            }

            // Reports shows company-wide profit figures, so it's limited to
            // the same roles that already see financial data (Finance
            // dropdown / RTD).
            if (
              userRole === "admin" ||
              userRole === "main_admin" ||
              userRole === "finance"
            ) {
              finalItems = ensureReportsTab(finalItems);
            }

            finalItems = ensureRequestsTab(finalItems);

            finalItems = applyRtgsAccess(finalItems, userRole);

            setSidebarItems(finalItems);
            setLoading(false);
          },
          (error) => {
            console.error("Sidebar config load error:", error);

            if (userRole === "main_admin") {
              setSidebarItems(AVAILABLE_TABS);
            } else {
              setSidebarItems([]);
            }

            setLoading(false);
          },
        );
      } catch (error) {
        console.error("Layout auth/sidebar error:", error);
        setRole(null);
        setSidebarItems([]);
        setSearchUserId(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubRole) unsubRole();
    };
  }, [setLocation]);

  useEffect(() => {
    if (!searchUserId || !role) {
      setGlobalSearchData((previous) => ({
        ...previous,
        estimate: [],
        invoice: [],
        po: [],
      }));
      setGlobalSearchLoading(false);
      return;
    }

    const canViewAllSearchRecords = GLOBAL_SEARCH_VIEW_ALL_ROLES.includes(role);

    setGlobalSearchLoading(true);

    let initializedSources = 0;

    const markSourceInitialized = () => {
      initializedSources += 1;

      if (initializedSources >= GLOBAL_SEARCH_SOURCES.length) {
        setGlobalSearchLoading(false);
      }
    };

    const unsubscribers = GLOBAL_SEARCH_SOURCES.map((source) => {
      const sourceRef = collection(
        db,
        "Panels",
        PANEL_ID,
        source.collectionName,
      );

      const sourceQuery = canViewAllSearchRecords
        ? query(sourceRef)
        : query(sourceRef, where("createdBy", "==", searchUserId));

      let initialized = false;

      const markOnce = () => {
        if (initialized) return;
        initialized = true;
        markSourceInitialized();
      };

      return onSnapshot(
        sourceQuery,
        (snapshot) => {
          const records = snapshot.docs.map((snapshotDoc) => ({
            id: snapshotDoc.id,
            ...snapshotDoc.data(),
          }));

          setGlobalSearchData((previous) => ({
            ...previous,
            [source.key]: records,
          }));

          markOnce();
        },
        (error) => {
          console.warn(
            `Global search could not read ${source.collectionName}:`,
            error,
          );

          setGlobalSearchData((previous) => ({
            ...previous,
            [source.key]: [],
          }));

          markOnce();
        },
      );
    });

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [searchUserId, role]);

  useEffect(() => {
    const emptyChequeData = (): Pick<GlobalSearchData, ChequeSearchKind> => ({
      record: [],
      payment: [],
      budgetRequest: [],
      reimbursement: [],
      statementEntry: [],
    });

    if (!searchUserId || !role || !chequeSearchActivated) {
      setGlobalSearchData((previous) => ({
        ...previous,
        ...emptyChequeData(),
      }));
      setChequeSearchLoading(false);
      return;
    }

    const canViewAllSearchRecords = GLOBAL_SEARCH_VIEW_ALL_ROLES.includes(role);

    const sources = CHEQUE_SEARCH_SOURCES.filter(
      (source) => canViewAllSearchRecords || source.ownerField,
    );

    if (sources.length === 0) {
      setChequeSearchLoading(false);
      return;
    }

    setChequeSearchLoading(true);

    let initializedSources = 0;

    const unsubscribers = sources.map((source) => {
      const sourceRef = collection(
        db,
        "Panels",
        PANEL_ID,
        source.collectionName,
      );

      const sourceQuery =
        canViewAllSearchRecords || !source.ownerField
          ? query(sourceRef)
          : query(sourceRef, where(source.ownerField, "==", searchUserId));

      let initialized = false;

      const markOnce = () => {
        if (initialized) return;
        initialized = true;
        initializedSources += 1;

        if (initializedSources >= sources.length) {
          setChequeSearchLoading(false);
        }
      };

      return onSnapshot(
        sourceQuery,
        (snapshot) => {
          // Only documents that actually carry a cheque number are kept.
          const records = snapshot.docs
            .map((snapshotDoc) => ({
              id: snapshotDoc.id,
              ...snapshotDoc.data(),
            }))
            .filter((record) => getAllChequeNumbers(record).length > 0);

          setGlobalSearchData((previous) => ({
            ...previous,
            [source.key]: records,
          }));

          markOnce();
        },
        (error) => {
          console.warn(
            `Global cheque search could not read ${source.collectionName}:`,
            error,
          );

          setGlobalSearchData((previous) => ({
            ...previous,
            [source.key]: [],
          }));

          markOnce();
        },
      );
    });

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [searchUserId, role, chequeSearchActivated]);

  const globalSearchResults = useMemo(() => {
    const searchValue = String(globalSearch || "").trim();

    if (normalizeGlobalSearchValue(searchValue).length < 2) {
      return [];
    }

    const keywordResults: GlobalSearchResult[] = GLOBAL_SEARCH_SOURCES.flatMap(
      (source) =>
        globalSearchData[source.key]
          .filter((record) => recordMatchesGlobalSearch(record, searchValue))
          .map((record) => ({
            kind: source.key,
            label: source.label,
            route: source.route,
            record,
            primaryNumber: getPrimarySearchNumber(source.key, record),
          })),
    );

    const chequeResults: GlobalSearchResult[] = CHEQUE_SEARCH_SOURCES.flatMap(
      (source) =>
        globalSearchData[source.key].flatMap((record) => {
          const matchedChequeNumber = getMatchingChequeNumber(
            record,
            searchValue,
          );

          return matchedChequeNumber
            ? [
                {
                  kind: source.key,
                  label: source.label,
                  route: source.route,
                  record,
                  primaryNumber: matchedChequeNumber,
                },
              ]
            : [];
        }),
    );

    const results = [...keywordResults, ...chequeResults];

    return results
      .sort((a, b) => {
        const aScore = getGlobalSearchScore(
          a.record,
          a.primaryNumber,
          searchValue,
        );
        const bScore = getGlobalSearchScore(
          b.record,
          b.primaryNumber,
          searchValue,
        );

        if (aScore !== bScore) return bScore - aScore;

        return a.label.localeCompare(b.label);
      })
      .slice(0, 50);
  }, [globalSearch, globalSearchData]);

  useEffect(() => {
    // ✅ Auto-open dropdown if current page is inside it
    const nextOpenDropdowns: Record<string, boolean> = {};

    sidebarItems.forEach((item) => {
      const key = `${item.label}-${item.path}`;
      const hasActiveChild = item.children?.some(
        (child) => child.path === location,
      );

      if (hasActiveChild) {
        nextOpenDropdowns[key] = true;
      }
    });

    setOpenDropdowns((prev) => ({
      ...prev,
      ...nextOpenDropdowns,
    }));
  }, [sidebarItems, location]);

  const getPageTitle = (items: SidebarItem[], currentPath: string): string => {
    for (const item of items) {
      if (item.path === currentPath) return item.label;

      if (item.children?.length) {
        const childTitle = getPageTitle(item.children, currentPath);
        if (childTitle !== "Dashboard") return childTitle;
      }
    }

    return "Dashboard";
  };

  const pageTitle = getPageTitle(navItems, location);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside
        className={`bg-card border-r border-border shadow-sm flex flex-col transition-all duration-200 ${
          effectiveCollapsed ? "w-16 px-2 py-4" : "w-64 p-4"
        }`}
        onMouseEnter={() => {
          if (sidebarCollapsed) setSidebarHoverOpen(true);
        }}
        onMouseLeave={() => {
          if (sidebarCollapsed) setSidebarHoverOpen(false);
        }}
      >
        <div
          className={`flex items-center mb-6 ${
            effectiveCollapsed ? "justify-center gap-0" : "justify-between"
          }`}
        >
          {effectiveCollapsed ? (
            <div className="h-9 w-9 rounded-md pl-3 flex items-center font-bold" />
          ) : (
            <h2 className="text-sm font-bold pl-2">iEDGE Management</h2>
          )}

          <Button
            variant="ghost"
            className={`${effectiveCollapsed ? "ml-0" : ""} h-9 w-9 p-0`}
            aria-label={
              sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => {
              setSidebarCollapsed((v) => !v);
              setSidebarHoverOpen(false);
            }}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <nav className="space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = getSidebarIcon(item.icon);
            const hasChildren = !!item.children?.length;
            const dropdownKey = `${item.label}-${item.path}`;
            const isDropdownOpen = !!openDropdowns[dropdownKey];

            const hasActiveChild = item.children?.some(
              (child) => child.path === location,
            );

            const isActive = location === item.path || hasActiveChild;

            const showDot =
              (unreadCount > 0 &&
                (item.path === "/sales-management" ||
                  item.children?.some(
                    (child) => child.path === "/sales-management",
                  ))) ||
              (requestUnreadCount > 0 &&
                (item.path === "/requests" ||
                  item.children?.some((child) => child.path === "/requests")));

            if (hasChildren) {
              return (
                <div key={dropdownKey} className="space-y-1">
                  <Button
                    type="button"
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full ${
                      effectiveCollapsed
                        ? "justify-center px-2"
                        : "justify-start"
                    }`}
                    title={effectiveCollapsed ? item.label : undefined}
                    aria-label={item.label}
                    onClick={() => {
                      if (effectiveCollapsed) {
                        setSidebarHoverOpen(true);
                        return;
                      }

                      setOpenDropdowns((prev) => ({
                        ...prev,
                        [dropdownKey]: !prev[dropdownKey],
                      }));
                    }}
                  >
                    <div
                      className={`flex w-full items-center ${
                        effectiveCollapsed
                          ? "justify-center"
                          : "justify-between"
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="relative inline-flex items-center justify-center">
                          {Icon ? (
                            <Icon
                              className={`h-4 w-4 ${
                                effectiveCollapsed ? "" : "mr-2"
                              }`}
                            />
                          ) : (
                            <span
                              className={`font-semibold ${
                                effectiveCollapsed ? "" : "mr-2"
                              }`}
                            >
                              {item.label?.[0] || "•"}
                            </span>
                          )}

                          {showDot && effectiveCollapsed && (
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                            </span>
                          )}
                        </span>

                        {!effectiveCollapsed && <span>{item.label}</span>}
                      </div>

                      {!effectiveCollapsed && (
                        <div className="flex items-center gap-2">
                          {showDot && (
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                            </span>
                          )}

                          {isDropdownOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      )}
                    </div>
                  </Button>

                  {!effectiveCollapsed && isDropdownOpen && (
                    <div className="ml-6 space-y-1 border-l pl-3">
                      {item.children?.map((child) => {
                        const ChildIcon = getSidebarIcon(child.icon);

                        const childShowDot =
                          (unreadCount > 0 &&
                            child.path === "/sales-management") ||
                          (requestUnreadCount > 0 &&
                            child.path === "/requests");

                        return (
                          <Link key={child.path} href={child.path}>
                            <Button
                              variant={
                                location === child.path ? "default" : "ghost"
                              }
                              className="w-full justify-start"
                              aria-label={child.label}
                            >
                              <div className="flex w-full items-center justify-between">
                                <div className="flex items-center">
                                  {ChildIcon ? (
                                    <ChildIcon className="mr-2 h-4 w-4" />
                                  ) : (
                                    <span className="mr-2 font-semibold">
                                      {child.label?.[0] || "•"}
                                    </span>
                                  )}

                                  <span>{child.label}</span>
                                </div>

                                {childShowDot && (
                                  <span className="relative flex h-2.5 w-2.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                                  </span>
                                )}
                              </div>
                            </Button>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={location === item.path ? "default" : "ghost"}
                  className={`w-full ${
                    effectiveCollapsed ? "justify-center px-2" : "justify-start"
                  }`}
                  title={effectiveCollapsed ? item.label : undefined}
                  aria-label={item.label}
                >
                  <div
                    className={`flex w-full items-center ${
                      effectiveCollapsed ? "justify-center" : "justify-between"
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="relative inline-flex items-center justify-center">
                        {Icon ? (
                          <Icon
                            className={`h-4 w-4 ${
                              effectiveCollapsed ? "" : "mr-2"
                            }`}
                          />
                        ) : (
                          <span
                            className={`font-semibold ${
                              effectiveCollapsed ? "" : "mr-2"
                            }`}
                          >
                            {item.label?.[0] || "•"}
                          </span>
                        )}

                        {showDot && effectiveCollapsed && (
                          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                          </span>
                        )}
                      </span>

                      {!effectiveCollapsed && <span>{item.label}</span>}
                    </div>

                    {showDot && !effectiveCollapsed && (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                      </span>
                    )}
                  </div>
                </Button>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="flex flex-col gap-3 border-b border-border bg-card px-6 py-4 lg:flex-row lg:items-center">
          <div className="shrink-0 lg:w-52">
            <h1 className="text-lg font-semibold">{pageTitle}</h1>
          </div>

          <div
            className="relative w-full max-w-2xl lg:mx-auto"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                setGlobalSearchOpen(false);
              }
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="text"
              value={globalSearch}
              onFocus={() => {
                setGlobalSearchOpen(true);
                setChequeSearchActivated(true);
              }}
              onChange={(event) => {
                setGlobalSearch(event.target.value);
                setGlobalSearchOpen(true);
                setChequeSearchActivated(true);
              }}
              placeholder="Search any keyword in Estimate, PO, or Invoice records, or a cheque number"
              className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-10 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
              aria-label="Search all Estimate, PO, and Invoice record data, or any cheque number"
            />

            {globalSearch && (
              <button
                type="button"
                className="absolute right-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                onClick={() => {
                  setGlobalSearch("");
                  setGlobalSearchOpen(false);
                }}
                aria-label="Clear global search"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {globalSearchOpen && globalSearch.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[100] max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-2xl">
                <div className="flex items-center justify-between px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Global Search
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-foreground">
                      {globalSearchLoading || chequeSearchLoading
                        ? "Loading records..."
                        : `${globalSearchResults.length} result${
                            globalSearchResults.length === 1 ? "" : "s"
                          }`}
                    </p>
                  </div>

                  <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground">
                    All Record Fields
                  </span>
                </div>

                {!globalSearchLoading &&
                !chequeSearchLoading &&
                globalSearchResults.length === 0 ? (
                  <div className="rounded-xl bg-secondary/50 px-4 py-8 text-center">
                    <Search className="mx-auto h-5 w-5 text-muted-foreground" />
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      No matching record found
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Search any saved value such as number, client, vendor,
                      subject, company, status, description, item, amount,
                      reference, or cheque number.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {globalSearchResults.map((result) => {
                      const details = getSearchResultDetails(result.record);

                      return (
                        <div
                          key={`${result.kind}-${result.record.id}`}
                          className="rounded-xl border border-border bg-background p-3 transition hover:border-primary/30 hover:shadow-sm"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                                  {result.label}
                                </span>

                                <span className="break-all text-sm font-bold text-foreground">
                                  {result.primaryNumber}
                                </span>

                                {details.status && (
                                  <span className="rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] font-semibold capitalize text-secondary-foreground">
                                    {details.status.replace(/_/g, " ")}
                                  </span>
                                )}
                              </div>

                              <div className="mt-3 grid grid-cols-1 gap-x-5 gap-y-2 text-xs sm:grid-cols-2">
                                {details.estimateNo && (
                                  <div>
                                    <span className="text-muted-foreground">
                                      Estimate:
                                    </span>{" "}
                                    <span className="font-semibold text-foreground">
                                      {details.estimateNo}
                                    </span>
                                  </div>
                                )}

                                {details.poNo && (
                                  <div>
                                    <span className="text-muted-foreground">
                                      PO:
                                    </span>{" "}
                                    <span className="font-semibold text-foreground">
                                      {details.poNo}
                                    </span>
                                  </div>
                                )}

                                {details.invoiceNo && (
                                  <div>
                                    <span className="text-muted-foreground">
                                      Invoice:
                                    </span>{" "}
                                    <span className="font-semibold text-foreground">
                                      {details.invoiceNo}
                                    </span>
                                  </div>
                                )}

                                {details.chequeNumbers && (
                                  <div className="min-w-0">
                                    <span className="text-muted-foreground">
                                      Cheque No:
                                    </span>{" "}
                                    <span className="break-all font-semibold text-foreground">
                                      {details.chequeNumbers}
                                    </span>
                                  </div>
                                )}

                                {details.clientOrVendor && (
                                  <div className="min-w-0">
                                    <span className="text-muted-foreground">
                                      Client / Vendor:
                                    </span>{" "}
                                    <span className="font-semibold text-foreground">
                                      {details.clientOrVendor}
                                    </span>
                                  </div>
                                )}

                                {details.company && (
                                  <div>
                                    <span className="text-muted-foreground">
                                      Company:
                                    </span>{" "}
                                    <span className="font-semibold text-foreground">
                                      {details.company}
                                    </span>
                                  </div>
                                )}

                                <div>
                                  <span className="text-muted-foreground">
                                    Date:
                                  </span>{" "}
                                  <span className="font-semibold text-foreground">
                                    {details.date}
                                  </span>
                                </div>

                                <div>
                                  <span className="text-muted-foreground">
                                    Amount:
                                  </span>{" "}
                                  <span className="font-semibold text-foreground">
                                    {details.amount}
                                  </span>
                                </div>

                                {details.createdBy && (
                                  <div>
                                    <span className="text-muted-foreground">
                                      Created By:
                                    </span>{" "}
                                    <span className="font-semibold text-foreground">
                                      {details.createdBy}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {details.subject && (
                                <div className="mt-2 text-xs">
                                  <span className="text-muted-foreground">
                                    Subject / Project:
                                  </span>{" "}
                                  <span className="font-medium text-foreground">
                                    {details.subject}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex shrink-0 flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                className="rounded-lg"
                                onClick={() => {
                                  setSelectedGlobalSearchResult(result);
                                  setGlobalSearchOpen(false);
                                }}
                              >
                                Full Preview
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1.5 rounded-lg"
                                onClick={() => {
                                  setGlobalSearchOpen(false);
                                  setLocation(
                                    getGlobalSearchModuleRoute(result),
                                  );
                                }}
                              >
                                Open Module
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-4 lg:justify-end">
            {searchUserId && (
              <AttendanceCheckButton
                userId={searchUserId}
                userName={userName}
                role={role || ""}
              />
            )}
            <ThemeToggle />
            <NotificationBell />

            <div className="flex items-center gap-2">
              <div className="flex items-center space-x-2 rounded-full bg-secondary px-3 py-3">
                <User className="h-4 w-4 text-muted-foreground" />

                <span className="text-sm font-medium text-secondary-foreground">
                  {userName}
                </span>

                <span className="rounded-full bg-primary px-2 py-1 text-xs capitalize text-primary-foreground">
                  {role || "no-role"}
                </span>
              </div>

              <Button
                variant="outline"
                className="gap-2"
                onClick={handleLogout}
              >
                Logout
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>

      {selectedGlobalSearchResult &&
        (() => {
          const selectedDetails = getSearchResultDetails(
            selectedGlobalSearchResult.record,
          );

          return (
            <div className="fixed inset-0 z-[200] bg-slate-950/70 p-0 backdrop-blur-sm sm:p-4">
              <div className="mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden bg-slate-50 shadow-2xl sm:rounded-3xl sm:border sm:border-white/20">
                <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                          {selectedGlobalSearchResult.label}
                        </span>

                        {selectedDetails.status && (
                          <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-700">
                            {selectedDetails.status.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>

                      <h2 className="mt-3 break-all text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">
                        {selectedGlobalSearchResult.primaryNumber}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Complete Firestore record preview for the selected{" "}
                        {selectedGlobalSearchResult.label.toLowerCase()}.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => {
                          setSelectedGlobalSearchResult(null);
                          setLocation(
                            getGlobalSearchModuleRoute(
                              selectedGlobalSearchResult,
                            ),
                          );
                        }}
                      >
                        Open Module
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => setSelectedGlobalSearchResult(null)}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Close
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
                  <div className="space-y-6">
                    <section>
                      <div className="mb-3">
                        <h3 className="text-base font-black text-slate-950">
                          Record Summary
                        </h3>
                        <p className="text-xs text-slate-500">
                          Important identifying and financial information.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                            Record Type
                          </p>
                          <p className="mt-2 font-bold text-slate-950">
                            {selectedGlobalSearchResult.label}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                            Primary Number
                          </p>
                          <p className="mt-2 break-all font-bold text-slate-950">
                            {selectedGlobalSearchResult.primaryNumber}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                            Date
                          </p>
                          <p className="mt-2 font-bold text-slate-950">
                            {selectedDetails.date}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                            Amount
                          </p>
                          <p className="mt-2 font-bold text-slate-950">
                            {selectedDetails.amount}
                          </p>
                        </div>
                      </div>
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                      <div className="mb-4">
                        <h3 className="text-base font-black text-slate-950">
                          Linked Numbers & Main Details
                        </h3>
                        <p className="text-xs text-slate-500">
                          Estimate, purchase order, invoice, client/vendor,
                          company, subject, and creator information where
                          available.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-xl bg-slate-50 p-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                            Estimate Number
                          </p>
                          <p className="mt-1 break-all font-semibold text-slate-900">
                            {selectedDetails.estimateNo || "-"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                            PO Number
                          </p>
                          <p className="mt-1 break-all font-semibold text-slate-900">
                            {selectedDetails.poNo || "-"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                            Invoice Number
                          </p>
                          <p className="mt-1 break-all font-semibold text-slate-900">
                            {selectedDetails.invoiceNo || "-"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                            Client / Vendor
                          </p>
                          <p className="mt-1 whitespace-pre-wrap break-words font-semibold text-slate-900">
                            {selectedDetails.clientOrVendor || "-"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                            Company
                          </p>
                          <p className="mt-1 whitespace-pre-wrap break-words font-semibold text-slate-900">
                            {selectedDetails.company || "-"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                            Created By
                          </p>
                          <p className="mt-1 whitespace-pre-wrap break-words font-semibold text-slate-900">
                            {selectedDetails.createdBy || "-"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4 md:col-span-2 xl:col-span-3">
                          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                            Subject / Project / Description
                          </p>
                          <p className="mt-1 whitespace-pre-wrap break-words font-semibold text-slate-900">
                            {selectedDetails.subject || "-"}
                          </p>
                        </div>
                      </div>
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                      <div className="mb-4">
                        <h3 className="text-base font-black text-slate-950">
                          All Available Record Information
                        </h3>
                        <p className="text-xs leading-5 text-slate-500">
                          Every field currently stored on this Firestore
                          document is shown below, including nested objects,
                          line items, payment data, taxes, notes, references,
                          and uploaded-file links when present.
                        </p>
                      </div>

                      <PreviewValue
                        value={{
                          documentId: selectedGlobalSearchResult.record.id,
                          ...selectedGlobalSearchResult.record,
                        }}
                      />
                    </section>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
