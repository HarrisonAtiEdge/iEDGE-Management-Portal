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
//   increment,
//   onSnapshot,
//   runTransaction,
//   serverTimestamp,
//   writeBatch,
// } from "firebase/firestore";

// import { Button } from "@/components/ui/button";
// import {
//   Calculator,
//   ChevronDown,
//   Download,
//   Eye,
//   Loader2,
//   Pencil,
//   Receipt,
//   Save,
//   Trash2,
//   X,
// } from "lucide-react";
// import { buildEstimatePdfBlob } from "@/lib/estimatePdf";
// import type { Estimate } from "../../types";

// export const PANEL_ID = "IEDGE-SYSTEM";

// export const COMPANY_LIST = [
//   { name: "iEDGE", logo: "/Iedge-TM-Logos-01.png" },
//   {
//     name: "iEDGE - Digital & Creative",
//     logo: "/Iedge-Digital-and-Creative-TM-Logos-12.png",
//   },
//   { name: "iEDGE - Events & Activations", logo: "/iedge-events-logo.png" },
//   {
//     name: "iEDGE - Health Sciences",
//     logo: "/Iedge-Health-Sciences-TM-Logos-05.png",
//   },
//   { name: "iEDGE - International Education", logo: "/iedge-edu-logo.png" },
//   { name: "iEDGE - Trading", logo: "/Iedge-Trade-TM-Logos-10.png" },
//   { name: "iEDGE - Travel & Tours", logo: "/iedge-travel-logo.png" },
//   { name: "Catapult", logo: "/Catapult-TM-Logos-03.png" },
//   { name: "iConsultant", logo: "/Consultant-TM-Logos-02.png" },
//   { name: "Let's Save Green", logo: "/Lets-save-Green-TM-Logos-04.png" },
//   { name: "Emaan Biz", logo: "/Emaan-Biz-TM-Logos-06.png" },
// ];

// type Props = {
//   initialRecordIds?: string[];
//   onEstimateSaved?: () => void;
//   onCreateInvoice?: (estimate: RTDEstimateRecord) => void;
// };

// type RTDRecord = {
//   id: string;
//   requestor?: string;
//   client?: string;
//   subjectPurpose?: string;
//   clientPersonOfContact?: string;
//   pocContactNo?: string;
//   venue?: string;
//   accountFromId?: string;
//   accountFromName?: string;
//   accountFromBankName?: string;
//   accountFromTitle?: string;
//   accountFromAccountNo?: string;
//   bankName?: string;
//   bankTitle?: string;
//   ibanOrAccountNo?: string;
//   amountRequired?: number;
//   paymentDate?: string;
//   statementEntryId?: string;
//   estimateId?: string;
//   estimateNo?: string;
//   invoiceId?: string;
//   invoiceNo?: string;
//   createdAt?: any;
// };

// type TaxOption = {
//   id: string;
//   name: string;
//   percent: number;
// };

// type TermsConditionDoc = {
//   id: string;
//   name: string;
//   description: string;
// };

// type ClientRecord = {
//   id: string;
//   name: string;
//   address?: string;
//   city?: string;
//   zipCode?: string;
//   country?: string;
//   addtionalInfo?: string;
// };

// type ServiceRow = {
//   rowId: string;
//   rtdRecordId: string; // "" for manually added rows not tied to any RTD record
//   serviceName: string;
//   description: string;
//   unit: string;
//   manualRateInput: string; // used only when rtdRecordId is empty
//   isHeadingOnly: boolean; // manual rows only: no unit/cost, excluded from totals
// };

// export type SavedServiceRow = {
//   rtdRecordId: string;
//   serviceName: string;
//   description: string;
//   unit: number;
//   sourceAmount: number;
//   sourceUnitCost: number;
//   unitCost: number;
//   amount: number;
//   isHeadingOnly?: boolean;
// };

// export type RTDEstimateRecord = {
//   id: string;
//   rtdRecordId?: string;
//   rtdRecordIds?: string[];
//   rtdRecordCount?: number;
//   estimateNo?: string;
//   estimateDate?: string;
//   expiryDate?: string;
//   subjectPurpose?: string;
//   projectOwner?: string;
//   poNumber?: string;
//   client?: string;
//   accountFromId?: string;
//   accountFromIds?: string[];
//   accountFromName?: string;
//   accountFromNames?: string[];
//   statementEntryId?: string;
//   statementEntryIds?: string[];
//   marginInput?: string;
//   marginType?: "percentage" | "fixed";
//   marginPercent?: number;
//   marginAmount?: number;
//   salesTaxId?: string;
//   salesTaxName?: string;
//   salesTaxPercent?: number;
//   whtId?: string;
//   whtName?: string;
//   whtPercent?: number;
//   services?: SavedServiceRow[];
//   customerPayment?: number;
//   desiredNet?: number;
//   taxableValue?: number;
//   adjustedSubtotal?: number;
//   salesTaxAmount?: number;
//   estimateAmount?: number;
//   invoiceTotal?: number;
//   whtDeduction?: number;
//   cashReceived?: number;
//   netRetained?: number;
//   footerText?: string;
//   paymentTerm?: string;
//   termsConditionId?: string;
//   termsConditionTitle?: string;
//   termsConditionText?: string;
//   invoiceId?: string;
//   invoiceNo?: string;
//   createdBy?: string;
//   createdByEmail?: string;
//   createdAt?: any;
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

// const getTime = (value: any) => {
//   if (!value) return 0;
//   if (typeof value?.toMillis === "function") return value.toMillis();
//   if (value instanceof Date) return value.getTime();

//   const parsed = new Date(value).getTime();
//   return Number.isFinite(parsed) ? parsed : 0;
// };

// const normalizeClient = (value: unknown) =>
//   String(value || "").trim().toLowerCase();

// const uniqueStrings = (values: Array<string | undefined>) =>
//   Array.from(
//     new Set(
//       values.map((value) => String(value || "").trim()).filter(Boolean),
//     ),
//   );

// const makeRowId = () =>
//   typeof crypto !== "undefined" && "randomUUID" in crypto
//     ? crypto.randomUUID()
//     : `row_${Date.now()}_${Math.random().toString(16).slice(2)}`;

// const parseMargin = (raw: string, customerPayment: number) => {
//   const text = String(raw || "").trim();

//   if (!text) {
//     return {
//       type: "fixed" as const,
//       percentage: 0,
//       amount: 0,
//     };
//   }

//   if (text.endsWith("%")) {
//     const percentage = toNumber(text.replace("%", "")) / 100;

//     return {
//       type: "percentage" as const,
//       percentage,
//       amount: customerPayment * percentage,
//     };
//   }

//   const amount = toNumber(text);

//   return {
//     type: "fixed" as const,
//     percentage: customerPayment > 0 ? amount / customerPayment : 0,
//     amount,
//   };
// };

// const getEstimateStatus = (estimate: RTDEstimateRecord) => {
//   if (String(estimate.invoiceId || "").trim()) {
//     return {
//       label: "Invoiced",
//       className: "border-emerald-200 bg-emerald-50 text-emerald-700",
//     };
//   }

//   return {
//     label: "Pending Invoice",
//     className: "border-amber-200 bg-amber-50 text-amber-700",
//   };
// };

// export default function RTDEstimate({
//   initialRecordIds = [],
//   onEstimateSaved,
//   onCreateInvoice,
// }: Props) {
//   const [records, setRecords] = useState<RTDRecord[]>([]);
//   const [estimates, setEstimates] = useState<RTDEstimateRecord[]>([]);
//   const [salesTaxes, setSalesTaxes] = useState<TaxOption[]>([]);
//   const [whtOptions, setWhtOptions] = useState<TaxOption[]>([]);
//   const [termsConditions, setTermsConditions] = useState<TermsConditionDoc[]>(
//     [],
//   );
//   const [paymentTerms, setPaymentTerms] = useState<string[]>([]);
//   const [clients, setClients] = useState<ClientRecord[]>([]);
//   const [servicesList, setServicesList] = useState<
//     { id: string; name: string; description?: string }[]
//   >([]);

//   const [editId, setEditId] = useState<string | null>(null);
//   const [estimateNo, setEstimateNo] = useState("");
//   const [sharedCounterCurrent, setSharedCounterCurrent] = useState(200000);

//   const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
//   const [services, setServices] = useState<ServiceRow[]>([]);
//   const [estimateDate, setEstimateDate] = useState(
//     new Date().toISOString().slice(0, 10),
//   );
//   const [expiryDate, setExpiryDate] = useState("");
//   const [subjectPurpose, setSubjectPurpose] = useState("");
//   const [projectOwner, setProjectOwner] = useState("");
//   const [poNumber, setPoNumber] = useState("");
//   const [marginInput, setMarginInput] = useState("");
//   const [paymentTerm, setPaymentTerm] = useState("");
//   const [selectedSalesTaxId, setSelectedSalesTaxId] = useState("");
//   const [selectedWhtId, setSelectedWhtId] = useState("");
//   const [footerText, setFooterText] = useState("");
//   const [selectedTermsId, setSelectedTermsId] = useState("");
//   const [termsConditionTitle, setTermsConditionTitle] = useState("");
//   const [termsConditionText, setTermsConditionText] = useState("");
//   const [saving, setSaving] = useState(false);
//   const savingRef = useRef(false);
//   const [message, setMessage] = useState("");
//   const [error, setError] = useState("");
//   const [attemptedSubmit, setAttemptedSubmit] = useState(false);

//   const [openServiceRowId, setOpenServiceRowId] = useState<string | null>(
//     null,
//   );
//   const serviceDropdownRef = useRef<HTMLDivElement | null>(null);

//   const [loggedInUser, setLoggedInUser] = useState<{
//     displayName?: string;
//     email?: string;
//     mobileCountryCode?: string;
//     mobileNo?: string;
//     mobile?: string;
//   } | null>(null);

//   const [previewURL, setPreviewURL] = useState<string | null>(null);
//   const [isPreviewOpen, setIsPreviewOpen] = useState(false);
//   const [lastSavedEstimateNo, setLastSavedEstimateNo] = useState("");

//   const [listPreviewURL, setListPreviewURL] = useState<string | null>(null);
//   const [isListDrawerOpen, setIsListDrawerOpen] = useState(false);
//   const [selectedListEstimate, setSelectedListEstimate] =
//     useState<RTDEstimateRecord | null>(null);
//   const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(
//     null,
//   );
//   const [downloadLoadingId, setDownloadLoadingId] = useState<string | null>(
//     null,
//   );

//   const lastInitialSelectionRef = useRef("");

//   const fieldClass =
//     "w-full rounded-lg border border-gray-300 p-2 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

//   const invalidFieldClass =
//     "border-red-400 ring-2 ring-red-100 focus:ring-red-200 focus:border-red-400";

//   const withValidity = (base: string, invalid: boolean) =>
//     invalid && attemptedSubmit ? `${base} ${invalidFieldClass}` : base;

//   useEffect(() => {
//     const unsubscribe = onSnapshot(
//       collection(db, "Panels", PANEL_ID, "rtdRecords"),
//       (snapshot) => {
//         const list = snapshot.docs.map((document) => ({
//           id: document.id,
//           ...(document.data() as Omit<RTDRecord, "id">),
//         }));

//         list.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
//         setRecords(list);
//       },
//       (loadError) => {
//         console.error("Failed to load RTD records:", loadError);
//       },
//     );

//     return () => unsubscribe();
//   }, []);

//   useEffect(() => {
//     const unsubscribe = onSnapshot(
//       collection(db, "Panels", PANEL_ID, "rtdEstimates"),
//       (snapshot) => {
//         const list = snapshot.docs.map((document) => ({
//           id: document.id,
//           ...(document.data() as Omit<RTDEstimateRecord, "id">),
//         }));

//         list.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
//         setEstimates(list);
//       },
//       (loadError) => {
//         console.error("Failed to load RTD estimates:", loadError);
//       },
//     );

//     return () => unsubscribe();
//   }, []);

//   useEffect(() => {
//     const unsubscribe = onSnapshot(
//       collection(db, "Panels", PANEL_ID, "tax"),
//       (snapshot) => {
//         const list = snapshot.docs
//           .map((document) => {
//             const data = document.data() as any;
//             return {
//               id: document.id,
//               name: String(data.name || data.title || "Tax").trim(),
//               percent: toNumber(data.percent),
//             };
//           })
//           .sort((a, b) => a.name.localeCompare(b.name));

//         setSalesTaxes(list);
//       },
//       (loadError) => {
//         console.error("Failed to load Sales Tax:", loadError);
//       },
//     );

//     return () => unsubscribe();
//   }, []);

//   useEffect(() => {
//     const unsubscribe = onSnapshot(
//       collection(db, "Panels", PANEL_ID, "withholdingTax"),
//       (snapshot) => {
//         const list = snapshot.docs
//           .map((document) => {
//             const data = document.data() as any;
//             return {
//               id: document.id,
//               name: String(data.name || data.title || "WHT").trim(),
//               percent: toNumber(data.percent),
//             };
//           })
//           .sort((a, b) => a.name.localeCompare(b.name));

//         setWhtOptions(list);
//       },
//       (loadError) => {
//         console.error("Failed to load WHT:", loadError);
//       },
//     );

//     return () => unsubscribe();
//   }, []);

//   useEffect(() => {
//     const unsubscribe = onSnapshot(
//       collection(db, "Panels", PANEL_ID, "termsConditions"),
//       (snapshot) => {
//         const list: TermsConditionDoc[] = snapshot.docs
//           .map((document) => {
//             const data = document.data() as any;
//             return {
//               id: document.id,
//               name: String(data?.name || "").trim(),
//               description: String(data?.description || "").replace(
//                 /\r\n/g,
//                 "\n",
//               ),
//             };
//           })
//           .filter((item) => item.name)
//           .sort((a, b) => a.name.localeCompare(b.name));

//         setTermsConditions(list);
//       },
//       (loadError) => {
//         console.error("Failed to load Terms & Conditions:", loadError);
//       },
//     );

//     return () => unsubscribe();
//   }, []);

//   useEffect(() => {
//     const unsubscribe = onSnapshot(
//       collection(db, "Panels", PANEL_ID, "clients"),
//       (snapshot) => {
//         const list: ClientRecord[] = snapshot.docs.map((document) => {
//           const data = document.data() as any;
//           return {
//             id: document.id,
//             name: String(data?.name || "").trim(),
//             address: String(data?.address || "").trim(),
//             city: String(data?.city || "").trim(),
//             zipCode: String(data?.zipCode || "").trim(),
//             country: String(data?.country || "").trim(),
//             addtionalInfo: String(data?.addtionalInfo || "").trim(),
//           };
//         });

//         setClients(list);
//       },
//       (loadError) => {
//         console.error("Failed to load clients:", loadError);
//       },
//     );

//     return () => unsubscribe();
//   }, []);

//   useEffect(() => {
//     const unsubscribe = onSnapshot(
//       collection(db, "Panels", PANEL_ID, "paymentTerms"),
//       (snapshot) => {
//         const list = snapshot.docs
//           .map((document) => String(document.data()?.name || "").trim())
//           .filter(Boolean);

//         setPaymentTerms(list);
//       },
//       (loadError) => {
//         console.error("Failed to load Payment Terms:", loadError);
//       },
//     );

//     return () => unsubscribe();
//   }, []);

//   useEffect(() => {
//     const unsubscribe = onSnapshot(
//       collection(db, "Panels", PANEL_ID, "services"),
//       (snapshot) => {
//         const list = snapshot.docs
//           .map((document) => ({
//             id: document.id,
//             name: String(document.data()?.name || "").trim(),
//             description: String(document.data()?.description || ""),
//           }))
//           .filter((service) => service.name)
//           .sort((a, b) =>
//             a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
//           );

//         setServicesList(list);
//       },
//       (loadError) => {
//         console.error("Failed to load services:", loadError);
//       },
//     );

//     return () => unsubscribe();
//   }, []);

//   useEffect(() => {
//     const uid = auth.currentUser?.uid;
//     if (!uid) return;

//     const unsubscribe = onSnapshot(
//       doc(db, "Panels", PANEL_ID, "users", uid),
//       (snap) => {
//         setLoggedInUser(snap.exists() ? (snap.data() as any) : null);
//       },
//     );

//     return () => unsubscribe();
//   }, []);

