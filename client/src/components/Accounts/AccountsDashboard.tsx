// import { useEffect, useMemo, useState } from "react";
// import {
//   collection,
//   getDocs,
//   onSnapshot,
//   type DocumentData,
//   type Query,
//   type QuerySnapshot,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";

// import {
//   createPaymentAccount,
//   mapPaymentAccount,
//   paymentAccountsCollection,
//   sortPaymentAccounts,
//   updatePaymentAccount,
// } from "@/lib/payments/paymentAccounts";
// import { calculateAccountBalances } from "@/lib/payments/accountBalances";
// import { PaymentAccount } from "@/lib/payments/types";
// import { useToast } from "@/hooks/use-toast";

// import * as XLSX from "xlsx";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
// } from "recharts";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Calendar } from "@/components/ui/calendar";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { format, isValid, parse } from "date-fns";
// import { CalendarIcon } from "lucide-react";

// type AccountFormData = {
//   accountName: string;
//   nickname: string;
//   accountNumber: string;
//   bankName: string;
//   iban: string;
//   swiftCode: string;
//   branchName: string;
//   branchCode: string;
//   city: string;
//   currency: string;
//   openingBalance: string;
//   openingBalanceDate: string;
//   notes: string;
// };

// const emptyForm: AccountFormData = {
//   accountName: "",
//   nickname: "",
//   accountNumber: "",
//   bankName: "",
//   iban: "",
//   swiftCode: "",
//   branchName: "",
//   branchCode: "",
//   city: "",
//   currency: "PKR",
//   openingBalance: "",
//   openingBalanceDate: "",
//   notes: "",
// };

// const DATE_VALUE_FORMAT = "yyyy-MM-dd";

// // Opening balance dates are stored as YYYY-MM-DD strings; parsed as local
// // dates so the calendar never shifts the selected day across time zones.
// function parseDateValue(value: string | undefined) {
//   if (!value) return undefined;
//   const date = parse(value, DATE_VALUE_FORMAT, new Date());
//   return isValid(date) ? date : undefined;
// }

// function formatDateValue(value: string | undefined) {
//   const date = parseDateValue(value);
//   return date ? format(date, "dd MMM yyyy") : "-";
// }

// const COLORS = ["#2563eb", "#cbd5e1"];

// const PANEL_ID = "IEDGE-SYSTEM";

// // Documents whose payment releases can be charged to a payment account.
// const RELEASE_SOURCE_COLLECTIONS = [
//   "invoiceRequests",
//   "PO",
//   "claimReimbursements",
// ] as const;

// type BalanceSourceKey =
//   | "transfers"
//   | "records"
//   | "meetingUpdates"
//   | (typeof RELEASE_SOURCE_COLLECTIONS)[number];

// const BALANCE_SOURCE_LABELS: Record<BalanceSourceKey, string> = {
//   transfers: "Account transfers",
//   records: "Cheque records",
//   meetingUpdates: "Sales reimbursements",
//   invoiceRequests: "Budget requests",
//   PO: "Purchase orders",
//   claimReimbursements: "Claim reimbursements",
// };

// export default function AccountsDashboard() {
//   const { toast } = useToast();

//   const [payments, setPayments] = useState<any[]>([]);
//   const [invoices, setInvoices] = useState<any[]>([]);
//   const [accounts, setAccounts] = useState<PaymentAccount[]>([]);

//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");

//   const [createModalOpen, setCreateModalOpen] = useState(false);
//   const [openingDatePickerOpen, setOpeningDatePickerOpen] = useState(false);
//   const [editModalOpen, setEditModalOpen] = useState(false);

//   const [accountLoading, setAccountLoading] = useState(false);
//   const [editingAccount, setEditingAccount] = useState<PaymentAccount | null>(
//     null,
//   );
//   const [formData, setFormData] = useState<AccountFormData>(emptyForm);

//   // Transactions that move money in or out of a payment account, keyed by
//   // source. A key appears once its first snapshot has arrived.
//   const [balanceSources, setBalanceSources] = useState<
//     Partial<Record<BalanceSourceKey, any[]>>
//   >({});
//   const [paymentsLoaded, setPaymentsLoaded] = useState(false);
//   const [balanceSourceErrors, setBalanceSourceErrors] = useState<
//     BalanceSourceKey[]
//   >([]);

//   // Everything on the dashboard is read live from Firestore, so account
//   // details and balances update as soon as a transaction is saved anywhere.
//   useEffect(() => {
//     const panelCollection = (name: string) =>
//       collection(db, "Panels", PANEL_ID, name);

//     const toRows = (snapshot: QuerySnapshot<DocumentData>): any[] =>
//       snapshot.docs.map((snapshotDoc) => ({
//         id: snapshotDoc.id,
//         ...snapshotDoc.data(),
//       }));

//     const reportError = (label: string, error: unknown) => {
//       console.error(`Failed to load ${label}:`, error);
//       toast({
//         title: "Error",
//         description: `Failed to load ${label}`,
//         variant: "destructive",
//       });
//     };

//     const watchBalanceSource = (
//       key: BalanceSourceKey,
//       source: Query<DocumentData>,
//     ) =>
//       onSnapshot(
//         source,
//         (snapshot) => {
//           setBalanceSources((previous) => ({
//             ...previous,
//             [key]: toRows(snapshot),
//           }));
//           setBalanceSourceErrors((previous) =>
//             previous.filter((item) => item !== key),
//           );
//         },
//         (error) => {
//           console.error(`Failed to load ${BALANCE_SOURCE_LABELS[key]}:`, error);
//           setBalanceSources((previous) => ({ ...previous, [key]: [] }));
//           setBalanceSourceErrors((previous) =>
//             previous.includes(key) ? previous : [...previous, key],
//           );
//         },
//       );

//     const unsubscribers = [
//       onSnapshot(
//         paymentAccountsCollection(),
//         (snapshot) => {
//           setAccounts(
//             sortPaymentAccounts(
//               snapshot.docs.map((snapshotDoc) =>
//                 mapPaymentAccount(snapshotDoc.id, snapshotDoc.data()),
//               ),
//             ),
//           );
//         },
//         (error) => reportError("payment accounts", error),
//       ),

//       onSnapshot(
//         panelCollection("payments"),
//         (snapshot) => {
//           const rows = toRows(snapshot);

//           rows.sort(
//             (a: any, b: any) =>
//               new Date(b.paymentDate).getTime() -
//               new Date(a.paymentDate).getTime(),
//           );

//           setPayments(rows);
//           setPaymentsLoaded(true);
//         },
//         (error) => {
//           setPaymentsLoaded(true);
//           reportError("payments", error);
//         },
//       ),

//       onSnapshot(
//         panelCollection("estimateInvoices"),
//         (snapshot) => setInvoices(toRows(snapshot)),
//         (error) => reportError("invoices", error),
//       ),

//       watchBalanceSource("transfers", panelCollection("accountTransfers")),
//       watchBalanceSource("records", panelCollection("Record")),
//       ...RELEASE_SOURCE_COLLECTIONS.map((name) =>
//         watchBalanceSource(name, panelCollection(name)),
//       ),
//     ];

//     return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
//   }, [toast]);

//   // Sales reimbursements are stored in a meetingUpdates subcollection under
//   // each sales record, at both the panel path and the legacy root path. They
//   // are read per record by explicit path (as the Reimbursement Dashboard
//   // does); a collection-group query is rejected by the Firestore rules.
//   // The reads are redone whenever either sales record list changes.
//   useEffect(() => {
//     const recordIds = { panel: new Set<string>(), root: new Set<string>() };
//     const ready = { panel: false, root: false };
//     let loadVersion = 0;
//     let disposed = false;

