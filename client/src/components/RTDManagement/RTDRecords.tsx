// import React, {
//   FormEvent,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";
// import { auth, db } from "@/lib/firebase";
// import {
//   collection,
//   doc,
//   onSnapshot,
//   serverTimestamp,
//   writeBatch,
// } from "firebase/firestore";
// import { Button } from "@/components/ui/button";
// import {
//   Eye,
//   FileText,
//   Loader2,
//   Pencil,
//   Save,
//   WalletCards,
//   X,
// } from "lucide-react";

// const PANEL_ID = "IEDGE-SYSTEM";

// type Props = {
//   onCreateEstimate?: (recordIds: string[]) => void;
// };

// type AccountOption = {
//   id: string;
//   name: string;
//   bankName?: string;
//   accountTitle?: string;
//   accountNo?: string;
//   iban?: string;
// };

// type ClientOption = {
//   id: string;
//   name: string;
// };

// export type RTDRecord = {
//   id: string;

//   requestor?: string;

//   client?: string;
//   subjectPurpose?: string;
//   clientPersonOfContact?: string;

//   accountFromId?: string;
//   accountFromName?: string;
//   accountFromBankName?: string;
//   accountFromTitle?: string;
//   accountFromAccountNo?: string;

//   pocContactNo?: string;
//   venue?: string;

//   bankName?: string;
//   bankTitle?: string;
//   ibanOrAccountNo?: string;

//   amountRequired?: number;
//   paymentDate?: string;
//   paidBy?: string;

//   statementEntryId?: string;

//   estimateId?: string;
//   estimateNo?: string;
//   estimateAmount?: number;

//   invoiceId?: string;
//   invoiceNo?: string;

//   createdBy?: string;
//   createdByEmail?: string;
//   createdAt?: any;
//   updatedAt?: any;
// };

// type FormState = {
//   requestor: string;
//   client: string;
//   subjectPurpose: string;
//   clientPersonOfContact: string;
//   accountFrom: string;
//   pocContactNo: string;
//   venue: string;
//   bankName: string;
//   bankTitle: string;
//   ibanOrAccountNo: string;
//   amountRequired: string;
//   paymentDate: string;
//   paidBy: string;
// };

// const initialForm: FormState = {
//   requestor: "",
//   client: "",
//   subjectPurpose: "",
//   clientPersonOfContact: "",
//   accountFrom: "",
//   pocContactNo: "",
//   venue: "",
//   bankName: "",
//   bankTitle: "",
//   ibanOrAccountNo: "",
//   amountRequired: "",
//   paymentDate: "",
//   paidBy: "",
// };

// const toNumber = (value: any) => {
//   const parsed = Number(String(value ?? "").replace(/,/g, "").trim());
//   return Number.isFinite(parsed) ? parsed : 0;
// };

// const formatMoney = (value: any) =>
//   toNumber(value).toLocaleString("en-PK", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });

// const getTimestampValue = (value: any) => {
//   if (!value) return 0;

//   if (typeof value?.toMillis === "function") {
//     return value.toMillis();
//   }

//   if (value instanceof Date) {
//     return value.getTime();
//   }

//   const parsed = new Date(value).getTime();

//   return Number.isFinite(parsed) ? parsed : 0;
// };

// const normalizeClient = (value: unknown) =>
//   String(value || "").trim().toLowerCase();

// const getRecordStatus = (record: RTDRecord) => {
//   if (String(record.invoiceId || "").trim()) {
//     return {
//       label: "Invoiced",
//       className: "border-emerald-200 bg-emerald-50 text-emerald-700",
//     };
//   }

//   if (String(record.estimateId || "").trim()) {
//     return {
//       label: "Estimated",
//       className: "border-blue-200 bg-blue-50 text-blue-700",
//     };
//   }

//   return {
//     label: "Pending Estimate",
//     className: "border-amber-200 bg-amber-50 text-amber-700",
//   };
// };

// export default function RTDRecords({ onCreateEstimate }: Props) {
//   const [form, setForm] = useState<FormState>(initialForm);

//   const [clients, setClients] = useState<ClientOption[]>([]);
//   const [accounts, setAccounts] = useState<AccountOption[]>([]);
//   const [records, setRecords] = useState<RTDRecord[]>([]);

//   const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);

//   const [saving, setSaving] = useState(false);
//   const savingRef = useRef(false);

//   const [message, setMessage] = useState("");
//   const [error, setError] = useState("");
//   const [attemptedSubmit, setAttemptedSubmit] = useState(false);

//   const [editId, setEditId] = useState<string | null>(null);
//   const [previewRecord, setPreviewRecord] = useState<RTDRecord | null>(null);

//   const fieldClass =
//     "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100";

//   const invalidFieldClass =
//     "border-red-400 ring-4 ring-red-100 focus:ring-red-200 focus:border-red-400";

//   const withValidity = (base: string, invalid: boolean) =>
//     invalid && attemptedSubmit ? `${base} ${invalidFieldClass}` : base;

//   useEffect(() => {
//     const unsubscribe = onSnapshot(
//       collection(db, "Panels", PANEL_ID, "clients"),
//       (snapshot) => {
//         const list = snapshot.docs
//           .map((document) => ({
//             id: document.id,
//             name: String(document.data()?.name || "").trim(),
//           }))
//           .filter((item) => item.name)
//           .sort((a, b) => a.name.localeCompare(b.name));

//         setClients(list);
//       },
//       (loadError) => {
//         console.error("Failed to load RTD clients:", loadError);
//       },
//     );

//     return () => unsubscribe();
//   }, []);

//   useEffect(() => {
//     const unsubscribe = onSnapshot(
//       collection(db, "Panels", PANEL_ID, "paymentAccounts"),
//       (snapshot) => {
//         const list: AccountOption[] = snapshot.docs
//           .map((document) => {
//             const data = document.data() as any;

//             const name = String(
//               data.accountName ||
//                 data.name ||
//                 data.accountTitle ||
//                 data.bankTitle ||
//                 data.title ||
//                 data.bankName ||
//                 document.id,
//             ).trim();

//             return {
//               id: document.id,

//               name,

//               bankName: String(
//                 data.bankName ||
//                   data.bank ||
//                   data.financialInstitution ||
//                   "",
//               ).trim(),

//               accountTitle: String(
//                 data.accountTitle ||
//                   data.bankTitle ||
//                   data.title ||
//                   data.accountName ||
//                   "",
//               ).trim(),

//               accountNo: String(
//                 data.accountNo ||
//                   data.accountNumber ||
//                   data.iban ||
//                   data.ibanNo ||
//                   "",
//               ).trim(),

//               iban: String(
//                 data.iban ||
//                   data.ibanNo ||
//                   data.accountNo ||
//                   data.accountNumber ||
//                   "",
//               ).trim(),
//             };
//           })
//           .sort((a, b) => a.name.localeCompare(b.name));

//         setAccounts(list);
//       },
//       (loadError) => {
//         console.error("Failed to load payment accounts:", loadError);
//       },
//     );

//     return () => unsubscribe();
//   }, []);

//   useEffect(() => {
//     const unsubscribe = onSnapshot(
//       collection(db, "Panels", PANEL_ID, "rtdRecords"),
//       (snapshot) => {
//         const list = snapshot.docs.map((document) => ({
//           id: document.id,
//           ...(document.data() as Omit<RTDRecord, "id">),
//         }));

//         list.sort(
//           (a, b) =>
//             getTimestampValue(b.createdAt) -
//             getTimestampValue(a.createdAt),
//         );

//         setRecords(list);

//         const existingIds = new Set(
//           list.map((record) => record.id),
//         );

//         setSelectedRecordIds((previous) =>
//           previous.filter((id) => existingIds.has(id)),
//         );
//       },
//       (loadError) => {
//         console.error("Failed to load RTD records:", loadError);
//       },
//     );

//     return () => unsubscribe();
//   }, []);

//   const amountNumber = useMemo(
//     () => toNumber(form.amountRequired),
//     [form.amountRequired],
//   );

