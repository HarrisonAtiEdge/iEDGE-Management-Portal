// import { InvoiceRequest } from "@shared/schema";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { Check, ReceiptText, X } from "lucide-react";
// import { doc, updateDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { useAuth } from "@/contexts/AuthContext";
// import { useToast } from "@/hooks/use-toast";
// import { useState, useEffect } from "react";

// function toDateString(timestamp: any): string {
//   if (!timestamp) return "N/A";
//   if (timestamp.toDate && typeof timestamp.toDate === "function") {
//     return timestamp.toDate().toLocaleString();
//   }
//   if (timestamp instanceof Date) return timestamp.toLocaleString();
//   try {
//     return new Date(timestamp).toLocaleString();
//   } catch {
//     return "N/A";
//   }
// }

// function formatPKR(value: number | string | undefined) {
//   if (value === null || value === undefined) return "0.00";
//   const num =
//     typeof value === "number"
//       ? value
//       : parseFloat(String(value).replace(/,/g, "")) || 0;

//   return num.toLocaleString("en-PK", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });
// }

// function getItemAmount(item: any) {
//   const qty = Number(item?.units ?? 0);
//   const rate = Number(item?.unitRate ?? 0);
//   const tax = Number(item?.tax ?? 0);
//   const total = Number(item?.total ?? qty * rate + tax);
//   return Number.isFinite(total) ? total : 0;
// }

// function getReadableStatus(status?: string) {
//   if (!status) return "Pending";
//   return status
//     .replace(/_/g, " ")
//     .replace(/\b\w/g, (char) => char.toUpperCase());
// }

// interface InvoiceDetailsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   invoice: InvoiceRequest | null;
//   onSubmitExpense?: (request: InvoiceRequest) => void;
// }

// export default function InvoiceDetailsModal({
//   isOpen,
//   onClose,
//   invoice,
//   onSubmitExpense,
// }: InvoiceDetailsModalProps) {
//   const { userProfile } = useAuth();
//   const { toast } = useToast();
//   const isMainAdmin = userProfile?.role === "main_admin";

//   const [liveInvoice, setLiveInvoice] = useState<InvoiceRequest | null>(invoice);
//   const [lineItems, setLineItems] = useState<any[]>(invoice?.lineItems || []);

//   const [itemRejectDialogOpen, setItemRejectDialogOpen] = useState(false);
//   const [pendingRejectIndex, setPendingRejectIndex] = useState<number | null>(null);
//   const [itemRejectionComment, setItemRejectionComment] = useState("");
//   const [itemActionLoading, setItemActionLoading] = useState(false);

//   const [requestRejectDialogOpen, setRequestRejectDialogOpen] = useState(false);
//   const [requestRejectionComment, setRequestRejectionComment] = useState("");
//   const [requestActionLoading, setRequestActionLoading] = useState(false);

//   useEffect(() => {
//     setLiveInvoice(invoice);
//     setLineItems(invoice?.lineItems || []);
//   }, [invoice]);

//   useEffect(() => {
//     if (!invoice?.id || !isOpen) return;

//     const ref = doc(
//       db,
//       "Panels",
//       "IEDGE-SYSTEM",
//       "invoiceRequests",
//       invoice.id
//     );

//     const unsub = onSnapshot(ref, (snap) => {
//       if (snap.exists()) {
//         const freshInvoice = {
//           id: snap.id,
//           ...snap.data(),
//         } as InvoiceRequest;

//         setLiveInvoice(freshInvoice);
//         setLineItems(freshInvoice.lineItems || []);
//       }
//     });

//     return () => unsub();
//   }, [invoice?.id, isOpen]);

//   if (!liveInvoice) return null;

//   const invoiceType =
//     (liveInvoice as any).invoiceType ||
//     (liveInvoice.clientName ? "project" : "general");

//   function getStatusBadgeColor(status: string): string {
//     switch (status) {
//       case "approved":
//       case "payment_released":
//         return "border-green-200 bg-green-50 text-green-700";
//       case "rejected":
//         return "border-red-200 bg-red-50 text-red-700";
//       case "pending_operational_admin":
//       case "pending_main_admin":
//       case "pending_finance":
//         return "border-amber-200 bg-amber-50 text-amber-700";
//       default:
//         return "border-blue-200 bg-blue-50 text-blue-700";
//     }
//   }

//   function getItemStatusBadgeColor(status: string): string {
//     switch (status) {
//       case "approved":
//         return "border-green-200 bg-green-50 text-green-700";
//       case "rejected":
//         return "border-red-200 bg-red-50 text-red-700";
//       default:
//         return "border-amber-200 bg-amber-50 text-amber-700";
//     }
//   }

//   function canApproveRequest(request: InvoiceRequest): boolean {
//     if (!userProfile) return false;

//     switch (userProfile.role) {
//       case "operational_admin":
//         return request.status === "pending_operational_admin";
//       case "main_admin":
//         return request.status === "pending_main_admin";
//       case "finance":
//       case "financial_admin":
//         return request.status === "pending_finance";
//       default:
//         return false;
//     }
//   }

//   async function handleApproveRequest() {
//     if (!liveInvoice?.id || !userProfile) return;

//     try {
//       setRequestActionLoading(true);

//       let newStatus = liveInvoice.status;
//       let currentApprover = "";

//       switch (userProfile.role) {
//         case "operational_admin":
//           if (liveInvoice.status === "pending_operational_admin") {
//             newStatus = "pending_main_admin" as any;
//           }
//           break;
//         case "main_admin":
//           if (liveInvoice.status === "pending_main_admin") {
//             newStatus = "pending_finance" as any;
//           }
//           break;
//         case "finance":
//         case "financial_admin":
//           if (liveInvoice.status === "pending_finance") {
//             newStatus = "approved" as any;
//           }
//           break;
//       }

//       if (newStatus === liveInvoice.status) {
//         toast({
//           title: "Action not available",
//           description: "This request is not pending your approval step.",
//           variant: "destructive",
//         });
//         return;
//       }

//       await updateDoc(
//         doc(db, "Panels", "IEDGE-SYSTEM", "invoiceRequests", liveInvoice.id),
//         {
//           status: newStatus,
//           currentApprover,
//           approvalHistory: [
//             ...((liveInvoice as any).approvalHistory || []),
//             {
//               approver: userProfile.displayName,
//               action: "approved",
//               timestamp: new Date(),
//               notes: "",
//             },
//           ],
//           updatedAt: serverTimestamp(),
//         }
//       );

//       setLiveInvoice({ ...liveInvoice, status: newStatus } as InvoiceRequest);

//       toast({
//         title: "Request approved",
//         description: "The request status has been updated successfully.",
//       });
//     } catch (error: any) {
//       console.error("Failed to approve request:", error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to approve request",
//         variant: "destructive",
//       });
//     } finally {
//       setRequestActionLoading(false);
//     }
//   }

//   async function handleRejectRequest() {
//     if (!liveInvoice?.id || !userProfile) return;

//     const reason = requestRejectionComment.trim();
//     if (!reason) {
//       toast({
//         title: "Rejection comment required",
//         description: "Please enter the reason for rejecting this request.",
//         variant: "destructive",
//       });
//       return;
//     }

//     try {
//       setRequestActionLoading(true);

//       await updateDoc(
//         doc(db, "Panels", "IEDGE-SYSTEM", "invoiceRequests", liveInvoice.id),
//         {
//           status: "pending_operational_admin",
//           approvalHistory: [
//             ...((liveInvoice as any).approvalHistory || []),
//             {
//               approver: userProfile.displayName,
//               action: "rejected",
//               timestamp: new Date(),
//               notes: reason,
//             },
//           ],
//           updatedAt: serverTimestamp(),
//         }
//       );

//       setLiveInvoice({
//         ...liveInvoice,
//         status: "pending_operational_admin" as any,
//       } as InvoiceRequest);

//       toast({
//         title: "Request rejected",
//         description: "The request has been sent back with your comment.",
//       });

//       setRequestRejectDialogOpen(false);
//       setRequestRejectionComment("");
//     } catch (error: any) {
//       console.error("Failed to reject request:", error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to reject request",
//         variant: "destructive",
//       });
//     } finally {
//       setRequestActionLoading(false);
//     }
//   }

//   async function updateLineItemStatus(
//     index: number,
//     status: "approved" | "rejected",
//     rejectReason = ""
//   ) {
//     if (!liveInvoice?.id || !userProfile) return;

//     try {
//       setItemActionLoading(true);

//       const updatedItems = lineItems.map((item: any) => ({ ...item }));
//       const now = new Date();
//       const actorName = userProfile.displayName || "Main Admin";

//       const currentItem = updatedItems[index] || {};

//       updatedItems[index] = {
//         ...currentItem,
//         status,
//         reviewedBy: actorName,
//         reviewedAt: now,
//         ...(status === "approved"
//           ? {
//               approvedBy: actorName,
//               approvedAt: now,
//               rejectionComment: "",
//             }
//           : {
//               rejectedBy: actorName,
//               rejectedAt: now,
//               rejectionComment: rejectReason.trim(),
//             }),
//       };

//       await updateDoc(
//         doc(
//           db,
//           "Panels",
//           "IEDGE-SYSTEM",
//           "invoiceRequests",
//           liveInvoice.id
//         ),
//         {
//           lineItems: updatedItems,
//           updatedAt: serverTimestamp(),
//         }
//       );

//       setLineItems(updatedItems);

//       toast({
//         title: status === "approved" ? "Item approved" : "Item rejected",
//       });
//     } catch (error) {
//       console.error("Failed to update line item status:", error);
//       toast({
//         title: "Error",
//         description: "Failed to update item status",
//         variant: "destructive",
//       });
//     } finally {
//       setItemActionLoading(false);
//     }
//   }

//   function openItemRejectDialog(index: number) {
//     setPendingRejectIndex(index);
//     setItemRejectionComment("");
//     setItemRejectDialogOpen(true);
//   }

//   async function handleItemRejectConfirm() {
//     if (pendingRejectIndex === null) return;

//     const reason = itemRejectionComment.trim();
//     if (!reason) {
//       toast({
//         title: "Rejection comment required",
//         description: "Please enter the reason for rejecting this item.",
//         variant: "destructive",
//       });
//       return;
//     }

//     await updateLineItemStatus(pendingRejectIndex, "rejected", reason);
//     setItemRejectDialogOpen(false);
//     setPendingRejectIndex(null);
//     setItemRejectionComment("");
//   }

//   const approvedTotal = lineItems
//     .filter((item: any) => item.status === "approved")
//     .reduce((sum: number, item: any) => sum + getItemAmount(item), 0);

//   const rejectedTotal = lineItems
//     .filter((item: any) => item.status === "rejected")
//     .reduce((sum: number, item: any) => sum + getItemAmount(item), 0);

//   const pendingTotal = lineItems
//     .filter((item: any) => !item.status || item.status === "pending")
//     .reduce((sum: number, item: any) => sum + getItemAmount(item), 0);

//   const totalBudget = liveInvoice.totalAmount || 0;
//   const canShowRequestActions = canApproveRequest(liveInvoice);

//   const paymentDetails = liveInvoice.paymentDetails as
//     | {
//         paymentMethod?: string;
//         amount?: number;
//         vendor?: string;
//         vendors?: string[];
//         transactionReference?: string;
//         chequeNumber?: string;
//         bankReceiptUrl?: string;
//         paymentNotes?: string;
//         releasedAt?: any;
//         releasedByName?: string;
//         selectedAccount?: {
//           accountName?: string;
//           accountNumber?: string;
//           bankName?: string;
//         };
//       }
//     | undefined;

//   const vendorText = Array.isArray(paymentDetails?.vendors)
//     ? paymentDetails?.vendors.join(", ")
//     : paymentDetails?.vendor || "-";

//   const displaySubject =
//     (liveInvoice as any).subject ||
//     (invoiceType === "project" ? (liveInvoice as any).title || "-" : "-");

//   const canSubmitExpense =
//     invoiceType === "project" &&
//     !!onSubmitExpense &&
//     ["approved", "payment_released"].includes(String(liveInvoice.status || ""));

//   return (
//     <>
//       <Dialog open={isOpen} onOpenChange={onClose}>
//         <DialogContent className="max-w-[96vw] md:max-w-7xl max-h-[92vh] overflow-y-auto border-0 bg-slate-50 p-0 shadow-2xl">
//           <div className="sticky top-0 z-10 border-b bg-white/95 px-6 py-5 backdrop-blur">
//             <DialogHeader>
//               <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
//                 <div>
//                   <DialogTitle className="text-2xl font-bold tracking-tight text-slate-950">
//                     Budget Detail
//                   </DialogTitle>
//                   <DialogDescription className="mt-1 text-sm text-slate-500">
//                     Request Form Details – {liveInvoice.requestId}
//                   </DialogDescription>
//                 </div>

//                 <div className="flex flex-wrap items-center gap-2">
//                   <Badge className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeColor(liveInvoice.status)}`}>
//                     {getReadableStatus(liveInvoice.status)}
//                   </Badge>



//                   {canSubmitExpense && (
//                     <Button
//                       size="sm"
//                       className="rounded-full bg-slate-950 px-4 text-white shadow-sm hover:bg-slate-800"
//                       onClick={() => onSubmitExpense?.(liveInvoice)}
//                     >
//                       <ReceiptText className="mr-1 h-4 w-4" />
//                       Submit Expense
//                     </Button>
//                   )}

//                   {canShowRequestActions && (
//                     <>
//                       <Button
//                         size="sm"
//                         className="rounded-full bg-green-600 px-4 text-white shadow-sm hover:bg-green-700"
//                         disabled={requestActionLoading}
//                         onClick={handleApproveRequest}
//                       >
//                         <Check className="mr-1 h-4 w-4" />
//                         {requestActionLoading ? "Approving..." : "Approve Request"}
//                       </Button>

//                       <Button
//                         size="sm"
//                         variant="destructive"
//                         className="rounded-full px-4 shadow-sm"
//                         disabled={requestActionLoading}
//                         onClick={() => {
//                           setRequestRejectionComment("");
//                           setRequestRejectDialogOpen(true);
//                         }}
//                       >
//                         <X className="mr-1 h-4 w-4" />
//                         Reject Request
//                       </Button>
//                     </>
//                   )}
//                 </div>
//               </div>
//             </DialogHeader>
//           </div>

//           <div className="space-y-6 px-6 py-6">
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
//               <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//                 <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                   Total Budget
//                 </p>
//                 <p className="mt-2 text-2xl font-bold text-slate-950">
//                   Rs {formatPKR(totalBudget)}
//                 </p>
//               </div>

//               <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
//                 <p className="text-xs font-medium uppercase tracking-wide text-green-600">
//                   Approved Amount
//                 </p>
//                 <p className="mt-2 text-2xl font-bold text-green-700">
//                   Rs {formatPKR(approvedTotal)}
//                 </p>
//               </div>

//               <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
//                 <p className="text-xs font-medium uppercase tracking-wide text-red-600">
//                   Rejected Amount
//                 </p>
//                 <p className="mt-2 text-2xl font-bold text-red-700">
//                   Rs {formatPKR(rejectedTotal)}
//                 </p>
//               </div>
//             </div>

//             <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//               <div className="mb-4 flex items-center justify-between">
//                 <h3 className="text-base font-semibold text-slate-950">
//                   Request Information
//                 </h3>
//               </div>

//               <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
//                 <div className="rounded-xl bg-slate-50 p-4">
//                   <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Request ID
//                   </span>
//                   <p className="mt-1 font-semibold text-slate-950">
//                     {liveInvoice.requestId}
//                   </p>
//                 </div>

//                 <div className="rounded-xl bg-slate-50 p-4">
//                   <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Status
//                   </span>
//                   <div className="mt-2">
//                     <Badge className={`rounded-full border px-3 py-1 ${getStatusBadgeColor(liveInvoice.status)}`}>
//                       {getReadableStatus(liveInvoice.status)}
//                     </Badge>
//                   </div>
//                 </div>

//                 {invoiceType === "general" ? (
//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Title
//                     </span>
//                     <p className="mt-1 font-semibold text-slate-950">
//                       {(liveInvoice as any).title || "-"}
//                     </p>
//                   </div>
//                 ) : (
//                   <>
//                     <div className="rounded-xl bg-slate-50 p-4">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Client
//                       </span>
//                       <p className="mt-1 font-semibold text-slate-950">
//                         {liveInvoice.clientName || "-"}
//                       </p>
//                     </div>

//                     <div className="rounded-xl bg-slate-50 p-4">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Project
//                       </span>
//                       <p className="mt-1 font-semibold text-slate-950">
//                         {liveInvoice.project || "-"}
//                       </p>
//                     </div>

//                     <div className="rounded-xl bg-slate-50 p-4">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Project Code
//                       </span>
//                       <p className="mt-1 font-semibold text-slate-950">
//                         {(liveInvoice as any).projectCode || "-"}
//                       </p>
//                     </div>
//                   </>
//                 )}

//                 <div className="rounded-xl bg-slate-50 p-4 md:col-span-2">
//                   <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Subject
//                   </span>
//                   <p className="mt-1 whitespace-pre-wrap break-words font-semibold text-slate-950">
//                     {displaySubject}
//                   </p>
//                 </div>

//                 <div className="rounded-xl bg-slate-50 p-4">
//                   <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Submitted Date
//                   </span>
//                   <p className="mt-1 text-slate-800">
//                     {toDateString(liveInvoice.submittedAt)}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {((liveInvoice as any).message || (liveInvoice as any).comment) && (
//               <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//                 <h3 className="mb-3 text-base font-semibold text-slate-950">
//                   Message
//                 </h3>
//                 <div className="min-h-[100px] rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-wrap break-words">
//                   {(liveInvoice as any).message || (liveInvoice as any).comment || "-"}
//                 </div>
//               </div>
//             )}

//             <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
//               <div className="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
//                 <div>
//                   <h3 className="text-lg font-semibold text-slate-950">
//                     Item Approval
//                   </h3>
//                   <p className="mt-1 text-sm text-slate-500">
//                     Approve or reject individual budget items. Request-level approve/reject is also available here.
//                   </p>
//                 </div>

//                 <div className="flex flex-wrap gap-2">
//                   {canSubmitExpense && (
//                     <Button
//                       size="sm"
//                       className="rounded-full bg-slate-950 px-4 text-white hover:bg-slate-800"
//                       onClick={() => onSubmitExpense?.(liveInvoice)}
//                     >
//                       <ReceiptText className="mr-1 h-4 w-4" />
//                       Submit Expense
//                     </Button>
//                   )}

//                   {canShowRequestActions && (
//                     <>
//                     <Button
//                       size="sm"
//                       className="rounded-full bg-green-600 px-4 text-white hover:bg-green-700"
//                       disabled={requestActionLoading}
//                       onClick={handleApproveRequest}
//                     >
//                       <Check className="mr-1 h-4 w-4" />
//                       Approve Request
//                     </Button>

//                     <Button
//                       size="sm"
//                       variant="destructive"
//                       className="rounded-full px-4"
//                       disabled={requestActionLoading}
//                       onClick={() => {
//                         setRequestRejectionComment("");
//                         setRequestRejectDialogOpen(true);
//                       }}
//                     >
//                       <X className="mr-1 h-4 w-4" />
//                       Reject Request
//                     </Button>
//                     </>
//                   )}
//                 </div>
//               </div>

//               <div className="overflow-x-auto">
//                 <table className="w-full min-w-[1050px] text-sm">
//                   <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
//                     <tr>
//                       <th className="px-4 py-3 text-left font-semibold">Vendor</th>
//                       <th className="px-4 py-3 text-left font-semibold">Service</th>
//                       <th className="px-4 py-3 text-left font-semibold">Description</th>
//                       <th className="px-4 py-3 text-left font-semibold min-w-[220px]">
//                         Requester Comment
//                       </th>
//                       <th className="px-4 py-3 text-right font-semibold">Qty</th>
//                       <th className="px-4 py-3 text-right font-semibold">Rate</th>
//                       <th className="px-4 py-3 text-right font-semibold">Amount</th>
//                       <th className="px-4 py-3 text-center font-semibold min-w-[180px]">
//                         Item Action
//                       </th>
//                       <th className="px-4 py-3 text-left font-semibold min-w-[240px]">
//                         Rejection Reason
//                       </th>
//                     </tr>
//                   </thead>

//                   <tbody className="divide-y divide-slate-100">
//                     {lineItems.length === 0 ? (
//                       <tr>
//                         <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
//                           No line items found.
//                         </td>
//                       </tr>
//                     ) : (
//                       lineItems.map((item, index) => {
//                         const qty = item.units ?? 0;
//                         const rate = item.unitRate ?? 0;
//                         const amount = getItemAmount(item);
//                         const status = item.status || "pending";

//                         return (
//                           <tr key={item.id || index} className="align-top transition hover:bg-slate-50/80">
//                             <td className="px-4 py-4 font-medium text-slate-950">
//                               {item.vendor || "-"}
//                             </td>
//                             <td className="px-4 py-4 text-slate-700">
//                               {item.service || "-"}
//                             </td>
//                             <td className="px-4 py-4 whitespace-pre-wrap break-words text-slate-700">
//                               {item.description || "-"}
//                             </td>
//                             <td className="px-4 py-4 whitespace-pre-wrap break-words text-slate-700">
//                               {item.comment || "-"}
//                             </td>
//                             <td className="px-4 py-4 text-right text-slate-700">{qty}</td>
//                             <td className="px-4 py-4 text-right text-slate-700">
//                               Rs {formatPKR(rate)}
//                             </td>
//                             <td className="px-4 py-4 text-right font-semibold text-slate-950">
//                               Rs {formatPKR(amount)}
//                             </td>

//                             <td className="px-4 py-4 text-center">
//                               {isMainAdmin && status === "pending" ? (
//                                 <div className="flex flex-wrap justify-center gap-2">
//                                   <Button
//                                     size="sm"
//                                     className="rounded-full bg-green-600 px-3 text-white hover:bg-green-700"
//                                     disabled={itemActionLoading}
//                                     onClick={() => updateLineItemStatus(index, "approved")}
//                                   >
//                                     <Check className="mr-1 h-4 w-4" />
//                                     Approve
//                                   </Button>

//                                   <Button
//                                     size="sm"
//                                     variant="destructive"
//                                     className="rounded-full px-3"
//                                     disabled={itemActionLoading}
//                                     onClick={() => openItemRejectDialog(index)}
//                                   >
//                                     <X className="mr-1 h-4 w-4" />
//                                     Reject
//                                   </Button>
//                                 </div>
//                               ) : (
//                                 <Badge className={`rounded-full border px-3 py-1 ${getItemStatusBadgeColor(status)}`}>
//                                   {getReadableStatus(status)}
//                                 </Badge>
//                               )}
//                             </td>

//                             <td className="px-4 py-4 whitespace-pre-wrap break-words text-sm">
//                               {item.rejectionComment ? (
//                                 <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-red-700">
//                                   {item.rejectionComment}
//                                 </div>
//                               ) : (
//                                 <span className="text-slate-400">-</span>
//                               )}
//                             </td>
//                           </tr>
//                         );
//                       })
//                     )}
//                   </tbody>
//                 </table>
//               </div>

//               <div className="grid grid-cols-1 gap-3 border-t border-slate-200 bg-slate-50 p-5 md:grid-cols-4">
//                 <div className="rounded-xl bg-white p-4 shadow-sm">
//                   <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Total Budget
//                   </span>
//                   <p className="mt-1 font-bold text-slate-950">
//                     Rs {formatPKR(totalBudget)}
//                   </p>
//                 </div>

//                 <div className="rounded-xl bg-white p-4 shadow-sm">
//                   <span className="text-xs font-medium uppercase tracking-wide text-green-600">
//                     Approved
//                   </span>
//                   <p className="mt-1 font-bold text-green-700">
//                     Rs {formatPKR(approvedTotal)}
//                   </p>
//                 </div>

//                 <div className="rounded-xl bg-white p-4 shadow-sm">
//                   <span className="text-xs font-medium uppercase tracking-wide text-red-600">
//                     Rejected
//                   </span>
//                   <p className="mt-1 font-bold text-red-700">
//                     Rs {formatPKR(rejectedTotal)}
//                   </p>
//                 </div>

//                 <div className="rounded-xl bg-white p-4 shadow-sm">
//                   <span className="text-xs font-medium uppercase tracking-wide text-amber-600">
//                     Pending
//                   </span>
//                   <p className="mt-1 font-bold text-amber-700">
//                     Rs {formatPKR(pendingTotal)}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {paymentDetails && (
//               <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//                 <h3 className="mb-4 text-lg font-semibold text-slate-950">
//                   Payment Details
//                 </h3>

//                 <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Payment Method
//                     </span>
//                     <p className="mt-1 font-medium text-slate-950">
//                       {paymentDetails.paymentMethod || "-"}
//                     </p>
//                   </div>

//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Amount Paid
//                     </span>
//                     <p className="mt-1 font-semibold text-slate-950">
//                       Rs {formatPKR(paymentDetails.amount)}
//                     </p>
//                   </div>

//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Vendor(s)
//                     </span>
//                     <p className="mt-1 text-slate-800">{vendorText}</p>
//                   </div>

//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Transaction Ref
//                     </span>
//                     <p className="mt-1 text-slate-800">
//                       {paymentDetails.transactionReference || "-"}
//                     </p>
//                   </div>

//                   {paymentDetails.chequeNumber && (
//                     <div className="rounded-xl bg-slate-50 p-4">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Cheque Number
//                       </span>
//                       <p className="mt-1 text-slate-800">
//                         {paymentDetails.chequeNumber}
//                       </p>
//                     </div>
//                   )}

//                   {paymentDetails.releasedByName && (
//                     <div className="rounded-xl bg-slate-50 p-4">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Released By
//                       </span>
//                       <p className="mt-1 text-slate-800">
//                         {paymentDetails.releasedByName}
//                       </p>
//                     </div>
//                   )}

//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Released At
//                     </span>
//                     <p className="mt-1 text-slate-800">
//                       {toDateString(paymentDetails.releasedAt)}
//                     </p>
//                   </div>

//                   {paymentDetails.selectedAccount && (
//                     <div className="rounded-xl bg-slate-50 p-4">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Selected Account
//                       </span>
//                       <p className="mt-1 text-slate-800">
//                         {paymentDetails.selectedAccount.accountName || "-"}
//                         {paymentDetails.selectedAccount.accountNumber
//                           ? ` (${paymentDetails.selectedAccount.accountNumber})`
//                           : ""}
//                       </p>
//                     </div>
//                   )}

//                   {paymentDetails.paymentNotes && (
//                     <div className="rounded-xl bg-slate-50 p-4 md:col-span-2 lg:col-span-3">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Notes
//                       </span>
//                       <p className="mt-1 whitespace-pre-wrap break-words text-slate-800">
//                         {paymentDetails.paymentNotes}
//                       </p>
//                     </div>
//                   )}

//                   {paymentDetails.bankReceiptUrl && (
//                     <div className="md:col-span-2 lg:col-span-3">
//                       <a
//                         href={paymentDetails.bankReceiptUrl}
//                         target="_blank"
//                         rel="noreferrer"
//                         className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
//                       >
//                         View Bank Receipt
//                       </a>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>

//           <div className="sticky bottom-0 flex justify-end border-t bg-white/95 px-6 py-4 backdrop-blur">
//             <Button variant="outline" className="rounded-full px-5" onClick={onClose}>
//               Close
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>

//       <Dialog
//         open={itemRejectDialogOpen}
//         onOpenChange={(open) => {
//           setItemRejectDialogOpen(open);
//           if (!open) {
//             setPendingRejectIndex(null);
//             setItemRejectionComment("");
//           }
//         }}
//       >
//         <DialogContent className="max-w-lg rounded-2xl">
//           <DialogHeader>
//             <DialogTitle>Reject Line Item</DialogTitle>
//             <DialogDescription>
//               Please enter the reason for rejecting this item. This comment will be visible to the requester.
//             </DialogDescription>
//           </DialogHeader>

//           <div className="space-y-3">
//             <Textarea
//               value={itemRejectionComment}
//               onChange={(e) => setItemRejectionComment(e.target.value)}
//               placeholder="Enter rejection reason"
//               rows={5}
//               className="rounded-xl"
//             />
//           </div>

//           <div className="mt-4 flex justify-end gap-2">
//             <Button
//               variant="outline"
//               className="rounded-full"
//               onClick={() => {
//                 setItemRejectDialogOpen(false);
//                 setPendingRejectIndex(null);
//                 setItemRejectionComment("");
//               }}
//             >
//               Cancel
//             </Button>

//             <Button
//               variant="destructive"
//               className="rounded-full"
//               disabled={!itemRejectionComment.trim() || itemActionLoading}
//               onClick={handleItemRejectConfirm}
//             >
//               {itemActionLoading ? "Rejecting..." : "Confirm Reject"}
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>

//       <Dialog
//         open={requestRejectDialogOpen}
//         onOpenChange={(open) => {
//           setRequestRejectDialogOpen(open);
//           if (!open) setRequestRejectionComment("");
//         }}
//       >
//         <DialogContent className="max-w-lg rounded-2xl">
//           <DialogHeader>
//             <DialogTitle>Reject Request</DialogTitle>
//             <DialogDescription>
//               Please enter the reason for rejecting this request. It will be saved in the approval history and sent back to Operational Admin.
//             </DialogDescription>
//           </DialogHeader>

//           <div className="space-y-3">
//             <Textarea
//               value={requestRejectionComment}
//               onChange={(e) => setRequestRejectionComment(e.target.value)}
//               placeholder="Enter request rejection reason"
//               rows={5}
//               className="rounded-xl"
//             />
//           </div>

//           <div className="mt-4 flex justify-end gap-2">
//             <Button
//               variant="outline"
//               className="rounded-full"
//               onClick={() => {
//                 setRequestRejectDialogOpen(false);
//                 setRequestRejectionComment("");
//               }}
//             >
//               Cancel
//             </Button>

//             <Button
//               variant="destructive"
//               className="rounded-full"
//               disabled={!requestRejectionComment.trim() || requestActionLoading}
//               onClick={handleRejectRequest}
//             >
//               {requestActionLoading ? "Rejecting..." : "Confirm Reject"}
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// }



// import { InvoiceRequest } from "@shared/schema";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { Check, FileSpreadsheet, FileText, ReceiptText, X } from "lucide-react";
// import { doc, updateDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { useAuth } from "@/contexts/AuthContext";
// import { useToast } from "@/hooks/use-toast";
// import { useState, useEffect } from "react";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
// import * as XLSX from "xlsx";

// function toDateString(timestamp: any): string {
//   if (!timestamp) return "N/A";
//   if (timestamp.toDate && typeof timestamp.toDate === "function") {
//     return timestamp.toDate().toLocaleString();
//   }
//   if (timestamp instanceof Date) return timestamp.toLocaleString();
//   try {
//     return new Date(timestamp).toLocaleString();
//   } catch {
//     return "N/A";
//   }
// }

