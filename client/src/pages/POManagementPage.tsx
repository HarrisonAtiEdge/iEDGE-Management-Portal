// import React, { useEffect, useMemo, useState } from "react";
// import { useLocation } from "wouter";
// import jsPDF from "jspdf";
// import {
//   collection,
//   deleteDoc,
//   doc,
//   onSnapshot,
//   orderBy,
//   query,
//   serverTimestamp,
//   updateDoc,
// } from "firebase/firestore";
// import {
//   AlertTriangle,
//   CheckCircle2,
//   Copy,
//   Eye,
//   FileText,
//   Pencil,
//   Plus,
//   Receipt,
//   Trash2,
//   Wallet,
// } from "lucide-react";
// import {
//   ResponsiveContainer,
//   Bar,
//   BarChart,
//   CartesianGrid,
//   Legend,
//   Tooltip,
//   XAxis,
//   YAxis,
// } from "recharts";

// import { db } from "@/lib/firebase";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import { useToast } from "@/hooks/use-toast";

// const PANEL_ID = "IEDGE-SYSTEM";
// const CREATE_PO_ROUTE = "/create-po";
// const SUPPLIER = "/suppliers";

// const poCollectionRef = collection(db, "Panels", PANEL_ID, "PO");

// type PurchaseOrderStatus = "Draft" | "Open" | "Paid" | "Cancelled" | "Over Due";

// type EstimateLineItem = {
//   service: string;
//   qty: string;
//   rate: string;
//   amount: number;
// };

// type PurchaseOrder = {
//   id: string;
//   poNumber: string;
//   estimateId?: string;
//   estimateNumber: string;
//   supplierId: string;
//   supplierName: string;
//   supplierAddress?: string;
//   issueDate: string;
//   dueDate: string;
//   items: EstimateLineItem[];
//   totalAmount: number;
//   status: PurchaseOrderStatus;
//   notes?: string;
//   source?: "manual" | "budget_request";
//   sourceInvoiceId?: string | null;
//   sourceRequestId?: string | null;
//   sourceProjectName?: string | null;
//   sourceClientName?: string | null;
//   createdAt?: any;
//   updatedAt?: any;
// };

// function formatCurrency(value: number) {
//   return new Intl.NumberFormat("en-PK", {
//     style: "currency",
//     currency: "PKR",
//     maximumFractionDigits: 2,
//   }).format(value || 0);
// }

// function formatNumber(value: number) {
//   return new Intl.NumberFormat("en-PK", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   }).format(value || 0);
// }

// function formatDateDisplay(value: string) {
//   if (!value) return "";
//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return value;
//   return date.toLocaleDateString("en-GB");
// }

// function getStatusBadgeVariant(status: PurchaseOrderStatus) {
//   if (status === "Paid") return "default" as const;
//   if (status === "Cancelled" || status === "Over Due") return "destructive" as const;
//   if (status === "Open") return "secondary" as const;
//   return "outline" as const;
// }

// function isOverDue(po: { dueDate?: string; status: PurchaseOrderStatus }) {
//   if (!po.dueDate) return false;
//   if (po.status === "Paid" || po.status === "Cancelled") return false;
//   const dueDate = new Date(po.dueDate);
//   const today = new Date();
//   dueDate.setHours(0, 0, 0, 0);
//   today.setHours(0, 0, 0, 0);
//   return dueDate < today;
// }

// function asArray(value: any): any[] {
//   return Array.isArray(value) ? value : [];
// }

// function safeText(...values: any[]) {
//   for (const value of values) {
//     if (typeof value === "string" && value.trim()) return value.trim();
//     if (typeof value === "number") return String(value);
//   }
//   return "";
// }

// function safeNumber(...values: any[]) {
//   for (const value of values) {
//     const parsed = Number(value);
//     if (!Number.isNaN(parsed) && Number.isFinite(parsed)) return parsed;
//   }
//   return 0;
// }

// function sanitizeItems(items: EstimateLineItem[]) {
//   return items
//     .map((item) => {
//       const qty = safeNumber(item.qty);
//       const rate = safeNumber(item.rate);
//       return {
//         service: safeText(item.service),
//         qty: qty ? String(qty) : "",
//         rate: rate ? String(rate) : "",
//         amount: safeNumber(item.amount, qty * rate),
//       };
//     })
//     .filter((item) => item.service || item.qty || item.rate || item.amount);
// }

// function getTotal(items: EstimateLineItem[]) {
//   return sanitizeItems(items).reduce((sum, item) => sum + safeNumber(item.amount), 0);
// }

// function escapeHtml(value: string) {
//   return String(value || "")
//     .replace(/&/g, "&amp;")
//     .replace(/</g, "&lt;")
//     .replace(/>/g, "&gt;")
//     .replace(/"/g, "&quot;")
//     .replace(/'/g, "&#039;");
// }

// function openPdfInCenteredPopup(blob: Blob, title: string) {
//   const blobUrl = URL.createObjectURL(blob);
//   const safeTitle = escapeHtml(title || "Purchase Order");
//   const width = 1120;
//   const height = 820;
//   const left = Math.max((window.screen.width - width) / 2, 0);
//   const top = Math.max((window.screen.height - height) / 2, 0);

//   const popup = window.open(
//     "",
//     title,
//     `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
//   );

//   if (!popup) {
//     window.open(blobUrl, "_blank");
//     return;
//   }

//   popup.document.write(`
//     <!doctype html>
//     <html>
//       <head>
//         <title>${safeTitle}</title>
//         <style>
//           * { box-sizing: border-box; }
//           html, body {
//             margin: 0;
//             height: 100%;
//             background: #e5e7eb;
//             font-family: Arial, sans-serif;
//           }
//           .toolbar {
//             height: 58px;
//             display: flex;
//             align-items: center;
//             justify-content: space-between;
//             gap: 14px;
//             padding: 0 18px;
//             background: #0f172a;
//             color: #fff;
//             box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);
//           }
//           .title {
//             font-size: 15px;
//             font-weight: 700;
//             white-space: nowrap;
//             overflow: hidden;
//             text-overflow: ellipsis;
//           }
//           .actions {
//             display: flex;
//             gap: 10px;
//             flex-shrink: 0;
//           }
//           button, a {
//             border: 0;
//             background: #fff;
//             color: #0f172a;
//             padding: 8px 14px;
//             border-radius: 999px;
//             font-size: 13px;
//             font-weight: 700;
//             text-decoration: none;
//             cursor: pointer;
//           }
//           .viewer-wrap {
//             height: calc(100% - 58px);
//             padding: 18px;
//           }
//           iframe {
//             width: 100%;
//             height: 100%;
//             border: 0;
//             border-radius: 14px;
//             background: #fff;
//             box-shadow: 0 10px 30px rgba(15, 23, 42, 0.18);
//           }
//         </style>
//       </head>
//       <body>
//         <div class="toolbar">
//           <div class="title">${safeTitle}</div>
//           <div class="actions">
//             <button onclick="document.querySelector('iframe').contentWindow.print()">Print</button>
//             <a href="${blobUrl}" download="${safeTitle}.pdf">Download</a>
//           </div>
//         </div>
//         <div class="viewer-wrap">
//           <iframe src="${blobUrl}"></iframe>
//         </div>
//       </body>
//     </html>
//   `);
//   popup.document.close();
// }

// function buildPurchaseOrderPdf(po: PurchaseOrder) {
//   const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
//   const pageWidth = pdf.internal.pageSize.getWidth();
//   const pageHeight = pdf.internal.pageSize.getHeight();

//   const margin = 36;
//   const contentWidth = pageWidth - margin * 2;
//   const right = pageWidth - margin;
//   let y = 34;

//   const items = sanitizeItems(po.items);
//   const total = getTotal(items);

//   const colors = {
//     navy: [15, 23, 42] as const,
//     slate: [71, 85, 105] as const,
//     muted: [100, 116, 139] as const,
//     lightText: [226, 232, 240] as const,
//     border: [226, 232, 240] as const,
//     band: [241, 245, 249] as const,
//     soft: [248, 250, 252] as const,
//     white: [255, 255, 255] as const,
//   };

//   function setTextColor(color: readonly [number, number, number]) {
//     pdf.setTextColor(color[0], color[1], color[2]);
//   }

//   function setFillColor(color: readonly [number, number, number]) {
//     pdf.setFillColor(color[0], color[1], color[2]);
//   }

//   function setDrawColor(color: readonly [number, number, number]) {
//     pdf.setDrawColor(color[0], color[1], color[2]);
//   }

//   function textOrDash(value: any) {
//     return safeText(value) || "-";
//   }

//   function checkPageSpace(requiredHeight: number) {
//     if (y + requiredHeight > pageHeight - 58) {
//       pdf.addPage();
//       y = 36;
//       drawPageTopLine();
//     }
//   }

//   function drawPageTopLine() {
//     setDrawColor(colors.border);
//     pdf.line(margin, 26, right, 26);
//   }

//   function drawFooter() {
//     const pageCount = pdf.getNumberOfPages();

//     for (let i = 1; i <= pageCount; i++) {
//       pdf.setPage(i);

//       setDrawColor(colors.border);
//       pdf.line(margin, pageHeight - 34, right, pageHeight - 34);

//       pdf.setFont("helvetica", "normal");
//       pdf.setFontSize(8);
//       setTextColor(colors.muted);
//       pdf.text(`Generated on ${formatDateDisplay(new Date().toISOString())}`, margin, pageHeight - 18);
//       pdf.text(`Page ${i} of ${pageCount}`, right, pageHeight - 18, { align: "right" });
//     }
//   }

//   function drawSectionTitle(title: string) {
//     checkPageSpace(34);
//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(11);
//     setTextColor(colors.navy);
//     pdf.text(title, margin, y);
//     y += 9;
//     setDrawColor(colors.border);
//     pdf.line(margin, y, right, y);
//     y += 16;
//   }

//   function drawInfoGrid(rows: Array<[string, any]>, columns = 2) {
//     const gap = 14;
//     const cellWidth = (contentWidth - gap * (columns - 1)) / columns;
//     const padding = 12;
//     const minHeight = 56;

//     for (let i = 0; i < rows.length; i += columns) {
//       const row = rows.slice(i, i + columns);
//       const rowHeights = row.map(([, value]) => {
//         const lines = pdf.splitTextToSize(textOrDash(value), cellWidth - padding * 2);
//         return Math.max(minHeight, 34 + lines.length * 11);
//       });
//       const rowHeight = Math.max(...rowHeights);
//       checkPageSpace(rowHeight + 10);

//       row.forEach(([label, value], index) => {
//         const x = margin + index * (cellWidth + gap);
//         setFillColor(colors.soft);
//         setDrawColor(colors.border);
//         pdf.roundedRect(x, y, cellWidth, rowHeight, 8, 8, "FD");

//         pdf.setFont("helvetica", "bold");
//         pdf.setFontSize(7.5);
//         setTextColor(colors.muted);
//         pdf.text(label.toUpperCase(), x + padding, y + 18);

