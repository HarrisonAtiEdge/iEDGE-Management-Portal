// import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";

// import { auth, db } from "@/lib/firebase";

// import {
//   collection,
//   doc,
//   increment,
//   onSnapshot,
//   runTransaction,
//   serverTimestamp,
//   updateDoc,
// } from "firebase/firestore";

// import { Button } from "@/components/ui/button";
// import {
//   Calculator,
//   ChevronDown,
//   Download,
//   Eye,
//   Loader2,
//   Pencil,
//   Save,
//   Trash2,
//   X,
// } from "lucide-react";
// import { buildEstimatePdfBlob } from "@/lib/estimatePdf";
// import type { Estimate } from "../../types";
// import {
//   COMPANY_LIST,
//   PANEL_ID,
//   RTDEstimateRecord,
//   SavedServiceRow,
// } from "./RTDEstimate";

// const INVOICE_HEADINGS = ["Sales Tax Invoice", "Performa Invoice", "Invoice"];

// type Props = {
//   initialEstimate?: RTDEstimateRecord | null;
//   onInvoiceSaved?: () => void;
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
//   serviceName: string;
//   description: string;
//   unit: string;
//   unitCost: string;
//   isHeadingOnly: boolean;
// };

// export type RTDInvoiceRecord = {
//   id: string;
//   invoiceNo?: string;
//   invoiceHeading?: string;
//   invoiceDate?: string;
//   dueDate?: string;
//   client?: string;
//   clientAddress?: string;
//   additionalInfo?: string;
//   projectOwner?: string;
//   subjectPurpose?: string;
//   poNumber?: string;
//   paymentTerm?: string;
//   salesTaxId?: string;
//   salesTaxName?: string;
//   salesTaxPercent?: number;
//   services?: SavedServiceRow[];
//   subtotal?: number;
//   salesTaxAmount?: number;
//   total?: number;
//   footerText?: string;
//   termsConditionId?: string;
//   termsConditionTitle?: string;
//   termsConditionText?: string;
//   sourceEstimateId?: string;
//   sourceEstimateNo?: string;
//   rtdRecordIds?: string[];
//   status?: string;
//   createdBy?: string;
//   createdByEmail?: string;
//   createdAt?: any;
// };

// const toNumber = (value: any) => {
//   const parsed = Number(
//     String(value ?? "")
//       .replace(/,/g, "")
//       .trim(),
//   );
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

// const getDaysSince = (value: any) => {
//   const ms = getTime(value);
//   if (!ms) return null;

//   return Math.max(0, Math.floor((Date.now() - ms) / 86400000));
// };

// const INVOICE_STATUS_OPTIONS = ["Unpaid", "Partially Paid", "Paid"];

// const getInvoiceStatusPillClass = (status: string) => {
//   switch (String(status || "").toLowerCase()) {
//     case "paid":
//       return "border-emerald-200 bg-emerald-50 text-emerald-700";
//     case "partially paid":
//       return "border-amber-200 bg-amber-50 text-amber-700";
//     default:
//       return "border-red-200 bg-red-50 text-red-700";
//   }
// };

// const normalizeClient = (value: unknown) =>
//   String(value || "")
//     .trim()
//     .toLowerCase();

// const uniqueStrings = (values: Array<string | undefined>) =>
//   Array.from(
//     new Set(values.map((value) => String(value || "").trim()).filter(Boolean)),
//   );

// const makeRowId = () =>
//   typeof crypto !== "undefined" && "randomUUID" in crypto
//     ? crypto.randomUUID()
//     : `row_${Date.now()}_${Math.random().toString(16).slice(2)}`;

// export default function RTDInvoice({
//   initialEstimate = null,
//   onInvoiceSaved,
// }: Props) {
//   const [invoices, setInvoices] = useState<RTDInvoiceRecord[]>([]);
//   const [salesTaxes, setSalesTaxes] = useState<TaxOption[]>([]);
//   const [termsConditions, setTermsConditions] = useState<TermsConditionDoc[]>(
//     [],
//   );
//   const [paymentTerms, setPaymentTerms] = useState<string[]>([]);
//   const [clients, setClients] = useState<ClientRecord[]>([]);
//   const [servicesList, setServicesList] = useState<
//     { id: string; name: string; description?: string }[]
//   >([]);

//   const [editId, setEditId] = useState<string | null>(null);
//   const [invoiceNo, setInvoiceNo] = useState("");
//   const [sharedCounterCurrent, setSharedCounterCurrent] = useState(0);

//   const [invoiceHeading, setInvoiceHeading] = useState(INVOICE_HEADINGS[0]);
//   const [invoiceDate, setInvoiceDate] = useState(
//     new Date().toISOString().slice(0, 10),
//   );
//   const [dueDate, setDueDate] = useState("");
//   const [client, setClient] = useState("");
//   const [clientAddress, setClientAddress] = useState("");
//   const [additionalInfo, setAdditionalInfo] = useState("");
//   const [projectOwner, setProjectOwner] = useState("");
//   const [subjectPurpose, setSubjectPurpose] = useState("");
//   const [poNumber, setPoNumber] = useState("");
//   const [paymentTerm, setPaymentTerm] = useState("");
//   const [selectedSalesTaxId, setSelectedSalesTaxId] = useState("");
//   const [services, setServices] = useState<ServiceRow[]>([]);
//   const [footerText, setFooterText] = useState("");
//   const [selectedTermsId, setSelectedTermsId] = useState("");
//   const [termsConditionTitle, setTermsConditionTitle] = useState("");
//   const [termsConditionText, setTermsConditionText] = useState("");

//   const [sourceEstimateId, setSourceEstimateId] = useState("");
//   const [sourceEstimateNo, setSourceEstimateNo] = useState("");
//   const [sourceRtdRecordIds, setSourceRtdRecordIds] = useState<string[]>([]);

//   const [saving, setSaving] = useState(false);
//   const savingRef = useRef(false);
//   const [message, setMessage] = useState("");
//   const [error, setError] = useState("");
//   const [attemptedSubmit, setAttemptedSubmit] = useState(false);

//   const [openServiceRowId, setOpenServiceRowId] = useState<string | null>(null);
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
//   const [lastSavedInvoiceNo, setLastSavedInvoiceNo] = useState("");

//   const [listPreviewURL, setListPreviewURL] = useState<string | null>(null);
//   const [isListDrawerOpen, setIsListDrawerOpen] = useState(false);
//   const [selectedListInvoice, setSelectedListInvoice] =
//     useState<RTDInvoiceRecord | null>(null);
//   const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
//   const [downloadLoadingId, setDownloadLoadingId] = useState<string | null>(
//     null,
//   );

//   const loadedEstimateIdRef = useRef("");
//   const addressPrefilledRef = useRef(false);

//   const fieldClass =
//     "w-full rounded-lg border border-gray-300 p-2 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

//   const invalidFieldClass =
//     "border-red-400 ring-2 ring-red-100 focus:ring-red-200 focus:border-red-400";

//   const withValidity = (base: string, invalid: boolean) =>
//     invalid && attemptedSubmit ? `${base} ${invalidFieldClass}` : base;

//   useEffect(() => {
//     const unsubscribe = onSnapshot(
//       collection(db, "Panels", PANEL_ID, "rtdInvoices"),
//       (snapshot) => {
//         const list = snapshot.docs.map((document) => ({
//           id: document.id,
//           ...(document.data() as Omit<RTDInvoiceRecord, "id">),
//         }));

//         list.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
//         setInvoices(list);
//       },
//       (loadError) => {
//         console.error("Failed to load RTD invoices:", loadError);
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

//   // ✅ shared with the main Sales Tax Invoice feature, purely to preview the next number
//   useEffect(() => {
//     const unsubscribe = onSnapshot(
//       doc(
//         db,
//         "Panels",
//         PANEL_ID,
//         "counters",
//         "estimateInvoices",
//         "companies",
//         "iedge_sales",
//       ),
//       (snap) => {
//         const current = snap.exists() ? toNumber(snap.data()?.current) : 0;
//         setSharedCounterCurrent(current);
//       },
//       (loadError) => {
//         console.error("Failed to load invoice counter:", loadError);
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

//   const nextInvoiceNo = `S-${String(sharedCounterCurrent + 1).padStart(6, "0")}`;

//   const selectedSalesTax = useMemo(
//     () => salesTaxes.find((tax) => tax.id === selectedSalesTaxId) || null,
//     [salesTaxes, selectedSalesTaxId],
//   );

//   // ✅ prefill the form from an Estimate handed over via "Create Invoice"
//   useEffect(() => {
//     if (!initialEstimate) return;
//     if (loadedEstimateIdRef.current === initialEstimate.id) return;
//     loadedEstimateIdRef.current = initialEstimate.id;
//     addressPrefilledRef.current = false;

