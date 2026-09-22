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

interface RecordCategory {
  id?: string;
  name: string;
}

export default function RecordCategorySettings() {
  const [categories, setCategories] = useState<RecordCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const categoriesRef = collection(
    db,
    "Panels",
    "IEDGE-SYSTEM",
    "recordCategories"
  );

  useEffect(() => {
    const fetchCategories = async () => {
      const querySnapshot = await getDocs(categoriesRef);
      const data = querySnapshot.docs
        .map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        }))
        .sort((a: any, b: any) => (a.name || "").localeCompare(b.name || "")) as RecordCategory[];
      setCategories(data);
    };
    fetchCategories();
  }, []);

  const handleAddOrUpdate = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) return alert("Category name is required");

    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(
          doc(db, "Panels", "IEDGE-SYSTEM", "recordCategories", editingId),
          { name: trimmedName }
        );

        setCategories((prev) =>
          prev
            .map((c) => (c.id === editingId ? { ...c, name: trimmedName } : c))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        setEditingId(null);
      } else {
        const docRef = await addDoc(categoriesRef, { name: trimmedName });
        setCategories((prev) =>
          [...prev, { id: docRef.id, name: trimmedName }].sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        );
      }

      setNewCategoryName("");
    } catch (err) {
      console.error("Error saving record category:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: RecordCategory) => {
    setEditingId(category.id || null);
    setNewCategoryName(category.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewCategoryName("");
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm("Delete this category?")) return;

    await deleteDoc(doc(db, "Panels", "IEDGE-SYSTEM", "recordCategories", id));
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
        <h2 className="text-lg font-medium">
          {editingId ? "Edit Category" : "Add New Category"}
        </h2>

        <Input
          placeholder="Category name"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
        />

        <div className="flex gap-2">
          <Button onClick={handleAddOrUpdate} disabled={loading}>
            {loading ? "Saving..." : editingId ? "Update" : "Add"}
          </Button>
          {editingId && (
            <Button variant="outline" onClick={handleCancelEdit} disabled={loading}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 border rounded-lg bg-gray-50">
        <h2 className="text-lg font-medium mb-3">Existing Categories</h2>
        {categories.length === 0 ? (
          <p className="text-sm text-gray-600">No categories found.</p>
        ) : (
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Name</th>
                <th className="border p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td className="border p-2">{c.name}</td>
                  <td className="border p-2 text-center space-x-2">
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(c)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(c.id)}>
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
