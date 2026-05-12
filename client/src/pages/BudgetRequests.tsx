
// import { useEffect, useMemo, useState } from "react";
// import { useLocation } from "wouter";
// import { useAuth } from "@/contexts/AuthContext";
// import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { useFirestoreQuery } from "@/hooks/useFirestore";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import InvoiceRequestModal from "@/components/BudgeRequestModal";
// import PaymentReleaseModal from "@/components/PaymentReleaseModal";
// import ExpenseSheetModal from "@/components/ExpenseSheetModal";
// import InvoiceDetailsModal from "@/components/BudgeDetailsModal";
// import { InvoiceRequest } from "@shared/schema";
// import { useToast } from "@/hooks/use-toast";
// import RejectionModal from "@/components/RejectionModal";

// function formatPKR(value: number | string | undefined) {
//   if (value === null || value === undefined) return "0.00";
//   const num = typeof value === "number" ? value : parseFloat(String(value).replace(/,/g, "")) || 0;
//   return num.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// }

// function safeNumber(value: any) {
//   const parsed = Number(value);
//   return Number.isFinite(parsed) ? parsed : 0;
// }

// function normalizeText(value: any) {
//   return String(value || "").toLowerCase().trim();
// }

// function formatStatus(status: string) {
//   return String(status || "unknown")
//     .replace(/_/g, " ")
//     .replace(/^pending /, "")
//     .replace(/\b\w/g, (letter) => letter.toUpperCase());
// }

// function getDateFromValue(value: any): Date | null {
//   if (!value) return null;
//   if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
//   if (typeof value?.toDate === "function") {
//     const date = value.toDate();
//     return Number.isNaN(date?.getTime?.()) ? null : date;
//   }
//   if (typeof value?.seconds === "number") {
//     const date = new Date(value.seconds * 1000);
//     return Number.isNaN(date.getTime()) ? null : date;
//   }
//   if (typeof value === "string" || typeof value === "number") {
//     const date = new Date(value);
//     return Number.isNaN(date.getTime()) ? null : date;
//   }
//   return null;
// }

// function getRequestDate(invoice: any): Date | null {
//   return (
//     getDateFromValue(invoice?.createdAt) ||
//     getDateFromValue(invoice?.requestDate) ||
//     getDateFromValue(invoice?.date) ||
//     getDateFromValue(invoice?.updatedAt)
//   );
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

// export default function InvoiceRequests() {
//   const PANEL_ID = "IEDGE-SYSTEM";

//   const { userProfile } = useAuth();
//   const { toast } = useToast();
//   const [, setLocation] = useLocation();

//   const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
//   const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
//   const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
//   const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
//   const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRequest | null>(null);
//   const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
//   const [rejectionLoading, setRejectionLoading] = useState(false);

//   const [searchTerm, setSearchTerm] = useState("");
//   const [typeFilter, setTypeFilter] = useState<"all" | "project" | "general">("all");
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [dateFrom, setDateFrom] = useState("");
//   const [dateTo, setDateTo] = useState("");
//   const [monthFilter, setMonthFilter] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pageSize, setPageSize] = useState(10);

//   const { data: invoices = [], loading } = useFirestoreQuery<InvoiceRequest>(
//     `Panels/${PANEL_ID}/invoiceRequests`
//   );

//   const { data: expenseSheets = [] } = useFirestoreQuery<any>(`Panels/${PANEL_ID}/expenseSheets`);

//   const CREATE_PO_ROUTE = "/create-po";

//   function getRequestType(invoice: any): "general" | "project" {
//     const rawType = String(invoice?.invoiceType || invoice?.type || "").toLowerCase();
//     if (rawType === "project") return "project";
//     if (rawType === "general") return "general";

//     // Fallback for old records where invoiceType was not saved.
//     return invoice?.clientName || invoice?.project || invoice?.projectName || invoice?.projectCode
//       ? "project"
//       : "general";
//   }

//   function isProjectRequest(invoice: any): boolean {
//     return getRequestType(invoice) === "project";
//   }

//   function hasPOAlready(invoice: any): boolean {
//     return Boolean(invoice?.poSubmitted || invoice?.poCreated || invoice?.poId || invoice?.poNumber);
//   }

//   function getFirstVendorName(invoice: any): string {
//     const lineItems = Array.isArray(invoice?.lineItems) ? invoice.lineItems : [];
//     const approvedItems = Array.isArray(invoice?.approvalItems) ? invoice.approvalItems : [];
//     const allItems = [...approvedItems, ...lineItems];

//     const matchedItem = allItems.find(
//       (item: any) =>
//         item?.vendor ||
//         item?.vendorName ||
//         item?.supplier ||
//         item?.supplierName ||
//         item?.original?.vendor ||
//         item?.original?.supplier
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

//   function handleCreatePO(invoice: InvoiceRequest) {
//     const request: any = invoice;

//     localStorage.setItem(
//       "createPOFromBudgetRequest",
//       JSON.stringify({
//         invoiceRequestId: request.id,
//         requestId: request.requestId,
//         invoiceType: getRequestType(request),

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
//         supplierName: request.supplierName || request.vendorName || getFirstVendorName(request),
//         vendorName: request.vendorName || request.supplierName || getFirstVendorName(request),

//         totalAmount: Number(request.totalAmount || 0),
//         approvedAmount: Number(request.approvedAmount || request.totalAmount || 0),

//         // Keep all names because the PO page can read approvalItems, lineItems, or items.
//         approvalItems: request.approvalItems || [],
//         lineItems: request.lineItems || [],
//         items: request.items || request.lineItems || [],
//       })
//     );

//     setLocation(CREATE_PO_ROUTE);
//   }

//   async function handleApprove(invoice: InvoiceRequest) {
//     if (!userProfile) return;

//     try {
//       let newStatus = invoice.status;
//       let currentApprover = "";

//       switch (userProfile.role) {
//         case "operational_admin":
//           if (invoice.status === "pending_operational_admin") newStatus = "pending_main_admin";
//           break;
//         case "main_admin":
//           if (invoice.status === "pending_main_admin") newStatus = "pending_finance";
//           break;
//         case "finance":
//         case "financial_admin":
//           if (invoice.status === "pending_finance") newStatus = "approved";
//           break;
//       }

//       await updateDoc(doc(db, "Panels", PANEL_ID, "invoiceRequests", invoice.id), {
//         status: newStatus,
//         currentApprover,
//         approvalHistory: [
//           ...(invoice.approvalHistory || []),
//           {
//             approver: userProfile.displayName,
//             action: "approved",
//             timestamp: new Date(),
//             notes: "",
//           },
//         ],
//         updatedAt: serverTimestamp(),
//       });

//       toast({ title: "Success", description: "Budget request approved successfully" });
//     } catch (error: any) {
//       console.error("Failed to approve budget request:", error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to approve budget request",
//         variant: "destructive",
//       });
//     }
//   }

//   async function handleReject(invoice: InvoiceRequest, rejectionComment: string) {
//     if (!userProfile) return;

//     try {
//       setRejectionLoading(true);

//       await updateDoc(doc(db, "Panels", PANEL_ID, "invoiceRequests", invoice.id), {
//         status: "pending_operational_admin",
//         approvalHistory: [
//           ...(invoice.approvalHistory || []),
//           {
//             approver: userProfile.displayName,
//             action: "rejected",
//             timestamp: new Date(),
//             notes: rejectionComment,
//           },
//         ],
//         updatedAt: serverTimestamp(),
//       });

//       toast({ title: "Success", description: "Budget request rejected with comments" });

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

//   function getStatusBadgeColor(status: string): string {
//     switch (status) {
//       case "approved":
//       case "payment_released":
//         return "border-green-200 bg-green-50 text-green-700";
//       case "rejected":
//         return "border-red-200 bg-red-50 text-red-700";
//       case "pending_operational_admin":
//       case "pending_main_admin":
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

