// import { FormEvent, useEffect, useMemo, useState } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import {
//   addDoc,
//   collection,
//   getDocs,
//   serverTimestamp,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
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
// import { useToast } from "@/hooks/use-toast";
// import { useLocation } from "wouter";

// type AccountType = "cheque" | "online";

// type FirestoreAccountData = {
//   accountTitle?: string;
//   accountNo?: string;
//   bank?: string;
//   branch?: string;
//   city?: string;
//   platform?: string;
//   routingNumber?: string;
//   isActive?: boolean;
//   createdBy?: string;
// };

// type AccountOption = {
//   id: string;
//   key: string;
//   type: AccountType;
//   accountTitle: string;
//   accountNo: string;
//   bank: string;
//   branch?: string;
//   city?: string;
//   platform?: string;
//   routingNumber?: string;
// };

// type RawAccountOption = AccountOption & {
//   isActive?: boolean;
// };

// type RecordItem = {
//   category: string;
//   amount: string;
//   name: string;
//   description: string;
// };

// type ItemField = keyof RecordItem;

// const RECORD_COLLECTION_PATH = ["Panels", "IEDGE-SYSTEM", "Record"] as const;

// const categoryOptions: string[] = [
//   "Utility",
//   "General",
//   "Tuition Fees",
//   "Payroll",
// ];

// const emptyItem: RecordItem = {
//   category: "",
//   amount: "",
//   name: "",
//   description: "",
// };

// export default function Record() {
//   const { userProfile } = useAuth();
//   const { toast } = useToast();
//   const [, setLocation] = useLocation();

//   const [accounts, setAccounts] = useState<AccountOption[]>([]);
//   const [accountsLoading, setAccountsLoading] = useState<boolean>(true);
//   const [selectedAccountKey, setSelectedAccountKey] = useState<string>("");

//   const [chequeAmount, setChequeAmount] = useState<string>("");
//   const [items, setItems] = useState<RecordItem[]>([{ ...emptyItem }]);

//   const [loading, setLoading] = useState<boolean>(false);
//   const [submitError, setSubmitError] = useState<string>("");

//   const getErrorMessage = (error: unknown): string => {
//     if (error instanceof Error) return error.message;
//     return "Something went wrong";
//   };

//   useEffect(() => {
//     let isMounted = true;

//     async function fetchAccounts() {
//       try {
//         setAccountsLoading(true);

//         const [chequeSnapshot, onlineSnapshot] = await Promise.all([
//           getDocs(collection(db, "chequeAccounts")),
//           getDocs(collection(db, "onlineAccounts")),
//         ]);

//         const chequeAccountsRaw: RawAccountOption[] = chequeSnapshot.docs.map(
//           (doc) => {
//             const data = doc.data() as FirestoreAccountData;

//             return {
//               id: doc.id,
//               key: `cheque-${doc.id}`,
//               type: "cheque",
//               accountTitle: data.accountTitle || "Untitled Account",
//               accountNo: data.accountNo || "",
//               bank: data.bank || "",
//               branch: data.branch || "",
//               city: data.city || "",
//               isActive: data.isActive,
//             };
//           }
//         );

//         const onlineAccountsRaw: RawAccountOption[] = onlineSnapshot.docs.map(
//           (doc) => {
//             const data = doc.data() as FirestoreAccountData;

//             return {
//               id: doc.id,
//               key: `online-${doc.id}`,
//               type: "online",
//               accountTitle: data.accountTitle || "Untitled Account",
//               accountNo: data.accountNo || "",
//               bank: data.bank || "",
//               platform: data.platform || "",
//               routingNumber: data.routingNumber || "",
//               isActive: data.isActive,
//             };
//           }
//         );

//         const activeChequeAccounts: AccountOption[] = chequeAccountsRaw
//           .filter((account) => account.isActive !== false)
//           .map(({ isActive, ...account }) => account);

//         const activeOnlineAccounts: AccountOption[] = onlineAccountsRaw
//           .filter((account) => account.isActive !== false)
//           .map(({ isActive, ...account }) => account);

//         const mergedAccounts = [
//           ...activeChequeAccounts,
//           ...activeOnlineAccounts,
//         ].sort((a, b) => a.accountTitle.localeCompare(b.accountTitle));

//         if (isMounted) {
//           setAccounts(mergedAccounts);
//         }
//       } catch (error) {
//         console.error("Failed to fetch accounts:", error);

//         toast({
//           title: "Error",
//           description: getErrorMessage(error) || "Failed to fetch accounts",
//           variant: "destructive",
//         });
//       } finally {
//         if (isMounted) {
//           setAccountsLoading(false);
//         }
//       }
//     }

//     fetchAccounts();

//     return () => {
//       isMounted = false;
//     };
//   }, [toast]);

//   const selectedAccount = useMemo<AccountOption | null>(() => {
//     return (
//       accounts.find((account) => account.key === selectedAccountKey) || null
//     );
//   }, [accounts, selectedAccountKey]);

//   const totalItemAmount = useMemo<number>(() => {
//     return items.reduce((total, item) => {
//       return total + (Number(item.amount) || 0);
//     }, 0);
//   }, [items]);

//   const chequeValue = Number(chequeAmount) || 0;
//   const remainingBalance = chequeValue - totalItemAmount;
//   const isExceeded = chequeValue > 0 && totalItemAmount > chequeValue;

//   const formatAmount = (value: number): string => {
//     return value.toLocaleString("en-US", {
//       maximumFractionDigits: 2,
//     });
//   };

//   const sanitizeAmount = (value: string): string => {
//     let cleanValue = value.replace(/[^0-9.]/g, "");

//     const parts = cleanValue.split(".");
//     if (parts.length > 2) {
//       cleanValue = `${parts[0]}.${parts.slice(1).join("")}`;
//     }

//     return cleanValue;
//   };

//   const handleChequeAmountChange = (value: string) => {
//     setChequeAmount(sanitizeAmount(value));
//     setSubmitError("");
//   };

//   const handleItemChange = (
//     index: number,
//     field: ItemField,
//     value: string
//   ) => {
//     const updatedItems = [...items];

//     updatedItems[index] = {
//       ...updatedItems[index],
//       [field]: field === "amount" ? sanitizeAmount(value) : value,
//     };

//     setItems(updatedItems);
//     setSubmitError("");
//   };

//   const handleAddItem = () => {
//     setItems((prevItems) => [...prevItems, { ...emptyItem }]);
//     setSubmitError("");
//   };

//   const handleRemoveItem = (index: number) => {
//     if (items.length === 1) return;

//     const updatedItems = items.filter((_, itemIndex) => itemIndex !== index);
//     setItems(updatedItems);
//     setSubmitError("");
//   };

//   const resetForm = () => {
//     setSelectedAccountKey("");
//     setChequeAmount("");
//     setItems([{ ...emptyItem }]);
//     setSubmitError("");
//   };

//   const validateForm = (): string => {
//     if (!selectedAccount) {
//       return "Please select an account.";
//     }

//     if (!chequeAmount || chequeValue <= 0) {
//       return "Please enter a valid cheque amount.";
//     }

//     for (let i = 0; i < items.length; i++) {
//       const item = items[i];

//       if (!item.category) {
//         return `Please select a category for item ${i + 1}.`;
//       }

//       if (!item.name.trim()) {
//         return `Please enter a name for item ${i + 1}.`;
//       }

//       if (!item.amount || Number(item.amount) <= 0) {
//         return `Please enter a valid amount for item ${i + 1}.`;
//       }
//     }

//     if (totalItemAmount > chequeValue) {
//       return "The total item amount exceeds the cheque amount. Cheque amount is not sufficient for the entered items.";
//     }

//     return "";
//   };

//   async function handleSubmit(e: FormEvent<HTMLFormElement>) {
//     e.preventDefault();

//     const error = validateForm();

//     if (error) {
//       setSubmitError(error);

//       toast({
//         title: "Error",
//         description: error,
//         variant: "destructive",
//       });

//       return;
//     }

//     if (!selectedAccount) return;

//     try {
//       setLoading(true);

//       const profileData = userProfile as {
//         id?: string;
//         name?: string;
//         displayName?: string;
//         email?: string;
//       } | null;

//       const payload = {
//         firebasePath: "/Panels/IEDGE-SYSTEM/Record",

//         accountId: selectedAccount.id,
//         accountType: selectedAccount.type,
//         accountTitle: selectedAccount.accountTitle,
//         accountNo: selectedAccount.accountNo,
//         bank: selectedAccount.bank,
//         branch: selectedAccount.branch || "",
//         city: selectedAccount.city || "",
//         platform: selectedAccount.platform || "",
//         routingNumber: selectedAccount.routingNumber || "",

//         chequeAmount: chequeValue,
//         totalItemAmount,
//         remainingBalance,

//         items: items.map((item) => ({
//           category: item.category,
//           name: item.name.trim(),
//           amount: Number(item.amount),
//           description: item.description.trim(),
//         })),

//         createdBy: profileData?.id || "",
//         createdByName:
//           profileData?.name ||
//           profileData?.displayName ||
//           profileData?.email ||
//           "Unknown User",

//         createdAt: serverTimestamp(),
//         updatedAt: serverTimestamp(),
//         status: "active",
//       };

//       await addDoc(collection(db, ...RECORD_COLLECTION_PATH), payload);

//       toast({
//         title: "Success",
//         description: "Record added successfully",
//       });

//       resetForm();

//       window.location.reload();
//     } catch (error) {
//       console.error("Failed to add record:", error);

//       toast({
//         title: "Error",
//         description: getErrorMessage(error) || "Failed to add record",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="mx-auto max-w-6xl">
//       <div className="mb-8">
//         <h2
//           className="mb-2 text-3xl font-bold text-foreground"
//           data-testid="text-record-title"
//         >
//           Record
//         </h2>

//         <p className="text-muted-foreground">
//           Select an account, enter cheque amount, and add one or more record
//           items.
//         </p>
//       </div>

//       <form onSubmit={handleSubmit} className="space-y-6">
//         <Card>
//           <CardHeader>
//             <CardTitle>Cheque Information</CardTitle>
//           </CardHeader>

//           <CardContent>
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//               <div>
//                 <Label>Account Select *</Label>

//                 <Select
//                   value={selectedAccountKey}
//                   onValueChange={(value: string) => {
//                     setSelectedAccountKey(value);
//                     setSubmitError("");
//                   }}
//                   disabled={accountsLoading}
//                 >
//                   <SelectTrigger data-testid="select-account">
//                     <SelectValue
//                       placeholder={
//                         accountsLoading
//                           ? "Loading accounts..."
//                           : "Select account"
//                       }
//                     />
//                   </SelectTrigger>

//                   <SelectContent>
//                     {accounts.map((account) => (
//                       <SelectItem key={account.key} value={account.key}>
//                         {account.accountTitle} - {account.bank} -{" "}
//                         {account.accountNo} (
//                         {account.type === "cheque" ? "Cheque" : "Online"})
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>

//                 {!accountsLoading && accounts.length === 0 && (
//                   <p className="mt-2 text-sm text-destructive">
//                     No active accounts found. Please add an account first.
//                   </p>
//                 )}
//               </div>

//               <div>
//                 <Label htmlFor="chequeAmount">Cheque Amount *</Label>

//                 <Input
//                   id="chequeAmount"
//                   value={chequeAmount}
//                   onChange={(e) => handleChequeAmountChange(e.target.value)}
//                   placeholder="Enter cheque amount"
//                   data-testid="input-cheque-amount"
//                 />
//               </div>
//             </div>

//             {selectedAccount && (
//               <div className="mt-5 rounded-xl border bg-muted/40 p-4">
//                 <p className="text-sm font-semibold text-foreground">
//                   Selected Account Details
//                 </p>

//                 <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
//                   <div>
//                     <p className="text-muted-foreground">Account Title</p>
//                     <p className="font-medium">
//                       {selectedAccount.accountTitle}
//                     </p>
//                   </div>

//                   <div>
//                     <p className="text-muted-foreground">Bank</p>
//                     <p className="font-medium">{selectedAccount.bank}</p>
//                   </div>

//                   <div>
//                     <p className="text-muted-foreground">Account No</p>
//                     <p className="font-medium">{selectedAccount.accountNo}</p>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//               <CardTitle>Record Items</CardTitle>

//               <Button
//                 type="button"
//                 onClick={handleAddItem}
//                 data-testid="button-add-item"
//               >
//                 Add New Item
//               </Button>
//             </div>
//           </CardHeader>

//           <CardContent className="space-y-4">
//             {items.map((item, index) => (
//               <div key={index} className="rounded-xl border bg-muted/30 p-4">
//                 <div className="mb-4 flex items-center justify-between">
//                   <h3 className="font-semibold text-foreground">
//                     Item {index + 1}
//                   </h3>

//                   {items.length > 1 && (
//                     <Button
//                       type="button"
//                       variant="outline"
//                       onClick={() => handleRemoveItem(index)}
//                       data-testid={`button-remove-item-${index}`}
//                     >
//                       Remove
//                     </Button>
//                   )}
//                 </div>

//                 <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
//                   <div>
//                     <Label>Category *</Label>

//                     <Select
//                       value={item.category}
//                       onValueChange={(value: string) =>
//                         handleItemChange(index, "category", value)
//                       }
//                     >
//                       <SelectTrigger data-testid={`select-category-${index}`}>
//                         <SelectValue placeholder="Select category" />
//                       </SelectTrigger>

//                       <SelectContent>
//                         {categoryOptions.map((category) => (
//                           <SelectItem key={category} value={category}>
//                             {category}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   <div>
//                     <Label>Amount *</Label>

//                     <Input
//                       value={item.amount}
//                       onChange={(e) =>
//                         handleItemChange(index, "amount", e.target.value)
//                       }
//                       placeholder="Enter amount"
//                       data-testid={`input-item-amount-${index}`}
//                     />
//                   </div>

//                   <div>
//                     <Label>Name *</Label>

//                     <Input
//                       value={item.name}
//                       onChange={(e) =>
//                         handleItemChange(index, "name", e.target.value)
//                       }
//                       placeholder="Enter name"
//                       data-testid={`input-item-name-${index}`}
//                     />
//                   </div>

//                   <div>
//                     <Label>Description</Label>

//                     <Input
//                       value={item.description}
//                       onChange={(e) =>
//                         handleItemChange(
//                           index,
//                           "description",
//                           e.target.value
//                         )
//                       }
//                       placeholder="Optional"
//                       data-testid={`input-item-description-${index}`}
//                     />
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle>Cheque Summary</CardTitle>
//           </CardHeader>

//           <CardContent>
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
//               <div className="rounded-xl border bg-muted/30 p-4">
//                 <p className="text-sm text-muted-foreground">Cheque Amount</p>
//                 <h3 className="mt-2 text-2xl font-bold">
//                   {formatAmount(chequeValue)}
//                 </h3>
//               </div>

//               <div className="rounded-xl border bg-muted/30 p-4">
//                 <p className="text-sm text-muted-foreground">
//                   Total Item Amount
//                 </p>
//                 <h3 className="mt-2 text-2xl font-bold">
//                   {formatAmount(totalItemAmount)}
//                 </h3>
//               </div>

//               <div
//                 className={`rounded-xl border p-4 ${
//                   isExceeded
//                     ? "border-red-200 bg-red-50"
//                     : remainingBalance === 0 && chequeValue > 0
//                     ? "border-emerald-200 bg-emerald-50"
//                     : "bg-muted/30"
//                 }`}
//               >
//                 <p
//                   className={`text-sm ${
//                     isExceeded
//                       ? "text-red-600"
//                       : remainingBalance === 0 && chequeValue > 0
//                       ? "text-emerald-700"
//                       : "text-muted-foreground"
//                   }`}
//                 >
//                   Remaining Balance
//                 </p>

//                 <h3
//                   className={`mt-2 text-2xl font-bold ${
//                     isExceeded
//                       ? "text-red-700"
//                       : remainingBalance === 0 && chequeValue > 0
//                       ? "text-emerald-700"
//                       : "text-foreground"
//                   }`}
//                 >
//                   {formatAmount(remainingBalance)}
//                 </h3>
//               </div>
//             </div>

//             {isExceeded && (
//               <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
//                 The total item amount exceeds the cheque amount. Cheque amount
//                 is not sufficient for the entered items.
//               </div>
//             )}

//             {submitError && (
//               <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
//                 {submitError}
//               </div>
//             )}

//             <div className="mt-6 flex justify-end gap-3">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => setLocation("/accounts")}
//                 data-testid="button-cancel-record"
//               >
//                 Cancel
//               </Button>

//               <Button
//                 type="submit"
//                 disabled={loading || isExceeded || accounts.length === 0}
//                 data-testid="button-save-record"
//               >
//                 {loading ? (
//                   <>
//                     <i className="fas fa-spinner fa-spin mr-2"></i>
//                     Saving...
//                   </>
//                 ) : (
//                   "Save Record"
//                 )}
//               </Button>
//             </div>
//           </CardContent>
//         </Card>
//       </form>
//     </div>
//   );
// }

// import { FormEvent, useEffect, useMemo, useState } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import {
//   addDoc,
//   collection,
//   getDocs,
//   serverTimestamp,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
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
// import { useToast } from "@/hooks/use-toast";
// import { useLocation } from "wouter";

// type AccountType = "cheque" | "online";

// type FirestoreAccountData = {
//   accountTitle?: string;
//   accountNo?: string;
//   bank?: string;
//   branch?: string;
//   city?: string;
//   platform?: string;
//   routingNumber?: string;
//   isActive?: boolean;
//   createdBy?: string;
// };

// type AccountOption = {
//   id: string;
//   key: string;
//   type: AccountType;
//   accountTitle: string;
//   accountNo: string;
//   bank: string;
//   branch?: string;
//   city?: string;
//   platform?: string;
//   routingNumber?: string;
// };

// type RawAccountOption = AccountOption & {
//   isActive?: boolean;
// };

// type RecordItem = {
//   category: string;
//   amount: string;
//   name: string;
//   description: string;
// };

// type ItemField = keyof RecordItem;

// const RECORD_COLLECTION_PATH = ["Panels", "IEDGE-SYSTEM", "Record"] as const;

// const categoryOptions: string[] = [
//   "Utility",
//   "General",
//   "Tuition Fees",
//   "Payroll",
// ];

// const emptyItem: RecordItem = {
//   category: "",
//   amount: "",
//   name: "",
//   description: "",
// };

// export default function Record() {
//   const { userProfile } = useAuth();
//   const { toast } = useToast();
//   const [, setLocation] = useLocation();

//   const [accounts, setAccounts] = useState<AccountOption[]>([]);
//   const [accountsLoading, setAccountsLoading] = useState<boolean>(true);
//   const [selectedAccountKey, setSelectedAccountKey] = useState<string>("");

//   const [chequeNumber, setChequeNumber] = useState<string>("");
//   const [chequeAmount, setChequeAmount] = useState<string>("");
//   const [items, setItems] = useState<RecordItem[]>([{ ...emptyItem }]);

//   const [loading, setLoading] = useState<boolean>(false);
//   const [submitError, setSubmitError] = useState<string>("");

//   const getErrorMessage = (error: unknown): string => {
//     if (error instanceof Error) return error.message;
//     return "Something went wrong";
//   };

//   useEffect(() => {
//     let isMounted = true;

//     async function fetchAccounts() {
//       try {
//         setAccountsLoading(true);

//         const [chequeSnapshot, onlineSnapshot] = await Promise.all([
//           getDocs(collection(db, "chequeAccounts")),
//           getDocs(collection(db, "onlineAccounts")),
//         ]);

//         const chequeAccountsRaw: RawAccountOption[] = chequeSnapshot.docs.map(
//           (doc) => {
//             const data = doc.data() as FirestoreAccountData;

//             return {
//               id: doc.id,
//               key: `cheque-${doc.id}`,
//               type: "cheque",
//               accountTitle: data.accountTitle || "Untitled Account",
//               accountNo: data.accountNo || "",
//               bank: data.bank || "",
//               branch: data.branch || "",
//               city: data.city || "",
//               isActive: data.isActive,
//             };
//           }
//         );

