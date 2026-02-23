// EstimateInternational.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  getDocs,
  query,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  increment,
  serverTimestamp,
  runTransaction,
  setDoc,
} from "firebase/firestore";
import { Estimate } from "../../types";
import { Button } from "@/components/ui/button";
import {
  ToastProvider,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastViewport,
} from "@/components/ui/toast";
import { auth } from "@/lib/firebase";
import { Trash2, ChevronDown, Eye } from "lucide-react";
import { buildEstimatePdfBlob } from "@/lib/EstimateInternationalPdf";

// ✅ dnd-kit
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/**
 * ✅ FIXED PER YOUR REQUIREMENTS
 * UI Columns (AND persisted values) include:
 * Services | Rate | Profit % | Units | Days/Nights | Persons | Profit Rate | Cost | Total Cost | Tax | WHT | Amount | Taxation | PDF | Delete
 *
 * - Rate / Profit Rate / Cost / Total Cost / Tax / WHT / Amount are vertically stacked (Currency1/Currency2/PKR) within a SINGLE column each.
 * - Units column restored.
 * - Profit % column restored.
 * - Tax and WHT columns restored (selects).
 * - Taxation: service-name dropdown + editable textarea (auto-fills from services DB but remains editable).
 * - Main Heading row totals appear in SAME ROW (Total Cost + Amount cells).
 */

type RateCurrency = "PKR" | "USD" | "EUR";
type RowType = "main" | "item";

export interface BaseRow {
  rowId: string;
  rowType: RowType;
  showFinancialsInPdf?: boolean;
}

export interface MainHeadingRow extends BaseRow {
  rowType: "main";
  mainHeading: string;
}

export interface ItemRow extends BaseRow {
  rowType: "item";

  detail: string;
  subHeadingText?: string;
  description?: string;
  subHeadings?: string[];

  units: number;
  unitsInput?: string;

  daysNights: number;
  daysNightsInput?: string;

  persons: number;
  personsInput?: string;

  baseRate: number; // PKR stored (or % value if percent mode)
  baseRateInput?: string;
  baseRateMode?: "amount" | "percent";

  baseRateUsdInput?: string;
  baseRateEuroInput?: string;
  baseRateCurrency?: RateCurrency;

  profitPercent: number;
  profitPercentInput?: string;

  taxId?: string;
  taxPercent?: number;
  taxLabel?: string;

  whtId?: string;
  whtLabel?: string;
  whtPercent?: number;

  taxationServiceId?: string;
  taxationName?: string;
  taxationText?: string;

  // persisted/calculated (optional)
  persistedFinancials?: any;

  multiplier?: number;
  supplierRatePKR?: number;
  profitRatePKR?: number;
  sellRatePKR?: number;
  sellBasePKR?: number;
  supplierCostPKR?: number;
  taxAmountPKR?: number;
  totalCostPKR?: number;
  whtAmountPKR?: number;
  amountPKR?: number;
  currency1?: any;
  currency2?: any;
}

type ServiceRow = MainHeadingRow | ItemRow;

interface Tax {
  id?: string;
  name: string;
  description?: string;
  percent?: number;
}

interface TermsConditionDoc {
  id: string;
  name: string;
  description?: string;
}

type Props = {
  existingEstimate?: Estimate;
  duplicateMode?: boolean;
  onClose?: () => void;
  onSave?: (estimate: Estimate) => void;
};

const num = (v: any) => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

const NO_TAX_ID = "__NO_TAX__";
const NO_WHT_ID = "__NO_WHT__";

