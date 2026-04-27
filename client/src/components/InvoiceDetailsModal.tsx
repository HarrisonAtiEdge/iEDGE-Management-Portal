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
//   if (!invoice) return null;

//   const invoiceType =
//     ((invoice as any).invoiceType as "general" | "project") ||
//     (invoice.clientName ? "project" : "general");

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

//   function formatPKR(value: number | string | undefined) {
//     if (value === null || value === undefined) return "0.00";
//     const num =
//       typeof value === "number" ? value : parseFloat(String(value).replace(/,/g, "")) || 0;

//     return num.toLocaleString("en-PK", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     });
//   }

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="flex items-center space-x-2">
//             <i className="fas fa-file-alt text-blue-600"></i>
//             <span>Request Form Details - {invoice.requestId}</span>
//           </DialogTitle>
//           <DialogDescription>View detailed information about this invoice request</DialogDescription>
//         </DialogHeader>

//         <div className="space-y-6">
//           <div className="bg-muted p-4 rounded-lg">
//             <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <span className="text-sm font-medium text-muted-foreground">Request ID:</span>
//                 <p className="text-sm font-semibold">{invoice.requestId}</p>
//               </div>

//               <div>
//                 <span className="text-sm font-medium text-muted-foreground">Status:</span>
//                 <div className="mt-1">
//                   <Badge className={getStatusBadgeColor(invoice.status)}>
//                     {invoice.status.replace("_", " ")}
//                   </Badge>
//                 </div>
//               </div>

//               {/* ✅ Show Title for General, Client+Project for Project */}
//               {invoiceType === "general" ? (
//                 <div>
//                   <span className="text-sm font-medium text-muted-foreground">Title:</span>
//                   <p className="text-sm font-semibold">{(invoice as any).title || "-"}</p>
//                 </div>
//               ) : (
//                 <>
//                   <div>
//                     <span className="text-sm font-medium text-muted-foreground">Client Name:</span>
//                     <p className="text-sm font-semibold">{invoice.clientName || "-"}</p>
//                   </div>
//                   <div>
//                     <span className="text-sm font-medium text-muted-foreground">Project:</span>
//                     <p className="text-sm font-semibold">{invoice.project || "-"}</p>
//                   </div>
//                 </>
//               )}

//               <div>
//                 <span className="text-sm font-medium text-muted-foreground">Total Amount:</span>
//                 <p className="text-sm font-semibold">Rs {formatPKR(invoice.totalAmount)}</p>
//               </div>

//               <div>
//                 <span className="text-sm font-medium text-muted-foreground">Submitted Date:</span>
//                 <p className="text-sm">{toDateString(invoice.submittedAt)}</p>
//               </div>
//             </div>
//           </div>

//           {/* Line Items */}
//           <div>
//             <h3 className="text-lg font-semibold mb-4">Line Items</h3>
//             <div className="bg-white border rounded-lg overflow-hidden">
//               <table className="w-full">
//                 <thead className="bg-muted">
//                   <tr>
//                     <th className="px-4 py-3 text-left text-sm font-medium">Vendor</th>
//                     <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
//                     <th className="px-4 py-3 text-left text-sm font-medium">Quantity</th>
//                     <th className="px-4 py-3 text-left text-sm font-medium">Unit Price</th>
//                     <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y">
//                   {invoice.lineItems?.map((item, index) => (
//                     <tr key={(item as any).id || index}>
//                       <td className="px-4 py-3 text-sm">{(item as any).vendor}</td>
//                       <td className="px-4 py-3 text-sm">{(item as any).description}</td>
//                       <td className="px-4 py-3 text-sm">{(item as any).quantity}</td>
//                       <td className="px-4 py-3 text-sm">Rs {formatPKR((item as any).unitPrice)}</td>
//                       <td className="px-4 py-3 text-sm font-semibold">
//                         Rs {formatPKR((item as any).amount)}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>

//           {/* Comments */}
//           {invoice.comment && (
//             <div>
//               <h3 className="text-lg font-semibold mb-2">Comments</h3>
//               <div className="bg-muted p-4 rounded-lg">
//                 <p className="text-sm">{invoice.comment}</p>
//               </div>
//             </div>
//           )}

