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

interface TermsCondition {
  id?: string;
  name: string;
  description?: string;
}

export default function TermsConditionsSettings() {
  const [termsConditions, setTermsConditions] = useState<TermsCondition[]>([]);
  const [newTermsCondition, setNewTermsCondition] = useState({
    name: "",
    description: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const termsConditionsRef = collection(
    db,
    "Panels",
    "IEDGE-SYSTEM",
    "termsConditions"
  );

  // ✅ Fetch Terms & Conditions from Firestore
  useEffect(() => {
    const fetchTermsConditions = async () => {
      const querySnapshot = await getDocs(termsConditionsRef);
      const data = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as TermsCondition[];
      setTermsConditions(data);
    };

    fetchTermsConditions();
  }, []);

  // ✅ Add or Update Terms & Condition
  const handleAddOrUpdate = async () => {
    if (!newTermsCondition.name.trim())
      return alert("Terms & Condition name is required");

    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(
          doc(db, "Panels", "IEDGE-SYSTEM", "termsConditions", editingId),
          newTermsCondition
        );

        setTermsConditions((prev) =>
          prev.map((item) =>
            item.id === editingId ? { ...item, ...newTermsCondition } : item
          )
        );
        setEditingId(null);
      } else {
        const docRef = await addDoc(termsConditionsRef, newTermsCondition);
        setTermsConditions((prev) => [
          ...prev,
          { id: docRef.id, ...newTermsCondition },
        ]);
      }

      setNewTermsCondition({ name: "", description: "" });
    } catch (err) {
      console.error("Error saving Terms & Condition:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Edit Terms & Condition
  const handleEdit = (item: TermsCondition) => {
    setEditingId(item.id || null);
    setNewTermsCondition({
      name: item.name,
      description: item.description || "",
    });
  };

  // ✅ Delete Terms & Condition
  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm("Delete this Terms & Condition?")) return;

    await deleteDoc(doc(db, "Panels", "IEDGE-SYSTEM", "termsConditions", id));
    setTermsConditions((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Add / Edit Form */}
      <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
        <h2 className="text-lg font-medium">
          {editingId ? "Edit Terms & Condition" : "Add New Terms & Condition"}
        </h2>

        <Input
          placeholder="Company Name"
          value={newTermsCondition.name}
          onChange={(e) =>
            setNewTermsCondition({ ...newTermsCondition, name: e.target.value })
          }
        />

        <Textarea
          placeholder="Description"
          value={newTermsCondition.description}
          onChange={(e) =>
            setNewTermsCondition({
              ...newTermsCondition,
              description: e.target.value,
            })
          }
        />

        <Button onClick={handleAddOrUpdate} disabled={loading}>
          {loading ? "Saving..." : editingId ? "Update" : "Add"}
        </Button>
      </div>

      {/* Existing Terms & Conditions */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h2 className="text-lg font-medium mb-3">
          Existing Terms & Conditions
        </h2>

        {termsConditions.length === 0 ? (
          <p className="text-sm text-gray-600">No terms & conditions found.</p>
        ) : (
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Title</th>
                <th className="border p-2 text-left">Description</th>
                <th className="border p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {termsConditions.map((item) => (
                <tr key={item.id}>
                  <td className="border p-2">{item.name}</td>
                  <td className="border p-2">
                    {item.description || (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="border p-2 text-center space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEdit(item)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(item.id)}
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
