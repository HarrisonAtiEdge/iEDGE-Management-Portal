import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
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

export default function ExpenseSheets() {
  const PANEL_ID = "IEDGE-SYSTEM";

  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseSheet | null>(
    null
  );
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionLoading, setRejectionLoading] = useState(false);

  // const { data: expenseSheets, loading } = useFirestoreQuery<ExpenseSheet>("expenseSheets");
  const { data: expenseSheets, loading } = useFirestoreQuery<ExpenseSheet>(
    `Panels/${PANEL_ID}/expenseSheets`
  );

  function canCreateExpenseSheets(): boolean {
    return userProfile?.role === "operation";
  }

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

      // Update expense sheet with approval
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

      // Add acknowledgment details for finance approval (when status becomes acknowledged)
      if (newStatus === "acknowledged") {
        updateData.acknowledgedBy = userProfile.displayName;
        updateData.acknowledgedAt = serverTimestamp();
      }

      // await updateDoc(doc(db, "expenseSheets", expense.id), updateData);
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
      // await updateDoc(doc(db, "expenseSheets", expense.id), {
      //   status: "pending_operational_admin", // Send back to operation for revision
      //   approvalHistory: [
      //     ...(expense.approvalHistory || []),
      //     {
      //       approver: userProfile.displayName,
      //       action: "rejected",
      //       timestamp: new Date(),
      //       notes: rejectionComment,
      //     },
      //   ],
      //   updatedAt: serverTimestamp(),
      // });

      await updateDoc(
        doc(db, "Panels", PANEL_ID, "expenseSheets", expense.id),
        {
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
        }
      );

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

    // Operation users can edit items that were rejected and sent back
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
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending_operational_admin":
      case "pending_main_admin":
      case "approved":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  }

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
        <div className="flex justify-between items-start">
          <div>
            <h2
              className="text-3xl font-bold text-foreground mb-2"
              data-testid="text-expenses-title"
            >
              Expense Sheets
            </h2>
            <p className="text-muted-foreground">
              Independent expense sheet creation and multi-step approval
              workflow.
            </p>
          </div>
          {canCreateExpenseSheets() && (
            <Button
              onClick={() => {
                setSelectedExpense(null); // Clear for new creation
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

      {/* Expense Workflow */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Independent Expense Sheet Workflow
          </h3>
          <div className="flex items-center space-x-4 overflow-x-auto">
            <div className="flex items-center space-x-2 min-w-max">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <span className="text-sm font-medium text-foreground">
                Operation creates expense
              </span>
            </div>
            <i className="fas fa-arrow-right text-muted-foreground"></i>
            <div className="flex items-center space-x-2 min-w-max">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <span className="text-sm font-medium text-foreground">
                Operational Admin
              </span>
            </div>
            <i className="fas fa-arrow-right text-muted-foreground"></i>
            <div className="flex items-center space-x-2 min-w-max">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <span className="text-sm font-medium text-foreground">
                Main Admin
              </span>
            </div>
            <i className="fas fa-arrow-right text-muted-foreground"></i>
            <div className="flex items-center space-x-2 min-w-max">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                4
              </div>
              <span className="text-sm font-medium text-foreground">
                Finance acknowledges
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense Sheets Table */}
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
                      No expense sheets found
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
                          {expense.status.replace("_", " ")}
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
                                  // Open expense documents in new tab
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

      {/* Expense Sheet Modal */}
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
