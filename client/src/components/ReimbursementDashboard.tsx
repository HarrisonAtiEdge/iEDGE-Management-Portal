// import {
//   useCallback,
//   useEffect,
//   useMemo,
//   useState,
//   type ReactNode,
// } from "react";
// import {
//   collection,
//   getDocs,
//   updateDoc,
//   doc,
//   serverTimestamp,
//   onSnapshot,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { useAuth } from "@/contexts/AuthContext";
// import PaymentReleaseModal from "@/components/PaymentReleaseModal";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import {
//   Search,
//   Users,
//   Wallet,
//   CheckCircle2,
//   Clock3,
//   XCircle,
//   Filter,
//   RefreshCw,
//   ChevronLeft,
//   ChevronRight,
//   Eye,
//   Receipt,
//   CircleDollarSign,
//   RotateCcw,
//   Printer,
// } from "lucide-react";

// const PANEL_ID = "IEDGE-SYSTEM";

// interface Reimbursement {
//   id: string;
//   recordId: string;
//   client: string;
//   amount: number;
//   approvedAmount?: number;
//   paidAmount?: number;
//   approvalRemarks?: string;
//   approvalDecisionAt?: any;
//   sourcePath?: "panel" | "root" | "claim";
//   status: string;
//   rawStatus?: string;
//   billUrl?: string;
//   personName?: string;
//   submittedDate?: any;
//   fuelClaim?: number;
//   details?: string;
//   projectName?: string;
//   approvedBy?: string;
//   paymentStatus?: string;
//   paidBy?: string;

//   claimFor?: "project" | "general";
//   claimType?: "fuel" | "food";
//   projectCode?: string;
//   foodItem?: string;
//   billImagePublicId?: string;
// }

// const normalizeReimbursementStatus = (value: string) => {
//   const status = String(value || "")
//     .trim()
//     .toLowerCase();

//   if (status === "pending_admin_approval") return "pending";
//   if (status === "pending") return "pending";
//   if (status === "approved") return "approved";
//   if (status === "rejected") return "rejected";

//   return "pending";
// };

// const formatStatusLabel = (value?: string) => {
//   const raw = String(value || "").trim();

//   if (!raw) return "Pending";

//   return raw
//     .replace(/_/g, " ")
//     .split(" ")
//     .filter(Boolean)
//     .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
//     .join(" ");
// };

// const getSortableTime = (date: any) => {
//   if (!date) return 0;

//   try {
//     if (date?.toDate) return date.toDate().getTime();

//     if (date?.seconds) {
//       return date.seconds * 1000;
//     }

//     const parsed = new Date(date);

//     if (!isNaN(parsed.getTime())) {
//       return parsed.getTime();
//     }

//     return 0;
//   } catch {
//     return 0;
//   }
// };

// const formatDate = (date: any) => {
//   if (!date) return "N/A";

//   try {
//     if (date?.toDate) {
//       return date.toDate().toLocaleDateString();
//     }

//     if (date?.seconds) {
//       return new Date(date.seconds * 1000).toLocaleDateString();
//     }

//     if (typeof date === "string") {
//       const parsed = new Date(date);

//       if (!isNaN(parsed.getTime())) {
//         return parsed.toLocaleDateString();
//       }
//     }

//     return "Invalid";
//   } catch {
//     return "Invalid";
//   }
// };

// const formatCurrency = (value: number) => {
//   return `Rs ${Number(value || 0).toLocaleString()}`;
// };

// const getApprovalBadgeClass = (status?: string) => {
//   const normalized = normalizeReimbursementStatus(String(status || ""));

//   switch (normalized) {
//     case "approved":
//       return "bg-green-100 text-green-700 border-green-200";

//     case "rejected":
//       return "bg-red-100 text-red-700 border-red-200";

//     default:
//       return "bg-yellow-100 text-yellow-700 border-yellow-200";
//   }
// };

// const getPaymentBadgeClass = (status?: string) => {
//   const normalized = String(status || "pending").toLowerCase();

//   switch (normalized) {
//     case "paid":
//       return "bg-green-100 text-green-700 border-green-200";

//     default:
//       return "bg-slate-100 text-slate-700 border-slate-200";
//   }
// };

// const escapeHtml = (value: any) => {
//   return String(value ?? "")
//     .replace(/&/g, "&amp;")
//     .replace(/</g, "&lt;")
//     .replace(/>/g, "&gt;")
//     .replace(/"/g, "&quot;")
//     .replace(/'/g, "&#039;");
// };

// function StatCard({
//   title,
//   value,
//   subtitle,
//   icon,
// }: {
//   title: string;
//   value: string;
//   subtitle?: string;
//   icon: ReactNode;
// }) {
//   return (
//     <Card className="border-border/60 shadow-sm">
//       <CardContent className="p-4">
//         <div className="flex items-start justify-between gap-3">
//           <div>
//             <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
//               {title}
//             </p>

//             <p className="mt-2 text-2xl font-semibold text-foreground">
//               {value}
//             </p>

//             {subtitle && (
//               <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
//             )}
//           </div>

//           <div className="rounded-xl border bg-muted/40 p-2.5 text-muted-foreground">
//             {icon}
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

// export default function ReimbursementDashboard() {
//   const { userProfile, currentUser } = useAuth();

//   const [data, setData] = useState<Reimbursement[]>([]);

//   const [approvalFilter, setApprovalFilter] = useState("all");
//   const [paymentFilter, setPaymentFilter] = useState("all");
//   const [personFilter, setPersonFilter] = useState("all");
//   const [search, setSearch] = useState("");
//   const [sortBy, setSortBy] = useState("latest");

//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(10);

//   const [loading, setLoading] = useState(false);

//   const [showPaymentModal, setShowPaymentModal] = useState(false);
//   const [selectedItem, setSelectedItem] = useState<Reimbursement | null>(null);

//   const [showApprovalModal, setShowApprovalModal] = useState(false);

//   const [approvalAction, setApprovalAction] = useState<
//     "approved" | "rejected" | null
//   >(null);

//   const [approvalAmount, setApprovalAmount] = useState("");
//   const [approvalRemarks, setApprovalRemarks] = useState("");
//   const [approvalSaving, setApprovalSaving] = useState(false);

//   const [showDetailModal, setShowDetailModal] = useState(false);
//   const [detailItem, setDetailItem] = useState<Reimbursement | null>(null);

//   const getReimbursementDocRef = (item: Reimbursement) => {
//     if (item.sourcePath === "claim") {
//       return doc(db, "Panels", PANEL_ID, "claimReimbursements", item.id);
//     }

//     if (item.sourcePath === "root") {
//       return doc(db, "salesRecords", item.recordId, "meetingUpdates", item.id);
//     }

//     return doc(
//       db,
//       "Panels",
//       PANEL_ID,
//       "salesRecords",
//       item.recordId,
//       "meetingUpdates",
//       item.id,
//     );
//   };

//   const fetchData = useCallback(async () => {
//     setLoading(true);

//     try {
//       const panelRecordsSnap = await getDocs(
//         collection(db, "Panels", PANEL_ID, "salesRecords"),
//       );

//       let legacyRecordDocs: any[] = [];

//       try {
//         const legacyRecordsSnap = await getDocs(collection(db, "salesRecords"));

//         legacyRecordDocs = legacyRecordsSnap.docs;
//       } catch (legacyRecordError) {
//         console.warn(
//           "Legacy salesRecords path not available:",
//           legacyRecordError,
//         );
//       }

//       const recordMap = new Map<
//         string,
//         {
//           id: string;
//           data: any;
//         }
//       >();

//       panelRecordsSnap.docs.forEach((record) => {
//         recordMap.set(record.id, {
//           id: record.id,
//           data: record.data(),
//         });
//       });

//       legacyRecordDocs.forEach((record) => {
//         if (!recordMap.has(record.id)) {
//           recordMap.set(record.id, {
//             id: record.id,
//             data: record.data(),
//           });
//         }
//       });

//       const recordResults = await Promise.allSettled(
//         Array.from(recordMap.values()).map(async (record) => {
//           const recordId = record.id;
//           const recordData = record.data;

//           const meetingDocsWithSource: Array<{
//             meetingDoc: any;
//             sourcePath: "panel" | "root";
//           }> = [];

//           try {
//             const panelMeetingsSnap = await getDocs(
//               collection(
//                 db,
//                 "Panels",
//                 PANEL_ID,
//                 "salesRecords",
//                 recordId,
//                 "meetingUpdates",
//               ),
//             );

//             panelMeetingsSnap.docs.forEach((meetingDoc) => {
//               meetingDocsWithSource.push({
//                 meetingDoc,
//                 sourcePath: "panel",
//               });
//             });
//           } catch (panelMeetingError) {
//             console.error(
//               `Error fetching panel meetingUpdates for record ${recordId}:`,
//               panelMeetingError,
//             );
//           }

//           try {
//             const legacyMeetingsSnap = await getDocs(
//               collection(db, "salesRecords", recordId, "meetingUpdates"),
//             );

//             legacyMeetingsSnap.docs.forEach((meetingDoc) => {
//               meetingDocsWithSource.push({
//                 meetingDoc,
//                 sourcePath: "root",
//               });
//             });
//           } catch (legacyMeetingError) {
//             console.warn(
//               `Legacy meetingUpdates path not available for record ${recordId}:`,
//               legacyMeetingError,
//             );
//           }

//           const seenMeetings = new Set<string>();

//           return meetingDocsWithSource
//             .map(({ meetingDoc, sourcePath }) => {
//               const meetingKey = `${sourcePath}-${meetingDoc.id}`;

//               if (seenMeetings.has(meetingKey)) {
//                 return null;
//               }

//               seenMeetings.add(meetingKey);

//               const meeting: any = meetingDoc.data();
//               const reimbursement = meeting?.reimbursement;

//               if (!reimbursement?.enabled) {
//                 return null;
//               }

//               return {
//                 id: meetingDoc.id,

//                 recordId,

//                 client: recordData.client || "Unknown",

//                 projectName: recordData.projectName || "N/A",

//                 amount: Number(reimbursement.amount || 0),

//                 approvedAmount:
//                   reimbursement.approvedAmount !== undefined
//                     ? Number(reimbursement.approvedAmount || 0)
//                     : undefined,

//                 paidAmount:
//                   reimbursement.paidAmount !== undefined
//                     ? Number(reimbursement.paidAmount || 0)
//                     : undefined,

//                 approvalRemarks: reimbursement.approvalRemarks || "",

//                 approvalDecisionAt: reimbursement.approvalDecisionAt || null,

//                 sourcePath,

//                 rawStatus: String(
//                   reimbursement.approvalStatus || "pending_admin_approval",
//                 ),

//                 status: normalizeReimbursementStatus(
//                   reimbursement.approvalStatus || "pending_admin_approval",
//                 ),

//                 billUrl: reimbursement.billUrl || "",

//                 personName:
//                   reimbursement.approvalSubmittedByName ||
//                   reimbursement.personName ||
//                   "Unknown",

//                 submittedDate:
//                   reimbursement.approvalSubmittedAt ||
//                   reimbursement.submittedAt ||
//                   reimbursement.createdAt ||
//                   reimbursement.date ||
//                   reimbursement.meetingDate ||
//                   meeting.reimbursementSubmittedAt ||
//                   meeting.submittedAt ||
//                   meeting.updatedAt ||
//                   meeting.createdAt ||
//                   meeting.meetingDate ||
//                   null,

//                 fuelClaim: Number(reimbursement.kms || reimbursement.km || 0),

//                 details:
//                   reimbursement.detail || reimbursement.description || "N/A",

//                 approvedBy: reimbursement.approvedBy || "",

//                 paymentStatus: reimbursement.paymentStatus || "pending",

//                 paidBy: reimbursement.paidBy || "",
//               } as Reimbursement;
//             })
//             .filter(Boolean) as Reimbursement[];
//         }),
//       );

//       const meetingRows = recordResults
//         .filter(
//           (result): result is PromiseFulfilledResult<Reimbursement[]> =>
//             result.status === "fulfilled",
//         )
//         .flatMap((result) => result.value);

//       let claimRows: Reimbursement[] = [];

//       try {
//         const claimReimbursementsSnap = await getDocs(
//           collection(db, "Panels", PANEL_ID, "claimReimbursements"),
//         );

//         claimRows = claimReimbursementsSnap.docs.map((claimDoc) => {
//           const claim: any = claimDoc.data();

//           const claimFor = claim.claimFor === "project" ? "project" : "general";

//           const claimType = claim.claimType === "food" ? "food" : "fuel";

//           const isProjectClaim = claimFor === "project";

//           const isFuelClaim = claimType === "fuel";

//           const rawStatus = String(
//             claim.status || claim.approvalStatus || "pending",
//           );

//           return {
//             id: claimDoc.id,

//             recordId: "claimReimbursements",

//             sourcePath: "claim",

//             client: isProjectClaim
//               ? "Project Reimbursement"
//               : "General Reimbursement",

//             projectName: isProjectClaim
//               ? claim.projectCode || "Project"
//               : "General",

//             claimFor,

//             claimType,

//             projectCode: claim.projectCode || "",

//             foodItem: claim.foodItem || "",

//             amount: Number(claim.claimAmount || claim.amount || 0),

//             approvedAmount:
//               claim.approvedAmount !== undefined
//                 ? Number(claim.approvedAmount || 0)
//                 : undefined,

//             paidAmount:
//               claim.paidAmount !== undefined
//                 ? Number(claim.paidAmount || 0)
//                 : undefined,

//             approvalRemarks: claim.approvalRemarks || "",

//             approvalDecisionAt: claim.approvalDecisionAt || null,

//             rawStatus,

//             status: normalizeReimbursementStatus(rawStatus),

//             billUrl: claim.billImageUrl || claim.billUrl || "",

//             billImagePublicId: claim.billImagePublicId || "",

//             personName:
//               claim.submittedByName ||
//               claim.createdByName ||
//               claim.userName ||
//               "Unknown",

//             submittedDate:
//               claim.submittedAt || claim.createdAt || claim.updatedAt || null,

//             fuelClaim: isFuelClaim ? Number(claim.km || claim.kms || 0) : 0,

//             details:
//               claim.description ||
//               (isFuelClaim
//                 ? `Fuel claim${claim.km ? ` - ${claim.km} KM` : ""}`
//                 : `Food claim${claim.foodItem ? ` - ${claim.foodItem}` : ""}`),

//             approvedBy: claim.approvedBy || "",

//             paymentStatus: claim.paymentStatus || "pending",

//             paidBy: claim.paidBy || "",
//           };
//         });
//       } catch (claimError) {
//         console.error("Error fetching claim reimbursements:", claimError);
//       }

//       const rows = [...meetingRows, ...claimRows];

//       rows.sort(
//         (a, b) =>
//           getSortableTime(b.submittedDate) - getSortableTime(a.submittedDate),
//       );

//       setData(rows);
//     } catch (error) {
//       console.error("Error fetching reimbursements:", error);

//       setData([]);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchData();
//   }, [fetchData]);

//   useEffect(() => {
//     const unsubscribe = onSnapshot(
//       collection(db, "Panels", PANEL_ID, "claimReimbursements"),

//       () => {
//         fetchData();
//       },

//       (error) => {
//         console.error("Claim reimbursements realtime listener failed:", error);
//       },
//     );

//     return () => unsubscribe();
//   }, [fetchData]);

//   const uniquePeople = useMemo(() => {
//     return Array.from(
//       new Set(
//         data.map(
//           (item) => String(item.personName || "Unknown").trim() || "Unknown",
//         ),
//       ),
//     ).sort((a, b) => a.localeCompare(b));
//   }, [data]);

//   const filteredData = useMemo(() => {
//     const query = search.trim().toLowerCase();

//     const rows = data.filter((item) => {
//       const matchesApproval =
//         approvalFilter === "all" || item.status === approvalFilter;

//       const payment = String(item.paymentStatus || "pending").toLowerCase();

//       const matchesPayment =
//         paymentFilter === "all" || payment === paymentFilter;

//       const person = String(item.personName || "Unknown").trim() || "Unknown";

//       const matchesPerson = personFilter === "all" || person === personFilter;

//       const matchesSearch =
//         !query ||
//         item.client?.toLowerCase().includes(query) ||
//         item.personName?.toLowerCase().includes(query) ||
//         item.projectName?.toLowerCase().includes(query) ||
//         item.details?.toLowerCase().includes(query) ||
//         item.projectCode?.toLowerCase().includes(query) ||
//         item.foodItem?.toLowerCase().includes(query) ||
//         item.claimType?.toLowerCase().includes(query) ||
//         item.claimFor?.toLowerCase().includes(query);

