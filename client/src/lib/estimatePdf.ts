// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
// import type { Estimate } from "../types";

// type Company = { name: string; logo: string };

// type FooterUser = {
//   displayName?: string;
//   email?: string;
//   mobileCountryCode?: string;
//   mobileNo?: string;
//   mobile?: string;
//   phone?: string;
//   phoneNumber?: string;
// };

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
//   showFinancialsInPdf?: boolean;
// };

// type BuildPdfArgs = {
//   estimate: Estimate;
//   companyList: Company[];
//   withLogo?: boolean;
//   footerUser?: FooterUser | null;
//   usersMap?: Record<string, FooterUser>;
//   companyName?: string;
// };

// const POPULAR_CURRENCIES = [
//   { code: "USD", name: "US Dollar", symbol: "US$" },
//   { code: "EUR", name: "Euro", symbol: "€" },
//   { code: "GBP", name: "British Pound", symbol: "£" },
//   { code: "SAR", name: "Saudi Riyal", symbol: "SAR" },
//   { code: "AED", name: "UAE Dirham", symbol: "AED" },
//   { code: "CNY", name: "Chinese Yuan", symbol: "CN¥" },
//   { code: "JPY", name: "Japanese Yen", symbol: "JP¥" },
//   { code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
//   { code: "AUD", name: "Australian Dollar", symbol: "A$" },
//   { code: "TRY", name: "Turkish Lira", symbol: "₺" },
//   { code: "LKR", name: "Sri Lankan Rupee", symbol: "රු" },
//   { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
//   { code: "AZN", name: "Azerbaijani Manat", symbol: "₼" },
// ] as const;

// const currencyMeta = (code: string) => {
//   const found = (POPULAR_CURRENCIES as readonly any[]).find(
//     (c) => c.code === code,
//   );
//   return (
//     found ?? {
//       code,
//       name: code,
//       symbol: String(code || "—"),
//     }
//   );
// };

// const wrapTextByWords = (text: string, wordsPerLine = 5) => {
//   if (!text) return [];
//   const words = text.split(" ");
//   const lines: string[] = [];
//   for (let i = 0; i < words.length; i += wordsPerLine) {
//     lines.push(words.slice(i, i + wordsPerLine).join(" "));
//   }
//   return lines;
// };

// const formatDatePretty = (v?: string) => {
//   if (!v) return "";
//   const [y, m, d] = String(v)
//     .split("-")
//     .map((x) => parseInt(x, 10));
//   if (!y || !m || !d) return v;

//   const months = [
//     "Jan",
//     "Feb",
//     "Mar",
//     "Apr",
//     "May",
//     "Jun",
//     "Jul",
//     "Aug",
//     "Sep",
//     "Oct",
//     "Nov",
//     "Dec",
//   ];
//   const dd = String(d).padStart(2, "0");
//   return `${y}, ${months[m - 1] || ""} ${dd}`.trim();
// };

// const formatMoney = (n: number) => {
//   const x = Number(n || 0);
//   const isWhole = Math.abs(x - Math.round(x)) < 1e-9;

//   return x.toLocaleString(undefined, {
//     minimumFractionDigits: isWhole ? 0 : 2,
//     maximumFractionDigits: 2,
//   });
// };

// const toNum = (v: any) => {
//   const n = Number(
//     String(v ?? "")
//       .replace(/,/g, "")
//       .trim(),
//   );
//   return Number.isFinite(n) ? n : 0;
// };

// const resolveUser = (
//   estimate: Estimate,
//   footerUser?: FooterUser | null,
//   usersMap?: Record<string, FooterUser>,
// ) => {
//   return (
//     footerUser ||
//     (usersMap && estimate?.createdBy
//       ? usersMap[estimate.createdBy]
//       : undefined) ||
//     undefined
//   );
// };

// const resolvePhone = (u?: FooterUser) => {
//   const phoneRaw =
//     u?.mobile ||
//     (u?.mobileCountryCode || u?.mobileNo
//       ? `${u?.mobileCountryCode || ""}${u?.mobileNo || ""}`.trim()
//       : "") ||
//     u?.mobileNo ||
//     u?.phone ||
//     u?.phoneNumber ||
//     "—";

//   return String(phoneRaw || "—").trim() || "—";
// };

// const formatWithSymbol = (symbol: string, amount: number) => {
//   const sym = String(symbol || "").trim() || "—";
//   const isAlpha = /^[A-Za-z]{2,4}$/.test(sym);
//   const sep = isAlpha ? " " : "";
//   return `${sym}${sep}${formatMoney(amount)}`;
// };

// const resolveFooterContact = (
//   estimate: Estimate,
//   footerUser?: FooterUser | null,
//   usersMap?: Record<string, FooterUser>,
// ) => {
//   const u = resolveUser(estimate, footerUser, usersMap);
//   const name = String(u?.displayName || "—").trim() || "—";
//   const email = String(u?.email || "—").trim() || "—";
//   const phone = resolvePhone(u);
//   return `For any queries, please feel free to call ${name} | ${email} | ${phone} | Terms & Conditions enclosed.`;
// };

// const addTermsAndConditionsPages = (
//   pdf: jsPDF,
//   args: { title?: string; text?: string },
// ) => {
//   const t = String(args.title || "").trim();
//   const txt = String(args.text || "")
//     .replace(/\r\n/g, "\n")
//     .trim();
//   if (!t && !txt) return;

//   const marginX = 40;
//   const topY = 60;
//   const bottomMargin = 60;
//   const pageWidth = pdf.internal.pageSize.getWidth();
//   const pageHeight = pdf.internal.pageSize.getHeight();
//   const usableWidth = pageWidth - marginX * 2;

//   pdf.addPage();

//   let y = topY;

//   pdf.setFont("helvetica", "bold");
//   pdf.setFontSize(14);
//   pdf.text("Terms & Conditions", marginX, y);
//   y += 18;

//   if (t) {
//     pdf.setFontSize(11);
//     pdf.text(t, marginX, y);
//     y += 16;
//   }

//   pdf.setFont("helvetica", "normal");
//   pdf.setFontSize(10);

//   const paragraphs = txt.split("\n");
//   const lineHeight = 14;

//   for (let p = 0; p < paragraphs.length; p++) {
//     const rawLine = paragraphs[p];