const makeRowId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? (crypto as any).randomUUID()
    : `row_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const fmtIntLoose = (n: number) => {
  if (!Number.isFinite(n)) return "";
  return Math.trunc(n).toLocaleString();
};

const parseIntLoose = (v: string) => {
  const cleaned = String(v || "")
    .replace(/,/g, "")
    .trim();
  if (cleaned === "") return 0;
  const nn = parseInt(cleaned, 10);
  return Number.isFinite(nn) ? nn : 0;
};

const fmtDecimal2 = (n: number) => {
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const formatMoney = (n: number) =>
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const sanitizeRateText = (raw: string) => {
  let s = String(raw ?? "");
  s = s.replace(/[^0-9.%+\-*/() ,]/g, "");
  return s;
};

type EvalResult =
  | { ok: true; value: number; mode: "amount" | "percent" }
  | { ok: false; error: string; mode: "amount" | "percent" };

const evalRateExpression = (rawInput: string): EvalResult => {
  const raw = sanitizeRateText(rawInput).trim();
  if (!raw) return { ok: false, error: "Empty", mode: "amount" };

  const trimmed = raw.replace(/\s+/g, " ");
  const endsWithPercent = /%\s*$/.test(trimmed);
  const mode: "amount" | "percent" = endsWithPercent ? "percent" : "amount";
  const expr = endsWithPercent ? trimmed.replace(/%\s*$/, "").trim() : trimmed;

  const clean = expr.replace(/,/g, "").trim();
  if (!clean) return { ok: false, error: "Empty", mode };
  if (/[^0-9+\-*/().\s]/.test(clean))
    return { ok: false, error: "Invalid characters", mode };

  type Tok =
    | { t: "num"; v: number }
    | { t: "op"; v: "+" | "-" | "*" | "/" }
    | { t: "lp" }
    | { t: "rp" }
    | { t: "u-" };

  const tokens: Tok[] = [];
  let i = 0;

  const isOp = (c: string) => c === "+" || c === "-" || c === "*" || c === "/";

  while (i < clean.length) {
    const c = clean[i];
    if (c === " " || c === "\t" || c === "\n") {
      i++;
      continue;
    }
    if (c === "(") {
      tokens.push({ t: "lp" });
      i++;
      continue;
    }
    if (c === ")") {
      tokens.push({ t: "rp" });
      i++;
      continue;
    }
    if ((c >= "0" && c <= "9") || c === ".") {
      let j = i;
      while (
        j < clean.length &&
        ((clean[j] >= "0" && clean[j] <= "9") || clean[j] === ".")
      )
        j++;
      const chunk = clean.slice(i, j);
      const n = Number(chunk);
      if (!Number.isFinite(n)) return { ok: false, error: "Bad number", mode };
      tokens.push({ t: "num", v: n });
      i = j;
      continue;
    }
    if (isOp(c)) {
      tokens.push({ t: "op", v: c as any });
      i++;
      continue;
    }
    return { ok: false, error: "Invalid character", mode };
  }

  const output: Tok[] = [];
  const stack: Tok[] = [];

  const prec = (tok: Tok) => {
    if (tok.t === "u-") return 3;
    if (tok.t === "op" && (tok.v === "*" || tok.v === "/")) return 2;
    if (tok.t === "op" && (tok.v === "+" || tok.v === "-")) return 1;
    return 0;
  };

  const isLeftAssoc = (tok: Tok) => tok.t !== "u-";

  let prev: Tok | null = null;

  for (const tok of tokens) {
    if (tok.t === "num") {
      output.push(tok);
      prev = tok;
      continue;
    }
    if (tok.t === "lp") {
      stack.push(tok);
      prev = tok;
      continue;
    }
    if (tok.t === "rp") {
      while (stack.length && stack[stack.length - 1].t !== "lp")
        output.push(stack.pop() as Tok);
      if (!stack.length) return { ok: false, error: "Mismatched )", mode };
      stack.pop();
      prev = tok;
      continue;
    }
    if (tok.t === "op") {
      let opTok: Tok = tok;
      if (
        tok.v === "-" &&
        (!prev || prev.t === "op" || prev.t === "lp" || prev.t === "u-")
      ) {
        opTok = { t: "u-" };
      }

      while (stack.length) {
        const top = stack[stack.length - 1];
        if (top.t === "lp") break;
        const pTop = prec(top);
        const pCur = prec(opTok);
        if (pTop > pCur || (pTop === pCur && isLeftAssoc(opTok)))
          output.push(stack.pop() as Tok);
        else break;
      }
      stack.push(opTok);
      prev = opTok;
    }
  }

  while (stack.length) {
    const top = stack.pop() as Tok;
    if (top.t === "lp" || top.t === "rp")
      return { ok: false, error: "Mismatched ()", mode };
    output.push(top);
  }

  const st: number[] = [];
  for (const tok of output) {
    if (tok.t === "num") st.push(tok.v);
    else if (tok.t === "u-") {
      if (st.length < 1) return { ok: false, error: "Bad unary -", mode };
      st.push(-(st.pop() as number));
    } else if (tok.t === "op") {
      if (st.length < 2) return { ok: false, error: "Bad expression", mode };
      const b = st.pop() as number;
      const a = st.pop() as number;
      let res = 0;
      if (tok.v === "+") res = a + b;
      if (tok.v === "-") res = a - b;
      if (tok.v === "*") res = a * b;
      if (tok.v === "/") res = a / b;
      if (!Number.isFinite(res))
        return { ok: false, error: "Math error", mode };
      st.push(res);
    }
  }

  if (st.length !== 1) return { ok: false, error: "Bad expression", mode };
  return { ok: true, value: st[0], mode };
};

function SortableRow({
  id,
  children,
  rowClassName,
}: {
  id: string;
  rowClassName?: string;
  children: (args: {
    attributes: any;
    listeners: any;
    setActivatorNodeRef: any;
    isDragging: boolean;
  }) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`transition border-b last:border-none ${rowClassName || ""}`}
    >
      {children({ attributes, listeners, setActivatorNodeRef, isDragging })}
    </tr>
  );
}

const percentToNumber = (raw: string) => {
  const s = String(raw || "")
    .replace(/,/g, "")
    .replace(/%/g, "")
    .trim();
  if (!s) return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

const isItemRow = (r: ServiceRow): r is ItemRow => r.rowType === "item";
const isMainRow = (r: ServiceRow): r is MainHeadingRow => r.rowType === "main";

const hasAnyBaseRateInput = (s: ItemRow) =>
  [s.baseRateInput, s.baseRateUsdInput, s.baseRateEuroInput].some(
    (v) => String(v ?? "").trim() !== "",
  );

const getFx = (usdRate: string, euroRate: string) => ({
  usd: num(usdRate),
  eur: num(euroRate),
});

// ✅ currencies
const CURRENCY_OPTIONS: { code: string; symbol: string; name: string }[] = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SAR", symbol: "ر.س", name: "Saudi Riyal" },
  { code: "QAR", symbol: "ر.ق", name: "Qatari Riyal" },
];

const getCurrencyMeta = (code: string) =>
  CURRENCY_OPTIONS.find((c) => c.code === code) || {
    code,
    symbol: code,
    name: code,
  };

const deriveSubHeadingText = (s: any): string => {
  if (typeof s?.subHeadingText === "string" && s.subHeadingText.trim()) {
    return s.subHeadingText.replace(/\r\n/g, "\n");
  }
  if (Array.isArray(s?.subHeadings) && s.subHeadings.length > 0) {
    return s.subHeadings
      .map((x: any) => String(x ?? "").trim())
      .filter(Boolean)
      .join("\n");
  }
  const desc = String(s?.description ?? "").replace(/\r\n/g, "\n");
  return desc.trim() ? desc : "";
};

/**
 * ✅ compute and persist EVERY COLUMN value per row
 * Definitions (aligned with PDF file you asked for):
 * - Services Rate  = supplierRatePKR (per-unit)
 * - Profit Rate    = profitRatePKR (per-unit)
 * - Cost           = sellRatePKR (per-unit)
 * - Total Cost     = sellBasePKR (total before WHT add; tax handling depends on taxType)
 * - Tax            = taxAmountPKR
 * - WHT            = whtAmountPKR
 * - Amount         = amountPKR (totalCostPKR + whtAmountPKR)
 */
const computePersistedFinancials = (
  r: ItemRow,
  taxType: string,
  addCurrencies: boolean,
  usdRate: string,
  euroRate: string,
  usdCurrency: string,
  euroCurrency: string,
) => {
  const fx = getFx(usdRate, euroRate);

  const units = Number(r.units) || 0;
  const days = Number(r.daysNights) || 0;
  const persons = Number(r.persons) || 0;
  const multiplier = units * days * persons;

  const mode = r.baseRateMode || "amount";
  const supplierRatePKR = mode === "amount" ? Number(r.baseRate) || 0 : 0;

  const profitPercent = Number(r.profitPercent) || 0;
  const profitRatePKR =
    mode === "amount" ? (supplierRatePKR * profitPercent) / 100 : 0;

  const sellRatePKR = mode === "amount" ? supplierRatePKR + profitRatePKR : 0;

  const sellBasePKR =
    mode === "amount"
      ? multiplier * sellRatePKR
      : multiplier * ((Number(r.baseRate) || 0) / 100);

  const supplierCostPKR =
    mode === "amount"
      ? multiplier * supplierRatePKR
      : multiplier * ((Number(r.baseRate) || 0) / 100);

  const pctTax = Number(r.taxPercent ?? 0);
  let taxAmountPKR = 0;

  if (taxType === "none" || pctTax <= 0) taxAmountPKR = 0;
  else if (taxType === "exclusive") taxAmountPKR = (sellBasePKR * pctTax) / 100;
  else taxAmountPKR = (sellBasePKR * pctTax) / (100 + pctTax); // inclusive portion

  const totalCostPKR =
    taxType === "exclusive" ? sellBasePKR + taxAmountPKR : sellBasePKR;

  const whtPercent = Number(r.whtPercent ?? 0);
  const whtAmountPKR = whtPercent > 0 ? (totalCostPKR * whtPercent) / 100 : 0;

  const amountPKR = totalCostPKR + whtAmountPKR;

  const toC1 = (pkr: number) =>
    addCurrencies && fx.usd > 0 ? pkr / fx.usd : null;
  const toC2 = (pkr: number) =>
    addCurrencies && fx.eur > 0 ? pkr / fx.eur : null;

  return {
    multiplier,

    supplierRatePKR,
    profitPercent,
    profitRatePKR,
    sellRatePKR,

    sellBasePKR,
    supplierCostPKR,

    taxAmountPKR,
    totalCostPKR,

    whtPercent,
    whtAmountPKR,

    amountPKR,

    currency1: {
      code: usdCurrency,
      rate: fx.usd || 0,
      supplierRate: toC1(supplierRatePKR),
      profitRate: toC1(profitRatePKR),
      sellRate: toC1(sellRatePKR),
      totalCost: toC1(totalCostPKR),
      tax: toC1(taxAmountPKR),
      wht: toC1(whtAmountPKR),
      amount: toC1(amountPKR),
    },
    currency2: {
      code: euroCurrency,
      rate: fx.eur || 0,
      supplierRate: toC2(supplierRatePKR),
      profitRate: toC2(profitRatePKR),
      sellRate: toC2(sellRatePKR),
      totalCost: toC2(totalCostPKR),
      tax: toC2(taxAmountPKR),
      wht: toC2(whtAmountPKR),
      amount: toC2(amountPKR),
    },
  };
};

export default function EstimateInternational({
  existingEstimate,
  duplicateMode = false,
  onClose,
  onSave,
}: Props) {
  const [paymentTerms, setPaymentTerms] = useState<string[]>([]);
  const [termsConditions, setTermsConditions] = useState<TermsConditionDoc[]>(
    [],
  );
  const [selectedTermsId, setSelectedTermsId] = useState<string>("");
  const [termsConditionTitle, setTermsConditionTitle] = useState<string>("");
  const [termsConditionText, setTermsConditionText] = useState<string>("");

  const [packageIncludesText, setPackageIncludesText] = useState<string>("");
  const [packageExcludesText, setPackageExcludesText] = useState<string>("");
  const loadedPkgTemplateRef = useRef({ inc: false, exc: false });

  const [status, setStatus] = useState<
    | "RFQ Sent"
    | "Approved"
    | "Rejected"
    | "Project Cancelled"
    | "Invoiced"
    | "Payment Received"
    | "PO Received"
  >("RFQ Sent");

  const [approvalReceivedOn, setApprovalReceivedOn] = useState("");

  const [loggedInUser, setLoggedInUser] = useState<{
    displayName?: string;
    email?: string;
    mobileCountryCode?: string;
    mobileNo?: string;
    mobile?: string;
  } | null>(null);

  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [clients, setClients] = useState<
    { id: string; name: string; address?: string; addtionalInfo?: string }[]
  >([]);
  const [selectedClient, setSelectedClient] = useState<{
    name: string;
    address?: string;
    addtionalInfo?: string;
  } | null>(null);

  const [servicesList, setServicesList] = useState<
    { id: string; name: string; description?: string }[]
  >([]);

  const [estimateNo, setEstimateNo] = useState("");
  const [client, setClient] = useState("");
  const [date, setDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [projectOwner, setProjectOwner] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [taxType, setTaxType] = useState("");
  const [taxCategories, setTaxCategories] = useState<Tax[]>([]);
  const [loadingTax, setLoadingTax] = useState(false);

  const [whtCategories, setWhtCategories] = useState<Tax[]>([]);
  const [loadingWht, setLoadingWht] = useState(false);

  const [addCurrencies, setAddCurrencies] = useState(false);
  const [usdRate, setUsdRate] = useState("");
  const [euroRate, setEuroRate] = useState("");

  const [usdCurrency, setUsdCurrency] = useState<string>("USD");
  const [euroCurrency, setEuroCurrency] = useState<string>("EUR");

  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [openTaxationRowId, setOpenTaxationRowId] = useState<string | null>(
    null,
  );
  const taxationDropdownRef = useRef<HTMLDivElement | null>(null);

  const initialRows: ServiceRow[] = useMemo(
    () => [
      {
        rowId: makeRowId(),
        rowType: "main",
        mainHeading: "",
        showFinancialsInPdf: false,
      },
      {
        rowId: makeRowId(),
        rowType: "item",
        detail: "",
        subHeadingText: "",
        description: "",
        subHeadings: [],
        units: 1,
        unitsInput: "1",
        daysNights: 1,
        daysNightsInput: "1",
        persons: 1,
        personsInput: "1",
        baseRate: 0,
        baseRateInput: "",
        baseRateMode: "amount",
        baseRateUsdInput: "",
        baseRateEuroInput: "",
        baseRateCurrency: "PKR",
        profitPercent: 0,
        profitPercentInput: "",
        taxId: "",
        taxLabel: "",
        taxPercent: 0,
        whtId: "",
        whtLabel: "",
        whtPercent: 0,
        taxationServiceId: "",
        taxationName: "",
        taxationText: "",
        showFinancialsInPdf: true,
      },
    ],
    [],
  );

  const [rows, setRows] = useState<ServiceRow[]>(initialRows);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [withLogo, setWithLogo] = useState(true);

  const [paymentTerm, setPaymentTerm] = useState("");
  const [company, setCompany] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  const savingRef = useRef(false);

  const companyList = [
    { name: "iEDGE", logo: "/Iedge-TM-Logos-01.png" },
    { name: "iEDGE - Travel & Tours", logo: "/iedge-travel-logo.png" },
  ];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastOpen(true);
  };

  const fieldClass = (base: string, invalid: boolean) =>
    `${base} ${invalid ? "blink-red" : ""}`;

  // ======= DB PATHS (adjust ONLY if your project uses different collection names) =======
  // ✅ These are the most common paths used in your iEDGE-SYSTEM pattern.
  const ESTIMATES_COL = collection(
    db,
    "Panels",
    "IEDGE-SYSTEM",
    "estimatesInternational",
  );
  const COUNTER_DOC = doc(
    db,
    "Panels",
    "IEDGE-SYSTEM",
    "counters",
    "estimatesInternational",
  );

  // ======= CALC helpers =======
  const calcLine = (r: ServiceRow) => {
    if (!isItemRow(r)) return { base: 0, taxAmount: 0, lineTotal: 0 };

    const persisted = computePersistedFinancials(
      r,
      taxType,
      addCurrencies,
      usdRate,
      euroRate,
      usdCurrency,
      euroCurrency,
    );

    // base: sellBase (total before taxType handling)
    const base = persisted.sellBasePKR;
    const taxAmount = persisted.taxAmountPKR;
    const lineTotal = persisted.totalCostPKR;

    return { base, taxAmount, lineTotal };
  };

  const calcWhtAmount = (r: ServiceRow) => {
    if (!isItemRow(r)) return 0;
    const persisted = computePersistedFinancials(
      r,
      taxType,
      addCurrencies,
      usdRate,
      euroRate,
      usdCurrency,
      euroCurrency,
    );
    return persisted.whtAmountPKR || 0;
  };

  const calcLineTotalWithWht = (r: ServiceRow) => {
    const line = calcLine(r);
    return line.lineTotal + calcWhtAmount(r);
  };

  // ✅ totals per main heading block (sum item rows until next main)
  const sectionTotalsByMainRowId = useMemo(() => {
    const map: Record<string, number> = {};
    let currentMainId: string | null = null;

    for (const r of rows) {
      if (isMainRow(r)) {
        currentMainId = r.rowId;
        map[currentMainId] = 0;
        continue;
      }
      if (isItemRow(r) && currentMainId)
        map[currentMainId] += calcLineTotalWithWht(r);
    }
    return map;
  }, [
    rows,
    taxType,
    usdRate,
    euroRate,
    addCurrencies,
    usdCurrency,
    euroCurrency,
  ]);

  const handleRemoveRow = (index: number) => {
    setRows((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : initialRows;
    });
  };

  const addMainHeadingRow = () => {
    setRows((prev) => [
      ...prev,
      {
        rowId: makeRowId(),
        rowType: "main",
        mainHeading: "",
        showFinancialsInPdf: false,
      },
    ]);
  };

  const addHeadingRow = () => {
    setRows((prev) => [
      ...prev,
      {
        rowId: makeRowId(),
        rowType: "item",
        detail: "",
        subHeadingText: "",
        description: "",
        subHeadings: [],
        units: 1,
        unitsInput: "1",
        daysNights: 1,
        daysNightsInput: "1",
        persons: 1,
        personsInput: "1",
        baseRate: 0,
        baseRateInput: "",
        baseRateMode: "amount",
        baseRateUsdInput: "",
        baseRateEuroInput: "",
        baseRateCurrency: "PKR",
        profitPercent: 0,
        profitPercentInput: "",
        taxId: "",
        taxLabel: "",
        taxPercent: 0,
        whtId: "",
        whtLabel: "",
        whtPercent: 0,
        taxationServiceId: "",
        taxationName: "",
        taxationText: "",
        showFinancialsInPdf: true,
      },
    ]);
  };

  const setRowSubHeadingText = (rowIndex: number, next: string) => {
    setRows((prev) => {
      const copy = [...prev];
      const r = copy[rowIndex];
      if (!r || !isItemRow(r)) return prev;

      const row = { ...r };
      const txt = String(next ?? "").replace(/\r\n/g, "\n");
      row.subHeadingText = txt;
      row.description = txt;
      row.subHeadings = txt
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean);

      copy[rowIndex] = row;
      return copy;
    });
  };

  const loadTaxCategories = async () => {
    if (taxCategories.length > 0) return;
    setLoadingTax(true);
    try {
      const snapshot = await getDocs(
        collection(db, "Panels", "IEDGE-SYSTEM", "tax"),
      );
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setTaxCategories(data);
    } catch (err) {
      console.error("Error loading tax categories:", err);
    } finally {
      setLoadingTax(false);
    }
  };

  const loadWhtCategories = async () => {
    if (whtCategories.length > 0) return;
    setLoadingWht(true);
    try {
      const snapshot = await getDocs(
        collection(db, "Panels", "IEDGE-SYSTEM", "withholdingTax"),
      );
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setWhtCategories(data);
    } catch (err) {
      console.error("Error loading WHT categories:", err);
    } finally {
      setLoadingWht(false);
    }
  };

  const handleSelectTerms = (id: string) => {
    setSelectedTermsId(id);
    const found = termsConditions.find((x) => x.id === id);
    if (!found) {
      setTermsConditionTitle("");
      setTermsConditionText("");
      return;
    }
    setTermsConditionTitle(found.name);
    setTermsConditionText(
      String(found.description || "").replace(/\r\n/g, "\n"),
    );
  };

  // ✅ dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const rowIds = useMemo(() => rows.map((s) => s.rowId), [rows]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setRows((items) => {
      const oldIndex = items.findIndex((x) => x.rowId === active.id);
      const newIndex = items.findIndex((x) => x.rowId === over.id);
      if (oldIndex < 0 || newIndex < 0) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  // ✅ close taxation dropdown on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!openTaxationRowId) return;
      const el = taxationDropdownRef.current;
      if (el && !el.contains(e.target as any)) setOpenTaxationRowId(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openTaxationRowId]);

  // ✅ Base rate handlers
  const handleBaseRateChange = (
    index: number,
    currency: RateCurrency,
    raw: string,
  ) => {
    const safeText = sanitizeRateText(raw);

    setRows((prev) => {
      const copy = [...prev];
      const r = copy[index];
      if (!r || !isItemRow(r)) return prev;

      const row = { ...r };

      if (currency === "PKR") row.baseRateInput = safeText;
      if (currency === "USD") row.baseRateUsdInput = safeText;
      if (currency === "EUR") row.baseRateEuroInput = safeText;

      const res = evalRateExpression(safeText);

      if (!res.ok) {
        row.baseRateMode = /%\s*$/.test(safeText) ? "percent" : "amount";
        row.baseRate = 0;
        row.baseRateCurrency = currency;
        copy[index] = row;
        return copy;
      }

      row.baseRateMode = res.mode;
      row.baseRateCurrency = currency;

      if (res.mode === "percent") {
        row.baseRate = res.value;
        const formatted = `${fmtDecimal2(res.value)}%`;
        row.baseRateInput = formatted;
        row.baseRateUsdInput = formatted;
        row.baseRateEuroInput = formatted;
        copy[index] = row;
        return copy;
      }

      const fx = getFx(usdRate, euroRate);

      let pkrVal: number | null = null;
      if (currency === "PKR") pkrVal = res.value;
      if (currency === "USD") pkrVal = fx.usd > 0 ? res.value * fx.usd : null;
      if (currency === "EUR") pkrVal = fx.eur > 0 ? res.value * fx.eur : null;

      if (pkrVal == null) {
        copy[index] = row;
        return copy;
      }

      row.baseRate = pkrVal;

      if (currency !== "PKR") row.baseRateInput = fmtDecimal2(pkrVal);

      if (addCurrencies) {
        if (currency !== "USD" && fx.usd > 0)
          row.baseRateUsdInput = fmtDecimal2(pkrVal / fx.usd);
        if (currency !== "EUR" && fx.eur > 0)
          row.baseRateEuroInput = fmtDecimal2(pkrVal / fx.eur);
      }

      copy[index] = row;
      return copy;
    });
  };

  const handleBaseRateBlur = (index: number, currency: RateCurrency) => {
    const current = rows[index];
    if (!current || !isItemRow(current)) return;

    const raw =
      currency === "PKR"
        ? String(current.baseRateInput ?? "")
        : currency === "USD"
          ? String(current.baseRateUsdInput ?? "")
          : String(current.baseRateEuroInput ?? "");

    const trimmed = raw.trim();

    if (trimmed === "") {
      setRows((prev) => {
        const copy = [...prev];
        const r = copy[index];
        if (!r || !isItemRow(r)) return prev;

        const row = { ...r };

        if (currency === "PKR") row.baseRateInput = "";
        if (currency === "USD") row.baseRateUsdInput = "";
        if (currency === "EUR") row.baseRateEuroInput = "";

        const anyLeft = hasAnyBaseRateInput(row);
        if (!anyLeft) {
          row.baseRate = 0;
          row.baseRateMode = "amount";
          row.baseRateCurrency = "PKR";
        }

        copy[index] = row;
        return copy;
      });
      return;
    }

    const res = evalRateExpression(trimmed);
    if (!res.ok) {
      showToast("Invalid rate expression (please check brackets/operators)");
      return;
    }

    const fx = getFx(usdRate, euroRate);

    if (res.mode === "percent") {
      const formatted = `${fmtDecimal2(res.value)}%`;
      setRows((prev) => {
        const copy = [...prev];
        const r = copy[index];
        if (!r || !isItemRow(r)) return prev;

        const row = { ...r };
        row.baseRateMode = "percent";
        row.baseRate = res.value;
        row.baseRateCurrency = currency;

        row.baseRateInput = formatted;
        row.baseRateUsdInput = formatted;
        row.baseRateEuroInput = formatted;

        copy[index] = row;
        return copy;
      });
      return;
    }

    if (currency === "USD" && fx.usd <= 0) {
      showToast(
        `Please enter ${usdCurrency} Rate above to use the ${usdCurrency} field`,
      );
      return;
    }
    if (currency === "EUR" && fx.eur <= 0) {
      showToast(
        `Please enter ${euroCurrency} Rate above to use the ${euroCurrency} field`,
      );
      return;
    }

    let pkrVal = res.value;
    if (currency === "USD") pkrVal = res.value * fx.usd;
    if (currency === "EUR") pkrVal = res.value * fx.eur;

    setRows((prev) => {
      const copy = [...prev];
      const r = copy[index];
      if (!r || !isItemRow(r)) return prev;

      const row = { ...r };

      row.baseRateMode = "amount";
      row.baseRate = pkrVal;
      row.baseRateCurrency = currency;

      row.baseRateInput = fmtDecimal2(pkrVal);
      if (fx.usd > 0) row.baseRateUsdInput = fmtDecimal2(pkrVal / fx.usd);
      if (fx.eur > 0) row.baseRateEuroInput = fmtDecimal2(pkrVal / fx.eur);

      if (currency === "PKR") row.baseRateInput = fmtDecimal2(res.value);
      if (currency === "USD") row.baseRateUsdInput = fmtDecimal2(res.value);
      if (currency === "EUR") row.baseRateEuroInput = fmtDecimal2(res.value);

      copy[index] = row;
      return copy;
    });
  };

  // ✅ FX sync
  useEffect(() => {
    if (!addCurrencies) return;

    const fx = { usd: num(usdRate), eur: num(euroRate) };
    if (fx.usd <= 0 && fx.eur <= 0) return;

    setRows((prev) =>
      prev.map((r) => {
        if (!isItemRow(r)) return r;
        if (!hasAnyBaseRateInput(r)) return r;

        const mode = r.baseRateMode || "amount";
        if (mode === "percent") {
          const val = Number(r.baseRate) || 0;
          const formatted = `${fmtDecimal2(val)}%`;
          return {
            ...r,
            baseRateInput: formatted,
            baseRateUsdInput: formatted,
            baseRateEuroInput: formatted,
          };
        }

        const pkr = Number(r.baseRate) || 0;
        return {
          ...r,
          baseRateUsdInput:
            fx.usd > 0 ? fmtDecimal2(pkr / fx.usd) : r.baseRateUsdInput,
          baseRateEuroInput:
            fx.eur > 0 ? fmtDecimal2(pkr / fx.eur) : r.baseRateEuroInput,
        };
      }),
    );
  }, [addCurrencies, usdRate, euroRate]); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ load existing estimate
  useEffect(() => {
    if (!existingEstimate) return;

    setStatus((existingEstimate as any)?.status ?? "RFQ Sent");
    setApprovalReceivedOn((existingEstimate as any)?.approvalReceivedOn ?? "");
    setWithLogo(Boolean((existingEstimate as any)?.withLogo ?? true));
    setEditId(duplicateMode ? null : (existingEstimate.id ?? null));
    setEstimateNo(duplicateMode ? "" : (existingEstimate.estimateNo ?? ""));
    setClient(existingEstimate.client ?? "");
    setDate(existingEstimate.date ?? "");
    setExpiryDate(existingEstimate.expiryDate ?? "");
    setProjectOwner(existingEstimate.projectOwner ?? "");
    setSubject(existingEstimate.subject ?? "");
    setMessage(existingEstimate.message ?? "");
    setPoNumber((existingEstimate as any).poNumber ?? "");
    setTaxType((existingEstimate as any).taxType ?? "");
    setPaymentTerm((existingEstimate as any).paymentTerm ?? "");
    setCompany((existingEstimate as any).company ?? "");

    setAddCurrencies(
      Boolean((existingEstimate as any)?.addCurrencies ?? false),
    );
    setUsdRate(String((existingEstimate as any)?.usdRate ?? ""));
    setEuroRate(String((existingEstimate as any)?.euroRate ?? ""));
    setUsdCurrency(String((existingEstimate as any)?.usdCurrency || "USD"));
    setEuroCurrency(String((existingEstimate as any)?.euroCurrency || "EUR"));

    const savedId =
      (existingEstimate as any)?.termsConditionId ||
      (existingEstimate as any)?.selectedTermsId ||
      "";
    const savedTitle =
      (existingEstimate as any)?.termsConditionTitle ||
      (existingEstimate as any)?.termsTitle ||
      "";
    const savedText =
      (existingEstimate as any)?.termsConditionText ||
      (existingEstimate as any)?.termsCondition ||
      "";

    setSelectedTermsId(savedId);
    setTermsConditionTitle(savedTitle);
    setTermsConditionText(savedText);

    setPackageIncludesText(
      String((existingEstimate as any)?.packageIncludesText || ""),
    );
    setPackageExcludesText(
      String((existingEstimate as any)?.packageExcludesText || ""),
    );

    const savedRows = (existingEstimate.services || []).map((s: any) => {
      const rowType: RowType =
        (s.rowType as RowType) ||
        (s.type as RowType) ||
        (typeof s.mainHeading === "string" && s.mainHeading.trim()
          ? "main"
          : "item");

      if (rowType === "main") {
        return {
          rowId: s.rowId || makeRowId(),
          rowType: "main",
          mainHeading: String(s.mainHeading ?? s.detail ?? "").replace(
            /\r\n/g,
            "\n",
          ),
          showFinancialsInPdf: false,
        } as MainHeadingRow;
      }

      const subHeadingText = deriveSubHeadingText(s);

      return {
        rowId: s.rowId || makeRowId(),
        rowType: "item",
        detail: s.detail ?? "",

        subHeadingText,
        description: subHeadingText,
        subHeadings: subHeadingText
          .split("\n")
          .map((x: string) => x.trim())
          .filter(Boolean),

        units:
          typeof s.units === "number" ? s.units : Number(s.units ?? 1) || 1,
        unitsInput:
          typeof s.units === "number"
            ? fmtIntLoose(s.units)
            : String(s.unitsInput ?? "1"),

        daysNights:
          typeof s.daysNights === "number"
            ? s.daysNights
            : Number(s.daysNights ?? 1) || 1,
        daysNightsInput:
          typeof s.daysNights === "number"
            ? fmtIntLoose(s.daysNights)
            : String(s.daysNightsInput ?? "1"),

        persons:
          typeof s.persons === "number"
            ? s.persons
            : Number(s.persons ?? 1) || 1,
        personsInput:
          typeof s.persons === "number"
            ? fmtIntLoose(s.persons)
            : String(s.personsInput ?? "1"),

        baseRate:
          typeof s.baseRate === "number"
            ? Number(s.baseRate)
            : typeof s.rate === "number"
              ? Number(s.rate)
              : 0,

        baseRateMode: s.baseRateMode ?? s.rateMode ?? "amount",
        baseRateInput: s.baseRateInput ?? s.rateInput ?? "",
        baseRateUsdInput: s.baseRateUsdInput ?? s.rateUsdInput ?? "",
        baseRateEuroInput: s.baseRateEuroInput ?? s.rateEuroInput ?? "",
        baseRateCurrency: s.baseRateCurrency ?? s.rateCurrency ?? "PKR",

        profitPercent:
          typeof s.profitPercent === "number"
            ? s.profitPercent
            : Number(s.profitPercent ?? 0) || 0,
        profitPercentInput: String(s.profitPercentInput ?? ""),

        taxId: s.taxId ?? "",
        taxLabel: s.taxLabel ?? "",
        taxPercent: typeof s.taxPercent === "number" ? s.taxPercent : 0,

        whtId: s.whtId ?? "",
        whtLabel: s.whtLabel ?? "",
        whtPercent: typeof s.whtPercent === "number" ? s.whtPercent : 0,

        taxationServiceId: String(s.taxationServiceId ?? ""),
        taxationName: String(s.taxationName ?? ""),
        taxationText: String(s.taxationText ?? ""),

        showFinancialsInPdf:
          typeof s.showFinancialsInPdf === "boolean"
            ? s.showFinancialsInPdf
            : true,

        persistedFinancials: s.persistedFinancials ?? null,
        multiplier: s.multiplier ?? null,
        supplierRatePKR: s.supplierRatePKR ?? null,
        profitRatePKR: s.profitRatePKR ?? null,
        sellRatePKR: s.sellRatePKR ?? null,
        sellBasePKR: s.sellBasePKR ?? null,
        supplierCostPKR: s.supplierCostPKR ?? null,
        taxAmountPKR: s.taxAmountPKR ?? null,
        totalCostPKR: s.totalCostPKR ?? null,
        whtAmountPKR: s.whtAmountPKR ?? null,
        amountPKR: s.amountPKR ?? null,
        currency1: s.currency1 ?? null,
        currency2: s.currency2 ?? null,
      } as ItemRow;
    });

    setRows(savedRows.length ? (savedRows as ServiceRow[]) : initialRows);

    setSelectedClient({
      name: existingEstimate.client ?? "",
      address: (existingEstimate as any).address ?? "",
      addtionalInfo: (existingEstimate as any).info ?? "",
    });
  }, [existingEstimate, duplicateMode, initialRows]);

  // ✅ load clients
  useEffect(() => {
    const q = query(collection(db, "Panels", "IEDGE-SYSTEM", "clients"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClients(
        snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          name: docSnap.data().name,
          address: docSnap.data().address || "",
          addtionalInfo: docSnap.data().addtionalInfo || "",
        })),
      );
    });
    return () => unsubscribe();
  }, []);

  // ✅ load services for Taxation dropdown
  useEffect(() => {
    const q = query(collection(db, "Panels", "IEDGE-SYSTEM", "services"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data() as any;
          const name = String(data?.name ?? data?.title ?? "").trim();
          const description = String(
            data?.description ?? data?.details ?? "",
          ).replace(/\r\n/g, "\n");
          return { id: docSnap.id, name, description };
        })
        .filter((x) => x.name);
      setServicesList(list);
    });
    return () => unsubscribe();
  }, []);

  // ✅ load payment terms
  useEffect(() => {
    const q = query(collection(db, "Panels", "IEDGE-SYSTEM", "paymentTerms"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const terms = snapshot.docs
        .map((d) => String(d.data().name || "").trim())
        .filter(Boolean);
      setPaymentTerms(terms);
    });
    return () => unsubscribe();
  }, []);

  // ✅ load logged in user
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const userRef = doc(db, "Panels", "IEDGE-SYSTEM", "users", uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (!snap.exists()) {
        setLoggedInUser(null);
        return;
      }
      setLoggedInUser(snap.data() as any);
    });
    return () => unsubscribe();
  }, []);

  // ✅ load terms conditions
  useEffect(() => {
    const q = query(
      collection(db, "Panels", "IEDGE-SYSTEM", "termsConditions"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: TermsConditionDoc[] = snapshot.docs
        .map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: String(data?.name || "").trim(),
            description: String(data?.description || "").replace(/\r\n/g, "\n"),
          };
        })
        .filter((x) => x.name);

      setTermsConditions(list);

      if (selectedTermsId && !termsConditionTitle) {
        const found = list.find((x) => x.id === selectedTermsId);
        if (found) setTermsConditionTitle(found.name);
      }
    });

    return () => unsubscribe();
  }, [selectedTermsId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ Package templates
  useEffect(() => {
    const incQ = query(
      collection(db, "Panels", "IEDGE-SYSTEM", "packageIncludes"),
    );
    const excQ = query(
      collection(db, "Panels", "IEDGE-SYSTEM", "packageExcludes"),
    );

    const unsubInc = onSnapshot(incQ, (snap) => {
      if (loadedPkgTemplateRef.current.inc) return;
      const alreadyHas = String(packageIncludesText || "").trim().length > 0;
      if (alreadyHas) {
        loadedPkgTemplateRef.current.inc = true;
        return;
      }
      const rows = snap.docs
        .map((d) => {
          const data = d.data() as any;
          return String(
            data?.description ?? data?.text ?? data?.name ?? "",
          ).trim();
        })
        .filter(Boolean);

      if (rows.length > 0) setPackageIncludesText(rows.join("\n"));
      loadedPkgTemplateRef.current.inc = true;
    });

    const unsubExc = onSnapshot(excQ, (snap) => {
      if (loadedPkgTemplateRef.current.exc) return;
      const alreadyHas = String(packageExcludesText || "").trim().length > 0;
      if (alreadyHas) {
        loadedPkgTemplateRef.current.exc = true;
        return;
      }
      const rows = snap.docs
        .map((d) => {
          const data = d.data() as any;
          return String(
            data?.description ?? data?.text ?? data?.name ?? "",
          ).trim();
        })
        .filter(Boolean);

      if (rows.length > 0) setPackageExcludesText(rows.join("\n"));
      loadedPkgTemplateRef.current.exc = true;
    });

    return () => {
      unsubInc();
      unsubExc();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ If Tax Type is "none", force all item-row taxes to 0/blank
  useEffect(() => {
    if (taxType !== "none") return;
    setRows((prev) =>
      prev.map((r) => {
        if (!isItemRow(r)) return r;
        return { ...r, taxId: "", taxLabel: "", taxPercent: 0 };
      }),
    );
  }, [taxType]);

  // ✅ Live totals
  const liveTotals = useMemo(() => {
    let liveSubtotal = 0;
    let liveTax = 0;
    let liveTotal = 0;
    let liveWht = 0;

    for (const r of rows) {
      if (!isItemRow(r)) continue;

      const line = calcLine(r);
      liveTax += line.taxAmount;

      const wht = calcWhtAmount(r);
      liveWht += wht;
      liveTotal += line.lineTotal + wht;

      if (taxType === "inclusive") liveSubtotal += line.base - line.taxAmount;
      else liveSubtotal += line.base;
    }

    return { liveSubtotal, liveTax, liveWht, liveTotal };
  }, [
    rows,
    taxType,
    usdRate,
    euroRate,
    addCurrencies,
    usdCurrency,
    euroCurrency,
  ]);

  const c1 = getCurrencyMeta(usdCurrency);
  const c2 = getCurrencyMeta(euroCurrency);

  const safeSetCurrency1 = (code: string) => {
    setUsdCurrency(code);
    if (code === euroCurrency) setEuroCurrency(code === "USD" ? "EUR" : "USD");
  };

  const safeSetCurrency2 = (code: string) => {
    setEuroCurrency(code);
    if (code === usdCurrency) setUsdCurrency(code === "EUR" ? "USD" : "EUR");
  };

  const invalidClient = submitAttempted && !String(client || "").trim();
  const invalidDate = submitAttempted && !String(date || "").trim();
  const invalidExpiry = submitAttempted && !String(expiryDate || "").trim();
  const invalidOwner = submitAttempted && !String(projectOwner || "").trim();
  const invalidPayment = submitAttempted && !String(paymentTerm || "").trim();
  const invalidCompany = submitAttempted && !String(company || "").trim();
  const invalidTaxType = submitAttempted && !String(taxType || "").trim();
  const invalidSubject = submitAttempted && !String(subject || "").trim();
  const invalidTerms = submitAttempted && !String(selectedTermsId || "").trim();
  const invalidTermsText =
    submitAttempted && !String(termsConditionText || "").trim();
  const invalidUsd =
    submitAttempted && addCurrencies && !String(usdRate || "").trim();
  const invalidEuro =
    submitAttempted && addCurrencies && !String(euroRate || "").trim();

  // ✅ VERTICAL STACK READ component
  const StackRead = ({
    usd,
    eur,
    pkr,
    usdLabel,
    eurLabel,
  }: {
    usd: number | null;
    eur: number | null;
    pkr: number;
    usdLabel: string;
    eurLabel: string;
  }) => (
    <div className="flex flex-col gap-1 items-start">
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-gray-500 w-12 text-right">
          {usdLabel}
        </span>
        <span className="text-xs tabular-nums w-[120px] text-right block">
          {usd == null ? "—" : `${c1.symbol} ${formatMoney(usd)}`}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-gray-500 w-12 text-right">
          {eurLabel}
        </span>
        <span className="text-xs tabular-nums w-[120px] text-right block">
          {eur == null ? "—" : `${c2.symbol} ${formatMoney(eur)}`}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-gray-500 w-12 text-right">PKR</span>
        <span className="text-xs tabular-nums w-[120px] text-right block">
          {formatMoney(pkr)}
        </span>
      </div>
    </div>
  );

  // ✅ Create Preview
  const handlePreviewPdf = async () => {
    try {
      const fx = getFx(usdRate, euroRate);

      // Build sanitized rows exactly like save
      const sanitizedRows = rows.map((r) => {
        if (isMainRow(r)) {
          const mh = String(r.mainHeading ?? "").replace(/\r\n/g, "\n");
          return {
            rowId: r.rowId,
            rowType: "main",
            mainHeading: mh,
            detail: mh,
            showFinancialsInPdf: false,
          } as any;
        }

        const subText = String(r.subHeadingText ?? "").replace(/\r\n/g, "\n");
        const subArr = subText
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean);

        const persisted = computePersistedFinancials(
          r,
          taxType,
          addCurrencies,
          usdRate,
          euroRate,
          usdCurrency,
          euroCurrency,
        );

        return {
          ...r,
          rowType: "item",
          subHeadingText: subText,
          description: subText,
          subHeadings: subArr,

          // persist all columns
          persistedFinancials: persisted,
          multiplier: persisted.multiplier,
          supplierRatePKR: persisted.supplierRatePKR,
          profitRatePKR: persisted.profitRatePKR,
          sellRatePKR: persisted.sellRatePKR,
          sellBasePKR: persisted.sellBasePKR,
          supplierCostPKR: persisted.supplierCostPKR,
          taxAmountPKR: persisted.taxAmountPKR,
          totalCostPKR: persisted.totalCostPKR,
          whtAmountPKR: persisted.whtAmountPKR,
          amountPKR: persisted.amountPKR,
          currency1: persisted.currency1,
          currency2: persisted.currency2,
        } as any;
      });

      // overall totals
      let subtotal = 0;
      let tax = 0;
      let total = 0;
      let whtTotal = 0;

      for (const r of rows) {
        if (!isItemRow(r)) continue;
        const persisted = computePersistedFinancials(
          r,
          taxType,
          addCurrencies,
          usdRate,
          euroRate,
          usdCurrency,
          euroCurrency,
        );
        tax += persisted.taxAmountPKR || 0;
        whtTotal += persisted.whtAmountPKR || 0;
        total += (persisted.totalCostPKR || 0) + (persisted.whtAmountPKR || 0);

        if (taxType === "inclusive")
          subtotal +=
            (persisted.sellBasePKR || 0) - (persisted.taxAmountPKR || 0);
        else subtotal += persisted.sellBasePKR || 0;
      }

      const totalsPersisted = {
        pkr: { subtotal, tax, wht: whtTotal, total },
        currency1: {
          code: usdCurrency,
          rate: addCurrencies ? fx.usd : 0,
          subtotal: addCurrencies && fx.usd > 0 ? subtotal / fx.usd : null,
          tax: addCurrencies && fx.usd > 0 ? tax / fx.usd : null,
          wht: addCurrencies && fx.usd > 0 ? whtTotal / fx.usd : null,
          total: addCurrencies && fx.usd > 0 ? total / fx.usd : null,
        },
        currency2: {
          code: euroCurrency,
          rate: addCurrencies ? fx.eur : 0,
          subtotal: addCurrencies && fx.eur > 0 ? subtotal / fx.eur : null,
          tax: addCurrencies && fx.eur > 0 ? tax / fx.eur : null,
          wht: addCurrencies && fx.eur > 0 ? whtTotal / fx.eur : null,
          total: addCurrencies && fx.eur > 0 ? total / fx.eur : null,
        },
      };

      const estimateForPdf = {
        id: editId || undefined,
        estimateNo: estimateNo || "",
        client,
        date,
        expiryDate,
        projectOwner,
        subject,
        message,
        poNumber,
        status,
        approvalReceivedOn,
        taxType,
        paymentTerm,
        company,
        addCurrencies,
        usdRate,
        euroRate,
        usdCurrency,
        euroCurrency,
        termsConditionId: selectedTermsId,
        termsConditionTitle,
        termsConditionText,
        packageIncludesText,
        packageExcludesText,
        services: sanitizedRows,
        totalsPersisted,
        address: selectedClient?.address || "",
        info: selectedClient?.addtionalInfo || "",
      };

      const blob = await buildEstimatePdfBlob({
        estimate: estimateForPdf,
        withLogo,
        companyName: company,
        companyList,
        footerUser: loggedInUser,
      });

      const url = URL.createObjectURL(blob);
      setPreviewURL(url);
      setIsPreviewOpen(true);
    } catch (e) {
      console.error(e);
      showToast("Could not generate PDF preview");
    }
  };

  // ✅ Save
  const handleSave = async () => {
    if (savingRef.current) return;
    savingRef.current = true;

    setSubmitAttempted(true);

    const requiredFields = [
      { value: client, name: "Client" },
      { value: date, name: "Issue Date" },
      { value: expiryDate, name: "Expiry Date" },
      { value: projectOwner, name: "Project Owner" },
      { value: subject, name: "Subject" },
      { value: paymentTerm, name: "Payment Terms" },
      { value: company, name: "Company" },
      { value: taxType, name: "Tax Type" },
      { value: selectedTermsId, name: "Terms & Conditions" },
      { value: termsConditionText, name: "Terms & Conditions Text" },
      { value: status, name: "Status" },
    ];

    if (addCurrencies) {
      requiredFields.push({ value: usdRate, name: `${usdCurrency} Rate` });
      requiredFields.push({ value: euroRate, name: `${euroCurrency} Rate` });
    }

    const missing = requiredFields.filter((f) => !String(f.value ?? "").trim());
    if (missing.length > 0) {
      showToast(`${missing[0].name} is required`);
      savingRef.current = false;
      return;
    }

    // validate ITEM rows
    const rowMissing = rows.find((r) => {
      if (!isItemRow(r)) return false;

      const missingService = !String(r.detail || "").trim();
      const unitsRaw = String(r.unitsInput ?? "").trim();
      const daysRaw = String(r.daysNightsInput ?? "").trim();
      const personsRaw = String(r.personsInput ?? "").trim();
      const missingUnits = unitsRaw === "";
      const missingDays = daysRaw === "";
      const missingPersons = personsRaw === "";
      const missingRate = !hasAnyBaseRateInput(r);
      const missingTax =
        taxType !== "none" ? !String(r.taxId || "").trim() : false;

      return (
        missingService ||
        missingUnits ||
        missingDays ||
        missingPersons ||
        missingRate ||
        missingTax
      );
    });

    if (rowMissing && isItemRow(rowMissing)) {
      if (!String(rowMissing.detail || "").trim())
        showToast("Heading is required");
      else if (String(rowMissing.unitsInput ?? "").trim() === "")
        showToast("Units is required");
      else if (String(rowMissing.daysNightsInput ?? "").trim() === "")
        showToast("Days / Nights is required");
      else if (String(rowMissing.personsInput ?? "").trim() === "")
        showToast("Persons is required");
      else if (!hasAnyBaseRateInput(rowMissing)) showToast("Rate is required");
      else if (taxType !== "none" && !String(rowMissing.taxId || "").trim())
        showToast("Tax is required");
      savingRef.current = false;
      return;
    }

    setLoading(true);

    try {
      // Totals
      let subtotal = 0;
      let tax = 0;
      let total = 0;
      let whtTotal = 0;

      for (const r of rows) {
        if (!isItemRow(r)) continue;
        const persisted = computePersistedFinancials(
          r,
          taxType,
          addCurrencies,
          usdRate,
          euroRate,
          usdCurrency,
          euroCurrency,
        );
        tax += persisted.taxAmountPKR || 0;
        whtTotal += persisted.whtAmountPKR || 0;
        total += (persisted.totalCostPKR || 0) + (persisted.whtAmountPKR || 0);

        if (taxType === "inclusive")
          subtotal +=
            (persisted.sellBasePKR || 0) - (persisted.taxAmountPKR || 0);
        else subtotal += persisted.sellBasePKR || 0;
      }

      const fx = getFx(usdRate, euroRate);
      const totalsPersisted = {
        pkr: { subtotal, tax, wht: whtTotal, total },
        currency1: {
          code: usdCurrency,
          rate: addCurrencies ? fx.usd : 0,
          subtotal: addCurrencies && fx.usd > 0 ? subtotal / fx.usd : null,
          tax: addCurrencies && fx.usd > 0 ? tax / fx.usd : null,
          wht: addCurrencies && fx.usd > 0 ? whtTotal / fx.usd : null,
          total: addCurrencies && fx.usd > 0 ? total / fx.usd : null,
        },
        currency2: {
          code: euroCurrency,
          rate: addCurrencies ? fx.eur : 0,
          subtotal: addCurrencies && fx.eur > 0 ? subtotal / fx.eur : null,
          tax: addCurrencies && fx.eur > 0 ? tax / fx.eur : null,
          wht: addCurrencies && fx.eur > 0 ? whtTotal / fx.eur : null,
          total: addCurrencies && fx.eur > 0 ? total / fx.eur : null,
        },
      };

      // Rows (persist everything)
      const sanitizedRows = rows.map((r) => {
        if (isMainRow(r)) {
          const mh = String(r.mainHeading ?? "").replace(/\r\n/g, "\n");
          return {
            rowId: r.rowId,
            rowType: "main",
            mainHeading: mh,
            detail: mh,
            showFinancialsInPdf: false,
          } as any;
        }

        const subText = String(r.subHeadingText ?? "").replace(/\r\n/g, "\n");
        const subArr = subText
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean);

        const persisted = computePersistedFinancials(
          r,
          taxType,
          addCurrencies,
          usdRate,
          euroRate,
          usdCurrency,
          euroCurrency,
        );

        return {
          ...r,
          rowType: "item",
          subHeadingText: subText,
          description: subText,
          subHeadings: subArr,

          // Keep compat fields too
          rate: persisted.supplierRatePKR, // supplier per-unit (PKR)
          rateMode: r.baseRateMode || "amount",

          // numeric normalization
          units: Number(r.units) || 0,
          daysNights: Number(r.daysNights) || 0,
          persons: Number(r.persons) || 0,

          baseRate: Number(r.baseRate) || 0,
          baseRateMode: r.baseRateMode || "amount",
          baseRateCurrency: r.baseRateCurrency || "PKR",

          profitPercent: Number(r.profitPercent) || 0,

          taxId: r.taxId || "",
          taxLabel: r.taxLabel || "",
          taxPercent: typeof r.taxPercent === "number" ? r.taxPercent : 0,

          whtId: r.whtId || "",
          whtLabel: r.whtLabel || "",
          whtPercent: typeof r.whtPercent === "number" ? r.whtPercent : 0,

          taxationServiceId: String(r.taxationServiceId ?? ""),
          taxationName: String(r.taxationName ?? ""),
          taxationText: String(r.taxationText ?? ""),

          showFinancialsInPdf: r.showFinancialsInPdf !== false,

          // persisted
          persistedFinancials: persisted,
          multiplier: persisted.multiplier,
          supplierRatePKR: persisted.supplierRatePKR,
          profitRatePKR: persisted.profitRatePKR,
          sellRatePKR: persisted.sellRatePKR,
          sellBasePKR: persisted.sellBasePKR,
          supplierCostPKR: persisted.supplierCostPKR,
          taxAmountPKR: persisted.taxAmountPKR,
          totalCostPKR: persisted.totalCostPKR,
          whtAmountPKR: persisted.whtAmountPKR,
          amountPKR: persisted.amountPKR,
          currency1: persisted.currency1,
          currency2: persisted.currency2,
        } as any;
      });

      // ✅ createdBy / updatedBy (store logged-in user info)
      const authUser = auth.currentUser;

      const userName =
        String(loggedInUser?.displayName || "").trim() ||
        String(authUser?.displayName || "").trim() ||
        String(loggedInUser?.email || "").trim() ||
        String(authUser?.email || "").trim() ||
        "";

      const userEmail =
        String(loggedInUser?.email || "").trim() ||
        String(authUser?.email || "").trim() ||
        "";

      const userUid = authUser?.uid || "";

      const userMobile =
        String(loggedInUser?.mobile || "").trim() ||
        (String(loggedInUser?.mobileCountryCode || "").trim() &&
        String(loggedInUser?.mobileNo || "").trim()
          ? `${String(loggedInUser?.mobileCountryCode || "").trim()}${String(loggedInUser?.mobileNo || "").trim()}`
          : "") ||
        String(loggedInUser?.mobileNo || "").trim() ||
        "";

      const actor = {
        uid: userUid,
        displayName: userName, // ✅ add this
        name: userName, // keep for compatibility
        email: userEmail,
        mobile: userMobile,
      };
      // Estimate payload
      const payload: any = {
        client,
        date,
        expiryDate,
        projectOwner,
        subject,
        message,
        poNumber,
        status,
        approvalReceivedOn,
        taxType,
        paymentTerm,
        company,
        withLogo,
        addCurrencies,
        usdRate,
        euroRate,
        usdCurrency,
        euroCurrency,

        termsConditionId: selectedTermsId,
        termsConditionTitle,
        termsConditionText,
        packageIncludesText,
        packageExcludesText,

        services: sanitizedRows,
        totalsPersisted,

        address: selectedClient?.address || "",
        info: selectedClient?.addtionalInfo || "",
        updatedBy: actor,
        updatedByName: userName,
        updatedByUid: userUid,
        updatedAt: serverTimestamp(),
      };

      // Create / Update
      if (editId) {
        const ref = doc(ESTIMATES_COL, editId);
        await updateDoc(ref, payload);
        showToast("Estimate updated successfully");
        onSave?.({ ...(existingEstimate as any), ...payload, id: editId });
      } else {
        // Generate estimate number via transaction counter
        const newEstimateNo = await runTransaction(db, async (tx) => {
          const cSnap = await tx.get(COUNTER_DOC);
          let next = 1;
          if (!cSnap.exists()) {
            tx.set(COUNTER_DOC, {
              seq: 1,
              updatedAt: serverTimestamp(),
            } as any);
            next = 1;
          } else {
            const seq = Number((cSnap.data() as any)?.seq ?? 0);
            next = seq + 1;
            tx.update(COUNTER_DOC, {
              seq: increment(1),
              updatedAt: serverTimestamp(),
            } as any);
          }
          // Format as INTL-000001 (adjust format if you want)
          return `IE-INTL-${String(next).padStart(6, "0")}`;
        });
        payload.estimateNo = newEstimateNo;
        payload.createdAt = serverTimestamp();
        payload.createdBy = actor;
        payload.createdByName = userName;
        payload.createdByUid = userUid;

        const created = await addDoc(ESTIMATES_COL, payload);
        setEditId(created.id);
        setEstimateNo(newEstimateNo);

        showToast("Estimate saved successfully");
        onSave?.({ ...(payload as any), id: created.id });
      }
    } catch (e) {
      console.error(e);
      showToast("Could not save estimate (check console for details)");
    } finally {
      setLoading(false);
      savingRef.current = false;
    }
  };

  const cMeta1 = getCurrencyMeta(usdCurrency);
  const cMeta2 = getCurrencyMeta(euroCurrency);

  // ====== Table column helpers for current row ======
  const getStackNumbers = (pkr: number) => {
    const fx = getFx(usdRate, euroRate);
    const usd = addCurrencies && fx.usd > 0 ? pkr / fx.usd : null;
    const eur = addCurrencies && fx.eur > 0 ? pkr / fx.eur : null;
    return { usd, eur };
  };

  // ========================== UI ==========================
  return (
    <div className="px-4 space-y-3 bg-gray-50 min-h-screen pb-24">
      <style>{`
        @keyframes blinkRedBorder {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); border-color: rgb(209, 213, 219); }
          50% { box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.35); border-color: rgb(239, 68, 68); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); border-color: rgb(209, 213, 219); }
        }
        .blink-red { animation: blinkRedBorder 0.9s ease-in-out infinite; border-color: rgb(239, 68, 68) !important; }
      `}</style>

      {/* BASIC INFORMATION */}
      <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
        <h3 className="text-sm font-semibold mb-2 text-gray-700">
          Basic Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Estimate No
            </label>
            <input
              value={estimateNo || "Will be assigned on Save"}
              readOnly
              className="w-full rounded-lg border border-gray-300 p-2 text-sm bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Client
            </label>
            <select
              className={fieldClass(
                "w-full rounded-lg border border-gray-300 p-2 text-sm",
                invalidClient,
              )}
              value={client}
              onChange={(e) => {
                const selected = clients.find((c) => c.name === e.target.value);
                setClient(e.target.value);
                setSelectedClient(selected || null);
              }}
            >
              <option value="">Select Client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            {selectedClient && (
              <div className="mt-2 bg-blue-50 border border-blue-200 p-2 rounded-lg text-xs text-gray-700">
                <p>
                  <span className="font-medium">Address:</span>{" "}
                  {selectedClient.address || "—"}
                </p>
                <p>
                  <span className="font-medium">Additional Info:</span>{" "}
                  {selectedClient.addtionalInfo || "—"}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Issue Date
            </label>
            <input
              type="date"
              className={fieldClass(
                "w-full rounded-lg border border-gray-300 p-2 text-sm",
                invalidDate,
              )}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Expiry Date
            </label>
            <input
              type="date"
              className={fieldClass(
                "w-full rounded-lg border border-gray-300 p-2 text-sm accent-black",
                invalidExpiry,
              )}
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Project Owner
            </label>
            <input
              className={fieldClass(
                "w-full rounded-lg border border-gray-300 p-2 text-sm",
                invalidOwner,
              )}
              value={projectOwner}
              onChange={(e) => setProjectOwner(e.target.value)}
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Payment Terms
            </label>
            <select
              className={fieldClass(
                "w-full border border-gray-300 rounded-lg p-2 text-sm whitespace-normal",
                invalidPayment,
              )}
              value={paymentTerm}
              onChange={(e) => setPaymentTerm(e.target.value)}
            >
              <option value="">Select Payment Term</option>
              {paymentTerms.map((term, i) => (
                <option key={i} value={term}>
                  {term}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Select Company
            </label>
            <div className="flex items-center gap-2">
              <input
                list="company-list-options"
                className={fieldClass(
                  "flex-1 border border-gray-300 rounded-lg p-2 text-sm",
                  invalidCompany,
                )}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Type or select Company"
              />
              <label className="flex items-center gap-1 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={withLogo}
                  onChange={(e) => setWithLogo(e.target.checked)}
                  className="accent-black"
                />
                With Logo
              </label>
            </div>
            <datalist id="company-list-options">
              {companyList.map((c, i) => (
                <option key={i} value={c.name} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Tax Type
            </label>
            <select
              value={taxType}
              onChange={(e) => setTaxType(e.target.value)}
              className={fieldClass(
                "w-full border border-gray-300 rounded-lg p-2 text-sm accent-black",
                invalidTaxType,
              )}
              onFocus={loadTaxCategories}
            >
              <option value="">Select Tax Type</option>
              <option value="inclusive">Inclusive</option>
              <option value="exclusive">Exclusive</option>
              <option value="none">Not Applicable</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Subject
            </label>
            <input
              className={fieldClass(
                "w-full rounded-lg border border-gray-300 p-2 text-sm",
                invalidSubject,
              )}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              PO Number
            </label>
            <input
              className="w-full rounded-lg border border-gray-300 p-2 text-sm"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Status
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg p-2 text-sm accent-black"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="RFQ Sent">RFQ Sent</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Project Cancelled">Project Cancelled</option>
              <option value="Invoiced">Invoiced</option>
              <option value="Payment Received">Payment Received</option>
              <option value="PO Received">PO Received</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Approval received on email
            </label>
            <input
              type="date"
              className="w-full rounded-lg border border-gray-300 p-2 text-sm"
              value={approvalReceivedOn}
              onChange={(e) => setApprovalReceivedOn(e.target.value)}
            />
          </div>

          <div className="mt-1 col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <input
                type="checkbox"
                checked={addCurrencies}
                onChange={(e) => setAddCurrencies(e.target.checked)}
                className="accent-black"
              />
              Add Currencies
            </label>

            {addCurrencies ? (
              <div className="mt-2 grid grid-cols-2 gap-2 min-w-40">
                <div className="border rounded-lg p-2 bg-gray-50">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-medium text-gray-600">
                      Currency 1
                    </label>
                    <select
                      value={usdCurrency}
                      onChange={(e) => safeSetCurrency1(e.target.value)}
                      className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white"
                    >
                      {CURRENCY_OPTIONS.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} ({c.symbol}) — {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-2">
                    <label className="block text-[11px] text-gray-600 mb-1">
                      Rate (PKR per 1 {usdCurrency})
                    </label>
                    <input
                      inputMode="decimal"
                      value={usdRate}
                      onChange={(e) => setUsdRate(e.target.value)}
                      className={fieldClass(
                        "w-full rounded-md border border-gray-300 p-2 text-sm",
                        invalidUsd,
                      )}
                      placeholder="e.g. 280"
                    />
                  </div>
                </div>

                <div className="border rounded-lg p-2 bg-gray-50">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-medium text-gray-600">
                      Currency 2
                    </label>
                    <select
                      value={euroCurrency}
                      onChange={(e) => safeSetCurrency2(e.target.value)}
                      className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white"
                    >
                      {CURRENCY_OPTIONS.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} ({c.symbol}) — {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-2">
                    <label className="block text-[11px] text-gray-600 mb-1">
                      Rate (PKR per 1 {euroCurrency})
                    </label>
                    <input
                      inputMode="decimal"
                      value={euroRate}
                      onChange={(e) => setEuroRate(e.target.value)}
                      className={fieldClass(
                        "w-full rounded-md border border-gray-300 p-2 text-sm",
                        invalidEuro,
                      )}
                      placeholder="e.g. 305"
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* SERVICES */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-gray-700">Services</h3>

          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-600 bg-gray-50 border rounded-lg px-3 py-2">
              <span className="font-semibold">Overall Total:</span>{" "}
              <span className="tabular-nums">
                {formatMoney(liveTotals.liveTotal)}
              </span>{" "}
              <span className="text-[10px] text-gray-500">PKR</span>
            </div>

            <Button type="button" variant="outline" onClick={handlePreviewPdf}>
              <Eye size={16} className="mr-2" />
              Preview PDF
            </Button>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div
            className="overflow-x-auto pb-4"
            style={
              {
                scrollbarGutter: "stable",
                WebkitOverflowScrolling: "touch",
              } as any
            }
          >
            <table className="w-full min-w-[2450px] border-collapse text-sm">
              <thead>
                {/* DARK TEAL HEADER */}
                <tr
                  style={{ backgroundColor: "#0f4c5c" }}
                  className="text-white"
                >
                  <th className="p-2 font-semibold border-b w-10 text-center">
                    ↕
                  </th>
                  <th className="p-2 font-semibold border-b w-[520px]">
                    Services
                  </th>

                  <th className="p-2 font-semibold border-b text-center w-[220px]">
                    Services Rate
                  </th>
                  <th className="p-2 font-semibold border-b text-center w-[110px]">
                    Profit %
                  </th>

                  <th className="p-2 font-semibold border-b text-center w-[90px]">
                    Units
                  </th>
                  <th className="p-2 font-semibold border-b text-center w-[130px]">
                    Days / Nights
                  </th>
                  <th className="p-2 font-semibold border-b text-center w-[110px]">
                    Persons
                  </th>

                  <th className="p-2 font-semibold border-b text-center w-[220px]">
                    Profit Rate
                  </th>
                  <th className="p-2 font-semibold border-b text-center w-[220px]">
                    Cost
                  </th>
                  <th className="p-2 font-semibold border-b text-center w-[220px]">
                    Total Cost
                  </th>

                  <th className="p-2 font-semibold border-b text-center w-[220px]">
                    Tax
                  </th>
                  <th className="p-2 font-semibold border-b text-center w-[220px]">
                    WHT
                  </th>
                  <th className="p-2 font-semibold border-b text-center w-[220px]">
                    Amount
                  </th>

                  <th className="p-2 font-semibold border-b text-center w-[320px]">
                    Taxation
                  </th>
                  <th className="p-2 font-semibold border-b text-center w-[80px]">
                    PDF
                  </th>
                  <th className="p-2 font-semibold border-b text-center w-12"></th>
                </tr>

                {/* LIGHT BLUE RATE STRIP */}
                <tr className="bg-[#d9eef2] text-gray-800">
                  <th className="p-2 border-b" />
                  <th className="p-2 border-b" />
                  <th className="p-2 border-b text-center text-xs">
                    {addCurrencies ? (
                      <div className="flex flex-col gap-0.5 items-center">
                        <div>
                          {usdCurrency} {usdRate ? usdRate : "—"}
                        </div>
                        <div>
                          {euroCurrency} {euroRate ? euroRate : "—"}
                        </div>
                        <div>PKR</div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-600">
                        Enable “Add Currencies” to show stack
                      </div>
                    )}
                  </th>
                  <th className="p-2 border-b text-center text-xs" />
                  <th className="p-2 border-b text-center text-xs" />
                  <th className="p-2 border-b text-center text-xs" />
                  <th className="p-2 border-b text-center text-xs" />
                  <th className="p-2 border-b" />
                  <th className="p-2 border-b" />
                  <th className="p-2 border-b" />
                  <th className="p-2 border-b" />
                  <th className="p-2 border-b" />
                  <th className="p-2 border-b" />
                  <th className="p-2 border-b" />
                  <th className="p-2 border-b" />
                  <th className="p-2 border-b" />
                </tr>
              </thead>

              <SortableContext
                items={rowIds}
                strategy={verticalListSortingStrategy}
              >
                <tbody>
                  {rows.map((r, i) => {
                    const fx = getFx(usdRate, euroRate);

                    // ✅ MAIN HEADING ROW
                    if (isMainRow(r)) {
                      const sectionTotal =
                        sectionTotalsByMainRowId[r.rowId] ?? 0;
                      const sectionUsd =
                        addCurrencies && fx.usd > 0
                          ? sectionTotal / fx.usd
                          : null;
                      const sectionEur =
                        addCurrencies && fx.eur > 0
                          ? sectionTotal / fx.eur
                          : null;

                      return (
                        <SortableRow
                          key={r.rowId}
                          id={r.rowId}
                          rowClassName="bg-[#d9eef2]"
                        >
                          {({ attributes, listeners, setActivatorNodeRef }) => (
                            <>
                              <td className="p-2 text-center align-top">
                                <button
                                  ref={setActivatorNodeRef}
                                  {...attributes}
                                  {...listeners}
                                  type="button"
                                  className="cursor-grab select-none px-2 py-1 rounded border border-[#0f4c5c]/30 hover:bg-white"
                                  title="Drag to reorder"
                                >
                                  ⋮⋮
                                </button>
                              </td>
                              <td className="p-2 align-top font-semibold text-[#0f4c5c]">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="text-[11px] font-semibold text-white rounded px-2 py-1"
                                    style={{ backgroundColor: "#0f4c5c" }}
                                  >
                                    MAIN
                                  </span>
                                  <input
                                    value={r.mainHeading}
                                    onChange={(e) => {
                                      const copy = [...rows];
                                      copy[i] = {
                                        ...(copy[i] as MainHeadingRow),
                                        mainHeading: e.target.value,
                                      };
                                      setRows(copy);
                                    }}
                                    placeholder="Main Heading (section title)"
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm font-semibold bg-white"
                                  />
                                </div>
                              </td>
                              {/* Services Rate */} <td className="p-2" />
                              {/* Profit % */} <td className="p-2" />
                              {/* Units */} <td className="p-2" />
                              {/* Days */} <td className="p-2" />
                              {/* Persons */} <td className="p-2" />
                              {/* Profit Rate */} <td className="p-2" />
                              {/* Cost */} <td className="p-2" />
                              {/* Total Cost (section total) */}
                              <td className="p-2 text-center align-top font-semibold">
                                <StackRead
                                  usd={sectionUsd}
                                  eur={sectionEur}
                                  pkr={sectionTotal}
                                  usdLabel={usdCurrency}
                                  eurLabel={euroCurrency}
                                />
                              </td>
                              {/* Tax */} <td className="p-2" />
                              {/* WHT */} <td className="p-2" />
                              {/* Amount (section total) */}
                              <td className="p-2 text-center align-top font-semibold">
                                <StackRead
                                  usd={sectionUsd}
                                  eur={sectionEur}
                                  pkr={sectionTotal}
                                  usdLabel={usdCurrency}
                                  eurLabel={euroCurrency}
                                />
                              </td>
                              {/* Taxation */}{" "}
                              <td className="p-2 text-center align-top font-semibold text-[#0f4c5c]">
                                Reimbursement
                              </td>
                              {/* PDF */} <td className="p-2" />
                              {/* Remove */}
                              <td className="p-2 text-center align-top">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRow(i)}
                                  className="inline-flex items-center justify-center rounded-md p-2 hover:bg-white"
                                  title="Remove row"
                                  aria-label="Remove row"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </>
                          )}
                        </SortableRow>
                      );
                    }

                    // ✅ ITEM ROW
                    const invalidHeading =
                      submitAttempted && !String(r.detail || "").trim();
                    const invalidUnits =
                      submitAttempted &&
                      String(r.unitsInput ?? "").trim() === "";
                    const invalidDays =
                      submitAttempted &&
                      String(r.daysNightsInput ?? "").trim() === "";
                    const invalidPersons =
                      submitAttempted &&
                      String(r.personsInput ?? "").trim() === "";
                    const invalidRate =
                      submitAttempted && !hasAnyBaseRateInput(r);
                    const invalidTax =
                      submitAttempted &&
                      taxType !== "none" &&
                      !String(r.taxId || "").trim();

                    const persisted = computePersistedFinancials(
                      r,
                      taxType,
                      addCurrencies,
                      usdRate,
                      euroRate,
                      usdCurrency,
                      euroCurrency,
                    );

                    const supplierRateUSD =
                      addCurrencies && fx.usd > 0
                        ? (persisted.supplierRatePKR || 0) / fx.usd
                        : null;
                    const supplierRateEUR =
                      addCurrencies && fx.eur > 0
                        ? (persisted.supplierRatePKR || 0) / fx.eur
                        : null;

                    const profitRateUSD =
                      addCurrencies && fx.usd > 0
                        ? (persisted.profitRatePKR || 0) / fx.usd
                        : null;
                    const profitRateEUR =
                      addCurrencies && fx.eur > 0
                        ? (persisted.profitRatePKR || 0) / fx.eur
                        : null;

                    const sellRateUSD =
                      addCurrencies && fx.usd > 0
                        ? (persisted.sellRatePKR || 0) / fx.usd
                        : null;
                    const sellRateEUR =
                      addCurrencies && fx.eur > 0
                        ? (persisted.sellRatePKR || 0) / fx.eur
                        : null;

                    const totalCostUSD =
                      addCurrencies && fx.usd > 0
                        ? (persisted.totalCostPKR || 0) / fx.usd
                        : null;
                    const totalCostEUR =
                      addCurrencies && fx.eur > 0
                        ? (persisted.totalCostPKR || 0) / fx.eur
                        : null;

                    const taxUSD =
                      addCurrencies && fx.usd > 0
                        ? (persisted.taxAmountPKR || 0) / fx.usd
                        : null;
                    const taxEUR =
                      addCurrencies && fx.eur > 0
                        ? (persisted.taxAmountPKR || 0) / fx.eur
                        : null;

                    const whtUSD =
                      addCurrencies && fx.usd > 0
                        ? (persisted.whtAmountPKR || 0) / fx.usd
                        : null;
                    const whtEUR =
                      addCurrencies && fx.eur > 0
                        ? (persisted.whtAmountPKR || 0) / fx.eur
                        : null;

                    const amountUSD =
                      addCurrencies && fx.usd > 0
                        ? (persisted.amountPKR || 0) / fx.usd
                        : null;
                    const amountEUR =
                      addCurrencies && fx.eur > 0
                        ? (persisted.amountPKR || 0) / fx.eur
                        : null;

                    const taxationQuery = String(r.taxationName ?? "");
                    const filteredTaxation = servicesList.filter((sv) =>
                      sv.name
                        .toLowerCase()
                        .includes(taxationQuery.toLowerCase()),
                    );

                    return (
                      <SortableRow
                        key={r.rowId}
                        id={r.rowId}
                        rowClassName="hover:bg-gray-50"
                      >
                        {({ attributes, listeners, setActivatorNodeRef }) => (
                          <>
                            <td className="p-2 text-center align-top">
                              <button
                                ref={setActivatorNodeRef}
                                {...attributes}
                                {...listeners}
                                type="button"
                                className="cursor-grab select-none px-2 py-1 rounded border hover:bg-gray-100"
                                title="Drag to reorder"
                              >
                                ⋮⋮
                              </button>
                            </td>

                            {/* Services */}
                            <td className="p-2 align-top">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded px-2 py-1">
                                  HEADING
                                </span>
                                <input
                                  value={r.detail}
                                  onChange={(e) => {
                                    const copy = [...rows];
                                    (copy[i] as ItemRow).detail =
                                      e.target.value;
                                    setRows(copy);
                                  }}
                                  placeholder="Heading"
                                  className={fieldClass(
                                    "w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500",
                                    invalidHeading,
                                  )}
                                />
                              </div>

                              <textarea
                                rows={3}
                                value={String(r.subHeadingText ?? "")}
                                onChange={(e) =>
                                  setRowSubHeadingText(i, e.target.value)
                                }
                                placeholder="Sub heading (one per line)"
                                className="mt-2 w-full border border-gray-300 rounded-md p-2 text-xs whitespace-pre-wrap focus:ring-2 focus:ring-blue-500"
                              />
                            </td>

                            {/* Services Rate (VERTICAL STACK INPUTS) */}
                            <td className="p-2 text-center align-top">
                              <div className="flex flex-col gap-1 items-center">
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-gray-500 w-12 text-right">
                                    {usdCurrency}
                                  </span>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    disabled={!addCurrencies}
                                    value={r.baseRateUsdInput ?? ""}
                                    onChange={(e) =>
                                      handleBaseRateChange(
                                        i,
                                        "USD",
                                        e.target.value,
                                      )
                                    }
                                    onKeyDown={(e) =>
                                      e.key === "Enter" &&
                                      (
                                        e.currentTarget as HTMLInputElement
                                      ).blur()
                                    }
                                    onBlur={() => handleBaseRateBlur(i, "USD")}
                                    placeholder={
                                      addCurrencies
                                        ? "e.g. 100*2"
                                        : "Enable Add Currencies"
                                    }
                                    className={fieldClass(
                                      "w-28 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 text-center disabled:bg-gray-100 disabled:text-gray-400",
                                      invalidRate,
                                    )}
                                  />
                                </div>

                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-gray-500 w-12 text-right">
                                    {euroCurrency}
                                  </span>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    disabled={!addCurrencies}
                                    value={r.baseRateEuroInput ?? ""}
                                    onChange={(e) =>
                                      handleBaseRateChange(
                                        i,
                                        "EUR",
                                        e.target.value,
                                      )
                                    }
                                    onKeyDown={(e) =>
                                      e.key === "Enter" &&
                                      (
                                        e.currentTarget as HTMLInputElement
                                      ).blur()
                                    }
                                    onBlur={() => handleBaseRateBlur(i, "EUR")}
                                    placeholder={
                                      addCurrencies
                                        ? "e.g. 90+10"
                                        : "Enable Add Currencies"
                                    }
                                    className={fieldClass(
                                      "w-28 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 text-center disabled:bg-gray-100 disabled:text-gray-400",
                                      invalidRate,
                                    )}
                                  />
                                </div>

                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-gray-500 w-12 text-right">
                                    PKR
                                  </span>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={r.baseRateInput ?? ""}
                                    onChange={(e) =>
                                      handleBaseRateChange(
                                        i,
                                        "PKR",
                                        e.target.value,
                                      )
                                    }
                                    onKeyDown={(e) =>
                                      e.key === "Enter" &&
                                      (
                                        e.currentTarget as HTMLInputElement
                                      ).blur()
                                    }
                                    onBlur={() => handleBaseRateBlur(i, "PKR")}
                                    placeholder="e.g. 500*3"
                                    className={fieldClass(
                                      "w-28 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 text-center",
                                      invalidRate,
                                    )}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Profit % */}
                            <td className="p-2 text-center align-top">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={
                                  r.profitPercentInput ??
                                  String(r.profitPercent ?? "")
                                }
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  const copy = [...rows];
                                  const rr = copy[i] as ItemRow;
                                  rr.profitPercentInput = raw;
                                  rr.profitPercent = percentToNumber(raw);
                                  setRows(copy);
                                }}
                                onBlur={() => {
                                  const copy = [...rows];
                                  const rr = copy[i] as ItemRow;
                                  const v = Number(rr.profitPercent) || 0;
                                  rr.profitPercentInput = v
                                    ? `${fmtDecimal2(v)}`
                                    : "";
                                  setRows(copy);
                                }}
                                placeholder="e.g. 15"
                                className="w-24 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 text-center"
                              />
                              <div className="text-[10px] text-gray-400 mt-1">
                                %
                              </div>
                            </td>

                            {/* Units */}
                            <td className="p-2 text-center align-top">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={
                                  r.unitsInput ??
                                  fmtIntLoose(Number(r.units) || 0)
                                }
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  const copy = [...rows];
                                  (copy[i] as ItemRow).unitsInput = raw;
                                  (copy[i] as ItemRow).units =
                                    parseIntLoose(raw);
                                  setRows(copy);
                                }}
                                onBlur={() => {
                                  const copy = [...rows];
                                  const raw = String(
                                    (copy[i] as ItemRow).unitsInput ?? "",
                                  ).trim();
                                  if (raw === "") {
                                    (copy[i] as ItemRow).unitsInput = "";
                                    setRows(copy);
                                    return;
                                  }
                                  const n =
                                    Number((copy[i] as ItemRow).units) || 0;
                                  (copy[i] as ItemRow).unitsInput =
                                    fmtIntLoose(n);
                                  setRows(copy);
                                }}
                                className={fieldClass(
                                  "w-20 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 text-center",
                                  invalidUnits,
                                )}
                              />
                            </td>

                            {/* Days / Nights */}
                            <td className="p-2 text-center align-top">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={
                                  r.daysNightsInput ??
                                  fmtIntLoose(Number(r.daysNights) || 0)
                                }
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  const copy = [...rows];
                                  (copy[i] as ItemRow).daysNightsInput = raw;
                                  (copy[i] as ItemRow).daysNights =
                                    parseIntLoose(raw);
                                  setRows(copy);
                                }}
                                onBlur={() => {
                                  const copy = [...rows];
                                  const raw = String(
                                    (copy[i] as ItemRow).daysNightsInput ?? "",
                                  ).trim();
                                  if (raw === "") {
                                    (copy[i] as ItemRow).daysNightsInput = "";
                                    setRows(copy);
                                    return;
                                  }
                                  const n =
                                    Number((copy[i] as ItemRow).daysNights) ||
                                    0;
                                  (copy[i] as ItemRow).daysNightsInput =
                                    fmtIntLoose(n);
                                  setRows(copy);
                                }}
                                className={fieldClass(
                                  "w-28 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 text-center",
                                  invalidDays,
                                )}
                              />
                            </td>

                            {/* Persons */}
                            <td className="p-2 text-center align-top">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={
                                  r.personsInput ??
                                  fmtIntLoose(Number(r.persons) || 0)
                                }
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  const copy = [...rows];
                                  (copy[i] as ItemRow).personsInput = raw;
                                  (copy[i] as ItemRow).persons =
                                    parseIntLoose(raw);
                                  setRows(copy);
                                }}
                                onBlur={() => {
                                  const copy = [...rows];
                                  const raw = String(
                                    (copy[i] as ItemRow).personsInput ?? "",
                                  ).trim();
                                  if (raw === "") {
                                    (copy[i] as ItemRow).personsInput = "";
                                    setRows(copy);
                                    return;
                                  }
                                  const n =
                                    Number((copy[i] as ItemRow).persons) || 0;
                                  (copy[i] as ItemRow).personsInput =
                                    fmtIntLoose(n);
                                  setRows(copy);
                                }}
                                className={fieldClass(
                                  "w-24 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 text-center",
                                  invalidPersons,
                                )}
                              />
                            </td>

                            {/* Profit Rate (read) */}
                            <td className="p-2 text-center align-top">
                              <StackRead
                                usd={profitRateUSD}
                                eur={profitRateEUR}
                                pkr={persisted.profitRatePKR || 0}
                                usdLabel={usdCurrency}
                                eurLabel={euroCurrency}
                              />
                            </td>

                            {/* Cost (sell rate per unit read) */}
                            <td className="p-2 text-center align-top">
                              <StackRead
                                usd={sellRateUSD}
                                eur={sellRateEUR}
                                pkr={persisted.sellRatePKR || 0}
                                usdLabel={usdCurrency}
                                eurLabel={euroCurrency}
                              />
                            </td>

                            {/* Total Cost (total read) */}
                            <td className="p-2 text-center align-top">
                              <StackRead
                                usd={totalCostUSD}
                                eur={totalCostEUR}
                                pkr={persisted.totalCostPKR || 0}
                                usdLabel={usdCurrency}
                                eurLabel={euroCurrency}
                              />
                            </td>

                            {/* Tax (select + read total) */}
                            <td className="p-2 align-top">
                              <div className="flex flex-col gap-2">
                                <select
                                  disabled={taxType === "none"}
                                  onFocus={loadTaxCategories}
                                  value={r.taxId ?? ""}
                                  onChange={(e) => {
                                    const id = e.target.value;
                                    const found = taxCategories.find(
                                      (t) => t.id === id,
                                    );
                                    const copy = [...rows];
                                    const rr = copy[i] as ItemRow;
                                    rr.taxId = id;
                                    rr.taxLabel = found ? found.name : "";
                                    rr.taxPercent = found
                                      ? Number(found.percent || 0)
                                      : 0;
                                    setRows(copy);
                                  }}
                                  className={fieldClass(
                                    "w-full border border-gray-300 rounded-md p-2 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400",
                                    invalidTax,
                                  )}
                                >
                                  <option value="">
                                    {taxType === "none"
                                      ? "Tax N/A"
                                      : "Select Tax"}
                                  </option>
                                  {taxCategories.map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.name}{" "}
                                      {typeof t.percent === "number"
                                        ? `(${t.percent}%)`
                                        : ""}
                                    </option>
                                  ))}
                                </select>

                                <StackRead
                                  usd={taxUSD}
                                  eur={taxEUR}
                                  pkr={persisted.taxAmountPKR || 0}
                                  usdLabel={usdCurrency}
                                  eurLabel={euroCurrency}
                                />
                              </div>
                            </td>

                            {/* WHT (select + read) */}
                            <td className="p-2 align-top">
                              <div className="flex flex-col gap-2">
                                <select
                                  onFocus={loadWhtCategories}
                                  value={r.whtId ?? ""}
                                  onChange={(e) => {
                                    const id = e.target.value;
                                    const found = whtCategories.find(
                                      (t) => t.id === id,
                                    );
                                    const copy = [...rows];
                                    const rr = copy[i] as ItemRow;
                                    rr.whtId = id;
                                    rr.whtLabel = found ? found.name : "";
                                    rr.whtPercent = found
                                      ? Number(found.percent || 0)
                                      : 0;
                                    setRows(copy);
                                  }}
                                  className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white"
                                >
                                  <option value="">No WHT</option>
                                  {whtCategories.map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.name}{" "}
                                      {typeof t.percent === "number"
                                        ? `(${t.percent}%)`
                                        : ""}
                                    </option>
                                  ))}
                                </select>

                                <StackRead
                                  usd={whtUSD}
                                  eur={whtEUR}
                                  pkr={persisted.whtAmountPKR || 0}
                                  usdLabel={usdCurrency}
                                  eurLabel={euroCurrency}
                                />
                              </div>
                            </td>

                            {/* Amount (read) */}
                            <td className="p-2 text-center align-top">
                              <StackRead
                                usd={amountUSD}
                                eur={amountEUR}
                                pkr={persisted.amountPKR || 0}
                                usdLabel={usdCurrency}
                                eurLabel={euroCurrency}
                              />
                            </td>

                            {/* Taxation (service dropdown + editable textarea) */}
                            <td className="p-2 align-top">
                              <div
                                className="relative"
                                ref={
                                  openTaxationRowId === r.rowId
                                    ? taxationDropdownRef
                                    : null
                                }
                              >
                                <div className="flex items-center gap-1">
                                  <input
                                    value={r.taxationName ?? ""}
                                    onChange={(e) => {
                                      const copy = [...rows];
                                      const rr = copy[i] as ItemRow;
                                      rr.taxationName = e.target.value;
                                      setRows(copy);
                                      if (openTaxationRowId !== rr.rowId)
                                        setOpenTaxationRowId(rr.rowId);
                                    }}
                                    onFocus={() =>
                                      setOpenTaxationRowId(r.rowId)
                                    }
                                    placeholder="Select taxation service"
                                    className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 w-[240px]"
                                  />
                                  <button
                                    type="button"
                                    className="border border-gray-300 rounded-md p-2 hover:bg-gray-50"
                                    title="Show services"
                                    onClick={() =>
                                      setOpenTaxationRowId((prev) =>
                                        prev === r.rowId ? null : r.rowId,
                                      )
                                    }
                                  >
                                    <ChevronDown size={16} />
                                  </button>
                                </div>

                                {openTaxationRowId === r.rowId ? (
                                  <div className="absolute z-30 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-auto w-[320px]">
                                    {filteredTaxation.length === 0 ? (
                                      <div className="p-2 text-xs text-gray-500">
                                        No matching services
                                      </div>
                                    ) : (
                                      filteredTaxation.map((sv) => (
                                        <button
                                          key={sv.id}
                                          type="button"
                                          className="w-full text-left px-3 py-2 hover:bg-gray-50"
                                          onClick={() => {
                                            const copy = [...rows];
                                            const rr = copy[i] as ItemRow;

                                            rr.taxationServiceId = sv.id;
                                            rr.taxationName = sv.name;
                                            rr.taxationText = String(
                                              sv.description || "",
                                            ).replace(/\r\n/g, "\n");
                                            setRows(copy);
                                            setOpenTaxationRowId(null);
                                          }}
                                        >
                                          <div className="text-sm text-gray-800">
                                            {sv.name}
                                          </div>
                                        </button>
                                      ))
                                    )}
                                  </div>
                                ) : null}

                                <textarea
                                  rows={3}
                                  value={r.taxationText ?? ""}
                                  onChange={(e) => {
                                    const copy = [...rows];
                                    (copy[i] as ItemRow).taxationText =
                                      e.target.value;
                                    setRows(copy);
                                  }}
                                  placeholder="Taxation details (editable)"
                                  className="mt-2 w-full border border-gray-300 rounded-md p-2 text-xs whitespace-pre-wrap focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </td>

                            {/* PDF */}
                            <td className="p-2 align-top">
                              <label className="flex items-start gap-2 text-[11px] text-gray-700 leading-snug">
                                <input
                                  type="checkbox"
                                  className="accent-black mt-0.5"
                                  checked={r.showFinancialsInPdf ?? true}
                                  onChange={(e) => {
                                    const copy = [...rows];
                                    (copy[i] as ItemRow).showFinancialsInPdf =
                                      e.target.checked;
                                    setRows(copy);
                                  }}
                                />
                                <span>Show</span>
                              </label>
                            </td>

                            {/* Remove */}
                            <td className="p-2 text-center align-top">
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(i)}
                                className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
                                title="Remove row"
                                aria-label="Remove row"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </>
                        )}
                      </SortableRow>
                    );
                  })}
                </tbody>
              </SortableContext>
            </table>
          </div>
        </DndContext>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={addMainHeadingRow}>
            Add Main Heading Row
          </Button>
          <Button type="button" onClick={addHeadingRow}>
            Add Heading Row
          </Button>
        </div>

        <div className="col-span-2 mt-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Message
          </label>
          <input
            className="w-full rounded-lg border border-gray-300 p-2 text-sm"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Package Includes
            </label>
            <textarea
              rows={6}
              value={packageIncludesText}
              onChange={(e) => setPackageIncludesText(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm whitespace-pre-wrap"
              placeholder="Package includes..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Package Excludes
            </label>
            <textarea
              rows={6}
              value={packageExcludesText}
              onChange={(e) => setPackageExcludesText(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm whitespace-pre-wrap"
              placeholder="Package excludes..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Terms & Conditions
            </label>

            <select
              className={fieldClass(
                "w-full border border-gray-300 rounded-lg p-2 text-sm whitespace-normal",
                invalidTerms,
              )}
              value={selectedTermsId}
              onChange={(e) => handleSelectTerms(e.target.value)}
            >
              <option value="">Select Terms & Conditions</option>
              {termsConditions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {selectedTermsId ? (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {termsConditionTitle || "Terms & Conditions Text"}
              </label>
              <textarea
                rows={8}
                value={termsConditionText}
                onChange={(e) => setTermsConditionText(e.target.value)}
                className={fieldClass(
                  "w-full border border-gray-300 rounded-lg p-2 text-sm whitespace-pre-wrap",
                  invalidTermsText,
                )}
                placeholder="Terms & Conditions will appear here..."
              />
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex justify-between gap-3">
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : editId ? "Update & Save" : "Save"}
            </Button>
            <Button type="button" variant="outline" onClick={handlePreviewPdf}>
              Preview PDF
            </Button>
          </div>
        </div>

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
                    link.download = `${estimateNo || "estimate"}.pdf`;
                    link.click();
                  }}
                >
                  Download
                </Button>
              </div>
            </div>
          </div>
        )}

        <ToastProvider>
          {toastOpen && (
            <Toast
              onOpenChange={setToastOpen}
              open={toastOpen}
              variant={"destructive"}
            >
              <ToastTitle>Notice</ToastTitle>
              <ToastDescription>{toastMsg}</ToastDescription>
              <ToastClose />
            </Toast>
          )}
          <ToastViewport />
        </ToastProvider>
      </div>
    </div>
  );
}