//   const selectedAccount = useMemo(
//     () =>
//       accounts.find(
//         (account) => account.id === form.accountFrom,
//       ) || null,
//     [accounts, form.accountFrom],
//   );

//   const eligibleRecords = useMemo(
//     () =>
//       records.filter(
//         (record) =>
//           !String(record.estimateId || "").trim(),
//       ),
//     [records],
//   );

//   const selectedRecords = useMemo(
//     () =>
//       records.filter((record) =>
//         selectedRecordIds.includes(record.id),
//       ),
//     [records, selectedRecordIds],
//   );

//   const allEligibleSelected =
//     eligibleRecords.length > 0 &&
//     eligibleRecords.every((record) =>
//       selectedRecordIds.includes(record.id),
//     );

//   const selectedAmount = useMemo(
//     () =>
//       selectedRecords.reduce(
//         (sum, record) =>
//           sum + toNumber(record.amountRequired),
//         0,
//       ),
//     [selectedRecords],
//   );

//   const updateField = (
//     field: keyof FormState,
//     value: string,
//   ) => {
//     setForm((previous) => ({
//       ...previous,
//       [field]: value,
//     }));

//     setMessage("");
//     setError("");
//   };

//   const validate = () => {
//     if (!form.client.trim()) {
//       return "Client is required.";
//     }

//     if (!form.subjectPurpose.trim()) {
//       return "Subject / Purpose is required.";
//     }

//     if (!form.clientPersonOfContact.trim()) {
//       return "Client Person of Contact is required.";
//     }

//     if (!form.accountFrom.trim()) {
//       return "Account From is required.";
//     }

//     if (!form.pocContactNo.trim()) {
//       return "PoC Contact No is required.";
//     }

//     if (!form.venue.trim()) {
//       return "Venue is required.";
//     }

//     if (!form.bankName.trim()) {
//       return "Bank Name is required.";
//     }

//     if (!form.bankTitle.trim()) {
//       return "Bank Title is required.";
//     }

//     if (!form.ibanOrAccountNo.trim()) {
//       return "IBAN No / Acc No is required.";
//     }

//     if (amountNumber <= 0) {
//       return "Amount Required must be greater than zero.";
//     }

//     if (!form.paymentDate.trim()) {
//       return "Payment Date is required.";
//     }

//     return "";
//   };

//   const handleSubmit = async (
//     event: FormEvent,
//   ) => {
//     event.preventDefault();
//     setAttemptedSubmit(true);

//     if (saving || savingRef.current) return;

//     const validationError = validate();

//     if (validationError) {
//       setError(validationError);
//       setMessage("");
//       return;
//     }

//     if (!selectedAccount) {
//       setError(
//         "Selected From Account could not be found.",
//       );
//       return;
//     }

//     try {
//       savingRef.current = true;
//       setSaving(true);
//       setError("");
//       setMessage("");

//       const currentUser = auth.currentUser;

//       if (editId) {
//         const existingRecord = records.find(
//           (record) => record.id === editId,
//         );

//         const batch = writeBatch(db);

//         batch.update(
//           doc(db, "Panels", PANEL_ID, "rtdRecords", editId),
//           {
//             requestor: form.requestor.trim(),
//             client: form.client.trim(),
//             subjectPurpose: form.subjectPurpose.trim(),
//             clientPersonOfContact: form.clientPersonOfContact.trim(),
//             accountFromId: selectedAccount.id,
//             accountFromName: selectedAccount.name,
//             accountFromBankName: selectedAccount.bankName || "",
//             accountFromTitle: selectedAccount.accountTitle || "",
//             accountFromAccountNo:
//               selectedAccount.accountNo || selectedAccount.iban || "",
//             pocContactNo: form.pocContactNo.trim(),
//             venue: form.venue.trim(),
//             bankName: form.bankName.trim(),
//             bankTitle: form.bankTitle.trim(),
//             ibanOrAccountNo: form.ibanOrAccountNo.trim(),
//             amountRequired: amountNumber,
//             paymentDate: form.paymentDate,
//             paidBy: form.paidBy.trim(),
//             updatedAt: serverTimestamp(),
//           },
//         );

//         if (existingRecord?.statementEntryId) {
//           batch.update(
//             doc(
//               db,
//               "Panels",
//               PANEL_ID,
//               "accountStatementManualEntries",
//               existingRecord.statementEntryId,
//             ),
//             {
//               date: form.paymentDate,
//               description: [
//                 `RTD - ${form.client.trim()}`,
//                 `From Account: ${selectedAccount.name}`,
//               ].join(" | "),
//               debit: amountNumber,
//               accountFromId: selectedAccount.id,
//               accountFromName: selectedAccount.name,
//               accountFromBankName: selectedAccount.bankName || "",
//               accountFromTitle: selectedAccount.accountTitle || "",
//               accountFromAccountNo:
//                 selectedAccount.accountNo || selectedAccount.iban || "",
//               fromAccount: selectedAccount.name,
//               client: form.client.trim(),
//               amountRequired: amountNumber,
//               updatedAt: serverTimestamp(),
//             },
//           );
//         }

//         await batch.commit();

//         setForm(initialForm);
//         setEditId(null);
//         setAttemptedSubmit(false);
//         setMessage("RTD record updated.");
//         return;
//       }

//       const rtdRecordRef = doc(
//         collection(
//           db,
//           "Panels",
//           PANEL_ID,
//           "rtdRecords",
//         ),
//       );

//       const statementEntryRef = doc(
//         collection(
//           db,
//           "Panels",
//           PANEL_ID,
//           "accountStatementManualEntries",
//         ),
//       );

//       const batch = writeBatch(db);

//       batch.set(rtdRecordRef, {
//         requestor: form.requestor.trim(),

//         client: form.client.trim(),

//         subjectPurpose:
//           form.subjectPurpose.trim(),

//         clientPersonOfContact:
//           form.clientPersonOfContact.trim(),

//         accountFromId:
//           selectedAccount.id,

//         accountFromName:
//           selectedAccount.name,

//         accountFromBankName:
//           selectedAccount.bankName || "",

//         accountFromTitle:
//           selectedAccount.accountTitle || "",

//         accountFromAccountNo:
//           selectedAccount.accountNo ||
//           selectedAccount.iban ||
//           "",

//         pocContactNo:
//           form.pocContactNo.trim(),

//         venue:
//           form.venue.trim(),

//         bankName:
//           form.bankName.trim(),

//         bankTitle:
//           form.bankTitle.trim(),

//         ibanOrAccountNo:
//           form.ibanOrAccountNo.trim(),

//         amountRequired:
//           amountNumber,

//         paymentDate:
//           form.paymentDate,

//         paidBy:
//           form.paidBy.trim(),

//         statementEntryId:
//           statementEntryRef.id,

//         estimateId: "",
//         estimateNo: "",
//         estimateAmount: 0,

//         invoiceId: "",
//         invoiceNo: "",

//         createdBy:
//           currentUser?.uid || "",

//         createdByEmail:
//           currentUser?.email || "",

//         createdAt:
//           serverTimestamp(),

//         updatedAt:
//           serverTimestamp(),
//       });

//       batch.set(statementEntryRef, {
//         date: form.paymentDate,

//         description: [
//           `RTD - ${form.client.trim()}`,
//           `From Account: ${selectedAccount.name}`,
//         ].join(" | "),

//         debit: amountNumber,
//         credit: 0,
//         entryType: "debit",

//         poNo: "",
//         projectCode: "",

//         sourceModule: "rtd",

//         transactionType:
//           "RTD Payment Requirement",

//         rtdRecordId:
//           rtdRecordRef.id,

//         rtdEstimateId: "",
//         rtdEstimateNo: "",

//         rtdInvoiceId: "",
//         rtdInvoiceNo: "",

//         accountFromId:
//           selectedAccount.id,

//         accountFromName:
//           selectedAccount.name,