// function formatPKR(value: number | string | undefined) {
//   if (value === null || value === undefined) return "0.00";
//   const num =
//     typeof value === "number"
//       ? value
//       : parseFloat(String(value).replace(/,/g, "")) || 0;

//   return num.toLocaleString("en-PK", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });
// }

// function getItemAmount(item: any) {
//   const qty = Number(item?.units ?? 0);
//   const rate = Number(item?.unitRate ?? 0);
//   const tax = Number(item?.tax ?? 0);
//   const total = Number(item?.total ?? qty * rate + tax);
//   return Number.isFinite(total) ? total : 0;
// }

// function getReadableStatus(status?: string) {
//   if (!status) return "Pending";
//   return status
//     .replace(/_/g, " ")
//     .replace(/\b\w/g, (char) => char.toUpperCase());
// }

// interface InvoiceDetailsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   invoice: InvoiceRequest | null;
//   onSubmitExpense?: (request: InvoiceRequest) => void;
// }

// export default function InvoiceDetailsModal({
//   isOpen,
//   onClose,
//   invoice,
//   onSubmitExpense,
// }: InvoiceDetailsModalProps) {
//   const { userProfile } = useAuth();
//   const { toast } = useToast();
//   const isMainAdmin = userProfile?.role === "main_admin";

//   const [liveInvoice, setLiveInvoice] = useState<InvoiceRequest | null>(invoice);
//   const [lineItems, setLineItems] = useState<any[]>(invoice?.lineItems || []);

//   const [itemRejectDialogOpen, setItemRejectDialogOpen] = useState(false);
//   const [pendingRejectIndex, setPendingRejectIndex] = useState<number | null>(null);
//   const [itemRejectionComment, setItemRejectionComment] = useState("");
//   const [itemActionLoading, setItemActionLoading] = useState(false);

//   const [requestRejectDialogOpen, setRequestRejectDialogOpen] = useState(false);
//   const [requestRejectionComment, setRequestRejectionComment] = useState("");
//   const [requestActionLoading, setRequestActionLoading] = useState(false);

//   useEffect(() => {
//     setLiveInvoice(invoice);
//     setLineItems(invoice?.lineItems || []);
//   }, [invoice]);

//   useEffect(() => {
//     if (!invoice?.id || !isOpen) return;

//     const ref = doc(
//       db,
//       "Panels",
//       "IEDGE-SYSTEM",
//       "invoiceRequests",
//       invoice.id
//     );

//     const unsub = onSnapshot(ref, (snap) => {
//       if (snap.exists()) {
//         const freshInvoice = {
//           id: snap.id,
//           ...snap.data(),
//         } as InvoiceRequest;

//         setLiveInvoice(freshInvoice);
//         setLineItems(freshInvoice.lineItems || []);
//       }
//     });

//     return () => unsub();
//   }, [invoice?.id, isOpen]);

//   if (!liveInvoice) return null;

//   // Keep a non-null reference for this render. TypeScript does not always
//   // keep the liveInvoice null-check inside nested export/action handlers.
//   const activeInvoice = liveInvoice;

//   const invoiceType =
//     (activeInvoice as any).invoiceType ||
//     (activeInvoice.clientName ? "project" : "general");

//   function getStatusBadgeColor(status: string): string {
//     switch (status) {
//       case "approved":
//       case "payment_released":
//         return "border-green-200 bg-green-50 text-green-700";
//       case "rejected":
//         return "border-red-200 bg-red-50 text-red-700";
//       case "pending_operational_admin":
//       case "pending_main_admin":
//       case "pending_finance":
//         return "border-amber-200 bg-amber-50 text-amber-700";
//       default:
//         return "border-blue-200 bg-blue-50 text-blue-700";
//     }
//   }

//   function getItemStatusBadgeColor(status: string): string {
//     switch (status) {
//       case "approved":
//         return "border-green-200 bg-green-50 text-green-700";
//       case "rejected":
//         return "border-red-200 bg-red-50 text-red-700";
//       default:
//         return "border-amber-200 bg-amber-50 text-amber-700";
//     }
//   }

//   function canApproveRequest(request: InvoiceRequest): boolean {
//     if (!userProfile) return false;

//     switch (userProfile.role) {
//       case "operational_admin":
//         return request.status === "pending_operational_admin";
//       case "main_admin":
//         return request.status === "pending_main_admin";
//       case "finance":
//       case "financial_admin":
//         return request.status === "pending_finance";
//       default:
//         return false;
//     }
//   }

//   async function handleApproveRequest() {
//     if (!activeInvoice?.id || !userProfile) return;

//     try {
//       setRequestActionLoading(true);

//       let newStatus = activeInvoice.status;
//       let currentApprover = "";

//       switch (userProfile.role) {
//         case "operational_admin":
//           if (activeInvoice.status === "pending_operational_admin") {
//             newStatus = "pending_main_admin" as any;
//           }
//           break;
//         case "main_admin":
//           if (activeInvoice.status === "pending_main_admin") {
//             newStatus = "pending_finance" as any;
//           }
//           break;
//         case "finance":
//         case "financial_admin":
//           if (activeInvoice.status === "pending_finance") {
//             newStatus = "approved" as any;
//           }
//           break;
//       }

//       if (newStatus === activeInvoice.status) {
//         toast({
//           title: "Action not available",
//           description: "This request is not pending your approval step.",
//           variant: "destructive",
//         });
//         return;
//       }

//       await updateDoc(
//         doc(db, "Panels", "IEDGE-SYSTEM", "invoiceRequests", activeInvoice.id),
//         {
//           status: newStatus,
//           currentApprover,
//           approvalHistory: [
//             ...((activeInvoice as any).approvalHistory || []),
//             {
//               approver: userProfile.displayName,
//               action: "approved",
//               timestamp: new Date(),
//               notes: "",
//             },
//           ],
//           updatedAt: serverTimestamp(),
//         }
//       );

//       setLiveInvoice({ ...activeInvoice, status: newStatus } as InvoiceRequest);

//       toast({
//         title: "Request approved",
//         description: "The request status has been updated successfully.",
//       });
//     } catch (error: any) {
//       console.error("Failed to approve request:", error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to approve request",
//         variant: "destructive",
//       });
//     } finally {
//       setRequestActionLoading(false);
//     }
//   }

//   async function handleRejectRequest() {
//     if (!activeInvoice?.id || !userProfile) return;

//     const reason = requestRejectionComment.trim();
//     if (!reason) {
//       toast({
//         title: "Rejection comment required",
//         description: "Please enter the reason for rejecting this request.",
//         variant: "destructive",
//       });
//       return;
//     }

//     try {
//       setRequestActionLoading(true);

//       await updateDoc(
//         doc(db, "Panels", "IEDGE-SYSTEM", "invoiceRequests", activeInvoice.id),
//         {
//           status: "pending_operational_admin",
//           approvalHistory: [
//             ...((activeInvoice as any).approvalHistory || []),
//             {
//               approver: userProfile.displayName,
//               action: "rejected",
//               timestamp: new Date(),
//               notes: reason,
//             },
//           ],
//           updatedAt: serverTimestamp(),
//         }
//       );

//       setLiveInvoice({
//         ...activeInvoice,
//         status: "pending_operational_admin" as any,
//       } as InvoiceRequest);

//       toast({
//         title: "Request rejected",
//         description: "The request has been sent back with your comment.",
//       });

//       setRequestRejectDialogOpen(false);
//       setRequestRejectionComment("");
//     } catch (error: any) {
//       console.error("Failed to reject request:", error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to reject request",
//         variant: "destructive",
//       });
//     } finally {
//       setRequestActionLoading(false);
//     }
//   }

//   async function updateLineItemStatus(
//     index: number,
//     status: "approved" | "rejected",
//     rejectReason = ""
//   ) {
//     if (!activeInvoice?.id || !userProfile) return;

//     try {
//       setItemActionLoading(true);

//       const updatedItems = lineItems.map((item: any) => ({ ...item }));
//       const now = new Date();
//       const actorName = userProfile.displayName || "Main Admin";

//       const currentItem = updatedItems[index] || {};

//       updatedItems[index] = {
//         ...currentItem,
//         status,
//         reviewedBy: actorName,
//         reviewedAt: now,
//         ...(status === "approved"
//           ? {
//               approvedBy: actorName,
//               approvedAt: now,
//               rejectionComment: "",
//             }
//           : {
//               rejectedBy: actorName,
//               rejectedAt: now,
//               rejectionComment: rejectReason.trim(),
//             }),
//       };

//       await updateDoc(
//         doc(
//           db,
//           "Panels",
//           "IEDGE-SYSTEM",
//           "invoiceRequests",
//           activeInvoice.id
//         ),
//         {
//           lineItems: updatedItems,
//           updatedAt: serverTimestamp(),
//         }
//       );

//       setLineItems(updatedItems);

//       toast({
//         title: status === "approved" ? "Item approved" : "Item rejected",
//       });
//     } catch (error) {
//       console.error("Failed to update line item status:", error);
//       toast({
//         title: "Error",
//         description: "Failed to update item status",
//         variant: "destructive",
//       });
//     } finally {
//       setItemActionLoading(false);
//     }
//   }

//   function openItemRejectDialog(index: number) {
//     setPendingRejectIndex(index);
//     setItemRejectionComment("");
//     setItemRejectDialogOpen(true);
//   }

//   async function handleItemRejectConfirm() {
//     if (pendingRejectIndex === null) return;

//     const reason = itemRejectionComment.trim();
//     if (!reason) {
//       toast({
//         title: "Rejection comment required",
//         description: "Please enter the reason for rejecting this item.",
//         variant: "destructive",
//       });
//       return;
//     }

//     await updateLineItemStatus(pendingRejectIndex, "rejected", reason);
//     setItemRejectDialogOpen(false);
//     setPendingRejectIndex(null);
//     setItemRejectionComment("");
//   }

//   const approvedTotal = lineItems
//     .filter((item: any) => item.status === "approved")
//     .reduce((sum: number, item: any) => sum + getItemAmount(item), 0);

//   const rejectedTotal = lineItems
//     .filter((item: any) => item.status === "rejected")
//     .reduce((sum: number, item: any) => sum + getItemAmount(item), 0);

//   const pendingTotal = lineItems
//     .filter((item: any) => !item.status || item.status === "pending")
//     .reduce((sum: number, item: any) => sum + getItemAmount(item), 0);

//   const totalBudget = activeInvoice.totalAmount || 0;
//   const canShowRequestActions = canApproveRequest(activeInvoice);

//   const paymentDetails = activeInvoice.paymentDetails as
//     | {
//         paymentMethod?: string;
//         amount?: number;
//         vendor?: string;
//         vendors?: string[];
//         transactionReference?: string;
//         chequeNumber?: string;
//         bankReceiptUrl?: string;
//         paymentNotes?: string;
//         releasedAt?: any;
//         releasedByName?: string;
//         selectedAccount?: {
//           accountName?: string;
//           accountNumber?: string;
//           bankName?: string;
//         };
//       }
//     | undefined;

//   const vendorText = Array.isArray(paymentDetails?.vendors)
//     ? paymentDetails?.vendors.join(", ")
//     : paymentDetails?.vendor || "-";

//   const displaySubject =
//     (activeInvoice as any).subject ||
//     (invoiceType === "project" ? (activeInvoice as any).title || "-" : "-");

//   const canSubmitExpense =
//     invoiceType === "project" &&
//     !!onSubmitExpense &&
//     ["approved", "payment_released"].includes(String(activeInvoice.status || ""));


//   function getExportFileName(extension: "pdf" | "xlsx") {
//     const requestId = String(activeInvoice.requestId || "budget-detail")
//       .trim()
//       .replace(/[^a-zA-Z0-9-_]+/g, "-")
//       .replace(/-+/g, "-");

//     return `Budget-Detail-${requestId || "request"}.${extension}`;
//   }

//   function getLineItemExportRows() {
//     return lineItems.map((item: any, index: number) => {
//       const status = item.status || "pending";

//       return {
//         "#": index + 1,
//         Vendor: item.vendor || "-",
//         Service: item.service || "-",
//         Description: item.description || "-",
//         "Requester Comment": item.comment || "-",
//         Qty: item.units ?? 0,
//         Rate: Number(item.unitRate ?? 0),
//         Amount: getItemAmount(item),
//         Status: getReadableStatus(status),
//         "Reviewed By": item.reviewedBy || item.approvedBy || item.rejectedBy || "-",
//         "Reviewed At": toDateString(item.reviewedAt || item.approvedAt || item.rejectedAt),
//         "Rejection Reason": item.rejectionComment || "-",
//       };
//     });
//   }

//   function getSummaryExportRows() {
//     const rows = [
//       { Field: "Request ID", Value: activeInvoice.requestId || "-" },
//       { Field: "Request Type", Value: getReadableStatus(invoiceType) },
//       { Field: "Status", Value: getReadableStatus(activeInvoice.status) },
//       { Field: "Subject", Value: displaySubject || "-" },
//       { Field: "Submitted Date", Value: toDateString(activeInvoice.submittedAt) },
//       { Field: "Total Budget", Value: `Rs ${formatPKR(totalBudget)}` },
//       { Field: "Approved Amount", Value: `Rs ${formatPKR(approvedTotal)}` },
//       { Field: "Rejected Amount", Value: `Rs ${formatPKR(rejectedTotal)}` },
//       { Field: "Pending Amount", Value: `Rs ${formatPKR(pendingTotal)}` },
//     ];

//     if (invoiceType === "general") {
//       rows.splice(3, 0, {
//         Field: "Title",
//         Value: (activeInvoice as any).title || "-",
//       });
//     } else {
//       rows.splice(
//         3,
//         0,
//         { Field: "Client", Value: activeInvoice.clientName || "-" },
//         { Field: "Project", Value: activeInvoice.project || "-" },
//         { Field: "Project Code", Value: (activeInvoice as any).projectCode || "-" }
//       );
//     }

//     const message = (activeInvoice as any).message || (activeInvoice as any).comment;
//     if (message) {
//       rows.push({ Field: "Message", Value: message });
//     }

//     return rows;
//   }

//   function getPaymentExportRows() {
//     if (!paymentDetails) return [];

//     const rows = [
//       { Field: "Payment Method", Value: paymentDetails.paymentMethod || "-" },
//       { Field: "Amount Paid", Value: `Rs ${formatPKR(paymentDetails.amount)}` },
//       { Field: "Vendor(s)", Value: vendorText },
//       { Field: "Transaction Ref", Value: paymentDetails.transactionReference || "-" },
//       { Field: "Cheque Number", Value: paymentDetails.chequeNumber || "-" },
//       { Field: "Released By", Value: paymentDetails.releasedByName || "-" },
//       { Field: "Released At", Value: toDateString(paymentDetails.releasedAt) },
//       { Field: "Bank Receipt", Value: paymentDetails.bankReceiptUrl || "-" },
//       { Field: "Notes", Value: paymentDetails.paymentNotes || "-" },
//     ];

//     if (paymentDetails.selectedAccount) {
//       rows.push(
//         {
//           Field: "Account Name",
//           Value: paymentDetails.selectedAccount.accountName || "-",
//         },
//         {
//           Field: "Account Number",
//           Value: paymentDetails.selectedAccount.accountNumber || "-",
//         },
//         {
//           Field: "Bank Name",
//           Value: paymentDetails.selectedAccount.bankName || "-",
//         }
//       );
//     }

//     return rows;
//   }


//   function handleExportPDF() {
//     try {
//       const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
//       const pageWidth = pdf.internal.pageSize.getWidth();
//       const generatedAt = new Date().toLocaleString();

//       pdf.setFontSize(18);
//       pdf.text("Budget Detail", 40, 40);
//       pdf.setFontSize(10);
//       pdf.text(`Request ID: ${activeInvoice.requestId || "-"}`, 40, 58);
//       pdf.text(`Generated: ${generatedAt}`, pageWidth - 40, 58, { align: "right" });

//       autoTable(pdf, {
//         startY: 82,
//         head: [["Field", "Value"]],
//         body: getSummaryExportRows().map((row) => [row.Field, row.Value]),
//         theme: "grid",
//         styles: { fontSize: 9, cellPadding: 5, overflow: "linebreak" },
//         headStyles: { fillColor: [15, 23, 42] },
//         columnStyles: {
//           0: { cellWidth: 150, fontStyle: "bold" },
//           1: { cellWidth: "auto" },
//         },
//       });

//       autoTable(pdf, {
//         startY: (pdf as any).lastAutoTable.finalY + 24,
//         head: [["#", "Vendor", "Service", "Description", "Comment", "Qty", "Rate", "Amount", "Status", "Rejection Reason"]],
//         body: getLineItemExportRows().map((row) => [
//           row["#"],
//           row.Vendor,
//           row.Service,
//           row.Description,
//           row["Requester Comment"],
//           row.Qty,
//           `Rs ${formatPKR(row.Rate)}`,
//           `Rs ${formatPKR(row.Amount)}`,
//           row.Status,
//           row["Rejection Reason"],
//         ]),
//         theme: "striped",
//         styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
//         headStyles: { fillColor: [15, 23, 42] },
//         columnStyles: {
//           0: { cellWidth: 28 },
//           1: { cellWidth: 82 },
//           2: { cellWidth: 82 },
//           3: { cellWidth: 145 },
//           4: { cellWidth: 120 },
//           5: { cellWidth: 40, halign: "right" },
//           6: { cellWidth: 72, halign: "right" },
//           7: { cellWidth: 78, halign: "right" },
//           8: { cellWidth: 72 },
//           9: { cellWidth: 120 },
//         },
//       });

//       const paymentRows = getPaymentExportRows();
//       if (paymentRows.length) {
//         autoTable(pdf, {
//           startY: (pdf as any).lastAutoTable.finalY + 24,
//           head: [["Payment Field", "Value"]],
//           body: paymentRows.map((row) => [row.Field, row.Value]),
//           theme: "grid",
//           styles: { fontSize: 9, cellPadding: 5, overflow: "linebreak" },
//           headStyles: { fillColor: [15, 23, 42] },
//           columnStyles: { 0: { cellWidth: 150, fontStyle: "bold" } },
//         });
//       }


//       pdf.save(getExportFileName("pdf"));

//       toast({
//         title: "PDF exported",
//         description: "Budget detail PDF has been downloaded.",
//       });
//     } catch (error) {
//       console.error("Failed to export PDF:", error);
//       toast({
//         title: "Export failed",
//         description: "Failed to export Budget Detail PDF.",
//         variant: "destructive",
//       });
//     }
//   }

//   function handleExportExcel() {
//     try {
//       const workbook = XLSX.utils.book_new();

//       const summarySheet = XLSX.utils.json_to_sheet(getSummaryExportRows());
//       XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

//       const lineItemsSheet = XLSX.utils.json_to_sheet(getLineItemExportRows());
//       XLSX.utils.book_append_sheet(workbook, lineItemsSheet, "Line Items");

//       const paymentRows = getPaymentExportRows();
//       if (paymentRows.length) {
//         const paymentSheet = XLSX.utils.json_to_sheet(paymentRows);
//         XLSX.utils.book_append_sheet(workbook, paymentSheet, "Payment Details");
//       }


//       XLSX.writeFile(workbook, getExportFileName("xlsx"));

//       toast({
//         title: "Excel exported",
//         description: "Budget detail Excel file has been downloaded.",
//       });
//     } catch (error) {
//       console.error("Failed to export Excel:", error);
//       toast({
//         title: "Export failed",
//         description: "Failed to export Budget Detail Excel file.",
//         variant: "destructive",
//       });
//     }
//   }

//   return (
//     <>
//       <Dialog
//         open={isOpen}
//         onOpenChange={(open) => {
//           // Keep the main Budget Detail modal open for overlay clicks, Escape,
//           // and Radix/shadcn default close triggers. Only explicit Close buttons
//           // below should call onClose().
//           if (open) return;
//         }}
//       >
//         <DialogContent
//           onPointerDownOutside={(event) => event.preventDefault()}
//           onInteractOutside={(event) => event.preventDefault()}
//           onEscapeKeyDown={(event) => event.preventDefault()}
//           className="!left-0 !top-0 flex !h-screen !max-h-screen !w-screen !max-w-none !translate-x-0 !translate-y-0 flex-col overflow-hidden rounded-none border-0 bg-slate-50 p-0 shadow-2xl [&>button:last-child]:hidden"
//         >
//           <div className="shrink-0 border-b bg-white/95 px-6 py-5 backdrop-blur">
//             <DialogHeader>
//               <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
//                 <div>
//                   <DialogTitle className="text-2xl font-bold tracking-tight text-slate-950">
//                     Budget Detail
//                   </DialogTitle>
//                   <DialogDescription className="mt-1 text-sm text-slate-500">
//                     Request Form Details – {activeInvoice.requestId}
//                   </DialogDescription>
//                 </div>

//                 <div className="flex flex-wrap items-center gap-2">
//                   <Badge className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeColor(activeInvoice.status)}`}>
//                     {getReadableStatus(activeInvoice.status)}
//                   </Badge>

//                   {/* <Button
//                     type="button"
//                     size="sm"
//                     variant="outline"
//                     className="rounded-full px-4 shadow-sm"
//                     onClick={handleExportPDF}
//                   >
//                     <FileText className="mr-1 h-4 w-4" />
//                     Export PDF
//                   </Button>

//                   <Button
//                     type="button"
//                     size="sm"
//                     variant="outline"
//                     className="rounded-full px-4 shadow-sm"
//                     onClick={handleExportExcel}
//                   >
//                     <FileSpreadsheet className="mr-1 h-4 w-4" />
//                     Export Excel
//                   </Button> */}

//                   {canSubmitExpense && (
//                     <Button
//                       size="sm"
//                       className="rounded-full bg-slate-950 px-4 text-white shadow-sm hover:bg-slate-800"
//                       onClick={() => onSubmitExpense?.(activeInvoice)}
//                     >
//                       <ReceiptText className="mr-1 h-4 w-4" />
//                       Submit Expense
//                     </Button>
//                   )}

//                   {canShowRequestActions && (
//                     <>
//                       <Button
//                         size="sm"
//                         className="rounded-full bg-green-600 px-4 text-white shadow-sm hover:bg-green-700"
//                         disabled={requestActionLoading}
//                         onClick={handleApproveRequest}
//                       >
//                         <Check className="mr-1 h-4 w-4" />
//                         {requestActionLoading ? "Approving..." : "Approve Request"}
//                       </Button>

//                       <Button
//                         size="sm"
//                         variant="destructive"
//                         className="rounded-full px-4 shadow-sm"
//                         disabled={requestActionLoading}
//                         onClick={() => {
//                           setRequestRejectionComment("");
//                           setRequestRejectDialogOpen(true);
//                         }}
//                       >
//                         <X className="mr-1 h-4 w-4" />
//                         Reject Request
//                       </Button>
//                     </>
//                   )}

//                   <Button
//                     type="button"
//                     size="sm"
//                     variant="outline"
//                     aria-label="Close Budget Detail"
//                     className="rounded-full px-4 shadow-sm"
//                     onClick={onClose}
//                   >
//                     <X className="mr-1 h-4 w-4" />
//                     Close
//                   </Button>
//                 </div>
//               </div>
//             </DialogHeader>
//           </div>

//           <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
//               <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//                 <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                   Total Budget
//                 </p>
//                 <p className="mt-2 text-2xl font-bold text-slate-950">
//                   Rs {formatPKR(totalBudget)}
//                 </p>
//               </div>

//               <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
//                 <p className="text-xs font-medium uppercase tracking-wide text-green-600">
//                   Approved Amount
//                 </p>
//                 <p className="mt-2 text-2xl font-bold text-green-700">
//                   Rs {formatPKR(approvedTotal)}
//                 </p>
//               </div>

//               <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
//                 <p className="text-xs font-medium uppercase tracking-wide text-red-600">
//                   Rejected Amount
//                 </p>
//                 <p className="mt-2 text-2xl font-bold text-red-700">
//                   Rs {formatPKR(rejectedTotal)}
//                 </p>
//               </div>
//             </div>

//             <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//               <div className="mb-4 flex items-center justify-between">
//                 <h3 className="text-base font-semibold text-slate-950">
//                   Request Information
//                 </h3>
//               </div>

//               <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
//                 <div className="rounded-xl bg-slate-50 p-4">
//                   <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Request ID
//                   </span>
//                   <p className="mt-1 font-semibold text-slate-950">
//                     {activeInvoice.requestId}
//                   </p>
//                 </div>

//                 <div className="rounded-xl bg-slate-50 p-4">
//                   <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Status
//                   </span>
//                   <div className="mt-2">
//                     <Badge className={`rounded-full border px-3 py-1 ${getStatusBadgeColor(activeInvoice.status)}`}>
//                       {getReadableStatus(activeInvoice.status)}
//                     </Badge>
//                   </div>
//                 </div>

//                 {invoiceType === "general" ? (
//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Title
//                     </span>
//                     <p className="mt-1 font-semibold text-slate-950">
//                       {(activeInvoice as any).title || "-"}
//                     </p>
//                   </div>
//                 ) : (
//                   <>
//                     <div className="rounded-xl bg-slate-50 p-4">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Client
//                       </span>
//                       <p className="mt-1 font-semibold text-slate-950">
//                         {activeInvoice.clientName || "-"}
//                       </p>
//                     </div>

//                     <div className="rounded-xl bg-slate-50 p-4">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Project
//                       </span>
//                       <p className="mt-1 font-semibold text-slate-950">
//                         {activeInvoice.project || "-"}
//                       </p>
//                     </div>

//                     <div className="rounded-xl bg-slate-50 p-4">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Project Code
//                       </span>
//                       <p className="mt-1 font-semibold text-slate-950">
//                         {(activeInvoice as any).projectCode || "-"}
//                       </p>
//                     </div>
//                   </>
//                 )}

//                 <div className="rounded-xl bg-slate-50 p-4 md:col-span-2">
//                   <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Subject
//                   </span>
//                   <p className="mt-1 whitespace-pre-wrap break-words font-semibold text-slate-950">
//                     {displaySubject}
//                   </p>
//                 </div>

//                 <div className="rounded-xl bg-slate-50 p-4">
//                   <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Submitted Date
//                   </span>
//                   <p className="mt-1 text-slate-800">
//                     {toDateString(activeInvoice.submittedAt)}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {((activeInvoice as any).message || (activeInvoice as any).comment) && (
//               <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//                 <h3 className="mb-3 text-base font-semibold text-slate-950">
//                   Message
//                 </h3>
//                 <div className="min-h-[100px] rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-wrap break-words">
//                   {(activeInvoice as any).message || (activeInvoice as any).comment || "-"}
//                 </div>
//               </div>
//             )}

//             <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
//               <div className="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
//                 <div>
//                   <h3 className="text-lg font-semibold text-slate-950">
//                     Item Approval
//                   </h3>
//                   <p className="mt-1 text-sm text-slate-500">
//                     Approve or reject individual budget items. Request-level approve/reject is also available here.
//                   </p>
//                 </div>

//                 <div className="flex flex-wrap gap-2">
//                   {/* <Button
//                     type="button"
//                     size="sm"
//                     variant="outline"
//                     className="rounded-full px-4"
//                     onClick={handleExportPDF}
//                   >
//                     <FileText className="mr-1 h-4 w-4" />
//                     PDF
//                   </Button>

//                   <Button
//                     type="button"
//                     size="sm"
//                     variant="outline"
//                     className="rounded-full px-4"
//                     onClick={handleExportExcel}
//                   >
//                     <FileSpreadsheet className="mr-1 h-4 w-4" />
//                     Excel
//                   </Button> */}

//                   {canSubmitExpense && (
//                     <Button
//                       size="sm"
//                       className="rounded-full bg-slate-950 px-4 text-white hover:bg-slate-800"
//                       onClick={() => onSubmitExpense?.(activeInvoice)}
//                     >
//                       <ReceiptText className="mr-1 h-4 w-4" />
//                       Submit Expense
//                     </Button>
//                   )}

//                   {canShowRequestActions && (
//                     <>
//                     {/* <Button
//                       size="sm"
//                       className="rounded-full bg-green-600 px-4 text-white hover:bg-green-700"
//                       disabled={requestActionLoading}
//                       onClick={handleApproveRequest}
//                     >
//                       <Check className="mr-1 h-4 w-4" />
//                       Approve Request
//                     </Button>

//                     <Button
//                       size="sm"
//                       variant="destructive"
//                       className="rounded-full px-4"
//                       disabled={requestActionLoading}
//                       onClick={() => {
//                         setRequestRejectionComment("");
//                         setRequestRejectDialogOpen(true);
//                       }}
//                     >
//                       <X className="mr-1 h-4 w-4" />
//                       Reject Request
//                     </Button> */}
//                     </>
//                   )}
//                 </div>
//               </div>

//               <div className="overflow-x-auto">
//                 <table className="w-full min-w-[1050px] text-sm">
//                   <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
//                     <tr>
//                       <th className="px-4 py-3 text-left font-semibold">Vendor</th>
//                       <th className="px-4 py-3 text-left font-semibold">Service</th>
//                       <th className="px-4 py-3 text-left font-semibold">Description</th>
//                       <th className="px-4 py-3 text-left font-semibold min-w-[220px]">
//                         Requester Comment
//                       </th>
//                       <th className="px-4 py-3 text-right font-semibold">Qty</th>
//                       <th className="px-4 py-3 text-right font-semibold">Rate</th>
//                       <th className="px-4 py-3 text-right font-semibold">Amount</th>
//                       <th className="px-4 py-3 text-center font-semibold min-w-[180px]">
//                         Item Action
//                       </th>
//                       <th className="px-4 py-3 text-left font-semibold min-w-[240px]">
//                         Rejection Reason
//                       </th>
//                     </tr>
//                   </thead>

//                   <tbody className="divide-y divide-slate-100">
//                     {lineItems.length === 0 ? (
//                       <tr>
//                         <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
//                           No line items found.
//                         </td>
//                       </tr>
//                     ) : (
//                       lineItems.map((item, index) => {
//                         const qty = item.units ?? 0;
//                         const rate = item.unitRate ?? 0;
//                         const amount = getItemAmount(item);
//                         const status = item.status || "pending";