//     const loadMeetingUpdates = async () => {
//       if (!ready.panel || !ready.root) return;

//       const version = ++loadVersion;

//       const readSubcollection = (path: string[]) =>
//         getDocs(collection(db, path[0], ...path.slice(1))).then((snapshot) =>
//           snapshot.docs.map((meetingDoc) => meetingDoc.data()),
//         );

//       const results = await Promise.allSettled([
//         ...Array.from(recordIds.panel).map((id) =>
//           readSubcollection([
//             "Panels",
//             PANEL_ID,
//             "salesRecords",
//             id,
//             "meetingUpdates",
//           ]),
//         ),
//         ...Array.from(recordIds.root).map((id) =>
//           readSubcollection(["salesRecords", id, "meetingUpdates"]),
//         ),
//       ]);

//       if (disposed || version !== loadVersion) return;

//       const reimbursementUpdates = results.flatMap((result) =>
//         result.status === "fulfilled"
//           ? result.value.filter((meeting) => meeting?.reimbursement?.enabled)
//           : [],
//       );
//       const failedReads = results.filter(
//         (result) => result.status === "rejected",
//       );

//       if (failedReads.length > 0) {
//         console.error(
//           `Failed to load ${failedReads.length} sales reimbursement list(s):`,
//           (failedReads[0] as PromiseRejectedResult).reason,
//         );
//       }

//       setBalanceSources((previous) => ({
//         ...previous,
//         meetingUpdates: reimbursementUpdates,
//       }));
//       setBalanceSourceErrors((previous) =>
//         failedReads.length > 0
//           ? previous.includes("meetingUpdates")
//             ? previous
//             : [...previous, "meetingUpdates"]
//           : previous.filter((item) => item !== "meetingUpdates"),
//       );
//     };

//     const watchSalesRecords = (
//       key: "panel" | "root",
//       source: Query<DocumentData>,
//     ) =>
//       onSnapshot(
//         source,
//         (snapshot) => {
//           recordIds[key] = new Set(snapshot.docs.map((record) => record.id));
//           ready[key] = true;
//           void loadMeetingUpdates();
//         },
//         (error) => {
//           // The legacy root path may not exist or be readable; the panel
//           // path is the primary source, so only its failure is reported.
//           if (key === "panel") {
//             console.error("Failed to load sales records:", error);
//             setBalanceSourceErrors((previous) =>
//               previous.includes("meetingUpdates")
//                 ? previous
//                 : [...previous, "meetingUpdates"],
//             );
//           }

//           recordIds[key] = new Set();
//           ready[key] = true;
//           void loadMeetingUpdates();
//         },
//       );

//     const unsubscribers = [
//       watchSalesRecords(
//         "panel",
//         collection(db, "Panels", PANEL_ID, "salesRecords"),
//       ),
//       watchSalesRecords("root", collection(db, "salesRecords")),
//     ];

//     return () => {
//       disposed = true;
//       unsubscribers.forEach((unsubscribe) => unsubscribe());
//     };
//   }, []);

//   const balancesLoading =
//     !paymentsLoaded ||
//     Object.keys(BALANCE_SOURCE_LABELS).some(
//       (key) => !balanceSources[key as BalanceSourceKey],
//     );

//   const accountBalances = useMemo(
//     () =>
//       calculateAccountBalances(accounts, {
//         payments,
//         transfers: balanceSources.transfers || [],
//         records: balanceSources.records || [],
//         releaseDocuments: [
//           ...(balanceSources.meetingUpdates || []),
//           ...RELEASE_SOURCE_COLLECTIONS.flatMap(
//             (name) => balanceSources[name] || [],
//           ),
//         ],
//       }),
//     [accounts, payments, balanceSources],
//   );

//   function formatCurrency(value: number | string | undefined | null) {
//     return `Rs ${Number(value || 0).toLocaleString()}`;
//   }

//   function getAccountLabel(value: string) {
//     const found = accounts.find((account) => account.id === value);

//     if (found) {
//       return found.accountName || found.bankName || "Unnamed Account";
//     }

//     if (!value) return "-";

//     return value;
//   }

//   function openCreateModal() {
//     setEditingAccount(null);
//     setFormData(emptyForm);
//     setCreateModalOpen(true);
//   }

//   function openEditModal(account: PaymentAccount) {
//     setEditingAccount(account);
//     setFormData({
//       accountName: account.accountName || "",
//       nickname: account.nickname || "",
//       accountNumber: account.accountNumber || "",
//       bankName: account.bankName || "",
//       iban: account.iban || "",
//       swiftCode: (account as any).swiftCode || "",
//       branchName: account.branchName || "",
//       branchCode: account.branchCode || "",
//       city: account.city || "",
//       currency: account.currency || "PKR",
//       openingBalance: String(account.openingBalance ?? 0),
//       openingBalanceDate: account.openingBalanceDate || "",
//       notes: account.notes || "",
//     });
//     setEditModalOpen(true);
//   }

//   function resetFormAndClose() {
//     setFormData(emptyForm);
//     setEditingAccount(null);
//     setCreateModalOpen(false);
//     setEditModalOpen(false);
//   }

//   async function handleCreateAccount(e: React.FormEvent) {
//     e.preventDefault();

//     if (!formData.accountName.trim()) {
//       toast({
//         title: "Error",
//         description: "Account title (as per bank) is required",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!formData.accountNumber.trim()) {
//       toast({
//         title: "Error",
//         description: "Account number is required",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!formData.bankName.trim()) {
//       toast({
//         title: "Error",
//         description: "Bank name is required",
//         variant: "destructive",
//       });
//       return;
//     }

//     try {
//       setAccountLoading(true);

//       await createPaymentAccount({
//         accountName: formData.accountName,
//         nickname: formData.nickname,
//         accountNumber: formData.accountNumber,
//         bankName: formData.bankName,
//         iban: formData.iban,
//         swiftCode: formData.swiftCode,
//         branchName: formData.branchName,
//         branchCode: formData.branchCode,
//         city: formData.city,
//         currency: formData.currency || "PKR",
//         openingBalance: Number(formData.openingBalance || 0),
//         openingBalanceDate: formData.openingBalanceDate,
//         currentBalance: Number(formData.openingBalance || 0),
//         notes: formData.notes,
//         isActive: true,
//       } as any);

//       toast({
//         title: "Success",
//         description: "Payment account created successfully",
//       });

//       resetFormAndClose();
//     } catch (error: any) {
//       console.error("Failed to create payment account:", error);
//       toast({
//         title: "Error",
//         description: error?.message || "Failed to create payment account",
//         variant: "destructive",
//       });
//     } finally {
//       setAccountLoading(false);
//     }
//   }

//   async function handleEditAccount(e: React.FormEvent) {
//     e.preventDefault();

//     if (!editingAccount) return;

//     if (!formData.accountName.trim()) {
//       toast({
//         title: "Error",
//         description: "Account title (as per bank) is required",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!formData.accountNumber.trim()) {
//       toast({
//         title: "Error",
//         description: "Account number is required",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!formData.bankName.trim()) {
//       toast({
//         title: "Error",
//         description: "Bank name is required",
//         variant: "destructive",
//       });
//       return;
//     }

//     try {
//       setAccountLoading(true);

//       await updatePaymentAccount(editingAccount.id, {
//         accountName: formData.accountName,
//         nickname: formData.nickname,
//         accountNumber: formData.accountNumber,
//         bankName: formData.bankName,
//         iban: formData.iban,
//         swiftCode: formData.swiftCode,
//         branchName: formData.branchName,
//         branchCode: formData.branchCode,
//         city: formData.city,
//         currency: formData.currency || "PKR",
//         openingBalance: Number(formData.openingBalance || 0),
//         openingBalanceDate: formData.openingBalanceDate,
//         notes: formData.notes,
//       } as any);