//         accountFromBankName:
//           selectedAccount.bankName || "",

//         accountFromTitle:
//           selectedAccount.accountTitle || "",

//         accountFromAccountNo:
//           selectedAccount.accountNo ||
//           selectedAccount.iban ||
//           "",

//         fromAccount:
//           selectedAccount.name,

//         reference:
//           `RTD Record: ${rtdRecordRef.id}`,

//         client:
//           form.client.trim(),

//         amountRequired:
//           amountNumber,

//         createdAt:
//           serverTimestamp(),

//         createdBy:
//           currentUser?.displayName ||
//           currentUser?.email ||
//           "Unknown",

//         createdById:
//           currentUser?.uid || "",
//       });

//       await batch.commit();

//       setForm(initialForm);
//       setAttemptedSubmit(false);

//       setMessage(
//         "RTD record saved and linked to the selected From Account.",
//       );
//     } catch (saveError) {
//       console.error(
//         "Failed to save RTD record:",
//         saveError,
//       );

//       setError(
//         editId
//           ? "Failed to update RTD record."
//           : "Failed to save RTD record.",
//       );
//     } finally {
//       savingRef.current = false;
//       setSaving(false);
//     }
//   };

//   const handleEditRecord = (record: RTDRecord) => {
//     setEditId(record.id);

//     setForm({
//       requestor: record.requestor || "",
//       client: record.client || "",
//       subjectPurpose: record.subjectPurpose || "",
//       clientPersonOfContact: record.clientPersonOfContact || "",
//       accountFrom: record.accountFromId || "",
//       pocContactNo: record.pocContactNo || "",
//       venue: record.venue || "",
//       bankName: record.bankName || "",
//       bankTitle: record.bankTitle || "",
//       ibanOrAccountNo: record.ibanOrAccountNo || "",
//       amountRequired:
//         record.amountRequired != null
//           ? String(record.amountRequired)
//           : "",
//       paymentDate: record.paymentDate || "",
//       paidBy: record.paidBy || "",
//     });

//     setAttemptedSubmit(false);
//     setError("");
//     setMessage("");

//     if (typeof window !== "undefined") {
//       window.scrollTo({ top: 0, behavior: "smooth" });
//     }
//   };

//   const handleCancelEdit = () => {
//     setEditId(null);
//     setForm(initialForm);
//     setAttemptedSubmit(false);
//     setError("");
//     setMessage("");
//   };

//   const toggleRecord = (
//     record: RTDRecord,
//   ) => {
//     if (record.estimateId) return;

//     setSelectedRecordIds((previous) =>
//       previous.includes(record.id)
//         ? previous.filter(
//             (id) => id !== record.id,
//           )
//         : [...previous, record.id],
//     );

//     setError("");
//     setMessage("");
//   };

//   const toggleAllEligible = () => {
//     if (allEligibleSelected) {
//       const eligibleIds = new Set(
//         eligibleRecords.map(
//           (record) => record.id,
//         ),
//       );

//       setSelectedRecordIds((previous) =>
//         previous.filter(
//           (id) => !eligibleIds.has(id),
//         ),
//       );

//       return;
//     }

//     setSelectedRecordIds(
//       Array.from(
//         new Set([
//           ...selectedRecordIds,
//           ...eligibleRecords.map(
//             (record) => record.id,
//           ),
//         ]),
//       ),
//     );
//   };

//   const handleCreateEstimate = () => {
//     if (selectedRecords.length === 0) {
//       setError(
//         "Select at least one RTD record.",
//       );
//       return;
//     }

//     const firstClient = normalizeClient(
//       selectedRecords[0]?.client,
//     );

//     const differentClient =
//       selectedRecords.some(
//         (record) =>
//           normalizeClient(record.client) !==
//           firstClient,
//       );

//     if (differentClient) {
//       setError(
//         "A single Estimate can only contain RTD records for the same client.",
//       );

//       return;
//     }

//     if (
//       selectedRecords.some(
//         (record) => record.estimateId,
//       )
//     ) {
//       setError(
//         "One or more selected records are already linked to an Estimate.",
//       );

//       return;
//     }

//     onCreateEstimate?.(
//       selectedRecords.map(
//         (record) => record.id,
//       ),
//     );
//   };

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
//           RTD Records
//         </h1>

//         <p className="mt-1 text-sm text-slate-500">
//           Create payment requirements, link them to
//           From Accounts, then select one or multiple
//           records for a single Estimate.
//         </p>
//       </div>

//       {editId ? (
//         <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
//           <span>
//             Editing this RTD record will update it in place, along with its
//             linked From Account statement entry.
//           </span>
//           <Button
//             type="button"
//             variant="outline"
//             onClick={handleCancelEdit}
//             className="rounded-xl"
//           >
//             Cancel
//           </Button>
//         </div>
//       ) : null}

//       <form onSubmit={handleSubmit} className="space-y-6">
//         <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//           <div className="mb-5 flex items-center gap-3">
//             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
//               <WalletCards className="h-5 w-5 text-slate-600" />
//             </div>

//             <div>
//               <h2 className="font-bold text-slate-950">
//                 Payment Requirement
//               </h2>

//               <p className="text-xs text-slate-500">
//                 From Account is linked by its
//                 paymentAccounts document ID.
//               </p>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
//             <Field label="Requestor">
//               <input
//                 className={fieldClass}
//                 value={form.requestor}
//                 onChange={(event) =>
//                   updateField(
//                     "requestor",
//                     event.target.value,
//                   )
//                 }
//                 placeholder="Enter requestor"
//               />
//             </Field>

//             <Field label="Client">
//               <select
//                 className={withValidity(fieldClass, !form.client.trim())}
//                 value={form.client}
//                 onChange={(event) =>
//                   updateField(
//                     "client",
//                     event.target.value,
//                   )
//                 }
//               >
//                 <option value="">
//                   Select Client
//                 </option>

//                 {clients.map((client) => (
//                   <option
//                     key={client.id}
//                     value={client.name}
//                   >
//                     {client.name}
//                   </option>
//                 ))}
//               </select>
//             </Field>

//             {/* SUBJECT / PURPOSE INPUT */}
//             <Field label="Subject / Purpose">
//               <input
//                 className={withValidity(
//                   fieldClass,
//                   !form.subjectPurpose.trim(),
//                 )}
//                 value={form.subjectPurpose}
//                 onChange={(event) =>
//                   updateField(
//                     "subjectPurpose",
//                     event.target.value,
//                   )
//                 }
//                 placeholder="Enter subject / purpose"
//               />
//             </Field>

//             <Field label="Client Person of Contact ">
//               <input
//                 className={withValidity(
//                   fieldClass,
//                   !form.clientPersonOfContact.trim(),
//                 )}
//                 value={
//                   form.clientPersonOfContact
//                 }
//                 onChange={(event) =>
//                   updateField(
//                     "clientPersonOfContact",
//                     event.target.value,
//                   )
//                 }
//                 placeholder="Enter requestor"
//               />
//             </Field>

//             <Field label="Account From">
//               <select
//                 className={withValidity(
//                   fieldClass,
//                   !form.accountFrom.trim(),
//                 )}
//                 value={form.accountFrom}
//                 onChange={(event) =>
//                   updateField(
//                     "accountFrom",
//                     event.target.value,
//                   )
//                 }
//               >
//                 <option value="">
//                   Select From Account
//                 </option>

//                 {accounts.map((account) => (
//                   <option
//                     key={account.id}
//                     value={account.id}
//                   >
//                     {account.name}
//                   </option>
//                 ))}
//               </select>
//             </Field>

//             <Field label="PoC Contact No">
//               <input
//                 className={withValidity(
//                   fieldClass,
//                   !form.pocContactNo.trim(),
//                 )}
//                 value={form.pocContactNo}
//                 onChange={(event) =>
//                   updateField(
//                     "pocContactNo",
//                     event.target.value,
//                   )
//                 }
//                 placeholder="Enter contact number"
//               />
//             </Field>

