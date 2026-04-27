
// import { useEffect, useState } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import {
//   doc,
//   updateDoc,
//   serverTimestamp,
//   collection,
//   getDocs,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { useFirestoreQuery } from "@/hooks/useFirestore";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { ExpenseSheet } from "@shared/schema";
// import { useToast } from "@/hooks/use-toast";
// import ExpenseSheetModal from "@/components/ExpenseSheetModal";
// import ExpenseDetailsModal from "@/components/ExpenseDetailsModal";
// import RejectionModal from "@/components/RejectionModal";

// interface ReimbursementExpenseRow {
//   id: string;
//   recordId: string;
//   clientName: string;
//   projectName: string;
//   salesPerson: string;
//   amount: number;
//   fuelKm: number;
//   details: string;
//   submittedDate: any;
//   approvalStatus: string;
//   paymentStatus: string;
//   approvedBy: string;
//   paidBy: string;
//   billUrl: string;
// }

// export default function ExpenseSheets() {
//   const PANEL_ID = "IEDGE-SYSTEM";

//   const { userProfile } = useAuth();
//   const { toast } = useToast();

//   const [activeSubTab, setActiveSubTab] = useState<
//     "budget_expense" | "reimbursement_expense"
//   >("budget_expense");

//   const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
//   const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
//   const [selectedExpense, setSelectedExpense] = useState<ExpenseSheet | null>(
//     null
//   );
//   const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
//   const [rejectionLoading, setRejectionLoading] = useState(false);

//   const [reimbursementExpenses, setReimbursementExpenses] = useState<
//     ReimbursementExpenseRow[]
//   >([]);
//   const [reimbursementLoading, setReimbursementLoading] = useState(false);

//   const { data: expenseSheets, loading } = useFirestoreQuery<ExpenseSheet>(
//     `Panels/${PANEL_ID}/expenseSheets`
//   );

//   function canCreateExpenseSheets(): boolean {
//     return userProfile?.role === "operation";
//   }

//   async function fetchReimbursementExpenses() {
//     try {
//       setReimbursementLoading(true);

//       const salesRecordsSnap = await getDocs(
//         collection(db, "Panels", PANEL_ID, "salesRecords")
//       );

//       const allRows: ReimbursementExpenseRow[] = [];

//       for (const salesRecordDoc of salesRecordsSnap.docs) {
//         const salesRecordData: any = salesRecordDoc.data();
//         const recordId = salesRecordDoc.id;

//         const meetingUpdatesSnap = await getDocs(
//           collection(
//             db,
//             "Panels",
//             PANEL_ID,
//             "salesRecords",
//             recordId,
//             "meetingUpdates"
//           )
//         );

//         meetingUpdatesSnap.docs.forEach((meetingDoc) => {
//           const meetingData: any = meetingDoc.data();
//           const reimbursement = meetingData?.reimbursement;

//           if (!reimbursement?.enabled) return;

//           allRows.push({
//             id: meetingDoc.id,
//             recordId,
//             clientName: salesRecordData?.client || "Unknown",
//             projectName: salesRecordData?.projectName || "N/A",
//             salesPerson:
//               reimbursement?.approvalSubmittedByName ||
//               reimbursement?.personName ||
//               "Unknown",
//             amount: Number(reimbursement?.amount || 0),
//             fuelKm: Number(reimbursement?.kms || 0),
//             details: reimbursement?.detail || "N/A",
//             submittedDate:
//               reimbursement?.meetingDate ||
//               reimbursement?.createdAt ||
//               reimbursement?.date ||
//               null,
//             approvalStatus: String(
//               reimbursement?.approvalStatus || "pending_admin_approval"
//             ),
//             paymentStatus: String(reimbursement?.paymentStatus || "pending"),
//             approvedBy: reimbursement?.approvedBy || "",
//             paidBy: reimbursement?.paidBy || "",
//             billUrl: reimbursement?.billUrl || "",
//           });
//         });
//       }

//       allRows.sort((a, b) => {
//         const aTime = getSortableTime(a.submittedDate);
//         const bTime = getSortableTime(b.submittedDate);
//         return bTime - aTime;
//       });

//       setReimbursementExpenses(allRows);
//     } catch (error: any) {
//       console.error("Failed to fetch reimbursement expenses:", error);
//       toast({
//         title: "Error",
//         description:
//           error?.message || "Failed to load reimbursement expenses",
//         variant: "destructive",
//       });
//     } finally {
//       setReimbursementLoading(false);
//     }
//   }

//   useEffect(() => {
//     fetchReimbursementExpenses();
//   }, []);

//   async function handleApprove(expense: ExpenseSheet) {
//     if (!userProfile) return;

//     try {
//       let newStatus = expense.status;
//       let currentApprover = "";

//       switch (userProfile.role) {
//         case "operational_admin":
//           if (expense.status === "pending_operational_admin") {
//             newStatus = "pending_main_admin";
//           }
//           break;
//         case "main_admin":
//           if (expense.status === "pending_main_admin") {
//             newStatus = "approved";
//           }
//           break;
//         case "finance":
//         case "financial_admin":
//           if (expense.status === "approved") {
//             newStatus = "acknowledged";
//           }
//           break;
//       }

//       const updateData: any = {
//         status: newStatus,
//         currentApprover,
//         approvalHistory: [
//           ...(expense.approvalHistory || []),
//           {
//             approver: userProfile.displayName,
//             action: "approved",
//             timestamp: new Date(),
//             notes: "",
//           },
//         ],
//         updatedAt: serverTimestamp(),
//       };

//       if (newStatus === "acknowledged") {
//         updateData.acknowledgedBy = userProfile.displayName;
//         updateData.acknowledgedAt = serverTimestamp();
//       }

//       await updateDoc(
//         doc(db, "Panels", PANEL_ID, "expenseSheets", expense.id),
//         updateData
//       );

//       toast({
//         title: "Success",
//         description: "Expense sheet approved successfully",
//       });
//     } catch (error: any) {
//       console.error("Failed to approve expense sheet:", error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to approve expense sheet",
//         variant: "destructive",
//       });
//     }
//   }

//   async function handleReject(expense: ExpenseSheet, rejectionComment: string) {
//     if (!userProfile) return;

//     try {
//       setRejectionLoading(true);

//       await updateDoc(doc(db, "Panels", PANEL_ID, "expenseSheets", expense.id), {
//         status: "pending_operational_admin",
//         approvalHistory: [
//           ...(expense.approvalHistory || []),
//           {
//             approver: userProfile.displayName,
//             action: "rejected",
//             timestamp: new Date(),
//             notes: rejectionComment,
//           },
//         ],
//         updatedAt: serverTimestamp(),
//       });

//       toast({
//         title: "Success",
//         description: "Expense sheet rejected with comments",
//       });

//       setIsRejectionModalOpen(false);
//       setSelectedExpense(null);
//     } catch (error: any) {
//       console.error("Failed to reject expense sheet:", error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to reject expense sheet",
//         variant: "destructive",
//       });
//     } finally {
//       setRejectionLoading(false);
//     }
//   }

//   function canApprove(expense: ExpenseSheet): boolean {
//     if (!userProfile) return false;

//     switch (userProfile.role) {
//       case "operational_admin":
//         return expense.status === "pending_operational_admin";
//       case "main_admin":
//         return expense.status === "pending_main_admin";
//       case "finance":
//       case "financial_admin":
//         return expense.status === "approved";
//       default:
//         return false;
//     }
//   }

//   function canEdit(expense: ExpenseSheet): boolean {
//     if (!userProfile) return false;

//     return (
//       userProfile.role === "operation" &&
//       expense.status === "pending_operational_admin"
//     );
//   }

//   function getCurrentStep(status: string): string {
//     switch (status) {
//       case "pending_operational_admin":
//         return "Operational Admin Review";
//       case "pending_main_admin":
//         return "Main Admin Approval";
//       case "approved":
//         return "Finance Acknowledgment";
//       case "acknowledged":
//         return "Acknowledged";
//       case "rejected":
//         return "Rejected";
//       default:
//         return "Unknown";
//     }
//   }

//   function getStatusBadgeColor(status: string): string {
//     switch (status) {
//       case "acknowledged":
//       case "paid":
//         return "bg-green-100 text-green-800";
//       case "rejected":
//         return "bg-red-100 text-red-800";
//       case "pending_operational_admin":
//       case "pending_main_admin":
//       case "approved":
//       case "pending":
//       case "pending_admin_approval":
//         return "bg-yellow-100 text-yellow-800";
//       default:
//         return "bg-blue-100 text-blue-800";
//     }
//   }

//   function getSortableTime(date: any) {
//     if (!date) return 0;

//     try {
//       if (date?.toDate) return date.toDate().getTime();
//       if (date?.seconds) return date.seconds * 1000;

//       const parsed = new Date(date);
//       if (!isNaN(parsed.getTime())) return parsed.getTime();

//       return 0;
//     } catch {
//       return 0;
//     }
//   }

//   function formatDate(date: any) {
//     if (!date) return "N/A";