//   function getCurrentStep(status: string): string {
//     switch (status) {
//       case "pending_operational_admin":
//         return "Operational Admin Review";
//       case "pending_main_admin":
//         return "Main Admin Approval";
//       case "pending_finance":
//         return "Finance Approval";
//       case "approved":
//         return "Ready for Action";
//       case "payment_released":
//         return "Payment Released";
//       case "rejected":
//         return "Rejected";
//       default:
//         return "Unknown";
//     }
//   }

//   function canApprove(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;

//     switch (userProfile.role) {
//       case "operational_admin":
//         return invoice.status === "pending_operational_admin";
//       case "main_admin":
//         return invoice.status === "pending_main_admin";
//       case "finance":
//       case "financial_admin":
//         return invoice.status === "pending_finance";
//       default:
//         return false;
//     }
//   }

//   function canEdit(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;
//     return userProfile.role === "operation" && invoice.status === "pending_operational_admin";
//   }

//   function canReleasePayment(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;
//     return (
//       (userProfile.role === "finance" || userProfile.role === "financial_admin") &&
//       invoice.status === "approved" &&
//       !isProjectRequest(invoice)
//     );
//   }

//   function canCreatePO(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;
//     return (
//       (userProfile.role === "finance" || userProfile.role === "financial_admin") &&
//       invoice.status === "approved" &&
//       isProjectRequest(invoice) &&
//       !hasPOAlready(invoice)
//     );
//   }

//   function canSubmitExpense(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;
//     if (userProfile.role !== "operation" || invoice.status !== "payment_released") return false;

//     const hasExpenseSheet = expenseSheets?.some((expense: any) => expense.linkedRequestId === invoice.requestId);
//     return !hasExpenseSheet;
//   }

//   function getExpenseSheetStatus(invoice: InvoiceRequest): string | null {
//     if (!expenseSheets) return null;
//     const expenseSheet = expenseSheets.find((expense: any) => expense.linkedRequestId === invoice.requestId);
//     return expenseSheet?.status || null;
//   }

//   const canCreateInvoices = userProfile?.role === "operation";

//   const statusOptions = useMemo(() => {
//     const uniqueStatuses = Array.from(new Set((invoices || []).map((invoice) => invoice.status).filter(Boolean)));
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

//       const haystack = normalizeText([
//         invoice.requestId,
//         invoice.title,
//         invoice.subject,
//         invoice.clientName,
//         invoice.projectName,
//         invoice.project,
//         invoice.projectCode,
//         invoice.totalAmount,
//         invoice.approvedAmount,
//         invoice.vendorName,
//         invoice.supplierName,
//       ].join(" "));

//       const matchesSearch = !search || haystack.includes(search);
//       const matchesType = typeFilter === "all" || requestType === typeFilter;
//       const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
//       const matchesMonth = !monthFilter || requestDateInputValue.startsWith(monthFilter);
//       const matchesFrom = !fromDate || (requestDate && requestDate >= fromDate);
//       const matchesTo = !toDate || (requestDate && requestDate <= toDate);

//       return matchesSearch && matchesType && matchesStatus && matchesMonth && matchesFrom && matchesTo;
//     });
//   }, [dateFrom, dateTo, invoices, monthFilter, searchTerm, statusFilter, typeFilter]);

//   const summary = useMemo(() => {
//     const totalAmount = filteredInvoices.reduce((sum, invoice: any) => sum + safeNumber(invoice.totalAmount), 0);
//     const projectCount = filteredInvoices.filter((invoice) => getRequestType(invoice) === "project").length;
//     const generalCount = filteredInvoices.filter((invoice) => getRequestType(invoice) === "general").length;
//     const approvedCount = filteredInvoices.filter((invoice) => invoice.status === "approved").length;

//     return { totalAmount, projectCount, generalCount, approvedCount };
//   }, [filteredInvoices]);

//   const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
//   const startIndex = (currentPage - 1) * pageSize;
//   const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + pageSize);
//   const showingFrom = filteredInvoices.length === 0 ? 0 : startIndex + 1;
//   const showingTo = Math.min(startIndex + pageSize, filteredInvoices.length);

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [searchTerm, typeFilter, statusFilter, dateFrom, dateTo, monthFilter, pageSize]);

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
//             <p className="text-sm font-medium text-slate-500">Finance / Approvals</p>
//             <h2 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950" data-testid="text-invoices-title">
//               Budget Requests
//             </h2>
//             <p className="mt-2 max-w-2xl text-sm text-slate-500">
//               Review project and general budget requests, approve workflow stages, release payments, or create POs.
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
//               <p className="text-sm font-medium text-slate-500">Filtered Requests</p>
//               <p className="mt-3 text-3xl font-semibold text-slate-950">{filteredInvoices.length}</p>
//               <p className="mt-1 text-xs text-slate-400">Total records after filters</p>
//             </CardContent>
//           </Card>

//           <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//             <CardContent className="p-5">
//               <p className="text-sm font-medium text-slate-500">Project Requests</p>
//               <p className="mt-3 text-3xl font-semibold text-slate-950">{summary.projectCount}</p>
//               <p className="mt-1 text-xs text-slate-400">PO flow after approval</p>
//             </CardContent>
//           </Card>

//           <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//             <CardContent className="p-5">
//               <p className="text-sm font-medium text-slate-500">General Requests</p>
//               <p className="mt-3 text-3xl font-semibold text-slate-950">{summary.generalCount}</p>
//               <p className="mt-1 text-xs text-slate-400">Payment release flow</p>
//             </CardContent>
//           </Card>

//           <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//             <CardContent className="p-5">
//               <p className="text-sm font-medium text-slate-500">Filtered Value</p>
//               <p className="mt-3 text-2xl font-semibold text-slate-950">Rs {formatPKR(summary.totalAmount)}</p>
//               <p className="mt-1 text-xs text-slate-400">Approved waiting: {summary.approvedCount}</p>
//             </CardContent>
//           </Card>
//         </div>

//         <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//           <CardContent className="space-y-4 p-5">
//             <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
//               <div className="xl:col-span-2">
//                 <label className="mb-1 block text-xs font-medium text-slate-500">Search</label>
//                 <input
//                   value={searchTerm}
//                   onChange={(event) => setSearchTerm(event.target.value)}
//                   placeholder="Request ID, client, project, title..."
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">Request Type</label>
//                 <select
//                   value={typeFilter}
//                   onChange={(event) => setTypeFilter(event.target.value as "all" | "project" | "general")}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 >
//                   <option value="all">All Types</option>
//                   <option value="project">Project</option>
//                   <option value="general">General</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
//                 <select
//                   value={statusFilter}
//                   onChange={(event) => setStatusFilter(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 >
//                   <option value="all">All Statuses</option>
//                   {statusOptions.map((status) => (
//                     <option key={status} value={status}>
//                       {formatStatus(status)}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">Month</label>
//                 <input
//                   type="month"
//                   value={monthFilter}
//                   onChange={(event) => setMonthFilter(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">Rows</label>
//                 <select
//                   value={pageSize}
//                   onChange={(event) => setPageSize(Number(event.target.value))}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 >
//                   <option value={5}>5</option>
//                   <option value={10}>10</option>
//                   <option value={20}>20</option>
//                   <option value={50}>50</option>
//                 </select>
//               </div>
//             </div>

//             <div className="grid gap-3 md:grid-cols-3">
//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">From Date</label>
//                 <input
//                   type="date"
//                   value={dateFrom}
//                   onChange={(event) => setDateFrom(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">To Date</label>
//                 <input
//                   type="date"
//                   value={dateTo}
//                   onChange={(event) => setDateTo(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
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
//               <table className="w-full min-w-[1100px]">
//                 <thead>
//                   <tr className="border-b border-slate-200 bg-slate-50/80">
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Request ID</th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Client / Title</th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Project</th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Total Amount</th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Current Step</th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
//                   </tr>
//                 </thead>

