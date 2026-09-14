// import { useEffect, useMemo, useState } from "react";
// import { collection, getDocs, Timestamp } from "firebase/firestore";
// import {
//   Eye,
//   EyeOff,
//   FileText,
//   Hash,
//   Landmark,
//   Printer,
//   RefreshCw,
//   WalletCards,
// } from "lucide-react";
// import { db } from "@/lib/firebase";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";

// type RecordItem = {
//   category?: string;
//   amount?: number;
//   name?: string;
//   description?: string;
// };

// type FirestoreRecordData = {
//   firebasePath?: string;

//   selectedDate?: string;
//   chequeDate?: string;
//   statementTitle?: string;

//   accountId?: string;
//   accountType?: "cheque" | "online";
//   accountTitle?: string;
//   accountNo?: string;
//   bank?: string;
//   branch?: string;
//   city?: string;
//   platform?: string;
//   routingNumber?: string;

//   chequeNumber?: string;
//   chequeAmount?: number;
//   totalItemAmount?: number;
//   remainingBalance?: number;

//   items?: RecordItem[];

//   createdBy?: string;
//   createdByName?: string;
//   createdAt?: Timestamp;
//   updatedAt?: Timestamp;
//   status?: string;
// };

// type RecordRow = FirestoreRecordData & {
//   id: string;
// };

// const RECORD_COLLECTION_PATH = ["Panels", "IEDGE-SYSTEM", "Record"] as const;

// const getStatusClasses = (status?: string): string => {
//   const normalizedStatus = status?.trim().toLowerCase();

//   if (normalizedStatus === "active" || normalizedStatus === "approved") {
//     return "border-emerald-200 bg-emerald-50 text-emerald-700";
//   }

//   if (normalizedStatus === "rejected" || normalizedStatus === "inactive") {
//     return "border-red-200 bg-red-50 text-red-700";
//   }

//   if (normalizedStatus === "pending") {
//     return "border-amber-200 bg-amber-50 text-amber-700";
//   }

//   return "border-border bg-muted/40 text-muted-foreground";
// };

// export default function RecordList() {
//   const [records, setRecords] = useState<RecordRow[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [searchText, setSearchText] = useState<string>("");
//   const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

//   const formatAmount = (value?: number): string => {
//     return Number(value || 0).toLocaleString("en-US", {
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 2,
//     });
//   };

//   const formatDate = (timestamp?: Timestamp): string => {
//     if (!timestamp) return "-";

//     try {
//       return timestamp.toDate().toLocaleString("en-US", {
//         year: "numeric",
//         month: "short",
//         day: "2-digit",
//         hour: "2-digit",
//         minute: "2-digit",
//       });
//     } catch {
//       return "-";
//     }
//   };

//   const formatDateOnly = (value?: string): string => {
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

//   const getRecordDate = (record: RecordRow): string => {
//     if (record.selectedDate || record.chequeDate) {
//       return formatDateOnly(record.selectedDate || record.chequeDate);
//     }

//     if (record.createdAt) {
//       try {
//         return record.createdAt.toDate().toLocaleDateString("en-US", {
//           year: "numeric",
//           month: "short",
//           day: "2-digit",
//         });
//       } catch {
//         return "-";
//       }
//     }

//     return "-";
//   };

//   const escapeHtml = (value: unknown): string => {
//     return String(value ?? "-")
//       .replace(/&/g, "&amp;")
//       .replace(/</g, "&lt;")
//       .replace(/>/g, "&gt;")
//       .replace(/"/g, "&quot;")
//       .replace(/'/g, "&#039;");
//   };

//   const fetchRecords = async () => {
//     try {
//       setLoading(true);

//       const snapshot = await getDocs(collection(db, ...RECORD_COLLECTION_PATH));

//       const recordList: RecordRow[] = snapshot.docs.map((document) => {
//         const data = document.data() as FirestoreRecordData;

//         return {
//           id: document.id,
//           ...data,
//           items: Array.isArray(data.items) ? data.items : [],
//         };
//       });

//       recordList.sort((a, b) => {
//         const aTime = a.createdAt?.toDate?.().getTime?.() || 0;
//         const bTime = b.createdAt?.toDate?.().getTime?.() || 0;

//         return bTime - aTime;
//       });

//       setRecords(recordList);
//     } catch (error) {
//       console.error("Failed to fetch records:", error);
//       setRecords([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     void fetchRecords();
//   }, []);

//   const filteredRecords = useMemo(() => {
//     const query = searchText.trim().toLowerCase();

//     if (!query) return records;

//     return records.filter((record) => {
//       const searchableText = [
//         record.statementTitle,
//         record.selectedDate,
//         record.chequeDate,
//         record.accountTitle,
//         record.accountNo,
//         record.accountId,
//         record.bank,
//         record.branch,
//         record.city,
//         record.platform,
//         record.routingNumber,
//         record.chequeNumber,
//         record.accountType,
//         record.createdBy,
//         record.createdByName,
//         record.status,
//         record.id,
//         ...(record.items || []).flatMap((item) => [
//           item.category,
//           item.name,
//           item.description,
//         ]),
//       ]
//         .filter(Boolean)
//         .join(" ")
//         .toLowerCase();

//       return searchableText.includes(query);
//     });
//   }, [records, searchText]);

//   const summary = useMemo(() => {
//     return filteredRecords.reduce(
//       (total, record) => {
//         total.chequeAmount += Number(record.chequeAmount || 0);
//         total.totalItemAmount += Number(record.totalItemAmount || 0);
//         total.remainingBalance += Number(record.remainingBalance || 0);

//         return total;
//       },
//       {
//         chequeAmount: 0,
//         totalItemAmount: 0,
//         remainingBalance: 0,
//       },
//     );
//   }, [filteredRecords]);

//   const toggleExpand = (recordId: string) => {
//     setExpandedRecordId((currentId) =>
//       currentId === recordId ? null : recordId,
//     );
//   };

//   const handlePrintRecord = (record: RecordRow) => {
//     const printWindow = window.open(
//       "",
//       "_blank",
//       "width=1100,height=850,scrollbars=yes,resizable=yes",
//     );

//     if (!printWindow) {
//       window.alert(
//         "The print window was blocked. Please allow pop-ups and try again.",
//       );
//       return;
//     }

//     const items = Array.isArray(record.items) ? record.items : [];
//     const documentReference =
//       record.chequeNumber?.trim() || record.id.slice(0, 10).toUpperCase();

//     const accountLocation = [record.branch, record.city]
//       .filter(Boolean)
//       .join(", ");

//     const accountProvider =
//       record.accountType === "online"
//         ? record.platform || record.bank
//         : record.bank;

//     const additionalAccountDetail =
//       record.accountType === "online"
//         ? record.routingNumber
//           ? `Routing No: ${record.routingNumber}`
//           : ""
//         : accountLocation;