//       return (
//         matchesApproval && matchesPayment && matchesPerson && matchesSearch
//       );
//     });

//     rows.sort((a, b) => {
//       if (sortBy === "latest") {
//         return (
//           getSortableTime(b.submittedDate) - getSortableTime(a.submittedDate)
//         );
//       }

//       if (sortBy === "oldest") {
//         return (
//           getSortableTime(a.submittedDate) - getSortableTime(b.submittedDate)
//         );
//       }

//       if (sortBy === "amount_high") {
//         return b.amount - a.amount;
//       }

//       if (sortBy === "amount_low") {
//         return a.amount - b.amount;
//       }

//       if (sortBy === "client_az") {
//         return String(a.client || "").localeCompare(String(b.client || ""));
//       }

//       return 0;
//     });

//     return rows;
//   }, [data, approvalFilter, paymentFilter, personFilter, search, sortBy]);

//   useEffect(() => {
//     setPage(1);
//   }, [approvalFilter, paymentFilter, personFilter, search, sortBy, pageSize]);

//   const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));

//   useEffect(() => {
//     if (page > totalPages) {
//       setPage(totalPages);
//     }
//   }, [page, totalPages]);

//   const paginatedData = useMemo(() => {
//     const start = (page - 1) * pageSize;

//     return filteredData.slice(start, start + pageSize);
//   }, [filteredData, page, pageSize]);

//   const overallAmount = useMemo(() => {
//     return data.reduce((sum, item) => sum + item.amount, 0);
//   }, [data]);

//   const pendingApprovalCount = useMemo(() => {
//     return data.filter((item) => item.status === "pending").length;
//   }, [data]);

//   const approvedCount = useMemo(() => {
//     return data.filter((item) => item.status === "approved").length;
//   }, [data]);

//   const paidAmount = useMemo(() => {
//     return data
//       .filter(
//         (item) => String(item.paymentStatus || "").toLowerCase() === "paid",
//       )
//       .reduce(
//         (sum, item) =>
//           sum +
//           Number(item.paidAmount ?? item.approvedAmount ?? item.amount ?? 0),
//         0,
//       );
//   }, [data]);

//   const filteredApprovedAmount = useMemo(() => {
//     return filteredData
//       .filter((item) => item.status === "approved")
//       .reduce(
//         (sum, item) => sum + Number(item.approvedAmount ?? item.amount ?? 0),
//         0,
//       );
//   }, [filteredData]);

//   const filteredPaymentPaidAmount = useMemo(() => {
//     return filteredData
//       .filter(
//         (item) =>
//           item.status === "approved" &&
//           String(item.paymentStatus || "pending").toLowerCase() === "paid",
//       )
//       .reduce(
//         (sum, item) =>
//           sum +
//           Number(item.paidAmount ?? item.approvedAmount ?? item.amount ?? 0),
//         0,
//       );
//   }, [filteredData]);

//   const filteredPaymentPendingAmount = useMemo(() => {
//     return filteredData
//       .filter(
//         (item) =>
//           item.status === "approved" &&
//           String(item.paymentStatus || "pending").toLowerCase() !== "paid",
//       )
//       .reduce(
//         (sum, item) => sum + Number(item.approvedAmount ?? item.amount ?? 0),
//         0,
//       );
//   }, [filteredData]);

//   const filteredAmount = useMemo(() => {
//     return filteredData.reduce((sum, item) => sum + item.amount, 0);
//   }, [filteredData]);

//   const clearFilters = () => {
//     setApprovalFilter("all");
//     setPaymentFilter("all");
//     setPersonFilter("all");
//     setSearch("");
//     setSortBy("latest");
//     setPage(1);
//   };

//   const openApprovalDialog = (
//     item: Reimbursement,
//     status: "approved" | "rejected",
//   ) => {
//     setSelectedItem(item);

//     setApprovalAction(status);

//     setApprovalAmount(String(item.approvedAmount ?? item.amount ?? 0));

//     setApprovalRemarks(item.approvalRemarks || "");

//     setShowApprovalModal(true);
//   };

//   const submitApprovalDecision = async () => {
//     if (!selectedItem || !approvalAction) {
//       return;
//     }

//     const finalAmount = Number(approvalAmount || 0);

//     if (finalAmount < 0) {
//       alert("Approved amount cannot be negative.");
//       return;
//     }

//     if (!approvalRemarks.trim()) {
//       alert("Please enter remarks before saving.");
//       return;
//     }

//     setApprovalSaving(true);

//     try {
//       if (selectedItem.sourcePath === "claim") {
//         const claimPayload: Record<string, any> = {
//           status: approvalAction,
//           approvalStatus: approvalAction,
//           approvedAmount: finalAmount,
//           approvalRemarks: approvalRemarks.trim(),

//           approvedBy:
//             userProfile?.displayName || currentUser?.email || "Unknown",

//           approvedById: currentUser?.uid || "",

//           approvalDecisionAt: serverTimestamp(),

//           updatedAt: serverTimestamp(),
//         };

//         if (approvalAction === "approved") {
//           claimPayload.paymentStatus = "pending";
//         }

//         await updateDoc(getReimbursementDocRef(selectedItem), claimPayload);
//       } else {
//         const payload: Record<string, any> = {
//           "reimbursement.approvalStatus": approvalAction,

//           "reimbursement.approvedAmount": finalAmount,

//           "reimbursement.approvalRemarks": approvalRemarks.trim(),

//           "reimbursement.approvedBy":
//             userProfile?.displayName || currentUser?.email || "Unknown",

//           "reimbursement.approvedById": currentUser?.uid || "",

//           "reimbursement.approvalDecisionAt": serverTimestamp(),

//           "reimbursement.updatedAt": serverTimestamp(),
//         };

//         if (approvalAction === "approved") {
//           payload["reimbursement.paymentStatus"] = "pending";
//         }

//         await updateDoc(getReimbursementDocRef(selectedItem), payload);
//       }

//       setShowApprovalModal(false);
//       setSelectedItem(null);
//       setApprovalAction(null);
//       setApprovalAmount("");
//       setApprovalRemarks("");

//       await fetchData();
//     } catch (error) {
//       console.error("Approval update failed:", error);
//     } finally {
//       setApprovalSaving(false);
//     }
//   };

//   /*
//    * ==========================================================
//    * INDIVIDUAL REIMBURSEMENT PRINT VIEW
//    * ==========================================================
//    */
//   const handlePrintView = (item: Reimbursement) => {
//     const printWindow = window.open(
//       "",
//       "_blank",
//       "width=1000,height=850,scrollbars=yes,resizable=yes",
//     );

//     if (!printWindow) {
//       alert(
//         "Print View could not be opened. Please allow pop-ups for this website.",
//       );
//       return;
//     }

//     const paymentStatus = String(item.paymentStatus || "pending").toLowerCase();

//     const approvalStatus = formatStatusLabel(item.rawStatus || item.status);

//     const claimFor =
//       item.claimFor === "project"
//         ? "Project"
//         : item.claimFor === "general"
//           ? "General"
//           : item.projectName && item.projectName !== "N/A"
//             ? "Project"
//             : "N/A";

//     const claimType =
//       item.claimType === "food"
//         ? "Food"
//         : item.claimType === "fuel"
//           ? "Fuel"
//           : Number(item.fuelClaim || 0) > 0
//             ? "Fuel"
//             : "Reimbursement";

//     const fuelFoodValue =
//       item.claimType === "food"
//         ? item.foodItem || "Food"
//         : Number(item.fuelClaim || 0) > 0
//           ? `${Number(item.fuelClaim || 0)} KM`
//           : "N/A";

//     const approvedAmount =
//       item.approvedAmount !== undefined
//         ? formatCurrency(item.approvedAmount)
//         : "N/A";

//     const paidValue =
//       item.paidAmount !== undefined
//         ? formatCurrency(item.paidAmount)
//         : paymentStatus === "paid"
//           ? formatCurrency(item.approvedAmount ?? item.amount)
//           : "N/A";

//     const approvalDate = item.approvalDecisionAt
//       ? formatDate(item.approvalDecisionAt)
//       : "N/A";

//     const statusClass =
//       item.status === "approved"
//         ? "approved"
//         : item.status === "rejected"
//           ? "rejected"
//           : "pending";

//     const html = `
//       <!DOCTYPE html>

//       <html>
//         <head>
//           <meta charset="UTF-8" />

//           <title>
//             Reimbursement Print View
//           </title>

//           <style>
//             * {
//               box-sizing: border-box;
//             }

//             html,
//             body {
//               margin: 0;
//               padding: 0;
//             }

//             body {
//               font-family: Arial, Helvetica, sans-serif;
//               background: #f3f4f6;
//               color: #111827;

//               -webkit-print-color-adjust: exact;
//               print-color-adjust: exact;
//             }

//             .toolbar {
//               position: sticky;
//               top: 0;
//               z-index: 50;

//               display: flex;
//               justify-content: flex-end;
//               gap: 10px;

//               padding: 14px 20px;

//               background: #ffffff;

//               border-bottom: 1px solid #e5e7eb;
//             }

//             .toolbar button {
//               height: 40px;
//               padding: 0 18px;
//               border-radius: 7px;
//               cursor: pointer;
//               font-size: 14px;
//               font-weight: 600;
//             }

//             .close-button {
//               background: #ffffff;
//               border: 1px solid #d1d5db;
//               color: #374151;
//             }

//             .print-button {
//               border: 0;
//               background: #2563eb;
//               color: #ffffff;
//             }

//             .page {
//               width: 210mm;
//               min-height: 297mm;

//               margin: 20px auto;

//               padding: 16mm;

//               background: #ffffff;

//               box-shadow:
//                 0 4px 20px
//                 rgba(0, 0, 0, 0.08);
//             }

//             .document-header {
//               display: flex;
//               justify-content: space-between;
//               align-items: flex-start;
//               gap: 20px;

//               padding-bottom: 18px;

//               margin-bottom: 24px;

//               border-bottom: 3px solid #111827;
//             }

//             .company-name {
//               margin-bottom: 5px;

//               font-size: 14px;
//               font-weight: 700;

//               color: #2563eb;

//               letter-spacing: 0.5px;
//             }

//             h1 {
//               margin: 0;

//               font-size: 27px;
//               line-height: 1.2;
//             }

//             .subtitle {
//               margin-top: 6px;

//               font-size: 13px;

//               color: #6b7280;
//             }

//             .print-info {
//               text-align: right;

//               font-size: 12px;
//               line-height: 1.6;

//               color: #6b7280;
//             }

//             .print-info strong {
//               display: block;

//               color: #111827;
//             }

//             .section {
//               margin-bottom: 24px;
//             }

//             .section-title {
//               margin-bottom: 10px;

//               padding-bottom: 7px;

//               border-bottom: 1px solid #d1d5db;

//               font-size: 14px;
//               font-weight: 700;

//               text-transform: uppercase;

//               letter-spacing: 0.6px;
//             }

//             .grid {
//               display: grid;

//               grid-template-columns: repeat(2, minmax(0, 1fr));

//               border: 1px solid #e5e7eb;

//               border-radius: 8px;

//               overflow: hidden;
//             }

//             .row {
//               min-height: 67px;

//               padding: 12px 14px;

//               border-bottom: 1px solid #e5e7eb;
//             }

//             .row:nth-child(odd) {
//               border-right: 1px solid #e5e7eb;
//             }

//             .row.full {
//               grid-column: 1 / -1;

//               border-right: 0;
//             }

//             .label {
//               margin-bottom: 5px;

//               font-size: 10px;
//               font-weight: 700;

//               text-transform: uppercase;

//               color: #6b7280;
//             }

//             .value {
//               font-size: 14px;
//               line-height: 1.5;
//               font-weight: 500;

//               overflow-wrap: anywhere;
//             }

//             .amount {
//               font-size: 18px;
//               font-weight: 700;
//             }

//             .status {
//               display: inline-block;

//               padding: 5px 10px;

//               border-radius: 9999px;

//               font-size: 11px;
//               font-weight: 700;
//             }

//             .approved {
//               background: #dcfce7;
//               color: #166534;
//             }

//             .rejected {
//               background: #fee2e2;
//               color: #991b1b;
//             }

//             .pending {
//               background: #fef3c7;
//               color: #92400e;
//             }

//             .paid {
//               background: #dbeafe;
//               color: #1d4ed8;
//             }

//             .details-box {
//               min-height: 70px;

//               padding: 14px;

//               border: 1px solid #e5e7eb;

//               border-radius: 8px;

//               font-size: 14px;
//               line-height: 1.6;

//               white-space: pre-wrap;

//               overflow-wrap: anywhere;
//             }

//             a {
//               color: #2563eb;
//               text-decoration: none;
//               font-weight: 600;
//             }

//             .signature-area {
//               display: grid;

//               grid-template-columns: 1fr 1fr;

//               gap: 60px;

//               margin-top: 50px;
//             }

//             .signature {
//               padding-top: 8px;

//               border-top: 1px solid #9ca3af;

//               text-align: center;

//               font-size: 12px;

//               color: #6b7280;
//             }

//             .footer {
//               margin-top: 35px;

//               padding-top: 12px;

//               border-top: 1px solid #e5e7eb;

//               text-align: center;

//               font-size: 10px;

//               color: #9ca3af;
//             }

//             @media print {
//               body {
//                 background: white;
//               }

//               .toolbar {
//                 display: none !important;
//               }

//               .page {
//                 width: 100%;
//                 min-height: auto;

//                 margin: 0;

//                 padding: 5mm;

//                 box-shadow: none;
//               }

//               .section {
//                 page-break-inside: avoid;
//               }
//             }

//             @page {
//               size: A4;
//               margin: 8mm;
//             }
//           </style>
//         </head>

//         <body>
//           <div class="toolbar">
//             <button
//               type="button"
//               class="close-button"
//               onclick="window.close()"
//             >
//               Close
//             </button>

//             <button
//               type="button"
//               class="print-button"
//               onclick="window.print()"
//             >
//               Print
//             </button>
//           </div>

//           <main class="page">
//             <header class="document-header">
//               <div>
//                 <div class="company-name">
//                   iEDGE SYSTEM
//                 </div>

//                 <h1>
//                   Reimbursement
//                 </h1>

//                 <div class="subtitle">
//                   Reimbursement Claim Print View
//                 </div>
//               </div>

//               <div class="print-info">
//                 Printed On

//                 <strong>
//                   ${escapeHtml(new Date().toLocaleString())}
//                 </strong>
//               </div>
//             </header>

//             <section class="section">
//               <div class="section-title">
//                 Claim Information
//               </div>

//               <div class="grid">
//                 <div class="row">
//                   <div class="label">
//                     Claimed By
//                   </div>

//                   <div class="value">
//                     ${escapeHtml(item.personName || "Unknown")}
//                   </div>
//                 </div>

//                 <div class="row">
//                   <div class="label">
//                     Submitted Date
//                   </div>

//                   <div class="value">
//                     ${escapeHtml(formatDate(item.submittedDate))}
//                   </div>
//                 </div>

//                 <div class="row">
//                   <div class="label">
//                     Client
//                   </div>

//                   <div class="value">
//                     ${escapeHtml(item.client || "N/A")}
//                   </div>
//                 </div>

//                 <div class="row">
//                   <div class="label">
//                     Project
//                   </div>

//                   <div class="value">
//                     ${escapeHtml(item.projectName || "N/A")}
//                   </div>
//                 </div>

//                 <div class="row">
//                   <div class="label">
//                     Claim For
//                   </div>

//                   <div class="value">
//                     ${escapeHtml(claimFor)}
//                   </div>
//                 </div>

//                 <div class="row">
//                   <div class="label">
//                     Claim Type
//                   </div>

//                   <div class="value">
//                     ${escapeHtml(claimType)}
//                   </div>
//                 </div>

//                 <div class="row">
//                   <div class="label">
//                     Project Code
//                   </div>

//                   <div class="value">
//                     ${escapeHtml(item.projectCode || "N/A")}
//                   </div>
//                 </div>

//                 <div class="row">
//                   <div class="label">
//                     ${item.claimType === "food" ? "Food Item" : "Fuel / KM"}
//                   </div>

//                   <div class="value">
//                     ${escapeHtml(fuelFoodValue)}
//                   </div>
//                 </div>
//               </div>
//             </section>

//             <section class="section">
//               <div class="section-title">
//                 Amount Information
//               </div>