//                 <tbody className="divide-y divide-slate-100">
//                   {paginatedInvoices.length === 0 ? (
//                     <tr>
//                       <td colSpan={9} className="px-6 py-12 text-center">
//                         <p className="text-sm font-medium text-slate-600">No budget requests found</p>
//                         <p className="mt-1 text-sm text-slate-400">Try changing your filters or create a new request.</p>
//                       </td>
//                     </tr>
//                   ) : (
//                     paginatedInvoices.map((invoice) => {
//                       const type = getRequestType(invoice);
//                       const displayClientOrTitle =
//                         type === "general"
//                           ? (invoice as any).title || (invoice as any).subject || "General Request"
//                           : (invoice as any).clientName || "-";
//                       const projectName =
//                         type === "project"
//                           ? (invoice as any).projectName || (invoice as any).project || (invoice as any).projectCode || "-"
//                           : "-";

//                       return (
//                         <tr key={invoice.id} className="transition hover:bg-slate-50/80">
//                           <td
//                             className="px-5 py-4 text-sm font-semibold text-slate-900"
//                             data-testid={`text-request-id-${invoice.id}`}
//                           >
//                             {invoice.requestId || "-"}
//                           </td>

//                           <td className="px-5 py-4">
//                             <Badge variant="outline" className={`rounded-full px-3 py-1 ${getTypeBadgeColor(type)}`}>
//                               {type === "project" ? "Project" : "General"}
//                             </Badge>
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-700">
//                             <div className="font-medium text-slate-900">{displayClientOrTitle}</div>
//                             {(invoice as any).projectCode && type === "project" && (
//                               <div className="mt-1 text-xs text-slate-400">Code: {(invoice as any).projectCode}</div>
//                             )}
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-600">{projectName}</td>

//                           <td className="px-5 py-4 text-sm text-slate-600">{formatRequestDate(invoice)}</td>

//                           <td className="px-5 py-4 text-sm font-semibold text-slate-900">
//                             Rs {formatPKR(invoice.totalAmount)}
//                           </td>

//                           <td className="px-5 py-4">
//                             <Badge variant="outline" className={`rounded-full px-3 py-1 ${getStatusBadgeColor(invoice.status)}`}>
//                               {formatStatus(invoice.status)}
//                             </Badge>
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-500">{getCurrentStep(invoice.status)}</td>

//                           <td className="px-5 py-4">
//                             <div className="flex flex-wrap gap-2">
//                               <Button
//                                 variant="outline"
//                                 size="sm"
//                                 className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
//                                 onClick={() => {
//                                   setSelectedInvoice(invoice);
//                                   setIsDetailsModalOpen(true);
//                                 }}
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
//                                     setSelectedInvoice(invoice);
//                                     setIsInvoiceModalOpen(true);
//                                   }}
//                                   data-testid={`button-edit-${invoice.id}`}
//                                 >
//                                   Edit
//                                 </Button>
//                               )}

//                               {canApprove(invoice) && (
//                                 <>
//                                   <Button
//                                     variant="outline"
//                                     size="sm"
//                                     className="rounded-xl border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
//                                     onClick={() => handleApprove(invoice)}
//                                     data-testid={`button-approve-${invoice.id}`}
//                                   >
//                                     Approve
//                                   </Button>

//                                   <Button
//                                     variant="outline"
//                                     size="sm"
//                                     className="rounded-xl border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
//                                     onClick={() => {
//                                       setSelectedInvoice(invoice);
//                                       setIsRejectionModalOpen(true);
//                                     }}
//                                     data-testid={`button-reject-${invoice.id}`}
//                                   >
//                                     Reject
//                                   </Button>
//                                 </>
//                               )}

//                               {canReleasePayment(invoice) && (
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   className="rounded-xl border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
//                                   onClick={() => {
//                                     setSelectedInvoice({
//                                       ...invoice,
//                                       invoiceNumber: invoice.requestId,
//                                       vendorName: (invoice as any).vendorName || (invoice as any).supplierName || (invoice as any).clientName,
//                                       amount: (invoice as any).approvedAmount || invoice.totalAmount,
//                                       dueDate: new Date(),
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

//                               {userProfile?.role === "operation" && invoice.status === "payment_released" && (
//                                 <>
//                                   {canSubmitExpense(invoice) ? (
//                                     <Button
//                                       variant="outline"
//                                       size="sm"
//                                       className="rounded-xl border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
//                                       onClick={() => {
//                                         setSelectedInvoice({
//                                           ...invoice,
//                                           invoiceNumber: invoice.requestId,
//                                           amount: invoice.totalAmount,
//                                         } as any);
//                                         setIsExpenseModalOpen(true);
//                                       }}
//                                       data-testid={`button-submit-expense-${invoice.id}`}
//                                     >
//                                       Submit Expense
//                                     </Button>
//                                   ) : (
//                                     <div
//                                       className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500"
//                                       data-testid={`text-expense-status-${invoice.id}`}
//                                     >
//                                       {getExpenseSheetStatus(invoice) === "acknowledged"
//                                         ? "Expense Sheet Acknowledged"
//                                         : getExpenseSheetStatus(invoice) === "rejected"
//                                         ? "Expense Sheet Rejected"
//                                         : "Waiting for Admin Approval"}
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
//                 Showing <span className="font-medium text-slate-700">{showingFrom}</span> to{" "}
//                 <span className="font-medium text-slate-700">{showingTo}</span> of{" "}
//                 <span className="font-medium text-slate-700">{filteredInvoices.length}</span> requests
//               </p>

//               <div className="flex items-center gap-2">
//                 <Button
//                   type="button"
//                   variant="outline"
//                   size="sm"
//                   className="rounded-xl border-slate-200"
//                   disabled={currentPage === 1}
//                   onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
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
//                   onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
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
//         onSuccess={() => {
//           setIsPaymentModalOpen(false);
//           setSelectedInvoice(null);
//         }}
//         invoice={selectedInvoice}
//       />

//       {selectedInvoice && (
//         <ExpenseSheetModal
//           isOpen={isExpenseModalOpen}
//           onClose={() => {
//             setIsExpenseModalOpen(false);
//             setSelectedInvoice(null);
//           }}
//           onSuccess={() => {
//             setIsExpenseModalOpen(false);
//             setSelectedInvoice(null);
//           }}
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
//         onConfirm={(comment) => selectedInvoice && handleReject(selectedInvoice, comment)}
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
// import InvoiceRequestModal from "@/components/BudgeRequestModal";
// import PaymentReleaseModal from "@/components/PaymentReleaseModal";
// import ExpenseSheetModal from "@/components/ExpenseSheetModal";
// import InvoiceDetailsModal from "@/components/BudgeDetailsModal";
// import { InvoiceRequest } from "@shared/schema";
// import { useToast } from "@/hooks/use-toast";
// import RejectionModal from "@/components/RejectionModal";

// function formatPKR(value: number | string | undefined) {
//   if (value === null || value === undefined) return "0.00";
//   const num = typeof value === "number" ? value : parseFloat(String(value).replace(/,/g, "")) || 0;
//   return num.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// }

// function safeNumber(value: any) {
//   const parsed = Number(value);
//   return Number.isFinite(parsed) ? parsed : 0;
// }

// function normalizeText(value: any) {
//   return String(value || "").toLowerCase().trim();
// }

// function formatStatus(status: string) {
//   return String(status || "unknown")
//     .replace(/_/g, " ")
//     .replace(/^pending /, "")
//     .replace(/\b\w/g, (letter) => letter.toUpperCase());
// }

// function getDateFromValue(value: any): Date | null {
//   if (!value) return null;
//   if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
//   if (typeof value?.toDate === "function") {
//     const date = value.toDate();
//     return Number.isNaN(date?.getTime?.()) ? null : date;
//   }
//   if (typeof value?.seconds === "number") {
//     const date = new Date(value.seconds * 1000);
//     return Number.isNaN(date.getTime()) ? null : date;
//   }
//   if (typeof value === "string" || typeof value === "number") {
//     const date = new Date(value);
//     return Number.isNaN(date.getTime()) ? null : date;
//   }
//   return null;
// }

