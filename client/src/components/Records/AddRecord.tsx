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




import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

const RECORD_COLLECTION_PATH = ["Panels", "IEDGE-SYSTEM", "Record"] as const;

const categoryOptions: string[] = [
  "Utility",
  "General",
  "Tuition Fees",
  "Payroll",
];

const emptyItem: RecordItem = {
  category: "",
  amount: "",
  name: "",
  description: "",
};

export default function Record() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [accountsLoading, setAccountsLoading] = useState<boolean>(true);
  const [selectedAccountKey, setSelectedAccountKey] = useState<string>("");

  const [chequeNumber, setChequeNumber] = useState<string>("");
  const [chequeAmount, setChequeAmount] = useState<string>("");
  const [items, setItems] = useState<RecordItem[]>([{ ...emptyItem }]);

  const [loading, setLoading] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>("");

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

  const handleChequeAmountChange = (value: string) => {
    setChequeAmount(sanitizeAmount(value));
    setSubmitError("");
  };

  const handleChequeNumberChange = (value: string) => {
    setChequeNumber(value);
    setSubmitError("");
  };

  const handleItemChange = (
    index: number,
    field: ItemField,
    value: string
  ) => {
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
    setChequeAmount("");
    setItems([{ ...emptyItem }]);
    setSubmitError("");
  };

  const validateForm = (): string => {
    if (!selectedAccount) {
      return "Please select an account.";
    }

    if (!chequeNumber.trim()) {
      return "Please enter cheque number.";
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

      const payload = {
        firebasePath: "/Panels/IEDGE-SYSTEM/Record",

        accountId: selectedAccount.id,
        accountType: selectedAccount.type,
        accountTitle: selectedAccount.accountTitle,
        accountNo: selectedAccount.accountNo,
        bank: selectedAccount.bank,
        branch: selectedAccount.branch || "",
        city: selectedAccount.city || "",
        platform: selectedAccount.platform || "",
        routingNumber: selectedAccount.routingNumber || "",

        chequeNumber: chequeNumber.trim(),
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

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "active",
      };

      await addDoc(collection(db, ...RECORD_COLLECTION_PATH), payload);

      toast({
        title: "Success",
        description: "Record added successfully",
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
      <div className="mb-8">
        <h2
          className="mb-2 text-3xl font-bold text-foreground"
          data-testid="text-record-title"
        >
          Record
        </h2>

        <p className="text-muted-foreground">
          Select an account, enter cheque details, and add one or more record
          items.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Cheque Information</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                  placeholder="Enter cheque number"
                  data-testid="input-cheque-number"
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

                <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
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
                        handleItemChange(
                          index,
                          "description",
                          e.target.value
                        )
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