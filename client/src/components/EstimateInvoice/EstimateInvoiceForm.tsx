// "use client";

// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { auth, db } from "@/lib/firebase";
// import {
//   collection,
//   doc,
//   getDocs,
//   query,
//   runTransaction,
//   serverTimestamp,
//   updateDoc,
//   where,
//   onSnapshot,
// } from "firebase/firestore";
// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { buildEstimateInvoicePdfBlob } from "@/lib/estimateInvoicePdf";

// type ServiceItem = {
//   detail: string;
//   description?: string;
//   units: number;
//   rate: number | string;
//   rateMode?: "amount" | "percent";
//   taxLabel?: string;
//   taxPercent?: number;
//   whtLabel?: string;
//   whtPercent?: number;
// };

// const defaultRow: ServiceItem = {
//   detail: "",
//   description: "",
//   units: 0,
//   rate: "",
//   rateMode: "amount",
//   taxLabel: "SST",
//   taxPercent: 0,
//   whtLabel: "WHT",
//   whtPercent: 0,
// };

// const PANEL_ID = "IEDGE-SYSTEM";

// export type EstimateInvoice = any;

// type Props = {
//   existingInvoice?: EstimateInvoice;
//   duplicateMode?: boolean;
// };

// type Totals = {
//   subtotal: number;
//   tax: number;
//   whtTotal: number;
//   total: number;
// };

// export default function EstimateInvoiceForm({
//   existingInvoice,
//   duplicateMode = false,
// }: Props) {
//   const [editId, setEditId] = useState<string | null>(null);

//   const [estimateNoInput, setEstimateNoInput] = useState("");

//   const [previewURL, setPreviewURL] = useState<string | null>(null);
//   const [isPreviewOpen, setIsPreviewOpen] = useState(false);

//   const [loggedInUser, setLoggedInUser] = useState<any>(null);

//   const [invoiceNo, setInvoiceNo] = useState("");
//   const [invoiceDate, setInvoiceDate] = useState("");
//   const [dueDate, setDueDate] = useState("");

//   const [company, setCompany] = useState<string>("");
//   const [withLogo, setWithLogo] = useState<boolean>(true);

//   const [client, setClient] = useState("");
//   const [info, setInfo] = useState("");
//   const [address, setAddress] = useState("");
//   const [projectOwner, setProjectOwner] = useState("");
//   const [subject, setSubject] = useState("");

//   const [poNumber, setPoNumber] = useState("");

//   const [previousEstimateTotal, setPreviousEstimateTotal] = useState<
//     number | null
//   >(null);

//   const [paymentTerm, setPaymentTerm] = useState("");
//   const [taxType, setTaxType] = useState<"none" | "exclusive" | "inclusive">(
//     "exclusive",
//   );

//   const [services, setServices] = useState<ServiceItem[]>([{ ...defaultRow }]);

//   const INVOICE_HEADINGS = ["Sales Tax Invoice", "Performa Invoice", "Invoice"];

//   const [invoiceHeading, setInvoiceHeading] =
//     useState<string>("Sales Tax Invoice");

//   const [selectedPercentage, setSelectedPercentage] = useState<string>("100");

//   const [message, setMessage] = useState("");
//   const [termsConditionTitle, setTermsConditionTitle] = useState("");
//   const [termsConditionText, setTermsConditionText] = useState("");

//   const [subtotal, setSubtotal] = useState<number>(0);
//   const [tax, setTax] = useState<number>(0);
//   const [whtTotal, setWhtTotal] = useState<number>(0);
//   const [total, setTotal] = useState<number>(0);

//   const [status, setStatus] = useState<string>("Unpaid");
//   const [loading, setLoading] = useState(false);
//   const savingRef = useRef(false);
//   const [preferDbTotals, setPreferDbTotals] = useState(false);

//   const companyList = [
//     { name: "iEDGE", logo: "/Iedge-TM-Logos-01.png" },
//     {
//       name: "iEDGE - Digital & Creative",
//       logo: "/Iedge-Digital-and-Creative-TM-Logos-12.png",
//     },
//     { name: "iEDGE - Events & Activations", logo: "/iedge-events-logo.png" },
//     {
//       name: "iEDGE - Health Sciences",
//       logo: "/Iedge-Health-Sciences-TM-Logos-05.png",
//     },
//     { name: "iEDGE - International Education", logo: "/iedge-edu-logo.png" },
//     { name: "iEDGE - Trading", logo: "/Iedge-Trade-TM-Logos-10.png" },
//     { name: "iEDGE - Travel & Tours", logo: "/iedge-travel-logo.png" },
//     { name: "Catapult", logo: "/Catapult-TM-Logos-03.png" },
//     { name: "iConsultant", logo: "/Consultant-TM-Logos-02.png" },
//     { name: "Let's Save Green", logo: "/Lets-save-Green-TM-Logos-04.png" },
//     { name: "Emaan Biz", logo: "/Emaan-Biz-TM-Logos-06.png" },
//   ];

//   const companyInvoiceConfig: Record<string, { prefix: string; key: string }> =
//     {
//       iEDGE: { prefix: "S", key: "iedge_sales" },
//       "iEDGE - Digital & Creative": { prefix: "S", key: "iedge_sales" },
//       "iEDGE - Events & Activations": { prefix: "S", key: "iedge_sales" },

//       "iEDGE - Health Sciences": { prefix: "IHS", key: "iedge_health" },
//       "iEDGE - International Education": {
//         prefix: "IIE",
//         key: "iedge_edu",
//       },
//       "iEDGE - Trading": { prefix: "ITR", key: "iedge_trade" },
//       "iEDGE - Travel & Tours": { prefix: "S-T", key: "iedge_travel" },

//       Catapult: { prefix: "CAT", key: "catapult" },
//       iConsultant: { prefix: "IC", key: "iconsultant" },
//       "Let's Save Green": { prefix: "LSG", key: "lsg" },
//       "Emaan Biz": { prefix: "EB", key: "emaanbiz" },
//     };

//   const estimatesRef = useMemo(
//     () => collection(db, "Panels", PANEL_ID, "estimates"),
//     [],
//   );

//   const invoicesRef = useMemo(
//     () => collection(db, "Panels", PANEL_ID, "estimateInvoices"),
//     [],
//   );

//   useEffect(() => {
//     const uid = auth.currentUser?.uid;
//     if (!uid) return;

//     const userRef = doc(db, "Panels", PANEL_ID, "users", uid);
//     const unsub = onSnapshot(userRef, (snap) => {
//       setLoggedInUser(snap.exists() ? snap.data() : null);
//     });

//     return () => unsub();
//   }, []);

//   const normalizePercentage = (value: string | number) => {
//     const n = Number(value);
//     if (!Number.isFinite(n)) return 100;
//     if (n < 0) return 0;
//     if (n > 100) return 100;
//     return Number(n.toFixed(2));
//   };

//   const computeSelectedPercentageTotals = (
//     actual: { subtotal: number; tax: number; total: number },
//     percentageValue: string | number,
//   ) => {
//     const pct = normalizePercentage(percentageValue);
//     const factor = pct / 100;

//     return {
//       selectedPercentage: pct,
//       selectedPercentageSubtotal: Number((actual.subtotal * factor).toFixed(2)),
//       selectedPercentageTax: Number((actual.tax * factor).toFixed(2)),
//       selectedPercentageTotal: Number((actual.total * factor).toFixed(2)),
//     };
//   };

//   const computeTotals = (
//     nextServices: ServiceItem[],
//     nextTaxType: "none" | "exclusive" | "inclusive",
//   ): Totals => {
//     const calcBaseInner = (s: ServiceItem) => {
//       const units = Number(s.units || 0);
//       const rateNum = Number(String(s.rate ?? 0).replace(/,/g, "")) || 0;
//       const mode = (s.rateMode || "amount") as "amount" | "percent";
//       return mode === "percent" ? units * (rateNum / 100) : units * rateNum;
//     };

//     const baseSum = nextServices.reduce((sum, s) => sum + calcBaseInner(s), 0);

//     let taxSum = 0;
//     if (nextTaxType !== "none") {
//       for (const s of nextServices) {
//         const pct = Number(s.taxPercent ?? 0);
//         if (!pct) continue;

//         const base = calcBaseInner(s);
//         if (nextTaxType === "exclusive") taxSum += (base * pct) / 100;
//         else taxSum += (base * pct) / (100 + pct);
//       }
//     }

//     const lineTotalForWht = (s: ServiceItem) => {
//       const base = calcBaseInner(s);
//       const pct = Number(s.taxPercent ?? 0);

//       if (!pct || nextTaxType === "none") return base;
//       if (nextTaxType === "inclusive") return base;
//       return base + (base * pct) / 100;
//     };

//     let whtSum = 0;
//     for (const s of nextServices) {
//       const pct = Number(s.whtPercent ?? 0);
//       if (!pct) continue;
//       const baseForWht = lineTotalForWht(s);
//       whtSum += (baseForWht * pct) / 100;
//     }

//     const computedSubtotal =
//       nextTaxType === "inclusive" ? baseSum - taxSum : baseSum;

//     const computedTotal =
//       computedSubtotal + (nextTaxType === "none" ? 0 : taxSum) + whtSum;

//     return {
//       subtotal: Number(computedSubtotal.toFixed(2)),
//       tax: Number(taxSum.toFixed(2)),
//       whtTotal: Number(whtSum.toFixed(2)),
//       total: Number(computedTotal.toFixed(2)),
//     };
//   };

//   const calcBase = (s: ServiceItem) => {
//     const units = Number(s.units || 0);
//     const rateNum = Number(String(s.rate ?? 0).replace(/,/g, "")) || 0;
//     const mode = (s.rateMode || "amount") as "amount" | "percent";
//     return mode === "percent" ? units * (rateNum / 100) : units * rateNum;
//   };

//   const recalcTotals = (nextServices = services, nextTaxType = taxType) => {
//     const baseSum = nextServices.reduce((sum, s) => sum + calcBase(s), 0);

//     let taxSum = 0;
//     if (nextTaxType !== "none") {
//       for (const s of nextServices) {
//         const pct = Number(s.taxPercent ?? 0);
//         if (!pct) continue;

//         const base = calcBase(s);
//         if (nextTaxType === "exclusive") {
//           taxSum += (base * pct) / 100;
//         } else {
//           taxSum += (base * pct) / (100 + pct);
//         }
//       }
//     }

//     const lineTotalForWht = (s: ServiceItem) => {
//       const base = calcBase(s);
//       const pct = Number(s.taxPercent ?? 0);

//       if (!pct || nextTaxType === "none") return base;
//       if (nextTaxType === "inclusive") return base;
//       return base + (base * pct) / 100;
//     };

//     let whtSum = 0;
//     for (const s of nextServices) {
//       const pct = Number(s.whtPercent ?? 0);
//       if (!pct) continue;
//       const baseForWht = lineTotalForWht(s);
//       whtSum += (baseForWht * pct) / 100;
//     }