//             <Field label="Venue">
//               <input
//                 className={withValidity(fieldClass, !form.venue.trim())}
//                 value={form.venue}
//                 onChange={(event) =>
//                   updateField(
//                     "venue",
//                     event.target.value,
//                   )
//                 }
//                 placeholder="Enter venue"
//               />
//             </Field>

//             <Field label="Bank Name">
//               <input
//                 className={withValidity(
//                   fieldClass,
//                   !form.bankName.trim(),
//                 )}
//                 value={form.bankName}
//                 onChange={(event) =>
//                   updateField(
//                     "bankName",
//                     event.target.value,
//                   )
//                 }
//                 placeholder="Recipient bank"
//               />
//             </Field>

//             <Field label="Bank Title">
//               <input
//                 className={withValidity(
//                   fieldClass,
//                   !form.bankTitle.trim(),
//                 )}
//                 value={form.bankTitle}
//                 onChange={(event) =>
//                   updateField(
//                     "bankTitle",
//                     event.target.value,
//                   )
//                 }
//                 placeholder="Recipient account title"
//               />
//             </Field>

//             <Field label="IBAN No / Acc No">
//               <input
//                 className={withValidity(
//                   fieldClass,
//                   !form.ibanOrAccountNo.trim(),
//                 )}
//                 value={form.ibanOrAccountNo}
//                 onChange={(event) =>
//                   updateField(
//                     "ibanOrAccountNo",
//                     event.target.value,
//                   )
//                 }
//                 placeholder="Enter IBAN / Account No"
//               />
//             </Field>

//             <Field label="Amount Required">
//               <input
//                 type="number"
//                 min="0"
//                 step="0.01"
//                 className={withValidity(fieldClass, amountNumber <= 0)}
//                 value={form.amountRequired}
//                 onChange={(event) =>
//                   updateField(
//                     "amountRequired",
//                     event.target.value,
//                   )
//                 }
//                 placeholder="Enter amount"
//               />
//             </Field>

//             <Field label="Payment Date">
//               <input
//                 type="date"
//                 className={withValidity(
//                   fieldClass,
//                   !form.paymentDate.trim(),
//                 )}
//                 value={form.paymentDate}
//                 onChange={(event) =>
//                   updateField(
//                     "paymentDate",
//                     event.target.value,
//                   )
//                 }
//               />
//             </Field>

//             <Field label="Paid by">
//               <input
//                 className={fieldClass}
//                 value={form.paidBy}
//                 onChange={(event) =>
//                   updateField(
//                     "paidBy",
//                     event.target.value,
//                   )
//                 }
//                 placeholder="Enter Name"
//               />
//             </Field>
//           </div>

//           {selectedAccount ? (
//             <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
//               <strong>
//                 Selected From Account:
//               </strong>{" "}
//               {selectedAccount.name}

//               {selectedAccount.bankName
//                 ? ` · ${selectedAccount.bankName}`
//                 : ""}

//               {selectedAccount.accountTitle
//                 ? ` · ${selectedAccount.accountTitle}`
//                 : ""}
//             </div>
//           ) : null}
//         </div>

//         {error ? (
//           <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
//             {error}
//           </div>
//         ) : null}

//         {message ? (
//           <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
//             {message}
//           </div>
//         ) : null}

//         <div className="flex justify-end">
//           <Button
//             type="submit"
//             disabled={saving}
//             className="h-11 rounded-xl bg-slate-950 px-5 text-white hover:bg-slate-800"
//           >
//             {saving ? (
//               <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//             ) : (
//               <Save className="mr-2 h-4 w-4" />
//             )}

//             {saving
//               ? "Saving..."
//               : editId
//                 ? "Update Record"
//                 : "Save Record"}
//           </Button>
//         </div>
//       </form>

//       <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
//           <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
//             <div>
//               <h2 className="font-bold text-slate-950">
//                 RTD Records List
//               </h2>

//               <p className="text-sm text-slate-500">
//                 Select one or multiple records
//                 belonging to the same client.
//               </p>
//             </div>

//             <Button
//               type="button"
//               onClick={
//                 handleCreateEstimate
//               }
//               disabled={
//                 selectedRecordIds.length === 0
//               }
//               className="rounded-xl bg-slate-950 text-white hover:bg-slate-800"
//             >
//               <FileText className="mr-2 h-4 w-4" />

//               Create Estimate

//               {selectedRecordIds.length > 0
//                 ? ` (${selectedRecordIds.length})`
//                 : ""}
//             </Button>
//           </div>

//           {error ? (
//             <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-700">
//               {error}
//             </div>
//           ) : null}

//           {message ? (
//             <div className="border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700">
//               {message}
//             </div>
//           ) : null}

//           {selectedRecordIds.length > 0 ? (
//             <div className="border-b border-slate-100 bg-blue-50/60 px-5 py-3 text-sm text-blue-800">
//               Selected:{" "}
//               <strong>
//                 {selectedRecordIds.length}
//               </strong>{" "}
//               record(s) · Total RTD Amount:{" "}
//               <strong>
//                 Rs.{" "}
//                 {formatMoney(
//                   selectedAmount,
//                 )}
//               </strong>
//             </div>
//           ) : null}

//           <div className="overflow-x-auto">
//             <table className="w-full min-w-[1450px] text-sm">
//               <thead>
//                 <tr className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
//                   <th className="w-12 px-4 py-4 text-center">
//                     <input
//                       type="checkbox"
//                       checked={
//                         allEligibleSelected
//                       }
//                       onChange={
//                         toggleAllEligible
//                       }
//                       aria-label="Select all records without an estimate"
//                       className="h-4 w-4 rounded border-slate-300"
//                     />
//                   </th>

//                   <th className="px-5 py-4 text-left">
//                     Client
//                   </th>

//                   <th className="px-5 py-4 text-left">
//                     Subject / Purpose
//                   </th>

//                   <th className="px-5 py-4 text-left">
//                     Requestor
//                   </th>

//                   <th className="px-5 py-4 text-left">
//                     From Account
//                   </th>

//                   <th className="px-5 py-4 text-left">
//                     Payment Date
//                   </th>

//                   <th className="px-5 py-4 text-right">
//                     Amount
//                   </th>

//                   <th className="px-5 py-4 text-left">
//                     Estimate
//                   </th>

//                   <th className="px-5 py-4 text-left">
//                     Invoice
//                   </th>

//                   <th className="px-5 py-4 text-left">
//                     Status
//                   </th>

//                   <th className="px-5 py-4 text-center">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>

//               <tbody className="divide-y divide-slate-100">
//                 {records.map((record) => {
//                   const selected =
//                     selectedRecordIds.includes(
//                       record.id,
//                     );

//                   const hasEstimate =
//                     Boolean(
//                       String(
//                         record.estimateId || "",
//                       ).trim(),
//                     );

//                   const status =
//                     getRecordStatus(record);

//                   return (
//                     <tr
//                       key={record.id}
//                       className={
//                         selected
//                           ? "bg-blue-50/60"
//                           : "hover:bg-slate-50"
//                       }
//                     >
//                       <td className="px-4 py-4 text-center">
//                         <input
//                           type="checkbox"
//                           checked={
//                             selected
//                           }
//                           disabled={
//                             hasEstimate
//                           }
//                           onChange={() =>
//                             toggleRecord(
//                               record,
//                             )
//                           }
//                           title={
//                             hasEstimate
//                               ? "Already linked to an Estimate"
//                               : "Select for Estimate"
//                           }
//                           className="h-4 w-4 rounded border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
//                         />
//                       </td>

//                       <td className="px-5 py-4 font-semibold text-slate-900">
//                         {record.client ||
//                           "-"}
//                       </td>

//                       <td className="px-5 py-4 text-slate-600">
//                         {record.subjectPurpose ||
//                           "-"}
//                       </td>

//                       <td className="px-5 py-4 text-slate-600">
//                         {record.clientPersonOfContact ||
//                           "-"}
//                       </td>

