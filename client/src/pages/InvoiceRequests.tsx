// import { useState } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { useFirestoreQuery } from "@/hooks/useFirestore";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import InvoiceRequestModal from "@/components/InvoiceRequestModal";
// import PaymentReleaseModal from "@/components/PaymentReleaseModal";
// import ExpenseSheetModal from "@/components/ExpenseSheetModal";
// import InvoiceDetailsModal from "@/components/InvoiceDetailsModal";
// import { InvoiceRequest } from "@shared/schema";
// import { useToast } from "@/hooks/use-toast";
// import RejectionModal from "@/components/RejectionModal";

// export default function InvoiceRequests() {
//   const PANEL_ID = "IEDGE-SYSTEM";

//   const { userProfile } = useAuth();
//   const { toast } = useToast();
//   const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
//   const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
//   const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
//   const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
//   const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRequest | null>(null);
//   const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
//   const [rejectionLoading, setRejectionLoading] = useState(false);

//   // const { data: invoices, loading } = useFirestoreQuery<InvoiceRequest>("invoiceRequests");
//   // const { data: expenseSheets } = useFirestoreQuery<any>("expenseSheets");
//   const { data: invoices, loading } = useFirestoreQuery<InvoiceRequest>(
//   `Panels/${PANEL_ID}/invoiceRequests`
// );

// const { data: expenseSheets } = useFirestoreQuery<any>(
//   `Panels/${PANEL_ID}/expenseSheets`
// );


//   async function handleApprove(invoice: InvoiceRequest) {
//     if (!userProfile) return;

//     try {
//       let newStatus = invoice.status;
//       let currentApprover = "";

//       switch (userProfile.role) {
//         case "operational_admin":
//           if (invoice.status === "pending_operational_admin") {
//             newStatus = "pending_main_admin";
//           }
//           break;
//         case "main_admin":
//           if (invoice.status === "pending_main_admin") {
//             newStatus = "pending_finance";
//           }
//           break;
//         case "finance":
//         case "financial_admin":
//           if (invoice.status === "pending_finance") {
//             newStatus = "approved";
//           }
//           break;
//       }

//       // Update invoice with approval

//       // await updateDoc(doc(db, "invoiceRequests", invoice.id), {
//       //   status: newStatus,
//       //   currentApprover,
//       //   approvalHistory: [
//       //     ...(invoice.approvalHistory || []),
//       //     {
//       //       approver: userProfile.displayName,
//       //       action: "approved",
//       //       timestamp: new Date(),
//       //       notes: "",
//       //     },
//       //   ],
//       //   updatedAt: serverTimestamp(),
//       // });

//      await updateDoc(
//   doc(db, "Panels", PANEL_ID, "invoiceRequests", invoice.id),
//   {
//     status: newStatus,
//     currentApprover,
//     approvalHistory: [
//       ...(invoice.approvalHistory || []),
//       {
//         approver: userProfile.displayName,
//         action: "approved",
//         timestamp: new Date(),
//         notes: "",
//       },
//     ],
//     updatedAt: serverTimestamp(),
//   }
// );


//       toast({
//         title: "Success",
//         description: "Invoice approved successfully",
//       });
//     } catch (error: any) {
//       console.error("Failed to approve invoice:", error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to approve invoice",
//         variant: "destructive",
//       });
//     }
//   }

//   async function handleReject(invoice: InvoiceRequest, rejectionComment: string) {
//     if (!userProfile) return;

//     try {
//       setRejectionLoading(true);
//       // await updateDoc(doc(db, "invoiceRequests", invoice.id), {
//       //   status: "pending_operational_admin", // Send back to operation for revision
//       //   approvalHistory: [
//       //     ...(invoice.approvalHistory || []),
//       //     {
//       //       approver: userProfile.displayName,
//       //       action: "rejected",
//       //       timestamp: new Date(),
//       //       notes: rejectionComment,
//       //     },
//       //   ],
//       //   updatedAt: serverTimestamp(),
//       // });
      
