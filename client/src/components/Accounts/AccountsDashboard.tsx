import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function AccountsDashboard() {
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const paySnap = await getDocs(
      collection(db, "Panels", "IEDGE-SYSTEM", "payments"),
    );

    const invSnap = await getDocs(
      collection(db, "Panels", "IEDGE-SYSTEM", "estimateInvoices"),
    );

    const payData: any[] = [];
    const invData: any[] = [];

    paySnap.forEach((doc) => {
      payData.push({ id: doc.id, ...doc.data() });
    });

    invSnap.forEach((doc) => {
      invData.push({ id: doc.id, ...doc.data() });
    });

    // latest first sorting
    payData.sort(
      (a, b) =>
        new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime(),
    );

    setPayments(payData);
    setInvoices(invData);
  };

  // DATE FILTER

  const filteredPayments = payments.filter((p) => {
    if (!startDate || !endDate) return true;

    const date = new Date(p.paymentDate);
    return date >= new Date(startDate) && date <= new Date(endDate);
  });

  // ACCOUNT FILTERS

  const iedgePayments = filteredPayments.filter((p) => p.depositTo === "iedge");

  const travelPayments = filteredPayments.filter(
    (p) => p.depositTo === "iedge-travel",
  );

  const iedgeTotal = iedgePayments.reduce((sum, p) => sum + p.amount, 0);

  const travelTotal = travelPayments.reduce((sum, p) => sum + p.amount, 0);

  const totalReceived = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  const totalInvoice = invoices.reduce((sum, i) => sum + (i.total || 0), 0);

  const totalPending = invoices.reduce(
    (sum, i) => sum + (i.balance ?? i.total),
    0,
  );

  // GRAPH DATA

  const barData = [
    {
      name: "iEDGE",
      received: iedgeTotal,
    },
    {
      name: "Travel",
      received: travelTotal,
    },
  ];

  const pieData = [
    { name: "Received", value: totalReceived },
    { name: "Pending", value: totalPending },
  ];

  const COLORS = ["#4f46e5", "#ef4444"];

  // EXPORT EXCEL

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredPayments);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");

    XLSX.writeFile(workbook, "Accounts_Report.xlsx");
  };

  // EXPORT PDF

  const exportPDF = () => {
    const doc = new jsPDF();

    autoTable(doc, {
      head: [["Date", "Client", "Method", "Account", "Reference", "Amount"]],

      body: filteredPayments.map((p) => [
        p.paymentDate,
        p.client,
        p.method,
        p.depositTo,
        p.reference,
        p.amount,
      ]),
    });

    doc.save("Accounts_Report.pdf");
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Accounts Dashboard</h1>

      {/* DATE FILTER */}

      <div className="flex gap-4 mb-6">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border p-2 rounded"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border p-2 rounded"
        />

        <button
          onClick={exportExcel}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Export Excel
        </button>

        <button
          onClick={exportPDF}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Export PDF
        </button>
      </div>

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded shadow">
          <div className="text-gray-500 text-sm">Total Received</div>
          <div className="text-xl font-bold text-green-600">
            Rs {totalReceived}
          </div>
        </div>

        <div className="bg-white p-5 rounded shadow">
          <div className="text-gray-500 text-sm">Total Pending</div>
          <div className="text-xl font-bold text-red-500">
            Rs {totalPending}
          </div>
        </div>

        <div className="bg-white p-5 rounded shadow">
          <div className="text-gray-500 text-sm">iEDGE Total</div>
          <div className="text-xl font-bold text-blue-600">Rs {iedgeTotal}</div>
        </div>

        <div className="bg-white p-5 rounded shadow">
          <div className="text-gray-500 text-sm">Travel Total</div>
          <div className="text-xl font-bold text-purple-600">
            Rs {travelTotal}
          </div>
        </div>
      </div>

      {/* GRAPHS */}

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="font-semibold mb-4">Account Comparison</h2>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <XAxis dataKey="name" />

              <YAxis />

              <Tooltip />

              <Bar dataKey="received" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="font-semibold mb-4">Received vs Pending</h2>

          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" outerRadius={100} label>
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TRANSACTIONS */}

      <div className="bg-white p-6 rounded shadow">
        <h2 className="font-semibold mb-4">Latest Transactions</h2>

        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Client</th>
              <th className="p-2 text-left">Method</th>
              <th className="p-2 text-left">Account</th>
              <th className="p-2 text-left">Reference</th>
              <th className="p-2 text-right">Amount</th>
            </tr>
          </thead>

          <tbody>
            {filteredPayments.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="p-2">{p.paymentDate}</td>

                <td className="p-2">{p.client}</td>

                <td className="p-2">{p.method}</td>

                <td className="p-2">
                  {p.depositTo === "iedge" ? "iEDGE" : "iEDGE Travel"}
                </td>

                <td className="p-2">{p.reference}</td>

                <td className="p-2 text-right font-semibold">Rs {p.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
