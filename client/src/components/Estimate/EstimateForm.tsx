import React, { useEffect, useMemo, useRef, useState } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  serverTimestamp,
  runTransaction,
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
import { Trash2, ChevronDown } from "lucide-react";
import { buildEstimatePdfBlob } from "@/lib/estimatePdf";

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

// ✅ popular currencies (extend anytime)
const POPULAR_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "US$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "SAR", name: "Saudi Riyal", symbol: "SAR" },
  { code: "AED", name: "UAE Dirham", symbol: "AED" },
  { code: "CNY", name: "Chinese Yuan", symbol: "CN¥" },
  { code: "JPY", name: "Japanese Yen", symbol: "JP¥" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "TRY", name: "Turkish Lira", symbol: "TRY" },
  { code: "LKR", name: "Sri Lankan Rupee", symbol: "LKR" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "AZN", name: "Azerbaijani Manat", symbol: "₼" },
] as const;

const currencyMeta = (code: string) => {
  const found = (POPULAR_CURRENCIES as readonly any[]).find(
    (c) => c.code === code,
  );
  return (
    found ?? {
      code,
      name: code,
      symbol: `${code}`,
    }
  );
};

// ✅ FX rate input sanitizer (no commas; max 2 decimals)
const sanitizeFxRateInput = (raw: string) => {
  let s = String(raw ?? "").replace(/,/g, "");
  s = s.replace(/[^0-9.]/g, "");
  const firstDot = s.indexOf(".");
  if (firstDot === -1) return s;

  const intPart = s.slice(0, firstDot) || "0";
  const decPart = s
    .slice(firstDot + 1)
    .replace(/\./g, "")
    .slice(0, 2);

  return decPart.length ? `${intPart}.${decPart}` : `${intPart}.`;
};

const fxBlurFix = (raw: string) => {
  const s = sanitizeFxRateInput(raw);
  return s.endsWith(".") ? s.slice(0, -1) : s;
};

// ✅ 2-decimal formatter for rate displays
const fmtDecimal2Loose = (n: number) => {
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

// ✅ Clamp simple numeric typing like 12.345 -> 12.34 (keeps expressions like 500*3 untouched)
const clampRateDecimals2 = (txt: string) => {
  const t = String(txt ?? "");
  const hasOps = /[+\-*/()]/.test(t);
  if (hasOps) return t;

  const hasPct = /%\s*$/.test(t);
  const core = hasPct ? t.replace(/%\s*$/, "") : t;

  // only simple numeric-ish text (allow commas/spaces)
  if (!/^[0-9.,\s]*\.?[0-9\s]*$/.test(core)) return t;

  const parts = core.split(".");
  if (parts.length < 2) return t;

  const a = parts[0];
  const b = (parts[1] ?? "").replace(/\s/g, "").slice(0, 2);

  const out = `${a}.${b}`;
  return hasPct ? `${out}%` : out;
};

export interface ServiceItem {
  rowId: string;

  detail: string;
  description?: string;

  units: number;
  unitsInput?: string;

  rate: number; // PKR base
  rateInput?: string;
  rateMode?: "amount" | "percent";

  // currency1 / currency2 inputs (kept for backward compatibility)
  rateUsdInput?: string;
  rateEuroInput?: string;

  // track last used field (backward compatible)
  rateCurrency?: "PKR" | "FX1" | "FX2" | "USD" | "EUR";

  taxType?: string;
  taxPercent?: number;
  taxLabel?: string;
  taxId?: string;

  whtId?: string;
  whtLabel?: string;
  whtPercent?: number;

  showFinancialsInPdf?: boolean;
}

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

// ✅ tolerate commas too (safe)
const num = (v: any) => {
  const cleaned = String(v ?? "")
    .replace(/,/g, "")
    .trim();
  const n = Number(cleaned);
  return isNaN(n) || n <= 0 ? 0 : n;
};

const convert = (pkr: number, rate: any) => {
  const r = num(rate);
  return r > 0 ? pkr / r : 0;
};

const NO_TAX_ID = "__NO_TAX__";
const NO_WHT_ID = "__NO_WHT__";

const makeRowId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
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
  const num = parseInt(cleaned, 10);
  return Number.isFinite(num) ? num : 0;
};

const fmtDecimalLoose = (n: number) => {
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
};

// ✅ allow calculator operators in Rate field
const sanitizeRateText = (raw: string) => {
  let s = String(raw ?? "");
  s = s.replace(/[^0-9.%+\-*/() ,]/g, "");
  return s;
};

type EvalResult =
  | { ok: true; value: number; mode: "amount" | "percent" }
  | { ok: false; error: string; mode: "amount" | "percent" };

// ✅ safe expression evaluator (no eval)
const evalRateExpression = (rawInput: string): EvalResult => {
  const raw = sanitizeRateText(rawInput).trim();
  if (!raw) return { ok: false, error: "Empty", mode: "amount" };

  const trimmed = raw.replace(/\s+/g, " ");
  const endsWithPercent = /%\s*$/.test(trimmed);
  const mode: "amount" | "percent" = endsWithPercent ? "percent" : "amount";

  const expr = endsWithPercent ? trimmed.replace(/%\s*$/, "").trim() : trimmed;
  const clean = expr.replace(/,/g, "").trim();
  if (!clean) return { ok: false, error: "Empty", mode };

  if (/[^0-9+\-*/().\s]/.test(clean)) {
    return { ok: false, error: "Invalid characters", mode };
  }

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
      ) {
        j++;
      }
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
      while (stack.length && stack[stack.length - 1].t !== "lp") {
        output.push(stack.pop() as Tok);
      }
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

        if (pTop > pCur || (pTop === pCur && isLeftAssoc(opTok))) {
          output.push(stack.pop() as Tok);
        } else break;
      }

      stack.push(opTok);
      prev = opTok;
      continue;
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
    if (tok.t === "num") {
      st.push(tok.v);
      continue;
    }

    if (tok.t === "u-") {
      if (st.length < 1) return { ok: false, error: "Bad unary -", mode };
      const a = st.pop() as number;
      st.push(-a);
      continue;
    }

    if (tok.t === "op") {
      if (st.length < 2) return { ok: false, error: "Bad expression", mode };
      const b = st.pop() as number;
      const a = st.pop() as number;

      let res = 0;
      if (tok.v === "+") res = a + b;
      if (tok.v === "-") res = a - b;
      if (tok.v === "*") res = a * b;
      if (tok.v === "/") res = a / b;

      if (!Number.isFinite(res)) {
        return { ok: false, error: "Math error", mode };
      }
      st.push(res);
      continue;
    }
  }

  if (st.length !== 1) return { ok: false, error: "Bad expression", mode };
  return { ok: true, value: st[0], mode };
};

// ✅ Money formatting for PKR totals (2 decimals)
const formatMoney = (n: number) =>
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function SortableRow({
  id,
  children,
}: {
  id: string;
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
      className="hover:bg-gray-50 transition border-b last:border-none"
    >
      {children({ attributes, listeners, setActivatorNodeRef, isDragging })}
    </tr>
  );
}

