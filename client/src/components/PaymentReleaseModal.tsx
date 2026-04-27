// import { useState, useEffect } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Textarea } from "@/components/ui/textarea";
// import { useToast } from "@/hooks/use-toast";
// import { InvoiceRequest } from "@shared/schema";

// interface PaymentReleaseModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: () => void;
//   invoice: InvoiceRequest | null;
// }

// export default function PaymentReleaseModal({
//   isOpen,
//   onClose,
//   onSuccess,
//   invoice,
// }: PaymentReleaseModalProps) {
//   const { userProfile } = useAuth();
//   const { toast } = useToast();
//   const [loading, setLoading] = useState(false);
//   const [receiptFile, setReceiptFile] = useState<File | null>(null);
//   const [accounts, setAccounts] = useState<any[]>([]);
//   const [selectedAccount, setSelectedAccount] = useState<any>(null);
//   const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
//   const [formData, setFormData] = useState({
//     paymentMethod: "",
//     selectedAccountId: "",
//     amount: "",
//     vendor: "",
//     chequeNumber: "",
//     transactionReference: "",
//     paymentNotes: "",
//   });


//   async function uploadToCloudinary(file: File) {
//     if (!file) return "";

//     // const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
//     // const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

//     const CLOUD_NAME = import.meta.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
//     const UPLOAD_PRESET = import.meta.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

//     if (!CLOUD_NAME || !UPLOAD_PRESET) {
//       console.error("❌ Cloudinary env missing");
//       return "";
//     }

//     const form = new FormData();
//     form.append("file", file);
//     form.append("upload_preset", UPLOAD_PRESET);

//     try {
//       const res = await fetch(
//         `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
//         {
//           method: "POST",
//           body: form,
//         }
//       );

//       const data = await res.json();

//       console.log("✅ Cloudinary Response:", data);

//       return data.secure_url || "";
//     } catch (err) {
//       console.error("❌ Cloudinary upload failed:", err);
//       return "";
//     }
//   }

//   useEffect(() => {
//     if (!invoice) return;

//     const lineItems = (invoice as any).lineItems || [];

//     // Filter approved items
//     const approvedItems = lineItems.filter((item: any) => item.status === "approved");

//     // Calculate approved total
//     const approvedTotal = approvedItems.reduce((sum: number, item: any) => {
//       const qty = item.units || 0;
//       const rate = item.unitRate || 0;
//       const tax = item.tax || 0;
//       const total = item.total || qty * rate + tax;
//       return sum + total;
//     }, 0);

//     // Collect vendors from approved items (remove duplicates)
//     const approvedVendors = [...new Set(approvedItems.map((item: any) => item.vendor))] as string[];

//     setFormData((prev) => ({
//       ...prev,
//       amount: approvedTotal.toString(),
//       vendor: "", // clear single field
//     }));

//     setSelectedVendors(approvedVendors); // store as array
//   }, [invoice]);

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();

//     if (!userProfile || !invoice) {
//       toast({
//         title: "Error",
//         description: "Invalid request",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (formData.paymentMethod === "check" && !formData.chequeNumber) {
//       toast({
//         title: "Error",
//         description: "Please enter cheque number",
//         variant: "destructive",
//       });
//       return;
//     }

//     try {
//       setLoading(true);

//       let receiptUrl = "";
//       if (receiptFile) {
//         receiptUrl = await uploadToCloudinary(receiptFile);
//       }

//       const paymentDetailsData: any = {
//         paymentMethod: formData.paymentMethod,
//         amount: parseFloat(formData.amount),
//         vendor: formData.vendor,
//         transactionReference: formData.transactionReference,
//         bankReceiptUrl: receiptUrl,
//         paymentNotes: formData.paymentNotes,
//         releasedBy: userProfile.id,
//         releasedAt: serverTimestamp(),
//       };

//       // Only add non-empty fields
//       if (formData.chequeNumber) {
//         paymentDetailsData.chequeNumber = formData.chequeNumber;
//       }
//       if (selectedAccount) {
//         paymentDetailsData.selectedAccount = selectedAccount;
//       }

//       await updateDoc(
//         doc(db, "Panels", "IEDGE-SYSTEM", "invoiceRequests", invoice.id),
//         {
//           status: "payment_released",
//           paymentDetails: paymentDetailsData,
//           updatedAt: serverTimestamp(),
//         }
//       );

