// import { useMemo, useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { useAuth } from "@/contexts/AuthContext";
// import { SalesRecordModal } from "@/components/SalesRecordModal";
// import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import type { SalesRecord } from "@shared/schema";
// import { mapSalesRecordForBackwardCompatibility } from "@shared/schema";
// import {
//   Search,
//   SlidersHorizontal,
//   CalendarDays,
//   ChevronLeft,
//   ChevronRight,
//   Plus,
//   Pencil,
//   Eye,
//   Users,
//   Briefcase,
//   CheckCircle2,
//   Clock3,
//   Bookmark,
//   MessageSquare,
//   FileText,
//   UserRound,
// } from "lucide-react";

// type SalesAccessPermissions = {
//   canViewRecord: boolean;
//   canEditRecord: boolean;
//   canManageMeetings: boolean;
//   canCreateEstimate: boolean;
//   canComment: boolean;
//   isOwner: boolean;
//   isSupervisor: boolean;
//   isCustodian: boolean;
//   isAssignedAdmin: boolean;
// };

// type ProjectStatus =
//   | "Lead"
//   | "Discussion"
//   | "Negotiation"
//   | "Won"
//   | "Lost"
//   | "Invoiced"
//   | "Payment Received";

// type StatusFilter = "All" | ProjectStatus;

// type SortOption = "newest" | "oldest" | "highestValue" | "lowestValue";

// const PANEL_ID = "IEDGE-SYSTEM";
// const PAGE_SIZE = 9;

// const STATUS_OPTIONS: StatusFilter[] = [
//   "All",
//   "Lead",
//   "Discussion",
//   "Negotiation",
//   "Won",
//   "Lost",
//   "Invoiced",
//   "Payment Received",
// ];

// function normalizeStringArray(value: unknown): string[] {
//   if (!Array.isArray(value)) return [];

//   return value.map((item) => String(item || "").trim()).filter(Boolean);
// }

// function normalizeRole(value: unknown) {
//   return String(value || "")
//     .trim()
//     .toLowerCase();
// }

// function toNumber(value: unknown) {
//   const parsed = Number(value || 0);
//   return Number.isFinite(parsed) ? parsed : 0;
// }

// function formatCurrency(value: unknown) {
//   return `₨ ${Math.round(toNumber(value)).toLocaleString()}`;
// }

// function getDateFromValue(value: any): Date | null {
//   if (!value) return null;

//   if (typeof value?.toDate === "function") {
//     return value.toDate();
//   }

//   if (typeof value?.seconds === "number") {
//     return new Date(value.seconds * 1000);
//   }

//   const parsed = new Date(value);
//   return Number.isNaN(parsed.getTime()) ? null : parsed;
// }

// function formatDate(value: any) {
//   const date = getDateFromValue(value);

//   if (!date) return "No date";

//   return date.toLocaleDateString("en-GB", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// }

// function getRecordDate(record: any) {
//   return (
//     record?.deadline ||
//     record?.eventDate ||
//     record?.projectDate ||
//     record?.followUpDate ||
//     record?.updatedAt ||
//     record?.createdAt
//   );
// }

// function getRecordTimestamp(record: any) {
//   const date = getDateFromValue(
//     record?.updatedAt ||
//       record?.createdAt ||
//       record?.deadline ||
//       record?.eventDate ||
//       record?.projectDate,
//   );

//   return date ? date.getTime() : 0;
// }

// function getProjectOwnerName(record: any) {
//   return String(
//     record?.salesPersonName ||
//       record?.projectOwnerName ||
//       record?.ownerName ||
//       record?.createdByName ||
//       "",
//   ).trim();
// }

// function getProjectStatus(record: any): ProjectStatus {
//   const rawStatus = String(
//     record?.projectStatus ||
//       record?.status ||
//       record?.currentStatus ||
//       record?.pipelineStatus ||
//       record?.salesStatus ||
//       "",
//   )
//     .trim()
//     .toLowerCase();

//   const paymentStatus = String(record?.paymentStatus || "")
//     .trim()
//     .toLowerCase();

//   if (
//     rawStatus.includes("payment received") ||
//     rawStatus.includes("paid") ||
//     paymentStatus.includes("paid") ||
//     paymentStatus.includes("received")
//   ) {
//     return "Payment Received";
//   }

//   if (
//     rawStatus.includes("invoice") ||
//     rawStatus.includes("invoiced") ||
//     record?.invoiceNo ||
//     record?.invoiceNumber
//   ) {
//     return "Invoiced";
//   }

//   if (
//     rawStatus.includes("lost") ||
//     rawStatus.includes("rejected") ||
//     rawStatus.includes("cancelled") ||
//     rawStatus.includes("canceled")
//   ) {
//     return "Lost";
//   }

//   if (
//     rawStatus.includes("won") ||
//     rawStatus.includes("approved") ||
//     rawStatus.includes("complete") ||
//     rawStatus.includes("completed") ||
//     rawStatus.includes("closed") ||
//     toNumber(record?.wonValue) > 0
//   ) {
//     return "Won";
//   }

//   if (
//     rawStatus.includes("negotiation") ||
//     rawStatus.includes("review") ||
//     rawStatus.includes("pending") ||
//     rawStatus.includes("approval")
//   ) {
//     return "Negotiation";
//   }

//   if (
//     rawStatus.includes("discussion") ||
//     rawStatus.includes("progress") ||
//     rawStatus.includes("active") ||
//     rawStatus.includes("working") ||
//     rawStatus.includes("ongoing")
//   ) {
//     return "Discussion";
//   }

//   return "Lead";
// }

// function getStatusClasses(status: ProjectStatus) {
//   switch (status) {
//     case "Payment Received":
//       return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
//     case "Invoiced":
//       return "bg-blue-50 text-blue-700 ring-1 ring-blue-100";
//     case "Won":
//       return "bg-green-50 text-green-700 ring-1 ring-green-100";
//     case "Lost":
//       return "bg-rose-50 text-rose-700 ring-1 ring-rose-100";
//     case "Negotiation":
//       return "bg-orange-50 text-orange-700 ring-1 ring-orange-100";
//     case "Discussion":
//       return "bg-teal-50 text-teal-700 ring-1 ring-teal-100";
//     default:
//       return "bg-orange-50 text-orange-700 ring-1 ring-orange-100";
//   }
// }

