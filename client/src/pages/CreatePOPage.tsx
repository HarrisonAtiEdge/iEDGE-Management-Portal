// import React, { useEffect, useMemo, useState } from "react";
// import { useLocation } from "wouter";
// import {
//   addDoc,
//   collection,
//   doc,
//   onSnapshot,
//   orderBy,
//   query,
//   serverTimestamp,
//   Timestamp,
//   updateDoc,
// } from "firebase/firestore";
// import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";

// import { db } from "@/lib/firebase";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
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
// import { useToast } from "@/hooks/use-toast";

// const PANEL_ID = "IEDGE-SYSTEM";
// const PO_LIST_ROUTE = "/purchase-orders";

// const suppliersCollectionRef = collection(db, "Panels", PANEL_ID, "suppliers");
// const poCollectionRef = collection(db, "Panels", PANEL_ID, "PO");
// const estimatesCollectionRef = collection(db, "Panels", PANEL_ID, "estimates");

// type Supplier = {
//   id: string;
//   name: string;
//   supplierName?: string;
//   vendorName?: string;
//   companyName?: string;
//   businessName?: string;
//   title?: string;
//   address?: string;
//   city?: string;
//   country?: string;
// };

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

// type EstimateLite = {
//   id: string;
//   estimateNumber?: string;
//   projectName?: string;
//   client?: string;
//   items: EstimateLineItem[];
//   totalAmount: number;
// };

// type POFormState = {
//   estimateId: string;
//   estimateNumber: string;
//   supplierId: string;
//   issueDate: string;
//   dueDate: string;
//   items: EstimateLineItem[];
//   status: PurchaseOrderStatus;
//   notes: string;

//   source?: "manual" | "budget_request";
//   sourceInvoiceId?: string;
//   sourceRequestId?: string;
//   sourceProjectName?: string;
//   sourceClientName?: string;
//   sourceSupplierName?: string;
// };

// const todayString = () => new Date().toISOString().slice(0, 10);

// const newItemRow = (): EstimateLineItem => ({
//   service: "",
//   qty: "",
//   rate: "",
//   amount: 0,
// });

// const createEmptyPOForm = (): POFormState => ({
//   estimateId: "",
//   estimateNumber: "",
//   supplierId: "",
//   issueDate: todayString(),
//   dueDate: "",
//   items: [newItemRow()],
//   status: "Draft",
//   notes: "",
//   source: "manual",
//   sourceInvoiceId: "",
//   sourceRequestId: "",
//   sourceProjectName: "",
//   sourceClientName: "",
//   sourceSupplierName: "",
// });

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

// function toInputDateValue(value: any): string {
//   if (!value) return "";

//   if (typeof value === "string") {
//     if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
//     const parsed = new Date(value);
//     if (!Number.isNaN(parsed.getTime())) {
//       const year = parsed.getFullYear();
//       const month = String(parsed.getMonth() + 1).padStart(2, "0");
//       const day = String(parsed.getDate()).padStart(2, "0");
//       return `${year}-${month}-${day}`;
//     }
//     return "";
//   }

//   let date: Date | null = null;
//   if (value instanceof Date) date = value;
//   else if (typeof value?.toDate === "function") date = value.toDate();
//   else if (typeof value?.seconds === "number") date = new Date(value.seconds * 1000);

//   if (!date || Number.isNaN(date.getTime())) return "";
//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, "0");
//   const day = String(date.getDate()).padStart(2, "0");
//   return `${year}-${month}-${day}`;
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

// function toFirestoreDate(value: string) {
//   if (!value) return null;
//   const parsed = new Date(`${value}T00:00:00`);
//   if (Number.isNaN(parsed.getTime())) return null;
//   return Timestamp.fromDate(parsed);
// }

// function getSupplierDisplayName(supplier: any) {
//   return safeText(
//     supplier?.supplierName,
//     supplier?.vendorName,
//     supplier?.name,
//     supplier?.companyName,
//     supplier?.businessName,
//     supplier?.title
//   );
// }

// function normalizeLookupText(value: any) {
//   return safeText(value).toLowerCase().replace(/\s+/g, " ").trim();
// }

// function getBudgetItemSupplierName(item: any): string {
//   const original = item?.original || {};

//   return safeText(
//     item?.supplierName,
//     item?.supplier,
//     item?.supplierText,
//     item?.vendorName,
//     item?.vendor,
//     item?.vendorText,
//     item?.companyName,
//     original?.supplierName,
//     original?.supplier,
//     original?.supplierText,
//     original?.vendorName,
//     original?.vendor,
//     original?.vendorText,
//     original?.companyName
//   );
// }

// function getBudgetSourceSupplierName(source: any): string {
//   const directSupplier = safeText(
//     source?.supplierName,
//     source?.supplier,
//     source?.supplierText,
//     source?.vendorName,
//     source?.vendor,
//     source?.vendorText
//   );

//   if (directSupplier) return directSupplier;

//   const approvedSupplier = asArray(source?.approvalItems)
//     .map((item) => getBudgetItemSupplierName(item))
//     .find(Boolean);

//   if (approvedSupplier) return approvedSupplier;

//   return (
//     asArray(source?.items)
//       .map((item) => getBudgetItemSupplierName(item))
//       .find(Boolean) || ""
//   );
// }

// function buildServiceTextFromBudgetItem(item: any, source: any) {
//   const original = item?.original || {};

//   const serviceTitle = safeText(
//     original?.service,
//     item?.service,
//     item?.label,
//     item?.title,
//     item?.name,
//     original?.title,
//     original?.name,
//     original?.particular,
//     item?.particular
//   );

//   const serviceDescription = safeText(
//     original?.description,
//     item?.description,
//     item?.serviceDescription,
//     original?.serviceDescription,
//     item?.details,
//     original?.details,
//     item?.remarks,
//     original?.remarks,
//     item?.comment,
//     original?.comment,
//     item?.notes,
//     original?.notes
//   );

//   const lines = [
//     serviceTitle,
//     serviceDescription && normalizeLookupText(serviceDescription) !== normalizeLookupText(serviceTitle)
//       ? serviceDescription
//       : "",
//   ].filter(Boolean);

//   if (lines.length > 0) return lines.join("\n");

//   return safeText(source?.projectName, source?.clientName, "Budget Request");
// }

// function normalizeEstimateItems(raw: any): EstimateLineItem[] {
//   const possibleArrays = [
//     raw?.items,
//     raw?.services,
//     raw?.serviceDetails,
//     raw?.lineItems,
//     raw?.estimateItems,
//     raw?.rows,
//   ];

//   const source = possibleArrays.find((entry) => Array.isArray(entry)) || [];

//   const items = source
//     .map((item: any) => {
//       const qty = safeNumber(item?.qty, item?.quantity, item?.units, item?.unit, item?.count);
//       const rate = safeNumber(item?.rate, item?.unitRate, item?.price, item?.cost);
//       const amount = safeNumber(
//         item?.amount,
//         item?.lineTotal,
//         item?.total,
//         item?.netAmount,
//         qty * rate,
//       );

//       return {
//         service: safeText(
//           item?.service,
//           item?.description,
//           item?.name,
//           item?.title,
//           item?.serviceName,
//           item?.particular,
//         ),
//         qty: qty ? String(qty) : "",
//         rate: rate ? String(rate) : "",
//         amount,
//       };
//     })
//     .filter((item: EstimateLineItem) => item.service || item.qty || item.rate || item.amount);