//     if (rawLine.trim() === "") {
//       y += lineHeight;
//       if (y > pageHeight - bottomMargin) {
//         pdf.addPage();
//         y = topY;
//         pdf.setFont("helvetica", "bold");
//         pdf.setFontSize(12);
//         pdf.text("Terms & Conditions (cont.)", marginX, y);
//         y += 18;
//         pdf.setFont("helvetica", "normal");
//         pdf.setFontSize(10);
//       }
//       continue;
//     }

//     const wrapped = pdf.splitTextToSize(rawLine, usableWidth);
//     for (let i = 0; i < wrapped.length; i++) {
//       if (y > pageHeight - bottomMargin) {
//         pdf.addPage();
//         y = topY;
//         pdf.setFont("helvetica", "bold");
//         pdf.setFontSize(12);
//         pdf.text("Terms & Conditions (cont.)", marginX, y);
//         y += 18;
//         pdf.setFont("helvetica", "normal");
//         pdf.setFontSize(10);
//       }
//       pdf.text(wrapped[i], marginX, y);
//       y += lineHeight;
//     }
//   }
// };

// const addPageNumbers = (pdf: jsPDF) => {
//   const pageCount = pdf.getNumberOfPages();
//   for (let i = 1; i <= pageCount; i++) {
//     pdf.setPage(i);

//     const pageWidth = pdf.internal.pageSize.getWidth();
//     const pageHeight = pdf.internal.pageSize.getHeight();

//     pdf.setFont("helvetica", "normal");
//     pdf.setFontSize(9);
//     pdf.setTextColor(100);

//     pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 20, {
//       align: "center",
//     });
//   }
// };

// const buildMultiCurrencyLines = (args: {
//   pkrValue: number;
//   c1Code: string;
//   c2Code: string;
//   c1Rate: number;
//   c2Rate: number;
// }) => {
//   const { pkrValue, c1Code, c2Code, c1Rate, c2Rate } = args;

//   const c1 = currencyMeta(c1Code);
//   const c2 = currencyMeta(c2Code);

//   const lines: string[] = [];
//   lines.push(`PKR ${formatMoney(pkrValue)}`);

//   lines.push(
//     c1Rate > 0
//       ? formatWithSymbol(c1.symbol, pkrValue / c1Rate)
//       : `${c1.symbol} —`,
//   );
//   lines.push(
//     c2Rate > 0
//       ? formatWithSymbol(c2.symbol, pkrValue / c2Rate)
//       : `${c2.symbol} —`,
//   );

//   return lines.join("\n");
// };

// export async function buildEstimatePdfBlob(args: BuildPdfArgs): Promise<Blob> {
//   const { estimate, companyList } = args;

//   const pdf = new jsPDF({
//     orientation: "p",
//     unit: "pt",
//     format: "a4",
//     compress: true,
//   });

//   const pageWidth = pdf.internal.pageSize.getWidth();
//   const pageHeight = pdf.internal.pageSize.getHeight();
//   const margin = 40;

//   const companyName = args.companyName ?? (estimate.company || "");
//   const selectedCompany = companyList.find((c) => c.name === companyName);
//   const withLogo = args.withLogo ?? (estimate as any)?.withLogo ?? true;
//   const logoSrc = withLogo && selectedCompany ? selectedCompany.logo : null;

//   if (logoSrc) {
//     const img = new Image();
//     img.crossOrigin = "anonymous";
//     img.src = logoSrc;

//     await new Promise<void>((resolve) => {
//       img.onload = () => resolve();
//       img.onerror = () => resolve();
//     });

//     if (img.width && img.height) {
//       const logoWidth = 120;
//       const aspectRatio = img.height / img.width;
//       const logoHeight = logoWidth * aspectRatio;

//       const isJpg = /\.jpe?g$/i.test(logoSrc);
//       const format: "PNG" | "JPEG" = isJpg ? "JPEG" : "PNG";

//       try {
//         pdf.addImage(
//           img,
//           format,
//           pageWidth - 180,
//           30,
//           logoWidth,
//           logoHeight,
//           undefined,
//           "FAST",
//         );
//       } catch {
//         // ignore
//       }
//     }
//   }

//   const drawPage1 = () => {
//     pdf.setFont("helvetica", "normal");
//     pdf.setFontSize(16);
//     pdf.text("Estimate", margin, 80);

//     let y = 100;
//     pdf.setFontSize(9);
//     pdf.text("ADDRESS", margin, y);
//     y += 12;

//     pdf.setFont("helvetica", "bold");
//     pdf.text(estimate.client || "", margin, y);
//     y += 12;
//     pdf.text((estimate as any).info || estimate.info || "", margin, y);

//     pdf.setFont("helvetica", "normal");
//     y += 12;

//     const wrappedAddress = wrapTextByWords(
//       (estimate as any).address || estimate.address || "",
//       5,
//     );
//     wrappedAddress.forEach((line) => {
//       pdf.text(line, margin, y);
//       y += 12;
//     });

//     const rightX = pageWidth - 180;

//     pdf.setFont("helvetica", "bold");
//     pdf.text(`ESTIMATE: ${estimate.estimateNo}`, rightX, 100);

//     pdf.setFont("helvetica", "normal");
//     pdf.text(`Issue Date: ${formatDatePretty(estimate.date)}`, rightX, 130);
//     pdf.text(
//       `Expire On: ${formatDatePretty(estimate.expiryDate)}`,
//       rightX,
//       145,
//     );

//     const u = resolveUser(estimate, args.footerUser, args.usersMap);
//     const createdName = u?.displayName || "—";
//     const createdEmail = u?.email || "—";
//     const createdPhone = resolvePhone(u);

//     const poNumber = String(
//       (estimate as any)?.poNumber ||
//         (estimate as any)?.poNo ||
//         (estimate as any)?.purchaseOrderNo ||
//         "",
//     ).trim();

//     pdf.setFont("helvetica", "bold");
//     pdf.text("Created By:", rightX, 165);
//     pdf.setFont("helvetica", "normal");
//     pdf.text(`${createdName}`, rightX, 178);
//     pdf.text(`${createdEmail}`, rightX, 191);
//     pdf.text(`${createdPhone}`, rightX, 204);

//     let rightBlockBottomY = 204;

