import jsPDF from "jspdf";
import autoTable, { type CellInput, type RowInput } from "jspdf-autotable";
import {
  buildOptionTable,
  FLIGHT_TABLE_COLUMNS,
  LOCAL_TIMES_NOTE,
  RATE_COLUMN_HEADING,
  type OptionTable,
} from "./document/optionTable";
import { estimateTitle } from "./constants";
import {
  estimateTravelDatesText,
  estimateTripTypesText,
  formatTimestamp,
  passengersText,
} from "./format";
import type { TravelEstimate } from "./types";

export const MARGIN = 30;
export const BRAND: [number, number, number] = [37, 99, 235];
export const MUTED: [number, number, number] = [107, 114, 128];
export const INK: [number, number, number] = [17, 24, 39];
export const HEADER_FILL: [number, number, number] = [242, 242, 242];

// Label, then the FLIGHT_TABLE_COLUMNS, in points.
const FLIGHT_COLUMN_WIDTHS = [48, 54, 50, 54, 54, 48, 54, 42, 60, 50, 42];

// The built-in PDF fonts only cover Latin-1; swap the few characters that
// would otherwise print as garbage.
export const pdfText = (value: string) =>
  value
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/→/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x00-\xFF]/g, "?");

const centered = { halign: "center", valign: "middle" } as const;

function tableRows(table: OptionTable): RowInput[] {
  const rowCount = table.rows.length;

  return table.rows.map((row, rowIndex) => {
    const cells: CellInput[] = [];

    if (rowIndex === 0) {
      cells.push({ content: pdfText(table.label), rowSpan: rowCount, styles: { ...centered, fontStyle: "bold" } });
    }

    cells.push(row.route, pdfText(row.flightNumber), row.departDate, row.arrivalDate, row.departTime, row.arrivalTime);

    if (row.journey) {
      cells.push(
        { content: row.journey.stops, rowSpan: row.journey.rowSpan, styles: centered },
        { content: pdfText(row.journey.stopover), rowSpan: row.journey.rowSpan, styles: centered },
        { content: row.journey.duration, rowSpan: row.journey.rowSpan, styles: centered },
      );
    }

    cells.push(pdfText(row.carrier));

    // Price on the first row in bold, the fare details in the rows under it,
    // as in the quote sheet. A fare without details takes the whole height.
    table.fares.forEach((fare) => {
      const splitDetails = fare.details.length > 0 && rowCount > 1;
      if (rowIndex === 0) {
        cells.push(
          splitDetails
            ? { content: pdfText(fare.price), styles: { ...centered, fontStyle: "bold", fontSize: 10 } }
            : {
                content: pdfText([fare.price, ...fare.details].join("\n")),
                rowSpan: rowCount,
                styles: { ...centered, fontStyle: "bold", fontSize: 10 },
              },
        );
      } else if (rowIndex === 1 && splitDetails) {
        cells.push({
          content: pdfText(fare.details.join("\n")),
          rowSpan: rowCount - 1,
          styles: { halign: "left", valign: "top" },
        });
      }
    });

    return cells;
  });
}

export function buildTravelEstimatePdf(estimate: TravelEstimate): jsPDF {
  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let y = MARGIN;

  // Header
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(...BRAND);
  // The category the estimate was made for, e.g. "Corporate".
  pdf.text(pdfText(estimateTitle(estimate.category)), MARGIN, y + 12);

  pdf.setFontSize(12);
  pdf.setTextColor(...INK);
  pdf.text(pdfText(estimate.estimateNo), pageWidth - MARGIN, y + 12, { align: "right" });

  y += 24;
  pdf.setDrawColor(...BRAND);
  pdf.setLineWidth(1.5);
  pdf.line(MARGIN, y, pageWidth - MARGIN, y);
  y += 16;

  // Summary, two columns. Each route is in its airline's table heading.
  const preparedBy = estimate.updatedBy ?? estimate.createdBy;
  const summary: [string, string][] = [
    ["Ticket type", estimateTripTypesText(estimate)],
    ["Travel dates", estimateTravelDatesText(estimate)],
    ["Passengers", passengersText(estimate.passengers)],
    [
      "Prepared",
      `${formatTimestamp(estimate.updatedAt ?? estimate.createdAt)}${preparedBy ? ` by ${preparedBy.name}` : ""}`,
    ],
  ];
  pdf.setFontSize(9.5);
  summary.forEach(([label, value], index) => {
    const x = index % 2 === 0 ? MARGIN : pageWidth / 2;
    const rowY = y + Math.floor(index / 2) * 14;
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...MUTED);
    pdf.text(label, x, rowY);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...INK);
    pdf.text(pdfText(value), x + 70, rowY);
  });
  y += Math.ceil(summary.length / 2) * 14 + 10;

  // One table per airline option
  estimate.options.forEach((option) => {
    const table = buildOptionTable(option, estimate.currency);

    autoTable(pdf, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      theme: "grid",
      rowPageBreak: "avoid",
      head: [
        ["", ...FLIGHT_TABLE_COLUMNS, ...table.fares.map(() => RATE_COLUMN_HEADING)],
        [
          "",
          {
            content: pdfText(table.heading || "-"),
            colSpan: FLIGHT_TABLE_COLUMNS.length,
            styles: { halign: "center", fontSize: 11 },
          },
          ...table.fares.map((fare) => pdfText(fare.name)),
        ],
      ],
      body: tableRows(table),
      styles: {
        fontSize: 8.5,
        cellPadding: 4,
        halign: "center",
        valign: "middle",
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
        textColor: INK,
      },
      headStyles: { fillColor: HEADER_FILL, textColor: INK, fontStyle: "bold" },
      // Fixed flight columns so every option's table lines up; the rates share the rest.
      columnStyles: Object.fromEntries(FLIGHT_COLUMN_WIDTHS.map((width, index) => [index, { cellWidth: width }])),
    });

    y = ((pdf as any).lastAutoTable?.finalY ?? y) + 18;
  });

  if (y > pageHeight - 40) {
    pdf.addPage();
    y = MARGIN;
  }
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...MUTED);
  pdf.text(pdfText(LOCAL_TIMES_NOTE), MARGIN, y);

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

export function downloadTravelEstimatePdf(estimate: TravelEstimate) {
  buildTravelEstimatePdf(estimate).save(`Travel-Estimate-${estimate.estimateNo}.pdf`);
}