//   if (items.length > 0) return items;

//   const fallbackDescription = [
//     safeText(raw?.service),
//     safeText(raw?.description),
//     safeText(raw?.projectName),
//   ]
//     .filter(Boolean)
//     .join("\n");

//   if (!fallbackDescription) return [newItemRow()];

//   return [
//     {
//       service: fallbackDescription,
//       qty: "1",
//       rate: String(safeNumber(raw?.amount, raw?.grandTotal, raw?.totalAmount, raw?.total)),
//       amount: safeNumber(raw?.amount, raw?.grandTotal, raw?.totalAmount, raw?.total),
//     },
//   ];
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

// function buildPOItemsFromBudgetRequest(source: any): EstimateLineItem[] {
//   const approvedItems = asArray(source?.approvalItems).filter(
//     (item) => item?.decision === "approved",
//   );

//   const rawItems = approvedItems.length > 0 ? approvedItems : asArray(source?.items);

//   const mappedItems = rawItems
//     .map((item: any) => {
//       const amount = safeNumber(
//         item?.approvedAmount,
//         item?.requestedAmount,
//         item?.amount,
//         item?.total,
//         item?.value,
//       );

//       return {
//         service: buildServiceTextFromBudgetItem(item, source),
//         qty: "1",
//         rate: amount ? String(amount) : "",
//         amount,
//       };
//     })
//     .filter((item: EstimateLineItem) => item.service || item.amount);

//   if (mappedItems.length > 0) return mappedItems;

//   const fallbackAmount = safeNumber(source?.amount, source?.approvedAmount, source?.totalAmount);

//   return [
//     {
//       service: [
//         "Budget Request",
//         source?.requestId ? `Request ID: ${source.requestId}` : "",
//         source?.projectName ? `Project: ${source.projectName}` : "",
//         source?.clientName ? `Client: ${source.clientName}` : "",
//       ]
//         .filter(Boolean)
//         .join("\n"),
//       qty: "1",
//       rate: fallbackAmount ? String(fallbackAmount) : "",
//       amount: fallbackAmount,
//     },
//   ];
// }

// export default function CreatePOPage() {
//   const { toast } = useToast();
//   const [, setLocation] = useLocation();

//   const [suppliers, setSuppliers] = useState<Supplier[]>([]);
//   const [estimates, setEstimates] = useState<EstimateLite[]>([]);
//   const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
//   const [poForm, setPOForm] = useState<POFormState>(() => createEmptyPOForm());
//   const [editingPOId, setEditingPOId] = useState<string | null>(null);
//   const [savingPO, setSavingPO] = useState(false);

//   useEffect(() => {
//     const rawEditPO = localStorage.getItem("editPOForCreatePage");
//     const rawDuplicatePO = localStorage.getItem("duplicatePOForCreatePage");
//     const rawSource = localStorage.getItem("createPOFromBudgetRequest");

//     if (rawEditPO) {
//       try {
//         const po = JSON.parse(rawEditPO) as PurchaseOrder;
//         setEditingPOId(po.id);
//         setPOForm({
//           estimateId: po.estimateId || "",
//           estimateNumber: po.estimateNumber || "",
//           supplierId: po.supplierId || "",
//           issueDate: toInputDateValue(po.issueDate) || todayString(),
//           dueDate: toInputDateValue(po.dueDate),
//           items: po.items?.length ? po.items : [newItemRow()],
//           status: po.status === "Over Due" ? "Open" : po.status,
//           notes: po.notes || "",
//           source: po.source || "manual",
//           sourceInvoiceId: po.sourceInvoiceId || "",
//           sourceRequestId: po.sourceRequestId || "",
//           sourceProjectName: po.sourceProjectName || "",
//           sourceClientName: po.sourceClientName || "",
//           sourceSupplierName: po.supplierName || "",
//         });
//       } catch (error) {
//         console.error("Could not read PO edit source:", error);
//       } finally {
//         localStorage.removeItem("editPOForCreatePage");
//       }
//       return;
//     }

//     if (rawDuplicatePO) {
//       try {
//         const po = JSON.parse(rawDuplicatePO) as PurchaseOrder;
//         setEditingPOId(null);
//         setPOForm({
//           estimateId: po.estimateId || "",
//           estimateNumber: po.estimateNumber || "",
//           supplierId: po.supplierId || "",
//           issueDate: todayString(),
//           dueDate: toInputDateValue(po.dueDate),
//           items: po.items?.length ? po.items : [newItemRow()],
//           status: "Draft",
//           notes: po.notes || "",
//           source: po.source || "manual",
//           sourceInvoiceId: po.sourceInvoiceId || "",
//           sourceRequestId: po.sourceRequestId || "",
//           sourceProjectName: po.sourceProjectName || "",
//           sourceClientName: po.sourceClientName || "",
//           sourceSupplierName: po.supplierName || "",
//         });
//       } catch (error) {
//         console.error("Could not read PO duplicate source:", error);
//       } finally {
//         localStorage.removeItem("duplicatePOForCreatePage");
//       }
//       return;
//     }

//     if (!rawSource) return;

//     try {
//       const source = JSON.parse(rawSource);
//       const estimateNumber = safeText(
//         source.estimateValue,
//         source.estimateNumber,
//         source.estimateNo,
//         source.estimateCode,
//         source.invoiceNo,
//         source.number,
//         source.selectedEstimate,
//         source.selectEstimate,
//         source.estimateText,
//         source.estimate
//       );
//       const sourceSupplierName = getBudgetSourceSupplierName(source);
//       const manualSupplierValue = sourceSupplierName ? `name:${sourceSupplierName}` : "";

//       setEditingPOId(null);
//       setPOForm({
//         ...createEmptyPOForm(),
//         estimateId: source.estimateId || source.invoiceRequestId || "",

//         // Visible estimate value/text fetched from Budget Request.
//         // Do not put source.estimateId here, because that is only the hidden/internal link.
//         estimateNumber,
//         supplierId: source.supplierId || source.vendorId || manualSupplierValue,

//         issueDate: todayString(),
//         dueDate: "",
//         items: buildPOItemsFromBudgetRequest(source),
//         status: "Draft",
//         notes: [
//           source.requestId ? `Created from Budget Request: ${source.requestId}` : "",
//           estimateNumber ? `Estimate: ${estimateNumber}` : "",
//           sourceSupplierName ? `Supplier: ${sourceSupplierName}` : "",
//           source.projectName ? `Project: ${source.projectName}` : "",
//           source.clientName ? `Client: ${source.clientName}` : "",
//         ]
//           .filter(Boolean)
//           .join("\n"),
//         source: "budget_request",
//         sourceInvoiceId: source.invoiceRequestId || "",
//         sourceRequestId: source.requestId || "",
//         sourceProjectName: source.projectName || "",
//         sourceClientName: source.clientName || "",
//         sourceSupplierName,
//       });
//     } catch (error) {
//       console.error("Could not open PO from budget request:", error);
//     } finally {
//       localStorage.removeItem("createPOFromBudgetRequest");
//     }
//   }, []);