//     setEditId(null);
//     setInvoiceNo("");
//     setInvoiceHeading(INVOICE_HEADINGS[0]);
//     setInvoiceDate(new Date().toISOString().slice(0, 10));
//     setDueDate("");
//     setClient(initialEstimate.client || "");
//     setClientAddress("");
//     setAdditionalInfo("");
//     setProjectOwner(initialEstimate.projectOwner || "");
//     setSubjectPurpose(initialEstimate.subjectPurpose || "");
//     setPoNumber(initialEstimate.poNumber || "");
//     setPaymentTerm(initialEstimate.paymentTerm || "");
//     setSelectedSalesTaxId(initialEstimate.salesTaxId || "");
//     setFooterText(initialEstimate.footerText || "");
//     setSelectedTermsId(initialEstimate.termsConditionId || "");
//     setTermsConditionTitle(initialEstimate.termsConditionTitle || "");
//     setTermsConditionText(initialEstimate.termsConditionText || "");

//     setSourceEstimateId(initialEstimate.id);
//     setSourceEstimateNo(initialEstimate.estimateNo || "");
//     setSourceRtdRecordIds(
//       Array.isArray(initialEstimate.rtdRecordIds) &&
//         initialEstimate.rtdRecordIds.length > 0
//         ? initialEstimate.rtdRecordIds
//         : initialEstimate.rtdRecordId
//           ? [initialEstimate.rtdRecordId]
//           : [],
//     );

//     const savedServices = Array.isArray(initialEstimate.services)
//       ? initialEstimate.services
//       : [];

//     setServices(
//       savedServices.map((service) => ({
//         rowId: makeRowId(),
//         serviceName: service.serviceName || "",
//         description: service.description || "",
//         unit: String(service.unit ?? ""),
//         unitCost: String(service.unitCost ?? ""),
//         isHeadingOnly: Boolean(service.isHeadingOnly),
//       })),
//     );

//     setAttemptedSubmit(false);
//     setError("");
//     setMessage("");

//     if (typeof window !== "undefined") {
//       window.scrollTo({ top: 0, behavior: "smooth" });
//     }
//   }, [initialEstimate]);

//   // ✅ fill Client Address / Additional Info from the clients directory once, on load
//   useEffect(() => {
//     if (!initialEstimate) return;
//     if (addressPrefilledRef.current) return;
//     if (!clients.length) return;

//     const match = clients.find(
//       (item) =>
//         normalizeClient(item.name) === normalizeClient(initialEstimate.client),
//     );

//     if (match) {
//       setClientAddress(
//         uniqueStrings([
//           match.address,
//           match.city,
//           match.zipCode,
//           match.country,
//         ]).join(", "),
//       );
//       setAdditionalInfo(match.addtionalInfo || "");
//     }

//     addressPrefilledRef.current = true;
//   }, [clients, initialEstimate]);

//   const updateService = (
//     rowId: string,
//     field: "serviceName" | "description" | "unit" | "unitCost",
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
//         serviceName: "",
//         description: "",
//         unit: "1",
//         unitCost: "",
//         isHeadingOnly: true,
//       },
//     ]);
//   };

//   const handleRemoveRow = (rowId: string) => {
//     setServices((previous) =>
//       previous.filter((service) => service.rowId !== rowId),
//     );
//   };

//   const calculatedServices = useMemo(
//     () =>
//       services.map((service) => {
//         const units = Math.max(toNumber(service.unit), 0);
//         const unitCost = toNumber(service.unitCost);
//         const amount = service.isHeadingOnly ? 0 : units * unitCost;

//         return { ...service, units, unitCost, amount };
//       }),
//     [services],
//   );

//   const subtotal = useMemo(
//     () => calculatedServices.reduce((sum, service) => sum + service.amount, 0),
//     [calculatedServices],
//   );

//   const salesTaxRate = toNumber(selectedSalesTax?.percent) / 100;
//   const salesTaxAmount = subtotal * salesTaxRate;
//   const total = subtotal + salesTaxAmount;

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

//   const buildRtdInvoiceForPdf = (args: {
//     invoiceNo: string;
//     invoiceHeading: string;
//     invoiceDate: string;
//     dueDate: string;
//     client: string;
//     clientAddress: string;
//     additionalInfo: string;
//     projectOwner: string;
//     subjectPurpose: string;
//     poNumber: string;
//     paymentTerm: string;
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
//     termsConditionTitle: string;
//     termsConditionText: string;
//     createdBy: string;
//   }) => {
//     const heading = String(
//       args.invoiceHeading || INVOICE_HEADINGS[0],
//     ).toUpperCase();

//     return {
//       estimateNo: args.invoiceNo,
//       documentTitle: heading,
//       documentNumberLabel: heading,
//       dateLabel: "Invoice Date",
//       expiryLabel: "Due Date",
//       client: args.client,
//       info: args.additionalInfo,
//       address: args.clientAddress,
//       date: args.invoiceDate,
//       expiryDate: args.dueDate,
//       projectOwner: args.projectOwner,
//       paymentTerm: args.paymentTerm,
//       services: args.services.map((service) => ({
//         detail: service.serviceName,
//         description: service.description,
//         units: service.unit,
//         rate: service.unitCost,
//         showFinancialsInPdf: service.showFinancialsInPdf,
//         // ✅ per-line tax so the shared PDF builder's Tax Summary table renders;
//         // omitted on heading-only rows so they never leak into its totals
//         taxLabel: service.showFinancialsInPdf ? args.taxLabel : undefined,
//         taxPercent: service.showFinancialsInPdf ? args.taxPercent : 0,
//       })),
//       subtotal: args.subtotal,
//       tax: args.taxAmount,
//       poNumber: args.poNumber,
//       subject: args.subjectPurpose,
//       total: args.total,
//       company: "iEDGE",
//       taxType: "exclusive",
//       taxPercent: args.taxPercent,
//       message: args.footerText,
//       termsConditionTitle: args.termsConditionTitle,
//       termsConditionText: args.termsConditionText,
//       createdBy: args.createdBy,
//     };
//   };

//   const buildPdfBlobForInvoice = async (invoice: RTDInvoiceRecord) => {
//     const savedServices = Array.isArray(invoice.services)
//       ? invoice.services
//       : [];

//     const pdfInvoice = buildRtdInvoiceForPdf({
//       invoiceNo: invoice.invoiceNo || "",
//       invoiceHeading: invoice.invoiceHeading || INVOICE_HEADINGS[0],
//       invoiceDate: invoice.invoiceDate || "",
//       dueDate: invoice.dueDate || "",
//       client: invoice.client || "",
//       clientAddress: invoice.clientAddress || "",
//       additionalInfo: invoice.additionalInfo || "",
//       projectOwner: invoice.projectOwner || "",
//       subjectPurpose: invoice.subjectPurpose || "",
//       poNumber: invoice.poNumber || "",
//       paymentTerm: invoice.paymentTerm || "",
//       services: savedServices.map((service) => ({
//         serviceName: service.serviceName || "",
//         description: service.description || "",
//         unit: toNumber(service.unit),
//         unitCost: toNumber(service.unitCost),
//         showFinancialsInPdf: !service.isHeadingOnly,
//       })),
//       subtotal: toNumber(invoice.subtotal),
//       taxAmount: toNumber(invoice.salesTaxAmount),
//       total: toNumber(invoice.total),
//       taxPercent: toNumber(invoice.salesTaxPercent),
//       taxLabel: invoice.salesTaxName || "",
//       footerText: invoice.footerText || "",
//       termsConditionTitle: invoice.termsConditionTitle || "",
//       termsConditionText: invoice.termsConditionText || "",
//       createdBy: "",
//     });

//     return buildEstimatePdfBlob({
//       estimate: pdfInvoice as unknown as Estimate,
//       companyList: COMPANY_LIST,
//       withLogo: true,
//       footerUser: loggedInUser,
//       companyName: "iEDGE",
//     });
//   };

//   const handlePreviewInvoice = async (invoice: RTDInvoiceRecord) => {
//     try {
//       setPreviewLoadingId(invoice.id);

//       const blob = await buildPdfBlobForInvoice(invoice);

//       setSelectedListInvoice(invoice);
//       setListPreviewURL(URL.createObjectURL(blob));
//       setIsListDrawerOpen(true);
//     } catch (previewError) {
//       console.error("Failed to build RTD Invoice preview:", previewError);
//     } finally {
//       setPreviewLoadingId(null);
//     }
//   };

//   const handleUpdateInvoiceStatus = async (
//     invoice: RTDInvoiceRecord,
//     status: string,
//   ) => {
//     try {
//       await updateDoc(doc(db, "Panels", PANEL_ID, "rtdInvoices", invoice.id), {
//         status,
//         updatedAt: serverTimestamp(),
//       });
//     } catch (statusError) {
//       console.error("Failed to update RTD Invoice status:", statusError);
//     }
//   };

//   const handleDownloadInvoice = async (invoice: RTDInvoiceRecord) => {
//     try {
//       setDownloadLoadingId(invoice.id);

