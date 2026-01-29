// "use client";

// import React, { useEffect, useMemo, useState } from "react";
// import { auth, db } from "@/lib/firebase";
// import {
//   collection,
//   doc,
//   getDoc,
//   onSnapshot,
//   query,
//   where,
// } from "firebase/firestore";
// import { onAuthStateChanged } from "firebase/auth";
// import { Button } from "@/components/ui/button";
// import { Eye, Pencil, Copy } from "lucide-react";
// import { buildEstimateInvoicePdfBlob } from "@/lib/estimateInvoicePdf";

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
//   const [clientFilter, setClientFilter] = useState("");
//   const [dateFilter, setDateFilter] = useState("");
//   const [statusFilter, setStatusFilter] = useState("");
//   const [minAmount, setMinAmount] = useState("");
//   const [maxAmount, setMaxAmount] = useState("");

//   // 📅 Date preset filter
//   const [datePreset, setDatePreset] = useState<
//     "" | "today" | "thisMonth" | "lastMonth"
//   >("");

//   // 📄 Pagination
//   const [pageSize, setPageSize] = useState<10 | 20 | 50>(10);
//   const [page, setPage] = useState(1);

//   const invoicesRef = useMemo(
//     () => collection(db, "Panels", PANEL_ID, "estimateInvoices"),
//     []
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
//         const userSnap = await getDoc(doc(db, "Panels", PANEL_ID, "users", uid));
//         const userData = userSnap.data() as any;

//         setLoggedInUser(userData || null);

//         const adminCheck = userData?.isAdmin === true;
//         setIsAdmin(adminCheck);

//         const q = adminCheck
//           ? query(invoicesRef)
//           : query(invoicesRef, where("createdBy", "==", uid));

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

//     const clientMatch = String(inv.client || "")
//       .toLowerCase()
//       .includes(clientFilter.toLowerCase());

//     const invDate = String(inv.invoiceDate || "");

//     // exact date
//     const exactDateMatch = dateFilter ? invDate === dateFilter : true;
//     // preset date range
//     const presetMatch = datePreset ? isDateInPresetRange(invDate) : true;
//     const dateMatch = exactDateMatch && presetMatch;

//     const statusMatch = statusFilter
//       ? String(inv.status || "").toLowerCase() === statusFilter.toLowerCase()
//       : true;

//     const amount = Number(inv.total || 0);
//     const minOk = minAmount ? amount >= Number(minAmount) : true;
//     const maxOk = maxAmount ? amount <= Number(maxAmount) : true;

//     return (
//       invoiceNoMatch &&
//       estimateNoMatch &&
//       clientMatch &&
//       dateMatch &&
//       statusMatch &&
//       minOk &&
//       maxOk
//     );
//   });

//   // reset to page 1 when filters or page size changes
//   useEffect(() => {
//     setPage(1);
//   }, [
//     invoiceNoFilter,
//     estimateNoFilter,
//     clientFilter,
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
//     safePage * pageSize
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
//             <th className="text-left p-2">Client</th>
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
//                 value={clientFilter}
//                 onChange={(e) => setClientFilter(e.target.value)}
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
//               <td className="p-2">{inv.client}</td>
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
//               <td colSpan={7} className="p-4 text-center">
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
//     </div>
//   );
// }

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
// import { collection, doc, getDoc, onSnapshot, query, where,} from "firebase/firestore";
import {
  collection,
  doc,
  getDoc,
  getDocs, // ✅ ADD
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Copy } from "lucide-react";
import { buildEstimateInvoicePdfBlob } from "@/lib/estimateInvoicePdf";

export type EstimateInvoice = any;

type Props = {
  onEdit: (invoice: EstimateInvoice) => void;
  onDuplicate: (invoice: EstimateInvoice) => void;
};

const PANEL_ID = "IEDGE-SYSTEM";

