// Export helpers for the Reports page. Both functions take whatever rows the
// caller hands them (already filtered, already sliced to the chosen export
// row count) — this module only knows how to serialize a row set, not how
// many of them belong in the file.

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ProjectReportRow } from "./types";
import { formatDate, formatMoney, formatPercent } from "./format";

const STATUS_LABELS: Record<ProjectReportRow["status"], string> = {
  estimate_only: "Estimate Only",
  invoiced: "Invoiced",
  no_estimate_data: "No Estimate on File",
};

const PAYMENT_LABELS: Record<ProjectReportRow["paymentStatus"], string> = {
  fully_paid: "100% Paid",
  partially_paid: "Partially Paid",
  unpaid: "Unpaid",
  no_invoice: "Not Invoiced Yet",
};

export function exportProjectReportsToExcel(
  rows: ProjectReportRow[],
  filename = "project-reports.xlsx",
) {
  const worksheet = XLSX.utils.json_to_sheet(
    rows.map((row) => ({
      "Project Code": row.projectCode,
      "Project Name": row.projectName,
      Client: row.client || "-",
      Estimated: row.estimateTotal,
      Cost: row.totalCost,
      Invoiced: row.invoiceCount > 0 ? row.invoicedTotal : 0,
      "Payment Status": PAYMENT_LABELS[row.paymentStatus],
      "Days Outstanding": row.daysOutstanding ?? "-",
      Profit: row.profit ?? "-",
      "Profit %": row.profitMargin ?? "-",
      Status: STATUS_LABELS[row.status],
      "Earliest Activity": formatDate(row.earliestDate),
      "Latest Activity": formatDate(row.latestDate),
    })),
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Project Reports");
  XLSX.writeFile(workbook, filename);
}

export function exportProjectReportsToPdf(
  rows: ProjectReportRow[],
  filename = "project-reports.pdf",
) {
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(16);
  doc.text("Project Reports", 14, 16);

  doc.setFontSize(10);
  doc.text(
    `${rows.length} project(s) - generated ${new Date().toLocaleDateString("en-GB")}`,
    14,
    23,
  );

  autoTable(doc, {
    startY: 30,
    styles: { fontSize: 8 },
    head: [
      [
        "Project",
        "Client",
        "Estimated",
        "Cost",
        "Invoiced",
        "Payment",
        "Days Out.",
        "Profit",
        "Profit %",
        "Status",
      ],
    ],
    body: rows.map((row) => [
      row.projectName,
      row.client || "-",
      formatMoney(row.estimateTotal),
      formatMoney(row.totalCost),
      row.invoiceCount > 0 ? formatMoney(row.invoicedTotal) : "-",
      PAYMENT_LABELS[row.paymentStatus],
      row.daysOutstanding === null ? "-" : `${row.daysOutstanding}d`,
      row.profit === null ? "-" : formatMoney(row.profit),
      row.profitMargin === null ? "-" : formatPercent(row.profitMargin),
      STATUS_LABELS[row.status],
    ]),
  });

  doc.save(filename);
}