//       await updateDoc(
//   doc(db, "Panels", PANEL_ID, "invoiceRequests", invoice.id),
//   {
//     status: "pending_operational_admin",
//     approvalHistory: [
//       ...(invoice.approvalHistory || []),
//       {
//         approver: userProfile.displayName,
//         action: "rejected",
//         timestamp: new Date(),
//         notes: rejectionComment,
//       },
//     ],
//     updatedAt: serverTimestamp(),
//   }
// );

//       toast({
//         title: "Success",
//         description: "Invoice rejected with comments",
//       });
      
//       setIsRejectionModalOpen(false);
//       setSelectedInvoice(null);
//     } catch (error: any) {
//       console.error("Failed to reject invoice:", error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to reject invoice",
//         variant: "destructive",
//       });
//     } finally {
//       setRejectionLoading(false);
//     }
//   }

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

//   function getCurrentStep(status: string): string {
//     switch (status) {
//       case "pending_operational_admin":
//         return "Operational Admin Review";
//       case "pending_main_admin":
//         return "Main Admin Approval";
//       case "pending_finance":
//         return "Finance Approval";
//       case "approved":
//         return "Ready for Payment";
//       case "payment_released":
//         return "Payment Released";
//       case "rejected":
//         return "Rejected";
//       default:
//         return "Unknown";
//     }
//   }

//   function canApprove(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;
    
//     switch (userProfile.role) {
//       case "operational_admin":
//         return invoice.status === "pending_operational_admin";
//       case "main_admin":
//         return invoice.status === "pending_main_admin";
//       case "finance":
//       case "financial_admin":
//         return invoice.status === "pending_finance";
//       default:
//         return false;
//     }
//   }

//   function canEdit(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;
    
//     // Operation users can edit items that were rejected and sent back
//     return userProfile.role === "operation" && invoice.status === "pending_operational_admin";
//   }

//   function canReleasePayment(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;
//     return (
//       (userProfile.role === "finance" || userProfile.role === "financial_admin") &&
//       invoice.status === "approved"
//     );
//   }

//   function canSubmitExpense(invoice: InvoiceRequest): boolean {
//     if (!userProfile) return false;
//     if (userProfile.role !== "operation" || invoice.status !== "payment_released") {
//       return false;
//     }
    
//     // Check if expense sheet already exists for this invoice
//     const hasExpenseSheet = expenseSheets?.some(expense => 
//       expense.linkedRequestId === invoice.requestId
//     );
    
//     return !hasExpenseSheet;
//   }

//   function getExpenseSheetStatus(invoice: InvoiceRequest): string | null {
//     if (!expenseSheets) return null;
    
//     const expenseSheet = expenseSheets.find(expense => 
//       expense.linkedRequestId === invoice.requestId
//     );
    
//     return expenseSheet?.status || null;
//   }

//   const canCreateInvoices = userProfile?.role === "operation";

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
//       </div>
//     );
//   }

//   return (
//     <div>
//       <div className="mb-8">
//         <div className="flex items-center justify-between">
//           <h2 className="text-3xl font-bold text-foreground" data-testid="text-invoices-title">Invoice Requests</h2>
//           {canCreateInvoices && (
//             <Button
//               onClick={() => {
//                 setSelectedInvoice(null); // Clear for new creation
//                 setIsInvoiceModalOpen(true);
//               }}
//               data-testid="button-new-invoice-request"
//             >
//               <i className="fas fa-plus mr-2"></i>+ New Request
//             </Button>
//           )}
//         </div>
//       </div>