//   // ✅ shared with the normal Estimate feature, purely to preview the next number
//   useEffect(() => {
//     const unsubscribe = onSnapshot(
//       doc(db, "Panels", PANEL_ID, "counters", "estimates"),
//       (snap) => {
//         const current = snap.exists() ? toNumber(snap.data()?.current) : 0;
//         setSharedCounterCurrent(current > 0 ? current : 200000);
//       },
//       (loadError) => {
//         console.error("Failed to load estimate counter:", loadError);
//       },
//     );

//     return () => unsubscribe();
//   }, []);

//   // ✅ close service dropdown on outside click
//   useEffect(() => {
//     const onDown = (e: MouseEvent) => {
//       if (!openServiceRowId) return;
//       const el = serviceDropdownRef.current;
//       if (el && !el.contains(e.target as any)) {
//         setOpenServiceRowId(null);
//       }
//     };
//     document.addEventListener("mousedown", onDown);
//     return () => document.removeEventListener("mousedown", onDown);
//   }, [openServiceRowId]);

//   const nextEstimateNo = `IE-${sharedCounterCurrent + 1}`;

//   const selectedRecords = useMemo(
//     () => records.filter((record) => selectedRecordIds.includes(record.id)),
//     [records, selectedRecordIds],
//   );

//   const selectedClient = selectedRecords[0]?.client || "";

//   const selectedClientInfo = useMemo(
//     () =>
//       clients.find(
//         (client) => normalizeClient(client.name) === normalizeClient(selectedClient),
//       ) || null,
//     [clients, selectedClient],
//   );

//   const selectedClientAddress = useMemo(
//     () =>
//       uniqueStrings([
//         selectedClientInfo?.address,
//         selectedClientInfo?.city,
//         selectedClientInfo?.zipCode,
//         selectedClientInfo?.country,
//       ]).join(", "),
//     [selectedClientInfo],
//   );

//   const selectedSalesTax = useMemo(
//     () => salesTaxes.find((tax) => tax.id === selectedSalesTaxId) || null,
//     [salesTaxes, selectedSalesTaxId],
//   );

//   const selectedWht = useMemo(
//     () => whtOptions.find((wht) => wht.id === selectedWhtId) || null,
//     [whtOptions, selectedWhtId],
//   );

//   const syncServicesToSelection = (
//     nextIds: string[],
//     currentRecords = records,
//   ) => {
//     const selected = currentRecords.filter((record) =>
//       nextIds.includes(record.id),
//     );

//     setServices((previous) => {
//       const previousMap = new Map(
//         previous
//           .filter((service) => service.rtdRecordId)
//           .map((service) => [service.rtdRecordId, service]),
//       );

//       const recordRows = selected.map((record) => {
//         const old = previousMap.get(record.id);
//         if (old) return old;

//         return {
//           rowId: makeRowId(),
//           rtdRecordId: record.id,
//           serviceName: record.subjectPurpose || "",
//           description: record.venue || "",
//           unit: "1",
//           manualRateInput: "",
//           isHeadingOnly: false,
//         };
//       });

//       const manualRows = previous.filter((service) => !service.rtdRecordId);

//       return [...recordRows, ...manualRows];
//     });
//   };

//   useEffect(() => {
//     if (!records.length || !initialRecordIds.length) return;

//     const key = [...initialRecordIds].sort().join("|");
//     if (lastInitialSelectionRef.current === key) return;

//     const valid = initialRecordIds.filter((id) => {
//       const record = records.find((item) => item.id === id);
//       return record && !record.estimateId;
//     });

//     if (!valid.length) return;

//     const selected = records.filter((record) => valid.includes(record.id));
//     const firstClient = normalizeClient(selected[0]?.client);
//     const sameClient = selected.every(
//       (record) => normalizeClient(record.client) === firstClient,
//     );

//     if (!sameClient) {
//       setError(
//         "The selected RTDs contain different clients. A single Estimate can only belong to one client.",
//       );
//       return;
//     }

//     setSelectedRecordIds(valid);
//     syncServicesToSelection(valid, records);

//     const requestorNames = uniqueStrings(selected.map((r) => r.requestor));
//     if (requestorNames.length) {
//       setProjectOwner((prev) => prev || requestorNames.join(", "));
//     }

//     lastInitialSelectionRef.current = key;
//   }, [initialRecordIds, records]);

//   const updateService = (
//     rowId: string,
//     field: "serviceName" | "description" | "unit" | "manualRateInput",
//     value: string,
//   ) => {
//     setServices((previous) =>
//       previous.map((service) =>
//         service.rowId === rowId ? { ...service, [field]: value } : service,
//       ),
//     );
//   };

//   const toggleHeadingOnly = (rowId: string) => {
//     setServices((previous) =>
//       previous.map((service) =>
//         service.rowId === rowId
//           ? { ...service, isHeadingOnly: !service.isHeadingOnly }
//           : service,
//       ),
//     );
//   };

//   const handleSelectServiceName = (rowId: string, name: string) => {
//     updateService(rowId, "serviceName", name);

//     const matchedService = servicesList.find((sv) => sv.name === name);
//     if (matchedService?.description) {
//       setServices((previous) =>
//         previous.map((service) =>
//           service.rowId === rowId && !service.description.trim()
//             ? { ...service, description: matchedService.description || "" }
//             : service,
//         ),
//       );
//     }

//     setOpenServiceRowId(null);
//   };

//   const handleAddRow = () => {
//     setServices((previous) => [
//       ...previous,
//       {
//         rowId: makeRowId(),
//         rtdRecordId: "",
//         serviceName: "",
//         description: "",
//         unit: "1",
//         manualRateInput: "",
//         isHeadingOnly: true,
//       },
//     ]);
//   };

//   const handleRemoveRow = (rowId: string) => {
//     setServices((previous) =>
//       previous.filter(
//         (service) => !(service.rowId === rowId && !service.rtdRecordId),
//       ),
//     );
//   };

//   const customerPayment = useMemo(
//     () =>
//       selectedRecords.reduce(
//         (sum, record) => sum + toNumber(record.amountRequired),
//         0,
//       ),
//     [selectedRecords],
//   );

//   const margin = useMemo(
//     () => parseMargin(marginInput, customerPayment),
//     [marginInput, customerPayment],
//   );

//   const desiredNet = customerPayment + margin.amount;
//   const salesTaxRate = toNumber(selectedSalesTax?.percent) / 100;
//   const whtRate = toNumber(selectedWht?.percent) / 100;
//   const denominator = (1 + salesTaxRate) * (1 - whtRate) - salesTaxRate;
//   const taxableValue =
//     denominator > 0 && desiredNet > 0 ? desiredNet / denominator : 0;
//   const adjustmentFactor =
//     customerPayment > 0 ? taxableValue / customerPayment : 0;

//   const calculatedServices = useMemo(() => {
//     return services.map((service) => {
//       const record = selectedRecords.find(
//         (item) => item.id === service.rtdRecordId,
//       );
//       const units = Math.max(toNumber(service.unit), 0);

//       if (record) {
//         const sourceAmount = toNumber(record.amountRequired);
//         const adjustedLineAmount = sourceAmount * adjustmentFactor;
//         const adjustedUnitCost = units > 0 ? adjustedLineAmount / units : 0;
//         const sourceUnitCost = units > 0 ? sourceAmount / units : 0;

//         return {
//           ...service,
//           units,
//           sourceAmount,
//           sourceUnitCost,
//           adjustedUnitCost,
//           adjustedLineAmount,
//           isManual: false,
//         };
//       }

//       if (service.isHeadingOnly) {
//         return {
//           ...service,
//           units: 0,
//           sourceAmount: 0,
//           sourceUnitCost: 0,
//           adjustedUnitCost: 0,
//           adjustedLineAmount: 0,
//           isManual: true,
//         };
//       }

//       const adjustedUnitCost = toNumber(service.manualRateInput);
//       const adjustedLineAmount = units * adjustedUnitCost;

//       return {
//         ...service,
//         units,
//         sourceAmount: 0,
//         sourceUnitCost: adjustedUnitCost,
//         adjustedUnitCost,
//         adjustedLineAmount,
//         isManual: true,
//       };
//     });
//   }, [services, selectedRecords, adjustmentFactor]);

//   const adjustedSubtotal = useMemo(
//     () =>
//       calculatedServices.reduce(
//         (sum, service) => sum + service.adjustedLineAmount,
//         0,
//       ),
//     [calculatedServices],
//   );

//   const salesTaxAmount = adjustedSubtotal * salesTaxRate;
//   const invoiceTotal = adjustedSubtotal + salesTaxAmount;
//   const whtDeduction = invoiceTotal * whtRate;
//   const cashReceived = invoiceTotal - whtDeduction;
//   const netRetained = cashReceived - salesTaxAmount;

//   const selectedFromAccounts = useMemo(
//     () => uniqueStrings(selectedRecords.map((record) => record.accountFromName)),
//     [selectedRecords],
//   );

//   const selectedStatementIds = useMemo(
//     () => uniqueStrings(selectedRecords.map((record) => record.statementEntryId)),
//     [selectedRecords],
//   );

//   const handleSelectTerms = (id: string) => {
//     setSelectedTermsId(id);
//     const found = termsConditions.find((item) => item.id === id);

//     if (!found) {
//       setTermsConditionTitle("");
//       setTermsConditionText("");
//       return;
//     }

//     setTermsConditionTitle(found.name);
//     setTermsConditionText(found.description);
//   };

//   const buildRtdEstimateForPdf = (args: {
//     estimateNo: string;
//     estimateDate: string;
//     expiryDate: string;
//     client: string;
//     projectOwner: string;
//     subjectPurpose: string;
//     services: {
//       serviceName: string;
//       description: string;
//       unit: number;
//       unitCost: number;
//       showFinancialsInPdf: boolean;
//     }[];
//     subtotal: number;
//     taxAmount: number;
//     total: number;
//     taxPercent: number;
//     taxLabel: string;
//     footerText: string;
//     paymentTerm: string;
//     poNumber: string;
//     termsConditionTitle: string;
//     termsConditionText: string;
//     createdBy: string;
//   }) => ({
//     estimateNo: args.estimateNo,
//     client: args.client,
//     date: args.estimateDate,
//     expiryDate: args.expiryDate || args.estimateDate,
//     projectOwner: args.projectOwner,
//     services: args.services.map((service) => ({
//       detail: service.serviceName,
//       description: service.description,
//       units: service.unit,
//       rate: service.unitCost,
//       showFinancialsInPdf: service.showFinancialsInPdf,
//       // ✅ per-line tax so the shared PDF builder's Tax Summary table renders;
//       // omitted on heading-only rows so they never leak into its totals
//       taxLabel: service.showFinancialsInPdf ? args.taxLabel : undefined,
//       taxPercent: service.showFinancialsInPdf ? args.taxPercent : 0,
//     })),
//     subtotal: args.subtotal,
//     tax: args.taxAmount,
//     poNumber: args.poNumber,
//     subject: args.subjectPurpose,
//     total: args.total,
//     paymentTerm: args.paymentTerm,
//     company: "iEDGE",
//     taxType: "exclusive",
//     taxPercent: args.taxPercent,
//     message: args.footerText,
//     termsConditionTitle: args.termsConditionTitle,
//     termsConditionText: args.termsConditionText,
//     createdBy: args.createdBy,
//   });

//   const buildPdfBlobForEstimate = async (estimate: RTDEstimateRecord) => {
//     const savedServices = Array.isArray(estimate.services)
//       ? estimate.services
//       : [];

//     const pdfEstimate = buildRtdEstimateForPdf({
//       estimateNo: estimate.estimateNo || "",
//       estimateDate: estimate.estimateDate || "",
//       expiryDate: estimate.expiryDate || estimate.estimateDate || "",
//       client: estimate.client || "",
//       projectOwner: estimate.projectOwner || "",
//       subjectPurpose: estimate.subjectPurpose || "",
//       poNumber: estimate.poNumber || "",
//       services: savedServices.map((service) => ({
//         serviceName: service.serviceName || "",
//         description: service.description || "",
//         unit: toNumber(service.unit),
//         unitCost: toNumber(service.unitCost),
//         showFinancialsInPdf: !service.isHeadingOnly,
//       })),
//       subtotal: toNumber(
//         (estimate as any).adjustedSubtotal ?? estimate.taxableValue,
//       ),
//       taxAmount: toNumber(estimate.salesTaxAmount),
//       total: toNumber(estimate.invoiceTotal ?? estimate.estimateAmount),
//       taxPercent: toNumber(estimate.salesTaxPercent),
//       taxLabel: estimate.salesTaxName || "",
//       footerText: estimate.footerText || "",
//       paymentTerm: estimate.paymentTerm || "",
//       termsConditionTitle: estimate.termsConditionTitle || "",
//       termsConditionText: estimate.termsConditionText || "",
//       createdBy: "",
//     });

//     return buildEstimatePdfBlob({
//       estimate: pdfEstimate as unknown as Estimate,
//       companyList: COMPANY_LIST,
//       withLogo: true,
//       footerUser: loggedInUser,
//       companyName: "iEDGE",
//     });
//   };

//   const handlePreviewEstimate = async (estimate: RTDEstimateRecord) => {
//     try {
//       setPreviewLoadingId(estimate.id);

//       const blob = await buildPdfBlobForEstimate(estimate);

//       setSelectedListEstimate(estimate);
//       setListPreviewURL(URL.createObjectURL(blob));
//       setIsListDrawerOpen(true);
//     } catch (previewError) {
//       console.error("Failed to build RTD Estimate preview:", previewError);
//     } finally {
//       setPreviewLoadingId(null);
//     }
//   };

//   const handleDownloadEstimate = async (estimate: RTDEstimateRecord) => {
//     try {
//       setDownloadLoadingId(estimate.id);

//       const blob = await buildPdfBlobForEstimate(estimate);

//       const link = document.createElement("a");
//       link.href = URL.createObjectURL(blob);
//       link.download = `${estimate.estimateNo || "rtd-estimate"}.pdf`;
//       link.click();
//     } catch (downloadError) {
//       console.error("Failed to download RTD Estimate:", downloadError);
//     } finally {
//       setDownloadLoadingId(null);
//     }
//   };

//   const resetForm = () => {
//     setEditId(null);
//     setEstimateNo("");
//     setSelectedRecordIds([]);
//     setServices([]);
//     setSubjectPurpose("");
//     setProjectOwner("");
//     setPoNumber("");
//     setMarginInput("");
//     setPaymentTerm("");
//     setSelectedSalesTaxId("");
//     setSelectedWhtId("");
//     setFooterText("");
//     setSelectedTermsId("");
//     setTermsConditionTitle("");
//     setTermsConditionText("");
//     setExpiryDate("");
//     setAttemptedSubmit(false);
//     lastInitialSelectionRef.current = "";
//   };

//   const handleEditEstimate = (estimate: RTDEstimateRecord) => {
//     const recordIds =
//       Array.isArray(estimate.rtdRecordIds) && estimate.rtdRecordIds.length > 0
//         ? estimate.rtdRecordIds
//         : estimate.rtdRecordId
//           ? [estimate.rtdRecordId]
//           : [];

//     setEditId(estimate.id);
//     setEstimateNo(estimate.estimateNo || "");
//     setEstimateDate(
//       estimate.estimateDate || new Date().toISOString().slice(0, 10),
//     );
//     setExpiryDate(estimate.expiryDate || "");
//     setSubjectPurpose(estimate.subjectPurpose || "");
//     setProjectOwner(estimate.projectOwner || "");
//     setPoNumber(estimate.poNumber || "");
//     setMarginInput(estimate.marginInput || "");
//     setPaymentTerm(estimate.paymentTerm || "");
//     setSelectedSalesTaxId(estimate.salesTaxId || "");
//     setSelectedWhtId(estimate.whtId || "");
//     setFooterText(estimate.footerText || "");
//     setSelectedTermsId(estimate.termsConditionId || "");
//     setTermsConditionTitle(estimate.termsConditionTitle || "");
//     setTermsConditionText(estimate.termsConditionText || "");
//     setSelectedRecordIds(recordIds);

//     const savedServices = Array.isArray(estimate.services)
//       ? estimate.services
//       : [];