//                         return (
//                           <tr key={item.id || index} className="align-top transition hover:bg-slate-50/80">
//                             <td className="px-4 py-4 font-medium text-slate-950">
//                               {item.vendor || "-"}
//                             </td>
//                             <td className="px-4 py-4 text-slate-700">
//                               {item.service || "-"}
//                             </td>
//                             <td className="px-4 py-4 whitespace-pre-wrap break-words text-slate-700">
//                               {item.description || "-"}
//                             </td>
//                             <td className="px-4 py-4 whitespace-pre-wrap break-words text-slate-700">
//                               {item.comment || "-"}
//                             </td>
//                             <td className="px-4 py-4 text-right text-slate-700">{qty}</td>
//                             <td className="px-4 py-4 text-right text-slate-700">
//                               Rs {formatPKR(rate)}
//                             </td>
//                             <td className="px-4 py-4 text-right font-semibold text-slate-950">
//                               Rs {formatPKR(amount)}
//                             </td>

//                             <td className="px-4 py-4 text-center">
//                               {isMainAdmin && status === "pending" ? (
//                                 <div className="flex flex-wrap justify-center gap-2">
//                                   <Button
//                                     size="sm"
//                                     className="rounded-full bg-green-600 px-3 text-white hover:bg-green-700"
//                                     disabled={itemActionLoading}
//                                     onClick={() => updateLineItemStatus(index, "approved")}
//                                   >
//                                     <Check className="mr-1 h-4 w-4" />
//                                     Approve
//                                   </Button>

//                                   <Button
//                                     size="sm"
//                                     variant="destructive"
//                                     className="rounded-full px-3"
//                                     disabled={itemActionLoading}
//                                     onClick={() => openItemRejectDialog(index)}
//                                   >
//                                     <X className="mr-1 h-4 w-4" />
//                                     Reject
//                                   </Button>
//                                 </div>
//                               ) : (
//                                 <Badge className={`rounded-full border px-3 py-1 ${getItemStatusBadgeColor(status)}`}>
//                                   {getReadableStatus(status)}
//                                 </Badge>
//                               )}
//                             </td>

//                             <td className="px-4 py-4 whitespace-pre-wrap break-words text-sm">
//                               {item.rejectionComment ? (
//                                 <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-red-700">
//                                   {item.rejectionComment}
//                                 </div>
//                               ) : (
//                                 <span className="text-slate-400">-</span>
//                               )}
//                             </td>
//                           </tr>
//                         );
//                       })
//                     )}
//                   </tbody>
//                 </table>
//               </div>

//               <div className="grid grid-cols-1 gap-3 border-t border-slate-200 bg-slate-50 p-5 md:grid-cols-4">
//                 <div className="rounded-xl bg-white p-4 shadow-sm">
//                   <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Total Budget
//                   </span>
//                   <p className="mt-1 font-bold text-slate-950">
//                     Rs {formatPKR(totalBudget)}
//                   </p>
//                 </div>

//                 <div className="rounded-xl bg-white p-4 shadow-sm">
//                   <span className="text-xs font-medium uppercase tracking-wide text-green-600">
//                     Approved
//                   </span>
//                   <p className="mt-1 font-bold text-green-700">
//                     Rs {formatPKR(approvedTotal)}
//                   </p>
//                 </div>

//                 <div className="rounded-xl bg-white p-4 shadow-sm">
//                   <span className="text-xs font-medium uppercase tracking-wide text-red-600">
//                     Rejected
//                   </span>
//                   <p className="mt-1 font-bold text-red-700">
//                     Rs {formatPKR(rejectedTotal)}
//                   </p>
//                 </div>

//                 <div className="rounded-xl bg-white p-4 shadow-sm">
//                   <span className="text-xs font-medium uppercase tracking-wide text-amber-600">
//                     Pending
//                   </span>
//                   <p className="mt-1 font-bold text-amber-700">
//                     Rs {formatPKR(pendingTotal)}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {paymentDetails && (
//               <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//                 <h3 className="mb-4 text-lg font-semibold text-slate-950">
//                   Payment Details
//                 </h3>

//                 <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Payment Method
//                     </span>
//                     <p className="mt-1 font-medium text-slate-950">
//                       {paymentDetails.paymentMethod || "-"}
//                     </p>
//                   </div>

//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Amount Paid
//                     </span>
//                     <p className="mt-1 font-semibold text-slate-950">
//                       Rs {formatPKR(paymentDetails.amount)}
//                     </p>
//                   </div>

//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Vendor(s)
//                     </span>
//                     <p className="mt-1 text-slate-800">{vendorText}</p>
//                   </div>

//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Transaction Ref
//                     </span>
//                     <p className="mt-1 text-slate-800">
//                       {paymentDetails.transactionReference || "-"}
//                     </p>
//                   </div>

//                   {paymentDetails.chequeNumber && (
//                     <div className="rounded-xl bg-slate-50 p-4">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Cheque Number
//                       </span>
//                       <p className="mt-1 text-slate-800">
//                         {paymentDetails.chequeNumber}
//                       </p>
//                     </div>
//                   )}

//                   {paymentDetails.releasedByName && (
//                     <div className="rounded-xl bg-slate-50 p-4">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Released By
//                       </span>
//                       <p className="mt-1 text-slate-800">
//                         {paymentDetails.releasedByName}
//                       </p>
//                     </div>
//                   )}

//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Released At
//                     </span>
//                     <p className="mt-1 text-slate-800">
//                       {toDateString(paymentDetails.releasedAt)}
//                     </p>
//                   </div>

//                   {paymentDetails.selectedAccount && (
//                     <div className="rounded-xl bg-slate-50 p-4">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Selected Account
//                       </span>
//                       <p className="mt-1 text-slate-800">
//                         {paymentDetails.selectedAccount.accountName || "-"}
//                         {paymentDetails.selectedAccount.accountNumber
//                           ? ` (${paymentDetails.selectedAccount.accountNumber})`
//                           : ""}
//                       </p>
//                     </div>
//                   )}

//                   {paymentDetails.paymentNotes && (
//                     <div className="rounded-xl bg-slate-50 p-4 md:col-span-2 lg:col-span-3">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Notes
//                       </span>
//                       <p className="mt-1 whitespace-pre-wrap break-words text-slate-800">
//                         {paymentDetails.paymentNotes}
//                       </p>
//                     </div>
//                   )}

//                   {paymentDetails.bankReceiptUrl && (
//                     <div className="md:col-span-2 lg:col-span-3">
//                       <a
//                         href={paymentDetails.bankReceiptUrl}
//                         target="_blank"
//                         rel="noreferrer"
//                         className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
//                       >
//                         View Bank Receipt
//                       </a>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>

//           <div className="shrink-0 flex flex-wrap justify-end gap-2 border-t bg-white/95 px-6 py-4 backdrop-blur">
//             <Button
//               type="button"
//               variant="outline"
//               className="rounded-full px-5"
//               onClick={handleExportPDF}
//             >
//               <FileText className="mr-2 h-4 w-4" />
//               Export PDF
//             </Button>

//             <Button
//               type="button"
//               variant="outline"
//               className="rounded-full px-5"
//               onClick={handleExportExcel}
//             >
//               <FileSpreadsheet className="mr-2 h-4 w-4" />
//               Export Excel
//             </Button>

//             <Button variant="outline" className="rounded-full px-5" onClick={onClose}>
//               Close
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>

//       <Dialog
//         open={itemRejectDialogOpen}
//         onOpenChange={(open) => {
//           setItemRejectDialogOpen(open);
//           if (!open) {
//             setPendingRejectIndex(null);
//             setItemRejectionComment("");
//           }
//         }}
//       >
//         <DialogContent className="max-w-lg rounded-2xl">
//           <DialogHeader>
//             <DialogTitle>Reject Line Item</DialogTitle>
//             <DialogDescription>
//               Please enter the reason for rejecting this item. This comment will be visible to the requester.
//             </DialogDescription>
//           </DialogHeader>

//           <div className="space-y-3">
//             <Textarea
//               value={itemRejectionComment}
//               onChange={(e) => setItemRejectionComment(e.target.value)}
//               placeholder="Enter rejection reason"
//               rows={5}
//               className="rounded-xl"
//             />
//           </div>

//           <div className="mt-4 flex justify-end gap-2">
//             <Button
//               variant="outline"
//               className="rounded-full"
//               onClick={() => {
//                 setItemRejectDialogOpen(false);
//                 setPendingRejectIndex(null);
//                 setItemRejectionComment("");
//               }}
//             >
//               Cancel
//             </Button>

//             <Button
//               variant="destructive"
//               className="rounded-full"
//               disabled={!itemRejectionComment.trim() || itemActionLoading}
//               onClick={handleItemRejectConfirm}
//             >
//               {itemActionLoading ? "Rejecting..." : "Confirm Reject"}
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>

//       <Dialog
//         open={requestRejectDialogOpen}
//         onOpenChange={(open) => {
//           setRequestRejectDialogOpen(open);
//           if (!open) setRequestRejectionComment("");
//         }}
//       >
//         <DialogContent className="max-w-lg rounded-2xl">
//           <DialogHeader>
//             <DialogTitle>Reject Request</DialogTitle>
//             <DialogDescription>
//               Please enter the reason for rejecting this request. It will be saved in the approval history and sent back to Operational Admin.
//             </DialogDescription>
//           </DialogHeader>

//           <div className="space-y-3">
//             <Textarea
//               value={requestRejectionComment}
//               onChange={(e) => setRequestRejectionComment(e.target.value)}
//               placeholder="Enter request rejection reason"
//               rows={5}
//               className="rounded-xl"
//             />
//           </div>

//           <div className="mt-4 flex justify-end gap-2">
//             <Button
//               variant="outline"
//               className="rounded-full"
//               onClick={() => {
//                 setRequestRejectDialogOpen(false);
//                 setRequestRejectionComment("");
//               }}
//             >
//               Cancel
//             </Button>

//             <Button
//               variant="destructive"
//               className="rounded-full"
//               disabled={!requestRejectionComment.trim() || requestActionLoading}
//               onClick={handleRejectRequest}
//             >
//               {requestActionLoading ? "Rejecting..." : "Confirm Reject"}
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// }





// import { InvoiceRequest } from "@shared/schema";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { Check, FileSpreadsheet, FileText, ReceiptText, X } from "lucide-react";
// import { doc, updateDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { useAuth } from "@/contexts/AuthContext";
// import { useToast } from "@/hooks/use-toast";
// import { useState, useEffect } from "react";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
// import * as XLSX from "xlsx";

// function toDateString(timestamp: any): string {
//   if (!timestamp) return "N/A";

//   if (timestamp.toDate && typeof timestamp.toDate === "function") {
//     return timestamp.toDate().toLocaleString();
//   }

//   if (timestamp instanceof Date) {
//     return timestamp.toLocaleString();
//   }

//   try {
//     return new Date(timestamp).toLocaleString();
//   } catch {
//     return "N/A";
//   }
// }

// function formatPKR(value: number | string | undefined) {
//   if (value === null || value === undefined) return "0.00";

//   const num =
//     typeof value === "number"
//       ? value
//       : parseFloat(String(value).replace(/,/g, "")) || 0;

//   return num.toLocaleString("en-PK", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });
// }

// function getItemAmount(item: any) {
//   const qty = Number(item?.units ?? 0);
//   const rate = Number(item?.unitRate ?? 0);
//   const tax = Number(item?.tax ?? 0);
//   const total = Number(item?.total ?? qty * rate + tax);

//   return Number.isFinite(total) ? total : 0;
// }

// function getReadableStatus(status?: string) {
//   if (!status) return "Pending";

//   return status
//     .replace(/_/g, " ")
//     .replace(/\b\w/g, (char) => char.toUpperCase());
// }

// function getChequeNumbers(paymentDetails: any): string[] {
//   const chequeNumbersFromArray = Array.isArray(paymentDetails?.chequeNumbers)
//     ? paymentDetails.chequeNumbers
//     : [];

//   const oldSingleChequeNumber = paymentDetails?.chequeNumber
//     ? [paymentDetails.chequeNumber]
//     : [];

//   return Array.from(
//     new Set(
//       [...chequeNumbersFromArray, ...oldSingleChequeNumber]
//         .map((num) => String(num || "").trim())
//         .filter(Boolean)
//     )
//   );
// }

// interface BudgetDetailsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   invoice: InvoiceRequest | null;
//   onSubmitExpense?: (request: InvoiceRequest) => void;
// }

// export default function BudgetDetailsModal({
//   isOpen,
//   onClose,
//   invoice,
//   onSubmitExpense,
// }: BudgetDetailsModalProps) {
//   const { userProfile } = useAuth();
//   const { toast } = useToast();

//   const isMainAdmin = userProfile?.role === "main_admin";

//   const [liveInvoice, setLiveInvoice] = useState<InvoiceRequest | null>(invoice);
//   const [lineItems, setLineItems] = useState<any[]>(invoice?.lineItems || []);

//   const [itemRejectDialogOpen, setItemRejectDialogOpen] = useState(false);
//   const [pendingRejectIndex, setPendingRejectIndex] = useState<number | null>(
//     null
//   );
//   const [itemRejectionComment, setItemRejectionComment] = useState("");
//   const [itemActionLoading, setItemActionLoading] = useState(false);

//   const [requestRejectDialogOpen, setRequestRejectDialogOpen] = useState(false);
//   const [requestRejectionComment, setRequestRejectionComment] = useState("");
//   const [requestActionLoading, setRequestActionLoading] = useState(false);

//   useEffect(() => {
//     setLiveInvoice(invoice);
//     setLineItems(invoice?.lineItems || []);
//   }, [invoice]);

//   useEffect(() => {
//     if (!invoice?.id || !isOpen) return;

//     const ref = doc(
//       db,
//       "Panels",
//       "IEDGE-SYSTEM",
//       "invoiceRequests",
//       invoice.id
//     );

//     const unsub = onSnapshot(ref, (snap) => {
//       if (snap.exists()) {
//         const freshInvoice = {
//           id: snap.id,
//           ...snap.data(),
//         } as InvoiceRequest;

//         setLiveInvoice(freshInvoice);
//         setLineItems(freshInvoice.lineItems || []);
//       }
//     });

//     return () => unsub();
//   }, [invoice?.id, isOpen]);

//   if (!liveInvoice) return null;

//   const activeInvoice = liveInvoice;

//   const invoiceType =
//     (activeInvoice as any).invoiceType ||
//     (activeInvoice.clientName ? "project" : "general");

//   function getStatusBadgeColor(status: string): string {
//     switch (status) {
//       case "approved":
//       case "payment_released":
//         return "border-green-200 bg-green-50 text-green-700";
//       case "rejected":
//         return "border-red-200 bg-red-50 text-red-700";
//       case "pending_operational_admin":
//       case "pending_main_admin":
//       case "pending_finance":
//         return "border-amber-200 bg-amber-50 text-amber-700";
//       default:
//         return "border-blue-200 bg-blue-50 text-blue-700";
//     }
//   }

//   function getItemStatusBadgeColor(status: string): string {
//     switch (status) {
//       case "approved":
//         return "border-green-200 bg-green-50 text-green-700";
//       case "rejected":
//         return "border-red-200 bg-red-50 text-red-700";
//       default:
//         return "border-amber-200 bg-amber-50 text-amber-700";
//     }
//   }

//   function canApproveRequest(request: InvoiceRequest): boolean {
//     if (!userProfile) return false;

//     switch (userProfile.role) {
//       case "operational_admin":
//         return request.status === "pending_operational_admin";
//       case "main_admin":
//         return request.status === "pending_main_admin";
//       case "finance":
//       case "financial_admin":
//         return request.status === "pending_finance";
//       default:
//         return false;
//     }
//   }

//   async function handleApproveRequest() {
//     if (!activeInvoice?.id || !userProfile) return;

//     try {
//       setRequestActionLoading(true);

//       let newStatus = activeInvoice.status;
//       let currentApprover = "";

//       switch (userProfile.role) {
//         case "operational_admin":
//           if (activeInvoice.status === "pending_operational_admin") {
//             newStatus = "pending_main_admin" as any;
//           }
//           break;

//         case "main_admin":
//           if (activeInvoice.status === "pending_main_admin") {
//             newStatus = "pending_finance" as any;
//           }
//           break;

//         case "finance":
//         case "financial_admin":
//           if (activeInvoice.status === "pending_finance") {
//             newStatus = "approved" as any;
//           }
//           break;
//       }

//       if (newStatus === activeInvoice.status) {
//         toast({
//           title: "Action not available",
//           description: "This request is not pending your approval step.",
//           variant: "destructive",
//         });
//         return;
//       }

//       await updateDoc(
//         doc(db, "Panels", "IEDGE-SYSTEM", "invoiceRequests", activeInvoice.id),
//         {
//           status: newStatus,
//           currentApprover,
//           approvalHistory: [
//             ...((activeInvoice as any).approvalHistory || []),
//             {
//               approver: userProfile.displayName,
//               action: "approved",
//               timestamp: new Date(),
//               notes: "",
//             },
//           ],
//           updatedAt: serverTimestamp(),
//         }
//       );

//       setLiveInvoice({ ...activeInvoice, status: newStatus } as InvoiceRequest);

//       toast({
//         title: "Request approved",
//         description: "The request status has been updated successfully.",
//       });
//     } catch (error: any) {
//       console.error("Failed to approve request:", error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to approve request",
//         variant: "destructive",
//       });
//     } finally {
//       setRequestActionLoading(false);
//     }
//   }

//   async function handleRejectRequest() {
//     if (!activeInvoice?.id || !userProfile) return;

//     const reason = requestRejectionComment.trim();

//     if (!reason) {
//       toast({
//         title: "Rejection comment required",
//         description: "Please enter the reason for rejecting this request.",
//         variant: "destructive",
//       });
//       return;
//     }

//     try {
//       setRequestActionLoading(true);

//       await updateDoc(
//         doc(db, "Panels", "IEDGE-SYSTEM", "invoiceRequests", activeInvoice.id),
//         {
//           status: "pending_operational_admin",
//           approvalHistory: [
//             ...((activeInvoice as any).approvalHistory || []),
//             {
//               approver: userProfile.displayName,
//               action: "rejected",
//               timestamp: new Date(),
//               notes: reason,
//             },
//           ],
//           updatedAt: serverTimestamp(),
//         }
//       );

//       setLiveInvoice({
//         ...activeInvoice,
//         status: "pending_operational_admin" as any,
//       } as InvoiceRequest);

//       toast({
//         title: "Request rejected",
//         description: "The request has been sent back with your comment.",
//       });

//       setRequestRejectDialogOpen(false);
//       setRequestRejectionComment("");
//     } catch (error: any) {
//       console.error("Failed to reject request:", error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to reject request",
//         variant: "destructive",
//       });
//     } finally {
//       setRequestActionLoading(false);
//     }
//   }

//   async function updateLineItemStatus(
//     index: number,
//     status: "approved" | "rejected",
//     rejectReason = ""
//   ) {
//     if (!activeInvoice?.id || !userProfile) return;

//     try {
//       setItemActionLoading(true);

//       const updatedItems = lineItems.map((item: any) => ({ ...item }));
//       const now = new Date();
//       const actorName = userProfile.displayName || "Main Admin";
//       const currentItem = updatedItems[index] || {};

//       updatedItems[index] = {
//         ...currentItem,
//         status,
//         reviewedBy: actorName,
//         reviewedAt: now,
//         ...(status === "approved"
//           ? {
//               approvedBy: actorName,
//               approvedAt: now,
//               rejectionComment: "",
//             }
//           : {
//               rejectedBy: actorName,
//               rejectedAt: now,
//               rejectionComment: rejectReason.trim(),
//             }),
//       };

//       await updateDoc(
//         doc(db, "Panels", "IEDGE-SYSTEM", "invoiceRequests", activeInvoice.id),
//         {
//           lineItems: updatedItems,
//           updatedAt: serverTimestamp(),
//         }
//       );

//       setLineItems(updatedItems);

//       toast({
//         title: status === "approved" ? "Item approved" : "Item rejected",
//       });
//     } catch (error) {
//       console.error("Failed to update line item status:", error);
//       toast({
//         title: "Error",
//         description: "Failed to update item status",
//         variant: "destructive",
//       });
//     } finally {
//       setItemActionLoading(false);
//     }
//   }

//   function openItemRejectDialog(index: number) {
//     setPendingRejectIndex(index);
//     setItemRejectionComment("");
//     setItemRejectDialogOpen(true);
//   }

//   async function handleItemRejectConfirm() {
//     if (pendingRejectIndex === null) return;

//     const reason = itemRejectionComment.trim();

//     if (!reason) {
//       toast({
//         title: "Rejection comment required",
//         description: "Please enter the reason for rejecting this item.",
//         variant: "destructive",
//       });
//       return;
//     }

//     await updateLineItemStatus(pendingRejectIndex, "rejected", reason);
//     setItemRejectDialogOpen(false);
//     setPendingRejectIndex(null);
//     setItemRejectionComment("");
//   }

//   const approvedTotal = lineItems
//     .filter((item: any) => item.status === "approved")
//     .reduce((sum: number, item: any) => sum + getItemAmount(item), 0);

//   const rejectedTotal = lineItems
//     .filter((item: any) => item.status === "rejected")
//     .reduce((sum: number, item: any) => sum + getItemAmount(item), 0);

//   const pendingTotal = lineItems
//     .filter((item: any) => !item.status || item.status === "pending")
//     .reduce((sum: number, item: any) => sum + getItemAmount(item), 0);

//   const totalBudget = activeInvoice.totalAmount || 0;
//   const canShowRequestActions = canApproveRequest(activeInvoice);

//   const paymentDetails = activeInvoice.paymentDetails as
//     | {
//         paymentMethod?: string;
//         amount?: number;
//         vendor?: string;
//         vendors?: string[];
//         transactionReference?: string;

//         chequeNumber?: string;
//         chequeNumbers?: string[];

//         bankReceiptUrl?: string;
//         bankReceiptUrls?: string[];

//         paymentNotes?: string;
//         releasedAt?: any;
//         releasedByName?: string;

//         selectedAccount?: {
//           accountName?: string;
//           accountNumber?: string;
//           bankName?: string;
//         };
//       }
//     | undefined;

//   const vendorText = Array.isArray(paymentDetails?.vendors)
//     ? paymentDetails?.vendors.join(", ")
//     : paymentDetails?.vendor || "-";

//   const chequeNumbers = getChequeNumbers(paymentDetails);
//   const chequeNumbersText = chequeNumbers.length ? chequeNumbers.join(", ") : "-";

//   const receiptUrls = Array.from(
//     new Set(
//       [
//         ...(Array.isArray(paymentDetails?.bankReceiptUrls)
//           ? paymentDetails?.bankReceiptUrls
//           : []),
//         paymentDetails?.bankReceiptUrl || "",
//       ]
//         .map((url) => String(url || "").trim())
//         .filter(Boolean)
//     )
//   );

//   const displaySubject =
//     (activeInvoice as any).subject ||
//     (invoiceType === "project" ? (activeInvoice as any).title || "-" : "-");

//   const canSubmitExpense =
//     invoiceType === "project" &&
//     !!onSubmitExpense &&
//     ["approved", "payment_released"].includes(String(activeInvoice.status || ""));

//   function getExportFileName(extension: "pdf" | "xlsx") {
//     const requestId = String(activeInvoice.requestId || "budget-detail")
//       .trim()
//       .replace(/[^a-zA-Z0-9-_]+/g, "-")
//       .replace(/-+/g, "-");

//     return `Budget-Detail-${requestId || "request"}.${extension}`;
//   }

//   function getLineItemExportRows() {
//     return lineItems.map((item: any, index: number) => {
//       const status = item.status || "pending";

//       return {
//         "#": index + 1,
//         Vendor: item.vendor || "-",
//         Service: item.service || "-",
//         Description: item.description || "-",
//         "Requester Comment": item.comment || "-",
//         Qty: item.units ?? 0,
//         Rate: Number(item.unitRate ?? 0),
//         Amount: getItemAmount(item),
//         Status: getReadableStatus(status),
//         "Reviewed By":
//           item.reviewedBy || item.approvedBy || item.rejectedBy || "-",
//         "Reviewed At": toDateString(
//           item.reviewedAt || item.approvedAt || item.rejectedAt
//         ),
//         "Rejection Reason": item.rejectionComment || "-",
//       };
//     });
//   }

//   function getSummaryExportRows() {
//     const rows = [
//       { Field: "Request ID", Value: activeInvoice.requestId || "-" },
//       { Field: "Request Type", Value: getReadableStatus(invoiceType) },
//       { Field: "Status", Value: getReadableStatus(activeInvoice.status) },
//       { Field: "Subject", Value: displaySubject || "-" },
//       { Field: "Submitted Date", Value: toDateString(activeInvoice.submittedAt) },
//       { Field: "Total Budget", Value: `Rs ${formatPKR(totalBudget)}` },
//       { Field: "Approved Amount", Value: `Rs ${formatPKR(approvedTotal)}` },
//       { Field: "Rejected Amount", Value: `Rs ${formatPKR(rejectedTotal)}` },
//       { Field: "Pending Amount", Value: `Rs ${formatPKR(pendingTotal)}` },
//     ];

//     if (invoiceType === "general") {
//       rows.splice(3, 0, {
//         Field: "Title",
//         Value: (activeInvoice as any).title || "-",
//       });
//     } else {
//       rows.splice(
//         3,
//         0,
//         { Field: "Client", Value: activeInvoice.clientName || "-" },
//         { Field: "Project", Value: activeInvoice.project || "-" },
//         {
//           Field: "Project Code",
//           Value: (activeInvoice as any).projectCode || "-",
//         }
//       );
//     }

//     const message =
//       (activeInvoice as any).message || (activeInvoice as any).comment;

//     if (message) {
//       rows.push({ Field: "Message", Value: message });
//     }

//     return rows;
//   }

//   function getPaymentExportRows() {
//     if (!paymentDetails) return [];

//     const rows = [
//       { Field: "Payment Method", Value: paymentDetails.paymentMethod || "-" },
//       { Field: "Amount Paid", Value: `Rs ${formatPKR(paymentDetails.amount)}` },
//       { Field: "Vendor(s)", Value: vendorText },
//       {
//         Field: "Transaction Ref",
//         Value: paymentDetails.transactionReference || "-",
//       },
//       { Field: "Cheque Numbers", Value: chequeNumbersText },
//       { Field: "Released By", Value: paymentDetails.releasedByName || "-" },
//       { Field: "Released At", Value: toDateString(paymentDetails.releasedAt) },
//       {
//         Field: "Bank Receipt",
//         Value: receiptUrls.length ? receiptUrls.join(", ") : "-",
//       },
//       { Field: "Notes", Value: paymentDetails.paymentNotes || "-" },
//     ];

//     if (paymentDetails.selectedAccount) {
//       rows.push(
//         {
//           Field: "Account Name",
//           Value: paymentDetails.selectedAccount.accountName || "-",
//         },
//         {
//           Field: "Account Number",
//           Value: paymentDetails.selectedAccount.accountNumber || "-",
//         },
//         {
//           Field: "Bank Name",
//           Value: paymentDetails.selectedAccount.bankName || "-",
//         }
//       );
//     }

//     return rows;
//   }

//   function handleExportPDF() {
//     try {
//       const pdf = new jsPDF({
//         orientation: "landscape",
//         unit: "pt",
//         format: "a4",
//       });

//       const pageWidth = pdf.internal.pageSize.getWidth();
//       const generatedAt = new Date().toLocaleString();

//       pdf.setFontSize(18);
//       pdf.text("Budget Detail", 40, 40);

//       pdf.setFontSize(10);
//       pdf.text(`Request ID: ${activeInvoice.requestId || "-"}`, 40, 58);
//       pdf.text(`Generated: ${generatedAt}`, pageWidth - 40, 58, {
//         align: "right",
//       });

//       autoTable(pdf, {
//         startY: 82,
//         head: [["Field", "Value"]],
//         body: getSummaryExportRows().map((row) => [row.Field, row.Value]),
//         theme: "grid",
//         styles: {
//           fontSize: 9,
//           cellPadding: 5,
//           overflow: "linebreak",
//         },
//         headStyles: {
//           fillColor: [15, 23, 42],
//         },
//         columnStyles: {
//           0: {
//             cellWidth: 150,
//             fontStyle: "bold",
//           },
//           1: {
//             cellWidth: "auto",
//           },
//         },
//       });

//       autoTable(pdf, {
//         startY: (pdf as any).lastAutoTable.finalY + 24,
//         head: [
//           [
//             "#",
//             "Vendor",
//             "Service",
//             "Description",
//             "Comment",
//             "Qty",
//             "Rate",
//             "Amount",
//             "Status",
//             "Rejection Reason",
//           ],
//         ],
//         body: getLineItemExportRows().map((row) => [
//           row["#"],
//           row.Vendor,
//           row.Service,
//           row.Description,
//           row["Requester Comment"],
//           row.Qty,
//           `Rs ${formatPKR(row.Rate)}`,
//           `Rs ${formatPKR(row.Amount)}`,
//           row.Status,
//           row["Rejection Reason"],
//         ]),
//         theme: "striped",
//         styles: {
//           fontSize: 8,
//           cellPadding: 4,
//           overflow: "linebreak",
//         },
//         headStyles: {
//           fillColor: [15, 23, 42],
//         },
//         columnStyles: {
//           0: { cellWidth: 28 },
//           1: { cellWidth: 82 },
//           2: { cellWidth: 82 },
//           3: { cellWidth: 145 },
//           4: { cellWidth: 120 },
//           5: { cellWidth: 40, halign: "right" },
//           6: { cellWidth: 72, halign: "right" },
//           7: { cellWidth: 78, halign: "right" },
//           8: { cellWidth: 72 },
//           9: { cellWidth: 120 },
//         },
//       });

//       const paymentRows = getPaymentExportRows();

//       if (paymentRows.length) {
//         autoTable(pdf, {
//           startY: (pdf as any).lastAutoTable.finalY + 24,
//           head: [["Payment Field", "Value"]],
//           body: paymentRows.map((row) => [row.Field, row.Value]),
//           theme: "grid",
//           styles: {
//             fontSize: 9,
//             cellPadding: 5,
//             overflow: "linebreak",
//           },
//           headStyles: {
//             fillColor: [15, 23, 42],
//           },
//           columnStyles: {
//             0: {
//               cellWidth: 150,
//               fontStyle: "bold",
//             },
//           },
//         });
//       }

//       pdf.save(getExportFileName("pdf"));

//       toast({
//         title: "PDF exported",
//         description: "Budget detail PDF has been downloaded.",
//       });
//     } catch (error) {
//       console.error("Failed to export PDF:", error);
//       toast({
//         title: "Export failed",
//         description: "Failed to export Budget Detail PDF.",
//         variant: "destructive",
//       });
//     }
//   }

//   function handleExportExcel() {
//     try {
//       const workbook = XLSX.utils.book_new();

//       const summarySheet = XLSX.utils.json_to_sheet(getSummaryExportRows());
//       XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

//       const lineItemsSheet = XLSX.utils.json_to_sheet(getLineItemExportRows());
//       XLSX.utils.book_append_sheet(workbook, lineItemsSheet, "Line Items");

