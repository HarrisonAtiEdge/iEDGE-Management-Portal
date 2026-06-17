// "use client";

// import React, { useEffect, useMemo, useState } from "react";
// import { auth, db } from "@/lib/firebase";
// import {
//   collection,
//   doc,
//   getDoc,
//   getDocs,
//   onSnapshot,
//   query,
//   where,
// } from "firebase/firestore";

// import { onAuthStateChanged } from "firebase/auth";
// import { Button } from "@/components/ui/button";
// import { Eye, Pencil, Copy, Wallet } from "lucide-react";
// import { buildEstimateInvoicePdfBlob } from "@/lib/estimateInvoicePdf";
// import ReceivePaymentModal from "@/components/EstimateInvoice/ReceivePaymentModal";

// export type EstimateInvoice = any;

// type Props = {
//   onEdit: (invoice: EstimateInvoice) => void;
//   onDuplicate: (invoice: EstimateInvoice) => void;
// };

// const PANEL_ID = "IEDGE-SYSTEM";

// export default function EstimateInvoiceList({ onEdit, onDuplicate }: Props) {
//   const [invoices, setInvoices] = useState<EstimateInvoice[]>([]);
//   const [isAdmin, setIsAdmin] = useState(false);

//   // ✅ logged in user footer data
//   const [loggedInUser, setLoggedInUser] = useState<any>(null);

//   // ✅ PDF preview state
//   const [previewURL, setPreviewURL] = useState<string | null>(null);
//   const [isPreviewOpen, setIsPreviewOpen] = useState(false);
//   const [previewInvoiceNo, setPreviewInvoiceNo] = useState<string>("invoice");

//   // 🔍 Filters
//   const [invoiceNoFilter, setInvoiceNoFilter] = useState("");
//   const [estimateNoFilter, setEstimateNoFilter] = useState("");
//   const [subjectFilter, setSubjectFilter] = useState("");
//   const [clientFilter, setClientFilter] = useState("");
//   const [dateFilter, setDateFilter] = useState("");
//   const [statusFilter, setStatusFilter] = useState("");
//   const [minAmount, setMinAmount] = useState("");
//   const [maxAmount, setMaxAmount] = useState("");
//   const [isOperationAdmin, setIsOperationAdmin] = useState(false);
//   const [createdByFilter, setCreatedByFilter] = useState("");
//   const [usersMap, setUsersMap] = useState<Record<string, any>>({});
//   const [isReceiveOpen, setIsReceiveOpen] = useState(false);
//   const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
//   const [showPaymentModal, setShowPaymentModal] = useState(false);
//   const [companyFilter, setCompanyFilter] = useState("");

//   // 📅 Date preset filter
//   const [datePreset, setDatePreset] = useState<
//     "" | "today" | "thisMonth" | "lastMonth"
//   >("");

//   // 📄 Pagination
//   const [pageSize, setPageSize] = useState<10 | 20 | 50>(10);
//   const [page, setPage] = useState(1);

//   const invoicesRef = useMemo(
//     () => collection(db, "Panels", PANEL_ID, "estimateInvoices"),
//     [],
//   );

//   // ✅ same company list used in estimate form
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

//   const getSubjectValue = (inv: any) =>
//     String(inv?.subject || inv?.invoiceSubject || inv?.title || "");

//   // ✅ cleanup blob url on unmount
//   useEffect(() => {
//     return () => {
//       if (previewURL) URL.revokeObjectURL(previewURL);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   useEffect(() => {
//     let unsubSnapshot: (() => void) | null = null;

//     const unsubAuth = onAuthStateChanged(auth, async (user) => {
//       if (!user) {
//         setInvoices([]);
//         setIsAdmin(false);
//         setLoggedInUser(null);
//         return;
//       }

//       const uid = user.uid;

//       try {
//         // ✅ load footer user + admin check
//         const userSnap = await getDoc(
//           doc(db, "Panels", PANEL_ID, "users", uid),
//         );
//         const userData = userSnap.data() as any;

//         setLoggedInUser(userData || null);

//         // ✅ load all users (UID → data)
//         const usersSnap = await getDocs(
//           collection(db, "Panels", PANEL_ID, "users"),
//         );

//         const map: Record<string, any> = {};
//         usersSnap.forEach((u) => {
//           map[u.id] = u.data();
//         });
//         setUsersMap(map);

//         const adminCheck =
//           userData?.isAdmin === true || userData?.isAdmin === "true";

//         const operationAdminCheck =
//           userData?.isOperationAdmin === true ||
//           userData?.isOperationAdmin === "true";

//         const financialAdminCheck =
//           userData?.isFinancialAdmin === true ||
//           userData?.isFinancialAdmin === "true";

//         const q =
//           adminCheck || operationAdminCheck || financialAdminCheck
//             ? query(invoicesRef)
//             : query(invoicesRef, where("createdBy", "==", uid));

//         unsubSnapshot = onSnapshot(q, (snap) => {
//           const list = snap.docs.map((d) => ({
//             id: d.id,
//             ...(d.data() as any),
//           }));
//           setInvoices(list);
//         });
//       } catch (e) {
//         console.error(e);
//         setLoggedInUser(null);
//         setIsAdmin(false);
//       }
//     });

//     return () => {
//       unsubAuth();
//       if (unsubSnapshot) unsubSnapshot();
//     };
//   }, [invoicesRef]);

//   // 📅 date preset matcher
//   const isDateInPresetRange = (invoiceDate: string) => {
//     if (!datePreset) return true;

//     const inv = new Date(`${invoiceDate}T00:00:00`);
//     if (Number.isNaN(inv.getTime())) return false;

//     const now = new Date();
//     const y = now.getFullYear();
//     const m = now.getMonth();
//     const d = now.getDate();

//     const startOfToday = new Date(y, m, d, 0, 0, 0);
//     const endOfToday = new Date(y, m, d, 23, 59, 59);

//     const startOfThisMonth = new Date(y, m, 1, 0, 0, 0);
//     const endOfThisMonth = new Date(y, m + 1, 0, 23, 59, 59);

//     const startOfLastMonth = new Date(y, m - 1, 1, 0, 0, 0);
//     const endOfLastMonth = new Date(y, m, 0, 23, 59, 59);

//     if (datePreset === "today") return inv >= startOfToday && inv <= endOfToday;
//     if (datePreset === "thisMonth")
//       return inv >= startOfThisMonth && inv <= endOfThisMonth;
//     if (datePreset === "lastMonth")
//       return inv >= startOfLastMonth && inv <= endOfLastMonth;

//     return true;
//   };

//   // 🔍 Apply all filters (client-side)
//   const filteredInvoices = invoices.filter((inv) => {
//     const invoiceNoMatch = String(inv.invoiceNo || "")
//       .toLowerCase()
//       .includes(invoiceNoFilter.toLowerCase());

//     const estimateNoMatch = String(inv.sourceEstimateNo || inv.estimateNo || "")
//       .toLowerCase()
//       .includes(estimateNoFilter.toLowerCase());

//     const subjectMatch = getSubjectValue(inv)
//       .toLowerCase()
//       .includes(subjectFilter.toLowerCase());

//     const clientMatch = String(inv.client || "")
//       .toLowerCase()
//       .includes(clientFilter.toLowerCase());

//     const invDate = String(inv.invoiceDate || "");

//     const exactDateMatch = dateFilter ? invDate === dateFilter : true;
//     const presetMatch = datePreset ? isDateInPresetRange(invDate) : true;
//     const dateMatch = exactDateMatch && presetMatch;

//     const statusMatch = statusFilter
//       ? String(inv.status || "").toLowerCase() === statusFilter.toLowerCase()
//       : true;

//     const amount = Number(inv.total || 0);
//     const minOk = minAmount ? amount >= Number(minAmount) : true;
//     const maxOk = maxAmount ? amount <= Number(maxAmount) : true;