//       const blob = await buildPdfBlobForInvoice(invoice);

//       const link = document.createElement("a");
//       link.href = URL.createObjectURL(blob);
//       link.download = `${invoice.invoiceNo || "rtd-invoice"}.pdf`;
//       link.click();
//     } catch (downloadError) {
//       console.error("Failed to download RTD Invoice:", downloadError);
//     } finally {
//       setDownloadLoadingId(null);
//     }
//   };

//   const resetForm = () => {
//     setEditId(null);
//     setInvoiceNo("");
//     setInvoiceHeading(INVOICE_HEADINGS[0]);
//     setInvoiceDate(new Date().toISOString().slice(0, 10));
//     setDueDate("");
//     setClient("");
//     setClientAddress("");
//     setAdditionalInfo("");
//     setProjectOwner("");
//     setSubjectPurpose("");
//     setPoNumber("");
//     setPaymentTerm("");
//     setSelectedSalesTaxId("");
//     setServices([]);
//     setFooterText("");
//     setSelectedTermsId("");
//     setTermsConditionTitle("");
//     setTermsConditionText("");
//     setSourceEstimateId("");
//     setSourceEstimateNo("");
//     setSourceRtdRecordIds([]);
//     setAttemptedSubmit(false);
//     loadedEstimateIdRef.current = "";
//     addressPrefilledRef.current = false;
//   };

//   const handleEditInvoice = (invoice: RTDInvoiceRecord) => {
//     setEditId(invoice.id);
//     setInvoiceNo(invoice.invoiceNo || "");
//     setInvoiceHeading(invoice.invoiceHeading || INVOICE_HEADINGS[0]);
//     setInvoiceDate(
//       invoice.invoiceDate || new Date().toISOString().slice(0, 10),
//     );
//     setDueDate(invoice.dueDate || "");
//     setClient(invoice.client || "");
//     setClientAddress(invoice.clientAddress || "");
//     setAdditionalInfo(invoice.additionalInfo || "");
//     setProjectOwner(invoice.projectOwner || "");
//     setSubjectPurpose(invoice.subjectPurpose || "");
//     setPoNumber(invoice.poNumber || "");
//     setPaymentTerm(invoice.paymentTerm || "");
//     setSelectedSalesTaxId(invoice.salesTaxId || "");
//     setFooterText(invoice.footerText || "");
//     setSelectedTermsId(invoice.termsConditionId || "");
//     setTermsConditionTitle(invoice.termsConditionTitle || "");
//     setTermsConditionText(invoice.termsConditionText || "");
//     setSourceEstimateId(invoice.sourceEstimateId || "");
//     setSourceEstimateNo(invoice.sourceEstimateNo || "");
//     setSourceRtdRecordIds(invoice.rtdRecordIds || []);

//     const savedServices = Array.isArray(invoice.services)
//       ? invoice.services
//       : [];

//     setServices(
//       savedServices.map((service) => ({
//         rowId: makeRowId(),
//         serviceName: service.serviceName || "",
//         description: service.description || "",
//         unit: String(service.unit ?? ""),
//         unitCost: String(service.unitCost ?? ""),
//         isHeadingOnly: Boolean(service.isHeadingOnly),
//       })),
//     );

//     loadedEstimateIdRef.current = `__edit__${invoice.id}`;
//     addressPrefilledRef.current = true;
//     setAttemptedSubmit(false);
//     setError("");
//     setMessage("");

//     if (typeof window !== "undefined") {
//       window.scrollTo({ top: 0, behavior: "smooth" });
//     }
//   };

//   const validate = () => {
//     if (!invoiceDate) return "Invoice Date is required.";
//     if (!client.trim()) return "Client is required.";
//     if (!subjectPurpose.trim()) return "Subject / Purpose is required.";
//     if (!projectOwner.trim()) return "Project Owner is required.";
//     if (!paymentTerm.trim()) return "Payment Terms is required.";
//     if (!selectedSalesTaxId) return "Sales Tax is required.";
//     if (!selectedTermsId) return "Terms & Conditions is required.";
//     if (!termsConditionText.trim())
//       return "Terms & Conditions text is required.";
//     if (subtotal <= 0)
//       return "Add at least one service with a Unit and Unit Cost greater than zero.";

//     const invalidService = calculatedServices.find((service) => {
//       if (!service.serviceName.trim()) return true;
//       if (service.isHeadingOnly) return false;
//       return service.units <= 0 || service.unitCost <= 0;
//     });

//     if (invalidService) {
//       return "Each service requires a Service Name (and a Unit and Unit Cost greater than zero, unless calculations are hidden).";
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

//       const savedServices: SavedServiceRow[] = calculatedServices.map(
//         (service) => ({
//           rtdRecordId: "",
//           serviceName: service.serviceName.trim(),
//           description: service.description.trim(),
//           unit: service.units,
//           sourceAmount: 0,
//           sourceUnitCost: service.unitCost,
//           unitCost: service.unitCost,
//           amount: service.amount,
//           isHeadingOnly: service.isHeadingOnly,
//         }),
//       );

//       const invoicePayload = {
//         invoiceHeading,
//         invoiceDate,
//         dueDate,
//         client: client.trim(),
//         clientAddress: clientAddress.trim(),
//         additionalInfo: additionalInfo.trim(),
//         projectOwner: projectOwner.trim(),
//         subjectPurpose: subjectPurpose.trim(),
//         poNumber: poNumber.trim(),
//         paymentTerm: paymentTerm.trim(),
//         salesTaxId: selectedSalesTax?.id || "",
//         salesTaxName: selectedSalesTax?.name || "",
//         salesTaxPercent: selectedSalesTax?.percent || 0,
//         services: savedServices,
//         subtotal,
//         salesTaxAmount,
//         total,
//         footerText: footerText.trim(),
//         termsConditionId: selectedTermsId,
//         termsConditionTitle,
//         termsConditionText,
//         sourceEstimateId,
//         sourceEstimateNo,
//         rtdRecordIds: sourceRtdRecordIds,
//       };

//       let savedInvoiceNo = "";

//       if (editId) {
//         savedInvoiceNo = invoiceNo;

//         await updateDoc(doc(db, "Panels", PANEL_ID, "rtdInvoices", editId), {
//           ...invoicePayload,
//           invoiceNo,
//           lastEditedById: currentUser?.uid || "",
//           lastEditedByName: currentUserName,
//           lastEditedByEmail: currentUserEmail,
//           lastEditedAt: serverTimestamp(),
//           editCount: increment(1),
//           updatedAt: serverTimestamp(),
//         });
//       } else {
//         const invoiceRef = doc(
//           collection(db, "Panels", PANEL_ID, "rtdInvoices"),
//         );
//         const counterRef = doc(
//           db,
//           "Panels",
//           PANEL_ID,
//           "counters",
//           "estimateInvoices",
//           "companies",
//           "iedge_sales",
//         );

//         await runTransaction(db, async (transaction) => {
//           const counterSnap = await transaction.get(counterRef);
//           const current = Number(
//             counterSnap.exists() ? counterSnap.data()?.current : 0,
//           );
//           const nextNumber = current + 1;
//           const generatedInvoiceNo = `S-${String(nextNumber).padStart(6, "0")}`;
//           savedInvoiceNo = generatedInvoiceNo;

//           transaction.set(counterRef, { current: nextNumber }, { merge: true });

//           transaction.set(invoiceRef, {
//             ...invoicePayload,
//             invoiceNo: generatedInvoiceNo,
//             status: "Unpaid",
//             createdBy: currentUser?.uid || "",
//             createdByEmail: currentUser?.email || "",
//             createdAt: serverTimestamp(),
//             updatedAt: serverTimestamp(),
//           });

//           if (sourceEstimateId) {
//             transaction.update(
//               doc(db, "Panels", PANEL_ID, "rtdEstimates", sourceEstimateId),
//               {
//                 invoiceId: invoiceRef.id,
//                 invoiceNo: generatedInvoiceNo,
//                 updatedAt: serverTimestamp(),
//               },
//             );
//           }

//           sourceRtdRecordIds.forEach((recordId) => {
//             transaction.update(
//               doc(db, "Panels", PANEL_ID, "rtdRecords", recordId),
//               {
//                 invoiceId: invoiceRef.id,
//                 invoiceNo: generatedInvoiceNo,
//                 updatedAt: serverTimestamp(),
//               },
//             );
//           });
//         });
//       }