//       toast({
//         title: "Success",
//         description: "Account updated successfully",
//       });

//       resetFormAndClose();
//     } catch (error: any) {
//       console.error("Failed to update account:", error);
//       toast({
//         title: "Error",
//         description: error?.message || "Failed to update account",
//         variant: "destructive",
//       });
//     } finally {
//       setAccountLoading(false);
//     }
//   }

//   async function toggleAccountStatus(account: PaymentAccount) {
//     try {
//       await updatePaymentAccount(account.id, {
//         isActive: !(account.isActive !== false),
//       });

//       toast({
//         title: "Success",
//         description: "Account updated successfully",
//       });
//     } catch (error: any) {
//       console.error("Failed to update account:", error);
//       toast({
//         title: "Error",
//         description: error?.message || "Failed to update account",
//         variant: "destructive",
//       });
//     }
//   }

//   const filteredPayments = useMemo(() => {
//     return payments.filter((p) => {
//       if (!startDate && !endDate) return true;

//       const date = new Date(p.paymentDate);
//       if (Number.isNaN(date.getTime())) return true;

//       if (startDate) {
//         const start = new Date(startDate);
//         if (date < start) return false;
//       }

//       if (endDate) {
//         const end = new Date(endDate);
//         end.setHours(23, 59, 59, 999);
//         if (date > end) return false;
//       }

//       return true;
//     });
//   }, [payments, startDate, endDate]);

//   const totalReceived = useMemo(() => {
//     return filteredPayments.reduce(// (sum, p) => sum + Number(p.amount || 0),//  0// );
//   }, [filteredPayments]);

//   const totalPending = useMemo(() => {
//     return invoices.reduce(
      // (sum, i) => sum + Number(i.balance ?? i.total ?? 0),
      // 0,
    // );
//   }, [invoices]);

//   const activeAccountsCount = useMemo(
//     () => accounts.filter((a) => a.isActive !== false).length,
//     [accounts],
//   );

//   const totalAccountsCount = accounts.length;

//   const dynamicBarData = useMemo(() => {
//     const grouped: Record<string, number> = {};

//     filteredPayments.forEach((payment) => {
//       const key = getAccountLabel(payment.depositTo);
//       grouped[key] = (grouped[key] || 0) + Number(payment.amount || 0);
//     });

//     return Object.entries(grouped)
//       .map(([name, received]) => ({ name, received }))
//       .sort((a, b) => b.received - a.received)
//       .slice(0, 6);
//   }, [filteredPayments, accounts]);

//   const pieData = useMemo(
//     () => [
//       { name: "Received", value: totalReceived },
//       { name: "Pending", value: totalPending },
//     ],
//     [totalReceived, totalPending],
//   );

//   const exportExcel = () => {
//     const worksheet = XLSX.utils.json_to_sheet(
//       filteredPayments.map((p) => ({
//         ...p,
//         depositTo: getAccountLabel(p.depositTo),
//       })),
//     );

//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");
//     XLSX.writeFile(workbook, "Accounts_Report.xlsx");
//   };

//   const exportPDF = () => {
//     const doc = new jsPDF();

//     autoTable(doc, {
//       head: [["Date", "Client", "Method", "Account", "Reference", "Amount"]],
//       body: filteredPayments.map((p) => [
//         p.paymentDate,
//         p.client,
//         p.method,
//         getAccountLabel(p.depositTo),
//         p.reference,
//         p.amount,
//       ]),
//     });

//     doc.save("Accounts_Report.pdf");
//   };

//   function renderAccountForm(
//     onSubmit: (e: React.FormEvent) => Promise<void>,
//     submitLabel: string,
//   ) {
//     return (
//       <form onSubmit={onSubmit} className="space-y-6">
//         <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//           <div className="space-y-2">
//             <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
//               Account Title (as per Bank) *
//             </Label>
//             <Input
//               className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
//               value={formData.accountName}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   accountName: e.target.value,
//                 }))
//               }
//               placeholder="iEDGE (Pvt) Ltd"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
//               Account Nick Name
//             </Label>
//             <Input
//               className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
//               value={formData.nickname}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   nickname: e.target.value,
//                 }))
//               }
//               placeholder="Meezan PKR Collection"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
//               Account Number *
//             </Label>
//             <Input
//               className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
//               value={formData.accountNumber}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   accountNumber: e.target.value,
//                 }))
//               }
//               placeholder="Enter account number"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
//               Bank Name *
//             </Label>
//             <Input
//               className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
//               value={formData.bankName}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   bankName: e.target.value,
//                 }))
//               }
//               placeholder="Enter bank name"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
//               Currency
//             </Label>
//             <Input
//               className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
//               value={formData.currency}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   currency: e.target.value,
//                 }))
//               }
//               placeholder="PKR"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
//               IBAN
//             </Label>
//             <Input
//               className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
//               value={formData.iban}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   iban: e.target.value,
//                 }))
//               }
//               placeholder="Enter IBAN"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
//               SWIFT Code
//             </Label>
//             <Input
//               className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
//               value={formData.swiftCode}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   swiftCode: e.target.value,
//                 }))
//               }
//               placeholder="Enter SWIFT code"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
//               Branch Name
//             </Label>
//             <Input
//               className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
//               value={formData.branchName}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   branchName: e.target.value,
//                 }))
//               }
//               placeholder="Enter branch name"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
//               Branch Code
//             </Label>
//             <Input
//               className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
//               value={formData.branchCode}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   branchCode: e.target.value,
//                 }))
//               }
//               placeholder="Enter branch code"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
//               City
//             </Label>
//             <Input
//               className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
//               value={formData.city}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   city: e.target.value,
//                 }))
//               }
//               placeholder="Enter branch city (printed on RTGS letters)"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
//               Opening Balance
//             </Label>
//             <Input
//               type="number"
//               className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
//               value={formData.openingBalance}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   openingBalance: e.target.value,
//                 }))
//               }
//               placeholder="0"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
//               Opening Balance Date
//             </Label>
//             <div className="flex gap-2">
//               <Input
//                 type="date"
//                 className="h-11 flex-1 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100 [&::-webkit-calendar-picker-indicator]:hidden"
//                 value={formData.openingBalanceDate}
//                 onChange={(e) =>
//                   setFormData((prev) => ({
//                     ...prev,
//                     openingBalanceDate: e.target.value,
//                   }))
//                 }
//               />

//               <Popover
//                 open={openingDatePickerOpen}
//                 onOpenChange={setOpeningDatePickerOpen}
//               >
//                 <PopoverTrigger asChild>
//                   <Button
//                     type="button"
//                     variant="outline"
//                     aria-label="Pick opening balance date"
//                     className="h-11 w-11 shrink-0 rounded-2xl border-slate-200 bg-white p-0"
//                   >
//                     <CalendarIcon className="h-4 w-4 text-slate-500" />
//                   </Button>
//                 </PopoverTrigger>

//                 <PopoverContent align="end" className="w-auto rounded-xl p-0">
//                   <Calendar
//                     mode="single"
//                     selected={parseDateValue(formData.openingBalanceDate)}
//                     defaultMonth={parseDateValue(formData.openingBalanceDate)}
//                     onSelect={(date) => {
//                       setFormData((prev) => ({
//                         ...prev,
//                         openingBalanceDate: date
//                           ? format(date, DATE_VALUE_FORMAT)
//                           : "",
//                       }));
//                       setOpeningDatePickerOpen(false);
//                     }}
//                     initialFocus
//                   />
//                 </PopoverContent>
//               </Popover>
//             </div>
//           </div>

