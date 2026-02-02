import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Estimate } from "../types";

type Company = { name: string; logo: string };

type FooterUser = {
  displayName?: string;
  email?: string;
  mobileCountryCode?: string;
  mobileNo?: string;
  mobile?: string;
  phone?: string;
  phoneNumber?: string;
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

type BuildPdfArgs = {
  estimate: Estimate;
  companyList: Company[];
  withLogo?: boolean;
  footerUser?: FooterUser | null;
  usersMap?: Record<string, FooterUser>;
  companyName?: string;
};

const wrapTextByWords = (text: string, wordsPerLine = 5) => {
  if (!text) return [];
  const words = text.split(" ");
  const lines: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerLine) {
    lines.push(words.slice(i, i + wordsPerLine).join(" "));
  }
  return lines;
};

const formatDatePretty = (v?: string) => {
  if (!v) return "";
  const [y, m, d] = String(v)
    .split("-")
    .map((x) => parseInt(x, 10));
  if (!y || !m || !d) return v;

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const dd = String(d).padStart(2, "0");
  return `${y}, ${months[m - 1] || ""} ${dd}`.trim();
};

// ✅ "no forced decimals": 100 => "100", 28.3756 => "28.38"
const formatMoney = (n: number) => {
  const x = Number(n || 0);
  const isWhole = Math.abs(x - Math.round(x)) < 1e-9;

  return x.toLocaleString(undefined, {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  });
};

// ✅ safe number parser (handles "1,200" / "" / undefined)
const toNum = (v: any) => {
  const n = Number(
    String(v ?? "")
      .replace(/,/g, "")
      .trim(),
  );
  return Number.isFinite(n) ? n : 0;
};

const resolveUser = (
  estimate: Estimate,
  footerUser?: FooterUser | null,
  usersMap?: Record<string, FooterUser>,
) => {
  return (
    footerUser ||
    (usersMap && estimate?.createdBy
      ? usersMap[estimate.createdBy]
      : undefined) ||
    undefined
  );
};

const resolvePhone = (u?: FooterUser) => {
  const phoneRaw =
    u?.mobile ||
    (u?.mobileCountryCode || u?.mobileNo
      ? `${u?.mobileCountryCode || ""}${u?.mobileNo || ""}`.trim()
      : "") ||
    u?.mobileNo ||
    u?.phone ||
    u?.phoneNumber ||
    "—";

  return String(phoneRaw || "—").trim() || "—";
};

const resolveFooterContact = (
  estimate: Estimate,
  footerUser?: FooterUser | null,
  usersMap?: Record<string, FooterUser>,
) => {
  return `For any queries, please feel free to call Ahsan Idrees | ahsan.idrees@iedge.co | +92 345 8508254 | Terms & Conditions enclosed.`;
};

const addTermsAndConditionsPages = (
  pdf: jsPDF,
  args: { title?: string; text?: string },
) => {
  const t = String(args.title || "").trim();
  const txt = String(args.text || "")
    .replace(/\r\n/g, "\n")
    .trim();
  if (!t && !txt) return;

  const marginX = 40;
  const topY = 60;
  const bottomMargin = 60;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const usableWidth = pageWidth - marginX * 2;

  pdf.addPage();

  let y = topY;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("Terms & Conditions", marginX, y);
  y += 18;

  if (t) {
    pdf.setFontSize(11);
    pdf.text(t, marginX, y);
    y += 16;
  }

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);

  const paragraphs = txt.split("\n");
  const lineHeight = 14;

  for (let p = 0; p < paragraphs.length; p++) {
    const rawLine = paragraphs[p];

    if (rawLine.trim() === "") {
      y += lineHeight;
      if (y > pageHeight - bottomMargin) {
        pdf.addPage();
        y = topY;
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text("Terms & Conditions (cont.)", marginX, y);
        y += 18;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
      }
      continue;
    }

    const wrapped = pdf.splitTextToSize(rawLine, usableWidth);
    for (let i = 0; i < wrapped.length; i++) {
      if (y > pageHeight - bottomMargin) {
        pdf.addPage();
        y = topY;
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text("Terms & Conditions (cont.)", marginX, y);
        y += 18;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
      }
      pdf.text(wrapped[i], marginX, y);
      y += lineHeight;
    }
  }
};