//     const createdByText = String(usersMap[inv.createdBy]?.displayName || "")
//       .toLowerCase()
//       .trim();

//     const company = String(inv.company || "").toLowerCase();

//     let companyMatch = true;

//     if (companyFilter === "iedge") {
//       companyMatch =
//         company === "iedge" ||
//         company === "iedge - digital & creative" ||
//         company === "iedge - events & activations";
//     }

//     if (companyFilter === "travel") {
//       companyMatch = company === "iedge - travel & tours";
//     }

//     const createdByMatch = createdByFilter
//       ? createdByText.includes(createdByFilter.toLowerCase())
//       : true;

//     // return (
//     //   invoiceNoMatch &&
//     //   estimateNoMatch &&
//     //   subjectMatch &&
//     //   clientMatch &&
//     //   dateMatch &&
//     //   statusMatch &&
//     //   minOk &&
//     //   maxOk &&
//     //   createdByMatch
//     // );

//     return (
//       invoiceNoMatch &&
//       estimateNoMatch &&
//       subjectMatch &&
//       clientMatch &&
//       dateMatch &&
//       statusMatch &&
//       minOk &&
//       maxOk &&
//       createdByMatch &&
//       companyMatch
//     );
//   });

//   // reset to page 1 when filters or page size changes
//   useEffect(() => {
//     setPage(1);
//   }, [
//     invoiceNoFilter,
//     estimateNoFilter,
//     subjectFilter,
//     clientFilter,
//     createdByFilter,
//     dateFilter,
//     datePreset,
//     statusFilter,
//     minAmount,
//     maxAmount,
//     pageSize,
//   ]);

//   // pagination
//   const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
//   const safePage = Math.min(page, totalPages);

//   const paginatedInvoices = filteredInvoices.slice(
//     (safePage - 1) * pageSize,
//     safePage * pageSize,
//   );

//   const handleViewPdf = async (inv: any) => {
//     try {
//       if (previewURL) URL.revokeObjectURL(previewURL);

//       const blob = await buildEstimateInvoicePdfBlob({
//         invoice: inv,
//         companyList,
//         withLogo: Boolean(inv?.withLogo ?? true),
//         footerUser: loggedInUser,
//         companyName: String(inv?.company || "").trim(),
//       } as any);

//       const url = URL.createObjectURL(blob);
//       setPreviewURL(url);
//       setPreviewInvoiceNo(inv?.invoiceNo || "invoice");
//       setIsPreviewOpen(true);
//     } catch (e) {
//       console.error(e);
//       alert("Failed to generate PDF.");
//     }
//   };

//   const formatCsvCell = (value: any) => {
//     if (value === null || value === undefined) return '""';

//     const str = String(value);

//     // Preserve very long numeric values better when opened in Excel
//     const onlyDigits = /^\d+$/.test(str);
//     if (onlyDigits && str.length >= 11) {
//       const safe = str.replace(/"/g, '""');
//       return `"=""${safe}"""`;
//     }

//     return `"${str.replace(/"/g, '""')}"`;
//   };

//   const handleExport = () => {
//     try {
//       const headers = [
//         "Invoice No",
//         "Estimate No",
//         "Subject",
//         "Client",
//         "Created By",
//         "Invoice Date",
//         "Amount",
//         "Status",
//       ];

//       const rows = filteredInvoices.map((inv) => [
//         inv.invoiceNo || "",
//         inv.sourceEstimateNo || inv.estimateNo || "",
//         getSubjectValue(inv) || "",
//         inv.client || "",
//         usersMap[inv.createdBy]?.displayName || "Unknown",
//         inv.invoiceDate || "",
//         Number(inv.total ?? 0).toFixed(2),
//         inv.status || "Unpaid",
//       ]);

//       const csvContent = [
//         headers.map(formatCsvCell).join(","),
//         ...rows.map((row) => row.map(formatCsvCell).join(",")),
//       ].join("\n");

//       const blob = new Blob(["\uFEFF" + csvContent], {
//         type: "text/csv;charset=utf-8;",
//       });

//       const url = URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

//       link.href = url;
//       link.download = `estimate-invoices-${stamp}.csv`;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       URL.revokeObjectURL(url);
//     } catch (error) {
//       console.error("Export failed:", error);
//       alert("Failed to export invoices.");
//     }
//   };

//   return (
//     <div className="mt-6 px-2">
//       {/* Top controls: date presets + pagination */}
//       <div className="mb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
//         <div className="flex flex-wrap items-center gap-2">
//           <div className="text-xs text-gray-600 font-medium">Date Range:</div>

//           <button
//             type="button"
//             className={`text-xs px-2 py-1 rounded border ${
//               datePreset === "" ? "bg-black text-white" : "bg-white"
//             }`}
//             onClick={() => setDatePreset("")}
//           >
//             All
//           </button>

//           <button
//             type="button"
//             className={`text-xs px-2 py-1 rounded border ${
//               datePreset === "today" ? "bg-black text-white" : "bg-white"
//             }`}
//             onClick={() => setDatePreset("today")}
//           >
//             Today
//           </button>

//           <button
//             type="button"
//             className={`text-xs px-2 py-1 rounded border ${
//               datePreset === "thisMonth" ? "bg-black text-white" : "bg-white"
//             }`}
//             onClick={() => setDatePreset("thisMonth")}
//           >
//             This Month
//           </button>

//           <button
//             type="button"
//             className={`text-xs px-2 py-1 rounded border ${
//               datePreset === "lastMonth" ? "bg-black text-white" : "bg-white"
//             }`}
//             onClick={() => setDatePreset("lastMonth")}
//           >
//             Last Month
//           </button>

//           <div className="text-xs text-gray-500 ml-2">
//             Showing {filteredInvoices.length} result(s)
//           </div>
//         </div>

//         <div className="flex items-center gap-2 justify-end">
//           <Button
//             type="button"
//             variant="outline"
//             className="h-8 text-xs"
//             onClick={handleExport}
//             disabled={filteredInvoices.length === 0}
//           >
//             Export
//           </Button>

//           <div className="text-xs text-gray-600">Rows:</div>
//           <select
//             className="border rounded px-2 py-1 text-xs"
//             value={pageSize}
//             onChange={(e) => setPageSize(Number(e.target.value) as any)}
//           >
//             <option value={10}>10</option>
//             <option value={20}>20</option>
//             <option value={50}>50</option>
//           </select>

//           <button
//             type="button"
//             className="border rounded px-2 py-1 text-xs disabled:opacity-50"
//             disabled={safePage <= 1}
//             onClick={() => setPage((p) => Math.max(1, p - 1))}
//           >
//             Prev
//           </button>

//           <div className="text-xs text-gray-700">
//             Page {safePage} / {totalPages}
//           </div>

//           <button
//             type="button"
//             className="border rounded px-2 py-1 text-xs disabled:opacity-50"
//             disabled={safePage >= totalPages}
//             onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//           >
//             Next
//           </button>
//         </div>
//       </div>

//       <table className="w-full border text-xs">
//         <thead className="bg-gray-100">
//           <tr className="border-b">
//             <th className="text-left p-2">Invoice No</th>
//             <th className="text-left p-2">Estimate No</th>
//             <th className="text-left p-2">Subject</th>
//             <th className="text-left p-2">Client</th>
//             <th className="text-left p-2">Company</th>
//             <th className="text-left p-2">Created By</th>
//             <th className="text-left p-2">Invoice Date</th>
//             <th className="text-right p-2">Amount</th>
//             <th className="text-left p-2">Status</th>
//             <th className="text-left p-2">Actions</th>
//           </tr>

//           {/* 🔍 FILTER ROW */}
//           <tr className="bg-gray-50">
//             <th className="p-1">
//               <input
//                 className="border px-1 py-0.5 w-full"
//                 placeholder="Search"
//                 value={invoiceNoFilter}
//                 onChange={(e) => setInvoiceNoFilter(e.target.value)}
//               />
//             </th>