//         pdf.setFont("helvetica", "normal");
//         pdf.setFontSize(9.4);
//         setTextColor(colors.navy);
//         const lines = pdf.splitTextToSize(textOrDash(value), cellWidth - padding * 2);
//         pdf.text(lines, x + padding, y + 35);
//       });

//       y += rowHeight + 10;
//     }

//     y += 4;
//   }

//   function drawHeader() {
//     setFillColor(colors.navy);
//     pdf.roundedRect(margin, y, contentWidth, 94, 12, 12, "F");

//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(22);
//     setTextColor(colors.white);
//     pdf.text("PURCHASE ORDER", margin + 22, y + 35);

//     pdf.setFont("helvetica", "normal");
//     pdf.setFontSize(9.5);
//     setTextColor(colors.lightText);
//     pdf.text("iEDGE System", margin + 22, y + 57);

//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(10.5);
//     setTextColor(colors.white);
//     pdf.text(textOrDash(po.poNumber), right - 22, y + 32, { align: "right" });

//     pdf.setFont("helvetica", "normal");
//     pdf.setFontSize(9);
//     setTextColor(colors.lightText);
//     pdf.text(textOrDash(po.status), right - 22, y + 52, { align: "right" });

//     y += 116;
//   }

//   function drawSummaryCards() {
//     const gap = 12;
//     const cardWidth = (contentWidth - gap * 3) / 4;
//     const cardHeight = 68;

//     const cards = [
//       ["P.O.", po.poNumber || "-"],
//       ["Date", formatDateDisplay(po.issueDate) || "-"],
//       ["Due Date", formatDateDisplay(po.dueDate) || "-"],
//       ["Total", `PKR ${formatNumber(total)}`],
//     ];

//     checkPageSpace(cardHeight + 22);

//     cards.forEach(([label, value], index) => {
//       const x = margin + index * (cardWidth + gap);
//       setFillColor(colors.white);
//       setDrawColor(colors.border);
//       pdf.roundedRect(x, y, cardWidth, cardHeight, 10, 10, "FD");

//       pdf.setFont("helvetica", "bold");
//       pdf.setFontSize(7.5);
//       setTextColor(colors.muted);
//       pdf.text(String(label).toUpperCase(), x + 10, y + 18);

//       pdf.setFont("helvetica", "bold");
//       pdf.setFontSize(index === 3 ? 10 : 9);
//       setTextColor(colors.navy);
//       const lines = pdf.splitTextToSize(String(value), cardWidth - 20);
//       pdf.text(lines.slice(0, 2), x + 10, y + 39);
//     });

//     y += cardHeight + 24;
//   }

//   function drawItemsHeader() {
//     checkPageSpace(32);
//     setFillColor(colors.band);
//     setDrawColor(colors.border);
//     pdf.roundedRect(margin, y, contentWidth, 30, 6, 6, "FD");

//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(8);
//     setTextColor(colors.slate);

//     pdf.text("#", margin + 12, y + 19);
//     pdf.text("SERVICE", margin + 44, y + 19);
//     pdf.text("QTY", right - 178, y + 19, { align: "right" });
//     pdf.text("RATE", right - 94, y + 19, { align: "right" });
//     pdf.text("AMOUNT", right - 10, y + 19, { align: "right" });

//     y += 30;
//   }

//   function drawItemsTable() {
//     drawSectionTitle("Items");

//     if (!items.length) {
//       checkPageSpace(44);
//       setFillColor(colors.soft);
//       setDrawColor(colors.border);
//       pdf.roundedRect(margin, y, contentWidth, 42, 8, 8, "FD");
//       pdf.setFont("helvetica", "normal");
//       pdf.setFontSize(9);
//       setTextColor(colors.muted);
//       pdf.text("No items found.", margin + 12, y + 25);
//       y += 54;
//       return;
//     }

//     drawItemsHeader();

//     items.forEach((item, index) => {
//       const serviceLines = pdf.splitTextToSize(textOrDash(item.service), contentWidth - 280);
//       const rowHeight = Math.max(44, 18 + serviceLines.length * 11);

//       if (y + rowHeight > pageHeight - 78) {
//         pdf.addPage();
//         y = 36;
//         drawPageTopLine();
//         drawItemsHeader();
//       }

//       setFillColor(index % 2 === 0 ? colors.white : colors.soft);
//       setDrawColor(colors.border);
//       pdf.rect(margin, y, contentWidth, rowHeight, "FD");

//       pdf.setFont("helvetica", "normal");
//       pdf.setFontSize(8.5);
//       setTextColor(colors.navy);
//       pdf.text(String(index + 1), margin + 12, y + 18);

//       pdf.setFont("helvetica", "normal");
//       pdf.setFontSize(8.7);
//       pdf.text(serviceLines, margin + 44, y + 18);

//       pdf.setFont("helvetica", "normal");
//       pdf.setFontSize(8.5);
//       pdf.text(textOrDash(item.qty), right - 178, y + 18, { align: "right" });
//       pdf.text(formatNumber(safeNumber(item.rate)), right - 94, y + 18, { align: "right" });

//       pdf.setFont("helvetica", "bold");
//       pdf.text(formatNumber(safeNumber(item.amount)), right - 10, y + 18, { align: "right" });

//       y += rowHeight;
//     });

//     y += 18;
//     checkPageSpace(62);

//     setFillColor(colors.navy);
//     pdf.roundedRect(right - 220, y, 220, 44, 8, 8, "F");

//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(8.5);
//     setTextColor(colors.lightText);
//     pdf.text("TOTAL", right - 204, y + 18);

//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(12);
//     setTextColor(colors.white);
//     pdf.text(`PKR ${formatNumber(total)}`, right - 16, y + 30, { align: "right" });

//     y += 66;
//   }

//   function drawApprovalBox() {
//     checkPageSpace(82);
//     drawSectionTitle("Approval");

//     const boxHeight = 64;
//     setFillColor(colors.white);
//     setDrawColor(colors.border);
//     pdf.roundedRect(margin, y, contentWidth, boxHeight, 8, 8, "FD");

//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(8);
//     setTextColor(colors.muted);
//     pdf.text("APPROVED BY", margin + 14, y + 20);
//     pdf.text("DATE", margin + contentWidth / 2 + 14, y + 20);

//     setDrawColor(colors.muted);
//     pdf.line(margin + 14, y + 46, margin + contentWidth / 2 - 18, y + 46);
//     pdf.line(margin + contentWidth / 2 + 14, y + 46, right - 14, y + 46);

//     y += boxHeight + 18;
//   }

//   drawHeader();
//   drawSummaryCards();

//   drawSectionTitle("Supplier Details");
//   drawInfoGrid(
//     [
//       ["Supplier Name", po.supplierName || "-"],
//       ["Supplier Address", po.supplierAddress || po.supplierName || "-"],
//     ],
//     2,
//   );

//   drawSectionTitle("Reference Details");
//   drawInfoGrid(
//     [
//       ["Estimate Number", po.estimateNumber || "-"],
//       ["Status", po.status || "-"],
//       ["Source", po.source === "budget_request" ? "Budget Request" : po.source || "Manual"],
//       ["Budget Request ID", po.sourceRequestId || po.sourceInvoiceId || "-"],
//       ["Project", po.sourceProjectName || "-"],
//       ["Client", po.sourceClientName || "-"],
//       ["Notes", po.notes || "-"],
//     ],
//     2,
//   );

//   drawItemsTable();
//   drawApprovalBox();
//   drawFooter();

//   return pdf;
// }

// function PurchaseOrderView({ po }: { po: PurchaseOrder }) {
//   return (
//     <div className="space-y-5 text-sm">
//       <div className="grid grid-cols-2 gap-4">
//         <div>
//           <p className="text-muted-foreground">P.O.</p>
//           <p className="font-semibold">{po.poNumber}</p>
//         </div>
//         <div>
//           <p className="text-muted-foreground">Status</p>
//           <Badge variant={getStatusBadgeVariant(po.status)}>{po.status}</Badge>
//         </div>
//         <div>
//           <p className="text-muted-foreground">Estimate Number</p>
//           <p className="font-medium">{po.estimateNumber || "-"}</p>
//         </div>
//         <div>
//           <p className="text-muted-foreground">Supplier</p>
//           <p className="font-medium whitespace-pre-line">{po.supplierAddress || po.supplierName}</p>
//         </div>
//         <div>
//           <p className="text-muted-foreground">Date</p>
//           <p className="font-medium">{formatDateDisplay(po.issueDate)}</p>
//         </div>
//       </div>

//       <div className="rounded-2xl border overflow-hidden">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>Service</TableHead>
//               <TableHead className="text-right">Qty</TableHead>
//               <TableHead className="text-right">Rate</TableHead>
//               <TableHead className="text-right">Amount</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {po.items.map((item, index) => (
//               <TableRow key={index}>
//                 <TableCell className="whitespace-pre-line">{item.service || "-"}</TableCell>
//                 <TableCell className="text-right">{item.qty || "-"}</TableCell>
//                 <TableCell className="text-right">{formatNumber(safeNumber(item.rate))}</TableCell>
//                 <TableCell className="text-right">{formatNumber(safeNumber(item.amount))}</TableCell>
//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>
//       </div>

//       <div className="flex justify-end">
//         <div className="w-full max-w-xs rounded-2xl border p-4 bg-muted/30">
//           <div className="flex justify-between font-semibold">
//             <span>Total</span>
//             <span>{formatCurrency(po.totalAmount || 0)}</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default function POManagementPage() {
//   const { toast } = useToast();
//   const [, navigate] = useLocation();

//   const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
//   const [viewDialogOpen, setViewDialogOpen] = useState(false);
//   const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);

//   useEffect(() => {
//     if (localStorage.getItem("createPOFromBudgetRequest")) {
//       navigate(CREATE_PO_ROUTE);
//     }
//   }, [navigate]);

//   useEffect(() => {
//     const unsubscribe = onSnapshot(
//       query(poCollectionRef, orderBy("createdAt", "desc")),
//       (snapshot) => {
//         const rows: PurchaseOrder[] = snapshot.docs.map((docSnap) => {
//           const data = docSnap.data() as Omit<PurchaseOrder, "id">;
//           const items = sanitizeItems(asArray(data.items));
//           const totalAmount = safeNumber(data.totalAmount, getTotal(items));
//           const status = isOverDue({ dueDate: data.dueDate, status: data.status })
//             ? "Over Due"
//             : data.status;

//           return {
//             id: docSnap.id,
//             ...data,
//             items,
//             totalAmount,
//             status,
//           };
//         });
//         setPurchaseOrders(rows);
//       },
//       (error) => console.error("Error loading purchase orders:", error),
//     );

//     return () => unsubscribe();
//   }, []);

