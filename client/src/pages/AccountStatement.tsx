// import { useEffect, useMemo, useState, type ReactNode } from "react";
// import {
//   addDoc,
//   collection,
//   deleteDoc,
//   doc,
//   getDoc,
//   getDocs,
//   onSnapshot,
//   query,
//   serverTimestamp,
//   setDoc,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { useAuth } from "@/contexts/AuthContext";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import {
//   ArrowDownCircle,
//   ArrowUpCircle,
//   Plus,
//   RefreshCw,
//   Save,
//   Search,
//   Trash2,
//   Wallet,
// } from "lucide-react";

// const PANEL_ID = "IEDGE-SYSTEM";

// type StatementSource =
//   | "opening"
//   | "invoice_payment"
//   | "budget_request"
//   | "reimbursement"
//   | "manual";

// type StatementRow = {
//   id: string;
//   source: StatementSource;
//   date: string;
//   dateValue: number;
//   description: string;
//   poNo: string;
//   projectCode: string;
//   debit: number;
//   credit: number;
//   balance?: number;
//   manualDocId?: string;
// };

// type ManualEntryForm = {
//   date: string;
//   description: string;
//   poNo: string;
//   projectCode: string;
//   debit: string;
//   credit: string;
// };

// type OpeningBalance = {
//   amount: number;
//   date: string;
// };

// const emptyManualForm: ManualEntryForm = {
//   date: new Date().toISOString().slice(0, 10),
//   description: "",
//   poNo: "",
//   projectCode: "",
//   debit: "",
//   credit: "",
// };

// const toNumber = (value: any) => {
//   const parsed =
//     typeof value === "number"
//       ? value
//       : Number(String(value ?? "").replace(/,/g, ""));

//   return Number.isFinite(parsed) ? parsed : 0;
// };

// const toDateInputValue = (value: any) => {
//   if (!value) return "";

//   try {
//     const date =
//       value?.toDate && typeof value.toDate === "function"
//         ? value.toDate()
//         : value instanceof Date
//         ? value
//         : new Date(value);

//     if (Number.isNaN(date.getTime())) return "";
//     return date.toISOString().slice(0, 10);
//   } catch {
//     return "";
//   }
// };

// const toDateValue = (value: any) => {
//   if (!value) return 0;

//   try {
//     const date =
//       value?.toDate && typeof value.toDate === "function"
//         ? value.toDate()
//         : value instanceof Date
//         ? value
//         : new Date(value);

//     const time = date.getTime();
//     return Number.isFinite(time) ? time : 0;
//   } catch {
//     return 0;
//   }
// };

// const formatDate = (value: string) => {
//   if (!value) return "-";

//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return value;

//   return date.toLocaleDateString("en-PK", {
//     year: "numeric",
//     month: "short",
//     day: "2-digit",
//   });
// };

// const formatCurrency = (value: number) => {
//   return toNumber(value).toLocaleString("en-PK", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });
// };

// const getFirstValue = (...values: any[]) => {
//   for (const value of values) {
//     if (value !== undefined && value !== null && String(value).trim() !== "") {
//       return String(value).trim();
//     }
//   }

//   return "";
// };

// const getInvoiceProjectCode = (payment: any, invoice: any) =>
//   getFirstValue(
//     payment.projectCode,
//     payment.project_code,
//     invoice?.projectCode,
//     invoice?.project_code,
//     invoice?.projectCodeNo,
//     invoice?.projectNo,
//     invoice?.projectNumber,
//   );

// const getInvoicePoNo = (payment: any, invoice: any) =>
//   getFirstValue(
//     payment.poNo,
//     payment.poNumber,
//     payment.purchaseOrderNo,
//     payment.invoiceNo,
//     invoice?.poNo,
//     invoice?.poNumber,
//     invoice?.purchaseOrderNo,
//     invoice?.po,
//     invoice?.invoiceNo,
//   );

// const getRequestProjectCode = (request: any) =>
//   getFirstValue(
//     request.projectCode,
//     request.project_code,
//     request.projectCodeNo,
//     request.projectNo,
//     request.projectNumber,
//   );

// const getRequestPoNo = (request: any) =>
//   getFirstValue(
//     request.poNo,
//     request.poNumber,
//     request.purchaseOrderNo,
//     request.po,
//     request.invoiceNo,
//     request.requestNo,
//   );

// const getReimbursementProjectCode = (reimbursement: any, record: any, claim: any) =>
//   getFirstValue(
//     reimbursement?.projectCode,
//     reimbursement?.project_code,
//     record?.projectCode,
//     record?.project_code,
//     record?.projectNo,
//     record?.projectNumber,
//     claim?.projectCode,
//     claim?.project_code,
//   );

// const getReimbursementPoNo = (reimbursement: any, record: any, claim: any) =>
//   getFirstValue(
//     reimbursement?.poNo,
//     reimbursement?.poNumber,
//     reimbursement?.purchaseOrderNo,
//     record?.poNo,
//     record?.poNumber,
//     record?.purchaseOrderNo,
//     claim?.poNo,
//     claim?.poNumber,
//     claim?.purchaseOrderNo,
//   );

// function StatCard({
//   title,
//   value,
//   icon,
// }: {
//   title: string;
//   value: string;
//   icon: ReactNode;
// }) {
//   return (
//     <Card className="border-slate-200 shadow-sm">
//       <CardContent className="flex items-center justify-between p-5">
//         <div>
//           <p className="text-sm text-slate-500">{title}</p>
//           <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
//         </div>

//         <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">{icon}</div>
//       </CardContent>
//     </Card>
//   );
// }

// export default function AccountStatement() {
//   const { currentUser, userProfile } = useAuth();

//   const [loading, setLoading] = useState(true);
//   const [savingOpening, setSavingOpening] = useState(false);
//   const [savingManual, setSavingManual] = useState(false);

//   const [openingBalance, setOpeningBalance] = useState<OpeningBalance>({
//     amount: 0,
//     date: new Date().toISOString().slice(0, 10),
//   });
//   const [openingAmountInput, setOpeningAmountInput] = useState("0");
//   const [openingDateInput, setOpeningDateInput] = useState(
//     new Date().toISOString().slice(0, 10),
//   );

//   const [rows, setRows] = useState<StatementRow[]>([]);
//   const [manualDialogOpen, setManualDialogOpen] = useState(false);
//   const [manualForm, setManualForm] = useState<ManualEntryForm>(emptyManualForm);
//   const [search, setSearch] = useState("");

//   const loadStatement = async () => {
//     setLoading(true);

//     try {
//       const settingsRef = doc(
//         db,
//         "Panels",
//         PANEL_ID,
//         "accountStatementSettings",
//         "main",
//       );
//       const settingsSnap = await getDoc(settingsRef);
//       const settingsData = settingsSnap.exists() ? settingsSnap.data() : {};

//       const savedOpening: OpeningBalance = {
//         amount: toNumber(settingsData?.openingBalance),
//         date:
//           toDateInputValue(settingsData?.openingBalanceDate) ||
//           String(settingsData?.openingBalanceDate || "") ||
//           new Date().toISOString().slice(0, 10),
//       };

//       setOpeningBalance(savedOpening);
//       setOpeningAmountInput(String(savedOpening.amount));
//       setOpeningDateInput(savedOpening.date);

//       const statementRows: StatementRow[] = [];

//       statementRows.push({
//         id: "opening-balance",
//         source: "opening",
//         date: savedOpening.date,
//         dateValue: toDateValue(savedOpening.date),
//         description: "Opening Balance",
//         poNo: "",
//         projectCode: "",
//         debit: 0,
//         credit: 0,
//       });

//       const invoiceMap = new Map<string, any>();
//       const invoiceSnap = await getDocs(
//         collection(db, "Panels", PANEL_ID, "estimateInvoices"),
//       );

//       invoiceSnap.forEach((invoiceDoc) => {
//         invoiceMap.set(invoiceDoc.id, {
//           id: invoiceDoc.id,
//           ...invoiceDoc.data(),
//         });
//       });

//       const paymentsSnap = await getDocs(
//         collection(db, "Panels", PANEL_ID, "payments"),
//       );

//       paymentsSnap.forEach((paymentDoc) => {
//         const payment: any = paymentDoc.data();
//         const invoice = payment.invoiceId ? invoiceMap.get(payment.invoiceId) : null;
//         const amount = toNumber(payment.amount);

//         if (amount <= 0) return;

//         statementRows.push({
//           id: `invoice-payment-${paymentDoc.id}`,
//           source: "invoice_payment",
//           date:
//             toDateInputValue(payment.paymentDate) ||
//             toDateInputValue(payment.createdAt) ||
//             "",
//           dateValue: toDateValue(payment.paymentDate || payment.createdAt),
//           description: `Invoice payment received${
//             payment.invoiceNo ? ` - ${payment.invoiceNo}` : ""
//           }${payment.client ? ` - ${payment.client}` : ""}`,
//           poNo: getInvoicePoNo(payment, invoice),
//           projectCode: getInvoiceProjectCode(payment, invoice),
//           debit: 0,
//           credit: amount,
//         });
//       });

//       const budgetSnap = await getDocs(
//         collection(db, "Panels", PANEL_ID, "invoiceRequests"),
//       );

//       budgetSnap.forEach((requestDoc) => {
//         const request: any = requestDoc.data();
//         const paymentDetails = request.paymentDetails || {};
//         const status = String(request.status || "").toLowerCase();
//         const isReleased =
//           status === "payment_released" ||
//           status === "released" ||
//           !!paymentDetails.releasedAt ||
//           !!paymentDetails.amount;

//         if (!isReleased) return;

//         const amount = toNumber(paymentDetails.amount || request.releasedAmount || request.totalAmount);
//         if (amount <= 0) return;

//         const vendors = Array.isArray(paymentDetails.vendors)
//           ? paymentDetails.vendors.join(", ")
//           : paymentDetails.vendor || "";

//         const subject = getFirstValue(request.subject, request.title, request.project, vendors);

//         statementRows.push({
//           id: `budget-request-${requestDoc.id}`,
//           source: "budget_request",
//           date:
//             toDateInputValue(paymentDetails.releasedAt) ||
//             toDateInputValue(request.updatedAt) ||
//             toDateInputValue(request.submittedAt) ||
//             "",
//           dateValue: toDateValue(
//             paymentDetails.releasedAt || request.updatedAt || request.submittedAt,
//           ),
//           description: `Budget request payment released${subject ? ` - ${subject}` : ""}`,
//           poNo: getRequestPoNo(request),
//           projectCode: getRequestProjectCode(request),
//           debit: amount,
//           credit: 0,
//         });
//       });

//       const claimSnap = await getDocs(
//         collection(db, "Panels", PANEL_ID, "claimReimbursements"),
//       );

//       claimSnap.forEach((claimDoc) => {
//         const claim: any = claimDoc.data();
//         const paymentStatus = String(claim.paymentStatus || "").toLowerCase();

//         if (paymentStatus !== "paid") return;

//         const amount = toNumber(
//           claim.paidAmount || claim.approvedAmount || claim.claimAmount || claim.amount,
//         );

//         if (amount <= 0) return;

//         statementRows.push({
//           id: `claim-reimbursement-${claimDoc.id}`,
//           source: "reimbursement",
//           date:
//             toDateInputValue(claim.paymentReleasedAt) ||
//             toDateInputValue(claim.updatedAt) ||
//             toDateInputValue(claim.submittedAt) ||
//             "",
//           dateValue: toDateValue(
//             claim.paymentReleasedAt || claim.updatedAt || claim.submittedAt,
//           ),
//           description: `Reimbursement released - ${
//             claim.description || claim.foodItem || claim.claimType || "Claim"
//           }${claim.submittedByName ? ` - ${claim.submittedByName}` : ""}`,
//           poNo: getReimbursementPoNo(null, null, claim),
//           projectCode: getReimbursementProjectCode(null, null, claim),
//           debit: amount,
//           credit: 0,
//         });
//       });

//       const panelRecordsSnap = await getDocs(
//         collection(db, "Panels", PANEL_ID, "salesRecords"),
//       );

//       let legacyRecordDocs: any[] = [];
//       try {
//         const legacyRecordsSnap = await getDocs(collection(db, "salesRecords"));
//         legacyRecordDocs = legacyRecordsSnap.docs;
//       } catch (error) {
//         console.warn("Legacy salesRecords path not available:", error);
//       }

//       const recordMap = new Map<string, { id: string; data: any }>();

//       panelRecordsSnap.docs.forEach((recordDoc) => {
//         recordMap.set(recordDoc.id, {
//           id: recordDoc.id,
//           data: recordDoc.data(),
//         });
//       });

//       legacyRecordDocs.forEach((recordDoc) => {
//         if (!recordMap.has(recordDoc.id)) {
//           recordMap.set(recordDoc.id, {
//             id: recordDoc.id,
//             data: recordDoc.data(),
//           });
//         }
//       });

