import { useCallback, useEffect, useMemo, useState } from "react";
import { deleteDoc, doc, Timestamp } from "firebase/firestore";
import {
  Eye,
  FileText,
  Filter,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import RtgsShell from "@/components/RTGS/RtgsShell";
import RecordDialog from "@/components/RTGS/RecordDialog";
import RtgsPagination from "@/components/RTGS/RtgsPagination";
import {
  accountPrefix,
  createdByName,
  fetchIedgeAccounts,
  fetchRecords,
  recordTime,
  type IedgeAccount,
  type RtgsRecord,
} from "@/components/RTGS/rtgsData";
import { printLetter, recordLetterHTML } from "@/components/RTGS/rtgsLetter";

const RECORDS_PER_PAGE = 10;

type DateRange = "all" | "thisWeek" | "thisMonth" | "custom";

const recordKey = (record: RtgsRecord) => `${record.sourceCollection}/${record.id}`;

const parseAmount = (value?: string) => Number.parseFloat(String(value || "").replace(/[^0-9.-]+/g, ""));

const displayDate = (value?: string) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
};

const recordDate = (record: RtgsRecord): Date | null => {
  if (record.date) {
    const parsed = new Date(record.date);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (record.createdAt instanceof Timestamp) return record.createdAt.toDate();
  if (record.createdAt instanceof Date) return record.createdAt;
  return null;
};

export default function RTGSList() {
  const { toast } = useToast();

  const [accounts, setAccounts] = useState<IedgeAccount[]>([]);
  const [records, setRecords] = useState<RtgsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [accountFilter, setAccountFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedRecord, setSelectedRecord] = useState<RtgsRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<RtgsRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const accountList = await fetchIedgeAccounts();
      setAccounts(accountList);
      setRecords(await fetchRecords(accountList));
    } catch (err) {
      console.error("Error fetching RTGS records:", err);
      setError("Failed to load records. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const accountLabel = useCallback(
    (accountId?: string) => {
      const account = accounts.find((item) => item.id === accountId);
      return account ? `${accountPrefix(account)} - ${account.accountTitle}` : "Unknown";
    },
    [accounts],
  );

  const { filtered, activeFilters } = useMemo(() => {
    const labels: string[] = [];
    let list = accountFilter === "all" ? records : records.filter((r) => r.accountId === accountFilter);
    if (accountFilter !== "all") labels.push(`Account: ${accountLabel(accountFilter)}`);

    const search = searchTerm.trim().toLowerCase();
    if (search) {
      list = list.filter((record) =>
        [
          record.serialNo || record.id,
          record.from?.accountTitle,
          record.to?.accountTitle,
          record.from?.chequeNumber,
          record.from?.amount,
          record.from?.inWords,
          record.to?.bank,
        ].some((value) => String(value || "").toLowerCase().includes(search)),
      );
      labels.push(`Search: "${searchTerm.trim()}"`);
    }

    let from: Date | null = null;
    let to: Date | null = null;
    const now = new Date();
    if (dateRange === "thisWeek") {
      const daysSinceMonday = (now.getDay() + 6) % 7;
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday);
      to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      labels.push("This Week");
    } else if (dateRange === "thisMonth") {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      labels.push("This Month");
    } else if (dateRange === "custom") {
      if (startDate) {
        from = new Date(`${startDate}T00:00:00`);
        labels.push(`From: ${displayDate(startDate)}`);
      }
      if (endDate) {
        to = new Date(`${endDate}T23:59:59.999`);
        labels.push(`To: ${displayDate(endDate)}`);
      }
    }
    if (from || to) {
      list = list.filter((record) => {
        const date = recordDate(record);
        if (!date) return false;
        return (!from || date >= from) && (!to || date <= to);
      });
    }

    if (minAmount || maxAmount) {
      const min = minAmount ? Number.parseFloat(minAmount) : Number.NEGATIVE_INFINITY;
      const max = maxAmount ? Number.parseFloat(maxAmount) : Number.POSITIVE_INFINITY;
      list = list.filter((record) => {
        const value = parseAmount(record.from?.amount);
        return !Number.isNaN(value) && value >= min && value <= max;
      });
      if (minAmount) labels.push(`Min Amount: ${minAmount}`);
      if (maxAmount) labels.push(`Max Amount: ${maxAmount}`);
    }

    const sorted = [...list].sort(
      (a, b) => recordTime(b.updatedAt || b.createdAt) - recordTime(a.updatedAt || a.createdAt),
    );
    return { filtered: sorted, activeFilters: labels };
  }, [records, accountFilter, searchTerm, dateRange, startDate, endDate, minAmount, maxAmount, accountLabel]);

  useEffect(() => {
    setCurrentPage(1);
  }, [accountFilter, searchTerm, dateRange, startDate, endDate, minAmount, maxAmount]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / RECORDS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const firstIndex = (page - 1) * RECORDS_PER_PAGE;
  const pageRecords = filtered.slice(firstIndex, firstIndex + RECORDS_PER_PAGE);

  const resetFilters = () => {
    setAccountFilter("all");
    setSearchTerm("");
    setDateRange("all");
    setStartDate("");
    setEndDate("");
    setMinAmount("");
    setMaxAmount("");
  };

  const handlePrint = (record: RtgsRecord) => {
    if (!printLetter(recordLetterHTML(record))) {
      toast({ title: "Please allow pop-ups to print the letter.", variant: "destructive" });
    }
  };

  const confirmDelete = async () => {
    const record = recordToDelete;
    if (!record?.sourceCollection) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, record.sourceCollection, record.id));
      setRecords((list) => list.filter((item) => recordKey(item) !== recordKey(record)));
      toast({ title: "Record deleted", description: record.serialNo || record.id });
    } catch (err) {
      console.error("Error deleting record:", err);
      toast({ title: "Failed to delete the record", variant: "destructive" });
    } finally {
      setDeleting(false);
      setRecordToDelete(null);
    }
  };

  const handleUpdated = (updated: RtgsRecord) => {
    setRecords((list) => list.map((item) => (recordKey(item) === recordKey(updated) ? updated : item)));
    setSelectedRecord(updated);
  };

  return (
    <RtgsShell
      title="RTGS List"
      description="All saved RAAST / RTGS letters from this app and the RTGS app."
      actions={
        <Button variant="outline" className="rounded-2xl" onClick={loadData} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
      }
    >
      {/* Per-account totals */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="rounded-3xl shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Total Records</p>
              <p className="mt-1 text-2xl font-bold">{records.length}</p>
            </div>
            <FileText className="h-6 w-6 text-muted-foreground" />
          </CardContent>
        </Card>
        {accounts.map((account) => (
          <Card key={account.id} className="rounded-3xl shadow-sm">
            <CardContent className="p-5">
              <p className="truncate text-sm text-muted-foreground" title={account.accountTitle}>
                {accountPrefix(account)} Records
              </p>
              <p className="mt-1 text-2xl font-bold">
                {records.filter((record) => record.accountId === account.id).length}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-3xl shadow-sm">
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Letters</CardTitle>
            <CardDescription>Search, view, edit, print and delete saved letters.</CardDescription>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by document number, account title, cheque number, amount, bank..."
                className="rounded-2xl pl-9 pr-9"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger className="rounded-2xl lg:w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {accountPrefix(account)} - {account.accountTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showFilters ? "default" : "outline"}
              className="rounded-2xl"
              onClick={() => setShowFilters((value) => !value)}
            >
              <Filter className="mr-2 h-4 w-4" />
              {showFilters ? "Hide Filters" : "Filters"}
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 gap-4 rounded-2xl border p-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select
                  value={dateRange}
                  onValueChange={(value) => {
                    setDateRange(value as DateRange);
                    if (value !== "custom") {
                      setStartDate("");
                      setEndDate("");
                    }
                  }}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="thisWeek">This Week</SelectItem>
                    <SelectItem value="thisMonth">This Month</SelectItem>
                    <SelectItem value="custom">Custom Date Range</SelectItem>
                  </SelectContent>
                </Select>
                {dateRange === "custom" && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="date" className="rounded-xl" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    <Input type="date" className="rounded-xl" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Amount Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    className="rounded-xl"
                    placeholder="Min Amount"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                  />
                  <Input
                    type="number"
                    className="rounded-xl"
                    placeholder="Max Amount"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Active filters:</span>
              {activeFilters.map((label) => (
                <Badge key={label} variant="secondary">
                  {label}
                </Badge>
              ))}
              <Button size="sm" variant="ghost" className="h-7" onClick={resetFilters}>
                Clear all
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading records...
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {records.length === 0
                ? "No records yet. Create a letter from RTGS Form to get started."
                : "No records match your search or filters."}
            </p>
          ) : (
            <>
              <p className="mb-3 text-xs text-muted-foreground">
                Showing {firstIndex + 1}-{Math.min(firstIndex + RECORDS_PER_PAGE, filtered.length)} of{" "}
                {filtered.length} records
              </p>
              <div className="overflow-x-auto rounded-2xl border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doc No</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Cheque No</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Bank</TableHead>
                      <TableHead>Created by</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageRecords.map((record) => {
                      const amount = parseAmount(record.from?.amount);
                      return (
                        <TableRow key={recordKey(record)}>
                          <TableCell className="whitespace-nowrap font-medium">{record.serialNo || record.id}</TableCell>
                          <TableCell>
                            <Badge variant={record.accountId === "1001" ? "default" : "secondary"} className="whitespace-nowrap">
                              {accountLabel(record.accountId)}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{displayDate(record.date)}</TableCell>
                          <TableCell>{record.from?.accountTitle || "N/A"}</TableCell>
                          <TableCell>{record.to?.accountTitle || "N/A"}</TableCell>
                          <TableCell>{record.from?.chequeNumber || "N/A"}</TableCell>
                          <TableCell className="whitespace-nowrap text-right">
                            {Number.isNaN(amount) ? "N/A" : amount.toLocaleString()}
                          </TableCell>
                          <TableCell>{record.to?.bank || "N/A"}</TableCell>
                          <TableCell className="whitespace-nowrap">{createdByName(record)}</TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="outline" title="View / Edit" onClick={() => setSelectedRecord(record)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" title="Print" onClick={() => handlePrint(record)}>
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                title="Delete"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setRecordToDelete(record)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <RtgsPagination page={page} totalPages={totalPages} onPageChange={setCurrentPage} />
            </>
          )}
        </CardContent>
      </Card>

      <RecordDialog
        record={selectedRecord}
        accountLabel={accountLabel(selectedRecord?.accountId)}
        onClose={() => setSelectedRecord(null)}
        onUpdated={handleUpdated}
      />

      <AlertDialog open={!!recordToDelete} onOpenChange={(open) => !open && !deleting && setRecordToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this letter?</AlertDialogTitle>
            <AlertDialogDescription>
              {recordToDelete?.serialNo || recordToDelete?.id} will be permanently deleted for everyone, including in
              the RTGS app. Its document number stays reserved.
              {(recordToDelete?.linkedPayments?.length ?? 0) > 0 &&
                ` The ${recordToDelete?.linkedPayments?.length} budget request / PO payment(s) it recorded stay recorded; correct them from Budget Requests or Purchase Orders if needed.`}
              {recordToDelete?.transfer &&
                " The account to account transfer it recorded stays recorded, and the account balances aren't changed back."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RtgsShell>
  );
}
