
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

interface Tax {
  id?: string;
  name: string;
  percent: number;
  description?: string;
}

export default function TaxSettings() {
  // =========================
  // ✅ SALES / SERVICE TAX
  // =========================
  const [tax, setTax] = useState<Tax[]>([]);
  const [form, setForm] = useState<{ name: string; percent: string; description: string }>({
    name: "",
    percent: "",
    description: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const taxRef = collection(db, "Panels", "IEDGE-SYSTEM", "tax");

  useEffect(() => {
    const fetchTax = async () => {
      const querySnapshot = await getDocs(taxRef);
      const data = querySnapshot.docs.map((d) => {
        const raw = d.data() as any;
        return {
          id: d.id,
          name: raw.name ?? "",
          percent: Number(raw.percent ?? 0),
          description: raw.description ?? "",
        } as Tax;
      });
      setTax(data);
    };
    fetchTax();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setForm({ name: "", percent: "", description: "" });
    setEditingId(null);
  };

  const handleAddOrUpdate = async () => {
    const name = form.name.trim();
    const percentNum = Number(form.percent);

    if (!name) return alert("Tax name is required");
    if (Number.isNaN(percentNum) || percentNum < 0) return alert("Enter a valid % (0 or more)");
    if (percentNum > 100) return alert("Percent cannot be more than 100");

    setLoading(true);
    try {
      const payload = {
        name,
        percent: percentNum,
        description: form.description.trim(),
      };

      if (editingId) {
        await updateDoc(doc(db, "Panels", "IEDGE-SYSTEM", "tax", editingId), payload);
        setTax((prev) => prev.map((t) => (t.id === editingId ? { ...t, ...payload } : t)));
      } else {
        const docRef = await addDoc(taxRef, payload);
        setTax((prev) => [...prev, { id: docRef.id, ...payload }]);
      }

      resetForm();
    } catch (err) {
      console.error("Error saving Tax:", err);
      alert("Failed to save tax.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (t: Tax) => {
    setEditingId(t.id || null);
    setForm({
      name: t.name,
      percent: String(t.percent ?? 0),
      description: t.description || "",
    });
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm("Delete this Tax?")) return;

    await deleteDoc(doc(db, "Panels", "IEDGE-SYSTEM", "tax", id));
    setTax((prev) => prev.filter((t) => t.id !== id));
  };

  // =========================
  // ✅ WITH HOLDING TAX (WHT)
  // =========================
  const [wht, setWht] = useState<Tax[]>([]);
  const [whtForm, setWhtForm] = useState<{ name: string; percent: string; description: string }>({
    name: "",
    percent: "",
    description: "",
  });
  const [whtEditingId, setWhtEditingId] = useState<string | null>(null);
  const [whtLoading, setWhtLoading] = useState(false);

  // ✅ NEW COLLECTION
  const whtRef = collection(db, "Panels", "IEDGE-SYSTEM", "withholdingTax");

  useEffect(() => {
    const fetchWht = async () => {
      const querySnapshot = await getDocs(whtRef);
      const data = querySnapshot.docs.map((d) => {
        const raw = d.data() as any;
        return {
          id: d.id,
          name: raw.name ?? "",
          percent: Number(raw.percent ?? 0),
          description: raw.description ?? "",
        } as Tax;
      });
      setWht(data);
    };
    fetchWht();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetWhtForm = () => {
    setWhtForm({ name: "", percent: "", description: "" });
    setWhtEditingId(null);
  };

  const handleWhtAddOrUpdate = async () => {
    const name = whtForm.name.trim();
    const percentNum = Number(whtForm.percent);

    if (!name) return alert("With Holding Tax name is required");
    if (Number.isNaN(percentNum) || percentNum < 0) return alert("Enter a valid % (0 or more)");
    if (percentNum > 100) return alert("Percent cannot be more than 100");

    setWhtLoading(true);
    try {
      const payload = {
        name,
        percent: percentNum,
        description: whtForm.description.trim(),
      };

      if (whtEditingId) {
        await updateDoc(doc(db, "Panels", "IEDGE-SYSTEM", "withholdingTax", whtEditingId), payload);
        setWht((prev) => prev.map((t) => (t.id === whtEditingId ? { ...t, ...payload } : t)));
      } else {
        const docRef = await addDoc(whtRef, payload);
        setWht((prev) => [...prev, { id: docRef.id, ...payload }]);
      }

      resetWhtForm();
    } catch (err) {
      console.error("Error saving With Holding Tax:", err);
      alert("Failed to save With Holding Tax.");
    } finally {
      setWhtLoading(false);
    }
  };

  const handleWhtEdit = (t: Tax) => {
    setWhtEditingId(t.id || null);
    setWhtForm({
      name: t.name,
      percent: String(t.percent ?? 0),
      description: t.description || "",
    });
  };

  const handleWhtDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm("Delete this With Holding Tax?")) return;

    await deleteDoc(doc(db, "Panels", "IEDGE-SYSTEM", "withholdingTax", id));
    setWht((prev) => prev.filter((t) => t.id !== id));
  };

  // =========================
  // ✅ UI
  // =========================
  return (
    <div className="space-y-8 ">
      {/* ========================= TAX SECTION ========================= */}
      <div className=" flex space-x-12">
        {/* Add / Edit Form */}
        <div className="flex flex-col p-4 border rounded-lg bg-gray-50 space-y-3">
          <h2 className="text-lg font-medium">{editingId ? "Edit Tax" : "Add New Tax"}</h2>

          <Input
            placeholder="Tax name (e.g. SRB Services)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <Input
            placeholder="Percent (e.g. 13)"
            type="number"
            inputMode="decimal"
            value={form.percent}
            onChange={(e) => setForm({ ...form, percent: e.target.value })}
          />

          <Textarea
            placeholder="Notes (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="flex gap-2">
            <Button onClick={handleAddOrUpdate} disabled={loading}>
              {loading ? "Saving..." : editingId ? "Update" : "Add"}
            </Button>
            {editingId && (
              <Button variant="secondary" onClick={resetForm} disabled={loading}>
                Cancel
              </Button>
            )}
          </div>



            <div className="p-4 border rounded-lg bg-gray-50 ">
          <h2 className="text-lg font-medium mb-3">Existing tax</h2>

          {tax.length === 0 ? (
            <p className="text-sm text-gray-600">No tax found.</p>
          ) : (
            <table className="w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2 text-left">Name</th>
                  <th className="border p-2 text-left">Percent</th>
                  <th className="border p-2 text-left">Notes</th>
                  <th className="border p-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tax.map((t) => (
                  <tr key={t.id}>
                    <td className="border p-2">{t.name}</td>
                    <td className="border p-2">{t.percent}%</td>
                    <td className="border p-2">
                      {t.description || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="border p-2 text-center space-x-2">
                      <Button size="sm" variant="secondary" onClick={() => handleEdit(t)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(t.id)}>
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

      

        {/* ========================= WITH HOLDING TAX SECTION ========================= */}
        <div className="flex flex-col p-4 border rounded-lg bg-gray-50 space-y-3">
          {/* Add / Edit Form */}
          <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
            <h2 className="text-lg font-medium">
              {whtEditingId ? "Edit With Holding Tax" : "Add With Holding Tax"}
            </h2>

            <Input
              placeholder="With Holding Tax name (e.g. WHT Services)"
              value={whtForm.name}
              onChange={(e) => setWhtForm({ ...whtForm, name: e.target.value })}
            />

            <Input
              placeholder="Percent (e.g. 10)"
              type="number"
              inputMode="decimal"
              value={whtForm.percent}
              onChange={(e) => setWhtForm({ ...whtForm, percent: e.target.value })}
            />

            <Textarea
              placeholder="Notes (optional)"
              value={whtForm.description}
              onChange={(e) => setWhtForm({ ...whtForm, description: e.target.value })}
            />

            <div className="flex gap-2">
              <Button onClick={handleWhtAddOrUpdate} disabled={whtLoading}>
                {whtLoading ? "Saving..." : whtEditingId ? "Update" : "Add"}
              </Button>
              {whtEditingId && (
                <Button variant="secondary" onClick={resetWhtForm} disabled={whtLoading}>
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* Existing WHT */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <h2 className="text-lg font-medium mb-3">Existing With Holding Tax</h2>

            {wht.length === 0 ? (
              <p className="text-sm text-gray-600">No With Holding Tax found.</p>
            ) : (
              <table className="w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-2 text-left">Name</th>
                    <th className="border p-2 text-left">Percent</th>
                    <th className="border p-2 text-left">Notes</th>
                    <th className="border p-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {wht.map((t) => (
                    <tr key={t.id}>
                      <td className="border p-2">{t.name}</td>
                      <td className="border p-2">{t.percent}%</td>
                      <td className="border p-2">
                        {t.description || <span className="text-gray-400">-</span>}
                      </td>
                      <td className="border p-2 text-center space-x-2">
                        <Button size="sm" variant="secondary" onClick={() => handleWhtEdit(t)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleWhtDelete(t.id)}>
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
        {/* Existing tax */}

      </div>


    </div>
  );
}