//       await Promise.all(
//         Array.from(recordMap.values()).map(async (record) => {
//           const meetingDocs: Array<{ meetingDoc: any; sourcePath: "panel" | "root" }> = [];

//           try {
//             const panelMeetingSnap = await getDocs(
//               collection(
//                 db,
//                 "Panels",
//                 PANEL_ID,
//                 "salesRecords",
//                 record.id,
//                 "meetingUpdates",
//               ),
//             );

//             panelMeetingSnap.docs.forEach((meetingDoc) => {
//               meetingDocs.push({ meetingDoc, sourcePath: "panel" });
//             });
//           } catch (error) {
//             console.warn("Panel meetingUpdates path not available:", error);
//           }

//           try {
//             const rootMeetingSnap = await getDocs(
//               collection(db, "salesRecords", record.id, "meetingUpdates"),
//             );

//             rootMeetingSnap.docs.forEach((meetingDoc) => {
//               meetingDocs.push({ meetingDoc, sourcePath: "root" });
//             });
//           } catch (error) {
//             console.warn("Legacy meetingUpdates path not available:", error);
//           }

//           meetingDocs.forEach(({ meetingDoc, sourcePath }) => {
//             const meeting: any = meetingDoc.data();
//             const reimbursement = meeting?.reimbursement;

//             if (!reimbursement?.enabled) return;
//             if (String(reimbursement.paymentStatus || "").toLowerCase() !== "paid") return;

//             const amount = toNumber(
//               reimbursement.paidAmount || reimbursement.approvedAmount || reimbursement.amount,
//             );

//             if (amount <= 0) return;

//             statementRows.push({
//               id: `meeting-reimbursement-${sourcePath}-${record.id}-${meetingDoc.id}`,
//               source: "reimbursement",
//               date:
//                 toDateInputValue(reimbursement.paymentReleasedAt) ||
//                 toDateInputValue(reimbursement.updatedAt) ||
//                 toDateInputValue(meeting.updatedAt) ||
//                 toDateInputValue(meeting.submittedAt) ||
//                 "",
//               dateValue: toDateValue(
//                 reimbursement.paymentReleasedAt ||
//                   reimbursement.updatedAt ||
//                   meeting.updatedAt ||
//                   meeting.submittedAt,
//               ),
//               description: `Reimbursement released - ${
//                 reimbursement.detail || reimbursement.description || record.data?.projectName || "Claim"
//               }${meeting.personName ? ` - ${meeting.personName}` : ""}`,
//               poNo: getReimbursementPoNo(reimbursement, record.data, null),
//               projectCode: getReimbursementProjectCode(reimbursement, record.data, null),
//               debit: amount,
//               credit: 0,
//             });
//           });
//         }),
//       );

//       const manualSnap = await getDocs(
//         collection(db, "Panels", PANEL_ID, "accountStatementManualEntries"),
//       );

//       manualSnap.forEach((manualDoc) => {
//         const manual: any = manualDoc.data();
//         const debit = toNumber(manual.debit);
//         const credit = toNumber(manual.credit);

//         if (debit <= 0 && credit <= 0) return;

//         statementRows.push({
//           id: `manual-${manualDoc.id}`,
//           source: "manual",
//           manualDocId: manualDoc.id,
//           date: toDateInputValue(manual.date) || String(manual.date || ""),
//           dateValue: toDateValue(manual.date || manual.createdAt),
//           description: manual.description || "Manual entry",
//           poNo: manual.poNo || "",
//           projectCode: manual.projectCode || "",
//           debit,
//           credit,
//         });
//       });

//       statementRows.sort((a, b) => {
//         if (a.source === "opening") return -1;
//         if (b.source === "opening") return 1;
//         return a.dateValue - b.dateValue || a.description.localeCompare(b.description);
//       });

//       let runningBalance = savedOpening.amount;
//       const balancedRows = statementRows.map((row) => {
//         if (row.source === "opening") {
//           return { ...row, balance: savedOpening.amount };
//         }

//         runningBalance += toNumber(row.credit) - toNumber(row.debit);
//         return { ...row, balance: runningBalance };
//       });

//       setRows(balancedRows);
//     } catch (error) {
//       console.error("Failed to load account statement:", error);
//       setRows([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadStatement();
//   }, []);

//   useEffect(() => {
//     const unsubscribers = [
//       onSnapshot(collection(db, "Panels", PANEL_ID, "payments"), loadStatement),
//       onSnapshot(collection(db, "Panels", PANEL_ID, "invoiceRequests"), loadStatement),
//       onSnapshot(collection(db, "Panels", PANEL_ID, "claimReimbursements"), loadStatement),
//       onSnapshot(
//         collection(db, "Panels", PANEL_ID, "accountStatementManualEntries"),
//         loadStatement,
//       ),
//     ];

//     return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
//   }, []);

//   const filteredRows = useMemo(() => {
//     const queryText = search.trim().toLowerCase();
//     if (!queryText) return rows;

//     return rows.filter((row) => {
//       return (
//         row.description.toLowerCase().includes(queryText) ||
//         row.poNo.toLowerCase().includes(queryText) ||
//         row.projectCode.toLowerCase().includes(queryText) ||
//         row.source.toLowerCase().includes(queryText) ||
//         row.date.toLowerCase().includes(queryText)
//       );
//     });
//   }, [rows, search]);

//   const totals = useMemo(() => {
//     return rows.reduce(
//       (acc, row) => {
//         if (row.source !== "opening") {
//           acc.debit += toNumber(row.debit);
//           acc.credit += toNumber(row.credit);
//         }

//         acc.balance = row.balance ?? acc.balance;
//         return acc;
//       },
//       { debit: 0, credit: 0, balance: openingBalance.amount },
//     );
//   }, [rows, openingBalance.amount]);

//   const saveOpeningBalance = async () => {
//     try {
//       setSavingOpening(true);

//       const amount = toNumber(openingAmountInput);
//       const date = openingDateInput || new Date().toISOString().slice(0, 10);

//       await setDoc(
//         doc(db, "Panels", PANEL_ID, "accountStatementSettings", "main"),
//         {
//           openingBalance: amount,
//           openingBalanceDate: date,
//           updatedAt: serverTimestamp(),
//           updatedBy: userProfile?.displayName || currentUser?.email || "Unknown",
//           updatedById: currentUser?.uid || "",
//         },
//         { merge: true },
//       );

//       setOpeningBalance({ amount, date });
//       await loadStatement();
//     } catch (error) {
//       console.error("Failed to save opening balance:", error);
//       alert("Failed to save opening balance.");
//     } finally {
//       setSavingOpening(false);
//     }
//   };

//   const saveManualEntry = async () => {
//     const debit = toNumber(manualForm.debit);
//     const credit = toNumber(manualForm.credit);

//     if (!manualForm.date) {
//       alert("Please select date.");
//       return;
//     }

//     if (!manualForm.description.trim()) {
//       alert("Please enter description.");
//       return;
//     }

//     if (debit <= 0 && credit <= 0) {
//       alert("Please enter debit or credit amount.");
//       return;
//     }

//     if (debit > 0 && credit > 0) {
//       alert("Please enter either debit or credit, not both.");
//       return;
//     }

//     try {
//       setSavingManual(true);

//       await addDoc(collection(db, "Panels", PANEL_ID, "accountStatementManualEntries"), {
//         date: manualForm.date,
//         description: manualForm.description.trim(),
//         poNo: manualForm.poNo.trim(),
//         projectCode: manualForm.projectCode.trim(),
//         debit,
//         credit,
//         entryType: credit > 0 ? "credit" : "debit",
//         createdAt: serverTimestamp(),
//         createdBy: userProfile?.displayName || currentUser?.email || "Unknown",
//         createdById: currentUser?.uid || "",
//       });

//       setManualForm(emptyManualForm);
//       setManualDialogOpen(false);
//       await loadStatement();
//     } catch (error) {
//       console.error("Failed to save manual entry:", error);
//       alert("Failed to save manual entry.");
//     } finally {
//       setSavingManual(false);
//     }
//   };

//   const deleteManualEntry = async (row: StatementRow) => {
//     if (!row.manualDocId) return;

//     const confirmed = window.confirm("Delete this manual account statement entry?");
//     if (!confirmed) return;

//     try {
//       await deleteDoc(
//         doc(db, "Panels", PANEL_ID, "accountStatementManualEntries", row.manualDocId),
//       );
//       await loadStatement();
//     } catch (error) {
//       console.error("Failed to delete manual entry:", error);
//       alert("Failed to delete manual entry.");
//     }
//   };

//   return (
//     <div className="space-y-6 p-6">
//       <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
//         <div>
//           <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
//             Account Statement
//           </h1>
//           <p className="mt-1 text-sm text-slate-500">
//             Track opening balance, received invoice payments, released expenses,
//             reimbursements, and manual entries.
//           </p>
//         </div>

//         <div className="flex flex-wrap items-center gap-2">
//           <Button variant="outline" onClick={loadStatement} className="gap-2">
//             <RefreshCw className="h-4 w-4" />
//             Refresh
//           </Button>

//           <Button onClick={() => setManualDialogOpen(true)} className="gap-2">
//             <Plus className="h-4 w-4" />
//             Add Manual Entry
//           </Button>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
//         <StatCard
//           title="Total Debit"
//           value={`Rs ${formatCurrency(totals.debit)}`}
//           icon={<ArrowDownCircle className="h-5 w-5" />}
//         />
//         <StatCard
//           title="Total Credit"
//           value={`Rs ${formatCurrency(totals.credit)}`}
//           icon={<ArrowUpCircle className="h-5 w-5" />}
//         />
//         <StatCard
//           title="Current Balance"
//           value={`Rs ${formatCurrency(totals.balance)}`}
//           icon={<Wallet className="h-5 w-5" />}
//         />
//       </div>

//       <Card className="border-slate-200 shadow-sm">
//         <CardContent className="p-5">
//           <div className="mb-4">
//             <h2 className="text-base font-semibold text-slate-950">Opening Balance</h2>
//             <p className="mt-1 text-sm text-slate-500">
//               This value is saved in Firebase and used as the first balance in the statement.
//             </p>
//           </div>

//           <div className="grid grid-cols-1 gap-4 md:grid-cols-[180px_1fr_auto] md:items-end">
//             <div>
//               <Label>Date</Label>
//               <Input
//                 type="date"
//                 value={openingDateInput}
//                 onChange={(event) => setOpeningDateInput(event.target.value)}
//                 className="mt-2"
//               />
//             </div>

//             <div>
//               <Label>Opening Balance Amount</Label>
//               <Input
//                 type="number"
//                 value={openingAmountInput}
//                 onChange={(event) => setOpeningAmountInput(event.target.value)}
//                 className="mt-2"
//                 placeholder="Enter opening balance"
//               />
//             </div>

//             <Button
//               onClick={saveOpeningBalance}
//               disabled={savingOpening}
//               className="gap-2"
//             >
//               <Save className="h-4 w-4" />
//               {savingOpening ? "Saving..." : "Save"}
//             </Button>
//           </div>
//         </CardContent>
//       </Card>

//       <Card className="border-slate-200 shadow-sm">
//         <CardContent className="p-5">
//           <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
//             <div>
//               <h2 className="text-base font-semibold text-slate-950">Statement Entries</h2>
//               <p className="mt-1 text-sm text-slate-500">
//                 Credit comes from received payments and manual incoming entries.
//                 Debit comes from released budget requests, released reimbursements,
//                 and manual outgoing entries.
//               </p>
//             </div>

//             <div className="relative w-full lg:w-80">
//               <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
//               <Input
//                 value={search}
//                 onChange={(event) => setSearch(event.target.value)}
//                 placeholder="Search statement"
//                 className="pl-9"
//               />
//             </div>
//           </div>

//           <div className="overflow-x-auto rounded-2xl border border-slate-200">
//             <table className="min-w-[980px] w-full text-sm">
//               <thead className="bg-slate-50">
//                 <tr className="border-b border-slate-200 text-slate-600">
//                   <th className="px-4 py-3 text-left font-semibold">Date</th>
//                   <th className="px-4 py-3 text-left font-semibold">Description</th>
//                   <th className="px-4 py-3 text-left font-semibold">PO No</th>
//                   <th className="px-4 py-3 text-left font-semibold">Project Code</th>
//                   <th className="px-4 py-3 text-right font-semibold">Debit</th>
//                   <th className="px-4 py-3 text-right font-semibold">Credit</th>
//                   <th className="px-4 py-3 text-right font-semibold">Balance</th>
//                   <th className="px-4 py-3 text-right font-semibold">Action</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {loading ? (
//                   <tr>
//                     <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
//                       Loading account statement...
//                     </td>
//                   </tr>
//                 ) : filteredRows.length > 0 ? (
//                   filteredRows.map((row) => (
//                     <tr key={row.id} className="border-b border-slate-100 last:border-0">
//                       <td className="whitespace-nowrap px-4 py-3 text-slate-700">
//                         {formatDate(row.date)}
//                       </td>
//                       <td className="px-4 py-3 text-slate-900">
//                         <div className="font-medium">{row.description}</div>
//                         <div className="mt-1 text-xs capitalize text-slate-500">
//                           {row.source.replace(/_/g, " ")}
//                         </div>
//                       </td>
//                       <td className="whitespace-nowrap px-4 py-3 text-slate-700">
//                         {row.poNo || "-"}
//                       </td>
//                       <td className="whitespace-nowrap px-4 py-3 text-slate-700">
//                         {row.projectCode || "-"}
//                       </td>
//                       <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-900">
//                         {row.debit > 0 ? `Rs ${formatCurrency(row.debit)}` : "-"}
//                       </td>
//                       <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-900">
//                         {row.credit > 0 ? `Rs ${formatCurrency(row.credit)}` : "-"}
//                       </td>
//                       <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-950">
//                         Rs {formatCurrency(row.balance || 0)}
//                       </td>
//                       <td className="whitespace-nowrap px-4 py-3 text-right">
//                         {row.source === "manual" ? (
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             className="text-red-600 hover:text-red-700"
//                             onClick={() => deleteManualEntry(row)}
//                           >
//                             <Trash2 className="h-4 w-4" />
//                           </Button>
//                         ) : (
//                           <span className="text-slate-400">-</span>
//                         )}
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
//                       No account statement entries found.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </CardContent>
//       </Card>

