// import React, { useEffect, useMemo, useState } from "react";
// import { Estimate } from "../../types";
// import { Button } from "@/components/ui/button";
// import { auth, db } from "@/lib/firebase";
// import {
//   doc,
//   getDoc,
//   collection,
//   query,
//   where,
//   onSnapshot,
//   getDocs,
// } from "firebase/firestore";

// import { onAuthStateChanged } from "firebase/auth";
// import { deleteDoc, doc as docRef } from "firebase/firestore";
// import { buildEstimatePdfBlob } from "@/lib/estimatePdf";
// import { Eye, Pencil, Copy, Trash2 } from "lucide-react";
// import { updateDoc } from "firebase/firestore";
// import * as XLSX from "xlsx";

// type Props = {
//   onEdit: (estimate: Estimate) => void;
//   onDuplicate: (estimate: Estimate) => void;
// };

// export default function EstimateList({ onEdit, onDuplicate }: Props) {
//   const [estimates, setEstimates] = useState<Estimate[]>([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(
//     null,
//   );
//   const [previewURL, setPreviewURL] = useState<string | null>(null);
//   const [isDrawerOpen, setIsDrawerOpen] = useState(false);
//   const [usersMap, setUsersMap] = useState<Record<string, any>>({});
//   const [isAdmin, setIsAdmin] = useState(false);
//   const [isOperationAdmin, setIsOperationAdmin] = useState(false);
//   const [isFinancialAdmin, setIsFinancialAdmin] = useState(false);

//   const estimatesRef = collection(db, "Panels", "IEDGE-SYSTEM", "estimates");

//   const companyList = [
//     { name: "iEDGE", logo: "/Iedge-TM-Logos-01.png" },
//     {
//       name: "iEDGE - Digital & Creative",
//       logo: "/Iedge-Digital-and-Creative-TM-Logos-12.png",
//     },
//     { name: "iEDGE - Events & Activations", logo: "/iedge-events-logo.png" },
//     {
//       name: "iEDGE - Health Sciences",
//       logo: "/Iedge-Health-Sciences-TM-Logos-05.png",
//     },
//     { name: "iEDGE - International Education", logo: "/iedge-edu-logo.png" },
//     { name: "iEDGE - Trading", logo: "/Iedge-Trade-TM-Logos-10.png" },
//     { name: "iEDGE - Travel & Tours", logo: "/iedge-travel-logo.png" },
//     { name: "Catapult", logo: "/Catapult-TM-Logos-03.png" },
//     { name: "iConsultant", logo: "/Consultant-TM-Logos-02.png" },
//     { name: "Let's Save Green", logo: "/Lets-save-Green-TM-Logos-04.png" },
//     { name: "Emaan Biz", logo: "/Emaan-Biz-TM-Logos-06.png" },
//   ];

//   const PAGE_WINDOW = 3;

//   function getVisiblePages(currentPage: number, totalPages: number) {
//     if (totalPages <= 0) return [];
//     if (totalPages <= PAGE_WINDOW) {
//       return Array.from({ length: totalPages }, (_, i) => i + 1);
//     }

//     const maxStart = Math.max(1, totalPages - PAGE_WINDOW + 1);
//     const rawStart =
//       Math.floor((currentPage - 1) / PAGE_WINDOW) * PAGE_WINDOW + 1;

//     const start = Math.min(rawStart, maxStart);
//     const end = Math.min(start + PAGE_WINDOW - 1, totalPages);

//     return Array.from({ length: end - start + 1 }, (_, i) => start + i);
//   }

//   useEffect(() => {
//     let unsubSnapshot: (() => void) | null = null;

//     const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
//       if (!user) {
//         setEstimates([]);
//         return;
//       }

//       const uid = user.uid;

//       const userSnap = await getDoc(
//         doc(db, "Panels", "IEDGE-SYSTEM", "users", uid),
//       );

//       const userData = userSnap.data();

//       const adminCheck = userData?.isAdmin === true;
//       const operationAdminCheck = userData?.isOperationAdmin === true;
//       const financialAdminCheck = userData?.isFinancialAdmin === true;

//       setIsAdmin(adminCheck);
//       setIsOperationAdmin(operationAdminCheck);
//       setIsFinancialAdmin(financialAdminCheck);

//       const usersSnapshot = await getDocs(
//         collection(db, "Panels", "IEDGE-SYSTEM", "users"),
//       );

//       const map: Record<string, any> = {};
//       usersSnapshot.forEach((u) => {
//         map[u.id] = u.data();
//       });

//       setUsersMap(map);

//       const q =
//         adminCheck || operationAdminCheck || financialAdminCheck
//           ? query(estimatesRef)
//           : query(estimatesRef, where("createdBy", "==", uid));

