// import { useEffect, useMemo, useState } from "react";
// import { collection, getDocs } from "firebase/firestore";
// import {
//   Building2,
//   FileText,
//   Paperclip,
//   Printer,
//   Search,
//   SlidersHorizontal,
//   Download,
//   Users,
//   Wallet,
// } from "lucide-react";
// import { useFirestoreQuery } from "@/hooks/useFirestore";
// import { db } from "@/lib/firebase";
// import { Badge } from "@/components/ui/badge";
// import { InvoiceRequest } from "@shared/schema";

// type RequestType = "General" | "Project";
// type TypeFilter = "all" | "general" | "project";
// type DatePreset = "last12" | "last30" | "thisMonth" | "all";

// type RecordItem = {
//   category?: string;
//   amount?: number | string;
//   name?: string;
//   description?: string;
// };

// type FirestoreRecordData = {
//   id: string;
//   accountId?: string;
//   accountType?: "cheque" | "online";
//   accountTitle?: string;
//   accountNo?: string;
//   bank?: string;
//   branch?: string;
//   city?: string;
//   platform?: string;
//   routingNumber?: string;
//   chequeNumber?: string;
//   chequeAmount?: number | string;
//   totalItemAmount?: number | string;
//   remainingBalance?: number | string;
//   items?: RecordItem[];
//   createdBy?: string;
//   createdByName?: string;
//   createdAt?: any;
//   updatedAt?: any;
//   status?: string;
// };

// type FirestoreSupplierData = {
//   id: string;
//   name: string;
//   openingBalance?: number | string;
//   contactPerson?: string;
//   email?: string;
//   phone?: string;
//   address?: string;
//   city?: string;
//   country?: string;
//   ntn?: string;
//   paymentTerms?: string;
//   status?: string;
//   notes?: string;
// };

// type VendorTransaction = {
//   id: string;
//   requestId: string;
//   vendorName: string;
//   projectName: string;
//   requestType: RequestType;
//   type: string;
//   purpose: string;
//   billNo: string;
//   chequeNumber: string;
//   paidAmount: number;
//   totalRequestAmount: number;
//   salesTax: number;
//   totalBeforeTax: number;
//   remainingBalance: number;
//   paymentDate: Date | null;
//   requestDate: Date | null;
//   paymentStatus: string;
//   company: string;
//   billingAddress: string;
//   achInfo: string;
//   notes: string;
// };

// type VendorSummaryItem = {
//   vendorName: string;
//   paidAmount: number;
//   openingBalance: number;
//   openBalance: number;
//   overduePayment: number;
//   transactionCount: number;
//   company: string;
//   billingAddress: string;
//   achInfo: string;
//   notes: string;
// };

// function safeNumber(value: any) {
//   if (value === null || value === undefined || value === "") return 0;

//   const parsed =
//     typeof value === "string" ? Number(value.replace(/,/g, "")) : Number(value);

//   return Number.isFinite(parsed) ? parsed : 0;
// }

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

// function formatCurrency(value: number | string | undefined) {
//   return `PKR ${formatPKR(value)}`;
// }

// function escapeHtml(value: unknown): string {
//   return String(value ?? "-")
//     .replace(/&/g, "&amp;")
//     .replace(/</g, "&lt;")
//     .replace(/>/g, "&gt;")
//     .replace(/"/g, "&quot;")
//     .replace(/'/g, "&#039;");
// }

// function escapeCsvValue(value: unknown): string {
//   const text = String(value ?? "");
//   const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
//   return `"${safeText.replace(/"/g, '""')}"`;
// }

// function sanitizeFileName(value: string): string {
//   return (
//     value
//       .trim()
//       .replace(/[^a-zA-Z0-9-_]+/g, "-")
//       .replace(/^-+|-+$/g, "") || "vendor"
//   );
// }

// function normalizeText(value: any) {
//   return String(value || "")
//     .toLowerCase()
//     .trim();
// }

// function normalizeVendorKey(value: any) {
//   return normalizeText(value).replace(/\s+/g, " ");
// }

// function getFirstTextValue(values: any[]): string {
//   for (const value of values) {
//     const text = String(value || "").trim();
//     if (text) return text;
//   }

//   return "";
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

// function formatDate(value: any) {
//   const date = getDateFromValue(value);
//   if (!date) return "-";

//   return date.toLocaleDateString("en-PK", {
//     day: "2-digit",
//     month: "2-digit",
//     year: "numeric",
//   });
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

// function getPaymentDate(invoice: any): Date | null {
//   return (
//     getDateFromValue(invoice?.paymentReleasedAt) ||
//     getDateFromValue(invoice?.releasePaymentAt) ||
//     getDateFromValue(invoice?.paymentDate) ||
//     getDateFromValue(invoice?.paidAt) ||
//     getDateFromValue(invoice?.paymentDetails?.paymentDate) ||
//     getDateFromValue(invoice?.paymentDetails?.paidAt) ||
//     getDateFromValue(invoice?.paymentDetails?.releasedAt) ||
//     getDateFromValue(invoice?.releasePayment?.paymentDate) ||
//     getDateFromValue(invoice?.releasePayment?.paidAt) ||
//     getDateFromValue(invoice?.releasePayment?.releasedAt) ||
//     null
//   );
// }

// function getDueDate(invoice: any): Date | null {
//   return (
//     getDateFromValue(invoice?.dueDate) ||
//     getDateFromValue(invoice?.paymentDueDate) ||
//     getDateFromValue(invoice?.invoiceDueDate) ||
//     null
//   );
// }

// function hasPaymentReleased(invoice: any): boolean {
//   const status = normalizeText(invoice?.status);
//   const paymentStatus = normalizeText(
//     invoice?.paymentStatus || invoice?.releasePaymentStatus,
//   );

//   return Boolean(
//     status === "payment_released" ||
//     paymentStatus === "released" ||
//     paymentStatus === "payment_released" ||
//     invoice?.paymentReleased ||
//     invoice?.releasePaymentCreated ||
//     invoice?.paymentReleaseId ||
//     invoice?.paymentId ||
//     invoice?.paymentReleasedAt ||
//     invoice?.releasePaymentAt ||
//     invoice?.paymentDetails?.releasedAt,
//   );
// }

// function getRequestType(invoice: any): RequestType {
//   const rawType = normalizeText(invoice?.invoiceType || invoice?.type);

//   if (rawType === "project") return "Project";
//   if (rawType === "general") return "General";

//   const hasProjectFields = Boolean(
//     invoice?.projectName ||
//     invoice?.project ||
//     invoice?.projectCode ||
//     invoice?.clientName,
//   );

//   return hasProjectFields ? "Project" : "General";
// }

// function getInvoiceVendorName(invoice: any): string {
//   return getFirstTextValue([
//     invoice?.vendorName,
//     invoice?.supplierName,
//     invoice?.payeeName,
//     invoice?.payee,
//     invoice?.paymentDetails?.vendor,
//     invoice?.releasePayment?.vendor,
//     invoice?.clientName,
//   ]);
// }

// function getItemVendorName(item: any): string {
//   return getFirstTextValue([
//     item?.vendor,
//     item?.vendorName,
//     item?.supplier,
//     item?.supplierName,
//     item?.payee,
//     item?.payeeName,
//     item?.original?.vendor,
//     item?.original?.vendorName,
//     item?.original?.supplier,
//     item?.original?.supplierName,
//   ]);
// }

// function getProjectName(invoice: any): string {
//   const requestType = getRequestType(invoice);

//   if (requestType === "General") return "-";

//   return (
//     getFirstTextValue([
//       invoice?.projectName,
//       invoice?.project,
//       invoice?.projectCode,
//       invoice?.title,
//       invoice?.subject,
//     ]) || "-"
//   );
// }

// function getBillNumber(invoice: any): string {
//   return getFirstTextValue([
//     invoice?.paymentNumber,
//     invoice?.paymentNo,
//     invoice?.paymentReference,
//     invoice?.reference,
//     invoice?.chequeNumber,
//     invoice?.checkNumber,
//     invoice?.requestId,
//   ]);
// }

// function getChequeNumber(invoice: any): string {
//   return getFirstTextValue([
//     invoice?.chequeNumber,
//     invoice?.checkNumber,
//     invoice?.chequeNo,
//     invoice?.checkNo,
//     invoice?.paymentChequeNumber,
//     invoice?.paymentCheckNumber,
//     invoice?.reference,
//     invoice?.paymentReference,
//     invoice?.transactionReference,
//     invoice?.releasePayment?.chequeNumber,
//     invoice?.releasePayment?.checkNumber,
//     invoice?.releasePayment?.chequeNo,
//     invoice?.releasePayment?.checkNo,
//     invoice?.releasePayment?.reference,
//     invoice?.releasePayment?.transactionReference,
//     invoice?.paymentDetails?.chequeNumber,
//     invoice?.paymentDetails?.checkNumber,
//     invoice?.paymentDetails?.chequeNo,
//     invoice?.paymentDetails?.checkNo,
//     invoice?.paymentDetails?.reference,
//     invoice?.paymentDetails?.transactionReference,
//   ]);
// }

// function getTotalRequestAmount(invoice: any): number {
//   return safeNumber(
//     invoice?.approvedAmount || invoice?.totalAmount || invoice?.amount,
//   );
// }

// function getExplicitPaidAmount(invoice: any): number {
//   const paymentDetails = invoice?.paymentDetails || {};
//   const releasePayment = invoice?.releasePayment || {};

//   return safeNumber(
//     invoice?.paidAmount ||
//       invoice?.paymentAmount ||
//       invoice?.releasedAmount ||
//       invoice?.releasePaymentAmount ||
//       invoice?.amountPaid ||
//       paymentDetails?.paidAmount ||
//       paymentDetails?.amount ||
//       paymentDetails?.releasedAmount ||
//       releasePayment?.paidAmount ||
//       releasePayment?.amount ||
//       releasePayment?.releasedAmount,
//   );
// }

// function getRequestPaidAmount(invoice: any): number {
//   const explicitPaidAmount = getExplicitPaidAmount(invoice);
//   if (explicitPaidAmount > 0) return explicitPaidAmount;

//   return hasPaymentReleased(invoice) ? getTotalRequestAmount(invoice) : 0;
// }

// function getSourceItems(invoice: any): any[] {
//   const approvalItems = Array.isArray(invoice?.approvalItems)
//     ? invoice.approvalItems
//     : [];

//   const lineItems = Array.isArray(invoice?.lineItems) ? invoice.lineItems : [];

//   if (approvalItems.length > 0) return approvalItems;
//   return lineItems;
// }

// function getItemAmount(item: any): number {
//   const directAmount = safeNumber(
//     item?.approvedAmount ||
//       item?.totalAmount ||
//       item?.amount ||
//       item?.netAmount ||
//       item?.grossAmount ||
//       item?.total ||
//       item?.price,
//   );

//   if (directAmount > 0) return directAmount;

//   const quantity = safeNumber(item?.quantity || item?.qty || item?.units);
//   const rate = safeNumber(item?.rate || item?.unitPrice || item?.unitRate);

//   if (quantity > 0 && rate > 0) return quantity * rate;

//   return 0;
// }

// function getItemSalesTax(item: any, invoice: any): number {
//   return safeNumber(
//     item?.salesTax ||
//       item?.tax ||
//       item?.taxAmount ||
//       item?.sst ||
//       item?.gst ||
//       item?.sales_tax ||
//       invoice?.salesTax ||
//       invoice?.taxAmount ||
//       invoice?.sst ||
//       invoice?.gst,
//   );
// }

// function getPaymentStatus(
//   invoice: any,
//   paidAmount: number,
//   remainingBalance: number,
// ) {
//   const status = normalizeText(invoice?.status);
//   const paymentStatus = normalizeText(
//     invoice?.paymentStatus || invoice?.releasePaymentStatus,
//   );

//   if (paidAmount > 0 && remainingBalance <= 0) return "Paid";
//   if (paidAmount > 0 && remainingBalance > 0) return "Partially Paid";

//   if (
//     paymentStatus === "pending" ||
//     status === "approved" ||
//     status === "ready_for_payment" ||
//     status === "po_created" ||
//     status === "po_submitted" ||
//     status === "po_approved" ||
//     status === "po_issued" ||
//     status === "pending_finance"
//   ) {
//     return "Pending";
//   }

//   return "Unpaid";
// }

// function getStatusBadgeClass(status: string) {
//   const normalized = normalizeText(status);

//   if (normalized === "paid") {
//     return "border-emerald-200 bg-emerald-50 text-emerald-700";
//   }

//   if (normalized === "partially paid") {
//     return "border-blue-200 bg-blue-50 text-blue-700";
//   }

//   if (normalized === "pending") {
//     return "border-amber-200 bg-amber-50 text-amber-700";
//   }

//   return "border-slate-200 bg-slate-50 text-slate-600";
// }

// function getTypeBadgeClass(type: RequestType) {
//   return type === "Project"
//     ? "border-indigo-200 bg-indigo-50 text-indigo-700"
//     : "border-slate-200 bg-slate-50 text-slate-700";
// }

// function getVendorMeta(invoice: any) {
//   return {
//     company: getFirstTextValue([
//       invoice?.company,
//       invoice?.companyName,
//       invoice?.vendorCompany,
//       invoice?.supplierCompany,
//     ]),
//     billingAddress: getFirstTextValue([
//       invoice?.billingAddress,
//       invoice?.vendorAddress,
//       invoice?.supplierAddress,
//       invoice?.address,
//     ]),
//     achInfo: getFirstTextValue([
//       invoice?.billPayAchInfo,
//       invoice?.billPayACHInfo,
//       invoice?.achInfo,
//       invoice?.bankInfo,
//       invoice?.accountInfo,
//       invoice?.paymentDetails?.selectedAccount?.accountName,
//     ]),
//     notes: getFirstTextValue([
//       invoice?.notes,
//       invoice?.remarks,
//       invoice?.description,
//       invoice?.message,
//       invoice?.paymentDetails?.paymentNotes,
//     ]),
//   };
// }

// function getPaymentPurpose(invoice: any, item?: any): string {
//   const itemPurpose = getFirstTextValue([
//     item?.purpose,
//     item?.paymentPurpose,
//     item?.description,
//     item?.itemDescription,
//     item?.particulars,
//     item?.details,
//     item?.title,
//     item?.itemName,
//     item?.name,
//     item?.category,
//     item?.reason,
//     item?.remarks,
//     item?.notes,
//     item?.original?.purpose,
//     item?.original?.paymentPurpose,
//     item?.original?.description,
//     item?.original?.particulars,
//     item?.original?.details,
//     item?.original?.title,
//     item?.original?.category,
//   ]);

//   if (itemPurpose) return itemPurpose;

//   const invoicePurpose = getFirstTextValue([
//     invoice?.paymentPurpose,
//     invoice?.purpose,
//     invoice?.description,
//     invoice?.requestDescription,
//     invoice?.title,
//     invoice?.subject,
//     invoice?.reason,
//     invoice?.particulars,
//     invoice?.remarks,
//     invoice?.notes,
//     invoice?.message,
//     invoice?.paymentDetails?.purpose,
//     invoice?.paymentDetails?.paymentPurpose,
//     invoice?.paymentDetails?.paymentNotes,
//     invoice?.releasePayment?.purpose,
//     invoice?.releasePayment?.paymentPurpose,
//     invoice?.releasePayment?.notes,
//   ]);

//   if (invoicePurpose) return invoicePurpose;

//   const projectName = getProjectName(invoice);
//   return projectName && projectName !== "-"
//     ? `Payment for ${projectName}`
//     : "Payment purpose not provided";
// }

// function buildRecordVendorTransactions(
//   records: FirestoreRecordData[],
// ): VendorTransaction[] {
//   const rows: VendorTransaction[] = [];

//   records.forEach((record) => {
//     const items = Array.isArray(record?.items) ? record.items : [];
//     const recordDate =
//       getDateFromValue(record?.createdAt) ||
//       getDateFromValue(record?.updatedAt);
//     const chequeNumber = getFirstTextValue([record?.chequeNumber]);
//     const accountProvider = getFirstTextValue([record?.platform, record?.bank]);
//     const achInfo = [
//       record?.accountTitle,
//       accountProvider,
//       record?.accountNo ? `Account No: ${record.accountNo}` : "",
//     ]
//       .filter(Boolean)
//       .join(" · ");

//     items.forEach((item, index) => {
//       // The Record item's Name field is intentionally used as the vendor name.
//       const vendorName = getFirstTextValue([item?.name]);
//       if (!vendorName) return;

//       const amount = safeNumber(item?.amount);
//       const category = getFirstTextValue([item?.category]);
//       const description = getFirstTextValue([item?.description]);
//       const purpose =
//         [category, description].filter(Boolean).join(" — ") ||
//         "Record payment";
//       const recordReference = getFirstTextValue([chequeNumber, record?.id]);

//       rows.push({
//         id: `record-${record?.id || "unknown"}-${index}`,
//         requestId: String(record?.id || "-"),
//         vendorName,
//         projectName: "-",
//         requestType: "General",
//         type: "Record Payment",
//         purpose,
//         billNo: recordReference,
//         chequeNumber,
//         paidAmount: amount,
//         totalRequestAmount: amount,
//         salesTax: 0,
//         totalBeforeTax: amount,
//         remainingBalance: 0,
//         paymentDate: recordDate,
//         requestDate: recordDate,
//         paymentStatus: amount > 0 ? "Paid" : "Unpaid",
//         company: "",
//         billingAddress: "",
//         achInfo,
//         notes: [category, description].filter(Boolean).join(" — "),
//       });
//     });
//   });

//   return rows;
// }

// function buildVendorTransactions(
//   invoices: any[],
//   records: FirestoreRecordData[],
// ): VendorTransaction[] {
//   const rows: VendorTransaction[] = [];

//   invoices.forEach((invoice: any) => {
//     const requestType = getRequestType(invoice);
//     const requestTotalAmount = getTotalRequestAmount(invoice);
//     const requestPaidAmount = getRequestPaidAmount(invoice);
//     const sourceItems = getSourceItems(invoice);
//     const requestDate = getRequestDate(invoice);
//     const paymentDate = getPaymentDate(invoice);
//     const projectName = getProjectName(invoice);
//     const billNo = getBillNumber(invoice);
//     const chequeNumber = getChequeNumber(invoice);
//     const invoiceVendorName = getInvoiceVendorName(invoice);
//     const meta = getVendorMeta(invoice);

//     const validItems = sourceItems.filter((item: any) => {
//       const vendorName = getItemVendorName(item) || invoiceVendorName;
//       const itemAmount = getItemAmount(item);

//       return vendorName || itemAmount > 0;
//     });

//     const itemTotalSum = validItems.reduce(
//       (sum: number, item: any) => sum + getItemAmount(item),
//       0,
//     );

//     const totalBaseAmount =
//       requestTotalAmount > 0
//         ? requestTotalAmount
//         : itemTotalSum > 0
//           ? itemTotalSum
//           : 0;

//     if (validItems.length > 0) {
//       validItems.forEach((item: any, index: number) => {
//         const vendorName =
//           getItemVendorName(item) || invoiceVendorName || "Unknown Vendor";

//         const itemAmount =
//           getItemAmount(item) ||
//           (totalBaseAmount > 0 ? totalBaseAmount / validItems.length : 0);

//         const ratio =
//           totalBaseAmount > 0 ? Math.min(itemAmount / totalBaseAmount, 1) : 0;