//       try {
//         const pdfInvoice = buildRtdInvoiceForPdf({
//           invoiceNo: savedInvoiceNo,
//           invoiceHeading,
//           invoiceDate,
//           dueDate,
//           client,
//           clientAddress,
//           additionalInfo,
//           projectOwner,
//           subjectPurpose,
//           poNumber,
//           paymentTerm,
//           services: calculatedServices.map((service) => ({
//             serviceName: service.serviceName,
//             description: service.description,
//             unit: service.units,
//             unitCost: service.unitCost,
//             showFinancialsInPdf: !service.isHeadingOnly,
//           })),
//           subtotal,
//           taxAmount: salesTaxAmount,
//           total,
//           taxPercent: selectedSalesTax?.percent || 0,
//           taxLabel: selectedSalesTax?.name || "",
//           footerText,
//           termsConditionTitle,
//           termsConditionText,
//           createdBy: currentUser?.uid || "",
//         });

//         const blob = await buildEstimatePdfBlob({
//           estimate: pdfInvoice as unknown as Estimate,
//           companyList: COMPANY_LIST,
//           withLogo: true,
//           footerUser: loggedInUser,
//           companyName: "iEDGE",
//         });

//         setPreviewURL(URL.createObjectURL(blob));
//         setIsPreviewOpen(true);
//         setLastSavedInvoiceNo(savedInvoiceNo);
//       } catch (pdfError) {
//         console.error("Failed to build RTD Invoice PDF:", pdfError);
//       }

//       resetForm();
//       onInvoiceSaved?.();

//       setMessage(
//         wasEditing
//           ? `RTD Invoice ${savedInvoiceNo} updated.`
//           : `RTD Invoice ${savedInvoiceNo} saved.`,
//       );
//     } catch (saveError) {
//       console.error("Failed to save RTD Invoice:", saveError);
//       setError("Failed to save RTD Invoice.");
//     } finally {
//       savingRef.current = false;
//       setSaving(false);
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-2xl font-black tracking-[-0.04em] text-gray-950">
//           RTD Invoice
//         </h1>
//         <p className="mt-1 text-sm text-gray-500">
//           Create Sales Tax Invoices, Performa Invoices, or plain Invoices —
//           either from scratch or from an RTD Estimate via "Create Invoice".
//         </p>
//       </div>

//       {editId ? (
//         <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
//           <span>
//             Editing RTD Invoice <strong>{invoiceNo}</strong>.
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
//       ) : sourceEstimateNo ? (
//         <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
//           <span>
//             Creating this Invoice from RTD Estimate{" "}
//             <strong>{sourceEstimateNo}</strong>. Every field below is editable.
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
//           </div>

//           <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
//             <Field label="Invoice Type">
//               <select
//                 className={fieldClass}
//                 value={invoiceHeading}
//                 onChange={(event) => setInvoiceHeading(event.target.value)}
//               >
//                 {INVOICE_HEADINGS.map((heading) => (
//                   <option key={heading} value={heading}>
//                     {heading}
//                   </option>
//                 ))}
//               </select>
//             </Field>

//             <Field label="Invoice No">
//               <input
//                 readOnly
//                 className={`${fieldClass} cursor-default bg-gray-50 font-semibold`}
//                 value={invoiceNo || nextInvoiceNo}
//                 title={
//                   invoiceNo
//                     ? "This Invoice's number"
//                     : "Generated automatically when the Invoice is saved"
//                 }
//               />
//             </Field>

//             <Field label="Invoice Date">
//               <input
//                 type="date"
//                 className={withValidity(fieldClass, !invoiceDate)}
//                 value={invoiceDate}
//                 onChange={(event) => setInvoiceDate(event.target.value)}
//               />
//             </Field>

//             <Field label="Due Date (optional)">
//               <input
//                 type="date"
//                 className={fieldClass}
//                 value={dueDate}
//                 onChange={(event) => setDueDate(event.target.value)}
//               />
//             </Field>

//             <Field label="Client">
//               <input
//                 className={withValidity(fieldClass, !client.trim())}
//                 value={client}
//                 onChange={(event) => setClient(event.target.value)}
//                 placeholder="Client name"
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

//             <Field label="Client Address">
//               <input
//                 className={fieldClass}
//                 value={clientAddress}
//                 onChange={(event) => setClientAddress(event.target.value)}
//                 placeholder="Client address"
//               />
//             </Field>

//             <Field label="Additional Info">
//               <input
//                 className={fieldClass}
//                 value={additionalInfo}
//                 onChange={(event) => setAdditionalInfo(event.target.value)}
//                 placeholder="Additional client info"
//               />
//             </Field>

//             <Field label="Project Owner">
//               <input
//                 className={withValidity(fieldClass, !projectOwner.trim())}
//                 value={projectOwner}
//                 onChange={(event) => setProjectOwner(event.target.value)}
//                 placeholder="Requester name"
//               />
//             </Field>

//             <div className="md:col-span-2 xl:col-span-1">
//               <Field label="Subject / Purpose">
//                 <input
//                   className={withValidity(fieldClass, !subjectPurpose.trim())}
//                   value={subjectPurpose}
//                   onChange={(event) => setSubjectPurpose(event.target.value)}
//                   placeholder="Enter invoice subject or purpose"
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

//           {sourceEstimateNo ? (
//             <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
//               <InfoBox label="Source RTD Estimate" value={sourceEstimateNo} />
//               <InfoBox
//                 label="Linked RTD Records"
//                 value={String(sourceRtdRecordIds.length)}
//               />
//             </div>
//           ) : null}
//         </div>

//         <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
//           <Field label="Sales Tax">
//             <select
//               className={withValidity(
//                 `md:max-w-xs ${fieldClass}`,
//                 !selectedSalesTaxId,
//               )}
//               value={selectedSalesTaxId}
//               onChange={(event) => setSelectedSalesTaxId(event.target.value)}
//             >
//               <option value="">Select Sales Tax</option>
//               {salesTaxes.map((tax) => (
//                 <option key={tax.id} value={tax.id}>
//                   {tax.name} ({tax.percent}%)
//                 </option>
//               ))}
//             </select>
//           </Field>
//         </div>

//         <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
//           <div>
//             <h2 className="text-sm font-semibold text-gray-700">
//               Service Detail
//             </h2>
//             <p className="text-sm text-gray-500">
//               Enter each line item directly. Tick "Cals" to show and require a
//               Unit and Unit Cost for a row — leave it off for a description-only
//               line.
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
//                   const isHeading = service.isHeadingOnly;

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
//                         ) : (
//                           <input
//                             type="number"
//                             min="0"
//                             step="0.01"
//                             className={withValidity(
//                               `${fieldClass} text-right`,
//                               service.unitCost <= 0,
//                             )}
//                             value={service.unitCost}
//                             onChange={(event) =>
//                               updateService(
//                                 service.rowId,
//                                 "unitCost",
//                                 event.target.value,
//                               )
//                             }
//                             placeholder="0.00"
//                           />
//                         )}
//                       </td>

//                       <td className="px-4 py-3 text-right font-bold text-gray-900">
//                         {isHeading ? "—" : `Rs. ${formatMoney(service.amount)}`}
//                       </td>

//                       <td className="px-4 py-3 text-center">
//                         <div className="flex flex-col items-center gap-1">
//                           <label
//                             className="flex items-center gap-1 text-[10px] font-medium text-gray-500"
//                             title="Show calculations"
//                           >
//                             <input
//                               type="checkbox"
//                               checked={!service.isHeadingOnly}
//                               onChange={() => toggleHeadingOnly(service.rowId)}
//                               className="h-3.5 w-3.5 rounded border-gray-300"
//                             />
//                             Cals
//                           </label>
//                           <button
//                             type="button"
//                             onClick={() => handleRemoveRow(service.rowId)}
//                             className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
//                             title="Remove row"
//                           >
//                             <Trash2 className="h-4 w-4" />
//                           </button>
//                         </div>
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
//                       Add a row below.
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
//                   Customer-facing invoice totals.
//                 </p>
//               </div>
//             </div>

//             <SummaryRow label="Subtotal" amount={subtotal} />
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
//                 Rs. {formatMoney(total)}
//               </span>
//             </div>
//           </div>

//           <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
//             <div className="mb-5">
//               <h2 className="text-sm font-semibold text-gray-700">
//                 Tax Summary
//               </h2>
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
//           </div>
//         </div>

//         <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
//           <h2 className="text-sm font-semibold text-gray-700">
//             Terms & Conditions
//           </h2>

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
//                   onChange={(event) =>
//                     setTermsConditionText(event.target.value)
//                   }
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
//             {saving ? "Saving..." : editId ? "Update Invoice" : "Save Invoice"}
//           </Button>
//         </div>
//       </form>

//       <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow">
//         <div className="border-b border-gray-100 px-5 py-4">
//           <h2 className="text-sm font-semibold text-gray-700">
//             RTD Invoice List
//           </h2>
//         </div>