//     try {
//       if (date?.toDate) return date.toDate().toLocaleDateString();

//       if (date?.seconds) {
//         return new Date(date.seconds * 1000).toLocaleDateString();
//       }

//       const parsed = new Date(date);
//       if (!isNaN(parsed.getTime())) {
//         return parsed.toLocaleDateString();
//       }

//       return "Invalid";
//     } catch {
//       return "Invalid";
//     }
//   }

//   function formatReimbursementStatusLabel(value?: string) {
//     const raw = String(value || "").trim();
//     if (!raw) return "Pending";

//     return raw
//       .replace(/_/g, " ")
//       .split(" ")
//       .filter(Boolean)
//       .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
//       .join(" ");
//   }

//   if (loading || reimbursementLoading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
//       </div>
//     );
//   }

//   return (
//     <div>
//       <div className="mb-8">
//         <div className="flex justify-between items-start">
//           <div>
//             <h2
//               className="text-3xl font-bold text-foreground mb-2"
//               data-testid="text-expenses-title"
//             >
//               Expense Sheets
//             </h2>
//             <p className="text-muted-foreground">
//               Manage budget expenses and reimbursement expenses separately.
//             </p>
//           </div>

//           {activeSubTab === "budget_expense" && canCreateExpenseSheets() && (
//             <Button
//               onClick={() => {
//                 setSelectedExpense(null);
//                 setIsExpenseModalOpen(true);
//               }}
//               className="bg-green-600 hover:bg-green-700 text-white"
//               data-testid="button-create-expense-sheet"
//             >
//               <i className="fas fa-plus mr-2"></i>
//               Create New Expense Sheet
//             </Button>
//           )}
//         </div>
//       </div>

//       <div className="mb-6 flex gap-3">
//         <Button
//           type="button"
//           variant={activeSubTab === "budget_expense" ? "default" : "outline"}
//           onClick={() => setActiveSubTab("budget_expense")}
//         >
//           Budget Expense
//         </Button>

//         <Button
//           type="button"
//           variant={
//             activeSubTab === "reimbursement_expense" ? "default" : "outline"
//           }
//           onClick={() => setActiveSubTab("reimbursement_expense")}
//         >
//           Reimbursement Expense
//         </Button>
//       </div>

//       {activeSubTab === "budget_expense" && (
//         <Card>
//           <CardContent className="p-0">
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className="bg-muted border-b border-border">
//                   <tr>
//                     <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
//                       Client
//                     </th>
//                     <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
//                       Linked Request
//                     </th>
//                     <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
//                       Total Amount
//                     </th>
//                     <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
//                       Current Step
//                     </th>
//                     <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
//                       Status
//                     </th>
//                     <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
//                       Actions
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-border">
//                   {expenseSheets.length === 0 ? (
//                     <tr>
//                       <td
//                         colSpan={6}
//                         className="px-6 py-8 text-center text-muted-foreground"
//                       >
//                         No budget expenses found
//                       </td>
//                     </tr>
//                   ) : (
//                     expenseSheets.map((expense) => (
//                       <tr
//                         key={expense.id}
//                         className="hover:bg-muted/50 transition-colors"
//                       >
//                         <td
//                           className="px-6 py-4 text-sm font-medium text-foreground"
//                           data-testid={`text-expense-client-${expense.id}`}
//                         >
//                           {expense.clientName}
//                         </td>
//                         <td className="px-6 py-4 text-sm text-primary">
//                           {expense.linkedRequestId || "Independent"}
//                         </td>
//                         <td className="px-6 py-4 text-sm text-foreground">
//                           ${expense.totalAmount.toLocaleString()}
//                         </td>
//                         <td className="px-6 py-4 text-sm text-muted-foreground">
//                           {getCurrentStep(expense.status)}
//                         </td>
//                         <td className="px-6 py-4">
//                           <Badge className={getStatusBadgeColor(expense.status)}>
//                             {expense.status.replace(/_/g, " ")}
//                           </Badge>
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="flex space-x-2">
//                             <Button
//                               variant="ghost"
//                               size="sm"
//                               className="text-gray-600 hover:text-gray-700"
//                               onClick={() => {
//                                 setSelectedExpense(expense);
//                                 setIsDetailsModalOpen(true);
//                               }}
//                               data-testid={`button-view-details-${expense.id}`}
//                             >
//                               <i className="fas fa-eye mr-1"></i>View Details
//                             </Button>

//                             {expense.expenseDocuments &&
//                               expense.expenseDocuments.length > 0 && (
//                                 <Button
//                                   variant="ghost"
//                                   size="sm"
//                                   className="text-primary hover:text-primary/80"
//                                   onClick={() => {
//                                     expense.expenseDocuments?.forEach(
//                                       (url, index) => {
//                                         setTimeout(
//                                           () => window.open(url, "_blank"),
//                                           index * 100
//                                         );
//                                       }
//                                     );
//                                   }}
//                                   data-testid={`button-view-documents-${expense.id}`}
//                                 >
//                                   <i className="fas fa-file mr-1"></i>Documents
//                                 </Button>
//                               )}

//                             {canEdit(expense) && (
//                               <Button
//                                 variant="ghost"
//                                 size="sm"
//                                 className="text-blue-600 hover:text-blue-700"
//                                 onClick={() => {
//                                   setSelectedExpense(expense);
//                                   setIsExpenseModalOpen(true);
//                                 }}
//                                 data-testid={`button-edit-expense-${expense.id}`}
//                               >
//                                 <i className="fas fa-edit mr-1"></i>Edit &
//                                 Resubmit
//                               </Button>
//                             )}

//                             {canApprove(expense) && (
//                               <>
//                                 <Button
//                                   variant="ghost"
//                                   size="sm"
//                                   className="text-green-600 hover:text-green-700"
//                                   onClick={() => handleApprove(expense)}
//                                   data-testid={`button-approve-expense-${expense.id}`}
//                                 >
//                                   <i className="fas fa-check mr-1"></i>
//                                   {expense.status === "approved"
//                                     ? "Acknowledge"
//                                     : "Approve"}
//                                 </Button>
//                                 <Button
//                                   variant="ghost"
//                                   size="sm"
//                                   className="text-red-600 hover:text-red-700"
//                                   onClick={() => {
//                                     setSelectedExpense(expense);
//                                     setIsRejectionModalOpen(true);
//                                   }}
//                                   data-testid={`button-reject-expense-${expense.id}`}
//                                 >
//                                   <i className="fas fa-times mr-1"></i>Reject
//                                 </Button>
//                               </>
//                             )}
//                           </div>
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </CardContent>
//         </Card>
//       )}

//       {activeSubTab === "reimbursement_expense" && (
//         <Card>
//           <CardContent className="p-0">
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className="bg-muted border-b border-border">
//                   <tr>
//                     <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
//                       Client
//                     </th>
//                     <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
//                       Project
//                     </th>
//                     <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
//                       Sales Person
//                     </th>
//                     <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
//                       Amount
//                     </th>
//                     <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
//                       Fuel KM
//                     </th>
//                     <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
//                       Details
//                     </th>
//                     <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
//                       Date
//                     </th>
//                     <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
//                       Approval Status
//                     </th>
//                     <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
//                       Payment Status
//                     </th>
//                     <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
//                       Bill
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-border">
//                   {reimbursementExpenses.length === 0 ? (
//                     <tr>
//                       <td
//                         colSpan={10}
//                         className="px-6 py-8 text-center text-muted-foreground"
//                       >
//                         No reimbursement expenses found
//                       </td>
//                     </tr>
//                   ) : (
//                     reimbursementExpenses.map((expense) => (
//                       <tr
//                         key={`${expense.recordId}-${expense.id}`}
//                         className="hover:bg-muted/50 transition-colors"
//                       >
//                         <td className="px-6 py-4 text-sm font-medium text-foreground">
//                           {expense.clientName}
//                         </td>
//                         <td className="px-6 py-4 text-sm text-foreground">
//                           {expense.projectName}
//                         </td>
//                         <td className="px-6 py-4 text-sm text-foreground">
//                           {expense.salesPerson}
//                         </td>
//                         <td className="px-6 py-4 text-sm text-foreground">
//                           Rs {expense.amount.toLocaleString()}
//                         </td>
//                         <td className="px-6 py-4 text-sm text-foreground">
//                           {expense.fuelKm}
//                         </td>
//                         <td className="px-6 py-4 text-sm text-foreground">
//                           {expense.details}
//                         </td>
//                         <td className="px-6 py-4 text-sm text-muted-foreground">
//                           {formatDate(expense.submittedDate)}
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="flex flex-col gap-1">
//                             <Badge
//                               className={getStatusBadgeColor(
//                                 expense.approvalStatus
//                               )}
//                             >
//                               {formatReimbursementStatusLabel(
//                                 expense.approvalStatus
//                               )}
//                             </Badge>
//                             {expense.approvedBy && (
//                               <span className="text-xs text-muted-foreground">
//                                 by {expense.approvedBy}
//                               </span>
//                             )}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="flex flex-col gap-1">
//                             <Badge
//                               className={getStatusBadgeColor(
//                                 expense.paymentStatus
//                               )}
//                             >
//                               {formatReimbursementStatusLabel(
//                                 expense.paymentStatus
//                               )}
//                             </Badge>
//                             {expense.paidBy && (
//                               <span className="text-xs text-muted-foreground">
//                                 by {expense.paidBy}
//                               </span>
//                             )}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4 text-sm">
//                           {expense.billUrl ? (
//                             <a
//                               href={expense.billUrl}
//                               target="_blank"
//                               rel="noreferrer"
//                               className="text-primary underline"
//                             >
//                               View Bill
//                             </a>
//                           ) : (
//                             <span className="text-muted-foreground">
//                               No Bill
//                             </span>
//                           )}
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </CardContent>
//         </Card>
//       )}