//     const itemRows =
//       items.length > 0
//         ? items
//             .map(
//               (item, index) => `
//                 <tr>
//                   <td class="serial-column">${index + 1}</td>
//                   <td><span class="cell-primary">${escapeHtml(item.category || "-")}</span></td>
//                   <td><span class="cell-primary">${escapeHtml(item.name || "-")}</span></td>
//                   <td><div class="description-text">${escapeHtml(item.description || "-")}</div></td>
//                   <td class="amount-column">${escapeHtml(formatAmount(item.amount))}</td>
//                 </tr>
//               `,
//             )
//             .join("")
//         : `
//             <tr>
//               <td colspan="5" class="empty-row">
//                 No transaction items are available for this document.
//               </td>
//             </tr>
//           `;

//     const printDocument = `
//       <!DOCTYPE html>
//       <html lang="en">
//         <head>
//           <meta charset="UTF-8" />
//           <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//           <title>Payment Record ${escapeHtml(documentReference)}</title>

//           <style>
//             :root {
//               --primary: #17375e;
//               --primary-dark: #102a49;
//               --accent: #d4a64a;
//               --text: #172033;
//               --muted: #667085;
//               --border: #d9e0e8;
//               --surface: #f6f8fb;
//               --white: #ffffff;
//             }

//             * { box-sizing: border-box; }

//             html,
//             body {
//               margin: 0;
//               padding: 0;
//               background: var(--white);
//               color: var(--text);
//               font-family: Inter, "Segoe UI", Arial, Helvetica, sans-serif;
//               font-size: 12px;
//               line-height: 1.5;
//               -webkit-print-color-adjust: exact;
//               print-color-adjust: exact;
//             }

//             body { padding: 24px; }

//             .document {
//               width: 100%;
//               max-width: 1000px;
//               margin: 0 auto;
//               overflow: hidden;
//               border: 1px solid var(--border);
//               background: var(--white);
//               box-shadow: 0 16px 45px rgba(16, 42, 73, 0.1);
//             }

//             .top-accent {
//               height: 6px;
//               background: linear-gradient(90deg, var(--primary) 0%, var(--primary) 76%, var(--accent) 76%, var(--accent) 100%);
//             }

//             .document-header {
//               display: flex;
//               align-items: center;
//               justify-content: space-between;
//               gap: 24px;
//               padding: 25px 38px;
//               background: linear-gradient(135deg, var(--primary), var(--primary-dark));
//               color: var(--white);
//             }

//             .brand-area { display: flex; align-items: center; gap: 13px; }
//             .brand-mark {
//               display: flex;
//               width: 48px;
//               height: 48px;
//               align-items: center;
//               justify-content: center;
//               border: 1px solid rgba(255, 255, 255, 0.32);
//               border-radius: 12px;
//               background: rgba(255, 255, 255, 0.1);
//               font-size: 18px;
//               font-weight: 800;
//             }

//             .brand-name { margin: 0; font-size: 20px; font-weight: 700; }
//             .brand-subtitle {
//               margin: 2px 0 0;
//               color: rgba(255, 255, 255, 0.72);
//               font-size: 8px;
//               font-weight: 600;
//               letter-spacing: 0.14em;
//               text-transform: uppercase;
//             }

//             .document-heading { text-align: right; }
//             .document-type { margin: 0; font-size: 20px; font-weight: 700; }
//             .reference-row { margin-top: 4px; color: rgba(255, 255, 255, 0.78); font-size: 9px; }
//             .reference-value { margin-left: 4px; color: var(--white); font-weight: 700; }

//             .document-body { padding: 25px 38px 34px; }

//             .overview-grid {
//               display: grid;
//               grid-template-columns: repeat(2, minmax(0, 1fr));
//               gap: 12px;
//               margin-bottom: 22px;
//             }

//             .overview-card {
//               padding: 14px 16px;
//               border: 1px solid var(--border);
//               border-radius: 10px;
//               background: var(--surface);
//             }

//             .overview-label {
//               margin-bottom: 4px;
//               color: var(--muted);
//               font-size: 8px;
//               font-weight: 700;
//               letter-spacing: 0.08em;
//               text-transform: uppercase;
//             }

//             .overview-value {
//               color: var(--text);
//               font-size: 11px;
//               font-weight: 700;
//               overflow-wrap: anywhere;
//             }

//             .account-summary {
//               display: grid;
//               grid-template-columns: minmax(0, 1fr) 310px;
//               gap: 50px;
//               margin-bottom: 23px;
//               padding: 0 2px 19px;
//               border-bottom: 1px solid var(--border);
//             }

//             .compact-heading {
//               margin-bottom: 3px;
//               color: var(--primary-dark);
//               font-size: 9px;
//               font-weight: 800;
//               letter-spacing: 0.08em;
//               text-transform: uppercase;
//             }

//             .account-title { margin-bottom: 2px; font-size: 12px; font-weight: 750; }
//             .account-line { color: #344054; font-size: 10px; line-height: 1.45; overflow-wrap: anywhere; }
//             .record-information { justify-self: end; width: 100%; max-width: 310px; }
//             .record-title { margin-bottom: 4px; color: var(--primary-dark); font-size: 10px; font-weight: 800; text-transform: uppercase; }
//             .record-line { display: flex; gap: 5px; color: #344054; font-size: 10px; line-height: 1.45; }
//             .record-label { flex-shrink: 0; font-weight: 500; }
//             .record-value { font-weight: 650; overflow-wrap: anywhere; }

//             .section { margin-top: 22px; }
//             .section-heading { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
//             .section-number {
//               display: flex;
//               width: 25px;
//               height: 25px;
//               align-items: center;
//               justify-content: center;
//               border-radius: 7px;
//               background: var(--primary);
//               color: var(--white);
//               font-size: 9px;
//               font-weight: 700;
//             }

//             .section-title { margin: 0; color: var(--primary-dark); font-size: 14px; font-weight: 700; }
//             .section-line { height: 1px; flex: 1; background: var(--border); }
//             .table-container { overflow: hidden; border: 1px solid var(--border); border-radius: 10px; }
//             table { width: 100%; border-collapse: collapse; table-layout: fixed; }
//             thead { background: var(--primary); color: var(--white); }
//             th {
//               padding: 10px 12px;
//               font-size: 8px;
//               font-weight: 700;
//               letter-spacing: 0.09em;
//               text-align: left;
//               text-transform: uppercase;
//             }

//             td {
//               padding: 11px 12px;
//               border-bottom: 1px solid var(--border);
//               vertical-align: top;
//               overflow-wrap: anywhere;
//             }

//             tbody tr:nth-child(even) { background: var(--surface); }
//             tbody tr:last-child td { border-bottom: none; }
//             .serial-column { width: 45px; color: var(--muted); text-align: center; }
//             thead .serial-column { color: var(--white); }
//             .amount-column { width: 120px; color: var(--primary-dark); font-weight: 700; text-align: right; white-space: nowrap; }
//             .cell-primary { font-weight: 650; }
//             .description-text {
//               display: block;
//               color: #475467;
//               line-height: 1.65;
//               white-space: pre-wrap;
//               overflow-wrap: anywhere;
//             }

//             .empty-row { padding: 25px; color: var(--muted); text-align: center; }
//             .document-footer {
//               display: flex;
//               align-items: center;
//               justify-content: space-between;
//               gap: 16px;
//               margin: 0 38px;
//               padding: 15px 0 20px;
//               border-top: 1px solid var(--border);
//               color: var(--muted);
//               font-size: 8px;
//             }

