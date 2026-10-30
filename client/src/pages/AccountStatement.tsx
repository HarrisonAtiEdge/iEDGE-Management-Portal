// import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
// import {
//   addDoc,
//   collection,
//   deleteDoc,
//   doc,
//   getDocs,
//   serverTimestamp,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { useAuth } from "@/contexts/AuthContext";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   fetchPaymentAccounts,
//   paymentAccountPickerName,
// } from "@/lib/payments/paymentAccounts";
// import type { PaymentAccount } from "@/lib/payments/types";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import {
//   ArrowDownCircle,
//   ArrowUpCircle,
//   CalendarDays,
//   Download,
//   Plus,
//   RefreshCw,
//   RotateCcw,
//   Search,
//   Trash2,
//   Wallet,
// } from "lucide-react";

// const PANEL_ID = "IEDGE-SYSTEM";

// type StatementSource =
//   | "opening"
//   | "invoice_payment"
//   | "budget_request"
//   | "purchase_order"
//   | "reimbursement"
//   | "record"
//   | "manual"
//   | "account_transfer";

// type StatementRow = {
//   id: string;
//   source: StatementSource;
//   accountId?: string;
//   date: string;
//   dateValue: number;
//   description: string;
//   poNo: string;
//   projectCode: string;
//   chequeNumber?: string;
//   debit: number;
//   credit: number;
//   balance?: number;
//   sequenceValue?: number;
//   manualDocId?: string;
//   // Dated before its account's opening balance date (already included in
//   // the opening balance); only shown when a date filter is used.
//   beforeOpening?: boolean;
// };

// type ManualEntryForm = {
//   date: string;
//   description: string;
//   poNo: string;
//   projectCode: string;
//   debit: string;
//   credit: string;
//   accountId: string;
// };

// type OpeningBalance = {
//   amount: number;
//   date: string;
// };

// type ProjectCodeLookup = Map<string, string>;

// type ExportOrder = "ascending" | "descending";

// const emptyManualForm: ManualEntryForm = {
//   date: new Date().toISOString().slice(0, 10),
//   description: "",
//   poNo: "",
//   projectCode: "",
//   debit: "",
//   credit: "",
//   accountId: "",
// };

// const ALL_ACCOUNTS = "all";
// const NO_ACCOUNT = "none";

// const getAccountLabel = (account?: PaymentAccount | null) =>
//   account?.accountName || account?.bankName || "Unnamed Account";

// const getAccountOptionLabel = (account: PaymentAccount) => {
//   const number = String(account.accountNumber || "").trim();
//   const details = [account.bankName, number ? `••${number.slice(-4)}` : ""]
//     .filter(Boolean)
//     .join(" ");

//   return `${paymentAccountPickerName(account)}${details ? ` - ${details}` : ""}${
//     account.isActive === false ? " (inactive)" : ""
//   }`;
// };

// const normalizeAccountNumber = (value: any) =>
//   String(value ?? "")
//     .replace(/[^a-z0-9]/gi, "")
//     .toUpperCase();

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

// const getRowSequenceValue = (row: StatementRow) =>
//   row.sequenceValue || row.dateValue || toDateValue(row.date);

// const compareRowsBySequence = (
//   a: StatementRow,
//   b: StatementRow,
//   order: ExportOrder,
// ) => {
//   // The opening balance sits after transactions from before it and ahead of
//   // everything else.
//   if (a.source === "opening" && b.source !== "opening") {
//     const openingFirst = !b.beforeOpening;
//     return (order === "ascending") === openingFirst ? -1 : 1;
//   }

//   if (b.source === "opening" && a.source !== "opening") {
//     const openingFirst = !a.beforeOpening;
//     return (order === "ascending") === openingFirst ? 1 : -1;
//   }

//   if (Boolean(a.beforeOpening) !== Boolean(b.beforeOpening)) {
//     const beforeFirst = a.beforeOpening ? -1 : 1;
//     return order === "ascending" ? beforeFirst : -beforeFirst;
//   }

//   const sequenceDiff = getRowSequenceValue(a) - getRowSequenceValue(b);
//   if (sequenceDiff !== 0) {
//     return order === "ascending" ? sequenceDiff : -sequenceDiff;
//   }

//   const dateDiff = a.dateValue - b.dateValue;
//   if (dateDiff !== 0) {
//     return order === "ascending" ? dateDiff : -dateDiff;
//   }

//   const descriptionDiff = a.description.localeCompare(b.description);
//   return order === "ascending" ? descriptionDiff : -descriptionDiff;
// };

// const escapeCsvValue = (value: any) => {
//   const text = String(value ?? "");

//   if (/[",\n\r]/.test(text)) {
//     return `"${text.replace(/"/g, '""')}"`;
//   }

//   return text;
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

// const getChequeNumberValue = (source: any) =>
//   getFirstValue(
//     source?.reference,
//     source?.Reference,
//     source?.paymentReference,
//     source?.paymentRef,
//     source?.refNo,
//     source?.referenceNo,
//     source?.transactionReference,
//     source?.chequeNumber,
//     source?.chequeNo,
//     source?.checkNumber,
//     source?.checkNo,
//     source?.bankChequeNumber,
//     source?.paymentChequeNumber,
//     source?.receivedChequeNumber,
//     source?.paymentDetails?.reference,
//     source?.paymentDetails?.Reference,
//     source?.paymentDetails?.paymentReference,
//     source?.paymentDetails?.paymentRef,
//     source?.paymentDetails?.refNo,
//     source?.paymentDetails?.referenceNo,
//     source?.paymentDetails?.transactionReference,
//     source?.paymentDetails?.chequeNumber,
//     source?.paymentDetails?.chequeNo,
//     source?.paymentDetails?.checkNumber,
//     source?.paymentDetails?.checkNo,
//     source?.accountDetails?.reference,
//     source?.accountDetails?.Reference,
//     source?.accountDetails?.paymentReference,
//     source?.accountDetails?.paymentRef,
//     source?.accountDetails?.refNo,
//     source?.accountDetails?.referenceNo,
//     source?.accountDetails?.transactionReference,
//     source?.accountDetails?.chequeNumber,
//     source?.accountDetails?.chequeNo,
//     source?.accountDetails?.checkNumber,
//     source?.accountDetails?.checkNo,
//     source?.bankDetails?.reference,
//     source?.bankDetails?.Reference,
//     source?.bankDetails?.paymentReference,
//     source?.bankDetails?.paymentRef,
//     source?.bankDetails?.refNo,
//     source?.bankDetails?.referenceNo,
//     source?.bankDetails?.transactionReference,
//     source?.bankDetails?.chequeNumber,
//     source?.bankDetails?.chequeNo,
//     source?.bankDetails?.checkNumber,
//     source?.bankDetails?.checkNo,
//     source?.receivePayment?.reference,
//     source?.receivePayment?.Reference,
//     source?.receivePayment?.paymentReference,
//     source?.receivePayment?.paymentRef,
//     source?.receivePayment?.refNo,
//     source?.receivePayment?.referenceNo,
//     source?.receivePayment?.transactionReference,
//     source?.receivePayment?.chequeNumber,
//     source?.receivePayment?.chequeNo,
//     source?.receivePayment?.checkNumber,
//     source?.receivePayment?.checkNo,
//   );

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

// const uniqueStringList = (values: string[]) => {
//   const seen = new Set<string>();

//   return values.filter((value) => {
//     const key = value.trim().toLowerCase();
//     if (!key || seen.has(key)) return false;
//     seen.add(key);
//     return true;
//   });
// };

// const getReleaseChequeNumbers = (...sources: any[]) => {
//   return uniqueStringList(
//     sources.flatMap((source) => {
//       if (!source) return [];

//       return [
//         ...getStringListFromValue(source?.chequeNumber),
//         ...getStringListFromValue(source?.chequeNumbers),
//         ...getStringListFromValue(source?.chequeNo),
//         ...getStringListFromValue(source?.checkNumber),
//         ...getStringListFromValue(source?.checkNo),
//         ...getStringListFromValue(source?.bankChequeNumber),
//         ...getStringListFromValue(source?.paymentChequeNumber),
//         ...getStringListFromValue(source?.receivedChequeNumber),
//         ...getStringListFromValue(source?.paymentDetails?.chequeNumber),
//         ...getStringListFromValue(source?.paymentDetails?.chequeNumbers),
//         ...getStringListFromValue(source?.paymentDetails?.chequeNo),
//         ...getStringListFromValue(source?.paymentDetails?.checkNumber),
//         ...getStringListFromValue(source?.latestPaymentRelease?.chequeNumber),
//         ...getStringListFromValue(source?.latestPaymentRelease?.chequeNumbers),
//         ...getStringListFromValue(source?.latestPaymentRelease?.chequeNo),
//         ...getStringListFromValue(source?.latestPaymentRelease?.checkNumber),
//       ];
//     }),
//   );
// };

// const getPaymentReleaseAmount = (entry: any) =>
//   toNumber(
//     entry?.amount ??
//       entry?.releaseAmount ??
//       entry?.releasedAmount ??
//       entry?.paymentAmount ??
//       0,
//   );

// const getPaymentReleaseHistory = (source: any) => {
//   const history = Array.isArray(source?.paymentReleaseHistory)
//     ? source.paymentReleaseHistory
//     : [];

//   if (history.length > 0) {
//     return history.filter((entry: any) => getPaymentReleaseAmount(entry) > 0);
//   }

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
// };

// const getReleaseTransactionTitle = (
//   paymentDetails: any,
//   request: any,
//   fallbackSubject: string,
// ) =>
//   getFirstValue(
//     paymentDetails?.transactionName,
//     paymentDetails?.title,
//     paymentDetails?.transactionTitle,
//     request?.latestTransactionName,
//     request?.transactionName,
//     fallbackSubject,
//     "Budget request payment released",
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
//   subtitle,
// }: {
//   title: string;
//   value: string;
//   icon: ReactNode;
//   subtitle?: string;
// }) {
//   return (
//     <Card className="border-slate-200 shadow-sm">
//       <CardContent className="flex items-center justify-between p-5">
//         <div>
//           <p className="text-sm text-slate-500">{title}</p>
//           <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
//           {subtitle && (
//             <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
//           )}
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
//   const [savingManual, setSavingManual] = useState(false);