//               <div class="grid">
//                 <div class="row">
//                   <div class="label">
//                     Claim Amount
//                   </div>

//                   <div class="value amount">
//                     ${escapeHtml(formatCurrency(item.amount))}
//                   </div>
//                 </div>

//                 <div class="row">
//                   <div class="label">
//                     Approved Amount
//                   </div>

//                   <div class="value amount">
//                     ${escapeHtml(approvedAmount)}
//                   </div>
//                 </div>

//                 <div class="row">
//                   <div class="label">
//                     Paid Amount
//                   </div>

//                   <div class="value">
//                     ${escapeHtml(paidValue)}
//                   </div>
//                 </div>

//                 <div class="row">
//                   <div class="label">
//                     Payment Status
//                   </div>

//                   <div class="value">
//                     <span class="status ${
//                       paymentStatus === "paid" ? "paid" : "pending"
//                     }">
//                       ${
//                         paymentStatus === "paid"
//                           ? "Payment Paid"
//                           : "Payment Pending"
//                       }
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </section>

//             <section class="section">
//               <div class="section-title">
//                 Approval Information
//               </div>

//               <div class="grid">
//                 <div class="row">
//                   <div class="label">
//                     Approval Status
//                   </div>

//                   <div class="value">
//                     <span class="status ${statusClass}">
//                       ${escapeHtml(approvalStatus)}
//                     </span>
//                   </div>
//                 </div>

//                 <div class="row">
//                   <div class="label">
//                     Approved By
//                   </div>

//                   <div class="value">
//                     ${escapeHtml(item.approvedBy || "Not approved yet")}
//                   </div>
//                 </div>

//                 <div class="row">
//                   <div class="label">
//                     Approval Date
//                   </div>

//                   <div class="value">
//                     ${escapeHtml(approvalDate)}
//                   </div>
//                 </div>

//                 <div class="row">
//                   <div class="label">
//                     Paid By
//                   </div>

//                   <div class="value">
//                     ${escapeHtml(item.paidBy || "Not paid yet")}
//                   </div>
//                 </div>
//               </div>
//             </section>

//             <section class="section">
//               <div class="section-title">
//                 Claim Details
//               </div>

//               <div class="details-box">
//                 ${escapeHtml(item.details || "No details")}
//               </div>
//             </section>

//             <section class="section">
//               <div class="section-title">
//                 Approval Remarks
//               </div>

//               <div class="details-box">
//                 ${escapeHtml(
//                   item.approvalRemarks || "No approval remarks added",
//                 )}
//               </div>
//             </section>

//             <section class="section">
//               <div class="section-title">
//                 Supporting Document
//               </div>

//               <div class="grid">
//                 <div class="row full">
//                   <div class="label">
//                     Bill / Receipt
//                   </div>

//                   <div class="value">
//                     ${
//                       item.billUrl
//                         ? `
//                           <a
//                             href="${escapeHtml(item.billUrl)}"
//                             target="_blank"
//                           >
//                             View Attached Bill
//                           </a>
//                         `
//                         : "No bill attached"
//                     }
//                   </div>
//                 </div>
//               </div>
//             </section>

//             <div class="signature-area">
//               <div class="signature">
//                 Claimant Signature
//               </div>

//               <div class="signature">
//                 Authorized Signature
//               </div>
//             </div>

//             <footer class="footer">
//               Reimbursement Dashboard - iEDGE System
//             </footer>
//           </main>
//         </body>
//       </html>
//     `;

//     printWindow.document.open();
//     printWindow.document.write(html);
//     printWindow.document.close();
//     printWindow.focus();
//   };

//   /*
//    * ==========================================================
//    * PRINT ALL / COMPLETE REIMBURSEMENT REPORT
//    * ==========================================================
//    *
//    * Important:
//    * This uses filteredData instead of paginatedData.
//    * Therefore, if there are 100 matching records while page size
//    * is only 10, all 100 records will be included in Print View.
//    */
//   const handlePrintAllReimbursements = () => {
//     const printWindow = window.open(
//       "",
//       "_blank",
//       "width=1400,height=900,scrollbars=yes,resizable=yes",
//     );

//     if (!printWindow) {
//       alert(
//         "Print View could not be opened. Please allow pop-ups for this website.",
//       );
//       return;
//     }

//     const totalClaims = filteredData.length;

//     const totalApprovedClaims = filteredData.filter(
//       (item) => item.status === "approved",
//     ).length;

//     const totalPendingClaims = filteredData.filter(
//       (item) => item.status === "pending",
//     ).length;

//     const totalRejectedClaims = filteredData.filter(
//       (item) => item.status === "rejected",
//     ).length;

//     const totalPaidClaims = filteredData.filter(
//       (item) =>
//         String(item.paymentStatus || "pending").toLowerCase() === "paid",
//     ).length;

//     const tableRows = filteredData
//       .map((item, index) => {
//         const paymentStatus = String(
//           item.paymentStatus || "pending",
//         ).toLowerCase();

//         const approvalStatus = formatStatusLabel(item.rawStatus || item.status);

//         const claimType =
//           item.claimType === "food"
//             ? "Food"
//             : item.claimType === "fuel"
//               ? "Fuel"
//               : Number(item.fuelClaim || 0) > 0
//                 ? "Fuel"
//                 : "Reimbursement";

//         const fuelFood =
//           item.claimType === "food"
//             ? item.foodItem || "Food"
//             : Number(item.fuelClaim || 0) > 0
//               ? `${Number(item.fuelClaim || 0)} KM`
//               : "N/A";

//         const approvedAmount =
//           item.approvedAmount !== undefined
//             ? formatCurrency(item.approvedAmount)
//             : "N/A";

//         const paidValue =
//           item.paidAmount !== undefined
//             ? formatCurrency(item.paidAmount)
//             : paymentStatus === "paid"
//               ? formatCurrency(item.approvedAmount ?? item.amount)
//               : "N/A";

//         const approvalClass =
//           item.status === "approved"
//             ? "approved"
//             : item.status === "rejected"
//               ? "rejected"
//               : "pending";

//         return `
//           <tr>
//             <td class="number">
//               ${index + 1}
//             </td>

//             <td>
//               <strong>
//                 ${escapeHtml(item.personName || "Unknown")}
//               </strong>
//             </td>

//             <td>
//               ${escapeHtml(item.client || "N/A")}
//             </td>

//             <td>
//               ${escapeHtml(item.projectName || "N/A")}
//             </td>

//             <td>
//               ${escapeHtml(item.projectCode || "N/A")}
//             </td>

//             <td>
//               ${escapeHtml(claimType)}
//             </td>

//             <td>
//               ${escapeHtml(fuelFood)}
//             </td>

//             <td class="date">
//               ${escapeHtml(formatDate(item.submittedDate))}
//             </td>

//             <td class="money">
//               ${escapeHtml(formatCurrency(item.amount))}
//             </td>

//             <td class="money">
//               ${escapeHtml(approvedAmount)}
//             </td>

//             <td class="money">
//               ${escapeHtml(paidValue)}
//             </td>

//             <td>
//               <span class="status ${approvalClass}">
//                 ${escapeHtml(approvalStatus)}
//               </span>
//             </td>

//             <td>
//               <span class="status ${
//                 paymentStatus === "paid" ? "paid" : "payment-pending"
//               }">
//                 ${paymentStatus === "paid" ? "Paid" : "Pending"}
//               </span>
//             </td>

//             <td>
//               ${escapeHtml(item.approvedBy || "N/A")}
//             </td>

//             <td>
//               ${escapeHtml(item.paidBy || "N/A")}
//             </td>

//             <td class="details">
//               ${escapeHtml(item.details || "N/A")}
//             </td>

//             <td class="details">
//               ${escapeHtml(item.approvalRemarks || "N/A")}
//             </td>
//           </tr>
//         `;
//       })
//       .join("");

//     const reportHtml = `
//       <!DOCTYPE html>

//       <html>
//         <head>
//           <meta charset="UTF-8" />

//           <title>
//             Complete Reimbursement Report
//           </title>

//           <style>
//             * {
//               box-sizing: border-box;
//             }

//             html,
//             body {
//               margin: 0;
//               padding: 0;
//             }

//             body {
//               font-family: Arial, Helvetica, sans-serif;

//               background: #f3f4f6;

//               color: #111827;

//               -webkit-print-color-adjust: exact;
//               print-color-adjust: exact;
//             }

//             .toolbar {
//               position: sticky;
//               top: 0;
//               z-index: 100;

//               display: flex;
//               align-items: center;
//               justify-content: flex-end;
//               gap: 10px;

//               padding: 15px 20px;

//               background: white;

//               border-bottom: 1px solid #e5e7eb;

//               box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
//             }

//             .toolbar button {
//               height: 40px;

//               padding: 0 18px;

//               border-radius: 7px;

//               cursor: pointer;

//               font-size: 14px;

//               font-weight: 600;
//             }

//             .close-button {
//               border: 1px solid #d1d5db;

//               background: white;

//               color: #374151;
//             }

//             .print-button {
//               border: 0;

//               background: #2563eb;

//               color: white;
//             }

//             .page {
//               margin: 20px;

//               padding: 24px;

//               background: white;

//               box-shadow:
//                 0 3px 14px
//                 rgba(0, 0, 0, 0.08);
//             }

//             .header {
//               display: flex;

//               justify-content: space-between;

//               align-items: flex-start;

//               gap: 20px;

//               padding-bottom: 18px;

//               margin-bottom: 18px;

//               border-bottom: 3px solid #111827;
//             }

//             .company {
//               margin-bottom: 5px;

//               font-size: 14px;

//               font-weight: 700;

//               color: #2563eb;

//               letter-spacing: 0.6px;
//             }

//             h1 {
//               margin: 0;

//               font-size: 27px;
//             }

//             .subtitle {
//               margin-top: 6px;

//               font-size: 13px;

//               color: #6b7280;
//             }

//             .print-date {
//               text-align: right;

//               font-size: 12px;

//               color: #6b7280;

//               line-height: 1.6;
//             }

//             .print-date strong {
//               display: block;

//               color: #111827;
//             }

//             /*
//              * Summary cards
//              */
//             .summary {
//               display: grid;

//               grid-template-columns: repeat(4, minmax(0, 1fr));

//               gap: 10px;

//               margin-bottom: 10px;
//             }

//             .summary.second {
//               grid-template-columns: repeat(4, minmax(0, 1fr));

//               margin-bottom: 18px;
//             }

//             .summary-card {
//               padding: 11px 12px;

//               border: 1px solid #e5e7eb;

//               border-radius: 7px;

//               background: #ffffff;
//             }

//             .summary-label {
//               margin-bottom: 5px;

//               font-size: 9px;

//               font-weight: 700;

//               color: #6b7280;

//               text-transform: uppercase;

//               letter-spacing: 0.4px;
//             }

//             .summary-value {
//               font-size: 16px;

//               font-weight: 700;

//               color: #111827;
//             }

//             .filter-info {
//               margin-bottom: 16px;

//               padding: 10px 12px;

//               border: 1px solid #e5e7eb;

//               border-radius: 7px;

//               background: #f9fafb;

//               font-size: 10px;

//               line-height: 1.6;

//               color: #4b5563;
//             }

//             .filter-info strong {
//               color: #111827;
//             }

//             /*
//              * Report table
//              */
//             .table-wrapper {
//               width: 100%;
//             }

//             table {
//               width: 100%;

//               border-collapse: collapse;

//               table-layout: auto;

//               font-size: 7.5px;
//             }

//             thead {
//               display: table-header-group;
//             }

//             tbody {
//               display: table-row-group;
//             }

//             tr {
//               page-break-inside: avoid;
//             }

//             th {
//               padding: 6px 4px;

//               border: 1px solid #d1d5db;

//               background: #f3f4f6;

//               text-align: left;

//               vertical-align: middle;

//               font-size: 7px;

//               font-weight: 700;

//               text-transform: uppercase;

//               white-space: nowrap;
//             }

//             td {
//               padding: 6px 4px;

//               border: 1px solid #e5e7eb;

//               vertical-align: top;

//               line-height: 1.35;

//               overflow-wrap: anywhere;
//             }

//             .number {
//               width: 25px;

//               text-align: center;
//             }

//             .money {
//               white-space: nowrap;

//               font-weight: 600;
//             }

//             .date {
//               white-space: nowrap;
//             }

//             .details {
//               min-width: 100px;

//               max-width: 160px;
//             }

//             .status {
//               display: inline-block;

//               padding: 3px 5px;

//               border-radius: 999px;

//               white-space: nowrap;

//               font-size: 6.5px;

//               font-weight: 700;
//             }

//             .approved {
//               background: #dcfce7;
//               color: #166534;
//             }

//             .rejected {
//               background: #fee2e2;
//               color: #991b1b;
//             }

//             .pending {
//               background: #fef3c7;
//               color: #92400e;
//             }

//             .paid {
//               background: #dbeafe;
//               color: #1d4ed8;
//             }

//             .payment-pending {
//               background: #f3f4f6;
//               color: #374151;
//             }

//             .footer {
//               margin-top: 22px;

//               padding-top: 11px;

//               border-top: 1px solid #e5e7eb;

//               text-align: center;

//               font-size: 9px;

//               color: #9ca3af;
//             }

//             @media print {
//               body {
//                 background: white;
//               }

//               .toolbar {
//                 display: none !important;
//               }

//               .page {
//                 margin: 0;

//                 padding: 3mm;

//                 box-shadow: none;
//               }

//               table {
//                 font-size: 6.5px;
//               }

//               th {
//                 padding: 4px 2px;

//                 font-size: 6px;
//               }

//               td {
//                 padding: 4px 2px;
//               }

//               .summary-card {
//                 page-break-inside: avoid;
//               }

//               tr {
//                 page-break-inside: avoid;
//               }
//             }

//             @page {
//               size: A4 landscape;
//               margin: 5mm;
//             }
//           </style>
//         </head>

//         <body>
//           <div class="toolbar">
//             <button
//               type="button"
//               class="close-button"
//               onclick="window.close()"
//             >
//               Close
//             </button>

//             <button
//               type="button"
//               class="print-button"
//               onclick="window.print()"
//             >
//               Print
//             </button>
//           </div>

//           <main class="page">
//             <header class="header">
//               <div>
//                 <div class="company">
//                   iEDGE SYSTEM
//                 </div>

//                 <h1>
//                   Reimbursement Report
//                 </h1>

//                 <div class="subtitle">
//                   Complete reimbursement report
//                 </div>
//               </div>

//               <div class="print-date">
//                 Printed On

//                 <strong>
//                   ${escapeHtml(new Date().toLocaleString())}
//                 </strong>
//               </div>
//             </header>

//             <div class="summary">
//               <div class="summary-card">
//                 <div class="summary-label">
//                   Total Claims
//                 </div>

//                 <div class="summary-value">
//                   ${totalClaims}
//                 </div>
//               </div>

//               <div class="summary-card">
//                 <div class="summary-label">
//                   Total Claim Amount
//                 </div>

//                 <div class="summary-value">
//                   ${escapeHtml(formatCurrency(filteredAmount))}
//                 </div>
//               </div>

//               <div class="summary-card">
//                 <div class="summary-label">
//                   Total Approved Amount
//                 </div>

//                 <div class="summary-value">
//                   ${escapeHtml(formatCurrency(filteredApprovedAmount))}
//                 </div>
//               </div>

//               <div class="summary-card">
//                 <div class="summary-label">
//                   Total Paid Amount
//                 </div>

//                 <div class="summary-value">
//                   ${escapeHtml(formatCurrency(filteredPaymentPaidAmount))}
//                 </div>
//               </div>
//             </div>

//             <div class="summary second">
//               <div class="summary-card">
//                 <div class="summary-label">
//                   Approved Claims
//                 </div>

//                 <div class="summary-value">
//                   ${totalApprovedClaims}
//                 </div>
//               </div>

//               <div class="summary-card">
//                 <div class="summary-label">
//                   Pending Claims
//                 </div>

//                 <div class="summary-value">
//                   ${totalPendingClaims}
//                 </div>
//               </div>

//               <div class="summary-card">
//                 <div class="summary-label">
//                   Rejected Claims
//                 </div>

//                 <div class="summary-value">
//                   ${totalRejectedClaims}
//                 </div>
//               </div>

//               <div class="summary-card">
//                 <div class="summary-label">
//                   Paid Claims
//                 </div>

//                 <div class="summary-value">
//                   ${totalPaidClaims}
//                 </div>
//               </div>
//             </div>