//     if (poNumber) {
//       pdf.setFont("helvetica", "bold");
//       pdf.text("PO Number:", rightX, 220);
//       pdf.setFont("helvetica", "normal");
//       pdf.text(poNumber, rightX, 233);
//       rightBlockBottomY = 233;
//     }

//     const approvalReceivedOn = String(
//       (estimate as any)?.approvalReceivedOn || "",
//     ).trim();
//     if (approvalReceivedOn) {
//       const approvalLabelY = rightBlockBottomY + 16;
//       const approvalValueY = approvalLabelY + 13;

//       pdf.setFont("helvetica", "bold");
//       pdf.text("Approval received on email:", rightX, approvalLabelY);
//       pdf.setFont("helvetica", "normal");
//       pdf.text(
//         formatDatePretty(approvalReceivedOn) || approvalReceivedOn,
//         rightX,
//         approvalValueY,
//       );

//       rightBlockBottomY = approvalValueY;
//     }

//     pdf.setFont("helvetica", "bold");
//     pdf.text("PROJECT OWNER", margin, 175);
//     pdf.setFont("helvetica", "normal");
//     pdf.text(estimate.projectOwner || "", margin, 185);

//     if (estimate.paymentTerm) {
//       let paymentY = 185 + 24;
//       pdf.setFont("helvetica", "bold");
//       pdf.text("Payment Terms:", margin, paymentY);
//       paymentY += 12;
//       pdf.setFont("helvetica", "normal");

//       const wrappedTerms = wrapTextByWords(estimate.paymentTerm, 8);
//       wrappedTerms.forEach((line) => {
//         pdf.text(line, margin, paymentY);
//         paymentY += 12;
//       });
//     }

//     const FOOTER_GAP = 110;
//     const footerSafeY = pageHeight - FOOTER_GAP;

//     const addCurrencies = Boolean((estimate as any)?.addCurrencies);

//     const c1Code =
//       String((estimate as any)?.currency1Code || "USD").trim() || "USD";
//     const c2Code =
//       String((estimate as any)?.currency2Code || "EUR").trim() || "EUR";

//     const c1Rate = toNum((estimate as any)?.usdRate);
//     const c2Rate = toNum((estimate as any)?.euroRate);

//     const c1 = currencyMeta(c1Code);
//     const c2 = currencyMeta(c2Code);

//     const taxType = String((estimate as any)?.taxType || "").trim();

//     const COLS = 5;

//     const serviceRows: any[] = ((estimate.services || []) as any[]).map(
//       (s: ServiceItem) => {
//         const detailText = `${(s as any).detail}\n${(s as any).description || ""}`;

//         const showFinancials = (s as any).showFinancialsInPdf !== false;

//         if (!showFinancials) {
//           return [
//             {
//               content: detailText,
//               colSpan: COLS,
//               styles: { halign: "left" as const, valign: "top" as const },
//             },
//           ];
//         }

//         const units = Number((s as any).units || 0);
//         const rateMode = (s as any).rateMode as
//           | "amount"
//           | "percent"
//           | undefined;
//         const rateNum = toNum((s as any).rate);

//         const base =
//           rateMode === "percent" ? units * (rateNum / 100) : units * rateNum;

//         const pct = Number((s as any).taxPercent ?? 0);

//         let lineTotal = base;
//         if (taxType !== "none" && pct > 0) {
//           if (taxType === "exclusive") {
//             lineTotal = base + (base * pct) / 100;
//           } else {
//             lineTotal = base;
//           }
//         }

//         const whtPct = Number((s as any).whtPercent ?? 0);
//         const whtAmount = whtPct > 0 ? (lineTotal * whtPct) / 100 : 0;

//         const amount = lineTotal + whtAmount;

//         const rateDisplay =
//           rateMode === "percent"
//             ? rateNum === 0
//               ? ""
//               : `${formatMoney(rateNum)}%`
//             : rateNum === 0
//               ? ""
//               : formatMoney(rateNum);

//         const taxText =
//           pct > 0 && taxType !== "none"
//             ? `${(s as any).taxLabel ?? "Tax"} ${pct}%`
//             : "No Tax";

//         const amountCell = addCurrencies
//           ? buildMultiCurrencyLines({
//               pkrValue: amount,
//               c1Code,
//               c2Code,
//               c1Rate,
//               c2Rate,
//             })
//           : amount === 0
//             ? ""
//             : formatMoney(amount);

//         return [
//           detailText,
//           units === 0 ? "" : units.toLocaleString(),
//           rateDisplay,
//           taxText,
//           amountCell,
//         ];
//       },
//     );

//     const tableStartY = Math.max(235, rightBlockBottomY + 18);

//     autoTable(pdf, {
//       startY: tableStartY,
//       head: [["SERVICE DETAILS", "UNITS", "RATE", "TAX", "AMOUNT"]],
//       body: serviceRows,
//       styles: {
//         fontSize: 9,
//         cellPadding: 4,
//         valign: "top",
//         overflow: "linebreak",
//       },
//       headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0] },
//       margin: { left: margin, right: margin, bottom: FOOTER_GAP },
//       columnStyles: addCurrencies
//         ? ({
//             0: { halign: "left" as const, cellWidth: 200 },
//             1: { halign: "center" as const, cellWidth: 60 },
//             2: { halign: "center" as const, cellWidth: 60 },
//             3: { halign: "left" as const, cellWidth: 80 },
//             4: { halign: "right" as const, cellWidth: 115 },
//           } as any)
//         : ({
//             0: { halign: "left" as const, cellWidth: 225 },
//             1: { halign: "center" as const, cellWidth: 70 },
//             2: { halign: "center" as const, cellWidth: 70 },
//             3: { halign: "left" as const, cellWidth: 80 },
//             4: { halign: "right" as const, cellWidth: 70 },
//           } as any),
//       didParseCell: (data: any) => {
//         if (data.column?.index === 4) {
//           data.cell.styles.halign = "right";
//         }
//       },
//     });

//     let finalY = (pdf as any).lastAutoTable.finalY + 55;

//     const perPaxCostEnabled = Boolean((estimate as any)?.perPaxCost);
//     const paxCount = Math.trunc(toNum((estimate as any)?.numberOfPax));
//     const showPerPaxLine = perPaxCostEnabled && paxCount > 0;