//   const [rows, setRows] = useState<StatementRow[]>([]);
//   const [manualDialogOpen, setManualDialogOpen] = useState(false);
//   const [manualForm, setManualForm] =
//     useState<ManualEntryForm>(emptyManualForm);
//   const [search, setSearch] = useState("");
//   const [dateFrom, setDateFrom] = useState("");
//   const [dateTo, setDateTo] = useState("");
//   const [projectCodeFilter, setProjectCodeFilter] = useState("");
//   const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
//   // null until the user picks an account: the statement then shows the
//   // default account (the first one added).
//   const [accountFilter, setAccountFilter] = useState<string | null>(null);
//   const [pageOrder, setPageOrder] = useState<ExportOrder>("descending");
//   const [exportDialogOpen, setExportDialogOpen] = useState(false);

//   // Incremental row reveal: rendering thousands of <tr> at once is what was
//   // making this page slow, not the data fetch itself (that part still loads
//   // everything up front — this table is a merged view across 10 collections
//   // that doesn't cleanly support cursor pagination). So instead we keep all
//   // the data in memory but only mount a batch of rows into the DOM, growing
//   // the batch as the user scrolls. Filters and export both operate on the
//   // full filtered set regardless of how much has been revealed.
//   const INITIAL_VISIBLE_ROWS = 40;
//   const LOAD_MORE_BATCH = 40;
//   const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_ROWS);
//   const [isLoadingMore, setIsLoadingMore] = useState(false);
//   const loadMoreSentinelRef = useRef<HTMLTableRowElement | null>(null);

//   const loadStatement = async (silent = false) => {
//     if (!silent) setLoading(true);

//     try {
//       const projectCodeLookup: ProjectCodeLookup = new Map();

//       // Accounts from the Accounts tab. Record cheques are saved against the
//       // older cheque/online account collections, so those are matched back
//       // to these by account number / IBAN instead of by id.
//       let paymentAccounts: PaymentAccount[] = [];
//       try {
//         paymentAccounts = await fetchPaymentAccounts();
//       } catch (error) {
//         console.warn("Payment accounts not available:", error);
//       }
//       setAccounts(paymentAccounts);

//       const paymentAccountIds = new Set(paymentAccounts.map((a) => a.id));
//       const accountIdByNumber = new Map<string, string>();
//       paymentAccounts.forEach((account) => {
//         [account.accountNumber, account.iban].forEach((number) => {
//           const key = normalizeAccountNumber(number);
//           if (key && !accountIdByNumber.has(key)) {
//             accountIdByNumber.set(key, account.id);
//           }
//         });
//       });

//       const resolveAccountId = (...candidates: any[]) => {
//         for (const candidate of candidates) {
//           const id = getFirstValue(candidate);
//           if (id && paymentAccountIds.has(id)) return id;
//         }
//         return "";
//       };

//       const resolveAccountIdByNumber = (...numbers: any[]) => {
//         for (const number of numbers) {
//           const key = normalizeAccountNumber(number);
//           if (!key) continue;

//           const exact = accountIdByNumber.get(key);
//           if (exact) return exact;

//           // Account number entered on its own vs. the full IBAN that ends with it.
//           if (key.length >= 6) {
//             for (const [savedKey, id] of Array.from(accountIdByNumber)) {
//               if (savedKey.endsWith(key) || key.endsWith(savedKey)) return id;
//             }
//           }
//         }
//         return "";
//       };

//       const statementRows: StatementRow[] = [];

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
//         const taxDebitAmount =
//           toNumber(payment.whtAmount) + toNumber(payment.sstAmount);

//         if (amount <= 0) return;

//         const projectCode = getInvoiceProjectCode(
//           projectCodeLookup,
//           payment,
//           invoice,
//         );

//         const chequeNumber = getFirstValue(
//           getChequeNumberValue(payment),
//           getChequeNumberValue(invoice),
//         );

//         statementRows.push({
//           id: `invoice-payment-${paymentDoc.id}`,
//           source: "invoice_payment",
//           accountId: resolveAccountId(payment.depositTo),
//           date:
//             toDateInputValue(payment.paymentDate) ||
//             toDateInputValue(payment.createdAt) ||
//             "",
//           dateValue: toDateValue(payment.paymentDate || payment.createdAt),
//           sequenceValue: toDateValue(
//             payment.createdAt || payment.updatedAt || payment.paymentDate,
//           ),
//           description: `Invoice payment received${
//             payment.invoiceNo ? ` - ${payment.invoiceNo}` : ""
//           }${payment.client ? ` - ${payment.client}` : ""}`,
//           poNo: getInvoicePoNo(payment, invoice),
//           projectCode,
//           chequeNumber,
//           debit: taxDebitAmount,
//           credit: amount,
//         });
//       });

//       const budgetSnap = await getDocs(
//         collection(db, "Panels", PANEL_ID, "invoiceRequests"),
//       );

//       budgetSnap.forEach((requestDoc) => {
//         const request: any = { id: requestDoc.id, ...requestDoc.data() };
//         registerEntityProjectCode(projectCodeLookup, request);

//         const status = String(request.status || "").toLowerCase();
//         const isReleased =
//           status === "payment_released" ||
//           status === "payment_partially_released" ||
//           status === "released" ||
//           status === "partial" ||
//           request.paymentReleased === true ||
//           request.paymentPartiallyReleased === true ||
//           request.releasePaymentCreated === true;

//         const releaseHistory = getPaymentReleaseHistory(request);

//         if (!isReleased && releaseHistory.length === 0) return;

//         const fallbackRelease = {
//           ...(request.paymentDetails || request.latestPaymentRelease || {}),
//           amount:
//             request.paymentDetails?.amount ||
//             request.latestPaymentRelease?.amount ||
//             request.releasedAmount ||
//             request.totalReleasedAmount ||
//             request.totalAmount,
//           releasedAt:
//             request.paymentDetails?.releasedAt ||
//             request.latestPaymentRelease?.releasedAt ||
//             request.paymentReleasedAt ||
//             request.releasePaymentAt ||
//             request.updatedAt ||
//             request.submittedAt,
//         };

//         const paymentReleases =
//           releaseHistory.length > 0 ? releaseHistory : [fallbackRelease];

//         paymentReleases.forEach((paymentDetails: any, releaseIndex: number) => {
//           const amount = getPaymentReleaseAmount(paymentDetails);
//           if (amount <= 0) return;

//           const vendors = Array.isArray(paymentDetails.vendors)
//             ? paymentDetails.vendors.join(", ")
//             : paymentDetails.vendor ||
//               request.vendorName ||
//               request.supplierName ||
//               "";

//           const subject = getFirstValue(
//             request.subject,
//             request.title,
//             request.project,
//             vendors,
//           );
//           const projectCode = getRequestProjectCode(projectCodeLookup, request);
//           const chequeNumber = getReleaseChequeNumbers(
//             paymentDetails,
//             releaseHistory.length > 0 ? null : request,
//           ).join(", ");
//           const transactionTitle = getReleaseTransactionTitle(
//             paymentDetails,
//             request,
//             subject,
//           );

//           statementRows.push({
//             id: `budget-request-${requestDoc.id}-${
//               paymentDetails?.id || releaseIndex
//             }`,
//             source: "budget_request",
//             accountId: resolveAccountId(
//               paymentDetails.selectedAccountId,
//               paymentDetails.selectedAccount?.id,
//             ),
//             date:
//               toDateInputValue(paymentDetails.releasedAt) ||
//               toDateInputValue(paymentDetails.createdAt) ||
//               toDateInputValue(request.updatedAt) ||
//               toDateInputValue(request.submittedAt) ||
//               "",
//             dateValue: toDateValue(
//               paymentDetails.releasedAt ||
//                 paymentDetails.createdAt ||
//                 request.updatedAt ||
//                 request.submittedAt,
//             ),
//             sequenceValue: toDateValue(
//               paymentDetails.createdAt ||
//                 paymentDetails.releasedAt ||
//                 request.createdAt ||
//                 request.updatedAt ||
//                 request.submittedAt,
//             ),
//             description: transactionTitle,
//             poNo: getRequestPoNo(request),
//             projectCode,
//             chequeNumber,
//             debit: amount,
//             credit: 0,
//           });
//         });
//       });

//       // Purchase order payments (from the PO page and RTGS letters). Vendor
//       // manual payments also write one summary Record (listed below), so their
//       // per-PO entries are skipped here to avoid showing the payment twice.
//       const requestsById = new Map<string, any>();
//       const requestsByNumber = new Map<string, any>();
//       budgetSnap.forEach((requestDoc) => {
//         const request: any = { id: requestDoc.id, ...requestDoc.data() };
//         requestsById.set(requestDoc.id, request);
//         if (request.requestId) {
//           requestsByNumber.set(String(request.requestId).trim(), request);
//         }
//       });

//       // POs carry no project code of their own; it comes from their budget
//       // request or estimate.
//       const estimateProjectCodes = new Map<string, string>();
//       try {
//         const estimateSnap = await getDocs(
//           collection(db, "Panels", PANEL_ID, "estimates"),
//         );
//         estimateSnap.forEach((estimateDoc) => {
//           const estimate: any = estimateDoc.data();
//           const code = getProjectCodeValue(estimate);
//           if (!code) return;
//           [
//             estimateDoc.id,
//             estimate.estimateNumber,
//             estimate.estimateNo,
//             estimate.estimateCode,
//           ].forEach((key) => {
//             const cleanKey = String(key || "").trim();
//             if (cleanKey && !estimateProjectCodes.has(cleanKey)) {
//               estimateProjectCodes.set(cleanKey, code);
//             }
//           });
//         });
//       } catch (error) {
//         console.warn("Estimates not available for PO project codes:", error);
//       }

//       const poSnap = await getDocs(collection(db, "Panels", PANEL_ID, "PO"));

//       poSnap.forEach((poDoc) => {
//         const po: any = { id: poDoc.id, ...poDoc.data() };

//         if (
//           ["cancelled", "canceled", "deleted", "void"].includes(
//             String(po.status || "").trim().toLowerCase(),
//           )
//         ) {
//           return;
//         }

