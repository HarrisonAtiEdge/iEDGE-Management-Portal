// import React, { useEffect, useMemo, useState } from "react";
// import { useLocation } from "wouter";
// import {
//   addDoc,
//   collection,
//   deleteDoc,
//   doc,
//   onSnapshot,
//   serverTimestamp,
//   updateDoc,
// } from "firebase/firestore";
// import {
//   Building2,
//   Eye,
//   FileText,
//   Pencil,
//   Plus,
//   ReceiptText,
//   Search,
//   Trash2,
//   Users,
// } from "lucide-react";

// import { db } from "@/lib/firebase";
// import { useToast } from "@/hooks/use-toast";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";

// const PANEL_ID = "IEDGE-SYSTEM";
// const suppliersCollectionRef = collection(db, "Panels", PANEL_ID, "suppliers");

// type SupplierStatus = "Active" | "Inactive";

// type Supplier = {
//   id: string;
//   name: string;
//   contactPerson?: string;
//   email?: string;
//   phone?: string;
//   address?: string;
//   city?: string;
//   country?: string;
//   ntn?: string;
//   paymentTerms?: string;
//   status?: SupplierStatus;
//   notes?: string;
//   createdAt?: any;
//   updatedAt?: any;
// };

// type SupplierFormState = {
//   name: string;
//   contactPerson: string;
//   email: string;
//   phone: string;
//   address: string;
//   city: string;
//   country: string;
//   ntn: string;
//   paymentTerms: string;
//   status: SupplierStatus;
//   notes: string;
// };

// const emptySupplierForm: SupplierFormState = {
//   name: "",
//   contactPerson: "",
//   email: "",
//   phone: "",
//   address: "",
//   city: "",
//   country: "",
//   ntn: "",
//   paymentTerms: "",
//   status: "Active",
//   notes: "",
// };

// function safeText(value: any) {
//   return typeof value === "string" ? value.trim() : "";
// }

// function toDate(value: any): Date | null {
//   if (!value) return null;
//   if (value instanceof Date) return value;
//   if (typeof value?.toDate === "function") return value.toDate();
//   if (typeof value?.seconds === "number") return new Date(value.seconds * 1000);
//   const parsed = new Date(value);
//   return Number.isNaN(parsed.getTime()) ? null : parsed;
// }

// function formatDate(value: any) {
//   const date = toDate(value);
//   if (!date) return "-";
//   return date.toLocaleDateString("en-GB");
// }

// export default function SuppliersPage() {
//   const { toast } = useToast();
//   const [, setLocation] = useLocation();

//   const [suppliers, setSuppliers] = useState<Supplier[]>([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [viewDialogOpen, setViewDialogOpen] = useState(false);
//   const [supplierForm, setSupplierForm] =
//     useState<SupplierFormState>(emptySupplierForm);
//   const [editingSupplierId, setEditingSupplierId] = useState<string | null>(
//     null,
//   );
//   const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
//   const [saving, setSaving] = useState(false);

//   useEffect(() => {
//     const unsubscribe = onSnapshot(
//       suppliersCollectionRef,
//       (snapshot) => {
//         const rows: Supplier[] = snapshot.docs.map((docSnap) => ({
//           id: docSnap.id,
//           ...(docSnap.data() as Omit<Supplier, "id">),
//         }));

//         rows.sort((a, b) => {
//           const bTime = toDate(b.createdAt)?.getTime() || 0;
//           const aTime = toDate(a.createdAt)?.getTime() || 0;
//           return bTime - aTime;
//         });

//         setSuppliers(rows);
//       },
//       (error) => {
//         console.error("Error loading suppliers:", error);
//         toast({
//           title: "Suppliers loading failed",
//           description: "Could not load suppliers from Firestore.",
//           variant: "destructive",
//         });
//       },
//     );

//     return () => unsubscribe();
//   }, [toast]);

//   const totalSuppliers = suppliers.length;
//   const activeSuppliers = suppliers.filter(
//     (supplier) => supplier.status !== "Inactive",
//   ).length;
//   const inactiveSuppliers = suppliers.filter(
//     (supplier) => supplier.status === "Inactive",
//   ).length;

//   const filteredSuppliers = useMemo(() => {
//     const term = searchTerm.trim().toLowerCase();
//     if (!term) return suppliers;