//       {/* Workflow Progress */}
//       <Card className="mb-6">
//         <CardContent className="p-6">
//           <h3 className="text-lg font-semibold text-foreground mb-4">Approval Workflow</h3>
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-8">
//               <div className="flex flex-col items-center">
//                 <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">1</div>
//                 <span className="text-sm font-medium text-foreground mt-2">Operation</span>
//                 <span className="text-xs text-muted-foreground">Create Request</span>
//               </div>
//               <div className="flex-1 h-0.5 bg-border"></div>
//               <div className="flex flex-col items-center">
//                 <div className="w-12 h-12 bg-muted text-muted-foreground rounded-full flex items-center justify-center font-semibold">2</div>
//                 <span className="text-sm font-medium text-foreground mt-2">Op. Admin</span>
//                 <span className="text-xs text-muted-foreground">Initial Review</span>
//               </div>
//               <div className="flex-1 h-0.5 bg-border"></div>
//               <div className="flex flex-col items-center">
//                 <div className="w-12 h-12 bg-muted text-muted-foreground rounded-full flex items-center justify-center font-semibold">3</div>
//                 <span className="text-sm font-medium text-foreground mt-2">Main Admin</span>
//                 <span className="text-xs text-muted-foreground">Final Approval</span>
//               </div>
//               <div className="flex-1 h-0.5 bg-border"></div>
//               <div className="flex flex-col items-center">
//                 <div className="w-12 h-12 bg-muted text-muted-foreground rounded-full flex items-center justify-center font-semibold">4</div>
//                 <span className="text-sm font-medium text-foreground mt-2">Finance</span>
//                 <span className="text-xs text-muted-foreground">Payment Release</span>
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Invoices Table */}
//       <Card>
//         <CardContent className="p-0">
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-muted border-b border-border">
//                 <tr>
//                   <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Request ID</th>
//                   <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Client/Tittle</th>
//                   <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Total Amount</th>
//                   <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Status</th>
//                   <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Current Step</th>
//                   <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-border">
//                 {invoices.length === 0 ? (
//                   <tr>
//                     <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
//                       No invoice requests found
//                     </td>
//                   </tr>
//                 ) : (
//                   invoices.map((invoice) => (
//                     <tr key={invoice.id} className="hover:bg-muted/50 transition-colors">
//                       <td className="px-6 py-4 text-sm font-medium text-foreground" data-testid={`text-request-id-${invoice.id}`}>
//                         {invoice.requestId}
//                       </td>
//                       <td className="px-6 py-4 text-sm text-foreground">{invoice.clientName}</td>
//                       <td className="px-6 py-4 text-sm text-foreground">
//                         Rs {invoice.totalAmount?.toLocaleString() || '0'}
//                       </td>
//                       <td className="px-6 py-4">
//                         <Badge className={getStatusBadgeColor(invoice.status)}>
//                           {invoice.status.replace('_', ' ').replace('pending ', '')}
//                         </Badge>
//                       </td>
//                       <td className="px-6 py-4 text-sm text-muted-foreground">
//                         {getCurrentStep(invoice.status)}
//                       </td>
//                       <td className="px-6 py-4">
//                         <div className="flex space-x-2">
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             className="text-gray-600 hover:text-gray-700"
//                             onClick={() => {
//                               setSelectedInvoice(invoice);
//                               setIsDetailsModalOpen(true);
//                             }}
//                             data-testid={`button-view-details-${invoice.id}`}
//                           >
//                             <i className="fas fa-eye mr-1"></i>View Details
//                           </Button>
//                           {canEdit(invoice) && (
//                             <Button
//                               variant="ghost"
//                               size="sm"
//                               className="text-blue-600 hover:text-blue-700"
//                               onClick={() => {
//                                 setSelectedInvoice(invoice);
//                                 setIsInvoiceModalOpen(true);
//                               }}
//                               data-testid={`button-edit-${invoice.id}`}
//                             >
//                               <i className="fas fa-edit mr-1"></i>Edit & Resubmit
//                             </Button>
//                           )}
//                           {canApprove(invoice) && (
//                             <>
//                               <Button
//                                 variant="ghost"
//                                 size="sm"
//                                 className="text-green-600 hover:text-green-700"
//                                 onClick={() => handleApprove(invoice)}
//                                 data-testid={`button-approve-${invoice.id}`}
//                               >
//                                 <i className="fas fa-check mr-1"></i>Approve
//                               </Button>
//                               <Button
//                                 variant="ghost"
//                                 size="sm"
//                                 className="text-red-600 hover:text-red-700"
//                                 onClick={() => {
//                                   setSelectedInvoice(invoice);
//                                   setIsRejectionModalOpen(true);
//                                 }}
//                                 data-testid={`button-reject-${invoice.id}`}
//                               >
//                                 <i className="fas fa-times mr-1"></i>Reject
//                               </Button>
//                             </>
//                           )}
//                           {canReleasePayment(invoice) && (
//                             <Button
//                               variant="ghost"
//                               size="sm"
//                               className="text-blue-600 hover:text-blue-700"
//                               onClick={() => {
//                                 setSelectedInvoice({
//                                   ...invoice,
//                                   invoiceNumber: invoice.requestId,
//                                   vendorName: invoice.clientName,
//                                   amount: invoice.totalAmount,
//                                   dueDate: new Date()
//                                 } as any);
//                                 setIsPaymentModalOpen(true);
//                               }}
//                               data-testid={`button-release-payment-${invoice.id}`}
//                             >
//                               <i className="fas fa-money-bill-wave mr-1"></i>Release Payment
//                             </Button>
//                           )}
//                           {userProfile?.role === "operation" && invoice.status === "payment_released" && (
//                             <>
//                               {canSubmitExpense(invoice) ? (
//                                 <Button
//                                   variant="ghost"
//                                   size="sm"
//                                   className="text-purple-600 hover:text-purple-700"
//                                   onClick={() => {
//                                     setSelectedInvoice({
//                                       ...invoice,
//                                       invoiceNumber: invoice.requestId,
//                                       amount: invoice.totalAmount
//                                     } as any);
//                                     setIsExpenseModalOpen(true);
//                                   }}
//                                   data-testid={`button-submit-expense-${invoice.id}`}
//                                 >
//                                   <i className="fas fa-receipt mr-1"></i>Submit Expense
//                                 </Button>
//                               ) : (
//                                 <div className="text-sm text-muted-foreground" data-testid={`text-expense-status-${invoice.id}`}>
//                                   <i className="fas fa-clock mr-1"></i>
//                                   {getExpenseSheetStatus(invoice) === "acknowledged" 
//                                     ? "Expense Sheet Acknowledged"
//                                     : getExpenseSheetStatus(invoice) === "rejected"
//                                     ? "Expense Sheet Rejected"
//                                     : "Waiting for Admin Approval"}
//                                 </div>
//                               )}
//                             </>
//                           )}
//                         </div>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Modals */}
//       <InvoiceRequestModal
//         isOpen={isInvoiceModalOpen}
//         onClose={() => {
//           setIsInvoiceModalOpen(false);
//           setSelectedInvoice(null);
//         }}
//         onSuccess={() => {
//           setIsInvoiceModalOpen(false);
//           setSelectedInvoice(null);
//         }}
//         editingInvoice={selectedInvoice}
//       />