//         <div className="overflow-x-auto">
//           <table className="w-full min-w-[1550px] text-sm">
//             <thead>
//               <tr className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
//                 <th className="px-5 py-4 text-left">Invoice</th>
//                 <th className="px-5 py-4 text-left">Type</th>
//                 <th className="px-5 py-4 text-left">Subject / Purpose</th>
//                 <th className="px-5 py-4 text-left">Client</th>
//                 <th className="px-5 py-4 text-left">Estimate Ref</th>
//                 <th className="px-5 py-4 text-right">Total</th>
//                 <th className="px-5 py-4 text-left">PO</th>
//                 <th className="px-5 py-4 text-center">Days</th>
//                 <th className="px-5 py-4 text-left">Status</th>
//                 <th className="px-5 py-4 text-center">Actions</th>
//               </tr>
//             </thead>

//             <tbody className="divide-y divide-gray-100">
//               {invoices.map((invoice) => {
//                 const poNumber = String(invoice.poNumber || "").trim();
//                 const noPo = !poNumber;
//                 const daysSinceCreated = getDaysSince(invoice.createdAt);
//                 const status = invoice.status || "Unpaid";
//                 const overdueUnpaid =
//                   daysSinceCreated !== null &&
//                   daysSinceCreated >= 30 &&
//                   status.toLowerCase() !== "paid";
//                 const flagged = noPo || overdueUnpaid;

//                 return (
//                   <tr
//                     key={invoice.id}
//                     className={
//                       flagged
//                         ? "bg-red-50/70 hover:bg-red-100"
//                         : "hover:bg-gray-50"
//                     }
//                   >
//                     <td className="px-5 py-4 font-bold">
//                       {invoice.invoiceNo || "-"}
//                     </td>
//                     <td className="px-5 py-4">
//                       {invoice.invoiceHeading || "-"}
//                     </td>
//                     <td className="px-5 py-4">
//                       {invoice.subjectPurpose || "-"}
//                     </td>
//                     <td className="px-5 py-4">{invoice.client || "-"}</td>
//                     <td className="px-5 py-4">
//                       {invoice.sourceEstimateNo || "-"}
//                     </td>
//                     <td className="px-5 py-4 text-right font-bold">
//                       Rs. {formatMoney(invoice.total)}
//                     </td>
//                     <td className="px-5 py-4">
//                       {noPo ? (
//                         <span className="font-semibold text-red-600">
//                           No PO
//                         </span>
//                       ) : (
//                         poNumber
//                       )}
//                     </td>
//                     <td className="px-5 py-4 text-center">
//                       {daysSinceCreated === null ? "-" : daysSinceCreated}
//                     </td>
//                     <td className="px-5 py-4">
//                       <select
//                         value={status}
//                         onChange={(event) =>
//                           handleUpdateInvoiceStatus(invoice, event.target.value)
//                         }
//                         className={`rounded-full border px-2.5 py-1 text-xs font-bold outline-none ${getInvoiceStatusPillClass(status)}`}
//                       >
//                         {INVOICE_STATUS_OPTIONS.map((option) => (
//                           <option key={option} value={option}>
//                             {option}
//                           </option>
//                         ))}
//                       </select>
//                     </td>
//                     <td className="px-5 py-4">
//                       <div className="flex items-center justify-center gap-1">
//                         <button
//                           type="button"
//                           onClick={() => handleEditInvoice(invoice)}
//                           className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
//                           title="Edit"
//                         >
//                           <Pencil className="h-4 w-4" />
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => handlePreviewInvoice(invoice)}
//                           disabled={previewLoadingId === invoice.id}
//                           className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
//                           title="Preview"
//                         >
//                           {previewLoadingId === invoice.id ? (
//                             <Loader2 className="h-4 w-4 animate-spin" />
//                           ) : (
//                             <Eye className="h-4 w-4" />
//                           )}
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => handleDownloadInvoice(invoice)}
//                           disabled={downloadLoadingId === invoice.id}
//                           className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
//                           title="Download"
//                         >
//                           {downloadLoadingId === invoice.id ? (
//                             <Loader2 className="h-4 w-4 animate-spin" />
//                           ) : (
//                             <Download className="h-4 w-4" />
//                           )}
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 );
//               })}

//               {invoices.length === 0 ? (
//                 <tr>
//                   <td
//                     colSpan={10}
//                     className="px-5 py-12 text-center text-gray-500"
//                   >
//                     No RTD Invoices found.
//                   </td>
//                 </tr>
//               ) : null}
//             </tbody>
//           </table>
//         </div>
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
//                   link.download = `${lastSavedInvoiceNo || "rtd-invoice"}.pdf`;
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
//                   RTD Invoice Preview
//                 </h2>
//                 <p className="text-sm text-slate-500">
//                   {selectedListInvoice?.invoiceNo || "Invoice document"}
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
//                   if (!selectedListInvoice) return;
//                   setIsListDrawerOpen(false);
//                   handleEditInvoice(selectedListInvoice);
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
//                   link.download = `${selectedListInvoice?.invoiceNo || "rtd-invoice"}.pdf`;
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