//       <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
//         <DialogContent className="max-w-2xl">
//           <DialogHeader>
//             <DialogTitle>Add Manual Statement Entry</DialogTitle>
//           </DialogHeader>

//           <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//             <div>
//               <Label>Date</Label>
//               <Input
//                 type="date"
//                 value={manualForm.date}
//                 onChange={(event) =>
//                   setManualForm((prev) => ({ ...prev, date: event.target.value }))
//                 }
//                 className="mt-2"
//               />
//             </div>

//             <div>
//               <Label>Project Code</Label>
//               <Input
//                 value={manualForm.projectCode}
//                 onChange={(event) =>
//                   setManualForm((prev) => ({ ...prev, projectCode: event.target.value }))
//                 }
//                 className="mt-2"
//                 placeholder="Enter project code"
//               />
//             </div>

//             <div>
//               <Label>PO No</Label>
//               <Input
//                 value={manualForm.poNo}
//                 onChange={(event) =>
//                   setManualForm((prev) => ({ ...prev, poNo: event.target.value }))
//                 }
//                 className="mt-2"
//                 placeholder="Enter PO No"
//               />
//             </div>

//             <div className="grid grid-cols-2 gap-3">
//               <div>
//                 <Label>Debit</Label>
//                 <Input
//                   type="number"
//                   value={manualForm.debit}
//                   onChange={(event) =>
//                     setManualForm((prev) => ({
//                       ...prev,
//                       debit: event.target.value,
//                       credit: event.target.value ? "" : prev.credit,
//                     }))
//                   }
//                   className="mt-2"
//                   placeholder="Outgoing"
//                 />
//               </div>

//               <div>
//                 <Label>Credit</Label>
//                 <Input
//                   type="number"
//                   value={manualForm.credit}
//                   onChange={(event) =>
//                     setManualForm((prev) => ({
//                       ...prev,
//                       credit: event.target.value,
//                       debit: event.target.value ? "" : prev.debit,
//                     }))
//                   }
//                   className="mt-2"
//                   placeholder="Incoming"
//                 />
//               </div>
//             </div>

//             <div className="md:col-span-2">
//               <Label>Description</Label>
//               <Textarea
//                 value={manualForm.description}
//                 onChange={(event) =>
//                   setManualForm((prev) => ({ ...prev, description: event.target.value }))
//                 }
//                 className="mt-2 min-h-24"
//                 placeholder="Enter description"
//               />
//             </div>
//           </div>

//           <div className="mt-5 flex justify-end gap-3">
//             <Button
//               variant="outline"
//               onClick={() => {
//                 setManualDialogOpen(false);
//                 setManualForm(emptyManualForm);
//               }}
//             >
//               Cancel
//             </Button>

//             <Button onClick={saveManualEntry} disabled={savingManual}>
//               {savingManual ? "Saving..." : "Save Entry"}
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

// import { useEffect, useMemo, useState, type ReactNode } from "react";
// import {
//   addDoc,
//   collection,
//   deleteDoc,
//   doc,
//   getDoc,
//   getDocs,
//   onSnapshot,
//   serverTimestamp,
//   setDoc,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { useAuth } from "@/contexts/AuthContext";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import {
//   ArrowDownCircle,
//   ArrowUpCircle,
//   Plus,
//   RefreshCw,
//   RotateCcw,
//   Save,
//   Search,
//   Trash2,
//   Wallet,
// } from "lucide-react";

// const PANEL_ID = "IEDGE-SYSTEM";

// type StatementSource =
//   | "opening"
//   | "invoice_payment"
//   | "budget_request"
//   | "reimbursement"
//   | "manual";

// type StatementRow = {
//   id: string;
//   source: StatementSource;
//   date: string;
//   dateValue: number;
//   description: string;
//   poNo: string;
//   projectCode: string;
//   debit: number;
//   credit: number;
//   balance?: number;
//   manualDocId?: string;
// };

// type ManualEntryForm = {
//   date: string;
//   description: string;
//   poNo: string;
//   projectCode: string;
//   debit: string;
//   credit: string;
// };

// type OpeningBalance = {
//   amount: number;
//   date: string;
// };

// type ProjectCodeLookup = Map<string, string>;

// const emptyManualForm: ManualEntryForm = {
//   date: new Date().toISOString().slice(0, 10),
//   description: "",
//   poNo: "",
//   projectCode: "",
//   debit: "",
//   credit: "",
// };

// const toNumber = (value: any) => {
//   const parsed =
//     typeof value === "number"
//       ? value
//       : Number(String(value ?? "").replace(/,/g, ""));

//   return Number.isFinite(parsed) ? parsed : 0;
// };

// const toDateInputValue = (value: any) => {
//   if (!value) return "";

//   try {
//     const date =
//       value?.toDate && typeof value.toDate === "function"
//         ? value.toDate()
//         : value instanceof Date
//           ? value
//           : new Date(value);

//     if (Number.isNaN(date.getTime())) return "";
//     return date.toISOString().slice(0, 10);
//   } catch {
//     return "";
//   }
// };

// const toDateValue = (value: any) => {
//   if (!value) return 0;

//   try {
//     const date =
//       value?.toDate && typeof value.toDate === "function"
//         ? value.toDate()
//         : value instanceof Date
//           ? value
//           : new Date(value);

//     const time = date.getTime();
//     return Number.isFinite(time) ? time : 0;
//   } catch {
//     return 0;
//   }
// };

// const formatDate = (value: string) => {
//   if (!value) return "-";

//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return value;

//   return date.toLocaleDateString("en-PK", {
//     year: "numeric",
//     month: "short",
//     day: "2-digit",
//   });
// };

// const formatCurrency = (value: number) => {
//   return toNumber(value).toLocaleString("en-PK", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });
// };

// const getFirstValue = (...values: any[]) => {
//   for (const value of values) {
//     if (value === undefined || value === null) continue;
//     if (typeof value === "object") continue;

//     const text = String(value).trim();
//     if (text) return text;
//   }

//   return "";
// };

// const normalizeLookupKey = (value: any) => {
//   if (value === undefined || value === null || typeof value === "object")
//     return "";
//   return String(value).trim().toLowerCase();
// };

// const getProjectCodeValue = (source: any) =>
//   getFirstValue(
//     source?.projectCode,
//     source?.project_code,
//     source?.projectCodeNo,
//     source?.projectNo,
//     source?.projectNumber,
//     source?.projectId,
//     source?.project?.projectCode,
//     source?.project?.project_code,
//     source?.project?.code,
//     source?.projectDetails?.projectCode,
//     source?.projectDetails?.project_code,
//     source?.selectedProject?.projectCode,
//     source?.selectedProject?.project_code,
//     source?.clientProject?.projectCode,
//     source?.clientProject?.project_code,
//     source?.record?.projectCode,
//     source?.record?.project_code,
//   );

// const getPoNoValue = (source: any) =>
//   getFirstValue(
//     source?.poNo,
//     source?.poNumber,
//     source?.purchaseOrderNo,
//     source?.purchaseOrderNumber,
//     source?.purchaseOrder,
//     source?.po,
//     source?.invoiceNo,
//     source?.requestNo,
//     source?.requestId,
//   );

// const registerProjectCode = (
//   lookup: ProjectCodeLookup,
//   projectCode: any,
//   ...keys: any[]
// ) => {
//   const cleanProjectCode = getFirstValue(projectCode);
//   if (!cleanProjectCode) return;

//   keys.forEach((key) => {
//     const cleanKey = normalizeLookupKey(key);
//     if (!cleanKey) return;

//     if (!lookup.has(cleanKey)) {
//       lookup.set(cleanKey, cleanProjectCode);
//     }
//   });
// };

// const lookupProjectCode = (lookup: ProjectCodeLookup, ...keys: any[]) => {
//   for (const key of keys) {
//     const cleanKey = normalizeLookupKey(key);
//     if (!cleanKey) continue;

//     const found = lookup.get(cleanKey);
//     if (found) return found;
//   }

//   return "";
// };

// const registerEntityProjectCode = (lookup: ProjectCodeLookup, entity: any) => {
//   if (!entity) return;

//   const projectCode = getProjectCodeValue(entity);
//   if (!projectCode) return;

//   registerProjectCode(
//     lookup,
//     projectCode,
//     entity.id,
//     entity.projectCode,
//     entity.project_code,
//     entity.projectCodeNo,
//     entity.projectNo,
//     entity.projectNumber,
//     entity.projectId,
//     entity.project,
//     entity.projectName,
//     entity.title,
//     entity.subject,
//     entity.client,
//     entity.clientName,
//     entity.customerName,
//     entity.invoiceNo,
//     entity.poNo,
//     entity.poNumber,
//     entity.purchaseOrderNo,
//     entity.requestId,
//     entity.recordId,
//   );
// };

// const resolveProjectCode = (
//   lookup: ProjectCodeLookup,
//   directSource: any,
//   secondarySource?: any,
//   ...lookupKeys: any[]
// ) => {
//   return getFirstValue(
//     getProjectCodeValue(directSource),
//     getProjectCodeValue(secondarySource),
//     lookupProjectCode(lookup, ...lookupKeys),
//   );
// };

// const getInvoiceProjectCode = (
//   lookup: ProjectCodeLookup,
//   payment: any,
//   invoice: any,
// ) =>
//   resolveProjectCode(
//     lookup,
//     payment,
//     invoice,
//     payment?.invoiceId,
//     payment?.invoiceNo,
//     payment?.poNo,
//     payment?.poNumber,
//     payment?.client,
//     invoice?.id,
//     invoice?.invoiceNo,
//     invoice?.project,
//     invoice?.projectName,
//     invoice?.title,
//     invoice?.subject,
//     invoice?.client,
//     invoice?.clientName,
//   );

// const getInvoicePoNo = (payment: any, invoice: any) =>
//   getFirstValue(getPoNoValue(payment), getPoNoValue(invoice));

// const getRequestProjectCode = (lookup: ProjectCodeLookup, request: any) =>
//   resolveProjectCode(
//     lookup,
//     request,
//     null,
//     request?.id,
//     request?.requestId,
//     request?.project,
//     request?.projectName,
//     request?.title,
//     request?.subject,
//     request?.client,
//     request?.clientName,
//     request?.poNo,
//     request?.poNumber,
//   );

// const getRequestPoNo = (request: any) => getPoNoValue(request);

// const getReimbursementProjectCode = (
//   lookup: ProjectCodeLookup,
//   reimbursement: any,
//   record: any,
//   claim: any,
// ) =>
//   resolveProjectCode(
//     lookup,
//     reimbursement || claim,
//     record,
//     reimbursement?.recordId,
//     record?.id,
//     record?.project,
//     record?.projectName,
//     record?.title,
//     record?.subject,
//     record?.client,
//     record?.clientName,
//     claim?.project,
//     claim?.projectName,
//     claim?.projectCode,
//     claim?.title,
//     claim?.subject,
//     claim?.client,
//     claim?.clientName,
//   );

// const getReimbursementPoNo = (reimbursement: any, record: any, claim: any) =>
//   getFirstValue(
//     getPoNoValue(reimbursement),
//     getPoNoValue(record),
//     getPoNoValue(claim),
//   );

// function StatCard({
//   title,
//   value,
//   icon,
// }: {
//   title: string;
//   value: string;
//   icon: ReactNode;
// }) {
//   return (
//     <Card className="border-slate-200 shadow-sm">
//       <CardContent className="flex items-center justify-between p-5">
//         <div>
//           <p className="text-sm text-slate-500">{title}</p>
//           <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
//         </div>

//         <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
//           {icon}
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

// export default function AccountStatement() {
//   const { currentUser, userProfile } = useAuth();

