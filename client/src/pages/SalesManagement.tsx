// import { useState, useEffect, useMemo } from "react";
// import { ViewDetailModal } from "@/components/ViewDetailModal";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { useAuth } from "@/contexts/AuthContext";
// import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import type { SalesRecord } from "@shared/schema";

// const STATUS_OPTIONS = [
//   "Lead",
//   "Discussion",
//   "Negotiation",
//   "Won",
//   "Lost",
//   "Invoiced",
//   "Payment Received",
// ] as const;

// const PAGE_SIZE = 6;

// const ALLOWED_ROLES = ["main_admin", "operational_admin", "financial_admin"];

// export function SalesManagement() {
//   const { userProfile } = useAuth();

//   const [allRecords, setAllRecords] = useState<SalesRecord[]>([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] = useState("All");
//   const [projectOwnerFilter, setProjectOwnerFilter] = useState("All");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [loading, setLoading] = useState(true);
//   const [viewDetailModalOpen, setViewDetailModalOpen] = useState(false);
//   const [selectedRecord, setSelectedRecord] = useState<SalesRecord | null>(
//     null,
//   );

//   useEffect(() => {
//     if (!userProfile) return;
//     if (!ALLOWED_ROLES.includes(userProfile.role)) return;

//     const q = query(
//       collection(db, "Panels", "IEDGE-SYSTEM", "salesRecords"),
//       orderBy("updatedAt", "desc"),
//     );

//     const unsubscribe = onSnapshot(
//       q,
//       (snapshot) => {
//         const recordsData = snapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//           createdAt: doc.data().createdAt?.toDate?.(),
//           updatedAt: doc.data().updatedAt?.toDate?.(),
//         })) as SalesRecord[];

//         setAllRecords(recordsData);
//         setLoading(false);
//       },
//       (error) => {
//         console.error("Failed to fetch sales records:", error);
//         setLoading(false);
//       },
//     );

//     return () => unsubscribe();
//   }, [userProfile]);

//   const formatCurrency = (value?: number | string) => {
//     return `₨ ${(Number(value) || 0).toLocaleString()}`;
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "Lead":
//         return "bg-sky-50 text-sky-700 border-sky-200";
//       case "Discussion":
//         return "bg-amber-50 text-amber-700 border-amber-200";
//       case "Negotiation":
//         return "bg-orange-50 text-orange-700 border-orange-200";
//       case "Won":
//         return "bg-emerald-50 text-emerald-700 border-emerald-200";
//       case "Lost":
//         return "bg-rose-50 text-rose-700 border-rose-200";
//       case "Invoiced":
//         return "bg-violet-50 text-violet-700 border-violet-200";
//       case "Payment Received":
//         return "bg-green-50 text-green-700 border-green-200";
//       default:
//         return "bg-slate-50 text-slate-700 border-slate-200";
//     }
//   };

//   const uniqueProjectOwners = useMemo(() => {
//     return Array.from(
//       new Set(
//         allRecords
//           .map((record) => record.salesPersonName)
//           .filter((name): name is string => !!name),
//       ),
//     );
//   }, [allRecords]);

//   const statusCounts = useMemo(() => {
//     const counts: Record<string, number> = {
//       All: allRecords.length,
//     };

//     STATUS_OPTIONS.forEach((status) => {
//       counts[status] = allRecords.filter(
//         (record) => record.projectStatus === status,
//       ).length;
//     });

//     return counts;
//   }, [allRecords]);

//   const filteredRecords = useMemo(() => {
//     return allRecords.filter((record) => {
//       const search = searchTerm.toLowerCase();

//       const matchesSearch =
//         (record.client || "").toLowerCase().includes(search) ||
//         (record.projectName || "").toLowerCase().includes(search) ||
//         (record.projectCode || "").toLowerCase().includes(search) ||
//         (record.salesPersonName || "").toLowerCase().includes(search);

//       const matchesStatus =
//         statusFilter === "All" || record.projectStatus === statusFilter;

//       const matchesProjectOwner =
//         projectOwnerFilter === "All" ||
//         record.salesPersonName === projectOwnerFilter;

//       return matchesSearch && matchesStatus && matchesProjectOwner;
//     });
//   }, [allRecords, searchTerm, statusFilter, projectOwnerFilter]);

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [searchTerm, statusFilter, projectOwnerFilter]);

//   const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));

//   const paginationItems = useMemo(() => {
//     const pages: (number | string)[] = [];

//     if (totalPages <= 5) {
//       for (let page = 1; page <= totalPages; page++) {
//         pages.push(page);
//       }
//       return pages;
//     }

//     pages.push(1);

//     if (currentPage > 3) {
//       pages.push("left-ellipsis");
//     }

//     const startPage = Math.max(2, currentPage - 1);
//     const endPage = Math.min(totalPages - 1, currentPage + 1);

//     for (let page = startPage; page <= endPage; page++) {
//       pages.push(page);
//     }

//     if (currentPage < totalPages - 2) {
//       pages.push("right-ellipsis");
//     }

//     pages.push(totalPages);

//     return pages;
//   }, [currentPage, totalPages]);

//   const paginatedRecords = useMemo(() => {
//     const startIndex = (currentPage - 1) * PAGE_SIZE;
//     return filteredRecords.slice(startIndex, startIndex + PAGE_SIZE);
//   }, [filteredRecords, currentPage]);

//   const showingStart =
//     filteredRecords.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;

//   const showingEnd = Math.min(currentPage * PAGE_SIZE, filteredRecords.length);

//   const totalRecords = allRecords.length;

//   const totalValue = allRecords.reduce(
//     (sum, record) => sum + (Number(record.projectedValue) || 0),
//     0,
//   );

//   const wonRecords = allRecords.filter(
//     (record) => record.projectStatus === "Won",
//   );

//   const wonCount = wonRecords.length;

//   const wonValue = wonRecords.reduce(
//     (sum, record) => sum + (Number(record.projectedValue) || 0),
//     0,
//   );

//   const handleViewDetails = (record: SalesRecord) => {
//     setSelectedRecord(record);
//     setViewDetailModalOpen(true);
//   };

