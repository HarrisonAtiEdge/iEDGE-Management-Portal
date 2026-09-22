import * as XLSX from "xlsx";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Download, RefreshCw } from "lucide-react";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PANEL_ID = "IEDGE-SYSTEM";

type AdjustmentType = "waiver" | "overpayment";
type GroupBy = "client" | "invoice" | "month" | "year";

type SundryAdjustment = {
  id: string;
  entryType?: AdjustmentType;
  adjustmentType?: AdjustmentType;
  direction?: "minus" | "plus";
  amount?: number;
  adjustmentAmount?: number;
  signedAmount?: number;
  invoiceId?: string;
  invoiceNo?: string;
  invoiceTotal?: number;
  invoiceDate?: string;
  invoiceDueDate?: string;
  clientId?: string;
  client?: string;
  clientName?: string;
  clientEmail?: string;
  paymentId?: string;
  paymentDate?: string;
  paymentYear?: number;
  paymentMonth?: number;
  paymentMonthKey?: string;
  method?: string;
  reference?: string;
  depositTo?: string;
  depositToName?: string;
  actualReceivedAmount?: number;
  appliedToInvoice?: number;
  waiverLimitUsed?: number;
  description?: string;
  status?: string;
  creditStatus?: string;
  availableClientCredit?: number;
  createdByName?: string;
  createdAt?: any;
};

type GroupedAdjustment = {
  key: string;
  label: string;
  entries: number;
  waiver: number;
  overpayment: number;
  net: number;
};

