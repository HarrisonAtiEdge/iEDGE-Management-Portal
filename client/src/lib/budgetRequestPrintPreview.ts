// export type BudgetRequestPrintPreviewOptions = {
//     invoice: any;
//     createdByName?: string;
//     requestType?: "project" | "general";
//     statusLabel?: string;
//     vendorName?: string;
// };

// function safeNumber(value: any): number {
//     const parsed = Number(String(value ?? 0).replace(/,/g, ""));
//     return Number.isFinite(parsed) ? parsed : 0;
// }

// function formatMoney(value: any): string {
//     return safeNumber(value).toLocaleString("en-PK", {
//         minimumFractionDigits: 2,
//         maximumFractionDigits: 2,
//     });
// }

// function escapeHtml(value: any): string {
//     return String(value ?? "")
//         .replace(/&/g, "&amp;")
//         .replace(/</g, "&lt;")
//         .replace(/>/g, "&gt;")
//         .replace(/"/g, "&quot;")
//         .replace(/'/g, "&#039;");
// }

// function displayText(value: any, fallback = "-"): string {
//     const text = String(value ?? "").trim();
//     return escapeHtml(text || fallback);
// }

// function multilineText(value: any, fallback = "-"): string {
//     const text = String(value ?? "").trim();
//     return escapeHtml(text || fallback).replace(/\r?\n/g, "<br />");
// }

// function toDate(value: any): Date | null {
//     if (!value) return null;

//     if (value instanceof Date) {
//         return Number.isNaN(value.getTime()) ? null : value;
//     }

//     if (typeof value?.toDate === "function") {
//         const date = value.toDate();
//         return Number.isNaN(date?.getTime?.()) ? null : date;
//     }

//     if (typeof value?.seconds === "number") {
//         const date = new Date(value.seconds * 1000);
//         return Number.isNaN(date.getTime()) ? null : date;
//     }

//     const date = new Date(value);
//     return Number.isNaN(date.getTime()) ? null : date;
// }

// function formatDate(value: any, includeTime = false): string {
//     const date = toDate(value);
//     if (!date) return "-";

//     return date.toLocaleString("en-PK", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//         ...(includeTime
//             ? {
//                   hour: "2-digit" as const,
//                   minute: "2-digit" as const,
//               }
//             : {}),
//     });
// }

// function getFirstValue(values: any[], fallback: any = ""): any {
//     for (const value of values) {
//         if (value !== null && value !== undefined && String(value).trim()) {
//             return value;
//         }
//     }
//     return fallback;
// }

// function mergeRequestItems(invoice: any): any[] {
//     const items = Array.isArray(invoice?.items) ? invoice.items : [];
//     const lineItems = Array.isArray(invoice?.lineItems) ? invoice.lineItems : [];
//     const approvalItems = Array.isArray(invoice?.approvalItems)
//         ? invoice.approvalItems
//         : [];

//     const arrays = [items, lineItems, approvalItems].filter(
//         (source) => source.length > 0,
//     );

//     if (!arrays.length) return [];

//     const base = arrays.reduce((longest, current) =>
//         current.length > longest.length ? current : longest,
//     );

//     const findMatch = (source: any[], baseItem: any, index: number) => {
//         if (!source.length) return undefined;
//         if (baseItem?.id !== null && baseItem?.id !== undefined) {
//             const byId = source.find(
//                 (item: any) => String(item?.id) === String(baseItem.id),
//             );
//             if (byId) return byId;
//         }
//         return source[index];
//     };

//     return base.map((baseItem: any, index: number) => ({
//         ...(findMatch(approvalItems, baseItem, index) || {}),
//         ...(findMatch(lineItems, baseItem, index) || {}),
//         ...(findMatch(items, baseItem, index) || {}),
//     }));
// }

// function getPaymentAmount(entry: any): number {
//     return safeNumber(
//         entry?.amount ??
//             entry?.releaseAmount ??
//             entry?.releasedAmount ??
//             entry?.paymentAmount ??
//             0,
//     );
// }

// function getPaymentHistory(invoice: any): any[] {
//     const history = Array.isArray(invoice?.paymentReleaseHistory)
//         ? invoice.paymentReleaseHistory
//         : [];

//     if (history.length) {
//         return history.filter((entry: any) => getPaymentAmount(entry) > 0);
//     }

//     const legacy = invoice?.paymentDetails || invoice?.latestPaymentRelease;
//     if (!legacy || getPaymentAmount(legacy) <= 0) return [];

//     return [
//         {
//             ...legacy,
//             releasedAt:
//                 legacy?.releasedAt ||
//                 invoice?.paymentReleasedAt ||
//                 invoice?.releasePaymentAt ||
//                 invoice?.updatedAt,
//         },
//     ];
// }

// function formatPaymentMethod(value: any): string {
//     const method = String(value || "").toLowerCase().trim();
//     if (method === "bank_transfer") return "Bank Transfer";
//     if (method === "wire") return "Online Transfer";
//     if (method === "cash") return "Cash";
//     if (method === "cheque") return "Cheque";
//     if (!method) return "-";

//     return method
//         .replace(/_/g, " ")
//         .replace(/\b\w/g, (letter) => letter.toUpperCase());
// }

// function buildInfoRow(label: string, value: any): string {
//     return `
//         <div class="info-row">
//             <div class="info-label">${escapeHtml(label)}</div>
//             <div class="info-value">${displayText(value)}</div>
//         </div>
//     `;
// }

// export function openBudgetRequestPrintPreview({
//     invoice,
//     createdByName = "",
//     requestType = "general",
//     statusLabel = "",
//     vendorName = "",
// }: BudgetRequestPrintPreviewOptions): boolean {
//     const previewWindow = window.open(
//         "",
//         "_blank",
//         "width=1120,height=860",
//     );

