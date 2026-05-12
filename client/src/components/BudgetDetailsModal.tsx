
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
// import { Check, X } from "lucide-react";
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

// interface InvoiceDetailsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   invoice: InvoiceRequest | null;
// }

// export default function InvoiceDetailsModal({
//   isOpen,
//   onClose,
//   invoice,
// }: InvoiceDetailsModalProps) {
//   const { userProfile } = useAuth();
//   const { toast } = useToast();
//   const isMainAdmin = userProfile?.role === "main_admin";

//   const [liveInvoice, setLiveInvoice] = useState<InvoiceRequest | null>(invoice);
//   const [lineItems, setLineItems] = useState<any[]>(invoice?.lineItems || []);
//   const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
//   const [pendingRejectIndex, setPendingRejectIndex] = useState<number | null>(null);
//   const [rejectionComment, setRejectionComment] = useState("");
//   const [itemActionLoading, setItemActionLoading] = useState(false);

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
//         return "bg-green-100 text-green-800";
//       case "rejected":
//         return "bg-red-100 text-red-800";
//       case "pending_operational_admin":
//       case "pending_main_admin":
//       case "pending_finance":
//         return "bg-yellow-100 text-yellow-800";
//       default:
//         return "bg-blue-100 text-blue-800";
//     }
//   }

//   function getItemStatusBadgeColor(status: string): string {
//     switch (status) {
//       case "approved":
//         return "bg-green-100 text-green-800";
//       case "rejected":
//         return "bg-red-100 text-red-800";
//       default:
//         return "bg-yellow-100 text-yellow-800";
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

//       const updatedItems = lineItems.map((item) => ({ ...item }));
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

//   function openRejectDialog(index: number) {
//     setPendingRejectIndex(index);
//     setRejectionComment("");
//     setRejectDialogOpen(true);
//   }

//   async function handleRejectConfirm() {
//     if (pendingRejectIndex === null) return;

//     const reason = rejectionComment.trim();
//     if (!reason) {
//       toast({
//         title: "Rejection comment required",
//         description: "Please enter the reason for rejecting this item.",
//         variant: "destructive",
//       });
//       return;
//     }

//     await updateLineItemStatus(pendingRejectIndex, "rejected", reason);
//     setRejectDialogOpen(false);
//     setPendingRejectIndex(null);
//     setRejectionComment("");
//   }

//   const approvedTotal = lineItems
//     .filter((item) => item.status === "approved")
//     .reduce((sum, item) => sum + getItemAmount(item), 0);

//   const rejectedTotal = lineItems
//     .filter((item) => item.status === "rejected")
//     .reduce((sum, item) => sum + getItemAmount(item), 0);

//   const totalBudget = liveInvoice.totalAmount || 0;

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

//   return (
//     <>
//       <Dialog open={isOpen} onOpenChange={onClose}>
//         <DialogContent className="max-w-[95vw] md:max-w-7xl max-h-[90vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>
//               Request Form Details – {liveInvoice.requestId}
//             </DialogTitle>
//             <DialogDescription>
//               View detailed information about this payment request
//             </DialogDescription>
//           </DialogHeader>

//           <div className="space-y-6">
//             <div className="bg-muted p-4 rounded-lg">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <span className="text-sm text-muted-foreground">Request ID</span>
//                   <p className="font-semibold">{liveInvoice.requestId}</p>
//                 </div>

//                 <div>
//                   <span className="text-sm text-muted-foreground">Status</span>
//                   <div className="mt-1">
//                     <Badge className={getStatusBadgeColor(liveInvoice.status)}>
//                       {liveInvoice.status.replace(/_/g, " ")}
//                     </Badge>
//                   </div>
//                 </div>

//                 {invoiceType === "general" ? (
//                   <div>
//                     <span className="text-sm text-muted-foreground">Title</span>
//                     <p className="font-semibold">{(liveInvoice as any).title || "-"}</p>
//                   </div>
//                 ) : (
//                   <>
//                     <div>
//                       <span className="text-sm text-muted-foreground">Client</span>
//                       <p className="font-semibold">{liveInvoice.clientName || "-"}</p>
//                     </div>

//                     <div>
//                       <span className="text-sm text-muted-foreground">Project</span>
//                       <p className="font-semibold">{liveInvoice.project || "-"}</p>
//                     </div>