//     const totalsBlockHeight = showPerPaxLine
//       ? addCurrencies
//         ? 145
//         : 135
//       : addCurrencies
//         ? 120
//         : 110;

//     if (finalY + totalsBlockHeight > footerSafeY) {
//       pdf.addPage();
//       finalY = 80;
//     }

//     const whtTotal = Number((estimate as any)?.whtTotal ?? 0);

//     const displayTaxPKR =
//       toNum(
//         (estimate as any)?.tax ?? (estimate as any)?.taxTotal ?? estimate.tax,
//       ) + whtTotal;

//     const subtotalPKR = toNum(estimate.subtotal ?? 0);
//     const totalPKR = toNum(estimate.total ?? 0);
//     const perPaxPKR = showPerPaxLine ? totalPKR / paxCount : 0;

//     const drawTotalsBlock = (
//       x: number,
//       meta: { code: string; symbol: string },
//       sub: number,
//       tax: number,
//       tot: number,
//       blockW: number,
//       perPax?: number,
//     ) => {
//       const labelX = x;
//       const valueX = x + (blockW - 10);

//       const pad = 8;
//       const boxX = labelX - pad;
//       const boxY = finalY - 26;
//       const boxH = showPerPaxLine ? 94 : 72;

//       pdf.setFillColor(245, 245, 245);
//       pdf.rect(boxX, boxY, blockW + pad * 2, boxH, "F");
//       pdf.setDrawColor(220);
//       pdf.rect(boxX, boxY, blockW + pad * 2, boxH);

//       pdf.setTextColor(0);

//       pdf.setFont("helvetica", "normal");
//       pdf.setFontSize(10);

//       pdf.text(meta.code, labelX, finalY - 12);

//       pdf.text("SUBTOTAL", labelX, finalY);
//       pdf.text("TAX", labelX, finalY + 15);
//       pdf.setFont("helvetica", "bold");
//       pdf.text("TOTAL", labelX, finalY + 32);

//       pdf.setFont("helvetica", "normal");
//       pdf.setFontSize(10);
//       pdf.text(sub >= 0 ? formatMoney(sub) : "—", valueX, finalY, {
//         align: "right",
//       });
//       pdf.text(tax >= 0 ? formatMoney(tax) : "—", valueX, finalY + 15, {
//         align: "right",
//       });

//       pdf.setFont("helvetica", "bold");
//       pdf.setFontSize(10);

//       const totalText =
//         tot >= 0 ? formatWithSymbol(meta.symbol, tot) : `${meta.symbol} —`;

//       pdf.text(totalText, valueX, finalY + 32, { align: "right" });

//       if (showPerPaxLine) {
//         const perPaxText =
//           typeof perPax === "number" && perPax >= 0
//             ? formatWithSymbol(meta.symbol, perPax)
//             : `${meta.symbol} —`;

//         pdf.setFont("helvetica", "normal");
//         pdf.setFontSize(7);
//         pdf.text("PER PAX COST INCL. TAXES", labelX, finalY + 50);
//         pdf.text(perPaxText, valueX, finalY + 50, { align: "right" });
//       }

//       pdf.setFontSize(10);
//     };

//     if (!addCurrencies) {
//       const blockW = 170;
//       const x = pageWidth - margin - blockW;
//       drawTotalsBlock(
//         x,
//         { code: "PKR", symbol: "PKR" },
//         subtotalPKR,
//         displayTaxPKR,
//         totalPKR,
//         blockW,
//         perPaxPKR,
//       );
//     } else {
//       const blockW = 160;
//       const gap = 10;
//       const totalW = blockW * 3 + gap * 2;
//       const startX = pageWidth - margin - totalW;

//       const c1Sub = c1Rate > 0 ? subtotalPKR / c1Rate : -1;
//       const c1Tax = c1Rate > 0 ? displayTaxPKR / c1Rate : -1;
//       const c1Tot = c1Rate > 0 ? totalPKR / c1Rate : -1;
//       const c1PerPax = c1Tot >= 0 && showPerPaxLine ? c1Tot / paxCount : -1;

//       const c2Sub = c2Rate > 0 ? subtotalPKR / c2Rate : -1;
//       const c2Tax = c2Rate > 0 ? displayTaxPKR / c2Rate : -1;
//       const c2Tot = c2Rate > 0 ? totalPKR / c2Rate : -1;
//       const c2PerPax = c2Tot >= 0 && showPerPaxLine ? c2Tot / paxCount : -1;

//       drawTotalsBlock(
//         startX + (blockW + gap) * 0,
//         { code: "PKR", symbol: "PKR" },
//         subtotalPKR,
//         displayTaxPKR,
//         totalPKR,
//         blockW,
//         perPaxPKR,
//       );

//       drawTotalsBlock(
//         startX + (blockW + gap) * 1,
//         { code: c1.code, symbol: c1.symbol },
//         c1Sub,
//         c1Tax,
//         c1Tot,
//         blockW,
//         c1PerPax,
//       );
//       drawTotalsBlock(
//         startX + (blockW + gap) * 2,
//         { code: c2.code, symbol: c2.symbol },
//         c2Sub,
//         c2Tax,
//         c2Tot,
//         blockW,
//         c2PerPax,
//       );
//     }

//     const calcBase = (s: any) => {
//       const units = Number(s.units || 0);
//       const rateMode = (s as any).rateMode as "amount" | "percent" | undefined;
//       const rateNum = toNum(s.rate);
//       return rateMode === "percent" ? units * (rateNum / 100) : units * rateNum;
//     };

//     const taxType2 = String((estimate as any)?.taxType || "").trim();

//     const calcLineTotal = (s: any) => {
//       const base = calcBase(s);
//       const pct = Number(s.taxPercent ?? 0);

//       if (!pct || taxType2 === "none") return base;
//       if (taxType2 === "inclusive") return base;
//       return base + (base * pct) / 100;
//     };

//     const services = (estimate.services || []) as any[];

//     const map = new Map<
//       string,
//       { label: string; pct: number; tax: number; net: number }
//     >();

//     for (const s of services) {
//       const pct = Number(s.taxPercent ?? 0);
//       const label = String(s.taxLabel || "").trim();
//       if (!pct || taxType2 === "none") continue;