//       <ExpenseSheetModal
//         isOpen={isExpenseModalOpen}
//         onClose={() => {
//           setIsExpenseModalOpen(false);
//           setSelectedExpense(null);
//         }}
//         onSuccess={() => {
//           setIsExpenseModalOpen(false);
//           setSelectedExpense(null);
//         }}
//         editingExpense={selectedExpense}
//       />

//       <ExpenseDetailsModal
//         isOpen={isDetailsModalOpen}
//         onClose={() => {
//           setIsDetailsModalOpen(false);
//           setSelectedExpense(null);
//         }}
//         expense={selectedExpense}
//       />

//       <RejectionModal
//         isOpen={isRejectionModalOpen}
//         onClose={() => {
//           setIsRejectionModalOpen(false);
//           setSelectedExpense(null);
//         }}
//         onConfirm={(comment) =>
//           selectedExpense && handleReject(selectedExpense, comment)
//         }
//         itemType="expense sheet"
//         loading={rejectionLoading}
//       />
//     </div>
//   );
// }


// import { useEffect, useMemo, useState } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import {
//   doc,
//   updateDoc,
//   serverTimestamp,
//   collection,
//   getDocs,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { useFirestoreQuery } from "@/hooks/useFirestore";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { ExpenseSheet } from "@shared/schema";
// import { useToast } from "@/hooks/use-toast";
// import ExpenseSheetModal from "@/components/ExpenseSheetModal";
// import ExpenseDetailsModal from "@/components/ExpenseDetailsModal";
// import RejectionModal from "@/components/RejectionModal";

// interface ReimbursementExpenseRow {
//   id: string;
//   recordId: string;
//   clientName: string;
//   projectName: string;
//   salesPerson: string;
//   amount: number;
//   fuelKm: number;
//   details: string;
//   submittedDate: any;
//   approvalStatus: string;
//   paymentStatus: string;
//   approvedBy: string;
//   paidBy: string;
//   billUrl: string;
// }

// interface ReimbursementPersonGroup {
//   salesPerson: string;
//   totalAmount: number;
//   pendingAmount: number;
//   paidAmount: number;
//   pendingCount: number;
//   paidCount: number;
//   items: ReimbursementExpenseRow[];
// }

// export default function ExpenseSheets() {
//   const PANEL_ID = "IEDGE-SYSTEM";

//   const { userProfile } = useAuth();
//   const { toast } = useToast();

//   const [activeSubTab, setActiveSubTab] = useState<
//     "budget_expense" | "reimbursement_expense"
//   >("budget_expense");

//   const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
//   const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
//   const [selectedExpense, setSelectedExpense] = useState<ExpenseSheet | null>(
//     null
//   );
//   const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
//   const [rejectionLoading, setRejectionLoading] = useState(false);

//   const [reimbursementExpenses, setReimbursementExpenses] = useState<
//     ReimbursementExpenseRow[]
//   >([]);
//   const [reimbursementLoading, setReimbursementLoading] = useState(false);
//   const [selectedPersonFilter, setSelectedPersonFilter] = useState("all");

//   const { data: expenseSheets, loading } = useFirestoreQuery<ExpenseSheet>(
//     `Panels/${PANEL_ID}/expenseSheets`
//   );

//   function canCreateExpenseSheets(): boolean {
//     return userProfile?.role === "operation";
//   }

//   async function fetchReimbursementExpenses() {
//     try {
//       setReimbursementLoading(true);

//       const salesRecordsSnap = await getDocs(
//         collection(db, "Panels", PANEL_ID, "salesRecords")
//       );

//       const reimbursementPromises = salesRecordsSnap.docs.map(
//         async (salesRecordDoc) => {
//           const salesRecordData: any = salesRecordDoc.data();
//           const recordId = salesRecordDoc.id;

//           try {
//             const meetingUpdatesSnap = await getDocs(
//               collection(
//                 db,
//                 "Panels",
//                 PANEL_ID,
//                 "salesRecords",
//                 recordId,
//                 "meetingUpdates"
//               )
//             );

//             const rows: ReimbursementExpenseRow[] = [];

//             meetingUpdatesSnap.docs.forEach((meetingDoc) => {
//               const meetingData: any = meetingDoc.data();
//               const reimbursement = meetingData?.reimbursement;

//               if (!reimbursement?.enabled) return;

//               rows.push({
//                 id: meetingDoc.id,
//                 recordId,
//                 clientName: salesRecordData?.client || "Unknown",
//                 projectName: salesRecordData?.projectName || "N/A",
//                 salesPerson:
//                   reimbursement?.approvalSubmittedByName ||
//                   reimbursement?.personName ||
//                   "Unknown",
//                 amount: Number(reimbursement?.amount || 0),
//                 fuelKm: Number(reimbursement?.kms || 0),
//                 details: reimbursement?.detail || "N/A",
//                 submittedDate:
//                   reimbursement?.meetingDate ||
//                   reimbursement?.createdAt ||
//                   reimbursement?.date ||
//                   null,
//                 approvalStatus: String(
//                   reimbursement?.approvalStatus || "pending_admin_approval"
//                 ),
//                 paymentStatus: String(reimbursement?.paymentStatus || "pending"),
//                 approvedBy: reimbursement?.approvedBy || "",
//                 paidBy: reimbursement?.paidBy || "",
//                 billUrl: reimbursement?.billUrl || "",
//               });
//             });

//             return rows;
//           } catch (error) {
//             console.error(
//               `Failed to fetch meeting updates for sales record ${recordId}:`,
//               error
//             );
//             return [];
//           }
//         }
//       );

//       const results = await Promise.all(reimbursementPromises);
//       const allRows = results.flat();

//       allRows.sort((a, b) => {
//         const aTime = getSortableTime(a.submittedDate);
//         const bTime = getSortableTime(b.submittedDate);
//         return bTime - aTime;
//       });

//       setReimbursementExpenses(allRows);
//     } catch (error: any) {
//       console.error("Failed to fetch reimbursement expenses:", error);
//       toast({
//         title: "Error",
//         description:
//           error?.message || "Failed to load reimbursement expenses",
//         variant: "destructive",
//       });
//     } finally {
//       setReimbursementLoading(false);
//     }
//   }

//   useEffect(() => {
//     fetchReimbursementExpenses();
//   }, []);

//   async function handleApprove(expense: ExpenseSheet) {
//     if (!userProfile) return;

//     try {
//       let newStatus = expense.status;
//       let currentApprover = "";

//       switch (userProfile.role) {
//         case "operational_admin":
//           if (expense.status === "pending_operational_admin") {
//             newStatus = "pending_main_admin";
//           }
//           break;
//         case "main_admin":
//           if (expense.status === "pending_main_admin") {
//             newStatus = "approved";
//           }
//           break;
//         case "finance":
//         case "financial_admin":
//           if (expense.status === "approved") {
//             newStatus = "acknowledged";
//           }
//           break;
//       }

//       const updateData: any = {
//         status: newStatus,
//         currentApprover,
//         approvalHistory: [
//           ...(expense.approvalHistory || []),
//           {
//             approver: userProfile.displayName,
//             action: "approved",
//             timestamp: new Date(),
//             notes: "",
//           },
//         ],
//         updatedAt: serverTimestamp(),
//       };

//       if (newStatus === "acknowledged") {
//         updateData.acknowledgedBy = userProfile.displayName;
//         updateData.acknowledgedAt = serverTimestamp();
//       }

//       await updateDoc(
//         doc(db, "Panels", PANEL_ID, "expenseSheets", expense.id),
//         updateData
//       );

//       toast({
//         title: "Success",
//         description: "Expense sheet approved successfully",
//       });
//     } catch (error: any) {
//       console.error("Failed to approve expense sheet:", error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to approve expense sheet",
//         variant: "destructive",
//       });
//     }
//   }

//   async function handleReject(expense: ExpenseSheet, rejectionComment: string) {
//     if (!userProfile) return;

//     try {
//       setRejectionLoading(true);

//       await updateDoc(doc(db, "Panels", PANEL_ID, "expenseSheets", expense.id), {
//         status: "pending_operational_admin",
//         approvalHistory: [
//           ...(expense.approvalHistory || []),
//           {
//             approver: userProfile.displayName,
//             action: "rejected",
//             timestamp: new Date(),
//             notes: rejectionComment,
//           },
//         ],
//         updatedAt: serverTimestamp(),
//       });

