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

      await addDoc(getPanelCollection("Record"), payload);

      toast({
        title: isDuplicateChequeNumber ? "Saved with warning" : "Success",
        description: isDuplicateChequeNumber
          ? "This cheque number already exists in Account Statement records, but the record was saved successfully."
          : "Record added successfully",
      });

      resetForm();

      window.location.reload();
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

            <div className="mt-6 flex justify-end gap-3">
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