//     const computedSubtotal =
//       nextTaxType === "inclusive" ? baseSum - taxSum : baseSum;

//     const computedTotal =
//       computedSubtotal + (nextTaxType === "none" ? 0 : taxSum) + whtSum;

//     setSubtotal(Number(computedSubtotal.toFixed(2)));
//     setTax(Number(taxSum.toFixed(2)));
//     setWhtTotal(Number(whtSum.toFixed(2)));
//     setTotal(Number(computedTotal.toFixed(2)));
//   };

//   useEffect(() => {
//     if (preferDbTotals) return;

//     const t = computeTotals(services, taxType);
//     setSubtotal(t.subtotal);
//     setTax(t.tax);
//     setWhtTotal(t.whtTotal);
//     setTotal(t.total);

//     if (previousEstimateTotal !== null) {
//       if (t.total > previousEstimateTotal) {
//         const ok = window.confirm(
//           `⚠ Warning:\n\nInvoice amount (${money(t.total)}) is GREATER than Estimate amount (${money(previousEstimateTotal)}).\n\nDo you want to continue?`,
//         );
//         if (!ok) {
//           savingRef.current = false;
//           setLoading(false);
//           return;
//         }
//       }

//       if (t.total < previousEstimateTotal) {
//         const ok = window.confirm(
//           `⚠ Warning:\n\nInvoice amount (${money(t.total)}) is LESS than Estimate amount (${money(previousEstimateTotal)}).\n\nDo you want to continue?`,
//         );
//         if (!ok) {
//           savingRef.current = false;
//           setLoading(false);
//           return;
//         }
//       }
//     }
//   }, [services, taxType, preferDbTotals, previousEstimateTotal]);

//   const money = (n: number) => {
//     const x = Number(n || 0);
//     const isWhole = Math.abs(x - Math.round(x)) < 1e-9;
//     return x.toLocaleString(undefined, {
//       minimumFractionDigits: isWhole ? 0 : 2,
//       maximumFractionDigits: 2,
//     });
//   };

//   const taxSummary = useMemo(() => {
//     const tType = String(taxType || "exclusive");
//     const taxMap = new Map<
//       string,
//       { label: string; pct: number; amount: number }
//     >();
//     const whtMap = new Map<
//       string,
//       { label: string; pct: number; amount: number }
//     >();

//     const calcTaxForLine = (base: number, pct: number) => {
//       if (!pct || tType === "none") return 0;
//       if (tType === "inclusive") return (base * pct) / (100 + pct);
//       return (base * pct) / 100;
//     };

//     const lineTotalForWht = (base: number, pct: number) => {
//       if (!pct || tType === "none") return base;
//       if (tType === "inclusive") return base;
//       return base + (base * pct) / 100;
//     };

//     for (const s of services) {
//       const base = calcBase(s);

//       const taxPct = Number(s.taxPercent ?? 0) || 0;
//       if (taxPct && tType !== "none") {
//         const lbl = String(s.taxLabel || "Tax").trim() || "Tax";
//         const taxAmt = calcTaxForLine(base, taxPct);

//         const key = `${lbl}__${taxPct}`;
//         const prev = taxMap.get(key);
//         if (prev) prev.amount += taxAmt;
//         else taxMap.set(key, { label: lbl, pct: taxPct, amount: taxAmt });
//       }

//       const whtPct = Number(s.whtPercent ?? 0) || 0;
//       if (whtPct) {
//         const lbl = String(s.whtLabel || "WHT").trim() || "WHT";
//         const baseForWht = lineTotalForWht(base, taxPct);
//         const whtAmt = (baseForWht * whtPct) / 100;

//         const key = `${lbl}__${whtPct}`;
//         const prev = whtMap.get(key);
//         if (prev) prev.amount += whtAmt;
//         else whtMap.set(key, { label: lbl, pct: whtPct, amount: whtAmt });
//       }
//     }

//     return {
//       taxRows: Array.from(taxMap.values()).sort((a, b) =>
//         a.label.localeCompare(b.label),
//       ),
//       whtRows: Array.from(whtMap.values()).sort((a, b) =>
//         a.label.localeCompare(b.label),
//       ),
//     };
//   }, [services, taxType]);

//   useEffect(() => {
//     if (existingInvoice) {
//       setInvoiceHeading(
//         (existingInvoice as any).invoiceHeading ?? "Estimate Invoice",
//       );
//     }
//   }, [existingInvoice]);

//   useEffect(() => {
//     if (!existingInvoice) {
//       setEditId(null);
//       setInvoiceNo("");
//       setEstimateNoInput("");

//       setInvoiceDate(new Date().toISOString().slice(0, 10));
//       setDueDate("");

//       setCompany("");
//       setWithLogo(true);

//       setClient("");
//       setInfo("");
//       setAddress("");
//       setProjectOwner("");
//       setSubject("");
//       setPoNumber("");

//       setPaymentTerm("");
//       setTaxType("exclusive");

//       setPreferDbTotals(false);
//       setSubtotal(0);
//       setTax(0);
//       setWhtTotal(0);
//       setTotal(0);

//       setServices([{ ...defaultRow }]);

//       setSelectedPercentage("100");
//       setMessage("");
//       setTermsConditionTitle("");
//       setTermsConditionText("");

//       setStatus("Unpaid");
//       return;
//     }

//     setEditId(duplicateMode ? null : (existingInvoice.id ?? null));

//     setInvoiceNo(duplicateMode ? "" : (existingInvoice.invoiceNo ?? ""));
//     setEstimateNoInput(
//       existingInvoice.sourceEstimateNo ?? existingInvoice.estimateNo ?? "",
//     );

//     setInvoiceDate(
//       duplicateMode
//         ? new Date().toISOString().slice(0, 10)
//         : (existingInvoice.invoiceDate ?? ""),
//     );
//     setDueDate(existingInvoice.dueDate ?? "");

//     setCompany(existingInvoice.company ?? "");
//     setWithLogo(Boolean(existingInvoice.withLogo ?? true));

//     setClient(existingInvoice.client ?? "");
//     setInfo(existingInvoice.info ?? "");
//     setAddress(existingInvoice.address ?? "");
//     setProjectOwner(existingInvoice.projectOwner ?? "");
//     setSubject(existingInvoice.subject ?? "");
//     setPoNumber(existingInvoice.poNumber ?? "");

//     setPaymentTerm(existingInvoice.paymentTerm ?? "");
//     setTaxType((existingInvoice.taxType ?? "exclusive") as any);

//     const nextServices =
//       Array.isArray(existingInvoice.services) &&
//       existingInvoice.services.length > 0
//         ? (existingInvoice.services as any)
//         : [{ ...defaultRow }];

//     setServices(nextServices);

//     setSelectedPercentage(String(existingInvoice.selectedPercentage ?? 100));
//     setMessage(existingInvoice.message ?? "");
//     setTermsConditionTitle(existingInvoice.termsConditionTitle ?? "");
//     setTermsConditionText(
//       existingInvoice.termsConditionText ??
//         existingInvoice.termsCondition ??
//         "",
//     );

//     setStatus(existingInvoice.status ?? "Unpaid");

//     if (!duplicateMode) {
//       setPreferDbTotals(true);
//       setSubtotal(Number(existingInvoice.subtotal ?? 0));
//       setTax(Number(existingInvoice.tax ?? 0));
//       setWhtTotal(Number(existingInvoice.whtTotal ?? 0));
//       setTotal(Number(existingInvoice.total ?? 0));
//     } else {
//       setPreferDbTotals(false);
//     }
//   }, [existingInvoice, duplicateMode]);

//   const loadEstimateAndPrefill = async () => {
//     setPreferDbTotals(false);
//     const estNo = estimateNoInput.trim();
//     if (!estNo) return alert("Please enter an Estimate No.");

//     setLoading(true);
//     try {
//       const qEst = query(estimatesRef, where("estimateNo", "==", estNo));
//       const estSnap = await getDocs(qEst);

//       if (estSnap.empty) {
//         alert(`No estimate found for: ${estNo}`);
//         return;
//       }

//       const estDoc = estSnap.docs[0];
//       const estData = estDoc.data() as any;

//       setPreviousEstimateTotal(Number(estData.total || 0));

//       if (!editId) {
//         const qInv = query(
//           invoicesRef,
//           where("sourceEstimateId", "==", estDoc.id),
//         );
//         const invSnap = await getDocs(qInv);
//         if (!invSnap.empty) {
//           alert("Invoice already exists for this estimate.");
//           return;
//         }
//       }

//       setCompany(estData.company ?? "");
//       setWithLogo(Boolean(estData.withLogo ?? true));

//       setClient(estData.client ?? "");
//       setInfo(estData.info ?? "");
//       setAddress(estData.address ?? "");
//       setProjectOwner(estData.projectOwner ?? "");
//       setSubject(estData.subject ?? "");
//       setPoNumber(estData.poNumber ?? "");
//       setPaymentTerm(estData.paymentTerm ?? "");
//       setTaxType((estData.taxType ?? "exclusive") as any);

//       setServices(
//         Array.isArray(estData.services) && estData.services.length > 0
//           ? estData.services
//           : services,
//       );

//       setSelectedPercentage(String(estData.selectedPercentage ?? 100));
//       setMessage(estData.message ?? "");
//       setTermsConditionTitle(estData.termsConditionTitle ?? "");
//       setTermsConditionText(
//         estData.termsConditionText ?? estData.termsCondition ?? "",
//       );

//       setInvoiceDate(new Date().toISOString().slice(0, 10));
//       setDueDate("");

//       alert("Estimate loaded. Review details and click Save Invoice.");
//     } catch (e) {
//       console.error(e);
//       alert("Failed to load estimate.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const openPdfPreview = async (invoiceData: any) => {
//     const blob = await buildEstimateInvoicePdfBlob({
//       invoice: invoiceData,
//       companyList,
//       withLogo: Boolean(invoiceData.withLogo ?? true),
//       footerUser: loggedInUser,
//       companyName: invoiceData.company || "",
//     } as any);

//     const url = URL.createObjectURL(blob);
//     setPreviewURL(url);
//     setIsPreviewOpen(true);
//   };

//   const handleSaveInvoice = async () => {
//     if (savingRef.current) return;
//     savingRef.current = true;

//     const user = auth.currentUser;
//     if (!user) {
//       alert("You must be logged in.");
//       savingRef.current = false;
//       return;
//     }

//     const estNo = estimateNoInput.trim();
//     if (!estNo) {
//       alert("Estimate No is required.");
//       savingRef.current = false;
//       return;
//     }

//     if (!client.trim()) {
//       alert("Client is required.");
//       savingRef.current = false;
//       return;
//     }

