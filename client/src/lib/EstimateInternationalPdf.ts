// src/lib/EstimateInternationalPdf.ts
import jsPDF from "jspdf";
import autoTable, { CellHookData } from "jspdf-autotable";

/**
 * buildEstimatePdfBlob({ estimate, companyList, withLogo, footerUser, companyName })
 * Compatible with your existing call signature.
 */

type RateCurrency = "PKR" | "USD" | "EUR";
type RowType = "main" | "item";

type BaseRow = {
  rowId: string;
  rowType: RowType;
  showFinancialsInPdf?: boolean;
};

type MainHeadingRow = BaseRow & {
  rowType: "main";
  mainHeading: string;
};

type ItemRow = BaseRow & {
  rowType: "item";
  detail: string;

  subHeadingText?: string;
  description?: string;
  subHeadings?: string[];

  units: number;
  daysNights: number;
  persons: number;

  baseRate: number;
  baseRateMode?: "amount" | "percent";
  baseRateCurrency?: RateCurrency;

  profitPercent: number;

  taxId?: string;
  taxLabel?: string;
  taxPercent?: number;

  whtId?: string;
  whtLabel?: string;
  whtPercent?: number;

  taxationServiceId?: string;
  taxationName?: string;
  taxationText?: string;
};

type ServiceRow = MainHeadingRow | ItemRow;

const isMainRow = (r: ServiceRow): r is MainHeadingRow => r.rowType === "main";
const isItemRow = (r: ServiceRow): r is ItemRow => r.rowType === "item";

// ===== Colors =====
const DARK_TEAL: [number, number, number] = [7, 79, 105];
const LIGHT_BLUE: [number, number, number] = [193, 231, 245];
const WHITE: [number, number, number] = [255, 255, 255];
const GRID: [number, number, number] = [210, 210, 210];
const BLACK: [number, number, number] = [0, 0, 0];

const num = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const safeText = (v: any) =>
  String(v ?? "")
    .replace(/\r\n/g, "\n")
    .trim();

const money0 = (n: any) =>
  Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

const money2 = (n: any) =>
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const currencySymbol = (code: string) => {
  const map: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    PKR: "₨",
    AED: "د.إ",
    SAR: "ر.س",
    QAR: "ر.ق",
    KWD: "د.ك",
    BHD: ".د.ب",
    OMR: "ر.ع.",
  };
  return map[code] || code;
};

function deriveSubHeadingText(s: any): string {
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
}

function convertFromPKR(pkr: number, fx: number) {
  return fx > 0 ? pkr / fx : null;
}

function calcSellBreakdownPKR(r: ItemRow, taxType: string) {
  const units = num(r.units);
  const days = num(r.daysNights);
  const persons = num(r.persons);
  const multiplier = units * days * persons;

  const mode = r.baseRateMode || "amount";
  const baseRate = num(r.baseRate);
  const profitPct = num(r.profitPercent);

  let supplierRate = 0;
  let profitRate = 0;
  let sellRate = 0;
  let sellBase = 0;

  if (mode === "percent") {
    sellBase = multiplier * (baseRate / 100);
  } else {
    supplierRate = baseRate;
    profitRate = (supplierRate * profitPct) / 100;
    sellRate = supplierRate + profitRate;
    sellBase = multiplier * sellRate;
  }

  const pctTax = num(r.taxPercent);

  if (taxType === "none" || pctTax <= 0) {
    return {
      multiplier,
      mode,
      supplierRate,
      profitRate,
      sellRate,
      sellBase,
      taxAmount: 0,
      lineTotal: sellBase,
    };
  }

  if (taxType === "exclusive") {
    const taxAmount = (sellBase * pctTax) / 100;
    return {
      multiplier,
      mode,
      supplierRate,
      profitRate,
      sellRate,
      sellBase,
      taxAmount,
      lineTotal: sellBase + taxAmount,
    };
  }

  // inclusive
  const taxAmount = (sellBase * pctTax) / (100 + pctTax);
  return {
    multiplier,
    mode,
    supplierRate,
    profitRate,
    sellRate,
    sellBase,
    taxAmount,
    lineTotal: sellBase,
  };
}

function calcWhtPKR(r: ItemRow, taxType: string) {
  const pct = num(r.whtPercent);
  if (pct <= 0) return 0;
  const sell = calcSellBreakdownPKR(r, taxType);
  return (sell.lineTotal * pct) / 100;
}