//     if (!previewWindow) return false;

//     const items = mergeRequestItems(invoice);
//     const paymentHistory = getPaymentHistory(invoice);

//     const approvedAmount = safeNumber(
//         invoice?.approvedAmount ??
//             invoice?.totalApprovedAmount ??
//             invoice?.approvedTotal ??
//             invoice?.totalAmount ??
//             invoice?.amount,
//     );
//     const totalReleased = safeNumber(invoice?.totalReleasedAmount) ||
//         paymentHistory.reduce((sum, entry) => sum + getPaymentAmount(entry), 0);
//     const remainingAmount = Math.max(
//         safeNumber(invoice?.remainingReleaseAmount ?? approvedAmount - totalReleased),
//         0,
//     );

//     const requestTitle = getFirstValue([
//         invoice?.title,
//         invoice?.subject,
//         invoice?.projectName,
//         invoice?.project,
//         invoice?.clientName,
//         "Budget Request",
//     ]);
//     const requestDate = getFirstValue([
//         invoice?.submitDate,
//         invoice?.submittedAt,
//         invoice?.submissionDate,
//         invoice?.requestDate,
//         invoice?.createdAt,
//         invoice?.date,
//     ]);
//     const description = getFirstValue([
//         invoice?.description,
//         invoice?.requestDescription,
//         invoice?.requestDetails?.description,
//         invoice?.message,
//         invoice?.notes,
//         invoice?.remarks,
//         invoice?.purpose,
//     ]);

//     const itemRows = items.length
//         ? items
//               .map((item: any, index: number) => {
//                   const quantity = safeNumber(
//                       getFirstValue([item?.quantity, item?.qty, item?.approvedQuantity], 0),
//                   );
//                   const rate = safeNumber(
//                       getFirstValue([
//                           item?.rate,
//                           item?.unitPrice,
//                           item?.price,
//                           item?.approvedRate,
//                       ], 0),
//                   );
//                   const amount = safeNumber(
//                       getFirstValue([
//                           item?.approvedAmount,
//                           item?.totalAmount,
//                           item?.amount,
//                           item?.total,
//                           quantity * rate,
//                       ], 0),
//                   );
//                   const itemName = getFirstValue([
//                       item?.name,
//                       item?.itemName,
//                       item?.title,
//                       item?.productName,
//                       item?.serviceName,
//                       item?.service,
//                       `Item ${index + 1}`,
//                   ]);
//                   const itemDescription = getFirstValue([
//                       item?.description,
//                       item?.itemDescription,
//                       item?.details,
//                       item?.detail,
//                       item?.specification,
//                       item?.specifications,
//                       item?.notes,
//                       item?.remarks,
//                   ]);
//                   const itemVendor = getFirstValue([
//                       item?.vendorName,
//                       item?.vendor,
//                       item?.supplierName,
//                       item?.supplier,
//                       item?.original?.vendor,
//                       item?.original?.supplier,
//                       vendorName,
//                   ]);

//                   return `
//                     <tr>
//                         <td class="center">${index + 1}</td>
//                         <td>
//                             <div class="item-name">${displayText(itemName)}</div>
//                             ${
//                                 itemDescription
//                                     ? `<div class="item-description">${multilineText(
//                                           itemDescription,
//                                       )}</div>`
//                                     : ""
//                             }
//                         </td>
//                         <td>${displayText(itemVendor)}</td>
//                         <td class="center">${quantity ? displayText(quantity) : "-"}</td>
//                         <td class="center">${displayText(
//                             getFirstValue([item?.unit, item?.uom, item?.measurementUnit]),
//                         )}</td>
//                         <td class="money">${rate ? `Rs ${formatMoney(rate)}` : "-"}</td>
//                         <td class="money strong">Rs ${formatMoney(amount)}</td>
//                     </tr>
//                   `;
//               })
//               .join("")
//         : `<tr><td colspan="7" class="empty">No line items available.</td></tr>`;

//     const paymentRows = paymentHistory.length
//         ? paymentHistory
//               .map((entry: any, index: number) => {
//                   const reference = getFirstValue([
//                       entry?.transactionReference,
//                       entry?.referenceNumber,
//                       entry?.chequeNumber,
//                       entry?.chequeNo,
//                       entry?.checkNumber,
//                   ]);
//                   const purpose = getFirstValue([
//                       entry?.purpose,
//                       entry?.transactionName,
//                       entry?.title,
//                       entry?.description,
//                       entry?.notes,
//                       entry?.remarks,
//                   ]);

//                   return `
//                     <tr>
//                         <td class="center">${index + 1}</td>
//                         <td>${displayText(
//                             formatDate(
//                                 entry?.releasedAt ||
//                                     entry?.paymentDate ||
//                                     entry?.date ||
//                                     entry?.createdAt,
//                             ),
//                         )}</td>
//                         <td>${displayText(formatPaymentMethod(entry?.paymentMethod))}</td>
//                         <td>${displayText(reference)}</td>
//                         <td>${displayText(purpose)}</td>
//                         <td class="money strong">Rs ${formatMoney(getPaymentAmount(entry))}</td>
//                     </tr>
//                   `;
//               })
//               .join("")
//         : "";

//     const generatedAt = new Date().toLocaleString("en-PK", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//         hour: "2-digit",
//         minute: "2-digit",
//     });

//     const html = `<!doctype html>
// <html lang="en">
// <head>
//     <meta charset="utf-8" />
//     <meta name="viewport" content="width=device-width, initial-scale=1" />
//     <title>${displayText(invoice?.requestId || "Budget Request")} - Print Preview</title>
//     <style>
//         :root {
//             color-scheme: light;
//             font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
//             color: #172033;
//             background: #eef2f7;
//         }