//   if (!userProfile || !ALLOWED_ROLES.includes(userProfile.role)) {
//     return (
//       <div className="flex min-h-screen items-center justify-center">
//         <div className="text-center">
//           <i className="fas fa-lock mb-4 text-4xl text-gray-400"></i>
//           <p className="text-gray-500">
//             Access denied. Only admins can view sales management.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   if (loading) {
//     return (
//       <div className="flex min-h-screen items-center justify-center">
//         <div className="text-center">
//           <i className="fas fa-spinner fa-spin mb-4 text-4xl text-gray-400"></i>
//           <p className="text-gray-500">Loading sales records...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6 p-1">
//       {/* Header */}
//       <div className="flex flex-col gap-2">
//         <h1 className="text-3xl font-bold tracking-tight text-slate-900">
//           Pipeline Management
//         </h1>
//         <p className="text-sm text-slate-500">
//           View and manage all sales records across the team.
//         </p>
//       </div>

//       {/* Top Filter Pills Bar */}
//       <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
//         <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
//           <div className="flex flex-wrap items-center gap-2">
//             <button
//               type="button"
//               onClick={() => setStatusFilter("All")}
//               className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
//                 statusFilter === "All"
//                   ? "bg-orange-500 text-white shadow-sm"
//                   : "bg-slate-100 text-slate-700 hover:bg-slate-200"
//               }`}
//             >
//               <span>All</span>
//               <span
//                 className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-xs ${
//                   statusFilter === "All"
//                     ? "bg-white/20 text-white"
//                     : "bg-white text-slate-500"
//                 }`}
//               >
//                 {statusCounts.All}
//               </span>
//             </button>

//             {STATUS_OPTIONS.map((status) => {
//               const active = statusFilter === status;

//               return (
//                 <button
//                   key={status}
//                   type="button"
//                   onClick={() => setStatusFilter(status)}
//                   className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
//                     active
//                       ? "bg-orange-500 text-white shadow-sm"
//                       : "bg-slate-100 text-slate-700 hover:bg-slate-200"
//                   }`}
//                 >
//                   <span>{status}</span>
//                   <span
//                     className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-xs ${
//                       active
//                         ? "bg-white/20 text-white"
//                         : "bg-white text-slate-500"
//                     }`}
//                   >
//                     {statusCounts[status]}
//                   </span>
//                 </button>
//               );
//             })}
//           </div>

//           <div className="flex items-center gap-3 xl:min-w-[280px]">
//             <div className="hidden h-8 w-px bg-slate-200 xl:block" />

//             <Select
//               value={projectOwnerFilter}
//               onValueChange={setProjectOwnerFilter}
//             >
//               <SelectTrigger
//                 data-testid="select-salesperson-filter"
//                 className="h-11 rounded-full border-slate-200 bg-slate-50 text-slate-700 shadow-none xl:min-w-[220px]"
//               >
//                 <SelectValue placeholder="All Project Owners" />
//               </SelectTrigger>

//               <SelectContent>
//                 <SelectItem value="All">All Project Owners</SelectItem>
//                 {uniqueProjectOwners.map((person) => (
//                   <SelectItem key={person} value={person}>
//                     {person}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>
//         </div>
//       </div>

//       {/* Search Row */}
//       <Card className="rounded-[24px] border-slate-200 shadow-sm">
//         <CardContent className="p-4">
//           <div className="flex flex-col gap-3 md:flex-row">
//             <div className="relative flex-1">
//               <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
//               <Input
//                 placeholder="Search by client, project, code, or project owner..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 data-testid="input-search-sales"
//                 className="h-11 rounded-full border-slate-200 bg-slate-50 pl-10 shadow-none"
//               />
//             </div>

//             <Button
//               type="button"
//               variant="outline"
//               onClick={() => {
//                 setSearchTerm("");
//                 setStatusFilter("All");
//                 setProjectOwnerFilter("All");
//               }}
//               className="h-11 rounded-full border-slate-200 px-5 text-slate-700"
//             >
//               Reset Filters
//             </Button>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
//         <Card className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
//           <CardContent className="p-0">
//             <div className="h-1 w-full bg-sky-500" />
//             <div className="p-5">
//               <div className="mb-4 flex items-start justify-between">
//                 <div className="space-y-1">
//                   <p className="text-sm font-medium text-slate-500">
//                     Total Records
//                   </p>
//                   <p
//                     className="text-3xl font-bold tracking-tight text-slate-900"
//                     data-testid="text-total-sales-records"
//                   >
//                     {totalRecords}
//                   </p>
//                 </div>

//                 <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50">
//                   <i className="fas fa-layer-group text-lg text-sky-600" />
//                 </div>
//               </div>

//               <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
//                 Total number of sales records available
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
//           <CardContent className="p-0">
//             <div className="h-1 w-full bg-emerald-500" />
//             <div className="p-5">
//               <div className="mb-4 flex items-start justify-between">
//                 <div className="space-y-1">
//                   <p className="text-sm font-medium text-slate-500">
//                     Total Value
//                   </p>
//                   <p
//                     className="text-3xl font-bold tracking-tight text-slate-900"
//                     data-testid="text-total-sales-value"
//                   >
//                     {formatCurrency(totalValue)}
//                   </p>
//                 </div>

//                 <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
//                   <i className="fas fa-wallet text-lg text-emerald-600" />
//                 </div>
//               </div>

//               <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
//                 Combined projected value of all projects
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
//           <CardContent className="p-0">
//             <div className="h-1 w-full bg-amber-500" />
//             <div className="p-5">
//               <div className="mb-4 flex items-start justify-between">
//                 <div className="space-y-1">
//                   <p className="text-sm font-medium text-slate-500">
//                     Won Projects
//                   </p>
//                   <p
//                     className="text-3xl font-bold tracking-tight text-slate-900"
//                     data-testid="text-won-sales-count"
//                   >
//                     {wonCount}
//                   </p>
//                 </div>

//                 <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50">
//                   <i className="fas fa-trophy text-lg text-amber-600" />
//                 </div>
//               </div>