//       toast({
//         title: "Success",
//         description: "Payment released successfully",
//       });

//       setFormData({
//         paymentMethod: "",
//         selectedAccountId: "",
//         amount: "",
//         vendor: "",
//         chequeNumber: "",
//         transactionReference: "",
//         paymentNotes: "",
//       });
//       setReceiptFile(null);
//       onSuccess();
//     } catch (error: any) {
//       console.error("Failed to release payment:", error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to release payment",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   }

//   if (!invoice) return null;

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-2xl">
//         <DialogHeader>
//           <DialogTitle>Release Payment</DialogTitle>
//         </DialogHeader>

//         {/* Invoice Summary */}
//         <div className="bg-muted p-4 rounded-lg mb-6">
//           <h4 className="font-medium text-foreground mb-2">Budget Details</h4>
//           <div className="grid grid-cols-2 gap-4 text-sm">
//             <div>
//               <span className="text-muted-foreground">Request ID:</span>
//               <span className="text-foreground ml-2">{(invoice as any).requestId}</span>
//             </div>
//             <div>
//               <span className="text-muted-foreground">Client:</span>
//               <span className="text-foreground ml-2">{(invoice as any).clientName || "-"}</span>
//             </div>
//             <div>
//               <span className="text-muted-foreground">Amount:</span>
//               <span className="text-foreground ml-2 font-semibold">
//                 Rs {((invoice as any).totalAmount || 0).toLocaleString()}
//               </span>
//             </div>
//             <div>
//               <span className="text-muted-foreground">Status:</span>
//               <span className="text-foreground ml-2">{invoice.status}</span>
//             </div>
//           </div>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

//             <div>
//               <Label htmlFor="amount">Approved Amount</Label>
//               <Input
//                 id="amount"
//                 type="number"
//                 value={formData.amount}
//                 readOnly
//                 className="bg-muted"
//               />
//             </div>
   
//             <div>
//               <Label>Approved Vendors</Label>
//               <div className="space-y-2">
//                 {selectedVendors.length === 0 && (
//                   <span className="text-muted-foreground">No approved vendors</span>
//                 )}
//                 {selectedVendors.map((vendor, idx) => (
//                   <Input
//                     key={idx}
//                     value={vendor}
//                     readOnly
//                     className="bg-muted"
//                   />
//                 ))}
//               </div>
//             </div>
//           </div>

//           <div>
//             <Label htmlFor="paymentMethod">Payment Method</Label>
//             <Select
//               value={formData.paymentMethod}
//               onValueChange={(value) =>
//                 setFormData({ ...formData, paymentMethod: value })
//               }
//             >
//               <SelectTrigger>
//                 <SelectValue placeholder="Select payment method" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
//                 <SelectItem value="check">Cheque</SelectItem>
//                 <SelectItem value="wire">Online Transfer</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>


//           {/* Account dropdown for Cheque */}
//           {formData.paymentMethod === "check" && (
//             <>
//               <div>
//                 <Label htmlFor="account">Select Account</Label>
//                 <Select
//                   value={formData.selectedAccountId}
//                   onValueChange={(value) => {
//                     setFormData({ ...formData, selectedAccountId: value });
//                     const account = accounts.find(acc => acc.id === value);
//                     setSelectedAccount(account);
//                   }}
//                 >
//                   <SelectTrigger data-testid="select-account">
//                     <SelectValue placeholder="Select account" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="iedge">iEDGE</SelectItem>
//                     <SelectItem value="iedge-travel">IEDGE TRAVEL & TOURS (PRIVATE) LIMITED</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>

//               {selectedAccount && (
//                 <div className="bg-muted p-4 rounded-lg">
//                   <h4 className="font-medium text-foreground mb-2">Account Information</h4>
//                   <div className="grid grid-cols-2 gap-4 text-sm">
//                     <div>
//                       <span className="text-muted-foreground">Account Name:</span>
//                       <span className="text-foreground ml-2">{selectedAccount.accountName}</span>
//                     </div>
//                     <div>
//                       <span className="text-muted-foreground">Account Number:</span>
//                       <span className="text-foreground ml-2">{selectedAccount.accountNumber}</span>
//                     </div>
//                     <div>
//                       <span className="text-muted-foreground">Bank:</span>
//                       <span className="text-foreground ml-2">{selectedAccount.bankName}</span>
//                     </div>
//                     <div>
//                       <span className="text-muted-foreground">Balance:</span>
//                       <span className="text-foreground ml-2">${selectedAccount.balance?.toLocaleString() || '0.00'}</span>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               <div>
//                 <Label htmlFor="chequeNumber">Cheque Number</Label>
//                 <Input
//                   id="chequeNumber"
//                   value={formData.chequeNumber}
//                   onChange={(e) =>
//                     setFormData({ ...formData, chequeNumber: e.target.value })
//                   }
//                   placeholder="Enter cheque number"
//                   required
//                   data-testid="input-cheque-number"
//                 />
//               </div>