//         * { box-sizing: border-box; }

//         body {
//             margin: 0;
//             background: #eef2f7;
//             color: #172033;
//             -webkit-print-color-adjust: exact;
//             print-color-adjust: exact;
//         }

//         .preview-toolbar {
//             position: sticky;
//             top: 0;
//             z-index: 20;
//             display: flex;
//             align-items: center;
//             justify-content: space-between;
//             gap: 16px;
//             padding: 14px 24px;
//             border-bottom: 1px solid #d8e0ea;
//             background: rgba(255, 255, 255, 0.96);
//             box-shadow: 0 6px 20px rgba(15, 23, 42, 0.08);
//             backdrop-filter: blur(10px);
//         }

//         .toolbar-copy strong { display: block; font-size: 14px; }
//         .toolbar-copy span { display: block; margin-top: 3px; color: #64748b; font-size: 12px; }
//         .toolbar-actions { display: flex; gap: 10px; }

//         .toolbar-button {
//             min-height: 40px;
//             padding: 0 17px;
//             border: 1px solid #cbd5e1;
//             border-radius: 10px;
//             background: #fff;
//             color: #1e293b;
//             font: inherit;
//             font-size: 13px;
//             font-weight: 700;
//             cursor: pointer;
//         }

//         .toolbar-button.primary {
//             border-color: #0f172a;
//             background: #0f172a;
//             color: #fff;
//         }

//         .page {
//             width: 210mm;
//             min-height: 297mm;
//             margin: 22px auto 40px;
//             padding: 15mm 14mm 13mm;
//             background: #fff;
//             box-shadow: 0 18px 55px rgba(15, 23, 42, 0.14);
//         }

//         .document-header {
//             display: flex;
//             align-items: flex-start;
//             justify-content: space-between;
//             gap: 24px;
//             padding-bottom: 18px;
//             border-bottom: 2px solid #0f172a;
//         }

//         .brand-mark {
//             display: inline-flex;
//             align-items: center;
//             justify-content: center;
//             width: 48px;
//             height: 48px;
//             margin-bottom: 11px;
//             border-radius: 13px;
//             background: #0f172a;
//             color: #fff;
//             font-size: 16px;
//             font-weight: 800;
//             letter-spacing: 0.05em;
//         }

//         .eyebrow {
//             margin: 0 0 5px;
//             color: #64748b;
//             font-size: 10px;
//             font-weight: 800;
//             letter-spacing: 0.14em;
//             text-transform: uppercase;
//         }

//         h1 {
//             margin: 0;
//             color: #0f172a;
//             font-size: 25px;
//             line-height: 1.15;
//             letter-spacing: -0.025em;
//         }

//         .document-subtitle {
//             max-width: 480px;
//             margin: 8px 0 0;
//             color: #64748b;
//             font-size: 11.5px;
//             line-height: 1.55;
//         }

//         .document-id { min-width: 185px; text-align: right; }
//         .document-id-label { color: #64748b; font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; }
//         .document-id-value { margin-top: 6px; color: #0f172a; font-size: 17px; font-weight: 800; }

//         .status-pill {
//             display: inline-flex;
//             margin-top: 10px;
//             padding: 6px 10px;
//             border: 1px solid #cbd5e1;
//             border-radius: 999px;
//             background: #f8fafc;
//             color: #334155;
//             font-size: 10px;
//             font-weight: 800;
//         }

//         .section { margin-top: 20px; break-inside: avoid; }
//         .section.allow-break { break-inside: auto; }

//         .section-title {
//             display: flex;
//             align-items: center;
//             gap: 9px;
//             margin: 0 0 10px;
//             color: #0f172a;
//             font-size: 12px;
//             font-weight: 800;
//             letter-spacing: 0.06em;
//             text-transform: uppercase;
//         }

//         .section-title::before {
//             width: 4px;
//             height: 15px;
//             border-radius: 4px;
//             background: #0f172a;
//             content: "";
//         }

//         .info-grid {
//             display: grid;
//             grid-template-columns: repeat(2, minmax(0, 1fr));
//             border: 1px solid #dbe3ed;
//             border-radius: 12px;
//             overflow: hidden;
//         }

//         .info-row {
//             display: grid;
//             grid-template-columns: 112px minmax(0, 1fr);
//             min-height: 43px;
//             border-bottom: 1px solid #e7edf4;
//         }

//         .info-row:nth-child(odd) { border-right: 1px solid #e7edf4; }
//         .info-row:nth-last-child(-n + 2) { border-bottom: 0; }
//         .info-label { padding: 11px 10px; background: #f8fafc; color: #64748b; font-size: 9.5px; font-weight: 800; text-transform: uppercase; }
//         .info-value { padding: 11px 12px; color: #1e293b; font-size: 11px; font-weight: 650; overflow-wrap: anywhere; }

//         .financial-grid {
//             display: grid;
//             grid-template-columns: repeat(3, minmax(0, 1fr));
//             gap: 10px;
//         }

//         .financial-card {
//             min-height: 78px;
//             padding: 14px;
//             border: 1px solid #dbe3ed;
//             border-radius: 12px;
//             background: #fff;
//         }

//         .financial-card.primary { background: #0f172a; color: #fff; }
//         .financial-label { color: #64748b; font-size: 9.5px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; }
//         .financial-card.primary .financial-label { color: #cbd5e1; }
//         .financial-value { margin-top: 8px; color: #0f172a; font-size: 17px; font-weight: 850; }
//         .financial-card.primary .financial-value { color: #fff; }

//         .content-box {
//             padding: 14px 15px;
//             border: 1px solid #dbe3ed;
//             border-radius: 12px;
//             color: #334155;
//             font-size: 11px;
//             line-height: 1.65;
//             overflow-wrap: anywhere;
//         }