//         const sourceRequest =
//           requestsById.get(String(po.sourceInvoiceId || "").trim()) ||
//           requestsByNumber.get(String(po.sourceRequestId || "").trim());
//         const poProjectCode = getFirstValue(
//           getProjectCodeValue(po),
//           getProjectCodeValue(sourceRequest),
//           estimateProjectCodes.get(String(po.estimateId || "").trim()),
//           estimateProjectCodes.get(String(po.estimateNumber || "").trim()),
//         );

//         getPaymentReleaseHistory(po).forEach(
//           (paymentDetails: any, releaseIndex: number) => {
//             if (paymentDetails?.manualBatchPaymentId) return;

//             const amount = getPaymentReleaseAmount(paymentDetails);
//             if (amount <= 0) return;

//             statementRows.push({
//               id: `purchase-order-${poDoc.id}-${
//                 paymentDetails?.id || releaseIndex
//               }`,
//               source: "purchase_order",
//               accountId: resolveAccountId(
//                 paymentDetails.selectedAccountId,
//                 paymentDetails.selectedAccount?.id,
//               ),
//               date:
//                 toDateInputValue(paymentDetails.releasedAt) ||
//                 toDateInputValue(paymentDetails.createdAt) ||
//                 toDateInputValue(po.updatedAt) ||
//                 "",
//               dateValue: toDateValue(
//                 paymentDetails.releasedAt ||
//                   paymentDetails.createdAt ||
//                   po.updatedAt,
//               ),
//               sequenceValue: toDateValue(
//                 paymentDetails.createdAt ||
//                   paymentDetails.releasedAt ||
//                   po.createdAt ||
//                   po.updatedAt,
//               ),
//               description: getFirstValue(
//                 paymentDetails.transactionName,
//                 paymentDetails.title,
//                 `PO payment released - ${po.poNumber || po.id}${
//                   po.supplierName ? ` - ${po.supplierName}` : ""
//                 }`,
//               ),
//               poNo: getFirstValue(po.poNumber),
//               projectCode: getFirstValue(
//                 paymentDetails.rtgsProjectCode,
//                 poProjectCode,
//               ),
//               chequeNumber: getReleaseChequeNumbers(paymentDetails).join(", "),
//               debit: amount,
//               credit: 0,
//             });
//           },
//         );
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
//           accountId: resolveAccountId(
//             claim.selectedAccountId,
//             claim.selectedAccount?.id,
//           ),
//           date:
//             toDateInputValue(claim.paymentReleasedAt) ||
//             toDateInputValue(claim.updatedAt) ||
//             toDateInputValue(claim.submittedAt) ||
//             "",
//           dateValue: toDateValue(
//             claim.paymentReleasedAt || claim.updatedAt || claim.submittedAt,
//           ),
//           sequenceValue: toDateValue(
//             claim.createdAt ||
//               claim.paymentReleasedAt ||
//               claim.updatedAt ||
//               claim.submittedAt,
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
//               accountId: resolveAccountId(
//                 reimbursement.selectedAccountId,
//                 reimbursement.selectedAccount?.id,
//               ),
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
//               sequenceValue: toDateValue(
//                 reimbursement.createdAt ||
//                   reimbursement.paymentReleasedAt ||
//                   reimbursement.updatedAt ||
//                   meeting.createdAt ||
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

//       const chequeRecordSnap = await getDocs(
//         collection(db, "Panels", PANEL_ID, "Record"),
//       );

//       chequeRecordSnap.forEach((recordDoc) => {
//         const record: any = { id: recordDoc.id, ...recordDoc.data() };
//         registerEntityProjectCode(projectCodeLookup, record);

//         const chequeAmount = toNumber(record.chequeAmount);

//         if (chequeAmount <= 0) return;

//         const chequeNumber = getChequeNumberValue(record);

//         const accountText = getFirstValue(
//           record.accountTitle,
//           record.bank,
//           record.accountNo,
//           record.platform,
//         );

//         const statementTitle = getFirstValue(
//           record.statementTitle,
//           record.accountStatementTitle,
//           record.statement_title,
//           record.title,
//           record.transactionName,
//           record.transactionTitle,
//           record.description,
//           accountText ? `Record cheque amount - ${accountText}` : "",
//           "Record cheque amount",
//         );

//         const projectCode = resolveProjectCode(
//           projectCodeLookup,
//           record,
//           null,
//           record.projectCode,
//           record.project,
//           record.projectName,
//           record.accountTitle,
//           record.accountNo,
//           record.bank,
//           chequeNumber,
//         );

//         statementRows.push({
//           id: `record-cheque-${recordDoc.id}`,
//           source: "record",
//           accountId:
//             resolveAccountId(record.accountId) ||
//             resolveAccountIdByNumber(record.accountNo, record.iban),
//           date:
//             toDateInputValue(record.createdAt) ||
//             toDateInputValue(record.updatedAt) ||
//             "",
//           dateValue: toDateValue(record.createdAt || record.updatedAt),
//           sequenceValue: toDateValue(record.createdAt || record.updatedAt),
//           description: statementTitle,
//           poNo: getPoNoValue(record),
//           projectCode,
//           chequeNumber,
//           debit: chequeAmount,
//           credit: 0,
//         });
//       });

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
//           accountId: resolveAccountId(manual.accountId),
//           manualDocId: manualDoc.id,
//           date: toDateInputValue(manual.date) || String(manual.date || ""),
//           dateValue: toDateValue(manual.date || manual.createdAt),
//           sequenceValue: toDateValue(manual.createdAt || manual.date),
//           description: manual.description || "Manual entry",
//           poNo: manual.poNo || "",
//           projectCode,
//           debit,
//           credit,
//         });
//       });

//       // Transfers between our own accounts net to zero company-wide, so they
//       // only appear when a single account is selected (out = debit, in = credit).
//       try {
//         const transferSnap = await getDocs(
//           collection(db, "Panels", PANEL_ID, "accountTransfers"),
//         );

//         transferSnap.forEach((transferDoc) => {
//           const transfer: any = transferDoc.data();
//           const amount = toNumber(transfer.amount);

//           if (amount <= 0 || transfer.status === "failed") return;

//           // The day chosen on the transfer form; older transfers only have
//           // the time they were recorded.
//           const recordedAt = transfer.createdAt || transfer.createdAtISO;
//           const transferDate = transfer.transferDate || recordedAt;
//           const note = transfer.description ? ` - ${transfer.description}` : "";
//           const shared = {
//             date: toDateInputValue(transferDate),
//             dateValue: toDateValue(transferDate),
//             sequenceValue: toDateValue(recordedAt),
//             poNo: "",
//             projectCode: "",
//             // RTGS letter transfers carry the letter's cheque number.
//             chequeNumber: transfer.chequeNumber || transfer.transferId || "",
//           };

//           const fromAccountId = resolveAccountId(transfer.fromAccountId);
//           if (fromAccountId) {
//             statementRows.push({
//               ...shared,
//               id: `transfer-out-${transferDoc.id}`,
//               source: "account_transfer",
//               accountId: fromAccountId,
//               description: `Transfer to ${transfer.toAccountName || "account"}${note}`,
//               debit: amount,
//               credit: 0,
//             });
//           }

//           const toAccountId = resolveAccountId(transfer.toAccountId);
//           if (toAccountId) {
//             statementRows.push({
//               ...shared,
//               id: `transfer-in-${transferDoc.id}`,
//               source: "account_transfer",
//               accountId: toAccountId,
//               description: `Transfer from ${transfer.fromAccountName || "account"}${note}`,
//               debit: 0,
//               credit: amount,
//             });
//           }
//         });
//       } catch (error) {
//         console.warn("Account transfers path not available:", error);
//       }

//       statementRows.sort(
//         (a, b) =>
//           a.dateValue - b.dateValue ||
//           a.description.localeCompare(b.description),
//       );

//       setRows(statementRows);
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

//   // These 5 listeners each triggered a full ~10-collection + N+1 reload of
//   // the whole statement on ANY change to ANY of them, by anyone, with no
//   // debounce — a single new payment could fire the entire expensive scan 5
//   // times back to back. Replaced with a light visibility-aware poll on the
//   // same loader; the Refresh button and post-edit reload calls elsewhere in
//   // this file already cover "I want it current right now."
//   useEffect(() => {
//     const POLL_INTERVAL_MS = 2 * 60 * 1000;

//     const interval = setInterval(() => {
//       if (document.visibilityState === "visible") loadStatement(true);
//     }, POLL_INTERVAL_MS);

//     const handleVisibility = () => {
//       if (document.visibilityState === "visible") loadStatement(true);
//     };
//     document.addEventListener("visibilitychange", handleVisibility);

//     return () => {
//       clearInterval(interval);
//       document.removeEventListener("visibilitychange", handleVisibility);
//     };
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

//   const accountMap = useMemo(
//     () => new Map(accounts.map((account) => [account.id, account])),
//     [accounts],
//   );

//   // The statement opens on the first account added (earliest createdAt);
//   // "All accounts" is still available in the selector.
//   const defaultAccountFilter = useMemo(() => {
//     if (accounts.length === 0) return ALL_ACCOUNTS;

//     const [firstAdded] = [...accounts].sort((a, b) => {
//       const aTime = toDateValue(a.createdAt) || Number.MAX_SAFE_INTEGER;
//       const bTime = toDateValue(b.createdAt) || Number.MAX_SAFE_INTEGER;
//       return aTime - bTime;
//     });

//     return firstAdded.id;
//   }, [accounts]);

//   const activeAccountFilter = accountFilter ?? defaultAccountFilter;

//   const selectedAccount =
//     activeAccountFilter === ALL_ACCOUNTS
//       ? null
//       : accountMap.get(activeAccountFilter) || null;

//   // Opening balances are set per account in the Accounts tab. A single
//   // account starts from its own; "All accounts" starts from their total,
//   // dated from the earliest account opening.
//   const effectiveOpening = useMemo<OpeningBalance>(() => {
//     const getOpeningDate = (account: PaymentAccount) =>
//       account.openingBalanceDate || toDateInputValue(account.createdAt);

//     if (selectedAccount) {
//       return {
//         amount: toNumber(selectedAccount.openingBalance),
//         date: getOpeningDate(selectedAccount),
//       };
//     }

//     const openingDates = accounts
//       .map(getOpeningDate)
//       .filter(Boolean)
//       .sort((a, b) => a.localeCompare(b));

