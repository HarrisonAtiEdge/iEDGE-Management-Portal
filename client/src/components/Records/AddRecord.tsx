// import { FormEvent, useEffect, useMemo, useState } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import {
//   addDoc,
//   collection,
//   getDocs,
//   serverTimestamp,
//   Timestamp,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { useToast } from "@/hooks/use-toast";
// import { useLocation } from "wouter";

// type AccountType = "cheque" | "online";

// type FirestoreAccountData = {
//   accountTitle?: string;
//   accountNo?: string;
//   bank?: string;
//   branch?: string;
//   city?: string;
//   platform?: string;
//   routingNumber?: string;
//   isActive?: boolean;
//   createdBy?: string;
// };

// type AccountOption = {
//   id: string;
//   key: string;
//   type: AccountType;
//   accountTitle: string;
//   accountNo: string;
//   bank: string;
//   branch?: string;
//   city?: string;
//   platform?: string;
//   routingNumber?: string;
// };

// type RawAccountOption = AccountOption & {
//   isActive?: boolean;
// };

// type RecordItem = {
//   category: string;
//   amount: string;
//   name: string;
//   description: string;
// };

// type ItemField = keyof RecordItem;

// type PrintableRecordItem = {
//   category: string;
//   amount: number;
//   name: string;
//   description: string;
// };

// type PrintableRecordData = {
//   recordId?: string;
//   selectedDate: string;
//   accountType: AccountType;
//   accountTitle: string;
//   accountNo: string;
//   bank: string;
//   branch?: string;
//   city?: string;
//   platform?: string;
//   routingNumber?: string;
//   chequeNumber: string;
//   statementTitle: string;
//   chequeAmount: number;
//   totalItemAmount: number;
//   remainingBalance: number;
//   createdByName: string;
//   items: PrintableRecordItem[];
// };

// const escapeHtml = (value: unknown): string => {
//   return String(value ?? "")
//     .replace(/&/g, "&amp;")
//     .replace(/</g, "&lt;")
//     .replace(/>/g, "&gt;")
//     .replace(/\"/g, "&quot;")
//     .replace(/'/g, "&#039;");
// };

// const formatPrintAmount = (value: number): string => {
//   return value.toLocaleString("en-US", {
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 2,
//   });
// };

// const normalizeDescriptionLineBreaks = (value: string): string => {
//   return value.replace(/\r\n?/g, "\n");
// };

// const printRecord = (record: PrintableRecordData): boolean => {
//   const printWindow = window.open(
//     "",
//     "_blank",
//     "width=1100,height=850,scrollbars=yes,resizable=yes",
//   );

//   if (!printWindow) return false;

//   const formatRecordDate = (value: string): string => {
//     if (!value) return "-";

//     try {
//       const date = new Date(`${value}T00:00:00`);

//       if (Number.isNaN(date.getTime())) return value;

//       return date.toLocaleDateString("en-US", {
//         year: "numeric",
//         month: "short",
//         day: "2-digit",
//       });
//     } catch {
//       return value;
//     }
//   };

//   const documentReference =
//     record.chequeNumber?.trim() ||
//     record.recordId?.slice(0, 10).toUpperCase() ||
//     "DRAFT";

//   const accountLocation = [record.branch, record.city]
//     .filter(Boolean)
//     .join(", ");

//   const accountProvider =
//     record.accountType === "online"
//       ? record.platform || record.bank
//       : record.bank;

//   const additionalAccountDetail =
//     record.accountType === "online"
//       ? record.routingNumber
//         ? `Routing No: ${record.routingNumber}`
//         : ""
//       : accountLocation;

//   const itemRows =
//     record.items.length > 0
//       ? record.items
//           .map(
//             (item, index) => `
//               <tr>
//                 <td class="serial-column">${index + 1}</td>
//                 <td><span class="cell-primary">${escapeHtml(item.category || "-")}</span></td>
//                 <td><span class="cell-primary">${escapeHtml(item.name || "-")}</span></td>
//                 <td><div class="description-text">${escapeHtml(item.description || "-")}</div></td>
//                 <td class="amount-column">${escapeHtml(formatPrintAmount(item.amount))}</td>
//               </tr>
//             `,
//           )
//           .join("")
//       : `
//           <tr>
//             <td colspan="5" class="empty-row">
//               No transaction items are available for this document.
//             </td>
//           </tr>
//         `;

//   const printDocument = `
//     <!DOCTYPE html>
//     <html lang="en">
//       <head>
//         <meta charset="UTF-8" />
//         <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//         <title>Payment Record ${escapeHtml(documentReference)}</title>

//         <style>
//           :root {
//             --primary: #17375e;
//             --primary-dark: #102a49;
//             --accent: #d4a64a;
//             --text: #172033;
//             --muted: #667085;
//             --border: #d9e0e8;
//             --surface: #f6f8fb;
//             --white: #ffffff;
//           }

//           * { box-sizing: border-box; }

//           html,
//           body {
//             margin: 0;
//             padding: 0;
//             background: var(--white);
//             color: var(--text);
//             font-family: Inter, "Segoe UI", Arial, Helvetica, sans-serif;
//             font-size: 12px;
//             line-height: 1.5;
//             -webkit-print-color-adjust: exact;
//             print-color-adjust: exact;
//           }

//           body { padding: 24px; }

//           .document {
//             width: 100%;
//             max-width: 1000px;
//             margin: 0 auto;
//             overflow: hidden;
//             border: 1px solid var(--border);
//             background: var(--white);
//             box-shadow: 0 16px 45px rgba(16, 42, 73, 0.1);
//           }

//           .top-accent {
//             height: 6px;
//             background: linear-gradient(90deg, var(--primary) 0%, var(--primary) 76%, var(--accent) 76%, var(--accent) 100%);
//           }

//           .document-header {
//             display: flex;
//             align-items: center;
//             justify-content: space-between;
//             gap: 24px;
//             padding: 25px 38px;
//             background: linear-gradient(135deg, var(--primary), var(--primary-dark));
//             color: var(--white);
//           }

//           .brand-area { display: flex; align-items: center; gap: 13px; }
//           .brand-mark {
//             display: flex;
//             width: 48px;
//             height: 48px;
//             align-items: center;
//             justify-content: center;
//             border: 1px solid rgba(255, 255, 255, 0.32);
//             border-radius: 12px;
//             background: rgba(255, 255, 255, 0.1);
//             font-size: 18px;
//             font-weight: 800;
//           }

//           .brand-name { margin: 0; font-size: 20px; font-weight: 700; }
//           .brand-subtitle {
//             margin: 2px 0 0;
//             color: rgba(255, 255, 255, 0.72);
//             font-size: 8px;
//             font-weight: 600;
//             letter-spacing: 0.14em;
//             text-transform: uppercase;
//           }

//           .document-heading { text-align: right; }
//           .document-type { margin: 0; font-size: 20px; font-weight: 700; }
//           .reference-row { margin-top: 4px; color: rgba(255, 255, 255, 0.78); font-size: 9px; }
//           .reference-value { margin-left: 4px; color: var(--white); font-weight: 700; }

//           .document-body { padding: 25px 38px 34px; }

//           .overview-grid {
//             display: grid;
//             grid-template-columns: repeat(2, minmax(0, 1fr));
//             gap: 12px;
//             margin-bottom: 22px;
//           }

//           .overview-card {
//             padding: 14px 16px;
//             border: 1px solid var(--border);
//             border-radius: 10px;
//             background: var(--surface);
//           }

//           .overview-label {
//             margin-bottom: 4px;
//             color: var(--muted);
//             font-size: 8px;
//             font-weight: 700;
//             letter-spacing: 0.08em;
//             text-transform: uppercase;
//           }

//           .overview-value {
//             color: var(--text);
//             font-size: 11px;
//             font-weight: 700;
//             overflow-wrap: anywhere;
//           }

//           .account-summary {
//             display: grid;
//             grid-template-columns: minmax(0, 1fr) 310px;
//             gap: 50px;
//             margin-bottom: 23px;
//             padding: 0 2px 19px;
//             border-bottom: 1px solid var(--border);
//           }

//           .compact-heading {
//             margin-bottom: 3px;
//             color: var(--primary-dark);
//             font-size: 9px;
//             font-weight: 800;
//             letter-spacing: 0.08em;
//             text-transform: uppercase;
//           }

//           .account-title { margin-bottom: 2px; font-size: 12px; font-weight: 750; }
//           .account-line { color: #344054; font-size: 10px; line-height: 1.45; overflow-wrap: anywhere; }
//           .record-information { justify-self: end; width: 100%; max-width: 310px; }
//           .record-title { margin-bottom: 4px; color: var(--primary-dark); font-size: 10px; font-weight: 800; text-transform: uppercase; }
//           .record-line { display: flex; gap: 5px; color: #344054; font-size: 10px; line-height: 1.45; }
//           .record-label { flex-shrink: 0; font-weight: 500; }
//           .record-value { font-weight: 650; overflow-wrap: anywhere; }