//       const base = calcBase(s);

//       let taxAmount = 0;
//       let netAmount = 0;

//       if (taxType2 === "exclusive") {
//         taxAmount = (base * pct) / 100;
//         netAmount = base;
//       } else {
//         taxAmount = (base * pct) / (100 + pct);
//         netAmount = base - taxAmount;
//       }

//       const key = `${label}__${pct}`;
//       const prev = map.get(key);
//       if (prev) {
//         prev.tax += taxAmount;
//         prev.net += netAmount;
//       } else {
//         map.set(key, {
//           label: label || "Tax",
//           pct,
//           tax: taxAmount,
//           net: netAmount,
//         });
//       }
//     }

//     const totalTax = Array.from(map.values()).reduce((a, b) => a + b.tax, 0);
//     const totalNet = Array.from(map.values()).reduce((a, b) => a + b.net, 0);

//     const whtMap = new Map<
//       string,
//       { label: string; pct: number; wht: number; base: number }
//     >();

//     for (const s of services) {
//       const pct = Number(s.whtPercent ?? 0);
//       if (!pct) continue;

//       const label = String(s.whtLabel || "").trim() || "WHT";
//       const baseForWht = calcLineTotal(s);
//       const whtAmount = (baseForWht * pct) / 100;

//       const key = `${label}__${pct}`;
//       const prev = whtMap.get(key);
//       if (prev) {
//         prev.wht += whtAmount;
//         prev.base += baseForWht;
//       } else {
//         whtMap.set(key, { label, pct, wht: whtAmount, base: baseForWht });
//       }
//     }

//     const totalWht = Array.from(whtMap.values()).reduce((a, b) => a + b.wht, 0);
//     const totalWhtBase = Array.from(whtMap.values()).reduce(
//       (a, b) => a + b.base,
//       0,
//     );

//     let afterTotalsY = finalY + (showPerPaxLine ? 78 : 55);

//     const addCur = Boolean((estimate as any)?.addCurrencies);

//     const taxRows: any[] = Array.from(map.values()).map((r) => {
//       const taxCell = addCur
//         ? buildMultiCurrencyLines({
//             pkrValue: r.tax,
//             c1Code,
//             c2Code,
//             c1Rate,
//             c2Rate,
//           })
//         : formatMoney(r.tax);

//       const netCell = addCur
//         ? buildMultiCurrencyLines({
//             pkrValue: r.net,
//             c1Code,
//             c2Code,
//             c1Rate,
//             c2Rate,
//           })
//         : formatMoney(r.net);

//       return [`${r.label} @ ${r.pct}%`, `${r.pct}%`, taxCell, netCell];
//     });

//     const whtRows: any[] = Array.from(whtMap.values()).map((r) => {
//       const whtCell = addCur
//         ? buildMultiCurrencyLines({
//             pkrValue: r.wht,
//             c1Code,
//             c2Code,
//             c1Rate,
//             c2Rate,
//           })
//         : formatMoney(r.wht);

//       const baseCell = addCur
//         ? buildMultiCurrencyLines({
//             pkrValue: r.base,
//             c1Code,
//             c2Code,
//             c1Rate,
//             c2Rate,
//           })
//         : formatMoney(r.base);

//       return [`${r.label} @ ${r.pct}%`, `${r.pct}%`, whtCell, baseCell];
//     });

//     if (taxRows.length > 0 || whtRows.length > 0) {
//       const combinedRows: any[] = [];

//       if (taxRows.length > 0) {
//         combinedRows.push(...taxRows);
//         combinedRows.push([
//           "",
//           "TOTAL (TAX)",
//           addCur
//             ? buildMultiCurrencyLines({
//                 pkrValue: totalTax,
//                 c1Code,
//                 c2Code,
//                 c1Rate,
//                 c2Rate,
//               })
//             : formatMoney(totalTax),
//           addCur
//             ? buildMultiCurrencyLines({
//                 pkrValue: totalNet,
//                 c1Code,
//                 c2Code,
//                 c1Rate,
//                 c2Rate,
//               })
//             : formatMoney(totalNet),
//         ]);
//       }

//       if (whtRows.length > 0) {
//         combinedRows.push(...whtRows);
//         combinedRows.push([
//           "",
//           "TOTAL (WHT)",
//           addCur
//             ? buildMultiCurrencyLines({
//                 pkrValue: totalWht,
//                 c1Code,
//                 c2Code,
//                 c1Rate,
//                 c2Rate,
//               })
//             : formatMoney(totalWht),
//           addCur
//             ? buildMultiCurrencyLines({
//                 pkrValue: totalWhtBase,
//                 c1Code,
//                 c2Code,
//                 c1Rate,
//                 c2Rate,
//               })
//             : formatMoney(totalWhtBase),
//         ]);
//       }

//       const FOOTER_GAP = 110;

//       autoTable(pdf, {
//         startY: afterTotalsY,
//         head: [["TAX SUMMARY", "RATE", "TAX", "NET"]],
//         body: combinedRows,
//         styles: { fontSize: 9, cellPadding: 4 },
//         headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
//         columnStyles: {
//           0: { halign: "left" as const },
//           1: { halign: "center" as const },
//           2: { halign: "right" as const },
//           3: { halign: "right" as const },
//         } as any,
//         margin: { bottom: FOOTER_GAP },
//         didParseCell: (data: any) => {
//           if (data.section === "head") {
//             const header = String(data.cell.raw || "")
//               .trim()
//               .toUpperCase();
//             if (header === "RATE" || header === "TAX" || header === "NET") {
//               data.cell.styles.halign = "right";
//             }
//           }
//         },
//       });

//       afterTotalsY = (pdf as any).lastAutoTable.finalY + 30;
//     }

//     if (estimate.message) {
//       let noteY = Math.max(
//         afterTotalsY,
//         (pdf as any).lastAutoTable?.finalY + 30 || afterTotalsY,
//       );

//       const footerSafeY2 = pageHeight - 120;
//       if (noteY > footerSafeY2) {
//         pdf.addPage();
//         noteY = 80;
//       }

//       pdf.setFont("helvetica", "bold");
//       pdf.text("MESSAGE:", margin, noteY);
//       noteY += 12;
//       pdf.setFont("helvetica", "normal");