//         const onlineAccountsRaw: RawAccountOption[] = onlineSnapshot.docs.map(
//           (doc) => {
//             const data = doc.data() as FirestoreAccountData;

//             return {
//               id: doc.id,
//               key: `online-${doc.id}`,
//               type: "online",
//               accountTitle: data.accountTitle || "Untitled Account",
//               accountNo: data.accountNo || "",
//               bank: data.bank || "",
//               platform: data.platform || "",
//               routingNumber: data.routingNumber || "",
//               isActive: data.isActive,
//             };
//           }
//         );

//         const activeChequeAccounts: AccountOption[] = chequeAccountsRaw
//           .filter((account) => account.isActive !== false)
//           .map(({ isActive, ...account }) => account);

//         const activeOnlineAccounts: AccountOption[] = onlineAccountsRaw
//           .filter((account) => account.isActive !== false)
//           .map(({ isActive, ...account }) => account);

//         const mergedAccounts = [
//           ...activeChequeAccounts,
//           ...activeOnlineAccounts,
//         ].sort((a, b) => a.accountTitle.localeCompare(b.accountTitle));

//         if (isMounted) {
//           setAccounts(mergedAccounts);
//         }
//       } catch (error) {
//         console.error("Failed to fetch accounts:", error);

//         toast({
//           title: "Error",
//           description: getErrorMessage(error) || "Failed to fetch accounts",
//           variant: "destructive",
//         });
//       } finally {
//         if (isMounted) {
//           setAccountsLoading(false);
//         }
//       }
//     }

//     fetchAccounts();

//     return () => {
//       isMounted = false;
//     };
//   }, [toast]);

//   const selectedAccount = useMemo<AccountOption | null>(() => {
//     return (
//       accounts.find((account) => account.key === selectedAccountKey) || null
//     );
//   }, [accounts, selectedAccountKey]);

//   const totalItemAmount = useMemo<number>(() => {
//     return items.reduce((total, item) => {
//       return total + (Number(item.amount) || 0);
//     }, 0);
//   }, [items]);

//   const chequeValue = Number(chequeAmount) || 0;
//   const remainingBalance = chequeValue - totalItemAmount;
//   const isExceeded = chequeValue > 0 && totalItemAmount > chequeValue;

//   const formatAmount = (value: number): string => {
//     return value.toLocaleString("en-US", {
//       maximumFractionDigits: 2,
//     });
//   };

//   const sanitizeAmount = (value: string): string => {
//     let cleanValue = value.replace(/[^0-9.]/g, "");

//     const parts = cleanValue.split(".");
//     if (parts.length > 2) {
//       cleanValue = `${parts[0]}.${parts.slice(1).join("")}`;
//     }

//     return cleanValue;
//   };

//   const handleChequeAmountChange = (value: string) => {
//     setChequeAmount(sanitizeAmount(value));
//     setSubmitError("");
//   };

//   const handleChequeNumberChange = (value: string) => {
//     setChequeNumber(value);
//     setSubmitError("");
//   };

//   const handleItemChange = (
//     index: number,
//     field: ItemField,
//     value: string
//   ) => {
//     const updatedItems = [...items];

//     updatedItems[index] = {
//       ...updatedItems[index],
//       [field]: field === "amount" ? sanitizeAmount(value) : value,
//     };

//     setItems(updatedItems);
//     setSubmitError("");
//   };

//   const handleAddItem = () => {
//     setItems((prevItems) => [...prevItems, { ...emptyItem }]);
//     setSubmitError("");
//   };

//   const handleRemoveItem = (index: number) => {
//     if (items.length === 1) return;

//     const updatedItems = items.filter((_, itemIndex) => itemIndex !== index);
//     setItems(updatedItems);
//     setSubmitError("");
//   };

//   const resetForm = () => {
//     setSelectedAccountKey("");
//     setChequeNumber("");
//     setChequeAmount("");
//     setItems([{ ...emptyItem }]);
//     setSubmitError("");
//   };

//   const validateForm = (): string => {
//     if (!selectedAccount) {
//       return "Please select an account.";
//     }

//     if (!chequeNumber.trim()) {
//       return "Please enter cheque number.";
//     }

//     if (!chequeAmount || chequeValue <= 0) {
//       return "Please enter a valid cheque amount.";
//     }

//     for (let i = 0; i < items.length; i++) {
//       const item = items[i];

//       if (!item.category) {
//         return `Please select a category for item ${i + 1}.`;
//       }

//       if (!item.name.trim()) {
//         return `Please enter a name for item ${i + 1}.`;
//       }

//       if (!item.amount || Number(item.amount) <= 0) {
//         return `Please enter a valid amount for item ${i + 1}.`;
//       }
//     }

//     if (totalItemAmount > chequeValue) {
//       return "The total item amount exceeds the cheque amount. Cheque amount is not sufficient for the entered items.";
//     }

//     return "";
//   };

//   async function handleSubmit(e: FormEvent<HTMLFormElement>) {
//     e.preventDefault();

//     const error = validateForm();

//     if (error) {
//       setSubmitError(error);

//       toast({
//         title: "Error",
//         description: error,
//         variant: "destructive",
//       });

//       return;
//     }

//     if (!selectedAccount) return;

//     try {
//       setLoading(true);

//       const profileData = userProfile as {
//         id?: string;
//         name?: string;
//         displayName?: string;
//         email?: string;
//       } | null;

//       const payload = {
//         firebasePath: "/Panels/IEDGE-SYSTEM/Record",

//         accountId: selectedAccount.id,
//         accountType: selectedAccount.type,
//         accountTitle: selectedAccount.accountTitle,
//         accountNo: selectedAccount.accountNo,
//         bank: selectedAccount.bank,
//         branch: selectedAccount.branch || "",
//         city: selectedAccount.city || "",
//         platform: selectedAccount.platform || "",
//         routingNumber: selectedAccount.routingNumber || "",

//         chequeNumber: chequeNumber.trim(),
//         chequeAmount: chequeValue,
//         totalItemAmount,
//         remainingBalance,

//         items: items.map((item) => ({
//           category: item.category,
//           name: item.name.trim(),
//           amount: Number(item.amount),
//           description: item.description.trim(),
//         })),

//         createdBy: profileData?.id || "",
//         createdByName:
//           profileData?.name ||
//           profileData?.displayName ||
//           profileData?.email ||
//           "Unknown User",

//         createdAt: serverTimestamp(),
//         updatedAt: serverTimestamp(),
//         status: "active",
//       };

//       await addDoc(collection(db, ...RECORD_COLLECTION_PATH), payload);

//       toast({
//         title: "Success",
//         description: "Record added successfully",
//       });

//       resetForm();

//       window.location.reload();
//     } catch (error) {
//       console.error("Failed to add record:", error);

//       toast({
//         title: "Error",
//         description: getErrorMessage(error) || "Failed to add record",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="mx-auto max-w-6xl">
//       <div className="mb-8">
//         <h2
//           className="mb-2 text-3xl font-bold text-foreground"
//           data-testid="text-record-title"
//         >
//           Record
//         </h2>

//         <p className="text-muted-foreground">
//           Select an account, enter cheque details, and add one or more record
//           items.
//         </p>
//       </div>

//       <form onSubmit={handleSubmit} className="space-y-6">
//         <Card>
//           <CardHeader>
//             <CardTitle>Cheque Information</CardTitle>
//           </CardHeader>

//           <CardContent>
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
//               <div>
//                 <Label>Account Select *</Label>

//                 <Select
//                   value={selectedAccountKey}
//                   onValueChange={(value: string) => {
//                     setSelectedAccountKey(value);
//                     setSubmitError("");
//                   }}
//                   disabled={accountsLoading}
//                 >
//                   <SelectTrigger data-testid="select-account">
//                     <SelectValue
//                       placeholder={
//                         accountsLoading
//                           ? "Loading accounts..."
//                           : "Select account"
//                       }
//                     />
//                   </SelectTrigger>

//                   <SelectContent>
//                     {accounts.map((account) => (
//                       <SelectItem key={account.key} value={account.key}>
//                         {account.accountTitle} - {account.bank} -{" "}
//                         {account.accountNo} (
//                         {account.type === "cheque" ? "Cheque" : "Online"})
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>

//                 {!accountsLoading && accounts.length === 0 && (
//                   <p className="mt-2 text-sm text-destructive">
//                     No active accounts found. Please add an account first.
//                   </p>
//                 )}
//               </div>

//               <div>
//                 <Label htmlFor="chequeNumber">Cheque Number *</Label>

//                 <Input
//                   id="chequeNumber"
//                   value={chequeNumber}
//                   onChange={(e) => handleChequeNumberChange(e.target.value)}
//                   placeholder="Enter cheque number"
//                   data-testid="input-cheque-number"
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="chequeAmount">Cheque Amount *</Label>

//                 <Input
//                   id="chequeAmount"
//                   value={chequeAmount}
//                   onChange={(e) => handleChequeAmountChange(e.target.value)}
//                   placeholder="Enter cheque amount"
//                   data-testid="input-cheque-amount"
//                 />
//               </div>
//             </div>

//             {selectedAccount && (
//               <div className="mt-5 rounded-xl border bg-muted/40 p-4">
//                 <p className="text-sm font-semibold text-foreground">
//                   Selected Account Details
//                 </p>

//                 <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
//                   <div>
//                     <p className="text-muted-foreground">Account Title</p>
//                     <p className="font-medium">
//                       {selectedAccount.accountTitle}
//                     </p>
//                   </div>

//                   <div>
//                     <p className="text-muted-foreground">Bank</p>
//                     <p className="font-medium">{selectedAccount.bank}</p>
//                   </div>

//                   <div>
//                     <p className="text-muted-foreground">Account No</p>
//                     <p className="font-medium">{selectedAccount.accountNo}</p>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//               <CardTitle>Record Items</CardTitle>

//               <Button
//                 type="button"
//                 onClick={handleAddItem}
//                 data-testid="button-add-item"
//               >
//                 Add New Item
//               </Button>
//             </div>
//           </CardHeader>

//           <CardContent className="space-y-4">
//             {items.map((item, index) => (
//               <div key={index} className="rounded-xl border bg-muted/30 p-4">
//                 <div className="mb-4 flex items-center justify-between">
//                   <h3 className="font-semibold text-foreground">
//                     Item {index + 1}
//                   </h3>

//                   {items.length > 1 && (
//                     <Button
//                       type="button"
//                       variant="outline"
//                       onClick={() => handleRemoveItem(index)}
//                       data-testid={`button-remove-item-${index}`}
//                     >
//                       Remove
//                     </Button>
//                   )}
//                 </div>

//                 <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
//                   <div>
//                     <Label>Category *</Label>

//                     <Select
//                       value={item.category}
//                       onValueChange={(value: string) =>
//                         handleItemChange(index, "category", value)
//                       }
//                     >
//                       <SelectTrigger data-testid={`select-category-${index}`}>
//                         <SelectValue placeholder="Select category" />
//                       </SelectTrigger>

//                       <SelectContent>
//                         {categoryOptions.map((category) => (
//                           <SelectItem key={category} value={category}>
//                             {category}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   <div>
//                     <Label>Amount *</Label>

//                     <Input
//                       value={item.amount}
//                       onChange={(e) =>
//                         handleItemChange(index, "amount", e.target.value)
//                       }
//                       placeholder="Enter amount"
//                       data-testid={`input-item-amount-${index}`}
//                     />
//                   </div>

//                   <div>
//                     <Label>Name *</Label>

//                     <Input
//                       value={item.name}
//                       onChange={(e) =>
//                         handleItemChange(index, "name", e.target.value)
//                       }
//                       placeholder="Enter name"
//                       data-testid={`input-item-name-${index}`}
//                     />
//                   </div>

//                   <div>
//                     <Label>Description</Label>

//                     <Input
//                       value={item.description}
//                       onChange={(e) =>
//                         handleItemChange(
//                           index,
//                           "description",
//                           e.target.value
//                         )
//                       }
//                       placeholder="Optional"
//                       data-testid={`input-item-description-${index}`}
//                     />
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle>Cheque Summary</CardTitle>
//           </CardHeader>

//           <CardContent>
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
//               <div className="rounded-xl border bg-muted/30 p-4">
//                 <p className="text-sm text-muted-foreground">Cheque Amount</p>
//                 <h3 className="mt-2 text-2xl font-bold">
//                   {formatAmount(chequeValue)}
//                 </h3>
//               </div>

//               <div className="rounded-xl border bg-muted/30 p-4">
//                 <p className="text-sm text-muted-foreground">
//                   Total Item Amount
//                 </p>
//                 <h3 className="mt-2 text-2xl font-bold">
//                   {formatAmount(totalItemAmount)}
//                 </h3>
//               </div>

//               <div
//                 className={`rounded-xl border p-4 ${
//                   isExceeded
//                     ? "border-red-200 bg-red-50"
//                     : remainingBalance === 0 && chequeValue > 0
//                     ? "border-emerald-200 bg-emerald-50"
//                     : "bg-muted/30"
//                 }`}
//               >
//                 <p
//                   className={`text-sm ${
//                     isExceeded
//                       ? "text-red-600"
//                       : remainingBalance === 0 && chequeValue > 0
//                       ? "text-emerald-700"
//                       : "text-muted-foreground"
//                   }`}
//                 >
//                   Remaining Balance
//                 </p>

//                 <h3
//                   className={`mt-2 text-2xl font-bold ${
//                     isExceeded
//                       ? "text-red-700"
//                       : remainingBalance === 0 && chequeValue > 0
//                       ? "text-emerald-700"
//                       : "text-foreground"
//                   }`}
//                 >
//                   {formatAmount(remainingBalance)}
//                 </h3>
//               </div>
//             </div>

//             {isExceeded && (
//               <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
//                 The total item amount exceeds the cheque amount. Cheque amount
//                 is not sufficient for the entered items.
//               </div>
//             )}

//             {submitError && (
//               <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
//                 {submitError}
//               </div>
//             )}

//             <div className="mt-6 flex justify-end gap-3">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => setLocation("/accounts")}
//                 data-testid="button-cancel-record"
//               >
//                 Cancel
//               </Button>

//               <Button
//                 type="submit"
//                 disabled={loading || isExceeded || accounts.length === 0}
//                 data-testid="button-save-record"
//               >
//                 {loading ? (
//                   <>
//                     <i className="fas fa-spinner fa-spin mr-2"></i>
//                     Saving...
//                   </>
//                 ) : (
//                   "Save Record"
//                 )}
//               </Button>
//             </div>
//           </CardContent>
//         </Card>
//       </form>
//     </div>
//   );
// }




// import { FormEvent, useEffect, useMemo, useState } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import {
//   addDoc,
//   collection,
//   getDocs,
//   serverTimestamp,
//   Timestamp,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
// import { useToast } from "@/hooks/use-toast";
// import { useLocation } from "wouter";

// type AccountType = "cheque" | "online";

// type FirestoreAccountData = {
//   accountTitle?: string;
//   accountNo?: string;
//   bank?: string;
//   branch?: string;
//   city?: string;
//   platform?: string;
//   routingNumber?: string;
//   isActive?: boolean;
//   createdBy?: string;
// };

// type AccountOption = {
//   id: string;
//   key: string;
//   type: AccountType;
//   accountTitle: string;
//   accountNo: string;
//   bank: string;
//   branch?: string;
//   city?: string;
//   platform?: string;
//   routingNumber?: string;
// };

// type RawAccountOption = AccountOption & {
//   isActive?: boolean;
// };

// type RecordItem = {
//   category: string;
//   amount: string;
//   name: string;
//   description: string;
// };

// type ItemField = keyof RecordItem;

// const RECORD_COLLECTION_PATH = ["Panels", "IEDGE-SYSTEM", "Record"] as const;

// const categoryOptions: string[] = [
//   "Utility",
//   "General",
//   "Tuition Fees",
//   "Payroll",
//   "Travel",
//   "Accommodation",
//   "Hotel",
//   "Ticketing",
// ];

// const emptyItem: RecordItem = {
//   category: "",
//   amount: "",
//   name: "",
//   description: "",
// };

// const getTodayDate = (): string => {
//   const today = new Date();
//   const year = today.getFullYear();
//   const month = String(today.getMonth() + 1).padStart(2, "0");
//   const day = String(today.getDate()).padStart(2, "0");

//   return `${year}-${month}-${day}`;
// };

// const getFirestoreTimestampFromDate = (dateValue: string): Timestamp => {
//   const [year, month, day] = dateValue.split("-").map(Number);

//   return Timestamp.fromDate(new Date(year, month - 1, day, 0, 0, 0));
// };

// export default function Record() {
//   const { userProfile } = useAuth();
//   const { toast } = useToast();
//   const [, setLocation] = useLocation();

//   const todayDate = getTodayDate();

//   const [accounts, setAccounts] = useState<AccountOption[]>([]);
//   const [accountsLoading, setAccountsLoading] = useState<boolean>(true);
//   const [selectedAccountKey, setSelectedAccountKey] = useState<string>("");

//   const [chequeNumber, setChequeNumber] = useState<string>("");
//   const [selectedDate, setSelectedDate] = useState<string>(todayDate);
//   const [chequeAmount, setChequeAmount] = useState<string>("");
//   const [items, setItems] = useState<RecordItem[]>([{ ...emptyItem }]);

//   const [loading, setLoading] = useState<boolean>(false);
//   const [submitError, setSubmitError] = useState<string>("");

//   const getErrorMessage = (error: unknown): string => {
//     if (error instanceof Error) return error.message;
//     return "Something went wrong";
//   };

//   useEffect(() => {
//     let isMounted = true;

//     async function fetchAccounts() {
//       try {
//         setAccountsLoading(true);

//         const [chequeSnapshot, onlineSnapshot] = await Promise.all([
//           getDocs(collection(db, "chequeAccounts")),
//           getDocs(collection(db, "onlineAccounts")),
//         ]);

//         const chequeAccountsRaw: RawAccountOption[] = chequeSnapshot.docs.map(
//           (doc) => {
//             const data = doc.data() as FirestoreAccountData;

//             return {
//               id: doc.id,
//               key: `cheque-${doc.id}`,
//               type: "cheque",
//               accountTitle: data.accountTitle || "Untitled Account",
//               accountNo: data.accountNo || "",
//               bank: data.bank || "",
//               branch: data.branch || "",
//               city: data.city || "",
//               isActive: data.isActive,
//             };
//           },
//         );

//         const onlineAccountsRaw: RawAccountOption[] = onlineSnapshot.docs.map(
//           (doc) => {
//             const data = doc.data() as FirestoreAccountData;

//             return {
//               id: doc.id,
//               key: `online-${doc.id}`,
//               type: "online",
//               accountTitle: data.accountTitle || "Untitled Account",
//               accountNo: data.accountNo || "",
//               bank: data.bank || "",
//               platform: data.platform || "",
//               routingNumber: data.routingNumber || "",
//               isActive: data.isActive,
//             };
//           },
//         );

//         const activeChequeAccounts: AccountOption[] = chequeAccountsRaw
//           .filter((account) => account.isActive !== false)
//           .map(({ isActive, ...account }) => account);

//         const activeOnlineAccounts: AccountOption[] = onlineAccountsRaw
//           .filter((account) => account.isActive !== false)
//           .map(({ isActive, ...account }) => account);

//         const mergedAccounts = [
//           ...activeChequeAccounts,
//           ...activeOnlineAccounts,
//         ].sort((a, b) => a.accountTitle.localeCompare(b.accountTitle));

//         if (isMounted) {
//           setAccounts(mergedAccounts);
//         }
//       } catch (error) {
//         console.error("Failed to fetch accounts:", error);

//         toast({
//           title: "Error",
//           description: getErrorMessage(error) || "Failed to fetch accounts",
//           variant: "destructive",
//         });
//       } finally {
//         if (isMounted) {
//           setAccountsLoading(false);
//         }
//       }
//     }