export default function EstimateInvoiceList({ onEdit, onDuplicate }: Props) {
  const [invoices, setInvoices] = useState<EstimateInvoice[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // ✅ logged in user footer data
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  // ✅ PDF preview state
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewInvoiceNo, setPreviewInvoiceNo] = useState<string>("invoice");

  // 🔍 Filters
  const [invoiceNoFilter, setInvoiceNoFilter] = useState("");
  const [estimateNoFilter, setEstimateNoFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [isOperationAdmin, setIsOperationAdmin] = useState(false);
  const [createdByFilter, setCreatedByFilter] = useState("");
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});

  // 📅 Date preset filter
  const [datePreset, setDatePreset] = useState<
    "" | "today" | "thisMonth" | "lastMonth"
  >("");

  // 📄 Pagination
  const [pageSize, setPageSize] = useState<10 | 20 | 50>(10);
  const [page, setPage] = useState(1);

  const invoicesRef = useMemo(
    () => collection(db, "Panels", PANEL_ID, "estimateInvoices"),
    [],
  );

  // ✅ same company list used in estimate form
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

  // ✅ cleanup blob url on unmount
  useEffect(() => {
    return () => {
      if (previewURL) URL.revokeObjectURL(previewURL);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        // ✅ load footer user + admin check
        const userSnap = await getDoc(
          doc(db, "Panels", PANEL_ID, "users", uid),
        );
        const userData = userSnap.data() as any;

        setLoggedInUser(userData || null);
        // ✅ load all users (UID → data)
        const usersSnap = await getDocs(
          collection(db, "Panels", PANEL_ID, "users"),
        );

        const map: Record<string, any> = {};
        usersSnap.forEach((u) => {
          map[u.id] = u.data();
        });
        setUsersMap(map);

        // const adminCheck = userData?.isAdmin === true;
        // setIsAdmin(adminCheck);

        // const operationAdminCheck = userData?.isOperationAdmin === true;
        // setIsOperationAdmin(operationAdminCheck);

        // const adminCheck =
        //   userData?.isAdmin === true || userData?.isAdmin === "true";

        // const operationAdminCheck =
        //   userData?.isOperationAdmin === true ||
        //   userData?.isOperationAdmin === "true";

        const adminCheck =
          userData?.isAdmin === true || userData?.isAdmin === "true";

        const operationAdminCheck =
          userData?.isOperationAdmin === true ||
          userData?.isOperationAdmin === "true";

        const financialAdminCheck =
          userData?.isFinancialAdmin === true ||
          userData?.isFinancialAdmin === "true";

        // const q = adminCheck
        //   ? query(invoicesRef)
        //   : query(invoicesRef, where("createdBy", "==", uid));

        // const q =
        //   adminCheck || operationAdminCheck
        //     ? query(invoicesRef) // Admin & Operation Admin see ALL
        //     : query(invoicesRef, where("createdBy", "==", uid)); // Normal user

        const q =
          adminCheck || operationAdminCheck || financialAdminCheck
            ? query(invoicesRef) // ✅ Admin, Operation Admin, Financial Admin
            : query(invoicesRef, where("createdBy", "==", uid)); // Normal user

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

  // 📅 date preset matcher
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

  // 🔍 Apply all filters (client-side)
  const filteredInvoices = invoices.filter((inv) => {
    const invoiceNoMatch = String(inv.invoiceNo || "")
      .toLowerCase()
      .includes(invoiceNoFilter.toLowerCase());

    const estimateNoMatch = String(inv.sourceEstimateNo || inv.estimateNo || "")
      .toLowerCase()
      .includes(estimateNoFilter.toLowerCase());

    const clientMatch = String(inv.client || "")
      .toLowerCase()
      .includes(clientFilter.toLowerCase());

    const invDate = String(inv.invoiceDate || "");

    // exact date
    const exactDateMatch = dateFilter ? invDate === dateFilter : true;
    // preset date range
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

    const createdByMatch = createdByFilter
      ? createdByText.includes(createdByFilter.toLowerCase())
      : true;

    return (
      invoiceNoMatch &&
      estimateNoMatch &&
      clientMatch &&
      dateMatch &&
      statusMatch &&
      minOk &&
      maxOk &&
      createdByMatch
    );
  });

  // reset to page 1 when filters or page size changes
  useEffect(() => {
    setPage(1);
  }, [
    invoiceNoFilter,
    estimateNoFilter,
    clientFilter,
    createdByFilter,
    dateFilter,
    datePreset,
    statusFilter,
    minAmount,
    maxAmount,
    pageSize,
  ]);

  // pagination
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedInvoices = filteredInvoices.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const handleViewPdf = async (inv: any) => {
    try {
      if (previewURL) URL.revokeObjectURL(previewURL);

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

  return (
    <div className="mt-6 px-2">
      {/* Top controls: date presets + pagination */}
      <div className="mb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs text-gray-600 font-medium">Date Range:</div>

          <button
            type="button"
            className={`text-xs px-2 py-1 rounded border ${
              datePreset === "" ? "bg-black text-white" : "bg-white"
            }`}
            onClick={() => setDatePreset("")}
          >
            All
          </button>

          <button
            type="button"
            className={`text-xs px-2 py-1 rounded border ${
              datePreset === "today" ? "bg-black text-white" : "bg-white"
            }`}
            onClick={() => setDatePreset("today")}
          >
            Today
          </button>

          <button
            type="button"
            className={`text-xs px-2 py-1 rounded border ${
              datePreset === "thisMonth" ? "bg-black text-white" : "bg-white"
            }`}
            onClick={() => setDatePreset("thisMonth")}
          >
            This Month
          </button>

          <button
            type="button"
            className={`text-xs px-2 py-1 rounded border ${
              datePreset === "lastMonth" ? "bg-black text-white" : "bg-white"
            }`}
            onClick={() => setDatePreset("lastMonth")}
          >
            Last Month
          </button>

          <div className="text-xs text-gray-500 ml-2">
            Showing {filteredInvoices.length} result(s)
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <div className="text-xs text-gray-600">Rows:</div>
          <select
            className="border rounded px-2 py-1 text-xs"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value) as any)}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>

          <button
            type="button"
            className="border rounded px-2 py-1 text-xs disabled:opacity-50"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>

          <div className="text-xs text-gray-700">
            Page {safePage} / {totalPages}
          </div>

          <button
            type="button"
            className="border rounded px-2 py-1 text-xs disabled:opacity-50"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>

      <table className="w-full border text-xs">
        <thead className="bg-gray-100">
          <tr className="border-b">
            <th className="text-left p-2">Invoice No</th>
            <th className="text-left p-2">Estimate No</th>
            <th className="text-left p-2">Client</th>
            <th className="text-left p-2">Created By</th>
            <th className="text-left p-2">Invoice Date</th>
            <th className="text-right p-2">Amount</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Actions</th>
          </tr>

          {/* 🔍 FILTER ROW */}
          <tr className="bg-gray-50">
            <th className="p-1">
              <input
                className="border px-1 py-0.5 w-full"
                placeholder="Search"
                value={invoiceNoFilter}
                onChange={(e) => setInvoiceNoFilter(e.target.value)}
              />
            </th>

            <th className="p-1">
              <input
                className="border px-1 py-0.5 w-full"
                placeholder="Search"
                value={estimateNoFilter}
                onChange={(e) => setEstimateNoFilter(e.target.value)}
              />
            </th>

            <th className="p-1">
              <input
                className="border px-1 py-0.5 w-full"
                placeholder="Search"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
              />
            </th>

            {/* <th className="p-1">
              <input
                type="date"
                className="border px-1 py-0.5 w-full"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </th> */}

            <th className="p-1">
              <input
                className="border px-1 py-0.5 w-full"
                placeholder="Search name"
                value={createdByFilter}
                onChange={(e) => setCreatedByFilter(e.target.value)}
              />
            </th>

            <th className="p-1">
              <input
                type="date"
                className="border px-1 py-0.5 w-full"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </th>

            <th className="p-1">
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

            <th className="p-1">
              <select
                className="border px-1 py-0.5 w-full"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Paid">Paid</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </th>

            <th />
          </tr>
        </thead>

        <tbody>
          {paginatedInvoices.map((inv) => (
            <tr key={inv.id} className="border-b hover:bg-gray-50">
              <td className="p-2">{inv.invoiceNo}</td>
              <td className="p-2">
                {inv.sourceEstimateNo || inv.estimateNo || "-"}
              </td>
              <td className="p-2">{inv.client}</td>
              <td className="p-2">
                {usersMap[inv.createdBy]?.displayName || "Unknown"}
              </td>

              <td className="p-2">{inv.invoiceDate}</td>

              <td className="p-2 text-right">
                Rs.{" "}
                {Number(inv.total ?? 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </td>

              <td className="p-2">{inv.status || "Unpaid"}</td>

              <td className="p-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="View PDF"
                    onClick={() => handleViewPdf(inv)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    title="Edit"
                    onClick={() => onEdit(inv)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    title="Duplicate"
                    onClick={() => {
                      const dup = { ...inv, id: undefined, invoiceNo: "" };
                      onDuplicate(dup);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}

          {filteredInvoices.length === 0 && (
            <tr>
              <td colSpan={8} className="p-4 text-center">
                No invoices found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {!isAdmin ? (
        <div className="mt-2 text-xs text-gray-500">
          Showing only your invoices (non-admin).
        </div>
      ) : null}

      {/* ✅ PDF Preview Modal */}
      {isPreviewOpen && previewURL && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 h-[90vh] p-4 flex flex-col">
            <div className="flex justify-between mb-4">
              <h2 className="font-semibold text-sm">Invoice PDF Preview</h2>
              <button onClick={() => setIsPreviewOpen(false)}>❌</button>
            </div>

            <iframe
              src={previewURL}
              className="flex-1 border"
              title="Invoice PDF Preview"
            />

            <div className="mt-4 flex justify-end gap-3">
              <Button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = previewURL!;
                  link.download = `${previewInvoiceNo || "invoice"}.pdf`;
                  link.click();
                }}
              >
                Download
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