//       const wrappedMsg = wrapTextByWords(estimate.message, 10);
//       wrappedMsg.forEach((line) => {
//         if (noteY > footerSafeY2) {
//           pdf.addPage();
//           noteY = 80;
//           pdf.setFont("helvetica", "bold");
//           pdf.text("MESSAGE (cont.):", margin, noteY);
//           noteY += 12;
//           pdf.setFont("helvetica", "normal");
//         }
//         pdf.text(line, margin, noteY);
//         noteY += 12;
//       });
//     }

//     const footerY = pdf.internal.pageSize.getHeight() - 70;
//     pdf.setFontSize(8);
//     pdf.setTextColor(100);

//     pdf.text(
//       resolveFooterContact(estimate, args.footerUser, args.usersMap),
//       margin,
//       footerY - 15,
//       { maxWidth: pageWidth - margin * 2 },
//     );

//     pdf.text(
//       "C-150, Block 2, Clifton, Karachi - 75600, Pakistan | Tel: +92 213 537 1818 | Email: sales@iedge.co | URL: www.iedge.co",
//       margin,
//       footerY + 15,
//       { maxWidth: pageWidth - margin * 2 },
//     );
//   };

//   drawPage1();

//   addTermsAndConditionsPages(pdf, {
//     title: (estimate as any).termsConditionTitle || "",
//     text:
//       (estimate as any).termsConditionText ||
//       (estimate as any).termsCondition ||
//       "",
//   });

//   addPageNumbers(pdf);

//   return pdf.output("blob");
// }

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
  showFinancialsInPdf?: boolean;
};

type BuildPdfArgs = {
  estimate: Estimate;
  companyList: Company[];
  withLogo?: boolean;
  footerUser?: FooterUser | null;
  usersMap?: Record<string, FooterUser>;
  companyName?: string;
};

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
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "LKR", name: "Sri Lankan Rupee", symbol: "රු" },
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
      symbol: String(code || "—"),
    }
  );
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

const formatMoney = (n: number) => {
  const x = Number(n || 0);
  const isWhole = Math.abs(x - Math.round(x)) < 1e-9;

  return x.toLocaleString(undefined, {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  });
};

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
    (usersMap && estimate?.createdBy
      ? usersMap[estimate.createdBy]
      : undefined) ||
    footerUser ||
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

const formatWithSymbol = (symbol: string, amount: number) => {
  const sym = String(symbol || "").trim() || "—";
  const isAlpha = /^[A-Za-z]{2,4}$/.test(sym);
  const sep = isAlpha ? " " : "";
  return `${sym}${sep}${formatMoney(amount)}`;
};