// function getIconBoxClasses(status: ProjectStatus) {
//   switch (status) {
//     case "Payment Received":
//       return "bg-emerald-50 text-emerald-600";
//     case "Invoiced":
//       return "bg-blue-50 text-blue-600";
//     case "Won":
//       return "bg-green-50 text-green-600";
//     case "Lost":
//       return "bg-rose-50 text-rose-600";
//     case "Negotiation":
//       return "bg-orange-50 text-orange-600";
//     case "Discussion":
//       return "bg-teal-50 text-teal-600";
//     default:
//       return "bg-orange-50 text-orange-600";
//   }
// }

// function getSalesRecordPermissions(
//   record: any,
//   currentUserId: string,
// ): SalesAccessPermissions {
//   const projectCustodians = normalizeStringArray(record?.projectCustodians);
//   const supervisors = normalizeStringArray(record?.supervisors);
//   const adminParticipantIds = normalizeStringArray(record?.adminParticipantIds);

//   const canViewUserIds = normalizeStringArray(
//     record?.canViewUserIds?.length
//       ? record?.canViewUserIds
//       : record?.accessUserIds,
//   );

//   const canEditUserIds = normalizeStringArray(record?.canEditUserIds);

//   const canManageMeetingUserIds = normalizeStringArray(
//     record?.canManageMeetingUserIds?.length
//       ? record?.canManageMeetingUserIds
//       : canViewUserIds,
//   );

//   const canCreateEstimateUserIds = normalizeStringArray(
//     record?.canCreateEstimateUserIds?.length
//       ? record?.canCreateEstimateUserIds
//       : canEditUserIds,
//   );

//   const canCommentUserIds = normalizeStringArray(
//     record?.canCommentUserIds?.length
//       ? record?.canCommentUserIds
//       : canViewUserIds,
//   );

//   const isOwner = String(record?.salesPersonId || "") === currentUserId;
//   const isSupervisor = supervisors.includes(currentUserId);
//   const isCustodian = projectCustodians.includes(currentUserId);

//   const isAssignedAdmin =
//     String(record?.assignedAdminId || "") === currentUserId ||
//     adminParticipantIds.includes(currentUserId);

//   const canViewRecord =
//     isOwner ||
//     isSupervisor ||
//     isCustodian ||
//     isAssignedAdmin ||
//     canViewUserIds.includes(currentUserId);

//   const canEditRecord =
//     isOwner ||
//     isSupervisor ||
//     isAssignedAdmin ||
//     canEditUserIds.includes(currentUserId);

//   const canManageMeetings =
//     canViewRecord || canManageMeetingUserIds.includes(currentUserId);

//   const canCreateEstimate =
//     canEditRecord || canCreateEstimateUserIds.includes(currentUserId);

//   const canComment = canViewRecord || canCommentUserIds.includes(currentUserId);

//   return {
//     canViewRecord,
//     canEditRecord,
//     canManageMeetings,
//     canCreateEstimate,
//     canComment,
//     isOwner,
//     isSupervisor,
//     isCustodian,
//     isAssignedAdmin,
//   };
// }

// function getAccessLabel(permissions: SalesAccessPermissions) {
//   if (permissions.isOwner) return "Owner";
//   if (permissions.isSupervisor) return "Supervisor";
//   if (permissions.isCustodian) return "Custodian";
//   if (permissions.isAssignedAdmin) return "Admin";
//   return "Viewer";
// }

// function getInitials(value: unknown) {
//   const text = String(value || "Project").trim();

//   const words = text
//     .split(" ")
//     .map((word) => word.trim())
//     .filter(Boolean);

//   if (!words.length) return "PR";

//   if (words.length === 1) {
//     return words[0].slice(0, 2).toUpperCase();
//   }

//   return `${words[0][0]}${words[1][0]}`.toUpperCase();
// }

// function getProjectDescription(record: any) {
//   return (
//     record?.projectDescription ||
//     record?.description ||
//     record?.remarks ||
//     record?.notes ||
//     "No project description has been added yet."
//   );
// }

// export function Sales() {
//   const { userProfile, currentUser } = useAuth();

//   const [records, setRecords] = useState<SalesRecord[]>([]);
//   const [clients, setClients] = useState<any[]>([]);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingRecord, setEditingRecord] = useState<SalesRecord | undefined>();
//   const [loading, setLoading] = useState(true);

//   const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
//   const [projectOwnerFilter, setProjectOwnerFilter] = useState("All");
//   const [accessFilter, setAccessFilter] = useState("All");
//   const [sortBy, setSortBy] = useState<SortOption>("newest");
//   const [showFilters, setShowFilters] = useState(false);
//   const [currentPage, setCurrentPage] = useState(1);

//   const actorId = currentUser?.uid || userProfile?.id || "";

//   useEffect(() => {
//     const clientQuery = query(collection(db, "Panels", PANEL_ID, "clients"));

//     const unsubscribe = onSnapshot(clientQuery, (snapshot) => {
//       const clientsData = snapshot.docs.map((doc) => ({
//         id: doc.id,
//         ...doc.data(),
//       }));

//       setClients(clientsData);
//     });

//     return () => unsubscribe();
//   }, []);

//   useEffect(() => {
//     if (!userProfile || !actorId) return;

//     const salesRecordsQuery = query(
//       collection(db, "Panels", PANEL_ID, "salesRecords"),
//       orderBy("updatedAt", "desc"),
//     );

//     const unsubscribe = onSnapshot(
//       salesRecordsQuery,
//       (snapshot) => {
//         const mappedRecords = snapshot.docs.map((doc) => {
//           const rawData = { id: doc.id, ...doc.data() };
//           return mapSalesRecordForBackwardCompatibility(rawData);
//         }) as SalesRecord[];

//         const visibleRecords = mappedRecords.filter((record: any) => {
//           const permissions = getSalesRecordPermissions(record, actorId);
//           return permissions.canViewRecord;
//         });

//         setRecords(visibleRecords);
//         setLoading(false);
//       },
//       (error) => {
//         console.error("Failed to fetch sales records:", error);
//         setLoading(false);
//       },
//     );

//     return () => unsubscribe();
//   }, [userProfile, actorId]);

//   const permissionsByRecordId = useMemo(() => {
//     const nextMap: Record<string, SalesAccessPermissions> = {};

//     if (!actorId) return nextMap;

//     records.forEach((record: any) => {
//       nextMap[String(record.id)] = getSalesRecordPermissions(record, actorId);
//     });