//   useEffect(() => {
//     const unsubscribe = onSnapshot(
//       query(suppliersCollectionRef, orderBy("createdAt", "desc")),
//       (snapshot) => {
//         setSuppliers(
//           snapshot.docs.map((docSnap) => {
//             const data = docSnap.data() as Omit<Supplier, "id">;
//             return {
//               id: docSnap.id,
//               ...data,
//               name: getSupplierDisplayName(data) || data.name || "",
//             };
//           }),
//         );
//       },
//       (error) => console.error("Error loading suppliers:", error),
//     );

//     return () => unsubscribe();
//   }, []);

//   useEffect(() => {
//     if (!poForm.sourceSupplierName || !suppliers.length) return;
//     if (poForm.supplierId && !poForm.supplierId.startsWith("name:")) return;

//     const sourceSupplier = normalizeLookupText(poForm.sourceSupplierName);
//     const matchedSupplier = suppliers.find((supplier) => {
//       const supplierName = normalizeLookupText(getSupplierDisplayName(supplier));
//       return supplierName === sourceSupplier;
//     });

//     if (!matchedSupplier) return;

//     setPOForm((prev) => ({
//       ...prev,
//       supplierId: matchedSupplier.id,
//     }));
//   }, [suppliers, poForm.sourceSupplierName, poForm.supplierId]);

//   useEffect(() => {
//     const unsubscribe = onSnapshot(
//       query(estimatesCollectionRef, orderBy("createdAt", "desc")),
//       (snapshot) => {
//         const rows: EstimateLite[] = snapshot.docs.map((docSnap) => {
//           const data = docSnap.data();
//           const items = normalizeEstimateItems(data);
//           return {
//             id: docSnap.id,
//             estimateNumber: safeText(
//               data.estimateNumber,
//               data.estimateNo,
//               data.estimateCode,
//               data.invoiceNo,
//               data.number,
//               data.selectedEstimate,
//               data.selectEstimate,
//               data.estimateText,
//             ),
//             projectName: safeText(data.projectName),
//             client: safeText(data.client),
//             items,
//             totalAmount: safeNumber(data.totalAmount, data.grandTotal, data.total, getTotal(items)),
//           };
//         });
//         setEstimates(rows);
//       },
//       (error) => console.error("Error loading estimates:", error),
//     );

//     return () => unsubscribe();
//   }, []);

//   useEffect(() => {
//     if (!poForm.estimateId || estimates.length === 0) return;

//     const matchedEstimate = estimates.find((estimate) => estimate.id === poForm.estimateId);
//     if (!matchedEstimate?.estimateNumber) return;

//     setPOForm((prev) => {
//       const shouldReplaceInternalId =
//         !prev.estimateNumber || prev.estimateNumber === prev.estimateId;

//       if (!shouldReplaceInternalId) return prev;

//       return {
//         ...prev,
//         estimateNumber: matchedEstimate.estimateNumber || prev.estimateNumber,
//       };
//     });
//   }, [estimates, poForm.estimateId, poForm.estimateNumber]);

//   useEffect(() => {
//     const unsubscribe = onSnapshot(
//       query(poCollectionRef, orderBy("createdAt", "desc")),
//       (snapshot) => {
//         const rows: PurchaseOrder[] = snapshot.docs.map((docSnap) => {
//           const data = docSnap.data() as Omit<PurchaseOrder, "id">;
//           const items = sanitizeItems(asArray(data.items));
//           return {
//             id: docSnap.id,
//             ...data,
//             items,
//             totalAmount: safeNumber(data.totalAmount, getTotal(items)),
//           };
//         });
//         setPurchaseOrders(rows);
//       },
//       (error) => console.error("Error loading purchase orders:", error),
//     );

//     return () => unsubscribe();
//   }, []);

//   const filteredEstimates = useMemo(() => estimates, [estimates]);
//   const formTotal = useMemo(() => getTotal(poForm.items), [poForm.items]);

//   const handlePOChange = (field: keyof POFormState, value: string) => {
//     setPOForm((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleEstimateSelect = (estimateId: string) => {
//     const selectedEstimate = estimates.find((item) => item.id === estimateId);
//     if (!selectedEstimate) return;

//     setPOForm((prev) => ({
//       ...prev,
//       estimateId: selectedEstimate.id,
//       estimateNumber: selectedEstimate.estimateNumber || "",
//     }));
//   };

//   const handleLoadEstimate = () => {
//     const selectedEstimate =
//       estimates.find((item) => item.id === poForm.estimateId) ||
//       estimates.find((item) => item.estimateNumber === poForm.estimateNumber);

//     if (!selectedEstimate) {
//       toast({
//         title: "Estimate not found",
//         description: "Please select a valid estimate number first.",
//         variant: "destructive",
//       });
//       return;
//     }

//     setPOForm((prev) => ({
//       ...prev,
//       estimateId: selectedEstimate.id,
//       estimateNumber: selectedEstimate.estimateNumber || prev.estimateNumber,
//       items: selectedEstimate.items.length ? selectedEstimate.items : [newItemRow()],
//     }));

//     toast({ title: "Estimate loaded", description: "Estimate services and amounts loaded into the PO." });
//   };

//   const updatePOItem = (index: number, field: keyof EstimateLineItem, value: string) => {
//     setPOForm((prev) => {
//       const items = [...prev.items];
//       const current = { ...items[index] };
//       if (field === "service") current.service = value;
//       if (field === "qty") current.qty = value;
//       if (field === "rate") current.rate = value;
//       const qty = safeNumber(current.qty);
//       const rate = safeNumber(current.rate);
//       current.amount = qty * rate;
//       items[index] = current;
//       return { ...prev, items };
//     });
//   };

//   const addPOItem = () => setPOForm((prev) => ({ ...prev, items: [...prev.items, newItemRow()] }));

//   const removePOItem = (index: number) => {
//     setPOForm((prev) => ({
//       ...prev,
//       items: prev.items.length > 1 ? prev.items.filter((_, i) => i !== index) : [newItemRow()],
//     }));
//   };

//   const getNextPoNumber = (estimateNumber: string) => {
//     const cleanEstimateNumber = safeText(estimateNumber).replace(/^EST-?/i, "");
//     const matchingPOs = purchaseOrders.filter((po) => po.estimateNumber === estimateNumber);
//     const nextIndex = matchingPOs.length + 1;
//     return `PO-IE-${cleanEstimateNumber || estimateNumber}-${nextIndex}`;
//   };

//   const handleCreateOrUpdatePO = async () => {
//     const selectedSupplier =
//       suppliers.find((item) => item.id === poForm.supplierId) ||
//       (poForm.sourceSupplierName && poForm.supplierId === `name:${poForm.sourceSupplierName}`
//         ? ({ id: "", name: poForm.sourceSupplierName } as Supplier)
//         : undefined);

//     if (!poForm.estimateNumber.trim()) {
//       toast({ title: "Estimate required", description: "Please select estimate number.", variant: "destructive" });
//       return;
//     }

//     if (!selectedSupplier) {
//       toast({ title: "Supplier required", description: "Please select supplier.", variant: "destructive" });
//       return;
//     }

//     const cleanItems = sanitizeItems(poForm.items);
//     if (cleanItems.length === 0) {
//       toast({ title: "Items required", description: "Please add at least one service row.", variant: "destructive" });
//       return;
//     }

