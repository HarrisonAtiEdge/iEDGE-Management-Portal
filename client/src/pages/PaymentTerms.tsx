import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface PaymentTerm {
  id?: string;
  name: string;
  description?: string;
}

export default function PaymentTermsSettings() {
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
  const [newPaymentTerm, setNewPaymentTerm] = useState({ name: "", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const paymentTermsRef = collection(db, "Panels", "IEDGE-SYSTEM", "paymentTerms");

  // ✅ Fetch Payment Terms from Firestore
  useEffect(() => {
    const fetchPaymentTerms = async () => {
      const querySnapshot = await getDocs(paymentTermsRef);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PaymentTerm[];
      setPaymentTerms(data);
    };
    fetchPaymentTerms();
  }, []);

  // ✅ Add or Update Payment Term
  const handleAddOrUpdate = async () => {
    if (!newPaymentTerm.name.trim()) return alert("Payment term name is required");

    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(
          doc(db, "Panels", "IEDGE-SYSTEM", "paymentTerms", editingId),
          newPaymentTerm
        );

        setPaymentTerms((prev) =>
          prev.map((term) =>
            term.id === editingId ? { ...term, ...newPaymentTerm } : term
          )
        );
        setEditingId(null);
      } else {
        const docRef = await addDoc(paymentTermsRef, newPaymentTerm);
        setPaymentTerms((prev) => [
          ...prev,
          { id: docRef.id, ...newPaymentTerm },
        ]);
      }

      setNewPaymentTerm({ name: "", description: "" });
    } catch (err) {
      console.error("Error saving Payment Term:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Edit Payment Term
  const handleEdit = (term: PaymentTerm) => {
    setEditingId(term.id || null);
    setNewPaymentTerm({
      name: term.name,
      description: term.description || "",
    });
  };

  // ✅ Delete Payment Term
  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm("Delete this Payment Term?")) return;

    await deleteDoc(doc(db, "Panels", "IEDGE-SYSTEM", "paymentTerms", id));

    setPaymentTerms((prev) => prev.filter((term) => term.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Add / Edit Form */}
      <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
        <h2 className="text-lg font-medium">
          {editingId ? "Edit Payment Term" : "Add New Payment Term"}
        </h2>

        <Input
          placeholder="Payment Term Name"
          value={newPaymentTerm.name}
          onChange={(e) =>
            setNewPaymentTerm({ ...newPaymentTerm, name: e.target.value })
          }
        />
        <Textarea
          placeholder="Description (optional)"
          value={newPaymentTerm.description}
          onChange={(e) =>
            setNewPaymentTerm({ ...newPaymentTerm, description: e.target.value })
          }
        />

        <Button onClick={handleAddOrUpdate} disabled={loading}>
          {loading ? "Saving..." : editingId ? "Update" : "Add"}
        </Button>
      </div>

      {/* Existing Payment Terms */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h2 className="text-lg font-medium mb-3">Existing Payment Terms</h2>
        {paymentTerms.length === 0 ? (
          <p className="text-sm text-gray-600">No payment terms found.</p>
        ) : (
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Name</th>
                <th className="border p-2 text-left">Description</th>
                <th className="border p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paymentTerms.map((term) => (
                <tr key={term.id}>
                  <td className="border p-2">{term.name}</td>
                  <td className="border p-2">
                    {term.description || <span className="text-gray-400">-</span>}
                  </td>
                  <td className="border p-2 text-center space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEdit(term)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(term.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