// function getRequestDate(invoice: any): Date | null {
//   return (
//     getDateFromValue(invoice?.createdAt) ||
//     getDateFromValue(invoice?.requestDate) ||
//     getDateFromValue(invoice?.date) ||
//     getDateFromValue(invoice?.updatedAt)
//   );
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

// export default function InvoiceRequests() {
//   const PANEL_ID = "IEDGE-SYSTEM";

//   const { userProfile } = useAuth();
//   const { toast } = useToast();
//   const [, setLocation] = useLocation();

//   const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
//   const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
//   const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
//   const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
//   const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRequest | null>(null);
//   const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
//   const [rejectionLoading, setRejectionLoading] = useState(false);

//   const [searchTerm, setSearchTerm] = useState("");
//   const [typeFilter, setTypeFilter] = useState<"all" | "project" | "general">("all");
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [dateFrom, setDateFrom] = useState("");
//   const [dateTo, setDateTo] = useState("");
//   const [monthFilter, setMonthFilter] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pageSize, setPageSize] = useState(10);

//   const { data: invoices = [], loading } = useFirestoreQuery<InvoiceRequest>(
//     `Panels/${PANEL_ID}/invoiceRequests`
//   );

//   const { data: expenseSheets = [] } = useFirestoreQuery<any>(`Panels/${PANEL_ID}/expenseSheets`);

//   const CREATE_PO_ROUTE = "/create-po";

//   function getRequestType(invoice: any): "general" | "project" {
//     const rawType = String(invoice?.invoiceType || invoice?.type || "").toLowerCase();
//     if (rawType === "project") return "project";
//     if (rawType === "general") return "general";

//     // Fallback for old records where invoiceType was not saved.
//     return invoice?.clientName || invoice?.project || invoice?.projectName || invoice?.projectCode
//       ? "project"
//       : "general";
//   }

//   function isProjectRequest(invoice: any): boolean {
//     return getRequestType(invoice) === "project";
//   }

//   function hasPOAlready(invoice: any): boolean {
//     return Boolean(invoice?.poSubmitted || invoice?.poCreated || invoice?.poId || invoice?.poNumber);
//   }

//   function getExpenseAmount(invoice: any): number {
//     return safeNumber(invoice?.approvedAmount || invoice?.totalAmount || invoice?.amount);
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

//     const expensePoLinks = [expense?.poId, expense?.poNumber, expense?.sourcePOId, expense?.sourcePONumber]
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
//     return Boolean(expenseSheets?.some((expense: any) => isExpenseLinkedToRequest(expense, invoice)));
//   }

//   function canShowExpenseAction(invoice: InvoiceRequest): boolean {
//     if (!userProfile || userProfile.role !== "operation") return false;

//     // General requests become eligible after payment release.
//     if (invoice.status === "payment_released") return true;

//     // Project requests become eligible after the PO is created/submitted.
//     return isProjectRequest(invoice) && hasPOAlready(invoice);
//   }

//   function buildExpenseSource(invoice: InvoiceRequest) {
//     const request: any = invoice;
//     const requestType = getRequestType(request);
//     const projectName = request.projectName || request.project || "";
//     const vendorName = request.vendorName || request.supplierName || getFirstVendorName(request) || request.clientName || "";
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

//     // Fallback for ExpenseSheetModal implementations that auto-prefill from localStorage.
//     localStorage.setItem("submitExpenseFromBudgetRequest", JSON.stringify(expenseSource));
//     localStorage.setItem("expenseSheetSource", JSON.stringify(expenseSource));

//     setSelectedInvoice(expenseSource as any);
//     setIsExpenseModalOpen(true);
//   }

//   function getFirstVendorName(invoice: any): string {
//     const lineItems = Array.isArray(invoice?.lineItems) ? invoice.lineItems : [];
//     const approvedItems = Array.isArray(invoice?.approvalItems) ? invoice.approvalItems : [];
//     const allItems = [...approvedItems, ...lineItems];

//     const matchedItem = allItems.find(
//       (item: any) =>
//         item?.vendor ||
//         item?.vendorName ||
//         item?.supplier ||
//         item?.supplierName ||
//         item?.original?.vendor ||
//         item?.original?.supplier
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

//   function handleCreatePO(invoice: InvoiceRequest) {
//     const request: any = invoice;

//     localStorage.setItem(
//       "createPOFromBudgetRequest",
//       JSON.stringify({
//         invoiceRequestId: request.id,
//         requestId: request.requestId,
//         invoiceType: getRequestType(request),

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
//         supplierName: request.supplierName || request.vendorName || getFirstVendorName(request),
//         vendorName: request.vendorName || request.supplierName || getFirstVendorName(request),

//         totalAmount: Number(request.totalAmount || 0),
//         approvedAmount: Number(request.approvedAmount || request.totalAmount || 0),

//         // Keep all names because the PO page can read approvalItems, lineItems, or items.
//         approvalItems: request.approvalItems || [],
//         lineItems: request.lineItems || [],
//         items: request.items || request.lineItems || [],
//       })
//     );

//     setLocation(CREATE_PO_ROUTE);
//   }

//   async function handleApprove(invoice: InvoiceRequest) {
//     if (!userProfile) return;

//     try {
//       let newStatus = invoice.status;
//       let currentApprover = "";

//       switch (userProfile.role) {
//         case "operational_admin":
//           if (invoice.status === "pending_operational_admin") newStatus = "pending_main_admin";
//           break;
//         case "main_admin":
//           if (invoice.status === "pending_main_admin") newStatus = "pending_finance";
//           break;
//         case "finance":
//         case "financial_admin":
//           if (invoice.status === "pending_finance") newStatus = "approved";
//           break;
//       }

//       await updateDoc(doc(db, "Panels", PANEL_ID, "invoiceRequests", invoice.id), {
//         status: newStatus,
//         currentApprover,
//         approvalHistory: [
//           ...(invoice.approvalHistory || []),
//           {
//             approver: userProfile.displayName,
//             action: "approved",
//             timestamp: new Date(),
//             notes: "",
//           },
//         ],
//         updatedAt: serverTimestamp(),
//       });

//       toast({ title: "Success", description: "Budget request approved successfully" });
//     } catch (error: any) {
//       console.error("Failed to approve budget request:", error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to approve budget request",
//         variant: "destructive",
//       });
//     }
//   }

//   async function handleReject(invoice: InvoiceRequest, rejectionComment: string) {
//     if (!userProfile) return;

//     try {
//       setRejectionLoading(true);

//       await updateDoc(doc(db, "Panels", PANEL_ID, "invoiceRequests", invoice.id), {
//         status: "pending_operational_admin",
//         approvalHistory: [
//           ...(invoice.approvalHistory || []),
//           {
//             approver: userProfile.displayName,
//             action: "rejected",
//             timestamp: new Date(),
//             notes: rejectionComment,
//           },
//         ],
//         updatedAt: serverTimestamp(),
//       });

//       toast({ title: "Success", description: "Budget request rejected with comments" });

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

//   function getStatusBadgeColor(status: string): string {
//     switch (status) {
//       case "approved":
//       case "payment_released":
//         return "border-green-200 bg-green-50 text-green-700";
//       case "rejected":
//         return "border-red-200 bg-red-50 text-red-700";
//       case "pending_operational_admin":
//       case "pending_main_admin":
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
//     const status = invoice.status;

//     if (isProjectRequest(invoice) && hasPOAlready(invoice)) {
//       return "PO Created / Ready for Expense";
//     }

//     switch (status) {
//       case "pending_operational_admin":
//         return "Operational Admin Review";
//       case "pending_main_admin":
//         return "Main Admin Approval";
//       case "pending_finance":
//         return "Finance Approval";
//       case "approved":
//         return isProjectRequest(invoice) ? "Ready for PO" : "Ready for Payment";
//       case "payment_released":
//         return "Payment Released";
//       case "rejected":
//         return "Rejected";
//       default:
//         return "Unknown";
//     }
//   }