//     fetchAccounts();

//     return () => {
//       isMounted = false;
//     };
//   }, [toast]);

//   const selectedAccount = useMemo<AccountOption | null>(() => {
//     return (
//       accounts.find((account) => account.key === selectedAccountKey) || null
//     );
//   }, [accounts, selectedAccountKey]);

//   const totalItemAmount = useMemo<number>(() => {
//     return items.reduce((total, item) => {
//       return total + (Number(item.amount) || 0);
//     }, 0);
//   }, [items]);

//   const chequeValue = Number(chequeAmount) || 0;
//   const remainingBalance = chequeValue - totalItemAmount;
//   const isExceeded = chequeValue > 0 && totalItemAmount > chequeValue;

//   const formatAmount = (value: number): string => {
//     return value.toLocaleString("en-US", {
//       maximumFractionDigits: 2,
//     });
//   };

//   const sanitizeAmount = (value: string): string => {
//     let cleanValue = value.replace(/[^0-9.]/g, "");

//     const parts = cleanValue.split(".");
//     if (parts.length > 2) {
//       cleanValue = `${parts[0]}.${parts.slice(1).join("")}`;
//     }

//     return cleanValue;
//   };

//   const handleChequeNumberChange = (value: string) => {
//     setChequeNumber(value);
//     setSubmitError("");
//   };

//   const handleDateChange = (value: string) => {
//     setSelectedDate(value);
//     setSubmitError("");
//   };

//   const handleChequeAmountChange = (value: string) => {
//     setChequeAmount(sanitizeAmount(value));
//     setSubmitError("");
//   };

//   const handleItemChange = (index: number, field: ItemField, value: string) => {
//     const updatedItems = [...items];

//     updatedItems[index] = {
//       ...updatedItems[index],
//       [field]: field === "amount" ? sanitizeAmount(value) : value,
//     };

//     setItems(updatedItems);
//     setSubmitError("");
//   };

//   const handleAddItem = () => {
//     setItems((prevItems) => [...prevItems, { ...emptyItem }]);
//     setSubmitError("");
//   };

//   const handleRemoveItem = (index: number) => {
//     if (items.length === 1) return;

//     const updatedItems = items.filter((_, itemIndex) => itemIndex !== index);
//     setItems(updatedItems);
//     setSubmitError("");
//   };

//   const resetForm = () => {
//     setSelectedAccountKey("");
//     setChequeNumber("");
//     setSelectedDate(getTodayDate());
//     setChequeAmount("");
//     setItems([{ ...emptyItem }]);
//     setSubmitError("");
//   };

//   const validateForm = (): string => {
//     if (!selectedAccount) {
//       return "Please select an account.";
//     }

//     if (!chequeNumber.trim()) {
//       return "Please enter cheque number.";
//     }

//     if (!selectedDate) {
//       return "Please select a date.";
//     }

//     if (selectedDate > todayDate) {
//       return "Future dates are not allowed.";
//     }

//     if (!chequeAmount || chequeValue <= 0) {
//       return "Please enter a valid cheque amount.";
//     }

//     for (let i = 0; i < items.length; i++) {
//       const item = items[i];

//       if (!item.category) {
//         return `Please select a category for item ${i + 1}.`;
//       }

//       if (!item.name.trim()) {
//         return `Please enter a name for item ${i + 1}.`;
//       }

//       if (!item.amount || Number(item.amount) <= 0) {
//         return `Please enter a valid amount for item ${i + 1}.`;
//       }
//     }

//     if (totalItemAmount > chequeValue) {
//       return "The total item amount exceeds the cheque amount. Cheque amount is not sufficient for the entered items.";
//     }

//     return "";
//   };

//   async function handleSubmit(e: FormEvent<HTMLFormElement>) {
//     e.preventDefault();

//     const error = validateForm();

//     if (error) {
//       setSubmitError(error);

//       toast({
//         title: "Error",
//         description: error,
//         variant: "destructive",
//       });

//       return;
//     }

//     if (!selectedAccount) return;

//     try {
//       setLoading(true);

//       const profileData = userProfile as {
//         id?: string;
//         name?: string;
//         displayName?: string;
//         email?: string;
//       } | null;

//       const selectedCreatedAt = getFirestoreTimestampFromDate(selectedDate);

//       const payload = {
//         firebasePath: "/Panels/IEDGE-SYSTEM/Record",

//         selectedDate,
//         chequeDate: selectedDate,

//         accountId: selectedAccount.id,
//         accountType: selectedAccount.type,
//         accountTitle: selectedAccount.accountTitle,
//         accountNo: selectedAccount.accountNo,
//         bank: selectedAccount.bank,
//         branch: selectedAccount.branch || "",
//         city: selectedAccount.city || "",
//         platform: selectedAccount.platform || "",
//         routingNumber: selectedAccount.routingNumber || "",

//         chequeNumber: chequeNumber.trim(),
//         chequeAmount: chequeValue,
//         totalItemAmount,
//         remainingBalance,

//         items: items.map((item) => ({
//           category: item.category,
//           name: item.name.trim(),
//           amount: Number(item.amount),
//           description: item.description.trim(),
//         })),

//         createdBy: profileData?.id || "",
//         createdByName:
//           profileData?.name ||
//           profileData?.displayName ||
//           profileData?.email ||
//           "Unknown User",

//         createdAt: selectedCreatedAt,
//         updatedAt: serverTimestamp(),
//         status: "active",
//       };

//       await addDoc(collection(db, ...RECORD_COLLECTION_PATH), payload);

//       toast({
//         title: "Success",
//         description: "Record added successfully",
//       });

//       resetForm();

//       window.location.reload();
//     } catch (error) {
//       console.error("Failed to add record:", error);

//       toast({
//         title: "Error",
//         description: getErrorMessage(error) || "Failed to add record",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="mx-auto max-w-6xl">


//       <form onSubmit={handleSubmit} className="space-y-6">
//         <Card>
//           <CardHeader>
//             <CardTitle>Cheque Information</CardTitle>
//           </CardHeader>

//           <CardContent>
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
//               <div>
//                 <Label>Account Select *</Label>

//                 <Select
//                   value={selectedAccountKey}
//                   onValueChange={(value: string) => {
//                     setSelectedAccountKey(value);
//                     setSubmitError("");
//                   }}
//                   disabled={accountsLoading}
//                 >
//                   <SelectTrigger data-testid="select-account">
//                     <SelectValue
//                       placeholder={
//                         accountsLoading
//                           ? "Loading accounts..."
//                           : "Select account"
//                       }
//                     />
//                   </SelectTrigger>

//                   <SelectContent>
//                     {accounts.map((account) => (
//                       <SelectItem key={account.key} value={account.key}>
//                         {account.accountTitle} - {account.bank} -{" "}
//                         {account.accountNo} (
//                         {account.type === "cheque" ? "Cheque" : "Online"})
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>

//                 {!accountsLoading && accounts.length === 0 && (
//                   <p className="mt-2 text-sm text-destructive">
//                     No active accounts found. Please add an account first.
//                   </p>
//                 )}
//               </div>

//               <div>
//                 <Label htmlFor="chequeNumber">Cheque Number *</Label>

//                 <Input
//                   id="chequeNumber"
//                   value={chequeNumber}
//                   onChange={(e) => handleChequeNumberChange(e.target.value)}
//                   placeholder="Enter cheque number"
//                   data-testid="input-cheque-number"
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="selectedDate">Select Date *</Label>

//                 <Input
//                   id="selectedDate"
//                   type="date"
//                   value={selectedDate}
//                   max={todayDate}
//                   onChange={(e) => handleDateChange(e.target.value)}
//                   data-testid="input-select-date"
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="chequeAmount">Cheque Amount *</Label>

//                 <Input
//                   id="chequeAmount"
//                   value={chequeAmount}
//                   onChange={(e) => handleChequeAmountChange(e.target.value)}
//                   placeholder="Enter cheque amount"
//                   data-testid="input-cheque-amount"
//                 />
//               </div>
//             </div>

//             {selectedAccount && (
//               <div className="mt-5 rounded-xl border bg-muted/40 p-4">
//                 <p className="text-sm font-semibold text-foreground">
//                   Selected Account Details
//                 </p>

//                 <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-4">
//                   <div>
//                     <p className="text-muted-foreground">Account Title</p>
//                     <p className="font-medium">
//                       {selectedAccount.accountTitle}
//                     </p>
//                   </div>

//                   <div>
//                     <p className="text-muted-foreground">Bank</p>
//                     <p className="font-medium">{selectedAccount.bank}</p>
//                   </div>

//                   <div>
//                     <p className="text-muted-foreground">Account No</p>
//                     <p className="font-medium">{selectedAccount.accountNo}</p>
//                   </div>

//                   <div>
//                     <p className="text-muted-foreground">Selected Date</p>
//                     <p className="font-medium">{selectedDate || "-"}</p>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//               <CardTitle>Record Items</CardTitle>

//               <Button
//                 type="button"
//                 onClick={handleAddItem}
//                 data-testid="button-add-item"
//               >
//                 Add New Item
//               </Button>
//             </div>
//           </CardHeader>

//           <CardContent className="space-y-4">
//             {items.map((item, index) => (
//               <div key={index} className="rounded-xl border bg-muted/30 p-4">
//                 <div className="mb-4 flex items-center justify-between">
//                   <h3 className="font-semibold text-foreground">
//                     Item {index + 1}
//                   </h3>

//                   {items.length > 1 && (
//                     <Button
//                       type="button"
//                       variant="outline"
//                       onClick={() => handleRemoveItem(index)}
//                       data-testid={`button-remove-item-${index}`}
//                     >
//                       Remove
//                     </Button>
//                   )}
//                 </div>

//                 <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
//                   <div>
//                     <Label>Category *</Label>

//                     <Select
//                       value={item.category}
//                       onValueChange={(value: string) =>
//                         handleItemChange(index, "category", value)
//                       }
//                     >
//                       <SelectTrigger data-testid={`select-category-${index}`}>
//                         <SelectValue placeholder="Select category" />
//                       </SelectTrigger>

//                       <SelectContent>
//                         {categoryOptions.map((category) => (
//                           <SelectItem key={category} value={category}>
//                             {category}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   <div>
//                     <Label>Amount *</Label>

//                     <Input
//                       value={item.amount}
//                       onChange={(e) =>
//                         handleItemChange(index, "amount", e.target.value)
//                       }
//                       placeholder="Enter amount"
//                       data-testid={`input-item-amount-${index}`}
//                     />
//                   </div>

//                   <div>
//                     <Label>Name *</Label>

//                     <Input
//                       value={item.name}
//                       onChange={(e) =>
//                         handleItemChange(index, "name", e.target.value)
//                       }
//                       placeholder="Enter name"
//                       data-testid={`input-item-name-${index}`}
//                     />
//                   </div>

//                   <div>
//                     <Label>Description</Label>

//                     <Input
//                       value={item.description}
//                       onChange={(e) =>
//                         handleItemChange(index, "description", e.target.value)
//                       }
//                       placeholder="Optional"
//                       data-testid={`input-item-description-${index}`}
//                     />
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle>Cheque Summary</CardTitle>
//           </CardHeader>

//           <CardContent>
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
//               <div className="rounded-xl border bg-muted/30 p-4">
//                 <p className="text-sm text-muted-foreground">Cheque Amount</p>
//                 <h3 className="mt-2 text-2xl font-bold">
//                   {formatAmount(chequeValue)}
//                 </h3>
//               </div>

//               <div className="rounded-xl border bg-muted/30 p-4">
//                 <p className="text-sm text-muted-foreground">
//                   Total Item Amount
//                 </p>
//                 <h3 className="mt-2 text-2xl font-bold">
//                   {formatAmount(totalItemAmount)}
//                 </h3>
//               </div>

//               <div
//                 className={`rounded-xl border p-4 ${
//                   isExceeded
//                     ? "border-red-200 bg-red-50"
//                     : remainingBalance === 0 && chequeValue > 0
//                       ? "border-emerald-200 bg-emerald-50"
//                       : "bg-muted/30"
//                 }`}
//               >
//                 <p
//                   className={`text-sm ${
//                     isExceeded
//                       ? "text-red-600"
//                       : remainingBalance === 0 && chequeValue > 0
//                         ? "text-emerald-700"
//                         : "text-muted-foreground"
//                   }`}
//                 >
//                   Remaining Balance
//                 </p>

//                 <h3
//                   className={`mt-2 text-2xl font-bold ${
//                     isExceeded
//                       ? "text-red-700"
//                       : remainingBalance === 0 && chequeValue > 0
//                         ? "text-emerald-700"
//                         : "text-foreground"
//                   }`}
//                 >
//                   {formatAmount(remainingBalance)}
//                 </h3>
//               </div>
//             </div>

//             {isExceeded && (
//               <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
//                 The total item amount exceeds the cheque amount. Cheque amount
//                 is not sufficient for the entered items.
//               </div>
//             )}

//             {submitError && (
//               <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
//                 {submitError}
//               </div>
//             )}

//             <div className="mt-6 flex justify-end gap-3">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => setLocation("/accounts")}
//                 data-testid="button-cancel-record"
//               >
//                 Cancel
//               </Button>

//               <Button
//                 type="submit"
//                 disabled={loading || isExceeded || accounts.length === 0}
//                 data-testid="button-save-record"
//               >
//                 {loading ? (
//                   <>
//                     <i className="fas fa-spinner fa-spin mr-2"></i>
//                     Saving...
//                   </>
//                 ) : (
//                   "Save Record"
//                 )}
//               </Button>
//             </div>
//           </CardContent>
//         </Card>
//       </form>
//     </div>
//   );
// }




// import { FormEvent, useEffect, useMemo, useState } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import {
//   addDoc,
//   collection,
//   getDocs,
//   serverTimestamp,
//   Timestamp,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
// import { useToast } from "@/hooks/use-toast";
// import { useLocation } from "wouter";

// type AccountType = "cheque" | "online";

// type FirestoreAccountData = {
//   accountTitle?: string;
//   accountNo?: string;
//   bank?: string;
//   branch?: string;
//   city?: string;
//   platform?: string;
//   routingNumber?: string;
//   isActive?: boolean;
//   createdBy?: string;
// };

// type AccountOption = {
//   id: string;
//   key: string;
//   type: AccountType;
//   accountTitle: string;
//   accountNo: string;
//   bank: string;
//   branch?: string;
//   city?: string;
//   platform?: string;
//   routingNumber?: string;
// };

// type RawAccountOption = AccountOption & {
//   isActive?: boolean;
// };

// type RecordItem = {
//   category: string;
//   amount: string;
//   name: string;
//   description: string;
// };

// type ItemField = keyof RecordItem;

// const RECORD_COLLECTION_PATH = ["Panels", "IEDGE-SYSTEM", "Record"] as const;

// const categoryOptions: string[] = [
//   "Utility",
//   "General",
//   "Tuition Fees",
//   "Payroll",
//   "Travel",
//   "Accommodation",
//   "Hotel",
//   "Ticketing",
// ];

// const emptyItem: RecordItem = {
//   category: "",
//   amount: "",
//   name: "",
//   description: "",
// };

// const getTodayDate = (): string => {
//   const today = new Date();
//   const year = today.getFullYear();
//   const month = String(today.getMonth() + 1).padStart(2, "0");
//   const day = String(today.getDate()).padStart(2, "0");

//   return `${year}-${month}-${day}`;
// };

// const getFirestoreTimestampFromDate = (dateValue: string): Timestamp => {
//   const [year, month, day] = dateValue.split("-").map(Number);

//   return Timestamp.fromDate(new Date(year, month - 1, day, 0, 0, 0));
// };

// export default function Record() {
//   const { userProfile } = useAuth();
//   const { toast } = useToast();
//   const [, setLocation] = useLocation();

//   const todayDate = getTodayDate();

//   const [accounts, setAccounts] = useState<AccountOption[]>([]);
//   const [accountsLoading, setAccountsLoading] = useState<boolean>(true);
//   const [selectedAccountKey, setSelectedAccountKey] = useState<string>("");

//   const [chequeNumber, setChequeNumber] = useState<string>("");
//   const [statementTitle, setStatementTitle] = useState<string>("");
//   const [selectedDate, setSelectedDate] = useState<string>(todayDate);
//   const [chequeAmount, setChequeAmount] = useState<string>("");
//   const [items, setItems] = useState<RecordItem[]>([{ ...emptyItem }]);

//   const [loading, setLoading] = useState<boolean>(false);
//   const [submitError, setSubmitError] = useState<string>("");

//   const getErrorMessage = (error: unknown): string => {
//     if (error instanceof Error) return error.message;
//     return "Something went wrong";
//   };

//   useEffect(() => {
//     let isMounted = true;

//     async function fetchAccounts() {
//       try {
//         setAccountsLoading(true);

//         const [chequeSnapshot, onlineSnapshot] = await Promise.all([
//           getDocs(collection(db, "chequeAccounts")),
//           getDocs(collection(db, "onlineAccounts")),
//         ]);

//         const chequeAccountsRaw: RawAccountOption[] = chequeSnapshot.docs.map(
//           (doc) => {
//             const data = doc.data() as FirestoreAccountData;

//             return {
//               id: doc.id,
//               key: `cheque-${doc.id}`,
//               type: "cheque",
//               accountTitle: data.accountTitle || "Untitled Account",
//               accountNo: data.accountNo || "",
//               bank: data.bank || "",
//               branch: data.branch || "",
//               city: data.city || "",
//               isActive: data.isActive,
//             };
//           },
//         );

//         const onlineAccountsRaw: RawAccountOption[] = onlineSnapshot.docs.map(
//           (doc) => {
//             const data = doc.data() as FirestoreAccountData;

//             return {
//               id: doc.id,
//               key: `online-${doc.id}`,
//               type: "online",
//               accountTitle: data.accountTitle || "Untitled Account",
//               accountNo: data.accountNo || "",
//               bank: data.bank || "",
//               platform: data.platform || "",
//               routingNumber: data.routingNumber || "",
//               isActive: data.isActive,
//             };
//           },
//         );

//         const activeChequeAccounts: AccountOption[] = chequeAccountsRaw
//           .filter((account) => account.isActive !== false)
//           .map(({ isActive, ...account }) => account);

//         const activeOnlineAccounts: AccountOption[] = onlineAccountsRaw
//           .filter((account) => account.isActive !== false)
//           .map(({ isActive, ...account }) => account);

//         const mergedAccounts = [
//           ...activeChequeAccounts,
//           ...activeOnlineAccounts,
//         ].sort((a, b) => a.accountTitle.localeCompare(b.accountTitle));

//         if (isMounted) {
//           setAccounts(mergedAccounts);
//         }
//       } catch (error) {
//         console.error("Failed to fetch accounts:", error);

//         toast({
//           title: "Error",
//           description: getErrorMessage(error) || "Failed to fetch accounts",
//           variant: "destructive",
//         });
//       } finally {
//         if (isMounted) {
//           setAccountsLoading(false);
//         }
//       }
//     }

//     fetchAccounts();

//     return () => {
//       isMounted = false;
//     };
//   }, [toast]);

//   const selectedAccount = useMemo<AccountOption | null>(() => {
//     return (
//       accounts.find((account) => account.key === selectedAccountKey) || null
//     );
//   }, [accounts, selectedAccountKey]);

//   const totalItemAmount = useMemo<number>(() => {
//     return items.reduce((total, item) => {
//       return total + (Number(item.amount) || 0);
//     }, 0);
//   }, [items]);

//   const chequeValue = Number(chequeAmount) || 0;
//   const remainingBalance = chequeValue - totalItemAmount;
//   const isExceeded = chequeValue > 0 && totalItemAmount > chequeValue;

//   const formatAmount = (value: number): string => {
//     return value.toLocaleString("en-US", {
//       maximumFractionDigits: 2,
//     });
//   };

//   const sanitizeAmount = (value: string): string => {
//     let cleanValue = value.replace(/[^0-9.]/g, "");