//               <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
//                 Projects currently marked as won
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
//           <CardContent className="p-0">
//             <div className="h-1 w-full bg-violet-500" />
//             <div className="p-5">
//               <div className="mb-4 flex items-start justify-between">
//                 <div className="space-y-1">
//                   <p className="text-sm font-medium text-slate-500">
//                     Won Value
//                   </p>
//                   <p
//                     className="text-3xl font-bold tracking-tight text-slate-900"
//                     data-testid="text-won-sales-value"
//                   >
//                     {formatCurrency(wonValue)}
//                   </p>
//                 </div>

//                 <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50">
//                   <i className="fas fa-award text-lg text-violet-600" />
//                 </div>
//               </div>

//               <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
//                 Total value of all won projects
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* All Sales Records - Card View */}
//       <Card className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
//         <CardHeader className="border-b border-slate-100 bg-white px-5 py-4">
//           <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
//             <div>
//               <CardTitle className="text-xl font-bold text-slate-900">
//                 All Sales Records
//               </CardTitle>
//               <p className="mt-1 text-sm text-slate-500">
//                 View project details, owner, value, status, and latest update.
//               </p>
//             </div>

//             <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
//               Showing{" "}
//               <span className="font-bold text-slate-900">{showingStart}</span>{" "}
//               to <span className="font-bold text-slate-900">{showingEnd}</span>{" "}
//               of{" "}
//               <span className="font-bold text-slate-900">
//                 {filteredRecords.length}
//               </span>{" "}
//               record(s)
//             </div>
//           </div>
//         </CardHeader>

//         <CardContent className="p-5">
//           {filteredRecords.length === 0 ? (
//             <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 text-center">
//               <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
//                 <i className="fas fa-folder-open text-xl text-slate-400" />
//               </div>

//               <h3 className="text-lg font-semibold text-slate-900">
//                 No records found
//               </h3>

//               <p className="mt-1 max-w-sm text-sm text-slate-500">
//                 {allRecords.length === 0
//                   ? "No sales records are available yet."
//                   : "No records match your current filters."}
//               </p>
//             </div>
//           ) : (
//             <>
//               <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
//                 {paginatedRecords.map((record) => {
//                   const ownerInitial =
//                     record.salesPersonName?.charAt(0)?.toUpperCase() || "U";

//                   return (
//                     <Card
//                       key={record.id}
//                       className="group rounded-[24px] border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
//                     >
//                       <CardContent className="p-5">
//                         <div className="flex items-start justify-between gap-3">
//                           <div className="flex items-center gap-3">
//                             <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
//                               {ownerInitial}
//                             </div>

//                             <div className="min-w-0">
//                               <p
//                                 className="truncate text-sm font-semibold text-slate-900"
//                                 data-testid={`text-sales-person-${record.id}`}
//                               >
//                                 {record.salesPersonName || "N/A"}
//                               </p>
//                               <p className="text-xs text-slate-500">
//                                 Project Owner
//                               </p>
//                             </div>
//                           </div>

//                           <Badge
//                             className={`rounded-full border px-3 py-1 text-xs font-medium shadow-none ${getStatusColor(
//                               record.projectStatus || "",
//                             )}`}
//                           >
//                             {record.projectStatus || "N/A"}
//                           </Badge>
//                         </div>

//                         <div className="mt-5">
//                           <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
//                             Project
//                           </p>

//                           <h3 className="mt-1 line-clamp-2 text-lg font-bold leading-snug text-slate-900">
//                             {record.projectName || "Untitled Project"}
//                           </h3>

//                           <div className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
//                             {record.projectCode || "No Project Code"}
//                           </div>
//                         </div>

//                         <div className="mt-5 grid grid-cols-2 gap-3">
//                           <div className="rounded-2xl bg-slate-50 p-3">
//                             <p className="text-xs text-slate-400">Client</p>
//                             <p
//                               className="mt-1 truncate text-sm font-semibold text-slate-900"
//                               data-testid={`text-client-admin-${record.id}`}
//                             >
//                               {record.client || "N/A"}
//                             </p>
//                           </div>

//                           <div className="rounded-2xl bg-slate-50 p-3">
//                             <p className="text-xs text-slate-400">Value</p>
//                             <p
//                               className="mt-1 truncate text-sm font-semibold text-slate-900"
//                               data-testid={`text-value-admin-${record.id}`}
//                             >
//                               {formatCurrency(
//                                 Number(record.projectedValue) || 0,
//                               )}
//                             </p>
//                           </div>
//                         </div>

//                         <div className="mt-4 space-y-2 rounded-2xl border border-slate-100 bg-white p-3">
//                           <div className="flex items-center gap-2 text-sm text-slate-600">
//                             <i className="fas fa-user text-xs text-slate-400" />
//                             <span className="truncate">
//                               {record.contactPerson || "No contact person"}
//                             </span>
//                           </div>

//                           <div className="flex items-center gap-2 text-sm text-slate-600">
//                             <i className="fas fa-clock text-xs text-slate-400" />
//                             <span>
//                               {record.updatedAt?.toLocaleDateString("en-GB", {
//                                 day: "numeric",
//                                 month: "short",
//                                 year: "numeric",
//                               }) || "N/A"}

//                               {record.updatedAt
//                                 ? `, ${record.updatedAt.toLocaleString([], {
//                                     hour: "2-digit",
//                                     minute: "2-digit",
//                                   })}`
//                                 : ""}
//                             </span>
//                           </div>
//                         </div>

//                         <Button
//                           onClick={() => handleViewDetails(record)}
//                           className="mt-5 h-11 w-full rounded-full bg-slate-900 text-white shadow-none transition-all hover:bg-slate-800"
//                         >
//                           View Details
//                         </Button>
//                       </CardContent>
//                     </Card>
//                   );
//                 })}
//               </div>

//               {/* Pagination */}
//               <div className="mt-6 flex flex-col gap-4 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
//                 <div className="text-sm text-slate-600">
//                   Showing{" "}
//                   <span className="font-semibold text-slate-900">
//                     {showingStart}
//                   </span>{" "}
//                   to{" "}
//                   <span className="font-semibold text-slate-900">
//                     {showingEnd}
//                   </span>{" "}
//                   of{" "}
//                   <span className="font-semibold text-slate-900">
//                     {filteredRecords.length}
//                   </span>{" "}
//                   records
//                 </div>

