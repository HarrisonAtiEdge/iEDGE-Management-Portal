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
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Company {
  id?: string;
  name: string;
  description?: string;
  logo?: string; // download URL
  logoPath?: string; // storage path to delete/replace
}

export default function CompanySettings() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [newCompany, setNewCompany] = useState<{ name: string; description: string }>({ name: "", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // local file state for preview + upload
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const storage = getStorage(); // assumes Firebase app already initialized in "@/lib/firebase"

  // Fetch Company from Firestore
  useEffect(() => {
    const fetchCompany = async () => {
      const querySnapshot = await getDocs(collection(db, "Company"));
      const data = querySnapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Company[];
      setCompanies(data);
    };
    fetchCompany();
  }, []);

  // cleanup preview url when file changes/unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // helper: sanitize name for path
  const sanitize = (s = "") => s.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_\.]/g, "").toLowerCase();

  // upload file to storage and return { downloadURL, path }
  const uploadLogo = async (companyName: string, fileToUpload: File) => {
    const ext = fileToUpload.name.split(".").pop() || "png";
    const filename = `${Date.now()}-${sanitize(companyName)}.${ext}`;
    const path = `company-logos/${filename}`;
    const ref = storageRef(storage, path);
    await uploadBytes(ref, fileToUpload); // upload
    const url = await getDownloadURL(ref); // get URL
    return { url, path };
  };

  // Add or Update Company
  const handleAddOrUpdate = async () => {
    if (!newCompany.name.trim()) return alert("Company name is required");

    setLoading(true);
    try {
      // If editing
      if (editingId) {
        const docRef = doc(db, "Company", editingId);
        const updates: Partial<Company> = {
          name: newCompany.name,
          description: newCompany.description,
        };

        // If user selected a new file, upload and optionally delete old
        if (file) {
          // upload new logo
          const { url, path } = await uploadLogo(newCompany.name, file);
          // fetch existing doc to know old path
          const existingDoc = companies.find((c) => c.id === editingId);
          // Replace old file: delete old from storage if exists
          if (existingDoc?.logoPath) {
            try {
              await deleteObject(storageRef(storage, existingDoc.logoPath));
            } catch (err) {
              // ignore deletion errors (maybe file was missing) but log
              console.warn("Failed to delete old logo:", err);
            }
          }
          updates.logo = url;
          updates.logoPath = path;
        }

        await updateDoc(docRef, updates);
        // update local state
        setCompanies((prev) => prev.map((c) => (c.id === editingId ? { ...c, ...updates } as Company : c)));
        setEditingId(null);
      } else {
        // Adding new company
        let logo: string | undefined = undefined;
        let logoPath: string | undefined = undefined;

        if (file) {
          const { url, path } = await uploadLogo(newCompany.name, file);
          logo = url;
          logoPath = path;
        }

        const payload: Company = {
          name: newCompany.name,
          description: newCompany.description,
          logo,
          logoPath,
        };

        const docRef = await addDoc(collection(db, "Company"), payload);
        setCompanies((prev) => [...prev, { id: docRef.id, ...payload }]);
      }

      // reset form
      setNewCompany({ name: "", description: "" });
      setFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    } catch (err) {
      console.error("Error saving Company:", err);
      alert("Failed to save company. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // Edit
  const handleEdit = (company: Company) => {
    setEditingId(company.id || null);
    setNewCompany({
      name: company.name,
      description: company.description || "",
    });
    setPreviewUrl(company.logo || null);
    setFile(null); // no new file yet
  };

  // Delete company and its logo
  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm("Delete this Company?")) return;

    try {
      const companyToDelete = companies.find((c) => c.id === id);
      if (companyToDelete?.logoPath) {
        try {
          await deleteObject(storageRef(storage, companyToDelete.logoPath));
        } catch (err) {
          console.warn("Error deleting logo from storage:", err);
        }
      }
      await deleteDoc(doc(db, "Company", id));
      setCompanies((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Error deleting company:", err);
      alert("Failed to delete. See console for details.");
    }
  };

  // File selection handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (!f) {
      setFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      return;
    }
    // optional: validate size/type
    if (!f.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    // generate preview
    const url = URL.createObjectURL(f);
    setFile(f);
    setPreviewUrl(url);
  };

  return (
    <div className="space-y-6">
      {/* Add / Edit Form */}
      <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
        <h2 className="text-lg font-medium">{editingId ? "Edit Company" : "Add New Company"}</h2>

        <Input
          placeholder="Company name"
          value={newCompany.name}
          onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
        />
        <Textarea
          placeholder="Description (optional)"
          value={newCompany.description}
          onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
        />

        {/* Logo file input + preview */}
        <div className="flex items-center space-x-4">
          <label className="flex items-center gap-2">
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="logoFile" />
            <Button onClick={() => document.getElementById("logoFile")?.click()}>Choose Logo</Button>
            <span className="text-sm text-gray-600">{file ? file.name : "No file selected"}</span>
          </label>

          {previewUrl && (
            <img
              src={previewUrl}
              alt="Logo preview"
              className="h-12 w-12 object-cover rounded-md border"
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleAddOrUpdate} disabled={loading}>
            {loading ? "Saving..." : editingId ? "Update" : "Add"}
          </Button>
          {editingId && (
            <Button
              variant="secondary"
              onClick={() => {
                // cancel edit
                setEditingId(null);
                setNewCompany({ name: "", description: "" });
                setFile(null);
                if (previewUrl) {
                  URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(null);
                }
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Existing Company */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h2 className="text-lg font-medium mb-3">Existing Company</h2>
        {companies.length === 0 ? (
          <p className="text-sm text-gray-600">No Company found.</p>
        ) : (
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Logo</th>
                <th className="border p-2 text-left">Name</th>
                <th className="border p-2 text-left">Description</th>
                <th className="border p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((s) => (
                <tr key={s.id}>
                  <td className="border p-2">
                    {s.logo ? (
                      <img src={s.logo} alt={s.name} className="h-10 w-10 object-cover rounded-md" />
                    ) : (
                      <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-400">No</div>
                    )}
                  </td>
                  <td className="border p-2">{s.name}</td>
                  <td className="border p-2">{s.description || <span className="text-gray-400">-</span>}</td>
                  <td className="border p-2 text-center space-x-2">
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(s)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(s.id)}>
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