//       unsubSnapshot = onSnapshot(q, (snap) => {
//         let list = snap.docs.map((d) => ({
//           id: d.id,
//           ...(d.data() as Estimate),
//         }));

//         // ✅ IMPORTANT FIX:
//         // operational_admin should NOT see estimates created by any admin user.
//         // Admin and financial admin still keep full access.
//         if (operationAdminCheck && !adminCheck && !financialAdminCheck) {
//           list = list.filter((estimate: any) => {
//             const createdBy = String(
//               estimate.createdBy ||
//                 estimate.createdById ||
//                 estimate.userId ||
//                 "",
//             );

//             // ✅ operational_admin can see his own estimates
//             const isOwnEstimate = createdBy === uid;
//             if (isOwnEstimate) return true;

//             const creator = map[createdBy];

//             // ✅ operational_admin cannot see other admins' estimates
//             const creatorIsAdmin =
//               creator?.isAdmin === true ||
//               creator?.isOperationAdmin === true ||
//               creator?.isFinancialAdmin === true ||
//               creator?.role === "admin" ||
//               creator?.role === "operational_admin" ||
//               creator?.role === "financial_admin";

//             if (creatorIsAdmin) return false;

//             // ✅ sales person's estimates are allowed
//             return true;
//           });
//         }

//         const getTime = (x: any) => {
//           const v = x?.createdAt ?? x?.updatedAt;

//           if (v?.toMillis) return v.toMillis();
//           if (v instanceof Date) return v.getTime();
//           if (typeof v === "number") return v;

//           if (typeof v === "string") {
//             const t = new Date(v).getTime();
//             if (!Number.isNaN(t)) return t;
//           }

//           const ds = x?.date;
//           if (typeof ds === "string") {
//             const t = new Date(ds).getTime();
//             if (!Number.isNaN(t)) return t;
//           }

//           const eno = x?.estimateNo;
//           if (typeof eno === "string") {
//             const m = eno.match(/(\d+)(?!.*\d)/);
//             if (m) return Number(m[1]);
//           }

//           return 0;
//         };

//         list.sort((a: any, b: any) => getTime(b) - getTime(a));

//         setEstimates(list);
//       });
//     });

//     return () => {
//       unsubscribeAuth();
//       if (unsubSnapshot) unsubSnapshot();
//     };
//   }, []);

//   const handleDelete = async (id: string) => {
//     const confirmDelete = window.confirm(
//       "Are you sure you want to delete this estimate?",
//     );
//     if (!confirmDelete) return;

//     try {
//       await deleteDoc(docRef(db, "Panels", "IEDGE-SYSTEM", "estimates", id));
//       alert("Estimate deleted successfully.");
//     } catch (error) {
//       console.error("Delete failed:", error);
//       alert("Failed to delete estimate.");
//     }
//   };

//   const handleViewDetail = async (estimate: Estimate) => {
//     setSelectedEstimate(estimate);

//     const blob = await buildEstimatePdfBlob({
//       estimate,
//       companyList,
//       usersMap,
//       companyName: estimate.company || "",
//     });

//     const url = URL.createObjectURL(blob);
//     setPreviewURL(url);
//     setIsDrawerOpen(true);
//   };

//   const formatDateWithMonthName = (dateStr?: string) => {
//     if (!dateStr) return "";

//     const [year, month, day] = dateStr.split("-");
//     const date = new Date(Number(year), Number(month) - 1, Number(day));

//     return date.toLocaleDateString("en-GB", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//     });
//   };

//   const StatusBadge = ({ status }: { status?: string }) => {
//     const s = status || "RFQ Sent";

//     const base =
//       "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold";

//     const cls =
//       s === "Approved"
//         ? "bg-green-100 text-green-800"
//         : s === "Rejected"
//           ? "bg-red-100 text-red-800"
//           : s === "Project Cancelled"
//             ? "bg-gray-200 text-gray-800"
//             : s === "Invoiced"
//               ? "bg-blue-100 text-blue-800"
//               : s === "Payment Received"
//                 ? "bg-emerald-100 text-emerald-800"
//                 : s === "PO Received"
//                   ? "bg-purple-100 text-purple-800"
//                   : "bg-yellow-100 text-yellow-800";

//     return <span className={`${base} ${cls}`}>{s}</span>;
//   };

//   const STATUS_OPTIONS = [
//     "RFQ Sent",
//     "Approved",
//     "Rejected",
//     "Project Cancelled",
//     "Invoiced",
//     "Payment Received",
//     "PO Received",
//   ];