//                     <div>
//                       <span className="text-sm text-muted-foreground">Project Code</span>
//                       <p className="font-semibold">{(liveInvoice as any).projectCode || "-"}</p>
//                     </div>
//                   </>
//                 )}

//                 <div>
//                   <span className="text-sm text-muted-foreground">Subject</span>
//                   <p className="font-semibold whitespace-pre-wrap break-words">
//                     {displaySubject}
//                   </p>
//                 </div>

//                 <div>
//                   <span className="text-sm text-muted-foreground">Total Amount</span>
//                   <p className="font-semibold">Rs {formatPKR(liveInvoice.totalAmount)}</p>
//                 </div>

//                 <div>
//                   <span className="text-sm text-muted-foreground">Submitted Date</span>
//                   <p>{toDateString(liveInvoice.submittedAt)}</p>
//                 </div>
//               </div>
//             </div>

//             {((liveInvoice as any).message || (liveInvoice as any).comment) && (
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="border rounded-lg p-4 bg-background">
//                   <h3 className="text-base font-semibold mb-2">Message</h3>
//                   <div className="text-sm whitespace-pre-wrap break-words text-foreground min-h-[120px]">
//                     {(liveInvoice as any).message || "-"}
//                   </div>
//                 </div>

//               </div>
//             )}

//             <div>
//               <h3 className="text-lg font-semibold mb-3">Line Items</h3>

//               <div className="overflow-x-auto border rounded-lg">
//                 <table className="w-full text-sm">
//                   <thead className="bg-muted">
//                     <tr>
//                       <th className="p-2 text-left">Vendor</th>
//                       <th className="p-2 text-left">Service</th>
//                       <th className="p-2 text-left">Description</th>
//                       <th className="p-2 text-left min-w-[220px]">Requester Comment</th>
//                       <th className="p-2 text-right">Qty</th>
//                       <th className="p-2 text-right">Rate</th>
//                       <th className="p-2 text-right">Tax</th>
//                       <th className="p-2 text-right">Amount</th>
//                       <th className="p-2 text-center min-w-[150px]">Status</th>
//                       <th className="p-2 text-left min-w-[240px]">Rejection Reason</th>
//                     </tr>
//                   </thead>

//                   <tbody>
//                     {lineItems.map((item, index) => {
//                       const qty = item.units ?? 0;
//                       const rate = item.unitRate ?? 0;
//                       const tax = item.tax ?? 0;
//                       const amount = getItemAmount(item);
//                       const status = item.status || "pending";

//                       return (
//                         <tr key={item.id || index} className="border-t align-top">
//                           <td className="p-2">{item.vendor || "-"}</td>
//                           <td className="p-2">{item.service || "-"}</td>
//                           <td className="p-2 whitespace-pre-wrap break-words">
//                             {item.description || "-"}
//                           </td>
//                           <td className="p-2 whitespace-pre-wrap break-words">
//                             {item.comment || "-"}
//                           </td>
//                           <td className="p-2 text-right">{qty}</td>
//                           <td className="p-2 text-right">Rs {formatPKR(rate)}</td>
//                           <td className="p-2 text-right">Rs {formatPKR(tax)}</td>
//                           <td className="p-2 text-right font-semibold">
//                             Rs {formatPKR(amount)}
//                           </td>

//                           <td className="p-2 text-center">
//                             {isMainAdmin && status === "pending" ? (
//                               <div className="flex justify-center gap-2">
//                                 <Button
//                                   size="icon"
//                                   className="bg-green-600 hover:bg-green-700"
//                                   disabled={itemActionLoading}
//                                   onClick={() => updateLineItemStatus(index, "approved")}
//                                 >
//                                   <Check size={16} />
//                                 </Button>

//                                 <Button
//                                   size="icon"
//                                   variant="destructive"
//                                   disabled={itemActionLoading}
//                                   onClick={() => openRejectDialog(index)}
//                                 >
//                                   <X size={16} />
//                                 </Button>
//                               </div>
//                             ) : (
//                               <Badge className={getItemStatusBadgeColor(status)}>
//                                 {status}
//                               </Badge>
//                             )}
//                           </td>