//     return nextMap;
//   }, [records, actorId]);

//   const editingPermissions =
//     editingRecord && editingRecord.id
//       ? permissionsByRecordId[String(editingRecord.id)] ||
//         getSalesRecordPermissions(editingRecord, actorId)
//       : undefined;

//   const canCreateProject =
//     !!userProfile &&
//     (normalizeRole(userProfile.role) === "sales" ||
//       normalizeRole(userProfile.role).includes("admin"));

//   const statusCounts = useMemo(() => {
//     const counts: Record<ProjectStatus, number> = {
//       Lead: 0,
//       Discussion: 0,
//       Negotiation: 0,
//       Won: 0,
//       Lost: 0,
//       Invoiced: 0,
//       "Payment Received": 0,
//     };

//     records.forEach((record: any) => {
//       counts[getProjectStatus(record)] += 1;
//     });

//     return counts;
//   }, [records]);

//   const uniqueProjectOwners = useMemo(() => {
//     const owners = new Set<string>();

//     records.forEach((record: any) => {
//       const ownerName = getProjectOwnerName(record);
//       if (ownerName) owners.add(ownerName);
//     });

//     return Array.from(owners).sort((a, b) => a.localeCompare(b));
//   }, [records]);

//   const filteredRecords = useMemo(() => {
//     const search = searchTerm.trim().toLowerCase();

//     const nextRecords = records.filter((record: any) => {
//       const permissions =
//         permissionsByRecordId[String(record.id)] ||
//         getSalesRecordPermissions(record, actorId);

//       const status = getProjectStatus(record);
//       const accessLabel = getAccessLabel(permissions);
//       const projectOwnerName = getProjectOwnerName(record);

//       const searchableText = [
//         record?.client,
//         record?.projectName,
//         record?.projectCode,
//         projectOwnerName,
//         record?.salesPersonName,
//         record?.assignedAdminName,
//         status,
//         accessLabel,
//       ]
//         .join(" ")
//         .toLowerCase();

//       const matchesSearch = !search || searchableText.includes(search);
//       const matchesStatus = statusFilter === "All" || status === statusFilter;

//       const matchesProjectOwner =
//         projectOwnerFilter === "All" || projectOwnerName === projectOwnerFilter;

//       const matchesAccess =
//         accessFilter === "All" || accessLabel === accessFilter;

//       return (
//         matchesSearch && matchesStatus && matchesProjectOwner && matchesAccess
//       );
//     });

//     nextRecords.sort((a: any, b: any) => {
//       if (sortBy === "oldest") {
//         return getRecordTimestamp(a) - getRecordTimestamp(b);
//       }

//       if (sortBy === "highestValue") {
//         return toNumber(b?.projectedValue) - toNumber(a?.projectedValue);
//       }

//       if (sortBy === "lowestValue") {
//         return toNumber(a?.projectedValue) - toNumber(b?.projectedValue);
//       }

//       return getRecordTimestamp(b) - getRecordTimestamp(a);
//     });

//     return nextRecords;
//   }, [
//     records,
//     permissionsByRecordId,
//     actorId,
//     searchTerm,
//     statusFilter,
//     projectOwnerFilter,
//     accessFilter,
//     sortBy,
//   ]);

//   const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));

//   const paginatedRecords = useMemo(() => {
//     const start = (currentPage - 1) * PAGE_SIZE;
//     return filteredRecords.slice(start, start + PAGE_SIZE);
//   }, [filteredRecords, currentPage]);

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [searchTerm, statusFilter, projectOwnerFilter, accessFilter, sortBy]);

//   useEffect(() => {
//     if (currentPage > totalPages) {
//       setCurrentPage(totalPages);
//     }
//   }, [currentPage, totalPages]);

//   const handleAddRecord = () => {
//     setEditingRecord(undefined);
//     setIsModalOpen(true);
//   };

//   const handleEditRecord = (record: SalesRecord) => {
//     setEditingRecord(record);
//     setIsModalOpen(true);
//   };

//   const resetFilters = () => {
//     setSearchTerm("");
//     setStatusFilter("All");
//     setProjectOwnerFilter("All");
//     setAccessFilter("All");
//     setSortBy("newest");
//   };

//   if (loading) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-slate-50">
//         <div className="rounded-3xl border border-slate-200 bg-white px-10 py-8 text-center shadow-sm">
//           <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-orange-600" />
//           <p className="text-sm font-medium text-slate-600">
//             Loading sales records...
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-slate-50/70 px-4 py-6 sm:px-6 lg:px-8">
//       <div className="mx-auto space-y-6">
//         <div className="flex flex-col gap-5 rounded-[2rem] border border-white bg-white/80 p-5 shadow-sm backdrop-blur xl:flex-row xl:items-center xl:justify-between">
//           <div>
//             <h1 className="text-3xl font-bold tracking-tight text-slate-950">
//               All Projects
//             </h1>
//             <p className="mt-1 text-sm text-slate-500">
//               Track and manage your sales projects in one modern workspace.
//             </p>
//           </div>

//           <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
//             <div className="relative min-w-full sm:min-w-[320px]">
//               <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

//               <input
//                 value={searchTerm}
//                 onChange={(event) => setSearchTerm(event.target.value)}
//                 placeholder="Search projects..."
//                 className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
//               />
//             </div>

//             <button
//               type="button"
//               onClick={() => setShowFilters((value) => !value)}
//               className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50"
//             >
//               <SlidersHorizontal className="h-4 w-4" />
//               Filters
//               {(statusFilter !== "All" ||
//                 projectOwnerFilter !== "All" ||
//                 accessFilter !== "All") && (
//                 <span className="h-2 w-2 rounded-full bg-orange-600" />
//               )}
//             </button>

//             <div className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 shadow-sm">
//               <span className="text-sm font-medium text-slate-500">
//                 Sort by
//               </span>

//               <select
//                 value={sortBy}
//                 onChange={(event) =>
//                   setSortBy(event.target.value as SortOption)
//                 }
//                 className="bg-transparent text-sm font-semibold text-slate-800 outline-none"
//               >
//                 <option value="newest">Newest</option>
//                 <option value="oldest">Oldest</option>
//                 <option value="highestValue">Highest Value</option>
//                 <option value="lowestValue">Lowest Value</option>
//               </select>
//             </div>

