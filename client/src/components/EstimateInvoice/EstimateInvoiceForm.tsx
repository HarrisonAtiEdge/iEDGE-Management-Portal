// EstimateInvoiceForm.tsx
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

const PANEL_ID = "IEDGE-SYSTEM";

export type EstimateInvoice = any;

type Props = {
  existingInvoice?: EstimateInvoice;
  duplicateMode?: boolean;
};

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

export default function EstimateInvoiceForm({
  existingInvoice,
  duplicateMode = false,
}: Props) {
  const [editId, setEditId] = useState<string | null>(null);

  // Convert-from-estimate
  const [estimateNoInput, setEstimateNoInput] = useState("");

  // PDF preview
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Logged-in user (for footer)
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  // ==== Invoice fields (full estimate-like set) ====
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(""); // yyyy-mm-dd
  const [dueDate, setDueDate] = useState(""); // optional

  const [company, setCompany] = useState<string>("");
  const [withLogo, setWithLogo] = useState<boolean>(true);

  const [client, setClient] = useState("");
  const [info, setInfo] = useState("");
  const [address, setAddress] = useState("");
  const [projectOwner, setProjectOwner] = useState("");
  const [subject, setSubject] = useState("");

  // ✅ PO Number
  const [poNumber, setPoNumber] = useState("");

  const [previousEstimateTotal, setPreviousEstimateTotal] = useState<
    number | null
  >(null);

  const [paymentTerm, setPaymentTerm] = useState("");
  const [taxType, setTaxType] = useState<"none" | "exclusive" | "inclusive">(
    "exclusive",
  );

  const [services, setServices] = useState<ServiceItem[]>([
    {
      detail: "",
      description: "",
      units: 0,
      rate: "",
      rateMode: "amount",
      taxLabel: "SST",
      taxPercent: 0,
      whtLabel: "WHT",
      whtPercent: 0,
    },
  ]);

  const INVOICE_HEADINGS = ["Sales Tax Invoice", "Performa Invoice", "Invoice"];

  const [invoiceHeading, setInvoiceHeading] =
    useState<string>("Sales Tax Invoice");
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

  // ✅ Companies list
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
      iEDGE: { prefix: "S", key: "iedge" },
      "iEDGE - Digital & Creative": { prefix: "IDC", key: "iedge_digital" },
      "iEDGE - Events & Activations": {
        prefix: "S",
        key: "iedge",
      },
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

  // Load logged-in user for footer
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const userRef = doc(db, "Panels", PANEL_ID, "users", uid);
    const unsub = onSnapshot(userRef, (snap) => {
      setLoggedInUser(snap.exists() ? snap.data() : null);
    });

    return () => unsub();
  }, []);

  // ====== Totals calculator ======
  const calcBase = (s: ServiceItem) => {
    const units = Number(s.units || 0);
    const rateNum = Number(String(s.rate ?? 0).replace(/,/g, "")) || 0;
    const mode = (s.rateMode || "amount") as "amount" | "percent";
    return mode === "percent" ? units * (rateNum / 100) : units * rateNum;
  };

  const recalcTotals = (nextServices = services, nextTaxType = taxType) => {
    const baseSum = nextServices.reduce((sum, s) => sum + calcBase(s), 0);

    // Tax calc (line-level taxPercent)
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

    // WHT calc: always exclusive on line total (base + tax if exclusive, base if inclusive/none)
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

    const computedSubtotal = baseSum;
    const computedTotal =
      computedSubtotal + (nextTaxType === "none" ? 0 : taxSum) + whtSum;

    setSubtotal(Number(computedSubtotal.toFixed(2)));
    setTax(Number(taxSum.toFixed(2)));
    setWhtTotal(Number(whtSum.toFixed(2)));
    setTotal(Number(computedTotal.toFixed(2)));
  };

  useEffect(() => {
    recalcTotals(services, taxType);

    if (previousEstimateTotal !== null) {
      if (total > previousEstimateTotal) {
        const ok = window.confirm(
          `⚠ Warning:\n\nInvoice amount (${money(total)}) is GREATER than Estimate amount (${money(previousEstimateTotal)}).\n\nDo you want to continue?`,
        );
        if (!ok) {
          savingRef.current = false;
          setLoading(false);
          return;
        }
      }

      if (total < previousEstimateTotal) {
        const ok = window.confirm(
          `⚠ Warning:\n\nInvoice amount (${money(total)}) is LESS than Estimate amount (${money(previousEstimateTotal)}).\n\nDo you want to continue?`,
        );
        if (!ok) {
          savingRef.current = false;
          setLoading(false);
          return;
        }
      }
    }
  }, [services, taxType]);

  // ✅ Money formatting
  const money = (n: number) => {
    const x = Number(n || 0);
    const isWhole = Math.abs(x - Math.round(x)) < 1e-9;
    return x.toLocaleString(undefined, {
      minimumFractionDigits: isWhole ? 0 : 2,
      maximumFractionDigits: 2,
    });
  };

  // ✅ LIVE Tax Summary grouping
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

    const taxRows = Array.from(taxMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
    const whtRows = Array.from(whtMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    );

    return { taxRows, whtRows };
  }, [services, taxType]);

  useEffect(() => {
    if (existingInvoice) {
      setInvoiceHeading(
        (existingInvoice as any).invoiceHeading ?? "Estimate Invoice",
      );
    }
  }, [existingInvoice]);

  // ====== Edit / Duplicate fill ======
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
      setPoNumber(""); // ✅ reset PO

      setPaymentTerm("");
      setTaxType("exclusive");
      setServices([
        {
          detail: "",
          description: "",
          units: 0,
          rate: "",
          rateMode: "amount",
          taxLabel: "SST",
          taxPercent: 0,
          whtLabel: "WHT",
          whtPercent: 0,
        },
      ]);

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
    setPoNumber(existingInvoice.poNumber ?? ""); // ✅ prefill PO

    setPaymentTerm(existingInvoice.paymentTerm ?? "");
    setTaxType((existingInvoice.taxType ?? "exclusive") as any);

    setServices((existingInvoice.services ?? []) as any);
    if (!existingInvoice.services || existingInvoice.services.length === 0) {
      setServices([
        {
          detail: "",
          description: "",
          units: 0,
          rate: "",
          rateMode: "amount",
          taxLabel: "SST",
          taxPercent: 0,
          whtLabel: "WHT",
          whtPercent: 0,
        },
      ]);
    }

    setMessage(existingInvoice.message ?? "");
    setTermsConditionTitle(existingInvoice.termsConditionTitle ?? "");
    setTermsConditionText(
      existingInvoice.termsConditionText ??
        existingInvoice.termsCondition ??
        "",
    );

    setStatus(existingInvoice.status ?? "Unpaid");
  }, [existingInvoice, duplicateMode]);

  // ====== Load estimate and copy ALL fields to invoice form ======
  const loadEstimateAndPrefill = async () => {
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

      // prevent duplicate invoice (create mode only)
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

      // Copy everything estimate-like
      setCompany(estData.company ?? "");
      setWithLogo(Boolean(estData.withLogo ?? true));

      setClient(estData.client ?? "");
      setInfo(estData.info ?? "");
      setAddress(estData.address ?? "");
      setProjectOwner(estData.projectOwner ?? "");
      setSubject(estData.subject ?? "");

      // ✅ PO from estimate
      setPoNumber(estData.poNumber ?? "");

      setPaymentTerm(estData.paymentTerm ?? "");
      setTaxType((estData.taxType ?? "exclusive") as any);

      setServices(
        Array.isArray(estData.services) && estData.services.length > 0
          ? estData.services
          : services,
      );

      setMessage(estData.message ?? "");
      setTermsConditionTitle(estData.termsConditionTitle ?? "");
      setTermsConditionText(
        estData.termsConditionText ?? estData.termsCondition ?? "",
      );

      // invoice dates
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

  // ====== Save / Update invoice ======
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
      // find estimate to link
      const qEst = query(estimatesRef, where("estimateNo", "==", estNo));
      const estSnap = await getDocs(qEst);
      if (estSnap.empty) {
        alert(`No estimate found for: ${estNo}`);
        return;
      }

      const estDoc = estSnap.docs[0];
      const estData = estDoc.data() as any;

      // Always recalc before save
      recalcTotals(services, taxType);

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

          // ✅ PO
          poNumber,

          paymentTerm,
          taxType,

          services,

          message,
          termsConditionTitle,
          termsConditionText,

          subtotal: Number(subtotal || 0),
          tax: Number(tax || 0),
          whtTotal: Number(whtTotal || 0),
          total: Number(total || 0),

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

        const counterSnap = await tx.get(counterRef);

        const current = Number(
          counterSnap.exists() ? counterSnap.data()?.current : 0,
        );

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

          // ✅ PO
          poNumber,

          paymentTerm,
          taxType,

          services,

          message,
          termsConditionTitle,
          termsConditionText,

          subtotal: Number(subtotal || 0),
          tax: Number(tax || 0),
          whtTotal: Number(whtTotal || 0),
          total: Number(total || 0),

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
    } catch (e) {
      console.error(e);
      alert("Failed to save invoice.");
    } finally {
      setLoading(false);
      savingRef.current = false;
    }
  };

  // ====== Services UI handlers ======
  const updateService = (idx: number, patch: Partial<ServiceItem>) => {
    setServices((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const addService = () => {
    setServices((prev) => [
      ...prev,
      {
        detail: "",
        description: "",
        units: 0,
        rate: "",
        rateMode: "amount",
        taxLabel: "SST",
        taxPercent: 0,
        whtLabel: "WHT",
        whtPercent: 0,
      },
    ]);
  };

  const removeService = (idx: number) => {
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

        {/* Load Estimate */}
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

        {/* Invoice meta */}
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
            </select>
          </div>

          {/* ✅ PO Number */}
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

        {/* Company */}
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
                onChange={(e) => setTaxType(e.target.value as any)}
              >
                <option value="exclusive">Exclusive</option>
                <option value="inclusive">Inclusive</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>
        </div>

        {/* Client / details */}
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

        {/* Services */}
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
                            rateMode: e.target.value as any,
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

          {/* Totals + Tax Summary */}
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
                              {r.label} @ {r.pct}%
                            </span>
                            <span className="font-medium">
                              {money(r.amount)}
                            </span>
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
                              {r.label} @ {r.pct}%
                            </span>
                            <span className="font-medium">
                              {money(r.amount)}
                            </span>
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

        {/* Message + Terms */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Message</label>
            <textarea
              className="mt-1 w-full border rounded-md p-2 text-sm"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Terms & Conditions Title
            </label>
            <Input
              className="mt-1"
              value={termsConditionTitle}
              onChange={(e) => setTermsConditionTitle(e.target.value)}
            />

            <label className="text-sm font-medium mt-3 block">
              Terms & Conditions Text
            </label>
            <textarea
              className="mt-1 w-full border rounded-md p-2 text-sm"
              rows={5}
              value={termsConditionText}
              onChange={(e) => setTermsConditionText(e.target.value)}
            />
          </div>
        </div>

        {/* Save */}
        <div className="mt-5 flex gap-2">
          <Button onClick={handleSaveInvoice} disabled={loading}>
            {loading ? "Saving..." : editId ? "Update Invoice" : "Save Invoice"}
          </Button>
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