//     const parts = cleanValue.split(".");
//     if (parts.length > 2) {
//       cleanValue = `${parts[0]}.${parts.slice(1).join("")}`;
//     }

//     return cleanValue;
//   };

//   const handleChequeNumberChange = (value: string) => {
//     setChequeNumber(value);
//     setSubmitError("");
//   };

//   const handleStatementTitleChange = (value: string) => {
//     setStatementTitle(value);
//     setSubmitError("");
//   };

//   const handleDateChange = (value: string) => {
//     setSelectedDate(value);
//     setSubmitError("");
//   };

//   const handleChequeAmountChange = (value: string) => {
//     setChequeAmount(sanitizeAmount(value));
//     setSubmitError("");
//   };

//   const handleItemChange = (index: number, field: ItemField, value: string) => {
//     const updatedItems = [...items];

//     updatedItems[index] = {
//       ...updatedItems[index],
//       [field]: field === "amount" ? sanitizeAmount(value) : value,
//     };

//     setItems(updatedItems);
//     setSubmitError("");
//   };

//   const handleAddItem = () => {
//     setItems((prevItems) => [...prevItems, { ...emptyItem }]);
//     setSubmitError("");
//   };

//   const handleRemoveItem = (index: number) => {
//     if (items.length === 1) return;

//     const updatedItems = items.filter((_, itemIndex) => itemIndex !== index);
//     setItems(updatedItems);
//     setSubmitError("");
//   };

//   const resetForm = () => {
//     setSelectedAccountKey("");
//     setChequeNumber("");
//     setStatementTitle("");
//     setSelectedDate(getTodayDate());
//     setChequeAmount("");
//     setItems([{ ...emptyItem }]);
//     setSubmitError("");
//   };

//   const validateForm = (): string => {
//     if (!selectedAccount) {
//       return "Please select an account.";
//     }

//     if (!chequeNumber.trim()) {
//       return "Please enter cheque number.";
//     }

//     if (!selectedDate) {
//       return "Please select a date.";
//     }

//     if (selectedDate > todayDate) {
//       return "Future dates are not allowed.";
//     }

//     if (!chequeAmount || chequeValue <= 0) {
//       return "Please enter a valid cheque amount.";
//     }

//     for (let i = 0; i < items.length; i++) {
//       const item = items[i];

//       if (!item.category) {
//         return `Please select a category for item ${i + 1}.`;
//       }

//       if (!item.name.trim()) {
//         return `Please enter a name for item ${i + 1}.`;
//       }

//       if (!item.amount || Number(item.amount) <= 0) {
//         return `Please enter a valid amount for item ${i + 1}.`;
//       }
//     }

//     if (totalItemAmount > chequeValue) {
//       return "The total item amount exceeds the cheque amount. Cheque amount is not sufficient for the entered items.";
//     }

//     return "";
//   };

//   async function handleSubmit(e: FormEvent<HTMLFormElement>) {
//     e.preventDefault();

//     const error = validateForm();

//     if (error) {
//       setSubmitError(error);

//       toast({
//         title: "Error",
//         description: error,
//         variant: "destructive",
//       });

//       return;
//     }

//     if (!selectedAccount) return;

//     try {
//       setLoading(true);

//       const profileData = userProfile as {
//         id?: string;
//         name?: string;
//         displayName?: string;
//         email?: string;
//       } | null;

//       const selectedCreatedAt = getFirestoreTimestampFromDate(selectedDate);

//       const payload = {
//         firebasePath: "/Panels/IEDGE-SYSTEM/Record",

//         selectedDate,
//         chequeDate: selectedDate,

//         accountId: selectedAccount.id,
//         accountType: selectedAccount.type,
//         accountTitle: selectedAccount.accountTitle,
//         accountNo: selectedAccount.accountNo,
//         bank: selectedAccount.bank,
//         branch: selectedAccount.branch || "",
//         city: selectedAccount.city || "",
//         platform: selectedAccount.platform || "",
//         routingNumber: selectedAccount.routingNumber || "",

//         chequeNumber: chequeNumber.trim(),
//         statementTitle: statementTitle.trim(),
//         chequeAmount: chequeValue,
//         totalItemAmount,
//         remainingBalance,

//         items: items.map((item) => ({
//           category: item.category,
//           name: item.name.trim(),
//           amount: Number(item.amount),
//           description: item.description.trim(),
//         })),

//         createdBy: profileData?.id || "",
//         createdByName:
//           profileData?.name ||
//           profileData?.displayName ||
//           profileData?.email ||
//           "Unknown User",

//         createdAt: selectedCreatedAt,
//         updatedAt: serverTimestamp(),
//         status: "active",
//       };

//       await addDoc(collection(db, ...RECORD_COLLECTION_PATH), payload);

//       toast({
//         title: "Success",
//         description: "Record added successfully",
//       });

//       resetForm();

//       window.location.reload();
//     } catch (error) {
//       console.error("Failed to add record:", error);

//       toast({
//         title: "Error",
//         description: getErrorMessage(error) || "Failed to add record",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="mx-auto max-w-6xl">


//       <form onSubmit={handleSubmit} className="space-y-6">
//         <Card>
//           <CardHeader>
//             <CardTitle>Cheque Information</CardTitle>
//           </CardHeader>

//           <CardContent>
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
//               <div>
//                 <Label>Account Select *</Label>

//                 <Select
//                   value={selectedAccountKey}
//                   onValueChange={(value: string) => {
//                     setSelectedAccountKey(value);
//                     setSubmitError("");
//                   }}
//                   disabled={accountsLoading}
//                 >
//                   <SelectTrigger data-testid="select-account">
//                     <SelectValue
//                       placeholder={
//                         accountsLoading
//                           ? "Loading accounts..."
//                           : "Select account"
//                       }
//                     />
//                   </SelectTrigger>

//                   <SelectContent>
//                     {accounts.map((account) => (
//                       <SelectItem key={account.key} value={account.key}>
//                         {account.accountTitle} - {account.bank} -{" "}
//                         {account.accountNo} (
//                         {account.type === "cheque" ? "Cheque" : "Online"})
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>

//                 {!accountsLoading && accounts.length === 0 && (
//                   <p className="mt-2 text-sm text-destructive">
//                     No active accounts found. Please add an account first.
//                   </p>
//                 )}
//               </div>

//               <div>
//                 <Label htmlFor="chequeNumber">Cheque Number *</Label>

//                 <Input
//                   id="chequeNumber"
//                   value={chequeNumber}
//                   onChange={(e) => handleChequeNumberChange(e.target.value)}
//                   placeholder="Enter cheque number"
//                   data-testid="input-cheque-number"
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="statementTitle">Statement Title</Label>

//                 <Input
//                   id="statementTitle"
//                   value={statementTitle}
//                   onChange={(e) => handleStatementTitleChange(e.target.value)}
//                   placeholder="Enter statement title"
//                   data-testid="input-statement-title"
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="selectedDate">Select Date *</Label>

//                 <Input
//                   id="selectedDate"
//                   type="date"
//                   value={selectedDate}
//                   max={todayDate}
//                   onChange={(e) => handleDateChange(e.target.value)}
//                   data-testid="input-select-date"
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="chequeAmount">Cheque Amount *</Label>

//                 <Input
//                   id="chequeAmount"
//                   value={chequeAmount}
//                   onChange={(e) => handleChequeAmountChange(e.target.value)}
//                   placeholder="Enter cheque amount"
//                   data-testid="input-cheque-amount"
//                 />
//               </div>
//             </div>

//             {selectedAccount && (
//               <div className="mt-5 rounded-xl border bg-muted/40 p-4">
//                 <p className="text-sm font-semibold text-foreground">
//                   Selected Account Details
//                 </p>

//                 <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-4">
//                   <div>
//                     <p className="text-muted-foreground">Account Title</p>
//                     <p className="font-medium">
//                       {selectedAccount.accountTitle}
//                     </p>
//                   </div>

//                   <div>
//                     <p className="text-muted-foreground">Bank</p>
//                     <p className="font-medium">{selectedAccount.bank}</p>
//                   </div>

//                   <div>
//                     <p className="text-muted-foreground">Account No</p>
//                     <p className="font-medium">{selectedAccount.accountNo}</p>
//                   </div>

//                   <div>
//                     <p className="text-muted-foreground">Selected Date</p>
//                     <p className="font-medium">{selectedDate || "-"}</p>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//               <CardTitle>Record Items</CardTitle>

//               <Button
//                 type="button"
//                 onClick={handleAddItem}
//                 data-testid="button-add-item"
//               >
//                 Add New Item
//               </Button>
//             </div>
//           </CardHeader>

//           <CardContent className="space-y-4">
//             {items.map((item, index) => (
//               <div key={index} className="rounded-xl border bg-muted/30 p-4">
//                 <div className="mb-4 flex items-center justify-between">
//                   <h3 className="font-semibold text-foreground">
//                     Item {index + 1}
//                   </h3>

//                   {items.length > 1 && (
//                     <Button
//                       type="button"
//                       variant="outline"
//                       onClick={() => handleRemoveItem(index)}
//                       data-testid={`button-remove-item-${index}`}
//                     >
//                       Remove
//                     </Button>
//                   )}
//                 </div>

//                 <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
//                   <div>
//                     <Label>Category *</Label>

//                     <Select
//                       value={item.category}
//                       onValueChange={(value: string) =>
//                         handleItemChange(index, "category", value)
//                       }
//                     >
//                       <SelectTrigger data-testid={`select-category-${index}`}>
//                         <SelectValue placeholder="Select category" />
//                       </SelectTrigger>

//                       <SelectContent>
//                         {categoryOptions.map((category) => (
//                           <SelectItem key={category} value={category}>
//                             {category}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   <div>
//                     <Label>Amount *</Label>

//                     <Input
//                       value={item.amount}
//                       onChange={(e) =>
//                         handleItemChange(index, "amount", e.target.value)
//                       }
//                       placeholder="Enter amount"
//                       data-testid={`input-item-amount-${index}`}
//                     />
//                   </div>

//                   <div>
//                     <Label>Name *</Label>

//                     <Input
//                       value={item.name}
//                       onChange={(e) =>
//                         handleItemChange(index, "name", e.target.value)
//                       }
//                       placeholder="Enter name"
//                       data-testid={`input-item-name-${index}`}
//                     />
//                   </div>

//                   <div>
//                     <Label>Description</Label>

//                     <Input
//                       value={item.description}
//                       onChange={(e) =>
//                         handleItemChange(index, "description", e.target.value)
//                       }
//                       placeholder="Optional"
//                       data-testid={`input-item-description-${index}`}
//                     />
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle>Cheque Summary</CardTitle>
//           </CardHeader>

//           <CardContent>
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
//               <div className="rounded-xl border bg-muted/30 p-4">
//                 <p className="text-sm text-muted-foreground">Cheque Amount</p>
//                 <h3 className="mt-2 text-2xl font-bold">
//                   {formatAmount(chequeValue)}
//                 </h3>
//               </div>

//               <div className="rounded-xl border bg-muted/30 p-4">
//                 <p className="text-sm text-muted-foreground">
//                   Total Item Amount
//                 </p>
//                 <h3 className="mt-2 text-2xl font-bold">
//                   {formatAmount(totalItemAmount)}
//                 </h3>
//               </div>

//               <div
//                 className={`rounded-xl border p-4 ${
//                   isExceeded
//                     ? "border-red-200 bg-red-50"
//                     : remainingBalance === 0 && chequeValue > 0
//                       ? "border-emerald-200 bg-emerald-50"
//                       : "bg-muted/30"
//                 }`}
//               >
//                 <p
//                   className={`text-sm ${
//                     isExceeded
//                       ? "text-red-600"
//                       : remainingBalance === 0 && chequeValue > 0
//                         ? "text-emerald-700"
//                         : "text-muted-foreground"
//                   }`}
//                 >
//                   Remaining Balance
//                 </p>

//                 <h3
//                   className={`mt-2 text-2xl font-bold ${
//                     isExceeded
//                       ? "text-red-700"
//                       : remainingBalance === 0 && chequeValue > 0
//                         ? "text-emerald-700"
//                         : "text-foreground"
//                   }`}
//                 >
//                   {formatAmount(remainingBalance)}
//                 </h3>
//               </div>
//             </div>

//             {isExceeded && (
//               <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
//                 The total item amount exceeds the cheque amount. Cheque amount
//                 is not sufficient for the entered items.
//               </div>
//             )}

//             {submitError && (
//               <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
//                 {submitError}
//               </div>
//             )}

//             <div className="mt-6 flex justify-end gap-3">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => setLocation("/accounts")}
//                 data-testid="button-cancel-record"
//               >
//                 Cancel
//               </Button>

//               <Button
//                 type="submit"
//                 disabled={loading || isExceeded || accounts.length === 0}
//                 data-testid="button-save-record"
//               >
//                 {loading ? (
//                   <>
//                     <i className="fas fa-spinner fa-spin mr-2"></i>
//                     Saving...
//                   </>
//                 ) : (
//                   "Save Record"
//                 )}
//               </Button>
//             </div>
//           </CardContent>
//         </Card>
//       </form>
//     </div>
//   );
// }







// import { FormEvent, useEffect, useMemo, useState } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import {
//   addDoc,
//   collection,
//   getDocs,
//   query,
//   serverTimestamp,
//   Timestamp,
//   where,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
// import { useToast } from "@/hooks/use-toast";
// import { useLocation } from "wouter";

// type AccountType = "cheque" | "online";

// type FirestoreAccountData = {
//   accountTitle?: string;
//   accountNo?: string;
//   bank?: string;
//   branch?: string;
//   city?: string;
//   platform?: string;
//   routingNumber?: string;
//   isActive?: boolean;
//   createdBy?: string;
// };

// type AccountOption = {
//   id: string;
//   key: string;
//   type: AccountType;
//   accountTitle: string;
//   accountNo: string;
//   bank: string;
//   branch?: string;
//   city?: string;
//   platform?: string;
//   routingNumber?: string;
// };

// type RawAccountOption = AccountOption & {
//   isActive?: boolean;
// };

// type RecordItem = {
//   category: string;
//   amount: string;
//   name: string;
//   description: string;
// };

// type ItemField = keyof RecordItem;

// const RECORD_COLLECTION_PATH = ["Panels", "IEDGE-SYSTEM", "Record"] as const;

// const categoryOptions: string[] = [
//   "Utility",
//   "General",
//   "Tuition Fees",
//   "Payroll",
//   "Travel",
//   "Accommodation",
//   "Hotel",
//   "Ticketing",
// ];

// const emptyItem: RecordItem = {
//   category: "",
//   amount: "",
//   name: "",
//   description: "",
// };

// const getTodayDate = (): string => {
//   const today = new Date();
//   const year = today.getFullYear();
//   const month = String(today.getMonth() + 1).padStart(2, "0");
//   const day = String(today.getDate()).padStart(2, "0");

//   return `${year}-${month}-${day}`;
// };

// const getFirestoreTimestampFromDate = (dateValue: string): Timestamp => {
//   const [year, month, day] = dateValue.split("-").map(Number);

//   return Timestamp.fromDate(new Date(year, month - 1, day, 0, 0, 0));
// };

// export default function Record() {
//   const { userProfile } = useAuth();
//   const { toast } = useToast();
//   const [, setLocation] = useLocation();

//   const todayDate = getTodayDate();

//   const [accounts, setAccounts] = useState<AccountOption[]>([]);
//   const [accountsLoading, setAccountsLoading] = useState<boolean>(true);
//   const [selectedAccountKey, setSelectedAccountKey] = useState<string>("");

//   const [chequeNumber, setChequeNumber] = useState<string>("");
//   const [statementTitle, setStatementTitle] = useState<string>("");
//   const [selectedDate, setSelectedDate] = useState<string>(todayDate);
//   const [chequeAmount, setChequeAmount] = useState<string>("");
//   const [items, setItems] = useState<RecordItem[]>([{ ...emptyItem }]);

//   const [loading, setLoading] = useState<boolean>(false);
//   const [submitError, setSubmitError] = useState<string>("");

//   const getErrorMessage = (error: unknown): string => {
//     if (error instanceof Error) return error.message;
//     return "Something went wrong";
//   };

//   useEffect(() => {
//     let isMounted = true;

//     async function fetchAccounts() {
//       try {
//         setAccountsLoading(true);

//         const [chequeSnapshot, onlineSnapshot] = await Promise.all([
//           getDocs(collection(db, "chequeAccounts")),
//           getDocs(collection(db, "onlineAccounts")),
//         ]);

//         const chequeAccountsRaw: RawAccountOption[] = chequeSnapshot.docs.map(
//           (doc) => {
//             const data = doc.data() as FirestoreAccountData;

//             return {
//               id: doc.id,
//               key: `cheque-${doc.id}`,
//               type: "cheque",
//               accountTitle: data.accountTitle || "Untitled Account",
//               accountNo: data.accountNo || "",
//               bank: data.bank || "",
//               branch: data.branch || "",
//               city: data.city || "",
//               isActive: data.isActive,
//             };
//           },
//         );

//         const onlineAccountsRaw: RawAccountOption[] = onlineSnapshot.docs.map(
//           (doc) => {
//             const data = doc.data() as FirestoreAccountData;

//             return {
//               id: doc.id,
//               key: `online-${doc.id}`,
//               type: "online",
//               accountTitle: data.accountTitle || "Untitled Account",
//               accountNo: data.accountNo || "",
//               bank: data.bank || "",
//               platform: data.platform || "",
//               routingNumber: data.routingNumber || "",
//               isActive: data.isActive,
//             };
//           },
//         );

//         const activeChequeAccounts: AccountOption[] = chequeAccountsRaw
//           .filter((account) => account.isActive !== false)
//           .map(({ isActive, ...account }) => account);

//         const activeOnlineAccounts: AccountOption[] = onlineAccountsRaw
//           .filter((account) => account.isActive !== false)
//           .map(({ isActive, ...account }) => account);

//         const mergedAccounts = [
//           ...activeChequeAccounts,
//           ...activeOnlineAccounts,
//         ].sort((a, b) => a.accountTitle.localeCompare(b.accountTitle));

//         if (isMounted) {
//           setAccounts(mergedAccounts);
//         }
//       } catch (error) {
//         console.error("Failed to fetch accounts:", error);

//         toast({
//           title: "Error",
//           description: getErrorMessage(error) || "Failed to fetch accounts",
//           variant: "destructive",
//         });
//       } finally {
//         if (isMounted) {
//           setAccountsLoading(false);
//         }
//       }
//     }

//     fetchAccounts();

//     return () => {
//       isMounted = false;
//     };
//   }, [toast]);

//   const selectedAccount = useMemo<AccountOption | null>(() => {
//     return (
//       accounts.find((account) => account.key === selectedAccountKey) || null
//     );
//   }, [accounts, selectedAccountKey]);

//   const totalItemAmount = useMemo<number>(() => {
//     return items.reduce((total, item) => {
//       return total + (Number(item.amount) || 0);
//     }, 0);
//   }, [items]);

//   const chequeValue = Number(chequeAmount) || 0;
//   const remainingBalance = chequeValue - totalItemAmount;
//   const isExceeded = chequeValue > 0 && totalItemAmount > chequeValue;

//   const formatAmount = (value: number): string => {
//     return value.toLocaleString("en-US", {
//       maximumFractionDigits: 2,
//     });
//   };

//   const sanitizeAmount = (value: string): string => {
//     let cleanValue = value.replace(/[^0-9.]/g, "");

//     const parts = cleanValue.split(".");
//     if (parts.length > 2) {
//       cleanValue = `${parts[0]}.${parts.slice(1).join("")}`;
//     }

//     return cleanValue;
//   };

//   const handleChequeNumberChange = (value: string) => {
//     setChequeNumber(value);
//     setSubmitError("");
//   };

//   const handleStatementTitleChange = (value: string) => {
//     setStatementTitle(value);
//     setSubmitError("");
//   };

//   const handleDateChange = (value: string) => {
//     setSelectedDate(value);
//     setSubmitError("");
//   };

