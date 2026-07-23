// import { useEffect, useMemo, useState } from "react";
// import {
//   arrayUnion,
//   deleteField,
//   doc,
//   serverTimestamp,
//   updateDoc,
// } from "firebase/firestore";
// import {
//   CheckCircle2,
//   Loader2,
//   Plus,
//   Save,
//   Trash2,
//   X,
// } from "lucide-react";
// import { InvoiceRequest } from "@shared/schema";
// import { db } from "@/lib/firebase";
// import { useAuth } from "@/contexts/AuthContext";
// import { useToast } from "@/hooks/use-toast";
// import { Button } from "@/components/ui/button";
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

// const PANEL_ID = "IEDGE-SYSTEM";

// interface PaymentHistoryModalProps {
//   isOpen: boolean;
//   invoice: InvoiceRequest | null;
//   onClose: () => void;
//   onSuccess?: () => void;
//   canEdit?: boolean;
// }

// interface EditablePaymentEntry {
//   rowKey: string;
//   id: string;
//   original: Record<string, any>;
//   amount: string;
//   paymentMethod: string;
//   releasedAtInput: string;
//   transactionName: string;
//   transactionReference: string;
//   chequeNumbersText: string;
//   paymentNotes: string;
// }

// function safeNumber(value: any) {
//   const parsed = Number(String(value ?? 0).replace(/,/g, ""));
//   return Number.isFinite(parsed) ? parsed : 0;
// }

// function roundMoney(value: any) {
//   return Math.round(safeNumber(value) * 100) / 100;
// }

// function formatPKR(value: any) {
//   return safeNumber(value).toLocaleString("en-PK", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });
// }

// function normalizeText(value: any) {
//   return String(value || "")
//     .trim()
//     .toLowerCase();
// }

// function createPaymentId() {
//   return `payment-${Date.now()}-${Math.random()
//     .toString(36)
//     .slice(2, 10)}`;
// }

// function getPaymentAmount(entry: any) {
//   return roundMoney(
//     entry?.amount ??
//       entry?.releaseAmount ??
//       entry?.releasedAmount ??
//       entry?.paymentAmount ??
//       0,
//   );
// }

// function getApprovedAmount(invoice: any) {
//   return roundMoney(
//     invoice?.approvedAmount ??
//       invoice?.totalApprovedAmount ??
//       invoice?.approvedTotal ??
//       invoice?.totalAmount ??
//       invoice?.amount ??
//       0,
//   );
// }

// /**
//  * This intentionally does not filter zero-value entries.
//  *
//  * An entry with a missing amount must remain visible so Finance/Admin can
//  * correct it from the Payment History editor.
//  */
// function getRawPaymentHistory(invoice: any): any[] {
//   if (Array.isArray(invoice?.paymentReleaseHistory)) {
//     return invoice.paymentReleaseHistory;
//   }

//   const legacyPayment =
//     invoice?.paymentDetails || invoice?.latestPaymentRelease;

//   if (!legacyPayment) return [];

//   return [
//     {
//       ...legacyPayment,
//       id: legacyPayment?.id || createPaymentId(),
//       releasedAt:
//         legacyPayment?.releasedAt ||
//         invoice?.paymentReleasedAt ||
//         invoice?.releasePaymentAt ||
//         invoice?.updatedAt ||
//         null,
//     },
//   ];
// }

// function getDateFromValue(value: any): Date | null {
//   if (!value) return null;

//   if (value instanceof Date) {
//     return Number.isNaN(value.getTime()) ? null : value;
//   }

//   if (typeof value?.toDate === "function") {
//     const date = value.toDate();
//     return Number.isNaN(date?.getTime?.()) ? null : date;
//   }

//   if (typeof value?.seconds === "number") {
//     const date = new Date(value.seconds * 1000);
//     return Number.isNaN(date.getTime()) ? null : date;
//   }

//   const date = new Date(value);
//   return Number.isNaN(date.getTime()) ? null : date;
// }

// function toDateTimeLocalValue(value: any) {
//   const date = getDateFromValue(value) || new Date();
//   const offsetMilliseconds = date.getTimezoneOffset() * 60 * 1000;
//   const localDate = new Date(date.getTime() - offsetMilliseconds);

//   return localDate.toISOString().slice(0, 16);
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

// function getPaymentWorkflowBaseStatus(invoice: any): string {
//   const savedStatus = String(
//     invoice?.paymentWorkflowBaseStatus || "",
//   ).trim();

//   if (savedStatus) return savedStatus;

//   const currentStatus = normalizeText(invoice?.status);

//   if (
//     currentStatus &&
//     !["payment_released", "payment_partially_released"].includes(
//       currentStatus,
//     )
//   ) {
//     return String(invoice.status);
//   }

//   const isProjectRequest = Boolean(
//     invoice?.invoiceType === "project" ||
//       invoice?.type === "project" ||
//       invoice?.clientName ||
//       invoice?.project ||
//       invoice?.projectName ||
//       invoice?.projectCode,
//   );

//   const hasPurchaseOrder = Boolean(
//     invoice?.poId ||
//       invoice?.poNumber ||
//       invoice?.poDocId ||
//       invoice?.purchaseOrderId ||
//       invoice?.purchaseOrderNumber ||
//       invoice?.poCreated ||
//       invoice?.poSubmitted ||
//       invoice?.purchaseOrderCreated,
//   );

//   if (isProjectRequest && hasPurchaseOrder) {
//     return "ready_for_payment";
//   }

//   return "approved";
// }

// function getPaymentWorkflowBasePaymentStatus(invoice: any): string {
//   const savedStatus = String(
//     invoice?.paymentWorkflowBasePaymentStatus || "",
//   ).trim();

//   if (savedStatus) return savedStatus;

//   const currentPaymentStatus = normalizeText(invoice?.paymentStatus);

//   if (
//     ![
//       "released",
//       "partial",
//       "payment_released",
//       "payment_partially_released",
//     ].includes(currentPaymentStatus)
//   ) {
//     return String(invoice?.paymentStatus || "");
//   }

//   return "";
// }

// function buildEditableEntry(
//   entry: any,
//   index: number,
// ): EditablePaymentEntry {
//   const chequeNumbers = Array.isArray(entry?.chequeNumbers)
//     ? entry.chequeNumbers
//     : entry?.chequeNumber
//       ? [entry.chequeNumber]
//       : [];

//   const entryId = String(entry?.id || createPaymentId());

//   return {
//     rowKey: `${entryId}-${index}-${Math.random()
//       .toString(36)
//       .slice(2, 7)}`,
//     id: entryId,
//     original: entry || {},
//     amount: String(getPaymentAmount(entry) || ""),
//     paymentMethod: entry?.paymentMethod || "bank_transfer",
//     releasedAtInput: toDateTimeLocalValue(entry?.releasedAt),
//     transactionName: String(entry?.transactionName || ""),
//     transactionReference: String(
//       entry?.transactionReference ||
//         entry?.referenceNumber ||
//         entry?.reference ||
//         "",
//     ),
//     chequeNumbersText: chequeNumbers.join(", "),
//     paymentNotes: String(entry?.paymentNotes || entry?.notes || ""),
//   };
// }

// export default function PaymentHistoryModal({
//   isOpen,
//   invoice,
//   onClose,
//   onSuccess,
//   canEdit = true,
// }: PaymentHistoryModalProps) {
//   const { userProfile, currentUser } = useAuth();
//   const { toast } = useToast();