//     setServices(
//       savedServices.map((service) => ({
//         rowId: makeRowId(),
//         rtdRecordId: service.rtdRecordId || "",
//         serviceName: service.serviceName || "",
//         description: service.description || "",
//         unit: String(service.unit ?? ""),
//         manualRateInput: service.rtdRecordId
//           ? ""
//           : String(service.unitCost ?? ""),
//         isHeadingOnly: Boolean(service.isHeadingOnly),
//       })),
//     );

//     lastInitialSelectionRef.current = [...recordIds].sort().join("|");
//     setError("");
//     setMessage("");
//     setAttemptedSubmit(false);

//     if (typeof window !== "undefined") {
//       window.scrollTo({ top: 0, behavior: "smooth" });
//     }
//   };

//   const validate = () => {
//     if (selectedRecords.length === 0) return "Select at least one RTD Record.";
//     if (!estimateDate) return "Issue Date is required.";
//     if (!expiryDate) return "Expiry Date is required.";
//     if (!subjectPurpose.trim()) return "Subject / Purpose is required.";
//     if (!projectOwner.trim()) return "Project Owner is required.";
//     if (!marginInput.trim()) return "Margin is required.";
//     if (!paymentTerm.trim()) return "Payment Terms is required.";
//     if (!selectedSalesTaxId) return "Sales Tax is required.";
//     if (!selectedWhtId) return "WHT is required.";
//     if (!selectedTermsId) return "Terms & Conditions is required.";
//     if (!termsConditionText.trim()) return "Terms & Conditions text is required.";
//     if (customerPayment <= 0) return "Selected RTD total must be greater than zero.";
//     if (denominator <= 0) {
//       return "The selected Sales Tax and WHT combination produces an invalid gross-up calculation.";
//     }

//     const invalidService = calculatedServices.find((service) => {
//       if (!service.serviceName.trim()) return true;
//       if (service.isHeadingOnly) return false;
//       return service.units <= 0 || service.adjustedUnitCost <= 0;
//     });

//     if (invalidService) {
//       return "Each service requires a Service Name (and a Unit greater than zero, unless it's a heading-only row).";
//     }

//     return "";
//   };

//   const handleSubmit = async (event: FormEvent) => {
//     event.preventDefault();
//     setAttemptedSubmit(true);
//     if (saving || savingRef.current) return;

//     const validationError = validate();

//     if (validationError) {
//       setError(validationError);
//       setMessage("");
//       return;
//     }

//     const wasEditing = Boolean(editId);

//     try {
//       savingRef.current = true;
//       setSaving(true);
//       setError("");
//       setMessage("");

//       const currentUser = auth.currentUser;
//       const currentUserName = String(
//         loggedInUser?.displayName ||
//           currentUser?.displayName ||
//           loggedInUser?.email ||
//           currentUser?.email ||
//           "Unknown User",
//       ).trim();
//       const currentUserEmail = String(
//         loggedInUser?.email || currentUser?.email || "",
//       ).trim();

//       const accountFromIds = uniqueStrings(
//         selectedRecords.map((record) => record.accountFromId),
//       );
//       const accountFromNames = uniqueStrings(
//         selectedRecords.map((record) => record.accountFromName),
//       );
//       const statementEntryIds = uniqueStrings(
//         selectedRecords.map((record) => record.statementEntryId),
//       );

//       const savedServices: SavedServiceRow[] = calculatedServices.map(
//         (service) => ({
//           rtdRecordId: service.rtdRecordId,
//           serviceName: service.serviceName.trim(),
//           description: service.description.trim(),
//           unit: service.units,
//           sourceAmount: service.sourceAmount,
//           sourceUnitCost: service.sourceUnitCost,
//           unitCost: service.adjustedUnitCost,
//           amount: service.adjustedLineAmount,
//           isHeadingOnly: service.isHeadingOnly,
//         }),
//       );

//       const estimatePayload = {
//         rtdRecordId:
//           selectedRecords.length === 1 ? selectedRecords[0].id : "",
//         rtdRecordIds: selectedRecords.map((record) => record.id),
//         rtdRecordCount: selectedRecords.length,
//         estimateDate,
//         expiryDate,
//         subjectPurpose: subjectPurpose.trim(),
//         projectOwner: projectOwner.trim(),
//         poNumber: poNumber.trim(),
//         client: selectedClient,
//         rtdRecords: selectedRecords.map((record) => ({
//           id: record.id,
//           client: record.client || "",
//           clientPersonOfContact: record.clientPersonOfContact || "",
//           pocContactNo: record.pocContactNo || "",
//           venue: record.venue || "",
//           amountRequired: toNumber(record.amountRequired),
//           paymentDate: record.paymentDate || "",
//           accountFromId: record.accountFromId || "",
//           accountFromName: record.accountFromName || "",
//           bankName: record.bankName || "",
//           bankTitle: record.bankTitle || "",
//           ibanOrAccountNo: record.ibanOrAccountNo || "",
//           statementEntryId: record.statementEntryId || "",
//         })),
//         accountFromId: accountFromIds.length === 1 ? accountFromIds[0] : "",
//         accountFromIds,
//         accountFromName:
//           accountFromNames.length === 1 ? accountFromNames[0] : "",
//         accountFromNames,
//         statementEntryId:
//           statementEntryIds.length === 1 ? statementEntryIds[0] : "",
//         statementEntryIds,
//         marginInput: marginInput.trim(),
//         marginType: margin.type,
//         marginPercent: margin.percentage * 100,
//         marginAmount: margin.amount,
//         salesTaxId: selectedSalesTax?.id || "",
//         salesTaxName: selectedSalesTax?.name || "",
//         salesTaxPercent: selectedSalesTax?.percent || 0,
//         whtId: selectedWht?.id || "",
//         whtName: selectedWht?.name || "",
//         whtPercent: selectedWht?.percent || 0,
//         services: savedServices,
//         customerPayment,
//         desiredNet,
//         taxableValue: adjustedSubtotal,
//         adjustedSubtotal,
//         salesTaxAmount,
//         estimateAmount: invoiceTotal,
//         invoiceTotal,
//         whtDeduction,
//         cashReceived,
//         netRetained,
//         taxSummary: {
//           salesTaxId: selectedSalesTax?.id || "",
//           salesTaxName: selectedSalesTax?.name || "",
//           salesTaxPercent: selectedSalesTax?.percent || 0,
//           salesTaxAmount,
//         },
//         footerText: footerText.trim(),
//         paymentTerm: paymentTerm.trim(),
//         termsConditionId: selectedTermsId,
//         termsConditionTitle,
//         termsConditionText,
//       };

//       let savedEstimateNo = "";

//       if (editId) {
//         const estimateRef = doc(db, "Panels", PANEL_ID, "rtdEstimates", editId);
//         savedEstimateNo = estimateNo;

//         const batch = writeBatch(db);

//         batch.set(
//           estimateRef,
//           {
//             ...estimatePayload,
//             estimateNo,
//             lastEditedById: currentUser?.uid || "",
//             lastEditedByName: currentUserName,
//             lastEditedByEmail: currentUserEmail,
//             lastEditedAt: serverTimestamp(),
//             editCount: increment(1),
//             updatedAt: serverTimestamp(),
//           },
//           { merge: true },
//         );

//         selectedRecords.forEach((record) => {
//           batch.update(doc(db, "Panels", PANEL_ID, "rtdRecords", record.id), {
//             estimateId: estimateRef.id,
//             estimateNo,
//             estimateAmount: invoiceTotal,
//             updatedAt: serverTimestamp(),
//           });

//           if (record.statementEntryId) {
//             batch.update(
//               doc(
//                 db,
//                 "Panels",
//                 PANEL_ID,
//                 "accountStatementManualEntries",
//                 record.statementEntryId,
//               ),
//               {
//                 rtdEstimateId: estimateRef.id,
//                 rtdEstimateNo: estimateNo,
//                 rtdEstimateTotal: invoiceTotal,
//                 description: [
//                   `RTD - ${record.client || "Client"}`,
//                   `From Account: ${record.accountFromName || "-"}`,
//                   `Estimate: ${estimateNo}`,
//                   record.invoiceNo ? `Invoice: ${record.invoiceNo}` : "",
//                 ]
//                   .filter(Boolean)
//                   .join(" | "),
//                 reference: [
//                   `RTD Record: ${record.id}`,
//                   `Estimate: ${estimateNo}`,
//                   record.invoiceNo ? `Invoice: ${record.invoiceNo}` : "",
//                 ]
//                   .filter(Boolean)
//                   .join(" | "),
//                 updatedAt: serverTimestamp(),
//               },
//             );
//           }
//         });

//         await batch.commit();
//       } else {
//         const estimateRef = doc(
//           collection(db, "Panels", PANEL_ID, "rtdEstimates"),
//         );
//         const counterRef = doc(db, "Panels", PANEL_ID, "counters", "estimates");

//         await runTransaction(db, async (transaction) => {
//           const counterSnap = await transaction.get(counterRef);
//           const current = Number(
//             counterSnap.exists() ? counterSnap.data()?.current : 200000,
//           );
//           const nextNumber = current + 1;
//           const generatedEstimateNo = `IE-${nextNumber}`;
//           savedEstimateNo = generatedEstimateNo;

//           transaction.set(counterRef, { current: nextNumber }, { merge: true });

//           transaction.set(estimateRef, {
//             ...estimatePayload,
//             estimateNo: generatedEstimateNo,
//             invoiceId: "",
//             invoiceNo: "",
//             createdBy: currentUser?.uid || "",
//             createdByEmail: currentUser?.email || "",
//             createdAt: serverTimestamp(),
//             updatedAt: serverTimestamp(),
//           });

//           selectedRecords.forEach((record) => {
//             transaction.update(
//               doc(db, "Panels", PANEL_ID, "rtdRecords", record.id),
//               {
//                 estimateId: estimateRef.id,
//                 estimateNo: generatedEstimateNo,
//                 estimateAmount: invoiceTotal,
//                 updatedAt: serverTimestamp(),
//               },
//             );

//             if (record.statementEntryId) {
//               transaction.update(
//                 doc(
//                   db,
//                   "Panels",
//                   PANEL_ID,
//                   "accountStatementManualEntries",
//                   record.statementEntryId,
//                 ),
//                 {
//                   rtdEstimateId: estimateRef.id,
//                   rtdEstimateNo: generatedEstimateNo,
//                   rtdEstimateTotal: invoiceTotal,
//                   description: [
//                     `RTD - ${record.client || "Client"}`,
//                     `From Account: ${record.accountFromName || "-"}`,
//                     `Estimate: ${generatedEstimateNo}`,
//                     record.invoiceNo ? `Invoice: ${record.invoiceNo}` : "",
//                   ]
//                     .filter(Boolean)
//                     .join(" | "),
//                   reference: [
//                     `RTD Record: ${record.id}`,
//                     `Estimate: ${generatedEstimateNo}`,
//                     record.invoiceNo ? `Invoice: ${record.invoiceNo}` : "",
//                   ]
//                     .filter(Boolean)
//                     .join(" | "),
//                   updatedAt: serverTimestamp(),
//                 },
//               );
//             }
//           });
//         });
//       }

//       try {
//         const pdfEstimate = buildRtdEstimateForPdf({
//           estimateNo: savedEstimateNo,
//           estimateDate,
//           expiryDate,
//           client: selectedClient,
//           projectOwner,
//           subjectPurpose,
//           poNumber,
//           services: calculatedServices.map((service) => ({
//             serviceName: service.serviceName,
//             description: service.description,
//             unit: service.units,
//             unitCost: service.adjustedUnitCost,
//             showFinancialsInPdf: !service.isHeadingOnly,
//           })),
//           subtotal: adjustedSubtotal,
//           taxAmount: salesTaxAmount,
//           total: invoiceTotal,
//           taxPercent: selectedSalesTax?.percent || 0,
//           taxLabel: selectedSalesTax?.name || "",
//           footerText,
//           paymentTerm,
//           termsConditionTitle,
//           termsConditionText,
//           createdBy: currentUser?.uid || "",
//         });

//         const blob = await buildEstimatePdfBlob({
//           estimate: pdfEstimate as unknown as Estimate,
//           companyList: COMPANY_LIST,
//           withLogo: true,
//           footerUser: loggedInUser,
//           companyName: "iEDGE",
//         });

//         setPreviewURL(URL.createObjectURL(blob));
//         setIsPreviewOpen(true);
//         setLastSavedEstimateNo(savedEstimateNo);
//       } catch (pdfError) {
//         console.error("Failed to build RTD Estimate PDF:", pdfError);
//       }

//       resetForm();
//       onEstimateSaved?.();

//       setMessage(
//         wasEditing
//           ? `RTD Estimate ${savedEstimateNo} updated.`
//           : `RTD Estimate ${savedEstimateNo} saved. All selected RTDs and their original From Account statement entries are linked to this Estimate.`,
//       );
//     } catch (saveError) {
//       console.error("Failed to save RTD Estimate:", saveError);
//       setError("Failed to save RTD Estimate.");
//     } finally {
//       savingRef.current = false;
//       setSaving(false);
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-2xl font-black tracking-[-0.04em] text-gray-950">
//           RTD Estimate
//         </h1>
//         <p className="mt-1 text-sm text-gray-500">
//           Build one Estimate from one or multiple RTD Records for the same
//           client.
//         </p>
//       </div>

//       {editId ? (
//         <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
//           <span>
//             Editing RTD Estimate <strong>{estimateNo}</strong>. Linked RTD
//             records cannot be changed here — create a new Estimate from the
//             Records tab for a different set of records.
//           </span>
//           <Button
//             type="button"
//             variant="outline"
//             onClick={resetForm}
//             className="rounded-xl"
//           >
//             Cancel
//           </Button>
//         </div>
//       ) : null}

//       <form onSubmit={handleSubmit} className="space-y-6">
//         <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
//           <div className="mb-5">
//             <h2 className="text-sm font-semibold text-gray-700">
//               Basic Information
//             </h2>
//             <p className="text-sm text-gray-500">
//               Records selected on the Records tab appear here automatically.
//             </p>
//           </div>

//           <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
//             <Field label="Estimate No">
//               <input
//                 readOnly
//                 className={`${fieldClass} cursor-default bg-gray-50 font-semibold`}
//                 value={estimateNo || nextEstimateNo}
//                 title={
//                   estimateNo
//                     ? "This Estimate's number"
//                     : "Generated automatically when the Estimate is saved"
//                 }
//               />
//             </Field>

//             <Field label="Issue Date">
//               <input
//                 type="date"
//                 className={withValidity(fieldClass, !estimateDate)}
//                 value={estimateDate}
//                 onChange={(event) => setEstimateDate(event.target.value)}
//               />
//             </Field>

//             <Field label="Expiry Date">
//               <input
//                 type="date"
//                 className={withValidity(fieldClass, !expiryDate)}
//                 value={expiryDate}
//                 onChange={(event) => setExpiryDate(event.target.value)}
//               />
//             </Field>

//             <InfoBox
//               label="Client"
//               value={selectedClient || "Select RTD record(s) on the Records tab"}
//             />

//             <InfoBox
//               label="Client Address"
//               value={selectedClientAddress || "-"}
//             />

//             <InfoBox
//               label="Additional Info"
//               value={selectedClientInfo?.addtionalInfo || "-"}
//             />

//             <Field label="Project Owner">
//               <input
//                 className={withValidity(fieldClass, !projectOwner.trim())}
//                 value={projectOwner}
//                 onChange={(event) => setProjectOwner(event.target.value)}
//                 placeholder="Requester name"
//               />
//             </Field>

//             <Field label="Payment Terms">
//               <select
//                 className={withValidity(fieldClass, !paymentTerm.trim())}
//                 value={paymentTerm}
//                 onChange={(event) => setPaymentTerm(event.target.value)}
//               >
//                 <option value="">Select Payment Term</option>
//                 {paymentTerms.map((term, index) => (
//                   <option key={index} value={term}>
//                     {term}
//                   </option>
//                 ))}
//               </select>
//             </Field>

//             <div className="md:col-span-2 xl:col-span-1">
//               <Field label="Subject / Purpose">
//                 <input
//                   className={withValidity(fieldClass, !subjectPurpose.trim())}
//                   value={subjectPurpose}
//                   onChange={(event) => setSubjectPurpose(event.target.value)}
//                   placeholder="Enter estimate subject or purpose"
//                 />
//               </Field>
//             </div>

//             <Field label="PO Number (optional)">
//               <input
//                 className={fieldClass}
//                 value={poNumber}
//                 onChange={(event) => setPoNumber(event.target.value)}
//                 placeholder="Enter PO number"
//               />
//             </Field>
//           </div>