//     return {
//       amount: accounts.reduce(
//         (sum, account) => sum + toNumber(account.openingBalance),
//         0,
//       ),
//       date: openingDates[0] || "",
//     };
//   }, [selectedAccount, accounts]);

//   // The opening balance date set in the Accounts tab (the earliest one across
//   // accounts for "All accounts"); "" when none is set.
//   const openingBalanceDate = useMemo(() => {
//     const dates = (selectedAccount ? [selectedAccount] : accounts)
//       .map((account) => account.openingBalanceDate || "")
//       .filter(Boolean)
//       .sort((a, b) => a.localeCompare(b));

//     return dates[0] || "";
//   }, [selectedAccount, accounts]);

//   const balancedRows = useMemo(() => {
//     // An account's opening balance is its balance on the opening balance
//     // date, so earlier transactions on that account are already included in
//     // it (matching the balances on the Accounts Dashboard). Undated rows are
//     // always kept.
//     const isBeforeAccountOpening = (row: StatementRow) => {
//       const openingDay = row.accountId
//         ? accountMap.get(row.accountId)?.openingBalanceDate || ""
//         : "";

//       return Boolean(openingDay && row.date && row.date < openingDay);
//     };

//     const accountRows = rows.filter((row) =>
//       selectedAccount
//         ? row.accountId === selectedAccount.id
//         : row.source !== "account_transfer",
//     );
//     const scopedRows = accountRows.filter(
//       (row) => !isBeforeAccountOpening(row),
//     );

//     // Earlier transactions are only listed when a date filter is used to look
//     // back past the opening date. Their balances are worked backwards from
//     // the opening balance, which already includes them.
//     const earlierRows: StatementRow[] = [];
//     if (dateFrom || dateTo) {
//       let balanceAfter = effectiveOpening.amount;
//       const beforeOpening = accountRows.filter(isBeforeAccountOpening);

//       for (let index = beforeOpening.length - 1; index >= 0; index -= 1) {
//         const row = beforeOpening[index];
//         earlierRows.unshift({
//           ...row,
//           beforeOpening: true,
//           balance: balanceAfter,
//         });
//         balanceAfter -= toNumber(row.credit) - toNumber(row.debit);
//       }
//     }

//     const openingRow: StatementRow = {
//       id: "opening-balance",
//       source: "opening",
//       accountId: selectedAccount?.id,
//       date: effectiveOpening.date,
//       dateValue: toDateValue(effectiveOpening.date),
//       sequenceValue: toDateValue(effectiveOpening.date),
//       description: selectedAccount
//         ? `Opening Balance - ${getAccountLabel(selectedAccount)}`
//         : "Opening Balance",
//       poNo: "",
//       projectCode: "",
//       debit: 0,
//       credit: 0,
//       balance: effectiveOpening.amount,
//     };

//     let runningBalance = effectiveOpening.amount;
//     return [
//       ...earlierRows,
//       openingRow,
//       ...scopedRows.map((row) => {
//         runningBalance += toNumber(row.credit) - toNumber(row.debit);
//         return { ...row, balance: runningBalance };
//       }),
//     ];
//   }, [rows, selectedAccount, accountMap, effectiveOpening, dateFrom, dateTo]);

//   const hasActiveFilters = Boolean(
//     search.trim() ||
//       dateFrom ||
//       dateTo ||
//       projectCodeFilter.trim() ||
//       activeAccountFilter !== defaultAccountFilter,
//   );

//   const filteredRows = useMemo(() => {
//     const queryText = search.trim().toLowerCase();
//     const projectCodeQuery = projectCodeFilter.trim().toLowerCase();
//     const fromTime = dateFrom
//       ? new Date(`${dateFrom}T00:00:00`).getTime()
//       : null;
//     const toTime = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;

//     return balancedRows.filter((row) => {
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
//         (row.chequeNumber || "").toLowerCase().includes(queryText) ||
//         row.source.toLowerCase().includes(queryText) ||
//         row.date.toLowerCase().includes(queryText)
//       );
//     });
//   }, [balancedRows, search, dateFrom, dateTo, projectCodeFilter]);

//   const orderedFilteredRows = useMemo(() => {
//     return [...filteredRows].sort((a, b) =>
//       compareRowsBySequence(a, b, pageOrder),
//     );
//   }, [filteredRows, pageOrder]);

//   // Filters narrow the set down to something manageable, so show everything
//   // that matches immediately rather than making the user scroll to see their
//   // own filtered results.
//   const isIncrementalView = !hasActiveFilters;

//   const visibleRows = useMemo(() => {
//     if (!isIncrementalView) return orderedFilteredRows;
//     return orderedFilteredRows.slice(0, visibleCount);
//   }, [orderedFilteredRows, isIncrementalView, visibleCount]);

//   const hasMoreToReveal =
//     isIncrementalView && visibleCount < orderedFilteredRows.length;

//   // Restart the reveal from the top whenever the underlying view changes
//   // shape — a fresh data load, a sort flip, or returning to the unfiltered
//   // view — so we never end up rendering a stale, oversized batch.
//   useEffect(() => {
//     setVisibleCount(INITIAL_VISIBLE_ROWS);
//   }, [balancedRows, pageOrder, hasActiveFilters]);

//   useEffect(() => {
//     if (!hasMoreToReveal) return;
//     const sentinel = loadMoreSentinelRef.current;
//     if (!sentinel) return;

//     const observer = new IntersectionObserver(
//       (entries) => {
//         if (entries[0]?.isIntersecting) {
//           setIsLoadingMore(true);
//           // Data's already in memory, so revealing more is instant — this
//           // small delay is purely so the loading animation is visible
//           // instead of the row count jumping in with no transition.
//           window.setTimeout(() => {
//             setVisibleCount((prev) => prev + LOAD_MORE_BATCH);
//             setIsLoadingMore(false);
//           }, 350);
//         }
//       },
//       { rootMargin: "200px" },
//     );

//     observer.observe(sentinel);
//     return () => observer.disconnect();
//   }, [hasMoreToReveal]);

//   const exportStatement = (order: ExportOrder) => {
//     const exportRows = [...filteredRows].sort((a, b) =>
//       compareRowsBySequence(a, b, order),
//     );

//     if (exportRows.length === 0) {
//       alert("No account statement entries available to export.");
//       return;
//     }

//     const headers = [
//       "Date",
//       "Title",
//       "Source",
//       "Account",
//       "PO No",
//       "Project Code",
//       "Cheque Number",
//       "Debit",
//       "Credit",
//       "Balance",
//     ];

//     const csvRows = exportRows.map((row) =>
//       [
//         formatDate(row.date),
//         row.description,
//         row.source.replace(/_/g, " "),
//         row.accountId ? getAccountLabel(accountMap.get(row.accountId)) : "",
//         row.poNo || "",
//         row.projectCode || "",
//         row.chequeNumber || "",
//         row.debit > 0 ? formatCurrency(row.debit) : "",
//         row.credit > 0 ? formatCurrency(row.credit) : "",
//         formatCurrency(row.balance || 0),
//       ]
//         .map(escapeCsvValue)
//         .join(","),
//     );

//     const csvContent = [headers.map(escapeCsvValue).join(","), ...csvRows].join(
//       "\n",
//     );

//     const blob = new Blob([`\ufeff${csvContent}`], {
//       type: "text/csv;charset=utf-8;",
//     });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement("a");
//     const fileDate = new Date().toISOString().slice(0, 10);

//     link.href = url;
//     const accountSuffix = selectedAccount
//       ? `-${getAccountLabel(selectedAccount)
//           .replace(/[^a-z0-9]+/gi, "-")
//           .toLowerCase()}`
//       : "";
//     link.download = `account-statement${accountSuffix}-${order}-${fileDate}.csv`;
//     link.click();

//     URL.revokeObjectURL(url);
//     setExportDialogOpen(false);
//   };

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
//       { debit: 0, credit: 0, balance: effectiveOpening.amount },
//     );
//   }, [filteredRows, effectiveOpening.amount]);

//   const resetFilters = () => {
//     setAccountFilter(null);
//     setSearch("");
//     setDateFrom("");
//     setDateTo("");
//     setProjectCodeFilter("");
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
//           accountId: manualForm.accountId,
//           accountName: manualForm.accountId
//             ? getAccountLabel(accountMap.get(manualForm.accountId))
//             : "",
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
//             Track opening balance, received invoice payments, record cheque
//             amounts, released expenses, release-payment cheque numbers,
//             reimbursements, and manual entries.
//           </p>
//         </div>

//         <div className="flex flex-wrap items-center gap-2">
//           <Button
//             variant="outline"
//             onClick={() => setExportDialogOpen(true)}
//             disabled={loading || filteredRows.length === 0}
//             className="gap-2"
//           >
//             <Download className="h-4 w-4" />
//             Export
//           </Button>

//           <Button
//             variant="outline"
//             onClick={() => loadStatement()}
//             className="gap-2"
//           >
//             <RefreshCw className="h-4 w-4" />
//             Refresh
//           </Button>

//           <Button
//             onClick={() => {
//               setManualForm((prev) => ({
//                 ...prev,
//                 accountId: selectedAccount?.id || prev.accountId,
//               }));
//               setManualDialogOpen(true);
//             }}
//             className="gap-2"
//           >
//             <Plus className="h-4 w-4" />
//             Add Manual Entry
//           </Button>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
//         <StatCard
//           title="Opening Balance"
//           value={`Rs ${formatCurrency(effectiveOpening.amount)}`}
//           subtitle={
//             openingBalanceDate
//               ? `${selectedAccount ? "As of" : "Earliest:"} ${formatDate(
//                   openingBalanceDate,
//                 )}`
//               : "No opening balance date set"
//           }
//           icon={<CalendarDays className="h-5 w-5" />}
//         />
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
//           <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
//             <div>
//               <h2 className="text-base font-semibold text-slate-950">
//                 Statement Entries
//               </h2>
//               <p className="mt-1 text-sm text-slate-500">
//                 Credit comes from received payments and manual incoming entries.
//                 Debit comes from record cheque amounts, released budget
//                 requests, released reimbursements, and manual outgoing entries.
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

