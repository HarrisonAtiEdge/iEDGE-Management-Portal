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
  rateMode?: "amount" | "percent"; // ✅ optional (from your EstimateForm)
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
  // Your fixed footer:
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

export async function buildEstimatePdfBlob(args: BuildPdfArgs): Promise<Blob> {
  const { estimate, companyList } = args;

  // ✅ compress = true helps a lot
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

  // ✅ Add logo WITHOUT resampling or JPEG conversion (keeps sharp)
  if (logoSrc) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = logoSrc;

    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });

    if (img.width && img.height) {
      const logoWidth = 120; // visual size in PDF (adjust if needed)
      const aspectRatio = img.height / img.width;
      const logoHeight = logoWidth * aspectRatio;

      // Preserve original format (PNG stays PNG, JPG stays JPG)
      const isJpg = /\.jpe?g$/i.test(logoSrc);
      const format: "PNG" | "JPEG" = isJpg ? "JPEG" : "PNG";

      try {
        // ✅ FAST = small PDF, sharp image
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
        // ignore image errors safely
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

    const FOOTER_GAP = 110; // space reserved for footer + breathing room
    const footerSafeY = pageHeight - FOOTER_GAP;

    const serviceRows = ((estimate.services || []) as any[]).map(
      (s: ServiceItem) => {
        const units = Number(s.units || 0);

        // ✅ support percent rateMode from your form
        const rateMode = (s as any).rateMode as
          | "amount"
          | "percent"
          | undefined;
        const rateNum = Number(String(s.rate ?? 0).replace(/,/g, "")) || 0;

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

        return [
          `${s.detail}\n${s.description || ""}`,
          units === 0 ? "" : units.toLocaleString(),
          rateDisplay,
          Number(s.taxPercent ?? 0) > 0 && estimate.taxType !== "none"
            ? `${s.taxLabel ?? "Tax"} ${Number(s.taxPercent ?? 0)}%`
            : "No Tax",
          amount === 0 ? "" : formatMoney(amount),
        ];
      },
    );

    autoTable(pdf, {
      startY: 235,
      head: [["SERVICE DETAILS", "UNITS", "RATE", "TAX", "AMOUNT"]],
      body: serviceRows,
      styles: { fontSize: 9, cellPadding: 4, valign: "top" },
      headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0] },
      // ✅ IMPORTANT: keep table from going into footer
      margin: { bottom: FOOTER_GAP },
    });

    let finalY = (pdf as any).lastAutoTable.finalY + 55;

    const totalsBlockHeight = 110;
    if (finalY + totalsBlockHeight > footerSafeY) {
      pdf.addPage();
      finalY = 80; // ✅ restart nicely on new page
    }

    // ==========================
    // ✅ TOTALS (WHT INCLUDED IN TAX LINE)
    // ==========================
    const whtTotal = Number((estimate as any)?.whtTotal ?? 0);
    const displayTax = Number(estimate.tax ?? 0) + whtTotal;

    // ✅ labels left aligned
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("SUBTOTAL", pageWidth - 200, finalY, { align: "left" });
    pdf.text("TAX", pageWidth - 200, finalY + 15, { align: "left" });
    pdf.text("TOTAL", pageWidth - 200, finalY + 32, { align: "left" });

    // ✅ amounts right aligned
    const totalsRightX = pageWidth - 40;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(formatMoney(estimate.subtotal ?? 0), totalsRightX, finalY, {
      align: "right",
    });

    // ✅ TAX line now includes WHT too (so SUBTOTAL + TAX = TOTAL)
    pdf.text(formatMoney(displayTax), totalsRightX, finalY + 15, {
      align: "right",
    });

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text(
      `PKR ${formatMoney(estimate.total ?? 0)}`,
      totalsRightX,
      finalY + 32,
      { align: "right" },
    );
    pdf.setFontSize(10);

    // ==========================
    // ✅ SUMMARY CALCS (unchanged logic)
    // ==========================
    const calcBase = (s: any) => {
      const units = Number(s.units || 0);
      const rateMode = (s as any).rateMode as "amount" | "percent" | undefined;
      const rateNum = Number(String(s.rate ?? 0).replace(/,/g, "")) || 0;
      return rateMode === "percent" ? units * (rateNum / 100) : units * rateNum;
    };

    const taxType = String((estimate as any)?.taxType || "").trim();

    const calcLineTotal = (s: any) => {
      const base = calcBase(s);
      const pct = Number(s.taxPercent ?? 0);

      if (!pct || taxType === "none") return base;

      // ✅ inclusive: base already includes tax (lineTotal stays base)
      if (taxType === "inclusive") return base;

      // ✅ exclusive: add tax on top
      return base + (base * pct) / 100;
    };

    const calcWhtAmount = (s: any) => {
      const pct = Number(s.whtPercent ?? 0);
      if (!pct) return 0;

      // ✅ WHT is ALWAYS exclusive & applied on line total (base + tax if exclusive)
      return (calcLineTotal(s) * pct) / 100;
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

      const units = Number(s.units || 0);

      const rateMode = (s as any).rateMode as "amount" | "percent" | undefined;
      const rateNum = Number(String(s.rate ?? 0).replace(/,/g, "")) || 0;

      const base =
        rateMode === "percent" ? units * (rateNum / 100) : units * rateNum;

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

    const taxRows = Array.from(map.values()).map((r) => [
      `${r.label} @ ${r.pct}%`,
      `${r.pct}%`,
      formatMoney(r.tax),
      formatMoney(r.net),
    ]);

    const totalTax = Array.from(map.values()).reduce((a, b) => a + b.tax, 0);
    const totalNet = Array.from(map.values()).reduce((a, b) => a + b.net, 0);

    // ==========================
    // ✅ WHT SUMMARY (rows) — NO EXTRA HEADING ROW
    // ==========================
    const whtMap = new Map<
      string,
      { label: string; pct: number; wht: number; base: number }
    >();

    for (const s of services) {
      const pct = Number(s.whtPercent ?? 0);
      if (!pct) continue;

      const label = String(s.whtLabel || "").trim() || "WHT";
      const baseForWht = calcLineTotal(s); // base + tax(if exclusive) OR base (inclusive/none)
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

    const whtRows = Array.from(whtMap.values()).map((r) => [
      `${r.label} @ ${r.pct}%`,
      `${r.pct}%`,
      formatMoney(r.wht),
      formatMoney(r.base),
    ]);

    const totalWht = Array.from(whtMap.values()).reduce((a, b) => a + b.wht, 0);
    const totalWhtBase = Array.from(whtMap.values()).reduce(
      (a, b) => a + b.base,
      0,
    );

    // ==========================
    // ✅ ONE TABLE: TAX SUMMARY heading stays, WHT rows look like tax rows
    // ==========================
    let afterTotalsY = finalY + 45;

    if (taxRows.length > 0 || whtRows.length > 0) {
      const combinedRows: any[] = [];

      if (taxRows.length > 0) {
        combinedRows.push(...taxRows);
        combinedRows.push([
          "",
          "TOTAL (TAX)",
          formatMoney(totalTax),
          formatMoney(totalNet),
        ]);
      }

      if (whtRows.length > 0) {
        // ✅ NO EXTRA HEADING ROW — just rows like other taxes
        combinedRows.push(...whtRows);
        combinedRows.push([
          "",
          "TOTAL (WHT)",
          formatMoney(totalWht),
          formatMoney(totalWhtBase),
        ]);
      }

      autoTable(pdf, {
        startY: afterTotalsY,
        head: [["TAX SUMMARY", "RATE", "TAX", "NET"]],
        body: combinedRows,
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
        columnStyles: {
          0: { halign: "left" },
          1: { halign: "center" },
          2: { halign: "right" },
          3: { halign: "right" },
        },
        margin: { bottom: FOOTER_GAP },
      });

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