//   const [entries, setEntries] = useState<EditablePaymentEntry[]>([]);
//   const [saving, setSaving] = useState(false);

//   useEffect(() => {
//     if (!isOpen || !invoice) {
//       setEntries([]);
//       return;
//     }

//     setEntries(
//       getRawPaymentHistory(invoice).map((entry, index) =>
//         buildEditableEntry(entry, index),
//       ),
//     );
//   }, [isOpen, invoice]);

//   const approvedAmount = useMemo(
//     () => getApprovedAmount(invoice),
//     [invoice],
//   );

//   const draftReleasedAmount = useMemo(() => {
//     return roundMoney(
//       entries.reduce(
//         (sum, entry) => sum + safeNumber(entry.amount),
//         0,
//       ),
//     );
//   }, [entries]);

//   const draftRemainingAmount = useMemo(() => {
//     return roundMoney(
//       Math.max(approvedAmount - draftReleasedAmount, 0),
//     );
//   }, [approvedAmount, draftReleasedAmount]);

//   const exceedsApprovedAmount =
//     approvedAmount > 0 &&
//     draftReleasedAmount > approvedAmount + 0.009;

//   function updateEntry(
//     rowKey: string,
//     field: keyof EditablePaymentEntry,
//     value: string,
//   ) {
//     setEntries((previousEntries) =>
//       previousEntries.map((entry) =>
//         entry.rowKey === rowKey
//           ? {
//               ...entry,
//               [field]: value,
//             }
//           : entry,
//       ),
//     );
//   }

//   function addMissingPayment() {
//     const newEntry: EditablePaymentEntry = {
//       rowKey: `new-${Date.now()}-${Math.random()
//         .toString(36)
//         .slice(2, 8)}`,
//       id: createPaymentId(),
//       original: {},
//       amount: "",
//       paymentMethod: "bank_transfer",
//       releasedAtInput: toDateTimeLocalValue(new Date()),
//       transactionName: "",
//       transactionReference: "",
//       chequeNumbersText: "",
//       paymentNotes: "",
//     };

//     setEntries((previousEntries) => [
//       ...previousEntries,
//       newEntry,
//     ]);
//   }

//   function removeEntry(rowKey: string) {
//     const entry = entries.find(
//       (paymentEntry) => paymentEntry.rowKey === rowKey,
//     );

//     if (!entry) return;

//     const isExistingEntry = Object.keys(entry.original || {}).length > 0;

//     if (
//       isExistingEntry &&
//       !window.confirm(
//         "Remove this payment entry? The released amount and remaining balance will be recalculated.",
//       )
//     ) {
//       return;
//     }

//     setEntries((previousEntries) =>
//       previousEntries.filter(
//         (paymentEntry) => paymentEntry.rowKey !== rowKey,
//       ),
//     );
//   }

//   async function savePaymentHistory() {
//     if (!invoice?.id) {
//       toast({
//         title: "Error",
//         description: "The selected budget request is invalid.",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!canEdit) {
//       toast({
//         title: "Permission denied",
//         description:
//           "You do not have permission to update payment history.",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (approvedAmount <= 0) {
//       toast({
//         title: "Approved amount missing",
//         description:
//           "The approved amount must be available before payment history can be updated.",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (exceedsApprovedAmount) {
//       toast({
//         title: "Amount exceeds approved value",
//         description: `The total payment history cannot exceed Rs ${formatPKR(
//           approvedAmount,
//         )}.`,
//         variant: "destructive",
//       });
//       return;
//     }

//     const normalizedEntries: any[] = [];

//     for (let index = 0; index < entries.length; index += 1) {
//       const entry = entries[index];
//       const amount = roundMoney(entry.amount);

//       if (amount <= 0) {
//         toast({
//           title: "Invalid amount",
//           description: `Enter a valid amount for payment entry ${
//             index + 1
//           }.`,
//           variant: "destructive",
//         });
//         return;
//       }

//       if (!entry.releasedAtInput) {
//         toast({
//           title: "Payment date required",
//           description: `Select a payment date for entry ${
//             index + 1
//           }.`,
//           variant: "destructive",
//         });
//         return;
//       }

//       const releasedAt = new Date(entry.releasedAtInput);

//       if (Number.isNaN(releasedAt.getTime())) {
//         toast({
//           title: "Invalid payment date",
//           description: `The payment date for entry ${
//             index + 1
//           } is invalid.`,
//           variant: "destructive",
//         });
//         return;
//       }

//       const chequeNumbers = entry.chequeNumbersText
//         .split(/[\n,]/g)
//         .map((value) => value.trim())
//         .filter(Boolean);

//       normalizedEntries.push({
//         ...entry.original,
//         id: entry.id || createPaymentId(),
//         amount,
//         paymentMethod: entry.paymentMethod,
//         transactionName: entry.transactionName.trim(),
//         transactionReference:
//           entry.transactionReference.trim(),
//         chequeNumber: chequeNumbers[0] || "",
//         chequeNumbers,
//         paymentNotes: entry.paymentNotes.trim(),
//         releasedAt,

//         releasedBy:
//           entry.original?.releasedBy ||
//           userProfile?.id ||
//           currentUser?.uid ||
//           "",

//         releasedByName:
//           entry.original?.releasedByName ||
//           userProfile?.displayName ||
//           currentUser?.displayName ||
//           currentUser?.email ||
//           "Unknown",

//         releasedByEmail:
//           entry.original?.releasedByEmail ||
//           currentUser?.email ||
//           userProfile?.email ||
//           "",

//         paymentHistoryEdited: true,
//         paymentHistoryEditedAt: new Date(),
//         paymentHistoryEditedBy:
//           userProfile?.id || currentUser?.uid || "",
//         paymentHistoryEditedByName:
//           userProfile?.displayName ||
//           currentUser?.displayName ||
//           currentUser?.email ||
//           "",
//       });
//     }

//     normalizedEntries.sort((firstEntry, secondEntry) => {
//       return (
//         firstEntry.releasedAt.getTime() -
//         secondEntry.releasedAt.getTime()
//       );
//     });

//     let runningReleasedAmount = 0;

//     const recalculatedHistory = normalizedEntries.map(
//       (entry) => {
//         const releaseAmount = roundMoney(entry.amount);
//         const releasedBefore = roundMoney(
//           runningReleasedAmount,
//         );
//         const releasedAfter = roundMoney(
//           releasedBefore + releaseAmount,
//         );
//         const remainingAfter = roundMoney(
//           Math.max(approvedAmount - releasedAfter, 0),
//         );

//         const isFinalPayment = remainingAfter <= 0.009;

//         const releaseType =
//           releasedBefore <= 0.009
//             ? isFinalPayment
//               ? "full"
//               : "advance"
//             : isFinalPayment
//               ? "final"
//               : "partial";

//         runningReleasedAmount = releasedAfter;

//         return {
//           ...entry,
//           amount: releaseAmount,
//           approvedAmount,
//           releasedBefore,
//           releasedAfter,
//           remainingAfter,
//           releaseType,
//         };
//       },
//     );

//     const totalReleasedAmount = roundMoney(
//       runningReleasedAmount,
//     );

