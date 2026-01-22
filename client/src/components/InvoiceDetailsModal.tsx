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

// // Helper function to safely convert Firestore timestamps to Date with time
// function toDateString(timestamp: any): string {
//   if (!timestamp) return 'N/A';

//   // If it's a Firestore Timestamp with toDate method
//   if (timestamp.toDate && typeof timestamp.toDate === 'function') {
//     return timestamp.toDate().toLocaleString();
//   }

//   // If it's already a Date object
//   if (timestamp instanceof Date) {
//     return timestamp.toLocaleString();
//   }

//   // Fallback: try to create a Date from the value
//   try {
//     return new Date(timestamp).toLocaleString();
//   } catch {
//     return 'N/A';
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
//       typeof value === "number"
//         ? value
//         : parseFloat(String(value).replace(/,/g, "")) || 0;

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
//           <DialogDescription>
//             View detailed information about this invoice request
//           </DialogDescription>
//         </DialogHeader>

//         <div className="space-y-6">
//           {/* Basic Information */}
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
//                     {invoice.status.replace('_', ' ')}
//                   </Badge>
//                 </div>
//               </div>
//               <div>
//                 <span className="text-sm font-medium text-muted-foreground">Client Name:</span>
//                 <p className="text-sm font-semibold">{invoice.clientName}</p>
//               </div>
//               <div>
//                 <span className="text-sm font-medium text-muted-foreground">Project:</span>
//                 <p className="text-sm font-semibold">{invoice.project}</p>
//               </div>
//               <div>
//                 <span className="text-sm font-medium text-muted-foreground">Total Amount:</span>
//                 <p className="text-sm font-semibold">Rs {formatPKR(invoice.totalAmount)}
//                 </p>
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
//                     <tr key={item.id || index}>
//                       <td className="px-4 py-3 text-sm">{item.vendor}</td>
//                       <td className="px-4 py-3 text-sm">{item.description}</td>
//                       <td className="px-4 py-3 text-sm">{item.quantity}</td>
//                       <td className="px-4 py-3 text-sm">
//                         Rs {formatPKR(item.unitPrice)}
//                       </td>

//                       <td className="px-4 py-3 text-sm font-semibold">
//                         Rs {formatPKR(item.amount)}
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
//                     onClick={() => window.open(url, '_blank')}
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
//                 {invoice.approvalHistory.map((history, index) => (
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
//                         className={history.action === "approved" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
//                       >
//                         {history.action}
//                       </Badge>
//                     </div>
//                     {history.notes && (
//                       <p className="text-sm mt-2">{history.notes}</p>
//                     )}
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

interface InvoiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceRequest | null;
}

export default function InvoiceDetailsModal({
  isOpen,
  onClose,
  invoice,
}: InvoiceDetailsModalProps) {
  if (!invoice) return null;

  const invoiceType =
    ((invoice as any).invoiceType as "general" | "project") ||
    (invoice.clientName ? "project" : "general");

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

  function formatPKR(value: number | string | undefined) {
    if (value === null || value === undefined) return "0.00";
    const num =
      typeof value === "number" ? value : parseFloat(String(value).replace(/,/g, "")) || 0;

    return num.toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <i className="fas fa-file-alt text-blue-600"></i>
            <span>Request Form Details - {invoice.requestId}</span>
          </DialogTitle>
          <DialogDescription>View detailed information about this invoice request</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Request ID:</span>
                <p className="text-sm font-semibold">{invoice.requestId}</p>
              </div>

              <div>
                <span className="text-sm font-medium text-muted-foreground">Status:</span>
                <div className="mt-1">
                  <Badge className={getStatusBadgeColor(invoice.status)}>
                    {invoice.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>

              {/* ✅ Show Title for General, Client+Project for Project */}
              {invoiceType === "general" ? (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Title:</span>
                  <p className="text-sm font-semibold">{(invoice as any).title || "-"}</p>
                </div>
              ) : (
                <>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Client Name:</span>
                    <p className="text-sm font-semibold">{invoice.clientName || "-"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Project:</span>
                    <p className="text-sm font-semibold">{invoice.project || "-"}</p>
                  </div>
                </>
              )}

              <div>
                <span className="text-sm font-medium text-muted-foreground">Total Amount:</span>
                <p className="text-sm font-semibold">Rs {formatPKR(invoice.totalAmount)}</p>
              </div>

              <div>
                <span className="text-sm font-medium text-muted-foreground">Submitted Date:</span>
                <p className="text-sm">{toDateString(invoice.submittedAt)}</p>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Line Items</h3>
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Vendor</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Quantity</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Unit Price</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoice.lineItems?.map((item, index) => (
                    <tr key={(item as any).id || index}>
                      <td className="px-4 py-3 text-sm">{(item as any).vendor}</td>
                      <td className="px-4 py-3 text-sm">{(item as any).description}</td>
                      <td className="px-4 py-3 text-sm">{(item as any).quantity}</td>
                      <td className="px-4 py-3 text-sm">Rs {formatPKR((item as any).unitPrice)}</td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        Rs {formatPKR((item as any).amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Comments */}
          {invoice.comment && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Comments</h3>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">{invoice.comment}</p>
              </div>
            </div>
          )}

          {/* Supporting Documents */}
          {invoice.supportingDocuments && invoice.supportingDocuments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Supporting Documents</h3>
              <div className="space-y-2">
                {invoice.supportingDocuments.map((url, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(url, "_blank")}
                    className="mr-2"
                  >
                    <i className="fas fa-file mr-2"></i>
                    Document {index + 1}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Approval History */}
          {invoice.approvalHistory && invoice.approvalHistory.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Approval History</h3>
              <div className="space-y-2">
                {invoice.approvalHistory.map((history: any, index: number) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-sm font-medium">
                          {history.action === "approved" ? "Approved" : "Rejected"}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          by {history.approver} on {toDateString(history.timestamp)}
                        </p>
                      </div>
                      <Badge
                        className={
                          history.action === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {history.action}
                      </Badge>
                    </div>
                    {history.notes && <p className="text-sm mt-2">{history.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