//           {/* Supporting Documents */}
//           {invoice.supportingDocuments && invoice.supportingDocuments.length > 0 && (
//             <div>
//               <h3 className="text-lg font-semibold mb-2">Supporting Documents</h3>
//               <div className="space-y-2">
//                 {invoice.supportingDocuments.map((url, index) => (
//                   <Button
//                     key={index}
//                     variant="outline"
//                     size="sm"
//                     onClick={() => window.open(url, "_blank")}
//                     className="mr-2"
//                   >
//                     <i className="fas fa-file mr-2"></i>
//                     Document {index + 1}
//                   </Button>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Approval History */}
//           {invoice.approvalHistory && invoice.approvalHistory.length > 0 && (
//             <div>
//               <h3 className="text-lg font-semibold mb-2">Approval History</h3>
//               <div className="space-y-2">
//                 {invoice.approvalHistory.map((history: any, index: number) => (
//                   <div key={index} className="border rounded-lg p-3">
//                     <div className="flex justify-between items-start">
//                       <div>
//                         <span className="text-sm font-medium">
//                           {history.action === "approved" ? "Approved" : "Rejected"}
//                         </span>
//                         <p className="text-xs text-muted-foreground">
//                           by {history.approver} on {toDateString(history.timestamp)}
//                         </p>
//                       </div>
//                       <Badge
//                         className={
//                           history.action === "approved"
//                             ? "bg-green-100 text-green-800"
//                             : "bg-red-100 text-red-800"
//                         }
//                       >
//                         {history.action}
//                       </Badge>
//                     </div>
//                     {history.notes && <p className="text-sm mt-2">{history.notes}</p>}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>

//         <div className="flex justify-end">
//           <Button variant="outline" onClick={onClose}>
//             Close
//           </Button>
//         </div>
//       </DialogContent>
//     </Dialog>
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
import { Check, X } from "lucide-react";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

/* ===================== HELPERS ===================== */

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

/* ===================== PROPS ===================== */

interface InvoiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceRequest | null;
}

/* ===================== COMPONENT ===================== */