//     if (
//       totalReleasedAmount >
//       approvedAmount + 0.009
//     ) {
//       toast({
//         title: "Amount exceeds approved value",
//         description: `The total released amount cannot exceed Rs ${formatPKR(
//           approvedAmount,
//         )}.`,
//         variant: "destructive",
//       });
//       return;
//     }

//     const remainingReleaseAmount = roundMoney(
//       Math.max(
//         approvedAmount - totalReleasedAmount,
//         0,
//       ),
//     );

//     const hasPayments = recalculatedHistory.length > 0;
//     const isFullyReleased =
//       approvedAmount > 0 &&
//       hasPayments &&
//       remainingReleaseAmount <= 0.009;

//     const latestPaymentRelease =
//       recalculatedHistory[
//         recalculatedHistory.length - 1
//       ] || null;

//     const currentStatus = normalizeText(invoice.status);
//     const preserveLaterWorkflowStatus = [
//       "expense_submitted",
//       "expense_completed",
//     ].includes(currentStatus);

//     const paymentWorkflowBaseStatus =
//       getPaymentWorkflowBaseStatus(invoice);

//     const paymentWorkflowBasePaymentStatus =
//       getPaymentWorkflowBasePaymentStatus(invoice);

//     let nextRequestStatus = paymentWorkflowBaseStatus;

//     if (preserveLaterWorkflowStatus) {
//       nextRequestStatus = String(invoice.status);
//     } else if (isFullyReleased) {
//       nextRequestStatus = "payment_released";
//     } else if (hasPayments) {
//       nextRequestStatus =
//         "payment_partially_released";
//     }

//     const nextPaymentStatus = isFullyReleased
//       ? "released"
//       : hasPayments
//         ? "partial"
//         : paymentWorkflowBasePaymentStatus || "pending";

//     const previousReleasedAmount = roundMoney(
//       getRawPaymentHistory(invoice).reduce(
//         (sum, entry) =>
//           sum + getPaymentAmount(entry),
//         0,
//       ),
//     );

//     const updatePayload: Record<string, any> = {
//       paymentReleaseHistory: recalculatedHistory,

//       totalApprovedAmount: approvedAmount,
//       totalReleasedAmount,
//       remainingReleaseAmount,

//       paymentReleased: isFullyReleased,
//       paymentPartiallyReleased:
//         hasPayments && !isFullyReleased,
//       releasePaymentCreated: hasPayments,

//       status: nextRequestStatus,
//       paymentStatus: nextPaymentStatus,

//       paymentWorkflowBaseStatus,
//       paymentWorkflowBasePaymentStatus,

//       paymentHistoryVersion: 2,
//       paymentHistoryUpdatedAt: serverTimestamp(),
//       paymentHistoryUpdatedBy:
//         userProfile?.id || currentUser?.uid || "",
//       paymentHistoryUpdatedByName:
//         userProfile?.displayName ||
//         currentUser?.displayName ||
//         currentUser?.email ||
//         "",

//       paymentHistoryAuditTrail: arrayUnion({
//         action: "payment_history_updated",
//         previousReleasedAmount,
//         newReleasedAmount: totalReleasedAmount,
//         previousEntryCount:
//           getRawPaymentHistory(invoice).length,
//         newEntryCount: recalculatedHistory.length,
//         updatedBy:
//           userProfile?.id || currentUser?.uid || "",
//         updatedByName:
//           userProfile?.displayName ||
//           currentUser?.displayName ||
//           currentUser?.email ||
//           "",
//         updatedAt: new Date(),
//       }),

//       updatedAt: serverTimestamp(),
//     };

//     if (latestPaymentRelease) {
//       updatePayload.latestPaymentRelease =
//         latestPaymentRelease;
//       updatePayload.paymentDetails =
//         latestPaymentRelease;
//       updatePayload.transactionName =
//         latestPaymentRelease.transactionName || "";
//       updatePayload.latestTransactionName =
//         latestPaymentRelease.transactionName || "";
//     } else {
//       updatePayload.latestPaymentRelease =
//         deleteField();
//       updatePayload.paymentDetails = deleteField();
//       updatePayload.transactionName = deleteField();
//       updatePayload.latestTransactionName =
//         deleteField();
//     }

//     if (isFullyReleased && latestPaymentRelease) {
//       updatePayload.paymentReleasedAt =
//         latestPaymentRelease.releasedAt;
//       updatePayload.releasePaymentAt =
//         latestPaymentRelease.releasedAt;
//       updatePayload.paymentFullyReleasedAt =
//         latestPaymentRelease.releasedAt;
//     } else {
//       updatePayload.paymentReleasedAt =
//         deleteField();
//       updatePayload.releasePaymentAt = deleteField();
//       updatePayload.paymentFullyReleasedAt =
//         deleteField();
//     }

//     if (hasPayments && !isFullyReleased) {
//       updatePayload.partialPaymentReleasedAt =
//         latestPaymentRelease?.releasedAt ||
//         serverTimestamp();
//     } else if (!hasPayments) {
//       updatePayload.partialPaymentReleasedAt =
//         deleteField();
//     }

//     try {
//       setSaving(true);

//       await updateDoc(
//         doc(
//           db,
//           "Panels",
//           PANEL_ID,
//           "invoiceRequests",
//           invoice.id,
//         ),
//         updatePayload,
//       );

//       toast({
//         title: "Payment history updated",
//         description:
//           "Payment entries and all related calculations were updated successfully.",
//       });

//       onSuccess?.();
//       onClose();
//     } catch (error: any) {
//       console.error(
//         "Failed to update payment history:",
//         error,
//       );

//       toast({
//         title: "Error",
//         description:
//           error?.message ||
//           "Failed to update payment history.",
//         variant: "destructive",
//       });
//     } finally {
//       setSaving(false);
//     }
//   }

//   if (!isOpen || !invoice) return null;

//   return (
//     <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/55 px-4 py-6">
//       <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
//         <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-slate-200 bg-white/95 p-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
//           <div>
//             <div className="flex flex-wrap items-center gap-2">
//               <h2 className="text-xl font-semibold text-slate-950">
//                 Payment Release History
//               </h2>

//               <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
//                 Editable History
//               </span>
//             </div>

//             <p className="mt-1 text-sm text-slate-500">
//               Request ID: {invoice.requestId || "-"}
//             </p>
//           </div>

//           <div className="flex flex-wrap gap-2">
//             {canEdit && (
//               <Button
//                 type="button"
//                 variant="outline"
//                 className="rounded-2xl border-slate-200"
//                 onClick={addMissingPayment}
//                 disabled={saving}
//               >
//                 <Plus className="mr-2 h-4 w-4" />
//                 Add Missing Payment
//               </Button>
//             )}

//             <Button
//               type="button"
//               variant="outline"
//               size="icon"
//               className="rounded-full border-slate-200"
//               onClick={onClose}
//               disabled={saving}
//             >
//               <X className="h-4 w-4" />
//             </Button>
//           </div>
//         </div>

//         <div className="grid gap-4 border-b border-slate-100 p-5 md:grid-cols-3">
//           <div className="rounded-2xl bg-slate-50 p-4">
//             <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//               Total Approved
//             </p>
//             <p className="mt-2 text-xl font-semibold text-slate-950">
//               Rs {formatPKR(approvedAmount)}
//             </p>
//           </div>