//                           <td className="p-2 whitespace-pre-wrap break-words text-sm">
//                             {item.rejectionComment ? (
//                               <div className="rounded-md bg-red-50 text-red-700 px-3 py-2 border border-red-100">
//                                 {item.rejectionComment}
//                               </div>
//                             ) : (
//                               "-"
//                             )}
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>

//               <div className="flex justify-end mt-4">
//                 <div className="w-full md:w-96 border rounded-lg p-4 bg-muted space-y-2">
//                   <div className="flex justify-between text-sm">
//                     <span className="text-muted-foreground">Total Budget</span>
//                     <span className="font-semibold">
//                       Rs {formatPKR(totalBudget)}
//                     </span>
//                   </div>

//                   <div className="flex justify-between text-sm">
//                     <span className="text-muted-foreground">Approved Amount</span>
//                     <span className="font-semibold text-green-600">
//                       Rs {formatPKR(approvedTotal)}
//                     </span>
//                   </div>

//                   <div className="flex justify-between text-sm">
//                     <span className="text-muted-foreground">Rejected Amount</span>
//                     <span className="font-semibold text-red-600">
//                       Rs {formatPKR(rejectedTotal)}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {paymentDetails && (
//               <div className="bg-muted p-4 rounded-lg">
//                 <h3 className="text-lg font-semibold mb-3">Payment Details</h3>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//                   <div>
//                     <span className="text-muted-foreground">Payment Method</span>
//                     <p className="font-medium">{paymentDetails.paymentMethod || "-"}</p>
//                   </div>

//                   <div>
//                     <span className="text-muted-foreground">Amount Paid</span>
//                     <p className="font-semibold">
//                       Rs {formatPKR(paymentDetails.amount)}
//                     </p>
//                   </div>

//                   <div>
//                     <span className="text-muted-foreground">Vendor(s)</span>
//                     <p>{vendorText}</p>
//                   </div>

//                   <div>
//                     <span className="text-muted-foreground">Transaction Ref</span>
//                     <p>{paymentDetails.transactionReference || "-"}</p>
//                   </div>

//                   {paymentDetails.chequeNumber && (
//                     <div>
//                       <span className="text-muted-foreground">Cheque Number</span>
//                       <p>{paymentDetails.chequeNumber}</p>
//                     </div>
//                   )}

//                   {paymentDetails.releasedByName && (
//                     <div>
//                       <span className="text-muted-foreground">Released By</span>
//                       <p>{paymentDetails.releasedByName}</p>
//                     </div>
//                   )}

//                   <div>
//                     <span className="text-muted-foreground">Released At</span>
//                     <p>{toDateString(paymentDetails.releasedAt)}</p>
//                   </div>

//                   {paymentDetails.selectedAccount && (
//                     <div>
//                       <span className="text-muted-foreground">Selected Account</span>
//                       <p>
//                         {paymentDetails.selectedAccount.accountName || "-"}
//                         {paymentDetails.selectedAccount.accountNumber
//                           ? ` (${paymentDetails.selectedAccount.accountNumber})`
//                           : ""}
//                       </p>
//                     </div>
//                   )}

//                   {paymentDetails.paymentNotes && (
//                     <div className="md:col-span-2">
//                       <span className="text-muted-foreground">Notes</span>
//                       <p className="whitespace-pre-wrap break-words">
//                         {paymentDetails.paymentNotes}
//                       </p>
//                     </div>
//                   )}

//                   {paymentDetails.bankReceiptUrl && (
//                     <div className="md:col-span-2">
//                       <a
//                         href={paymentDetails.bankReceiptUrl}
//                         target="_blank"
//                         rel="noreferrer"
//                         className="text-blue-600 underline"
//                       >
//                         View Bank Receipt
//                       </a>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>

//           <div className="flex justify-end mt-4">
//             <Button variant="outline" onClick={onClose}>
//               Close
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>

//       <Dialog
//         open={rejectDialogOpen}
//         onOpenChange={(open) => {
//           setRejectDialogOpen(open);
//           if (!open) {
//             setPendingRejectIndex(null);
//             setRejectionComment("");
//           }
//         }}
//       >
//         <DialogContent className="max-w-lg">
//           <DialogHeader>
//             <DialogTitle>Reject Line Item</DialogTitle>
//             <DialogDescription>
//               Please enter the reason for rejecting this item. This comment will be visible to the requester.
//             </DialogDescription>
//           </DialogHeader>

