import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Payment {
  id: string;
  paymentDate: string;
  invoiceNo: string;
  client: string;
  method: string;
  reference: string;
  amount: number;
  invoiceTotal: number;
  balanceAfter: number;
  depositTo: string;
}

export default function PaymentTransactions() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("iedge");

  const [clientFilter, setClientFilter] = useState("");
  const [invoiceFilter, setInvoiceFilter] = useState("");

  const [dateRange, setDateRange] = useState("all");

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    const paymentSnap = await getDocs(
      collection(db, "Panels", "IEDGE-SYSTEM", "payments"),
    );

    const invoiceSnap = await getDocs(
      collection(db, "Panels", "IEDGE-SYSTEM", "estimateInvoices"),
    );

    const invoiceMap: any = {};

    invoiceSnap.forEach((doc) => {
      invoiceMap[doc.id] = doc.data();
    });

    const data: Payment[] = [];

    paymentSnap.forEach((doc) => {
      const p: any = doc.data();
      const invoice = invoiceMap[p.invoiceId];

      data.push({
        id: doc.id,
        paymentDate: p.paymentDate,
        client: p.client,
        method: p.method,
        reference: p.reference,
        amount: Number(p.amount || 0),

        invoiceNo: p.invoiceNo || invoice?.invoiceNo || "-",
        invoiceTotal: invoice?.total ?? 0,

        balanceAfter: p.balanceAfter ?? invoice?.balance ?? invoice?.total ?? 0,

        depositTo: p.depositTo,
      });
    });

    setPayments(data);
  };

  /* DATE RANGE */

  const getDateRange = () => {
    const now = new Date();

    if (dateRange === "today") {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    if (dateRange === "thisMonth") {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }

    if (dateRange === "lastMonth") {
      return new Date(now.getFullYear(), now.getMonth() - 1, 1);
    }

    return null;
  };

  const rangeDate = getDateRange();

  /* FILTER */

  let filteredPayments = payments.filter((p) => {
    if (p.depositTo !== selectedAccount) return false;

    if (
      clientFilter &&
      !p.client?.toLowerCase().includes(clientFilter.toLowerCase())
    )
      return false;

    if (
      invoiceFilter &&
      !p.invoiceNo?.toLowerCase().includes(invoiceFilter.toLowerCase())
    )
      return false;

    if (rangeDate) {
      if (new Date(p.paymentDate) < rangeDate) return false;
    }

    return true;
  });

  /* SORT LATEST FIRST */

  filteredPayments = filteredPayments.sort((a, b) => {
    return (
      new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    );
  });

  /* TOTAL */

  const totalReceived = filteredPayments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0,
  );

  /* PAGINATION */

  const totalPages = Math.ceil(filteredPayments.length / perPage);

  const paginated = filteredPayments.slice(
    (page - 1) * perPage,
    page * perPage,
  );

  /* EXPORT EXCEL */

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredPayments);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger");

    XLSX.writeFile(workbook, "ledger.xlsx");
  };

  /* EXPORT PDF */

  const exportPDF = () => {
    const doc = new jsPDF();

    autoTable(doc, {
      head: [
        [
          "Date",
          "Invoice",
          "Client",
          "Method",
          "Reference",
          "Invoice Total",
          "Amount",
          "Pending",
        ],
      ],

      body: filteredPayments.map((p) => [
        p.paymentDate,
        p.invoiceNo,
        p.client,
        p.method,
        p.reference,
        p.invoiceTotal,
        p.amount,
        p.balanceAfter,
      ]),
    });

    doc.save("ledger.pdf");
  };

  return (
    <div className="bg-white shadow rounded p-6">
      {/* HEADER */}

      <div className="flex justify-between items-center mb-6">
        <h2 className="font-semibold text-lg">Account Ledger</h2>

        <div className="flex gap-3">
          <button
            onClick={exportExcel}
            className="border px-3 py-1 rounded text-sm"
          >
            Export Excel
          </button>

          <button
            onClick={exportPDF}
            className="border px-3 py-1 rounded text-sm"
          >
            Export PDF
          </button>
        </div>

        <div className="w-[250px]">
          <Select
            value={selectedAccount}
            onValueChange={(v) => setSelectedAccount(v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Account" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="iedge">iEDGE</SelectItem>

              <SelectItem value="iedge-travel">IEDGE Travel & Tours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border rounded p-4 bg-gray-50">
          <div className="text-sm text-gray-500">Total Received</div>

          <div className="text-xl font-bold text-green-600">
            Rs {totalReceived.toLocaleString()}
          </div>
        </div>

        <div className="border rounded p-4 bg-gray-50">
          <div className="text-sm text-gray-500">Total Transactions</div>

          <div className="text-xl font-bold">{filteredPayments.length}</div>
        </div>

        <div className="border rounded p-4 bg-gray-50">
          <div className="text-sm text-gray-500">Account</div>

          <div className="text-lg font-semibold">
            {selectedAccount === "iedge" ? "iEDGE" : "IEDGE Travel & Tours"}
          </div>
        </div>
      </div>

      {/* DATE FILTER BAR */}

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Date Range:</span>

          {["all", "today", "thisMonth", "lastMonth"].map((range) => (
            <button
              key={range}
              onClick={() => {
                setDateRange(range);
                setPage(1);
              }}
              className={`px-3 py-1 rounded text-sm border
${dateRange === range ? "bg-black text-white" : "bg-white hover:bg-gray-100"}
`}
            >
              {range === "all" && "All"}
              {range === "today" && "Today"}
              {range === "thisMonth" && "This Month"}
              {range === "lastMonth" && "Last Month"}
            </button>
          ))}

          <span className="ml-4 text-sm text-gray-500">
            Showing {filteredPayments.length} result(s)
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Rows:</span>

            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
          >
            Prev
          </button>

          <span className="text-sm">
            Page {page} / {totalPages || 1}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* SEARCH */}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <input
          type="text"
          placeholder="Search Client"
          className="border p-2 rounded"
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
        />

        <input
          type="text"
          placeholder="Search Invoice"
          className="border p-2 rounded"
          value={invoiceFilter}
          onChange={(e) => setInvoiceFilter(e.target.value)}
        />
      </div>

      {/* TABLE */}

      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Date</th>

              <th className="p-3 text-left">Invoice</th>

              <th className="p-3 text-left">Client</th>

              <th className="p-3 text-left">Payment Method</th>

              <th className="p-3 text-left">Reference</th>

              <th className="p-3 text-right">Invoice Total</th>

              <th className="p-3 text-right">Amount</th>

              <th className="p-3 text-right">Pending</th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="p-3">{p.paymentDate}</td>

                <td className="p-3 font-medium">{p.invoiceNo}</td>

                <td className="p-3">{p.client}</td>

                <td className="p-3">{p.method}</td>

                <td className="p-3">{p.reference}</td>

                <td className="p-3 text-right text-blue-600">
                  Rs {Number(p.invoiceTotal).toLocaleString()}
                </td>

                <td className="p-3 text-right text-green-600 font-semibold">
                  Rs {Number(p.amount).toLocaleString()}
                </td>

                <td className="p-3 text-right text-red-600">
                  Rs {Number(p.balanceAfter).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