//   const totals = useMemo(() => {
//     const totalPayable = purchaseOrders.reduce((sum, item) => sum + safeNumber(item.totalAmount), 0);
//     const overDue = purchaseOrders
//       .filter((item) => item.status === "Over Due")
//       .reduce((sum, item) => sum + safeNumber(item.totalAmount), 0);
//     const open = purchaseOrders
//       .filter((item) => item.status === "Open" || item.status === "Draft")
//       .reduce((sum, item) => sum + safeNumber(item.totalAmount), 0);
//     const paid = purchaseOrders
//       .filter((item) => item.status === "Paid")
//       .reduce((sum, item) => sum + safeNumber(item.totalAmount), 0);
//     return { totalPayable, overDue, open, paid };
//   }, [purchaseOrders]);

//   const chartData = useMemo(() => {
//     const grouped = new Map<string, { date: string; totalPayable: number; overDue: number; open: number; paid: number }>();

//     purchaseOrders.forEach((item) => {
//       const rawDate = item.issueDate || "No Date";
//       const label = rawDate === "No Date"
//         ? rawDate
//         : new Date(rawDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

//       const existing = grouped.get(label) || {
//         date: label,
//         totalPayable: 0,
//         overDue: 0,
//         open: 0,
//         paid: 0,
//       };

//       existing.totalPayable += safeNumber(item.totalAmount);
//       if (item.status === "Over Due") existing.overDue += safeNumber(item.totalAmount);
//       if (item.status === "Open" || item.status === "Draft") existing.open += safeNumber(item.totalAmount);
//       if (item.status === "Paid") existing.paid += safeNumber(item.totalAmount);
//       grouped.set(label, existing);
//     });

//     return Array.from(grouped.values()).slice(-8);
//   }, [purchaseOrders]);

//   const handleCreatePO = () => {
//     navigate(SUPPLIER);
//   };

//   const handleEditPO = (po: PurchaseOrder) => {
//     localStorage.setItem("createPOEditData", JSON.stringify(po));
//     localStorage.removeItem("createPODuplicateData");
//     navigate(CREATE_PO_ROUTE);
//   };

//   const handleDuplicatePO = (po: PurchaseOrder) => {
//     localStorage.setItem("createPODuplicateData", JSON.stringify(po));
//     localStorage.removeItem("createPOEditData");
//     navigate(CREATE_PO_ROUTE);
//   };

//   const handleViewPO = (po: PurchaseOrder) => {
//     setViewingPO(po);
//     setViewDialogOpen(true);
//   };

//   const handleDeletePO = async (poId: string) => {
//     try {
//       await deleteDoc(doc(db, "Panels", PANEL_ID, "PO", poId));
//       toast({ title: "PO deleted", description: "Purchase order removed successfully." });
//     } catch (error) {
//       console.error("Error deleting PO:", error);
//       toast({ title: "Delete failed", description: "Could not delete purchase order.", variant: "destructive" });
//     }
//   };

//   const handleStatusChange = async (poId: string, status: PurchaseOrderStatus) => {
//     try {
//       await updateDoc(doc(db, "Panels", PANEL_ID, "PO", poId), {
//         status,
//         updatedAt: serverTimestamp(),
//       });
//       toast({ title: "Status updated", description: "Purchase order status updated." });
//     } catch (error) {
//       console.error("Error updating status:", error);
//       toast({ title: "Update failed", description: "Could not update status.", variant: "destructive" });
//     }
//   };

//   const handleGeneratePOPdf = (po: PurchaseOrder) => {
//     try {
//       const pdf = buildPurchaseOrderPdf(po);
//       const blob = pdf.output("blob");
//       openPdfInCenteredPopup(blob, po.poNumber || "Purchase Order");
//     } catch (error) {
//       console.error("Error generating PDF:", error);
//       toast({ title: "PDF failed", description: "Could not generate purchase order PDF.", variant: "destructive" });
//     }
//   };

//   return (
//     <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
//       <div className="flex items-center justify-between gap-4 flex-wrap">
//         <div>
//           <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
//           <p className="text-sm text-muted-foreground">
//             PO management only. Create PO now opens on a separate page instead of a popup.
//           </p>
//         </div>

//         <Button className="rounded-2xl" onClick={handleCreatePO}>
//           {/* <Plus className="h-4 w-4 mr-2" /> */}
//           Supplier
//         </Button>
//       </div>

//       <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
//         <div className="xl:col-span-5 space-y-6">
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <Card className="rounded-3xl">
//               <CardContent className="p-5">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm text-muted-foreground">Total Payable</p>
//                     <p className="text-xl font-bold mt-1">{formatCurrency(totals.totalPayable)}</p>
//                   </div>
//                   <Wallet className="h-5 w-5" />
//                 </div>
//               </CardContent>
//             </Card>
//             <Card className="rounded-3xl">
//               <CardContent className="p-5">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm text-muted-foreground">Over Due</p>
//                     <p className="text-xl font-bold mt-1">{formatCurrency(totals.overDue)}</p>
//                   </div>
//                   <AlertTriangle className="h-5 w-5" />
//                 </div>
//               </CardContent>
//             </Card>
//             <Card className="rounded-3xl">
//               <CardContent className="p-5">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm text-muted-foreground">Open / Draft</p>
//                     <p className="text-xl font-bold mt-1">{formatCurrency(totals.open)}</p>
//                   </div>
//                   <FileText className="h-5 w-5" />
//                 </div>
//               </CardContent>
//             </Card>
//             <Card className="rounded-3xl">
//               <CardContent className="p-5">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm text-muted-foreground">Paid</p>
//                     <p className="text-xl font-bold mt-1">{formatCurrency(totals.paid)}</p>
//                   </div>
//                   <CheckCircle2 className="h-5 w-5" />
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </div>

//         <div className="xl:col-span-7">
//           <Card className="rounded-3xl shadow-sm">
//             <CardHeader>
//               <CardTitle>PO Summary Graph</CardTitle>
//               <CardDescription>Date-wise view of total payable, overdue, open and paid values.</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="h-[320px]">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={chartData}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis dataKey="date" />
//                     <YAxis />
//                     <Tooltip formatter={(value: number) => formatCurrency(value)} />
//                     <Legend />
//                     <Bar dataKey="totalPayable" name="Total Payable" radius={[8, 8, 0, 0]} />
//                     <Bar dataKey="overDue" name="Over Due" radius={[8, 8, 0, 0]} />
//                     <Bar dataKey="open" name="Open / Draft" radius={[8, 8, 0, 0]} />
//                     <Bar dataKey="paid" name="Paid" radius={[8, 8, 0, 0]} />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>

//       <Card className="rounded-3xl shadow-sm">
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Receipt className="h-5 w-5" /> Purchase Order List
//           </CardTitle>
//           <CardDescription>All created purchase orders with status and actions.</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="overflow-x-auto rounded-2xl border bg-white">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>P.O.</TableHead>
//                   <TableHead>ESTIMATE #</TableHead>
//                   <TableHead>SUPPLIER</TableHead>
//                   <TableHead>DATE</TableHead>
//                   <TableHead className="text-right">TOTAL</TableHead>
//                   <TableHead>STATUS</TableHead>
//                   <TableHead>ACTION</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {purchaseOrders.length > 0 ? (
//                   purchaseOrders.map((po) => (
//                     <TableRow key={po.id}>
//                       <TableCell className="font-medium">{po.poNumber}</TableCell>
//                       <TableCell>{po.estimateNumber || "-"}</TableCell>
//                       <TableCell>{po.supplierName || "-"}</TableCell>
//                       <TableCell>{formatDateDisplay(po.issueDate) || "-"}</TableCell>
//                       <TableCell className="text-right">{formatCurrency(po.totalAmount || 0)}</TableCell>
//                       <TableCell>
//                         <Select
//                           value={po.status === "Over Due" ? "Over Due" : po.status}
//                           onValueChange={(value) => handleStatusChange(po.id, value as PurchaseOrderStatus)}
//                         >
//                           <SelectTrigger className="w-[130px]">
//                             <SelectValue />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="Draft">Draft</SelectItem>
//                             <SelectItem value="Open">Open</SelectItem>
//                             <SelectItem value="Paid">Paid</SelectItem>
//                             <SelectItem value="Cancelled">Cancelled</SelectItem>
//                             {po.status === "Over Due" && <SelectItem value="Over Due">Over Due</SelectItem>}
//                           </SelectContent>
//                         </Select>
//                       </TableCell>
//                       <TableCell>
//                         <div className="flex flex-wrap gap-2">
//                           <Button size="sm" variant="outline" onClick={() => handleEditPO(po)}>
//                             <Pencil className="h-4 w-4 mr-1" /> Edit
//                           </Button>
//                           <Button size="sm" variant="outline" onClick={() => handleViewPO(po)}>
//                             <Eye className="h-4 w-4 mr-1" /> View
//                           </Button>
//                           <Button size="sm" variant="outline" onClick={() => handleDuplicatePO(po)}>
//                             <Copy className="h-4 w-4 mr-1" /> Duplicate
//                           </Button>
//                           <Button size="sm" variant="outline" onClick={() => handleGeneratePOPdf(po)}>
//                             <FileText className="h-4 w-4 mr-1" /> PDF
//                           </Button>
//                           <Button
//                             size="sm"
//                             variant="ghost"
//                             onClick={() => handleDeletePO(po.id)}
//                             className="text-red-600 hover:text-red-700"
//                           >
//                             <Trash2 className="h-4 w-4 mr-1" /> Delete
//                           </Button>
//                         </div>
//                       </TableCell>
//                     </TableRow>
//                   ))
//                 ) : (
//                   <TableRow>
//                     <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
//                       No purchase orders found.
//                     </TableCell>
//                   </TableRow>
//                 )}
//               </TableBody>
//             </Table>
//           </div>
//         </CardContent>
//       </Card>

//       <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
//         <DialogContent className="max-w-4xl rounded-3xl max-h-[85vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Purchase Order Details</DialogTitle>
//           </DialogHeader>
//           {viewingPO ? <PurchaseOrderView po={viewingPO} /> : null}
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

// import React, { useEffect, useMemo, useState } from "react";
// import { useLocation } from "wouter";
// import jsPDF from "jspdf";
// import {
//   collection,
//   deleteDoc,
//   doc,
//   onSnapshot,
//   orderBy,
//   query,
//   serverTimestamp,
//   updateDoc,
// } from "firebase/firestore";
// import {
//   AlertTriangle,
//   CheckCircle2,
//   Copy,
//   Eye,
//   FileText,
//   Pencil,
//   Plus,
//   Receipt,
//   Trash2,
//   Wallet,
// } from "lucide-react";
// import {
//   ResponsiveContainer,
//   Bar,
//   BarChart,
//   CartesianGrid,
//   Legend,
//   Tooltip,
//   XAxis,
//   YAxis,
// } from "recharts";

// import { db } from "@/lib/firebase";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import { useToast } from "@/hooks/use-toast";

// const PANEL_ID = "IEDGE-SYSTEM";
// const CREATE_PO_ROUTE = "/create-po";
// const SUPPLIER = "/suppliers";