//     const payload = {
//       poNumber: editingPOId
//         ? purchaseOrders.find((item) => item.id === editingPOId)?.poNumber || getNextPoNumber(poForm.estimateNumber)
//         : getNextPoNumber(poForm.estimateNumber),

//       estimateId: poForm.estimateId || null,
//       estimateNumber: poForm.estimateNumber,

//       source: poForm.source || "manual",
//       sourceInvoiceId: poForm.sourceInvoiceId || null,
//       sourceRequestId: poForm.sourceRequestId || null,
//       sourceProjectName: poForm.sourceProjectName || null,
//       sourceClientName: poForm.sourceClientName || null,

//       supplierId: selectedSupplier.id,
//       supplierName: selectedSupplier.name,
//       supplierAddress: [
//         selectedSupplier.name,
//         selectedSupplier.address,
//         [selectedSupplier.city, selectedSupplier.country].filter(Boolean).join(", "),
//       ]
//         .filter(Boolean)
//         .join("\n"),

//       issueDate: poForm.issueDate,
//       dueDate: toFirestoreDate(poForm.dueDate),
//       items: cleanItems,
//       totalAmount: getTotal(cleanItems),
//       status: poForm.status,
//       notes: poForm.notes,
//       updatedAt: serverTimestamp(),
//     };

//     try {
//       setSavingPO(true);

//       if (editingPOId) {
//         await updateDoc(doc(db, "Panels", PANEL_ID, "PO", editingPOId), payload);
//         toast({ title: "PO updated", description: "Purchase order updated successfully." });
//       } else {
//         const createdPORef = await addDoc(poCollectionRef, {
//           ...payload,
//           createdAt: serverTimestamp(),
//         });

//         // Important: mark the linked Budget Request as PO submitted.
//         // This makes the Create PO button disappear from Budget Request
//         // and enables Submit Expense for Operations.
//         if (poForm.source === "budget_request" && poForm.sourceInvoiceId) {
//           await updateDoc(
//             doc(db, "Panels", PANEL_ID, "invoiceRequests", poForm.sourceInvoiceId),
//             {
//               poCreated: true,
//               poSubmitted: true,
//               poId: createdPORef.id,
//               poNumber: payload.poNumber,
//               poSubmittedAt: serverTimestamp(),
//               expenseReady: true,
//               expenseSource: "po",
//               expenseApprovalRequired: false,
//               expenseRequiresApproval: false,
//               updatedAt: serverTimestamp(),
//             },
//           );
//         }

//         toast({ title: "PO created", description: "Purchase order saved successfully." });
//       }

//       setLocation(PO_LIST_ROUTE);
//     } catch (error) {
//       console.error("Error saving PO:", error);
//       toast({ title: "Save failed", description: "Could not save purchase order.", variant: "destructive" });
//     } finally {
//       setSavingPO(false);
//     }
//   };

//   return (
//     <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
//       <div className="flex items-center justify-between gap-4 flex-wrap">
//         <div>
//           <Button variant="ghost" className="mb-3 -ml-3" onClick={() => setLocation(PO_LIST_ROUTE)}>
//             <ArrowLeft className="h-4 w-4 mr-2" /> Back to PO List
//           </Button>
//           <h1 className="text-2xl font-bold tracking-tight">
//             {editingPOId ? "Edit Purchase Order" : "Create Purchase Order"}
//           </h1>
//           <p className="text-sm text-muted-foreground">
//             Create PO on a separate page. This page can be opened directly from Budget Request or from the PO list.
//           </p>
//         </div>

//         <Button onClick={handleCreateOrUpdatePO} disabled={savingPO} className="rounded-2xl">
//           <Save className="h-4 w-4 mr-2" />
//           {savingPO ? "Saving..." : editingPOId ? "Update PO" : "Save PO"}
//         </Button>
//       </div>

//       <Card className="rounded-3xl shadow-sm">
//         <CardHeader>
//           <CardTitle>PO Information</CardTitle>
//           <CardDescription>Select estimate, supplier, dates and status.</CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//             <div className="space-y-2 lg:col-span-3">
//               <Label>Estimate Number</Label>
//               <Input
//                 list="estimate-number-options"
//                 value={poForm.estimateNumber}
//                 onChange={(e) => {
//                   const value = e.target.value;
//                   const matched = filteredEstimates.find((item) => item.estimateNumber === value);
//                   if (matched) {
//                     handleEstimateSelect(matched.id);
//                   } else {
//                     handlePOChange("estimateNumber", value);
//                   }
//                 }}
//                 placeholder="Search estimate number"
//               />
//               <datalist id="estimate-number-options">
//                 {filteredEstimates.map((estimate) => (
//                   <option key={estimate.id} value={estimate.estimateNumber || ""}>
//                     {[estimate.estimateNumber, estimate.projectName, estimate.client].filter(Boolean).join(" - ")}
//                   </option>
//                 ))}
//               </datalist>
//             </div>

//             <div className="space-y-2 flex items-end">
//               <Button type="button" variant="outline" className="w-full" onClick={handleLoadEstimate}>
//                 Load Estimate
//               </Button>
//             </div>

//             <div className="space-y-2 lg:col-span-2">
//               <Label>Supplier</Label>
//               <Select value={poForm.supplierId} onValueChange={(value) => handlePOChange("supplierId", value)}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select supplier" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {poForm.sourceSupplierName &&
//                     !suppliers.some(
//                       (supplier) =>
//                         normalizeLookupText(getSupplierDisplayName(supplier)) ===
//                         normalizeLookupText(poForm.sourceSupplierName)
//                     ) && (
//                       <SelectItem value={`name:${poForm.sourceSupplierName}`}>
//                         {poForm.sourceSupplierName}
//                       </SelectItem>
//                     )}

//                   {suppliers.map((supplier) => {
//                     const supplierName = getSupplierDisplayName(supplier);
//                     return (
//                       <SelectItem key={supplier.id} value={supplier.id}>
//                         {supplierName}
//                       </SelectItem>
//                     );
//                   })}
//                 </SelectContent>
//               </Select>
//             </div>

//             <div className="space-y-2">
//               <Label>Date</Label>
//               <Input type="date" value={poForm.issueDate} onChange={(e) => handlePOChange("issueDate", e.target.value)} />
//             </div>

//             <div className="space-y-2">
//               <Label>Due Date</Label>
//               <Input type="date" value={poForm.dueDate} onChange={(e) => handlePOChange("dueDate", e.target.value)} />
//             </div>

