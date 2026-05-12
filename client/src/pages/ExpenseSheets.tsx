import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFirestoreQuery } from "@/hooks/useFirestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExpenseSheet } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import ExpenseSheetModal from "@/components/ExpenseSheetModal";
import ExpenseDetailsModal from "@/components/ExpenseDetailsModal";
import {
  BriefcaseBusiness,
  CalendarDays,
  Eye,
  FileText,
  Filter,
  Plus,
  ReceiptText,
  Search,
  UserRound,
  WalletMinimal,
} from "lucide-react";

type BudgetExpenseRecord = ExpenseSheet & {
  id: string;
  expenseId?: string;
  requestId?: string;
  linkedRequestId?: string;
  invoiceRequestId?: string;
  clientName?: string;
  project?: string;
  projectName?: string;
  projectCode?: string;
  totalAmount?: number;
  amount?: number;
  status?: string;
  paymentStatus?: string;
  submittedAt?: any;
  createdAt?: any;
  submittedBy?: string;
  submittedByName?: string;
  expenseItems?: Array<any>;
  expenseDocuments?: string[];
};

interface ReimbursementExpenseRow {
  id: string;
  recordId: string;
  clientName: string;
  projectName: string;
  salesPerson: string;
  amount: number;
  claimAmount: number;
  approvedAmount: number;
  fuelKm: number;
  details: string;
  submittedDate: any;
  approvalStatus: string;
  paymentStatus: string;
  approvedBy: string;
  paidBy: string;
  billUrl: string;
}