//   function canApprove(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;

//     switch (userProfile.role) {
//       case "operational_admin":
//         return invoice.status === "pending_operational_admin";
//       case "main_admin":
//         return invoice.status === "pending_main_admin";
//       case "finance":
//       case "financial_admin":
//         return invoice.status === "pending_finance";
//       default:
//         return false;
//     }
//   }

//   function canEdit(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;
//     return userProfile.role === "operation" && invoice.status === "pending_operational_admin";
//   }

//   function canReleasePayment(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;
//     return (
//       (userProfile.role === "finance" || userProfile.role === "financial_admin") &&
//       invoice.status === "approved" &&
//       !isProjectRequest(invoice)
//     );
//   }

//   function canCreatePO(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;
//     return (
//       (userProfile.role === "finance" || userProfile.role === "financial_admin") &&
//       invoice.status === "approved" &&
//       isProjectRequest(invoice) &&
//       !hasPOAlready(invoice)
//     );
//   }

//   function canSubmitExpense(invoice: InvoiceRequest): boolean {
//     return canShowExpenseAction(invoice) && !hasExpenseSheet(invoice);
//   }

//   function getExpenseSheetStatus(invoice: InvoiceRequest): string | null {
//     if (!expenseSheets) return null;
//     const expenseSheet = expenseSheets.find((expense: any) => isExpenseLinkedToRequest(expense, invoice));
//     return expenseSheet?.status || null;
//   }

//   const canCreateInvoices = userProfile?.role === "operation";

//   const statusOptions = useMemo(() => {
//     const uniqueStatuses = Array.from(new Set((invoices || []).map((invoice) => invoice.status).filter(Boolean)));
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

//       const haystack = normalizeText([
//         invoice.requestId,
//         invoice.title,
//         invoice.subject,
//         invoice.clientName,
//         invoice.projectName,
//         invoice.project,
//         invoice.projectCode,
//         invoice.totalAmount,
//         invoice.approvedAmount,
//         invoice.vendorName,
//         invoice.supplierName,
//       ].join(" "));

//       const matchesSearch = !search || haystack.includes(search);
//       const matchesType = typeFilter === "all" || requestType === typeFilter;
//       const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
//       const matchesMonth = !monthFilter || requestDateInputValue.startsWith(monthFilter);
//       const matchesFrom = !fromDate || (requestDate && requestDate >= fromDate);
//       const matchesTo = !toDate || (requestDate && requestDate <= toDate);

//       return matchesSearch && matchesType && matchesStatus && matchesMonth && matchesFrom && matchesTo;
//     });
//   }, [dateFrom, dateTo, invoices, monthFilter, searchTerm, statusFilter, typeFilter]);

//   const summary = useMemo(() => {
//     const totalAmount = filteredInvoices.reduce((sum, invoice: any) => sum + safeNumber(invoice.totalAmount), 0);
//     const projectCount = filteredInvoices.filter((invoice) => getRequestType(invoice) === "project").length;
//     const generalCount = filteredInvoices.filter((invoice) => getRequestType(invoice) === "general").length;
//     const approvedCount = filteredInvoices.filter((invoice) => invoice.status === "approved").length;

//     return { totalAmount, projectCount, generalCount, approvedCount };
//   }, [filteredInvoices]);

//   const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
//   const startIndex = (currentPage - 1) * pageSize;
//   const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + pageSize);
//   const showingFrom = filteredInvoices.length === 0 ? 0 : startIndex + 1;
//   const showingTo = Math.min(startIndex + pageSize, filteredInvoices.length);

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [searchTerm, typeFilter, statusFilter, dateFrom, dateTo, monthFilter, pageSize]);

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
//             <p className="text-sm font-medium text-slate-500">Finance / Approvals</p>
//             <h2 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950" data-testid="text-invoices-title">
//               Budget Requests
//             </h2>
//             <p className="mt-2 max-w-2xl text-sm text-slate-500">
//               Review project and general budget requests, approve workflow stages, release payments, or create POs.
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
//               <p className="text-sm font-medium text-slate-500">Filtered Requests</p>
//               <p className="mt-3 text-3xl font-semibold text-slate-950">{filteredInvoices.length}</p>
//               <p className="mt-1 text-xs text-slate-400">Total records after filters</p>
//             </CardContent>
//           </Card>

//           <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//             <CardContent className="p-5">
//               <p className="text-sm font-medium text-slate-500">Project Requests</p>
//               <p className="mt-3 text-3xl font-semibold text-slate-950">{summary.projectCount}</p>
//               <p className="mt-1 text-xs text-slate-400">PO flow after approval</p>
//             </CardContent>
//           </Card>

//           <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//             <CardContent className="p-5">
//               <p className="text-sm font-medium text-slate-500">General Requests</p>
//               <p className="mt-3 text-3xl font-semibold text-slate-950">{summary.generalCount}</p>
//               <p className="mt-1 text-xs text-slate-400">Payment release flow</p>
//             </CardContent>
//           </Card>

//           <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//             <CardContent className="p-5">
//               <p className="text-sm font-medium text-slate-500">Filtered Value</p>
//               <p className="mt-3 text-2xl font-semibold text-slate-950">Rs {formatPKR(summary.totalAmount)}</p>
//               <p className="mt-1 text-xs text-slate-400">Approved waiting: {summary.approvedCount}</p>
//             </CardContent>
//           </Card>
//         </div>

//         <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
//           <CardContent className="space-y-4 p-5">
//             <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
//               <div className="xl:col-span-2">
//                 <label className="mb-1 block text-xs font-medium text-slate-500">Search</label>
//                 <input
//                   value={searchTerm}
//                   onChange={(event) => setSearchTerm(event.target.value)}
//                   placeholder="Request ID, client, project, title..."
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">Request Type</label>
//                 <select
//                   value={typeFilter}
//                   onChange={(event) => setTypeFilter(event.target.value as "all" | "project" | "general")}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 >
//                   <option value="all">All Types</option>
//                   <option value="project">Project</option>
//                   <option value="general">General</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
//                 <select
//                   value={statusFilter}
//                   onChange={(event) => setStatusFilter(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 >
//                   <option value="all">All Statuses</option>
//                   {statusOptions.map((status) => (
//                     <option key={status} value={status}>
//                       {formatStatus(status)}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">Month</label>
//                 <input
//                   type="month"
//                   value={monthFilter}
//                   onChange={(event) => setMonthFilter(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">Rows</label>
//                 <select
//                   value={pageSize}
//                   onChange={(event) => setPageSize(Number(event.target.value))}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 >
//                   <option value={5}>5</option>
//                   <option value={10}>10</option>
//                   <option value={20}>20</option>
//                   <option value={50}>50</option>
//                 </select>
//               </div>
//             </div>

//             <div className="grid gap-3 md:grid-cols-3">
//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">From Date</label>
//                 <input
//                   type="date"
//                   value={dateFrom}
//                   onChange={(event) => setDateFrom(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-xs font-medium text-slate-500">To Date</label>
//                 <input
//                   type="date"
//                   value={dateTo}
//                   onChange={(event) => setDateTo(event.target.value)}
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
//                 />
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
//               <table className="w-full min-w-[1100px]">
//                 <thead>
//                   <tr className="border-b border-slate-200 bg-slate-50/80">
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Request ID</th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Client / Title</th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Project</th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Total Amount</th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Current Step</th>
//                     <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
//                   </tr>
//                 </thead>