//   const handleChequeAmountChange = (value: string) => {
//     setChequeAmount(sanitizeAmount(value));
//     setSubmitError("");
//   };

//   const handleItemChange = (index: number, field: ItemField, value: string) => {
//     const updatedItems = [...items];

//     updatedItems[index] = {
//       ...updatedItems[index],
//       [field]: field === "amount" ? sanitizeAmount(value) : value,
//     };

//     setItems(updatedItems);
//     setSubmitError("");
//   };

//   const handleAddItem = () => {
//     setItems((prevItems) => [...prevItems, { ...emptyItem }]);
//     setSubmitError("");
//   };

//   const handleRemoveItem = (index: number) => {
//     if (items.length === 1) return;

//     const updatedItems = items.filter((_, itemIndex) => itemIndex !== index);
//     setItems(updatedItems);
//     setSubmitError("");
//   };

//   const resetForm = () => {
//     setSelectedAccountKey("");
//     setChequeNumber("");
//     setStatementTitle("");
//     setSelectedDate(getTodayDate());
//     setChequeAmount("");
//     setItems([{ ...emptyItem }]);
//     setSubmitError("");
//   };

//   const validateForm = (): string => {
//     if (!selectedAccount) {
//       return "Please select an account.";
//     }

//     if (!chequeNumber.trim()) {
//       return "Please enter cheque number.";
//     }

//     if (!selectedDate) {
//       return "Please select a date.";
//     }

//     if (selectedDate > todayDate) {
//       return "Future dates are not allowed.";
//     }

//     if (!chequeAmount || chequeValue <= 0) {
//       return "Please enter a valid cheque amount.";
//     }

//     for (let i = 0; i < items.length; i++) {
//       const item = items[i];

//       if (!item.category) {
//         return `Please select a category for item ${i + 1}.`;
//       }

//       if (!item.name.trim()) {
//         return `Please enter a name for item ${i + 1}.`;
//       }

//       if (!item.amount || Number(item.amount) <= 0) {
//         return `Please enter a valid amount for item ${i + 1}.`;
//       }
//     }

//     if (totalItemAmount > chequeValue) {
//       return "The total item amount exceeds the cheque amount. Cheque amount is not sufficient for the entered items.";
//     }

//     return "";
//   };

//   const chequeNumberAlreadyExists = async (
//     chequeNumberValue: string,
//   ): Promise<boolean> => {
//     const cleanChequeNumber = chequeNumberValue.trim();

//     if (!cleanChequeNumber) return false;

//     try {
//       const duplicateChequeSnapshot = await getDocs(
//         query(
//           collection(db, ...RECORD_COLLECTION_PATH),
//           where("chequeNumber", "==", cleanChequeNumber),
//         ),
//       );

//       return !duplicateChequeSnapshot.empty;
//     } catch (error) {
//       console.warn("Failed to check existing cheque number:", error);
//       return false;
//     }
//   };

//   async function handleSubmit(e: FormEvent<HTMLFormElement>) {
//     e.preventDefault();

//     const error = validateForm();

//     if (error) {
//       setSubmitError(error);

//       toast({
//         title: "Error",
//         description: error,
//         variant: "destructive",
//       });

//       return;
//     }

//     if (!selectedAccount) return;

//     try {
//       setLoading(true);

//       const profileData = userProfile as {
//         id?: string;
//         name?: string;
//         displayName?: string;
//         email?: string;
//       } | null;

//       const selectedCreatedAt = getFirestoreTimestampFromDate(selectedDate);
//       const cleanChequeNumber = chequeNumber.trim();
//       const isDuplicateChequeNumber =
//         await chequeNumberAlreadyExists(cleanChequeNumber);

//       if (isDuplicateChequeNumber) {
//         toast({
//           title: "Warning",
//           description:
//             "This cheque number already exists. The record will still be saved.",
//         });
//       }

//       const payload = {
//         firebasePath: "/Panels/IEDGE-SYSTEM/Record",

//         selectedDate,
//         chequeDate: selectedDate,

//         accountId: selectedAccount.id,
//         accountType: selectedAccount.type,
//         accountTitle: selectedAccount.accountTitle,
//         accountNo: selectedAccount.accountNo,
//         bank: selectedAccount.bank,
//         branch: selectedAccount.branch || "",
//         city: selectedAccount.city || "",
//         platform: selectedAccount.platform || "",
//         routingNumber: selectedAccount.routingNumber || "",

//         chequeNumber: cleanChequeNumber,
//         statementTitle: statementTitle.trim(),
//         chequeAmount: chequeValue,
//         totalItemAmount,
//         remainingBalance,

//         items: items.map((item) => ({
//           category: item.category,
//           name: item.name.trim(),
//           amount: Number(item.amount),
//           description: item.description.trim(),
//         })),

//         createdBy: profileData?.id || "",
//         createdByName:
//           profileData?.name ||
//           profileData?.displayName ||
//           profileData?.email ||
//           "Unknown User",

//         createdAt: selectedCreatedAt,
//         updatedAt: serverTimestamp(),
//         status: "active",
//       };

//       await addDoc(collection(db, ...RECORD_COLLECTION_PATH), payload);

//       toast({
//         title: "Success",
//         description: "Record added successfully",
//       });

//       resetForm();

//       window.location.reload();
//     } catch (error) {
//       console.error("Failed to add record:", error);

//       toast({
//         title: "Error",
//         description: getErrorMessage(error) || "Failed to add record",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="mx-auto max-w-6xl">


//       <form onSubmit={handleSubmit} className="space-y-6">
//         <Card>
//           <CardHeader>
//             <CardTitle>Cheque Information</CardTitle>
//           </CardHeader>

//           <CardContent>
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
//               <div>
//                 <Label>Account Select *</Label>

//                 <Select
//                   value={selectedAccountKey}
//                   onValueChange={(value: string) => {
//                     setSelectedAccountKey(value);
//                     setSubmitError("");
//                   }}
//                   disabled={accountsLoading}
//                 >
//                   <SelectTrigger data-testid="select-account">
//                     <SelectValue
//                       placeholder={
//                         accountsLoading
//                           ? "Loading accounts..."
//                           : "Select account"
//                       }
//                     />
//                   </SelectTrigger>

//                   <SelectContent>
//                     {accounts.map((account) => (
//                       <SelectItem key={account.key} value={account.key}>
//                         {account.accountTitle} - {account.bank} -{" "}
//                         {account.accountNo} (
//                         {account.type === "cheque" ? "Cheque" : "Online"})
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>

//                 {!accountsLoading && accounts.length === 0 && (
//                   <p className="mt-2 text-sm text-destructive">
//                     No active accounts found. Please add an account first.
//                   </p>
//                 )}
//               </div>

//               <div>
//                 <Label htmlFor="chequeNumber">Cheque Number *</Label>

//                 <Input
//                   id="chequeNumber"
//                   value={chequeNumber}
//                   onChange={(e) => handleChequeNumberChange(e.target.value)}
//                   placeholder="Enter cheque number"
//                   data-testid="input-cheque-number"
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="statementTitle">Statement Title</Label>

//                 <Input
//                   id="statementTitle"
//                   value={statementTitle}
//                   onChange={(e) => handleStatementTitleChange(e.target.value)}
//                   placeholder="Enter statement title"
//                   data-testid="input-statement-title"
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="selectedDate">Select Date *</Label>

//                 <Input
//                   id="selectedDate"
//                   type="date"
//                   value={selectedDate}
//                   max={todayDate}
//                   onChange={(e) => handleDateChange(e.target.value)}
//                   data-testid="input-select-date"
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="chequeAmount">Cheque Amount *</Label>

//                 <Input
//                   id="chequeAmount"
//                   value={chequeAmount}
//                   onChange={(e) => handleChequeAmountChange(e.target.value)}
//                   placeholder="Enter cheque amount"
//                   data-testid="input-cheque-amount"
//                 />
//               </div>
//             </div>

//             {selectedAccount && (
//               <div className="mt-5 rounded-xl border bg-muted/40 p-4">
//                 <p className="text-sm font-semibold text-foreground">
//                   Selected Account Details
//                 </p>

//                 <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-4">
//                   <div>
//                     <p className="text-muted-foreground">Account Title</p>
//                     <p className="font-medium">
//                       {selectedAccount.accountTitle}
//                     </p>
//                   </div>

//                   <div>
//                     <p className="text-muted-foreground">Bank</p>
//                     <p className="font-medium">{selectedAccount.bank}</p>
//                   </div>

//                   <div>
//                     <p className="text-muted-foreground">Account No</p>
//                     <p className="font-medium">{selectedAccount.accountNo}</p>
//                   </div>

//                   <div>
//                     <p className="text-muted-foreground">Selected Date</p>
//                     <p className="font-medium">{selectedDate || "-"}</p>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//               <CardTitle>Record Items</CardTitle>

//               <Button
//                 type="button"
//                 onClick={handleAddItem}
//                 data-testid="button-add-item"
//               >
//                 Add New Item
//               </Button>
//             </div>
//           </CardHeader>

//           <CardContent className="space-y-4">
//             {items.map((item, index) => (
//               <div key={index} className="rounded-xl border bg-muted/30 p-4">
//                 <div className="mb-4 flex items-center justify-between">
//                   <h3 className="font-semibold text-foreground">
//                     Item {index + 1}
//                   </h3>

//                   {items.length > 1 && (
//                     <Button
//                       type="button"
//                       variant="outline"
//                       onClick={() => handleRemoveItem(index)}
//                       data-testid={`button-remove-item-${index}`}
//                     >
//                       Remove
//                     </Button>
//                   )}
//                 </div>

//                 <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
//                   <div>
//                     <Label>Category *</Label>

//                     <Select
//                       value={item.category}
//                       onValueChange={(value: string) =>
//                         handleItemChange(index, "category", value)
//                       }
//                     >
//                       <SelectTrigger data-testid={`select-category-${index}`}>
//                         <SelectValue placeholder="Select category" />
//                       </SelectTrigger>

//                       <SelectContent>
//                         {categoryOptions.map((category) => (
//                           <SelectItem key={category} value={category}>
//                             {category}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   <div>
//                     <Label>Amount *</Label>

//                     <Input
//                       value={item.amount}
//                       onChange={(e) =>
//                         handleItemChange(index, "amount", e.target.value)
//                       }
//                       placeholder="Enter amount"
//                       data-testid={`input-item-amount-${index}`}
//                     />
//                   </div>

//                   <div>
//                     <Label>Name *</Label>

//                     <Input
//                       value={item.name}
//                       onChange={(e) =>
//                         handleItemChange(index, "name", e.target.value)
//                       }
//                       placeholder="Enter name"
//                       data-testid={`input-item-name-${index}`}
//                     />
//                   </div>

//                   <div>
//                     <Label>Description</Label>

//                     <Input
//                       value={item.description}
//                       onChange={(e) =>
//                         handleItemChange(index, "description", e.target.value)
//                       }
//                       placeholder="Optional"
//                       data-testid={`input-item-description-${index}`}
//                     />
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle>Cheque Summary</CardTitle>
//           </CardHeader>

//           <CardContent>
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
//               <div className="rounded-xl border bg-muted/30 p-4">
//                 <p className="text-sm text-muted-foreground">Cheque Amount</p>
//                 <h3 className="mt-2 text-2xl font-bold">
//                   {formatAmount(chequeValue)}
//                 </h3>
//               </div>

//               <div className="rounded-xl border bg-muted/30 p-4">
//                 <p className="text-sm text-muted-foreground">
//                   Total Item Amount
//                 </p>
//                 <h3 className="mt-2 text-2xl font-bold">
//                   {formatAmount(totalItemAmount)}
//                 </h3>
//               </div>

//               <div
//                 className={`rounded-xl border p-4 ${
//                   isExceeded
//                     ? "border-red-200 bg-red-50"
//                     : remainingBalance === 0 && chequeValue > 0
//                       ? "border-emerald-200 bg-emerald-50"
//                       : "bg-muted/30"
//                 }`}
//               >
//                 <p
//                   className={`text-sm ${
//                     isExceeded
//                       ? "text-red-600"
//                       : remainingBalance === 0 && chequeValue > 0
//                         ? "text-emerald-700"
//                         : "text-muted-foreground"
//                   }`}
//                 >
//                   Remaining Balance
//                 </p>

//                 <h3
//                   className={`mt-2 text-2xl font-bold ${
//                     isExceeded
//                       ? "text-red-700"
//                       : remainingBalance === 0 && chequeValue > 0
//                         ? "text-emerald-700"
//                         : "text-foreground"
//                   }`}
//                 >
//                   {formatAmount(remainingBalance)}
//                 </h3>
//               </div>
//             </div>

//             {isExceeded && (
//               <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
//                 The total item amount exceeds the cheque amount. Cheque amount
//                 is not sufficient for the entered items.
//               </div>
//             )}

//             {submitError && (
//               <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
//                 {submitError}
//               </div>
//             )}

//             <div className="mt-6 flex justify-end gap-3">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => setLocation("/accounts")}
//                 data-testid="button-cancel-record"
//               >
//                 Cancel
//               </Button>

//               <Button
//                 type="submit"
//                 disabled={loading || isExceeded || accounts.length === 0}
//                 data-testid="button-save-record"
//               >
//                 {loading ? (
//                   <>
//                     <i className="fas fa-spinner fa-spin mr-2"></i>
//                     Saving...
//                   </>
//                 ) : (
//                   "Save Record"
//                 )}
//               </Button>
//             </div>
//           </CardContent>
//         </Card>
//       </form>
//     </div>
//   );
// }






// import { FormEvent, useEffect, useMemo, useState } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import {
//   addDoc,
//   collection,
//   getDocs,
//   serverTimestamp,
//   Timestamp,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
// import { useToast } from "@/hooks/use-toast";
// import { useLocation } from "wouter";

// type AccountType = "cheque" | "online";

// type FirestoreAccountData = {
//   accountTitle?: string;
//   accountNo?: string;
//   bank?: string;
//   branch?: string;
//   city?: string;
//   platform?: string;
//   routingNumber?: string;
//   isActive?: boolean;
//   createdBy?: string;
// };

// type AccountOption = {
//   id: string;
//   key: string;
//   type: AccountType;
//   accountTitle: string;
//   accountNo: string;
//   bank: string;
//   branch?: string;
//   city?: string;
//   platform?: string;
//   routingNumber?: string;
// };

// type RawAccountOption = AccountOption & {
//   isActive?: boolean;
// };

// type RecordItem = {
//   category: string;
//   amount: string;
//   name: string;
//   description: string;
// };

// type ItemField = keyof RecordItem;

// const PANEL_ID = "IEDGE-SYSTEM";

// const categoryOptions: string[] = [
//   "Utility",
//   "General",
//   "Tuition Fees",
//   "Payroll",
//   "Travel",
//   "Accommodation",
//   "Hotel",
//   "Ticketing",
// ];

// const emptyItem: RecordItem = {
//   category: "",
//   amount: "",
//   name: "",
//   description: "",
// };

// const getPanelCollection = (...pathSegments: string[]) => {
//   return collection(db, "Panels", PANEL_ID, ...pathSegments);
// };

// const getTodayDate = (): string => {
//   const today = new Date();
//   const year = today.getFullYear();
//   const month = String(today.getMonth() + 1).padStart(2, "0");
//   const day = String(today.getDate()).padStart(2, "0");

//   return `${year}-${month}-${day}`;
// };

// const getFirestoreTimestampFromDate = (dateValue: string): Timestamp => {
//   const [year, month, day] = dateValue.split("-").map(Number);

//   return Timestamp.fromDate(new Date(year, month - 1, day, 0, 0, 0));
// };

// const normalizeChequeNumber = (value: any): string => {
//   if (value === undefined || value === null || typeof value === "object") {
//     return "";
//   }

//   return String(value).trim().toLowerCase();
// };

// const getStringListFromValue = (value: any): string[] => {
//   if (value === undefined || value === null) return [];

//   if (Array.isArray(value)) {
//     return value.flatMap((item) => getStringListFromValue(item));
//   }

//   if (typeof value === "object") return [];

//   return String(value)
//     .split(/[\n,]/g)
//     .map((item) => item.trim())
//     .filter(Boolean);
// };

// const uniqueStringList = (values: string[]): string[] => {
//   const seen = new Set<string>();

//   return values.filter((value) => {
//     const key = normalizeChequeNumber(value);

//     if (!key || seen.has(key)) return false;

//     seen.add(key);
//     return true;
//   });
// };

// const getChequeNumbersFromSource = (source: any): string[] => {
//   if (!source) return [];

//   const chequeNumbers = [
//     ...getStringListFromValue(source?.reference),
//     ...getStringListFromValue(source?.Reference),
//     ...getStringListFromValue(source?.paymentReference),
//     ...getStringListFromValue(source?.paymentRef),
//     ...getStringListFromValue(source?.refNo),
//     ...getStringListFromValue(source?.referenceNo),
//     ...getStringListFromValue(source?.transactionReference),

//     ...getStringListFromValue(source?.chequeNumber),
//     ...getStringListFromValue(source?.chequeNumbers),
//     ...getStringListFromValue(source?.chequeNo),
//     ...getStringListFromValue(source?.checkNumber),
//     ...getStringListFromValue(source?.checkNo),
//     ...getStringListFromValue(source?.bankChequeNumber),
//     ...getStringListFromValue(source?.paymentChequeNumber),
//     ...getStringListFromValue(source?.receivedChequeNumber),

//     ...getStringListFromValue(source?.paymentDetails?.reference),
//     ...getStringListFromValue(source?.paymentDetails?.Reference),
//     ...getStringListFromValue(source?.paymentDetails?.paymentReference),
//     ...getStringListFromValue(source?.paymentDetails?.paymentRef),
//     ...getStringListFromValue(source?.paymentDetails?.refNo),
//     ...getStringListFromValue(source?.paymentDetails?.referenceNo),
//     ...getStringListFromValue(source?.paymentDetails?.transactionReference),
//     ...getStringListFromValue(source?.paymentDetails?.chequeNumber),
//     ...getStringListFromValue(source?.paymentDetails?.chequeNumbers),
//     ...getStringListFromValue(source?.paymentDetails?.chequeNo),
//     ...getStringListFromValue(source?.paymentDetails?.checkNumber),
//     ...getStringListFromValue(source?.paymentDetails?.checkNo),

//     ...getStringListFromValue(source?.accountDetails?.reference),
//     ...getStringListFromValue(source?.accountDetails?.Reference),
//     ...getStringListFromValue(source?.accountDetails?.paymentReference),
//     ...getStringListFromValue(source?.accountDetails?.paymentRef),
//     ...getStringListFromValue(source?.accountDetails?.refNo),
//     ...getStringListFromValue(source?.accountDetails?.referenceNo),
//     ...getStringListFromValue(source?.accountDetails?.transactionReference),
//     ...getStringListFromValue(source?.accountDetails?.chequeNumber),
//     ...getStringListFromValue(source?.accountDetails?.chequeNumbers),
//     ...getStringListFromValue(source?.accountDetails?.chequeNo),
//     ...getStringListFromValue(source?.accountDetails?.checkNumber),
//     ...getStringListFromValue(source?.accountDetails?.checkNo),

//     ...getStringListFromValue(source?.bankDetails?.reference),
//     ...getStringListFromValue(source?.bankDetails?.Reference),
//     ...getStringListFromValue(source?.bankDetails?.paymentReference),
//     ...getStringListFromValue(source?.bankDetails?.paymentRef),
//     ...getStringListFromValue(source?.bankDetails?.refNo),
//     ...getStringListFromValue(source?.bankDetails?.referenceNo),
//     ...getStringListFromValue(source?.bankDetails?.transactionReference),
//     ...getStringListFromValue(source?.bankDetails?.chequeNumber),
//     ...getStringListFromValue(source?.bankDetails?.chequeNumbers),
//     ...getStringListFromValue(source?.bankDetails?.chequeNo),
//     ...getStringListFromValue(source?.bankDetails?.checkNumber),
//     ...getStringListFromValue(source?.bankDetails?.checkNo),