//     setLoading(true);
//     try {
//       const qEst = query(estimatesRef, where("estimateNo", "==", estNo));
//       const estSnap = await getDocs(qEst);
//       if (estSnap.empty) {
//         alert(`No estimate found for: ${estNo}`);
//         return;
//       }

//       const estDoc = estSnap.docs[0];
//       const estData = estDoc.data() as any;

//       const t = computeTotals(services, taxType);

//       const selectedPctTotals = computeSelectedPercentageTotals(
//         {
//           subtotal: t.subtotal,
//           tax: t.tax,
//           total: t.total,
//         },
//         selectedPercentage,
//       );

//       setSubtotal(t.subtotal);
//       setTax(t.tax);
//       setWhtTotal(t.whtTotal);
//       setTotal(t.total);

//       if (editId) {
//         const updatedInvoice: any = {
//           company,
//           withLogo: Boolean(withLogo),

//           invoiceHeading,

//           client,
//           info,
//           address,
//           projectOwner,
//           subject,
//           poNumber,

//           paymentTerm,
//           taxType,

//           services,

//           message,
//           termsConditionTitle,
//           termsConditionText,

//           subtotal: t.subtotal,
//           tax: t.tax,
//           whtTotal: t.whtTotal,
//           total: t.total,

//           selectedPercentage: selectedPctTotals.selectedPercentage,
//           selectedPercentageSubtotal:
//             selectedPctTotals.selectedPercentageSubtotal,
//           selectedPercentageTax: selectedPctTotals.selectedPercentageTax,
//           selectedPercentageTotal: selectedPctTotals.selectedPercentageTotal,

//           invoiceNo: existingInvoice?.invoiceNo || invoiceNo,
//           invoiceDate: invoiceDate || new Date().toISOString().slice(0, 10),
//           dueDate: dueDate || "",

//           status: status || "Unpaid",

//           sourceEstimateId: existingInvoice?.sourceEstimateId || estDoc.id,
//           sourceEstimateNo: existingInvoice?.sourceEstimateNo || estNo,

//           updatedAt: serverTimestamp(),
//         };

//         await updateDoc(
//           doc(db, "Panels", PANEL_ID, "estimateInvoices", editId),
//           updatedInvoice,
//         );

//         alert("Invoice updated successfully.");
//         await openPdfPreview({ ...(existingInvoice || {}), ...updatedInvoice });
//         return;
//       }

//       const created = await runTransaction(db, async (tx) => {
//         const companyConfig = companyInvoiceConfig[company];

//         if (!companyConfig) {
//           throw new Error("Invalid company selected");
//         }

//         const counterRef = doc(
//           db,
//           "Panels",
//           PANEL_ID,
//           "counters",
//           "estimateInvoices",
//           "companies",
//           companyConfig.key,
//         );

//         let current = 0;

//         if (companyConfig.key === "iedge_sales") {
//           const sharedCounterSnap = await tx.get(counterRef);

//           if (sharedCounterSnap.exists()) {
//             current = Number(sharedCounterSnap.data()?.current || 0);
//           } else {
//             const legacyIedgeRef = doc(
//               db,
//               "Panels",
//               PANEL_ID,
//               "counters",
//               "estimateInvoices",
//               "companies",
//               "iedge",
//             );

//             const legacyDigitalRef = doc(
//               db,
//               "Panels",
//               PANEL_ID,
//               "counters",
//               "estimateInvoices",
//               "companies",
//               "iedge_digital",
//             );

//             const legacyEventsRef = doc(
//               db,
//               "Panels",
//               PANEL_ID,
//               "counters",
//               "estimateInvoices",
//               "companies",
//               "iedge_events",
//             );

//             const legacyIedgeSnap = await tx.get(legacyIedgeRef);
//             const legacyDigitalSnap = await tx.get(legacyDigitalRef);
//             const legacyEventsSnap = await tx.get(legacyEventsRef);

//             const legacyIedgeCurrent = Number(
//               legacyIedgeSnap.exists() ? legacyIedgeSnap.data()?.current : 0,
//             );

//             const legacyDigitalCurrent = Number(
//               legacyDigitalSnap.exists()
//                 ? legacyDigitalSnap.data()?.current
//                 : 0,
//             );

//             const legacyEventsCurrent = Number(
//               legacyEventsSnap.exists() ? legacyEventsSnap.data()?.current : 0,
//             );

//             current = Math.max(
//               legacyIedgeCurrent,
//               legacyDigitalCurrent,
//               legacyEventsCurrent,
//             );
//           }
//         } else {
//           const counterSnap = await tx.get(counterRef);
//           current = Number(
//             counterSnap.exists() ? counterSnap.data()?.current : 0,
//           );
//         }

//         const nextNumber = current + 1;

//         tx.set(counterRef, { current: nextNumber }, { merge: true });

//         const nextInvoiceNo = `${companyConfig.prefix}-${String(nextNumber).padStart(6, "0")}`;

//         const invoiceToSave: any = {
//           ...estData,

//           company,
//           withLogo: Boolean(withLogo),

//           invoiceHeading,

//           client,
//           info,
//           address,
//           projectOwner,
//           subject,
//           poNumber,

//           paymentTerm,
//           taxType,

//           services,

//           message,
//           termsConditionTitle,
//           termsConditionText,

//           subtotal: t.subtotal,
//           tax: t.tax,
//           whtTotal: t.whtTotal,
//           total: t.total,

//           selectedPercentage: selectedPctTotals.selectedPercentage,
//           selectedPercentageSubtotal:
//             selectedPctTotals.selectedPercentageSubtotal,
//           selectedPercentageTax: selectedPctTotals.selectedPercentageTax,
//           selectedPercentageTotal: selectedPctTotals.selectedPercentageTotal,

//           invoiceNo: nextInvoiceNo,
//           invoiceDate: invoiceDate || new Date().toISOString().slice(0, 10),
//           dueDate: dueDate || "",

//           status: status || "Unpaid",

//           sourceEstimateId: estDoc.id,
//           sourceEstimateNo: estNo,

//           createdBy: user.uid,
//           createdByName: loggedInUser?.name || "",
//           createdByEmail: loggedInUser?.email || "",
//           createdAt: serverTimestamp(),
//           updatedAt: serverTimestamp(),
//         };

//         const newRef = doc(
//           collection(db, "Panels", PANEL_ID, "estimateInvoices"),
//         );
//         tx.set(newRef, invoiceToSave);

//         tx.set(
//           doc(db, "Panels", PANEL_ID, "estimates", estDoc.id),
//           { status: "Invoiced", updatedAt: serverTimestamp() },
//           { merge: true },
//         );

//         return { invoiceNo: nextInvoiceNo, invoiceToSave };
//       });

//       setInvoiceNo(created.invoiceNo);
//       alert(`✅ Invoice created: ${created.invoiceNo}`);
//       await openPdfPreview(created.invoiceToSave);
//     } catch (e) {
//       console.error(e);
//       alert("Failed to save invoice.");
//     } finally {
//       setLoading(false);
//       savingRef.current = false;
//     }
//   };

//   const updateService = (idx: number, patch: Partial<ServiceItem>) => {
//     setPreferDbTotals(false);
//     setServices((prev) => {
//       const next = [...prev];
//       next[idx] = { ...next[idx], ...patch };
//       return next;
//     });
//   };

//   const addService = () => {
//     setPreferDbTotals(false);
//     setServices((prev) => [...prev, { ...defaultRow }]);
//   };

//   const removeService = (idx: number) => {
//     setPreferDbTotals(false);
//     setServices((prev) => {
//       const next = prev.filter((_, i) => i !== idx);
//       return next.length ? next : prev;
//     });
//   };

//   return (
//     <div className="mt-4">
//       <Card className="p-4 max-w-12xl">
//         <div className="text-lg font-semibold">Create Estimate Invoice</div>
//         <div className="text-sm text-muted-foreground mt-1">
//           Enter Estimate No → Load Estimate → Review/Edit → Save Invoice
//         </div>

//         {previousEstimateTotal !== null && (
//           <div className="mt-3 p-3 border border-yellow-400 bg-yellow-50 rounded text-sm">
//             <span className="font-semibold text-yellow-800">
//               Previous Estimate Amount:
//             </span>{" "}
//             <span className="font-bold text-yellow-900">
//               {money(previousEstimateTotal)}
//             </span>
//             <div className="text-xs text-gray-600 mt-1">
//               (For reference only – will NOT appear in PDF)
//             </div>
//           </div>
//         )}

//         <div>
//           <label className="text-sm font-medium">Invoice Heading</label>
//           <select
//             className="mt-1 w-full border rounded-md p-2 text-sm"
//             value={invoiceHeading}
//             onChange={(e) => setInvoiceHeading(e.target.value)}
//           >
//             {INVOICE_HEADINGS.map((heading) => (
//               <option key={heading} value={heading}>
//                 {heading}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
//           <div className="md:col-span-2">
//             <label className="text-sm font-medium">Estimate No</label>
//             <Input
//               value={estimateNoInput}
//               onChange={(e) => setEstimateNoInput(e.target.value)}
//               placeholder="e.g. IE-200001"
//               className="mt-1"
//             />
//           </div>

//           <div className="flex items-end gap-2">
//             <Button
//               variant="outline"
//               onClick={loadEstimateAndPrefill}
//               disabled={loading}
//             >
//               {loading ? "Loading..." : "Load Estimate"}
//             </Button>
//           </div>
//         </div>

//         <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
//           <div>
//             <label className="text-sm font-medium">Invoice No</label>
//             <Input
//               value={invoiceNo || "Will be assigned on Save"}
//               readOnly
//               className="mt-1 bg-gray-50"
//             />
//           </div>

//           <div>
//             <label className="text-sm font-medium">Invoice Date</label>
//             <Input
//               type="date"
//               value={invoiceDate}
//               onChange={(e) => setInvoiceDate(e.target.value)}
//               className="mt-1"
//             />
//           </div>

//           <div>
//             <label className="text-sm font-medium">Due Date (optional)</label>
//             <Input
//               type="date"
//               value={dueDate}
//               onChange={(e) => setDueDate(e.target.value)}
//               className="mt-1"
//             />
//           </div>

//           <div>
//             <label className="text-sm font-medium">Status</label>
//             <select
//               className="mt-1 w-full border rounded-md p-2 text-sm"
//               value={status}
//               onChange={(e) => setStatus(e.target.value)}
//             >
//               <option value="Unpaid">Unpaid</option>
//               <option value="Partially Paid">Partially Paid</option>
//               <option value="Paid">Paid</option>
//               <option value="Cancelled">Cancelled</option>
//             </select>
//           </div>

//           <div>
//             <label className="text-sm font-medium">PO Number</label>
//             <Input
//               value={poNumber}
//               onChange={(e) => setPoNumber(e.target.value)}
//               className="mt-1"
//               placeholder="e.g. PO-12345"
//             />
//           </div>
//         </div>