export default function EstimateForm({
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

  // ✅ WHT
  const [whtCategories, setWhtCategories] = useState<Tax[]>([]);
  const [loadingWht, setLoadingWht] = useState(false);

  // ✅ Add currencies
  const [addCurrencies, setAddCurrencies] = useState(false);

  // ✅ 2 dropdowns
  const [currency1Code, setCurrency1Code] = useState<string>("USD");
  const [currency2Code, setCurrency2Code] = useState<string>("EUR");

  // ✅ keep existing field names for backward compatibility
  const [usdRate, setUsdRate] = useState(""); // Currency 1 rate (PKR per 1 unit)
  const [euroRate, setEuroRate] = useState(""); // Currency 2 rate (PKR per 1 unit)

  // ✅ validation attempt flag (for blinking red)
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // ✅ services dropdown popover state
  const [openServiceRowId, setOpenServiceRowId] = useState<string | null>(null);
  const serviceDropdownRef = useRef<HTMLDivElement | null>(null);

  const initialServices: ServiceItem[] = useMemo(
    () => [
      {
        rowId: makeRowId(),
        detail: "",
        description: "",
        units: 1,
        unitsInput: "1",
        rate: 0,
        rateInput: "",
        rateMode: "amount",
        rateUsdInput: "",
        rateEuroInput: "",
        rateCurrency: "PKR",
        taxType: "inclusive",
        taxPercent: 0,
        taxLabel: "",
        taxId: "",
        whtId: "",
        whtLabel: "",
        whtPercent: 0,
        showFinancialsInPdf: true,
      },
    ],
    [],
  );

  const [services, setServices] = useState<ServiceItem[]>(initialServices);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [withLogo, setWithLogo] = useState(true);

  const [paymentTerm, setPaymentTerm] = useState("");
  const [company, setCompany] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  // ✅ prevent double-click / double-save
  const savingRef = useRef(false);

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

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastOpen(true);
  };

  const fieldClass = (base: string, invalid: boolean) =>
    `${base} ${invalid ? "blink-red" : ""}`;

  // ✅ currency display helpers (safe + spacing + no crashes)
  const formatWithSymbol = (
    symbol: string,
    amount: number | null | undefined,
  ) => {
    const n = Number(amount ?? 0);
    const isAlphaSymbol = /^[A-Za-z]{2,4}$/.test(String(symbol)); // SAR, AED, Rp, etc.
    const sep = isAlphaSymbol ? " " : "";
    return `${symbol}${sep}${n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const c1 = currencyMeta(currency1Code);
  const c2 = currencyMeta(currency2Code);

  const c1Head = `${c1.symbol}`;
  const c2Head = `${c2.symbol}`;

  // ✅ calc line uses rateMode (rate is PKR base)
  const calcLine = (s: ServiceItem) => {
    const units = Number(s.units) || 0;
    const rateMode = s.rateMode || "amount";
    const rateNum = Number(s.rate) || 0;

    const base =
      rateMode === "percent" ? units * (rateNum / 100) : units * rateNum;

    const pct = Number(s.taxPercent ?? 0);

    if (taxType === "none" || pct <= 0)
      return { base, taxAmount: 0, lineTotal: base };

    if (taxType === "exclusive") {
      const taxAmount = (base * pct) / 100;
      return { base, taxAmount, lineTotal: base + taxAmount };
    }

    // inclusive
    const taxAmount = (base * pct) / (100 + pct);
    return { base, taxAmount, lineTotal: base };
  };

  // ✅ WHT applies AFTER Units*Rate and Tax
  const calcWhtAmount = (s: ServiceItem) => {
    const pct = Number(s.whtPercent ?? 0);
    if (pct <= 0) return 0;
    const line = calcLine(s);
    return (line.lineTotal * pct) / 100;
  };

  const calcLineTotalWithWht = (s: ServiceItem) => {
    const line = calcLine(s);
    return line.lineTotal + calcWhtAmount(s);
  };

  const handleRemoveRow = (index: number) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddRow = () => {
    setServices((prev) => [
      ...prev,
      {
        rowId: makeRowId(),
        detail: "",
        description: "",
        units: 1,
        unitsInput: "1",
        rate: 0,
        rateInput: "",
        rateMode: "amount",
        rateUsdInput: "",
        rateEuroInput: "",
        rateCurrency: "PKR",
        taxType: "inclusive",
        taxPercent: 0,
        taxLabel: "",
        taxId: "",
        whtId: "",
        whtLabel: "",
        whtPercent: 0,
        showFinancialsInPdf: true,
      },
    ]);
  };

  const handleServiceChange = (i: number, value: string) => {
    const copy = [...services];
    copy[i].detail = value;
    const found = servicesList.find(
      (sv) => sv.name.toLowerCase() === value.toLowerCase(),
    );
    copy[i].description = found?.description || copy[i].description || "";
    setServices(copy);
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

  const rowIds = useMemo(() => services.map((s) => s.rowId), [services]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setServices((items) => {
      const oldIndex = items.findIndex((x) => x.rowId === active.id);
      const newIndex = items.findIndex((x) => x.rowId === over.id);
      if (oldIndex < 0 || newIndex < 0) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  };

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

  // ✅ prevent same currency selection
  useEffect(() => {
    if (!addCurrencies) return;
    if (currency1Code !== currency2Code) return;

    const alt =
      POPULAR_CURRENCIES.find((c) => c.code !== currency1Code)?.code || "EUR";
    setCurrency2Code(alt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addCurrencies, currency1Code, currency2Code]);

  useEffect(() => {
    if (!existingEstimate) return;

    setStatus((existingEstimate as any)?.status ?? "RFQ Sent");
    setApprovalReceivedOn((existingEstimate as any)?.approvalReceivedOn ?? "");

    setEditId(duplicateMode ? null : (existingEstimate.id ?? null));
    setEstimateNo(duplicateMode ? "" : (existingEstimate.estimateNo ?? ""));
    setClient(existingEstimate.client ?? "");
    setDate(existingEstimate.date ?? "");
    setExpiryDate(existingEstimate.expiryDate ?? "");
    setProjectOwner(existingEstimate.projectOwner ?? "");
    setSubject(existingEstimate.subject ?? "");
    setMessage(existingEstimate.message ?? "");
    setPoNumber(existingEstimate.poNumber ?? "");
    setTaxType(existingEstimate.taxType ?? "");
    setPaymentTerm(existingEstimate.paymentTerm ?? "");
    setCompany(existingEstimate.company ?? "");

    setAddCurrencies(
      Boolean((existingEstimate as any)?.addCurrencies ?? false),
    );

    setCurrency1Code(String((existingEstimate as any)?.currency1Code ?? "USD"));
    setCurrency2Code(String((existingEstimate as any)?.currency2Code ?? "EUR"));

    setUsdRate(String((existingEstimate as any)?.usdRate ?? ""));
    setEuroRate(String((existingEstimate as any)?.euroRate ?? ""));

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

    setServices(
      (existingEstimate.services || []).map((s: any) => {
        const estFx1Rate = String((existingEstimate as any)?.usdRate ?? "");
        const estFx2Rate = String((existingEstimate as any)?.euroRate ?? "");
        const fx1 = num(estFx1Rate);
        const fx2 = num(estFx2Rate);

        const savedRate = Number(s.rate ?? 0);
        const savedMode: "amount" | "percent" = s.rateMode ?? "amount";

        const percentText =
          savedMode === "percent" ? `${fmtDecimal2Loose(savedRate)}%` : "";

        const derivedFx1 =
          savedMode === "percent"
            ? percentText
            : fx1 > 0 && Number.isFinite(savedRate)
              ? fmtDecimal2Loose(savedRate / fx1)
              : "";

        const derivedFx2 =
          savedMode === "percent"
            ? percentText
            : fx2 > 0 && Number.isFinite(savedRate)
              ? fmtDecimal2Loose(savedRate / fx2)
              : "";

        return {
          rowId: s.rowId || makeRowId(),
          detail: s.detail ?? "",
          description: s.description ?? "",
          units: s.units ?? 1,
          unitsInput:
            typeof s.units === "number"
              ? fmtIntLoose(s.units)
              : (s.unitsInput ?? ""),
          rate: savedRate,
          rateMode: savedMode,

          rateInput:
            savedMode === "percent"
              ? percentText
              : typeof s.rate === "number" && s.rate !== 0
                ? fmtDecimal2Loose(savedRate)
                : (s.rateInput ?? ""),

          rateUsdInput:
            s.rateUsdInput ??
            (savedMode === "percent" ? percentText : derivedFx1),
          rateEuroInput:
            s.rateEuroInput ??
            (savedMode === "percent" ? percentText : derivedFx2),

          rateCurrency: s.rateCurrency ?? "PKR",

          taxType: s.taxType ?? "none",
          taxPercent: s.taxPercent ?? 0,
          taxLabel: s.taxLabel ?? "",
          taxId: s.taxId ?? "",
          whtId: s.whtId ?? "",
          whtLabel: s.whtLabel ?? "",
          whtPercent: typeof s.whtPercent === "number" ? s.whtPercent : 0,

          showFinancialsInPdf:
            typeof s.showFinancialsInPdf === "boolean"
              ? s.showFinancialsInPdf
              : true,
        } as ServiceItem;
      }),
    );

    setSelectedClient({
      name: existingEstimate.client ?? "",
      address: (existingEstimate as any).address ?? "",
      addtionalInfo: (existingEstimate as any).info ?? "",
    });
  }, [existingEstimate, duplicateMode]);

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

  useEffect(() => {
    const q = query(collection(db, "Panels", "IEDGE-SYSTEM", "services"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setServicesList(
        snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          name: docSnap.data().name,
          description: docSnap.data().description,
        })),
      );
    });
    return () => unsubscribe();
  }, []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTermsId]);

  // ✅ If Tax Type is "none", force all row taxes to 0/blank
  useEffect(() => {
    if (taxType !== "none") return;
    setServices((prev) =>
      prev.map((s) => ({
        ...s,
        taxId: "",
        taxLabel: "",
        taxPercent: 0,
      })),
    );
  }, [taxType]);

  // ✅ helpers for multi-rate
  type RateCurrency = "PKR" | "FX1" | "FX2";

  const normalizeRateCurrency = (rc: any): RateCurrency | "USD" | "EUR" => {
    if (rc === "USD") return "USD";
    if (rc === "EUR") return "EUR";
    if (rc === "FX1") return "FX1";
    if (rc === "FX2") return "FX2";
    return "PKR";
  };

  const hasAnyRateInput = (s: ServiceItem) =>
    [s.rateInput, s.rateUsdInput, s.rateEuroInput].some(
      (v) => String(v ?? "").trim() !== "",
    );

  const getFx = () => ({
    fx1: num(usdRate),
    fx2: num(euroRate),
  });

  const handleRateChange = (
    index: number,
    currency: RateCurrency,
    raw: string,
  ) => {
    const safeText = clampRateDecimals2(sanitizeRateText(raw));

    setServices((prev) => {
      const copy = [...prev];
      const row = { ...copy[index] };

      if (currency === "PKR") row.rateInput = safeText;
      if (currency === "FX1") row.rateUsdInput = safeText;
      if (currency === "FX2") row.rateEuroInput = safeText;

      const res = evalRateExpression(safeText);

      if (!res.ok) {
        row.rateMode = /%\s*$/.test(safeText) ? "percent" : "amount";
        row.rate = 0;
        row.rateCurrency = currency;
        copy[index] = row;
        return copy;
      }

      row.rateMode = res.mode;
      row.rateCurrency = currency;

      if (res.mode === "percent") {
        row.rate = res.value;
        copy[index] = row;
        return copy;
      }

      const fx = getFx();
      let pkrVal: number | null = null;

      if (currency === "PKR") pkrVal = res.value;
      if (currency === "FX1") pkrVal = fx.fx1 > 0 ? res.value * fx.fx1 : null;
      if (currency === "FX2") pkrVal = fx.fx2 > 0 ? res.value * fx.fx2 : null;

      if (pkrVal == null) {
        copy[index] = row;
        return copy;
      }

      row.rate = pkrVal;

      if (currency !== "PKR") row.rateInput = fmtDecimal2Loose(pkrVal);

      if (addCurrencies) {
        if (currency !== "FX1" && fx.fx1 > 0)
          row.rateUsdInput = fmtDecimal2Loose(pkrVal / fx.fx1);
        if (currency !== "FX2" && fx.fx2 > 0)
          row.rateEuroInput = fmtDecimal2Loose(pkrVal / fx.fx2);
      }

      copy[index] = row;
      return copy;
    });
  };

  const handleRateBlur = (index: number, currency: RateCurrency) => {
    const current = services[index];
    if (!current) return;

    const raw =
      currency === "PKR"
        ? String(current.rateInput ?? "")
        : currency === "FX1"
          ? String(current.rateUsdInput ?? "")
          : String(current.rateEuroInput ?? "");

    const trimmed = raw.trim();

    if (trimmed === "") {
      setServices((prev) => {
        const copy = [...prev];
        const row = { ...copy[index] };

        if (currency === "PKR") row.rateInput = "";
        if (currency === "FX1") row.rateUsdInput = "";
        if (currency === "FX2") row.rateEuroInput = "";

        const anyLeft = hasAnyRateInput(row);

        if (!anyLeft) {
          row.rate = 0;
          row.rateMode = "amount";
          row.rateCurrency = "PKR";
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

    const fx = getFx();
    const cc1 = currencyMeta(currency1Code);
    const cc2 = currencyMeta(currency2Code);

    if (res.mode === "percent") {
      const formatted = `${fmtDecimal2Loose(res.value)}%`;

      setServices((prev) => {
        const copy = [...prev];
        const row = { ...copy[index] };

        row.rateMode = "percent";
        row.rate = res.value;
        row.rateCurrency = currency;

        row.rateInput = formatted;
        row.rateUsdInput = formatted;
        row.rateEuroInput = formatted;

        copy[index] = row;
        return copy;
      });
      return;
    }

    if (currency === "FX1" && fx.fx1 <= 0) {
      showToast(
        `Please enter ${cc1.code} Rate above to use the ${cc1.code} field`,
      );
      return;
    }
    if (currency === "FX2" && fx.fx2 <= 0) {
      showToast(
        `Please enter ${cc2.code} Rate above to use the ${cc2.code} field`,
      );
      return;
    }

    let pkrVal = res.value;
    if (currency === "FX1") pkrVal = res.value * fx.fx1;
    if (currency === "FX2") pkrVal = res.value * fx.fx2;

    setServices((prev) => {
      const copy = [...prev];
      const row = { ...copy[index] };

      row.rateMode = "amount";
      row.rate = pkrVal;
      row.rateCurrency = currency;

      row.rateInput = fmtDecimal2Loose(pkrVal);

      if (fx.fx1 > 0) row.rateUsdInput = fmtDecimal2Loose(pkrVal / fx.fx1);
      if (fx.fx2 > 0) row.rateEuroInput = fmtDecimal2Loose(pkrVal / fx.fx2);

      if (currency === "PKR") row.rateInput = fmtDecimal2Loose(res.value);
      if (currency === "FX1") row.rateUsdInput = fmtDecimal2Loose(res.value);
      if (currency === "FX2") row.rateEuroInput = fmtDecimal2Loose(res.value);

      copy[index] = row;
      return copy;
    });
  };

  // ✅ When FX changes, keep FX1/FX2 displays in sync (and preserve whichever field user used last)
  useEffect(() => {
    if (!addCurrencies) return;

    const fx = { fx1: num(usdRate), fx2: num(euroRate) };
    if (fx.fx1 <= 0 && fx.fx2 <= 0) return;

    setServices((prev) =>
      prev.map((s) => {
        if (!hasAnyRateInput(s)) return s;

        const mode = s.rateMode || "amount";

        if (mode === "percent") {
          const val = Number(s.rate) || 0;
          const formatted = `${fmtDecimal2Loose(val)}%`;
          return {
            ...s,
            rateInput: formatted,
            rateUsdInput: formatted,
            rateEuroInput: formatted,
          };
        }

        const lastRaw = normalizeRateCurrency(s.rateCurrency);

        const last: RateCurrency =
          lastRaw === "USD" ? "FX1" : lastRaw === "EUR" ? "FX2" : lastRaw;

        if (last === "FX1" && fx.fx1 > 0) {
          const t = String(s.rateUsdInput ?? "").trim();
          if (t) {
            const r = evalRateExpression(t);
            if (r.ok && r.mode === "amount") {
              const pkr = r.value * fx.fx1;
              return {
                ...s,
                rateMode: "amount",
                rate: pkr,
                rateCurrency: "FX1",
                rateInput: fmtDecimal2Loose(pkr),
                rateUsdInput: fmtDecimal2Loose(r.value),
                rateEuroInput:
                  fx.fx2 > 0 ? fmtDecimal2Loose(pkr / fx.fx2) : s.rateEuroInput,
              };
            }
          }
        }

        if (last === "FX2" && fx.fx2 > 0) {
          const t = String(s.rateEuroInput ?? "").trim();
          if (t) {
            const r = evalRateExpression(t);
            if (r.ok && r.mode === "amount") {
              const pkr = r.value * fx.fx2;
              return {
                ...s,
                rateMode: "amount",
                rate: pkr,
                rateCurrency: "FX2",
                rateInput: fmtDecimal2Loose(pkr),
                rateEuroInput: fmtDecimal2Loose(r.value),
                rateUsdInput:
                  fx.fx1 > 0 ? fmtDecimal2Loose(pkr / fx.fx1) : s.rateUsdInput,
              };
            }
          }
        }

        const pkr = Number(s.rate) || 0;
        return {
          ...s,
          rateUsdInput:
            fx.fx1 > 0 ? fmtDecimal2Loose(pkr / fx.fx1) : s.rateUsdInput,
          rateEuroInput:
            fx.fx2 > 0 ? fmtDecimal2Loose(pkr / fx.fx2) : s.rateEuroInput,
        };
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addCurrencies, usdRate, euroRate]);

  const resetForm = () => {
    setEditId(null);
    setEstimateNo("");
    setClient("");
    setSelectedClient(null);
    setDate("");
    setExpiryDate("");
    setProjectOwner("");
    setSubject("");
    setMessage("");
    setPoNumber("");
    setTaxType("");
    setPaymentTerm("");
    setCompany("");
    setSelectedTermsId("");
    setTermsConditionTitle("");
    setTermsConditionText("");
    setStatus("RFQ Sent");
    setApprovalReceivedOn("");
    setWithLogo(true);

    setAddCurrencies(false);

    setCurrency1Code("USD");
    setCurrency2Code("EUR");

    setUsdRate("");
    setEuroRate("");

    setServices([
      {
        rowId: makeRowId(),
        detail: "",
        description: "",
        units: 1,
        unitsInput: "1",
        rate: 0,
        rateInput: "",
        rateMode: "amount",
        rateUsdInput: "",
        rateEuroInput: "",
        rateCurrency: "PKR",
        taxType: "inclusive",
        taxPercent: 0,
        taxLabel: "",
        taxId: "",
        whtId: "",
        whtLabel: "",
        whtPercent: 0,
        showFinancialsInPdf: true,
      },
    ]);

    setSubmitAttempted(false);
    setOpenServiceRowId(null);
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    savingRef.current = true;

    setSubmitAttempted(true);

    const sanitizedServices = services.map((s) => ({
      ...s,
      taxId: s.taxId || "",
      taxLabel: s.taxLabel || "",
      taxPercent: typeof s.taxPercent === "number" ? s.taxPercent : 0,
      taxType: s.taxType || "none",
      rateMode: s.rateMode || "amount",
      rate: Number(s.rate) || 0,
      units: Number(s.units) || 0,
      whtId: s.whtId || "",
      whtLabel: s.whtLabel || "",
      whtPercent: typeof s.whtPercent === "number" ? s.whtPercent : 0,

      rateInput: String(s.rateInput ?? ""),
      rateUsdInput: String(s.rateUsdInput ?? ""),
      rateEuroInput: String(s.rateEuroInput ?? ""),
      rateCurrency: (s.rateCurrency ?? "PKR") as any,

      showFinancialsInPdf: s.showFinancialsInPdf !== false,
    }));

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
      requiredFields.push({ value: currency1Code, name: "Currency 1" });
      requiredFields.push({ value: usdRate, name: `${currency1Code} Rate` });
      requiredFields.push({ value: currency2Code, name: "Currency 2" });
      requiredFields.push({ value: euroRate, name: `${currency2Code} Rate` });
    }

    const missing = requiredFields.filter((f) => !String(f.value ?? "").trim());
    if (missing.length > 0) {
      showToast(`${missing[0].name} is required`);
      savingRef.current = false;
      return;
    }

    const rowMissing = sanitizedServices.find((s: any) => {
      const missingService = !String(s.detail || "").trim();

      const unitsRaw = String(s.unitsInput ?? "").trim();
      const missingUnits = unitsRaw === "" && s.unitsInput != null;

      const missingRate =
        !String(s.rateInput ?? "").trim() &&
        !String(s.rateUsdInput ?? "").trim() &&
        !String(s.rateEuroInput ?? "").trim();

      const missingTax =
        taxType !== "none" ? !String(s.taxId || "").trim() : false;

      return missingService || missingUnits || missingRate || missingTax;
    });

    if (rowMissing) {
      if (!String((rowMissing as any).detail || "").trim()) {
        showToast("Service is required");
      } else {
        const uRaw = String((rowMissing as any).unitsInput ?? "").trim();
        const rP = String((rowMissing as any).rateInput ?? "").trim();
        const rU = String((rowMissing as any).rateUsdInput ?? "").trim();
        const rE = String((rowMissing as any).rateEuroInput ?? "").trim();

        const missingRate = !rP && !rU && !rE;

        if (uRaw === "" && (rowMissing as any).unitsInput != null)
          showToast("Units is required");
        else if (missingRate) showToast("Rate is required");
        else if (
          taxType !== "none" &&
          !String((rowMissing as any).taxId || "").trim()
        )
          showToast("Tax is required");
      }
      savingRef.current = false;
      return;
    }

    setLoading(true);

    let subtotal = 0;
    let tax = 0;
    let total = 0;
    let whtTotal = 0;

    for (const s of sanitizedServices as any[]) {
      const line = calcLine(s);
      tax += line.taxAmount;

      const whtAmt = calcWhtAmount(s);
      total += line.lineTotal + whtAmt;
      whtTotal += whtAmt;

      if (taxType === "inclusive") subtotal += line.base - line.taxAmount;
      else subtotal += line.base;
    }

    const estimateBase: Estimate = {
      estimateNo: estimateNo || "",
      client,
      date,
      expiryDate,
      projectOwner,
      services: sanitizedServices as any,
      subtotal,
      tax,
      total,
      taxType,
      taxPercent: 0,
      taxCategory: "",
      poNumber,
      paymentTerm,
      company,
      subject,
      message,
      status,
      address: selectedClient?.address || "",
      info: selectedClient?.addtionalInfo || "",
      createdBy: auth.currentUser?.uid || "",
      ...({
        termsConditionId: selectedTermsId,
        termsConditionTitle,
        termsConditionText,
        withLogo,
        approvalReceivedOn,
        addCurrencies,

        currency1Code: addCurrencies ? currency1Code : "",
        currency2Code: addCurrencies ? currency2Code : "",

        usdRate: addCurrencies ? String(usdRate || "").trim() : "",
        euroRate: addCurrencies ? String(euroRate || "").trim() : "",
        whtTotal,
      } as any),
    };

    try {
      if (editId) {
        const ref = doc(db, "Panels", "IEDGE-SYSTEM", "estimates", editId);
        const estimateToUpdate: Estimate = {
          ...estimateBase,
          estimateNo: estimateNo,
        } as any;

        await updateDoc(ref, {
          ...estimateToUpdate,
          updatedAt: serverTimestamp(),
          editCount: increment(1),
        } as any);

        const blob = await buildEstimatePdfBlob({
          estimate: estimateToUpdate,
          companyList,
          withLogo,
          footerUser: loggedInUser,
          companyName: company,
        });

        const pdfURL = URL.createObjectURL(blob);
        setPreviewURL(pdfURL);
        setIsPreviewOpen(true);

        onSave?.(estimateToUpdate);
      } else {
        const createdEstimate = await runTransaction(db, async (tx) => {
          const counterRef = doc(
            db,
            "Panels",
            "IEDGE-SYSTEM",
            "counters",
            "estimates",
          );
          const counterSnap = await tx.get(counterRef);

          const current = Number(
            counterSnap.exists() ? counterSnap.data()?.current : 200000,
          );
          const nextNumber = current + 1;

          tx.set(counterRef, { current: nextNumber }, { merge: true });

          const nextEstimateNo = `IE-${nextNumber}`;

          const estimateToSave: Estimate = {
            ...estimateBase,
            estimateNo: nextEstimateNo,
            createdAt: serverTimestamp(),
          } as any;

          const newRef = doc(
            collection(db, "Panels", "IEDGE-SYSTEM", "estimates"),
          );
          tx.set(newRef, estimateToSave);

          return estimateToSave;
        });

        setEstimateNo(createdEstimate.estimateNo);

        const blob = await buildEstimatePdfBlob({
          estimate: createdEstimate,
          companyList,
          withLogo,
          footerUser: loggedInUser,
          companyName: company,
        });

        const pdfURL = URL.createObjectURL(blob);
        setPreviewURL(pdfURL);
        setIsPreviewOpen(true);

        onSave?.(createdEstimate);

        resetForm();
      }
    } catch (err) {
      console.error("Error saving estimate:", err);
      showToast("Failed to save estimate");
    } finally {
      setLoading(false);
      savingRef.current = false;
    }
  };

  // ✅ Live totals + live WHT
  const liveTotals = useMemo(() => {
    const sanitized = services.map((s) => ({
      ...s,
      taxPercent: typeof s.taxPercent === "number" ? s.taxPercent : 0,
      taxLabel: s.taxLabel || "",
      rateMode: s.rateMode || "amount",
      rate: Number(s.rate) || 0,
      units: Number(s.units) || 0,
      whtPercent: typeof s.whtPercent === "number" ? s.whtPercent : 0,
      whtLabel: s.whtLabel || "",
    }));

    let liveSubtotal = 0;
    let liveTax = 0;
    let liveTotal = 0;
    let liveWht = 0;

    for (const s of sanitized) {
      const line = calcLine(s);
      liveTax += line.taxAmount;
      liveTotal += line.lineTotal + calcWhtAmount(s);
      liveWht += calcWhtAmount(s);

      if (taxType === "inclusive") liveSubtotal += line.base - line.taxAmount;
      else liveSubtotal += line.base;
    }

    return { liveSubtotal, liveTax, liveTotal, liveWht };
  }, [services, taxType]);

  // ✅ Tax summary breakdown (live) + WHT summary breakdown (live)
  const liveSummary = useMemo(() => {
    const taxMap = new Map<string, { label: string; amount: number }>();
    const whtMap = new Map<string, { label: string; amount: number }>();

    for (const s of services) {
      if (taxType !== "none" && Number(s.taxPercent ?? 0) > 0) {
        const label =
          String(s.taxLabel || "").trim() ||
          `Tax (${Number(s.taxPercent ?? 0)}%)`;
        const amt = calcLine(s).taxAmount;
        if (amt !== 0) {
          const prev = taxMap.get(label);
          taxMap.set(label, { label, amount: (prev?.amount ?? 0) + amt });
        }
      }

      if (Number(s.whtPercent ?? 0) > 0) {
        const label =
          String(s.whtLabel || "").trim() ||
          `WHT (${Number(s.whtPercent ?? 0)}%)`;
        const amt = calcWhtAmount(s);
        if (amt !== 0) {
          const prev = whtMap.get(label);
          whtMap.set(label, { label, amount: (prev?.amount ?? 0) + amt });
        }
      }
    }

    return {
      taxRows: Array.from(taxMap.values()).filter((x) =>
        Number.isFinite(x.amount),
      ),
      whtRows: Array.from(whtMap.values()).filter((x) =>
        Number.isFinite(x.amount),
      ),
    };
  }, [services, taxType]);

  // ✅ invalid flags (basic)
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

  const c1Totals = addCurrencies
    ? {
        subtotal: convert(liveTotals.liveSubtotal, usdRate),
        tax: convert(liveTotals.liveTax, usdRate),
        wht: convert(liveTotals.liveWht, usdRate),
        total: convert(liveTotals.liveTotal, usdRate),
      }
    : null;

  const c2Totals = addCurrencies
    ? {
        subtotal: convert(liveTotals.liveSubtotal, euroRate),
        tax: convert(liveTotals.liveTax, euroRate),
        wht: convert(liveTotals.liveWht, euroRate),
        total: convert(liveTotals.liveTotal, euroRate),
      }
    : null;

  return (
    <div className="px-6 space-y-2 bg-gray-50 min-h-screen pb-28">
      <style>{`
        @keyframes blinkRedBorder {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); border-color: rgb(209, 213, 219); }
          50% { box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.35); border-color: rgb(239, 68, 68); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); border-color: rgb(209, 213, 219); }
        }
        .blink-red {
          animation: blinkRedBorder 0.9s ease-in-out infinite;
          border-color: rgb(239, 68, 68) !important;
        }
      `}</style>

      <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
        <h3 className="text-sm font-semibold mb-3 text-gray-700">
          Basic Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <div className="mt-2 bg-blue-50 border border-blue-200 p-2 rounded-lg text-sm text-gray-700">
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
            >
              <option value="">Select Tax Type</option>
              <option value="inclusive">Inclusive</option>
              <option value="exclusive">Exclusive</option>
              <option value="none">Not Applicable</option>
            </select>
            {taxType && (
              <p className="mt-1 text-xs text-gray-500">
                Selected Tax: {taxType}
              </p>
            )}
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

          {/* ✅ Add Currencies (2 dropdowns + 2 rates) */}
          <div className="mt-2">
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
              <div className="mt-2 space-y-2">
                {/* Currency 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Currency 1
                    </label>
                    <select
                      value={currency1Code}
                      onChange={(e) => {
                        const next = e.target.value;
                        setCurrency1Code(next);
                        if (next === currency2Code) {
                          const alt =
                            POPULAR_CURRENCIES.find((c) => c.code !== next)
                              ?.code || "EUR";
                          setCurrency2Code(alt);
                        }
                      }}
                      className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                    >
                      {POPULAR_CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} - {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {currency1Code} Rate (PKR per 1 {currency1Code})
                    </label>
                    <input
                      inputMode="decimal"
                      value={usdRate}
                      onChange={(e) =>
                        setUsdRate(sanitizeFxRateInput(e.target.value))
                      }
                      onBlur={(e) => setUsdRate(fxBlurFix(e.target.value))}
                      className={fieldClass(
                        "w-full rounded-lg border border-gray-300 p-2 text-sm",
                        invalidUsd,
                      )}
                      placeholder="e.g. 280"
                    />
                  </div>
                </div>

                {/* Currency 2 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Currency 2
                    </label>
                    <select
                      value={currency2Code}
                      onChange={(e) => {
                        const next = e.target.value;
                        setCurrency2Code(next);
                        if (next === currency1Code) {
                          const alt =
                            POPULAR_CURRENCIES.find((c) => c.code !== next)
                              ?.code || "USD";
                          setCurrency1Code(alt);
                        }
                      }}
                      className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                    >
                      {POPULAR_CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} - {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {currency2Code} Rate (PKR per 1 {currency2Code})
                    </label>
                    <input
                      inputMode="decimal"
                      value={euroRate}
                      onChange={(e) =>
                        setEuroRate(sanitizeFxRateInput(e.target.value))
                      }
                      onBlur={(e) => setEuroRate(fxBlurFix(e.target.value))}
                      className={fieldClass(
                        "w-full rounded-lg border border-gray-300 p-2 text-sm",
                        invalidEuro,
                      )}
                      placeholder="e.g. 305"
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-500">
                  Rates are PKR per 1 unit of the selected currency.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold mb-4 text-gray-700">Services</h3>

        <div className="overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-700 text-left">
                  <th className="p-3 font-semibold border-b w-10 text-center">
                    ↕
                  </th>
                  <th className="p-3 font-semibold border-b">Service</th>
                  <th className="p-3 font-semibold border-b">Description</th>
                  <th className="p-3 font-semibold border-b text-center">
                    Units
                  </th>
                  <th className="p-3 font-semibold border-b text-center">
                    Rate
                  </th>
                  <th className="p-3 font-semibold border-b text-center">
                    Tax
                  </th>
                  <th className="p-3 font-semibold border-b text-center">
                    WHT
                  </th>
                  <th className="p-3 font-semibold border-b text-right">
                    Amount
                  </th>

                  {addCurrencies && (
                    <>
                      <th className="p-3 font-semibold border-b text-right whitespace-nowrap">
                        Amount ({c1Head})
                      </th>
                      <th className="p-3 font-semibold border-b text-right whitespace-nowrap">
                        Amount ({c2Head})
                      </th>
                    </>
                  )}

                  <th className="p-3 font-semibold border-b text-center">
                    PDF
                  </th>
                  <th className="p-3 font-semibold border-b text-center w-12"></th>
                </tr>
              </thead>

              <SortableContext
                items={rowIds}
                strategy={verticalListSortingStrategy}
              >
                <tbody>
                  {services.map((s, i) => {
                    const filtered = servicesList.filter((sv) =>
                      sv.name
                        .toLowerCase()
                        .includes((s.detail || "").toLowerCase()),
                    );

                    const invalidService =
                      submitAttempted && !String(s.detail || "").trim();

                    const invalidUnits =
                      submitAttempted &&
                      String(s.unitsInput ?? "").trim() === "" &&
                      s.unitsInput != null;

                    const invalidRate = submitAttempted && !hasAnyRateInput(s);

                    const invalidTax =
                      submitAttempted &&
                      taxType !== "none" &&
                      !String(s.taxId || "").trim();

                    const pkrAmount = calcLineTotalWithWht(s);

                    const c1Amount =
                      addCurrencies && usdRate
                        ? pkrAmount / Number(String(usdRate).replace(/,/g, ""))
                        : 0;

                    const c2Amount =
                      addCurrencies && euroRate
                        ? pkrAmount / Number(String(euroRate).replace(/,/g, ""))
                        : 0;

                    return (
                      <SortableRow key={s.rowId} id={s.rowId}>
                        {({ attributes, listeners, setActivatorNodeRef }) => (
                          <>
                            <td className="p-2 text-center">
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

                            {/* Service */}
                            <td className="p-2">
                              <div
                                className="relative"
                                ref={
                                  openServiceRowId === s.rowId
                                    ? serviceDropdownRef
                                    : null
                                }
                              >
                                <div className="flex items-center gap-1">
                                  <input
                                    value={s.detail}
                                    onChange={(e) => {
                                      handleServiceChange(i, e.target.value);
                                      if (openServiceRowId !== s.rowId)
                                        setOpenServiceRowId(s.rowId);
                                    }}
                                    onFocus={() => setOpenServiceRowId(null)}
                                    placeholder="Type or select service"
                                    className={fieldClass(
                                      "w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500",
                                      invalidService,
                                    )}
                                  />
                                  <button
                                    type="button"
                                    className="border border-gray-300 rounded-md p-2 hover:bg-gray-50"
                                    title="Show services"
                                    onClick={() =>
                                      setOpenServiceRowId((prev) =>
                                        prev === s.rowId ? null : s.rowId,
                                      )
                                    }
                                  >
                                    <ChevronDown size={16} />
                                  </button>
                                </div>

                                {openServiceRowId === s.rowId ? (
                                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-auto">
                                    {filtered.length === 0 ? (
                                      <div className="p-2 text-xs text-gray-500">
                                        No matching services
                                      </div>
                                    ) : (
                                      filtered.map((sv) => (
                                        <button
                                          key={sv.id}
                                          type="button"
                                          className="w-full text-left px-3 py-2 hover:bg-gray-50"
                                          onClick={() => {
                                            handleServiceChange(i, sv.name);
                                            setOpenServiceRowId(null);
                                          }}
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

                            <td className="p-2">
                              <textarea
                                rows={4}
                                cols={36}
                                value={s.description}
                                onChange={(e) => {
                                  const copy = [...services];
                                  copy[i].description = e.target.value;
                                  setServices(copy);
                                }}
                                placeholder="Service description"
                                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                              />
                            </td>

                            {/* Units */}
                            <td className="p-0 text-center">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={
                                  s.unitsInput ??
                                  (Number.isFinite(Number(s.units))
                                    ? fmtIntLoose(Number(s.units))
                                    : "")
                                }
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  const copy = [...services];
                                  copy[i].unitsInput = raw;
                                  copy[i].units = parseIntLoose(raw);
                                  setServices(copy);
                                }}
                                onBlur={() => {
                                  const copy = [...services];
                                  const raw = String(
                                    copy[i].unitsInput ?? "",
                                  ).trim();

                                  if (raw === "") {
                                    copy[i].unitsInput = "";
                                    setServices(copy);
                                    return;
                                  }

                                  const n = Number(copy[i].units) || 0;
                                  copy[i].unitsInput = fmtIntLoose(n);
                                  setServices(copy);
                                }}
                                placeholder="Units"
                                className={fieldClass(
                                  "w-24 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 text-center",
                                  invalidUnits,
                                )}
                              />
                            </td>

                            {/* Rate */}
                            <td className="p-2 text-center align-top">
                              <div className="flex flex-col gap-1 items-center">
                                {/* PKR */}
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-gray-500 w-12 text-right">
                                    PKR
                                  </span>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={s.rateInput ?? ""}
                                    onChange={(e) =>
                                      handleRateChange(i, "PKR", e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter")
                                        (
                                          e.currentTarget as HTMLInputElement
                                        ).blur();
                                    }}
                                    onBlur={() => handleRateBlur(i, "PKR")}
                                    placeholder="e.g. 500*3 or 15%"
                                    className={fieldClass(
                                      "w-28 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 text-center",
                                      invalidRate,
                                    )}
                                  />
                                </div>

                                {/* Currency 1 */}
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-gray-500 w-12 text-right">
                                    {currency1Code}
                                  </span>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    disabled={!addCurrencies}
                                    value={s.rateUsdInput ?? ""}
                                    onChange={(e) =>
                                      handleRateChange(i, "FX1", e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter")
                                        (
                                          e.currentTarget as HTMLInputElement
                                        ).blur();
                                    }}
                                    onBlur={() => handleRateBlur(i, "FX1")}
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

                                {/* Currency 2 */}
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-gray-500 w-12 text-right">
                                    {currency2Code}
                                  </span>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    disabled={!addCurrencies}
                                    value={s.rateEuroInput ?? ""}
                                    onChange={(e) =>
                                      handleRateChange(i, "FX2", e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter")
                                        (
                                          e.currentTarget as HTMLInputElement
                                        ).blur();
                                    }}
                                    onBlur={() => handleRateBlur(i, "FX2")}
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

                                {s.rateMode === "percent" ? (
                                  <div className="text-[11px] text-gray-500 mt-1">
                                    Rate mode: %
                                  </div>
                                ) : null}
                              </div>
                            </td>

                            {/* Tax */}
                            <td className="p-0 text-center">
                              <select
                                value={taxType === "none" ? "" : s.taxId || ""}
                                onFocus={loadTaxCategories}
                                onClick={loadTaxCategories}
                                onChange={(e) => {
                                  const id = e.target.value;
                                  const copy = [...services];

                                  if (!id) {
                                    copy[i].taxId = "";
                                    copy[i].taxLabel = "";
                                    copy[i].taxPercent = 0;
                                    setServices(copy);
                                    return;
                                  }

                                  if (id === NO_TAX_ID) {
                                    copy[i].taxId = NO_TAX_ID;
                                    copy[i].taxLabel = "No Tax";
                                    copy[i].taxPercent = 0;
                                    setServices(copy);
                                    return;
                                  }

                                  const selected = taxCategories.find(
                                    (t) => String(t.id) === String(id),
                                  );
                                  copy[i].taxId = id;
                                  copy[i].taxLabel = selected?.name || "";
                                  copy[i].taxPercent = Number(
                                    selected?.percent ?? 0,
                                  );
                                  setServices(copy);
                                }}
                                disabled={taxType === "none"}
                                className={fieldClass(
                                  "w-full border text-xs border-gray-300 rounded-md px-0 py-2 text-center bg-white disabled:bg-gray-100",
                                  invalidTax,
                                )}
                              >
                                <option value="">
                                  {taxType === "none"
                                    ? "N/A"
                                    : loadingTax && taxCategories.length === 0
                                      ? "Loading..."
                                      : "Select Tax"}
                                </option>
                                {taxType !== "none" && (
                                  <option value={NO_TAX_ID}>No Tax (0%)</option>
                                )}
                                {taxCategories.map((t) => (
                                  <option key={t.id} value={String(t.id)}>
                                    {t.name} ({Number(t.percent ?? 0)}%)
                                  </option>
                                ))}
                              </select>

                              {taxType !== "none" && (s.taxPercent ?? 0) > 0 ? (
                                <div className="text-xs text-gray-500 mt-1">
                                  Tax: {formatMoney(calcLine(s).taxAmount)}
                                </div>
                              ) : null}
                            </td>

                            {/* WHT */}
                            <td className="p-0 text-center">
                              <select
                                value={s.whtId || ""}
                                onFocus={loadWhtCategories}
                                onClick={loadWhtCategories}
                                onChange={(e) => {
                                  const id = e.target.value;
                                  const copy = [...services];

                                  if (!id) {
                                    copy[i].whtId = "";
                                    copy[i].whtLabel = "";
                                    copy[i].whtPercent = 0;
                                    setServices(copy);
                                    return;
                                  }

                                  if (id === NO_WHT_ID) {
                                    copy[i].whtId = NO_WHT_ID;
                                    copy[i].whtLabel = "No WHT";
                                    copy[i].whtPercent = 0;
                                    setServices(copy);
                                    return;
                                  }

                                  const selected = whtCategories.find(
                                    (t) => String(t.id) === String(id),
                                  );
                                  copy[i].whtId = id;
                                  copy[i].whtLabel = selected?.name || "";
                                  copy[i].whtPercent = Number(
                                    selected?.percent ?? 0,
                                  );
                                  setServices(copy);
                                }}
                                className="w-full border text-xs border-gray-300 rounded-md px-0 py-2 text-center bg-white"
                              >
                                <option value="">
                                  {loadingWht && whtCategories.length === 0
                                    ? "Loading..."
                                    : "Select WHT"}
                                </option>
                                <option value={NO_WHT_ID}>No WHT (0%)</option>
                                {whtCategories.map((t) => (
                                  <option key={t.id} value={String(t.id)}>
                                    {t.name} ({Number(t.percent ?? 0)}%)
                                  </option>
                                ))}
                              </select>

                              {(s.whtPercent ?? 0) > 0 ? (
                                <div className="text-xs text-gray-500 mt-1">
                                  WHT: {formatMoney(calcWhtAmount(s))}
                                </div>
                              ) : null}
                            </td>

                            {/* Amount */}
                            <td className="p-2 text-right tabular-nums">
                              {formatMoney(calcLineTotalWithWht(s))}
                            </td>

                            {addCurrencies && (
                              <>
                                <td className="p-2 text-right tabular-nums text-gray-600 whitespace-nowrap">
                                  {formatWithSymbol(c1.symbol, c1Amount)}
                                </td>

                                <td className="p-2 text-right tabular-nums text-gray-600 whitespace-nowrap">
                                  {formatWithSymbol(c2.symbol, c2Amount)}
                                </td>
                              </>
                            )}

                            {/* per-row checkbox */}
                            <td className="p-2 align-top">
                              <label className="flex items-start gap-2 text-[11px] text-gray-700 leading-snug max-w-[220px]">
                                <input
                                  type="checkbox"
                                  className="accent-black mt-0.5"
                                  checked={s.showFinancialsInPdf ?? true}
                                  onChange={(e) => {
                                    const copy = [...services];
                                    copy[i].showFinancialsInPdf =
                                      e.target.checked;
                                    setServices(copy);
                                  }}
                                />
                                <span>Show Calcs</span>
                              </label>
                            </td>

                            <td className="p-2 text-center">
                              {services.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRow(i)}
                                  className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
                                  title="Remove row"
                                  aria-label="Remove row"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </td>
                          </>
                        )}
                      </SortableRow>
                    );
                  })}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>

          <Button onClick={handleAddRow} className="mt-3">
            Add Row
          </Button>

          {/* ✅ Live Totals + ✅ Tax Summary */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 justify-end">
            {/* Totals */}
            <div className="w-full border rounded-lg bg-gray-50 p-4">
              <div className="flex justify-between">
                <span className="font-semibold">SUBTOTAL</span>
                <span className="tabular-nums text-right">
                  {formatMoney(liveTotals.liveSubtotal)}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="font-semibold">TAX</span>
                <span className="tabular-nums text-right">
                  {formatMoney(liveTotals.liveTax)}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="font-semibold">WHT</span>
                <span className="tabular-nums text-right">
                  {formatMoney(liveTotals.liveWht)}
                </span>
              </div>
              <div className="flex justify-between mt-2 pt-2 border-t">
                <span className="font-bold text-lg">TOTAL</span>
                <span className="font-bold text-lg tabular-nums text-right">
                  {formatMoney(liveTotals.liveTotal)}
                </span>
              </div>

              {addCurrencies && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Currency 1 */}
                  <div className="border rounded-lg bg-gray-50 p-4">
                    <div className="font-semibold text-gray-700 mb-2">
                      {c1Head} (Converted)
                    </div>

                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="tabular-nums">
                        {formatWithSymbol(c1.symbol, c1Totals?.subtotal)}
                      </span>
                    </div>

                    <div className="flex justify-between mt-1">
                      <span>Tax</span>
                      <span className="tabular-nums">
                        {formatWithSymbol(c1.symbol, c1Totals?.tax)}
                      </span>
                    </div>

                    <div className="flex justify-between mt-1">
                      <span>WHT</span>
                      <span className="tabular-nums">
                        {formatWithSymbol(c1.symbol, c1Totals?.wht)}
                      </span>
                    </div>

                    <div className="flex justify-between mt-2 pt-2 border-t font-bold">
                      <span>Total</span>
                      <span className="tabular-nums">
                        {formatWithSymbol(c1.symbol, c1Totals?.total)}
                      </span>
                    </div>
                  </div>

                  {/* Currency 2 */}
                  <div className="border rounded-lg bg-gray-50 p-4">
                    <div className="font-semibold text-gray-700 mb-2">
                      {c2Head} (Converted)
                    </div>

                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="tabular-nums">
                        {formatWithSymbol(c2.symbol, c2Totals?.subtotal)}
                      </span>
                    </div>

                    <div className="flex justify-between mt-1">
                      <span>Tax</span>
                      <span className="tabular-nums">
                        {formatWithSymbol(c2.symbol, c2Totals?.tax)}
                      </span>
                    </div>

                    <div className="flex justify-between mt-1">
                      <span>WHT</span>
                      <span className="tabular-nums">
                        {formatWithSymbol(c2.symbol, c2Totals?.wht)}
                      </span>
                    </div>

                    <div className="flex justify-between mt-2 pt-2 border-t font-bold">
                      <span>Total</span>
                      <span className="tabular-nums">
                        {formatWithSymbol(c2.symbol, c2Totals?.total)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="w-full border rounded-lg bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-700">Tax Summary</span>
                <span className="text-xs text-gray-500">(Live)</span>
              </div>

              {liveSummary.taxRows.length === 0 &&
              liveSummary.whtRows.length === 0 ? (
                <p className="text-sm text-gray-600">No tax/WHT applied yet.</p>
              ) : (
                <div className="space-y-3">
                  {liveSummary.taxRows.length > 0 ? (
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">
                        TAX
                      </div>
                      <table className="w-full text-sm">
                        <tbody>
                          {liveSummary.taxRows.map((r) => (
                            <tr key={r.label}>
                              <td className="py-1 pr-2 text-gray-700">
                                {r.label}
                              </td>
                              <td className="py-1 text-right tabular-nums">
                                {formatMoney(r.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}

                  {liveSummary.whtRows.length > 0 ? (
                    <div className="pt-2 border-t">
                      <div className="text-xs font-semibold text-gray-600 mb-1">
                        WITH HOLDING TAX (WHT)
                      </div>
                      <table className="w-full text-sm">
                        <tbody>
                          {liveSummary.whtRows.map((r) => (
                            <tr key={r.label}>
                              <td className="py-1 pr-2 text-gray-700">
                                {r.label}
                              </td>
                              <td className="py-1 text-right tabular-nums">
                                {formatMoney(r.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Message */}
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
        </div>

        {/* Terms */}
        <div className="mt-4 space-y-3">
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
              <p className="text-xs text-gray-400 mt-1">
                This text is editable and will be saved + printed exactly
                (including line breaks).
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex justify-between gap-3">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : editId ? "Update & Save" : "Save"}
          </Button>
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
              <ToastTitle>Missing Field</ToastTitle>
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