//       <PaymentReleaseModal
//         isOpen={isPaymentModalOpen}
//         onClose={() => {
//           setIsPaymentModalOpen(false);
//           setSelectedInvoice(null);
//         }}
//         onSuccess={() => {
//           setIsPaymentModalOpen(false);
//           setSelectedInvoice(null);
//         }}
//         invoice={selectedInvoice}
//       />

//       {selectedInvoice && (
//         <ExpenseSheetModal
//           isOpen={isExpenseModalOpen}
//           onClose={() => {
//             setIsExpenseModalOpen(false);
//             setSelectedInvoice(null);
//           }}
//           onSuccess={() => {
//             setIsExpenseModalOpen(false);
//             setSelectedInvoice(null);
//           }}
//         />
//       )}

//       <InvoiceDetailsModal
//         isOpen={isDetailsModalOpen}
//         onClose={() => {
//           setIsDetailsModalOpen(false);
//           setSelectedInvoice(null);
//         }}
//         invoice={selectedInvoice}
//       />

//       <RejectionModal
//         isOpen={isRejectionModalOpen}
//         onClose={() => {
//           setIsRejectionModalOpen(false);
//           setSelectedInvoice(null);
//         }}
//         onConfirm={(comment) => selectedInvoice && handleReject(selectedInvoice, comment)}
//         itemType="invoice request"
//         loading={rejectionLoading}
//       />
//     </div>
//   );
// }







