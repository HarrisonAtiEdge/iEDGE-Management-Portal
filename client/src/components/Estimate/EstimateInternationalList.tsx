"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { Eye, Pencil, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildEstimatePdfBlob } from "@/lib/EstimateInternationalPdf";
import type { Estimate } from "@/types";

type EstimateDoc = Estimate & {
  id: string;
  status?: string;

  // created-by fields (old/new)
  createdByName?: string;
  createdByUid?: string;
  createdBy?: any;

  // audit fields
  editCount?: number;

  // totals fields (old/new)
  totalsPersisted?: { pkr?: { total?: number } };
  totals?: { pkr?: { total?: number } };
  amountPKR?: number;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

const STATUS_OPTIONS = [
  "RFQ Sent",
  "Approved",
  "Rejected",
  "Project Cancelled",
  "Invoiced",
  "Payment Received",
  "PO Received",
] as const;

const money = (n: any) =>
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const safe = (v: any) => String(v ?? "").trim();

function toDateText(d?: string, ts?: Timestamp) {
  if (safe(d)) return d;
  if (!ts) return "";
  const dd = ts.toDate();
  const yyyy = dd.getFullYear();
  const mm = String(dd.getMonth() + 1).padStart(2, "0");
  const day = String(dd.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${day}`;
}

/**
 * ✅ Robust extractor:
 * Supports:
 * - createdByName (top-level)
 * - createdBy.displayName / createdBy.name / createdBy.email
 * - createdBy as string
 */
function getCreatedByName(row: any): string {
  const top = safe(row?.createdByName);
  if (top) return top;

  const cb = row?.createdBy;

  // If createdBy is a string
  if (typeof cb === "string") return safe(cb) || "—";

  // If createdBy is an object
  const display =
    safe(cb?.displayName) ||
    safe(cb?.name) ||
    safe(cb?.fullName) ||
    safe(cb?.email);

  return display || "—";
}

/**
 * ✅ Robust totals extractor:
 * Supports:
 * - totalsPersisted.pkr.total (your new code saves this)
 * - totals.pkr.total (older)
 * - amountPKR (fallback)
 */
function getTotalAmountPKR(row: any): number {
  const a =
    Number(row?.totalsPersisted?.pkr?.total ?? NaN) ||
    Number(row?.totals?.pkr?.total ?? NaN) ||
    Number(row?.amountPKR ?? NaN) ||
    0;

  return Number.isFinite(a) ? a : 0;
}

export default function EstimateInternationalList({
  onEdit,
}: {
  onEdit: (estimate: EstimateDoc) => void;
}) {
  // Filters
  const [fEstimateNo, setFEstimateNo] = useState("");
  const [fClient, setFClient] = useState("");
  const [fSubject, setFSubject] = useState("");
  const [fDateMode, setFDateMode] = useState<
    "All" | "Today" | "This Month" | "Custom"
  >("All");
  const [fDateMin, setFDateMin] = useState("");
  const [fDateMax, setFDateMax] = useState("");
  const [fAmountMin, setFAmountMin] = useState("");
  const [fAmountMax, setFAmountMax] = useState("");

  // Pagination
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<EstimateDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Cursor stack (Timestamp from updatedAt)
  const cursorsRef = useRef<(Timestamp | null)[]>([null]);

  // PDF preview modal
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const closePreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
    setPreviewOpen(false);
  };

  // ✅ Correct collection for international estimates
  const colRef = collection(
    db,
    "Panels",
    "IEDGE-SYSTEM",
    "estimatesInternational",
  );

  const baseQuery = () => {
    // Primary sorting by updatedAt
    return query(colRef, orderBy("updatedAt", "desc"));
  };

  const reloadCount = async () => {
    try {
      const snap = await getCountFromServer(baseQuery());
      setTotalCount(snap.data().count || 0);
    } catch {
      setTotalCount(0);
    }
  };

  const loadPage = async (targetPage: number) => {
    setLoading(true);
    try {
      const cursor = cursorsRef.current[targetPage - 1] || null;

      let qFinal = query(baseQuery(), limit(PAGE_SIZE));
      if (cursor)
        qFinal = query(baseQuery(), startAfter(cursor), limit(PAGE_SIZE));

      const snap = await getDocs(qFinal);

      const list: EstimateDoc[] = snap.docs.map((d) => {
        const data = d.data() as any;

        // ✅ ensure fields exist for old docs
        const createdByName = getCreatedByName(data);

        const updatedAt =
          (data?.updatedAt as Timestamp) ||
          (data?.createdAt as Timestamp) ||
          undefined;

        return {
          id: d.id,
          ...data,
          createdByName,
          updatedAt,
        };
      });

      const last = list[list.length - 1];
      cursorsRef.current[targetPage] = (last?.updatedAt as Timestamp) || null;

      setRows(list);
      setPage(targetPage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cursorsRef.current = [null];
    setPage(1);
    loadPage(1);
    reloadCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(() => {
    const est = safe(fEstimateNo).toLowerCase();
    const cli = safe(fClient).toLowerCase();
    const sub = safe(fSubject).toLowerCase();

    const minAmt = safe(fAmountMin)
      ? Number(String(fAmountMin).replace(/,/g, ""))
      : null;
    const maxAmt = safe(fAmountMax)
      ? Number(String(fAmountMax).replace(/,/g, ""))
      : null;

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const today = `${yyyy}-${mm}-${dd}`;
    const monthPrefix = `${yyyy}-${mm}-`;

    const minDate = fDateMode === "Custom" ? safe(fDateMin) : "";
    const maxDate = fDateMode === "Custom" ? safe(fDateMax) : "";

    return rows.filter((r) => {
      const estimateNo = safe((r as any).estimateNo || r.id);
      const client = safe((r as any).client);
      const subject = safe((r as any).subject);
      const dateText = toDateText((r as any).date, (r as any).createdAt);

      const amount = getTotalAmountPKR(r);

      if (est && !estimateNo.toLowerCase().includes(est)) return false;
      if (cli && !client.toLowerCase().includes(cli)) return false;
      if (sub && !subject.toLowerCase().includes(sub)) return false;

      if (minAmt != null && amount < minAmt) return false;
      if (maxAmt != null && amount > maxAmt) return false;

      if (fDateMode === "Today" && dateText !== today) return false;
      function toDateText(d?: string, ts?: Timestamp): string {
        const ds = safe(d);
        if (ds) return ds; // ✅ return a definite string

        if (!ts) return "";
        const dd = ts.toDate();
        const yyyy = dd.getFullYear();
        const mm = String(dd.getMonth() + 1).padStart(2, "0");
        const day = String(dd.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${day}`;
      }
      if (fDateMode === "Custom") {
        if (minDate && dateText && dateText < minDate) return false;
        if (maxDate && dateText && dateText > maxDate) return false;
      }

      return true;
    });
  }, [
    rows,
    fEstimateNo,
    fClient,
    fSubject,
    fAmountMin,
    fAmountMax,
    fDateMode,
    fDateMin,
    fDateMax,
  ]);

  const totalPages = useMemo(() => {
    if (!totalCount) return 1;
    return Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  }, [totalCount]);

  const jumpPages = (p: number) => {
    if (p < 1 || p > totalPages) return;
    loadPage(p);
  };

  // ✅ FIX: use estimatesInternational path
  const updateStatus = async (id: string, nextStatus: string) => {
    await updateDoc(
      doc(db, "Panels", "IEDGE-SYSTEM", "estimatesInternational", id),
      {
        status: nextStatus,
        updatedAt: Timestamp.now(),
      },
    );
    setRows((prev) =>
      prev.map((x) =>
        x.id === id ? ({ ...x, status: nextStatus } as any) : x,
      ),
    );
  };

  // ✅ FIX: use estimatesInternational path
  const deleteEstimate = async (id: string) => {
    const ok = confirm("Delete this estimate?");
    if (!ok) return;
    await deleteDoc(
      doc(db, "Panels", "IEDGE-SYSTEM", "estimatesInternational", id),
    );
    setRows((prev) => prev.filter((x) => x.id !== id));
    reloadCount();
  };

  const viewPdf = async (row: EstimateDoc) => {
    try {
      const createdByName = getCreatedByName(row);

      const blob = await buildEstimatePdfBlob({
        estimate: row as any,
        withLogo: true,
        companyName: safe((row as any)?.company || "Estimate"),
        companyList: [
          { name: "iEDGE", logo: "/Iedge-TM-Logos-01.png" },
          { name: "iEDGE - Travel & Tours", logo: "/iedge-travel-logo.png" },
        ],
        footerUser: { displayName: createdByName, email: "" },
      });

      const pdfBlob =
        blob.type === "application/pdf"
          ? blob
          : new Blob([await blob.arrayBuffer()], { type: "application/pdf" });

      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);

      const url = URL.createObjectURL(pdfBlob);
      previewUrlRef.current = url;
      setPreviewUrl(url);
      setPreviewOpen(true);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ? `PDF Error: ${e.message}` : "Could not generate PDF");
    }
  };

  const pageNumbers = useMemo(() => {
    const p = page;
    const max = totalPages;
    const nums: (number | "...")[] = [];
    nums.push(1);
    if (p > 3) nums.push("...");
    const start = Math.max(2, p - 1);
    const end = Math.min(max - 1, p + 1);
    for (let i = start; i <= end; i++) nums.push(i);
    if (p < max - 2) nums.push("...");
    if (max > 1) nums.push(max);

    const out: (number | "...")[] = [];
    for (const x of nums) {
      if (x === "..." && out[out.length - 1] === "...") continue;
      if (typeof x === "number" && out.includes(x)) continue;
      out.push(x);
    }
    return out;
  }, [page, totalPages]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1400px] text-xs">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left font-semibold p-2">Estimate No</th>
              <th className="text-left font-semibold p-2">Client</th>
              <th className="text-left font-semibold p-2">Subject</th>
              <th className="text-left font-semibold p-2 w-[140px]">Date</th>
              <th className="text-right font-semibold p-2 w-[160px]">Amount</th>
              <th className="text-center font-semibold p-2 w-[90px]">
                Edit Count
              </th>
              <th className="text-left font-semibold p-2 w-[150px]">
                Created By
              </th>
              <th className="text-center font-semibold p-2 w-[140px]">
                Actions
              </th>
              <th className="text-center font-semibold p-2 w-[160px]">
                Status
              </th>
            </tr>

            <tr className="bg-white border-b">
              <th className="p-2">
                <input
                  value={fEstimateNo}
                  onChange={(e) => setFEstimateNo(e.target.value)}
                  placeholder="Search"
                  className="w-full border border-gray-200 rounded px-2 py-1"
                />
              </th>
              <th className="p-2">
                <input
                  value={fClient}
                  onChange={(e) => setFClient(e.target.value)}
                  placeholder="Search"
                  className="w-full border border-gray-200 rounded px-2 py-1"
                />
              </th>
              <th className="p-2">
                <input
                  value={fSubject}
                  onChange={(e) => setFSubject(e.target.value)}
                  placeholder="Search"
                  className="w-full border border-gray-200 rounded px-2 py-1"
                />
              </th>
              <th className="p-2">
                <select
                  value={fDateMode}
                  onChange={(e) => setFDateMode(e.target.value as any)}
                  className="w-full border border-gray-200 rounded px-2 py-1"
                >
                  <option value="All">All</option>
                  <option value="Today">Today</option>
                  <option value="This Month">This Month</option>
                  <option value="Custom">Custom</option>
                </select>

                {fDateMode === "Custom" ? (
                  <div className="mt-1 grid grid-cols-2 gap-1">
                    <input
                      type="date"
                      value={fDateMin}
                      onChange={(e) => setFDateMin(e.target.value)}
                      className="border border-gray-200 rounded px-2 py-1"
                    />
                    <input
                      type="date"
                      value={fDateMax}
                      onChange={(e) => setFDateMax(e.target.value)}
                      className="border border-gray-200 rounded px-2 py-1"
                    />
                  </div>
                ) : null}
              </th>
              <th className="p-2">
                <div className="grid grid-cols-2 gap-1">
                  <input
                    value={fAmountMin}
                    onChange={(e) => setFAmountMin(e.target.value)}
                    placeholder="Min"
                    className="border border-gray-200 rounded px-2 py-1"
                  />
                  <input
                    value={fAmountMax}
                    onChange={(e) => setFAmountMax(e.target.value)}
                    placeholder="Max"
                    className="border border-gray-200 rounded px-2 py-1"
                  />
                </div>
              </th>
              <th className="p-2" />
              <th className="p-2" />
              <th className="p-2" />
              <th className="p-2" />
            </tr>
          </thead>

          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td className="p-4 text-sm text-gray-500" colSpan={9}>
                  {loading ? "Loading..." : "No estimates found."}
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => {
                const amount = getTotalAmountPKR(r);
                const dateText = toDateText(
                  (r as any).date,
                  (r as any).createdAt,
                );
                const createdByName = getCreatedByName(r);

                return (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      {safe((r as any).estimateNo || r.id)}
                    </td>
                    <td className="p-2">{safe((r as any).client)}</td>
                    <td className="p-2">{safe((r as any).subject)}</td>
                    <td className="p-2">
                      {dateText ? new Date(dateText).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-2 text-right">Rs. {money(amount)}</td>
                    <td className="p-2 text-center">
                      {Number((r as any).editCount || 0)}
                    </td>
                    <td className="p-2">{createdByName}</td>

                    <td className="p-2">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          className="text-gray-700 hover:text-black"
                          title="View"
                          onClick={() => viewPdf(r)}
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          className="text-gray-700 hover:text-black"
                          title="Edit"
                          onClick={() => onEdit(r)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          className="text-gray-700 hover:text-black"
                          title="Duplicate"
                        >
                          <Copy size={16} />
                        </button>

                        <button
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
                          onClick={() => deleteEstimate(r.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>

                    <td className="p-2">
                      <div className="flex justify-center">
                        <select
                          value={safe((r as any).status) || "RFQ Sent"}
                          onChange={(e) => updateStatus(r.id, e.target.value)}
                          className="border rounded px-2 py-1 text-xs w-[140px]"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="p-3 flex items-center justify-between text-xs text-gray-600">
        <div>
          Showing {(page - 1) * PAGE_SIZE + 1}–
          {(page - 1) * PAGE_SIZE + rows.length} of {totalCount || "—"}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={page <= 1 || loading}
            onClick={() => jumpPages(page - 1)}
          >
            Prev
          </Button>

          <div className="flex items-center gap-1">
            {pageNumbers.map((x, idx) =>
              x === "..." ? (
                <span key={`dots-${idx}`} className="px-2">
                  …
                </span>
              ) : (
                <button
                  key={x}
                  onClick={() => jumpPages(x)}
                  className={`px-3 py-1 rounded border text-xs ${
                    x === page
                      ? "bg-black text-white border-black"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {x}
                </button>
              ),
            )}
          </div>

          <Button
            variant="outline"
            disabled={page >= totalPages || loading}
            onClick={() => jumpPages(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {previewOpen && previewUrl ? (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-[95vw] h-[90vh] flex flex-col overflow-hidden">
            <div className="p-3 border-b flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-800">
                PDF Preview
              </div>
              <button
                onClick={closePreview}
                className="p-2 rounded-md hover:bg-gray-100"
                aria-label="Close"
              >
                ✖
              </button>
            </div>

            <iframe
              src={previewUrl}
              className="flex-1 w-full"
              title="PDF Preview"
            />

            <div className="p-3 border-t flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  window.open(previewUrl, "_blank", "noopener,noreferrer")
                }
              >
                Open in New Tab
              </Button>

              <Button
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = previewUrl;
                  a.download = `estimate.pdf`;
                  a.click();
                }}
              >
                Download
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