//                 <div className="flex flex-wrap items-center gap-2">
//                   <Button
//                     type="button"
//                     variant="outline"
//                     disabled={currentPage === 1}
//                     onClick={() =>
//                       setCurrentPage((page) => Math.max(page - 1, 1))
//                     }
//                     className="h-10 rounded-full border-slate-200 bg-white px-4 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
//                   >
//                     Previous
//                   </Button>

//                   <div className="flex items-center gap-1">
//                     {paginationItems.map((item) => {
//                       if (typeof item === "string") {
//                         return (
//                           <span
//                             key={item}
//                             className="flex h-10 min-w-10 items-center justify-center rounded-full px-2 text-sm font-semibold text-slate-400"
//                           >
//                             ...
//                           </span>
//                         );
//                       }

//                       const active = currentPage === item;

//                       return (
//                         <button
//                           key={item}
//                           type="button"
//                           onClick={() => setCurrentPage(item)}
//                           className={`flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition-all ${
//                             active
//                               ? "bg-orange-500 text-white shadow-sm"
//                               : "bg-white text-slate-600 hover:bg-slate-100"
//                           }`}
//                         >
//                           {item}
//                         </button>
//                       );
//                     })}
//                   </div>

//                   <Button
//                     type="button"
//                     variant="outline"
//                     disabled={currentPage === totalPages}
//                     onClick={() =>
//                       setCurrentPage((page) => Math.min(page + 1, totalPages))
//                     }
//                     className="h-10 rounded-full border-slate-200 bg-white px-4 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
//                   >
//                     Next
//                   </Button>
//                 </div>
//               </div>
//             </>
//           )}

//           {selectedRecord && (
//             <ViewDetailModal
//               isOpen={viewDetailModalOpen}
//               onClose={() => setViewDetailModalOpen(false)}
//               record={selectedRecord}
//             />
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

import { useState, useEffect, useMemo } from "react";
import { ViewDetailModal } from "@/components/ViewDetailModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  writeBatch,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { SalesRecord } from "@shared/schema";
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  FolderOpen,
  Layers,
  Loader2,
  Lock,
  MessageSquare,
  MessagesSquare,
  RotateCcw,
  Search,
  Trophy,
  Wallet,
  X,
} from "lucide-react";

const STATUS_OPTIONS = [
  "Lead",
  "Discussion",
  "Negotiation",
  "Won",
  "Lost",
  "Invoiced",
  "Payment Received",
] as const;

const PAGE_SIZE = 10;

const ALLOWED_ROLES = ["main_admin", "operational_admin", "financial_admin"];

type RecordCommentItem = {
  id: string;
  text: string;
  userName: string;
  userId: string;
  timestamp: unknown;
};
type CommentModalMessage = {
  type: "success" | "warning" | "error";
  text: string;
};