//     return suppliers.filter((supplier) => {
//       const searchable = [
//         supplier.name,
//         supplier.contactPerson,
//         supplier.email,
//         supplier.phone,
//         supplier.city,
//         supplier.country,
//         supplier.ntn,
//         supplier.paymentTerms,
//         supplier.status,
//       ]
//         .filter(Boolean)
//         .join(" ")
//         .toLowerCase();

//       return searchable.includes(term);
//     });
//   }, [searchTerm, suppliers]);

//   const resetForm = () => {
//     setSupplierForm(emptySupplierForm);
//     setEditingSupplierId(null);
//   };

//   const openCreateDialog = () => {
//     resetForm();
//     setDialogOpen(true);
//   };

//   const handleFormChange = (field: keyof SupplierFormState, value: string) => {
//     setSupplierForm((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleSaveSupplier = async () => {
//     if (!supplierForm.name.trim()) {
//       toast({
//         title: "Supplier name required",
//         description: "Please enter the supplier name before saving.",
//         variant: "destructive",
//       });
//       return;
//     }

//     const payload = {
//       name: safeText(supplierForm.name),
//       contactPerson: safeText(supplierForm.contactPerson),
//       email: safeText(supplierForm.email),
//       phone: safeText(supplierForm.phone),
//       address: safeText(supplierForm.address),
//       city: safeText(supplierForm.city),
//       country: safeText(supplierForm.country),
//       ntn: safeText(supplierForm.ntn),
//       paymentTerms: safeText(supplierForm.paymentTerms),
//       status: supplierForm.status,
//       notes: safeText(supplierForm.notes),
//       updatedAt: serverTimestamp(),
//     };

//     try {
//       setSaving(true);

//       if (editingSupplierId) {
//         await updateDoc(
//           doc(db, "Panels", PANEL_ID, "suppliers", editingSupplierId),
//           payload,
//         );
//         toast({
//           title: "Supplier updated",
//           description: "Supplier details updated successfully.",
//         });
//       } else {
//         await addDoc(suppliersCollectionRef, {
//           ...payload,
//           createdAt: serverTimestamp(),
//         });
//         toast({
//           title: "Supplier created",
//           description: "Supplier saved successfully.",
//         });
//       }