//           .section { margin-top: 22px; }
//           .section-heading { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
//           .section-number {
//             display: flex;
//             width: 25px;
//             height: 25px;
//             align-items: center;
//             justify-content: center;
//             border-radius: 7px;
//             background: var(--primary);
//             color: var(--white);
//             font-size: 9px;
//             font-weight: 700;
//           }

//           .section-title { margin: 0; color: var(--primary-dark); font-size: 14px; font-weight: 700; }
//           .section-line { height: 1px; flex: 1; background: var(--border); }
//           .table-container { overflow: hidden; border: 1px solid var(--border); border-radius: 10px; }
//           table { width: 100%; border-collapse: collapse; table-layout: fixed; }
//           thead { background: var(--primary); color: var(--white); }
//           th {
//             padding: 10px 12px;
//             font-size: 8px;
//             font-weight: 700;
//             letter-spacing: 0.09em;
//             text-align: left;
//             text-transform: uppercase;
//           }

//           td {
//             padding: 11px 12px;
//             border-bottom: 1px solid var(--border);
//             vertical-align: top;
//             overflow-wrap: anywhere;
//           }

//           tbody tr:nth-child(even) { background: var(--surface); }
//           tbody tr:last-child td { border-bottom: none; }
//           .serial-column { width: 45px; color: var(--muted); text-align: center; }
//           thead .serial-column { color: var(--white); }
//           .amount-column { width: 120px; color: var(--primary-dark); font-weight: 700; text-align: right; white-space: nowrap; }
//           .cell-primary { font-weight: 650; }
//           .description-text {
//             display: block;
//             color: #475467;
//             line-height: 1.65;
//             white-space: pre-wrap;
//             overflow-wrap: anywhere;
//           }

//           .empty-row { padding: 25px; color: var(--muted); text-align: center; }
//           .document-footer {
//             display: flex;
//             align-items: center;
//             justify-content: space-between;
//             gap: 16px;
//             margin: 0 38px;
//             padding: 15px 0 20px;
//             border-top: 1px solid var(--border);
//             color: var(--muted);
//             font-size: 8px;
//           }

//           .footer-brand { color: var(--primary); font-weight: 700; letter-spacing: 0.05em; }
//           .confidential-badge {
//             display: inline-flex;
//             padding: 3px 8px;
//             border: 1px solid var(--border);
//             border-radius: 999px;
//             font-size: 7px;
//             font-weight: 700;
//             letter-spacing: 0.08em;
//             text-transform: uppercase;
//           }

//           @page { size: A4; margin: 10mm; }

//           @media print {
//             body { padding: 0; }
//             .document { max-width: none; border: none; box-shadow: none; }
//             .document-header,
//             .overview-card,
//             .account-summary,
//             .table-container,
//             tr { break-inside: avoid; }
//             thead { display: table-header-group; }
//           }
//         </style>
//       </head>

//       <body>
//         <main class="document">
//           <div class="top-accent"></div>

//           <header class="document-header">
//             <div class="brand-area">
//               <div class="brand-mark">IE</div>
//               <div>
//                 <h1 class="brand-name">IEDGE SYSTEM</h1>
//                 <p class="brand-subtitle">Financial Records Management</p>
//               </div>
//             </div>

//             <div class="document-heading">
//               <h2 class="document-type">Payment Record</h2>
//               <div class="reference-row">
//                 Reference:
//                 <span class="reference-value">${escapeHtml(documentReference)}</span>
//               </div>
//             </div>
//           </header>

//           <div class="document-body">
//             <div class="overview-grid">
//               <div class="overview-card">
//                 <div class="overview-label">Statement Title</div>
//                 <div class="overview-value">${escapeHtml(record.statementTitle || "-")}</div>
//               </div>

//               <div class="overview-card">
//                 <div class="overview-label">Record Date</div>
//                 <div class="overview-value">${escapeHtml(formatRecordDate(record.selectedDate))}</div>
//               </div>

//               <div class="overview-card">
//                 <div class="overview-label">Created By</div>
//                 <div class="overview-value">${escapeHtml(record.createdByName || "Unknown User")}</div>
//               </div>

//               <div class="overview-card">
//                 <div class="overview-label">Status</div>
//                 <div class="overview-value">Active</div>
//               </div>
//             </div>

//             <section class="account-summary">
//               <div>
//                 <div class="compact-heading">Account Details</div>
//                 <div class="account-title">${escapeHtml(record.accountTitle || "-")}</div>
//                 ${accountProvider ? `<div class="account-line">${escapeHtml(accountProvider)}</div>` : ""}
//                 ${record.accountNo ? `<div class="account-line">Account No: ${escapeHtml(record.accountNo)}</div>` : ""}
//                 ${additionalAccountDetail ? `<div class="account-line">${escapeHtml(additionalAccountDetail)}</div>` : ""}
//               </div>

//               <div class="record-information">
//                 <div class="record-title">Payment Information</div>
//                 <div class="record-line"><span class="record-label">Account Type:</span><span class="record-value">${escapeHtml(record.accountType.toUpperCase())}</span></div>
//                 <div class="record-line"><span class="record-label">Cheque Number:</span><span class="record-value">${escapeHtml(record.chequeNumber || "-")}</span></div>
//                 <div class="record-line"><span class="record-label">Cheque Amount:</span><span class="record-value">${escapeHtml(formatPrintAmount(record.chequeAmount))}</span></div>
//                 <div class="record-line"><span class="record-label">Item Total:</span><span class="record-value">${escapeHtml(formatPrintAmount(record.totalItemAmount))}</span></div>
//                 <div class="record-line"><span class="record-label">Remaining:</span><span class="record-value">${escapeHtml(formatPrintAmount(record.remainingBalance))}</span></div>
//               </div>
//             </section>

//             <section class="section">
//               <div class="section-heading">
//                 <span class="section-number">01</span>
//                 <h3 class="section-title">Transaction Items</h3>
//                 <div class="section-line"></div>
//               </div>

//               <div class="table-container">
//                 <table>
//                   <colgroup>
//                     <col style="width: 45px" />
//                     <col style="width: 18%" />
//                     <col style="width: 22%" />
//                     <col />
//                     <col style="width: 120px" />
//                   </colgroup>
//                   <thead>
//                     <tr>
//                       <th class="serial-column">No.</th>
//                       <th>Category</th>
//                       <th>Name</th>
//                       <th>Description</th>
//                       <th style="text-align: right">Amount</th>
//                     </tr>
//                   </thead>
//                   <tbody>${itemRows}</tbody>
//                 </table>
//               </div>
//             </section>
//           </div>

//           <footer class="document-footer">
//             <span class="footer-brand">IEDGE SYSTEM · OFFICIAL PAYMENT RECORD</span>
//             <span>Printed ${escapeHtml(
//               new Date().toLocaleString("en-US", {
//                 year: "numeric",
//                 month: "short",
//                 day: "2-digit",
//                 hour: "2-digit",
//                 minute: "2-digit",
//               }),
//             )}</span>
//             <span class="confidential-badge">Internal Document</span>
//           </footer>
//         </main>
//       </body>
//     </html>
//   `;

//   printWindow.document.open();
//   printWindow.document.write(printDocument);
//   printWindow.document.close();

//   printWindow.onload = () => {
//     printWindow.focus();

//     window.setTimeout(() => {
//       printWindow.print();
//     }, 250);
//   };

//   return true;
// };

// const PANEL_ID = "IEDGE-SYSTEM";

// const categoryOptions: string[] = [
//   "Utility",
//   "Commission",
//   "General",
//   "Tuition Fees",
//   "Payroll",
//   "Travel",
//   "Accommodation",
//   "Hotel",
//   "Ticketing",
//   "Office Expense",
//   "Rent",
//   "Conveyance",
//   "Insurance",
//   "Repair & Maintenance",
//   "Stationery & Printing",
//   "Office Equipment",
//   "Owners Drawing",
//   "Fuel",
//   "Licence",
//   "Medical",
//   "Credit Card",
//   "RTD",
//   "Tax",
//   "Expense",
// ];

// const emptyItem: RecordItem = {
//   category: "",
//   amount: "",
//   name: "",
//   description: "",
// };

// const getPanelCollection = (...pathSegments: string[]) => {
//   return collection(db, "Panels", PANEL_ID, ...pathSegments);
// };

// const getTodayDate = (): string => {
//   const today = new Date();
//   const year = today.getFullYear();
//   const month = String(today.getMonth() + 1).padStart(2, "0");
//   const day = String(today.getDate()).padStart(2, "0");

//   return `${year}-${month}-${day}`;
// };

// const getFirestoreTimestampFromDate = (dateValue: string): Timestamp => {
//   const [year, month, day] = dateValue.split("-").map(Number);

//   return Timestamp.fromDate(new Date(year, month - 1, day, 0, 0, 0));
// };