//           <div className="rounded-2xl bg-slate-50 p-4">
//             <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//               Released After Changes
//             </p>
//             <p className="mt-2 text-xl font-semibold text-slate-950">
//               Rs {formatPKR(draftReleasedAmount)}
//             </p>
//           </div>

//           <div
//             className={`rounded-2xl p-4 ${
//               exceedsApprovedAmount
//                 ? "border border-red-200 bg-red-50"
//                 : "bg-slate-50"
//             }`}
//           >
//             <p
//               className={`text-xs font-semibold uppercase tracking-wide ${
//                 exceedsApprovedAmount
//                   ? "text-red-600"
//                   : "text-slate-500"
//               }`}
//             >
//               Remaining Balance
//             </p>
//             <p
//               className={`mt-2 text-xl font-semibold ${
//                 exceedsApprovedAmount
//                   ? "text-red-700"
//                   : "text-slate-950"
//               }`}
//             >
//               Rs {formatPKR(draftRemainingAmount)}
//             </p>
//           </div>
//         </div>

//         {exceedsApprovedAmount && (
//           <div className="mx-5 mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
//             The payment history exceeds the approved
//             amount by Rs{" "}
//             {formatPKR(
//               draftReleasedAmount - approvedAmount,
//             )}
//             .
//           </div>
//         )}

//         <div className="space-y-5 p-5">
//           {entries.length === 0 ? (
//             <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
//               <CheckCircle2 className="mx-auto h-9 w-9 text-slate-400" />

//               <p className="mt-4 font-semibold text-slate-800">
//                 No payment entries recorded
//               </p>

//               <p className="mt-1 text-sm text-slate-500">
//                 Add a missing payment entry to update
//                 the request history.
//               </p>

//               {canEdit && (
//                 <Button
//                   type="button"
//                   className="mt-5 rounded-2xl"
//                   onClick={addMissingPayment}
//                 >
//                   <Plus className="mr-2 h-4 w-4" />
//                   Add Payment Entry
//                 </Button>
//               )}
//             </div>
//           ) : (
//             entries.map((entry, index) => (
//               <section
//                 key={entry.rowKey}
//                 className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
//               >
//                 <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//                   <div>
//                     <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       Payment Entry {index + 1}
//                     </p>

//                     <p className="mt-1 text-sm font-semibold text-slate-950">
//                       {getPaymentMethodLabel(
//                         entry.paymentMethod,
//                       )}{" "}
//                       · Rs {formatPKR(entry.amount)}
//                     </p>
//                   </div>

//                   {canEdit && (
//                     <Button
//                       type="button"
//                       variant="outline"
//                       size="sm"
//                       className="rounded-xl border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
//                       onClick={() =>
//                         removeEntry(entry.rowKey)
//                       }
//                     >
//                       <Trash2 className="mr-2 h-4 w-4" />
//                       Remove
//                     </Button>
//                   )}
//                 </div>

//                 <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
//                   <div className="space-y-2">
//                     <Label>Payment Amount</Label>
//                     <Input
//                       type="number"
//                       min="0"
//                       step="0.01"
//                       value={entry.amount}
//                       readOnly={!canEdit}
//                       onChange={(event) =>
//                         updateEntry(
//                           entry.rowKey,
//                           "amount",
//                           event.target.value,
//                         )
//                       }
//                       className="h-11 rounded-2xl border-slate-200"
//                     />
//                   </div>

//                   <div className="space-y-2">
//                     <Label>Payment Date and Time</Label>
//                     <Input
//                       type="datetime-local"
//                       value={entry.releasedAtInput}
//                       readOnly={!canEdit}
//                       onChange={(event) =>
//                         updateEntry(
//                           entry.rowKey,
//                           "releasedAtInput",
//                           event.target.value,
//                         )
//                       }
//                       className="h-11 rounded-2xl border-slate-200"
//                     />
//                   </div>

//                   <div className="space-y-2">
//                     <Label>Payment Method</Label>
//                     <Select
//                       disabled={!canEdit}
//                       value={entry.paymentMethod}
//                       onValueChange={(value) =>
//                         updateEntry(
//                           entry.rowKey,
//                           "paymentMethod",
//                           value,
//                         )
//                       }
//                     >
//                       <SelectTrigger className="h-11 rounded-2xl border-slate-200">
//                         <SelectValue placeholder="Select method" />
//                       </SelectTrigger>

//                       <SelectContent>
//                         <SelectItem value="cash">
//                           Cash
//                         </SelectItem>
//                         <SelectItem value="cheque">
//                           Cheque
//                         </SelectItem>
//                         <SelectItem value="bank_transfer">
//                           Bank Transfer
//                         </SelectItem>
//                         <SelectItem value="wire">
//                           Online Transfer
//                         </SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   <div className="space-y-2">
//                     <Label>Transaction Name</Label>
//                     <Input
//                       value={entry.transactionName}
//                       readOnly={!canEdit}
//                       placeholder="Enter transaction name"
//                       onChange={(event) =>
//                         updateEntry(
//                           entry.rowKey,
//                           "transactionName",
//                           event.target.value,
//                         )
//                       }
//                       className="h-11 rounded-2xl border-slate-200"
//                     />
//                   </div>

//                   <div className="space-y-2">
//                     <Label>Reference</Label>
//                     <Input
//                       value={
//                         entry.transactionReference
//                       }
//                       readOnly={!canEdit}
//                       placeholder="Enter transaction reference"
//                       onChange={(event) =>
//                         updateEntry(
//                           entry.rowKey,
//                           "transactionReference",
//                           event.target.value,
//                         )
//                       }
//                       className="h-11 rounded-2xl border-slate-200"
//                     />
//                   </div>

//                   <div className="space-y-2">
//                     <Label>Cheque Numbers</Label>
//                     <Input
//                       value={entry.chequeNumbersText}
//                       readOnly={!canEdit}
//                       placeholder="10001, 10002"
//                       onChange={(event) =>
//                         updateEntry(
//                           entry.rowKey,
//                           "chequeNumbersText",
//                           event.target.value,
//                         )
//                       }
//                       className="h-11 rounded-2xl border-slate-200"
//                     />

//                     <p className="text-xs text-slate-500">
//                       Separate multiple cheque numbers
//                       with commas.
//                     </p>
//                   </div>

//                   <div className="space-y-2 md:col-span-2 xl:col-span-3">
//                     <Label>Payment Notes</Label>
//                     <Textarea
//                       rows={4}
//                       value={entry.paymentNotes}
//                       readOnly={!canEdit}
//                       placeholder="Enter payment notes"
//                       onChange={(event) =>
//                         updateEntry(
//                           entry.rowKey,
//                           "paymentNotes",
//                           event.target.value,
//                         )
//                       }
//                       className="rounded-2xl border-slate-200"
//                     />
//                   </div>

//                   {entry.original?.releasedByName && (
//                     <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 md:col-span-2 xl:col-span-3">
//                       Originally released by:{" "}
//                       <span className="font-semibold text-slate-900">
//                         {entry.original.releasedByName}
//                       </span>
//                     </div>
//                   )}
//                 </div>
//               </section>
//             ))
//           )}
//         </div>

//         <div className="sticky bottom-0 flex flex-col gap-3 border-t border-slate-200 bg-white/95 p-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
//           <p className="text-sm text-slate-500">
//             Approval history, current approver, and
//             request ownership will not be changed.
//           </p>