const addPageNumbers = (pdf: jsPDF) => {
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(100);

    pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 20, {
      align: "center",
    });
  }
};

// ✅ helper for multi-currency lines (PKR/EURO/USD) based on PKR value
// ✅ helper for multi-currency lines (PKR/EURO/USD) based on PKR value
const buildMultiCurrencyLines = (
  pkrValue: number,
  usdRate: number,
  euroRate: number,
) => {
  const lines: string[] = [];

  lines.push(`PKR ${formatMoney(pkrValue)}`);

  // EURO heading stays EURO elsewhere, but value line shows €
  lines.push(`€ ${euroRate > 0 ? formatMoney(pkrValue / euroRate) : "—"}`);

  // USD heading stays USD elsewhere, but value line shows $
  lines.push(`$ ${usdRate > 0 ? formatMoney(pkrValue / usdRate) : "—"}`);

  return lines.join("\n");
};

export async function buildEstimatePdfBlob(args: BuildPdfArgs): Promise<Blob> {
  const { estimate, companyList } = args;

  const pdf = new jsPDF({
    orientation: "p",
    unit: "pt",
    format: "a4",
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;

  const companyName = args.companyName ?? (estimate.company || "");
  const selectedCompany = companyList.find((c) => c.name === companyName);
  const withLogo = args.withLogo ?? (estimate as any)?.withLogo ?? true;
  const logoSrc = withLogo && selectedCompany ? selectedCompany.logo : null;

  // ✅ Add logo
  if (logoSrc) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = logoSrc;

    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });

    if (img.width && img.height) {
      const logoWidth = 120;
      const aspectRatio = img.height / img.width;
      const logoHeight = logoWidth * aspectRatio;

      const isJpg = /\.jpe?g$/i.test(logoSrc);
      const format: "PNG" | "JPEG" = isJpg ? "JPEG" : "PNG";

      try {
        pdf.addImage(
          img,
          format,
          pageWidth - 180,
          30,
          logoWidth,
          logoHeight,
          undefined,
          "FAST",
        );
      } catch {
        // ignore
      }
    }
  }

  const drawPage1 = () => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(16);
    pdf.text("Estimate", margin, 80);

    let y = 100;
    pdf.setFontSize(9);
    pdf.text("ADDRESS", margin, y);
    y += 12;

    pdf.setFont("helvetica", "bold");
    pdf.text(estimate.client || "", margin, y);
    y += 12;
    pdf.text((estimate as any).info || estimate.info || "", margin, y);

    pdf.setFont("helvetica", "normal");
    y += 12;

    const wrappedAddress = wrapTextByWords(
      (estimate as any).address || estimate.address || "",
      5,
    );
    wrappedAddress.forEach((line) => {
      pdf.text(line, margin, y);
      y += 12;
    });

    const rightX = pageWidth - 180;

    pdf.setFont("helvetica", "bold");
    pdf.text(`ESTIMATE: ${estimate.estimateNo}`, rightX, 100);

    pdf.setFont("helvetica", "normal");
    pdf.text(`Issue Date: ${formatDatePretty(estimate.date)}`, rightX, 130);
    pdf.text(
      `Expire On: ${formatDatePretty(estimate.expiryDate)}`,
      rightX,
      145,
    );

    // Created by
    const u = resolveUser(estimate, args.footerUser, args.usersMap);
    const createdName = u?.displayName || "—";
    const createdEmail = u?.email || "—";
    const createdPhone = resolvePhone(u);

    pdf.setFont("helvetica", "bold");
    pdf.text("Created By:", rightX, 165);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${createdName}`, rightX, 178);
    pdf.text(`${createdEmail}`, rightX, 191);
    pdf.text(`${createdPhone}`, rightX, 204);

    // Approval received on email (optional)
    const approvalReceivedOn = String(
      (estimate as any)?.approvalReceivedOn || "",
    ).trim();
    if (approvalReceivedOn) {
      pdf.setFont("helvetica", "bold");
      pdf.text("Approval received on email:", rightX, 220);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        formatDatePretty(approvalReceivedOn) || approvalReceivedOn,
        rightX,
        233,
      );
    }

    pdf.setFont("helvetica", "bold");
    pdf.text("PROJECT OWNER", margin, 175);
    pdf.setFont("helvetica", "normal");
    pdf.text(estimate.projectOwner || "", margin, 185);

    if (estimate.paymentTerm) {
      let paymentY = 185 + 24;
      pdf.setFont("helvetica", "bold");
      pdf.text("Payment Terms:", margin, paymentY);
      paymentY += 12;
      pdf.setFont("helvetica", "normal");

      const wrappedTerms = wrapTextByWords(estimate.paymentTerm, 8);
      wrappedTerms.forEach((line) => {
        pdf.text(line, margin, paymentY);
        paymentY += 12;
      });
    }

    const FOOTER_GAP = 110;
    const footerSafeY = pageHeight - FOOTER_GAP;

    // ✅ currency option
    const addCurrencies = Boolean((estimate as any)?.addCurrencies);
    const usdRate = toNum((estimate as any)?.usdRate);
    const euroRate = toNum((estimate as any)?.euroRate);

    const serviceRows = ((estimate.services || []) as any[]).map(
      (s: ServiceItem) => {
        const units = Number((s as any).units || 0);

        const rateMode = (s as any).rateMode as
          | "amount"
          | "percent"
          | undefined;
        const rateNum = toNum((s as any).rate);

        const amount =
          rateMode === "percent" ? units * (rateNum / 100) : units * rateNum;

        const rateDisplay =
          rateMode === "percent"
            ? rateNum === 0
              ? ""
              : `${formatMoney(rateNum)}%`
            : rateNum === 0
              ? ""
              : formatMoney(rateNum);

        const taxText =
          Number((s as any).taxPercent ?? 0) > 0 && estimate.taxType !== "none"
            ? `${(s as any).taxLabel ?? "Tax"} ${Number((s as any).taxPercent ?? 0)}%`
            : "No Tax";

        // ✅ AMOUNT cell: PKR only OR PKR+EURO+USD multiline
        const amountCell = addCurrencies
          ? buildMultiCurrencyLines(amount, usdRate, euroRate)
          : amount === 0
            ? ""
            : formatMoney(amount);

        return [
          `${(s as any).detail}\n${(s as any).description || ""}`,
          units === 0 ? "" : units.toLocaleString(),
          rateDisplay,
          taxText,
          amountCell,
        ];
      },
    );

    // ✅ FIX #1: AMOUNT heading always appears (no blank head cell)
    autoTable(pdf, {
      startY: 235,
      head: [["SERVICE DETAILS", "UNITS", "RATE", "TAX", "AMOUNT"]],
      body: serviceRows,
      styles: {
        fontSize: 9,
        cellPadding: 4,
        valign: "top",
        overflow: "linebreak",
      },
      headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0] },

      // ✅ keep table inside page margins + footer gap
      margin: { left: margin, right: margin, bottom: FOOTER_GAP },

      // ✅ tighter widths so AMOUNT is fully visible
      columnStyles: addCurrencies
        ? ({
            0: { halign: "left" as const, cellWidth: 240 }, // service details
            1: { halign: "center" as const, cellWidth: 45 }, // units
            2: { halign: "center" as const, cellWidth: 55 }, // rate
            3: { halign: "left" as const, cellWidth: 80 }, // tax
            4: { halign: "right" as const, cellWidth: 95 }, // amount (3-line)
          } as any)
        : ({
            0: { halign: "left" as const, cellWidth: 250 },
            1: { halign: "center" as const, cellWidth: 55 },
            2: { halign: "center" as const, cellWidth: 70 },
            3: { halign: "left" as const, cellWidth: 90 },
            4: { halign: "right" as const, cellWidth: 50 }, // single amount, still readable
          } as any),

      // ✅ force AMOUNT header left too
      didParseCell: (data: any) => {
        if (data.section === "head" && data.column?.index === 4) {
          data.cell.styles.halign = "left";
        }
      },
    });

    let finalY = (pdf as any).lastAutoTable.finalY + 55;

    const totalsBlockHeight = addCurrencies ? 120 : 110;
    if (finalY + totalsBlockHeight > footerSafeY) {
      pdf.addPage();
      finalY = 80;
    }

    // ==========================
    // ✅ TOTALS
    // ==========================
    const whtTotal = Number((estimate as any)?.whtTotal ?? 0);
    const displayTaxPKR =
      toNum(
        (estimate as any)?.tax ?? (estimate as any)?.taxTotal ?? estimate.tax,
      ) + whtTotal;

    const subtotalPKR = toNum(estimate.subtotal ?? 0);
    const totalPKR = toNum(estimate.total ?? 0);

    // ✅ FIX #3: show PKR + EURO + USD totals blocks when addCurrencies
    const drawTotalsBlock = (
      x: number,
      currency: "PKR" | "EURO" | "USD",
      sub: number,
      tax: number,
      tot: number,
      blockW: number,
    ) => {
      const labelX = x;
      const valueX = x + (blockW - 10);

      // ✅ background "card"
      const pad = 8;
      const boxX = labelX - pad;
      const boxY = finalY - 26;
      const boxH = 72;

      pdf.setFillColor(245, 245, 245);
      pdf.rect(boxX, boxY, blockW + pad * 2, boxH, "F");
      pdf.setDrawColor(220);
      pdf.rect(boxX, boxY, blockW + pad * 2, boxH);

      pdf.setTextColor(0);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(currency, labelX, finalY - 12);

      pdf.text("SUBTOTAL", labelX, finalY);
      pdf.text("TAX", labelX, finalY + 15);
      pdf.setFont("helvetica", "bold");
      pdf.text("TOTAL", labelX, finalY + 32);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(sub >= 0 ? formatMoney(sub) : "—", valueX, finalY, {
        align: "right",
      });
      pdf.text(tax >= 0 ? formatMoney(tax) : "—", valueX, finalY + 15, {
        align: "right",
      });

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text(
        tot >= 0 ? `${currency} ${formatMoney(tot)}` : `${currency} —`,
        valueX,
        finalY + 32,
        { align: "right" },
      );

      pdf.setFontSize(10);
    };

    if (!addCurrencies) {
      // original single (PKR) block on right
      const blockW = 170;
      const x = pageWidth - margin - blockW;
      drawTotalsBlock(x, "PKR", subtotalPKR, displayTaxPKR, totalPKR, blockW);
    } else {
      // PKR (left) | EURO (middle) | USD (right)
      const blockW = 160;
      const gap = 10;

      // total width of 3 blocks + 2 gaps
      const totalW = blockW * 3 + gap * 2;

      // align the whole group to the right, inside margin
      const startX = pageWidth - margin - totalW;

      const euroSub = euroRate > 0 ? subtotalPKR / euroRate : -1;
      const euroTax = euroRate > 0 ? displayTaxPKR / euroRate : -1;
      const euroTot = euroRate > 0 ? totalPKR / euroRate : -1;

      const usdSub = usdRate > 0 ? subtotalPKR / usdRate : -1;
      const usdTax = usdRate > 0 ? displayTaxPKR / usdRate : -1;
      const usdTot = usdRate > 0 ? totalPKR / usdRate : -1;

      drawTotalsBlock(
        startX + (blockW + gap) * 0,
        "PKR",
        subtotalPKR,
        displayTaxPKR,
        totalPKR,
        blockW,
      );
      drawTotalsBlock(
        startX + (blockW + gap) * 1,
        "EURO",
        euroSub,
        euroTax,
        euroTot,
        blockW,
      );
      drawTotalsBlock(
        startX + (blockW + gap) * 2,
        "USD",
        usdSub,
        usdTax,
        usdTot,
        blockW,
      );
    }

    // ==========================
    // ✅ SUMMARY CALCS
    // ==========================
    const calcBase = (s: any) => {
      const units = Number(s.units || 0);
      const rateMode = (s as any).rateMode as "amount" | "percent" | undefined;
      const rateNum = toNum(s.rate);
      return rateMode === "percent" ? units * (rateNum / 100) : units * rateNum;
    };

    const taxType = String((estimate as any)?.taxType || "").trim();

    const calcLineTotal = (s: any) => {
      const base = calcBase(s);
      const pct = Number(s.taxPercent ?? 0);

      if (!pct || taxType === "none") return base;
      if (taxType === "inclusive") return base;
      return base + (base * pct) / 100;
    };

    const services = (estimate.services || []) as any[];

    // ==========================
    // ✅ TAX SUMMARY (rows)
    // ==========================
    const map = new Map<
      string,
      { label: string; pct: number; tax: number; net: number }
    >();

    for (const s of services) {
      const pct = Number(s.taxPercent ?? 0);
      const label = String(s.taxLabel || "").trim();
      if (!pct || taxType === "none") continue;

      const base = calcBase(s);

      let taxAmount = 0;
      let netAmount = 0;

      if (taxType === "exclusive") {
        taxAmount = (base * pct) / 100;
        netAmount = base;
      } else {
        taxAmount = (base * pct) / (100 + pct);
        netAmount = base - taxAmount;
      }

      const key = `${label}__${pct}`;
      const prev = map.get(key);
      if (prev) {
        prev.tax += taxAmount;
        prev.net += netAmount;
      } else {
        map.set(key, {
          label: label || "Tax",
          pct,
          tax: taxAmount,
          net: netAmount,
        });
      }
    }

    const totalTax = Array.from(map.values()).reduce((a, b) => a + b.tax, 0);
    const totalNet = Array.from(map.values()).reduce((a, b) => a + b.net, 0);

    // ==========================
    // ✅ WHT SUMMARY
    // ==========================
    const whtMap = new Map<
      string,
      { label: string; pct: number; wht: number; base: number }
    >();

    for (const s of services) {
      const pct = Number(s.whtPercent ?? 0);
      if (!pct) continue;

      const label = String(s.whtLabel || "").trim() || "WHT";
      const baseForWht = calcLineTotal(s);
      const whtAmount = (baseForWht * pct) / 100;

      const key = `${label}__${pct}`;
      const prev = whtMap.get(key);
      if (prev) {
        prev.wht += whtAmount;
        prev.base += baseForWht;
      } else {
        whtMap.set(key, { label, pct, wht: whtAmount, base: baseForWht });
      }
    }

    const totalWht = Array.from(whtMap.values()).reduce((a, b) => a + b.wht, 0);
    const totalWhtBase = Array.from(whtMap.values()).reduce(
      (a, b) => a + b.base,
      0,
    );

    // ==========================
    // ✅ TAX SUMMARY TABLE
    // FIX #4: show PKR + EURO + USD when addCurrencies
    // ==========================
    let afterTotalsY = finalY + 55;

    const addCur = Boolean((estimate as any)?.addCurrencies);
    const usdR = toNum((estimate as any)?.usdRate);
    const eurR = toNum((estimate as any)?.euroRate);

    const taxRows: any[] = Array.from(map.values()).map((r) => {
      const taxCell = addCur
        ? buildMultiCurrencyLines(r.tax, usdR, eurR)
        : formatMoney(r.tax);
      const netCell = addCur
        ? buildMultiCurrencyLines(r.net, usdR, eurR)
        : formatMoney(r.net);

      return [`${r.label} @ ${r.pct}%`, `${r.pct}%`, taxCell, netCell];
    });

    const whtRows: any[] = Array.from(whtMap.values()).map((r) => {
      const taxCell = addCur
        ? buildMultiCurrencyLines(r.wht, usdR, eurR)
        : formatMoney(r.wht);
      const netCell = addCur
        ? buildMultiCurrencyLines(r.base, usdR, eurR)
        : formatMoney(r.base);
      return [`${r.label} @ ${r.pct}%`, `${r.pct}%`, taxCell, netCell];
    });

    if (taxRows.length > 0 || whtRows.length > 0) {
      const combinedRows: any[] = [];

      if (taxRows.length > 0) {
        combinedRows.push(...taxRows);
        combinedRows.push([
          "",
          "TOTAL (TAX)",
          addCur
            ? buildMultiCurrencyLines(totalTax, usdR, eurR)
            : formatMoney(totalTax),
          addCur
            ? buildMultiCurrencyLines(totalNet, usdR, eurR)
            : formatMoney(totalNet),
        ]);
      }

      if (whtRows.length > 0) {
        combinedRows.push(...whtRows);
        combinedRows.push([
          "",
          "TOTAL (WHT)",
          addCur
            ? buildMultiCurrencyLines(totalWht, usdR, eurR)
            : formatMoney(totalWht),
          addCur
            ? buildMultiCurrencyLines(totalWhtBase, usdR, eurR)
            : formatMoney(totalWhtBase),
        ]);
      }

      autoTable(pdf, {
        startY: afterTotalsY,
        head: [["TAX SUMMARY", "RATE", "TAX", "NET"]],
        body: combinedRows,
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
        columnStyles: {
          0: { halign: "left" as const },
          1: { halign: "center" as const },
          2: { halign: "right" as const },
          3: { halign: "right" as const },
        } as any,
        margin: { bottom: FOOTER_GAP },
      });

      //
      afterTotalsY = (pdf as any).lastAutoTable.finalY + 30;
    }

    // Message
    if (estimate.message) {
      let noteY = Math.max(
        afterTotalsY,
        (pdf as any).lastAutoTable?.finalY + 30 || afterTotalsY,
      );

      const footerSafeY2 = pageHeight - 120;
      if (noteY > footerSafeY2) {
        pdf.addPage();
        noteY = 80;
      }

      pdf.setFont("helvetica", "bold");
      pdf.text("MESSAGE:", margin, noteY);
      noteY += 12;
      pdf.setFont("helvetica", "normal");

      const wrappedMsg = wrapTextByWords(estimate.message, 10);
      wrappedMsg.forEach((line) => {
        if (noteY > footerSafeY2) {
          pdf.addPage();
          noteY = 80;
          pdf.setFont("helvetica", "bold");
          pdf.text("MESSAGE (cont.):", margin, noteY);
          noteY += 12;
          pdf.setFont("helvetica", "normal");
        }
        pdf.text(line, margin, noteY);
        noteY += 12;
      });
    }

    // footer
    const footerY = pdf.internal.pageSize.getHeight() - 70;
    pdf.setFontSize(8);
    pdf.setTextColor(100);

    pdf.text(
      resolveFooterContact(estimate, args.footerUser, args.usersMap),
      margin,
      footerY - 15,
      {
        maxWidth: pageWidth - margin * 2,
      },
    );

    pdf.text(
      "C-150, Block 2, Clifton, Karachi - 75600, Pakistan | Tel: +92 213 537 1818 | Email: sales@iedge.co | URL: www.iedge.co",
      margin,
      footerY + 15,
      { maxWidth: pageWidth - margin * 2 },
    );
  };

  // page 1
  drawPage1();

  // T&C pages
  addTermsAndConditionsPages(pdf, {
    title: (estimate as any).termsConditionTitle || "",
    text:
      (estimate as any).termsConditionText ||
      (estimate as any).termsCondition ||
      "",
  });

  // page numbers
  addPageNumbers(pdf);

  return pdf.output("blob");
}
