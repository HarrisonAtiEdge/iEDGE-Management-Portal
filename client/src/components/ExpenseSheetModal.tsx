import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { ExpenseSheet } from "@shared/schema";

interface ExpenseSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingExpense?: ExpenseSheet | null;
  initialRequest?: any | null;
}

type ExpenseItem = {
  id: number;
  date: string;
  service: string;
  vendor: string;
  description: string;
  comment: string;
  quantity: string;
  unitPrice: string;
  amount: number;
  linkedLineItemId?: string | number;
  originalStatus?: string;
};

const PANEL_ID = "IEDGE-SYSTEM";

const emptyExpenseItem = (): ExpenseItem => ({
  id: 1,
  date: "",
  service: "",
  vendor: "",
  description: "",
  comment: "",
  quantity: "",
  unitPrice: "",
  amount: 0,
});

function formatPKR(value: number | string | undefined | null) {
  const num =
    typeof value === "number"
      ? value
      : parseFloat(String(value ?? "0").replace(/,/g, "")) || 0;

  return num.toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseMoney(value: any) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const parsed =
    parseFloat(
      String(value ?? "0")
        .replace(/,/g, "")
        .replace(/[^\d.-]/g, ""),
    ) || 0;

  return Number.isFinite(parsed) ? parsed : 0;
}