//           <div className="flex gap-2">
//             <Button
//               type="button"
//               variant="outline"
//               className="rounded-2xl border-slate-200"
//               onClick={onClose}
//               disabled={saving}
//             >
//               Cancel
//             </Button>

//             {canEdit && (
//               <Button
//                 type="button"
//                 className="rounded-2xl bg-slate-950 px-6 text-white hover:bg-slate-800"
//                 onClick={savePaymentHistory}
//                 disabled={
//                   saving || exceedsApprovedAmount
//                 }
//               >
//                 {saving ? (
//                   <>
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                     Saving...
//                   </>
//                 ) : (
//                   <>
//                     <Save className="mr-2 h-4 w-4" />
//                     Save Payment History
//                   </>
//                 )}
//               </Button>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


import { useEffect, useMemo, useState } from "react";
import {
  arrayUnion,
  deleteField,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  CheckCircle2,
  Loader2,
  Save,
  X,
} from "lucide-react";
import { InvoiceRequest } from "@shared/schema";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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

const PANEL_ID = "IEDGE-SYSTEM";

interface PaymentHistoryModalProps {
  isOpen: boolean;
  invoice: InvoiceRequest | null;
  onClose: () => void;
  onSuccess?: () => void;

  /**
   * The parent page should pass true only when editing is allowed.
   * This component also performs its own Finance-role validation.
   */
  canEdit?: boolean;
}

interface EditablePaymentEntry {
  rowKey: string;
  id: string;
  original: Record<string, any>;
  amount: string;
  paymentMethod: string;
  releasedAtInput: string;
  transactionName: string;
  transactionReference: string;
  chequeNumbersText: string;
  paymentNotes: string;
}

type EditablePaymentField =
  | "amount"
  | "paymentMethod"
  | "releasedAtInput"
  | "transactionName"
  | "transactionReference"
  | "chequeNumbersText"
  | "paymentNotes";

function safeNumber(value: any) {
  const parsed = Number(
    String(value ?? 0).replace(/,/g, ""),
  );

  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value: any) {
  return Math.round(safeNumber(value) * 100) / 100;
}