//             {canCreateProject && (
//               <Button
//                 onClick={handleAddRecord}
//                 className="h-12 rounded-2xl bg-orange-600 px-5 font-semibold text-white shadow-sm hover:bg-orange-700"
//                 data-testid="button-add-record"
//               >
//                 <Plus className="mr-2 h-4 w-4" />
//                 Add Project
//               </Button>
//             )}
//           </div>
//         </div>

//         <SalesRecordModal
//           isOpen={isModalOpen}
//           onClose={() => setIsModalOpen(false)}
//           editingRecord={editingRecord}
//           clients={clients}
//           viewerPermissions={editingPermissions}
//         />

//         <div className="rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm">
//           <div className="flex flex-wrap items-center gap-2">
//             {STATUS_OPTIONS.map((status) => {
//               const isActive = statusFilter === status;
//               const count =
//                 status === "All" ? records.length : statusCounts[status];

//               return (
//                 <button
//                   key={status}
//                   type="button"
//                   onClick={() => setStatusFilter(status)}
//                   className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
//                     isActive
//                       ? "bg-orange-600 text-white shadow-sm"
//                       : "bg-slate-50 text-slate-600 hover:bg-slate-100"
//                   }`}
//                 >
//                   {status}

//                   <span
//                     className={`rounded-full px-2 py-0.5 text-xs ${
//                       isActive
//                         ? "bg-white/20 text-white"
//                         : "bg-white text-slate-500 ring-1 ring-slate-200"
//                     }`}
//                   >
//                     {count}
//                   </span>
//                 </button>
//               );
//             })}

//             <div className="mx-2 hidden h-7 w-px bg-slate-200 sm:block" />

//             <select
//               value={projectOwnerFilter}
//               onChange={(event) => setProjectOwnerFilter(event.target.value)}
//               className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
//             >
//               <option value="All">All Project Owners</option>

//               {uniqueProjectOwners.map((ownerName) => (
//                 <option key={ownerName} value={ownerName}>
//                   {ownerName}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>

//         {showFilters && (
//           <div className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
//             <div>
//               <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
//                 Project Owner
//               </label>

//               <select
//                 value={projectOwnerFilter}
//                 onChange={(event) => setProjectOwnerFilter(event.target.value)}
//                 className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
//               >
//                 <option value="All">All Project Owners</option>

//                 {uniqueProjectOwners.map((ownerName) => (
//                   <option key={ownerName} value={ownerName}>
//                     {ownerName}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
//                 Access
//               </label>

//               <select
//                 value={accessFilter}
//                 onChange={(event) => setAccessFilter(event.target.value)}
//                 className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
//               >
//                 <option value="All">All Access</option>
//                 <option value="Owner">Owner</option>
//                 <option value="Supervisor">Supervisor</option>
//                 <option value="Custodian">Custodian</option>
//                 <option value="Admin">Admin</option>
//                 <option value="Viewer">Viewer</option>
//               </select>
//             </div>

//             <div>
//               <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
//                 Status
//               </label>

//               <select
//                 value={statusFilter}
//                 onChange={(event) =>
//                   setStatusFilter(event.target.value as StatusFilter)
//                 }
//                 className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
//               >
//                 {STATUS_OPTIONS.map((status) => (
//                   <option key={status} value={status}>
//                     {status}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div className="flex items-end">
//               <button
//                 type="button"
//                 onClick={resetFilters}
//                 className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
//               >
//                 Reset Filters
//               </button>
//             </div>
//           </div>
//         )}

//         <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
//           <p className="text-sm text-slate-500">
//             Showing{" "}
//             <span className="font-semibold text-slate-900">
//               {paginatedRecords.length}
//             </span>{" "}
//             of{" "}
//             <span className="font-semibold text-slate-900">
//               {filteredRecords.length}
//             </span>{" "}
//             projects
//           </p>

//           <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
//             <button
//               type="button"
//               disabled={currentPage === 1}
//               onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
//               className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
//             >
//               <ChevronLeft className="h-4 w-4" />
//             </button>

//             <span className="px-3 text-sm font-semibold text-slate-700">
//               {currentPage} / {totalPages}
//             </span>

//             <button
//               type="button"
//               disabled={currentPage === totalPages}
//               onClick={() =>
//                 setCurrentPage((page) => Math.min(totalPages, page + 1))
//               }
//               className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
//             >
//               <ChevronRight className="h-4 w-4" />
//             </button>
//           </div>
//         </div>

//         {paginatedRecords.length > 0 ? (
//           <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
//             {paginatedRecords.map((record: any) => {
//               const permissions =
//                 permissionsByRecordId[String(record.id)] ||
//                 getSalesRecordPermissions(record, actorId);

//               const status = getProjectStatus(record);
//               const accessLabel = getAccessLabel(permissions);
//               const projectOwnerName =
//                 getProjectOwnerName(record) || "No owner";

//               const projectedValue = toNumber(record?.projectedValue);
//               const wonValue = toNumber(record?.wonValue);
//               const commission = projectedValue * 0.01;

//               const actionLabel = permissions.canEditRecord
//                 ? "Update"
//                 : permissions.canManageMeetings
//                   ? "Open"
//                   : "View";

//               return (
//                 <div
//                   key={record.id}
//                   className="group rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-slate-200/60"
//                 >
//                   <div className="mb-5 flex items-start justify-between gap-3">
//                     <span
//                       className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClasses(
//                         status,
//                       )}`}
//                     >
//                       {status}
//                     </span>

//                     <div className="flex items-center gap-2">
//                       <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
//                         {accessLabel}
//                       </span>

//                       {status === "Won" || status === "Payment Received" ? (
//                         <CheckCircle2 className="h-5 w-5 text-emerald-500" />
//                       ) : (
//                         <Bookmark className="h-5 w-5 text-slate-400" />
//                       )}
//                     </div>
//                   </div>

//                   <div className="flex gap-4">
//                     <div
//                       className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${getIconBoxClasses(
//                         status,
//                       )}`}
//                     >
//                       <Briefcase className="h-8 w-8" />
//                     </div>

//                     <div className="min-w-0 flex-1">
//                       <h3 className="line-clamp-1 text-lg font-bold text-slate-950">
//                         {record?.projectName || "Untitled Project"}
//                       </h3>

//                       <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
//                         {getProjectDescription(record)}
//                       </p>
//                     </div>
//                   </div>

//                   <div className="mt-5 flex flex-wrap gap-2">
//                     <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-100">
//                       <Users className="h-3.5 w-3.5" />
//                       {record?.client || "No client"}
//                     </span>