function makeTableStyleHooks() {
  return {
    didParseCell: (data: CellHookData) => {
      if (data.section === "head") {
        data.cell.styles.fillColor = DARK_TEAL as any;
        data.cell.styles.textColor = WHITE as any;
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.halign = "center";
        data.cell.styles.valign = "middle";
      }

      const raw: any = (data.cell as any).raw;
      if (data.section === "body" && raw && raw.__mainBand === true) {
        data.cell.styles.fillColor = LIGHT_BLUE as any;
        data.cell.styles.textColor = BLACK as any;
        data.cell.styles.fontStyle = "bold";
      }

      data.cell.styles.lineColor = GRID as any;
      data.cell.styles.lineWidth = 0.4;
    },
  };
}

/** ===== Logo helpers ===== */
function isDataUrl(s: string) {
  return /^data:image\/(png|jpeg|jpg);base64,/i.test(s);
}
function normalizeBase64ToDataUrl(s: string) {
  const t = String(s || "").trim();
  if (!t) return "";
  if (t.startsWith("data:image/")) return t;
  const isJpg = t.startsWith("/9j/");
  const mime = isJpg ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${t}`;
}

function arrayBufferToBase64(ab: ArrayBuffer): string {
  const B: any = (globalThis as any).Buffer;
  if (B && typeof B.from === "function") return B.from(ab).toString("base64");

  const btoaFn: any = (globalThis as any).btoa;
  if (typeof btoaFn !== "function") return "";

  const bytes = new Uint8Array(ab);
  const chunk = 0x8000;
  let binary = "";

  // ES5-safe
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    binary += String.fromCharCode.apply(null, slice as any);
  }

  return btoaFn(binary);
}

function getBaseOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin)
    return window.location.origin;

  const p: any = typeof process !== "undefined" ? process : null;
  const env = p?.env || {};
  if (env.NEXT_PUBLIC_SITE_URL) return String(env.NEXT_PUBLIC_SITE_URL);
  if (env.SITE_URL) return String(env.SITE_URL);
  if (env.VERCEL_URL) return `https://${String(env.VERCEL_URL)}`;
  return "";
}

