import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  CreditCard,
  FileText,
  Paperclip,
  Printer,
  Search,
  Settings,
  SlidersHorizontal,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import { useFirestoreQuery } from "@/hooks/useFirestore";
import { Badge } from "@/components/ui/badge";
import { InvoiceRequest } from "@shared/schema";

type RequestType = "General" | "Project";
type TypeFilter = "all" | "general" | "project";
type DatePreset = "last12" | "last30" | "thisMonth" | "all";

type VendorTransaction = {
  id: string;
  requestId: string;
  vendorName: string;
  projectName: string;
  requestType: RequestType;
  type: string;
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
    typeof value === "string"
      ? Number(value.replace(/,/g, ""))
      : Number(value);

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

function normalizeText(value: any) {
  return String(value || "")
    .toLowerCase()
    .trim();
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

function getStatusBadgeClass(status: string) {
  const normalized = normalizeText(status);

  if (normalized === "paid") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized === "partially paid") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (normalized === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function getTypeBadgeClass(type: RequestType) {
  return type === "Project"
    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
    : "border-slate-200 bg-slate-50 text-slate-700";
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

function buildVendorTransactions(invoices: any[]): VendorTransaction[] {
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

    const validItems = sourceItems.filter((item: any) => {
      const vendorName = getItemVendorName(item) || invoiceVendorName;
      const itemAmount = getItemAmount(item);

      return vendorName || itemAmount > 0;
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
        const vendorName =
          getItemVendorName(item) || invoiceVendorName || "Unknown Vendor";

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

        rows.push({
          id: `${invoice?.id || invoice?.requestId || "request"}-${index}`,
          requestId: String(invoice?.requestId || "-"),
          vendorName,
          projectName,
          requestType,
          type: "Bill Payment",
          billNo,
          chequeNumber,
          paidAmount,
          totalRequestAmount: itemAmount,
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

      return;
    }

    const vendorName = invoiceVendorName || "Unknown Vendor";
    const paidAmount = requestPaidAmount;
    const salesTax = getItemSalesTax({}, invoice);
    const totalBeforeTax = Math.max(paidAmount - salesTax, 0);
    const remainingBalance = Math.max(requestTotalAmount - paidAmount, 0);

    rows.push({
      id: `${invoice?.id || invoice?.requestId || vendorName}-single`,
      requestId: String(invoice?.requestId || "-"),
      vendorName,
      projectName,
      requestType,
      type: "Bill Payment",
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

  const { data: invoices = [], loading } = useFirestoreQuery<InvoiceRequest>(
    `Panels/${PANEL_ID}/invoiceRequests`,
  );

  const [supplierSearch, setSupplierSearch] = useState("");
  const [selectedVendorName, setSelectedVendorName] = useState("");
  const [activeTab, setActiveTab] = useState<
    "transactions" | "details" | "notes"
  >("transactions");
  const [transactionType, setTransactionType] = useState("Bill Payment");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [chequeNumberSearch, setChequeNumberSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("last12");

  const transactions = useMemo(() => {
    return buildVendorTransactions(invoices as any[]);
  }, [invoices]);

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

    filteredTransactions.forEach((transaction) => {
      const existing =
        map.get(transaction.vendorName) ||
        ({
          vendorName: transaction.vendorName,
          paidAmount: 0,
          openBalance: 0,
          overduePayment: 0,
          transactionCount: 0,
          company: transaction.company,
          billingAddress: transaction.billingAddress,
          achInfo: transaction.achInfo,
          notes: transaction.notes,
        } as VendorSummaryItem);

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

      map.set(transaction.vendorName, existing);
    });

    return Array.from(map.values()).sort((a, b) =>
      a.vendorName.localeCompare(b.vendorName),
    );
  }, [filteredTransactions, invoices]);

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

  const selectedTransactions = useMemo(() => {
    if (!selectedVendor) return [];

    return filteredTransactions
      .filter(
        (transaction) => transaction.vendorName === selectedVendor.vendorName,
      )
      .filter((transaction) => {
        if (transactionType === "all") return true;
        return transaction.type === transactionType;
      })
      .filter((transaction) => isWithinDatePreset(transaction, datePreset))
      .sort((a, b) => {
        const aTime = a.paymentDate?.getTime() || a.requestDate?.getTime() || 0;
        const bTime = b.paymentDate?.getTime() || b.requestDate?.getTime() || 0;

        return bTime - aTime;
      });
  }, [filteredTransactions, selectedVendor, transactionType, datePreset]);

  const dashboardStats = useMemo(() => {
    return filteredVendorSummaries.reduce(
      (acc, vendor) => {
        acc.totalPaid += vendor.paidAmount;
        acc.totalRemaining += vendor.openBalance;
        acc.totalOverdue += vendor.overduePayment;
        acc.totalTransactions += vendor.transactionCount;
        return acc;
      },
      {
        totalPaid: 0,
        totalRemaining: 0,
        totalOverdue: 0,
        totalTransactions: 0,
      },
    );
  }, [filteredVendorSummaries]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-3xl border border-slate-200 bg-white px-8 py-7 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
          <p className="mt-4 text-sm font-medium text-slate-700">
            Loading vendor payments...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900 lg:p-6">
      <div className="mx-auto flex h-[calc(100vh-48px)]  gap-5 overflow-hidden">
        <aside className="flex w-[320px] shrink-0 flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Vendors
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                  Payment History
                </h2>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className="relative mt-5">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={supplierSearch}
                onChange={(event) => setSupplierSearch(event.target.value)}
                placeholder="Search vendor..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-50"
              />
            </div>

            <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-white">
              <p className="text-xs text-slate-300">Total Paid</p>
              <p className="mt-1 text-lg font-bold">
                {formatCurrency(dashboardStats.totalPaid)}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
                <span>{filteredVendorSummaries.length} vendors</span>
                <span>{dashboardStats.totalTransactions} transactions</span>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {filteredVendorSummaries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
                <p className="text-sm font-medium text-slate-700">
                  No vendors found
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Try changing your search or filter.
                </p>
              </div>
            ) : (
              filteredVendorSummaries.map((vendor) => {
                const isActive =
                  vendor.vendorName === selectedVendor?.vendorName;

                return (
                  <button
                    key={vendor.vendorName}
                    onClick={() => {
                      setSelectedVendorName(vendor.vendorName);
                      setActiveTab("transactions");
                    }}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isActive
                        ? "border-emerald-200 bg-emerald-50 shadow-sm"
                        : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${
                          isActive
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {getInitials(vendor.vendorName) || "V"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {vendor.vendorName}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {vendor.company || "No company added"}
                        </p>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[11px] text-slate-400">Paid</p>
                            <p className="truncate text-xs font-semibold text-slate-700">
                              {formatCurrency(vendor.paidAmount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-400">
                              Remaining
                            </p>
                            <p className="truncate text-xs font-semibold text-slate-700">
                              {formatCurrency(vendor.openBalance)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto rounded-[28px] border border-slate-200 bg-white shadow-sm">
          {!selectedVendor ? (
            <div className="flex h-full items-center justify-center p-10">
              <div className="max-w-md text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
                  <Wallet className="h-7 w-7" />
                </div>
                <h2 className="mt-5 text-xl font-bold text-slate-950">
                  No vendor payment records found
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Vendor records will appear here after Budget Requests are
                  created and payment data is available.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-5 lg:p-7">
              <div className="rounded-[28px] bg-slate-950 p-6 text-white lg:p-7">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                      Vendor Summary
                    </p>
                    <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight lg:text-4xl">
                      {selectedVendor.vendorName}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                      Complete payment history with cheque number, project
                      details, payment status, and remaining balance.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15">
                      <Upload className="h-4 w-4" />
                    </button>
                    <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15">
                      <Printer className="h-4 w-4" />
                    </button>
                    <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15">
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                </div>
           
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_340px]">
                <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Vendor Details
                      </p>
                      <h2 className="mt-1 text-lg font-bold text-slate-950">
                        Profile Information
                      </h2>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                      <Building2 className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-medium text-slate-400">
                        Company
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-800">
                        {selectedVendor.company || "-"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-medium text-slate-400">
                        Billing Address
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-800">
                        {selectedVendor.billingAddress || "-"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-medium text-slate-400">
                        Bill Pay ACH Info
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-800">
                        {selectedVendor.achInfo || "-"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-medium text-slate-400">
                        Total Amount Paid
                      </p>
                      <p className="mt-2 text-sm font-bold text-emerald-700">
                        {formatCurrency(selectedVendor.paidAmount)}
                      </p>
                    </div>
                  </div>
                </section>

                <aside className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Balance Overview
                  </p>

                  <div className="mt-5 space-y-4">
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                      <p className="text-xs font-medium text-emerald-700">
                        Total Amount Paid
                      </p>
                      <p className="mt-2 text-xl font-bold text-emerald-900">
                        {formatCurrency(selectedVendor.paidAmount)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                      <p className="text-xs font-medium text-amber-700">
                        Remaining Amount
                      </p>
                      <p className="mt-2 text-xl font-bold text-amber-900">
                        {formatCurrency(selectedVendor.openBalance)}
                      </p>
                    </div>
                  </div>
                </aside>
              </div>

              <div className="mt-5 rounded-[24px] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: "transactions", label: "Transaction List" },
                        { key: "details", label: "Supplier Details" },
                        { key: "notes", label: "Notes" },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() =>
                            setActiveTab(
                              tab.key as "transactions" | "details" | "notes",
                            )
                          }
                          className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                            activeTab === tab.key
                              ? "bg-slate-950 text-white shadow-sm"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {activeTab === "transactions" && (
                      <div className="flex flex-wrap items-center gap-3">
                        <select
                          value={typeFilter}
                          onChange={(event) =>
                            setTypeFilter(event.target.value as TypeFilter)
                          }
                          className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
                        >
                          <option value="all">All Types</option>
                          <option value="general">General</option>
                          <option value="project">Project</option>
                        </select>

                        <input
                          value={chequeNumberSearch}
                          onChange={(event) =>
                            setChequeNumberSearch(event.target.value)
                          }
                          placeholder="Search cheque no..."
                          className="h-11 w-[190px] rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
                        />

                        <select
                          value={datePreset}
                          onChange={(event) =>
                            setDatePreset(event.target.value as DatePreset)
                          }
                          className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
                        >
                          <option value="last12">Last 12 months</option>
                          <option value="last30">Last 30 days</option>
                          <option value="thisMonth">This month</option>
                          <option value="all">All dates</option>
                        </select>

                        <button className="flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
                          <SlidersHorizontal className="h-4 w-4" />
                          Filter
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {activeTab === "transactions" && (
                  <div className="p-4">
                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[1320px] border-collapse">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                Vendor Name
                              </th>
                              <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                Type
                              </th>
                              <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                Project Name
                              </th>
                              <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                Cheque Number
                              </th>
                              <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                                Total Amount Paid
                              </th>
                              <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                                Remaining Amount
                              </th>
                              <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                Payment Date
                              </th>
                              <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                                Payment Status
                              </th>
                              <th className="w-12 px-4 py-4 text-center">
                                <Paperclip className="mx-auto h-4 w-4 text-slate-400" />
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100 bg-white">
                            {selectedTransactions.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={9}
                                  className="px-4 py-14 text-center"
                                >
                                  <div className="mx-auto max-w-sm">
                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
                                      <FileText className="h-6 w-6" />
                                    </div>
                                    <p className="mt-4 text-sm font-semibold text-slate-700">
                                      No transactions found
                                    </p>
                                    <p className="mt-1 text-sm text-slate-400">
                                      Try adjusting your type, cheque number, or
                                      date filter.
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              selectedTransactions.map((transaction) => (
                                <tr
                                  key={transaction.id}
                                  className="transition hover:bg-slate-50"
                                >
                                  <td className="px-4 py-4">
                                    <div className="text-sm font-bold text-slate-900">
                                      {transaction.vendorName}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-400">
                                      No:{" "}
                                      {transaction.billNo ||
                                        transaction.requestId ||
                                        "-"}
                                    </div>
                                  </td>

                                  <td className="px-4 py-4">
                                    <Badge
                                      variant="outline"
                                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getTypeBadgeClass(
                                        transaction.requestType,
                                      )}`}
                                    >
                                      {transaction.requestType}
                                    </Badge>
                                  </td>

                                  <td className="px-4 py-4 text-sm font-medium text-slate-700">
                                    {transaction.projectName}
                                  </td>

                                  <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-800">
                                    {transaction.chequeNumber || "-"}
                                  </td>

                                  <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-bold text-slate-900">
                                    {formatCurrency(transaction.paidAmount)}
                                  </td>

                                  <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-bold text-slate-900">
                                    {formatCurrency(
                                      transaction.remainingBalance,
                                    )}
                                  </td>

                                  <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-slate-700">
                                    {formatDate(transaction.paymentDate)}
                                  </td>

                                  <td className="px-4 py-4 text-center">
                                    <Badge
                                      variant="outline"
                                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                                        transaction.paymentStatus,
                                      )}`}
                                    >
                                      {transaction.paymentStatus}
                                    </Badge>
                                  </td>

                                  <td className="px-4 py-4 text-center text-slate-300">
                                    -
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "details" && (
                  <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Supplier Name
                      </p>
                      <p className="mt-2 text-sm font-bold text-slate-900">
                        {selectedVendor.vendorName}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Total Amount Paid
                      </p>
                      <p className="mt-2 text-sm font-bold text-emerald-700">
                        {formatCurrency(selectedVendor.paidAmount)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Remaining Amount
                      </p>
                      <p className="mt-2 text-sm font-bold text-amber-700">
                        {formatCurrency(selectedVendor.openBalance)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Company
                      </p>
                      <p className="mt-2 text-sm font-bold text-slate-900">
                        {selectedVendor.company || "-"}
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "notes" && (
                  <div className="p-5">
                    <div className="max-w-3xl rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Notes
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-700">
                        {selectedVendor.notes ||
                          "No notes available for this supplier."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}