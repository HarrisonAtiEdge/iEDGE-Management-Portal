import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { applicantDisplayName } from "./applicants";
import { formatFullDate, formatTimestamp } from "./format";
import { BRAND, HEADER_FILL, INK, MARGIN, MUTED, pdfText } from "./travelEstimatePdf";
import type { SavedApplicantList } from "./types";

// A saved Application Details list as a PDF. Only Active applicants are
// printed; cancelled, refunded and no-show applicants stay in the saved list
// but are left out here.

/** The applicants who are travelling. */
export const activeApplicants = (list: SavedApplicantList) => list.applicants.filter((applicant) => !applicant.status);

export function buildApplicantListPdf(list: SavedApplicantList): jsPDF {
  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const active = activeApplicants(list);
  const leftOut = list.applicants.length - active.length;
  let y = MARGIN;

  // Header
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(...BRAND);
  pdf.text("Application Details", MARGIN, y + 12);

  y += 24;
  pdf.setDrawColor(...BRAND);
  pdf.setLineWidth(1.5);
  pdf.line(MARGIN, y, pageWidth - MARGIN, y);
  y += 18;

  pdf.setFontSize(12);
  pdf.setTextColor(...INK);
  const nameLines = pdf.splitTextToSize(pdfText(list.name), pageWidth - MARGIN * 2) as string[];
  pdf.text(nameLines, MARGIN, y);
  y += nameLines.length * 14 + 4;

  const summary: [string, string][] = [
    [
      "Applicants",
      `${active.length} active${leftOut ? ` (${leftOut} cancelled, refunded or no-show not included)` : ""}`,
    ],
    ["Saved", `${formatTimestamp(list.updatedAt)}${list.updatedBy ? ` by ${list.updatedBy.name}` : ""}`],
  ];
  pdf.setFontSize(9.5);
  summary.forEach(([label, value]) => {
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...MUTED);
    pdf.text(label, MARGIN, y);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...INK);
    pdf.text(pdfText(value), MARGIN + 70, y);
    y += 14;
  });
  y += 4;

  autoTable(pdf, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN, bottom: 34 },
    theme: "grid",
    head: [["S.No", "Full Name", "Given Name", "Surname", "Passport No.", "Date of Expiry", "Date of Birth"]],
    body: active.map((applicant, index) => [
      String(index + 1),
      pdfText(applicantDisplayName(applicant) || "-"),
      pdfText(applicant.givenName || "-"),
      pdfText(applicant.surname || "-"),
      applicant.passportNumber || "-",
      formatFullDate(applicant.passportExpiry),
      formatFullDate(applicant.dateOfBirth),
    ]),
    styles: {
      fontSize: 8.5,
      cellPadding: 4,
      valign: "middle",
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
      textColor: INK,
    },
    headStyles: { fillColor: HEADER_FILL, textColor: INK, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 34, halign: "center" },
      5: { cellWidth: 70 },
      6: { cellWidth: 70 },
    },
  });

  // Footer on every page
  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...MUTED);
    pdf.text(`Generated ${formatTimestamp(new Date())}`, MARGIN, pageHeight - 16);
    pdf.text(`Page ${page} of ${pageCount}`, pageWidth - MARGIN, pageHeight - 16, { align: "right" });
  }

  return pdf;
}

export function downloadApplicantListPdf(list: SavedApplicantList) {
  const fileName = list.name.replace(/[^A-Za-z0-9 _-]+/g, "").trim().replace(/\s+/g, "-") || "List";
  buildApplicantListPdf(list).save(`Application-Details-${fileName}.pdf`);
}
