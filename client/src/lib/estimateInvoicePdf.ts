// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
// import type { Estimate } from "../types";

// /**
//  * Invoice doc uses the same structure as Estimate + these extra fields:
//  * - invoiceNo
//  * - invoiceDate
//  * - dueDate (optional)
//  * - sourceEstimateNo (optional)
//  */
// export type EstimateInvoice = Estimate & {
//   invoiceNo?: string;
//   invoiceDate?: string;
//   dueDate?: string;
//   sourceEstimateNo?: string;
//   heading?: string;
//   // ✅ also supports: poNumber?: string; (stored in invoice data)
// };

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
// };

// type BuildPdfArgs = {
//   invoice: EstimateInvoice;
//   companyList: Company[];
//   withLogo?: boolean;
//   footerUser?: FooterUser | null;
//   usersMap?: Record<string, FooterUser>;
//   companyName?: string;
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

// const resolveInvoiceHeading = (invoice: any) => {
//   return invoice.invoiceHeading || invoice.heading || "Estimate Invoice";
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

// const resolveUser = (
//   invoice: EstimateInvoice,
//   footerUser?: FooterUser | null,
//   usersMap?: Record<string, FooterUser>,
// ) => {
//   return (
//     footerUser ||
//     (usersMap && invoice?.createdBy
//       ? usersMap[invoice.createdBy]
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

// const resolveFooterContact = () => {
//   return `For any queries, please feel free to call Ahsan Idrees | ahsan.idrees@iedge.co | +92 345 8508254 | Terms & Conditions enclosed.`;
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

// export async function buildEstimateInvoicePdfBlob(
//   args: BuildPdfArgs,
// ): Promise<Blob> {
//   const { invoice, companyList } = args;

//   const pdf = new jsPDF({
//     orientation: "p",
//     unit: "pt",
//     format: "a4",
//     compress: true,
//   });

//   const pageWidth = pdf.internal.pageSize.getWidth();
//   const pageHeight = pdf.internal.pageSize.getHeight();
//   const margin = 40;

//   const companyName = args.companyName ?? (invoice.company || "");
//   const selectedCompany = companyList.find((c) => c.name === companyName);
//   const withLogo = args.withLogo ?? (invoice as any)?.withLogo ?? true;
//   const logoSrc = withLogo && selectedCompany ? selectedCompany.logo : null;

//   // logo
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
//       } catch {}
//     }
//   }

//   const drawPage1 = () => {
//     const headingText = resolveInvoiceHeading(invoice);

//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(14);
//     pdf.text(headingText.toUpperCase(), margin, 80);

//     let y = 100;
//     pdf.setFontSize(9);
//     pdf.text("TO", margin, y);
//     y += 12;

//     pdf.setFont("helvetica", "bold");
//     pdf.text(invoice.client || "", margin, y);
//     y += 12;
//     pdf.text((invoice as any).info || invoice.info || "", margin, y);

//     pdf.setFont("helvetica", "normal");
//     y += 12;

//     const wrappedAddress = wrapTextByWords(
//       (invoice as any).address || invoice.address || "",
//       5,
//     );
//     wrappedAddress.forEach((line) => {
//       pdf.text(line, margin, y);
//       y += 12;
//     });

//     // ✅ Right-side meta block (dynamic Y) + PO Number
//     const rightX = pageWidth - 180;
//     let metaY = 100;

//     pdf.setFont("helvetica", "bold");
//     pdf.text(
//       `${headingText.toUpperCase()}: ${invoice.invoiceNo || "—"}`,
//       rightX,
//       metaY,
//     );
//     metaY += 14;

//     const srcEst = String((invoice as any).sourceEstimateNo || "").trim();
//     if (srcEst) {
//       pdf.setFont("helvetica", "normal");
//       pdf.text(`Estimate Ref: ${srcEst}`, rightX, metaY);
//       metaY += 14;
//     }

//     pdf.setFont("helvetica", "normal");
//     pdf.text(
//       `Invoice Date: ${formatDatePretty((invoice as any).invoiceDate)}`,
//       rightX,
//       metaY,
//     );
//     metaY += 15;

//     const due = String((invoice as any).dueDate || "").trim();
//     if (due) {
//       pdf.text(`Due Date: ${formatDatePretty(due)}`, rightX, metaY);
//       metaY += 15;
//     }

//     // ✅ PO Number
//     const po = String((invoice as any).poNumber || "").trim();
//     if (po) {
//       pdf.text(`PO Number: ${po}`, rightX, metaY);
//       metaY += 15;
//     }