//           {selectedRecords.length > 0 ? (
//             <>
//               <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
//                 <InfoBox label="RTD Records" value={String(selectedRecords.length)} />
//                 <InfoBox
//                   label="Amount Paid on Client's Behalf"
//                   value={`Rs. ${formatMoney(customerPayment)}`}
//                 />
//                 <InfoBox
//                   label="From Account(s)"
//                   value={selectedFromAccounts.join(", ") || "-"}
//                 />
//                 <InfoBox
//                   label="Statement Entries"
//                   value={String(selectedStatementIds.length)}
//                 />
//               </div>

//               <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-200">
//                 <table className="w-full min-w-[900px] text-sm">
//                   <thead>
//                     <tr className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
//                       <th className="px-4 py-3 text-left">Requestor</th>
//                       <th className="px-4 py-3 text-left">Venue</th>
//                       <th className="px-4 py-3 text-left">From Account</th>
//                       <th className="px-4 py-3 text-left">Payment Date</th>
//                       <th className="px-4 py-3 text-right">RTD Amount</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-100">
//                     {selectedRecords.map((record) => (
//                       <tr key={record.id}>
//                         <td className="px-4 py-3">
//                           {record.clientPersonOfContact || "-"}
//                         </td>
//                         <td className="px-4 py-3">{record.venue || "-"}</td>
//                         <td className="px-4 py-3">
//                           {record.accountFromName || "-"}
//                         </td>
//                         <td className="px-4 py-3">
//                           {record.paymentDate || "-"}
//                         </td>
//                         <td className="px-4 py-3 text-right font-semibold">
//                           Rs. {formatMoney(record.amountRequired)}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </>
//           ) : null}
//         </div>

//         <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
//           <h2 className="text-sm font-semibold text-gray-700">Margin & Tax</h2>
//           <p className="mt-1 text-sm text-gray-500">
//             WHT is used internally in the gross-up calculation, but it will not
//             appear in the customer Tax Summary. Its effect is absorbed into the
//             customer-facing Unit Cost.
//           </p>

//           <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
//             <Field label="Margin">
//               <input
//                 className={withValidity(fieldClass, !marginInput.trim())}
//                 value={marginInput}
//                 onChange={(event) => setMarginInput(event.target.value)}
//                 placeholder="Example: 15% or 15000"
//               />
//               <p className="mt-1 text-xs text-gray-400">
//                 15% = percentage. 15000 = fixed PKR margin.
//               </p>
//             </Field>

//             <Field label="Sales Tax">
//               <select
//                 className={withValidity(fieldClass, !selectedSalesTaxId)}
//                 value={selectedSalesTaxId}
//                 onChange={(event) => setSelectedSalesTaxId(event.target.value)}
//               >
//                 <option value="">Select Sales Tax</option>
//                 {salesTaxes.map((tax) => (
//                   <option key={tax.id} value={tax.id}>
//                     {tax.name} ({tax.percent}%)
//                   </option>
//                 ))}
//               </select>
//             </Field>

//             <Field label="WHT">
//               <select
//                 className={withValidity(fieldClass, !selectedWhtId)}
//                 value={selectedWhtId}
//                 onChange={(event) => setSelectedWhtId(event.target.value)}
//               >
//                 <option value="">Select WHT</option>
//                 {whtOptions.map((wht) => (
//                   <option key={wht.id} value={wht.id}>
//                     {wht.name} ({wht.percent}%)
//                   </option>
//                 ))}
//               </select>
//             </Field>
//           </div>
//         </div>

//         <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
//           <div>
//             <h2 className="text-sm font-semibold text-gray-700">Service Detail</h2>
//             <p className="text-sm text-gray-500">
//               One service row is created for each selected RTD. Unit Cost is
//               automatically grossed up so WHT stays hidden from the Tax
//               Summary. Add extra rows for services outside the linked RTD
//               records, or mark a row as a heading if it only needs a name.
//             </p>
//           </div>

//           <div className="mt-5 overflow-x-auto">
//             <table className="w-full min-w-[1100px] text-sm">
//               <thead>
//                 <tr className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
//                   <th className="px-4 py-3 text-left">Service Name</th>
//                   <th className="px-4 py-3 text-left">Description</th>
//                   <th className="px-4 py-3 text-center">Unit</th>
//                   <th className="px-4 py-3 text-right">Unit Cost</th>
//                   <th className="px-4 py-3 text-right">Amount</th>
//                   <th className="px-4 py-3 text-center">-</th>
//                 </tr>
//               </thead>

//               <tbody className="divide-y divide-gray-100">
//                 {calculatedServices.map((service) => {
//                   const filteredServices = servicesList.filter((sv) =>
//                     sv.name
//                       .toLowerCase()
//                       .includes((service.serviceName || "").toLowerCase()),
//                   );
//                   const isHeading = service.isManual && service.isHeadingOnly;

//                   return (
//                     <tr key={service.rowId}>
//                       <td className="px-4 py-3">
//                         <div
//                           className="relative"
//                           ref={
//                             openServiceRowId === service.rowId
//                               ? serviceDropdownRef
//                               : null
//                           }
//                         >
//                           <div className="flex items-start gap-1">
//                             <AutoGrowTextarea
//                               className={withValidity(
//                                 fieldClass,
//                                 !service.serviceName.trim(),
//                               )}
//                               minHeight={40}
//                               value={service.serviceName}
//                               onChange={(event) => {
//                                 updateService(
//                                   service.rowId,
//                                   "serviceName",
//                                   event.target.value,
//                                 );
//                                 if (openServiceRowId !== service.rowId) {
//                                   setOpenServiceRowId(service.rowId);
//                                 }
//                               }}
//                               onFocus={() => setOpenServiceRowId(null)}
//                               placeholder="Type or select service"
//                             />
//                             <button
//                               type="button"
//                               className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50"
//                               title="Show services"
//                               onClick={() =>
//                                 setOpenServiceRowId((prev) =>
//                                   prev === service.rowId ? null : service.rowId,
//                                 )
//                               }
//                             >
//                               <ChevronDown className="h-4 w-4" />
//                             </button>
//                           </div>

//                           {openServiceRowId === service.rowId ? (
//                             <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-56 overflow-auto">
//                               {filteredServices.length === 0 ? (
//                                 <div className="p-2 text-xs text-gray-500">
//                                   No matching services
//                                 </div>
//                               ) : (
//                                 filteredServices.map((sv) => (
//                                   <button
//                                     key={sv.id}
//                                     type="button"
//                                     className="w-full text-left px-3 py-2 hover:bg-gray-50"
//                                     onClick={() =>
//                                       handleSelectServiceName(
//                                         service.rowId,
//                                         sv.name,
//                                       )
//                                     }
//                                   >
//                                     <div className="text-sm text-gray-800">
//                                       {sv.name}
//                                     </div>
//                                     {sv.description ? (
//                                       <div className="text-xs text-gray-500 line-clamp-2">
//                                         {sv.description}
//                                       </div>
//                                     ) : null}
//                                   </button>
//                                 ))
//                               )}
//                             </div>
//                           ) : null}
//                         </div>
//                       </td>

//                       <td className="px-4 py-3">
//                         <AutoGrowTextarea
//                           className={fieldClass}
//                           minHeight={40}
//                           value={service.description}
//                           onChange={(event) =>
//                             updateService(
//                               service.rowId,
//                               "description",
//                               event.target.value,
//                             )
//                           }
//                           placeholder="Description"
//                         />
//                       </td>

//                       <td className="px-4 py-3">
//                         {isHeading ? (
//                           <span className="block text-center text-gray-400">
//                             —
//                           </span>
//                         ) : (
//                           <input
//                             type="number"
//                             min="0.01"
//                             step="0.01"
//                             className={withValidity(
//                               `${fieldClass} text-center`,
//                               service.units <= 0,
//                             )}
//                             value={service.unit}
//                             onChange={(event) =>
//                               updateService(
//                                 service.rowId,
//                                 "unit",
//                                 event.target.value,
//                               )
//                             }
//                           />
//                         )}
//                       </td>

//                       <td className="px-4 py-3">
//                         {isHeading ? (
//                           <span className="block text-right text-gray-400">
//                             —
//                           </span>
//                         ) : service.isManual ? (
//                           <input
//                             type="number"
//                             min="0"
//                             step="0.01"
//                             className={withValidity(
//                               `${fieldClass} text-right`,
//                               service.adjustedUnitCost <= 0,
//                             )}
//                             value={service.manualRateInput}
//                             onChange={(event) =>
//                               updateService(
//                                 service.rowId,
//                                 "manualRateInput",
//                                 event.target.value,
//                               )
//                             }
//                             placeholder="0.00"
//                           />
//                         ) : (
//                           <input
//                             readOnly
//                             className={`${fieldClass} cursor-default bg-gray-50 text-right font-semibold`}
//                             value={formatMoney(service.adjustedUnitCost)}
//                             title={`Original RTD unit cost: Rs. ${formatMoney(
//                               service.sourceUnitCost,
//                             )}`}
//                           />
//                         )}
//                       </td>

//                       <td className="px-4 py-3 text-right font-bold text-gray-900">
//                         {isHeading
//                           ? "—"
//                           : `Rs. ${formatMoney(service.adjustedLineAmount)}`}
//                       </td>

//                       <td className="px-4 py-3 text-center">
//                         {service.isManual ? (
//                           <div className="flex flex-col items-center gap-1">
//                             <label
//                               className="flex items-center gap-1 text-[10px] font-medium text-gray-500"
//                               title="Show calculations"
//                             >
//                               <input
//                                 type="checkbox"
//                                 checked={!service.isHeadingOnly}
//                                 onChange={() =>
//                                   toggleHeadingOnly(service.rowId)
//                                 }
//                                 className="h-3.5 w-3.5 rounded border-gray-300"
//                               />
//                               Cals
//                             </label>
//                             <button
//                               type="button"
//                               onClick={() => handleRemoveRow(service.rowId)}
//                               className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
//                               title="Remove row"
//                             >
//                               <Trash2 className="h-4 w-4" />
//                             </button>
//                           </div>
//                         ) : null}
//                       </td>
//                     </tr>
//                   );
//                 })}

//                 {calculatedServices.length === 0 ? (
//                   <tr>
//                     <td
//                       colSpan={6}
//                       className="px-5 py-10 text-center text-gray-500"
//                     >
//                       Select RTD record(s) on the Records tab, or add a row
//                       below.
//                     </td>
//                   </tr>
//                 ) : null}
//               </tbody>
//             </table>

//             <Button
//               type="button"
//               variant="outline"
//               onClick={handleAddRow}
//               className="mt-3"
//             >
//               Add Row
//             </Button>
//           </div>
//         </div>

//         <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
//           <h2 className="text-sm font-semibold text-gray-700">Message</h2>

//           <div className="mt-5">
//             <Field label="Message">
//               <textarea
//                 rows={3}
//                 value={footerText}
//                 onChange={(event) => setFooterText(event.target.value)}
//                 className="w-full rounded-lg border border-gray-300 p-2 text-sm text-gray-700 outline-none transition focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                 placeholder="Enter an optional message to show below the service table"
//               />
//             </Field>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
//           <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
//             <div className="mb-5 flex items-center gap-3">
//               <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-950 text-white">
//                 <Calculator className="h-5 w-5" />
//               </div>
//               <div>
//                 <h2 className="text-sm font-semibold text-gray-700">Totals</h2>
//                 <p className="text-sm text-gray-500">
//                   Customer-facing estimate totals.
//                 </p>
//               </div>
//             </div>

//             <SummaryRow label="Subtotal" amount={adjustedSubtotal} />
//             <SummaryRow
//               label={
//                 selectedSalesTax
//                   ? `${selectedSalesTax.name} (${selectedSalesTax.percent}%)`
//                   : "Sales Tax"
//               }
//               amount={salesTaxAmount}
//             />

//             <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-4">
//               <span className="text-lg font-black text-gray-950">Total</span>
//               <span className="text-2xl font-black text-gray-950">
//                 Rs. {formatMoney(invoiceTotal)}
//               </span>
//             </div>
//           </div>

//           <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
//             <div className="mb-5">
//               <h2 className="text-sm font-semibold text-gray-700">Tax Summary</h2>
//               <p className="text-sm text-gray-500">
//                 Only Sales Tax is shown here. WHT is intentionally not displayed.
//               </p>
//             </div>

//             {selectedSalesTax && salesTaxAmount > 0 ? (
//               <div className="overflow-hidden rounded-2xl border border-gray-200">
//                 <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
//                   <div>
//                     <p className="font-semibold text-gray-800">
//                       {selectedSalesTax.name}
//                     </p>
//                     <p className="text-xs text-gray-500">
//                       {selectedSalesTax.percent}%
//                     </p>
//                   </div>
//                   <span className="font-bold text-gray-900">
//                     Rs. {formatMoney(salesTaxAmount)}
//                   </span>
//                 </div>
//               </div>
//             ) : (
//               <p className="rounded-2xl bg-gray-50 px-4 py-5 text-sm text-gray-500">
//                 Select Sales Tax to populate the summary.
//               </p>
//             )}

//             <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-800">
//               WHT is still used internally to calculate the required gross-up.
//               Its effect is embedded in the Unit Cost, so it does not appear as
//               a separate tax line on the Estimate.
//             </div>
//           </div>
//         </div>

//         <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
//           <h2 className="text-sm font-semibold text-gray-700">Terms & Conditions</h2>

//           <div className="mt-5 space-y-5">
//             <Field label="Terms & Conditions">
//               <select
//                 className={withValidity(fieldClass, !selectedTermsId)}
//                 value={selectedTermsId}
//                 onChange={(event) => handleSelectTerms(event.target.value)}
//               >
//                 <option value="">Select Terms & Conditions</option>
//                 {termsConditions.map((term) => (
//                   <option key={term.id} value={term.id}>
//                     {term.name}
//                   </option>
//                 ))}
//               </select>
//             </Field>

//             {selectedTermsId ? (
//               <div>
//                 <label className="mb-1.5 block text-sm font-semibold text-gray-700">
//                   Terms & Conditions Text
//                 </label>
//                 <textarea
//                   rows={7}
//                   value={termsConditionText}
//                   onChange={(event) => setTermsConditionText(event.target.value)}
//                   className={withValidity(
//                     "w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm leading-6 text-gray-700 outline-none transition focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
//                     !termsConditionText.trim(),
//                   )}
//                 />
//               </div>
//             ) : null}
//           </div>
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
//             className="h-11 rounded-xl bg-gray-950 px-6 text-white hover:bg-gray-800"
//           >
//             {saving ? (
//               <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//             ) : (
//               <Save className="mr-2 h-4 w-4" />
//             )}
//             {saving ? "Saving..." : editId ? "Update Estimate" : "Save Estimate"}
//           </Button>
//         </div>
//       </form>

//       <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow">
//           <div className="border-b border-gray-100 px-5 py-4">
//             <h2 className="text-sm font-semibold text-gray-700">RTD Estimate List</h2>
//           </div>

//           <div className="overflow-x-auto">
//             <table className="w-full min-w-[1450px] text-sm">
//               <thead>
//                 <tr className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
//                   <th className="px-5 py-4 text-left">Estimate</th>
//                   <th className="px-5 py-4 text-left">Subject / Purpose</th>
//                   <th className="px-5 py-4 text-left">Client</th>
//                   <th className="px-5 py-4 text-center">RTDs</th>
//                   <th className="px-5 py-4 text-left">From Account(s)</th>
//                   <th className="px-5 py-4 text-right">RTD Amount</th>
//                   <th className="px-5 py-4 text-right">Sales Tax</th>
//                   <th className="px-5 py-4 text-right">Estimate Total</th>
//                   <th className="px-5 py-4 text-left">Status</th>
//                   <th className="px-5 py-4 text-center">Actions</th>
//                 </tr>
//               </thead>

//               <tbody className="divide-y divide-gray-100">
//                 {estimates.map((estimate) => {
//                   const recordIds =
//                     Array.isArray(estimate.rtdRecordIds) &&
//                     estimate.rtdRecordIds.length > 0
//                       ? estimate.rtdRecordIds
//                       : estimate.rtdRecordId
//                         ? [estimate.rtdRecordId]
//                         : [];

