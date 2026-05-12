import { ExpenseSheet } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, FileText, ReceiptText } from "lucide-react";

type ExpenseSheetRecord = ExpenseSheet & {
  id?: string;
  expenseId?: string;
  linkedRequestId?: string;
  requestId?: string;
  invoiceRequestId?: string;
  clientName?: string;
  project?: string;
  projectName?: string;
  projectCode?: string;
  status?: string;
  paymentStatus?: string;
  totalAmount?: number;
  amount?: number;
  submittedAt?: any;
  createdAt?: any;
  submittedBy?: string;
  submittedByName?: string;
  expenseItems?: Array<any>;
  expenseDocuments?: string[];
};

interface ExpenseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: ExpenseSheetRecord | null;
}

const OLD_APPROVAL_STATUSES = new Set([
  "pending",
  "pending_operational_admin",
  "pending_main_admin",
  "pending_admin_approval",
  "pending_finance",
  "approved",
  "acknowledged",
]);

function safeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatPKR(value: unknown): string {
  return safeNumber(value).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function toDateString(timestamp: any): string {
  if (!timestamp) return "N/A";

  if (timestamp?.toDate && typeof timestamp.toDate === "function") {
    return timestamp.toDate().toLocaleString("en-PK");
  }

  if (timestamp instanceof Date) return timestamp.toLocaleString("en-PK");

  if (typeof timestamp?.seconds === "number") {
    return new Date(timestamp.seconds * 1000).toLocaleString("en-PK");
  }

  const parsed = new Date(timestamp);
  return Number.isNaN(parsed.getTime())
    ? "N/A"
    : parsed.toLocaleString("en-PK");
}

function normalizeText(value: unknown): string {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function humanizeStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getDisplayStatus(expense: ExpenseSheetRecord): string {
  const status = normalizeText(expense.status);
  const paymentStatus = normalizeText(expense.paymentStatus);

  if (paymentStatus === "paid" || status === "paid") return "Paid";
  if (status === "rejected") return "Rejected";
  if (
    !status ||
    OLD_APPROVAL_STATUSES.has(status) ||
    status === "submitted" ||
    status === "expense submitted"
  ) {
    return "Submitted";
  }

  return humanizeStatus(String(expense.status || "submitted"));
}

function getStatusBadgeClass(displayStatus: string): string {
  const status = normalizeText(displayStatus);

  if (status === "paid")
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "rejected") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "submitted") return "border-blue-200 bg-blue-50 text-blue-700";

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getExpenseReference(expense: ExpenseSheetRecord): string {
  return (
    expense.expenseId ||
    expense.linkedRequestId ||
    expense.requestId ||
    expense.invoiceRequestId ||
    expense.id ||
    "N/A"
  );
}

export default function ExpenseDetailsModal({
  isOpen,
  onClose,
  expense,
}: ExpenseDetailsModalProps) {
  if (!expense) return null;

  const displayStatus = getDisplayStatus(expense);
  const items = Array.isArray(expense.expenseItems) ? expense.expenseItems : [];
  const documents = Array.isArray(expense.expenseDocuments)
    ? expense.expenseDocuments
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-slate-950">
            <ReceiptText className="h-5 w-5 text-slate-700" />
            Budget Expense Details
          </DialogTitle>
          <DialogDescription>
            Expense record details. Approval flow has been removed for Budget
            Expense.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Reference
              </p>
              <p className="mt-2 font-bold text-slate-950">
                {getExpenseReference(expense)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Amount
              </p>
              <p className="mt-2 font-bold text-slate-950">
                Rs {formatPKR(expense.totalAmount || expense.amount)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </p>
              <div className="mt-2">
                <Badge
                  className={`rounded-full border px-3 py-1 ${getStatusBadgeClass(displayStatus)}`}
                >
                  {displayStatus}
                </Badge>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Submitted Date
              </p>
              <p className="mt-2 flex items-center gap-2 font-semibold text-slate-950">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                {toDateString(expense.submittedAt || expense.createdAt)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-base font-bold text-slate-950">
              Basic Information
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Client Name
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {expense.clientName || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Project</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {expense.projectName || expense.project || "General Expense"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Project Code
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {expense.projectCode || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Submitted By
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {expense.submittedByName || expense.submittedBy || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-base font-bold text-slate-950">
                Expense Items
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Vendor
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Description
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Quantity
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Unit Price
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-8 text-center text-sm text-slate-500"
                      >
                        No expense items found.
                      </td>
                    </tr>
                  ) : (
                    items.map((item: any, index: number) => (
                      <tr key={item.id || index}>
                        <td className="px-5 py-4 text-sm text-slate-700">
                          {item.vendor ||
                            item.vendorName ||
                            item.supplierName ||
                            "N/A"}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">
                          {item.description ||
                            item.service ||
                            item.title ||
                            "N/A"}
                        </td>
                        <td className="px-5 py-4 text-right text-sm text-slate-700">
                          {item.quantity || item.qty || "-"}
                        </td>
                        <td className="px-5 py-4 text-right text-sm text-slate-700">
                          Rs {formatPKR(item.unitPrice || item.rate)}
                        </td>
                        <td className="px-5 py-4 text-right text-sm font-bold text-slate-950">
                          Rs {formatPKR(item.amount || item.total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {documents.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-base font-bold text-slate-950">Documents</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {documents.map((url, index) => (
                  <Button
                    key={`${url}-${index}`}
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => window.open(url, "_blank")}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Document {index + 1}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={onClose} className="rounded-xl">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