//                 <tbody className="divide-y divide-slate-100">
//                   {paginatedInvoices.length === 0 ? (
//                     <tr>
//                       <td colSpan={9} className="px-6 py-12 text-center">
//                         <p className="text-sm font-medium text-slate-600">No budget requests found</p>
//                         <p className="mt-1 text-sm text-slate-400">Try changing your filters or create a new request.</p>
//                       </td>
//                     </tr>
//                   ) : (
//                     paginatedInvoices.map((invoice) => {
//                       const type = getRequestType(invoice);
//                       const displayClientOrTitle =
//                         type === "general"
//                           ? (invoice as any).title || (invoice as any).subject || "General Request"
//                           : (invoice as any).clientName || "-";
//                       const projectName =
//                         type === "project"
//                           ? (invoice as any).projectName || (invoice as any).project || (invoice as any).projectCode || "-"
//                           : "-";

//                       return (
//                         <tr key={invoice.id} className="transition hover:bg-slate-50/80">
//                           <td
//                             className="px-5 py-4 text-sm font-semibold text-slate-900"
//                             data-testid={`text-request-id-${invoice.id}`}
//                           >
//                             {invoice.requestId || "-"}
//                           </td>

//                           <td className="px-5 py-4">
//                             <Badge variant="outline" className={`rounded-full px-3 py-1 ${getTypeBadgeColor(type)}`}>
//                               {type === "project" ? "Project" : "General"}
//                             </Badge>
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-700">
//                             <div className="font-medium text-slate-900">{displayClientOrTitle}</div>
//                             {(invoice as any).projectCode && type === "project" && (
//                               <div className="mt-1 text-xs text-slate-400">Code: {(invoice as any).projectCode}</div>
//                             )}
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-600">{projectName}</td>

//                           <td className="px-5 py-4 text-sm text-slate-600">{formatRequestDate(invoice)}</td>

//                           <td className="px-5 py-4 text-sm font-semibold text-slate-900">
//                             Rs {formatPKR(invoice.totalAmount)}
//                           </td>

//                           <td className="px-5 py-4">
//                             <Badge variant="outline" className={`rounded-full px-3 py-1 ${getStatusBadgeColor(invoice.status)}`}>
//                               {formatStatus(invoice.status)}
//                             </Badge>
//                           </td>

//                           <td className="px-5 py-4 text-sm text-slate-500">{getCurrentStep(invoice)}</td>

//                           <td className="px-5 py-4">
//                             <div className="flex flex-wrap gap-2">
//                               <Button
//                                 variant="outline"
//                                 size="sm"
//                                 className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
//                                 onClick={() => {
//                                   setSelectedInvoice(invoice);
//                                   setIsDetailsModalOpen(true);
//                                 }}
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
//                                     setSelectedInvoice(invoice);
//                                     setIsInvoiceModalOpen(true);
//                                   }}
//                                   data-testid={`button-edit-${invoice.id}`}
//                                 >
//                                   Edit
//                                 </Button>
//                               )}

//                               {canApprove(invoice) && (
//                                 <>
//                                   <Button
//                                     variant="outline"
//                                     size="sm"
//                                     className="rounded-xl border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
//                                     onClick={() => handleApprove(invoice)}
//                                     data-testid={`button-approve-${invoice.id}`}
//                                   >
//                                     Approve
//                                   </Button>

//                                   <Button
//                                     variant="outline"
//                                     size="sm"
//                                     className="rounded-xl border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
//                                     onClick={() => {
//                                       setSelectedInvoice(invoice);
//                                       setIsRejectionModalOpen(true);
//                                     }}
//                                     data-testid={`button-reject-${invoice.id}`}
//                                   >
//                                     Reject
//                                   </Button>
//                                 </>
//                               )}

//                               {canReleasePayment(invoice) && (
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   className="rounded-xl border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
//                                   onClick={() => {
//                                     setSelectedInvoice({
//                                       ...invoice,
//                                       invoiceNumber: invoice.requestId,
//                                       vendorName: (invoice as any).vendorName || (invoice as any).supplierName || (invoice as any).clientName,
//                                       amount: (invoice as any).approvedAmount || invoice.totalAmount,
//                                       dueDate: new Date(),
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
//                                       {getExpenseSheetStatus(invoice) === "acknowledged"
//                                         ? "Expense Sheet Acknowledged"
//                                         : getExpenseSheetStatus(invoice) === "rejected"
//                                         ? "Expense Sheet Rejected"
//                                         : "Waiting for Admin Approval"}
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
//                 Showing <span className="font-medium text-slate-700">{showingFrom}</span> to{" "}
//                 <span className="font-medium text-slate-700">{showingTo}</span> of{" "}
//                 <span className="font-medium text-slate-700">{filteredInvoices.length}</span> requests
//               </p>

//               <div className="flex items-center gap-2">
//                 <Button
//                   type="button"
//                   variant="outline"
//                   size="sm"
//                   className="rounded-xl border-slate-200"
//                   disabled={currentPage === 1}
//                   onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
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
//                   onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
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
//         onSuccess={() => {
//           setIsPaymentModalOpen(false);
//           setSelectedInvoice(null);
//         }}
//         invoice={selectedInvoice}
//       />

//       {selectedInvoice && (
//         <ExpenseSheetModal
//           isOpen={isExpenseModalOpen}
//           onClose={() => {
//             setIsExpenseModalOpen(false);
//             setSelectedInvoice(null);
//           }}
//           onSuccess={() => {
//             setIsExpenseModalOpen(false);
//             setSelectedInvoice(null);
//           }}
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
//         onConfirm={(comment) => selectedInvoice && handleReject(selectedInvoice, comment)}
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