//           <div className="space-y-2 md:col-span-2">
//             <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
//               Notes
//             </Label>
//             <Textarea
//               className="min-h-[110px] rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
//               value={formData.notes}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   notes: e.target.value,
//                 }))
//               }
//               placeholder="Optional notes"
//             />
//           </div>
//         </div>

//         <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
//           <Button
//             type="button"
//             variant="outline"
//             className="h-11 rounded-2xl border-slate-200 bg-white px-5"
//             onClick={resetFormAndClose}
//           >
//             Cancel
//           </Button>

//           <Button
//             type="submit"
//             disabled={accountLoading}
//             className="h-11 rounded-2xl bg-slate-950 px-6 text-white shadow-sm hover:bg-slate-800"
//           >
//             {accountLoading ? "Saving..." : submitLabel}
//           </Button>
//         </div>
//       </form>
//     );
//   }

//   const summaryCards = [
//     {
//       title: "Total Received",
//       value: formatCurrency(totalReceived),
//       subtitle: "Filtered collection amount",
//     },
//     {
//       title: "Total Pending",
//       value: formatCurrency(totalPending),
//       subtitle: "Open invoice balance",
//     },
//     {
//       title: "Total Accounts",
//       value: totalAccountsCount,
//       subtitle: "Saved payment accounts",
//     },
//     {
//       title: "Active Accounts",
//       value: activeAccountsCount,
//       subtitle: "Ready for deposits",
//     },
//   ];

//   return (
//     <div className="min-h-screen overflow-x-hidden bg-[#f7f9fc] px-4 py-6 text-slate-900 md:px-8 md:py-8">
//       <div className="mx-auto  space-y-7">
//         <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:p-8">
//           <div className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-blue-100 blur-3xl" />
//           <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-emerald-100 blur-3xl" />

//           <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
//             <div className="max-w-2xl">
//               <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
//                 Finance Overview
//               </span>

//               <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">
//                 Accounts Dashboard
//               </h1>

//               <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 md:text-base">
//                 Manage payment accounts, monitor collections, review pending
//                 balances, and export filtered reports from one clean workspace.
//               </p>
//             </div>

//             <div className="flex flex-wrap items-center gap-3">
//               <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
//                 <DialogTrigger asChild>
//                   <Button
//                     onClick={openCreateModal}
//                     className="h-11 rounded-2xl bg-slate-950 px-5 text-white shadow-sm hover:bg-slate-800"
//                   >
//                     Create Account
//                   </Button>
//                 </DialogTrigger>

//                 <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto rounded-[1.75rem] border-0 p-0 shadow-2xl">
//                   <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
//                     <DialogHeader>
//                       <DialogTitle className="text-xl font-bold tracking-tight text-slate-950">
//                         Create Payment Account
//                       </DialogTitle>
//                     </DialogHeader>
//                     <p className="mt-1 text-sm text-slate-500">
//                       Add bank or collection account information.
//                     </p>
//                   </div>

//                   <div className="px-6 py-6">
//                     {renderAccountForm(handleCreateAccount, "Save Account")}
//                   </div>
//                 </DialogContent>
//               </Dialog>

//               <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
//                 <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto rounded-[1.75rem] border-0 p-0 shadow-2xl">
//                   <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
//                     <DialogHeader>
//                       <DialogTitle className="text-xl font-bold tracking-tight text-slate-950">
//                         Edit Payment Account
//                       </DialogTitle>
//                     </DialogHeader>
//                     <p className="mt-1 text-sm text-slate-500">
//                       Update payment account information.
//                     </p>
//                   </div>

//                   <div className="px-6 py-6">
//                     {renderAccountForm(handleEditAccount, "Update Account")}
//                   </div>
//                 </DialogContent>
//               </Dialog>
//             </div>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
//           {summaryCards.map((card) => (
//             <div
//               key={card.title}
//               className="rounded-[1.5rem] border border-white bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
//             >
//               <div className="mt-5 text-sm font-medium text-slate-500">
//                 {card.title}
//               </div>
//               <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">
//                 {card.value}
//               </div>
//               <div className="mt-1 text-xs text-slate-400">{card.subtitle}</div>
//             </div>
//           ))}
//         </div>

//         <div className="rounded-[1.75rem] border border-white bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-5">
//           <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
//             <div>
//               <h2 className="text-base font-bold text-slate-950">Filters</h2>
//               <p className="mt-1 text-sm text-slate-500">
//                 Filter transactions by payment date and export the current
                // result.
//               </p>
//             </div>

//             <div className="flex flex-wrap items-center gap-3">
//               <div className="grid gap-1">
//                 <Label className="text-xs font-medium text-slate-500">
                  // Start Date
                // </Label>
//                 <Input
//                   type="date"
//                   value={startDate}
//                   onChange={(e) => setStartDate(e.target.value)}
//                   className="h-11 w-full rounded-2xl border-slate-200 bg-slate-50/80 shadow-none md:w-[180px]"
//                 />
//               </div>

//               <div className="grid gap-1">
//                 <Label className="text-xs font-medium text-slate-500">
                  // End Date
                // </Label>
//                 <Input
//                   type="date"
//                   value={endDate}
//                   onChange={(e) => setEndDate(e.target.value)}
//                   className="h-11 w-full rounded-2xl border-slate-200 bg-slate-50/80 shadow-none md:w-[180px]"
//                 />
//               </div>

//               <div className="flex items-end gap-3 pt-5">
//                 <Button
//                   type="button"
//                   onClick={() => {
//                     setStartDate("");
//                     setEndDate("");
//                   }}
//                   variant="outline"
//                   className="h-11 rounded-2xl border-slate-200 bg-white px-4"
//                 >
//                   Clear
//                 </Button>

//                 <Button
//                   onClick={exportExcel}
//                   variant="outline"
//                   className="h-11 rounded-2xl border-slate-200 bg-white px-4"
//                 >
//                   Export Excel
//                 </Button>

//                 <Button
//                   onClick={exportPDF}
//                   variant="outline"
//                   className="h-11 rounded-2xl border-slate-200 bg-white px-4"
//                 >
//                   Export PDF
//                 </Button>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
//           <div className="rounded-[1.75rem] border border-white bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-6">
//             <div className="mb-5 flex items-center justify-between gap-3">
//               <div>
//                 <h2 className="text-base font-bold text-slate-950">
//                   Account-wise Collections
//                 </h2>
//                 <p className="mt-1 text-sm text-slate-500">
//                   Top accounts by received amount.
//                 </p>
//               </div>
//             </div>

//             {dynamicBarData.length > 0 ? (
//               <ResponsiveContainer width="100%" height={300}>
//                 <BarChart data={dynamicBarData}>
//                   <XAxis
//                     dataKey="name"
//                     tickLine={false}
//                     axisLine={false}
//                     tick={{ fontSize: 12, fill: "#64748b" }}
//                   />
//                   <YAxis
//                     tickLine={false}
//                     axisLine={false}
//                     tick={{ fontSize: 12, fill: "#64748b" }}
//                   />
//                   <Tooltip
//                     formatter={(value: any) => formatCurrency(value)}
//                     contentStyle={{
//                       borderRadius: "16px",
//                       border: "1px solid #e2e8f0",
//                       boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
//                     }}
//                   />
//                   <Bar
                  //   dataKey="received"
                  //   radius={[10, 10, 0, 0]}
                  //   fill="#2563eb"
                  // />
//                 </BarChart>
//               </ResponsiveContainer>
//             ) : (
//               <div className="flex h-[300px] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
//                 No collection data available.
//               </div>
//             )}
//           </div>

