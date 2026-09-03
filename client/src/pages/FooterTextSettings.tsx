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

interface FooterTextEntry {
  id?: string;
  name: string;
  description?: string;
}

export default function FooterTextSettings() {
  const [footerTexts, setFooterTexts] = useState<FooterTextEntry[]>([]);
  const [newFooterText, setNewFooterText] = useState({
    name: "",
    description: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const footerTextsRef = collection(
    db,
    "Panels",
    "IEDGE-SYSTEM",
    "footerTexts",
  );

  // ✅ Fetch Footer Texts from Firestore
  useEffect(() => {
    const fetchFooterTexts = async () => {
      const querySnapshot = await getDocs(footerTextsRef);
      const data = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as FooterTextEntry[];
      setFooterTexts(data);
    };

    fetchFooterTexts();
  }, []);

  // ✅ Add or Update Footer Text
  const handleAddOrUpdate = async () => {
    if (!newFooterText.name.trim())
      return alert("Footer Text title is required");

    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(
          doc(db, "Panels", "IEDGE-SYSTEM", "footerTexts", editingId),
          newFooterText,
        );

        setFooterTexts((prev) =>
          prev.map((item) =>
            item.id === editingId ? { ...item, ...newFooterText } : item,
          ),
        );
        setEditingId(null);
      } else {
        const docRef = await addDoc(footerTextsRef, newFooterText);
        setFooterTexts((prev) => [
          ...prev,
          { id: docRef.id, ...newFooterText },
        ]);
      }

      setNewFooterText({ name: "", description: "" });
    } catch (err) {
      console.error("Error saving Footer Text:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Edit Footer Text
  const handleEdit = (item: FooterTextEntry) => {
    setEditingId(item.id || null);
    setNewFooterText({
      name: item.name,
      description: item.description || "",
    });
  };

  // ✅ Delete Footer Text
  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm("Delete this Footer Text?")) return;

    await deleteDoc(doc(db, "Panels", "IEDGE-SYSTEM", "footerTexts", id));
    setFooterTexts((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Add / Edit Form */}
      <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
        <h2 className="text-lg font-medium">
          {editingId ? "Edit Footer Text" : "Add New Footer Text"}
        </h2>

        <Input
          placeholder="Title"
          value={newFooterText.name}
          onChange={(e) =>
            setNewFooterText({ ...newFooterText, name: e.target.value })
          }
        />

        <Textarea
          placeholder="Footer text"
          value={newFooterText.description}
          onChange={(e) =>
            setNewFooterText({
              ...newFooterText,
              description: e.target.value,
            })
          }
        />

        <Button onClick={handleAddOrUpdate} disabled={loading}>
          {loading ? "Saving..." : editingId ? "Update" : "Add"}
        </Button>
      </div>

      {/* Existing Footer Texts */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h2 className="text-lg font-medium mb-3">Existing Footer Texts</h2>

        {footerTexts.length === 0 ? (
          <p className="text-sm text-gray-600">No footer texts found.</p>
        ) : (
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Title</th>
                <th className="border p-2 text-left">Footer Text</th>
                <th className="border p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {footerTexts.map((item) => (
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