//       toast({
//         title: "Success",
//         description: "Expense sheet rejected with comments",
//       });

//       setIsRejectionModalOpen(false);
//       setSelectedExpense(null);
//     } catch (error: any) {
//       console.error("Failed to reject expense sheet:", error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to reject expense sheet",
//         variant: "destructive",
//       });
//     } finally {
//       setRejectionLoading(false);
//     }
//   }

//   function canApprove(expense: ExpenseSheet): boolean {
//     if (!userProfile) return false;

//     switch (userProfile.role) {
//       case "operational_admin":
//         return expense.status === "pending_operational_admin";
//       case "main_admin":
//         return expense.status === "pending_main_admin";
//       case "finance":
//       case "financial_admin":
//         return expense.status === "approved";
//       default:
//         return false;
//     }
//   }

//   function canEdit(expense: ExpenseSheet): boolean {
//     if (!userProfile) return false;

//     return (
//       userProfile.role === "operation" &&
//       expense.status === "pending_operational_admin"
//     );
//   }

//   function getCurrentStep(status: string): string {
//     switch (status) {
//       case "pending_operational_admin":
//         return "Operational Admin Review";
//       case "pending_main_admin":
//         return "Main Admin Approval";
//       case "approved":
//         return "Finance Acknowledgment";
//       case "acknowledged":
//         return "Acknowledged";
//       case "rejected":
//         return "Rejected";
//       default:
//         return "Unknown";
//     }
//   }

//   function getStatusBadgeColor(status: string): string {
//     switch (status) {
//       case "acknowledged":
//       case "paid":
//         return "bg-green-100 text-green-800";
//       case "rejected":
//         return "bg-red-100 text-red-800";
//       case "pending_operational_admin":
//       case "pending_main_admin":
//       case "approved":
//       case "pending":
//       case "pending_admin_approval":
//         return "bg-yellow-100 text-yellow-800";
//       default:
//         return "bg-blue-100 text-blue-800";
//     }
//   }

//   function getSortableTime(date: any) {
//     if (!date) return 0;

//     try {
//       if (date?.toDate) return date.toDate().getTime();
//       if (date?.seconds) return date.seconds * 1000;

//       const parsed = new Date(date);
//       if (!isNaN(parsed.getTime())) return parsed.getTime();

//       return 0;
//     } catch {
//       return 0;
//     }
//   }

//   function formatDate(date: any) {
//     if (!date) return "N/A";

//     try {
//       if (date?.toDate) return date.toDate().toLocaleDateString();

//       if (date?.seconds) {
//         return new Date(date.seconds * 1000).toLocaleDateString();
//       }

//       const parsed = new Date(date);
//       if (!isNaN(parsed.getTime())) {
//         return parsed.toLocaleDateString();
//       }

//       return "Invalid";
//     } catch {
//       return "Invalid";
//     }
//   }

//   function formatReimbursementStatusLabel(value?: string) {
//     const raw = String(value || "").trim();
//     if (!raw) return "Pending";

//     return raw
//       .replace(/_/g, " ")
//       .split(" ")
//       .filter(Boolean)
//       .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
//       .join(" ");
//   }

//   function renderReimbursementItem(expense: ReimbursementExpenseRow) {
//     return (
//       <div
//         key={`${expense.recordId}-${expense.id}`}
//         className="rounded-lg border p-4"
//       >
//         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
//           <div>
//             <p className="text-xs text-muted-foreground">Client</p>
//             <p className="text-sm font-medium">{expense.clientName}</p>
//           </div>

//           <div>
//             <p className="text-xs text-muted-foreground">Project</p>
//             <p className="text-sm font-medium">{expense.projectName}</p>
//           </div>

//           <div>
//             <p className="text-xs text-muted-foreground">Amount / KM</p>
//             <p className="text-sm font-medium">
//               Rs {expense.amount.toLocaleString()}
//             </p>
//             <p className="text-xs text-muted-foreground">{expense.fuelKm} KM</p>
//           </div>

//           <div>
//             <p className="text-xs text-muted-foreground">Date</p>
//             <p className="text-sm font-medium">
//               {formatDate(expense.submittedDate)}
//             </p>
//           </div>

//           <div>
//             <p className="text-xs text-muted-foreground">Bill</p>
//             {expense.billUrl ? (
//               <a
//                 href={expense.billUrl}
//                 target="_blank"
//                 rel="noreferrer"
//                 className="text-sm text-primary underline"
//               >
//                 View Bill
//               </a>
//             ) : (
//               <span className="text-sm text-muted-foreground">No Bill</span>
//             )}
//           </div>
//         </div>

//         <div className="mt-4 flex flex-wrap items-start gap-3">
//           <Badge className={getStatusBadgeColor(expense.approvalStatus)}>
//             Approval: {formatReimbursementStatusLabel(expense.approvalStatus)}
//           </Badge>

//           <Badge className={getStatusBadgeColor(expense.paymentStatus)}>
//             Payment: {formatReimbursementStatusLabel(expense.paymentStatus)}
//           </Badge>

//           {expense.approvedBy && (
//             <span className="text-xs text-muted-foreground">
//               Approved by {expense.approvedBy}
//             </span>
//           )}

//           {expense.paidBy && (
//             <span className="text-xs text-muted-foreground">
//               Paid by {expense.paidBy}
//             </span>
//           )}
//         </div>

//         <div className="mt-3">
//           <p className="text-xs text-muted-foreground">Details</p>
//           <p className="text-sm text-foreground">{expense.details}</p>
//         </div>
//       </div>
//     );
//   }

//   const reimbursementPeople = useMemo(() => {
//     return Array.from(
//       new Set(
//         reimbursementExpenses.map(
//           (expense) => (expense.salesPerson || "Unknown").trim() || "Unknown"
//         )
//       )
//     ).sort((a, b) => a.localeCompare(b));
//   }, [reimbursementExpenses]);

//   const overallReimbursementAmount = useMemo(() => {
//     return reimbursementExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
//   }, [reimbursementExpenses]);

//   const overallPendingAmount = useMemo(() => {
//     return reimbursementExpenses
//       .filter((item) => String(item.paymentStatus).toLowerCase() !== "paid")
//       .reduce((sum, item) => sum + (item.amount || 0), 0);
//   }, [reimbursementExpenses]);

//   const overallPaidAmount = useMemo(() => {
//     return reimbursementExpenses
//       .filter((item) => String(item.paymentStatus).toLowerCase() === "paid")
//       .reduce((sum, item) => sum + (item.amount || 0), 0);
//   }, [reimbursementExpenses]);

//   const groupedReimbursementExpenses = useMemo<ReimbursementPersonGroup[]>(() => {
//     const groupedMap = new Map<string, ReimbursementExpenseRow[]>();

//     reimbursementExpenses.forEach((expense) => {
//       const key = (expense.salesPerson || "Unknown").trim() || "Unknown";

//       if (selectedPersonFilter !== "all" && key !== selectedPersonFilter) return;

//       const existing = groupedMap.get(key) || [];
//       existing.push(expense);
//       groupedMap.set(key, existing);
//     });

//     const groups: ReimbursementPersonGroup[] = Array.from(groupedMap.entries()).map(
//       ([salesPerson, items]) => {
//         const sortedItems = [...items].sort(
//           (a, b) => getSortableTime(b.submittedDate) - getSortableTime(a.submittedDate)
//         );

//         const paidItems = sortedItems.filter(
//           (item) => String(item.paymentStatus).toLowerCase() === "paid"
//         );
//         const pendingItems = sortedItems.filter(
//           (item) => String(item.paymentStatus).toLowerCase() !== "paid"
//         );

//         return {
//           salesPerson,
//           totalAmount: sortedItems.reduce((sum, item) => sum + (item.amount || 0), 0),
//           pendingAmount: pendingItems.reduce((sum, item) => sum + (item.amount || 0), 0),
//           paidAmount: paidItems.reduce((sum, item) => sum + (item.amount || 0), 0),
//           pendingCount: pendingItems.length,
//           paidCount: paidItems.length,
//           items: sortedItems,
//         };
//       }
//     );

//     return groups.sort((a, b) => b.totalAmount - a.totalAmount);
//   }, [reimbursementExpenses, selectedPersonFilter]);

//   if (loading || reimbursementLoading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
//       </div>
//     );
//   }

//   return (
//     <div>
//       <div className="mb-8">
//         <div className="flex justify-between items-start">
//           <div>
//             <h2
//               className="text-3xl font-bold text-foreground mb-2"
//               data-testid="text-expenses-title"
//             >
//               Expense Sheets
//             </h2>
//             <p className="text-muted-foreground">
//               Manage budget expenses and reimbursement expenses separately.
//             </p>
//           </div>