//           <div className="rounded-[1.75rem] border border-white bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-6">
//             <div className="mb-5 flex items-center justify-between gap-3">
//               <div>
//                 <h2 className="text-base font-bold text-slate-950">
//                   Received vs Pending
//                 </h2>
//                 <p className="mt-1 text-sm text-slate-500">
//                   Current collection and outstanding balance split.
//                 </p>
//               </div>
//             </div>

//             {totalReceived > 0 || totalPending > 0 ? (
//               <ResponsiveContainer width="100%" height={300}>
//                 <PieChart>
//                   <Pie
//                     data={pieData}
//                     dataKey="value"
//                     outerRadius={108}
//                     innerRadius={62}
//                     paddingAngle={4}
//                     label={({ name }) => name}
//                   >
//                     {pieData.map((entry, index) => (
//                       <Cell key={entry.name} fill={COLORS[index]} />
//                     ))}
//                   </Pie>
//                   <Tooltip
//                     formatter={(value: any) => formatCurrency(value)}
//                     contentStyle={{
//                       borderRadius: "16px",
//                       border: "1px solid #e2e8f0",
//                       boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
//                     }}
//                   />
//                 </PieChart>
//               </ResponsiveContainer>
//             ) : (
//               <div className="flex h-[300px] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
//                 No payment summary available.
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="rounded-[1.75rem] border border-white bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
//           <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
//             <div>
//               <h2 className="text-base font-bold text-slate-950">
//                 Payment Accounts ({accounts.length})
//               </h2>
//               <p className="mt-1 text-sm text-slate-500">
//                 Review account details, status, and balance information. Current
//                 balances are calculated live from payments received, payments
//                 released, cheque records and account transfers.
//               </p>
//             </div>

//             <Button
//               type="button"
//               onClick={openCreateModal}
//               className="h-10 shrink-0 rounded-2xl bg-slate-950 px-5 text-white shadow-sm hover:bg-slate-800"
//             >
//               Add Account
//             </Button>
//           </div>

//           <div className="px-5 py-5 md:px-6 md:py-6">
//             {balanceSourceErrors.length > 0 && (
//               <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
//                 Balances may be incomplete:{" "}
//                 {balanceSourceErrors
//                   .map((key) => BALANCE_SOURCE_LABELS[key])
//                   .join(", ")}{" "}
//                 could not be loaded.
//               </div>
//             )}

//             {accounts.length === 0 ? (
//               <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
//                 No payment accounts found.
//               </div>
//             ) : (
//               <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
//                 {accounts.map((account) => (
//                   <div
//                     key={account.id}
//                     className="group rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-xl"
//                   >
//                     <div className="mb-4 flex items-start justify-between gap-3">
//                       <div className="min-w-0">
//                         <h3 className="truncate text-base font-bold text-slate-950">
//                           {account.nickname || account.accountName || "-"}
//                         </h3>
//                         <p className="truncate text-sm text-slate-500">
//                           {[
//                             account.nickname ? account.accountName : "",
//                             account.bankName,
//                           ]
//                             .filter(Boolean)
//                             .join(" · ") || "-"}
//                         </p>
//                       </div>

//                       <span
//                         className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
//                           account.isActive !== false
//                             ? "bg-emerald-50 text-emerald-700"
//                             : "bg-rose-50 text-rose-700"
//                         }`}
//                       >
//                         {account.isActive !== false ? "Active" : "Inactive"}
//                       </span>
//                     </div>

//                     <div className="space-y-2 rounded-2xl bg-slate-50/80 p-4 text-sm text-slate-600">
//                       <div className="flex justify-between gap-3">
//                         <span className="text-slate-400">Account No</span>
//                         <span className="text-right font-medium text-slate-700">
//                           {account.accountNumber || "-"}
//                         </span>
//                       </div>

//                       <div className="flex justify-between gap-3">
//                         <span className="text-slate-400">IBAN</span>
//                         <span className="text-right font-medium text-slate-700">
//                           {account.iban || "-"}
//                         </span>
//                       </div>

//                       <div className="flex justify-between gap-3">
//                         <span className="text-slate-400">SWIFT</span>
//                         <span className="text-right font-medium text-slate-700">
//                           {(account as any).swiftCode || "-"}
//                         </span>
//                       </div>

//                       <div className="flex justify-between gap-3">
//                         <span className="text-slate-400">Branch</span>
//                         <span className="text-right font-medium text-slate-700">
//                           {account.branchName || "-"}
//                         </span>
//                       </div>

//                       <div className="flex justify-between gap-3">
//                         <span className="text-slate-400">City</span>
//                         <span className="text-right font-medium text-slate-700">
//                           {account.city || "-"}
//                         </span>
//                       </div>

//                       <div className="flex justify-between gap-3">
//                         <span className="text-slate-400">Currency</span>
//                         <span className="text-right font-medium text-slate-700">
//                           {account.currency || "PKR"}
//                         </span>
//                       </div>

//                       <div className="flex justify-between gap-3 border-t border-slate-200/70 pt-2">
//                         <span className="text-slate-400">Opening Balance</span>
//                         <span className="text-right font-bold text-slate-950">
//                           {formatCurrency(account.openingBalance || 0)}
//                         </span>
//                       </div>

//                       <div className="flex justify-between gap-3">
//                         <span className="text-slate-400">
                        //   Opening Balance Date
                        // </span>
//                         <span className="text-right font-medium text-slate-700">
//                           {formatDateValue(account.openingBalanceDate)}
//                         </span>
//                       </div>

//                       {(() => {
//                         const balance = accountBalances[account.id];

//                         if (balancesLoading || !balance) {
//                           return (
//                             <div className="flex justify-between gap-3">
//                               <span className="text-slate-400">
//                                 Current Balance
//                               </span>
//                               <span className="text-right text-slate-400">
//                                 Calculating...
//                               </span>
//                             </div>
//                           );
//                         }

//                         const transfersNet =
//                           balance.transfersIn - balance.transfersOut;
//                         const breakdown = [
//                           {
//                             label: "Received",
//                             value: balance.received,
//                             sign: "+",
//                           },
//                           {
//                             label: "Payments released",
//                             value: balance.released,
//                             sign: "−",
//                           },
//                           {
//                             label: "Cheque records",
//                             value: balance.chequeRecords,
//                             sign: "−",
//                           },
//                           {
//                             label: "Transfers (net)",
//                             value: Math.abs(transfersNet),
//                             sign: transfersNet < 0 ? "−" : "+",
//                           },
//                         ].filter((item) => item.value > 0);

//                         return (
//                           <>
//                             {breakdown.map((item) => (
//                               <div
//                                 key={item.label}
//                                 className="flex justify-between gap-3 text-xs"
//                               >
//                                 <span className="text-slate-400">
//                                   {item.label}
//                                 </span>
//                                 <span
//                                   className={`text-right font-medium ${
//                                     item.sign === "+"
//                                       ? "text-emerald-700"
//                                       : "text-rose-700"
//                                   }`}
//                                 >
//                                   {item.sign} {formatCurrency(item.value)}
//                                 </span>
//                               </div>
//                             ))}

//                             <div className="flex justify-between gap-3 border-t border-slate-200/70 pt-2">
//                               <span className="text-slate-400">
//                                 Current Balance
//                               </span>
//                               <span
//                                 className={`text-right font-bold ${
//                                   balance.current < 0
//                                     ? "text-rose-700"
//                                     : "text-slate-950"
//                                 }`}
//                               >
//                                 {balance.current < 0 ? "−" : ""}
//                                 {formatCurrency(Math.abs(balance.current))}
//                               </span>
//                             </div>
//                           </>
//                         );
//                       })()}
//                     </div>

