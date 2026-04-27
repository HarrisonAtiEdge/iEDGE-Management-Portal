import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import {
  addDoc,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

const suppliersCollectionRef = collection(db, "Panels", PANEL_ID, "suppliers");
const poCollectionRef = collection(db, "Panels", PANEL_ID, "PO");
const estimatesCollectionRef = collection(db, "Panels", PANEL_ID, "estimates");

type Supplier = {
  id: string;
  name: string;
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
};

const newItemRow = (): EstimateLineItem => ({
  service: "",
  qty: "",
  rate: "",
  amount: 0,
});

const emptyPOForm: POFormState = {
  estimateId: "",
  estimateNumber: "",
  supplierId: "",
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
  items: [newItemRow()],
  status: "Draft",
  notes: "",
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

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.seconds === "number") return new Date(value.seconds * 1000);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateDisplay(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB");
}

function getStatusBadgeVariant(status: PurchaseOrderStatus) {
  if (status === "Paid") return "default" as const;
  if (status === "Cancelled" || status === "Over Due") return "destructive" as const;
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
      const qty = safeNumber(item?.qty, item?.quantity, item?.units, item?.unit, item?.count);
      const rate = safeNumber(item?.rate, item?.unitRate, item?.price, item?.cost);
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
    .filter((item: EstimateLineItem) => item.service || item.qty || item.rate || item.amount);

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
      rate: String(safeNumber(raw?.amount, raw?.grandTotal, raw?.totalAmount, raw?.total)),
      amount: safeNumber(raw?.amount, raw?.grandTotal, raw?.totalAmount, raw?.total),
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
  return sanitizeItems(items).reduce((sum, item) => sum + safeNumber(item.amount), 0);
}

function openPdfInCenteredPopup(blob: Blob, title: string) {
  const blobUrl = URL.createObjectURL(blob);
  const width = 980;
  const height = 760;
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
    <html>
      <head>
        <title>${title}</title>
        <style>
          html, body { margin: 0; height: 100%; background: #f3f4f6; font-family: Arial, sans-serif; }
          .toolbar { display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:#111827; color:#fff; }
          .toolbar button { border:0; background:#4b5563; color:#fff; padding:8px 14px; border-radius:6px; cursor:pointer; }
          iframe { width:100%; height:calc(100% - 56px); border:0; background:#fff; }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <div>${title}</div>
          <div>
            <button onclick="window.print()">Print</button>
          </div>
        </div>
        <iframe src="${blobUrl}"></iframe>
      </body>
    </html>
  `);
  popup.document.close();
}

function buildPurchaseOrderPdf(po: PurchaseOrder) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const left = 45;
  const right = pageWidth - 45;
  const grayBlue = [132, 140, 152] as const;
  const lightBand = [220, 226, 232] as const;
  const darkText = [28, 28, 28] as const;

  const items = sanitizeItems(po.items);
  const total = getTotal(items);

  pdf.setFillColor(245, 246, 248);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");

  pdf.setTextColor(...grayBlue);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(26);
  pdf.text("Purchase Order", left, 90);

  pdf.setFontSize(11);
  pdf.text("SUPPLIER", left, 122);
  pdf.text("P.O.", pageWidth - 265, 122);
  pdf.text("DATE", pageWidth - 265, 142);

  pdf.setTextColor(...darkText);
  pdf.setFontSize(13);

  const supplierLines = (po.supplierAddress || po.supplierName)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  let supplierY = 138;
  supplierLines.forEach((line) => {
    pdf.text(line, left, supplierY);
    supplierY += 18;
  });

  pdf.text(po.poNumber, pageWidth - 165, 122);
  pdf.text(formatDateDisplay(po.issueDate), pageWidth - 165, 142);

  const tableTop = Math.max(supplierY + 18, 230);
  pdf.setFillColor(...lightBand);
  pdf.rect(left, tableTop, right - left, 26, "F");

  pdf.setTextColor(...grayBlue);
  pdf.setFontSize(10.5);
  pdf.text("QTY", right - 288, tableTop + 17);
  pdf.text("RATE", right - 187, tableTop + 17);
  pdf.text("AMOUNT", right - 86, tableTop + 17);

  pdf.setTextColor(...darkText);
  pdf.setFontSize(13);

  let rowY = tableTop + 48;
  items.forEach((item, index) => {
    const serviceLines = pdf.splitTextToSize(item.service || "-", right - left - 310);
    pdf.text(serviceLines, left + 6, rowY);

    const itemHeight = Math.max(serviceLines.length * 18, 18);
    pdf.text(item.qty || "-", right - 270, rowY);
    pdf.text(formatNumber(safeNumber(item.rate)), right - 170, rowY);
    pdf.text(formatNumber(safeNumber(item.amount)), right - 70, rowY, { align: "right" });
    rowY += itemHeight + (index === items.length - 1 ? 12 : 18);
  });

  pdf.setDrawColor(174, 180, 186);
  pdf.setLineDashPattern([3, 2], 0);
  pdf.line(left, rowY, right, rowY);
  pdf.setLineDashPattern([], 0);

  pdf.setTextColor(...grayBlue);
  pdf.setFontSize(12);
  pdf.text("TOTAL", right - 465, rowY + 28);

  pdf.setTextColor(...darkText);
  pdf.setFontSize(14);
  pdf.text(`PKR ${formatNumber(total)}`, right - 2, rowY + 28, { align: "right" });

  const signY = rowY + 100;
  pdf.setTextColor(...grayBlue);
  pdf.setFontSize(11);
  pdf.text("Approved By", left, signY);
  pdf.text("Date", left, signY + 38);

  pdf.setDrawColor(130, 136, 142);
  pdf.line(left + 135, signY + 6, right - 12, signY + 6);
  pdf.line(left + 135, signY + 44, right - 12, signY + 44);

  pdf.setFontSize(10);
  pdf.text(`Page 1 of 1`, pageWidth / 2, pageHeight - 24, { align: "center" });

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
          <p className="font-medium whitespace-pre-line">{po.supplierAddress || po.supplierName}</p>
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
                <TableCell className="whitespace-pre-line">{item.service || "-"}</TableCell>
                <TableCell className="text-right">{item.qty || "-"}</TableCell>
                <TableCell className="text-right">{formatNumber(safeNumber(item.rate))}</TableCell>
                <TableCell className="text-right">{formatNumber(safeNumber(item.amount))}</TableCell>
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

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [estimates, setEstimates] = useState<EstimateLite[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [poForm, setPOForm] = useState<POFormState>(emptyPOForm);
  const [editingPOId, setEditingPOId] = useState<string | null>(null);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);
  const [savingPO, setSavingPO] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(suppliersCollectionRef, orderBy("createdAt", "desc")),
      (snapshot) => {
        setSuppliers(
          snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<Supplier, "id">),
          })),
        );
      },
      (error) => console.error("Error loading suppliers:", error),
    );

    return () => unsubscribe();
  }, []);


  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(estimatesCollectionRef, orderBy("createdAt", "desc")),
      (snapshot) => {
        const rows: EstimateLite[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const items = normalizeEstimateItems(data);
          return {
            id: docSnap.id,
            estimateNumber: safeText(data.estimateNumber, data.invoiceNo, data.number),
            projectName: safeText(data.projectName),
            client: safeText(data.client),
            items,
            totalAmount: safeNumber(data.totalAmount, data.grandTotal, data.total, getTotal(items)),
          };
        });
        setEstimates(rows);
      },
      (error) => console.error("Error loading estimates:", error),
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(poCollectionRef, orderBy("createdAt", "desc")),
      (snapshot) => {
        const rows: PurchaseOrder[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Omit<PurchaseOrder, "id">;
          const items = sanitizeItems(asArray(data.items));
          const totalAmount = safeNumber(data.totalAmount, getTotal(items));
          const status = isOverDue({ dueDate: data.dueDate, status: data.status })
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
      (error) => console.error("Error loading purchase orders:", error),
    );

    return () => unsubscribe();
  }, []);

  const filteredEstimates = useMemo(() => estimates, [estimates]);

  const totals = useMemo(() => {
    const totalPayable = purchaseOrders.reduce((sum, item) => sum + safeNumber(item.totalAmount), 0);
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
    const grouped = new Map<string, { date: string; totalPayable: number; overDue: number; open: number; paid: number }>();

    purchaseOrders.forEach((item) => {
      const rawDate = item.issueDate || "No Date";
      const label = rawDate === "No Date"
        ? rawDate
        : new Date(rawDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

      const existing = grouped.get(label) || {
        date: label,
        totalPayable: 0,
        overDue: 0,
        open: 0,
        paid: 0,
      };

      existing.totalPayable += safeNumber(item.totalAmount);
      if (item.status === "Over Due") existing.overDue += safeNumber(item.totalAmount);
      if (item.status === "Open" || item.status === "Draft") existing.open += safeNumber(item.totalAmount);
      if (item.status === "Paid") existing.paid += safeNumber(item.totalAmount);
      grouped.set(label, existing);
    });

    return Array.from(grouped.values()).slice(-8);
  }, [purchaseOrders]);

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
    const selectedEstimate = estimates.find((item) => item.id === poForm.estimateId) || estimates.find((item) => item.estimateNumber === poForm.estimateNumber);
    if (!selectedEstimate) {
      toast({ title: "Estimate not found", description: "Please select a valid estimate number first.", variant: "destructive" });
      return;
    }

    setPOForm((prev) => ({
      ...prev,
      estimateId: selectedEstimate.id,
      estimateNumber: selectedEstimate.estimateNumber || prev.estimateNumber,
      items: selectedEstimate.items.length ? selectedEstimate.items : [newItemRow()],
    }));

    toast({ title: "Estimate loaded", description: "Estimate services and amounts loaded into the PO." });
  };

  const updatePOItem = (index: number, field: keyof EstimateLineItem, value: string) => {
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

  const addPOItem = () => setPOForm((prev) => ({ ...prev, items: [...prev.items, newItemRow()] }));

  const removePOItem = (index: number) => {
    setPOForm((prev) => ({
      ...prev,
      items: prev.items.length > 1 ? prev.items.filter((_, i) => i !== index) : [newItemRow()],
    }));
  };

  const getNextPoNumber = (estimateNumber: string) => {
    const cleanEstimateNumber = safeText(estimateNumber).replace(/^EST-?/i, "");
    const matchingPOs = purchaseOrders.filter((po) => po.estimateNumber === estimateNumber);
    const nextIndex = matchingPOs.length + 1;
    return `PO-IE-${cleanEstimateNumber || estimateNumber}-${nextIndex}`;
  };

  const resetPOForm = () => {
    setPOForm(emptyPOForm);
    setEditingPOId(null);
  };

  const handleCreateOrUpdatePO = async () => {
    const selectedSupplier = suppliers.find((item) => item.id === poForm.supplierId);
    if (!poForm.estimateNumber.trim()) {
      toast({ title: "Estimate required", description: "Please select estimate number.", variant: "destructive" });
      return;
    }
    if (!selectedSupplier) {
      toast({ title: "Supplier required", description: "Please select supplier.", variant: "destructive" });
      return;
    }

    const cleanItems = sanitizeItems(poForm.items);
    if (cleanItems.length === 0) {
      toast({ title: "Items required", description: "Please add at least one service row.", variant: "destructive" });
      return;
    }

    const payload = {
      poNumber: editingPOId
        ? purchaseOrders.find((item) => item.id === editingPOId)?.poNumber || getNextPoNumber(poForm.estimateNumber)
        : getNextPoNumber(poForm.estimateNumber),
      estimateId: poForm.estimateId || null,
      estimateNumber: poForm.estimateNumber,
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.name,
      supplierAddress: [selectedSupplier.name, selectedSupplier.address, [selectedSupplier.city, selectedSupplier.country].filter(Boolean).join(", ")]
        .filter(Boolean)
        .join("\n"),
      issueDate: poForm.issueDate,
      dueDate: poForm.dueDate,
      items: cleanItems,
      totalAmount: getTotal(cleanItems),
      status: poForm.status,
      notes: poForm.notes,
      updatedAt: serverTimestamp(),
    };

    try {
      setSavingPO(true);
      if (editingPOId) {
        await updateDoc(doc(db, "Panels", PANEL_ID, "PO", editingPOId), payload);
        toast({ title: "PO updated", description: "Purchase order updated successfully." });
      } else {
        await addDoc(poCollectionRef, {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast({ title: "PO created", description: "Purchase order saved successfully." });
      }
      setPoDialogOpen(false);
      resetPOForm();
    } catch (error) {
      console.error("Error saving PO:", error);
      toast({ title: "Save failed", description: "Could not save purchase order.", variant: "destructive" });
    } finally {
      setSavingPO(false);
    }
  };

  const handleEditPO = (po: PurchaseOrder) => {
    setEditingPOId(po.id);
    setPOForm({
      estimateId: po.estimateId || "",
      estimateNumber: po.estimateNumber || "",
      supplierId: po.supplierId || "",
      issueDate: po.issueDate || new Date().toISOString().slice(0, 10),
      dueDate: po.dueDate || "",
      items: po.items.length ? po.items : [newItemRow()],
      status: po.status === "Over Due" ? "Open" : po.status,
      notes: po.notes || "",
    });
    setPoDialogOpen(true);
  };

  const handleDuplicatePO = (po: PurchaseOrder) => {
    setEditingPOId(null);
    setPOForm({
      estimateId: po.estimateId || "",
      estimateNumber: po.estimateNumber || "",
      supplierId: po.supplierId || "",
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: po.dueDate || "",
      items: po.items.length ? po.items : [newItemRow()],
      status: "Draft",
      notes: po.notes || "",
    });
    setPoDialogOpen(true);
  };

  const handleViewPO = (po: PurchaseOrder) => {
    setViewingPO(po);
    setViewDialogOpen(true);
  };

  const handleDeletePO = async (poId: string) => {
    try {
      await deleteDoc(doc(db, "Panels", PANEL_ID, "PO", poId));
      toast({ title: "PO deleted", description: "Purchase order removed successfully." });
    } catch (error) {
      console.error("Error deleting PO:", error);
      toast({ title: "Delete failed", description: "Could not delete purchase order.", variant: "destructive" });
    }
  };

  const handleStatusChange = async (poId: string, status: PurchaseOrderStatus) => {
    try {
      await updateDoc(doc(db, "Panels", PANEL_ID, "PO", poId), {
        status,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Status updated", description: "Purchase order status updated." });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({ title: "Update failed", description: "Could not update status.", variant: "destructive" });
    }
  };

  const handleGeneratePOPdf = (po: PurchaseOrder) => {
    try {
      const pdf = buildPurchaseOrderPdf(po);
      const blob = pdf.output("blob");
      openPdfInCenteredPopup(blob, po.poNumber || "Purchase Order");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({ title: "PDF failed", description: "Could not generate purchase order PDF.", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground">
            PO management only. Includes summary graph, PO creation, PDF preview and PO list.
          </p>
        </div>

        <Dialog
          open={poDialogOpen}
          onOpenChange={(open) => {
            setPoDialogOpen(open);
            if (!open) resetPOForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="rounded-2xl">
              <Plus className="h-4 w-4 mr-2" />
              Create PO
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl w-[94vw] rounded-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPOId ? "Edit Purchase Order" : "Create Purchase Order"}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2 lg:col-span-3">
                <Label>Estimate Number</Label>
                <Input
                  list="estimate-number-options"
                  value={poForm.estimateNumber}
                  onChange={(e) => {
                    const value = e.target.value;
                    const matched = filteredEstimates.find((item) => item.estimateNumber === value);
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
                    <option key={estimate.id} value={estimate.estimateNumber || ""}>
                      {[estimate.estimateNumber, estimate.projectName, estimate.client].filter(Boolean).join(" - ")}
                    </option>
                  ))}
                </datalist>
              </div>

              <div className="space-y-2 flex items-end">
                <Button type="button" variant="outline" className="w-full" onClick={handleLoadEstimate}>
                  Load Estimate
                </Button>
              </div>

              <div className="space-y-2 lg:col-span-2">
                <Label>Supplier</Label>
                <Select value={poForm.supplierId} onValueChange={(value) => handlePOChange("supplierId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={poForm.issueDate} onChange={(e) => handlePOChange("issueDate", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={poForm.dueDate} onChange={(e) => handlePOChange("dueDate", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={poForm.status} onValueChange={(value) => handlePOChange("status", value)}>
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

            <div className="space-y-3 pt-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Services</Label>
                <Button type="button" variant="outline" size="sm" onClick={addPOItem}>
                  <Plus className="h-4 w-4 mr-1" /> Add Row
                </Button>
              </div>

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
                            onChange={(e) => updatePOItem(index, "service", e.target.value)}
                            rows={2}
                            placeholder="Service details"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.qty}
                            onChange={(e) => updatePOItem(index, "qty", e.target.value)}
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.rate}
                            onChange={(e) => updatePOItem(index, "rate", e.target.value)}
                            placeholder="0.00"
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatNumber(item.amount || 0)}</TableCell>
                        <TableCell>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removePOItem(index)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
              <Button variant="outline" onClick={() => { setPoDialogOpen(false); resetPOForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrUpdatePO} disabled={savingPO}>
                {savingPO ? "Saving..." : editingPOId ? "Update PO" : "Save PO"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-5 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="rounded-3xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Payable</p>
                    <p className="text-xl font-bold mt-1">{formatCurrency(totals.totalPayable)}</p>
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
                    <p className="text-xl font-bold mt-1">{formatCurrency(totals.overDue)}</p>
                  </div>
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Open / Draft</p>
                    <p className="text-xl font-bold mt-1">{formatCurrency(totals.open)}</p>
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
                    <p className="text-xl font-bold mt-1">{formatCurrency(totals.paid)}</p>
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
              <CardDescription>Date-wise view of total payable, overdue, open and paid values.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="totalPayable" name="Total Payable" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="overDue" name="Over Due" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="open" name="Open / Draft" radius={[8, 8, 0, 0]} />
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
            <Receipt className="h-5 w-5" /> Purchase Order List
          </CardTitle>
          <CardDescription>All created purchase orders with status and actions.</CardDescription>
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
                      <TableCell className="font-medium">{po.poNumber}</TableCell>
                      <TableCell>{po.estimateNumber || "-"}</TableCell>
                      <TableCell>{po.supplierName || "-"}</TableCell>
                      <TableCell>{formatDateDisplay(po.issueDate) || "-"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(po.totalAmount || 0)}</TableCell>
                      <TableCell>
                        <Select value={po.status === "Over Due" ? "Over Due" : po.status} onValueChange={(value) => handleStatusChange(po.id, value as PurchaseOrderStatus)}>
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Draft">Draft</SelectItem>
                            <SelectItem value="Open">Open</SelectItem>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                            {po.status === "Over Due" && <SelectItem value="Over Due">Over Due</SelectItem>}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditPO(po)}>
                            <Pencil className="h-4 w-4 mr-1" /> Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleViewPO(po)}>
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDuplicatePO(po)}>
                            <Copy className="h-4 w-4 mr-1" /> Duplicate
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleGeneratePOPdf(po)}>
                            <FileText className="h-4 w-4 mr-1" /> Create PO
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeletePO(po.id)} className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4 mr-1" /> Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