//     ...getStringListFromValue(source?.receivePayment?.reference),
//     ...getStringListFromValue(source?.receivePayment?.Reference),
//     ...getStringListFromValue(source?.receivePayment?.paymentReference),
//     ...getStringListFromValue(source?.receivePayment?.paymentRef),
//     ...getStringListFromValue(source?.receivePayment?.refNo),
//     ...getStringListFromValue(source?.receivePayment?.referenceNo),
//     ...getStringListFromValue(source?.receivePayment?.transactionReference),
//     ...getStringListFromValue(source?.receivePayment?.chequeNumber),
//     ...getStringListFromValue(source?.receivePayment?.chequeNumbers),
//     ...getStringListFromValue(source?.receivePayment?.chequeNo),
//     ...getStringListFromValue(source?.receivePayment?.checkNumber),
//     ...getStringListFromValue(source?.receivePayment?.checkNo),

//     ...getStringListFromValue(source?.latestPaymentRelease?.reference),
//     ...getStringListFromValue(source?.latestPaymentRelease?.paymentReference),
//     ...getStringListFromValue(source?.latestPaymentRelease?.paymentRef),
//     ...getStringListFromValue(source?.latestPaymentRelease?.refNo),
//     ...getStringListFromValue(source?.latestPaymentRelease?.referenceNo),
//     ...getStringListFromValue(source?.latestPaymentRelease?.transactionReference),
//     ...getStringListFromValue(source?.latestPaymentRelease?.chequeNumber),
//     ...getStringListFromValue(source?.latestPaymentRelease?.chequeNumbers),
//     ...getStringListFromValue(source?.latestPaymentRelease?.chequeNo),
//     ...getStringListFromValue(source?.latestPaymentRelease?.checkNumber),
//     ...getStringListFromValue(source?.latestPaymentRelease?.checkNo),
//   ];

//   return uniqueStringList(chequeNumbers);
// };

// const getChequeNumbersFromPaymentReleaseHistory = (source: any): string[] => {
//   const history = Array.isArray(source?.paymentReleaseHistory)
//     ? source.paymentReleaseHistory
//     : [];

//   return uniqueStringList(
//     history.flatMap((entry: any) => getChequeNumbersFromSource(entry))
//   );
// };

// export default function Record() {
//   const { userProfile } = useAuth();
//   const { toast } = useToast();
//   const [, setLocation] = useLocation();

//   const todayDate = getTodayDate();

//   const [accounts, setAccounts] = useState<AccountOption[]>([]);
//   const [accountsLoading, setAccountsLoading] = useState<boolean>(true);
//   const [selectedAccountKey, setSelectedAccountKey] = useState<string>("");

//   const [chequeNumber, setChequeNumber] = useState<string>("");
//   const [statementTitle, setStatementTitle] = useState<string>("");
//   const [selectedDate, setSelectedDate] = useState<string>(todayDate);
//   const [chequeAmount, setChequeAmount] = useState<string>("");
//   const [items, setItems] = useState<RecordItem[]>([{ ...emptyItem }]);

//   const [loading, setLoading] = useState<boolean>(false);
//   const [submitError, setSubmitError] = useState<string>("");
//   const [duplicateChequeWarning, setDuplicateChequeWarning] =
//     useState<string>("");

//   const getErrorMessage = (error: unknown): string => {
//     if (error instanceof Error) return error.message;
//     return "Something went wrong";
//   };

//   useEffect(() => {
//     let isMounted = true;

//     async function fetchAccounts() {
//       try {
//         setAccountsLoading(true);

//         const [chequeSnapshot, onlineSnapshot] = await Promise.all([
//           getDocs(collection(db, "chequeAccounts")),
//           getDocs(collection(db, "onlineAccounts")),
//         ]);

//         const chequeAccountsRaw: RawAccountOption[] = chequeSnapshot.docs.map(
//           (doc) => {
//             const data = doc.data() as FirestoreAccountData;

//             return {
//               id: doc.id,
//               key: `cheque-${doc.id}`,
//               type: "cheque",
//               accountTitle: data.accountTitle || "Untitled Account",
//               accountNo: data.accountNo || "",
//               bank: data.bank || "",
//               branch: data.branch || "",
//               city: data.city || "",
//               isActive: data.isActive,
//             };
//           }
//         );

//         const onlineAccountsRaw: RawAccountOption[] = onlineSnapshot.docs.map(
//           (doc) => {
//             const data = doc.data() as FirestoreAccountData;

//             return {
//               id: doc.id,
//               key: `online-${doc.id}`,
//               type: "online",
//               accountTitle: data.accountTitle || "Untitled Account",
//               accountNo: data.accountNo || "",
//               bank: data.bank || "",
//               platform: data.platform || "",
//               routingNumber: data.routingNumber || "",
//               isActive: data.isActive,
//             };
//           }
//         );

//         const activeChequeAccounts: AccountOption[] = chequeAccountsRaw
//           .filter((account) => account.isActive !== false)
//           .map(({ isActive, ...account }) => account);

//         const activeOnlineAccounts: AccountOption[] = onlineAccountsRaw
//           .filter((account) => account.isActive !== false)
//           .map(({ isActive, ...account }) => account);

//         const mergedAccounts = [
//           ...activeChequeAccounts,
//           ...activeOnlineAccounts,
//         ].sort((a, b) => a.accountTitle.localeCompare(b.accountTitle));

//         if (isMounted) {
//           setAccounts(mergedAccounts);
//         }
//       } catch (error) {
//         console.error("Failed to fetch accounts:", error);

//         toast({
//           title: "Error",
//           description: getErrorMessage(error) || "Failed to fetch accounts",
//           variant: "destructive",
//         });
//       } finally {
//         if (isMounted) {
//           setAccountsLoading(false);
//         }
//       }
//     }

//     fetchAccounts();

//     return () => {
//       isMounted = false;
//     };
//   }, [toast]);

//   const selectedAccount = useMemo<AccountOption | null>(() => {
//     return (
//       accounts.find((account) => account.key === selectedAccountKey) || null
//     );
//   }, [accounts, selectedAccountKey]);

//   const totalItemAmount = useMemo<number>(() => {
//     return items.reduce((total, item) => {
//       return total + (Number(item.amount) || 0);
//     }, 0);
//   }, [items]);

//   const chequeValue = Number(chequeAmount) || 0;
//   const remainingBalance = chequeValue - totalItemAmount;
//   const isExceeded = chequeValue > 0 && totalItemAmount > chequeValue;

//   const formatAmount = (value: number): string => {
//     return value.toLocaleString("en-US", {
//       maximumFractionDigits: 2,
//     });
//   };

//   const sanitizeAmount = (value: string): string => {
//     let cleanValue = value.replace(/[^0-9.]/g, "");

//     const parts = cleanValue.split(".");
//     if (parts.length > 2) {
//       cleanValue = `${parts[0]}.${parts.slice(1).join("")}`;
//     }

//     return cleanValue;
//   };

//   const chequeNumberAlreadyExists = async (
//     chequeNumberValue: string
//   ): Promise<boolean> => {
//     const targetChequeNumber = normalizeChequeNumber(chequeNumberValue);

//     if (!targetChequeNumber) return false;

//     try {
//       const accountStatementSourceCollections = [
//         "payments",
//         "invoiceRequests",
//         "Record",
//         "claimReimbursements",
//         "accountStatementManualEntries",
//       ];

//       const snapshots = await Promise.all(
//         accountStatementSourceCollections.map((collectionName) =>
//           getDocs(getPanelCollection(collectionName))
//         )
//       );

//       return snapshots.some((snapshot) =>
//         snapshot.docs.some((documentSnapshot) => {
//           const data = documentSnapshot.data();

//           const chequeNumbers = uniqueStringList([
//             ...getChequeNumbersFromSource(data),
//             ...getChequeNumbersFromPaymentReleaseHistory(data),
//           ]);

//           return chequeNumbers.some(
//             (existingChequeNumber) =>
//               normalizeChequeNumber(existingChequeNumber) === targetChequeNumber
//           );
//         })
//       );
//     } catch (error) {
//       console.warn(
//         "Failed to check cheque number from Account Statement records:",
//         error
//       );

//       return false;
//     }
//   };

//   const checkChequeNumberDuplicate = async (value: string): Promise<boolean> => {
//     const cleanValue = value.trim();

//     if (!cleanValue) {
//       setDuplicateChequeWarning("");
//       return false;
//     }

//     const exists = await chequeNumberAlreadyExists(cleanValue);

//     if (exists) {
//       setDuplicateChequeWarning("This cheque number already exists.");
//     } else {
//       setDuplicateChequeWarning("");
//     }

//     return exists;
//   };

//   const handleChequeNumberChange = (value: string) => {
//     setChequeNumber(value);
//     setSubmitError("");
//     setDuplicateChequeWarning("");
//   };

//   const handleStatementTitleChange = (value: string) => {
//     setStatementTitle(value);
//     setSubmitError("");
//   };

//   const handleDateChange = (value: string) => {
//     setSelectedDate(value);
//     setSubmitError("");
//   };

//   const handleChequeAmountChange = (value: string) => {
//     setChequeAmount(sanitizeAmount(value));
//     setSubmitError("");
//   };

//   const handleItemChange = (index: number, field: ItemField, value: string) => {
//     const updatedItems = [...items];

//     updatedItems[index] = {
//       ...updatedItems[index],
//       [field]: field === "amount" ? sanitizeAmount(value) : value,
//     };

//     setItems(updatedItems);
//     setSubmitError("");
//   };

//   const handleAddItem = () => {
//     setItems((prevItems) => [...prevItems, { ...emptyItem }]);
//     setSubmitError("");
//   };

//   const handleRemoveItem = (index: number) => {
//     if (items.length === 1) return;

//     const updatedItems = items.filter((_, itemIndex) => itemIndex !== index);
//     setItems(updatedItems);
//     setSubmitError("");
//   };

//   const resetForm = () => {
//     setSelectedAccountKey("");
//     setChequeNumber("");
//     setStatementTitle("");
//     setSelectedDate(getTodayDate());
//     setChequeAmount("");
//     setItems([{ ...emptyItem }]);
//     setSubmitError("");
//     setDuplicateChequeWarning("");
//   };

//   const validateForm = (): string => {
//     if (!selectedAccount) {
//       return "Please select an account.";
//     }

//     if (!chequeNumber.trim()) {
//       return "Please enter cheque number.";
//     }

//     if (!selectedDate) {
//       return "Please select a date.";
//     }

//     if (selectedDate > todayDate) {
//       return "Future dates are not allowed.";
//     }

//     if (!chequeAmount || chequeValue <= 0) {
//       return "Please enter a valid cheque amount.";
//     }

//     for (let i = 0; i < items.length; i++) {
//       const item = items[i];

//       if (!item.category) {
//         return `Please select a category for item ${i + 1}.`;
//       }

//       if (!item.name.trim()) {
//         return `Please enter a name for item ${i + 1}.`;
//       }

//       if (!item.amount || Number(item.amount) <= 0) {
//         return `Please enter a valid amount for item ${i + 1}.`;
//       }
//     }

//     if (totalItemAmount > chequeValue) {
//       return "The total item amount exceeds the cheque amount. Cheque amount is not sufficient for the entered items.";
//     }

//     return "";
//   };

//   async function handleSubmit(e: FormEvent<HTMLFormElement>) {
//     e.preventDefault();

//     const error = validateForm();

//     if (error) {
//       setSubmitError(error);

//       toast({
//         title: "Error",
//         description: error,
//         variant: "destructive",
//       });

//       return;
//     }

//     if (!selectedAccount) return;

//     try {
//       setLoading(true);

//       const profileData = userProfile as {
//         id?: string;
//         name?: string;
//         displayName?: string;
//         email?: string;
//       } | null;

//       const selectedCreatedAt = getFirestoreTimestampFromDate(selectedDate);
//       const cleanChequeNumber = chequeNumber.trim();

//       const isDuplicateChequeNumber =
//         await checkChequeNumberDuplicate(cleanChequeNumber);

//       const payload = {
//         firebasePath: "/Panels/IEDGE-SYSTEM/Record",

//         selectedDate,
//         chequeDate: selectedDate,

//         accountId: selectedAccount.id,
//         accountType: selectedAccount.type,
//         accountTitle: selectedAccount.accountTitle,
//         accountNo: selectedAccount.accountNo,
//         bank: selectedAccount.bank,
//         branch: selectedAccount.branch || "",
//         city: selectedAccount.city || "",
//         platform: selectedAccount.platform || "",
//         routingNumber: selectedAccount.routingNumber || "",

//         chequeNumber: cleanChequeNumber,
//         statementTitle: statementTitle.trim(),
//         chequeAmount: chequeValue,
//         totalItemAmount,
//         remainingBalance,

//         items: items.map((item) => ({
//           category: item.category,
//           name: item.name.trim(),
//           amount: Number(item.amount),
//           description: item.description.trim(),
//         })),

//         createdBy: profileData?.id || "",
//         createdByName:
//           profileData?.name ||
//           profileData?.displayName ||
//           profileData?.email ||
//           "Unknown User",

//         createdAt: selectedCreatedAt,
//         updatedAt: serverTimestamp(),
//         status: "active",
//       };

//       await addDoc(getPanelCollection("Record"), payload);

//       toast({
//         title: isDuplicateChequeNumber ? "Saved with warning" : "Success",
//         description: isDuplicateChequeNumber
//           ? "This cheque number already exists in Account Statement records, but the record was saved successfully."
//           : "Record added successfully",
//       });

//       resetForm();

//       window.location.reload();
//     } catch (error) {
//       console.error("Failed to add record:", error);

//       toast({
//         title: "Error",
//         description: getErrorMessage(error) || "Failed to add record",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="mx-auto max-w-6xl">
//       <form onSubmit={handleSubmit} className="space-y-6">
//         <Card>
//           <CardHeader>
//             <CardTitle>Cheque Information</CardTitle>
//           </CardHeader>

//           <CardContent>
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
//               <div>
//                 <Label>Account Select *</Label>

//                 <Select
//                   value={selectedAccountKey}
//                   onValueChange={(value: string) => {
//                     setSelectedAccountKey(value);
//                     setSubmitError("");
//                   }}
//                   disabled={accountsLoading}
//                 >
//                   <SelectTrigger data-testid="select-account">
//                     <SelectValue
//                       placeholder={
//                         accountsLoading
//                           ? "Loading accounts..."
//                           : "Select account"
//                       }
//                     />
//                   </SelectTrigger>

//                   <SelectContent>
//                     {accounts.map((account) => (
//                       <SelectItem key={account.key} value={account.key}>
//                         {account.accountTitle} - {account.bank} -{" "}
//                         {account.accountNo} (
//                         {account.type === "cheque" ? "Cheque" : "Online"})
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>

//                 {!accountsLoading && accounts.length === 0 && (
//                   <p className="mt-2 text-sm text-destructive">
//                     No active accounts found. Please add an account first.
//                   </p>
//                 )}
//               </div>

//               <div>
//                 <Label htmlFor="chequeNumber">Cheque Number *</Label>

//                 <Input
//                   id="chequeNumber"
//                   value={chequeNumber}
//                   onChange={(e) => handleChequeNumberChange(e.target.value)}
//                   onBlur={() => {
//                     void checkChequeNumberDuplicate(chequeNumber);
//                   }}
//                   placeholder="Enter cheque number"
//                   data-testid="input-cheque-number"
//                 />

//                 {duplicateChequeWarning && (
//                   <p className="mt-2 text-sm font-medium text-amber-600">
//                     {duplicateChequeWarning}
//                   </p>
//                 )}
//               </div>

//               <div>
//                 <Label htmlFor="statementTitle">Statement Title</Label>

//                 <Input
//                   id="statementTitle"
//                   value={statementTitle}
//                   onChange={(e) => handleStatementTitleChange(e.target.value)}
//                   placeholder="Enter statement title"
//                   data-testid="input-statement-title"
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="selectedDate">Select Date *</Label>

//                 <Input
//                   id="selectedDate"
//                   type="date"
//                   value={selectedDate}
//                   max={todayDate}
//                   onChange={(e) => handleDateChange(e.target.value)}
//                   data-testid="input-select-date"
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="chequeAmount">Cheque Amount *</Label>

//                 <Input
//                   id="chequeAmount"
//                   value={chequeAmount}
//                   onChange={(e) => handleChequeAmountChange(e.target.value)}
//                   placeholder="Enter cheque amount"
//                   data-testid="input-cheque-amount"
//                 />
//               </div>
//             </div>

//             {selectedAccount && (
//               <div className="mt-5 rounded-xl border bg-muted/40 p-4">
//                 <p className="text-sm font-semibold text-foreground">
//                   Selected Account Details
//                 </p>

//                 <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-4">
//                   <div>
//                     <p className="text-muted-foreground">Account Title</p>
//                     <p className="font-medium">
//                       {selectedAccount.accountTitle}
//                     </p>
//                   </div>

//                   <div>
//                     <p className="text-muted-foreground">Bank</p>
//                     <p className="font-medium">{selectedAccount.bank}</p>
//                   </div>

//                   <div>
//                     <p className="text-muted-foreground">Account No</p>
//                     <p className="font-medium">{selectedAccount.accountNo}</p>
//                   </div>

//                   <div>
//                     <p className="text-muted-foreground">Selected Date</p>
//                     <p className="font-medium">{selectedDate || "-"}</p>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//               <CardTitle>Record Items</CardTitle>

//               <Button
//                 type="button"
//                 onClick={handleAddItem}
//                 data-testid="button-add-item"
//               >
//                 Add New Item
//               </Button>
//             </div>
//           </CardHeader>

//           <CardContent className="space-y-4">
//             {items.map((item, index) => (
//               <div key={index} className="rounded-xl border bg-muted/30 p-4">
//                 <div className="mb-4 flex items-center justify-between">
//                   <h3 className="font-semibold text-foreground">
//                     Item {index + 1}
//                   </h3>

//                   {items.length > 1 && (
//                     <Button
//                       type="button"
//                       variant="outline"
//                       onClick={() => handleRemoveItem(index)}
//                       data-testid={`button-remove-item-${index}`}
//                     >
//                       Remove
//                     </Button>
//                   )}
//                 </div>

//                 <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
//                   <div>
//                     <Label>Category *</Label>

//                     <Select
//                       value={item.category}
//                       onValueChange={(value: string) =>
//                         handleItemChange(index, "category", value)
//                       }
//                     >
//                       <SelectTrigger data-testid={`select-category-${index}`}>
//                         <SelectValue placeholder="Select category" />
//                       </SelectTrigger>

//                       <SelectContent>
//                         {categoryOptions.map((category) => (
//                           <SelectItem key={category} value={category}>
//                             {category}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   <div>
//                     <Label>Amount *</Label>

//                     <Input
//                       value={item.amount}
//                       onChange={(e) =>
//                         handleItemChange(index, "amount", e.target.value)
//                       }
//                       placeholder="Enter amount"
//                       data-testid={`input-item-amount-${index}`}
//                     />
//                   </div>

//                   <div>
//                     <Label>Name *</Label>

//                     <Input
//                       value={item.name}
//                       onChange={(e) =>
//                         handleItemChange(index, "name", e.target.value)
//                       }
//                       placeholder="Enter name"
//                       data-testid={`input-item-name-${index}`}
//                     />
//                   </div>

//                   <div>
//                     <Label>Description</Label>

//                     <Input
//                       value={item.description}
//                       onChange={(e) =>
//                         handleItemChange(index, "description", e.target.value)
//                       }
//                       placeholder="Optional"
//                       data-testid={`input-item-description-${index}`}
//                     />
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle>Cheque Summary</CardTitle>
//           </CardHeader>

//           <CardContent>
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
//               <div className="rounded-xl border bg-muted/30 p-4">
//                 <p className="text-sm text-muted-foreground">Cheque Amount</p>
//                 <h3 className="mt-2 text-2xl font-bold">
//                   {formatAmount(chequeValue)}
//                 </h3>
//               </div>

