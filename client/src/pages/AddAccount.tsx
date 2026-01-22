import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function AddAccount() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState<"cheque" | "online">("cheque");
  const [formData, setFormData] = useState({
    accountTitle: "",
    accountNo: "",
    bank: "",
    branch: "",
    city: "",
    platform: "",
    routingNumber: ""
  });

  // Get account type from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type') as "cheque" | "online";
    if (type && (type === "cheque" || type === "online")) {
      setAccountType(type);
    }
  }, []);

  if (!userProfile || (userProfile.role !== "finance" && userProfile.role !== "financial_admin")) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Only finance team members can add accounts.</p>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (accountType === "cheque" && (!formData.accountTitle || !formData.accountNo || !formData.bank || !formData.branch || !formData.city)) {
      toast({
        title: "Error",
        description: "Please fill in all required fields for cheque account",
        variant: "destructive",
      });
      return;
    }

    if (accountType === "online" && (!formData.accountTitle || !formData.accountNo || !formData.bank || !formData.platform)) {
      toast({
        title: "Error",
        description: "Please fill in all required fields for online account",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const collectionName = accountType === "cheque" ? "chequeAccounts" : "onlineAccounts";
      const accountData = {
        accountTitle: formData.accountTitle,
        accountNo: formData.accountNo,
        bank: formData.bank,
        createdBy: userProfile!.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
        ...(accountType === "cheque" ? {
          branch: formData.branch,
          city: formData.city
        } : {
          platform: formData.platform,
          routingNumber: formData.routingNumber || undefined
        })
      };

      await addDoc(collection(db, collectionName), accountData);

      toast({
        title: "Success",
        description: `${accountType === "cheque" ? "Cheque" : "Online"} account added successfully`,
      });

      // Navigate back to the appropriate accounts page
      setLocation(accountType === "cheque" ? "/accounts/cheque" : "/accounts/online");
    } catch (error: any) {
      console.error("Failed to add account:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2" data-testid="text-add-account-title">
          Add New Account
        </h2>
        <p className="text-muted-foreground">Create a new payment account</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="accountType">Account Type</Label>
              <Select value={accountType} onValueChange={(value: "cheque" | "online") => setAccountType(value)}>
                <SelectTrigger data-testid="select-account-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cheque">Cheque Account</SelectItem>
                  <SelectItem value="online">Online Account</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="accountTitle">Account Title *</Label>
                <Input
                  id="accountTitle"
                  value={formData.accountTitle}
                  onChange={(e) => setFormData({ ...formData, accountTitle: e.target.value })}
                  placeholder="e.g., Main Operating Account"
                  required
                  data-testid="input-account-title"
                />
              </div>
              <div>
                <Label htmlFor="accountNo">Account Number *</Label>
                <Input
                  id="accountNo"
                  value={formData.accountNo}
                  onChange={(e) => setFormData({ ...formData, accountNo: e.target.value })}
                  placeholder="Account number"
                  required
                  data-testid="input-account-no"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bank">Bank Name *</Label>
              <Input
                id="bank"
                value={formData.bank}
                onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                placeholder="e.g., State Bank of Pakistan"
                required
                data-testid="input-bank"
              />
            </div>

            {accountType === "cheque" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="branch">Branch *</Label>
                    <Input
                      id="branch"
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      placeholder="Branch name"
                      required
                      data-testid="input-branch"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City name"
                      required
                      data-testid="input-city"
                    />
                  </div>
                </div>
              </>
            )}

            {accountType === "online" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="platform">Platform *</Label>
                    <Input
                      id="platform"
                      value={formData.platform}
                      onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                      placeholder="e.g., Internet Banking, Mobile App"
                      required
                      data-testid="input-platform"
                    />
                  </div>
                  <div>
                    <Label htmlFor="routingNumber">Routing Number</Label>
                    <Input
                      id="routingNumber"
                      value={formData.routingNumber}
                      onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value })}
                      placeholder="Optional"
                      data-testid="input-routing-number"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation(accountType === "cheque" ? "/accounts/cheque" : "/accounts/online")}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} data-testid="button-save-account">
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Saving...
                  </>
                ) : (
                  "Save Account"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}