export function SalesManagement() {
  const { userProfile } = useAuth();

  const [allRecords, setAllRecords] = useState<SalesRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [projectOwnerFilter, setProjectOwnerFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewDetailModalOpen, setViewDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SalesRecord | null>(
    null,
  );
  const [savingRemarkRecordId, setSavingRemarkRecordId] = useState<
    string | null
  >(null);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedCommentRecord, setSelectedCommentRecord] =
    useState<SalesRecord | null>(null);
  const [newAdminRemark, setNewAdminRemark] = useState("");
  const [commentModalMessage, setCommentModalMessage] =
    useState<CommentModalMessage | null>(null);

  useEffect(() => {
    if (!userProfile) return;
    if (!ALLOWED_ROLES.includes(userProfile.role)) return;

    const q = query(
      collection(db, "Panels", "IEDGE-SYSTEM", "salesRecords"),
      orderBy("updatedAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const recordsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.(),
          updatedAt: doc.data().updatedAt?.toDate?.(),
        })) as SalesRecord[];

        setAllRecords(recordsData);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to fetch sales records:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [userProfile]);

  const formatCurrency = (value?: number | string) => {
    return `₨ ${(Number(value) || 0).toLocaleString()}`;
  };

  // Fluid columns so the list always fits the content area. Applied at xl
  // only; narrower screens render each record as a stacked card instead.
  const listGridClass =
    "xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_auto]";

  const getRecordField = (record: SalesRecord, keys: string[]) => {
    const data = record as unknown as Record<string, unknown>;

    for (const key of keys) {
      const value = data[key];

      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
      ) {
        return value;
      }
    }

    return undefined;
  };

  const toDate = (value: unknown) => {
    if (!value) return null;

    if (value instanceof Date) return value;

    if (typeof value === "string" || typeof value === "number") {
      const parsedDate = new Date(value);
      return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
    }

    if (typeof value === "object") {
      const timestampValue = value as {
        toDate?: () => Date;
        seconds?: number;
      };

      if (typeof timestampValue.toDate === "function") {
        return timestampValue.toDate();
      }

      if (typeof timestampValue.seconds === "number") {
        return new Date(timestampValue.seconds * 1000);
      }
    }

    return null;
  };

  const formatSmallDate = (value: unknown) => {
    const date = toDate(value);

    if (!date) return "N/A";

    return date
      .toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "2-digit",
      })
      .replace(" ", ", ");
  };

  const formatSmallTime = (value: unknown) => {
    const date = toDate(value);

    if (!date) return "";

    return date
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase();
  };

  const getTextFromValue = (value: unknown): string => {
    if (value === undefined || value === null) return "";

    if (Array.isArray(value)) {
      const lastValue = [...value].reverse().find(Boolean);
      return getTextFromValue(lastValue);
    }

    if (value instanceof Date) {
      return formatSmallDate(value);
    }

    if (typeof value === "object") {
      const data = value as Record<string, unknown>;

      const textValue =
        data.comment ||
        data.text ||
        data.message ||
        data.remark ||
        data.remarks ||
        data.title ||
        data.name;

      return getTextFromValue(textValue);
    }

    return String(value);
  };

  const getRecordText = (
    record: SalesRecord,
    keys: string[],
    fallback = "N/A",
  ) => {
    const value = getRecordField(record, keys);
    const text = getTextFromValue(value).trim();

    return text || fallback;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Lead":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "Discussion":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Negotiation":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "Won":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Lost":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Invoiced":
        return "bg-violet-50 text-violet-700 border-violet-200";
      case "Payment Received":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getInitials = (name: string) => {
    return (
      name
        .split(" ")
        .map((part) => part.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase() || "U"
    );
  };

  const getRecordCommentItems = (record: SalesRecord): RecordCommentItem[] => {
    const data = record as unknown as Record<string, unknown>;

    const rawComments = Array.isArray(data.comments) ? data.comments : [];

    const recordComments = rawComments
      .map((item, index): RecordCommentItem | null => {
        if (typeof item === "string") {
          return {
            id: `comment-${index}`,
            text: item,
            userName: "Unknown User",
            userId: "",
            timestamp: undefined,
          };
        }

        if (!item || typeof item !== "object") return null;

        const itemData = item as Record<string, unknown>;

        const text = getTextFromValue(
          itemData.text ||
            itemData.comment ||
            itemData.message ||
            itemData.remark,
        );

        if (!text.trim()) return null;

        return {
          id: `comment-${index}`,
          text,
          userName:
            getTextFromValue(
              itemData.userName ||
                itemData.createdByName ||
                itemData.authorName ||
                itemData.name,
            ) || "Unknown User",
          userId: getTextFromValue(
            itemData.userId || itemData.createdById || itemData.authorId,
          ),
          timestamp:
            itemData.timestamp ||
            itemData.createdAt ||
            itemData.updatedAt ||
            itemData.date,
        };
      })
      .filter((item): item is RecordCommentItem => item !== null);

    return recordComments.sort((a, b) => {
      const firstDate = toDate(a.timestamp)?.getTime() || 0;
      const secondDate = toDate(b.timestamp)?.getTime() || 0;

      return firstDate - secondDate;
    });
  };

  const getLatestRecordComment = (record: SalesRecord) => {
    const comments = getRecordCommentItems(record);
    return comments.length > 0 ? comments[comments.length - 1] : null;
  };

  const uniqueProjectOwners = useMemo(() => {
    return Array.from(
      new Set(
        allRecords
          .map((record) => record.salesPersonName)
          .filter((name): name is string => !!name),
      ),
    );
  }, [allRecords]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: allRecords.length,
    };

    STATUS_OPTIONS.forEach((status) => {
      counts[status] = allRecords.filter(
        (record) => record.projectStatus === status,
      ).length;
    });

    return counts;
  }, [allRecords]);

  const filteredRecords = useMemo(() => {
    return allRecords.filter((record) => {
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        (record.client || "").toLowerCase().includes(search) ||
        (record.projectName || "").toLowerCase().includes(search) ||
        (record.projectCode || "").toLowerCase().includes(search) ||
        (record.salesPersonName || "").toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" || record.projectStatus === statusFilter;

      const matchesProjectOwner =
        projectOwnerFilter === "All" ||
        record.salesPersonName === projectOwnerFilter;

      return matchesSearch && matchesStatus && matchesProjectOwner;
    });
  }, [allRecords, searchTerm, statusFilter, projectOwnerFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, projectOwnerFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));

  const paginationItems = useMemo(() => {
    const pages: (number | string)[] = [];

    if (totalPages <= 5) {
      for (let page = 1; page <= totalPages; page++) {
        pages.push(page);
      }

      return pages;
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push("left-ellipsis");
    }

    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let page = startPage; page <= endPage; page++) {
      pages.push(page);
    }

    if (currentPage < totalPages - 2) {
      pages.push("right-ellipsis");
    }

    pages.push(totalPages);

    return pages;
  }, [currentPage, totalPages]);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredRecords.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredRecords, currentPage]);

  const showingStart =
    filteredRecords.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;

  const showingEnd = Math.min(currentPage * PAGE_SIZE, filteredRecords.length);

  const totalRecords = allRecords.length;

  const totalValue = allRecords.reduce(
    (sum, record) => sum + (Number(record.projectedValue) || 0),
    0,
  );

  const wonRecords = allRecords.filter(
    (record) => record.projectStatus === "Won",
  );

  const wonCount = wonRecords.length;

  const wonValue = wonRecords.reduce(
    (sum, record) => sum + (Number(record.projectedValue) || 0),
    0,
  );

  const handleViewDetails = (record: SalesRecord) => {
    setSelectedRecord(record);
    setViewDetailModalOpen(true);
  };

  const openProjectCommentsModal = (record: SalesRecord) => {
    setSelectedCommentRecord(record);
    setNewAdminRemark("");
    setCommentModalMessage(null);
    setCommentModalOpen(true);
  };

  const closeProjectCommentsModal = () => {
    setCommentModalOpen(false);
    setSelectedCommentRecord(null);
    setNewAdminRemark("");
    setCommentModalMessage(null);
  };

  const handleAddAdminRemark = async () => {
    if (!selectedCommentRecord) return;

    const record = selectedCommentRecord;
    const trimmedRemark = newAdminRemark.trim();

    if (!trimmedRemark) return;

    const ownerId = getRecordText(
      record,
      [
        "salesPersonId",
        "salesPersonUid",
        "salesPersonUID",
        "projectOwnerId",
        "projectOwnerUid",
        "ownerId",
        "ownerUid",
        "assignedToId",
        "assignedToUid",
        "userId",
      ],
      "",
    );

    const ownerEmail = getRecordText(
      record,
      [
        "salesPersonEmail",
        "projectOwnerEmail",
        "ownerEmail",
        "assignedToEmail",
        "userEmail",
      ],
      "",
    );

    const profileData = userProfile as unknown as Record<string, unknown>;

    const adminName =
      getTextFromValue(
        profileData.displayName ||
          profileData.name ||
          profileData.fullName ||
          profileData.email,
      ) || "Admin";

    const adminId =
      getTextFromValue(
        profileData.uid || profileData.id || profileData.userId,
      ) || "";

    setSavingRemarkRecordId(String(record.id));
    setCommentModalMessage(null);

    try {
      const salesRecordRef = doc(
        db,
        "Panels",
        "IEDGE-SYSTEM",
        "salesRecords",
        String(record.id),
      );

      const notificationRef = doc(
        collection(db, "Panels", "IEDGE-SYSTEM", "notifications"),
      );

      const batch = writeBatch(db);

      const newComment = {
        text: trimmedRemark,
        timestamp: new Date().toISOString(),
        userName: adminName,
        userId: adminId,
      };

      batch.update(salesRecordRef, {
        comments: arrayUnion(newComment),

        latestAdminRemark: trimmedRemark,
        latestAdminRemarkAt: serverTimestamp(),
        latestAdminRemarkById: adminId,
        latestAdminRemarkByName: adminName,

        updatedAt: serverTimestamp(),
      });

      if (ownerId || ownerEmail) {
        batch.set(notificationRef, {
          type: "comment",
          title: "New project comment",
          message: `${adminName} commented on Project ${
            record.projectName || record.projectCode || "your project"
          }: "${trimmedRemark.substring(0, 50)}${
            trimmedRemark.length > 50 ? "..." : ""
          }"`,
          comment: trimmedRemark,
          salesRecordId: record.id,
          recordId: record.id,
          projectCode: record.projectCode || "",
          projectName: record.projectName || "",
          recipientId: ownerId,
          recipientUserId: ownerId,
          toUserId: ownerId,
          userId: ownerId,
          recipientEmail: ownerEmail,
          recipientName: record.salesPersonName || "",
          createdById: adminId,
          createdByName: adminName,
          read: false,
          isRead: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();

      setSelectedCommentRecord((current) => {
        if (!current || current.id !== record.id) return current;

        const currentData = current as unknown as Record<string, unknown>;

        const existingComments = Array.isArray(currentData.comments)
          ? currentData.comments
          : [];

        return {
          ...current,
          comments: [...existingComments, newComment],
          latestAdminRemark: trimmedRemark,
          latestAdminRemarkAt: new Date(),
          latestAdminRemarkById: adminId,
          latestAdminRemarkByName: adminName,
        } as SalesRecord;
      });

      setAllRecords((currentRecords) =>
        currentRecords.map((currentRecord) => {
          if (currentRecord.id !== record.id) return currentRecord;

          const currentData = currentRecord as unknown as Record<
            string,
            unknown
          >;

          const existingComments = Array.isArray(currentData.comments)
            ? currentData.comments
            : [];

          return {
            ...currentRecord,
            comments: [...existingComments, newComment],
            latestAdminRemark: trimmedRemark,
            latestAdminRemarkAt: new Date(),
            latestAdminRemarkById: adminId,
            latestAdminRemarkByName: adminName,
            updatedAt: new Date(),
          } as SalesRecord;
        }),
      );

      setNewAdminRemark("");

      if (ownerId || ownerEmail) {
        setCommentModalMessage({
          type: "success",
          text: "Comment saved in Project Comments and notification sent successfully.",
        });
      } else {
        setCommentModalMessage({
          type: "warning",
          text: "Comment saved in Project Comments, but notification was not sent because this record has no owner ID or owner email.",
        });
      }
    } catch (error) {
      console.error("Failed to save project comment:", error);
      setCommentModalMessage({
        type: "error",
        text: "Failed to save comment. Please try again.",
      });
    } finally {
      setSavingRemarkRecordId(null);
    }
  };

  if (!userProfile || !ALLOWED_ROLES.includes(userProfile.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Lock className="mx-auto mb-4 h-10 w-10 text-gray-400" />
          <p className="text-gray-500">
            Access denied. Only admins can view sales management.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-gray-400" />
          <p className="text-gray-500">Loading sales records...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Records",
      value: String(totalRecords),
      caption: "Sales records across the team",
      icon: Layers,
      tone: "bg-sky-50 text-sky-600",
      testId: "text-total-sales-records",
    },
    {
      label: "Total Value",
      value: formatCurrency(totalValue),
      caption: "Combined projected value",
      icon: Wallet,
      tone: "bg-emerald-50 text-emerald-600",
      testId: "text-total-sales-value",
    },
    {
      label: "Won Projects",
      value: String(wonCount),
      caption: "Projects marked as won",
      icon: Trophy,
      tone: "bg-amber-50 text-amber-600",
      testId: "text-won-sales-count",
    },
    {
      label: "Won Value",
      value: formatCurrency(wonValue),
      caption: "Value of all won projects",
      icon: Award,
      tone: "bg-violet-50 text-violet-600",
      testId: "text-won-sales-value",
    },
  ];

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "All" ||
    projectOwnerFilter !== "All";

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1600px] space-y-6">
      {/* Header */}
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Pipeline Management
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          View and manage all sales records across the team.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="flex min-w-0 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.tone}`}
            >
              <stat.icon className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500">
                {stat.label}
              </p>
              <p
                className="text-2xl font-bold tracking-tight text-slate-900 [overflow-wrap:anywhere]"
                data-testid={stat.testId}
              >
                {stat.value}
              </p>
              <p className="text-xs text-slate-400">{stat.caption}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by client, project, code, or project owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-sales"
              className="h-11 rounded-full border-slate-200 bg-slate-50 pl-10 shadow-none"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Select
              value={projectOwnerFilter}
              onValueChange={setProjectOwnerFilter}
            >
              <SelectTrigger
                data-testid="select-salesperson-filter"
                className="h-11 w-full rounded-full border-slate-200 bg-slate-50 text-slate-700 shadow-none sm:flex-1 lg:w-[240px] lg:flex-none"
              >
                <SelectValue placeholder="All Project Owners" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="All">All Project Owners</SelectItem>
                {uniqueProjectOwners.map((person) => (
                  <SelectItem key={person} value={person}>
                    {person}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              disabled={!hasActiveFilters}
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("All");
                setProjectOwnerFilter("All");
              }}
              className="h-11 shrink-0 rounded-full border-slate-200 px-5 text-slate-700"
            >
              <RotateCcw className="mr-2 h-3.5 w-3.5" />
              Reset Filters
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          {(["All", ...STATUS_OPTIONS] as string[]).map((status) => {
            const active = statusFilter === status;

            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <span>{status}</span>
                <span
                  className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-white text-slate-500"
                  }`}
                >
                  {statusCounts[status] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* All Sales Records */}
      <Card className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-lg font-bold text-slate-900">
                All Sales Records
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Project details, owner, status, latest update and remarks.
              </p>
            </div>

            <span className="self-start rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 sm:self-auto">
              <span className="font-bold text-slate-900">
                {filteredRecords.length}
              </span>{" "}
              record(s)
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredRecords.length === 0 ? (
            <div className="m-5 flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                <FolderOpen className="h-6 w-6 text-slate-400" />
              </div>

              <h3 className="text-lg font-semibold text-slate-900">
                No records found
              </h3>

              <p className="mt-1 max-w-sm text-sm text-slate-500">
                {allRecords.length === 0
                  ? "No sales records are available yet."
                  : "No records match your current filters."}
              </p>
            </div>
          ) : (
            <>
              {/* Column headings: wide screens only. Below that each record
                  is a stacked card with its own labels. */}
              <div
                className={`hidden gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 xl:grid ${listGridClass}`}
              >
                <div>Project</div>
                <div>Client &amp; Owner</div>
                <div>Status &amp; Dates</div>
                <div>Last Comment</div>
                <div>Your Remark</div>
                <div className="w-[120px] text-center">Actions</div>
              </div>

              <div className="divide-y divide-slate-100">
                {paginatedRecords.map((record) => {
                  const latestRecordComment = getLatestRecordComment(record);

                  const nextFollowUpDate = getRecordField(record, [
                    "nextFollowUp",
                    "nextFollowUpDate",
                    "nextFollowUpAt",
                    "followUpDate",
                    "nextFollowup",
                  ]);

                  const lastCommentDate =
                    latestRecordComment?.timestamp ||
                    getRecordField(record, [
                      "lastCommentAt",
                      "lastCommentDate",
                      "latestCommentAt",
                      "commentDate",
                    ]) ||
                    record.updatedAt;

                  const remarkDate =
                    getRecordField(record, [
                      "latestAdminRemarkAt",
                      "yourRemarkAt",
                      "remarkAt",
                      "remarksAt",
                      "lastRemarkAt",
                      "adminRemarkAt",
                    ]) || record.updatedAt;

                  const lastCommentText =
                    latestRecordComment?.text ||
                    getRecordText(
                      record,
                      [
                        "lastComment",
                        "latestComment",
                        "comment",
                        "comments",
                        "lastCommentText",
                        "customerComment",
                      ],
                      "",
                    );

                  const remarkText = getRecordText(
                    record,
                    [
                      "latestAdminRemark",
                      "yourRemark",
                      "yourRemarks",
                      "remark",
                      "remarks",
                      "adminRemark",
                      "salesRemark",
                    ],
                    "",
                  );

                  const estimateText = getRecordText(
                    record,
                    [
                      "estimateNumber",
                      "estimateNo",
                      "estimateTitle",
                      "estimateName",
                      "estimate",
                    ],
                    "",
                  );

                  const estimateAmount = getRecordField(record, [
                    "estimateAmount",
                    "estimateValue",
                    "quotedAmount",
                    "estimateTotal",
                  ]);

                  const ownerName = record.salesPersonName || "N/A";
                  const statusClass = getStatusColor(
                    record.projectStatus || "",
                  );
                  const isSavingRemark =
                    savingRemarkRecordId === String(record.id);

                  const noteBlocks = [
                    {
                      label: "Last Comment",
                      text: lastCommentText.trim(),
                      empty: "No comment",
                      date: lastCommentDate,
                    },
                    {
                      label: "Your Remark",
                      text: remarkText.trim(),
                      empty: "No remark",
                      date: remarkDate,
                    },
                  ];

                  return (
                    <div
                      key={record.id}
                      className={`grid grid-cols-1 gap-4 px-5 py-5 transition-colors hover:bg-slate-50/70 sm:grid-cols-2 xl:items-start xl:py-4 ${listGridClass}`}
                    >
                      {/* Project */}
                      <div className="min-w-0 sm:col-span-2 xl:col-span-1">
                        <div className="flex items-start justify-between gap-3">
                          <span className="inline-flex max-w-full rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600 [overflow-wrap:anywhere]">
                            {record.projectCode || "N/A"}
                          </span>

                          <span
                            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium xl:hidden ${statusClass}`}
                          >
                            {record.projectStatus || "N/A"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-semibold text-slate-900 [overflow-wrap:anywhere]">
                          {record.projectName || "Untitled Project"}
                        </p>

                        {estimateText && (
                          <p className="mt-1 text-xs font-medium text-slate-500 [overflow-wrap:anywhere]">
                            <FileText className="mr-1 inline h-3.5 w-3.5 align-[-2px] text-slate-400" />
                            {estimateText}
                            {estimateAmount
                              ? ` · ${formatCurrency(String(estimateAmount))}`
                              : ""}
                          </p>
                        )}
                      </div>

                      {/* Client & owner */}
                      <div className="min-w-0">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 xl:hidden">
                          Client &amp; Owner
                        </p>

                        <p
                          className="text-sm font-medium text-slate-800 [overflow-wrap:anywhere]"
                          data-testid={`text-client-admin-${record.id}`}
                        >
                          {record.client || "N/A"}
                        </p>

                        <div className="mt-2 flex min-w-0 items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-700">
                            {getInitials(ownerName)}
                          </span>
                          <span
                            className="truncate text-xs text-slate-600"
                            title={ownerName}
                            data-testid={`text-sales-person-${record.id}`}
                          >
                            {ownerName}
                          </span>
                        </div>
                      </div>

                      {/* Status & dates */}
                      <div className="min-w-0">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 xl:hidden">
                          Dates
                        </p>

                        <span
                          className={`mb-2 hidden rounded-full border px-2.5 py-0.5 text-xs font-medium xl:inline-flex ${statusClass}`}
                        >
                          {record.projectStatus || "N/A"}
                        </span>

                        <dl className="space-y-1 text-xs">
                          <div className="flex flex-wrap gap-x-1.5">
                            <dt className="text-slate-400">Follow-up:</dt>
                            <dd className="font-medium text-slate-700">
                              {formatSmallDate(nextFollowUpDate)}
                            </dd>
                          </div>
                          <div className="flex flex-wrap gap-x-1.5">
                            <dt className="text-slate-400">Updated:</dt>
                            <dd className="font-medium text-slate-700">
                              {formatSmallDate(record.updatedAt)}{" "}
                              <span className="font-normal text-slate-500">
                                {formatSmallTime(record.updatedAt)}
                              </span>
                            </dd>
                          </div>
                        </dl>
                      </div>

                      {/* Last comment & your remark */}
                      {noteBlocks.map((note) => (
                        <div
                          key={note.label}
                          className="min-w-0 rounded-xl bg-slate-50 px-3 py-2.5"
                        >
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 xl:hidden">
                            {note.label}
                          </p>

                          <p
                            className={`line-clamp-3 text-xs leading-relaxed [overflow-wrap:anywhere] ${
                              note.text
                                ? "text-slate-700"
                                : "italic text-slate-400"
                            }`}
                            title={note.text || undefined}
                          >
                            {note.text || note.empty}
                          </p>

                          {note.text && (
                            <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                              {formatSmallTime(note.date)}{" "}
                              {formatSmallDate(note.date)}
                            </p>
                          )}
                        </div>
                      ))}

                      {/* Actions */}
                      <div className="flex gap-2 sm:col-span-2 xl:col-span-1 xl:w-[120px] xl:flex-col">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleViewDetails(record)}
                          className="h-9 flex-1 rounded-full border-slate-300 px-3 text-xs font-medium xl:flex-none"
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          View Detail
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          disabled={isSavingRemark}
                          onClick={() => openProjectCommentsModal(record)}
                          className="h-9 flex-1 rounded-full border-orange-200 bg-orange-50 px-3 text-xs font-medium text-orange-700 hover:bg-orange-100 hover:text-orange-800 xl:flex-none"
                        >
                          <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                          {isSavingRemark ? "Saving..." : "Comment"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-600">
                  Showing{" "}
                  <span className="font-semibold text-slate-900">
                    {showingStart}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-slate-900">
                    {showingEnd}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-900">
                    {filteredRecords.length}
                  </span>{" "}
                  records
                </div>

                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((page) => Math.max(page - 1, 1))
                    }
                    className="h-9 rounded-full border-slate-200 bg-white px-4 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>

                  <span className="text-sm font-medium text-slate-600 sm:hidden">
                    Page {currentPage} of {totalPages}
                  </span>

                  <div className="hidden items-center gap-1 sm:flex">
                    {paginationItems.map((item) => {
                      if (typeof item === "string") {
                        return (
                          <span
                            key={item}
                            className="flex h-9 min-w-9 items-center justify-center px-1 text-sm font-semibold text-slate-400"
                          >
                            ...
                          </span>
                        );
                      }

                      const active = currentPage === item;

                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setCurrentPage(item)}
                          className={`flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors ${
                            active
                              ? "bg-orange-500 text-white shadow-sm"
                              : "bg-white text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((page) => Math.min(page + 1, totalPages))
                    }
                    className="h-9 rounded-full border-slate-200 bg-white px-4 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {commentModalOpen &&
        selectedCommentRecord &&
        (() => {
          const recordComments = getRecordCommentItems(selectedCommentRecord);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
              <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-slate-950">
                      Project Comments
                    </h2>

                    <p className="mt-1 text-sm text-slate-500 [overflow-wrap:anywhere]">
                      {selectedCommentRecord.projectCode || "N/A"} —{" "}
                      {selectedCommentRecord.projectName || "Untitled Project"}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Project Owner:{" "}
                      {selectedCommentRecord.salesPersonName || "N/A"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeProjectCommentsModal}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                  {recordComments.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                        <MessagesSquare className="h-5 w-5 text-slate-400" />
                      </div>

                      <p className="font-semibold text-slate-800">
                        No project comments yet
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Add the first comment for this project.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recordComments.map((commentItem) => (
                        <div
                          key={commentItem.id}
                          className="rounded-3xl border border-slate-100 bg-slate-50 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
                              {getInitials(commentItem.userName)}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="font-semibold text-slate-900">
                                  {commentItem.userName}
                                </p>

                                {toDate(commentItem.timestamp) && (
                                  <p className="text-xs font-medium text-slate-500">
                                    {formatSmallTime(commentItem.timestamp)}{" "}
                                    {formatSmallDate(commentItem.timestamp)}
                                  </p>
                                )}
                              </div>

                              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 [overflow-wrap:anywhere]">
                                {commentItem.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 bg-white px-6 py-5">
                  {commentModalMessage && (
                    <div
                      className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
                        commentModalMessage.type === "success"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : commentModalMessage.type === "warning"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-rose-200 bg-rose-50 text-rose-700"
                      }`}
                    >
                      {commentModalMessage.text}
                    </div>
                  )}

                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    Add new comment
                  </label>

                  <textarea
                    value={newAdminRemark}
                    onChange={(event) => setNewAdminRemark(event.target.value)}
                    placeholder={`Write a comment for ${
                      selectedCommentRecord.salesPersonName || "project owner"
                    }...`}
                    rows={4}
                    className="w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />

                  <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closeProjectCommentsModal}
                      className="h-10 rounded-full border-slate-200 px-5"
                    >
                      Cancel
                    </Button>

                    <Button
                      type="button"
                      disabled={
                        !newAdminRemark.trim() ||
                        savingRemarkRecordId ===
                          String(selectedCommentRecord.id)
                      }
                      onClick={handleAddAdminRemark}
                      className="h-10 rounded-full bg-orange-500 px-5 text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingRemarkRecordId ===
                      String(selectedCommentRecord.id)
                        ? "Saving..."
                        : "Save Comment"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {selectedRecord && (
        <ViewDetailModal
          isOpen={viewDetailModalOpen}
          onClose={() => setViewDetailModalOpen(false)}
          record={selectedRecord}
        />
      )}
    </div>
  );
}