//             <div className="space-y-2">
//               <Label>Status</Label>
//               <Select value={poForm.status} onValueChange={(value) => handlePOChange("status", value)}>
//                 <SelectTrigger>
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="Draft">Draft</SelectItem>
//                   <SelectItem value="Open">Open</SelectItem>
//                   <SelectItem value="Paid">Paid</SelectItem>
//                   <SelectItem value="Cancelled">Cancelled</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       <Card className="rounded-3xl shadow-sm">
//         <CardHeader>
//           <div className="flex items-center justify-between gap-3 flex-wrap">
//             <div>
//               <CardTitle>Services</CardTitle>
//               <CardDescription>Add services, quantity, rate and amount.</CardDescription>
//             </div>
//             <Button type="button" variant="outline" size="sm" onClick={addPOItem}>
//               <Plus className="h-4 w-4 mr-1" /> Add Row
//             </Button>
//           </div>
//         </CardHeader>
//         <CardContent className="space-y-5">
//           <div className="rounded-2xl border overflow-hidden bg-white">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead className="w-[52%]">Service</TableHead>
//                   <TableHead className="w-[12%]">QTY</TableHead>
//                   <TableHead className="w-[16%]">Rate</TableHead>
//                   <TableHead className="w-[16%]">Amount</TableHead>
//                   <TableHead className="w-[4%]"></TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {poForm.items.map((item, index) => (
//                   <TableRow key={index}>
//                     <TableCell>
//                       <Textarea
//                         value={item.service}
//                         onChange={(e) => updatePOItem(index, "service", e.target.value)}
//                         rows={2}
//                         placeholder="Service details"
//                       />
//                     </TableCell>
//                     <TableCell>
//                       <Input
//                         value={item.qty}
//                         onChange={(e) => updatePOItem(index, "qty", e.target.value)}
//                         placeholder="0"
//                       />
//                     </TableCell>
//                     <TableCell>
//                       <Input
//                         value={item.rate}
//                         onChange={(e) => updatePOItem(index, "rate", e.target.value)}
//                         placeholder="0.00"
//                       />
//                     </TableCell>
//                     <TableCell className="text-right font-medium">{formatNumber(item.amount || 0)}</TableCell>
//                     <TableCell>
//                       <Button type="button" variant="ghost" size="sm" onClick={() => removePOItem(index)}>
//                         <Trash2 className="h-4 w-4 text-red-600" />
//                       </Button>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </div>

//           <div className="space-y-2">
//             <Label>Notes</Label>
//             <Textarea
//               value={poForm.notes}
//               onChange={(e) => handlePOChange("notes", e.target.value)}
//               rows={3}
//               placeholder="Optional notes"
//             />
//           </div>

//           <div className="flex justify-end">
//             <div className="w-full max-w-xs rounded-2xl border bg-muted/30 p-4">
//               <div className="flex items-center justify-between text-base font-semibold">
//                 <span>Total</span>
//                 <span>{formatCurrency(formTotal)}</span>
//               </div>
//             </div>
//           </div>

//           <div className="flex justify-end gap-3 pt-2">
//             <Button variant="outline" onClick={() => setLocation(PO_LIST_ROUTE)}>
//               Cancel
//             </Button>
//             <Button onClick={handleCreateOrUpdatePO} disabled={savingPO}>
//               {savingPO ? "Saving..." : editingPOId ? "Update PO" : "Save PO"}
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";

import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPurchaseOrderEditLockReason,
  isPurchaseOrderAdminRole,
} from "@/lib/purchaseOrderRules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";

const PANEL_ID = "IEDGE-SYSTEM";
const PO_LIST_ROUTE = "/purchase-orders";

const suppliersCollectionRef = collection(db, "Panels", PANEL_ID, "suppliers");
const poCollectionRef = collection(db, "Panels", PANEL_ID, "PO");
const estimatesCollectionRef = collection(db, "Panels", PANEL_ID, "estimates");

type Supplier = {
  id: string;
  name: string;
  supplierName?: string;
  vendorName?: string;
  companyName?: string;
  businessName?: string;
  title?: string;
  address?: string;
  city?: string;
  country?: string;
};

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

type EstimateLite = {
  id: string;
  estimateNumber?: string;
  projectName?: string;
  client?: string;
  items: EstimateLineItem[];
  totalAmount: number;
};

type POFormState = {
  estimateId: string;
  estimateNumber: string;
  supplierId: string;
  issueDate: string;
  dueDate: string;
  items: EstimateLineItem[];
  status: PurchaseOrderStatus;
  notes: string;

  source?: "manual" | "budget_request";
  sourceInvoiceId?: string;
  sourceRequestId?: string;
  sourceProjectName?: string;
  sourceClientName?: string;
  sourceSupplierName?: string;
};

const todayString = () => new Date().toISOString().slice(0, 10);

const newItemRow = (): EstimateLineItem => ({
  service: "",
  qty: "",
  rate: "",
  amount: 0,
});

const createEmptyPOForm = (): POFormState => ({
  estimateId: "",
  estimateNumber: "",
  supplierId: "",
  issueDate: todayString(),
  dueDate: "",
  items: [newItemRow()],
  status: "Draft",
  notes: "",
  source: "manual",
  sourceInvoiceId: "",
  sourceRequestId: "",
  sourceProjectName: "",
  sourceClientName: "",
  sourceSupplierName: "",
});

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

function toInputDateValue(value: any): string {
  if (!value) return "";

  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, "0");
      const day = String(parsed.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    return "";
  }

  let date: Date | null = null;
  if (value instanceof Date) date = value;
  else if (typeof value?.toDate === "function") date = value.toDate();
  else if (typeof value?.seconds === "number")
    date = new Date(value.seconds * 1000);

  if (!date || Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function toFirestoreDate(value: string) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return Timestamp.fromDate(parsed);
}

function getSupplierDisplayName(supplier: any) {
  return safeText(
    supplier?.supplierName,
    supplier?.vendorName,
    supplier?.name,
    supplier?.companyName,
    supplier?.businessName,
    supplier?.title,
  );
}

function normalizeLookupText(value: any) {
  return safeText(value).toLowerCase().replace(/\s+/g, " ").trim();
}

function getBudgetItemSupplierName(item: any): string {
  const original = item?.original || {};

  return safeText(
    item?.supplierName,
    item?.supplier,
    item?.supplierText,
    item?.vendorName,
    item?.vendor,
    item?.vendorText,
    item?.companyName,
    original?.supplierName,
    original?.supplier,
    original?.supplierText,
    original?.vendorName,
    original?.vendor,
    original?.vendorText,
    original?.companyName,
  );
}

function getBudgetSourceSupplierName(source: any): string {
  const directSupplier = safeText(
    source?.supplierName,
    source?.supplier,
    source?.supplierText,
    source?.vendorName,
    source?.vendor,
    source?.vendorText,
  );

  if (directSupplier) return directSupplier;

  const approvedSupplier = asArray(source?.approvalItems)
    .map((item) => getBudgetItemSupplierName(item))
    .find(Boolean);

  if (approvedSupplier) return approvedSupplier;

  return (
    asArray(source?.items)
      .map((item) => getBudgetItemSupplierName(item))
      .find(Boolean) || ""
  );
}

function buildServiceTextFromBudgetItem(item: any, source: any) {
  const original = item?.original || {};

  const serviceTitle = safeText(
    original?.service,
    item?.service,
    item?.label,
    item?.title,
    item?.name,
    original?.title,
    original?.name,
    original?.particular,
    item?.particular,
  );

  const serviceDescription = safeText(
    original?.description,
    item?.description,
    item?.serviceDescription,
    original?.serviceDescription,
    item?.details,
    original?.details,
    item?.remarks,
    original?.remarks,
    item?.comment,
    original?.comment,
    item?.notes,
    original?.notes,
  );

  const lines = [
    serviceTitle,
    serviceDescription &&
    normalizeLookupText(serviceDescription) !==
      normalizeLookupText(serviceTitle)
      ? serviceDescription
      : "",
  ].filter(Boolean);

  if (lines.length > 0) return lines.join("\n");

  return safeText(source?.projectName, source?.clientName, "Budget Request");
}