//             <th className="p-1">
//               <input
//                 className="border px-1 py-0.5 w-full"
//                 placeholder="Search"
//                 value={estimateNoFilter}
//                 onChange={(e) => setEstimateNoFilter(e.target.value)}
//               />
//             </th>

//             <th className="p-1">
//               <input
//                 className="border px-1 py-0.5 w-full"
//                 placeholder="Search"
//                 value={subjectFilter}
//                 onChange={(e) => setSubjectFilter(e.target.value)}
//               />
//             </th>

//             <th className="p-1">
//               <input
//                 className="border px-1 py-0.5 w-full"
//                 placeholder="Search"
//                 value={clientFilter}
//                 onChange={(e) => setClientFilter(e.target.value)}
//               />
//             </th>

//             <th className="p-1">
//               <select
//                 className="border px-1 py-0.5 w-full"
//                 value={companyFilter}
//                 onChange={(e) => setCompanyFilter(e.target.value)}
//               >
//                 <option value="">All</option>
//                 <option value="iedge">iEDGE</option>
//                 <option value="travel">iEDGE - Travel & Tours</option>
//               </select>
//             </th>

//             <th className="p-1">
//               <input
//                 className="border px-1 py-0.5 w-full"
//                 placeholder="Search name"
//                 value={createdByFilter}
//                 onChange={(e) => setCreatedByFilter(e.target.value)}
//               />
//             </th>

//             <th className="p-1">
//               <input
//                 type="date"
//                 className="border px-1 py-0.5 w-full"
//                 value={dateFilter}
//                 onChange={(e) => setDateFilter(e.target.value)}
//               />
//             </th>

//             <th className="p-1">
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

//             <th className="p-1">
//               <select
//                 className="border px-1 py-0.5 w-full"
//                 value={statusFilter}
//                 onChange={(e) => setStatusFilter(e.target.value)}
//               >
//                 <option value="">All</option>
//                 <option value="Unpaid">Unpaid</option>
//                 <option value="Partially Paid">Partially Paid</option>
//                 <option value="Paid">Paid</option>
//                 <option value="Cancelled">Cancelled</option>
//               </select>
//             </th>

//             <th />
//           </tr>
//         </thead>

//         <tbody>
//           {paginatedInvoices.map((inv) => (
//             <tr key={inv.id} className="border-b hover:bg-gray-50">
//               <td className="p-2">{inv.invoiceNo}</td>
//               <td className="p-2">
//                 {inv.sourceEstimateNo || inv.estimateNo || "-"}
//               </td>
//               <td className="p-2">{getSubjectValue(inv) || "-"}</td>
//               <td className="p-2">{inv.client}</td>
//               <td className="p-2">{inv.company || "-"}</td>
//               <td className="p-2">
//                 {usersMap[inv.createdBy]?.displayName || "Unknown"}
//               </td>

//               <td className="p-2">{inv.invoiceDate}</td>

//               <td className="p-2 text-right">
//                 Rs.{" "}
//                 {Number(inv.total ?? 0).toLocaleString(undefined, {
//                   minimumFractionDigits: 2,
//                 })}
//               </td>

//               <td className="p-2">{inv.status || "Unpaid"}</td>

//               <td className="p-2">
//                 <div className="flex items-center gap-2">
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     title="Receive Payment"
//                     onClick={() => {
//                       setSelectedInvoice(inv);
//                       setShowPaymentModal(true);
//                     }}
//                   >
//                     <Wallet className="h-4 w-4" />
//                   </Button>

//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     title="View PDF"
//                     onClick={() => handleViewPdf(inv)}
//                   >
//                     <Eye className="h-4 w-4" />
//                   </Button>

//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     title="Edit"
//                     onClick={() => onEdit(inv)}
//                   >
//                     <Pencil className="h-4 w-4" />
//                   </Button>

//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     title="Duplicate"
//                     onClick={() => {
//                       const dup = { ...inv, id: undefined, invoiceNo: "" };
//                       onDuplicate(dup);
//                     }}
//                   >
//                     <Copy className="h-4 w-4" />
//                   </Button>
//                 </div>
//               </td>
//             </tr>
//           ))}

//           {filteredInvoices.length === 0 && (
//             <tr>
//               <td colSpan={9} className="p-4 text-center">
//                 No invoices found.
//               </td>
//             </tr>
//           )}
//         </tbody>
//       </table>

//       {!isAdmin ? (
//         <div className="mt-2 text-xs text-gray-500">
//           Showing only your invoices (non-admin).
//         </div>
//       ) : null}

//       {/* ✅ PDF Preview Modal */}
//       {isPreviewOpen && previewURL && (
//         <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg shadow-xl w-11/12 h-[90vh] p-4 flex flex-col">
//             <div className="flex justify-between mb-4">
//               <h2 className="font-semibold text-sm">Invoice PDF Preview</h2>
//               <button onClick={() => setIsPreviewOpen(false)}>❌</button>
//             </div>

//             <iframe
//               src={previewURL}
//               className="flex-1 border"
//               title="Invoice PDF Preview"
//             />

//             <div className="mt-4 flex justify-end gap-3">
//               <Button
//                 onClick={() => {
//                   const link = document.createElement("a");
//                   link.href = previewURL!;
//                   link.download = `${previewInvoiceNo || "invoice"}.pdf`;
//                   link.click();
//                 }}
//               >
//                 Download
//               </Button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ✅ RECEIVE PAYMENT MODAL */}
//       {showPaymentModal && selectedInvoice && (
//         <ReceivePaymentModal
//           invoice={selectedInvoice}
//           onClose={() => setShowPaymentModal(false)}
//         />
//       )}
//     </div>
//   );
// }

// "use client";

// import React, { useEffect, useMemo, useState } from "react";
// import { auth, db } from "@/lib/firebase";
// import {
//   collection,
//   doc,
//   getDoc,
//   getDocs,
//   onSnapshot,
//   query,
//   where,
// } from "firebase/firestore";

// import { onAuthStateChanged } from "firebase/auth";
// import { Button } from "@/components/ui/button";
// import { Eye, Pencil, Copy, Wallet } from "lucide-react";
// import { buildEstimateInvoicePdfBlob } from "@/lib/estimateInvoicePdf";
// import ReceivePaymentModal from "@/components/EstimateInvoice/ReceivePaymentModal";

// export type EstimateInvoice = any;

// type Props = {
//   onEdit: (invoice: EstimateInvoice) => void;
//   onDuplicate: (invoice: EstimateInvoice) => void;
// };

// const PANEL_ID = "IEDGE-SYSTEM";

// export default function EstimateInvoiceList({ onEdit, onDuplicate }: Props) {
//   const [invoices, setInvoices] = useState<EstimateInvoice[]>([]);
//   const [isAdmin, setIsAdmin] = useState(false);

//   // ✅ logged in user footer data
//   const [loggedInUser, setLoggedInUser] = useState<any>(null);

//   // ✅ PDF preview state
//   const [previewURL, setPreviewURL] = useState<string | null>(null);
//   const [isPreviewOpen, setIsPreviewOpen] = useState(false);
//   const [previewInvoiceNo, setPreviewInvoiceNo] = useState<string>("invoice");

//   // 🔍 Filters
//   const [invoiceNoFilter, setInvoiceNoFilter] = useState("");
//   const [estimateNoFilter, setEstimateNoFilter] = useState("");
//   const [subjectFilter, setSubjectFilter] = useState("");
//   const [clientFilter, setClientFilter] = useState("");
//   const [dateFilter, setDateFilter] = useState("");
//   const [statusFilter, setStatusFilter] = useState("");
//   const [minAmount, setMinAmount] = useState("");
//   const [maxAmount, setMaxAmount] = useState("");
//   const [isOperationAdmin, setIsOperationAdmin] = useState(false);
//   const [createdByFilter, setCreatedByFilter] = useState("");
//   const [usersMap, setUsersMap] = useState<Record<string, any>>({});
//   const [isReceiveOpen, setIsReceiveOpen] = useState(false);
//   const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
//   const [showPaymentModal, setShowPaymentModal] = useState(false);
//   const [companyFilter, setCompanyFilter] = useState("");