//       const paymentRows = getPaymentExportRows();

//       if (paymentRows.length) {
//         const paymentSheet = XLSX.utils.json_to_sheet(paymentRows);
//         XLSX.utils.book_append_sheet(workbook, paymentSheet, "Payment Details");
//       }

//       XLSX.writeFile(workbook, getExportFileName("xlsx"));

//       toast({
//         title: "Excel exported",
//         description: "Budget detail Excel file has been downloaded.",
//       });
//     } catch (error) {
//       console.error("Failed to export Excel:", error);
//       toast({
//         title: "Export failed",
//         description: "Failed to export Budget Detail Excel file.",
//         variant: "destructive",
//       });
//     }
//   }

//   return (
//     <>
//       <Dialog
//         open={isOpen}
//         onOpenChange={(open) => {
//           if (open) return;
//         }}
//       >
//         <DialogContent
//           onPointerDownOutside={(event) => event.preventDefault()}
//           onInteractOutside={(event) => event.preventDefault()}
//           onEscapeKeyDown={(event) => event.preventDefault()}
//           className="!left-0 !top-0 flex !h-screen !max-h-screen !w-screen !max-w-none !translate-x-0 !translate-y-0 flex-col overflow-hidden rounded-none border-0 bg-slate-50 p-0 shadow-2xl [&>button:last-child]:hidden"
//         >
//           <div className="shrink-0 border-b bg-white/95 px-6 py-5 backdrop-blur">
//             <DialogHeader>
//               <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
//                 <div>
//                   <DialogTitle className="text-2xl font-bold tracking-tight text-slate-950">
//                     Budget Detail
//                   </DialogTitle>

//                   <DialogDescription className="mt-1 text-sm text-slate-500">
//                     Request Form Details – {activeInvoice.requestId}
//                   </DialogDescription>
//                 </div>

//                 <div className="flex flex-wrap items-center gap-2">
//                   <Badge
//                     className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeColor(
//                       activeInvoice.status
//                     )}`}
//                   >
//                     {getReadableStatus(activeInvoice.status)}
//                   </Badge>

//                   {canSubmitExpense && (
//                     <Button
//                       size="sm"
//                       className="rounded-full bg-slate-950 px-4 text-white shadow-sm hover:bg-slate-800"
//                       onClick={() => onSubmitExpense?.(activeInvoice)}
//                     >
//                       <ReceiptText className="mr-1 h-4 w-4" />
//                       Submit Expense
//                     </Button>
//                   )}

//                   {canShowRequestActions && (
//                     <>
//                       <Button
//                         size="sm"
//                         className="rounded-full bg-green-600 px-4 text-white shadow-sm hover:bg-green-700"
//                         disabled={requestActionLoading}
//                         onClick={handleApproveRequest}
//                       >
//                         <Check className="mr-1 h-4 w-4" />
//                         {requestActionLoading
//                           ? "Approving..."
//                           : "Approve Request"}
//                       </Button>

//                       <Button
//                         size="sm"
//                         variant="destructive"
//                         className="rounded-full px-4 shadow-sm"
//                         disabled={requestActionLoading}
//                         onClick={() => {
//                           setRequestRejectionComment("");
//                           setRequestRejectDialogOpen(true);
//                         }}
//                       >
//                         <X className="mr-1 h-4 w-4" />
//                         Reject Request
//                       </Button>
//                     </>
//                   )}

//                   <Button
//                     type="button"
//                     size="sm"
//                     variant="outline"
//                     aria-label="Close Budget Detail"
//                     className="rounded-full px-4 shadow-sm"
//                     onClick={onClose}
//                   >
//                     <X className="mr-1 h-4 w-4" />
//                     Close
//                   </Button>
//                 </div>
//               </div>
//             </DialogHeader>
//           </div>

//           <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
//               <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//                 <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                   Total Budget
//                 </p>
//                 <p className="mt-2 text-2xl font-bold text-slate-950">
//                   Rs {formatPKR(totalBudget)}
//                 </p>
//               </div>

//               <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
//                 <p className="text-xs font-medium uppercase tracking-wide text-green-600">
//                   Approved Amount
//                 </p>
//                 <p className="mt-2 text-2xl font-bold text-green-700">
//                   Rs {formatPKR(approvedTotal)}
//                 </p>
//               </div>

//               <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
//                 <p className="text-xs font-medium uppercase tracking-wide text-red-600">
//                   Rejected Amount
//                 </p>
//                 <p className="mt-2 text-2xl font-bold text-red-700">
//                   Rs {formatPKR(rejectedTotal)}
//                 </p>
//               </div>
//             </div>

//             <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//               <div className="mb-4 flex items-center justify-between">
//                 <h3 className="text-base font-semibold text-slate-950">
//                   Request Information
//                 </h3>
//               </div>

//               <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
//                 <div className="rounded-xl bg-slate-50 p-4">
//                   <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Request ID
//                   </span>
//                   <p className="mt-1 font-semibold text-slate-950">
//                     {activeInvoice.requestId}
//                   </p>
//                 </div>

//                 <div className="rounded-xl bg-slate-50 p-4">
//                   <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Status
//                   </span>
//                   <div className="mt-2">
//                     <Badge
//                       className={`rounded-full border px-3 py-1 ${getStatusBadgeColor(
//                         activeInvoice.status
//                       )}`}
//                     >
//                       {getReadableStatus(activeInvoice.status)}
//                     </Badge>
//                   </div>
//                 </div>

//                 {invoiceType === "general" ? (
//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Title
//                     </span>
//                     <p className="mt-1 font-semibold text-slate-950">
//                       {(activeInvoice as any).title || "-"}
//                     </p>
//                   </div>
//                 ) : (
//                   <>
//                     <div className="rounded-xl bg-slate-50 p-4">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Client
//                       </span>
//                       <p className="mt-1 font-semibold text-slate-950">
//                         {activeInvoice.clientName || "-"}
//                       </p>
//                     </div>

//                     <div className="rounded-xl bg-slate-50 p-4">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Project
//                       </span>
//                       <p className="mt-1 font-semibold text-slate-950">
//                         {activeInvoice.project || "-"}
//                       </p>
//                     </div>

//                     <div className="rounded-xl bg-slate-50 p-4">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Project Code
//                       </span>
//                       <p className="mt-1 font-semibold text-slate-950">
//                         {(activeInvoice as any).projectCode || "-"}
//                       </p>
//                     </div>
//                   </>
//                 )}

//                 <div className="rounded-xl bg-slate-50 p-4 md:col-span-2">
//                   <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Subject
//                   </span>
//                   <p className="mt-1 whitespace-pre-wrap break-words font-semibold text-slate-950">
//                     {displaySubject}
//                   </p>
//                 </div>

//                 <div className="rounded-xl bg-slate-50 p-4">
//                   <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Submitted Date
//                   </span>
//                   <p className="mt-1 text-slate-800">
//                     {toDateString(activeInvoice.submittedAt)}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {((activeInvoice as any).message ||
//               (activeInvoice as any).comment) && (
//               <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//                 <h3 className="mb-3 text-base font-semibold text-slate-950">
//                   Message
//                 </h3>

//                 <div className="min-h-[100px] rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-wrap break-words">
//                   {(activeInvoice as any).message ||
//                     (activeInvoice as any).comment ||
//                     "-"}
//                 </div>
//               </div>
//             )}

//             <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
//               <div className="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
//                 <div>
//                   <h3 className="text-lg font-semibold text-slate-950">
//                     Item Approval
//                   </h3>
//                   <p className="mt-1 text-sm text-slate-500">
//                     Approve or reject individual budget items. Request-level
//                     approve/reject is also available here.
//                   </p>
//                 </div>

//                 <div className="flex flex-wrap gap-2">
//                   {canSubmitExpense && (
//                     <Button
//                       size="sm"
//                       className="rounded-full bg-slate-950 px-4 text-white hover:bg-slate-800"
//                       onClick={() => onSubmitExpense?.(activeInvoice)}
//                     >
//                       <ReceiptText className="mr-1 h-4 w-4" />
//                       Submit Expense
//                     </Button>
//                   )}
//                 </div>
//               </div>

//               <div className="overflow-x-auto">
//                 <table className="w-full min-w-[1050px] text-sm">
//                   <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
//                     <tr>
//                       <th className="px-4 py-3 text-left font-semibold">
//                         Vendor
//                       </th>
//                       <th className="px-4 py-3 text-left font-semibold">
//                         Service
//                       </th>
//                       <th className="px-4 py-3 text-left font-semibold">
//                         Description
//                       </th>
//                       <th className="px-4 py-3 text-left font-semibold min-w-[220px]">
//                         Requester Comment
//                       </th>
//                       <th className="px-4 py-3 text-right font-semibold">
//                         Qty
//                       </th>
//                       <th className="px-4 py-3 text-right font-semibold">
//                         Rate
//                       </th>
//                       <th className="px-4 py-3 text-right font-semibold">
//                         Amount
//                       </th>
//                       <th className="px-4 py-3 text-center font-semibold min-w-[180px]">
//                         Item Action
//                       </th>
//                       <th className="px-4 py-3 text-left font-semibold min-w-[240px]">
//                         Rejection Reason
//                       </th>
//                     </tr>
//                   </thead>

//                   <tbody className="divide-y divide-slate-100">
//                     {lineItems.length === 0 ? (
//                       <tr>
//                         <td
//                           colSpan={9}
//                           className="px-4 py-10 text-center text-slate-500"
//                         >
//                           No line items found.
//                         </td>
//                       </tr>
//                     ) : (
//                       lineItems.map((item, index) => {
//                         const qty = item.units ?? 0;
//                         const rate = item.unitRate ?? 0;
//                         const amount = getItemAmount(item);
//                         const status = item.status || "pending";

//                         return (
//                           <tr
//                             key={item.id || index}
//                             className="align-top transition hover:bg-slate-50/80"
//                           >
//                             <td className="px-4 py-4 font-medium text-slate-950">
//                               {item.vendor || "-"}
//                             </td>

//                             <td className="px-4 py-4 text-slate-700">
//                               {item.service || "-"}
//                             </td>

//                             <td className="px-4 py-4 whitespace-pre-wrap break-words text-slate-700">
//                               {item.description || "-"}
//                             </td>

//                             <td className="px-4 py-4 whitespace-pre-wrap break-words text-slate-700">
//                               {item.comment || "-"}
//                             </td>

//                             <td className="px-4 py-4 text-right text-slate-700">
//                               {qty}
//                             </td>

//                             <td className="px-4 py-4 text-right text-slate-700">
//                               Rs {formatPKR(rate)}
//                             </td>

//                             <td className="px-4 py-4 text-right font-semibold text-slate-950">
//                               Rs {formatPKR(amount)}
//                             </td>

//                             <td className="px-4 py-4 text-center">
//                               {isMainAdmin && status === "pending" ? (
//                                 <div className="flex flex-wrap justify-center gap-2">
//                                   <Button
//                                     size="sm"
//                                     className="rounded-full bg-green-600 px-3 text-white hover:bg-green-700"
//                                     disabled={itemActionLoading}
//                                     onClick={() =>
//                                       updateLineItemStatus(index, "approved")
//                                     }
//                                   >
//                                     <Check className="mr-1 h-4 w-4" />
//                                     Approve
//                                   </Button>

//                                   <Button
//                                     size="sm"
//                                     variant="destructive"
//                                     className="rounded-full px-3"
//                                     disabled={itemActionLoading}
//                                     onClick={() => openItemRejectDialog(index)}
//                                   >
//                                     <X className="mr-1 h-4 w-4" />
//                                     Reject
//                                   </Button>
//                                 </div>
//                               ) : (
//                                 <Badge
//                                   className={`rounded-full border px-3 py-1 ${getItemStatusBadgeColor(
//                                     status
//                                   )}`}
//                                 >
//                                   {getReadableStatus(status)}
//                                 </Badge>
//                               )}
//                             </td>

//                             <td className="px-4 py-4 whitespace-pre-wrap break-words text-sm">
//                               {item.rejectionComment ? (
//                                 <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-red-700">
//                                   {item.rejectionComment}
//                                 </div>
//                               ) : (
//                                 <span className="text-slate-400">-</span>
//                               )}
//                             </td>
//                           </tr>
//                         );
//                       })
//                     )}
//                   </tbody>
//                 </table>
//               </div>

//               <div className="grid grid-cols-1 gap-3 border-t border-slate-200 bg-slate-50 p-5 md:grid-cols-4">
//                 <div className="rounded-xl bg-white p-4 shadow-sm">
//                   <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Total Budget
//                   </span>
//                   <p className="mt-1 font-bold text-slate-950">
//                     Rs {formatPKR(totalBudget)}
//                   </p>
//                 </div>

//                 <div className="rounded-xl bg-white p-4 shadow-sm">
//                   <span className="text-xs font-medium uppercase tracking-wide text-green-600">
//                     Approved
//                   </span>
//                   <p className="mt-1 font-bold text-green-700">
//                     Rs {formatPKR(approvedTotal)}
//                   </p>
//                 </div>

//                 <div className="rounded-xl bg-white p-4 shadow-sm">
//                   <span className="text-xs font-medium uppercase tracking-wide text-red-600">
//                     Rejected
//                   </span>
//                   <p className="mt-1 font-bold text-red-700">
//                     Rs {formatPKR(rejectedTotal)}
//                   </p>
//                 </div>

//                 <div className="rounded-xl bg-white p-4 shadow-sm">
//                   <span className="text-xs font-medium uppercase tracking-wide text-amber-600">
//                     Pending
//                   </span>
//                   <p className="mt-1 font-bold text-amber-700">
//                     Rs {formatPKR(pendingTotal)}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {paymentDetails && (
//               <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//                 <h3 className="mb-4 text-lg font-semibold text-slate-950">
//                   Payment Details
//                 </h3>

//                 <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Payment Method
//                     </span>
//                     <p className="mt-1 font-medium text-slate-950">
//                       {paymentDetails.paymentMethod || "-"}
//                     </p>
//                   </div>

//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Amount Paid
//                     </span>
//                     <p className="mt-1 font-semibold text-slate-950">
//                       Rs {formatPKR(paymentDetails.amount)}
//                     </p>
//                   </div>

//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Vendor(s)
//                     </span>
//                     <p className="mt-1 text-slate-800">{vendorText}</p>
//                   </div>

//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Transaction Ref
//                     </span>
//                     <p className="mt-1 text-slate-800">
//                       {paymentDetails.transactionReference || "-"}
//                     </p>
//                   </div>

//                   {chequeNumbers.length > 0 && (
//                     <div className="rounded-xl bg-slate-50 p-4 md:col-span-2">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Cheque Number{chequeNumbers.length > 1 ? "s" : ""}
//                       </span>

//                       <div className="mt-2 flex flex-wrap gap-2">
//                         {chequeNumbers.map((chequeNumber, index) => (
//                           <span
//                             key={`${chequeNumber}-${index}`}
//                             className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
//                           >
//                             {chequeNumber}
//                           </span>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   {paymentDetails.releasedByName && (
//                     <div className="rounded-xl bg-slate-50 p-4">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Released By
//                       </span>
//                       <p className="mt-1 text-slate-800">
//                         {paymentDetails.releasedByName}
//                       </p>
//                     </div>
//                   )}

//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Released At
//                     </span>
//                     <p className="mt-1 text-slate-800">
//                       {toDateString(paymentDetails.releasedAt)}
//                     </p>
//                   </div>

//                   {paymentDetails.selectedAccount && (
//                     <div className="rounded-xl bg-slate-50 p-4">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Selected Account
//                       </span>
//                       <p className="mt-1 text-slate-800">
//                         {paymentDetails.selectedAccount.accountName || "-"}
//                         {paymentDetails.selectedAccount.accountNumber
//                           ? ` (${paymentDetails.selectedAccount.accountNumber})`
//                           : ""}
//                       </p>
//                     </div>
//                   )}

//                   {paymentDetails.paymentNotes && (
//                     <div className="rounded-xl bg-slate-50 p-4 md:col-span-2 lg:col-span-3">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Notes
//                       </span>
//                       <p className="mt-1 whitespace-pre-wrap break-words text-slate-800">
//                         {paymentDetails.paymentNotes}
//                       </p>
//                     </div>
//                   )}

//                   {receiptUrls.length > 0 && (
//                     <div className="md:col-span-2 lg:col-span-3">
//                       <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Bank Receipt{receiptUrls.length > 1 ? "s" : ""}
//                       </span>

//                       <div className="flex flex-wrap gap-2">
//                         {receiptUrls.map((url, index) => (
//                           <a
//                             key={`${url}-${index}`}
//                             href={url}
//                             target="_blank"
//                             rel="noreferrer"
//                             className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
//                           >
//                             View Receipt {receiptUrls.length > 1 ? index + 1 : ""}
//                           </a>
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>

//           <div className="shrink-0 flex flex-wrap justify-end gap-2 border-t bg-white/95 px-6 py-4 backdrop-blur">
//             <Button
//               type="button"
//               variant="outline"
//               className="rounded-full px-5"
//               onClick={handleExportPDF}
//             >
//               <FileText className="mr-2 h-4 w-4" />
//               Export PDF
//             </Button>

//             <Button
//               type="button"
//               variant="outline"
//               className="rounded-full px-5"
//               onClick={handleExportExcel}
//             >
//               <FileSpreadsheet className="mr-2 h-4 w-4" />
//               Export Excel
//             </Button>

//             <Button
//               variant="outline"
//               className="rounded-full px-5"
//               onClick={onClose}
//             >
//               Close
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>

//       <Dialog
//         open={itemRejectDialogOpen}
//         onOpenChange={(open) => {
//           setItemRejectDialogOpen(open);

//           if (!open) {
//             setPendingRejectIndex(null);
//             setItemRejectionComment("");
//           }
//         }}
//       >
//         <DialogContent className="max-w-lg rounded-2xl">
//           <DialogHeader>
//             <DialogTitle>Reject Line Item</DialogTitle>
//             <DialogDescription>
//               Please enter the reason for rejecting this item. This comment will
//               be visible to the requester.
//             </DialogDescription>
//           </DialogHeader>

//           <div className="space-y-3">
//             <Textarea
//               value={itemRejectionComment}
//               onChange={(e) => setItemRejectionComment(e.target.value)}
//               placeholder="Enter rejection reason"
//               rows={5}
//               className="rounded-xl"
//             />
//           </div>

//           <div className="mt-4 flex justify-end gap-2">
//             <Button
//               variant="outline"
//               className="rounded-full"
//               onClick={() => {
//                 setItemRejectDialogOpen(false);
//                 setPendingRejectIndex(null);
//                 setItemRejectionComment("");
//               }}
//             >
//               Cancel
//             </Button>

//             <Button
//               variant="destructive"
//               className="rounded-full"
//               disabled={!itemRejectionComment.trim() || itemActionLoading}
//               onClick={handleItemRejectConfirm}
//             >
//               {itemActionLoading ? "Rejecting..." : "Confirm Reject"}
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>

//       <Dialog
//         open={requestRejectDialogOpen}
//         onOpenChange={(open) => {
//           setRequestRejectDialogOpen(open);

//           if (!open) {
//             setRequestRejectionComment("");
//           }
//         }}
//       >
//         <DialogContent className="max-w-lg rounded-2xl">
//           <DialogHeader>
//             <DialogTitle>Reject Request</DialogTitle>
//             <DialogDescription>
//               Please enter the reason for rejecting this request. It will be
//               saved in the approval history and sent back to Operational Admin.
//             </DialogDescription>
//           </DialogHeader>

//           <div className="space-y-3">
//             <Textarea
//               value={requestRejectionComment}
//               onChange={(e) => setRequestRejectionComment(e.target.value)}
//               placeholder="Enter request rejection reason"
//               rows={5}
//               className="rounded-xl"
//             />
//           </div>

//           <div className="mt-4 flex justify-end gap-2">
//             <Button
//               variant="outline"
//               className="rounded-full"
//               onClick={() => {
//                 setRequestRejectDialogOpen(false);
//                 setRequestRejectionComment("");
//               }}
//             >
//               Cancel
//             </Button>

//             <Button
//               variant="destructive"
//               className="rounded-full"
//               disabled={!requestRejectionComment.trim() || requestActionLoading}
//               onClick={handleRejectRequest}
//             >
//               {requestActionLoading ? "Rejecting..." : "Confirm Reject"}
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// }



// import { InvoiceRequest } from "@shared/schema";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { Check, FileSpreadsheet, FileText, ReceiptText, X } from "lucide-react";
// import { doc, updateDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { useAuth } from "@/contexts/AuthContext";
// import { useToast } from "@/hooks/use-toast";
// import { useState, useEffect } from "react";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
// import * as XLSX from "xlsx";

// function toDateString(timestamp: any): string {
//   if (!timestamp) return "N/A";

//   if (timestamp.toDate && typeof timestamp.toDate === "function") {
//     return timestamp.toDate().toLocaleString();
//   }

//   if (timestamp instanceof Date) {
//     return timestamp.toLocaleString();
//   }

//   try {
//     return new Date(timestamp).toLocaleString();
//   } catch {
//     return "N/A";
//   }
// }

// function formatPKR(value: number | string | undefined) {
//   if (value === null || value === undefined) return "0.00";

//   const num =
//     typeof value === "number"
//       ? value
//       : parseFloat(String(value).replace(/,/g, "")) || 0;

//   return num.toLocaleString("en-PK", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });
// }

// function getItemAmount(item: any) {
//   const qty = Number(item?.units ?? 0);
//   const rate = Number(item?.unitRate ?? 0);
//   const tax = Number(item?.tax ?? 0);
//   const total = Number(item?.total ?? qty * rate + tax);

//   return Number.isFinite(total) ? total : 0;
// }

// function getReadableStatus(status?: string) {
//   if (!status) return "Pending";

//   return status
//     .replace(/_/g, " ")
//     .replace(/\b\w/g, (char) => char.toUpperCase());
// }

// function getChequeNumbers(paymentDetails: any): string[] {
//   const chequeNumbersFromArray = Array.isArray(paymentDetails?.chequeNumbers)
//     ? paymentDetails.chequeNumbers
//     : [];

//   const oldSingleChequeNumber = paymentDetails?.chequeNumber
//     ? [paymentDetails.chequeNumber]
//     : [];

//   return Array.from(
//     new Set(
//       [...chequeNumbersFromArray, ...oldSingleChequeNumber]
//         .map((num) => String(num || "").trim())
//         .filter(Boolean)
//     )
//   );
// }

// type ReceiptFileItem = {
//   url: string;
//   name: string;
// };

// function getFileNameFromUrl(url: string, fallback = "Receipt File") {
//   try {
//     const cleanUrl = String(url || "").split("?")[0];

//     // Firebase Storage URLs usually contain "/o/<encoded-file-path>".
//     const firebaseStorageMatch = cleanUrl.match(/\/o\/([^/]+)$/);
//     const rawPath = firebaseStorageMatch?.[1] || cleanUrl.split("/").pop() || "";

//     const decodedPath = decodeURIComponent(rawPath);
//     const fileName = decodedPath.split("/").pop();

//     return fileName || fallback;
//   } catch {
//     return fallback;
//   }
// }

// function getReceiptFiles(paymentDetails: any): ReceiptFileItem[] {
//   const files: ReceiptFileItem[] = [];

//   const pushFile = (value: any, fallbackName?: string) => {
//     if (!value) return;

//     if (typeof value === "string") {
//       const url = value.trim();
//       if (!url) return;

//       files.push({
//         url,
//         name: fallbackName || getFileNameFromUrl(url, `Receipt ${files.length + 1}`),
//       });

//       return;
//     }

//     if (typeof value === "object") {
//       const url = String(
//         value.url ||
//           value.downloadURL ||
//           value.downloadUrl ||
//           value.fileUrl ||
//           value.fileURL ||
//           value.receiptUrl ||
//           value.bankReceiptUrl ||
//           ""
//       ).trim();

//       if (!url) return;

//       files.push({
//         url,
//         name:
//           value.name ||
//           value.fileName ||
//           value.filename ||
//           value.originalName ||
//           fallbackName ||
//           getFileNameFromUrl(url, `Receipt ${files.length + 1}`),
//       });
//     }
//   };

//   [
//     paymentDetails?.bankReceiptUrls,
//     paymentDetails?.receiptUrls,
//     paymentDetails?.receipts,
//     paymentDetails?.receiptFiles,
//     paymentDetails?.uploadedFiles,
//     paymentDetails?.files,
//   ].forEach((collection) => {
//     if (Array.isArray(collection)) {
//       collection.forEach((file, index) => {
//         pushFile(file, `Receipt ${index + 1}`);
//       });
//     }
//   });

//   pushFile(paymentDetails?.bankReceiptUrl, "Receipt 1");
//   pushFile(paymentDetails?.receiptUrl, "Receipt 1");

//   const uniqueFiles = new Map<string, ReceiptFileItem>();

//   files.forEach((file, index) => {
//     if (!file.url || uniqueFiles.has(file.url)) return;

//     uniqueFiles.set(file.url, {
//       url: file.url,
//       name: file.name || `Receipt ${index + 1}`,
//     });
//   });

//   return Array.from(uniqueFiles.values());
// }

// interface BudgetDetailsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   invoice: InvoiceRequest | null;
//   onSubmitExpense?: (request: InvoiceRequest) => void;
// }

// export default function BudgetDetailsModal({
//   isOpen,
//   onClose,
//   invoice,
//   onSubmitExpense,
// }: BudgetDetailsModalProps) {
//   const { userProfile } = useAuth();
//   const { toast } = useToast();

//   const isMainAdmin = userProfile?.role === "main_admin";

//   const [liveInvoice, setLiveInvoice] = useState<InvoiceRequest | null>(invoice);
//   const [lineItems, setLineItems] = useState<any[]>(invoice?.lineItems || []);

//   const [itemRejectDialogOpen, setItemRejectDialogOpen] = useState(false);
//   const [pendingRejectIndex, setPendingRejectIndex] = useState<number | null>(
//     null
//   );
//   const [itemRejectionComment, setItemRejectionComment] = useState("");
//   const [itemActionLoading, setItemActionLoading] = useState(false);

//   const [requestRejectDialogOpen, setRequestRejectDialogOpen] = useState(false);
//   const [requestRejectionComment, setRequestRejectionComment] = useState("");
//   const [requestActionLoading, setRequestActionLoading] = useState(false);

//   useEffect(() => {
//     setLiveInvoice(invoice);
//     setLineItems(invoice?.lineItems || []);
//   }, [invoice]);

//   useEffect(() => {
//     if (!invoice?.id || !isOpen) return;

//     const ref = doc(
//       db,
//       "Panels",
//       "IEDGE-SYSTEM",
//       "invoiceRequests",
//       invoice.id
//     );

//     const unsub = onSnapshot(ref, (snap) => {
//       if (snap.exists()) {
//         const freshInvoice = {
//           id: snap.id,
//           ...snap.data(),
//         } as InvoiceRequest;

//         setLiveInvoice(freshInvoice);
//         setLineItems(freshInvoice.lineItems || []);
//       }
//     });

//     return () => unsub();
//   }, [invoice?.id, isOpen]);

//   if (!liveInvoice) return null;

//   const activeInvoice = liveInvoice;

//   const invoiceType =
//     (activeInvoice as any).invoiceType ||
//     (activeInvoice.clientName ? "project" : "general");

//   function getStatusBadgeColor(status: string): string {
//     switch (status) {
//       case "approved":
//       case "payment_released":
//         return "border-green-200 bg-green-50 text-green-700";
//       case "rejected":
//         return "border-red-200 bg-red-50 text-red-700";
//       case "pending_operational_admin":
//       case "pending_main_admin":
//       case "pending_finance":
//         return "border-amber-200 bg-amber-50 text-amber-700";
//       default:
//         return "border-blue-200 bg-blue-50 text-blue-700";
//     }
//   }

//   function getItemStatusBadgeColor(status: string): string {
//     switch (status) {
//       case "approved":
//         return "border-green-200 bg-green-50 text-green-700";
//       case "rejected":
//         return "border-red-200 bg-red-50 text-red-700";
//       default:
//         return "border-amber-200 bg-amber-50 text-amber-700";
//     }
//   }

//   function canApproveRequest(request: InvoiceRequest): boolean {
//     if (!userProfile) return false;

//     switch (userProfile.role) {
//       case "operational_admin":
//         return request.status === "pending_operational_admin";
//       case "main_admin":
//         return request.status === "pending_main_admin";
//       case "finance":
//       case "financial_admin":
//         return request.status === "pending_finance";
//       default:
//         return false;
//     }
//   }

//   async function handleApproveRequest() {
//     if (!activeInvoice?.id || !userProfile) return;

//     try {
//       setRequestActionLoading(true);

//       let newStatus = activeInvoice.status;
//       let currentApprover = "";

//       switch (userProfile.role) {
//         case "operational_admin":
//           if (activeInvoice.status === "pending_operational_admin") {
//             newStatus = "pending_main_admin" as any;
//           }
//           break;

//         case "main_admin":
//           if (activeInvoice.status === "pending_main_admin") {
//             newStatus = "pending_finance" as any;
//           }
//           break;

//         case "finance":
//         case "financial_admin":
//           if (activeInvoice.status === "pending_finance") {
//             newStatus = "approved" as any;
//           }
//           break;
//       }

//       if (newStatus === activeInvoice.status) {
//         toast({
//           title: "Action not available",
//           description: "This request is not pending your approval step.",
//           variant: "destructive",
//         });
//         return;
//       }

//       await updateDoc(
//         doc(db, "Panels", "IEDGE-SYSTEM", "invoiceRequests", activeInvoice.id),
//         {
//           status: newStatus,
//           currentApprover,
//           approvalHistory: [
//             ...((activeInvoice as any).approvalHistory || []),
//             {
//               approver: userProfile.displayName,
//               action: "approved",
//               timestamp: new Date(),
//               notes: "",
//             },
//           ],
//           updatedAt: serverTimestamp(),
//         }
//       );

//       setLiveInvoice({ ...activeInvoice, status: newStatus } as InvoiceRequest);

//       toast({
//         title: "Request approved",
//         description: "The request status has been updated successfully.",
//       });
//     } catch (error: any) {
//       console.error("Failed to approve request:", error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to approve request",
//         variant: "destructive",
//       });
//     } finally {
//       setRequestActionLoading(false);
//     }
//   }

//   async function handleRejectRequest() {
//     if (!activeInvoice?.id || !userProfile) return;

//     const reason = requestRejectionComment.trim();

//     if (!reason) {
//       toast({
//         title: "Rejection comment required",
//         description: "Please enter the reason for rejecting this request.",
//         variant: "destructive",
//       });
//       return;
//     }

//     try {
//       setRequestActionLoading(true);