//           <div className="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto] lg:items-end">
//             <div>
//               <Label>Account</Label>
//               <Select
//                 value={activeAccountFilter}
//                 onValueChange={setAccountFilter}
//               >
//                 <SelectTrigger className="mt-2 bg-white">
//                   <SelectValue placeholder="All Accounts" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value={ALL_ACCOUNTS}>All Accounts</SelectItem>
//                   {accounts.map((account) => (
//                     <SelectItem key={account.id} value={account.id}>
//                       {getAccountOptionLabel(account)}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>

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

//           <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
//             <div className="text-sm text-slate-500">
//               Showing {orderedFilteredRows.length} of {balancedRows.length}{" "}
//               entries,{" "}
//               {pageOrder === "descending"
//                 ? "newest added first"
//                 : "oldest added first"}
//               {selectedAccount ? ` in ${getAccountLabel(selectedAccount)}` : ""}
//               {projectCodeFilter.trim()
//                 ? ` for project code ${projectCodeFilter.trim()}`
//                 : ""}
//               .
//               {isIncrementalView && orderedFilteredRows.length > 0 && (
//                 <span className="ml-1 text-slate-400">
//                   ({visibleRows.length} loaded
//                   {hasMoreToReveal ? " — scroll for more" : ""})
//                 </span>
//               )}
//             </div>

//             <div className="inline-flex w-fit rounded-xl border border-slate-200 bg-white p-1">
//               <Button
//                 type="button"
//                 size="sm"
//                 variant={pageOrder === "descending" ? "default" : "ghost"}
//                 onClick={() => setPageOrder("descending")}
//                 className="rounded-lg"
//               >
//                 Descending - latest on top
//               </Button>

//               <Button
//                 type="button"
//                 size="sm"
//                 variant={pageOrder === "ascending" ? "default" : "ghost"}
//                 onClick={() => setPageOrder("ascending")}
//                 className="rounded-lg"
//               >
//                 Ascending - latest at bottom
//               </Button>
//             </div>
//           </div>

//           <div className="overflow-x-auto rounded-2xl border border-slate-200">
//             <table className="min-w-[1120px] w-full text-sm">
//               <thead className="bg-slate-50">
//                 <tr className="border-b border-slate-200 text-slate-600">
//                   <th className="px-4 py-3 text-left font-semibold">Date</th>
//                   <th className="px-4 py-3 text-left font-semibold">Title</th>
//                   <th className="px-4 py-3 text-left font-semibold">PO No</th>
//                   <th className="px-4 py-3 text-left font-semibold">
//                     Project Code
//                   </th>
//                   <th className="px-4 py-3 text-left font-semibold">
//                     Cheque Number
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
//                   Array.from({ length: 8 }).map((_, index) => (
//                     <tr
//                       key={`initial-skeleton-${index}`}
//                       className="border-b border-slate-100 last:border-0"
//                     >
//                       <td className="px-4 py-3">
//                         <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
//                       </td>
//                       <td className="px-4 py-3">
//                         <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
//                         <div className="mt-1.5 h-3 w-20 animate-pulse rounded bg-slate-100" />
//                       </td>
//                       <td className="px-4 py-3">
//                         <div className="h-4 w-14 animate-pulse rounded bg-slate-200" />
//                       </td>
//                       <td className="px-4 py-3">
//                         <div className="h-4 w-14 animate-pulse rounded bg-slate-200" />
//                       </td>
//                       <td className="px-4 py-3">
//                         <div className="h-4 w-14 animate-pulse rounded bg-slate-200" />
//                       </td>
//                       <td className="px-4 py-3">
//                         <div className="ml-auto h-4 w-16 animate-pulse rounded bg-slate-200" />
//                       </td>
//                       <td className="px-4 py-3">
//                         <div className="ml-auto h-4 w-16 animate-pulse rounded bg-slate-200" />
//                       </td>
//                       <td className="px-4 py-3">
//                         <div className="ml-auto h-4 w-20 animate-pulse rounded bg-slate-200" />
//                       </td>
//                       <td className="px-4 py-3">
//                         <div className="ml-auto h-4 w-6 animate-pulse rounded bg-slate-200" />
//                       </td>
//                     </tr>
//                   ))
//                 ) : orderedFilteredRows.length > 0 ? (
//                   <>
//                     {visibleRows.map((row) => (
//                       <tr
//                         key={row.id}
//                         className="border-b border-slate-100 last:border-0"
//                       >
//                         <td className="whitespace-nowrap px-4 py-3 text-slate-700">
//                           {formatDate(row.date)}
//                         </td>
//                         <td className="px-4 py-3 text-slate-900">
//                           <div className="font-medium">{row.description}</div>
//                           <div className="mt-1 text-xs text-slate-500">
//                             <span className="capitalize">
//                               {row.source.replace(/_/g, " ")}
//                             </span>
//                             {!selectedAccount && row.accountId && (
//                               <span>
//                                 {" · "}
//                                 {getAccountLabel(accountMap.get(row.accountId))}
//                               </span>
//                             )}
//                             {row.beforeOpening && (
//                               <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
//                                 Before opening balance
//                               </span>
//                             )}
//                           </div>
//                         </td>
//                         <td className="whitespace-nowrap px-4 py-3 text-slate-700">
//                           {row.poNo || "-"}
//                         </td>
//                         <td className="whitespace-nowrap px-4 py-3 text-slate-700">
//                           {row.projectCode || "-"}
//                         </td>
//                         <td className="whitespace-nowrap px-4 py-3 text-slate-700">
//                           {row.chequeNumber || "-"}
//                         </td>
//                         <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-900">
//                           {row.debit > 0
//                             ? `Rs ${formatCurrency(row.debit)}`
//                             : "-"}
//                         </td>
//                         <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-900">
//                           {row.credit > 0
//                             ? `Rs ${formatCurrency(row.credit)}`
//                             : "-"}
//                         </td>
//                         <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-950">
//                           Rs {formatCurrency(row.balance || 0)}
//                         </td>
//                         <td className="whitespace-nowrap px-4 py-3 text-right">
//                           {row.source === "manual" ? (
//                             <Button
//                               variant="ghost"
//                               size="sm"
//                               className="text-red-600 hover:text-red-700"
//                               onClick={() => deleteManualEntry(row)}
//                             >
//                               <Trash2 className="h-4 w-4" />
//                             </Button>
//                           ) : (
//                             <span className="text-slate-400">-</span>
//                           )}
//                         </td>
//                       </tr>
//                     ))}

//                     {hasMoreToReveal && (
//                       <tr ref={loadMoreSentinelRef}>
//                         <td colSpan={9} className="px-4 py-4">
//                           {isLoadingMore ? (
//                             <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
//                               <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-500" />
//                               Loading more entries...
//                             </div>
//                           ) : (
//                             <div className="h-1" />
//                           )}
//                         </td>
//                       </tr>
//                     )}
//                   </>
//                 ) : (
//                   <tr>
//                     <td
//                       colSpan={9}
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

//       <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
//         <DialogContent className="max-w-md">
//           <DialogHeader>
//             <DialogTitle>Export Account Statement</DialogTitle>
//           </DialogHeader>

//           <div className="space-y-3">
//             <p className="text-sm text-slate-500">
//               Select the sequence for your exported file. This will not change
//               the selected sequence on the page.
//             </p>

//             <Button
//               className="w-full justify-start gap-2"
//               onClick={() => exportStatement("descending")}
//             >
//               <ArrowDownCircle className="h-4 w-4" />
//               Descending - latest added on top
//             </Button>

//             <Button
//               variant="outline"
//               className="w-full justify-start gap-2"
//               onClick={() => exportStatement("ascending")}
//             >
//               <ArrowUpCircle className="h-4 w-4" />
//               Ascending - latest added at bottom
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>

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
//               <Label>Account</Label>
//               <Select
//                 value={manualForm.accountId || NO_ACCOUNT}
//                 onValueChange={(value) =>
//                   setManualForm((prev) => ({
//                     ...prev,
//                     accountId: value === NO_ACCOUNT ? "" : value,
//                   }))
//                 }
//               >
//                 <SelectTrigger className="mt-2">
//                   <SelectValue placeholder="Select account" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value={NO_ACCOUNT}>
//                     No specific account
//                   </SelectItem>
//                   {accounts
//                     .filter(
//                       (account) =>
//                         account.isActive !== false ||
//                         account.id === manualForm.accountId,
//                     )
//                     .map((account) => (
//                       <SelectItem key={account.id} value={account.id}>
//                         {getAccountOptionLabel(account)}
//                       </SelectItem>
//                     ))}
//                 </SelectContent>
//               </Select>
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

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { paymentAccountPickerName } from "@/lib/payments/paymentAccounts";
import {
  buildAccountLedger,
  isBeforeOpeningDay,
  toAccountDate,
  toDayKey,
  type AccountLedgerData,
  type AccountLedgerEntry,
} from "@/lib/payments/accountBalances";
import { useAccountLedgerData } from "@/hooks/useAccountLedgerData";
import type { PaymentAccount } from "@/lib/payments/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  Download,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  Wallet,
} from "lucide-react";

const PANEL_ID = "IEDGE-SYSTEM";

type StatementSource =
  | "opening"
  | "invoice_payment"
  | "budget_request"
  | "purchase_order"
  | "reimbursement"
  | "record"
  | "manual"
  | "account_transfer";

type StatementRow = {
  id: string;
  source: StatementSource;
  accountId?: string;
  date: string;
  dateValue: number;
  description: string;
  poNo: string;
  projectCode: string;
  chequeNumber?: string;
  debit: number;
  credit: number;
  balance?: number;
  sequenceValue?: number;
  manualDocId?: string;
  // Dated before its account's opening balance date (already included in
  // the opening balance); only shown when a date filter is used.
  beforeOpening?: boolean;
};

type ManualEntryForm = {
  date: string;
  description: string;
  poNo: string;
  projectCode: string;
  debit: string;
  credit: string;
  accountId: string;
};

type OpeningBalance = {
  amount: number;
  date: string;
};

type ProjectCodeLookup = Map<string, string>;

type ExportOrder = "ascending" | "descending";

const emptyManualForm: ManualEntryForm = {
  date: new Date().toISOString().slice(0, 10),
  description: "",
  poNo: "",
  projectCode: "",
  debit: "",
  credit: "",
  accountId: "",
};