//   // 📅 Date preset filter
//   const [datePreset, setDatePreset] = useState<
//     "" | "today" | "thisMonth" | "lastMonth"
//   >("");

//   // 📄 Pagination
//   const [pageSize, setPageSize] = useState<10 | 20 | 50>(10);
//   const [page, setPage] = useState(1);

//   const invoicesRef = useMemo(
//     () => collection(db, "Panels", PANEL_ID, "estimateInvoices"),
//     [],
//   );

//   // ✅ same company list used in estimate form
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

//   const getSubjectValue = (inv: any) =>
//     String(inv?.subject || inv?.invoiceSubject || inv?.title || "");

//   const getStatusPillClasses = (status: string) => {
//     switch (String(status || "").toLowerCase()) {
//       case "paid":
//         return "bg-green-100 text-green-800 border border-green-200";
//       case "partially paid":
//         return "bg-blue-100 text-blue-800 border border-blue-200";
//       case "cancelled":
//         return "bg-red-100 text-red-800 border border-red-200";
//       case "void":
//         return "bg-gray-800 text-gray-100 border border-gray-600";
//       case "unpaid":
//       default:
//         return "bg-yellow-100 text-yellow-800 border border-yellow-200";
//     }
//   };

//   // ✅ cleanup blob url on unmount
//   useEffect(() => {
//     return () => {
//       if (previewURL) URL.revokeObjectURL(previewURL);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   useEffect(() => {
//     let unsubSnapshot: (() => void) | null = null;

//     const unsubAuth = onAuthStateChanged(auth, async (user) => {
//       if (!user) {
//         setInvoices([]);
//         setIsAdmin(false);
//         setLoggedInUser(null);
//         return;
//       }

//       const uid = user.uid;

//       try {
//         // ✅ load footer user + admin check
//         const userSnap = await getDoc(
//           doc(db, "Panels", PANEL_ID, "users", uid),
//         );
//         const userData = userSnap.data() as any;

//         setLoggedInUser(userData || null);

//         // ✅ load all users (UID → data)
//         const usersSnap = await getDocs(
//           collection(db, "Panels", PANEL_ID, "users"),
//         );

//         const map: Record<string, any> = {};
//         usersSnap.forEach((u) => {
//           map[u.id] = u.data();
//         });
//         setUsersMap(map);

//         const adminCheck =
//           userData?.isAdmin === true || userData?.isAdmin === "true";

//         const operationAdminCheck =
//           userData?.isOperationAdmin === true ||
//           userData?.isOperationAdmin === "true";

//         const financialAdminCheck =
//           userData?.isFinancialAdmin === true ||
//           userData?.isFinancialAdmin === "true";

//         setIsAdmin(adminCheck || operationAdminCheck || financialAdminCheck);
//         setIsOperationAdmin(operationAdminCheck);

//         const q =
//           adminCheck || operationAdminCheck || financialAdminCheck
//             ? query(invoicesRef)
//             : query(invoicesRef, where("createdBy", "==", uid));

//         unsubSnapshot = onSnapshot(q, (snap) => {
//           const list = snap.docs.map((d) => ({
//             id: d.id,
//             ...(d.data() as any),
//           }));
//           setInvoices(list);
//         });
//       } catch (e) {
//         console.error(e);
//         setLoggedInUser(null);
//         setIsAdmin(false);
//       }
//     });

//     return () => {
//       unsubAuth();
//       if (unsubSnapshot) unsubSnapshot();
//     };
//   }, [invoicesRef]);

//   // 📅 date preset matcher
//   const isDateInPresetRange = (invoiceDate: string) => {
//     if (!datePreset) return true;

//     const inv = new Date(`${invoiceDate}T00:00:00`);
//     if (Number.isNaN(inv.getTime())) return false;

//     const now = new Date();
//     const y = now.getFullYear();
//     const m = now.getMonth();
//     const d = now.getDate();

//     const startOfToday = new Date(y, m, d, 0, 0, 0);
//     const endOfToday = new Date(y, m, d, 23, 59, 59);

//     const startOfThisMonth = new Date(y, m, 1, 0, 0, 0);
//     const endOfThisMonth = new Date(y, m + 1, 0, 23, 59, 59);

//     const startOfLastMonth = new Date(y, m - 1, 1, 0, 0, 0);
//     const endOfLastMonth = new Date(y, m, 0, 23, 59, 59);

//     if (datePreset === "today") return inv >= startOfToday && inv <= endOfToday;
//     if (datePreset === "thisMonth")
//       return inv >= startOfThisMonth && inv <= endOfThisMonth;
//     if (datePreset === "lastMonth")
//       return inv >= startOfLastMonth && inv <= endOfLastMonth;

//     return true;
//   };

//   // 🔍 Apply all filters (client-side)
//   const filteredInvoices = invoices.filter((inv) => {
//     const invoiceNoMatch = String(inv.invoiceNo || "")
//       .toLowerCase()
//       .includes(invoiceNoFilter.toLowerCase());

//     const estimateNoMatch = String(inv.sourceEstimateNo || inv.estimateNo || "")
//       .toLowerCase()
//       .includes(estimateNoFilter.toLowerCase());

//     const subjectMatch = getSubjectValue(inv)
//       .toLowerCase()
//       .includes(subjectFilter.toLowerCase());

//     const clientMatch = String(inv.client || "")
//       .toLowerCase()
//       .includes(clientFilter.toLowerCase());

//     const invDate = String(inv.invoiceDate || "");

//     const exactDateMatch = dateFilter ? invDate === dateFilter : true;
//     const presetMatch = datePreset ? isDateInPresetRange(invDate) : true;
//     const dateMatch = exactDateMatch && presetMatch;

//     const statusMatch = statusFilter
//       ? String(inv.status || "").toLowerCase() === statusFilter.toLowerCase()
//       : true;

//     const amount = Number(inv.total || 0);
//     const minOk = minAmount ? amount >= Number(minAmount) : true;
//     const maxOk = maxAmount ? amount <= Number(maxAmount) : true;

//     const createdByText = String(usersMap[inv.createdBy]?.displayName || "")
//       .toLowerCase()
//       .trim();

//     const company = String(inv.company || "").toLowerCase();

//     let companyMatch = true;

//     if (companyFilter === "iedge") {
//       companyMatch =
//         company === "iedge" ||
//         company === "iedge - digital & creative" ||
//         company === "iedge - events & activations";
//     }

//     if (companyFilter === "travel") {
//       companyMatch = company === "iedge - travel & tours";
//     }

//     const createdByMatch = createdByFilter
//       ? createdByText.includes(createdByFilter.toLowerCase())
//       : true;

//     return (
//       invoiceNoMatch &&
//       estimateNoMatch &&
//       subjectMatch &&
//       clientMatch &&
//       dateMatch &&
//       statusMatch &&
//       minOk &&
//       maxOk &&
//       createdByMatch &&
//       companyMatch
//     );
//   });

//   // reset to page 1 when filters or page size changes
//   useEffect(() => {
//     setPage(1);
//   }, [
//     invoiceNoFilter,
//     estimateNoFilter,
//     subjectFilter,
//     clientFilter,
//     createdByFilter,
//     dateFilter,
//     datePreset,
//     statusFilter,
//     minAmount,
//     maxAmount,
//     pageSize,
//     companyFilter,
//   ]);

//   // pagination
//   const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
//   const safePage = Math.min(page, totalPages);