//       await updateDoc(
//         doc(db, "Panels", "IEDGE-SYSTEM", "invoiceRequests", activeInvoice.id),
//         {
//           status: "pending_operational_admin",
//           approvalHistory: [
//             ...((activeInvoice as any).approvalHistory || []),
//             {
//               approver: userProfile.displayName,
//               action: "rejected",
//               timestamp: new Date(),
//               notes: reason,
//             },
//           ],
//           updatedAt: serverTimestamp(),
//         }
//       );

//       setLiveInvoice({
//         ...activeInvoice,
//         status: "pending_operational_admin" as any,
//       } as InvoiceRequest);

//       toast({
//         title: "Request rejected",
//         description: "The request has been sent back with your comment.",
//       });

//       setRequestRejectDialogOpen(false);
//       setRequestRejectionComment("");
//     } catch (error: any) {
//       console.error("Failed to reject request:", error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to reject request",
//         variant: "destructive",
//       });
//     } finally {
//       setRequestActionLoading(false);
//     }
//   }

//   async function updateLineItemStatus(
//     index: number,
//     status: "approved" | "rejected",
//     rejectReason = ""
//   ) {
//     if (!activeInvoice?.id || !userProfile) return;

//     try {
//       setItemActionLoading(true);

//       const updatedItems = lineItems.map((item: any) => ({ ...item }));
//       const now = new Date();
//       const actorName = userProfile.displayName || "Main Admin";
//       const currentItem = updatedItems[index] || {};

//       updatedItems[index] = {
//         ...currentItem,
//         status,
//         reviewedBy: actorName,
//         reviewedAt: now,
//         ...(status === "approved"
//           ? {
//               approvedBy: actorName,
//               approvedAt: now,
//               rejectionComment: "",
//             }
//           : {
//               rejectedBy: actorName,
//               rejectedAt: now,
//               rejectionComment: rejectReason.trim(),
//             }),
//       };

//       await updateDoc(
//         doc(db, "Panels", "IEDGE-SYSTEM", "invoiceRequests", activeInvoice.id),
//         {
//           lineItems: updatedItems,
//           updatedAt: serverTimestamp(),
//         }
//       );

//       setLineItems(updatedItems);

//       toast({
//         title: status === "approved" ? "Item approved" : "Item rejected",
//       });
//     } catch (error) {
//       console.error("Failed to update line item status:", error);
//       toast({
//         title: "Error",
//         description: "Failed to update item status",
//         variant: "destructive",
//       });
//     } finally {
//       setItemActionLoading(false);
//     }
//   }

//   function openItemRejectDialog(index: number) {
//     setPendingRejectIndex(index);
//     setItemRejectionComment("");
//     setItemRejectDialogOpen(true);
//   }

//   async function handleItemRejectConfirm() {
//     if (pendingRejectIndex === null) return;

//     const reason = itemRejectionComment.trim();

//     if (!reason) {
//       toast({
//         title: "Rejection comment required",
//         description: "Please enter the reason for rejecting this item.",
//         variant: "destructive",
//       });
//       return;
//     }

//     await updateLineItemStatus(pendingRejectIndex, "rejected", reason);
//     setItemRejectDialogOpen(false);
//     setPendingRejectIndex(null);
//     setItemRejectionComment("");
//   }

//   const approvedTotal = lineItems
//     .filter((item: any) => item.status === "approved")
//     .reduce((sum: number, item: any) => sum + getItemAmount(item), 0);

//   const rejectedTotal = lineItems
//     .filter((item: any) => item.status === "rejected")
//     .reduce((sum: number, item: any) => sum + getItemAmount(item), 0);

//   const pendingTotal = lineItems
//     .filter((item: any) => !item.status || item.status === "pending")
//     .reduce((sum: number, item: any) => sum + getItemAmount(item), 0);

//   const totalBudget = activeInvoice.totalAmount || 0;
//   const canShowRequestActions = canApproveRequest(activeInvoice);

//   const paymentDetails = activeInvoice.paymentDetails as
//     | {
//         paymentMethod?: string;
//         amount?: number;
//         vendor?: string;
//         vendors?: string[];
//         transactionReference?: string;

//         chequeNumber?: string;
//         chequeNumbers?: string[];

//         bankReceiptUrl?: string;
//         bankReceiptUrls?: string[];
//         receiptUrl?: string;
//         receiptUrls?: string[];
//         receipts?: any[];
//         receiptFiles?: any[];
//         uploadedFiles?: any[];
//         files?: any[];

//         paymentNotes?: string;
//         releasedAt?: any;
//         releasedByName?: string;

//         selectedAccount?: {
//           accountName?: string;
//           accountNumber?: string;
//           bankName?: string;
//         };
//       }
//     | undefined;

//   const vendorText = Array.isArray(paymentDetails?.vendors)
//     ? paymentDetails?.vendors.join(", ")
//     : paymentDetails?.vendor || "-";

//   const chequeNumbers = getChequeNumbers(paymentDetails);
//   const chequeNumbersText = chequeNumbers.length ? chequeNumbers.join(", ") : "-";

//   const receiptFiles = getReceiptFiles(paymentDetails);
//   const receiptUrls = receiptFiles.map((file) => file.url);

//   const displaySubject =
//     (activeInvoice as any).subject ||
//     (invoiceType === "project" ? (activeInvoice as any).title || "-" : "-");

//   const canSubmitExpense =
//     invoiceType === "project" &&
//     !!onSubmitExpense &&
//     ["approved", "payment_released"].includes(String(activeInvoice.status || ""));

//   function getExportFileName(extension: "pdf" | "xlsx") {
//     const requestId = String(activeInvoice.requestId || "budget-detail")
//       .trim()
//       .replace(/[^a-zA-Z0-9-_]+/g, "-")
//       .replace(/-+/g, "-");

//     return `Budget-Detail-${requestId || "request"}.${extension}`;
//   }

//   function getLineItemExportRows() {
//     return lineItems.map((item: any, index: number) => {
//       const status = item.status || "pending";

//       return {
//         "#": index + 1,
//         Vendor: item.vendor || "-",
//         Service: item.service || "-",
//         Description: item.description || "-",
//         "Requester Comment": item.comment || "-",
//         Qty: item.units ?? 0,
//         Rate: Number(item.unitRate ?? 0),
//         Amount: getItemAmount(item),
//         Status: getReadableStatus(status),
//         "Reviewed By":
//           item.reviewedBy || item.approvedBy || item.rejectedBy || "-",
//         "Reviewed At": toDateString(
//           item.reviewedAt || item.approvedAt || item.rejectedAt
//         ),
//         "Rejection Reason": item.rejectionComment || "-",
//       };
//     });
//   }

//   function getSummaryExportRows() {
//     const rows = [
//       { Field: "Request ID", Value: activeInvoice.requestId || "-" },
//       { Field: "Request Type", Value: getReadableStatus(invoiceType) },
//       { Field: "Status", Value: getReadableStatus(activeInvoice.status) },
//       { Field: "Subject", Value: displaySubject || "-" },
//       { Field: "Submitted Date", Value: toDateString(activeInvoice.submittedAt) },
//       { Field: "Total Budget", Value: `Rs ${formatPKR(totalBudget)}` },
//       { Field: "Approved Amount", Value: `Rs ${formatPKR(approvedTotal)}` },
//       { Field: "Rejected Amount", Value: `Rs ${formatPKR(rejectedTotal)}` },
//       { Field: "Pending Amount", Value: `Rs ${formatPKR(pendingTotal)}` },
//     ];

//     if (invoiceType === "general") {
//       rows.splice(3, 0, {
//         Field: "Title",
//         Value: (activeInvoice as any).title || "-",
//       });
//     } else {
//       rows.splice(
//         3,
//         0,
//         { Field: "Client", Value: activeInvoice.clientName || "-" },
//         { Field: "Project", Value: activeInvoice.project || "-" },
//         {
//           Field: "Project Code",
//           Value: (activeInvoice as any).projectCode || "-",
//         }
//       );
//     }

//     const message =
//       (activeInvoice as any).message || (activeInvoice as any).comment;

//     if (message) {
//       rows.push({ Field: "Message", Value: message });
//     }

//     return rows;
//   }

//   function getPaymentExportRows() {
//     if (!paymentDetails) return [];

//     const rows = [
//       { Field: "Payment Method", Value: paymentDetails.paymentMethod || "-" },
//       { Field: "Amount Paid", Value: `Rs ${formatPKR(paymentDetails.amount)}` },
//       { Field: "Vendor(s)", Value: vendorText },
//       {
//         Field: "Transaction Ref",
//         Value: paymentDetails.transactionReference || "-",
//       },
//       { Field: "Cheque Numbers", Value: chequeNumbersText },
//       { Field: "Released By", Value: paymentDetails.releasedByName || "-" },
//       { Field: "Released At", Value: toDateString(paymentDetails.releasedAt) },
//       {
//         Field: "Bank Receipt",
//         Value: receiptUrls.length ? receiptUrls.join(", ") : "-",
//       },
//       { Field: "Notes", Value: paymentDetails.paymentNotes || "-" },
//     ];

//     if (paymentDetails.selectedAccount) {
//       rows.push(
//         {
//           Field: "Account Name",
//           Value: paymentDetails.selectedAccount.accountName || "-",
//         },
//         {
//           Field: "Account Number",
//           Value: paymentDetails.selectedAccount.accountNumber || "-",
//         },
//         {
//           Field: "Bank Name",
//           Value: paymentDetails.selectedAccount.bankName || "-",
//         }
//       );
//     }

//     return rows;
//   }

//   function handleExportPDF() {
//     try {
//       const pdf = new jsPDF({
//         orientation: "landscape",
//         unit: "pt",
//         format: "a4",
//       });

//       const pageWidth = pdf.internal.pageSize.getWidth();
//       const generatedAt = new Date().toLocaleString();

//       pdf.setFontSize(18);
//       pdf.text("Budget Detail", 40, 40);

//       pdf.setFontSize(10);
//       pdf.text(`Request ID: ${activeInvoice.requestId || "-"}`, 40, 58);
//       pdf.text(`Generated: ${generatedAt}`, pageWidth - 40, 58, {
//         align: "right",
//       });

//       autoTable(pdf, {
//         startY: 82,
//         head: [["Field", "Value"]],
//         body: getSummaryExportRows().map((row) => [row.Field, row.Value]),
//         theme: "grid",
//         styles: {
//           fontSize: 9,
//           cellPadding: 5,
//           overflow: "linebreak",
//         },
//         headStyles: {
//           fillColor: [15, 23, 42],
//         },
//         columnStyles: {
//           0: {
//             cellWidth: 150,
//             fontStyle: "bold",
//           },
//           1: {
//             cellWidth: "auto",
//           },
//         },
//       });

//       autoTable(pdf, {
//         startY: (pdf as any).lastAutoTable.finalY + 24,
//         head: [
//           [
//             "#",
//             "Vendor",
//             "Service",
//             "Description",
//             "Comment",
//             "Qty",
//             "Rate",
//             "Amount",
//             "Status",
//             "Rejection Reason",
//           ],
//         ],
//         body: getLineItemExportRows().map((row) => [
//           row["#"],
//           row.Vendor,
//           row.Service,
//           row.Description,
//           row["Requester Comment"],
//           row.Qty,
//           `Rs ${formatPKR(row.Rate)}`,
//           `Rs ${formatPKR(row.Amount)}`,
//           row.Status,
//           row["Rejection Reason"],
//         ]),
//         theme: "striped",
//         styles: {
//           fontSize: 8,
//           cellPadding: 4,
//           overflow: "linebreak",
//         },
//         headStyles: {
//           fillColor: [15, 23, 42],
//         },
//         columnStyles: {
//           0: { cellWidth: 28 },
//           1: { cellWidth: 82 },
//           2: { cellWidth: 82 },
//           3: { cellWidth: 145 },
//           4: { cellWidth: 120 },
//           5: { cellWidth: 40, halign: "right" },
//           6: { cellWidth: 72, halign: "right" },
//           7: { cellWidth: 78, halign: "right" },
//           8: { cellWidth: 72 },
//           9: { cellWidth: 120 },
//         },
//       });

//       const paymentRows = getPaymentExportRows();

//       if (paymentRows.length) {
//         autoTable(pdf, {
//           startY: (pdf as any).lastAutoTable.finalY + 24,
//           head: [["Payment Field", "Value"]],
//           body: paymentRows.map((row) => [row.Field, row.Value]),
//           theme: "grid",
//           styles: {
//             fontSize: 9,
//             cellPadding: 5,
//             overflow: "linebreak",
//           },
//           headStyles: {
//             fillColor: [15, 23, 42],
//           },
//           columnStyles: {
//             0: {
//               cellWidth: 150,
//               fontStyle: "bold",
//             },
//           },
//         });
//       }

//       pdf.save(getExportFileName("pdf"));

//       toast({
//         title: "PDF exported",
//         description: "Budget detail PDF has been downloaded.",
//       });
//     } catch (error) {
//       console.error("Failed to export PDF:", error);
//       toast({
//         title: "Export failed",
//         description: "Failed to export Budget Detail PDF.",
//         variant: "destructive",
//       });
//     }
//   }

//   function handleExportExcel() {
//     try {
//       const workbook = XLSX.utils.book_new();

//       const summarySheet = XLSX.utils.json_to_sheet(getSummaryExportRows());
//       XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

//       const lineItemsSheet = XLSX.utils.json_to_sheet(getLineItemExportRows());
//       XLSX.utils.book_append_sheet(workbook, lineItemsSheet, "Line Items");

//       const paymentRows = getPaymentExportRows();

//       if (paymentRows.length) {
//         const paymentSheet = XLSX.utils.json_to_sheet(paymentRows);
//         XLSX.utils.book_append_sheet(workbook, paymentSheet, "Payment Details");
//       }

//       XLSX.writeFile(workbook, getExportFileName("xlsx"));

//       toast({
//         title: "Excel exported",
//         description: "Budget detail Excel file has been downloaded.",
//       });
//     } catch (error) {
//       console.error("Failed to export Excel:", error);
//       toast({
//         title: "Export failed",
//         description: "Failed to export Budget Detail Excel file.",
//         variant: "destructive",
//       });
//     }
//   }

//   return (
//     <>
//       <Dialog
//         open={isOpen}
//         onOpenChange={(open) => {
//           if (open) return;
//         }}
//       >
//         <DialogContent
//           onPointerDownOutside={(event) => event.preventDefault()}
//           onInteractOutside={(event) => event.preventDefault()}
//           onEscapeKeyDown={(event) => event.preventDefault()}
//           className="!left-0 !top-0 flex !h-screen !max-h-screen !w-screen !max-w-none !translate-x-0 !translate-y-0 flex-col overflow-hidden rounded-none border-0 bg-slate-50 p-0 shadow-2xl [&>button:last-child]:hidden"
//         >
//           <div className="shrink-0 border-b bg-white/95 px-6 py-5 backdrop-blur">
//             <DialogHeader>
//               <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
//                 <div>
//                   <DialogTitle className="text-2xl font-bold tracking-tight text-slate-950">
//                     Budget Detail
//                   </DialogTitle>

//                   <DialogDescription className="mt-1 text-sm text-slate-500">
//                     Request Form Details – {activeInvoice.requestId}
//                   </DialogDescription>
//                 </div>

//                 <div className="flex flex-wrap items-center gap-2">
//                   <Badge
//                     className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeColor(
//                       activeInvoice.status
//                     )}`}
//                   >
//                     {getReadableStatus(activeInvoice.status)}
//                   </Badge>

//                   {canSubmitExpense && (
//                     <Button
//                       size="sm"
//                       className="rounded-full bg-slate-950 px-4 text-white shadow-sm hover:bg-slate-800"
//                       onClick={() => onSubmitExpense?.(activeInvoice)}
//                     >
//                       <ReceiptText className="mr-1 h-4 w-4" />
//                       Submit Expense
//                     </Button>
//                   )}

//                   {canShowRequestActions && (
//                     <>
//                       <Button
//                         size="sm"
//                         className="rounded-full bg-green-600 px-4 text-white shadow-sm hover:bg-green-700"
//                         disabled={requestActionLoading}
//                         onClick={handleApproveRequest}
//                       >
//                         <Check className="mr-1 h-4 w-4" />
//                         {requestActionLoading
//                           ? "Approving..."
//                           : "Approve Request"}
//                       </Button>

//                       <Button
//                         size="sm"
//                         variant="destructive"
//                         className="rounded-full px-4 shadow-sm"
//                         disabled={requestActionLoading}
//                         onClick={() => {
//                           setRequestRejectionComment("");
//                           setRequestRejectDialogOpen(true);
//                         }}
//                       >
//                         <X className="mr-1 h-4 w-4" />
//                         Reject Request
//                       </Button>
//                     </>
//                   )}

//                   <Button
//                     type="button"
//                     size="sm"
//                     variant="outline"
//                     aria-label="Close Budget Detail"
//                     className="rounded-full px-4 shadow-sm"
//                     onClick={onClose}
//                   >
//                     <X className="mr-1 h-4 w-4" />
//                     Close
//                   </Button>
//                 </div>
//               </div>
//             </DialogHeader>
//           </div>

//           <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
//               <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//                 <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                   Total Budget
//                 </p>
//                 <p className="mt-2 text-2xl font-bold text-slate-950">
//                   Rs {formatPKR(totalBudget)}
//                 </p>
//               </div>

//               <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
//                 <p className="text-xs font-medium uppercase tracking-wide text-green-600">
//                   Approved Amount
//                 </p>
//                 <p className="mt-2 text-2xl font-bold text-green-700">
//                   Rs {formatPKR(approvedTotal)}
//                 </p>
//               </div>

//               <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
//                 <p className="text-xs font-medium uppercase tracking-wide text-red-600">
//                   Rejected Amount
//                 </p>
//                 <p className="mt-2 text-2xl font-bold text-red-700">
//                   Rs {formatPKR(rejectedTotal)}
//                 </p>
//               </div>
//             </div>

//             <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//               <div className="mb-4 flex items-center justify-between">
//                 <h3 className="text-base font-semibold text-slate-950">
//                   Request Information
//                 </h3>
//               </div>

//               <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
//                 <div className="rounded-xl bg-slate-50 p-4">
//                   <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Request ID
//                   </span>
//                   <p className="mt-1 font-semibold text-slate-950">
//                     {activeInvoice.requestId}
//                   </p>
//                 </div>

//                 <div className="rounded-xl bg-slate-50 p-4">
//                   <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Status
//                   </span>
//                   <div className="mt-2">
//                     <Badge
//                       className={`rounded-full border px-3 py-1 ${getStatusBadgeColor(
//                         activeInvoice.status
//                       )}`}
//                     >
//                       {getReadableStatus(activeInvoice.status)}
//                     </Badge>
//                   </div>
//                 </div>

//                 {invoiceType === "general" ? (
//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Title
//                     </span>
//                     <p className="mt-1 font-semibold text-slate-950">
//                       {(activeInvoice as any).title || "-"}
//                     </p>
//                   </div>
//                 ) : (
//                   <>
//                     <div className="rounded-xl bg-slate-50 p-4">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Client
//                       </span>
//                       <p className="mt-1 font-semibold text-slate-950">
//                         {activeInvoice.clientName || "-"}
//                       </p>
//                     </div>

//                     <div className="rounded-xl bg-slate-50 p-4">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Project
//                       </span>
//                       <p className="mt-1 font-semibold text-slate-950">
//                         {activeInvoice.project || "-"}
//                       </p>
//                     </div>

//                     <div className="rounded-xl bg-slate-50 p-4">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Project Code
//                       </span>
//                       <p className="mt-1 font-semibold text-slate-950">
//                         {(activeInvoice as any).projectCode || "-"}
//                       </p>
//                     </div>
//                   </>
//                 )}

//                 <div className="rounded-xl bg-slate-50 p-4 md:col-span-2">
//                   <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Subject
//                   </span>
//                   <p className="mt-1 whitespace-pre-wrap break-words font-semibold text-slate-950">
//                     {displaySubject}
//                   </p>
//                 </div>

//                 <div className="rounded-xl bg-slate-50 p-4">
//                   <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Submitted Date
//                   </span>
//                   <p className="mt-1 text-slate-800">
//                     {toDateString(activeInvoice.submittedAt)}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {((activeInvoice as any).message ||
//               (activeInvoice as any).comment) && (
//               <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//                 <h3 className="mb-3 text-base font-semibold text-slate-950">
//                   Message
//                 </h3>

//                 <div className="min-h-[100px] rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-wrap break-words">
//                   {(activeInvoice as any).message ||
//                     (activeInvoice as any).comment ||
//                     "-"}
//                 </div>
//               </div>
//             )}

//             <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
//               <div className="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
//                 <div>
//                   <h3 className="text-lg font-semibold text-slate-950">
//                     Item Approval
//                   </h3>
//                   <p className="mt-1 text-sm text-slate-500">
//                     Approve or reject individual budget items. Request-level
//                     approve/reject is also available here.
//                   </p>
//                 </div>

//                 <div className="flex flex-wrap gap-2">
//                   {canSubmitExpense && (
//                     <Button
//                       size="sm"
//                       className="rounded-full bg-slate-950 px-4 text-white hover:bg-slate-800"
//                       onClick={() => onSubmitExpense?.(activeInvoice)}
//                     >
//                       <ReceiptText className="mr-1 h-4 w-4" />
//                       Submit Expense
//                     </Button>
//                   )}
//                 </div>
//               </div>

//               <div className="overflow-x-auto">
//                 <table className="w-full min-w-[1050px] text-sm">
//                   <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
//                     <tr>
//                       <th className="px-4 py-3 text-left font-semibold">
//                         Vendor
//                       </th>
//                       <th className="px-4 py-3 text-left font-semibold">
//                         Service
//                       </th>
//                       <th className="px-4 py-3 text-left font-semibold">
//                         Description
//                       </th>
//                       <th className="px-4 py-3 text-left font-semibold min-w-[220px]">
//                         Requester Comment
//                       </th>
//                       <th className="px-4 py-3 text-right font-semibold">
//                         Qty
//                       </th>
//                       <th className="px-4 py-3 text-right font-semibold">
//                         Rate
//                       </th>
//                       <th className="px-4 py-3 text-right font-semibold">
//                         Amount
//                       </th>
//                       <th className="px-4 py-3 text-center font-semibold min-w-[180px]">
//                         Item Action
//                       </th>
//                       <th className="px-4 py-3 text-left font-semibold min-w-[240px]">
//                         Rejection Reason
//                       </th>
//                     </tr>
//                   </thead>

//                   <tbody className="divide-y divide-slate-100">
//                     {lineItems.length === 0 ? (
//                       <tr>
//                         <td
//                           colSpan={9}
//                           className="px-4 py-10 text-center text-slate-500"
//                         >
//                           No line items found.
//                         </td>
//                       </tr>
//                     ) : (
//                       lineItems.map((item, index) => {
//                         const qty = item.units ?? 0;
//                         const rate = item.unitRate ?? 0;
//                         const amount = getItemAmount(item);
//                         const status = item.status || "pending";

//                         return (
//                           <tr
//                             key={item.id || index}
//                             className="align-top transition hover:bg-slate-50/80"
//                           >
//                             <td className="px-4 py-4 font-medium text-slate-950">
//                               {item.vendor || "-"}
//                             </td>

//                             <td className="px-4 py-4 text-slate-700">
//                               {item.service || "-"}
//                             </td>

//                             <td className="px-4 py-4 whitespace-pre-wrap break-words text-slate-700">
//                               {item.description || "-"}
//                             </td>

//                             <td className="px-4 py-4 whitespace-pre-wrap break-words text-slate-700">
//                               {item.comment || "-"}
//                             </td>

//                             <td className="px-4 py-4 text-right text-slate-700">
//                               {qty}
//                             </td>

//                             <td className="px-4 py-4 text-right text-slate-700">
//                               Rs {formatPKR(rate)}
//                             </td>

//                             <td className="px-4 py-4 text-right font-semibold text-slate-950">
//                               Rs {formatPKR(amount)}
//                             </td>

//                             <td className="px-4 py-4 text-center">
//                               {isMainAdmin && status === "pending" ? (
//                                 <div className="flex flex-wrap justify-center gap-2">
//                                   <Button
//                                     size="sm"
//                                     className="rounded-full bg-green-600 px-3 text-white hover:bg-green-700"
//                                     disabled={itemActionLoading}
//                                     onClick={() =>
//                                       updateLineItemStatus(index, "approved")
//                                     }
//                                   >
//                                     <Check className="mr-1 h-4 w-4" />
//                                     Approve
//                                   </Button>

//                                   <Button
//                                     size="sm"
//                                     variant="destructive"
//                                     className="rounded-full px-3"
//                                     disabled={itemActionLoading}
//                                     onClick={() => openItemRejectDialog(index)}
//                                   >
//                                     <X className="mr-1 h-4 w-4" />
//                                     Reject
//                                   </Button>
//                                 </div>
//                               ) : (
//                                 <Badge
//                                   className={`rounded-full border px-3 py-1 ${getItemStatusBadgeColor(
//                                     status
//                                   )}`}
//                                 >
//                                   {getReadableStatus(status)}
//                                 </Badge>
//                               )}
//                             </td>

//                             <td className="px-4 py-4 whitespace-pre-wrap break-words text-sm">
//                               {item.rejectionComment ? (
//                                 <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-red-700">
//                                   {item.rejectionComment}
//                                 </div>
//                               ) : (
//                                 <span className="text-slate-400">-</span>
//                               )}
//                             </td>
//                           </tr>
//                         );
//                       })
//                     )}
//                   </tbody>
//                 </table>
//               </div>

//               <div className="grid grid-cols-1 gap-3 border-t border-slate-200 bg-slate-50 p-5 md:grid-cols-4">
//                 <div className="rounded-xl bg-white p-4 shadow-sm">
//                   <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Total Budget
//                   </span>
//                   <p className="mt-1 font-bold text-slate-950">
//                     Rs {formatPKR(totalBudget)}
//                   </p>
//                 </div>

//                 <div className="rounded-xl bg-white p-4 shadow-sm">
//                   <span className="text-xs font-medium uppercase tracking-wide text-green-600">
//                     Approved
//                   </span>
//                   <p className="mt-1 font-bold text-green-700">
//                     Rs {formatPKR(approvedTotal)}
//                   </p>
//                 </div>

//                 <div className="rounded-xl bg-white p-4 shadow-sm">
//                   <span className="text-xs font-medium uppercase tracking-wide text-red-600">
//                     Rejected
//                   </span>
//                   <p className="mt-1 font-bold text-red-700">
//                     Rs {formatPKR(rejectedTotal)}
//                   </p>
//                 </div>

//                 <div className="rounded-xl bg-white p-4 shadow-sm">
//                   <span className="text-xs font-medium uppercase tracking-wide text-amber-600">
//                     Pending
//                   </span>
//                   <p className="mt-1 font-bold text-amber-700">
//                     Rs {formatPKR(pendingTotal)}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {paymentDetails && (
//               <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//                 <h3 className="mb-4 text-lg font-semibold text-slate-950">
//                   Payment Details
//                 </h3>

//                 <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Payment Method
//                     </span>
//                     <p className="mt-1 font-medium text-slate-950">
//                       {paymentDetails.paymentMethod || "-"}
//                     </p>
//                   </div>

//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Amount Paid
//                     </span>
//                     <p className="mt-1 font-semibold text-slate-950">
//                       Rs {formatPKR(paymentDetails.amount)}
//                     </p>
//                   </div>

//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Vendor(s)
//                     </span>
//                     <p className="mt-1 text-slate-800">{vendorText}</p>
//                   </div>

//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Transaction Ref
//                     </span>
//                     <p className="mt-1 text-slate-800">
//                       {paymentDetails.transactionReference || "-"}
//                     </p>
//                   </div>

//                   {chequeNumbers.length > 0 && (
//                     <div className="rounded-xl bg-slate-50 p-4 md:col-span-2">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Cheque Number{chequeNumbers.length > 1 ? "s" : ""}
//                       </span>

//                       <div className="mt-2 flex flex-wrap gap-2">
//                         {chequeNumbers.map((chequeNumber, index) => (
//                           <span
//                             key={`${chequeNumber}-${index}`}
//                             className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
//                           >
//                             {chequeNumber}
//                           </span>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   {paymentDetails.releasedByName && (
//                     <div className="rounded-xl bg-slate-50 p-4">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Released By
//                       </span>
//                       <p className="mt-1 text-slate-800">
//                         {paymentDetails.releasedByName}
//                       </p>
//                     </div>
//                   )}

//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Released At
//                     </span>
//                     <p className="mt-1 text-slate-800">
//                       {toDateString(paymentDetails.releasedAt)}
//                     </p>
//                   </div>

//                   {paymentDetails.selectedAccount && (
//                     <div className="rounded-xl bg-slate-50 p-4">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Selected Account
//                       </span>
//                       <p className="mt-1 text-slate-800">
//                         {paymentDetails.selectedAccount.accountName || "-"}
//                         {paymentDetails.selectedAccount.accountNumber
//                           ? ` (${paymentDetails.selectedAccount.accountNumber})`
//                           : ""}
//                       </p>
//                     </div>
//                   )}

//                   {paymentDetails.paymentNotes && (
//                     <div className="rounded-xl bg-slate-50 p-4 md:col-span-2 lg:col-span-3">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Notes
//                       </span>
//                       <p className="mt-1 whitespace-pre-wrap break-words text-slate-800">
//                         {paymentDetails.paymentNotes}
//                       </p>
//                     </div>
//                   )}

//                   {receiptFiles.length > 0 && (
//                     <div className="md:col-span-2 lg:col-span-3">
//                       <span className="mb-3 block text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Bank Receipt{receiptFiles.length > 1 ? "s" : ""}
//                       </span>

//                       <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
//                         {receiptFiles.map((file, index) => (
//                           <a
//                             key={`${file.url}-${index}`}
//                             href={file.url}
//                             target="_blank"
//                             rel="noreferrer"
//                             className="group flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm transition hover:border-blue-200 hover:bg-blue-100"
//                           >
//                             <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
//                               <FileText className="h-5 w-5" />
//                             </span>

//                             <span className="min-w-0">
//                               <span className="block truncate font-semibold text-blue-900">
//                                 {file.name || `Receipt ${index + 1}`}
//                               </span>
//                               <span className="mt-0.5 block text-xs font-medium text-blue-700">
//                                 Open uploaded file {receiptFiles.length > 1 ? index + 1 : ""}
//                               </span>
//                             </span>
//                           </a>
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>

//           <div className="shrink-0 flex flex-wrap justify-end gap-2 border-t bg-white/95 px-6 py-4 backdrop-blur">
//             <Button
//               type="button"
//               variant="outline"
//               className="rounded-full px-5"
//               onClick={handleExportPDF}
//             >
//               <FileText className="mr-2 h-4 w-4" />
//               Export PDF
//             </Button>