//             <div class="filter-info">
//               <strong>
//                 Current Filters:
//               </strong>

//               &nbsp;

//               Person:
//               ${personFilter === "all" ? "All" : escapeHtml(personFilter)}

//               &nbsp; | &nbsp;

//               Approval:
//               ${
//                 approvalFilter === "all"
//                   ? "All"
//                   : escapeHtml(formatStatusLabel(approvalFilter))
//               }

//               &nbsp; | &nbsp;

//               Payment:
//               ${
//                 paymentFilter === "all"
//                   ? "All"
//                   : escapeHtml(formatStatusLabel(paymentFilter))
//               }

//               &nbsp; | &nbsp;

//               Search:
//               ${search.trim() ? escapeHtml(search.trim()) : "None"}

//               &nbsp; | &nbsp;

//               Records:
//               ${filteredData.length}
//             </div>

//             <div class="table-wrapper">
//               <table>
//                 <thead>
//                   <tr>
//                     <th>
//                       #
//                     </th>

//                     <th>
//                       Person
//                     </th>

//                     <th>
//                       Client
//                     </th>

//                     <th>
//                       Project
//                     </th>

//                     <th>
//                       Project Code
//                     </th>

//                     <th>
//                       Type
//                     </th>

//                     <th>
//                       Fuel / Food
//                     </th>

//                     <th>
//                       Date
//                     </th>

//                     <th>
//                       Claim Amount
//                     </th>

//                     <th>
//                       Approved
//                     </th>

//                     <th>
//                       Paid
//                     </th>

//                     <th>
//                       Approval
//                     </th>

//                     <th>
//                       Payment
//                     </th>

//                     <th>
//                       Approved By
//                     </th>

//                     <th>
//                       Paid By
//                     </th>

//                     <th>
//                       Details
//                     </th>

//                     <th>
//                       Remarks
//                     </th>
//                   </tr>
//                 </thead>

//                 <tbody>
//                   ${
//                     tableRows ||
//                     `
//                       <tr>
//                         <td
//                           colspan="17"
//                           style="
//                             text-align: center;
//                             padding: 30px;
//                           "
//                         >
//                           No reimbursement records found.
//                         </td>
//                       </tr>
//                     `
//                   }
//                 </tbody>
//               </table>
//             </div>

//             <footer class="footer">
//               iEDGE System - Reimbursement Dashboard
//             </footer>
//           </main>
//         </body>
//       </html>
//     `;

//     printWindow.document.open();
//     printWindow.document.write(reportHtml);
//     printWindow.document.close();
//     printWindow.focus();
//   };

//   return (
//     <div className="space-y-6 p-6">
//       {/* ======================================================
//           HEADER
//       ====================================================== */}

//       <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
//         <div>
//           <h1 className="text-2xl font-semibold tracking-tight text-foreground">
//             Reimbursement Dashboard
//           </h1>

//           <p className="mt-1 text-sm text-muted-foreground">
//             Review, approve, and release reimbursement claims in one place.
//           </p>
//         </div>

//         <div className="flex flex-wrap items-center gap-2">
//           <Button
//             variant="outline"
//             onClick={clearFilters}
//             className="gap-2"
//             data-testid="button-clear-filters"
//           >
//             <RotateCcw className="h-4 w-4" />
//             Reset
//           </Button>

//           <Button
//             variant="outline"
//             onClick={fetchData}
//             className="gap-2"
//             data-testid="button-refresh-reimbursements"
//           >
//             <RefreshCw className="h-4 w-4" />
//             Refresh
//           </Button>

//           {/* MAIN / COMPLETE PRINT VIEW */}
//           <Button
//             onClick={handlePrintAllReimbursements}
//             disabled={filteredData.length === 0}
//             className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
//             data-testid="button-print-all-reimbursements"
//           >
//             <Printer className="h-4 w-4" />
//             Print View
//           </Button>
//         </div>
//       </div>

//       {/* ======================================================
//           DASHBOARD STATS
//       ====================================================== */}

//       <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
//         <StatCard
//           title="Overall Amount"
//           value={formatCurrency(overallAmount)}
//           subtitle={`${data.length} total claims`}
//           icon={<Wallet className="h-5 w-5" />}
//         />

//         <StatCard
//           title="Pending Approval"
//           value={String(pendingApprovalCount)}
//           subtitle="Claims awaiting decision"
//           icon={<Clock3 className="h-5 w-5" />}
//         />

//         <StatCard
//           title="Approved Claims"
//           value={String(approvedCount)}
//           subtitle="Approved reimbursements"
//           icon={<CheckCircle2 className="h-5 w-5" />}
//         />

//         <StatCard
//           title="Paid Amount"
//           value={formatCurrency(paidAmount)}
//           subtitle="Released reimbursements"
//           icon={<CircleDollarSign className="h-5 w-5" />}
//         />
//       </div>

//       {/* ======================================================
//           FILTERS
//       ====================================================== */}

//       <Card className="border-border/60 shadow-sm">
//         <CardContent className="p-4">
//           <div className="mb-4 flex items-center gap-2">
//             <div className="rounded-lg border bg-muted/40 p-2">
//               <Filter className="h-4 w-4 text-muted-foreground" />
//             </div>

//             <div>
//               <h2 className="text-sm font-semibold text-foreground">Filters</h2>

//               <p className="text-xs text-muted-foreground">
//                 Search faster with person, approval, payment, and sorting
//                 filters.
//               </p>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
//             <div className="xl:col-span-2">
//               <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
//                 Search
//               </label>

//               <div className="relative">
//                 <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

//                 <input
//                   placeholder="Search by client, project, person, or details"
//                   className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                   data-testid="input-search-reimbursements"
//                 />
//               </div>
//             </div>

//             <div>
//               <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
//                 Person
//               </label>

//               <div className="relative">
//                 <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

//                 <select
//                   value={personFilter}
//                   onChange={(e) => setPersonFilter(e.target.value)}
//                   className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
//                   data-testid="select-person-filter"
//                 >
//                   <option value="all">All persons</option>

//                   {uniquePeople.map((person) => (
//                     <option key={person} value={person}>
//                       {person}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>

//             <div>
//               <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
//                 Approval Status
//               </label>

//               <select
//                 value={approvalFilter}
//                 onChange={(e) => setApprovalFilter(e.target.value)}
//                 className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
//                 data-testid="select-approval-filter"
//               >
//                 <option value="all">All approval statuses</option>

//                 <option value="pending">Pending</option>

//                 <option value="approved">Approved</option>

//                 <option value="rejected">Rejected</option>
//               </select>
//             </div>

//             <div>
//               <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
//                 Payment / Sort
//               </label>

//               <div className="grid grid-cols-2 gap-2">
//                 <select
//                   value={paymentFilter}
//                   onChange={(e) => setPaymentFilter(e.target.value)}
//                   className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
//                   data-testid="select-payment-filter"
//                 >
//                   <option value="all">All payments</option>

//                   <option value="pending">Pending</option>

//                   <option value="paid">Paid</option>
//                 </select>

//                 <select
//                   value={sortBy}
//                   onChange={(e) => setSortBy(e.target.value)}
//                   className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
//                   data-testid="select-sort-filter"
//                 >
//                   <option value="latest">Latest</option>

//                   <option value="oldest">Oldest</option>

//                   <option value="amount_high">Amount High</option>

//                   <option value="amount_low">Amount Low</option>

//                   <option value="client_az">Client A-Z</option>
//                 </select>
//               </div>
//             </div>
//           </div>

//           <div className="mt-4 flex flex-col gap-2 border-t pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
//             <div className="flex flex-wrap items-center gap-2">
//               <Badge variant="outline" className="gap-1 rounded-full">
//                 <Receipt className="h-3.5 w-3.5" />
//                 Total Claim amount: {formatCurrency(filteredAmount)}
//               </Badge>

//               <Badge
//                 variant="outline"
//                 className="gap-1 rounded-full border-green-200 bg-green-50 text-green-700"
//               >
//                 <CheckCircle2 className="h-3.5 w-3.5" />
//                 Total Approved Amount: {formatCurrency(filteredApprovedAmount)}
//               </Badge>

//               <Badge
//                 variant="outline"
//                 className="gap-1 rounded-full border-blue-200 bg-blue-50 text-blue-700"
//               >
//                 <Wallet className="h-3.5 w-3.5" />
//                 Total Paid Amount: {formatCurrency(filteredPaymentPaidAmount)}
//               </Badge>

//               <Badge
//                 variant="outline"
//                 className="gap-1 rounded-full border-yellow-200 bg-yellow-50 text-yellow-700"
//               >
//                 <Clock3 className="h-3.5 w-3.5" />
//                 Total Pending Amount:{" "}
//                 {formatCurrency(filteredPaymentPendingAmount)}
//               </Badge>
//             </div>

//             <div className="text-xs">
//               Showing filtered claims based on your current filters
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* ======================================================
//           REIMBURSEMENT TABLE
//       ====================================================== */}

//       <Card className="overflow-hidden border-border/60 shadow-sm">
//         <CardContent className="p-0">
//           {loading ? (
//             <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
//               Loading reimbursement claims...
//             </div>
//           ) : filteredData.length === 0 ? (
//             <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
//               <div className="rounded-2xl border bg-muted/40 p-3">
//                 <Receipt className="h-6 w-6 text-muted-foreground" />
//               </div>

//               <h3 className="text-base font-medium text-foreground">
//                 No reimbursement claims found
//               </h3>

//               <p className="max-w-md text-sm text-muted-foreground">
//                 Try changing your search or filters to see more results.
//               </p>
//             </div>
//           ) : (
//             <>
//               <div className="overflow-x-auto">
//                 <table className="w-full min-w-[1400px] text-sm">
//                   <thead className="bg-muted/50">
//                     <tr className="border-b">
//                       <th className="px-4 py-3 text-left font-medium text-muted-foreground">
//                         Claim
//                       </th>

//                       <th className="px-4 py-3 text-left font-medium text-muted-foreground">
//                         Person
//                       </th>

//                       <th className="px-4 py-3 text-left font-medium text-muted-foreground">
//                         Amount
//                       </th>

//                       <th className="px-4 py-3 text-left font-medium text-muted-foreground">
//                         Fuel / Food / Date
//                       </th>

//                       <th className="px-4 py-3 text-left font-medium text-muted-foreground">
//                         Status
//                       </th>

//                       <th className="px-4 py-3 text-left font-medium text-muted-foreground">
//                         Bill
//                       </th>

//                       <th className="px-4 py-3 text-right font-medium text-muted-foreground">
//                         Actions
//                       </th>
//                     </tr>
//                   </thead>

//                   <tbody>
//                     {paginatedData.map((item) => {
//                       const paymentStatus = String(
//                         item.paymentStatus || "pending",
//                       ).toLowerCase();

//                       const actionLocked =
//                         item.status === "approved" ||
//                         item.status === "rejected";

//                       const canReleasePayment =
//                         item.status === "approved" && paymentStatus !== "paid";

//                       return (
//                         <tr
//                           key={`${item.sourcePath || "unknown"}-${
//                             item.recordId || "record"
//                           }-${item.id}`}
//                           className="border-b transition-colors hover:bg-muted/20"
//                         >
//                           <td className="px-4 py-4 align-top">
//                             <div className="space-y-1">
//                               <p className="font-medium text-foreground">
//                                 {item.client}
//                               </p>

//                               <p className="text-xs text-muted-foreground">
//                                 {item.projectName}
//                               </p>

//                               <p className="line-clamp-2 max-w-[280px] text-xs text-muted-foreground">
//                                 {item.details || "No details"}
//                               </p>
//                             </div>
//                           </td>

//                           <td className="px-4 py-4 align-top">
//                             <div className="space-y-1">
//                               <p className="font-medium text-foreground">
//                                 {item.personName || "Unknown"}
//                               </p>

//                               {item.approvedBy && (
//                                 <p className="text-xs text-muted-foreground">
//                                   Approved by {item.approvedBy}
//                                 </p>
//                               )}

//                               {item.paidBy && paymentStatus === "paid" && (
//                                 <p className="text-xs text-green-700">
//                                   Paid by {item.paidBy}
//                                 </p>
//                               )}
//                             </div>
//                           </td>

//                           <td className="px-4 py-4 align-top">
//                             <div className="space-y-3">
//                               <div>
//                                 <p className="font-semibold text-foreground">
//                                   {formatCurrency(item.amount)}
//                                 </p>

//                                 <p className="text-xs text-muted-foreground">
//                                   Claim amount
//                                 </p>
//                               </div>

//                               {(item.status === "approved" ||
//                                 item.status === "rejected") && (
//                                 <div>
//                                   <p
//                                     className={`font-semibold ${
//                                       item.status === "rejected"
//                                         ? "text-red-700"
//                                         : "text-green-700"
//                                     }`}
//                                   >
//                                     {formatCurrency(item.approvedAmount ?? 0)}
//                                   </p>

//                                   <p className="text-xs text-muted-foreground">
//                                     Approved amount
//                                   </p>
//                                 </div>
//                               )}
//                             </div>
//                           </td>

//                           <td className="px-4 py-4 align-top">
//                             <div className="space-y-1">
//                               <p className="text-foreground">
//                                 {item.claimType === "food"
//                                   ? item.foodItem || "Food"
//                                   : `${Number(item.fuelClaim || 0)} KM`}
//                               </p>

//                               <p className="text-xs text-muted-foreground">
//                                 {formatDate(item.submittedDate)}
//                               </p>
//                             </div>
//                           </td>

//                           <td className="px-4 py-4 align-top">
//                             <div className="flex flex-col items-start gap-2">
//                               <Badge
//                                 variant="outline"
//                                 className={`rounded-full ${getApprovalBadgeClass(
//                                   item.rawStatus || item.status,
//                                 )}`}
//                               >
//                                 {formatStatusLabel(
//                                   item.rawStatus || item.status,
//                                 )}
//                               </Badge>

//                               <Badge
//                                 variant="outline"
//                                 className={`rounded-full ${getPaymentBadgeClass(
//                                   item.paymentStatus,
//                                 )}`}
//                               >
//                                 {paymentStatus === "paid"
//                                   ? "Payment Paid"
//                                   : "Payment Pending"}
//                               </Badge>
//                             </div>
//                           </td>

//                           <td className="px-4 py-4 align-top">
//                             {item.billUrl ? (
//                               <a
//                                 href={item.billUrl}
//                                 target="_blank"
//                                 rel="noreferrer"
//                                 className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
//                               >
//                                 <Eye className="h-4 w-4" />
//                                 View Bill
//                               </a>
//                             ) : (
//                               <span className="text-sm text-muted-foreground">
//                                 No Bill
//                               </span>
//                             )}
//                           </td>

//                           <td className="px-4 py-4 align-top">
//                             <div className="flex flex-wrap justify-end gap-2">
//                               {/* VIEW DETAIL */}

//                               <button
//                                 onClick={() => {
//                                   setDetailItem(item);
//                                   setShowDetailModal(true);
//                                 }}
//                                 className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition hover:bg-muted"
//                                 data-testid={`button-view-detail-${item.recordId}-${item.id}`}
//                               >
//                                 <Eye className="h-4 w-4" />
//                                 View Detail
//                               </button>

//                               {/* INDIVIDUAL PRINT VIEW */}

//                               <button
//                                 onClick={() => handlePrintView(item)}
//                                 className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
//                                 data-testid={`button-print-view-${item.recordId}-${item.id}`}
//                               >
//                                 <Printer className="h-4 w-4" />
//                                 Print View
//                               </button>

//                               {/* APPROVE */}

//                               <button
//                                 disabled={actionLocked}
//                                 onClick={() =>
//                                   openApprovalDialog(item, "approved")
//                                 }
//                                 className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition ${
//                                   actionLocked
//                                     ? "cursor-not-allowed bg-muted text-muted-foreground"
//                                     : "bg-green-600 text-white hover:bg-green-700"
//                                 }`}
//                                 data-testid={`button-approve-${item.recordId}-${item.id}`}
//                               >
//                                 <CheckCircle2 className="h-4 w-4" />
//                                 Approve
//                               </button>

//                               {/* REJECT */}

//                               <button
//                                 disabled={actionLocked}
//                                 onClick={() =>
//                                   openApprovalDialog(item, "rejected")
//                                 }
//                                 className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition ${
//                                   actionLocked
//                                     ? "cursor-not-allowed bg-muted text-muted-foreground"
//                                     : "bg-red-600 text-white hover:bg-red-700"
//                                 }`}
//                                 data-testid={`button-reject-${item.recordId}-${item.id}`}
//                               >
//                                 <XCircle className="h-4 w-4" />
//                                 Reject
//                               </button>