// const poCollectionRef = collection(db, "Panels", PANEL_ID, "PO");

// type PurchaseOrderStatus = "Draft" | "Open" | "Paid" | "Cancelled" | "Over Due";

// type EstimateLineItem = {
//   service: string;
//   qty: string;
//   rate: string;
//   amount: number;
// };

// type PurchaseOrder = {
//   id: string;
//   poNumber: string;
//   estimateId?: string;
//   estimateNumber: string;
//   supplierId: string;
//   supplierName: string;
//   supplierAddress?: string;
//   issueDate: string;
//   dueDate: string;
//   items: EstimateLineItem[];
//   totalAmount: number;
//   status: PurchaseOrderStatus;
//   notes?: string;
//   source?: "manual" | "budget_request";
//   sourceInvoiceId?: string | null;
//   sourceRequestId?: string | null;
//   sourceProjectName?: string | null;
//   sourceClientName?: string | null;
//   createdAt?: any;
//   updatedAt?: any;
// };

// function formatCurrency(value: number) {
//   return new Intl.NumberFormat("en-PK", {
//     style: "currency",
//     currency: "PKR",
//     maximumFractionDigits: 2,
//   }).format(value || 0);
// }

// function formatNumber(value: number) {
//   return new Intl.NumberFormat("en-PK", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   }).format(value || 0);
// }

// function formatDateDisplay(value: string) {
//   if (!value) return "";
//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return value;
//   return date.toLocaleDateString("en-GB");
// }

// function getStatusBadgeVariant(status: PurchaseOrderStatus) {
//   if (status === "Paid") return "default" as const;
//   if (status === "Cancelled" || status === "Over Due") return "destructive" as const;
//   if (status === "Open") return "secondary" as const;
//   return "outline" as const;
// }

// function isOverDue(po: { dueDate?: string; status: PurchaseOrderStatus }) {
//   if (!po.dueDate) return false;
//   if (po.status === "Paid" || po.status === "Cancelled") return false;
//   const dueDate = new Date(po.dueDate);
//   const today = new Date();
//   dueDate.setHours(0, 0, 0, 0);
//   today.setHours(0, 0, 0, 0);
//   return dueDate < today;
// }

// function asArray(value: any): any[] {
//   return Array.isArray(value) ? value : [];
// }

// function safeText(...values: any[]) {
//   for (const value of values) {
//     if (typeof value === "string" && value.trim()) return value.trim();
//     if (typeof value === "number") return String(value);
//   }
//   return "";
// }

// function safeNumber(...values: any[]) {
//   for (const value of values) {
//     const parsed = Number(value);
//     if (!Number.isNaN(parsed) && Number.isFinite(parsed)) return parsed;
//   }
//   return 0;
// }

// function sanitizeItems(items: EstimateLineItem[]) {
//   return items
//     .map((item) => {
//       const qty = safeNumber(item.qty);
//       const rate = safeNumber(item.rate);
//       return {
//         service: safeText(item.service),
//         qty: qty ? String(qty) : "",
//         rate: rate ? String(rate) : "",
//         amount: safeNumber(item.amount, qty * rate),
//       };
//     })
//     .filter((item) => item.service || item.qty || item.rate || item.amount);
// }

// function getTotal(items: EstimateLineItem[]) {
//   return sanitizeItems(items).reduce((sum, item) => sum + safeNumber(item.amount), 0);
// }

// function escapeHtml(value: string) {
//   return String(value || "")
//     .replace(/&/g, "&amp;")
//     .replace(/</g, "&lt;")
//     .replace(/>/g, "&gt;")
//     .replace(/"/g, "&quot;")
//     .replace(/'/g, "&#039;");
// }

// function openPdfInCenteredPopup(blob: Blob, title: string) {
//   const blobUrl = URL.createObjectURL(blob);
//   const safeTitle = escapeHtml(title || "Purchase Order");
//   const width = 1120;
//   const height = 820;
//   const left = Math.max((window.screen.width - width) / 2, 0);
//   const top = Math.max((window.screen.height - height) / 2, 0);

//   const popup = window.open(
//     "",
//     title,
//     `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
//   );

//   if (!popup) {
//     window.open(blobUrl, "_blank");
//     return;
//   }

//   popup.document.write(`
//     <!doctype html>
//     <html>
//       <head>
//         <title>${safeTitle}</title>
//         <style>
//           * { box-sizing: border-box; }
//           html, body {
//             margin: 0;
//             height: 100%;
//             background: #e5e7eb;
//             font-family: Arial, sans-serif;
//           }
//           .toolbar {
//             height: 58px;
//             display: flex;
//             align-items: center;
//             justify-content: space-between;
//             gap: 14px;
//             padding: 0 18px;
//             background: #0f172a;
//             color: #fff;
//             box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);
//           }
//           .title {
//             font-size: 15px;
//             font-weight: 700;
//             white-space: nowrap;
//             overflow: hidden;
//             text-overflow: ellipsis;
//           }
//           .actions {
//             display: flex;
//             gap: 10px;
//             flex-shrink: 0;
//           }
//           button, a {
//             border: 0;
//             background: #fff;
//             color: #0f172a;
//             padding: 8px 14px;
//             border-radius: 999px;
//             font-size: 13px;
//             font-weight: 700;
//             text-decoration: none;
//             cursor: pointer;
//           }
//           .viewer-wrap {
//             height: calc(100% - 58px);
//             padding: 18px;
//           }
//           iframe {
//             width: 100%;
//             height: 100%;
//             border: 0;
//             border-radius: 14px;
//             background: #fff;
//             box-shadow: 0 10px 30px rgba(15, 23, 42, 0.18);
//           }
//         </style>
//       </head>
//       <body>
//         <div class="toolbar">
//           <div class="title">${safeTitle}</div>
//           <div class="actions">
//             <button onclick="document.querySelector('iframe').contentWindow.print()">Print</button>
//             <a href="${blobUrl}" download="${safeTitle}.pdf">Download</a>
//           </div>
//         </div>
//         <div class="viewer-wrap">
//           <iframe src="${blobUrl}"></iframe>
//         </div>
//       </body>
//     </html>
//   `);
//   popup.document.close();
// }

// function buildPurchaseOrderPdf(po: PurchaseOrder) {
//   const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
//   const pageWidth = pdf.internal.pageSize.getWidth();
//   const pageHeight = pdf.internal.pageSize.getHeight();

//   const margin = 36;
//   const contentWidth = pageWidth - margin * 2;
//   const right = pageWidth - margin;
//   let y = 34;

//   const items = sanitizeItems(po.items);
//   const total = getTotal(items);

//   const colors = {
//     navy: [15, 23, 42] as const,
//     slate: [71, 85, 105] as const,
//     muted: [100, 116, 139] as const,
//     lightText: [226, 232, 240] as const,
//     border: [226, 232, 240] as const,
//     band: [241, 245, 249] as const,
//     soft: [248, 250, 252] as const,
//     white: [255, 255, 255] as const,
//   };

//   function setTextColor(color: readonly [number, number, number]) {
//     pdf.setTextColor(color[0], color[1], color[2]);
//   }

//   function setFillColor(color: readonly [number, number, number]) {
//     pdf.setFillColor(color[0], color[1], color[2]);
//   }

//   function setDrawColor(color: readonly [number, number, number]) {
//     pdf.setDrawColor(color[0], color[1], color[2]);
//   }

//   function textOrDash(value: any) {
//     return safeText(value) || "-";
//   }

//   function checkPageSpace(requiredHeight: number) {
//     if (y + requiredHeight > pageHeight - 58) {
//       pdf.addPage();
//       y = 36;
//       drawPageTopLine();
//     }
//   }

//   function drawPageTopLine() {
//     setDrawColor(colors.border);
//     pdf.line(margin, 26, right, 26);
//   }

//   function drawFooter() {
//     const pageCount = pdf.getNumberOfPages();

//     for (let i = 1; i <= pageCount; i++) {
//       pdf.setPage(i);

//       setDrawColor(colors.border);
//       pdf.line(margin, pageHeight - 34, right, pageHeight - 34);

//       pdf.setFont("helvetica", "normal");
//       pdf.setFontSize(8);
//       setTextColor(colors.muted);
//       pdf.text(`Generated on ${formatDateDisplay(new Date().toISOString())}`, margin, pageHeight - 18);
//       pdf.text(`Page ${i} of ${pageCount}`, right, pageHeight - 18, { align: "right" });
//     }
//   }

//   function drawSectionTitle(title: string) {
//     checkPageSpace(34);
//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(11);
//     setTextColor(colors.navy);
//     pdf.text(title, margin, y);
//     y += 9;
//     setDrawColor(colors.border);
//     pdf.line(margin, y, right, y);
//     y += 16;
//   }

//   function drawSimpleInfoList(title: string, rows: Array<[string, any]>, columns = 2) {
//     drawSectionTitle(title);

//     const gap = 22;
//     const cellWidth = (contentWidth - gap * (columns - 1)) / columns;
//     const labelWidth = columns === 1 ? 116 : 84;
//     const valueWidth = cellWidth - labelWidth - 10;
//     const minRowHeight = 25;

//     for (let i = 0; i < rows.length; i += columns) {
//       const row = rows.slice(i, i + columns);

//       const rowHeight = Math.max(
//         minRowHeight,
//         ...row.map(([, value]) => {
//           const lines = pdf.splitTextToSize(textOrDash(value), valueWidth);
//           return Math.max(minRowHeight, 12 + lines.length * 10);
//         }),
//       );

//       checkPageSpace(rowHeight + 6);

//       row.forEach(([label, value], index) => {
//         const x = margin + index * (cellWidth + gap);
//         const valueX = x + labelWidth;

//         pdf.setFont("helvetica", "bold");
//         pdf.setFontSize(8.2);
//         setTextColor(colors.muted);
//         pdf.text(`${label}:`, x, y + 15);

//         pdf.setFont("helvetica", "normal");
//         pdf.setFontSize(9.2);
//         setTextColor(colors.navy);
//         const lines = pdf.splitTextToSize(textOrDash(value), valueWidth);
//         pdf.text(lines, valueX, y + 15);
//       });

//       setDrawColor(colors.border);
//       pdf.line(margin, y + rowHeight, right, y + rowHeight);
//       y += rowHeight + 5;
//     }

//     y += 10;
//   }

//   function drawHeader() {
//     setFillColor(colors.navy);
//     pdf.roundedRect(margin, y, contentWidth, 94, 12, 12, "F");

//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(22);
//     setTextColor(colors.white);
//     pdf.text("PURCHASE ORDER", margin + 22, y + 35);

//     pdf.setFont("helvetica", "normal");
//     pdf.setFontSize(9.5);
//     setTextColor(colors.lightText);
//     pdf.text("iEDGE System", margin + 22, y + 57);

//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(10.5);
//     setTextColor(colors.white);
//     pdf.text(textOrDash(po.poNumber), right - 22, y + 32, { align: "right" });

