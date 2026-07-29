// import { useEffect, useMemo, useState } from "react";
// import { serverTimestamp } from "firebase/firestore";
// import { useAuth } from "@/contexts/AuthContext";
// import { releasePayment } from "@/lib/payments/releasePayment";
// import { fetchPaymentAccounts } from "@/lib/payments/paymentAccounts";
// import {
//   PaymentAccount,
//   PaymentReleaseFormValues,
//   PaymentReleaseSubmitArgs,
// } from "@/lib/payments/types";
// import { InvoiceRequest } from "@shared/schema";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Textarea } from "@/components/ui/textarea";
// import { useToast } from "@/hooks/use-toast";

// interface PaymentReleaseModalProps<T = any> {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: () => void;
//   title?: string;

//   invoice?: InvoiceRequest | null;

//   context?: T | null;
//   docPath?: ((context: T) => string[]) | string[];
//   buildUpdateData?: (
//     args: PaymentReleaseSubmitArgs<T>
//   ) => Record<string, any>;

//   amount?: number;
//   amountLabel?: string;
//   partyLabel?: string;
//   parties?: string[];

//   accounts?: PaymentAccount[];
//   allowCheque?: boolean;
//   allowReceiptUpload?: boolean;
//   initialPaymentMethod?: "cash" | "cheque" | "bank_transfer" | "wire";
//   amountReadOnly?: boolean;
// }

// export default function PaymentReleaseModal<T = any>({
//   isOpen,
//   onClose,
//   onSuccess,
//   title = "Release Payment",
//   invoice = null,

//   context = null,
//   docPath,
//   buildUpdateData,

//   amount,
//   amountLabel,
//   partyLabel,
//   parties,

//   accounts = [],
//   allowCheque = true,
//   allowReceiptUpload = true,
//   initialPaymentMethod,
//   amountReadOnly,
// }: PaymentReleaseModalProps<T>) {
//   const { userProfile, currentUser } = useAuth();
//   const { toast } = useToast();

//   const [loading, setLoading] = useState(false);
//   const [accountsLoading, setAccountsLoading] = useState(false);
//   const [receiptFile, setReceiptFile] = useState<File | null>(null);
//   const [selectedAccount, setSelectedAccount] = useState<PaymentAccount | null>(
//     null
//   );
//   const [storedAccounts, setStoredAccounts] = useState<PaymentAccount[]>([]);

//   const approvedInvoiceItems = useMemo(() => {
//     const items = Array.isArray((invoice as any)?.lineItems)
//       ? (invoice as any).lineItems
//       : [];

//     return items.filter((item: any) => item?.status === "approved");
//   }, [invoice]);

//   const invoiceApprovedAmount = useMemo(() => {
//     return approvedInvoiceItems.reduce((sum: number, item: any) => {
//       const qty = Number(item?.units || 0);
//       const rate = Number(item?.unitRate || 0);
//       const tax = Number(item?.tax || 0);
//       const total = Number(item?.total ?? qty * rate + tax);
//       return sum + total;
//     }, 0);
//   }, [approvedInvoiceItems]);

//   const invoiceApprovedVendors = useMemo(() => {
//     return [
//       ...new Set(
//         approvedInvoiceItems
//           .map((item: any) => String(item?.vendor || "").trim())
//           .filter(Boolean)
//       ),
//     ] as string[];
//   }, [approvedInvoiceItems]);

//   const resolvedContext = (context ?? invoice ?? null) as
//     | T
//     | InvoiceRequest
//     | null;

//   const resolvedDocPath = useMemo(() => {
//     if (docPath && resolvedContext) {
//       return typeof docPath === "function"
//         ? docPath(resolvedContext as T)
//         : docPath;
//     }

//     if ((invoice as any)?.id) {
//       return [
//         "Panels",
//         "IEDGE-SYSTEM",
//         "invoiceRequests",
//         (invoice as any).id,
//       ];
//     }

//     return [];
//   }, [docPath, resolvedContext, invoice]);

//   const resolvedAmount = amount ?? (invoice ? invoiceApprovedAmount : 0);

//   const resolvedParties = parties ?? (invoice ? invoiceApprovedVendors : []);

//   const resolvedAmountLabel =
//     amountLabel ?? (invoice ? "Approved Amount" : "Amount");

//   const resolvedPartyLabel =
//     partyLabel ?? (invoice ? "Approved Vendors" : "Payee");

//   const resolvedInitialPaymentMethod =
//     initialPaymentMethod ?? (invoice ? "bank_transfer" : "cash");

//   const resolvedAmountReadOnly = amountReadOnly ?? !!invoice;

//   const resolvedAccounts = useMemo(() => {
//     const map = new Map<string, PaymentAccount>();

//     [...storedAccounts, ...accounts].forEach((acc) => {
//       if (!acc?.id) return;
//       map.set(acc.id, acc);
//     });

//     return Array.from(map.values()).filter((acc) => acc.isActive !== false);
//   }, [storedAccounts, accounts]);

//   const defaultInvoiceBuildUpdateData = ({
//     formData,
//     receiptUrl,
//     selectedAccount,
//     actor,
//   }: PaymentReleaseSubmitArgs<InvoiceRequest>) => {
//     const paymentDetails: any = {
//       paymentMethod: formData.paymentMethod,
//       amount: Number(formData.amount),
//       vendors: invoiceApprovedVendors,
//       transactionReference: formData.transactionReference,
//       bankReceiptUrl: receiptUrl,
//       paymentNotes: formData.paymentNotes,
//       releasedBy: actor.profileId || actor.uid,
//       releasedByName: actor.displayName || actor.email || "Unknown",
//       releasedAt: serverTimestamp(),
//     };

//     if (formData.chequeNumber) {
//       paymentDetails.chequeNumber = formData.chequeNumber;
//     }

//     if (selectedAccount) {
//       paymentDetails.selectedAccount = selectedAccount;
//     }

//     return {
//       status: "payment_released",
//       paymentDetails,
//     };
//   };

//   const [formData, setFormData] = useState<PaymentReleaseFormValues>({
//     paymentMethod: resolvedInitialPaymentMethod,
//     selectedAccountId: "",
//     amount: String(resolvedAmount || 0),
//     chequeNumber: "",
//     transactionReference: "",
//     paymentNotes: "",
//   });

//   useEffect(() => {
//     if (!isOpen) return;

//     setFormData({
//       paymentMethod: resolvedInitialPaymentMethod,
//       selectedAccountId: "",
//       amount: String(resolvedAmount || 0),
//       chequeNumber: "",
//       transactionReference: "",
//       paymentNotes: "",
//     });

//     setSelectedAccount(null);
//     setReceiptFile(null);
//   }, [isOpen, resolvedAmount, resolvedInitialPaymentMethod]);

//   useEffect(() => {
//     let mounted = true;

//     async function loadAccounts() {
//       try {
//         setAccountsLoading(true);
//         const rows = await fetchPaymentAccounts();
//         if (mounted) {
//           setStoredAccounts(rows);
//         }
//       } catch (error) {
//         console.error("Failed to load payment accounts:", error);
//         if (mounted) {
//           toast({
//             title: "Error",
//             description: "Failed to load payment accounts",
//             variant: "destructive",
//           });
//         }
//       } finally {
//         if (mounted) {
//           setAccountsLoading(false);
//         }
//       }
//     }

//     if (isOpen) {
//       loadAccounts();
//     }

//     return () => {
//       mounted = false;
//     };
//   }, [isOpen, toast]);

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();

//     if (!resolvedContext) {
//       toast({
//         title: "Error",
//         description: "No record selected",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!formData.paymentMethod) {
//       toast({
//         title: "Error",
//         description: "Please select a payment method",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!formData.amount || Number(formData.amount) <= 0) {
//       toast({
//         title: "Error",
//         description: "Please enter a valid amount",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (formData.paymentMethod === "cheque") {
//       if (!formData.selectedAccountId) {
//         toast({
//           title: "Error",
//           description: "Please select an account",
//           variant: "destructive",
//         });
//         return;
//       }

//       if (!formData.chequeNumber) {
//         toast({
//           title: "Error",
//           description: "Please enter cheque number",
//           variant: "destructive",
//         });
//         return;
//       }
//     }

//     try {
//       setLoading(true);

//       await releasePayment({
//         docPath: resolvedDocPath,
//         context: resolvedContext as any,
//         formData,
//         receiptFile,
//         selectedAccount,
//         actor: {
//           uid: currentUser?.uid,
//           email: currentUser?.email,
//           displayName: userProfile?.displayName || currentUser?.email,
//           profileId: userProfile?.id,
//         },
//         buildUpdateData: (buildUpdateData ||
//           defaultInvoiceBuildUpdateData) as any,
//       });

//       toast({
//         title: "Success",
//         description: "Payment released successfully",
//       });

//       onSuccess();
//       onClose();
//     } catch (error: any) {
//       console.error("Failed to release payment:", error);
//       toast({
//         title: "Error",
//         description: error?.message || "Failed to release payment",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-2xl">
//         <DialogHeader>
//           <DialogTitle>{title}</DialogTitle>
//         </DialogHeader>

//         <div className="bg-muted p-4 rounded-lg mb-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//             <div>
//               <span className="text-muted-foreground">
//                 {resolvedAmountLabel}:
//               </span>
//               <span className="ml-2 font-semibold">
//                 Rs {Number(resolvedAmount || 0).toLocaleString()}
//               </span>
//             </div>

//             <div>
//               <span className="text-muted-foreground">
//                 {resolvedPartyLabel}:
//               </span>
//               <span className="ml-2">
//                 {resolvedParties.length ? resolvedParties.join(", ") : "-"}
//               </span>
//             </div>
//           </div>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-5">
//           <div>
//             <Label htmlFor="amount">Release Amount</Label>
//             <Input
//               id="amount"
//               type="number"
//               value={formData.amount}
//               readOnly={resolvedAmountReadOnly}
//               className={resolvedAmountReadOnly ? "bg-muted" : ""}
//               onChange={(e) =>
//                 setFormData((prev) => ({ ...prev, amount: e.target.value }))
//               }
//             />
//           </div>

//           <div>
//             <Label htmlFor="paymentMethod">Payment Method</Label>
//             <Select
//               value={formData.paymentMethod}
//               onValueChange={(value: any) =>
//                 setFormData((prev) => ({ ...prev, paymentMethod: value }))
//               }
//             >
//               <SelectTrigger>
//                 <SelectValue placeholder="Select payment method" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="cash">Cash</SelectItem>
//                 <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
//                 <SelectItem value="wire">Online Transfer</SelectItem>
//                 {allowCheque && <SelectItem value="cheque">Cheque</SelectItem>}
//               </SelectContent>
//             </Select>
//           </div>

//           {formData.paymentMethod === "cheque" && allowCheque && (
//             <>
//               <div>
//                 <Label htmlFor="account">Select Account</Label>
//                 <Select
//                   value={formData.selectedAccountId}
//                   onValueChange={(value) => {
//                     const account =
//                       resolvedAccounts.find((acc) => acc.id === value) || null;

//                     setSelectedAccount(account);
//                     setFormData((prev) => ({
//                       ...prev,
//                       selectedAccountId: value,
//                     }));
//                   }}
//                 >
//                   <SelectTrigger>
//                     <SelectValue
//                       placeholder={
//                         accountsLoading
//                           ? "Loading accounts..."
//                           : "Select account"
//                       }
//                     />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {resolvedAccounts.length === 0 ? (
//                       <SelectItem value="__no_accounts__" disabled>
//                         No active accounts found
//                       </SelectItem>
//                     ) : (
//                       resolvedAccounts.map((account) => (
//                         <SelectItem key={account.id} value={account.id}>
//                           {account.accountName || account.id}
//                         </SelectItem>
//                       ))
//                     )}
//                   </SelectContent>
//                 </Select>
//               </div>

//               {selectedAccount && (
//                 <div className="bg-muted p-4 rounded-lg">
//                   <h4 className="font-medium text-foreground mb-2">
//                     Account Information
//                   </h4>
//                   <div className="grid grid-cols-2 gap-4 text-sm">
//                     <div>
//                       <span className="text-muted-foreground">
//                         Account Name:
//                       </span>
//                       <span className="text-foreground ml-2">
//                         {selectedAccount.accountName || "-"}
//                       </span>
//                     </div>
//                     <div>
//                       <span className="text-muted-foreground">
//                         Account Number:
//                       </span>
//                       <span className="text-foreground ml-2">
//                         {selectedAccount.accountNumber || "-"}
//                       </span>
//                     </div>
//                     <div>
//                       <span className="text-muted-foreground">Bank:</span>
//                       <span className="text-foreground ml-2">
//                         {selectedAccount.bankName || "-"}
//                       </span>
//                     </div>
//                     <div>
//                       <span className="text-muted-foreground">Balance:</span>
//                       <span className="text-foreground ml-2">
//                         {(
//                           selectedAccount.currentBalance ??
//                           selectedAccount.balance ??
//                           0
//                         ).toLocaleString()}
//                       </span>
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
//                     setFormData((prev) => ({
//                       ...prev,
//                       chequeNumber: e.target.value,
//                     }))
//                   }
//                   placeholder="Enter cheque number"
//                 />
//               </div>
//             </>
//           )}

//           <div>
//             <Label htmlFor="transactionReference">Transaction Reference</Label>
//             <Input
//               id="transactionReference"
//               value={formData.transactionReference}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   transactionReference: e.target.value,
//                 }))
//               }
//               placeholder="Enter transaction reference"
//             />
//           </div>

//           {allowReceiptUpload && (
//             <div>
//               <Label htmlFor="receipt">Upload Receipt / Cheque Copy</Label>
//               <Input
//                 id="receipt"
//                 type="file"
//                 accept=".jpg,.jpeg,.png,.pdf"
//                 onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
//               />
//               {receiptFile && (
//                 <p className="text-green-600 mt-1">
//                   {receiptFile.name} selected
//                 </p>
//               )}
//             </div>
//           )}

//           <div>
//             <Label htmlFor="paymentNotes">Payment Notes</Label>
//             <Textarea
//               id="paymentNotes"
//               rows={3}
//               value={formData.paymentNotes}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   paymentNotes: e.target.value,
//                 }))
//               }
//               placeholder="Add any notes..."
//             />
//           </div>

//           <div className="flex justify-end gap-3">
//             <Button type="button" variant="outline" onClick={onClose}>
//               Cancel
//             </Button>
//             <Button type="submit" disabled={loading}>
//               {loading ? "Releasing..." : "Release Payment"}
//             </Button>
//           </div>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }

// import { useEffect, useMemo, useState } from "react";
// import { serverTimestamp } from "firebase/firestore";
// import { useAuth } from "@/contexts/AuthContext";
// import { releasePayment } from "@/lib/payments/releasePayment";
// import { fetchPaymentAccounts } from "@/lib/payments/paymentAccounts";
// import {
//   PaymentAccount,
//   PaymentReleaseFormValues,
//   PaymentReleaseSubmitArgs,
// } from "@/lib/payments/types";
// import { InvoiceRequest } from "@shared/schema";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Textarea } from "@/components/ui/textarea";
// import { useToast } from "@/hooks/use-toast";

// interface PaymentReleaseModalProps<T = any> {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: () => void;
//   title?: string;

//   invoice?: InvoiceRequest | null;

//   context?: T | null;
//   docPath?: ((context: T) => string[]) | string[];
//   buildUpdateData?: (
//     args: PaymentReleaseSubmitArgs<T>
//   ) => Record<string, any>;

//   amount?: number;
//   amountLabel?: string;
//   partyLabel?: string;
//   parties?: string[];

//   accounts?: PaymentAccount[];
//   allowCheque?: boolean;
//   allowReceiptUpload?: boolean;
//   initialPaymentMethod?: "cash" | "cheque" | "bank_transfer" | "wire";
//   amountReadOnly?: boolean;
// }

// type ExtendedPaymentReleaseFormValues = PaymentReleaseFormValues & {
//   chequeNumbers: string[];
// };

// function cleanChequeNumbers(values: string[] = []) {
//   return values.map((value) => value.trim()).filter(Boolean);
// }

// export default function PaymentReleaseModal<T = any>({
//   isOpen,
//   onClose,
//   onSuccess,
//   title = "Release Payment",
//   invoice = null,

//   context = null,
//   docPath,
//   buildUpdateData,

//   amount,
//   amountLabel,
//   partyLabel,
//   parties,

//   accounts = [],
//   allowCheque = true,
//   allowReceiptUpload = true,
//   initialPaymentMethod,
//   amountReadOnly,
// }: PaymentReleaseModalProps<T>) {
//   const { userProfile, currentUser } = useAuth();
//   const { toast } = useToast();

//   const [loading, setLoading] = useState(false);
//   const [accountsLoading, setAccountsLoading] = useState(false);
//   const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
//   const [selectedAccount, setSelectedAccount] = useState<PaymentAccount | null>(
//     null
//   );
//   const [storedAccounts, setStoredAccounts] = useState<PaymentAccount[]>([]);

//   const approvedInvoiceItems = useMemo(() => {
//     const items = Array.isArray((invoice as any)?.lineItems)
//       ? (invoice as any).lineItems
//       : [];

//     return items.filter((item: any) => item?.status === "approved");
//   }, [invoice]);

//   const invoiceApprovedAmount = useMemo(() => {
//     return approvedInvoiceItems.reduce((sum: number, item: any) => {
//       const qty = Number(item?.units || 0);
//       const rate = Number(item?.unitRate || 0);
//       const tax = Number(item?.tax || 0);
//       const total = Number(item?.total ?? qty * rate + tax);
//       return sum + total;
//     }, 0);
//   }, [approvedInvoiceItems]);

//   const invoiceApprovedVendors = useMemo(() => {
//     return [
//       ...new Set(
//         approvedInvoiceItems
//           .map((item: any) => String(item?.vendor || "").trim())
//           .filter(Boolean)
//       ),
//     ] as string[];
//   }, [approvedInvoiceItems]);

//   const resolvedContext = (context ?? invoice ?? null) as
//     | T
//     | InvoiceRequest
//     | null;

//   const resolvedDocPath = useMemo(() => {
//     if (docPath && resolvedContext) {
//       return typeof docPath === "function"
//         ? docPath(resolvedContext as T)
//         : docPath;
//     }

//     if ((invoice as any)?.id) {
//       return [
//         "Panels",
//         "IEDGE-SYSTEM",
//         "invoiceRequests",
//         (invoice as any).id,
//       ];
//     }

//     return [];
//   }, [docPath, resolvedContext, invoice]);

//   const resolvedAmount = amount ?? (invoice ? invoiceApprovedAmount : 0);

//   const resolvedParties = parties ?? (invoice ? invoiceApprovedVendors : []);

//   const resolvedAmountLabel =
//     amountLabel ?? (invoice ? "Approved Amount" : "Amount");

//   const resolvedPartyLabel =
//     partyLabel ?? (invoice ? "Approved Vendors" : "Payee");

//   const resolvedInitialPaymentMethod =
//     initialPaymentMethod ?? (invoice ? "bank_transfer" : "cash");

//   const resolvedAmountReadOnly = amountReadOnly ?? !!invoice;

//   const resolvedAccounts = useMemo(() => {
//     const map = new Map<string, PaymentAccount>();

//     [...storedAccounts, ...accounts].forEach((acc) => {
//       if (!acc?.id) return;
//       map.set(acc.id, acc);
//     });

//     return Array.from(map.values()).filter((acc) => acc.isActive !== false);
//   }, [storedAccounts, accounts]);

//   const defaultInvoiceBuildUpdateData = (
//     args: PaymentReleaseSubmitArgs<InvoiceRequest>
//   ) => {
//     const { formData, receiptUrl, selectedAccount, actor } = args;

//     const extendedFormData = formData as ExtendedPaymentReleaseFormValues;

//     const chequeNumbers = cleanChequeNumbers(
//       extendedFormData.chequeNumbers?.length
//         ? extendedFormData.chequeNumbers
//         : [extendedFormData.chequeNumber || ""]
//     );

//     const receiptUrls = Array.isArray((args as any).receiptUrls)
//       ? (args as any).receiptUrls
//       : receiptUrl
//         ? [receiptUrl]
//         : [];

//     const paymentDetails: any = {
//       paymentMethod: extendedFormData.paymentMethod,
//       amount: Number(extendedFormData.amount),
//       vendors: invoiceApprovedVendors,
//       transactionReference: extendedFormData.transactionReference,
//       bankReceiptUrl: receiptUrls[0] || receiptUrl || "",
//       bankReceiptUrls: receiptUrls,
//       paymentNotes: extendedFormData.paymentNotes,
//       releasedBy: actor.profileId || actor.uid,
//       releasedByName: actor.displayName || actor.email || "Unknown",
//       releasedAt: serverTimestamp(),
//     };

//     if (chequeNumbers.length > 0) {
//       paymentDetails.chequeNumber = chequeNumbers[0];
//       paymentDetails.chequeNumbers = chequeNumbers;
//     }

//     if (selectedAccount) {
//       paymentDetails.selectedAccount = selectedAccount;
//     }

//     return {
//       status: "payment_released",
//       paymentDetails,
//     };
//   };

//   const [formData, setFormData] = useState<ExtendedPaymentReleaseFormValues>({
//     paymentMethod: resolvedInitialPaymentMethod,
//     selectedAccountId: "",
//     amount: String(resolvedAmount || 0),
//     chequeNumber: "",
//     chequeNumbers: [""],
//     transactionReference: "",
//     paymentNotes: "",
//   });

//   useEffect(() => {
//     if (!isOpen) return;

//     setFormData({
//       paymentMethod: resolvedInitialPaymentMethod,
//       selectedAccountId: "",
//       amount: String(resolvedAmount || 0),
//       chequeNumber: "",
//       chequeNumbers: [""],
//       transactionReference: "",
//       paymentNotes: "",
//     });

//     setSelectedAccount(null);
//     setReceiptFiles([]);
//   }, [isOpen, resolvedAmount, resolvedInitialPaymentMethod]);

//   useEffect(() => {
//     let mounted = true;

//     async function loadAccounts() {
//       try {
//         setAccountsLoading(true);
//         const rows = await fetchPaymentAccounts();
//         if (mounted) {
//           setStoredAccounts(rows);
//         }
//       } catch (error) {
//         console.error("Failed to load payment accounts:", error);
//         if (mounted) {
//           toast({
//             title: "Error",
//             description: "Failed to load payment accounts",
//             variant: "destructive",
//           });
//         }
//       } finally {
//         if (mounted) {
//           setAccountsLoading(false);
//         }
//       }
//     }

//     if (isOpen) {
//       loadAccounts();
//     }

//     return () => {
//       mounted = false;
//     };
//   }, [isOpen, toast]);

//   const handleChequeNumberChange = (index: number, value: string) => {
//     setFormData((prev) => {
//       const updatedChequeNumbers = [...prev.chequeNumbers];
//       updatedChequeNumbers[index] = value;

//       return {
//         ...prev,
//         chequeNumbers: updatedChequeNumbers,
//         chequeNumber: updatedChequeNumbers[0] || "",
//       };
//     });
//   };

//   const handleAddChequeNumber = () => {
//     setFormData((prev) => ({
//       ...prev,
//       chequeNumbers: [...prev.chequeNumbers, ""],
//     }));
//   };

//   const handleRemoveChequeNumber = (index: number) => {
//     setFormData((prev) => {
//       const updatedChequeNumbers = prev.chequeNumbers.filter(
//         (_, chequeIndex) => chequeIndex !== index
//       );

//       const safeChequeNumbers =
//         updatedChequeNumbers.length > 0 ? updatedChequeNumbers : [""];

//       return {
//         ...prev,
//         chequeNumbers: safeChequeNumbers,
//         chequeNumber: safeChequeNumbers[0] || "",
//       };
//     });
//   };

//   const handleReceiptFilesChange = (
//     event: React.ChangeEvent<HTMLInputElement>
//   ) => {
//     const files = Array.from(event.target.files || []);
//     setReceiptFiles(files);
//   };

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();

//     if (!resolvedContext) {
//       toast({
//         title: "Error",
//         description: "No record selected",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!formData.paymentMethod) {
//       toast({
//         title: "Error",
//         description: "Please select a payment method",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!formData.amount || Number(formData.amount) <= 0) {
//       toast({
//         title: "Error",
//         description: "Please enter a valid amount",
//         variant: "destructive",
//       });
//       return;
//     }

//     const normalizedChequeNumbers = cleanChequeNumbers(formData.chequeNumbers);

//     if (formData.paymentMethod === "cheque") {
//       if (!formData.selectedAccountId) {
//         toast({
//           title: "Error",
//           description: "Please select an account",
//           variant: "destructive",
//         });
//         return;
//       }

//       if (normalizedChequeNumbers.length === 0) {
//         toast({
//           title: "Error",
//           description: "Please enter at least one cheque number",
//           variant: "destructive",
//         });
//         return;
//       }
//     }

//     const normalizedFormData: ExtendedPaymentReleaseFormValues = {
//       ...formData,
//       chequeNumber: normalizedChequeNumbers[0] || "",
//       chequeNumbers: normalizedChequeNumbers,
//     };

//     try {
//       setLoading(true);

//       await releasePayment({
//         docPath: resolvedDocPath,
//         context: resolvedContext as any,
//         formData: normalizedFormData as any,

//         // Old support: existing releasePayment can still use this first file.
//         receiptFile: receiptFiles[0] || null,

//         // New support: update releasePayment to upload these if not already supported.
//         receiptFiles,

//         selectedAccount,
//         actor: {
//           uid: currentUser?.uid,
//           email: currentUser?.email,
//           displayName: userProfile?.displayName || currentUser?.email,
//           profileId: userProfile?.id,
//         },
//         buildUpdateData: (buildUpdateData ||
//           defaultInvoiceBuildUpdateData) as any,
//       } as any);

//       toast({
//         title: "Success",
//         description: "Payment released successfully",
//       });

//       onSuccess();
//       onClose();
//     } catch (error: any) {
//       console.error("Failed to release payment:", error);
//       toast({
//         title: "Error",
//         description: error?.message || "Failed to release payment",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-2xl">
//         <DialogHeader>
//           <DialogTitle>{title}</DialogTitle>
//         </DialogHeader>

//         <div className="bg-muted p-4 rounded-lg mb-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//             <div>
//               <span className="text-muted-foreground">
//                 {resolvedAmountLabel}:
//               </span>
//               <span className="ml-2 font-semibold">
//                 Rs {Number(resolvedAmount || 0).toLocaleString()}
//               </span>
//             </div>

//             <div>
//               <span className="text-muted-foreground">
//                 {resolvedPartyLabel}:
//               </span>
//               <span className="ml-2">
//                 {resolvedParties.length ? resolvedParties.join(", ") : "-"}
//               </span>
//             </div>
//           </div>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-5">
//           <div>
//             <Label htmlFor="amount">Release Amount</Label>
//             <Input
//               id="amount"
//               type="number"
//               value={formData.amount}
//               readOnly={resolvedAmountReadOnly}
//               className={resolvedAmountReadOnly ? "bg-muted" : ""}
//               onChange={(e) =>
//                 setFormData((prev) => ({ ...prev, amount: e.target.value }))
//               }
//             />
//           </div>

//           <div>
//             <Label htmlFor="paymentMethod">Payment Method</Label>
//             <Select
//               value={formData.paymentMethod}
//               onValueChange={(value: any) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   paymentMethod: value,
//                   chequeNumbers:
//                     value === "cheque" && prev.chequeNumbers.length === 0
//                       ? [""]
//                       : prev.chequeNumbers,
//                 }))
//               }
//             >
//               <SelectTrigger>
//                 <SelectValue placeholder="Select payment method" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="cash">Cash</SelectItem>
//                 <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
//                 <SelectItem value="wire">Online Transfer</SelectItem>
//                 {allowCheque && <SelectItem value="cheque">Cheque</SelectItem>}
//               </SelectContent>
//             </Select>
//           </div>

//           {formData.paymentMethod === "cheque" && allowCheque && (
//             <>
//               <div>
//                 <Label htmlFor="account">Select Account</Label>
//                 <Select
//                   value={formData.selectedAccountId}
//                   onValueChange={(value) => {
//                     const account =
//                       resolvedAccounts.find((acc) => acc.id === value) || null;

//                     setSelectedAccount(account);
//                     setFormData((prev) => ({
//                       ...prev,
//                       selectedAccountId: value,
//                     }));
//                   }}
//                 >
//                   <SelectTrigger>
//                     <SelectValue
//                       placeholder={
//                         accountsLoading
//                           ? "Loading accounts..."
//                           : "Select account"
//                       }
//                     />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {resolvedAccounts.length === 0 ? (
//                       <SelectItem value="__no_accounts__" disabled>
//                         No active accounts found
//                       </SelectItem>
//                     ) : (
//                       resolvedAccounts.map((account) => (
//                         <SelectItem key={account.id} value={account.id}>
//                           {account.accountName || account.id}
//                         </SelectItem>
//                       ))
//                     )}
//                   </SelectContent>
//                 </Select>
//               </div>

//               {selectedAccount && (
//                 <div className="bg-muted p-4 rounded-lg">
//                   <h4 className="font-medium text-foreground mb-2">
//                     Account Information
//                   </h4>
//                   <div className="grid grid-cols-2 gap-4 text-sm">
//                     <div>
//                       <span className="text-muted-foreground">
//                         Account Name:
//                       </span>
//                       <span className="text-foreground ml-2">
//                         {selectedAccount.accountName || "-"}
//                       </span>
//                     </div>
//                     <div>
//                       <span className="text-muted-foreground">
//                         Account Number:
//                       </span>
//                       <span className="text-foreground ml-2">
//                         {selectedAccount.accountNumber || "-"}
//                       </span>
//                     </div>
//                     <div>
//                       <span className="text-muted-foreground">Bank:</span>
//                       <span className="text-foreground ml-2">
//                         {selectedAccount.bankName || "-"}
//                       </span>
//                     </div>
//                     <div>
//                       <span className="text-muted-foreground">Balance:</span>
//                       <span className="text-foreground ml-2">
//                         {(
//                           selectedAccount.currentBalance ??
//                           selectedAccount.balance ??
//                           0
//                         ).toLocaleString()}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               <div className="space-y-3">
//                 <div className="flex items-center justify-between gap-3">
//                   <Label>Cheque Numbers</Label>
//                   <Button
//                     type="button"
//                     variant="outline"
//                     size="sm"
//                     onClick={handleAddChequeNumber}
//                   >
//                     Add Cheque
//                   </Button>
//                 </div>

//                 {formData.chequeNumbers.map((chequeNumber, index) => (
//                   <div key={index} className="flex items-center gap-2">
//                     <Input
//                       value={chequeNumber}
//                       onChange={(e) =>
//                         handleChequeNumberChange(index, e.target.value)
//                       }
//                       placeholder={`Enter cheque number ${index + 1}`}
//                     />

//                     <Button
//                       type="button"
//                       variant="outline"
//                       size="sm"
//                       onClick={() => handleRemoveChequeNumber(index)}
//                       disabled={formData.chequeNumbers.length === 1}
//                     >
//                       Remove
//                     </Button>
//                   </div>
//                 ))}
//               </div>
//             </>
//           )}

//           <div>
//             <Label htmlFor="transactionReference">Transaction Reference</Label>
//             <Input
//               id="transactionReference"
//               value={formData.transactionReference}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   transactionReference: e.target.value,
//                 }))
//               }
//               placeholder="Enter transaction reference"
//             />
//           </div>

//           {allowReceiptUpload && (
//             <div>
//               <Label htmlFor="receipt">Upload Receipt / Cheque Copies</Label>
//               <Input
//                 id="receipt"
//                 type="file"
//                 accept=".jpg,.jpeg,.png,.pdf"
//                 multiple
//                 onChange={handleReceiptFilesChange}
//               />

//               {receiptFiles.length > 0 && (
//                 <div className="mt-2 space-y-1 text-sm text-green-600">
//                   {receiptFiles.map((file, index) => (
//                     <p key={`${file.name}-${index}`}>
//                       {index + 1}. {file.name} selected
//                     </p>
//                   ))}
//                 </div>
//               )}
//             </div>
//           )}

//           <div>
//             <Label htmlFor="paymentNotes">Payment Notes</Label>
//             <Textarea
//               id="paymentNotes"
//               rows={3}
//               value={formData.paymentNotes}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   paymentNotes: e.target.value,
//                 }))
//               }
//               placeholder="Add any notes..."
//             />
//           </div>

//           <div className="flex justify-end gap-3">
//             <Button type="button" variant="outline" onClick={onClose}>
//               Cancel
//             </Button>
//             <Button type="submit" disabled={loading}>
//               {loading ? "Releasing..." : "Release Payment"}
//             </Button>
//           </div>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }

// import {
//   useEffect,
//   useMemo,
//   useState,
//   type ChangeEvent,
//   type FormEvent,
// } from "react";
// import { serverTimestamp } from "firebase/firestore";
// import {
//   ArrowLeft,
//   Banknote,
//   Building2,
//   CheckCircle2,
//   CreditCard,
//   FileUp,
//   Loader2,
//   Plus,
//   ReceiptText,
//   Trash2,
//   Wallet,
// } from "lucide-react";
// import { useAuth } from "@/contexts/AuthContext";
// import { releasePayment } from "@/lib/payments/releasePayment";
// import { fetchPaymentAccounts } from "@/lib/payments/paymentAccounts";
// import {
//   PaymentAccount,
//   PaymentReleaseFormValues,
//   PaymentReleaseSubmitArgs,
// } from "@/lib/payments/types";
// import { InvoiceRequest } from "@shared/schema";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Textarea } from "@/components/ui/textarea";
// import { useToast } from "@/hooks/use-toast";

// interface PaymentReleaseModalProps<T = any> {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: () => void;
//   title?: string;

//   invoice?: InvoiceRequest | null;

//   context?: T | null;
//   docPath?: ((context: T) => string[]) | string[];
//   buildUpdateData?: (
//     args: PaymentReleaseSubmitArgs<T>
//   ) => Record<string, any>;

//   amount?: number;
//   amountLabel?: string;
//   partyLabel?: string;
//   parties?: string[];

//   accounts?: PaymentAccount[];
//   allowCheque?: boolean;
//   allowReceiptUpload?: boolean;
//   initialPaymentMethod?: "cash" | "cheque" | "bank_transfer" | "wire";
//   amountReadOnly?: boolean;
// }

// type ExtendedPaymentReleaseFormValues = PaymentReleaseFormValues & {
//   chequeNumbers: string[];
// };

// function cleanChequeNumbers(values: string[] = []) {
//   return values.map((value) => value.trim()).filter(Boolean);
// }

// function formatPKR(value: number | string | undefined | null) {
//   const numberValue =
//     typeof value === "number"
//       ? value
//       : Number(String(value || 0).replace(/,/g, "")) || 0;

//   return numberValue.toLocaleString("en-PK", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });
// }

// function getPaymentMethodLabel(method?: string) {
//   switch (method) {
//     case "cash":
//       return "Cash";
//     case "cheque":
//       return "Cheque";
//     case "bank_transfer":
//       return "Bank Transfer";
//     case "wire":
//       return "Online Transfer";
//     default:
//       return "Not Selected";
//   }
// }

// function getFileSizeLabel(bytes: number) {
//   if (!bytes) return "0 KB";

//   const kb = bytes / 1024;
//   if (kb < 1024) return `${kb.toFixed(1)} KB`;

//   return `${(kb / 1024).toFixed(1)} MB`;
// }

// export default function PaymentReleaseModal<T = any>({
//   isOpen,
//   onClose,
//   onSuccess,
//   title = "Release Payment",
//   invoice = null,

//   context = null,
//   docPath,
//   buildUpdateData,

//   amount,
//   amountLabel,
//   partyLabel,
//   parties,

//   accounts = [],
//   allowCheque = true,
//   allowReceiptUpload = true,
//   initialPaymentMethod,
//   amountReadOnly,
// }: PaymentReleaseModalProps<T>) {
//   const { userProfile, currentUser } = useAuth();
//   const { toast } = useToast();

//   const [loading, setLoading] = useState(false);
//   const [accountsLoading, setAccountsLoading] = useState(false);
//   const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
//   const [selectedAccount, setSelectedAccount] = useState<PaymentAccount | null>(
//     null
//   );
//   const [storedAccounts, setStoredAccounts] = useState<PaymentAccount[]>([]);

//   const approvedInvoiceItems = useMemo(() => {
//     const items = Array.isArray((invoice as any)?.lineItems)
//       ? (invoice as any).lineItems
//       : [];

//     return items.filter((item: any) => item?.status === "approved");
//   }, [invoice]);

//   const invoiceApprovedAmount = useMemo(() => {
//     return approvedInvoiceItems.reduce((sum: number, item: any) => {
//       const qty = Number(item?.units || 0);
//       const rate = Number(item?.unitRate || 0);
//       const tax = Number(item?.tax || 0);
//       const total = Number(item?.total ?? qty * rate + tax);

//       return sum + total;
//     }, 0);
//   }, [approvedInvoiceItems]);

//   const invoiceApprovedVendors = useMemo(() => {
//     return [
//       ...new Set(
//         approvedInvoiceItems
//           .map((item: any) => String(item?.vendor || "").trim())
//           .filter(Boolean)
//       ),
//     ] as string[];
//   }, [approvedInvoiceItems]);

//   const resolvedContext = (context ?? invoice ?? null) as
//     | T
//     | InvoiceRequest
//     | null;

//   const resolvedDocPath = useMemo(() => {
//     if (docPath && resolvedContext) {
//       return typeof docPath === "function"
//         ? docPath(resolvedContext as T)
//         : docPath;
//     }

//     if ((invoice as any)?.id) {
//       return [
//         "Panels",
//         "IEDGE-SYSTEM",
//         "invoiceRequests",
//         (invoice as any).id,
//       ];
//     }

//     return [];
//   }, [docPath, resolvedContext, invoice]);

//   const resolvedAmount = amount ?? (invoice ? invoiceApprovedAmount : 0);

//   const resolvedParties = parties ?? (invoice ? invoiceApprovedVendors : []);

//   const resolvedAmountLabel =
//     amountLabel ?? (invoice ? "Approved Amount" : "Amount");

//   const resolvedPartyLabel =
//     partyLabel ?? (invoice ? "Approved Vendors" : "Payee");

//   const resolvedInitialPaymentMethod =
//     initialPaymentMethod ?? (invoice ? "bank_transfer" : "cash");

//   const resolvedAmountReadOnly = amountReadOnly ?? !!invoice;

//   const resolvedAccounts = useMemo(() => {
//     const map = new Map<string, PaymentAccount>();

//     [...storedAccounts, ...accounts].forEach((acc) => {
//       if (!acc?.id) return;
//       map.set(acc.id, acc);
//     });

//     return Array.from(map.values()).filter((acc) => acc.isActive !== false);
//   }, [storedAccounts, accounts]);

//   const defaultInvoiceBuildUpdateData = (
//     args: PaymentReleaseSubmitArgs<InvoiceRequest>
//   ) => {
//     const { formData, receiptUrl, selectedAccount, actor } = args;

//     const extendedFormData = formData as ExtendedPaymentReleaseFormValues;

//     const chequeNumbers = cleanChequeNumbers(
//       extendedFormData.chequeNumbers?.length
//         ? extendedFormData.chequeNumbers
//         : [extendedFormData.chequeNumber || ""]
//     );

//     const receiptUrls = Array.isArray((args as any).receiptUrls)
//       ? (args as any).receiptUrls
//       : receiptUrl
//         ? [receiptUrl]
//         : [];

//     const paymentDetails: any = {
//       paymentMethod: extendedFormData.paymentMethod,
//       amount: Number(extendedFormData.amount),
//       vendors: invoiceApprovedVendors,
//       transactionReference: extendedFormData.transactionReference,
//       bankReceiptUrl: receiptUrls[0] || receiptUrl || "",
//       bankReceiptUrls: receiptUrls,
//       paymentNotes: extendedFormData.paymentNotes,
//       releasedBy: actor.profileId || actor.uid,
//       releasedByName: actor.displayName || actor.email || "Unknown",
//       releasedAt: serverTimestamp(),
//     };

//     if (chequeNumbers.length > 0) {
//       paymentDetails.chequeNumber = chequeNumbers[0];
//       paymentDetails.chequeNumbers = chequeNumbers;
//     }

//     if (selectedAccount) {
//       paymentDetails.selectedAccount = selectedAccount;
//     }

//     return {
//       status: "payment_released",
//       paymentDetails,
//     };
//   };

//   const [formData, setFormData] = useState<ExtendedPaymentReleaseFormValues>({
//     paymentMethod: resolvedInitialPaymentMethod,
//     selectedAccountId: "",
//     amount: String(resolvedAmount || 0),
//     chequeNumber: "",
//     chequeNumbers: [""],
//     transactionReference: "",
//     paymentNotes: "",
//   });

//   useEffect(() => {
//     if (!isOpen) return;

//     setFormData({
//       paymentMethod: resolvedInitialPaymentMethod,
//       selectedAccountId: "",
//       amount: String(resolvedAmount || 0),
//       chequeNumber: "",
//       chequeNumbers: [""],
//       transactionReference: "",
//       paymentNotes: "",
//     });

//     setSelectedAccount(null);
//     setReceiptFiles([]);
//   }, [isOpen, resolvedAmount, resolvedInitialPaymentMethod]);

//   useEffect(() => {
//     let mounted = true;

//     async function loadAccounts() {
//       try {
//         setAccountsLoading(true);

//         const rows = await fetchPaymentAccounts();

//         if (mounted) {
//           setStoredAccounts(rows);
//         }
//       } catch (error) {
//         console.error("Failed to load payment accounts:", error);

//         if (mounted) {
//           toast({
//             title: "Error",
//             description: "Failed to load payment accounts",
//             variant: "destructive",
//           });
//         }
//       } finally {
//         if (mounted) {
//           setAccountsLoading(false);
//         }
//       }
//     }

//     if (isOpen) {
//       loadAccounts();
//     }

//     return () => {
//       mounted = false;
//     };
//   }, [isOpen, toast]);

//   const handleChequeNumberChange = (index: number, value: string) => {
//     setFormData((prev) => {
//       const updatedChequeNumbers = [...prev.chequeNumbers];
//       updatedChequeNumbers[index] = value;

//       return {
//         ...prev,
//         chequeNumbers: updatedChequeNumbers,
//         chequeNumber: updatedChequeNumbers[0] || "",
//       };
//     });
//   };

//   const handleAddChequeNumber = () => {
//     setFormData((prev) => ({
//       ...prev,
//       chequeNumbers: [...prev.chequeNumbers, ""],
//     }));
//   };

//   const handleRemoveChequeNumber = (index: number) => {
//     setFormData((prev) => {
//       const updatedChequeNumbers = prev.chequeNumbers.filter(
//         (_, chequeIndex) => chequeIndex !== index
//       );

//       const safeChequeNumbers =
//         updatedChequeNumbers.length > 0 ? updatedChequeNumbers : [""];

//       return {
//         ...prev,
//         chequeNumbers: safeChequeNumbers,
//         chequeNumber: safeChequeNumbers[0] || "",
//       };
//     });
//   };

//   const handleReceiptFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
//     const files = Array.from(event.target.files || []);
//     setReceiptFiles(files);
//   };

//   const handleRemoveReceiptFile = (index: number) => {
//     setReceiptFiles((prev) =>
//       prev.filter((_, fileIndex) => fileIndex !== index)
//     );
//   };

//   async function handleSubmit(e: FormEvent<HTMLFormElement>) {
//     e.preventDefault();

//     if (!resolvedContext) {
//       toast({
//         title: "Error",
//         description: "No record selected",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!formData.paymentMethod) {
//       toast({
//         title: "Error",
//         description: "Please select a payment method",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!formData.amount || Number(formData.amount) <= 0) {
//       toast({
//         title: "Error",
//         description: "Please enter a valid amount",
//         variant: "destructive",
//       });
//       return;
//     }

//     const normalizedChequeNumbers = cleanChequeNumbers(formData.chequeNumbers);

//     if (formData.paymentMethod === "cheque") {
//       if (!formData.selectedAccountId) {
//         toast({
//           title: "Error",
//           description: "Please select an account",
//           variant: "destructive",
//         });
//         return;
//       }

//       if (normalizedChequeNumbers.length === 0) {
//         toast({
//           title: "Error",
//           description: "Please enter at least one cheque number",
//           variant: "destructive",
//         });
//         return;
//       }
//     }

//     const normalizedFormData: ExtendedPaymentReleaseFormValues = {
//       ...formData,
//       chequeNumber: normalizedChequeNumbers[0] || "",
//       chequeNumbers: normalizedChequeNumbers,
//     };

//     try {
//       setLoading(true);

//       await releasePayment({
//         docPath: resolvedDocPath,
//         context: resolvedContext as any,
//         formData: normalizedFormData as any,

//         // Old support: existing releasePayment can still use this first file.
//         receiptFile: receiptFiles[0] || null,

//         // New support: update releasePayment to upload these if not already supported.
//         receiptFiles,

//         selectedAccount,
//         actor: {
//           uid: currentUser?.uid,
//           email: currentUser?.email,
//           displayName: userProfile?.displayName || currentUser?.email,
//           profileId: userProfile?.id,
//         },
//         buildUpdateData: (buildUpdateData ||
//           defaultInvoiceBuildUpdateData) as any,
//       } as any);

//       toast({
//         title: "Success",
//         description: "Payment released successfully",
//       });

//       onSuccess();
//       onClose();
//     } catch (error: any) {
//       console.error("Failed to release payment:", error);

//       toast({
//         title: "Error",
//         description: error?.message || "Failed to release payment",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   }

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 min-h-screen overflow-y-auto bg-slate-50">
//       <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
//         <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
//           <div className="flex items-start gap-4">
//             <Button
//               type="button"
//               variant="outline"
//               size="icon"
//               className="mt-1 h-10 w-10 rounded-full border-slate-200 bg-white shadow-sm hover:bg-slate-50"
//               onClick={onClose}
//             >
//               <ArrowLeft className="h-4 w-4" />
//             </Button>

//             <div>
//               <div className="flex flex-wrap items-center gap-2">
//                 <h1 className="text-2xl font-bold tracking-tight text-slate-950">
//                   {title}
//                 </h1>

//                 <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
//                   Payment Release
//                 </span>
//               </div>

//               <p className="mt-1 max-w-2xl text-sm text-slate-500">
//                 Review payment information, select the payment method, attach
//                 receipts, and release the approved amount.
//               </p>
//             </div>
//           </div>

//           <div className="flex flex-wrap gap-2">
//             <Button
//               type="button"
//               variant="outline"
//               className="rounded-full border-slate-200 px-5"
//               onClick={onClose}
//               disabled={loading}
//             >
//               Cancel
//             </Button>

//             <Button
//               type="submit"
//               form="payment-release-form"
//               disabled={loading}
//               className="rounded-full bg-slate-950 px-6 text-white shadow-sm hover:bg-slate-800"
//             >
//               {loading ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Releasing...
//                 </>
//               ) : (
//                 <>
//                   <CheckCircle2 className="mr-2 h-4 w-4" />
//                   Release Payment
//                 </>
//               )}
//             </Button>
//           </div>
//         </div>
//       </div>

//       <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
//         <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
//           <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//             <div className="flex items-center justify-between gap-4">
//               <div>
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                   {resolvedAmountLabel}
//                 </p>
//                 <p className="mt-2 text-2xl font-bold text-slate-950">
//                   Rs {formatPKR(resolvedAmount)}
//                 </p>
//               </div>

//               <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
//                 <Wallet className="h-5 w-5" />
//               </div>
//             </div>
//           </div>

//           <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//             <div className="flex items-center justify-between gap-4">
//               <div>
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                   {resolvedPartyLabel}
//                 </p>
//                 <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-950">
//                   {resolvedParties.length ? resolvedParties.join(", ") : "-"}
//                 </p>
//               </div>

//               <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
//                 <Building2 className="h-5 w-5" />
//               </div>
//             </div>
//           </div>

//           <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//             <div className="flex items-center justify-between gap-4">
//               <div>
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                   Payment Method
//                 </p>
//                 <p className="mt-2 text-sm font-semibold text-slate-950">
//                   {getPaymentMethodLabel(formData.paymentMethod)}
//                 </p>
//               </div>

//               <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
//                 <CreditCard className="h-5 w-5" />
//               </div>
//             </div>
//           </div>
//         </div>

//         <form
//           id="payment-release-form"
//           onSubmit={handleSubmit}
//           className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]"
//         >
//           <div className="space-y-6">
//             <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
//               <div className="mb-6 flex items-start gap-3">
//                 <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
//                   <Banknote className="h-5 w-5" />
//                 </div>

//                 <div>
//                   <h2 className="text-lg font-semibold text-slate-950">
//                     Payment Information
//                   </h2>
//                   <p className="mt-1 text-sm text-slate-500">
//                     Enter the release amount and payment method details.
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
//                 <div className="space-y-2">
//                   <Label htmlFor="amount" className="text-sm text-slate-700">
//                     Release Amount
//                   </Label>

//                   <Input
//                     id="amount"
//                     type="number"
//                     value={formData.amount}
//                     readOnly={resolvedAmountReadOnly}
//                     className={`h-11 rounded-2xl border-slate-200 ${
//                       resolvedAmountReadOnly ? "bg-slate-100" : "bg-white"
//                     }`}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         amount: e.target.value,
//                       }))
//                     }
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label
//                     htmlFor="paymentMethod"
//                     className="text-sm text-slate-700"
//                   >
//                     Payment Method
//                   </Label>

//                   <Select
//                     value={formData.paymentMethod}
//                     onValueChange={(value: any) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         paymentMethod: value,
//                         chequeNumbers:
//                           value === "cheque" &&
//                           prev.chequeNumbers.length === 0
//                             ? [""]
//                             : prev.chequeNumbers,
//                       }))
//                     }
//                   >
//                     <SelectTrigger className="h-11 rounded-2xl border-slate-200">
//                       <SelectValue placeholder="Select payment method" />
//                     </SelectTrigger>

//                     <SelectContent>
//                       <SelectItem value="cash">Cash</SelectItem>
//                       <SelectItem value="bank_transfer">
//                         Bank Transfer
//                       </SelectItem>
//                       <SelectItem value="wire">Online Transfer</SelectItem>
//                       {allowCheque && (
//                         <SelectItem value="cheque">Cheque</SelectItem>
//                       )}
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>
//             </section>

//             {formData.paymentMethod === "cheque" && allowCheque && (
//               <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
//                 <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
//                   <div>
//                     <h2 className="text-lg font-semibold text-slate-950">
//                       Cheque Details
//                     </h2>
//                     <p className="mt-1 text-sm text-slate-500">
//                       Select the account and add one or more cheque numbers.
//                     </p>
//                   </div>

//                   <Button
//                     type="button"
//                     variant="outline"
//                     size="sm"
//                     className="rounded-full border-slate-200"
//                     onClick={handleAddChequeNumber}
//                   >
//                     <Plus className="mr-2 h-4 w-4" />
//                     Add Cheque
//                   </Button>
//                 </div>

//                 <div className="space-y-5">
//                   <div className="space-y-2">
//                     <Label htmlFor="account" className="text-sm text-slate-700">
//                       Select Account
//                     </Label>

//                     <Select
//                       value={formData.selectedAccountId}
//                       onValueChange={(value) => {
//                         const account =
//                           resolvedAccounts.find((acc) => acc.id === value) ||
//                           null;

//                         setSelectedAccount(account);
//                         setFormData((prev) => ({
//                           ...prev,
//                           selectedAccountId: value,
//                         }));
//                       }}
//                     >
//                       <SelectTrigger className="h-11 rounded-2xl border-slate-200">
//                         <SelectValue
//                           placeholder={
//                             accountsLoading
//                               ? "Loading accounts..."
//                               : "Select account"
//                           }
//                         />
//                       </SelectTrigger>