//         const paidAmount =
//           requestPaidAmount > 0
//             ? Math.min(itemAmount, requestPaidAmount * ratio)
//             : 0;

//         const salesTax = getItemSalesTax(item, invoice) * ratio;
//         const totalBeforeTax = Math.max(paidAmount - salesTax, 0);
//         const remainingBalance = Math.max(itemAmount - paidAmount, 0);
//         const purpose = getPaymentPurpose(invoice, item);

//         rows.push({
//           id: `${invoice?.id || invoice?.requestId || "request"}-${index}`,
//           requestId: String(invoice?.requestId || "-"),
//           vendorName,
//           projectName,
//           requestType,
//           type: "Bill Payment",
//           purpose,
//           billNo,
//           chequeNumber,
//           paidAmount,
//           totalRequestAmount: itemAmount,
//           salesTax,
//           totalBeforeTax,
//           remainingBalance,
//           paymentDate,
//           requestDate,
//           paymentStatus: getPaymentStatus(
//             invoice,
//             paidAmount,
//             remainingBalance,
//           ),
//           company: meta.company,
//           billingAddress: meta.billingAddress,
//           achInfo: meta.achInfo,
//           notes: meta.notes,
//         });
//       });

//       return;
//     }

//     const vendorName = invoiceVendorName || "Unknown Vendor";
//     const paidAmount = requestPaidAmount;
//     const salesTax = getItemSalesTax({}, invoice);
//     const totalBeforeTax = Math.max(paidAmount - salesTax, 0);
//     const remainingBalance = Math.max(requestTotalAmount - paidAmount, 0);
//     const purpose = getPaymentPurpose(invoice);

//     rows.push({
//       id: `${invoice?.id || invoice?.requestId || vendorName}-single`,
//       requestId: String(invoice?.requestId || "-"),
//       vendorName,
//       projectName,
//       requestType,
//       type: "Bill Payment",
//       purpose,
//       billNo,
//       chequeNumber,
//       paidAmount,
//       totalRequestAmount: requestTotalAmount,
//       salesTax,
//       totalBeforeTax,
//       remainingBalance,
//       paymentDate,
//       requestDate,
//       paymentStatus: getPaymentStatus(invoice, paidAmount, remainingBalance),
//       company: meta.company,
//       billingAddress: meta.billingAddress,
//       achInfo: meta.achInfo,
//       notes: meta.notes,
//     });
//   });

//   rows.push(...buildRecordVendorTransactions(records));

//   return rows
//     .filter((row) => row.vendorName && row.vendorName !== "Unknown Vendor")
//     .sort((a, b) => {
//       const nameSort = a.vendorName.localeCompare(b.vendorName);
//       if (nameSort !== 0) return nameSort;

//       const aTime = a.paymentDate?.getTime() || a.requestDate?.getTime() || 0;
//       const bTime = b.paymentDate?.getTime() || b.requestDate?.getTime() || 0;

//       return bTime - aTime;
//     });
// }

// function isWithinDatePreset(row: VendorTransaction, preset: DatePreset) {
//   if (preset === "all") return true;

//   const date = row.paymentDate || row.requestDate;
//   if (!date) return false;

//   const now = new Date();

//   if (preset === "last30") {
//     const start = new Date();
//     start.setDate(now.getDate() - 30);
//     return date >= start && date <= now;
//   }

//   if (preset === "thisMonth") {
//     const start = new Date(now.getFullYear(), now.getMonth(), 1);
//     const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
//     return date >= start && date <= end;
//   }

//   const start = new Date();
//   start.setFullYear(now.getFullYear() - 1);
//   return date >= start && date <= now;
// }

// function getInitials(name: string) {
//   return name
//     .split(" ")
//     .filter(Boolean)
//     .slice(0, 2)
//     .map((word) => word[0]?.toUpperCase())
//     .join("");
// }

// export default function VendorSummary() {
//   const PANEL_ID = "IEDGE-SYSTEM";

//   const { data: invoices = [], loading: invoicesLoading } =
//     useFirestoreQuery<InvoiceRequest>(`Panels/${PANEL_ID}/invoiceRequests`);

//   const [records, setRecords] = useState<FirestoreRecordData[]>([]);
//   const [recordsLoading, setRecordsLoading] = useState(true);
//   const [suppliers, setSuppliers] = useState<FirestoreSupplierData[]>([]);
//   const [suppliersLoading, setSuppliersLoading] = useState(true);

//   useEffect(() => {
//     let isMounted = true;

//     const fetchRecordsAndSuppliers = async () => {
//       setRecordsLoading(true);
//       setSuppliersLoading(true);

//       const [recordResult, supplierResult] = await Promise.allSettled([
//         getDocs(collection(db, "Panels", PANEL_ID, "Record")),
//         getDocs(collection(db, "Panels", PANEL_ID, "suppliers")),
//       ]);

//       if (!isMounted) return;

//       if (recordResult.status === "fulfilled") {
//         const recordRows = recordResult.value.docs.map((document) => ({
//           id: document.id,
//           ...(document.data() as Omit<FirestoreRecordData, "id">),
//           items: Array.isArray(document.data()?.items)
//             ? (document.data().items as RecordItem[])
//             : [],
//         }));
//         setRecords(recordRows);
//       } else {
//         console.error(
//           "Failed to load Record data for Vendor Summary:",
//           recordResult.reason,
//         );
//         setRecords([]);
//       }

//       if (supplierResult.status === "fulfilled") {
//         const supplierRows = supplierResult.value.docs.map((document) => ({
//           id: document.id,
//           ...(document.data() as Omit<FirestoreSupplierData, "id">),
//         }));
//         setSuppliers(supplierRows);
//       } else {
//         console.error(
//           "Failed to load Supplier data for Vendor Summary:",
//           supplierResult.reason,
//         );
//         setSuppliers([]);
//       }

//       setRecordsLoading(false);
//       setSuppliersLoading(false);
//     };

//     fetchRecordsAndSuppliers();

//     return () => {
//       isMounted = false;
//     };
//   }, [PANEL_ID]);

//   const loading = invoicesLoading || recordsLoading || suppliersLoading;

//   const [supplierSearch, setSupplierSearch] = useState("");
//   const [selectedVendorName, setSelectedVendorName] = useState("");
//   const [activeTab, setActiveTab] = useState<
//     "transactions" | "details" | "notes"
//   >("transactions");
//   const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
//   const [chequeNumberSearch, setChequeNumberSearch] = useState("");
//   const [datePreset, setDatePreset] = useState<DatePreset>("last12");

//   const transactions = useMemo(() => {
//     return buildVendorTransactions(invoices as any[], records);
//   }, [invoices, records]);

//   const filteredTransactions = useMemo(() => {
//     const chequeSearch = normalizeText(chequeNumberSearch);

//     return transactions.filter((transaction) => {
//       const matchesType =
//         typeFilter === "all" ||
//         normalizeText(transaction.requestType) === typeFilter;

//       const matchesCheque =
//         !chequeSearch ||
//         normalizeText(transaction.chequeNumber).includes(chequeSearch);

//       return matchesType && matchesCheque;
//     });
//   }, [transactions, typeFilter, chequeNumberSearch]);

//   const vendorSummaries = useMemo<VendorSummaryItem[]>(() => {
//     const map = new Map<string, VendorSummaryItem>();
//     const today = new Date();

//     suppliers.forEach((supplier) => {
//       const vendorName = getFirstTextValue([supplier?.name]);
//       if (!vendorName) return;

//       map.set(normalizeVendorKey(vendorName), {
//         vendorName,
//         paidAmount: 0,
//         openingBalance: safeNumber(supplier?.openingBalance),
//         openBalance: 0,
//         overduePayment: 0,
//         transactionCount: 0,
//         company: "",
//         billingAddress: getFirstTextValue([
//           supplier?.address,
//           [supplier?.city, supplier?.country].filter(Boolean).join(", "),
//         ]),
//         achInfo: getFirstTextValue([
//           supplier?.paymentTerms
//             ? `Payment Terms: ${supplier.paymentTerms}`
//             : "",
//           supplier?.ntn ? `NTN: ${supplier.ntn}` : "",
//         ]),
//         notes: getFirstTextValue([supplier?.notes]),
//       });
//     });

//     filteredTransactions.forEach((transaction) => {
//       const vendorKey = normalizeVendorKey(transaction.vendorName);
//       const supplier = suppliers.find(
//         (item) => normalizeVendorKey(item?.name) === vendorKey,
//       );

//       const existing =
//         map.get(vendorKey) ||
//         ({
//           vendorName: transaction.vendorName,
//           paidAmount: 0,
//           openingBalance: safeNumber(supplier?.openingBalance),
//           openBalance: 0,
//           overduePayment: 0,
//           transactionCount: 0,
//           company: transaction.company,
//           billingAddress:
//             transaction.billingAddress || getFirstTextValue([supplier?.address]),
//           achInfo: transaction.achInfo,
//           notes: transaction.notes || getFirstTextValue([supplier?.notes]),
//         } as VendorSummaryItem);

//       existing.paidAmount += transaction.paidAmount;
//       existing.openBalance += transaction.remainingBalance;
//       existing.transactionCount += 1;

//       const relatedInvoice = (invoices as any[]).find(
//         (invoice: any) =>
//           String(invoice?.requestId || "") === transaction.requestId,
//       );

//       const dueDate = getDueDate(relatedInvoice);

//       if (
//         transaction.remainingBalance > 0 &&
//         (!dueDate || dueDate.getTime() <= today.getTime())
//       ) {
//         existing.overduePayment += transaction.remainingBalance;
//       }

//       if (!existing.company && transaction.company) {
//         existing.company = transaction.company;
//       }

//       if (!existing.billingAddress && transaction.billingAddress) {
//         existing.billingAddress = transaction.billingAddress;
//       }

//       if (!existing.achInfo && transaction.achInfo) {
//         existing.achInfo = transaction.achInfo;
//       }

//       if (!existing.notes && transaction.notes) {
//         existing.notes = transaction.notes;
//       }

//       map.set(vendorKey, existing);
//     });

//     return Array.from(map.values()).sort((a, b) =>
//       a.vendorName.localeCompare(b.vendorName),
//     );
//   }, [filteredTransactions, invoices, suppliers]);

//   const filteredVendorSummaries = useMemo(() => {
//     const search = normalizeText(supplierSearch);

//     return vendorSummaries.filter((vendor) => {
//       if (!search) return true;

//       return normalizeText(
//         [
//           vendor.vendorName,
//           vendor.company,
//           vendor.billingAddress,
//           vendor.notes,
//         ].join(" "),
//       ).includes(search);
//     });
//   }, [vendorSummaries, supplierSearch]);

//   useEffect(() => {
//     if (selectedVendorName) {
//       const exists = filteredVendorSummaries.some(
//         (vendor) => vendor.vendorName === selectedVendorName,
//       );

//       if (exists) return;
//     }

//     setSelectedVendorName(filteredVendorSummaries[0]?.vendorName || "");
//   }, [filteredVendorSummaries, selectedVendorName]);

//   const selectedVendor =
//     filteredVendorSummaries.find(
//       (vendor) => vendor.vendorName === selectedVendorName,
//     ) || filteredVendorSummaries[0];

//   const selectedTransactions = useMemo(() => {
//     if (!selectedVendor) return [];

//     return filteredTransactions
//       .filter(
//         (transaction) =>
//           normalizeVendorKey(transaction.vendorName) ===
//           normalizeVendorKey(selectedVendor.vendorName),
//       )
//       .filter((transaction) => isWithinDatePreset(transaction, datePreset))
//       .sort((a, b) => {
//         const aTime = a.paymentDate?.getTime() || a.requestDate?.getTime() || 0;
//         const bTime = b.paymentDate?.getTime() || b.requestDate?.getTime() || 0;

//         return bTime - aTime;
//       });
//   }, [filteredTransactions, selectedVendor, datePreset]);

//   const selectedTransactionTotals = useMemo(() => {
//     return selectedTransactions.reduce(
//       (totals, transaction) => {
//         totals.paidAmount += transaction.paidAmount;
//         totals.remainingBalance += transaction.remainingBalance;
//         return totals;
//       },
//       { paidAmount: 0, remainingBalance: 0 },
//     );
//   }, [selectedTransactions]);

//   const handleDownloadVendorSummary = () => {
//     if (!selectedVendor) return;

//     if (selectedTransactions.length === 0) {
//       window.alert(
//         "No transactions are available to download for this vendor.",
//       );
//       return;
//     }

//     const headers = [
//       "Vendor Name",
//       "Transaction Type",
//       "Payment Purpose",
//       "Request Type",
//       "Project Name",
//       "Reference / Bill No",
//       "Cheque Number",
//       "Supplier Opening Balance",
//       "Paid Amount",
//       "Remaining Amount",
//       "Payment Date",
//       "Payment Status",
//       "Notes",
//     ];

//     const rows = selectedTransactions.map((transaction) => [
//       transaction.vendorName,
//       transaction.type,
//       transaction.purpose,
//       transaction.requestType,
//       transaction.projectName,
//       transaction.billNo || transaction.requestId,
//       transaction.chequeNumber,
//       selectedVendor.openingBalance.toFixed(2),
//       transaction.paidAmount.toFixed(2),
//       transaction.remainingBalance.toFixed(2),
//       formatDate(transaction.paymentDate || transaction.requestDate),
//       transaction.paymentStatus,
//       transaction.notes,
//     ]);

//     const csvContent = [headers, ...rows]
//       .map((row) => row.map(escapeCsvValue).join(","))
//       .join("\r\n");

//     const blob = new Blob(["\uFEFF", csvContent], {
//       type: "text/csv;charset=utf-8;",
//     });
//     const url = window.URL.createObjectURL(blob);
//     const link = document.createElement("a");
//     const fileDate = new Date().toISOString().slice(0, 10);

//     link.href = url;
//     link.download = `${sanitizeFileName(
//       selectedVendor.vendorName,
//     )}-vendor-summary-${fileDate}.csv`;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     window.URL.revokeObjectURL(url);
//   };

//   const handlePrintVendorSummary = () => {
//     if (!selectedVendor) return;

//     if (selectedTransactions.length === 0) {
//       window.alert("No transactions are available to print for this vendor.");
//       return;
//     }

//     const printWindow = window.open(
//       "",
//       "_blank",
//       "width=1200,height=850,scrollbars=yes,resizable=yes",
//     );

//     if (!printWindow) {
//       window.alert(
//         "The print window was blocked. Please allow pop-ups and try again.",
//       );
//       return;
//     }

//     const transactionRows = selectedTransactions
//       .map(
//         (transaction, index) => `
//           <tr>
//             <td class="number-cell">${index + 1}</td>
//             <td>
//               <strong>${escapeHtml(transaction.type)}</strong>
//               <span class="secondary">${escapeHtml(
//                 transaction.billNo || transaction.requestId || "-",
//               )}</span>
//             </td>
//             <td>${escapeHtml(transaction.purpose || "-")}</td>
//             <td>${escapeHtml(transaction.requestType)}</td>
//             <td>${escapeHtml(transaction.projectName || "-")}</td>
//             <td>${escapeHtml(transaction.chequeNumber || "-")}</td>
//             <td class="amount-cell">${escapeHtml(
//               formatCurrency(transaction.paidAmount),
//             )}</td>
//             <td class="amount-cell">${escapeHtml(
//               formatCurrency(transaction.remainingBalance),
//             )}</td>
//             <td>${escapeHtml(
//               formatDate(transaction.paymentDate || transaction.requestDate),
//             )}</td>
//             <td>
//               <span class="status status-${escapeHtml(
//                 normalizeText(transaction.paymentStatus).replace(/\s+/g, "-"),
//               )}">
//                 ${escapeHtml(transaction.paymentStatus)}
//               </span>
//             </td>
//           </tr>
//         `,
//       )
//       .join("");

//     const generatedAt = new Date().toLocaleString("en-PK", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });

//     const printDocument = `
//       <!DOCTYPE html>
//       <html lang="en">
//         <head>
//           <meta charset="UTF-8" />
//           <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//           <title>${escapeHtml(selectedVendor.vendorName)} - Vendor Summary</title>
//           <style>
//             :root {
//               --ink: #0f172a;
//               --muted: #64748b;
//               --border: #e2e8f0;
//               --surface: #f8fafc;
//               --accent: #059669;
//               --accent-soft: #ecfdf5;
//             }

//             * { box-sizing: border-box; }

//             html, body {
//               margin: 0;
//               padding: 0;
//               color: var(--ink);
//               background: white;
//               font-family: Inter, "Segoe UI", Arial, sans-serif;
//               font-size: 12px;
//               -webkit-print-color-adjust: exact;
//               print-color-adjust: exact;
//             }

//             body { padding: 24px; }

//             .document {
//               width: 100%;
//               max-width: 1120px;
//               margin: 0 auto;
//               border: 1px solid var(--border);
//               border-radius: 18px;
//               overflow: hidden;
//             }

//             .header {
//               display: flex;
//               align-items: flex-start;
//               justify-content: space-between;
//               gap: 30px;
//               padding: 28px 32px;
//               background: #0f172a;
//               color: white;
//             }

//             .eyebrow {
//               margin: 0 0 8px;
//               color: #6ee7b7;
//               font-size: 10px;
//               font-weight: 800;
//               letter-spacing: .18em;
//               text-transform: uppercase;
//             }

//             h1 {
//               margin: 0;
//               font-size: 28px;
//               line-height: 1.15;
//             }

//             .subtitle {
//               margin: 8px 0 0;
//               color: #cbd5e1;
//               font-size: 11px;
//             }

//             .brand {
//               text-align: right;
//               white-space: nowrap;
//             }

//             .brand strong {
//               display: block;
//               font-size: 16px;
//               letter-spacing: .05em;
//             }

//             .brand span {
//               display: block;
//               margin-top: 5px;
//               color: #94a3b8;
//               font-size: 9px;
//               letter-spacing: .12em;
//               text-transform: uppercase;
//             }

//             .content { padding: 26px 32px 32px; }

//             .summary-grid {
//               display: grid;
//               grid-template-columns: repeat(5, minmax(0, 1fr));
//               gap: 12px;
//               margin-bottom: 24px;
//             }

//             .summary-card {
//               padding: 15px;
//               border: 1px solid var(--border);
//               border-radius: 12px;
//               background: var(--surface);
//             }

//             .summary-card span {
//               display: block;
//               color: var(--muted);
//               font-size: 9px;
//               font-weight: 700;
//               letter-spacing: .05em;
//               text-transform: uppercase;
//             }

//             .summary-card strong {
//               display: block;
//               margin-top: 7px;
//               font-size: 15px;
//             }

//             .summary-card.accent {
//               border-color: #a7f3d0;
//               background: var(--accent-soft);
//             }

//             .summary-card.accent strong { color: #047857; }

//             .section-title {
//               margin: 0 0 11px;
//               font-size: 14px;
//             }

//             .table-wrap {
//               overflow: hidden;
//               border: 1px solid var(--border);
//               border-radius: 12px;
//             }

//             table {
//               width: 100%;
//               border-collapse: collapse;
//             }

//             thead { background: var(--surface); }

//             th {
//               padding: 11px 10px;
//               color: #475569;
//               font-size: 8px;
//               font-weight: 800;
//               letter-spacing: .06em;
//               text-align: left;
//               text-transform: uppercase;
//             }

//             td {
//               padding: 12px 10px;
//               border-top: 1px solid var(--border);
//               vertical-align: top;
//             }