//         <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
//           <div>
//             <label className="text-sm font-medium">Company</label>
//             <input
//               list="invoice-company-list"
//               className="mt-1 w-full border rounded-md p-2 text-sm"
//               value={company}
//               onChange={(e) => setCompany(e.target.value)}
//               placeholder="Type or select Company"
//             />
//             <datalist id="invoice-company-list">
//               {companyList.map((c, i) => (
//                 <option key={i} value={c.name} />
//               ))}
//             </datalist>
//           </div>

//           <div className="flex items-end gap-3">
//             <label className="flex items-center gap-2 text-sm">
//               <input
//                 type="checkbox"
//                 checked={withLogo}
//                 onChange={(e) => setWithLogo(e.target.checked)}
//               />
//               With Logo
//             </label>

//             <div className="ml-auto text-xs text-gray-500">
//               Tax Type:
//               <select
//                 className="ml-2 border rounded px-2 py-1"
//                 value={taxType}
//                 onChange={(e) => {
//                   setPreferDbTotals(false);
//                   setTaxType(e.target.value as any);
//                   recalcTotals(services, e.target.value as any);
//                 }}
//               >
//                 <option value="exclusive">Exclusive</option>
//                 <option value="inclusive">Inclusive</option>
//                 <option value="none">None</option>
//               </select>
//             </div>
//           </div>
//         </div>

//         <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
//           <div>
//             <label className="text-sm font-medium">Client</label>
//             <Input
//               value={client}
//               onChange={(e) => setClient(e.target.value)}
//               className="mt-1"
//             />
//           </div>

//           <div>
//             <label className="text-sm font-medium">Project Owner</label>
//             <Input
//               value={projectOwner}
//               onChange={(e) => setProjectOwner(e.target.value)}
//               className="mt-1"
//             />
//           </div>

//           <div className="md:col-span-2">
//             <label className="text-sm font-medium">Subject</label>
//             <Input
//               value={subject}
//               onChange={(e) => setSubject(e.target.value)}
//               className="mt-1"
//             />
//           </div>

//           <div className="md:col-span-2">
//             <label className="text-sm font-medium">Info</label>
//             <Input
//               value={info}
//               onChange={(e) => setInfo(e.target.value)}
//               className="mt-1"
//             />
//           </div>

//           <div className="md:col-span-2">
//             <label className="text-sm font-medium">Address</label>
//             <textarea
//               className="mt-1 w-full border rounded-md p-2 text-sm"
//               rows={3}
//               value={address}
//               onChange={(e) => setAddress(e.target.value)}
//             />
//           </div>

//           <div className="md:col-span-2">
//             <label className="text-sm font-medium">Payment Terms</label>
//             <textarea
//               className="mt-1 w-full border rounded-md p-2 text-sm"
//               rows={3}
//               value={paymentTerm}
//               onChange={(e) => setPaymentTerm(e.target.value)}
//             />
//           </div>
//         </div>

//         <div className="mt-6">
//           <div className="flex items-center justify-between">
//             <div className="text-sm font-semibold">Services</div>
//             <Button variant="outline" onClick={addService}>
//               + Add Service
//             </Button>
//           </div>

//           <div className="mt-2 overflow-auto border rounded">
//             <table className="w-full text-xs">
//               <thead className="bg-gray-100">
//                 <tr>
//                   <th className="text-left p-2 min-w-[220px]">Detail</th>
//                   <th className="text-left p-2 min-w-[220px]">Description</th>
//                   <th className="text-right p-2 min-w-[90px]">Units</th>
//                   <th className="text-left p-2 min-w-[110px]">Rate Mode</th>
//                   <th className="text-right p-2 min-w-[120px]">Rate</th>
//                   <th className="text-left p-2 min-w-[130px]">Tax Label</th>
//                   <th className="text-right p-2 min-w-[90px]">Tax %</th>
//                   <th className="text-left p-2 min-w-[130px]">WHT Label</th>
//                   <th className="text-right p-2 min-w-[90px]">WHT %</th>
//                   <th className="text-center p-2 min-w-[70px]">Remove</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {services.map((s, idx) => (
//                   <tr key={idx} className="border-t">
//                     <td className="p-2">
//                       <Input
//                         value={s.detail}
//                         onChange={(e) =>
//                           updateService(idx, { detail: e.target.value })
//                         }
//                       />
//                     </td>

//                     <td className="p-2">
//                       <Input
//                         value={s.description || ""}
//                         onChange={(e) =>
//                           updateService(idx, { description: e.target.value })
//                         }
//                       />
//                     </td>

//                     <td className="p-2">
//                       <Input
//                         type="number"
//                         value={String(s.units ?? 0)}
//                         onChange={(e) =>
//                           updateService(idx, { units: Number(e.target.value) })
//                         }
//                         className="text-right"
//                       />
//                     </td>

//                     <td className="p-2">
//                       <select
//                         className="w-full border rounded p-2 text-xs"
//                         value={s.rateMode || "amount"}
//                         onChange={(e) =>
//                           updateService(idx, {
//                             rateMode: e.target.value as "amount" | "percent",
//                           })
//                         }
//                       >
//                         <option value="amount">Amount</option>
//                         <option value="percent">Percent</option>
//                       </select>
//                     </td>

//                     <td className="p-2">
//                       <Input
//                         value={String(s.rate ?? "")}
//                         onChange={(e) =>
//                           updateService(idx, { rate: e.target.value })
//                         }
//                         className="text-right"
//                       />
//                     </td>

//                     <td className="p-2">
//                       <Input
//                         value={s.taxLabel || ""}
//                         onChange={(e) =>
//                           updateService(idx, { taxLabel: e.target.value })
//                         }
//                       />
//                     </td>

//                     <td className="p-2">
//                       <Input
//                         type="number"
//                         value={String(s.taxPercent ?? 0)}
//                         onChange={(e) =>
//                           updateService(idx, {
//                             taxPercent: Number(e.target.value),
//                           })
//                         }
//                         className="text-right"
//                       />
//                     </td>

//                     <td className="p-2">
//                       <Input
//                         value={s.whtLabel || ""}
//                         onChange={(e) =>
//                           updateService(idx, { whtLabel: e.target.value })
//                         }
//                       />
//                     </td>

//                     <td className="p-2">
//                       <Input
//                         type="number"
//                         value={String(s.whtPercent ?? 0)}
//                         onChange={(e) =>
//                           updateService(idx, {
//                             whtPercent: Number(e.target.value),
//                           })
//                         }
//                         className="text-right"
//                       />
//                     </td>

//                     <td className="p-2 text-center">
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => removeService(idx)}
//                         disabled={services.length <= 1}
//                       >
//                         ✖
//                       </Button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
//             <div className="border rounded p-4 text-sm bg-white">
//               <div className="flex items-center justify-between font-semibold tracking-wide">
//                 <span className="uppercase">Subtotal</span>
//                 <span>{money(subtotal)}</span>
//               </div>

//               <div className="flex items-center justify-between font-semibold tracking-wide mt-2">
//                 <span className="uppercase">Tax</span>
//                 <span>{money(tax)}</span>
//               </div>

//               <div className="flex items-center justify-between font-semibold tracking-wide mt-2">
//                 <span className="uppercase">WHT</span>
//                 <span>{money(whtTotal)}</span>
//               </div>

//               <div className="pt-3 border-t flex items-center justify-between font-bold text-base mt-3">
//                 <span className="uppercase">Total</span>
//                 <span>{money(total)}</span>
//               </div>

//               <div className="text-[11px] text-gray-500 mt-2">
//                 (Total = Subtotal + Tax + WHT)
//               </div>
//             </div>

//             <div className="border rounded p-4 bg-white">
//               <div className="flex items-center justify-between mb-3">
//                 <div className="font-semibold text-sm">Tax Summary</div>
//                 <div className="text-xs text-gray-500">(Live)</div>
//               </div>

