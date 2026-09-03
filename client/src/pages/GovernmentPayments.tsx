import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { useLocation } from "wouter";
import {
  Building2,
  CalendarDays,
  FileText,
  Filter,
  Landmark,
  Plus,
  ReceiptText,
  RotateCcw,
  Search,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";

import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

const PANEL_ID = "IEDGE-SYSTEM";
const PAGE_SIZE = 15;

const BOARDS = ["KPKB", "SRB", "FBR", "PRB"] as const;

type GovernmentBoard = (typeof BOARDS)[number];
type DeductedFrom = "client" | "vendor" | "employee";
type SortMode =
  | "entity_date"
  | "newest"
  | "oldest"
  | "amount_high"
  | "amount_low"
  | "name_asc";

type GovernmentPayment = {
  id: string;
  board?: GovernmentBoard | string;
  amount?: number | string;
  deductedFrom?: DeductedFrom | string;
  entityId?: string;
  entityName?: string;
  projectType?: "invoice" | "purchase_order" | "employee" | string;
  projectId?: string;
  projectCode?: string;
  paymentDate?: any;
  paymentMethod?: string;
  referenceNumber?: string;
  remarks?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt?: any;
  updatedAt?: any;
};

function normalizeText(value: any) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function safeNumber(value: any) {
  if (value === null || value === undefined || value === "") return 0;
  const parsed =
    typeof value === "string" ? Number(value.replace(/,/g, "")) : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.seconds === "number") return new Date(value.seconds * 1000);

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getPaymentDate(record: GovernmentPayment) {
  return toDate(record.paymentDate) || toDate(record.createdAt);
}

function formatDate(value: any) {
  const date = toDate(value);
  if (!date) return "-";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value: any) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeNumber(value));
}

function getDeductedFromLabel(value: any) {
  switch (normalizeText(value)) {
    case "client":
      return "Client";
    case "vendor":
    case "supplier":
      return "Vendor";
    case "employee":
      return "Employee";
    default:
      return String(value || "-");
  }
}

function getPaymentMethodLabel(value: any) {
  switch (normalizeText(value).replace(/[\s-]+/g, "_")) {
    case "cheque":
      return "Cheque";
    case "bank_transfer":
      return "Bank Transfer";
    case "online":
    case "online_transfer":
    case "wire":
      return "Online Transfer";
    case "cash":
      return "Cash";
    case "other":
      return "Other";
    default:
      return value ? String(value) : "-";
  }
}

function getEntityOrder(value: any) {
  switch (normalizeText(value)) {
    case "client":
      return 0;
    case "vendor":
    case "supplier":
      return 1;
    case "employee":
      return 2;
    default:
      return 3;
  }
}

function EntityTypeBadge({ value }: { value: any }) {
  const normalized = normalizeText(value);

  if (normalized === "client") {
    return (
      <Badge className="border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50">
        <Users className="mr-1 h-3.5 w-3.5" />
        Client
      </Badge>
    );
  }

  if (normalized === "vendor" || normalized === "supplier") {
    return (
      <Badge className="border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50">
        <Building2 className="mr-1 h-3.5 w-3.5" />
        Vendor
      </Badge>
    );
  }

  return (
    <Badge className="border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-50">
      <UserRound className="mr-1 h-3.5 w-3.5" />
      Employee
    </Badge>
  );
}