//           <div className="space-y-3">
//             <Textarea
//               value={rejectionComment}
//               onChange={(e) => setRejectionComment(e.target.value)}
//               placeholder="Enter rejection reason"
//               rows={5}
//             />
//           </div>

//           <div className="flex justify-end gap-2 mt-4">
//             <Button
//               variant="outline"
//               onClick={() => {
//                 setRejectDialogOpen(false);
//                 setPendingRejectIndex(null);
//                 setRejectionComment("");
//               }}
//             >
//               Cancel
//             </Button>

//             <Button
//               variant="destructive"
//               disabled={!rejectionComment.trim() || itemActionLoading}
//               onClick={handleRejectConfirm}
//             >
//               {itemActionLoading ? "Rejecting..." : "Confirm Reject"}
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
import { Check, ReceiptText, X } from "lucide-react";
import { doc, updateDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

function toDateString(timestamp: any): string {
  if (!timestamp) return "N/A";
  if (timestamp.toDate && typeof timestamp.toDate === "function") {
    return timestamp.toDate().toLocaleString();
  }
  if (timestamp instanceof Date) return timestamp.toLocaleString();
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

function getReadableStatus(status?: string) {
  if (!status) return "Pending";
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

interface InvoiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceRequest | null;
  onSubmitExpense?: (request: InvoiceRequest) => void;
}

export default function InvoiceDetailsModal({
  isOpen,
  onClose,
  invoice,
  onSubmitExpense,
}: InvoiceDetailsModalProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const isMainAdmin = userProfile?.role === "main_admin";

  const [liveInvoice, setLiveInvoice] = useState<InvoiceRequest | null>(invoice);
  const [lineItems, setLineItems] = useState<any[]>(invoice?.lineItems || []);

  const [itemRejectDialogOpen, setItemRejectDialogOpen] = useState(false);
  const [pendingRejectIndex, setPendingRejectIndex] = useState<number | null>(null);
  const [itemRejectionComment, setItemRejectionComment] = useState("");
  const [itemActionLoading, setItemActionLoading] = useState(false);

  const [requestRejectDialogOpen, setRequestRejectDialogOpen] = useState(false);
  const [requestRejectionComment, setRequestRejectionComment] = useState("");
  const [requestActionLoading, setRequestActionLoading] = useState(false);

  useEffect(() => {
    setLiveInvoice(invoice);
    setLineItems(invoice?.lineItems || []);
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
        setLineItems(freshInvoice.lineItems || []);
      }
    });

    return () => unsub();
  }, [invoice?.id, isOpen]);

  if (!liveInvoice) return null;

  const invoiceType =
    (liveInvoice as any).invoiceType ||
    (liveInvoice.clientName ? "project" : "general");

  function getStatusBadgeColor(status: string): string {
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

  function getItemStatusBadgeColor(status: string): string {
    switch (status) {
      case "approved":
        return "border-green-200 bg-green-50 text-green-700";
      case "rejected":
        return "border-red-200 bg-red-50 text-red-700";
      default:
        return "border-amber-200 bg-amber-50 text-amber-700";
    }
  }

  function canApproveRequest(request: InvoiceRequest): boolean {
    if (!userProfile) return false;

    switch (userProfile.role) {
      case "operational_admin":
        return request.status === "pending_operational_admin";
      case "main_admin":
        return request.status === "pending_main_admin";
      case "finance":
      case "financial_admin":
        return request.status === "pending_finance";
      default:
        return false;
    }
  }

  async function handleApproveRequest() {
    if (!liveInvoice?.id || !userProfile) return;

    try {
      setRequestActionLoading(true);

      let newStatus = liveInvoice.status;
      let currentApprover = "";

      switch (userProfile.role) {
        case "operational_admin":
          if (liveInvoice.status === "pending_operational_admin") {
            newStatus = "pending_main_admin" as any;
          }
          break;
        case "main_admin":
          if (liveInvoice.status === "pending_main_admin") {
            newStatus = "pending_finance" as any;
          }
          break;
        case "finance":
        case "financial_admin":
          if (liveInvoice.status === "pending_finance") {
            newStatus = "approved" as any;
          }
          break;
      }

      if (newStatus === liveInvoice.status) {
        toast({
          title: "Action not available",
          description: "This request is not pending your approval step.",
          variant: "destructive",
        });
        return;
      }

      await updateDoc(
        doc(db, "Panels", "IEDGE-SYSTEM", "invoiceRequests", liveInvoice.id),
        {
          status: newStatus,
          currentApprover,
          approvalHistory: [
            ...((liveInvoice as any).approvalHistory || []),
            {
              approver: userProfile.displayName,
              action: "approved",
              timestamp: new Date(),
              notes: "",
            },
          ],
          updatedAt: serverTimestamp(),
        }
      );

      setLiveInvoice({ ...liveInvoice, status: newStatus } as InvoiceRequest);

      toast({
        title: "Request approved",
        description: "The request status has been updated successfully.",
      });
    } catch (error: any) {
      console.error("Failed to approve request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve request",
        variant: "destructive",
      });
    } finally {
      setRequestActionLoading(false);
    }
  }

  async function handleRejectRequest() {
    if (!liveInvoice?.id || !userProfile) return;

    const reason = requestRejectionComment.trim();
    if (!reason) {
      toast({
        title: "Rejection comment required",
        description: "Please enter the reason for rejecting this request.",
        variant: "destructive",
      });
      return;
    }

    try {
      setRequestActionLoading(true);

      await updateDoc(
        doc(db, "Panels", "IEDGE-SYSTEM", "invoiceRequests", liveInvoice.id),
        {
          status: "pending_operational_admin",
          approvalHistory: [
            ...((liveInvoice as any).approvalHistory || []),
            {
              approver: userProfile.displayName,
              action: "rejected",
              timestamp: new Date(),
              notes: reason,
            },
          ],
          updatedAt: serverTimestamp(),
        }
      );

      setLiveInvoice({
        ...liveInvoice,
        status: "pending_operational_admin" as any,
      } as InvoiceRequest);

      toast({
        title: "Request rejected",
        description: "The request has been sent back with your comment.",
      });

      setRequestRejectDialogOpen(false);
      setRequestRejectionComment("");
    } catch (error: any) {
      console.error("Failed to reject request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject request",
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
    if (!liveInvoice?.id || !userProfile) return;

    try {
      setItemActionLoading(true);

      const updatedItems = lineItems.map((item: any) => ({ ...item }));
      const now = new Date();
      const actorName = userProfile.displayName || "Main Admin";

      const currentItem = updatedItems[index] || {};

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
              rejectionComment: rejectReason.trim(),
            }),
      };

      await updateDoc(
        doc(
          db,
          "Panels",
          "IEDGE-SYSTEM",
          "invoiceRequests",
          liveInvoice.id
        ),
        {
          lineItems: updatedItems,
          updatedAt: serverTimestamp(),
        }
      );

      setLineItems(updatedItems);

      toast({
        title: status === "approved" ? "Item approved" : "Item rejected",
      });
    } catch (error) {
      console.error("Failed to update line item status:", error);
      toast({
        title: "Error",
        description: "Failed to update item status",
        variant: "destructive",
      });
    } finally {
      setItemActionLoading(false);
    }
  }

  function openItemRejectDialog(index: number) {
    setPendingRejectIndex(index);
    setItemRejectionComment("");
    setItemRejectDialogOpen(true);
  }

  async function handleItemRejectConfirm() {
    if (pendingRejectIndex === null) return;

    const reason = itemRejectionComment.trim();
    if (!reason) {
      toast({
        title: "Rejection comment required",
        description: "Please enter the reason for rejecting this item.",
        variant: "destructive",
      });
      return;
    }

    await updateLineItemStatus(pendingRejectIndex, "rejected", reason);
    setItemRejectDialogOpen(false);
    setPendingRejectIndex(null);
    setItemRejectionComment("");
  }

  const approvedTotal = lineItems
    .filter((item: any) => item.status === "approved")
    .reduce((sum: number, item: any) => sum + getItemAmount(item), 0);

  const rejectedTotal = lineItems
    .filter((item: any) => item.status === "rejected")
    .reduce((sum: number, item: any) => sum + getItemAmount(item), 0);

  const pendingTotal = lineItems
    .filter((item: any) => !item.status || item.status === "pending")
    .reduce((sum: number, item: any) => sum + getItemAmount(item), 0);

  const totalBudget = liveInvoice.totalAmount || 0;
  const canShowRequestActions = canApproveRequest(liveInvoice);

  const paymentDetails = liveInvoice.paymentDetails as
    | {
        paymentMethod?: string;
        amount?: number;
        vendor?: string;
        vendors?: string[];
        transactionReference?: string;
        chequeNumber?: string;
        bankReceiptUrl?: string;
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

  const vendorText = Array.isArray(paymentDetails?.vendors)
    ? paymentDetails?.vendors.join(", ")
    : paymentDetails?.vendor || "-";

  const displaySubject =
    (liveInvoice as any).subject ||
    (invoiceType === "project" ? (liveInvoice as any).title || "-" : "-");

  const canSubmitExpense =
    invoiceType === "project" &&
    !!onSubmitExpense &&
    ["approved", "payment_released"].includes(String(liveInvoice.status || ""));

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[96vw] md:max-w-7xl max-h-[92vh] overflow-y-auto border-0 bg-slate-50 p-0 shadow-2xl">
          <div className="sticky top-0 z-10 border-b bg-white/95 px-6 py-5 backdrop-blur">
            <DialogHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <DialogTitle className="text-2xl font-bold tracking-tight text-slate-950">
                    Budget Detail
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-sm text-slate-500">
                    Request Form Details – {liveInvoice.requestId}
                  </DialogDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeColor(liveInvoice.status)}`}>
                    {getReadableStatus(liveInvoice.status)}
                  </Badge>



                  {canSubmitExpense && (
                    <Button
                      size="sm"
                      className="rounded-full bg-slate-950 px-4 text-white shadow-sm hover:bg-slate-800"
                      onClick={() => onSubmitExpense?.(liveInvoice)}
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
                        disabled={requestActionLoading}
                        onClick={handleApproveRequest}
                      >
                        <Check className="mr-1 h-4 w-4" />
                        {requestActionLoading ? "Approving..." : "Approve Request"}
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        className="rounded-full px-4 shadow-sm"
                        disabled={requestActionLoading}
                        onClick={() => {
                          setRequestRejectionComment("");
                          setRequestRejectDialogOpen(true);
                        }}
                      >
                        <X className="mr-1 h-4 w-4" />
                        Reject Request
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="space-y-6 px-6 py-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Total Budget
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-950">
                  Rs {formatPKR(totalBudget)}
                </p>
              </div>

              <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-green-600">
                  Approved Amount
                </p>
                <p className="mt-2 text-2xl font-bold text-green-700">
                  Rs {formatPKR(approvedTotal)}
                </p>
              </div>

              <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-red-600">
                  Rejected Amount
                </p>
                <p className="mt-2 text-2xl font-bold text-red-700">
                  Rs {formatPKR(rejectedTotal)}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-950">
                  Request Information
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Request ID
                  </span>
                  <p className="mt-1 font-semibold text-slate-950">
                    {liveInvoice.requestId}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Status
                  </span>
                  <div className="mt-2">
                    <Badge className={`rounded-full border px-3 py-1 ${getStatusBadgeColor(liveInvoice.status)}`}>
                      {getReadableStatus(liveInvoice.status)}
                    </Badge>
                  </div>
                </div>

                {invoiceType === "general" ? (
                  <div className="rounded-xl bg-slate-50 p-4">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Title
                    </span>
                    <p className="mt-1 font-semibold text-slate-950">
                      {(liveInvoice as any).title || "-"}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl bg-slate-50 p-4">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Client
                      </span>
                      <p className="mt-1 font-semibold text-slate-950">
                        {liveInvoice.clientName || "-"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Project
                      </span>
                      <p className="mt-1 font-semibold text-slate-950">
                        {liveInvoice.project || "-"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Project Code
                      </span>
                      <p className="mt-1 font-semibold text-slate-950">
                        {(liveInvoice as any).projectCode || "-"}
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
                    {toDateString(liveInvoice.submittedAt)}
                  </p>
                </div>
              </div>
            </div>

            {((liveInvoice as any).message || (liveInvoice as any).comment) && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-base font-semibold text-slate-950">
                  Message
                </h3>
                <div className="min-h-[100px] rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-wrap break-words">
                  {(liveInvoice as any).message || (liveInvoice as any).comment || "-"}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">
                    Item Approval
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Approve or reject individual budget items. Request-level approve/reject is also available here.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {canSubmitExpense && (
                    <Button
                      size="sm"
                      className="rounded-full bg-slate-950 px-4 text-white hover:bg-slate-800"
                      onClick={() => onSubmitExpense?.(liveInvoice)}
                    >
                      <ReceiptText className="mr-1 h-4 w-4" />
                      Submit Expense
                    </Button>
                  )}

                  {canShowRequestActions && (
                    <>
                    <Button
                      size="sm"
                      className="rounded-full bg-green-600 px-4 text-white hover:bg-green-700"
                      disabled={requestActionLoading}
                      onClick={handleApproveRequest}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Approve Request
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      className="rounded-full px-4"
                      disabled={requestActionLoading}
                      onClick={() => {
                        setRequestRejectionComment("");
                        setRequestRejectDialogOpen(true);
                      }}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Reject Request
                    </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Vendor</th>
                      <th className="px-4 py-3 text-left font-semibold">Service</th>
                      <th className="px-4 py-3 text-left font-semibold">Description</th>
                      <th className="px-4 py-3 text-left font-semibold min-w-[220px]">
                        Requester Comment
                      </th>
                      <th className="px-4 py-3 text-right font-semibold">Qty</th>
                      <th className="px-4 py-3 text-right font-semibold">Rate</th>
                      <th className="px-4 py-3 text-right font-semibold">Amount</th>
                      <th className="px-4 py-3 text-center font-semibold min-w-[180px]">
                        Item Action
                      </th>
                      <th className="px-4 py-3 text-left font-semibold min-w-[240px]">
                        Rejection Reason
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {lineItems.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                          No line items found.
                        </td>
                      </tr>
                    ) : (
                      lineItems.map((item, index) => {
                        const qty = item.units ?? 0;
                        const rate = item.unitRate ?? 0;
                        const amount = getItemAmount(item);
                        const status = item.status || "pending";

                        return (
                          <tr key={item.id || index} className="align-top transition hover:bg-slate-50/80">
                            <td className="px-4 py-4 font-medium text-slate-950">
                              {item.vendor || "-"}
                            </td>
                            <td className="px-4 py-4 text-slate-700">
                              {item.service || "-"}
                            </td>
                            <td className="px-4 py-4 whitespace-pre-wrap break-words text-slate-700">
                              {item.description || "-"}
                            </td>
                            <td className="px-4 py-4 whitespace-pre-wrap break-words text-slate-700">
                              {item.comment || "-"}
                            </td>
                            <td className="px-4 py-4 text-right text-slate-700">{qty}</td>
                            <td className="px-4 py-4 text-right text-slate-700">
                              Rs {formatPKR(rate)}
                            </td>
                            <td className="px-4 py-4 text-right font-semibold text-slate-950">
                              Rs {formatPKR(amount)}
                            </td>

                            <td className="px-4 py-4 text-center">
                              {isMainAdmin && status === "pending" ? (
                                <div className="flex flex-wrap justify-center gap-2">
                                  <Button
                                    size="sm"
                                    className="rounded-full bg-green-600 px-3 text-white hover:bg-green-700"
                                    disabled={itemActionLoading}
                                    onClick={() => updateLineItemStatus(index, "approved")}
                                  >
                                    <Check className="mr-1 h-4 w-4" />
                                    Approve
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="rounded-full px-3"
                                    disabled={itemActionLoading}
                                    onClick={() => openItemRejectDialog(index)}
                                  >
                                    <X className="mr-1 h-4 w-4" />
                                    Reject
                                  </Button>
                                </div>
                              ) : (
                                <Badge className={`rounded-full border px-3 py-1 ${getItemStatusBadgeColor(status)}`}>
                                  {getReadableStatus(status)}
                                </Badge>
                              )}
                            </td>

                            <td className="px-4 py-4 whitespace-pre-wrap break-words text-sm">
                              {item.rejectionComment ? (
                                <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-red-700">
                                  {item.rejectionComment}
                                </div>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
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
                    Rs {formatPKR(totalBudget)}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <span className="text-xs font-medium uppercase tracking-wide text-green-600">
                    Approved
                  </span>
                  <p className="mt-1 font-bold text-green-700">
                    Rs {formatPKR(approvedTotal)}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <span className="text-xs font-medium uppercase tracking-wide text-red-600">
                    Rejected
                  </span>
                  <p className="mt-1 font-bold text-red-700">
                    Rs {formatPKR(rejectedTotal)}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <span className="text-xs font-medium uppercase tracking-wide text-amber-600">
                    Pending
                  </span>
                  <p className="mt-1 font-bold text-amber-700">
                    Rs {formatPKR(pendingTotal)}
                  </p>
                </div>
              </div>
            </div>

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
                      {paymentDetails.paymentMethod || "-"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Amount Paid
                    </span>
                    <p className="mt-1 font-semibold text-slate-950">
                      Rs {formatPKR(paymentDetails.amount)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Vendor(s)
                    </span>
                    <p className="mt-1 text-slate-800">{vendorText}</p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Transaction Ref
                    </span>
                    <p className="mt-1 text-slate-800">
                      {paymentDetails.transactionReference || "-"}
                    </p>
                  </div>

                  {paymentDetails.chequeNumber && (
                    <div className="rounded-xl bg-slate-50 p-4">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Cheque Number
                      </span>
                      <p className="mt-1 text-slate-800">
                        {paymentDetails.chequeNumber}
                      </p>
                    </div>
                  )}

                  {paymentDetails.releasedByName && (
                    <div className="rounded-xl bg-slate-50 p-4">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Released By
                      </span>
                      <p className="mt-1 text-slate-800">
                        {paymentDetails.releasedByName}
                      </p>
                    </div>
                  )}

                  <div className="rounded-xl bg-slate-50 p-4">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Released At
                    </span>
                    <p className="mt-1 text-slate-800">
                      {toDateString(paymentDetails.releasedAt)}
                    </p>
                  </div>

                  {paymentDetails.selectedAccount && (
                    <div className="rounded-xl bg-slate-50 p-4">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Selected Account
                      </span>
                      <p className="mt-1 text-slate-800">
                        {paymentDetails.selectedAccount.accountName || "-"}
                        {paymentDetails.selectedAccount.accountNumber
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
                        {paymentDetails.paymentNotes}
                      </p>
                    </div>
                  )}

                  {paymentDetails.bankReceiptUrl && (
                    <div className="md:col-span-2 lg:col-span-3">
                      <a
                        href={paymentDetails.bankReceiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                      >
                        View Bank Receipt
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 flex justify-end border-t bg-white/95 px-6 py-4 backdrop-blur">
            <Button variant="outline" className="rounded-full px-5" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
            <DialogTitle>Reject Line Item</DialogTitle>
            <DialogDescription>
              Please enter the reason for rejecting this item. This comment will be visible to the requester.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Textarea
              value={itemRejectionComment}
              onChange={(e) => setItemRejectionComment(e.target.value)}
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
                setItemRejectDialogOpen(false);
                setPendingRejectIndex(null);
                setItemRejectionComment("");
              }}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              className="rounded-full"
              disabled={!itemRejectionComment.trim() || itemActionLoading}
              onClick={handleItemRejectConfirm}
            >
              {itemActionLoading ? "Rejecting..." : "Confirm Reject"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={requestRejectDialogOpen}
        onOpenChange={(open) => {
          setRequestRejectDialogOpen(open);
          if (!open) setRequestRejectionComment("");
        }}
      >
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Please enter the reason for rejecting this request. It will be saved in the approval history and sent back to Operational Admin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Textarea
              value={requestRejectionComment}
              onChange={(e) => setRequestRejectionComment(e.target.value)}
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
                setRequestRejectDialogOpen(false);
                setRequestRejectionComment("");
              }}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              className="rounded-full"
              disabled={!requestRejectionComment.trim() || requestActionLoading}
              onClick={handleRejectRequest}
            >
              {requestActionLoading ? "Rejecting..." : "Confirm Reject"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}







