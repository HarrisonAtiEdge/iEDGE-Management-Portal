import { useCallback, useEffect, useMemo, useState } from "react";
import { deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { Building2, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
import RtgsPagination from "@/components/RTGS/RtgsPagination";
import {
  fetchVendors,
  nextNumericId,
  RTGS_PATHS,
  type RtgsVendor,
} from "@/components/RTGS/rtgsData";

const VENDORS_PER_PAGE = 10;

type VendorForm = Omit<RtgsVendor, "id">;
type VendorErrors = Partial<Record<keyof VendorForm, string>>;

const EMPTY_FORM: VendorForm = {
  accountTitle: "",
  address: "",
  mobileNumber: "",
  accountNo: "",
  bank: "",
  branch: "",
};

const FIELDS: Array<{ key: keyof VendorForm; label: string; placeholder: string }> = [
  { key: "accountTitle", label: "Account Title", placeholder: "Vendor account title" },
  { key: "accountNo", label: "IBAN / Account No", placeholder: "PK36SCBL0000001123456702 or 10–20 digits" },
  { key: "bank", label: "Bank", placeholder: "Bank name" },
  { key: "branch", label: "Branch", placeholder: "Branch name" },
  { key: "mobileNumber", label: "Mobile Number", placeholder: "+923001234567" },
  { key: "address", label: "Address", placeholder: "Vendor address" },
];

const capitalizeFirst = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

// Same rules as the RTGS app: IBAN or a 10–20 digit account number.
const IBAN = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/;
const ACCOUNT_NO = /^[0-9]{10,20}$/;
const PHONE = /^\+?[0-9][0-9\s-]{8,17}$/;

function validate(form: VendorForm): VendorErrors {
  const errors: VendorErrors = {};
  if (!form.accountTitle.trim()) errors.accountTitle = "Account Title is required.";
  if (!form.address.trim()) errors.address = "Address is required.";
  if (!PHONE.test(form.mobileNumber.trim())) errors.mobileNumber = "Enter a valid mobile number, e.g. +923001234567.";
  const accountNo = form.accountNo.trim();
  if (!IBAN.test(accountNo) && !ACCOUNT_NO.test(accountNo)) errors.accountNo = "Invalid IBAN or Account No.";
  if (!form.bank.trim()) errors.bank = "Bank name is required.";
  if (!form.branch.trim()) errors.branch = "Branch name is required.";
  return errors;
}

export default function RTGSVendors() {
  const { toast } = useToast();
  const [vendors, setVendors] = useState<RtgsVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // null = closed, "new" = adding, otherwise the vendor being edited.
  const [editing, setEditing] = useState<RtgsVendor | "new" | null>(null);
  const [form, setForm] = useState<VendorForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<VendorErrors>({});
  const [saving, setSaving] = useState(false);

  const [vendorToDelete, setVendorToDelete] = useState<RtgsVendor | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadVendors = useCallback(async () => {
    setLoading(true);
    try {
      setVendors(await fetchVendors());
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toast({ title: "Failed to load vendors", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadVendors();
  }, [loadVendors]);

  const filteredVendors = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return vendors;
    return vendors.filter((vendor) =>
      [vendor.id, vendor.accountTitle, vendor.accountNo, vendor.bank, vendor.branch, vendor.address]
        .some((value) => String(value || "").toLowerCase().includes(search)),
    );
  }, [vendors, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredVendors.length / VENDORS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const firstIndex = (page - 1) * VENDORS_PER_PAGE;
  const pageVendors = filteredVendors.slice(firstIndex, firstIndex + VENDORS_PER_PAGE);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setEditing("new");
  };

  const openEdit = (vendor: RtgsVendor) => {
    const { id: _id, ...rest } = vendor;
    setForm(rest);
    setErrors({});
    setEditing(vendor);
  };

  const handleSave = async () => {
    const isNew = editing === "new";
    // New vendors are fully validated like the RTGS app; edits only need a title.
    const validationErrors = isNew
      ? validate(form)
      : form.accountTitle.trim()
        ? {}
        : { accountTitle: "Account Title is required." };
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        const nextId = nextNumericId(vendors.map((vendor) => vendor.id));
        await setDoc(doc(db, RTGS_PATHS.vendors, String(nextId)), {
          accountTitle: capitalizeFirst(form.accountTitle.trim()),
          address: capitalizeFirst(form.address.trim()),
          mobileNumber: form.mobileNumber.trim(),
          accountNo: form.accountNo.trim(),
          bank: capitalizeFirst(form.bank.trim()),
          branch: capitalizeFirst(form.branch.trim()),
          id: nextId,
          createdAt: new Date(),
        });
        toast({ title: "Vendor added", description: `Vendor ID ${nextId}` });
      } else if (editing) {
        await updateDoc(doc(db, RTGS_PATHS.vendors, editing.id), {
          accountTitle: form.accountTitle,
          address: form.address,
          mobileNumber: form.mobileNumber,
          accountNo: form.accountNo,
          bank: form.bank,
          branch: form.branch,
        });
        toast({ title: "Vendor updated" });
      }
      setEditing(null);
      await loadVendors();
    } catch (error) {
      console.error("Error saving vendor:", error);
      toast({ title: "Failed to save the vendor", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!vendorToDelete) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, RTGS_PATHS.vendors, vendorToDelete.id));
      setVendors((list) => list.filter((vendor) => vendor.id !== vendorToDelete.id));
      toast({ title: "Vendor deleted" });
    } catch (error) {
      console.error("Error deleting vendor:", error);
      toast({ title: "Failed to delete the vendor", variant: "destructive" });
    } finally {
      setDeleting(false);
      setVendorToDelete(null);
    }
  };

  return (
    <RtgsShell
      title="RTGS Vendors"
      description="Bank accounts you send RAAST / RTGS payments to."
      actions={
        <Button className="rounded-2xl" onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Vendor
        </Button>
      }
    >
      <Card className="rounded-3xl shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Vendor List</CardTitle>
              <CardDescription>{vendors.length} vendors</CardDescription>
            </div>
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by vendor name, account, bank..."
              className="rounded-2xl pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading vendors...
            </div>
          ) : (
            <>
              {filteredVendors.length > 0 && (
                <p className="mb-3 text-xs text-muted-foreground">
                  Showing {firstIndex + 1}-{Math.min(firstIndex + VENDORS_PER_PAGE, filteredVendors.length)} of{" "}
                  {filteredVendors.length} vendors
                </p>
              )}
              <div className="overflow-x-auto rounded-2xl border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Account Title</TableHead>
                      <TableHead>Account No</TableHead>
                      <TableHead>Bank</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageVendors.length > 0 ? (
                      pageVendors.map((vendor) => (
                        <TableRow key={vendor.id}>
                          <TableCell className="text-muted-foreground">{vendor.id}</TableCell>
                          <TableCell className="font-medium">{vendor.accountTitle}</TableCell>
                          <TableCell className="whitespace-nowrap">{vendor.accountNo}</TableCell>
                          <TableCell>{vendor.bank}</TableCell>
                          <TableCell>{vendor.branch}</TableCell>
                          <TableCell className="whitespace-nowrap">{vendor.mobileNumber}</TableCell>
                          <TableCell className="max-w-xs truncate" title={vendor.address}>
                            {vendor.address}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="outline" title="Edit" onClick={() => openEdit(vendor)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                title="Delete"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setVendorToDelete(vendor)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                          {vendors.length === 0 ? "No vendors yet." : "No vendors match your search."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <RtgsPagination page={page} totalPages={totalPages} onPageChange={setCurrentPage} />
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && !saving && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Add Vendor" : "Edit Vendor"}</DialogTitle>
            <DialogDescription>
              {editing === "new"
                ? "The vendor gets the next vendor ID automatically."
                : editing
                  ? `Vendor ID ${editing.id}`
                  : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FIELDS.map(({ key, label, placeholder }) => (
              <div key={key} className={key === "address" ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
                <Label htmlFor={`vendor-${key}`}>{label}</Label>
                <Input
                  id={`vendor-${key}`}
                  className="rounded-xl"
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
              {editing === "new" ? "Add Vendor" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!vendorToDelete} onOpenChange={(open) => !open && !deleting && setVendorToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this vendor?</AlertDialogTitle>
            <AlertDialogDescription>
              {vendorToDelete?.accountTitle} will be removed from the vendor list in both apps. Letters already saved
              for this vendor are not affected.
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