//             <Button
//               type="button"
//               variant="outline"
//               className="rounded-full px-5"
//               onClick={handleExportExcel}
//             >
//               <FileSpreadsheet className="mr-2 h-4 w-4" />
//               Export Excel
//             </Button>

//             <Button
//               variant="outline"
//               className="rounded-full px-5"
//               onClick={onClose}
//             >
//               Close
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>

//       <Dialog
//         open={itemRejectDialogOpen}
//         onOpenChange={(open) => {
//           setItemRejectDialogOpen(open);

//           if (!open) {
//             setPendingRejectIndex(null);
//             setItemRejectionComment("");
//           }
//         }}
//       >
//         <DialogContent className="max-w-lg rounded-2xl">
//           <DialogHeader>
//             <DialogTitle>Reject Line Item</DialogTitle>
//             <DialogDescription>
//               Please enter the reason for rejecting this item. This comment will
//               be visible to the requester.
//             </DialogDescription>
//           </DialogHeader>

//           <div className="space-y-3">
//             <Textarea
//               value={itemRejectionComment}
//               onChange={(e) => setItemRejectionComment(e.target.value)}
//               placeholder="Enter rejection reason"
//               rows={5}
//               className="rounded-xl"
//             />
//           </div>

//           <div className="mt-4 flex justify-end gap-2">
//             <Button
//               variant="outline"
//               className="rounded-full"
//               onClick={() => {
//                 setItemRejectDialogOpen(false);
//                 setPendingRejectIndex(null);
//                 setItemRejectionComment("");
//               }}
//             >
//               Cancel
//             </Button>

//             <Button
//               variant="destructive"
//               className="rounded-full"
//               disabled={!itemRejectionComment.trim() || itemActionLoading}
//               onClick={handleItemRejectConfirm}
//             >
//               {itemActionLoading ? "Rejecting..." : "Confirm Reject"}
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>

//       <Dialog
//         open={requestRejectDialogOpen}
//         onOpenChange={(open) => {
//           setRequestRejectDialogOpen(open);

//           if (!open) {
//             setRequestRejectionComment("");
//           }
//         }}
//       >
//         <DialogContent className="max-w-lg rounded-2xl">
//           <DialogHeader>
//             <DialogTitle>Reject Request</DialogTitle>
//             <DialogDescription>
//               Please enter the reason for rejecting this request. It will be
//               saved in the approval history and sent back to Operational Admin.
//             </DialogDescription>
//           </DialogHeader>

//           <div className="space-y-3">
//             <Textarea
//               value={requestRejectionComment}
//               onChange={(e) => setRequestRejectionComment(e.target.value)}
//               placeholder="Enter request rejection reason"
//               rows={5}
//               className="rounded-xl"
//             />
//           </div>

//           <div className="mt-4 flex justify-end gap-2">
//             <Button
//               variant="outline"
//               className="rounded-full"
//               onClick={() => {
//                 setRequestRejectDialogOpen(false);
//                 setRequestRejectionComment("");
//               }}
//             >
//               Cancel
//             </Button>

//             <Button
//               variant="destructive"
//               className="rounded-full"
//               disabled={!requestRejectionComment.trim() || requestActionLoading}
//               onClick={handleRejectRequest}
//             >
//               {requestActionLoading ? "Rejecting..." : "Confirm Reject"}
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// }



// import { InvoiceRequest } from "@shared/schema";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { Check, FileSpreadsheet, FileText, ReceiptText, X } from "lucide-react";
// import { doc, updateDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { useAuth } from "@/contexts/AuthContext";
// import { useToast } from "@/hooks/use-toast";
// import { useState, useEffect } from "react";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
// import * as XLSX from "xlsx";

// function toDateString(timestamp: any): string {
//   if (!timestamp) return "N/A";

//   if (timestamp.toDate && typeof timestamp.toDate === "function") {
//     return timestamp.toDate().toLocaleString();
//   }

//   if (timestamp instanceof Date) {
//     return timestamp.toLocaleString();
//   }

//   try {
//     return new Date(timestamp).toLocaleString();
//   } catch {
//     return "N/A";
//   }
// }

// function formatPKR(value: number | string | undefined) {
//   if (value === null || value === undefined) return "0.00";

//   const num =
//     typeof value === "number"
//       ? value
//       : parseFloat(String(value).replace(/,/g, "")) || 0;

//   return num.toLocaleString("en-PK", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });
// }

// function getItemAmount(item: any) {
//   const qty = Number(item?.units ?? 0);
//   const rate = Number(item?.unitRate ?? 0);
//   const tax = Number(item?.tax ?? 0);
//   const total = Number(item?.total ?? qty * rate + tax);

//   return Number.isFinite(total) ? total : 0;
// }


// function getInvoiceItems(invoice: any): any[] {
//   const items = Array.isArray(invoice?.items) ? invoice.items : [];
//   const lineItems = Array.isArray(invoice?.lineItems) ? invoice.lineItems : [];
//   const approvalItems = Array.isArray(invoice?.approvalItems)
//     ? invoice.approvalItems
//     : [];

//   const availableArrays = [items, lineItems, approvalItems].filter(
//     (array) => array.length > 0
//   );

//   if (availableArrays.length === 0) return [];

//   const baseItems = availableArrays.reduce((longest, current) =>
//     current.length > longest.length ? current : longest
//   );

//   const findMatchingItem = (
//     source: any[],
//     baseItem: any,
//     index: number
//   ): any | undefined => {
//     if (!source.length) return undefined;

//     if (baseItem?.id !== null && baseItem?.id !== undefined) {
//       const matchById = source.find(
//         (item) => String(item?.id) === String(baseItem.id)
//       );

//       if (matchById) return matchById;
//     }

//     return source[index];
//   };

//   return baseItems.map((baseItem: any, index: number) => {
//     const approvalItem = findMatchingItem(approvalItems, baseItem, index);
//     const legacyLineItem = findMatchingItem(lineItems, baseItem, index);
//     const currentItem = findMatchingItem(items, baseItem, index);

//     return {
//       ...(approvalItem || {}),
//       ...(legacyLineItem || {}),
//       ...(currentItem || {}),
//     };
//   });
// }

// function getReadableStatus(status?: string) {
//   if (!status) return "Pending";

//   return status
//     .replace(/_/g, " ")
//     .replace(/\b\w/g, (char) => char.toUpperCase());
// }

// function getChequeNumbers(paymentDetails: any): string[] {
//   const chequeNumbersFromArray = Array.isArray(paymentDetails?.chequeNumbers)
//     ? paymentDetails.chequeNumbers
//     : [];

//   const oldSingleChequeNumber = paymentDetails?.chequeNumber
//     ? [paymentDetails.chequeNumber]
//     : [];

//   return Array.from(
//     new Set(
//       [...chequeNumbersFromArray, ...oldSingleChequeNumber]
//         .map((num) => String(num || "").trim())
//         .filter(Boolean)
//     )
//   );
// }

// type ReceiptFileItem = {
//   url: string;
//   name: string;
// };

// function getFileNameFromUrl(url: string, fallback = "Receipt File") {
//   try {
//     const cleanUrl = String(url || "").split("?")[0];

//     // Firebase Storage URLs usually contain "/o/<encoded-file-path>".
//     const firebaseStorageMatch = cleanUrl.match(/\/o\/([^/]+)$/);
//     const rawPath = firebaseStorageMatch?.[1] || cleanUrl.split("/").pop() || "";

//     const decodedPath = decodeURIComponent(rawPath);
//     const fileName = decodedPath.split("/").pop();

//     return fileName || fallback;
//   } catch {
//     return fallback;
//   }
// }

// function getReceiptFiles(paymentDetails: any): ReceiptFileItem[] {
//   const files: ReceiptFileItem[] = [];

//   const pushFile = (value: any, fallbackName?: string) => {
//     if (!value) return;

//     if (typeof value === "string") {
//       const url = value.trim();
//       if (!url) return;

//       files.push({
//         url,
//         name: fallbackName || getFileNameFromUrl(url, `Receipt ${files.length + 1}`),
//       });

//       return;
//     }

//     if (typeof value === "object") {
//       const url = String(
//         value.url ||
//           value.downloadURL ||
//           value.downloadUrl ||
//           value.fileUrl ||
//           value.fileURL ||
//           value.receiptUrl ||
//           value.bankReceiptUrl ||
//           ""
//       ).trim();

//       if (!url) return;

//       files.push({
//         url,
//         name:
//           value.name ||
//           value.fileName ||
//           value.filename ||
//           value.originalName ||
//           fallbackName ||
//           getFileNameFromUrl(url, `Receipt ${files.length + 1}`),
//       });
//     }
//   };

//   [
//     paymentDetails?.bankReceiptUrls,
//     paymentDetails?.receiptUrls,
//     paymentDetails?.receipts,
//     paymentDetails?.receiptFiles,
//     paymentDetails?.uploadedFiles,
//     paymentDetails?.files,
//   ].forEach((collection) => {
//     if (Array.isArray(collection)) {
//       collection.forEach((file, index) => {
//         pushFile(file, `Receipt ${index + 1}`);
//       });
//     }
//   });

//   pushFile(paymentDetails?.bankReceiptUrl, "Receipt 1");
//   pushFile(paymentDetails?.receiptUrl, "Receipt 1");

//   const uniqueFiles = new Map<string, ReceiptFileItem>();

//   files.forEach((file, index) => {
//     if (!file.url || uniqueFiles.has(file.url)) return;

//     uniqueFiles.set(file.url, {
//       url: file.url,
//       name: file.name || `Receipt ${index + 1}`,
//     });
//   });

//   return Array.from(uniqueFiles.values());
// }

// interface BudgetDetailsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   invoice: InvoiceRequest | null;
//   onSubmitExpense?: (request: InvoiceRequest) => void;
// }

// export default function BudgetDetailsModal({
//   isOpen,
//   onClose,
//   invoice,
//   onSubmitExpense,
// }: BudgetDetailsModalProps) {
//   const { userProfile } = useAuth();
//   const { toast } = useToast();

//   const isMainAdmin = userProfile?.role === "main_admin";

//   const [liveInvoice, setLiveInvoice] = useState<InvoiceRequest | null>(invoice);
//   const [lineItems, setLineItems] = useState<any[]>(getInvoiceItems(invoice));

//   const [itemRejectDialogOpen, setItemRejectDialogOpen] = useState(false);
//   const [pendingRejectIndex, setPendingRejectIndex] = useState<number | null>(
//     null
//   );
//   const [itemRejectionComment, setItemRejectionComment] = useState("");
//   const [itemActionLoading, setItemActionLoading] = useState(false);

//   const [requestRejectDialogOpen, setRequestRejectDialogOpen] = useState(false);
//   const [requestRejectionComment, setRequestRejectionComment] = useState("");
//   const [requestActionLoading, setRequestActionLoading] = useState(false);

//   useEffect(() => {
//     setLiveInvoice(invoice);
//     setLineItems(getInvoiceItems(invoice));
//   }, [invoice]);

//   useEffect(() => {
//     if (!invoice?.id || !isOpen) return;

//     const ref = doc(
//       db,
//       "Panels",
//       "IEDGE-SYSTEM",
//       "invoiceRequests",
//       invoice.id
//     );

//     const unsub = onSnapshot(ref, (snap) => {
//       if (snap.exists()) {
//         const freshInvoice = {
//           id: snap.id,
//           ...snap.data(),
//         } as InvoiceRequest;

//         setLiveInvoice(freshInvoice);
//         setLineItems(getInvoiceItems(freshInvoice));
//       }
//     });

//     return () => unsub();
//   }, [invoice?.id, isOpen]);

//   if (!liveInvoice) return null;

//   const activeInvoice = liveInvoice;

//   const invoiceType =
//     (activeInvoice as any).invoiceType ||
//     (activeInvoice.clientName ? "project" : "general");

//   function getStatusBadgeColor(status: string): string {
//     switch (status) {
//       case "approved":
//       case "payment_released":
//         return "border-green-200 bg-green-50 text-green-700";
//       case "rejected":
//         return "border-red-200 bg-red-50 text-red-700";
//       case "pending_operational_admin":
//       case "pending_main_admin":
//       case "pending_finance":
//         return "border-amber-200 bg-amber-50 text-amber-700";
//       default:
//         return "border-blue-200 bg-blue-50 text-blue-700";
//     }
//   }

//   function getItemStatusBadgeColor(status: string): string {
//     switch (status) {
//       case "approved":
//         return "border-green-200 bg-green-50 text-green-700";
//       case "rejected":
//         return "border-red-200 bg-red-50 text-red-700";
//       default:
//         return "border-amber-200 bg-amber-50 text-amber-700";
//     }
//   }

//   function canApproveRequest(request: InvoiceRequest): boolean {
//     if (!userProfile) return false;

//     switch (userProfile.role) {
//       case "operational_admin":
//         return request.status === "pending_operational_admin";
//       case "main_admin":
//         return request.status === "pending_main_admin";
//       case "finance":
//       case "financial_admin":
//         return request.status === "pending_finance";
//       default:
//         return false;
//     }
//   }

//   async function handleApproveRequest() {
//     if (!activeInvoice?.id || !userProfile) return;

//     try {
//       setRequestActionLoading(true);

//       let newStatus = activeInvoice.status;
//       let currentApprover = "";

//       switch (userProfile.role) {
//         case "operational_admin":
//           if (activeInvoice.status === "pending_operational_admin") {
//             newStatus = "pending_main_admin" as any;
//           }
//           break;

//         case "main_admin":
//           if (activeInvoice.status === "pending_main_admin") {
//             newStatus = "pending_finance" as any;
//           }
//           break;

//         case "finance":
//         case "financial_admin":
//           if (activeInvoice.status === "pending_finance") {
//             newStatus = "approved" as any;
//           }
//           break;
//       }

//       if (newStatus === activeInvoice.status) {
//         toast({
//           title: "Action not available",
//           description: "This request is not pending your approval step.",
//           variant: "destructive",
//         });
//         return;
//       }

//       await updateDoc(
//         doc(db, "Panels", "IEDGE-SYSTEM", "invoiceRequests", activeInvoice.id),
//         {
//           status: newStatus,
//           currentApprover,
//           approvalHistory: [
//             ...((activeInvoice as any).approvalHistory || []),
//             {
//               approver: userProfile.displayName,
//               action: "approved",
//               timestamp: new Date(),
//               notes: "",
//             },
//           ],
//           updatedAt: serverTimestamp(),
//         }
//       );

//       setLiveInvoice({ ...activeInvoice, status: newStatus } as InvoiceRequest);

//       toast({
//         title: "Request approved",
//         description: "The request status has been updated successfully.",
//       });
//     } catch (error: any) {
//       console.error("Failed to approve request:", error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to approve request",
//         variant: "destructive",
//       });
//     } finally {
//       setRequestActionLoading(false);
//     }
//   }

//   async function handleRejectRequest() {
//     if (!activeInvoice?.id || !userProfile) return;

//     const reason = requestRejectionComment.trim();

//     if (!reason) {
//       toast({
//         title: "Rejection comment required",
//         description: "Please enter the reason for rejecting this request.",
//         variant: "destructive",
//       });
//       return;
//     }

//     try {
//       setRequestActionLoading(true);

//       await updateDoc(
//         doc(db, "Panels", "IEDGE-SYSTEM", "invoiceRequests", activeInvoice.id),
//         {
//           status: "pending_operational_admin",
//           approvalHistory: [
//             ...((activeInvoice as any).approvalHistory || []),
//             {
//               approver: userProfile.displayName,
//               action: "rejected",
//               timestamp: new Date(),
//               notes: reason,
//             },
//           ],
//           updatedAt: serverTimestamp(),
//         }
//       );

//       setLiveInvoice({
//         ...activeInvoice,
//         status: "pending_operational_admin" as any,
//       } as InvoiceRequest);

//       toast({
//         title: "Request rejected",
//         description: "The request has been sent back with your comment.",
//       });

//       setRequestRejectDialogOpen(false);
//       setRequestRejectionComment("");
//     } catch (error: any) {
//       console.error("Failed to reject request:", error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to reject request",
//         variant: "destructive",
//       });
//     } finally {
//       setRequestActionLoading(false);
//     }
//   }

//   async function updateLineItemStatus(
//     index: number,
//     status: "approved" | "rejected",
//     rejectReason = ""
//   ) {
//     if (!activeInvoice?.id || !userProfile) return;

//     try {
//       setItemActionLoading(true);

//       const updatedItems = lineItems.map((item: any) => ({ ...item }));
//       const now = new Date();
//       const actorName = userProfile.displayName || "Main Admin";
//       const currentItem = updatedItems[index] || {};

//       updatedItems[index] = {
//         ...currentItem,
//         status,
//         reviewedBy: actorName,
//         reviewedAt: now,
//         ...(status === "approved"
//           ? {
//               approvedBy: actorName,
//               approvedAt: now,
//               rejectionComment: "",
//             }
//           : {
//               rejectedBy: actorName,
//               rejectedAt: now,
//               rejectionComment: rejectReason.trim(),
//             }),
//       };

//       await updateDoc(
//         doc(db, "Panels", "IEDGE-SYSTEM", "invoiceRequests", activeInvoice.id),
//         {
//           items: updatedItems,
//           lineItems: updatedItems,
//           updatedAt: serverTimestamp(),
//         }
//       );

//       setLineItems(updatedItems);

//       toast({
//         title: status === "approved" ? "Item approved" : "Item rejected",
//       });
//     } catch (error) {
//       console.error("Failed to update line item status:", error);
//       toast({
//         title: "Error",
//         description: "Failed to update item status",
//         variant: "destructive",
//       });
//     } finally {
//       setItemActionLoading(false);
//     }
//   }

//   function openItemRejectDialog(index: number) {
//     setPendingRejectIndex(index);
//     setItemRejectionComment("");
//     setItemRejectDialogOpen(true);
//   }

//   async function handleItemRejectConfirm() {
//     if (pendingRejectIndex === null) return;

//     const reason = itemRejectionComment.trim();

//     if (!reason) {
//       toast({
//         title: "Rejection comment required",
//         description: "Please enter the reason for rejecting this item.",
//         variant: "destructive",
//       });
//       return;
//     }

//     await updateLineItemStatus(pendingRejectIndex, "rejected", reason);
//     setItemRejectDialogOpen(false);
//     setPendingRejectIndex(null);
//     setItemRejectionComment("");
//   }

//   const approvedTotal = lineItems
//     .filter((item: any) => item.status === "approved")
//     .reduce((sum: number, item: any) => sum + getItemAmount(item), 0);

//   const rejectedTotal = lineItems
//     .filter((item: any) => item.status === "rejected")
//     .reduce((sum: number, item: any) => sum + getItemAmount(item), 0);

//   const pendingTotal = lineItems
//     .filter((item: any) => !item.status || item.status === "pending")
//     .reduce((sum: number, item: any) => sum + getItemAmount(item), 0);

//   const totalBudget = activeInvoice.totalAmount || 0;
//   const canShowRequestActions = canApproveRequest(activeInvoice);

//   const paymentDetails = activeInvoice.paymentDetails as
//     | {
//         paymentMethod?: string;
//         amount?: number;
//         vendor?: string;
//         vendors?: string[];
//         transactionReference?: string;

//         chequeNumber?: string;
//         chequeNumbers?: string[];

//         bankReceiptUrl?: string;
//         bankReceiptUrls?: string[];
//         receiptUrl?: string;
//         receiptUrls?: string[];
//         receipts?: any[];
//         receiptFiles?: any[];
//         uploadedFiles?: any[];
//         files?: any[];

//         paymentNotes?: string;
//         releasedAt?: any;
//         releasedByName?: string;

//         selectedAccount?: {
//           accountName?: string;
//           accountNumber?: string;
//           bankName?: string;
//         };
//       }
//     | undefined;

//   const vendorText = Array.isArray(paymentDetails?.vendors)
//     ? paymentDetails?.vendors.join(", ")
//     : paymentDetails?.vendor || "-";

//   const chequeNumbers = getChequeNumbers(paymentDetails);
//   const chequeNumbersText = chequeNumbers.length ? chequeNumbers.join(", ") : "-";

//   const receiptFiles = getReceiptFiles(paymentDetails);
//   const receiptUrls = receiptFiles.map((file) => file.url);

//   const displaySubject =
//     (activeInvoice as any).subject ||
//     (invoiceType === "project" ? (activeInvoice as any).title || "-" : "-");

//   const canSubmitExpense =
//     invoiceType === "project" &&
//     !!onSubmitExpense &&
//     ["approved", "payment_released"].includes(String(activeInvoice.status || ""));

//   function getExportFileName(extension: "pdf" | "xlsx") {
//     const requestId = String(activeInvoice.requestId || "budget-detail")
//       .trim()
//       .replace(/[^a-zA-Z0-9-_]+/g, "-")
//       .replace(/-+/g, "-");

//     return `Budget-Detail-${requestId || "request"}.${extension}`;
//   }

//   function getLineItemExportRows() {
//     return lineItems.map((item: any, index: number) => {
//       const status = item.status || "pending";

//       return {
//         "#": index + 1,
//         Vendor: item.vendor || "-",
//         Service: item.service || "-",
//         Description: item.description || "-",
//         "Requester Comment": item.comment || "-",
//         Qty: item.units ?? 0,
//         Rate: Number(item.unitRate ?? 0),
//         Amount: getItemAmount(item),
//         Status: getReadableStatus(status),
//         "Reviewed By":
//           item.reviewedBy || item.approvedBy || item.rejectedBy || "-",
//         "Reviewed At": toDateString(
//           item.reviewedAt || item.approvedAt || item.rejectedAt
//         ),
//         "Rejection Reason": item.rejectionComment || "-",
//       };
//     });
//   }

//   function getSummaryExportRows() {
//     const rows = [
//       { Field: "Request ID", Value: activeInvoice.requestId || "-" },
//       { Field: "Request Type", Value: getReadableStatus(invoiceType) },
//       { Field: "Status", Value: getReadableStatus(activeInvoice.status) },
//       { Field: "Subject", Value: displaySubject || "-" },
//       { Field: "Submitted Date", Value: toDateString(activeInvoice.submittedAt) },
//       { Field: "Total Budget", Value: `Rs ${formatPKR(totalBudget)}` },
//       { Field: "Approved Amount", Value: `Rs ${formatPKR(approvedTotal)}` },
//       { Field: "Rejected Amount", Value: `Rs ${formatPKR(rejectedTotal)}` },
//       { Field: "Pending Amount", Value: `Rs ${formatPKR(pendingTotal)}` },
//     ];

//     if (invoiceType === "general") {
//       rows.splice(3, 0, {
//         Field: "Title",
//         Value: (activeInvoice as any).title || "-",
//       });
//     } else {
//       rows.splice(
//         3,
//         0,
//         { Field: "Client", Value: activeInvoice.clientName || "-" },
//         { Field: "Project", Value: activeInvoice.project || "-" },
//         {
//           Field: "Project Code",
//           Value: (activeInvoice as any).projectCode || "-",
//         }
//       );
//     }

//     const message =
//       (activeInvoice as any).message || (activeInvoice as any).comment;

//     if (message) {
//       rows.push({ Field: "Message", Value: message });
//     }

//     return rows;
//   }

//   function getPaymentExportRows() {
//     if (!paymentDetails) return [];

//     const rows = [
//       { Field: "Payment Method", Value: paymentDetails.paymentMethod || "-" },
//       { Field: "Amount Paid", Value: `Rs ${formatPKR(paymentDetails.amount)}` },
//       { Field: "Vendor(s)", Value: vendorText },
//       {
//         Field: "Transaction Ref",
//         Value: paymentDetails.transactionReference || "-",
//       },
//       { Field: "Cheque Numbers", Value: chequeNumbersText },
//       { Field: "Released By", Value: paymentDetails.releasedByName || "-" },
//       { Field: "Released At", Value: toDateString(paymentDetails.releasedAt) },
//       {
//         Field: "Bank Receipt",
//         Value: receiptUrls.length ? receiptUrls.join(", ") : "-",
//       },
//       { Field: "Notes", Value: paymentDetails.paymentNotes || "-" },
//     ];

//     if (paymentDetails.selectedAccount) {
//       rows.push(
//         {
//           Field: "Account Name",
//           Value: paymentDetails.selectedAccount.accountName || "-",
//         },
//         {
//           Field: "Account Number",
//           Value: paymentDetails.selectedAccount.accountNumber || "-",
//         },
//         {
//           Field: "Bank Name",
//           Value: paymentDetails.selectedAccount.bankName || "-",
//         }
//       );
//     }

//     return rows;
//   }

//   function handleExportPDF() {
//     try {
//       const pdf = new jsPDF({
//         orientation: "landscape",
//         unit: "pt",
//         format: "a4",
//       });

//       const pageWidth = pdf.internal.pageSize.getWidth();
//       const generatedAt = new Date().toLocaleString();

//       pdf.setFontSize(18);
//       pdf.text("Budget Detail", 40, 40);

//       pdf.setFontSize(10);
//       pdf.text(`Request ID: ${activeInvoice.requestId || "-"}`, 40, 58);
//       pdf.text(`Generated: ${generatedAt}`, pageWidth - 40, 58, {
//         align: "right",
//       });

//       autoTable(pdf, {
//         startY: 82,
//         head: [["Field", "Value"]],
//         body: getSummaryExportRows().map((row) => [row.Field, row.Value]),
//         theme: "grid",
//         styles: {
//           fontSize: 9,
//           cellPadding: 5,
//           overflow: "linebreak",
//         },
//         headStyles: {
//           fillColor: [15, 23, 42],
//         },
//         columnStyles: {
//           0: {
//             cellWidth: 150,
//             fontStyle: "bold",
//           },
//           1: {
//             cellWidth: "auto",
//           },
//         },
//       });

//       autoTable(pdf, {
//         startY: (pdf as any).lastAutoTable.finalY + 24,
//         head: [
//           [
//             "#",
//             "Vendor",
//             "Service",
//             "Description",
//             "Comment",
//             "Qty",
//             "Rate",
//             "Amount",
//             "Status",
//             "Rejection Reason",
//           ],
//         ],
//         body: getLineItemExportRows().map((row) => [
//           row["#"],
//           row.Vendor,
//           row.Service,
//           row.Description,
//           row["Requester Comment"],
//           row.Qty,
//           `Rs ${formatPKR(row.Rate)}`,
//           `Rs ${formatPKR(row.Amount)}`,
//           row.Status,
//           row["Rejection Reason"],
//         ]),
//         theme: "striped",
//         styles: {
//           fontSize: 8,
//           cellPadding: 4,
//           overflow: "linebreak",
//         },
//         headStyles: {
//           fillColor: [15, 23, 42],
//         },
//         columnStyles: {
//           0: { cellWidth: 28 },
//           1: { cellWidth: 82 },
//           2: { cellWidth: 82 },
//           3: { cellWidth: 145 },
//           4: { cellWidth: 120 },
//           5: { cellWidth: 40, halign: "right" },
//           6: { cellWidth: 72, halign: "right" },
//           7: { cellWidth: 78, halign: "right" },
//           8: { cellWidth: 72 },
//           9: { cellWidth: 120 },
//         },
//       });

//       const paymentRows = getPaymentExportRows();

//       if (paymentRows.length) {
//         autoTable(pdf, {
//           startY: (pdf as any).lastAutoTable.finalY + 24,
//           head: [["Payment Field", "Value"]],
//           body: paymentRows.map((row) => [row.Field, row.Value]),
//           theme: "grid",
//           styles: {
//             fontSize: 9,
//             cellPadding: 5,
//             overflow: "linebreak",
//           },
//           headStyles: {
//             fillColor: [15, 23, 42],
//           },
//           columnStyles: {
//             0: {
//               cellWidth: 150,
//               fontStyle: "bold",
//             },
//           },
//         });
//       }

//       pdf.save(getExportFileName("pdf"));

//       toast({
//         title: "PDF exported",
//         description: "Budget detail PDF has been downloaded.",
//       });
//     } catch (error) {
//       console.error("Failed to export PDF:", error);
//       toast({
//         title: "Export failed",
//         description: "Failed to export Budget Detail PDF.",
//         variant: "destructive",
//       });
//     }
//   }

//   function handleExportExcel() {
//     try {
//       const workbook = XLSX.utils.book_new();

//       const summarySheet = XLSX.utils.json_to_sheet(getSummaryExportRows());
//       XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

//       const lineItemsSheet = XLSX.utils.json_to_sheet(getLineItemExportRows());
//       XLSX.utils.book_append_sheet(workbook, lineItemsSheet, "Line Items");

//       const paymentRows = getPaymentExportRows();

//       if (paymentRows.length) {
//         const paymentSheet = XLSX.utils.json_to_sheet(paymentRows);
//         XLSX.utils.book_append_sheet(workbook, paymentSheet, "Payment Details");
//       }

//       XLSX.writeFile(workbook, getExportFileName("xlsx"));

//       toast({
//         title: "Excel exported",
//         description: "Budget detail Excel file has been downloaded.",
//       });
//     } catch (error) {
//       console.error("Failed to export Excel:", error);
//       toast({
//         title: "Export failed",
//         description: "Failed to export Budget Detail Excel file.",
//         variant: "destructive",
//       });
//     }
//   }

//   return (
//     <>
//       <Dialog
//         open={isOpen}
//         onOpenChange={(open) => {
//           if (open) return;
//         }}
//       >
//         <DialogContent
//           onPointerDownOutside={(event) => event.preventDefault()}
//           onInteractOutside={(event) => event.preventDefault()}
//           onEscapeKeyDown={(event) => event.preventDefault()}
//           className="!left-0 !top-0 flex !h-screen !max-h-screen !w-screen !max-w-none !translate-x-0 !translate-y-0 flex-col overflow-hidden rounded-none border-0 bg-slate-50 p-0 shadow-2xl [&>button:last-child]:hidden"
//         >
//           <div className="shrink-0 border-b bg-white/95 px-6 py-5 backdrop-blur">
//             <DialogHeader>
//               <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
//                 <div>
//                   <DialogTitle className="text-2xl font-bold tracking-tight text-slate-950">
//                     Budget Detail
//                   </DialogTitle>

//                   <DialogDescription className="mt-1 text-sm text-slate-500">
//                     Request Form Details – {activeInvoice.requestId}
//                   </DialogDescription>
//                 </div>

//                 <div className="flex flex-wrap items-center gap-2">
//                   <Badge
//                     className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeColor(
//                       activeInvoice.status
//                     )}`}
//                   >
//                     {getReadableStatus(activeInvoice.status)}
//                   </Badge>