//                     {account.notes ? (
//                       <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-3 text-sm leading-6 text-slate-600">
//                         {account.notes}
//                       </div>
//                     ) : null}

//                     <div className="mt-5 flex items-center gap-2">
//                       <Button
//                         type="button"
//                         variant="outline"
//                         className="h-10 flex-1 rounded-2xl border-slate-200 bg-white"
//                         onClick={() => openEditModal(account)}
//                       >
//                         Edit
//                       </Button>

//                       <Button
//                         type="button"
//                         variant="outline"
//                         className="h-10 flex-1 rounded-2xl border-slate-200 bg-white"
//                         onClick={() => toggleAccountStatus(account)}
//                       >
//                         {account.isActive !== false ? "Deactivate" : "Activate"}
//                       </Button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }















import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

import {
  createPaymentAccount,
  updatePaymentAccount,
} from "@/lib/payments/paymentAccounts";
import {
  buildAccountLedger,
  calculateAccountBalances,
} from "@/lib/payments/accountBalances";
import { PaymentAccount } from "@/lib/payments/types";
import { useToast } from "@/hooks/use-toast";
import { useAccountLedgerData } from "@/hooks/useAccountLedgerData";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format, isValid, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";

type AccountFormData = {
  accountName: string;
  nickname: string;
  accountNumber: string;
  bankName: string;
  iban: string;
  swiftCode: string;
  branchName: string;
  branchCode: string;
  city: string;
  currency: string;
  openingBalance: string;
  openingBalanceDate: string;
  notes: string;
};

const emptyForm: AccountFormData = {
  accountName: "",
  nickname: "",
  accountNumber: "",
  bankName: "",
  iban: "",
  swiftCode: "",
  branchName: "",
  branchCode: "",
  city: "",
  currency: "PKR",
  openingBalance: "",
  openingBalanceDate: "",
  notes: "",
};

const DATE_VALUE_FORMAT = "yyyy-MM-dd";

// Opening balance dates are stored as YYYY-MM-DD strings; parsed as local
// dates so the calendar never shifts the selected day across time zones.
function parseDateValue(value: string | undefined) {
  if (!value) return undefined;
  const date = parse(value, DATE_VALUE_FORMAT, new Date());
  return isValid(date) ? date : undefined;
}

function formatDateValue(value: string | undefined) {
  const date = parseDateValue(value);
  return date ? format(date, "dd MMM yyyy") : "-";
}

const COLORS = ["#2563eb", "#cbd5e1"];

const PANEL_ID = "IEDGE-SYSTEM";