// const normalizeChequeNumber = (value: any): string => {
//   if (value === undefined || value === null || typeof value === "object") {
//     return "";
//   }

//   return String(value).trim().toLowerCase();
// };

// const getStringListFromValue = (value: any): string[] => {
//   if (value === undefined || value === null) return [];

//   if (Array.isArray(value)) {
//     return value.flatMap((item) => getStringListFromValue(item));
//   }

//   if (typeof value === "object") return [];

//   return String(value)
//     .split(/[\n,]/g)
//     .map((item) => item.trim())
//     .filter(Boolean);
// };

// const uniqueStringList = (values: string[]): string[] => {
//   const seen = new Set<string>();

//   return values.filter((value) => {
//     const key = normalizeChequeNumber(value);

//     if (!key || seen.has(key)) return false;

//     seen.add(key);
//     return true;
//   });
// };

// const getChequeNumbersFromSource = (source: any): string[] => {
//   if (!source) return [];

//   const chequeNumbers = [
//     ...getStringListFromValue(source?.reference),
//     ...getStringListFromValue(source?.Reference),
//     ...getStringListFromValue(source?.paymentReference),
//     ...getStringListFromValue(source?.paymentRef),
//     ...getStringListFromValue(source?.refNo),
//     ...getStringListFromValue(source?.referenceNo),
//     ...getStringListFromValue(source?.transactionReference),

//     ...getStringListFromValue(source?.chequeNumber),
//     ...getStringListFromValue(source?.chequeNumbers),
//     ...getStringListFromValue(source?.chequeNo),
//     ...getStringListFromValue(source?.checkNumber),
//     ...getStringListFromValue(source?.checkNo),
//     ...getStringListFromValue(source?.bankChequeNumber),
//     ...getStringListFromValue(source?.paymentChequeNumber),
//     ...getStringListFromValue(source?.receivedChequeNumber),

//     ...getStringListFromValue(source?.paymentDetails?.reference),
//     ...getStringListFromValue(source?.paymentDetails?.Reference),
//     ...getStringListFromValue(source?.paymentDetails?.paymentReference),
//     ...getStringListFromValue(source?.paymentDetails?.paymentRef),
//     ...getStringListFromValue(source?.paymentDetails?.refNo),
//     ...getStringListFromValue(source?.paymentDetails?.referenceNo),
//     ...getStringListFromValue(source?.paymentDetails?.transactionReference),
//     ...getStringListFromValue(source?.paymentDetails?.chequeNumber),
//     ...getStringListFromValue(source?.paymentDetails?.chequeNumbers),
//     ...getStringListFromValue(source?.paymentDetails?.chequeNo),
//     ...getStringListFromValue(source?.paymentDetails?.checkNumber),
//     ...getStringListFromValue(source?.paymentDetails?.checkNo),

//     ...getStringListFromValue(source?.accountDetails?.reference),
//     ...getStringListFromValue(source?.accountDetails?.Reference),
//     ...getStringListFromValue(source?.accountDetails?.paymentReference),
//     ...getStringListFromValue(source?.accountDetails?.paymentRef),
//     ...getStringListFromValue(source?.accountDetails?.refNo),
//     ...getStringListFromValue(source?.accountDetails?.referenceNo),
//     ...getStringListFromValue(source?.accountDetails?.transactionReference),
//     ...getStringListFromValue(source?.accountDetails?.chequeNumber),
//     ...getStringListFromValue(source?.accountDetails?.chequeNumbers),
//     ...getStringListFromValue(source?.accountDetails?.chequeNo),
//     ...getStringListFromValue(source?.accountDetails?.checkNumber),
//     ...getStringListFromValue(source?.accountDetails?.checkNo),

//     ...getStringListFromValue(source?.bankDetails?.reference),
//     ...getStringListFromValue(source?.bankDetails?.Reference),
//     ...getStringListFromValue(source?.bankDetails?.paymentReference),
//     ...getStringListFromValue(source?.bankDetails?.paymentRef),
//     ...getStringListFromValue(source?.bankDetails?.refNo),
//     ...getStringListFromValue(source?.bankDetails?.referenceNo),
//     ...getStringListFromValue(source?.bankDetails?.transactionReference),
//     ...getStringListFromValue(source?.bankDetails?.chequeNumber),
//     ...getStringListFromValue(source?.bankDetails?.chequeNumbers),
//     ...getStringListFromValue(source?.bankDetails?.chequeNo),
//     ...getStringListFromValue(source?.bankDetails?.checkNumber),
//     ...getStringListFromValue(source?.bankDetails?.checkNo),

//     ...getStringListFromValue(source?.receivePayment?.reference),
//     ...getStringListFromValue(source?.receivePayment?.Reference),
//     ...getStringListFromValue(source?.receivePayment?.paymentReference),
//     ...getStringListFromValue(source?.receivePayment?.paymentRef),
//     ...getStringListFromValue(source?.receivePayment?.refNo),
//     ...getStringListFromValue(source?.receivePayment?.referenceNo),
//     ...getStringListFromValue(source?.receivePayment?.transactionReference),
//     ...getStringListFromValue(source?.receivePayment?.chequeNumber),
//     ...getStringListFromValue(source?.receivePayment?.chequeNumbers),
//     ...getStringListFromValue(source?.receivePayment?.chequeNo),
//     ...getStringListFromValue(source?.receivePayment?.checkNumber),
//     ...getStringListFromValue(source?.receivePayment?.checkNo),

//     ...getStringListFromValue(source?.latestPaymentRelease?.reference),
//     ...getStringListFromValue(source?.latestPaymentRelease?.paymentReference),
//     ...getStringListFromValue(source?.latestPaymentRelease?.paymentRef),
//     ...getStringListFromValue(source?.latestPaymentRelease?.refNo),
//     ...getStringListFromValue(source?.latestPaymentRelease?.referenceNo),
//     ...getStringListFromValue(
//       source?.latestPaymentRelease?.transactionReference,
//     ),
//     ...getStringListFromValue(source?.latestPaymentRelease?.chequeNumber),
//     ...getStringListFromValue(source?.latestPaymentRelease?.chequeNumbers),
//     ...getStringListFromValue(source?.latestPaymentRelease?.chequeNo),
//     ...getStringListFromValue(source?.latestPaymentRelease?.checkNumber),
//     ...getStringListFromValue(source?.latestPaymentRelease?.checkNo),
//   ];

//   return uniqueStringList(chequeNumbers);
// };

// const getChequeNumbersFromPaymentReleaseHistory = (source: any): string[] => {
//   const history = Array.isArray(source?.paymentReleaseHistory)
//     ? source.paymentReleaseHistory
//     : [];

//   return uniqueStringList(
//     history.flatMap((entry: any) => getChequeNumbersFromSource(entry)),
//   );
// };

// export default function Record() {
//   const { userProfile } = useAuth();
//   const { toast } = useToast();
//   const [, setLocation] = useLocation();

//   const todayDate = getTodayDate();

//   const [accounts, setAccounts] = useState<AccountOption[]>([]);
//   const [accountsLoading, setAccountsLoading] = useState<boolean>(true);
//   const [selectedAccountKey, setSelectedAccountKey] = useState<string>("");

//   const [chequeNumber, setChequeNumber] = useState<string>("");
//   const [statementTitle, setStatementTitle] = useState<string>("");
//   const [selectedDate, setSelectedDate] = useState<string>(todayDate);
//   const [chequeAmount, setChequeAmount] = useState<string>("");
//   const [items, setItems] = useState<RecordItem[]>([{ ...emptyItem }]);

//   const [loading, setLoading] = useState<boolean>(false);
//   const [submitError, setSubmitError] = useState<string>("");
//   const [duplicateChequeWarning, setDuplicateChequeWarning] =
//     useState<string>("");
//   const [lastSavedRecord, setLastSavedRecord] =
//     useState<PrintableRecordData | null>(null);
//   const [isCurrentRecordSaved, setIsCurrentRecordSaved] =
//     useState<boolean>(false);

//   const getErrorMessage = (error: unknown): string => {
//     if (error instanceof Error) return error.message;
//     return "Something went wrong";
//   };

//   useEffect(() => {
//     let isMounted = true;

//     async function fetchAccounts() {
//       try {
//         setAccountsLoading(true);

//         const [chequeSnapshot, onlineSnapshot] = await Promise.all([
//           getDocs(collection(db, "chequeAccounts")),
//           getDocs(collection(db, "onlineAccounts")),
//         ]);

//         const chequeAccountsRaw: RawAccountOption[] = chequeSnapshot.docs.map(
//           (doc) => {
//             const data = doc.data() as FirestoreAccountData;

//             return {
//               id: doc.id,
//               key: `cheque-${doc.id}`,
//               type: "cheque",
//               accountTitle: data.accountTitle || "Untitled Account",
//               accountNo: data.accountNo || "",
//               bank: data.bank || "",
//               branch: data.branch || "",
//               city: data.city || "",
//               isActive: data.isActive,
//             };
//           },
//         );