//   const paginatedInvoices = filteredInvoices.slice(
//     (safePage - 1) * pageSize,
//     safePage * pageSize,
//   );

//   const handleViewPdf = async (inv: any) => {
//     try {
//       if (previewURL) URL.revokeObjectURL(previewURL);

//       const blob = await buildEstimateInvoicePdfBlob({
//         invoice: inv,
//         companyList,
//         withLogo: Boolean(inv?.withLogo ?? true),
//         footerUser: loggedInUser,
//         companyName: String(inv?.company || "").trim(),
//       } as any);

//       const url = URL.createObjectURL(blob);
//       setPreviewURL(url);
//       setPreviewInvoiceNo(inv?.invoiceNo || "invoice");
//       setIsPreviewOpen(true);
//     } catch (e) {
//       console.error(e);
//       alert("Failed to generate PDF.");
//     }
//   };

//   const formatCsvCell = (value: any) => {
//     if (value === null || value === undefined) return '""';

//     const str = String(value);

//     // Preserve very long numeric values better when opened in Excel
//     const onlyDigits = /^\d+$/.test(str);
//     if (onlyDigits && str.length >= 11) {
//       const safe = str.replace(/"/g, '""');
//       return `"=""${safe}"""`;
//     }

//     return `"${str.replace(/"/g, '""')}"`;
//   };

//   const handleExport = () => {
//     try {
//       const headers = [
//         "Invoice No",
//         "Estimate No",
//         "Subject",
//         "Client",
//         "Created By",
//         "Invoice Date",
//         "Amount",
//         "Status",
//       ];

//       const rows = filteredInvoices.map((inv) => [
//         inv.invoiceNo || "",
//         inv.sourceEstimateNo || inv.estimateNo || "",
//         getSubjectValue(inv) || "",
//         inv.client || "",
//         usersMap[inv.createdBy]?.displayName || "Unknown",
//         inv.invoiceDate || "",
//         Number(inv.total ?? 0).toFixed(2),
//         inv.status || "Unpaid",
//       ]);

//       const csvContent = [
//         headers.map(formatCsvCell).join(","),
//         ...rows.map((row) => row.map(formatCsvCell).join(",")),
//       ].join("\n");

//       const blob = new Blob(["\uFEFF" + csvContent], {
//         type: "text/csv;charset=utf-8;",
//       });

//       const url = URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

//       link.href = url;
//       link.download = `estimate-invoices-${stamp}.csv`;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       URL.revokeObjectURL(url);
//     } catch (error) {
//       console.error("Export failed:", error);
//       alert("Failed to export invoices.");
//     }
//   };

//   return (
//     <div className="mt-6 px-2">
//       {/* Top controls: date presets + pagination */}
//       <div className="mb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
//         <div className="flex flex-wrap items-center gap-2">
//           <div className="text-xs text-gray-600 font-medium">Date Range:</div>

//           <button
//             type="button"
//             className={`text-xs px-2 py-1 rounded border ${
//               datePreset === "" ? "bg-black text-white" : "bg-white"
//             }`}
//             onClick={() => setDatePreset("")}
//           >
//             All
//           </button>

//           <button
//             type="button"
//             className={`text-xs px-2 py-1 rounded border ${
//               datePreset === "today" ? "bg-black text-white" : "bg-white"
//             }`}
//             onClick={() => setDatePreset("today")}
//           >
//             Today
//           </button>

//           <button
//             type="button"
//             className={`text-xs px-2 py-1 rounded border ${
//               datePreset === "thisMonth" ? "bg-black text-white" : "bg-white"
//             }`}
//             onClick={() => setDatePreset("thisMonth")}
//           >
//             This Month
//           </button>

//           <button
//             type="button"
//             className={`text-xs px-2 py-1 rounded border ${
//               datePreset === "lastMonth" ? "bg-black text-white" : "bg-white"
//             }`}
//             onClick={() => setDatePreset("lastMonth")}
//           >
//             Last Month
//           </button>

//           <div className="text-xs text-gray-500 ml-2">
//             Showing {filteredInvoices.length} result(s)
//           </div>
//         </div>

//         <div className="flex items-center gap-2 justify-end">
//           <Button
//             type="button"
//             variant="outline"
//             className="h-8 text-xs"
//             onClick={handleExport}
//             disabled={filteredInvoices.length === 0}
//           >
//             Export
//           </Button>

//           <div className="text-xs text-gray-600">Rows:</div>
//           <select
//             className="border rounded px-2 py-1 text-xs"
//             value={pageSize}
//             onChange={(e) => setPageSize(Number(e.target.value) as any)}
//           >
//             <option value={10}>10</option>
//             <option value={20}>20</option>
//             <option value={50}>50</option>
//           </select>

//           <button
//             type="button"
//             className="border rounded px-2 py-1 text-xs disabled:opacity-50"
//             disabled={safePage <= 1}
//             onClick={() => setPage((p) => Math.max(1, p - 1))}
//           >
//             Prev
//           </button>

//           <div className="text-xs text-gray-700">
//             Page {safePage} / {totalPages}
//           </div>

//           <button
//             type="button"
//             className="border rounded px-2 py-1 text-xs disabled:opacity-50"
//             disabled={safePage >= totalPages}
//             onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//           >
//             Next
//           </button>
//         </div>
//       </div>

//       <table className="w-full border text-xs">
//         <thead className="bg-gray-100">
//           <tr className="border-b">
//             <th className="text-left p-2">Invoice No</th>
//             <th className="text-left p-2">Estimate No</th>
//             <th className="text-left p-2">Subject</th>
//             <th className="text-left p-2">Client</th>
//             <th className="text-left p-2">Company</th>
//             <th className="text-left p-2">Created By</th>
//             <th className="text-left p-2">Invoice Date</th>
//             <th className="text-right p-2">Amount</th>
//             <th className="text-left p-2">Status</th>
//             <th className="text-left p-2">Actions</th>
//           </tr>

//           {/* 🔍 FILTER ROW */}
//           <tr className="bg-gray-50">
//             <th className="p-1">
//               <input
//                 className="border px-1 py-0.5 w-full"
//                 placeholder="Search"
//                 value={invoiceNoFilter}
//                 onChange={(e) => setInvoiceNoFilter(e.target.value)}
//               />
//             </th>

//             <th className="p-1">
//               <input
//                 className="border px-1 py-0.5 w-full"
//                 placeholder="Search"
//                 value={estimateNoFilter}
//                 onChange={(e) => setEstimateNoFilter(e.target.value)}
//               />
//             </th>

//             <th className="p-1">
//               <input
//                 className="border px-1 py-0.5 w-full"
//                 placeholder="Search"
//                 value={subjectFilter}
//                 onChange={(e) => setSubjectFilter(e.target.value)}
//               />
//             </th>

//             <th className="p-1">
//               <input
//                 className="border px-1 py-0.5 w-full"
//                 placeholder="Search"
//                 value={clientFilter}
//                 onChange={(e) => setClientFilter(e.target.value)}
//               />
//             </th>

//             <th className="p-1">
//               <select
//                 className="border px-1 py-0.5 w-full"
//                 value={companyFilter}
//                 onChange={(e) => setCompanyFilter(e.target.value)}
//               >
//                 <option value="">All</option>
//                 <option value="iedge">iEDGE</option>
//                 <option value="travel">iEDGE - Travel & Tours</option>
//               </select>
//             </th>

//             <th className="p-1">
//               <input
//                 className="border px-1 py-0.5 w-full"
//                 placeholder="Search name"
//                 value={createdByFilter}
//                 onChange={(e) => setCreatedByFilter(e.target.value)}
//               />
//             </th>

//             <th className="p-1">
//               <input
//                 type="date"
//                 className="border px-1 py-0.5 w-full"
//                 value={dateFilter}
//                 onChange={(e) => setDateFilter(e.target.value)}
//               />
//             </th>