interface ReimbursementPersonGroup {
  salesPerson: string;
  totalAmount: number;
  totalClaimAmount: number;
  totalApprovedAmount: number;
  pendingAmount: number;
  paidAmount: number;
  pendingCount: number;
  paidCount: number;
  items: ReimbursementExpenseRow[];
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const FINAL_EXPENSE_STATUSES = new Set([
  "submitted",
  "expense_submitted",
  "acknowledged",
  "approved",
  "paid",
  "payment_released",
]);
const OLD_APPROVAL_STATUSES = new Set([
  "pending",
  "pending_operational_admin",
  "pending_main_admin",
  "pending_admin_approval",
  "pending_finance",
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

function getSortableTime(value: any): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (typeof value?.seconds === "number") return value.seconds * 1000;

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function toDate(value: any): Date | null {
  const time = getSortableTime(value);
  return time ? new Date(time) : null;
}

function formatDate(value: any): string {
  const date = toDate(value);
  if (!date) return "N/A";
  return date.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDateInputValue(value: any): string {
  const date = toDate(value);
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeText(value: unknown): string {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function humanizeStatus(status: string): string {
  if (!status) return "Submitted";
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getBudgetExpenseDisplayStatus(expense: BudgetExpenseRecord): string {
  const rawStatus = normalizeText(expense.status);
  const rawPaymentStatus = normalizeText(expense.paymentStatus);

  if (rawPaymentStatus === "paid" || rawStatus === "paid") return "Paid";
  if (rawStatus === "rejected" || rawPaymentStatus === "rejected")
    return "Rejected";

  // Approval has been removed from Budget Expense. Old pending approval statuses are shown as submitted.
  if (
    !rawStatus ||
    OLD_APPROVAL_STATUSES.has(rawStatus) ||
    FINAL_EXPENSE_STATUSES.has(rawStatus)
  ) {
    return "Submitted";
  }

  return humanizeStatus(String(expense.status || "submitted"));
}

function getBudgetExpenseStatusFilterValue(
  expense: BudgetExpenseRecord,
): string {
  return normalizeText(getBudgetExpenseDisplayStatus(expense));
}

function getStatusBadgeClass(displayStatus: string): string {
  const status = normalizeText(displayStatus);

  if (status === "paid")
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "rejected") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "submitted") return "border-blue-200 bg-blue-50 text-blue-700";

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getClientName(expense: BudgetExpenseRecord): string {
  return expense.clientName || "N/A";
}

function getProjectName(expense: BudgetExpenseRecord): string {
  return expense.projectName || expense.project || "General Expense";
}

function getExpenseAmount(expense: BudgetExpenseRecord): number {
  return safeNumber(expense.totalAmount || expense.amount);
}

function getSubmittedDate(expense: BudgetExpenseRecord): any {
  return expense.submittedAt || expense.createdAt;
}

function getExpenseReference(expense: BudgetExpenseRecord): string {
  return (
    expense.expenseId ||
    expense.linkedRequestId ||
    expense.requestId ||
    expense.invoiceRequestId ||
    expense.id ||
    "N/A"
  );
}

function getReimbursementPayableAmount(row: ReimbursementExpenseRow): number {
  return row.approvedAmount > 0 ? row.approvedAmount : row.claimAmount;
}

function getReimbursementRowKey(row: ReimbursementExpenseRow): string {
  return `${row.recordId}-${row.id}`;
}

function isReimbursementApproved(row: ReimbursementExpenseRow): boolean {
  const approvalStatus = normalizeText(row.approvalStatus);
  return (
    approvalStatus === "approved" ||
    approvalStatus === "paid" ||
    row.approvedAmount > 0
  );
}

function buildReimbursementGroups(
  rows: ReimbursementExpenseRow[],
): ReimbursementPersonGroup[] {
  const map = new Map<string, ReimbursementPersonGroup>();

  rows.forEach((row) => {
    const key = row.salesPerson || "Unknown";
    const current = map.get(key) || {
      salesPerson: key,
      totalAmount: 0,
      totalClaimAmount: 0,
      totalApprovedAmount: 0,
      pendingAmount: 0,
      paidAmount: 0,
      pendingCount: 0,
      paidCount: 0,
      items: [],
    };

    const isPaid = normalizeText(row.paymentStatus) === "paid";
    const payableAmount = getReimbursementPayableAmount(row);

    current.totalAmount += payableAmount;
    current.totalClaimAmount += row.claimAmount;
    current.totalApprovedAmount += row.approvedAmount;
    current.items.push(row);

    if (isPaid) {
      current.paidAmount += payableAmount;
      current.paidCount += 1;
    } else {
      current.pendingAmount += payableAmount;
      current.pendingCount += 1;
    }

    map.set(key, current);
  });

  return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
}

export default function ExpenseSheets() {
  const PANEL_ID = "IEDGE-SYSTEM";

  const { userProfile } = useAuth();
  const { toast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<
    "budget_expense" | "reimbursement_expense"
  >("budget_expense");

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] =
    useState<BudgetExpenseRecord | null>(null);

  const [budgetSearchTerm, setBudgetSearchTerm] = useState("");
  const [budgetStatusFilter, setBudgetStatusFilter] = useState("all");
  const [budgetProjectFilter, setBudgetProjectFilter] = useState("all");
  const [budgetDateFromFilter, setBudgetDateFromFilter] = useState("");
  const [budgetDateToFilter, setBudgetDateToFilter] = useState("");
  const [budgetPage, setBudgetPage] = useState(1);
  const [budgetPageSize, setBudgetPageSize] = useState(10);

  const [reimbursementExpenses, setReimbursementExpenses] = useState<
    ReimbursementExpenseRow[]
  >([]);
  const [reimbursementLoading, setReimbursementLoading] = useState(false);
  const [selectedPersonFilter, setSelectedPersonFilter] = useState("all");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("all");
  const [selectedPaymentStatusFilter, setSelectedPaymentStatusFilter] =
    useState("all");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [approvedAmountDrafts, setApprovedAmountDrafts] = useState<
    Record<string, string>
  >({});
  const [savingApprovedAmountKey, setSavingApprovedAmountKey] = useState<
    string | null
  >(null);

  const { data: expenseSheets, loading } =
    useFirestoreQuery<BudgetExpenseRecord>(`Panels/${PANEL_ID}/expenseSheets`);

  const ExpenseSheetModalComponent = ExpenseSheetModal as any;
  const ExpenseDetailsModalComponent = ExpenseDetailsModal as any;

  function canCreateExpenseSheets(): boolean {
    return userProfile?.role === "operation";
  }

  function canManageReimbursementApproval(): boolean {
    return [
      "operational_admin",
      "main_admin",
      "finance",
      "financial_admin",
    ].includes(String(userProfile?.role || ""));
  }

  async function fetchReimbursementExpenses() {
    try {
      setReimbursementLoading(true);

      const salesRecordsSnap = await getDocs(
        collection(db, "Panels", PANEL_ID, "salesRecords"),
      );

      const reimbursementPromises = salesRecordsSnap.docs.map(
        async (salesRecordDoc) => {
          const salesRecordData: any = salesRecordDoc.data();
          const recordId = salesRecordDoc.id;

          try {
            const meetingUpdatesSnap = await getDocs(
              collection(
                db,
                "Panels",
                PANEL_ID,
                "salesRecords",
                recordId,
                "meetingUpdates",
              ),
            );

            const rows: ReimbursementExpenseRow[] = [];

            meetingUpdatesSnap.docs.forEach((meetingDoc) => {
              const meetingData: any = meetingDoc.data();
              const reimbursement = meetingData?.reimbursement;

              if (!reimbursement?.enabled) return;

              const approvalStatus = String(
                reimbursement?.approvalStatus || "submitted",
              );
              const claimAmount = safeNumber(
                reimbursement?.claimAmount ??
                  reimbursement?.claimedAmount ??
                  reimbursement?.amount,
              );
              const storedApprovedAmount = safeNumber(
                reimbursement?.approvedAmount ??
                  reimbursement?.approvedClaimAmount ??
                  reimbursement?.finalAmount,
              );
              const approvedAmount =
                storedApprovedAmount > 0 ? storedApprovedAmount : 0;
              const payableAmount =
                approvedAmount > 0 ? approvedAmount : claimAmount;

              rows.push({
                id: meetingDoc.id,
                recordId,
                clientName: salesRecordData?.client || "Unknown",
                projectName: salesRecordData?.projectName || "N/A",
                salesPerson:
                  reimbursement?.approvalSubmittedByName ||
                  reimbursement?.personName ||
                  "Unknown",
                amount: payableAmount,
                claimAmount,
                approvedAmount,
                fuelKm: safeNumber(reimbursement?.kms),
                details: reimbursement?.detail || "N/A",
                submittedDate:
                  reimbursement?.meetingDate ||
                  reimbursement?.createdAt ||
                  reimbursement?.date ||
                  null,
                approvalStatus,
                paymentStatus: String(
                  reimbursement?.paymentStatus || "pending",
                ),
                approvedBy: reimbursement?.approvedBy || "",
                paidBy: reimbursement?.paidBy || "",
                billUrl: reimbursement?.billUrl || "",
              });
            });

            return rows;
          } catch (error) {
            console.error(
              `Failed to fetch meeting updates for sales record ${recordId}:`,
              error,
            );
            return [];
          }
        },
      );

      const results = await Promise.all(reimbursementPromises);
      const allRows = results.flat();

      allRows.sort(
        (a, b) =>
          getSortableTime(b.submittedDate) - getSortableTime(a.submittedDate),
      );
      setReimbursementExpenses(allRows);
    } catch (error: any) {
      console.error("Failed to fetch reimbursement expenses:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to load reimbursement expenses",
        variant: "destructive",
      });
    } finally {
      setReimbursementLoading(false);
    }
  }

  useEffect(() => {
    fetchReimbursementExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSaveApprovedAmount(row: ReimbursementExpenseRow) {
    if (!canManageReimbursementApproval()) return;

    const rowKey = getReimbursementRowKey(row);
    const rawValue =
      approvedAmountDrafts[rowKey] ??
      String(row.approvedAmount || row.claimAmount || "");
    const approvedAmount = safeNumber(rawValue);

    if (approvedAmount <= 0) {
      toast({
        title: "Invalid approved amount",
        description: "Approved Amount must be greater than zero.",
        variant: "destructive",
      });
      return;
    }

    if (row.claimAmount > 0 && approvedAmount > row.claimAmount) {
      toast({
        title: "Invalid approved amount",
        description: "Approved Amount cannot be greater than the Claim Amount.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSavingApprovedAmountKey(rowKey);

      await updateDoc(
        doc(
          db,
          "Panels",
          PANEL_ID,
          "salesRecords",
          row.recordId,
          "meetingUpdates",
          row.id,
        ),
        {
          "reimbursement.claimAmount": row.claimAmount,
          "reimbursement.approvedAmount": approvedAmount,
          "reimbursement.approvalStatus": "approved",
          "reimbursement.approvedBy":
            userProfile?.displayName || userProfile?.email || "",
          "reimbursement.approvedById":
            (userProfile as any)?.uid || (userProfile as any)?.id || "",
          "reimbursement.approvedAt": serverTimestamp(),
          "reimbursement.updatedAt": serverTimestamp(),
        },
      );

      setReimbursementExpenses((currentRows) =>
        currentRows.map((currentRow) =>
          getReimbursementRowKey(currentRow) === rowKey
            ? {
                ...currentRow,
                amount: approvedAmount,
                approvedAmount,
                approvalStatus: "approved",
                approvedBy:
                  userProfile?.displayName || userProfile?.email || "",
              }
            : currentRow,
        ),
      );

      setApprovedAmountDrafts((currentDrafts) => ({
        ...currentDrafts,
        [rowKey]: String(approvedAmount),
      }));

      toast({
        title: "Approved Amount saved",
        description: "The reimbursement claim has been updated successfully.",
      });
    } catch (error: any) {
      console.error("Failed to save approved reimbursement amount:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to save approved amount",
        variant: "destructive",
      });
    } finally {
      setSavingApprovedAmountKey(null);
    }
  }

  const budgetExpenses = useMemo(() => {
    return Array.isArray(expenseSheets) ? expenseSheets : [];
  }, [expenseSheets]);

  const budgetProjectOptions = useMemo(() => {
    return Array.from(
      new Set(
        budgetExpenses
          .map((expense) => getProjectName(expense))
          .filter(Boolean),
      ),
    ).sort();
  }, [budgetExpenses]);

  const budgetStatusOptions = useMemo(() => {
    return Array.from(
      new Set(
        budgetExpenses
          .map((expense) => getBudgetExpenseDisplayStatus(expense))
          .filter(Boolean),
      ),
    ).sort();
  }, [budgetExpenses]);

  const filteredBudgetExpenses = useMemo(() => {
    const search = normalizeText(budgetSearchTerm);
    const fromDate = budgetDateFromFilter
      ? new Date(`${budgetDateFromFilter}T00:00:00`)
      : null;
    const untilDate = budgetDateToFilter
      ? new Date(`${budgetDateToFilter}T23:59:59`)
      : null;

    return budgetExpenses
      .filter((expense) => {
        const submittedDate = toDate(getSubmittedDate(expense));
        const haystack = normalizeText(
          [
            getExpenseReference(expense),
            getClientName(expense),
            getProjectName(expense),
            expense.projectCode,
            expense.submittedBy,
            expense.submittedByName,
            getExpenseAmount(expense),
            getBudgetExpenseDisplayStatus(expense),
          ].join(" "),
        );

        const matchesSearch = !search || haystack.includes(search);
        const matchesStatus =
          budgetStatusFilter === "all" ||
          getBudgetExpenseStatusFilterValue(expense) ===
            normalizeText(budgetStatusFilter);
        const matchesProject =
          budgetProjectFilter === "all" ||
          getProjectName(expense) === budgetProjectFilter;
        const matchesFromDate =
          !fromDate || (submittedDate && submittedDate >= fromDate);
        const matchesToDate =
          !untilDate || (submittedDate && submittedDate <= untilDate);

        return (
          matchesSearch &&
          matchesStatus &&
          matchesProject &&
          matchesFromDate &&
          matchesToDate
        );
      })
      .sort(
        (a, b) =>
          getSortableTime(getSubmittedDate(b)) -
          getSortableTime(getSubmittedDate(a)),
      );
  }, [
    budgetExpenses,
    budgetSearchTerm,
    budgetStatusFilter,
    budgetProjectFilter,
    budgetDateFromFilter,
    budgetDateToFilter,
  ]);

  const budgetStats = useMemo(() => {
    const totalAmount = budgetExpenses.reduce(
      (sum, expense) => sum + getExpenseAmount(expense),
      0,
    );
    const submittedCount = budgetExpenses.filter(
      (expense) => getBudgetExpenseStatusFilterValue(expense) === "submitted",
    ).length;
    const paidCount = budgetExpenses.filter(
      (expense) => getBudgetExpenseStatusFilterValue(expense) === "paid",
    ).length;

    return {
      totalRecords: budgetExpenses.length,
      totalAmount,
      submittedCount,
      paidCount,
    };
  }, [budgetExpenses]);

  const budgetTotalPages = Math.max(
    1,
    Math.ceil(filteredBudgetExpenses.length / budgetPageSize),
  );
  const safeBudgetPage = Math.min(budgetPage, budgetTotalPages);
  const budgetStartIndex = (safeBudgetPage - 1) * budgetPageSize;
  const paginatedBudgetExpenses = filteredBudgetExpenses.slice(
    budgetStartIndex,
    budgetStartIndex + budgetPageSize,
  );

  useEffect(() => {
    setBudgetPage(1);
  }, [
    budgetSearchTerm,
    budgetStatusFilter,
    budgetProjectFilter,
    budgetDateFromFilter,
    budgetDateToFilter,
    budgetPageSize,
  ]);

  const peopleOptions = useMemo(() => {
    return Array.from(
      new Set(reimbursementExpenses.map((expense) => expense.salesPerson)),
    ).sort();
  }, [reimbursementExpenses]);

  const projectOptions = useMemo(() => {
    return Array.from(
      new Set(reimbursementExpenses.map((expense) => expense.projectName)),
    ).sort();
  }, [reimbursementExpenses]);

  const filteredReimbursementExpenses = useMemo(() => {
    const fromDate = dateFromFilter
      ? new Date(`${dateFromFilter}T00:00:00`)
      : null;
    const untilDate = dateToFilter
      ? new Date(`${dateToFilter}T23:59:59`)
      : null;

    return reimbursementExpenses.filter((expense) => {
      const submittedDate = toDate(expense.submittedDate);
      const matchesPerson =
        selectedPersonFilter === "all" ||
        expense.salesPerson === selectedPersonFilter;
      const matchesProject =
        selectedProjectFilter === "all" ||
        expense.projectName === selectedProjectFilter;
      const matchesPaymentStatus =
        selectedPaymentStatusFilter === "all" ||
        normalizeText(expense.paymentStatus) ===
          normalizeText(selectedPaymentStatusFilter);
      const matchesFromDate =
        !fromDate || (submittedDate && submittedDate >= fromDate);
      const matchesToDate =
        !untilDate || (submittedDate && submittedDate <= untilDate);

      return (
        matchesPerson &&
        matchesProject &&
        matchesPaymentStatus &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [
    reimbursementExpenses,
    selectedPersonFilter,
    selectedProjectFilter,
    selectedPaymentStatusFilter,
    dateFromFilter,
    dateToFilter,
  ]);

  const reimbursementGroups = useMemo(
    () => buildReimbursementGroups(filteredReimbursementExpenses),
    [filteredReimbursementExpenses],
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-slate-50/60 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Finance Operations
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-950">
            Budget Expense
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Submitted expenses are final. No operational, main admin, or finance
            approval step is required.
          </p>
        </div>

        {canCreateExpenseSheets() && (
          <Button
            onClick={() => {
              setSelectedExpense(null);
              setIsExpenseModalOpen(true);
            }}
            className="rounded-xl shadow-sm"
            data-testid="button-new-expense-sheet"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Expense
          </Button>
        )}
      </div>

      <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveSubTab("budget_expense")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeSubTab === "budget_expense"
              ? "bg-slate-950 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Budget Expense
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("reimbursement_expense")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeSubTab === "reimbursement_expense"
              ? "bg-slate-950 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Reimbursement Expense
        </button>
      </div>

      {activeSubTab === "budget_expense" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-2xl bg-slate-100 p-3">
                  <ReceiptText className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total Records
                  </p>
                  <p className="text-2xl font-bold text-slate-950">
                    {budgetStats.totalRecords}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-2xl bg-slate-100 p-3">
                  <WalletMinimal className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total Value
                  </p>
                  <p className="text-2xl font-bold text-slate-950">
                    Rs {formatPKR(budgetStats.totalAmount)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-2xl bg-blue-50 p-3">
                  <FileText className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Submitted
                  </p>
                  <p className="text-2xl font-bold text-slate-950">
                    {budgetStats.submittedCount}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-2xl bg-emerald-50 p-3">
                  <WalletMinimal className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Paid
                  </p>
                  <p className="text-2xl font-bold text-slate-950">
                    {budgetStats.paidCount}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Filter className="h-4 w-4" />
                Filters
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
                <div className="relative md:col-span-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={budgetSearchTerm}
                    onChange={(event) =>
                      setBudgetSearchTerm(event.target.value)
                    }
                    placeholder="Search request, client, project..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <select
                  value={budgetStatusFilter}
                  onChange={(event) =>
                    setBudgetStatusFilter(event.target.value)
                  }
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  <option value="all">All Status</option>
                  {budgetStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <select
                  value={budgetProjectFilter}
                  onChange={(event) =>
                    setBudgetProjectFilter(event.target.value)
                  }
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  <option value="all">All Projects</option>
                  {budgetProjectOptions.map((project) => (
                    <option key={project} value={project}>
                      {project}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  value={budgetDateFromFilter}
                  onChange={(event) =>
                    setBudgetDateFromFilter(event.target.value)
                  }
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />

                <input
                  type="date"
                  value={budgetDateToFilter}
                  onChange={(event) =>
                    setBudgetDateToFilter(event.target.value)
                  }
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px]">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Expense / Request
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Client & Project
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Submitted By
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Submitted Date
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Amount
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {paginatedBudgetExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="mx-auto max-w-sm">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                              <ReceiptText className="h-5 w-5 text-slate-500" />
                            </div>
                            <p className="font-semibold text-slate-900">
                              No budget expenses found
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Try changing your filters or submit a new expense.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedBudgetExpenses.map((expense) => {
                        const displayStatus =
                          getBudgetExpenseDisplayStatus(expense);

                        return (
                          <tr
                            key={expense.id}
                            className="transition hover:bg-slate-50/70"
                          >
                            <td className="px-5 py-4 align-top">
                              <p className="font-semibold text-slate-900">
                                {getExpenseReference(expense)}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Record ID: {expense.id}
                              </p>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 rounded-xl bg-slate-100 p-2">
                                  <BriefcaseBusiness className="h-4 w-4 text-slate-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900">
                                    {getClientName(expense)}
                                  </p>
                                  <p className="mt-1 text-sm text-slate-500">
                                    {getProjectName(expense)}
                                  </p>
                                  {expense.projectCode && (
                                    <p className="mt-1 text-xs text-slate-400">
                                      Code: {expense.projectCode}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <div className="flex items-center gap-2 text-sm text-slate-700">
                                <UserRound className="h-4 w-4 text-slate-400" />
                                {expense.submittedByName ||
                                  expense.submittedBy ||
                                  "N/A"}
                              </div>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <div className="flex items-center gap-2 text-sm text-slate-700">
                                <CalendarDays className="h-4 w-4 text-slate-400" />
                                {formatDate(getSubmittedDate(expense))}
                              </div>
                              {getDateInputValue(getSubmittedDate(expense)) && (
                                <p className="mt-1 text-xs text-slate-400">
                                  {getDateInputValue(getSubmittedDate(expense))}
                                </p>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right align-top">
                              <p className="font-bold text-slate-950">
                                Rs {formatPKR(getExpenseAmount(expense))}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                No approval required
                              </p>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <Badge
                                className={`rounded-full border px-3 py-1 ${getStatusBadgeClass(displayStatus)}`}
                              >
                                {displayStatus}
                              </Badge>
                            </td>
                            <td className="px-5 py-4 text-right align-top">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={() => {
                                  setSelectedExpense(expense);
                                  setIsDetailsModalOpen(true);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  {filteredBudgetExpenses.length === 0
                    ? 0
                    : budgetStartIndex + 1}{" "}
                  to{" "}
                  {Math.min(
                    budgetStartIndex + budgetPageSize,
                    filteredBudgetExpenses.length,
                  )}{" "}
                  of {filteredBudgetExpenses.length} expenses
                </p>

                <div className="flex items-center gap-2">
                  <select
                    value={budgetPageSize}
                    onChange={(event) =>
                      setBudgetPageSize(Number(event.target.value))
                    }
                    className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size} / page
                      </option>
                    ))}
                  </select>

                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    disabled={safeBudgetPage <= 1}
                    onClick={() =>
                      setBudgetPage((current) => Math.max(1, current - 1))
                    }
                  >
                    Previous
                  </Button>
                  <span className="min-w-[88px] text-center text-sm font-semibold text-slate-700">
                    {safeBudgetPage} / {budgetTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    disabled={safeBudgetPage >= budgetTotalPages}
                    onClick={() =>
                      setBudgetPage((current) =>
                        Math.min(budgetTotalPages, current + 1),
                      )
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeSubTab === "reimbursement_expense" && (
        <div className="space-y-5">
          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Filter className="h-4 w-4" />
                Reimbursement Filters
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                <select
                  value={selectedPersonFilter}
                  onChange={(event) =>
                    setSelectedPersonFilter(event.target.value)
                  }
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
                >
                  <option value="all">All Persons</option>
                  {peopleOptions.map((person) => (
                    <option key={person} value={person}>
                      {person}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedProjectFilter}
                  onChange={(event) =>
                    setSelectedProjectFilter(event.target.value)
                  }
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
                >
                  <option value="all">All Projects</option>
                  {projectOptions.map((project) => (
                    <option key={project} value={project}>
                      {project}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedPaymentStatusFilter}
                  onChange={(event) =>
                    setSelectedPaymentStatusFilter(event.target.value)
                  }
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
                >
                  <option value="all">All Payment Status</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>

                <input
                  type="date"
                  value={dateFromFilter}
                  onChange={(event) => setDateFromFilter(event.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
                />

                <input
                  type="date"
                  value={dateToFilter}
                  onChange={(event) => setDateToFilter(event.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
                />
              </div>
            </CardContent>
          </Card>

          {reimbursementLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          ) : (
            reimbursementGroups.map((group) => (
              <Card
                key={group.salesPerson}
                className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm"
              >
                <CardContent className="p-0">
                  <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-lg font-bold text-slate-950">
                          {group.salesPerson}
                        </p>
                        <p className="text-sm text-slate-500">
                          {group.items.length} reimbursement entries
                        </p>
                      </div>
                      <div className="grid gap-1 text-sm font-semibold text-slate-700 md:text-right">
                        <span>
                          Claimed: Rs {formatPKR(group.totalClaimAmount)}
                        </span>
                        <span>
                          Approved: Rs {formatPKR(group.totalApprovedAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px]">
                      <thead className="bg-white">
                        <tr className="border-b border-slate-100">
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Client / Project
                          </th>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Details
                          </th>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Date
                          </th>
                          <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Claim Amount
                          </th>
                          <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Approved Amount
                          </th>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Payment
                          </th>
                          <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Bill
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {group.items.map((expense) => (
                          <tr
                            key={`${expense.recordId}-${expense.id}`}
                            className="hover:bg-slate-50/70"
                          >
                            <td className="px-5 py-4">
                              <p className="font-semibold text-slate-900">
                                {expense.clientName}
                              </p>
                              <p className="text-sm text-slate-500">
                                {expense.projectName}
                              </p>
                            </td>
                            <td className="px-5 py-4 text-sm text-slate-600">
                              {expense.details}
                            </td>
                            <td className="px-5 py-4 text-sm text-slate-600">
                              {formatDate(expense.submittedDate)}
                            </td>
                            <td className="px-5 py-4 text-right align-top">
                              <p className="font-semibold text-slate-900">
                                Rs {formatPKR(expense.claimAmount)}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                Claimed by user
                              </p>
                            </td>
                            <td className="px-5 py-4 text-right align-top">
                              {canManageReimbursementApproval() &&
                              normalizeText(expense.paymentStatus) !==
                                "paid" ? (
                                <div className="ml-auto flex max-w-[230px] items-center justify-end gap-2">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={
                                      approvedAmountDrafts[
                                        getReimbursementRowKey(expense)
                                      ] ??
                                      String(
                                        expense.approvedAmount ||
                                          expense.claimAmount ||
                                          "",
                                      )
                                    }
                                    onChange={(event) =>
                                      setApprovedAmountDrafts(
                                        (currentDrafts) => ({
                                          ...currentDrafts,
                                          [getReimbursementRowKey(expense)]:
                                            event.target.value,
                                        }),
                                      )
                                    }
                                    className="h-9 w-28 rounded-xl border border-slate-200 bg-white px-3 text-right text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-9 rounded-xl"
                                    disabled={
                                      savingApprovedAmountKey ===
                                      getReimbursementRowKey(expense)
                                    }
                                    onClick={() =>
                                      handleSaveApprovedAmount(expense)
                                    }
                                  >
                                    {savingApprovedAmountKey ===
                                    getReimbursementRowKey(expense)
                                      ? "Saving"
                                      : isReimbursementApproved(expense)
                                        ? "Update"
                                        : "Approve"}
                                  </Button>
                                </div>
                              ) : expense.approvedAmount > 0 ? (
                                <>
                                  <p className="font-semibold text-slate-900">
                                    Rs {formatPKR(expense.approvedAmount)}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-400">
                                    Approved value
                                  </p>
                                </>
                              ) : (
                                <span className="text-sm text-slate-400">
                                  Not approved
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 align-top">
                              <div className="space-y-2">
                                <Badge
                                  className={`rounded-full border px-3 py-1 ${getStatusBadgeClass(expense.paymentStatus)}`}
                                >
                                  {humanizeStatus(expense.paymentStatus)}
                                </Badge>
                                <div>
                                  <Badge
                                    className={`rounded-full border px-3 py-1 ${getStatusBadgeClass(expense.approvalStatus)}`}
                                  >
                                    {isReimbursementApproved(expense)
                                      ? "Approved"
                                      : humanizeStatus(expense.approvalStatus)}
                                  </Badge>
                                  {expense.approvedBy && (
                                    <p className="mt-1 text-xs text-slate-400">
                                      By {expense.approvedBy}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right">
                              {expense.billUrl ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-xl"
                                  onClick={() =>
                                    window.open(expense.billUrl, "_blank")
                                  }
                                >
                                  View Bill
                                </Button>
                              ) : (
                                <span className="text-sm text-slate-400">
                                  No bill
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      <ExpenseSheetModalComponent
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setSelectedExpense(null);
        }}
        editingExpense={selectedExpense}
        expense={selectedExpense}
      />

      <ExpenseDetailsModalComponent
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedExpense(null);
        }}
        expense={selectedExpense}
      />
    </div>
  );
}