//               {taxSummary.taxRows.length === 0 &&
//               taxSummary.whtRows.length === 0 ? (
//                 <div className="text-sm text-gray-500">
//                   No tax/WHT applied yet.
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   {taxSummary.taxRows.length > 0 && (
//                     <div>
//                       <div className="text-xs font-semibold text-gray-500 mb-2">
//                         TAX
//                       </div>
//                       <div className="space-y-2 text-sm">
//                         {taxSummary.taxRows.map((r, idx) => (
//                           <div
//                             key={`t-${idx}`}
//                             className="flex items-center justify-between"
//                           >
//                             <span className="truncate max-w-[70%]">
//                               {r.label} ({r.pct}%)
//                             </span>
//                             <span>{money(r.amount)}</span>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   {taxSummary.whtRows.length > 0 && (
//                     <div>
//                       <div className="text-xs font-semibold text-gray-500 mb-2">
//                         WHT
//                       </div>
//                       <div className="space-y-2 text-sm">
//                         {taxSummary.whtRows.map((r, idx) => (
//                           <div
//                             key={`w-${idx}`}
//                             className="flex items-center justify-between"
//                           >
//                             <span className="truncate max-w-[70%]">
//                               {r.label} ({r.pct}%)
//                             </span>
//                             <span>{money(r.amount)}</span>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
//           <div>
//             <label className="text-sm font-medium">Select Percentage</label>
//             <select
//               className="mt-1 w-full border rounded-md p-2 text-sm"
//               value={selectedPercentage}
//               onChange={(e) => setSelectedPercentage(e.target.value)}
//             >
//               <option value="100">100%</option>
//               <option value="75">75%</option>
//               <option value="50">50%</option>
//               <option value="25">25%</option>
//               <option value="0">0%</option>
//             </select>
//           </div>

//           <div>
//             <label className="text-sm font-medium">Custom Percentage</label>
//             <Input
//               type="number"
//               min="0"
//               max="100"
//               step="0.01"
//               value={selectedPercentage}
//               onChange={(e) => setSelectedPercentage(e.target.value)}
//               className="mt-1"
//               placeholder="Enter %"
//             />
//           </div>
//         </div>

//         <div className="mt-4 border rounded p-4 bg-white">
//           <div className="text-sm font-semibold mb-2">
//             Selected Percentage Amount
//           </div>
//           {normalizePercentage(selectedPercentage) < 100 && (
//             <div className="mt-4 border rounded p-4 bg-white">
//               <div className="space-y-3 text-sm">
//                 <div className="flex items-center justify-between font-semibold tracking-wide">
//                   <span className="uppercase">
//                     Subtotal ({normalizePercentage(selectedPercentage)}%)
//                   </span>
//                   <span>
//                     {money(
//                       computeSelectedPercentageTotals(
//                         { subtotal, tax, total },
//                         selectedPercentage,
//                       ).selectedPercentageSubtotal,
//                     )}
//                   </span>
//                 </div>

//                 <div className="flex items-center justify-between font-semibold tracking-wide">
//                   <span className="uppercase">
//                     Tax ({normalizePercentage(selectedPercentage)}%)
//                   </span>
//                   <span>
//                     {money(
//                       computeSelectedPercentageTotals(
//                         { subtotal, tax, total },
//                         selectedPercentage,
//                       ).selectedPercentageTax,
//                     )}
//                   </span>
//                 </div>

//                 <div className="flex items-center justify-between font-semibold tracking-wide">
//                   <span className="uppercase">
//                     WHT ({normalizePercentage(selectedPercentage)}%)
//                   </span>
//                   <span>
//                     {money(
//                       whtTotal *
//                         (normalizePercentage(selectedPercentage) / 100),
//                     )}
//                   </span>
//                 </div>

//                 <div className="pt-3 border-t flex items-center justify-between font-bold text-base mt-3">
//                   <span className="uppercase">
//                     Total ({normalizePercentage(selectedPercentage)}%)
//                   </span>
//                   <span>
//                     {money(
//                       computeSelectedPercentageTotals(
//                         { subtotal, tax, total },
//                         selectedPercentage,
//                       ).selectedPercentageTotal,
//                     )}
//                   </span>
//                 </div>

//                 <div className="text-[11px] text-gray-500 mt-2">
//                   (Total = Subtotal + Tax + WHT)
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>

//         <div className="mt-4">
//           <label className="text-sm font-medium">Message</label>
//           <textarea
//             className="mt-1 w-full border rounded-md p-2 text-sm"
//             rows={4}
//             value={message}
//             onChange={(e) => setMessage(e.target.value)}
//           />
//         </div>

//         <div className="mt-4">
//           <label className="text-sm font-medium">
//             Terms & Conditions Title
//           </label>
//           <Input
//             value={termsConditionTitle}
//             onChange={(e) => setTermsConditionTitle(e.target.value)}
//             className="mt-1"
//             placeholder="e.g. Terms & Conditions"
//           />
//         </div>

//         <div className="mt-4">
//           <label className="text-sm font-medium">Terms & Conditions Text</label>
//           <textarea
//             className="mt-1 w-full border rounded-md p-2 text-sm"
//             rows={5}
//             value={termsConditionText}
//             onChange={(e) => setTermsConditionText(e.target.value)}
//           />
//         </div>

//         <div className="mt-6 flex flex-wrap gap-2">
//           <Button onClick={handleSaveInvoice} disabled={loading}>
//             {loading ? "Saving..." : editId ? "Update Invoice" : "Save Invoice"}
//           </Button>

//           {previewURL && (
//             <Button
//               variant="outline"
//               onClick={() => setIsPreviewOpen((v) => !v)}
//             >
//               {isPreviewOpen ? "Hide Preview" : "Show Preview"}
//             </Button>
//           )}
//         </div>
//       </Card>
//       {/* PDF Preview */}
//       {isPreviewOpen && previewURL && (
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
//                   link.href = previewURL!;
//                   link.download = `${invoiceNo || "invoice"}.pdf`;
//                   link.click();
//                 }}
//               >
//                 Download
//               </Button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  onSnapshot,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buildEstimateInvoicePdfBlob } from "@/lib/estimateInvoicePdf";

type ServiceItem = {
  detail: string;
  description?: string;
  units: number;
  rate: number | string;
  rateMode?: "amount" | "percent";
  taxLabel?: string;
  taxPercent?: number;
  whtLabel?: string;
  whtPercent?: number;
};

const defaultRow: ServiceItem = {
  detail: "",
  description: "",
  units: 0,
  rate: "",
  rateMode: "amount",
  taxLabel: "SST",
  taxPercent: 0,
  whtLabel: "WHT",
  whtPercent: 0,
};

const PANEL_ID = "IEDGE-SYSTEM";

// PO amounts are edited as strings (so a field can be blank while typing)
// and saved as numbers. Older invoices may only have a single `poAmount`.
const toPoAmountInputs = (invoice: any): string[] => {
  const raw = Array.isArray(invoice?.poAmounts)
    ? invoice.poAmounts
    : invoice?.poAmount !== undefined && invoice?.poAmount !== null
      ? [invoice.poAmount]
      : [];

  const values = raw
    .map((value: any) => String(value ?? "").trim())
    .filter(Boolean);

  return values.length ? values : [""];
};

const toPoAmountNumbers = (inputs: string[]): number[] =>
  inputs
    .map((value) => String(value ?? "").replace(/,/g, "").trim())
    .filter(Boolean)
    .map(Number)
    .filter((value) => Number.isFinite(value));

export type EstimateInvoice = any;

type Props = {
  existingInvoice?: EstimateInvoice;
  duplicateMode?: boolean;
};

type Totals = {
  subtotal: number;
  tax: number;
  whtTotal: number;
  total: number;
};

export default function EstimateInvoiceForm({
  existingInvoice,
  duplicateMode = false,
}: Props) {
  const [editId, setEditId] = useState<string | null>(null);

  const [estimateNoInput, setEstimateNoInput] = useState("");

  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [company, setCompany] = useState<string>("");
  const [withLogo, setWithLogo] = useState<boolean>(true);

  const [client, setClient] = useState("");
  const [info, setInfo] = useState("");
  const [address, setAddress] = useState("");
  const [projectOwner, setProjectOwner] = useState("");
  const [subject, setSubject] = useState("");

  const [poNumber, setPoNumber] = useState("");
  const [poAmounts, setPoAmounts] = useState<string[]>([""]);

  const [previousEstimateTotal, setPreviousEstimateTotal] = useState<
    number | null
  >(null);

  const [paymentTerm, setPaymentTerm] = useState("");
  const [taxType, setTaxType] = useState<"none" | "exclusive" | "inclusive">(
    "exclusive",
  );

  const [services, setServices] = useState<ServiceItem[]>([{ ...defaultRow }]);

  const INVOICE_HEADINGS = ["Sales Tax Invoice", "Performa Invoice", "Invoice"];

  const [invoiceHeading, setInvoiceHeading] =
    useState<string>("Sales Tax Invoice");

  const [selectedPercentage, setSelectedPercentage] = useState<string>("100");

  const [message, setMessage] = useState("");
  const [termsConditionTitle, setTermsConditionTitle] = useState("");
  const [termsConditionText, setTermsConditionText] = useState("");

  const [subtotal, setSubtotal] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [whtTotal, setWhtTotal] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);

  const [status, setStatus] = useState<string>("Unpaid");
  const [loading, setLoading] = useState(false);
  const savingRef = useRef(false);
  const [preferDbTotals, setPreferDbTotals] = useState(false);

  const companyList = [
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

  const companyInvoiceConfig: Record<string, { prefix: string; key: string }> =
    {
      iEDGE: { prefix: "S", key: "iedge_sales" },
      "iEDGE - Digital & Creative": { prefix: "S", key: "iedge_sales" },
      "iEDGE - Events & Activations": { prefix: "S", key: "iedge_sales" },

      "iEDGE - Health Sciences": { prefix: "IHS", key: "iedge_health" },
      "iEDGE - International Education": {
        prefix: "IIE",
        key: "iedge_edu",
      },
      "iEDGE - Trading": { prefix: "ITR", key: "iedge_trade" },
      "iEDGE - Travel & Tours": { prefix: "S-T", key: "iedge_travel" },

      Catapult: { prefix: "CAT", key: "catapult" },
      iConsultant: { prefix: "IC", key: "iconsultant" },
      "Let's Save Green": { prefix: "LSG", key: "lsg" },
      "Emaan Biz": { prefix: "EB", key: "emaanbiz" },
    };

  const estimatesRef = useMemo(
    () => collection(db, "Panels", PANEL_ID, "estimates"),
    [],
  );

  const invoicesRef = useMemo(
    () => collection(db, "Panels", PANEL_ID, "estimateInvoices"),
    [],
  );

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const userRef = doc(db, "Panels", PANEL_ID, "users", uid);
    const unsub = onSnapshot(userRef, (snap) => {
      setLoggedInUser(snap.exists() ? snap.data() : null);
    });

    return () => unsub();
  }, []);

  const normalizePercentage = (value: string | number) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return 100;
    if (n < 0) return 0;
    if (n > 100) return 100;
    return Number(n.toFixed(2));
  };

  const computeSelectedPercentageTotals = (
    actual: { subtotal: number; tax: number; total: number },
    percentageValue: string | number,
  ) => {
    const pct = normalizePercentage(percentageValue);
    const factor = pct / 100;

    return {
      selectedPercentage: pct,
      selectedPercentageSubtotal: Number((actual.subtotal * factor).toFixed(2)),
      selectedPercentageTax: Number((actual.tax * factor).toFixed(2)),
      selectedPercentageTotal: Number((actual.total * factor).toFixed(2)),
    };
  };

  const computeTotals = (
    nextServices: ServiceItem[],
    nextTaxType: "none" | "exclusive" | "inclusive",
  ): Totals => {
    const calcBaseInner = (s: ServiceItem) => {
      const units = Number(s.units || 0);
      const rateNum = Number(String(s.rate ?? 0).replace(/,/g, "")) || 0;
      const mode = (s.rateMode || "amount") as "amount" | "percent";
      return mode === "percent" ? units * (rateNum / 100) : units * rateNum;
    };

    const baseSum = nextServices.reduce((sum, s) => sum + calcBaseInner(s), 0);

    let taxSum = 0;
    if (nextTaxType !== "none") {
      for (const s of nextServices) {
        const pct = Number(s.taxPercent ?? 0);
        if (!pct) continue;

        const base = calcBaseInner(s);
        if (nextTaxType === "exclusive") taxSum += (base * pct) / 100;
        else taxSum += (base * pct) / (100 + pct);
      }
    }

    const lineTotalForWht = (s: ServiceItem) => {
      const base = calcBaseInner(s);
      const pct = Number(s.taxPercent ?? 0);

      if (!pct || nextTaxType === "none") return base;
      if (nextTaxType === "inclusive") return base;
      return base + (base * pct) / 100;
    };

    let whtSum = 0;
    for (const s of nextServices) {
      const pct = Number(s.whtPercent ?? 0);
      if (!pct) continue;
      const baseForWht = lineTotalForWht(s);
      whtSum += (baseForWht * pct) / 100;
    }

    const computedSubtotal =
      nextTaxType === "inclusive" ? baseSum - taxSum : baseSum;

    const computedTotal =
      computedSubtotal + (nextTaxType === "none" ? 0 : taxSum) + whtSum;

    return {
      subtotal: Number(computedSubtotal.toFixed(2)),
      tax: Number(taxSum.toFixed(2)),
      whtTotal: Number(whtSum.toFixed(2)),
      total: Number(computedTotal.toFixed(2)),
    };
  };

  const calcBase = (s: ServiceItem) => {
    const units = Number(s.units || 0);
    const rateNum = Number(String(s.rate ?? 0).replace(/,/g, "")) || 0;
    const mode = (s.rateMode || "amount") as "amount" | "percent";
    return mode === "percent" ? units * (rateNum / 100) : units * rateNum;
  };

  const recalcTotals = (nextServices = services, nextTaxType = taxType) => {
    const baseSum = nextServices.reduce((sum, s) => sum + calcBase(s), 0);

    let taxSum = 0;
    if (nextTaxType !== "none") {
      for (const s of nextServices) {
        const pct = Number(s.taxPercent ?? 0);
        if (!pct) continue;

        const base = calcBase(s);
        if (nextTaxType === "exclusive") {
          taxSum += (base * pct) / 100;
        } else {
          taxSum += (base * pct) / (100 + pct);
        }
      }
    }

    const lineTotalForWht = (s: ServiceItem) => {
      const base = calcBase(s);
      const pct = Number(s.taxPercent ?? 0);

      if (!pct || nextTaxType === "none") return base;
      if (nextTaxType === "inclusive") return base;
      return base + (base * pct) / 100;
    };

    let whtSum = 0;
    for (const s of nextServices) {
      const pct = Number(s.whtPercent ?? 0);
      if (!pct) continue;
      const baseForWht = lineTotalForWht(s);
      whtSum += (baseForWht * pct) / 100;
    }

    const computedSubtotal =
      nextTaxType === "inclusive" ? baseSum - taxSum : baseSum;

    const computedTotal =
      computedSubtotal + (nextTaxType === "none" ? 0 : taxSum) + whtSum;

    setSubtotal(Number(computedSubtotal.toFixed(2)));
    setTax(Number(taxSum.toFixed(2)));
    setWhtTotal(Number(whtSum.toFixed(2)));
    setTotal(Number(computedTotal.toFixed(2)));
  };

  useEffect(() => {
    if (preferDbTotals) return;

    const t = computeTotals(services, taxType);
    setSubtotal(t.subtotal);
    setTax(t.tax);
    setWhtTotal(t.whtTotal);
    setTotal(t.total);

    if (previousEstimateTotal !== null) {
      if (t.total > previousEstimateTotal) {
        const ok = window.confirm(
          `⚠ Warning:\n\nInvoice amount (${money(t.total)}) is GREATER than Estimate amount (${money(previousEstimateTotal)}).\n\nDo you want to continue?`,
        );
        if (!ok) {
          savingRef.current = false;
          setLoading(false);
          return;
        }
      }

      if (t.total < previousEstimateTotal) {
        const ok = window.confirm(
          `⚠ Warning:\n\nInvoice amount (${money(t.total)}) is LESS than Estimate amount (${money(previousEstimateTotal)}).\n\nDo you want to continue?`,
        );
        if (!ok) {
          savingRef.current = false;
          setLoading(false);
          return;
        }
      }
    }
  }, [services, taxType, preferDbTotals, previousEstimateTotal]);

  const money = (n: number) => {
    const x = Number(n || 0);
    const isWhole = Math.abs(x - Math.round(x)) < 1e-9;
    return x.toLocaleString(undefined, {
      minimumFractionDigits: isWhole ? 0 : 2,
      maximumFractionDigits: 2,
    });
  };

  const taxSummary = useMemo(() => {
    const tType = String(taxType || "exclusive");
    const taxMap = new Map<
      string,
      { label: string; pct: number; amount: number }
    >();
    const whtMap = new Map<
      string,
      { label: string; pct: number; amount: number }
    >();

    const calcTaxForLine = (base: number, pct: number) => {
      if (!pct || tType === "none") return 0;
      if (tType === "inclusive") return (base * pct) / (100 + pct);
      return (base * pct) / 100;
    };

    const lineTotalForWht = (base: number, pct: number) => {
      if (!pct || tType === "none") return base;
      if (tType === "inclusive") return base;
      return base + (base * pct) / 100;
    };

    for (const s of services) {
      const base = calcBase(s);

      const taxPct = Number(s.taxPercent ?? 0) || 0;
      if (taxPct && tType !== "none") {
        const lbl = String(s.taxLabel || "Tax").trim() || "Tax";
        const taxAmt = calcTaxForLine(base, taxPct);

        const key = `${lbl}__${taxPct}`;
        const prev = taxMap.get(key);
        if (prev) prev.amount += taxAmt;
        else taxMap.set(key, { label: lbl, pct: taxPct, amount: taxAmt });
      }

      const whtPct = Number(s.whtPercent ?? 0) || 0;
      if (whtPct) {
        const lbl = String(s.whtLabel || "WHT").trim() || "WHT";
        const baseForWht = lineTotalForWht(base, taxPct);
        const whtAmt = (baseForWht * whtPct) / 100;

        const key = `${lbl}__${whtPct}`;
        const prev = whtMap.get(key);
        if (prev) prev.amount += whtAmt;
        else whtMap.set(key, { label: lbl, pct: whtPct, amount: whtAmt });
      }
    }

    return {
      taxRows: Array.from(taxMap.values()).sort((a, b) =>
        a.label.localeCompare(b.label),
      ),
      whtRows: Array.from(whtMap.values()).sort((a, b) =>
        a.label.localeCompare(b.label),
      ),
    };
  }, [services, taxType]);

  useEffect(() => {
    if (existingInvoice) {
      setInvoiceHeading(
        (existingInvoice as any).invoiceHeading ?? "Estimate Invoice",
      );
    }
  }, [existingInvoice]);

  useEffect(() => {
    if (!existingInvoice) {
      setEditId(null);
      setInvoiceNo("");
      setEstimateNoInput("");

      setInvoiceDate(new Date().toISOString().slice(0, 10));
      setDueDate("");

      setCompany("");
      setWithLogo(true);

      setClient("");
      setInfo("");
      setAddress("");
      setProjectOwner("");
      setSubject("");
      setPoNumber("");
      setPoAmounts([""]);

      setPaymentTerm("");
      setTaxType("exclusive");

      setPreferDbTotals(false);
      setSubtotal(0);
      setTax(0);
      setWhtTotal(0);
      setTotal(0);

      setServices([{ ...defaultRow }]);

      setSelectedPercentage("100");
      setMessage("");
      setTermsConditionTitle("");
      setTermsConditionText("");

      setStatus("Unpaid");
      return;
    }

    setEditId(duplicateMode ? null : (existingInvoice.id ?? null));

    setInvoiceNo(duplicateMode ? "" : (existingInvoice.invoiceNo ?? ""));
    setEstimateNoInput(
      existingInvoice.sourceEstimateNo ?? existingInvoice.estimateNo ?? "",
    );

    setInvoiceDate(
      duplicateMode
        ? new Date().toISOString().slice(0, 10)
        : (existingInvoice.invoiceDate ?? ""),
    );
    setDueDate(existingInvoice.dueDate ?? "");

    setCompany(existingInvoice.company ?? "");
    setWithLogo(Boolean(existingInvoice.withLogo ?? true));

    setClient(existingInvoice.client ?? "");
    setInfo(existingInvoice.info ?? "");
    setAddress(existingInvoice.address ?? "");
    setProjectOwner(existingInvoice.projectOwner ?? "");
    setSubject(existingInvoice.subject ?? "");
    setPoNumber(existingInvoice.poNumber ?? "");
    setPoAmounts(toPoAmountInputs(existingInvoice));

    setPaymentTerm(existingInvoice.paymentTerm ?? "");
    setTaxType((existingInvoice.taxType ?? "exclusive") as any);

    const nextServices =
      Array.isArray(existingInvoice.services) &&
      existingInvoice.services.length > 0
        ? (existingInvoice.services as any)
        : [{ ...defaultRow }];

    setServices(nextServices);

    setSelectedPercentage(String(existingInvoice.selectedPercentage ?? 100));
    setMessage(existingInvoice.message ?? "");
    setTermsConditionTitle(existingInvoice.termsConditionTitle ?? "");
    setTermsConditionText(
      existingInvoice.termsConditionText ??
        existingInvoice.termsCondition ??
        "",
    );

    setStatus(existingInvoice.status ?? "Unpaid");

    if (!duplicateMode) {
      setPreferDbTotals(true);
      setSubtotal(Number(existingInvoice.subtotal ?? 0));
      setTax(Number(existingInvoice.tax ?? 0));
      setWhtTotal(Number(existingInvoice.whtTotal ?? 0));
      setTotal(Number(existingInvoice.total ?? 0));
    } else {
      setPreferDbTotals(false);
    }
  }, [existingInvoice, duplicateMode]);

  const loadEstimateAndPrefill = async () => {
    setPreferDbTotals(false);
    const estNo = estimateNoInput.trim();
    if (!estNo) return alert("Please enter an Estimate No.");

    setLoading(true);
    try {
      const qEst = query(estimatesRef, where("estimateNo", "==", estNo));
      const estSnap = await getDocs(qEst);

      if (estSnap.empty) {
        alert(`No estimate found for: ${estNo}`);
        return;
      }

      const estDoc = estSnap.docs[0];
      const estData = estDoc.data() as any;

      setPreviousEstimateTotal(Number(estData.total || 0));

      if (!editId) {
        const qInv = query(
          invoicesRef,
          where("sourceEstimateId", "==", estDoc.id),
        );
        const invSnap = await getDocs(qInv);
        if (!invSnap.empty) {
          alert("Invoice already exists for this estimate.");
          return;
        }
      }

      setCompany(estData.company ?? "");
      setWithLogo(Boolean(estData.withLogo ?? true));

      setClient(estData.client ?? "");
      setInfo(estData.info ?? "");
      setAddress(estData.address ?? "");
      setProjectOwner(estData.projectOwner ?? "");
      setSubject(estData.subject ?? "");
      setPoNumber(estData.poNumber ?? "");
      setPaymentTerm(estData.paymentTerm ?? "");
      setTaxType((estData.taxType ?? "exclusive") as any);

      setServices(
        Array.isArray(estData.services) && estData.services.length > 0
          ? estData.services
          : services,
      );

      setSelectedPercentage(String(estData.selectedPercentage ?? 100));
      setMessage(estData.message ?? "");
      setTermsConditionTitle(estData.termsConditionTitle ?? "");
      setTermsConditionText(
        estData.termsConditionText ?? estData.termsCondition ?? "",
      );

      setInvoiceDate(new Date().toISOString().slice(0, 10));
      setDueDate("");

      alert("Estimate loaded. Review details and click Save Invoice.");
    } catch (e) {
      console.error(e);
      alert("Failed to load estimate.");
    } finally {
      setLoading(false);
    }
  };

  const clearInvoiceForm = () => {
    setEditId(null);
    setEstimateNoInput("");
    setInvoiceNo("");
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setDueDate("");
    setCompany("");
    setWithLogo(true);
    setClient("");
    setInfo("");
    setAddress("");
    setProjectOwner("");
    setSubject("");
    setPoNumber("");
    setPoAmounts([""]);
    setPreviousEstimateTotal(null);
    setPaymentTerm("");
    setTaxType("exclusive");
    setServices([{ ...defaultRow }]);
    setInvoiceHeading("Sales Tax Invoice");
    setSelectedPercentage("100");
    setMessage("");
    setTermsConditionTitle("");
    setTermsConditionText("");
    setSubtotal(0);
    setTax(0);
    setWhtTotal(0);
    setTotal(0);
    setStatus("Unpaid");
    setPreferDbTotals(false);
  };

  const openPdfPreview = async (invoiceData: any) => {
    const blob = await buildEstimateInvoicePdfBlob({
      invoice: invoiceData,
      companyList,
      withLogo: Boolean(invoiceData.withLogo ?? true),
      footerUser: loggedInUser,
      companyName: invoiceData.company || "",
    } as any);

    const url = URL.createObjectURL(blob);
    setPreviewURL(url);
    setIsPreviewOpen(true);
  };

  const handleSaveInvoice = async () => {
    if (savingRef.current) return;
    savingRef.current = true;

    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in.");
      savingRef.current = false;
      return;
    }

    const estNo = estimateNoInput.trim();
    if (!estNo) {
      alert("Estimate No is required.");
      savingRef.current = false;
      return;
    }

    if (!client.trim()) {
      alert("Client is required.");
      savingRef.current = false;
      return;
    }

    setLoading(true);
    try {
      const qEst = query(estimatesRef, where("estimateNo", "==", estNo));
      const estSnap = await getDocs(qEst);
      if (estSnap.empty) {
        alert(`No estimate found for: ${estNo}`);
        return;
      }

      const estDoc = estSnap.docs[0];
      const estData = estDoc.data() as any;

      const t = computeTotals(services, taxType);

      const selectedPctTotals = computeSelectedPercentageTotals(
        {
          subtotal: t.subtotal,
          tax: t.tax,
          total: t.total,
        },
        selectedPercentage,
      );

      setSubtotal(t.subtotal);
      setTax(t.tax);
      setWhtTotal(t.whtTotal);
      setTotal(t.total);

      const poAmountValues = toPoAmountNumbers(poAmounts);
      const poAmountTotal = Number(
        poAmountValues.reduce((sum, value) => sum + value, 0).toFixed(2),
      );

      if (editId) {
        const updatedInvoice: any = {
          company,
          withLogo: Boolean(withLogo),

          invoiceHeading,

          client,
          info,
          address,
          projectOwner,
          subject,
          poNumber,
          poAmounts: poAmountValues,
          poAmountTotal,

          paymentTerm,
          taxType,

          services,

          message,
          termsConditionTitle,
          termsConditionText,

          subtotal: t.subtotal,
          tax: t.tax,
          whtTotal: t.whtTotal,
          total: t.total,

          selectedPercentage: selectedPctTotals.selectedPercentage,
          selectedPercentageSubtotal:
            selectedPctTotals.selectedPercentageSubtotal,
          selectedPercentageTax: selectedPctTotals.selectedPercentageTax,
          selectedPercentageTotal: selectedPctTotals.selectedPercentageTotal,

          invoiceNo: existingInvoice?.invoiceNo || invoiceNo,
          invoiceDate: invoiceDate || new Date().toISOString().slice(0, 10),
          dueDate: dueDate || "",

          status: status || "Unpaid",

          sourceEstimateId: existingInvoice?.sourceEstimateId || estDoc.id,
          sourceEstimateNo: existingInvoice?.sourceEstimateNo || estNo,

          updatedAt: serverTimestamp(),
        };

        await updateDoc(
          doc(db, "Panels", PANEL_ID, "estimateInvoices", editId),
          updatedInvoice,
        );

        alert("Invoice updated successfully.");
        await openPdfPreview({ ...(existingInvoice || {}), ...updatedInvoice });
        clearInvoiceForm();
        return;
      }

      const created = await runTransaction(db, async (tx) => {
        const companyConfig = companyInvoiceConfig[company];

        if (!companyConfig) {
          throw new Error("Invalid company selected");
        }

        const counterRef = doc(
          db,
          "Panels",
          PANEL_ID,
          "counters",
          "estimateInvoices",
          "companies",
          companyConfig.key,
        );

        let current = 0;

        if (companyConfig.key === "iedge_sales") {
          const sharedCounterSnap = await tx.get(counterRef);

          if (sharedCounterSnap.exists()) {
            current = Number(sharedCounterSnap.data()?.current || 0);
          } else {
            const legacyIedgeRef = doc(
              db,
              "Panels",
              PANEL_ID,
              "counters",
              "estimateInvoices",
              "companies",
              "iedge",
            );

            const legacyDigitalRef = doc(
              db,
              "Panels",
              PANEL_ID,
              "counters",
              "estimateInvoices",
              "companies",
              "iedge_digital",
            );

            const legacyEventsRef = doc(
              db,
              "Panels",
              PANEL_ID,
              "counters",
              "estimateInvoices",
              "companies",
              "iedge_events",
            );

            const legacyIedgeSnap = await tx.get(legacyIedgeRef);
            const legacyDigitalSnap = await tx.get(legacyDigitalRef);
            const legacyEventsSnap = await tx.get(legacyEventsRef);

            const legacyIedgeCurrent = Number(
              legacyIedgeSnap.exists() ? legacyIedgeSnap.data()?.current : 0,
            );

            const legacyDigitalCurrent = Number(
              legacyDigitalSnap.exists()
                ? legacyDigitalSnap.data()?.current
                : 0,
            );

            const legacyEventsCurrent = Number(
              legacyEventsSnap.exists() ? legacyEventsSnap.data()?.current : 0,
            );

            current = Math.max(
              legacyIedgeCurrent,
              legacyDigitalCurrent,
              legacyEventsCurrent,
            );
          }
        } else {
          const counterSnap = await tx.get(counterRef);
          current = Number(
            counterSnap.exists() ? counterSnap.data()?.current : 0,
          );
        }

        const nextNumber = current + 1;

        tx.set(counterRef, { current: nextNumber }, { merge: true });

        const nextInvoiceNo = `${companyConfig.prefix}-${String(nextNumber).padStart(6, "0")}`;

        const invoiceToSave: any = {
          ...estData,

          company,
          withLogo: Boolean(withLogo),

          invoiceHeading,

          client,
          info,
          address,
          projectOwner,
          subject,
          poNumber,
          poAmounts: poAmountValues,
          poAmountTotal,

          paymentTerm,
          taxType,

          services,

          message,
          termsConditionTitle,
          termsConditionText,

          subtotal: t.subtotal,
          tax: t.tax,
          whtTotal: t.whtTotal,
          total: t.total,

          selectedPercentage: selectedPctTotals.selectedPercentage,
          selectedPercentageSubtotal:
            selectedPctTotals.selectedPercentageSubtotal,
          selectedPercentageTax: selectedPctTotals.selectedPercentageTax,
          selectedPercentageTotal: selectedPctTotals.selectedPercentageTotal,

          invoiceNo: nextInvoiceNo,
          invoiceDate: invoiceDate || new Date().toISOString().slice(0, 10),
          dueDate: dueDate || "",

          status: status || "Unpaid",

          sourceEstimateId: estDoc.id,
          sourceEstimateNo: estNo,

          createdBy: user.uid,
          createdByName: loggedInUser?.name || "",
          createdByEmail: loggedInUser?.email || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        const newRef = doc(
          collection(db, "Panels", PANEL_ID, "estimateInvoices"),
        );
        tx.set(newRef, invoiceToSave);

        tx.set(
          doc(db, "Panels", PANEL_ID, "estimates", estDoc.id),
          { status: "Invoiced", updatedAt: serverTimestamp() },
          { merge: true },
        );

        return { invoiceNo: nextInvoiceNo, invoiceToSave };
      });

      setInvoiceNo(created.invoiceNo);
      alert(`✅ Invoice created: ${created.invoiceNo}`);
      await openPdfPreview(created.invoiceToSave);
      clearInvoiceForm();
    } catch (e) {
      console.error(e);
      alert("Failed to save invoice.");
    } finally {
      setLoading(false);
      savingRef.current = false;
    }
  };

  const updateService = (idx: number, patch: Partial<ServiceItem>) => {
    setPreferDbTotals(false);
    setServices((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const addService = () => {
    setPreferDbTotals(false);
    setServices((prev) => [...prev, { ...defaultRow }]);
  };

  const removeService = (idx: number) => {
    setPreferDbTotals(false);
    setServices((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length ? next : prev;
    });
  };

  return (
    <div className="mt-4">
      <Card className="p-4 max-w-12xl">
        <div className="text-lg font-semibold">Create Estimate Invoice</div>
        <div className="text-sm text-muted-foreground mt-1">
          Enter Estimate No → Load Estimate → Review/Edit → Save Invoice
        </div>

        {previousEstimateTotal !== null && (
          <div className="mt-3 p-3 border border-yellow-400 bg-yellow-50 rounded text-sm">
            <span className="font-semibold text-yellow-800">
              Previous Estimate Amount:
            </span>{" "}
            <span className="font-bold text-yellow-900">
              {money(previousEstimateTotal)}
            </span>
            <div className="text-xs text-gray-600 mt-1">
              (For reference only – will NOT appear in PDF)
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-medium">Invoice Heading</label>
          <select
            className="mt-1 w-full border rounded-md p-2 text-sm"
            value={invoiceHeading}
            onChange={(e) => setInvoiceHeading(e.target.value)}
          >
            {INVOICE_HEADINGS.map((heading) => (
              <option key={heading} value={heading}>
                {heading}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Estimate No</label>
            <Input
              value={estimateNoInput}
              onChange={(e) => setEstimateNoInput(e.target.value)}
              placeholder="e.g. IE-200001"
              className="mt-1"
            />
          </div>

          <div className="flex items-end gap-2">
            <Button
              variant="outline"
              onClick={loadEstimateAndPrefill}
              disabled={loading}
            >
              {loading ? "Loading..." : "Load Estimate"}
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-sm font-medium">Invoice No</label>
            <Input
              value={invoiceNo || "Will be assigned on Save"}
              readOnly
              className="mt-1 bg-gray-50"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Invoice Date</label>
            <Input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Due Date (optional)</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Status</label>
            <select
              className="mt-1 w-full border rounded-md p-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Unpaid">Unpaid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Paid">Paid</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Void">Void</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">PO Number</label>
            <Input
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              className="mt-1"
              placeholder="e.g. PO-12345"
            />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium">PO Amount</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPoAmounts((prev) => [...prev, ""])}
            >
              + Add PO Amount
            </Button>
          </div>

          <div className="mt-1 grid grid-cols-1 gap-3 md:grid-cols-4">
            {poAmounts.map((value, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  value={value}
                  onChange={(e) =>
                    setPoAmounts((prev) =>
                      prev.map((v, i) => (i === idx ? e.target.value : v)),
                    )
                  }
                  placeholder={
                    poAmounts.length > 1 ? `PO Amount ${idx + 1}` : "e.g. 150000"
                  }
                  aria-label={`PO Amount ${idx + 1}`}
                />
                {poAmounts.length > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    title="Remove this PO amount"
                    onClick={() =>
                      setPoAmounts((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    ✖
                  </Button>
                ) : null}
              </div>
            ))}
          </div>

          {poAmounts.length > 1 ? (
            <div className="mt-2 text-sm text-gray-600">
              Total PO Amount:{" "}
              <span className="font-semibold text-gray-900">
                {money(
                  toPoAmountNumbers(poAmounts).reduce((sum, v) => sum + v, 0),
                )}
              </span>
            </div>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Company</label>
            <input
              list="invoice-company-list"
              className="mt-1 w-full border rounded-md p-2 text-sm"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Type or select Company"
            />
            <datalist id="invoice-company-list">
              {companyList.map((c, i) => (
                <option key={i} value={c.name} />
              ))}
            </datalist>
          </div>

          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={withLogo}
                onChange={(e) => setWithLogo(e.target.checked)}
              />
              With Logo
            </label>

            <div className="ml-auto text-xs text-gray-500">
              Tax Type:
              <select
                className="ml-2 border rounded px-2 py-1"
                value={taxType}
                onChange={(e) => {
                  setPreferDbTotals(false);
                  setTaxType(e.target.value as any);
                  recalcTotals(services, e.target.value as any);
                }}
              >
                <option value="exclusive">Exclusive</option>
                <option value="inclusive">Inclusive</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Client</label>
            <Input
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Project Owner</label>
            <Input
              value={projectOwner}
              onChange={(e) => setProjectOwner(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Info</label>
            <Input
              value={info}
              onChange={(e) => setInfo(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Address</label>
            <textarea
              className="mt-1 w-full border rounded-md p-2 text-sm"
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Payment Terms</label>
            <textarea
              className="mt-1 w-full border rounded-md p-2 text-sm"
              rows={3}
              value={paymentTerm}
              onChange={(e) => setPaymentTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Services</div>
            <Button variant="outline" onClick={addService}>
              + Add Service
            </Button>
          </div>

          <div className="mt-2 overflow-auto border rounded">
            <table className="w-full text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-2 min-w-[220px]">Detail</th>
                  <th className="text-left p-2 min-w-[220px]">Description</th>
                  <th className="text-right p-2 min-w-[90px]">Units</th>
                  <th className="text-left p-2 min-w-[110px]">Rate Mode</th>
                  <th className="text-right p-2 min-w-[120px]">Rate</th>
                  <th className="text-left p-2 min-w-[130px]">Tax Label</th>
                  <th className="text-right p-2 min-w-[90px]">Tax %</th>
                  <th className="text-left p-2 min-w-[130px]">WHT Label</th>
                  <th className="text-right p-2 min-w-[90px]">WHT %</th>
                  <th className="text-center p-2 min-w-[70px]">Remove</th>
                </tr>
              </thead>

              <tbody>
                {services.map((s, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2">
                      <Input
                        value={s.detail}
                        onChange={(e) =>
                          updateService(idx, { detail: e.target.value })
                        }
                      />
                    </td>

                    <td className="p-2">
                      <Input
                        value={s.description || ""}
                        onChange={(e) =>
                          updateService(idx, { description: e.target.value })
                        }
                      />
                    </td>

                    <td className="p-2">
                      <Input
                        type="number"
                        value={String(s.units ?? 0)}
                        onChange={(e) =>
                          updateService(idx, { units: Number(e.target.value) })
                        }
                        className="text-right"
                      />
                    </td>

                    <td className="p-2">
                      <select
                        className="w-full border rounded p-2 text-xs"
                        value={s.rateMode || "amount"}
                        onChange={(e) =>
                          updateService(idx, {
                            rateMode: e.target.value as "amount" | "percent",
                          })
                        }
                      >
                        <option value="amount">Amount</option>
                        <option value="percent">Percent</option>
                      </select>
                    </td>

                    <td className="p-2">
                      <Input
                        value={String(s.rate ?? "")}
                        onChange={(e) =>
                          updateService(idx, { rate: e.target.value })
                        }
                        className="text-right"
                      />
                    </td>

                    <td className="p-2">
                      <Input
                        value={s.taxLabel || ""}
                        onChange={(e) =>
                          updateService(idx, { taxLabel: e.target.value })
                        }
                      />
                    </td>

                    <td className="p-2">
                      <Input
                        type="number"
                        value={String(s.taxPercent ?? 0)}
                        onChange={(e) =>
                          updateService(idx, {
                            taxPercent: Number(e.target.value),
                          })
                        }
                        className="text-right"
                      />
                    </td>

                    <td className="p-2">
                      <Input
                        value={s.whtLabel || ""}
                        onChange={(e) =>
                          updateService(idx, { whtLabel: e.target.value })
                        }
                      />
                    </td>

                    <td className="p-2">
                      <Input
                        type="number"
                        value={String(s.whtPercent ?? 0)}
                        onChange={(e) =>
                          updateService(idx, {
                            whtPercent: Number(e.target.value),
                          })
                        }
                        className="text-right"
                      />
                    </td>

                    <td className="p-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeService(idx)}
                        disabled={services.length <= 1}
                      >
                        ✖
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <div className="border rounded p-4 text-sm bg-white">
              <div className="flex items-center justify-between font-semibold tracking-wide">
                <span className="uppercase">Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between font-semibold tracking-wide mt-2">
                <span className="uppercase">Tax</span>
                <span>{money(tax)}</span>
              </div>

              <div className="flex items-center justify-between font-semibold tracking-wide mt-2">
                <span className="uppercase">WHT</span>
                <span>{money(whtTotal)}</span>
              </div>

              <div className="pt-3 border-t flex items-center justify-between font-bold text-base mt-3">
                <span className="uppercase">Total</span>
                <span>{money(total)}</span>
              </div>

              {status === "Void" && (
                <div className="flex items-center justify-between font-semibold text-sm mt-2 text-red-600">
                  <span>(Void)</span>
                  <span>{money(0)}</span>
                </div>
              )}

              <div className="text-[11px] text-gray-500 mt-2">
                (Total = Subtotal + Tax + WHT)
              </div>
            </div>

            <div className="border rounded p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-sm">Tax Summary</div>
                <div className="text-xs text-gray-500">(Live)</div>
              </div>

              {taxSummary.taxRows.length === 0 &&
              taxSummary.whtRows.length === 0 ? (
                <div className="text-sm text-gray-500">
                  No tax/WHT applied yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {taxSummary.taxRows.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 mb-2">
                        TAX
                      </div>
                      <div className="space-y-2 text-sm">
                        {taxSummary.taxRows.map((r, idx) => (
                          <div
                            key={`t-${idx}`}
                            className="flex items-center justify-between"
                          >
                            <span className="truncate max-w-[70%]">
                              {r.label} ({r.pct}%)
                            </span>
                            <span>{money(r.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {taxSummary.whtRows.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 mb-2">
                        WHT
                      </div>
                      <div className="space-y-2 text-sm">
                        {taxSummary.whtRows.map((r, idx) => (
                          <div
                            key={`w-${idx}`}
                            className="flex items-center justify-between"
                          >
                            <span className="truncate max-w-[70%]">
                              {r.label} ({r.pct}%)
                            </span>
                            <span>{money(r.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Select Percentage</label>
            <select
              className="mt-1 w-full border rounded-md p-2 text-sm"
              value={selectedPercentage}
              onChange={(e) => setSelectedPercentage(e.target.value)}
            >
              <option value="100">100%</option>
              <option value="75">75%</option>
              <option value="50">50%</option>
              <option value="25">25%</option>
              <option value="0">0%</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Custom Percentage</label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={selectedPercentage}
              onChange={(e) => setSelectedPercentage(e.target.value)}
              className="mt-1"
              placeholder="Enter %"
            />
          </div>
        </div>

        <div className="mt-4 border rounded p-4 bg-white">
          <div className="text-sm font-semibold mb-2">
            Selected Percentage Amount
          </div>
          {normalizePercentage(selectedPercentage) < 100 && (
            <div className="mt-4 border rounded p-4 bg-white">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between font-semibold tracking-wide">
                  <span className="uppercase">
                    Subtotal ({normalizePercentage(selectedPercentage)}%)
                  </span>
                  <span>
                    {money(
                      computeSelectedPercentageTotals(
                        { subtotal, tax, total },
                        selectedPercentage,
                      ).selectedPercentageSubtotal,
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between font-semibold tracking-wide">
                  <span className="uppercase">
                    Tax ({normalizePercentage(selectedPercentage)}%)
                  </span>
                  <span>
                    {money(
                      computeSelectedPercentageTotals(
                        { subtotal, tax, total },
                        selectedPercentage,
                      ).selectedPercentageTax,
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between font-semibold tracking-wide">
                  <span className="uppercase">
                    WHT ({normalizePercentage(selectedPercentage)}%)
                  </span>
                  <span>
                    {money(
                      whtTotal *
                        (normalizePercentage(selectedPercentage) / 100),
                    )}
                  </span>
                </div>

                <div className="pt-3 border-t flex items-center justify-between font-bold text-base mt-3">
                  <span className="uppercase">
                    Total ({normalizePercentage(selectedPercentage)}%)
                  </span>
                  <span>
                    {money(
                      computeSelectedPercentageTotals(
                        { subtotal, tax, total },
                        selectedPercentage,
                      ).selectedPercentageTotal,
                    )}
                  </span>
                </div>

                <div className="text-[11px] text-gray-500 mt-2">
                  (Total = Subtotal + Tax + WHT)
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium">Message</label>
          <textarea
            className="mt-1 w-full border rounded-md p-2 text-sm"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium">
            Terms & Conditions Title
          </label>
          <Input
            value={termsConditionTitle}
            onChange={(e) => setTermsConditionTitle(e.target.value)}
            className="mt-1"
            placeholder="e.g. Terms & Conditions"
          />
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium">Terms & Conditions Text</label>
          <textarea
            className="mt-1 w-full border rounded-md p-2 text-sm"
            rows={5}
            value={termsConditionText}
            onChange={(e) => setTermsConditionText(e.target.value)}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={handleSaveInvoice} disabled={loading}>
            {loading ? "Saving..." : editId ? "Update Invoice" : "Save Invoice"}
          </Button>

          {previewURL && (
            <Button
              variant="outline"
              onClick={() => setIsPreviewOpen((v) => !v)}
            >
              {isPreviewOpen ? "Hide Preview" : "Show Preview"}
            </Button>
          )}
        </div>
      </Card>
      {/* PDF Preview */}
      {isPreviewOpen && previewURL && (
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
                  link.href = previewURL!;
                  link.download = `${invoiceNo || "invoice"}.pdf`;
                  link.click();
                }}
              >
                Download
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