//             .number-cell {
//               width: 38px;
//               color: var(--muted);
//               text-align: center;
//             }

//             .amount-cell {
//               font-weight: 700;
//               text-align: right;
//               white-space: nowrap;
//             }

//             .secondary {
//               display: block;
//               margin-top: 3px;
//               color: var(--muted);
//               font-size: 9px;
//             }

//             .status {
//               display: inline-flex;
//               padding: 4px 8px;
//               border: 1px solid var(--border);
//               border-radius: 999px;
//               background: var(--surface);
//               font-size: 9px;
//               font-weight: 700;
//               white-space: nowrap;
//             }

//             .status-paid {
//               border-color: #a7f3d0;
//               background: #ecfdf5;
//               color: #047857;
//             }

//             .status-partially-paid {
//               border-color: #bfdbfe;
//               background: #eff6ff;
//               color: #1d4ed8;
//             }

//             .status-pending {
//               border-color: #fde68a;
//               background: #fffbeb;
//               color: #b45309;
//             }

//             .footer {
//               display: flex;
//               justify-content: space-between;
//               gap: 16px;
//               margin-top: 22px;
//               padding-top: 15px;
//               border-top: 1px solid var(--border);
//               color: var(--muted);
//               font-size: 9px;
//             }

//             @page { size: A4 landscape; margin: 9mm; }

//             @media print {
//               body { padding: 0; }
//               .document { max-width: none; border: none; border-radius: 0; }
//               thead { display: table-header-group; }
//               tr, .summary-card { break-inside: avoid; }
//             }
//           </style>
//         </head>
//         <body>
//           <main class="document">
//             <header class="header">
//               <div>
//                 <p class="eyebrow">Vendor Payment Statement</p>
//                 <h1>${escapeHtml(selectedVendor.vendorName)}</h1>
//                 <p class="subtitle">
//                   Filtered transaction history from Invoice Requests and Records.
//                 </p>
//               </div>
//               <div class="brand">
//                 <strong>IEDGE SYSTEM</strong>
//                 <span>Financial Records Management</span>
//               </div>
//             </header>

//             <div class="content">
//               <section class="summary-grid">
//                 <div class="summary-card">
//                   <span>Opening Balance</span>
//                   <strong>${escapeHtml(
//                     formatCurrency(selectedVendor.openingBalance),
//                   )}</strong>
//                 </div>
//                 <div class="summary-card accent">
//                   <span>Total Amount Paid</span>
//                   <strong>${escapeHtml(
//                     formatCurrency(selectedTransactionTotals.paidAmount),
//                   )}</strong>
//                 </div>
//                 <div class="summary-card">
//                   <span>Remaining Amount</span>
//                   <strong>${escapeHtml(
//                     formatCurrency(selectedTransactionTotals.remainingBalance),
//                   )}</strong>
//                 </div>
//                 <div class="summary-card">
//                   <span>Transactions Shown</span>
//                   <strong>${selectedTransactions.length}</strong>
//                 </div>
//                 <div class="summary-card">
//                   <span>Date Filter</span>
//                   <strong>${escapeHtml(
//                     datePreset === "last12"
//                       ? "Last 12 months"
//                       : datePreset === "last30"
//                         ? "Last 30 days"
//                         : datePreset === "thisMonth"
//                           ? "This month"
//                           : "All dates",
//                   )}</strong>
//                 </div>
//               </section>

//               <h2 class="section-title">Transaction Details</h2>

//               <div class="table-wrap">
//                 <table>
//                   <thead>
//                     <tr>
//                       <th>#</th>
//                       <th>Transaction</th>
//                       <th>Purpose</th>
//                       <th>Type</th>
//                       <th>Project</th>
//                       <th>Cheque Number</th>
//                       <th style="text-align:right">Paid</th>
//                       <th style="text-align:right">Remaining</th>
//                       <th>Date</th>
//                       <th>Status</th>
//                     </tr>
//                   </thead>
//                   <tbody>${transactionRows}</tbody>
//                 </table>
//               </div>

//               <footer class="footer">
//                 <span>Generated ${escapeHtml(generatedAt)}</span>
//                 <span>IEDGE SYSTEM · Internal Financial Document</span>
//               </footer>
//             </div>
//           </main>
//         </body>
//       </html>
//     `;

//     printWindow.document.open();
//     printWindow.document.write(printDocument);
//     printWindow.document.close();

//     printWindow.onload = () => {
//       printWindow.focus();
//       window.setTimeout(() => printWindow.print(), 250);
//     };
//   };

//   const dashboardStats = useMemo(() => {
//     return filteredVendorSummaries.reduce(
//       (acc, vendor) => {
//         acc.totalPaid += vendor.paidAmount;
//         acc.totalOpeningBalance += vendor.openingBalance;
//         acc.totalRemaining += vendor.openBalance;
//         acc.totalOverdue += vendor.overduePayment;
//         acc.totalTransactions += vendor.transactionCount;
//         return acc;
//       },
//       {
//         totalPaid: 0,
//         totalOpeningBalance: 0,
//         totalRemaining: 0,
//         totalOverdue: 0,
//         totalTransactions: 0,
//       },
//     );
//   }, [filteredVendorSummaries]);

//   if (loading) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-slate-50">
//         <div className="rounded-3xl border border-slate-200 bg-white px-8 py-7 text-center shadow-sm">
//           <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
//           <p className="mt-4 text-sm font-medium text-slate-700">
//             Loading vendor payments, records, and suppliers...
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-slate-50 p-4 text-slate-900 lg:p-6">
//       <div className="mx-auto flex h-[calc(100vh-48px)]  gap-5 overflow-hidden">
//         <aside className="flex w-[320px] shrink-0 flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
//           <div className="border-b border-slate-100 p-5">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
//                   Vendors
//                 </p>
//                 <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
//                   Payment History
//                 </h2>
//               </div>

//               <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
//                 <Users className="h-5 w-5" />
//               </div>
//             </div>

//             <div className="relative mt-5">
//               <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
//               <input
//                 value={supplierSearch}
//                 onChange={(event) => setSupplierSearch(event.target.value)}
//                 placeholder="Search vendor..."
//                 className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-50"
//               />
//             </div>

//             <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-white">
//               <p className="text-xs text-slate-300">Total Paid</p>
//               <p className="mt-1 text-lg font-bold">
//                 {formatCurrency(dashboardStats.totalPaid)}
//               </p>
//               <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
//                 <span>{filteredVendorSummaries.length} vendors</span>
//                 <span>{dashboardStats.totalTransactions} transactions</span>
//               </div>
//               <div className="mt-3 border-t border-white/10 pt-3">
//                 <p className="text-xs text-slate-400">Total Opening Balance</p>
//                 <p className="mt-1 text-sm font-semibold text-white">
//                   {formatCurrency(dashboardStats.totalOpeningBalance)}
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div className="flex-1 space-y-2 overflow-y-auto p-3">
//             {filteredVendorSummaries.length === 0 ? (
//               <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
//                 <p className="text-sm font-medium text-slate-700">
//                   No vendors found
//                 </p>
//                 <p className="mt-1 text-xs text-slate-400">
//                   Try changing your search or filter.
//                 </p>
//               </div>
//             ) : (
//               filteredVendorSummaries.map((vendor) => {
//                 const isActive =
//                   vendor.vendorName === selectedVendor?.vendorName;

//                 return (
//                   <button
//                     key={vendor.vendorName}
//                     onClick={() => {
//                       setSelectedVendorName(vendor.vendorName);
//                       setActiveTab("transactions");
//                     }}
//                     className={`w-full rounded-2xl border p-4 text-left transition ${
//                       isActive
//                         ? "border-emerald-200 bg-emerald-50 shadow-sm"
//                         : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"
//                     }`}
//                   >
//                     <div className="flex items-start gap-3">
//                       <div
//                         className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${
//                           isActive
//                             ? "bg-emerald-600 text-white"
//                             : "bg-slate-100 text-slate-600"
//                         }`}
//                       >
//                         {getInitials(vendor.vendorName) || "V"}
//                       </div>

//                       <div className="min-w-0 flex-1">
//                         <p className="truncate text-sm font-semibold text-slate-900">
//                           {vendor.vendorName}
//                         </p>
//                         <p className="mt-1 truncate text-xs text-slate-500">
//                           {vendor.company || "No company added"}
//                         </p>

//                         <div className="mt-3 grid grid-cols-3 gap-2">
//                           <div>
//                             <p className="text-[11px] text-slate-400">Opening</p>
//                             <p className="truncate text-xs font-semibold text-slate-700">
//                               {formatCurrency(vendor.openingBalance)}
//                             </p>
//                           </div>
//                           <div>
//                             <p className="text-[11px] text-slate-400">Paid</p>
//                             <p className="truncate text-xs font-semibold text-slate-700">
//                               {formatCurrency(vendor.paidAmount)}
//                             </p>
//                           </div>
//                           <div>
//                             <p className="text-[11px] text-slate-400">
//                               Remaining
//                             </p>
//                             <p className="truncate text-xs font-semibold text-slate-700">
//                               {formatCurrency(vendor.openBalance)}
//                             </p>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </button>
//                 );
//               })
//             )}
//           </div>
//         </aside>

//         <main className="flex-1 overflow-y-auto rounded-[28px] border border-slate-200 bg-white shadow-sm">
//           {!selectedVendor ? (
//             <div className="flex h-full items-center justify-center p-10">
//               <div className="max-w-md text-center">
//                 <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
//                   <Wallet className="h-7 w-7" />
//                 </div>
//                 <h2 className="mt-5 text-xl font-bold text-slate-950">
//                   No vendor payment records found
//                 </h2>
//                 <p className="mt-2 text-sm leading-6 text-slate-500">
//                   Vendor records will appear here from Invoice Requests and from
//                   items saved in the Records section.
//                 </p>
//               </div>
//             </div>
//           ) : (
//             <div className="p-5 lg:p-7">
//               <div className="rounded-[28px] bg-slate-950 p-6 text-white lg:p-7">
//                 <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
//                   <div>
//                     <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
//                       Vendor Summary
//                     </p>
//                     <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight lg:text-4xl">
//                       {selectedVendor.vendorName}
//                     </h1>
//                     <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
//                       Complete payment history with cheque number, project
//                       details, payment status, and remaining balance.
//                     </p>
//                   </div>

//                   <div className="flex flex-wrap gap-2">
//                     <button
//                       type="button"
//                       onClick={handleDownloadVendorSummary}
//                       className="flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
//                       disabled={selectedTransactions.length === 0}
//                       title="Download filtered vendor transactions as CSV"
//                     >
//                       <Download className="h-4 w-4" />
//                       Download
//                     </button>

//                     <button
//                       type="button"
//                       onClick={handlePrintVendorSummary}
//                       className="flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
//                       disabled={selectedTransactions.length === 0}
//                       title="Print the filtered vendor statement"
//                     >
//                       <Printer className="h-4 w-4" />
//                       Print
//                     </button>
//                   </div>
//                 </div>
//               </div>

//               <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_340px]">
//                 <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
//                         Vendor Details
//                       </p>
//                       <h2 className="mt-1 text-lg font-bold text-slate-950">
//                         Profile Information
//                       </h2>
//                     </div>

//                     <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
//                       <Building2 className="h-5 w-5" />
//                     </div>
//                   </div>

//                   <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
//                     <div className="rounded-2xl bg-slate-50 p-4">
//                       <p className="text-xs font-medium text-slate-400">
//                         Company
//                       </p>
//                       <p className="mt-2 text-sm font-semibold text-slate-800">
//                         {selectedVendor.company || "-"}
//                       </p>
//                     </div>

//                     <div className="rounded-2xl bg-slate-50 p-4">
//                       <p className="text-xs font-medium text-slate-400">
//                         Billing Address
//                       </p>
//                       <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-800">
//                         {selectedVendor.billingAddress || "-"}
//                       </p>
//                     </div>

//                     <div className="rounded-2xl bg-slate-50 p-4">
//                       <p className="text-xs font-medium text-slate-400">
//                         Bill Pay ACH Info
//                       </p>
//                       <p className="mt-2 text-sm font-semibold text-slate-800">
//                         {selectedVendor.achInfo || "-"}
//                       </p>
//                     </div>

//                     <div className="rounded-2xl bg-slate-50 p-4">
//                       <p className="text-xs font-medium text-slate-400">
//                         Opening Balance
//                       </p>
//                       <p className="mt-2 text-sm font-bold text-slate-900">
//                         {formatCurrency(selectedVendor.openingBalance)}
//                       </p>
//                     </div>

//                     <div className="rounded-2xl bg-slate-50 p-4">
//                       <p className="text-xs font-medium text-slate-400">
//                         Total Amount Paid
//                       </p>
//                       <p className="mt-2 text-sm font-bold text-emerald-700">
//                         {formatCurrency(selectedVendor.paidAmount)}
//                       </p>
//                     </div>
//                   </div>
//                 </section>

//                 <aside className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
//                   <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
//                     Balance Overview
//                   </p>

//                   <div className="mt-5 space-y-4">
//                     <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
//                       <p className="text-xs font-medium text-slate-600">
//                         Opening Balance
//                       </p>
//                       <p className="mt-2 text-xl font-bold text-slate-900">
//                         {formatCurrency(selectedVendor.openingBalance)}
//                       </p>
//                     </div>

//                     <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
//                       <p className="text-xs font-medium text-emerald-700">
//                         Total Amount Paid
//                       </p>
//                       <p className="mt-2 text-xl font-bold text-emerald-900">
//                         {formatCurrency(selectedVendor.paidAmount)}
//                       </p>
//                     </div>

//                     <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
//                       <p className="text-xs font-medium text-amber-700">
//                         Remaining Amount
//                       </p>
//                       <p className="mt-2 text-xl font-bold text-amber-900">
//                         {formatCurrency(selectedVendor.openBalance)}
//                       </p>
//                     </div>
//                   </div>
//                 </aside>
//               </div>

//               <div className="mt-5 rounded-[24px] border border-slate-200 bg-white shadow-sm">
//                 <div className="border-b border-slate-100 p-4">
//                   <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
//                     <div className="flex flex-wrap gap-2">
//                       {[
//                         { key: "transactions", label: "Transaction List" },
//                         { key: "details", label: "Supplier Details" },
//                         { key: "notes", label: "Notes" },
//                       ].map((tab) => (
//                         <button
//                           key={tab.key}
//                           onClick={() =>
//                             setActiveTab(
//                               tab.key as "transactions" | "details" | "notes",
//                             )
//                           }
//                           className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
//                             activeTab === tab.key
//                               ? "bg-slate-950 text-white shadow-sm"
//                               : "bg-slate-100 text-slate-600 hover:bg-slate-200"
//                           }`}
//                         >
//                           {tab.label}
//                         </button>
//                       ))}
//                     </div>

//                     {activeTab === "transactions" && (
//                       <div className="flex flex-wrap items-center gap-3">
//                         <select
//                           value={typeFilter}
//                           onChange={(event) =>
//                             setTypeFilter(event.target.value as TypeFilter)
//                           }
//                           className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
//                         >
//                           <option value="all">All Types</option>
//                           <option value="general">General</option>
//                           <option value="project">Project</option>
//                         </select>

//                         <input
//                           value={chequeNumberSearch}
//                           onChange={(event) =>
//                             setChequeNumberSearch(event.target.value)
//                           }
//                           placeholder="Search cheque no..."
//                           className="h-11 w-[190px] rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
//                         />

//                         <select
//                           value={datePreset}
//                           onChange={(event) =>
//                             setDatePreset(event.target.value as DatePreset)
//                           }
//                           className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
//                         >
//                           <option value="last12">Last 12 months</option>
//                           <option value="last30">Last 30 days</option>
//                           <option value="thisMonth">This month</option>
//                           <option value="all">All dates</option>
//                         </select>

