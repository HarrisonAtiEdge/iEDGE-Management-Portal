import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, addDoc, serverTimestamp, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
}
const PANEL_ID = "IEDGE-SYSTEM";

export default function ExpenseSheetModal({
  isOpen,
  onClose,
  onSuccess,
  editingExpense = null,
}: ExpenseSheetModalProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [approvedRequests, setApprovedRequests] = useState<any[]>([]);
  const [expenseItems, setExpenseItems] = useState([
    {
      id: 1,
      vendor: "",
      description: "",
      quantity: "",
      unitPrice: "",
      amount: 0
    }
  ]);
  const [formData, setFormData] = useState({
    linkedRequestId: "",
    clientName: "",
    project: "",
    comment: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadApprovedRequests();
      
      if (editingExpense) {
        // Pre-populate form with existing data
        setFormData({
          linkedRequestId: editingExpense.linkedRequestId || "",
          clientName: editingExpense.clientName,
          project: editingExpense.project,
          comment: editingExpense.comment || "",
        });
        setExpenseItems(editingExpense.expenseItems);
        setFiles(null); // Reset files for editing
      }
    }
  }, [isOpen, editingExpense]);

  // async function loadApprovedRequests() {
  //   try {
  //     // Get both approved and payment_released requests since both can be used for expense sheets
  //     const [approvedSnapshot, paymentReleasedSnapshot] = await Promise.all([
  //       getDocs(query(
  //         collection(db, "invoiceRequests"),
  //         where("status", "==", "approved")
  //       )),
  //       getDocs(query(
  //         collection(db, "invoiceRequests"),
  //         where("status", "==", "payment_released")
  //       ))
  //     ]);
      
  //     const allDocs = [...approvedSnapshot.docs, ...paymentReleasedSnapshot.docs];
  //     const requests = allDocs.map(doc => {
  //       const data = doc.data();
  //       return {
  //         id: doc.id,
  //         requestId: data.requestId,
  //         clientName: data.clientName,
  //         project: data.project
  //       };
  //     });
  //     setApprovedRequests(requests);
  //   } catch (error) {
  //     console.error("Failed to load approved requests:", error);
  //   }
  // }

  async function loadApprovedRequests() {
  try {
    const [approvedSnapshot, paymentReleasedSnapshot] = await Promise.all([
      getDocs(
        query(
          collection(db, "Panels", PANEL_ID, "invoiceRequests"),
          where("status", "==", "approved")
        )
      ),
      getDocs(
        query(
          collection(db, "Panels", PANEL_ID, "invoiceRequests"),
          where("status", "==", "payment_released")
        )
      ),
    ]);

    const allDocs = [...approvedSnapshot.docs, ...paymentReleasedSnapshot.docs];

    const requests = allDocs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        requestId: data.requestId,
        clientName: data.clientName,
        project: data.project,
      };
    });

    setApprovedRequests(requests);
  } catch (error) {
    console.error("Failed to load approved requests:", error);
  }
}


  function updateExpenseItem(id: number, field: string, value: string) {
    setExpenseItems(prev => 
      prev.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            const qty = parseFloat(field === 'quantity' ? value : updated.quantity) || 0;
            const price = parseFloat(field === 'unitPrice' ? value : updated.unitPrice) || 0;
            updated.amount = qty * price;
          }
          return updated;
        }
        return item;
      })
    );
  }

  function addExpenseItem() {
    const newId = Math.max(...expenseItems.map(item => item.id)) + 1;
    setExpenseItems(prev => [...prev, {
      id: newId,
      vendor: "",
      description: "",
      quantity: "",
      unitPrice: "",
      amount: 0
    }]);
  }

  function removeExpenseItem(id: number) {
    if (expenseItems.length > 1) {
      setExpenseItems(prev => prev.filter(item => item.id !== id));
    }
  }

  const totalAmount = expenseItems.reduce((sum, item) => sum + item.amount, 0);

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

    if (expenseItems.some(item => !item.vendor || !item.description)) {
      toast({
        title: "Error",
        description: "Please fill in all expense item details",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Upload expense documents
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

      if (editingExpense) {
        // Update existing expense sheet
        const existingDocuments = editingExpense.expenseDocuments || [];
        const allDocuments = [...existingDocuments, ...documentUrls];
        
        // await updateDoc(doc(db, "expenseSheets", editingExpense.id), {
           await updateDoc(doc(db, "Panels", PANEL_ID, "expenseSheets", editingExpense.id), {
          linkedRequestId: formData.linkedRequestId,
          clientName: formData.clientName,
          project: formData.project,
          comment: formData.comment,
          expenseItems: expenseItems,
          totalAmount: totalAmount,
          expenseDocuments: allDocuments,
          status: "pending_operational_admin", // Reset status for re-approval
          updatedAt: serverTimestamp(),
        });
      } else {
        // Create new expense sheet
        // await addDoc(collection(db, "expenseSheets"), {
           await addDoc(collection(db, "Panels", PANEL_ID, "expenseSheets"), {
          linkedRequestId: formData.linkedRequestId,
          clientName: formData.clientName,
          project: formData.project,
          comment: formData.comment,
          expenseItems: expenseItems,
          totalAmount: totalAmount,
          expenseDocuments: documentUrls,
          status: "pending_operational_admin",
          submittedBy: userProfile.id,
          submittedAt: serverTimestamp(),
          approvalHistory: [],
        });
      }

      toast({
        title: "Success",
        description: editingExpense ? "Expense sheet updated successfully" : "Expense sheet submitted successfully",
      });

      // Reset form only if creating new (not editing)
      if (!editingExpense) {
        setFormData({
          linkedRequestId: "",
          clientName: "",
          project: "",
          comment: "",
        });
        setExpenseItems([{
          id: 1,
          vendor: "",
          description: "",
          quantity: "",
          unitPrice: "",
          amount: 0
        }]);
      }
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <i className={`fas fa-receipt ${editingExpense ? 'text-orange-600' : 'text-green-600'}`}></i>
            <span>{editingExpense ? 'Edit Expense Sheet' : 'New Expense Sheet'}</span>
          </DialogTitle>
          <DialogDescription>
            {editingExpense ? 'Update and resubmit your expense sheet with changes' : 'Submit a new expense sheet with item details and attachments'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Link to Request Form */}
          <div>
            <Label htmlFor="linkedRequest">Link to Request Form *</Label>
            <Select
              value={formData.linkedRequestId}
              onValueChange={(value) =>
                setFormData({ ...formData, linkedRequestId: value })
              }
            >
              <SelectTrigger data-testid="select-linked-request">
                <SelectValue placeholder="No approved request forms available" />
              </SelectTrigger>
              <SelectContent>
                {approvedRequests.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No approved request forms available
                  </SelectItem>
                ) : (
                  approvedRequests.map((request) => (
                    <SelectItem key={request.id} value={request.requestId}>
                      {request.requestId} - {request.clientName} ({request.project})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              Request forms must be approved and can be used for expense sheets even after payment has been released.
            </p>
          </div>

          {/* Client Name and Project */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) =>
                  setFormData({ ...formData, clientName: e.target.value })
                }
                placeholder="Enter client name"
                required
                data-testid="input-client-name"
              />
            </div>
            <div>
              <Label htmlFor="project">Project *</Label>
              <Input
                id="project"
                value={formData.project}
                onChange={(e) =>
                  setFormData({ ...formData, project: e.target.value })
                }
                placeholder="Enter project name"
                required
                data-testid="input-project"
              />
            </div>
          </div>

          {/* Comment */}
          <div>
            <Label htmlFor="comment">Comment</Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) =>
                setFormData({ ...formData, comment: e.target.value })
              }
              placeholder="Add any additional comments or notes (optional)"
              className="min-h-[80px]"
              data-testid="textarea-comment"
            />
          </div>

          {/* Expense Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-lg font-semibold">Expense Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addExpenseItem}
                data-testid="button-add-expense-item"
              >
                Add New
              </Button>
            </div>
            
            <div className="space-y-6">
              {expenseItems.map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Expense {index + 1}</h4>
                    {expenseItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExpenseItem(item.id)}
                        className="text-red-600 hover:text-red-800"
                        data-testid={`button-remove-expense-${item.id}`}
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`vendor-${item.id}`}>Vendor *</Label>
                      <Input
                        id={`vendor-${item.id}`}
                        value={item.vendor}
                        onChange={(e) => updateExpenseItem(item.id, 'vendor', e.target.value)}
                        placeholder="Enter vendor name"
                        required
                        data-testid={`input-vendor-${item.id}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`description-${item.id}`}>Item Description *</Label>
                      <Input
                        id={`description-${item.id}`}
                        value={item.description}
                        onChange={(e) => updateExpenseItem(item.id, 'description', e.target.value)}
                        placeholder="Describe the expense item"
                        required
                        data-testid={`input-description-${item.id}`}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`quantity-${item.id}`}>Quantity *</Label>
                      <Input
                        id={`quantity-${item.id}`}
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateExpenseItem(item.id, 'quantity', e.target.value)}
                        placeholder="0"
                        required
                        data-testid={`input-quantity-${item.id}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`unitPrice-${item.id}`}>Unit Price *</Label>
                      <Input
                        id={`unitPrice-${item.id}`}
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateExpenseItem(item.id, 'unitPrice', e.target.value)}
                        placeholder="0.00"
                        required
                        data-testid={`input-unit-price-${item.id}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`amount-${item.id}`}>Amount</Label>
                      <Input
                        id={`amount-${item.id}`}
                        type="number"
                        value={item.amount.toFixed(2)}
                        readOnly
                        className="bg-gray-50"
                        data-testid={`display-amount-${item.id}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attachments */}
          <div>
            <Label className="text-lg font-semibold">Attachments</Label>
            <div className="mt-4 border-2 border-dashed border-gray-300 rounded-lg p-8">
              <div className="text-center">
                <div className="mb-4">
                  <i className="fas fa-upload text-4xl text-gray-400"></i>
                </div>
                <div className="mb-2">
                  <span className="text-gray-600">Add Screenshots or PDFs</span>
                </div>
                <div className="mb-4">
                  <label className="relative cursor-pointer">
                    <Button
                      type="button"
                      variant="outline"
                      className="bg-white border-gray-300"
                      data-testid="button-choose-files"
                    >
                      Choose Files
                    </Button>
                    <input
                      type="file"
                      className="sr-only"
                      multiple
                      accept=".png,.jpg,.jpeg,.gif,.pdf"
                      onChange={(e) => setFiles(e.target.files)}
                      data-testid="input-expense-documents"
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-500">
                  PNG, JPG, GIF, PDF up to 10MB
                </p>
                {files && files.length > 0 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-green-800">
                      <i className="fas fa-check mr-2"></i>
                      {files.length} file(s) selected: {Array.from(files).map(f => f.name).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-2"
              data-testid="button-submit-expense"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Submitting...
                </>
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