//     pdf.setFont("helvetica", "normal");
//     pdf.setFontSize(9);
//     setTextColor(colors.lightText);
//     pdf.text(textOrDash(po.status), right - 22, y + 52, { align: "right" });

//     y += 116;
//   }

//   function drawSummaryCards() {
//     const gap = 12;
//     const cardWidth = (contentWidth - gap * 3) / 4;
//     const cardHeight = 68;

//     const cards = [
//       ["P.O.", po.poNumber || "-"],
//       ["Date", formatDateDisplay(po.issueDate) || "-"],
//       ["Due Date", formatDateDisplay(po.dueDate) || "-"],
//       ["Total", `PKR ${formatNumber(total)}`],
//     ];

//     checkPageSpace(cardHeight + 22);

//     cards.forEach(([label, value], index) => {
//       const x = margin + index * (cardWidth + gap);
//       setFillColor(colors.white);
//       setDrawColor(colors.border);
//       pdf.roundedRect(x, y, cardWidth, cardHeight, 10, 10, "FD");

//       pdf.setFont("helvetica", "bold");
//       pdf.setFontSize(7.5);
//       setTextColor(colors.muted);
//       pdf.text(String(label).toUpperCase(), x + 10, y + 18);

//       pdf.setFont("helvetica", "bold");
//       pdf.setFontSize(index === 3 ? 10 : 9);
//       setTextColor(colors.navy);
//       const lines = pdf.splitTextToSize(String(value), cardWidth - 20);
//       pdf.text(lines.slice(0, 2), x + 10, y + 39);
//     });

//     y += cardHeight + 24;
//   }

//   function drawItemsHeader() {
//     checkPageSpace(32);
//     setFillColor(colors.band);
//     setDrawColor(colors.border);
//     pdf.roundedRect(margin, y, contentWidth, 30, 6, 6, "FD");

//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(8);
//     setTextColor(colors.slate);

//     pdf.text("#", margin + 12, y + 19);
//     pdf.text("SERVICE", margin + 44, y + 19);
//     pdf.text("QTY", right - 178, y + 19, { align: "right" });
//     pdf.text("RATE", right - 94, y + 19, { align: "right" });
//     pdf.text("AMOUNT", right - 10, y + 19, { align: "right" });

//     y += 30;
//   }

//   function drawItemsTable() {
//     drawSectionTitle("Items");

//     if (!items.length) {
//       checkPageSpace(44);
//       setFillColor(colors.soft);
//       setDrawColor(colors.border);
//       pdf.roundedRect(margin, y, contentWidth, 42, 8, 8, "FD");
//       pdf.setFont("helvetica", "normal");
//       pdf.setFontSize(9);
//       setTextColor(colors.muted);
//       pdf.text("No items found.", margin + 12, y + 25);
//       y += 54;
//       return;
//     }

//     drawItemsHeader();

//     items.forEach((item, index) => {
//       const serviceLines = pdf.splitTextToSize(textOrDash(item.service), contentWidth - 280);
//       const rowHeight = Math.max(44, 18 + serviceLines.length * 11);

//       if (y + rowHeight > pageHeight - 78) {
//         pdf.addPage();
//         y = 36;
//         drawPageTopLine();
//         drawItemsHeader();
//       }

//       setFillColor(index % 2 === 0 ? colors.white : colors.soft);
//       setDrawColor(colors.border);
//       pdf.rect(margin, y, contentWidth, rowHeight, "FD");

//       pdf.setFont("helvetica", "normal");
//       pdf.setFontSize(8.5);
//       setTextColor(colors.navy);
//       pdf.text(String(index + 1), margin + 12, y + 18);

//       pdf.setFont("helvetica", "normal");
//       pdf.setFontSize(8.7);
//       pdf.text(serviceLines, margin + 44, y + 18);

//       pdf.setFont("helvetica", "normal");
//       pdf.setFontSize(8.5);
//       pdf.text(textOrDash(item.qty), right - 178, y + 18, { align: "right" });
//       pdf.text(formatNumber(safeNumber(item.rate)), right - 94, y + 18, { align: "right" });

//       pdf.setFont("helvetica", "bold");
//       pdf.text(formatNumber(safeNumber(item.amount)), right - 10, y + 18, { align: "right" });

//       y += rowHeight;
//     });

//     y += 18;
//     checkPageSpace(62);

//     setFillColor(colors.navy);
//     pdf.roundedRect(right - 220, y, 220, 44, 8, 8, "F");

//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(8.5);
//     setTextColor(colors.lightText);
//     pdf.text("TOTAL", right - 204, y + 18);

//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(12);
//     setTextColor(colors.white);
//     pdf.text(`PKR ${formatNumber(total)}`, right - 16, y + 30, { align: "right" });

//     y += 66;
//   }

//   function drawApprovalBox() {
//     checkPageSpace(82);
//     drawSectionTitle("Approval");

//     const boxHeight = 64;
//     setFillColor(colors.white);
//     setDrawColor(colors.border);
//     pdf.roundedRect(margin, y, contentWidth, boxHeight, 8, 8, "FD");

//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(8);
//     setTextColor(colors.muted);
//     pdf.text("APPROVED BY", margin + 14, y + 20);
//     pdf.text("DATE", margin + contentWidth / 2 + 14, y + 20);

//     setDrawColor(colors.muted);
//     pdf.line(margin + 14, y + 46, margin + contentWidth / 2 - 18, y + 46);
//     pdf.line(margin + contentWidth / 2 + 14, y + 46, right - 14, y + 46);

//     y += boxHeight + 18;
//   }

//   drawHeader();
//   drawSummaryCards();

//   drawSimpleInfoList(
//     "Supplier Details",
//     [
//       ["Supplier Name", po.supplierName || "-"],
//       ["Supplier Address", po.supplierAddress || po.supplierName || "-"],
//     ],
//     1,
//   );

//   drawSimpleInfoList(
//     "Reference Details",
//     [
//       ["Estimate Number", po.estimateNumber || "-"],
//       ["Status", po.status || "-"],
//       ["Source", po.source === "budget_request" ? "Budget Request" : po.source || "Manual"],
//       ["Budget Request ID", po.sourceRequestId || po.sourceInvoiceId || "-"],
//       ["Project", po.sourceProjectName || "-"],
//       ["Client", po.sourceClientName || "-"],
//       ["Notes", po.notes || "-"],
//     ],
//     2,
//   );

//   drawItemsTable();
//   drawApprovalBox();
//   drawFooter();

//   return pdf;
// }

// function PurchaseOrderView({ po }: { po: PurchaseOrder }) {
//   return (
//     <div className="space-y-5 text-sm">
//       <div className="grid grid-cols-2 gap-4">
//         <div>
//           <p className="text-muted-foreground">P.O.</p>
//           <p className="font-semibold">{po.poNumber}</p>
//         </div>
//         <div>
//           <p className="text-muted-foreground">Status</p>
//           <Badge variant={getStatusBadgeVariant(po.status)}>{po.status}</Badge>
//         </div>
//         <div>
//           <p className="text-muted-foreground">Estimate Number</p>
//           <p className="font-medium">{po.estimateNumber || "-"}</p>
//         </div>
//         <div>
//           <p className="text-muted-foreground">Supplier</p>
//           <p className="font-medium whitespace-pre-line">{po.supplierAddress || po.supplierName}</p>
//         </div>
//         <div>
//           <p className="text-muted-foreground">Date</p>
//           <p className="font-medium">{formatDateDisplay(po.issueDate)}</p>
//         </div>
//       </div>

//       <div className="rounded-2xl border overflow-hidden">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>Service</TableHead>
//               <TableHead className="text-right">Qty</TableHead>
//               <TableHead className="text-right">Rate</TableHead>
//               <TableHead className="text-right">Amount</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {po.items.map((item, index) => (
//               <TableRow key={index}>
//                 <TableCell className="whitespace-pre-line">{item.service || "-"}</TableCell>
//                 <TableCell className="text-right">{item.qty || "-"}</TableCell>
//                 <TableCell className="text-right">{formatNumber(safeNumber(item.rate))}</TableCell>
//                 <TableCell className="text-right">{formatNumber(safeNumber(item.amount))}</TableCell>
//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>
//       </div>

//       <div className="flex justify-end">
//         <div className="w-full max-w-xs rounded-2xl border p-4 bg-muted/30">
//           <div className="flex justify-between font-semibold">
//             <span>Total</span>
//             <span>{formatCurrency(po.totalAmount || 0)}</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default function POManagementPage() {
//   const { toast } = useToast();
//   const [, navigate] = useLocation();

//   const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
//   const [viewDialogOpen, setViewDialogOpen] = useState(false);
//   const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);

//   useEffect(() => {
//     if (localStorage.getItem("createPOFromBudgetRequest")) {
//       navigate(CREATE_PO_ROUTE);
//     }
//   }, [navigate]);

//   useEffect(() => {
//     const unsubscribe = onSnapshot(
//       query(poCollectionRef, orderBy("createdAt", "desc")),
//       (snapshot) => {
//         const rows: PurchaseOrder[] = snapshot.docs.map((docSnap) => {
//           const data = docSnap.data() as Omit<PurchaseOrder, "id">;
//           const items = sanitizeItems(asArray(data.items));
//           const totalAmount = safeNumber(data.totalAmount, getTotal(items));
//           const status = isOverDue({ dueDate: data.dueDate, status: data.status })
//             ? "Over Due"
//             : data.status;

//           return {
//             id: docSnap.id,
//             ...data,
//             items,
//             totalAmount,
//             status,
//           };
//         });
//         setPurchaseOrders(rows);
//       },
//       (error) => console.error("Error loading purchase orders:", error),
//     );

//     return () => unsubscribe();
//   }, []);

//   const totals = useMemo(() => {
//     const totalPayable = purchaseOrders.reduce((sum, item) => sum + safeNumber(item.totalAmount), 0);
//     const overDue = purchaseOrders
//       .filter((item) => item.status === "Over Due")
//       .reduce((sum, item) => sum + safeNumber(item.totalAmount), 0);
//     const open = purchaseOrders
//       .filter((item) => item.status === "Open" || item.status === "Draft")
//       .reduce((sum, item) => sum + safeNumber(item.totalAmount), 0);
//     const paid = purchaseOrders
//       .filter((item) => item.status === "Paid")
//       .reduce((sum, item) => sum + safeNumber(item.totalAmount), 0);
//     return { totalPayable, overDue, open, paid };
//   }, [purchaseOrders]);

//   const chartData = useMemo(() => {
//     const grouped = new Map<string, { date: string; totalPayable: number; overDue: number; open: number; paid: number }>();

//     purchaseOrders.forEach((item) => {
//       const rawDate = item.issueDate || "No Date";
//       const label = rawDate === "No Date"
//         ? rawDate
//         : new Date(rawDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

//       const existing = grouped.get(label) || {
//         date: label,
//         totalPayable: 0,
//         overDue: 0,
//         open: 0,
//         paid: 0,
//       };