//                     <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-100">
//                       <UserRound className="h-3.5 w-3.5" />
//                       {projectOwnerName}
//                     </span>

//                     <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-100">
//                       <FileText className="h-3.5 w-3.5" />
//                       {record?.projectCode || "No code"}
//                     </span>

//                     <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-100">
//                       <CalendarDays className="h-3.5 w-3.5" />
//                       {formatDate(getRecordDate(record))}
//                     </span>
//                   </div>

//                   <div className="mt-5 grid grid-cols-2 gap-3">
//                     <div className="rounded-2xl bg-slate-50 p-3">
//                       <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
//                         <span className="text-sm font-bold">₨</span>
//                         Projected Value
//                       </div>

//                       <p className="mt-1 text-sm font-bold text-slate-900">
//                         {formatCurrency(projectedValue)}
//                       </p>
//                     </div>

//                     <div className="rounded-2xl bg-emerald-50 p-3">
//                       <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500">
//                         <span className="text-sm font-bold">₨</span>
//                         Commission
//                       </div>

//                       <p className="mt-1 text-sm font-bold text-emerald-700">
//                         {formatCurrency(commission)}
//                       </p>
//                     </div>
//                   </div>

//                   {wonValue > 0 && (
//                     <div className="mt-3 rounded-2xl bg-orange-50 p-3">
//                       <div className="flex items-center justify-between gap-3">
//                         <span className="text-xs font-semibold text-orange-500">
//                           Won Value
//                         </span>

//                         <span className="text-sm font-bold text-orange-700">
//                           {formatCurrency(wonValue)}
//                         </span>
//                       </div>
//                     </div>
//                   )}

//                   <div className="mt-5 border-t border-slate-100 pt-4">
//                     <div className="flex items-center justify-between gap-4">
//                       <div className="flex -space-x-2">
//                         <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-orange-100 text-xs font-bold text-orange-700">
//                           {getInitials(projectOwnerName)}
//                         </div>

//                         <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-teal-100 text-xs font-bold text-teal-700">
//                           {getInitials(
//                             record?.assignedAdminName || record?.projectName,
//                           )}
//                         </div>

//                         <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-violet-100 text-xs font-bold text-violet-700">
//                           +
//                           {
//                             normalizeStringArray(record?.projectCustodians)
//                               .length
//                           }
//                         </div>
//                       </div>

//                       <div className="flex items-center gap-4 text-slate-400">
//                         <span className="inline-flex items-center gap-1 text-xs font-semibold">
//                           <MessageSquare className="h-4 w-4" />
//                           {normalizeStringArray(record?.comments).length || 0}
//                         </span>

//                         <span className="inline-flex items-center gap-1 text-xs font-semibold">
//                           <Clock3 className="h-4 w-4" />
//                           {status}
//                         </span>
//                       </div>
//                     </div>
//                   </div>

//                   <Button
//                     onClick={() => handleEditRecord(record)}
//                     className={`mt-5 h-11 w-full rounded-2xl font-semibold ${
//                       permissions.canEditRecord
//                         ? "bg-orange-600 text-white hover:bg-orange-700"
//                         : "bg-slate-900 text-white hover:bg-slate-800"
//                     }`}
//                   >
//                     {permissions.canEditRecord ? (
//                       <Pencil className="mr-2 h-4 w-4" />
//                     ) : (
//                       <Eye className="mr-2 h-4 w-4" />
//                     )}

//                     {actionLabel}
//                   </Button>
//                 </div>
//               );
//             })}
//           </div>
//         ) : (
//           <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
//             <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
//               <Search className="h-8 w-8" />
//             </div>

//             <h3 className="mt-5 text-lg font-bold text-slate-900">
//               No projects found
//             </h3>

//             <p className="mt-2 text-sm text-slate-500">
//               Try changing your search, status, project owner, or access
//               filters.
//             </p>

//             <button
//               type="button"
//               onClick={resetFilters}
//               className="mt-5 rounded-2xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
//             >
//               Reset Filters
//             </button>
//           </div>
//         )}

//         {filteredRecords.length > PAGE_SIZE && (
//           <div className="flex items-center justify-center gap-2 pb-4">
//             <button
//               type="button"
//               disabled={currentPage === 1}
//               onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
//               className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
//             >
//               <ChevronLeft className="h-4 w-4" />
//             </button>

//             {Array.from({ length: totalPages }, (_, index) => index + 1)
//               .filter((page) => {
//                 return (
//                   page === 1 ||
//                   page === totalPages ||
//                   Math.abs(page - currentPage) <= 1
//                 );
//               })
//               .map((page, index, array) => {
//                 const previousPage = array[index - 1];
//                 const showDots = previousPage && page - previousPage > 1;

//                 return (
//                   <div key={page} className="flex items-center gap-2">
//                     {showDots && (
//                       <span className="px-1 text-sm font-semibold text-slate-400">
//                         ...
//                       </span>
//                     )}

//                     <button
//                       type="button"
//                       onClick={() => setCurrentPage(page)}
//                       className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-bold transition ${
//                         currentPage === page
//                           ? "bg-orange-600 text-white shadow-sm"
//                           : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
//                       }`}
//                     >
//                       {page}
//                     </button>
//                   </div>
//                 );
//               })}

//             <button
//               type="button"
//               disabled={currentPage === totalPages}
//               onClick={() =>
//                 setCurrentPage((page) => Math.min(totalPages, page + 1))
//               }
//               className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
//             >
//               <ChevronRight className="h-4 w-4" />
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { SalesRecordModal } from "@/components/SalesRecordModal";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { SalesRecord } from "@shared/schema";
import { mapSalesRecordForBackwardCompatibility } from "@shared/schema";
import {
  Search,
  SlidersHorizontal,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Eye,
  Users,
  Briefcase,
  CheckCircle2,
  Clock3,
  Bookmark,
  MessageSquare,
  FileText,
  UserRound,
} from "lucide-react";

type SalesAccessPermissions = {
  canViewRecord: boolean;
  canEditRecord: boolean;
  canManageMeetings: boolean;
  canCreateEstimate: boolean;
  canComment: boolean;
  isOwner: boolean;
  isSupervisor: boolean;
  isCustodian: boolean;
  isAssignedAdmin: boolean;
};

type ProjectStatus =
  | "Lead"
  | "Discussion"
  | "Negotiation"
  | "Won"
  | "Lost"
  | "Invoiced"
  | "Payment Received";

