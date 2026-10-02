// Shared "Payment Record" printout used by both Record List and Add Record,
// so a record prints with the same layout wherever it is printed from.

import type { Timestamp } from "firebase/firestore";

export type PrintableRecordItem = {
  category?: string;
  amount?: number;
  name?: string;
  description?: string;
};

export type PrintableRecord = {
  id: string;

  selectedDate?: string;
  chequeDate?: string;
  statementTitle?: string;

  accountType?: "cheque" | "online";
  accountTitle?: string;
  accountNo?: string;
  bank?: string;
  branch?: string;
  city?: string;
  platform?: string;
  routingNumber?: string;

  chequeNumber?: string;
  chequeAmount?: number;
  totalItemAmount?: number;
  remainingBalance?: number;

  items?: PrintableRecordItem[];

  createdByName?: string;
  createdAt?: Timestamp;
  status?: string;
};

const formatAmount = (value?: number): string => {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const formatDateOnly = (value?: string): string => {
  if (!value) return "-";

  try {
    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return value;
  }
};

const getRecordDate = (record: PrintableRecord): string => {
  if (record.selectedDate || record.chequeDate) {
    return formatDateOnly(record.selectedDate || record.chequeDate);
  }

  if (record.createdAt) {
    try {
      return record.createdAt.toDate().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    } catch {
      return "-";
    }
  }

  return "-";
};

const escapeHtml = (value: unknown): string => {
  return String(value ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Opens the printout in a new window and starts printing. Returns false when
// the browser blocked the pop-up so the caller can tell the user.
//
// The body below is moved verbatim from Record List, including indentation:
// item descriptions print with white-space: pre-wrap, so the template's
// whitespace is part of the output and must stay byte-for-byte identical.
export function printRecordDocument(record: PrintableRecord): boolean {
    const printWindow = window.open(
      "",
      "_blank",
      "width=1100,height=850,scrollbars=yes,resizable=yes",
    );

    if (!printWindow) {
      return false;
    }

    const items = Array.isArray(record.items)
      ? record.items
      : [];

    const documentReference =
      record.chequeNumber?.trim() ||
      record.id
        .slice(0, 10)
        .toUpperCase();

    const accountLocation = [
      record.branch,
      record.city,
    ]
      .filter(Boolean)
      .join(", ");

    const accountProvider =
      record.accountType === "online"
        ? record.platform ||
          record.bank
        : record.bank;

    const additionalAccountDetail =
      record.accountType === "online"
        ? record.routingNumber
          ? `Routing No: ${record.routingNumber}`
          : ""
        : accountLocation;

    const itemRows =
      items.length > 0
        ? items
            .map(
              (item, index) => `
                <tr>
                  <td class="serial-column">
                    ${index + 1}
                  </td>

                  <td>
                    <span class="cell-primary">
                      ${escapeHtml(
                        item.category ||
                          "-",
                      )}
                    </span>
                  </td>

                  <td>
                    <span class="cell-primary">
                      ${escapeHtml(
                        item.name || "-",
                      )}
                    </span>
                  </td>

                  <td>
                    <div class="description-text">
                      ${escapeHtml(
                        item.description ||
                          "-",
                      )}
                    </div>
                  </td>

                  <td class="amount-column">
                    ${escapeHtml(
                      formatAmount(
                        item.amount,
                      ),
                    )}
                  </td>
                </tr>
              `,
            )
            .join("")
        : `
            <tr>
              <td
                colspan="5"
                class="empty-row"
              >
                No transaction items are available for this document.
              </td>
            </tr>
          `;

    const printDocument = `
      <!DOCTYPE html>

      <html lang="en">
        <head>
          <meta charset="UTF-8" />

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />

          <title>
            Payment Record ${escapeHtml(
              documentReference,
            )}
          </title>

          <style>
            :root {
              --primary: #17375e;
              --primary-dark: #102a49;
              --accent: #d4a64a;
              --text: #172033;
              --muted: #667085;
              --border: #d9e0e8;
              --surface: #f6f8fb;
              --white: #ffffff;
            }

            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              background: var(--white);
              color: var(--text);
              font-family:
                Inter,
                "Segoe UI",
                Arial,
                Helvetica,
                sans-serif;
              font-size: 12px;
              line-height: 1.5;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            body {
              padding: 24px;
            }

            .document {
              width: 100%;
              max-width: 1000px;
              margin: 0 auto;
              overflow: hidden;
              border: 1px solid var(--border);
              background: var(--white);
              box-shadow:
                0 16px 45px
                rgba(
                  16,
                  42,
                  73,
                  0.1
                );
            }

            .top-accent {
              height: 6px;
              background:
                linear-gradient(
                  90deg,
                  var(--primary) 0%,
                  var(--primary) 76%,
                  var(--accent) 76%,
                  var(--accent) 100%
                );
            }

            .document-header {
              display: flex;
              align-items: center;
              justify-content:
                space-between;
              gap: 24px;
              padding: 25px 38px;
              background:
                linear-gradient(
                  135deg,
                  var(--primary),
                  var(--primary-dark)
                );
              color: var(--white);
            }

            .brand-area {
              display: flex;
              align-items: center;
              gap: 13px;
            }

            .brand-mark {
              display: flex;
              width: 48px;
              height: 48px;
              align-items: center;
              justify-content: center;
              border:
                1px solid
                rgba(
                  255,
                  255,
                  255,
                  0.32
                );
              border-radius: 12px;
              background:
                rgba(
                  255,
                  255,
                  255,
                  0.1
                );
              font-size: 18px;
              font-weight: 800;
            }

            .brand-name {
              margin: 0;
              font-size: 20px;
              font-weight: 700;
            }

            .brand-subtitle {
              margin: 2px 0 0;
              color:
                rgba(
                  255,
                  255,
                  255,
                  0.72
                );
              font-size: 8px;
              font-weight: 600;
              letter-spacing: 0.14em;
              text-transform:
                uppercase;
            }

            .document-heading {
              text-align: right;
            }

            .document-type {
              margin: 0;
              font-size: 20px;
              font-weight: 700;
            }

            .reference-row {
              margin-top: 4px;
              color:
                rgba(
                  255,
                  255,
                  255,
                  0.78
                );
              font-size: 9px;
            }

            .reference-value {
              margin-left: 4px;
              color: var(--white);
              font-weight: 700;
            }

            .document-body {
              padding: 25px 38px 34px;
            }

            .overview-grid {
              display: grid;
              grid-template-columns:
                repeat(
                  2,
                  minmax(0, 1fr)
                );
              gap: 12px;
              margin-bottom: 22px;
            }

            .overview-card {
              padding: 14px 16px;
              border:
                1px solid
                var(--border);
              border-radius: 10px;
              background:
                var(--surface);
            }

            .overview-label {
              margin-bottom: 4px;
              color: var(--muted);
              font-size: 8px;
              font-weight: 700;
              letter-spacing: 0.08em;
              text-transform:
                uppercase;
            }

            .overview-value {
              color: var(--text);
              font-size: 11px;
              font-weight: 700;
              overflow-wrap:
                anywhere;
            }

            .account-summary {
              display: grid;
              grid-template-columns:
                minmax(0, 1fr)
                310px;
              gap: 50px;
              margin-bottom: 23px;
              padding: 0 2px 19px;
              border-bottom:
                1px solid
                var(--border);
            }

            .compact-heading {
              margin-bottom: 3px;
              color:
                var(--primary-dark);
              font-size: 9px;
              font-weight: 800;
              letter-spacing: 0.08em;
              text-transform:
                uppercase;
            }

            .account-title {
              margin-bottom: 2px;
              font-size: 12px;
              font-weight: 750;
            }

            .account-line {
              color: #344054;
              font-size: 10px;
              line-height: 1.45;
              overflow-wrap:
                anywhere;
            }

            .record-information {
              justify-self: end;
              width: 100%;
              max-width: 310px;
            }

            .record-title {
              margin-bottom: 4px;
              color:
                var(--primary-dark);
              font-size: 10px;
              font-weight: 800;
              text-transform:
                uppercase;
            }

            .record-line {
              display: flex;
              gap: 5px;
              color: #344054;
              font-size: 10px;
              line-height: 1.45;
            }

            .record-label {
              flex-shrink: 0;
              font-weight: 500;
            }

            .record-value {
              font-weight: 650;
              overflow-wrap:
                anywhere;
            }

            .section {
              margin-top: 22px;
            }

            .section-heading {
              display: flex;
              align-items: center;
              gap: 10px;
              margin-bottom: 12px;
            }

            .section-number {
              display: flex;
              width: 25px;
              height: 25px;
              align-items: center;
              justify-content: center;
              border-radius: 7px;
              background:
                var(--primary);
              color: var(--white);
              font-size: 9px;
              font-weight: 700;
            }

            .section-title {
              margin: 0;
              color:
                var(--primary-dark);
              font-size: 14px;
              font-weight: 700;
            }

            .section-line {
              height: 1px;
              flex: 1;
              background:
                var(--border);
            }

            .table-container {
              overflow: hidden;
              border:
                1px solid
                var(--border);
              border-radius: 10px;
            }

            table {
              width: 100%;
              border-collapse:
                collapse;
              table-layout: fixed;
            }

            thead {
              background:
                var(--primary);
              color: var(--white);
            }

            th {
              padding: 10px 12px;
              font-size: 8px;
              font-weight: 700;
              letter-spacing: 0.09em;
              text-align: left;
              text-transform:
                uppercase;
            }

            td {
              padding: 11px 12px;
              border-bottom:
                1px solid
                var(--border);
              vertical-align: top;
              overflow-wrap:
                anywhere;
            }

            tbody tr:nth-child(even) {
              background:
                var(--surface);
            }

            tbody tr:last-child td {
              border-bottom: none;
            }

            .serial-column {
              width: 45px;
              color: var(--muted);
              text-align: center;
            }

            thead .serial-column {
              color: var(--white);
            }

            .amount-column {
              width: 120px;
              color:
                var(--primary-dark);
              font-weight: 700;
              text-align: right;
              white-space: nowrap;
            }

            .cell-primary {
              font-weight: 650;
            }

            .description-text {
              display: block;
              color: #475467;
              line-height: 1.65;
              white-space:
                pre-wrap;
              overflow-wrap:
                anywhere;
            }

            .empty-row {
              padding: 25px;
              color: var(--muted);
              text-align: center;
            }

            .document-footer {
              display: flex;
              align-items: center;
              justify-content:
                space-between;
              gap: 16px;
              margin: 0 38px;
              padding: 15px 0 20px;
              border-top:
                1px solid
                var(--border);
              color: var(--muted);
              font-size: 8px;
            }

            .footer-brand {
              color:
                var(--primary);
              font-weight: 700;
              letter-spacing:
                0.05em;
            }

            .confidential-badge {
              display:
                inline-flex;
              padding: 3px 8px;
              border:
                1px solid
                var(--border);
              border-radius:
                999px;
              font-size: 7px;
              font-weight: 700;
              letter-spacing:
                0.08em;
              text-transform:
                uppercase;
            }

            @page {
              size: A4;
              margin: 10mm;
            }

            @media print {
              body {
                padding: 0;
              }

              .document {
                max-width: none;
                border: none;
                box-shadow: none;
              }

              .document-header,
              .overview-card,
              .account-summary,
              .table-container,
              tr {
                break-inside:
                  avoid;
              }

              thead {
                display:
                  table-header-group;
              }
            }
          </style>
        </head>

        <body>
          <main class="document">
            <div class="top-accent">
            </div>

            <header
              class="document-header"
            >
              <div class="brand-area">
                <div class="brand-mark">
                  IE
                </div>

                <div>
                  <h1 class="brand-name">
                    IEDGE SYSTEM
                  </h1>

                  <p
                    class="brand-subtitle"
                  >
                    Financial Records Management
                  </p>
                </div>
              </div>

              <div
                class="document-heading"
              >
                <h2
                  class="document-type"
                >
                  Payment Record
                </h2>

                <div
                  class="reference-row"
                >
                  Reference:

                  <span
                    class="reference-value"
                  >
                    ${escapeHtml(
                      documentReference,
                    )}
                  </span>
                </div>
              </div>
            </header>

            <div class="document-body">
              <div
                class="overview-grid"
              >
                <div
                  class="overview-card"
                >
                  <div
                    class="overview-label"
                  >
                    Statement Title
                  </div>

                  <div
                    class="overview-value"
                  >
                    ${escapeHtml(
                      record.statementTitle ||
                        "-",
                    )}
                  </div>
                </div>

                <div
                  class="overview-card"
                >
                  <div
                    class="overview-label"
                  >
                    Record Date
                  </div>

                  <div
                    class="overview-value"
                  >
                    ${escapeHtml(
                      getRecordDate(
                        record,
                      ),
                    )}
                  </div>
                </div>

                <div
                  class="overview-card"
                >
                  <div
                    class="overview-label"
                  >
                    Created By
                  </div>

                  <div
                    class="overview-value"
                  >
                    ${escapeHtml(
                      record.createdByName ||
                        "Unknown User",
                    )}
                  </div>
                </div>

                <div
                  class="overview-card"
                >
                  <div
                    class="overview-label"
                  >
                    Status
                  </div>

                  <div
                    class="overview-value"
                  >
                    ${escapeHtml(
                      record.status ||
                        "-",
                    )}
                  </div>
                </div>
              </div>

              <section
                class="account-summary"
              >
                <div>
                  <div
                    class="compact-heading"
                  >
                    Account Details
                  </div>

                  <div
                    class="account-title"
                  >
                    ${escapeHtml(
                      record.accountTitle ||
                        "-",
                    )}
                  </div>

                  ${
                    accountProvider
                      ? `
                        <div class="account-line">
                          ${escapeHtml(
                            accountProvider,
                          )}
                        </div>
                      `
                      : ""
                  }

                  ${
                    record.accountNo
                      ? `
                        <div class="account-line">
                          Account No:
                          ${escapeHtml(
                            record.accountNo,
                          )}
                        </div>
                      `
                      : ""
                  }

                  ${
                    additionalAccountDetail
                      ? `
                        <div class="account-line">
                          ${escapeHtml(
                            additionalAccountDetail,
                          )}
                        </div>
                      `
                      : ""
                  }
                </div>

                <div
                  class="record-information"
                >
                  <div
                    class="record-title"
                  >
                    Payment Information
                  </div>

                  <div
                    class="record-line"
                  >
                    <span
                      class="record-label"
                    >
                      Account Type:
                    </span>

                    <span
                      class="record-value"
                    >
                      ${escapeHtml(
                        record.accountType?.toUpperCase() ||
                          "-",
                      )}
                    </span>
                  </div>

                  <div
                    class="record-line"
                  >
                    <span
                      class="record-label"
                    >
                      Cheque Number:
                    </span>

                    <span
                      class="record-value"
                    >
                      ${escapeHtml(
                        record.chequeNumber ||
                          "-",
                      )}
                    </span>
                  </div>

                  <div
                    class="record-line"
                  >
                    <span
                      class="record-label"
                    >
                      Cheque Amount:
                    </span>

                    <span
                      class="record-value"
                    >
                      ${escapeHtml(
                        formatAmount(
                          record.chequeAmount,
                        ),
                      )}
                    </span>
                  </div>

                  <div
                    class="record-line"
                  >
                    <span
                      class="record-label"
                    >
                      Item Total:
                    </span>

                    <span
                      class="record-value"
                    >
                      ${escapeHtml(
                        formatAmount(
                          record.totalItemAmount,
                        ),
                      )}
                    </span>
                  </div>

                  <div
                    class="record-line"
                  >
                    <span
                      class="record-label"
                    >
                      Remaining:
                    </span>

                    <span
                      class="record-value"
                    >
                      ${escapeHtml(
                        formatAmount(
                          record.remainingBalance,
                        ),
                      )}
                    </span>
                  </div>
                </div>
              </section>

              <section class="section">
                <div
                  class="section-heading"
                >
                  <span
                    class="section-number"
                  >
                    01
                  </span>

                  <h3
                    class="section-title"
                  >
                    Transaction Items
                  </h3>

                  <div
                    class="section-line"
                  ></div>
                </div>

                <div
                  class="table-container"
                >
                  <table>
                    <colgroup>
                      <col
                        style="width: 45px"
                      />

                      <col
                        style="width: 18%"
                      />

                      <col
                        style="width: 22%"
                      />

                      <col />

                      <col
                        style="width: 120px"
                      />
                    </colgroup>

                    <thead>
                      <tr>
                        <th
                          class="serial-column"
                        >
                          No.
                        </th>

                        <th>
                          Category
                        </th>

                        <th>
                          Name
                        </th>

                        <th>
                          Description
                        </th>

                        <th
                          style="text-align: right"
                        >
                          Amount
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      ${itemRows}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <footer
              class="document-footer"
            >
              <span
                class="footer-brand"
              >
                IEDGE SYSTEM · OFFICIAL PAYMENT RECORD
              </span>

              <span>
                Printed ${escapeHtml(
                  new Date().toLocaleString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  ),
                )}
              </span>

              <span
                class="confidential-badge"
              >
                Internal Document
              </span>
            </footer>
          </main>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(
      printDocument,
    );
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();

      window.setTimeout(() => {
        printWindow.print();
      }, 250);
    };

    return true;
}
