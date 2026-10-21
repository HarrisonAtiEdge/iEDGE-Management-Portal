import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { Loader2, Pencil, PenLine, Plus, Search, Trash2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import RtgsShell from "@/components/RTGS/RtgsShell";
import {
  fetchSignatures,
  nextNumericId,
  RTGS_PATHS,
  type RtgsSignature,
} from "@/components/RTGS/rtgsData";

type SignatureForm = Pick<RtgsSignature, "name" | "designation" | "company" | "phoneNumber" | "email">;
type SignatureErrors = Partial<Record<keyof SignatureForm, string>>;

const EMPTY_FORM: SignatureForm = { name: "", designation: "", company: "", phoneNumber: "", email: "" };

const FIELDS: Array<{ key: keyof SignatureForm; label: string; placeholder: string }> = [
  { key: "name", label: "Name", placeholder: "Full name" },
  { key: "designation", label: "Designation", placeholder: "e.g. CEO" },
  { key: "company", label: "Company", placeholder: "Company name" },
  { key: "phoneNumber", label: "Phone Number", placeholder: "923001234567" },
  { key: "email", label: "Email", placeholder: "name@company.com" },
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Same rules as the RTGS app.
function validate(form: SignatureForm): SignatureErrors {
  const errors: SignatureErrors = {};
  if (!form.name.trim()) errors.name = "Name is required";
  if (!form.email.trim()) errors.email = "Email is required";
  else if (!EMAIL.test(form.email.trim())) errors.email = "Invalid email format";
  if (!form.phoneNumber.trim()) errors.phoneNumber = "Phone number is required";
  else if (form.phoneNumber.trim().length < 8) errors.phoneNumber = "Phone number is too short";
  return errors;
}

const signatureDoc = (id: string) => doc(db, RTGS_PATHS.signatures, id);
// The RTGS app keeps a copy of each signatory's details in this sub-document.
const detailsDoc = (id: string) => doc(db, RTGS_PATHS.signatures, id, "formData", "details");

export default function RTGSAuthorizers() {
  const { toast } = useToast();
  const [records, setRecords] = useState<RtgsSignature[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [editing, setEditing] = useState<RtgsSignature | "new" | null>(null);
  const [form, setForm] = useState<SignatureForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<SignatureErrors>({});
  const [saving, setSaving] = useState(false);

  const [recordToDelete, setRecordToDelete] = useState<RtgsSignature | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      setRecords(await fetchSignatures());
    } catch (error) {
      console.error("Error fetching signatories:", error);
      toast({ title: "Failed to load signatories", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const filteredRecords = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return records;
    return records.filter((record) =>
      [record.name, record.company, record.email, record.designation]
        .some((value) => String(value || "").toLowerCase().includes(search)),
    );
  }, [records, searchTerm]);

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, name: filteredRecords.length === 0 ? searchTerm.trim() : "" });
    setErrors({});
    setEditing("new");
  };

  const openEdit = (record: RtgsSignature) => {
    setForm({
      name: record.name,
      designation: record.designation,
      company: record.company,
      phoneNumber: record.phoneNumber,
      email: record.email,
    });
    setErrors({});
    setEditing(record);
  };

  const handleSave = async () => {
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const values: SignatureForm = {
      name: form.name.trim(),
      designation: form.designation.trim(),
      company: form.company.trim(),
      phoneNumber: form.phoneNumber.trim(),
      email: form.email.trim(),
    };

    setSaving(true);
    try {
      if (editing === "new") {
        const recordId = String(nextNumericId(records.map((record) => record.recordId)));
        const id = `signature_${recordId}`;
        await setDoc(signatureDoc(id), { ...values, recordId, createdAt: new Date() });
        await setDoc(detailsDoc(id), { ...values, createdAt: new Date() });
        toast({ title: "Signatory added", description: `ID ${recordId}` });
      } else if (editing) {
        await updateDoc(signatureDoc(editing.id), { ...values, updatedAt: new Date() });
        await setDoc(detailsDoc(editing.id), { ...values, updatedAt: new Date() }, { merge: true });
        toast({ title: "Signatory updated" });
      }
      setEditing(null);
      setSearchTerm("");
      await loadRecords();
    } catch (error) {
      console.error("Error saving signatory:", error);
      toast({ title: "Failed to save the signatory", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    const { id } = recordToDelete;
    setDeleting(true);
    try {
      await deleteDoc(signatureDoc(id));
      const formData = await getDocs(collection(db, RTGS_PATHS.signatures, id, "formData"));
      await Promise.all(formData.docs.map((snapshot) => deleteDoc(snapshot.ref)));
      setRecords((list) => list.filter((record) => record.id !== id));
      toast({ title: "Signatory deleted" });
    } catch (error) {
      console.error("Error deleting signatory:", error);
      toast({ title: "Failed to delete the signatory", variant: "destructive" });
    } finally {
      setDeleting(false);
      setRecordToDelete(null);
    }
  };

  return (
    <RtgsShell
      title="Authorizer"
      description="Signatories who sign RAAST / RTGS letters."
      actions={
        <Button className="rounded-2xl" onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Signatory
        </Button>
      }
    >
      <Card className="rounded-3xl shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Signature Records</CardTitle>
              <CardDescription>{records.length} signatories</CardDescription>
            </div>
            <PenLine className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name, company or email..."
              className="rounded-2xl pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading signatories...
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="text-muted-foreground">{record.recordId || "-"}</TableCell>
                        <TableCell className="font-medium">{record.name}</TableCell>
                        <TableCell>{record.designation || "-"}</TableCell>
                        <TableCell>{record.company || "-"}</TableCell>
                        <TableCell className="whitespace-nowrap">{record.phoneNumber || "-"}</TableCell>
                        <TableCell>{record.email || "-"}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="outline" title="Edit" onClick={() => openEdit(record)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              title="Delete"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setRecordToDelete(record)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                        {records.length === 0 ? (
                          "No signatories yet."
                        ) : (
                          <span>
                            No signatory matches “{searchTerm}”.{" "}
                            <button type="button" className="underline" onClick={openAdd}>
                              Add them
                            </button>
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && !saving && setEditing(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Add Signatory" : "Edit Signatory"}</DialogTitle>
            <DialogDescription>
              {editing === "new"
                ? "The signatory gets the next ID automatically."
                : editing
                  ? `ID ${editing.recordId || editing.id}`
                  : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FIELDS.map(({ key, label, placeholder }) => (
              <div key={key} className={key === "email" ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
                <Label htmlFor={`signatory-${key}`}>{label}</Label>
                <Input
                  id={`signatory-${key}`}
                  className="rounded-xl"
                  type={key === "email" ? "email" : "text"}
                  value={form[key]}
                  placeholder={placeholder}
                  onChange={(event) => {
                    setForm((previous) => ({ ...previous, [key]: event.target.value }));
                    setErrors((previous) => ({ ...previous, [key]: undefined }));
                  }}
                />
                {errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
            <Button className="rounded-xl" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing === "new" ? "Add Signatory" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!recordToDelete} onOpenChange={(open) => !open && !deleting && setRecordToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this signatory?</AlertDialogTitle>
            <AlertDialogDescription>
              {recordToDelete?.name} will be removed in both apps. Letters already saved with this signatory are not
              affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RtgsShell>
  );
}