//                               {/* RELEASE PAYMENT */}

//                               <button
//                                 disabled={!canReleasePayment}
//                                 onClick={() => {
//                                   setSelectedItem(item);
//                                   setShowPaymentModal(true);
//                                 }}
//                                 className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition ${
//                                   canReleasePayment
//                                     ? "bg-blue-600 text-white hover:bg-blue-700"
//                                     : "cursor-not-allowed bg-muted text-muted-foreground"
//                                 }`}
//                                 data-testid={`button-release-payment-${item.recordId}-${item.id}`}
//                               >
//                                 <Wallet className="h-4 w-4" />

//                                 {paymentStatus === "paid"
//                                   ? "Paid"
//                                   : "Release Payment"}
//                               </button>
//                             </div>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>

//               {/* ==================================================
//                   PAGINATION
//               ================================================== */}

//               <div className="flex flex-col gap-3 border-t px-4 py-4 md:flex-row md:items-center md:justify-between">
//                 <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center">
//                   <span>
//                     Showing {(page - 1) * pageSize + 1} to{" "}
//                     {Math.min(page * pageSize, filteredData.length)} of{" "}
//                     {filteredData.length} claim(s)
//                   </span>

//                   <div className="flex items-center gap-2">
//                     <span>Rows</span>

//                     <select
//                       value={pageSize}
//                       onChange={(e) => setPageSize(Number(e.target.value))}
//                       className="h-9 rounded-lg border border-input bg-background px-2 text-sm outline-none"
//                       data-testid="select-page-size"
//                     >
//                       <option value={5}>5</option>

//                       <option value={10}>10</option>

//                       <option value={20}>20</option>

//                       <option value={50}>50</option>
//                     </select>
//                   </div>
//                 </div>

//                 <div className="flex items-center justify-end gap-2">
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     disabled={page === 1}
//                     onClick={() => setPage((prev) => Math.max(1, prev - 1))}
//                     className="gap-1"
//                     data-testid="button-pagination-prev"
//                   >
//                     <ChevronLeft className="h-4 w-4" />
//                     Prev
//                   </Button>

//                   <div className="rounded-lg border px-3 py-2 text-sm text-foreground">
//                     Page {page} of {totalPages}
//                   </div>

//                   <Button
//                     variant="outline"
//                     size="sm"
//                     disabled={page === totalPages}
//                     onClick={() =>
//                       setPage((prev) => Math.min(totalPages, prev + 1))
//                     }
//                     className="gap-1"
//                     data-testid="button-pagination-next"
//                   >
//                     Next
//                     <ChevronRight className="h-4 w-4" />
//                   </Button>
//                 </div>
//               </div>
//             </>
//           )}
//         </CardContent>
//       </Card>

//       {/* ======================================================
//           APPROVAL MODAL
//       ====================================================== */}

//       <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
//         <DialogContent className="max-w-lg">
//           <DialogHeader>
//             <DialogTitle>
//               {approvalAction === "approved"
//                 ? "Approve Reimbursement"
//                 : "Reject Reimbursement"}
//             </DialogTitle>
//           </DialogHeader>

//           <div className="space-y-4">
//             <div className="rounded-xl border bg-muted/40 p-4">
//               <p className="text-xs text-muted-foreground">Claimed By</p>

//               <p className="font-medium text-foreground">
//                 {selectedItem?.personName || "Unknown"}
//               </p>

//               <div className="mt-3 grid grid-cols-2 gap-3">
//                 <div>
//                   <p className="text-xs text-muted-foreground">Claim Amount</p>

//                   <p className="font-semibold text-foreground">
//                     {formatCurrency(selectedItem?.amount || 0)}
//                   </p>
//                 </div>

//                 <div>
//                   <p className="text-xs text-muted-foreground">Project</p>

//                   <p className="font-medium text-foreground">
//                     {selectedItem?.projectName || "N/A"}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             <div>
//               <Label htmlFor="approvalAmount">Approved Amount</Label>

//               <Input
//                 id="approvalAmount"
//                 type="number"
//                 value={approvalAmount}
//                 onChange={(e) => setApprovalAmount(e.target.value)}
//                 className="mt-1"
//                 placeholder="Enter final approved amount"
//               />
//             </div>

//             <div>
//               <Label htmlFor="approvalRemarks">Remarks</Label>

//               <Textarea
//                 id="approvalRemarks"
//                 value={approvalRemarks}
//                 onChange={(e) => setApprovalRemarks(e.target.value)}
//                 className="mt-1"
//                 placeholder={
//                   approvalAction === "approved"
//                     ? "Enter approval remarks"
//                     : "Enter rejection reason"
//                 }
//                 rows={4}
//               />
//             </div>

//             <div className="flex justify-end gap-2 pt-2">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => setShowApprovalModal(false)}
//                 disabled={approvalSaving}
//               >
//                 Cancel
//               </Button>

//               <Button
//                 type="button"
//                 onClick={submitApprovalDecision}
//                 disabled={approvalSaving}
//                 className={
//                   approvalAction === "approved"
//                     ? "bg-green-600 text-white hover:bg-green-700"
//                     : "bg-red-600 text-white hover:bg-red-700"
//                 }
//               >
//                 {approvalSaving
//                   ? "Saving..."
//                   : approvalAction === "approved"
//                     ? "Approve"
//                     : "Reject"}
//               </Button>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>

//       {/* ======================================================
//           DETAIL MODAL
//       ====================================================== */}

//       <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
//         <DialogContent className="max-w-lg">
//           <DialogHeader>
//             <DialogTitle>Reimbursement Detail</DialogTitle>
//           </DialogHeader>

//           {detailItem && (
//             <div className="space-y-4">
//               <div className="rounded-xl border bg-muted/40 p-4">
//                 <p className="text-xs text-muted-foreground">Client</p>

//                 <p className="font-semibold text-foreground">
//                   {detailItem.client}
//                 </p>

//                 <p className="mt-2 text-xs text-muted-foreground">Project</p>

//                 <p className="text-sm text-foreground">
//                   {detailItem.projectName}
//                 </p>
//               </div>

//               <div className="grid grid-cols-2 gap-3">
//                 <div className="rounded-xl border p-3">
//                   <p className="text-xs text-muted-foreground">Claim Amount</p>

//                   <p className="font-semibold text-foreground">
//                     {formatCurrency(detailItem.amount)}
//                   </p>
//                 </div>

//                 <div className="rounded-xl border p-3">
//                   <p className="text-xs text-muted-foreground">
//                     Approved Amount
//                   </p>

//                   <p className="font-semibold text-green-700">
//                     {formatCurrency(detailItem.approvedAmount ?? 0)}
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-3">
//                 <div className="rounded-xl border p-3">
//                   <p className="text-xs text-muted-foreground">Claimed By</p>

//                   <p className="text-sm font-medium text-foreground">
//                     {detailItem.personName || "Unknown"}
//                   </p>
//                 </div>

//                 <div className="rounded-xl border p-3">
//                   <p className="text-xs text-muted-foreground">
//                     {detailItem.claimType === "food"
//                       ? "Food Item"
//                       : "Fuel Claim"}
//                   </p>

//                   <p className="text-sm font-medium text-foreground">
//                     {detailItem.claimType === "food"
//                       ? detailItem.foodItem || "Food"
//                       : `${Number(detailItem.fuelClaim || 0)} KM`}
//                   </p>
//                 </div>
//               </div>

//               <div className="rounded-xl border p-3">
//                 <p className="text-xs text-muted-foreground">Details</p>

//                 <p className="mt-1 text-sm text-foreground">
//                   {detailItem.details || "No details"}
//                 </p>
//               </div>

//               <div className="rounded-xl border p-3">
//                 <p className="text-xs text-muted-foreground">
//                   Approval Remarks
//                 </p>

//                 <p className="mt-1 text-sm text-foreground">
//                   {detailItem.approvalRemarks || "No remarks added"}
//                 </p>
//               </div>

//               <div className="grid grid-cols-2 gap-3">
//                 <div className="rounded-xl border p-3">
//                   <p className="text-xs text-muted-foreground">
//                     Approval Status
//                   </p>

//                   <Badge
//                     variant="outline"
//                     className={`mt-1 rounded-full ${getApprovalBadgeClass(
//                       detailItem.rawStatus || detailItem.status,
//                     )}`}
//                   >
//                     {formatStatusLabel(
//                       detailItem.rawStatus || detailItem.status,
//                     )}
//                   </Badge>
//                 </div>

//                 <div className="rounded-xl border p-3">
//                   <p className="text-xs text-muted-foreground">
//                     Payment Status
//                   </p>

//                   <Badge
//                     variant="outline"
//                     className={`mt-1 rounded-full ${getPaymentBadgeClass(
//                       detailItem.paymentStatus,
//                     )}`}
//                   >
//                     {String(
//                       detailItem.paymentStatus || "pending",
//                     ).toLowerCase() === "paid"
//                       ? "Payment Paid"
//                       : "Payment Pending"}
//                   </Badge>
//                 </div>
//               </div>

//               <div className="rounded-xl border p-3">
//                 <p className="text-xs text-muted-foreground">Approved By</p>

//                 <p className="text-sm text-foreground">
//                   {detailItem.approvedBy || "Not approved yet"}
//                 </p>
//               </div>

//               {detailItem.billUrl && (
//                 <a
//                   href={detailItem.billUrl}
//                   target="_blank"
//                   rel="noreferrer"
//                   className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
//                 >
//                   <Eye className="h-4 w-4" />
//                   View Bill
//                 </a>
//               )}

//               <div className="flex justify-end">
//                 <Button
//                   variant="outline"
//                   onClick={() => {
//                     setShowDetailModal(false);
//                     setDetailItem(null);
//                   }}
//                 >
//                   Close
//                 </Button>
//               </div>
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>

//       {/* ======================================================
//           PAYMENT RELEASE MODAL
//       ====================================================== */}

//       <PaymentReleaseModal
//         isOpen={showPaymentModal}
//         onClose={() => {
//           setShowPaymentModal(false);
//           setSelectedItem(null);
//         }}
//         onSuccess={fetchData}
//         title="Release Reimbursement Payment"
//         context={selectedItem}
//         docPath={(item) =>
//           item.sourcePath === "claim"
//             ? ["Panels", PANEL_ID, "claimReimbursements", item.id]
//             : item.sourcePath === "root"
//               ? ["salesRecords", item.recordId, "meetingUpdates", item.id]
//               : [
//                   "Panels",
//                   PANEL_ID,
//                   "salesRecords",
//                   item.recordId,
//                   "meetingUpdates",
//                   item.id,
//                 ]
//         }
//         amount={Number(
//           selectedItem?.approvedAmount ?? selectedItem?.amount ?? 0,
//         )}
//         amountLabel="Approved Amount"
//         partyLabel="Claimed By"
//         parties={selectedItem?.personName ? [selectedItem.personName] : []}
//         initialPaymentMethod="cash"
//         buildUpdateData={({ formData, receiptUrl, selectedAccount, actor }) => {
//           if (selectedItem?.sourcePath === "claim") {
//             return {
//               paymentStatus: "paid",

//               paidBy: actor.displayName || actor.email || "Unknown",

//               paidById: actor.uid || "",

//               paymentType: formData.paymentMethod,

//               paidAmount: Number(formData.amount),

//               transactionReference: formData.transactionReference,

//               paymentNotes: formData.paymentNotes,

//               paymentReceiptUrl: receiptUrl,

//               paymentReleasedAt: serverTimestamp(),

//               updatedAt: serverTimestamp(),

//               ...(formData.chequeNumber
//                 ? {
//                     chequeNumber: formData.chequeNumber,
//                   }
//                 : {}),

//               ...(selectedAccount
//                 ? {
//                     selectedAccount,
//                   }
//                 : {}),
//             };
//           }

//           return {
//             "reimbursement.paymentStatus": "paid",

//             "reimbursement.paidBy":
//               actor.displayName || actor.email || "Unknown",

//             "reimbursement.paidById": actor.uid || "",

//             "reimbursement.paymentType": formData.paymentMethod,

//             "reimbursement.paidAmount": Number(formData.amount),

//             "reimbursement.transactionReference": formData.transactionReference,

//             "reimbursement.paymentNotes": formData.paymentNotes,

//             "reimbursement.paymentReceiptUrl": receiptUrl,

//             "reimbursement.paymentReleasedAt": serverTimestamp(),

//             "reimbursement.updatedAt": serverTimestamp(),

//             ...(formData.chequeNumber
//               ? {
//                   "reimbursement.chequeNumber": formData.chequeNumber,
//                 }
//               : {}),

//             ...(selectedAccount
//               ? {
//                   "reimbursement.selectedAccount": selectedAccount,
//                 }
//               : {}),
//           };
//         }}
//       />
//     </div>
//   );
// }

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import PaymentReleaseModal from "@/components/PaymentReleaseModal";
import {
  buildReimbursementPdfBlob,
  buildReimbursementReportPdfBlob,
  printPdfBlob,
  type ReimbursementPdfData,
  type ReimbursementReportPdfData,
} from "@/lib/reimbursementPdf";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Users,
  Wallet,
  CheckCircle2,
  Clock3,
  XCircle,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Receipt,
  CircleDollarSign,
  RotateCcw,
  Check,
  Pencil,
  Loader2,
  Printer,
  FileText,
  Download,
  ExternalLink,
  Hash,
} from "lucide-react";

const PANEL_ID = "IEDGE-SYSTEM";

// Approval and payment release are strictly role-based:
// only Admin can approve/reject, only Finance can release payment.
const getRoleKey = (role: any) =>
  String(role || "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");

const ADMIN_ROLE_KEYS = ["admin", "main_admin", "super_admin"];
const FINANCE_ROLE_KEYS = ["finance", "financial_admin", "finance_admin"];

const canApproveReimbursements = (role: any) =>
  ADMIN_ROLE_KEYS.includes(getRoleKey(role));

const canReleaseReimbursementPayments = (role: any) =>
  FINANCE_ROLE_KEYS.includes(getRoleKey(role));

// A release can carry several cheques; older records only have chequeNumber.
const getChequeNumbersText = (source: any) => {
  const values = Array.isArray(source?.chequeNumbers)
    ? source.chequeNumbers
    : [source?.chequeNumber];

  return Array.from(
    new Set(
      values.map((value: any) => String(value ?? "").trim()).filter(Boolean),
    ),
  ).join(", ");
};

interface Reimbursement {
  id: string;
  recordId: string;
  client: string;
  amount: number;
  approvedAmount?: number;
  paidAmount?: number;
  approvalRemarks?: string;
  approvalDecisionAt?: any;
  sourcePath?: "panel" | "root" | "claim";
  status: string;
  rawStatus?: string;
  billUrl?: string;
  personName?: string;
  submittedDate?: any;
  fuelClaim?: number;
  details?: string;
  projectName?: string;
  approvedBy?: string;
  paymentStatus?: string;
  paidBy?: string;
  paymentType?: string;
  chequeNumber?: string;
  transactionReference?: string;
  paymentReleasedAt?: any;

  claimFor?: "project" | "general";
  claimType?: "fuel" | "food";
  projectCode?: string;
  foodItem?: string;
  billImagePublicId?: string;
}

const normalizeReimbursementStatus = (value: string) => {
  const status = String(value || "")
    .trim()
    .toLowerCase();

  if (status === "pending_admin_approval") return "pending";
  if (status === "pending") return "pending";
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";

  return "pending";
};

const formatStatusLabel = (value?: string) => {
  const raw = String(value || "").trim();

  if (!raw) return "Pending";

  return raw
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getSortableTime = (date: any) => {
  if (!date) return 0;

  try {
    if (date?.toDate) return date.toDate().getTime();
    if (date?.seconds) return date.seconds * 1000;

    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) return parsed.getTime();

    return 0;
  } catch {
    return 0;
  }
};

const formatDate = (date: any) => {
  if (!date) return "N/A";

  try {
    if (date?.toDate) return date.toDate().toLocaleDateString();

    if (date?.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString();
    }

    if (typeof date === "string") {
      const parsed = new Date(date);

      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString();
      }
    }

    return "Invalid";
  } catch {
    return "Invalid";
  }
};

const formatCurrency = (value: number) => {
  return `Rs ${Number(value || 0).toLocaleString()}`;
};

