import { ExpenseSheet } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Helper function to safely convert Firestore timestamps to Date with time
function toDateString(timestamp: any): string {
  if (!timestamp) return 'N/A';
  
  // If it's a Firestore Timestamp with toDate method
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toLocaleString();
  }
  
  // If it's already a Date object
  if (timestamp instanceof Date) {
    return timestamp.toLocaleString();
  }
  
  // Fallback: try to create a Date from the value
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return 'N/A';
  }
}

interface ExpenseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: ExpenseSheet | null;
}

export default function ExpenseDetailsModal({
  isOpen,
  onClose,
  expense,
}: ExpenseDetailsModalProps) {
  if (!expense) return null;

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <i className="fas fa-receipt text-green-600"></i>
            <span>Expense Sheet Details - {expense.clientName}</span>
          </DialogTitle>
          <DialogDescription>
            View detailed information about this expense sheet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Client Name:</span>
                <p className="text-sm font-semibold">{expense.clientName}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Project:</span>
                <p className="text-sm font-semibold">{expense.project}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Status:</span>
                <div className="mt-1">
                  <Badge className={getStatusBadgeColor(expense.status)}>
                    {expense.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Total Amount:</span>
                <p className="text-sm font-semibold">Rs {expense.totalAmount?.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Submitted Date:</span>
                <p className="text-sm">{toDateString(expense.submittedAt)}</p>
              </div>
              {expense.linkedRequestId && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Linked Request:</span>
                  <p className="text-sm font-semibold">{expense.linkedRequestId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Expense Items */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Expense Items</h3>
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
                  {expense.expenseItems?.map((item, index) => (
                    <tr key={item.id || index}>
                      <td className="px-4 py-3 text-sm">{item.vendor}</td>
                      <td className="px-4 py-3 text-sm">{item.description}</td>
                      <td className="px-4 py-3 text-sm">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm">${item.unitPrice}</td>
                      <td className="px-4 py-3 text-sm font-semibold">${item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Documents */}
          {expense.expenseDocuments && expense.expenseDocuments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Expense Documents</h3>
              <div className="space-y-2">
                {expense.expenseDocuments.map((url, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(url, '_blank')}
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
          {expense.approvalHistory && expense.approvalHistory.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Approval History</h3>
              <div className="space-y-2">
                {expense.approvalHistory.map((history, index) => (
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
                        className={history.action === "approved" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                      >
                        {history.action}
                      </Badge>
                    </div>
                    {history.notes && (
                      <p className="text-sm mt-2">{history.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acknowledgment Details */}
          {expense.status === "acknowledged" && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Acknowledgment Details</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-green-700">Acknowledged By:</span>
                    <p className="text-sm">{expense.acknowledgedBy}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-green-700">Acknowledged Date:</span>
                    <p className="text-sm">{toDateString(expense.acknowledgedAt)}</p>
                  </div>
                </div>
                {expense.acknowledgmentNotes && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-green-700">Notes:</span>
                    <p className="text-sm mt-1">{expense.acknowledgmentNotes}</p>
                  </div>
                )}
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