//                         <button className="flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
//                           <SlidersHorizontal className="h-4 w-4" />
//                           Filter
//                         </button>
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 {activeTab === "transactions" && (
//                   <div className="p-4">
//                     <div className="overflow-hidden rounded-2xl border border-slate-200">
//                       <div className="overflow-x-auto">
//                         <table className="w-full min-w-[1540px] border-collapse">
//                           <thead>
//                             <tr className="bg-slate-50">
//                               <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
//                                 Vendor Name
//                               </th>
//                               <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
//                                 Type
//                               </th>
//                               <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
//                                 Payment Purpose
//                               </th>
//                               <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
//                                 Project Name
//                               </th>
//                               <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
//                                 Cheque Number
//                               </th>
//                               <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
//                                 Total Amount Paid
//                               </th>
//                               <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
//                                 Remaining Amount
//                               </th>
//                               <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
//                                 Payment Date
//                               </th>
//                               <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
//                                 Payment Status
//                               </th>
//                               <th className="w-12 px-4 py-4 text-center">
//                                 <Paperclip className="mx-auto h-4 w-4 text-slate-400" />
//                               </th>
//                             </tr>
//                           </thead>

//                           <tbody className="divide-y divide-slate-100 bg-white">
//                             {selectedTransactions.length === 0 ? (
//                               <tr>
//                                 <td
//                                   colSpan={10}
//                                   className="px-4 py-14 text-center"
//                                 >
//                                   <div className="mx-auto max-w-sm">
//                                     <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
//                                       <FileText className="h-6 w-6" />
//                                     </div>
//                                     <p className="mt-4 text-sm font-semibold text-slate-700">
//                                       No transactions found
//                                     </p>
//                                     <p className="mt-1 text-sm text-slate-400">
//                                       Try adjusting your type, cheque number, or
//                                       date filter.
//                                     </p>
//                                   </div>
//                                 </td>
//                               </tr>
//                             ) : (
//                               selectedTransactions.map((transaction) => (
//                                 <tr
//                                   key={transaction.id}
//                                   className="transition hover:bg-slate-50"
//                                 >
//                                   <td className="px-4 py-4">
//                                     <div className="text-sm font-bold text-slate-900">
//                                       {transaction.vendorName}
//                                     </div>
//                                     <div className="mt-1 text-xs text-slate-400">
//                                       {transaction.type}:{" "}
//                                       {transaction.billNo ||
//                                         transaction.requestId ||
//                                         "-"}
//                                     </div>
//                                   </td>

//                                   <td className="px-4 py-4">
//                                     <Badge
//                                       variant="outline"
//                                       className={`rounded-full px-3 py-1 text-xs font-semibold ${getTypeBadgeClass(
//                                         transaction.requestType,
//                                       )}`}
//                                     >
//                                       {transaction.requestType}
//                                     </Badge>
//                                   </td>

//                                   <td className="max-w-[320px] px-4 py-4 text-sm text-slate-700">
//                                     <p className="line-clamp-3 leading-5">
//                                       {transaction.purpose || "-"}
//                                     </p>
//                                   </td>

//                                   <td className="px-4 py-4 text-sm font-medium text-slate-700">
//                                     {transaction.projectName}
//                                   </td>

//                                   <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-800">
//                                     {transaction.chequeNumber || "-"}
//                                   </td>

//                                   <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-bold text-slate-900">
//                                     {formatCurrency(transaction.paidAmount)}
//                                   </td>

//                                   <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-bold text-slate-900">
//                                     {formatCurrency(
//                                       transaction.remainingBalance,
//                                     )}
//                                   </td>

//                                   <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-slate-700">
//                                     {formatDate(transaction.paymentDate)}
//                                   </td>

//                                   <td className="px-4 py-4 text-center">
//                                     <Badge
//                                       variant="outline"
//                                       className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
//                                         transaction.paymentStatus,
//                                       )}`}
//                                     >
//                                       {transaction.paymentStatus}
//                                     </Badge>
//                                   </td>

//                                   <td className="px-4 py-4 text-center text-slate-300">
//                                     -
//                                   </td>
//                                 </tr>
//                               ))
//                             )}
//                           </tbody>
//                         </table>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {activeTab === "details" && (
//                   <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-5">
//                     <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
//                       <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
//                         Supplier Name
//                       </p>
//                       <p className="mt-2 text-sm font-bold text-slate-900">
//                         {selectedVendor.vendorName}
//                       </p>
//                     </div>

//                     <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
//                       <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
//                         Opening Balance
//                       </p>
//                       <p className="mt-2 text-sm font-bold text-slate-900">
//                         {formatCurrency(selectedVendor.openingBalance)}
//                       </p>
//                     </div>

//                     <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
//                       <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
//                         Total Amount Paid
//                       </p>
//                       <p className="mt-2 text-sm font-bold text-emerald-700">
//                         {formatCurrency(selectedVendor.paidAmount)}
//                       </p>
//                     </div>

//                     <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
//                       <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
//                         Remaining Amount
//                       </p>
//                       <p className="mt-2 text-sm font-bold text-amber-700">
//                         {formatCurrency(selectedVendor.openBalance)}
//                       </p>
//                     </div>

//                     <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
//                       <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
//                         Company
//                       </p>
//                       <p className="mt-2 text-sm font-bold text-slate-900">
//                         {selectedVendor.company || "-"}
//                       </p>
//                     </div>
//                   </div>
//                 )}

//                 {activeTab === "notes" && (
//                   <div className="p-5">
//                     <div className="max-w-3xl rounded-2xl border border-slate-200 bg-slate-50 p-5">
//                       <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
//                         Notes
//                       </p>
//                       <p className="mt-3 text-sm leading-6 text-slate-700">
//                         {selectedVendor.notes ||
//                           "No notes available for this supplier."}
//                       </p>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}
//         </main>
//       </div>
//     </div>
//   );
// }

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import {
  FileText,
  HandCoins,
  Loader2,
  ScrollText,
  Printer,
  Search,
  Download,
  Wallet,
} from "lucide-react";
import { useFirestoreQuery } from "@/hooks/useFirestore";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import PaymentReleaseModal from "@/components/PaymentReleaseModal";
import VendorAccountStatement, {
  type VendorStatement,
  type VendorStatementBill,
  type VendorStatementPayment,
} from "@/components/VendorAccountStatement";
import { fetchPaymentAccounts } from "@/lib/payments/paymentAccounts";
import type { PaymentAccount } from "@/lib/payments/types";
import { useToast } from "@/hooks/use-toast";
import { InvoiceRequest } from "@shared/schema";

type RequestType = "General" | "Project";
type TypeFilter = "all" | "general" | "project";
type DatePreset = "last12" | "last30" | "thisMonth" | "all";

const FINANCE_PAYMENT_ROLE_KEYS = new Set([
  "finance",
  "finance_member",
  "member_of_finance",
  "financial_admin",
  "finance_admin",
  "finance_head",
  "head_of_finance",
  "finance_manager",
  "financial_manager",
  "accounts",
  "account",
  "accountant",
  "accounts_manager",
  "main_admin",
  "admin",
  "super_admin",
]);

function getRoleKey(value: any) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");
}

function canRoleReleasePayment(role: any) {
  return FINANCE_PAYMENT_ROLE_KEYS.has(getRoleKey(role));
}

type RecordItem = {
  category?: string;
  amount?: number | string;
  name?: string;
  description?: string;
};

type FirestoreRecordData = {
  id: string;
  accountId?: string;
  accountType?: "cheque" | "online";
  accountTitle?: string;
  accountNo?: string;
  bank?: string;
  branch?: string;
  city?: string;
  platform?: string;
  routingNumber?: string;
  chequeNumber?: string;
  chequeAmount?: number | string;
  totalItemAmount?: number | string;
  remainingBalance?: number | string;
  items?: RecordItem[];
  createdBy?: string;
  createdByName?: string;
  createdAt?: any;
  updatedAt?: any;
  status?: string;
  sourceType?: string;
  manualPayment?: boolean;
  poAllocations?: any[];
};

type FirestoreSupplierData = {
  id: string;
  name: string;
  openingBalance?: number | string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  ntn?: string;
  paymentTerms?: string;
  status?: string;
  notes?: string;
};

type PurchaseOrder = {
  id: string;
  poNumber?: string;
  supplierId?: string;
  supplierName?: string;
  supplierAddress?: string;
  issueDate?: string;
  dueDate?: string;
  items?: Array<{
    service?: string;
    qty?: string | number;
    rate?: string | number;
    amount?: string | number;
  }>;
  totalAmount?: number | string;
  approvedAmount?: number | string;
  totalApprovedAmount?: number | string;
  totalReleasedAmount?: number | string;
  remainingReleaseAmount?: number | string;
  paymentStatus?: string;
  paymentReleased?: boolean;
  paymentPartiallyReleased?: boolean;
  paymentReleaseHistory?: any[];
  latestPaymentRelease?: any;
  paymentDetails?: any;
  paymentReleasedAt?: any;
  partialPaymentReleasedAt?: any;
  releasePaymentAt?: any;
  status?: string;
  approvalStatus?: string;
  approvalWorkflow?: any;
  sourceInvoiceId?: string | null;
  sourceRequestId?: string | null;
  sourceProjectName?: string;
  sourceClientName?: string;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
  isClosed?: boolean;
};

type VendorTransaction = {
  id: string;
  requestId: string;
  sourceInvoiceId?: string;
  sourcePOId?: string;
  sourceSupplierId?: string;
  paymentEligible?: boolean;
  sourceType?: "invoice_request" | "purchase_order" | "record";
  vendorName: string;
  projectName: string;
  requestType: RequestType;
  type: string;
  purpose: string;
  billNo: string;
  chequeNumber: string;
  paidAmount: number;
  totalRequestAmount: number;
  salesTax: number;
  totalBeforeTax: number;
  remainingBalance: number;
  paymentDate: Date | null;
  requestDate: Date | null;
  paymentStatus: string;
  company: string;
  billingAddress: string;
  achInfo: string;
  notes: string;
};

type VendorSummaryItem = {
  vendorName: string;
  paidAmount: number;
  openingBalance: number;
  openBalance: number;
  overduePayment: number;
  transactionCount: number;
  company: string;
  billingAddress: string;
  achInfo: string;
  notes: string;
};

function safeNumber(value: any) {
  if (value === null || value === undefined || value === "") return 0;

  const parsed =
    typeof value === "string" ? Number(value.replace(/,/g, "")) : Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

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

function formatCurrency(value: number | string | undefined) {
  return `PKR ${formatPKR(value)}`;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeCsvValue(value: unknown): string {
  const text = String(value ?? "");
  const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
}

function sanitizeFileName(value: string): string {
  return (
    value
      .trim()
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "") || "vendor"
  );
}

function normalizeText(value: any) {
  return String(value || "")
    .toLowerCase()
    .trim();
}

function normalizeVendorKey(value: any) {
  return normalizeText(value).replace(/\s+/g, " ");
}

function getFirstTextValue(values: any[]): string {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }

  return "";
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

function formatDate(value: any) {
  const date = getDateFromValue(value);
  if (!date) return "-";

  return date.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
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

function getPaymentDate(invoice: any): Date | null {
  return (
    getDateFromValue(invoice?.paymentReleasedAt) ||
    getDateFromValue(invoice?.releasePaymentAt) ||
    getDateFromValue(invoice?.paymentDate) ||
    getDateFromValue(invoice?.paidAt) ||
    getDateFromValue(invoice?.paymentDetails?.paymentDate) ||
    getDateFromValue(invoice?.paymentDetails?.paidAt) ||
    getDateFromValue(invoice?.paymentDetails?.releasedAt) ||
    getDateFromValue(invoice?.releasePayment?.paymentDate) ||
    getDateFromValue(invoice?.releasePayment?.paidAt) ||
    getDateFromValue(invoice?.releasePayment?.releasedAt) ||
    null
  );
}

function getDueDate(invoice: any): Date | null {
  return (
    getDateFromValue(invoice?.dueDate) ||
    getDateFromValue(invoice?.paymentDueDate) ||
    getDateFromValue(invoice?.invoiceDueDate) ||
    null
  );
}

function hasPaymentReleased(invoice: any): boolean {
  const status = normalizeText(invoice?.status);
  const paymentStatus = normalizeText(
    invoice?.paymentStatus || invoice?.releasePaymentStatus,
  );

  return Boolean(
    status === "payment_released" ||
      paymentStatus === "released" ||
      paymentStatus === "payment_released" ||
      invoice?.paymentReleased ||
      invoice?.releasePaymentCreated ||
      invoice?.paymentReleaseId ||
      invoice?.paymentId ||
      invoice?.paymentReleasedAt ||
      invoice?.releasePaymentAt ||
      invoice?.paymentDetails?.releasedAt,
  );
}

function getRequestType(invoice: any): RequestType {
  const rawType = normalizeText(invoice?.invoiceType || invoice?.type);

  if (rawType === "project") return "Project";
  if (rawType === "general") return "General";

  const hasProjectFields = Boolean(
    invoice?.projectName ||
      invoice?.project ||
      invoice?.projectCode ||
      invoice?.clientName,
  );

  return hasProjectFields ? "Project" : "General";
}

function getInvoiceVendorName(invoice: any): string {
  return getFirstTextValue([
    invoice?.vendorName,
    invoice?.supplierName,
    invoice?.payeeName,
    invoice?.payee,
    invoice?.paymentDetails?.vendor,
    invoice?.releasePayment?.vendor,
    invoice?.clientName,
  ]);
}

function getItemVendorName(item: any): string {
  return getFirstTextValue([
    item?.vendor,
    item?.vendorName,
    item?.supplier,
    item?.supplierName,
    item?.payee,
    item?.payeeName,
    item?.original?.vendor,
    item?.original?.vendorName,
    item?.original?.supplier,
    item?.original?.supplierName,
  ]);
}

function getProjectName(invoice: any): string {
  const requestType = getRequestType(invoice);

  if (requestType === "General") return "-";

  return (
    getFirstTextValue([
      invoice?.projectName,
      invoice?.project,
      invoice?.projectCode,
      invoice?.title,
      invoice?.subject,
    ]) || "-"
  );
}

function getBillNumber(invoice: any): string {
  return getFirstTextValue([
    invoice?.paymentNumber,
    invoice?.paymentNo,
    invoice?.paymentReference,
    invoice?.reference,
    invoice?.chequeNumber,
    invoice?.checkNumber,
    invoice?.requestId,
  ]);
}

function getChequeNumber(invoice: any): string {
  return getFirstTextValue([
    invoice?.chequeNumber,
    invoice?.checkNumber,
    invoice?.chequeNo,
    invoice?.checkNo,
    invoice?.paymentChequeNumber,
    invoice?.paymentCheckNumber,
    invoice?.reference,
    invoice?.paymentReference,
    invoice?.transactionReference,
    invoice?.releasePayment?.chequeNumber,
    invoice?.releasePayment?.checkNumber,
    invoice?.releasePayment?.chequeNo,
    invoice?.releasePayment?.checkNo,
    invoice?.releasePayment?.reference,
    invoice?.releasePayment?.transactionReference,
    invoice?.paymentDetails?.chequeNumber,
    invoice?.paymentDetails?.checkNumber,
    invoice?.paymentDetails?.chequeNo,
    invoice?.paymentDetails?.checkNo,
    invoice?.paymentDetails?.reference,
    invoice?.paymentDetails?.transactionReference,
  ]);
}

function getTotalRequestAmount(invoice: any): number {
  return safeNumber(
    invoice?.approvedAmount || invoice?.totalAmount || invoice?.amount,
  );
}

function getExplicitPaidAmount(invoice: any): number {
  const paymentDetails = invoice?.paymentDetails || {};
  const releasePayment = invoice?.releasePayment || {};

  return safeNumber(
    invoice?.paidAmount ||
      invoice?.paymentAmount ||
      invoice?.releasedAmount ||
      invoice?.releasePaymentAmount ||
      invoice?.amountPaid ||
      paymentDetails?.paidAmount ||
      paymentDetails?.amount ||
      paymentDetails?.releasedAmount ||
      releasePayment?.paidAmount ||
      releasePayment?.amount ||
      releasePayment?.releasedAmount,
  );
}

function getRequestPaidAmount(invoice: any): number {
  const explicitPaidAmount = getExplicitPaidAmount(invoice);
  if (explicitPaidAmount > 0) return explicitPaidAmount;

  return hasPaymentReleased(invoice) ? getTotalRequestAmount(invoice) : 0;
}

function getSourceItems(invoice: any): any[] {
  const approvalItems = Array.isArray(invoice?.approvalItems)
    ? invoice.approvalItems
    : [];

  const lineItems = Array.isArray(invoice?.lineItems) ? invoice.lineItems : [];

  if (approvalItems.length > 0) return approvalItems;
  return lineItems;
}

function getItemAmount(item: any): number {
  const directAmount = safeNumber(
    item?.approvedAmount ||
      item?.totalAmount ||
      item?.amount ||
      item?.netAmount ||
      item?.grossAmount ||
      item?.total ||
      item?.price,
  );

  if (directAmount > 0) return directAmount;

  const quantity = safeNumber(item?.quantity || item?.qty || item?.units);
  const rate = safeNumber(item?.rate || item?.unitPrice || item?.unitRate);

  if (quantity > 0 && rate > 0) return quantity * rate;

  return 0;
}

function getItemSalesTax(item: any, invoice: any): number {
  return safeNumber(
    item?.salesTax ||
      item?.tax ||
      item?.taxAmount ||
      item?.sst ||
      item?.gst ||
      item?.sales_tax ||
      invoice?.salesTax ||
      invoice?.taxAmount ||
      invoice?.sst ||
      invoice?.gst,
  );
}

function getPaymentStatus(
  invoice: any,
  paidAmount: number,
  remainingBalance: number,
) {
  const status = normalizeText(invoice?.status);
  const paymentStatus = normalizeText(
    invoice?.paymentStatus || invoice?.releasePaymentStatus,
  );

  if (paidAmount > 0 && remainingBalance <= 0) return "Paid";
  if (paidAmount > 0 && remainingBalance > 0) return "Partially Paid";

  if (
    paymentStatus === "pending" ||
    status === "approved" ||
    status === "ready_for_payment" ||
    status === "po_created" ||
    status === "po_submitted" ||
    status === "po_approved" ||
    status === "po_issued" ||
    status === "pending_finance"
  ) {
    return "Pending";
  }

  return "Unpaid";
}

function getStatusDotClass(status: string) {
  const normalized = normalizeText(status);

  if (normalized === "paid") return "bg-emerald-500";
  if (normalized === "partially paid") return "bg-blue-500";
  if (normalized === "pending") return "bg-amber-500";

  return "bg-slate-300";
}

function getVendorMeta(invoice: any) {
  return {
    company: getFirstTextValue([
      invoice?.company,
      invoice?.companyName,
      invoice?.vendorCompany,
      invoice?.supplierCompany,
    ]),
    billingAddress: getFirstTextValue([
      invoice?.billingAddress,
      invoice?.vendorAddress,
      invoice?.supplierAddress,
      invoice?.address,
    ]),
    achInfo: getFirstTextValue([
      invoice?.billPayAchInfo,
      invoice?.billPayACHInfo,
      invoice?.achInfo,
      invoice?.bankInfo,
      invoice?.accountInfo,
      invoice?.paymentDetails?.selectedAccount?.accountName,
    ]),
    notes: getFirstTextValue([
      invoice?.notes,
      invoice?.remarks,
      invoice?.description,
      invoice?.message,
      invoice?.paymentDetails?.paymentNotes,
    ]),
  };
}

function getPaymentPurpose(invoice: any, item?: any): string {
  const itemPurpose = getFirstTextValue([
    item?.purpose,
    item?.paymentPurpose,
    item?.description,
    item?.itemDescription,
    item?.particulars,
    item?.details,
    item?.title,
    item?.itemName,
    item?.name,
    item?.category,
    item?.reason,
    item?.remarks,
    item?.notes,
    item?.original?.purpose,
    item?.original?.paymentPurpose,
    item?.original?.description,
    item?.original?.particulars,
    item?.original?.details,
    item?.original?.title,
    item?.original?.category,
  ]);

  if (itemPurpose) return itemPurpose;

  const invoicePurpose = getFirstTextValue([
    invoice?.paymentPurpose,
    invoice?.purpose,
    invoice?.description,
    invoice?.requestDescription,
    invoice?.title,
    invoice?.subject,
    invoice?.reason,
    invoice?.particulars,
    invoice?.remarks,
    invoice?.notes,
    invoice?.message,
    invoice?.paymentDetails?.purpose,
    invoice?.paymentDetails?.paymentPurpose,
    invoice?.paymentDetails?.paymentNotes,
    invoice?.releasePayment?.purpose,
    invoice?.releasePayment?.paymentPurpose,
    invoice?.releasePayment?.notes,
  ]);

  if (invoicePurpose) return invoicePurpose;

  const projectName = getProjectName(invoice);
  return projectName && projectName !== "-"
    ? `Payment for ${projectName}`
    : "Payment purpose not provided";
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
  return legacyPayment && getPaymentReleaseAmount(legacyPayment) > 0
    ? [legacyPayment]
    : [];
}

function getPurchaseOrderAmount(po: PurchaseOrder) {
  return roundMoney(
    po?.totalApprovedAmount ?? po?.approvedAmount ?? po?.totalAmount ?? 0,
  );
}

function getPurchaseOrderReleasedAmount(po: PurchaseOrder) {
  const historyTotal = getPaymentReleaseHistory(po).reduce(
    (sum, entry) => sum + getPaymentReleaseAmount(entry),
    0,
  );

  return roundMoney(
    historyTotal > 0 ? historyTotal : (po?.totalReleasedAmount ?? 0),
  );
}

function getPurchaseOrderRemainingAmount(po: PurchaseOrder) {
  return roundMoney(
    Math.max(
      getPurchaseOrderAmount(po) - getPurchaseOrderReleasedAmount(po),
      0,
    ),
  );
}

function getLatestPurchaseOrderPayment(po: PurchaseOrder) {
  return [...getPaymentReleaseHistory(po)].sort((a, b) => {
    const first = getDateFromValue(a?.releasedAt)?.getTime() || 0;
    const second = getDateFromValue(b?.releasedAt)?.getTime() || 0;
    return second - first;
  })[0];
}

function isPurchaseOrderPayable(po: PurchaseOrder) {
  const status = normalizeText(po?.status).replace(/\s+/g, "_");
  if (["cancelled", "canceled", "paid"].includes(status)) return false;

  const workflowState = normalizeText(po?.approvalWorkflow?.state);
  const approvalStatus = normalizeText(po?.approvalStatus);

  if (workflowState) return workflowState === "approved";
  if (approvalStatus) return approvalStatus === "approved";

  return ![
    "draft",
    "pending_approval",
    "returned_to_creator",
    "changes_requested",
    "rejected",
  ].includes(status);
}

function getPurchaseOrderSortTime(po: PurchaseOrder) {
  return (
    getDateFromValue(po?.createdAt)?.getTime() ||
    getDateFromValue(po?.issueDate)?.getTime() ||
    getDateFromValue(po?.updatedAt)?.getTime() ||
    0
  );
}

type FIFOAllocation = {
  po: PurchaseOrder;
  openingBalance: number;
  allocatedAmount: number;
  remainingBalance: number;
};

function allocatePurchaseOrderPaymentFIFO(
  purchaseOrders: PurchaseOrder[],
  requestedAmount: number,
): FIFOAllocation[] {
  let amountLeft = roundMoney(Math.max(requestedAmount, 0));

  return [...purchaseOrders]
    .sort((a, b) => {
      const dateDifference =
        getPurchaseOrderSortTime(a) - getPurchaseOrderSortTime(b);
      return dateDifference || String(a.id).localeCompare(String(b.id));
    })
    .flatMap((po) => {
      if (amountLeft <= 0.009) return [];

      const openingBalance = getPurchaseOrderRemainingAmount(po);
      if (openingBalance <= 0.009) return [];

      const allocatedAmount = roundMoney(Math.min(openingBalance, amountLeft));
      amountLeft = roundMoney(amountLeft - allocatedAmount);

      return [
        {
          po,
          openingBalance,
          allocatedAmount,
          remainingBalance: roundMoney(openingBalance - allocatedAmount),
        },
      ];
    });
}

function buildPurchaseOrderVendorTransactions(
  purchaseOrders: PurchaseOrder[],
): VendorTransaction[] {
  return purchaseOrders.flatMap((po) => {
    const vendorName = getFirstTextValue([po?.supplierName]);
    if (!vendorName) return [];

    const totalRequestAmount = getPurchaseOrderAmount(po);
    const paidAmount = getPurchaseOrderReleasedAmount(po);
    const remainingBalance = getPurchaseOrderRemainingAmount(po);
    const latestPayment = getLatestPurchaseOrderPayment(po);
    const requestDate =
      getDateFromValue(po?.createdAt) ||
      getDateFromValue(po?.issueDate) ||
      getDateFromValue(po?.updatedAt);
    const paymentDate =
      getDateFromValue(latestPayment?.releasedAt) ||
      getDateFromValue(po?.paymentReleasedAt) ||
      getDateFromValue(po?.partialPaymentReleasedAt) ||
      getDateFromValue(po?.releasePaymentAt);
    const projectName = getFirstTextValue([po?.sourceProjectName]) || "-";
    const services = (Array.isArray(po?.items) ? po.items : [])
      .map((item) => getFirstTextValue([item?.service]))
      .filter(Boolean)
      .slice(0, 3)
      .join(", ");

    return [
      {
        id: `po-${po.id}`,
        requestId: getFirstTextValue([po?.poNumber, po?.id]) || po.id,
        sourcePOId: po.id,
        sourceSupplierId: getFirstTextValue([po?.supplierId]),
        paymentEligible: isPurchaseOrderPayable(po),
        sourceType: "purchase_order",
        vendorName,
        projectName,
        requestType: projectName === "-" ? "General" : "Project",
        type: "Purchase Order",
        purpose:
          services ||
          getFirstTextValue([po?.notes]) ||
          `Purchase Order ${getFirstTextValue([po?.poNumber, po?.id])}`,
        billNo: getFirstTextValue([po?.poNumber, po?.id]),
        chequeNumber: getFirstTextValue([
          latestPayment?.chequeNumber,
          ...(Array.isArray(latestPayment?.chequeNumbers)
            ? latestPayment.chequeNumbers
            : []),
          latestPayment?.transactionReference,
        ]),
        paidAmount,
        totalRequestAmount,
        salesTax: 0,
        totalBeforeTax: paidAmount,
        remainingBalance,
        paymentDate,
        requestDate,
        paymentStatus:
          paidAmount > 0 && remainingBalance <= 0.009
            ? "Paid"
            : paidAmount > 0
              ? "Partially Paid"
              : "Unpaid",
        company: getFirstTextValue([po?.sourceClientName]),
        billingAddress: getFirstTextValue([po?.supplierAddress]),
        achInfo: getFirstTextValue([
          latestPayment?.selectedAccountName,
          latestPayment?.selectedAccount?.accountName,
          latestPayment?.selectedAccount?.bankName,
        ]),
        notes: getFirstTextValue([latestPayment?.paymentNotes, po?.notes]),
      },
    ];
  });
}

function buildRecordVendorTransactions(
  records: FirestoreRecordData[],
): VendorTransaction[] {
  const rows: VendorTransaction[] = [];

  records.forEach((record) => {
    // Manual PO payments are represented by the updated POs themselves.
    // The matching Record document exists only to feed Account Statement,
    // so displaying it again here would double-count the same payment.
    if (
      normalizeText(record?.sourceType) === "po_manual_payment" ||
      record?.manualPayment === true
    ) {
      return;
    }

    const items = Array.isArray(record?.items) ? record.items : [];
    const recordDate =
      getDateFromValue(record?.createdAt) ||
      getDateFromValue(record?.updatedAt);
    const chequeNumber = getFirstTextValue([record?.chequeNumber]);
    const accountProvider = getFirstTextValue([record?.platform, record?.bank]);
    const achInfo = [
      record?.accountTitle,
      accountProvider,
      record?.accountNo ? `Account No: ${record.accountNo}` : "",
    ]
      .filter(Boolean)
      .join(" · ");

    items.forEach((item, index) => {
      // The Record item's Name field is intentionally used as the vendor name.
      const vendorName = getFirstTextValue([item?.name]);
      if (!vendorName) return;

      const amount = safeNumber(item?.amount);
      const category = getFirstTextValue([item?.category]);
      const description = getFirstTextValue([item?.description]);
      const purpose =
        [category, description].filter(Boolean).join(" — ") || "Record payment";
      const recordReference = getFirstTextValue([chequeNumber, record?.id]);

      rows.push({
        id: `record-${record?.id || "unknown"}-${index}`,
        requestId: String(record?.id || "-"),
        sourceType: "record",
        vendorName,
        projectName: "-",
        requestType: "General",
        type: "Record Payment",
        purpose,
        billNo: recordReference,
        chequeNumber,
        paidAmount: amount,
        totalRequestAmount: amount,
        salesTax: 0,
        totalBeforeTax: amount,
        remainingBalance: 0,
        paymentDate: recordDate,
        requestDate: recordDate,
        paymentStatus: amount > 0 ? "Paid" : "Unpaid",
        company: "",
        billingAddress: "",
        achInfo,
        notes: [category, description].filter(Boolean).join(" — "),
      });
    });
  });

  return rows;
}

function buildVendorTransactions(
  invoices: any[],
  records: FirestoreRecordData[],
): VendorTransaction[] {
  const rows: VendorTransaction[] = [];

  invoices.forEach((invoice: any) => {
    const requestType = getRequestType(invoice);
    const requestTotalAmount = getTotalRequestAmount(invoice);
    const requestPaidAmount = getRequestPaidAmount(invoice);
    const sourceItems = getSourceItems(invoice);
    const requestDate = getRequestDate(invoice);
    const paymentDate = getPaymentDate(invoice);
    const projectName = getProjectName(invoice);
    const billNo = getBillNumber(invoice);
    const chequeNumber = getChequeNumber(invoice);
    const invoiceVendorName = getInvoiceVendorName(invoice);
    const meta = getVendorMeta(invoice);

    // When supplier names are stored on individual items, every item must use
    // its own supplier. This prevents one supplier from receiving transactions
    // that belong to another supplier in the same request.
    const hasItemLevelVendors = sourceItems.some((item: any) =>
      Boolean(getItemVendorName(item)),
    );

    const validItems = sourceItems.filter((item: any) => {
      const itemVendorName = getItemVendorName(item);
      const vendorName = hasItemLevelVendors
        ? itemVendorName
        : invoiceVendorName;

      return Boolean(vendorName);
    });

    const itemTotalSum = validItems.reduce(
      (sum: number, item: any) => sum + getItemAmount(item),
      0,
    );

    const totalBaseAmount =
      requestTotalAmount > 0
        ? requestTotalAmount
        : itemTotalSum > 0
          ? itemTotalSum
          : 0;

    if (validItems.length > 0) {
      validItems.forEach((item: any, index: number) => {
        const itemVendorName = getItemVendorName(item);
        const vendorName = hasItemLevelVendors
          ? itemVendorName
          : invoiceVendorName;

        if (!vendorName) return;

        const itemAmount =
          getItemAmount(item) ||
          (totalBaseAmount > 0 ? totalBaseAmount / validItems.length : 0);

        const ratio =
          totalBaseAmount > 0 ? Math.min(itemAmount / totalBaseAmount, 1) : 0;

        const paidAmount =
          requestPaidAmount > 0
            ? Math.min(itemAmount, requestPaidAmount * ratio)
            : 0;

        const salesTax = getItemSalesTax(item, invoice) * ratio;
        const totalBeforeTax = Math.max(paidAmount - salesTax, 0);
        const remainingBalance = Math.max(itemAmount - paidAmount, 0);
        const purpose = getPaymentPurpose(invoice, item);

        rows.push({
          id: `${invoice?.id || invoice?.requestId || "request"}-${index}`,
          requestId: String(invoice?.requestId || "-"),
          sourceInvoiceId: String(invoice?.id || ""),
          sourceType: "invoice_request",
          vendorName,
          projectName,
          requestType,
          type: "Bill Payment",
          purpose,
          billNo,
          chequeNumber,
          paidAmount,
          totalRequestAmount: itemAmount,
          salesTax,
          totalBeforeTax,
          remainingBalance,
          paymentDate,
          requestDate,
          paymentStatus: getPaymentStatus(
            invoice,
            paidAmount,
            remainingBalance,
          ),
          company: meta.company,
          billingAddress: meta.billingAddress,
          achInfo: meta.achInfo,
          notes: meta.notes,
        });
      });

      return;
    }

    const vendorName = invoiceVendorName || "Unknown Vendor";
    const paidAmount = requestPaidAmount;
    const salesTax = getItemSalesTax({}, invoice);
    const totalBeforeTax = Math.max(paidAmount - salesTax, 0);
    const remainingBalance = Math.max(requestTotalAmount - paidAmount, 0);
    const purpose = getPaymentPurpose(invoice);

    rows.push({
      id: `${invoice?.id || invoice?.requestId || vendorName}-single`,
      requestId: String(invoice?.requestId || "-"),
      sourceInvoiceId: String(invoice?.id || ""),
      sourceType: "invoice_request",
      vendorName,
      projectName,
      requestType,
      type: "Bill Payment",
      purpose,
      billNo,
      chequeNumber,
      paidAmount,
      totalRequestAmount: requestTotalAmount,
      salesTax,
      totalBeforeTax,
      remainingBalance,
      paymentDate,
      requestDate,
      paymentStatus: getPaymentStatus(invoice, paidAmount, remainingBalance),
      company: meta.company,
      billingAddress: meta.billingAddress,
      achInfo: meta.achInfo,
      notes: meta.notes,
    });
  });

  rows.push(...buildRecordVendorTransactions(records));

  return rows
    .filter((row) => row.vendorName && row.vendorName !== "Unknown Vendor")
    .sort((a, b) => {
      const nameSort = a.vendorName.localeCompare(b.vendorName);
      if (nameSort !== 0) return nameSort;

      const aTime = a.paymentDate?.getTime() || a.requestDate?.getTime() || 0;
      const bTime = b.paymentDate?.getTime() || b.requestDate?.getTime() || 0;

      return bTime - aTime;
    });
}

// ---------------------------------------------------------------------------
// Vendor account statement
// ---------------------------------------------------------------------------

const STATEMENT_PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  cheque: "Cheque",
  bank_transfer: "Bank Transfer",
  wire: "Online Transfer",
  online: "Online Transfer",
};

function getStatementPaymentMethod(value: any) {
  const key = normalizeText(value).replace(/\s+/g, "_");
  return STATEMENT_PAYMENT_METHOD_LABELS[key] || getFirstTextValue([value]);
}

function getReleaseAccountName(entry: any) {
  const account = entry?.selectedAccount || {};
  const name = getFirstTextValue([
    entry?.selectedAccountName,
    account?.accountName,
    account?.accountTitle,
  ]);
  const bank = getFirstTextValue([account?.bankName, account?.bank]);

  if (!name && normalizeText(entry?.paymentMethod) === "cash") return "Cash";

  return [name, bank && bank !== name ? bank : ""].filter(Boolean).join(" · ");
}

function getReleaseReference(entry: any) {
  const cheques = (
    Array.isArray(entry?.chequeNumbers) ? entry.chequeNumbers : []
  )
    .concat(entry?.chequeNumber)
    .map((value: any) => String(value || "").trim())
    .filter(Boolean);

  return Array.from(
    new Set([
      ...cheques.map((cheque: string) => `Cheque ${cheque}`),
      getFirstTextValue([entry?.transactionReference]),
    ]),
  )
    .filter(Boolean)
    .join(" · ");
}

function getProjectCodeValue(source: any) {
  return getFirstTextValue([
    source?.projectCode,
    source?.project_code,
    source?.linkedProjectCode,
  ]);
}

// The request amount this vendor's share is measured against; mirrors the
// totalBaseAmount used by buildVendorTransactions.
function getRequestBaseAmount(invoice: any) {
  const requestTotal = getTotalRequestAmount(invoice);
  if (requestTotal > 0) return requestTotal;

  const items = getSourceItems(invoice);
  const hasItemLevelVendors = items.some((item: any) =>
    Boolean(getItemVendorName(item)),
  );

  return items
    .filter((item: any) =>
      hasItemLevelVendors
        ? Boolean(getItemVendorName(item))
        : Boolean(getInvoiceVendorName(invoice)),
    )
    .reduce((sum: number, item: any) => sum + getItemAmount(item), 0);
}

type StatementPaymentDraft = Omit<
  VendorStatementPayment,
  | "billKey"
  | "sourceLabel"
  | "reference"
  | "projectName"
  | "projectCode"
  | "pendingAfter"
>;

// Builds one vendor's statement from the same transactions the Vendor Summary
// already uses (so the supplier matching and PO/Budget Request de-duplication
// are identical), then expands each bill into its individual payments from the
// payment release history saved on the PO, Budget Request or Record.
function buildVendorStatement({
  supplier,
  vendorName,
  openingBalance,
  vendorTransactions,
  invoices,
  purchaseOrders,
  records,
}: {
  supplier?: FirestoreSupplierData;
  vendorName: string;
  openingBalance: number;
  vendorTransactions: VendorTransaction[];
  invoices: any[];
  purchaseOrders: PurchaseOrder[];
  records: FirestoreRecordData[];
}): VendorStatement {
  const vendorKey = normalizeVendorKey(vendorName);
  const supplierId = String(supplier?.id || "").trim();

  const invoiceLookup = new Map<string, any>();
  invoices.forEach((invoice) => {
    [invoice?.id, invoice?.requestId]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .forEach((key) => invoiceLookup.set(key, invoice));
  });
  const poLookup = new Map(purchaseOrders.map((po) => [String(po.id), po]));
  const recordLookup = new Map(
    records.map((record) => [String(record.id), record]),
  );

  type BillDraft = VendorStatementBill & {
    sourceType: VendorTransaction["sourceType"];
    sourceId: string;
    fallbackPaymentDate: Date | null;
    purposes: string[];
  };

  const bills = new Map<string, BillDraft>();

  vendorTransactions.forEach((transaction) => {
    const sourceId =
      transaction.sourceType === "purchase_order"
        ? String(transaction.sourcePOId || "")
        : transaction.sourceType === "invoice_request"
          ? String(transaction.sourceInvoiceId || transaction.requestId || "")
          : String(transaction.requestId || "");
    const key = `${transaction.sourceType || "bill"}-${sourceId || transaction.id}`;

    const linkedPO =
      transaction.sourceType === "purchase_order"
        ? poLookup.get(sourceId)
        : undefined;
    const linkedInvoice = linkedPO
      ? invoiceLookup.get(String(linkedPO.sourceInvoiceId || "").trim()) ||
        invoiceLookup.get(String(linkedPO.sourceRequestId || "").trim())
      : transaction.sourceType === "invoice_request"
        ? invoiceLookup.get(sourceId)
        : undefined;

    const existing: BillDraft = bills.get(key) || {
      key,
      sourceType: transaction.sourceType,
      sourceId,
      sourceLabel:
        transaction.sourceType === "purchase_order"
          ? "Purchase Order"
          : transaction.sourceType === "record"
            ? "Record"
            : "Budget Request",
      reference: transaction.billNo || transaction.requestId,
      purpose: "",
      purposes: [],
      projectName: transaction.projectName,
      projectCode: getProjectCodeValue(linkedInvoice),
      date: transaction.requestDate,
      fallbackPaymentDate: transaction.paymentDate,
      payable: 0,
      paid: 0,
      pending: 0,
    };

    existing.payable += transaction.totalRequestAmount;
    existing.paid += transaction.paidAmount;
    if (
      transaction.purpose &&
      !existing.purposes.includes(transaction.purpose)
    ) {
      existing.purposes.push(transaction.purpose);
    }
    if (
      transaction.requestDate &&
      (!existing.date || transaction.requestDate < existing.date)
    ) {
      existing.date = transaction.requestDate;
    }

    bills.set(key, existing);
  });

  const payments: VendorStatementPayment[] = [];

  const statementBills = Array.from(bills.values()).map(
    (bill): VendorStatementBill => {
      bill.purpose = bill.purposes.slice(0, 3).join(", ") || bill.reference;
      bill.payable = roundMoney(bill.payable);

      const releaseToDraft = (
        entry: any,
        amount: number,
        index: number,
        isShare = false,
      ): StatementPaymentDraft => ({
        id: `${bill.key}-${entry?.id || index}`,
        date:
          getDateFromValue(entry?.releasedAt) ||
          getDateFromValue(entry?.paymentDate) ||
          bill.fallbackPaymentDate,
        amount: roundMoney(amount),
        purpose:
          getFirstTextValue([entry?.transactionName, entry?.paymentNotes]) ||
          bill.purpose,
        accountName: getReleaseAccountName(entry),
        paymentMethod: getStatementPaymentMethod(entry?.paymentMethod),
        transactionReference: getReleaseReference(entry),
        isShare,
      });

      let drafts: StatementPaymentDraft[] = [];

      if (bill.sourceType === "purchase_order") {
        const po = poLookup.get(bill.sourceId);
        drafts = getPaymentReleaseHistory(po).map((entry, index) =>
          releaseToDraft(entry, getPaymentReleaseAmount(entry), index),
        );
      } else if (bill.sourceType === "invoice_request") {
        const invoice = invoiceLookup.get(bill.sourceId);
        const baseAmount = getRequestBaseAmount(invoice);
        const share =
          baseAmount > 0 ? Math.min(bill.payable / baseAmount, 1) : 1;
        const items = getSourceItems(invoice);

        drafts = getPaymentReleaseHistory(invoice).flatMap((entry, index) => {
          const amount = getPaymentReleaseAmount(entry);

          // Unscoped release: it paid the whole request, so this vendor's
          // portion is its share of the request.
          if (normalizeText(entry?.paymentScope) !== "vendor") {
            return share >= 0.999
              ? [releaseToDraft(entry, amount, index)]
              : [releaseToDraft(entry, amount * share, index, true)];
          }

          const scopedNames = [
            entry?.paymentVendorName,
            ...(Array.isArray(entry?.paymentVendorNames)
              ? entry.paymentVendorNames
              : []),
          ]
            .map(normalizeVendorKey)
            .filter(Boolean);
          const isForVendor =
            Boolean(supplierId && entry?.paymentSupplierId === supplierId) ||
            scopedNames.includes(vendorKey);

          if (!isForVendor) return [];

          // One payment for several local vendors: split by item amounts.
          if (entry?.combinedLocalVendorPayment && scopedNames.length > 1) {
            const coveredAmount = items
              .filter((item: any) =>
                scopedNames.includes(
                  normalizeVendorKey(getItemVendorName(item)),
                ),
              )
              .reduce(
                (sum: number, item: any) => sum + getItemAmount(item),
                0,
              );
            const vendorShare =
              coveredAmount > 0
                ? Math.min(bill.payable / coveredAmount, 1)
                : 0;

            return [releaseToDraft(entry, amount * vendorShare, index, true)];
          }

          return [releaseToDraft(entry, amount, index)];
        });
      } else if (bill.sourceType === "record") {
        const record: any = recordLookup.get(bill.sourceId);

        if (record) {
          drafts = [
            {
              id: `${bill.key}-payment`,
              date:
                getDateFromValue(record?.selectedDate) ||
                getDateFromValue(record?.createdAt) ||
                bill.date,
              amount: bill.payable,
              purpose: bill.purpose,
              accountName: [
                getFirstTextValue([record?.accountTitle]),
                getFirstTextValue([record?.bank, record?.platform]),
              ]
                .filter(Boolean)
                .join(" · "),
              paymentMethod:
                getStatementPaymentMethod(record?.paymentMethod) ||
                (record?.accountType === "online"
                  ? "Online Transfer"
                  : "Cheque"),
              transactionReference: getReleaseReference(record),
              isShare: false,
            },
          ];
        }
      }

      drafts = drafts.filter((draft) => draft.amount > 0.009);

      // Older documents without a payment history still report a paid total;
      // show it as one payment so the statement matches the totals.
      if (drafts.length === 0 && bill.paid > 0.009) {
        drafts = [
          {
            id: `${bill.key}-paid`,
            date: bill.fallbackPaymentDate,
            amount: roundMoney(bill.paid),
            purpose: bill.purpose,
            accountName: "",
            paymentMethod: "",
            transactionReference: "",
            isShare: false,
          },
        ];
      }

      bill.paid = roundMoney(
        drafts.reduce((sum, draft) => sum + draft.amount, 0),
      );
      bill.pending = roundMoney(Math.max(bill.payable - bill.paid, 0));

      let paidSoFar = 0;
      [...drafts]
        .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0))
        .forEach((draft) => {
          paidSoFar += draft.amount;
          payments.push({
            ...draft,
            billKey: bill.key,
            sourceLabel: bill.sourceLabel,
            reference: bill.reference,
            projectName: bill.projectName,
            projectCode: bill.projectCode,
            pendingAfter: roundMoney(Math.max(bill.payable - paidSoFar, 0)),
          });
        });

      return {
        key: bill.key,
        sourceLabel: bill.sourceLabel,
        reference: bill.reference,
        purpose: bill.purpose,
        projectName: bill.projectName,
        projectCode: bill.projectCode,
        date: bill.date,
        payable: bill.payable,
        paid: bill.paid,
        pending: bill.pending,
      };
    },
  );

  return {
    vendorName,
    address: getFirstTextValue([
      supplier?.address,
      [supplier?.city, supplier?.country].filter(Boolean).join(", "),
    ]),
    ntn: getFirstTextValue([supplier?.ntn]),
    paymentTerms: getFirstTextValue([supplier?.paymentTerms]),
    openingBalance,
    bills: statementBills,
    payments,
  };
}