import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFirestoreQuery } from "@/hooks/useFirestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import InvoiceRequestModal from "@/components/InvoiceRequestModal";
import PaymentReleaseModal from "@/components/PaymentReleaseModal";
import ExpenseSheetModal from "@/components/ExpenseSheetModal";
import InvoiceDetailsModal from "@/components/InvoiceDetailsModal";
import { InvoiceRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import RejectionModal from "@/components/RejectionModal";

function formatPKR(value: number | string | undefined) {
  if (value === null || value === undefined) return "0.00";
  const num = typeof value === "number" ? value : parseFloat(String(value).replace(/,/g, "")) || 0;
  return num.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function InvoiceRequests() {
  const PANEL_ID = "IEDGE-SYSTEM";

  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRequest | null>(null);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionLoading, setRejectionLoading] = useState(false);

  const { data: invoices, loading } = useFirestoreQuery<InvoiceRequest>(
    `Panels/${PANEL_ID}/invoiceRequests`
  );

  const { data: expenseSheets } = useFirestoreQuery<any>(`Panels/${PANEL_ID}/expenseSheets`);

  async function handleApprove(invoice: InvoiceRequest) {
    if (!userProfile) return;

    try {
      let newStatus = invoice.status;
      let currentApprover = "";

      switch (userProfile.role) {
        case "operational_admin":
          if (invoice.status === "pending_operational_admin") newStatus = "pending_main_admin";
          break;
        case "main_admin":
          if (invoice.status === "pending_main_admin") newStatus = "pending_finance";
          break;
        case "finance":
        case "financial_admin":
          if (invoice.status === "pending_finance") newStatus = "approved";
          break;
      }

      await updateDoc(doc(db, "Panels", PANEL_ID, "invoiceRequests", invoice.id), {
        status: newStatus,
        currentApprover,
        approvalHistory: [
          ...(invoice.approvalHistory || []),
          {
            approver: userProfile.displayName,
            action: "approved",
            timestamp: new Date(),
            notes: "",
          },
        ],
        updatedAt: serverTimestamp(),
      });

      toast({ title: "Success", description: "Invoice approved successfully" });
    } catch (error: any) {
      console.error("Failed to approve invoice:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve invoice",
        variant: "destructive",
      });
    }
  }

  async function handleReject(invoice: InvoiceRequest, rejectionComment: string) {
    if (!userProfile) return;

    try {
      setRejectionLoading(true);

      await updateDoc(doc(db, "Panels", PANEL_ID, "invoiceRequests", invoice.id), {
        status: "pending_operational_admin",
        approvalHistory: [
          ...(invoice.approvalHistory || []),
          {
            approver: userProfile.displayName,
            action: "rejected",
            timestamp: new Date(),
            notes: rejectionComment,
          },
        ],
        updatedAt: serverTimestamp(),
      });

      toast({ title: "Success", description: "Invoice rejected with comments" });

      setIsRejectionModalOpen(false);
      setSelectedInvoice(null);
    } catch (error: any) {
      console.error("Failed to reject invoice:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject invoice",
        variant: "destructive",
      });
    } finally {
      setRejectionLoading(false);
    }
  }

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

  function getCurrentStep(status: string): string {
    switch (status) {
      case "pending_operational_admin":
        return "Operational Admin Review";
      case "pending_main_admin":
        return "Main Admin Approval";
      case "pending_finance":
        return "Finance Approval";
      case "approved":
        return "Ready for Payment";
      case "payment_released":
        return "Payment Released";
      case "rejected":
        return "Rejected";
      default:
        return "Unknown";
    }
  }

  function canApprove(invoice: InvoiceRequest): boolean {
    if (!userProfile) return false;

    switch (userProfile.role) {
      case "operational_admin":
        return invoice.status === "pending_operational_admin";
      case "main_admin":
        return invoice.status === "pending_main_admin";
      case "finance":
      case "financial_admin":
        return invoice.status === "pending_finance";
      default:
        return false;
    }
  }

  function canEdit(invoice: InvoiceRequest): boolean {
    if (!userProfile) return false;
    return userProfile.role === "operation" && invoice.status === "pending_operational_admin";
  }

  function canReleasePayment(invoice: InvoiceRequest): boolean {
    if (!userProfile) return false;
    return (
      (userProfile.role === "finance" || userProfile.role === "financial_admin") &&
      invoice.status === "approved"
    );
  }

  function canSubmitExpense(invoice: InvoiceRequest): boolean {
    if (!userProfile) return false;
    if (userProfile.role !== "operation" || invoice.status !== "payment_released") return false;

    const hasExpenseSheet = expenseSheets?.some((expense: any) => expense.linkedRequestId === invoice.requestId);
    return !hasExpenseSheet;
  }

  function getExpenseSheetStatus(invoice: InvoiceRequest): string | null {
    if (!expenseSheets) return null;
    const expenseSheet = expenseSheets.find((expense: any) => expense.linkedRequestId === invoice.requestId);
    return expenseSheet?.status || null;
  }

  const canCreateInvoices = userProfile?.role === "operation";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-foreground" data-testid="text-invoices-title">
            Invoice Requests
          </h2>

          {canCreateInvoices && (
            <Button
              onClick={() => {
                setSelectedInvoice(null);
                setIsInvoiceModalOpen(true);
              }}
              data-testid="button-new-invoice-request"
            >
              <i className="fas fa-plus mr-2"></i>+ New Request
            </Button>
          )}
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Approval Workflow</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
                <span className="text-sm font-medium text-foreground mt-2">Operation</span>
                <span className="text-xs text-muted-foreground">Create Request</span>
              </div>
              <div className="flex-1 h-0.5 bg-border"></div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-muted text-muted-foreground rounded-full flex items-center justify-center font-semibold">
                  2
                </div>
                <span className="text-sm font-medium text-foreground mt-2">Op. Admin</span>
                <span className="text-xs text-muted-foreground">Initial Review</span>
              </div>
              <div className="flex-1 h-0.5 bg-border"></div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-muted text-muted-foreground rounded-full flex items-center justify-center font-semibold">
                  3
                </div>
                <span className="text-sm font-medium text-foreground mt-2">Main Admin</span>
                <span className="text-xs text-muted-foreground">Final Approval</span>
              </div>
              <div className="flex-1 h-0.5 bg-border"></div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-muted text-muted-foreground rounded-full flex items-center justify-center font-semibold">
                  4
                </div>
                <span className="text-sm font-medium text-foreground mt-2">Finance</span>
                <span className="text-xs text-muted-foreground">Payment Release</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Request ID</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Client/Title</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Total Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Current Step</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      No invoice requests found
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => {
                    const type =
                      ((invoice as any).invoiceType as "general" | "project") ||
                      (invoice.clientName ? "project" : "general");

                    const displayClientOrTitle =
                      type === "general" ? (invoice as any).title || "-" : invoice.clientName || "-";

                    return (
                      <tr key={invoice.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-foreground" data-testid={`text-request-id-${invoice.id}`}>
                          {invoice.requestId}
                        </td>

                        <td className="px-6 py-4 text-sm text-foreground">{displayClientOrTitle}</td>

                        <td className="px-6 py-4 text-sm text-foreground">
                          Rs {formatPKR(invoice.totalAmount)}
                        </td>

                        <td className="px-6 py-4">
                          <Badge className={getStatusBadgeColor(invoice.status)}>
                            {invoice.status.replace("_", " ").replace("pending ", "")}
                          </Badge>
                        </td>

                        <td className="px-6 py-4 text-sm text-muted-foreground">{getCurrentStep(invoice.status)}</td>

                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-600 hover:text-gray-700"
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setIsDetailsModalOpen(true);
                              }}
                              data-testid={`button-view-details-${invoice.id}`}
                            >
                              <i className="fas fa-eye mr-1"></i>View Details
                            </Button>

                            {canEdit(invoice) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700"
                                onClick={() => {
                                  setSelectedInvoice(invoice);
                                  setIsInvoiceModalOpen(true);
                                }}
                                data-testid={`button-edit-${invoice.id}`}
                              >
                                <i className="fas fa-edit mr-1"></i>Edit & Resubmit
                              </Button>
                            )}

                            {canApprove(invoice) && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => handleApprove(invoice)}
                                  data-testid={`button-approve-${invoice.id}`}
                                >
                                  <i className="fas fa-check mr-1"></i>Approve
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setIsRejectionModalOpen(true);
                                  }}
                                  data-testid={`button-reject-${invoice.id}`}
                                >
                                  <i className="fas fa-times mr-1"></i>Reject
                                </Button>
                              </>
                            )}

                            {canReleasePayment(invoice) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700"
                                onClick={() => {
                                  setSelectedInvoice({
                                    ...invoice,
                                    invoiceNumber: invoice.requestId,
                                    vendorName: invoice.clientName,
                                    amount: invoice.totalAmount,
                                    dueDate: new Date(),
                                  } as any);
                                  setIsPaymentModalOpen(true);
                                }}
                                data-testid={`button-release-payment-${invoice.id}`}
                              >
                                <i className="fas fa-money-bill-wave mr-1"></i>Release Payment
                              </Button>
                            )}

                            {userProfile?.role === "operation" && invoice.status === "payment_released" && (
                              <>
                                {canSubmitExpense(invoice) ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-purple-600 hover:text-purple-700"
                                    onClick={() => {
                                      setSelectedInvoice({
                                        ...invoice,
                                        invoiceNumber: invoice.requestId,
                                        amount: invoice.totalAmount,
                                      } as any);
                                      setIsExpenseModalOpen(true);
                                    }}
                                    data-testid={`button-submit-expense-${invoice.id}`}
                                  >
                                    <i className="fas fa-receipt mr-1"></i>Submit Expense
                                  </Button>
                                ) : (
                                  <div className="text-sm text-muted-foreground" data-testid={`text-expense-status-${invoice.id}`}>
                                    <i className="fas fa-clock mr-1"></i>
                                    {getExpenseSheetStatus(invoice) === "acknowledged"
                                      ? "Expense Sheet Acknowledged"
                                      : getExpenseSheetStatus(invoice) === "rejected"
                                      ? "Expense Sheet Rejected"
                                      : "Waiting for Admin Approval"}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <InvoiceRequestModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedInvoice(null);
        }}
        onSuccess={() => {
          setIsInvoiceModalOpen(false);
          setSelectedInvoice(null);
        }}
        editingInvoice={selectedInvoice}
      />

      <PaymentReleaseModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedInvoice(null);
        }}
        onSuccess={() => {
          setIsPaymentModalOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
      />

      {selectedInvoice && (
        <ExpenseSheetModal
          isOpen={isExpenseModalOpen}
          onClose={() => {
            setIsExpenseModalOpen(false);
            setSelectedInvoice(null);
          }}
          onSuccess={() => {
            setIsExpenseModalOpen(false);
            setSelectedInvoice(null);
          }}
        />
      )}

      <InvoiceDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
      />

      <RejectionModal
        isOpen={isRejectionModalOpen}
        onClose={() => {
          setIsRejectionModalOpen(false);
          setSelectedInvoice(null);
        }}
        onConfirm={(comment) => selectedInvoice && handleReject(selectedInvoice, comment)}
        itemType="invoice request"
        loading={rejectionLoading}
      />
    </div>
  );
}