//             .footer-brand { color: var(--primary); font-weight: 700; letter-spacing: 0.05em; }
//             .confidential-badge {
//               display: inline-flex;
//               padding: 3px 8px;
//               border: 1px solid var(--border);
//               border-radius: 999px;
//               font-size: 7px;
//               font-weight: 700;
//               letter-spacing: 0.08em;
//               text-transform: uppercase;
//             }

//             @page { size: A4; margin: 10mm; }

//             @media print {
//               body { padding: 0; }
//               .document { max-width: none; border: none; box-shadow: none; }
//               .document-header,
//               .overview-card,
//               .account-summary,
//               .table-container,
//               tr { break-inside: avoid; }
//               thead { display: table-header-group; }
//             }
//           </style>
//         </head>

//         <body>
//           <main class="document">
//             <div class="top-accent"></div>

//             <header class="document-header">
//               <div class="brand-area">
//                 <div class="brand-mark">IE</div>
//                 <div>
//                   <h1 class="brand-name">IEDGE SYSTEM</h1>
//                   <p class="brand-subtitle">Financial Records Management</p>
//                 </div>
//               </div>

//               <div class="document-heading">
//                 <h2 class="document-type">Payment Record</h2>
//                 <div class="reference-row">
//                   Reference:
//                   <span class="reference-value">${escapeHtml(documentReference)}</span>
//                 </div>
//               </div>
//             </header>

//             <div class="document-body">
//               <div class="overview-grid">
//                 <div class="overview-card">
//                   <div class="overview-label">Statement Title</div>
//                   <div class="overview-value">${escapeHtml(record.statementTitle || "-")}</div>
//                 </div>

//                 <div class="overview-card">
//                   <div class="overview-label">Record Date</div>
//                   <div class="overview-value">${escapeHtml(getRecordDate(record))}</div>
//                 </div>

//                 <div class="overview-card">
//                   <div class="overview-label">Created By</div>
//                   <div class="overview-value">${escapeHtml(record.createdByName || "Unknown User")}</div>
//                 </div>

//                 <div class="overview-card">
//                   <div class="overview-label">Status</div>
//                   <div class="overview-value">${escapeHtml(record.status || "-")}</div>
//                 </div>
//               </div>

//               <section class="account-summary">
//                 <div>
//                   <div class="compact-heading">Account Details</div>
//                   <div class="account-title">${escapeHtml(record.accountTitle || "-")}</div>
//                   ${accountProvider ? `<div class="account-line">${escapeHtml(accountProvider)}</div>` : ""}
//                   ${record.accountNo ? `<div class="account-line">Account No: ${escapeHtml(record.accountNo)}</div>` : ""}
//                   ${additionalAccountDetail ? `<div class="account-line">${escapeHtml(additionalAccountDetail)}</div>` : ""}
//                 </div>

//                 <div class="record-information">
//                   <div class="record-title">Payment Information</div>
//                   <div class="record-line"><span class="record-label">Account Type:</span><span class="record-value">${escapeHtml(record.accountType?.toUpperCase() || "-")}</span></div>
//                   <div class="record-line"><span class="record-label">Cheque Number:</span><span class="record-value">${escapeHtml(record.chequeNumber || "-")}</span></div>
//                   <div class="record-line"><span class="record-label">Cheque Amount:</span><span class="record-value">${escapeHtml(formatAmount(record.chequeAmount))}</span></div>
//                   <div class="record-line"><span class="record-label">Item Total:</span><span class="record-value">${escapeHtml(formatAmount(record.totalItemAmount))}</span></div>
//                   <div class="record-line"><span class="record-label">Remaining:</span><span class="record-value">${escapeHtml(formatAmount(record.remainingBalance))}</span></div>
//                 </div>
//               </section>

//               <section class="section">
//                 <div class="section-heading">
//                   <span class="section-number">01</span>
//                   <h3 class="section-title">Transaction Items</h3>
//                   <div class="section-line"></div>
//                 </div>

//                 <div class="table-container">
//                   <table>
//                     <colgroup>
//                       <col style="width: 45px" />
//                       <col style="width: 18%" />
//                       <col style="width: 22%" />
//                       <col />
//                       <col style="width: 120px" />
//                     </colgroup>
//                     <thead>
//                       <tr>
//                         <th class="serial-column">No.</th>
//                         <th>Category</th>
//                         <th>Name</th>
//                         <th>Description</th>
//                         <th style="text-align: right">Amount</th>
//                       </tr>
//                     </thead>
//                     <tbody>${itemRows}</tbody>
//                   </table>
//                 </div>
//               </section>
//             </div>

//             <footer class="document-footer">
//               <span class="footer-brand">IEDGE SYSTEM · OFFICIAL PAYMENT RECORD</span>
//               <span>Printed ${escapeHtml(
//                 new Date().toLocaleString("en-US", {
//                   year: "numeric",
//                   month: "short",
//                   day: "2-digit",
//                   hour: "2-digit",
//                   minute: "2-digit",
//                 }),
//               )}</span>
//               <span class="confidential-badge">Internal Document</span>
//             </footer>
//           </main>
//         </body>
//       </html>
//     `;

//     printWindow.document.open();
//     printWindow.document.write(printDocument);
//     printWindow.document.close();

//     printWindow.onload = () => {
//       printWindow.focus();

//       window.setTimeout(() => {
//         printWindow.print();
//       }, 250);
//     };
//   };

//   return (
//     <div className="mx-auto max-w-7xl">
//       <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
//         <div>
//           <h2
//             className="mb-2 text-3xl font-bold text-foreground"
//             data-testid="text-record-list-title"
//           >
//             Record List
//           </h2>

//           <p className="text-muted-foreground">
//             View complete record, account, payment, item, and description
//             details.
//           </p>
//         </div>

//         <Button
//           type="button"
//           variant="outline"
//           onClick={() => void fetchRecords()}
//           disabled={loading}
//           className="gap-2"
//           data-testid="button-refresh-records"
//         >
//           <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
//           {loading ? "Refreshing..." : "Refresh"}
//         </Button>
//       </div>

//       <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
//         <Card>
//           <CardContent className="p-5">
//             <p className="text-sm text-muted-foreground">Total Cheque Amount</p>
//             <h3 className="mt-2 text-2xl font-bold">
//               {formatAmount(summary.chequeAmount)}
//             </h3>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="p-5">
//             <p className="text-sm text-muted-foreground">Total Item Amount</p>
//             <h3 className="mt-2 text-2xl font-bold">
//               {formatAmount(summary.totalItemAmount)}
//             </h3>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="p-5">
//             <p className="text-sm text-muted-foreground">
//               Total Remaining Balance
//             </p>
//             <h3 className="mt-2 text-2xl font-bold">
//               {formatAmount(summary.remainingBalance)}
//             </h3>
//           </CardContent>
//         </Card>
//       </div>

//       <Card>
//         <CardHeader>
//           <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
//             <CardTitle>All Records</CardTitle>