const resolveFooterContact = (
  estimate: Estimate,
  footerUser?: FooterUser | null,
  usersMap?: Record<string, FooterUser>,
) => {
  const u = resolveUser(estimate, footerUser, usersMap);
  const name = String(u?.displayName || "—").trim() || "—";
  const email = String(u?.email || "—").trim() || "—";
  const phone = resolvePhone(u);
  return `For any queries, please feel free to call ${name} | ${email} | ${phone} | Terms & Conditions enclosed.`;
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

const buildMultiCurrencyLines = (args: {
  pkrValue: number;
  c1Code: string;
  c2Code: string;
  c1Rate: number;
  c2Rate: number;
}) => {
  const { pkrValue, c1Code, c2Code, c1Rate, c2Rate } = args;

  const c1 = currencyMeta(c1Code);
  const c2 = currencyMeta(c2Code);

  const lines: string[] = [];
  lines.push(`PKR ${formatMoney(pkrValue)}`);

  lines.push(
    c1Rate > 0
      ? formatWithSymbol(c1.symbol, pkrValue / c1Rate)
      : `${c1.symbol} —`,
  );
  lines.push(
    c2Rate > 0
      ? formatWithSymbol(c2.symbol, pkrValue / c2Rate)
      : `${c2.symbol} —`,
  );

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

    const u = resolveUser(estimate, args.footerUser, args.usersMap);
    const createdName = u?.displayName || "—";
    const createdEmail = u?.email || "—";
    const createdPhone = resolvePhone(u);

    const poNumber = String(
      (estimate as any)?.poNumber ||
        (estimate as any)?.poNo ||
        (estimate as any)?.purchaseOrderNo ||
        "",
    ).trim();

    pdf.setFont("helvetica", "bold");
    pdf.text("Created By:", rightX, 165);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${createdName}`, rightX, 178);
    pdf.text(`${createdEmail}`, rightX, 191);
    pdf.text(`${createdPhone}`, rightX, 204);

    let rightBlockBottomY = 204;

    if (poNumber) {
      pdf.setFont("helvetica", "bold");
      pdf.text("PO Number:", rightX, 220);
      pdf.setFont("helvetica", "normal");
      pdf.text(poNumber, rightX, 233);
      rightBlockBottomY = 233;
    }

    const approvalReceivedOn = String(
      (estimate as any)?.approvalReceivedOn || "",
    ).trim();
    if (approvalReceivedOn) {
      const approvalLabelY = rightBlockBottomY + 16;
      const approvalValueY = approvalLabelY + 13;

      pdf.setFont("helvetica", "bold");
      pdf.text("Approval received on email:", rightX, approvalLabelY);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        formatDatePretty(approvalReceivedOn) || approvalReceivedOn,
        rightX,
        approvalValueY,
      );

      rightBlockBottomY = approvalValueY;
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

    const addCurrencies = Boolean((estimate as any)?.addCurrencies);

    const c1Code =
      String((estimate as any)?.currency1Code || "USD").trim() || "USD";
    const c2Code =
      String((estimate as any)?.currency2Code || "EUR").trim() || "EUR";

    const c1Rate = toNum((estimate as any)?.usdRate);
    const c2Rate = toNum((estimate as any)?.euroRate);

    const c1 = currencyMeta(c1Code);
    const c2 = currencyMeta(c2Code);

    const taxType = String((estimate as any)?.taxType || "").trim();

    const COLS = 5;

    const serviceRows: any[] = ((estimate.services || []) as any[]).map(
      (s: ServiceItem) => {
        const detailText = `${(s as any).detail}\n${(s as any).description || ""}`;

        const showFinancials = (s as any).showFinancialsInPdf !== false;

        if (!showFinancials) {
          return [
            {
              content: detailText,
              colSpan: COLS,
              styles: { halign: "left" as const, valign: "top" as const },
            },
          ];
        }

        const units = Number((s as any).units || 0);
        const rateMode = (s as any).rateMode as
          | "amount"
          | "percent"
          | undefined;
        const rateNum = toNum((s as any).rate);

        const base =
          rateMode === "percent" ? units * (rateNum / 100) : units * rateNum;

        const pct = Number((s as any).taxPercent ?? 0);

        let lineTotal = base;
        if (taxType !== "none" && pct > 0) {
          if (taxType === "exclusive") {
            lineTotal = base + (base * pct) / 100;
          } else {
            lineTotal = base;
          }
        }

        const whtPct = Number((s as any).whtPercent ?? 0);
        const whtAmount = whtPct > 0 ? (lineTotal * whtPct) / 100 : 0;

        const amount = lineTotal + whtAmount;

        const rateDisplay =
          rateMode === "percent"
            ? rateNum === 0
              ? ""
              : `${formatMoney(rateNum)}%`
            : rateNum === 0
              ? ""
              : formatMoney(rateNum);

        const taxText =
          pct > 0 && taxType !== "none"
            ? `${(s as any).taxLabel ?? "Tax"} ${pct}%`
            : "No Tax";

        const amountCell = addCurrencies
          ? buildMultiCurrencyLines({
              pkrValue: amount,
              c1Code,
              c2Code,
              c1Rate,
              c2Rate,
            })
          : amount === 0
            ? ""
            : formatMoney(amount);

        return [
          detailText,
          units === 0 ? "" : units.toLocaleString(),
          rateDisplay,
          taxText,
          amountCell,
        ];
      },
    );

    const tableStartY = Math.max(235, rightBlockBottomY + 18);

    autoTable(pdf, {
      startY: tableStartY,
      head: [["SERVICE DETAILS", "UNITS", "RATE", "TAX", "AMOUNT"]],
      body: serviceRows,
      styles: {
        fontSize: 9,
        cellPadding: 4,
        valign: "top",
        overflow: "linebreak",
      },
      headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0] },
      margin: { left: margin, right: margin, bottom: FOOTER_GAP },
      columnStyles: addCurrencies
        ? ({
            0: { halign: "left" as const, cellWidth: 200 },
            1: { halign: "center" as const, cellWidth: 60 },
            2: { halign: "center" as const, cellWidth: 60 },
            3: { halign: "left" as const, cellWidth: 80 },
            4: { halign: "right" as const, cellWidth: 115 },
          } as any)
        : ({
            0: { halign: "left" as const, cellWidth: 225 },
            1: { halign: "center" as const, cellWidth: 70 },
            2: { halign: "center" as const, cellWidth: 70 },
            3: { halign: "left" as const, cellWidth: 80 },
            4: { halign: "right" as const, cellWidth: 70 },
          } as any),
      didParseCell: (data: any) => {
        if (data.column?.index === 4) {
          data.cell.styles.halign = "right";
        }
      },
    });

    let finalY = (pdf as any).lastAutoTable.finalY + 55;

    const perPaxCostEnabled = Boolean((estimate as any)?.perPaxCost);
    const paxCount = Math.trunc(toNum((estimate as any)?.numberOfPax));
    const showPerPaxLine = perPaxCostEnabled && paxCount > 0;

    const totalsBlockHeight = showPerPaxLine
      ? addCurrencies
        ? 145
        : 135
      : addCurrencies
        ? 120
        : 110;

    if (finalY + totalsBlockHeight > footerSafeY) {
      pdf.addPage();
      finalY = 80;
    }

    const whtTotal = Number((estimate as any)?.whtTotal ?? 0);

    const displayTaxPKR =
      toNum(
        (estimate as any)?.tax ?? (estimate as any)?.taxTotal ?? estimate.tax,
      ) + whtTotal;

    const subtotalPKR = toNum(estimate.subtotal ?? 0);
    const totalPKR = toNum(estimate.total ?? 0);
    const perPaxPKR = showPerPaxLine ? totalPKR / paxCount : 0;

    const drawTotalsBlock = (
      x: number,
      meta: { code: string; symbol: string },
      sub: number,
      tax: number,
      tot: number,
      blockW: number,
      perPax?: number,
    ) => {
      const labelX = x;
      const valueX = x + (blockW - 10);

      const pad = 8;
      const boxX = labelX - pad;
      const boxY = finalY - 26;
      const boxH = showPerPaxLine ? 94 : 72;

      pdf.setFillColor(245, 245, 245);
      pdf.rect(boxX, boxY, blockW + pad * 2, boxH, "F");
      pdf.setDrawColor(220);
      pdf.rect(boxX, boxY, blockW + pad * 2, boxH);

      pdf.setTextColor(0);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);

      pdf.text(meta.code, labelX, finalY - 12);

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

      const totalText =
        tot >= 0 ? formatWithSymbol(meta.symbol, tot) : `${meta.symbol} —`;

      pdf.text(totalText, valueX, finalY + 32, { align: "right" });

      if (showPerPaxLine) {
        const perPaxText =
          typeof perPax === "number" && perPax >= 0
            ? formatWithSymbol(meta.symbol, perPax)
            : `${meta.symbol} —`;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        pdf.text("PER PAX COST INCL. TAXES", labelX, finalY + 50);
        pdf.text(perPaxText, valueX, finalY + 50, { align: "right" });
      }

      pdf.setFontSize(10);
    };

    if (!addCurrencies) {
      const blockW = 170;
      const x = pageWidth - margin - blockW;
      drawTotalsBlock(
        x,
        { code: "PKR", symbol: "PKR" },
        subtotalPKR,
        displayTaxPKR,
        totalPKR,
        blockW,
        perPaxPKR,
      );
    } else {
      const blockW = 160;
      const gap = 10;
      const totalW = blockW * 3 + gap * 2;
      const startX = pageWidth - margin - totalW;

      const c1Sub = c1Rate > 0 ? subtotalPKR / c1Rate : -1;
      const c1Tax = c1Rate > 0 ? displayTaxPKR / c1Rate : -1;
      const c1Tot = c1Rate > 0 ? totalPKR / c1Rate : -1;
      const c1PerPax = c1Tot >= 0 && showPerPaxLine ? c1Tot / paxCount : -1;

      const c2Sub = c2Rate > 0 ? subtotalPKR / c2Rate : -1;
      const c2Tax = c2Rate > 0 ? displayTaxPKR / c2Rate : -1;
      const c2Tot = c2Rate > 0 ? totalPKR / c2Rate : -1;
      const c2PerPax = c2Tot >= 0 && showPerPaxLine ? c2Tot / paxCount : -1;

      drawTotalsBlock(
        startX + (blockW + gap) * 0,
        { code: "PKR", symbol: "PKR" },
        subtotalPKR,
        displayTaxPKR,
        totalPKR,
        blockW,
        perPaxPKR,
      );

      drawTotalsBlock(
        startX + (blockW + gap) * 1,
        { code: c1.code, symbol: c1.symbol },
        c1Sub,
        c1Tax,
        c1Tot,
        blockW,
        c1PerPax,
      );
      drawTotalsBlock(
        startX + (blockW + gap) * 2,
        { code: c2.code, symbol: c2.symbol },
        c2Sub,
        c2Tax,
        c2Tot,
        blockW,
        c2PerPax,
      );
    }

    const calcBase = (s: any) => {
      const units = Number(s.units || 0);
      const rateMode = (s as any).rateMode as "amount" | "percent" | undefined;
      const rateNum = toNum(s.rate);
      return rateMode === "percent" ? units * (rateNum / 100) : units * rateNum;
    };

    const taxType2 = String((estimate as any)?.taxType || "").trim();

    const calcLineTotal = (s: any) => {
      const base = calcBase(s);
      const pct = Number(s.taxPercent ?? 0);

      if (!pct || taxType2 === "none") return base;
      if (taxType2 === "inclusive") return base;
      return base + (base * pct) / 100;
    };

    const services = (estimate.services || []) as any[];

    const map = new Map<
      string,
      { label: string; pct: number; tax: number; net: number }
    >();

    for (const s of services) {
      const pct = Number(s.taxPercent ?? 0);
      const label = String(s.taxLabel || "").trim();
      if (!pct || taxType2 === "none") continue;

      const base = calcBase(s);

      let taxAmount = 0;
      let netAmount = 0;

      if (taxType2 === "exclusive") {
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

    let afterTotalsY = finalY + (showPerPaxLine ? 78 : 55);

    const addCur = Boolean((estimate as any)?.addCurrencies);

    const taxRows: any[] = Array.from(map.values()).map((r) => {
      const taxCell = addCur
        ? buildMultiCurrencyLines({
            pkrValue: r.tax,
            c1Code,
            c2Code,
            c1Rate,
            c2Rate,
          })
        : formatMoney(r.tax);

      const netCell = addCur
        ? buildMultiCurrencyLines({
            pkrValue: r.net,
            c1Code,
            c2Code,
            c1Rate,
            c2Rate,
          })
        : formatMoney(r.net);

      return [`${r.label} @ ${r.pct}%`, `${r.pct}%`, taxCell, netCell];
    });

    const whtRows: any[] = Array.from(whtMap.values()).map((r) => {
      const whtCell = addCur
        ? buildMultiCurrencyLines({
            pkrValue: r.wht,
            c1Code,
            c2Code,
            c1Rate,
            c2Rate,
          })
        : formatMoney(r.wht);

      const baseCell = addCur
        ? buildMultiCurrencyLines({
            pkrValue: r.base,
            c1Code,
            c2Code,
            c1Rate,
            c2Rate,
          })
        : formatMoney(r.base);

      return [`${r.label} @ ${r.pct}%`, `${r.pct}%`, whtCell, baseCell];
    });

    if (taxRows.length > 0 || whtRows.length > 0) {
      const combinedRows: any[] = [];

      if (taxRows.length > 0) {
        combinedRows.push(...taxRows);
        combinedRows.push([
          "",
          "TOTAL (TAX)",
          addCur
            ? buildMultiCurrencyLines({
                pkrValue: totalTax,
                c1Code,
                c2Code,
                c1Rate,
                c2Rate,
              })
            : formatMoney(totalTax),
          addCur
            ? buildMultiCurrencyLines({
                pkrValue: totalNet,
                c1Code,
                c2Code,
                c1Rate,
                c2Rate,
              })
            : formatMoney(totalNet),
        ]);
      }

      if (whtRows.length > 0) {
        combinedRows.push(...whtRows);
        combinedRows.push([
          "",
          "TOTAL (WHT)",
          addCur
            ? buildMultiCurrencyLines({
                pkrValue: totalWht,
                c1Code,
                c2Code,
                c1Rate,
                c2Rate,
              })
            : formatMoney(totalWht),
          addCur
            ? buildMultiCurrencyLines({
                pkrValue: totalWhtBase,
                c1Code,
                c2Code,
                c1Rate,
                c2Rate,
              })
            : formatMoney(totalWhtBase),
        ]);
      }

      const FOOTER_GAP = 110;

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
        didParseCell: (data: any) => {
          if (data.section === "head") {
            const header = String(data.cell.raw || "")
              .trim()
              .toUpperCase();
            if (header === "RATE" || header === "TAX" || header === "NET") {
              data.cell.styles.halign = "right";
            }
          }
        },
      });

      afterTotalsY = (pdf as any).lastAutoTable.finalY + 30;
    }

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

    const footerY = pdf.internal.pageSize.getHeight() - 70;
    pdf.setFontSize(8);
    pdf.setTextColor(100);

    pdf.text(
      resolveFooterContact(estimate, args.footerUser, args.usersMap),
      margin,
      footerY - 15,
      { maxWidth: pageWidth - margin * 2 },
    );

    pdf.text(
      "C-150, Block 2, Clifton, Karachi - 75600, Pakistan | Tel: +92 213 537 1818 | Email: sales@iedge.co | URL: www.iedge.co",
      margin,
      footerY + 15,
      { maxWidth: pageWidth - margin * 2 },
    );
  };

  drawPage1();

  addTermsAndConditionsPages(pdf, {
    title: (estimate as any).termsConditionTitle || "",
    text:
      (estimate as any).termsConditionText ||
      (estimate as any).termsCondition ||
      "",
  });

  addPageNumbers(pdf);

  return pdf.output("blob");
}
