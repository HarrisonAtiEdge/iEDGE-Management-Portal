
import React, { useEffect, useMemo, useState } from "react";
import { Estimate } from "../../types";
import { Button } from "@/components/ui/button";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";
import { deleteDoc, doc as docRef } from "firebase/firestore";
import { buildEstimatePdfBlob } from "@/lib/estimatePdf";
import { Eye, Pencil, Copy, Trash2 } from "lucide-react";
import { updateDoc } from "firebase/firestore";
import * as XLSX from "xlsx";

type Props = {
  onEdit: (estimate: Estimate) => void;
  onDuplicate: (estimate: Estimate) => void;
};

export default function EstimateList({ onEdit, onDuplicate }: Props) {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(
    null,
  );
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOperationAdmin, setIsOperationAdmin] = useState(false);
  const [isFinancialAdmin, setIsFinancialAdmin] = useState(false);

  const estimatesRef = collection(db, "Panels", "IEDGE-SYSTEM", "estimates");

  const companyList = [
    { name: "iEDGE", logo: "/Iedge-TM-Logos-01.png" },
    {
      name: "iEDGE - Digital & Creative",
      logo: "/Iedge-Digital-and-Creative-TM-Logos-12.png",
    },
    { name: "iEDGE - Events & Activations", logo: "/iedge-events-logo.png" },
    {
      name: "iEDGE - Health Sciences",
      logo: "/Iedge-Health-Sciences-TM-Logos-05.png",
    },
    { name: "iEDGE - International Education", logo: "/iedge-edu-logo.png" },
    { name: "iEDGE - Trading", logo: "/Iedge-Trade-TM-Logos-10.png" },
    { name: "iEDGE - Travel & Tours", logo: "/iedge-travel-logo.png" },
    { name: "Catapult", logo: "/Catapult-TM-Logos-03.png" },
    { name: "iConsultant", logo: "/Consultant-TM-Logos-02.png" },
    { name: "Let's Save Green", logo: "/Lets-save-Green-TM-Logos-04.png" },
    { name: "Emaan Biz", logo: "/Emaan-Biz-TM-Logos-06.png" },
  ];

  const PAGE_WINDOW = 3;

  function getVisiblePages(currentPage: number, totalPages: number) {
    if (totalPages <= 0) return [];
    if (totalPages <= PAGE_WINDOW) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const maxStart = Math.max(1, totalPages - PAGE_WINDOW + 1);
    const rawStart =
      Math.floor((currentPage - 1) / PAGE_WINDOW) * PAGE_WINDOW + 1;

    const start = Math.min(rawStart, maxStart);
    const end = Math.min(start + PAGE_WINDOW - 1, totalPages);

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  useEffect(() => {
    let unsubSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setEstimates([]);
        return;
      }

      const uid = user.uid;

      const userSnap = await getDoc(
        doc(db, "Panels", "IEDGE-SYSTEM", "users", uid),
      );
      const userData = userSnap.data();

      const adminCheck = userData?.isAdmin === true;
      const operationAdminCheck = userData?.isOperationAdmin === true;
      const financialAdminCheck = userData?.isFinancialAdmin === true;

      setIsAdmin(adminCheck);
      setIsOperationAdmin(operationAdminCheck);
      setIsFinancialAdmin(financialAdminCheck);

      const usersSnapshot = await getDocs(
        collection(db, "Panels", "IEDGE-SYSTEM", "users"),
      );
      const map: Record<string, any> = {};
      usersSnapshot.forEach((u) => (map[u.id] = u.data()));
      setUsersMap(map);

      const q =
        adminCheck || operationAdminCheck || financialAdminCheck
          ? query(estimatesRef)
          : query(estimatesRef, where("createdBy", "==", uid));

      unsubSnapshot = onSnapshot(q, (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Estimate),
        }));

        const getTime = (x: any) => {
          const v = x?.createdAt ?? x?.updatedAt;

          if (v?.toMillis) return v.toMillis();
          if (v instanceof Date) return v.getTime();
          if (typeof v === "number") return v;

          if (typeof v === "string") {
            const t = new Date(v).getTime();
            if (!Number.isNaN(t)) return t;
          }

          const ds = x?.date;
          if (typeof ds === "string") {
            const t = new Date(ds).getTime();
            if (!Number.isNaN(t)) return t;
          }

          const eno = x?.estimateNo;
          if (typeof eno === "string") {
            const m = eno.match(/(\d+)(?!.*\d)/);
            if (m) return Number(m[1]);
          }

          return 0;
        };

        list.sort((a: any, b: any) => getTime(b) - getTime(a));

        setEstimates(list);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this estimate?",
    );
    if (!confirmDelete) return;

    try {
      await deleteDoc(docRef(db, "Panels", "IEDGE-SYSTEM", "estimates", id));
      alert("Estimate deleted successfully.");
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete estimate.");
    }
  };

  const handleViewDetail = async (estimate: Estimate) => {
    setSelectedEstimate(estimate);

    const blob = await buildEstimatePdfBlob({
      estimate,
      companyList,
      usersMap,
      companyName: estimate.company || "",
    });

    const url = URL.createObjectURL(blob);
    setPreviewURL(url);
    setIsDrawerOpen(true);
  };

  const formatDateWithMonthName = (dateStr?: string) => {
    if (!dateStr) return "";

    const [year, month, day] = dateStr.split("-");
    const date = new Date(Number(year), Number(month) - 1, Number(day));

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const StatusBadge = ({ status }: { status?: string }) => {
    const s = status || "RFQ Sent";

    const base =
      "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold";

    const cls =
      s === "Approved"
        ? "bg-green-100 text-green-800"
        : s === "Rejected"
          ? "bg-red-100 text-red-800"
          : s === "Project Cancelled"
            ? "bg-gray-200 text-gray-800"
            : s === "Invoiced"
              ? "bg-blue-100 text-blue-800"
              : s === "Payment Received"
                ? "bg-emerald-100 text-emerald-800"
                : s === "PO Received"
                  ? "bg-purple-100 text-purple-800"
                  : "bg-yellow-100 text-yellow-800";

    return <span className={`${base} ${cls}`}>{s}</span>;
  };

  const STATUS_OPTIONS = [
    "RFQ Sent",
    "Approved",
    "Rejected",
    "Project Cancelled",
    "Invoiced",
    "Payment Received",
    "PO Received",
  ];

  const STATUS_STYLES: Record<string, string> = {
    "RFQ Sent": "bg-yellow-100 text-yellow-800 border-yellow-300",
    Approved: "bg-green-100 text-green-800 border-green-300",
    Rejected: "bg-red-100 text-red-800 border-red-300",
    "Project Cancelled": "bg-gray-200 text-gray-800 border-gray-300",
    Invoiced: "bg-blue-100 text-blue-800 border-blue-300",
    "Payment Received": "bg-emerald-100 text-emerald-800 border-emerald-300",
    "PO Received": "bg-purple-100 text-purple-800 border-purple-300",
  };

  const handleStatusChange = async (estimateId: string, newStatus: string) => {
    try {
      await updateDoc(
        doc(db, "Panels", "IEDGE-SYSTEM", "estimates", estimateId),
        {
          status: newStatus,
          updatedAt: new Date(),
        },
      );
    } catch (error) {
      console.error("Status update failed:", error);
      alert("Failed to update status");
    }
  };

  const [estimateFilter, setEstimateFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [createdByFilter, setCreatedByFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [dateRange, setDateRange] = useState<
    "all" | "today" | "7days" | "thisMonth" | "lastMonth"
  >("all");

  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const isDateInRange = (dateStr?: string) => {
    if (!dateStr || dateRange === "all") return true;

    const d = new Date(dateStr);
    const now = new Date();

    if (dateRange === "today") return d.toDateString() === now.toDateString();

    if (dateRange === "7days") {
      const x = new Date();
      x.setDate(now.getDate() - 7);
      return d >= x;
    }

    if (dateRange === "thisMonth")
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );

    if (dateRange === "lastMonth") {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return (
        d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear()
      );
    }

    return true;
  };

  const createdByOptions = useMemo(() => {
    const names = estimates
      .map((e) => usersMap[e.createdBy]?.displayName || "Unknown")
      .filter(Boolean);

    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  }, [estimates, usersMap]);

  const filteredEstimates = estimates.filter((e) => {
    const estimateMatch = (e.estimateNo ?? "")
      .toLowerCase()
      .includes(estimateFilter.toLowerCase());

    const clientMatch = (e.client ?? "")
      .toLowerCase()
      .includes(clientFilter.toLowerCase());

    const subjectMatch = (e.subject ?? "")
      .toLowerCase()
      .includes(subjectFilter.toLowerCase());

    const createdByName = usersMap[e.createdBy]?.displayName || "Unknown";
    const createdByMatch = createdByFilter
      ? createdByName === createdByFilter
      : true;

    const dateMatch = isDateInRange(e.date);

    const amount = Number(e.total || 0);
    const minOk = minAmount ? amount >= Number(minAmount) : true;
    const maxOk = maxAmount ? amount <= Number(maxAmount) : true;

    return (
      estimateMatch &&
      clientMatch &&
      subjectMatch &&
      createdByMatch &&
      dateMatch &&
      minOk &&
      maxOk
    );
  });

  const totalPages = Math.ceil(filteredEstimates.length / itemsPerPage);

  useEffect(() => {
    if (totalPages <= 0) {
      if (currentPage !== 1) setCurrentPage(1);
      return;
    }
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const paginatedEstimates = filteredEstimates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    estimateFilter,
    clientFilter,
    subjectFilter,
    createdByFilter,
    dateRange,
    minAmount,
    maxAmount,
    itemsPerPage,
  ]);

  const handleExport = () => {
    const exportData = filteredEstimates.map((e) => ({
      "Estimate No": e.estimateNo || "",
      Client: e.client || "",
      Subject: e.subject || "",
      Date: formatDateWithMonthName(e.date),
      Amount: Number(e.total ?? 0),
      "Edit Count": (e as any).editCount ?? 0,
      "Created By": usersMap[e.createdBy]?.displayName || "Unknown",
      Status: e.status || "RFQ Sent",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Estimates");
    XLSX.writeFile(workbook, "estimates.xlsx");
  };

  const visiblePages = getVisiblePages(currentPage, totalPages);
  const windowStart = visiblePages[0] ?? 1;
  const windowEnd = visiblePages[visiblePages.length - 1] ?? 1;

  const startRow =
    filteredEstimates.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endRow = Math.min(currentPage * itemsPerPage, filteredEstimates.length);

  return (
    <div className="mt-8 px-4">
      <div className="flex justify-end items-center gap-3 mb-3 text-sm">
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={filteredEstimates.length === 0}
        >
          Export
        </Button>

        <div className="flex items-center gap-2">
          <span>Rows:</span>
          <select
            className="border px-2 py-1 rounded"
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          className="px-3 py-1 border rounded disabled:opacity-40"
        >
          Prev
        </button>

        <span>
          Page {totalPages === 0 ? 0 : currentPage} / {totalPages}
        </span>

        <button
          disabled={totalPages <= 0 || currentPage === totalPages}
          onClick={() =>
            setCurrentPage((p) => Math.min(totalPages || 1, p + 1))
          }
          className="px-3 py-1 border rounded disabled:opacity-40"
        >
          Next
        </button>
      </div>

      <table className="w-full border text-xs">
        <thead className="bg-gray-100">
          <tr className="border-b hover:bg-gray-50">
            <th className="text-left">Estimate No</th>
            <th className="text-left">Client</th>
            <th className="text-left">Subject</th>
            <th className="text-left">Date</th>
            <th className="text-right pr-6">Amount</th>
            <th className="text-right pr-6">Edit Count</th>
            <th className="text-left">Created By</th>
            <th className="text-left">Actions</th>
            <th className="text-left">Status</th>
          </tr>

          <tr className="bg-gray-50 text-xs">
            <th>
              <input
                className="border px-1 py-0.5 w-full"
                placeholder="Search"
                value={estimateFilter}
                onChange={(e) => setEstimateFilter(e.target.value)}
              />
            </th>

            <th>
              <input
                className="border px-1 py-0.5 w-full"
                placeholder="Search"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
              />
            </th>

            <th>
              <input
                className="border px-1 py-0.5 w-full"
                placeholder="Search"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
              />
            </th>

            <th>
              <select
                className="border px-1 py-0.5 w-full"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
              >
                <option value="all">All</option>
                <option value="today">Today</option>
                <option value="7days">7 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
              </select>
            </th>

            <th>
              <div className="flex gap-1">
                <input
                  type="number"
                  placeholder="Min"
                  className="border px-1 py-0.5 w-1/2"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="border px-1 py-0.5 w-1/2"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                />
              </div>
            </th>

            <th />

            <th>
              <select
                className="border px-1 py-0.5 w-full"
                value={createdByFilter}
                onChange={(e) => setCreatedByFilter(e.target.value)}
              >
                <option value="">All</option>
                {createdByOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </th>

            <th />

            <th />
          </tr>
        </thead>

        <tbody>
          {paginatedEstimates.map((e, i) => (
            <tr key={i} className="text-left border-b hover:bg-gray-50">
              <td>{e.estimateNo}</td>
              <td>{e.client}</td>
              <td>{e.subject}</td>
              <td>{formatDateWithMonthName(e.date)}</td>

              <td className="text-right pr-6">
                Rs.{" "}
                {Number(e.total ?? 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </td>

              <td className="text-right pr-6">{(e as any).editCount ?? 0}</td>
              <td>{usersMap[e.createdBy]?.displayName || "Unknown"}</td>

              <td>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="View Detail"
                    onClick={() => handleViewDetail(e)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    title="Edit"
                    onClick={() => onEdit(e)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    title="Duplicate"
                    onClick={() => {
                      const dup = { ...e, id: undefined, estimateNo: "" };
                      onDuplicate(dup);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>

                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete"
                      className="text-red-600 hover:bg-red-100"
                      onClick={() => handleDelete((e as any).id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </td>

              <td>
                {isAdmin || isOperationAdmin ? (
                  <select
                    value={e.status || "RFQ Sent"}
                    onChange={(ev) =>
                      handleStatusChange((e as any).id!, ev.target.value)
                    }
                    className={`text-xs font-semibold px-2 py-1 rounded border ${
                      STATUS_STYLES[e.status || "RFQ Sent"]
                    }`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                ) : (
                  <StatusBadge status={e.status} />
                )}
              </td>
            </tr>
          ))}

          {filteredEstimates.length === 0 && (
            <tr>
              <td colSpan={9} className="py-4 text-center">
                No estimates found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex justify-between items-center mt-4 text-sm">
        <div>
          Showing {startRow}–{endRow} of {filteredEstimates.length}
        </div>

        <div className="flex gap-1 items-center">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Prev
          </button>

          {totalPages > 0 && (
            <>
              {windowStart > 1 && (
                <>
                  <button
                    onClick={() => setCurrentPage(1)}
                    className={`px-3 py-1 border rounded ${
                      currentPage === 1 ? "bg-black text-white" : ""
                    }`}
                  >
                    1
                  </button>
                  <span className="px-2 select-none text-gray-500">…</span>
                </>
              )}

              {visiblePages.map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-3 py-1 border rounded ${
                    currentPage === p ? "bg-black text-white" : ""
                  }`}
                >
                  {p}
                </button>
              ))}

              {windowEnd < totalPages && (
                <>
                  <span className="px-2 select-none text-gray-500">…</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className={`px-3 py-1 border rounded ${
                      currentPage === totalPages ? "bg-black text-white" : ""
                    }`}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </>
          )}

          <button
            disabled={totalPages <= 0 || currentPage === totalPages}
            onClick={() =>
              setCurrentPage((p) => Math.min(totalPages || 1, p + 1))
            }
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {isDrawerOpen && previewURL && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="ml-auto w-2/5 h-full bg-white shadow-xl p-4 flex flex-col z-50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-lg">Estimate Preview</h2>
              <button onClick={() => setIsDrawerOpen(false)}>❌</button>
            </div>

            <iframe
              src={previewURL}
              className="flex-1 border"
              title="PDF Preview"
            />

            <div className="mt-4 flex justify-end gap-2">
              <Button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = previewURL;
                  link.download = `${
                    selectedEstimate?.estimateNo || "estimate"
                  }.pdf`;
                  link.click();
                }}
              >
                Download
              </Button>

              <Button
                onClick={() => {
                  if (selectedEstimate) onEdit(selectedEstimate);
                  setIsDrawerOpen(false);
                }}
              >
                Edit
              </Button>

              <Button
                onClick={() => {
                  if (selectedEstimate) {
                    const dup = {
                      ...selectedEstimate,
                      id: undefined,
                      estimateNo: "",
                    } as Estimate;
                    onDuplicate(dup);
                  }
                  setIsDrawerOpen(false);
                }}
              >
                Duplicate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