//             <div className="w-full md:w-96">
//               <Input
//                 value={searchText}
//                 onChange={(event) => setSearchText(event.target.value)}
//                 placeholder="Search title, account, cheque, name, description..."
//                 data-testid="input-search-records"
//               />
//             </div>
//           </div>
//         </CardHeader>

//         <CardContent>
//           {loading ? (
//             <div className="flex min-h-40 items-center justify-center rounded-xl border bg-muted/30">
//               <p className="text-muted-foreground">Loading records...</p>
//             </div>
//           ) : filteredRecords.length === 0 ? (
//             <div className="flex min-h-40 items-center justify-center rounded-xl border bg-muted/30">
//               <p className="text-muted-foreground">No records found.</p>
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {filteredRecords.map((record) => {
//                 const isExpanded = expandedRecordId === record.id;
//                 const items = record.items || [];

//                 return (
//                   <div
//                     key={record.id}
//                     className="overflow-hidden rounded-2xl border bg-background shadow-sm transition-shadow hover:shadow-md"
//                   >
//                     <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-12 md:items-center">
//                       <div className="md:col-span-3">
//                         <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
//                           Statement / Account
//                         </p>
//                         <p className="mt-1 font-semibold text-foreground">
//                           {record.statementTitle || record.accountTitle || "-"}
//                         </p>
//                         <p className="mt-1 text-sm text-muted-foreground">
//                           {record.accountTitle || "-"} · {record.bank || "-"}
//                         </p>
//                       </div>

//                       <div className="md:col-span-2">
//                         <p className="text-xs text-muted-foreground">
//                           Cheque Number
//                         </p>
//                         <p className="mt-1 font-semibold">
//                           {record.chequeNumber || "-"}
//                         </p>
//                       </div>

//                       <div className="md:col-span-2">
//                         <p className="text-xs text-muted-foreground">
//                           Record Date
//                         </p>
//                         <p className="mt-1 font-semibold">
//                           {getRecordDate(record)}
//                         </p>
//                       </div>

//                       <div className="md:col-span-2">
//                         <p className="text-xs text-muted-foreground">
//                           Cheque Amount
//                         </p>
//                         <p className="mt-1 font-semibold">
//                           {formatAmount(record.chequeAmount)}
//                         </p>
//                       </div>

//                       <div className="md:col-span-1">
//                         <p className="text-xs text-muted-foreground">Items</p>
//                         <p className="mt-1 font-semibold">{items.length}</p>
//                       </div>

//                       <div className="flex flex-wrap gap-2 md:col-span-2 md:justify-end">
//                         <Button
//                           type="button"
//                           variant="outline"
//                           size="sm"
//                           className="gap-2"
//                           onClick={() => toggleExpand(record.id)}
//                           data-testid={`button-view-record-${record.id}`}
//                         >
//                           {isExpanded ? (
//                             <EyeOff className="h-4 w-4" />
//                           ) : (
//                             <Eye className="h-4 w-4" />
//                           )}
//                           {isExpanded ? "Hide" : "View"}
//                         </Button>

//                         <Button
//                           type="button"
//                           size="sm"
//                           className="gap-2"
//                           onClick={() => handlePrintRecord(record)}
//                           data-testid={`button-print-record-${record.id}`}
//                         >
//                           <Printer className="h-4 w-4" />
//                           Print
//                         </Button>
//                       </div>
//                     </div>

//                     {isExpanded && (
//                       <div className="border-t bg-muted/10 p-4 sm:p-6">
//                         <div className="mb-6 flex flex-col gap-4 rounded-2xl border bg-background p-5 lg:flex-row lg:items-start lg:justify-between">
//                           <div className="min-w-0">
//                             <div className="mb-2 flex flex-wrap items-center gap-2">
//                               <span
//                                 className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusClasses(record.status)}`}
//                               >
//                                 {record.status || "Unknown status"}
//                               </span>

//                               <span className="inline-flex rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium capitalize text-muted-foreground">
//                                 {record.accountType || "Unknown account type"}
//                               </span>
//                             </div>

//                             <h3 className="break-words text-xl font-bold text-foreground">
//                               {record.statementTitle || "Untitled Record"}
//                             </h3>

//                             <p className="mt-2 text-sm text-muted-foreground">
//                               Complete payment record and transaction
//                               information.
//                             </p>
//                           </div>

//                           <Button
//                             type="button"
//                             className="gap-2 lg:flex-shrink-0"
//                             onClick={() => handlePrintRecord(record)}
//                           >
//                             <Printer className="h-4 w-4" />
//                             Print Record
//                           </Button>
//                         </div>

//                         <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
//                           <section className="rounded-2xl border bg-background p-5">
//                             <div className="mb-4 flex items-center gap-3">
//                               <div className="rounded-xl bg-primary/10 p-2 text-primary">
//                                 <FileText className="h-5 w-5" />
//                               </div>
//                               <div>
//                                 <h4 className="font-semibold">
//                                   Record Information
//                                 </h4>
//                                 <p className="text-xs text-muted-foreground">
//                                   Main record and audit details
//                                 </p>
//                               </div>
//                             </div>

//                             <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
//                               <DetailField
//                                 label="Statement Title"
//                                 value={record.statementTitle || "-"}
//                               />
//                               <DetailField
//                                 label="Cheque Number"
//                                 value={record.chequeNumber || "-"}
//                               />
//                               <DetailField
//                                 label="Record Date"
//                                 value={getRecordDate(record)}
//                               />
//                               <DetailField
//                                 label="Selected Date"
//                                 value={formatDateOnly(record.selectedDate)}
//                               />
//                               <DetailField
//                                 label="Cheque Date"
//                                 value={formatDateOnly(record.chequeDate)}
//                               />
//                               <DetailField
//                                 label="Created By"
//                                 value={record.createdByName || "Unknown User"}
//                               />
//                               <DetailField
//                                 label="Created At"
//                                 value={formatDate(record.createdAt)}
//                               />
//                               <DetailField
//                                 label="Updated At"
//                                 value={formatDate(record.updatedAt)}
//                               />
//                             </div>
//                           </section>

//                           <section className="rounded-2xl border bg-background p-5">
//                             <div className="mb-4 flex items-center gap-3">
//                               <div className="rounded-xl bg-primary/10 p-2 text-primary">
//                                 <Landmark className="h-5 w-5" />
//                               </div>
//                               <div>
//                                 <h4 className="font-semibold">
//                                   Account Details
//                                 </h4>
//                                 <p className="text-xs text-muted-foreground">
//                                   Complete selected account information
//                                 </p>
//                               </div>
//                             </div>

//                             <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
//                               <DetailField
//                                 label="Account Title"
//                                 value={record.accountTitle || "-"}
//                               />
//                               <DetailField
//                                 label="Account Type"
//                                 value={record.accountType || "-"}
//                                 capitalize
//                               />
//                               <DetailField
//                                 label="Bank"
//                                 value={record.bank || "-"}
//                               />
//                               <DetailField
//                                 label="Account Number"
//                                 value={record.accountNo || "-"}
//                               />

//                               {record.accountType === "cheque" && (
//                                 <>
//                                   <DetailField
//                                     label="Branch"
//                                     value={record.branch || "-"}
//                                   />
//                                   <DetailField
//                                     label="City"
//                                     value={record.city || "-"}
//                                   />
//                                 </>
//                               )}

//                               {record.accountType === "online" && (
//                                 <>
//                                   <DetailField
//                                     label="Platform"
//                                     value={record.platform || "-"}
//                                   />
//                                   <DetailField
//                                     label="Routing Number"
//                                     value={record.routingNumber || "-"}
//                                   />
//                                 </>
//                               )}
//                             </div>
//                           </section>
//                         </div>

//                         <section className="mb-6">
//                           <div className="mb-4 flex items-center gap-3">
//                             <div className="rounded-xl bg-primary/10 p-2 text-primary">
//                               <WalletCards className="h-5 w-5" />
//                             </div>
//                             <div>
//                               <h4 className="font-semibold">Payment Summary</h4>
//                               <p className="text-xs text-muted-foreground">
//                                 Cheque, allocated, and remaining values
//                               </p>
//                             </div>
//                           </div>

//                           <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
//                             <AmountCard
//                               label="Cheque Amount"
//                               value={formatAmount(record.chequeAmount)}
//                             />
//                             <AmountCard
//                               label="Total Item Amount"
//                               value={formatAmount(record.totalItemAmount)}
//                             />
//                             <AmountCard
//                               label="Remaining Balance"
//                               value={formatAmount(record.remainingBalance)}
//                               valueClassName={
//                                 Number(record.remainingBalance || 0) < 0
//                                   ? "text-red-600"
//                                   : "text-emerald-600"
//                               }
//                             />
//                           </div>
//                         </section>

//                         <section className="mb-6 rounded-2xl border bg-background">
//                           <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
//                             <div>
//                               <h4 className="font-semibold">Record Items</h4>
//                               <p className="mt-1 text-sm text-muted-foreground">
//                                 {items.length}{" "}
//                                 {items.length === 1 ? "item" : "items"} in this
//                                 record
//                               </p>
//                             </div>
//                           </div>

//                           <div className="space-y-4 p-4 sm:p-5">
//                             {items.length > 0 ? (
//                               items.map((item, index) => (
//                                 <article
//                                   key={`${record.id}-item-${index}`}
//                                   className="rounded-2xl border bg-muted/10 p-4 sm:p-5"
//                                 >
//                                   <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
//                                     <div className="min-w-0">
//                                       <div className="mb-2 flex flex-wrap items-center gap-2">
//                                         <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">
//                                           {index + 1}
//                                         </span>
//                                         <span className="inline-flex rounded-full border bg-background px-3 py-1 text-xs font-medium">
//                                           {item.category || "Uncategorized"}
//                                         </span>
//                                       </div>

//                                       <h5 className="break-words text-base font-semibold text-foreground">
//                                         {item.name || "Unnamed Item"}
//                                       </h5>
//                                     </div>

//                                     <div className="rounded-xl border bg-background px-4 py-2 text-right sm:flex-shrink-0">
//                                       <p className="text-xs text-muted-foreground">
//                                         Amount
//                                       </p>
//                                       <p className="font-bold text-foreground">
//                                         {formatAmount(item.amount)}
//                                       </p>
//                                     </div>
//                                   </div>

//                                   <div className="mt-4 border-t pt-4">
//                                     <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
//                                       Description
//                                     </p>

//                                     <div className="whitespace-pre-wrap break-words text-sm leading-7 text-foreground">
//                                       {item.description?.trim()
//                                         ? item.description
//                                         : "No description provided."}
//                                     </div>
//                                   </div>
//                                 </article>
//                               ))
//                             ) : (
//                               <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
//                                 No items found in this record.
//                               </div>
//                             )}
//                           </div>
//                         </section>

//                         <section className="rounded-2xl border bg-background p-5">
//                           <div className="mb-4 flex items-center gap-3">
//                             <div className="rounded-xl bg-primary/10 p-2 text-primary">
//                               <Hash className="h-5 w-5" />
//                             </div>
//                             <div>
//                               <h4 className="font-semibold">
//                                 Reference Details
//                               </h4>
//                               <p className="text-xs text-muted-foreground">
//                                 Internal identifiers for this record
//                               </p>
//                             </div>
//                           </div>

//                           <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
//                             <DetailField
//                               label="Record ID"
//                               value={record.id}
//                               breakAll
//                             />
//                             <DetailField
//                               label="Account ID"
//                               value={record.accountId || "-"}
//                               breakAll
//                             />
//                             <DetailField
//                               label="Created By ID"
//                               value={record.createdBy || "-"}
//                               breakAll
//                             />
//                             <DetailField
//                               label="Firebase Path"
//                               value={record.firebasePath || "-"}
//                               breakAll
//                             />
//                           </div>
//                         </section>
//                       </div>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

// type DetailFieldProps = {
//   label: string;
//   value: string;
//   capitalize?: boolean;
//   breakAll?: boolean;
// };

// function DetailField({
//   label,
//   value,
//   capitalize = false,
//   breakAll = false,
// }: DetailFieldProps) {
//   return (
//     <div className="min-w-0 rounded-xl border bg-muted/10 p-3">
//       <p className="text-xs text-muted-foreground">{label}</p>
//       <p
//         className={`mt-1 font-medium text-foreground ${
//           capitalize ? "capitalize" : ""
//         } ${breakAll ? "break-all" : "break-words"}`}
//       >
//         {value}
//       </p>
//     </div>
//   );
// }

// type AmountCardProps = {
//   label: string;
//   value: string;
//   valueClassName?: string;
// };

// function AmountCard({
//   label,
//   value,
//   valueClassName = "text-foreground",
// }: AmountCardProps) {
//   return (
//     <div className="rounded-2xl border bg-background p-5 shadow-sm">
//       <p className="text-sm text-muted-foreground">{label}</p>
//       <p className={`mt-2 text-2xl font-bold ${valueClassName}`}>{value}</p>
//     </div>
//   );
// }


import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import {
  Eye,
  EyeOff,
  FileText,
  Hash,
  Landmark,
  Printer,
  RefreshCw,
  WalletCards,
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type RecordItem = {
  category?: string;
  amount?: number;
  name?: string;
  description?: string;
};

type FirestoreRecordData = {
  firebasePath?: string;

  selectedDate?: string;
  chequeDate?: string;
  statementTitle?: string;

  accountId?: string;
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

  items?: RecordItem[];

  createdBy?: string;
  createdByName?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  status?: string;
};

type RecordRow = FirestoreRecordData & {
  id: string;
};

type PaginationItem = number | "ellipsis";

const RECORD_COLLECTION_PATH = [
  "Panels",
  "IEDGE-SYSTEM",
  "Record",
] as const;

const getStatusClasses = (status?: string): string => {
  const normalizedStatus = status?.trim().toLowerCase();

  if (
    normalizedStatus === "active" ||
    normalizedStatus === "approved"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    normalizedStatus === "rejected" ||
    normalizedStatus === "inactive"
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (normalizedStatus === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-border bg-muted/40 text-muted-foreground";
};

export default function RecordList() {
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>("");

  const [expandedRecordId, setExpandedRecordId] = useState<
    string | null
  >(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [recordsPerPage, setRecordsPerPage] =
    useState<number>(10);

  const formatAmount = (value?: number): string => {
    return Number(value || 0).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (timestamp?: Timestamp): string => {
    if (!timestamp) return "-";

    try {
      return timestamp.toDate().toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
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

  const getRecordDate = (record: RecordRow): string => {
    if (record.selectedDate || record.chequeDate) {
      return formatDateOnly(
        record.selectedDate || record.chequeDate,
      );
    }

    if (record.createdAt) {
      try {
        return record.createdAt
          .toDate()
          .toLocaleDateString("en-US", {
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

  const fetchRecords = async () => {
    try {
      setLoading(true);

      const snapshot = await getDocs(
        collection(db, ...RECORD_COLLECTION_PATH),
      );

      const recordList: RecordRow[] = snapshot.docs.map(
        (document) => {
          const data =
            document.data() as FirestoreRecordData;

          return {
            id: document.id,
            ...data,
            items: Array.isArray(data.items)
              ? data.items
              : [],
          };
        },
      );

      recordList.sort((a, b) => {
        const aTime =
          a.createdAt?.toDate?.().getTime?.() || 0;

        const bTime =
          b.createdAt?.toDate?.().getTime?.() || 0;

        return bTime - aTime;
      });

      setRecords(recordList);
    } catch (error) {
      console.error(
        "Failed to fetch records:",
        error,
      );

      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRecords();
  }, []);

  // =========================
  // FILTER
  // =========================

  const filteredRecords = useMemo(() => {
    const query = searchText
      .trim()
      .toLowerCase();

    if (!query) {
      return records;
    }

    return records.filter((record) => {
      const searchableText = [
        record.statementTitle,
        record.selectedDate,
        record.chequeDate,
        record.accountTitle,
        record.accountNo,
        record.accountId,
        record.bank,
        record.branch,
        record.city,
        record.platform,
        record.routingNumber,
        record.chequeNumber,
        record.accountType,
        record.createdBy,
        record.createdByName,
        record.status,
        record.id,
        ...(record.items || []).flatMap((item) => [
          item.category,
          item.name,
          item.description,
        ]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [records, searchText]);

  // =========================
  // SUMMARY
  // =========================

  const summary = useMemo(() => {
    return filteredRecords.reduce(
      (total, record) => {
        total.chequeAmount += Number(
          record.chequeAmount || 0,
        );

        total.totalItemAmount += Number(
          record.totalItemAmount || 0,
        );

        total.remainingBalance += Number(
          record.remainingBalance || 0,
        );

        return total;
      },
      {
        chequeAmount: 0,
        totalItemAmount: 0,
        remainingBalance: 0,
      },
    );
  }, [filteredRecords]);

  // =========================
  // PAGINATION
  // =========================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredRecords.length / recordsPerPage,
    ),
  );

  const paginatedRecords = useMemo(() => {
    const startIndex =
      (currentPage - 1) * recordsPerPage;

    const endIndex =
      startIndex + recordsPerPage;

    return filteredRecords.slice(
      startIndex,
      endIndex,
    );
  }, [
    filteredRecords,
    currentPage,
    recordsPerPage,
  ]);

  const paginationStart =
    filteredRecords.length === 0
      ? 0
      : (currentPage - 1) *
          recordsPerPage +
        1;

  const paginationEnd = Math.min(
    currentPage * recordsPerPage,
    filteredRecords.length,
  );

  const paginationPages =
    useMemo<PaginationItem[]>(() => {
      const pages: PaginationItem[] = [];

      // Show all pages if total is small
      if (totalPages <= 7) {
        for (
          let page = 1;
          page <= totalPages;
          page += 1
        ) {
          pages.push(page);
        }

        return pages;
      }

      // Beginning pages
      if (currentPage <= 4) {
        return [
          1,
          2,
          3,
          4,
          5,
          "ellipsis",
          totalPages,
        ];
      }

      // Ending pages
      if (
        currentPage >=
        totalPages - 3
      ) {
        return [
          1,
          "ellipsis",
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        ];
      }

      // Middle pages
      return [
        1,
        "ellipsis",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "ellipsis",
        totalPages,
      ];
    }, [currentPage, totalPages]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
    setExpandedRecordId(null);
  }, [searchText]);

  // Reset page when rows per page changes
  useEffect(() => {
    setCurrentPage(1);
    setExpandedRecordId(null);
  }, [recordsPerPage]);

  // Keep page valid
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handlePageChange = (
    page: number,
  ) => {
    if (
      page < 1 ||
      page > totalPages
    ) {
      return;
    }

    setCurrentPage(page);
    setExpandedRecordId(null);
  };

  const toggleExpand = (
    recordId: string,
  ) => {
    setExpandedRecordId(
      (currentId) =>
        currentId === recordId
          ? null
          : recordId,
    );
  };

  // =========================
  // PRINT
  // =========================

  const handlePrintRecord = (
    record: RecordRow,
  ) => {
    const printWindow = window.open(
      "",
      "_blank",
      "width=1100,height=850,scrollbars=yes,resizable=yes",
    );

    if (!printWindow) {
      window.alert(
        "The print window was blocked. Please allow pop-ups and try again.",
      );

      return;
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
  };

  return (
    <div className="mx-auto max-w-7xl">
      {/* HEADER */}

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2
            className="mb-2 text-3xl font-bold text-foreground"
            data-testid="text-record-list-title"
          >
            Record List
          </h2>

          <p className="text-muted-foreground">
            View complete record, account, payment,
            item, and description details.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            void fetchRecords()
          }
          disabled={loading}
          className="gap-2"
          data-testid="button-refresh-records"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loading
                ? "animate-spin"
                : ""
            }`}
          />

          {loading
            ? "Refreshing..."
            : "Refresh"}
        </Button>
      </div>

      {/* SUMMARY */}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              Total Cheque Amount
            </p>

            <h3 className="mt-2 text-2xl font-bold">
              {formatAmount(
                summary.chequeAmount,
              )}
            </h3>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              Total Item Amount
            </p>

            <h3 className="mt-2 text-2xl font-bold">
              {formatAmount(
                summary.totalItemAmount,
              )}
            </h3>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              Total Remaining Balance
            </p>

            <h3 className="mt-2 text-2xl font-bold">
              {formatAmount(
                summary.remainingBalance,
              )}
            </h3>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>
                All Records
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                {filteredRecords.length}{" "}
                {filteredRecords.length === 1
                  ? "record"
                  : "records"}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
              {/* SEARCH */}

              <div className="w-full md:w-96">
                <Input
                  value={searchText}
                  onChange={(event) =>
                    setSearchText(
                      event.target.value,
                    )
                  }
                  placeholder="Search title, account, cheque, name, description..."
                  data-testid="input-search-records"
                />
              </div>

              {/* ROWS PER PAGE */}

              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap text-sm text-muted-foreground">
                  Rows
                </span>

                <select
                  value={recordsPerPage}
                  onChange={(event) =>
                    setRecordsPerPage(
                      Number(
                        event.target.value,
                      ),
                    )
                  }
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Records per page"
                >
                  <option value={5}>
                    5
                  </option>

                  <option value={10}>
                    10
                  </option>

                  <option value={20}>
                    20
                  </option>

                  <option value={50}>
                    50
                  </option>

                  <option value={100}>
                    100
                  </option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex min-h-40 items-center justify-center rounded-xl border bg-muted/30">
              <p className="text-muted-foreground">
                Loading records...
              </p>
            </div>
          ) : filteredRecords.length ===
            0 ? (
            <div className="flex min-h-40 items-center justify-center rounded-xl border bg-muted/30">
              <p className="text-muted-foreground">
                No records found.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedRecords.map(
                  (record) => {
                    const isExpanded =
                      expandedRecordId ===
                      record.id;

                    const items =
                      record.items || [];

                    return (
                      <div
                        key={record.id}
                        className="overflow-hidden rounded-2xl border bg-background shadow-sm transition-shadow hover:shadow-md"
                      >
                        {/* MAIN RECORD */}

                        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-12 md:items-center">
                          <div className="md:col-span-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Statement /
                              Account
                            </p>

                            <p className="mt-1 font-semibold text-foreground">
                              {record.statementTitle ||
                                record.accountTitle ||
                                "-"}
                            </p>

                            <p className="mt-1 text-sm text-muted-foreground">
                              {record.accountTitle ||
                                "-"}{" "}
                              ·{" "}
                              {record.bank ||
                                "-"}
                            </p>
                          </div>

                          <div className="md:col-span-2">
                            <p className="text-xs text-muted-foreground">
                              Cheque Number
                            </p>

                            <p className="mt-1 font-semibold">
                              {record.chequeNumber ||
                                "-"}
                            </p>
                          </div>

                          <div className="md:col-span-2">
                            <p className="text-xs text-muted-foreground">
                              Record Date
                            </p>

                            <p className="mt-1 font-semibold">
                              {getRecordDate(
                                record,
                              )}
                            </p>
                          </div>

                          <div className="md:col-span-2">
                            <p className="text-xs text-muted-foreground">
                              Cheque Amount
                            </p>

                            <p className="mt-1 font-semibold">
                              {formatAmount(
                                record.chequeAmount,
                              )}
                            </p>
                          </div>

                          <div className="md:col-span-1">
                            <p className="text-xs text-muted-foreground">
                              Items
                            </p>

                            <p className="mt-1 font-semibold">
                              {
                                items.length
                              }
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 md:col-span-2 md:justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() =>
                                toggleExpand(
                                  record.id,
                                )
                              }
                              data-testid={`button-view-record-${record.id}`}
                            >
                              {isExpanded ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}

                              {isExpanded
                                ? "Hide"
                                : "View"}
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              className="gap-2"
                              onClick={() =>
                                handlePrintRecord(
                                  record,
                                )
                              }
                              data-testid={`button-print-record-${record.id}`}
                            >
                              <Printer className="h-4 w-4" />

                              Print
                            </Button>
                          </div>
                        </div>

                        {/* EXPANDED */}

                        {isExpanded && (
                          <div className="border-t bg-muted/10 p-4 sm:p-6">
                            <div className="mb-6 flex flex-col gap-4 rounded-2xl border bg-background p-5 lg:flex-row lg:items-start lg:justify-between">
                              <div className="min-w-0">
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                  <span
                                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusClasses(
                                      record.status,
                                    )}`}
                                  >
                                    {record.status ||
                                      "Unknown status"}
                                  </span>

                                  <span className="inline-flex rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium capitalize text-muted-foreground">
                                    {record.accountType ||
                                      "Unknown account type"}
                                  </span>
                                </div>

                                <h3 className="break-words text-xl font-bold text-foreground">
                                  {record.statementTitle ||
                                    "Untitled Record"}
                                </h3>

                                <p className="mt-2 text-sm text-muted-foreground">
                                  Complete payment
                                  record and
                                  transaction
                                  information.
                                </p>
                              </div>

                              <Button
                                type="button"
                                className="gap-2 lg:flex-shrink-0"
                                onClick={() =>
                                  handlePrintRecord(
                                    record,
                                  )
                                }
                              >
                                <Printer className="h-4 w-4" />

                                Print Record
                              </Button>
                            </div>

                            {/* RECORD + ACCOUNT */}

                            <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
                              <section className="rounded-2xl border bg-background p-5">
                                <div className="mb-4 flex items-center gap-3">
                                  <div className="rounded-xl bg-primary/10 p-2 text-primary">
                                    <FileText className="h-5 w-5" />
                                  </div>

                                  <div>
                                    <h4 className="font-semibold">
                                      Record
                                      Information
                                    </h4>

                                    <p className="text-xs text-muted-foreground">
                                      Main record
                                      and audit
                                      details
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                                  <DetailField
                                    label="Statement Title"
                                    value={
                                      record.statementTitle ||
                                      "-"
                                    }
                                  />

                                  <DetailField
                                    label="Cheque Number"
                                    value={
                                      record.chequeNumber ||
                                      "-"
                                    }
                                  />

                                  <DetailField
                                    label="Record Date"
                                    value={getRecordDate(
                                      record,
                                    )}
                                  />

                                  <DetailField
                                    label="Selected Date"
                                    value={formatDateOnly(
                                      record.selectedDate,
                                    )}
                                  />

                                  <DetailField
                                    label="Cheque Date"
                                    value={formatDateOnly(
                                      record.chequeDate,
                                    )}
                                  />

                                  <DetailField
                                    label="Created By"
                                    value={
                                      record.createdByName ||
                                      "Unknown User"
                                    }
                                  />

                                  <DetailField
                                    label="Created At"
                                    value={formatDate(
                                      record.createdAt,
                                    )}
                                  />

                                  <DetailField
                                    label="Updated At"
                                    value={formatDate(
                                      record.updatedAt,
                                    )}
                                  />
                                </div>
                              </section>

                              <section className="rounded-2xl border bg-background p-5">
                                <div className="mb-4 flex items-center gap-3">
                                  <div className="rounded-xl bg-primary/10 p-2 text-primary">
                                    <Landmark className="h-5 w-5" />
                                  </div>

                                  <div>
                                    <h4 className="font-semibold">
                                      Account
                                      Details
                                    </h4>

                                    <p className="text-xs text-muted-foreground">
                                      Complete
                                      selected account
                                      information
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                                  <DetailField
                                    label="Account Title"
                                    value={
                                      record.accountTitle ||
                                      "-"
                                    }
                                  />

                                  <DetailField
                                    label="Account Type"
                                    value={
                                      record.accountType ||
                                      "-"
                                    }
                                    capitalize
                                  />

                                  <DetailField
                                    label="Bank"
                                    value={
                                      record.bank ||
                                      "-"
                                    }
                                  />

                                  <DetailField
                                    label="Account Number"
                                    value={
                                      record.accountNo ||
                                      "-"
                                    }
                                  />

                                  {record.accountType ===
                                    "cheque" && (
                                    <>
                                      <DetailField
                                        label="Branch"
                                        value={
                                          record.branch ||
                                          "-"
                                        }
                                      />

                                      <DetailField
                                        label="City"
                                        value={
                                          record.city ||
                                          "-"
                                        }
                                      />
                                    </>
                                  )}

                                  {record.accountType ===
                                    "online" && (
                                    <>
                                      <DetailField
                                        label="Platform"
                                        value={
                                          record.platform ||
                                          "-"
                                        }
                                      />

                                      <DetailField
                                        label="Routing Number"
                                        value={
                                          record.routingNumber ||
                                          "-"
                                        }
                                      />
                                    </>
                                  )}
                                </div>
                              </section>
                            </div>

                            {/* PAYMENT SUMMARY */}

                            <section className="mb-6">
                              <div className="mb-4 flex items-center gap-3">
                                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                                  <WalletCards className="h-5 w-5" />
                                </div>

                                <div>
                                  <h4 className="font-semibold">
                                    Payment
                                    Summary
                                  </h4>

                                  <p className="text-xs text-muted-foreground">
                                    Cheque,
                                    allocated, and
                                    remaining
                                    values
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <AmountCard
                                  label="Cheque Amount"
                                  value={formatAmount(
                                    record.chequeAmount,
                                  )}
                                />

                                <AmountCard
                                  label="Total Item Amount"
                                  value={formatAmount(
                                    record.totalItemAmount,
                                  )}
                                />

                                <AmountCard
                                  label="Remaining Balance"
                                  value={formatAmount(
                                    record.remainingBalance,
                                  )}
                                  valueClassName={
                                    Number(
                                      record.remainingBalance ||
                                        0,
                                    ) < 0
                                      ? "text-red-600"
                                      : "text-emerald-600"
                                  }
                                />
                              </div>
                            </section>

                            {/* ITEMS */}

                            <section className="mb-6 rounded-2xl border bg-background">
                              <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <h4 className="font-semibold">
                                    Record Items
                                  </h4>

                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {
                                      items.length
                                    }{" "}
                                    {items.length ===
                                    1
                                      ? "item"
                                      : "items"}{" "}
                                    in this
                                    record
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-4 p-4 sm:p-5">
                                {items.length >
                                0 ? (
                                  items.map(
                                    (
                                      item,
                                      index,
                                    ) => (
                                      <article
                                        key={`${record.id}-item-${index}`}
                                        className="rounded-2xl border bg-muted/10 p-4 sm:p-5"
                                      >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                          <div className="min-w-0">
                                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">
                                                {index +
                                                  1}
                                              </span>

                                              <span className="inline-flex rounded-full border bg-background px-3 py-1 text-xs font-medium">
                                                {item.category ||
                                                  "Uncategorized"}
                                              </span>
                                            </div>

                                            <h5 className="break-words text-base font-semibold text-foreground">
                                              {item.name ||
                                                "Unnamed Item"}
                                            </h5>
                                          </div>

                                          <div className="rounded-xl border bg-background px-4 py-2 text-right sm:flex-shrink-0">
                                            <p className="text-xs text-muted-foreground">
                                              Amount
                                            </p>

                                            <p className="font-bold text-foreground">
                                              {formatAmount(
                                                item.amount,
                                              )}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="mt-4 border-t pt-4">
                                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Description
                                          </p>

                                          <div className="whitespace-pre-wrap break-words text-sm leading-7 text-foreground">
                                            {item.description?.trim()
                                              ? item.description
                                              : "No description provided."}
                                          </div>
                                        </div>
                                      </article>
                                    ),
                                  )
                                ) : (
                                  <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                                    No items
                                    found in this
                                    record.
                                  </div>
                                )}
                              </div>
                            </section>

                            {/* REFERENCES */}

                            <section className="rounded-2xl border bg-background p-5">
                              <div className="mb-4 flex items-center gap-3">
                                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                                  <Hash className="h-5 w-5" />
                                </div>

                                <div>
                                  <h4 className="font-semibold">
                                    Reference
                                    Details
                                  </h4>

                                  <p className="text-xs text-muted-foreground">
                                    Internal
                                    identifiers for
                                    this record
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                                <DetailField
                                  label="Record ID"
                                  value={
                                    record.id
                                  }
                                  breakAll
                                />

                                <DetailField
                                  label="Account ID"
                                  value={
                                    record.accountId ||
                                    "-"
                                  }
                                  breakAll
                                />

                                <DetailField
                                  label="Created By ID"
                                  value={
                                    record.createdBy ||
                                    "-"
                                  }
                                  breakAll
                                />

                                <DetailField
                                  label="Firebase Path"
                                  value={
                                    record.firebasePath ||
                                    "-"
                                  }
                                  breakAll
                                />
                              </div>
                            </section>
                          </div>
                        )}
                      </div>
                    );
                  },
                )}
              </div>

              {/* PAGINATION */}

              <div className="mt-6 flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                {/* RECORD COUNT */}

                <div className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-semibold text-foreground">
                    {paginationStart}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-foreground">
                    {paginationEnd}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-foreground">
                    {
                      filteredRecords.length
                    }
                  </span>{" "}
                  records
                </div>

                {/* PAGE CONTROLS */}

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      currentPage === 1
                    }
                    onClick={() =>
                      handlePageChange(
                        currentPage - 1,
                      )
                    }
                  >
                    Previous
                  </Button>

                  {paginationPages.map(
                    (page, index) => {
                      // Important TypeScript fix
                      if (
                        typeof page !==
                        "number"
                      ) {
                        return (
                          <span
                            key={`ellipsis-${index}`}
                            className="flex h-9 min-w-9 items-center justify-center px-1 text-sm text-muted-foreground"
                          >
                            ...
                          </span>
                        );
                      }

                      // Here TypeScript knows
                      // page is definitely number
                      return (
                        <Button
                          key={page}
                          type="button"
                          variant={
                            currentPage ===
                            page
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          className="min-w-9 px-3"
                          onClick={() =>
                            handlePageChange(
                              page,
                            )
                          }
                        >
                          {page}
                        </Button>
                      );
                    },
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      currentPage ===
                      totalPages
                    }
                    onClick={() =>
                      handlePageChange(
                        currentPage + 1,
                      )
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type DetailFieldProps = {
  label: string;
  value: string;
  capitalize?: boolean;
  breakAll?: boolean;
};

function DetailField({
  label,
  value,
  capitalize = false,
  breakAll = false,
}: DetailFieldProps) {
  return (
    <div className="min-w-0 rounded-xl border bg-muted/10 p-3">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p
        className={`mt-1 font-medium text-foreground ${
          capitalize
            ? "capitalize"
            : ""
        } ${
          breakAll
            ? "break-all"
            : "break-words"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

type AmountCardProps = {
  label: string;
  value: string;
  valueClassName?: string;
};

function AmountCard({
  label,
  value,
  valueClassName = "text-foreground",
}: AmountCardProps) {
  return (
    <div className="rounded-2xl border bg-background p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-bold ${valueClassName}`}
      >
        {value}
      </p>
    </div>
  );
}