//   const [loading, setLoading] = useState(true);
//   const [savingOpening, setSavingOpening] = useState(false);
//   const [savingManual, setSavingManual] = useState(false);

//   const [openingBalance, setOpeningBalance] = useState<OpeningBalance>({
//     amount: 0,
//     date: new Date().toISOString().slice(0, 10),
//   });
//   const [openingAmountInput, setOpeningAmountInput] = useState("0");
//   const [openingDateInput, setOpeningDateInput] = useState(
//     new Date().toISOString().slice(0, 10),
//   );

//   const [rows, setRows] = useState<StatementRow[]>([]);
//   const [manualDialogOpen, setManualDialogOpen] = useState(false);
//   const [manualForm, setManualForm] =
//     useState<ManualEntryForm>(emptyManualForm);
//   const [search, setSearch] = useState("");
//   const [dateFrom, setDateFrom] = useState("");
//   const [dateTo, setDateTo] = useState("");
//   const [projectCodeFilter, setProjectCodeFilter] = useState("");

//   const loadStatement = async () => {
//     setLoading(true);

//     try {
//       const projectCodeLookup: ProjectCodeLookup = new Map();

//       const settingsRef = doc(
//         db,
//         "Panels",
//         PANEL_ID,
//         "accountStatementSettings",
//         "main",
//       );
//       const settingsSnap = await getDoc(settingsRef);
//       const settingsData = settingsSnap.exists() ? settingsSnap.data() : {};

//       const savedOpening: OpeningBalance = {
//         amount: toNumber(settingsData?.openingBalance),
//         date:
//           toDateInputValue(settingsData?.openingBalanceDate) ||
//           String(settingsData?.openingBalanceDate || "") ||
//           new Date().toISOString().slice(0, 10),
//       };

//       setOpeningBalance(savedOpening);
//       setOpeningAmountInput(String(savedOpening.amount));
//       setOpeningDateInput(savedOpening.date);

//       const statementRows: StatementRow[] = [];

//       statementRows.push({
//         id: "opening-balance",
//         source: "opening",
//         date: savedOpening.date,
//         dateValue: toDateValue(savedOpening.date),
//         description: "Opening Balance",
//         poNo: "",
//         projectCode: "",
//         debit: 0,
//         credit: 0,
//       });

//       const invoiceMap = new Map<string, any>();
//       const invoiceSnap = await getDocs(
//         collection(db, "Panels", PANEL_ID, "estimateInvoices"),
//       );

//       invoiceSnap.forEach((invoiceDoc) => {
//         const invoice = {
//           id: invoiceDoc.id,
//           ...invoiceDoc.data(),
//         };

//         invoiceMap.set(invoiceDoc.id, invoice);
//         registerEntityProjectCode(projectCodeLookup, invoice);
//       });

//       const panelRecordsSnap = await getDocs(
//         collection(db, "Panels", PANEL_ID, "salesRecords"),
//       );

//       let legacyRecordDocs: any[] = [];
//       try {
//         const legacyRecordsSnap = await getDocs(collection(db, "salesRecords"));
//         legacyRecordDocs = legacyRecordsSnap.docs;
//       } catch (error) {
//         console.warn("Legacy salesRecords path not available:", error);
//       }

//       const recordMap = new Map<string, { id: string; data: any }>();

//       panelRecordsSnap.docs.forEach((recordDoc) => {
//         const recordData = recordDoc.data();
//         recordMap.set(recordDoc.id, {
//           id: recordDoc.id,
//           data: recordData,
//         });
//         registerEntityProjectCode(projectCodeLookup, {
//           id: recordDoc.id,
//           ...recordData,
//         });
//       });

//       legacyRecordDocs.forEach((recordDoc) => {
//         const recordData = recordDoc.data();

//         if (!recordMap.has(recordDoc.id)) {
//           recordMap.set(recordDoc.id, {
//             id: recordDoc.id,
//             data: recordData,
//           });
//         }

//         registerEntityProjectCode(projectCodeLookup, {
//           id: recordDoc.id,
//           ...recordData,
//         });
//       });

//       try {
//         const projectSnap = await getDocs(
//           collection(db, "Panels", PANEL_ID, "projects"),
//         );
//         projectSnap.docs.forEach((projectDoc) => {
//           registerEntityProjectCode(projectCodeLookup, {
//             id: projectDoc.id,
//             ...projectDoc.data(),
//           });
//         });
//       } catch (error) {
//         console.warn(
//           "Projects path not available for project code lookup:",
//           error,
//         );
//       }

//       try {
//         const clientProjectSnap = await getDocs(
//           collection(db, "Panels", PANEL_ID, "clientProjects"),
//         );
//         clientProjectSnap.docs.forEach((projectDoc) => {
//           registerEntityProjectCode(projectCodeLookup, {
//             id: projectDoc.id,
//             ...projectDoc.data(),
//           });
//         });
//       } catch (error) {
//         console.warn(
//           "Client projects path not available for project code lookup:",
//           error,
//         );
//       }

//       const paymentsSnap = await getDocs(
//         collection(db, "Panels", PANEL_ID, "payments"),
//       );

//       paymentsSnap.forEach((paymentDoc) => {
//         const payment: any = paymentDoc.data();
//         const invoice = payment.invoiceId
//           ? invoiceMap.get(payment.invoiceId)
//           : null;
//         const amount = toNumber(payment.amount);

//         if (amount <= 0) return;

//         const projectCode = getInvoiceProjectCode(
//           projectCodeLookup,
//           payment,
//           invoice,
//         );

//         statementRows.push({
//           id: `invoice-payment-${paymentDoc.id}`,
//           source: "invoice_payment",
//           date:
//             toDateInputValue(payment.paymentDate) ||
//             toDateInputValue(payment.createdAt) ||
//             "",
//           dateValue: toDateValue(payment.paymentDate || payment.createdAt),
//           description: `Invoice payment received${
//             payment.invoiceNo ? ` - ${payment.invoiceNo}` : ""
//           }${payment.client ? ` - ${payment.client}` : ""}`,
//           poNo: getInvoicePoNo(payment, invoice),
//           projectCode,
//           debit: 0,
//           credit: amount,
//         });
//       });

//       const budgetSnap = await getDocs(
//         collection(db, "Panels", PANEL_ID, "invoiceRequests"),
//       );

//       budgetSnap.forEach((requestDoc) => {
//         const request: any = { id: requestDoc.id, ...requestDoc.data() };
//         registerEntityProjectCode(projectCodeLookup, request);

//         const paymentDetails = request.paymentDetails || {};
//         const status = String(request.status || "").toLowerCase();
//         const isReleased =
//           status === "payment_released" ||
//           status === "released" ||
//           !!paymentDetails.releasedAt ||
//           !!paymentDetails.amount;

//         if (!isReleased) return;

//         const amount = toNumber(
//           paymentDetails.amount ||
//             request.releasedAmount ||
//             request.totalAmount,
//         );
//         if (amount <= 0) return;

//         const vendors = Array.isArray(paymentDetails.vendors)
//           ? paymentDetails.vendors.join(", ")
//           : paymentDetails.vendor || "";

//         const subject = getFirstValue(
//           request.subject,
//           request.title,
//           request.project,
//           vendors,
//         );
//         const projectCode = getRequestProjectCode(projectCodeLookup, request);

//         statementRows.push({
//           id: `budget-request-${requestDoc.id}`,
//           source: "budget_request",
//           date:
//             toDateInputValue(paymentDetails.releasedAt) ||
//             toDateInputValue(request.updatedAt) ||
//             toDateInputValue(request.submittedAt) ||
//             "",
//           dateValue: toDateValue(
//             paymentDetails.releasedAt ||
//               request.updatedAt ||
//               request.submittedAt,
//           ),
//           description: `Budget request payment released${subject ? ` - ${subject}` : ""}`,
//           poNo: getRequestPoNo(request),
//           projectCode,
//           debit: amount,
//           credit: 0,
//         });
//       });

//       const claimSnap = await getDocs(
//         collection(db, "Panels", PANEL_ID, "claimReimbursements"),
//       );

//       claimSnap.forEach((claimDoc) => {
//         const claim: any = { id: claimDoc.id, ...claimDoc.data() };
//         registerEntityProjectCode(projectCodeLookup, claim);

//         const paymentStatus = String(claim.paymentStatus || "").toLowerCase();

//         if (paymentStatus !== "paid") return;

//         const amount = toNumber(
//           claim.paidAmount ||
//             claim.approvedAmount ||
//             claim.claimAmount ||
//             claim.amount,
//         );

//         if (amount <= 0) return;

//         const projectCode = getReimbursementProjectCode(
//           projectCodeLookup,
//           null,
//           null,
//           claim,
//         );

//         statementRows.push({
//           id: `claim-reimbursement-${claimDoc.id}`,
//           source: "reimbursement",
//           date:
//             toDateInputValue(claim.paymentReleasedAt) ||
//             toDateInputValue(claim.updatedAt) ||
//             toDateInputValue(claim.submittedAt) ||
//             "",
//           dateValue: toDateValue(
//             claim.paymentReleasedAt || claim.updatedAt || claim.submittedAt,
//           ),
//           description: `Reimbursement released - ${
//             claim.description || claim.foodItem || claim.claimType || "Claim"
//           }${claim.submittedByName ? ` - ${claim.submittedByName}` : ""}`,
//           poNo: getReimbursementPoNo(null, null, claim),
//           projectCode,
//           debit: amount,
//           credit: 0,
//         });
//       });

//       await Promise.all(
//         Array.from(recordMap.values()).map(async (record) => {
//           const meetingDocs: Array<{
//             meetingDoc: any;
//             sourcePath: "panel" | "root";
//           }> = [];

//           try {
//             const panelMeetingSnap = await getDocs(
//               collection(
//                 db,
//                 "Panels",
//                 PANEL_ID,
//                 "salesRecords",
//                 record.id,
//                 "meetingUpdates",
//               ),
//             );

//             panelMeetingSnap.docs.forEach((meetingDoc) => {
//               meetingDocs.push({ meetingDoc, sourcePath: "panel" });
//             });
//           } catch (error) {
//             console.warn("Panel meetingUpdates path not available:", error);
//           }

//           try {
//             const rootMeetingSnap = await getDocs(
//               collection(db, "salesRecords", record.id, "meetingUpdates"),
//             );

//             rootMeetingSnap.docs.forEach((meetingDoc) => {
//               meetingDocs.push({ meetingDoc, sourcePath: "root" });
//             });
//           } catch (error) {
//             console.warn("Legacy meetingUpdates path not available:", error);
//           }

//           meetingDocs.forEach(({ meetingDoc, sourcePath }) => {
//             const meeting: any = meetingDoc.data();
//             const reimbursement = meeting?.reimbursement;

//             if (!reimbursement?.enabled) return;
//             if (
//               String(reimbursement.paymentStatus || "").toLowerCase() !== "paid"
//             )
//               return;

//             const amount = toNumber(
//               reimbursement.paidAmount ||
//                 reimbursement.approvedAmount ||
//                 reimbursement.amount,
//             );

//             if (amount <= 0) return;

//             const projectCode = getReimbursementProjectCode(
//               projectCodeLookup,
//               { ...reimbursement, recordId: record.id },
//               { id: record.id, ...record.data },
//               null,
//             );

//             statementRows.push({
//               id: `meeting-reimbursement-${sourcePath}-${record.id}-${meetingDoc.id}`,
//               source: "reimbursement",
//               date:
//                 toDateInputValue(reimbursement.paymentReleasedAt) ||
//                 toDateInputValue(reimbursement.updatedAt) ||
//                 toDateInputValue(meeting.updatedAt) ||
//                 toDateInputValue(meeting.submittedAt) ||
//                 "",
//               dateValue: toDateValue(
//                 reimbursement.paymentReleasedAt ||
//                   reimbursement.updatedAt ||
//                   meeting.updatedAt ||
//                   meeting.submittedAt,
//               ),
//               description: `Reimbursement released - ${
//                 reimbursement.detail ||
//                 reimbursement.description ||
//                 record.data?.projectName ||
//                 "Claim"
//               }${meeting.personName ? ` - ${meeting.personName}` : ""}`,
//               poNo: getReimbursementPoNo(reimbursement, record.data, null),
//               projectCode,
//               debit: amount,
//               credit: 0,
//             });
//           });
//         }),
//       );

//       const manualSnap = await getDocs(
//         collection(db, "Panels", PANEL_ID, "accountStatementManualEntries"),
//       );

//       manualSnap.forEach((manualDoc) => {
//         const manual: any = manualDoc.data();
//         const debit = toNumber(manual.debit);
//         const credit = toNumber(manual.credit);

//         if (debit <= 0 && credit <= 0) return;

//         const projectCode = resolveProjectCode(
//           projectCodeLookup,
//           manual,
//           null,
//           manual.projectCode,
//           manual.project,
//           manual.projectName,
//           manual.poNo,
//           manual.description,
//         );