export default function AccountsDashboard() {
  const { toast } = useToast();

  // Accounts and every transaction that moves money on them come from the
  // same loader as the Account Statement, so balances match it exactly.
  const {
    data: ledgerData,
    loading: balancesLoading,
    failedSources: balanceSourceErrors,
  } = useAccountLedgerData();
  const accounts = ledgerData.accounts;
  const [invoices, setInvoices] = useState<any[]>([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [openingDatePickerOpen, setOpeningDatePickerOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [accountLoading, setAccountLoading] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PaymentAccount | null>(
    null,
  );
  const [formData, setFormData] = useState<AccountFormData>(emptyForm);

  // Invoices only feed the collection charts; balances come from the ledger.
  useEffect(() => {
    return onSnapshot(
      collection(db, "Panels", PANEL_ID, "estimateInvoices"),
      (snapshot) =>
        setInvoices(
          snapshot.docs.map((snapshotDoc) => ({
            id: snapshotDoc.id,
            ...snapshotDoc.data(),
          })),
        ),
      (error) => {
        console.error("Failed to load invoices:", error);
        toast({
          title: "Error",
          description: "Failed to load invoices",
          variant: "destructive",
        });
      },
    );
  }, [toast]);

  const payments = useMemo(
    () =>
      [...ledgerData.payments].sort(
        (a: any, b: any) =>
          new Date(b.paymentDate).getTime() -
          new Date(a.paymentDate).getTime(),
      ),
    [ledgerData.payments],
  );

  const accountBalances = useMemo(
    () => calculateAccountBalances(accounts, buildAccountLedger(ledgerData)),
    [accounts, ledgerData],
  );

  function formatCurrency(value: number | string | undefined | null) {
    return `Rs ${Number(value || 0).toLocaleString()}`;
  }

  function getAccountLabel(value: string) {
    const found = accounts.find((account) => account.id === value);

    if (found) {
      return found.accountName || found.bankName || "Unnamed Account";
    }

    if (!value) return "-";

    return value;
  }

  function openCreateModal() {
    setEditingAccount(null);
    setFormData(emptyForm);
    setCreateModalOpen(true);
  }

  function openEditModal(account: PaymentAccount) {
    setEditingAccount(account);
    setFormData({
      accountName: account.accountName || "",
      nickname: account.nickname || "",
      accountNumber: account.accountNumber || "",
      bankName: account.bankName || "",
      iban: account.iban || "",
      swiftCode: (account as any).swiftCode || "",
      branchName: account.branchName || "",
      branchCode: account.branchCode || "",
      city: account.city || "",
      currency: account.currency || "PKR",
      openingBalance: String(account.openingBalance ?? 0),
      openingBalanceDate: account.openingBalanceDate || "",
      notes: account.notes || "",
    });
    setEditModalOpen(true);
  }

  function resetFormAndClose() {
    setFormData(emptyForm);
    setEditingAccount(null);
    setCreateModalOpen(false);
    setEditModalOpen(false);
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.accountName.trim()) {
      toast({
        title: "Error",
        description: "Account title (as per bank) is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.accountNumber.trim()) {
      toast({
        title: "Error",
        description: "Account number is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.bankName.trim()) {
      toast({
        title: "Error",
        description: "Bank name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setAccountLoading(true);

      await createPaymentAccount({
        accountName: formData.accountName,
        nickname: formData.nickname,
        accountNumber: formData.accountNumber,
        bankName: formData.bankName,
        iban: formData.iban,
        swiftCode: formData.swiftCode,
        branchName: formData.branchName,
        branchCode: formData.branchCode,
        city: formData.city,
        currency: formData.currency || "PKR",
        openingBalance: Number(formData.openingBalance || 0),
        openingBalanceDate: formData.openingBalanceDate,
        currentBalance: Number(formData.openingBalance || 0),
        notes: formData.notes,
        isActive: true,
      } as any);

      toast({
        title: "Success",
        description: "Payment account created successfully",
      });

      resetFormAndClose();
    } catch (error: any) {
      console.error("Failed to create payment account:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create payment account",
        variant: "destructive",
      });
    } finally {
      setAccountLoading(false);
    }
  }

  async function handleEditAccount(e: React.FormEvent) {
    e.preventDefault();

    if (!editingAccount) return;

    if (!formData.accountName.trim()) {
      toast({
        title: "Error",
        description: "Account title (as per bank) is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.accountNumber.trim()) {
      toast({
        title: "Error",
        description: "Account number is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.bankName.trim()) {
      toast({
        title: "Error",
        description: "Bank name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setAccountLoading(true);

      await updatePaymentAccount(editingAccount.id, {
        accountName: formData.accountName,
        nickname: formData.nickname,
        accountNumber: formData.accountNumber,
        bankName: formData.bankName,
        iban: formData.iban,
        swiftCode: formData.swiftCode,
        branchName: formData.branchName,
        branchCode: formData.branchCode,
        city: formData.city,
        currency: formData.currency || "PKR",
        openingBalance: Number(formData.openingBalance || 0),
        openingBalanceDate: formData.openingBalanceDate,
        notes: formData.notes,
      } as any);

      toast({
        title: "Success",
        description: "Account updated successfully",
      });

      resetFormAndClose();
    } catch (error: any) {
      console.error("Failed to update account:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update account",
        variant: "destructive",
      });
    } finally {
      setAccountLoading(false);
    }
  }

  async function toggleAccountStatus(account: PaymentAccount) {
    try {
      await updatePaymentAccount(account.id, {
        isActive: !(account.isActive !== false),
      });

      toast({
        title: "Success",
        description: "Account updated successfully",
      });

    } catch (error: any) {
      console.error("Failed to update account:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update account",
        variant: "destructive",
      });
    }
  }

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (!startDate && !endDate) return true;

      const date = new Date(p.paymentDate);
      if (Number.isNaN(date.getTime())) return true;

      if (startDate) {
        const start = new Date(startDate);
        if (date < start) return false;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (date > end) return false;
      }

      return true;
    });
  }, [payments, startDate, endDate]);

  const totalReceived = useMemo(() => {
    return filteredPayments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0,
    );
  }, [filteredPayments]);

  const totalPending = useMemo(() => {
    return invoices.reduce((sum, i) => sum + Number(i.balance ?? i.total ?? 0), 0);
  }, [invoices]);

  const activeAccountsCount = useMemo(
    () => accounts.filter((a) => a.isActive !== false).length,
    [accounts],
  );

  const totalAccountsCount = accounts.length;

  const dynamicBarData = useMemo(() => {
    const grouped: Record<string, number> = {};

    filteredPayments.forEach((payment) => {
      const key = getAccountLabel(payment.depositTo);
      grouped[key] = (grouped[key] || 0) + Number(payment.amount || 0);
    });

    return Object.entries(grouped)
      .map(([name, received]) => ({ name, received }))
      .sort((a, b) => b.received - a.received)
      .slice(0, 6);
  }, [filteredPayments, accounts]);

  const pieData = useMemo(
    () => [
      { name: "Received", value: totalReceived },
      { name: "Pending", value: totalPending },
    ],
    [totalReceived, totalPending],
  );

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredPayments.map((p) => ({
        ...p,
        depositTo: getAccountLabel(p.depositTo),
      })),
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");
    XLSX.writeFile(workbook, "Accounts_Report.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    autoTable(doc, {
      head: [["Date", "Client", "Method", "Account", "Reference", "Amount"]],
      body: filteredPayments.map((p) => [
        p.paymentDate,
        p.client,
        p.method,
        getAccountLabel(p.depositTo),
        p.reference,
        p.amount,
      ]),
    });

    doc.save("Accounts_Report.pdf");
  };

  function renderAccountForm(
    onSubmit: (e: React.FormEvent) => Promise<void>,
    submitLabel: string,
  ) {
    return (
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Account Title (as per Bank) *
            </Label>
            <Input
              className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
              value={formData.accountName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  accountName: e.target.value,
                }))
              }
              placeholder="iEDGE (Pvt) Ltd"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Account Nick Name
            </Label>
            <Input
              className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
              value={formData.nickname}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  nickname: e.target.value,
                }))
              }
              placeholder="Meezan PKR Collection"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Account Number *
            </Label>
            <Input
              className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
              value={formData.accountNumber}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  accountNumber: e.target.value,
                }))
              }
              placeholder="Enter account number"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Bank Name *
            </Label>
            <Input
              className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
              value={formData.bankName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  bankName: e.target.value,
                }))
              }
              placeholder="Enter bank name"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Currency
            </Label>
            <Input
              className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
              value={formData.currency}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  currency: e.target.value,
                }))
              }
              placeholder="PKR"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              IBAN
            </Label>
            <Input
              className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
              value={formData.iban}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  iban: e.target.value,
                }))
              }
              placeholder="Enter IBAN"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              SWIFT Code
            </Label>
            <Input
              className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
              value={formData.swiftCode}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  swiftCode: e.target.value,
                }))
              }
              placeholder="Enter SWIFT code"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Branch Name
            </Label>
            <Input
              className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
              value={formData.branchName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  branchName: e.target.value,
                }))
              }
              placeholder="Enter branch name"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Branch Code
            </Label>
            <Input
              className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
              value={formData.branchCode}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  branchCode: e.target.value,
                }))
              }
              placeholder="Enter branch code"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              City
            </Label>
            <Input
              className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
              value={formData.city}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  city: e.target.value,
                }))
              }
              placeholder="Enter branch city (printed on RTGS letters)"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Opening Balance
            </Label>
            <Input
              type="number"
              className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
              value={formData.openingBalance}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  openingBalance: e.target.value,
                }))
              }
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Opening Balance Date
            </Label>
            <div className="flex gap-2">
              <Input
                type="date"
                className="h-11 flex-1 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100 [&::-webkit-calendar-picker-indicator]:hidden"
                value={formData.openingBalanceDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    openingBalanceDate: e.target.value,
                  }))
                }
              />

              <Popover
                open={openingDatePickerOpen}
                onOpenChange={setOpeningDatePickerOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    aria-label="Pick opening balance date"
                    className="h-11 w-11 shrink-0 rounded-2xl border-slate-200 bg-white p-0"
                  >
                    <CalendarIcon className="h-4 w-4 text-slate-500" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent align="end" className="w-auto rounded-xl p-0">
                  <Calendar
                    mode="single"
                    selected={parseDateValue(formData.openingBalanceDate)}
                    defaultMonth={parseDateValue(formData.openingBalanceDate)}
                    onSelect={(date) => {
                      setFormData((prev) => ({
                        ...prev,
                        openingBalanceDate: date
                          ? format(date, DATE_VALUE_FORMAT)
                          : "",
                      }));
                      setOpeningDatePickerOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Notes
            </Label>
            <Textarea
              className="min-h-[110px] rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              placeholder="Optional notes"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-2xl border-slate-200 bg-white px-5"
            onClick={resetFormAndClose}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={accountLoading}
            className="h-11 rounded-2xl bg-slate-950 px-6 text-white shadow-sm hover:bg-slate-800"
          >
            {accountLoading ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    );
  }

  const summaryCards = [
    {
      title: "Total Received",
      value: formatCurrency(totalReceived),
      subtitle: "Filtered collection amount",
    },
    {
      title: "Total Pending",
      value: formatCurrency(totalPending),
      subtitle: "Open invoice balance",
    },
    {
      title: "Total Accounts",
      value: totalAccountsCount,
      subtitle: "Saved payment accounts",
    },
    {
      title: "Active Accounts",
      value: activeAccountsCount,
      subtitle: "Ready for deposits",
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f9fc] px-4 py-6 text-slate-900 md:px-8 md:py-8">
      <div className="mx-auto  space-y-7">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-blue-100 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-emerald-100 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
                Finance Overview
              </span>

              <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">
                Accounts Dashboard
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 md:text-base">
                Manage payment accounts, monitor collections, review pending
                balances, and export filtered reports from one clean workspace.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={openCreateModal}
                    className="h-11 rounded-2xl bg-slate-950 px-5 text-white shadow-sm hover:bg-slate-800"
                  >
                    Create Account
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto rounded-[1.75rem] border-0 p-0 shadow-2xl">
                  <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold tracking-tight text-slate-950">
                        Create Payment Account
                      </DialogTitle>
                    </DialogHeader>
                    <p className="mt-1 text-sm text-slate-500">
                      Add bank or collection account information.
                    </p>
                  </div>

                  <div className="px-6 py-6">
                    {renderAccountForm(handleCreateAccount, "Save Account")}
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto rounded-[1.75rem] border-0 p-0 shadow-2xl">
                  <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold tracking-tight text-slate-950">
                        Edit Payment Account
                      </DialogTitle>
                    </DialogHeader>
                    <p className="mt-1 text-sm text-slate-500">
                      Update payment account information.
                    </p>
                  </div>

                  <div className="px-6 py-6">
                    {renderAccountForm(handleEditAccount, "Update Account")}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.title}
              className="rounded-[1.5rem] border border-white bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
            >

              <div className="mt-5 text-sm font-medium text-slate-500">
                {card.title}
              </div>
              <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                {card.value}
              </div>
              <div className="mt-1 text-xs text-slate-400">{card.subtitle}</div>
            </div>
          ))}
        </div>

        <div className="rounded-[1.75rem] border border-white bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-950">Filters</h2>
              <p className="mt-1 text-sm text-slate-500">
                Filter transactions by payment date and export the current result.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="grid gap-1">
                <Label className="text-xs font-medium text-slate-500">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-11 w-full rounded-2xl border-slate-200 bg-slate-50/80 shadow-none md:w-[180px]"
                />
              </div>

              <div className="grid gap-1">
                <Label className="text-xs font-medium text-slate-500">End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-11 w-full rounded-2xl border-slate-200 bg-slate-50/80 shadow-none md:w-[180px]"
                />
              </div>

              <div className="flex items-end gap-3 pt-5">
                <Button
                  type="button"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  variant="outline"
                  className="h-11 rounded-2xl border-slate-200 bg-white px-4"
                >
                  Clear
                </Button>

                <Button
                  onClick={exportExcel}
                  variant="outline"
                  className="h-11 rounded-2xl border-slate-200 bg-white px-4"
                >
                  Export Excel
                </Button>

                <Button
                  onClick={exportPDF}
                  variant="outline"
                  className="h-11 rounded-2xl border-slate-200 bg-white px-4"
                >
                  Export PDF
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-[1.75rem] border border-white bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-950">
                  Account-wise Collections
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Top accounts by received amount.
                </p>
              </div>
            </div>

            {dynamicBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dynamicBarData}>
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: "16px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
                    }}
                  />
                  <Bar dataKey="received" radius={[10, 10, 0, 0]} fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                No collection data available.
              </div>
            )}
          </div>

          <div className="rounded-[1.75rem] border border-white bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-950">
                  Received vs Pending
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Current collection and outstanding balance split.
                </p>
              </div>
            </div>

            {totalReceived > 0 || totalPending > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    outerRadius={108}
                    innerRadius={62}
                    paddingAngle={4}
                    label={({ name }) => name}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: "16px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                No payment summary available.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
            <div>
              <h2 className="text-base font-bold text-slate-950">
                Payment Accounts ({accounts.length})
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review account details, status, and balance information.
                Current balances are calculated live from payments received,
                payments released, cheque records, account transfers and
                manual statement entries, from the same data as the Account
                Statement.
              </p>
            </div>

            <Button
              type="button"
              onClick={openCreateModal}
              className="h-10 shrink-0 rounded-2xl bg-slate-950 px-5 text-white shadow-sm hover:bg-slate-800"
            >
              Add Account
            </Button>
          </div>

          <div className="px-5 py-5 md:px-6 md:py-6">
            {balanceSourceErrors.length > 0 && (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                Balances may be incomplete:{" "}
                {balanceSourceErrors.join(", ")}{" "}
                could not be loaded.
              </div>
            )}

            {accounts.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                No payment accounts found.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="group rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-xl"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-bold text-slate-950">
                          {account.nickname || account.accountName || "-"}
                        </h3>
                        <p className="truncate text-sm text-slate-500">
                          {[
                            account.nickname ? account.accountName : "",
                            account.bankName,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "-"}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          account.isActive !== false
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {account.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="space-y-2 rounded-2xl bg-slate-50/80 p-4 text-sm text-slate-600">
                      <div className="flex justify-between gap-3">
                        <span className="text-slate-400">Account No</span>
                        <span className="text-right font-medium text-slate-700">
                          {account.accountNumber || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span className="text-slate-400">IBAN</span>
                        <span className="text-right font-medium text-slate-700">
                          {account.iban || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span className="text-slate-400">SWIFT</span>
                        <span className="text-right font-medium text-slate-700">
                          {(account as any).swiftCode || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span className="text-slate-400">Branch</span>
                        <span className="text-right font-medium text-slate-700">
                          {account.branchName || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span className="text-slate-400">City</span>
                        <span className="text-right font-medium text-slate-700">
                          {account.city || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span className="text-slate-400">Currency</span>
                        <span className="text-right font-medium text-slate-700">
                          {account.currency || "PKR"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3 border-t border-slate-200/70 pt-2">
                        <span className="text-slate-400">Opening Balance</span>
                        <span className="text-right font-bold text-slate-950">
                          {formatCurrency(account.openingBalance || 0)}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span className="text-slate-400">Opening Balance Date</span>
                        <span className="text-right font-medium text-slate-700">
                          {formatDateValue(account.openingBalanceDate)}
                        </span>
                      </div>

                      {(() => {
                        const balance = accountBalances[account.id];

                        if (balancesLoading || !balance) {
                          return (
                            <div className="flex justify-between gap-3">
                              <span className="text-slate-400">
                                Current Balance
                              </span>
                              <span className="text-right text-slate-400">
                                Calculating...
                              </span>
                            </div>
                          );
                        }

                        const transfersNet =
                          balance.transfersIn - balance.transfersOut;
                        const manualNet =
                          balance.manualCredits - balance.manualDebits;
                        const breakdown = [
                          {
                            label: "Received",
                            value: balance.received,
                            sign: "+",
                          },
                          {
                            label: "Payments released",
                            value: balance.released,
                            sign: "−",
                          },
                          {
                            label: "Cheque records",
                            value: balance.chequeRecords,
                            sign: "−",
                          },
                          {
                            label: "Transfers (net)",
                            value: Math.abs(transfersNet),
                            sign: transfersNet < 0 ? "−" : "+",
                          },
                          {
                            label: "Manual entries (net)",
                            value: Math.abs(manualNet),
                            sign: manualNet < 0 ? "−" : "+",
                          },
                        ].filter((item) => item.value > 0);

                        return (
                          <>
                            {breakdown.map((item) => (
                              <div
                                key={item.label}
                                className="flex justify-between gap-3 text-xs"
                              >
                                <span className="text-slate-400">
                                  {item.label}
                                </span>
                                <span
                                  className={`text-right font-medium ${
                                    item.sign === "+"
                                      ? "text-emerald-700"
                                      : "text-rose-700"
                                  }`}
                                >
                                  {item.sign} {formatCurrency(item.value)}
                                </span>
                              </div>
                            ))}

                            <div className="flex justify-between gap-3 border-t border-slate-200/70 pt-2">
                              <span className="text-slate-400">
                                Current Balance
                              </span>
                              <span
                                className={`text-right font-bold ${
                                  balance.current < 0
                                    ? "text-rose-700"
                                    : "text-slate-950"
                                }`}
                              >
                                {balance.current < 0 ? "−" : ""}
                                {formatCurrency(Math.abs(balance.current))}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {account.notes ? (
                      <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-3 text-sm leading-6 text-slate-600">
                        {account.notes}
                      </div>
                    ) : null}

                    <div className="mt-5 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 flex-1 rounded-2xl border-slate-200 bg-white"
                        onClick={() => openEditModal(account)}
                      >
                        Edit
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 flex-1 rounded-2xl border-slate-200 bg-white"
                        onClick={() => toggleAccountStatus(account)}
                      >
                        {account.isActive !== false ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}