//       setDialogOpen(false);
//       resetForm();
//     } catch (error) {
//       console.error("Error saving supplier:", error);
//       toast({
//         title: "Save failed",
//         description: "Could not save supplier. Please try again.",
//         variant: "destructive",
//       });
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleEditSupplier = (supplier: Supplier) => {
//     setEditingSupplierId(supplier.id);
//     setSupplierForm({
//       name: supplier.name || "",
//       contactPerson: supplier.contactPerson || "",
//       email: supplier.email || "",
//       phone: supplier.phone || "",
//       address: supplier.address || "",
//       city: supplier.city || "",
//       country: supplier.country || "",
//       ntn: supplier.ntn || "",
//       paymentTerms: supplier.paymentTerms || "",
//       status: supplier.status || "Active",
//       notes: supplier.notes || "",
//     });
//     setDialogOpen(true);
//   };

//   const handleViewSupplier = (supplier: Supplier) => {
//     setViewingSupplier(supplier);
//     setViewDialogOpen(true);
//   };

//   const handleDeleteSupplier = async (supplierId: string) => {
//     const confirmed = window.confirm(
//       "Are you sure you want to delete this supplier?",
//     );
//     if (!confirmed) return;

//     try {
//       await deleteDoc(doc(db, "Panels", PANEL_ID, "suppliers", supplierId));
//       toast({
//         title: "Supplier deleted",
//         description: "Supplier removed successfully.",
//       });
//     } catch (error) {
//       console.error("Error deleting supplier:", error);
//       toast({
//         title: "Delete failed",
//         description: "Could not delete supplier.",
//         variant: "destructive",
//       });
//     }
//   };

//   return (
//     <div className="min-h-screen bg-slate-50 p-6 space-y-6">
//       <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
//         <div>
//           <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
//           <p className="text-sm text-muted-foreground">
//             Manage suppliers and access purchase order management from one
//             place.
//           </p>
//         </div>

//         <div className="flex flex-wrap gap-3">
//           {/* <Button
//             variant="outline"
//             className="rounded-2xl"
//             onClick={() => setLocation("/purchase-orders")}
//           >
//             <ReceiptText className="h-4 w-4 mr-2" />
//             PO Management
//           </Button>
//           <Button
//             variant="outline"
//             className="rounded-2xl"
//             onClick={() => setLocation("/create-po")}
//           >
//             <FileText className="h-4 w-4 mr-2" />
//             Create PO
//           </Button> */}
//           <Button className="rounded-2xl" onClick={openCreateDialog}>
//             <Plus className="h-4 w-4 mr-2" />
//             Add Supplier
//           </Button>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <Card className="rounded-3xl shadow-sm">
//           <CardContent className="p-5">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-muted-foreground">Total Suppliers</p>
//                 <p className="text-2xl font-bold mt-1">{totalSuppliers}</p>
//               </div>
//               <Building2 className="h-6 w-6 text-muted-foreground" />
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="rounded-3xl shadow-sm">
//           <CardContent className="p-5">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-muted-foreground">
//                   Active Suppliers
//                 </p>
//                 <p className="text-2xl font-bold mt-1">{activeSuppliers}</p>
//               </div>
//               <Users className="h-6 w-6 text-muted-foreground" />
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="rounded-3xl shadow-sm">
//           <CardContent className="p-5">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-muted-foreground">
//                   Inactive Suppliers
//                 </p>
//                 <p className="text-2xl font-bold mt-1">{inactiveSuppliers}</p>
//               </div>
//               <Users className="h-6 w-6 text-muted-foreground" />
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       <Card className="rounded-3xl shadow-sm">
//         <CardHeader className="space-y-4">
//           <div>
//             <CardTitle>Supplier List</CardTitle>
//             <CardDescription>
//               View, search, create, edit and delete supplier records.
//             </CardDescription>
//           </div>

//           <div className="relative max-w-md">
//             <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//             <Input
//               value={searchTerm}
//               onChange={(event) => setSearchTerm(event.target.value)}
//               placeholder="Search supplier, city, phone, NTN..."
//               className="pl-9 rounded-2xl"
//             />
//           </div>
//         </CardHeader>

//         <CardContent>
//           <div className="overflow-x-auto rounded-2xl border bg-white">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Supplier</TableHead>
//                   <TableHead>Contact Person</TableHead>
//                   <TableHead>Phone</TableHead>
//                   <TableHead>Email</TableHead>
//                   <TableHead>City / Country</TableHead>
//                   <TableHead>Status</TableHead>
//                   <TableHead>Created</TableHead>
//                   <TableHead className="text-right">Action</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {filteredSuppliers.length > 0 ? (
//                   filteredSuppliers.map((supplier) => (
//                     <TableRow key={supplier.id}>
//                       <TableCell>
//                         <div className="font-medium">
//                           {supplier.name || "-"}
//                         </div>
//                         {supplier.ntn ? (
//                           <div className="text-xs text-muted-foreground">
//                             NTN: {supplier.ntn}
//                           </div>
//                         ) : null}
//                       </TableCell>
//                       <TableCell>{supplier.contactPerson || "-"}</TableCell>
//                       <TableCell>{supplier.phone || "-"}</TableCell>
//                       <TableCell>{supplier.email || "-"}</TableCell>
//                       <TableCell>
//                         {[supplier.city, supplier.country]
//                           .filter(Boolean)
//                           .join(", ") || "-"}
//                       </TableCell>
//                       <TableCell>
//                         <Badge
//                           variant={
//                             supplier.status === "Inactive"
//                               ? "secondary"
//                               : "default"
//                           }
//                         >
//                           {supplier.status || "Active"}
//                         </Badge>
//                       </TableCell>
//                       <TableCell>{formatDate(supplier.createdAt)}</TableCell>
//                       <TableCell>
//                         <div className="flex justify-end gap-2">
//                           <Button
//                             size="sm"
//                             variant="outline"
//                             onClick={() => handleViewSupplier(supplier)}
//                           >
//                             <Eye className="h-4 w-4" />
//                           </Button>
//                           <Button
//                             size="sm"
//                             variant="outline"
//                             onClick={() => handleEditSupplier(supplier)}
//                           >
//                             <Pencil className="h-4 w-4" />
//                           </Button>
//                           <Button
//                             size="sm"
//                             variant="ghost"
//                             className="text-red-600 hover:text-red-700"
//                             onClick={() => handleDeleteSupplier(supplier.id)}
//                           >
//                             <Trash2 className="h-4 w-4" />
//                           </Button>
//                         </div>
//                       </TableCell>
//                     </TableRow>
//                   ))
//                 ) : (
//                   <TableRow>
//                     <TableCell
//                       colSpan={8}
//                       className="text-center text-muted-foreground py-8"
//                     >
//                       No suppliers found.
//                     </TableCell>
//                   </TableRow>
//                 )}
//               </TableBody>
//             </Table>
//           </div>
//         </CardContent>
//       </Card>

//       <Dialog
//         open={dialogOpen}
//         onOpenChange={(open) => {
//           setDialogOpen(open);
//           if (!open) resetForm();
//         }}
//       >
//         <DialogContent className="max-w-4xl rounded-3xl max-h-[90vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>
//               {editingSupplierId ? "Edit Supplier" : "Add Supplier"}
//             </DialogTitle>
//           </DialogHeader>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <Label>Supplier Name *</Label>
//               <Input
//                 value={supplierForm.name}
//                 onChange={(event) =>
//                   handleFormChange("name", event.target.value)
//                 }
//                 placeholder="Enter supplier name"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label>Contact Person</Label>
//               <Input
//                 value={supplierForm.contactPerson}
//                 onChange={(event) =>
//                   handleFormChange("contactPerson", event.target.value)
//                 }
//                 placeholder="Enter contact person"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label>Email</Label>
//               <Input
//                 type="email"
//                 value={supplierForm.email}
//                 onChange={(event) =>
//                   handleFormChange("email", event.target.value)
//                 }
//                 placeholder="supplier@email.com"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label>Phone</Label>
//               <Input
//                 value={supplierForm.phone}
//                 onChange={(event) =>
//                   handleFormChange("phone", event.target.value)
//                 }
//                 placeholder="Phone number"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label>City</Label>
//               <Input
//                 value={supplierForm.city}
//                 onChange={(event) =>
//                   handleFormChange("city", event.target.value)
//                 }
//                 placeholder="City"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label>Country</Label>
//               <Input
//                 value={supplierForm.country}
//                 onChange={(event) =>
//                   handleFormChange("country", event.target.value)
//                 }
//                 placeholder="Country"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label>NTN / Tax Number</Label>
//               <Input
//                 value={supplierForm.ntn}
//                 onChange={(event) =>
//                   handleFormChange("ntn", event.target.value)
//                 }
//                 placeholder="NTN / tax number"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label>Payment Terms</Label>
//               <Input
//                 value={supplierForm.paymentTerms}
//                 onChange={(event) =>
//                   handleFormChange("paymentTerms", event.target.value)
//                 }
//                 placeholder="Example: 30 days"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label>Status</Label>
//               <Select
//                 value={supplierForm.status}
//                 onValueChange={(value) =>
//                   handleFormChange("status", value as SupplierStatus)
//                 }
//               >
//                 <SelectTrigger>
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="Active">Active</SelectItem>
//                   <SelectItem value="Inactive">Inactive</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>

//             <div className="space-y-2 md:col-span-2">
//               <Label>Address</Label>
//               <Textarea
//                 value={supplierForm.address}
//                 onChange={(event) =>
//                   handleFormChange("address", event.target.value)
//                 }
//                 rows={3}
//                 placeholder="Supplier address"
//               />
//             </div>

//             <div className="space-y-2 md:col-span-2">
//               <Label>Notes</Label>
//               <Textarea
//                 value={supplierForm.notes}
//                 onChange={(event) =>
//                   handleFormChange("notes", event.target.value)
//                 }
//                 rows={3}
//                 placeholder="Optional notes"
//               />
//             </div>
//           </div>

//           <div className="flex justify-end gap-3 pt-4">
//             <Button
//               variant="outline"
//               onClick={() => {
//                 setDialogOpen(false);
//                 resetForm();
//               }}
//             >
//               Cancel
//             </Button>
//             <Button onClick={handleSaveSupplier} disabled={saving}>
//               {saving
//                 ? "Saving..."
//                 : editingSupplierId
//                   ? "Update Supplier"
//                   : "Save Supplier"}
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>

//       <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
//         <DialogContent className="max-w-3xl rounded-3xl">
//           <DialogHeader>
//             <DialogTitle>Supplier Details</DialogTitle>
//           </DialogHeader>

//           {viewingSupplier ? (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//               <div>
//                 <p className="text-muted-foreground">Supplier Name</p>
//                 <p className="font-semibold">{viewingSupplier.name || "-"}</p>
//               </div>
//               <div>
//                 <p className="text-muted-foreground">Status</p>
//                 <Badge
//                   variant={
//                     viewingSupplier.status === "Inactive"
//                       ? "secondary"
//                       : "default"
//                   }
//                 >
//                   {viewingSupplier.status || "Active"}
//                 </Badge>
//               </div>
//               <div>
//                 <p className="text-muted-foreground">Contact Person</p>
//                 <p className="font-medium">
//                   {viewingSupplier.contactPerson || "-"}
//                 </p>
//               </div>
//               <div>
//                 <p className="text-muted-foreground">Phone</p>
//                 <p className="font-medium">{viewingSupplier.phone || "-"}</p>
//               </div>
//               <div>
//                 <p className="text-muted-foreground">Email</p>
//                 <p className="font-medium">{viewingSupplier.email || "-"}</p>
//               </div>
//               <div>
//                 <p className="text-muted-foreground">NTN / Tax Number</p>
//                 <p className="font-medium">{viewingSupplier.ntn || "-"}</p>
//               </div>
//               <div>
//                 <p className="text-muted-foreground">City / Country</p>
//                 <p className="font-medium">
//                   {[viewingSupplier.city, viewingSupplier.country]
//                     .filter(Boolean)
//                     .join(", ") || "-"}
//                 </p>
//               </div>
//               <div>
//                 <p className="text-muted-foreground">Payment Terms</p>
//                 <p className="font-medium">
//                   {viewingSupplier.paymentTerms || "-"}
//                 </p>
//               </div>
//               <div className="md:col-span-2">
//                 <p className="text-muted-foreground">Address</p>
//                 <p className="font-medium whitespace-pre-line">
//                   {viewingSupplier.address || "-"}
//                 </p>
//               </div>
//               <div className="md:col-span-2">
//                 <p className="text-muted-foreground">Notes</p>
//                 <p className="font-medium whitespace-pre-line">
//                   {viewingSupplier.notes || "-"}
//                 </p>
//               </div>
//             </div>
//           ) : null}
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }







import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  Building2,
  Eye,
  FileText,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  Users,
} from "lucide-react";

import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const PANEL_ID = "IEDGE-SYSTEM";
const suppliersCollectionRef = collection(db, "Panels", PANEL_ID, "suppliers");

type SupplierStatus = "Active" | "Inactive";

type Supplier = {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  ntn?: string;
  paymentTerms?: string;
  openingBalance?: string | number;
  status?: SupplierStatus;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
};

type SupplierFormState = {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  ntn: string;
  paymentTerms: string;
  openingBalance: string;
  status: SupplierStatus;
  notes: string;
};

const emptySupplierForm: SupplierFormState = {
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  country: "",
  ntn: "",
  paymentTerms: "",
  openingBalance: "",
  status: "Active",
  notes: "",
};

function safeText(value: any) {
  return typeof value === "string" ? value.trim() : "";
}

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.seconds === "number") return new Date(value.seconds * 1000);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value: any) {
  const date = toDate(value);
  if (!date) return "-";
  return date.toLocaleDateString("en-GB");
}

export default function SuppliersPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [supplierForm, setSupplierForm] =
    useState<SupplierFormState>(emptySupplierForm);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(
    null,
  );
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      suppliersCollectionRef,
      (snapshot) => {
        const rows: Supplier[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Supplier, "id">),
        }));

        rows.sort((a, b) => {
          const bTime = toDate(b.createdAt)?.getTime() || 0;
          const aTime = toDate(a.createdAt)?.getTime() || 0;
          return bTime - aTime;
        });

        setSuppliers(rows);
      },
      (error) => {
        console.error("Error loading suppliers:", error);
        toast({
          title: "Suppliers loading failed",
          description: "Could not load suppliers from Firestore.",
          variant: "destructive",
        });
      },
    );

    return () => unsubscribe();
  }, [toast]);

  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(
    (supplier) => supplier.status !== "Inactive",
  ).length;
  const inactiveSuppliers = suppliers.filter(
    (supplier) => supplier.status === "Inactive",
  ).length;

  const filteredSuppliers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return suppliers;

    return suppliers.filter((supplier) => {
      const searchable = [
        supplier.name,
        supplier.contactPerson,
        supplier.email,
        supplier.phone,
        supplier.city,
        supplier.country,
        supplier.ntn,
        supplier.paymentTerms,
        supplier.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(term);
    });
  }, [searchTerm, suppliers]);

  const resetForm = () => {
    setSupplierForm(emptySupplierForm);
    setEditingSupplierId(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleFormChange = (field: keyof SupplierFormState, value: string) => {
    setSupplierForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSupplier = async () => {
    if (!supplierForm.name.trim()) {
      toast({
        title: "Supplier name required",
        description: "Please enter the supplier name before saving.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      name: safeText(supplierForm.name),
      contactPerson: safeText(supplierForm.contactPerson),
      email: safeText(supplierForm.email),
      phone: safeText(supplierForm.phone),
      address: safeText(supplierForm.address),
      city: safeText(supplierForm.city),
      country: safeText(supplierForm.country),
      ntn: safeText(supplierForm.ntn),
      paymentTerms: safeText(supplierForm.paymentTerms),
      openingBalance: safeText(supplierForm.openingBalance),
      status: supplierForm.status,
      notes: safeText(supplierForm.notes),
      updatedAt: serverTimestamp(),
    };

    try {
      setSaving(true);

      if (editingSupplierId) {
        await updateDoc(
          doc(db, "Panels", PANEL_ID, "suppliers", editingSupplierId),
          payload,
        );
        toast({
          title: "Supplier updated",
          description: "Supplier details updated successfully.",
        });
      } else {
        await addDoc(suppliersCollectionRef, {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast({
          title: "Supplier created",
          description: "Supplier saved successfully.",
        });
      }

      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving supplier:", error);
      toast({
        title: "Save failed",
        description: "Could not save supplier. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplierId(supplier.id);
    setSupplierForm({
      name: supplier.name || "",
      contactPerson: supplier.contactPerson || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      city: supplier.city || "",
      country: supplier.country || "",
      ntn: supplier.ntn || "",
      paymentTerms: supplier.paymentTerms || "",
      openingBalance:
        supplier.openingBalance === undefined || supplier.openingBalance === null
          ? ""
          : String(supplier.openingBalance),
      status: supplier.status || "Active",
      notes: supplier.notes || "",
    });
    setDialogOpen(true);
  };

  const handleViewSupplier = (supplier: Supplier) => {
    setViewingSupplier(supplier);
    setViewDialogOpen(true);
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this supplier?",
    );
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "Panels", PANEL_ID, "suppliers", supplierId));
      toast({
        title: "Supplier deleted",
        description: "Supplier removed successfully.",
      });
    } catch (error) {
      console.error("Error deleting supplier:", error);
      toast({
        title: "Delete failed",
        description: "Could not delete supplier.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-sm text-muted-foreground">
            Manage suppliers and access purchase order management from one
            place.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* <Button
            variant="outline"
            className="rounded-2xl"
            onClick={() => setLocation("/purchase-orders")}
          >
            <ReceiptText className="h-4 w-4 mr-2" />
            PO Management
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl"
            onClick={() => setLocation("/create-po")}
          >
            <FileText className="h-4 w-4 mr-2" />
            Create PO
          </Button> */}
          <Button className="rounded-2xl" onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-3xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Suppliers</p>
                <p className="text-2xl font-bold mt-1">{totalSuppliers}</p>
              </div>
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Active Suppliers
                </p>
                <p className="text-2xl font-bold mt-1">{activeSuppliers}</p>
              </div>
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Inactive Suppliers
                </p>
                <p className="text-2xl font-bold mt-1">{inactiveSuppliers}</p>
              </div>
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl shadow-sm">
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Supplier List</CardTitle>
            <CardDescription>
              View, search, create, edit and delete supplier records.
            </CardDescription>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search supplier, city, phone, NTN..."
              className="pl-9 rounded-2xl"
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-2xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>City / Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.length > 0 ? (
                  filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <div className="font-medium">
                          {supplier.name || "-"}
                        </div>
                        {supplier.ntn ? (
                          <div className="text-xs text-muted-foreground">
                            NTN: {supplier.ntn}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>{supplier.contactPerson || "-"}</TableCell>
                      <TableCell>{supplier.phone || "-"}</TableCell>
                      <TableCell>{supplier.email || "-"}</TableCell>
                      <TableCell>
                        {[supplier.city, supplier.country]
                          .filter(Boolean)
                          .join(", ") || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            supplier.status === "Inactive"
                              ? "secondary"
                              : "default"
                          }
                        >
                          {supplier.status || "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(supplier.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewSupplier(supplier)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditSupplier(supplier)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteSupplier(supplier.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-8"
                    >
                      No suppliers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-4xl rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSupplierId ? "Edit Supplier" : "Add Supplier"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Supplier Name *</Label>
              <Input
                value={supplierForm.name}
                onChange={(event) =>
                  handleFormChange("name", event.target.value)
                }
                placeholder="Enter supplier name"
              />
            </div>

            <div className="space-y-2">
              <Label>Contact Person</Label>
              <Input
                value={supplierForm.contactPerson}
                onChange={(event) =>
                  handleFormChange("contactPerson", event.target.value)
                }
                placeholder="Enter contact person"
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={supplierForm.email}
                onChange={(event) =>
                  handleFormChange("email", event.target.value)
                }
                placeholder="supplier@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={supplierForm.phone}
                onChange={(event) =>
                  handleFormChange("phone", event.target.value)
                }
                placeholder="Phone number"
              />
            </div>

            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={supplierForm.city}
                onChange={(event) =>
                  handleFormChange("city", event.target.value)
                }
                placeholder="City"
              />
            </div>

            <div className="space-y-2">
              <Label>Country</Label>
              <Input
                value={supplierForm.country}
                onChange={(event) =>
                  handleFormChange("country", event.target.value)
                }
                placeholder="Country"
              />
            </div>

            <div className="space-y-2">
              <Label>NTN / Tax Number</Label>
              <Input
                value={supplierForm.ntn}
                onChange={(event) =>
                  handleFormChange("ntn", event.target.value)
                }
                placeholder="NTN / tax number"
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Terms</Label>
              <Input
                value={supplierForm.paymentTerms}
                onChange={(event) =>
                  handleFormChange("paymentTerms", event.target.value)
                }
                placeholder="Example: 30 days"
              />
            </div>

            <div className="space-y-2">
              <Label>Opening Balance</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={supplierForm.openingBalance}
                onChange={(event) =>
                  handleFormChange("openingBalance", event.target.value)
                }
                placeholder="Enter opening balance (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={supplierForm.status}
                onValueChange={(value) =>
                  handleFormChange("status", value as SupplierStatus)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Address</Label>
              <Textarea
                value={supplierForm.address}
                onChange={(event) =>
                  handleFormChange("address", event.target.value)
                }
                rows={3}
                placeholder="Supplier address"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={supplierForm.notes}
                onChange={(event) =>
                  handleFormChange("notes", event.target.value)
                }
                rows={3}
                placeholder="Optional notes"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveSupplier} disabled={saving}>
              {saving
                ? "Saving..."
                : editingSupplierId
                  ? "Update Supplier"
                  : "Save Supplier"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl rounded-3xl">
          <DialogHeader>
            <DialogTitle>Supplier Details</DialogTitle>
          </DialogHeader>

          {viewingSupplier ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Supplier Name</p>
                <p className="font-semibold">{viewingSupplier.name || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge
                  variant={
                    viewingSupplier.status === "Inactive"
                      ? "secondary"
                      : "default"
                  }
                >
                  {viewingSupplier.status || "Active"}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Contact Person</p>
                <p className="font-medium">
                  {viewingSupplier.contactPerson || "-"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">{viewingSupplier.phone || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{viewingSupplier.email || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">NTN / Tax Number</p>
                <p className="font-medium">{viewingSupplier.ntn || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">City / Country</p>
                <p className="font-medium">
                  {[viewingSupplier.city, viewingSupplier.country]
                    .filter(Boolean)
                    .join(", ") || "-"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Payment Terms</p>
                <p className="font-medium">
                  {viewingSupplier.paymentTerms || "-"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Opening Balance</p>
                <p className="font-medium">
                  {viewingSupplier.openingBalance === undefined ||
                  viewingSupplier.openingBalance === null ||
                  String(viewingSupplier.openingBalance).trim() === ""
                    ? "-"
                    : String(viewingSupplier.openingBalance)}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-muted-foreground">Address</p>
                <p className="font-medium whitespace-pre-line">
                  {viewingSupplier.address || "-"}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-muted-foreground">Notes</p>
                <p className="font-medium whitespace-pre-line">
                  {viewingSupplier.notes || "-"}
                </p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