//             <th className="p-1">
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

//             <th className="p-1">
//               <select
//                 className="border px-1 py-0.5 w-full"
//                 value={statusFilter}
//                 onChange={(e) => setStatusFilter(e.target.value)}
//               >
//                 <option value="">All</option>
//                 <option value="Unpaid">Unpaid</option>
//                 <option value="Partially Paid">Partially Paid</option>
//                 <option value="Paid">Paid</option>
//                 <option value="Cancelled">Cancelled</option>
//                 <option value="Void">Void</option>
//               </select>
//             </th>

//             <th />
//           </tr>
//         </thead>

//         <tbody>
//           {paginatedInvoices.map((inv) => {
//             const isVoid = String(inv.status || "").toLowerCase() === "void";

//             return (
//               <tr key={inv.id} className="border-b hover:bg-gray-50">
//                 <td className="p-2">{inv.invoiceNo}</td>
//                 <td className="p-2">
//                   {inv.sourceEstimateNo || inv.estimateNo || "-"}
//                 </td>
//                 <td className="p-2">{getSubjectValue(inv) || "-"}</td>
//                 <td className="p-2">{inv.client}</td>
//                 <td className="p-2">{inv.company || "-"}</td>
//                 <td className="p-2">
//                   {usersMap[inv.createdBy]?.displayName || "Unknown"}
//                 </td>

//                 <td className="p-2">{inv.invoiceDate}</td>

//                 <td className="p-2 text-right">
//                   Rs.{" "}
//                   {Number(inv.total ?? 0).toLocaleString(undefined, {
//                     minimumFractionDigits: 2,
//                   })}
//                 </td>

//                 <td className="p-2">
//                   <span
//                     className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusPillClasses(
//                       inv.status || "Unpaid",
//                     )}`}
//                   >
//                     {inv.status || "Unpaid"}
//                   </span>
//                 </td>

//                 <td className="p-2">
//                   <div className="flex items-center gap-2">
//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       title={
//                         isVoid
//                           ? "Receive Payment disabled for Void invoices"
//                           : "Receive Payment"
//                       }
//                       onClick={() => {
//                         if (isVoid) return;
//                         setSelectedInvoice(inv);
//                         setShowPaymentModal(true);
//                       }}
//                       disabled={isVoid}
//                     >
//                       <Wallet className="h-4 w-4" />
//                     </Button>

//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       title="View PDF"
//                       onClick={() => handleViewPdf(inv)}
//                     >
//                       <Eye className="h-4 w-4" />
//                     </Button>

//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       title="Edit"
//                       onClick={() => onEdit(inv)}
//                     >
//                       <Pencil className="h-4 w-4" />
//                     </Button>

//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       title="Duplicate"
//                       onClick={() => {
//                         const dup = { ...inv, id: undefined, invoiceNo: "" };
//                         onDuplicate(dup);
//                       }}
//                     >
//                       <Copy className="h-4 w-4" />
//                     </Button>
//                   </div>
//                 </td>
//               </tr>
//             );
//           })}

//           {filteredInvoices.length === 0 && (
//             <tr>
//               <td colSpan={10} className="p-4 text-center">
//                 No invoices found.
//               </td>
//             </tr>
//           )}
//         </tbody>
//       </table>

//       {!isAdmin ? (
//         <div className="mt-2 text-xs text-gray-500">
//           Showing only your invoices (non-admin).
//         </div>
//       ) : null}

//       {/* ✅ PDF Preview Modal */}
//       {isPreviewOpen && previewURL && (
//         <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg shadow-xl w-11/12 h-[90vh] p-4 flex flex-col">
//             <div className="flex justify-between mb-4">
//               <h2 className="font-semibold text-sm">Invoice PDF Preview</h2>
//               <button onClick={() => setIsPreviewOpen(false)}>❌</button>
//             </div>

//             <iframe
//               src={previewURL}
//               className="flex-1 border"
//               title="Invoice PDF Preview"
//             />

//             <div className="mt-4 flex justify-end gap-3">
//               <Button
//                 onClick={() => {
//                   const link = document.createElement("a");
//                   link.href = previewURL!;
//                   link.download = `${previewInvoiceNo || "invoice"}.pdf`;
//                   link.click();
//                 }}
//               >
//                 Download
//               </Button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ✅ RECEIVE PAYMENT MODAL */}
//       {showPaymentModal && selectedInvoice && (
//         <ReceivePaymentModal
//           invoice={selectedInvoice}
//           onClose={() => setShowPaymentModal(false)}
//         />
//       )}
//     </div>
//   );
// }






"use client";

import React, { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  Pencil,
  ReceiptText,
  RotateCcw,
  Wallet,
} from "lucide-react";
import { buildEstimateInvoicePdfBlob } from "@/lib/estimateInvoicePdf";
import ReceivePaymentModal from "@/components/EstimateInvoice/ReceivePaymentModal";

export type EstimateInvoice = any;

type Props = {
  onEdit: (invoice: EstimateInvoice) => void;
  onDuplicate: (invoice: EstimateInvoice) => void;
};

const PANEL_ID = "IEDGE-SYSTEM";