//     // Project owner
//     pdf.setFont("helvetica", "bold");
//     pdf.text("PROJECT OWNER", margin, 175);
//     pdf.setFont("helvetica", "normal");
//     pdf.text(invoice.projectOwner || "", margin, 185);

//     if (invoice.paymentTerm) {
//       let paymentY = 185 + 24;
//       pdf.setFont("helvetica", "bold");
//       pdf.text("Payment Terms:", margin, paymentY);
//       paymentY += 12;
//       pdf.setFont("helvetica", "normal");

//       const wrappedTerms = wrapTextByWords(invoice.paymentTerm, 8);
//       wrappedTerms.forEach((line) => {
//         pdf.text(line, margin, paymentY);
//         paymentY += 12;
//       });
//     }

//     const FOOTER_GAP = 110;
//     const footerSafeY = pageHeight - FOOTER_GAP;

//     // SERVICE TABLE
//     const serviceRows = ((invoice.services || []) as any[]).map(
//       (s: ServiceItem) => {
//         const units = Number(s.units || 0);

//         const rateMode = (s as any).rateMode as
//           | "amount"
//           | "percent"
//           | undefined;
//         const rateNum = Number(String(s.rate ?? 0).replace(/,/g, "")) || 0;

//         const amount =
//           rateMode === "percent" ? units * (rateNum / 100) : units * rateNum;

//         const rateDisplay =
//           rateMode === "percent"
//             ? rateNum === 0
//               ? ""
//               : `${formatMoney(rateNum)}%`
//             : rateNum === 0
//               ? ""
//               : formatMoney(rateNum);

//         return [
//           `${s.detail}\n${s.description || ""}`,
//           units === 0 ? "" : units.toLocaleString(),
//           rateDisplay,
//           Number(s.taxPercent ?? 0) > 0 && invoice.taxType !== "none"
//             ? `${s.taxLabel ?? "Tax"} ${Number(s.taxPercent ?? 0)}%`
//             : "No Tax",
//           amount === 0 ? "" : formatMoney(amount),
//         ];
//       },
//     );

//     autoTable(pdf, {
//       startY: 235,
//       head: [["SERVICE DETAILS", "UNITS", "RATE", "TAX", "AMOUNT"]],
//       body: serviceRows,
//       styles: { fontSize: 9, cellPadding: 4, valign: "top" },
//       headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0] },
//       margin: { bottom: FOOTER_GAP },
//     });

//     let finalY = (pdf as any).lastAutoTable.finalY + 55;
//     const totalsBlockHeight = 110;
//     if (finalY + totalsBlockHeight > footerSafeY) {
//       pdf.addPage();
//       finalY = 80;
//     }

//     // TOTALS (Tax line includes WHT)
//     const whtTotal = Number((invoice as any)?.whtTotal ?? 0);
//     const displayTax = Number(invoice.tax ?? 0) + whtTotal;

//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(10);
//     pdf.text("SUBTOTAL", pageWidth - 200, finalY, { align: "left" });
//     pdf.text("TAX", pageWidth - 200, finalY + 15, { align: "left" });
//     pdf.text("TOTAL", pageWidth - 200, finalY + 32, { align: "left" });

//     const totalsRightX = pageWidth - 40;

//     pdf.setFont("helvetica", "normal");
//     pdf.setFontSize(10);
//     pdf.text(formatMoney(invoice.subtotal ?? 0), totalsRightX, finalY, {
//       align: "right",
//     });
//     pdf.text(formatMoney(displayTax), totalsRightX, finalY + 15, {
//       align: "right",
//     });

//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(13);
//     pdf.text(
//       `PKR ${formatMoney(invoice.total ?? 0)}`,
//       totalsRightX,
//       finalY + 32,
//       { align: "right" },
//     );
//     pdf.setFontSize(10);

//     // SUMMARY CALCS
//     const services = (invoice.services || []) as any[];
//     const taxType = String((invoice as any)?.taxType || "").trim();

//     const calcBase = (s: any) => {
//       const units = Number(s.units || 0);
//       const rateMode = (s as any).rateMode as "amount" | "percent" | undefined;
//       const rateNum = Number(String(s.rate ?? 0).replace(/,/g, "")) || 0;
//       return rateMode === "percent" ? units * (rateNum / 100) : units * rateNum;
//     };

//     const calcLineTotal = (s: any) => {
//       const base = calcBase(s);
//       const pct = Number(s.taxPercent ?? 0);

//       if (!pct || taxType === "none") return base;
//       if (taxType === "inclusive") return base;
//       return base + (base * pct) / 100;
//     };