//               <div className="rounded-xl border bg-muted/30 p-4">
//                 <p className="text-sm text-muted-foreground">
//                   Total Item Amount
//                 </p>
//                 <h3 className="mt-2 text-2xl font-bold">
//                   {formatAmount(totalItemAmount)}
//                 </h3>
//               </div>

//               <div
//                 className={`rounded-xl border p-4 ${
//                   isExceeded
//                     ? "border-red-200 bg-red-50"
//                     : remainingBalance === 0 && chequeValue > 0
//                       ? "border-emerald-200 bg-emerald-50"
//                       : "bg-muted/30"
//                 }`}
//               >
//                 <p
//                   className={`text-sm ${
//                     isExceeded
//                       ? "text-red-600"
//                       : remainingBalance === 0 && chequeValue > 0
//                         ? "text-emerald-700"
//                         : "text-muted-foreground"
//                   }`}
//                 >
//                   Remaining Balance
//                 </p>

//                 <h3
//                   className={`mt-2 text-2xl font-bold ${
//                     isExceeded
//                       ? "text-red-700"
//                       : remainingBalance === 0 && chequeValue > 0
//                         ? "text-emerald-700"
//                         : "text-foreground"
//                   }`}
//                 >
//                   {formatAmount(remainingBalance)}
//                 </h3>
//               </div>
//             </div>

//             {isExceeded && (
//               <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
//                 The total item amount exceeds the cheque amount. Cheque amount
//                 is not sufficient for the entered items.
//               </div>
//             )}

//             {duplicateChequeWarning && (
//               <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
//                 {duplicateChequeWarning} You can still save this record.
//               </div>
//             )}

//             {submitError && (
//               <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
//                 {submitError}
//               </div>
//             )}

//             <div className="mt-6 flex justify-end gap-3">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => setLocation("/accounts")}
//                 data-testid="button-cancel-record"
//               >
//                 Cancel
//               </Button>

//               <Button
//                 type="submit"
//                 disabled={loading || isExceeded || accounts.length === 0}
//                 data-testid="button-save-record"
//               >
//                 {loading ? (
//                   <>
//                     <i className="fas fa-spinner fa-spin mr-2"></i>
//                     Saving...
//                   </>
//                 ) : (
//                   "Save Record"
//                 )}
//               </Button>
//             </div>
//           </CardContent>
//         </Card>
//       </form>
//     </div>
//   );
// }








import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AccountType = "cheque" | "online";

type FirestoreAccountData = {
  accountTitle?: string;
  accountNo?: string;
  bank?: string;
  branch?: string;
  city?: string;
  platform?: string;
  routingNumber?: string;
  isActive?: boolean;
  createdBy?: string;
};

type AccountOption = {
  id: string;
  key: string;
  type: AccountType;
  accountTitle: string;
  accountNo: string;
  bank: string;
  branch?: string;
  city?: string;
  platform?: string;
  routingNumber?: string;
};

type RawAccountOption = AccountOption & {
  isActive?: boolean;
};

type RecordItem = {
  category: string;
  amount: string;
  name: string;
  description: string;
};

type ItemField = keyof RecordItem;

type PdfRecordItem = {
  category: string;
  amount: number;
  name: string;
  description: string;
};

type PdfRecordData = {
  recordId?: string;
  selectedDate: string;
  accountType: AccountType;
  accountTitle: string;
  accountNo: string;
  bank: string;
  branch?: string;
  city?: string;
  platform?: string;
  routingNumber?: string;
  chequeNumber: string;
  statementTitle: string;
  chequeAmount: number;
  totalItemAmount: number;
  remainingBalance: number;
  createdByName: string;
  items: PdfRecordItem[];
};

type PdfPageCommands = string[];

const sanitizePdfText = (value: unknown): string => {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
};

const wrapPdfText = (value: unknown, maxCharacters: number): string[] => {
  const text = String(value ?? "").trim();

  if (!text) return ["-"];

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    if (word.length > maxCharacters) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = "";
      }

      for (let index = 0; index < word.length; index += maxCharacters) {
        lines.push(word.slice(index, index + maxCharacters));
      }

      return;
    }

    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (candidate.length <= maxCharacters) {
      currentLine = candidate;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) lines.push(currentLine);

  return lines.length > 0 ? lines : ["-"];
};