//   const STATUS_STYLES: Record<string, string> = {
//     "RFQ Sent": "bg-yellow-100 text-yellow-800 border-yellow-300",
//     Approved: "bg-green-100 text-green-800 border-green-300",
//     Rejected: "bg-red-100 text-red-800 border-red-300",
//     "Project Cancelled": "bg-gray-200 text-gray-800 border-gray-300",
//     Invoiced: "bg-blue-100 text-blue-800 border-blue-300",
//     "Payment Received": "bg-emerald-100 text-emerald-800 border-emerald-300",
//     "PO Received": "bg-purple-100 text-purple-800 border-purple-300",
//   };

//   const handleStatusChange = async (estimateId: string, newStatus: string) => {
//     try {
//       await updateDoc(
//         doc(db, "Panels", "IEDGE-SYSTEM", "estimates", estimateId),
//         {
//           status: newStatus,
//           updatedAt: new Date(),
//         },
//       );
//     } catch (error) {
//       console.error("Status update failed:", error);
//       alert("Failed to update status");
//     }
//   };

//   const [estimateFilter, setEstimateFilter] = useState("");
//   const [clientFilter, setClientFilter] = useState("");
//   const [subjectFilter, setSubjectFilter] = useState("");
//   const [createdByFilter, setCreatedByFilter] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(10);

//   const [dateRange, setDateRange] = useState<
//     "all" | "today" | "7days" | "thisMonth" | "lastMonth"
//   >("all");

//   const [minAmount, setMinAmount] = useState("");
//   const [maxAmount, setMaxAmount] = useState("");

//   const isDateInRange = (dateStr?: string) => {
//     if (!dateStr || dateRange === "all") return true;

//     const d = new Date(dateStr);
//     const now = new Date();

//     if (dateRange === "today") return d.toDateString() === now.toDateString();

//     if (dateRange === "7days") {
//       const x = new Date();
//       x.setDate(now.getDate() - 7);
//       return d >= x;
//     }

//     if (dateRange === "thisMonth")
//       return (
//         d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
//       );

//     if (dateRange === "lastMonth") {
//       const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
//       return (
//         d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear()
//       );
//     }

//     return true;
//   };

//   const createdByOptions = useMemo(() => {
//     const names = estimates
//       .map((e) => usersMap[e.createdBy]?.displayName || "Unknown")
//       .filter(Boolean);

//     return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
//   }, [estimates, usersMap]);

//   const filteredEstimates = estimates.filter((e) => {
//     const estimateMatch = (e.estimateNo ?? "")
//       .toLowerCase()
//       .includes(estimateFilter.toLowerCase());

//     const clientMatch = (e.client ?? "")
//       .toLowerCase()
//       .includes(clientFilter.toLowerCase());

//     const subjectMatch = (e.subject ?? "")
//       .toLowerCase()
//       .includes(subjectFilter.toLowerCase());

//     const createdByName = usersMap[e.createdBy]?.displayName || "Unknown";
//     const createdByMatch = createdByFilter
//       ? createdByName === createdByFilter
//       : true;

//     const dateMatch = isDateInRange(e.date);

//     const amount = Number(e.total || 0);
//     const minOk = minAmount ? amount >= Number(minAmount) : true;
//     const maxOk = maxAmount ? amount <= Number(maxAmount) : true;

//     return (
//       estimateMatch &&
//       clientMatch &&
//       subjectMatch &&
//       createdByMatch &&
//       dateMatch &&
//       minOk &&
//       maxOk
//     );
//   });

//   const totalPages = Math.ceil(filteredEstimates.length / itemsPerPage);

//   useEffect(() => {
//     if (totalPages <= 0) {
//       if (currentPage !== 1) setCurrentPage(1);
//       return;
//     }
//     if (currentPage > totalPages) setCurrentPage(totalPages);
//   }, [totalPages, currentPage]);

