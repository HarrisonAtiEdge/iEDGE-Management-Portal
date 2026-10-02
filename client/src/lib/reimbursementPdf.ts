// Builds the printable reimbursement documents used by the Reimbursement
// Dashboard for both "PDF Preview" and "Print": a single-claim document and
// a list report of the currently filtered claims. Values arrive already
// formatted for display so this file only handles layout.

import type jsPDF from "jspdf";

export type ReimbursementPdfField = {
  label: string;
  value: string;
};

export type ReimbursementPdfData = {
  reference: string;
  claimInformation: ReimbursementPdfField[];
  amountInformation: ReimbursementPdfField[];
  approvalInformation: ReimbursementPdfField[];
  paymentInformation: ReimbursementPdfField[];
  details: string;
  approvalRemarks: string;
  billUrl?: string;
};

export type ReimbursementReportPdfData = {
  filters: ReimbursementPdfField[];
  summary: ReimbursementPdfField[];
  columns: string[];
  rows: string[][];
};

const COMPANY_NAME = "iEDGE SYSTEM";
const LOGO_SRC = "/Iedge-TM-Logos-01.png";
const FOOTER_TEXT = "Reimbursement Dashboard - iEDGE System";

const loadPdfLibs = async () => {
  const [{ default: JsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  return { JsPDF, autoTable };
};

const loadLogo = async (): Promise<HTMLImageElement | null> => {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = LOGO_SRC;

  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.onerror = () => resolve();
  });

  return img.width && img.height ? img : null;
};

// Draws the logo, company name, title and info lines; returns the Y position
// where content can start.
const drawHeader = async (
  pdf: jsPDF,
  margin: number,
  title: string,
  infoLines: string[],
) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const logo = await loadLogo();

  if (logo) {
    const logoWidth = 110;
    const logoHeight = logoWidth * (logo.height / logo.width);

    try {
      pdf.addImage(
        logo,
        "PNG",
        pageWidth - margin - logoWidth,
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

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(37, 99, 235);
  pdf.text(COMPANY_NAME, margin, 45);

  pdf.setFontSize(22);
  pdf.setTextColor(17, 24, 39);
  pdf.text(title, margin, 72);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(107, 114, 128);

  let y = 90;

  infoLines.forEach((line) => {
    pdf.text(line, margin, y);
    y += 13;
  });

  y -= 1;
  pdf.setDrawColor(17, 24, 39);
  pdf.setLineWidth(1.5);
  pdf.line(margin, y, pageWidth - margin, y);

  return y + 17;
};

const drawFooters = (pdf: jsPDF, margin: number) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pageCount = pdf.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(156, 163, 175);
    pdf.text(FOOTER_TEXT, margin, pageHeight - 20);
    pdf.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 20, {
      align: "right",
    });
  }
};

// Pairs fields into 4-column rows: label | value | label | value
const toKeyValueRows = (fields: ReimbursementPdfField[]) => {
  const rows: string[][] = [];

  for (let i = 0; i < fields.length; i += 2) {
    const left = fields[i];
    const right = fields[i + 1];

    rows.push([
      left.label,
      left.value || "N/A",
      right?.label || "",
      right ? right.value || "N/A" : "",
    ]);
  }

  return rows;
};