function formatPKR(value: number | string | undefined) {
  if (value === null || value === undefined) return "0.00";
  const num = typeof value === "number" ? value : parseFloat(String(value).replace(/,/g, "")) || 0;
  return num.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function safeNumber(value: any) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeText(value: any) {
  return String(value || "").toLowerCase().trim();
}

function formatStatus(status: string) {
  return String(status || "unknown")
    .replace(/_/g, " ")
    .replace(/^pending /, "")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getDateFromValue(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value?.toDate === "function") {
    const date = value.toDate();
    return Number.isNaN(date?.getTime?.()) ? null : date;
  }
  if (typeof value?.seconds === "number") {
    const date = new Date(value.seconds * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function getRequestDate(invoice: any): Date | null {
  return (
    getDateFromValue(invoice?.createdAt) ||
    getDateFromValue(invoice?.requestDate) ||
    getDateFromValue(invoice?.date) ||
    getDateFromValue(invoice?.updatedAt)
  );
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

export default function InvoiceRequests() {
  const PANEL_ID = "IEDGE-SYSTEM";

  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRequest | null>(null);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionLoading, setRejectionLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "project" | "general">("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: invoices = [], loading } = useFirestoreQuery<InvoiceRequest>(
    `Panels/${PANEL_ID}/invoiceRequests`
  );

  const { data: expenseSheets = [] } = useFirestoreQuery<any>(`Panels/${PANEL_ID}/expenseSheets`);

  const CREATE_PO_ROUTE = "/create-po";

  function getRequestType(invoice: any): "general" | "project" {
    const rawType = String(invoice?.invoiceType || invoice?.type || "").toLowerCase();
    if (rawType === "project") return "project";
    if (rawType === "general") return "general";

    // Fallback for old records where invoiceType was not saved.
    return invoice?.clientName || invoice?.project || invoice?.projectName || invoice?.projectCode
      ? "project"
      : "general";
  }

  function isProjectRequest(invoice: any): boolean {
    return getRequestType(invoice) === "project";
  }

  function hasPOAlready(invoice: any): boolean {
    return Boolean(invoice?.poSubmitted || invoice?.poCreated || invoice?.poId || invoice?.poNumber);
  }

  function getExpenseAmount(invoice: any): number {
    return safeNumber(invoice?.approvedAmount || invoice?.totalAmount || invoice?.amount);
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

    const expensePoLinks = [expense?.poId, expense?.poNumber, expense?.sourcePOId, expense?.sourcePONumber]
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
    return Boolean(expenseSheets?.some((expense: any) => isExpenseLinkedToRequest(expense, invoice)));
  }

  function canShowExpenseAction(invoice: InvoiceRequest): boolean {
    if (!userProfile || userProfile.role !== "operation") return false;

    // After expense submission, keep the final status visible instead of reopening approvals.
    if ((invoice as any).expenseSubmitted || String(invoice.status) === "expense_submitted") return true;

    // General requests become eligible after payment release.
    if (invoice.status === "payment_released") return true;

    // Project requests become eligible after the PO is created/submitted.
    return isProjectRequest(invoice) && hasPOAlready(invoice);
  }

  function buildExpenseSource(invoice: InvoiceRequest) {
    const request: any = invoice;
    const requestType = getRequestType(request);
    const projectName = request.projectName || request.project || "";
    const vendorName = request.vendorName || request.supplierName || getFirstVendorName(request) || request.clientName || "";
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
      autoApprovedReason: "Created from approved budget request. No further approval required.",
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

    // Fallback for ExpenseSheetModal implementations that auto-prefill from localStorage.
    // These flags make the submitted expense final and stop any admin-approval workflow.
    localStorage.setItem("submitExpenseFromBudgetRequest", JSON.stringify(expenseSource));
    localStorage.setItem("expenseSheetSource", JSON.stringify(expenseSource));

    setSelectedInvoice(expenseSource as any);
    setIsExpenseModalOpen(true);
  }

  async function handleExpenseSubmitted() {
    const request: any = selectedInvoice;

    try {
      if (request?.id) {
        await updateDoc(doc(db, "Panels", PANEL_ID, "invoiceRequests", request.id), {
          status: "expense_submitted",
          expenseSubmitted: true,
          expenseStatus: "submitted",
          expenseApprovalRequired: false,
          expenseRequiresApproval: false,
          expenseSubmittedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      toast({
        title: "Expense submitted",
        description: "Expense submitted successfully. No further approval is required.",
      });
    } catch (error: any) {
      console.error("Failed to mark expense as submitted:", error);
      toast({
        title: "Expense submitted",
        description: "Expense was submitted, but the request status could not be updated.",
      });
    } finally {
      setIsExpenseModalOpen(false);
      setSelectedInvoice(null);
      localStorage.removeItem("submitExpenseFromBudgetRequest");
      localStorage.removeItem("expenseSheetSource");
    }
  }

  function getFirstVendorName(invoice: any): string {
    const lineItems = Array.isArray(invoice?.lineItems) ? invoice.lineItems : [];
    const approvedItems = Array.isArray(invoice?.approvalItems) ? invoice.approvalItems : [];
    const allItems = [...approvedItems, ...lineItems];

    const matchedItem = allItems.find(
      (item: any) =>
        item?.vendor ||
        item?.vendorName ||
        item?.supplier ||
        item?.supplierName ||
        item?.original?.vendor ||
        item?.original?.supplier
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

  function handleCreatePO(invoice: InvoiceRequest) {
    const request: any = invoice;

    localStorage.setItem(
      "createPOFromBudgetRequest",
      JSON.stringify({
        invoiceRequestId: request.id,
        requestId: request.requestId,
        invoiceType: getRequestType(request),

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
        supplierName: request.supplierName || request.vendorName || getFirstVendorName(request),
        vendorName: request.vendorName || request.supplierName || getFirstVendorName(request),

        totalAmount: Number(request.totalAmount || 0),
        approvedAmount: Number(request.approvedAmount || request.totalAmount || 0),

        // Keep all names because the PO page can read approvalItems, lineItems, or items.
        approvalItems: request.approvalItems || [],
        lineItems: request.lineItems || [],
        items: request.items || request.lineItems || [],
      })
    );

    setLocation(CREATE_PO_ROUTE);
  }

  async function handleApprove(invoice: InvoiceRequest) {
    if (!userProfile) return;

    try {
      let newStatus = invoice.status;
      let currentApprover = "";

      switch (userProfile.role) {
        case "operational_admin":
          if (invoice.status === "pending_operational_admin") newStatus = "pending_main_admin";
          break;
        case "main_admin":
          if (invoice.status === "pending_main_admin") newStatus = "pending_finance";
          break;
        case "finance":
        case "financial_admin":
          if (invoice.status === "pending_finance") newStatus = "approved";
          break;
      }

      await updateDoc(doc(db, "Panels", PANEL_ID, "invoiceRequests", invoice.id), {
        status: newStatus,
        currentApprover,
        approvalHistory: [
          ...(invoice.approvalHistory || []),
          {
            approver: userProfile.displayName,
            action: "approved",
            timestamp: new Date(),
            notes: "",
          },
        ],
        updatedAt: serverTimestamp(),
      });

      toast({ title: "Success", description: "Budget request approved successfully" });
    } catch (error: any) {
      console.error("Failed to approve budget request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve budget request",
        variant: "destructive",
      });
    }
  }

  async function handleReject(invoice: InvoiceRequest, rejectionComment: string) {
    if (!userProfile) return;

    try {
      setRejectionLoading(true);

      await updateDoc(doc(db, "Panels", PANEL_ID, "invoiceRequests", invoice.id), {
        status: "pending_operational_admin",
        approvalHistory: [
          ...(invoice.approvalHistory || []),
          {
            approver: userProfile.displayName,
            action: "rejected",
            timestamp: new Date(),
            notes: rejectionComment,
          },
        ],
        updatedAt: serverTimestamp(),
      });

      toast({ title: "Success", description: "Budget request rejected with comments" });

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

  function getStatusBadgeColor(status: string): string {
    switch (status) {
      case "approved":
      case "payment_released":
      case "expense_submitted":
      case "expense_completed":
        return "border-green-200 bg-green-50 text-green-700";
      case "rejected":
        return "border-red-200 bg-red-50 text-red-700";
      case "pending_operational_admin":
      case "pending_main_admin":
      case "pending_finance":
        return "border-amber-200 bg-amber-50 text-amber-700";
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
    const status = String(invoice.status || "");

    if ((invoice as any).expenseSubmitted || status === "expense_submitted" || hasExpenseSheet(invoice)) {
      return "Expense Submitted / No Approval Required";
    }

    if (isProjectRequest(invoice) && hasPOAlready(invoice)) {
      return "PO Created / Ready for Expense";
    }

    switch (status) {
      case "pending_operational_admin":
        return "Operational Admin Review";
      case "pending_main_admin":
        return "Main Admin Approval";
      case "pending_finance":
        return "Finance Approval";
      case "approved":
        return isProjectRequest(invoice) ? "Ready for PO" : "Ready for Payment";
      case "payment_released":
        return "Payment Released";
      case "expense_submitted":
      case "expense_completed":
        return "Expense Submitted / No Approval Required";
      case "rejected":
        return "Rejected";
      default:
        return "Unknown";
    }
  }

  function canApprove(invoice: InvoiceRequest): boolean {
    if (!userProfile) return false;

    switch (userProfile.role) {
      case "operational_admin":
        return invoice.status === "pending_operational_admin";
      case "main_admin":
        return invoice.status === "pending_main_admin";
      case "finance":
      case "financial_admin":
        return invoice.status === "pending_finance";
      default:
        return false;
    }
  }

  function canEdit(invoice: InvoiceRequest): boolean {
    if (!userProfile) return false;
    return userProfile.role === "operation" && invoice.status === "pending_operational_admin";
  }

  function canReleasePayment(invoice: InvoiceRequest): boolean {
    if (!userProfile) return false;
    return (
      (userProfile.role === "finance" || userProfile.role === "financial_admin") &&
      invoice.status === "approved" &&
      !isProjectRequest(invoice)
    );
  }

  function canCreatePO(invoice: InvoiceRequest): boolean {
    if (!userProfile) return false;
    return (
      (userProfile.role === "finance" || userProfile.role === "financial_admin") &&
      invoice.status === "approved" &&
      isProjectRequest(invoice) &&
      !hasPOAlready(invoice)
    );
  }

  function canSubmitExpense(invoice: InvoiceRequest): boolean {
    if ((invoice as any).expenseSubmitted || String(invoice.status) === "expense_submitted") return false;
    return canShowExpenseAction(invoice) && !hasExpenseSheet(invoice);
  }

  function getExpenseSheetStatus(invoice: InvoiceRequest): string | null {
    if ((invoice as any).expenseSubmitted || String(invoice.status) === "expense_submitted") return "submitted";
    if (!expenseSheets) return null;
    const expenseSheet = expenseSheets.find((expense: any) => isExpenseLinkedToRequest(expense, invoice));
    return expenseSheet?.status || expenseSheet?.expenseStatus || null;
  }

  const canCreateInvoices = userProfile?.role === "operation";

  const statusOptions = useMemo(() => {
    const uniqueStatuses = Array.from(new Set((invoices || []).map((invoice) => invoice.status).filter(Boolean)));
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

      const haystack = normalizeText([
        invoice.requestId,
        invoice.title,
        invoice.subject,
        invoice.clientName,
        invoice.projectName,
        invoice.project,
        invoice.projectCode,
        invoice.totalAmount,
        invoice.approvedAmount,
        invoice.vendorName,
        invoice.supplierName,
      ].join(" "));

      const matchesSearch = !search || haystack.includes(search);
      const matchesType = typeFilter === "all" || requestType === typeFilter;
      const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
      const matchesMonth = !monthFilter || requestDateInputValue.startsWith(monthFilter);
      const matchesFrom = !fromDate || (requestDate && requestDate >= fromDate);
      const matchesTo = !toDate || (requestDate && requestDate <= toDate);

      return matchesSearch && matchesType && matchesStatus && matchesMonth && matchesFrom && matchesTo;
    });
  }, [dateFrom, dateTo, invoices, monthFilter, searchTerm, statusFilter, typeFilter]);

  const summary = useMemo(() => {
    const totalAmount = filteredInvoices.reduce((sum, invoice: any) => sum + safeNumber(invoice.totalAmount), 0);
    const projectCount = filteredInvoices.filter((invoice) => getRequestType(invoice) === "project").length;
    const generalCount = filteredInvoices.filter((invoice) => getRequestType(invoice) === "general").length;
    const approvedCount = filteredInvoices.filter((invoice) => invoice.status === "approved").length;

    return { totalAmount, projectCount, generalCount, approvedCount };
  }, [filteredInvoices]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + pageSize);
  const showingFrom = filteredInvoices.length === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + pageSize, filteredInvoices.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter, dateFrom, dateTo, monthFilter, pageSize]);

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
            {/* <p className="text-sm font-medium text-slate-500">Finance / Approvals</p> */}
            {/* <h2 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950" data-testid="text-invoices-title">
              Budget Requests
            </h2> */}
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Review project and general budget requests, approve workflow stages, release payments, or create POs.
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
              <p className="text-sm font-medium text-slate-500">Filtered Requests</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{filteredInvoices.length}</p>
              <p className="mt-1 text-xs text-slate-400">Total records after filters</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-medium text-slate-500">Project Requests</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{summary.projectCount}</p>
              <p className="mt-1 text-xs text-slate-400">PO flow after approval</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-medium text-slate-500">General Requests</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{summary.generalCount}</p>
              <p className="mt-1 text-xs text-slate-400">Payment release flow</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-medium text-slate-500">Filtered Value</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">Rs {formatPKR(summary.totalAmount)}</p>
              <p className="mt-1 text-xs text-slate-400">Approved waiting: {summary.approvedCount}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
          <CardContent className="space-y-4 p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <div className="xl:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-500">Search</label>
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Request ID, client, project, title..."
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Request Type</label>
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value as "all" | "project" | "general")}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="all">All Types</option>
                  <option value="project">Project</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="all">All Statuses</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Month</label>
                <input
                  type="month"
                  value={monthFilter}
                  onChange={(event) => setMonthFilter(event.target.value)}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Rows</label>
                <select
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
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
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Request ID</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Client / Title</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Project</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Total Amount</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Current Step</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center">
                        <p className="text-sm font-medium text-slate-600">No budget requests found</p>
                        <p className="mt-1 text-sm text-slate-400">Try changing your filters or create a new request.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedInvoices.map((invoice) => {
                      const type = getRequestType(invoice);
                      const displayClientOrTitle =
                        type === "general"
                          ? (invoice as any).title || (invoice as any).subject || "General Request"
                          : (invoice as any).clientName || "-";
                      const projectName =
                        type === "project"
                          ? (invoice as any).projectName || (invoice as any).project || (invoice as any).projectCode || "-"
                          : "-";

                      return (
                        <tr key={invoice.id} className="transition hover:bg-slate-50/80">
                          <td
                            className="px-5 py-4 text-sm font-semibold text-slate-900"
                            data-testid={`text-request-id-${invoice.id}`}
                          >
                            {invoice.requestId || "-"}
                          </td>

                          <td className="px-5 py-4">
                            <Badge variant="outline" className={`rounded-full px-3 py-1 ${getTypeBadgeColor(type)}`}>
                              {type === "project" ? "Project" : "General"}
                            </Badge>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            <div className="font-medium text-slate-900">{displayClientOrTitle}</div>
                            {(invoice as any).projectCode && type === "project" && (
                              <div className="mt-1 text-xs text-slate-400">Code: {(invoice as any).projectCode}</div>
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">{projectName}</td>

                          <td className="px-5 py-4 text-sm text-slate-600">{formatRequestDate(invoice)}</td>

                          <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                            Rs {formatPKR(invoice.totalAmount)}
                          </td>

                          <td className="px-5 py-4">
                            <Badge variant="outline" className={`rounded-full px-3 py-1 ${getStatusBadgeColor(invoice.status)}`}>
                              {formatStatus(invoice.status)}
                            </Badge>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">{getCurrentStep(invoice)}</td>

                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                onClick={() => {
                                  setSelectedInvoice(invoice);
                                  setIsDetailsModalOpen(true);
                                }}
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
                                    setSelectedInvoice(invoice);
                                    setIsInvoiceModalOpen(true);
                                  }}
                                  data-testid={`button-edit-${invoice.id}`}
                                >
                                  Edit
                                </Button>
                              )}

                              {canApprove(invoice) && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                                    onClick={() => handleApprove(invoice)}
                                    data-testid={`button-approve-${invoice.id}`}
                                  >
                                    Approve
                                  </Button>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                    onClick={() => {
                                      setSelectedInvoice(invoice);
                                      setIsRejectionModalOpen(true);
                                    }}
                                    data-testid={`button-reject-${invoice.id}`}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}

                              {canReleasePayment(invoice) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-xl border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                  onClick={() => {
                                    setSelectedInvoice({
                                      ...invoice,
                                      invoiceNumber: invoice.requestId,
                                      vendorName: (invoice as any).vendorName || (invoice as any).supplierName || (invoice as any).clientName,
                                      amount: (invoice as any).approvedAmount || invoice.totalAmount,
                                      dueDate: new Date(),
                                    } as any);
                                    setIsPaymentModalOpen(true);
                                  }}
                                  data-testid={`button-release-payment-${invoice.id}`}
                                >
                                  Release Payment
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
                                      {getExpenseSheetStatus(invoice) === "rejected"
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
                Showing <span className="font-medium text-slate-700">{showingFrom}</span> to{" "}
                <span className="font-medium text-slate-700">{showingTo}</span> of{" "}
                <span className="font-medium text-slate-700">{filteredInvoices.length}</span> requests
              </p>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-slate-200"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
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
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
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
        onSuccess={() => {
          setIsPaymentModalOpen(false);
          setSelectedInvoice(null);
        }}
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

      <RejectionModal
        isOpen={isRejectionModalOpen}
        onClose={() => {
          setIsRejectionModalOpen(false);
          setSelectedInvoice(null);
        }}
        onConfirm={(comment) => selectedInvoice && handleReject(selectedInvoice, comment)}
        itemType="invoice request"
        loading={rejectionLoading}
      />
    </div>
  );
}