//                       <td className="px-5 py-4">
//                         <div className="font-medium text-slate-800">
//                           {record.accountFromName ||
//                             "-"}
//                         </div>

//                         <div className="mt-1 text-xs text-slate-400">
//                           {record.accountFromId ||
//                             "-"}
//                         </div>
//                       </td>

//                       <td className="px-5 py-4 text-slate-600">
//                         {record.paymentDate ||
//                           "-"}
//                       </td>

//                       <td className="px-5 py-4 text-right font-bold text-slate-900">
//                         Rs.{" "}
//                         {formatMoney(
//                           record.amountRequired,
//                         )}
//                       </td>

//                       <td className="px-5 py-4">
//                         {record.estimateNo ||
//                           "-"}
//                       </td>

//                       <td className="px-5 py-4">
//                         {record.invoiceNo ||
//                           "-"}
//                       </td>

//                       <td className="px-5 py-4">
//                         <span
//                           className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${status.className}`}
//                         >
//                           {status.label}
//                         </span>
//                       </td>

//                       <td className="px-5 py-4">
//                         <div className="flex items-center justify-center gap-1">
//                           <button
//                             type="button"
//                             onClick={() => handleEditRecord(record)}
//                             className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
//                             title="Edit"
//                           >
//                             <Pencil className="h-4 w-4" />
//                           </button>
//                           <button
//                             type="button"
//                             onClick={() => setPreviewRecord(record)}
//                             className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
//                             title="Preview"
//                           >
//                             <Eye className="h-4 w-4" />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}

//                 {records.length === 0 ? (
//                   <tr>
//                     <td
//                       colSpan={11}
//                       className="px-5 py-10 text-center text-slate-500"
//                     >
//                       No RTD records found.
//                     </td>
//                   </tr>
//                 ) : null}
//               </tbody>
//             </table>
//           </div>
//       </div>

//       {previewRecord ? (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
//           <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
//             <div className="sticky top-0 flex items-center justify-between border-b bg-white p-5">
//               <div>
//                 <h2 className="text-lg font-semibold text-slate-900">
//                   RTD Record Details
//                 </h2>
//                 <p className="text-sm text-slate-500">
//                   {previewRecord.subjectPurpose || "-"}
//                 </p>
//               </div>

//               <button
//                 onClick={() => setPreviewRecord(null)}
//                 className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-950"
//               >
//                 <X className="h-5 w-5" />
//               </button>
//             </div>

//             <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
//               <DetailItem label="Requestor" value={previewRecord.requestor} />
//               <DetailItem label="Client" value={previewRecord.client} />
//               <DetailItem
//                 label="Subject / Purpose"
//                 value={previewRecord.subjectPurpose}
//               />
//               <DetailItem
//                 label="Client Person of Contact"
//                 value={previewRecord.clientPersonOfContact}
//               />
//               <DetailItem
//                 label="PoC Contact No"
//                 value={previewRecord.pocContactNo}
//               />
//               <DetailItem label="Venue" value={previewRecord.venue} />
//               <DetailItem
//                 label="From Account"
//                 value={previewRecord.accountFromName}
//               />
//               <DetailItem
//                 label="Bank Name"
//                 value={previewRecord.bankName}
//               />
//               <DetailItem
//                 label="Bank Title"
//                 value={previewRecord.bankTitle}
//               />
//               <DetailItem
//                 label="IBAN No / Acc No"
//                 value={previewRecord.ibanOrAccountNo}
//               />
//               <DetailItem
//                 label="Amount Required"
//                 value={`Rs. ${formatMoney(previewRecord.amountRequired)}`}
//               />
//               <DetailItem
//                 label="Payment Date"
//                 value={previewRecord.paymentDate}
//               />
//               <DetailItem label="Paid by" value={previewRecord.paidBy} />
//               <DetailItem
//                 label="Estimate No"
//                 value={previewRecord.estimateNo}
//               />
//               <DetailItem
//                 label="Invoice No"
//                 value={previewRecord.invoiceNo}
//               />
//               <DetailItem
//                 label="Status"
//                 value={getRecordStatus(previewRecord).label}
//               />
//             </div>

//             <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-white px-5 py-4">
//               <Button
//                 variant="outline"
//                 className="rounded-xl"
//                 onClick={() => {
//                   const record = previewRecord;
//                   setPreviewRecord(null);
//                   handleEditRecord(record);
//                 }}
//               >
//                 <Pencil className="mr-2 h-4 w-4" />
//                 Edit
//               </Button>
//             </div>
//           </div>
//         </div>
//       ) : null}
//     </div>
//   );
// }

// function Field({
//   label,
//   children,
// }: {
//   label: string;
//   children: React.ReactNode;
// }) {
//   return (
//     <div>
//       <label className="mb-1.5 block text-sm font-semibold text-slate-700">
//         {label}
//       </label>

//       {children}
//     </div>
//   );
// }

// function DetailItem({ label, value }: { label: string; value?: string }) {
//   return (
//     <div className="rounded-xl bg-slate-50 p-3">
//       <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
//         {label}
//       </p>
//       <p className="mt-1 text-sm font-medium text-slate-900">
//         {value || "-"}
//       </p>
//     </div>
//   );
// }

import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Eye,
  FileText,
  Loader2,
  Pencil,
  Save,
  WalletCards,
  X,
} from "lucide-react";

const PANEL_ID = "IEDGE-SYSTEM";

type Props = {
  onCreateEstimate?: (recordIds: string[]) => void;
};

type AccountOption = {
  id: string;
  name: string;
  bankName?: string;
  accountTitle?: string;
  accountNo?: string;
  iban?: string;
};

type ClientOption = {
  id: string;
  name: string;
};

export type RTDRecord = {
  id: string;

  requestor?: string;

  client?: string;
  subjectPurpose?: string;
  clientPersonOfContact?: string;

  accountFromId?: string;
  accountFromName?: string;
  accountFromBankName?: string;
  accountFromTitle?: string;
  accountFromAccountNo?: string;

  pocContactNo?: string;
  venue?: string;

  bankName?: string;
  bankTitle?: string;
  ibanOrAccountNo?: string;

  amountRequired?: number;
  paymentDate?: string;
  paidBy?: string;

  statementEntryId?: string;

  estimateId?: string;
  estimateNo?: string;
  estimateAmount?: number;

  invoiceId?: string;
  invoiceNo?: string;

  createdBy?: string;
  createdByEmail?: string;
  createdAt?: any;
  updatedAt?: any;
};

type FormState = {
  requestor: string;
  client: string;
  subjectPurpose: string;
  clientPersonOfContact: string;
  accountFrom: string;
  pocContactNo: string;
  venue: string;
  bankName: string;
  bankTitle: string;
  ibanOrAccountNo: string;
  amountRequired: string;
  paymentDate: string;
  paidBy: string;
};

const initialForm: FormState = {
  requestor: "",
  client: "",
  subjectPurpose: "",
  clientPersonOfContact: "",
  accountFrom: "",
  pocContactNo: "",
  venue: "",
  bankName: "",
  bankTitle: "",
  ibanOrAccountNo: "",
  amountRequired: "",
  paymentDate: "",
  paidBy: "",
};