//                   {canSubmitExpense && (
//                     <Button
//                       size="sm"
//                       className="rounded-full bg-slate-950 px-4 text-white shadow-sm hover:bg-slate-800"
//                       onClick={() => onSubmitExpense?.(activeInvoice)}
//                     >
//                       <ReceiptText className="mr-1 h-4 w-4" />
//                       Submit Expense
//                     </Button>
//                   )}

//                   {canShowRequestActions && (
//                     <>
//                       <Button
//                         size="sm"
//                         className="rounded-full bg-green-600 px-4 text-white shadow-sm hover:bg-green-700"
//                         disabled={requestActionLoading}
//                         onClick={handleApproveRequest}
//                       >
//                         <Check className="mr-1 h-4 w-4" />
//                         {requestActionLoading
//                           ? "Approving..."
//                           : "Approve Request"}
//                       </Button>

//                       <Button
//                         size="sm"
//                         variant="destructive"
//                         className="rounded-full px-4 shadow-sm"
//                         disabled={requestActionLoading}
//                         onClick={() => {
//                           setRequestRejectionComment("");
//                           setRequestRejectDialogOpen(true);
//                         }}
//                       >
//                         <X className="mr-1 h-4 w-4" />
//                         Reject Request
//                       </Button>
//                     </>
//                   )}

//                   <Button
//                     type="button"
//                     size="sm"
//                     variant="outline"
//                     aria-label="Close Budget Detail"
//                     className="rounded-full px-4 shadow-sm"
//                     onClick={onClose}
//                   >
//                     <X className="mr-1 h-4 w-4" />
//                     Close
//                   </Button>
//                 </div>
//               </div>
//             </DialogHeader>
//           </div>

//           <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
//               <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//                 <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                   Total Budget
//                 </p>
//                 <p className="mt-2 text-2xl font-bold text-slate-950">
//                   Rs {formatPKR(totalBudget)}
//                 </p>
//               </div>

//               <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
//                 <p className="text-xs font-medium uppercase tracking-wide text-green-600">
//                   Approved Amount
//                 </p>
//                 <p className="mt-2 text-2xl font-bold text-green-700">
//                   Rs {formatPKR(approvedTotal)}
//                 </p>
//               </div>

//               <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
//                 <p className="text-xs font-medium uppercase tracking-wide text-red-600">
//                   Rejected Amount
//                 </p>
//                 <p className="mt-2 text-2xl font-bold text-red-700">
//                   Rs {formatPKR(rejectedTotal)}
//                 </p>
//               </div>
//             </div>

//             <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//               <div className="mb-4 flex items-center justify-between">
//                 <h3 className="text-base font-semibold text-slate-950">
//                   Request Information
//                 </h3>
//               </div>

//               <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
//                 <div className="rounded-xl bg-slate-50 p-4">
//                   <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Request ID
//                   </span>
//                   <p className="mt-1 font-semibold text-slate-950">
//                     {activeInvoice.requestId}
//                   </p>
//                 </div>

//                 <div className="rounded-xl bg-slate-50 p-4">
//                   <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Status
//                   </span>
//                   <div className="mt-2">
//                     <Badge
//                       className={`rounded-full border px-3 py-1 ${getStatusBadgeColor(
//                         activeInvoice.status
//                       )}`}
//                     >
//                       {getReadableStatus(activeInvoice.status)}
//                     </Badge>
//                   </div>
//                 </div>

//                 {invoiceType === "general" ? (
//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Title
//                     </span>
//                     <p className="mt-1 font-semibold text-slate-950">
//                       {(activeInvoice as any).title || "-"}
//                     </p>
//                   </div>
//                 ) : (
//                   <>
//                     <div className="rounded-xl bg-slate-50 p-4">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Client
//                       </span>
//                       <p className="mt-1 font-semibold text-slate-950">
//                         {activeInvoice.clientName || "-"}
//                       </p>
//                     </div>

//                     <div className="rounded-xl bg-slate-50 p-4">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Project
//                       </span>
//                       <p className="mt-1 font-semibold text-slate-950">
//                         {activeInvoice.project || "-"}
//                       </p>
//                     </div>

//                     <div className="rounded-xl bg-slate-50 p-4">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Project Code
//                       </span>
//                       <p className="mt-1 font-semibold text-slate-950">
//                         {(activeInvoice as any).projectCode || "-"}
//                       </p>
//                     </div>
//                   </>
//                 )}

//                 <div className="rounded-xl bg-slate-50 p-4 md:col-span-2">
//                   <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Subject
//                   </span>
//                   <p className="mt-1 whitespace-pre-wrap break-words font-semibold text-slate-950">
//                     {displaySubject}
//                   </p>
//                 </div>

//                 <div className="rounded-xl bg-slate-50 p-4">
//                   <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Submitted Date
//                   </span>
//                   <p className="mt-1 text-slate-800">
//                     {toDateString(activeInvoice.submittedAt)}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {((activeInvoice as any).message ||
//               (activeInvoice as any).comment) && (
//               <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//                 <h3 className="mb-3 text-base font-semibold text-slate-950">
//                   Message
//                 </h3>

//                 <div className="min-h-[100px] rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-wrap break-words">
//                   {(activeInvoice as any).message ||
//                     (activeInvoice as any).comment ||
//                     "-"}
//                 </div>
//               </div>
//             )}

//             <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
//               <div className="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
//                 <div>
//                   <h3 className="text-lg font-semibold text-slate-950">
//                     Item Approval
//                   </h3>
//                   <p className="mt-1 text-sm text-slate-500">
//                     Approve or reject individual budget items. Request-level
//                     approve/reject is also available here.
//                   </p>
//                 </div>

//                 <div className="flex flex-wrap gap-2">
//                   {canSubmitExpense && (
//                     <Button
//                       size="sm"
//                       className="rounded-full bg-slate-950 px-4 text-white hover:bg-slate-800"
//                       onClick={() => onSubmitExpense?.(activeInvoice)}
//                     >
//                       <ReceiptText className="mr-1 h-4 w-4" />
//                       Submit Expense
//                     </Button>
//                   )}
//                 </div>
//               </div>

//               <div className="overflow-x-auto">
//                 <table className="w-full min-w-[1050px] text-sm">
//                   <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
//                     <tr>
//                       <th className="px-4 py-3 text-left font-semibold">
//                         Vendor
//                       </th>
//                       <th className="px-4 py-3 text-left font-semibold">
//                         Service
//                       </th>
//                       <th className="px-4 py-3 text-left font-semibold">
//                         Description
//                       </th>
//                       <th className="px-4 py-3 text-left font-semibold min-w-[220px]">
//                         Requester Comment
//                       </th>
//                       <th className="px-4 py-3 text-right font-semibold">
//                         Qty
//                       </th>
//                       <th className="px-4 py-3 text-right font-semibold">
//                         Rate
//                       </th>
//                       <th className="px-4 py-3 text-right font-semibold">
//                         Amount
//                       </th>
//                       <th className="px-4 py-3 text-center font-semibold min-w-[180px]">
//                         Item Action
//                       </th>
//                       <th className="px-4 py-3 text-left font-semibold min-w-[240px]">
//                         Rejection Reason
//                       </th>
//                     </tr>
//                   </thead>

//                   <tbody className="divide-y divide-slate-100">
//                     {lineItems.length === 0 ? (
//                       <tr>
//                         <td
//                           colSpan={9}
//                           className="px-4 py-10 text-center text-slate-500"
//                         >
//                           No line items found.
//                         </td>
//                       </tr>
//                     ) : (
//                       lineItems.map((item, index) => {
//                         const qty = item.units ?? 0;
//                         const rate = item.unitRate ?? 0;
//                         const amount = getItemAmount(item);
//                         const status = item.status || "pending";

//                         return (
//                           <tr
//                             key={item.id || index}
//                             className="align-top transition hover:bg-slate-50/80"
//                           >
//                             <td className="px-4 py-4 font-medium text-slate-950">
//                               {item.vendor || "-"}
//                             </td>

//                             <td className="px-4 py-4 text-slate-700">
//                               {item.service || "-"}
//                             </td>

//                             <td className="px-4 py-4 whitespace-pre-wrap break-words text-slate-700">
//                               {item.description || "-"}
//                             </td>

//                             <td className="px-4 py-4 whitespace-pre-wrap break-words text-slate-700">
//                               {item.comment || "-"}
//                             </td>

//                             <td className="px-4 py-4 text-right text-slate-700">
//                               {qty}
//                             </td>

//                             <td className="px-4 py-4 text-right text-slate-700">
//                               Rs {formatPKR(rate)}
//                             </td>

//                             <td className="px-4 py-4 text-right font-semibold text-slate-950">
//                               Rs {formatPKR(amount)}
//                             </td>

//                             <td className="px-4 py-4 text-center">
//                               {isMainAdmin && status === "pending" ? (
//                                 <div className="flex flex-wrap justify-center gap-2">
//                                   <Button
//                                     size="sm"
//                                     className="rounded-full bg-green-600 px-3 text-white hover:bg-green-700"
//                                     disabled={itemActionLoading}
//                                     onClick={() =>
//                                       updateLineItemStatus(index, "approved")
//                                     }
//                                   >
//                                     <Check className="mr-1 h-4 w-4" />
//                                     Approve
//                                   </Button>

//                                   <Button
//                                     size="sm"
//                                     variant="destructive"
//                                     className="rounded-full px-3"
//                                     disabled={itemActionLoading}
//                                     onClick={() => openItemRejectDialog(index)}
//                                   >
//                                     <X className="mr-1 h-4 w-4" />
//                                     Reject
//                                   </Button>
//                                 </div>
//                               ) : (
//                                 <Badge
//                                   className={`rounded-full border px-3 py-1 ${getItemStatusBadgeColor(
//                                     status
//                                   )}`}
//                                 >
//                                   {getReadableStatus(status)}
//                                 </Badge>
//                               )}
//                             </td>

//                             <td className="px-4 py-4 whitespace-pre-wrap break-words text-sm">
//                               {item.rejectionComment ? (
//                                 <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-red-700">
//                                   {item.rejectionComment}
//                                 </div>
//                               ) : (
//                                 <span className="text-slate-400">-</span>
//                               )}
//                             </td>
//                           </tr>
//                         );
//                       })
//                     )}
//                   </tbody>
//                 </table>
//               </div>

//               <div className="grid grid-cols-1 gap-3 border-t border-slate-200 bg-slate-50 p-5 md:grid-cols-4">
//                 <div className="rounded-xl bg-white p-4 shadow-sm">
//                   <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                     Total Budget
//                   </span>
//                   <p className="mt-1 font-bold text-slate-950">
//                     Rs {formatPKR(totalBudget)}
//                   </p>
//                 </div>

//                 <div className="rounded-xl bg-white p-4 shadow-sm">
//                   <span className="text-xs font-medium uppercase tracking-wide text-green-600">
//                     Approved
//                   </span>
//                   <p className="mt-1 font-bold text-green-700">
//                     Rs {formatPKR(approvedTotal)}
//                   </p>
//                 </div>

//                 <div className="rounded-xl bg-white p-4 shadow-sm">
//                   <span className="text-xs font-medium uppercase tracking-wide text-red-600">
//                     Rejected
//                   </span>
//                   <p className="mt-1 font-bold text-red-700">
//                     Rs {formatPKR(rejectedTotal)}
//                   </p>
//                 </div>

//                 <div className="rounded-xl bg-white p-4 shadow-sm">
//                   <span className="text-xs font-medium uppercase tracking-wide text-amber-600">
//                     Pending
//                   </span>
//                   <p className="mt-1 font-bold text-amber-700">
//                     Rs {formatPKR(pendingTotal)}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {paymentDetails && (
//               <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//                 <h3 className="mb-4 text-lg font-semibold text-slate-950">
//                   Payment Details
//                 </h3>

//                 <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Payment Method
//                     </span>
//                     <p className="mt-1 font-medium text-slate-950">
//                       {paymentDetails.paymentMethod || "-"}
//                     </p>
//                   </div>

//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Amount Paid
//                     </span>
//                     <p className="mt-1 font-semibold text-slate-950">
//                       Rs {formatPKR(paymentDetails.amount)}
//                     </p>
//                   </div>

//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Vendor(s)
//                     </span>
//                     <p className="mt-1 text-slate-800">{vendorText}</p>
//                   </div>

//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Transaction Ref
//                     </span>
//                     <p className="mt-1 text-slate-800">
//                       {paymentDetails.transactionReference || "-"}
//                     </p>
//                   </div>

//                   {chequeNumbers.length > 0 && (
//                     <div className="rounded-xl bg-slate-50 p-4 md:col-span-2">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Cheque Number{chequeNumbers.length > 1 ? "s" : ""}
//                       </span>

//                       <div className="mt-2 flex flex-wrap gap-2">
//                         {chequeNumbers.map((chequeNumber, index) => (
//                           <span
//                             key={`${chequeNumber}-${index}`}
//                             className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
//                           >
//                             {chequeNumber}
//                           </span>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   {paymentDetails.releasedByName && (
//                     <div className="rounded-xl bg-slate-50 p-4">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Released By
//                       </span>
//                       <p className="mt-1 text-slate-800">
//                         {paymentDetails.releasedByName}
//                       </p>
//                     </div>
//                   )}

//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Released At
//                     </span>
//                     <p className="mt-1 text-slate-800">
//                       {toDateString(paymentDetails.releasedAt)}
//                     </p>
//                   </div>

//                   {paymentDetails.selectedAccount && (
//                     <div className="rounded-xl bg-slate-50 p-4">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Selected Account
//                       </span>
//                       <p className="mt-1 text-slate-800">
//                         {paymentDetails.selectedAccount.accountName || "-"}
//                         {paymentDetails.selectedAccount.accountNumber
//                           ? ` (${paymentDetails.selectedAccount.accountNumber})`
//                           : ""}
//                       </p>
//                     </div>
//                   )}

//                   {paymentDetails.paymentNotes && (
//                     <div className="rounded-xl bg-slate-50 p-4 md:col-span-2 lg:col-span-3">
//                       <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Notes
//                       </span>
//                       <p className="mt-1 whitespace-pre-wrap break-words text-slate-800">
//                         {paymentDetails.paymentNotes}
//                       </p>
//                     </div>
//                   )}

//                   {receiptFiles.length > 0 && (
//                     <div className="md:col-span-2 lg:col-span-3">
//                       <span className="mb-3 block text-xs font-medium uppercase tracking-wide text-slate-500">
//                         Bank Receipt{receiptFiles.length > 1 ? "s" : ""}
//                       </span>

//                       <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
//                         {receiptFiles.map((file, index) => (
//                           <a
//                             key={`${file.url}-${index}`}
//                             href={file.url}
//                             target="_blank"
//                             rel="noreferrer"
//                             className="group flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm transition hover:border-blue-200 hover:bg-blue-100"
//                           >
//                             <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
//                               <FileText className="h-5 w-5" />
//                             </span>

//                             <span className="min-w-0">
//                               <span className="block truncate font-semibold text-blue-900">
//                                 {file.name || `Receipt ${index + 1}`}
//                               </span>
//                               <span className="mt-0.5 block text-xs font-medium text-blue-700">
//                                 Open uploaded file {receiptFiles.length > 1 ? index + 1 : ""}
//                               </span>
//                             </span>
//                           </a>
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>

//           <div className="shrink-0 flex flex-wrap justify-end gap-2 border-t bg-white/95 px-6 py-4 backdrop-blur">
//             <Button
//               type="button"
//               variant="outline"
//               className="rounded-full px-5"
//               onClick={handleExportPDF}
//             >
//               <FileText className="mr-2 h-4 w-4" />
//               Export PDF
//             </Button>

//             <Button
//               type="button"
//               variant="outline"
//               className="rounded-full px-5"
//               onClick={handleExportExcel}
//             >
//               <FileSpreadsheet className="mr-2 h-4 w-4" />
//               Export Excel
//             </Button>

//             <Button
//               variant="outline"
//               className="rounded-full px-5"
//               onClick={onClose}
//             >
//               Close
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>

//       <Dialog
//         open={itemRejectDialogOpen}
//         onOpenChange={(open) => {
//           setItemRejectDialogOpen(open);

//           if (!open) {
//             setPendingRejectIndex(null);
//             setItemRejectionComment("");
//           }
//         }}
//       >
//         <DialogContent className="max-w-lg rounded-2xl">
//           <DialogHeader>
//             <DialogTitle>Reject Line Item</DialogTitle>
//             <DialogDescription>
//               Please enter the reason for rejecting this item. This comment will
//               be visible to the requester.
//             </DialogDescription>
//           </DialogHeader>

//           <div className="space-y-3">
//             <Textarea
//               value={itemRejectionComment}
//               onChange={(e) => setItemRejectionComment(e.target.value)}
//               placeholder="Enter rejection reason"
//               rows={5}
//               className="rounded-xl"
//             />
//           </div>

//           <div className="mt-4 flex justify-end gap-2">
//             <Button
//               variant="outline"
//               className="rounded-full"
//               onClick={() => {
//                 setItemRejectDialogOpen(false);
//                 setPendingRejectIndex(null);
//                 setItemRejectionComment("");
//               }}
//             >
//               Cancel
//             </Button>

//             <Button
//               variant="destructive"
//               className="rounded-full"
//               disabled={!itemRejectionComment.trim() || itemActionLoading}
//               onClick={handleItemRejectConfirm}
//             >
//               {itemActionLoading ? "Rejecting..." : "Confirm Reject"}
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>

//       <Dialog
//         open={requestRejectDialogOpen}
//         onOpenChange={(open) => {
//           setRequestRejectDialogOpen(open);

//           if (!open) {
//             setRequestRejectionComment("");
//           }
//         }}
//       >
//         <DialogContent className="max-w-lg rounded-2xl">
//           <DialogHeader>
//             <DialogTitle>Reject Request</DialogTitle>
//             <DialogDescription>
//               Please enter the reason for rejecting this request. It will be
//               saved in the approval history and sent back to Operational Admin.
//             </DialogDescription>
//           </DialogHeader>

//           <div className="space-y-3">
//             <Textarea
//               value={requestRejectionComment}
//               onChange={(e) => setRequestRejectionComment(e.target.value)}
//               placeholder="Enter request rejection reason"
//               rows={5}
//               className="rounded-xl"
//             />
//           </div>

//           <div className="mt-4 flex justify-end gap-2">
//             <Button
//               variant="outline"
//               className="rounded-full"
//               onClick={() => {
//                 setRequestRejectDialogOpen(false);
//                 setRequestRejectionComment("");
//               }}
//             >
//               Cancel
//             </Button>

//             <Button
//               variant="destructive"
//               className="rounded-full"
//               disabled={!requestRejectionComment.trim() || requestActionLoading}
//               onClick={handleRejectRequest}
//             >
//               {requestActionLoading ? "Rejecting..." : "Confirm Reject"}
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// }




import { InvoiceRequest } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Check,
  FileSpreadsheet,
  FileText,
  ReceiptText,
  X,
} from "lucide-react";
import {
  doc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

function toDateString(timestamp: any): string {
  if (!timestamp) return "N/A";

  if (timestamp.toDate && typeof timestamp.toDate === "function") {
    return timestamp.toDate().toLocaleString();
  }

  if (timestamp instanceof Date) {
    return timestamp.toLocaleString();
  }

  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return "N/A";
  }
}