const ALL_ACCOUNTS = "all";
const NO_ACCOUNT = "none";

const getAccountLabel = (account?: PaymentAccount | null) =>
  account?.accountName || account?.bankName || "Unnamed Account";

const getAccountOptionLabel = (account: PaymentAccount) => {
  const number = String(account.accountNumber || "").trim();
  const details = [account.bankName, number ? `••${number.slice(-4)}` : ""]
    .filter(Boolean)
    .join(" ");

  return `${paymentAccountPickerName(account)}${details ? ` - ${details}` : ""}${
    account.isActive === false ? " (inactive)" : ""
  }`;
};

const toNumber = (value: any) => {
  const parsed =
    typeof value === "number"
      ? value
      : Number(String(value ?? "").replace(/,/g, ""));

  return Number.isFinite(parsed) ? parsed : 0;
};

// The local calendar day, as the Accounts Dashboard counts it (not the UTC
// day, which is the day before for anything saved before 5 AM in Pakistan).
const toDateInputValue = (value: any) => toDayKey(value);

const toDateValue = (value: any) => toAccountDate(value)?.getTime() || 0;

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

const getRowSequenceValue = (row: StatementRow) =>
  row.sequenceValue || row.dateValue || toDateValue(row.date);

const compareRowsBySequence = (
  a: StatementRow,
  b: StatementRow,
  order: ExportOrder,
) => {
  // The opening balance sits after transactions from before it and ahead of
  // everything else.
  if (a.source === "opening" && b.source !== "opening") {
    const openingFirst = !b.beforeOpening;
    return (order === "ascending") === openingFirst ? -1 : 1;
  }

  if (b.source === "opening" && a.source !== "opening") {
    const openingFirst = !a.beforeOpening;
    return (order === "ascending") === openingFirst ? 1 : -1;
  }

  if (Boolean(a.beforeOpening) !== Boolean(b.beforeOpening)) {
    const beforeFirst = a.beforeOpening ? -1 : 1;
    return order === "ascending" ? beforeFirst : -beforeFirst;
  }

  const sequenceDiff = getRowSequenceValue(a) - getRowSequenceValue(b);
  if (sequenceDiff !== 0) {
    return order === "ascending" ? sequenceDiff : -sequenceDiff;
  }

  const dateDiff = a.dateValue - b.dateValue;
  if (dateDiff !== 0) {
    return order === "ascending" ? dateDiff : -dateDiff;
  }

  const descriptionDiff = a.description.localeCompare(b.description);
  return order === "ascending" ? descriptionDiff : -descriptionDiff;
};