//     // TAX SUMMARY
//     const map = new Map<
//       string,
//       { label: string; pct: number; tax: number; net: number }
//     >();

//     for (const s of services) {
//       const pct = Number(s.taxPercent ?? 0);
//       const label = String(s.taxLabel || "").trim();
//       if (!pct || taxType === "none") continue;

//       const base = calcBase(s);

//       let taxAmount = 0;
//       let netAmount = 0;

//       if (taxType === "exclusive") {
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

//     const taxRows = Array.from(map.values()).map((r) => [
//       `${r.label} @ ${r.pct}%`,
//       `${r.pct}%`,
//       formatMoney(r.tax),
//       formatMoney(r.net),
//     ]);

//     const totalTax = Array.from(map.values()).reduce((a, b) => a + b.tax, 0);
//     const totalNet = Array.from(map.values()).reduce((a, b) => a + b.net, 0);

//     // WHT SUMMARY
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

//     const whtRows = Array.from(whtMap.values()).map((r) => [
//       `${r.label} @ ${r.pct}%`,
//       `${r.pct}%`,
//       formatMoney(r.wht),
//       formatMoney(r.base),
//     ]);

//     const totalWht = Array.from(whtMap.values()).reduce((a, b) => a + b.wht, 0);
//     const totalWhtBase = Array.from(whtMap.values()).reduce(
//       (a, b) => a + b.base,
//       0,
//     );

//     // ONE TABLE: TAX SUMMARY + WHT rows
//     let afterTotalsY = finalY + 45;

//     if (taxRows.length > 0 || whtRows.length > 0) {
//       const combinedRows: any[] = [];

//       if (taxRows.length > 0) {
//         combinedRows.push(...taxRows);
//         combinedRows.push([
//           "",
//           "TOTAL (TAX)",
//           formatMoney(totalTax),
//           formatMoney(totalNet),
//         ]);
//       }

//       if (whtRows.length > 0) {
//         combinedRows.push(...whtRows);
//         combinedRows.push([
//           "",
//           "TOTAL (WHT)",
//           formatMoney(totalWht),
//           formatMoney(totalWhtBase),
//         ]);
//       }

//       autoTable(pdf, {
//         startY: afterTotalsY,
//         head: [["TAXATION SUMMARY", "RATE", "TAX/WHT", "NET/BASE"]],
//         body: combinedRows,
//         styles: { fontSize: 9, cellPadding: 4 },
//         headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
//         columnStyles: {
//           0: { halign: "left" },
//           1: { halign: "center" },
//           2: { halign: "right" },
//           3: { halign: "right" },
//         },
//         margin: { bottom: FOOTER_GAP },
//       });

//       afterTotalsY = (pdf as any).lastAutoTable.finalY + 30;
//     }

//     // MESSAGE
//     if (invoice.message) {
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

//       const wrappedMsg = wrapTextByWords(invoice.message, 10);
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

//     // footer
//     const footerY = pdf.internal.pageSize.getHeight() - 70;
//     pdf.setFontSize(8);
//     pdf.setTextColor(100);

//     pdf.text(resolveFooterContact(), margin, footerY - 15, {
//       maxWidth: pageWidth - margin * 2,
//     });

//     pdf.text(
//       "C-150, Block 2, Clifton, Karachi - 75600, Pakistan | Tel: +92 213 537 1818 | Email: sales@iedge.co | URL: www.iedge.co",
//       margin,
//       footerY + 15,
//       { maxWidth: pageWidth - margin * 2 },
//     );
//   };

//   // page 1
//   drawPage1();

//   // T&C pages
//   addTermsAndConditionsPages(pdf, {
//     title: (invoice as any).termsConditionTitle || "",
//     text:
//       (invoice as any).termsConditionText ||
//       (invoice as any).termsCondition ||
//       "",
//   });

//   // page numbers
//   addPageNumbers(pdf);

//   return pdf.output("blob");
// }

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Estimate } from "../types";

/**
 * Invoice doc uses the same structure as Estimate + these extra fields:
 * - invoiceNo
 * - invoiceDate
 * - dueDate (optional)
 * - sourceEstimateNo (optional)
 */
export type EstimateInvoice = Estimate & {
  invoiceNo?: string;
  invoiceDate?: string;
  dueDate?: string;
  sourceEstimateNo?: string;
  heading?: string;
  // ✅ also supports: poNumber?: string; (stored in invoice data)
  selectedPercentage?: number;
  selectedPercentageSubtotal?: number;
  selectedPercentageTax?: number;
  selectedPercentageTotal?: number;
};

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
  invoice: EstimateInvoice;
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