import React, {
  FormEvent,
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { auth, db } from "@/lib/firebase";

import {
  collection,
  doc,
  increment,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { Button } from "@/components/ui/button";
import {
  Calculator,
  ChevronDown,
  Download,
  Eye,
  Loader2,
  Pencil,
  Save,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { buildEstimatePdfBlob } from "@/lib/estimatePdf";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import type { Estimate } from "../../types";
import {
  COMPANY_LIST,
  PANEL_ID,
  RTDEstimateRecord,
  SavedServiceRow,
} from "./RTDEstimate";

// Reuses the same Receive Payment flow (and DB writes) the main
// Estimate/Invoice module uses, instead of duplicating that logic here.
// Loaded on demand — it pulls in xlsx/jsPDF for its export buttons — so
// opening the RTD Invoice tab doesn't pay for it until someone actually
// clicks the wallet icon.
const ReceivePaymentModal = lazy(
  () => import("@/components/EstimateInvoice/ReceivePaymentModal"),
);

const INVOICE_HEADINGS = ["Sales Tax Invoice", "Performa Invoice", "Invoice"];

type Props = {
  initialEstimate?: RTDEstimateRecord | null;
  onInvoiceSaved?: () => void;
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
  serviceName: string;
  description: string;
  unit: string;
  unitCost: string;
  isHeadingOnly: boolean;
};

export type RTDInvoiceRecord = {
  id: string;
  invoiceNo?: string;
  invoiceHeading?: string;
  invoiceDate?: string;
  dueDate?: string;
  client?: string;
  clientAddress?: string;
  additionalInfo?: string;
  projectOwner?: string;
  subjectPurpose?: string;
  poNumber?: string;
  paymentTerm?: string;
  salesTaxId?: string;
  salesTaxName?: string;
  salesTaxPercent?: number;
  services?: SavedServiceRow[];
  subtotal?: number;
  salesTaxAmount?: number;
  total?: number;
  footerText?: string;
  termsConditionId?: string;
  termsConditionTitle?: string;
  termsConditionText?: string;
  sourceEstimateId?: string;
  sourceEstimateNo?: string;
  rtdRecordIds?: string[];
  status?: string;
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

const getInvoiceStatusPillClass = (status: string) => {
  switch (String(status || "").toLowerCase()) {
    case "paid":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "partially paid":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-red-200 bg-red-50 text-red-700";
  }
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

export default function RTDInvoice({
  initialEstimate = null,
  onInvoiceSaved,
}: Props) {
  const [invoices, setInvoices] = useState<RTDInvoiceRecord[]>([]);
  const [salesTaxes, setSalesTaxes] = useState<TaxOption[]>([]);
  const [termsConditions, setTermsConditions] = useState<TermsConditionDoc[]>(
    [],
  );
  const [paymentTerms, setPaymentTerms] = useState<string[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [servicesList, setServicesList] = useState<
    { id: string; name: string; description?: string }[]
  >([]);

  const [editId, setEditId] = useState<string | null>(null);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [sharedCounterCurrent, setSharedCounterCurrent] = useState(0);

  const [invoiceHeading, setInvoiceHeading] = useState(INVOICE_HEADINGS[0]);
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [dueDate, setDueDate] = useState("");
  const [client, setClient] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [projectOwner, setProjectOwner] = useState("");
  const [subjectPurpose, setSubjectPurpose] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [paymentTerm, setPaymentTerm] = useState("");
  const [selectedSalesTaxId, setSelectedSalesTaxId] = useState("");
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [footerText, setFooterText] = useState("");
  const [selectedTermsId, setSelectedTermsId] = useState("");
  const [termsConditionTitle, setTermsConditionTitle] = useState("");
  const [termsConditionText, setTermsConditionText] = useState("");

  const [sourceEstimateId, setSourceEstimateId] = useState("");
  const [sourceEstimateNo, setSourceEstimateNo] = useState("");
  const [sourceRtdRecordIds, setSourceRtdRecordIds] = useState<string[]>([]);

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
  const [lastSavedInvoiceNo, setLastSavedInvoiceNo] = useState("");

  const [listPreviewURL, setListPreviewURL] = useState<string | null>(null);
  const [isListDrawerOpen, setIsListDrawerOpen] = useState(false);
  const [selectedListInvoice, setSelectedListInvoice] =
    useState<RTDInvoiceRecord | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const [downloadLoadingId, setDownloadLoadingId] = useState<string | null>(
    null,
  );
  const [paymentInvoice, setPaymentInvoice] = useState<RTDInvoiceRecord | null>(
    null,
  );

  const loadedEstimateIdRef = useRef("");
  const addressPrefilledRef = useRef(false);

  const fieldClass =
    "w-full rounded-lg border border-gray-300 p-2 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  const invalidFieldClass =
    "border-red-400 ring-2 ring-red-100 focus:ring-red-200 focus:border-red-400";

  const withValidity = (base: string, invalid: boolean) =>
    invalid && attemptedSubmit ? `${base} ${invalidFieldClass}` : base;

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "Panels", PANEL_ID, "rtdInvoices"),
      (snapshot) => {
        const list = snapshot.docs.map((document) => ({
          id: document.id,
          ...(document.data() as Omit<RTDInvoiceRecord, "id">),
        }));

        list.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
        setInvoices(list);
      },
      (loadError) => {
        console.error("Failed to load RTD invoices:", loadError);
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

  // ✅ shared with the main Sales Tax Invoice feature, purely to preview the next number
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(
        db,
        "Panels",
        PANEL_ID,
        "counters",
        "estimateInvoices",
        "companies",
        "iedge_sales",
      ),
      (snap) => {
        const current = snap.exists() ? toNumber(snap.data()?.current) : 0;
        setSharedCounterCurrent(current);
      },
      (loadError) => {
        console.error("Failed to load invoice counter:", loadError);
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

  const nextInvoiceNo = `S-${String(sharedCounterCurrent + 1).padStart(6, "0")}`;

  const selectedSalesTax = useMemo(
    () => salesTaxes.find((tax) => tax.id === selectedSalesTaxId) || null,
    [salesTaxes, selectedSalesTaxId],
  );

  // ✅ prefill the form from an Estimate handed over via "Create Invoice"
  useEffect(() => {
    if (!initialEstimate) return;
    if (loadedEstimateIdRef.current === initialEstimate.id) return;
    loadedEstimateIdRef.current = initialEstimate.id;
    addressPrefilledRef.current = false;

    setEditId(null);
    setInvoiceNo("");
    setInvoiceHeading(INVOICE_HEADINGS[0]);
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setDueDate("");
    setClient(initialEstimate.client || "");
    setClientAddress("");
    setAdditionalInfo("");
    setProjectOwner(initialEstimate.projectOwner || "");
    setSubjectPurpose(initialEstimate.subjectPurpose || "");
    setPoNumber(initialEstimate.poNumber || "");
    setPaymentTerm(initialEstimate.paymentTerm || "");
    setSelectedSalesTaxId(initialEstimate.salesTaxId || "");
    setFooterText(initialEstimate.footerText || "");
    setSelectedTermsId(initialEstimate.termsConditionId || "");
    setTermsConditionTitle(initialEstimate.termsConditionTitle || "");
    setTermsConditionText(initialEstimate.termsConditionText || "");

    setSourceEstimateId(initialEstimate.id);
    setSourceEstimateNo(initialEstimate.estimateNo || "");
    setSourceRtdRecordIds(
      Array.isArray(initialEstimate.rtdRecordIds) &&
        initialEstimate.rtdRecordIds.length > 0
        ? initialEstimate.rtdRecordIds
        : initialEstimate.rtdRecordId
          ? [initialEstimate.rtdRecordId]
          : [],
    );

    const savedServices = Array.isArray(initialEstimate.services)
      ? initialEstimate.services
      : [];

    setServices(
      savedServices.map((service) => ({
        rowId: makeRowId(),
        serviceName: service.serviceName || "",
        description: service.description || "",
        unit: String(service.unit ?? ""),
        unitCost: String(service.unitCost ?? ""),
        isHeadingOnly: Boolean(service.isHeadingOnly),
      })),
    );

    setAttemptedSubmit(false);
    setError("");
    setMessage("");

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [initialEstimate]);

  // ✅ fill Client Address / Additional Info from the clients directory once, on load
  useEffect(() => {
    if (!initialEstimate) return;
    if (addressPrefilledRef.current) return;
    if (!clients.length) return;

    const match = clients.find(
      (item) =>
        normalizeClient(item.name) === normalizeClient(initialEstimate.client),
    );

    if (match) {
      setClientAddress(
        uniqueStrings([
          match.address,
          match.city,
          match.zipCode,
          match.country,
        ]).join(", "),
      );
      setAdditionalInfo(match.addtionalInfo || "");
    }

    addressPrefilledRef.current = true;
  }, [clients, initialEstimate]);

  const updateService = (
    rowId: string,
    field: "serviceName" | "description" | "unit" | "unitCost",
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
        serviceName: "",
        description: "",
        unit: "1",
        unitCost: "",
        isHeadingOnly: true,
      },
    ]);
  };

  const handleRemoveRow = (rowId: string) => {
    setServices((previous) =>
      previous.filter((service) => service.rowId !== rowId),
    );
  };

  const calculatedServices = useMemo(
    () =>
      services.map((service) => {
        const units = Math.max(toNumber(service.unit), 0);
        const unitCost = toNumber(service.unitCost);
        const amount = service.isHeadingOnly ? 0 : units * unitCost;

        return { ...service, units, unitCost, amount };
      }),
    [services],
  );

  const subtotal = useMemo(
    () => calculatedServices.reduce((sum, service) => sum + service.amount, 0),
    [calculatedServices],
  );

  const salesTaxRate = toNumber(selectedSalesTax?.percent) / 100;
  const salesTaxAmount = subtotal * salesTaxRate;
  const total = subtotal + salesTaxAmount;

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

  const buildRtdInvoiceForPdf = (args: {
    invoiceNo: string;
    invoiceHeading: string;
    invoiceDate: string;
    dueDate: string;
    client: string;
    clientAddress: string;
    additionalInfo: string;
    projectOwner: string;
    subjectPurpose: string;
    poNumber: string;
    paymentTerm: string;
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
    termsConditionTitle: string;
    termsConditionText: string;
    createdBy: string;
  }) => {
    const heading = String(
      args.invoiceHeading || INVOICE_HEADINGS[0],
    ).toUpperCase();

    return {
      estimateNo: args.invoiceNo,
      documentTitle: heading,
      documentNumberLabel: heading,
      dateLabel: "Invoice Date",
      expiryLabel: "Due Date",
      client: args.client,
      info: args.additionalInfo,
      address: args.clientAddress,
      date: args.invoiceDate,
      expiryDate: args.dueDate,
      projectOwner: args.projectOwner,
      paymentTerm: args.paymentTerm,
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
      company: "iEDGE",
      taxType: "exclusive",
      taxPercent: args.taxPercent,
      message: args.footerText,
      termsConditionTitle: args.termsConditionTitle,
      termsConditionText: args.termsConditionText,
      createdBy: args.createdBy,
    };
  };

  const buildPdfBlobForInvoice = async (invoice: RTDInvoiceRecord) => {
    const savedServices = Array.isArray(invoice.services)
      ? invoice.services
      : [];

    const pdfInvoice = buildRtdInvoiceForPdf({
      invoiceNo: invoice.invoiceNo || "",
      invoiceHeading: invoice.invoiceHeading || INVOICE_HEADINGS[0],
      invoiceDate: invoice.invoiceDate || "",
      dueDate: invoice.dueDate || "",
      client: invoice.client || "",
      clientAddress: invoice.clientAddress || "",
      additionalInfo: invoice.additionalInfo || "",
      projectOwner: invoice.projectOwner || "",
      subjectPurpose: invoice.subjectPurpose || "",
      poNumber: invoice.poNumber || "",
      paymentTerm: invoice.paymentTerm || "",
      services: savedServices.map((service) => ({
        serviceName: service.serviceName || "",
        description: service.description || "",
        unit: toNumber(service.unit),
        unitCost: toNumber(service.unitCost),
        showFinancialsInPdf: !service.isHeadingOnly,
      })),
      subtotal: toNumber(invoice.subtotal),
      taxAmount: toNumber(invoice.salesTaxAmount),
      total: toNumber(invoice.total),
      taxPercent: toNumber(invoice.salesTaxPercent),
      taxLabel: invoice.salesTaxName || "",
      footerText: invoice.footerText || "",
      termsConditionTitle: invoice.termsConditionTitle || "",
      termsConditionText: invoice.termsConditionText || "",
      createdBy: "",
    });

    return buildEstimatePdfBlob({
      estimate: pdfInvoice as unknown as Estimate,
      companyList: COMPANY_LIST,
      withLogo: true,
      footerUser: loggedInUser,
      companyName: "iEDGE",
    });
  };

  const handlePreviewInvoice = async (invoice: RTDInvoiceRecord) => {
    try {
      setPreviewLoadingId(invoice.id);

      const blob = await buildPdfBlobForInvoice(invoice);

      setSelectedListInvoice(invoice);
      setListPreviewURL(URL.createObjectURL(blob));
      setIsListDrawerOpen(true);
    } catch (previewError) {
      console.error("Failed to build RTD Invoice preview:", previewError);
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const handleDownloadInvoice = async (invoice: RTDInvoiceRecord) => {
    try {
      setDownloadLoadingId(invoice.id);

      const blob = await buildPdfBlobForInvoice(invoice);

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${invoice.invoiceNo || "rtd-invoice"}.pdf`;
      link.click();
    } catch (downloadError) {
      console.error("Failed to download RTD Invoice:", downloadError);
    } finally {
      setDownloadLoadingId(null);
    }
  };

  const resetForm = () => {
    setEditId(null);
    setInvoiceNo("");
    setInvoiceHeading(INVOICE_HEADINGS[0]);
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setDueDate("");
    setClient("");
    setClientAddress("");
    setAdditionalInfo("");
    setProjectOwner("");
    setSubjectPurpose("");
    setPoNumber("");
    setPaymentTerm("");
    setSelectedSalesTaxId("");
    setServices([]);
    setFooterText("");
    setSelectedTermsId("");
    setTermsConditionTitle("");
    setTermsConditionText("");
    setSourceEstimateId("");
    setSourceEstimateNo("");
    setSourceRtdRecordIds([]);
    setAttemptedSubmit(false);
    loadedEstimateIdRef.current = "";
    addressPrefilledRef.current = false;
  };

  const handleEditInvoice = (invoice: RTDInvoiceRecord) => {
    setEditId(invoice.id);
    setInvoiceNo(invoice.invoiceNo || "");
    setInvoiceHeading(invoice.invoiceHeading || INVOICE_HEADINGS[0]);
    setInvoiceDate(
      invoice.invoiceDate || new Date().toISOString().slice(0, 10),
    );
    setDueDate(invoice.dueDate || "");
    setClient(invoice.client || "");
    setClientAddress(invoice.clientAddress || "");
    setAdditionalInfo(invoice.additionalInfo || "");
    setProjectOwner(invoice.projectOwner || "");
    setSubjectPurpose(invoice.subjectPurpose || "");
    setPoNumber(invoice.poNumber || "");
    setPaymentTerm(invoice.paymentTerm || "");
    setSelectedSalesTaxId(invoice.salesTaxId || "");
    setFooterText(invoice.footerText || "");
    setSelectedTermsId(invoice.termsConditionId || "");
    setTermsConditionTitle(invoice.termsConditionTitle || "");
    setTermsConditionText(invoice.termsConditionText || "");
    setSourceEstimateId(invoice.sourceEstimateId || "");
    setSourceEstimateNo(invoice.sourceEstimateNo || "");
    setSourceRtdRecordIds(invoice.rtdRecordIds || []);

    const savedServices = Array.isArray(invoice.services)
      ? invoice.services
      : [];

    setServices(
      savedServices.map((service) => ({
        rowId: makeRowId(),
        serviceName: service.serviceName || "",
        description: service.description || "",
        unit: String(service.unit ?? ""),
        unitCost: String(service.unitCost ?? ""),
        isHeadingOnly: Boolean(service.isHeadingOnly),
      })),
    );

    loadedEstimateIdRef.current = `__edit__${invoice.id}`;
    addressPrefilledRef.current = true;
    setAttemptedSubmit(false);
    setError("");
    setMessage("");

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const validate = () => {
    if (!invoiceDate) return "Invoice Date is required.";
    if (!client.trim()) return "Client is required.";
    if (!subjectPurpose.trim()) return "Subject / Purpose is required.";
    if (!projectOwner.trim()) return "Project Owner is required.";
    if (!paymentTerm.trim()) return "Payment Terms is required.";
    if (!selectedSalesTaxId) return "Sales Tax is required.";
    if (!selectedTermsId) return "Terms & Conditions is required.";
    if (!termsConditionText.trim())
      return "Terms & Conditions text is required.";
    if (subtotal <= 0)
      return "Add at least one service with a Unit and Unit Cost greater than zero.";

    const invalidService = calculatedServices.find((service) => {
      if (!service.serviceName.trim()) return true;
      if (service.isHeadingOnly) return false;
      return service.units <= 0 || service.unitCost <= 0;
    });

    if (invalidService) {
      return "Each service requires a Service Name (and a Unit and Unit Cost greater than zero, unless calculations are hidden).";
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

      const savedServices: SavedServiceRow[] = calculatedServices.map(
        (service) => ({
          rtdRecordId: "",
          serviceName: service.serviceName.trim(),
          description: service.description.trim(),
          unit: service.units,
          sourceAmount: 0,
          sourceUnitCost: service.unitCost,
          unitCost: service.unitCost,
          amount: service.amount,
          isHeadingOnly: service.isHeadingOnly,
        }),
      );

      const invoicePayload = {
        invoiceHeading,
        invoiceDate,
        dueDate,
        client: client.trim(),
        clientAddress: clientAddress.trim(),
        additionalInfo: additionalInfo.trim(),
        projectOwner: projectOwner.trim(),
        subjectPurpose: subjectPurpose.trim(),
        poNumber: poNumber.trim(),
        paymentTerm: paymentTerm.trim(),
        salesTaxId: selectedSalesTax?.id || "",
        salesTaxName: selectedSalesTax?.name || "",
        salesTaxPercent: selectedSalesTax?.percent || 0,
        services: savedServices,
        subtotal,
        salesTaxAmount,
        total,
        footerText: footerText.trim(),
        termsConditionId: selectedTermsId,
        termsConditionTitle,
        termsConditionText,
        sourceEstimateId,
        sourceEstimateNo,
        rtdRecordIds: sourceRtdRecordIds,
      };

      let savedInvoiceNo = "";

      if (editId) {
        savedInvoiceNo = invoiceNo;

        await updateDoc(doc(db, "Panels", PANEL_ID, "rtdInvoices", editId), {
          ...invoicePayload,
          invoiceNo,
          lastEditedById: currentUser?.uid || "",
          lastEditedByName: currentUserName,
          lastEditedByEmail: currentUserEmail,
          lastEditedAt: serverTimestamp(),
          editCount: increment(1),
          updatedAt: serverTimestamp(),
        });
      } else {
        const invoiceRef = doc(
          collection(db, "Panels", PANEL_ID, "rtdInvoices"),
        );
        const counterRef = doc(
          db,
          "Panels",
          PANEL_ID,
          "counters",
          "estimateInvoices",
          "companies",
          "iedge_sales",
        );

        await runTransaction(db, async (transaction) => {
          const counterSnap = await transaction.get(counterRef);
          const current = Number(
            counterSnap.exists() ? counterSnap.data()?.current : 0,
          );
          const nextNumber = current + 1;
          const generatedInvoiceNo = `S-${String(nextNumber).padStart(6, "0")}`;
          savedInvoiceNo = generatedInvoiceNo;

          transaction.set(counterRef, { current: nextNumber }, { merge: true });

          transaction.set(invoiceRef, {
            ...invoicePayload,
            invoiceNo: generatedInvoiceNo,
            status: "Unpaid",
            createdBy: currentUser?.uid || "",
            createdByEmail: currentUser?.email || "",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          if (sourceEstimateId) {
            transaction.update(
              doc(db, "Panels", PANEL_ID, "rtdEstimates", sourceEstimateId),
              {
                invoiceId: invoiceRef.id,
                invoiceNo: generatedInvoiceNo,
                updatedAt: serverTimestamp(),
              },
            );
          }

          sourceRtdRecordIds.forEach((recordId) => {
            transaction.update(
              doc(db, "Panels", PANEL_ID, "rtdRecords", recordId),
              {
                invoiceId: invoiceRef.id,
                invoiceNo: generatedInvoiceNo,
                updatedAt: serverTimestamp(),
              },
            );
          });
        });
      }

      try {
        const pdfInvoice = buildRtdInvoiceForPdf({
          invoiceNo: savedInvoiceNo,
          invoiceHeading,
          invoiceDate,
          dueDate,
          client,
          clientAddress,
          additionalInfo,
          projectOwner,
          subjectPurpose,
          poNumber,
          paymentTerm,
          services: calculatedServices.map((service) => ({
            serviceName: service.serviceName,
            description: service.description,
            unit: service.units,
            unitCost: service.unitCost,
            showFinancialsInPdf: !service.isHeadingOnly,
          })),
          subtotal,
          taxAmount: salesTaxAmount,
          total,
          taxPercent: selectedSalesTax?.percent || 0,
          taxLabel: selectedSalesTax?.name || "",
          footerText,
          termsConditionTitle,
          termsConditionText,
          createdBy: currentUser?.uid || "",
        });

        const blob = await buildEstimatePdfBlob({
          estimate: pdfInvoice as unknown as Estimate,
          companyList: COMPANY_LIST,
          withLogo: true,
          footerUser: loggedInUser,
          companyName: "iEDGE",
        });

        setPreviewURL(URL.createObjectURL(blob));
        setIsPreviewOpen(true);
        setLastSavedInvoiceNo(savedInvoiceNo);
      } catch (pdfError) {
        console.error("Failed to build RTD Invoice PDF:", pdfError);
      }

      resetForm();
      onInvoiceSaved?.();

      setMessage(
        wasEditing
          ? `RTD Invoice ${savedInvoiceNo} updated.`
          : `RTD Invoice ${savedInvoiceNo} saved.`,
      );
    } catch (saveError) {
      console.error("Failed to save RTD Invoice:", saveError);
      setError("Failed to save RTD Invoice.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-[-0.04em] text-gray-950">
          RTD Invoice
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Create Sales Tax Invoices, Performa Invoices, or plain Invoices —
          either from scratch or from an RTD Estimate via "Create Invoice".
        </p>
      </div>

      {editId ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <span>
            Editing RTD Invoice <strong>{invoiceNo}</strong>.
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
      ) : sourceEstimateNo ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <span>
            Creating this Invoice from RTD Estimate{" "}
            <strong>{sourceEstimateNo}</strong>. Every field below is editable.
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
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Invoice Type">
              <select
                className={fieldClass}
                value={invoiceHeading}
                onChange={(event) => setInvoiceHeading(event.target.value)}
              >
                {INVOICE_HEADINGS.map((heading) => (
                  <option key={heading} value={heading}>
                    {heading}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Invoice No">
              <input
                readOnly
                className={`${fieldClass} cursor-default bg-gray-50 font-semibold`}
                value={invoiceNo || nextInvoiceNo}
                title={
                  invoiceNo
                    ? "This Invoice's number"
                    : "Generated automatically when the Invoice is saved"
                }
              />
            </Field>

            <Field label="Invoice Date">
              <input
                type="date"
                className={withValidity(fieldClass, !invoiceDate)}
                value={invoiceDate}
                onChange={(event) => setInvoiceDate(event.target.value)}
              />
            </Field>

            <Field label="Due Date (optional)">
              <input
                type="date"
                className={fieldClass}
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </Field>

            <Field label="Client">
              <input
                className={withValidity(fieldClass, !client.trim())}
                value={client}
                onChange={(event) => setClient(event.target.value)}
                placeholder="Client name"
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

            <Field label="Client Address">
              <input
                className={fieldClass}
                value={clientAddress}
                onChange={(event) => setClientAddress(event.target.value)}
                placeholder="Client address"
              />
            </Field>

            <Field label="Additional Info">
              <input
                className={fieldClass}
                value={additionalInfo}
                onChange={(event) => setAdditionalInfo(event.target.value)}
                placeholder="Additional client info"
              />
            </Field>

            <Field label="Project Owner">
              <input
                className={withValidity(fieldClass, !projectOwner.trim())}
                value={projectOwner}
                onChange={(event) => setProjectOwner(event.target.value)}
                placeholder="Requester name"
              />
            </Field>

            <div className="md:col-span-2 xl:col-span-1">
              <Field label="Subject / Purpose">
                <input
                  className={withValidity(fieldClass, !subjectPurpose.trim())}
                  value={subjectPurpose}
                  onChange={(event) => setSubjectPurpose(event.target.value)}
                  placeholder="Enter invoice subject or purpose"
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

          {sourceEstimateNo ? (
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              <InfoBox label="Source RTD Estimate" value={sourceEstimateNo} />
              <InfoBox
                label="Linked RTD Records"
                value={String(sourceRtdRecordIds.length)}
              />
            </div>
          ) : null}
        </div>

        <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
          <Field label="Sales Tax">
            <select
              className={withValidity(
                `md:max-w-xs ${fieldClass}`,
                !selectedSalesTaxId,
              )}
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
        </div>

        <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
          <div>
            <h2 className="text-sm font-semibold text-gray-700">
              Service Detail
            </h2>
            <p className="text-sm text-gray-500">
              Enter each line item directly. Tick "Cals" to show and require a
              Unit and Unit Cost for a row — leave it off for a description-only
              line.
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
                  const isHeading = service.isHeadingOnly;

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
                        <RichTextEditor
                          className={fieldClass}
                          minHeight={40}
                          value={service.description}
                          onChange={(html) =>
                            updateService(service.rowId, "description", html)
                          }
                          placeholder="Description"
                          data-testid={`textarea-service-description-${service.rowId}`}
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
                        ) : (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className={withValidity(
                              `${fieldClass} text-right`,
                              service.unitCost <= 0,
                            )}
                            value={service.unitCost}
                            onChange={(event) =>
                              updateService(
                                service.rowId,
                                "unitCost",
                                event.target.value,
                              )
                            }
                            placeholder="0.00"
                          />
                        )}
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {isHeading ? "—" : `Rs. ${formatMoney(service.amount)}`}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <label
                            className="flex items-center gap-1 text-[10px] font-medium text-gray-500"
                            title="Show calculations"
                          >
                            <input
                              type="checkbox"
                              checked={!service.isHeadingOnly}
                              onChange={() => toggleHeadingOnly(service.rowId)}
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
                      Add a row below.
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
                  Customer-facing invoice totals.
                </p>
              </div>
            </div>

            <SummaryRow label="Subtotal" amount={subtotal} />
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
                Rs. {formatMoney(total)}
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
            <div className="mb-5">
              <h2 className="text-sm font-semibold text-gray-700">
                Tax Summary
              </h2>
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
            {saving ? "Saving..." : editId ? "Update Invoice" : "Save Invoice"}
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-700">
            RTD Invoice List
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1550px] text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-5 py-4 text-left">Invoice</th>
                <th className="px-5 py-4 text-left">Type</th>
                <th className="px-5 py-4 text-left">Subject / Purpose</th>
                <th className="px-5 py-4 text-left">Client</th>
                <th className="px-5 py-4 text-left">Estimate Ref</th>
                <th className="px-5 py-4 text-right">Total</th>
                <th className="px-5 py-4 text-left">PO</th>
                <th className="px-5 py-4 text-center">Days</th>
                <th className="px-5 py-4 text-left">Status</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {invoices.map((invoice) => {
                const poNumber = String(invoice.poNumber || "").trim();
                const noPo = !poNumber;
                const daysSinceCreated = getDaysSince(invoice.createdAt);
                const status = invoice.status || "Unpaid";
                const overdueUnpaid =
                  daysSinceCreated !== null &&
                  daysSinceCreated >= 30 &&
                  status.toLowerCase() !== "paid";
                const flagged = noPo || overdueUnpaid;

                return (
                  <tr
                    key={invoice.id}
                    className={
                      flagged
                        ? "bg-red-50/70 hover:bg-red-100"
                        : "hover:bg-gray-50"
                    }
                  >
                    <td className="px-5 py-4 font-bold">
                      {invoice.invoiceNo || "-"}
                    </td>
                    <td className="px-5 py-4">
                      {invoice.invoiceHeading || "-"}
                    </td>
                    <td className="px-5 py-4">
                      {invoice.subjectPurpose || "-"}
                    </td>
                    <td className="px-5 py-4">{invoice.client || "-"}</td>
                    <td className="px-5 py-4">
                      {invoice.sourceEstimateNo || "-"}
                    </td>
                    <td className="px-5 py-4 text-right font-bold">
                      Rs. {formatMoney(invoice.total)}
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
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getInvoiceStatusPillClass(status)}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPaymentInvoice(invoice)}
                          className="rounded-lg p-2 text-gray-500 hover:bg-emerald-50 hover:text-emerald-700"
                          title="Receive Payment"
                        >
                          <Wallet className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditInvoice(invoice)}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePreviewInvoice(invoice)}
                          disabled={previewLoadingId === invoice.id}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                          title="Preview"
                        >
                          {previewLoadingId === invoice.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadInvoice(invoice)}
                          disabled={downloadLoadingId === invoice.id}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                          title="Download"
                        >
                          {downloadLoadingId === invoice.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {invoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    No RTD Invoices found.
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
                  link.download = `${lastSavedInvoiceNo || "rtd-invoice"}.pdf`;
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
                  RTD Invoice Preview
                </h2>
                <p className="text-sm text-slate-500">
                  {selectedListInvoice?.invoiceNo || "Invoice document"}
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
                  if (!selectedListInvoice) return;
                  setIsListDrawerOpen(false);
                  handleEditInvoice(selectedListInvoice);
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
                  link.download = `${selectedListInvoice?.invoiceNo || "rtd-invoice"}.pdf`;
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

      {paymentInvoice ? (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          }
        >
          <ReceivePaymentModal
            invoice={paymentInvoice}
            invoiceCollection="rtdInvoices"
            onClose={() => setPaymentInvoice(null)}
          />
        </Suspense>
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