//         const onlineAccountsRaw: RawAccountOption[] = onlineSnapshot.docs.map(
//           (doc) => {
//             const data = doc.data() as FirestoreAccountData;

//             return {
//               id: doc.id,
//               key: `online-${doc.id}`,
//               type: "online",
//               accountTitle: data.accountTitle || "Untitled Account",
//               accountNo: data.accountNo || "",
//               bank: data.bank || "",
//               platform: data.platform || "",
//               routingNumber: data.routingNumber || "",
//               isActive: data.isActive,
//             };
//           },
//         );

//         const activeChequeAccounts: AccountOption[] = chequeAccountsRaw
//           .filter((account) => account.isActive !== false)
//           .map(({ isActive, ...account }) => account);

//         const activeOnlineAccounts: AccountOption[] = onlineAccountsRaw
//           .filter((account) => account.isActive !== false)
//           .map(({ isActive, ...account }) => account);

//         const mergedAccounts = [
//           ...activeChequeAccounts,
//           ...activeOnlineAccounts,
//         ].sort((a, b) => a.accountTitle.localeCompare(b.accountTitle));

//         if (isMounted) {
//           setAccounts(mergedAccounts);
//         }
//       } catch (error) {
//         console.error("Failed to fetch accounts:", error);

//         toast({
//           title: "Error",
//           description: getErrorMessage(error) || "Failed to fetch accounts",
//           variant: "destructive",
//         });
//       } finally {
//         if (isMounted) {
//           setAccountsLoading(false);
//         }
//       }
//     }

//     fetchAccounts();

//     return () => {
//       isMounted = false;
//     };
//   }, [toast]);

//   const selectedAccount = useMemo<AccountOption | null>(() => {
//     return (
//       accounts.find((account) => account.key === selectedAccountKey) || null
//     );
//   }, [accounts, selectedAccountKey]);

//   const totalItemAmount = useMemo<number>(() => {
//     return items.reduce((total, item) => {
//       return total + (Number(item.amount) || 0);
//     }, 0);
//   }, [items]);

//   const chequeValue = Number(chequeAmount) || 0;
//   const remainingBalance = chequeValue - totalItemAmount;
//   const isExceeded = chequeValue > 0 && totalItemAmount > chequeValue;

//   const formatAmount = (value: number): string => {
//     return value.toLocaleString("en-US", {
//       maximumFractionDigits: 2,
//     });
//   };

//   const sanitizeAmount = (value: string): string => {
//     let cleanValue = value.replace(/[^0-9.]/g, "");

//     const parts = cleanValue.split(".");
//     if (parts.length > 2) {
//       cleanValue = `${parts[0]}.${parts.slice(1).join("")}`;
//     }

//     return cleanValue;
//   };

//   const chequeNumberAlreadyExists = async (
//     chequeNumberValue: string,
//   ): Promise<boolean> => {
//     const targetChequeNumber = normalizeChequeNumber(chequeNumberValue);

//     if (!targetChequeNumber) return false;

//     try {
//       const accountStatementSourceCollections = [
//         "payments",
//         "invoiceRequests",
//         "Record",
//         "claimReimbursements",
//         "accountStatementManualEntries",
//       ];

//       const snapshots = await Promise.all(
//         accountStatementSourceCollections.map((collectionName) =>
//           getDocs(getPanelCollection(collectionName)),
//         ),
//       );

//       return snapshots.some((snapshot) =>
//         snapshot.docs.some((documentSnapshot) => {
//           const data = documentSnapshot.data();

//           const chequeNumbers = uniqueStringList([
//             ...getChequeNumbersFromSource(data),
//             ...getChequeNumbersFromPaymentReleaseHistory(data),
//           ]);

//           return chequeNumbers.some(
//             (existingChequeNumber) =>
//               normalizeChequeNumber(existingChequeNumber) ===
//               targetChequeNumber,
//           );
//         }),
//       );
//     } catch (error) {
//       console.warn(
//         "Failed to check cheque number from Account Statement records:",
//         error,
//       );

//       return false;
//     }
//   };

//   const checkChequeNumberDuplicate = async (
//     value: string,
//   ): Promise<boolean> => {
//     const cleanValue = value.trim();

//     if (!cleanValue) {
//       setDuplicateChequeWarning("");
//       return false;
//     }

//     const exists = await chequeNumberAlreadyExists(cleanValue);

//     if (exists) {
//       setDuplicateChequeWarning("This cheque number already exists.");
//     } else {
//       setDuplicateChequeWarning("");
//     }

//     return exists;
//   };

//   const handleChequeNumberChange = (value: string) => {
//     setChequeNumber(value);
//     setIsCurrentRecordSaved(false);
//     setSubmitError("");
//     setDuplicateChequeWarning("");
//   };

//   const handleStatementTitleChange = (value: string) => {
//     setStatementTitle(value);
//     setIsCurrentRecordSaved(false);
//     setSubmitError("");
//   };

//   const handleDateChange = (value: string) => {
//     setSelectedDate(value);
//     setIsCurrentRecordSaved(false);
//     setSubmitError("");
//   };

//   const handleChequeAmountChange = (value: string) => {
//     setChequeAmount(sanitizeAmount(value));
//     setIsCurrentRecordSaved(false);
//     setSubmitError("");
//   };

//   const handleItemChange = (index: number, field: ItemField, value: string) => {
//     const updatedItems = [...items];

//     updatedItems[index] = {
//       ...updatedItems[index],
//       [field]: field === "amount" ? sanitizeAmount(value) : value,
//     };

//     setItems(updatedItems);
//     setIsCurrentRecordSaved(false);
//     setSubmitError("");
//   };

//   const handleAddItem = () => {
//     setItems((prevItems) => [...prevItems, { ...emptyItem }]);
//     setIsCurrentRecordSaved(false);
//     setSubmitError("");
//   };

//   const handleRemoveItem = (index: number) => {
//     if (items.length === 1) return;

//     const updatedItems = items.filter((_, itemIndex) => itemIndex !== index);
//     setItems(updatedItems);
//     setIsCurrentRecordSaved(false);
//     setSubmitError("");
//   };

//   const validateForm = (): string => {
//     if (!selectedAccount) {
//       return "Please select an account.";
//     }

//     if (!chequeNumber.trim()) {
//       return "Please enter cheque number.";
//     }

//     if (!selectedDate) {
//       return "Please select a date.";
//     }

//     if (selectedDate > todayDate) {
//       return "Future dates are not allowed.";
//     }

//     if (!chequeAmount || chequeValue <= 0) {
//       return "Please enter a valid cheque amount.";
//     }

//     for (let i = 0; i < items.length; i++) {
//       const item = items[i];

//       if (!item.category) {
//         return `Please select a category for item ${i + 1}.`;
//       }

//       if (!item.name.trim()) {
//         return `Please enter a name for item ${i + 1}.`;
//       }

//       if (!item.amount || Number(item.amount) <= 0) {
//         return `Please enter a valid amount for item ${i + 1}.`;
//       }
//     }

//     if (totalItemAmount > chequeValue) {
//       return "The total item amount exceeds the cheque amount. Cheque amount is not sufficient for the entered items.";
//     }

//     return "";
//   };

//   const getCurrentPrintableRecord = (): PrintableRecordData | null => {
//     if (!selectedAccount) return null;

//     const profileData = userProfile as {
//       id?: string;
//       name?: string;
//       displayName?: string;
//       email?: string;
//     } | null;

//     return {
//       selectedDate,
//       accountType: selectedAccount.type,
//       accountTitle: selectedAccount.accountTitle,
//       accountNo: selectedAccount.accountNo,
//       bank: selectedAccount.bank,
//       branch: selectedAccount.branch || "",
//       city: selectedAccount.city || "",
//       platform: selectedAccount.platform || "",
//       routingNumber: selectedAccount.routingNumber || "",
//       chequeNumber: chequeNumber.trim(),
//       statementTitle: statementTitle.trim(),
//       chequeAmount: chequeValue,
//       totalItemAmount,
//       remainingBalance,
//       createdByName:
//         profileData?.name ||
//         profileData?.displayName ||
//         profileData?.email ||
//         "Unknown User",
//       items: items.map((item) => ({
//         category: item.category,
//         name: item.name.trim(),
//         amount: Number(item.amount),
//         description: normalizeDescriptionLineBreaks(item.description),
//       })),
//     };
//   };

//   const handlePrint = () => {
//     const hasCurrentRecordData = Boolean(
//       selectedAccountKey ||
//         chequeNumber.trim() ||
//         statementTitle.trim() ||
//         chequeAmount ||
//         items.some(
//           (item) =>
//             item.category ||
//             item.amount ||
//             item.name.trim() ||
//             item.description.trim(),
//         ),
//     );

//     if (hasCurrentRecordData) {
//       const error = validateForm();