const resolveInvoiceHeading = (invoice: any) => {
  return invoice.invoiceHeading || invoice.heading || "Estimate Invoice";
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

const resolveUser = (
  invoice: EstimateInvoice,
  footerUser?: FooterUser | null,
  usersMap?: Record<string, FooterUser>,
) => {
  return (
    footerUser ||
    (usersMap && invoice?.createdBy
      ? usersMap[invoice.createdBy]
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

const resolveFooterContact = () => {
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

export async function buildEstimateInvoicePdfBlob(
  args: BuildPdfArgs,
): Promise<Blob> {
  const { invoice, companyList } = args;

  const pdf = new jsPDF({
    orientation: "p",
    unit: "pt",
    format: "a4",
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;

  const companyName = args.companyName ?? (invoice.company || "");
  const selectedCompany = companyList.find((c) => c.name === companyName);
  const withLogo = args.withLogo ?? (invoice as any)?.withLogo ?? true;
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
      } catch {}
    }
  }

  const drawPage1 = () => {
    const headingText = resolveInvoiceHeading(invoice);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text(headingText.toUpperCase(), margin, 80);

    let y = 100;
    pdf.setFontSize(9);
    pdf.text("TO", margin, y);
    y += 12;

    pdf.setFont("helvetica", "bold");
    pdf.text(invoice.client || "", margin, y);
    y += 12;
    pdf.text((invoice as any).info || invoice.info || "", margin, y);

    pdf.setFont("helvetica", "normal");
    y += 12;

    const wrappedAddress = wrapTextByWords(
      (invoice as any).address || invoice.address || "",
      5,
    );
    wrappedAddress.forEach((line) => {
      pdf.text(line, margin, y);
      y += 12;
    });

    const rightX = pageWidth - 180;
    let metaY = 100;

    pdf.setFont("helvetica", "bold");
    pdf.text(
      `${headingText.toUpperCase()}: ${invoice.invoiceNo || "—"}`,
      rightX,
      metaY,
    );
    metaY += 14;

    const srcEst = String((invoice as any).sourceEstimateNo || "").trim();
    if (srcEst) {
      pdf.setFont("helvetica", "normal");
      pdf.text(`Estimate Ref: ${srcEst}`, rightX, metaY);
      metaY += 14;
    }

    pdf.setFont("helvetica", "normal");
    pdf.text(
      `Invoice Date: ${formatDatePretty((invoice as any).invoiceDate)}`,
      rightX,
      metaY,
    );
    metaY += 15;

    const due = String((invoice as any).dueDate || "").trim();
    if (due) {
      pdf.text(`Due Date: ${formatDatePretty(due)}`, rightX, metaY);
      metaY += 15;
    }

    const po = String((invoice as any).poNumber || "").trim();
    if (po) {
      pdf.text(`PO Number: ${po}`, rightX, metaY);
      metaY += 15;
    }

    pdf.setFont("helvetica", "bold");
    pdf.text("PROJECT OWNER", margin, 175);
    pdf.setFont("helvetica", "normal");
    pdf.text(invoice.projectOwner || "", margin, 185);

    if (invoice.paymentTerm) {
      let paymentY = 185 + 24;
      pdf.setFont("helvetica", "bold");
      pdf.text("Payment Terms:", margin, paymentY);
      paymentY += 12;
      pdf.setFont("helvetica", "normal");

      const wrappedTerms = wrapTextByWords(invoice.paymentTerm, 8);
      wrappedTerms.forEach((line) => {
        pdf.text(line, margin, paymentY);
        paymentY += 12;
      });
    }

    const FOOTER_GAP = 110;
    const footerSafeY = pageHeight - FOOTER_GAP;

    const serviceRows = ((invoice.services || []) as any[]).map(
      (s: ServiceItem) => {
        const units = Number(s.units || 0);

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
          Number(s.taxPercent ?? 0) > 0 && invoice.taxType !== "none"
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
      margin: { bottom: FOOTER_GAP },
    });

    let finalY = (pdf as any).lastAutoTable.finalY + 55;
    const totalsBlockHeight = 110;
    if (finalY + totalsBlockHeight > footerSafeY) {
      pdf.addPage();
      finalY = 80;
    }

    const selectedPercentage = Number(
      (invoice as any)?.selectedPercentage ?? 100,
    );
    const hasPartialPayment =
      Number.isFinite(selectedPercentage) &&
      selectedPercentage > 0 &&
      selectedPercentage < 100;

    const actualSubtotal = Number(invoice.subtotal ?? 0);
    const actualTax = Number(invoice.tax ?? 0);
    const whtTotal = Number((invoice as any)?.whtTotal ?? 0);
    const actualTaxPlusWht = actualTax + whtTotal;
    const actualTotal = Number(invoice.total ?? 0);

    const partialSubtotal = Number(
      (invoice as any)?.selectedPercentageSubtotal ?? 0,
    );

    // ✅ Partial TAX must be selected % of (actual TAX + actual WHT)
    const partialTax = Number(
      (actualTaxPlusWht * (selectedPercentage / 100)).toFixed(2),
    );

    // ✅ Partial TOTAL should remain based on saved selected total if available,
    // otherwise calculate from subtotal + tax+wht
    const partialTotal = Number(
      (
        (invoice as any)?.selectedPercentageTotal ??
        partialSubtotal + partialTax
      ).toFixed(2),
    );

    const displayTax = actualTaxPlusWht;

    // Partial payment block on left side of the main totals block
    if (hasPartialPayment) {
      // ✅ Move this block well towards the left side of the page
      const partialBlockLabelX = margin + 10;
      const partialBlockValueX = 255;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text(
        `Advance Payment – ${selectedPercentage}%`,
        partialBlockLabelX,
        finalY - 18,
        { align: "left" },
      );

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("SUBTOTAL", partialBlockLabelX, finalY, { align: "left" });
      pdf.text("TAX", partialBlockLabelX, finalY + 15, { align: "left" });
      pdf.text("TOTAL", partialBlockLabelX, finalY + 32, { align: "left" });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(formatMoney(partialSubtotal), partialBlockValueX, finalY, {
        align: "right",
      });
      pdf.text(formatMoney(partialTax), partialBlockValueX, finalY + 15, {
        align: "right",
      });

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.text(
        `PKR ${formatMoney(partialTotal)}`,
        partialBlockValueX,
        finalY + 32,
        {
          align: "right",
        },
      );
    }

    // Existing total block stays in same place
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("SUBTOTAL", pageWidth - 200, finalY, { align: "left" });
    pdf.text("TAX", pageWidth - 200, finalY + 15, { align: "left" });
    pdf.text("TOTAL", pageWidth - 200, finalY + 32, { align: "left" });

    const totalsRightX = pageWidth - 40;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(formatMoney(invoice.subtotal ?? 0), totalsRightX, finalY, {
      align: "right",
    });
    pdf.text(formatMoney(displayTax), totalsRightX, finalY + 15, {
      align: "right",
    });

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text(
      `PKR ${formatMoney(invoice.total ?? 0)}`,
      totalsRightX,
      finalY + 32,
      { align: "right" },
    );
    pdf.setFontSize(10);

    const services = (invoice.services || []) as any[];
    const taxType = String((invoice as any)?.taxType || "").trim();

    const calcBase = (s: any) => {
      const units = Number(s.units || 0);
      const rateMode = (s as any).rateMode as "amount" | "percent" | undefined;
      const rateNum = Number(String(s.rate ?? 0).replace(/,/g, "")) || 0;
      return rateMode === "percent" ? units * (rateNum / 100) : units * rateNum;
    };

    const calcLineTotal = (s: any) => {
      const base = calcBase(s);
      const pct = Number(s.taxPercent ?? 0);

      if (!pct || taxType === "none") return base;
      if (taxType === "inclusive") return base;
      return base + (base * pct) / 100;
    };

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

    const taxRows = Array.from(map.values()).map((r) => [
      `${r.label} @ ${r.pct}%`,
      `${r.pct}%`,
      formatMoney(r.tax),
      formatMoney(r.net),
    ]);

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
        head: [["TAXATION SUMMARY", "RATE", "TAX/WHT", "NET/BASE"]],
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

    if (invoice.message) {
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

      const wrappedMsg = wrapTextByWords(invoice.message, 10);
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

    pdf.text(resolveFooterContact(), margin, footerY - 15, {
      maxWidth: pageWidth - margin * 2,
    });

    pdf.text(
      "C-150, Block 2, Clifton, Karachi - 75600, Pakistan | Tel: +92 213 537 1818 | Email: sales@iedge.co | URL: www.iedge.co",
      margin,
      footerY + 15,
      { maxWidth: pageWidth - margin * 2 },
    );
  };

  drawPage1();

  addTermsAndConditionsPages(pdf, {
    title: (invoice as any).termsConditionTitle || "",
    text:
      (invoice as any).termsConditionText ||
      (invoice as any).termsCondition ||
      "",
  });

  addPageNumbers(pdf);

  return pdf.output("blob");
}