//         .table-wrap {
//             overflow: hidden;
//             border: 1px solid #dbe3ed;
//             border-radius: 12px;
//         }

//         table { width: 100%; border-collapse: collapse; table-layout: fixed; }
//         thead { display: table-header-group; }
//         tr { break-inside: avoid; }
//         th {
//             padding: 9px 7px;
//             border-bottom: 1px solid #cfd8e4;
//             background: #f1f5f9;
//             color: #475569;
//             font-size: 8.5px;
//             font-weight: 850;
//             letter-spacing: 0.04em;
//             text-align: left;
//             text-transform: uppercase;
//         }
//         td {
//             padding: 10px 7px;
//             border-bottom: 1px solid #e7edf4;
//             color: #334155;
//             font-size: 9.5px;
//             line-height: 1.45;
//             vertical-align: top;
//             overflow-wrap: anywhere;
//         }
//         tbody tr:last-child td { border-bottom: 0; }
//         .center { text-align: center; }
//         .money { text-align: right; white-space: nowrap; }
//         .strong { color: #0f172a; font-weight: 800; }
//         .item-name { color: #0f172a; font-weight: 750; }
//         .item-description { margin-top: 4px; color: #64748b; font-size: 8.8px; line-height: 1.45; }
//         .empty { padding: 25px; color: #94a3b8; text-align: center; }

//         .items-table th:nth-child(1) { width: 5%; }
//         .items-table th:nth-child(2) { width: 31%; }
//         .items-table th:nth-child(3) { width: 16%; }
//         .items-table th:nth-child(4) { width: 8%; }
//         .items-table th:nth-child(5) { width: 8%; }
//         .items-table th:nth-child(6) { width: 15%; }
//         .items-table th:nth-child(7) { width: 17%; }

//         .payment-table th:nth-child(1) { width: 6%; }
//         .payment-table th:nth-child(2) { width: 15%; }
//         .payment-table th:nth-child(3) { width: 15%; }
//         .payment-table th:nth-child(4) { width: 18%; }
//         .payment-table th:nth-child(5) { width: 28%; }
//         .payment-table th:nth-child(6) { width: 18%; }

//         .document-footer {
//             display: flex;
//             justify-content: space-between;
//             gap: 20px;
//             margin-top: 24px;
//             padding-top: 12px;
//             border-top: 1px solid #dbe3ed;
//             color: #94a3b8;
//             font-size: 8.5px;
//         }

//         @page { size: A4 portrait; margin: 12mm; }

//         @media print {
//             body { background: #fff; }
//             .preview-toolbar { display: none !important; }
//             .page {
//                 width: auto;
//                 min-height: auto;
//                 margin: 0;
//                 padding: 0;
//                 box-shadow: none;
//             }
//             .section { break-inside: avoid; }
//             .section.allow-break { break-inside: auto; }
//         }

//         @media screen and (max-width: 900px) {
//             .page {
//                 width: calc(100% - 24px);
//                 min-height: 0;
//                 margin: 12px;
//                 padding: 24px;
//             }
//             .preview-toolbar { padding: 12px; }
//             .toolbar-copy span { display: none; }
//         }
//     </style>
// </head>
// <body>
//     <div class="preview-toolbar">
//         <div class="toolbar-copy">
//             <strong>Print Preview</strong>
//             <span>Review the portrait document below, then print or choose “Save as PDF” in the print dialog.</span>
//         </div>
//         <div class="toolbar-actions">
//             <button class="toolbar-button" type="button" onclick="window.close()">Close</button>
//             <button class="toolbar-button primary" type="button" onclick="window.print()">Print / Save PDF</button>
//         </div>
//     </div>

//     <main class="page">
//         <header class="document-header">
//             <div>
//                 <div class="brand-mark">IE</div>
//                 <p class="eyebrow">IEDGE Financial Management System</p>
//                 <h1>Budget Request</h1>
//                 <p class="document-subtitle">A structured summary of the request, approved value, line items, and recorded payment releases.</p>
//             </div>
//             <div class="document-id">
//                 <div class="document-id-label">Request ID</div>
//                 <div class="document-id-value">${displayText(invoice?.requestId)}</div>
//                 <div class="status-pill">${displayText(statusLabel || invoice?.status)}</div>
//             </div>
//         </header>

//         <section class="section">
//             <h2 class="section-title">Request Information</h2>
//             <div class="info-grid">
//                 ${buildInfoRow("Request Type", requestType === "project" ? "Project" : "General")}
//                 ${buildInfoRow("Submit Date", formatDate(requestDate))}
//                 ${buildInfoRow("Client / Title", getFirstValue([invoice?.clientName, requestTitle]))}
//                 ${buildInfoRow("Project", getFirstValue([invoice?.projectName, invoice?.project]))}
//                 ${buildInfoRow("Project Code", invoice?.projectCode)}
//                 ${buildInfoRow("Created By", createdByName)}
//                 ${buildInfoRow("Vendor", getFirstValue([vendorName, invoice?.vendorName, invoice?.supplierName]))}
//                 ${buildInfoRow("Current Approver", invoice?.currentApprover)}
//             </div>
//         </section>

//         <section class="section">
//             <h2 class="section-title">Financial Overview</h2>
//             <div class="financial-grid">
//                 <div class="financial-card primary">
//                     <div class="financial-label">Approved Amount</div>
//                     <div class="financial-value">Rs ${formatMoney(approvedAmount)}</div>
//                 </div>
//                 <div class="financial-card">
//                     <div class="financial-label">Released Amount</div>
//                     <div class="financial-value">Rs ${formatMoney(totalReleased)}</div>
//                 </div>
//                 <div class="financial-card">
//                     <div class="financial-label">Remaining Balance</div>
//                     <div class="financial-value">Rs ${formatMoney(remainingAmount)}</div>
//                 </div>
//             </div>
//         </section>