const escapeCsvValue = (value: any) => {
  const text = String(value ?? "");

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
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

const uniqueStringList = (values: string[]) => {
  const seen = new Set<string>();

  return values.filter((value) => {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getReleaseChequeNumbers = (...sources: any[]) => {
  return uniqueStringList(
    sources.flatMap((source) => {
      if (!source) return [];

      return [
        ...getStringListFromValue(source?.chequeNumber),
        ...getStringListFromValue(source?.chequeNumbers),
        ...getStringListFromValue(source?.chequeNo),
        ...getStringListFromValue(source?.checkNumber),
        ...getStringListFromValue(source?.checkNo),
        ...getStringListFromValue(source?.bankChequeNumber),
        ...getStringListFromValue(source?.paymentChequeNumber),
        ...getStringListFromValue(source?.receivedChequeNumber),
        ...getStringListFromValue(source?.paymentDetails?.chequeNumber),
        ...getStringListFromValue(source?.paymentDetails?.chequeNumbers),
        ...getStringListFromValue(source?.paymentDetails?.chequeNo),
        ...getStringListFromValue(source?.paymentDetails?.checkNumber),
        ...getStringListFromValue(source?.latestPaymentRelease?.chequeNumber),
        ...getStringListFromValue(source?.latestPaymentRelease?.chequeNumbers),
        ...getStringListFromValue(source?.latestPaymentRelease?.chequeNo),
        ...getStringListFromValue(source?.latestPaymentRelease?.checkNumber),
      ];
    }),
  );
};

const getReleaseTransactionTitle = (
  paymentDetails: any,
  request: any,
  fallbackSubject: string,
) =>
  getFirstValue(
    paymentDetails?.transactionName,
    paymentDetails?.title,
    paymentDetails?.transactionTitle,
    request?.latestTransactionName,
    request?.transactionName,
    fallbackSubject,
    "Budget request payment released",
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

// Collections that only supply labels (project codes, PO numbers, cheque
// numbers); amounts all come from the account ledger.
type StatementLabelSources = {
  invoices: any[];
  projects: any[];
  clientProjects: any[];
  estimates: any[];
};

const STATEMENT_LABEL_COLLECTIONS: Record<keyof StatementLabelSources, string> =
  {
    invoices: "estimateInvoices",
    projects: "projects",
    clientProjects: "clientProjects",
    estimates: "estimates",
  };

// The statement's rows are the shared account ledger (the same lines the
// Accounts tab adds up), each labelled with its description, PO number,
// project code and cheque number.
function buildStatementRows(
  ledger: AccountLedgerEntry[],
  data: AccountLedgerData,
  labels: StatementLabelSources,
): StatementRow[] {
  const projectCodeLookup: ProjectCodeLookup = new Map();

  const invoiceMap = new Map<string, any>();
  labels.invoices.forEach((invoice) => {
    invoiceMap.set(invoice.id, invoice);
    registerEntityProjectCode(projectCodeLookup, invoice);
  });

  const salesRecordMap = new Map<string, any>();
  data.salesRecords.forEach((record) => {
    if (!salesRecordMap.has(record.id)) {
      salesRecordMap.set(record.id, record.data);
    }
    registerEntityProjectCode(projectCodeLookup, {
      id: record.id,
      ...record.data,
    });
  });

  [
    ...labels.projects,
    ...labels.clientProjects,
    ...data.invoiceRequests,
    ...data.claimReimbursements,
    ...data.records,
  ].forEach((entity) => registerEntityProjectCode(projectCodeLookup, entity));

  // POs carry no project code of their own; it comes from their budget
  // request or estimate.
  const requestsById = new Map<string, any>();
  const requestsByNumber = new Map<string, any>();
  data.invoiceRequests.forEach((request) => {
    requestsById.set(request.id, request);
    if (request.requestId) {
      requestsByNumber.set(String(request.requestId).trim(), request);
    }
  });

  const estimateProjectCodes = new Map<string, string>();
  labels.estimates.forEach((estimate) => {
    const code = getProjectCodeValue(estimate);
    if (!code) return;
    [
      estimate.id,
      estimate.estimateNumber,
      estimate.estimateNo,
      estimate.estimateCode,
    ].forEach((key) => {
      const cleanKey = String(key || "").trim();
      if (cleanKey && !estimateProjectCodes.has(cleanKey)) {
        estimateProjectCodes.set(cleanKey, code);
      }
    });
  });

  const describe = (
    entry: AccountLedgerEntry,
  ): Pick<
    StatementRow,
    | "source"
    | "sequenceValue"
    | "description"
    | "poNo"
    | "projectCode"
    | "chequeNumber"
    | "manualDocId"
  > => {
    const source = entry.document;
    const paymentDetails = entry.release;

    switch (entry.kind) {
      case "invoice_payment": {
        const invoice = source.invoiceId
          ? invoiceMap.get(source.invoiceId)
          : null;

        return {
          source: "invoice_payment",
          sequenceValue: toDateValue(
            source.createdAt || source.updatedAt || source.paymentDate,
          ),
          description: `Invoice payment received${
            source.invoiceNo ? ` - ${source.invoiceNo}` : ""
          }${source.client ? ` - ${source.client}` : ""}`,
          poNo: getInvoicePoNo(source, invoice),
          projectCode: getInvoiceProjectCode(
            projectCodeLookup,
            source,
            invoice,
          ),
          chequeNumber: getFirstValue(
            getChequeNumberValue(source),
            getChequeNumberValue(invoice),
          ),
        };
      }

      case "budget_request": {
        const vendors = Array.isArray(paymentDetails.vendors)
          ? paymentDetails.vendors.join(", ")
          : paymentDetails.vendor ||
            source.vendorName ||
            source.supplierName ||
            "";
        const subject = getFirstValue(
          source.subject,
          source.title,
          source.project,
          vendors,
        );

        return {
          source: "budget_request",
          sequenceValue: toDateValue(
            paymentDetails.createdAt ||
              paymentDetails.releasedAt ||
              source.createdAt ||
              source.updatedAt ||
              source.submittedAt,
          ),
          description: getReleaseTransactionTitle(
            paymentDetails,
            source,
            subject,
          ),
          poNo: getRequestPoNo(source),
          projectCode: getRequestProjectCode(projectCodeLookup, source),
          chequeNumber: getReleaseChequeNumbers(
            paymentDetails,
            entry.unrecordedRelease ? source : null,
          ).join(", "),
        };
      }

      case "purchase_order": {
        const sourceRequest =
          requestsById.get(String(source.sourceInvoiceId || "").trim()) ||
          requestsByNumber.get(String(source.sourceRequestId || "").trim());
        const poProjectCode = getFirstValue(
          getProjectCodeValue(source),
          getProjectCodeValue(sourceRequest),
          estimateProjectCodes.get(String(source.estimateId || "").trim()),
          estimateProjectCodes.get(String(source.estimateNumber || "").trim()),
        );

        return {
          source: "purchase_order",
          sequenceValue: toDateValue(
            paymentDetails.createdAt ||
              paymentDetails.releasedAt ||
              source.createdAt ||
              source.updatedAt,
          ),
          description: getFirstValue(
            paymentDetails.transactionName,
            paymentDetails.title,
            `PO payment released - ${source.poNumber || source.id}${
              source.supplierName ? ` - ${source.supplierName}` : ""
            }`,
          ),
          poNo: getFirstValue(source.poNumber),
          projectCode: getFirstValue(
            paymentDetails.rtgsProjectCode,
            poProjectCode,
          ),
          chequeNumber: getReleaseChequeNumbers(paymentDetails).join(", "),
        };
      }

      case "claim_reimbursement":
        return {
          source: "reimbursement",
          sequenceValue: toDateValue(
            source.createdAt ||
              source.paymentReleasedAt ||
              source.updatedAt ||
              source.submittedAt,
          ),
          description: `Reimbursement released - ${
            source.description || source.foodItem || source.claimType || "Claim"
          }${source.submittedByName ? ` - ${source.submittedByName}` : ""}`,
          poNo: getReimbursementPoNo(null, null, source),
          projectCode: getReimbursementProjectCode(
            projectCodeLookup,
            null,
            null,
            source,
          ),
        };

      case "meeting_reimbursement": {
        const reimbursement = source.reimbursement || {};
        const recordId = entry.meetingUpdate?.recordId || "";
        const recordData = salesRecordMap.get(recordId);

        return {
          source: "reimbursement",
          sequenceValue: toDateValue(
            reimbursement.createdAt ||
              reimbursement.paymentReleasedAt ||
              reimbursement.updatedAt ||
              source.createdAt ||
              source.updatedAt ||
              source.submittedAt,
          ),
          description: `Reimbursement released - ${
            reimbursement.detail ||
            reimbursement.description ||
            recordData?.projectName ||
            "Claim"
          }${source.personName ? ` - ${source.personName}` : ""}`,
          poNo: getReimbursementPoNo(reimbursement, recordData, null),
          projectCode: getReimbursementProjectCode(
            projectCodeLookup,
            { ...reimbursement, recordId },
            { id: recordId, ...recordData },
            null,
          ),
        };
      }

      case "record": {
        const chequeNumber = getChequeNumberValue(source);
        const accountText = getFirstValue(
          source.accountTitle,
          source.bank,
          source.accountNo,
          source.platform,
        );

        return {
          source: "record",
          sequenceValue: toDateValue(source.createdAt || source.updatedAt),
          description: getFirstValue(
            source.statementTitle,
            source.accountStatementTitle,
            source.statement_title,
            source.title,
            source.transactionName,
            source.transactionTitle,
            source.description,
            accountText ? `Record cheque amount - ${accountText}` : "",
            "Record cheque amount",
          ),
          poNo: getPoNoValue(source),
          projectCode: resolveProjectCode(
            projectCodeLookup,
            source,
            null,
            source.projectCode,
            source.project,
            source.projectName,
            source.accountTitle,
            source.accountNo,
            source.bank,
            chequeNumber,
          ),
          chequeNumber,
        };
      }

      case "manual":
        return {
          source: "manual",
          manualDocId: source.id,
          sequenceValue: toDateValue(source.createdAt || source.date),
          description: source.description || "Manual entry",
          poNo: source.poNo || "",
          projectCode: resolveProjectCode(
            projectCodeLookup,
            source,
            null,
            source.projectCode,
            source.project,
            source.projectName,
            source.poNo,
            source.description,
          ),
        };

      case "transfer_out":
      case "transfer_in": {
        const note = source.description ? ` - ${source.description}` : "";

        return {
          source: "account_transfer",
          sequenceValue: toDateValue(source.createdAt || source.createdAtISO),
          description:
            entry.kind === "transfer_out"
              ? `Transfer to ${source.toAccountName || "account"}${note}`
              : `Transfer from ${source.fromAccountName || "account"}${note}`,
          poNo: "",
          projectCode: "",
          // RTGS letter transfers carry the letter's cheque number.
          chequeNumber: source.chequeNumber || source.transferId || "",
        };
      }
    }
  };

  return ledger
    .map((entry) => ({
      id: entry.key,
      accountId: entry.accountId,
      date: entry.day,
      dateValue: entry.date ? entry.date.getTime() : 0,
      debit: entry.debit,
      credit: entry.credit,
      ...describe(entry),
    }))
    .sort(
      (a, b) =>
        a.dateValue - b.dateValue || a.description.localeCompare(b.description),
    );
}

function StatCard({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  subtitle?: string;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          )}
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

  const [savingManual, setSavingManual] = useState(false);

  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [manualForm, setManualForm] =
    useState<ManualEntryForm>(emptyManualForm);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [projectCodeFilter, setProjectCodeFilter] = useState("");
  // null until the user picks an account: the statement then shows the
  // default account (the first one added).
  const [accountFilter, setAccountFilter] = useState<string | null>(null);
  const [pageOrder, setPageOrder] = useState<ExportOrder>("descending");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Incremental row reveal: rendering thousands of <tr> at once is what was
  // making this page slow, not the data fetch itself (that part still loads
  // everything up front — this table is a merged view across 10 collections
  // that doesn't cleanly support cursor pagination). So instead we keep all
  // the data in memory but only mount a batch of rows into the DOM, growing
  // the batch as the user scrolls. Filters and export both operate on the
  // full filtered set regardless of how much has been revealed.
  const INITIAL_VISIBLE_ROWS = 40;
  const LOAD_MORE_BATCH = 40;
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_ROWS);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreSentinelRef = useRef<HTMLTableRowElement | null>(null);

  // Accounts and every transaction on them come from the same loader as the
  // Accounts tab, and the rows are the same ledger it adds up, so this
  // statement's balance always matches the account's balance there.
  const {
    data: ledgerData,
    loading: ledgerLoading,
    failedSources,
    refresh,
  } = useAccountLedgerData();
  const accounts = ledgerData.accounts;

  const [labelSources, setLabelSources] = useState<StatementLabelSources>({
    invoices: [],
    projects: [],
    clientProjects: [],
    estimates: [],
  });
  const [invoicesLoaded, setInvoicesLoaded] = useState(false);

  useEffect(() => {
    const unsubscribers = (
      Object.keys(STATEMENT_LABEL_COLLECTIONS) as Array<
        keyof StatementLabelSources
      >
    ).map((key) =>
      onSnapshot(
        collection(db, "Panels", PANEL_ID, STATEMENT_LABEL_COLLECTIONS[key]),
        (snapshot) => {
          setLabelSources((previous) => ({
            ...previous,
            [key]: snapshot.docs.map((snapshotDoc) => ({
              id: snapshotDoc.id,
              ...snapshotDoc.data(),
            })),
          }));
          if (key === "invoices") setInvoicesLoaded(true);
        },
        (error) => {
          console.warn(
            `Statement labels not available (${STATEMENT_LABEL_COLLECTIONS[key]}):`,
            error,
          );
          if (key === "invoices") setInvoicesLoaded(true);
        },
      ),
    );

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  const loading = ledgerLoading || !invoicesLoaded;

  const rows = useMemo(
    () =>
      buildStatementRows(
        buildAccountLedger(ledgerData),
        ledgerData,
        labelSources,
      ),
    [ledgerData, labelSources],
  );

  const projectCodeOptions = useMemo(() => {
    return Array.from(
      new Set(
        rows
          .map((row) => row.projectCode)
          .filter((projectCode) => projectCode && projectCode.trim()),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const accountMap = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts],
  );

  // The statement opens on the first account added (earliest createdAt);
  // "All accounts" is still available in the selector.
  const defaultAccountFilter = useMemo(() => {
    if (accounts.length === 0) return ALL_ACCOUNTS;

    const [firstAdded] = [...accounts].sort((a, b) => {
      const aTime = toDateValue(a.createdAt) || Number.MAX_SAFE_INTEGER;
      const bTime = toDateValue(b.createdAt) || Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });

    return firstAdded.id;
  }, [accounts]);

  const activeAccountFilter = accountFilter ?? defaultAccountFilter;

  const selectedAccount =
    activeAccountFilter === ALL_ACCOUNTS
      ? null
      : accountMap.get(activeAccountFilter) || null;

  // Opening balances are set per account in the Accounts tab. A single
  // account starts from its own; "All accounts" starts from their total,
  // dated from the earliest account opening.
  const effectiveOpening = useMemo<OpeningBalance>(() => {
    const getOpeningDate = (account: PaymentAccount) =>
      account.openingBalanceDate || toDateInputValue(account.createdAt);

    if (selectedAccount) {
      return {
        amount: toNumber(selectedAccount.openingBalance),
        date: getOpeningDate(selectedAccount),
      };
    }

    const openingDates = accounts
      .map(getOpeningDate)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    return {
      amount: accounts.reduce(
        (sum, account) => sum + toNumber(account.openingBalance),
        0,
      ),
      date: openingDates[0] || "",
    };
  }, [selectedAccount, accounts]);

  // The opening balance date set in the Accounts tab (the earliest one across
  // accounts for "All accounts"); "" when none is set.
  const openingBalanceDate = useMemo(() => {
    const dates = (selectedAccount ? [selectedAccount] : accounts)
      .map((account) => account.openingBalanceDate || "")
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    return dates[0] || "";
  }, [selectedAccount, accounts]);

  const balancedRows = useMemo(() => {
    // An account's opening balance is its balance on the opening balance
    // date, so earlier transactions on that account are already included in
    // it (matching the balances on the Accounts Dashboard). Undated rows are
    // always kept.
    const isBeforeAccountOpening = (row: StatementRow) =>
      Boolean(row.accountId) &&
      isBeforeOpeningDay(
        accountMap.get(row.accountId || "")?.openingBalanceDate,
        row.date,
      );

    const accountRows = rows.filter((row) =>
      selectedAccount
        ? row.accountId === selectedAccount.id
        : row.source !== "account_transfer",
    );
    const scopedRows = accountRows.filter(
      (row) => !isBeforeAccountOpening(row),
    );

    // Earlier transactions are only listed when a date filter is used to look
    // back past the opening date. Their balances are worked backwards from
    // the opening balance, which already includes them.
    const earlierRows: StatementRow[] = [];
    if (dateFrom || dateTo) {
      let balanceAfter = effectiveOpening.amount;
      const beforeOpening = accountRows.filter(isBeforeAccountOpening);

      for (let index = beforeOpening.length - 1; index >= 0; index -= 1) {
        const row = beforeOpening[index];
        earlierRows.unshift({
          ...row,
          beforeOpening: true,
          balance: balanceAfter,
        });
        balanceAfter -= toNumber(row.credit) - toNumber(row.debit);
      }
    }

    const openingRow: StatementRow = {
      id: "opening-balance",
      source: "opening",
      accountId: selectedAccount?.id,
      date: effectiveOpening.date,
      dateValue: toDateValue(effectiveOpening.date),
      sequenceValue: toDateValue(effectiveOpening.date),
      description: selectedAccount
        ? `Opening Balance - ${getAccountLabel(selectedAccount)}`
        : "Opening Balance",
      poNo: "",
      projectCode: "",
      debit: 0,
      credit: 0,
      balance: effectiveOpening.amount,
    };

    let runningBalance = effectiveOpening.amount;
    return [
      ...earlierRows,
      openingRow,
      ...scopedRows.map((row) => {
        runningBalance += toNumber(row.credit) - toNumber(row.debit);
        return { ...row, balance: runningBalance };
      }),
    ];
  }, [rows, selectedAccount, accountMap, effectiveOpening, dateFrom, dateTo]);

  const hasActiveFilters = Boolean(
    search.trim() ||
      dateFrom ||
      dateTo ||
      projectCodeFilter.trim() ||
      activeAccountFilter !== defaultAccountFilter,
  );

  const filteredRows = useMemo(() => {
    const queryText = search.trim().toLowerCase();
    const projectCodeQuery = projectCodeFilter.trim().toLowerCase();
    const fromTime = dateFrom
      ? new Date(`${dateFrom}T00:00:00`).getTime()
      : null;
    const toTime = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;

    return balancedRows.filter((row) => {
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
  }, [balancedRows, search, dateFrom, dateTo, projectCodeFilter]);

  const orderedFilteredRows = useMemo(() => {
    return [...filteredRows].sort((a, b) =>
      compareRowsBySequence(a, b, pageOrder),
    );
  }, [filteredRows, pageOrder]);

  // Filters narrow the set down to something manageable, so show everything
  // that matches immediately rather than making the user scroll to see their
  // own filtered results.
  const isIncrementalView = !hasActiveFilters;

  const visibleRows = useMemo(() => {
    if (!isIncrementalView) return orderedFilteredRows;
    return orderedFilteredRows.slice(0, visibleCount);
  }, [orderedFilteredRows, isIncrementalView, visibleCount]);

  const hasMoreToReveal =
    isIncrementalView && visibleCount < orderedFilteredRows.length;

  // Restart the reveal from the top whenever the underlying view changes
  // shape — a fresh data load, a sort flip, or returning to the unfiltered
  // view — so we never end up rendering a stale, oversized batch.
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_ROWS);
  }, [balancedRows, pageOrder, hasActiveFilters]);

  useEffect(() => {
    if (!hasMoreToReveal) return;
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsLoadingMore(true);
          // Data's already in memory, so revealing more is instant — this
          // small delay is purely so the loading animation is visible
          // instead of the row count jumping in with no transition.
          window.setTimeout(() => {
            setVisibleCount((prev) => prev + LOAD_MORE_BATCH);
            setIsLoadingMore(false);
          }, 350);
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreToReveal]);

  const exportStatement = (order: ExportOrder) => {
    const exportRows = [...filteredRows].sort((a, b) =>
      compareRowsBySequence(a, b, order),
    );

    if (exportRows.length === 0) {
      alert("No account statement entries available to export.");
      return;
    }

    const headers = [
      "Date",
      "Title",
      "Source",
      "Account",
      "PO No",
      "Project Code",
      "Cheque Number",
      "Debit",
      "Credit",
      "Balance",
    ];

    const csvRows = exportRows.map((row) =>
      [
        formatDate(row.date),
        row.description,
        row.source.replace(/_/g, " "),
        row.accountId ? getAccountLabel(accountMap.get(row.accountId)) : "",
        row.poNo || "",
        row.projectCode || "",
        row.chequeNumber || "",
        row.debit > 0 ? formatCurrency(row.debit) : "",
        row.credit > 0 ? formatCurrency(row.credit) : "",
        formatCurrency(row.balance || 0),
      ]
        .map(escapeCsvValue)
        .join(","),
    );

    const csvContent = [headers.map(escapeCsvValue).join(","), ...csvRows].join(
      "\n",
    );

    const blob = new Blob([`\ufeff${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fileDate = new Date().toISOString().slice(0, 10);

    link.href = url;
    const accountSuffix = selectedAccount
      ? `-${getAccountLabel(selectedAccount)
          .replace(/[^a-z0-9]+/gi, "-")
          .toLowerCase()}`
      : "";
    link.download = `account-statement${accountSuffix}-${order}-${fileDate}.csv`;
    link.click();

    URL.revokeObjectURL(url);
    setExportDialogOpen(false);
  };

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
      { debit: 0, credit: 0, balance: effectiveOpening.amount },
    );
  }, [filteredRows, effectiveOpening.amount]);

  const resetFilters = () => {
    setAccountFilter(null);
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setProjectCodeFilter("");
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
          accountId: manualForm.accountId,
          accountName: manualForm.accountId
            ? getAccountLabel(accountMap.get(manualForm.accountId))
            : "",
          entryType: credit > 0 ? "credit" : "debit",
          createdAt: serverTimestamp(),
          createdBy:
            userProfile?.displayName || currentUser?.email || "Unknown",
          createdById: currentUser?.uid || "",
        },
      );

      setManualForm(emptyManualForm);
      setManualDialogOpen(false);
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
            Track opening balance, received invoice payments, record cheque
            amounts, released expenses, release-payment cheque numbers,
            reimbursements, and manual entries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setExportDialogOpen(true)}
            disabled={loading || filteredRows.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>

          <Button variant="outline" onClick={refresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>

          <Button
            onClick={() => {
              setManualForm((prev) => ({
                ...prev,
                accountId: selectedAccount?.id || prev.accountId,
              }));
              setManualDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Manual Entry
          </Button>
        </div>
      </div>

      {failedSources.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          Statement may be incomplete: {failedSources.join(", ")} could not be
          loaded.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Opening Balance"
          value={`Rs ${formatCurrency(effectiveOpening.amount)}`}
          subtitle={
            openingBalanceDate
              ? `${selectedAccount ? "As of" : "Earliest:"} ${formatDate(
                  openingBalanceDate,
                )}`
              : "No opening balance date set"
          }
          icon={<CalendarDays className="h-5 w-5" />}
        />
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

          <div className="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto] lg:items-end">
            <div>
              <Label>Account</Label>
              <Select
                value={activeAccountFilter}
                onValueChange={setAccountFilter}
              >
                <SelectTrigger className="mt-2 bg-white">
                  <SelectValue placeholder="All Accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_ACCOUNTS}>All Accounts</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {getAccountOptionLabel(account)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-slate-500">
              Showing {orderedFilteredRows.length} of {balancedRows.length}{" "}
              entries,{" "}
              {pageOrder === "descending"
                ? "newest added first"
                : "oldest added first"}
              {selectedAccount ? ` in ${getAccountLabel(selectedAccount)}` : ""}
              {projectCodeFilter.trim()
                ? ` for project code ${projectCodeFilter.trim()}`
                : ""}
              .
              {isIncrementalView && orderedFilteredRows.length > 0 && (
                <span className="ml-1 text-slate-400">
                  ({visibleRows.length} loaded
                  {hasMoreToReveal ? " — scroll for more" : ""})
                </span>
              )}
            </div>

            <div className="inline-flex w-fit rounded-xl border border-slate-200 bg-white p-1">
              <Button
                type="button"
                size="sm"
                variant={pageOrder === "descending" ? "default" : "ghost"}
                onClick={() => setPageOrder("descending")}
                className="rounded-lg"
              >
                Descending - latest on top
              </Button>

              <Button
                type="button"
                size="sm"
                variant={pageOrder === "ascending" ? "default" : "ghost"}
                onClick={() => setPageOrder("ascending")}
                className="rounded-lg"
              >
                Ascending - latest at bottom
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-[1120px] w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Title</th>
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
                  Array.from({ length: 8 }).map((_, index) => (
                    <tr
                      key={`initial-skeleton-${index}`}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-4 py-3">
                        <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
                        <div className="mt-1.5 h-3 w-20 animate-pulse rounded bg-slate-100" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-14 animate-pulse rounded bg-slate-200" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-14 animate-pulse rounded bg-slate-200" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-14 animate-pulse rounded bg-slate-200" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="ml-auto h-4 w-16 animate-pulse rounded bg-slate-200" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="ml-auto h-4 w-16 animate-pulse rounded bg-slate-200" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="ml-auto h-4 w-20 animate-pulse rounded bg-slate-200" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="ml-auto h-4 w-6 animate-pulse rounded bg-slate-200" />
                      </td>
                    </tr>
                  ))
                ) : orderedFilteredRows.length > 0 ? (
                  <>
                    {visibleRows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                          {formatDate(row.date)}
                        </td>
                        <td className="px-4 py-3 text-slate-900">
                          <div className="font-medium">{row.description}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            <span className="capitalize">
                              {row.source.replace(/_/g, " ")}
                            </span>
                            {!selectedAccount && row.accountId && (
                              <span>
                                {" · "}
                                {getAccountLabel(accountMap.get(row.accountId))}
                              </span>
                            )}
                            {row.beforeOpening && (
                              <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                                Before opening balance
                              </span>
                            )}
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
                    ))}

                    {hasMoreToReveal && (
                      <tr ref={loadMoreSentinelRef}>
                        <td colSpan={9} className="px-4 py-4">
                          {isLoadingMore ? (
                            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-500" />
                              Loading more entries...
                            </div>
                          ) : (
                            <div className="h-1" />
                          )}
                        </td>
                      </tr>
                    )}
                  </>
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

      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Account Statement</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              Select the sequence for your exported file. This will not change
              the selected sequence on the page.
            </p>

            <Button
              className="w-full justify-start gap-2"
              onClick={() => exportStatement("descending")}
            >
              <ArrowDownCircle className="h-4 w-4" />
              Descending - latest added on top
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => exportStatement("ascending")}
            >
              <ArrowUpCircle className="h-4 w-4" />
              Ascending - latest added at bottom
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
              <Label>Account</Label>
              <Select
                value={manualForm.accountId || NO_ACCOUNT}
                onValueChange={(value) =>
                  setManualForm((prev) => ({
                    ...prev,
                    accountId: value === NO_ACCOUNT ? "" : value,
                  }))
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_ACCOUNT}>
                    No specific account
                  </SelectItem>
                  {accounts
                    .filter(
                      (account) =>
                        account.isActive !== false ||
                        account.id === manualForm.accountId,
                    )
                    .map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {getAccountOptionLabel(account)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
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