//         statementRows.push({
//           id: `manual-${manualDoc.id}`,
//           source: "manual",
//           manualDocId: manualDoc.id,
//           date: toDateInputValue(manual.date) || String(manual.date || ""),
//           dateValue: toDateValue(manual.date || manual.createdAt),
//           description: manual.description || "Manual entry",
//           poNo: manual.poNo || "",
//           projectCode,
//           debit,
//           credit,
//         });
//       });

//       statementRows.sort((a, b) => {
//         if (a.source === "opening") return -1;
//         if (b.source === "opening") return 1;
//         return (
//           a.dateValue - b.dateValue ||
//           a.description.localeCompare(b.description)
//         );
//       });

//       let runningBalance = savedOpening.amount;
//       const balancedRows = statementRows.map((row) => {
//         if (row.source === "opening") {
//           return { ...row, balance: savedOpening.amount };
//         }

//         runningBalance += toNumber(row.credit) - toNumber(row.debit);
//         return { ...row, balance: runningBalance };
//       });

//       setRows(balancedRows);
//     } catch (error) {
//       console.error("Failed to load account statement:", error);
//       setRows([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadStatement();
//   }, []);

//   useEffect(() => {
//     const unsubscribers = [
//       onSnapshot(collection(db, "Panels", PANEL_ID, "payments"), loadStatement),
//       onSnapshot(
//         collection(db, "Panels", PANEL_ID, "invoiceRequests"),
//         loadStatement,
//       ),
//       onSnapshot(
//         collection(db, "Panels", PANEL_ID, "claimReimbursements"),
//         loadStatement,
//       ),
//       onSnapshot(
//         collection(db, "Panels", PANEL_ID, "accountStatementManualEntries"),
//         loadStatement,
//       ),
//     ];

//     return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
//   }, []);

//   const projectCodeOptions = useMemo(() => {
//     return Array.from(
//       new Set(
//         rows
//           .map((row) => row.projectCode)
//           .filter((projectCode) => projectCode && projectCode.trim()),
//       ),
//     ).sort((a, b) => a.localeCompare(b));
//   }, [rows]);

//   const hasActiveFilters = Boolean(
//     search.trim() || dateFrom || dateTo || projectCodeFilter.trim(),
//   );

//   const filteredRows = useMemo(() => {
//     const queryText = search.trim().toLowerCase();
//     const projectCodeQuery = projectCodeFilter.trim().toLowerCase();
//     const fromTime = dateFrom
//       ? new Date(`${dateFrom}T00:00:00`).getTime()
//       : null;
//     const toTime = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;

//     return rows.filter((row) => {
//       const rowDate = row.dateValue || toDateValue(row.date);

//       if (fromTime !== null && rowDate && rowDate < fromTime) return false;
//       if (toTime !== null && rowDate && rowDate > toTime) return false;

//       if (projectCodeQuery) {
//         const rowProjectCode = row.projectCode.trim().toLowerCase();
//         if (!rowProjectCode.includes(projectCodeQuery)) return false;
//       }

//       if (!queryText) return true;

//       return (
//         row.description.toLowerCase().includes(queryText) ||
//         row.poNo.toLowerCase().includes(queryText) ||
//         row.projectCode.toLowerCase().includes(queryText) ||
//         row.source.toLowerCase().includes(queryText) ||
//         row.date.toLowerCase().includes(queryText)
//       );
//     });
//   }, [rows, search, dateFrom, dateTo, projectCodeFilter]);

//   const totals = useMemo(() => {
//     return filteredRows.reduce(
//       (acc, row) => {
//         if (row.source !== "opening") {
//           acc.debit += toNumber(row.debit);
//           acc.credit += toNumber(row.credit);
//         }

//         acc.balance = row.balance ?? acc.balance;
//         return acc;
//       },
//       { debit: 0, credit: 0, balance: openingBalance.amount },
//     );
//   }, [filteredRows, openingBalance.amount]);

//   const resetFilters = () => {
//     setSearch("");
//     setDateFrom("");
//     setDateTo("");
//     setProjectCodeFilter("");
//   };

//   const saveOpeningBalance = async () => {
//     try {
//       setSavingOpening(true);

//       const amount = toNumber(openingAmountInput);
//       const date = openingDateInput || new Date().toISOString().slice(0, 10);

//       await setDoc(
//         doc(db, "Panels", PANEL_ID, "accountStatementSettings", "main"),
//         {
//           openingBalance: amount,
//           openingBalanceDate: date,
//           updatedAt: serverTimestamp(),
//           updatedBy:
//             userProfile?.displayName || currentUser?.email || "Unknown",
//           updatedById: currentUser?.uid || "",
//         },
//         { merge: true },
//       );

//       setOpeningBalance({ amount, date });
//       await loadStatement();
//     } catch (error) {
//       console.error("Failed to save opening balance:", error);
//       alert("Failed to save opening balance.");
//     } finally {
//       setSavingOpening(false);
//     }
//   };

//   const saveManualEntry = async () => {
//     const debit = toNumber(manualForm.debit);
//     const credit = toNumber(manualForm.credit);

//     if (!manualForm.date) {
//       alert("Please select date.");
//       return;
//     }

//     if (!manualForm.description.trim()) {
//       alert("Please enter description.");
//       return;
//     }

//     if (debit <= 0 && credit <= 0) {
//       alert("Please enter debit or credit amount.");
//       return;
//     }

//     if (debit > 0 && credit > 0) {
//       alert("Please enter either debit or credit, not both.");
//       return;
//     }

//     try {
//       setSavingManual(true);

//       await addDoc(
//         collection(db, "Panels", PANEL_ID, "accountStatementManualEntries"),
//         {
//           date: manualForm.date,
//           description: manualForm.description.trim(),
//           poNo: manualForm.poNo.trim(),
//           projectCode: manualForm.projectCode.trim(),
//           debit,
//           credit,
//           entryType: credit > 0 ? "credit" : "debit",
//           createdAt: serverTimestamp(),
//           createdBy:
//             userProfile?.displayName || currentUser?.email || "Unknown",
//           createdById: currentUser?.uid || "",
//         },
//       );

//       setManualForm(emptyManualForm);
//       setManualDialogOpen(false);
//       await loadStatement();
//     } catch (error) {
//       console.error("Failed to save manual entry:", error);
//       alert("Failed to save manual entry.");
//     } finally {
//       setSavingManual(false);
//     }
//   };

//   const deleteManualEntry = async (row: StatementRow) => {
//     if (!row.manualDocId) return;

//     const confirmed = window.confirm(
//       "Delete this manual account statement entry?",
//     );
//     if (!confirmed) return;

//     try {
//       await deleteDoc(
//         doc(
//           db,
//           "Panels",
//           PANEL_ID,
//           "accountStatementManualEntries",
//           row.manualDocId,
//         ),
//       );
//       await loadStatement();
//     } catch (error) {
//       console.error("Failed to delete manual entry:", error);
//       alert("Failed to delete manual entry.");
//     }
//   };

//   return (
//     <div className="space-y-6 p-6">
//       <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
//         <div>
//           <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
//             Account Statement
//           </h1>
//           <p className="mt-1 text-sm text-slate-500">
//             Track opening balance, received invoice payments, released expenses,
//             reimbursements, and manual entries.
//           </p>
//         </div>

//         <div className="flex flex-wrap items-center gap-2">
//           <Button variant="outline" onClick={loadStatement} className="gap-2">
//             <RefreshCw className="h-4 w-4" />
//             Refresh
//           </Button>

//           <Button onClick={() => setManualDialogOpen(true)} className="gap-2">
//             <Plus className="h-4 w-4" />
//             Add Manual Entry
//           </Button>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
//         <StatCard
//           title={hasActiveFilters ? "Filtered Debit" : "Total Debit"}
//           value={`Rs ${formatCurrency(totals.debit)}`}
//           icon={<ArrowDownCircle className="h-5 w-5" />}
//         />
//         <StatCard
//           title={hasActiveFilters ? "Filtered Credit" : "Total Credit"}
//           value={`Rs ${formatCurrency(totals.credit)}`}
//           icon={<ArrowUpCircle className="h-5 w-5" />}
//         />
//         <StatCard
//           title={hasActiveFilters ? "Filtered Balance" : "Current Balance"}
//           value={`Rs ${formatCurrency(totals.balance)}`}
//           icon={<Wallet className="h-5 w-5" />}
//         />
//       </div>

//       <Card className="border-slate-200 shadow-sm">
//         <CardContent className="p-5">
//           <div className="mb-4">
//             <h2 className="text-base font-semibold text-slate-950">
//               Opening Balance
//             </h2>
//             <p className="mt-1 text-sm text-slate-500">
//               This value is saved in Firebase and used as the first balance in
//               the statement.
//             </p>
//           </div>

//           <div className="grid grid-cols-1 gap-4 md:grid-cols-[180px_1fr_auto] md:items-end">
//             <div>
//               <Label>Date</Label>
//               <Input
//                 type="date"
//                 value={openingDateInput}
//                 onChange={(event) => setOpeningDateInput(event.target.value)}
//                 className="mt-2"
//               />
//             </div>

//             <div>
//               <Label>Opening Balance Amount</Label>
//               <Input
//                 type="number"
//                 value={openingAmountInput}
//                 onChange={(event) => setOpeningAmountInput(event.target.value)}
//                 className="mt-2"
//                 placeholder="Enter opening balance"
//               />
//             </div>

//             <Button
//               onClick={saveOpeningBalance}
//               disabled={savingOpening}
//               className="gap-2"
//             >
//               <Save className="h-4 w-4" />
//               {savingOpening ? "Saving..." : "Save"}
//             </Button>
//           </div>
//         </CardContent>
//       </Card>

//       <Card className="border-slate-200 shadow-sm">
//         <CardContent className="p-5">
//           <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
//             <div>
//               <h2 className="text-base font-semibold text-slate-950">
//                 Statement Entries
//               </h2>
//               <p className="mt-1 text-sm text-slate-500">
//                 Credit comes from received payments and manual incoming entries.
//                 Debit comes from released budget requests, released
//                 reimbursements, and manual outgoing entries.
//               </p>
//             </div>

//             <div className="relative w-full lg:w-80">
//               <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
//               <Input
//                 value={search}
//                 onChange={(event) => setSearch(event.target.value)}
//                 placeholder="Search statement"
//                 className="pl-9"
//               />
//             </div>
//           </div>

//           <div className="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
//             <div>
//               <Label>Date From</Label>
//               <Input
//                 type="date"
//                 value={dateFrom}
//                 onChange={(event) => setDateFrom(event.target.value)}
//                 className="mt-2 bg-white"
//               />
//             </div>

//             <div>
//               <Label>Date To</Label>
//               <Input
//                 type="date"
//                 value={dateTo}
//                 onChange={(event) => setDateTo(event.target.value)}
//                 className="mt-2 bg-white"
//               />
//             </div>

//             <div>
//               <Label>Project Code</Label>
//               <Input
//                 list="account-statement-project-codes"
//                 value={projectCodeFilter}
//                 onChange={(event) => setProjectCodeFilter(event.target.value)}
//                 className="mt-2 bg-white"
//                 placeholder="Filter by project code"
//               />
//               <datalist id="account-statement-project-codes">
//                 {projectCodeOptions.map((projectCode) => (
//                   <option key={projectCode} value={projectCode} />
//                 ))}
//               </datalist>
//             </div>

//             <Button
//               variant="outline"
//               onClick={resetFilters}
//               disabled={!hasActiveFilters}
//               className="gap-2 bg-white"
//             >
//               <RotateCcw className="h-4 w-4" />
//               Reset Filters
//             </Button>
//           </div>

//           <div className="mb-3 text-sm text-slate-500">
//             Showing {filteredRows.length} of {rows.length} entries
//             {projectCodeFilter.trim()
//               ? ` for project code ${projectCodeFilter.trim()}`
//               : ""}
//             .
//           </div>