//       if (error) {
//         setSubmitError(error);
//         toast({
//           title: "Cannot print record",
//           description: error,
//           variant: "destructive",
//         });
//         return;
//       }

//       const currentRecord = getCurrentPrintableRecord();

//       if (!currentRecord) return;

//       const opened = printRecord(currentRecord);

//       if (!opened) {
//         toast({
//           title: "Print window blocked",
//           description: "Please allow pop-ups for this website and try again.",
//           variant: "destructive",
//         });
//       }
//       return;
//     }

//     if (lastSavedRecord) {
//       const opened = printRecord(lastSavedRecord);

//       if (!opened) {
//         toast({
//           title: "Print window blocked",
//           description: "Please allow pop-ups for this website and try again.",
//           variant: "destructive",
//         });
//       }
//       return;
//     }

//     toast({
//       title: "No record available",
//       description: "Enter record details or save a record before printing.",
//       variant: "destructive",
//     });
//   };

//   async function handleSubmit(e: FormEvent<HTMLFormElement>) {
//     e.preventDefault();

//     const error = validateForm();

//     if (error) {
//       setSubmitError(error);

//       toast({
//         title: "Error",
//         description: error,
//         variant: "destructive",
//       });

//       return;
//     }

//     if (!selectedAccount) return;

//     try {
//       setLoading(true);

//       const profileData = userProfile as {
//         id?: string;
//         name?: string;
//         displayName?: string;
//         email?: string;
//       } | null;

//       const selectedCreatedAt = getFirestoreTimestampFromDate(selectedDate);
//       const cleanChequeNumber = chequeNumber.trim();

//       const isDuplicateChequeNumber =
//         await checkChequeNumberDuplicate(cleanChequeNumber);

//       const payload = {
//         firebasePath: "/Panels/IEDGE-SYSTEM/Record",

//         selectedDate,
//         chequeDate: selectedDate,

//         accountId: selectedAccount.id,
//         accountType: selectedAccount.type,
//         accountTitle: selectedAccount.accountTitle,
//         accountNo: selectedAccount.accountNo,
//         bank: selectedAccount.bank,
//         branch: selectedAccount.branch || "",
//         city: selectedAccount.city || "",
//         platform: selectedAccount.platform || "",
//         routingNumber: selectedAccount.routingNumber || "",

//         chequeNumber: cleanChequeNumber,
//         statementTitle: statementTitle.trim(),
//         chequeAmount: chequeValue,
//         totalItemAmount,
//         remainingBalance,

//         items: items.map((item) => ({
//           category: item.category,
//           name: item.name.trim(),
//           amount: Number(item.amount),
//           description: normalizeDescriptionLineBreaks(item.description),
//         })),

//         createdBy: profileData?.id || "",
//         createdByName:
//           profileData?.name ||
//           profileData?.displayName ||
//           profileData?.email ||
//           "Unknown User",

//         createdAt: selectedCreatedAt,
//         updatedAt: serverTimestamp(),
//         status: "active",
//       };

//       const savedDocument = await addDoc(getPanelCollection("Record"), payload);

//       setLastSavedRecord({
//         recordId: savedDocument.id,
//         selectedDate,
//         accountType: selectedAccount.type,
//         accountTitle: selectedAccount.accountTitle,
//         accountNo: selectedAccount.accountNo,
//         bank: selectedAccount.bank,
//         branch: selectedAccount.branch || "",
//         city: selectedAccount.city || "",
//         platform: selectedAccount.platform || "",
//         routingNumber: selectedAccount.routingNumber || "",
//         chequeNumber: cleanChequeNumber,
//         statementTitle: statementTitle.trim(),
//         chequeAmount: chequeValue,
//         totalItemAmount,
//         remainingBalance,
//         createdByName:
//           profileData?.name ||
//           profileData?.displayName ||
//           profileData?.email ||
//           "Unknown User",
//         items: items.map((item) => ({
//           category: item.category,
//           name: item.name.trim(),
//           amount: Number(item.amount),
//           description: normalizeDescriptionLineBreaks(item.description),
//         })),
//       });

//       toast({
//         title: isDuplicateChequeNumber ? "Saved with warning" : "Success",
//         description: isDuplicateChequeNumber
//           ? "This cheque number already exists in Account Statement records, but the record was saved successfully."
//           : "Record added successfully. The record remains open and can now be printed.",
//       });

//       setIsCurrentRecordSaved(true);
//     } catch (error) {
//       console.error("Failed to add record:", error);

//       toast({
//         title: "Error",
//         description: getErrorMessage(error) || "Failed to add record",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="mx-auto max-w-6xl">
//       <form onSubmit={handleSubmit} className="space-y-6">
//         <Card>
//           <CardHeader>
//             <CardTitle>Cheque Information</CardTitle>
//           </CardHeader>

//           <CardContent>
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
//               <div>
//                 <Label>Account Select *</Label>

//                 <Select
//                   value={selectedAccountKey}
//                   onValueChange={(value: string) => {
//                     setSelectedAccountKey(value);
//                     setIsCurrentRecordSaved(false);
//                     setSubmitError("");
//                   }}
//                   disabled={accountsLoading}
//                 >
//                   <SelectTrigger data-testid="select-account">
//                     <SelectValue
//                       placeholder={
//                         accountsLoading
//                           ? "Loading accounts..."
//                           : "Select account"
//                       }
//                     />
//                   </SelectTrigger>

//                   <SelectContent>
//                     {accounts.map((account) => (
//                       <SelectItem key={account.key} value={account.key}>
//                         {account.accountTitle} - {account.bank} -{" "}
//                         {account.accountNo} (
//                         {account.type === "cheque" ? "Cheque" : "Online"})
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>

//                 {!accountsLoading && accounts.length === 0 && (
//                   <p className="mt-2 text-sm text-destructive">
//                     No active accounts found. Please add an account first.
//                   </p>
//                 )}
//               </div>

//               <div>
//                 <Label htmlFor="chequeNumber">Cheque Number *</Label>

//                 <Input
//                   id="chequeNumber"
//                   value={chequeNumber}
//                   onChange={(e) => handleChequeNumberChange(e.target.value)}
//                   onBlur={() => {
//                     void checkChequeNumberDuplicate(chequeNumber);
//                   }}
//                   placeholder="Enter cheque number"
//                   data-testid="input-cheque-number"
//                 />

//                 {duplicateChequeWarning && (
//                   <p className="mt-2 text-sm font-medium text-amber-600">
//                     {duplicateChequeWarning}
//                   </p>
//                 )}
//               </div>

//               <div>
//                 <Label htmlFor="statementTitle">Statement Title</Label>

//                 <Input
//                   id="statementTitle"
//                   value={statementTitle}
//                   onChange={(e) => handleStatementTitleChange(e.target.value)}
//                   placeholder="Enter statement title"
//                   data-testid="input-statement-title"
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="selectedDate">Select Date *</Label>

//                 <Input
//                   id="selectedDate"
//                   type="date"
//                   value={selectedDate}
//                   max={todayDate}
//                   onChange={(e) => handleDateChange(e.target.value)}
//                   data-testid="input-select-date"
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="chequeAmount">Cheque Amount *</Label>

//                 <Input
//                   id="chequeAmount"
//                   value={chequeAmount}
//                   onChange={(e) => handleChequeAmountChange(e.target.value)}
//                   placeholder="Enter cheque amount"
//                   data-testid="input-cheque-amount"
//                 />
//               </div>
//             </div>

//             {selectedAccount && (
//               <div className="mt-5 rounded-xl border bg-muted/40 p-4">
//                 <p className="text-sm font-semibold text-foreground">
//                   Selected Account Details
//                 </p>

//                 <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-4">
//                   <div>
//                     <p className="text-muted-foreground">Account Title</p>
//                     <p className="font-medium">
//                       {selectedAccount.accountTitle}
//                     </p>
//                   </div>

//                   <div>
//                     <p className="text-muted-foreground">Bank</p>
//                     <p className="font-medium">{selectedAccount.bank}</p>
//                   </div>

//                   <div>
//                     <p className="text-muted-foreground">Account No</p>
//                     <p className="font-medium">{selectedAccount.accountNo}</p>
//                   </div>

//                   <div>
//                     <p className="text-muted-foreground">Selected Date</p>
//                     <p className="font-medium">{selectedDate || "-"}</p>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//               <CardTitle>Record Items</CardTitle>

//               <Button
//                 type="button"
//                 onClick={handleAddItem}
//                 data-testid="button-add-item"
//               >
//                 Add New Item
//               </Button>
//             </div>
//           </CardHeader>

//           <CardContent className="space-y-4">
//             {items.map((item, index) => (
//               <div key={index} className="rounded-xl border bg-muted/30 p-4">
//                 <div className="mb-4 flex items-center justify-between">
//                   <h3 className="font-semibold text-foreground">
//                     Item {index + 1}
//                   </h3>