async function urlToDataUrl(url: string): Promise<string> {
  try {
    let finalUrl = String(url || "").trim();
    if (!finalUrl) return "";
    if (isDataUrl(finalUrl)) return finalUrl;

    const origin = getBaseOrigin();
    if (
      origin &&
      (/^\/|^\.\.?\//.test(finalUrl) || /\.(png|jpe?g)$/i.test(finalUrl))
    ) {
      if (!/^https?:\/\//i.test(finalUrl))
        finalUrl = new URL(finalUrl, origin).toString();
    }

    if (!/^https?:\/\//i.test(finalUrl) && typeof window === "undefined")
      return "";

    const res = await fetch(finalUrl);
    if (!res.ok) return "";

    const ab = await res.arrayBuffer();
    const base64 = arrayBufferToBase64(ab);
    if (!base64) return "";

    const ct = res.headers.get("content-type") || "image/png";
    if (/image\/svg\+xml/i.test(ct)) return "";

    return `data:${ct};base64,${base64}`;
  } catch {
    return "";
  }
}

async function getImageNaturalSize(
  dataUrl: string,
): Promise<{ w: number; h: number } | null> {
  try {
    if (typeof (globalThis as any).Image === "undefined") return null;
    return await new Promise((resolve) => {
      const img = new (globalThis as any).Image();
      img.onload = () =>
        resolve({
          w: img.naturalWidth || img.width,
          h: img.naturalHeight || img.height,
        });
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  } catch {
    return null;
  }
}

function getImageFormat(dataUrl: string): "PNG" | "JPEG" {
  return /data:image\/(jpeg|jpg);base64,/i.test(dataUrl) ? "JPEG" : "PNG";
}

function pickFirstTruthy(...vals: any[]) {
  for (const v of vals) {
    const t = safeText(v);
    if (t) return t;
  }
  return "";
}

async function resolveCompanyLogoDataUrl(args: {
  estimate: any;
  withLogo?: boolean;
  companyName?: string;
  companyList?: any[];
}): Promise<string> {
  if (!args.withLogo) return "";

  const estimate = args.estimate || {};
  const companyName = safeText(
    args.companyName ||
      estimate.companyName ||
      estimate.company ||
      estimate.company?.name ||
      "",
  );
  const companyId = safeText(
    estimate.companyId || estimate.company?.id || estimate.company?.uid || "",
  );

  const candidate = pickFirstTruthy(
    estimate.logoDataUrl,
    estimate.logoDataURL,
    estimate.companyLogoDataUrl,
    estimate.companyLogoDataURL,
    estimate.logoBase64,
    estimate.companyLogoBase64,
    estimate.logo,
    estimate.companyLogo,
    estimate.logoUrl,
    estimate.logoURL,
    estimate.companyLogoUrl,
    estimate.companyLogoURL,
    estimate.company?.logoDataUrl,
    estimate.company?.logoDataURL,
    estimate.company?.logoBase64,
    estimate.company?.logo,
    estimate.company?.logoUrl,
    estimate.company?.logoURL,
  );

  let c = candidate;

  if (!c && Array.isArray(args.companyList)) {
    const targetName = companyName.toLowerCase();
    const targetId = companyId.toLowerCase();

    const found =
      args.companyList.find(
        (x: any) => safeText(x?.id || x?.uid).toLowerCase() === targetId,
      ) ||
      args.companyList.find(
        (x: any) =>
          safeText(x?.name || x?.companyName || x?.title).toLowerCase() ===
          targetName,
      ) ||
      args.companyList.find((x: any) =>
        safeText(x?.name || x?.companyName || x?.title)
          .toLowerCase()
          .includes(targetName),
      );

    c = pickFirstTruthy(
      found?.logoDataUrl,
      found?.logoDataURL,
      found?.logoBase64,
      found?.logo,
      found?.logoUrl,
      found?.logoURL,
      found?.image,
      found?.imageUrl,
      found?.imageURL,
    );
  }

  if (!c) return "";
  if (isDataUrl(c)) return c;

  const looksLikeUrl =
    /^https?:\/\//i.test(c) ||
    /^\/|^\.\.?\//.test(c) ||
    /\.(png|jpe?g)$/i.test(c);
  if (looksLikeUrl) {
    const data = await urlToDataUrl(c);
    return isDataUrl(data) ? data : "";
  }

  const dataUrl = normalizeBase64ToDataUrl(c);
  return isDataUrl(dataUrl) ? dataUrl : "";
}

function fitFontSizeToSingleLine(
  doc: jsPDF,
  text: string,
  maxW: number,
  start: number,
  min: number,
) {
  let size = start;
  doc.setFontSize(size);
  while (doc.getTextWidth(text) > maxW && size > min) {
    size -= 0.5;
    doc.setFontSize(size);
  }
  return size;
}

function scaleWidthsToTarget(base: number[], target: number) {
  const sum = base.reduce((a, b) => a + b, 0);
  if (sum <= 0) return base.slice();

  const s = target / sum;
  const out = base.map((w) => Math.round(w * s * 100) / 100);

  const sumExceptLast = out.slice(0, out.length - 1).reduce((a, b) => a + b, 0);
  out[out.length - 1] = Math.max(
    0,
    Math.round((target - sumExceptLast) * 100) / 100,
  );

  return out;
}

export async function buildEstimatePdfBlob(args: {
  estimate: any;
  withLogo?: boolean;
  companyName?: string;
  companyList?: any[];
  footerUser?: {
    displayName?: string;
    email?: string;
    mobileCountryCode?: string;
    mobileNo?: string;
    mobile?: string;
  } | null;
}) {
  const estimate = args.estimate || {};
  const services: ServiceRow[] = Array.isArray(estimate.services)
    ? estimate.services
    : [];

  const withLogo = Boolean(
    args.withLogo ??
      estimate.withLogo ??
      estimate.printLogo ??
      estimate.withCompanyLogo,
  );

  const client = safeText(estimate.client || "");
  const address = safeText(estimate.address || "");
  const projectOwner = safeText(estimate.projectOwner || "");
  const paymentTerm = safeText(estimate.paymentTerm || "");
  const estimateNo = safeText(estimate.estimateNo || "");
  const issueDate = safeText(estimate.date || "");
  const expiryDate = safeText(estimate.expiryDate || "");
  const subject = safeText(
    estimate.subject ||
      estimate.estimateSubject ||
      estimate.projectSubject ||
      "",
  );

  const footerUser = args.footerUser || null;
  const createdByName = safeText(
    footerUser?.displayName || estimate.createdByName || "",
  );
  const createdByEmail = safeText(
    footerUser?.email || estimate.createdByEmail || "",
  );
  const createdByMobile = safeText(
    footerUser?.mobile ||
      estimate.createdByMobile ||
      `${footerUser?.mobileCountryCode ?? ""}${footerUser?.mobileNo ?? ""}`,
  );

  const taxType = safeText(estimate.taxType || "none");
  const addCurrencies = Boolean(estimate.addCurrencies);

  const usdRate = num(estimate.usdRate);
  const euroRate = num(estimate.euroRate);
  const usdCurrency = safeText(estimate.usdCurrency || "USD");
  const euroCurrency = safeText(estimate.euroCurrency || "EUR");
  const symUSD = currencySymbol(usdCurrency);
  const symEUR = currencySymbol(euroCurrency);

  let subtotalPKR = 0;
  let taxPKR = 0;
  let totalPKR = 0;

  type SummaryAgg = { ratePct: number; taxPKR: number; netPKR: number };
  const taxSummary: Record<string, SummaryAgg> = {};
  const whtSummary: Record<string, SummaryAgg> = {};

  type SectionAgg = {
    totalCostPKR: number;
    taxPKR: number;
    whtPKR: number;
    amountPKR: number;
  };
  const sectionTotals: Record<string, SectionAgg> = {};
  let currentMainId: string | null = null;

  for (const r of services) {
    if (isMainRow(r)) {
      currentMainId = r.rowId;
      sectionTotals[currentMainId] = {
        totalCostPKR: 0,
        taxPKR: 0,
        whtPKR: 0,
        amountPKR: 0,
      };
      continue;
    }
    if (!isItemRow(r)) continue;

    const show = r.showFinancialsInPdf !== false;

    const sell = calcSellBreakdownPKR(r, taxType);
    const wht = calcWhtPKR(r, taxType);
    const amountPKR = sell.lineTotal + wht;

    if (show) {
      taxPKR += sell.taxAmount;
      totalPKR += amountPKR;

      if (taxType === "inclusive")
        subtotalPKR += sell.sellBase - sell.taxAmount;
      else subtotalPKR += sell.sellBase;

      if (currentMainId) {
        sectionTotals[currentMainId].totalCostPKR += sell.sellBase;
        sectionTotals[currentMainId].taxPKR += sell.taxAmount;
        sectionTotals[currentMainId].whtPKR += wht;
        sectionTotals[currentMainId].amountPKR += amountPKR;
      }

      const tPct = num(r.taxPercent);
      if (taxType !== "none" && tPct > 0 && sell.taxAmount > 0) {
        const label = safeText(r.taxLabel || "Tax");
        const key = `${label}|${tPct}`;
        const netBase =
          taxType === "inclusive"
            ? sell.sellBase - sell.taxAmount
            : sell.sellBase;

        if (!taxSummary[key])
          taxSummary[key] = { ratePct: tPct, taxPKR: 0, netPKR: 0 };
        taxSummary[key].taxPKR += sell.taxAmount;
        taxSummary[key].netPKR += netBase;
      }

      const wPct = num(r.whtPercent);
      if (wPct > 0 && wht > 0) {
        const label = safeText(r.whtLabel || "WHT");
        const key = `${label}|${wPct}`;
        const netBase = sell.lineTotal;

        if (!whtSummary[key])
          whtSummary[key] = { ratePct: wPct, taxPKR: 0, netPKR: 0 };
        whtSummary[key].taxPKR += wht;
        whtSummary[key].netPKR += netBase;
      }
    }
  }

  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const margin = 20;
  const BODY_START_Y = 60;

  // Bottom reserve for page number only
  const CONTENT_BOTTOM_Y = pageH - 26;

  // Footer (last page only)
  const FOOTER_BLOCK_TOP_Y = pageH - 52; // top boundary of the 2-line footer block
  const FOOTER_LINE1_Y = pageH - 40;
  const FOOTER_LINE2_Y = pageH - 28;

  const EDGE_PAD = 0;
  const TABLE_X = EDGE_PAD;
  const TABLE_W = pageW - EDGE_PAD * 2;

  const BASE_SERVICES_COL_W = [180, 65, 27, 32, 30, 70, 22, 25, 80, 80];
  const SERVICES_COL_W = scaleWidthsToTarget(BASE_SERVICES_COL_W, TABLE_W);

  const BASE_SUMMARY_COL_W = [320, 70, 150, 175];
  const SUMMARY_COL_W = scaleWidthsToTarget(BASE_SUMMARY_COL_W, TABLE_W);

  const totalsW1 = Math.round((TABLE_W / 3) * 100) / 100;
  const totalsW2 = totalsW1;
  const totalsW3 = Math.max(
    0,
    Math.round((TABLE_W - totalsW1 - totalsW2) * 100) / 100,
  );

  const logoDataUrl = await resolveCompanyLogoDataUrl({
    estimate,
    withLogo,
    companyName: args.companyName,
    companyList: args.companyList,
  });

  const logoFormat = logoDataUrl ? getImageFormat(logoDataUrl) : "PNG";
  const natural = logoDataUrl ? await getImageNaturalSize(logoDataUrl) : null;

  const LOGO_MAX_W = 150;
  const LOGO_MAX_H = 42;

  const logoDraw = (() => {
    if (!logoDataUrl) return null;
    if (!natural) return { w: 120, h: 34 };
    const rw = natural.w;
    const rh = natural.h;
    if (!rw || !rh) return { w: 120, h: 34 };
    const scale = Math.min(LOGO_MAX_W / rw, LOGO_MAX_H / rh, 1);
    return { w: rw * scale, h: rh * scale };
  })();

  const drawLogoRight = () => {
    if (!withLogo || !logoDataUrl || !logoDraw) return;
    const x = pageW - margin - logoDraw.w;
    const y = 18;
    try {
      doc.addImage(logoDataUrl, logoFormat, x, y, logoDraw.w, logoDraw.h);
    } catch {
      // ignore
    }
  };

  const drawTopHeaderFirstPage = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14); // less heavy but still bold
    doc.setTextColor(0);
    doc.text("Estimate", margin, 46);

    drawLogoRight();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("ADDRESS", margin, 66);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(client || "—", margin, 84);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const addrLines = doc.splitTextToSize(address || "—", 320);
    doc.text(addrLines, margin, 102);

    const yAfterAddr = 102 + addrLines.length * 11 + 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("PROJECT OWNER", margin, yAfterAddr);
    doc.setFont("helvetica", "normal");
    doc.text(projectOwner || "—", margin, yAfterAddr + 14);

    doc.setFont("helvetica", "bold");
    doc.text("Payment Terms:", margin, yAfterAddr + 32);
    doc.setFont("helvetica", "normal");
    doc.text(paymentTerm || "—", margin, yAfterAddr + 46);

    const rightX = pageW - margin;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`ESTIMATE: ${estimateNo || "—"}`, rightX, 66, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Issue Date: ${issueDate || "—"}`, rightX, 86, { align: "right" });
    doc.text(`Expire On: ${expiryDate || "—"}`, rightX, 102, {
      align: "right",
    });

    const cy = 118;
    const lineH = 14;
    doc.setFont("helvetica", "bold");
    doc.text("Created By:", rightX, cy, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(createdByName || "—", rightX, cy + lineH, { align: "right" });
    if (createdByEmail)
      doc.text(createdByEmail, rightX, cy + lineH * 2, { align: "right" });
    if (createdByMobile)
      doc.text(createdByMobile, rightX, cy + lineH * 3, { align: "right" });
  };

  const drawSubjectBar = (y: number) => {
    const text = subject || "SUBJECT HERE";
    const barH = 22;

    doc.setFillColor(...DARK_TEAL);
    doc.rect(TABLE_X, y, TABLE_W, barH, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...WHITE);
    doc.text(text.toUpperCase(), TABLE_X + TABLE_W / 2, y + barH / 2, {
      align: "center",
      baseline: "middle",
    } as any);

    doc.setTextColor(...BLACK);
  };

  // header only on page 1
  const drawHeaderForPage = (subjectBarYForFirstPage?: number) => {
    const pn = doc.getCurrentPageInfo().pageNumber;
    if (pn === 1) {
      drawTopHeaderFirstPage();
      if (typeof subjectBarYForFirstPage === "number")
        drawSubjectBar(subjectBarYForFirstPage);
    }
  };

  const applyPageNumbers = () => {
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(90);
      doc.text(`${i} of ${pages}`, pageW - margin, pageH - 14, {
        align: "right",
      });
      doc.setTextColor(0);
    }
  };

  const addTextPage = () => {
    doc.addPage();
  };

  const stackPKREURUSD = (pkr: number) => {
    const p = `PKR ${money2(pkr)}`;
    if (!addCurrencies) return p;

    const eur = convertFromPKR(pkr, euroRate);
    const usd = convertFromPKR(pkr, usdRate);

    const e =
      eur == null
        ? `${euroCurrency} —`
        : `${euroCurrency} ${symEUR}${money2(eur)}`;
    const u =
      usd == null
        ? `${usdCurrency} —`
        : `${usdCurrency} ${symUSD}${money2(usd)}`;
    return `${p}\n${e}\n${u}`;
  };

  const stack3PerUnit = (pkrPerUnit: number) => {
    const p = `PKR ${money2(pkrPerUnit)}`;
    if (!addCurrencies) return p;

    const usd = convertFromPKR(pkrPerUnit, usdRate);
    const eur = convertFromPKR(pkrPerUnit, euroRate);

    const u =
      usd == null
        ? `${usdCurrency} —`
        : `${usdCurrency} ${symUSD}${money2(usd)}`;
    const e =
      eur == null
        ? `${euroCurrency} —`
        : `${euroCurrency} ${symEUR}${money2(eur)}`;
    return `${u}\n${e}\n${p}`;
  };

  const hooks = makeTableStyleHooks();

  const subjectBarY = 175;
  const servicesStartY = 205;

  const head = [
    [
      "Services",
      "Rate",
      "Units",
      "Days / Nights",
      "Persons",
      "Total Cost",
      "Tax",
      "WHT",
      "Amount",
      "Taxation",
    ],
  ];

  const body: any[] = [];

  for (const row of services) {
    if (isMainRow(row)) {
      const title = safeText(row.mainHeading || "") || "MAIN";
      const sec = sectionTotals[row.rowId] || {
        totalCostPKR: 0,
        taxPKR: 0,
        whtPKR: 0,
        amountPKR: 0,
      };

      body.push([
        { content: title, __mainBand: true, styles: { halign: "left" } },
        { content: "", __mainBand: true },
        { content: "", __mainBand: true },
        { content: "", __mainBand: true },
        { content: "", __mainBand: true },
        {
          content: stackPKREURUSD(sec.totalCostPKR),
          __mainBand: true,
          styles: { halign: "right" },
        },
        { content: "", __mainBand: true },
        { content: "", __mainBand: true },
        {
          content: stackPKREURUSD(sec.amountPKR),
          __mainBand: true,
          styles: { halign: "right" },
        },
        { content: "", __mainBand: true },
      ]);
      continue;
    }

    if (!isItemRow(row)) continue;

    const show = row.showFinancialsInPdf !== false;

    const sub = deriveSubHeadingText(row);
    const desc = [safeText(row.detail), sub].filter(Boolean).join("\n");

    const units = num(row.units);
    const days = num(row.daysNights);
    const persons = num(row.persons);

    const sell = calcSellBreakdownPKR(row, taxType);
    const wht = calcWhtPKR(row, taxType);
    const amountPKR = sell.lineTotal + wht;

    const mode = row.baseRateMode || "amount";
    const costCell = !show
      ? ""
      : mode === "percent"
        ? ""
        : stack3PerUnit(sell.sellRate);
    const totalCostCell = !show ? "" : stackPKREURUSD(sell.sellBase);

    const taxPct = num(row.taxPercent);
    const whtPct = num(row.whtPercent);
    const taxCell = !show ? "" : taxPct > 0 ? `${taxPct}%` : "";
    const whtCell = !show ? "" : whtPct > 0 ? `${whtPct}%` : "";

    const amountCell = !show ? "" : stackPKREURUSD(amountPKR);

    const taxationCell = [
      safeText(row.taxationName),
      safeText(row.taxationText),
    ]
      .filter(Boolean)
      .join("\n");

    body.push([
      desc || "—",
      costCell,
      units ? String(units) : "",
      days ? String(days) : "",
      persons ? String(persons) : "",
      totalCostCell,
      taxCell,
      whtCell,
      amountCell,
      taxationCell || "",
    ]);
  }

  autoTable(doc, {
    startY: servicesStartY,
    margin: { left: TABLE_X, right: EDGE_PAD, top: BODY_START_Y },
    tableWidth: TABLE_W,
    head,
    body,
    theme: "grid",
    styles: {
      fontSize: 8.2,
      cellPadding: 3,
      overflow: "linebreak",
      valign: "top",
      fillColor: WHITE,
      textColor: BLACK,
      lineColor: GRID,
      lineWidth: 0.4,
    },
    headStyles: {
      fillColor: DARK_TEAL,
      textColor: WHITE,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
    },
    columnStyles: {
      0: { cellWidth: SERVICES_COL_W[0], halign: "left" },
      1: { cellWidth: SERVICES_COL_W[1], halign: "right" },
      2: { cellWidth: SERVICES_COL_W[2], halign: "center" },
      3: { cellWidth: SERVICES_COL_W[3], halign: "center" },
      4: { cellWidth: SERVICES_COL_W[4], halign: "center" },
      5: { cellWidth: SERVICES_COL_W[5], halign: "right" },
      6: { cellWidth: SERVICES_COL_W[6], halign: "right" },
      7: { cellWidth: SERVICES_COL_W[7], halign: "right" },
      8: { cellWidth: SERVICES_COL_W[8], halign: "right" },
      9: { cellWidth: SERVICES_COL_W[9], halign: "left" },
    },
    didDrawPage: () => {
      drawHeaderForPage(subjectBarY);
    },
    ...hooks,
  });

  const afterServicesY = (doc as any).lastAutoTable?.finalY ?? servicesStartY;
  let y = afterServicesY + 12;

  const ensureSpace = (need: number) => {
    if (y + need > CONTENT_BOTTOM_Y) {
      doc.addPage();
      y = BODY_START_Y;
    }
  };

  // ===== TOTALS =====
  const pkrSubtotal = subtotalPKR;
  const pkrTax = taxPKR;
  const pkrTotal = totalPKR;

  const eurSubtotal = convertFromPKR(pkrSubtotal, euroRate);
  const eurTax = convertFromPKR(pkrTax, euroRate);
  const eurTotal = convertFromPKR(pkrTotal, euroRate);

  const usdSubtotal = convertFromPKR(pkrSubtotal, usdRate);
  const usdTax = convertFromPKR(pkrTax, usdRate);
  const usdTotal = convertFromPKR(pkrTotal, usdRate);

  const cellTotals = (
    ccy: string,
    subtotal: number | null,
    tax: number | null,
    total: number | null,
    symbol: string,
  ) => {
    const s1 = subtotal == null ? "—" : money0(subtotal);
    const s2 = tax == null ? "—" : money2(tax);
    const s3 = total == null ? "—" : money2(total);
    return `${ccy}\nSUBTOTAL     ${symbol}${s1}\nTAX               ${symbol}${s2}\nTOTAL            ${symbol}${s3}`;
  };

  ensureSpace(130);

  autoTable(doc, {
    startY: y,
    margin: { left: TABLE_X, right: EDGE_PAD, top: BODY_START_Y },
    tableWidth: TABLE_W,
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 6,
      fillColor: WHITE,
      textColor: BLACK,
      lineColor: GRID,
      lineWidth: 0.4,
      valign: "top",
    },
    head: [
      [
        {
          content: "TOTALS",
          colSpan: 3,
          styles: {
            fillColor: DARK_TEAL as any,
            textColor: WHITE as any,
            fontStyle: "bold",
            halign: "center",
            valign: "middle",
          },
        },
      ],
    ],
    body: [
      [
        {
          content: cellTotals("PKR", pkrSubtotal, pkrTax, pkrTotal, ""),
          styles: { halign: "left", fontStyle: "bold" },
        },
        {
          content: cellTotals(
            euroCurrency,
            eurSubtotal,
            eurTax,
            eurTotal,
            symEUR,
          ),
          styles: { halign: "left", fontStyle: "bold" },
        },
        {
          content: cellTotals(
            usdCurrency,
            usdSubtotal,
            usdTax,
            usdTotal,
            symUSD,
          ),
          styles: { halign: "left", fontStyle: "bold" },
        },
      ],
    ],
    columnStyles: {
      0: { cellWidth: totalsW1 },
      1: { cellWidth: totalsW2 },
      2: { cellWidth: totalsW3 },
    },
    didDrawPage: () => {
      drawHeaderForPage();
    },
  });

  y = (doc as any).lastAutoTable?.finalY ?? y;
  y += 10;

  // ===== TAX SUMMARY =====
  const makeSummaryRows = (
    summary: Record<string, SummaryAgg>,
    totalLabel: string,
  ) => {
    const keys = Object.keys(summary);
    let totalTax = 0;
    let totalNet = 0;

    const rows: any[] = [];

    for (const k of keys) {
      const [label] = k.split("|");
      const agg = summary[k];
      totalTax += agg.taxPKR;
      totalNet += agg.netPKR;

      rows.push([
        `${label} @ ${agg.ratePct}%`,
        `${agg.ratePct}%`,
        stackPKREURUSD(agg.taxPKR),
        stackPKREURUSD(agg.netPKR),
      ]);
    }

    rows.push([
      { content: totalLabel, styles: { fontStyle: "bold", halign: "center" } },
      "",
      {
        content: stackPKREURUSD(totalTax),
        styles: { fontStyle: "bold", halign: "right" },
      },
      {
        content: stackPKREURUSD(totalNet),
        styles: { fontStyle: "bold", halign: "right" },
      },
    ]);

    return { rows };
  };

  const taxKeys = Object.keys(taxSummary);
  const whtKeys = Object.keys(whtSummary);

  // ✅ Only print this footer on LAST PAGE
  const SHOULD_PRINT_LAST_PAGE_FOOTER =
    taxKeys.length > 0 || whtKeys.length > 0;

  const TAX_SUMMARY_FOOTER_LINE_1 =
    "For any queries, please feel free to call Ahsan Idrees | ahsan.idrees@iedge.co | +92 345 8508254 | Terms & Conditions enclosed.";
  const TAX_SUMMARY_FOOTER_LINE_2 =
    "C-150, Block 2, Clifton, Karachi - 75600, Pakistan | Tel: +92 213 537 1818 | Email: sales@iedge.co | URL: www.iedge.co";

  if (SHOULD_PRINT_LAST_PAGE_FOOTER) {
    ensureSpace(240);

    const summaryHead = [["TAX SUMMARY", "RATE", "TAX", "NET"]];
    const summaryBody: any[] = [];

    if (taxKeys.length > 0)
      summaryBody.push(...makeSummaryRows(taxSummary, "TOTAL (TAX)").rows);
    if (taxKeys.length > 0 && whtKeys.length > 0) {
      summaryBody.push([
        { content: "", colSpan: 4, styles: { fillColor: WHITE, lineWidth: 0 } },
      ]);
    }
    if (whtKeys.length > 0)
      summaryBody.push(...makeSummaryRows(whtSummary, "TOTAL (WHT)").rows);

    autoTable(doc, {
      startY: y,
      margin: { left: TABLE_X, right: EDGE_PAD, top: BODY_START_Y },
      tableWidth: TABLE_W,
      head: summaryHead,
      body: summaryBody,
      theme: "grid",
      styles: {
        fontSize: 8.5,
        cellPadding: 4,
        overflow: "linebreak",
        valign: "top",
        fillColor: WHITE,
        textColor: BLACK,
        lineColor: GRID,
        lineWidth: 0.4,
      },
      headStyles: {
        fillColor: DARK_TEAL as any,
        textColor: WHITE as any,
        fontStyle: "bold",
        halign: "left",
        valign: "middle",
      },
      columnStyles: {
        0: { cellWidth: SUMMARY_COL_W[0], halign: "left" },
        1: { cellWidth: SUMMARY_COL_W[1], halign: "center" },
        2: { cellWidth: SUMMARY_COL_W[2], halign: "right" },
        3: { cellWidth: SUMMARY_COL_W[3], halign: "right" },
      },
      didDrawPage: () => {
        drawHeaderForPage();
      },
    });

    y = (doc as any).lastAutoTable?.finalY ?? y;
    y += 10;
  }

  // ===== Paragraphs =====
  const addParagraph = (title: string, text: string) => {
    const t = safeText(text);
    if (!t) return;

    const maxW = pageW - margin * 2;
    const lineH = 11;

    const ensureTextSpace = (need: number) => {
      if (y + need > CONTENT_BOTTOM_Y) {
        addTextPage();
        y = BODY_START_Y;
      }
    };

    ensureTextSpace(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(title, margin, y);
    y += 12;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    const rawLines = t.split("\n");
    for (const seg of rawLines) {
      const wrapped = doc.splitTextToSize(seg, maxW);

      if (wrapped.length === 0) {
        ensureTextSpace(lineH);
        y += lineH;
        continue;
      }

      for (const w of wrapped) {
        ensureTextSpace(lineH);
        doc.text(w, margin, y);
        y += lineH;
      }
    }

    y += 10;
  };

  addParagraph(
    "Package Includes",
    safeText(estimate.packageIncludesText || ""),
  );
  addParagraph(
    "Package Excludes",
    safeText(estimate.packageExcludesText || ""),
  );
  addParagraph(
    "Terms & Conditions",
    safeText(estimate.termsConditionText || ""),
  );

  // ===== LAST PAGE FOOTER (only if tax summary exists) =====
  const drawLastPageFooter = () => {
    const maxW = pageW - margin * 2;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(90);

    const startSize = 8;
    const minSize = 6;

    doc.setFontSize(startSize);
    const s1 = fitFontSizeToSingleLine(
      doc,
      TAX_SUMMARY_FOOTER_LINE_1,
      maxW,
      startSize,
      minSize,
    );
    doc.setFontSize(startSize);
    const s2 = fitFontSizeToSingleLine(
      doc,
      TAX_SUMMARY_FOOTER_LINE_2,
      maxW,
      startSize,
      minSize,
    );
    doc.setFontSize(Math.min(s1, s2));

    const cx = pageW / 2;
    doc.text(TAX_SUMMARY_FOOTER_LINE_1, cx, FOOTER_LINE1_Y, {
      align: "center",
    });
    doc.text(TAX_SUMMARY_FOOTER_LINE_2, cx, FOOTER_LINE2_Y, {
      align: "center",
    });

    doc.setTextColor(0);
  };

  if (SHOULD_PRINT_LAST_PAGE_FOOTER) {
    // If current last page content is too low, add a fresh last page for footer
    if (y > FOOTER_BLOCK_TOP_Y - 10) {
      addTextPage();
      y = BODY_START_Y;
    }
    // Now footer is guaranteed to be on the last page and never overlaps content
    drawLastPageFooter();
  }

  applyPageNumbers();
  return doc.output("blob");
}