//           <div className="overflow-x-auto rounded-2xl border border-slate-200">
//             <table className="min-w-[980px] w-full text-sm">
//               <thead className="bg-slate-50">
//                 <tr className="border-b border-slate-200 text-slate-600">
//                   <th className="px-4 py-3 text-left font-semibold">Date</th>
//                   <th className="px-4 py-3 text-left font-semibold">
//                     Description
//                   </th>
//                   <th className="px-4 py-3 text-left font-semibold">PO No</th>
//                   <th className="px-4 py-3 text-left font-semibold">
//                     Project Code
//                   </th>
//                   <th className="px-4 py-3 text-right font-semibold">Debit</th>
//                   <th className="px-4 py-3 text-right font-semibold">Credit</th>
//                   <th className="px-4 py-3 text-right font-semibold">
//                     Balance
//                   </th>
//                   <th className="px-4 py-3 text-right font-semibold">Action</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {loading ? (
//                   <tr>
//                     <td
//                       colSpan={8}
//                       className="px-4 py-10 text-center text-slate-500"
//                     >
//                       Loading account statement...
//                     </td>
//                   </tr>
//                 ) : filteredRows.length > 0 ? (
//                   filteredRows.map((row) => (
//                     <tr
//                       key={row.id}
//                       className="border-b border-slate-100 last:border-0"
//                     >
//                       <td className="whitespace-nowrap px-4 py-3 text-slate-700">
//                         {formatDate(row.date)}
//                       </td>
//                       <td className="px-4 py-3 text-slate-900">
//                         <div className="font-medium">{row.description}</div>
//                         <div className="mt-1 text-xs capitalize text-slate-500">
//                           {row.source.replace(/_/g, " ")}
//                         </div>
//                       </td>
//                       <td className="whitespace-nowrap px-4 py-3 text-slate-700">
//                         {row.poNo || "-"}
//                       </td>
//                       <td className="whitespace-nowrap px-4 py-3 text-slate-700">
//                         {row.projectCode || "-"}
//                       </td>
//                       <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-900">
//                         {row.debit > 0
//                           ? `Rs ${formatCurrency(row.debit)}`
//                           : "-"}
//                       </td>
//                       <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-900">
//                         {row.credit > 0
//                           ? `Rs ${formatCurrency(row.credit)}`
//                           : "-"}
//                       </td>
//                       <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-950">
//                         Rs {formatCurrency(row.balance || 0)}
//                       </td>
//                       <td className="whitespace-nowrap px-4 py-3 text-right">
//                         {row.source === "manual" ? (
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             className="text-red-600 hover:text-red-700"
//                             onClick={() => deleteManualEntry(row)}
//                           >
//                             <Trash2 className="h-4 w-4" />
//                           </Button>
//                         ) : (
//                           <span className="text-slate-400">-</span>
//                         )}
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td
//                       colSpan={8}
//                       className="px-4 py-10 text-center text-slate-500"
//                     >
//                       No account statement entries found for the selected
//                       filters.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </CardContent>
//       </Card>

//       <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
//         <DialogContent className="max-w-2xl">
//           <DialogHeader>
//             <DialogTitle>Add Manual Statement Entry</DialogTitle>
//           </DialogHeader>

//           <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//             <div>
//               <Label>Date</Label>
//               <Input
//                 type="date"
//                 value={manualForm.date}
//                 onChange={(event) =>
//                   setManualForm((prev) => ({
//                     ...prev,
//                     date: event.target.value,
//                   }))
//                 }
//                 className="mt-2"
//               />
//             </div>

//             <div>
//               <Label>Project Code</Label>
//               <Input
//                 value={manualForm.projectCode}
//                 onChange={(event) =>
//                   setManualForm((prev) => ({
//                     ...prev,
//                     projectCode: event.target.value,
//                   }))
//                 }
//                 className="mt-2"
//                 placeholder="Enter project code"
//               />
//             </div>

//             <div>
//               <Label>PO No</Label>
//               <Input
//                 value={manualForm.poNo}
//                 onChange={(event) =>
//                   setManualForm((prev) => ({
//                     ...prev,
//                     poNo: event.target.value,
//                   }))
//                 }
//                 className="mt-2"
//                 placeholder="Enter PO No"
//               />
//             </div>

//             <div className="grid grid-cols-2 gap-3">
//               <div>
//                 <Label>Debit</Label>
//                 <Input
//                   type="number"
//                   value={manualForm.debit}
//                   onChange={(event) =>
//                     setManualForm((prev) => ({
//                       ...prev,
//                       debit: event.target.value,
//                       credit: event.target.value ? "" : prev.credit,
//                     }))
//                   }
//                   className="mt-2"
//                   placeholder="Outgoing"
//                 />
//               </div>

//               <div>
//                 <Label>Credit</Label>
//                 <Input
//                   type="number"
//                   value={manualForm.credit}
//                   onChange={(event) =>
//                     setManualForm((prev) => ({
//                       ...prev,
//                       credit: event.target.value,
//                       debit: event.target.value ? "" : prev.debit,
//                     }))
//                   }
//                   className="mt-2"
//                   placeholder="Incoming"
//                 />
//               </div>
//             </div>

//             <div className="md:col-span-2">
//               <Label>Description</Label>
//               <Textarea
//                 value={manualForm.description}
//                 onChange={(event) =>
//                   setManualForm((prev) => ({
//                     ...prev,
//                     description: event.target.value,
//                   }))
//                 }
//                 className="mt-2 min-h-24"
//                 placeholder="Enter description"
//               />
//             </div>
//           </div>

//           <div className="mt-5 flex justify-end gap-3">
//             <Button
//               variant="outline"
//               onClick={() => {
//                 setManualDialogOpen(false);
//                 setManualForm(emptyManualForm);
//               }}
//             >
//               Cancel
//             </Button>

//             <Button onClick={saveManualEntry} disabled={savingManual}>
//               {savingManual ? "Saving..." : "Save Entry"}
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }







import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Wallet,
} from "lucide-react";

const PANEL_ID = "IEDGE-SYSTEM";

type StatementSource =
  | "opening"
  | "invoice_payment"
  | "budget_request"
  | "reimbursement"
  | "record"
  | "manual";

type StatementRow = {
  id: string;
  source: StatementSource;
  date: string;
  dateValue: number;
  description: string;
  poNo: string;
  projectCode: string;
  chequeNumber?: string;
  debit: number;
  credit: number;
  balance?: number;
  manualDocId?: string;
};

type ManualEntryForm = {
  date: string;
  description: string;
  poNo: string;
  projectCode: string;
  debit: string;
  credit: string;
};

type OpeningBalance = {
  amount: number;
  date: string;
};

type ProjectCodeLookup = Map<string, string>;

const emptyManualForm: ManualEntryForm = {
  date: new Date().toISOString().slice(0, 10),
  description: "",
  poNo: "",
  projectCode: "",
  debit: "",
  credit: "",
};

const toNumber = (value: any) => {
  const parsed =
    typeof value === "number"
      ? value
      : Number(String(value ?? "").replace(/,/g, ""));

  return Number.isFinite(parsed) ? parsed : 0;
};

const toDateInputValue = (value: any) => {
  if (!value) return "";

  try {
    const date =
      value?.toDate && typeof value.toDate === "function"
        ? value.toDate()
        : value instanceof Date
          ? value
          : new Date(value);

    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  } catch {
    return "";
  }
};

const toDateValue = (value: any) => {
  if (!value) return 0;

  try {
    const date =
      value?.toDate && typeof value.toDate === "function"
        ? value.toDate()
        : value instanceof Date
          ? value
          : new Date(value);

    const time = date.getTime();
    return Number.isFinite(time) ? time : 0;
  } catch {
    return 0;
  }
};

const formatDate = (value: string) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const formatCurrency = (value: number) => {
  return toNumber(value).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const getFirstValue = (...values: any[]) => {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    if (typeof value === "object") continue;

    const text = String(value).trim();
    if (text) return text;
  }

  return "";
};

const normalizeLookupKey = (value: any) => {
  if (value === undefined || value === null || typeof value === "object")
    return "";
  return String(value).trim().toLowerCase();
};

const getProjectCodeValue = (source: any) =>
  getFirstValue(
    source?.projectCode,
    source?.project_code,
    source?.projectCodeNo,
    source?.projectNo,
    source?.projectNumber,
    source?.projectId,
    source?.project?.projectCode,
    source?.project?.project_code,
    source?.project?.code,
    source?.projectDetails?.projectCode,
    source?.projectDetails?.project_code,
    source?.selectedProject?.projectCode,
    source?.selectedProject?.project_code,
    source?.clientProject?.projectCode,
    source?.clientProject?.project_code,
    source?.record?.projectCode,
    source?.record?.project_code,
  );

const getPoNoValue = (source: any) =>
  getFirstValue(
    source?.poNo,
    source?.poNumber,
    source?.purchaseOrderNo,
    source?.purchaseOrderNumber,
    source?.purchaseOrder,
    source?.po,
    source?.invoiceNo,
    source?.requestNo,
    source?.requestId,
  );

const getChequeNumberValue = (source: any) =>
  getFirstValue(
    source?.reference,
    source?.Reference,
    source?.paymentReference,
    source?.paymentRef,
    source?.refNo,
    source?.referenceNo,
    source?.transactionReference,
    source?.chequeNumber,
    source?.chequeNo,
    source?.checkNumber,
    source?.checkNo,
    source?.bankChequeNumber,
    source?.paymentChequeNumber,
    source?.receivedChequeNumber,
    source?.paymentDetails?.reference,
    source?.paymentDetails?.Reference,
    source?.paymentDetails?.paymentReference,
    source?.paymentDetails?.paymentRef,
    source?.paymentDetails?.refNo,
    source?.paymentDetails?.referenceNo,
    source?.paymentDetails?.transactionReference,
    source?.paymentDetails?.chequeNumber,
    source?.paymentDetails?.chequeNo,
    source?.paymentDetails?.checkNumber,
    source?.paymentDetails?.checkNo,
    source?.accountDetails?.reference,
    source?.accountDetails?.Reference,
    source?.accountDetails?.paymentReference,
    source?.accountDetails?.paymentRef,
    source?.accountDetails?.refNo,
    source?.accountDetails?.referenceNo,
    source?.accountDetails?.transactionReference,
    source?.accountDetails?.chequeNumber,
    source?.accountDetails?.chequeNo,
    source?.accountDetails?.checkNumber,
    source?.accountDetails?.checkNo,
    source?.bankDetails?.reference,
    source?.bankDetails?.Reference,
    source?.bankDetails?.paymentReference,
    source?.bankDetails?.paymentRef,
    source?.bankDetails?.refNo,
    source?.bankDetails?.referenceNo,
    source?.bankDetails?.transactionReference,
    source?.bankDetails?.chequeNumber,
    source?.bankDetails?.chequeNo,
    source?.bankDetails?.checkNumber,
    source?.bankDetails?.checkNo,
    source?.receivePayment?.reference,
    source?.receivePayment?.Reference,
    source?.receivePayment?.paymentReference,
    source?.receivePayment?.paymentRef,
    source?.receivePayment?.refNo,
    source?.receivePayment?.referenceNo,
    source?.receivePayment?.transactionReference,
    source?.receivePayment?.chequeNumber,
    source?.receivePayment?.chequeNo,
    source?.receivePayment?.checkNumber,
    source?.receivePayment?.checkNo,
  );

const registerProjectCode = (
  lookup: ProjectCodeLookup,
  projectCode: any,
  ...keys: any[]
) => {
  const cleanProjectCode = getFirstValue(projectCode);
  if (!cleanProjectCode) return;

  keys.forEach((key) => {
    const cleanKey = normalizeLookupKey(key);
    if (!cleanKey) return;

    if (!lookup.has(cleanKey)) {
      lookup.set(cleanKey, cleanProjectCode);
    }
  });
};

const lookupProjectCode = (lookup: ProjectCodeLookup, ...keys: any[]) => {
  for (const key of keys) {
    const cleanKey = normalizeLookupKey(key);
    if (!cleanKey) continue;

    const found = lookup.get(cleanKey);
    if (found) return found;
  }

  return "";
};

const registerEntityProjectCode = (lookup: ProjectCodeLookup, entity: any) => {
  if (!entity) return;

  const projectCode = getProjectCodeValue(entity);
  if (!projectCode) return;

  registerProjectCode(
    lookup,
    projectCode,
    entity.id,
    entity.projectCode,
    entity.project_code,
    entity.projectCodeNo,
    entity.projectNo,
    entity.projectNumber,
    entity.projectId,
    entity.project,
    entity.projectName,
    entity.title,
    entity.subject,
    entity.client,
    entity.clientName,
    entity.customerName,
    entity.invoiceNo,
    entity.poNo,
    entity.poNumber,
    entity.purchaseOrderNo,
    entity.requestId,
    entity.recordId,
  );
};

const resolveProjectCode = (
  lookup: ProjectCodeLookup,
  directSource: any,
  secondarySource?: any,
  ...lookupKeys: any[]
) => {
  return getFirstValue(
    getProjectCodeValue(directSource),
    getProjectCodeValue(secondarySource),
    lookupProjectCode(lookup, ...lookupKeys),
  );
};

const getInvoiceProjectCode = (
  lookup: ProjectCodeLookup,
  payment: any,
  invoice: any,
) =>
  resolveProjectCode(
    lookup,
    payment,
    invoice,
    payment?.invoiceId,
    payment?.invoiceNo,
    payment?.poNo,
    payment?.poNumber,
    payment?.client,
    invoice?.id,
    invoice?.invoiceNo,
    invoice?.project,
    invoice?.projectName,
    invoice?.title,
    invoice?.subject,
    invoice?.client,
    invoice?.clientName,
  );

const getInvoicePoNo = (payment: any, invoice: any) =>
  getFirstValue(getPoNoValue(payment), getPoNoValue(invoice));

const getRequestProjectCode = (lookup: ProjectCodeLookup, request: any) =>
  resolveProjectCode(
    lookup,
    request,
    null,
    request?.id,
    request?.requestId,
    request?.project,
    request?.projectName,
    request?.title,
    request?.subject,
    request?.client,
    request?.clientName,
    request?.poNo,
    request?.poNumber,
  );