//                   const accountNames =
//                     Array.isArray(estimate.accountFromNames) &&
//                     estimate.accountFromNames.length > 0
//                       ? estimate.accountFromNames
//                       : estimate.accountFromName
//                         ? [estimate.accountFromName]
//                         : [];

//                   const status = getEstimateStatus(estimate);

//                   return (
//                     <tr key={estimate.id} className="hover:bg-gray-50">
//                       <td className="px-5 py-4 font-bold">
//                         {estimate.estimateNo || "-"}
//                       </td>
//                       <td className="px-5 py-4">
//                         {estimate.subjectPurpose || "-"}
//                       </td>
//                       <td className="px-5 py-4">{estimate.client || "-"}</td>
//                       <td className="px-5 py-4 text-center">
//                         {recordIds.length || estimate.rtdRecordCount || 0}
//                       </td>
//                       <td className="px-5 py-4">
//                         {accountNames.join(", ") || "-"}
//                       </td>
//                       <td className="px-5 py-4 text-right">
//                         Rs. {formatMoney(estimate.customerPayment)}
//                       </td>
//                       <td className="px-5 py-4 text-right">
//                         Rs. {formatMoney(estimate.salesTaxAmount)}
//                       </td>
//                       <td className="px-5 py-4 text-right font-bold">
//                         Rs. {formatMoney(estimate.invoiceTotal || estimate.estimateAmount)}
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
//                             onClick={() => handleEditEstimate(estimate)}
//                             className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
//                             title="Edit"
//                           >
//                             <Pencil className="h-4 w-4" />
//                           </button>
//                           <button
//                             type="button"
//                             onClick={() => handlePreviewEstimate(estimate)}
//                             disabled={previewLoadingId === estimate.id}
//                             className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
//                             title="Preview"
//                           >
//                             {previewLoadingId === estimate.id ? (
//                               <Loader2 className="h-4 w-4 animate-spin" />
//                             ) : (
//                               <Eye className="h-4 w-4" />
//                             )}
//                           </button>
//                           <button
//                             type="button"
//                             onClick={() => handleDownloadEstimate(estimate)}
//                             disabled={downloadLoadingId === estimate.id}
//                             className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
//                             title="Download"
//                           >
//                             {downloadLoadingId === estimate.id ? (
//                               <Loader2 className="h-4 w-4 animate-spin" />
//                             ) : (
//                               <Download className="h-4 w-4" />
//                             )}
//                           </button>
//                           {!String(estimate.invoiceId || "").trim() ? (
//                             <button
//                               type="button"
//                               onClick={() => onCreateInvoice?.(estimate)}
//                               className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
//                               title="Create Invoice"
//                             >
//                               <Receipt className="h-4 w-4" />
//                             </button>
//                           ) : null}
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}

//                 {estimates.length === 0 ? (
//                   <tr>
//                     <td
//                       colSpan={10}
//                       className="px-5 py-12 text-center text-gray-500"
//                     >
//                       No RTD Estimates found.
//                     </td>
//                   </tr>
//                 ) : null}
//               </tbody>
//             </table>
//           </div>
//       </div>

//       {isPreviewOpen && previewURL ? (
//         <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg shadow-xl w-11/12 h-[90vh] p-4 flex flex-col">
//             <div className="flex justify-between mb-4">
//               <h2 className="font-semibold text-sm">PDF Preview</h2>
//               <button onClick={() => setIsPreviewOpen(false)}>❌</button>
//             </div>
//             <iframe
//               src={previewURL}
//               className="flex-1 border"
//               title="PDF Preview"
//             />
//             <div className="mt-4 flex justify-end gap-3">
//               <Button
//                 onClick={() => {
//                   const link = document.createElement("a");
//                   link.href = previewURL;
//                   link.download = `${lastSavedEstimateNo || "rtd-estimate"}.pdf`;
//                   link.click();
//                 }}
//               >
//                 Download
//               </Button>
//             </div>
//           </div>
//         </div>
//       ) : null}

//       {isListDrawerOpen && listPreviewURL ? (
//         <div className="fixed inset-0 z-50 flex">
//           <div
//             className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
//             onClick={() => setIsListDrawerOpen(false)}
//           />

//           <div className="relative ml-auto flex h-full w-full max-w-5xl flex-col bg-white shadow-2xl lg:w-[58vw]">
//             <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
//               <div>
//                 <h2 className="text-lg font-black tracking-[-0.03em] text-slate-950">
//                   RTD Estimate Preview
//                 </h2>
//                 <p className="text-sm text-slate-500">
//                   {selectedListEstimate?.estimateNo || "Estimate document"}
//                 </p>
//               </div>

//               <button
//                 onClick={() => setIsListDrawerOpen(false)}
//                 className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-950"
//               >
//                 <X className="h-5 w-5" />
//               </button>
//             </div>

//             <div className="min-h-0 flex-1 bg-slate-100 p-4">
//               <iframe
//                 src={listPreviewURL}
//                 className="h-full w-full rounded-2xl border border-slate-200 bg-white shadow-sm"
//                 title="PDF Preview"
//               />
//             </div>

//             <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-white px-5 py-4">
//               <Button
//                 variant="outline"
//                 className="rounded-xl border-slate-200"
//                 onClick={() => {
//                   if (!selectedListEstimate) return;
//                   setIsListDrawerOpen(false);
//                   handleEditEstimate(selectedListEstimate);
//                 }}
//               >
//                 <Pencil className="mr-2 h-4 w-4" />
//                 Edit
//               </Button>
//               <Button
//                 variant="outline"
//                 className="rounded-xl border-slate-200"
//                 onClick={() => {
//                   const link = document.createElement("a");
//                   link.href = listPreviewURL;
//                   link.download = `${selectedListEstimate?.estimateNo || "rtd-estimate"}.pdf`;
//                   link.click();
//                 }}
//               >
//                 <Download className="mr-2 h-4 w-4" />
//                 Download
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
//       <label className="block text-sm font-medium text-gray-600 mb-1">
//         {label}
//       </label>
//       {children}
//     </div>
//   );
// }

// function InfoBox({ label, value }: { label: string; value?: string }) {
//   return (
//     <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
//       <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
//         {label}
//       </p>
//       <p className="mt-1 break-words text-sm font-semibold text-gray-800">
//         {value || "-"}
//       </p>
//     </div>
//   );
// }

// function SummaryRow({ label, amount }: { label: string; amount: number }) {
//   return (
//     <div className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0">
//       <span className="font-medium text-gray-700">{label}</span>
//       <span className="font-semibold tabular-nums text-gray-900">
//         Rs. {formatMoney(amount)}
//       </span>
//     </div>
//   );
// }

// function AutoGrowTextarea({
//   value,
//   onChange,
//   className = "",
//   minHeight = 40,
//   ...props
// }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
//   minHeight?: number;
// }) {
//   const ref = useRef<HTMLTextAreaElement | null>(null);

//   const resize = () => {
//     const el = ref.current;
//     if (!el) return;

//     el.style.height = "auto";
//     el.style.height = `${Math.max(el.scrollHeight, minHeight)}px`;
//   };

//   useEffect(() => {
//     resize();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [value, minHeight]);

//   return (
//     <textarea
//       {...props}
//       ref={ref}
//       value={value}
//       onChange={(e) => {
//         onChange?.(e);
//         requestAnimationFrame(resize);
//       }}
//       className={`${className} resize-none overflow-hidden leading-6`}
//       style={{
//         ...props.style,
//         minHeight,
//       }}
//     />
//   );
// }

import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { auth, db } from "@/lib/firebase";