//           {activeSubTab === "budget_expense" && canCreateExpenseSheets() && (
//             <Button
//               onClick={() => {
//                 setSelectedExpense(null);
//                 setIsExpenseModalOpen(true);
//               }}
//               className="bg-green-600 hover:bg-green-700 text-white"
//               data-testid="button-create-expense-sheet"
//             >
//               <i className="fas fa-plus mr-2"></i>
//               Create New Expense Sheet
//             </Button>
//           )}
//         </div>
//       </div>

//       <div className="mb-6 flex gap-3">
//         <Button
//           type="button"
//           variant={activeSubTab === "budget_expense" ? "default" : "outline"}
//           onClick={() => setActiveSubTab("budget_expense")}
//         >
//           Budget Expense
//         </Button>

//         <Button
//           type="button"
//           variant={
//             activeSubTab === "reimbursement_expense" ? "default" : "outline"
//           }
//           onClick={() => setActiveSubTab("reimbursement_expense")}
//         >
//           Reimbursement Expense
//         </Button>
//       </div>

//       {activeSubTab === "budget_expense" && (
//         <Card>
//           <CardContent className="p-0">
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className="bg-muted border-b border-border">
//                   <tr>
//                     <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
//                       Client
//                     </th>
//                     <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
//                       Linked Request
//                     </th>
//                     <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
//                       Total Amount
//                     </th>
//                     <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
//                       Current Step
//                     </th>
//                     <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
//                       Status
//                     </th>
//                     <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
//                       Actions
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-border">
//                   {expenseSheets.length === 0 ? (
//                     <tr>
//                       <td
//                         colSpan={6}
//                         className="px-6 py-8 text-center text-muted-foreground"
//                       >
//                         No budget expenses found
//                       </td>
//                     </tr>
//                   ) : (
//                     expenseSheets.map((expense) => (
//                       <tr
//                         key={expense.id}
//                         className="hover:bg-muted/50 transition-colors"
//                       >
//                         <td
//                           className="px-6 py-4 text-sm font-medium text-foreground"
//                           data-testid={`text-expense-client-${expense.id}`}
//                         >
//                           {expense.clientName}
//                         </td>
//                         <td className="px-6 py-4 text-sm text-primary">
//                           {expense.linkedRequestId || "Independent"}
//                         </td>
//                         <td className="px-6 py-4 text-sm text-foreground">
//                           ${expense.totalAmount.toLocaleString()}
//                         </td>
//                         <td className="px-6 py-4 text-sm text-muted-foreground">
//                           {getCurrentStep(expense.status)}
//                         </td>
//                         <td className="px-6 py-4">
//                           <Badge className={getStatusBadgeColor(expense.status)}>
//                             {expense.status.replace(/_/g, " ")}
//                           </Badge>
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="flex space-x-2">
//                             <Button
//                               variant="ghost"
//                               size="sm"
//                               className="text-gray-600 hover:text-gray-700"
//                               onClick={() => {
//                                 setSelectedExpense(expense);
//                                 setIsDetailsModalOpen(true);
//                               }}
//                               data-testid={`button-view-details-${expense.id}`}
//                             >
//                               <i className="fas fa-eye mr-1"></i>View Details
//                             </Button>

//                             {expense.expenseDocuments &&
//                               expense.expenseDocuments.length > 0 && (
//                                 <Button
//                                   variant="ghost"
//                                   size="sm"
//                                   className="text-primary hover:text-primary/80"
//                                   onClick={() => {
//                                     expense.expenseDocuments?.forEach(
//                                       (url, index) => {
//                                         setTimeout(
//                                           () => window.open(url, "_blank"),
//                                           index * 100
//                                         );
//                                       }
//                                     );
//                                   }}
//                                   data-testid={`button-view-documents-${expense.id}`}
//                                 >
//                                   <i className="fas fa-file mr-1"></i>Documents
//                                 </Button>
//                               )}

//                             {canEdit(expense) && (
//                               <Button
//                                 variant="ghost"
//                                 size="sm"
//                                 className="text-blue-600 hover:text-blue-700"
//                                 onClick={() => {
//                                   setSelectedExpense(expense);
//                                   setIsExpenseModalOpen(true);
//                                 }}
//                                 data-testid={`button-edit-expense-${expense.id}`}
//                               >
//                                 <i className="fas fa-edit mr-1"></i>Edit &
//                                 Resubmit
//                               </Button>
//                             )}

//                             {canApprove(expense) && (
//                               <>
//                                 <Button
//                                   variant="ghost"
//                                   size="sm"
//                                   className="text-green-600 hover:text-green-700"
//                                   onClick={() => handleApprove(expense)}
//                                   data-testid={`button-approve-expense-${expense.id}`}
//                                 >
//                                   <i className="fas fa-check mr-1"></i>
//                                   {expense.status === "approved"
//                                     ? "Acknowledge"
//                                     : "Approve"}
//                                 </Button>
//                                 <Button
//                                   variant="ghost"
//                                   size="sm"
//                                   className="text-red-600 hover:text-red-700"
//                                   onClick={() => {
//                                     setSelectedExpense(expense);
//                                     setIsRejectionModalOpen(true);
//                                   }}
//                                   data-testid={`button-reject-expense-${expense.id}`}
//                                 >
//                                   <i className="fas fa-times mr-1"></i>Reject
//                                 </Button>
//                               </>
//                             )}
//                           </div>
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </CardContent>
//         </Card>
//       )}

//       {activeSubTab === "reimbursement_expense" && (
//         <div className="space-y-5">
//           <Card>
//             <CardContent className="p-5">
//               <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
//                 <div className="w-full lg:max-w-xs">
//                   <label className="block text-sm font-medium mb-2">
//                     Filter by Person
//                   </label>
//                   <select
//                     value={selectedPersonFilter}
//                     onChange={(e) => setSelectedPersonFilter(e.target.value)}
//                     className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
//                   >
//                     <option value="all">All Persons</option>
//                     {reimbursementPeople.map((person) => (
//                       <option key={person} value={person}>
//                         {person}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
//                   <div className="rounded-lg border p-4 bg-muted/30">
//                     <div className="text-xs text-muted-foreground">
//                       Overall Reimbursements
//                     </div>
//                     <div className="text-lg font-semibold">
//                       Rs {overallReimbursementAmount.toLocaleString()}
//                     </div>
//                   </div>

//                   <div className="rounded-lg border p-4 bg-yellow-50">
//                     <div className="text-xs text-muted-foreground">
//                       Overall Pending
//                     </div>
//                     <div className="text-lg font-semibold">
//                       Rs {overallPendingAmount.toLocaleString()}
//                     </div>
//                   </div>

//                   <div className="rounded-lg border p-4 bg-green-50">
//                     <div className="text-xs text-muted-foreground">
//                       Overall Paid
//                     </div>
//                     <div className="text-lg font-semibold">
//                       Rs {overallPaidAmount.toLocaleString()}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           {groupedReimbursementExpenses.length === 0 ? (
//             <Card>
//               <CardContent className="py-8 text-center text-muted-foreground">
//                 No reimbursement expenses found
//               </CardContent>
//             </Card>
//           ) : (
//             groupedReimbursementExpenses.map((group) => {
//               const pendingItems = group.items.filter(
//                 (item) => String(item.paymentStatus).toLowerCase() !== "paid"
//               );
//               const paidItems = group.items.filter(
//                 (item) => String(item.paymentStatus).toLowerCase() === "paid"
//               );

//               return (
//                 <Card key={group.salesPerson}>
//                   <CardContent className="p-5 space-y-5">
//                     <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
//                       <div>
//                         <h3 className="text-xl font-semibold text-foreground">
//                           {group.salesPerson}
//                         </h3>
//                         <p className="text-sm text-muted-foreground mt-1">
//                           Total Claims: {group.items.length}
//                         </p>
//                       </div>

//                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
//                         <div className="rounded-lg border p-3 bg-muted/30">
//                           <div className="text-xs text-muted-foreground">
//                             Total Amount
//                           </div>
//                           <div className="text-base font-semibold">
//                             Rs {group.totalAmount.toLocaleString()}
//                           </div>
//                         </div>

//                         <div className="rounded-lg border p-3 bg-yellow-50">
//                           <div className="text-xs text-muted-foreground">
//                             Pending
//                           </div>
//                           <div className="text-base font-semibold">
//                             {group.pendingCount} claim(s)
//                           </div>
//                           <div className="text-sm">
//                             Rs {group.pendingAmount.toLocaleString()}
//                           </div>
//                         </div>

//                         <div className="rounded-lg border p-3 bg-green-50">
//                           <div className="text-xs text-muted-foreground">
//                             Paid
//                           </div>
//                           <div className="text-base font-semibold">
//                             {group.paidCount} claim(s)
//                           </div>
//                           <div className="text-sm">
//                             Rs {group.paidAmount.toLocaleString()}
//                           </div>
//                         </div>
//                       </div>
//                     </div>

//                     <div>
//                       <div className="flex items-center gap-2 mb-3">
//                         <h4 className="font-medium text-foreground">
//                           Pending Reimbursements
//                         </h4>
//                         <Badge className="bg-yellow-100 text-yellow-800">
//                           {pendingItems.length}
//                         </Badge>
//                       </div>