//                       <SelectContent>
//                         {resolvedAccounts.length === 0 ? (
//                           <SelectItem value="__no_accounts__" disabled>
//                             No active accounts found
//                           </SelectItem>
//                         ) : (
//                           resolvedAccounts.map((account) => (
//                             <SelectItem key={account.id} value={account.id}>
//                               {account.accountName || account.id}
//                             </SelectItem>
//                           ))
//                         )}
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   {selectedAccount && (
//                     <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
//                       <h3 className="mb-4 text-sm font-semibold text-slate-950">
//                         Account Information
//                       </h3>

//                       <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
//                         <div>
//                           <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                             Account Name
//                           </p>
//                           <p className="mt-1 font-semibold text-slate-900">
//                             {selectedAccount.accountName || "-"}
//                           </p>
//                         </div>

//                         <div>
//                           <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                             Account Number
//                           </p>
//                           <p className="mt-1 font-semibold text-slate-900">
//                             {selectedAccount.accountNumber || "-"}
//                           </p>
//                         </div>

//                         <div>
//                           <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                             Bank
//                           </p>
//                           <p className="mt-1 font-semibold text-slate-900">
//                             {selectedAccount.bankName || "-"}
//                           </p>
//                         </div>

//                         <div>
//                           <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                             Balance
//                           </p>
//                           <p className="mt-1 font-semibold text-slate-900">
//                             Rs{" "}
//                             {formatPKR(
//                               selectedAccount.currentBalance ??
//                                 selectedAccount.balance ??
//                                 0
//                             )}
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   <div className="space-y-3">
//                     <Label className="text-sm text-slate-700">
//                       Cheque Numbers
//                     </Label>

//                     {formData.chequeNumbers.map((chequeNumber, index) => (
//                       <div
//                         key={index}
//                         className="flex flex-col gap-2 sm:flex-row sm:items-center"
//                       >
//                         <Input
//                           value={chequeNumber}
//                           onChange={(e) =>
//                             handleChequeNumberChange(index, e.target.value)
//                           }
//                           placeholder={`Enter cheque number ${index + 1}`}
//                           className="h-11 rounded-2xl border-slate-200"
//                         />

//                         <Button
//                           type="button"
//                           variant="outline"
//                           size="icon"
//                           className="h-11 w-11 shrink-0 rounded-2xl border-slate-200 text-red-600 hover:bg-red-50 hover:text-red-700"
//                           onClick={() => handleRemoveChequeNumber(index)}
//                           disabled={formData.chequeNumbers.length === 1}
//                         >
//                           <Trash2 className="h-4 w-4" />
//                         </Button>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </section>
//             )}

//             <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
//               <div className="mb-6 flex items-start gap-3">
//                 <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
//                   <ReceiptText className="h-5 w-5" />
//                 </div>

//                 <div>
//                   <h2 className="text-lg font-semibold text-slate-950">
//                     Reference & Notes
//                   </h2>
//                   <p className="mt-1 text-sm text-slate-500">
//                     Add transaction reference, upload receipts, and write
//                     payment notes.
//                   </p>
//                 </div>
//               </div>

//               <div className="space-y-5">
//                 <div className="space-y-2">
//                   <Label
//                     htmlFor="transactionReference"
//                     className="text-sm text-slate-700"
//                   >
//                     Transaction Reference
//                   </Label>

//                   <Input
//                     id="transactionReference"
//                     value={formData.transactionReference}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         transactionReference: e.target.value,
//                       }))
//                     }
//                     placeholder="Enter transaction reference"
//                     className="h-11 rounded-2xl border-slate-200"
//                   />
//                 </div>

//                 {allowReceiptUpload && (
//                   <div className="space-y-3">
//                     <Label htmlFor="receipt" className="text-sm text-slate-700">
//                       Upload Receipt / Cheque Copies
//                     </Label>

//                     <label
//                       htmlFor="receipt"
//                       className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-slate-400 hover:bg-slate-100"
//                     >
//                       <FileUp className="h-8 w-8 text-slate-500" />

//                       <p className="mt-3 text-sm font-semibold text-slate-800">
//                         Click to upload files
//                       </p>

//                       <p className="mt-1 text-xs text-slate-500">
//                         JPG, PNG, or PDF. Multiple files are allowed.
//                       </p>

//                       <Input
//                         id="receipt"
//                         type="file"
//                         accept=".jpg,.jpeg,.png,.pdf"
//                         multiple
//                         onChange={handleReceiptFilesChange}
//                         className="hidden"
//                       />
//                     </label>

//                     {receiptFiles.length > 0 && (
//                       <div className="space-y-2">
//                         {receiptFiles.map((file, index) => (
//                           <div
//                             key={`${file.name}-${index}`}
//                             className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
//                           >
//                             <div className="min-w-0">
//                               <p className="truncate font-medium text-slate-900">
//                                 {index + 1}. {file.name}
//                               </p>
//                               <p className="text-xs text-slate-500">
//                                 {getFileSizeLabel(file.size)}
//                               </p>
//                             </div>

//                             <Button
//                               type="button"
//                               variant="ghost"
//                               size="icon"
//                               className="h-9 w-9 shrink-0 rounded-full text-red-600 hover:bg-red-50 hover:text-red-700"
//                               onClick={() => handleRemoveReceiptFile(index)}
//                             >
//                               <Trash2 className="h-4 w-4" />
//                             </Button>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 )}

//                 <div className="space-y-2">
//                   <Label
//                     htmlFor="paymentNotes"
//                     className="text-sm text-slate-700"
//                   >
//                     Payment Notes
//                   </Label>

//                   <Textarea
//                     id="paymentNotes"
//                     rows={5}
//                     value={formData.paymentNotes}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         paymentNotes: e.target.value,
//                       }))
//                     }
//                     placeholder="Add any notes..."
//                     className="rounded-2xl border-slate-200"
//                   />
//                 </div>
//               </div>
//             </section>
//           </div>

//           <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
//             <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//               <h2 className="text-base font-semibold text-slate-950">
//                 Release Summary
//               </h2>

//               <div className="mt-5 space-y-4 text-sm">
//                 <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                   <span className="text-slate-500">Amount</span>
//                   <span className="text-right font-semibold text-slate-950">
//                     Rs {formatPKR(formData.amount)}
//                   </span>
//                 </div>

//                 <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                   <span className="text-slate-500">Method</span>
//                   <span className="text-right font-semibold text-slate-950">
//                     {getPaymentMethodLabel(formData.paymentMethod)}
//                   </span>
//                 </div>

//                 <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                   <span className="text-slate-500">Party</span>
//                   <span className="max-w-[190px] text-right font-semibold text-slate-950">
//                     {resolvedParties.length
//                       ? resolvedParties.join(", ")
//                       : "-"}
//                   </span>
//                 </div>

//                 {formData.paymentMethod === "cheque" && (
//                   <>
//                     <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                       <span className="text-slate-500">Account</span>
//                       <span className="max-w-[190px] text-right font-semibold text-slate-950">
//                         {selectedAccount?.accountName || "-"}
//                       </span>
//                     </div>

//                     <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                       <span className="text-slate-500">Cheques</span>
//                       <span className="text-right font-semibold text-slate-950">
//                         {cleanChequeNumbers(formData.chequeNumbers).length}
//                       </span>
//                     </div>
//                   </>
//                 )}

//                 <div className="flex items-start justify-between gap-4">
//                   <span className="text-slate-500">Files</span>
//                   <span className="text-right font-semibold text-slate-950">
//                     {receiptFiles.length}
//                   </span>
//                 </div>
//               </div>
//             </section>

//             <section className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
//               <h3 className="text-sm font-semibold text-blue-950">
//                 Before releasing
//               </h3>

//               <ul className="mt-3 space-y-2 text-sm text-blue-800">
//                 <li>Confirm the release amount is correct.</li>
//                 <li>For cheque payment, add all cheque numbers.</li>
//                 <li>Upload receipt or cheque copy files if available.</li>
//               </ul>
//             </section>
//           </aside>
//         </form>
//       </main>
//     </div>
//   );
// }

// import {
//   useEffect,
//   useMemo,
//   useState,
//   type ChangeEvent,
//   type FormEvent,
// } from "react";
// import { serverTimestamp } from "firebase/firestore";
// import {
//   ArrowLeft,
//   Banknote,
//   Building2,
//   CheckCircle2,
//   CreditCard,
//   FileUp,
//   Loader2,
//   Plus,
//   ReceiptText,
//   Trash2,
//   Wallet,
// } from "lucide-react";
// import { useAuth } from "@/contexts/AuthContext";
// import { releasePayment } from "@/lib/payments/releasePayment";
// import { fetchPaymentAccounts } from "@/lib/payments/paymentAccounts";
// import {
//   PaymentAccount,
//   PaymentReleaseFormValues,
//   PaymentReleaseSubmitArgs,
// } from "@/lib/payments/types";
// import { InvoiceRequest } from "@shared/schema";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Textarea } from "@/components/ui/textarea";
// import { useToast } from "@/hooks/use-toast";

// interface PaymentReleaseModalProps<T = any> {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: () => void;
//   title?: string;

//   invoice?: InvoiceRequest | null;

//   context?: T | null;
//   docPath?: ((context: T) => string[]) | string[];
//   buildUpdateData?: (args: PaymentReleaseSubmitArgs<T>) => Record<string, any>;

//   amount?: number;
//   amountLabel?: string;
//   partyLabel?: string;
//   parties?: string[];

//   accounts?: PaymentAccount[];
//   allowCheque?: boolean;
//   allowReceiptUpload?: boolean;
//   initialPaymentMethod?: "cash" | "cheque" | "bank_transfer" | "wire";
//   amountReadOnly?: boolean;
// }

// type ExtendedPaymentReleaseFormValues = PaymentReleaseFormValues & {
//   chequeNumbers: string[];
// };

// function cleanChequeNumbers(values: string[] = []) {
//   return values.map((value) => value.trim()).filter(Boolean);
// }

// function formatPKR(value: number | string | undefined | null) {
//   const numberValue =
//     typeof value === "number"
//       ? value
//       : Number(String(value || 0).replace(/,/g, "")) || 0;

//   return numberValue.toLocaleString("en-PK", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });
// }

// function safeNumber(value: any) {
//   const parsed = Number(String(value ?? 0).replace(/,/g, ""));
//   return Number.isFinite(parsed) ? parsed : 0;
// }

// function roundMoney(value: any) {
//   return Math.round(safeNumber(value) * 100) / 100;
// }

// function getPaymentReleaseAmount(entry: any) {
//   return roundMoney(
//     entry?.amount ??
//       entry?.releaseAmount ??
//       entry?.releasedAmount ??
//       entry?.paymentAmount ??
//       0,
//   );
// }

// function getPaymentReleaseHistory(source: any): any[] {
//   const history = Array.isArray(source?.paymentReleaseHistory)
//     ? source.paymentReleaseHistory
//     : [];

//   if (history.length > 0) {
//     return history.filter((entry: any) => getPaymentReleaseAmount(entry) > 0);
//   }

//   // Backward compatibility for old records that only stored one paymentDetails object.
//   const legacyPayment = source?.paymentDetails || source?.latestPaymentRelease;
//   if (legacyPayment && getPaymentReleaseAmount(legacyPayment) > 0) {
//     return [
//       {
//         ...legacyPayment,
//         releasedAt:
//           legacyPayment?.releasedAt ||
//           source?.paymentReleasedAt ||
//           source?.releasePaymentAt ||
//           source?.updatedAt ||
//           null,
//       },
//     ];
//   }

//   return [];
// }

// function getTotalReleasedAmount(source: any) {
//   return roundMoney(
//     getPaymentReleaseHistory(source).reduce(
//       (sum, entry) => sum + getPaymentReleaseAmount(entry),
//       0,
//     ),
//   );
// }

// function getApprovedAmountFromRecord(source: any, fallback = 0) {
//   return roundMoney(
//     source?.approvedAmount ??
//       source?.totalApprovedAmount ??
//       source?.approvedTotal ??
//       source?.totalAmount ??
//       source?.amount ??
//       fallback,
//   );
// }

// function getRemainingReleaseAmount(source: any, fallbackApproved = 0) {
//   const approvedAmount = getApprovedAmountFromRecord(source, fallbackApproved);
//   const releasedAmount = getTotalReleasedAmount(source);
//   return roundMoney(Math.max(approvedAmount - releasedAmount, 0));
// }

// function getReleaseDateLabel(value: any) {
//   if (!value) return "-";

//   let date: Date | null = null;

//   if (value instanceof Date) date = value;
//   else if (typeof value?.toDate === "function") date = value.toDate();
//   else if (typeof value?.seconds === "number")
//     date = new Date(value.seconds * 1000);
//   else date = new Date(value);

//   if (!date || Number.isNaN(date.getTime())) return "-";

//   return date.toLocaleString("en-PK", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// }

// function getPaymentMethodLabel(method?: string) {
//   switch (method) {
//     case "cash":
//       return "Cash";
//     case "cheque":
//       return "Cheque";
//     case "bank_transfer":
//       return "Bank Transfer";
//     case "wire":
//       return "Online Transfer";
//     default:
//       return "Not Selected";
//   }
// }

// function getFileSizeLabel(bytes: number) {
//   if (!bytes) return "0 KB";

//   const kb = bytes / 1024;
//   if (kb < 1024) return `${kb.toFixed(1)} KB`;

//   return `${(kb / 1024).toFixed(1)} MB`;
// }

// export default function PaymentReleaseModal<T = any>({
//   isOpen,
//   onClose,
//   onSuccess,
//   title = "Release Payment",
//   invoice = null,

//   context = null,
//   docPath,
//   buildUpdateData,

//   amount,
//   amountLabel,
//   partyLabel,
//   parties,

//   accounts = [],
//   allowCheque = true,
//   allowReceiptUpload = true,
//   initialPaymentMethod,
//   amountReadOnly,
// }: PaymentReleaseModalProps<T>) {
//   const { userProfile, currentUser } = useAuth();
//   const { toast } = useToast();

//   const [loading, setLoading] = useState(false);
//   const [accountsLoading, setAccountsLoading] = useState(false);
//   const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
//   const [selectedAccount, setSelectedAccount] = useState<PaymentAccount | null>(
//     null,
//   );
//   const [storedAccounts, setStoredAccounts] = useState<PaymentAccount[]>([]);

//   const approvedInvoiceItems = useMemo(() => {
//     const items = Array.isArray((invoice as any)?.lineItems)
//       ? (invoice as any).lineItems
//       : [];

//     return items.filter((item: any) => item?.status === "approved");
//   }, [invoice]);

//   const approvedLineItemsAmount = useMemo(() => {
//     return roundMoney(
//       approvedInvoiceItems.reduce((sum: number, item: any) => {
//         const qty = Number(item?.units || 0);
//         const rate = Number(item?.unitRate || 0);
//         const tax = Number(item?.tax || 0);
//         const total = Number(item?.total ?? qty * rate + tax);

//         return sum + total;
//       }, 0),
//     );
//   }, [approvedInvoiceItems]);

//   const invoiceApprovedAmount = useMemo(() => {
//     return getApprovedAmountFromRecord(invoice, approvedLineItemsAmount);
//   }, [invoice, approvedLineItemsAmount]);

//   const paymentReleaseHistory = useMemo(() => {
//     return getPaymentReleaseHistory(invoice);
//   }, [invoice]);

//   const totalReleasedAmount = useMemo(() => {
//     return getTotalReleasedAmount(invoice);
//   }, [invoice]);

//   const remainingReleaseAmount = useMemo(() => {
//     return getRemainingReleaseAmount(invoice, invoiceApprovedAmount);
//   }, [invoice, invoiceApprovedAmount]);

//   const invoiceApprovedVendors = useMemo(() => {
//     const vendors = [
//       ...new Set(
//         approvedInvoiceItems
//           .map((item: any) =>
//             String(
//               item?.vendor ||
//                 item?.vendorName ||
//                 item?.supplier ||
//                 item?.supplierName ||
//                 "",
//             ).trim(),
//           )
//           .filter(Boolean),
//       ),
//     ] as string[];

//     if (vendors.length > 0) return vendors;

//     const fallbackVendor = String(
//       (invoice as any)?.vendorName ||
//         (invoice as any)?.supplierName ||
//         (invoice as any)?.clientName ||
//         (invoice as any)?.partyName ||
//         "",
//     ).trim();

//     return fallbackVendor ? [fallbackVendor] : [];
//   }, [approvedInvoiceItems, invoice]);

//   const resolvedContext = (context ?? invoice ?? null) as
//     | T
//     | InvoiceRequest
//     | null;

//   const resolvedDocPath = useMemo(() => {
//     if (docPath && resolvedContext) {
//       return typeof docPath === "function"
//         ? docPath(resolvedContext as T)
//         : docPath;
//     }

//     if ((invoice as any)?.id) {
//       return ["Panels", "IEDGE-SYSTEM", "invoiceRequests", (invoice as any).id];
//     }

//     return [];
//   }, [docPath, resolvedContext, invoice]);

//   const resolvedAmount = amount ?? (invoice ? remainingReleaseAmount : 0);

//   const resolvedParties = parties ?? (invoice ? invoiceApprovedVendors : []);

//   const resolvedAmountLabel =
//     amountLabel ?? (invoice ? "Remaining Balance" : "Amount");

//   const resolvedPartyLabel =
//     partyLabel ?? (invoice ? "Approved Vendors" : "Payee");

//   const resolvedInitialPaymentMethod =
//     initialPaymentMethod ?? (invoice ? "bank_transfer" : "cash");

//   const resolvedAmountReadOnly = amountReadOnly ?? false;

//   const resolvedAccounts = useMemo(() => {
//     const map = new Map<string, PaymentAccount>();

//     [...storedAccounts, ...accounts].forEach((acc) => {
//       if (!acc?.id) return;
//       map.set(acc.id, acc);
//     });

//     return Array.from(map.values()).filter((acc) => acc.isActive !== false);
//   }, [storedAccounts, accounts]);

//   const defaultInvoiceBuildUpdateData = (
//     args: PaymentReleaseSubmitArgs<InvoiceRequest>,
//   ) => {
//     const { formData, receiptUrl, selectedAccount, actor } = args;

//     const sourceRecord = ((args as any).context || invoice || {}) as any;
//     const extendedFormData = formData as ExtendedPaymentReleaseFormValues;

//     const releaseAmount = roundMoney(extendedFormData.amount);
//     const approvedAmount = getApprovedAmountFromRecord(
//       sourceRecord,
//       invoiceApprovedAmount || releaseAmount,
//     );
//     const existingHistory = getPaymentReleaseHistory(sourceRecord);
//     const releasedBefore = roundMoney(
//       existingHistory.reduce(
//         (sum, entry) => sum + getPaymentReleaseAmount(entry),
//         0,
//       ),
//     );
//     const releasedAfter = roundMoney(releasedBefore + releaseAmount);
//     const remainingAfter = roundMoney(
//       Math.max(approvedAmount - releasedAfter, 0),
//     );
//     const isFullyReleased = approvedAmount > 0 && remainingAfter <= 0.009;

//     const chequeNumbers = cleanChequeNumbers(
//       extendedFormData.chequeNumbers?.length
//         ? extendedFormData.chequeNumbers
//         : [extendedFormData.chequeNumber || ""],
//     );

//     const receiptUrls = Array.isArray((args as any).receiptUrls)
//       ? (args as any).receiptUrls
//       : receiptUrl
//         ? [receiptUrl]
//         : [];

//     const releaseEntry: any = {
//       id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
//       releaseType:
//         releasedBefore <= 0
//           ? isFullyReleased
//             ? "full"
//             : "advance"
//           : isFullyReleased
//             ? "final"
//             : "partial",
//       paymentMethod: extendedFormData.paymentMethod,
//       amount: releaseAmount,
//       approvedAmount,
//       releasedBefore,
//       releasedAfter,
//       remainingAfter,
//       vendors: invoiceApprovedVendors,
//       transactionReference: extendedFormData.transactionReference,
//       bankReceiptUrl: receiptUrls[0] || receiptUrl || "",
//       bankReceiptUrls: receiptUrls,
//       paymentNotes: extendedFormData.paymentNotes,
//       releasedBy: actor.profileId || actor.uid || "",
//       releasedByName: actor.displayName || actor.email || "Unknown",
//       releasedByEmail: actor.email || "",
//       releasedAt: new Date(),
//     };

//     if (chequeNumbers.length > 0) {
//       releaseEntry.chequeNumber = chequeNumbers[0];
//       releaseEntry.chequeNumbers = chequeNumbers;
//     }

//     if (selectedAccount) {
//       releaseEntry.selectedAccount = selectedAccount;
//       releaseEntry.selectedAccountId = selectedAccount.id || "";
//       releaseEntry.selectedAccountName = selectedAccount.accountName || "";
//     }

//     const updateData: Record<string, any> = {
//       status: isFullyReleased
//         ? "payment_released"
//         : "payment_partially_released",
//       paymentStatus: isFullyReleased ? "released" : "partial",
//       paymentReleased: isFullyReleased,
//       paymentPartiallyReleased: !isFullyReleased,
//       releasePaymentCreated: true,
//       totalApprovedAmount: approvedAmount,
//       totalReleasedAmount: releasedAfter,
//       remainingReleaseAmount: remainingAfter,
//       latestPaymentRelease: releaseEntry,
//       paymentDetails: releaseEntry,
//       paymentReleaseHistory: [...existingHistory, releaseEntry],
//       updatedAt: serverTimestamp(),
//     };

//     if (isFullyReleased) {
//       updateData.paymentReleasedAt = serverTimestamp();
//       updateData.releasePaymentAt = serverTimestamp();
//       updateData.paymentFullyReleasedAt = serverTimestamp();
//     } else {
//       updateData.partialPaymentReleasedAt = serverTimestamp();
//     }

//     return updateData;
//   };

//   const [formData, setFormData] = useState<ExtendedPaymentReleaseFormValues>({
//     paymentMethod: resolvedInitialPaymentMethod,
//     selectedAccountId: "",
//     amount: String(resolvedAmount || 0),
//     chequeNumber: "",
//     chequeNumbers: [""],
//     transactionReference: "",
//     paymentNotes: "",
//   });

//   useEffect(() => {
//     if (!isOpen) return;

//     setFormData({
//       paymentMethod: resolvedInitialPaymentMethod,
//       selectedAccountId: "",
//       amount: String(resolvedAmount || 0),
//       chequeNumber: "",
//       chequeNumbers: [""],
//       transactionReference: "",
//       paymentNotes: "",
//     });

//     setSelectedAccount(null);
//     setReceiptFiles([]);
//   }, [isOpen, resolvedAmount, resolvedInitialPaymentMethod]);

//   useEffect(() => {
//     let mounted = true;

//     async function loadAccounts() {
//       try {
//         setAccountsLoading(true);

//         const rows = await fetchPaymentAccounts();

//         if (mounted) {
//           setStoredAccounts(rows);
//         }
//       } catch (error) {
//         console.error("Failed to load payment accounts:", error);

//         if (mounted) {
//           toast({
//             title: "Error",
//             description: "Failed to load payment accounts",
//             variant: "destructive",
//           });
//         }
//       } finally {
//         if (mounted) {
//           setAccountsLoading(false);
//         }
//       }
//     }

//     if (isOpen) {
//       loadAccounts();
//     }

//     return () => {
//       mounted = false;
//     };
//   }, [isOpen, toast]);

//   const handleChequeNumberChange = (index: number, value: string) => {
//     setFormData((prev) => {
//       const updatedChequeNumbers = [...prev.chequeNumbers];
//       updatedChequeNumbers[index] = value;

//       return {
//         ...prev,
//         chequeNumbers: updatedChequeNumbers,
//         chequeNumber: updatedChequeNumbers[0] || "",
//       };
//     });
//   };

//   const handleAddChequeNumber = () => {
//     setFormData((prev) => ({
//       ...prev,
//       chequeNumbers: [...prev.chequeNumbers, ""],
//     }));
//   };

//   const handleRemoveChequeNumber = (index: number) => {
//     setFormData((prev) => {
//       const updatedChequeNumbers = prev.chequeNumbers.filter(
//         (_, chequeIndex) => chequeIndex !== index,
//       );

//       const safeChequeNumbers =
//         updatedChequeNumbers.length > 0 ? updatedChequeNumbers : [""];

//       return {
//         ...prev,
//         chequeNumbers: safeChequeNumbers,
//         chequeNumber: safeChequeNumbers[0] || "",
//       };
//     });
//   };

//   const handleReceiptFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
//     const files = Array.from(event.target.files || []);
//     setReceiptFiles(files);
//   };

//   const handleRemoveReceiptFile = (index: number) => {
//     setReceiptFiles((prev) =>
//       prev.filter((_, fileIndex) => fileIndex !== index),
//     );
//   };

//   async function handleSubmit(e: FormEvent<HTMLFormElement>) {
//     e.preventDefault();

//     if (!resolvedContext) {
//       toast({
//         title: "Error",
//         description: "No record selected",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!formData.paymentMethod) {
//       toast({
//         title: "Error",
//         description: "Please select a payment method",
//         variant: "destructive",
//       });
//       return;
//     }

//     const requestedReleaseAmount = roundMoney(formData.amount);

//     if (!formData.amount || requestedReleaseAmount <= 0) {
//       toast({
//         title: "Error",
//         description: "Please enter a valid amount",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (invoice && requestedReleaseAmount > remainingReleaseAmount + 0.009) {
//       toast({
//         title: "Error",
//         description: `Release amount cannot exceed the remaining balance of Rs ${formatPKR(remainingReleaseAmount)}.`,
//         variant: "destructive",
//       });
//       return;
//     }

//     const normalizedChequeNumbers = cleanChequeNumbers(formData.chequeNumbers);

//     if (formData.paymentMethod === "cheque") {
//       if (!formData.selectedAccountId) {
//         toast({
//           title: "Error",
//           description: "Please select an account",
//           variant: "destructive",
//         });
//         return;
//       }

//       if (normalizedChequeNumbers.length === 0) {
//         toast({
//           title: "Error",
//           description: "Please enter at least one cheque number",
//           variant: "destructive",
//         });
//         return;
//       }
//     }

//     const normalizedFormData: ExtendedPaymentReleaseFormValues = {
//       ...formData,
//       chequeNumber: normalizedChequeNumbers[0] || "",
//       chequeNumbers: normalizedChequeNumbers,
//     };

//     try {
//       setLoading(true);

//       await releasePayment({
//         docPath: resolvedDocPath,
//         context: resolvedContext as any,
//         formData: normalizedFormData as any,

//         // Old support: existing releasePayment can still use this first file.
//         receiptFile: receiptFiles[0] || null,

//         // New support: update releasePayment to upload these if not already supported.
//         receiptFiles,

//         selectedAccount,
//         actor: {
//           uid: currentUser?.uid,
//           email: currentUser?.email,
//           displayName: userProfile?.displayName || currentUser?.email,
//           profileId: userProfile?.id,
//         },
//         buildUpdateData: (buildUpdateData ||
//           defaultInvoiceBuildUpdateData) as any,
//       } as any);

//       toast({
//         title: "Success",
//         description: "Payment released successfully",
//       });

//       onSuccess();
//       onClose();
//     } catch (error: any) {
//       console.error("Failed to release payment:", error);

//       toast({
//         title: "Error",
//         description: error?.message || "Failed to release payment",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   }

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 min-h-screen overflow-y-auto bg-slate-50">
//       <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
//         <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
//           <div className="flex items-start gap-4">
//             <Button
//               type="button"
//               variant="outline"
//               size="icon"
//               className="mt-1 h-10 w-10 rounded-full border-slate-200 bg-white shadow-sm hover:bg-slate-50"
//               onClick={onClose}
//             >
//               <ArrowLeft className="h-4 w-4" />
//             </Button>

//             <div>
//               <div className="flex flex-wrap items-center gap-2">
//                 <h1 className="text-2xl font-bold tracking-tight text-slate-950">
//                   {title}
//                 </h1>

//                 <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
//                   Payment Release
//                 </span>
//               </div>

//               <p className="mt-1 max-w-2xl text-sm text-slate-500">
//                 Review payment information, select the payment method, attach
//                 receipts, and release the remaining amount.
//               </p>
//             </div>
//           </div>

//           <div className="flex flex-wrap gap-2">
//             <Button
//               type="button"
//               variant="outline"
//               className="rounded-full border-slate-200 px-5"
//               onClick={onClose}
//               disabled={loading}
//             >
//               Cancel
//             </Button>

//             <Button
//               type="submit"
//               form="payment-release-form"
//               disabled={loading}
//               className="rounded-full bg-slate-950 px-6 text-white shadow-sm hover:bg-slate-800"
//             >
//               {loading ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Releasing...
//                 </>
//               ) : (
//                 <>
//                   <CheckCircle2 className="mr-2 h-4 w-4" />
//                   Release Payment
//                 </>
//               )}
//             </Button>
//           </div>
//         </div>
//       </div>

//       <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
//         <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
//           <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//             <div className="flex items-center justify-between gap-4">
//               <div>
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                   Total Approved Amount
//                 </p>
//                 <p className="mt-2 text-2xl font-bold text-slate-950">
//                   Rs{" "}
//                   {formatPKR(invoice ? invoiceApprovedAmount : resolvedAmount)}
//                 </p>
//               </div>

//               <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
//                 <Wallet className="h-5 w-5" />
//               </div>
//             </div>
//           </div>

//           <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//             <div className="flex items-center justify-between gap-4">
//               <div>
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                   Released So Far
//                 </p>
//                 <p className="mt-2 text-2xl font-bold text-slate-950">
//                   Rs {formatPKR(invoice ? totalReleasedAmount : 0)}
//                 </p>
//               </div>

//               <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
//                 <CheckCircle2 className="h-5 w-5" />
//               </div>
//             </div>
//           </div>

//           <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//             <div className="flex items-center justify-between gap-4">
//               <div>
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                   Remaining Balance
//                 </p>
//                 <p className="mt-2 text-2xl font-bold text-slate-950">
//                   Rs{" "}
//                   {formatPKR(invoice ? remainingReleaseAmount : resolvedAmount)}
//                 </p>
//               </div>

//               <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
//                 <Banknote className="h-5 w-5" />
//               </div>
//             </div>
//           </div>

//           <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//             <div className="flex items-center justify-between gap-4">
//               <div>
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                   Payment Method
//                 </p>
//                 <p className="mt-2 text-sm font-semibold text-slate-950">
//                   {getPaymentMethodLabel(formData.paymentMethod)}
//                 </p>
//               </div>

//               <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
//                 <CreditCard className="h-5 w-5" />
//               </div>
//             </div>
//           </div>
//         </div>

//         {invoice && invoiceApprovedAmount > 0 && (
//           <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//             <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
//               <div>
//                 <p className="text-sm font-semibold text-slate-950">
//                   Payment Release Progress
//                 </p>
//                 <p className="mt-1 text-xs text-slate-500">
//                   Rs {formatPKR(totalReleasedAmount)} released from Rs{" "}
//                   {formatPKR(invoiceApprovedAmount)}.
//                 </p>
//               </div>
//               <p className="text-sm font-semibold text-slate-950">
//                 {Math.min(
//                   100,
//                   Math.round(
//                     (totalReleasedAmount / invoiceApprovedAmount) * 100,
//                   ),
//                 )}
//                 %
//               </p>
//             </div>

//             <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
//               <div
//                 className="h-full rounded-full bg-slate-950 transition-all"
//                 style={{
//                   width: `${Math.min(
//                     100,
//                     Math.max(
//                       0,
//                       (totalReleasedAmount / invoiceApprovedAmount) * 100,
//                     ),
//                   )}%`,
//                 }}
//               />
//             </div>
//           </div>
//         )}

//         <form
//           id="payment-release-form"
//           onSubmit={handleSubmit}
//           className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]"
//         >
//           <div className="space-y-6">
//             <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
//               <div className="mb-6 flex items-start gap-3">
//                 <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
//                   <Banknote className="h-5 w-5" />
//                 </div>

//                 <div>
//                   <h2 className="text-lg font-semibold text-slate-950">
//                     Payment Information
//                   </h2>
//                   <p className="mt-1 text-sm text-slate-500">
//                     Enter the release amount and payment method details.
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
//                 <div className="space-y-2">
//                   <Label htmlFor="amount" className="text-sm text-slate-700">
//                     Release Amount
//                   </Label>

//                   <Input
//                     id="amount"
//                     type="number"
//                     min="0"
//                     step="0.01"
//                     max={invoice ? remainingReleaseAmount : undefined}
//                     value={formData.amount}
//                     readOnly={resolvedAmountReadOnly}
//                     className={`h-11 rounded-2xl border-slate-200 ${
//                       resolvedAmountReadOnly ? "bg-slate-100" : "bg-white"
//                     }`}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         amount: e.target.value,
//                       }))
//                     }
//                   />

//                   {invoice && (
//                     <p className="text-xs text-slate-500">
//                       You can release any amount up to Rs{" "}
//                       {formatPKR(remainingReleaseAmount)}.
//                     </p>
//                   )}
//                 </div>

//                 <div className="space-y-2">
//                   <Label
//                     htmlFor="paymentMethod"
//                     className="text-sm text-slate-700"
//                   >
//                     Payment Method
//                   </Label>

//                   <Select
//                     value={formData.paymentMethod}
//                     onValueChange={(value: any) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         paymentMethod: value,
//                         chequeNumbers:
//                           value === "cheque" && prev.chequeNumbers.length === 0
//                             ? [""]
//                             : prev.chequeNumbers,
//                       }))
//                     }
//                   >
//                     <SelectTrigger className="h-11 rounded-2xl border-slate-200">
//                       <SelectValue placeholder="Select payment method" />
//                     </SelectTrigger>

//                     <SelectContent>
//                       <SelectItem value="cash">Cash</SelectItem>
//                       <SelectItem value="bank_transfer">
//                         Bank Transfer
//                       </SelectItem>
//                       <SelectItem value="wire">Online Transfer</SelectItem>
//                       {allowCheque && (
//                         <SelectItem value="cheque">Cheque</SelectItem>
//                       )}
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>
//             </section>

//             {formData.paymentMethod === "cheque" && allowCheque && (
//               <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
//                 <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
//                   <div>
//                     <h2 className="text-lg font-semibold text-slate-950">
//                       Cheque Details
//                     </h2>
//                     <p className="mt-1 text-sm text-slate-500">
//                       Select the account and add one or more cheque numbers.
//                     </p>
//                   </div>

//                   <Button
//                     type="button"
//                     variant="outline"
//                     size="sm"
//                     className="rounded-full border-slate-200"
//                     onClick={handleAddChequeNumber}
//                   >
//                     <Plus className="mr-2 h-4 w-4" />
//                     Add Cheque
//                   </Button>
//                 </div>

//                 <div className="space-y-5">
//                   <div className="space-y-2">
//                     <Label htmlFor="account" className="text-sm text-slate-700">
//                       Select Account
//                     </Label>

//                     <Select
//                       value={formData.selectedAccountId}
//                       onValueChange={(value) => {
//                         const account =
//                           resolvedAccounts.find((acc) => acc.id === value) ||
//                           null;

//                         setSelectedAccount(account);
//                         setFormData((prev) => ({
//                           ...prev,
//                           selectedAccountId: value,
//                         }));
//                       }}
//                     >
//                       <SelectTrigger className="h-11 rounded-2xl border-slate-200">
//                         <SelectValue
//                           placeholder={
//                             accountsLoading
//                               ? "Loading accounts..."
//                               : "Select account"
//                           }
//                         />
//                       </SelectTrigger>

//                       <SelectContent>
//                         {resolvedAccounts.length === 0 ? (
//                           <SelectItem value="__no_accounts__" disabled>
//                             No active accounts found
//                           </SelectItem>
//                         ) : (
//                           resolvedAccounts.map((account) => (
//                             <SelectItem key={account.id} value={account.id}>
//                               {account.accountName || account.id}
//                             </SelectItem>
//                           ))
//                         )}
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   {selectedAccount && (
//                     <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
//                       <h3 className="mb-4 text-sm font-semibold text-slate-950">
//                         Account Information
//                       </h3>

//                       <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
//                         <div>
//                           <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                             Account Name
//                           </p>
//                           <p className="mt-1 font-semibold text-slate-900">
//                             {selectedAccount.accountName || "-"}
//                           </p>
//                         </div>

//                         <div>
//                           <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                             Account Number
//                           </p>
//                           <p className="mt-1 font-semibold text-slate-900">
//                             {selectedAccount.accountNumber || "-"}
//                           </p>
//                         </div>

//                         <div>
//                           <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                             Bank
//                           </p>
//                           <p className="mt-1 font-semibold text-slate-900">
//                             {selectedAccount.bankName || "-"}
//                           </p>
//                         </div>

//                         <div>
//                           <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                             Balance
//                           </p>
//                           <p className="mt-1 font-semibold text-slate-900">
//                             Rs{" "}
//                             {formatPKR(
//                               selectedAccount.currentBalance ??
//                                 selectedAccount.balance ??
//                                 0,
//                             )}
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   <div className="space-y-3">
//                     <Label className="text-sm text-slate-700">
//                       Cheque Numbers
//                     </Label>

//                     {formData.chequeNumbers.map((chequeNumber, index) => (
//                       <div
//                         key={index}
//                         className="flex flex-col gap-2 sm:flex-row sm:items-center"
//                       >
//                         <Input
//                           value={chequeNumber}
//                           onChange={(e) =>
//                             handleChequeNumberChange(index, e.target.value)
//                           }
//                           placeholder={`Enter cheque number ${index + 1}`}
//                           className="h-11 rounded-2xl border-slate-200"
//                         />

//                         <Button
//                           type="button"
//                           variant="outline"
//                           size="icon"
//                           className="h-11 w-11 shrink-0 rounded-2xl border-slate-200 text-red-600 hover:bg-red-50 hover:text-red-700"
//                           onClick={() => handleRemoveChequeNumber(index)}
//                           disabled={formData.chequeNumbers.length === 1}
//                         >
//                           <Trash2 className="h-4 w-4" />
//                         </Button>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </section>
//             )}

//             <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
//               <div className="mb-6 flex items-start gap-3">
//                 <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
//                   <ReceiptText className="h-5 w-5" />
//                 </div>

//                 <div>
//                   <h2 className="text-lg font-semibold text-slate-950">
//                     Reference & Notes
//                   </h2>
//                   <p className="mt-1 text-sm text-slate-500">
//                     Add transaction reference, upload receipts, and write
//                     payment notes.
//                   </p>
//                 </div>
//               </div>

//               <div className="space-y-5">
//                 <div className="space-y-2">
//                   <Label
//                     htmlFor="transactionReference"
//                     className="text-sm text-slate-700"
//                   >
//                     Transaction Reference
//                   </Label>

//                   <Input
//                     id="transactionReference"
//                     value={formData.transactionReference}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         transactionReference: e.target.value,
//                       }))
//                     }
//                     placeholder="Enter transaction reference"
//                     className="h-11 rounded-2xl border-slate-200"
//                   />
//                 </div>

//                 {allowReceiptUpload && (
//                   <div className="space-y-3">
//                     <Label htmlFor="receipt" className="text-sm text-slate-700">
//                       Upload Receipt / Cheque Copies
//                     </Label>

//                     <label
//                       htmlFor="receipt"
//                       className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-slate-400 hover:bg-slate-100"
//                     >
//                       <FileUp className="h-8 w-8 text-slate-500" />

//                       <p className="mt-3 text-sm font-semibold text-slate-800">
//                         Click to upload files
//                       </p>

//                       <p className="mt-1 text-xs text-slate-500">
//                         JPG, PNG, or PDF. Multiple files are allowed.
//                       </p>

//                       <Input
//                         id="receipt"
//                         type="file"
//                         accept=".jpg,.jpeg,.png,.pdf"
//                         multiple
//                         onChange={handleReceiptFilesChange}
//                         className="hidden"
//                       />
//                     </label>

//                     {receiptFiles.length > 0 && (
//                       <div className="space-y-2">
//                         {receiptFiles.map((file, index) => (
//                           <div
//                             key={`${file.name}-${index}`}
//                             className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
//                           >
//                             <div className="min-w-0">
//                               <p className="truncate font-medium text-slate-900">
//                                 {index + 1}. {file.name}
//                               </p>
//                               <p className="text-xs text-slate-500">
//                                 {getFileSizeLabel(file.size)}
//                               </p>
//                             </div>

//                             <Button
//                               type="button"
//                               variant="ghost"
//                               size="icon"
//                               className="h-9 w-9 shrink-0 rounded-full text-red-600 hover:bg-red-50 hover:text-red-700"
//                               onClick={() => handleRemoveReceiptFile(index)}
//                             >
//                               <Trash2 className="h-4 w-4" />
//                             </Button>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 )}

//                 <div className="space-y-2">
//                   <Label
//                     htmlFor="paymentNotes"
//                     className="text-sm text-slate-700"
//                   >
//                     Payment Notes
//                   </Label>

//                   <Textarea
//                     id="paymentNotes"
//                     rows={5}
//                     value={formData.paymentNotes}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         paymentNotes: e.target.value,
//                       }))
//                     }
//                     placeholder="Add any notes..."
//                     className="rounded-2xl border-slate-200"
//                   />
//                 </div>
//               </div>
//             </section>
//           </div>

//           <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
//             <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//               <h2 className="text-base font-semibold text-slate-950">
//                 Release Summary
//               </h2>

//               <div className="mt-5 space-y-4 text-sm">
//                 {invoice && (
//                   <>
//                     <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                       <span className="text-slate-500">Approved</span>
//                       <span className="text-right font-semibold text-slate-950">
//                         Rs {formatPKR(invoiceApprovedAmount)}
//                       </span>
//                     </div>

//                     <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                       <span className="text-slate-500">Released Before</span>
//                       <span className="text-right font-semibold text-slate-950">
//                         Rs {formatPKR(totalReleasedAmount)}
//                       </span>
//                     </div>
//                   </>
//                 )}

//                 <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                   <span className="text-slate-500">This Release</span>
//                   <span className="text-right font-semibold text-slate-950">
//                     Rs {formatPKR(formData.amount)}
//                   </span>
//                 </div>

//                 {invoice && (
//                   <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                     <span className="text-slate-500">Balance After</span>
//                     <span className="text-right font-semibold text-slate-950">
//                       Rs{" "}
//                       {formatPKR(
//                         Math.max(
//                           remainingReleaseAmount - safeNumber(formData.amount),
//                           0,
//                         ),
//                       )}
//                     </span>
//                   </div>
//                 )}

//                 <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                   <span className="text-slate-500">Method</span>
//                   <span className="text-right font-semibold text-slate-950">
//                     {getPaymentMethodLabel(formData.paymentMethod)}
//                   </span>
//                 </div>

//                 <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                   <span className="text-slate-500">Party</span>
//                   <span className="max-w-[190px] text-right font-semibold text-slate-950">
//                     {resolvedParties.length ? resolvedParties.join(", ") : "-"}
//                   </span>
//                 </div>

//                 {formData.paymentMethod === "cheque" && (
//                   <>
//                     <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                       <span className="text-slate-500">Account</span>
//                       <span className="max-w-[190px] text-right font-semibold text-slate-950">
//                         {selectedAccount?.accountName || "-"}
//                       </span>
//                     </div>

//                     <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                       <span className="text-slate-500">Cheques</span>
//                       <span className="text-right font-semibold text-slate-950">
//                         {cleanChequeNumbers(formData.chequeNumbers).length}
//                       </span>
//                     </div>
//                   </>
//                 )}

//                 <div className="flex items-start justify-between gap-4">
//                   <span className="text-slate-500">Files</span>
//                   <span className="text-right font-semibold text-slate-950">
//                     {receiptFiles.length}
//                   </span>
//                 </div>
//               </div>
//             </section>

//             {paymentReleaseHistory.length > 0 && (
//               <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//                 <h2 className="text-base font-semibold text-slate-950">
//                   Payment Release History
//                 </h2>

//                 <div className="mt-4 space-y-3">
//                   {[...paymentReleaseHistory]
//                     .reverse()
//                     .map((entry: any, index: number) => (
//                       <div
//                         key={
//                           entry?.id ||
//                           `${entry?.releasedAt || "release"}-${index}`
//                         }
//                         className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm"
//                       >
//                         <div className="flex items-start justify-between gap-3">
//                           <div>
//                             <p className="font-semibold text-slate-950">
//                               Rs {formatPKR(getPaymentReleaseAmount(entry))}
//                             </p>
//                             <p className="mt-1 text-xs text-slate-500">
//                               {getPaymentMethodLabel(entry?.paymentMethod)} •{" "}
//                               {getReleaseDateLabel(entry?.releasedAt)}
//                             </p>
//                           </div>
//                           <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
//                             {entry?.releaseType || "release"}
//                           </span>
//                         </div>

//                         <div className="mt-3 space-y-1 text-xs text-slate-500">
//                           <p>Released By: {entry?.releasedByName || "-"}</p>
//                           {entry?.transactionReference && (
//                             <p>Reference: {entry.transactionReference}</p>
//                           )}
//                           {Array.isArray(entry?.chequeNumbers) &&
//                             entry.chequeNumbers.length > 0 && (
//                               <p>Cheques: {entry.chequeNumbers.join(", ")}</p>
//                             )}
//                           {entry?.paymentNotes && (
//                             <p>Notes: {entry.paymentNotes}</p>
//                           )}
//                         </div>
//                       </div>
//                     ))}
//                 </div>
//               </section>
//             )}

//             <section className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
//               <h3 className="text-sm font-semibold text-blue-950">
//                 Before releasing
//               </h3>

//               <ul className="mt-3 space-y-2 text-sm text-blue-800">
//                 <li>Confirm the release amount is correct.</li>
//                 <li>For cheque payment, add all cheque numbers.</li>
//                 <li>Upload receipt or cheque copy files if available.</li>
//               </ul>
//             </section>
//           </aside>
//         </form>
//       </main>
//     </div>
//   );
// }
















// import {
//   useEffect,
//   useMemo,
//   useState,
//   type ChangeEvent,
//   type FormEvent,
// } from "react";
// import { collection, getDocs, serverTimestamp } from "firebase/firestore";
// import {
//   ArrowLeft,
//   Banknote,
//   Building2,
//   CheckCircle2,
//   CreditCard,
//   FileUp,
//   Loader2,
//   Plus,
//   ReceiptText,
//   Trash2,
//   Wallet,
// } from "lucide-react";
// import { useAuth } from "@/contexts/AuthContext";
// import { db } from "@/lib/firebase";
// import { releasePayment } from "@/lib/payments/releasePayment";
// import { fetchPaymentAccounts } from "@/lib/payments/paymentAccounts";
// import {
//   PaymentAccount,
//   PaymentReleaseFormValues,
//   PaymentReleaseSubmitArgs,
// } from "@/lib/payments/types";
// import { InvoiceRequest } from "@shared/schema";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Textarea } from "@/components/ui/textarea";
// import { useToast } from "@/hooks/use-toast";

// interface PaymentReleaseModalProps<T = any> {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: () => void;
//   title?: string;

//   invoice?: InvoiceRequest | null;

//   context?: T | null;
//   docPath?: ((context: T) => string[]) | string[];
//   buildUpdateData?: (args: PaymentReleaseSubmitArgs<T>) => Record<string, any>;

//   amount?: number;
//   amountLabel?: string;
//   partyLabel?: string;
//   parties?: string[];

//   accounts?: PaymentAccount[];
//   allowCheque?: boolean;
//   allowReceiptUpload?: boolean;
//   initialPaymentMethod?: "cash" | "cheque" | "bank_transfer" | "wire";
//   amountReadOnly?: boolean;
// }

// const PANEL_ID = "IEDGE-SYSTEM";

// type ExtendedPaymentReleaseFormValues = PaymentReleaseFormValues & {
//   transactionName: string;
//   chequeNumbers: string[];
// };

// function normalizeChequeNumber(value: any) {
//   return String(value ?? "")
//     .trim()
//     .replace(/\s+/g, "")
//     .toLowerCase();
// }

// function extractChequeNumbersFromValue(value: any): string[] {
//   if (value === undefined || value === null) return [];

//   if (Array.isArray(value)) {
//     return value.flatMap((item) => extractChequeNumbersFromValue(item));
//   }

//   if (typeof value === "object") return [];

//   return String(value)
//     .split(/[\n,]/g)
//     .map((item) => item.trim())
//     .filter(Boolean);
// }

// function collectChequeNumbersFromSource(source: any): string[] {
//   if (!source) return [];

//   const paymentDetails = source.paymentDetails || {};
//   const latestPaymentRelease = source.latestPaymentRelease || {};
//   const accountDetails = source.accountDetails || {};
//   const bankDetails = source.bankDetails || {};
//   const receivePayment = source.receivePayment || {};
//   const paymentReleaseHistory = Array.isArray(source.paymentReleaseHistory)
//     ? source.paymentReleaseHistory
//     : [];

//   return [
//     ...extractChequeNumbersFromValue(source.chequeNumber),
//     ...extractChequeNumbersFromValue(source.chequeNumbers),
//     ...extractChequeNumbersFromValue(source.chequeNo),
//     ...extractChequeNumbersFromValue(source.checkNumber),
//     ...extractChequeNumbersFromValue(source.checkNo),
//     ...extractChequeNumbersFromValue(source.bankChequeNumber),
//     ...extractChequeNumbersFromValue(source.paymentChequeNumber),
//     ...extractChequeNumbersFromValue(source.receivedChequeNumber),
//     ...extractChequeNumbersFromValue(source.reference),
//     ...extractChequeNumbersFromValue(source.Reference),
//     ...extractChequeNumbersFromValue(source.transactionReference),
//     ...extractChequeNumbersFromValue(paymentDetails.chequeNumber),
//     ...extractChequeNumbersFromValue(paymentDetails.chequeNumbers),
//     ...extractChequeNumbersFromValue(paymentDetails.chequeNo),
//     ...extractChequeNumbersFromValue(paymentDetails.checkNumber),
//     ...extractChequeNumbersFromValue(paymentDetails.reference),
//     ...extractChequeNumbersFromValue(paymentDetails.Reference),
//     ...extractChequeNumbersFromValue(paymentDetails.transactionReference),
//     ...extractChequeNumbersFromValue(latestPaymentRelease.chequeNumber),
//     ...extractChequeNumbersFromValue(latestPaymentRelease.chequeNumbers),
//     ...extractChequeNumbersFromValue(latestPaymentRelease.chequeNo),
//     ...extractChequeNumbersFromValue(latestPaymentRelease.checkNumber),
//     ...extractChequeNumbersFromValue(latestPaymentRelease.reference),
//     ...extractChequeNumbersFromValue(latestPaymentRelease.Reference),
//     ...extractChequeNumbersFromValue(latestPaymentRelease.transactionReference),
//     ...extractChequeNumbersFromValue(accountDetails.chequeNumber),
//     ...extractChequeNumbersFromValue(accountDetails.chequeNumbers),
//     ...extractChequeNumbersFromValue(accountDetails.chequeNo),
//     ...extractChequeNumbersFromValue(accountDetails.checkNumber),
//     ...extractChequeNumbersFromValue(accountDetails.reference),
//     ...extractChequeNumbersFromValue(accountDetails.Reference),
//     ...extractChequeNumbersFromValue(accountDetails.transactionReference),
//     ...extractChequeNumbersFromValue(bankDetails.chequeNumber),
//     ...extractChequeNumbersFromValue(bankDetails.chequeNumbers),
//     ...extractChequeNumbersFromValue(bankDetails.chequeNo),
//     ...extractChequeNumbersFromValue(bankDetails.checkNumber),
//     ...extractChequeNumbersFromValue(bankDetails.reference),
//     ...extractChequeNumbersFromValue(bankDetails.Reference),
//     ...extractChequeNumbersFromValue(bankDetails.transactionReference),
//     ...extractChequeNumbersFromValue(receivePayment.chequeNumber),
//     ...extractChequeNumbersFromValue(receivePayment.chequeNumbers),
//     ...extractChequeNumbersFromValue(receivePayment.chequeNo),
//     ...extractChequeNumbersFromValue(receivePayment.checkNumber),
//     ...extractChequeNumbersFromValue(receivePayment.reference),
//     ...extractChequeNumbersFromValue(receivePayment.Reference),
//     ...extractChequeNumbersFromValue(receivePayment.transactionReference),
//     ...paymentReleaseHistory.flatMap((entry: any) =>
//       collectChequeNumbersFromSource(entry),
//     ),
//   ];
// }

// function getDuplicateChequeNumbers(
//   chequeNumbers: string[],
//   existingChequeNumbers: Set<string>,
// ) {
//   const normalizedCounts = new Map<string, number>();

//   chequeNumbers.forEach((chequeNumber) => {
//     const normalized = normalizeChequeNumber(chequeNumber);
//     if (!normalized) return;
//     normalizedCounts.set(normalized, (normalizedCounts.get(normalized) || 0) + 1);
//   });

//   return cleanChequeNumbers(chequeNumbers).filter((chequeNumber) => {
//     const normalized = normalizeChequeNumber(chequeNumber);
//     return (
//       existingChequeNumbers.has(normalized) ||
//       (normalizedCounts.get(normalized) || 0) > 1
//     );
//   });
// }

// function cleanChequeNumbers(values: string[] = []) {
//   return values.map((value) => value.trim()).filter(Boolean);
// }

// function formatPKR(value: number | string | undefined | null) {
//   const numberValue =
//     typeof value === "number"
//       ? value
//       : Number(String(value || 0).replace(/,/g, "")) || 0;

//   return numberValue.toLocaleString("en-PK", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });
// }

// function safeNumber(value: any) {
//   const parsed = Number(String(value ?? 0).replace(/,/g, ""));
//   return Number.isFinite(parsed) ? parsed : 0;
// }

// function roundMoney(value: any) {
//   return Math.round(safeNumber(value) * 100) / 100;
// }

// function getPaymentReleaseAmount(entry: any) {
//   return roundMoney(
//     entry?.amount ??
//       entry?.releaseAmount ??
//       entry?.releasedAmount ??
//       entry?.paymentAmount ??
//       0,
//   );
// }

// function getPaymentReleaseHistory(source: any): any[] {
//   const history = Array.isArray(source?.paymentReleaseHistory)
//     ? source.paymentReleaseHistory
//     : [];

//   if (history.length > 0) {
//     return history.filter((entry: any) => getPaymentReleaseAmount(entry) > 0);
//   }

//   // Backward compatibility for old records that only stored one paymentDetails object.
//   const legacyPayment = source?.paymentDetails || source?.latestPaymentRelease;
//   if (legacyPayment && getPaymentReleaseAmount(legacyPayment) > 0) {
//     return [
//       {
//         ...legacyPayment,
//         releasedAt:
//           legacyPayment?.releasedAt ||
//           source?.paymentReleasedAt ||
//           source?.releasePaymentAt ||
//           source?.updatedAt ||
//           null,
//       },
//     ];
//   }

//   return [];
// }

// function getTotalReleasedAmount(source: any) {
//   return roundMoney(
//     getPaymentReleaseHistory(source).reduce(
//       (sum, entry) => sum + getPaymentReleaseAmount(entry),
//       0,
//     ),
//   );
// }

// function getApprovedAmountFromRecord(source: any, fallback = 0) {
//   return roundMoney(
//     source?.approvedAmount ??
//       source?.totalApprovedAmount ??
//       source?.approvedTotal ??
//       source?.totalAmount ??
//       source?.amount ??
//       fallback,
//   );
// }

// function getRemainingReleaseAmount(source: any, fallbackApproved = 0) {
//   const approvedAmount = getApprovedAmountFromRecord(source, fallbackApproved);
//   const releasedAmount = getTotalReleasedAmount(source);
//   return roundMoney(Math.max(approvedAmount - releasedAmount, 0));
// }

// function getReleaseDateLabel(value: any) {
//   if (!value) return "-";

//   let date: Date | null = null;

//   if (value instanceof Date) date = value;
//   else if (typeof value?.toDate === "function") date = value.toDate();
//   else if (typeof value?.seconds === "number")
//     date = new Date(value.seconds * 1000);
//   else date = new Date(value);

//   if (!date || Number.isNaN(date.getTime())) return "-";

//   return date.toLocaleString("en-PK", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// }

// function getPaymentMethodLabel(method?: string) {
//   switch (method) {
//     case "cash":
//       return "Cash";
//     case "cheque":
//       return "Cheque";
//     case "bank_transfer":
//       return "Bank Transfer";
//     case "wire":
//       return "Online Transfer";
//     default:
//       return "Not Selected";
//   }
// }

// function getFileSizeLabel(bytes: number) {
//   if (!bytes) return "0 KB";

//   const kb = bytes / 1024;
//   if (kb < 1024) return `${kb.toFixed(1)} KB`;

//   return `${(kb / 1024).toFixed(1)} MB`;
// }

// export default function PaymentReleaseModal<T = any>({
//   isOpen,
//   onClose,
//   onSuccess,
//   title = "Release Payment",
//   invoice = null,

//   context = null,
//   docPath,
//   buildUpdateData,

//   amount,
//   amountLabel,
//   partyLabel,
//   parties,

//   accounts = [],
//   allowCheque = true,
//   allowReceiptUpload = true,
//   initialPaymentMethod,
//   amountReadOnly,
// }: PaymentReleaseModalProps<T>) {
//   const { userProfile, currentUser } = useAuth();
//   const { toast } = useToast();

//   const [loading, setLoading] = useState(false);
//   const [accountsLoading, setAccountsLoading] = useState(false);
//   const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
//   const [selectedAccount, setSelectedAccount] = useState<PaymentAccount | null>(
//     null,
//   );
//   const [storedAccounts, setStoredAccounts] = useState<PaymentAccount[]>([]);
//   const [existingChequeNumbers, setExistingChequeNumbers] = useState<Set<string>>(
//     () => new Set(),
//   );
//   const [chequeValidationLoading, setChequeValidationLoading] = useState(false);

//   const approvedInvoiceItems = useMemo(() => {
//     const items = Array.isArray((invoice as any)?.lineItems)
//       ? (invoice as any).lineItems
//       : [];

//     return items.filter((item: any) => item?.status === "approved");
//   }, [invoice]);

//   const approvedLineItemsAmount = useMemo(() => {
//     return roundMoney(
//       approvedInvoiceItems.reduce((sum: number, item: any) => {
//         const qty = Number(item?.units || 0);
//         const rate = Number(item?.unitRate || 0);
//         const tax = Number(item?.tax || 0);
//         const total = Number(item?.total ?? qty * rate + tax);

//         return sum + total;
//       }, 0),
//     );
//   }, [approvedInvoiceItems]);

//   const invoiceApprovedAmount = useMemo(() => {
//     return getApprovedAmountFromRecord(invoice, approvedLineItemsAmount);
//   }, [invoice, approvedLineItemsAmount]);

//   const paymentReleaseHistory = useMemo(() => {
//     return getPaymentReleaseHistory(invoice);
//   }, [invoice]);

//   const totalReleasedAmount = useMemo(() => {
//     return getTotalReleasedAmount(invoice);
//   }, [invoice]);

//   const remainingReleaseAmount = useMemo(() => {
//     return getRemainingReleaseAmount(invoice, invoiceApprovedAmount);
//   }, [invoice, invoiceApprovedAmount]);

//   const invoiceApprovedVendors = useMemo(() => {
//     const vendors = [
//       ...new Set(
//         approvedInvoiceItems
//           .map((item: any) =>
//             String(
//               item?.vendor ||
//                 item?.vendorName ||
//                 item?.supplier ||
//                 item?.supplierName ||
//                 "",
//             ).trim(),
//           )
//           .filter(Boolean),
//       ),
//     ] as string[];

//     if (vendors.length > 0) return vendors;

//     const fallbackVendor = String(
//       (invoice as any)?.vendorName ||
//         (invoice as any)?.supplierName ||
//         (invoice as any)?.clientName ||
//         (invoice as any)?.partyName ||
//         "",
//     ).trim();

//     return fallbackVendor ? [fallbackVendor] : [];
//   }, [approvedInvoiceItems, invoice]);

//   const resolvedContext = (context ?? invoice ?? null) as
//     | T
//     | InvoiceRequest
//     | null;

//   const resolvedDocPath = useMemo(() => {
//     if (docPath && resolvedContext) {
//       return typeof docPath === "function"
//         ? docPath(resolvedContext as T)
//         : docPath;
//     }

//     if ((invoice as any)?.id) {
//       return ["Panels", "IEDGE-SYSTEM", "invoiceRequests", (invoice as any).id];
//     }

//     return [];
//   }, [docPath, resolvedContext, invoice]);

//   const resolvedAmount = amount ?? (invoice ? remainingReleaseAmount : 0);

//   const resolvedParties = parties ?? (invoice ? invoiceApprovedVendors : []);

//   const resolvedAmountLabel =
//     amountLabel ?? (invoice ? "Remaining Balance" : "Amount");

//   const resolvedPartyLabel =
//     partyLabel ?? (invoice ? "Approved Vendors" : "Payee");

//   const resolvedInitialPaymentMethod =
//     initialPaymentMethod ?? (invoice ? "bank_transfer" : "cash");

//   const resolvedAmountReadOnly = amountReadOnly ?? false;

//   const resolvedAccounts = useMemo(() => {
//     const map = new Map<string, PaymentAccount>();

//     [...storedAccounts, ...accounts].forEach((acc) => {
//       if (!acc?.id) return;
//       map.set(acc.id, acc);
//     });

//     return Array.from(map.values()).filter((acc) => acc.isActive !== false);
//   }, [storedAccounts, accounts]);

//   const defaultInvoiceBuildUpdateData = (
//     args: PaymentReleaseSubmitArgs<InvoiceRequest>,
//   ) => {
//     const { formData, receiptUrl, selectedAccount, actor } = args;

//     const sourceRecord = ((args as any).context || invoice || {}) as any;
//     const extendedFormData = formData as ExtendedPaymentReleaseFormValues;

//     const releaseAmount = roundMoney(extendedFormData.amount);
//     const approvedAmount = getApprovedAmountFromRecord(
//       sourceRecord,
//       invoiceApprovedAmount || releaseAmount,
//     );
//     const existingHistory = getPaymentReleaseHistory(sourceRecord);
//     const releasedBefore = roundMoney(
//       existingHistory.reduce(
//         (sum, entry) => sum + getPaymentReleaseAmount(entry),
//         0,
//       ),
//     );
//     const releasedAfter = roundMoney(releasedBefore + releaseAmount);
//     const remainingAfter = roundMoney(
//       Math.max(approvedAmount - releasedAfter, 0),
//     );
//     const isFullyReleased = approvedAmount > 0 && remainingAfter <= 0.009;

//     const chequeNumbers = cleanChequeNumbers(
//       extendedFormData.chequeNumbers?.length
//         ? extendedFormData.chequeNumbers
//         : [extendedFormData.chequeNumber || ""],
//     );

//     const receiptUrls = Array.isArray((args as any).receiptUrls)
//       ? (args as any).receiptUrls
//       : receiptUrl
//         ? [receiptUrl]
//         : [];

//     const releaseEntry: any = {
//       id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
//       releaseType:
//         releasedBefore <= 0
//           ? isFullyReleased
//             ? "full"
//             : "advance"
//           : isFullyReleased
//             ? "final"
//             : "partial",
//       paymentMethod: extendedFormData.paymentMethod,
//       amount: releaseAmount,
//       approvedAmount,
//       releasedBefore,
//       releasedAfter,
//       remainingAfter,
//       vendors: invoiceApprovedVendors,
//       transactionName: extendedFormData.transactionName?.trim() || "",
//       transactionReference: extendedFormData.transactionReference,
//       bankReceiptUrl: receiptUrls[0] || receiptUrl || "",
//       bankReceiptUrls: receiptUrls,
//       paymentNotes: extendedFormData.paymentNotes,
//       releasedBy: actor.profileId || actor.uid || "",
//       releasedByName: actor.displayName || actor.email || "Unknown",
//       releasedByEmail: actor.email || "",
//       releasedAt: new Date(),
//     };

//     if (chequeNumbers.length > 0) {
//       releaseEntry.chequeNumber = chequeNumbers[0];
//       releaseEntry.chequeNumbers = chequeNumbers;
//     }

//     if (selectedAccount) {
//       releaseEntry.selectedAccount = selectedAccount;
//       releaseEntry.selectedAccountId = selectedAccount.id || "";
//       releaseEntry.selectedAccountName = selectedAccount.accountName || "";
//     }

//     const updateData: Record<string, any> = {
//       status: isFullyReleased
//         ? "payment_released"
//         : "payment_partially_released",
//       paymentStatus: isFullyReleased ? "released" : "partial",
//       paymentReleased: isFullyReleased,
//       paymentPartiallyReleased: !isFullyReleased,
//       releasePaymentCreated: true,
//       totalApprovedAmount: approvedAmount,
//       totalReleasedAmount: releasedAfter,
//       remainingReleaseAmount: remainingAfter,
//       transactionName: extendedFormData.transactionName?.trim() || "",
//       latestTransactionName: extendedFormData.transactionName?.trim() || "",
//       latestPaymentRelease: releaseEntry,
//       paymentDetails: releaseEntry,
//       paymentReleaseHistory: [...existingHistory, releaseEntry],
//       updatedAt: serverTimestamp(),
//     };

//     if (isFullyReleased) {
//       updateData.paymentReleasedAt = serverTimestamp();
//       updateData.releasePaymentAt = serverTimestamp();
//       updateData.paymentFullyReleasedAt = serverTimestamp();
//     } else {
//       updateData.partialPaymentReleasedAt = serverTimestamp();
//     }

//     return updateData;
//   };

//   const [formData, setFormData] = useState<ExtendedPaymentReleaseFormValues>({
//     paymentMethod: resolvedInitialPaymentMethod,
//     selectedAccountId: "",
//     amount: String(resolvedAmount || 0),
//     transactionName: "",
//     chequeNumber: "",
//     chequeNumbers: [""],
//     transactionReference: "",
//     paymentNotes: "",
//   });

//   useEffect(() => {
//     if (!isOpen) return;

//     setFormData({
//       paymentMethod: resolvedInitialPaymentMethod,
//       selectedAccountId: "",
//       amount: String(resolvedAmount || 0),
//       transactionName: "",
//       chequeNumber: "",
//       chequeNumbers: [""],
//       transactionReference: "",
//       paymentNotes: "",
//     });

//     setSelectedAccount(null);
//     setReceiptFiles([]);
//   }, [isOpen, resolvedAmount, resolvedInitialPaymentMethod]);

//   useEffect(() => {
//     let mounted = true;

//     async function loadAccounts() {
//       try {
//         setAccountsLoading(true);

//         const rows = await fetchPaymentAccounts();

//         if (mounted) {
//           setStoredAccounts(rows);
//         }
//       } catch (error) {
//         console.error("Failed to load payment accounts:", error);

//         if (mounted) {
//           toast({
//             title: "Error",
//             description: "Failed to load payment accounts",
//             variant: "destructive",
//           });
//         }
//       } finally {
//         if (mounted) {
//           setAccountsLoading(false);
//         }
//       }
//     }

//     if (isOpen) {
//       loadAccounts();
//     }

//     return () => {
//       mounted = false;
//     };
//   }, [isOpen, toast]);

//   useEffect(() => {
//     if (!isOpen) return;

//     let mounted = true;

//     async function loadExistingChequeNumbers() {
//       try {
//         setChequeValidationLoading(true);

//         const snapshots = await Promise.all([
//           getDocs(collection(db, "Panels", PANEL_ID, "invoiceRequests")),
//           getDocs(collection(db, "Panels", PANEL_ID, "Record")),
//           getDocs(collection(db, "Panels", PANEL_ID, "payments")),
//         ]);

//         const chequeSet = new Set<string>();

//         snapshots.forEach((snapshot) => {
//           snapshot.docs.forEach((documentSnapshot) => {
//             const source = { id: documentSnapshot.id, ...documentSnapshot.data() };

//             collectChequeNumbersFromSource(source).forEach((chequeNumber) => {
//               const normalized = normalizeChequeNumber(chequeNumber);
//               if (normalized) chequeSet.add(normalized);
//             });
//           });
//         });

//         if (mounted) {
//           setExistingChequeNumbers(chequeSet);
//         }
//       } catch (error) {
//         console.error("Failed to validate existing cheque numbers:", error);

//         if (mounted) {
//           toast({
//             title: "Warning",
//             description:
//               "Cheque number validation could not be completed. Please try again.",
//             variant: "destructive",
//           });
//         }
//       } finally {
//         if (mounted) {
//           setChequeValidationLoading(false);
//         }
//       }
//     }

//     loadExistingChequeNumbers();

//     return () => {
//       mounted = false;
//     };
//   }, [isOpen, toast]);

//   const duplicateChequeNumbers = useMemo(() => {
//     return getDuplicateChequeNumbers(formData.chequeNumbers, existingChequeNumbers);
//   }, [formData.chequeNumbers, existingChequeNumbers]);

//   const hasDuplicateChequeNumbers = duplicateChequeNumbers.length > 0;

//   const getChequeNumberWarning = (chequeNumber: string, index: number) => {
//     const normalized = normalizeChequeNumber(chequeNumber);
//     if (!normalized) return "";

//     if (existingChequeNumbers.has(normalized)) {
//       return "This cheque number already exists.";
//     }

//     const appearsInCurrentForm = formData.chequeNumbers.some(
//       (currentChequeNumber, chequeIndex) =>
//         chequeIndex !== index &&
//         normalizeChequeNumber(currentChequeNumber) === normalized,
//     );

//     return appearsInCurrentForm
//       ? "This cheque number is already added in this release."
//       : "";
//   };

//   const submitDisabled = loading;

//   const handleChequeNumberChange = (index: number, value: string) => {
//     setFormData((prev) => {
//       const updatedChequeNumbers = [...prev.chequeNumbers];
//       updatedChequeNumbers[index] = value;

//       return {
//         ...prev,
//         chequeNumbers: updatedChequeNumbers,
//         chequeNumber: updatedChequeNumbers[0] || "",
//       };
//     });
//   };

//   const handleAddChequeNumber = () => {
//     setFormData((prev) => ({
//       ...prev,
//       chequeNumbers: [...prev.chequeNumbers, ""],
//     }));
//   };

//   const handleRemoveChequeNumber = (index: number) => {
//     setFormData((prev) => {
//       const updatedChequeNumbers = prev.chequeNumbers.filter(
//         (_, chequeIndex) => chequeIndex !== index,
//       );

//       const safeChequeNumbers =
//         updatedChequeNumbers.length > 0 ? updatedChequeNumbers : [""];

//       return {
//         ...prev,
//         chequeNumbers: safeChequeNumbers,
//         chequeNumber: safeChequeNumbers[0] || "",
//       };
//     });
//   };

//   const handleReceiptFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
//     const files = Array.from(event.target.files || []);
//     setReceiptFiles(files);
//   };

//   const handleRemoveReceiptFile = (index: number) => {
//     setReceiptFiles((prev) =>
//       prev.filter((_, fileIndex) => fileIndex !== index),
//     );
//   };

//   async function handleSubmit(e: FormEvent<HTMLFormElement>) {
//     e.preventDefault();

//     if (!resolvedContext) {
//       toast({
//         title: "Error",
//         description: "No record selected",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!formData.paymentMethod) {
//       toast({
//         title: "Error",
//         description: "Please select a payment method",
//         variant: "destructive",
//       });
//       return;
//     }

//     const requestedReleaseAmount = roundMoney(formData.amount);

//     if (!formData.amount || requestedReleaseAmount <= 0) {
//       toast({
//         title: "Error",
//         description: "Please enter a valid amount",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (invoice && requestedReleaseAmount > remainingReleaseAmount + 0.009) {
//       toast({
//         title: "Error",
//         description: `Release amount cannot exceed the remaining balance of Rs ${formatPKR(remainingReleaseAmount)}.`,
//         variant: "destructive",
//       });
//       return;
//     }

//     const normalizedChequeNumbers = cleanChequeNumbers(formData.chequeNumbers);

//     if (formData.paymentMethod === "cheque") {
//       if (!formData.selectedAccountId) {
//         toast({
//           title: "Error",
//           description: "Please select an account",
//           variant: "destructive",
//         });
//         return;
//       }

//       if (normalizedChequeNumbers.length === 0) {
//         toast({
//           title: "Error",
//           description: "Please enter at least one cheque number",
//           variant: "destructive",
//         });
//         return;
//       }

//       const duplicateCheques = getDuplicateChequeNumbers(
//         normalizedChequeNumbers,
//         existingChequeNumbers,
//       );

//       if (duplicateCheques.length > 0) {
//         toast({
//           title: "Warning",
//           description: `This cheque number already exists: ${duplicateCheques.join(
//             ", ",
//           )}. Payment will still be saved.`,
//         });
//       }
//     }

//     const normalizedFormData: ExtendedPaymentReleaseFormValues = {
//       ...formData,
//       transactionName: formData.transactionName.trim(),
//       chequeNumber: normalizedChequeNumbers[0] || "",
//       chequeNumbers: normalizedChequeNumbers,
//     };

//     try {
//       setLoading(true);

//       await releasePayment({
//         docPath: resolvedDocPath,
//         context: resolvedContext as any,
//         formData: normalizedFormData as any,

//         // Old support: existing releasePayment can still use this first file.
//         receiptFile: receiptFiles[0] || null,

//         // New support: update releasePayment to upload these if not already supported.
//         receiptFiles,

//         selectedAccount,
//         actor: {
//           uid: currentUser?.uid,
//           email: currentUser?.email,
//           displayName: userProfile?.displayName || currentUser?.email,
//           profileId: userProfile?.id,
//         },
//         buildUpdateData: (buildUpdateData ||
//           defaultInvoiceBuildUpdateData) as any,
//       } as any);

//       toast({
//         title: "Success",
//         description: "Payment released successfully",
//       });

//       onSuccess();
//       onClose();
//     } catch (error: any) {
//       console.error("Failed to release payment:", error);

//       toast({
//         title: "Error",
//         description: error?.message || "Failed to release payment",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   }

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 min-h-screen overflow-y-auto bg-slate-50">
//       <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
//         <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
//           <div className="flex items-start gap-4">
//             <Button
//               type="button"
//               variant="outline"
//               size="icon"
//               className="mt-1 h-10 w-10 rounded-full border-slate-200 bg-white shadow-sm hover:bg-slate-50"
//               onClick={onClose}
//             >
//               <ArrowLeft className="h-4 w-4" />
//             </Button>

//             <div>
//               <div className="flex flex-wrap items-center gap-2">
//                 <h1 className="text-2xl font-bold tracking-tight text-slate-950">
//                   {title}
//                 </h1>

//                 <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
//                   Payment Release
//                 </span>
//               </div>

//               <p className="mt-1 max-w-2xl text-sm text-slate-500">
//                 Review payment information, select the payment method, attach
//                 receipts, and release the remaining amount.
//               </p>
//             </div>
//           </div>

//           <div className="flex flex-wrap gap-2">
//             <Button
//               type="button"
//               variant="outline"
//               className="rounded-full border-slate-200 px-5"
//               onClick={onClose}
//               disabled={loading}
//             >
//               Cancel
//             </Button>

//             <Button
//               type="submit"
//               form="payment-release-form"
//               disabled={submitDisabled}
//               className="rounded-full bg-slate-950 px-6 text-white shadow-sm hover:bg-slate-800"
//             >
//               {loading ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Releasing...
//                 </>
//               ) : (
//                 <>
//                   <CheckCircle2 className="mr-2 h-4 w-4" />
//                   Release Payment
//                 </>
//               )}
//             </Button>
//           </div>
//         </div>
//       </div>

//       <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
//         <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
//           <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//             <div className="flex items-center justify-between gap-4">
//               <div>
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                   Total Approved Amount
//                 </p>
//                 <p className="mt-2 text-2xl font-bold text-slate-950">
//                   Rs{" "}
//                   {formatPKR(invoice ? invoiceApprovedAmount : resolvedAmount)}
//                 </p>
//               </div>

//               <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
//                 <Wallet className="h-5 w-5" />
//               </div>
//             </div>
//           </div>

//           <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//             <div className="flex items-center justify-between gap-4">
//               <div>
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                   Released So Far
//                 </p>
//                 <p className="mt-2 text-2xl font-bold text-slate-950">
//                   Rs {formatPKR(invoice ? totalReleasedAmount : 0)}
//                 </p>
//               </div>

//               <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
//                 <CheckCircle2 className="h-5 w-5" />
//               </div>
//             </div>
//           </div>

//           <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//             <div className="flex items-center justify-between gap-4">
//               <div>
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                   Remaining Balance
//                 </p>
//                 <p className="mt-2 text-2xl font-bold text-slate-950">
//                   Rs{" "}
//                   {formatPKR(invoice ? remainingReleaseAmount : resolvedAmount)}
//                 </p>
//               </div>

//               <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
//                 <Banknote className="h-5 w-5" />
//               </div>
//             </div>
//           </div>

//           <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//             <div className="flex items-center justify-between gap-4">
//               <div>
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                   Payment Method
//                 </p>
//                 <p className="mt-2 text-sm font-semibold text-slate-950">
//                   {getPaymentMethodLabel(formData.paymentMethod)}
//                 </p>
//               </div>

//               <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
//                 <CreditCard className="h-5 w-5" />
//               </div>
//             </div>
//           </div>
//         </div>

//         {invoice && invoiceApprovedAmount > 0 && (
//           <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//             <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
//               <div>
//                 <p className="text-sm font-semibold text-slate-950">
//                   Payment Release Progress
//                 </p>
//                 <p className="mt-1 text-xs text-slate-500">
//                   Rs {formatPKR(totalReleasedAmount)} released from Rs{" "}
//                   {formatPKR(invoiceApprovedAmount)}.
//                 </p>
//               </div>
//               <p className="text-sm font-semibold text-slate-950">
//                 {Math.min(
//                   100,
//                   Math.round(
//                     (totalReleasedAmount / invoiceApprovedAmount) * 100,
//                   ),
//                 )}
//                 %
//               </p>
//             </div>

//             <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
//               <div
//                 className="h-full rounded-full bg-slate-950 transition-all"
//                 style={{
//                   width: `${Math.min(
//                     100,
//                     Math.max(
//                       0,
//                       (totalReleasedAmount / invoiceApprovedAmount) * 100,
//                     ),
//                   )}%`,
//                 }}
//               />
//             </div>
//           </div>
//         )}

//         <form
//           id="payment-release-form"
//           onSubmit={handleSubmit}
//           className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]"
//         >
//           <div className="space-y-6">
//             <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
//               <div className="mb-6 flex items-start gap-3">
//                 <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
//                   <Banknote className="h-5 w-5" />
//                 </div>

//                 <div>
//                   <h2 className="text-lg font-semibold text-slate-950">
//                     Payment Information
//                   </h2>
//                   <p className="mt-1 text-sm text-slate-500">
//                     Enter the release amount and payment method details.
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
//                 <div className="space-y-2">
//                   <Label htmlFor="amount" className="text-sm text-slate-700">
//                     Release Amount
//                   </Label>

//                   <Input
//                     id="amount"
//                     type="number"
//                     min="0"
//                     step="0.01"
//                     max={invoice ? remainingReleaseAmount : undefined}
//                     value={formData.amount}
//                     readOnly={resolvedAmountReadOnly}
//                     className={`h-11 rounded-2xl border-slate-200 ${
//                       resolvedAmountReadOnly ? "bg-slate-100" : "bg-white"
//                     }`}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         amount: e.target.value,
//                       }))
//                     }
//                   />

//                   {invoice && (
//                     <p className="text-xs text-slate-500">
//                       You can release any amount up to Rs{" "}
//                       {formatPKR(remainingReleaseAmount)}.
//                     </p>
//                   )}
//                 </div>

//                 <div className="space-y-2">
//                   <Label
//                     htmlFor="paymentMethod"
//                     className="text-sm text-slate-700"
//                   >
//                     Payment Method
//                   </Label>

//                   <Select
//                     value={formData.paymentMethod}
//                     onValueChange={(value: any) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         paymentMethod: value,
//                         chequeNumbers:
//                           value === "cheque" && prev.chequeNumbers.length === 0
//                             ? [""]
//                             : prev.chequeNumbers,
//                       }))
//                     }
//                   >
//                     <SelectTrigger className="h-11 rounded-2xl border-slate-200">
//                       <SelectValue placeholder="Select payment method" />
//                     </SelectTrigger>

//                     <SelectContent>
//                       <SelectItem value="cash">Cash</SelectItem>
//                       <SelectItem value="bank_transfer">
//                         Bank Transfer
//                       </SelectItem>
//                       <SelectItem value="wire">Online Transfer</SelectItem>
//                       {allowCheque && (
//                         <SelectItem value="cheque">Cheque</SelectItem>
//                       )}
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>
//             </section>

//             {formData.paymentMethod === "cheque" && allowCheque && (
//               <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
//                 <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
//                   <div>
//                     <h2 className="text-lg font-semibold text-slate-950">
//                       Cheque Details
//                     </h2>
//                     <p className="mt-1 text-sm text-slate-500">
//                       Select the account and add one or more cheque numbers.
//                     </p>
//                   </div>

//                   <Button
//                     type="button"
//                     variant="outline"
//                     size="sm"
//                     className="rounded-full border-slate-200"
//                     onClick={handleAddChequeNumber}
//                   >
//                     <Plus className="mr-2 h-4 w-4" />
//                     Add Cheque
//                   </Button>
//                 </div>

//                 <div className="space-y-5">
//                   <div className="space-y-2">
//                     <Label htmlFor="account" className="text-sm text-slate-700">
//                       Select Account
//                     </Label>

//                     <Select
//                       value={formData.selectedAccountId}
//                       onValueChange={(value) => {
//                         const account =
//                           resolvedAccounts.find((acc) => acc.id === value) ||
//                           null;

//                         setSelectedAccount(account);
//                         setFormData((prev) => ({
//                           ...prev,
//                           selectedAccountId: value,
//                         }));
//                       }}
//                     >
//                       <SelectTrigger className="h-11 rounded-2xl border-slate-200">
//                         <SelectValue
//                           placeholder={
//                             accountsLoading
//                               ? "Loading accounts..."
//                               : "Select account"
//                           }
//                         />
//                       </SelectTrigger>

//                       <SelectContent>
//                         {resolvedAccounts.length === 0 ? (
//                           <SelectItem value="__no_accounts__" disabled>
//                             No active accounts found
//                           </SelectItem>
//                         ) : (
//                           resolvedAccounts.map((account) => (
//                             <SelectItem key={account.id} value={account.id}>
//                               {account.accountName || account.id}
//                             </SelectItem>
//                           ))
//                         )}
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   {selectedAccount && (
//                     <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
//                       <h3 className="mb-4 text-sm font-semibold text-slate-950">
//                         Account Information
//                       </h3>

//                       <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
//                         <div>
//                           <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                             Account Name
//                           </p>
//                           <p className="mt-1 font-semibold text-slate-900">
//                             {selectedAccount.accountName || "-"}
//                           </p>
//                         </div>

//                         <div>
//                           <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                             Account Number
//                           </p>
//                           <p className="mt-1 font-semibold text-slate-900">
//                             {selectedAccount.accountNumber || "-"}
//                           </p>
//                         </div>

//                         <div>
//                           <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                             Bank
//                           </p>
//                           <p className="mt-1 font-semibold text-slate-900">
//                             {selectedAccount.bankName || "-"}
//                           </p>
//                         </div>

//                         <div>
//                           <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                             Balance
//                           </p>
//                           <p className="mt-1 font-semibold text-slate-900">
//                             Rs{" "}
//                             {formatPKR(
//                               selectedAccount.currentBalance ??
//                                 selectedAccount.balance ??
//                                 0,
//                             )}
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   <div className="space-y-3">
//                     <Label className="text-sm text-slate-700">
//                       Cheque Numbers
//                     </Label>

//                     {formData.chequeNumbers.map((chequeNumber, index) => (
//                       <div
//                         key={index}
//                         className="flex flex-col gap-2 sm:flex-row sm:items-start"
//                       >
//                         <div className="flex-1">
//                           <Input
//                             value={chequeNumber}
//                             onChange={(e) =>
//                               handleChequeNumberChange(index, e.target.value)
//                             }
//                             placeholder={`Enter cheque number ${index + 1}`}
//                             className={`h-11 rounded-2xl ${
//                               getChequeNumberWarning(chequeNumber, index)
//                                 ? "border-amber-400 bg-amber-50"
//                                 : "border-slate-200"
//                             }`}
//                           />

//                           {getChequeNumberWarning(chequeNumber, index) && (
//                             <p className="mt-1 text-xs font-medium text-amber-700">
//                               {getChequeNumberWarning(chequeNumber, index)}
//                             </p>
//                           )}
//                         </div>

//                         <Button
//                           type="button"
//                           variant="outline"
//                           size="icon"
//                           className="h-11 w-11 shrink-0 rounded-2xl border-slate-200 text-red-600 hover:bg-red-50 hover:text-red-700"
//                           onClick={() => handleRemoveChequeNumber(index)}
//                           disabled={formData.chequeNumbers.length === 1}
//                         >
//                           <Trash2 className="h-4 w-4" />
//                         </Button>
//                       </div>
//                     ))}

//                     {chequeValidationLoading && (
//                       <p className="text-xs text-slate-500">
//                         Checking existing cheque numbers...
//                       </p>
//                     )}

//                     {hasDuplicateChequeNumbers && (
//                       <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
//                         This cheque number already exists: {duplicateChequeNumbers.join(", ")}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </section>
//             )}

//             <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
//               <div className="mb-6 flex items-start gap-3">
//                 <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
//                   <ReceiptText className="h-5 w-5" />
//                 </div>

//                 <div>
//                   <h2 className="text-lg font-semibold text-slate-950">
//                     Reference & Notes
//                   </h2>
//                   <p className="mt-1 text-sm text-slate-500">
//                     Add transaction reference, upload receipts, and write
//                     payment notes.
//                   </p>
//                 </div>
//               </div>

//               <div className="space-y-5">
//                 <div className="space-y-2">
//                   <Label
//                     htmlFor="transactionName"
//                     className="text-sm text-slate-700"
//                   >
//                     Transaction Name
//                   </Label>

//                   <Input
//                     id="transactionName"
//                     value={formData.transactionName}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         transactionName: e.target.value,
//                       }))
//                     }
//                     placeholder="Enter transaction name"
//                     className="h-11 rounded-2xl border-slate-200"
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label
//                     htmlFor="transactionReference"
//                     className="text-sm text-slate-700"
//                   >
//                     Transaction Reference
//                   </Label>

//                   <Input
//                     id="transactionReference"
//                     value={formData.transactionReference}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         transactionReference: e.target.value,
//                       }))
//                     }
//                     placeholder="Enter transaction reference"
//                     className="h-11 rounded-2xl border-slate-200"
//                   />
//                 </div>

//                 {allowReceiptUpload && (
//                   <div className="space-y-3">
//                     <Label htmlFor="receipt" className="text-sm text-slate-700">
//                       Upload Receipt / Cheque Copies
//                     </Label>

//                     <label
//                       htmlFor="receipt"
//                       className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-slate-400 hover:bg-slate-100"
//                     >
//                       <FileUp className="h-8 w-8 text-slate-500" />

//                       <p className="mt-3 text-sm font-semibold text-slate-800">
//                         Click to upload files
//                       </p>

//                       <p className="mt-1 text-xs text-slate-500">
//                         JPG, PNG, or PDF. Multiple files are allowed.
//                       </p>

//                       <Input
//                         id="receipt"
//                         type="file"
//                         accept=".jpg,.jpeg,.png,.pdf"
//                         multiple
//                         onChange={handleReceiptFilesChange}
//                         className="hidden"
//                       />
//                     </label>

//                     {receiptFiles.length > 0 && (
//                       <div className="space-y-2">
//                         {receiptFiles.map((file, index) => (
//                           <div
//                             key={`${file.name}-${index}`}
//                             className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
//                           >
//                             <div className="min-w-0">
//                               <p className="truncate font-medium text-slate-900">
//                                 {index + 1}. {file.name}
//                               </p>
//                               <p className="text-xs text-slate-500">
//                                 {getFileSizeLabel(file.size)}
//                               </p>
//                             </div>

//                             <Button
//                               type="button"
//                               variant="ghost"
//                               size="icon"
//                               className="h-9 w-9 shrink-0 rounded-full text-red-600 hover:bg-red-50 hover:text-red-700"
//                               onClick={() => handleRemoveReceiptFile(index)}
//                             >
//                               <Trash2 className="h-4 w-4" />
//                             </Button>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 )}

//                 <div className="space-y-2">
//                   <Label
//                     htmlFor="paymentNotes"
//                     className="text-sm text-slate-700"
//                   >
//                     Payment Notes
//                   </Label>

//                   <Textarea
//                     id="paymentNotes"
//                     rows={5}
//                     value={formData.paymentNotes}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         paymentNotes: e.target.value,
//                       }))
//                     }
//                     placeholder="Add any notes..."
//                     className="rounded-2xl border-slate-200"
//                   />
//                 </div>
//               </div>
//             </section>
//           </div>

//           <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
//             <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//               <h2 className="text-base font-semibold text-slate-950">
//                 Release Summary
//               </h2>

//               <div className="mt-5 space-y-4 text-sm">
//                 {invoice && (
//                   <>
//                     <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                       <span className="text-slate-500">Approved</span>
//                       <span className="text-right font-semibold text-slate-950">
//                         Rs {formatPKR(invoiceApprovedAmount)}
//                       </span>
//                     </div>

//                     <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                       <span className="text-slate-500">Released Before</span>
//                       <span className="text-right font-semibold text-slate-950">
//                         Rs {formatPKR(totalReleasedAmount)}
//                       </span>
//                     </div>
//                   </>
//                 )}

//                 <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                   <span className="text-slate-500">This Release</span>
//                   <span className="text-right font-semibold text-slate-950">
//                     Rs {formatPKR(formData.amount)}
//                   </span>
//                 </div>

//                 {invoice && (
//                   <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                     <span className="text-slate-500">Balance After</span>
//                     <span className="text-right font-semibold text-slate-950">
//                       Rs{" "}
//                       {formatPKR(
//                         Math.max(
//                           remainingReleaseAmount - safeNumber(formData.amount),
//                           0,
//                         ),
//                       )}
//                     </span>
//                   </div>
//                 )}

//                 <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                   <span className="text-slate-500">Transaction Name</span>
//                   <span className="max-w-[190px] text-right font-semibold text-slate-950">
//                     {formData.transactionName.trim() || "-"}
//                   </span>
//                 </div>

//                 <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                   <span className="text-slate-500">Method</span>
//                   <span className="text-right font-semibold text-slate-950">
//                     {getPaymentMethodLabel(formData.paymentMethod)}
//                   </span>
//                 </div>

//                 <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                   <span className="text-slate-500">Party</span>
//                   <span className="max-w-[190px] text-right font-semibold text-slate-950">
//                     {resolvedParties.length ? resolvedParties.join(", ") : "-"}
//                   </span>
//                 </div>

//                 {formData.paymentMethod === "cheque" && (
//                   <>
//                     <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                       <span className="text-slate-500">Account</span>
//                       <span className="max-w-[190px] text-right font-semibold text-slate-950">
//                         {selectedAccount?.accountName || "-"}
//                       </span>
//                     </div>

//                     <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                       <span className="text-slate-500">Cheques</span>
//                       <span className="text-right font-semibold text-slate-950">
//                         {cleanChequeNumbers(formData.chequeNumbers).length}
//                       </span>
//                     </div>
//                   </>
//                 )}

//                 <div className="flex items-start justify-between gap-4">
//                   <span className="text-slate-500">Files</span>
//                   <span className="text-right font-semibold text-slate-950">
//                     {receiptFiles.length}
//                   </span>
//                 </div>
//               </div>
//             </section>

//             {paymentReleaseHistory.length > 0 && (
//               <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//                 <h2 className="text-base font-semibold text-slate-950">
//                   Payment Release History
//                 </h2>

//                 <div className="mt-4 space-y-3">
//                   {[...paymentReleaseHistory]
//                     .reverse()
//                     .map((entry: any, index: number) => (
//                       <div
//                         key={
//                           entry?.id ||
//                           `${entry?.releasedAt || "release"}-${index}`
//                         }
//                         className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm"
//                       >
//                         <div className="flex items-start justify-between gap-3">
//                           <div>
//                             <p className="font-semibold text-slate-950">
//                               Rs {formatPKR(getPaymentReleaseAmount(entry))}
//                             </p>
//                             <p className="mt-1 text-xs text-slate-500">
//                               {getPaymentMethodLabel(entry?.paymentMethod)} •{" "}
//                               {getReleaseDateLabel(entry?.releasedAt)}
//                             </p>
//                           </div>
//                           <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
//                             {entry?.releaseType || "release"}
//                           </span>
//                         </div>

//                         <div className="mt-3 space-y-1 text-xs text-slate-500">
//                           <p>Released By: {entry?.releasedByName || "-"}</p>
//                           {entry?.transactionName && (
//                             <p>Transaction: {entry.transactionName}</p>
//                           )}
//                           {entry?.transactionReference && (
//                             <p>Reference: {entry.transactionReference}</p>
//                           )}
//                           {Array.isArray(entry?.chequeNumbers) &&
//                             entry.chequeNumbers.length > 0 && (
//                               <p>Cheques: {entry.chequeNumbers.join(", ")}</p>
//                             )}
//                           {entry?.paymentNotes && (
//                             <p>Notes: {entry.paymentNotes}</p>
//                           )}
//                         </div>
//                       </div>
//                     ))}
//                 </div>
//               </section>
//             )}

//             <section className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
//               <h3 className="text-sm font-semibold text-blue-950">
//                 Before releasing
//               </h3>

//               <ul className="mt-3 space-y-2 text-sm text-blue-800">
//                 <li>Confirm the release amount is correct.</li>
//                 <li>For cheque payment, add all cheque numbers.</li>
//                 <li>Upload receipt or cheque copy files if available.</li>
//               </ul>
//             </section>
//           </aside>
//         </form>
//       </main>
//     </div>
//   );
// }





// import {
//   useEffect,
//   useMemo,
//   useState,
//   type ChangeEvent,
//   type FormEvent,
// } from "react";
// import {
//   collection,
//   getDocs,
//   serverTimestamp,
// } from "firebase/firestore";
// import {
//   ArrowLeft,
//   Banknote,
//   CheckCircle2,
//   CreditCard,
//   FileUp,
//   Loader2,
//   Plus,
//   ReceiptText,
//   Trash2,
//   Wallet,
// } from "lucide-react";
// import { useAuth } from "@/contexts/AuthContext";
// import { db } from "@/lib/firebase";
// import { releasePayment } from "@/lib/payments/releasePayment";
// import { fetchPaymentAccounts } from "@/lib/payments/paymentAccounts";
// import {
//   PaymentAccount,
//   PaymentReleaseFormValues,
//   PaymentReleaseSubmitArgs,
// } from "@/lib/payments/types";
// import { InvoiceRequest } from "@shared/schema";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Textarea } from "@/components/ui/textarea";
// import { useToast } from "@/hooks/use-toast";

// interface PaymentReleaseModalProps<T = any> {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: () => void;
//   title?: string;

//   invoice?: InvoiceRequest | null;

//   context?: T | null;
//   docPath?: ((context: T) => string[]) | string[];
//   buildUpdateData?: (
//     args: PaymentReleaseSubmitArgs<T>,
//   ) => Record<string, any>;

//   amount?: number;
//   amountLabel?: string;
//   partyLabel?: string;
//   parties?: string[];

//   accounts?: PaymentAccount[];
//   allowCheque?: boolean;
//   allowReceiptUpload?: boolean;
//   initialPaymentMethod?:
//     | "cash"
//     | "cheque"
//     | "bank_transfer"
//     | "wire";
//   amountReadOnly?: boolean;
// }

// const PANEL_ID = "IEDGE-SYSTEM";

// type ExtendedPaymentReleaseFormValues =
//   PaymentReleaseFormValues & {
//     transactionName: string;
//     chequeNumbers: string[];
//   };

// function normalizeText(value: any) {
//   return String(value || "")
//     .trim()
//     .toLowerCase();
// }

// function normalizeChequeNumber(value: any) {
//   return String(value ?? "")
//     .trim()
//     .replace(/\s+/g, "")
//     .toLowerCase();
// }

// function extractChequeNumbersFromValue(
//   value: any,
// ): string[] {
//   if (value === undefined || value === null) {
//     return [];
//   }

//   if (Array.isArray(value)) {
//     return value.flatMap((item) =>
//       extractChequeNumbersFromValue(item),
//     );
//   }

//   if (typeof value === "object") {
//     return [];
//   }

//   return String(value)
//     .split(/[\n,]/g)
//     .map((item) => item.trim())
//     .filter(Boolean);
// }

// function collectChequeNumbersFromSource(
//   source: any,
// ): string[] {
//   if (!source) return [];

//   const paymentDetails =
//     source.paymentDetails || {};
//   const latestPaymentRelease =
//     source.latestPaymentRelease || {};
//   const accountDetails =
//     source.accountDetails || {};
//   const bankDetails = source.bankDetails || {};
//   const receivePayment =
//     source.receivePayment || {};

//   const paymentReleaseHistory = Array.isArray(
//     source.paymentReleaseHistory,
//   )
//     ? source.paymentReleaseHistory
//     : [];

//   return [
//     ...extractChequeNumbersFromValue(
//       source.chequeNumber,
//     ),
//     ...extractChequeNumbersFromValue(
//       source.chequeNumbers,
//     ),
//     ...extractChequeNumbersFromValue(
//       source.chequeNo,
//     ),
//     ...extractChequeNumbersFromValue(
//       source.checkNumber,
//     ),
//     ...extractChequeNumbersFromValue(
//       source.checkNo,
//     ),
//     ...extractChequeNumbersFromValue(
//       source.bankChequeNumber,
//     ),
//     ...extractChequeNumbersFromValue(
//       source.paymentChequeNumber,
//     ),
//     ...extractChequeNumbersFromValue(
//       source.receivedChequeNumber,
//     ),
//     ...extractChequeNumbersFromValue(
//       source.reference,
//     ),
//     ...extractChequeNumbersFromValue(
//       source.Reference,
//     ),
//     ...extractChequeNumbersFromValue(
//       source.transactionReference,
//     ),

//     ...extractChequeNumbersFromValue(
//       paymentDetails.chequeNumber,
//     ),
//     ...extractChequeNumbersFromValue(
//       paymentDetails.chequeNumbers,
//     ),
//     ...extractChequeNumbersFromValue(
//       paymentDetails.chequeNo,
//     ),
//     ...extractChequeNumbersFromValue(
//       paymentDetails.checkNumber,
//     ),
//     ...extractChequeNumbersFromValue(
//       paymentDetails.reference,
//     ),
//     ...extractChequeNumbersFromValue(
//       paymentDetails.Reference,
//     ),
//     ...extractChequeNumbersFromValue(
//       paymentDetails.transactionReference,
//     ),

//     ...extractChequeNumbersFromValue(
//       latestPaymentRelease.chequeNumber,
//     ),
//     ...extractChequeNumbersFromValue(
//       latestPaymentRelease.chequeNumbers,
//     ),
//     ...extractChequeNumbersFromValue(
//       latestPaymentRelease.chequeNo,
//     ),
//     ...extractChequeNumbersFromValue(
//       latestPaymentRelease.checkNumber,
//     ),
//     ...extractChequeNumbersFromValue(
//       latestPaymentRelease.reference,
//     ),
//     ...extractChequeNumbersFromValue(
//       latestPaymentRelease.Reference,
//     ),
//     ...extractChequeNumbersFromValue(
//       latestPaymentRelease.transactionReference,
//     ),

//     ...extractChequeNumbersFromValue(
//       accountDetails.chequeNumber,
//     ),
//     ...extractChequeNumbersFromValue(
//       accountDetails.chequeNumbers,
//     ),
//     ...extractChequeNumbersFromValue(
//       accountDetails.chequeNo,
//     ),
//     ...extractChequeNumbersFromValue(
//       accountDetails.checkNumber,
//     ),
//     ...extractChequeNumbersFromValue(
//       accountDetails.reference,
//     ),
//     ...extractChequeNumbersFromValue(
//       accountDetails.Reference,
//     ),
//     ...extractChequeNumbersFromValue(
//       accountDetails.transactionReference,
//     ),

//     ...extractChequeNumbersFromValue(
//       bankDetails.chequeNumber,
//     ),
//     ...extractChequeNumbersFromValue(
//       bankDetails.chequeNumbers,
//     ),
//     ...extractChequeNumbersFromValue(
//       bankDetails.chequeNo,
//     ),
//     ...extractChequeNumbersFromValue(
//       bankDetails.checkNumber,
//     ),
//     ...extractChequeNumbersFromValue(
//       bankDetails.reference,
//     ),
//     ...extractChequeNumbersFromValue(
//       bankDetails.Reference,
//     ),
//     ...extractChequeNumbersFromValue(
//       bankDetails.transactionReference,
//     ),

//     ...extractChequeNumbersFromValue(
//       receivePayment.chequeNumber,
//     ),
//     ...extractChequeNumbersFromValue(
//       receivePayment.chequeNumbers,
//     ),
//     ...extractChequeNumbersFromValue(
//       receivePayment.chequeNo,
//     ),
//     ...extractChequeNumbersFromValue(
//       receivePayment.checkNumber,
//     ),
//     ...extractChequeNumbersFromValue(
//       receivePayment.reference,
//     ),
//     ...extractChequeNumbersFromValue(
//       receivePayment.Reference,
//     ),
//     ...extractChequeNumbersFromValue(
//       receivePayment.transactionReference,
//     ),

//     ...paymentReleaseHistory.flatMap(
//       (entry: any) =>
//         collectChequeNumbersFromSource(entry),
//     ),
//   ];
// }

// function cleanChequeNumbers(
//   values: string[] = [],
// ) {
//   return values
//     .map((value) => value.trim())
//     .filter(Boolean);
// }

// function getDuplicateChequeNumbers(
//   chequeNumbers: string[],
//   existingChequeNumbers: Set<string>,
// ) {
//   const normalizedCounts = new Map<
//     string,
//     number
//   >();

//   chequeNumbers.forEach((chequeNumber) => {
//     const normalized =
//       normalizeChequeNumber(chequeNumber);

//     if (!normalized) return;

//     normalizedCounts.set(
//       normalized,
//       (normalizedCounts.get(normalized) || 0) +
//         1,
//     );
//   });

//   return cleanChequeNumbers(
//     chequeNumbers,
//   ).filter((chequeNumber) => {
//     const normalized =
//       normalizeChequeNumber(chequeNumber);

//     return (
//       existingChequeNumbers.has(normalized) ||
//       (normalizedCounts.get(normalized) || 0) >
//         1
//     );
//   });
// }

// function formatPKR(
//   value:
//     | number
//     | string
//     | undefined
//     | null,
// ) {
//   const numberValue =
//     typeof value === "number"
//       ? value
//       : Number(
//           String(value || 0).replace(/,/g, ""),
//         ) || 0;

//   return numberValue.toLocaleString("en-PK", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });
// }

// function safeNumber(value: any) {
//   const parsed = Number(
//     String(value ?? 0).replace(/,/g, ""),
//   );

//   return Number.isFinite(parsed) ? parsed : 0;
// }

// function roundMoney(value: any) {
//   return (
//     Math.round(safeNumber(value) * 100) / 100
//   );
// }

// function getPaymentReleaseAmount(entry: any) {
//   return roundMoney(
//     entry?.amount ??
//       entry?.releaseAmount ??
//       entry?.releasedAmount ??
//       entry?.paymentAmount ??
//       0,
//   );
// }

// function getPaymentReleaseHistory(
//   source: any,
// ): any[] {
//   const history = Array.isArray(
//     source?.paymentReleaseHistory,
//   )
//     ? source.paymentReleaseHistory
//     : [];

//   if (history.length > 0) {
//     return history.filter(
//       (entry: any) =>
//         getPaymentReleaseAmount(entry) > 0,
//     );
//   }

//   // Backward compatibility for older records.
//   const legacyPayment =
//     source?.paymentDetails ||
//     source?.latestPaymentRelease;

//   if (
//     legacyPayment &&
//     getPaymentReleaseAmount(legacyPayment) > 0
//   ) {
//     return [
//       {
//         ...legacyPayment,
//         releasedAt:
//           legacyPayment?.releasedAt ||
//           source?.paymentReleasedAt ||
//           source?.releasePaymentAt ||
//           source?.updatedAt ||
//           null,
//       },
//     ];
//   }

//   return [];
// }

// function getTotalReleasedAmount(source: any) {
//   return roundMoney(
//     getPaymentReleaseHistory(source).reduce(
//       (sum, entry) =>
//         sum + getPaymentReleaseAmount(entry),
//       0,
//     ),
//   );
// }

// function getApprovedAmountFromRecord(
//   source: any,
//   fallback = 0,
// ) {
//   return roundMoney(
//     source?.approvedAmount ??
//       source?.totalApprovedAmount ??
//       source?.approvedTotal ??
//       source?.totalAmount ??
//       source?.amount ??
//       fallback,
//   );
// }

// function getRemainingReleaseAmount(
//   source: any,
//   fallbackApproved = 0,
// ) {
//   const approvedAmount =
//     getApprovedAmountFromRecord(
//       source,
//       fallbackApproved,
//     );

//   const releasedAmount =
//     getTotalReleasedAmount(source);

//   return roundMoney(
//     Math.max(
//       approvedAmount - releasedAmount,
//       0,
//     ),
//   );
// }

// function getReleaseDateLabel(value: any) {
//   if (!value) return "-";

//   let date: Date | null = null;

//   if (value instanceof Date) {
//     date = value;
//   } else if (
//     typeof value?.toDate === "function"
//   ) {
//     date = value.toDate();
//   } else if (
//     typeof value?.seconds === "number"
//   ) {
//     date = new Date(value.seconds * 1000);
//   } else {
//     date = new Date(value);
//   }

//   if (
//     !date ||
//     Number.isNaN(date.getTime())
//   ) {
//     return "-";
//   }

//   return date.toLocaleString("en-PK", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// }

// function getPaymentMethodLabel(
//   method?: string,
// ) {
//   switch (method) {
//     case "cash":
//       return "Cash";

//     case "cheque":
//       return "Cheque";

//     case "bank_transfer":
//       return "Bank Transfer";

//     case "wire":
//       return "Online Transfer";

//     default:
//       return "Not Selected";
//   }
// }

// function getFileSizeLabel(bytes: number) {
//   if (!bytes) return "0 KB";

//   const kb = bytes / 1024;

//   if (kb < 1024) {
//     return `${kb.toFixed(1)} KB`;
//   }

//   return `${(kb / 1024).toFixed(1)} MB`;
// }

// /**
//  * Stores the workflow status before the first payment release.
//  *
//  * This value is used by the Payment History editor if payments are later
//  * corrected or removed. It prevents payment-history changes from affecting
//  * the Admin/Finance approval workflow.
//  */
// function getPaymentWorkflowBaseStatus(
//   sourceRecord: any,
// ) {
//   const existingBaseStatus = String(
//     sourceRecord?.paymentWorkflowBaseStatus ||
//       "",
//   ).trim();

//   if (existingBaseStatus) {
//     return existingBaseStatus;
//   }

//   const currentStatus = normalizeText(
//     sourceRecord?.status,
//   );

//   if (
//     currentStatus &&
//     ![
//       "payment_released",
//       "payment_partially_released",
//     ].includes(currentStatus)
//   ) {
//     return String(sourceRecord.status);
//   }

//   const hasPurchaseOrder = Boolean(
//     sourceRecord?.poId ||
//       sourceRecord?.poNumber ||
//       sourceRecord?.poDocId ||
//       sourceRecord?.purchaseOrderId ||
//       sourceRecord?.purchaseOrderNumber ||
//       sourceRecord?.poCreated ||
//       sourceRecord?.poSubmitted ||
//       sourceRecord?.purchaseOrderCreated ||
//       sourceRecord?.purchaseOrderSubmitted,
//   );

//   if (hasPurchaseOrder) {
//     return "ready_for_payment";
//   }

//   return "approved";
// }

// function getPaymentWorkflowBasePaymentStatus(
//   sourceRecord: any,
// ) {
//   const existingBaseStatus = String(
//     sourceRecord?.paymentWorkflowBasePaymentStatus ||
//       "",
//   ).trim();

//   if (existingBaseStatus) {
//     return existingBaseStatus;
//   }

//   const currentPaymentStatus =
//     normalizeText(
//       sourceRecord?.paymentStatus ||
//         sourceRecord?.releasePaymentStatus,
//     );

//   if (
//     currentPaymentStatus &&
//     ![
//       "released",
//       "partial",
//       "payment_released",
//       "payment_partially_released",
//     ].includes(currentPaymentStatus)
//   ) {
//     return String(
//       sourceRecord?.paymentStatus ||
//         sourceRecord?.releasePaymentStatus ||
//         "",
//     );
//   }

//   return "";
// }

// export default function PaymentReleaseModal<
//   T = any,
// >({
//   isOpen,
//   onClose,
//   onSuccess,
//   title = "Release Payment",
//   invoice = null,

//   context = null,
//   docPath,
//   buildUpdateData,

//   amount,
//   amountLabel,
//   partyLabel,
//   parties,

//   accounts = [],
//   allowCheque = true,
//   allowReceiptUpload = true,
//   initialPaymentMethod,
//   amountReadOnly,
// }: PaymentReleaseModalProps<T>) {
//   const { userProfile, currentUser } =
//     useAuth();

//   const { toast } = useToast();

//   const [loading, setLoading] =
//     useState(false);

//   const [
//     accountsLoading,
//     setAccountsLoading,
//   ] = useState(false);

//   const [
//     receiptFiles,
//     setReceiptFiles,
//   ] = useState<File[]>([]);

//   const [
//     selectedAccount,
//     setSelectedAccount,
//   ] = useState<PaymentAccount | null>(
//     null,
//   );

//   const [
//     storedAccounts,
//     setStoredAccounts,
//   ] = useState<PaymentAccount[]>([]);

//   const [
//     existingChequeNumbers,
//     setExistingChequeNumbers,
//   ] = useState<Set<string>>(
//     () => new Set(),
//   );

//   const [
//     chequeValidationLoading,
//     setChequeValidationLoading,
//   ] = useState(false);

//   const approvedInvoiceItems =
//     useMemo(() => {
//       const items = Array.isArray(
//         (invoice as any)?.lineItems,
//       )
//         ? (invoice as any).lineItems
//         : [];

//       return items.filter(
//         (item: any) =>
//           item?.status === "approved",
//       );
//     }, [invoice]);

//   const approvedLineItemsAmount =
//     useMemo(() => {
//       return roundMoney(
//         approvedInvoiceItems.reduce(
//           (sum: number, item: any) => {
//             const qty = Number(
//               item?.units || 0,
//             );

//             const rate = Number(
//               item?.unitRate || 0,
//             );

//             const tax = Number(
//               item?.tax || 0,
//             );

//             const total = Number(
//               item?.total ??
//                 qty * rate + tax,
//             );

//             return sum + total;
//           },
//           0,
//         ),
//       );
//     }, [approvedInvoiceItems]);

//   const invoiceApprovedAmount =
//     useMemo(() => {
//       return getApprovedAmountFromRecord(
//         invoice,
//         approvedLineItemsAmount,
//       );
//     }, [
//       invoice,
//       approvedLineItemsAmount,
//     ]);

//   const paymentReleaseHistory =
//     useMemo(() => {
//       return getPaymentReleaseHistory(
//         invoice,
//       );
//     }, [invoice]);

//   const totalReleasedAmount =
//     useMemo(() => {
//       return getTotalReleasedAmount(
//         invoice,
//       );
//     }, [invoice]);

//   const remainingReleaseAmount =
//     useMemo(() => {
//       return getRemainingReleaseAmount(
//         invoice,
//         invoiceApprovedAmount,
//       );
//     }, [
//       invoice,
//       invoiceApprovedAmount,
//     ]);

//   const invoiceApprovedVendors =
//     useMemo(() => {
//       const vendors = [
//         ...new Set(
//           approvedInvoiceItems
//             .map((item: any) =>
//               String(
//                 item?.vendor ||
//                   item?.vendorName ||
//                   item?.supplier ||
//                   item?.supplierName ||
//                   "",
//               ).trim(),
//             )
//             .filter(Boolean),
//         ),
//       ] as string[];

//       if (vendors.length > 0) {
//         return vendors;
//       }

//       const fallbackVendor = String(
//         (invoice as any)?.vendorName ||
//           (invoice as any)?.supplierName ||
//           (invoice as any)?.clientName ||
//           (invoice as any)?.partyName ||
//           "",
//       ).trim();

//       return fallbackVendor
//         ? [fallbackVendor]
//         : [];
//     }, [
//       approvedInvoiceItems,
//       invoice,
//     ]);

//   const resolvedContext = (
//     context ??
//     invoice ??
//     null
//   ) as T | InvoiceRequest | null;

//   const resolvedDocPath =
//     useMemo(() => {
//       if (
//         docPath &&
//         resolvedContext
//       ) {
//         return typeof docPath === "function"
//           ? docPath(resolvedContext as T)
//           : docPath;
//       }

//       if ((invoice as any)?.id) {
//         return [
//           "Panels",
//           PANEL_ID,
//           "invoiceRequests",
//           (invoice as any).id,
//         ];
//       }

//       return [];
//     }, [
//       docPath,
//       resolvedContext,
//       invoice,
//     ]);

//   const resolvedAmount =
//     amount ??
//     (invoice
//       ? remainingReleaseAmount
//       : 0);

//   const resolvedParties =
//     parties ??
//     (invoice
//       ? invoiceApprovedVendors
//       : []);

//   const resolvedAmountLabel =
//     amountLabel ??
//     (invoice
//       ? "Remaining Balance"
//       : "Amount");

//   const resolvedPartyLabel =
//     partyLabel ??
//     (invoice
//       ? "Approved Vendors"
//       : "Payee");

//   const resolvedInitialPaymentMethod =
//     initialPaymentMethod ??
//     (invoice
//       ? "bank_transfer"
//       : "cash");

//   const resolvedAmountReadOnly =
//     amountReadOnly ?? false;

//   const resolvedAccounts =
//     useMemo(() => {
//       const map = new Map<
//         string,
//         PaymentAccount
//       >();

//       [
//         ...storedAccounts,
//         ...accounts,
//       ].forEach((account) => {
//         if (!account?.id) return;

//         map.set(account.id, account);
//       });

//       return Array.from(
//         map.values(),
//       ).filter(
//         (account) =>
//           account.isActive !== false,
//       );
//     }, [
//       storedAccounts,
//       accounts,
//     ]);

//   const defaultInvoiceBuildUpdateData = (
//     args: PaymentReleaseSubmitArgs<InvoiceRequest>,
//   ) => {
//     const {
//       formData,
//       receiptUrl,
//       selectedAccount,
//       actor,
//     } = args;

//     const sourceRecord = (
//       (args as any).context ||
//       invoice ||
//       {}
//     ) as any;

//     const extendedFormData =
//       formData as ExtendedPaymentReleaseFormValues;

//     const releaseAmount =
//       roundMoney(
//         extendedFormData.amount,
//       );

//     const approvedAmount =
//       getApprovedAmountFromRecord(
//         sourceRecord,
//         invoiceApprovedAmount ||
//           releaseAmount,
//       );

//     const existingHistory =
//       getPaymentReleaseHistory(
//         sourceRecord,
//       );

//     const releasedBefore =
//       roundMoney(
//         existingHistory.reduce(
//           (sum, entry) =>
//             sum +
//             getPaymentReleaseAmount(
//               entry,
//             ),
//           0,
//         ),
//       );

//     const releasedAfter =
//       roundMoney(
//         releasedBefore +
//           releaseAmount,
//       );

//     const remainingAfter =
//       roundMoney(
//         Math.max(
//           approvedAmount -
//             releasedAfter,
//           0,
//         ),
//       );

//     const isFullyReleased =
//       approvedAmount > 0 &&
//       remainingAfter <= 0.009;

//     const chequeNumbers =
//       cleanChequeNumbers(
//         extendedFormData
//           .chequeNumbers?.length
//           ? extendedFormData.chequeNumbers
//           : [
//               extendedFormData.chequeNumber ||
//                 "",
//             ],
//       );

//     const receiptUrls =
//       Array.isArray(
//         (args as any).receiptUrls,
//       )
//         ? (args as any).receiptUrls
//         : receiptUrl
//           ? [receiptUrl]
//           : [];

//     const paymentWorkflowBaseStatus =
//       getPaymentWorkflowBaseStatus(
//         sourceRecord,
//       );

//     const paymentWorkflowBasePaymentStatus =
//       getPaymentWorkflowBasePaymentStatus(
//         sourceRecord,
//       );

//     const releaseEntry: any = {
//       id: `${Date.now()}-${Math.random()
//         .toString(36)
//         .slice(2, 8)}`,

//       releaseType:
//         releasedBefore <= 0
//           ? isFullyReleased
//             ? "full"
//             : "advance"
//           : isFullyReleased
//             ? "final"
//             : "partial",

//       paymentMethod:
//         extendedFormData.paymentMethod,

//       amount: releaseAmount,
//       approvedAmount,
//       releasedBefore,
//       releasedAfter,
//       remainingAfter,

//       vendors:
//         invoiceApprovedVendors,

//       transactionName:
//         extendedFormData.transactionName?.trim() ||
//         "",

//       transactionReference:
//         extendedFormData.transactionReference,

//       bankReceiptUrl:
//         receiptUrls[0] ||
//         receiptUrl ||
//         "",

//       bankReceiptUrls: receiptUrls,

//       paymentNotes:
//         extendedFormData.paymentNotes,

//       releasedBy:
//         actor.profileId ||
//         actor.uid ||
//         "",

//       releasedByName:
//         actor.displayName ||
//         actor.email ||
//         "Unknown",

//       releasedByEmail:
//         actor.email || "",

//       releasedAt: new Date(),

//       paymentWorkflowBaseStatus,
//       paymentWorkflowBasePaymentStatus,
//     };

//     if (chequeNumbers.length > 0) {
//       releaseEntry.chequeNumber =
//         chequeNumbers[0];

//       releaseEntry.chequeNumbers =
//         chequeNumbers;
//     }

//     if (selectedAccount) {
//       releaseEntry.selectedAccount =
//         selectedAccount;

//       releaseEntry.selectedAccountId =
//         selectedAccount.id || "";

//       releaseEntry.selectedAccountName =
//         selectedAccount.accountName ||
//         "";
//     }

//     const updateData: Record<
//       string,
//       any
//     > = {
//       status: isFullyReleased
//         ? "payment_released"
//         : "payment_partially_released",

//       paymentStatus: isFullyReleased
//         ? "released"
//         : "partial",

//       paymentWorkflowBaseStatus,
//       paymentWorkflowBasePaymentStatus,

//       paymentReleased:
//         isFullyReleased,

//       paymentPartiallyReleased:
//         !isFullyReleased,

//       releasePaymentCreated: true,

//       totalApprovedAmount:
//         approvedAmount,

//       totalReleasedAmount:
//         releasedAfter,

//       remainingReleaseAmount:
//         remainingAfter,

//       transactionName:
//         extendedFormData.transactionName?.trim() ||
//         "",

//       latestTransactionName:
//         extendedFormData.transactionName?.trim() ||
//         "",

//       latestPaymentRelease:
//         releaseEntry,

//       paymentDetails: releaseEntry,

//       paymentReleaseHistory: [
//         ...existingHistory,
//         releaseEntry,
//       ],

//       updatedAt: serverTimestamp(),
//     };

//     if (isFullyReleased) {
//       updateData.paymentReleasedAt =
//         serverTimestamp();

//       updateData.releasePaymentAt =
//         serverTimestamp();

//       updateData.paymentFullyReleasedAt =
//         serverTimestamp();
//     } else {
//       updateData.partialPaymentReleasedAt =
//         serverTimestamp();
//     }

//     return updateData;
//   };

//   const [formData, setFormData] =
//     useState<ExtendedPaymentReleaseFormValues>(
//       {
//         paymentMethod:
//           resolvedInitialPaymentMethod,

//         selectedAccountId: "",

//         amount: String(
//           resolvedAmount || 0,
//         ),

//         transactionName: "",

//         chequeNumber: "",

//         chequeNumbers: [""],

//         transactionReference: "",

//         paymentNotes: "",
//       },
//     );

//   useEffect(() => {
//     if (!isOpen) return;

//     setFormData({
//       paymentMethod:
//         resolvedInitialPaymentMethod,

//       selectedAccountId: "",

//       amount: String(
//         resolvedAmount || 0,
//       ),

//       transactionName: "",

//       chequeNumber: "",

//       chequeNumbers: [""],

//       transactionReference: "",

//       paymentNotes: "",
//     });

//     setSelectedAccount(null);
//     setReceiptFiles([]);
//   }, [
//     isOpen,
//     resolvedAmount,
//     resolvedInitialPaymentMethod,
//   ]);

//   useEffect(() => {
//     let mounted = true;

//     async function loadAccounts() {
//       try {
//         setAccountsLoading(true);

//         const rows =
//           await fetchPaymentAccounts();

//         if (mounted) {
//           setStoredAccounts(rows);
//         }
//       } catch (error) {
//         console.error(
//           "Failed to load payment accounts:",
//           error,
//         );

//         if (mounted) {
//           toast({
//             title: "Error",
//             description:
//               "Failed to load payment accounts",
//             variant: "destructive",
//           });
//         }
//       } finally {
//         if (mounted) {
//           setAccountsLoading(false);
//         }
//       }
//     }

//     if (isOpen) {
//       loadAccounts();
//     }

//     return () => {
//       mounted = false;
//     };
//   }, [isOpen, toast]);

//   useEffect(() => {
//     if (!isOpen) return;

//     let mounted = true;

//     async function loadExistingChequeNumbers() {
//       try {
//         setChequeValidationLoading(true);

//         const snapshots =
//           await Promise.all([
//             getDocs(
//               collection(
//                 db,
//                 "Panels",
//                 PANEL_ID,
//                 "invoiceRequests",
//               ),
//             ),

//             getDocs(
//               collection(
//                 db,
//                 "Panels",
//                 PANEL_ID,
//                 "Record",
//               ),
//             ),

//             getDocs(
//               collection(
//                 db,
//                 "Panels",
//                 PANEL_ID,
//                 "payments",
//               ),
//             ),
//           ]);

//         const chequeSet =
//           new Set<string>();

//         snapshots.forEach(
//           (snapshot) => {
//             snapshot.docs.forEach(
//               (documentSnapshot) => {
//                 const source = {
//                   id: documentSnapshot.id,
//                   ...documentSnapshot.data(),
//                 };

//                 collectChequeNumbersFromSource(
//                   source,
//                 ).forEach(
//                   (chequeNumber) => {
//                     const normalized =
//                       normalizeChequeNumber(
//                         chequeNumber,
//                       );

//                     if (normalized) {
//                       chequeSet.add(
//                         normalized,
//                       );
//                     }
//                   },
//                 );
//               },
//             );
//           },
//         );

//         if (mounted) {
//           setExistingChequeNumbers(
//             chequeSet,
//           );
//         }
//       } catch (error) {
//         console.error(
//           "Failed to validate existing cheque numbers:",
//           error,
//         );

//         if (mounted) {
//           toast({
//             title: "Warning",
//             description:
//               "Cheque number validation could not be completed. Please try again.",
//             variant: "destructive",
//           });
//         }
//       } finally {
//         if (mounted) {
//           setChequeValidationLoading(
//             false,
//           );
//         }
//       }
//     }

//     loadExistingChequeNumbers();

//     return () => {
//       mounted = false;
//     };
//   }, [isOpen, toast]);

//   const duplicateChequeNumbers =
//     useMemo(() => {
//       return getDuplicateChequeNumbers(
//         formData.chequeNumbers,
//         existingChequeNumbers,
//       );
//     }, [
//       formData.chequeNumbers,
//       existingChequeNumbers,
//     ]);

//   const hasDuplicateChequeNumbers =
//     duplicateChequeNumbers.length > 0;

//   const getChequeNumberWarning = (
//     chequeNumber: string,
//     index: number,
//   ) => {
//     const normalized =
//       normalizeChequeNumber(
//         chequeNumber,
//       );

//     if (!normalized) return "";

//     if (
//       existingChequeNumbers.has(
//         normalized,
//       )
//     ) {
//       return "This cheque number already exists.";
//     }

//     const appearsInCurrentForm =
//       formData.chequeNumbers.some(
//         (
//           currentChequeNumber,
//           chequeIndex,
//         ) =>
//           chequeIndex !== index &&
//           normalizeChequeNumber(
//             currentChequeNumber,
//           ) === normalized,
//       );

//     return appearsInCurrentForm
//       ? "This cheque number is already added in this release."
//       : "";
//   };

//   const submitDisabled = loading;

//   const handleChequeNumberChange = (
//     index: number,
//     value: string,
//   ) => {
//     setFormData((previous) => {
//       const updatedChequeNumbers = [
//         ...previous.chequeNumbers,
//       ];

//       updatedChequeNumbers[index] =
//         value;

//       return {
//         ...previous,
//         chequeNumbers:
//           updatedChequeNumbers,
//         chequeNumber:
//           updatedChequeNumbers[0] ||
//           "",
//       };
//     });
//   };

//   const handleAddChequeNumber = () => {
//     setFormData((previous) => ({
//       ...previous,
//       chequeNumbers: [
//         ...previous.chequeNumbers,
//         "",
//       ],
//     }));
//   };

//   const handleRemoveChequeNumber = (
//     index: number,
//   ) => {
//     setFormData((previous) => {
//       const updatedChequeNumbers =
//         previous.chequeNumbers.filter(
//           (_, chequeIndex) =>
//             chequeIndex !== index,
//         );

//       const safeChequeNumbers =
//         updatedChequeNumbers.length > 0
//           ? updatedChequeNumbers
//           : [""];

//       return {
//         ...previous,
//         chequeNumbers:
//           safeChequeNumbers,
//         chequeNumber:
//           safeChequeNumbers[0] || "",
//       };
//     });
//   };

//   const handleReceiptFilesChange = (
//     event: ChangeEvent<HTMLInputElement>,
//   ) => {
//     const files = Array.from(
//       event.target.files || [],
//     );

//     setReceiptFiles(files);
//   };

//   const handleRemoveReceiptFile = (
//     index: number,
//   ) => {
//     setReceiptFiles((previous) =>
//       previous.filter(
//         (_, fileIndex) =>
//           fileIndex !== index,
//       ),
//     );
//   };

//   async function handleSubmit(
//     event: FormEvent<HTMLFormElement>,
//   ) {
//     event.preventDefault();

//     if (!resolvedContext) {
//       toast({
//         title: "Error",
//         description:
//           "No record selected",
//         variant: "destructive",
//       });

//       return;
//     }

//     if (
//       resolvedDocPath.length === 0
//     ) {
//       toast({
//         title: "Error",
//         description:
//           "Invalid payment record path",
//         variant: "destructive",
//       });

//       return;
//     }

//     if (!formData.paymentMethod) {
//       toast({
//         title: "Error",
//         description:
//           "Please select a payment method",
//         variant: "destructive",
//       });

//       return;
//     }

//     const requestedReleaseAmount =
//       roundMoney(formData.amount);

//     if (
//       !formData.amount ||
//       requestedReleaseAmount <= 0
//     ) {
//       toast({
//         title: "Error",
//         description:
//           "Please enter a valid amount",
//         variant: "destructive",
//       });

//       return;
//     }

//     if (
//       invoice &&
//       requestedReleaseAmount >
//         remainingReleaseAmount +
//           0.009
//     ) {
//       toast({
//         title: "Error",
//         description: `Release amount cannot exceed the remaining balance of Rs ${formatPKR(
//           remainingReleaseAmount,
//         )}.`,
//         variant: "destructive",
//       });

//       return;
//     }

//     const normalizedChequeNumbers =
//       cleanChequeNumbers(
//         formData.chequeNumbers,
//       );

//     if (
//       formData.paymentMethod ===
//       "cheque"
//     ) {
//       if (!formData.selectedAccountId) {
//         toast({
//           title: "Error",
//           description:
//             "Please select an account",
//           variant: "destructive",
//         });

//         return;
//       }

//       if (
//         normalizedChequeNumbers.length ===
//         0
//       ) {
//         toast({
//           title: "Error",
//           description:
//             "Please enter at least one cheque number",
//           variant: "destructive",
//         });

//         return;
//       }

//       const duplicateCheques =
//         getDuplicateChequeNumbers(
//           normalizedChequeNumbers,
//           existingChequeNumbers,
//         );

//       if (
//         duplicateCheques.length > 0
//       ) {
//         toast({
//           title: "Warning",
//           description: `This cheque number already exists: ${duplicateCheques.join(
//             ", ",
//           )}. Payment will still be saved.`,
//         });
//       }
//     }

//     const normalizedFormData: ExtendedPaymentReleaseFormValues =
//       {
//         ...formData,

//         transactionName:
//           formData.transactionName.trim(),

//         chequeNumber:
//           normalizedChequeNumbers[0] ||
//           "",

//         chequeNumbers:
//           normalizedChequeNumbers,
//       };

//     try {
//       setLoading(true);

//       await releasePayment({
//         docPath: resolvedDocPath,

//         context:
//           resolvedContext as any,

//         formData:
//           normalizedFormData as any,

//         // Existing support for the first receipt file.
//         receiptFile:
//           receiptFiles[0] || null,

//         // Multiple receipt file support.
//         receiptFiles,

//         selectedAccount,

//         actor: {
//           uid: currentUser?.uid,

//           email:
//             currentUser?.email,

//           displayName:
//             userProfile?.displayName ||
//             currentUser?.displayName ||
//             currentUser?.email,

//           profileId:
//             userProfile?.id,
//         },

//         buildUpdateData: (
//           buildUpdateData ||
//           defaultInvoiceBuildUpdateData
//         ) as any,
//       } as any);

//       toast({
//         title: "Success",
//         description:
//           "Payment released successfully",
//       });

//       onSuccess();
//       onClose();
//     } catch (error: any) {
//       console.error(
//         "Failed to release payment:",
//         error,
//       );

//       toast({
//         title: "Error",
//         description:
//           error?.message ||
//           "Failed to release payment",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   }

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 min-h-screen overflow-y-auto bg-slate-50">
//       <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
//         <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
//           <div className="flex items-start gap-4">
//             <Button
//               type="button"
//               variant="outline"
//               size="icon"
//               className="mt-1 h-10 w-10 rounded-full border-slate-200 bg-white shadow-sm hover:bg-slate-50"
//               onClick={onClose}
//               disabled={loading}
//             >
//               <ArrowLeft className="h-4 w-4" />
//             </Button>

//             <div>
//               <div className="flex flex-wrap items-center gap-2">
//                 <h1 className="text-2xl font-bold tracking-tight text-slate-950">
//                   {title}
//                 </h1>

//                 <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
//                   Payment Release
//                 </span>
//               </div>

//               <p className="mt-1 max-w-2xl text-sm text-slate-500">
//                 Review payment information,
//                 select the payment method,
//                 attach receipts, and release
//                 the remaining amount.
//               </p>
//             </div>
//           </div>

//           <div className="flex flex-wrap gap-2">
//             <Button
//               type="button"
//               variant="outline"
//               className="rounded-full border-slate-200 px-5"
//               onClick={onClose}
//               disabled={loading}
//             >
//               Cancel
//             </Button>

//             <Button
//               type="submit"
//               form="payment-release-form"
//               disabled={submitDisabled}
//               className="rounded-full bg-slate-950 px-6 text-white shadow-sm hover:bg-slate-800"
//             >
//               {loading ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Releasing...
//                 </>
//               ) : (
//                 <>
//                   <CheckCircle2 className="mr-2 h-4 w-4" />
//                   Release Payment
//                 </>
//               )}
//             </Button>
//           </div>
//         </div>
//       </div>

//       <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
//         <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
//           <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//             <div className="flex items-center justify-between gap-4">
//               <div>
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                   {invoice
//                     ? "Total Approved Amount"
//                     : resolvedAmountLabel}
//                 </p>

//                 <p className="mt-2 text-2xl font-bold text-slate-950">
//                   Rs{" "}
//                   {formatPKR(
//                     invoice
//                       ? invoiceApprovedAmount
//                       : resolvedAmount,
//                   )}
//                 </p>
//               </div>

//               <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
//                 <Wallet className="h-5 w-5" />
//               </div>
//             </div>
//           </div>

//           <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//             <div className="flex items-center justify-between gap-4">
//               <div>
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                   Released So Far
//                 </p>

//                 <p className="mt-2 text-2xl font-bold text-slate-950">
//                   Rs{" "}
//                   {formatPKR(
//                     invoice
//                       ? totalReleasedAmount
//                       : 0,
//                   )}
//                 </p>
//               </div>

//               <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
//                 <CheckCircle2 className="h-5 w-5" />
//               </div>
//             </div>
//           </div>

//           <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//             <div className="flex items-center justify-between gap-4">
//               <div>
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                   Remaining Balance
//                 </p>

//                 <p className="mt-2 text-2xl font-bold text-slate-950">
//                   Rs{" "}
//                   {formatPKR(
//                     invoice
//                       ? remainingReleaseAmount
//                       : resolvedAmount,
//                   )}
//                 </p>
//               </div>

//               <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
//                 <Banknote className="h-5 w-5" />
//               </div>
//             </div>
//           </div>

//           <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//             <div className="flex items-center justify-between gap-4">
//               <div>
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                   Payment Method
//                 </p>

//                 <p className="mt-2 text-sm font-semibold text-slate-950">
//                   {getPaymentMethodLabel(
//                     formData.paymentMethod,
//                   )}
//                 </p>
//               </div>

//               <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
//                 <CreditCard className="h-5 w-5" />
//               </div>
//             </div>
//           </div>
//         </div>

//         {invoice &&
//           invoiceApprovedAmount > 0 && (
//             <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//               <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
//                 <div>
//                   <p className="text-sm font-semibold text-slate-950">
//                     Payment Release Progress
//                   </p>

//                   <p className="mt-1 text-xs text-slate-500">
//                     Rs{" "}
//                     {formatPKR(
//                       totalReleasedAmount,
//                     )}{" "}
//                     released from Rs{" "}
//                     {formatPKR(
//                       invoiceApprovedAmount,
//                     )}
//                     .
//                   </p>
//                 </div>

//                 <p className="text-sm font-semibold text-slate-950">
//                   {Math.min(
//                     100,
//                     Math.round(
//                       (totalReleasedAmount /
//                         invoiceApprovedAmount) *
//                         100,
//                     ),
//                   )}
//                   %
//                 </p>
//               </div>

//               <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
//                 <div
//                   className="h-full rounded-full bg-slate-950 transition-all"
//                   style={{
//                     width: `${Math.min(
//                       100,
//                       Math.max(
//                         0,
//                         (totalReleasedAmount /
//                           invoiceApprovedAmount) *
//                           100,
//                       ),
//                     )}%`,
//                   }}
//                 />
//               </div>
//             </div>
//           )}

//         <form
//           id="payment-release-form"
//           onSubmit={handleSubmit}
//           className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]"
//         >
//           <div className="space-y-6">
//             <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
//               <div className="mb-6 flex items-start gap-3">
//                 <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
//                   <Banknote className="h-5 w-5" />
//                 </div>

//                 <div>
//                   <h2 className="text-lg font-semibold text-slate-950">
//                     Payment Information
//                   </h2>

//                   <p className="mt-1 text-sm text-slate-500">
//                     Enter the release amount
//                     and payment method details.
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
//                 <div className="space-y-2">
//                   <Label
//                     htmlFor="amount"
//                     className="text-sm text-slate-700"
//                   >
//                     Release Amount
//                   </Label>

//                   <Input
//                     id="amount"
//                     type="number"
//                     min="0"
//                     step="0.01"
//                     max={
//                       invoice
//                         ? remainingReleaseAmount
//                         : undefined
//                     }
//                     value={formData.amount}
//                     readOnly={
//                       resolvedAmountReadOnly
//                     }
//                     className={`h-11 rounded-2xl border-slate-200 ${
//                       resolvedAmountReadOnly
//                         ? "bg-slate-100"
//                         : "bg-white"
//                     }`}
//                     onChange={(event) =>
//                       setFormData(
//                         (previous) => ({
//                           ...previous,
//                           amount:
//                             event.target
//                               .value,
//                         }),
//                       )
//                     }
//                   />

//                   {invoice && (
//                     <p className="text-xs text-slate-500">
//                       You can release any
//                       amount up to Rs{" "}
//                       {formatPKR(
//                         remainingReleaseAmount,
//                       )}
//                       .
//                     </p>
//                   )}
//                 </div>

//                 <div className="space-y-2">
//                   <Label
//                     htmlFor="paymentMethod"
//                     className="text-sm text-slate-700"
//                   >
//                     Payment Method
//                   </Label>

//                   <Select
//                     value={
//                       formData.paymentMethod
//                     }
//                     onValueChange={(
//                       value: any,
//                     ) =>
//                       setFormData(
//                         (previous) => ({
//                           ...previous,

//                           paymentMethod:
//                             value,

//                           selectedAccountId:
//                             value ===
//                             "cheque"
//                               ? previous.selectedAccountId
//                               : "",

//                           chequeNumbers:
//                             value ===
//                               "cheque" &&
//                             previous
//                               .chequeNumbers
//                               .length === 0
//                               ? [""]
//                               : previous.chequeNumbers,
//                         }),
//                       )
//                     }
//                   >
//                     <SelectTrigger className="h-11 rounded-2xl border-slate-200">
//                       <SelectValue placeholder="Select payment method" />
//                     </SelectTrigger>

//                     <SelectContent>
//                       <SelectItem value="cash">
//                         Cash
//                       </SelectItem>

//                       <SelectItem value="bank_transfer">
//                         Bank Transfer
//                       </SelectItem>

//                       <SelectItem value="wire">
//                         Online Transfer
//                       </SelectItem>

//                       {allowCheque && (
//                         <SelectItem value="cheque">
//                           Cheque
//                         </SelectItem>
//                       )}
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>
//             </section>

//             {formData.paymentMethod ===
//               "cheque" &&
//               allowCheque && (
//                 <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
//                   <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
//                     <div>
//                       <h2 className="text-lg font-semibold text-slate-950">
//                         Cheque Details
//                       </h2>

//                       <p className="mt-1 text-sm text-slate-500">
//                         Select the account
//                         and add one or more
//                         cheque numbers.
//                       </p>
//                     </div>

//                     <Button
//                       type="button"
//                       variant="outline"
//                       size="sm"
//                       className="rounded-full border-slate-200"
//                       onClick={
//                         handleAddChequeNumber
//                       }
//                     >
//                       <Plus className="mr-2 h-4 w-4" />
//                       Add Cheque
//                     </Button>
//                   </div>

//                   <div className="space-y-5">
//                     <div className="space-y-2">
//                       <Label
//                         htmlFor="account"
//                         className="text-sm text-slate-700"
//                       >
//                         Select Account
//                       </Label>

//                       <Select
//                         value={
//                           formData.selectedAccountId
//                         }
//                         onValueChange={(
//                           value,
//                         ) => {
//                           const account =
//                             resolvedAccounts.find(
//                               (
//                                 currentAccount,
//                               ) =>
//                                 currentAccount.id ===
//                                 value,
//                             ) ||
//                             null;

//                           setSelectedAccount(
//                             account,
//                           );

//                           setFormData(
//                             (previous) => ({
//                               ...previous,
//                               selectedAccountId:
//                                 value,
//                             }),
//                           );
//                         }}
//                       >
//                         <SelectTrigger className="h-11 rounded-2xl border-slate-200">
//                           <SelectValue
//                             placeholder={
//                               accountsLoading
//                                 ? "Loading accounts..."
//                                 : "Select account"
//                             }
//                           />
//                         </SelectTrigger>

//                         <SelectContent>
//                           {resolvedAccounts.length ===
//                           0 ? (
//                             <SelectItem
//                               value="__no_accounts__"
//                               disabled
//                             >
//                               No active accounts
//                               found
//                             </SelectItem>
//                           ) : (
//                             resolvedAccounts.map(
//                               (
//                                 account,
//                               ) => (
//                                 <SelectItem
//                                   key={
//                                     account.id
//                                   }
//                                   value={
//                                     account.id
//                                   }
//                                 >
//                                   {account.accountName ||
//                                     account.id}
//                                 </SelectItem>
//                               ),
//                             )
//                           )}
//                         </SelectContent>
//                       </Select>
//                     </div>

//                     {selectedAccount && (
//                       <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
//                         <h3 className="mb-4 text-sm font-semibold text-slate-950">
//                           Account Information
//                         </h3>

//                         <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
//                           <div>
//                             <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                               Account Name
//                             </p>

//                             <p className="mt-1 font-semibold text-slate-900">
//                               {selectedAccount.accountName ||
//                                 "-"}
//                             </p>
//                           </div>

//                           <div>
//                             <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                               Account Number
//                             </p>

//                             <p className="mt-1 font-semibold text-slate-900">
//                               {selectedAccount.accountNumber ||
//                                 "-"}
//                             </p>
//                           </div>

//                           <div>
//                             <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                               Bank
//                             </p>

//                             <p className="mt-1 font-semibold text-slate-900">
//                               {selectedAccount.bankName ||
//                                 "-"}
//                             </p>
//                           </div>

//                           <div>
//                             <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                               Balance
//                             </p>

//                             <p className="mt-1 font-semibold text-slate-900">
//                               Rs{" "}
//                               {formatPKR(
//                                 selectedAccount.currentBalance ??
//                                   selectedAccount.balance ??
//                                   0,
//                               )}
//                             </p>
//                           </div>
//                         </div>
//                       </div>
//                     )}

//                     <div className="space-y-3">
//                       <Label className="text-sm text-slate-700">
//                         Cheque Numbers
//                       </Label>

//                       {formData.chequeNumbers.map(
//                         (
//                           chequeNumber,
//                           index,
//                         ) => {
//                           const warning =
//                             getChequeNumberWarning(
//                               chequeNumber,
//                               index,
//                             );

//                           return (
//                             <div
//                               key={
//                                 index
//                               }
//                               className="flex flex-col gap-2 sm:flex-row sm:items-start"
//                             >
//                               <div className="flex-1">
//                                 <Input
//                                   value={
//                                     chequeNumber
//                                   }
//                                   onChange={(
//                                     event,
//                                   ) =>
//                                     handleChequeNumberChange(
//                                       index,
//                                       event
//                                         .target
//                                         .value,
//                                     )
//                                   }
//                                   placeholder={`Enter cheque number ${
//                                     index +
//                                     1
//                                   }`}
//                                   className={`h-11 rounded-2xl ${
//                                     warning
//                                       ? "border-amber-400 bg-amber-50"
//                                       : "border-slate-200"
//                                   }`}
//                                 />

//                                 {warning && (
//                                   <p className="mt-1 text-xs font-medium text-amber-700">
//                                     {
//                                       warning
//                                     }
//                                   </p>
//                                 )}
//                               </div>

//                               <Button
//                                 type="button"
//                                 variant="outline"
//                                 size="icon"
//                                 className="h-11 w-11 shrink-0 rounded-2xl border-slate-200 text-red-600 hover:bg-red-50 hover:text-red-700"
//                                 onClick={() =>
//                                   handleRemoveChequeNumber(
//                                     index,
//                                   )
//                                 }
//                                 disabled={
//                                   formData
//                                     .chequeNumbers
//                                     .length ===
//                                   1
//                                 }
//                               >
//                                 <Trash2 className="h-4 w-4" />
//                               </Button>
//                             </div>
//                           );
//                         },
//                       )}

//                       {chequeValidationLoading && (
//                         <p className="text-xs text-slate-500">
//                           Checking existing
//                           cheque numbers...
//                         </p>
//                       )}

//                       {hasDuplicateChequeNumbers && (
//                         <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
//                           This cheque number
//                           already exists:{" "}
//                           {duplicateChequeNumbers.join(
//                             ", ",
//                           )}
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </section>
//               )}

//             <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
//               <div className="mb-6 flex items-start gap-3">
//                 <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
//                   <ReceiptText className="h-5 w-5" />
//                 </div>

//                 <div>
//                   <h2 className="text-lg font-semibold text-slate-950">
//                     Reference & Notes
//                   </h2>

//                   <p className="mt-1 text-sm text-slate-500">
//                     Add transaction
//                     reference, upload
//                     receipts, and write
//                     payment notes.
//                   </p>
//                 </div>
//               </div>

//               <div className="space-y-5">
//                 <div className="space-y-2">
//                   <Label
//                     htmlFor="transactionName"
//                     className="text-sm text-slate-700"
//                   >
//                     Transaction Name
//                   </Label>

//                   <Input
//                     id="transactionName"
//                     value={
//                       formData.transactionName
//                     }
//                     onChange={(event) =>
//                       setFormData(
//                         (previous) => ({
//                           ...previous,
//                           transactionName:
//                             event.target
//                               .value,
//                         }),
//                       )
//                     }
//                     placeholder="Enter transaction name"
//                     className="h-11 rounded-2xl border-slate-200"
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label
//                     htmlFor="transactionReference"
//                     className="text-sm text-slate-700"
//                   >
//                     Transaction Reference
//                   </Label>

//                   <Input
//                     id="transactionReference"
//                     value={
//                       formData.transactionReference
//                     }
//                     onChange={(event) =>
//                       setFormData(
//                         (previous) => ({
//                           ...previous,
//                           transactionReference:
//                             event.target
//                               .value,
//                         }),
//                       )
//                     }
//                     placeholder="Enter transaction reference"
//                     className="h-11 rounded-2xl border-slate-200"
//                   />
//                 </div>

//                 {allowReceiptUpload && (
//                   <div className="space-y-3">
//                     <Label
//                       htmlFor="receipt"
//                       className="text-sm text-slate-700"
//                     >
//                       Upload Receipt /
//                       Cheque Copies
//                     </Label>

//                     <label
//                       htmlFor="receipt"
//                       className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-slate-400 hover:bg-slate-100"
//                     >
//                       <FileUp className="h-8 w-8 text-slate-500" />

//                       <p className="mt-3 text-sm font-semibold text-slate-800">
//                         Click to upload
//                         files
//                       </p>

//                       <p className="mt-1 text-xs text-slate-500">
//                         JPG, PNG, or PDF.
//                         Multiple files are
//                         allowed.
//                       </p>

//                       <Input
//                         id="receipt"
//                         type="file"
//                         accept=".jpg,.jpeg,.png,.pdf"
//                         multiple
//                         onChange={
//                           handleReceiptFilesChange
//                         }
//                         className="hidden"
//                       />
//                     </label>

//                     {receiptFiles.length >
//                       0 && (
//                       <div className="space-y-2">
//                         {receiptFiles.map(
//                           (
//                             file,
//                             index,
//                           ) => (
//                             <div
//                               key={`${file.name}-${index}`}
//                               className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
//                             >
//                               <div className="min-w-0">
//                                 <p className="truncate font-medium text-slate-900">
//                                   {index +
//                                     1}
//                                   .{" "}
//                                   {
//                                     file.name
//                                   }
//                                 </p>

//                                 <p className="text-xs text-slate-500">
//                                   {getFileSizeLabel(
//                                     file.size,
//                                   )}
//                                 </p>
//                               </div>

//                               <Button
//                                 type="button"
//                                 variant="ghost"
//                                 size="icon"
//                                 className="h-9 w-9 shrink-0 rounded-full text-red-600 hover:bg-red-50 hover:text-red-700"
//                                 onClick={() =>
//                                   handleRemoveReceiptFile(
//                                     index,
//                                   )
//                                 }
//                               >
//                                 <Trash2 className="h-4 w-4" />
//                               </Button>
//                             </div>
//                           ),
//                         )}
//                       </div>
//                     )}
//                   </div>
//                 )}

//                 <div className="space-y-2">
//                   <Label
//                     htmlFor="paymentNotes"
//                     className="text-sm text-slate-700"
//                   >
//                     Payment Notes
//                   </Label>

//                   <Textarea
//                     id="paymentNotes"
//                     rows={5}
//                     value={
//                       formData.paymentNotes
//                     }
//                     onChange={(event) =>
//                       setFormData(
//                         (previous) => ({
//                           ...previous,
//                           paymentNotes:
//                             event.target
//                               .value,
//                         }),
//                       )
//                     }
//                     placeholder="Add any notes..."
//                     className="rounded-2xl border-slate-200"
//                   />
//                 </div>
//               </div>
//             </section>
//           </div>

//           <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
//             <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//               <h2 className="text-base font-semibold text-slate-950">
//                 Release Summary
//               </h2>

//               <div className="mt-5 space-y-4 text-sm">
//                 {invoice && (
//                   <>
//                     <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                       <span className="text-slate-500">
//                         Approved
//                       </span>

//                       <span className="text-right font-semibold text-slate-950">
//                         Rs{" "}
//                         {formatPKR(
//                           invoiceApprovedAmount,
//                         )}
//                       </span>
//                     </div>

//                     <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                       <span className="text-slate-500">
//                         Released Before
//                       </span>

//                       <span className="text-right font-semibold text-slate-950">
//                         Rs{" "}
//                         {formatPKR(
//                           totalReleasedAmount,
//                         )}
//                       </span>
//                     </div>
//                   </>
//                 )}

//                 <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                   <span className="text-slate-500">
//                     This Release
//                   </span>

//                   <span className="text-right font-semibold text-slate-950">
//                     Rs{" "}
//                     {formatPKR(
//                       formData.amount,
//                     )}
//                   </span>
//                 </div>

//                 {invoice && (
//                   <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                     <span className="text-slate-500">
//                       Balance After
//                     </span>

//                     <span className="text-right font-semibold text-slate-950">
//                       Rs{" "}
//                       {formatPKR(
//                         Math.max(
//                           remainingReleaseAmount -
//                             safeNumber(
//                               formData.amount,
//                             ),
//                           0,
//                         ),
//                       )}
//                     </span>
//                   </div>
//                 )}

//                 <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                   <span className="text-slate-500">
//                     Transaction Name
//                   </span>

//                   <span className="max-w-[190px] text-right font-semibold text-slate-950">
//                     {formData.transactionName.trim() ||
//                       "-"}
//                   </span>
//                 </div>

//                 <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                   <span className="text-slate-500">
//                     Method
//                   </span>

//                   <span className="text-right font-semibold text-slate-950">
//                     {getPaymentMethodLabel(
//                       formData.paymentMethod,
//                     )}
//                   </span>
//                 </div>

//                 <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                   <span className="text-slate-500">
//                     {resolvedPartyLabel}
//                   </span>

//                   <span className="max-w-[190px] text-right font-semibold text-slate-950">
//                     {resolvedParties.length
//                       ? resolvedParties.join(
//                           ", ",
//                         )
//                       : "-"}
//                   </span>
//                 </div>

//                 {formData.paymentMethod ===
//                   "cheque" && (
//                   <>
//                     <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                       <span className="text-slate-500">
//                         Account
//                       </span>

//                       <span className="max-w-[190px] text-right font-semibold text-slate-950">
//                         {selectedAccount?.accountName ||
//                           "-"}
//                       </span>
//                     </div>

//                     <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
//                       <span className="text-slate-500">
//                         Cheques
//                       </span>

//                       <span className="text-right font-semibold text-slate-950">
//                         {
//                           cleanChequeNumbers(
//                             formData.chequeNumbers,
//                           ).length
//                         }
//                       </span>
//                     </div>
//                   </>
//                 )}

//                 <div className="flex items-start justify-between gap-4">
//                   <span className="text-slate-500">
//                     Files
//                   </span>

//                   <span className="text-right font-semibold text-slate-950">
//                     {receiptFiles.length}
//                   </span>
//                 </div>
//               </div>
//             </section>

//             {paymentReleaseHistory.length >
//               0 && (
//               <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//                 <h2 className="text-base font-semibold text-slate-950">
//                   Payment Release History
//                 </h2>

//                 <div className="mt-4 space-y-3">
//                   {[
//                     ...paymentReleaseHistory,
//                   ]
//                     .reverse()
//                     .map(
//                       (
//                         entry: any,
//                         index: number,
//                       ) => (
//                         <div
//                           key={
//                             entry?.id ||
//                             `${
//                               entry?.releasedAt ||
//                               "release"
//                             }-${index}`
//                           }
//                           className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm"
//                         >
//                           <div className="flex items-start justify-between gap-3">
//                             <div>
//                               <p className="font-semibold text-slate-950">
//                                 Rs{" "}
//                                 {formatPKR(
//                                   getPaymentReleaseAmount(
//                                     entry,
//                                   ),
//                                 )}
//                               </p>

//                               <p className="mt-1 text-xs text-slate-500">
//                                 {getPaymentMethodLabel(
//                                   entry?.paymentMethod,
//                                 )}{" "}
//                                 •{" "}
//                                 {getReleaseDateLabel(
//                                   entry?.releasedAt,
//                                 )}
//                               </p>
//                             </div>

//                             <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
//                               {entry?.releaseType ||
//                                 "release"}
//                             </span>
//                           </div>

//                           <div className="mt-3 space-y-1 text-xs text-slate-500">
//                             <p>
//                               Released By:{" "}
//                               {entry?.releasedByName ||
//                                 "-"}
//                             </p>

//                             {entry?.transactionName && (
//                               <p>
//                                 Transaction:{" "}
//                                 {
//                                   entry.transactionName
//                                 }
//                               </p>
//                             )}

//                             {entry?.transactionReference && (
//                               <p>
//                                 Reference:{" "}
//                                 {
//                                   entry.transactionReference
//                                 }
//                               </p>
//                             )}

//                             {Array.isArray(
//                               entry?.chequeNumbers,
//                             ) &&
//                               entry
//                                 .chequeNumbers
//                                 .length >
//                                 0 && (
//                                 <p>
//                                   Cheques:{" "}
//                                   {entry.chequeNumbers.join(
//                                     ", ",
//                                   )}
//                                 </p>
//                               )}

//                             {entry?.paymentNotes && (
//                               <p>
//                                 Notes:{" "}
//                                 {
//                                   entry.paymentNotes
//                                 }
//                               </p>
//                             )}
//                           </div>
//                         </div>
//                       ),
//                     )}
//                 </div>
//               </section>
//             )}

//             <section className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
//               <h3 className="text-sm font-semibold text-blue-950">
//                 Before releasing
//               </h3>

//               <ul className="mt-3 space-y-2 text-sm text-blue-800">
//                 <li>
//                   Confirm the release amount
//                   is correct.
//                 </li>

//                 <li>
//                   For cheque payment, add
//                   all cheque numbers.
//                 </li>

//                 <li>
//                   Upload receipt or cheque
//                   copy files if available.
//                 </li>
//               </ul>
//             </section>
//           </aside>
//         </form>
//       </main>
//     </div>
//   );
// }








import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  FileUp,
  Loader2,
  Plus,
  Printer,
  ReceiptText,
  Trash2,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { releasePayment } from "@/lib/payments/releasePayment";
import { fetchPaymentAccounts } from "@/lib/payments/paymentAccounts";
import {
  PaymentAccount,
  PaymentReleaseFormValues,
  PaymentReleaseSubmitArgs,
} from "@/lib/payments/types";
import { InvoiceRequest } from "@shared/schema";
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
    args: PaymentReleaseSubmitArgs<T>,
  ) => Record<string, any>;

  amount?: number;
  amountLabel?: string;
  partyLabel?: string;
  parties?: string[];

  accounts?: PaymentAccount[];
  allowCheque?: boolean;
  allowReceiptUpload?: boolean;
  initialPaymentMethod?:
    | "cash"
    | "cheque"
    | "bank_transfer"
    | "wire";
  amountReadOnly?: boolean;
}

const PANEL_ID = "IEDGE-SYSTEM";

type ExtendedPaymentReleaseFormValues =
  PaymentReleaseFormValues & {
    transactionName: string;
    chequeNumbers: string[];
  };

function normalizeText(value: any) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeChequeNumber(value: any) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
}

function extractChequeNumbersFromValue(
  value: any,
): string[] {
  if (value === undefined || value === null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) =>
      extractChequeNumbersFromValue(item),
    );
  }

  if (typeof value === "object") {
    return [];
  }

  return String(value)
    .split(/[\n,]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function collectChequeNumbersFromSource(
  source: any,
): string[] {
  if (!source) return [];

  const paymentDetails =
    source.paymentDetails || {};
  const latestPaymentRelease =
    source.latestPaymentRelease || {};
  const accountDetails =
    source.accountDetails || {};
  const bankDetails = source.bankDetails || {};
  const receivePayment =
    source.receivePayment || {};

  const paymentReleaseHistory = Array.isArray(
    source.paymentReleaseHistory,
  )
    ? source.paymentReleaseHistory
    : [];

  return [
    ...extractChequeNumbersFromValue(
      source.chequeNumber,
    ),
    ...extractChequeNumbersFromValue(
      source.chequeNumbers,
    ),
    ...extractChequeNumbersFromValue(
      source.chequeNo,
    ),
    ...extractChequeNumbersFromValue(
      source.checkNumber,
    ),
    ...extractChequeNumbersFromValue(
      source.checkNo,
    ),
    ...extractChequeNumbersFromValue(
      source.bankChequeNumber,
    ),
    ...extractChequeNumbersFromValue(
      source.paymentChequeNumber,
    ),
    ...extractChequeNumbersFromValue(
      source.receivedChequeNumber,
    ),
    ...extractChequeNumbersFromValue(
      source.reference,
    ),
    ...extractChequeNumbersFromValue(
      source.Reference,
    ),
    ...extractChequeNumbersFromValue(
      source.transactionReference,
    ),

    ...extractChequeNumbersFromValue(
      paymentDetails.chequeNumber,
    ),
    ...extractChequeNumbersFromValue(
      paymentDetails.chequeNumbers,
    ),
    ...extractChequeNumbersFromValue(
      paymentDetails.chequeNo,
    ),
    ...extractChequeNumbersFromValue(
      paymentDetails.checkNumber,
    ),
    ...extractChequeNumbersFromValue(
      paymentDetails.reference,
    ),
    ...extractChequeNumbersFromValue(
      paymentDetails.Reference,
    ),
    ...extractChequeNumbersFromValue(
      paymentDetails.transactionReference,
    ),

    ...extractChequeNumbersFromValue(
      latestPaymentRelease.chequeNumber,
    ),
    ...extractChequeNumbersFromValue(
      latestPaymentRelease.chequeNumbers,
    ),
    ...extractChequeNumbersFromValue(
      latestPaymentRelease.chequeNo,
    ),
    ...extractChequeNumbersFromValue(
      latestPaymentRelease.checkNumber,
    ),
    ...extractChequeNumbersFromValue(
      latestPaymentRelease.reference,
    ),
    ...extractChequeNumbersFromValue(
      latestPaymentRelease.Reference,
    ),
    ...extractChequeNumbersFromValue(
      latestPaymentRelease.transactionReference,
    ),

    ...extractChequeNumbersFromValue(
      accountDetails.chequeNumber,
    ),
    ...extractChequeNumbersFromValue(
      accountDetails.chequeNumbers,
    ),
    ...extractChequeNumbersFromValue(
      accountDetails.chequeNo,
    ),
    ...extractChequeNumbersFromValue(
      accountDetails.checkNumber,
    ),
    ...extractChequeNumbersFromValue(
      accountDetails.reference,
    ),
    ...extractChequeNumbersFromValue(
      accountDetails.Reference,
    ),
    ...extractChequeNumbersFromValue(
      accountDetails.transactionReference,
    ),

    ...extractChequeNumbersFromValue(
      bankDetails.chequeNumber,
    ),
    ...extractChequeNumbersFromValue(
      bankDetails.chequeNumbers,
    ),
    ...extractChequeNumbersFromValue(
      bankDetails.chequeNo,
    ),
    ...extractChequeNumbersFromValue(
      bankDetails.checkNumber,
    ),
    ...extractChequeNumbersFromValue(
      bankDetails.reference,
    ),
    ...extractChequeNumbersFromValue(
      bankDetails.Reference,
    ),
    ...extractChequeNumbersFromValue(
      bankDetails.transactionReference,
    ),

    ...extractChequeNumbersFromValue(
      receivePayment.chequeNumber,
    ),
    ...extractChequeNumbersFromValue(
      receivePayment.chequeNumbers,
    ),
    ...extractChequeNumbersFromValue(
      receivePayment.chequeNo,
    ),
    ...extractChequeNumbersFromValue(
      receivePayment.checkNumber,
    ),
    ...extractChequeNumbersFromValue(
      receivePayment.reference,
    ),
    ...extractChequeNumbersFromValue(
      receivePayment.Reference,
    ),
    ...extractChequeNumbersFromValue(
      receivePayment.transactionReference,
    ),

    ...paymentReleaseHistory.flatMap(
      (entry: any) =>
        collectChequeNumbersFromSource(entry),
    ),
  ];
}

function cleanChequeNumbers(
  values: string[] = [],
) {
  return values
    .map((value) => value.trim())
    .filter(Boolean);
}

function getDuplicateChequeNumbers(
  chequeNumbers: string[],
  existingChequeNumbers: Set<string>,
) {
  const normalizedCounts = new Map<
    string,
    number
  >();

  chequeNumbers.forEach((chequeNumber) => {
    const normalized =
      normalizeChequeNumber(chequeNumber);

    if (!normalized) return;

    normalizedCounts.set(
      normalized,
      (normalizedCounts.get(normalized) || 0) +
        1,
    );
  });

  return cleanChequeNumbers(
    chequeNumbers,
  ).filter((chequeNumber) => {
    const normalized =
      normalizeChequeNumber(chequeNumber);

    return (
      existingChequeNumbers.has(normalized) ||
      (normalizedCounts.get(normalized) || 0) >
        1
    );
  });
}

function formatPKR(
  value:
    | number
    | string
    | undefined
    | null,
) {
  const numberValue =
    typeof value === "number"
      ? value
      : Number(
          String(value || 0).replace(/,/g, ""),
        ) || 0;

  return numberValue.toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function safeNumber(value: any) {
  const parsed = Number(
    String(value ?? 0).replace(/,/g, ""),
  );

  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value: any) {
  return (
    Math.round(safeNumber(value) * 100) / 100
  );
}

function getPaymentReleaseAmount(entry: any) {
  return roundMoney(
    entry?.amount ??
      entry?.releaseAmount ??
      entry?.releasedAmount ??
      entry?.paymentAmount ??
      0,
  );
}

function getPaymentReleaseHistory(
  source: any,
): any[] {
  const history = Array.isArray(
    source?.paymentReleaseHistory,
  )
    ? source.paymentReleaseHistory
    : [];

  if (history.length > 0) {
    return history.filter(
      (entry: any) =>
        getPaymentReleaseAmount(entry) > 0,
    );
  }

  // Backward compatibility for older records.
  const legacyPayment =
    source?.paymentDetails ||
    source?.latestPaymentRelease;

  if (
    legacyPayment &&
    getPaymentReleaseAmount(legacyPayment) > 0
  ) {
    return [
      {
        ...legacyPayment,
        releasedAt:
          legacyPayment?.releasedAt ||
          source?.paymentReleasedAt ||
          source?.releasePaymentAt ||
          source?.updatedAt ||
          null,
      },
    ];
  }

  return [];
}

function getTotalReleasedAmount(source: any) {
  return roundMoney(
    getPaymentReleaseHistory(source).reduce(
      (sum, entry) =>
        sum + getPaymentReleaseAmount(entry),
      0,
    ),
  );
}

function getApprovedAmountFromRecord(
  source: any,
  fallback = 0,
) {
  return roundMoney(
    source?.approvedAmount ??
      source?.totalApprovedAmount ??
      source?.approvedTotal ??
      source?.totalAmount ??
      source?.amount ??
      fallback,
  );
}

function getRemainingReleaseAmount(
  source: any,
  fallbackApproved = 0,
) {
  const approvedAmount =
    getApprovedAmountFromRecord(
      source,
      fallbackApproved,
    );

  const releasedAmount =
    getTotalReleasedAmount(source);

  return roundMoney(
    Math.max(
      approvedAmount - releasedAmount,
      0,
    ),
  );
}

function getReleaseDateLabel(value: any) {
  if (!value) return "-";

  let date: Date | null = null;

  if (value instanceof Date) {
    date = value;
  } else if (
    typeof value?.toDate === "function"
  ) {
    date = value.toDate();
  } else if (
    typeof value?.seconds === "number"
  ) {
    date = new Date(value.seconds * 1000);
  } else {
    date = new Date(value);
  }

  if (
    !date ||
    Number.isNaN(date.getTime())
  ) {
    return "-";
  }

  return date.toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPaymentMethodLabel(
  method?: string,
) {
  switch (method) {
    case "cash":
      return "Cash";

    case "cheque":
      return "Cheque";

    case "bank_transfer":
      return "Bank Transfer";

    case "wire":
      return "Online Transfer";

    default:
      return "Not Selected";
  }
}

function getFileSizeLabel(bytes: number) {
  if (!bytes) return "0 KB";

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(1)} MB`;
}

function escapeHtml(value: any) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMultilineText(value: any) {
  const text = String(value ?? "").trim();

  if (!text) return "-";

  return escapeHtml(text).replace(/\n/g, "<br />");
}

/**
 * Stores the workflow status before the first payment release.
 *
 * This value is used by the Payment History editor if payments are later
 * corrected or removed. It prevents payment-history changes from affecting
 * the Admin/Finance approval workflow.
 */
function getPaymentWorkflowBaseStatus(
  sourceRecord: any,
) {
  const existingBaseStatus = String(
    sourceRecord?.paymentWorkflowBaseStatus ||
      "",
  ).trim();

  if (existingBaseStatus) {
    return existingBaseStatus;
  }

  const currentStatus = normalizeText(
    sourceRecord?.status,
  );

  if (
    currentStatus &&
    ![
      "payment_released",
      "payment_partially_released",
    ].includes(currentStatus)
  ) {
    return String(sourceRecord.status);
  }

  const hasPurchaseOrder = Boolean(
    sourceRecord?.poId ||
      sourceRecord?.poNumber ||
      sourceRecord?.poDocId ||
      sourceRecord?.purchaseOrderId ||
      sourceRecord?.purchaseOrderNumber ||
      sourceRecord?.poCreated ||
      sourceRecord?.poSubmitted ||
      sourceRecord?.purchaseOrderCreated ||
      sourceRecord?.purchaseOrderSubmitted,
  );

  if (hasPurchaseOrder) {
    return "ready_for_payment";
  }

  return "approved";
}

function getPaymentWorkflowBasePaymentStatus(
  sourceRecord: any,
) {
  const existingBaseStatus = String(
    sourceRecord?.paymentWorkflowBasePaymentStatus ||
      "",
  ).trim();

  if (existingBaseStatus) {
    return existingBaseStatus;
  }

  const currentPaymentStatus =
    normalizeText(
      sourceRecord?.paymentStatus ||
        sourceRecord?.releasePaymentStatus,
    );

  if (
    currentPaymentStatus &&
    ![
      "released",
      "partial",
      "payment_released",
      "payment_partially_released",
    ].includes(currentPaymentStatus)
  ) {
    return String(
      sourceRecord?.paymentStatus ||
        sourceRecord?.releasePaymentStatus ||
        "",
    );
  }

  return "";
}

export default function PaymentReleaseModal<
  T = any,
>({
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
  const { userProfile, currentUser } =
    useAuth();

  const { toast } = useToast();

  const [loading, setLoading] =
    useState(false);

  const [
    accountsLoading,
    setAccountsLoading,
  ] = useState(false);

  const [
    receiptFiles,
    setReceiptFiles,
  ] = useState<File[]>([]);

  const [
    selectedAccount,
    setSelectedAccount,
  ] = useState<PaymentAccount | null>(
    null,
  );

  const [
    storedAccounts,
    setStoredAccounts,
  ] = useState<PaymentAccount[]>([]);

  const [
    existingChequeNumbers,
    setExistingChequeNumbers,
  ] = useState<Set<string>>(
    () => new Set(),
  );

  const [
    chequeValidationLoading,
    setChequeValidationLoading,
  ] = useState(false);

  const approvedInvoiceItems =
    useMemo(() => {
      const items = Array.isArray(
        (invoice as any)?.lineItems,
      )
        ? (invoice as any).lineItems
        : [];

      return items.filter(
        (item: any) =>
          item?.status === "approved",
      );
    }, [invoice]);

  const approvedLineItemsAmount =
    useMemo(() => {
      return roundMoney(
        approvedInvoiceItems.reduce(
          (sum: number, item: any) => {
            const qty = Number(
              item?.units || 0,
            );

            const rate = Number(
              item?.unitRate || 0,
            );

            const tax = Number(
              item?.tax || 0,
            );

            const total = Number(
              item?.total ??
                qty * rate + tax,
            );

            return sum + total;
          },
          0,
        ),
      );
    }, [approvedInvoiceItems]);

  const invoiceApprovedAmount =
    useMemo(() => {
      return getApprovedAmountFromRecord(
        invoice,
        approvedLineItemsAmount,
      );
    }, [
      invoice,
      approvedLineItemsAmount,
    ]);

  const paymentReleaseHistory =
    useMemo(() => {
      return getPaymentReleaseHistory(
        invoice,
      );
    }, [invoice]);

  const totalReleasedAmount =
    useMemo(() => {
      return getTotalReleasedAmount(
        invoice,
      );
    }, [invoice]);

  const remainingReleaseAmount =
    useMemo(() => {
      return getRemainingReleaseAmount(
        invoice,
        invoiceApprovedAmount,
      );
    }, [
      invoice,
      invoiceApprovedAmount,
    ]);

  const invoiceApprovedVendors =
    useMemo(() => {
      const vendors = [
        ...new Set(
          approvedInvoiceItems
            .map((item: any) =>
              String(
                item?.vendor ||
                  item?.vendorName ||
                  item?.supplier ||
                  item?.supplierName ||
                  "",
              ).trim(),
            )
            .filter(Boolean),
        ),
      ] as string[];

      if (vendors.length > 0) {
        return vendors;
      }

      const fallbackVendor = String(
        (invoice as any)?.vendorName ||
          (invoice as any)?.supplierName ||
          (invoice as any)?.clientName ||
          (invoice as any)?.partyName ||
          "",
      ).trim();

      return fallbackVendor
        ? [fallbackVendor]
        : [];
    }, [
      approvedInvoiceItems,
      invoice,
    ]);

  const resolvedContext = (
    context ??
    invoice ??
    null
  ) as T | InvoiceRequest | null;

  const resolvedDocPath =
    useMemo(() => {
      if (
        docPath &&
        resolvedContext
      ) {
        return typeof docPath === "function"
          ? docPath(resolvedContext as T)
          : docPath;
      }

      if ((invoice as any)?.id) {
        return [
          "Panels",
          PANEL_ID,
          "invoiceRequests",
          (invoice as any).id,
        ];
      }

      return [];
    }, [
      docPath,
      resolvedContext,
      invoice,
    ]);

  const resolvedAmount =
    amount ??
    (invoice
      ? remainingReleaseAmount
      : 0);

  const resolvedParties =
    parties ??
    (invoice
      ? invoiceApprovedVendors
      : []);

  const resolvedAmountLabel =
    amountLabel ??
    (invoice
      ? "Remaining Balance"
      : "Amount");

  const resolvedPartyLabel =
    partyLabel ??
    (invoice
      ? "Approved Vendors"
      : "Payee");

  const resolvedInitialPaymentMethod =
    initialPaymentMethod ??
    (invoice
      ? "bank_transfer"
      : "cash");

  const resolvedAmountReadOnly =
    amountReadOnly ?? false;

  const resolvedAccounts =
    useMemo(() => {
      const map = new Map<
        string,
        PaymentAccount
      >();

      [
        ...storedAccounts,
        ...accounts,
      ].forEach((account) => {
        if (!account?.id) return;

        map.set(account.id, account);
      });

      return Array.from(
        map.values(),
      ).filter(
        (account) =>
          account.isActive !== false,
      );
    }, [
      storedAccounts,
      accounts,
    ]);

  const defaultInvoiceBuildUpdateData = (
    args: PaymentReleaseSubmitArgs<InvoiceRequest>,
  ) => {
    const {
      formData,
      receiptUrl,
      selectedAccount,
      actor,
    } = args;

    const sourceRecord = (
      (args as any).context ||
      invoice ||
      {}
    ) as any;

    const extendedFormData =
      formData as ExtendedPaymentReleaseFormValues;

    const releaseAmount =
      roundMoney(
        extendedFormData.amount,
      );

    const approvedAmount =
      getApprovedAmountFromRecord(
        sourceRecord,
        invoiceApprovedAmount ||
          releaseAmount,
      );

    const existingHistory =
      getPaymentReleaseHistory(
        sourceRecord,
      );

    const releasedBefore =
      roundMoney(
        existingHistory.reduce(
          (sum, entry) =>
            sum +
            getPaymentReleaseAmount(
              entry,
            ),
          0,
        ),
      );

    const releasedAfter =
      roundMoney(
        releasedBefore +
          releaseAmount,
      );

    const remainingAfter =
      roundMoney(
        Math.max(
          approvedAmount -
            releasedAfter,
          0,
        ),
      );

    const isFullyReleased =
      approvedAmount > 0 &&
      remainingAfter <= 0.009;

    const chequeNumbers =
      cleanChequeNumbers(
        extendedFormData
          .chequeNumbers?.length
          ? extendedFormData.chequeNumbers
          : [
              extendedFormData.chequeNumber ||
                "",
            ],
      );

    const receiptUrls =
      Array.isArray(
        (args as any).receiptUrls,
      )
        ? (args as any).receiptUrls
        : receiptUrl
          ? [receiptUrl]
          : [];

    const paymentWorkflowBaseStatus =
      getPaymentWorkflowBaseStatus(
        sourceRecord,
      );

    const paymentWorkflowBasePaymentStatus =
      getPaymentWorkflowBasePaymentStatus(
        sourceRecord,
      );

    const releaseEntry: any = {
      id: `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,

      releaseType:
        releasedBefore <= 0
          ? isFullyReleased
            ? "full"
            : "advance"
          : isFullyReleased
            ? "final"
            : "partial",

      paymentMethod:
        extendedFormData.paymentMethod,

      amount: releaseAmount,
      approvedAmount,
      releasedBefore,
      releasedAfter,
      remainingAfter,

      vendors:
        invoiceApprovedVendors,

      transactionName:
        extendedFormData.transactionName?.trim() ||
        "",

      transactionReference:
        extendedFormData.transactionReference,

      bankReceiptUrl:
        receiptUrls[0] ||
        receiptUrl ||
        "",

      bankReceiptUrls: receiptUrls,

      paymentNotes:
        extendedFormData.paymentNotes,

      releasedBy:
        actor.profileId ||
        actor.uid ||
        "",

      releasedByName:
        actor.displayName ||
        actor.email ||
        "Unknown",

      releasedByEmail:
        actor.email || "",

      releasedAt: new Date(),

      paymentWorkflowBaseStatus,
      paymentWorkflowBasePaymentStatus,
    };

    if (chequeNumbers.length > 0) {
      releaseEntry.chequeNumber =
        chequeNumbers[0];

      releaseEntry.chequeNumbers =
        chequeNumbers;
    }

    if (selectedAccount) {
      releaseEntry.selectedAccount =
        selectedAccount;

      releaseEntry.selectedAccountId =
        selectedAccount.id || "";

      releaseEntry.selectedAccountName =
        selectedAccount.accountName ||
        "";
    }

    const updateData: Record<
      string,
      any
    > = {
      status: isFullyReleased
        ? "payment_released"
        : "payment_partially_released",

      paymentStatus: isFullyReleased
        ? "released"
        : "partial",

      paymentWorkflowBaseStatus,
      paymentWorkflowBasePaymentStatus,

      paymentReleased:
        isFullyReleased,

      paymentPartiallyReleased:
        !isFullyReleased,

      releasePaymentCreated: true,

      totalApprovedAmount:
        approvedAmount,

      totalReleasedAmount:
        releasedAfter,

      remainingReleaseAmount:
        remainingAfter,

      transactionName:
        extendedFormData.transactionName?.trim() ||
        "",

      latestTransactionName:
        extendedFormData.transactionName?.trim() ||
        "",

      latestPaymentRelease:
        releaseEntry,

      paymentDetails: releaseEntry,

      paymentReleaseHistory: [
        ...existingHistory,
        releaseEntry,
      ],

      updatedAt: serverTimestamp(),
    };

    if (isFullyReleased) {
      updateData.paymentReleasedAt =
        serverTimestamp();

      updateData.releasePaymentAt =
        serverTimestamp();

      updateData.paymentFullyReleasedAt =
        serverTimestamp();
    } else {
      updateData.partialPaymentReleasedAt =
        serverTimestamp();
    }

    return updateData;
  };

  const [formData, setFormData] =
    useState<ExtendedPaymentReleaseFormValues>(
      {
        paymentMethod:
          resolvedInitialPaymentMethod,

        selectedAccountId: "",

        amount: String(
          resolvedAmount || 0,
        ),

        transactionName: "",

        chequeNumber: "",

        chequeNumbers: [""],

        transactionReference: "",

        paymentNotes: "",
      },
    );

  useEffect(() => {
    if (!isOpen) return;

    setFormData({
      paymentMethod:
        resolvedInitialPaymentMethod,

      selectedAccountId: "",

      amount: String(
        resolvedAmount || 0,
      ),

      transactionName: "",

      chequeNumber: "",

      chequeNumbers: [""],

      transactionReference: "",

      paymentNotes: "",
    });

    setSelectedAccount(null);
    setReceiptFiles([]);
  }, [
    isOpen,
    resolvedAmount,
    resolvedInitialPaymentMethod,
  ]);

  useEffect(() => {
    let mounted = true;

    async function loadAccounts() {
      try {
        setAccountsLoading(true);

        const rows =
          await fetchPaymentAccounts();

        if (mounted) {
          setStoredAccounts(rows);
        }
      } catch (error) {
        console.error(
          "Failed to load payment accounts:",
          error,
        );

        if (mounted) {
          toast({
            title: "Error",
            description:
              "Failed to load payment accounts",
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

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;

    async function loadExistingChequeNumbers() {
      try {
        setChequeValidationLoading(true);

        const snapshots =
          await Promise.all([
            getDocs(
              collection(
                db,
                "Panels",
                PANEL_ID,
                "invoiceRequests",
              ),
            ),

            getDocs(
              collection(
                db,
                "Panels",
                PANEL_ID,
                "Record",
              ),
            ),

            getDocs(
              collection(
                db,
                "Panels",
                PANEL_ID,
                "payments",
              ),
            ),
          ]);

        const chequeSet =
          new Set<string>();

        snapshots.forEach(
          (snapshot) => {
            snapshot.docs.forEach(
              (documentSnapshot) => {
                const source = {
                  id: documentSnapshot.id,
                  ...documentSnapshot.data(),
                };

                collectChequeNumbersFromSource(
                  source,
                ).forEach(
                  (chequeNumber) => {
                    const normalized =
                      normalizeChequeNumber(
                        chequeNumber,
                      );

                    if (normalized) {
                      chequeSet.add(
                        normalized,
                      );
                    }
                  },
                );
              },
            );
          },
        );

        if (mounted) {
          setExistingChequeNumbers(
            chequeSet,
          );
        }
      } catch (error) {
        console.error(
          "Failed to validate existing cheque numbers:",
          error,
        );

        if (mounted) {
          toast({
            title: "Warning",
            description:
              "Cheque number validation could not be completed. Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        if (mounted) {
          setChequeValidationLoading(
            false,
          );
        }
      }
    }

    loadExistingChequeNumbers();

    return () => {
      mounted = false;
    };
  }, [isOpen, toast]);

  const duplicateChequeNumbers =
    useMemo(() => {
      return getDuplicateChequeNumbers(
        formData.chequeNumbers,
        existingChequeNumbers,
      );
    }, [
      formData.chequeNumbers,
      existingChequeNumbers,
    ]);

  const hasDuplicateChequeNumbers =
    duplicateChequeNumbers.length > 0;

  const getChequeNumberWarning = (
    chequeNumber: string,
    index: number,
  ) => {
    const normalized =
      normalizeChequeNumber(
        chequeNumber,
      );

    if (!normalized) return "";

    if (
      existingChequeNumbers.has(
        normalized,
      )
    ) {
      return "This cheque number already exists.";
    }

    const appearsInCurrentForm =
      formData.chequeNumbers.some(
        (
          currentChequeNumber,
          chequeIndex,
        ) =>
          chequeIndex !== index &&
          normalizeChequeNumber(
            currentChequeNumber,
          ) === normalized,
      );

    return appearsInCurrentForm
      ? "This cheque number is already added in this release."
      : "";
  };

  const submitDisabled = loading;

  const handleChequeNumberChange = (
    index: number,
    value: string,
  ) => {
    setFormData((previous) => {
      const updatedChequeNumbers = [
        ...previous.chequeNumbers,
      ];

      updatedChequeNumbers[index] =
        value;

      return {
        ...previous,
        chequeNumbers:
          updatedChequeNumbers,
        chequeNumber:
          updatedChequeNumbers[0] ||
          "",
      };
    });
  };

  const handleAddChequeNumber = () => {
    setFormData((previous) => ({
      ...previous,
      chequeNumbers: [
        ...previous.chequeNumbers,
        "",
      ],
    }));
  };

  const handleRemoveChequeNumber = (
    index: number,
  ) => {
    setFormData((previous) => {
      const updatedChequeNumbers =
        previous.chequeNumbers.filter(
          (_, chequeIndex) =>
            chequeIndex !== index,
        );

      const safeChequeNumbers =
        updatedChequeNumbers.length > 0
          ? updatedChequeNumbers
          : [""];

      return {
        ...previous,
        chequeNumbers:
          safeChequeNumbers,
        chequeNumber:
          safeChequeNumbers[0] || "",
      };
    });
  };

  const handleReceiptFilesChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(
      event.target.files || [],
    );

    setReceiptFiles(files);
  };

  const handleRemoveReceiptFile = (
    index: number,
  ) => {
    setReceiptFiles((previous) =>
      previous.filter(
        (_, fileIndex) =>
          fileIndex !== index,
      ),
    );
  };

  const handlePrintView = () => {
    const printWindow = window.open(
      "",
      "_blank",
      "width=1100,height=850,scrollbars=yes,resizable=yes",
    );

    if (!printWindow) {
      toast({
        title: "Print blocked",
        description:
          "Please allow pop-ups for this website and try again.",
        variant: "destructive",
      });

      return;
    }

    const currentReleaseAmount = roundMoney(
      formData.amount,
    );

    const balanceAfter = invoice
      ? roundMoney(
          Math.max(
            remainingReleaseAmount -
              currentReleaseAmount,
            0,
          ),
        )
      : 0;

    const currentChequeNumbers =
      cleanChequeNumbers(
        formData.chequeNumbers,
      );

    const historyRows = [
      ...paymentReleaseHistory,
    ]
      .reverse()
      .map((entry: any, index: number) => {
        const chequeNumbers = Array.isArray(
          entry?.chequeNumbers,
        )
          ? entry.chequeNumbers
          : cleanChequeNumbers([
              entry?.chequeNumber || "",
            ]);

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(
              getReleaseDateLabel(
                entry?.releasedAt,
              ),
            )}</td>
            <td>${escapeHtml(
              getPaymentMethodLabel(
                entry?.paymentMethod,
              ),
            )}</td>
            <td>${escapeHtml(
              entry?.transactionName || "-",
            )}</td>
            <td>${escapeHtml(
              entry?.transactionReference ||
                "-",
            )}</td>
            <td>${escapeHtml(
              chequeNumbers.length
                ? chequeNumbers.join(", ")
                : "-",
            )}</td>
            <td class="amount">Rs ${escapeHtml(
              formatPKR(
                getPaymentReleaseAmount(
                  entry,
                ),
              ),
            )}</td>
          </tr>
        `;
      })
      .join("");

    const documentTitle =
      title || "Payment Release";

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${escapeHtml(
            documentTitle,
          )}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              background: #f8fafc;
              color: #0f172a;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 13px;
              line-height: 1.5;
            }
            .page {
              width: 100%;
              max-width: 1050px;
              margin: 24px auto;
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 18px;
              overflow: hidden;
              box-shadow: 0 14px 40px rgba(15, 23, 42, 0.08);
            }
            .header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 24px;
              padding: 28px 32px;
              color: #ffffff;
              background: #0f172a;
            }
            .brand {
              font-size: 12px;
              font-weight: 700;
              letter-spacing: 0.14em;
              text-transform: uppercase;
              color: #cbd5e1;
            }
            h1 {
              margin: 6px 0 0;
              font-size: 27px;
              line-height: 1.2;
            }
            .generated {
              min-width: 210px;
              text-align: right;
              color: #cbd5e1;
              font-size: 12px;
            }
            .content { padding: 28px 32px 34px; }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 12px;
              margin-bottom: 24px;
            }
            .summary-card {
              min-height: 90px;
              padding: 16px;
              border: 1px solid #e2e8f0;
              border-radius: 14px;
              background: #f8fafc;
            }
            .summary-label {
              color: #64748b;
              font-size: 10px;
              font-weight: 700;
              letter-spacing: 0.08em;
              text-transform: uppercase;
            }
            .summary-value {
              margin-top: 7px;
              font-size: 17px;
              font-weight: 700;
              word-break: break-word;
            }
            .section {
              margin-top: 20px;
              padding: 20px;
              border: 1px solid #e2e8f0;
              border-radius: 14px;
            }
            .section-title {
              margin: 0 0 15px;
              font-size: 16px;
            }
            .details-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 14px 24px;
            }
            .detail {
              padding-bottom: 10px;
              border-bottom: 1px solid #eef2f7;
            }
            .detail.full { grid-column: 1 / -1; }
            .detail-label {
              color: #64748b;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .detail-value {
              margin-top: 4px;
              color: #0f172a;
              font-weight: 600;
              word-break: break-word;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              font-size: 11px;
            }
            th, td {
              padding: 9px 8px;
              border: 1px solid #e2e8f0;
              text-align: left;
              vertical-align: top;
            }
            th {
              background: #f1f5f9;
              font-weight: 700;
              white-space: nowrap;
            }
            td.amount {
              text-align: right;
              white-space: nowrap;
              font-weight: 700;
            }
            .empty {
              padding: 18px;
              border: 1px dashed #cbd5e1;
              border-radius: 12px;
              color: #64748b;
              text-align: center;
            }
            .footer {
              display: flex;
              justify-content: space-between;
              gap: 20px;
              margin-top: 28px;
              padding-top: 16px;
              border-top: 1px solid #e2e8f0;
              color: #64748b;
              font-size: 11px;
            }
            .screen-actions {
              position: sticky;
              top: 0;
              z-index: 10;
              display: flex;
              justify-content: flex-end;
              gap: 10px;
              padding: 12px 20px;
              border-bottom: 1px solid #e2e8f0;
              background: rgba(255, 255, 255, 0.95);
            }
            button {
              cursor: pointer;
              padding: 9px 16px;
              border-radius: 999px;
              border: 1px solid #cbd5e1;
              background: #ffffff;
              color: #0f172a;
              font-weight: 700;
            }
            button.primary {
              border-color: #0f172a;
              background: #0f172a;
              color: #ffffff;
            }
            @media (max-width: 760px) {
              .summary-grid, .details-grid {
                grid-template-columns: 1fr;
              }
              .detail.full { grid-column: auto; }
              .header { flex-direction: column; }
              .generated { text-align: left; }
            }
            @media print {
              @page { size: A4 landscape; margin: 10mm; }
              body { background: #ffffff; }
              .screen-actions { display: none !important; }
              .page {
                max-width: none;
                margin: 0;
                border: 0;
                border-radius: 0;
                box-shadow: none;
              }
              .header {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .summary-card, th {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .section { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="screen-actions">
            <button type="button" onclick="window.close()">Close</button>
            <button type="button" class="primary" onclick="window.print()">Print</button>
          </div>

          <div class="page">
            <header class="header">
              <div>
                <div class="brand">IEDGE Financial System</div>
                <h1>${escapeHtml(
                  documentTitle,
                )}</h1>
              </div>

              <div class="generated">
                <strong>Print View</strong><br />
                Generated: ${escapeHtml(
                  new Date().toLocaleString(
                    "en-PK",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  ),
                )}
              </div>
            </header>

            <main class="content">
              <div class="summary-grid">
                <div class="summary-card">
                  <div class="summary-label">${
                    invoice
                      ? "Total Approved"
                      : escapeHtml(
                          resolvedAmountLabel,
                        )
                  }</div>
                  <div class="summary-value">Rs ${escapeHtml(
                    formatPKR(
                      invoice
                        ? invoiceApprovedAmount
                        : resolvedAmount,
                    ),
                  )}</div>
                </div>

                <div class="summary-card">
                  <div class="summary-label">Released Before</div>
                  <div class="summary-value">Rs ${escapeHtml(
                    formatPKR(
                      invoice
                        ? totalReleasedAmount
                        : 0,
                    ),
                  )}</div>
                </div>

                <div class="summary-card">
                  <div class="summary-label">This Release</div>
                  <div class="summary-value">Rs ${escapeHtml(
                    formatPKR(
                      currentReleaseAmount,
                    ),
                  )}</div>
                </div>

                <div class="summary-card">
                  <div class="summary-label">Balance After</div>
                  <div class="summary-value">${
                    invoice
                      ? `Rs ${escapeHtml(
                          formatPKR(
                            balanceAfter,
                          ),
                        )}`
                      : "-"
                  }</div>
                </div>
              </div>

              <section class="section">
                <h2 class="section-title">Current Payment Details</h2>
                <div class="details-grid">
                  <div class="detail">
                    <div class="detail-label">Payment Method</div>
                    <div class="detail-value">${escapeHtml(
                      getPaymentMethodLabel(
                        formData.paymentMethod,
                      ),
                    )}</div>
                  </div>

                  <div class="detail">
                    <div class="detail-label">${escapeHtml(
                      resolvedPartyLabel,
                    )}</div>
                    <div class="detail-value">${escapeHtml(
                      resolvedParties.length
                        ? resolvedParties.join(
                            ", ",
                          )
                        : "-",
                    )}</div>
                  </div>

                  <div class="detail">
                    <div class="detail-label">Transaction Name</div>
                    <div class="detail-value">${escapeHtml(
                      formData.transactionName ||
                        "-",
                    )}</div>
                  </div>

                  <div class="detail">
                    <div class="detail-label">Transaction Reference</div>
                    <div class="detail-value">${escapeHtml(
                      formData.transactionReference ||
                        "-",
                    )}</div>
                  </div>

                  ${
                    formData.paymentMethod ===
                    "cheque"
                      ? `
                        <div class="detail">
                          <div class="detail-label">Account</div>
                          <div class="detail-value">${escapeHtml(
                            selectedAccount?.accountName ||
                              "-",
                          )}</div>
                        </div>
                        <div class="detail">
                          <div class="detail-label">Account Number</div>
                          <div class="detail-value">${escapeHtml(
                            selectedAccount?.accountNumber ||
                              "-",
                          )}</div>
                        </div>
                        <div class="detail full">
                          <div class="detail-label">Cheque Numbers</div>
                          <div class="detail-value">${escapeHtml(
                            currentChequeNumbers.length
                              ? currentChequeNumbers.join(
                                  ", ",
                                )
                              : "-",
                          )}</div>
                        </div>
                      `
                      : ""
                  }

                  <div class="detail">
                    <div class="detail-label">Attached Files</div>
                    <div class="detail-value">${escapeHtml(
                      receiptFiles.length,
                    )}</div>
                  </div>

                  <div class="detail full">
                    <div class="detail-label">Payment Notes</div>
                    <div class="detail-value">${formatMultilineText(
                      formData.paymentNotes,
                    )}</div>
                  </div>
                </div>
              </section>

              <section class="section">
                <h2 class="section-title">Previous Payment Release History</h2>
                ${
                  historyRows
                    ? `
                      <table>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Date</th>
                            <th>Method</th>
                            <th>Transaction</th>
                            <th>Reference</th>
                            <th>Cheque Numbers</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody>${historyRows}</tbody>
                      </table>
                    `
                    : '<div class="empty">No previous payment release history is available.</div>'
                }
              </section>

              <footer class="footer">
                <span>IEDGE Financial Record System</span>
                <span>This print view does not save or release the payment.</span>
              </footer>
            </main>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  };

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!resolvedContext) {
      toast({
        title: "Error",
        description:
          "No record selected",
        variant: "destructive",
      });

      return;
    }

    if (
      resolvedDocPath.length === 0
    ) {
      toast({
        title: "Error",
        description:
          "Invalid payment record path",
        variant: "destructive",
      });

      return;
    }

    if (!formData.paymentMethod) {
      toast({
        title: "Error",
        description:
          "Please select a payment method",
        variant: "destructive",
      });

      return;
    }

    const requestedReleaseAmount =
      roundMoney(formData.amount);

    if (
      !formData.amount ||
      requestedReleaseAmount <= 0
    ) {
      toast({
        title: "Error",
        description:
          "Please enter a valid amount",
        variant: "destructive",
      });

      return;
    }

    if (
      invoice &&
      requestedReleaseAmount >
        remainingReleaseAmount +
          0.009
    ) {
      toast({
        title: "Error",
        description: `Release amount cannot exceed the remaining balance of Rs ${formatPKR(
          remainingReleaseAmount,
        )}.`,
        variant: "destructive",
      });

      return;
    }

    const normalizedChequeNumbers =
      cleanChequeNumbers(
        formData.chequeNumbers,
      );

    if (
      formData.paymentMethod ===
      "cheque"
    ) {
      if (!formData.selectedAccountId) {
        toast({
          title: "Error",
          description:
            "Please select an account",
          variant: "destructive",
        });

        return;
      }

      if (
        normalizedChequeNumbers.length ===
        0
      ) {
        toast({
          title: "Error",
          description:
            "Please enter at least one cheque number",
          variant: "destructive",
        });

        return;
      }

      const duplicateCheques =
        getDuplicateChequeNumbers(
          normalizedChequeNumbers,
          existingChequeNumbers,
        );

      if (
        duplicateCheques.length > 0
      ) {
        toast({
          title: "Warning",
          description: `This cheque number already exists: ${duplicateCheques.join(
            ", ",
          )}. Payment will still be saved.`,
        });
      }
    }

    const normalizedFormData: ExtendedPaymentReleaseFormValues =
      {
        ...formData,

        transactionName:
          formData.transactionName.trim(),

        chequeNumber:
          normalizedChequeNumbers[0] ||
          "",

        chequeNumbers:
          normalizedChequeNumbers,
      };

    try {
      setLoading(true);

      await releasePayment({
        docPath: resolvedDocPath,

        context:
          resolvedContext as any,

        formData:
          normalizedFormData as any,

        // Existing support for the first receipt file.
        receiptFile:
          receiptFiles[0] || null,

        // Multiple receipt file support.
        receiptFiles,

        selectedAccount,

        actor: {
          uid: currentUser?.uid,

          email:
            currentUser?.email,

          displayName:
            userProfile?.displayName ||
            currentUser?.displayName ||
            currentUser?.email,

          profileId:
            userProfile?.id,
        },

        buildUpdateData: (
          buildUpdateData ||
          defaultInvoiceBuildUpdateData
        ) as any,
      } as any);

      toast({
        title: "Success",
        description:
          "Payment released successfully",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(
        "Failed to release payment:",
        error,
      );

      toast({
        title: "Error",
        description:
          error?.message ||
          "Failed to release payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 min-h-screen overflow-y-auto bg-slate-50">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-start gap-4">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="mt-1 h-10 w-10 rounded-full border-slate-200 bg-white shadow-sm hover:bg-slate-50"
              onClick={onClose}
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                  {title}
                </h1>

                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Payment Release
                </span>
              </div>

              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Review payment information,
                select the payment method,
                attach receipts, and release
                the remaining amount.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-slate-200 px-5"
              onClick={handlePrintView}
              disabled={loading}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print View
            </Button>

            <Button
              type="button"
              variant="outline"
              className="rounded-full border-slate-200 px-5"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              form="payment-release-form"
              disabled={submitDisabled}
              className="rounded-full bg-slate-950 px-6 text-white shadow-sm hover:bg-slate-800"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Releasing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Release Payment
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {invoice
                    ? "Total Approved Amount"
                    : resolvedAmountLabel}
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-950">
                  Rs{" "}
                  {formatPKR(
                    invoice
                      ? invoiceApprovedAmount
                      : resolvedAmount,
                  )}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Released So Far
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-950">
                  Rs{" "}
                  {formatPKR(
                    invoice
                      ? totalReleasedAmount
                      : 0,
                  )}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Remaining Balance
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-950">
                  Rs{" "}
                  {formatPKR(
                    invoice
                      ? remainingReleaseAmount
                      : resolvedAmount,
                  )}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <Banknote className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Payment Method
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {getPaymentMethodLabel(
                    formData.paymentMethod,
                  )}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        {invoice &&
          invoiceApprovedAmount > 0 && (
            <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Payment Release Progress
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Rs{" "}
                    {formatPKR(
                      totalReleasedAmount,
                    )}{" "}
                    released from Rs{" "}
                    {formatPKR(
                      invoiceApprovedAmount,
                    )}
                    .
                  </p>
                </div>

                <p className="text-sm font-semibold text-slate-950">
                  {Math.min(
                    100,
                    Math.round(
                      (totalReleasedAmount /
                        invoiceApprovedAmount) *
                        100,
                    ),
                  )}
                  %
                </p>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-950 transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        (totalReleasedAmount /
                          invoiceApprovedAmount) *
                          100,
                      ),
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

        <form
          id="payment-release-form"
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]"
        >
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-6 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <Banknote className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Payment Information
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Enter the release amount
                    and payment method details.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="amount"
                    className="text-sm text-slate-700"
                  >
                    Release Amount
                  </Label>

                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    max={
                      invoice
                        ? remainingReleaseAmount
                        : undefined
                    }
                    value={formData.amount}
                    readOnly={
                      resolvedAmountReadOnly
                    }
                    className={`h-11 rounded-2xl border-slate-200 ${
                      resolvedAmountReadOnly
                        ? "bg-slate-100"
                        : "bg-white"
                    }`}
                    onChange={(event) =>
                      setFormData(
                        (previous) => ({
                          ...previous,
                          amount:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />

                  {invoice && (
                    <p className="text-xs text-slate-500">
                      You can release any
                      amount up to Rs{" "}
                      {formatPKR(
                        remainingReleaseAmount,
                      )}
                      .
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="paymentMethod"
                    className="text-sm text-slate-700"
                  >
                    Payment Method
                  </Label>

                  <Select
                    value={
                      formData.paymentMethod
                    }
                    onValueChange={(
                      value: any,
                    ) =>
                      setFormData(
                        (previous) => ({
                          ...previous,

                          paymentMethod:
                            value,

                          selectedAccountId:
                            value ===
                            "cheque"
                              ? previous.selectedAccountId
                              : "",

                          chequeNumbers:
                            value ===
                              "cheque" &&
                            previous
                              .chequeNumbers
                              .length === 0
                              ? [""]
                              : previous.chequeNumbers,
                        }),
                      )
                    }
                  >
                    <SelectTrigger className="h-11 rounded-2xl border-slate-200">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="cash">
                        Cash
                      </SelectItem>

                      <SelectItem value="bank_transfer">
                        Bank Transfer
                      </SelectItem>

                      <SelectItem value="wire">
                        Online Transfer
                      </SelectItem>

                      {allowCheque && (
                        <SelectItem value="cheque">
                          Cheque
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {formData.paymentMethod ===
              "cheque" &&
              allowCheque && (
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-950">
                        Cheque Details
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Select the account
                        and add one or more
                        cheque numbers.
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full border-slate-200"
                      onClick={
                        handleAddChequeNumber
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Cheque
                    </Button>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label
                        htmlFor="account"
                        className="text-sm text-slate-700"
                      >
                        Select Account
                      </Label>

                      <Select
                        value={
                          formData.selectedAccountId
                        }
                        onValueChange={(
                          value,
                        ) => {
                          const account =
                            resolvedAccounts.find(
                              (
                                currentAccount,
                              ) =>
                                currentAccount.id ===
                                value,
                            ) ||
                            null;

                          setSelectedAccount(
                            account,
                          );

                          setFormData(
                            (previous) => ({
                              ...previous,
                              selectedAccountId:
                                value,
                            }),
                          );
                        }}
                      >
                        <SelectTrigger className="h-11 rounded-2xl border-slate-200">
                          <SelectValue
                            placeholder={
                              accountsLoading
                                ? "Loading accounts..."
                                : "Select account"
                            }
                          />
                        </SelectTrigger>

                        <SelectContent>
                          {resolvedAccounts.length ===
                          0 ? (
                            <SelectItem
                              value="__no_accounts__"
                              disabled
                            >
                              No active accounts
                              found
                            </SelectItem>
                          ) : (
                            resolvedAccounts.map(
                              (
                                account,
                              ) => (
                                <SelectItem
                                  key={
                                    account.id
                                  }
                                  value={
                                    account.id
                                  }
                                >
                                  {account.accountName ||
                                    account.id}
                                </SelectItem>
                              ),
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedAccount && (
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <h3 className="mb-4 text-sm font-semibold text-slate-950">
                          Account Information
                        </h3>

                        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                              Account Name
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                              {selectedAccount.accountName ||
                                "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                              Account Number
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                              {selectedAccount.accountNumber ||
                                "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                              Bank
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                              {selectedAccount.bankName ||
                                "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                              Balance
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                              Rs{" "}
                              {formatPKR(
                                selectedAccount.currentBalance ??
                                  selectedAccount.balance ??
                                  0,
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <Label className="text-sm text-slate-700">
                        Cheque Numbers
                      </Label>

                      {formData.chequeNumbers.map(
                        (
                          chequeNumber,
                          index,
                        ) => {
                          const warning =
                            getChequeNumberWarning(
                              chequeNumber,
                              index,
                            );

                          return (
                            <div
                              key={
                                index
                              }
                              className="flex flex-col gap-2 sm:flex-row sm:items-start"
                            >
                              <div className="flex-1">
                                <Input
                                  value={
                                    chequeNumber
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    handleChequeNumberChange(
                                      index,
                                      event
                                        .target
                                        .value,
                                    )
                                  }
                                  placeholder={`Enter cheque number ${
                                    index +
                                    1
                                  }`}
                                  className={`h-11 rounded-2xl ${
                                    warning
                                      ? "border-amber-400 bg-amber-50"
                                      : "border-slate-200"
                                  }`}
                                />

                                {warning && (
                                  <p className="mt-1 text-xs font-medium text-amber-700">
                                    {
                                      warning
                                    }
                                  </p>
                                )}
                              </div>

                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-11 w-11 shrink-0 rounded-2xl border-slate-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() =>
                                  handleRemoveChequeNumber(
                                    index,
                                  )
                                }
                                disabled={
                                  formData
                                    .chequeNumbers
                                    .length ===
                                  1
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        },
                      )}

                      {chequeValidationLoading && (
                        <p className="text-xs text-slate-500">
                          Checking existing
                          cheque numbers...
                        </p>
                      )}

                      {hasDuplicateChequeNumbers && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                          This cheque number
                          already exists:{" "}
                          {duplicateChequeNumbers.join(
                            ", ",
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-6 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <ReceiptText className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Reference & Notes
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Add transaction
                    reference, upload
                    receipts, and write
                    payment notes.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="transactionName"
                    className="text-sm text-slate-700"
                  >
                    Transaction Name
                  </Label>

                  <Input
                    id="transactionName"
                    value={
                      formData.transactionName
                    }
                    onChange={(event) =>
                      setFormData(
                        (previous) => ({
                          ...previous,
                          transactionName:
                            event.target
                              .value,
                        }),
                      )
                    }
                    placeholder="Enter transaction name"
                    className="h-11 rounded-2xl border-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="transactionReference"
                    className="text-sm text-slate-700"
                  >
                    Transaction Reference
                  </Label>

                  <Input
                    id="transactionReference"
                    value={
                      formData.transactionReference
                    }
                    onChange={(event) =>
                      setFormData(
                        (previous) => ({
                          ...previous,
                          transactionReference:
                            event.target
                              .value,
                        }),
                      )
                    }
                    placeholder="Enter transaction reference"
                    className="h-11 rounded-2xl border-slate-200"
                  />
                </div>

                {allowReceiptUpload && (
                  <div className="space-y-3">
                    <Label
                      htmlFor="receipt"
                      className="text-sm text-slate-700"
                    >
                      Upload Receipt /
                      Cheque Copies
                    </Label>

                    <label
                      htmlFor="receipt"
                      className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-slate-400 hover:bg-slate-100"
                    >
                      <FileUp className="h-8 w-8 text-slate-500" />

                      <p className="mt-3 text-sm font-semibold text-slate-800">
                        Click to upload
                        files
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        JPG, PNG, or PDF.
                        Multiple files are
                        allowed.
                      </p>

                      <Input
                        id="receipt"
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        multiple
                        onChange={
                          handleReceiptFilesChange
                        }
                        className="hidden"
                      />
                    </label>

                    {receiptFiles.length >
                      0 && (
                      <div className="space-y-2">
                        {receiptFiles.map(
                          (
                            file,
                            index,
                          ) => (
                            <div
                              key={`${file.name}-${index}`}
                              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                            >
                              <div className="min-w-0">
                                <p className="truncate font-medium text-slate-900">
                                  {index +
                                    1}
                                  .{" "}
                                  {
                                    file.name
                                  }
                                </p>

                                <p className="text-xs text-slate-500">
                                  {getFileSizeLabel(
                                    file.size,
                                  )}
                                </p>
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 shrink-0 rounded-full text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() =>
                                  handleRemoveReceiptFile(
                                    index,
                                  )
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label
                    htmlFor="paymentNotes"
                    className="text-sm text-slate-700"
                  >
                    Payment Notes
                  </Label>

                  <Textarea
                    id="paymentNotes"
                    rows={5}
                    value={
                      formData.paymentNotes
                    }
                    onChange={(event) =>
                      setFormData(
                        (previous) => ({
                          ...previous,
                          paymentNotes:
                            event.target
                              .value,
                        }),
                      )
                    }
                    placeholder="Add any notes..."
                    className="rounded-2xl border-slate-200"
                  />
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-950">
                Release Summary
              </h2>

              <div className="mt-5 space-y-4 text-sm">
                {invoice && (
                  <>
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                      <span className="text-slate-500">
                        Approved
                      </span>

                      <span className="text-right font-semibold text-slate-950">
                        Rs{" "}
                        {formatPKR(
                          invoiceApprovedAmount,
                        )}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                      <span className="text-slate-500">
                        Released Before
                      </span>

                      <span className="text-right font-semibold text-slate-950">
                        Rs{" "}
                        {formatPKR(
                          totalReleasedAmount,
                        )}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <span className="text-slate-500">
                    This Release
                  </span>

                  <span className="text-right font-semibold text-slate-950">
                    Rs{" "}
                    {formatPKR(
                      formData.amount,
                    )}
                  </span>
                </div>

                {invoice && (
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                    <span className="text-slate-500">
                      Balance After
                    </span>

                    <span className="text-right font-semibold text-slate-950">
                      Rs{" "}
                      {formatPKR(
                        Math.max(
                          remainingReleaseAmount -
                            safeNumber(
                              formData.amount,
                            ),
                          0,
                        ),
                      )}
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <span className="text-slate-500">
                    Transaction Name
                  </span>

                  <span className="max-w-[190px] text-right font-semibold text-slate-950">
                    {formData.transactionName.trim() ||
                      "-"}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <span className="text-slate-500">
                    Method
                  </span>

                  <span className="text-right font-semibold text-slate-950">
                    {getPaymentMethodLabel(
                      formData.paymentMethod,
                    )}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <span className="text-slate-500">
                    {resolvedPartyLabel}
                  </span>

                  <span className="max-w-[190px] text-right font-semibold text-slate-950">
                    {resolvedParties.length
                      ? resolvedParties.join(
                          ", ",
                        )
                      : "-"}
                  </span>
                </div>

                {formData.paymentMethod ===
                  "cheque" && (
                  <>
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                      <span className="text-slate-500">
                        Account
                      </span>

                      <span className="max-w-[190px] text-right font-semibold text-slate-950">
                        {selectedAccount?.accountName ||
                          "-"}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                      <span className="text-slate-500">
                        Cheques
                      </span>

                      <span className="text-right font-semibold text-slate-950">
                        {
                          cleanChequeNumbers(
                            formData.chequeNumbers,
                          ).length
                        }
                      </span>
                    </div>
                  </>
                )}

                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">
                    Files
                  </span>

                  <span className="text-right font-semibold text-slate-950">
                    {receiptFiles.length}
                  </span>
                </div>
              </div>
            </section>

            {paymentReleaseHistory.length >
              0 && (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold text-slate-950">
                  Payment Release History
                </h2>

                <div className="mt-4 space-y-3">
                  {[
                    ...paymentReleaseHistory,
                  ]
                    .reverse()
                    .map(
                      (
                        entry: any,
                        index: number,
                      ) => (
                        <div
                          key={
                            entry?.id ||
                            `${
                              entry?.releasedAt ||
                              "release"
                            }-${index}`
                          }
                          className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-950">
                                Rs{" "}
                                {formatPKR(
                                  getPaymentReleaseAmount(
                                    entry,
                                  ),
                                )}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {getPaymentMethodLabel(
                                  entry?.paymentMethod,
                                )}{" "}
                                •{" "}
                                {getReleaseDateLabel(
                                  entry?.releasedAt,
                                )}
                              </p>
                            </div>

                            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                              {entry?.releaseType ||
                                "release"}
                            </span>
                          </div>

                          <div className="mt-3 space-y-1 text-xs text-slate-500">
                            <p>
                              Released By:{" "}
                              {entry?.releasedByName ||
                                "-"}
                            </p>

                            {entry?.transactionName && (
                              <p>
                                Transaction:{" "}
                                {
                                  entry.transactionName
                                }
                              </p>
                            )}

                            {entry?.transactionReference && (
                              <p>
                                Reference:{" "}
                                {
                                  entry.transactionReference
                                }
                              </p>
                            )}

                            {Array.isArray(
                              entry?.chequeNumbers,
                            ) &&
                              entry
                                .chequeNumbers
                                .length >
                                0 && (
                                <p>
                                  Cheques:{" "}
                                  {entry.chequeNumbers.join(
                                    ", ",
                                  )}
                                </p>
                              )}

                            {entry?.paymentNotes && (
                              <p>
                                Notes:{" "}
                                {
                                  entry.paymentNotes
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      ),
                    )}
                </div>
              </section>
            )}

            <section className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
              <h3 className="text-sm font-semibold text-blue-950">
                Before releasing
              </h3>

              <ul className="mt-3 space-y-2 text-sm text-blue-800">
                <li>
                  Confirm the release amount
                  is correct.
                </li>

                <li>
                  For cheque payment, add
                  all cheque numbers.
                </li>

                <li>
                  Upload receipt or cheque
                  copy files if available.
                </li>
              </ul>
            </section>
          </aside>
        </form>
      </main>
    </div>
  );
}