function formatPKR(value: number | string | undefined) {
  if (value === null || value === undefined) return "0.00";

  const num =
    typeof value === "number"
      ? value
      : parseFloat(String(value).replace(/,/g, "")) || 0;

  return num.toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getItemAmount(item: any) {
  const qty = Number(item?.units ?? 0);
  const rate = Number(item?.unitRate ?? 0);
  const tax = Number(item?.tax ?? 0);
  const total = Number(item?.total ?? qty * rate + tax);

  return Number.isFinite(total) ? total : 0;
}

function getInvoiceItems(invoice: any): any[] {
  const items = Array.isArray(invoice?.items) ? invoice.items : [];
  const lineItems = Array.isArray(invoice?.lineItems)
    ? invoice.lineItems
    : [];
  const approvalItems = Array.isArray(invoice?.approvalItems)
    ? invoice.approvalItems
    : [];

  const availableArrays = [items, lineItems, approvalItems].filter(
    (array) => array.length > 0
  );

  if (availableArrays.length === 0) return [];

  const baseItems = availableArrays.reduce((longest, current) =>
    current.length > longest.length ? current : longest
  );

  const findMatchingItem = (
    source: any[],
    baseItem: any,
    index: number
  ): any | undefined => {
    if (!source.length) return undefined;

    if (baseItem?.id !== null && baseItem?.id !== undefined) {
      const matchById = source.find(
        (item) => String(item?.id) === String(baseItem.id)
      );

      if (matchById) return matchById;
    }

    return source[index];
  };

  return baseItems.map((baseItem: any, index: number) => {
    const approvalItem = findMatchingItem(
      approvalItems,
      baseItem,
      index
    );

    const legacyLineItem = findMatchingItem(
      lineItems,
      baseItem,
      index
    );

    const currentItem = findMatchingItem(items, baseItem, index);

    return {
      ...(approvalItem || {}),
      ...(legacyLineItem || {}),
      ...(currentItem || {}),
    };
  });
}

function getReadableStatus(status?: string) {
  if (!status) return "Pending";

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getChequeNumbers(paymentDetails: any): string[] {
  const chequeNumbersFromArray = Array.isArray(
    paymentDetails?.chequeNumbers
  )
    ? paymentDetails.chequeNumbers
    : [];

  const oldSingleChequeNumber = paymentDetails?.chequeNumber
    ? [paymentDetails.chequeNumber]
    : [];

  return Array.from(
    new Set(
      [...chequeNumbersFromArray, ...oldSingleChequeNumber]
        .map((num) => String(num || "").trim())
        .filter(Boolean)
    )
  );
}

type ReceiptFileItem = {
  url: string;
  name: string;
};

function getFileNameFromUrl(
  url: string,
  fallback = "Receipt File"
) {
  try {
    const cleanUrl = String(url || "").split("?")[0];

    const firebaseStorageMatch =
      cleanUrl.match(/\/o\/([^/]+)$/);

    const rawPath =
      firebaseStorageMatch?.[1] ||
      cleanUrl.split("/").pop() ||
      "";

    const decodedPath = decodeURIComponent(rawPath);
    const fileName = decodedPath.split("/").pop();

    return fileName || fallback;
  } catch {
    return fallback;
  }
}

function getReceiptFiles(
  paymentDetails: any
): ReceiptFileItem[] {
  const files: ReceiptFileItem[] = [];

  const pushFile = (
    value: any,
    fallbackName?: string
  ) => {
    if (!value) return;

    if (typeof value === "string") {
      const url = value.trim();

      if (!url) return;

      files.push({
        url,
        name:
          fallbackName ||
          getFileNameFromUrl(
            url,
            `Receipt ${files.length + 1}`
          ),
      });

      return;
    }

    if (typeof value === "object") {
      const url = String(
        value.url ||
          value.downloadURL ||
          value.downloadUrl ||
          value.fileUrl ||
          value.fileURL ||
          value.receiptUrl ||
          value.bankReceiptUrl ||
          ""
      ).trim();

      if (!url) return;

      files.push({
        url,
        name:
          value.name ||
          value.fileName ||
          value.filename ||
          value.originalName ||
          fallbackName ||
          getFileNameFromUrl(
            url,
            `Receipt ${files.length + 1}`
          ),
      });
    }
  };

  [
    paymentDetails?.bankReceiptUrls,
    paymentDetails?.receiptUrls,
    paymentDetails?.receipts,
    paymentDetails?.receiptFiles,
    paymentDetails?.uploadedFiles,
    paymentDetails?.files,
  ].forEach((collection) => {
    if (Array.isArray(collection)) {
      collection.forEach((file, index) => {
        pushFile(file, `Receipt ${index + 1}`);
      });
    }
  });

  pushFile(
    paymentDetails?.bankReceiptUrl,
    "Receipt 1"
  );

  pushFile(
    paymentDetails?.receiptUrl,
    "Receipt 1"
  );

  const uniqueFiles = new Map<
    string,
    ReceiptFileItem
  >();

  files.forEach((file, index) => {
    if (!file.url || uniqueFiles.has(file.url)) return;

    uniqueFiles.set(file.url, {
      url: file.url,
      name:
        file.name ||
        `Receipt ${index + 1}`,
    });
  });

  return Array.from(uniqueFiles.values());
}

interface BudgetDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceRequest | null;
  onSubmitExpense?: (
    request: InvoiceRequest
  ) => void;
}

export default function BudgetDetailsModal({
  isOpen,
  onClose,
  invoice,
  onSubmitExpense,
}: BudgetDetailsModalProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const isMainAdmin =
    userProfile?.role === "main_admin";

  const [liveInvoice, setLiveInvoice] =
    useState<InvoiceRequest | null>(invoice);

  const [lineItems, setLineItems] =
    useState<any[]>(getInvoiceItems(invoice));

  const [
    itemRejectDialogOpen,
    setItemRejectDialogOpen,
  ] = useState(false);

  const [
    pendingRejectIndex,
    setPendingRejectIndex,
  ] = useState<number | null>(null);

  const [
    itemRejectionComment,
    setItemRejectionComment,
  ] = useState("");

  const [
    itemActionLoading,
    setItemActionLoading,
  ] = useState(false);

  const [
    requestRejectDialogOpen,
    setRequestRejectDialogOpen,
  ] = useState(false);

  const [
    requestRejectionComment,
    setRequestRejectionComment,
  ] = useState("");

  const [
    requestActionLoading,
    setRequestActionLoading,
  ] = useState(false);

  useEffect(() => {
    setLiveInvoice(invoice);
    setLineItems(getInvoiceItems(invoice));
  }, [invoice]);

  useEffect(() => {
    if (!invoice?.id || !isOpen) return;

    const ref = doc(
      db,
      "Panels",
      "IEDGE-SYSTEM",
      "invoiceRequests",
      invoice.id
    );

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const freshInvoice = {
          id: snap.id,
          ...snap.data(),
        } as InvoiceRequest;

        setLiveInvoice(freshInvoice);
        setLineItems(
          getInvoiceItems(freshInvoice)
        );
      }
    });

    return () => unsub();
  }, [invoice?.id, isOpen]);

  if (!liveInvoice) return null;

  const activeInvoice = liveInvoice;

  const invoiceType =
    (activeInvoice as any).invoiceType ||
    (activeInvoice.clientName
      ? "project"
      : "general");

  function getStatusBadgeColor(
    status: string
  ): string {
    switch (status) {
      case "approved":
      case "payment_released":
        return "border-green-200 bg-green-50 text-green-700";

      case "rejected":
        return "border-red-200 bg-red-50 text-red-700";

      case "pending_operational_admin":
      case "pending_main_admin":
      case "pending_finance":
        return "border-amber-200 bg-amber-50 text-amber-700";

      default:
        return "border-blue-200 bg-blue-50 text-blue-700";
    }
  }

  function getItemStatusBadgeColor(
    status: string
  ): string {
    switch (status) {
      case "approved":
        return "border-green-200 bg-green-50 text-green-700";

      case "rejected":
        return "border-red-200 bg-red-50 text-red-700";

      default:
        return "border-amber-200 bg-amber-50 text-amber-700";
    }
  }

  function canApproveRequest(
    request: InvoiceRequest
  ): boolean {
    if (!userProfile) return false;

    switch (userProfile.role) {
      case "operational_admin":
        return (
          request.status ===
          "pending_operational_admin"
        );

      case "main_admin":
        return (
          request.status ===
          "pending_main_admin"
        );

      case "finance":
      case "financial_admin":
        return (
          request.status === "pending_finance"
        );

      default:
        return false;
    }
  }

  async function handleApproveRequest() {
    if (!activeInvoice?.id || !userProfile)
      return;

    try {
      setRequestActionLoading(true);

      let newStatus = activeInvoice.status;
      let currentApprover = "";

      switch (userProfile.role) {
        case "operational_admin":
          if (
            activeInvoice.status ===
            "pending_operational_admin"
          ) {
            newStatus =
              "pending_main_admin" as any;
          }
          break;

        case "main_admin":
          if (
            activeInvoice.status ===
            "pending_main_admin"
          ) {
            newStatus =
              "pending_finance" as any;
          }
          break;

        case "finance":
        case "financial_admin":
          if (
            activeInvoice.status ===
            "pending_finance"
          ) {
            newStatus = "approved" as any;
          }
          break;
      }

      if (newStatus === activeInvoice.status) {
        toast({
          title: "Action not available",
          description:
            "This request is not pending your approval step.",
          variant: "destructive",
        });

        return;
      }

      await updateDoc(
        doc(
          db,
          "Panels",
          "IEDGE-SYSTEM",
          "invoiceRequests",
          activeInvoice.id
        ),
        {
          status: newStatus,
          currentApprover,
          approvalHistory: [
            ...((activeInvoice as any)
              .approvalHistory || []),
            {
              approver:
                userProfile.displayName,
              action: "approved",
              timestamp: new Date(),
              notes: "",
            },
          ],
          updatedAt: serverTimestamp(),
        }
      );

      setLiveInvoice({
        ...activeInvoice,
        status: newStatus,
      } as InvoiceRequest);

      toast({
        title: "Request approved",
        description:
          "The request status has been updated successfully.",
      });
    } catch (error: any) {
      console.error(
        "Failed to approve request:",
        error
      );

      toast({
        title: "Error",
        description:
          error.message ||
          "Failed to approve request",
        variant: "destructive",
      });
    } finally {
      setRequestActionLoading(false);
    }
  }

  async function handleRejectRequest() {
    if (!activeInvoice?.id || !userProfile)
      return;

    const reason =
      requestRejectionComment.trim();

    if (!reason) {
      toast({
        title:
          "Rejection comment required",
        description:
          "Please enter the reason for rejecting this request.",
        variant: "destructive",
      });

      return;
    }

    try {
      setRequestActionLoading(true);

      await updateDoc(
        doc(
          db,
          "Panels",
          "IEDGE-SYSTEM",
          "invoiceRequests",
          activeInvoice.id
        ),
        {
          status:
            "pending_operational_admin",
          approvalHistory: [
            ...((activeInvoice as any)
              .approvalHistory || []),
            {
              approver:
                userProfile.displayName,
              action: "rejected",
              timestamp: new Date(),
              notes: reason,
            },
          ],
          updatedAt: serverTimestamp(),
        }
      );

      setLiveInvoice({
        ...activeInvoice,
        status:
          "pending_operational_admin" as any,
      } as InvoiceRequest);

      toast({
        title: "Request rejected",
        description:
          "The request has been sent back with your comment.",
      });

      setRequestRejectDialogOpen(false);
      setRequestRejectionComment("");
    } catch (error: any) {
      console.error(
        "Failed to reject request:",
        error
      );

      toast({
        title: "Error",
        description:
          error.message ||
          "Failed to reject request",
        variant: "destructive",
      });
    } finally {
      setRequestActionLoading(false);
    }
  }

  async function updateLineItemStatus(
    index: number,
    status: "approved" | "rejected",
    rejectReason = ""
  ) {
    if (!activeInvoice?.id || !userProfile)
      return;

    try {
      setItemActionLoading(true);

      const updatedItems = lineItems.map(
        (item: any) => ({ ...item })
      );

      const now = new Date();

      const actorName =
        userProfile.displayName ||
        "Main Admin";

      const currentItem =
        updatedItems[index] || {};

      updatedItems[index] = {
        ...currentItem,
        status,
        reviewedBy: actorName,
        reviewedAt: now,

        ...(status === "approved"
          ? {
              approvedBy: actorName,
              approvedAt: now,
              rejectionComment: "",
            }
          : {
              rejectedBy: actorName,
              rejectedAt: now,
              rejectionComment:
                rejectReason.trim(),
            }),
      };

      await updateDoc(
        doc(
          db,
          "Panels",
          "IEDGE-SYSTEM",
          "invoiceRequests",
          activeInvoice.id
        ),
        {
          items: updatedItems,
          lineItems: updatedItems,
          updatedAt: serverTimestamp(),
        }
      );

      setLineItems(updatedItems);

      toast({
        title:
          status === "approved"
            ? "Item approved"
            : "Item rejected",
      });
    } catch (error) {
      console.error(
        "Failed to update line item status:",
        error
      );

      toast({
        title: "Error",
        description:
          "Failed to update item status",
        variant: "destructive",
      });
    } finally {
      setItemActionLoading(false);
    }
  }

  function openItemRejectDialog(
    index: number
  ) {
    setPendingRejectIndex(index);
    setItemRejectionComment("");
    setItemRejectDialogOpen(true);
  }

  async function handleItemRejectConfirm() {
    if (pendingRejectIndex === null)
      return;

    const reason =
      itemRejectionComment.trim();

    if (!reason) {
      toast({
        title:
          "Rejection comment required",
        description:
          "Please enter the reason for rejecting this item.",
        variant: "destructive",
      });

      return;
    }

    await updateLineItemStatus(
      pendingRejectIndex,
      "rejected",
      reason
    );

    setItemRejectDialogOpen(false);
    setPendingRejectIndex(null);
    setItemRejectionComment("");
  }

  const approvedTotal = lineItems
    .filter(
      (item: any) =>
        item.status === "approved"
    )
    .reduce(
      (sum: number, item: any) =>
        sum + getItemAmount(item),
      0
    );

  const rejectedTotal = lineItems
    .filter(
      (item: any) =>
        item.status === "rejected"
    )
    .reduce(
      (sum: number, item: any) =>
        sum + getItemAmount(item),
      0
    );

  const pendingTotal = lineItems
    .filter(
      (item: any) =>
        !item.status ||
        item.status === "pending"
    )
    .reduce(
      (sum: number, item: any) =>
        sum + getItemAmount(item),
      0
    );

  const totalBudget =
    activeInvoice.totalAmount || 0;

  const canShowRequestActions =
    canApproveRequest(activeInvoice);

  const paymentDetails =
    activeInvoice.paymentDetails as
      | {
          paymentMethod?: string;
          amount?: number;
          vendor?: string;
          vendors?: string[];
          transactionReference?: string;

          chequeNumber?: string;
          chequeNumbers?: string[];

          bankReceiptUrl?: string;
          bankReceiptUrls?: string[];
          receiptUrl?: string;
          receiptUrls?: string[];
          receipts?: any[];
          receiptFiles?: any[];
          uploadedFiles?: any[];
          files?: any[];

          paymentNotes?: string;
          releasedAt?: any;
          releasedByName?: string;

          selectedAccount?: {
            accountName?: string;
            accountNumber?: string;
            bankName?: string;
          };
        }
      | undefined;

  const vendorText = Array.isArray(
    paymentDetails?.vendors
  )
    ? paymentDetails?.vendors.join(", ")
    : paymentDetails?.vendor || "-";

  const chequeNumbers =
    getChequeNumbers(paymentDetails);

  const chequeNumbersText =
    chequeNumbers.length
      ? chequeNumbers.join(", ")
      : "-";

  const receiptFiles =
    getReceiptFiles(paymentDetails);

  const receiptUrls = receiptFiles.map(
    (file) => file.url
  );

  const displaySubject =
    (activeInvoice as any).subject ||
    (invoiceType === "project"
      ? (activeInvoice as any).title || "-"
      : "-");

  /*
   * ESTIMATE NUMBER
   *
   * This supports multiple possible Firebase
   * field names so that older/newer records
   * can still display the estimate number.
   */
  const estimateNumber =
    (activeInvoice as any).estimateNumber ||
    (activeInvoice as any).estimateNo ||
    (activeInvoice as any).estimateId ||
    "-";

  const canSubmitExpense =
    invoiceType === "project" &&
    !!onSubmitExpense &&
    ["approved", "payment_released"].includes(
      String(activeInvoice.status || "")
    );

  function getExportFileName(
    extension: "pdf" | "xlsx"
  ) {
    const requestId = String(
      activeInvoice.requestId ||
        "budget-detail"
    )
      .trim()
      .replace(
        /[^a-zA-Z0-9-_]+/g,
        "-"
      )
      .replace(/-+/g, "-");

    return `Budget-Detail-${
      requestId || "request"
    }.${extension}`;
  }

  function getLineItemExportRows() {
    return lineItems.map(
      (item: any, index: number) => {
        const status =
          item.status || "pending";

        return {
          "#": index + 1,
          Vendor: item.vendor || "-",
          Service: item.service || "-",
          Description:
            item.description || "-",
          "Requester Comment":
            item.comment || "-",
          Qty: item.units ?? 0,
          Rate: Number(
            item.unitRate ?? 0
          ),
          Amount: getItemAmount(item),
          Status:
            getReadableStatus(status),
          "Reviewed By":
            item.reviewedBy ||
            item.approvedBy ||
            item.rejectedBy ||
            "-",
          "Reviewed At": toDateString(
            item.reviewedAt ||
              item.approvedAt ||
              item.rejectedAt
          ),
          "Rejection Reason":
            item.rejectionComment || "-",
        };
      }
    );
  }

  function getSummaryExportRows() {
    const rows = [
      {
        Field: "Request ID",
        Value:
          activeInvoice.requestId || "-",
      },

      // Estimate Number added here
      {
        Field: "Estimate Number",
        Value: estimateNumber,
      },

      {
        Field: "Request Type",
        Value:
          getReadableStatus(invoiceType),
      },
      {
        Field: "Status",
        Value: getReadableStatus(
          activeInvoice.status
        ),
      },
      {
        Field: "Subject",
        Value: displaySubject || "-",
      },
      {
        Field: "Submitted Date",
        Value: toDateString(
          activeInvoice.submittedAt
        ),
      },
      {
        Field: "Total Budget",
        Value: `Rs ${formatPKR(
          totalBudget
        )}`,
      },
      {
        Field: "Approved Amount",
        Value: `Rs ${formatPKR(
          approvedTotal
        )}`,
      },
      {
        Field: "Rejected Amount",
        Value: `Rs ${formatPKR(
          rejectedTotal
        )}`,
      },
      {
        Field: "Pending Amount",
        Value: `Rs ${formatPKR(
          pendingTotal
        )}`,
      },
    ];

    if (invoiceType === "general") {
      rows.splice(4, 0, {
        Field: "Title",
        Value:
          (activeInvoice as any)
            .title || "-",
      });
    } else {
      rows.splice(
        4,
        0,
        {
          Field: "Client",
          Value:
            activeInvoice.clientName ||
            "-",
        },
        {
          Field: "Project",
          Value:
            activeInvoice.project || "-",
        },
        {
          Field: "Project Code",
          Value:
            (activeInvoice as any)
              .projectCode || "-",
        }
      );
    }

    const message =
      (activeInvoice as any).message ||
      (activeInvoice as any).comment;

    if (message) {
      rows.push({
        Field: "Message",
        Value: message,
      });
    }

    return rows;
  }

  function getPaymentExportRows() {
    if (!paymentDetails) return [];

    const rows = [
      {
        Field: "Payment Method",
        Value:
          paymentDetails.paymentMethod ||
          "-",
      },
      {
        Field: "Amount Paid",
        Value: `Rs ${formatPKR(
          paymentDetails.amount
        )}`,
      },
      {
        Field: "Vendor(s)",
        Value: vendorText,
      },
      {
        Field: "Transaction Ref",
        Value:
          paymentDetails.transactionReference ||
          "-",
      },
      {
        Field: "Cheque Numbers",
        Value: chequeNumbersText,
      },
      {
        Field: "Released By",
        Value:
          paymentDetails.releasedByName ||
          "-",
      },
      {
        Field: "Released At",
        Value: toDateString(
          paymentDetails.releasedAt
        ),
      },
      {
        Field: "Bank Receipt",
        Value: receiptUrls.length
          ? receiptUrls.join(", ")
          : "-",
      },
      {
        Field: "Notes",
        Value:
          paymentDetails.paymentNotes ||
          "-",
      },
    ];

    if (paymentDetails.selectedAccount) {
      rows.push(
        {
          Field: "Account Name",
          Value:
            paymentDetails
              .selectedAccount
              .accountName || "-",
        },
        {
          Field: "Account Number",
          Value:
            paymentDetails
              .selectedAccount
              .accountNumber || "-",
        },
        {
          Field: "Bank Name",
          Value:
            paymentDetails
              .selectedAccount
              .bankName || "-",
        }
      );
    }

    return rows;
  }

  function handleExportPDF() {
    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });

      const pageWidth =
        pdf.internal.pageSize.getWidth();

      const generatedAt =
        new Date().toLocaleString();

      pdf.setFontSize(18);
      pdf.text(
        "Budget Detail",
        40,
        40
      );

      pdf.setFontSize(10);

      pdf.text(
        `Request ID: ${
          activeInvoice.requestId || "-"
        }`,
        40,
        58
      );

      pdf.text(
        `Generated: ${generatedAt}`,
        pageWidth - 40,
        58,
        {
          align: "right",
        }
      );

      autoTable(pdf, {
        startY: 82,
        head: [["Field", "Value"]],
        body: getSummaryExportRows().map(
          (row) => [
            row.Field,
            row.Value,
          ]
        ),
        theme: "grid",
        styles: {
          fontSize: 9,
          cellPadding: 5,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [15, 23, 42],
        },
        columnStyles: {
          0: {
            cellWidth: 150,
            fontStyle: "bold",
          },
          1: {
            cellWidth: "auto",
          },
        },
      });

      autoTable(pdf, {
        startY:
          (pdf as any).lastAutoTable
            .finalY + 24,
        head: [
          [
            "#",
            "Vendor",
            "Service",
            "Description",
            "Comment",
            "Qty",
            "Rate",
            "Amount",
            "Status",
            "Rejection Reason",
          ],
        ],
        body: getLineItemExportRows().map(
          (row) => [
            row["#"],
            row.Vendor,
            row.Service,
            row.Description,
            row["Requester Comment"],
            row.Qty,
            `Rs ${formatPKR(
              row.Rate
            )}`,
            `Rs ${formatPKR(
              row.Amount
            )}`,
            row.Status,
            row["Rejection Reason"],
          ]
        ),
        theme: "striped",
        styles: {
          fontSize: 8,
          cellPadding: 4,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [15, 23, 42],
        },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 82 },
          2: { cellWidth: 82 },
          3: { cellWidth: 145 },
          4: { cellWidth: 120 },
          5: {
            cellWidth: 40,
            halign: "right",
          },
          6: {
            cellWidth: 72,
            halign: "right",
          },
          7: {
            cellWidth: 78,
            halign: "right",
          },
          8: { cellWidth: 72 },
          9: { cellWidth: 120 },
        },
      });

      const paymentRows =
        getPaymentExportRows();

      if (paymentRows.length) {
        autoTable(pdf, {
          startY:
            (pdf as any).lastAutoTable
              .finalY + 24,
          head: [
            ["Payment Field", "Value"],
          ],
          body: paymentRows.map((row) => [
            row.Field,
            row.Value,
          ]),
          theme: "grid",
          styles: {
            fontSize: 9,
            cellPadding: 5,
            overflow: "linebreak",
          },
          headStyles: {
            fillColor: [15, 23, 42],
          },
          columnStyles: {
            0: {
              cellWidth: 150,
              fontStyle: "bold",
            },
          },
        });
      }

      pdf.save(
        getExportFileName("pdf")
      );

      toast({
        title: "PDF exported",
        description:
          "Budget detail PDF has been downloaded.",
      });
    } catch (error) {
      console.error(
        "Failed to export PDF:",
        error
      );

      toast({
        title: "Export failed",
        description:
          "Failed to export Budget Detail PDF.",
        variant: "destructive",
      });
    }
  }

  function handleExportExcel() {
    try {
      const workbook =
        XLSX.utils.book_new();

      const summarySheet =
        XLSX.utils.json_to_sheet(
          getSummaryExportRows()
        );

      XLSX.utils.book_append_sheet(
        workbook,
        summarySheet,
        "Summary"
      );

      const lineItemsSheet =
        XLSX.utils.json_to_sheet(
          getLineItemExportRows()
        );

      XLSX.utils.book_append_sheet(
        workbook,
        lineItemsSheet,
        "Line Items"
      );

      const paymentRows =
        getPaymentExportRows();

      if (paymentRows.length) {
        const paymentSheet =
          XLSX.utils.json_to_sheet(
            paymentRows
          );

        XLSX.utils.book_append_sheet(
          workbook,
          paymentSheet,
          "Payment Details"
        );
      }

      XLSX.writeFile(
        workbook,
        getExportFileName("xlsx")
      );

      toast({
        title: "Excel exported",
        description:
          "Budget detail Excel file has been downloaded.",
      });
    } catch (error) {
      console.error(
        "Failed to export Excel:",
        error
      );

      toast({
        title: "Export failed",
        description:
          "Failed to export Budget Detail Excel file.",
        variant: "destructive",
      });
    }
  }

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (open) return;
        }}
      >
        <DialogContent
          onPointerDownOutside={(event) =>
            event.preventDefault()
          }
          onInteractOutside={(event) =>
            event.preventDefault()
          }
          onEscapeKeyDown={(event) =>
            event.preventDefault()
          }
          className="!left-0 !top-0 flex !h-screen !max-h-screen !w-screen !max-w-none !translate-x-0 !translate-y-0 flex-col overflow-hidden rounded-none border-0 bg-slate-50 p-0 shadow-2xl [&>button:last-child]:hidden"
        >
          <div className="shrink-0 border-b bg-white/95 px-6 py-5 backdrop-blur">
            <DialogHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <DialogTitle className="text-2xl font-bold tracking-tight text-slate-950">
                    Budget Detail
                  </DialogTitle>

                  <DialogDescription className="mt-1 text-sm text-slate-500">
                    Request Form Details –{" "}
                    {activeInvoice.requestId}
                  </DialogDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeColor(
                      activeInvoice.status
                    )}`}
                  >
                    {getReadableStatus(
                      activeInvoice.status
                    )}
                  </Badge>

                  {canSubmitExpense && (
                    <Button
                      size="sm"
                      className="rounded-full bg-slate-950 px-4 text-white shadow-sm hover:bg-slate-800"
                      onClick={() =>
                        onSubmitExpense?.(
                          activeInvoice
                        )
                      }
                    >
                      <ReceiptText className="mr-1 h-4 w-4" />
                      Submit Expense
                    </Button>
                  )}

                  {canShowRequestActions && (
                    <>
                      <Button
                        size="sm"
                        className="rounded-full bg-green-600 px-4 text-white shadow-sm hover:bg-green-700"
                        disabled={
                          requestActionLoading
                        }
                        onClick={
                          handleApproveRequest
                        }
                      >
                        <Check className="mr-1 h-4 w-4" />

                        {requestActionLoading
                          ? "Approving..."
                          : "Approve Request"}
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        className="rounded-full px-4 shadow-sm"
                        disabled={
                          requestActionLoading
                        }
                        onClick={() => {
                          setRequestRejectionComment(
                            ""
                          );

                          setRequestRejectDialogOpen(
                            true
                          );
                        }}
                      >
                        <X className="mr-1 h-4 w-4" />
                        Reject Request
                      </Button>
                    </>
                  )}

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    aria-label="Close Budget Detail"
                    className="rounded-full px-4 shadow-sm"
                    onClick={onClose}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Close
                  </Button>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            {/* SUMMARY CARDS */}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Total Budget
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-950">
                  Rs{" "}
                  {formatPKR(totalBudget)}
                </p>
              </div>

              <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-green-600">
                  Approved Amount
                </p>

                <p className="mt-2 text-2xl font-bold text-green-700">
                  Rs{" "}
                  {formatPKR(
                    approvedTotal
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-red-600">
                  Rejected Amount
                </p>

                <p className="mt-2 text-2xl font-bold text-red-700">
                  Rs{" "}
                  {formatPKR(
                    rejectedTotal
                  )}
                </p>
              </div>
            </div>

            {/* REQUEST INFORMATION */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-950">
                  Request Information
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* REQUEST ID */}

                <div className="rounded-xl bg-slate-50 p-4">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Request ID
                  </span>

                  <p className="mt-1 font-semibold text-slate-950">
                    {activeInvoice.requestId}
                  </p>
                </div>

                {/* ESTIMATE NUMBER */}

                <div className="rounded-xl bg-slate-50 p-4">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Estimate Number
                  </span>

                  <p className="mt-1 font-semibold text-slate-950">
                    {estimateNumber}
                  </p>
                </div>

                {/* STATUS */}

                <div className="rounded-xl bg-slate-50 p-4">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Status
                  </span>

                  <div className="mt-2">
                    <Badge
                      className={`rounded-full border px-3 py-1 ${getStatusBadgeColor(
                        activeInvoice.status
                      )}`}
                    >
                      {getReadableStatus(
                        activeInvoice.status
                      )}
                    </Badge>
                  </div>
                </div>

                {invoiceType ===
                "general" ? (
                  <div className="rounded-xl bg-slate-50 p-4">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Title
                    </span>

                    <p className="mt-1 font-semibold text-slate-950">
                      {(activeInvoice as any)
                        .title || "-"}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl bg-slate-50 p-4">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Client
                      </span>

                      <p className="mt-1 font-semibold text-slate-950">
                        {activeInvoice.clientName ||
                          "-"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Project
                      </span>

                      <p className="mt-1 font-semibold text-slate-950">
                        {activeInvoice.project ||
                          "-"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Project Code
                      </span>

                      <p className="mt-1 font-semibold text-slate-950">
                        {(activeInvoice as any)
                          .projectCode || "-"}
                      </p>
                    </div>
                  </>
                )}

                <div className="rounded-xl bg-slate-50 p-4 md:col-span-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Subject
                  </span>

                  <p className="mt-1 whitespace-pre-wrap break-words font-semibold text-slate-950">
                    {displaySubject}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Submitted Date
                  </span>

                  <p className="mt-1 text-slate-800">
                    {toDateString(
                      activeInvoice.submittedAt
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* MESSAGE */}

            {((activeInvoice as any)
              .message ||
              (activeInvoice as any)
                .comment) && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-base font-semibold text-slate-950">
                  Message
                </h3>

                <div className="min-h-[100px] whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {(activeInvoice as any)
                    .message ||
                    (activeInvoice as any)
                      .comment ||
                    "-"}
                </div>
              </div>
            )}

            {/* ITEM APPROVAL */}

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">
                    Item Approval
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Approve or reject
                    individual budget items.
                    Request-level approve/reject
                    is also available here.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {canSubmitExpense && (
                    <Button
                      size="sm"
                      className="rounded-full bg-slate-950 px-4 text-white hover:bg-slate-800"
                      onClick={() =>
                        onSubmitExpense?.(
                          activeInvoice
                        )
                      }
                    >
                      <ReceiptText className="mr-1 h-4 w-4" />
                      Submit Expense
                    </Button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">
                        Vendor
                      </th>

                      <th className="px-4 py-3 text-left font-semibold">
                        Service
                      </th>

                      <th className="px-4 py-3 text-left font-semibold">
                        Description
                      </th>

                      <th className="min-w-[220px] px-4 py-3 text-left font-semibold">
                        Requester Comment
                      </th>

                      <th className="px-4 py-3 text-right font-semibold">
                        Qty
                      </th>

                      <th className="px-4 py-3 text-right font-semibold">
                        Rate
                      </th>

                      <th className="px-4 py-3 text-right font-semibold">
                        Amount
                      </th>

                      <th className="min-w-[180px] px-4 py-3 text-center font-semibold">
                        Item Action
                      </th>

                      <th className="min-w-[240px] px-4 py-3 text-left font-semibold">
                        Rejection Reason
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {lineItems.length ===
                    0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-4 py-10 text-center text-slate-500"
                        >
                          No line items
                          found.
                        </td>
                      </tr>
                    ) : (
                      lineItems.map(
                        (
                          item,
                          index
                        ) => {
                          const qty =
                            item.units ??
                            0;

                          const rate =
                            item.unitRate ??
                            0;

                          const amount =
                            getItemAmount(
                              item
                            );

                          const status =
                            item.status ||
                            "pending";

                          return (
                            <tr
                              key={
                                item.id ||
                                index
                              }
                              className="align-top transition hover:bg-slate-50/80"
                            >
                              <td className="px-4 py-4 font-medium text-slate-950">
                                {item.vendor ||
                                  "-"}
                              </td>

                              <td className="px-4 py-4 text-slate-700">
                                {item.service ||
                                  "-"}
                              </td>

                              <td className="whitespace-pre-wrap break-words px-4 py-4 text-slate-700">
                                {item.description ||
                                  "-"}
                              </td>

                              <td className="whitespace-pre-wrap break-words px-4 py-4 text-slate-700">
                                {item.comment ||
                                  "-"}
                              </td>

                              <td className="px-4 py-4 text-right text-slate-700">
                                {qty}
                              </td>

                              <td className="px-4 py-4 text-right text-slate-700">
                                Rs{" "}
                                {formatPKR(
                                  rate
                                )}
                              </td>

                              <td className="px-4 py-4 text-right font-semibold text-slate-950">
                                Rs{" "}
                                {formatPKR(
                                  amount
                                )}
                              </td>

                              <td className="px-4 py-4 text-center">
                                {isMainAdmin &&
                                status ===
                                  "pending" ? (
                                  <div className="flex flex-wrap justify-center gap-2">
                                    <Button
                                      size="sm"
                                      className="rounded-full bg-green-600 px-3 text-white hover:bg-green-700"
                                      disabled={
                                        itemActionLoading
                                      }
                                      onClick={() =>
                                        updateLineItemStatus(
                                          index,
                                          "approved"
                                        )
                                      }
                                    >
                                      <Check className="mr-1 h-4 w-4" />
                                      Approve
                                    </Button>

                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="rounded-full px-3"
                                      disabled={
                                        itemActionLoading
                                      }
                                      onClick={() =>
                                        openItemRejectDialog(
                                          index
                                        )
                                      }
                                    >
                                      <X className="mr-1 h-4 w-4" />
                                      Reject
                                    </Button>
                                  </div>
                                ) : (
                                  <Badge
                                    className={`rounded-full border px-3 py-1 ${getItemStatusBadgeColor(
                                      status
                                    )}`}
                                  >
                                    {getReadableStatus(
                                      status
                                    )}
                                  </Badge>
                                )}
                              </td>

                              <td className="whitespace-pre-wrap break-words px-4 py-4 text-sm">
                                {item.rejectionComment ? (
                                  <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-red-700">
                                    {
                                      item.rejectionComment
                                    }
                                  </div>
                                ) : (
                                  <span className="text-slate-400">
                                    -
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        }
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 gap-3 border-t border-slate-200 bg-slate-50 p-5 md:grid-cols-4">
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Total Budget
                  </span>

                  <p className="mt-1 font-bold text-slate-950">
                    Rs{" "}
                    {formatPKR(
                      totalBudget
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <span className="text-xs font-medium uppercase tracking-wide text-green-600">
                    Approved
                  </span>

                  <p className="mt-1 font-bold text-green-700">
                    Rs{" "}
                    {formatPKR(
                      approvedTotal
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <span className="text-xs font-medium uppercase tracking-wide text-red-600">
                    Rejected
                  </span>

                  <p className="mt-1 font-bold text-red-700">
                    Rs{" "}
                    {formatPKR(
                      rejectedTotal
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <span className="text-xs font-medium uppercase tracking-wide text-amber-600">
                    Pending
                  </span>

                  <p className="mt-1 font-bold text-amber-700">
                    Rs{" "}
                    {formatPKR(
                      pendingTotal
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* PAYMENT DETAILS */}

            {paymentDetails && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-slate-950">
                  Payment Details
                </h3>

                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Payment Method
                    </span>

                    <p className="mt-1 font-medium text-slate-950">
                      {paymentDetails.paymentMethod ||
                        "-"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Amount Paid
                    </span>

                    <p className="mt-1 font-semibold text-slate-950">
                      Rs{" "}
                      {formatPKR(
                        paymentDetails.amount
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Vendor(s)
                    </span>

                    <p className="mt-1 text-slate-800">
                      {vendorText}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Transaction Ref
                    </span>

                    <p className="mt-1 text-slate-800">
                      {paymentDetails.transactionReference ||
                        "-"}
                    </p>
                  </div>

                  {chequeNumbers.length >
                    0 && (
                    <div className="rounded-xl bg-slate-50 p-4 md:col-span-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Cheque Number
                        {chequeNumbers.length >
                        1
                          ? "s"
                          : ""}
                      </span>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {chequeNumbers.map(
                          (
                            chequeNumber,
                            index
                          ) => (
                            <span
                              key={`${chequeNumber}-${index}`}
                              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                            >
                              {
                                chequeNumber
                              }
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {paymentDetails.releasedByName && (
                    <div className="rounded-xl bg-slate-50 p-4">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Released By
                      </span>

                      <p className="mt-1 text-slate-800">
                        {
                          paymentDetails.releasedByName
                        }
                      </p>
                    </div>
                  )}

                  <div className="rounded-xl bg-slate-50 p-4">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Released At
                    </span>

                    <p className="mt-1 text-slate-800">
                      {toDateString(
                        paymentDetails.releasedAt
                      )}
                    </p>
                  </div>

                  {paymentDetails.selectedAccount && (
                    <div className="rounded-xl bg-slate-50 p-4">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Selected Account
                      </span>

                      <p className="mt-1 text-slate-800">
                        {paymentDetails
                          .selectedAccount
                          .accountName ||
                          "-"}

                        {paymentDetails
                          .selectedAccount
                          .accountNumber
                          ? ` (${paymentDetails.selectedAccount.accountNumber})`
                          : ""}
                      </p>
                    </div>
                  )}

                  {paymentDetails.paymentNotes && (
                    <div className="rounded-xl bg-slate-50 p-4 md:col-span-2 lg:col-span-3">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Notes
                      </span>

                      <p className="mt-1 whitespace-pre-wrap break-words text-slate-800">
                        {
                          paymentDetails.paymentNotes
                        }
                      </p>
                    </div>
                  )}

                  {receiptFiles.length >
                    0 && (
                    <div className="md:col-span-2 lg:col-span-3">
                      <span className="mb-3 block text-xs font-medium uppercase tracking-wide text-slate-500">
                        Bank Receipt
                        {receiptFiles.length >
                        1
                          ? "s"
                          : ""}
                      </span>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {receiptFiles.map(
                          (
                            file,
                            index
                          ) => (
                            <a
                              key={`${file.url}-${index}`}
                              href={
                                file.url
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="group flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm transition hover:border-blue-200 hover:bg-blue-100"
                            >
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
                                <FileText className="h-5 w-5" />
                              </span>

                              <span className="min-w-0">
                                <span className="block truncate font-semibold text-blue-900">
                                  {file.name ||
                                    `Receipt ${
                                      index +
                                      1
                                    }`}
                                </span>

                                <span className="mt-0.5 block text-xs font-medium text-blue-700">
                                  Open
                                  uploaded
                                  file{" "}
                                  {receiptFiles.length >
                                  1
                                    ? index +
                                      1
                                    : ""}
                                </span>
                              </span>
                            </a>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}

          <div className="shrink-0 flex flex-wrap justify-end gap-2 border-t bg-white/95 px-6 py-4 backdrop-blur">
            <Button
              type="button"
              variant="outline"
              className="rounded-full px-5"
              onClick={handleExportPDF}
            >
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>

            <Button
              type="button"
              variant="outline"
              className="rounded-full px-5"
              onClick={handleExportExcel}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export Excel
            </Button>

            <Button
              variant="outline"
              className="rounded-full px-5"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ITEM REJECTION DIALOG */}

      <Dialog
        open={itemRejectDialogOpen}
        onOpenChange={(open) => {
          setItemRejectDialogOpen(open);

          if (!open) {
            setPendingRejectIndex(null);
            setItemRejectionComment("");
          }
        }}
      >
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              Reject Line Item
            </DialogTitle>

            <DialogDescription>
              Please enter the reason for
              rejecting this item. This
              comment will be visible to the
              requester.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Textarea
              value={
                itemRejectionComment
              }
              onChange={(e) =>
                setItemRejectionComment(
                  e.target.value
                )
              }
              placeholder="Enter rejection reason"
              rows={5}
              className="rounded-xl"
            />
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setItemRejectDialogOpen(
                  false
                );

                setPendingRejectIndex(
                  null
                );

                setItemRejectionComment(
                  ""
                );
              }}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              className="rounded-full"
              disabled={
                !itemRejectionComment.trim() ||
                itemActionLoading
              }
              onClick={
                handleItemRejectConfirm
              }
            >
              {itemActionLoading
                ? "Rejecting..."
                : "Confirm Reject"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* REQUEST REJECTION DIALOG */}

      <Dialog
        open={requestRejectDialogOpen}
        onOpenChange={(open) => {
          setRequestRejectDialogOpen(open);

          if (!open) {
            setRequestRejectionComment(
              ""
            );
          }
        }}
      >
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              Reject Request
            </DialogTitle>

            <DialogDescription>
              Please enter the reason for
              rejecting this request. It will
              be saved in the approval history
              and sent back to Operational
              Admin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Textarea
              value={
                requestRejectionComment
              }
              onChange={(e) =>
                setRequestRejectionComment(
                  e.target.value
                )
              }
              placeholder="Enter request rejection reason"
              rows={5}
              className="rounded-xl"
            />
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setRequestRejectDialogOpen(
                  false
                );

                setRequestRejectionComment(
                  ""
                );
              }}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              className="rounded-full"
              disabled={
                !requestRejectionComment.trim() ||
                requestActionLoading
              }
              onClick={
                handleRejectRequest
              }
            >
              {requestActionLoading
                ? "Rejecting..."
                : "Confirm Reject"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}