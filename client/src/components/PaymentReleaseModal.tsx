import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc, serverTimestamp, collection, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { InvoiceRequest } from "@shared/schema";

interface PaymentReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoice: InvoiceRequest | null;
}

export default function PaymentReleaseModal({
  isOpen,
  onClose,
  onSuccess,
  invoice,
}: PaymentReleaseModalProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [formData, setFormData] = useState({
    paymentMethod: "",
    selectedAccountId: "",
    amount: "",
    vendor: "",
    chequeNumber: "",
    transactionReference: "",
    paymentNotes: "",
  });

  useEffect(() => {
    if (formData.paymentMethod === "check") {
      loadAccounts();
    }
  }, [formData.paymentMethod]);

  async function loadAccounts() {
    try {
      const chequeSnapshot = await getDocs(collection(db, "chequeAccounts"));
      const chequeAccounts = chequeSnapshot.docs.map(doc => ({
        id: doc.id,
        type: "cheque",
        ...doc.data()
      }));
      setAccounts(chequeAccounts);
    } catch (error) {
      console.error("Failed to load accounts:", error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!userProfile || !invoice) {
      toast({
        title: "Error",
        description: "Invalid request",
        variant: "destructive",
      });
      return;
    }

    if (!formData.amount || !formData.vendor) {
      toast({
        title: "Error",
        description: "Please fill in amount and vendor fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.paymentMethod === "check" && !formData.chequeNumber) {
      toast({
        title: "Error",
        description: "Please enter cheque number",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Upload bank receipt (optional)
      let receiptUrl = "";
      if (receiptFile) {
        const receiptRef = ref(storage, `receipts/${Date.now()}_${receiptFile.name}`);
        const snapshot = await uploadBytes(receiptRef, receiptFile);
        receiptUrl = await getDownloadURL(snapshot.ref);
      }

      // Update invoice with payment details
      const paymentDetailsData: any = {
        paymentMethod: formData.paymentMethod,
        amount: parseFloat(formData.amount),
        vendor: formData.vendor,
        transactionReference: formData.transactionReference,
        bankReceiptUrl: receiptUrl,
        paymentNotes: formData.paymentNotes,
        releasedBy: userProfile.id,
        releasedAt: serverTimestamp(),
      };

      // Only add non-empty fields
      if (formData.chequeNumber) {
        paymentDetailsData.chequeNumber = formData.chequeNumber;
      }
      if (selectedAccount) {
        paymentDetailsData.selectedAccount = selectedAccount;
      }

      await updateDoc(doc(db, "invoiceRequests", invoice.id), {
        status: "payment_released",
        paymentDetails: paymentDetailsData,
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Success",
        description: "Payment released successfully",
      });

      // Reset form
      setFormData({
        paymentMethod: "",
        selectedAccountId: "",
        amount: "",
        vendor: "",
        chequeNumber: "",
        transactionReference: "",
        paymentNotes: "",
      });
      setReceiptFile(null);
      setSelectedAccount(null);
      onSuccess();
    } catch (error: any) {
      console.error("Failed to release payment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to release payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Release Payment</DialogTitle>
        </DialogHeader>

        {/* Invoice Summary */}
        <div className="bg-muted p-4 rounded-lg mb-6">
          <h4 className="font-medium text-foreground mb-2">Invoice Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Request ID:</span>
              <span className="text-foreground ml-2">{(invoice as any).invoiceNumber || (invoice as any).requestId}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Client:</span>
              <span className="text-foreground ml-2">{(invoice as any).vendorName || (invoice as any).clientName}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Amount:</span>
              <span className="text-foreground ml-2 font-semibold">
                Rs {((invoice as any).amount || (invoice as any).totalAmount)?.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <span className="text-foreground ml-2">
                {invoice.status}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="0.00"
                required
                data-testid="input-payment-amount"
              />
            </div>
            <div>
              <Label htmlFor="vendor">Vendor</Label>
              <Input
                id="vendor"
                value={formData.vendor}
                onChange={(e) =>
                  setFormData({ ...formData, vendor: e.target.value })
                }
                placeholder="Enter vendor name"
                required
                data-testid="input-payment-vendor"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) =>
                setFormData({ ...formData, paymentMethod: value, selectedAccountId: "" })
              }
            >
              <SelectTrigger data-testid="select-payment-method">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="check">Cheque</SelectItem>
                <SelectItem value="wire">Online Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Account dropdown for Cheque */}
          {formData.paymentMethod === "check" && (
            <>
              <div>
                <Label htmlFor="account">Select Account</Label>
                <Select
                  value={formData.selectedAccountId}
                  onValueChange={(value) => {
                    setFormData({ ...formData, selectedAccountId: value });
                    const account = accounts.find(acc => acc.id === value);
                    setSelectedAccount(account);
                  }}
                >
                  <SelectTrigger data-testid="select-account">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iedge">iEDGE</SelectItem>
                    <SelectItem value="iedge-travel">IEDGE TRAVEL & TOURS (PRIVATE) LIMITED</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedAccount && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">Account Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Account Name:</span>
                      <span className="text-foreground ml-2">{selectedAccount.accountName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Account Number:</span>
                      <span className="text-foreground ml-2">{selectedAccount.accountNumber}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Bank:</span>
                      <span className="text-foreground ml-2">{selectedAccount.bankName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Balance:</span>
                      <span className="text-foreground ml-2">${selectedAccount.balance?.toLocaleString() || '0.00'}</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="chequeNumber">Cheque Number</Label>
                <Input
                  id="chequeNumber"
                  value={formData.chequeNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, chequeNumber: e.target.value })
                  }
                  placeholder="Enter cheque number"
                  required
                  data-testid="input-cheque-number"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // This would open a modal to add new cheque account details
                    toast({
                      title: "Add New Account",
                      description: "Navigate to Accounts > Add New to create a new cheque account",
                    });
                  }}
                  data-testid="button-add-new-cheque"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Add New Cheque Detail
                </Button>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="transactionReference">Bank Transaction Reference</Label>
            <Input
              id="transactionReference"
              value={formData.transactionReference}
              onChange={(e) =>
                setFormData({ ...formData, transactionReference: e.target.value })
              }
              placeholder="Enter transaction reference"
              required
              data-testid="input-transaction-reference"
            />
          </div>

          <div>
            <Label htmlFor="receipt">
              Upload Bank Cheque/Receipt <span className="text-gray-500">(Optional)</span>
            </Label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-border rounded-lg hover:border-ring transition-colors">
              <div className="space-y-1 text-center">
                <i className="fas fa-camera text-3xl text-muted-foreground"></i>
                <div className="flex text-sm text-muted-foreground">
                  <label className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80">
                    <span>Upload screenshot</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                      data-testid="input-receipt"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, PDF up to 5MB
                </p>
                {receiptFile && (
                  <p className="text-sm text-green-600">
                    <i className="fas fa-check mr-1"></i>
                    {receiptFile.name} selected
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="paymentNotes">Payment Notes</Label>
            <Textarea
              id="paymentNotes"
              rows={3}
              value={formData.paymentNotes}
              onChange={(e) =>
                setFormData({ ...formData, paymentNotes: e.target.value })
              }
              placeholder="Add any additional notes about the payment..."
              data-testid="textarea-payment-notes"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-release-payment"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Releasing...
                </>
              ) : (
                <>
                  <i className="fas fa-check mr-2"></i>
                  Release Payment
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