export default function InvoiceDetailsModal({
  isOpen,
  onClose,
  invoice,
}: InvoiceDetailsModalProps) {
  const { userProfile } = useAuth();
  const isMainAdmin = userProfile?.role === "main_admin";

  const [liveInvoice, setLiveInvoice] = useState<InvoiceRequest | null>(
    invoice,
  );
  const [lineItems, setLineItems] = useState<any[]>(invoice?.lineItems || []);

  useEffect(() => {
    if (!invoice?.id || !isOpen) return;

    const ref = doc(
      db,
      "Panels",
      "IEDGE-SYSTEM",
      "invoiceRequests",
      invoice.id,
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
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending_operational_admin":
      case "pending_main_admin":
      case "pending_finance":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  }

  async function updateLineItemStatus(
    index: number,
    status: "approved" | "rejected",
  ) {
    if (!liveInvoice || !userProfile) return;

    const updatedItems = lineItems.map((item) => ({ ...item }));

    updatedItems[index] = {
      ...updatedItems[index],
      status,
      approvedBy: userProfile.displayName || "Main Admin",
      approvedAt: new Date(),
    };

    setLineItems(updatedItems);

    await updateDoc(
      doc(db, "Panels", "IEDGE-SYSTEM", "invoiceRequests", liveInvoice.id),
      { lineItems: updatedItems },
    );
  }

  const approvedTotal = lineItems
    .filter((item) => item.status === "approved")
    .reduce((sum, item) => {
      const qty = item.units ?? 0;
      const rate = item.unitRate ?? 0;
      const tax = item.tax ?? 0;
      const amount = item.total ?? qty * rate + tax;

      return sum + amount;
    }, 0);

  const totalBudget = liveInvoice.totalAmount || 0;

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Request Form Details – {liveInvoice.requestId}
          </DialogTitle>
          <DialogDescription>
            View detailed information about this payment request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-muted p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">
                  Request ID
                </span>
                <p className="font-semibold">{liveInvoice.requestId}</p>
              </div>

              <div>
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className={getStatusBadgeColor(liveInvoice.status)}>
                  {liveInvoice.status.replace("_", " ")}
                </Badge>
              </div>

              {invoiceType === "general" ? (
                <div>
                  <span className="text-sm text-muted-foreground">Title</span>
                  <p className="font-semibold">
                    {(liveInvoice as any).title || "-"}
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Client
                    </span>
                    <p className="font-semibold">
                      {liveInvoice.clientName || "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Project
                    </span>
                    <p className="font-semibold">
                      {liveInvoice.project || "-"}
                    </p>
                  </div>
                </>
              )}

              <div>
                <span className="text-sm text-muted-foreground">
                  Total Amount
                </span>
                <p className="font-semibold">
                  Rs {formatPKR(liveInvoice.totalAmount)}
                </p>
              </div>

              <div>
                <span className="text-sm text-muted-foreground">
                  Submitted Date
                </span>
                <p>{toDateString(liveInvoice.submittedAt)}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Line Items</h3>

            <table className="w-full text-sm border">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left">Vendor</th>
                  <th className="p-2 text-left">Description</th>
                  <th className="p-2 text-right">Qty</th>
                  <th className="p-2 text-right">Rate</th>
                  <th className="p-2 text-right">Tax</th>
                  <th className="p-2 text-right">Amount</th>
                  <th className="p-2 text-center">Status</th>
                </tr>
              </thead>

              <tbody>
                {lineItems.map((item, index) => {
                  const qty = item.units ?? 0;
                  const rate = item.unitRate ?? 0;
                  const tax = item.tax ?? 0;
                  const amount = item.total ?? qty * rate + tax;
                  const status = item.status || "pending";

                  return (
                    <tr key={item.id || index} className="border-t">
                      <td className="p-2">{item.vendor || "-"}</td>
                      <td className="p-2">{item.description || "-"}</td>
                      <td className="p-2 text-right">{qty}</td>
                      <td className="p-2 text-right">Rs {formatPKR(rate)}</td>
                      <td className="p-2 text-right">Rs {formatPKR(tax)}</td>
                      <td className="p-2 text-right font-semibold">
                        Rs {formatPKR(amount)}
                      </td>

                      <td className="p-2 text-center">
                        {isMainAdmin && status === "pending" ? (
                          <div className="flex justify-center gap-2">
                            <Button
                              size="icon"
                              className="bg-green-600"
                              onClick={() =>
                                updateLineItemStatus(index, "approved")
                              }
                            >
                              <Check size={16} />
                            </Button>
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() =>
                                updateLineItemStatus(index, "rejected")
                              }
                            >
                              <X size={16} />
                            </Button>
                          </div>
                        ) : (
                          <Badge
                            className={
                              status === "approved"
                                ? "bg-green-100 text-green-800"
                                : status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {status}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="flex justify-end mt-4">
              <div className="w-full md:w-80 border rounded-lg p-4 bg-muted space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Budget</span>
                  <span className="font-semibold">
                    Rs {formatPKR(totalBudget)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Approved Amount</span>
                  <span className="font-semibold text-green-600">
                    Rs {formatPKR(approvedTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {paymentDetails && (
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Payment Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Payment Method</span>
                  <p className="font-medium">
                    {paymentDetails.paymentMethod || "-"}
                  </p>
                </div>

                <div>
                  <span className="text-muted-foreground">Amount Paid</span>
                  <p className="font-semibold">
                    Rs {formatPKR(paymentDetails.amount)}
                  </p>
                </div>

                <div>
                  <span className="text-muted-foreground">Vendor(s)</span>
                  <p>{vendorText}</p>
                </div>

                <div>
                  <span className="text-muted-foreground">Transaction Ref</span>
                  <p>{paymentDetails.transactionReference || "-"}</p>
                </div>

                {paymentDetails.chequeNumber && (
                  <div>
                    <span className="text-muted-foreground">Cheque Number</span>
                    <p>{paymentDetails.chequeNumber}</p>
                  </div>
                )}

                {paymentDetails.releasedByName && (
                  <div>
                    <span className="text-muted-foreground">Released By</span>
                    <p>{paymentDetails.releasedByName}</p>
                  </div>
                )}

                <div>
                  <span className="text-muted-foreground">Released At</span>
                  <p>{toDateString(paymentDetails.releasedAt)}</p>
                </div>

                {paymentDetails.selectedAccount && (
                  <div>
                    <span className="text-muted-foreground">
                      Selected Account
                    </span>
                    <p>
                      {paymentDetails.selectedAccount.accountName || "-"}
                      {paymentDetails.selectedAccount.accountNumber
                        ? ` (${paymentDetails.selectedAccount.accountNumber})`
                        : ""}
                    </p>
                  </div>
                )}

                {paymentDetails.paymentNotes && (
                  <div className="md:col-span-2">
                    <span className="text-muted-foreground">Notes</span>
                    <p>{paymentDetails.paymentNotes}</p>
                  </div>
                )}

                {paymentDetails.bankReceiptUrl && (
                  <div className="md:col-span-2">
                    <a
                      href={paymentDetails.bankReceiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline"
                    >
                      View Bank Receipt
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