//         ${
//             description
//                 ? `<section class="section">
//                     <h2 class="section-title">Description / Purpose</h2>
//                     <div class="content-box">${multilineText(description)}</div>
//                 </section>`
//                 : ""
//         }

//         <section class="section allow-break">
//             <h2 class="section-title">Request Items</h2>
//             <div class="table-wrap">
//                 <table class="items-table">
//                     <thead>
//                         <tr>
//                             <th>#</th>
//                             <th>Item / Description</th>
//                             <th>Vendor</th>
//                             <th>Qty</th>
//                             <th>Unit</th>
//                             <th class="money">Rate</th>
//                             <th class="money">Amount</th>
//                         </tr>
//                     </thead>
//                     <tbody>${itemRows}</tbody>
//                 </table>
//             </div>
//         </section>

//         ${
//             paymentRows
//                 ? `<section class="section allow-break">
//                     <h2 class="section-title">Payment Release History</h2>
//                     <div class="table-wrap">
//                         <table class="payment-table">
//                             <thead>
//                                 <tr>
//                                     <th>#</th>
//                                     <th>Date</th>
//                                     <th>Method</th>
//                                     <th>Reference</th>
//                                     <th>Purpose</th>
//                                     <th class="money">Amount</th>
//                                 </tr>
//                             </thead>
//                             <tbody>${paymentRows}</tbody>
//                         </table>
//                     </div>
//                 </section>`
//                 : ""
//         }

//         <footer class="document-footer">
//             <span>Generated from IEDGE Financial Management System</span>
//             <span>Preview generated: ${escapeHtml(generatedAt)}</span>
//         </footer>
//     </main>
// </body>
// </html>`;

//     previewWindow.document.open();
//     previewWindow.document.write(html);
//     previewWindow.document.close();
//     previewWindow.focus();

//     return true;
// }

export type BudgetRequestPrintPreviewOptions = {
    invoice: any;
    createdByName?: string;
    requestType?: "project" | "general" | "asset";
    statusLabel?: string;
    vendorName?: string;
};