function normalizeEstimateItems(raw: any): EstimateLineItem[] {
  const possibleArrays = [
    raw?.items,
    raw?.services,
    raw?.serviceDetails,
    raw?.lineItems,
    raw?.estimateItems,
    raw?.rows,
  ];

  const source = possibleArrays.find((entry) => Array.isArray(entry)) || [];

  const items = source
    .map((item: any) => {
      const qty = safeNumber(
        item?.qty,
        item?.quantity,
        item?.units,
        item?.unit,
        item?.count,
      );
      const rate = safeNumber(
        item?.rate,
        item?.unitRate,
        item?.price,
        item?.cost,
      );
      const amount = safeNumber(
        item?.amount,
        item?.lineTotal,
        item?.total,
        item?.netAmount,
        qty * rate,
      );

      return {
        service: safeText(
          item?.service,
          item?.description,
          item?.name,
          item?.title,
          item?.serviceName,
          item?.particular,
        ),
        qty: qty ? String(qty) : "",
        rate: rate ? String(rate) : "",
        amount,
      };
    })
    .filter(
      (item: EstimateLineItem) =>
        item.service || item.qty || item.rate || item.amount,
    );

  if (items.length > 0) return items;

  const fallbackDescription = [
    safeText(raw?.service),
    safeText(raw?.description),
    safeText(raw?.projectName),
  ]
    .filter(Boolean)
    .join("\n");

  if (!fallbackDescription) return [newItemRow()];

  return [
    {
      service: fallbackDescription,
      qty: "1",
      rate: String(
        safeNumber(raw?.amount, raw?.grandTotal, raw?.totalAmount, raw?.total),
      ),
      amount: safeNumber(
        raw?.amount,
        raw?.grandTotal,
        raw?.totalAmount,
        raw?.total,
      ),
    },
  ];
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

function buildPOItemsFromBudgetRequest(source: any): EstimateLineItem[] {
  const approvedItems = asArray(source?.approvalItems).filter(
    (item) => item?.decision === "approved",
  );

  const rawItems =
    approvedItems.length > 0 ? approvedItems : asArray(source?.items);

  const mappedItems = rawItems
    .map((item: any) => {
      const amount = safeNumber(
        item?.approvedAmount,
        item?.requestedAmount,
        item?.amount,
        item?.total,
        item?.value,
      );

      return {
        service: buildServiceTextFromBudgetItem(item, source),
        qty: "1",
        rate: amount ? String(amount) : "",
        amount,
      };
    })
    .filter((item: EstimateLineItem) => item.service || item.amount);

  if (mappedItems.length > 0) return mappedItems;

  const fallbackAmount = safeNumber(
    source?.amount,
    source?.approvedAmount,
    source?.totalAmount,
  );

  return [
    {
      service: [
        "Budget Request",
        source?.requestId ? `Request ID: ${source.requestId}` : "",
        source?.projectName ? `Project: ${source.projectName}` : "",
        source?.clientName ? `Client: ${source.clientName}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      qty: "1",
      rate: fallbackAmount ? String(fallbackAmount) : "",
      amount: fallbackAmount,
    },
  ];
}

export default function CreatePOPage() {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [, setLocation] = useLocation();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [estimates, setEstimates] = useState<EstimateLite[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [poForm, setPOForm] = useState<POFormState>(() => createEmptyPOForm());
  const [editingPOId, setEditingPOId] = useState<string | null>(null);
  const [savingPO, setSavingPO] = useState(false);

  useEffect(() => {
    const rawEditPO =
      localStorage.getItem("createPOEditData") ||
      localStorage.getItem("editPOForCreatePage");

    const rawDuplicatePO =
      localStorage.getItem("createPODuplicateData") ||
      localStorage.getItem("duplicatePOForCreatePage");

    const rawSource = localStorage.getItem("createPOFromBudgetRequest");

    if (rawEditPO) {
      try {
        const po = JSON.parse(rawEditPO) as PurchaseOrder;
        setEditingPOId(po.id);
        setPOForm({
          estimateId: po.estimateId || "",
          estimateNumber: po.estimateNumber || "",
          supplierId: po.supplierId || "",
          issueDate: toInputDateValue(po.issueDate) || todayString(),
          dueDate: toInputDateValue(po.dueDate),
          items: po.items?.length ? po.items : [newItemRow()],
          status: po.status === "Over Due" ? "Open" : po.status,
          notes: po.notes || "",
          source: po.source || "manual",
          sourceInvoiceId: po.sourceInvoiceId || "",
          sourceRequestId: po.sourceRequestId || "",
          sourceProjectName: po.sourceProjectName || "",
          sourceClientName: po.sourceClientName || "",
          sourceSupplierName: po.supplierName || "",
        });
      } catch (error) {
        console.error("Could not read PO edit source:", error);
      } finally {
        localStorage.removeItem("createPOEditData");
        localStorage.removeItem("editPOForCreatePage");
      }
      return;
    }

    if (rawDuplicatePO) {
      try {
        const po = JSON.parse(rawDuplicatePO) as PurchaseOrder;
        setEditingPOId(null);
        setPOForm({
          estimateId: po.estimateId || "",
          estimateNumber: po.estimateNumber || "",
          supplierId: po.supplierId || "",
          issueDate: todayString(),
          dueDate: toInputDateValue(po.dueDate),
          items: po.items?.length ? po.items : [newItemRow()],
          status: "Draft",
          notes: po.notes || "",
          source: po.source || "manual",
          sourceInvoiceId: po.sourceInvoiceId || "",
          sourceRequestId: po.sourceRequestId || "",
          sourceProjectName: po.sourceProjectName || "",
          sourceClientName: po.sourceClientName || "",
          sourceSupplierName: po.supplierName || "",
        });
      } catch (error) {
        console.error("Could not read PO duplicate source:", error);
      } finally {
        localStorage.removeItem("createPODuplicateData");
        localStorage.removeItem("duplicatePOForCreatePage");
      }
      return;
    }

    if (!rawSource) return;

    try {
      const source = JSON.parse(rawSource);
      const estimateNumber = safeText(
        source.estimateValue,
        source.estimateNumber,
        source.estimateNo,
        source.estimateCode,
        source.invoiceNo,
        source.number,
        source.selectedEstimate,
        source.selectEstimate,
        source.estimateText,
        source.estimate,
      );
      const sourceSupplierName = getBudgetSourceSupplierName(source);
      const manualSupplierValue = sourceSupplierName
        ? `name:${sourceSupplierName}`
        : "";

      setEditingPOId(null);
      setPOForm({
        ...createEmptyPOForm(),
        estimateId: source.estimateId || source.invoiceRequestId || "",

        // Visible estimate value/text fetched from Budget Request.
        // Do not put source.estimateId here, because that is only the hidden/internal link.
        estimateNumber,
        supplierId: source.supplierId || source.vendorId || manualSupplierValue,

        issueDate: todayString(),
        dueDate: "",
        items: buildPOItemsFromBudgetRequest(source),
        status: "Draft",
        notes: [
          source.requestId
            ? `Created from Budget Request: ${source.requestId}`
            : "",
          estimateNumber ? `Estimate: ${estimateNumber}` : "",
          sourceSupplierName ? `Supplier: ${sourceSupplierName}` : "",
          source.projectName ? `Project: ${source.projectName}` : "",
          source.clientName ? `Client: ${source.clientName}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        source: "budget_request",
        sourceInvoiceId: source.invoiceRequestId || "",
        sourceRequestId: source.requestId || "",
        sourceProjectName: source.projectName || "",
        sourceClientName: source.clientName || "",
        sourceSupplierName,
      });
    } catch (error) {
      console.error("Could not open PO from budget request:", error);
    } finally {
      localStorage.removeItem("createPOFromBudgetRequest");
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(suppliersCollectionRef, orderBy("createdAt", "desc")),
      (snapshot) => {
        setSuppliers(
          snapshot.docs.map((docSnap) => {
            const data = docSnap.data() as Omit<Supplier, "id">;
            return {
              id: docSnap.id,
              ...data,
              name: getSupplierDisplayName(data) || data.name || "",
            };
          }),
        );
      },
      (error) => console.error("Error loading suppliers:", error),
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!poForm.sourceSupplierName || !suppliers.length) return;
    if (poForm.supplierId && !poForm.supplierId.startsWith("name:")) return;

    const sourceSupplier = normalizeLookupText(poForm.sourceSupplierName);
    const matchedSupplier = suppliers.find((supplier) => {
      const supplierName = normalizeLookupText(
        getSupplierDisplayName(supplier),
      );
      return supplierName === sourceSupplier;
    });

    if (!matchedSupplier) return;

    setPOForm((prev) => ({
      ...prev,
      supplierId: matchedSupplier.id,
    }));
  }, [suppliers, poForm.sourceSupplierName, poForm.supplierId]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(estimatesCollectionRef, orderBy("createdAt", "desc")),
      (snapshot) => {
        const rows: EstimateLite[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const items = normalizeEstimateItems(data);
          return {
            id: docSnap.id,
            estimateNumber: safeText(
              data.estimateNumber,
              data.estimateNo,
              data.estimateCode,
              data.invoiceNo,
              data.number,
              data.selectedEstimate,
              data.selectEstimate,
              data.estimateText,
            ),
            projectName: safeText(data.projectName),
            client: safeText(data.client),
            items,
            totalAmount: safeNumber(
              data.totalAmount,
              data.grandTotal,
              data.total,
              getTotal(items),
            ),
          };
        });
        setEstimates(rows);
      },
      (error) => console.error("Error loading estimates:", error),
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!poForm.estimateId || estimates.length === 0) return;

    const matchedEstimate = estimates.find(
      (estimate) => estimate.id === poForm.estimateId,
    );
    if (!matchedEstimate?.estimateNumber) return;

    setPOForm((prev) => {
      const shouldReplaceInternalId =
        !prev.estimateNumber || prev.estimateNumber === prev.estimateId;

      if (!shouldReplaceInternalId) return prev;

      return {
        ...prev,
        estimateNumber: matchedEstimate.estimateNumber || prev.estimateNumber,
      };
    });
  }, [estimates, poForm.estimateId, poForm.estimateNumber]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(poCollectionRef, orderBy("createdAt", "desc")),
      (snapshot) => {
        const rows: PurchaseOrder[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Omit<PurchaseOrder, "id">;
          const items = sanitizeItems(asArray(data.items));
          return {
            id: docSnap.id,
            ...data,
            items,
            totalAmount: safeNumber(data.totalAmount, getTotal(items)),
          };
        });
        setPurchaseOrders(rows);
      },
      (error) => console.error("Error loading purchase orders:", error),
    );

    return () => unsubscribe();
  }, []);

  const filteredEstimates = useMemo(() => estimates, [estimates]);
  const formTotal = useMemo(() => getTotal(poForm.items), [poForm.items]);

  const handlePOChange = (field: keyof POFormState, value: string) => {
    setPOForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEstimateSelect = (estimateId: string) => {
    const selectedEstimate = estimates.find((item) => item.id === estimateId);
    if (!selectedEstimate) return;

    setPOForm((prev) => ({
      ...prev,
      estimateId: selectedEstimate.id,
      estimateNumber: selectedEstimate.estimateNumber || "",
    }));
  };

  const handleLoadEstimate = () => {
    const selectedEstimate =
      estimates.find((item) => item.id === poForm.estimateId) ||
      estimates.find((item) => item.estimateNumber === poForm.estimateNumber);

    if (!selectedEstimate) {
      toast({
        title: "Estimate not found",
        description: "Please select a valid estimate number first.",
        variant: "destructive",
      });
      return;
    }

    setPOForm((prev) => ({
      ...prev,
      estimateId: selectedEstimate.id,
      estimateNumber: selectedEstimate.estimateNumber || prev.estimateNumber,
      items: selectedEstimate.items.length
        ? selectedEstimate.items
        : [newItemRow()],
    }));

    toast({
      title: "Estimate loaded",
      description: "Estimate services and amounts loaded into the PO.",
    });
  };

  const updatePOItem = (
    index: number,
    field: keyof EstimateLineItem,
    value: string,
  ) => {
    setPOForm((prev) => {
      const items = [...prev.items];
      const current = { ...items[index] };
      if (field === "service") current.service = value;
      if (field === "qty") current.qty = value;
      if (field === "rate") current.rate = value;
      const qty = safeNumber(current.qty);
      const rate = safeNumber(current.rate);
      current.amount = qty * rate;
      items[index] = current;
      return { ...prev, items };
    });
  };

  const addPOItem = () =>
    setPOForm((prev) => ({ ...prev, items: [...prev.items, newItemRow()] }));

  const removePOItem = (index: number) => {
    setPOForm((prev) => ({
      ...prev,
      items:
        prev.items.length > 1
          ? prev.items.filter((_, i) => i !== index)
          : [newItemRow()],
    }));
  };

  const getNextPoNumber = (estimateNumber: string) => {
    const cleanEstimateNumber = safeText(estimateNumber).replace(/^EST-?/i, "");
    const matchingPOs = purchaseOrders.filter(
      (po) => po.estimateNumber === estimateNumber,
    );
    const nextIndex = matchingPOs.length + 1;
    return `PO-IE-${cleanEstimateNumber || estimateNumber}-${nextIndex}`;
  };

  const handleCreateOrUpdatePO = async () => {
    const selectedSupplier =
      suppliers.find((item) => item.id === poForm.supplierId) ||
      (poForm.sourceSupplierName &&
      poForm.supplierId === `name:${poForm.sourceSupplierName}`
        ? ({ id: "", name: poForm.sourceSupplierName } as Supplier)
        : undefined);

    if (!poForm.estimateNumber.trim()) {
      toast({
        title: "Estimate required",
        description: "Please select estimate number.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedSupplier) {
      toast({
        title: "Supplier required",
        description: "Please select supplier.",
        variant: "destructive",
      });
      return;
    }

    const cleanItems = sanitizeItems(poForm.items);
    if (cleanItems.length === 0) {
      toast({
        title: "Items required",
        description: "Please add at least one service row.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      poNumber: editingPOId
        ? purchaseOrders.find((item) => item.id === editingPOId)?.poNumber ||
          getNextPoNumber(poForm.estimateNumber)
        : getNextPoNumber(poForm.estimateNumber),

      estimateId: poForm.estimateId || null,
      estimateNumber: poForm.estimateNumber,

      source: poForm.source || "manual",
      sourceInvoiceId: poForm.sourceInvoiceId || null,
      sourceRequestId: poForm.sourceRequestId || null,
      sourceProjectName: poForm.sourceProjectName || null,
      sourceClientName: poForm.sourceClientName || null,

      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.name,
      supplierAddress: [
        selectedSupplier.name,
        selectedSupplier.address,
        [selectedSupplier.city, selectedSupplier.country]
          .filter(Boolean)
          .join(", "),
      ]
        .filter(Boolean)
        .join("\n"),

      issueDate: poForm.issueDate,
      dueDate: toFirestoreDate(poForm.dueDate),
      items: cleanItems,
      totalAmount: getTotal(cleanItems),
      status: poForm.status,
      notes: poForm.notes,
      updatedAt: serverTimestamp(),
    };

    try {
      setSavingPO(true);

      if (editingPOId) {
        if (isPurchaseOrderAdminRole(userProfile?.role)) {
          toast({
            title: "Update not saved",
            description: "Admin users cannot edit Purchase Orders.",
            variant: "destructive",
          });
          return;
        }

        const poRef = doc(db, "Panels", PANEL_ID, "PO", editingPOId);

        // Re-check against the latest saved PO: it may have been approved,
        // paid or deleted since this edit was opened.
        const latestPOSnap = await getDoc(poRef);

        if (!latestPOSnap.exists()) {
          toast({
            title: "Update not saved",
            description: "This Purchase Order no longer exists.",
            variant: "destructive",
          });
          return;
        }

        const lockReason = getPurchaseOrderEditLockReason(latestPOSnap.data());

        if (lockReason) {
          toast({
            title: "Update not saved",
            description: lockReason,
            variant: "destructive",
          });
          return;
        }

        await updateDoc(poRef, payload);
        toast({
          title: "PO updated",
          description: "Purchase order updated successfully.",
        });
      } else {
        const createdPORef = await addDoc(poCollectionRef, {
          ...payload,
          createdAt: serverTimestamp(),
        });

        // Important: mark the linked Budget Request as PO submitted.
        // This makes the Create PO button disappear from Budget Request
        // and enables Submit Expense for Operations.
        if (poForm.source === "budget_request" && poForm.sourceInvoiceId) {
          await updateDoc(
            doc(
              db,
              "Panels",
              PANEL_ID,
              "invoiceRequests",
              poForm.sourceInvoiceId,
            ),
            {
              poCreated: true,
              poSubmitted: true,
              poId: createdPORef.id,
              poNumber: payload.poNumber,
              poSubmittedAt: serverTimestamp(),
              expenseReady: true,
              expenseSource: "po",
              expenseApprovalRequired: false,
              expenseRequiresApproval: false,
              updatedAt: serverTimestamp(),
            },
          );
        }

        toast({
          title: "PO created",
          description: "Purchase order saved successfully.",
        });
      }

      setLocation(PO_LIST_ROUTE);
    } catch (error) {
      console.error("Error saving PO:", error);
      toast({
        title: "Save failed",
        description: "Could not save purchase order.",
        variant: "destructive",
      });
    } finally {
      setSavingPO(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Button
            variant="ghost"
            className="mb-3 -ml-3"
            onClick={() => setLocation(PO_LIST_ROUTE)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to PO List
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            {editingPOId ? "Edit Purchase Order" : "Create Purchase Order"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Create PO on a separate page. This page can be opened directly from
            Budget Request or from the PO list.
          </p>
        </div>

        <Button
          onClick={handleCreateOrUpdatePO}
          disabled={savingPO}
          className="rounded-2xl"
        >
          <Save className="h-4 w-4 mr-2" />
          {savingPO ? "Saving..." : editingPOId ? "Update PO" : "Save PO"}
        </Button>
      </div>

      <Card className="rounded-3xl shadow-sm">
        <CardHeader>
          <CardTitle>PO Information</CardTitle>
          <CardDescription>
            Select estimate, supplier, dates and status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2 lg:col-span-3">
              <Label>Estimate Number</Label>
              <Input
                list="estimate-number-options"
                value={poForm.estimateNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  const matched = filteredEstimates.find(
                    (item) => item.estimateNumber === value,
                  );
                  if (matched) {
                    handleEstimateSelect(matched.id);
                  } else {
                    handlePOChange("estimateNumber", value);
                  }
                }}
                placeholder="Search estimate number"
              />
              <datalist id="estimate-number-options">
                {filteredEstimates.map((estimate) => (
                  <option
                    key={estimate.id}
                    value={estimate.estimateNumber || ""}
                  >
                    {[
                      estimate.estimateNumber,
                      estimate.projectName,
                      estimate.client,
                    ]
                      .filter(Boolean)
                      .join(" - ")}
                  </option>
                ))}
              </datalist>
            </div>

            <div className="space-y-2 flex items-end">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleLoadEstimate}
              >
                Load Estimate
              </Button>
            </div>

            <div className="space-y-2 lg:col-span-2">
              <Label>Supplier</Label>
              <Select
                value={poForm.supplierId}
                onValueChange={(value) => handlePOChange("supplierId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {poForm.sourceSupplierName &&
                    !suppliers.some(
                      (supplier) =>
                        normalizeLookupText(
                          getSupplierDisplayName(supplier),
                        ) === normalizeLookupText(poForm.sourceSupplierName),
                    ) && (
                      <SelectItem value={`name:${poForm.sourceSupplierName}`}>
                        {poForm.sourceSupplierName}
                      </SelectItem>
                    )}

                  {suppliers.map((supplier) => {
                    const supplierName = getSupplierDisplayName(supplier);
                    return (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplierName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={poForm.issueDate}
                onChange={(e) => handlePOChange("issueDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={poForm.dueDate}
                onChange={(e) => handlePOChange("dueDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={poForm.status}
                onValueChange={(value) => handlePOChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle>Services</CardTitle>
              <CardDescription>
                Add services, quantity, rate and amount.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPOItem}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Row
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-2xl border overflow-hidden bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[52%]">Service</TableHead>
                  <TableHead className="w-[12%]">QTY</TableHead>
                  <TableHead className="w-[16%]">Rate</TableHead>
                  <TableHead className="w-[16%]">Amount</TableHead>
                  <TableHead className="w-[4%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {poForm.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Textarea
                        value={item.service}
                        onChange={(e) =>
                          updatePOItem(index, "service", e.target.value)
                        }
                        rows={2}
                        placeholder="Service details"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.qty}
                        onChange={(e) =>
                          updatePOItem(index, "qty", e.target.value)
                        }
                        placeholder="0"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.rate}
                        onChange={(e) =>
                          updatePOItem(index, "rate", e.target.value)
                        }
                        placeholder="0.00"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatNumber(item.amount || 0)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePOItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={poForm.notes}
              onChange={(e) => handlePOChange("notes", e.target.value)}
              rows={3}
              placeholder="Optional notes"
            />
          </div>

          <div className="flex justify-end">
            <div className="w-full max-w-xs rounded-2xl border bg-muted/30 p-4">
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatCurrency(formTotal)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setLocation(PO_LIST_ROUTE)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateOrUpdatePO} disabled={savingPO}>
              {savingPO ? "Saving..." : editingPOId ? "Update PO" : "Save PO"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
 