//               <div className="flex justify-end">
//                 <Button
//                   type="button"
//                   variant="outline"
//                   size="sm"
//                   onClick={() => {
//                     // This would open a modal to add new cheque account details
//                     toast({
//                       title: "Add New Account",
//                       description: "Navigate to Accounts > Add New to create a new cheque account",
//                     });
//                   }}
//                   data-testid="button-add-new-cheque"
//                 >
//                   <i className="fas fa-plus mr-2"></i>
//                   Add New Cheque Detail
//                 </Button>
//               </div>
//             </>
//           )}

//           <div>
//             <Label htmlFor="transactionReference">Bank Transaction Reference</Label>
//             <Input
//               id="transactionReference"
//               value={formData.transactionReference}
//               onChange={(e) => setFormData({ ...formData, transactionReference: e.target.value })}
//               placeholder="Enter transaction reference"
//               required
//             />
//           </div>

//           <div>
//             <Label htmlFor="receipt">Upload Bank Cheque/Receipt (Optional)</Label>
//             <Input
//               type="file"
//               accept=".jpg,.jpeg,.png,.pdf"
//               onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
//             />
//             {receiptFile && <p className="text-green-600 mt-1">{receiptFile.name} selected</p>}
//           </div>

//           <div>
//             <Label htmlFor="paymentNotes">Payment Notes</Label>
//             <Textarea
//               id="paymentNotes"
//               rows={3}
//               value={formData.paymentNotes}
//               onChange={(e) => setFormData({ ...formData, paymentNotes: e.target.value })}
//               placeholder="Add any notes..."
//             />
//           </div>

//           <div className="flex justify-end space-x-3">
//             <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
//             <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
//               {loading ? "Releasing..." : "Release Payment"}
//             </Button>
//           </div>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }


import { useEffect, useMemo, useState } from "react";
import { serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { releasePayment } from "@/lib/payments/releasePayment";
import { fetchPaymentAccounts } from "@/lib/payments/paymentAccounts";
import {
  PaymentAccount,
  PaymentReleaseFormValues,
  PaymentReleaseSubmitArgs,
} from "@/lib/payments/types";
import { InvoiceRequest } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface PaymentReleaseModalProps<T = any> {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;

  invoice?: InvoiceRequest | null;

  context?: T | null;
  docPath?: ((context: T) => string[]) | string[];
  buildUpdateData?: (
    args: PaymentReleaseSubmitArgs<T>
  ) => Record<string, any>;

  amount?: number;
  amountLabel?: string;
  partyLabel?: string;
  parties?: string[];

  accounts?: PaymentAccount[];
  allowCheque?: boolean;
  allowReceiptUpload?: boolean;
  initialPaymentMethod?: "cash" | "cheque" | "bank_transfer" | "wire";
  amountReadOnly?: boolean;
}

export default function PaymentReleaseModal<T = any>({
  isOpen,
  onClose,
  onSuccess,
  title = "Release Payment",
  invoice = null,

  context = null,
  docPath,
  buildUpdateData,

  amount,
  amountLabel,
  partyLabel,
  parties,

  accounts = [],
  allowCheque = true,
  allowReceiptUpload = true,
  initialPaymentMethod,
  amountReadOnly,
}: PaymentReleaseModalProps<T>) {
  const { userProfile, currentUser } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<PaymentAccount | null>(
    null
  );
  const [storedAccounts, setStoredAccounts] = useState<PaymentAccount[]>([]);

  const approvedInvoiceItems = useMemo(() => {
    const items = Array.isArray((invoice as any)?.lineItems)
      ? (invoice as any).lineItems
      : [];

    return items.filter((item: any) => item?.status === "approved");
  }, [invoice]);

  const invoiceApprovedAmount = useMemo(() => {
    return approvedInvoiceItems.reduce((sum: number, item: any) => {
      const qty = Number(item?.units || 0);
      const rate = Number(item?.unitRate || 0);
      const tax = Number(item?.tax || 0);
      const total = Number(item?.total ?? qty * rate + tax);
      return sum + total;
    }, 0);
  }, [approvedInvoiceItems]);

  const invoiceApprovedVendors = useMemo(() => {
    return [
      ...new Set(
        approvedInvoiceItems
          .map((item: any) => String(item?.vendor || "").trim())
          .filter(Boolean)
      ),
    ] as string[];
  }, [approvedInvoiceItems]);

  const resolvedContext = (context ?? invoice ?? null) as
    | T
    | InvoiceRequest
    | null;

  const resolvedDocPath = useMemo(() => {
    if (docPath && resolvedContext) {
      return typeof docPath === "function"
        ? docPath(resolvedContext as T)
        : docPath;
    }

    if ((invoice as any)?.id) {
      return [
        "Panels",
        "IEDGE-SYSTEM",
        "invoiceRequests",
        (invoice as any).id,
      ];
    }

    return [];
  }, [docPath, resolvedContext, invoice]);

  const resolvedAmount = amount ?? (invoice ? invoiceApprovedAmount : 0);

  const resolvedParties = parties ?? (invoice ? invoiceApprovedVendors : []);

  const resolvedAmountLabel =
    amountLabel ?? (invoice ? "Approved Amount" : "Amount");

  const resolvedPartyLabel =
    partyLabel ?? (invoice ? "Approved Vendors" : "Payee");

  const resolvedInitialPaymentMethod =
    initialPaymentMethod ?? (invoice ? "bank_transfer" : "cash");

  const resolvedAmountReadOnly = amountReadOnly ?? !!invoice;

  const resolvedAccounts = useMemo(() => {
    const map = new Map<string, PaymentAccount>();

    [...storedAccounts, ...accounts].forEach((acc) => {
      if (!acc?.id) return;
      map.set(acc.id, acc);
    });

    return Array.from(map.values()).filter((acc) => acc.isActive !== false);
  }, [storedAccounts, accounts]);

  const defaultInvoiceBuildUpdateData = ({
    formData,
    receiptUrl,
    selectedAccount,
    actor,
  }: PaymentReleaseSubmitArgs<InvoiceRequest>) => {
    const paymentDetails: any = {
      paymentMethod: formData.paymentMethod,
      amount: Number(formData.amount),
      vendors: invoiceApprovedVendors,
      transactionReference: formData.transactionReference,
      bankReceiptUrl: receiptUrl,
      paymentNotes: formData.paymentNotes,
      releasedBy: actor.profileId || actor.uid,
      releasedByName: actor.displayName || actor.email || "Unknown",
      releasedAt: serverTimestamp(),
    };

    if (formData.chequeNumber) {
      paymentDetails.chequeNumber = formData.chequeNumber;
    }

    if (selectedAccount) {
      paymentDetails.selectedAccount = selectedAccount;
    }

    return {
      status: "payment_released",
      paymentDetails,
    };
  };

  const [formData, setFormData] = useState<PaymentReleaseFormValues>({
    paymentMethod: resolvedInitialPaymentMethod,
    selectedAccountId: "",
    amount: String(resolvedAmount || 0),
    chequeNumber: "",
    transactionReference: "",
    paymentNotes: "",
  });

  useEffect(() => {
    if (!isOpen) return;

    setFormData({
      paymentMethod: resolvedInitialPaymentMethod,
      selectedAccountId: "",
      amount: String(resolvedAmount || 0),
      chequeNumber: "",
      transactionReference: "",
      paymentNotes: "",
    });

    setSelectedAccount(null);
    setReceiptFile(null);
  }, [isOpen, resolvedAmount, resolvedInitialPaymentMethod]);

  useEffect(() => {
    let mounted = true;

    async function loadAccounts() {
      try {
        setAccountsLoading(true);
        const rows = await fetchPaymentAccounts();
        if (mounted) {
          setStoredAccounts(rows);
        }
      } catch (error) {
        console.error("Failed to load payment accounts:", error);
        if (mounted) {
          toast({
            title: "Error",
            description: "Failed to load payment accounts",
            variant: "destructive",
          });
        }
      } finally {
        if (mounted) {
          setAccountsLoading(false);
        }
      }
    }

    if (isOpen) {
      loadAccounts();
    }

    return () => {
      mounted = false;
    };
  }, [isOpen, toast]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!resolvedContext) {
      toast({
        title: "Error",
        description: "No record selected",
        variant: "destructive",
      });
      return;
    }

    if (!formData.paymentMethod) {
      toast({
        title: "Error",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (formData.paymentMethod === "cheque") {
      if (!formData.selectedAccountId) {
        toast({
          title: "Error",
          description: "Please select an account",
          variant: "destructive",
        });
        return;
      }

      if (!formData.chequeNumber) {
        toast({
          title: "Error",
          description: "Please enter cheque number",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setLoading(true);

      await releasePayment({
        docPath: resolvedDocPath,
        context: resolvedContext as any,
        formData,
        receiptFile,
        selectedAccount,
        actor: {
          uid: currentUser?.uid,
          email: currentUser?.email,
          displayName: userProfile?.displayName || currentUser?.email,
          profileId: userProfile?.id,
        },
        buildUpdateData: (buildUpdateData ||
          defaultInvoiceBuildUpdateData) as any,
      });

      toast({
        title: "Success",
        description: "Payment released successfully",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Failed to release payment:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to release payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="bg-muted p-4 rounded-lg mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">
                {resolvedAmountLabel}:
              </span>
              <span className="ml-2 font-semibold">
                Rs {Number(resolvedAmount || 0).toLocaleString()}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground">
                {resolvedPartyLabel}:
              </span>
              <span className="ml-2">
                {resolvedParties.length ? resolvedParties.join(", ") : "-"}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="amount">Release Amount</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              readOnly={resolvedAmountReadOnly}
              className={resolvedAmountReadOnly ? "bg-muted" : ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, amount: e.target.value }))
              }
            />
          </div>

          <div>
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value: any) =>
                setFormData((prev) => ({ ...prev, paymentMethod: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="wire">Online Transfer</SelectItem>
                {allowCheque && <SelectItem value="cheque">Cheque</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          {formData.paymentMethod === "cheque" && allowCheque && (
            <>
              <div>
                <Label htmlFor="account">Select Account</Label>
                <Select
                  value={formData.selectedAccountId}
                  onValueChange={(value) => {
                    const account =
                      resolvedAccounts.find((acc) => acc.id === value) || null;

                    setSelectedAccount(account);
                    setFormData((prev) => ({
                      ...prev,
                      selectedAccountId: value,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        accountsLoading
                          ? "Loading accounts..."
                          : "Select account"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {resolvedAccounts.length === 0 ? (
                      <SelectItem value="__no_accounts__" disabled>
                        No active accounts found
                      </SelectItem>
                    ) : (
                      resolvedAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.accountName || account.id}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedAccount && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">
                    Account Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Account Name:
                      </span>
                      <span className="text-foreground ml-2">
                        {selectedAccount.accountName || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Account Number:
                      </span>
                      <span className="text-foreground ml-2">
                        {selectedAccount.accountNumber || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Bank:</span>
                      <span className="text-foreground ml-2">
                        {selectedAccount.bankName || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Balance:</span>
                      <span className="text-foreground ml-2">
                        {(
                          selectedAccount.currentBalance ??
                          selectedAccount.balance ??
                          0
                        ).toLocaleString()}
                      </span>
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
                    setFormData((prev) => ({
                      ...prev,
                      chequeNumber: e.target.value,
                    }))
                  }
                  placeholder="Enter cheque number"
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="transactionReference">Transaction Reference</Label>
            <Input
              id="transactionReference"
              value={formData.transactionReference}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  transactionReference: e.target.value,
                }))
              }
              placeholder="Enter transaction reference"
            />
          </div>

          {allowReceiptUpload && (
            <div>
              <Label htmlFor="receipt">Upload Receipt / Cheque Copy</Label>
              <Input
                id="receipt"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              />
              {receiptFile && (
                <p className="text-green-600 mt-1">
                  {receiptFile.name} selected
                </p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="paymentNotes">Payment Notes</Label>
            <Textarea
              id="paymentNotes"
              rows={3}
              value={formData.paymentNotes}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  paymentNotes: e.target.value,
                }))
              }
              placeholder="Add any notes..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Releasing..." : "Release Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}