import {
  collection,
  doc,
  increment,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

import { Button } from "@/components/ui/button";
import {
  Calculator,
  ChevronDown,
  Download,
  Eye,
  Loader2,
  Pencil,
  Receipt,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { buildEstimatePdfBlob } from "@/lib/estimatePdf";
import type { Estimate } from "../../types";

export const PANEL_ID = "IEDGE-SYSTEM";

export const COMPANY_LIST = [
  { name: "iEDGE", logo: "/Iedge-TM-Logos-01.png" },
  {
    name: "iEDGE - Digital & Creative",
    logo: "/Iedge-Digital-and-Creative-TM-Logos-12.png",
  },
  { name: "iEDGE - Events & Activations", logo: "/iedge-events-logo.png" },
  {
    name: "iEDGE - Health Sciences",
    logo: "/Iedge-Health-Sciences-TM-Logos-05.png",
  },
  { name: "iEDGE - International Education", logo: "/iedge-edu-logo.png" },
  { name: "iEDGE - Trading", logo: "/Iedge-Trade-TM-Logos-10.png" },
  { name: "iEDGE - Travel & Tours", logo: "/iedge-travel-logo.png" },
  { name: "Catapult", logo: "/Catapult-TM-Logos-03.png" },
  { name: "iConsultant", logo: "/Consultant-TM-Logos-02.png" },
  { name: "Let's Save Green", logo: "/Lets-save-Green-TM-Logos-04.png" },
  { name: "Emaan Biz", logo: "/Emaan-Biz-TM-Logos-06.png" },
];

type Props = {
  initialRecordIds?: string[];
  onEstimateSaved?: () => void;
  onCreateInvoice?: (estimate: RTDEstimateRecord) => void;
};

type RTDRecord = {
  id: string;
  requestor?: string;
  client?: string;
  subjectPurpose?: string;
  clientPersonOfContact?: string;
  pocContactNo?: string;
  venue?: string;
  accountFromId?: string;
  accountFromName?: string;
  accountFromBankName?: string;
  accountFromTitle?: string;
  accountFromAccountNo?: string;
  bankName?: string;
  bankTitle?: string;
  ibanOrAccountNo?: string;
  amountRequired?: number;
  paymentDate?: string;
  statementEntryId?: string;
  estimateId?: string;
  estimateNo?: string;
  invoiceId?: string;
  invoiceNo?: string;
  createdAt?: any;
};

type TaxOption = {
  id: string;
  name: string;
  percent: number;
};

type TermsConditionDoc = {
  id: string;
  name: string;
  description: string;
};

type ClientRecord = {
  id: string;
  name: string;
  address?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  addtionalInfo?: string;
};

type ServiceRow = {
  rowId: string;
  rtdRecordId: string; // "" for manually added rows not tied to any RTD record
  serviceName: string;
  description: string;
  unit: string;
  manualRateInput: string; // used only when rtdRecordId is empty
  isHeadingOnly: boolean; // manual rows only: no unit/cost, excluded from totals
};

export type SavedServiceRow = {
  rtdRecordId: string;
  serviceName: string;
  description: string;
  unit: number;
  sourceAmount: number;
  sourceUnitCost: number;
  unitCost: number;
  amount: number;
  isHeadingOnly?: boolean;
};

export type RTDEstimateRecord = {
  id: string;
  rtdRecordId?: string;
  rtdRecordIds?: string[];
  rtdRecordCount?: number;
  estimateNo?: string;
  estimateDate?: string;
  expiryDate?: string;
  subjectPurpose?: string;
  projectOwner?: string;
  poNumber?: string;
  client?: string;
  accountFromId?: string;
  accountFromIds?: string[];
  accountFromName?: string;
  accountFromNames?: string[];
  statementEntryId?: string;
  statementEntryIds?: string[];
  marginInput?: string;
  marginType?: "percentage" | "fixed";
  marginPercent?: number;
  marginAmount?: number;
  salesTaxId?: string;
  salesTaxName?: string;
  salesTaxPercent?: number;
  whtId?: string;
  whtName?: string;
  whtPercent?: number;
  services?: SavedServiceRow[];
  customerPayment?: number;
  desiredNet?: number;
  taxableValue?: number;
  adjustedSubtotal?: number;
  salesTaxAmount?: number;
  estimateAmount?: number;
  invoiceTotal?: number;
  whtDeduction?: number;
  cashReceived?: number;
  netRetained?: number;
  footerText?: string;
  paymentTerm?: string;
  termsConditionId?: string;
  termsConditionTitle?: string;
  termsConditionText?: string;
  invoiceId?: string;
  invoiceNo?: string;
  createdBy?: string;
  createdByEmail?: string;
  createdAt?: any;
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

const getTime = (value: any) => {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (value instanceof Date) return value.getTime();

  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const getDaysSince = (value: any) => {
  const ms = getTime(value);
  if (!ms) return null;

  return Math.max(0, Math.floor((Date.now() - ms) / 86400000));
};

const normalizeClient = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase();

const uniqueStrings = (values: Array<string | undefined>) =>
  Array.from(
    new Set(values.map((value) => String(value || "").trim()).filter(Boolean)),
  );

const makeRowId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `row_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const parseMargin = (raw: string, customerPayment: number) => {
  const text = String(raw || "").trim();

  if (!text) {
    return {
      type: "fixed" as const,
      percentage: 0,
      amount: 0,
    };
  }

  if (text.endsWith("%")) {
    const percentage = toNumber(text.replace("%", "")) / 100;

    return {
      type: "percentage" as const,
      percentage,
      amount: customerPayment * percentage,
    };
  }

  const amount = toNumber(text);

  return {
    type: "fixed" as const,
    percentage: customerPayment > 0 ? amount / customerPayment : 0,
    amount,
  };
};

const getEstimateStatus = (estimate: RTDEstimateRecord) => {
  if (String(estimate.invoiceId || "").trim()) {
    return {
      label: "Invoiced",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  return {
    label: "Pending Invoice",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  };
};

export default function RTDEstimate({
  initialRecordIds = [],
  onEstimateSaved,
  onCreateInvoice,
}: Props) {
  const [records, setRecords] = useState<RTDRecord[]>([]);
  const [estimates, setEstimates] = useState<RTDEstimateRecord[]>([]);
  const [salesTaxes, setSalesTaxes] = useState<TaxOption[]>([]);
  const [whtOptions, setWhtOptions] = useState<TaxOption[]>([]);
  const [termsConditions, setTermsConditions] = useState<TermsConditionDoc[]>(
    [],
  );
  const [paymentTerms, setPaymentTerms] = useState<string[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [servicesList, setServicesList] = useState<
    { id: string; name: string; description?: string }[]
  >([]);

  const [editId, setEditId] = useState<string | null>(null);
  const [estimateNo, setEstimateNo] = useState("");
  const [sharedCounterCurrent, setSharedCounterCurrent] = useState(200000);

  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [estimateDate, setEstimateDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [expiryDate, setExpiryDate] = useState("");
  const [subjectPurpose, setSubjectPurpose] = useState("");
  const [projectOwner, setProjectOwner] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [marginInput, setMarginInput] = useState("");
  const [paymentTerm, setPaymentTerm] = useState("");
  const [selectedSalesTaxId, setSelectedSalesTaxId] = useState("");
  const [selectedWhtId, setSelectedWhtId] = useState("");
  const [footerText, setFooterText] = useState("");
  const [selectedTermsId, setSelectedTermsId] = useState("");
  const [termsConditionTitle, setTermsConditionTitle] = useState("");
  const [termsConditionText, setTermsConditionText] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const [openServiceRowId, setOpenServiceRowId] = useState<string | null>(null);
  const serviceDropdownRef = useRef<HTMLDivElement | null>(null);

  const [loggedInUser, setLoggedInUser] = useState<{
    displayName?: string;
    email?: string;
    mobileCountryCode?: string;
    mobileNo?: string;
    mobile?: string;
  } | null>(null);

  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [lastSavedEstimateNo, setLastSavedEstimateNo] = useState("");

  const [listPreviewURL, setListPreviewURL] = useState<string | null>(null);
  const [isListDrawerOpen, setIsListDrawerOpen] = useState(false);
  const [selectedListEstimate, setSelectedListEstimate] =
    useState<RTDEstimateRecord | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const [downloadLoadingId, setDownloadLoadingId] = useState<string | null>(
    null,
  );

  const lastInitialSelectionRef = useRef("");

  const fieldClass =
    "w-full rounded-lg border border-gray-300 p-2 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  const invalidFieldClass =
    "border-red-400 ring-2 ring-red-100 focus:ring-red-200 focus:border-red-400";

  const withValidity = (base: string, invalid: boolean) =>
    invalid && attemptedSubmit ? `${base} ${invalidFieldClass}` : base;

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "Panels", PANEL_ID, "rtdRecords"),
      (snapshot) => {
        const list = snapshot.docs.map((document) => ({
          id: document.id,
          ...(document.data() as Omit<RTDRecord, "id">),
        }));

        list.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
        setRecords(list);
      },
      (loadError) => {
        console.error("Failed to load RTD records:", loadError);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "Panels", PANEL_ID, "rtdEstimates"),
      (snapshot) => {
        const list = snapshot.docs.map((document) => ({
          id: document.id,
          ...(document.data() as Omit<RTDEstimateRecord, "id">),
        }));

        list.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
        setEstimates(list);
      },
      (loadError) => {
        console.error("Failed to load RTD estimates:", loadError);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "Panels", PANEL_ID, "tax"),
      (snapshot) => {
        const list = snapshot.docs
          .map((document) => {
            const data = document.data() as any;
            return {
              id: document.id,
              name: String(data.name || data.title || "Tax").trim(),
              percent: toNumber(data.percent),
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name));

        setSalesTaxes(list);
      },
      (loadError) => {
        console.error("Failed to load Sales Tax:", loadError);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "Panels", PANEL_ID, "withholdingTax"),
      (snapshot) => {
        const list = snapshot.docs
          .map((document) => {
            const data = document.data() as any;
            return {
              id: document.id,
              name: String(data.name || data.title || "WHT").trim(),
              percent: toNumber(data.percent),
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name));

        setWhtOptions(list);
      },
      (loadError) => {
        console.error("Failed to load WHT:", loadError);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "Panels", PANEL_ID, "termsConditions"),
      (snapshot) => {
        const list: TermsConditionDoc[] = snapshot.docs
          .map((document) => {
            const data = document.data() as any;
            return {
              id: document.id,
              name: String(data?.name || "").trim(),
              description: String(data?.description || "").replace(
                /\r\n/g,
                "\n",
              ),
            };
          })
          .filter((item) => item.name)
          .sort((a, b) => a.name.localeCompare(b.name));

        setTermsConditions(list);
      },
      (loadError) => {
        console.error("Failed to load Terms & Conditions:", loadError);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "Panels", PANEL_ID, "clients"),
      (snapshot) => {
        const list: ClientRecord[] = snapshot.docs.map((document) => {
          const data = document.data() as any;
          return {
            id: document.id,
            name: String(data?.name || "").trim(),
            address: String(data?.address || "").trim(),
            city: String(data?.city || "").trim(),
            zipCode: String(data?.zipCode || "").trim(),
            country: String(data?.country || "").trim(),
            addtionalInfo: String(data?.addtionalInfo || "").trim(),
          };
        });

        setClients(list);
      },
      (loadError) => {
        console.error("Failed to load clients:", loadError);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "Panels", PANEL_ID, "paymentTerms"),
      (snapshot) => {
        const list = snapshot.docs
          .map((document) => String(document.data()?.name || "").trim())
          .filter(Boolean);

        setPaymentTerms(list);
      },
      (loadError) => {
        console.error("Failed to load Payment Terms:", loadError);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "Panels", PANEL_ID, "services"),
      (snapshot) => {
        const list = snapshot.docs
          .map((document) => ({
            id: document.id,
            name: String(document.data()?.name || "").trim(),
            description: String(document.data()?.description || ""),
          }))
          .filter((service) => service.name)
          .sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
          );

        setServicesList(list);
      },
      (loadError) => {
        console.error("Failed to load services:", loadError);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const unsubscribe = onSnapshot(
      doc(db, "Panels", PANEL_ID, "users", uid),
      (snap) => {
        setLoggedInUser(snap.exists() ? (snap.data() as any) : null);
      },
    );

    return () => unsubscribe();
  }, []);

  // ✅ shared with the normal Estimate feature, purely to preview the next number
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "Panels", PANEL_ID, "counters", "estimates"),
      (snap) => {
        const current = snap.exists() ? toNumber(snap.data()?.current) : 0;
        setSharedCounterCurrent(current > 0 ? current : 200000);
      },
      (loadError) => {
        console.error("Failed to load estimate counter:", loadError);
      },
    );

    return () => unsubscribe();
  }, []);

  // ✅ close service dropdown on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!openServiceRowId) return;
      const el = serviceDropdownRef.current;
      if (el && !el.contains(e.target as any)) {
        setOpenServiceRowId(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openServiceRowId]);

  const nextEstimateNo = `IE-${sharedCounterCurrent + 1}`;

  const selectedRecords = useMemo(
    () => records.filter((record) => selectedRecordIds.includes(record.id)),
    [records, selectedRecordIds],
  );

  const selectedClient = selectedRecords[0]?.client || "";

  const selectedClientInfo = useMemo(
    () =>
      clients.find(
        (client) =>
          normalizeClient(client.name) === normalizeClient(selectedClient),
      ) || null,
    [clients, selectedClient],
  );

  const selectedClientAddress = useMemo(
    () =>
      uniqueStrings([
        selectedClientInfo?.address,
        selectedClientInfo?.city,
        selectedClientInfo?.zipCode,
        selectedClientInfo?.country,
      ]).join(", "),
    [selectedClientInfo],
  );

  const selectedSalesTax = useMemo(
    () => salesTaxes.find((tax) => tax.id === selectedSalesTaxId) || null,
    [salesTaxes, selectedSalesTaxId],
  );

  const selectedWht = useMemo(
    () => whtOptions.find((wht) => wht.id === selectedWhtId) || null,
    [whtOptions, selectedWhtId],
  );

  const syncServicesToSelection = (
    nextIds: string[],
    currentRecords = records,
  ) => {
    const selected = currentRecords.filter((record) =>
      nextIds.includes(record.id),
    );

    setServices((previous) => {
      const previousMap = new Map(
        previous
          .filter((service) => service.rtdRecordId)
          .map((service) => [service.rtdRecordId, service]),
      );

      const recordRows = selected.map((record) => {
        const old = previousMap.get(record.id);
        if (old) return old;

        return {
          rowId: makeRowId(),
          rtdRecordId: record.id,
          serviceName: record.subjectPurpose || "",
          description: record.venue || "",
          unit: "1",
          manualRateInput: "",
          isHeadingOnly: false,
        };
      });

      const manualRows = previous.filter((service) => !service.rtdRecordId);

      return [...recordRows, ...manualRows];
    });
  };

  useEffect(() => {
    if (!records.length || !initialRecordIds.length) return;

    const key = [...initialRecordIds].sort().join("|");
    if (lastInitialSelectionRef.current === key) return;

    const valid = initialRecordIds.filter((id) => {
      const record = records.find((item) => item.id === id);
      return record && !record.estimateId;
    });

    if (!valid.length) return;

    const selected = records.filter((record) => valid.includes(record.id));
    const firstClient = normalizeClient(selected[0]?.client);
    const sameClient = selected.every(
      (record) => normalizeClient(record.client) === firstClient,
    );

    if (!sameClient) {
      setError(
        "The selected RTDs contain different clients. A single Estimate can only belong to one client.",
      );
      return;
    }

    setSelectedRecordIds(valid);
    syncServicesToSelection(valid, records);

    const requestorNames = uniqueStrings(selected.map((r) => r.requestor));
    if (requestorNames.length) {
      setProjectOwner((prev) => prev || requestorNames.join(", "));
    }

    lastInitialSelectionRef.current = key;
  }, [initialRecordIds, records]);

  const updateService = (
    rowId: string,
    field: "serviceName" | "description" | "unit" | "manualRateInput",
    value: string,
  ) => {
    setServices((previous) =>
      previous.map((service) =>
        service.rowId === rowId ? { ...service, [field]: value } : service,
      ),
    );
  };

  const toggleHeadingOnly = (rowId: string) => {
    setServices((previous) =>
      previous.map((service) =>
        service.rowId === rowId
          ? { ...service, isHeadingOnly: !service.isHeadingOnly }
          : service,
      ),
    );
  };

  const handleSelectServiceName = (rowId: string, name: string) => {
    updateService(rowId, "serviceName", name);

    const matchedService = servicesList.find((sv) => sv.name === name);
    if (matchedService?.description) {
      setServices((previous) =>
        previous.map((service) =>
          service.rowId === rowId && !service.description.trim()
            ? { ...service, description: matchedService.description || "" }
            : service,
        ),
      );
    }

    setOpenServiceRowId(null);
  };

  const handleAddRow = () => {
    setServices((previous) => [
      ...previous,
      {
        rowId: makeRowId(),
        rtdRecordId: "",
        serviceName: "",
        description: "",
        unit: "1",
        manualRateInput: "",
        isHeadingOnly: true,
      },
    ]);
  };

  const handleRemoveRow = (rowId: string) => {
    setServices((previous) =>
      previous.filter(
        (service) => !(service.rowId === rowId && !service.rtdRecordId),
      ),
    );
  };

  const customerPayment = useMemo(
    () =>
      selectedRecords.reduce(
        (sum, record) => sum + toNumber(record.amountRequired),
        0,
      ),
    [selectedRecords],
  );

  const margin = useMemo(
    () => parseMargin(marginInput, customerPayment),
    [marginInput, customerPayment],
  );

  const desiredNet = customerPayment + margin.amount;
  const salesTaxRate = toNumber(selectedSalesTax?.percent) / 100;
  const whtRate = toNumber(selectedWht?.percent) / 100;
  const denominator = (1 + salesTaxRate) * (1 - whtRate) - salesTaxRate;
  const taxableValue =
    denominator > 0 && desiredNet > 0 ? desiredNet / denominator : 0;
  const adjustmentFactor =
    customerPayment > 0 ? taxableValue / customerPayment : 0;

  const calculatedServices = useMemo(() => {
    return services.map((service) => {
      const record = selectedRecords.find(
        (item) => item.id === service.rtdRecordId,
      );
      const units = Math.max(toNumber(service.unit), 0);

      if (record) {
        const sourceAmount = toNumber(record.amountRequired);
        const adjustedLineAmount = sourceAmount * adjustmentFactor;
        const adjustedUnitCost = units > 0 ? adjustedLineAmount / units : 0;
        const sourceUnitCost = units > 0 ? sourceAmount / units : 0;

        return {
          ...service,
          units,
          sourceAmount,
          sourceUnitCost,
          adjustedUnitCost,
          adjustedLineAmount,
          isManual: false,
        };
      }

      if (service.isHeadingOnly) {
        return {
          ...service,
          units: 0,
          sourceAmount: 0,
          sourceUnitCost: 0,
          adjustedUnitCost: 0,
          adjustedLineAmount: 0,
          isManual: true,
        };
      }

      const adjustedUnitCost = toNumber(service.manualRateInput);
      const adjustedLineAmount = units * adjustedUnitCost;

      return {
        ...service,
        units,
        sourceAmount: 0,
        sourceUnitCost: adjustedUnitCost,
        adjustedUnitCost,
        adjustedLineAmount,
        isManual: true,
      };
    });
  }, [services, selectedRecords, adjustmentFactor]);

  const adjustedSubtotal = useMemo(
    () =>
      calculatedServices.reduce(
        (sum, service) => sum + service.adjustedLineAmount,
        0,
      ),
    [calculatedServices],
  );

  const salesTaxAmount = adjustedSubtotal * salesTaxRate;
  const invoiceTotal = adjustedSubtotal + salesTaxAmount;
  const whtDeduction = invoiceTotal * whtRate;
  const cashReceived = invoiceTotal - whtDeduction;
  const netRetained = cashReceived - salesTaxAmount;

  const selectedFromAccounts = useMemo(
    () =>
      uniqueStrings(selectedRecords.map((record) => record.accountFromName)),
    [selectedRecords],
  );

  const selectedStatementIds = useMemo(
    () =>
      uniqueStrings(selectedRecords.map((record) => record.statementEntryId)),
    [selectedRecords],
  );

  const handleSelectTerms = (id: string) => {
    setSelectedTermsId(id);
    const found = termsConditions.find((item) => item.id === id);

    if (!found) {
      setTermsConditionTitle("");
      setTermsConditionText("");
      return;
    }

    setTermsConditionTitle(found.name);
    setTermsConditionText(found.description);
  };

  const buildRtdEstimateForPdf = (args: {
    estimateNo: string;
    estimateDate: string;
    expiryDate: string;
    client: string;
    projectOwner: string;
    subjectPurpose: string;
    services: {
      serviceName: string;
      description: string;
      unit: number;
      unitCost: number;
      showFinancialsInPdf: boolean;
    }[];
    subtotal: number;
    taxAmount: number;
    total: number;
    taxPercent: number;
    taxLabel: string;
    footerText: string;
    paymentTerm: string;
    poNumber: string;
    termsConditionTitle: string;
    termsConditionText: string;
    createdBy: string;
  }) => ({
    estimateNo: args.estimateNo,
    client: args.client,
    date: args.estimateDate,
    expiryDate: args.expiryDate || args.estimateDate,
    projectOwner: args.projectOwner,
    services: args.services.map((service) => ({
      detail: service.serviceName,
      description: service.description,
      units: service.unit,
      rate: service.unitCost,
      showFinancialsInPdf: service.showFinancialsInPdf,
      // ✅ per-line tax so the shared PDF builder's Tax Summary table renders;
      // omitted on heading-only rows so they never leak into its totals
      taxLabel: service.showFinancialsInPdf ? args.taxLabel : undefined,
      taxPercent: service.showFinancialsInPdf ? args.taxPercent : 0,
    })),
    subtotal: args.subtotal,
    tax: args.taxAmount,
    poNumber: args.poNumber,
    subject: args.subjectPurpose,
    total: args.total,
    paymentTerm: args.paymentTerm,
    company: "iEDGE",
    taxType: "exclusive",
    taxPercent: args.taxPercent,
    message: args.footerText,
    termsConditionTitle: args.termsConditionTitle,
    termsConditionText: args.termsConditionText,
    createdBy: args.createdBy,
  });

  const buildPdfBlobForEstimate = async (estimate: RTDEstimateRecord) => {
    const savedServices = Array.isArray(estimate.services)
      ? estimate.services
      : [];

    const pdfEstimate = buildRtdEstimateForPdf({
      estimateNo: estimate.estimateNo || "",
      estimateDate: estimate.estimateDate || "",
      expiryDate: estimate.expiryDate || estimate.estimateDate || "",
      client: estimate.client || "",
      projectOwner: estimate.projectOwner || "",
      subjectPurpose: estimate.subjectPurpose || "",
      poNumber: estimate.poNumber || "",
      services: savedServices.map((service) => ({
        serviceName: service.serviceName || "",
        description: service.description || "",
        unit: toNumber(service.unit),
        unitCost: toNumber(service.unitCost),
        showFinancialsInPdf: !service.isHeadingOnly,
      })),
      subtotal: toNumber(
        (estimate as any).adjustedSubtotal ?? estimate.taxableValue,
      ),
      taxAmount: toNumber(estimate.salesTaxAmount),
      total: toNumber(estimate.invoiceTotal ?? estimate.estimateAmount),
      taxPercent: toNumber(estimate.salesTaxPercent),
      taxLabel: estimate.salesTaxName || "",
      footerText: estimate.footerText || "",
      paymentTerm: estimate.paymentTerm || "",
      termsConditionTitle: estimate.termsConditionTitle || "",
      termsConditionText: estimate.termsConditionText || "",
      createdBy: "",
    });

    return buildEstimatePdfBlob({
      estimate: pdfEstimate as unknown as Estimate,
      companyList: COMPANY_LIST,
      withLogo: true,
      footerUser: loggedInUser,
      companyName: "iEDGE",
    });
  };

  const handlePreviewEstimate = async (estimate: RTDEstimateRecord) => {
    try {
      setPreviewLoadingId(estimate.id);

      const blob = await buildPdfBlobForEstimate(estimate);

      setSelectedListEstimate(estimate);
      setListPreviewURL(URL.createObjectURL(blob));
      setIsListDrawerOpen(true);
    } catch (previewError) {
      console.error("Failed to build RTD Estimate preview:", previewError);
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const handleDownloadEstimate = async (estimate: RTDEstimateRecord) => {
    try {
      setDownloadLoadingId(estimate.id);

      const blob = await buildPdfBlobForEstimate(estimate);

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${estimate.estimateNo || "rtd-estimate"}.pdf`;
      link.click();
    } catch (downloadError) {
      console.error("Failed to download RTD Estimate:", downloadError);
    } finally {
      setDownloadLoadingId(null);
    }
  };

  const resetForm = () => {
    setEditId(null);
    setEstimateNo("");
    setSelectedRecordIds([]);
    setServices([]);
    setSubjectPurpose("");
    setProjectOwner("");
    setPoNumber("");
    setMarginInput("");
    setPaymentTerm("");
    setSelectedSalesTaxId("");
    setSelectedWhtId("");
    setFooterText("");
    setSelectedTermsId("");
    setTermsConditionTitle("");
    setTermsConditionText("");
    setExpiryDate("");
    setAttemptedSubmit(false);
    lastInitialSelectionRef.current = "";
  };

  const handleEditEstimate = (estimate: RTDEstimateRecord) => {
    const recordIds =
      Array.isArray(estimate.rtdRecordIds) && estimate.rtdRecordIds.length > 0
        ? estimate.rtdRecordIds
        : estimate.rtdRecordId
          ? [estimate.rtdRecordId]
          : [];

    setEditId(estimate.id);
    setEstimateNo(estimate.estimateNo || "");
    setEstimateDate(
      estimate.estimateDate || new Date().toISOString().slice(0, 10),
    );
    setExpiryDate(estimate.expiryDate || "");
    setSubjectPurpose(estimate.subjectPurpose || "");
    setProjectOwner(estimate.projectOwner || "");
    setPoNumber(estimate.poNumber || "");
    setMarginInput(estimate.marginInput || "");
    setPaymentTerm(estimate.paymentTerm || "");
    setSelectedSalesTaxId(estimate.salesTaxId || "");
    setSelectedWhtId(estimate.whtId || "");
    setFooterText(estimate.footerText || "");
    setSelectedTermsId(estimate.termsConditionId || "");
    setTermsConditionTitle(estimate.termsConditionTitle || "");
    setTermsConditionText(estimate.termsConditionText || "");
    setSelectedRecordIds(recordIds);

    const savedServices = Array.isArray(estimate.services)
      ? estimate.services
      : [];

    setServices(
      savedServices.map((service) => ({
        rowId: makeRowId(),
        rtdRecordId: service.rtdRecordId || "",
        serviceName: service.serviceName || "",
        description: service.description || "",
        unit: String(service.unit ?? ""),
        manualRateInput: service.rtdRecordId
          ? ""
          : String(service.unitCost ?? ""),
        isHeadingOnly: Boolean(service.isHeadingOnly),
      })),
    );

    lastInitialSelectionRef.current = [...recordIds].sort().join("|");
    setError("");
    setMessage("");
    setAttemptedSubmit(false);

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const validate = () => {
    if (selectedRecords.length === 0) return "Select at least one RTD Record.";
    if (!estimateDate) return "Issue Date is required.";
    if (!expiryDate) return "Expiry Date is required.";
    if (!subjectPurpose.trim()) return "Subject / Purpose is required.";
    if (!projectOwner.trim()) return "Project Owner is required.";
    if (!marginInput.trim()) return "Margin is required.";
    if (!paymentTerm.trim()) return "Payment Terms is required.";
    if (!selectedSalesTaxId) return "Sales Tax is required.";
    if (!selectedWhtId) return "WHT is required.";
    if (!selectedTermsId) return "Terms & Conditions is required.";
    if (!termsConditionText.trim())
      return "Terms & Conditions text is required.";
    if (customerPayment <= 0)
      return "Selected RTD total must be greater than zero.";
    if (denominator <= 0) {
      return "The selected Sales Tax and WHT combination produces an invalid gross-up calculation.";
    }

    const invalidService = calculatedServices.find((service) => {
      if (!service.serviceName.trim()) return true;
      if (service.isHeadingOnly) return false;
      return service.units <= 0 || service.adjustedUnitCost <= 0;
    });

    if (invalidService) {
      return "Each service requires a Service Name (and a Unit greater than zero, unless it's a heading-only row).";
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

    const wasEditing = Boolean(editId);

    try {
      savingRef.current = true;
      setSaving(true);
      setError("");
      setMessage("");

      const currentUser = auth.currentUser;
      const currentUserName = String(
        loggedInUser?.displayName ||
          currentUser?.displayName ||
          loggedInUser?.email ||
          currentUser?.email ||
          "Unknown User",
      ).trim();
      const currentUserEmail = String(
        loggedInUser?.email || currentUser?.email || "",
      ).trim();

      const accountFromIds = uniqueStrings(
        selectedRecords.map((record) => record.accountFromId),
      );
      const accountFromNames = uniqueStrings(
        selectedRecords.map((record) => record.accountFromName),
      );
      const statementEntryIds = uniqueStrings(
        selectedRecords.map((record) => record.statementEntryId),
      );

      const savedServices: SavedServiceRow[] = calculatedServices.map(
        (service) => ({
          rtdRecordId: service.rtdRecordId,
          serviceName: service.serviceName.trim(),
          description: service.description.trim(),
          unit: service.units,
          sourceAmount: service.sourceAmount,
          sourceUnitCost: service.sourceUnitCost,
          unitCost: service.adjustedUnitCost,
          amount: service.adjustedLineAmount,
          isHeadingOnly: service.isHeadingOnly,
        }),
      );

      const estimatePayload = {
        rtdRecordId: selectedRecords.length === 1 ? selectedRecords[0].id : "",
        rtdRecordIds: selectedRecords.map((record) => record.id),
        rtdRecordCount: selectedRecords.length,
        estimateDate,
        expiryDate,
        subjectPurpose: subjectPurpose.trim(),
        projectOwner: projectOwner.trim(),
        poNumber: poNumber.trim(),
        client: selectedClient,
        rtdRecords: selectedRecords.map((record) => ({
          id: record.id,
          client: record.client || "",
          clientPersonOfContact: record.clientPersonOfContact || "",
          pocContactNo: record.pocContactNo || "",
          venue: record.venue || "",
          amountRequired: toNumber(record.amountRequired),
          paymentDate: record.paymentDate || "",
          accountFromId: record.accountFromId || "",
          accountFromName: record.accountFromName || "",
          bankName: record.bankName || "",
          bankTitle: record.bankTitle || "",
          ibanOrAccountNo: record.ibanOrAccountNo || "",
          statementEntryId: record.statementEntryId || "",
        })),
        accountFromId: accountFromIds.length === 1 ? accountFromIds[0] : "",
        accountFromIds,
        accountFromName:
          accountFromNames.length === 1 ? accountFromNames[0] : "",
        accountFromNames,
        statementEntryId:
          statementEntryIds.length === 1 ? statementEntryIds[0] : "",
        statementEntryIds,
        marginInput: marginInput.trim(),
        marginType: margin.type,
        marginPercent: margin.percentage * 100,
        marginAmount: margin.amount,
        salesTaxId: selectedSalesTax?.id || "",
        salesTaxName: selectedSalesTax?.name || "",
        salesTaxPercent: selectedSalesTax?.percent || 0,
        whtId: selectedWht?.id || "",
        whtName: selectedWht?.name || "",
        whtPercent: selectedWht?.percent || 0,
        services: savedServices,
        customerPayment,
        desiredNet,
        taxableValue: adjustedSubtotal,
        adjustedSubtotal,
        salesTaxAmount,
        estimateAmount: invoiceTotal,
        invoiceTotal,
        whtDeduction,
        cashReceived,
        netRetained,
        taxSummary: {
          salesTaxId: selectedSalesTax?.id || "",
          salesTaxName: selectedSalesTax?.name || "",
          salesTaxPercent: selectedSalesTax?.percent || 0,
          salesTaxAmount,
        },
        footerText: footerText.trim(),
        paymentTerm: paymentTerm.trim(),
        termsConditionId: selectedTermsId,
        termsConditionTitle,
        termsConditionText,
      };

      let savedEstimateNo = "";

      if (editId) {
        const estimateRef = doc(db, "Panels", PANEL_ID, "rtdEstimates", editId);
        savedEstimateNo = estimateNo;

        const batch = writeBatch(db);

        batch.set(
          estimateRef,
          {
            ...estimatePayload,
            estimateNo,
            lastEditedById: currentUser?.uid || "",
            lastEditedByName: currentUserName,
            lastEditedByEmail: currentUserEmail,
            lastEditedAt: serverTimestamp(),
            editCount: increment(1),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );

        selectedRecords.forEach((record) => {
          batch.update(doc(db, "Panels", PANEL_ID, "rtdRecords", record.id), {
            estimateId: estimateRef.id,
            estimateNo,
            estimateAmount: invoiceTotal,
            updatedAt: serverTimestamp(),
          });

          if (record.statementEntryId) {
            batch.update(
              doc(
                db,
                "Panels",
                PANEL_ID,
                "accountStatementManualEntries",
                record.statementEntryId,
              ),
              {
                rtdEstimateId: estimateRef.id,
                rtdEstimateNo: estimateNo,
                rtdEstimateTotal: invoiceTotal,
                description: [
                  `RTD - ${record.client || "Client"}`,
                  `From Account: ${record.accountFromName || "-"}`,
                  `Estimate: ${estimateNo}`,
                  record.invoiceNo ? `Invoice: ${record.invoiceNo}` : "",
                ]
                  .filter(Boolean)
                  .join(" | "),
                reference: [
                  `RTD Record: ${record.id}`,
                  `Estimate: ${estimateNo}`,
                  record.invoiceNo ? `Invoice: ${record.invoiceNo}` : "",
                ]
                  .filter(Boolean)
                  .join(" | "),
                updatedAt: serverTimestamp(),
              },
            );
          }
        });

        await batch.commit();
      } else {
        const estimateRef = doc(
          collection(db, "Panels", PANEL_ID, "rtdEstimates"),
        );
        const counterRef = doc(db, "Panels", PANEL_ID, "counters", "estimates");

        await runTransaction(db, async (transaction) => {
          const counterSnap = await transaction.get(counterRef);
          const current = Number(
            counterSnap.exists() ? counterSnap.data()?.current : 200000,
          );
          const nextNumber = current + 1;
          const generatedEstimateNo = `IE-${nextNumber}`;
          savedEstimateNo = generatedEstimateNo;

          transaction.set(counterRef, { current: nextNumber }, { merge: true });

          transaction.set(estimateRef, {
            ...estimatePayload,
            estimateNo: generatedEstimateNo,
            invoiceId: "",
            invoiceNo: "",
            createdBy: currentUser?.uid || "",
            createdByEmail: currentUser?.email || "",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          selectedRecords.forEach((record) => {
            transaction.update(
              doc(db, "Panels", PANEL_ID, "rtdRecords", record.id),
              {
                estimateId: estimateRef.id,
                estimateNo: generatedEstimateNo,
                estimateAmount: invoiceTotal,
                updatedAt: serverTimestamp(),
              },
            );

            if (record.statementEntryId) {
              transaction.update(
                doc(
                  db,
                  "Panels",
                  PANEL_ID,
                  "accountStatementManualEntries",
                  record.statementEntryId,
                ),
                {
                  rtdEstimateId: estimateRef.id,
                  rtdEstimateNo: generatedEstimateNo,
                  rtdEstimateTotal: invoiceTotal,
                  description: [
                    `RTD - ${record.client || "Client"}`,
                    `From Account: ${record.accountFromName || "-"}`,
                    `Estimate: ${generatedEstimateNo}`,
                    record.invoiceNo ? `Invoice: ${record.invoiceNo}` : "",
                  ]
                    .filter(Boolean)
                    .join(" | "),
                  reference: [
                    `RTD Record: ${record.id}`,
                    `Estimate: ${generatedEstimateNo}`,
                    record.invoiceNo ? `Invoice: ${record.invoiceNo}` : "",
                  ]
                    .filter(Boolean)
                    .join(" | "),
                  updatedAt: serverTimestamp(),
                },
              );
            }
          });
        });
      }

      try {
        const pdfEstimate = buildRtdEstimateForPdf({
          estimateNo: savedEstimateNo,
          estimateDate,
          expiryDate,
          client: selectedClient,
          projectOwner,
          subjectPurpose,
          poNumber,
          services: calculatedServices.map((service) => ({
            serviceName: service.serviceName,
            description: service.description,
            unit: service.units,
            unitCost: service.adjustedUnitCost,
            showFinancialsInPdf: !service.isHeadingOnly,
          })),
          subtotal: adjustedSubtotal,
          taxAmount: salesTaxAmount,
          total: invoiceTotal,
          taxPercent: selectedSalesTax?.percent || 0,
          taxLabel: selectedSalesTax?.name || "",
          footerText,
          paymentTerm,
          termsConditionTitle,
          termsConditionText,
          createdBy: currentUser?.uid || "",
        });

        const blob = await buildEstimatePdfBlob({
          estimate: pdfEstimate as unknown as Estimate,
          companyList: COMPANY_LIST,
          withLogo: true,
          footerUser: loggedInUser,
          companyName: "iEDGE",
        });

        setPreviewURL(URL.createObjectURL(blob));
        setIsPreviewOpen(true);
        setLastSavedEstimateNo(savedEstimateNo);
      } catch (pdfError) {
        console.error("Failed to build RTD Estimate PDF:", pdfError);
      }

      resetForm();
      onEstimateSaved?.();

      setMessage(
        wasEditing
          ? `RTD Estimate ${savedEstimateNo} updated.`
          : `RTD Estimate ${savedEstimateNo} saved. All selected RTDs and their original From Account statement entries are linked to this Estimate.`,
      );
    } catch (saveError) {
      console.error("Failed to save RTD Estimate:", saveError);
      setError("Failed to save RTD Estimate.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-[-0.04em] text-gray-950">
          RTD Estimate
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Build one Estimate from one or multiple RTD Records for the same
          client.
        </p>
      </div>

      {editId ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <span>
            Editing RTD Estimate <strong>{estimateNo}</strong>. Linked RTD
            records cannot be changed here — create a new Estimate from the
            Records tab for a different set of records.
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            className="rounded-xl"
          >
            Cancel
          </Button>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-gray-700">
              Basic Information
            </h2>
            <p className="text-sm text-gray-500">
              Records selected on the Records tab appear here automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Estimate No">
              <input
                readOnly
                className={`${fieldClass} cursor-default bg-gray-50 font-semibold`}
                value={estimateNo || nextEstimateNo}
                title={
                  estimateNo
                    ? "This Estimate's number"
                    : "Generated automatically when the Estimate is saved"
                }
              />
            </Field>

            <Field label="Issue Date">
              <input
                type="date"
                className={withValidity(fieldClass, !estimateDate)}
                value={estimateDate}
                onChange={(event) => setEstimateDate(event.target.value)}
              />
            </Field>

            <Field label="Expiry Date">
              <input
                type="date"
                className={withValidity(fieldClass, !expiryDate)}
                value={expiryDate}
                onChange={(event) => setExpiryDate(event.target.value)}
              />
            </Field>

            <InfoBox
              label="Client"
              value={
                selectedClient || "Select RTD record(s) on the Records tab"
              }
            />

            <InfoBox
              label="Client Address"
              value={selectedClientAddress || "-"}
            />

            <InfoBox
              label="Additional Info"
              value={selectedClientInfo?.addtionalInfo || "-"}
            />

            <Field label="Project Owner">
              <input
                className={withValidity(fieldClass, !projectOwner.trim())}
                value={projectOwner}
                onChange={(event) => setProjectOwner(event.target.value)}
                placeholder="Requester name"
              />
            </Field>

            <Field label="Payment Terms">
              <select
                className={withValidity(fieldClass, !paymentTerm.trim())}
                value={paymentTerm}
                onChange={(event) => setPaymentTerm(event.target.value)}
              >
                <option value="">Select Payment Term</option>
                {paymentTerms.map((term, index) => (
                  <option key={index} value={term}>
                    {term}
                  </option>
                ))}
              </select>
            </Field>

            <div className="md:col-span-2 xl:col-span-1">
              <Field label="Subject / Purpose">
                <input
                  className={withValidity(fieldClass, !subjectPurpose.trim())}
                  value={subjectPurpose}
                  onChange={(event) => setSubjectPurpose(event.target.value)}
                  placeholder="Enter estimate subject or purpose"
                />
              </Field>
            </div>

            <Field label="PO Number (optional)">
              <input
                className={fieldClass}
                value={poNumber}
                onChange={(event) => setPoNumber(event.target.value)}
                placeholder="Enter PO number"
              />
            </Field>
          </div>

          {selectedRecords.length > 0 ? (
            <>
              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <InfoBox
                  label="RTD Records"
                  value={String(selectedRecords.length)}
                />
                <InfoBox
                  label="Amount Paid on Client's Behalf"
                  value={`Rs. ${formatMoney(customerPayment)}`}
                />
                <InfoBox
                  label="From Account(s)"
                  value={selectedFromAccounts.join(", ") || "-"}
                />
                <InfoBox
                  label="Statement Entries"
                  value={String(selectedStatementIds.length)}
                />
              </div>

              <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-200">
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-4 py-3 text-left">Requestor</th>
                      <th className="px-4 py-3 text-left">Venue</th>
                      <th className="px-4 py-3 text-left">From Account</th>
                      <th className="px-4 py-3 text-left">Payment Date</th>
                      <th className="px-4 py-3 text-right">RTD Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedRecords.map((record) => (
                      <tr key={record.id}>
                        <td className="px-4 py-3">
                          {record.clientPersonOfContact || "-"}
                        </td>
                        <td className="px-4 py-3">{record.venue || "-"}</td>
                        <td className="px-4 py-3">
                          {record.accountFromName || "-"}
                        </td>
                        <td className="px-4 py-3">
                          {record.paymentDate || "-"}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          Rs. {formatMoney(record.amountRequired)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>

        <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Margin & Tax</h2>
          <p className="mt-1 text-sm text-gray-500">
            WHT is used internally in the gross-up calculation, but it will not
            appear in the customer Tax Summary. Its effect is absorbed into the
            customer-facing Unit Cost.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Margin">
              <input
                className={withValidity(fieldClass, !marginInput.trim())}
                value={marginInput}
                onChange={(event) => setMarginInput(event.target.value)}
                placeholder="Example: 15% or 15000"
              />
              <p className="mt-1 text-xs text-gray-400">
                15% = percentage. 15000 = fixed PKR margin.
              </p>
            </Field>

            <Field label="Sales Tax">
              <select
                className={withValidity(fieldClass, !selectedSalesTaxId)}
                value={selectedSalesTaxId}
                onChange={(event) => setSelectedSalesTaxId(event.target.value)}
              >
                <option value="">Select Sales Tax</option>
                {salesTaxes.map((tax) => (
                  <option key={tax.id} value={tax.id}>
                    {tax.name} ({tax.percent}%)
                  </option>
                ))}
              </select>
            </Field>

            <Field label="WHT">
              <select
                className={withValidity(fieldClass, !selectedWhtId)}
                value={selectedWhtId}
                onChange={(event) => setSelectedWhtId(event.target.value)}
              >
                <option value="">Select WHT</option>
                {whtOptions.map((wht) => (
                  <option key={wht.id} value={wht.id}>
                    {wht.name} ({wht.percent}%)
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
          <div>
            <h2 className="text-sm font-semibold text-gray-700">
              Service Detail
            </h2>
            <p className="text-sm text-gray-500">
              One service row is created for each selected RTD. Unit Cost is
              automatically grossed up so WHT stays hidden from the Tax Summary.
              Add extra rows for services outside the linked RTD records, or
              mark a row as a heading if it only needs a name.
            </p>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3 text-left">Service Name</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-center">Unit</th>
                  <th className="px-4 py-3 text-right">Unit Cost</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">-</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {calculatedServices.map((service) => {
                  const filteredServices = servicesList.filter((sv) =>
                    sv.name
                      .toLowerCase()
                      .includes((service.serviceName || "").toLowerCase()),
                  );
                  const isHeading = service.isManual && service.isHeadingOnly;

                  return (
                    <tr key={service.rowId}>
                      <td className="px-4 py-3">
                        <div
                          className="relative"
                          ref={
                            openServiceRowId === service.rowId
                              ? serviceDropdownRef
                              : null
                          }
                        >
                          <div className="flex items-start gap-1">
                            <AutoGrowTextarea
                              className={withValidity(
                                fieldClass,
                                !service.serviceName.trim(),
                              )}
                              minHeight={40}
                              value={service.serviceName}
                              onChange={(event) => {
                                updateService(
                                  service.rowId,
                                  "serviceName",
                                  event.target.value,
                                );
                                if (openServiceRowId !== service.rowId) {
                                  setOpenServiceRowId(service.rowId);
                                }
                              }}
                              onFocus={() => setOpenServiceRowId(null)}
                              placeholder="Type or select service"
                            />
                            <button
                              type="button"
                              className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50"
                              title="Show services"
                              onClick={() =>
                                setOpenServiceRowId((prev) =>
                                  prev === service.rowId ? null : service.rowId,
                                )
                              }
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>

                          {openServiceRowId === service.rowId ? (
                            <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-56 overflow-auto">
                              {filteredServices.length === 0 ? (
                                <div className="p-2 text-xs text-gray-500">
                                  No matching services
                                </div>
                              ) : (
                                filteredServices.map((sv) => (
                                  <button
                                    key={sv.id}
                                    type="button"
                                    className="w-full text-left px-3 py-2 hover:bg-gray-50"
                                    onClick={() =>
                                      handleSelectServiceName(
                                        service.rowId,
                                        sv.name,
                                      )
                                    }
                                  >
                                    <div className="text-sm text-gray-800">
                                      {sv.name}
                                    </div>
                                    {sv.description ? (
                                      <div className="text-xs text-gray-500 line-clamp-2">
                                        {sv.description}
                                      </div>
                                    ) : null}
                                  </button>
                                ))
                              )}
                            </div>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <AutoGrowTextarea
                          className={fieldClass}
                          minHeight={40}
                          value={service.description}
                          onChange={(event) =>
                            updateService(
                              service.rowId,
                              "description",
                              event.target.value,
                            )
                          }
                          placeholder="Description"
                        />
                      </td>

                      <td className="px-4 py-3">
                        {isHeading ? (
                          <span className="block text-center text-gray-400">
                            —
                          </span>
                        ) : (
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            className={withValidity(
                              `${fieldClass} text-center`,
                              service.units <= 0,
                            )}
                            value={service.unit}
                            onChange={(event) =>
                              updateService(
                                service.rowId,
                                "unit",
                                event.target.value,
                              )
                            }
                          />
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {isHeading ? (
                          <span className="block text-right text-gray-400">
                            —
                          </span>
                        ) : service.isManual ? (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className={withValidity(
                              `${fieldClass} text-right`,
                              service.adjustedUnitCost <= 0,
                            )}
                            value={service.manualRateInput}
                            onChange={(event) =>
                              updateService(
                                service.rowId,
                                "manualRateInput",
                                event.target.value,
                              )
                            }
                            placeholder="0.00"
                          />
                        ) : (
                          <input
                            readOnly
                            className={`${fieldClass} cursor-default bg-gray-50 text-right font-semibold`}
                            value={formatMoney(service.adjustedUnitCost)}
                            title={`Original RTD unit cost: Rs. ${formatMoney(
                              service.sourceUnitCost,
                            )}`}
                          />
                        )}
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {isHeading
                          ? "—"
                          : `Rs. ${formatMoney(service.adjustedLineAmount)}`}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {service.isManual ? (
                          <div className="flex flex-col items-center gap-1">
                            <label
                              className="flex items-center gap-1 text-[10px] font-medium text-gray-500"
                              title="Show calculations"
                            >
                              <input
                                type="checkbox"
                                checked={!service.isHeadingOnly}
                                onChange={() =>
                                  toggleHeadingOnly(service.rowId)
                                }
                                className="h-3.5 w-3.5 rounded border-gray-300"
                              />
                              Cals
                            </label>
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(service.rowId)}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                              title="Remove row"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}

                {calculatedServices.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-gray-500"
                    >
                      Select RTD record(s) on the Records tab, or add a row
                      below.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>

            <Button
              type="button"
              variant="outline"
              onClick={handleAddRow}
              className="mt-3"
            >
              Add Row
            </Button>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Message</h2>

          <div className="mt-5">
            <Field label="Message">
              <textarea
                rows={3}
                value={footerText}
                onChange={(event) => setFooterText(event.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2 text-sm text-gray-700 outline-none transition focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter an optional message to show below the service table"
              />
            </Field>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-950 text-white">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-700">Totals</h2>
                <p className="text-sm text-gray-500">
                  Customer-facing estimate totals.
                </p>
              </div>
            </div>

            <SummaryRow label="Subtotal" amount={adjustedSubtotal} />
            <SummaryRow
              label={
                selectedSalesTax
                  ? `${selectedSalesTax.name} (${selectedSalesTax.percent}%)`
                  : "Sales Tax"
              }
              amount={salesTaxAmount}
            />

            <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-4">
              <span className="text-lg font-black text-gray-950">Total</span>
              <span className="text-2xl font-black text-gray-950">
                Rs. {formatMoney(invoiceTotal)}
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
            <div className="mb-5">
              <h2 className="text-sm font-semibold text-gray-700">
                Tax Summary
              </h2>
              <p className="text-sm text-gray-500">
                Only Sales Tax is shown here. WHT is intentionally not
                displayed.
              </p>
            </div>

            {selectedSalesTax && salesTaxAmount > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-gray-200">
                <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {selectedSalesTax.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedSalesTax.percent}%
                    </p>
                  </div>
                  <span className="font-bold text-gray-900">
                    Rs. {formatMoney(salesTaxAmount)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="rounded-2xl bg-gray-50 px-4 py-5 text-sm text-gray-500">
                Select Sales Tax to populate the summary.
              </p>
            )}

            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-800">
              WHT is still used internally to calculate the required gross-up.
              Its effect is embedded in the Unit Cost, so it does not appear as
              a separate tax line on the Estimate.
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">
            Terms & Conditions
          </h2>

          <div className="mt-5 space-y-5">
            <Field label="Terms & Conditions">
              <select
                className={withValidity(fieldClass, !selectedTermsId)}
                value={selectedTermsId}
                onChange={(event) => handleSelectTerms(event.target.value)}
              >
                <option value="">Select Terms & Conditions</option>
                {termsConditions.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.name}
                  </option>
                ))}
              </select>
            </Field>

            {selectedTermsId ? (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Terms & Conditions Text
                </label>
                <textarea
                  rows={7}
                  value={termsConditionText}
                  onChange={(event) =>
                    setTermsConditionText(event.target.value)
                  }
                  className={withValidity(
                    "w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm leading-6 text-gray-700 outline-none transition focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                    !termsConditionText.trim(),
                  )}
                />
              </div>
            ) : null}
          </div>
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
            className="h-11 rounded-xl bg-gray-950 px-6 text-white hover:bg-gray-800"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saving
              ? "Saving..."
              : editId
                ? "Update Estimate"
                : "Save Estimate"}
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-700">
            RTD Estimate List
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1650px] text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-5 py-4 text-left">Estimate</th>
                <th className="px-5 py-4 text-left">Subject / Purpose</th>
                <th className="px-5 py-4 text-left">Client</th>
                <th className="px-5 py-4 text-center">RTDs</th>
                <th className="px-5 py-4 text-left">From Account(s)</th>
                <th className="px-5 py-4 text-right">RTD Amount</th>
                <th className="px-5 py-4 text-right">Sales Tax</th>
                <th className="px-5 py-4 text-right">Estimate Total</th>
                <th className="px-5 py-4 text-left">PO</th>
                <th className="px-5 py-4 text-center">Days</th>
                <th className="px-5 py-4 text-left">Status</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {estimates.map((estimate) => {
                const recordIds =
                  Array.isArray(estimate.rtdRecordIds) &&
                  estimate.rtdRecordIds.length > 0
                    ? estimate.rtdRecordIds
                    : estimate.rtdRecordId
                      ? [estimate.rtdRecordId]
                      : [];

                const accountNames =
                  Array.isArray(estimate.accountFromNames) &&
                  estimate.accountFromNames.length > 0
                    ? estimate.accountFromNames
                    : estimate.accountFromName
                      ? [estimate.accountFromName]
                      : [];

                const status = getEstimateStatus(estimate);

                const poNumber = String(estimate.poNumber || "").trim();
                const noPo = !poNumber;
                const daysSinceCreated = getDaysSince(estimate.createdAt);

                return (
                  <tr
                    key={estimate.id}
                    className={
                      noPo
                        ? "bg-red-50/70 hover:bg-red-100"
                        : "hover:bg-gray-50"
                    }
                  >
                    <td className="px-5 py-4 font-bold">
                      {estimate.estimateNo || "-"}
                    </td>
                    <td className="px-5 py-4">
                      {estimate.subjectPurpose || "-"}
                    </td>
                    <td className="px-5 py-4">{estimate.client || "-"}</td>
                    <td className="px-5 py-4 text-center">
                      {recordIds.length || estimate.rtdRecordCount || 0}
                    </td>
                    <td className="px-5 py-4">
                      {accountNames.join(", ") || "-"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      Rs. {formatMoney(estimate.customerPayment)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      Rs. {formatMoney(estimate.salesTaxAmount)}
                    </td>
                    <td className="px-5 py-4 text-right font-bold">
                      Rs.{" "}
                      {formatMoney(
                        estimate.invoiceTotal || estimate.estimateAmount,
                      )}
                    </td>
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
                          onClick={() => handleEditEstimate(estimate)}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePreviewEstimate(estimate)}
                          disabled={previewLoadingId === estimate.id}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                          title="Preview"
                        >
                          {previewLoadingId === estimate.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadEstimate(estimate)}
                          disabled={downloadLoadingId === estimate.id}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                          title="Download"
                        >
                          {downloadLoadingId === estimate.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </button>
                        {!String(estimate.invoiceId || "").trim() ? (
                          <button
                            type="button"
                            onClick={() => onCreateInvoice?.(estimate)}
                            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                            title="Create Invoice"
                          >
                            <Receipt className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {estimates.length === 0 ? (
                <tr>
                  <td
                    colSpan={12}
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    No RTD Estimates found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {isPreviewOpen && previewURL ? (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 h-[90vh] p-4 flex flex-col">
            <div className="flex justify-between mb-4">
              <h2 className="font-semibold text-sm">PDF Preview</h2>
              <button onClick={() => setIsPreviewOpen(false)}>❌</button>
            </div>
            <iframe
              src={previewURL}
              className="flex-1 border"
              title="PDF Preview"
            />
            <div className="mt-4 flex justify-end gap-3">
              <Button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = previewURL;
                  link.download = `${lastSavedEstimateNo || "rtd-estimate"}.pdf`;
                  link.click();
                }}
              >
                Download
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isListDrawerOpen && listPreviewURL ? (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setIsListDrawerOpen(false)}
          />

          <div className="relative ml-auto flex h-full w-full max-w-5xl flex-col bg-white shadow-2xl lg:w-[58vw]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-black tracking-[-0.03em] text-slate-950">
                  RTD Estimate Preview
                </h2>
                <p className="text-sm text-slate-500">
                  {selectedListEstimate?.estimateNo || "Estimate document"}
                </p>
              </div>

              <button
                onClick={() => setIsListDrawerOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-950"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 bg-slate-100 p-4">
              <iframe
                src={listPreviewURL}
                className="h-full w-full rounded-2xl border border-slate-200 bg-white shadow-sm"
                title="PDF Preview"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-white px-5 py-4">
              <Button
                variant="outline"
                className="rounded-xl border-slate-200"
                onClick={() => {
                  if (!selectedListEstimate) return;
                  setIsListDrawerOpen(false);
                  handleEditEstimate(selectedListEstimate);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="rounded-xl border-slate-200"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = listPreviewURL;
                  link.download = `${selectedListEstimate?.estimateNo || "rtd-estimate"}.pdf`;
                  link.click();
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
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
      <label className="block text-sm font-medium text-gray-600 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-gray-800">
        {value || "-"}
      </p>
    </div>
  );
}

function SummaryRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0">
      <span className="font-medium text-gray-700">{label}</span>
      <span className="font-semibold tabular-nums text-gray-900">
        Rs. {formatMoney(amount)}
      </span>
    </div>
  );
}

function AutoGrowTextarea({
  value,
  onChange,
  className = "",
  minHeight = 40,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  minHeight?: number;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  const resize = () => {
    const el = ref.current;
    if (!el) return;

    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, minHeight)}px`;
  };

  useEffect(() => {
    resize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, minHeight]);

  return (
    <textarea
      {...props}
      ref={ref}
      value={value}
      onChange={(e) => {
        onChange?.(e);
        requestAnimationFrame(resize);
      }}
      className={`${className} resize-none overflow-hidden leading-6`}
      style={{
        ...props.style,
        minHeight,
      }}
    />
  );
}
