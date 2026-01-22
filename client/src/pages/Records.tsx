import { useState } from "react";
import { useFirestoreQuery } from "@/hooks/useFirestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InvoiceRequest, ExpenseSheet } from "@shared/schema";

export default function Records() {
  const PANEL_ID = "IEDGE-SYSTEM";

  const [activeTab, setActiveTab] = useState<"invoices" | "expenses">("invoices");
  
  // const { data: invoices, loading: invoicesLoading } = useFirestoreQuery<InvoiceRequest>("invoiceRequests");
  const { data: invoices, loading: invoicesLoading } =
  useFirestoreQuery<InvoiceRequest>(`Panels/${PANEL_ID}/invoiceRequests`);

  // const { data: expenseSheets, loading: expensesLoading } = useFirestoreQuery<ExpenseSheet>("expenseSheets");
  const { data: expenseSheets, loading: expensesLoading } =
  useFirestoreQuery<ExpenseSheet>(`Panels/${PANEL_ID}/expenseSheets`);


  function getStatusBadgeColor(status: string): string {
    switch (status) {
      case "approved":
      case "payment_released":
      case "acknowledged":
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

  function formatDate(date: any): string {
    if (!date) return "N/A";
    try {
      if (date.toDate) {
        return date.toDate().toLocaleDateString();
      }
      if (date instanceof Date) {
        return date.toLocaleDateString();
      }
      return new Date(date).toLocaleDateString();
    } catch {
      return "N/A";
    }
  }

  function formatCurrency(amount: number): string {
    return `Rs ${amount?.toLocaleString() || '0'}`;
  }

  const loading = activeTab === "invoices" ? invoicesLoading : expensesLoading;
  const data = activeTab === "invoices" ? invoices : expenseSheets;

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground" data-testid="text-records-title">Records</h2>
            <p className="text-muted-foreground">View all invoice requests and expense sheets records.</p>
          </div>
        </div>
      </div>

      {/* Tab Buttons */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex space-x-4">
            <Button
              variant={activeTab === "invoices" ? "default" : "outline"}
              onClick={() => setActiveTab("invoices")}
              className="flex items-center space-x-2"
              data-testid="button-tab-invoices"
            >
              <i className="fas fa-file-invoice"></i>
              <span>Invoice Requests</span>
              <Badge variant="secondary" className="ml-2">
                {invoices?.length || 0}
              </Badge>
            </Button>
            <Button
              variant={activeTab === "expenses" ? "default" : "outline"}
              onClick={() => setActiveTab("expenses")}
              className="flex items-center space-x-2"
              data-testid="button-tab-expenses"
            >
              <i className="fas fa-receipt"></i>
              <span>Expense Sheets</span>
              <Badge variant="secondary" className="ml-2">
                {expenseSheets?.length || 0}
              </Badge>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              {activeTab === "invoices" ? "Invoice Requests Records" : "Expense Sheets Records"}
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      {activeTab === "invoices" ? "Request ID" : "Client Name"}
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      {activeTab === "invoices" ? "Client" : "Project"}
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Submitted</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {data && data.length > 0 ? (
                    data.map((item: any) => (
                      <tr key={item.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <span className="font-medium text-foreground">
                            {activeTab === "invoices" ? item.requestId : item.clientName}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {activeTab === "invoices" ? item.clientName : item.project}
                        </td>
                        <td className="py-3 px-4 text-foreground font-medium">
                          {formatCurrency(item.totalAmount)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusBadgeColor(item.status)}>
                            {item.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {formatDate(item.submittedAt)}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {formatDate(item.updatedAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No {activeTab === "invoices" ? "invoice requests" : "expense sheets"} found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}