export async function buildReimbursementPdfBlob(
  data: ReimbursementPdfData,
): Promise<Blob> {
  const { JsPDF, autoTable } = await loadPdfLibs();

  const pdf = new JsPDF({
    orientation: "p",
    unit: "pt",
    format: "a4",
    compress: true,
  });

  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pdf.internal.pageSize.getWidth() - margin * 2;

  let cursorY = await drawHeader(pdf, margin, "Reimbursement", [
    `Reference: ${data.reference}`,
    `Printed on: ${new Date().toLocaleString()}`,
  ]);

  const sectionTitle = (title: string) => {
    if (cursorY > pageHeight - 90) {
      pdf.addPage();
      cursorY = margin;
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(17, 24, 39);
    pdf.text(title.toUpperCase(), margin, cursorY);
    cursorY += 6;
  };

  const keyValueSection = (title: string, fields: ReimbursementPdfField[]) => {
    if (!fields.length) return;

    sectionTitle(title);

    autoTable(pdf, {
      startY: cursorY,
      margin: { left: margin, right: margin },
      body: toKeyValueRows(fields),
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 6,
        textColor: [17, 24, 39],
        lineColor: [229, 231, 235],
        lineWidth: 0.5,
        overflow: "linebreak",
      },
      columnStyles: {
        0: {
          cellWidth: contentWidth * 0.18,
          fontStyle: "bold",
          textColor: [107, 114, 128],
          fillColor: [249, 250, 251],
        },
        1: { cellWidth: contentWidth * 0.32 },
        2: {
          cellWidth: contentWidth * 0.18,
          fontStyle: "bold",
          textColor: [107, 114, 128],
          fillColor: [249, 250, 251],
        },
        3: { cellWidth: contentWidth * 0.32 },
      },
    });

    cursorY = (pdf as any).lastAutoTable.finalY + 18;
  };

  const textSection = (title: string, text: string) => {
    sectionTitle(title);

    autoTable(pdf, {
      startY: cursorY,
      margin: { left: margin, right: margin },
      body: [[text]],
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 8,
        textColor: [17, 24, 39],
        lineColor: [229, 231, 235],
        lineWidth: 0.5,
        overflow: "linebreak",
        minCellHeight: 36,
      },
    });

    cursorY = (pdf as any).lastAutoTable.finalY + 18;
  };

  keyValueSection("Claim Information", data.claimInformation);
  keyValueSection("Amount Information", data.amountInformation);
  keyValueSection("Approval Information", data.approvalInformation);
  keyValueSection("Payment Information", data.paymentInformation);
  textSection("Claim Details", data.details || "No details");
  textSection(
    "Approval Remarks",
    data.approvalRemarks || "No approval remarks added",
  );

  sectionTitle("Supporting Document");
  cursorY += 12;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);

  if (data.billUrl) {
    pdf.setTextColor(37, 99, 235);
    pdf.textWithLink("View Attached Bill", margin, cursorY, {
      url: data.billUrl,
    });
  } else {
    pdf.setTextColor(107, 114, 128);
    pdf.text("No bill attached", margin, cursorY);
  }

  // Signature lines
  cursorY += 60;

  if (cursorY > pageHeight - 70) {
    pdf.addPage();
    cursorY = margin + 60;
  }

  const signatureWidth = (contentWidth - 60) / 2;
  const signatures = ["Claimant Signature", "Authorized Signature"];

  pdf.setDrawColor(156, 163, 175);
  pdf.setLineWidth(0.75);
  pdf.setFontSize(9);
  pdf.setTextColor(107, 114, 128);

  signatures.forEach((label, index) => {
    const x = margin + index * (signatureWidth + 60);
    pdf.line(x, cursorY, x + signatureWidth, cursorY);
    pdf.text(label, x + signatureWidth / 2, cursorY + 14, {
      align: "center",
    });
  });

  drawFooters(pdf, margin);

  return pdf.output("blob");
}

export async function buildReimbursementReportPdfBlob(
  data: ReimbursementReportPdfData,
): Promise<Blob> {
  const { JsPDF, autoTable } = await loadPdfLibs();

  const pdf = new JsPDF({
    orientation: "l",
    unit: "pt",
    format: "a4",
    compress: true,
  });

  const margin = 30;

  let cursorY = await drawHeader(pdf, margin, "Reimbursement Report", [
    `Records: ${data.rows.length}`,
    `Printed on: ${new Date().toLocaleString()}`,
  ]);

  const summaryTable = (fields: ReimbursementPdfField[]) => {
    if (!fields.length) return;

    autoTable(pdf, {
      startY: cursorY,
      margin: { left: margin, right: margin },
      head: [fields.map((field) => field.label)],
      body: [fields.map((field) => field.value || "N/A")],
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 5,
        textColor: [17, 24, 39],
        lineColor: [229, 231, 235],
        lineWidth: 0.5,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [249, 250, 251],
        textColor: [107, 114, 128],
        fontStyle: "bold",
        fontSize: 7,
      },
    });

    cursorY = (pdf as any).lastAutoTable.finalY + 10;
  };

  summaryTable(data.filters);
  summaryTable(data.summary);

  autoTable(pdf, {
    startY: cursorY + 4,
    margin: { left: margin, right: margin, bottom: 40 },
    head: [data.columns],
    body: data.rows.length
      ? data.rows
      : [[{ content: "No records", colSpan: data.columns.length } as any]],
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 7,
      cellPadding: 4,
      textColor: [17, 24, 39],
      lineColor: [229, 231, 235],
      lineWidth: 0.5,
      overflow: "linebreak",
      valign: "top",
    },
    headStyles: {
      fillColor: [17, 24, 39],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
  });

  drawFooters(pdf, margin);

  return pdf.output("blob");
}

// Prints a PDF through a hidden iframe so the browser's print dialog opens
// directly; falls back to a new tab if the browser blocks it.
export function printPdfBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.src = url;

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }

    // Leave the iframe in place long enough for the print dialog to use it.
    setTimeout(() => {
      iframe.remove();
      URL.revokeObjectURL(url);
    }, 60_000);
  };

  document.body.appendChild(iframe);
}