function isWithinDatePreset(row: VendorTransaction, preset: DatePreset) {
  if (preset === "all") return true;

  const date = row.paymentDate || row.requestDate;
  if (!date) return false;

  const now = new Date();

  if (preset === "last30") {
    const start = new Date();
    start.setDate(now.getDate() - 30);
    return date >= start && date <= now;
  }

  if (preset === "thisMonth") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return date >= start && date <= end;
  }

  const start = new Date();
  start.setFullYear(now.getFullYear() - 1);
  return date >= start && date <= now;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export default function VendorSummary() {
  const PANEL_ID = "IEDGE-SYSTEM";
  const { userProfile, currentUser } = useAuth();
  const { toast } = useToast();

  const { data: invoices = [], loading: invoicesLoading } =
    useFirestoreQuery<InvoiceRequest>(`Panels/${PANEL_ID}/invoiceRequests`);
  const { data: purchaseOrders = [], loading: purchaseOrdersLoading } =
    useFirestoreQuery<PurchaseOrder>(`Panels/${PANEL_ID}/PO`);

  const [records, setRecords] = useState<FirestoreRecordData[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<FirestoreSupplierData[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchRecordsAndSuppliers = async () => {
      setRecordsLoading(true);
      setSuppliersLoading(true);

      const [recordResult, supplierResult] = await Promise.allSettled([
        getDocs(collection(db, "Panels", PANEL_ID, "Record")),
        getDocs(collection(db, "Panels", PANEL_ID, "suppliers")),
      ]);

      if (!isMounted) return;

      if (recordResult.status === "fulfilled") {
        const recordRows = recordResult.value.docs.map((document) => ({
          id: document.id,
          ...(document.data() as Omit<FirestoreRecordData, "id">),
          items: Array.isArray(document.data()?.items)
            ? (document.data().items as RecordItem[])
            : [],
        }));
        setRecords(recordRows);
      } else {
        console.error(
          "Failed to load Record data for Vendor Summary:",
          recordResult.reason,
        );
        setRecords([]);
      }

      if (supplierResult.status === "fulfilled") {
        const supplierRows = supplierResult.value.docs.map((document) => ({
          id: document.id,
          ...(document.data() as Omit<FirestoreSupplierData, "id">),
        }));
        setSuppliers(supplierRows);
      } else {
        console.error(
          "Failed to load Supplier data for Vendor Summary:",
          supplierResult.reason,
        );
        setSuppliers([]);
      }

      setRecordsLoading(false);
      setSuppliersLoading(false);
    };

    fetchRecordsAndSuppliers();

    return () => {
      isMounted = false;
    };
  }, [PANEL_ID]);

  const loading =
    invoicesLoading ||
    purchaseOrdersLoading ||
    recordsLoading ||
    suppliersLoading;

  const [supplierSearch, setSupplierSearch] = useState("");
  const [selectedVendorName, setSelectedVendorName] = useState("");
  const [activeTab, setActiveTab] = useState<
    "transactions" | "details" | "notes"
  >("transactions");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [chequeNumberSearch, setChequeNumberSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("last12");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<InvoiceRequest | null>(
    null,
  );
  const [manualPaymentOpen, setManualPaymentOpen] = useState(false);
  const [manualPaymentSaving, setManualPaymentSaving] = useState(false);
  const [manualPaymentLockedPOId, setManualPaymentLockedPOId] = useState("");
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [manualPaymentForm, setManualPaymentForm] = useState({
    amount: "",
    paymentMethod: "bank_transfer" as
      | "cash"
      | "cheque"
      | "bank_transfer"
      | "wire",
    selectedAccountId: "",
    chequeNumber: "",
    transactionName: "",
    transactionReference: "",
    paymentNotes: "",
  });

  const canReleasePayment = canRoleReleasePayment(userProfile?.role);

  function openPaymentRelease(transaction: VendorTransaction) {
    if (!canReleasePayment || transaction.remainingBalance <= 0) return;

    if (transaction.sourceType === "purchase_order" && transaction.sourcePOId) {
      setSelectedVendorName(transaction.vendorName);
      setManualPaymentLockedPOId(transaction.sourcePOId);
      setManualPaymentForm((previous) => ({
        ...previous,
        amount: String(roundMoney(transaction.remainingBalance)),
        transactionName: `PO Payment - ${transaction.billNo || transaction.requestId}`,
      }));
      setManualPaymentOpen(true);
      return;
    }

    const linkedInvoice = (invoices as any[]).find((invoice: any) => {
      const invoiceId = String(invoice?.id || "").trim();
      const requestId = String(invoice?.requestId || "").trim();

      return (
        Boolean(
          transaction.sourceInvoiceId &&
            invoiceId === transaction.sourceInvoiceId,
        ) ||
        Boolean(transaction.requestId && requestId === transaction.requestId)
      );
    });

    if (!linkedInvoice) {
      window.alert(
        "This transaction is not linked to a payable Invoice Request or Purchase Order.",
      );
      return;
    }

    setPaymentInvoice(linkedInvoice as InvoiceRequest);
    setIsPaymentModalOpen(true);
  }

  function closePaymentRelease() {
    setIsPaymentModalOpen(false);
    setPaymentInvoice(null);
  }

  function isReleasable(transaction: VendorTransaction) {
    return (
      canReleasePayment &&
      ["invoice_request", "purchase_order"].includes(
        transaction.sourceType || "",
      ) &&
      transaction.paymentEligible !== false &&
      transaction.remainingBalance > 0
    );
  }

  function renderReleaseAction(transaction: VendorTransaction) {
    if (!isReleasable(transaction)) return null;

    return (
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-7 gap-1 rounded-lg px-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
        onClick={() => openPaymentRelease(transaction)}
        title="Release Payment"
      >
        <HandCoins className="h-3.5 w-3.5" />
        Release payment
      </Button>
    );
  }

  useEffect(() => {
    if (!manualPaymentOpen) return;

    let mounted = true;

    fetchPaymentAccounts()
      .then((accounts) => {
        if (mounted) {
          setPaymentAccounts(
            accounts.filter((account) => account?.isActive !== false),
          );
        }
      })
      .catch((error) => {
        console.error("Failed to load payment accounts:", error);
        if (mounted) {
          toast({
            title: "Payment accounts unavailable",
            description: "The payment can still be recorded as cash.",
            variant: "destructive",
          });
        }
      });

    return () => {
      mounted = false;
    };
  }, [manualPaymentOpen, toast]);

  // Firebase suppliers are the single source of truth for Vendor Summary.
  // Any transaction whose vendor name does not match a saved supplier is ignored.
  const supplierLookup = useMemo(() => {
    const lookup = new Map<string, FirestoreSupplierData>();

    suppliers.forEach((supplier) => {
      const supplierName = getFirstTextValue([supplier?.name]);
      const supplierKey = normalizeVendorKey(supplierName);

      if (!supplierKey) return;

      lookup.set(supplierKey, {
        ...supplier,
        name: supplierName,
      });
    });

    return lookup;
  }, [suppliers]);

  const supplierIdLookup = useMemo(() => {
    const lookup = new Map<string, FirestoreSupplierData>();

    suppliers.forEach((supplier) => {
      if (supplier?.id) lookup.set(String(supplier.id), supplier);
    });

    return lookup;
  }, [suppliers]);

  const transactions = useMemo(() => {
    const linkedInvoiceKeys = new Set(
      (purchaseOrders as PurchaseOrder[])
        .flatMap((po) => [po?.sourceInvoiceId, po?.sourceRequestId])
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    );

    const nonDuplicateInvoiceAndRecordTransactions = buildVendorTransactions(
      invoices as any[],
      records,
    ).filter((transaction) => {
      if (transaction.sourceType !== "invoice_request") return true;

      const invoiceId = String(transaction.sourceInvoiceId || "").trim();
      const requestId = String(transaction.requestId || "").trim();

      // Once an Invoice Request has produced a PO, the PO becomes the payable
      // document. Hiding the original request prevents the same liability from
      // being counted twice in the vendor balance.
      return (
        !linkedInvoiceKeys.has(invoiceId) && !linkedInvoiceKeys.has(requestId)
      );
    });

    const allTransactions = [
      ...nonDuplicateInvoiceAndRecordTransactions,
      ...buildPurchaseOrderVendorTransactions(
        purchaseOrders as PurchaseOrder[],
      ),
    ];

    return allTransactions.flatMap((transaction) => {
      const supplier =
        (transaction.sourceSupplierId
          ? supplierIdLookup.get(String(transaction.sourceSupplierId))
          : undefined) ||
        supplierLookup.get(normalizeVendorKey(transaction.vendorName));

      // Do not display invoice, PO, payment, or Record data for a vendor
      // unless that supplier exists in the Firebase suppliers collection.
      if (!supplier) return [];

      return [
        {
          ...transaction,
          // Always display the exact supplier name saved in Firebase.
          vendorName: supplier.name,
        },
      ];
    });
  }, [invoices, purchaseOrders, records, supplierIdLookup, supplierLookup]);

  const filteredTransactions = useMemo(() => {
    const chequeSearch = normalizeText(chequeNumberSearch);

    return transactions.filter((transaction) => {
      const matchesType =
        typeFilter === "all" ||
        normalizeText(transaction.requestType) === typeFilter;

      const matchesCheque =
        !chequeSearch ||
        normalizeText(transaction.chequeNumber).includes(chequeSearch);

      return matchesType && matchesCheque;
    });
  }, [transactions, typeFilter, chequeNumberSearch]);

  const vendorSummaries = useMemo<VendorSummaryItem[]>(() => {
    const map = new Map<string, VendorSummaryItem>();
    const today = new Date();

    suppliers.forEach((supplier) => {
      const vendorName = getFirstTextValue([supplier?.name]);
      if (!vendorName) return;

      map.set(normalizeVendorKey(vendorName), {
        vendorName,
        paidAmount: 0,
        openingBalance: safeNumber(supplier?.openingBalance),
        openBalance: 0,
        overduePayment: 0,
        transactionCount: 0,
        company: "",
        billingAddress: getFirstTextValue([
          supplier?.address,
          [supplier?.city, supplier?.country].filter(Boolean).join(", "),
        ]),
        achInfo: getFirstTextValue([
          supplier?.paymentTerms
            ? `Payment Terms: ${supplier.paymentTerms}`
            : "",
          supplier?.ntn ? `NTN: ${supplier.ntn}` : "",
        ]),
        notes: getFirstTextValue([supplier?.notes]),
      });
    });

    filteredTransactions.forEach((transaction) => {
      const vendorKey = normalizeVendorKey(transaction.vendorName);
      const supplier = supplierLookup.get(vendorKey);
      const existing = map.get(vendorKey);

      // This guard prevents a transaction from creating a vendor summary.
      // Only suppliers already loaded from Firebase can exist in the map.
      if (!supplier || !existing) return;

      existing.paidAmount += transaction.paidAmount;
      existing.openBalance += transaction.remainingBalance;
      existing.transactionCount += 1;

      const relatedInvoice = (invoices as any[]).find(
        (invoice: any) =>
          String(invoice?.requestId || "") === transaction.requestId,
      );

      const dueDate = getDueDate(relatedInvoice);

      if (
        transaction.remainingBalance > 0 &&
        (!dueDate || dueDate.getTime() <= today.getTime())
      ) {
        existing.overduePayment += transaction.remainingBalance;
      }

      if (!existing.company && transaction.company) {
        existing.company = transaction.company;
      }

      if (!existing.billingAddress && transaction.billingAddress) {
        existing.billingAddress = transaction.billingAddress;
      }

      if (!existing.achInfo && transaction.achInfo) {
        existing.achInfo = transaction.achInfo;
      }

      if (!existing.notes && transaction.notes) {
        existing.notes = transaction.notes;
      }

      map.set(vendorKey, existing);
    });

    return Array.from(map.values()).sort((a, b) =>
      a.vendorName.localeCompare(b.vendorName),
    );
  }, [filteredTransactions, invoices, supplierLookup, suppliers]);

  const filteredVendorSummaries = useMemo(() => {
    const search = normalizeText(supplierSearch);

    return vendorSummaries.filter((vendor) => {
      if (!search) return true;

      return normalizeText(
        [
          vendor.vendorName,
          vendor.company,
          vendor.billingAddress,
          vendor.notes,
        ].join(" "),
      ).includes(search);
    });
  }, [vendorSummaries, supplierSearch]);

  useEffect(() => {
    if (selectedVendorName) {
      const exists = filteredVendorSummaries.some(
        (vendor) => vendor.vendorName === selectedVendorName,
      );

      if (exists) return;
    }

    setSelectedVendorName(filteredVendorSummaries[0]?.vendorName || "");
  }, [filteredVendorSummaries, selectedVendorName]);

  const selectedVendor =
    filteredVendorSummaries.find(
      (vendor) => vendor.vendorName === selectedVendorName,
    ) || filteredVendorSummaries[0];

  const selectedVendorKey = useMemo(() => {
    return normalizeVendorKey(selectedVendor?.vendorName);
  }, [selectedVendor?.vendorName]);

  const selectedSupplier = useMemo(() => {
    if (!selectedVendorKey) return undefined;
    return supplierLookup.get(selectedVendorKey);
  }, [selectedVendorKey, supplierLookup]);

  const [statementOpen, setStatementOpen] = useState(false);

  // Built only for the open statement, from all of the vendor's transactions
  // (the page's type and cheque filters do not apply to the statement).
  const vendorStatement = useMemo<VendorStatement | null>(() => {
    if (!statementOpen || !selectedVendor || !selectedVendorKey) return null;

    return buildVendorStatement({
      supplier: selectedSupplier,
      vendorName: selectedVendor.vendorName,
      openingBalance: selectedVendor.openingBalance,
      vendorTransactions: transactions.filter(
        (transaction) =>
          normalizeVendorKey(transaction.vendorName) === selectedVendorKey,
      ),
      invoices: invoices as any[],
      purchaseOrders: purchaseOrders as PurchaseOrder[],
      records,
    });
  }, [
    statementOpen,
    selectedVendor,
    selectedVendorKey,
    selectedSupplier,
    transactions,
    invoices,
    purchaseOrders,
    records,
  ]);

  const selectedVendorPurchaseOrders = useMemo(() => {
    if (!selectedVendorKey) return [];

    const selectedSupplierId = String(selectedSupplier?.id || "").trim();

    return (purchaseOrders as PurchaseOrder[]).filter((po) => {
      const poSupplierId = String(po?.supplierId || "").trim();
      const matchesSupplierId = Boolean(
        selectedSupplierId &&
          poSupplierId &&
          poSupplierId === selectedSupplierId,
      );
      const matchesSupplierName =
        normalizeVendorKey(po?.supplierName) === selectedVendorKey;

      return matchesSupplierId || matchesSupplierName;
    });
  }, [purchaseOrders, selectedSupplier?.id, selectedVendorKey]);

  const payableVendorPurchaseOrders = useMemo(() => {
    return selectedVendorPurchaseOrders
      .filter(
        (po) =>
          isPurchaseOrderPayable(po) &&
          getPurchaseOrderRemainingAmount(po) > 0.009 &&
          (!manualPaymentLockedPOId || po.id === manualPaymentLockedPOId),
      )
      .sort((a, b) => {
        const dateDifference =
          getPurchaseOrderSortTime(a) - getPurchaseOrderSortTime(b);
        return dateDifference || String(a.id).localeCompare(String(b.id));
      });
  }, [selectedVendorPurchaseOrders, manualPaymentLockedPOId]);

  const payableVendorOutstanding = useMemo(
    () =>
      roundMoney(
        payableVendorPurchaseOrders.reduce(
          (sum, po) => sum + getPurchaseOrderRemainingAmount(po),
          0,
        ),
      ),
    [payableVendorPurchaseOrders],
  );

  const manualPaymentAmount = roundMoney(manualPaymentForm.amount);
  const manualPaymentAllocations = useMemo(
    () =>
      allocatePurchaseOrderPaymentFIFO(
        payableVendorPurchaseOrders,
        manualPaymentAmount,
      ),
    [payableVendorPurchaseOrders, manualPaymentAmount],
  );

  function openVendorManualPayment() {
    if (!selectedVendor) return;

    if (payableVendorOutstanding <= 0.009) {
      const outstandingPOs = selectedVendorPurchaseOrders.filter(
        (po) => getPurchaseOrderRemainingAmount(po) > 0.009,
      );

      if (outstandingPOs.length > 0) {
        toast({
          title: "PO approval required",
          description:
            "This vendor has outstanding POs, but none are fully approved yet. Complete the PO approval workflow before releasing payment.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "No outstanding POs",
          description:
            "This vendor has no unpaid purchase orders available for FIFO payment.",
        });
      }
      return;
    }

    setManualPaymentLockedPOId("");
    setManualPaymentForm((previous) => ({
      ...previous,
      amount: "",
      transactionName: `Manual PO Payment - ${selectedVendor.vendorName}`,
    }));
    setManualPaymentOpen(true);
  }

  function closeManualPayment() {
    if (manualPaymentSaving) return;
    setManualPaymentOpen(false);
    setManualPaymentLockedPOId("");
    setManualPaymentForm({
      amount: "",
      paymentMethod: "bank_transfer",
      selectedAccountId: "",
      chequeNumber: "",
      transactionName: "",
      transactionReference: "",
      paymentNotes: "",
    });
  }

  async function saveManualPurchaseOrderPayment() {
    if (!selectedVendor) return;

    if (payableVendorPurchaseOrders.length === 0) {
      toast({
        title: "No payable POs",
        description:
          "This vendor has no approved purchase orders with an outstanding balance.",
        variant: "destructive",
      });
      return;
    }

    if (manualPaymentAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Enter a payment amount greater than zero.",
        variant: "destructive",
      });
      return;
    }

    if (manualPaymentAmount > payableVendorOutstanding + 0.009) {
      toast({
        title: "Amount exceeds outstanding balance",
        description: `The maximum payable amount is ${formatCurrency(
          payableVendorOutstanding,
        )}.`,
        variant: "destructive",
      });
      return;
    }

    const selectedAccount = paymentAccounts.find(
      (account) => account.id === manualPaymentForm.selectedAccountId,
    );

    if (
      manualPaymentForm.paymentMethod !== "cash" &&
      !manualPaymentForm.selectedAccountId
    ) {
      toast({
        title: "Account required",
        description: "Select the account used for this payment.",
        variant: "destructive",
      });
      return;
    }

    if (
      manualPaymentForm.paymentMethod === "cheque" &&
      !manualPaymentForm.chequeNumber.trim()
    ) {
      toast({
        title: "Cheque number required",
        description: "Enter the cheque number before saving.",
        variant: "destructive",
      });
      return;
    }

    const allocations = manualPaymentAllocations.filter(
      (allocation) => allocation.allocatedAmount > 0.009,
    );
    const allocatedTotal = roundMoney(
      allocations.reduce(
        (sum, allocation) => sum + allocation.allocatedAmount,
        0,
      ),
    );

    if (Math.abs(allocatedTotal - manualPaymentAmount) > 0.009) {
      toast({
        title: "Allocation failed",
        description:
          "The payment could not be fully allocated to the selected POs.",
        variant: "destructive",
      });
      return;
    }

    try {
      setManualPaymentSaving(true);

      const batch = writeBatch(db);
      const paymentRecordRef = doc(
        collection(db, "Panels", PANEL_ID, "Record"),
      );
      const paymentId = paymentRecordRef.id;
      const paymentDate = new Date();
      const actorName =
        userProfile?.displayName ||
        currentUser?.displayName ||
        currentUser?.email ||
        "Unknown";
      const actorId = userProfile?.id || currentUser?.uid || "";
      const actorEmail = currentUser?.email || userProfile?.email || "";
      const accountName = getFirstTextValue([
        (selectedAccount as any)?.accountName,
        (selectedAccount as any)?.accountTitle,
        (selectedAccount as any)?.bankName,
      ]);
      const accountNumber = getFirstTextValue([
        (selectedAccount as any)?.accountNumber,
        (selectedAccount as any)?.accountNo,
      ]);
      const bankName = getFirstTextValue([
        (selectedAccount as any)?.bankName,
        (selectedAccount as any)?.bank,
        (selectedAccount as any)?.platform,
      ]);

      allocations.forEach((allocation, index) => {
        const po = allocation.po;
        const existingHistory = getPaymentReleaseHistory(po);
        const releasedBefore = getPurchaseOrderReleasedAmount(po);
        const releasedAfter = roundMoney(
          releasedBefore + allocation.allocatedAmount,
        );
        const remainingAfter = roundMoney(allocation.remainingBalance);
        const approvedAmount = getPurchaseOrderAmount(po);
        const isFullyPaid = remainingAfter <= 0.009;
        const releaseEntry = {
          id: `${paymentId}-${index + 1}`,
          manualBatchPaymentId: paymentId,
          fifoSequence: index + 1,
          releaseType:
            releasedBefore <= 0
              ? isFullyPaid
                ? "full"
                : "advance"
              : isFullyPaid
                ? "final"
                : "partial",
          paymentMethod: manualPaymentForm.paymentMethod,
          amount: allocation.allocatedAmount,
          approvedAmount,
          releasedBefore,
          releasedAfter,
          remainingAfter,
          supplierName: selectedVendor.vendorName,
          parties: [selectedVendor.vendorName],
          transactionName: manualPaymentForm.transactionName.trim(),
          transactionReference: manualPaymentForm.transactionReference.trim(),
          paymentNotes: manualPaymentForm.paymentNotes.trim(),
          chequeNumber: manualPaymentForm.chequeNumber.trim(),
          chequeNumbers: manualPaymentForm.chequeNumber.trim()
            ? [manualPaymentForm.chequeNumber.trim()]
            : [],
          selectedAccount: selectedAccount || null,
          selectedAccountId: selectedAccount?.id || "",
          selectedAccountName: accountName,
          releasedBy: actorId,
          releasedByName: actorName,
          releasedByEmail: actorEmail,
          releasedAt: paymentDate,
          sourceType: "purchase_order",
          sourceId: po.id,
          poNumber: po.poNumber || "",
          allocationMethod: "FIFO",
        };

        const updateData: Record<string, any> = {
          status: isFullyPaid ? "Paid" : "Open",
          poPaymentStatus: isFullyPaid ? "paid" : "partially_paid",
          paymentStatus: isFullyPaid ? "released" : "partial",
          paymentReleased: isFullyPaid,
          paymentPartiallyReleased: !isFullyPaid,
          releasePaymentCreated: true,
          totalApprovedAmount: approvedAmount,
          totalReleasedAmount: releasedAfter,
          remainingReleaseAmount: remainingAfter,
          transactionName: releaseEntry.transactionName,
          latestTransactionName: releaseEntry.transactionName,
          latestPaymentRelease: releaseEntry,
          paymentDetails: releaseEntry,
          paymentReleaseHistory: [...existingHistory, releaseEntry],
          isClosed: isFullyPaid,
          closedAt: isFullyPaid ? paymentDate : null,
          updatedAt: serverTimestamp(),
        };

        if (isFullyPaid) {
          updateData.paymentReleasedAt = paymentDate;
          updateData.releasePaymentAt = paymentDate;
          updateData.paymentFullyReleasedAt = paymentDate;
        } else {
          updateData.partialPaymentReleasedAt = paymentDate;
        }

        batch.update(doc(db, "Panels", PANEL_ID, "PO", po.id), updateData);
      });

      const dateText = paymentDate.toISOString().slice(0, 10);

      batch.set(paymentRecordRef, {
        firebasePath: "/Panels/IEDGE-SYSTEM/Record",
        sourceType: "po_manual_payment",
        manualPayment: true,
        allocationMethod: "FIFO",
        vendorName: selectedVendor.vendorName,
        selectedDate: dateText,
        chequeDate: dateText,
        accountId: selectedAccount?.id || "",
        accountType:
          manualPaymentForm.paymentMethod === "cheque" ? "cheque" : "online",
        accountTitle: accountName,
        accountNo: accountNumber,
        bank: bankName,
        platform: bankName,
        chequeNumber: manualPaymentForm.chequeNumber.trim(),
        statementTitle:
          manualPaymentForm.transactionName.trim() ||
          `Manual PO Payment - ${selectedVendor.vendorName}`,
        chequeAmount: manualPaymentAmount,
        totalItemAmount: manualPaymentAmount,
        remainingBalance: 0,
        paymentMethod: manualPaymentForm.paymentMethod,
        transactionReference: manualPaymentForm.transactionReference.trim(),
        paymentNotes: manualPaymentForm.paymentNotes.trim(),
        items: allocations.map((allocation, index) => ({
          category: "Purchase Order Payment",
          name: selectedVendor.vendorName,
          amount: allocation.allocatedAmount,
          description: `FIFO ${index + 1}: ${
            allocation.po.poNumber || allocation.po.id
          } | Before ${formatCurrency(
            allocation.openingBalance,
          )} | Paid ${formatCurrency(
            allocation.allocatedAmount,
          )} | Remaining ${formatCurrency(allocation.remainingBalance)}`,
          poId: allocation.po.id,
          poNumber: allocation.po.poNumber || "",
        })),
        poAllocations: allocations.map((allocation, index) => ({
          sequence: index + 1,
          poId: allocation.po.id,
          poNumber: allocation.po.poNumber || "",
          openingBalance: allocation.openingBalance,
          allocatedAmount: allocation.allocatedAmount,
          remainingBalance: allocation.remainingBalance,
          fullyPaid: allocation.remainingBalance <= 0.009,
        })),
        createdBy: actorId,
        createdByName: actorName,
        createdByEmail: actorEmail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "recorded",
      });

      await batch.commit();

      toast({
        title: "Manual payment saved",
        description: `${formatCurrency(
          manualPaymentAmount,
        )} was allocated to ${allocations.length} PO${
          allocations.length === 1 ? "" : "s"
        } using FIFO. One debit record was added to Account Statement.`,
      });

      setManualPaymentOpen(false);
      setManualPaymentLockedPOId("");
      setManualPaymentForm({
        amount: "",
        paymentMethod: "bank_transfer",
        selectedAccountId: "",
        chequeNumber: "",
        transactionName: "",
        transactionReference: "",
        paymentNotes: "",
      });
    } catch (error: any) {
      console.error("Failed to save manual FIFO payment:", error);
      toast({
        title: "Payment failed",
        description: error?.message || "The manual payment could not be saved.",
        variant: "destructive",
      });
    } finally {
      setManualPaymentSaving(false);
    }
  }

  const selectedTransactions = useMemo(() => {
    if (!selectedVendorKey) return [];

    return filteredTransactions
      .filter(
        (transaction) =>
          normalizeVendorKey(transaction.vendorName) === selectedVendorKey,
      )
      .filter((transaction) => isWithinDatePreset(transaction, datePreset))
      .sort((a, b) => {
        const aTime = a.paymentDate?.getTime() || a.requestDate?.getTime() || 0;
        const bTime = b.paymentDate?.getTime() || b.requestDate?.getTime() || 0;

        return bTime - aTime;
      });
  }, [filteredTransactions, selectedVendorKey, datePreset]);

  const selectedTransactionTotals = useMemo(() => {
    return selectedTransactions.reduce(
      (totals, transaction) => {
        totals.paidAmount += transaction.paidAmount;
        totals.remainingBalance += transaction.remainingBalance;
        return totals;
      },
      { paidAmount: 0, remainingBalance: 0 },
    );
  }, [selectedTransactions]);

  const handleDownloadVendorSummary = () => {
    if (!selectedVendor) return;

    if (selectedTransactions.length === 0) {
      window.alert(
        "No transactions are available to download for this vendor.",
      );
      return;
    }

    const headers = [
      "Vendor Name",
      "Transaction Type",
      "Payment Purpose",
      "Request Type",
      "Project Name",
      "Reference / Bill No",
      "Cheque Number",
      "Supplier Opening Balance",
      "Paid Amount",
      "Remaining Amount",
      "Payment Date",
      "Payment Status",
      "Notes",
    ];

    const rows = selectedTransactions.map((transaction) => [
      transaction.vendorName,
      transaction.type,
      transaction.purpose,
      transaction.requestType,
      transaction.projectName,
      transaction.billNo || transaction.requestId,
      transaction.chequeNumber,
      selectedVendor.openingBalance.toFixed(2),
      transaction.paidAmount.toFixed(2),
      transaction.remainingBalance.toFixed(2),
      formatDate(transaction.paymentDate || transaction.requestDate),
      transaction.paymentStatus,
      transaction.notes,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fileDate = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `${sanitizeFileName(
      selectedVendor.vendorName,
    )}-vendor-summary-${fileDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handlePrintVendorSummary = () => {
    if (!selectedVendor) return;

    if (selectedTransactions.length === 0) {
      window.alert("No transactions are available to print for this vendor.");
      return;
    }

    const printWindow = window.open(
      "",
      "_blank",
      "width=1200,height=850,scrollbars=yes,resizable=yes",
    );

    if (!printWindow) {
      window.alert(
        "The print window was blocked. Please allow pop-ups and try again.",
      );
      return;
    }

    const transactionRows = selectedTransactions
      .map(
        (transaction, index) => `
          <tr>
            <td class="number-cell">${index + 1}</td>
            <td>
              <strong>${escapeHtml(transaction.type)}</strong>
              <span class="secondary">${escapeHtml(
                transaction.billNo || transaction.requestId || "-",
              )}</span>
            </td>
            <td>${escapeHtml(transaction.purpose || "-")}</td>
            <td>${escapeHtml(transaction.requestType)}</td>
            <td>${escapeHtml(transaction.projectName || "-")}</td>
            <td>${escapeHtml(transaction.chequeNumber || "-")}</td>
            <td class="amount-cell">${escapeHtml(
              formatCurrency(transaction.paidAmount),
            )}</td>
            <td class="amount-cell">${escapeHtml(
              formatCurrency(transaction.remainingBalance),
            )}</td>
            <td>${escapeHtml(
              formatDate(transaction.paymentDate || transaction.requestDate),
            )}</td>
            <td>
              <span class="status status-${escapeHtml(
                normalizeText(transaction.paymentStatus).replace(/\s+/g, "-"),
              )}">
                ${escapeHtml(transaction.paymentStatus)}
              </span>
            </td>
          </tr>
        `,
      )
      .join("");

    const generatedAt = new Date().toLocaleString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const printDocument = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${escapeHtml(selectedVendor.vendorName)} - Vendor Summary</title>
          <style>
            :root {
              --ink: #0f172a;
              --muted: #64748b;
              --border: #e2e8f0;
              --surface: #f8fafc;
              --accent: #059669;
              --accent-soft: #ecfdf5;
            }

            * { box-sizing: border-box; }

            html, body {
              margin: 0;
              padding: 0;
              color: var(--ink);
              background: white;
              font-family: Inter, "Segoe UI", Arial, sans-serif;
              font-size: 12px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            body { padding: 24px; }

            .document {
              width: 100%;
              max-width: 1120px;
              margin: 0 auto;
              border: 1px solid var(--border);
              border-radius: 18px;
              overflow: hidden;
            }

            .header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 30px;
              padding: 28px 32px;
              background: #0f172a;
              color: white;
            }

            .eyebrow {
              margin: 0 0 8px;
              color: #6ee7b7;
              font-size: 10px;
              font-weight: 800;
              letter-spacing: .18em;
              text-transform: uppercase;
            }

            h1 {
              margin: 0;
              font-size: 28px;
              line-height: 1.15;
            }

            .subtitle {
              margin: 8px 0 0;
              color: #cbd5e1;
              font-size: 11px;
            }

            .brand {
              text-align: right;
              white-space: nowrap;
            }

            .brand strong {
              display: block;
              font-size: 16px;
              letter-spacing: .05em;
            }

            .brand span {
              display: block;
              margin-top: 5px;
              color: #94a3b8;
              font-size: 9px;
              letter-spacing: .12em;
              text-transform: uppercase;
            }

            .content { padding: 26px 32px 32px; }

            .summary-grid {
              display: grid;
              grid-template-columns: repeat(5, minmax(0, 1fr));
              gap: 12px;
              margin-bottom: 24px;
            }

            .summary-card {
              padding: 15px;
              border: 1px solid var(--border);
              border-radius: 12px;
              background: var(--surface);
            }

            .summary-card span {
              display: block;
              color: var(--muted);
              font-size: 9px;
              font-weight: 700;
              letter-spacing: .05em;
              text-transform: uppercase;
            }

            .summary-card strong {
              display: block;
              margin-top: 7px;
              font-size: 15px;
            }

            .summary-card.accent {
              border-color: #a7f3d0;
              background: var(--accent-soft);
            }

            .summary-card.accent strong { color: #047857; }

            .section-title {
              margin: 0 0 11px;
              font-size: 14px;
            }

            .table-wrap {
              overflow: hidden;
              border: 1px solid var(--border);
              border-radius: 12px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            thead { background: var(--surface); }

            th {
              padding: 11px 10px;
              color: #475569;
              font-size: 8px;
              font-weight: 800;
              letter-spacing: .06em;
              text-align: left;
              text-transform: uppercase;
            }

            td {
              padding: 12px 10px;
              border-top: 1px solid var(--border);
              vertical-align: top;
            }

            .number-cell {
              width: 38px;
              color: var(--muted);
              text-align: center;
            }

            .amount-cell {
              font-weight: 700;
              text-align: right;
              white-space: nowrap;
            }

            .secondary {
              display: block;
              margin-top: 3px;
              color: var(--muted);
              font-size: 9px;
            }

            .status {
              display: inline-flex;
              padding: 4px 8px;
              border: 1px solid var(--border);
              border-radius: 999px;
              background: var(--surface);
              font-size: 9px;
              font-weight: 700;
              white-space: nowrap;
            }

            .status-paid {
              border-color: #a7f3d0;
              background: #ecfdf5;
              color: #047857;
            }

            .status-partially-paid {
              border-color: #bfdbfe;
              background: #eff6ff;
              color: #1d4ed8;
            }

            .status-pending {
              border-color: #fde68a;
              background: #fffbeb;
              color: #b45309;
            }

            .footer {
              display: flex;
              justify-content: space-between;
              gap: 16px;
              margin-top: 22px;
              padding-top: 15px;
              border-top: 1px solid var(--border);
              color: var(--muted);
              font-size: 9px;
            }

            @page { size: A4 landscape; margin: 9mm; }

            @media print {
              body { padding: 0; }
              .document { max-width: none; border: none; border-radius: 0; }
              thead { display: table-header-group; }
              tr, .summary-card { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <main class="document">
            <header class="header">
              <div>
                <p class="eyebrow">Vendor Payment Statement</p>
                <h1>${escapeHtml(selectedVendor.vendorName)}</h1>
                <p class="subtitle">
                  Filtered transaction history from Invoice Requests and Records.
                </p>
              </div>
              <div class="brand">
                <strong>IEDGE SYSTEM</strong>
                <span>Financial Records Management</span>
              </div>
            </header>

            <div class="content">
              <section class="summary-grid">
                <div class="summary-card">
                  <span>Opening Balance</span>
                  <strong>${escapeHtml(
                    formatCurrency(selectedVendor.openingBalance),
                  )}</strong>
                </div>
                <div class="summary-card accent">
                  <span>Total Amount Paid</span>
                  <strong>${escapeHtml(
                    formatCurrency(selectedTransactionTotals.paidAmount),
                  )}</strong>
                </div>
                <div class="summary-card">
                  <span>Remaining Amount</span>
                  <strong>${escapeHtml(
                    formatCurrency(selectedTransactionTotals.remainingBalance),
                  )}</strong>
                </div>
                <div class="summary-card">
                  <span>Transactions Shown</span>
                  <strong>${selectedTransactions.length}</strong>
                </div>
                <div class="summary-card">
                  <span>Date Filter</span>
                  <strong>${escapeHtml(
                    datePreset === "last12"
                      ? "Last 12 months"
                      : datePreset === "last30"
                        ? "Last 30 days"
                        : datePreset === "thisMonth"
                          ? "This month"
                          : "All dates",
                  )}</strong>
                </div>
              </section>

              <h2 class="section-title">Transaction Details</h2>

              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Transaction</th>
                      <th>Purpose</th>
                      <th>Type</th>
                      <th>Project</th>
                      <th>Cheque Number</th>
                      <th style="text-align:right">Paid</th>
                      <th style="text-align:right">Remaining</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>${transactionRows}</tbody>
                </table>
              </div>

              <footer class="footer">
                <span>Generated ${escapeHtml(generatedAt)}</span>
                <span>IEDGE SYSTEM · Internal Financial Document</span>
              </footer>
            </div>
          </main>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printDocument);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      window.setTimeout(() => printWindow.print(), 250);
    };
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-3xl border border-slate-200 bg-white px-8 py-7 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
          <p className="mt-4 text-sm font-medium text-slate-700">
            Loading vendor payments, records, and suppliers...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 p-3 text-slate-900 sm:p-5">
      {/* Below xl the vendor list stacks above the details; from xl up they sit
          side by side and each scrolls on its own. */}
      <div className="mx-auto flex min-w-0 flex-col gap-4 xl:h-[calc(100vh-40px)] xl:flex-row xl:gap-5 xl:overflow-hidden">
        <aside className="flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white xl:w-72 xl:shrink-0">
          <div className="border-b border-slate-100 p-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Vendors</h2>
              <span className="text-xs text-slate-400">
                {filteredVendorSummaries.length}
              </span>
            </div>

            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={supplierSearch}
                onChange={(event) => setSupplierSearch(event.target.value)}
                placeholder="Search vendors"
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
              />
            </div>
          </div>

          <div className="max-h-[320px] flex-1 overflow-y-auto p-2 xl:max-h-none">
            {filteredVendorSummaries.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-slate-400">
                No vendors found
              </p>
            ) : (
              filteredVendorSummaries.map((vendor) => {
                const isActive =
                  vendor.vendorName === selectedVendor?.vendorName;

                return (
                  <button
                    key={vendor.vendorName}
                    type="button"
                    onClick={() => {
                      setSelectedVendorName(vendor.vendorName);
                      setActiveTab("transactions");
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                      isActive ? "bg-slate-100" : "hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        isActive
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {getInitials(vendor.vendorName) || "V"}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-900">
                        {vendor.vendorName}
                      </span>
                      {vendor.company && (
                        <span className="block truncate text-xs text-slate-400">
                          {vendor.company}
                        </span>
                      )}
                    </span>

                    <span
                      className={`shrink-0 text-xs font-medium tabular-nums ${
                        vendor.openBalance > 0.009
                          ? "text-amber-700"
                          : "text-slate-400"
                      }`}
                      title="Remaining amount"
                    >
                      {formatPKR(vendor.openBalance)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <main className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white xl:overflow-y-auto">
          {!selectedVendor ? (
            <div className="flex h-full min-h-[320px] items-center justify-center p-10">
              <div className="max-w-sm text-center">
                <Wallet className="mx-auto h-6 w-6 text-slate-300" />
                <h2 className="mt-3 text-base font-semibold text-slate-900">
                  No vendor payment records found
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Only suppliers saved in Firebase appear here, with their
                  Purchase Orders, Budget Requests and Records.
                </p>
              </div>
            </div>
          ) : (
            <>
              <header className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                    {getInitials(selectedVendor.vendorName) || "V"}
                  </span>
                  <div className="min-w-0">
                    <h1 className="break-words text-xl font-semibold tracking-tight text-slate-950">
                      {selectedVendor.vendorName}
                    </h1>
                    <p className="truncate text-sm text-slate-500">
                      {[selectedVendor.company, selectedVendor.billingAddress]
                        .filter(Boolean)
                        .join(" · ") || "Vendor"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setStatementOpen(true)}
                    className="gap-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                    data-testid="button-vendor-account-statement"
                  >
                    <ScrollText className="h-4 w-4" />
                    Account Statement
                  </Button>

                  {canReleasePayment && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={openVendorManualPayment}
                      className="gap-1.5 rounded-lg"
                      title={
                        payableVendorOutstanding > 0.009
                          ? "Allocate one payment across this vendor's oldest unpaid POs"
                          : "Click to see why this vendor currently has no payable approved POs"
                      }
                    >
                      <HandCoins className="h-4 w-4" />
                      Manual Payment
                    </Button>
                  )}

                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={handleDownloadVendorSummary}
                    disabled={selectedTransactions.length === 0}
                    className="h-9 w-9 rounded-lg text-slate-500"
                    title="Download filtered transactions as CSV"
                    aria-label="Download filtered transactions as CSV"
                  >
                    <Download className="h-4 w-4" />
                  </Button>

                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={handlePrintVendorSummary}
                    disabled={selectedTransactions.length === 0}
                    className="h-9 w-9 rounded-lg text-slate-500"
                    title="Print the filtered vendor summary"
                    aria-label="Print the filtered vendor summary"
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                </div>
              </header>

              <div className="grid grid-cols-1 divide-y divide-slate-100 border-b border-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {[
                  {
                    label: "Opening balance",
                    value: selectedVendor.openingBalance,
                    tone: "text-slate-900",
                  },
                  {
                    label: "Total paid",
                    value: selectedVendor.paidAmount,
                    tone: "text-emerald-700",
                  },
                  {
                    label: "Remaining",
                    value: selectedVendor.openBalance,
                    tone:
                      selectedVendor.openBalance > 0.009
                        ? "text-amber-700"
                        : "text-slate-900",
                  },
                ].map((stat) => (
                  <div key={stat.label} className="min-w-0 px-4 py-4 sm:px-6">
                    <p className="text-xs text-slate-500">{stat.label}</p>
                    <p
                      className={`mt-1 break-words text-lg font-semibold tabular-nums ${stat.tone}`}
                    >
                      {formatCurrency(stat.value)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 border-b border-slate-100 px-4 pt-3 sm:px-6 2xl:flex-row 2xl:items-end 2xl:justify-between">
                <nav className="flex gap-5 text-sm">
                  {[
                    {
                      key: "transactions",
                      label: "Transactions",
                      count: selectedTransactions.length,
                    },
                    { key: "details", label: "Details" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() =>
                        setActiveTab(tab.key as "transactions" | "details")
                      }
                      className={`-mb-px border-b-2 pb-3 font-medium transition ${
                        activeTab === tab.key
                          ? "border-slate-900 text-slate-900"
                          : "border-transparent text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {tab.label}
                      {tab.count !== undefined && (
                        <span className="ml-1.5 text-xs text-slate-400">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>

                {activeTab === "transactions" && (
                  <div className="grid grid-cols-2 gap-2 pb-3 sm:flex sm:flex-wrap sm:items-center [&>*]:min-w-0">
                    <select
                      value={typeFilter}
                      onChange={(event) =>
                        setTypeFilter(event.target.value as TypeFilter)
                      }
                      className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-300"
                    >
                      <option value="all">All types</option>
                      <option value="general">General</option>
                      <option value="project">Project</option>
                    </select>

                    <select
                      value={datePreset}
                      onChange={(event) =>
                        setDatePreset(event.target.value as DatePreset)
                      }
                      className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-300"
                    >
                      <option value="last12">Last 12 months</option>
                      <option value="last30">Last 30 days</option>
                      <option value="thisMonth">This month</option>
                      <option value="all">All dates</option>
                    </select>

                    <div className="relative col-span-2 sm:col-span-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={chequeNumberSearch}
                        onChange={(event) =>
                          setChequeNumberSearch(event.target.value)
                        }
                        placeholder="Cheque no."
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-300 sm:w-44"
                      />
                    </div>
                  </div>
                )}
              </div>

              {activeTab === "transactions" &&
                (selectedTransactions.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <FileText className="mx-auto h-6 w-6 text-slate-300" />
                    <p className="mt-3 text-sm font-medium text-slate-700">
                      No transactions found
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Try a different type, cheque number or date range.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {selectedTransactions.map((transaction) => (
                      <li
                        key={transaction.id}
                        className="flex flex-col gap-3 px-4 py-4 transition hover:bg-slate-50/70 sm:flex-row sm:items-start sm:justify-between sm:px-6"
                      >
                        <div className="min-w-0 flex-1">
                          <p
                            className="line-clamp-2 break-words text-sm font-medium text-slate-900"
                            title={transaction.purpose}
                          >
                            {transaction.purpose || "-"}
                          </p>

                          <p className="mt-1 break-words text-xs text-slate-500">
                            {[
                              `${transaction.type} ${
                                transaction.billNo || transaction.requestId || ""
                              }`.trim(),
                              transaction.projectName !== "-"
                                ? transaction.projectName
                                : transaction.requestType,
                              transaction.chequeNumber
                                ? `Cheque ${transaction.chequeNumber}`
                                : "",
                              formatDate(transaction.paymentDate) !== "-"
                                ? formatDate(transaction.paymentDate)
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>

                          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${getStatusDotClass(
                                transaction.paymentStatus,
                              )}`}
                            />
                            {transaction.paymentStatus}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-start sm:gap-1.5 sm:text-right">
                          <div>
                            <p className="text-sm font-semibold tabular-nums text-slate-900">
                              {formatCurrency(transaction.paidAmount)}
                            </p>
                            {transaction.remainingBalance > 0.009 && (
                              <p className="text-xs tabular-nums text-amber-700">
                                {formatCurrency(transaction.remainingBalance)}{" "}
                                remaining
                              </p>
                            )}
                          </div>

                          {renderReleaseAction(transaction)}
                        </div>
                      </li>
                    ))}
                  </ul>
                ))}

              {activeTab === "details" && (
                <dl className="grid gap-x-8 gap-y-5 p-4 sm:grid-cols-2 sm:p-6">
                  {[
                    { label: "Company", value: selectedVendor.company },
                    {
                      label: "Billing address",
                      value: selectedVendor.billingAddress,
                    },
                    {
                      label: "Bill Pay ACH info",
                      value: selectedVendor.achInfo,
                    },
                    { label: "Notes", value: selectedVendor.notes },
                  ].map((field) => (
                    <div key={field.label} className="min-w-0">
                      <dt className="text-xs text-slate-500">{field.label}</dt>
                      <dd className="mt-1 whitespace-pre-line break-words text-sm text-slate-900">
                        {field.value || "-"}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </>
          )}
        </main>

        <Dialog
          open={manualPaymentOpen}
          onOpenChange={(open) => {
            if (!open) closeManualPayment();
          }}
        >
          <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto rounded-[28px] border-slate-200 p-0">
            <DialogHeader className="border-b border-slate-100 p-6">
              <DialogTitle className="text-xl font-bold text-slate-950">
                {manualPaymentLockedPOId
                  ? "Release Purchase Order Payment"
                  : "Manual Vendor Payment — FIFO"}
              </DialogTitle>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {manualPaymentLockedPOId
                  ? "This payment is restricted to the selected PO."
                  : "The amount is applied to the oldest payable PO first. Fully covered POs are closed, and any balance left over is applied to the next PO."}
              </p>
            </DialogHeader>

            <div className="space-y-6 p-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Vendor
                  </p>
                  <p className="mt-2 font-bold text-slate-900">
                    {selectedVendor?.vendorName || "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Payable POs
                  </p>
                  <p className="mt-2 font-bold text-slate-900">
                    {payableVendorPurchaseOrders.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                    Outstanding
                  </p>
                  <p className="mt-2 font-bold text-amber-900">
                    {formatCurrency(payableVendorOutstanding)}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2">
                  <Label>Payment Amount *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    max={payableVendorOutstanding}
                    value={manualPaymentForm.amount}
                    onChange={(event) =>
                      setManualPaymentForm((previous) => ({
                        ...previous,
                        amount: event.target.value,
                      }))
                    }
                    placeholder="Enter fixed amount"
                    className="h-11 rounded-2xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Method *</Label>
                  <Select
                    value={manualPaymentForm.paymentMethod}
                    onValueChange={(value) =>
                      setManualPaymentForm((previous) => ({
                        ...previous,
                        paymentMethod: value as typeof previous.paymentMethod,
                        chequeNumber:
                          value === "cheque" ? previous.chequeNumber : "",
                      }))
                    }
                  >
                    <SelectTrigger className="h-11 rounded-2xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="wire">Online Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    Payment Account
                    {manualPaymentForm.paymentMethod === "cash" ? "" : " *"}
                  </Label>
                  <Select
                    value={manualPaymentForm.selectedAccountId}
                    onValueChange={(value) =>
                      setManualPaymentForm((previous) => ({
                        ...previous,
                        selectedAccountId: value,
                      }))
                    }
                  >
                    <SelectTrigger className="h-11 rounded-2xl">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {getFirstTextValue([
                            (account as any)?.accountName,
                            (account as any)?.accountTitle,
                            (account as any)?.bankName,
                            account.id,
                          ])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {manualPaymentForm.paymentMethod === "cheque" && (
                  <div className="space-y-2">
                    <Label>Cheque Number *</Label>
                    <Input
                      value={manualPaymentForm.chequeNumber}
                      onChange={(event) =>
                        setManualPaymentForm((previous) => ({
                          ...previous,
                          chequeNumber: event.target.value,
                        }))
                      }
                      placeholder="Enter cheque number"
                      className="h-11 rounded-2xl"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Transaction Name</Label>
                  <Input
                    value={manualPaymentForm.transactionName}
                    onChange={(event) =>
                      setManualPaymentForm((previous) => ({
                        ...previous,
                        transactionName: event.target.value,
                      }))
                    }
                    placeholder="Vendor payment"
                    className="h-11 rounded-2xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Transaction Reference</Label>
                  <Input
                    value={manualPaymentForm.transactionReference}
                    onChange={(event) =>
                      setManualPaymentForm((previous) => ({
                        ...previous,
                        transactionReference: event.target.value,
                      }))
                    }
                    placeholder="Bank reference / voucher number"
                    className="h-11 rounded-2xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Notes</Label>
                <Textarea
                  value={manualPaymentForm.paymentNotes}
                  onChange={(event) =>
                    setManualPaymentForm((previous) => ({
                      ...previous,
                      paymentNotes: event.target.value,
                    }))
                  }
                  placeholder="Optional notes"
                  className="min-h-24 rounded-2xl"
                />
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-950">
                      FIFO Allocation Preview
                    </h3>
                    <p className="text-xs text-slate-500">
                      Oldest purchase orders are cleared first.
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700"
                  >
                    Allocated{" "}
                    {formatCurrency(
                      manualPaymentAllocations.reduce(
                        (sum, allocation) => sum + allocation.allocatedAmount,
                        0,
                      ),
                    )}
                  </Badge>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="max-h-72 overflow-y-auto">
                    {/* Below lg: one compact row per PO instead of a wide table. */}
                    <div className="divide-y divide-slate-100 bg-white lg:hidden">
                      {manualPaymentAllocations.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-slate-400">
                          Enter an amount to preview the FIFO allocation.
                        </p>
                      ) : (
                        manualPaymentAllocations.map((allocation, index) => (
                          <div key={allocation.po.id} className="px-4 py-3 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <p className="min-w-0 truncate font-bold text-slate-900">
                                {index + 1}.{" "}
                                {allocation.po.poNumber || allocation.po.id}
                              </p>
                              <span
                                className={`shrink-0 text-xs font-semibold ${
                                  allocation.remainingBalance <= 0.009
                                    ? "text-emerald-700"
                                    : "text-blue-700"
                                }`}
                              >
                                {allocation.remainingBalance <= 0.009
                                  ? "Paid & Closed"
                                  : "Partially Paid"}
                              </span>
                            </div>
                            <div className="mt-1 grid grid-cols-3 gap-2 text-xs">
                              <div className="min-w-0">
                                <p className="text-slate-400">Before</p>
                                <p className="break-words font-medium">
                                  {formatCurrency(allocation.openingBalance)}
                                </p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-slate-400">Applied</p>
                                <p className="break-words font-bold text-emerald-700">
                                  {formatCurrency(allocation.allocatedAmount)}
                                </p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-slate-400">After</p>
                                <p className="break-words font-bold">
                                  {formatCurrency(allocation.remainingBalance)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <table className="hidden w-full text-left text-sm lg:table [&_td]:px-3 [&_th]:px-3">
                      <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-3">FIFO</th>
                          <th className="px-4 py-3">PO</th>
                          <th className="px-4 py-3">Created</th>
                          <th className="px-4 py-3 text-right">Before</th>
                          <th className="px-4 py-3 text-right">Applied</th>
                          <th className="px-4 py-3 text-right">After</th>
                          <th className="px-4 py-3 text-center">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {manualPaymentAllocations.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-4 py-8 text-center text-slate-400"
                            >
                              Enter an amount to preview the FIFO allocation.
                            </td>
                          </tr>
                        ) : (
                          manualPaymentAllocations.map((allocation, index) => (
                            <tr key={allocation.po.id}>
                              <td className="px-4 py-3 font-bold text-slate-500">
                                {index + 1}
                              </td>
                              <td className="px-4 py-3 font-bold text-slate-900">
                                {allocation.po.poNumber || allocation.po.id}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {formatDate(
                                  allocation.po.createdAt ||
                                    allocation.po.issueDate,
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {formatCurrency(allocation.openingBalance)}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-emerald-700">
                                {formatCurrency(allocation.allocatedAmount)}
                              </td>
                              <td className="px-4 py-3 text-right font-bold">
                                {formatCurrency(allocation.remainingBalance)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Badge
                                  variant="outline"
                                  className={
                                    allocation.remainingBalance <= 0.009
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : "border-blue-200 bg-blue-50 text-blue-700"
                                  }
                                >
                                  {allocation.remainingBalance <= 0.009
                                    ? "Paid & Closed"
                                    : "Partially Paid"}
                                </Badge>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeManualPayment}
                disabled={manualPaymentSaving}
                className="rounded-xl bg-white"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={saveManualPurchaseOrderPayment}
                disabled={
                  manualPaymentSaving ||
                  manualPaymentAmount <= 0 ||
                  manualPaymentAllocations.length === 0
                }
                className="rounded-xl bg-slate-950 text-white hover:bg-slate-800"
              >
                {manualPaymentSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <HandCoins className="mr-2 h-4 w-4" />
                    Save FIFO Payment
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <PaymentReleaseModal
          isOpen={isPaymentModalOpen}
          title="Release Payment"
          onClose={closePaymentRelease}
          onSuccess={closePaymentRelease}
          invoice={paymentInvoice}
        />

        <VendorAccountStatement
          open={statementOpen}
          onOpenChange={setStatementOpen}
          statement={vendorStatement}
        />
      </div>
    </div>
  );
}