//       existing.totalPayable += safeNumber(item.totalAmount);
//       if (item.status === "Over Due") existing.overDue += safeNumber(item.totalAmount);
//       if (item.status === "Open" || item.status === "Draft") existing.open += safeNumber(item.totalAmount);
//       if (item.status === "Paid") existing.paid += safeNumber(item.totalAmount);
//       grouped.set(label, existing);
//     });

//     return Array.from(grouped.values()).slice(-8);
//   }, [purchaseOrders]);

//   const handleCreatePO = () => {
//     navigate(SUPPLIER);
//   };

//   const handleEditPO = (po: PurchaseOrder) => {
//     localStorage.setItem("createPOEditData", JSON.stringify(po));
//     localStorage.removeItem("createPODuplicateData");
//     navigate(CREATE_PO_ROUTE);
//   };

//   const handleDuplicatePO = (po: PurchaseOrder) => {
//     localStorage.setItem("createPODuplicateData", JSON.stringify(po));
//     localStorage.removeItem("createPOEditData");
//     navigate(CREATE_PO_ROUTE);
//   };

//   const handleViewPO = (po: PurchaseOrder) => {
//     setViewingPO(po);
//     setViewDialogOpen(true);
//   };

//   const handleDeletePO = async (poId: string) => {
//     try {
//       await deleteDoc(doc(db, "Panels", PANEL_ID, "PO", poId));
//       toast({ title: "PO deleted", description: "Purchase order removed successfully." });
//     } catch (error) {
//       console.error("Error deleting PO:", error);
//       toast({ title: "Delete failed", description: "Could not delete purchase order.", variant: "destructive" });
//     }
//   };

//   const handleStatusChange = async (poId: string, status: PurchaseOrderStatus) => {
//     try {
//       await updateDoc(doc(db, "Panels", PANEL_ID, "PO", poId), {
//         status,
//         updatedAt: serverTimestamp(),
//       });
//       toast({ title: "Status updated", description: "Purchase order status updated." });
//     } catch (error) {
//       console.error("Error updating status:", error);
//       toast({ title: "Update failed", description: "Could not update status.", variant: "destructive" });
//     }
//   };

//   const handleGeneratePOPdf = (po: PurchaseOrder) => {
//     try {
//       const pdf = buildPurchaseOrderPdf(po);
//       const blob = pdf.output("blob");
//       openPdfInCenteredPopup(blob, po.poNumber || "Purchase Order");
//     } catch (error) {
//       console.error("Error generating PDF:", error);
//       toast({ title: "PDF failed", description: "Could not generate purchase order PDF.", variant: "destructive" });
//     }
//   };

//   return (
//     <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
//       <div className="flex items-center justify-between gap-4 flex-wrap">
//         <div>
//           <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
//           <p className="text-sm text-muted-foreground">
//             PO management only. Create PO now opens on a separate page instead of a popup.
//           </p>
//         </div>

//         <Button className="rounded-2xl" onClick={handleCreatePO}>
//           {/* <Plus className="h-4 w-4 mr-2" /> */}
//           Supplier
//         </Button>
//       </div>

//       <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
//         <div className="xl:col-span-5 space-y-6">
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <Card className="rounded-3xl">
//               <CardContent className="p-5">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm text-muted-foreground">Total Payable</p>
//                     <p className="text-xl font-bold mt-1">{formatCurrency(totals.totalPayable)}</p>
//                   </div>
//                   <Wallet className="h-5 w-5" />
//                 </div>
//               </CardContent>
//             </Card>
//             <Card className="rounded-3xl">
//               <CardContent className="p-5">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm text-muted-foreground">Over Due</p>
//                     <p className="text-xl font-bold mt-1">{formatCurrency(totals.overDue)}</p>
//                   </div>
//                   <AlertTriangle className="h-5 w-5" />
//                 </div>
//               </CardContent>
//             </Card>
//             <Card className="rounded-3xl">
//               <CardContent className="p-5">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm text-muted-foreground">Open / Draft</p>
//                     <p className="text-xl font-bold mt-1">{formatCurrency(totals.open)}</p>
//                   </div>
//                   <FileText className="h-5 w-5" />
//                 </div>
//               </CardContent>
//             </Card>
//             <Card className="rounded-3xl">
//               <CardContent className="p-5">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm text-muted-foreground">Paid</p>
//                     <p className="text-xl font-bold mt-1">{formatCurrency(totals.paid)}</p>
//                   </div>
//                   <CheckCircle2 className="h-5 w-5" />
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </div>

//         <div className="xl:col-span-7">
//           <Card className="rounded-3xl shadow-sm">
//             <CardHeader>
//               <CardTitle>PO Summary Graph</CardTitle>
//               <CardDescription>Date-wise view of total payable, overdue, open and paid values.</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="h-[320px]">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={chartData}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis dataKey="date" />
//                     <YAxis />
//                     <Tooltip formatter={(value: number) => formatCurrency(value)} />
//                     <Legend />
//                     <Bar dataKey="totalPayable" name="Total Payable" radius={[8, 8, 0, 0]} />
//                     <Bar dataKey="overDue" name="Over Due" radius={[8, 8, 0, 0]} />
//                     <Bar dataKey="open" name="Open / Draft" radius={[8, 8, 0, 0]} />
//                     <Bar dataKey="paid" name="Paid" radius={[8, 8, 0, 0]} />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>

//       <Card className="rounded-3xl shadow-sm">
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Receipt className="h-5 w-5" /> Purchase Order List
//           </CardTitle>
//           <CardDescription>All created purchase orders with status and actions.</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="overflow-x-auto rounded-2xl border bg-white">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>P.O.</TableHead>
//                   <TableHead>ESTIMATE #</TableHead>
//                   <TableHead>SUPPLIER</TableHead>
//                   <TableHead>DATE</TableHead>
//                   <TableHead className="text-right">TOTAL</TableHead>
//                   <TableHead>STATUS</TableHead>
//                   <TableHead>ACTION</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {purchaseOrders.length > 0 ? (
//                   purchaseOrders.map((po) => (
//                     <TableRow key={po.id}>
//                       <TableCell className="font-medium">{po.poNumber}</TableCell>
//                       <TableCell>{po.estimateNumber || "-"}</TableCell>
//                       <TableCell>{po.supplierName || "-"}</TableCell>
//                       <TableCell>{formatDateDisplay(po.issueDate) || "-"}</TableCell>
//                       <TableCell className="text-right">{formatCurrency(po.totalAmount || 0)}</TableCell>
//                       <TableCell>
//                         <Select
//                           value={po.status === "Over Due" ? "Over Due" : po.status}
//                           onValueChange={(value) => handleStatusChange(po.id, value as PurchaseOrderStatus)}
//                         >
//                           <SelectTrigger className="w-[130px]">
//                             <SelectValue />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="Draft">Draft</SelectItem>
//                             <SelectItem value="Open">Open</SelectItem>
//                             <SelectItem value="Paid">Paid</SelectItem>
//                             <SelectItem value="Cancelled">Cancelled</SelectItem>
//                             {po.status === "Over Due" && <SelectItem value="Over Due">Over Due</SelectItem>}
//                           </SelectContent>
//                         </Select>
//                       </TableCell>
//                       <TableCell>
//                         <div className="flex flex-wrap gap-2">
//                           <Button size="sm" variant="outline" onClick={() => handleEditPO(po)}>
//                             <Pencil className="h-4 w-4 mr-1" /> Edit
//                           </Button>
//                           <Button size="sm" variant="outline" onClick={() => handleViewPO(po)}>
//                             <Eye className="h-4 w-4 mr-1" /> View
//                           </Button>
//                           <Button size="sm" variant="outline" onClick={() => handleDuplicatePO(po)}>
//                             <Copy className="h-4 w-4 mr-1" /> Duplicate
//                           </Button>
//                           <Button size="sm" variant="outline" onClick={() => handleGeneratePOPdf(po)}>
//                             <FileText className="h-4 w-4 mr-1" /> PDF
//                           </Button>
//                           <Button
//                             size="sm"
//                             variant="ghost"
//                             onClick={() => handleDeletePO(po.id)}
//                             className="text-red-600 hover:text-red-700"
//                           >
//                             <Trash2 className="h-4 w-4 mr-1" /> Delete
//                           </Button>
//                         </div>
//                       </TableCell>
//                     </TableRow>
//                   ))
//                 ) : (
//                   <TableRow>
//                     <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
//                       No purchase orders found.
//                     </TableCell>
//                   </TableRow>
//                 )}
//               </TableBody>
//             </Table>
//           </div>
//         </CardContent>
//       </Card>

//       <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
//         <DialogContent className="max-w-4xl rounded-3xl max-h-[85vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Purchase Order Details</DialogTitle>
//           </DialogHeader>
//           {viewingPO ? <PurchaseOrderView po={viewingPO} /> : null}
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import jsPDF from "jspdf";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Eye,
  FileText,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  ResponsiveContainer,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const PANEL_ID = "IEDGE-SYSTEM";
const CREATE_PO_ROUTE = "/create-po";

const poCollectionRef = collection(db, "Panels", PANEL_ID, "PO");

type PurchaseOrderStatus = "Draft" | "Open" | "Paid" | "Cancelled" | "Over Due";

type EstimateLineItem = {
  service: string;
  qty: string;
  rate: string;
  amount: number;
};

