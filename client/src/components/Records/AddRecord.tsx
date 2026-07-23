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
import { Textarea } from "@/components/ui/textarea";
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

type PrintableRecordItem = {
  category: string;
  amount: number;
  name: string;
  description: string;
};

type PrintableRecordData = {
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
  items: PrintableRecordItem[];
};

const escapeHtml = (value: unknown): string => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const formatPrintAmount = (value: number): string => {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const normalizeDescriptionLineBreaks = (value: string): string => {
  return value.replace(/\r\n?/g, "\n");
};

const formatDescriptionForPrint = (value: string): string => {
  const normalizedValue = normalizeDescriptionLineBreaks(value);

  if (!normalizedValue.trim()) {
    return '<span class="description-empty">-</span>';
  }

  return `<div class="description-text">${escapeHtml(normalizedValue)}</div>`;
};

const printRecord = (record: PrintableRecordData): boolean => {
  const printWindow = window.open("", "_blank", "width=1100,height=850");

  if (!printWindow) return false;

  const accountSource =
    record.accountType === "online"
      ? record.platform || record.bank || "-"
      : record.bank || "-";

  const branchOrRouting =
    record.accountType === "online"
      ? record.routingNumber || "-"
      : record.branch || "-";

  const itemRows = record.items
    .map(
      (item, index) => `
        <tr>
          <td class="number">${index + 1}</td>
          <td>${escapeHtml(item.category || "-")}</td>
          <td>${escapeHtml(item.name || "-")}</td>
          <td><div class="description-content">${formatDescriptionForPrint(
            item.description
          )}</div></td>
          <td class="amount">${escapeHtml(formatPrintAmount(item.amount))}</td>
        </tr>`
    )
    .join("");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Record ${escapeHtml(record.chequeNumber)}</title>
  <style>
    @page {
      size: A4;
      margin: 14mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      color: #172033;
      background: #ffffff;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      line-height: 1.45;
    }

    .document {
      width: 100%;
      margin: 0 auto;
    }

    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #172033;
    }

    .brand h1 {
      margin: 0;
      font-size: 24px;
      letter-spacing: 0.8px;
    }

    .brand p {
      margin: 5px 0 0;
      color: #667085;
      font-size: 11px;
    }

    .document-meta {
      min-width: 220px;
      text-align: right;
    }

    .document-meta .title {
      font-size: 17px;
      font-weight: 700;
    }

    .document-meta .line {
      margin-top: 4px;
      color: #475467;
    }

    .section {
      margin-top: 18px;
      break-inside: avoid;
    }

    .section-title {
      margin: 0 0 9px;
      padding: 7px 10px;
      border-left: 4px solid #172033;
      background: #f2f4f7;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.4px;
      text-transform: uppercase;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px 24px;
    }

    .detail {
      display: grid;
      grid-template-columns: 125px minmax(0, 1fr);
      gap: 8px;
      padding: 6px 0;
      border-bottom: 1px solid #e4e7ec;
    }

    .detail .label {
      color: #667085;
      font-weight: 600;
    }

    .detail .value {
      overflow-wrap: anywhere;
      color: #101828;
      font-weight: 600;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    thead {
      display: table-header-group;
    }

    tr {
      break-inside: avoid;
    }

    th,
    td {
      padding: 8px;
      border: 1px solid #d0d5dd;
      vertical-align: top;
      overflow-wrap: anywhere;
    }

    th {
      background: #f2f4f7;
      color: #344054;
      font-size: 10px;
      letter-spacing: 0.35px;
      text-align: left;
      text-transform: uppercase;
    }

    th:nth-child(1),
    td:nth-child(1) {
      width: 6%;
    }

    th:nth-child(2),
    td:nth-child(2) {
      width: 18%;
    }

    th:nth-child(3),
    td:nth-child(3) {
      width: 23%;
    }

    th:nth-child(4),
    td:nth-child(4) {
      width: 35%;
    }

    th:nth-child(5),
    td:nth-child(5) {
      width: 18%;
    }

    .number {
      text-align: center;
    }

    .amount {
      text-align: right;
      white-space: nowrap;
    }

    .description-content {
      color: #344054;
      line-height: 1.5;
    }

    .description-text {
      margin: 0;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .description-empty {
      color: #98a2b3;
    }

    .summary {
      width: 360px;
      margin-left: auto;
      border: 1px solid #d0d5dd;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      padding: 9px 12px;
      border-bottom: 1px solid #e4e7ec;
    }

    .summary-row:last-child {
      border-bottom: 0;
      background: #f2f4f7;
      font-size: 13px;
      font-weight: 700;
    }

    .summary-label {
      color: #475467;
    }

    .summary-value {
      font-weight: 700;
      white-space: nowrap;
    }

    .footer {
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1px solid #d0d5dd;
      color: #667085;
      font-size: 10px;
      text-align: center;
    }

    @media print {
      .document {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <main class="document">
    <header class="header">
      <div class="brand">
        <h1>IEDGE</h1>
        <p>Official account, cheque and transaction record</p>
      </div>

      <div class="document-meta">
        <div class="title">Financial Record</div>
        <div class="line"><strong>Record ID:</strong> ${escapeHtml(
          record.recordId || "Not saved yet"
        )}</div>
        <div class="line"><strong>Date:</strong> ${escapeHtml(
          record.selectedDate
        )}</div>
      </div>
    </header>

    <section class="section">
      <h2 class="section-title">Record Information</h2>
      <div class="details-grid">
        <div class="detail">
          <span class="label">Cheque Number</span>
          <span class="value">${escapeHtml(record.chequeNumber)}</span>
        </div>
        <div class="detail">
          <span class="label">Statement Title</span>
          <span class="value">${escapeHtml(record.statementTitle || "-")}</span>
        </div>
        <div class="detail">
          <span class="label">Created By</span>
          <span class="value">${escapeHtml(record.createdByName)}</span>
        </div>
        <div class="detail">
          <span class="label">Account Type</span>
          <span class="value">${
            record.accountType === "cheque" ? "Cheque Account" : "Online Account"
          }</span>
        </div>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">Account Details</h2>
      <div class="details-grid">
        <div class="detail">
          <span class="label">Account Title</span>
          <span class="value">${escapeHtml(record.accountTitle || "-")}</span>
        </div>
        <div class="detail">
          <span class="label">Bank / Platform</span>
          <span class="value">${escapeHtml(accountSource)}</span>
        </div>
        <div class="detail">
          <span class="label">Account Number</span>
          <span class="value">${escapeHtml(record.accountNo || "-")}</span>
        </div>
        <div class="detail">
          <span class="label">Branch / Routing</span>
          <span class="value">${escapeHtml(branchOrRouting)}</span>
        </div>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">Record Items</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Category</th>
            <th>Name</th>
            <th>Description</th>
            <th class="amount">Amount</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
    </section>

    <section class="section">
      <h2 class="section-title">Cheque Summary</h2>
      <div class="summary">
        <div class="summary-row">
          <span class="summary-label">Cheque Amount</span>
          <span class="summary-value">${escapeHtml(
            formatPrintAmount(record.chequeAmount)
          )}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Total Item Amount</span>
          <span class="summary-value">${escapeHtml(
            formatPrintAmount(record.totalItemAmount)
          )}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Remaining Balance</span>
          <span class="summary-value">${escapeHtml(
            formatPrintAmount(record.remainingBalance)
          )}</span>
        </div>
      </div>
    </section>

    <footer class="footer">
      Printed ${escapeHtml(new Date().toLocaleString("en-US"))}
    </footer>
  </main>

  <script>
    window.addEventListener("load", function () {
      window.setTimeout(function () {
        window.print();
      }, 200);
    });

    window.addEventListener("afterprint", function () {
      window.close();
    });
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  return true;
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
    useState<PrintableRecordData | null>(null);

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

  const getCurrentPrintableRecord = (): PrintableRecordData | null => {
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
        description: normalizeDescriptionLineBreaks(item.description),
      })),
    };
  };

  const handlePrint = () => {
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
          title: "Cannot print record",
          description: error,
          variant: "destructive",
        });
        return;
      }

      const currentRecord = getCurrentPrintableRecord();

      if (!currentRecord) return;

      const opened = printRecord(currentRecord);

      if (!opened) {
        toast({
          title: "Print window blocked",
          description: "Please allow pop-ups for this website and try again.",
          variant: "destructive",
        });
      }
      return;
    }

    if (lastSavedRecord) {
      const opened = printRecord(lastSavedRecord);

      if (!opened) {
        toast({
          title: "Print window blocked",
          description: "Please allow pop-ups for this website and try again.",
          variant: "destructive",
        });
      }
      return;
    }

    toast({
      title: "No record available",
      description: "Enter record details or save a record before printing.",
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
          description: normalizeDescriptionLineBreaks(item.description),
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
          description: normalizeDescriptionLineBreaks(item.description),
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

                  <div className="md:col-span-2 lg:col-span-4">
                    <Label htmlFor={`item-description-${index}`}>
                      Description
                    </Label>

                    <Textarea
                      id={`item-description-${index}`}
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(index, "description", e.target.value)
                      }
                      rows={7}
                      className="mt-2 min-h-[160px] resize-y whitespace-pre-wrap"
                      placeholder={
                        "Write the description line by line. Press Enter for a new line, or press Enter twice to start a new paragraph."
                      }
                      data-testid={`input-item-description-${index}`}
                    />

                    <p className="mt-2 text-xs text-muted-foreground">
                      Line breaks and blank paragraphs are preserved when the
                      record is saved and printed.
                    </p>

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
                onClick={handlePrint}
                disabled={loading}
                data-testid="button-print-record"
              >
                Print Record
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