const money = (value: any) =>
  Number(value || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const numericAmount = (entry: SundryAdjustment) =>
  Number(entry.adjustmentAmount ?? entry.amount ?? 0) || 0;

const entryType = (entry: SundryAdjustment): AdjustmentType =>
  entry.entryType === "overpayment" || entry.adjustmentType === "overpayment"
    ? "overpayment"
    : "waiver";

const entryClient = (entry: SundryAdjustment) =>
  String(entry.clientName || entry.client || "Unknown Client").trim();

const entryInvoice = (entry: SundryAdjustment) =>
  String(entry.invoiceNo || entry.invoiceId || "Unknown Invoice").trim();

const entryDate = (entry: SundryAdjustment) =>
  String(entry.paymentDate || "").trim();

const timestampMillis = (value: any) => {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const safeFileName = (value: string) =>
  value.replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-");

export default function SundryAdjustments() {
  const [entries, setEntries] = useState<SundryAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | AdjustmentType>("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [invoiceFilter, setInvoiceFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("client");

  const loadEntries = async () => {
    try {
      setLoading(true);

      const snapshot = await getDocs(
        collection(db, "Panels", PANEL_ID, "sundryAdjustments"),
      );

      const rows = snapshot.docs.map(
        (documentSnapshot) =>
          ({
            id: documentSnapshot.id,
            ...documentSnapshot.data(),
          }) as SundryAdjustment,
      );

      rows.sort((a, b) => {
        const dateDifference = entryDate(b).localeCompare(entryDate(a));
        if (dateDifference !== 0) return dateDifference;
        return timestampMillis(b.createdAt) - timestampMillis(a.createdAt);
      });

      setEntries(rows);
    } catch (error) {
      console.error("Failed to load sundry adjustments:", error);
      alert("Failed to load Sundry Adjustments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const clients = useMemo(
    () => [...new Set(entries.map(entryClient))].sort(),
    [entries],
  );

  const invoices = useMemo(
    () => [...new Set(entries.map(entryInvoice))].sort(),
    [entries],
  );

  const years = useMemo(() => {
    const values = entries
      .map((entry) =>
        String(entry.paymentYear || entryDate(entry).slice(0, 4) || ""),
      )
      .filter(Boolean);

    return [...new Set(values)].sort((a, b) => Number(b) - Number(a));
  }, [entries]);

  const months = useMemo(() => {
    const values = entries
      .map((entry) => entry.paymentMonthKey || entryDate(entry).slice(0, 7))
      .filter(Boolean);

    return [...new Set(values)].sort().reverse();
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return entries.filter((entry) => {
      const type = entryType(entry);
      const client = entryClient(entry);
      const invoice = entryInvoice(entry);
      const date = entryDate(entry);
      const year = String(entry.paymentYear || date.slice(0, 4) || "");
      const month = entry.paymentMonthKey || date.slice(0, 7);

      if (typeFilter !== "all" && type !== typeFilter) return false;
      if (clientFilter !== "all" && client !== clientFilter) return false;
      if (invoiceFilter !== "all" && invoice !== invoiceFilter) return false;
      if (yearFilter !== "all" && year !== yearFilter) return false;
      if (monthFilter !== "all" && month !== monthFilter) return false;
      if (dateFrom && date && date < dateFrom) return false;
      if (dateTo && date && date > dateTo) return false;

      if (normalizedSearch) {
        const searchable = [
          client,
          invoice,
          entry.clientEmail,
          entry.reference,
          entry.method,
          entry.depositToName,
          entry.description,
          entry.createdByName,
        ]
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(normalizedSearch)) return false;
      }

      return true;
    });
  }, [
    entries,
    search,
    typeFilter,
    clientFilter,
    invoiceFilter,
    yearFilter,
    monthFilter,
    dateFrom,
    dateTo,
  ]);

  const totals = useMemo(() => {
    return filteredEntries.reduce(
      (result, entry) => {
        const amount = numericAmount(entry);

        if (entryType(entry) === "overpayment") {
          result.overpayment += amount;
        } else {
          result.waiver += amount;
        }

        result.entries += 1;
        result.net = result.overpayment - result.waiver;
        return result;
      },
      { entries: 0, waiver: 0, overpayment: 0, net: 0 },
    );
  }, [filteredEntries]);

  const groupedEntries = useMemo(() => {
    const groups = new Map<string, GroupedAdjustment>();

    filteredEntries.forEach((entry) => {
      const date = entryDate(entry);
      const year = String(entry.paymentYear || date.slice(0, 4) || "Unknown");
      const month = entry.paymentMonthKey || date.slice(0, 7) || "Unknown";

      const key =
        groupBy === "client"
          ? entryClient(entry)
          : groupBy === "invoice"
            ? entryInvoice(entry)
            : groupBy === "month"
              ? month
              : year;

      const existing = groups.get(key) || {
        key,
        label: key,
        entries: 0,
        waiver: 0,
        overpayment: 0,
        net: 0,
      };

      const amount = numericAmount(entry);
      existing.entries += 1;

      if (entryType(entry) === "overpayment") {
        existing.overpayment += amount;
      } else {
        existing.waiver += amount;
      }

      existing.net = existing.overpayment - existing.waiver;
      groups.set(key, existing);
    });

    return [...groups.values()].sort((a, b) => {
      if (groupBy === "year" || groupBy === "month") {
        return b.key.localeCompare(a.key);
      }
      return a.label.localeCompare(b.label);
    });
  }, [filteredEntries, groupBy]);

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setClientFilter("all");
    setInvoiceFilter("all");
    setYearFilter("all");
    setMonthFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const handleExport = () => {
    const workbook = XLSX.utils.book_new();

    const detailRows = filteredEntries.map((entry, index) => ({
      "#": index + 1,
      Type: entryType(entry) === "waiver" ? "Waiver" : "Overpayment",
      Direction: entryType(entry) === "waiver" ? "Minus" : "Plus",
      Date: entryDate(entry) || "-",
      Year: entry.paymentYear || entryDate(entry).slice(0, 4) || "-",
      Month: entry.paymentMonthKey || entryDate(entry).slice(0, 7) || "-",
      Client: entryClient(entry),
      "Client Email": entry.clientEmail || "-",
      "Invoice No": entryInvoice(entry),
      "Invoice Total": Number(entry.invoiceTotal || 0),
      "Actual Payment": Number(entry.actualReceivedAmount || 0),
      "Applied to Invoice": Number(entry.appliedToInvoice || 0),
      "Adjustment Amount": numericAmount(entry),
      "Signed Amount": Number(
        entry.signedAmount ??
          (entryType(entry) === "waiver"
            ? -numericAmount(entry)
            : numericAmount(entry)),
      ),
      Method: entry.method || "-",
      Reference: entry.reference || "-",
      Account: entry.depositToName || "-",
      Status: entry.creditStatus || entry.status || "-",
      "Created By": entry.createdByName || "-",
    }));

    const summaryRows = groupedEntries.map((group) => ({
      Group: group.label,
      Entries: group.entries,
      Waivers: Number(group.waiver.toFixed(2)),
      Overpayments: Number(group.overpayment.toFixed(2)),
      "Net Plus/Minus": Number(group.net.toFixed(2)),
    }));

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(detailRows),
      "Sundry Details",
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(summaryRows),
      "Grouped Summary",
    );

    XLSX.writeFile(
      workbook,
      `${safeFileName(`Sundry-Adjustments-${new Date().toISOString().slice(0, 10)}`)}.xlsx`,
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Sundry Adjustments
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Review invoice waivers as minus adjustments and excess receipts as
            plus client credit. Filter and group records client-wise,
            invoice-wise, date-wise, month-wise, or year-wise.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={loadEntries} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleExport} disabled={filteredEntries.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Filtered Entries</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {totals.entries}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm text-amber-700">Total Waived (Minus)</p>
          <p className="mt-2 text-2xl font-semibold text-amber-900">
            Rs {money(totals.waiver)}
          </p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-sm text-blue-700">Overpayment Credit (Plus)</p>
          <p className="mt-2 text-2xl font-semibold text-blue-900">
            Rs {money(totals.overpayment)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Net Plus / Minus</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            Rs {money(totals.net)}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="xl:col-span-2">
            <Label htmlFor="sundry-search">Search</Label>
            <Input
              id="sundry-search"
              className="mt-2"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Client, invoice, reference, account..."
            />
          </div>

          <div>
            <Label>Adjustment Type</Label>
            <select
              className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as "all" | AdjustmentType)
              }
            >
              <option value="all">All</option>
              <option value="waiver">Waiver — Minus</option>
              <option value="overpayment">Overpayment — Plus</option>
            </select>
          </div>

          <div>
            <Label>Group Summary By</Label>
            <select
              className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={groupBy}
              onChange={(event) => setGroupBy(event.target.value as GroupBy)}
            >
              <option value="client">Client</option>
              <option value="invoice">Invoice</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
          </div>

          <div>
            <Label>Client</Label>
            <select
              className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={clientFilter}
              onChange={(event) => setClientFilter(event.target.value)}
            >
              <option value="all">All Clients</option>
              {clients.map((client) => (
                <option key={client} value={client}>
                  {client}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Invoice</Label>
            <select
              className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={invoiceFilter}
              onChange={(event) => setInvoiceFilter(event.target.value)}
            >
              <option value="all">All Invoices</option>
              {invoices.map((invoiceNumber) => (
                <option key={invoiceNumber} value={invoiceNumber}>
                  {invoiceNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Year</Label>
            <select
              className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={yearFilter}
              onChange={(event) => setYearFilter(event.target.value)}
            >
              <option value="all">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Month</Label>
            <select
              className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={monthFilter}
              onChange={(event) => setMonthFilter(event.target.value)}
            >
              <option value="all">All Months</option>
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="sundry-date-from">Date From</Label>
            <Input
              id="sundry-date-from"
              className="mt-2"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="sundry-date-to">Date To</Label>
            <Input
              id="sundry-date-to"
              className="mt-2"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
        </div>

        <div className="mt-4">
          <Button type="button" variant="outline" onClick={resetFilters}>
            Clear Filters
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">
          {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)} Summary
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[700px] w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-3 py-3 text-left font-medium">Group</th>
                <th className="px-3 py-3 text-right font-medium">Entries</th>
                <th className="px-3 py-3 text-right font-medium">Waiver</th>
                <th className="px-3 py-3 text-right font-medium">
                  Overpayment
                </th>
                <th className="px-3 py-3 text-right font-medium">Net</th>
              </tr>
            </thead>
            <tbody>
              {groupedEntries.length > 0 ? (
                groupedEntries.map((group) => (
                  <tr key={group.key} className="border-b border-slate-100">
                    <td className="px-3 py-3 font-medium text-slate-900">
                      {group.label}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-700">
                      {group.entries}
                    </td>
                    <td className="px-3 py-3 text-right text-amber-700">
                      Rs {money(group.waiver)}
                    </td>
                    <td className="px-3 py-3 text-right text-blue-700">
                      Rs {money(group.overpayment)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-900">
                      Rs {money(group.net)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-8 text-center text-slate-500"
                  >
                    No matching Sundry Adjustments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">
          Adjustment Details
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[1450px] w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-3 py-3 text-left font-medium">Date</th>
                <th className="px-3 py-3 text-left font-medium">Type</th>
                <th className="px-3 py-3 text-left font-medium">Client</th>
                <th className="px-3 py-3 text-left font-medium">Invoice</th>
                <th className="px-3 py-3 text-right font-medium">
                  Invoice Total
                </th>
                <th className="px-3 py-3 text-right font-medium">
                  Actual Payment
                </th>
                <th className="px-3 py-3 text-right font-medium">
                  Applied to Invoice
                </th>
                <th className="px-3 py-3 text-right font-medium">
                  Adjustment
                </th>
                <th className="px-3 py-3 text-left font-medium">Method</th>
                <th className="px-3 py-3 text-left font-medium">Reference</th>
                <th className="px-3 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry) => {
                  const type = entryType(entry);

                  return (
                    <tr key={entry.id} className="border-b border-slate-100">
                      <td className="px-3 py-3 text-slate-700">
                        {entryDate(entry) || "-"}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            type === "waiver"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {type === "waiver" ? "Waiver — Minus" : "Overpayment — Plus"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        <div className="font-medium text-slate-900">
                          {entryClient(entry)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {entry.clientEmail || "-"}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {entryInvoice(entry)}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-700">
                        Rs {money(entry.invoiceTotal)}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-700">
                        Rs {money(entry.actualReceivedAmount)}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-700">
                        Rs {money(entry.appliedToInvoice)}
                      </td>
                      <td
                        className={`px-3 py-3 text-right font-semibold ${
                          type === "waiver" ? "text-amber-700" : "text-blue-700"
                        }`}
                      >
                        {type === "waiver" ? "−" : "+"} Rs {money(numericAmount(entry))}
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {entry.method || "-"}
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {entry.reference || "-"}
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {entry.creditStatus || entry.status || "-"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={11}
                    className="px-3 py-10 text-center text-slate-500"
                  >
                    {loading
                      ? "Loading Sundry Adjustments..."
                      : "No matching adjustment records found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}