//                       {pendingItems.length === 0 ? (
//                         <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
//                           No pending reimbursements
//                         </div>
//                       ) : (
//                         <div className="space-y-3">
//                           {pendingItems.map(renderReimbursementItem)}
//                         </div>
//                       )}
//                     </div>

//                     <div>
//                       <div className="flex items-center gap-2 mb-3">
//                         <h4 className="font-medium text-foreground">
//                           Paid Reimbursements
//                         </h4>
//                         <Badge className="bg-green-100 text-green-800">
//                           {paidItems.length}
//                         </Badge>
//                       </div>

//                       {paidItems.length === 0 ? (
//                         <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
//                           No paid reimbursements
//                         </div>
//                       ) : (
//                         <div className="space-y-3">
//                           {paidItems.map(renderReimbursementItem)}
//                         </div>
//                       )}
//                     </div>
//                   </CardContent>
//                 </Card>
//               );
//             })
//           )}
//         </div>
//       )}

//       <ExpenseSheetModal
//         isOpen={isExpenseModalOpen}
//         onClose={() => {
//           setIsExpenseModalOpen(false);
//           setSelectedExpense(null);
//         }}
//         onSuccess={() => {
//           setIsExpenseModalOpen(false);
//           setSelectedExpense(null);
//         }}
//         editingExpense={selectedExpense}
//       />

//       <ExpenseDetailsModal
//         isOpen={isDetailsModalOpen}
//         onClose={() => {
//           setIsDetailsModalOpen(false);
//           setSelectedExpense(null);
//         }}
//         expense={selectedExpense}
//       />

//       <RejectionModal
//         isOpen={isRejectionModalOpen}
//         onClose={() => {
//           setIsRejectionModalOpen(false);
//           setSelectedExpense(null);
//         }}
//         onConfirm={(comment) =>
//           selectedExpense && handleReject(selectedExpense, comment)
//         }
//         itemType="expense sheet"
//         loading={rejectionLoading}
//       />
//     </div>
//   );
// }

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  doc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFirestoreQuery } from "@/hooks/useFirestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExpenseSheet } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import ExpenseSheetModal from "@/components/ExpenseSheetModal";
import ExpenseDetailsModal from "@/components/ExpenseDetailsModal";
import RejectionModal from "@/components/RejectionModal";
import {
  BriefcaseBusiness,
  CalendarDays,
  CircleDollarSign,
  Filter,
  UserRound,
} from "lucide-react";

interface ReimbursementExpenseRow {
  id: string;
  recordId: string;
  clientName: string;
  projectName: string;
  salesPerson: string;
  amount: number;
  fuelKm: number;
  details: string;
  submittedDate: any;
  approvalStatus: string;
  paymentStatus: string;
  approvedBy: string;
  paidBy: string;
  billUrl: string;
}

interface ReimbursementPersonGroup {
  salesPerson: string;
  totalAmount: number;
  pendingAmount: number;
  paidAmount: number;
  pendingCount: number;
  paidCount: number;
  items: ReimbursementExpenseRow[];
}