const getRequestPoNo = (request: any) => getPoNoValue(request);

const getReimbursementProjectCode = (
  lookup: ProjectCodeLookup,
  reimbursement: any,
  record: any,
  claim: any,
) =>
  resolveProjectCode(
    lookup,
    reimbursement || claim,
    record,
    reimbursement?.recordId,
    record?.id,
    record?.project,
    record?.projectName,
    record?.title,
    record?.subject,
    record?.client,
    record?.clientName,
    claim?.project,
    claim?.projectName,
    claim?.projectCode,
    claim?.title,
    claim?.subject,
    claim?.client,
    claim?.clientName,
  );

const getReimbursementPoNo = (reimbursement: any, record: any, claim: any) =>
  getFirstValue(
    getPoNoValue(reimbursement),
    getPoNoValue(record),
    getPoNoValue(claim),
  );

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
        </div>

        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AccountStatement() {
  const { currentUser, userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [savingOpening, setSavingOpening] = useState(false);
  const [savingManual, setSavingManual] = useState(false);

  const [openingBalance, setOpeningBalance] = useState<OpeningBalance>({
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
  });
  const [openingAmountInput, setOpeningAmountInput] = useState("0");
  const [openingDateInput, setOpeningDateInput] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const [rows, setRows] = useState<StatementRow[]>([]);
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [manualForm, setManualForm] =
    useState<ManualEntryForm>(emptyManualForm);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [projectCodeFilter, setProjectCodeFilter] = useState("");

  const loadStatement = async () => {
    setLoading(true);

    try {
      const projectCodeLookup: ProjectCodeLookup = new Map();

      const settingsRef = doc(
        db,
        "Panels",
        PANEL_ID,
        "accountStatementSettings",
        "main",
      );
      const settingsSnap = await getDoc(settingsRef);
      const settingsData = settingsSnap.exists() ? settingsSnap.data() : {};

      const savedOpening: OpeningBalance = {
        amount: toNumber(settingsData?.openingBalance),
        date:
          toDateInputValue(settingsData?.openingBalanceDate) ||
          String(settingsData?.openingBalanceDate || "") ||
          new Date().toISOString().slice(0, 10),
      };

      setOpeningBalance(savedOpening);
      setOpeningAmountInput(String(savedOpening.amount));
      setOpeningDateInput(savedOpening.date);

      const statementRows: StatementRow[] = [];

      statementRows.push({
        id: "opening-balance",
        source: "opening",
        date: savedOpening.date,
        dateValue: toDateValue(savedOpening.date),
        description: "Opening Balance",
        poNo: "",
        projectCode: "",
        debit: 0,
        credit: 0,
      });

      const invoiceMap = new Map<string, any>();
      const invoiceSnap = await getDocs(
        collection(db, "Panels", PANEL_ID, "estimateInvoices"),
      );

      invoiceSnap.forEach((invoiceDoc) => {
        const invoice = {
          id: invoiceDoc.id,
          ...invoiceDoc.data(),
        };

        invoiceMap.set(invoiceDoc.id, invoice);
        registerEntityProjectCode(projectCodeLookup, invoice);
      });

      const panelRecordsSnap = await getDocs(
        collection(db, "Panels", PANEL_ID, "salesRecords"),
      );

      let legacyRecordDocs: any[] = [];
      try {
        const legacyRecordsSnap = await getDocs(collection(db, "salesRecords"));
        legacyRecordDocs = legacyRecordsSnap.docs;
      } catch (error) {
        console.warn("Legacy salesRecords path not available:", error);
      }

      const recordMap = new Map<string, { id: string; data: any }>();

      panelRecordsSnap.docs.forEach((recordDoc) => {
        const recordData = recordDoc.data();
        recordMap.set(recordDoc.id, {
          id: recordDoc.id,
          data: recordData,
        });
        registerEntityProjectCode(projectCodeLookup, {
          id: recordDoc.id,
          ...recordData,
        });
      });

      legacyRecordDocs.forEach((recordDoc) => {
        const recordData = recordDoc.data();

        if (!recordMap.has(recordDoc.id)) {
          recordMap.set(recordDoc.id, {
            id: recordDoc.id,
            data: recordData,
          });
        }

        registerEntityProjectCode(projectCodeLookup, {
          id: recordDoc.id,
          ...recordData,
        });
      });

      try {
        const projectSnap = await getDocs(
          collection(db, "Panels", PANEL_ID, "projects"),
        );
        projectSnap.docs.forEach((projectDoc) => {
          registerEntityProjectCode(projectCodeLookup, {
            id: projectDoc.id,
            ...projectDoc.data(),
          });
        });
      } catch (error) {
        console.warn(
          "Projects path not available for project code lookup:",
          error,
        );
      }

      try {
        const clientProjectSnap = await getDocs(
          collection(db, "Panels", PANEL_ID, "clientProjects"),
        );
        clientProjectSnap.docs.forEach((projectDoc) => {
          registerEntityProjectCode(projectCodeLookup, {
            id: projectDoc.id,
            ...projectDoc.data(),
          });
        });
      } catch (error) {
        console.warn(
          "Client projects path not available for project code lookup:",
          error,
        );
      }

      const paymentsSnap = await getDocs(
        collection(db, "Panels", PANEL_ID, "payments"),
      );

      paymentsSnap.forEach((paymentDoc) => {
        const payment: any = paymentDoc.data();
        const invoice = payment.invoiceId
          ? invoiceMap.get(payment.invoiceId)
          : null;
        const amount = toNumber(payment.amount);
        const taxDebitAmount = toNumber(payment.whtAmount) + toNumber(payment.sstAmount);

        if (amount <= 0) return;

        const projectCode = getInvoiceProjectCode(
          projectCodeLookup,
          payment,
          invoice,
        );

        const chequeNumber = getFirstValue(
          getChequeNumberValue(payment),
          getChequeNumberValue(invoice),
        );

        statementRows.push({
          id: `invoice-payment-${paymentDoc.id}`,
          source: "invoice_payment",
          date:
            toDateInputValue(payment.paymentDate) ||
            toDateInputValue(payment.createdAt) ||
            "",
          dateValue: toDateValue(payment.paymentDate || payment.createdAt),
          description: `Invoice payment received${
            payment.invoiceNo ? ` - ${payment.invoiceNo}` : ""
          }${payment.client ? ` - ${payment.client}` : ""}`,
          poNo: getInvoicePoNo(payment, invoice),
          projectCode,
          chequeNumber,
          debit: taxDebitAmount,
          credit: amount,
        });
      });

      const budgetSnap = await getDocs(
        collection(db, "Panels", PANEL_ID, "invoiceRequests"),
      );

      budgetSnap.forEach((requestDoc) => {
        const request: any = { id: requestDoc.id, ...requestDoc.data() };
        registerEntityProjectCode(projectCodeLookup, request);

        const paymentDetails = request.paymentDetails || {};
        const status = String(request.status || "").toLowerCase();
        const isReleased =
          status === "payment_released" ||
          status === "released" ||
          !!paymentDetails.releasedAt ||
          !!paymentDetails.amount;

        if (!isReleased) return;

        const amount = toNumber(
          paymentDetails.amount ||
            request.releasedAmount ||
            request.totalAmount,
        );
        if (amount <= 0) return;

        const vendors = Array.isArray(paymentDetails.vendors)
          ? paymentDetails.vendors.join(", ")
          : paymentDetails.vendor || "";

        const subject = getFirstValue(
          request.subject,
          request.title,
          request.project,
          vendors,
        );
        const projectCode = getRequestProjectCode(projectCodeLookup, request);

        statementRows.push({
          id: `budget-request-${requestDoc.id}`,
          source: "budget_request",
          date:
            toDateInputValue(paymentDetails.releasedAt) ||
            toDateInputValue(request.updatedAt) ||
            toDateInputValue(request.submittedAt) ||
            "",
          dateValue: toDateValue(
            paymentDetails.releasedAt ||
              request.updatedAt ||
              request.submittedAt,
          ),
          description: `Budget request payment released${subject ? ` - ${subject}` : ""}`,
          poNo: getRequestPoNo(request),
          projectCode,
          debit: amount,
          credit: 0,
        });
      });

      const claimSnap = await getDocs(
        collection(db, "Panels", PANEL_ID, "claimReimbursements"),
      );

      claimSnap.forEach((claimDoc) => {
        const claim: any = { id: claimDoc.id, ...claimDoc.data() };
        registerEntityProjectCode(projectCodeLookup, claim);

        const paymentStatus = String(claim.paymentStatus || "").toLowerCase();

        if (paymentStatus !== "paid") return;

        const amount = toNumber(
          claim.paidAmount ||
            claim.approvedAmount ||
            claim.claimAmount ||
            claim.amount,
        );

        if (amount <= 0) return;

        const projectCode = getReimbursementProjectCode(
          projectCodeLookup,
          null,
          null,
          claim,
        );

        statementRows.push({
          id: `claim-reimbursement-${claimDoc.id}`,
          source: "reimbursement",
          date:
            toDateInputValue(claim.paymentReleasedAt) ||
            toDateInputValue(claim.updatedAt) ||
            toDateInputValue(claim.submittedAt) ||
            "",
          dateValue: toDateValue(
            claim.paymentReleasedAt || claim.updatedAt || claim.submittedAt,
          ),
          description: `Reimbursement released - ${
            claim.description || claim.foodItem || claim.claimType || "Claim"
          }${claim.submittedByName ? ` - ${claim.submittedByName}` : ""}`,
          poNo: getReimbursementPoNo(null, null, claim),
          projectCode,
          debit: amount,
          credit: 0,
        });
      });

      await Promise.all(
        Array.from(recordMap.values()).map(async (record) => {
          const meetingDocs: Array<{
            meetingDoc: any;
            sourcePath: "panel" | "root";
          }> = [];

          try {
            const panelMeetingSnap = await getDocs(
              collection(
                db,
                "Panels",
                PANEL_ID,
                "salesRecords",
                record.id,
                "meetingUpdates",
              ),
            );

            panelMeetingSnap.docs.forEach((meetingDoc) => {
              meetingDocs.push({ meetingDoc, sourcePath: "panel" });
            });
          } catch (error) {
            console.warn("Panel meetingUpdates path not available:", error);
          }

          try {
            const rootMeetingSnap = await getDocs(
              collection(db, "salesRecords", record.id, "meetingUpdates"),
            );

            rootMeetingSnap.docs.forEach((meetingDoc) => {
              meetingDocs.push({ meetingDoc, sourcePath: "root" });
            });
          } catch (error) {
            console.warn("Legacy meetingUpdates path not available:", error);
          }

          meetingDocs.forEach(({ meetingDoc, sourcePath }) => {
            const meeting: any = meetingDoc.data();
            const reimbursement = meeting?.reimbursement;

            if (!reimbursement?.enabled) return;
            if (
              String(reimbursement.paymentStatus || "").toLowerCase() !== "paid"
            )
              return;

            const amount = toNumber(
              reimbursement.paidAmount ||
                reimbursement.approvedAmount ||
                reimbursement.amount,
            );

            if (amount <= 0) return;

            const projectCode = getReimbursementProjectCode(
              projectCodeLookup,
              { ...reimbursement, recordId: record.id },
              { id: record.id, ...record.data },
              null,
            );

            statementRows.push({
              id: `meeting-reimbursement-${sourcePath}-${record.id}-${meetingDoc.id}`,
              source: "reimbursement",
              date:
                toDateInputValue(reimbursement.paymentReleasedAt) ||
                toDateInputValue(reimbursement.updatedAt) ||
                toDateInputValue(meeting.updatedAt) ||
                toDateInputValue(meeting.submittedAt) ||
                "",
              dateValue: toDateValue(
                reimbursement.paymentReleasedAt ||
                  reimbursement.updatedAt ||
                  meeting.updatedAt ||
                  meeting.submittedAt,
              ),
              description: `Reimbursement released - ${
                reimbursement.detail ||
                reimbursement.description ||
                record.data?.projectName ||
                "Claim"
              }${meeting.personName ? ` - ${meeting.personName}` : ""}`,
              poNo: getReimbursementPoNo(reimbursement, record.data, null),
              projectCode,
              debit: amount,
              credit: 0,
            });
          });
        }),
      );

      const chequeRecordSnap = await getDocs(
        collection(db, "Panels", PANEL_ID, "Record"),
      );

      chequeRecordSnap.forEach((recordDoc) => {
        const record: any = { id: recordDoc.id, ...recordDoc.data() };
        registerEntityProjectCode(projectCodeLookup, record);

        const chequeAmount = toNumber(record.chequeAmount);

        if (chequeAmount <= 0) return;

        const chequeNumber = getChequeNumberValue(record);

        const accountText = getFirstValue(
          record.accountTitle,
          record.bank,
          record.accountNo,
          record.platform,
        );

        const projectCode = resolveProjectCode(
          projectCodeLookup,
          record,
          null,
          record.projectCode,
          record.project,
          record.projectName,
          record.accountTitle,
          record.accountNo,
          record.bank,
          chequeNumber,
        );

        statementRows.push({
          id: `record-cheque-${recordDoc.id}`,
          source: "record",
          date:
            toDateInputValue(record.createdAt) ||
            toDateInputValue(record.updatedAt) ||
            "",
          dateValue: toDateValue(record.createdAt || record.updatedAt),
          description: `Record cheque amount${
            accountText ? ` - ${accountText}` : ""
          }`,
          poNo: getPoNoValue(record),
          projectCode,
          chequeNumber,
          debit: chequeAmount,
          credit: 0,
        });
      });

      const manualSnap = await getDocs(
        collection(db, "Panels", PANEL_ID, "accountStatementManualEntries"),
      );

      manualSnap.forEach((manualDoc) => {
        const manual: any = manualDoc.data();
        const debit = toNumber(manual.debit);
        const credit = toNumber(manual.credit);

        if (debit <= 0 && credit <= 0) return;

        const projectCode = resolveProjectCode(
          projectCodeLookup,
          manual,
          null,
          manual.projectCode,
          manual.project,
          manual.projectName,
          manual.poNo,
          manual.description,
        );

        statementRows.push({
          id: `manual-${manualDoc.id}`,
          source: "manual",
          manualDocId: manualDoc.id,
          date: toDateInputValue(manual.date) || String(manual.date || ""),
          dateValue: toDateValue(manual.date || manual.createdAt),
          description: manual.description || "Manual entry",
          poNo: manual.poNo || "",
          projectCode,
          debit,
          credit,
        });
      });

      statementRows.sort((a, b) => {
        if (a.source === "opening") return -1;
        if (b.source === "opening") return 1;
        return (
          a.dateValue - b.dateValue ||
          a.description.localeCompare(b.description)
        );
      });

      let runningBalance = savedOpening.amount;
      const balancedRows = statementRows.map((row) => {
        if (row.source === "opening") {
          return { ...row, balance: savedOpening.amount };
        }

        runningBalance += toNumber(row.credit) - toNumber(row.debit);
        return { ...row, balance: runningBalance };
      });

      setRows(balancedRows);
    } catch (error) {
      console.error("Failed to load account statement:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatement();
  }, []);

  useEffect(() => {
    const unsubscribers = [
      onSnapshot(collection(db, "Panels", PANEL_ID, "payments"), loadStatement),
      onSnapshot(
        collection(db, "Panels", PANEL_ID, "invoiceRequests"),
        loadStatement,
      ),
      onSnapshot(
        collection(db, "Panels", PANEL_ID, "claimReimbursements"),
        loadStatement,
      ),
      onSnapshot(collection(db, "Panels", PANEL_ID, "Record"), loadStatement),
      onSnapshot(
        collection(db, "Panels", PANEL_ID, "accountStatementManualEntries"),
        loadStatement,
      ),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  const projectCodeOptions = useMemo(() => {
    return Array.from(
      new Set(
        rows
          .map((row) => row.projectCode)
          .filter((projectCode) => projectCode && projectCode.trim()),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const hasActiveFilters = Boolean(
    search.trim() || dateFrom || dateTo || projectCodeFilter.trim(),
  );

  const filteredRows = useMemo(() => {
    const queryText = search.trim().toLowerCase();
    const projectCodeQuery = projectCodeFilter.trim().toLowerCase();
    const fromTime = dateFrom
      ? new Date(`${dateFrom}T00:00:00`).getTime()
      : null;
    const toTime = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;

    return rows.filter((row) => {
      const rowDate = row.dateValue || toDateValue(row.date);

      if (fromTime !== null && rowDate && rowDate < fromTime) return false;
      if (toTime !== null && rowDate && rowDate > toTime) return false;

      if (projectCodeQuery) {
        const rowProjectCode = row.projectCode.trim().toLowerCase();
        if (!rowProjectCode.includes(projectCodeQuery)) return false;
      }

      if (!queryText) return true;

      return (
        row.description.toLowerCase().includes(queryText) ||
        row.poNo.toLowerCase().includes(queryText) ||
        row.projectCode.toLowerCase().includes(queryText) ||
        (row.chequeNumber || "").toLowerCase().includes(queryText) ||
        row.source.toLowerCase().includes(queryText) ||
        row.date.toLowerCase().includes(queryText)
      );
    });
  }, [rows, search, dateFrom, dateTo, projectCodeFilter]);

  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        if (row.source !== "opening") {
          acc.debit += toNumber(row.debit);
          acc.credit += toNumber(row.credit);
        }

        acc.balance = row.balance ?? acc.balance;
        return acc;
      },
      { debit: 0, credit: 0, balance: openingBalance.amount },
    );
  }, [filteredRows, openingBalance.amount]);

  const resetFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setProjectCodeFilter("");
  };

  const saveOpeningBalance = async () => {
    try {
      setSavingOpening(true);

      const amount = toNumber(openingAmountInput);
      const date = openingDateInput || new Date().toISOString().slice(0, 10);

      await setDoc(
        doc(db, "Panels", PANEL_ID, "accountStatementSettings", "main"),
        {
          openingBalance: amount,
          openingBalanceDate: date,
          updatedAt: serverTimestamp(),
          updatedBy:
            userProfile?.displayName || currentUser?.email || "Unknown",
          updatedById: currentUser?.uid || "",
        },
        { merge: true },
      );

      setOpeningBalance({ amount, date });
      await loadStatement();
    } catch (error) {
      console.error("Failed to save opening balance:", error);
      alert("Failed to save opening balance.");
    } finally {
      setSavingOpening(false);
    }
  };

  const saveManualEntry = async () => {
    const debit = toNumber(manualForm.debit);
    const credit = toNumber(manualForm.credit);

    if (!manualForm.date) {
      alert("Please select date.");
      return;
    }

    if (!manualForm.description.trim()) {
      alert("Please enter description.");
      return;
    }

    if (debit <= 0 && credit <= 0) {
      alert("Please enter debit or credit amount.");
      return;
    }

    if (debit > 0 && credit > 0) {
      alert("Please enter either debit or credit, not both.");
      return;
    }

    try {
      setSavingManual(true);

      await addDoc(
        collection(db, "Panels", PANEL_ID, "accountStatementManualEntries"),
        {
          date: manualForm.date,
          description: manualForm.description.trim(),
          poNo: manualForm.poNo.trim(),
          projectCode: manualForm.projectCode.trim(),
          debit,
          credit,
          entryType: credit > 0 ? "credit" : "debit",
          createdAt: serverTimestamp(),
          createdBy:
            userProfile?.displayName || currentUser?.email || "Unknown",
          createdById: currentUser?.uid || "",
        },
      );

      setManualForm(emptyManualForm);
      setManualDialogOpen(false);
      await loadStatement();
    } catch (error) {
      console.error("Failed to save manual entry:", error);
      alert("Failed to save manual entry.");
    } finally {
      setSavingManual(false);
    }
  };

  const deleteManualEntry = async (row: StatementRow) => {
    if (!row.manualDocId) return;

    const confirmed = window.confirm(
      "Delete this manual account statement entry?",
    );
    if (!confirmed) return;

    try {
      await deleteDoc(
        doc(
          db,
          "Panels",
          PANEL_ID,
          "accountStatementManualEntries",
          row.manualDocId,
        ),
      );
      await loadStatement();
    } catch (error) {
      console.error("Failed to delete manual entry:", error);
      alert("Failed to delete manual entry.");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Account Statement
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track opening balance, received invoice payments, record cheque amounts,
            released expenses, reimbursements, and manual entries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={loadStatement} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>

          <Button onClick={() => setManualDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Manual Entry
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          title={hasActiveFilters ? "Filtered Debit" : "Total Debit"}
          value={`Rs ${formatCurrency(totals.debit)}`}
          icon={<ArrowDownCircle className="h-5 w-5" />}
        />
        <StatCard
          title={hasActiveFilters ? "Filtered Credit" : "Total Credit"}
          value={`Rs ${formatCurrency(totals.credit)}`}
          icon={<ArrowUpCircle className="h-5 w-5" />}
        />
        <StatCard
          title={hasActiveFilters ? "Filtered Balance" : "Current Balance"}
          value={`Rs ${formatCurrency(totals.balance)}`}
          icon={<Wallet className="h-5 w-5" />}
        />
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-950">
              Opening Balance
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              This value is saved in Firebase and used as the first balance in
              the statement.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[180px_1fr_auto] md:items-end">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={openingDateInput}
                onChange={(event) => setOpeningDateInput(event.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Opening Balance Amount</Label>
              <Input
                type="number"
                value={openingAmountInput}
                onChange={(event) => setOpeningAmountInput(event.target.value)}
                className="mt-2"
                placeholder="Enter opening balance"
              />
            </div>

            <Button
              onClick={saveOpeningBalance}
              disabled={savingOpening}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {savingOpening ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Statement Entries
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Credit comes from received payments and manual incoming entries.
                Debit comes from record cheque amounts, released budget
                requests, released reimbursements, and manual outgoing entries.
              </p>
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search statement"
                className="pl-9"
              />
            </div>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
            <div>
              <Label>Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="mt-2 bg-white"
              />
            </div>

            <div>
              <Label>Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="mt-2 bg-white"
              />
            </div>

            <div>
              <Label>Project Code</Label>
              <Input
                list="account-statement-project-codes"
                value={projectCodeFilter}
                onChange={(event) => setProjectCodeFilter(event.target.value)}
                className="mt-2 bg-white"
                placeholder="Filter by project code"
              />
              <datalist id="account-statement-project-codes">
                {projectCodeOptions.map((projectCode) => (
                  <option key={projectCode} value={projectCode} />
                ))}
              </datalist>
            </div>

            <Button
              variant="outline"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="gap-2 bg-white"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Filters
            </Button>
          </div>

          <div className="mb-3 text-sm text-slate-500">
            Showing {filteredRows.length} of {rows.length} entries
            {projectCodeFilter.trim()
              ? ` for project code ${projectCodeFilter.trim()}`
              : ""}
            .
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-[1120px] w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">PO No</th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Project Code
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Cheque Number
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">Debit</th>
                  <th className="px-4 py-3 text-right font-semibold">Credit</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Balance
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Loading account statement...
                    </td>
                  </tr>
                ) : filteredRows.length > 0 ? (
                  filteredRows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {formatDate(row.date)}
                      </td>
                      <td className="px-4 py-3 text-slate-900">
                        <div className="font-medium">{row.description}</div>
                        <div className="mt-1 text-xs capitalize text-slate-500">
                          {row.source.replace(/_/g, " ")}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {row.poNo || "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {row.projectCode || "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {row.chequeNumber || "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-900">
                        {row.debit > 0
                          ? `Rs ${formatCurrency(row.debit)}`
                          : "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-900">
                        {row.credit > 0
                          ? `Rs ${formatCurrency(row.credit)}`
                          : "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-950">
                        Rs {formatCurrency(row.balance || 0)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {row.source === "manual" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => deleteManualEntry(row)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      No account statement entries found for the selected
                      filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Manual Statement Entry</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={manualForm.date}
                onChange={(event) =>
                  setManualForm((prev) => ({
                    ...prev,
                    date: event.target.value,
                  }))
                }
                className="mt-2"
              />
            </div>

            <div>
              <Label>Project Code</Label>
              <Input
                value={manualForm.projectCode}
                onChange={(event) =>
                  setManualForm((prev) => ({
                    ...prev,
                    projectCode: event.target.value,
                  }))
                }
                className="mt-2"
                placeholder="Enter project code"
              />
            </div>

            <div>
              <Label>PO No</Label>
              <Input
                value={manualForm.poNo}
                onChange={(event) =>
                  setManualForm((prev) => ({
                    ...prev,
                    poNo: event.target.value,
                  }))
                }
                className="mt-2"
                placeholder="Enter PO No"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Debit</Label>
                <Input
                  type="number"
                  value={manualForm.debit}
                  onChange={(event) =>
                    setManualForm((prev) => ({
                      ...prev,
                      debit: event.target.value,
                      credit: event.target.value ? "" : prev.credit,
                    }))
                  }
                  className="mt-2"
                  placeholder="Outgoing"
                />
              </div>

              <div>
                <Label>Credit</Label>
                <Input
                  type="number"
                  value={manualForm.credit}
                  onChange={(event) =>
                    setManualForm((prev) => ({
                      ...prev,
                      credit: event.target.value,
                      debit: event.target.value ? "" : prev.debit,
                    }))
                  }
                  className="mt-2"
                  placeholder="Incoming"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={manualForm.description}
                onChange={(event) =>
                  setManualForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                className="mt-2 min-h-24"
                placeholder="Enter description"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setManualDialogOpen(false);
                setManualForm(emptyManualForm);
              }}
            >
              Cancel
            </Button>

            <Button onClick={saveManualEntry} disabled={savingManual}>
              {savingManual ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