//                   {items.length > 1 && (
//                     <Button
//                       type="button"
//                       variant="outline"
//                       onClick={() => handleRemoveItem(index)}
//                       data-testid={`button-remove-item-${index}`}
//                     >
//                       Remove
//                     </Button>
//                   )}
//                 </div>

//                 <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
//                   <div>
//                     <Label>Category *</Label>

//                     <Select
//                       value={item.category}
//                       onValueChange={(value: string) =>
//                         handleItemChange(index, "category", value)
//                       }
//                     >
//                       <SelectTrigger data-testid={`select-category-${index}`}>
//                         <SelectValue placeholder="Select category" />
//                       </SelectTrigger>

//                       <SelectContent>
//                         {categoryOptions.map((category) => (
//                           <SelectItem key={category} value={category}>
//                             {category}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   <div>
//                     <Label>Amount *</Label>

//                     <Input
//                       value={item.amount}
//                       onChange={(e) =>
//                         handleItemChange(index, "amount", e.target.value)
//                       }
//                       placeholder="Enter amount"
//                       data-testid={`input-item-amount-${index}`}
//                     />
//                   </div>

//                   <div>
//                     <Label>Name *</Label>

//                     <Input
//                       value={item.name}
//                       onChange={(e) =>
//                         handleItemChange(index, "name", e.target.value)
//                       }
//                       placeholder="Enter name"
//                       data-testid={`input-item-name-${index}`}
//                     />
//                   </div>

//                   <div className="md:col-span-2 lg:col-span-4">
//                     <Label htmlFor={`item-description-${index}`}>
//                       Description
//                     </Label>

//                     <Textarea
//                       id={`item-description-${index}`}
//                       value={item.description}
//                       onChange={(e) =>
//                         handleItemChange(index, "description", e.target.value)
//                       }
//                       rows={7}
//                       className="mt-2 min-h-[160px] resize-y whitespace-pre-wrap"
//                       placeholder={
//                         "Write the description line by line. Press Enter for a new line, or press Enter twice to start a new paragraph."
//                       }
//                       data-testid={`input-item-description-${index}`}
//                     />

//                     <p className="mt-2 text-xs text-muted-foreground">
//                       Line breaks and blank paragraphs are preserved when the
//                       record is saved and printed.
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle>Cheque Summary</CardTitle>
//           </CardHeader>

//           <CardContent>
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
//               <div className="rounded-xl border bg-muted/30 p-4">
//                 <p className="text-sm text-muted-foreground">Cheque Amount</p>
//                 <h3 className="mt-2 text-2xl font-bold">
//                   {formatAmount(chequeValue)}
//                 </h3>
//               </div>

//               <div className="rounded-xl border bg-muted/30 p-4">
//                 <p className="text-sm text-muted-foreground">
//                   Total Item Amount
//                 </p>
//                 <h3 className="mt-2 text-2xl font-bold">
//                   {formatAmount(totalItemAmount)}
//                 </h3>
//               </div>

//               <div
//                 className={`rounded-xl border p-4 ${
//                   isExceeded
//                     ? "border-red-200 bg-red-50"
//                     : remainingBalance === 0 && chequeValue > 0
//                       ? "border-emerald-200 bg-emerald-50"
//                       : "bg-muted/30"
//                 }`}
//               >
//                 <p
//                   className={`text-sm ${
//                     isExceeded
//                       ? "text-red-600"
//                       : remainingBalance === 0 && chequeValue > 0
//                         ? "text-emerald-700"
//                         : "text-muted-foreground"
//                   }`}
//                 >
//                   Remaining Balance
//                 </p>

//                 <h3
//                   className={`mt-2 text-2xl font-bold ${
//                     isExceeded
//                       ? "text-red-700"
//                       : remainingBalance === 0 && chequeValue > 0
//                         ? "text-emerald-700"
//                         : "text-foreground"
//                   }`}
//                 >
//                   {formatAmount(remainingBalance)}
//                 </h3>
//               </div>
//             </div>

//             {isExceeded && (
//               <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
//                 The total item amount exceeds the cheque amount. Cheque amount
//                 is not sufficient for the entered items.
//               </div>
//             )}

//             {duplicateChequeWarning && (
//               <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
//                 {duplicateChequeWarning} You can still save this record.
//               </div>
//             )}

//             {submitError && (
//               <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
//                 {submitError}
//               </div>
//             )}

//             <div className="mt-6 flex flex-wrap justify-end gap-3">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={handlePrint}
//                 disabled={loading}
//                 data-testid="button-print-record"
//               >
//                 Print Record
//               </Button>

//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => setLocation("/accounts")}
//                 data-testid="button-cancel-record"
//               >
//                 Cancel
//               </Button>

//               <Button
//                 type="submit"
//                 disabled={
//                   loading ||
//                   isExceeded ||
//                   accounts.length === 0 ||
//                   isCurrentRecordSaved
//                 }
//                 data-testid="button-save-record"
//               >
//                 {loading ? (
//                   <>
//                     <i className="fas fa-spinner fa-spin mr-2"></i>
//                     Saving...
//                   </>
//                 ) : isCurrentRecordSaved ? (
//                   "Saved"
//                 ) : (
//                   "Save Record"
//                 )}
//               </Button>
//             </div>
//           </CardContent>
//         </Card>
//       </form>
//     </div>
//   );
// }

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { printRecordDocument, type PrintableRecord } from "@/lib/recordPrint";
import {
  getAllChequeNumbers,
  normalizeChequeNumber,
} from "@/lib/chequeNumbers";
import { useLocation } from "wouter";

type AccountType = "cheque" | "online";

type FirestoreAccountData = {
  accountTitle?: string;
  accountNo?: string;
  bank?: string;
  branch?: string;
  city?: string;
  platform?: string;
  routingNumber?: string;
  isActive?: boolean;
  createdBy?: string;
};

type AccountOption = {
  id: string;
  key: string;
  type: AccountType;
  accountTitle: string;
  accountNo: string;
  bank: string;
  branch?: string;
  city?: string;
  platform?: string;
  routingNumber?: string;
};

type RawAccountOption = AccountOption & {
  isActive?: boolean;
};

type RecordItem = {
  category: string;
  amount: string;
  name: string;
  description: string;
};

type ItemField = keyof RecordItem;

const normalizeDescriptionLineBreaks = (value: string): string => {
  return value.replace(/\r\n?/g, "\n");
};

const PANEL_ID = "IEDGE-SYSTEM";

const emptyItem: RecordItem = {
  category: "",
  amount: "",
  name: "",
  description: "",
};

const getPanelCollection = (...pathSegments: string[]) => {
  return collection(db, "Panels", PANEL_ID, ...pathSegments);
};

const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getFirestoreTimestampFromDate = (dateValue: string): Timestamp => {
  const [year, month, day] = dateValue.split("-").map(Number);

  return Timestamp.fromDate(new Date(year, month - 1, day, 0, 0, 0));
};