export default function ExpenseSheets() {
  const PANEL_ID = "IEDGE-SYSTEM";

  const { userProfile } = useAuth();
  const { toast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<
    "budget_expense" | "reimbursement_expense"
  >("budget_expense");

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseSheet | null>(
    null
  );
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionLoading, setRejectionLoading] = useState(false);

  const [reimbursementExpenses, setReimbursementExpenses] = useState<
    ReimbursementExpenseRow[]
  >([]);
  const [reimbursementLoading, setReimbursementLoading] = useState(false);

  const [selectedPersonFilter, setSelectedPersonFilter] = useState("all");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("all");
  const [selectedPaymentStatusFilter, setSelectedPaymentStatusFilter] =
    useState("all");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");

  const { data: expenseSheets, loading } = useFirestoreQuery<ExpenseSheet>(
    `Panels/${PANEL_ID}/expenseSheets`
  );

  function canCreateExpenseSheets(): boolean {
    return userProfile?.role === "operation";
  }

  async function fetchReimbursementExpenses() {
    try {
      setReimbursementLoading(true);

      const salesRecordsSnap = await getDocs(
        collection(db, "Panels", PANEL_ID, "salesRecords")
      );

      const reimbursementPromises = salesRecordsSnap.docs.map(
        async (salesRecordDoc) => {
          const salesRecordData: any = salesRecordDoc.data();
          const recordId = salesRecordDoc.id;

          try {
            const meetingUpdatesSnap = await getDocs(
              collection(
                db,
                "Panels",
                PANEL_ID,
                "salesRecords",
                recordId,
                "meetingUpdates"
              )
            );

            const rows: ReimbursementExpenseRow[] = [];

            meetingUpdatesSnap.docs.forEach((meetingDoc) => {
              const meetingData: any = meetingDoc.data();
              const reimbursement = meetingData?.reimbursement;

              if (!reimbursement?.enabled) return;

              rows.push({
                id: meetingDoc.id,
                recordId,
                clientName: salesRecordData?.client || "Unknown",
                projectName: salesRecordData?.projectName || "N/A",
                salesPerson:
                  reimbursement?.approvalSubmittedByName ||
                  reimbursement?.personName ||
                  "Unknown",
                amount: Number(reimbursement?.amount || 0),
                fuelKm: Number(reimbursement?.kms || 0),
                details: reimbursement?.detail || "N/A",
                submittedDate:
                  reimbursement?.meetingDate ||
                  reimbursement?.createdAt ||
                  reimbursement?.date ||
                  null,
                approvalStatus: String(
                  reimbursement?.approvalStatus || "pending_admin_approval"
                ),
                paymentStatus: String(reimbursement?.paymentStatus || "pending"),
                approvedBy: reimbursement?.approvedBy || "",
                paidBy: reimbursement?.paidBy || "",
                billUrl: reimbursement?.billUrl || "",
              });
            });

            return rows;
          } catch (error) {
            console.error(
              `Failed to fetch meeting updates for sales record ${recordId}:`,
              error
            );
            return [];
          }
        }
      );

      const results = await Promise.all(reimbursementPromises);
      const allRows = results.flat();

      allRows.sort((a, b) => {
        const aTime = getSortableTime(a.submittedDate);
        const bTime = getSortableTime(b.submittedDate);
        return bTime - aTime;
      });

      setReimbursementExpenses(allRows);
    } catch (error: any) {
      console.error("Failed to fetch reimbursement expenses:", error);
      toast({
        title: "Error",
        description:
          error?.message || "Failed to load reimbursement expenses",
        variant: "destructive",
      });
    } finally {
      setReimbursementLoading(false);
    }
  }

  useEffect(() => {
    fetchReimbursementExpenses();
  }, []);

  async function handleApprove(expense: ExpenseSheet) {
    if (!userProfile) return;

    try {
      let newStatus = expense.status;
      let currentApprover = "";

      switch (userProfile.role) {
        case "operational_admin":
          if (expense.status === "pending_operational_admin") {
            newStatus = "pending_main_admin";
          }
          break;
        case "main_admin":
          if (expense.status === "pending_main_admin") {
            newStatus = "approved";
          }
          break;
        case "finance":
        case "financial_admin":
          if (expense.status === "approved") {
            newStatus = "acknowledged";
          }
          break;
      }

      const updateData: any = {
        status: newStatus,
        currentApprover,
        approvalHistory: [
          ...(expense.approvalHistory || []),
          {
            approver: userProfile.displayName,
            action: "approved",
            timestamp: new Date(),
            notes: "",
          },
        ],
        updatedAt: serverTimestamp(),
      };

      if (newStatus === "acknowledged") {
        updateData.acknowledgedBy = userProfile.displayName;
        updateData.acknowledgedAt = serverTimestamp();
      }

      await updateDoc(
        doc(db, "Panels", PANEL_ID, "expenseSheets", expense.id),
        updateData
      );

      toast({
        title: "Success",
        description: "Expense sheet approved successfully",
      });
    } catch (error: any) {
      console.error("Failed to approve expense sheet:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve expense sheet",
        variant: "destructive",
      });
    }
  }

  async function handleReject(expense: ExpenseSheet, rejectionComment: string) {
    if (!userProfile) return;

    try {
      setRejectionLoading(true);

      await updateDoc(doc(db, "Panels", PANEL_ID, "expenseSheets", expense.id), {
        status: "pending_operational_admin",
        approvalHistory: [
          ...(expense.approvalHistory || []),
          {
            approver: userProfile.displayName,
            action: "rejected",
            timestamp: new Date(),
            notes: rejectionComment,
          },
        ],
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Success",
        description: "Expense sheet rejected with comments",
      });

      setIsRejectionModalOpen(false);
      setSelectedExpense(null);
    } catch (error: any) {
      console.error("Failed to reject expense sheet:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject expense sheet",
        variant: "destructive",
      });
    } finally {
      setRejectionLoading(false);
    }
  }

  function canApprove(expense: ExpenseSheet): boolean {
    if (!userProfile) return false;

    switch (userProfile.role) {
      case "operational_admin":
        return expense.status === "pending_operational_admin";
      case "main_admin":
        return expense.status === "pending_main_admin";
      case "finance":
      case "financial_admin":
        return expense.status === "approved";
      default:
        return false;
    }
  }

  function canEdit(expense: ExpenseSheet): boolean {
    if (!userProfile) return false;

    return (
      userProfile.role === "operation" &&
      expense.status === "pending_operational_admin"
    );
  }

  function getCurrentStep(status: string): string {
    switch (status) {
      case "pending_operational_admin":
        return "Operational Admin Review";
      case "pending_main_admin":
        return "Main Admin Approval";
      case "approved":
        return "Finance Acknowledgment";
      case "acknowledged":
        return "Acknowledged";
      case "rejected":
        return "Rejected";
      default:
        return "Unknown";
    }
  }

  function getStatusBadgeColor(status: string): string {
    switch (status) {
      case "acknowledged":
      case "paid":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending_operational_admin":
      case "pending_main_admin":
      case "approved":
      case "pending":
      case "pending_admin_approval":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  }

  function getSortableTime(date: any) {
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
  }

  function formatDate(date: any) {
    if (!date) return "N/A";

    try {
      if (date?.toDate) return date.toDate().toLocaleDateString();

      if (date?.seconds) {
        return new Date(date.seconds * 1000).toLocaleDateString();
      }

      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString();
      }

      return "Invalid";
    } catch {
      return "Invalid";
    }
  }

  function formatReimbursementStatusLabel(value?: string) {
    const raw = String(value || "").trim();
    if (!raw) return "Pending";

    return raw
      .replace(/_/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function resetAdvancedReimbursementFilters() {
    setSelectedProjectFilter("all");
    setSelectedPaymentStatusFilter("all");
    setDateFromFilter("");
    setDateToFilter("");
  }

  function renderReimbursementItem(expense: ReimbursementExpenseRow) {
    return (
      <div
        key={`${expense.recordId}-${expense.id}`}
        className="rounded-xl border border-border/70 bg-background p-4 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <p className="text-xs text-muted-foreground">Client</p>
            <p className="text-sm font-medium">{expense.clientName}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Project</p>
            <p className="text-sm font-medium">{expense.projectName}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Amount / KM</p>
            <p className="text-sm font-medium">
              Rs {expense.amount.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">{expense.fuelKm} KM</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="text-sm font-medium">
              {formatDate(expense.submittedDate)}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Bill</p>
            {expense.billUrl ? (
              <a
                href={expense.billUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary underline"
              >
                View Bill
              </a>
            ) : (
              <span className="text-sm text-muted-foreground">No Bill</span>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-start gap-3">
          <Badge className={getStatusBadgeColor(expense.approvalStatus)}>
            Approval: {formatReimbursementStatusLabel(expense.approvalStatus)}
          </Badge>

          <Badge className={getStatusBadgeColor(expense.paymentStatus)}>
            Payment: {formatReimbursementStatusLabel(expense.paymentStatus)}
          </Badge>

          {expense.approvedBy && (
            <span className="text-xs text-muted-foreground">
              Approved by {expense.approvedBy}
            </span>
          )}

          {expense.paidBy && (
            <span className="text-xs text-muted-foreground">
              Paid by {expense.paidBy}
            </span>
          )}
        </div>

        <div className="mt-3">
          <p className="text-xs text-muted-foreground">Details</p>
          <p className="text-sm text-foreground">{expense.details}</p>
        </div>
      </div>
    );
  }

  const reimbursementPeople = useMemo(() => {
    return Array.from(
      new Set(
        reimbursementExpenses.map(
          (expense) => (expense.salesPerson || "Unknown").trim() || "Unknown"
        )
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [reimbursementExpenses]);

  const reimbursementProjects = useMemo(() => {
    if (selectedPersonFilter === "all") return [];

    return Array.from(
      new Set(
        reimbursementExpenses
          .filter(
            (expense) =>
              ((expense.salesPerson || "Unknown").trim() || "Unknown") ===
              selectedPersonFilter
          )
          .map((expense) => (expense.projectName || "N/A").trim() || "N/A")
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [reimbursementExpenses, selectedPersonFilter]);

  const filteredReimbursementExpenses = useMemo(() => {
    return reimbursementExpenses.filter((expense) => {
      const person = (expense.salesPerson || "Unknown").trim() || "Unknown";

      if (
        selectedPersonFilter !== "all" &&
        person !== selectedPersonFilter
      ) {
        return false;
      }

      if (selectedPersonFilter !== "all") {
        if (
          selectedProjectFilter !== "all" &&
          (expense.projectName || "N/A").trim() !== selectedProjectFilter
        ) {
          return false;
        }

        const paymentStatus = String(expense.paymentStatus || "pending")
          .trim()
          .toLowerCase();

        if (
          selectedPaymentStatusFilter !== "all" &&
          paymentStatus !== selectedPaymentStatusFilter
        ) {
          return false;
        }

        const expenseTime = getSortableTime(expense.submittedDate);

        if (dateFromFilter) {
          const start = new Date(dateFromFilter);
          start.setHours(0, 0, 0, 0);

          if (!expenseTime || expenseTime < start.getTime()) {
            return false;
          }
        }

        if (dateToFilter) {
          const end = new Date(dateToFilter);
          end.setHours(23, 59, 59, 999);

          if (!expenseTime || expenseTime > end.getTime()) {
            return false;
          }
        }
      }

      return true;
    });
  }, [
    reimbursementExpenses,
    selectedPersonFilter,
    selectedProjectFilter,
    selectedPaymentStatusFilter,
    dateFromFilter,
    dateToFilter,
  ]);

  const overallReimbursementAmount = useMemo(() => {
    return filteredReimbursementExpenses.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );
  }, [filteredReimbursementExpenses]);

  const overallPendingAmount = useMemo(() => {
    return filteredReimbursementExpenses
      .filter((item) => String(item.paymentStatus).toLowerCase() !== "paid")
      .reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [filteredReimbursementExpenses]);

  const overallPaidAmount = useMemo(() => {
    return filteredReimbursementExpenses
      .filter((item) => String(item.paymentStatus).toLowerCase() === "paid")
      .reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [filteredReimbursementExpenses]);

  const groupedReimbursementExpenses = useMemo<ReimbursementPersonGroup[]>(() => {
    const groupedMap = new Map<string, ReimbursementExpenseRow[]>();

    filteredReimbursementExpenses.forEach((expense) => {
      const key = (expense.salesPerson || "Unknown").trim() || "Unknown";
      const existing = groupedMap.get(key) || [];
      existing.push(expense);
      groupedMap.set(key, existing);
    });

    const groups: ReimbursementPersonGroup[] = Array.from(groupedMap.entries()).map(
      ([salesPerson, items]) => {
        const sortedItems = [...items].sort(
          (a, b) => getSortableTime(b.submittedDate) - getSortableTime(a.submittedDate)
        );

        const paidItems = sortedItems.filter(
          (item) => String(item.paymentStatus).toLowerCase() === "paid"
        );
        const pendingItems = sortedItems.filter(
          (item) => String(item.paymentStatus).toLowerCase() !== "paid"
        );

        return {
          salesPerson,
          totalAmount: sortedItems.reduce((sum, item) => sum + (item.amount || 0), 0),
          pendingAmount: pendingItems.reduce((sum, item) => sum + (item.amount || 0), 0),
          paidAmount: paidItems.reduce((sum, item) => sum + (item.amount || 0), 0),
          pendingCount: pendingItems.length,
          paidCount: paidItems.length,
          items: sortedItems,
        };
      }
    );

    return groups.sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredReimbursementExpenses]);

  if (loading || reimbursementLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h2
              className="text-3xl font-bold text-foreground mb-2"
              data-testid="text-expenses-title"
            >
              Expense Sheets
            </h2>
            <p className="text-muted-foreground">
              Manage budget expenses and reimbursement expenses separately.
            </p>
          </div>

          {activeSubTab === "budget_expense" && canCreateExpenseSheets() && (
            <Button
              onClick={() => {
                setSelectedExpense(null);
                setIsExpenseModalOpen(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
              data-testid="button-create-expense-sheet"
            >
              <i className="fas fa-plus mr-2"></i>
              Create New Expense Sheet
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6 flex gap-3">
        <Button
          type="button"
          variant={activeSubTab === "budget_expense" ? "default" : "outline"}
          onClick={() => setActiveSubTab("budget_expense")}
        >
          Budget Expense
        </Button>

        <Button
          type="button"
          variant={
            activeSubTab === "reimbursement_expense" ? "default" : "outline"
          }
          onClick={() => setActiveSubTab("reimbursement_expense")}
        >
          Reimbursement Expense
        </Button>
      </div>

      {activeSubTab === "budget_expense" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                      Client
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                      Linked Request
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                      Total Amount
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                      Current Step
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {expenseSheets.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-muted-foreground"
                      >
                        No budget expenses found
                      </td>
                    </tr>
                  ) : (
                    expenseSheets.map((expense) => (
                      <tr
                        key={expense.id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td
                          className="px-6 py-4 text-sm font-medium text-foreground"
                          data-testid={`text-expense-client-${expense.id}`}
                        >
                          {expense.clientName}
                        </td>
                        <td className="px-6 py-4 text-sm text-primary">
                          {expense.linkedRequestId || "Independent"}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          ${expense.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {getCurrentStep(expense.status)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={getStatusBadgeColor(expense.status)}>
                            {expense.status.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-600 hover:text-gray-700"
                              onClick={() => {
                                setSelectedExpense(expense);
                                setIsDetailsModalOpen(true);
                              }}
                              data-testid={`button-view-details-${expense.id}`}
                            >
                              <i className="fas fa-eye mr-1"></i>View Details
                            </Button>

                            {expense.expenseDocuments &&
                              expense.expenseDocuments.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-primary hover:text-primary/80"
                                  onClick={() => {
                                    expense.expenseDocuments?.forEach(
                                      (url, index) => {
                                        setTimeout(
                                          () => window.open(url, "_blank"),
                                          index * 100
                                        );
                                      }
                                    );
                                  }}
                                  data-testid={`button-view-documents-${expense.id}`}
                                >
                                  <i className="fas fa-file mr-1"></i>Documents
                                </Button>
                              )}

                            {canEdit(expense) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700"
                                onClick={() => {
                                  setSelectedExpense(expense);
                                  setIsExpenseModalOpen(true);
                                }}
                                data-testid={`button-edit-expense-${expense.id}`}
                              >
                                <i className="fas fa-edit mr-1"></i>Edit &
                                Resubmit
                              </Button>
                            )}

                            {canApprove(expense) && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => handleApprove(expense)}
                                  data-testid={`button-approve-expense-${expense.id}`}
                                >
                                  <i className="fas fa-check mr-1"></i>
                                  {expense.status === "approved"
                                    ? "Acknowledge"
                                    : "Approve"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => {
                                    setSelectedExpense(expense);
                                    setIsRejectionModalOpen(true);
                                  }}
                                  data-testid={`button-reject-expense-${expense.id}`}
                                >
                                  <i className="fas fa-times mr-1"></i>Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeSubTab === "reimbursement_expense" && (
        <div className="space-y-5">
          <Card className="border-border/70 shadow-sm">
            <CardContent className="p-5">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg border bg-muted/40 p-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          Reimbursement Filters
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Start by selecting a person. More filters will appear
                          automatically.
                        </p>
                      </div>
                    </div>
                  </div>

                  {(selectedPersonFilter !== "all" ||
                    selectedProjectFilter !== "all" ||
                    selectedPaymentStatusFilter !== "all" ||
                    dateFromFilter ||
                    dateToFilter) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPersonFilter("all");
                        resetAdvancedReimbursementFilters();
                      }}
                      className="gap-2 self-start"
                    >
                      <Filter className="h-4 w-4" />
                      Clear Filters
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                  <div className="lg:col-span-4">
                    <label className="mb-2 block text-xs font-medium text-muted-foreground">
                      Person
                    </label>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <select
                        value={selectedPersonFilter}
                        onChange={(e) => {
                          setSelectedPersonFilter(e.target.value);
                          resetAdvancedReimbursementFilters();
                        }}
                        className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                      >
                        <option value="all">All Persons</option>
                        {reimbursementPeople.map((person) => (
                          <option key={person} value={person}>
                            {person}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedPersonFilter !== "all" && (
                    <>
                      <div className="lg:col-span-3">
                        <label className="mb-2 block text-xs font-medium text-muted-foreground">
                          Project
                        </label>
                        <div className="relative">
                          <BriefcaseBusiness className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <select
                            value={selectedProjectFilter}
                            onChange={(e) =>
                              setSelectedProjectFilter(e.target.value)
                            }
                            className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                          >
                            <option value="all">All Projects</option>
                            {reimbursementProjects.map((project) => (
                              <option key={project} value={project}>
                                {project}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="lg:col-span-2">
                        <label className="mb-2 block text-xs font-medium text-muted-foreground">
                          Status
                        </label>
                        <div className="relative">
                          <CircleDollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <select
                            value={selectedPaymentStatusFilter}
                            onChange={(e) =>
                              setSelectedPaymentStatusFilter(e.target.value)
                            }
                            className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                          >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                          </select>
                        </div>
                      </div>

                      <div className="lg:col-span-3">
                        <label className="mb-2 block text-xs font-medium text-muted-foreground">
                          Date Range
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                              type="date"
                              value={dateFromFilter}
                              onChange={(e) => setDateFromFilter(e.target.value)}
                              className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                            />
                          </div>
                          <div className="relative">
                            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                              type="date"
                              value={dateToFilter}
                              onChange={(e) => setDateToFilter(e.target.value)}
                              className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {selectedPersonFilter !== "all" && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge variant="outline" className="rounded-full">
                      Person: {selectedPersonFilter}
                    </Badge>
                    {selectedProjectFilter !== "all" && (
                      <Badge variant="outline" className="rounded-full">
                        Project: {selectedProjectFilter}
                      </Badge>
                    )}
                    {selectedPaymentStatusFilter !== "all" && (
                      <Badge variant="outline" className="rounded-full">
                        Status: {selectedPaymentStatusFilter}
                      </Badge>
                    )}
                    {dateFromFilter && (
                      <Badge variant="outline" className="rounded-full">
                        From: {dateFromFilter}
                      </Badge>
                    )}
                    {dateToFilter && (
                      <Badge variant="outline" className="rounded-full">
                        To: {dateToFilter}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-3">
                  <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                    <div className="text-xs text-muted-foreground">
                      Visible Reimbursements
                    </div>
                    <div className="mt-1 text-lg font-semibold">
                      Rs {overallReimbursementAmount.toLocaleString()}
                    </div>
                  </div>

                  <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                    <div className="text-xs text-muted-foreground">
                      Visible Pending
                    </div>
                    <div className="mt-1 text-lg font-semibold">
                      Rs {overallPendingAmount.toLocaleString()}
                    </div>
                  </div>

                  <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                    <div className="text-xs text-muted-foreground">
                      Visible Paid
                    </div>
                    <div className="mt-1 text-lg font-semibold">
                      Rs {overallPaidAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {groupedReimbursementExpenses.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No reimbursement expenses found
              </CardContent>
            </Card>
          ) : (
            groupedReimbursementExpenses.map((group) => {
              const pendingItems = group.items.filter(
                (item) => String(item.paymentStatus).toLowerCase() !== "paid"
              );
              const paidItems = group.items.filter(
                (item) => String(item.paymentStatus).toLowerCase() === "paid"
              );

              return (
                <Card key={group.salesPerson}>
                  <CardContent className="p-5 space-y-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">
                          {group.salesPerson}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Total Claims: {group.items.length}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
                        <div className="rounded-lg border p-3 bg-muted/30">
                          <div className="text-xs text-muted-foreground">
                            Total Amount
                          </div>
                          <div className="text-base font-semibold">
                            Rs {group.totalAmount.toLocaleString()}
                          </div>
                        </div>

                        <div className="rounded-lg border p-3 bg-yellow-50">
                          <div className="text-xs text-muted-foreground">
                            Pending
                          </div>
                          <div className="text-base font-semibold">
                            {group.pendingCount} claim(s)
                          </div>
                          <div className="text-sm">
                            Rs {group.pendingAmount.toLocaleString()}
                          </div>
                        </div>

                        <div className="rounded-lg border p-3 bg-green-50">
                          <div className="text-xs text-muted-foreground">
                            Paid
                          </div>
                          <div className="text-base font-semibold">
                            {group.paidCount} claim(s)
                          </div>
                          <div className="text-sm">
                            Rs {group.paidAmount.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="font-medium text-foreground">
                          Pending Reimbursements
                        </h4>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {pendingItems.length}
                        </Badge>
                      </div>

                      {pendingItems.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                          No pending reimbursements
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {pendingItems.map(renderReimbursementItem)}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="font-medium text-foreground">
                          Paid Reimbursements
                        </h4>
                        <Badge className="bg-green-100 text-green-800">
                          {paidItems.length}
                        </Badge>
                      </div>

                      {paidItems.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                          No paid reimbursements
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {paidItems.map(renderReimbursementItem)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      <ExpenseSheetModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setSelectedExpense(null);
        }}
        onSuccess={() => {
          setIsExpenseModalOpen(false);
          setSelectedExpense(null);
        }}
        editingExpense={selectedExpense}
      />

      <ExpenseDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedExpense(null);
        }}
        expense={selectedExpense}
      />

      <RejectionModal
        isOpen={isRejectionModalOpen}
        onClose={() => {
          setIsRejectionModalOpen(false);
          setSelectedExpense(null);
        }}
        onConfirm={(comment) =>
          selectedExpense && handleReject(selectedExpense, comment)
        }
        itemType="expense sheet"
        loading={rejectionLoading}
      />
    </div>
  );
}