export default function EstimateInvoiceList({ onEdit, onDuplicate }: Props) {
  const [invoices, setInvoices] = useState<EstimateInvoice[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewInvoiceNo, setPreviewInvoiceNo] = useState<string>("invoice");

  const [invoiceNoFilter, setInvoiceNoFilter] = useState("");
  const [estimateNoFilter, setEstimateNoFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [createdByFilter, setCreatedByFilter] = useState("");
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [companyFilter, setCompanyFilter] = useState("");

  const [datePreset, setDatePreset] = useState<
    "" | "today" | "thisMonth" | "lastMonth"
  >("");

  const [pageSize] = useState<10 | 20 | 50>(10);
  const [page, setPage] = useState(1);

  const invoicesRef = useMemo(
    () => collection(db, "Panels", PANEL_ID, "estimateInvoices"),
    [],
  );

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

  const inputClass =
    "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100";

  const selectClass =
    "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100";

  const getSubjectValue = (inv: any) =>
    String(inv?.subject || inv?.invoiceSubject || inv?.title || "");

  const getStatusPillClasses = (status: string) => {
    switch (String(status || "").toLowerCase()) {
      case "paid":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      case "partially paid":
        return "border-blue-200 bg-blue-50 text-blue-700";
      case "cancelled":
        return "border-rose-200 bg-rose-50 text-rose-700";
      case "void":
        return "border-slate-300 bg-slate-900 text-white";
      case "unpaid":
      default:
        return "border-amber-200 bg-amber-50 text-amber-700";
    }
  };

  const formatAmount = (value: any) =>
    Number(value ?? 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  useEffect(() => {
    return () => {
      if (previewURL) URL.revokeObjectURL(previewURL);
    };
  }, [previewURL]);

  useEffect(() => {
    let unsubSnapshot: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setInvoices([]);
        setIsAdmin(false);
        setLoggedInUser(null);
        return;
      }

      const uid = user.uid;

      try {
        const userSnap = await getDoc(
          doc(db, "Panels", PANEL_ID, "users", uid),
        );

        const userData = userSnap.data() as any;
        setLoggedInUser(userData || null);

        const usersSnap = await getDocs(
          collection(db, "Panels", PANEL_ID, "users"),
        );

        const map: Record<string, any> = {};
        usersSnap.forEach((u) => {
          map[u.id] = u.data();
        });
        setUsersMap(map);

        const adminCheck =
          userData?.isAdmin === true || userData?.isAdmin === "true";

        const operationAdminCheck =
          userData?.isOperationAdmin === true ||
          userData?.isOperationAdmin === "true";

        const financialAdminCheck =
          userData?.isFinancialAdmin === true ||
          userData?.isFinancialAdmin === "true";

        const canViewAll =
          adminCheck || operationAdminCheck || financialAdminCheck;

        setIsAdmin(canViewAll);

        const q = canViewAll
          ? query(invoicesRef)
          : query(invoicesRef, where("createdBy", "==", uid));

        unsubSnapshot = onSnapshot(q, (snap) => {
          const list = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          }));

          setInvoices(list);
        });
      } catch (e) {
        console.error(e);
        setLoggedInUser(null);
        setIsAdmin(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, [invoicesRef]);

  const isDateInPresetRange = (invoiceDate: string) => {
    if (!datePreset) return true;

    const inv = new Date(`${invoiceDate}T00:00:00`);
    if (Number.isNaN(inv.getTime())) return false;

    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();

    const startOfToday = new Date(y, m, d, 0, 0, 0);
    const endOfToday = new Date(y, m, d, 23, 59, 59);

    const startOfThisMonth = new Date(y, m, 1, 0, 0, 0);
    const endOfThisMonth = new Date(y, m + 1, 0, 23, 59, 59);

    const startOfLastMonth = new Date(y, m - 1, 1, 0, 0, 0);
    const endOfLastMonth = new Date(y, m, 0, 23, 59, 59);

    if (datePreset === "today") return inv >= startOfToday && inv <= endOfToday;
    if (datePreset === "thisMonth")
      return inv >= startOfThisMonth && inv <= endOfThisMonth;
    if (datePreset === "lastMonth")
      return inv >= startOfLastMonth && inv <= endOfLastMonth;

    return true;
  };

  const filteredInvoices = invoices.filter((inv) => {
    const invoiceNoMatch = String(inv.invoiceNo || "")
      .toLowerCase()
      .includes(invoiceNoFilter.toLowerCase());

    const estimateNoMatch = String(inv.sourceEstimateNo || inv.estimateNo || "")
      .toLowerCase()
      .includes(estimateNoFilter.toLowerCase());

    const subjectMatch = getSubjectValue(inv)
      .toLowerCase()
      .includes(subjectFilter.toLowerCase());

    const clientMatch = String(inv.client || "")
      .toLowerCase()
      .includes(clientFilter.toLowerCase());

    const invDate = String(inv.invoiceDate || "");

    const exactDateMatch = dateFilter ? invDate === dateFilter : true;
    const presetMatch = datePreset ? isDateInPresetRange(invDate) : true;
    const dateMatch = exactDateMatch && presetMatch;

    const statusMatch = statusFilter
      ? String(inv.status || "").toLowerCase() === statusFilter.toLowerCase()
      : true;

    const amount = Number(inv.total || 0);
    const minOk = minAmount ? amount >= Number(minAmount) : true;
    const maxOk = maxAmount ? amount <= Number(maxAmount) : true;

    const createdByText = String(usersMap[inv.createdBy]?.displayName || "")
      .toLowerCase()
      .trim();

    const company = String(inv.company || "").toLowerCase();

    let companyMatch = true;

    if (companyFilter === "iedge") {
      companyMatch =
        company === "iedge" ||
        company === "iedge - digital & creative" ||
        company === "iedge - events & activations";
    }

    if (companyFilter === "travel") {
      companyMatch = company === "iedge - travel & tours";
    }

    const createdByMatch = createdByFilter
      ? createdByText.includes(createdByFilter.toLowerCase())
      : true;

    return (
      invoiceNoMatch &&
      estimateNoMatch &&
      subjectMatch &&
      clientMatch &&
      dateMatch &&
      statusMatch &&
      minOk &&
      maxOk &&
      createdByMatch &&
      companyMatch
    );
  });

  useEffect(() => {
    setPage(1);
  }, [
    invoiceNoFilter,
    estimateNoFilter,
    subjectFilter,
    clientFilter,
    createdByFilter,
    dateFilter,
    datePreset,
    statusFilter,
    minAmount,
    maxAmount,
    companyFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedInvoices = filteredInvoices.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const startItem =
    filteredInvoices.length === 0 ? 0 : (safePage - 1) * pageSize + 1;

  const endItem = Math.min(safePage * pageSize, filteredInvoices.length);

  const getVisiblePages = () => {
    const pages: Array<number | "..."> = [];

    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    if (safePage <= 3) {
      return [1, 2, 3, "...", totalPages];
    }

    if (safePage >= totalPages - 2) {
      return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "...", safePage - 1, safePage, safePage + 1, "...", totalPages];
  };

  const visiblePages = getVisiblePages();

  const totalAmount = filteredInvoices.reduce(
    (sum, inv) => sum + Number(inv.total || 0),
    0,
  );

  const paidCount = filteredInvoices.filter(
    (inv) => String(inv.status || "").toLowerCase() === "paid",
  ).length;

  const unpaidCount = filteredInvoices.filter(
    (inv) =>
      !inv.status || String(inv.status || "").toLowerCase() === "unpaid",
  ).length;

  const partialCount = filteredInvoices.filter(
    (inv) => String(inv.status || "").toLowerCase() === "partially paid",
  ).length;

  const hasActiveFilters = Boolean(
    invoiceNoFilter ||
      estimateNoFilter ||
      subjectFilter ||
      clientFilter ||
      dateFilter ||
      statusFilter ||
      minAmount ||
      maxAmount ||
      createdByFilter ||
      companyFilter ||
      datePreset,
  );

  const resetFilters = () => {
    setInvoiceNoFilter("");
    setEstimateNoFilter("");
    setSubjectFilter("");
    setClientFilter("");
    setDateFilter("");
    setStatusFilter("");
    setMinAmount("");
    setMaxAmount("");
    setCreatedByFilter("");
    setCompanyFilter("");
    setDatePreset("");
  };

  const handleViewPdf = async (inv: any) => {
    try {
      const blob = await buildEstimateInvoicePdfBlob({
        invoice: inv,
        companyList,
        withLogo: Boolean(inv?.withLogo ?? true),
        footerUser: loggedInUser,
        companyName: String(inv?.company || "").trim(),
      } as any);

      const url = URL.createObjectURL(blob);
      setPreviewURL(url);
      setPreviewInvoiceNo(inv?.invoiceNo || "invoice");
      setIsPreviewOpen(true);
    } catch (e) {
      console.error(e);
      alert("Failed to generate PDF.");
    }
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewURL(null);
  };

  const formatCsvCell = (value: any) => {
    if (value === null || value === undefined) return '""';

    const str = String(value);

    const onlyDigits = /^\d+$/.test(str);
    if (onlyDigits && str.length >= 11) {
      const safe = str.replace(/"/g, '""');
      return `"=""${safe}"""`;
    }

    return `"${str.replace(/"/g, '""')}"`;
  };

  const handleExport = () => {
    try {
      const headers = [
        "Invoice No",
        "Estimate No",
        "Subject",
        "Client",
        "Created By",
        "Invoice Date",
        "Amount",
        "Status",
      ];

      const rows = filteredInvoices.map((inv) => [
        inv.invoiceNo || "",
        inv.sourceEstimateNo || inv.estimateNo || "",
        getSubjectValue(inv) || "",
        inv.client || "",
        usersMap[inv.createdBy]?.displayName || "Unknown",
        inv.invoiceDate || "",
        Number(inv.total ?? 0).toFixed(2),
        inv.status || "Unpaid",
      ]);

      const csvContent = [
        headers.map(formatCsvCell).join(","),
        ...rows.map((row) => row.map(formatCsvCell).join(",")),
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

      link.href = url;
      link.download = `estimate-invoices-${stamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export invoices.");
    }
  };

  return (
    <div className="mt-6 space-y-5">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50/70 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
              <ReceiptText className="h-3.5 w-3.5" />
              Estimate Invoice Management
            </div>

            <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">
              Estimate Invoices
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              View, filter, export, preview, duplicate, edit, and receive
              payments against estimate invoices.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="h-10 rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-40"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Filters
            </Button>

            <Button
              type="button"
              onClick={handleExport}
              disabled={filteredInvoices.length === 0}
              className="h-10 rounded-xl bg-slate-950 px-4 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-40"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Total Invoices
            </p>
            <p className="mt-2 text-2xl font-black text-slate-950">
              {filteredInvoices.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Total Amount
            </p>
            <p className="mt-2 text-2xl font-black text-slate-950">
              Rs. {formatAmount(totalAmount)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Paid
            </p>
            <p className="mt-2 text-2xl font-black text-emerald-600">
              {paidCount}
            </p>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Unpaid / Partial
            </p>
            <p className="mt-2 text-2xl font-black text-amber-600">
              {unpaidCount + partialCount}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
              <Filter className="h-4 w-4" />
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-950">Filters</h3>
              <p className="text-xs text-slate-500">
                Refine invoice records instantly
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="mr-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <CalendarDays className="h-3.5 w-3.5" />
              Date Range
            </div>

            {[
              { label: "All", value: "" },
              { label: "Today", value: "today" },
              { label: "This Month", value: "thisMonth" },
              { label: "Last Month", value: "lastMonth" },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setDatePreset(item.value as any)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  datePreset === item.value
                    ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Invoice No
            </label>
            <input
              className={inputClass}
              placeholder="Search invoice"
              value={invoiceNoFilter}
              onChange={(e) => setInvoiceNoFilter(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Estimate No
            </label>
            <input
              className={inputClass}
              placeholder="Search estimate"
              value={estimateNoFilter}
              onChange={(e) => setEstimateNoFilter(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Subject
            </label>
            <input
              className={inputClass}
              placeholder="Search subject"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Client
            </label>
            <input
              className={inputClass}
              placeholder="Search client"
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Company
            </label>
            <select
              className={selectClass}
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
            >
              <option value="">All Companies</option>
              <option value="iedge">iEDGE Group</option>
              <option value="travel">iEDGE - Travel & Tours</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Created By
            </label>
            <input
              className={inputClass}
              placeholder="Search creator"
              value={createdByFilter}
              onChange={(e) => setCreatedByFilter(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Invoice Date
            </label>
            <input
              type="date"
              className={inputClass}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Status
            </label>
            <select
              className={selectClass}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Paid">Paid</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Void">Void</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Amount Range
            </label>
            <div className="grid grid-cols-2 gap-2">
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
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm font-medium text-slate-600">
            Showing{" "}
            <span className="font-black text-slate-950">{startItem}</span> to{" "}
            <span className="font-black text-slate-950">{endItem}</span> of{" "}
            <span className="font-black text-slate-950">
              {filteredInvoices.length}
            </span>{" "}
            estimates
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-white"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>

            {visiblePages.map((item, index) =>
              item === "..." ? (
                <span
                  key={`ellipsis-${index}`}
                  className="flex h-10 min-w-10 items-center justify-center text-sm font-bold text-slate-400"
                >
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPage(Number(item))}
                  className={`flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-bold shadow-sm transition ${
                    safePage === item
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {item}
                </button>
              ),
            )}

            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-white"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-left">
                <th className="px-4 py-3 font-black uppercase tracking-[0.12em] text-slate-400">
                  Invoice No
                </th>
                <th className="px-4 py-3 font-black uppercase tracking-[0.12em] text-slate-400">
                  Estimate No
                </th>
                <th className="px-4 py-3 font-black uppercase tracking-[0.12em] text-slate-400">
                  Subject
                </th>
                <th className="px-4 py-3 font-black uppercase tracking-[0.12em] text-slate-400">
                  Client
                </th>
                <th className="px-4 py-3 font-black uppercase tracking-[0.12em] text-slate-400">
                  Company
                </th>
                <th className="px-4 py-3 font-black uppercase tracking-[0.12em] text-slate-400">
                  Created By
                </th>
                <th className="px-4 py-3 font-black uppercase tracking-[0.12em] text-slate-400">
                  Invoice Date
                </th>
                <th className="px-4 py-3 text-right font-black uppercase tracking-[0.12em] text-slate-400">
                  Amount
                </th>
                <th className="px-4 py-3 font-black uppercase tracking-[0.12em] text-slate-400">
                  Status
                </th>
                <th className="px-4 py-3 font-black uppercase tracking-[0.12em] text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedInvoices.map((inv) => {
                const isVoid =
                  String(inv.status || "").toLowerCase() === "void";

                return (
                  <tr
                    key={inv.id}
                    className="bg-white transition hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {inv.invoiceNo || "-"}
                    </td>

                    <td className="px-4 py-3 font-medium text-slate-600">
                      {inv.sourceEstimateNo || inv.estimateNo || "-"}
                    </td>

                    <td className="max-w-[220px] px-4 py-3 font-medium text-slate-700">
                      <span className="line-clamp-2">
                        {getSubjectValue(inv) || "-"}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-medium text-slate-700">
                      {inv.client || "-"}
                    </td>

                    <td className="px-4 py-3 font-medium text-slate-600">
                      {inv.company || "-"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700">
                        {usersMap[inv.createdBy]?.displayName || "Unknown"}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-medium text-slate-600">
                      {inv.invoiceDate || "-"}
                    </td>

                    <td className="px-4 py-3 text-right font-black text-slate-950">
                      Rs. {formatAmount(inv.total)}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black ${getStatusPillClasses(
                          inv.status || "Unpaid",
                        )}`}
                      >
                        {inv.status || "Unpaid"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          title={
                            isVoid
                              ? "Receive Payment disabled for Void invoices"
                              : "Receive Payment"
                          }
                          onClick={() => {
                            if (isVoid) return;
                            setSelectedInvoice(inv);
                            setShowPaymentModal(true);
                          }}
                          disabled={isVoid}
                          className="h-9 w-9 rounded-xl text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40"
                        >
                          <Wallet className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          title="View PDF"
                          onClick={() => handleViewPdf(inv)}
                          className="h-9 w-9 rounded-xl text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          title="Edit"
                          onClick={() => onEdit(inv)}
                          className="h-9 w-9 rounded-xl text-slate-600 hover:bg-amber-50 hover:text-amber-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          title="Duplicate"
                          onClick={() => {
                            const dup = {
                              ...inv,
                              id: undefined,
                              invoiceNo: "",
                            };
                            onDuplicate(dup);
                          }}
                          className="h-9 w-9 rounded-xl text-slate-600 hover:bg-purple-50 hover:text-purple-700"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-14 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                        <ReceiptText className="h-6 w-6" />
                      </div>

                      <h4 className="text-sm font-black text-slate-900">
                        No invoices found
                      </h4>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Try changing or clearing your filters to view more
                        invoice records.
                      </p>

                      {hasActiveFilters && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={resetFilters}
                          className="mt-4 h-9 rounded-xl text-xs font-bold"
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {!isAdmin ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500">
          Showing only your invoices because this account does not have admin
          access.
        </div>
      ) : null}

      {isPreviewOpen && previewURL && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-sm font-black text-slate-950">
                  Invoice PDF Preview
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {previewInvoiceNo || "invoice"}
                </p>
              </div>

              <button
                type="button"
                onClick={handleClosePreview}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-600 transition hover:bg-slate-200"
              >
                X
              </button>
            </div>

            <div className="flex-1 bg-slate-100 p-3">
              <iframe
                src={previewURL}
                className="h-full w-full rounded-2xl border border-slate-200 bg-white"
                title="Invoice PDF Preview"
              />
            </div>

            <div className="flex justify-end border-t border-slate-100 px-5 py-4">
              <Button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = previewURL;
                  link.download = `${previewInvoiceNo || "invoice"}.pdf`;
                  link.click();
                }}
                className="h-10 rounded-xl bg-slate-950 px-4 text-xs font-semibold text-white hover:bg-slate-800"
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && selectedInvoice && (
        <ReceivePaymentModal
          invoice={selectedInvoice}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}