const getApprovalBadgeClass = (status?: string) => {
  const normalized = normalizeReimbursementStatus(String(status || ""));

  switch (normalized) {
    case "approved":
      return "bg-green-100 text-green-700 border-green-200";
    case "rejected":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
  }
};

const getPaymentBadgeClass = (status?: string) => {
  const normalized = String(status || "pending").toLowerCase();

  switch (normalized) {
    case "paid":
      return "bg-green-100 text-green-700 border-green-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const SORT_LABELS: Record<string, string> = {
  latest: "Latest",
  oldest: "Oldest",
  amount_high: "Amount High",
  amount_low: "Amount Low",
  client_az: "Client A-Z",
};

const isPaidItem = (item: Reimbursement) =>
  String(item.paymentStatus || "pending").toLowerCase() === "paid";

const getClaimTypeLabel = (item: Reimbursement) =>
  item.claimType === "food"
    ? "Food"
    : item.claimType === "fuel" || Number(item.fuelClaim || 0) > 0
      ? "Fuel"
      : "Reimbursement";

const getFuelFoodLabel = (item: Reimbursement) =>
  item.claimType === "food"
    ? item.foodItem || "Food"
    : Number(item.fuelClaim || 0) > 0
      ? `${Number(item.fuelClaim || 0)} KM`
      : "N/A";

const getPaidAmountLabel = (item: Reimbursement) =>
  item.paidAmount !== undefined
    ? formatCurrency(item.paidAmount)
    : isPaidItem(item)
      ? formatCurrency(item.approvedAmount ?? item.amount)
      : "N/A";

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
}) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {title}
            </p>

            <p className="mt-2 text-2xl font-semibold text-foreground">
              {value}
            </p>

            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>

          <div className="rounded-xl border bg-muted/40 p-2.5 text-muted-foreground">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReimbursementDashboard() {
  const { userProfile, currentUser } = useAuth();

  const canApprove = canApproveReimbursements(userProfile?.role);
  const canReleasePayments = canReleaseReimbursementPayments(
    userProfile?.role,
  );

  const [data, setData] = useState<Reimbursement[]>([]);
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [personFilter, setPersonFilter] = useState("all");
  const [chequeFilter, setChequeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Reimbursement | null>(null);

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<
    "approved" | "rejected" | null
  >(null);
  const [approvalAmount, setApprovalAmount] = useState("");
  const [approvalRemarks, setApprovalRemarks] = useState("");
  const [approvalSaving, setApprovalSaving] = useState(false);
  const [quickApprovingKey, setQuickApprovingKey] = useState<string | null>(
    null,
  );

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailItem, setDetailItem] = useState<Reimbursement | null>(null);

  const [pdfBusyKey, setPdfBusyKey] = useState<string | null>(null);
  const [pdfPreviewMeta, setPdfPreviewMeta] = useState<{
    title: string;
    fileName: string;
  } | null>(null);
  const [pdfPreviewBlob, setPdfPreviewBlob] = useState<Blob | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const pdfPreviewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrlRef.current) {
        URL.revokeObjectURL(pdfPreviewUrlRef.current);
      }
    };
  }, []);

  const getReimbursementDocRef = (item: Reimbursement) => {
    if (item.sourcePath === "claim") {
      return doc(db, "Panels", PANEL_ID, "claimReimbursements", item.id);
    }

    if (item.sourcePath === "root") {
      return doc(db, "salesRecords", item.recordId, "meetingUpdates", item.id);
    }

    return doc(
      db,
      "Panels",
      PANEL_ID,
      "salesRecords",
      item.recordId,
      "meetingUpdates",
      item.id,
    );
  };

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const panelRecordsSnap = await getDocs(
        collection(db, "Panels", PANEL_ID, "salesRecords"),
      );

      let legacyRecordDocs: any[] = [];

      try {
        const legacyRecordsSnap = await getDocs(collection(db, "salesRecords"));
        legacyRecordDocs = legacyRecordsSnap.docs;
      } catch (legacyRecordError) {
        console.warn(
          "Legacy salesRecords path not available:",
          legacyRecordError,
        );
      }

      const recordMap = new Map<
        string,
        {
          id: string;
          data: any;
        }
      >();

      panelRecordsSnap.docs.forEach((record) => {
        recordMap.set(record.id, {
          id: record.id,
          data: record.data(),
        });
      });

      legacyRecordDocs.forEach((record) => {
        if (!recordMap.has(record.id)) {
          recordMap.set(record.id, {
            id: record.id,
            data: record.data(),
          });
        }
      });

      const recordResults = await Promise.allSettled(
        Array.from(recordMap.values()).map(async (record) => {
          const recordId = record.id;
          const recordData = record.data;

          const meetingDocsWithSource: Array<{
            meetingDoc: any;
            sourcePath: "panel" | "root";
          }> = [];

          try {
            const panelMeetingsSnap = await getDocs(
              collection(
                db,
                "Panels",
                PANEL_ID,
                "salesRecords",
                recordId,
                "meetingUpdates",
              ),
            );

            panelMeetingsSnap.docs.forEach((meetingDoc) => {
              meetingDocsWithSource.push({
                meetingDoc,
                sourcePath: "panel",
              });
            });
          } catch (panelMeetingError) {
            console.error(
              `Error fetching panel meetingUpdates for record ${recordId}:`,
              panelMeetingError,
            );
          }

          try {
            const legacyMeetingsSnap = await getDocs(
              collection(db, "salesRecords", recordId, "meetingUpdates"),
            );

            legacyMeetingsSnap.docs.forEach((meetingDoc) => {
              meetingDocsWithSource.push({
                meetingDoc,
                sourcePath: "root",
              });
            });
          } catch (legacyMeetingError) {
            console.warn(
              `Legacy meetingUpdates path not available for record ${recordId}:`,
              legacyMeetingError,
            );
          }

          const seenMeetings = new Set<string>();

          return meetingDocsWithSource
            .map(({ meetingDoc, sourcePath }) => {
              const meetingKey = `${sourcePath}-${meetingDoc.id}`;

              if (seenMeetings.has(meetingKey)) return null;

              seenMeetings.add(meetingKey);

              const meeting: any = meetingDoc.data();
              const reimbursement = meeting?.reimbursement;

              if (!reimbursement?.enabled) return null;

              return {
                id: meetingDoc.id,
                recordId,
                client: recordData.client || "Unknown",
                projectName: recordData.projectName || "N/A",
                amount: Number(reimbursement.amount || 0),
                approvedAmount:
                  reimbursement.approvedAmount !== undefined
                    ? Number(reimbursement.approvedAmount || 0)
                    : undefined,
                paidAmount:
                  reimbursement.paidAmount !== undefined
                    ? Number(reimbursement.paidAmount || 0)
                    : undefined,
                approvalRemarks: reimbursement.approvalRemarks || "",
                approvalDecisionAt: reimbursement.approvalDecisionAt || null,
                sourcePath,
                rawStatus: String(
                  reimbursement.approvalStatus || "pending_admin_approval",
                ),
                status: normalizeReimbursementStatus(
                  reimbursement.approvalStatus || "pending_admin_approval",
                ),
                billUrl: reimbursement.billUrl || "",
                personName:
                  reimbursement.approvalSubmittedByName ||
                  reimbursement.personName ||
                  "Unknown",
                submittedDate:
                  reimbursement.approvalSubmittedAt ||
                  reimbursement.submittedAt ||
                  reimbursement.createdAt ||
                  reimbursement.date ||
                  reimbursement.meetingDate ||
                  meeting.reimbursementSubmittedAt ||
                  meeting.submittedAt ||
                  meeting.updatedAt ||
                  meeting.createdAt ||
                  meeting.meetingDate ||
                  null,
                fuelClaim: Number(reimbursement.kms || reimbursement.km || 0),
                details:
                  reimbursement.detail || reimbursement.description || "N/A",
                approvedBy: reimbursement.approvedBy || "",
                paymentStatus: reimbursement.paymentStatus || "pending",
                paidBy: reimbursement.paidBy || "",
                paymentType: reimbursement.paymentType || "",
                chequeNumber: getChequeNumbersText(reimbursement),
                transactionReference: reimbursement.transactionReference || "",
                paymentReleasedAt: reimbursement.paymentReleasedAt || null,
              } as Reimbursement;
            })
            .filter(Boolean) as Reimbursement[];
        }),
      );

      const meetingRows = recordResults
        .filter(
          (result): result is PromiseFulfilledResult<Reimbursement[]> =>
            result.status === "fulfilled",
        )
        .flatMap((result) => result.value);

      let claimRows: Reimbursement[] = [];

      try {
        const claimReimbursementsSnap = await getDocs(
          collection(db, "Panels", PANEL_ID, "claimReimbursements"),
        );

        claimRows = claimReimbursementsSnap.docs.map((claimDoc) => {
          const claim: any = claimDoc.data();

          const claimFor = claim.claimFor === "project" ? "project" : "general";
          const claimType = claim.claimType === "food" ? "food" : "fuel";
          const isProjectClaim = claimFor === "project";
          const isFuelClaim = claimType === "fuel";

          const rawStatus = String(
            claim.status || claim.approvalStatus || "pending",
          );

          return {
            id: claimDoc.id,
            recordId: "claimReimbursements",
            sourcePath: "claim",

            client: isProjectClaim
              ? "Project Reimbursement"
              : "General Reimbursement",

            projectName: isProjectClaim
              ? claim.projectCode || "Project"
              : "General",

            claimFor,
            claimType,
            projectCode: claim.projectCode || "",
            foodItem: claim.foodItem || "",

            amount: Number(claim.claimAmount || claim.amount || 0),

            approvedAmount:
              claim.approvedAmount !== undefined
                ? Number(claim.approvedAmount || 0)
                : undefined,

            paidAmount:
              claim.paidAmount !== undefined
                ? Number(claim.paidAmount || 0)
                : undefined,

            approvalRemarks: claim.approvalRemarks || "",
            approvalDecisionAt: claim.approvalDecisionAt || null,

            rawStatus,
            status: normalizeReimbursementStatus(rawStatus),

            billUrl: claim.billImageUrl || claim.billUrl || "",
            billImagePublicId: claim.billImagePublicId || "",

            personName:
              claim.submittedByName ||
              claim.createdByName ||
              claim.userName ||
              "Unknown",

            submittedDate:
              claim.submittedAt || claim.createdAt || claim.updatedAt || null,

            fuelClaim: isFuelClaim ? Number(claim.km || claim.kms || 0) : 0,

            details:
              claim.description ||
              (isFuelClaim
                ? `Fuel claim${claim.km ? ` - ${claim.km} KM` : ""}`
                : `Food claim${claim.foodItem ? ` - ${claim.foodItem}` : ""}`),

            approvedBy: claim.approvedBy || "",
            paymentStatus: claim.paymentStatus || "pending",
            paidBy: claim.paidBy || "",
            paymentType: claim.paymentType || "",
            chequeNumber: getChequeNumbersText(claim),
            transactionReference: claim.transactionReference || "",
            paymentReleasedAt: claim.paymentReleasedAt || null,
          };
        });
      } catch (claimError) {
        console.error("Error fetching claim reimbursements:", claimError);
      }

      const rows = [...meetingRows, ...claimRows];

      rows.sort(
        (a, b) =>
          getSortableTime(b.submittedDate) - getSortableTime(a.submittedDate),
      );

      setData(rows);
    } catch (error) {
      console.error("Error fetching reimbursements:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const uniquePeople = useMemo(() => {
    return Array.from(
      new Set(
        data.map(
          (item) => String(item.personName || "Unknown").trim() || "Unknown",
        ),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();
    const chequeQuery = chequeFilter.trim().toLowerCase();

    const rows = data.filter((item) => {
      const matchesApproval =
        approvalFilter === "all" || item.status === approvalFilter;

      const payment = String(item.paymentStatus || "pending").toLowerCase();
      const matchesPayment =
        paymentFilter === "all" || payment === paymentFilter;

      const person = String(item.personName || "Unknown").trim() || "Unknown";
      const matchesPerson = personFilter === "all" || person === personFilter;

      const matchesCheque =
        !chequeQuery ||
        String(item.chequeNumber || "")
          .toLowerCase()
          .includes(chequeQuery);

      const matchesSearch =
        !query ||
        item.client?.toLowerCase().includes(query) ||
        item.personName?.toLowerCase().includes(query) ||
        item.projectName?.toLowerCase().includes(query) ||
        item.details?.toLowerCase().includes(query) ||
        item.projectCode?.toLowerCase().includes(query) ||
        item.foodItem?.toLowerCase().includes(query) ||
        item.claimType?.toLowerCase().includes(query) ||
        item.claimFor?.toLowerCase().includes(query);

      return (
        matchesApproval &&
        matchesPayment &&
        matchesPerson &&
        matchesCheque &&
        matchesSearch
      );
    });

    rows.sort((a, b) => {
      if (sortBy === "latest") {
        return (
          getSortableTime(b.submittedDate) - getSortableTime(a.submittedDate)
        );
      }

      if (sortBy === "oldest") {
        return (
          getSortableTime(a.submittedDate) - getSortableTime(b.submittedDate)
        );
      }

      if (sortBy === "amount_high") {
        return b.amount - a.amount;
      }

      if (sortBy === "amount_low") {
        return a.amount - b.amount;
      }

      if (sortBy === "client_az") {
        return String(a.client || "").localeCompare(String(b.client || ""));
      }

      return 0;
    });

    return rows;
  }, [
    data,
    approvalFilter,
    paymentFilter,
    personFilter,
    chequeFilter,
    search,
    sortBy,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    approvalFilter,
    paymentFilter,
    personFilter,
    chequeFilter,
    search,
    sortBy,
    pageSize,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const overallAmount = useMemo(() => {
    return data.reduce((sum, item) => sum + item.amount, 0);
  }, [data]);

  const pendingApprovalCount = useMemo(() => {
    return data.filter((item) => item.status === "pending").length;
  }, [data]);

  const approvedCount = useMemo(() => {
    return data.filter((item) => item.status === "approved").length;
  }, [data]);

  const paidAmount = useMemo(() => {
    return data
      .filter(
        (item) => String(item.paymentStatus || "").toLowerCase() === "paid",
      )
      .reduce(
        (sum, item) =>
          sum +
          Number(item.paidAmount ?? item.approvedAmount ?? item.amount ?? 0),
        0,
      );
  }, [data]);

  const filteredApprovedAmount = useMemo(() => {
    return filteredData
      .filter((item) => item.status === "approved")
      .reduce(
        (sum, item) => sum + Number(item.approvedAmount ?? item.amount ?? 0),
        0,
      );
  }, [filteredData]);

  const filteredPaymentPaidAmount = useMemo(() => {
    return filteredData
      .filter(
        (item) =>
          item.status === "approved" &&
          String(item.paymentStatus || "pending").toLowerCase() === "paid",
      )
      .reduce(
        (sum, item) =>
          sum +
          Number(item.paidAmount ?? item.approvedAmount ?? item.amount ?? 0),
        0,
      );
  }, [filteredData]);

  const filteredPaymentPendingAmount = useMemo(() => {
    return filteredData
      .filter(
        (item) =>
          item.status === "approved" &&
          String(item.paymentStatus || "pending").toLowerCase() !== "paid",
      )
      .reduce(
        (sum, item) => sum + Number(item.approvedAmount ?? item.amount ?? 0),
        0,
      );
  }, [filteredData]);

  const filteredAmount = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.amount, 0);
  }, [filteredData]);

  const clearFilters = () => {
    setApprovalFilter("all");
    setPaymentFilter("all");
    setPersonFilter("all");
    setChequeFilter("");
    setSearch("");
    setSortBy("latest");
    setPage(1);
  };

  const openApprovalDialog = (
    item: Reimbursement,
    status: "approved" | "rejected",
  ) => {
    if (!canApprove) {
      alert("Only Admin can approve or reject reimbursement requests.");
      return;
    }

    setSelectedItem(item);
    setApprovalAction(status);
    setApprovalAmount(String(item.approvedAmount ?? item.amount ?? 0));
    setApprovalRemarks(item.approvalRemarks || "");
    setShowApprovalModal(true);
  };

  const submitApprovalDecision = async () => {
    if (!selectedItem || !approvalAction) return;

    if (!canApprove) {
      alert("Only Admin can approve or reject reimbursement requests.");
      return;
    }

    if (selectedItem.status !== "pending") {
      alert("This reimbursement request has already been decided.");
      return;
    }

    const finalAmount = Number(approvalAmount || 0);

    if (finalAmount < 0) {
      alert("Approved amount cannot be negative.");
      return;
    }

    if (!approvalRemarks.trim()) {
      alert("Please enter remarks before saving.");
      return;
    }

    setApprovalSaving(true);

    try {
      if (selectedItem.sourcePath === "claim") {
        const claimPayload: Record<string, any> = {
          status: approvalAction,
          approvalStatus: approvalAction,
          approvedAmount: finalAmount,
          approvalRemarks: approvalRemarks.trim(),
          approvedBy:
            userProfile?.displayName || currentUser?.email || "Unknown",
          approvedById: currentUser?.uid || "",
          approvalDecisionAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        if (approvalAction === "approved") {
          claimPayload.paymentStatus = "pending";
        }

        await updateDoc(getReimbursementDocRef(selectedItem), claimPayload);
      } else {
        const payload: Record<string, any> = {
          "reimbursement.approvalStatus": approvalAction,
          "reimbursement.approvedAmount": finalAmount,
          "reimbursement.approvalRemarks": approvalRemarks.trim(),
          "reimbursement.approvedBy":
            userProfile?.displayName || currentUser?.email || "Unknown",
          "reimbursement.approvedById": currentUser?.uid || "",
          "reimbursement.approvalDecisionAt": serverTimestamp(),
          "reimbursement.updatedAt": serverTimestamp(),
        };

        if (approvalAction === "approved") {
          payload["reimbursement.paymentStatus"] = "pending";
        }

        await updateDoc(getReimbursementDocRef(selectedItem), payload);
      }

      setShowApprovalModal(false);
      setSelectedItem(null);
      setApprovalAction(null);
      setApprovalAmount("");
      setApprovalRemarks("");

      await fetchData(true);
    } catch (error) {
      console.error("Approval update failed:", error);
    } finally {
      setApprovalSaving(false);
    }
  };

  // One-click approve at the claimed amount, with no editing — the
  // "Partially Approve" button still opens the dialog above for that.
  const handleQuickApprove = async (item: Reimbursement) => {
    if (!canApprove) {
      alert("Only Admin can approve reimbursement requests.");
      return;
    }

    if (item.status !== "pending") return;

    const key = `${item.sourcePath || "unknown"}-${item.recordId || "record"}-${item.id}`;
    setQuickApprovingKey(key);

    try {
      const finalAmount = Number(item.amount || 0);

      if (item.sourcePath === "claim") {
        await updateDoc(getReimbursementDocRef(item), {
          status: "approved",
          approvalStatus: "approved",
          approvedAmount: finalAmount,
          approvalRemarks: "Approved as submitted",
          approvedBy:
            userProfile?.displayName || currentUser?.email || "Unknown",
          approvedById: currentUser?.uid || "",
          approvalDecisionAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          paymentStatus: "pending",
        });
      } else {
        await updateDoc(getReimbursementDocRef(item), {
          "reimbursement.approvalStatus": "approved",
          "reimbursement.approvedAmount": finalAmount,
          "reimbursement.approvalRemarks": "Approved as submitted",
          "reimbursement.approvedBy":
            userProfile?.displayName || currentUser?.email || "Unknown",
          "reimbursement.approvedById": currentUser?.uid || "",
          "reimbursement.approvalDecisionAt": serverTimestamp(),
          "reimbursement.updatedAt": serverTimestamp(),
          "reimbursement.paymentStatus": "pending",
        });
      }

      await fetchData(true);
    } catch (error) {
      console.error("Quick approval failed:", error);
    } finally {
      setQuickApprovingKey(null);
    }
  };

  const openPaymentRelease = (item: Reimbursement) => {
    if (!canReleasePayments) {
      alert("Only Finance can release reimbursement payments.");
      return;
    }

    const paymentStatus = String(item.paymentStatus || "pending").toLowerCase();

    if (item.status !== "approved" || paymentStatus === "paid") {
      alert("Payment can only be released for approved, unpaid requests.");
      return;
    }

    setSelectedItem(item);
    setShowPaymentModal(true);
  };

  const getRowKey = (item: Reimbursement) =>
    `${item.sourcePath || "unknown"}-${item.recordId || "record"}-${item.id}`;

  const buildPdfData = (item: Reimbursement): ReimbursementPdfData => {
    const isPaid = isPaidItem(item);

    const claimFor =
      item.claimFor === "project"
        ? "Project"
        : item.claimFor === "general"
          ? "General"
          : item.projectName && item.projectName !== "N/A"
            ? "Project"
            : "N/A";

    return {
      reference: item.id,
      claimInformation: [
        { label: "Claimed By", value: item.personName || "Unknown" },
        { label: "Submitted Date", value: formatDate(item.submittedDate) },
        { label: "Client", value: item.client || "N/A" },
        { label: "Project", value: item.projectName || "N/A" },
        { label: "Claim For", value: claimFor },
        { label: "Claim Type", value: getClaimTypeLabel(item) },
        { label: "Project Code", value: item.projectCode || "N/A" },
        {
          label: item.claimType === "food" ? "Food Item" : "Fuel / KM",
          value: getFuelFoodLabel(item),
        },
      ],
      amountInformation: [
        { label: "Claim Amount", value: formatCurrency(item.amount) },
        {
          label: "Approved Amount",
          value:
            item.approvedAmount !== undefined
              ? formatCurrency(item.approvedAmount)
              : "N/A",
        },
        {
          label: "Paid Amount",
          value: getPaidAmountLabel(item),
        },
        {
          label: "Payment Status",
          value: isPaid ? "Payment Paid" : "Payment Pending",
        },
      ],
      approvalInformation: [
        {
          label: "Approval Status",
          value: formatStatusLabel(item.rawStatus || item.status),
        },
        { label: "Approved By", value: item.approvedBy || "Not approved yet" },
        {
          label: "Approval Date",
          value: item.approvalDecisionAt
            ? formatDate(item.approvalDecisionAt)
            : "N/A",
        },
      ],
      paymentInformation: [
        { label: "Paid By", value: item.paidBy || "Not paid yet" },
        {
          label: "Payment Date",
          value: item.paymentReleasedAt
            ? formatDate(item.paymentReleasedAt)
            : "N/A",
        },
        {
          label: "Payment Method",
          value: item.paymentType ? formatStatusLabel(item.paymentType) : "N/A",
        },
        { label: "Cheque Number", value: item.chequeNumber || "N/A" },
        {
          label: "Transaction Ref.",
          value: item.transactionReference || "N/A",
        },
      ],
      details: item.details || "No details",
      approvalRemarks: item.approvalRemarks || "",
      billUrl: item.billUrl || undefined,
    };
  };

  const buildReportPdfData = (): ReimbursementReportPdfData => {
    const countWhere = (predicate: (item: Reimbursement) => boolean) =>
      String(filteredData.filter(predicate).length);

    return {
      filters: [
        { label: "Search", value: search.trim() || "None" },
        {
          label: "Person",
          value: personFilter === "all" ? "All persons" : personFilter,
        },
        { label: "Cheque Number", value: chequeFilter.trim() || "Any" },
        {
          label: "Approval Status",
          value:
            approvalFilter === "all"
              ? "All"
              : formatStatusLabel(approvalFilter),
        },
        {
          label: "Payment Status",
          value:
            paymentFilter === "all" ? "All" : formatStatusLabel(paymentFilter),
        },
        { label: "Sort", value: SORT_LABELS[sortBy] || sortBy },
      ],
      summary: [
        { label: "Total Claims", value: String(filteredData.length) },
        {
          label: "Pending",
          value: countWhere((item) => item.status === "pending"),
        },
        {
          label: "Approved",
          value: countWhere((item) => item.status === "approved"),
        },
        {
          label: "Rejected",
          value: countWhere((item) => item.status === "rejected"),
        },
        { label: "Paid", value: countWhere((item) => isPaidItem(item)) },
        { label: "Claim Amount", value: formatCurrency(filteredAmount) },
        {
          label: "Approved Amount",
          value: formatCurrency(filteredApprovedAmount),
        },
        {
          label: "Paid Amount",
          value: formatCurrency(filteredPaymentPaidAmount),
        },
        {
          label: "Pending Amount",
          value: formatCurrency(filteredPaymentPendingAmount),
        },
      ],
      columns: [
        "#",
        "Claimed By",
        "Client / Project",
        "Type",
        "Fuel / Food",
        "Submitted",
        "Claim Amount",
        "Approved Amount",
        "Paid Amount",
        "Approval",
        "Payment",
        "Cheque No.",
        "Approved By",
        "Paid By",
        "Details",
      ],
      rows: filteredData.map((item, index) => [
        String(index + 1),
        item.personName || "Unknown",
        `${item.client || "N/A"}\n${item.projectName || "N/A"}`,
        getClaimTypeLabel(item),
        getFuelFoodLabel(item),
        formatDate(item.submittedDate),
        formatCurrency(item.amount),
        item.approvedAmount !== undefined
          ? formatCurrency(item.approvedAmount)
          : "N/A",
        getPaidAmountLabel(item),
        formatStatusLabel(item.rawStatus || item.status),
        isPaidItem(item) ? "Paid" : "Pending",
        item.chequeNumber || "N/A",
        item.approvedBy || "N/A",
        item.paidBy || "N/A",
        item.details || "N/A",
      ]),
    };
  };

  const getPdfFileName = (item: Reimbursement) => {
    const person = String(item.personName || "claim")
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "");

    return `Reimbursement-${person || "claim"}-${item.id}.pdf`;
  };

  // Single-claim and list-report documents share the same preview/print flow.
  const getItemPdfJob = (item: Reimbursement) => ({
    key: getRowKey(item),
    title: `Reimbursement PDF Preview${
      item.personName ? ` - ${item.personName}` : ""
    }`,
    fileName: getPdfFileName(item),
    build: () => buildReimbursementPdfBlob(buildPdfData(item)),
  });

  const getReportPdfJob = () => ({
    key: "report",
    title: `Reimbursement Report PDF Preview (${filteredData.length} records)`,
    fileName: `Reimbursement-Report-${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`,
    build: () => buildReimbursementReportPdfBlob(buildReportPdfData()),
  });

  type PdfJob = ReturnType<typeof getReportPdfJob>;

  const closePdfPreview = () => {
    if (pdfPreviewUrlRef.current) {
      URL.revokeObjectURL(pdfPreviewUrlRef.current);
      pdfPreviewUrlRef.current = null;
    }

    setPdfPreviewUrl(null);
    setPdfPreviewBlob(null);
    setPdfPreviewMeta(null);
  };

  const openPdfPreview = async (job: PdfJob) => {
    setPdfBusyKey(`preview-${job.key}`);

    try {
      const blob = await job.build();

      if (pdfPreviewUrlRef.current) {
        URL.revokeObjectURL(pdfPreviewUrlRef.current);
      }

      const url = URL.createObjectURL(blob);
      pdfPreviewUrlRef.current = url;

      setPdfPreviewBlob(blob);
      setPdfPreviewUrl(url);
      setPdfPreviewMeta({ title: job.title, fileName: job.fileName });
    } catch (error) {
      console.error("Reimbursement PDF preview failed:", error);
      alert("Could not generate the PDF preview. Please try again.");
    } finally {
      setPdfBusyKey(null);
    }
  };

  const printPdf = async (job: PdfJob) => {
    setPdfBusyKey(`print-${job.key}`);

    try {
      printPdfBlob(await job.build());
    } catch (error) {
      console.error("Reimbursement print failed:", error);
      alert("Could not prepare the printout. Please try again.");
    } finally {
      setPdfBusyKey(null);
    }
  };

  const handleDownloadPreview = () => {
    if (!pdfPreviewUrl || !pdfPreviewMeta) return;

    const link = document.createElement("a");
    link.href = pdfPreviewUrl;
    link.download = pdfPreviewMeta.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Print / PDF Preview button pair reused wherever claims are displayed.
  const renderPdfActions = (
    job: PdfJob,
    {
      size = "sm",
      previewLabel = "PDF Preview",
      printLabel = "Print",
      disabled = false,
    }: {
      size?: "sm" | "default";
      previewLabel?: string;
      printLabel?: string;
      disabled?: boolean;
    } = {},
  ) => (
    <>
      <Button
        type="button"
        variant="outline"
        size={size}
        className="gap-1.5"
        disabled={disabled || pdfBusyKey !== null}
        onClick={() => openPdfPreview(job)}
        data-testid={`button-pdf-preview-${job.key}`}
      >
        {pdfBusyKey === `preview-${job.key}` ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        {previewLabel}
      </Button>

      <Button
        type="button"
        variant="outline"
        size={size}
        className="gap-1.5"
        disabled={disabled || pdfBusyKey !== null}
        onClick={() => printPdf(job)}
        data-testid={`button-print-${job.key}`}
      >
        {pdfBusyKey === `print-${job.key}` ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Printer className="h-4 w-4" />
        )}
        {printLabel}
      </Button>
    </>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Reimbursement Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {canApprove
              ? "Review and approve reimbursement claims. Payment release is handled by Finance."
              : canReleasePayments
                ? "Release payments for approved reimbursement claims. Approval is handled by Admin."
                : "View and print reimbursement claims. Approval is handled by Admin and payment release by Finance."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {renderPdfActions(getReportPdfJob(), {
            size: "default",
            previewLabel: "Report PDF Preview",
            printLabel: "Print Report",
            disabled: loading,
          })}

          <Button
            variant="outline"
            onClick={clearFilters}
            className="gap-2"
            data-testid="button-clear-filters"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>

          <Button
            variant="outline"
            onClick={() => fetchData()}
            className="gap-2"
            data-testid="button-refresh-reimbursements"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Overall Amount"
          value={formatCurrency(overallAmount)}
          subtitle={`${data.length} total claims`}
          icon={<Wallet className="h-5 w-5" />}
        />

        <StatCard
          title="Pending Approval"
          value={String(pendingApprovalCount)}
          subtitle="Claims awaiting decision"
          icon={<Clock3 className="h-5 w-5" />}
        />

        <StatCard
          title="Approved Claims"
          value={String(approvedCount)}
          subtitle="Approved reimbursements"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />

        <StatCard
          title="Paid Amount"
          value={formatCurrency(paidAmount)}
          subtitle="Released reimbursements"
          icon={<CircleDollarSign className="h-5 w-5" />}
        />
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg border bg-muted/40 p-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-foreground">Filters</h2>
              <p className="text-xs text-muted-foreground">
                Search faster with person, cheque number, approval, payment,
                and sorting filters.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="xl:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Search
              </label>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  placeholder="Search by client, project, person, or details"
                  className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="input-search-reimbursements"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Person
              </label>

              <div className="relative">
                <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <select
                  value={personFilter}
                  onChange={(e) => setPersonFilter(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  data-testid="select-person-filter"
                >
                  <option value="all">All persons</option>

                  {uniquePeople.map((person) => (
                    <option key={person} value={person}>
                      {person}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Cheque Number
              </label>

              <div className="relative">
                <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  placeholder="Enter cheque number"
                  className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  value={chequeFilter}
                  onChange={(e) => setChequeFilter(e.target.value)}
                  data-testid="input-cheque-filter"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Approval Status
              </label>

              <select
                value={approvalFilter}
                onChange={(e) => setApprovalFilter(e.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                data-testid="select-approval-filter"
              >
                <option value="all">All approval statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Payment / Sort
              </label>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  data-testid="select-payment-filter"
                >
                  <option value="all">All payments</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  data-testid="select-sort-filter"
                >
                  <option value="latest">Latest</option>
                  <option value="oldest">Oldest</option>
                  <option value="amount_high">Amount High</option>
                  <option value="amount_low">Amount Low</option>
                  <option value="client_az">Client A-Z</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1 rounded-full">
                <Receipt className="h-3.5 w-3.5" />
                Total Claim amount: {formatCurrency(filteredAmount)}
              </Badge>

              <Badge
                variant="outline"
                className="gap-1 rounded-full border-green-200 bg-green-50 text-green-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Total Approved Amount: {formatCurrency(filteredApprovedAmount)}
              </Badge>

              <Badge
                variant="outline"
                className="gap-1 rounded-full border-blue-200 bg-blue-50 text-blue-700"
              >
                <Wallet className="h-3.5 w-3.5" />
                Total Paid Amount: {formatCurrency(filteredPaymentPaidAmount)}
              </Badge>

              <Badge
                variant="outline"
                className="gap-1 rounded-full border-yellow-200 bg-yellow-50 text-yellow-700"
              >
                <Clock3 className="h-3.5 w-3.5" />
                Total Pending Amount:{" "}
                {formatCurrency(filteredPaymentPendingAmount)}
              </Badge>
            </div>

            <div className="text-xs">
              Showing filtered claims based on your current filters. Print
              Report includes all {filteredData.length} filtered claim(s).
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/60 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              Loading reimbursement claims...
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <div className="rounded-2xl border bg-muted/40 p-3">
                <Receipt className="h-6 w-6 text-muted-foreground" />
              </div>

              <h3 className="text-base font-medium text-foreground">
                No reimbursement claims found
              </h3>

              <p className="max-w-md text-sm text-muted-foreground">
                Try changing your search or filters to see more results.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px] text-sm">
                  <thead className="bg-muted/50">
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Claim
                      </th>

                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Person
                      </th>

                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Amount
                      </th>

                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Fuel / Food / Date
                      </th>

                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Status
                      </th>

                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Bill
                      </th>

                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedData.map((item) => {
                      const paymentStatus = String(
                        item.paymentStatus || "pending",
                      ).toLowerCase();

                      const actionLocked =
                        item.status === "approved" ||
                        item.status === "rejected";

                      const canReleasePayment =
                        canReleasePayments &&
                        item.status === "approved" &&
                        paymentStatus !== "paid";

                      const rowKey = getRowKey(item);

                      return (
                        <tr
                          key={rowKey}
                          className="border-b transition-colors hover:bg-muted/20"
                        >
                          <td className="px-4 py-4 align-top">
                            <div className="space-y-1">
                              <p className="font-medium text-foreground">
                                {item.client}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {item.projectName}
                              </p>

                              <p className="line-clamp-2 max-w-[280px] text-xs text-muted-foreground">
                                {item.details || "No details"}
                              </p>
                            </div>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <div className="space-y-1">
                              <p className="font-medium text-foreground">
                                {item.personName || "Unknown"}
                              </p>

                              {item.approvedBy && (
                                <p className="text-xs text-muted-foreground">
                                  Approved by {item.approvedBy}
                                </p>
                              )}

                              {item.paidBy && paymentStatus === "paid" && (
                                <p className="text-xs text-green-700">
                                  Paid by {item.paidBy}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <div className="space-y-3">
                              <div>
                                <p className="font-semibold text-foreground">
                                  {formatCurrency(item.amount)}
                                </p>

                                <p className="text-xs text-muted-foreground">
                                  Claim amount
                                </p>
                              </div>

                              {(item.status === "approved" ||
                                item.status === "rejected") && (
                                <div>
                                  <p
                                    className={`font-semibold ${
                                      item.status === "rejected"
                                        ? "text-red-700"
                                        : "text-green-700"
                                    }`}
                                  >
                                    {formatCurrency(item.approvedAmount ?? 0)}
                                  </p>

                                  <p className="text-xs text-muted-foreground">
                                    Approved amount
                                  </p>
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <div className="space-y-1">
                              <p className="text-foreground">
                                {item.claimType === "food"
                                  ? item.foodItem || "Food"
                                  : `${Number(item.fuelClaim || 0)} KM`}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {formatDate(item.submittedDate)}
                              </p>
                            </div>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <div className="flex flex-col items-start gap-2">
                              <Badge
                                variant="outline"
                                className={`rounded-full ${getApprovalBadgeClass(
                                  item.rawStatus || item.status,
                                )}`}
                              >
                                {formatStatusLabel(
                                  item.rawStatus || item.status,
                                )}
                              </Badge>

                              <Badge
                                variant="outline"
                                className={`rounded-full ${getPaymentBadgeClass(
                                  item.paymentStatus,
                                )}`}
                              >
                                {paymentStatus === "paid"
                                  ? "Payment Paid"
                                  : "Payment Pending"}
                              </Badge>

                              {item.chequeNumber && (
                                <p className="text-xs text-muted-foreground">
                                  Cheque # {item.chequeNumber}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-4 align-top">
                            {item.billUrl ? (
                              <a
                                href={item.billUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                              >
                                <Eye className="h-4 w-4" />
                                View Bill
                              </a>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                No Bill
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-4 align-top">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                onClick={() => {
                                  setDetailItem(item);
                                  setShowDetailModal(true);
                                }}
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition hover:bg-muted"
                                data-testid={`button-view-detail-${item.recordId}-${item.id}`}
                              >
                                <Eye className="h-4 w-4" />
                                View Detail
                              </button>

                              {renderPdfActions(getItemPdfJob(item))}

                              {canApprove && (
                                <>
                                  <button
                                    disabled={
                                      actionLocked || quickApprovingKey === rowKey
                                    }
                                    onClick={() => handleQuickApprove(item)}
                                    className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition ${
                                      actionLocked
                                        ? "cursor-not-allowed bg-muted text-muted-foreground"
                                        : "bg-green-600 text-white hover:bg-green-700"
                                    }`}
                                    data-testid={`button-approve-${item.recordId}-${item.id}`}
                                  >
                                    {quickApprovingKey === rowKey ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="h-4 w-4" />
                                    )}
                                    Approve
                                  </button>
    
                                  <button
                                    disabled={actionLocked}
                                    onClick={() =>
                                      openApprovalDialog(item, "approved")
                                    }
                                    className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition ${
                                      actionLocked
                                        ? "cursor-not-allowed bg-muted text-muted-foreground"
                                        : "bg-amber-500 text-white hover:bg-amber-600"
                                    }`}
                                    data-testid={`button-partial-approve-${item.recordId}-${item.id}`}
                                  >
                                    <Pencil className="h-4 w-4" />
                                    Partially Approve
                                  </button>
    
                                  <button
                                    disabled={actionLocked}
                                    onClick={() =>
                                      openApprovalDialog(item, "rejected")
                                    }
                                    className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition ${
                                      actionLocked
                                        ? "cursor-not-allowed bg-muted text-muted-foreground"
                                        : "bg-red-600 text-white hover:bg-red-700"
                                    }`}
                                    data-testid={`button-reject-${item.recordId}-${item.id}`}
                                  >
                                    <XCircle className="h-4 w-4" />
                                    Reject
                                  </button>
                                </>
                              )}

                              {canReleasePayments && (
                                <button
                                  disabled={!canReleasePayment}
                                  onClick={() => openPaymentRelease(item)}
                                  className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition ${
                                    canReleasePayment
                                      ? "bg-blue-600 text-white hover:bg-blue-700"
                                      : "cursor-not-allowed bg-muted text-muted-foreground"
                                  }`}
                                  data-testid={`button-release-payment-${item.recordId}-${item.id}`}
                                >
                                  <Wallet className="h-4 w-4" />
                                  {paymentStatus === "paid"
                                    ? "Paid"
                                    : item.status === "approved"
                                      ? "Release Payment"
                                      : item.status === "rejected"
                                        ? "Rejected"
                                        : "Awaiting Approval"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t px-4 py-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center">
                  <span>
                    Showing {(page - 1) * pageSize + 1} to{" "}
                    {Math.min(page * pageSize, filteredData.length)} of{" "}
                    {filteredData.length} claim(s)
                  </span>

                  <div className="flex items-center gap-2">
                    <span>Rows</span>

                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="h-9 rounded-lg border border-input bg-background px-2 text-sm outline-none"
                      data-testid="select-page-size"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className="gap-1"
                    data-testid="button-pagination-prev"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>

                  <div className="rounded-lg border px-3 py-2 text-sm text-foreground">
                    Page {page} of {totalPages}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() =>
                      setPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    className="gap-1"
                    data-testid="button-pagination-next"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={showApprovalModal && canApprove}
        onOpenChange={setShowApprovalModal}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {approvalAction === "approved"
                ? "Approve Reimbursement"
                : "Reject Reimbursement"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">Claimed By</p>
              <p className="font-medium text-foreground">
                {selectedItem?.personName || "Unknown"}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Claim Amount</p>
                  <p className="font-semibold text-foreground">
                    {formatCurrency(selectedItem?.amount || 0)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Project</p>
                  <p className="font-medium text-foreground">
                    {selectedItem?.projectName || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="approvalAmount">Approved Amount</Label>

              <Input
                id="approvalAmount"
                type="number"
                value={approvalAmount}
                onChange={(e) => setApprovalAmount(e.target.value)}
                className="mt-1"
                placeholder="Enter final approved amount"
              />
            </div>

            <div>
              <Label htmlFor="approvalRemarks">Remarks</Label>

              <Textarea
                id="approvalRemarks"
                value={approvalRemarks}
                onChange={(e) => setApprovalRemarks(e.target.value)}
                className="mt-1"
                placeholder={
                  approvalAction === "approved"
                    ? "Enter approval remarks"
                    : "Enter rejection reason"
                }
                rows={4}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex flex-wrap gap-2">
                {selectedItem && renderPdfActions(getItemPdfJob(selectedItem))}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowApprovalModal(false)}
                  disabled={approvalSaving}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={submitApprovalDecision}
                  disabled={approvalSaving}
                  className={
                    approvalAction === "approved"
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }
                >
                  {approvalSaving
                    ? "Saving..."
                    : approvalAction === "approved"
                      ? "Approve"
                      : "Reject"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reimbursement Detail</DialogTitle>
          </DialogHeader>

          {detailItem && (
            <div className="space-y-4">
              <div className="rounded-xl border bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground">Client</p>
                <p className="font-semibold text-foreground">
                  {detailItem.client}
                </p>

                <p className="mt-2 text-xs text-muted-foreground">Project</p>
                <p className="text-sm text-foreground">
                  {detailItem.projectName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">Claim Amount</p>
                  <p className="font-semibold text-foreground">
                    {formatCurrency(detailItem.amount)}
                  </p>
                </div>

                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">
                    Approved Amount
                  </p>
                  <p className="font-semibold text-green-700">
                    {formatCurrency(detailItem.approvedAmount ?? 0)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">Claimed By</p>
                  <p className="text-sm font-medium text-foreground">
                    {detailItem.personName || "Unknown"}
                  </p>
                </div>

                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">
                    {detailItem.claimType === "food"
                      ? "Food Item"
                      : "Fuel Claim"}
                  </p>

                  <p className="text-sm font-medium text-foreground">
                    {detailItem.claimType === "food"
                      ? detailItem.foodItem || "Food"
                      : `${Number(detailItem.fuelClaim || 0)} KM`}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Details</p>
                <p className="mt-1 text-sm text-foreground">
                  {detailItem.details || "No details"}
                </p>
              </div>

              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">
                  Approval Remarks
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {detailItem.approvalRemarks || "No remarks added"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">
                    Approval Status
                  </p>

                  <Badge
                    variant="outline"
                    className={`mt-1 rounded-full ${getApprovalBadgeClass(
                      detailItem.rawStatus || detailItem.status,
                    )}`}
                  >
                    {formatStatusLabel(
                      detailItem.rawStatus || detailItem.status,
                    )}
                  </Badge>
                </div>

                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">
                    Payment Status
                  </p>

                  <Badge
                    variant="outline"
                    className={`mt-1 rounded-full ${getPaymentBadgeClass(
                      detailItem.paymentStatus,
                    )}`}
                  >
                    {String(
                      detailItem.paymentStatus || "pending",
                    ).toLowerCase() === "paid"
                      ? "Payment Paid"
                      : "Payment Pending"}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">Approved By</p>
                  <p className="text-sm text-foreground">
                    {detailItem.approvedBy || "Not approved yet"}
                  </p>
                </div>

                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">Paid By</p>
                  <p className="text-sm text-foreground">
                    {detailItem.paidBy || "Not paid yet"}
                  </p>
                </div>
              </div>

              {(detailItem.paymentType ||
                detailItem.chequeNumber ||
                detailItem.transactionReference) && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border p-3">
                    <p className="text-xs text-muted-foreground">
                      Payment Method
                    </p>
                    <p className="text-sm text-foreground">
                      {detailItem.paymentType
                        ? formatStatusLabel(detailItem.paymentType)
                        : "N/A"}
                    </p>
                  </div>

                  <div className="rounded-xl border p-3">
                    <p className="text-xs text-muted-foreground">
                      Cheque Number
                    </p>
                    <p className="text-sm text-foreground">
                      {detailItem.chequeNumber || "N/A"}
                    </p>
                  </div>
                </div>
              )}

              {detailItem.billUrl && (
                <a
                  href={detailItem.billUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <Eye className="h-4 w-4" />
                  View Bill
                </a>
              )}

              <div className="flex flex-wrap justify-end gap-2">
                {renderPdfActions(getItemPdfJob(detailItem), {
                  size: "default",
                })}

                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailModal(false);
                    setDetailItem(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(pdfPreviewUrl)}
        onOpenChange={(open) => {
          if (!open) closePdfPreview();
        }}
      >
        <DialogContent className="flex h-[90vh] max-w-5xl flex-col gap-3 p-4">
          <DialogHeader>
            <DialogTitle>
              {pdfPreviewMeta?.title || "Reimbursement PDF Preview"}
            </DialogTitle>
          </DialogHeader>

          {pdfPreviewUrl && (
            <iframe
              src={pdfPreviewUrl}
              title="Reimbursement PDF Preview"
              className="w-full flex-1 rounded-lg border"
            />
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() =>
                pdfPreviewUrl &&
                window.open(pdfPreviewUrl, "_blank", "noopener,noreferrer")
              }
            >
              <ExternalLink className="h-4 w-4" />
              Open in New Tab
            </Button>

            <Button
              variant="outline"
              className="gap-2"
              onClick={handleDownloadPreview}
              data-testid="button-download-reimbursement-pdf"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>

            <Button
              className="gap-2"
              onClick={() => pdfPreviewBlob && printPdfBlob(pdfPreviewBlob)}
              data-testid="button-print-reimbursement-pdf"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>

            <Button variant="outline" onClick={closePdfPreview}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PaymentReleaseModal
        isOpen={showPaymentModal && canReleasePayments}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedItem(null);
        }}
        onSuccess={() => fetchData(true)}
        title="Release Reimbursement Payment"
        context={selectedItem}
        docPath={(item) =>
          item.sourcePath === "claim"
            ? ["Panels", PANEL_ID, "claimReimbursements", item.id]
            : item.sourcePath === "root"
              ? ["salesRecords", item.recordId, "meetingUpdates", item.id]
              : [
                  "Panels",
                  PANEL_ID,
                  "salesRecords",
                  item.recordId,
                  "meetingUpdates",
                  item.id,
                ]
        }
        amount={Number(
          selectedItem?.approvedAmount ?? selectedItem?.amount ?? 0,
        )}
        amountLabel="Approved Amount"
        partyLabel="Claimed By"
        parties={selectedItem?.personName ? [selectedItem.personName] : []}
        initialPaymentMethod="cash"
        buildUpdateData={({ formData, receiptUrl, selectedAccount, actor }) => {
          const chequeNumbers: string[] = Array.isArray(
            (formData as any).chequeNumbers,
          )
            ? (formData as any).chequeNumbers.filter(Boolean)
            : [];

          if (selectedItem?.sourcePath === "claim") {
            return {
              paymentStatus: "paid",
              paidBy: actor.displayName || actor.email || "Unknown",
              paidById: actor.uid || "",
              paymentType: formData.paymentMethod,
              paidAmount: Number(formData.amount),
              transactionReference: formData.transactionReference,
              paymentNotes: formData.paymentNotes,
              paymentReceiptUrl: receiptUrl,
              paymentReleasedAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              ...(formData.chequeNumber
                ? { chequeNumber: formData.chequeNumber }
                : {}),
              ...(chequeNumbers.length ? { chequeNumbers } : {}),
              ...(selectedAccount ? { selectedAccount } : {}),
            };
          }

          return {
            "reimbursement.paymentStatus": "paid",
            "reimbursement.paidBy":
              actor.displayName || actor.email || "Unknown",
            "reimbursement.paidById": actor.uid || "",
            "reimbursement.paymentType": formData.paymentMethod,
            "reimbursement.paidAmount": Number(formData.amount),
            "reimbursement.transactionReference": formData.transactionReference,
            "reimbursement.paymentNotes": formData.paymentNotes,
            "reimbursement.paymentReceiptUrl": receiptUrl,
            "reimbursement.paymentReleasedAt": serverTimestamp(),
            "reimbursement.updatedAt": serverTimestamp(),
            ...(formData.chequeNumber
              ? { "reimbursement.chequeNumber": formData.chequeNumber }
              : {}),
            ...(chequeNumbers.length
              ? { "reimbursement.chequeNumbers": chequeNumbers }
              : {}),
            ...(selectedAccount
              ? { "reimbursement.selectedAccount": selectedAccount }
              : {}),
          };
        }}
      />
    </div>
  );
}