function getReadableStatus(status?: string) {
  if (!status) return "Pending";

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getReadableType(type?: string) {
  if (type === "general") return "General Request";
  if (type === "project") return "Project Request";
  return "Request";
}

function getStatusBadgeClass(status?: string) {
  switch (status) {
    case "approved":
    case "payment_released":
    case "submitted":
      return "border-green-200 bg-green-50 text-green-700";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function getItemAmount(item: any) {
  const qty = parseMoney(item?.units ?? item?.quantity ?? 0);
  const rate = parseMoney(item?.unitRate ?? item?.unitPrice ?? 0);

  const amount =
    item?.approvedAmount ??
    item?.approvedTotal ??
    item?.approvedValue ??
    item?.total ??
    item?.amount ??
    qty * rate;

  return parseMoney(amount);
}

function normalizeRequest(request: any) {
  if (!request) return null;

  const lineItems = Array.isArray(request.lineItems)
    ? request.lineItems
    : Array.isArray(request.items)
      ? request.items
      : [];

  const invoiceType = request.invoiceType || request.requestType || "project";

  return {
    ...request,

    id: request.id || "",
    requestId: request.requestId || request.id || "",

    invoiceType,

    estimateId: request.estimateId || "",
    estimateNumber: request.estimateNumber || "",

    clientName: request.clientName || "",
    project: request.project || request.projectName || "",
    projectName: request.projectName || request.project || "",
    projectCode: request.projectCode || "",

    title: request.title || "",
    subject: request.subject || request.title || "",
    message: request.message || "",

    status: request.status || "",
    lineItems,
    paymentDetails: request.paymentDetails || null,
    totalAmount: parseMoney(request.totalAmount),
  };
}

function buildExpenseItemsFromRequest(request: any): ExpenseItem[] {
  const normalized = normalizeRequest(request);
  const items = normalized?.lineItems || [];

  const approvedItems = items.filter((item: any) => item.status === "approved");
  const sourceItems = approvedItems.length > 0 ? approvedItems : items;

  if (sourceItems.length === 0) return [emptyExpenseItem()];

  return sourceItems.map((item: any, index: number) => {
    const itemAmount = getItemAmount(item);

    const quantityValue = parseMoney(item.units ?? item.quantity ?? 1) || 1;

    const unitPriceValue =
      parseMoney(item.unitRate ?? item.unitPrice) ||
      (quantityValue > 0 ? itemAmount / quantityValue : itemAmount);

    const amount =
      itemAmount || quantityValue * unitPriceValue || parseMoney(item.total);

    return {
      id: index + 1,
      date: item.date || "",
      service: item.service || "",
      vendor: item.vendor || item.vendorName || "",
      description:
        item.description ||
        item.service ||
        item.itemDescription ||
        normalized?.subject ||
        normalized?.title ||
        "",
      comment: item.comment || "",
      quantity: String(quantityValue),
      unitPrice: String(unitPriceValue),
      amount,
      linkedLineItemId: item.id || index,
      originalStatus: item.status || "pending",
    };
  });
}

export default function ExpenseSheetModal({
  isOpen,
  onClose,
  onSuccess,
  editingExpense = null,
  initialRequest = null,
}: ExpenseSheetModalProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [approvedRequests, setApprovedRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([
    emptyExpenseItem(),
  ]);

  const [formData, setFormData] = useState({
    linkedRequestId: "",
    linkedRequestDocId: "",
    invoiceType: "",
    estimateNumber: "",
    clientName: "",
    project: "",
    projectCode: "",
    title: "",
    subject: "",
    message: "",
    comment: "",
  });

  function resetForm() {
    setFormData({
      linkedRequestId: "",
      linkedRequestDocId: "",
      invoiceType: "",
      estimateNumber: "",
      clientName: "",
      project: "",
      projectCode: "",
      title: "",
      subject: "",
      message: "",
      comment: "",
    });

    setExpenseItems([emptyExpenseItem()]);
    setSelectedRequest(null);
  }

  function applyRequestToExpenseSheet(request: any, keepComment = true) {
    const normalized = normalizeRequest(request);
    if (!normalized) return;

    setSelectedRequest(normalized);

    setFormData((prev) => ({
      ...prev,
      linkedRequestId: normalized.requestId || "",
      linkedRequestDocId: normalized.id || "",
      invoiceType: normalized.invoiceType || "",
      estimateNumber: normalized.estimateNumber || "",
      clientName: normalized.clientName || "",
      project: normalized.project || "",
      projectCode: normalized.projectCode || "",
      title: normalized.title || "",
      subject: normalized.subject || "",
      message: normalized.message || "",
      comment: keepComment ? prev.comment : "",
    }));

    setExpenseItems(buildExpenseItemsFromRequest(normalized));
  }

  async function loadApprovedRequests() {
    try {
      const [approvedSnapshot, paymentReleasedSnapshot] = await Promise.all([
        getDocs(
          query(
            collection(db, "Panels", PANEL_ID, "invoiceRequests"),
            where("status", "==", "approved"),
          ),
        ),
        getDocs(
          query(
            collection(db, "Panels", PANEL_ID, "invoiceRequests"),
            where("status", "==", "payment_released"),
          ),
        ),
      ]);

      const allDocs = [
        ...approvedSnapshot.docs,
        ...paymentReleasedSnapshot.docs,
      ];

      const requests = allDocs
        .map((requestDoc) =>
          normalizeRequest({
            id: requestDoc.id,
            ...requestDoc.data(),
          }),
        )
        .filter(Boolean);

      const normalizedInitialRequest = normalizeRequest(initialRequest);

      const mergedRequests = normalizedInitialRequest
        ? [
            normalizedInitialRequest,
            ...requests.filter(
              (request) =>
                request?.id !== normalizedInitialRequest.id &&
                request?.requestId !== normalizedInitialRequest.requestId,
            ),
          ]
        : requests;

      setApprovedRequests(mergedRequests.filter(Boolean));
    } catch (error) {
      console.error("Failed to load approved requests:", error);

      toast({
        title: "Warning",
        description: "Approved requests could not be loaded.",
        variant: "destructive",
      });
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    setFiles(null);
    loadApprovedRequests();

    if (editingExpense) {
      const expense: any = editingExpense;

      setFormData({
        linkedRequestId: expense.linkedRequestId || "",
        linkedRequestDocId: expense.linkedRequestDocId || "",
        invoiceType: expense.invoiceType || "",
        estimateNumber: expense.estimateNumber || "",
        clientName: expense.clientName || "",
        project: expense.project || "",
        projectCode: expense.projectCode || "",
        title: expense.title || "",
        subject: expense.subject || "",
        message: expense.message || "",
        comment: expense.comment || "",
      });

      setExpenseItems(expense.expenseItems || [emptyExpenseItem()]);
      setSelectedRequest(null);
      return;
    }

    if (initialRequest) {
      applyRequestToExpenseSheet(initialRequest, false);
      return;
    }

    resetForm();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingExpense, initialRequest?.id, initialRequest?.requestId]);

  function handleRequestChange(value: string) {
    const request = approvedRequests.find(
      (item) => item.requestId === value || item.id === value,
    );

    if (!request) {
      setFormData((prev) => ({ ...prev, linkedRequestId: value }));
      setSelectedRequest(null);
      return;
    }

    applyRequestToExpenseSheet(request);
  }

  function updateExpenseItem(
    id: number,
    field: keyof ExpenseItem,
    value: string,
  ) {
    setExpenseItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        if (field === "quantity" || field === "unitPrice") {
          const qty =
            field === "quantity"
              ? parseMoney(value)
              : parseMoney(updated.quantity);

          const price =
            field === "unitPrice"
              ? parseMoney(value)
              : parseMoney(updated.unitPrice);

          updated.amount = qty * price;
        }

        return updated;
      }),
    );
  }

  function addExpenseItem() {
    const newId =
      Math.max(...expenseItems.map((item) => Number(item.id) || 0), 0) + 1;

    setExpenseItems((prev) => [
      ...prev,
      {
        ...emptyExpenseItem(),
        id: newId,
      },
    ]);
  }

  function removeExpenseItem(id: number) {
    if (expenseItems.length > 1) {
      setExpenseItems((prev) => prev.filter((item) => item.id !== id));
    }
  }

  const totalAmount = expenseItems.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );

  const approvedRequestAmount = selectedRequest
    ? buildExpenseItemsFromRequest(selectedRequest).reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0,
      )
    : totalAmount;

  const paymentDetails = selectedRequest?.paymentDetails;

  const paymentVendor = Array.isArray(paymentDetails?.vendors)
    ? paymentDetails.vendors.join(", ")
    : paymentDetails?.vendor || "-";

  const isProjectRequest = formData.invoiceType === "project";
  const isGeneralRequest = formData.invoiceType === "general";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!userProfile) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    if (!formData.linkedRequestId) {
      toast({
        title: "Request required",
        description: "Please link this expense sheet with an approved request.",
        variant: "destructive",
      });
      return;
    }

    if (expenseItems.some((item) => !item.vendor || !item.description)) {
      toast({
        title: "Error",
        description: "Please fill vendor and description in all expense items.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const documentUrls: string[] = [];

      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileRef = ref(storage, `expenses/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(fileRef, file);
          const downloadUrl = await getDownloadURL(snapshot.ref);
          documentUrls.push(downloadUrl);
        }
      }

      const expensePayload = {
        linkedRequestId: formData.linkedRequestId,
        linkedRequestDocId:
          formData.linkedRequestDocId || selectedRequest?.id || "",

        invoiceType: formData.invoiceType,
        requestType: formData.invoiceType,

        estimateNumber: formData.estimateNumber,
        clientName: formData.clientName,
        project: formData.project,
        projectCode: formData.projectCode,

        title: formData.title,
        subject: formData.subject,
        message: formData.message,

        requestStatus: selectedRequest?.status || "",
        requestTotalAmount: selectedRequest?.totalAmount || 0,
        requestApprovedAmount: approvedRequestAmount || totalAmount,

        paymentDetails: selectedRequest?.paymentDetails || null,

        comment: formData.comment,
        expenseItems,
        totalAmount,
      };

      if (editingExpense) {
        const expense: any = editingExpense;

        const existingDocuments = expense.expenseDocuments || [];
        const allDocuments = [...existingDocuments, ...documentUrls];

        await updateDoc(
          doc(db, "Panels", PANEL_ID, "expenseSheets", expense.id),
          {
            ...expensePayload,
            expenseDocuments: allDocuments,

            // No further approval required after expense submission.
            status: "submitted",

            updatedAt: serverTimestamp(),
          },
        );
      } else {
        await addDoc(collection(db, "Panels", PANEL_ID, "expenseSheets"), {
          ...expensePayload,
          expenseDocuments: documentUrls,

          // No further approval required after expense submission.
          status: "submitted",

          submittedBy: userProfile.id,
          submittedByName: userProfile.displayName || userProfile.email || "",
          submittedAt: serverTimestamp(),
          approvalHistory: [],
        });
      }

      toast({
        title: "Success",
        description: editingExpense
          ? "Expense sheet updated successfully"
          : "Expense sheet submitted successfully",
      });

      if (!editingExpense) resetForm();

      setFiles(null);
      onSuccess();
    } catch (error: any) {
      console.error("Failed to submit expense sheet:", error);

      toast({
        title: "Error",
        description: error.message || "Failed to submit expense sheet",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[92vh] max-w-[96vw] overflow-y-auto border-0 bg-slate-50 p-0 shadow-2xl md:max-w-6xl">
        <div className="sticky top-0 z-10 border-b bg-white/95 px-6 py-5 backdrop-blur">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-950">
              <i
                className={`fas fa-receipt ${
                  editingExpense ? "text-orange-600" : "text-green-600"
                }`}
              ></i>
              <span>
                {editingExpense ? "Edit Expense Sheet" : "New Expense Sheet"}
              </span>
            </DialogTitle>

            <DialogDescription className="text-sm text-slate-500">
              {editingExpense
                ? "Update and resubmit your expense sheet with changes."
                : "Submit an expense sheet linked with an approved General or Project request."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-950">
                  Linked Budget Request
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Selecting a request automatically fetches request ID, request
                  type, title, subject, message, client/project details,
                  approved items, and payment details.
                </p>
              </div>

              {selectedRequest?.status && (
                <Badge
                  className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                    selectedRequest.status,
                  )}`}
                >
                  {getReadableStatus(selectedRequest.status)}
                </Badge>
              )}
            </div>

            <Label htmlFor="linkedRequest">Link to Request Form *</Label>

            <Select
              value={formData.linkedRequestId}
              onValueChange={handleRequestChange}
            >
              <SelectTrigger
                className="mt-2 rounded-xl border-slate-200 bg-slate-50"
                data-testid="select-linked-request"
              >
                <SelectValue placeholder="Select approved budget request" />
              </SelectTrigger>

              <SelectContent>
                {approvedRequests.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No approved request forms available
                  </SelectItem>
                ) : (
                  approvedRequests.map((request) => (
                    <SelectItem
                      key={request.id || request.requestId}
                      value={request.requestId || request.id}
                    >
                      {request.requestId || request.id} -{" "}
                      {getReadableType(request.invoiceType)} -{" "}
                      {request.title ||
                        request.subject ||
                        request.project ||
                        "No title"}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Request ID
              </p>
              <p className="mt-2 break-words text-lg font-bold text-slate-950">
                {formData.linkedRequestId || "-"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Request Type
              </p>
              <p className="mt-2 text-lg font-bold text-slate-950">
                {getReadableType(formData.invoiceType)}
              </p>
            </div>

            <div className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-green-600">
                Approved Amount
              </p>
              <p className="mt-2 text-lg font-bold text-green-700">
                Rs {formatPKR(approvedRequestAmount || totalAmount)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Expense Total
              </p>
              <p className="mt-2 text-lg font-bold text-slate-950">
                Rs {formatPKR(totalAmount)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Payment Vendor
              </p>
              <p className="mt-2 break-words text-sm font-semibold text-slate-950">
                {paymentVendor}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-slate-950">
              Request Details
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Title from request"
                  className="mt-2 rounded-xl bg-slate-50"
                  data-testid="input-title"
                />
              </div>

              <div>
                <Label htmlFor="subject">Subject / Purpose</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  placeholder="Subject or purpose from request"
                  className="mt-2 rounded-xl bg-slate-50"
                  data-testid="input-subject"
                />
              </div>

              <div>
                <Label htmlFor="estimateNumber">Estimate No</Label>
                <Input
                  id="estimateNumber"
                  value={formData.estimateNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimateNumber: e.target.value,
                    })
                  }
                  placeholder={
                    isProjectRequest
                      ? "Estimate number from project request"
                      : "Not required for general request"
                  }
                  className="mt-2 rounded-xl bg-slate-50"
                  data-testid="input-estimate-number"
                />
              </div>

              <div>
                <Label htmlFor="clientName">
                  Client Name {isProjectRequest ? "*" : ""}
                </Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) =>
                    setFormData({ ...formData, clientName: e.target.value })
                  }
                  placeholder={
                    isGeneralRequest
                      ? "Not required for general request"
                      : "Client will be fetched automatically"
                  }
                  required={isProjectRequest}
                  className="mt-2 rounded-xl bg-slate-50"
                  data-testid="input-client-name"
                />
              </div>

              <div>
                <Label htmlFor="project">
                  Project {isProjectRequest ? "*" : ""}
                </Label>
                <Input
                  id="project"
                  value={formData.project}
                  onChange={(e) =>
                    setFormData({ ...formData, project: e.target.value })
                  }
                  placeholder={
                    isGeneralRequest
                      ? "Not required for general request"
                      : "Project will be fetched automatically"
                  }
                  required={isProjectRequest}
                  className="mt-2 rounded-xl bg-slate-50"
                  data-testid="input-project"
                />
              </div>

              <div>
                <Label htmlFor="projectCode">Project Code</Label>
                <Input
                  id="projectCode"
                  value={formData.projectCode}
                  onChange={(e) =>
                    setFormData({ ...formData, projectCode: e.target.value })
                  }
                  placeholder={
                    isGeneralRequest
                      ? "Not required for general request"
                      : "Project code"
                  }
                  className="mt-2 rounded-xl bg-slate-50"
                  data-testid="input-project-code"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <Label htmlFor="message">Request Message / Notes</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="Message or notes from the budget request"
                  className="mt-2 min-h-[90px] rounded-xl bg-slate-50"
                  data-testid="textarea-message"
                />
              </div>
            </div>
          </div>

          {paymentDetails && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-950">
                Payment Release Details
              </h3>

              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Payment Method
                  </span>
                  <p className="mt-1 font-semibold text-slate-950">
                    {paymentDetails.paymentMethod || "-"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Released Amount
                  </span>
                  <p className="mt-1 font-semibold text-slate-950">
                    Rs {formatPKR(paymentDetails.amount)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Vendor
                  </span>
                  <p className="mt-1 font-semibold text-slate-950">
                    {paymentVendor}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Transaction Ref
                  </span>
                  <p className="mt-1 font-semibold text-slate-950">
                    {paymentDetails.transactionReference ||
                      paymentDetails.chequeNumber ||
                      "-"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Label
              htmlFor="comment"
              className="text-base font-semibold text-slate-950"
            >
              Expense Comment
            </Label>

            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) =>
                setFormData({ ...formData, comment: e.target.value })
              }
              placeholder="Add any additional comments or notes"
              className="mt-3 min-h-[90px] rounded-xl bg-slate-50"
              data-testid="textarea-comment"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-950">
                  Expense Items
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  General request items fetch date, service, vendor,
                  description, and comment. Project request items fetch vendor,
                  description, quantity, unit price, approved amount, and
                  comments.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit rounded-full"
                onClick={addExpenseItem}
                data-testid="button-add-expense-item"
              >
                Add New
              </Button>
            </div>

            <div className="space-y-4">
              {expenseItems.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="font-semibold text-slate-950">
                      Expense {index + 1}
                    </h4>

                    {expenseItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExpenseItem(item.id)}
                        className="rounded-full text-red-600 hover:bg-red-50 hover:text-red-700"
                        data-testid={`button-remove-expense-${item.id}`}
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <Label htmlFor={`date-${item.id}`}>Date</Label>
                      <Input
                        id={`date-${item.id}`}
                        type="date"
                        value={item.date}
                        onChange={(e) =>
                          updateExpenseItem(item.id, "date", e.target.value)
                        }
                        className="mt-2 rounded-xl bg-white"
                        data-testid={`input-date-${item.id}`}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`service-${item.id}`}>Service</Label>
                      <Input
                        id={`service-${item.id}`}
                        value={item.service}
                        onChange={(e) =>
                          updateExpenseItem(item.id, "service", e.target.value)
                        }
                        placeholder="Service"
                        className="mt-2 rounded-xl bg-white"
                        data-testid={`input-service-${item.id}`}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`vendor-${item.id}`}>Vendor *</Label>
                      <Input
                        id={`vendor-${item.id}`}
                        value={item.vendor}
                        onChange={(e) =>
                          updateExpenseItem(item.id, "vendor", e.target.value)
                        }
                        placeholder="Vendor name"
                        required
                        className="mt-2 rounded-xl bg-white"
                        data-testid={`input-vendor-${item.id}`}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`amount-${item.id}`}>Amount</Label>
                      <Input
                        id={`amount-${item.id}`}
                        type="text"
                        value={`Rs ${formatPKR(item.amount)}`}
                        readOnly
                        className="mt-2 rounded-xl bg-white font-semibold"
                        data-testid={`display-amount-${item.id}`}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor={`description-${item.id}`}>
                        Item Description *
                      </Label>
                      <Input
                        id={`description-${item.id}`}
                        value={item.description}
                        onChange={(e) =>
                          updateExpenseItem(
                            item.id,
                            "description",
                            e.target.value,
                          )
                        }
                        placeholder="Expense item description"
                        required
                        className="mt-2 rounded-xl bg-white"
                        data-testid={`input-description-${item.id}`}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`comment-${item.id}`}>Item Comment</Label>
                      <Input
                        id={`comment-${item.id}`}
                        value={item.comment}
                        onChange={(e) =>
                          updateExpenseItem(item.id, "comment", e.target.value)
                        }
                        placeholder="Comment from request item"
                        className="mt-2 rounded-xl bg-white"
                        data-testid={`input-comment-${item.id}`}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <Label htmlFor={`quantity-${item.id}`}>Quantity *</Label>
                      <Input
                        id={`quantity-${item.id}`}
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) =>
                          updateExpenseItem(item.id, "quantity", e.target.value)
                        }
                        placeholder="0"
                        required
                        className="mt-2 rounded-xl bg-white"
                        data-testid={`input-quantity-${item.id}`}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`unitPrice-${item.id}`}>
                        Unit Price *
                      </Label>
                      <Input
                        id={`unitPrice-${item.id}`}
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateExpenseItem(
                            item.id,
                            "unitPrice",
                            e.target.value,
                          )
                        }
                        placeholder="0.00"
                        required
                        className="mt-2 rounded-xl bg-white"
                        data-testid={`input-unit-price-${item.id}`}
                      />
                    </div>

                    <div>
                      <Label>Status</Label>
                      <Input
                        value={getReadableStatus(item.originalStatus)}
                        readOnly
                        className="mt-2 rounded-xl bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Label className="text-base font-semibold text-slate-950">
              Attachments
            </Label>

            <div className="mt-4 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8">
              <div className="text-center">
                <i className="fas fa-upload mb-4 text-4xl text-slate-400"></i>

                <p className="mb-4 text-sm text-slate-600">
                  Add screenshots, receipts, or PDFs for this expense sheet.
                </p>

                <label className="relative inline-flex cursor-pointer">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full bg-white"
                    data-testid="button-choose-files"
                  >
                    Choose Files
                  </Button>

                  <input
                    type="file"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    multiple
                    accept=".png,.jpg,.jpeg,.gif,.pdf"
                    onChange={(e) => setFiles(e.target.files)}
                    data-testid="input-expense-documents"
                  />
                </label>

                <p className="mt-3 text-xs text-slate-500">
                  PNG, JPG, GIF, PDF up to 10MB
                </p>

                {files && files.length > 0 && (
                  <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-left">
                    <p className="text-sm text-green-800">
                      <i className="fas fa-check mr-2"></i>
                      {files.length} file(s) selected:{" "}
                      {Array.from(files)
                        .map((file) => file.name)
                        .join(", ")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-white/95 px-6 py-4 backdrop-blur">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-full px-6"
              data-testid="button-cancel"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={loading}
              className="rounded-full bg-green-600 px-8 py-2 text-white hover:bg-green-700"
              data-testid="button-submit-expense"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Submitting...
                </>
              ) : editingExpense ? (
                "Update Expense Sheet"
              ) : (
                "Submit Expense Sheet"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