export default function GovernmentPayments() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [records, setRecords] = useState<GovernmentPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [boardFilter, setBoardFilter] = useState("all");
  const [deductedFromFilter, setDeductedFromFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("entity_date");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const paymentsRef = collection(
      db,
      "Panels",
      PANEL_ID,
      "governmentPayments",
    );

    const unsubscribe = onSnapshot(
      paymentsRef,
      (snapshot) => {
        const rows = snapshot.docs.map((document) => ({
          id: document.id,
          ...(document.data() as Omit<GovernmentPayment, "id">),
        }));

        setRecords(rows);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to load government payments:", error);
        setLoading(false);
        toast({
          title: "Government payments loading failed",
          description: "Could not load Government Payment records from Firestore.",
          variant: "destructive",
        });
      },
    );

    return () => unsubscribe();
  }, [toast]);

  const paymentMethods = useMemo(() => {
    return Array.from(
      new Set(
        records
          .map((record) => String(record.paymentMethod || "").trim())
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [records]);

  const filteredRecords = useMemo(() => {
    const search = normalizeText(searchTerm);
    const project = normalizeText(projectFilter);
    const minimum = minAmount.trim() ? safeNumber(minAmount) : null;
    const maximum = maxAmount.trim() ? safeNumber(maxAmount) : null;

    const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const toDateValue = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;

    const filtered = records.filter((record) => {
      const recordDate = getPaymentDate(record);
      const amount = safeNumber(record.amount);

      const searchable = normalizeText(
        [
          record.board,
          getDeductedFromLabel(record.deductedFrom),
          record.entityName,
          record.projectCode,
          record.paymentMethod,
          record.referenceNumber,
          record.remarks,
          record.createdByName,
        ]
          .filter(Boolean)
          .join(" "),
      );

      if (search && !searchable.includes(search)) return false;

      if (
        boardFilter !== "all" &&
        normalizeText(record.board) !== normalizeText(boardFilter)
      ) {
        return false;
      }

      if (
        deductedFromFilter !== "all" &&
        normalizeText(record.deductedFrom) !== normalizeText(deductedFromFilter)
      ) {
        return false;
      }

      if (
        methodFilter !== "all" &&
        normalizeText(record.paymentMethod) !== normalizeText(methodFilter)
      ) {
        return false;
      }

      if (project && !normalizeText(record.projectCode).includes(project)) {
        return false;
      }

      if (minimum !== null && amount < minimum) return false;
      if (maximum !== null && amount > maximum) return false;

      if (fromDate) {
        if (!recordDate || recordDate < fromDate) return false;
      }

      if (toDateValue) {
        if (!recordDate || recordDate > toDateValue) return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      const aDate = getPaymentDate(a)?.getTime() || 0;
      const bDate = getPaymentDate(b)?.getTime() || 0;
      const aAmount = safeNumber(a.amount);
      const bAmount = safeNumber(b.amount);
      const nameCompare = String(a.entityName || "").localeCompare(
        String(b.entityName || ""),
      );

      switch (sortMode) {
        case "newest":
          return bDate - aDate;
        case "oldest":
          return aDate - bDate;
        case "amount_high":
          return bAmount - aAmount;
        case "amount_low":
          return aAmount - bAmount;
        case "name_asc":
          return nameCompare || bDate - aDate;
        case "entity_date":
        default: {
          const typeCompare =
            getEntityOrder(a.deductedFrom) - getEntityOrder(b.deductedFrom);
          if (typeCompare !== 0) return typeCompare;
          if (nameCompare !== 0) return nameCompare;
          return bDate - aDate;
        }
      }
    });

    return filtered;
  }, [
    records,
    searchTerm,
    boardFilter,
    deductedFromFilter,
    methodFilter,
    projectFilter,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
    sortMode,
  ]);

  const summary = useMemo(() => {
    return filteredRecords.reduce(
      (result, record) => {
        const amount = safeNumber(record.amount);
        result.totalAmount += amount;
        result.totalRecords += 1;

        const type = normalizeText(record.deductedFrom);
        if (type === "client") result.clientAmount += amount;
        if (type === "vendor" || type === "supplier") result.vendorAmount += amount;
        if (type === "employee") result.employeeAmount += amount;

        return result;
      },
      {
        totalRecords: 0,
        totalAmount: 0,
        clientAmount: 0,
        vendorAmount: 0,
        employeeAmount: 0,
      },
    );
  }, [filteredRecords]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedRecords = filteredRecords.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [
    searchTerm,
    boardFilter,
    deductedFromFilter,
    methodFilter,
    projectFilter,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
    sortMode,
  ]);

  const hasActiveFilters = Boolean(
    searchTerm ||
      boardFilter !== "all" ||
      deductedFromFilter !== "all" ||
      methodFilter !== "all" ||
      projectFilter ||
      dateFrom ||
      dateTo ||
      minAmount ||
      maxAmount ||
      sortMode !== "entity_date",
  );

  const clearFilters = () => {
    setSearchTerm("");
    setBoardFilter("all");
    setDeductedFromFilter("all");
    setMethodFilter("all");
    setProjectFilter("");
    setDateFrom("");
    setDateTo("");
    setMinAmount("");
    setMaxAmount("");
    setSortMode("entity_date");
    setPage(1);
  };

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
          <p className="mt-3 text-sm text-slate-500">
            Loading government payments...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/60 p-1 sm:p-2">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50/70 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
              <Landmark className="h-3.5 w-3.5" />
              Government Payments
            </div>

            <h1 className="text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">
              Government Payment Records
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Track payments to KPKB, SRB, FBR and PRB against clients,
              vendors and employees, with their linked Invoice, PO or Employee
              project code.
            </p>
          </div>

          <Button
            type="button"
            className="h-11 rounded-2xl px-5 shadow-sm"
            onClick={() => setLocation("/government-payments/add")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Government Payment
          </Button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Card className="rounded-2xl border-slate-200 bg-white/90 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Records
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {summary.totalRecords}
                  </p>
                </div>
                <ReceiptText className="h-5 w-5 text-slate-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white/90 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Total Amount
              </p>
              <p className="mt-2 text-lg font-black text-slate-950">
                {formatCurrency(summary.totalAmount)}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white/90 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                Client
              </p>
              <p className="mt-2 text-lg font-black text-slate-950">
                {formatCurrency(summary.clientAmount)}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white/90 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-500">
                Vendor
              </p>
              <p className="mt-2 text-lg font-black text-slate-950">
                {formatCurrency(summary.vendorAmount)}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white/90 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-500">
                Employee
              </p>
              <p className="mt-2 text-lg font-black text-slate-950">
                {formatCurrency(summary.employeeAmount)}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <Filter className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">Filters & Sorting</CardTitle>
                <p className="mt-1 text-xs text-slate-500">
                  Default sorting groups Client, Vendor and Employee records,
                  then sorts each name date-wise.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={!hasActiveFilters}
              onClick={clearFilters}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search name, board, project code, reference..."
                className="rounded-xl pl-9"
              />
            </div>

            <Select value={boardFilter} onValueChange={setBoardFilter}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="All Boards" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Boards</SelectItem>
                {BOARDS.map((board) => (
                  <SelectItem key={board} value={board}>
                    {board}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={deductedFromFilter}
              onValueChange={setDeductedFromFilter}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Client / Vendor / Employee</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
              </SelectContent>
            </Select>

            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="All Payment Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Methods</SelectItem>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {getPaymentMethodLabel(method)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={projectFilter}
                onChange={(event) => setProjectFilter(event.target.value)}
                placeholder="Invoice# / PO# / EMP#"
                className="rounded-xl pl-9"
              />
            </div>

            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="rounded-xl pl-9"
                title="From date"
              />
            </div>

            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="rounded-xl pl-9"
                title="To date"
              />
            </div>

            <Select
              value={sortMode}
              onValueChange={(value) => setSortMode(value as SortMode)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entity_date">
                  Client / Vendor / Employee, Date Wise
                </SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name_asc">Name A - Z</SelectItem>
                <SelectItem value="amount_high">Amount High - Low</SelectItem>
                <SelectItem value="amount_low">Amount Low - High</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="number"
              min="0"
              step="0.01"
              value={minAmount}
              onChange={(event) => setMinAmount(event.target.value)}
              placeholder="Minimum amount"
              className="rounded-xl"
            />

            <Input
              type="number"
              min="0"
              step="0.01"
              value={maxAmount}
              onChange={(event) => setMaxAmount(event.target.value)}
              placeholder="Maximum amount"
              className="rounded-xl"
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-2xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Board</TableHead>
                  <TableHead>Deducted From</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Project Code</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Reference / Challan</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedRecords.length > 0 ? (
                  paginatedRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(record.paymentDate || record.createdAt)}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="font-semibold">
                          {record.board || "-"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <EntityTypeBadge value={record.deductedFrom} />
                      </TableCell>

                      <TableCell>
                        <div className="min-w-[170px]">
                          <p className="font-semibold text-slate-900">
                            {record.entityName || "-"}
                          </p>
                          {record.entityId ? (
                            <p className="mt-0.5 max-w-[190px] truncate text-[11px] text-slate-400">
                              ID: {record.entityId}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="whitespace-nowrap font-medium"
                        >
                          {record.projectCode || "-"}
                        </Badge>
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        {getPaymentMethodLabel(record.paymentMethod)}
                      </TableCell>

                      <TableCell>
                        <div className="max-w-[180px]">
                          <p className="truncate font-medium">
                            {record.referenceNumber || "-"}
                          </p>
                          {record.remarks ? (
                            <p className="mt-1 truncate text-xs text-slate-400">
                              {record.remarks}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        {record.createdByName || "-"}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-right font-bold text-slate-950">
                        {formatCurrency(record.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center">
                      <div className="mx-auto flex max-w-md flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                          <WalletCards className="h-5 w-5 text-slate-400" />
                        </div>
                        <p className="mt-3 font-semibold text-slate-800">
                          No government payment records found
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Add a new payment or change the active filters.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing {paginatedRecords.length} of {filteredRecords.length}{" "}
              records · Page {safePage} of {totalPages}
            </p>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={safePage <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={safePage >= totalPages}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