const toNumber = (value: any) => {
  const parsed = Number(
    String(value ?? "")
      .replace(/,/g, "")
      .trim(),
  );
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatMoney = (value: any) =>
  toNumber(value).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getTimestampValue = (value: any) => {
  if (!value) return 0;

  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const parsed = new Date(value).getTime();

  return Number.isFinite(parsed) ? parsed : 0;
};

const getDaysSince = (value: any) => {
  const ms = getTimestampValue(value);
  if (!ms) return null;

  return Math.max(0, Math.floor((Date.now() - ms) / 86400000));
};

const normalizeClient = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getRecordStatus = (record: RTDRecord) => {
  if (String(record.invoiceId || "").trim()) {
    return {
      label: "Invoiced",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (String(record.estimateId || "").trim()) {
    return {
      label: "Estimated",
      className: "border-blue-200 bg-blue-50 text-blue-700",
    };
  }

  return {
    label: "Pending Estimate",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  };
};

export default function RTDRecords({ onCreateEstimate }: Props) {
  const [form, setForm] = useState<FormState>(initialForm);

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [records, setRecords] = useState<RTDRecord[]>([]);
  const [estimatePoMap, setEstimatePoMap] = useState<Record<string, string>>(
    {},
  );

  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [previewRecord, setPreviewRecord] = useState<RTDRecord | null>(null);

  const fieldClass =
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100";

  const invalidFieldClass =
    "border-red-400 ring-4 ring-red-100 focus:ring-red-200 focus:border-red-400";

  const withValidity = (base: string, invalid: boolean) =>
    invalid && attemptedSubmit ? `${base} ${invalidFieldClass}` : base;

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "Panels", PANEL_ID, "clients"),
      (snapshot) => {
        const list = snapshot.docs
          .map((document) => ({
            id: document.id,
            name: String(document.data()?.name || "").trim(),
          }))
          .filter((item) => item.name)
          .sort((a, b) => a.name.localeCompare(b.name));

        setClients(list);
      },
      (loadError) => {
        console.error("Failed to load RTD clients:", loadError);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "Panels", PANEL_ID, "paymentAccounts"),
      (snapshot) => {
        const list: AccountOption[] = snapshot.docs
          .map((document) => {
            const data = document.data() as any;

            const name = String(
              data.accountName ||
                data.name ||
                data.accountTitle ||
                data.bankTitle ||
                data.title ||
                data.bankName ||
                document.id,
            ).trim();

            return {
              id: document.id,

              name,

              bankName: String(
                data.bankName || data.bank || data.financialInstitution || "",
              ).trim(),

              accountTitle: String(
                data.accountTitle ||
                  data.bankTitle ||
                  data.title ||
                  data.accountName ||
                  "",
              ).trim(),

              accountNo: String(
                data.accountNo ||
                  data.accountNumber ||
                  data.iban ||
                  data.ibanNo ||
                  "",
              ).trim(),

              iban: String(
                data.iban ||
                  data.ibanNo ||
                  data.accountNo ||
                  data.accountNumber ||
                  "",
              ).trim(),
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name));

        setAccounts(list);
      },
      (loadError) => {
        console.error("Failed to load payment accounts:", loadError);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "Panels", PANEL_ID, "rtdEstimates"),
      (snapshot) => {
        const map: Record<string, string> = {};

        snapshot.docs.forEach((document) => {
          map[document.id] = String(document.data()?.poNumber || "").trim();
        });

        setEstimatePoMap(map);
      },
      (loadError) => {
        console.error("Failed to load RTD estimates for PO lookup:", loadError);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "Panels", PANEL_ID, "rtdRecords"),
      (snapshot) => {
        const list = snapshot.docs.map((document) => ({
          id: document.id,
          ...(document.data() as Omit<RTDRecord, "id">),
        }));

        list.sort(
          (a, b) =>
            getTimestampValue(b.createdAt) - getTimestampValue(a.createdAt),
        );

        setRecords(list);

        const existingIds = new Set(list.map((record) => record.id));

        setSelectedRecordIds((previous) =>
          previous.filter((id) => existingIds.has(id)),
        );
      },
      (loadError) => {
        console.error("Failed to load RTD records:", loadError);
      },
    );

    return () => unsubscribe();
  }, []);

  const amountNumber = useMemo(
    () => toNumber(form.amountRequired),
    [form.amountRequired],
  );

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === form.accountFrom) || null,
    [accounts, form.accountFrom],
  );

  const eligibleRecords = useMemo(
    () => records.filter((record) => !String(record.estimateId || "").trim()),
    [records],
  );

  const selectedRecords = useMemo(
    () => records.filter((record) => selectedRecordIds.includes(record.id)),
    [records, selectedRecordIds],
  );

  const allEligibleSelected =
    eligibleRecords.length > 0 &&
    eligibleRecords.every((record) => selectedRecordIds.includes(record.id));

  const selectedAmount = useMemo(
    () =>
      selectedRecords.reduce(
        (sum, record) => sum + toNumber(record.amountRequired),
        0,
      ),
    [selectedRecords],
  );

  const updateField = (field: keyof FormState, value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setMessage("");
    setError("");
  };

  const validate = () => {
    if (!form.client.trim()) {
      return "Client is required.";
    }

    if (!form.subjectPurpose.trim()) {
      return "Subject / Purpose is required.";
    }

    if (!form.clientPersonOfContact.trim()) {
      return "Client Person of Contact is required.";
    }

    if (!form.accountFrom.trim()) {
      return "Account From is required.";
    }

    if (!form.pocContactNo.trim()) {
      return "PoC Contact No is required.";
    }

    if (!form.venue.trim()) {
      return "Venue is required.";
    }

    if (!form.bankName.trim()) {
      return "Bank Name is required.";
    }

    if (!form.bankTitle.trim()) {
      return "Bank Title is required.";
    }

    if (!form.ibanOrAccountNo.trim()) {
      return "IBAN No / Acc No is required.";
    }

    if (amountNumber <= 0) {
      return "Amount Required must be greater than zero.";
    }

    if (!form.paymentDate.trim()) {
      return "Payment Date is required.";
    }

    return "";
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setAttemptedSubmit(true);

    if (saving || savingRef.current) return;

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      setMessage("");
      return;
    }

    if (!selectedAccount) {
      setError("Selected From Account could not be found.");
      return;
    }

    try {
      savingRef.current = true;
      setSaving(true);
      setError("");
      setMessage("");

      const currentUser = auth.currentUser;

      if (editId) {
        const existingRecord = records.find((record) => record.id === editId);

        const batch = writeBatch(db);

        batch.update(doc(db, "Panels", PANEL_ID, "rtdRecords", editId), {
          requestor: form.requestor.trim(),
          client: form.client.trim(),
          subjectPurpose: form.subjectPurpose.trim(),
          clientPersonOfContact: form.clientPersonOfContact.trim(),
          accountFromId: selectedAccount.id,
          accountFromName: selectedAccount.name,
          accountFromBankName: selectedAccount.bankName || "",
          accountFromTitle: selectedAccount.accountTitle || "",
          accountFromAccountNo:
            selectedAccount.accountNo || selectedAccount.iban || "",
          pocContactNo: form.pocContactNo.trim(),
          venue: form.venue.trim(),
          bankName: form.bankName.trim(),
          bankTitle: form.bankTitle.trim(),
          ibanOrAccountNo: form.ibanOrAccountNo.trim(),
          amountRequired: amountNumber,
          paymentDate: form.paymentDate,
          paidBy: form.paidBy.trim(),
          updatedAt: serverTimestamp(),
        });

        if (existingRecord?.statementEntryId) {
          batch.update(
            doc(
              db,
              "Panels",
              PANEL_ID,
              "accountStatementManualEntries",
              existingRecord.statementEntryId,
            ),
            {
              date: form.paymentDate,
              description: [
                `RTD - ${form.client.trim()}`,
                `From Account: ${selectedAccount.name}`,
              ].join(" | "),
              debit: amountNumber,
              accountFromId: selectedAccount.id,
              accountFromName: selectedAccount.name,
              accountFromBankName: selectedAccount.bankName || "",
              accountFromTitle: selectedAccount.accountTitle || "",
              accountFromAccountNo:
                selectedAccount.accountNo || selectedAccount.iban || "",
              fromAccount: selectedAccount.name,
              client: form.client.trim(),
              amountRequired: amountNumber,
              updatedAt: serverTimestamp(),
            },
          );
        }

        await batch.commit();

        setForm(initialForm);
        setEditId(null);
        setAttemptedSubmit(false);
        setMessage("RTD record updated.");
        return;
      }

      const rtdRecordRef = doc(
        collection(db, "Panels", PANEL_ID, "rtdRecords"),
      );

      const statementEntryRef = doc(
        collection(db, "Panels", PANEL_ID, "accountStatementManualEntries"),
      );

      const batch = writeBatch(db);

      batch.set(rtdRecordRef, {
        requestor: form.requestor.trim(),

        client: form.client.trim(),

        subjectPurpose: form.subjectPurpose.trim(),

        clientPersonOfContact: form.clientPersonOfContact.trim(),

        accountFromId: selectedAccount.id,

        accountFromName: selectedAccount.name,

        accountFromBankName: selectedAccount.bankName || "",

        accountFromTitle: selectedAccount.accountTitle || "",

        accountFromAccountNo:
          selectedAccount.accountNo || selectedAccount.iban || "",

        pocContactNo: form.pocContactNo.trim(),

        venue: form.venue.trim(),

        bankName: form.bankName.trim(),

        bankTitle: form.bankTitle.trim(),

        ibanOrAccountNo: form.ibanOrAccountNo.trim(),

        amountRequired: amountNumber,

        paymentDate: form.paymentDate,

        paidBy: form.paidBy.trim(),

        statementEntryId: statementEntryRef.id,

        estimateId: "",
        estimateNo: "",
        estimateAmount: 0,

        invoiceId: "",
        invoiceNo: "",

        createdBy: currentUser?.uid || "",

        createdByEmail: currentUser?.email || "",

        createdAt: serverTimestamp(),

        updatedAt: serverTimestamp(),
      });

      batch.set(statementEntryRef, {
        date: form.paymentDate,

        description: [
          `RTD - ${form.client.trim()}`,
          `From Account: ${selectedAccount.name}`,
        ].join(" | "),

        debit: amountNumber,
        credit: 0,
        entryType: "debit",

        poNo: "",
        projectCode: "",

        sourceModule: "rtd",

        transactionType: "RTD Payment Requirement",

        rtdRecordId: rtdRecordRef.id,

        rtdEstimateId: "",
        rtdEstimateNo: "",

        rtdInvoiceId: "",
        rtdInvoiceNo: "",

        accountFromId: selectedAccount.id,

        accountFromName: selectedAccount.name,

        accountFromBankName: selectedAccount.bankName || "",

        accountFromTitle: selectedAccount.accountTitle || "",

        accountFromAccountNo:
          selectedAccount.accountNo || selectedAccount.iban || "",

        fromAccount: selectedAccount.name,

        reference: `RTD Record: ${rtdRecordRef.id}`,

        client: form.client.trim(),

        amountRequired: amountNumber,

        createdAt: serverTimestamp(),

        createdBy: currentUser?.displayName || currentUser?.email || "Unknown",

        createdById: currentUser?.uid || "",
      });

      await batch.commit();

      setForm(initialForm);
      setAttemptedSubmit(false);

      setMessage("RTD record saved and linked to the selected From Account.");
    } catch (saveError) {
      console.error("Failed to save RTD record:", saveError);

      setError(
        editId ? "Failed to update RTD record." : "Failed to save RTD record.",
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleEditRecord = (record: RTDRecord) => {
    setEditId(record.id);

    setForm({
      requestor: record.requestor || "",
      client: record.client || "",
      subjectPurpose: record.subjectPurpose || "",
      clientPersonOfContact: record.clientPersonOfContact || "",
      accountFrom: record.accountFromId || "",
      pocContactNo: record.pocContactNo || "",
      venue: record.venue || "",
      bankName: record.bankName || "",
      bankTitle: record.bankTitle || "",
      ibanOrAccountNo: record.ibanOrAccountNo || "",
      amountRequired:
        record.amountRequired != null ? String(record.amountRequired) : "",
      paymentDate: record.paymentDate || "",
      paidBy: record.paidBy || "",
    });

    setAttemptedSubmit(false);
    setError("");
    setMessage("");

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setForm(initialForm);
    setAttemptedSubmit(false);
    setError("");
    setMessage("");
  };

  const toggleRecord = (record: RTDRecord) => {
    if (record.estimateId) return;

    setSelectedRecordIds((previous) =>
      previous.includes(record.id)
        ? previous.filter((id) => id !== record.id)
        : [...previous, record.id],
    );

    setError("");
    setMessage("");
  };

  const toggleAllEligible = () => {
    if (allEligibleSelected) {
      const eligibleIds = new Set(eligibleRecords.map((record) => record.id));

      setSelectedRecordIds((previous) =>
        previous.filter((id) => !eligibleIds.has(id)),
      );

      return;
    }

    setSelectedRecordIds(
      Array.from(
        new Set([
          ...selectedRecordIds,
          ...eligibleRecords.map((record) => record.id),
        ]),
      ),
    );
  };

  const handleCreateEstimate = () => {
    if (selectedRecords.length === 0) {
      setError("Select at least one RTD record.");
      return;
    }

    const firstClient = normalizeClient(selectedRecords[0]?.client);

    const differentClient = selectedRecords.some(
      (record) => normalizeClient(record.client) !== firstClient,
    );

    if (differentClient) {
      setError(
        "A single Estimate can only contain RTD records for the same client.",
      );

      return;
    }

    if (selectedRecords.some((record) => record.estimateId)) {
      setError(
        "One or more selected records are already linked to an Estimate.",
      );

      return;
    }

    onCreateEstimate?.(selectedRecords.map((record) => record.id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
          RTD Records
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Create payment requirements, link them to From Accounts, then select
          one or multiple records for a single Estimate.
        </p>
      </div>

      {editId ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <span>
            Editing this RTD record will update it in place, along with its
            linked From Account statement entry.
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancelEdit}
            className="rounded-xl"
          >
            Cancel
          </Button>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <WalletCards className="h-5 w-5 text-slate-600" />
            </div>

            <div>
              <h2 className="font-bold text-slate-950">Payment Requirement</h2>

              <p className="text-xs text-slate-500">
                From Account is linked by its paymentAccounts document ID.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Requestor">
              <input
                className={fieldClass}
                value={form.requestor}
                onChange={(event) =>
                  updateField("requestor", event.target.value)
                }
                placeholder="Enter requestor"
              />
            </Field>

            <Field label="Client">
              <select
                className={withValidity(fieldClass, !form.client.trim())}
                value={form.client}
                onChange={(event) => updateField("client", event.target.value)}
              >
                <option value="">Select Client</option>

                {clients.map((client) => (
                  <option key={client.id} value={client.name}>
                    {client.name}
                  </option>
                ))}
              </select>
            </Field>

            {/* SUBJECT / PURPOSE INPUT */}
            <Field label="Subject / Purpose">
              <input
                className={withValidity(
                  fieldClass,
                  !form.subjectPurpose.trim(),
                )}
                value={form.subjectPurpose}
                onChange={(event) =>
                  updateField("subjectPurpose", event.target.value)
                }
                placeholder="Enter subject / purpose"
              />
            </Field>

            <Field label="Client Person of Contact ">
              <input
                className={withValidity(
                  fieldClass,
                  !form.clientPersonOfContact.trim(),
                )}
                value={form.clientPersonOfContact}
                onChange={(event) =>
                  updateField("clientPersonOfContact", event.target.value)
                }
                placeholder="Enter requestor"
              />
            </Field>

            <Field label="Account From">
              <select
                className={withValidity(fieldClass, !form.accountFrom.trim())}
                value={form.accountFrom}
                onChange={(event) =>
                  updateField("accountFrom", event.target.value)
                }
              >
                <option value="">Select From Account</option>

                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="PoC Contact No">
              <input
                className={withValidity(fieldClass, !form.pocContactNo.trim())}
                value={form.pocContactNo}
                onChange={(event) =>
                  updateField("pocContactNo", event.target.value)
                }
                placeholder="Enter contact number"
              />
            </Field>

            <Field label="Venue">
              <input
                className={withValidity(fieldClass, !form.venue.trim())}
                value={form.venue}
                onChange={(event) => updateField("venue", event.target.value)}
                placeholder="Enter venue"
              />
            </Field>

            <Field label="Bank Name">
              <input
                className={withValidity(fieldClass, !form.bankName.trim())}
                value={form.bankName}
                onChange={(event) =>
                  updateField("bankName", event.target.value)
                }
                placeholder="Recipient bank"
              />
            </Field>

            <Field label="Bank Title">
              <input
                className={withValidity(fieldClass, !form.bankTitle.trim())}
                value={form.bankTitle}
                onChange={(event) =>
                  updateField("bankTitle", event.target.value)
                }
                placeholder="Recipient account title"
              />
            </Field>

            <Field label="IBAN No / Acc No">
              <input
                className={withValidity(
                  fieldClass,
                  !form.ibanOrAccountNo.trim(),
                )}
                value={form.ibanOrAccountNo}
                onChange={(event) =>
                  updateField("ibanOrAccountNo", event.target.value)
                }
                placeholder="Enter IBAN / Account No"
              />
            </Field>

            <Field label="Amount Required">
              <input
                type="number"
                min="0"
                step="0.01"
                className={withValidity(fieldClass, amountNumber <= 0)}
                value={form.amountRequired}
                onChange={(event) =>
                  updateField("amountRequired", event.target.value)
                }
                placeholder="Enter amount"
              />
            </Field>

            <Field label="Payment Date">
              <input
                type="date"
                className={withValidity(fieldClass, !form.paymentDate.trim())}
                value={form.paymentDate}
                onChange={(event) =>
                  updateField("paymentDate", event.target.value)
                }
              />
            </Field>

            <Field label="Paid by">
              <input
                className={fieldClass}
                value={form.paidBy}
                onChange={(event) => updateField("paidBy", event.target.value)}
                placeholder="Enter Name"
              />
            </Field>
          </div>

          {selectedAccount ? (
            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              <strong>Selected From Account:</strong> {selectedAccount.name}
              {selectedAccount.bankName ? ` · ${selectedAccount.bankName}` : ""}
              {selectedAccount.accountTitle
                ? ` · ${selectedAccount.accountTitle}`
                : ""}
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {message}
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="h-11 rounded-xl bg-slate-950 px-5 text-white hover:bg-slate-800"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}

            {saving ? "Saving..." : editId ? "Update Record" : "Save Record"}
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-950">RTD Records List</h2>

            <p className="text-sm text-slate-500">
              Select one or multiple records belonging to the same client.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleCreateEstimate}
            disabled={selectedRecordIds.length === 0}
            className="rounded-xl bg-slate-950 text-white hover:bg-slate-800"
          >
            <FileText className="mr-2 h-4 w-4" />
            Create Estimate
            {selectedRecordIds.length > 0
              ? ` (${selectedRecordIds.length})`
              : ""}
          </Button>
        </div>

        {error ? (
          <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700">
            {message}
          </div>
        ) : null}

        {selectedRecordIds.length > 0 ? (
          <div className="border-b border-slate-100 bg-blue-50/60 px-5 py-3 text-sm text-blue-800">
            Selected: <strong>{selectedRecordIds.length}</strong> record(s) ·
            Total RTD Amount: <strong>Rs. {formatMoney(selectedAmount)}</strong>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1650px] text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="w-12 px-4 py-4 text-center">
                  <input
                    type="checkbox"
                    checked={allEligibleSelected}
                    onChange={toggleAllEligible}
                    aria-label="Select all records without an estimate"
                    className="h-4 w-4 rounded border-slate-300"
                  />
                </th>

                <th className="px-5 py-4 text-left">Client</th>

                <th className="px-5 py-4 text-left">Subject / Purpose</th>

                <th className="px-5 py-4 text-left">Requestor</th>

                <th className="px-5 py-4 text-left">From Account</th>

                <th className="px-5 py-4 text-left">Payment Date</th>

                <th className="px-5 py-4 text-right">Amount</th>

                <th className="px-5 py-4 text-left">Estimate</th>

                <th className="px-5 py-4 text-left">Invoice</th>

                <th className="px-5 py-4 text-left">PO</th>

                <th className="px-5 py-4 text-center">Days</th>

                <th className="px-5 py-4 text-left">Status</th>

                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {records.map((record) => {
                const selected = selectedRecordIds.includes(record.id);

                const hasEstimate = Boolean(
                  String(record.estimateId || "").trim(),
                );

                const status = getRecordStatus(record);

                const poNumber = record.estimateId
                  ? estimatePoMap[record.estimateId] || ""
                  : "";

                const noPo = !poNumber.trim();

                const daysSinceCreated = getDaysSince(record.createdAt);

                return (
                  <tr
                    key={record.id}
                    className={
                      selected
                        ? "bg-blue-50/60"
                        : noPo
                          ? "bg-red-50/70 hover:bg-red-100"
                          : "hover:bg-slate-50"
                    }
                  >
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={hasEstimate}
                        onChange={() => toggleRecord(record)}
                        title={
                          hasEstimate
                            ? "Already linked to an Estimate"
                            : "Select for Estimate"
                        }
                        className="h-4 w-4 rounded border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                      />
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {record.client || "-"}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {record.subjectPurpose || "-"}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {record.clientPersonOfContact || "-"}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-800">
                        {record.accountFromName || "-"}
                      </div>

                      <div className="mt-1 text-xs text-slate-400">
                        {record.accountFromId || "-"}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {record.paymentDate || "-"}
                    </td>

                    <td className="px-5 py-4 text-right font-bold text-slate-900">
                      Rs. {formatMoney(record.amountRequired)}
                    </td>

                    <td className="px-5 py-4">{record.estimateNo || "-"}</td>

                    <td className="px-5 py-4">{record.invoiceNo || "-"}</td>

                    <td className="px-5 py-4">
                      {noPo ? (
                        <span className="font-semibold text-red-600">
                          No PO
                        </span>
                      ) : (
                        poNumber
                      )}
                    </td>

                    <td className="px-5 py-4 text-center">
                      {daysSinceCreated === null ? "-" : daysSinceCreated}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditRecord(record)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewRecord(record)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {records.length === 0 ? (
                <tr>
                  <td
                    colSpan={13}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    No RTD records found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {previewRecord ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b bg-white p-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  RTD Record Details
                </h2>
                <p className="text-sm text-slate-500">
                  {previewRecord.subjectPurpose || "-"}
                </p>
              </div>

              <button
                onClick={() => setPreviewRecord(null)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-950"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
              <DetailItem label="Requestor" value={previewRecord.requestor} />
              <DetailItem label="Client" value={previewRecord.client} />
              <DetailItem
                label="Subject / Purpose"
                value={previewRecord.subjectPurpose}
              />
              <DetailItem
                label="Client Person of Contact"
                value={previewRecord.clientPersonOfContact}
              />
              <DetailItem
                label="PoC Contact No"
                value={previewRecord.pocContactNo}
              />
              <DetailItem label="Venue" value={previewRecord.venue} />
              <DetailItem
                label="From Account"
                value={previewRecord.accountFromName}
              />
              <DetailItem label="Bank Name" value={previewRecord.bankName} />
              <DetailItem label="Bank Title" value={previewRecord.bankTitle} />
              <DetailItem
                label="IBAN No / Acc No"
                value={previewRecord.ibanOrAccountNo}
              />
              <DetailItem
                label="Amount Required"
                value={`Rs. ${formatMoney(previewRecord.amountRequired)}`}
              />
              <DetailItem
                label="Payment Date"
                value={previewRecord.paymentDate}
              />
              <DetailItem label="Paid by" value={previewRecord.paidBy} />
              <DetailItem
                label="Estimate No"
                value={previewRecord.estimateNo}
              />
              <DetailItem label="Invoice No" value={previewRecord.invoiceNo} />
              <DetailItem
                label="Status"
                value={getRecordStatus(previewRecord).label}
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-white px-5 py-4">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  const record = previewRecord;
                  setPreviewRecord(null);
                  handleEditRecord(record);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      {children}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value || "-"}</p>
    </div>
  );
}