type StatusFilter = "All" | ProjectStatus;

type SortOption = "newest" | "oldest" | "highestValue" | "lowestValue";

const PANEL_ID = "IEDGE-SYSTEM";
const PAGE_SIZE = 9;

const STATUS_OPTIONS: StatusFilter[] = [
  "All",
  "Lead",
  "Discussion",
  "Negotiation",
  "Won",
  "Lost",
  "Invoiced",
  "Payment Received",
];

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function normalizeRole(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function toNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: unknown) {
  return `₨ ${Math.round(toNumber(value)).toLocaleString()}`;
}

function getDateFromValue(value: any): Date | null {
  if (!value) return null;

  if (typeof value?.toDate === "function") {
    return value.toDate();
  }

  if (typeof value?.seconds === "number") {
    return new Date(value.seconds * 1000);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value: any) {
  const date = getDateFromValue(value);

  if (!date) return "No date";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getRecordDate(record: any) {
  return (
    record?.deadline ||
    record?.eventDate ||
    record?.projectDate ||
    record?.followUpDate ||
    record?.updatedAt ||
    record?.createdAt
  );
}

function getRecordTimestamp(record: any) {
  const date = getDateFromValue(
    record?.updatedAt ||
      record?.createdAt ||
      record?.deadline ||
      record?.eventDate ||
      record?.projectDate,
  );

  return date ? date.getTime() : 0;
}

function getProjectOwnerName(record: any) {
  return String(
    record?.salesPersonName ||
      record?.projectOwnerName ||
      record?.ownerName ||
      record?.createdByName ||
      "",
  ).trim();
}

function getProjectStatus(record: any): ProjectStatus {
  const rawStatus = String(
    record?.projectStatus ||
      record?.status ||
      record?.currentStatus ||
      record?.pipelineStatus ||
      record?.salesStatus ||
      "",
  )
    .trim()
    .toLowerCase();

  const paymentStatus = String(record?.paymentStatus || "")
    .trim()
    .toLowerCase();

  if (
    rawStatus.includes("payment received") ||
    rawStatus.includes("paid") ||
    paymentStatus.includes("paid") ||
    paymentStatus.includes("received")
  ) {
    return "Payment Received";
  }

  if (
    rawStatus.includes("invoice") ||
    rawStatus.includes("invoiced") ||
    record?.invoiceNo ||
    record?.invoiceNumber
  ) {
    return "Invoiced";
  }

  if (
    rawStatus.includes("lost") ||
    rawStatus.includes("rejected") ||
    rawStatus.includes("cancelled") ||
    rawStatus.includes("canceled")
  ) {
    return "Lost";
  }

  if (
    rawStatus.includes("won") ||
    rawStatus.includes("approved") ||
    rawStatus.includes("complete") ||
    rawStatus.includes("completed") ||
    rawStatus.includes("closed") ||
    toNumber(record?.wonValue) > 0
  ) {
    return "Won";
  }

  if (
    rawStatus.includes("negotiation") ||
    rawStatus.includes("review") ||
    rawStatus.includes("pending") ||
    rawStatus.includes("approval")
  ) {
    return "Negotiation";
  }

  if (
    rawStatus.includes("discussion") ||
    rawStatus.includes("progress") ||
    rawStatus.includes("active") ||
    rawStatus.includes("working") ||
    rawStatus.includes("ongoing")
  ) {
    return "Discussion";
  }

  return "Lead";
}

function getStatusClasses(status: ProjectStatus) {
  switch (status) {
    case "Payment Received":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
    case "Invoiced":
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-100";
    case "Won":
      return "bg-green-50 text-green-700 ring-1 ring-green-100";
    case "Lost":
      return "bg-rose-50 text-rose-700 ring-1 ring-rose-100";
    case "Negotiation":
      return "bg-orange-50 text-orange-700 ring-1 ring-orange-100";
    case "Discussion":
      return "bg-teal-50 text-teal-700 ring-1 ring-teal-100";
    default:
      return "bg-orange-50 text-orange-700 ring-1 ring-orange-100";
  }
}

function getIconBoxClasses(status: ProjectStatus) {
  switch (status) {
    case "Payment Received":
      return "bg-emerald-50 text-emerald-600";
    case "Invoiced":
      return "bg-blue-50 text-blue-600";
    case "Won":
      return "bg-green-50 text-green-600";
    case "Lost":
      return "bg-rose-50 text-rose-600";
    case "Negotiation":
      return "bg-orange-50 text-orange-600";
    case "Discussion":
      return "bg-teal-50 text-teal-600";
    default:
      return "bg-orange-50 text-orange-600";
  }
}

function getSalesRecordPermissions(
  record: any,
  currentUserId: string,
): SalesAccessPermissions {
  const projectCustodians = normalizeStringArray(record?.projectCustodians);
  const supervisors = normalizeStringArray(record?.supervisors);
  const adminParticipantIds = normalizeStringArray(record?.adminParticipantIds);

  const canViewUserIds = normalizeStringArray(
    record?.canViewUserIds?.length
      ? record?.canViewUserIds
      : record?.accessUserIds,
  );

  const canEditUserIds = normalizeStringArray(record?.canEditUserIds);

  const canManageMeetingUserIds = normalizeStringArray(
    record?.canManageMeetingUserIds?.length
      ? record?.canManageMeetingUserIds
      : canViewUserIds,
  );

  const canCreateEstimateUserIds = normalizeStringArray(
    record?.canCreateEstimateUserIds?.length
      ? record?.canCreateEstimateUserIds
      : canEditUserIds,
  );

  const canCommentUserIds = normalizeStringArray(
    record?.canCommentUserIds?.length
      ? record?.canCommentUserIds
      : canViewUserIds,
  );

  const isOwner = String(record?.salesPersonId || "") === currentUserId;
  const isSupervisor = supervisors.includes(currentUserId);
  const isCustodian = projectCustodians.includes(currentUserId);

  const isAssignedAdmin =
    String(record?.assignedAdminId || "") === currentUserId ||
    adminParticipantIds.includes(currentUserId);

  const canViewRecord =
    isOwner ||
    isSupervisor ||
    isCustodian ||
    isAssignedAdmin ||
    canViewUserIds.includes(currentUserId);

  const canEditRecord =
    isOwner ||
    isSupervisor ||
    isAssignedAdmin ||
    canEditUserIds.includes(currentUserId);

  const canManageMeetings =
    canViewRecord || canManageMeetingUserIds.includes(currentUserId);

  const canCreateEstimate =
    canEditRecord || canCreateEstimateUserIds.includes(currentUserId);

  const canComment = canViewRecord || canCommentUserIds.includes(currentUserId);

  return {
    canViewRecord,
    canEditRecord,
    canManageMeetings,
    canCreateEstimate,
    canComment,
    isOwner,
    isSupervisor,
    isCustodian,
    isAssignedAdmin,
  };
}

function getAccessLabel(permissions: SalesAccessPermissions) {
  if (permissions.isOwner) return "Owner";
  if (permissions.isSupervisor) return "Supervisor";
  if (permissions.isCustodian) return "Custodian";
  if (permissions.isAssignedAdmin) return "Admin";
  return "Viewer";
}

function getInitials(value: unknown) {
  const text = String(value || "Project").trim();

  const words = text
    .split(" ")
    .map((word) => word.trim())
    .filter(Boolean);

  if (!words.length) return "PR";

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function getProjectDescription(record: any) {
  return (
    record?.projectDescription ||
    record?.description ||
    record?.remarks ||
    record?.notes ||
    "No project description has been added yet."
  );
}

export function Sales() {
  const { userProfile, currentUser } = useAuth();

  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SalesRecord | undefined>();
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [projectOwnerFilter, setProjectOwnerFilter] = useState("All");
  const [accessFilter, setAccessFilter] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const actorId = currentUser?.uid || userProfile?.id || "";

  useEffect(() => {
    const clientQuery = query(collection(db, "Panels", PANEL_ID, "clients"));

    const unsubscribe = onSnapshot(clientQuery, (snapshot) => {
      const clientsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setClients(clientsData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userProfile || !actorId) return;

    const salesRecordsQuery = query(
      collection(db, "Panels", PANEL_ID, "salesRecords"),
      orderBy("updatedAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      salesRecordsQuery,
      (snapshot) => {
        const mappedRecords = snapshot.docs.map((doc) => {
          const rawData = { id: doc.id, ...doc.data() };
          return mapSalesRecordForBackwardCompatibility(rawData);
        }) as SalesRecord[];

        const visibleRecords = mappedRecords.filter((record: any) => {
          const permissions = getSalesRecordPermissions(record, actorId);
          return permissions.canViewRecord;
        });

        setRecords(visibleRecords);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to fetch sales records:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [userProfile, actorId]);

  const permissionsByRecordId = useMemo(() => {
    const nextMap: Record<string, SalesAccessPermissions> = {};

    if (!actorId) return nextMap;

    records.forEach((record: any) => {
      nextMap[String(record.id)] = getSalesRecordPermissions(record, actorId);
    });

    return nextMap;
  }, [records, actorId]);

  const editingPermissions =
    editingRecord && editingRecord.id
      ? permissionsByRecordId[String(editingRecord.id)] ||
        getSalesRecordPermissions(editingRecord, actorId)
      : undefined;

  const canCreateProject =
    !!userProfile &&
    (normalizeRole(userProfile.role) === "sales" ||
      normalizeRole(userProfile.role).includes("admin"));

  const statusCounts = useMemo(() => {
    const counts: Record<ProjectStatus, number> = {
      Lead: 0,
      Discussion: 0,
      Negotiation: 0,
      Won: 0,
      Lost: 0,
      Invoiced: 0,
      "Payment Received": 0,
    };

    records.forEach((record: any) => {
      counts[getProjectStatus(record)] += 1;
    });

    return counts;
  }, [records]);

  const uniqueProjectOwners = useMemo(() => {
    const owners = new Set<string>();

    records.forEach((record: any) => {
      const ownerName = getProjectOwnerName(record);
      if (ownerName) owners.add(ownerName);
    });

    return Array.from(owners).sort((a, b) => a.localeCompare(b));
  }, [records]);

  const filteredRecords = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    const nextRecords = records.filter((record: any) => {
      const permissions =
        permissionsByRecordId[String(record.id)] ||
        getSalesRecordPermissions(record, actorId);

      const status = getProjectStatus(record);
      const accessLabel = getAccessLabel(permissions);
      const projectOwnerName = getProjectOwnerName(record);

      const searchableText = [
        record?.client,
        record?.projectName,
        record?.projectCode,
        projectOwnerName,
        record?.salesPersonName,
        record?.assignedAdminName,
        status,
        accessLabel,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !search || searchableText.includes(search);
      const matchesStatus = statusFilter === "All" || status === statusFilter;

      const matchesProjectOwner =
        projectOwnerFilter === "All" || projectOwnerName === projectOwnerFilter;

      const matchesAccess =
        accessFilter === "All" || accessLabel === accessFilter;

      return (
        matchesSearch && matchesStatus && matchesProjectOwner && matchesAccess
      );
    });

    nextRecords.sort((a: any, b: any) => {
      if (sortBy === "oldest") {
        return getRecordTimestamp(a) - getRecordTimestamp(b);
      }

      if (sortBy === "highestValue") {
        return toNumber(b?.projectedValue) - toNumber(a?.projectedValue);
      }

      if (sortBy === "lowestValue") {
        return toNumber(a?.projectedValue) - toNumber(b?.projectedValue);
      }

      return getRecordTimestamp(b) - getRecordTimestamp(a);
    });

    return nextRecords;
  }, [
    records,
    permissionsByRecordId,
    actorId,
    searchTerm,
    statusFilter,
    projectOwnerFilter,
    accessFilter,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, projectOwnerFilter, accessFilter, sortBy]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleAddRecord = () => {
    setEditingRecord(undefined);
    setIsModalOpen(true);
  };

  const handleEditRecord = (record: SalesRecord) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setProjectOwnerFilter("All");
    setAccessFilter("All");
    setSortBy("newest");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-3xl border border-slate-200 bg-white px-10 py-8 text-center shadow-sm">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-orange-600" />
          <p className="text-sm font-medium text-slate-600">
            Loading sales records...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto space-y-6">
        <div className="flex flex-col gap-5 rounded-[2rem] border border-white bg-white/80 p-5 shadow-sm backdrop-blur xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Your Projects
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Track and manage your sales projects in one modern workspace.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-full sm:min-w-[320px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search projects..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {(statusFilter !== "All" ||
                projectOwnerFilter !== "All" ||
                accessFilter !== "All") && (
                <span className="h-2 w-2 rounded-full bg-orange-600" />
              )}
            </button>

            <div className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 shadow-sm">
              <span className="text-sm font-medium text-slate-500">
                Sort by
              </span>

              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as SortOption)
                }
                className="bg-transparent text-sm font-semibold text-slate-800 outline-none"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="highestValue">Highest Value</option>
                <option value="lowestValue">Lowest Value</option>
              </select>
            </div>

            {canCreateProject && (
              <Button
                onClick={handleAddRecord}
                className="h-12 rounded-2xl bg-orange-600 px-5 font-semibold text-white shadow-sm hover:bg-orange-700"
                data-testid="button-add-record"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Project
              </Button>
            )}
          </div>
        </div>

        <SalesRecordModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          editingRecord={editingRecord}
          clients={clients}
          viewerPermissions={editingPermissions}
        />

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_OPTIONS.map((status) => {
              const isActive = statusFilter === status;
              const count =
                status === "All" ? records.length : statusCounts[status];

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-orange-600 text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {status}

                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-white text-slate-500 ring-1 ring-slate-200"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            <div className="mx-2 hidden h-7 w-px bg-slate-200 sm:block" />

            <select
              value={projectOwnerFilter}
              onChange={(event) => setProjectOwnerFilter(event.target.value)}
              className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
            >
              <option value="All">All Project Owners</option>

              {uniqueProjectOwners.map((ownerName) => (
                <option key={ownerName} value={ownerName}>
                  {ownerName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {showFilters && (
          <div className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
                Project Owner
              </label>

              <select
                value={projectOwnerFilter}
                onChange={(event) => setProjectOwnerFilter(event.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              >
                <option value="All">All Project Owners</option>

                {uniqueProjectOwners.map((ownerName) => (
                  <option key={ownerName} value={ownerName}>
                    {ownerName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
                Access
              </label>

              <select
                value={accessFilter}
                onChange={(event) => setAccessFilter(event.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              >
                <option value="All">All Access</option>
                <option value="Owner">Owner</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Custodian">Custodian</option>
                <option value="Admin">Admin</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-900">
              {paginatedRecords.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-900">
              {filteredRecords.length}
            </span>{" "}
            projects
          </p>

          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="px-3 text-sm font-semibold text-slate-700">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {paginatedRecords.length > 0 ? (
          <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
            <div className="min-w-[1500px]">
              <div className="grid grid-cols-[130px_280px_180px_170px_150px_150px_150px_160px_130px] border-b border-slate-200 bg-slate-50 px-4 py-3 text-[12px] font-bold text-slate-900">
                <div>Project Code</div>
                <div>Project</div>
                <div>Client</div>
                <div>Project Owner</div>
                <div>Projected Value</div>
                <div>Commission</div>
                <div>Last Update</div>
                <div>Status</div>
                <div className="text-center">Action</div>
              </div>

              <div className="divide-y divide-slate-100">
                {paginatedRecords.map((record: any) => {
                  const permissions =
                    permissionsByRecordId[String(record.id)] ||
                    getSalesRecordPermissions(record, actorId);

                  const status = getProjectStatus(record);
                  const accessLabel = getAccessLabel(permissions);
                  const projectOwnerName =
                    getProjectOwnerName(record) || "No owner";

                  const projectedValue = toNumber(record?.projectedValue);
                  const commission = projectedValue * 0.01;

                  const actionLabel = permissions.canEditRecord
                    ? "Update"
                    : permissions.canManageMeetings
                      ? "Open"
                      : "View";

                  return (
                    <div
                      key={record.id}
                      className="grid grid-cols-[130px_280px_180px_170px_150px_150px_150px_160px_130px] items-center px-4 py-3 text-[12px] text-slate-800 transition-colors hover:bg-slate-50"
                    >
                      <div className="pr-4 font-semibold text-slate-900">
                        {record?.projectCode || "No code"}
                      </div>

                      <div className="pr-4">
                        <p className="line-clamp-1 font-semibold text-slate-950">
                          {record?.projectName || "Untitled Project"}
                        </p>

                        <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
                          {getProjectDescription(record)}
                        </p>
                      </div>

                      <div className="pr-4">
                        <p className="line-clamp-1 font-medium">
                          {record?.client || "No client"}
                        </p>
                      </div>

                      <div className="pr-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-700">
                            {getInitials(projectOwnerName)}
                          </div>

                          <p className="line-clamp-1 font-medium">
                            {projectOwnerName}
                          </p>
                        </div>
                      </div>

                      <div className="pr-4 font-semibold text-slate-900">
                        {formatCurrency(projectedValue)}
                      </div>

                      <div className="pr-4 font-semibold text-emerald-700">
                        {formatCurrency(commission)}
                      </div>

                      <div className="pr-4 text-[11px] text-slate-600">
                        {formatDate(getRecordDate(record))}
                      </div>

                      <div className="pr-4">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${getStatusClasses(
                              status,
                            )}`}
                          >
                            {status}
                          </span>

                          <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">
                            {accessLabel}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <Button
                          onClick={() => handleEditRecord(record)}
                          className={`h-8 rounded-full px-3 text-[11px] font-semibold ${
                            permissions.canEditRecord
                              ? "bg-orange-600 text-white hover:bg-orange-700"
                              : "bg-slate-900 text-white hover:bg-slate-800"
                          }`}
                        >
                          {permissions.canEditRecord ? (
                            <Pencil className="mr-1.5 h-3.5 w-3.5" />
                          ) : (
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                          )}

                          {actionLabel}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
              <Search className="h-8 w-8" />
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-900">
              No projects found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Try changing your search, status, project owner, or access
              filters.
            </p>

            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 rounded-2xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
            >
              Reset Filters
            </button>
          </div>
        )}

        {filteredRecords.length > PAGE_SIZE && (
          <div className="flex items-center justify-center gap-2 pb-4">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .filter((page) => {
                return (
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1
                );
              })
              .map((page, index, array) => {
                const previousPage = array[index - 1];
                const showDots = previousPage && page - previousPage > 1;

                return (
                  <div key={page} className="flex items-center gap-2">
                    {showDots && (
                      <span className="px-1 text-sm font-semibold text-slate-400">
                        ...
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-bold transition ${
                        currentPage === page
                          ? "bg-orange-600 text-white shadow-sm"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {page}
                    </button>
                  </div>
                );
              })}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