type PurchaseOrder = {
  id: string;
  poNumber: string;
  estimateId?: string;
  estimateNumber: string;
  supplierId: string;
  supplierName: string;
  supplierAddress?: string;
  issueDate: string;
  dueDate: string;
  items: EstimateLineItem[];
  totalAmount: number;
  status: PurchaseOrderStatus;
  notes?: string;
  source?: "manual" | "budget_request";
  sourceInvoiceId?: string | null;
  sourceRequestId?: string | null;
  sourceProjectName?: string | null;
  sourceClientName?: string | null;
  createdAt?: any;
  updatedAt?: any;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatDateDisplay(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB");
}

function getStatusBadgeVariant(status: PurchaseOrderStatus) {
  if (status === "Paid") return "default" as const;
  if (status === "Cancelled" || status === "Over Due")
    return "destructive" as const;
  if (status === "Open") return "secondary" as const;
  return "outline" as const;
}

function isOverDue(po: { dueDate?: string; status: PurchaseOrderStatus }) {
  if (!po.dueDate) return false;
  if (po.status === "Paid" || po.status === "Cancelled") return false;

  const dueDate = new Date(po.dueDate);
  const today = new Date();

  dueDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return dueDate < today;
}

function asArray(value: any): any[] {
  return Array.isArray(value) ? value : [];
}

function safeText(...values: any[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

function safeNumber(...values: any[]) {
  for (const value of values) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function sanitizeItems(items: EstimateLineItem[]) {
  return items
    .map((item) => {
      const qty = safeNumber(item.qty);
      const rate = safeNumber(item.rate);

      return {
        service: safeText(item.service),
        qty: qty ? String(qty) : "",
        rate: rate ? String(rate) : "",
        amount: safeNumber(item.amount, qty * rate),
      };
    })
    .filter((item) => item.service || item.qty || item.rate || item.amount);
}

function getTotal(items: EstimateLineItem[]) {
  return sanitizeItems(items).reduce(
    (sum, item) => sum + safeNumber(item.amount),
    0,
  );
}

function escapeHtml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function openPdfInCenteredPopup(blob: Blob, title: string) {
  const blobUrl = URL.createObjectURL(blob);
  const safeTitle = escapeHtml(title || "Purchase Order");

  const width = 1120;
  const height = 820;
  const left = Math.max((window.screen.width - width) / 2, 0);
  const top = Math.max((window.screen.height - height) / 2, 0);

  const popup = window.open(
    "",
    title,
    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
  );

  if (!popup) {
    window.open(blobUrl, "_blank");
    return;
  }

  popup.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${safeTitle}</title>
        <style>
          * { box-sizing: border-box; }
          html, body {
            margin: 0;
            height: 100%;
            background: #e5e7eb;
            font-family: Arial, sans-serif;
          }
          .toolbar {
            height: 58px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            padding: 0 18px;
            background: #0f172a;
            color: #fff;
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);
          }
          .title {
            font-size: 15px;
            font-weight: 700;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .actions {
            display: flex;
            gap: 10px;
            flex-shrink: 0;
          }
          button, a {
            border: 0;
            background: #fff;
            color: #0f172a;
            padding: 8px 14px;
            border-radius: 999px;
            font-size: 13px;
            font-weight: 700;
            text-decoration: none;
            cursor: pointer;
          }
          .viewer-wrap {
            height: calc(100% - 58px);
            padding: 18px;
          }
          iframe {
            width: 100%;
            height: 100%;
            border: 0;
            border-radius: 14px;
            background: #fff;
            box-shadow: 0 10px 30px rgba(15, 23, 42, 0.18);
          }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <div class="title">${safeTitle}</div>
          <div class="actions">
            <button onclick="document.querySelector('iframe').contentWindow.print()">Print</button>
            <a href="${blobUrl}" download="${safeTitle}.pdf">Download</a>
          </div>
        </div>
        <div class="viewer-wrap">
          <iframe src="${blobUrl}"></iframe>
        </div>
      </body>
    </html>
  `);

  popup.document.close();
}

function buildPurchaseOrderPdf(po: PurchaseOrder) {
  const pdf = new jsPDF({
    unit: "pt",
    format: "a4",
    orientation: "portrait",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 36;
  const contentWidth = pageWidth - margin * 2;
  const right = pageWidth - margin;
  let y = 34;

  const items = sanitizeItems(po.items);
  const total = getTotal(items);

  const colors = {
    navy: [15, 23, 42] as const,
    slate: [71, 85, 105] as const,
    muted: [100, 116, 139] as const,
    lightText: [226, 232, 240] as const,
    border: [226, 232, 240] as const,
    band: [241, 245, 249] as const,
    soft: [248, 250, 252] as const,
    white: [255, 255, 255] as const,
  };

  function setTextColor(color: readonly [number, number, number]) {
    pdf.setTextColor(color[0], color[1], color[2]);
  }

  function setFillColor(color: readonly [number, number, number]) {
    pdf.setFillColor(color[0], color[1], color[2]);
  }

  function setDrawColor(color: readonly [number, number, number]) {
    pdf.setDrawColor(color[0], color[1], color[2]);
  }

  function textOrDash(value: any) {
    return safeText(value) || "-";
  }

  function checkPageSpace(requiredHeight: number) {
    if (y + requiredHeight > pageHeight - 58) {
      pdf.addPage();
      y = 36;
      drawPageTopLine();
    }
  }

  function drawPageTopLine() {
    setDrawColor(colors.border);
    pdf.line(margin, 26, right, 26);
  }

  function drawFooter() {
    const pageCount = pdf.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);

      setDrawColor(colors.border);
      pdf.line(margin, pageHeight - 34, right, pageHeight - 34);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      setTextColor(colors.muted);
      pdf.text(
        `Generated on ${formatDateDisplay(new Date().toISOString())}`,
        margin,
        pageHeight - 18,
      );
      pdf.text(`Page ${i} of ${pageCount}`, right, pageHeight - 18, {
        align: "right",
      });
    }
  }

  function drawSectionTitle(title: string) {
    checkPageSpace(34);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    setTextColor(colors.navy);
    pdf.text(title, margin, y);

    y += 9;

    setDrawColor(colors.border);
    pdf.line(margin, y, right, y);

    y += 16;
  }

  function drawSimpleInfoList(
    title: string,
    rows: Array<[string, any]>,
    columns = 2,
  ) {
    drawSectionTitle(title);

    const gap = 22;
    const cellWidth = (contentWidth - gap * (columns - 1)) / columns;
    const labelWidth = columns === 1 ? 116 : 84;
    const valueWidth = cellWidth - labelWidth - 10;
    const minRowHeight = 25;

    for (let i = 0; i < rows.length; i += columns) {
      const row = rows.slice(i, i + columns);

      const rowHeight = Math.max(
        minRowHeight,
        ...row.map(([, value]) => {
          const lines = pdf.splitTextToSize(textOrDash(value), valueWidth);
          return Math.max(minRowHeight, 12 + lines.length * 10);
        }),
      );

      checkPageSpace(rowHeight + 6);

      row.forEach(([label, value], index) => {
        const x = margin + index * (cellWidth + gap);
        const valueX = x + labelWidth;

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8.2);
        setTextColor(colors.muted);
        pdf.text(`${label}:`, x, y + 15);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9.2);
        setTextColor(colors.navy);

        const lines = pdf.splitTextToSize(textOrDash(value), valueWidth);
        pdf.text(lines, valueX, y + 15);
      });

      setDrawColor(colors.border);
      pdf.line(margin, y + rowHeight, right, y + rowHeight);

      y += rowHeight + 5;
    }

    y += 10;
  }

  function drawHeader() {
    setFillColor(colors.navy);
    pdf.roundedRect(margin, y, contentWidth, 94, 12, 12, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    setTextColor(colors.white);
    pdf.text("PURCHASE ORDER", margin + 22, y + 35);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    setTextColor(colors.lightText);
    pdf.text("iEDGE System", margin + 22, y + 57);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10.5);
    setTextColor(colors.white);
    pdf.text(textOrDash(po.poNumber), right - 22, y + 32, {
      align: "right",
    });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    setTextColor(colors.lightText);
    pdf.text(textOrDash(po.status), right - 22, y + 52, {
      align: "right",
    });

    y += 116;
  }

  function drawSummaryCards() {
    const gap = 12;
    const cardWidth = (contentWidth - gap * 3) / 4;
    const cardHeight = 68;

    const cards = [
      ["P.O.", po.poNumber || "-"],
      ["Date", formatDateDisplay(po.issueDate) || "-"],
      ["Due Date", formatDateDisplay(po.dueDate) || "-"],
      ["Total", `PKR ${formatNumber(total)}`],
    ];

    checkPageSpace(cardHeight + 22);

    cards.forEach(([label, value], index) => {
      const x = margin + index * (cardWidth + gap);

      setFillColor(colors.white);
      setDrawColor(colors.border);
      pdf.roundedRect(x, y, cardWidth, cardHeight, 10, 10, "FD");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      setTextColor(colors.muted);
      pdf.text(String(label).toUpperCase(), x + 10, y + 18);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(index === 3 ? 10 : 9);
      setTextColor(colors.navy);

      const lines = pdf.splitTextToSize(String(value), cardWidth - 20);
      pdf.text(lines.slice(0, 2), x + 10, y + 39);
    });

    y += cardHeight + 24;
  }

  function drawItemsHeader() {
    checkPageSpace(32);

    setFillColor(colors.band);
    setDrawColor(colors.border);
    pdf.roundedRect(margin, y, contentWidth, 30, 6, 6, "FD");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    setTextColor(colors.slate);

    pdf.text("#", margin + 12, y + 19);
    pdf.text("SERVICE", margin + 44, y + 19);
    pdf.text("QTY", right - 178, y + 19, { align: "right" });
    pdf.text("RATE", right - 94, y + 19, { align: "right" });
    pdf.text("AMOUNT", right - 10, y + 19, { align: "right" });

    y += 30;
  }

  function drawItemsTable() {
    drawSectionTitle("Items");

    if (!items.length) {
      checkPageSpace(44);

      setFillColor(colors.soft);
      setDrawColor(colors.border);
      pdf.roundedRect(margin, y, contentWidth, 42, 8, 8, "FD");

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      setTextColor(colors.muted);
      pdf.text("No items found.", margin + 12, y + 25);

      y += 54;
      return;
    }

    drawItemsHeader();

    items.forEach((item, index) => {
      const serviceLines = pdf.splitTextToSize(
        textOrDash(item.service),
        contentWidth - 280,
      );

      const rowHeight = Math.max(44, 18 + serviceLines.length * 11);

      if (y + rowHeight > pageHeight - 78) {
        pdf.addPage();
        y = 36;
        drawPageTopLine();
        drawItemsHeader();
      }

      setFillColor(index % 2 === 0 ? colors.white : colors.soft);
      setDrawColor(colors.border);
      pdf.rect(margin, y, contentWidth, rowHeight, "FD");

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      setTextColor(colors.navy);
      pdf.text(String(index + 1), margin + 12, y + 18);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.7);
      pdf.text(serviceLines, margin + 44, y + 18);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.text(textOrDash(item.qty), right - 178, y + 18, {
        align: "right",
      });
      pdf.text(formatNumber(safeNumber(item.rate)), right - 94, y + 18, {
        align: "right",
      });

      pdf.setFont("helvetica", "bold");
      pdf.text(formatNumber(safeNumber(item.amount)), right - 10, y + 18, {
        align: "right",
      });

      y += rowHeight;
    });

    y += 18;

    checkPageSpace(62);

    setFillColor(colors.navy);
    pdf.roundedRect(right - 220, y, 220, 44, 8, 8, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    setTextColor(colors.lightText);
    pdf.text("TOTAL", right - 204, y + 18);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    setTextColor(colors.white);
    pdf.text(`PKR ${formatNumber(total)}`, right - 16, y + 30, {
      align: "right",
    });

    y += 66;
  }

  function drawApprovalBox() {
    checkPageSpace(82);
    drawSectionTitle("Approval");

    const boxHeight = 64;

    setFillColor(colors.white);
    setDrawColor(colors.border);
    pdf.roundedRect(margin, y, contentWidth, boxHeight, 8, 8, "FD");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    setTextColor(colors.muted);
    pdf.text("APPROVED BY", margin + 14, y + 20);
    pdf.text("DATE", margin + contentWidth / 2 + 14, y + 20);

    setDrawColor(colors.muted);
    pdf.line(margin + 14, y + 46, margin + contentWidth / 2 - 18, y + 46);
    pdf.line(margin + contentWidth / 2 + 14, y + 46, right - 14, y + 46);

    y += boxHeight + 18;
  }

  drawHeader();
  drawSummaryCards();

  drawSimpleInfoList(
    "Supplier Details",
    [
      ["Supplier Name", po.supplierName || "-"],
      ["Supplier Address", po.supplierAddress || po.supplierName || "-"],
    ],
    1,
  );

  drawSimpleInfoList(
    "Reference Details",
    [
      ["Estimate Number", po.estimateNumber || "-"],
      ["Status", po.status || "-"],
      [
        "Source",
        po.source === "budget_request"
          ? "Budget Request"
          : po.source || "Manual",
      ],
      ["Budget Request ID", po.sourceRequestId || po.sourceInvoiceId || "-"],
      ["Project", po.sourceProjectName || "-"],
      ["Client", po.sourceClientName || "-"],
      ["Notes", po.notes || "-"],
    ],
    2,
  );

  drawItemsTable();
  drawApprovalBox();
  drawFooter();

  return pdf;
}

function PurchaseOrderView({ po }: { po: PurchaseOrder }) {
  return (
    <div className="space-y-5 text-sm">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-muted-foreground">P.O.</p>
          <p className="font-semibold">{po.poNumber}</p>
        </div>

        <div>
          <p className="text-muted-foreground">Status</p>
          <Badge variant={getStatusBadgeVariant(po.status)}>{po.status}</Badge>
        </div>

        <div>
          <p className="text-muted-foreground">Estimate Number</p>
          <p className="font-medium">{po.estimateNumber || "-"}</p>
        </div>

        <div>
          <p className="text-muted-foreground">Supplier</p>
          <p className="font-medium whitespace-pre-line">
            {po.supplierAddress || po.supplierName}
          </p>
        </div>

        <div>
          <p className="text-muted-foreground">Date</p>
          <p className="font-medium">{formatDateDisplay(po.issueDate)}</p>
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {po.items.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="whitespace-pre-line">
                  {item.service || "-"}
                </TableCell>
                <TableCell className="text-right">{item.qty || "-"}</TableCell>
                <TableCell className="text-right">
                  {formatNumber(safeNumber(item.rate))}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(safeNumber(item.amount))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <div className="w-full max-w-xs rounded-2xl border p-4 bg-muted/30">
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatCurrency(po.totalAmount || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function POManagementPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);

  useEffect(() => {
    if (localStorage.getItem("createPOFromBudgetRequest")) {
      navigate(CREATE_PO_ROUTE);
    }
  }, [navigate]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(poCollectionRef, orderBy("createdAt", "desc")),
      (snapshot) => {
        const rows: PurchaseOrder[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Omit<PurchaseOrder, "id">;
          const items = sanitizeItems(asArray(data.items));
          const totalAmount = safeNumber(data.totalAmount, getTotal(items));

          const status = isOverDue({
            dueDate: data.dueDate,
            status: data.status,
          })
            ? "Over Due"
            : data.status;

          return {
            id: docSnap.id,
            ...data,
            items,
            totalAmount,
            status,
          };
        });

        setPurchaseOrders(rows);
      },
      (error) => {
        console.error("Error loading purchase orders:", error);
      },
    );

    return () => unsubscribe();
  }, []);

  const totals = useMemo(() => {
    const totalPayable = purchaseOrders.reduce(
      (sum, item) => sum + safeNumber(item.totalAmount),
      0,
    );

    const overDue = purchaseOrders
      .filter((item) => item.status === "Over Due")
      .reduce((sum, item) => sum + safeNumber(item.totalAmount), 0);

    const open = purchaseOrders
      .filter((item) => item.status === "Open" || item.status === "Draft")
      .reduce((sum, item) => sum + safeNumber(item.totalAmount), 0);

    const paid = purchaseOrders
      .filter((item) => item.status === "Paid")
      .reduce((sum, item) => sum + safeNumber(item.totalAmount), 0);

    return { totalPayable, overDue, open, paid };
  }, [purchaseOrders]);

  const chartData = useMemo(() => {
    const grouped = new Map<
      string,
      {
        date: string;
        totalPayable: number;
        overDue: number;
        open: number;
        paid: number;
      }
    >();

    purchaseOrders.forEach((item) => {
      const rawDate = item.issueDate || "No Date";

      const label =
        rawDate === "No Date"
          ? rawDate
          : new Date(rawDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
            });

      const existing = grouped.get(label) || {
        date: label,
        totalPayable: 0,
        overDue: 0,
        open: 0,
        paid: 0,
      };

      existing.totalPayable += safeNumber(item.totalAmount);

      if (item.status === "Over Due") {
        existing.overDue += safeNumber(item.totalAmount);
      }

      if (item.status === "Open" || item.status === "Draft") {
        existing.open += safeNumber(item.totalAmount);
      }

      if (item.status === "Paid") {
        existing.paid += safeNumber(item.totalAmount);
      }

      grouped.set(label, existing);
    });

    return Array.from(grouped.values()).slice(-8);
  }, [purchaseOrders]);

  const clearCreatePOTransferState = () => {
    localStorage.removeItem("createPOEditData");
    localStorage.removeItem("createPODuplicateData");
    localStorage.removeItem("createPOFromBudgetRequest");
  };

  const buildPOTransferPayload = (po: PurchaseOrder) => {
    const items = sanitizeItems(asArray(po.items));

    return {
      ...po,
      id: po.id,
      purchaseOrderId: po.id,
      editMode: true,
      items,
      totalAmount: safeNumber(po.totalAmount, getTotal(items)),
    };
  };

  const handleCreatePO = () => {
    clearCreatePOTransferState();
    navigate(CREATE_PO_ROUTE);
  };

  const handleEditPO = (po: PurchaseOrder) => {
    const editPayload = buildPOTransferPayload(po);

    localStorage.setItem("createPOEditData", JSON.stringify(editPayload));
    localStorage.removeItem("createPODuplicateData");
    localStorage.removeItem("createPOFromBudgetRequest");

    navigate(`${CREATE_PO_ROUTE}?edit=${encodeURIComponent(po.id)}`);
  };

  const handleDuplicatePO = (po: PurchaseOrder) => {
    const duplicatePayload = buildPOTransferPayload(po);

    delete (duplicatePayload as any).id;
    delete (duplicatePayload as any).purchaseOrderId;
    delete (duplicatePayload as any).editMode;

    localStorage.setItem(
      "createPODuplicateData",
      JSON.stringify(duplicatePayload),
    );
    localStorage.removeItem("createPOEditData");
    localStorage.removeItem("createPOFromBudgetRequest");

    navigate(CREATE_PO_ROUTE);
  };

  const handleViewPO = (po: PurchaseOrder) => {
    setViewingPO(po);
    setViewDialogOpen(true);
  };

  const handleDeletePO = async (poId: string) => {
    try {
      await deleteDoc(doc(db, "Panels", PANEL_ID, "PO", poId));

      toast({
        title: "PO deleted",
        description: "Purchase order removed successfully.",
      });
    } catch (error) {
      console.error("Error deleting PO:", error);

      toast({
        title: "Delete failed",
        description: "Could not delete purchase order.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (
    poId: string,
    status: PurchaseOrderStatus,
  ) => {
    try {
      await updateDoc(doc(db, "Panels", PANEL_ID, "PO", poId), {
        status,
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Status updated",
        description: "Purchase order status updated.",
      });
    } catch (error) {
      console.error("Error updating status:", error);

      toast({
        title: "Update failed",
        description: "Could not update status.",
        variant: "destructive",
      });
    }
  };

  const handleGeneratePOPdf = (po: PurchaseOrder) => {
    try {
      const pdf = buildPurchaseOrderPdf(po);
      const blob = pdf.output("blob");

      openPdfInCenteredPopup(blob, po.poNumber || "Purchase Order");
    } catch (error) {
      console.error("Error generating PDF:", error);

      toast({
        title: "PDF failed",
        description: "Could not generate purchase order PDF.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground">
            PO management only. Create PO now opens on a separate page instead
            of a popup.
          </p>
        </div>

        <Button className="rounded-2xl" onClick={handleCreatePO}>
          <Plus className="h-4 w-4 mr-2" />
          Create PO
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-5 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="rounded-3xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Payable
                    </p>
                    <p className="text-xl font-bold mt-1">
                      {formatCurrency(totals.totalPayable)}
                    </p>
                  </div>
                  <Wallet className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Over Due</p>
                    <p className="text-xl font-bold mt-1">
                      {formatCurrency(totals.overDue)}
                    </p>
                  </div>
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Open / Draft
                    </p>
                    <p className="text-xl font-bold mt-1">
                      {formatCurrency(totals.open)}
                    </p>
                  </div>
                  <FileText className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Paid</p>
                    <p className="text-xl font-bold mt-1">
                      {formatCurrency(totals.paid)}
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="xl:col-span-7">
          <Card className="rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle>PO Summary Graph</CardTitle>
              <CardDescription>
                Date-wise view of total payable, overdue, open and paid values.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar
                      dataKey="totalPayable"
                      name="Total Payable"
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey="overDue"
                      name="Over Due"
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey="open"
                      name="Open / Draft"
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar dataKey="paid" name="Paid" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-3xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Purchase Order List
          </CardTitle>
          <CardDescription>
            All created purchase orders with status and actions.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-2xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>P.O.</TableHead>
                  <TableHead>ESTIMATE #</TableHead>
                  <TableHead>SUPPLIER</TableHead>
                  <TableHead>DATE</TableHead>
                  <TableHead className="text-right">TOTAL</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>ACTION</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {purchaseOrders.length > 0 ? (
                  purchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">
                        {po.poNumber}
                      </TableCell>

                      <TableCell>{po.estimateNumber || "-"}</TableCell>

                      <TableCell>{po.supplierName || "-"}</TableCell>

                      <TableCell>
                        {formatDateDisplay(po.issueDate) || "-"}
                      </TableCell>

                      <TableCell className="text-right">
                        {formatCurrency(po.totalAmount || 0)}
                      </TableCell>

                      <TableCell>
                        <Select
                          value={
                            po.status === "Over Due" ? "Over Due" : po.status
                          }
                          onValueChange={(value) =>
                            handleStatusChange(
                              po.id,
                              value as PurchaseOrderStatus,
                            )
                          }
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="Draft">Draft</SelectItem>
                            <SelectItem value="Open">Open</SelectItem>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>

                            {po.status === "Over Due" && (
                              <SelectItem value="Over Due">Over Due</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditPO(po)}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewPO(po)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDuplicatePO(po)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Duplicate
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGeneratePOPdf(po)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            PDF
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeletePO(po.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-8"
                    >
                      No purchase orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl rounded-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Order Details</DialogTitle>
          </DialogHeader>

          {viewingPO ? <PurchaseOrderView po={viewingPO} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