export default function Record() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const todayDate = getTodayDate();

  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [accountsLoading, setAccountsLoading] = useState<boolean>(true);
  const [selectedAccountKey, setSelectedAccountKey] = useState<string>("");

  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);

  const [chequeNumber, setChequeNumber] = useState<string>("");
  const [statementTitle, setStatementTitle] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);
  const [chequeAmount, setChequeAmount] = useState<string>("");
  const [items, setItems] = useState<RecordItem[]>([{ ...emptyItem }]);

  const [loading, setLoading] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [duplicateChequeWarning, setDuplicateChequeWarning] =
    useState<string>("");
  const [lastSavedRecord, setLastSavedRecord] =
    useState<PrintableRecord | null>(null);
  const [showSavedDialog, setShowSavedDialog] = useState<boolean>(false);

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    return "Something went wrong";
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchAccounts() {
      try {
        setAccountsLoading(true);

        const [chequeSnapshot, onlineSnapshot] = await Promise.all([
          getDocs(collection(db, "chequeAccounts")),
          getDocs(collection(db, "onlineAccounts")),
        ]);

        const chequeAccountsRaw: RawAccountOption[] = chequeSnapshot.docs.map(
          (doc) => {
            const data = doc.data() as FirestoreAccountData;

            return {
              id: doc.id,
              key: `cheque-${doc.id}`,
              type: "cheque",
              accountTitle: data.accountTitle || "Untitled Account",
              accountNo: data.accountNo || "",
              bank: data.bank || "",
              branch: data.branch || "",
              city: data.city || "",
              isActive: data.isActive,
            };
          },
        );

        const onlineAccountsRaw: RawAccountOption[] = onlineSnapshot.docs.map(
          (doc) => {
            const data = doc.data() as FirestoreAccountData;

            return {
              id: doc.id,
              key: `online-${doc.id}`,
              type: "online",
              accountTitle: data.accountTitle || "Untitled Account",
              accountNo: data.accountNo || "",
              bank: data.bank || "",
              platform: data.platform || "",
              routingNumber: data.routingNumber || "",
              isActive: data.isActive,
            };
          },
        );

        const activeChequeAccounts: AccountOption[] = chequeAccountsRaw
          .filter((account) => account.isActive !== false)
          .map(({ isActive, ...account }) => account);

        const activeOnlineAccounts: AccountOption[] = onlineAccountsRaw
          .filter((account) => account.isActive !== false)
          .map(({ isActive, ...account }) => account);

        const mergedAccounts = [
          ...activeChequeAccounts,
          ...activeOnlineAccounts,
        ].sort((a, b) => a.accountTitle.localeCompare(b.accountTitle));

        if (isMounted) {
          setAccounts(mergedAccounts);
        }
      } catch (error) {
        console.error("Failed to fetch accounts:", error);

        toast({
          title: "Error",
          description: getErrorMessage(error) || "Failed to fetch accounts",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setAccountsLoading(false);
        }
      }
    }

    fetchAccounts();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  useEffect(() => {
    let isMounted = true;

    async function fetchCategories() {
      try {
        setCategoriesLoading(true);

        const snapshot = await getDocs(getPanelCollection("recordCategories"));

        const fetchedCategories = snapshot.docs
          .map((docSnapshot) => (docSnapshot.data().name as string) || "")
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));

        if (isMounted) {
          setCategoryOptions(fetchedCategories);
        }
      } catch (error) {
        console.error("Failed to fetch record categories:", error);

        toast({
          title: "Error",
          description:
            getErrorMessage(error) || "Failed to fetch record categories",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setCategoriesLoading(false);
        }
      }
    }

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const selectedAccount = useMemo<AccountOption | null>(() => {
    return (
      accounts.find((account) => account.key === selectedAccountKey) || null
    );
  }, [accounts, selectedAccountKey]);

  const totalItemAmount = useMemo<number>(() => {
    return items.reduce((total, item) => {
      return total + (Number(item.amount) || 0);
    }, 0);
  }, [items]);

  const chequeValue = Number(chequeAmount) || 0;
  const remainingBalance = chequeValue - totalItemAmount;
  const isExceeded = chequeValue > 0 && totalItemAmount > chequeValue;

  const formatAmount = (value: number): string => {
    return value.toLocaleString("en-US", {
      maximumFractionDigits: 2,
    });
  };

  const sanitizeAmount = (value: string): string => {
    let cleanValue = value.replace(/[^0-9.]/g, "");

    const parts = cleanValue.split(".");
    if (parts.length > 2) {
      cleanValue = `${parts[0]}.${parts.slice(1).join("")}`;
    }

    return cleanValue;
  };

  const chequeNumberAlreadyExists = async (
    chequeNumberValue: string,
  ): Promise<boolean> => {
    const targetChequeNumber = normalizeChequeNumber(chequeNumberValue);

    if (!targetChequeNumber) return false;

    try {
      const accountStatementSourceCollections = [
        "payments",
        "invoiceRequests",
        "Record",
        "claimReimbursements",
        "accountStatementManualEntries",
      ];

      const snapshots = await Promise.all(
        accountStatementSourceCollections.map((collectionName) =>
          getDocs(getPanelCollection(collectionName)),
        ),
      );

      return snapshots.some((snapshot) =>
        snapshot.docs.some((documentSnapshot) => {
          const data = documentSnapshot.data();

          return getAllChequeNumbers(data).some(
            (existingChequeNumber) =>
              normalizeChequeNumber(existingChequeNumber) ===
              targetChequeNumber,
          );
        }),
      );
    } catch (error) {
      console.warn(
        "Failed to check cheque number from Account Statement records:",
        error,
      );

      return false;
    }
  };

  const checkChequeNumberDuplicate = async (
    value: string,
  ): Promise<boolean> => {
    const cleanValue = value.trim();

    if (!cleanValue) {
      setDuplicateChequeWarning("");
      return false;
    }

    const exists = await chequeNumberAlreadyExists(cleanValue);

    if (exists) {
      setDuplicateChequeWarning("This cheque number already exists.");
    } else {
      setDuplicateChequeWarning("");
    }

    return exists;
  };

  const handleChequeNumberChange = (value: string) => {
    setChequeNumber(value);
    setSubmitError("");
    setDuplicateChequeWarning("");
  };

  const handleStatementTitleChange = (value: string) => {
    setStatementTitle(value);
    setSubmitError("");
  };

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    setSubmitError("");
  };

  const handleChequeAmountChange = (value: string) => {
    setChequeAmount(sanitizeAmount(value));
    setSubmitError("");
  };

  const handleItemChange = (index: number, field: ItemField, value: string) => {
    const updatedItems = [...items];

    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === "amount" ? sanitizeAmount(value) : value,
    };

    setItems(updatedItems);
    setSubmitError("");
  };

  const handleAddItem = () => {
    setItems((prevItems) => [...prevItems, { ...emptyItem }]);
    setSubmitError("");
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;

    const updatedItems = items.filter((_, itemIndex) => itemIndex !== index);
    setItems(updatedItems);
    setSubmitError("");
  };

  const resetForm = () => {
    setSelectedAccountKey("");
    setChequeNumber("");
    setStatementTitle("");
    setSelectedDate(getTodayDate());
    setChequeAmount("");
    setItems([{ ...emptyItem }]);
    setSubmitError("");
    setDuplicateChequeWarning("");
  };

  const validateForm = (): string => {
    if (!selectedAccount) {
      return "Please select an account.";
    }

    if (!chequeNumber.trim()) {
      return "Please enter cheque number.";
    }

    if (!selectedDate) {
      return "Please select a date.";
    }

    if (selectedDate > todayDate) {
      return "Future dates are not allowed.";
    }

    if (!chequeAmount || chequeValue <= 0) {
      return "Please enter a valid cheque amount.";
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (!item.category) {
        return `Please select a category for item ${i + 1}.`;
      }

      if (!item.name.trim()) {
        return `Please enter a name for item ${i + 1}.`;
      }

      if (!item.amount || Number(item.amount) <= 0) {
        return `Please enter a valid amount for item ${i + 1}.`;
      }
    }

    if (totalItemAmount > chequeValue) {
      return "The total item amount exceeds the cheque amount. Cheque amount is not sufficient for the entered items.";
    }

    return "";
  };

  const openRecordPrintout = (record: PrintableRecord) => {
    if (!printRecordDocument(record)) {
      toast({
        title: "Print window blocked",
        description: "Please allow pop-ups for this website and try again.",
        variant: "destructive",
      });
    }
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const error = validateForm();

    if (error) {
      setSubmitError(error);

      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });

      return;
    }

    if (!selectedAccount) return;

    try {
      setLoading(true);

      const profileData = userProfile as {
        id?: string;
        name?: string;
        displayName?: string;
        email?: string;
      } | null;

      const selectedCreatedAt = getFirestoreTimestampFromDate(selectedDate);
      const cleanChequeNumber = chequeNumber.trim();

      const isDuplicateChequeNumber =
        await checkChequeNumberDuplicate(cleanChequeNumber);

      const payload = {
        firebasePath: "/Panels/IEDGE-SYSTEM/Record",

        selectedDate,
        chequeDate: selectedDate,

        accountId: selectedAccount.id,
        accountType: selectedAccount.type,
        accountTitle: selectedAccount.accountTitle,
        accountNo: selectedAccount.accountNo,
        bank: selectedAccount.bank,
        branch: selectedAccount.branch || "",
        city: selectedAccount.city || "",
        platform: selectedAccount.platform || "",
        routingNumber: selectedAccount.routingNumber || "",

        chequeNumber: cleanChequeNumber,
        statementTitle: statementTitle.trim(),
        chequeAmount: chequeValue,
        totalItemAmount,
        remainingBalance,

        items: items.map((item) => ({
          category: item.category,
          name: item.name.trim(),
          amount: Number(item.amount),
          description: normalizeDescriptionLineBreaks(item.description),
        })),

        createdBy: profileData?.id || "",
        createdByName:
          profileData?.name ||
          profileData?.displayName ||
          profileData?.email ||
          "Unknown User",

        createdAt: selectedCreatedAt,
        updatedAt: serverTimestamp(),
        status: "active",
      };

      const savedDocument = await addDoc(getPanelCollection("Record"), payload);

      setLastSavedRecord({
        id: savedDocument.id,
        status: payload.status,
        selectedDate,
        chequeDate: selectedDate,
        accountType: selectedAccount.type,
        accountTitle: selectedAccount.accountTitle,
        accountNo: selectedAccount.accountNo,
        bank: selectedAccount.bank,
        branch: selectedAccount.branch || "",
        city: selectedAccount.city || "",
        platform: selectedAccount.platform || "",
        routingNumber: selectedAccount.routingNumber || "",
        chequeNumber: cleanChequeNumber,
        statementTitle: statementTitle.trim(),
        chequeAmount: chequeValue,
        totalItemAmount,
        remainingBalance,
        createdByName:
          profileData?.name ||
          profileData?.displayName ||
          profileData?.email ||
          "Unknown User",
        items: items.map((item) => ({
          category: item.category,
          name: item.name.trim(),
          amount: Number(item.amount),
          description: normalizeDescriptionLineBreaks(item.description),
        })),
      });

      toast({
        title: isDuplicateChequeNumber ? "Saved with warning" : "Success",
        description: isDuplicateChequeNumber
          ? "This cheque number already exists in Account Statement records, but the record was saved successfully."
          : "Record added successfully",
      });

      resetForm();
      setShowSavedDialog(true);
    } catch (error) {
      console.error("Failed to add record:", error);

      toast({
        title: "Error",
        description: getErrorMessage(error) || "Failed to add record",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Cheque Information</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div>
                <Label>Account Select *</Label>

                <Select
                  value={selectedAccountKey}
                  onValueChange={(value: string) => {
                    setSelectedAccountKey(value);
                    setSubmitError("");
                  }}
                  disabled={accountsLoading}
                >
                  <SelectTrigger data-testid="select-account">
                    <SelectValue
                      placeholder={
                        accountsLoading
                          ? "Loading accounts..."
                          : "Select account"
                      }
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.key} value={account.key}>
                        {account.accountTitle} - {account.bank} -{" "}
                        {account.accountNo} (
                        {account.type === "cheque" ? "Cheque" : "Online"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {!accountsLoading && accounts.length === 0 && (
                  <p className="mt-2 text-sm text-destructive">
                    No active accounts found. Please add an account first.
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="chequeNumber">Cheque Number *</Label>

                <Input
                  id="chequeNumber"
                  value={chequeNumber}
                  onChange={(e) => handleChequeNumberChange(e.target.value)}
                  onBlur={() => {
                    void checkChequeNumberDuplicate(chequeNumber);
                  }}
                  placeholder="Enter cheque number"
                  data-testid="input-cheque-number"
                />

                {duplicateChequeWarning && (
                  <p className="mt-2 text-sm font-medium text-amber-600">
                    {duplicateChequeWarning}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="statementTitle">Statement Title</Label>

                <Input
                  id="statementTitle"
                  value={statementTitle}
                  onChange={(e) => handleStatementTitleChange(e.target.value)}
                  placeholder="Enter statement title"
                  data-testid="input-statement-title"
                />
              </div>

              <div>
                <Label htmlFor="selectedDate">Select Date *</Label>

                <Input
                  id="selectedDate"
                  type="date"
                  value={selectedDate}
                  max={todayDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  data-testid="input-select-date"
                />
              </div>

              <div>
                <Label htmlFor="chequeAmount">Cheque Amount *</Label>

                <Input
                  id="chequeAmount"
                  value={chequeAmount}
                  onChange={(e) => handleChequeAmountChange(e.target.value)}
                  placeholder="Enter cheque amount"
                  data-testid="input-cheque-amount"
                />
              </div>
            </div>

            {selectedAccount && (
              <div className="mt-5 rounded-xl border bg-muted/40 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Selected Account Details
                </p>

                <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-4">
                  <div>
                    <p className="text-muted-foreground">Account Title</p>
                    <p className="font-medium">
                      {selectedAccount.accountTitle}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Bank</p>
                    <p className="font-medium">{selectedAccount.bank}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Account No</p>
                    <p className="font-medium">{selectedAccount.accountNo}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Selected Date</p>
                    <p className="font-medium">{selectedDate || "-"}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Record Items</CardTitle>

              <Button
                type="button"
                onClick={handleAddItem}
                data-testid="button-add-item"
              >
                Add New Item
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="rounded-xl border bg-muted/30 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">
                    Item {index + 1}
                  </h3>

                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleRemoveItem(index)}
                      data-testid={`button-remove-item-${index}`}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <Label>Category *</Label>

                    <Combobox
                      options={categoryOptions}
                      value={item.category}
                      onChange={(value: string) =>
                        handleItemChange(index, "category", value)
                      }
                      disabled={categoriesLoading}
                      placeholder={
                        categoriesLoading
                          ? "Loading categories..."
                          : "Select category"
                      }
                      searchPlaceholder="Search categories..."
                      emptyText="No category found."
                      data-testid={`select-category-${index}`}
                    />

                    {!categoriesLoading && categoryOptions.length === 0 && (
                      <p className="mt-2 text-sm text-destructive">
                        No categories found. Please add one in Settings → Record
                        Categories.
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Amount *</Label>

                    <Input
                      value={item.amount}
                      onChange={(e) =>
                        handleItemChange(index, "amount", e.target.value)
                      }
                      placeholder="Enter amount"
                      data-testid={`input-item-amount-${index}`}
                    />
                  </div>

                  <div>
                    <Label>Name *</Label>

                    <Input
                      value={item.name}
                      onChange={(e) =>
                        handleItemChange(index, "name", e.target.value)
                      }
                      placeholder="Enter name"
                      data-testid={`input-item-name-${index}`}
                    />
                  </div>

                  <div className="md:col-span-2 lg:col-span-4">
                    <Label htmlFor={`item-description-${index}`}>
                      Description
                    </Label>

                    <Textarea
                      id={`item-description-${index}`}
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(index, "description", e.target.value)
                      }
                      rows={7}
                      className="mt-2 min-h-[160px] resize-y whitespace-pre-wrap"
                      placeholder={
                        "Write the description line by line. Press Enter for a new line, or press Enter twice to start a new paragraph."
                      }
                      data-testid={`input-item-description-${index}`}
                    />

                    <p className="mt-2 text-xs text-muted-foreground">
                      Line breaks and blank paragraphs are preserved when the
                      record is saved and printed.
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cheque Summary</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Cheque Amount</p>
                <h3 className="mt-2 text-2xl font-bold">
                  {formatAmount(chequeValue)}
                </h3>
              </div>

              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">
                  Total Item Amount
                </p>
                <h3 className="mt-2 text-2xl font-bold">
                  {formatAmount(totalItemAmount)}
                </h3>
              </div>

              <div
                className={`rounded-xl border p-4 ${
                  isExceeded
                    ? "border-red-200 bg-red-50"
                    : remainingBalance === 0 && chequeValue > 0
                      ? "border-emerald-200 bg-emerald-50"
                      : "bg-muted/30"
                }`}
              >
                <p
                  className={`text-sm ${
                    isExceeded
                      ? "text-red-600"
                      : remainingBalance === 0 && chequeValue > 0
                        ? "text-emerald-700"
                        : "text-muted-foreground"
                  }`}
                >
                  Remaining Balance
                </p>

                <h3
                  className={`mt-2 text-2xl font-bold ${
                    isExceeded
                      ? "text-red-700"
                      : remainingBalance === 0 && chequeValue > 0
                        ? "text-emerald-700"
                        : "text-foreground"
                  }`}
                >
                  {formatAmount(remainingBalance)}
                </h3>
              </div>
            </div>

            {isExceeded && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                The total item amount exceeds the cheque amount. Cheque amount
                is not sufficient for the entered items.
              </div>
            )}

            {duplicateChequeWarning && (
              <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                {duplicateChequeWarning} You can still save this record.
              </div>
            )}

            {submitError && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {submitError}
              </div>
            )}

            {lastSavedRecord && (
              <div className="mt-5 flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="font-medium text-emerald-800">
                  Last saved record: Cheque {lastSavedRecord.chequeNumber}
                  {lastSavedRecord.statementTitle
                    ? ` - ${lastSavedRecord.statementTitle}`
                    : ""}
                </p>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openRecordPrintout(lastSavedRecord)}
                  data-testid="button-printout-saved-record"
                >
                  Printout
                </Button>
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/accounts")}
                data-testid="button-cancel-record"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={loading || isExceeded || accounts.length === 0}
                data-testid="button-save-record"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Saving...
                  </>
                ) : (
                  "Save Record"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <Dialog open={showSavedDialog} onOpenChange={setShowSavedDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Saved</DialogTitle>
            <DialogDescription>
              The record was saved successfully. You can print it now or
              later from the Record List.
            </DialogDescription>
          </DialogHeader>

          {lastSavedRecord && (
            <div className="grid grid-cols-2 gap-3 rounded-xl border bg-muted/40 p-4 text-sm">
              <div>
                <p className="text-muted-foreground">Cheque Number</p>
                <p className="font-medium">{lastSavedRecord.chequeNumber}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">{lastSavedRecord.selectedDate}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Account</p>
                <p className="font-medium">{lastSavedRecord.accountTitle}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Cheque Amount</p>
                <p className="font-medium">
                  {formatAmount(lastSavedRecord.chequeAmount || 0)}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSavedDialog(false)}
              data-testid="button-close-saved-dialog"
            >
              Close
            </Button>

            <Button
              type="button"
              onClick={() => {
                if (lastSavedRecord) openRecordPrintout(lastSavedRecord);
              }}
              data-testid="button-printout-after-save"
            >
              Printout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