const createRecordPdfBlob = (record: PdfRecordData): Blob => {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 40;
  const bottomMargin = 45;
  const contentWidth = pageWidth - margin * 2;
  const pages: PdfPageCommands[] = [];
  let currentPage: PdfPageCommands = [];
  let cursorY = 0;
  let pageNumber = 0;

  const toPdfY = (topPosition: number): number => pageHeight - topPosition;

  const addText = (
    text: unknown,
    x: number,
    topPosition: number,
    size = 10,
    bold = false
  ) => {
    currentPage.push(
      `BT /${bold ? "F2" : "F1"} ${size} Tf 0 0 0 rg ${x.toFixed(
        2
      )} ${toPdfY(topPosition).toFixed(2)} Td (${sanitizePdfText(text)}) Tj ET`
    );
  };

  const drawLine = (
    startX: number,
    startTop: number,
    endX: number,
    endTop: number,
    width = 0.7
  ) => {
    currentPage.push(
      `${width} w ${startX.toFixed(2)} ${toPdfY(startTop).toFixed(
        2
      )} m ${endX.toFixed(2)} ${toPdfY(endTop).toFixed(2)} l S`
    );
  };

  const drawRect = (
    x: number,
    topPosition: number,
    width: number,
    height: number,
    fillGray?: number
  ) => {
    const bottomY = pageHeight - topPosition - height;

    if (fillGray !== undefined) {
      currentPage.push(
        `${fillGray} g ${x.toFixed(2)} ${bottomY.toFixed(2)} ${width.toFixed(
          2
        )} ${height.toFixed(2)} re f 0 g`
      );
    }

    currentPage.push(
      `0.7 w ${x.toFixed(2)} ${bottomY.toFixed(2)} ${width.toFixed(
        2
      )} ${height.toFixed(2)} re S`
    );
  };

  const startPage = (continued = false) => {
    currentPage = [];
    pages.push(currentPage);
    pageNumber += 1;

    addText(
      continued ? "IEDGE FINANCIAL RECORD - CONTINUED" : "IEDGE FINANCIAL RECORD",
      margin,
      48,
      continued ? 15 : 18,
      true
    );
    addText(
      "Official account, cheque and transaction record",
      margin,
      67,
      9
    );
    drawLine(margin, 79, pageWidth - margin, 79, 1);
    cursorY = 103;
  };

  const ensureSpace = (requiredHeight: number, onNewPage?: () => void) => {
    if (cursorY + requiredHeight <= pageHeight - bottomMargin) return;

    startPage(true);
    onNewPage?.();
  };

  const addSectionTitle = (title: string) => {
    ensureSpace(32);
    drawRect(margin, cursorY, contentWidth, 24, 0.94);
    addText(title, margin + 10, cursorY + 16, 11, true);
    cursorY += 34;
  };

  const addKeyValue = (
    label: string,
    value: unknown,
    x: number,
    width: number,
    valueCharacters = 34
  ): number => {
    const valueLines = wrapPdfText(value, valueCharacters);
    const rowHeight = Math.max(30, 18 + valueLines.length * 12);

    drawRect(x, cursorY, width, rowHeight);
    addText(label, x + 9, cursorY + 14, 8, true);

    valueLines.forEach((line, index) => {
      addText(line, x + 9, cursorY + 27 + index * 11, 9);
    });

    return rowHeight;
  };

  const formatPdfAmount = (value: number): string => {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  startPage();

  addSectionTitle("Record Information");

  const halfWidth = (contentWidth - 10) / 2;
  let leftHeight = addKeyValue(
    "Record ID",
    record.recordId || "Not saved yet",
    margin,
    halfWidth
  );
  let rightHeight = addKeyValue(
    "Record Date",
    record.selectedDate,
    margin + halfWidth + 10,
    halfWidth
  );
  cursorY += Math.max(leftHeight, rightHeight) + 10;

  leftHeight = addKeyValue(
    "Cheque Number",
    record.chequeNumber,
    margin,
    halfWidth
  );
  rightHeight = addKeyValue(
    "Statement Title",
    record.statementTitle || "-",
    margin + halfWidth + 10,
    halfWidth,
    32
  );
  cursorY += Math.max(leftHeight, rightHeight) + 10;

  leftHeight = addKeyValue(
    "Created By",
    record.createdByName || "Unknown User",
    margin,
    halfWidth
  );
  rightHeight = addKeyValue(
    "Account Type",
    record.accountType === "cheque" ? "Cheque Account" : "Online Account",
    margin + halfWidth + 10,
    halfWidth
  );
  cursorY += Math.max(leftHeight, rightHeight) + 14;

  addSectionTitle("Account Details");

  leftHeight = addKeyValue(
    "Account Title",
    record.accountTitle,
    margin,
    halfWidth,
    32
  );
  rightHeight = addKeyValue(
    "Bank / Platform",
    record.bank || record.platform || "-",
    margin + halfWidth + 10,
    halfWidth,
    32
  );
  cursorY += Math.max(leftHeight, rightHeight) + 10;

  leftHeight = addKeyValue(
    "Account Number",
    record.accountNo || "-",
    margin,
    halfWidth
  );
  rightHeight = addKeyValue(
    "Branch / Routing Number",
    record.branch || record.routingNumber || "-",
    margin + halfWidth + 10,
    halfWidth,
    32
  );
  cursorY += Math.max(leftHeight, rightHeight) + 14;

  const itemColumns = [
    { label: "#", width: 28, maxCharacters: 3 },
    { label: "Category", width: 92, maxCharacters: 15 },
    { label: "Name", width: 128, maxCharacters: 21 },
    { label: "Amount", width: 76, maxCharacters: 12 },
    { label: "Description", width: contentWidth - 324, maxCharacters: 28 },
  ];

  const addItemsTableHeader = (continued = false) => {
    if (continued) {
      addText("Record Items (continued)", margin, cursorY, 11, true);
      cursorY += 14;
    }

    const headerHeight = 26;
    drawRect(margin, cursorY, contentWidth, headerHeight, 0.9);

    let x = margin;
    itemColumns.forEach((column) => {
      addText(column.label, x + 6, cursorY + 17, 8, true);
      x += column.width;
      if (x < margin + contentWidth) {
        drawLine(x, cursorY, x, cursorY + headerHeight);
      }
    });

    cursorY += headerHeight;
  };

  addSectionTitle("Record Items");
  addItemsTableHeader();

  record.items.forEach((item, index) => {
    const cellLines = [
      [String(index + 1)],
      wrapPdfText(item.category, itemColumns[1].maxCharacters),
      wrapPdfText(item.name, itemColumns[2].maxCharacters),
      [formatPdfAmount(item.amount)],
      wrapPdfText(item.description || "-", itemColumns[4].maxCharacters),
    ];

    const maximumLines = Math.max(...cellLines.map((lines) => lines.length));
    const rowHeight = Math.max(28, 14 + maximumLines * 11);

    ensureSpace(rowHeight + 12, () => addItemsTableHeader(true));
    drawRect(margin, cursorY, contentWidth, rowHeight);

    let x = margin;

    cellLines.forEach((lines, columnIndex) => {
      lines.forEach((line, lineIndex) => {
        addText(line, x + 6, cursorY + 16 + lineIndex * 11, 8);
      });

      x += itemColumns[columnIndex].width;

      if (x < margin + contentWidth) {
        drawLine(x, cursorY, x, cursorY + rowHeight);
      }
    });

    cursorY += rowHeight;
  });

  cursorY += 16;
  ensureSpace(145);
  addSectionTitle("Cheque Summary");

  const summaryRows = [
    ["Cheque Amount", formatPdfAmount(record.chequeAmount)],
    ["Total Item Amount", formatPdfAmount(record.totalItemAmount)],
    ["Remaining Balance", formatPdfAmount(record.remainingBalance)],
  ];

  summaryRows.forEach(([label, value], index) => {
    const rowHeight = 30;
    drawRect(margin, cursorY, contentWidth, rowHeight, index === 2 ? 0.94 : undefined);
    addText(label, margin + 10, cursorY + 19, 9, index === 2);
    addText(value, pageWidth - margin - 105, cursorY + 19, 10, true);
    cursorY += rowHeight;
  });

  pages.forEach((page, index) => {
    const footerText = `Page ${index + 1} of ${pages.length}`;
    page.push(
      `BT /F1 8 Tf 0 0 0 rg ${(pageWidth - margin - 55).toFixed(
        2
      )} ${toPdfY(pageHeight - 22).toFixed(2)} Td (${sanitizePdfText(
        footerText
      )}) Tj ET`
    );
    page.push(
      `BT /F1 8 Tf 0 0 0 rg ${margin.toFixed(2)} ${toPdfY(
        pageHeight - 22
      ).toFixed(2)} Td (${sanitizePdfText(
        `Generated ${new Date().toLocaleString("en-US")}`
      )}) Tj ET`
    );
  });

  const encoder = new TextEncoder();
  const objects: string[] = [];
  const pageObjectIds: number[] = [];

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

  pages.forEach((pageCommands, index) => {
    const pageObjectId = 5 + index * 2;
    const contentObjectId = pageObjectId + 1;
    const contentStream = pageCommands.join("\n");

    pageObjectIds.push(pageObjectId);
    objects[pageObjectId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(
        2
      )} ${pageHeight.toFixed(
        2
      )}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectId} 0 R >>`;
    objects[contentObjectId] = `<< /Length ${
      encoder.encode(contentStream).length
    } >>\nstream\n${contentStream}\nendstream`;
  });

  objects[2] = `<< /Type /Pages /Kids [${pageObjectIds
    .map((id) => `${id} 0 R`)
    .join(" ")}] /Count ${pageObjectIds.length} >>`;

  let pdf = "%PDF-1.4\n%1234\n";
  const offsets: number[] = [0];

  for (let objectId = 1; objectId < objects.length; objectId += 1) {
    offsets[objectId] = encoder.encode(pdf).length;
    pdf += `${objectId} 0 obj\n${objects[objectId]}\nendobj\n`;
  }

  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += "0000000000 65535 f \n";

  for (let objectId = 1; objectId < objects.length; objectId += 1) {
    pdf += `${String(offsets[objectId]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([encoder.encode(pdf)], { type: "application/pdf" });
};

const downloadRecordPdf = (record: PdfRecordData) => {
  const blob = createRecordPdfBlob(record);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeChequeNumber = record.chequeNumber
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-");

  link.href = url;
  link.download = `record-${safeChequeNumber || record.selectedDate}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

const PANEL_ID = "IEDGE-SYSTEM";

const categoryOptions: string[] = [
  "Utility",
  "General",
  "Tuition Fees",
  "Payroll",
  "Travel",
  "Accommodation",
  "Hotel",
  "Ticketing",
];

const emptyItem: RecordItem = {
  category: "",
  amount: "",
  name: "",
  description: "",
};

const getPanelCollection = (...pathSegments: string[]) => {
  return collection(db, "Panels", PANEL_ID, ...pathSegments);
};

const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getFirestoreTimestampFromDate = (dateValue: string): Timestamp => {
  const [year, month, day] = dateValue.split("-").map(Number);

  return Timestamp.fromDate(new Date(year, month - 1, day, 0, 0, 0));
};

const normalizeChequeNumber = (value: any): string => {
  if (value === undefined || value === null || typeof value === "object") {
    return "";
  }

  return String(value).trim().toLowerCase();
};

const getStringListFromValue = (value: any): string[] => {
  if (value === undefined || value === null) return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) => getStringListFromValue(item));
  }

  if (typeof value === "object") return [];

  return String(value)
    .split(/[\n,]/g)
    .map((item) => item.trim())
    .filter(Boolean);
};

const uniqueStringList = (values: string[]): string[] => {
  const seen = new Set<string>();

  return values.filter((value) => {
    const key = normalizeChequeNumber(value);

    if (!key || seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

const getChequeNumbersFromSource = (source: any): string[] => {
  if (!source) return [];

  const chequeNumbers = [
    ...getStringListFromValue(source?.reference),
    ...getStringListFromValue(source?.Reference),
    ...getStringListFromValue(source?.paymentReference),
    ...getStringListFromValue(source?.paymentRef),
    ...getStringListFromValue(source?.refNo),
    ...getStringListFromValue(source?.referenceNo),
    ...getStringListFromValue(source?.transactionReference),

    ...getStringListFromValue(source?.chequeNumber),
    ...getStringListFromValue(source?.chequeNumbers),
    ...getStringListFromValue(source?.chequeNo),
    ...getStringListFromValue(source?.checkNumber),
    ...getStringListFromValue(source?.checkNo),
    ...getStringListFromValue(source?.bankChequeNumber),
    ...getStringListFromValue(source?.paymentChequeNumber),
    ...getStringListFromValue(source?.receivedChequeNumber),

    ...getStringListFromValue(source?.paymentDetails?.reference),
    ...getStringListFromValue(source?.paymentDetails?.Reference),
    ...getStringListFromValue(source?.paymentDetails?.paymentReference),
    ...getStringListFromValue(source?.paymentDetails?.paymentRef),
    ...getStringListFromValue(source?.paymentDetails?.refNo),
    ...getStringListFromValue(source?.paymentDetails?.referenceNo),
    ...getStringListFromValue(source?.paymentDetails?.transactionReference),
    ...getStringListFromValue(source?.paymentDetails?.chequeNumber),
    ...getStringListFromValue(source?.paymentDetails?.chequeNumbers),
    ...getStringListFromValue(source?.paymentDetails?.chequeNo),
    ...getStringListFromValue(source?.paymentDetails?.checkNumber),
    ...getStringListFromValue(source?.paymentDetails?.checkNo),

    ...getStringListFromValue(source?.accountDetails?.reference),
    ...getStringListFromValue(source?.accountDetails?.Reference),
    ...getStringListFromValue(source?.accountDetails?.paymentReference),
    ...getStringListFromValue(source?.accountDetails?.paymentRef),
    ...getStringListFromValue(source?.accountDetails?.refNo),
    ...getStringListFromValue(source?.accountDetails?.referenceNo),
    ...getStringListFromValue(source?.accountDetails?.transactionReference),
    ...getStringListFromValue(source?.accountDetails?.chequeNumber),
    ...getStringListFromValue(source?.accountDetails?.chequeNumbers),
    ...getStringListFromValue(source?.accountDetails?.chequeNo),
    ...getStringListFromValue(source?.accountDetails?.checkNumber),
    ...getStringListFromValue(source?.accountDetails?.checkNo),

    ...getStringListFromValue(source?.bankDetails?.reference),
    ...getStringListFromValue(source?.bankDetails?.Reference),
    ...getStringListFromValue(source?.bankDetails?.paymentReference),
    ...getStringListFromValue(source?.bankDetails?.paymentRef),
    ...getStringListFromValue(source?.bankDetails?.refNo),
    ...getStringListFromValue(source?.bankDetails?.referenceNo),
    ...getStringListFromValue(source?.bankDetails?.transactionReference),
    ...getStringListFromValue(source?.bankDetails?.chequeNumber),
    ...getStringListFromValue(source?.bankDetails?.chequeNumbers),
    ...getStringListFromValue(source?.bankDetails?.chequeNo),
    ...getStringListFromValue(source?.bankDetails?.checkNumber),
    ...getStringListFromValue(source?.bankDetails?.checkNo),

    ...getStringListFromValue(source?.receivePayment?.reference),
    ...getStringListFromValue(source?.receivePayment?.Reference),
    ...getStringListFromValue(source?.receivePayment?.paymentReference),
    ...getStringListFromValue(source?.receivePayment?.paymentRef),
    ...getStringListFromValue(source?.receivePayment?.refNo),
    ...getStringListFromValue(source?.receivePayment?.referenceNo),
    ...getStringListFromValue(source?.receivePayment?.transactionReference),
    ...getStringListFromValue(source?.receivePayment?.chequeNumber),
    ...getStringListFromValue(source?.receivePayment?.chequeNumbers),
    ...getStringListFromValue(source?.receivePayment?.chequeNo),
    ...getStringListFromValue(source?.receivePayment?.checkNumber),
    ...getStringListFromValue(source?.receivePayment?.checkNo),

    ...getStringListFromValue(source?.latestPaymentRelease?.reference),
    ...getStringListFromValue(source?.latestPaymentRelease?.paymentReference),
    ...getStringListFromValue(source?.latestPaymentRelease?.paymentRef),
    ...getStringListFromValue(source?.latestPaymentRelease?.refNo),
    ...getStringListFromValue(source?.latestPaymentRelease?.referenceNo),
    ...getStringListFromValue(source?.latestPaymentRelease?.transactionReference),
    ...getStringListFromValue(source?.latestPaymentRelease?.chequeNumber),
    ...getStringListFromValue(source?.latestPaymentRelease?.chequeNumbers),
    ...getStringListFromValue(source?.latestPaymentRelease?.chequeNo),
    ...getStringListFromValue(source?.latestPaymentRelease?.checkNumber),
    ...getStringListFromValue(source?.latestPaymentRelease?.checkNo),
  ];

  return uniqueStringList(chequeNumbers);
};

const getChequeNumbersFromPaymentReleaseHistory = (source: any): string[] => {
  const history = Array.isArray(source?.paymentReleaseHistory)
    ? source.paymentReleaseHistory
    : [];

  return uniqueStringList(
    history.flatMap((entry: any) => getChequeNumbersFromSource(entry))
  );
};

export default function Record() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const todayDate = getTodayDate();

  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [accountsLoading, setAccountsLoading] = useState<boolean>(true);
  const [selectedAccountKey, setSelectedAccountKey] = useState<string>("");

  const [chequeNumber, setChequeNumber] = useState<string>("");
  const [statementTitle, setStatementTitle] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);
  const [chequeAmount, setChequeAmount] = useState<string>("");
  const [items, setItems] = useState<RecordItem[]>([{ ...emptyItem }]);

  const [loading, setLoading] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [duplicateChequeWarning, setDuplicateChequeWarning] =
    useState<string>("");
  const [lastSavedRecord, setLastSavedRecord] =
    useState<PdfRecordData | null>(null);

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    return "Something went wrong";
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchAccounts() {
      try {
        setAccountsLoading(true);

        const [chequeSnapshot, onlineSnapshot] = await Promise.all([
          getDocs(collection(db, "chequeAccounts")),
          getDocs(collection(db, "onlineAccounts")),
        ]);

        const chequeAccountsRaw: RawAccountOption[] = chequeSnapshot.docs.map(
          (doc) => {
            const data = doc.data() as FirestoreAccountData;

            return {
              id: doc.id,
              key: `cheque-${doc.id}`,
              type: "cheque",
              accountTitle: data.accountTitle || "Untitled Account",
              accountNo: data.accountNo || "",
              bank: data.bank || "",
              branch: data.branch || "",
              city: data.city || "",
              isActive: data.isActive,
            };
          }
        );

        const onlineAccountsRaw: RawAccountOption[] = onlineSnapshot.docs.map(
          (doc) => {
            const data = doc.data() as FirestoreAccountData;

            return {
              id: doc.id,
              key: `online-${doc.id}`,
              type: "online",
              accountTitle: data.accountTitle || "Untitled Account",
              accountNo: data.accountNo || "",
              bank: data.bank || "",
              platform: data.platform || "",
              routingNumber: data.routingNumber || "",
              isActive: data.isActive,
            };
          }
        );

        const activeChequeAccounts: AccountOption[] = chequeAccountsRaw
          .filter((account) => account.isActive !== false)
          .map(({ isActive, ...account }) => account);

        const activeOnlineAccounts: AccountOption[] = onlineAccountsRaw
          .filter((account) => account.isActive !== false)
          .map(({ isActive, ...account }) => account);

        const mergedAccounts = [
          ...activeChequeAccounts,
          ...activeOnlineAccounts,
        ].sort((a, b) => a.accountTitle.localeCompare(b.accountTitle));

        if (isMounted) {
          setAccounts(mergedAccounts);
        }
      } catch (error) {
        console.error("Failed to fetch accounts:", error);

        toast({
          title: "Error",
          description: getErrorMessage(error) || "Failed to fetch accounts",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setAccountsLoading(false);
        }
      }
    }

    fetchAccounts();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const selectedAccount = useMemo<AccountOption | null>(() => {
    return (
      accounts.find((account) => account.key === selectedAccountKey) || null
    );
  }, [accounts, selectedAccountKey]);

  const totalItemAmount = useMemo<number>(() => {
    return items.reduce((total, item) => {
      return total + (Number(item.amount) || 0);
    }, 0);
  }, [items]);

  const chequeValue = Number(chequeAmount) || 0;
  const remainingBalance = chequeValue - totalItemAmount;
  const isExceeded = chequeValue > 0 && totalItemAmount > chequeValue;

  const formatAmount = (value: number): string => {
    return value.toLocaleString("en-US", {
      maximumFractionDigits: 2,
    });
  };

  const sanitizeAmount = (value: string): string => {
    let cleanValue = value.replace(/[^0-9.]/g, "");

    const parts = cleanValue.split(".");
    if (parts.length > 2) {
      cleanValue = `${parts[0]}.${parts.slice(1).join("")}`;
    }

    return cleanValue;
  };

  const chequeNumberAlreadyExists = async (
    chequeNumberValue: string
  ): Promise<boolean> => {
    const targetChequeNumber = normalizeChequeNumber(chequeNumberValue);

    if (!targetChequeNumber) return false;

    try {
      const accountStatementSourceCollections = [
        "payments",
        "invoiceRequests",
        "Record",
        "claimReimbursements",
        "accountStatementManualEntries",
      ];

      const snapshots = await Promise.all(
        accountStatementSourceCollections.map((collectionName) =>
          getDocs(getPanelCollection(collectionName))
        )
      );

      return snapshots.some((snapshot) =>
        snapshot.docs.some((documentSnapshot) => {
          const data = documentSnapshot.data();

          const chequeNumbers = uniqueStringList([
            ...getChequeNumbersFromSource(data),
            ...getChequeNumbersFromPaymentReleaseHistory(data),
          ]);

          return chequeNumbers.some(
            (existingChequeNumber) =>
              normalizeChequeNumber(existingChequeNumber) === targetChequeNumber
          );
        })
      );
    } catch (error) {
      console.warn(
        "Failed to check cheque number from Account Statement records:",
        error
      );

      return false;
    }
  };

  const checkChequeNumberDuplicate = async (value: string): Promise<boolean> => {
    const cleanValue = value.trim();

    if (!cleanValue) {
      setDuplicateChequeWarning("");
      return false;
    }

    const exists = await chequeNumberAlreadyExists(cleanValue);

    if (exists) {
      setDuplicateChequeWarning("This cheque number already exists.");
    } else {
      setDuplicateChequeWarning("");
    }

    return exists;
  };

  const handleChequeNumberChange = (value: string) => {
    setChequeNumber(value);
    setSubmitError("");
    setDuplicateChequeWarning("");
  };

  const handleStatementTitleChange = (value: string) => {
    setStatementTitle(value);
    setSubmitError("");
  };

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    setSubmitError("");
  };

  const handleChequeAmountChange = (value: string) => {
    setChequeAmount(sanitizeAmount(value));
    setSubmitError("");
  };

  const handleItemChange = (index: number, field: ItemField, value: string) => {
    const updatedItems = [...items];

    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === "amount" ? sanitizeAmount(value) : value,
    };

    setItems(updatedItems);
    setSubmitError("");
  };

  const handleAddItem = () => {
    setItems((prevItems) => [...prevItems, { ...emptyItem }]);
    setSubmitError("");
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;

    const updatedItems = items.filter((_, itemIndex) => itemIndex !== index);
    setItems(updatedItems);
    setSubmitError("");
  };

  const resetForm = () => {
    setSelectedAccountKey("");
    setChequeNumber("");
    setStatementTitle("");
    setSelectedDate(getTodayDate());
    setChequeAmount("");
    setItems([{ ...emptyItem }]);
    setSubmitError("");
    setDuplicateChequeWarning("");
  };

  const validateForm = (): string => {
    if (!selectedAccount) {
      return "Please select an account.";
    }

    if (!chequeNumber.trim()) {
      return "Please enter cheque number.";
    }

    if (!selectedDate) {
      return "Please select a date.";
    }

    if (selectedDate > todayDate) {
      return "Future dates are not allowed.";
    }

    if (!chequeAmount || chequeValue <= 0) {
      return "Please enter a valid cheque amount.";
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (!item.category) {
        return `Please select a category for item ${i + 1}.`;
      }

      if (!item.name.trim()) {
        return `Please enter a name for item ${i + 1}.`;
      }

      if (!item.amount || Number(item.amount) <= 0) {
        return `Please enter a valid amount for item ${i + 1}.`;
      }
    }

    if (totalItemAmount > chequeValue) {
      return "The total item amount exceeds the cheque amount. Cheque amount is not sufficient for the entered items.";
    }

    return "";
  };

  const getCurrentPdfRecord = (): PdfRecordData | null => {
    if (!selectedAccount) return null;

    const profileData = userProfile as {
      id?: string;
      name?: string;
      displayName?: string;
      email?: string;
    } | null;

    return {
      selectedDate,
      accountType: selectedAccount.type,
      accountTitle: selectedAccount.accountTitle,
      accountNo: selectedAccount.accountNo,
      bank: selectedAccount.bank,
      branch: selectedAccount.branch || "",
      city: selectedAccount.city || "",
      platform: selectedAccount.platform || "",
      routingNumber: selectedAccount.routingNumber || "",
      chequeNumber: chequeNumber.trim(),
      statementTitle: statementTitle.trim(),
      chequeAmount: chequeValue,
      totalItemAmount,
      remainingBalance,
      createdByName:
        profileData?.name ||
        profileData?.displayName ||
        profileData?.email ||
        "Unknown User",
      items: items.map((item) => ({
        category: item.category,
        name: item.name.trim(),
        amount: Number(item.amount),
        description: item.description.trim(),
      })),
    };
  };

  const handleDownloadPdf = () => {
    const hasCurrentRecordData = Boolean(
      selectedAccountKey ||
        chequeNumber.trim() ||
        statementTitle.trim() ||
        chequeAmount ||
        items.some(
          (item) =>
            item.category ||
            item.amount ||
            item.name.trim() ||
            item.description.trim()
        )
    );

    if (hasCurrentRecordData) {
      const error = validateForm();

      if (error) {
        setSubmitError(error);
        toast({
          title: "Cannot download PDF",
          description: error,
          variant: "destructive",
        });
        return;
      }

      const currentRecord = getCurrentPdfRecord();

      if (!currentRecord) return;

      downloadRecordPdf(currentRecord);
      return;
    }

    if (lastSavedRecord) {
      downloadRecordPdf(lastSavedRecord);
      return;
    }

    toast({
      title: "No record available",
      description: "Enter record details or save a record before downloading the PDF.",
      variant: "destructive",
    });
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const error = validateForm();

    if (error) {
      setSubmitError(error);

      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });

      return;
    }

    if (!selectedAccount) return;

    try {
      setLoading(true);

      const profileData = userProfile as {
        id?: string;
        name?: string;
        displayName?: string;
        email?: string;
      } | null;

      const selectedCreatedAt = getFirestoreTimestampFromDate(selectedDate);
      const cleanChequeNumber = chequeNumber.trim();

      const isDuplicateChequeNumber =
        await checkChequeNumberDuplicate(cleanChequeNumber);

      const payload = {
        firebasePath: "/Panels/IEDGE-SYSTEM/Record",

        selectedDate,
        chequeDate: selectedDate,

        accountId: selectedAccount.id,
        accountType: selectedAccount.type,
        accountTitle: selectedAccount.accountTitle,
        accountNo: selectedAccount.accountNo,
        bank: selectedAccount.bank,
        branch: selectedAccount.branch || "",
        city: selectedAccount.city || "",
        platform: selectedAccount.platform || "",
        routingNumber: selectedAccount.routingNumber || "",

        chequeNumber: cleanChequeNumber,
        statementTitle: statementTitle.trim(),
        chequeAmount: chequeValue,
        totalItemAmount,
        remainingBalance,

        items: items.map((item) => ({
          category: item.category,
          name: item.name.trim(),
          amount: Number(item.amount),
          description: item.description.trim(),
        })),

        createdBy: profileData?.id || "",
        createdByName:
          profileData?.name ||
          profileData?.displayName ||
          profileData?.email ||
          "Unknown User",

        createdAt: selectedCreatedAt,
        updatedAt: serverTimestamp(),
        status: "active",
      };

      const savedDocument = await addDoc(getPanelCollection("Record"), payload);

      setLastSavedRecord({
        recordId: savedDocument.id,
        selectedDate,
        accountType: selectedAccount.type,
        accountTitle: selectedAccount.accountTitle,
        accountNo: selectedAccount.accountNo,
        bank: selectedAccount.bank,
        branch: selectedAccount.branch || "",
        city: selectedAccount.city || "",
        platform: selectedAccount.platform || "",
        routingNumber: selectedAccount.routingNumber || "",
        chequeNumber: cleanChequeNumber,
        statementTitle: statementTitle.trim(),
        chequeAmount: chequeValue,
        totalItemAmount,
        remainingBalance,
        createdByName:
          profileData?.name ||
          profileData?.displayName ||
          profileData?.email ||
          "Unknown User",
        items: items.map((item) => ({
          category: item.category,
          name: item.name.trim(),
          amount: Number(item.amount),
          description: item.description.trim(),
        })),
      });

      toast({
        title: isDuplicateChequeNumber ? "Saved with warning" : "Success",
        description: isDuplicateChequeNumber
          ? "This cheque number already exists in Account Statement records, but the record was saved successfully."
          : "Record added successfully",
      });

      resetForm();
    } catch (error) {
      console.error("Failed to add record:", error);

      toast({
        title: "Error",
        description: getErrorMessage(error) || "Failed to add record",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Cheque Information</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div>
                <Label>Account Select *</Label>

                <Select
                  value={selectedAccountKey}
                  onValueChange={(value: string) => {
                    setSelectedAccountKey(value);
                    setSubmitError("");
                  }}
                  disabled={accountsLoading}
                >
                  <SelectTrigger data-testid="select-account">
                    <SelectValue
                      placeholder={
                        accountsLoading
                          ? "Loading accounts..."
                          : "Select account"
                      }
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.key} value={account.key}>
                        {account.accountTitle} - {account.bank} -{" "}
                        {account.accountNo} (
                        {account.type === "cheque" ? "Cheque" : "Online"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {!accountsLoading && accounts.length === 0 && (
                  <p className="mt-2 text-sm text-destructive">
                    No active accounts found. Please add an account first.
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="chequeNumber">Cheque Number *</Label>

                <Input
                  id="chequeNumber"
                  value={chequeNumber}
                  onChange={(e) => handleChequeNumberChange(e.target.value)}
                  onBlur={() => {
                    void checkChequeNumberDuplicate(chequeNumber);
                  }}
                  placeholder="Enter cheque number"
                  data-testid="input-cheque-number"
                />

                {duplicateChequeWarning && (
                  <p className="mt-2 text-sm font-medium text-amber-600">
                    {duplicateChequeWarning}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="statementTitle">Statement Title</Label>

                <Input
                  id="statementTitle"
                  value={statementTitle}
                  onChange={(e) => handleStatementTitleChange(e.target.value)}
                  placeholder="Enter statement title"
                  data-testid="input-statement-title"
                />
              </div>

              <div>
                <Label htmlFor="selectedDate">Select Date *</Label>

                <Input
                  id="selectedDate"
                  type="date"
                  value={selectedDate}
                  max={todayDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  data-testid="input-select-date"
                />
              </div>

              <div>
                <Label htmlFor="chequeAmount">Cheque Amount *</Label>

                <Input
                  id="chequeAmount"
                  value={chequeAmount}
                  onChange={(e) => handleChequeAmountChange(e.target.value)}
                  placeholder="Enter cheque amount"
                  data-testid="input-cheque-amount"
                />
              </div>
            </div>

            {selectedAccount && (
              <div className="mt-5 rounded-xl border bg-muted/40 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Selected Account Details
                </p>

                <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-4">
                  <div>
                    <p className="text-muted-foreground">Account Title</p>
                    <p className="font-medium">
                      {selectedAccount.accountTitle}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Bank</p>
                    <p className="font-medium">{selectedAccount.bank}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Account No</p>
                    <p className="font-medium">{selectedAccount.accountNo}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Selected Date</p>
                    <p className="font-medium">{selectedDate || "-"}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Record Items</CardTitle>

              <Button
                type="button"
                onClick={handleAddItem}
                data-testid="button-add-item"
              >
                Add New Item
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="rounded-xl border bg-muted/30 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">
                    Item {index + 1}
                  </h3>

                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleRemoveItem(index)}
                      data-testid={`button-remove-item-${index}`}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <Label>Category *</Label>

                    <Select
                      value={item.category}
                      onValueChange={(value: string) =>
                        handleItemChange(index, "category", value)
                      }
                    >
                      <SelectTrigger data-testid={`select-category-${index}`}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>

                      <SelectContent>
                        {categoryOptions.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Amount *</Label>

                    <Input
                      value={item.amount}
                      onChange={(e) =>
                        handleItemChange(index, "amount", e.target.value)
                      }
                      placeholder="Enter amount"
                      data-testid={`input-item-amount-${index}`}
                    />
                  </div>

                  <div>
                    <Label>Name *</Label>

                    <Input
                      value={item.name}
                      onChange={(e) =>
                        handleItemChange(index, "name", e.target.value)
                      }
                      placeholder="Enter name"
                      data-testid={`input-item-name-${index}`}
                    />
                  </div>

                  <div>
                    <Label>Description</Label>

                    <Input
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(index, "description", e.target.value)
                      }
                      placeholder="Optional"
                      data-testid={`input-item-description-${index}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cheque Summary</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Cheque Amount</p>
                <h3 className="mt-2 text-2xl font-bold">
                  {formatAmount(chequeValue)}
                </h3>
              </div>

              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">
                  Total Item Amount
                </p>
                <h3 className="mt-2 text-2xl font-bold">
                  {formatAmount(totalItemAmount)}
                </h3>
              </div>

              <div
                className={`rounded-xl border p-4 ${
                  isExceeded
                    ? "border-red-200 bg-red-50"
                    : remainingBalance === 0 && chequeValue > 0
                      ? "border-emerald-200 bg-emerald-50"
                      : "bg-muted/30"
                }`}
              >
                <p
                  className={`text-sm ${
                    isExceeded
                      ? "text-red-600"
                      : remainingBalance === 0 && chequeValue > 0
                        ? "text-emerald-700"
                        : "text-muted-foreground"
                  }`}
                >
                  Remaining Balance
                </p>

                <h3
                  className={`mt-2 text-2xl font-bold ${
                    isExceeded
                      ? "text-red-700"
                      : remainingBalance === 0 && chequeValue > 0
                        ? "text-emerald-700"
                        : "text-foreground"
                  }`}
                >
                  {formatAmount(remainingBalance)}
                </h3>
              </div>
            </div>

            {isExceeded && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                The total item amount exceeds the cheque amount. Cheque amount
                is not sufficient for the entered items.
              </div>
            )}

            {duplicateChequeWarning && (
              <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                {duplicateChequeWarning} You can still save this record.
              </div>
            )}

            {submitError && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {submitError}
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadPdf}
                disabled={loading}
                data-testid="button-download-record-pdf"
              >
                Download PDF
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/accounts")}
                data-testid="button-cancel-record"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={loading || isExceeded || accounts.length === 0}
                data-testid="button-save-record"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Saving...
                  </>
                ) : (
                  "Save Record"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}