function safeNumber(value: any): number {
    const parsed = Number(String(value ?? 0).replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: any): string {
    return safeNumber(value).toLocaleString("en-PK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function escapeHtml(value: any): string {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function displayText(value: any, fallback = "-"): string {
    const text = String(value ?? "").trim();
    return escapeHtml(text || fallback);
}

function multilineText(value: any, fallback = "-"): string {
    const text = String(value ?? "").trim();
    return escapeHtml(text || fallback).replace(/\r?\n/g, "<br />");
}

function toDate(value: any): Date | null {
    if (!value) return null;

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value?.toDate === "function") {
        const date = value.toDate();
        return Number.isNaN(date?.getTime?.()) ? null : date;
    }

    if (typeof value?.seconds === "number") {
        const date = new Date(value.seconds * 1000);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: any, includeTime = false): string {
    const date = toDate(value);
    if (!date) return "-";

    return date.toLocaleString("en-PK", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        ...(includeTime
            ? {
                  hour: "2-digit" as const,
                  minute: "2-digit" as const,
              }
            : {}),
    });
}

function getFirstValue(values: any[], fallback: any = ""): any {
    for (const value of values) {
        if (value !== null && value !== undefined && String(value).trim()) {
            return value;
        }
    }
    return fallback;
}

function mergeRequestItems(invoice: any): any[] {
    const items = Array.isArray(invoice?.items) ? invoice.items : [];
    const lineItems = Array.isArray(invoice?.lineItems)
        ? invoice.lineItems
        : [];
    const approvalItems = Array.isArray(invoice?.approvalItems)
        ? invoice.approvalItems
        : [];

    const arrays = [items, lineItems, approvalItems].filter(
        (source) => source.length > 0,
    );

    if (!arrays.length) return [];

    const base = arrays.reduce((longest, current) =>
        current.length > longest.length ? current : longest,
    );

    const findMatch = (source: any[], baseItem: any, index: number) => {
        if (!source.length) return undefined;
        if (baseItem?.id !== null && baseItem?.id !== undefined) {
            const byId = source.find(
                (item: any) => String(item?.id) === String(baseItem.id),
            );
            if (byId) return byId;
        }
        return source[index];
    };

    return base.map((baseItem: any, index: number) => ({
        ...(findMatch(approvalItems, baseItem, index) || {}),
        ...(findMatch(lineItems, baseItem, index) || {}),
        ...(findMatch(items, baseItem, index) || {}),
    }));
}

function getPaymentAmount(entry: any): number {
    return safeNumber(
        entry?.amount ??
            entry?.releaseAmount ??
            entry?.releasedAmount ??
            entry?.paymentAmount ??
            0,
    );
}

function getPaymentHistory(invoice: any): any[] {
    const history = Array.isArray(invoice?.paymentReleaseHistory)
        ? invoice.paymentReleaseHistory
        : [];

    if (history.length) {
        return history.filter((entry: any) => getPaymentAmount(entry) > 0);
    }

    const legacy = invoice?.paymentDetails || invoice?.latestPaymentRelease;
    if (!legacy || getPaymentAmount(legacy) <= 0) return [];

    return [
        {
            ...legacy,
            releasedAt:
                legacy?.releasedAt ||
                invoice?.paymentReleasedAt ||
                invoice?.releasePaymentAt ||
                invoice?.updatedAt,
        },
    ];
}

function formatPaymentMethod(value: any): string {
    const method = String(value || "")
        .toLowerCase()
        .trim();
    if (method === "bank_transfer") return "Bank Transfer";
    if (method === "wire") return "Online Transfer";
    if (method === "cash") return "Cash";
    if (method === "cheque") return "Cheque";
    if (!method) return "-";

    return method
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildInfoRow(label: string, value: any): string {
    return `
        <div class="info-row">
            <div class="info-label">${escapeHtml(label)}</div>
            <div class="info-value">${displayText(value)}</div>
        </div>
    `;
}

export function openBudgetRequestPrintPreview({
    invoice,
    createdByName = "",
    requestType = "general",
    statusLabel = "",
    vendorName = "",
}: BudgetRequestPrintPreviewOptions): boolean {
    const previewWindow = window.open("", "_blank", "width=1120,height=860");

    if (!previewWindow) return false;

    const items = mergeRequestItems(invoice);
    const paymentHistory = getPaymentHistory(invoice);

    const approvedAmount = safeNumber(
        invoice?.approvedAmount ??
            invoice?.totalApprovedAmount ??
            invoice?.approvedTotal ??
            invoice?.totalAmount ??
            invoice?.amount,
    );
    const totalReleased =
        safeNumber(invoice?.totalReleasedAmount) ||
        paymentHistory.reduce((sum, entry) => sum + getPaymentAmount(entry), 0);
    const remainingAmount = Math.max(
        safeNumber(
            invoice?.remainingReleaseAmount ?? approvedAmount - totalReleased,
        ),
        0,
    );

    const requestTitle = getFirstValue([
        invoice?.title,
        invoice?.subject,
        invoice?.projectName,
        invoice?.project,
        invoice?.clientName,
        "Budget Request",
    ]);
    const requestDate = getFirstValue([
        invoice?.submitDate,
        invoice?.submittedAt,
        invoice?.submissionDate,
        invoice?.requestDate,
        invoice?.createdAt,
        invoice?.date,
    ]);
    const description = getFirstValue([
        invoice?.description,
        invoice?.requestDescription,
        invoice?.requestDetails?.description,
        invoice?.message,
        invoice?.notes,
        invoice?.remarks,
        invoice?.purpose,
    ]);

    const itemRows = items.length
        ? items
              .map((item: any, index: number) => {
                  const quantity = safeNumber(
                      getFirstValue(
                          [item?.quantity, item?.qty, item?.approvedQuantity],
                          0,
                      ),
                  );
                  const rate = safeNumber(
                      getFirstValue(
                          [
                              item?.rate,
                              item?.unitPrice,
                              item?.price,
                              item?.approvedRate,
                          ],
                          0,
                      ),
                  );
                  const amount = safeNumber(
                      getFirstValue(
                          [
                              item?.approvedAmount,
                              item?.totalAmount,
                              item?.amount,
                              item?.total,
                              quantity * rate,
                          ],
                          0,
                      ),
                  );
                  const itemName = getFirstValue([
                      item?.name,
                      item?.itemName,
                      item?.title,
                      item?.productName,
                      item?.serviceName,
                      item?.service,
                      `Item ${index + 1}`,
                  ]);
                  const itemDescription = getFirstValue([
                      item?.description,
                      item?.itemDescription,
                      item?.details,
                      item?.detail,
                      item?.specification,
                      item?.specifications,
                      item?.notes,
                      item?.remarks,
                  ]);
                  const itemVendor = getFirstValue([
                      item?.vendorName,
                      item?.vendor,
                      item?.supplierName,
                      item?.supplier,
                      item?.original?.vendor,
                      item?.original?.supplier,
                      vendorName,
                  ]);

                  return `
                    <tr>
                        <td class="center">${index + 1}</td>
                        <td>
                            <div class="item-name">${displayText(itemName)}</div>
                            ${
                                itemDescription
                                    ? `<div class="item-description">${multilineText(
                                          itemDescription,
                                      )}</div>`
                                    : ""
                            }
                        </td>
                        <td>${displayText(itemVendor)}</td>
                        <td class="center">${quantity ? displayText(quantity) : "-"}</td>
                        <td class="center">${displayText(
                            getFirstValue([
                                item?.unit,
                                item?.uom,
                                item?.measurementUnit,
                            ]),
                        )}</td>
                        <td class="money">${rate ? `Rs ${formatMoney(rate)}` : "-"}</td>
                        <td class="money strong">Rs ${formatMoney(amount)}</td>
                    </tr>
                  `;
              })
              .join("")
        : `<tr><td colspan="7" class="empty">No line items available.</td></tr>`;

    const paymentRows = paymentHistory.length
        ? paymentHistory
              .map((entry: any, index: number) => {
                  const reference = getFirstValue([
                      entry?.transactionReference,
                      entry?.referenceNumber,
                      entry?.chequeNumber,
                      entry?.chequeNo,
                      entry?.checkNumber,
                  ]);
                  const purpose = getFirstValue([
                      entry?.purpose,
                      entry?.transactionName,
                      entry?.title,
                      entry?.description,
                      entry?.notes,
                      entry?.remarks,
                  ]);

                  return `
                    <tr>
                        <td class="center">${index + 1}</td>
                        <td>${displayText(
                            formatDate(
                                entry?.releasedAt ||
                                    entry?.paymentDate ||
                                    entry?.date ||
                                    entry?.createdAt,
                            ),
                        )}</td>
                        <td>${displayText(formatPaymentMethod(entry?.paymentMethod))}</td>
                        <td>${displayText(reference)}</td>
                        <td>${displayText(purpose)}</td>
                        <td class="money strong">Rs ${formatMoney(getPaymentAmount(entry))}</td>
                    </tr>
                  `;
              })
              .join("")
        : "";

    const generatedAt = new Date().toLocaleString("en-PK", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    const html = `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${displayText(invoice?.requestId || "Budget Request")} - Print Preview</title>
    <style>
        :root {
            color-scheme: light;
            font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
            color: #172033;
            background: #eef2f7;
        }

        * { box-sizing: border-box; }

        body {
            margin: 0;
            background: #eef2f7;
            color: #172033;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .preview-toolbar {
            position: sticky;
            top: 0;
            z-index: 20;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 14px 24px;
            border-bottom: 1px solid #d8e0ea;
            background: rgba(255, 255, 255, 0.96);
            box-shadow: 0 6px 20px rgba(15, 23, 42, 0.08);
            backdrop-filter: blur(10px);
        }

        .toolbar-copy strong { display: block; font-size: 14px; }
        .toolbar-copy span { display: block; margin-top: 3px; color: #64748b; font-size: 12px; }
        .toolbar-actions { display: flex; gap: 10px; }

        .toolbar-button {
            min-height: 40px;
            padding: 0 17px;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            background: #fff;
            color: #1e293b;
            font: inherit;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
        }

        .toolbar-button.primary {
            border-color: #0f172a;
            background: #0f172a;
            color: #fff;
        }

        .page {
            width: 210mm;
            min-height: 297mm;
            margin: 22px auto 40px;
            padding: 15mm 14mm 13mm;
            background: #fff;
            box-shadow: 0 18px 55px rgba(15, 23, 42, 0.14);
        }

        .document-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 24px;
            padding-bottom: 18px;
            border-bottom: 2px solid #0f172a;
        }

        .brand-mark {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            margin-bottom: 11px;
            border-radius: 13px;
            background: #0f172a;
            color: #fff;
            font-size: 16px;
            font-weight: 800;
            letter-spacing: 0.05em;
        }

        .eyebrow {
            margin: 0 0 5px;
            color: #64748b;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.14em;
            text-transform: uppercase;
        }

        h1 {
            margin: 0;
            color: #0f172a;
            font-size: 25px;
            line-height: 1.15;
            letter-spacing: -0.025em;
        }

        .document-subtitle {
            max-width: 480px;
            margin: 8px 0 0;
            color: #64748b;
            font-size: 11.5px;
            line-height: 1.55;
        }

        .document-id { min-width: 185px; text-align: right; }
        .document-id-label { color: #64748b; font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; }
        .document-id-value { margin-top: 6px; color: #0f172a; font-size: 17px; font-weight: 800; }

        .status-pill {
            display: inline-flex;
            margin-top: 10px;
            padding: 6px 10px;
            border: 1px solid #cbd5e1;
            border-radius: 999px;
            background: #f8fafc;
            color: #334155;
            font-size: 10px;
            font-weight: 800;
        }

        .section { margin-top: 20px; break-inside: avoid; }
        .section.allow-break { break-inside: auto; }

        .section-title {
            display: flex;
            align-items: center;
            gap: 9px;
            margin: 0 0 10px;
            color: #0f172a;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.06em;
            text-transform: uppercase;
        }

        .section-title::before {
            width: 4px;
            height: 15px;
            border-radius: 4px;
            background: #0f172a;
            content: "";
        }

        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            border: 1px solid #dbe3ed;
            border-radius: 12px;
            overflow: hidden;
        }

        .info-row {
            display: grid;
            grid-template-columns: 112px minmax(0, 1fr);
            min-height: 43px;
            border-bottom: 1px solid #e7edf4;
        }

        .info-row:nth-child(odd) { border-right: 1px solid #e7edf4; }
        .info-row:nth-last-child(-n + 2) { border-bottom: 0; }
        .info-label { padding: 11px 10px; background: #f8fafc; color: #64748b; font-size: 9.5px; font-weight: 800; text-transform: uppercase; }
        .info-value { padding: 11px 12px; color: #1e293b; font-size: 11px; font-weight: 650; overflow-wrap: anywhere; }

        .financial-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
        }

        .financial-card {
            min-height: 78px;
            padding: 14px;
            border: 1px solid #dbe3ed;
            border-radius: 12px;
            background: #fff;
        }

        .financial-card.primary { background: #0f172a; color: #fff; }
        .financial-label { color: #64748b; font-size: 9.5px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; }
        .financial-card.primary .financial-label { color: #cbd5e1; }
        .financial-value { margin-top: 8px; color: #0f172a; font-size: 17px; font-weight: 850; }
        .financial-card.primary .financial-value { color: #fff; }

        .content-box {
            padding: 14px 15px;
            border: 1px solid #dbe3ed;
            border-radius: 12px;
            color: #334155;
            font-size: 11px;
            line-height: 1.65;
            overflow-wrap: anywhere;
        }

        .table-wrap {
            overflow: hidden;
            border: 1px solid #dbe3ed;
            border-radius: 12px;
        }

        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        thead { display: table-header-group; }
        tr { break-inside: avoid; }
        th {
            padding: 9px 7px;
            border-bottom: 1px solid #cfd8e4;
            background: #f1f5f9;
            color: #475569;
            font-size: 8.5px;
            font-weight: 850;
            letter-spacing: 0.04em;
            text-align: left;
            text-transform: uppercase;
        }
        td {
            padding: 10px 7px;
            border-bottom: 1px solid #e7edf4;
            color: #334155;
            font-size: 9.5px;
            line-height: 1.45;
            vertical-align: top;
            overflow-wrap: anywhere;
        }
        tbody tr:last-child td { border-bottom: 0; }
        .center { text-align: center; }
        .money { text-align: right; white-space: nowrap; }
        .strong { color: #0f172a; font-weight: 800; }
        .item-name { color: #0f172a; font-weight: 750; }
        .item-description { margin-top: 4px; color: #64748b; font-size: 8.8px; line-height: 1.45; }
        .empty { padding: 25px; color: #94a3b8; text-align: center; }

        .items-table th:nth-child(1) { width: 5%; }
        .items-table th:nth-child(2) { width: 31%; }
        .items-table th:nth-child(3) { width: 16%; }
        .items-table th:nth-child(4) { width: 8%; }
        .items-table th:nth-child(5) { width: 8%; }
        .items-table th:nth-child(6) { width: 15%; }
        .items-table th:nth-child(7) { width: 17%; }

        .payment-table th:nth-child(1) { width: 6%; }
        .payment-table th:nth-child(2) { width: 15%; }
        .payment-table th:nth-child(3) { width: 15%; }
        .payment-table th:nth-child(4) { width: 18%; }
        .payment-table th:nth-child(5) { width: 28%; }
        .payment-table th:nth-child(6) { width: 18%; }

        .document-footer {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            margin-top: 24px;
            padding-top: 12px;
            border-top: 1px solid #dbe3ed;
            color: #94a3b8;
            font-size: 8.5px;
        }

        @page { size: A4 portrait; margin: 12mm; }

        @media print {
            body { background: #fff; }
            .preview-toolbar { display: none !important; }
            .page {
                width: auto;
                min-height: auto;
                margin: 0;
                padding: 0;
                box-shadow: none;
            }
            .section { break-inside: avoid; }
            .section.allow-break { break-inside: auto; }
        }

        @media screen and (max-width: 900px) {
            .page {
                width: calc(100% - 24px);
                min-height: 0;
                margin: 12px;
                padding: 24px;
            }
            .preview-toolbar { padding: 12px; }
            .toolbar-copy span { display: none; }
        }
    </style>
</head>
<body>
    <div class="preview-toolbar">
        <div class="toolbar-copy">
            <strong>Print Preview</strong>
            <span>Review the portrait document below, then print or choose “Save as PDF” in the print dialog.</span>
        </div>
        <div class="toolbar-actions">
            <button class="toolbar-button" type="button" onclick="window.close()">Close</button>
            <button class="toolbar-button primary" type="button" onclick="window.print()">Print / Save PDF</button>
        </div>
    </div>

    <main class="page">
        <header class="document-header">
            <div>
                <div class="brand-mark">IE</div>
                <p class="eyebrow">IEDGE Financial Management System</p>
                <h1>Budget Request</h1>
                <p class="document-subtitle">A structured summary of the request, approved value, line items, and recorded payment releases.</p>
            </div>
            <div class="document-id">
                <div class="document-id-label">Request ID</div>
                <div class="document-id-value">${displayText(invoice?.requestId)}</div>
                <div class="status-pill">${displayText(statusLabel || invoice?.status)}</div>
            </div>
        </header>

        <section class="section">
            <h2 class="section-title">Request Information</h2>
            <div class="info-grid">
                ${buildInfoRow(
                    "Request Type",
                    requestType === "project"
                        ? "Project"
                        : requestType === "asset"
                          ? "Asset"
                          : "General",
                )}
                ${buildInfoRow("Submit Date", formatDate(requestDate))}
                ${buildInfoRow("Client / Title", getFirstValue([invoice?.clientName, requestTitle]))}
                ${buildInfoRow("Project", getFirstValue([invoice?.projectName, invoice?.project]))}
                ${buildInfoRow("Project Code", invoice?.projectCode)}
                ${buildInfoRow("Created By", createdByName)}
                ${buildInfoRow("Vendor", getFirstValue([vendorName, invoice?.vendorName, invoice?.supplierName]))}
                ${buildInfoRow("Current Approver", invoice?.currentApprover)}
            </div>
        </section>

        <section class="section">
            <h2 class="section-title">Financial Overview</h2>
            <div class="financial-grid">
                <div class="financial-card primary">
                    <div class="financial-label">Approved Amount</div>
                    <div class="financial-value">Rs ${formatMoney(approvedAmount)}</div>
                </div>
                <div class="financial-card">
                    <div class="financial-label">Released Amount</div>
                    <div class="financial-value">Rs ${formatMoney(totalReleased)}</div>
                </div>
                <div class="financial-card">
                    <div class="financial-label">Remaining Balance</div>
                    <div class="financial-value">Rs ${formatMoney(remainingAmount)}</div>
                </div>
            </div>
        </section>

        ${
            description
                ? `<section class="section">
                    <h2 class="section-title">Description / Purpose</h2>
                    <div class="content-box">${multilineText(description)}</div>
                </section>`
                : ""
        }

        <section class="section allow-break">
            <h2 class="section-title">Request Items</h2>
            <div class="table-wrap">
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Item / Description</th>
                            <th>Vendor</th>
                            <th>Qty</th>
                            <th>Unit</th>
                            <th class="money">Rate</th>
                            <th class="money">Amount</th>
                        </tr>
                    </thead>
                    <tbody>${itemRows}</tbody>
                </table>
            </div>
        </section>

        ${
            paymentRows
                ? `<section class="section allow-break">
                    <h2 class="section-title">Payment Release History</h2>
                    <div class="table-wrap">
                        <table class="payment-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Date</th>
                                    <th>Method</th>
                                    <th>Reference</th>
                                    <th>Purpose</th>
                                    <th class="money">Amount</th>
                                </tr>
                            </thead>
                            <tbody>${paymentRows}</tbody>
                        </table>
                    </div>
                </section>`
                : ""
        }

        <footer class="document-footer">
            <span>Generated from IEDGE Financial Management System</span>
            <span>Preview generated: ${escapeHtml(generatedAt)}</span>
        </footer>
    </main>
</body>
</html>`;

    previewWindow.document.open();
    previewWindow.document.write(html);
    previewWindow.document.close();
    previewWindow.focus();

    return true;
}
