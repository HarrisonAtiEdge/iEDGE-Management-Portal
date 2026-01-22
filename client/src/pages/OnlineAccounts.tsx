import { useAuth } from "@/contexts/AuthContext";
import { useFirestoreQuery } from "@/hooks/useFirestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OnlineAccount } from "@shared/schema";
import { Link } from "wouter";

export default function OnlineAccounts() {
  const { userProfile } = useAuth();

  const { data: accounts, loading } = useFirestoreQuery<OnlineAccount>(
    "onlineAccounts"
  );

  if (!userProfile || (userProfile.role !== "finance" && userProfile.role !== "financial_admin")) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Only finance team members can access account management.</p>
        </div>
      </div>
    );
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2" data-testid="text-online-accounts-title">
              Online Accounts
            </h2>
            <p className="text-muted-foreground">Manage online payment accounts</p>
          </div>
          <Link href="/accounts/add-new?type=online">
            <Button data-testid="button-add-online-account">
              <i className="fas fa-plus mr-2"></i>
              Add Online Account
            </Button>
          </Link>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          Total Accounts: {accounts.filter(acc => acc.isActive).length}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Online Accounts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Account Title</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Account No</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Bank</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Platform</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Routing Number</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      No online accounts found. <Link href="/accounts/add-new?type=online"><span className="text-primary hover:underline cursor-pointer">Add your first account</span></Link>
                    </td>
                  </tr>
                ) : (
                  accounts.map((account) => (
                    <tr key={account.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-foreground" data-testid={`text-account-title-${account.id}`}>
                        {account.accountTitle}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">{account.accountNo}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{account.bank}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{account.platform}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{account.routingNumber || "N/A"}</td>
                      <td className="px-6 py-4">
                        <Badge className={account.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {account.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}