function formatPKR(value: any) {
  return safeNumber(value).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function normalizeText(value: any) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getRoleKey(role: any): string {
  return String(role || "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");
}

function isFinanceRole(role: any): boolean {
  return [
    "finance",
    "financial_admin",
    "finance_admin",
  ].includes(getRoleKey(role));
}

function createPaymentId() {
  return `payment-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function getPaymentAmount(entry: any) {
  return roundMoney(
    entry?.amount ??
      entry?.releaseAmount ??
      entry?.releasedAmount ??
      entry?.paymentAmount ??
      0,
  );
}

function getApprovedAmount(invoice: any) {
  return roundMoney(
    invoice?.approvedAmount ??
      invoice?.totalApprovedAmount ??
      invoice?.approvedTotal ??
      invoice?.totalAmount ??
      invoice?.amount ??
      0,
  );
}

/**
 * Returns every saved payment-history entry, including entries with missing
 * or zero amounts, so Finance can correct existing records.
 *
 * This editor does not provide Add or Remove actions.
 */
function getRawPaymentHistory(invoice: any): any[] {
  const savedHistory = Array.isArray(
    invoice?.paymentReleaseHistory,
  )
    ? invoice.paymentReleaseHistory
    : [];

  if (savedHistory.length > 0) {
    return savedHistory;
  }

  // Backward compatibility for older records that only contain one payment.
  const legacyPayment =
    invoice?.paymentDetails ||
    invoice?.latestPaymentRelease;

  if (!legacyPayment) {
    return [];
  }

  return [
    {
      ...legacyPayment,

      id:
        legacyPayment?.id ||
        createPaymentId(),

      releasedAt:
        legacyPayment?.releasedAt ||
        invoice?.paymentReleasedAt ||
        invoice?.releasePaymentAt ||
        invoice?.updatedAt ||
        null,
    },
  ];
}

function getDateFromValue(value: any): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : value;
  }

  if (typeof value?.toDate === "function") {
    const date = value.toDate();

    return Number.isNaN(
      date?.getTime?.(),
    )
      ? null
      : date;
  }

  if (typeof value?.seconds === "number") {
    const date = new Date(
      value.seconds * 1000,
    );

    return Number.isNaN(date.getTime())
      ? null
      : date;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function toDateTimeLocalValue(value: any) {
  const date =
    getDateFromValue(value) || new Date();

  const offsetMilliseconds =
    date.getTimezoneOffset() * 60 * 1000;

  const localDate = new Date(
    date.getTime() - offsetMilliseconds,
  );

  return localDate
    .toISOString()
    .slice(0, 16);
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

/**
 * Finds the request status that existed before payment processing began.
 * Approval history, current approver, ownership, and approval dates are not
 * modified by this component.
 */
function getPaymentWorkflowBaseStatus(
  invoice: any,
): string {
  const savedStatus = String(
    invoice?.paymentWorkflowBaseStatus || "",
  ).trim();

  if (savedStatus) {
    return savedStatus;
  }

  const currentStatus = normalizeText(
    invoice?.status,
  );

  if (
    currentStatus &&
    ![
      "payment_released",
      "payment_partially_released",
    ].includes(currentStatus)
  ) {
    return String(invoice.status);
  }

  const requestType = normalizeText(
    invoice?.invoiceType ||
      invoice?.type,
  );

  const isProjectRequest = Boolean(
    requestType === "project" ||
      invoice?.clientName ||
      invoice?.project ||
      invoice?.projectName ||
      invoice?.projectCode,
  );

  const hasPurchaseOrder = Boolean(
    invoice?.poId ||
      invoice?.poNumber ||
      invoice?.poDocId ||
      invoice?.purchaseOrderId ||
      invoice?.purchaseOrderNumber ||
      invoice?.poCreated ||
      invoice?.poSubmitted ||
      invoice?.purchaseOrderCreated ||
      invoice?.purchaseOrderSubmitted ||
      invoice?.poCreatedAt ||
      invoice?.purchaseOrderCreatedAt,
  );

  if (
    isProjectRequest &&
    hasPurchaseOrder
  ) {
    return "ready_for_payment";
  }

  return "approved";
}

function getPaymentWorkflowBasePaymentStatus(
  invoice: any,
): string {
  const savedStatus = String(
    invoice?.paymentWorkflowBasePaymentStatus ||
      "",
  ).trim();

  if (savedStatus) {
    return savedStatus;
  }

  const currentPaymentStatus =
    normalizeText(
      invoice?.paymentStatus ||
        invoice?.releasePaymentStatus,
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
      invoice?.paymentStatus ||
        invoice?.releasePaymentStatus ||
        "",
    );
  }

  return "";
}

function buildEditableEntry(
  entry: any,
  index: number,
): EditablePaymentEntry {
  const chequeNumbers = Array.isArray(
    entry?.chequeNumbers,
  )
    ? entry.chequeNumbers
    : entry?.chequeNumber
      ? [entry.chequeNumber]
      : [];

  const entryId = String(
    entry?.id || createPaymentId(),
  );

  return {
    rowKey: `${entryId}-${index}-${Math.random()
      .toString(36)
      .slice(2, 7)}`,

    id: entryId,
    original: entry || {},

    amount: String(
      getPaymentAmount(entry) || "",
    ),

    paymentMethod:
      entry?.paymentMethod ||
      "bank_transfer",

    releasedAtInput:
      toDateTimeLocalValue(
        entry?.releasedAt,
      ),

    transactionName: String(
      entry?.transactionName || "",
    ),

    transactionReference: String(
      entry?.transactionReference ||
        entry?.referenceNumber ||
        entry?.reference ||
        "",
    ),

    chequeNumbersText:
      chequeNumbers.join(", "),

    paymentNotes: String(
      entry?.paymentNotes ||
        entry?.notes ||
        "",
    ),
  };
}

export default function PaymentHistoryModal({
  isOpen,
  invoice,
  onClose,
  onSuccess,
  canEdit = false,
}: PaymentHistoryModalProps) {
  const { userProfile, currentUser } =
    useAuth();

  const { toast } = useToast();

  const [entries, setEntries] = useState<
    EditablePaymentEntry[]
  >([]);

  const [saving, setSaving] =
    useState(false);

  const originalHistory = useMemo(() => {
    return getRawPaymentHistory(invoice);
  }, [invoice]);

  const originalEntryCount =
    originalHistory.length;

  /**
   * Finance is the only role allowed to edit.
   *
   * Admin, Main Admin, Super Admin, Operation, Sales, Creative, and all other
   * roles remain view-only even if canEdit is incorrectly passed as true.
   */
  const financeCanEdit = Boolean(
    canEdit &&
      isFinanceRole(userProfile?.role) &&
      originalEntryCount > 0,
  );

  useEffect(() => {
    if (!isOpen || !invoice) {
      setEntries([]);
      return;
    }

    setEntries(
      getRawPaymentHistory(invoice).map(
        (entry, index) =>
          buildEditableEntry(
            entry,
            index,
          ),
      ),
    );
  }, [isOpen, invoice]);

  const approvedAmount = useMemo(() => {
    return getApprovedAmount(invoice);
  }, [invoice]);

  const draftReleasedAmount =
    useMemo(() => {
      return roundMoney(
        entries.reduce(
          (sum, entry) =>
            sum +
            safeNumber(entry.amount),
          0,
        ),
      );
    }, [entries]);

  const draftRemainingAmount =
    useMemo(() => {
      return roundMoney(
        Math.max(
          approvedAmount -
            draftReleasedAmount,
          0,
        ),
      );
    }, [
      approvedAmount,
      draftReleasedAmount,
    ]);

  const exceedsApprovedAmount =
    approvedAmount > 0 &&
    draftReleasedAmount >
      approvedAmount + 0.009;

  function updateEntry(
    rowKey: string,
    field: EditablePaymentField,
    value: string,
  ) {
    if (!financeCanEdit) {
      return;
    }

    setEntries((previousEntries) =>
      previousEntries.map((entry) =>
        entry.rowKey === rowKey
          ? {
              ...entry,
              [field]: value,
            }
          : entry,
      ),
    );
  }

  async function savePaymentHistory() {
    if (!invoice?.id) {
      toast({
        title: "Error",
        description:
          "The selected budget request is invalid.",
        variant: "destructive",
      });

      return;
    }

    if (!financeCanEdit) {
      toast({
        title: "Permission denied",
        description:
          "Only Finance users can edit payment release details.",
        variant: "destructive",
      });

      return;
    }

    /**
     * Finance can edit existing entries only.
     * No new entries can be inserted and no existing entries can be removed.
     */
    if (
      entries.length !==
      originalEntryCount
    ) {
      toast({
        title: "Payment entries changed",
        description:
          "Finance can edit existing payment entries only. Entries cannot be added or removed.",
        variant: "destructive",
      });

      return;
    }

    if (approvedAmount <= 0) {
      toast({
        title: "Approved amount missing",
        description:
          "The approved amount must be available before payment history can be updated.",
        variant: "destructive",
      });

      return;
    }

    if (exceedsApprovedAmount) {
      toast({
        title:
          "Amount exceeds approved value",

        description: `The total payment history cannot exceed Rs ${formatPKR(
          approvedAmount,
        )}.`,

        variant: "destructive",
      });

      return;
    }

    const normalizedEntries: any[] = [];

    for (
      let index = 0;
      index < entries.length;
      index += 1
    ) {
      const entry = entries[index];

      const paymentAmount =
        roundMoney(entry.amount);

      if (paymentAmount <= 0) {
        toast({
          title: "Invalid amount",

          description: `Enter a valid amount for payment entry ${
            index + 1
          }.`,

          variant: "destructive",
        });

        return;
      }

      if (!entry.releasedAtInput) {
        toast({
          title: "Payment date required",

          description: `Select a payment date for payment entry ${
            index + 1
          }.`,

          variant: "destructive",
        });

        return;
      }

      const releasedAt = new Date(
        entry.releasedAtInput,
      );

      if (
        Number.isNaN(
          releasedAt.getTime(),
        )
      ) {
        toast({
          title: "Invalid payment date",

          description: `The payment date for payment entry ${
            index + 1
          } is invalid.`,

          variant: "destructive",
        });

        return;
      }

      if (!entry.paymentMethod) {
        toast({
          title:
            "Payment method required",

          description: `Select a payment method for payment entry ${
            index + 1
          }.`,

          variant: "destructive",
        });

        return;
      }

      const chequeNumbers =
        entry.chequeNumbersText
          .split(/[\n,]/g)
          .map((value) =>
            value.trim(),
          )
          .filter(Boolean);

      if (
        entry.paymentMethod ===
          "cheque" &&
        chequeNumbers.length === 0
      ) {
        toast({
          title:
            "Cheque number required",

          description: `Enter at least one cheque number for payment entry ${
            index + 1
          }.`,

          variant: "destructive",
        });

        return;
      }

      normalizedEntries.push({
        ...entry.original,

        id:
          entry.id ||
          entry.original?.id ||
          createPaymentId(),

        amount: paymentAmount,

        paymentMethod:
          entry.paymentMethod,

        transactionName:
          entry.transactionName.trim(),

        transactionReference:
          entry.transactionReference.trim(),

        chequeNumber:
          chequeNumbers[0] || "",

        chequeNumbers,

        paymentNotes:
          entry.paymentNotes.trim(),

        releasedAt,

        /**
         * Preserve the original releasing user.
         * Editing does not change who originally released the payment.
         */
        releasedBy:
          entry.original?.releasedBy ||
          "",

        releasedByName:
          entry.original
            ?.releasedByName ||
          "Unknown",

        releasedByEmail:
          entry.original
            ?.releasedByEmail ||
          "",

        paymentHistoryEdited: true,

        paymentHistoryEditedAt:
          new Date(),

        paymentHistoryEditedBy:
          userProfile?.id ||
          currentUser?.uid ||
          "",

        paymentHistoryEditedByName:
          userProfile?.displayName ||
          currentUser?.displayName ||
          currentUser?.email ||
          "",

        paymentHistoryEditedByRole:
          getRoleKey(
            userProfile?.role,
          ),
      });
    }

    /**
     * Sort entries by their payment date before recalculating all running
     * amounts and release types.
     */
    normalizedEntries.sort(
      (firstEntry, secondEntry) => {
        return (
          firstEntry.releasedAt.getTime() -
          secondEntry.releasedAt.getTime()
        );
      },
    );

    let runningReleasedAmount = 0;

    const recalculatedHistory =
      normalizedEntries.map((entry) => {
        const paymentAmount =
          roundMoney(entry.amount);

        const releasedBefore =
          roundMoney(
            runningReleasedAmount,
          );

        const releasedAfter =
          roundMoney(
            releasedBefore +
              paymentAmount,
          );

        const remainingAfter =
          roundMoney(
            Math.max(
              approvedAmount -
                releasedAfter,
              0,
            ),
          );

        const isFinalPayment =
          remainingAfter <= 0.009;

        const releaseType =
          releasedBefore <= 0.009
            ? isFinalPayment
              ? "full"
              : "advance"
            : isFinalPayment
              ? "final"
              : "partial";

        runningReleasedAmount =
          releasedAfter;

        return {
          ...entry,

          amount: paymentAmount,
          approvedAmount,

          releasedBefore,
          releasedAfter,
          remainingAfter,

          releaseType,
        };
      });

    const totalReleasedAmount =
      roundMoney(
        runningReleasedAmount,
      );

    if (
      totalReleasedAmount >
      approvedAmount + 0.009
    ) {
      toast({
        title:
          "Amount exceeds approved value",

        description: `The total released amount cannot exceed Rs ${formatPKR(
          approvedAmount,
        )}.`,

        variant: "destructive",
      });

      return;
    }

    const remainingReleaseAmount =
      roundMoney(
        Math.max(
          approvedAmount -
            totalReleasedAmount,
          0,
        ),
      );

    const hasPayments =
      recalculatedHistory.length > 0;

    const isFullyReleased =
      approvedAmount > 0 &&
      hasPayments &&
      remainingReleaseAmount <= 0.009;

    const latestPaymentRelease =
      recalculatedHistory[
        recalculatedHistory.length - 1
      ] || null;

    const currentRequestStatus =
      normalizeText(invoice.status);

    /**
     * Do not move a request backwards if the expense workflow has already
     * started or completed.
     */
    const preserveLaterWorkflowStatus =
      [
        "expense_submitted",
        "expense_completed",
      ].includes(
        currentRequestStatus,
      );

    const paymentWorkflowBaseStatus =
      getPaymentWorkflowBaseStatus(
        invoice,
      );

    const paymentWorkflowBasePaymentStatus =
      getPaymentWorkflowBasePaymentStatus(
        invoice,
      );

    let nextRequestStatus =
      paymentWorkflowBaseStatus;

    if (preserveLaterWorkflowStatus) {
      nextRequestStatus = String(
        invoice.status,
      );
    } else if (isFullyReleased) {
      nextRequestStatus =
        "payment_released";
    } else if (hasPayments) {
      nextRequestStatus =
        "payment_partially_released";
    }

    const nextPaymentStatus =
      isFullyReleased
        ? "released"
        : hasPayments
          ? "partial"
          : paymentWorkflowBasePaymentStatus ||
            "pending";

    const previousReleasedAmount =
      roundMoney(
        originalHistory.reduce(
          (sum, entry) =>
            sum +
            getPaymentAmount(entry),
          0,
        ),
      );

    const updatePayload: Record<
      string,
      any
    > = {
      paymentReleaseHistory:
        recalculatedHistory,

      totalApprovedAmount:
        approvedAmount,

      totalReleasedAmount,

      remainingReleaseAmount,

      paymentReleased:
        isFullyReleased,

      paymentPartiallyReleased:
        hasPayments &&
        !isFullyReleased,

      releasePaymentCreated:
        hasPayments,

      status: nextRequestStatus,

      paymentStatus:
        nextPaymentStatus,

      paymentWorkflowBaseStatus,

      paymentWorkflowBasePaymentStatus,

      paymentHistoryVersion: 2,

      paymentHistoryUpdatedAt:
        serverTimestamp(),

      paymentHistoryUpdatedBy:
        userProfile?.id ||
        currentUser?.uid ||
        "",

      paymentHistoryUpdatedByName:
        userProfile?.displayName ||
        currentUser?.displayName ||
        currentUser?.email ||
        "",

      paymentHistoryUpdatedByRole:
        getRoleKey(
          userProfile?.role,
        ),

      paymentHistoryAuditTrail:
        arrayUnion({
          action:
            "payment_history_updated",

          previousReleasedAmount,

          newReleasedAmount:
            totalReleasedAmount,

          previousEntryCount:
            originalEntryCount,

          newEntryCount:
            recalculatedHistory.length,

          updatedBy:
            userProfile?.id ||
            currentUser?.uid ||
            "",

          updatedByName:
            userProfile?.displayName ||
            currentUser?.displayName ||
            currentUser?.email ||
            "",

          updatedByRole:
            getRoleKey(
              userProfile?.role,
            ),

          updatedAt: new Date(),
        }),

      updatedAt: serverTimestamp(),
    };

    if (latestPaymentRelease) {
      updatePayload.latestPaymentRelease =
        latestPaymentRelease;

      updatePayload.paymentDetails =
        latestPaymentRelease;

      updatePayload.transactionName =
        latestPaymentRelease
          .transactionName || "";

      updatePayload.latestTransactionName =
        latestPaymentRelease
          .transactionName || "";
    } else {
      updatePayload.latestPaymentRelease =
        deleteField();

      updatePayload.paymentDetails =
        deleteField();

      updatePayload.transactionName =
        deleteField();

      updatePayload.latestTransactionName =
        deleteField();
    }

    if (
      isFullyReleased &&
      latestPaymentRelease
    ) {
      updatePayload.paymentReleasedAt =
        latestPaymentRelease.releasedAt;

      updatePayload.releasePaymentAt =
        latestPaymentRelease.releasedAt;

      updatePayload.paymentFullyReleasedAt =
        latestPaymentRelease.releasedAt;

      updatePayload.partialPaymentReleasedAt =
        deleteField();
    } else {
      updatePayload.paymentReleasedAt =
        deleteField();

      updatePayload.releasePaymentAt =
        deleteField();

      updatePayload.paymentFullyReleasedAt =
        deleteField();
    }

    if (
      hasPayments &&
      !isFullyReleased
    ) {
      updatePayload.partialPaymentReleasedAt =
        latestPaymentRelease?.releasedAt ||
        serverTimestamp();
    }

    try {
      setSaving(true);

      await updateDoc(
        doc(
          db,
          "Panels",
          PANEL_ID,
          "invoiceRequests",
          invoice.id,
        ),
        updatePayload,
      );

      toast({
        title:
          "Payment history updated",

        description:
          "Payment details and all related calculations were updated successfully.",
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error(
        "Failed to update payment history:",
        error,
      );

      toast({
        title: "Error",

        description:
          error?.message ||
          "Failed to update payment history.",

        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen || !invoice) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/55 px-4 py-6">
      <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-slate-200 bg-white/95 p-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-slate-950">
                Payment Release History
              </h2>

              {financeCanEdit ? (
                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Finance Edit
                </span>
              ) : (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                  View Only
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Request ID:{" "}
              {invoice.requestId || "-"}
            </p>

            {financeCanEdit && (
              <p className="mt-1 text-xs text-blue-600">
                Finance can edit existing
                payment details. Payment
                entries cannot be added or
                removed.
              </p>
            )}

            {!financeCanEdit && (
              <p className="mt-1 text-xs text-slate-500">
                Only Finance users can edit
                payment release details.
              </p>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full border-slate-200"
            onClick={onClose}
            disabled={saving}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-4 border-b border-slate-100 p-5 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total Approved
            </p>

            <p className="mt-2 text-xl font-semibold text-slate-950">
              Rs {formatPKR(approvedAmount)}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Released After Changes
            </p>

            <p className="mt-2 text-xl font-semibold text-slate-950">
              Rs{" "}
              {formatPKR(
                draftReleasedAmount,
              )}
            </p>
          </div>

          <div
            className={`rounded-2xl p-4 ${
              exceedsApprovedAmount
                ? "border border-red-200 bg-red-50"
                : "bg-slate-50"
            }`}
          >
            <p
              className={`text-xs font-semibold uppercase tracking-wide ${
                exceedsApprovedAmount
                  ? "text-red-600"
                  : "text-slate-500"
              }`}
            >
              Remaining Balance
            </p>

            <p
              className={`mt-2 text-xl font-semibold ${
                exceedsApprovedAmount
                  ? "text-red-700"
                  : "text-slate-950"
              }`}
            >
              Rs{" "}
              {formatPKR(
                draftRemainingAmount,
              )}
            </p>
          </div>
        </div>

        {exceedsApprovedAmount && (
          <div className="mx-5 mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            The payment history exceeds
            the approved amount by Rs{" "}
            {formatPKR(
              draftReleasedAmount -
                approvedAmount,
            )}
            .
          </div>
        )}

        <div className="space-y-5 p-5">
          {entries.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <CheckCircle2 className="mx-auto h-9 w-9 text-slate-400" />

              <p className="mt-4 font-semibold text-slate-800">
                No payment entries recorded
              </p>

              <p className="mt-1 text-sm text-slate-500">
                No payment history is
                available for this request.
              </p>
            </div>
          ) : (
            entries.map(
              (entry, index) => (
                <section
                  key={entry.rowKey}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Payment Entry{" "}
                      {index + 1}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {getPaymentMethodLabel(
                        entry.paymentMethod,
                      )}{" "}
                      · Rs{" "}
                      {formatPKR(
                        entry.amount,
                      )}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    <div className="space-y-2">
                      <Label>
                        Payment Amount
                      </Label>

                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={entry.amount}
                        readOnly={
                          !financeCanEdit
                        }
                        onChange={(event) =>
                          updateEntry(
                            entry.rowKey,
                            "amount",
                            event.target
                              .value,
                          )
                        }
                        className={`h-11 rounded-2xl border-slate-200 ${
                          financeCanEdit
                            ? "bg-white"
                            : "bg-slate-100"
                        }`}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Payment Date and Time
                      </Label>

                      <Input
                        type="datetime-local"
                        value={
                          entry.releasedAtInput
                        }
                        readOnly={
                          !financeCanEdit
                        }
                        onChange={(event) =>
                          updateEntry(
                            entry.rowKey,
                            "releasedAtInput",
                            event.target
                              .value,
                          )
                        }
                        className={`h-11 rounded-2xl border-slate-200 ${
                          financeCanEdit
                            ? "bg-white"
                            : "bg-slate-100"
                        }`}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Payment Method
                      </Label>

                      <Select
                        disabled={
                          !financeCanEdit
                        }
                        value={
                          entry.paymentMethod
                        }
                        onValueChange={(
                          value,
                        ) =>
                          updateEntry(
                            entry.rowKey,
                            "paymentMethod",
                            value,
                          )
                        }
                      >
                        <SelectTrigger
                          className={`h-11 rounded-2xl border-slate-200 ${
                            financeCanEdit
                              ? "bg-white"
                              : "bg-slate-100"
                          }`}
                        >
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="cash">
                            Cash
                          </SelectItem>

                          <SelectItem value="cheque">
                            Cheque
                          </SelectItem>

                          <SelectItem value="bank_transfer">
                            Bank Transfer
                          </SelectItem>

                          <SelectItem value="wire">
                            Online Transfer
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Transaction Name
                      </Label>

                      <Input
                        value={
                          entry.transactionName
                        }
                        readOnly={
                          !financeCanEdit
                        }
                        placeholder="Enter transaction name"
                        onChange={(event) =>
                          updateEntry(
                            entry.rowKey,
                            "transactionName",
                            event.target
                              .value,
                          )
                        }
                        className={`h-11 rounded-2xl border-slate-200 ${
                          financeCanEdit
                            ? "bg-white"
                            : "bg-slate-100"
                        }`}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Transaction Reference
                      </Label>

                      <Input
                        value={
                          entry.transactionReference
                        }
                        readOnly={
                          !financeCanEdit
                        }
                        placeholder="Enter transaction reference"
                        onChange={(event) =>
                          updateEntry(
                            entry.rowKey,
                            "transactionReference",
                            event.target
                              .value,
                          )
                        }
                        className={`h-11 rounded-2xl border-slate-200 ${
                          financeCanEdit
                            ? "bg-white"
                            : "bg-slate-100"
                        }`}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Cheque Numbers
                      </Label>

                      <Input
                        value={
                          entry.chequeNumbersText
                        }
                        readOnly={
                          !financeCanEdit
                        }
                        placeholder="10001, 10002"
                        onChange={(event) =>
                          updateEntry(
                            entry.rowKey,
                            "chequeNumbersText",
                            event.target
                              .value,
                          )
                        }
                        className={`h-11 rounded-2xl border-slate-200 ${
                          financeCanEdit
                            ? "bg-white"
                            : "bg-slate-100"
                        }`}
                      />

                      <p className="text-xs text-slate-500">
                        Separate multiple
                        cheque numbers with
                        commas.
                      </p>
                    </div>

                    <div className="space-y-2 md:col-span-2 xl:col-span-3">
                      <Label>
                        Payment Notes
                      </Label>

                      <Textarea
                        rows={4}
                        value={
                          entry.paymentNotes
                        }
                        readOnly={
                          !financeCanEdit
                        }
                        placeholder="Enter payment notes"
                        onChange={(event) =>
                          updateEntry(
                            entry.rowKey,
                            "paymentNotes",
                            event.target
                              .value,
                          )
                        }
                        className={`rounded-2xl border-slate-200 ${
                          financeCanEdit
                            ? "bg-white"
                            : "bg-slate-100"
                        }`}
                      />
                    </div>

                    {entry.original
                      ?.releasedByName && (
                      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 md:col-span-2 xl:col-span-3">
                        Originally released
                        by:{" "}
                        <span className="font-semibold text-slate-900">
                          {
                            entry.original
                              .releasedByName
                          }
                        </span>
                      </div>
                    )}
                  </div>
                </section>
              ),
            )
          )}
        </div>

        <div className="sticky bottom-0 flex flex-col gap-3 border-t border-slate-200 bg-white/95 p-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Approval history, current
            approver, request owner, and
            approval dates will not be
            changed.
          </p>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl border-slate-200"
              onClick={onClose}
              disabled={saving}
            >
              Close
            </Button>

            {financeCanEdit && (
              <Button
                type="button"
                className="rounded-2xl bg-slate-950 px-6 text-white hover:bg-slate-800"
                onClick={
                  savePaymentHistory
                }
                disabled={
                  saving ||
                  exceedsApprovedAmount
                }
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Payment History
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}