//   const paginatedEstimates = filteredEstimates.slice(
//     (currentPage - 1) * itemsPerPage,
//     currentPage * itemsPerPage,
//   );

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [
//     estimateFilter,
//     clientFilter,
//     subjectFilter,
//     createdByFilter,
//     dateRange,
//     minAmount,
//     maxAmount,
//     itemsPerPage,
//   ]);

//   const handleExport = () => {
//     const exportData = filteredEstimates.map((e) => ({
//       "Estimate No": e.estimateNo || "",
//       Client: e.client || "",
//       Subject: e.subject || "",
//       Date: formatDateWithMonthName(e.date),
//       Amount: Number(e.total ?? 0),
//       "Edit Count": (e as any).editCount ?? 0,
//       "Created By": usersMap[e.createdBy]?.displayName || "Unknown",
//       Status: e.status || "RFQ Sent",
//     }));

//     const worksheet = XLSX.utils.json_to_sheet(exportData);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Estimates");
//     XLSX.writeFile(workbook, "estimates.xlsx");
//   };

//   const visiblePages = getVisiblePages(currentPage, totalPages);
//   const windowStart = visiblePages[0] ?? 1;
//   const windowEnd = visiblePages[visiblePages.length - 1] ?? 1;

//   const startRow =
//     filteredEstimates.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
//   const endRow = Math.min(currentPage * itemsPerPage, filteredEstimates.length);

//   return (
//     <div className="mt-8 px-4">
//       <div className="flex justify-end items-center gap-3 mb-3 text-sm">
//         <Button
//           variant="outline"
//           onClick={handleExport}
//           disabled={filteredEstimates.length === 0}
//         >
//           Export
//         </Button>

//         <div className="flex items-center gap-2">
//           <span>Rows:</span>
//           <select
//             className="border px-2 py-1 rounded"
//             value={itemsPerPage}
//             onChange={(e) => setItemsPerPage(Number(e.target.value))}
//           >
//             <option value={10}>10</option>
//             <option value={25}>25</option>
//             <option value={50}>50</option>
//             <option value={100}>100</option>
//           </select>
//         </div>

//         <button
//           disabled={currentPage === 1}
//           onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
//           className="px-3 py-1 border rounded disabled:opacity-40"
//         >
//           Prev
//         </button>

//         <span>
//           Page {totalPages === 0 ? 0 : currentPage} / {totalPages}
//         </span>

//         <button
//           disabled={totalPages <= 0 || currentPage === totalPages}
//           onClick={() =>
//             setCurrentPage((p) => Math.min(totalPages || 1, p + 1))
//           }
//           className="px-3 py-1 border rounded disabled:opacity-40"
//         >
//           Next
//         </button>
//       </div>

//       <table className="w-full border text-xs">
//         <thead className="bg-gray-100">
//           <tr className="border-b hover:bg-gray-50">
//             <th className="text-left">Estimate No</th>
//             <th className="text-left">Client</th>
//             <th className="text-left">Subject</th>
//             <th className="text-left">Date</th>
//             <th className="text-right pr-6">Amount</th>
//             <th className="text-right pr-6">Edit Count</th>
//             <th className="text-left">Created By</th>
//             <th className="text-left">Actions</th>
//             <th className="text-left">Status</th>
//           </tr>

//           <tr className="bg-gray-50 text-xs">
//             <th>
//               <input
//                 className="border px-1 py-0.5 w-full"
//                 placeholder="Search"
//                 value={estimateFilter}
//                 onChange={(e) => setEstimateFilter(e.target.value)}
//               />
//             </th>

//             <th>
//               <input
//                 className="border px-1 py-0.5 w-full"
//                 placeholder="Search"
//                 value={clientFilter}
//                 onChange={(e) => setClientFilter(e.target.value)}
//               />
//             </th>

//             <th>
//               <input
//                 className="border px-1 py-0.5 w-full"
//                 placeholder="Search"
//                 value={subjectFilter}
//                 onChange={(e) => setSubjectFilter(e.target.value)}
//               />
//             </th>

//             <th>
//               <select
//                 className="border px-1 py-0.5 w-full"
//                 value={dateRange}
//                 onChange={(e) => setDateRange(e.target.value as any)}
//               >
//                 <option value="all">All</option>
//                 <option value="today">Today</option>
//                 <option value="7days">7 Days</option>
//                 <option value="thisMonth">This Month</option>
//                 <option value="lastMonth">Last Month</option>
//               </select>
//             </th>

//             <th>
//               <div className="flex gap-1">
//                 <input
//                   type="number"
//                   placeholder="Min"
//                   className="border px-1 py-0.5 w-1/2"
//                   value={minAmount}
//                   onChange={(e) => setMinAmount(e.target.value)}
//                 />
//                 <input
//                   type="number"
//                   placeholder="Max"
//                   className="border px-1 py-0.5 w-1/2"
//                   value={maxAmount}
//                   onChange={(e) => setMaxAmount(e.target.value)}
//                 />
//               </div>
//             </th>

//             <th />

//             <th>
//               <select
//                 className="border px-1 py-0.5 w-full"
//                 value={createdByFilter}
//                 onChange={(e) => setCreatedByFilter(e.target.value)}
//               >
//                 <option value="">All</option>
//                 {createdByOptions.map((name) => (
//                   <option key={name} value={name}>
//                     {name}
//                   </option>
//                 ))}
//               </select>
//             </th>

//             <th />

//             <th />
//           </tr>
//         </thead>

//         <tbody>
//           {paginatedEstimates.map((e, i) => (
//             <tr key={i} className="text-left border-b hover:bg-gray-50">
//               <td>{e.estimateNo}</td>
//               <td>{e.client}</td>
//               <td>{e.subject}</td>
//               <td>{formatDateWithMonthName(e.date)}</td>

//               <td className="text-right pr-6">
//                 Rs.{" "}
//                 {Number(e.total ?? 0).toLocaleString(undefined, {
//                   minimumFractionDigits: 2,
//                 })}
//               </td>

//               <td className="text-right pr-6">{(e as any).editCount ?? 0}</td>
//               <td>{usersMap[e.createdBy]?.displayName || "Unknown"}</td>

//               <td>
//                 <div className="flex items-center justify-center gap-2">
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     title="View Detail"
//                     onClick={() => handleViewDetail(e)}
//                   >
//                     <Eye className="h-4 w-4" />
//                   </Button>

//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     title="Edit"
//                     onClick={() => onEdit(e)}
//                   >
//                     <Pencil className="h-4 w-4" />
//                   </Button>

//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     title="Duplicate"
//                     onClick={() => {
//                       const dup = { ...e, id: undefined, estimateNo: "" };
//                       onDuplicate(dup);
//                     }}
//                   >
//                     <Copy className="h-4 w-4" />
//                   </Button>

//                   {isAdmin && (
//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       title="Delete"
//                       className="text-red-600 hover:bg-red-100"
//                       onClick={() => handleDelete((e as any).id!)}
//                     >
//                       <Trash2 className="h-4 w-4" />
//                     </Button>
//                   )}
//                 </div>
//               </td>

//               <td>
//                 {isAdmin || isOperationAdmin ? (
//                   <select
//                     value={e.status || "RFQ Sent"}
//                     onChange={(ev) =>
//                       handleStatusChange((e as any).id!, ev.target.value)
//                     }
//                     className={`text-xs font-semibold px-2 py-1 rounded border ${
//                       STATUS_STYLES[e.status || "RFQ Sent"]
//                     }`}
//                   >
//                     {STATUS_OPTIONS.map((s) => (
//                       <option key={s} value={s}>
//                         {s}
//                       </option>
//                     ))}
//                   </select>
//                 ) : (
//                   <StatusBadge status={e.status} />
//                 )}
//               </td>
//             </tr>
//           ))}

//           {filteredEstimates.length === 0 && (
//             <tr>
//               <td colSpan={9} className="py-4 text-center">
//                 No estimates found.
//               </td>
//             </tr>
//           )}
//         </tbody>
//       </table>

//       <div className="flex justify-between items-center mt-4 text-sm">
//         <div>
//           Showing {startRow}–{endRow} of {filteredEstimates.length}
//         </div>

//         <div className="flex gap-1 items-center">
//           <button
//             disabled={currentPage === 1}
//             onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
//             className="px-3 py-1 border rounded disabled:opacity-40"
//           >
//             Prev
//           </button>

//           {totalPages > 0 && (
//             <>
//               {windowStart > 1 && (
//                 <>
//                   <button
//                     onClick={() => setCurrentPage(1)}
//                     className={`px-3 py-1 border rounded ${
//                       currentPage === 1 ? "bg-black text-white" : ""
//                     }`}
//                   >
//                     1
//                   </button>
//                   <span className="px-2 select-none text-gray-500">…</span>
//                 </>
//               )}

//               {visiblePages.map((p) => (
//                 <button
//                   key={p}
//                   onClick={() => setCurrentPage(p)}
//                   className={`px-3 py-1 border rounded ${
//                     currentPage === p ? "bg-black text-white" : ""
//                   }`}
//                 >
//                   {p}
//                 </button>
//               ))}

//               {windowEnd < totalPages && (
//                 <>
//                   <span className="px-2 select-none text-gray-500">…</span>
//                   <button
//                     onClick={() => setCurrentPage(totalPages)}
//                     className={`px-3 py-1 border rounded ${
//                       currentPage === totalPages ? "bg-black text-white" : ""
//                     }`}
//                   >
//                     {totalPages}
//                   </button>
//                 </>
//               )}
//             </>
//           )}

//           <button
//             disabled={totalPages <= 0 || currentPage === totalPages}
//             onClick={() =>
//               setCurrentPage((p) => Math.min(totalPages || 1, p + 1))
//             }
//             className="px-3 py-1 border rounded disabled:opacity-40"
//           >
//             Next
//           </button>
//         </div>
//       </div>

//       {isDrawerOpen && previewURL && (
//         <div className="fixed inset-0 z-50 flex">
//           <div
//             className="fixed inset-0 bg-black bg-opacity-50 z-40"
//             onClick={() => setIsDrawerOpen(false)}
//           />
//           <div className="ml-auto w-2/5 h-full bg-white shadow-xl p-4 flex flex-col z-50">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="font-semibold text-lg">Estimate Preview</h2>
//               <button onClick={() => setIsDrawerOpen(false)}>❌</button>
//             </div>

//             <iframe
//               src={previewURL}
//               className="flex-1 border"
//               title="PDF Preview"
//             />

//             <div className="mt-4 flex justify-end gap-2">
//               <Button
//                 onClick={() => {
//                   const link = document.createElement("a");
//                   link.href = previewURL;
//                   link.download = `${
//                     selectedEstimate?.estimateNo || "estimate"
//                   }.pdf`;
//                   link.click();
//                 }}
//               >
//                 Download
//               </Button>

//               <Button
//                 onClick={() => {
//                   if (selectedEstimate) onEdit(selectedEstimate);
//                   setIsDrawerOpen(false);
//                 }}
//               >
//                 Edit
//               </Button>

//               <Button
//                 onClick={() => {
//                   if (selectedEstimate) {
//                     const dup = {
//                       ...selectedEstimate,
//                       id: undefined,
//                       estimateNo: "",
//                     } as Estimate;
//                     onDuplicate(dup);
//                   }
//                   setIsDrawerOpen(false);
//                 }}
//               >
//                 Duplicate
//               </Button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }





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
  deleteDoc,
  doc as docRef,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { buildEstimatePdfBlob } from "@/lib/estimatePdf";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  Filter,
  FileSpreadsheet,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";

type Props = {
  onEdit: (estimate: Estimate) => void;
  onDuplicate: (estimate: Estimate) => void;
};

export default function EstimateList({ onEdit, onDuplicate }: Props) {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(
    null,
  );
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOperationAdmin, setIsOperationAdmin] = useState(false);

  const [estimateFilter, setEstimateFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [createdByFilter, setCreatedByFilter] = useState("");
  const [dateRange, setDateRange] = useState<
    "all" | "today" | "7days" | "thisMonth" | "lastMonth"
  >("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  const inputClass =
    "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100";

  const selectClass =
    "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100";

  const iconButtonClass =
    "h-8 w-8 rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900";

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

      const usersSnapshot = await getDocs(
        collection(db, "Panels", "IEDGE-SYSTEM", "users"),
      );

      const map: Record<string, any> = {};

      usersSnapshot.forEach((u) => {
        map[u.id] = u.data();
      });

      setUsersMap(map);

      const q =
        adminCheck || operationAdminCheck || financialAdminCheck
          ? query(estimatesRef)
          : query(estimatesRef, where("createdBy", "==", uid));

      unsubSnapshot = onSnapshot(q, (snap) => {
        let list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Estimate),
        }));

        if (operationAdminCheck && !adminCheck && !financialAdminCheck) {
          list = list.filter((estimate: any) => {
            const createdBy = String(
              estimate.createdBy ||
                estimate.createdById ||
                estimate.userId ||
                "",
            );

            const isOwnEstimate = createdBy === uid;
            if (isOwnEstimate) return true;

            const creator = map[createdBy];

            const creatorIsAdmin =
              creator?.isAdmin === true ||
              creator?.isOperationAdmin === true ||
              creator?.isFinancialAdmin === true ||
              creator?.role === "admin" ||
              creator?.role === "operational_admin" ||
              creator?.role === "financial_admin";

            if (creatorIsAdmin) return false;

            return true;
          });
        }

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
    if (!dateStr) return "—";

    const [year, month, day] = dateStr.split("-");
    const date = new Date(Number(year), Number(month) - 1, Number(day));

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (value?: number | string) => {
    return Number(value ?? 0).toLocaleString("en-PK", {
      maximumFractionDigits: 2,
    });
  };

  const StatusBadge = ({ status }: { status?: string }) => {
    const s = status || "RFQ Sent";

    const cls =
      s === "Approved"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : s === "Rejected"
          ? "border-red-200 bg-red-50 text-red-700"
          : s === "Project Cancelled"
            ? "border-slate-200 bg-slate-100 text-slate-600"
            : s === "Invoiced"
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : s === "Payment Received"
                ? "border-teal-200 bg-teal-50 text-teal-700"
                : s === "PO Received"
                  ? "border-violet-200 bg-violet-50 text-violet-700"
                  : "border-amber-200 bg-amber-50 text-amber-700";

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {s}
      </span>
    );
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
    "RFQ Sent": "border-amber-200 bg-amber-50 text-amber-700",
    Approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Rejected: "border-red-200 bg-red-50 text-red-700",
    "Project Cancelled": "border-slate-200 bg-slate-100 text-slate-600",
    Invoiced: "border-blue-200 bg-blue-50 text-blue-700",
    "Payment Received": "border-teal-200 bg-teal-50 text-teal-700",
    "PO Received": "border-violet-200 bg-violet-50 text-violet-700",
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

    if (dateRange === "thisMonth") {
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    }

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

  const filteredEstimates = useMemo(() => {
    return estimates.filter((e) => {
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
  }, [
    estimates,
    estimateFilter,
    clientFilter,
    subjectFilter,
    createdByFilter,
    dateRange,
    minAmount,
    maxAmount,
    usersMap,
  ]);

  const totalPages = Math.ceil(filteredEstimates.length / itemsPerPage);

  const visiblePages = getVisiblePages(currentPage, totalPages);
  const windowStart = visiblePages[0] ?? 1;
  const windowEnd = visiblePages[visiblePages.length - 1] ?? 1;

  const startRow =
    filteredEstimates.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;

  const endRow = Math.min(currentPage * itemsPerPage, filteredEstimates.length);

  const totalAmount = useMemo(() => {
    return filteredEstimates.reduce((sum, item) => {
      return sum + Number(item.total || 0);
    }, 0);
  }, [filteredEstimates]);

  const paginatedEstimates = filteredEstimates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    if (totalPages <= 0) {
      if (currentPage !== 1) setCurrentPage(1);
      return;
    }

    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

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

  const clearFilters = () => {
    setEstimateFilter("");
    setClientFilter("");
    setSubjectFilter("");
    setCreatedByFilter("");
    setDateRange("all");
    setMinAmount("");
    setMaxAmount("");
  };

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

  return (
    <div className="min-h-screen bg-slate-50/70 px-4 py-6">
      <div className="mx-auto  space-y-5">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 border-b border-slate-100 bg-gradient-to-br from-white via-slate-50 to-slate-100 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>


              <h1 className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950">
                Estimates
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                View, filter, export, duplicate and manage estimate records.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Total
                </p>
                <p className="mt-1 text-xl font-black text-slate-950">
                  {filteredEstimates.length}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Amount
                </p>
                <p className="mt-1 text-xl font-black text-slate-950">
                  Rs. {formatAmount(totalAmount)}
                </p>
              </div>

              <div className="col-span-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:col-span-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Page
                </p>
                <p className="mt-1 text-xl font-black text-slate-950">
                  {totalPages === 0 ? 0 : currentPage}/{totalPages}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Filter className="h-4 w-4" />
              </span>
              Advanced Filters
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="h-10 rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                Clear Filters
              </Button>

              <Button
                variant="outline"
                onClick={handleExport}
                disabled={filteredEstimates.length === 0}
                className="h-10 rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                <span className="text-sm font-medium text-slate-500">
                  Rows
                </span>

                <select
                  className="bg-transparent text-sm font-semibold text-slate-800 outline-none"
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid gap-3 border-t border-slate-100 px-5 py-4 md:grid-cols-2 xl:grid-cols-6">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className={`${inputClass} pl-9`}
                placeholder="Estimate no"
                value={estimateFilter}
                onChange={(e) => setEstimateFilter(e.target.value)}
              />
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className={`${inputClass} pl-9`}
                placeholder="Client"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
              />
            </div>

            <div className="relative xl:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className={`${inputClass} pl-9`}
                placeholder="Subject"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
              />
            </div>

            <select
              className={selectClass}
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
            </select>

            <select
              className={selectClass}
              value={createdByFilter}
              onChange={(e) => setCreatedByFilter(e.target.value)}
            >
              <option value="">All Creators</option>
              {createdByOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Min amount"
              className={inputClass}
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
            />

            <input
              type="number"
              placeholder="Max amount"
              className={inputClass}
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-4 text-left font-bold">
                    Estimate No
                  </th>
                  <th className="px-5 py-4 text-left font-bold">Client</th>
                  <th className="px-5 py-4 text-left font-bold">Subject</th>
                  <th className="px-5 py-4 text-left font-bold">Date</th>
                  <th className="px-5 py-4 text-right font-bold">Amount</th>
                  <th className="px-5 py-4 text-right font-bold">
                    Edit Count
                  </th>
                  <th className="px-5 py-4 text-left font-bold">
                    Created By
                  </th>
                  <th className="px-5 py-4 text-center font-bold">Actions</th>
                  <th className="px-5 py-4 text-left font-bold">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedEstimates.map((e, i) => (
                  <tr
                    key={(e as any).id || e.estimateNo || i}
                    className="group transition hover:bg-slate-50/80"
                  >
                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-900">
                        {e.estimateNo || "—"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">
                        {e.client || "—"}
                      </div>
                    </td>

                    <td className="max-w-[320px] px-5 py-4">
                      <p className="truncate text-slate-600">
                        {e.subject || "—"}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {formatDateWithMonthName(e.date)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span className="font-bold text-slate-900">
                        Rs. {formatAmount(e.total)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                        {(e as any).editCount ?? 0}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                          {(usersMap[e.createdBy]?.displayName || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <span className="font-medium text-slate-700">
                          {usersMap[e.createdBy]?.displayName || "Unknown"}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="View Detail"
                          onClick={() => handleViewDetail(e)}
                          className={iconButtonClass}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          title="Edit"
                          onClick={() => onEdit(e)}
                          className={iconButtonClass}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          title="Duplicate"
                          onClick={() => {
                            const dup = {
                              ...e,
                              id: undefined,
                              estimateNo: "",
                            };

                            onDuplicate(dup as Estimate);
                          }}
                          className={iconButtonClass}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>

                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete"
                            className="h-8 w-8 rounded-lg text-red-500 transition hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDelete((e as any).id!)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {isAdmin || isOperationAdmin ? (
                        <select
                          value={e.status || "RFQ Sent"}
                          onChange={(ev) =>
                            handleStatusChange(
                              (e as any).id!,
                              ev.target.value,
                            )
                          }
                          className={`rounded-full border px-3 py-1.5 text-xs font-bold outline-none transition focus:ring-4 focus:ring-slate-100 ${
                            STATUS_STYLES[e.status || "RFQ Sent"] ||
                            STATUS_STYLES["RFQ Sent"]
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
                    <td colSpan={9} className="px-5 py-16 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                          <Search className="h-6 w-6" />
                        </div>

                        <h3 className="mt-4 text-base font-black text-slate-900">
                          No estimates found
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Try clearing filters or searching with different
                          keywords.
                        </p>

                        <Button
                          variant="outline"
                          onClick={clearFilters}
                          className="mt-4 rounded-xl border-slate-200"
                        >
                          Clear Filters
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="text-sm font-medium text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-900">{startRow}</span> to{" "}
              <span className="font-bold text-slate-900">{endRow}</span> of{" "}
              <span className="font-bold text-slate-900">
                {" "}
                {filteredEstimates.length}
              </span>{" "}
              estimates
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>

              {totalPages > 0 && (
                <>
                  {windowStart > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentPage(1)}
                        className={`h-9 min-w-9 rounded-xl border px-3 text-sm font-bold transition ${
                          currentPage === 1
                            ? "border-slate-950 bg-slate-950 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        1
                      </button>

                      <span className="px-2 text-slate-400">...</span>
                    </>
                  )}

                  {visiblePages.map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`h-9 min-w-9 rounded-xl border px-3 text-sm font-bold transition ${
                        currentPage === p
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  {windowEnd < totalPages && (
                    <>
                      <span className="px-2 text-slate-400">...</span>

                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className={`h-9 min-w-9 rounded-xl border px-3 text-sm font-bold transition ${
                          currentPage === totalPages
                            ? "border-slate-950 bg-slate-950 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
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
                className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isDrawerOpen && previewURL && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="relative ml-auto flex h-full w-full max-w-5xl flex-col bg-white shadow-2xl lg:w-[58vw]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-black tracking-[-0.03em] text-slate-950">
                  Estimate Preview
                </h2>

                <p className="text-sm text-slate-500">
                  {selectedEstimate?.estimateNo || "Estimate document"}
                </p>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-950"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 bg-slate-100 p-4">
              <iframe
                src={previewURL}
                className="h-full w-full rounded-2xl border border-slate-200 bg-white shadow-sm"
                title="PDF Preview"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-white px-5 py-4">
              <Button
                variant="outline"
                className="rounded-xl border-slate-200"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = previewURL;
                  link.download = `${
                    selectedEstimate?.estimateNo || "estimate"
                  }.pdf`;
                  link.click();
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>

              <Button
                variant="outline"
                className="rounded-xl border-slate-200"
                onClick={() => {
                  if (selectedEstimate) onEdit(selectedEstimate);
                  setIsDrawerOpen(false);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>

              <Button
                className="rounded-xl bg-slate-950 text-white hover:bg-slate-800"
                onClick={() => {
                  if (selectedEstimate) {
                    const dup = {
                      ...selectedEstimate,
                      id: undefined,
                      estimateNo: "",
                    };

                    onDuplicate(dup as Estimate);
                  }

                  setIsDrawerOpen(false);
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}