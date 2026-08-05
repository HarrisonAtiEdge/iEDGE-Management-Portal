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
//   openingBalance?: string | number;
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
//   openingBalance: string;
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
//   openingBalance: "",
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
//       openingBalance: safeText(supplierForm.openingBalance),
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
//       openingBalance:
//         supplier.openingBalance === undefined || supplier.openingBalance === null
//           ? ""
//           : String(supplier.openingBalance),
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
//               <Label>Opening Balance</Label>
//               <Input
//                 type="text"
//                 inputMode="decimal"
//                 value={supplierForm.openingBalance}
//                 onChange={(event) =>
//                   handleFormChange("openingBalance", event.target.value)
//                 }
//                 placeholder="Enter opening balance (optional)"
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
//               <div>
//                 <p className="text-muted-foreground">Opening Balance</p>
//                 <p className="font-medium">
//                   {viewingSupplier.openingBalance === undefined ||
//                   viewingSupplier.openingBalance === null ||
//                   String(viewingSupplier.openingBalance).trim() === ""
//                     ? "-"
//                     : String(viewingSupplier.openingBalance)}
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







import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import {
  Building2,
  FileText,
  Paperclip,
  Printer,
  Search,
  SlidersHorizontal,
  Download,
  Users,
  Wallet,
} from "lucide-react";
import { useFirestoreQuery } from "@/hooks/useFirestore";
import { db } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";
import { InvoiceRequest } from "@shared/schema";

type RequestType = "General" | "Project";
type TypeFilter = "all" | "general" | "project";
type DatePreset = "last12" | "last30" | "thisMonth" | "all";

type RecordItem = {
  category?: string;
  amount?: number | string;
  name?: string;
  description?: string;
};

type FirestoreRecordData = {
  id: string;
  accountId?: string;
  accountType?: "cheque" | "online";
  accountTitle?: string;
  accountNo?: string;
  bank?: string;
  branch?: string;
  city?: string;
  platform?: string;
  routingNumber?: string;
  chequeNumber?: string;
  chequeAmount?: number | string;
  totalItemAmount?: number | string;
  remainingBalance?: number | string;
  items?: RecordItem[];
  createdBy?: string;
  createdByName?: string;
  createdAt?: any;
  updatedAt?: any;
  status?: string;
};

type FirestoreSupplierData = {
  id: string;
  name: string;
  openingBalance?: number | string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  ntn?: string;
  paymentTerms?: string;
  status?: string;
  notes?: string;
};

type VendorTransaction = {
  id: string;
  requestId: string;
  vendorName: string;
  projectName: string;
  requestType: RequestType;
  type: string;
  purpose: string;
  billNo: string;
  chequeNumber: string;
  paidAmount: number;
  totalRequestAmount: number;
  salesTax: number;
  totalBeforeTax: number;
  remainingBalance: number;
  paymentDate: Date | null;
  requestDate: Date | null;
  paymentStatus: string;
  company: string;
  billingAddress: string;
  achInfo: string;
  notes: string;
};

type VendorSummaryItem = {
  vendorName: string;
  paidAmount: number;
  openingBalance: number;
  openBalance: number;
  overduePayment: number;
  transactionCount: number;
  company: string;
  billingAddress: string;
  achInfo: string;
  notes: string;
};

function safeNumber(value: any) {
  if (value === null || value === undefined || value === "") return 0;

  const parsed =
    typeof value === "string" ? Number(value.replace(/,/g, "")) : Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPKR(value: number | string | undefined) {
  if (value === null || value === undefined) return "0.00";

  const num =
    typeof value === "number"
      ? value
      : parseFloat(String(value).replace(/,/g, "")) || 0;

  return num.toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCurrency(value: number | string | undefined) {
  return `PKR ${formatPKR(value)}`;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeCsvValue(value: unknown): string {
  const text = String(value ?? "");
  const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
}

function sanitizeFileName(value: string): string {
  return (
    value
      .trim()
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "") || "vendor"
  );
}

function normalizeText(value: any) {
  return String(value || "")
    .toLowerCase()
    .trim();
}

function normalizeVendorKey(value: any) {
  return normalizeText(value).replace(/\s+/g, " ");
}

function getFirstTextValue(values: any[]): string {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }

  return "";
}

function getDateFromValue(value: any): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value?.toDate === "function") {
    const date = value.toDate();
    return Number.isNaN(date?.getTime?.()) ? null : date;
  }

  if (typeof value?.seconds === "number") {
    const date = new Date(value.seconds * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    const ymd = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (ymd) {
      const date = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const dmy = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmy) {
      const date = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function formatDate(value: any) {
  const date = getDateFromValue(value);
  if (!date) return "-";

  return date.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getRequestDate(invoice: any): Date | null {
  return (
    getDateFromValue(invoice?.submitDate) ||
    getDateFromValue(invoice?.submittedAt) ||
    getDateFromValue(invoice?.submissionDate) ||
    getDateFromValue(invoice?.requestDate) ||
    getDateFromValue(invoice?.createdAt) ||
    getDateFromValue(invoice?.date) ||
    getDateFromValue(invoice?.created_at) ||
    getDateFromValue(invoice?.timestamp) ||
    getDateFromValue(invoice?.updatedAt)
  );
}

function getPaymentDate(invoice: any): Date | null {
  return (
    getDateFromValue(invoice?.paymentReleasedAt) ||
    getDateFromValue(invoice?.releasePaymentAt) ||
    getDateFromValue(invoice?.paymentDate) ||
    getDateFromValue(invoice?.paidAt) ||
    getDateFromValue(invoice?.paymentDetails?.paymentDate) ||
    getDateFromValue(invoice?.paymentDetails?.paidAt) ||
    getDateFromValue(invoice?.paymentDetails?.releasedAt) ||
    getDateFromValue(invoice?.releasePayment?.paymentDate) ||
    getDateFromValue(invoice?.releasePayment?.paidAt) ||
    getDateFromValue(invoice?.releasePayment?.releasedAt) ||
    null
  );
}

function getDueDate(invoice: any): Date | null {
  return (
    getDateFromValue(invoice?.dueDate) ||
    getDateFromValue(invoice?.paymentDueDate) ||
    getDateFromValue(invoice?.invoiceDueDate) ||
    null
  );
}

function hasPaymentReleased(invoice: any): boolean {
  const status = normalizeText(invoice?.status);
  const paymentStatus = normalizeText(
    invoice?.paymentStatus || invoice?.releasePaymentStatus,
  );

  return Boolean(
    status === "payment_released" ||
    paymentStatus === "released" ||
    paymentStatus === "payment_released" ||
    invoice?.paymentReleased ||
    invoice?.releasePaymentCreated ||
    invoice?.paymentReleaseId ||
    invoice?.paymentId ||
    invoice?.paymentReleasedAt ||
    invoice?.releasePaymentAt ||
    invoice?.paymentDetails?.releasedAt,
  );
}

function getRequestType(invoice: any): RequestType {
  const rawType = normalizeText(invoice?.invoiceType || invoice?.type);

  if (rawType === "project") return "Project";
  if (rawType === "general") return "General";

  const hasProjectFields = Boolean(
    invoice?.projectName ||
    invoice?.project ||
    invoice?.projectCode ||
    invoice?.clientName,
  );

  return hasProjectFields ? "Project" : "General";
}

function getInvoiceVendorName(invoice: any): string {
  return getFirstTextValue([
    invoice?.vendorName,
    invoice?.supplierName,
    invoice?.payeeName,
    invoice?.payee,
    invoice?.paymentDetails?.vendor,
    invoice?.releasePayment?.vendor,
    invoice?.clientName,
  ]);
}

function getItemVendorName(item: any): string {
  return getFirstTextValue([
    item?.vendor,
    item?.vendorName,
    item?.supplier,
    item?.supplierName,
    item?.payee,
    item?.payeeName,
    item?.original?.vendor,
    item?.original?.vendorName,
    item?.original?.supplier,
    item?.original?.supplierName,
  ]);
}

function getProjectName(invoice: any): string {
  const requestType = getRequestType(invoice);

  if (requestType === "General") return "-";

  return (
    getFirstTextValue([
      invoice?.projectName,
      invoice?.project,
      invoice?.projectCode,
      invoice?.title,
      invoice?.subject,
    ]) || "-"
  );
}

function getBillNumber(invoice: any): string {
  return getFirstTextValue([
    invoice?.paymentNumber,
    invoice?.paymentNo,
    invoice?.paymentReference,
    invoice?.reference,
    invoice?.chequeNumber,
    invoice?.checkNumber,
    invoice?.requestId,
  ]);
}

function getChequeNumber(invoice: any): string {
  return getFirstTextValue([
    invoice?.chequeNumber,
    invoice?.checkNumber,
    invoice?.chequeNo,
    invoice?.checkNo,
    invoice?.paymentChequeNumber,
    invoice?.paymentCheckNumber,
    invoice?.reference,
    invoice?.paymentReference,
    invoice?.transactionReference,
    invoice?.releasePayment?.chequeNumber,
    invoice?.releasePayment?.checkNumber,
    invoice?.releasePayment?.chequeNo,
    invoice?.releasePayment?.checkNo,
    invoice?.releasePayment?.reference,
    invoice?.releasePayment?.transactionReference,
    invoice?.paymentDetails?.chequeNumber,
    invoice?.paymentDetails?.checkNumber,
    invoice?.paymentDetails?.chequeNo,
    invoice?.paymentDetails?.checkNo,
    invoice?.paymentDetails?.reference,
    invoice?.paymentDetails?.transactionReference,
  ]);
}

function getTotalRequestAmount(invoice: any): number {
  return safeNumber(
    invoice?.approvedAmount || invoice?.totalAmount || invoice?.amount,
  );
}

function getExplicitPaidAmount(invoice: any): number {
  const paymentDetails = invoice?.paymentDetails || {};
  const releasePayment = invoice?.releasePayment || {};

  return safeNumber(
    invoice?.paidAmount ||
      invoice?.paymentAmount ||
      invoice?.releasedAmount ||
      invoice?.releasePaymentAmount ||
      invoice?.amountPaid ||
      paymentDetails?.paidAmount ||
      paymentDetails?.amount ||
      paymentDetails?.releasedAmount ||
      releasePayment?.paidAmount ||
      releasePayment?.amount ||
      releasePayment?.releasedAmount,
  );
}

function getRequestPaidAmount(invoice: any): number {
  const explicitPaidAmount = getExplicitPaidAmount(invoice);
  if (explicitPaidAmount > 0) return explicitPaidAmount;

  return hasPaymentReleased(invoice) ? getTotalRequestAmount(invoice) : 0;
}

function getSourceItems(invoice: any): any[] {
  const approvalItems = Array.isArray(invoice?.approvalItems)
    ? invoice.approvalItems
    : [];

  const lineItems = Array.isArray(invoice?.lineItems) ? invoice.lineItems : [];

  if (approvalItems.length > 0) return approvalItems;
  return lineItems;
}

function getItemAmount(item: any): number {
  const directAmount = safeNumber(
    item?.approvedAmount ||
      item?.totalAmount ||
      item?.amount ||
      item?.netAmount ||
      item?.grossAmount ||
      item?.total ||
      item?.price,
  );

  if (directAmount > 0) return directAmount;

  const quantity = safeNumber(item?.quantity || item?.qty || item?.units);
  const rate = safeNumber(item?.rate || item?.unitPrice || item?.unitRate);

  if (quantity > 0 && rate > 0) return quantity * rate;

  return 0;
}

function getItemSalesTax(item: any, invoice: any): number {
  return safeNumber(
    item?.salesTax ||
      item?.tax ||
      item?.taxAmount ||
      item?.sst ||
      item?.gst ||
      item?.sales_tax ||
      invoice?.salesTax ||
      invoice?.taxAmount ||
      invoice?.sst ||
      invoice?.gst,
  );
}

function getPaymentStatus(
  invoice: any,
  paidAmount: number,
  remainingBalance: number,
) {
  const status = normalizeText(invoice?.status);
  const paymentStatus = normalizeText(
    invoice?.paymentStatus || invoice?.releasePaymentStatus,
  );

  if (paidAmount > 0 && remainingBalance <= 0) return "Paid";
  if (paidAmount > 0 && remainingBalance > 0) return "Partially Paid";

  if (
    paymentStatus === "pending" ||
    status === "approved" ||
    status === "ready_for_payment" ||
    status === "po_created" ||
    status === "po_submitted" ||
    status === "po_approved" ||
    status === "po_issued" ||
    status === "pending_finance"
  ) {
    return "Pending";
  }

  return "Unpaid";
}

function getStatusBadgeClass(status: string) {
  const normalized = normalizeText(status);

  if (normalized === "paid") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized === "partially paid") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (normalized === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function getTypeBadgeClass(type: RequestType) {
  return type === "Project"
    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
    : "border-slate-200 bg-slate-50 text-slate-700";
}

function getVendorMeta(invoice: any) {
  return {
    company: getFirstTextValue([
      invoice?.company,
      invoice?.companyName,
      invoice?.vendorCompany,
      invoice?.supplierCompany,
    ]),
    billingAddress: getFirstTextValue([
      invoice?.billingAddress,
      invoice?.vendorAddress,
      invoice?.supplierAddress,
      invoice?.address,
    ]),
    achInfo: getFirstTextValue([
      invoice?.billPayAchInfo,
      invoice?.billPayACHInfo,
      invoice?.achInfo,
      invoice?.bankInfo,
      invoice?.accountInfo,
      invoice?.paymentDetails?.selectedAccount?.accountName,
    ]),
    notes: getFirstTextValue([
      invoice?.notes,
      invoice?.remarks,
      invoice?.description,
      invoice?.message,
      invoice?.paymentDetails?.paymentNotes,
    ]),
  };
}

function getPaymentPurpose(invoice: any, item?: any): string {
  const itemPurpose = getFirstTextValue([
    item?.purpose,
    item?.paymentPurpose,
    item?.description,
    item?.itemDescription,
    item?.particulars,
    item?.details,
    item?.title,
    item?.itemName,
    item?.name,
    item?.category,
    item?.reason,
    item?.remarks,
    item?.notes,
    item?.original?.purpose,
    item?.original?.paymentPurpose,
    item?.original?.description,
    item?.original?.particulars,
    item?.original?.details,
    item?.original?.title,
    item?.original?.category,
  ]);

  if (itemPurpose) return itemPurpose;

  const invoicePurpose = getFirstTextValue([
    invoice?.paymentPurpose,
    invoice?.purpose,
    invoice?.description,
    invoice?.requestDescription,
    invoice?.title,
    invoice?.subject,
    invoice?.reason,
    invoice?.particulars,
    invoice?.remarks,
    invoice?.notes,
    invoice?.message,
    invoice?.paymentDetails?.purpose,
    invoice?.paymentDetails?.paymentPurpose,
    invoice?.paymentDetails?.paymentNotes,
    invoice?.releasePayment?.purpose,
    invoice?.releasePayment?.paymentPurpose,
    invoice?.releasePayment?.notes,
  ]);

  if (invoicePurpose) return invoicePurpose;

  const projectName = getProjectName(invoice);
  return projectName && projectName !== "-"
    ? `Payment for ${projectName}`
    : "Payment purpose not provided";
}

function buildRecordVendorTransactions(
  records: FirestoreRecordData[],
): VendorTransaction[] {
  const rows: VendorTransaction[] = [];

  records.forEach((record) => {
    const items = Array.isArray(record?.items) ? record.items : [];
    const recordDate =
      getDateFromValue(record?.createdAt) ||
      getDateFromValue(record?.updatedAt);
    const chequeNumber = getFirstTextValue([record?.chequeNumber]);
    const accountProvider = getFirstTextValue([record?.platform, record?.bank]);
    const achInfo = [
      record?.accountTitle,
      accountProvider,
      record?.accountNo ? `Account No: ${record.accountNo}` : "",
    ]
      .filter(Boolean)
      .join(" · ");

    items.forEach((item, index) => {
      // The Record item's Name field is intentionally used as the vendor name.
      const vendorName = getFirstTextValue([item?.name]);
      if (!vendorName) return;

      const amount = safeNumber(item?.amount);
      const category = getFirstTextValue([item?.category]);
      const description = getFirstTextValue([item?.description]);
      const purpose =
        [category, description].filter(Boolean).join(" — ") ||
        "Record payment";
      const recordReference = getFirstTextValue([chequeNumber, record?.id]);

      rows.push({
        id: `record-${record?.id || "unknown"}-${index}`,
        requestId: String(record?.id || "-"),
        vendorName,
        projectName: "-",
        requestType: "General",
        type: "Record Payment",
        purpose,
        billNo: recordReference,
        chequeNumber,
        paidAmount: amount,
        totalRequestAmount: amount,
        salesTax: 0,
        totalBeforeTax: amount,
        remainingBalance: 0,
        paymentDate: recordDate,
        requestDate: recordDate,
        paymentStatus: amount > 0 ? "Paid" : "Unpaid",
        company: "",
        billingAddress: "",
        achInfo,
        notes: [category, description].filter(Boolean).join(" — "),
      });
    });
  });

  return rows;
}

function buildVendorTransactions(
  invoices: any[],
  records: FirestoreRecordData[],
): VendorTransaction[] {
  const rows: VendorTransaction[] = [];

  invoices.forEach((invoice: any) => {
    const requestType = getRequestType(invoice);
    const requestTotalAmount = getTotalRequestAmount(invoice);
    const requestPaidAmount = getRequestPaidAmount(invoice);
    const sourceItems = getSourceItems(invoice);
    const requestDate = getRequestDate(invoice);
    const paymentDate = getPaymentDate(invoice);
    const projectName = getProjectName(invoice);
    const billNo = getBillNumber(invoice);
    const chequeNumber = getChequeNumber(invoice);
    const invoiceVendorName = getInvoiceVendorName(invoice);
    const meta = getVendorMeta(invoice);

    // When supplier names are stored on individual items, every item must use
    // its own supplier. This prevents one supplier from receiving transactions
    // that belong to another supplier in the same request.
    const hasItemLevelVendors = sourceItems.some((item: any) =>
      Boolean(getItemVendorName(item)),
    );

    const validItems = sourceItems.filter((item: any) => {
      const itemVendorName = getItemVendorName(item);
      const vendorName = hasItemLevelVendors
        ? itemVendorName
        : invoiceVendorName;

      return Boolean(vendorName);
    });

    const itemTotalSum = validItems.reduce(
      (sum: number, item: any) => sum + getItemAmount(item),
      0,
    );

    const totalBaseAmount =
      requestTotalAmount > 0
        ? requestTotalAmount
        : itemTotalSum > 0
          ? itemTotalSum
          : 0;

    if (validItems.length > 0) {
      validItems.forEach((item: any, index: number) => {
        const itemVendorName = getItemVendorName(item);
        const vendorName = hasItemLevelVendors
          ? itemVendorName
          : invoiceVendorName;

        if (!vendorName) return;

        const itemAmount =
          getItemAmount(item) ||
          (totalBaseAmount > 0 ? totalBaseAmount / validItems.length : 0);

        const ratio =
          totalBaseAmount > 0 ? Math.min(itemAmount / totalBaseAmount, 1) : 0;

        const paidAmount =
          requestPaidAmount > 0
            ? Math.min(itemAmount, requestPaidAmount * ratio)
            : 0;

        const salesTax = getItemSalesTax(item, invoice) * ratio;
        const totalBeforeTax = Math.max(paidAmount - salesTax, 0);
        const remainingBalance = Math.max(itemAmount - paidAmount, 0);
        const purpose = getPaymentPurpose(invoice, item);

        rows.push({
          id: `${invoice?.id || invoice?.requestId || "request"}-${index}`,
          requestId: String(invoice?.requestId || "-"),
          vendorName,
          projectName,
          requestType,
          type: "Bill Payment",
          purpose,
          billNo,
          chequeNumber,
          paidAmount,
          totalRequestAmount: itemAmount,
          salesTax,
          totalBeforeTax,
          remainingBalance,
          paymentDate,
          requestDate,
          paymentStatus: getPaymentStatus(
            invoice,
            paidAmount,
            remainingBalance,
          ),
          company: meta.company,
          billingAddress: meta.billingAddress,
          achInfo: meta.achInfo,
          notes: meta.notes,
        });
      });

      return;
    }

    const vendorName = invoiceVendorName || "Unknown Vendor";
    const paidAmount = requestPaidAmount;
    const salesTax = getItemSalesTax({}, invoice);
    const totalBeforeTax = Math.max(paidAmount - salesTax, 0);
    const remainingBalance = Math.max(requestTotalAmount - paidAmount, 0);
    const purpose = getPaymentPurpose(invoice);

    rows.push({
      id: `${invoice?.id || invoice?.requestId || vendorName}-single`,
      requestId: String(invoice?.requestId || "-"),
      vendorName,
      projectName,
      requestType,
      type: "Bill Payment",
      purpose,
      billNo,
      chequeNumber,
      paidAmount,
      totalRequestAmount: requestTotalAmount,
      salesTax,
      totalBeforeTax,
      remainingBalance,
      paymentDate,
      requestDate,
      paymentStatus: getPaymentStatus(invoice, paidAmount, remainingBalance),
      company: meta.company,
      billingAddress: meta.billingAddress,
      achInfo: meta.achInfo,
      notes: meta.notes,
    });
  });

  rows.push(...buildRecordVendorTransactions(records));

  return rows
    .filter((row) => row.vendorName && row.vendorName !== "Unknown Vendor")
    .sort((a, b) => {
      const nameSort = a.vendorName.localeCompare(b.vendorName);
      if (nameSort !== 0) return nameSort;

      const aTime = a.paymentDate?.getTime() || a.requestDate?.getTime() || 0;
      const bTime = b.paymentDate?.getTime() || b.requestDate?.getTime() || 0;

      return bTime - aTime;
    });
}

function isWithinDatePreset(row: VendorTransaction, preset: DatePreset) {
  if (preset === "all") return true;

  const date = row.paymentDate || row.requestDate;
  if (!date) return false;

  const now = new Date();

  if (preset === "last30") {
    const start = new Date();
    start.setDate(now.getDate() - 30);
    return date >= start && date <= now;
  }

  if (preset === "thisMonth") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return date >= start && date <= end;
  }

  const start = new Date();
  start.setFullYear(now.getFullYear() - 1);
  return date >= start && date <= now;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export default function VendorSummary() {
  const PANEL_ID = "IEDGE-SYSTEM";

  const { data: invoices = [], loading: invoicesLoading } =
    useFirestoreQuery<InvoiceRequest>(`Panels/${PANEL_ID}/invoiceRequests`);

  const [records, setRecords] = useState<FirestoreRecordData[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<FirestoreSupplierData[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchRecordsAndSuppliers = async () => {
      setRecordsLoading(true);
      setSuppliersLoading(true);

      const [recordResult, supplierResult] = await Promise.allSettled([
        getDocs(collection(db, "Panels", PANEL_ID, "Record")),
        getDocs(collection(db, "Panels", PANEL_ID, "suppliers")),
      ]);

      if (!isMounted) return;

      if (recordResult.status === "fulfilled") {
        const recordRows = recordResult.value.docs.map((document) => ({
          id: document.id,
          ...(document.data() as Omit<FirestoreRecordData, "id">),
          items: Array.isArray(document.data()?.items)
            ? (document.data().items as RecordItem[])
            : [],
        }));
        setRecords(recordRows);
      } else {
        console.error(
          "Failed to load Record data for Vendor Summary:",
          recordResult.reason,
        );
        setRecords([]);
      }

      if (supplierResult.status === "fulfilled") {
        const supplierRows = supplierResult.value.docs.map((document) => ({
          id: document.id,
          ...(document.data() as Omit<FirestoreSupplierData, "id">),
        }));
        setSuppliers(supplierRows);
      } else {
        console.error(
          "Failed to load Supplier data for Vendor Summary:",
          supplierResult.reason,
        );
        setSuppliers([]);
      }

      setRecordsLoading(false);
      setSuppliersLoading(false);
    };

    fetchRecordsAndSuppliers();

    return () => {
      isMounted = false;
    };
  }, [PANEL_ID]);

  const loading = invoicesLoading || recordsLoading || suppliersLoading;

  const [supplierSearch, setSupplierSearch] = useState("");
  const [selectedVendorName, setSelectedVendorName] = useState("");
  const [activeTab, setActiveTab] = useState<
    "transactions" | "details" | "notes"
  >("transactions");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [chequeNumberSearch, setChequeNumberSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("last12");

  // Firebase suppliers are the single source of truth for Vendor Summary.
  // Any transaction whose vendor name does not match a saved supplier is ignored.
  const supplierLookup = useMemo(() => {
    const lookup = new Map<string, FirestoreSupplierData>();

    suppliers.forEach((supplier) => {
      const supplierName = getFirstTextValue([supplier?.name]);
      const supplierKey = normalizeVendorKey(supplierName);

      if (!supplierKey) return;

      lookup.set(supplierKey, {
        ...supplier,
        name: supplierName,
      });
    });

    return lookup;
  }, [suppliers]);

  const transactions = useMemo(() => {
    const allTransactions = buildVendorTransactions(
      invoices as any[],
      records,
    );

    return allTransactions.flatMap((transaction) => {
      const supplier = supplierLookup.get(
        normalizeVendorKey(transaction.vendorName),
      );

      // Do not display invoice, PO, payment, or Record data for a vendor
      // unless that supplier exists in the Firebase suppliers collection.
      if (!supplier) return [];

      return [
        {
          ...transaction,
          // Always display the exact supplier name saved in Firebase.
          vendorName: supplier.name,
        },
      ];
    });
  }, [invoices, records, supplierLookup]);

  const filteredTransactions = useMemo(() => {
    const chequeSearch = normalizeText(chequeNumberSearch);

    return transactions.filter((transaction) => {
      const matchesType =
        typeFilter === "all" ||
        normalizeText(transaction.requestType) === typeFilter;

      const matchesCheque =
        !chequeSearch ||
        normalizeText(transaction.chequeNumber).includes(chequeSearch);

      return matchesType && matchesCheque;
    });
  }, [transactions, typeFilter, chequeNumberSearch]);

  const vendorSummaries = useMemo<VendorSummaryItem[]>(() => {
    const map = new Map<string, VendorSummaryItem>();
    const today = new Date();

    suppliers.forEach((supplier) => {
      const vendorName = getFirstTextValue([supplier?.name]);
      if (!vendorName) return;

      map.set(normalizeVendorKey(vendorName), {
        vendorName,
        paidAmount: 0,
        openingBalance: safeNumber(supplier?.openingBalance),
        openBalance: 0,
        overduePayment: 0,
        transactionCount: 0,
        company: "",
        billingAddress: getFirstTextValue([
          supplier?.address,
          [supplier?.city, supplier?.country].filter(Boolean).join(", "),
        ]),
        achInfo: getFirstTextValue([
          supplier?.paymentTerms
            ? `Payment Terms: ${supplier.paymentTerms}`
            : "",
          supplier?.ntn ? `NTN: ${supplier.ntn}` : "",
        ]),
        notes: getFirstTextValue([supplier?.notes]),
      });
    });

    filteredTransactions.forEach((transaction) => {
      const vendorKey = normalizeVendorKey(transaction.vendorName);
      const supplier = supplierLookup.get(vendorKey);
      const existing = map.get(vendorKey);

      // This guard prevents a transaction from creating a vendor summary.
      // Only suppliers already loaded from Firebase can exist in the map.
      if (!supplier || !existing) return;

      existing.paidAmount += transaction.paidAmount;
      existing.openBalance += transaction.remainingBalance;
      existing.transactionCount += 1;

      const relatedInvoice = (invoices as any[]).find(
        (invoice: any) =>
          String(invoice?.requestId || "") === transaction.requestId,
      );

      const dueDate = getDueDate(relatedInvoice);

      if (
        transaction.remainingBalance > 0 &&
        (!dueDate || dueDate.getTime() <= today.getTime())
      ) {
        existing.overduePayment += transaction.remainingBalance;
      }

      if (!existing.company && transaction.company) {
        existing.company = transaction.company;
      }

      if (!existing.billingAddress && transaction.billingAddress) {
        existing.billingAddress = transaction.billingAddress;
      }

      if (!existing.achInfo && transaction.achInfo) {
        existing.achInfo = transaction.achInfo;
      }

      if (!existing.notes && transaction.notes) {
        existing.notes = transaction.notes;
      }

      map.set(vendorKey, existing);
    });

    return Array.from(map.values()).sort((a, b) =>
      a.vendorName.localeCompare(b.vendorName),
    );
  }, [filteredTransactions, invoices, supplierLookup, suppliers]);

  const filteredVendorSummaries = useMemo(() => {
    const search = normalizeText(supplierSearch);

    return vendorSummaries.filter((vendor) => {
      if (!search) return true;

      return normalizeText(
        [
          vendor.vendorName,
          vendor.company,
          vendor.billingAddress,
          vendor.notes,
        ].join(" "),
      ).includes(search);
    });
  }, [vendorSummaries, supplierSearch]);

  useEffect(() => {
    if (selectedVendorName) {
      const exists = filteredVendorSummaries.some(
        (vendor) => vendor.vendorName === selectedVendorName,
      );

      if (exists) return;
    }

    setSelectedVendorName(filteredVendorSummaries[0]?.vendorName || "");
  }, [filteredVendorSummaries, selectedVendorName]);

  const selectedVendor =
    filteredVendorSummaries.find(
      (vendor) => vendor.vendorName === selectedVendorName,
    ) || filteredVendorSummaries[0];

  const selectedVendorKey = useMemo(() => {
    return normalizeVendorKey(selectedVendor?.vendorName);
  }, [selectedVendor?.vendorName]);

  const selectedTransactions = useMemo(() => {
    if (!selectedVendorKey) return [];

    return filteredTransactions
      .filter(
        (transaction) =>
          normalizeVendorKey(transaction.vendorName) === selectedVendorKey,
      )
      .filter((transaction) => isWithinDatePreset(transaction, datePreset))
      .sort((a, b) => {
        const aTime = a.paymentDate?.getTime() || a.requestDate?.getTime() || 0;
        const bTime = b.paymentDate?.getTime() || b.requestDate?.getTime() || 0;

        return bTime - aTime;
      });
  }, [filteredTransactions, selectedVendorKey, datePreset]);

  const selectedTransactionTotals = useMemo(() => {
    return selectedTransactions.reduce(
      (totals, transaction) => {
        totals.paidAmount += transaction.paidAmount;
        totals.remainingBalance += transaction.remainingBalance;
        return totals;
      },
      { paidAmount: 0, remainingBalance: 0 },
    );
  }, [selectedTransactions]);

  const handleDownloadVendorSummary = () => {
    if (!selectedVendor) return;

    if (selectedTransactions.length === 0) {
      window.alert(
        "No transactions are available to download for this vendor.",
      );
      return;
    }

    const headers = [
      "Vendor Name",
      "Transaction Type",
      "Payment Purpose",
      "Request Type",
      "Project Name",
      "Reference / Bill No",
      "Cheque Number",
      "Supplier Opening Balance",
      "Paid Amount",
      "Remaining Amount",
      "Payment Date",
      "Payment Status",
      "Notes",
    ];

    const rows = selectedTransactions.map((transaction) => [
      transaction.vendorName,
      transaction.type,
      transaction.purpose,
      transaction.requestType,
      transaction.projectName,
      transaction.billNo || transaction.requestId,
      transaction.chequeNumber,
      selectedVendor.openingBalance.toFixed(2),
      transaction.paidAmount.toFixed(2),
      transaction.remainingBalance.toFixed(2),
      formatDate(transaction.paymentDate || transaction.requestDate),
      transaction.paymentStatus,
      transaction.notes,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fileDate = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `${sanitizeFileName(
      selectedVendor.vendorName,
    )}-vendor-summary-${fileDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handlePrintVendorSummary = () => {
    if (!selectedVendor) return;

    if (selectedTransactions.length === 0) {
      window.alert("No transactions are available to print for this vendor.");
      return;
    }

    const printWindow = window.open(
      "",
      "_blank",
      "width=1200,height=850,scrollbars=yes,resizable=yes",
    );

    if (!printWindow) {
      window.alert(
        "The print window was blocked. Please allow pop-ups and try again.",
      );
      return;
    }

    const transactionRows = selectedTransactions
      .map(
        (transaction, index) => `
          <tr>
            <td class="number-cell">${index + 1}</td>
            <td>
              <strong>${escapeHtml(transaction.type)}</strong>
              <span class="secondary">${escapeHtml(
                transaction.billNo || transaction.requestId || "-",
              )}</span>
            </td>
            <td>${escapeHtml(transaction.purpose || "-")}</td>
            <td>${escapeHtml(transaction.requestType)}</td>
            <td>${escapeHtml(transaction.projectName || "-")}</td>
            <td>${escapeHtml(transaction.chequeNumber || "-")}</td>
            <td class="amount-cell">${escapeHtml(
              formatCurrency(transaction.paidAmount),
            )}</td>
            <td class="amount-cell">${escapeHtml(
              formatCurrency(transaction.remainingBalance),
            )}</td>
            <td>${escapeHtml(
              formatDate(transaction.paymentDate || transaction.requestDate),
            )}</td>
            <td>
              <span class="status status-${escapeHtml(
                normalizeText(transaction.paymentStatus).replace(/\s+/g, "-"),
              )}">
                ${escapeHtml(transaction.paymentStatus)}
              </span>
            </td>
          </tr>
        `,
      )
      .join("");

    const generatedAt = new Date().toLocaleString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const printDocument = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${escapeHtml(selectedVendor.vendorName)} - Vendor Summary</title>
          <style>
            :root {
              --ink: #0f172a;
              --muted: #64748b;
              --border: #e2e8f0;
              --surface: #f8fafc;
              --accent: #059669;
              --accent-soft: #ecfdf5;
            }

            * { box-sizing: border-box; }

            html, body {
              margin: 0;
              padding: 0;
              color: var(--ink);
              background: white;
              font-family: Inter, "Segoe UI", Arial, sans-serif;
              font-size: 12px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            body { padding: 24px; }

            .document {
              width: 100%;
              max-width: 1120px;
              margin: 0 auto;
              border: 1px solid var(--border);
              border-radius: 18px;
              overflow: hidden;
            }

            .header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 30px;
              padding: 28px 32px;
              background: #0f172a;
              color: white;
            }

            .eyebrow {
              margin: 0 0 8px;
              color: #6ee7b7;
              font-size: 10px;
              font-weight: 800;
              letter-spacing: .18em;
              text-transform: uppercase;
            }

            h1 {
              margin: 0;
              font-size: 28px;
              line-height: 1.15;
            }

            .subtitle {
              margin: 8px 0 0;
              color: #cbd5e1;
              font-size: 11px;
            }

            .brand {
              text-align: right;
              white-space: nowrap;
            }

            .brand strong {
              display: block;
              font-size: 16px;
              letter-spacing: .05em;
            }

            .brand span {
              display: block;
              margin-top: 5px;
              color: #94a3b8;
              font-size: 9px;
              letter-spacing: .12em;
              text-transform: uppercase;
            }

            .content { padding: 26px 32px 32px; }

            .summary-grid {
              display: grid;
              grid-template-columns: repeat(5, minmax(0, 1fr));
              gap: 12px;
              margin-bottom: 24px;
            }

            .summary-card {
              padding: 15px;
              border: 1px solid var(--border);
              border-radius: 12px;
              background: var(--surface);
            }

            .summary-card span {
              display: block;
              color: var(--muted);
              font-size: 9px;
              font-weight: 700;
              letter-spacing: .05em;
              text-transform: uppercase;
            }

            .summary-card strong {
              display: block;
              margin-top: 7px;
              font-size: 15px;
            }

            .summary-card.accent {
              border-color: #a7f3d0;
              background: var(--accent-soft);
            }

            .summary-card.accent strong { color: #047857; }

            .section-title {
              margin: 0 0 11px;
              font-size: 14px;
            }

            .table-wrap {
              overflow: hidden;
              border: 1px solid var(--border);
              border-radius: 12px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            thead { background: var(--surface); }

            th {
              padding: 11px 10px;
              color: #475569;
              font-size: 8px;
              font-weight: 800;
              letter-spacing: .06em;
              text-align: left;
              text-transform: uppercase;
            }

            td {
              padding: 12px 10px;
              border-top: 1px solid var(--border);
              vertical-align: top;
            }

            .number-cell {
              width: 38px;
              color: var(--muted);
              text-align: center;
            }

            .amount-cell {
              font-weight: 700;
              text-align: right;
              white-space: nowrap;
            }

            .secondary {
              display: block;
              margin-top: 3px;
              color: var(--muted);
              font-size: 9px;
            }

            .status {
              display: inline-flex;
              padding: 4px 8px;
              border: 1px solid var(--border);
              border-radius: 999px;
              background: var(--surface);
              font-size: 9px;
              font-weight: 700;
              white-space: nowrap;
            }

            .status-paid {
              border-color: #a7f3d0;
              background: #ecfdf5;
              color: #047857;
            }

            .status-partially-paid {
              border-color: #bfdbfe;
              background: #eff6ff;
              color: #1d4ed8;
            }

            .status-pending {
              border-color: #fde68a;
              background: #fffbeb;
              color: #b45309;
            }

            .footer {
              display: flex;
              justify-content: space-between;
              gap: 16px;
              margin-top: 22px;
              padding-top: 15px;
              border-top: 1px solid var(--border);
              color: var(--muted);
              font-size: 9px;
            }

            @page { size: A4 landscape; margin: 9mm; }

            @media print {
              body { padding: 0; }
              .document { max-width: none; border: none; border-radius: 0; }
              thead { display: table-header-group; }
              tr, .summary-card { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <main class="document">
            <header class="header">
              <div>
                <p class="eyebrow">Vendor Payment Statement</p>
                <h1>${escapeHtml(selectedVendor.vendorName)}</h1>
                <p class="subtitle">
                  Filtered transaction history from Invoice Requests and Records.
                </p>
              </div>
              <div class="brand">
                <strong>IEDGE SYSTEM</strong>
                <span>Financial Records Management</span>
              </div>
            </header>

            <div class="content">
              <section class="summary-grid">
                <div class="summary-card">
                  <span>Opening Balance</span>
                  <strong>${escapeHtml(
                    formatCurrency(selectedVendor.openingBalance),
                  )}</strong>
                </div>
                <div class="summary-card accent">
                  <span>Total Amount Paid</span>
                  <strong>${escapeHtml(
                    formatCurrency(selectedTransactionTotals.paidAmount),
                  )}</strong>
                </div>
                <div class="summary-card">
                  <span>Remaining Amount</span>
                  <strong>${escapeHtml(
                    formatCurrency(selectedTransactionTotals.remainingBalance),
                  )}</strong>
                </div>
                <div class="summary-card">
                  <span>Transactions Shown</span>
                  <strong>${selectedTransactions.length}</strong>
                </div>
                <div class="summary-card">
                  <span>Date Filter</span>
                  <strong>${escapeHtml(
                    datePreset === "last12"
                      ? "Last 12 months"
                      : datePreset === "last30"
                        ? "Last 30 days"
                        : datePreset === "thisMonth"
                          ? "This month"
                          : "All dates",
                  )}</strong>
                </div>
              </section>

              <h2 class="section-title">Transaction Details</h2>

              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Transaction</th>
                      <th>Purpose</th>
                      <th>Type</th>
                      <th>Project</th>
                      <th>Cheque Number</th>
                      <th style="text-align:right">Paid</th>
                      <th style="text-align:right">Remaining</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>${transactionRows}</tbody>
                </table>
              </div>

              <footer class="footer">
                <span>Generated ${escapeHtml(generatedAt)}</span>
                <span>IEDGE SYSTEM · Internal Financial Document</span>
              </footer>
            </div>
          </main>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printDocument);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      window.setTimeout(() => printWindow.print(), 250);
    };
  };

  const dashboardStats = useMemo(() => {
    if (!selectedVendor) {
      return {
        totalPaid: 0,
        totalOpeningBalance: 0,
        totalRemaining: 0,
        totalOverdue: 0,
        totalTransactions: 0,
      };
    }

    return {
      totalPaid: selectedVendor.paidAmount,
      totalOpeningBalance: selectedVendor.openingBalance,
      totalRemaining: selectedVendor.openBalance,
      totalOverdue: selectedVendor.overduePayment,
      totalTransactions: selectedTransactions.length,
    };
  }, [selectedVendor, selectedTransactions]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-3xl border border-slate-200 bg-white px-8 py-7 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
          <p className="mt-4 text-sm font-medium text-slate-700">
            Loading vendor payments, records, and suppliers...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900 lg:p-6">
      <div className="mx-auto flex h-[calc(100vh-48px)]  gap-5 overflow-hidden">
        <aside className="flex w-[320px] shrink-0 flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Vendors
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                  Payment History
                </h2>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className="relative mt-5">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={supplierSearch}
                onChange={(event) => setSupplierSearch(event.target.value)}
                placeholder="Search vendor..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-50"
              />
            </div>

            <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-white">
              <p className="text-xs text-slate-300">Total Paid</p>
              <p className="mt-1 text-lg font-bold">
                {formatCurrency(dashboardStats.totalPaid)}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
                <span>Selected vendor only</span>
                <span>{dashboardStats.totalTransactions} transactions</span>
              </div>
              <div className="mt-3 border-t border-white/10 pt-3">
                <p className="text-xs text-slate-400">Total Opening Balance</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {formatCurrency(dashboardStats.totalOpeningBalance)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {filteredVendorSummaries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
                <p className="text-sm font-medium text-slate-700">
                  No vendors found
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Try changing your search or filter.
                </p>
              </div>
            ) : (
              filteredVendorSummaries.map((vendor) => {
                const isActive =
                  vendor.vendorName === selectedVendor?.vendorName;

                return (
                  <button
                    key={vendor.vendorName}
                    onClick={() => {
                      setSelectedVendorName(vendor.vendorName);
                      setActiveTab("transactions");
                    }}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isActive
                        ? "border-emerald-200 bg-emerald-50 shadow-sm"
                        : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${
                          isActive
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {getInitials(vendor.vendorName) || "V"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {vendor.vendorName}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {vendor.company || "No company added"}
                        </p>

                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <div>
                            <p className="text-[11px] text-slate-400">Opening</p>
                            <p className="truncate text-xs font-semibold text-slate-700">
                              {formatCurrency(vendor.openingBalance)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-400">Paid</p>
                            <p className="truncate text-xs font-semibold text-slate-700">
                              {formatCurrency(vendor.paidAmount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-400">
                              Remaining
                            </p>
                            <p className="truncate text-xs font-semibold text-slate-700">
                              {formatCurrency(vendor.openBalance)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto rounded-[28px] border border-slate-200 bg-white shadow-sm">
          {!selectedVendor ? (
            <div className="flex h-full items-center justify-center p-10">
              <div className="max-w-md text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
                  <Wallet className="h-7 w-7" />
                </div>
                <h2 className="mt-5 text-xl font-bold text-slate-950">
                  No vendor payment records found
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Only suppliers saved in Firebase will appear here. Matching
                  transactions are loaded from Invoice Requests and Records.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-5 lg:p-7">
              <div className="rounded-[28px] bg-slate-950 p-6 text-white lg:p-7">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                      Vendor Summary
                    </p>
                    <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight lg:text-4xl">
                      {selectedVendor.vendorName}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                      Complete payment history with cheque number, project
                      details, payment status, and remaining balance.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadVendorSummary}
                      className="flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={selectedTransactions.length === 0}
                      title="Download filtered vendor transactions as CSV"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>

                    <button
                      type="button"
                      onClick={handlePrintVendorSummary}
                      className="flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={selectedTransactions.length === 0}
                      title="Print the filtered vendor statement"
                    >
                      <Printer className="h-4 w-4" />
                      Print
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_340px]">
                <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Vendor Details
                      </p>
                      <h2 className="mt-1 text-lg font-bold text-slate-950">
                        Profile Information
                      </h2>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                      <Building2 className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-medium text-slate-400">
                        Company
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-800">
                        {selectedVendor.company || "-"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-medium text-slate-400">
                        Billing Address
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-800">
                        {selectedVendor.billingAddress || "-"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-medium text-slate-400">
                        Bill Pay ACH Info
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-800">
                        {selectedVendor.achInfo || "-"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-medium text-slate-400">
                        Opening Balance
                      </p>
                      <p className="mt-2 text-sm font-bold text-slate-900">
                        {formatCurrency(selectedVendor.openingBalance)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-medium text-slate-400">
                        Total Amount Paid
                      </p>
                      <p className="mt-2 text-sm font-bold text-emerald-700">
                        {formatCurrency(selectedVendor.paidAmount)}
                      </p>
                    </div>
                  </div>
                </section>

                <aside className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Balance Overview
                  </p>

                  <div className="mt-5 space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-medium text-slate-600">
                        Opening Balance
                      </p>
                      <p className="mt-2 text-xl font-bold text-slate-900">
                        {formatCurrency(selectedVendor.openingBalance)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                      <p className="text-xs font-medium text-emerald-700">
                        Total Amount Paid
                      </p>
                      <p className="mt-2 text-xl font-bold text-emerald-900">
                        {formatCurrency(selectedVendor.paidAmount)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                      <p className="text-xs font-medium text-amber-700">
                        Remaining Amount
                      </p>
                      <p className="mt-2 text-xl font-bold text-amber-900">
                        {formatCurrency(selectedVendor.openBalance)}
                      </p>
                    </div>
                  </div>
                </aside>
              </div>

              <div className="mt-5 rounded-[24px] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: "transactions", label: "Transaction List" },
                        { key: "details", label: "Supplier Details" },
                        { key: "notes", label: "Notes" },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() =>
                            setActiveTab(
                              tab.key as "transactions" | "details" | "notes",
                            )
                          }
                          className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                            activeTab === tab.key
                              ? "bg-slate-950 text-white shadow-sm"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {activeTab === "transactions" && (
                      <div className="flex flex-wrap items-center gap-3">
                        <select
                          value={typeFilter}
                          onChange={(event) =>
                            setTypeFilter(event.target.value as TypeFilter)
                          }
                          className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
                        >
                          <option value="all">All Types</option>
                          <option value="general">General</option>
                          <option value="project">Project</option>
                        </select>

                        <input
                          value={chequeNumberSearch}
                          onChange={(event) =>
                            setChequeNumberSearch(event.target.value)
                          }
                          placeholder="Search cheque no..."
                          className="h-11 w-[190px] rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
                        />

                        <select
                          value={datePreset}
                          onChange={(event) =>
                            setDatePreset(event.target.value as DatePreset)
                          }
                          className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
                        >
                          <option value="last12">Last 12 months</option>
                          <option value="last30">Last 30 days</option>
                          <option value="thisMonth">This month</option>
                          <option value="all">All dates</option>
                        </select>

                        <button className="flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
                          <SlidersHorizontal className="h-4 w-4" />
                          Filter
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {activeTab === "transactions" && (
                  <div className="p-4">
                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[1540px] border-collapse">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                Vendor Name
                              </th>
                              <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                Type
                              </th>
                              <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                Payment Purpose
                              </th>
                              <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                Project Name
                              </th>
                              <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                Cheque Number
                              </th>
                              <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                                Total Amount Paid
                              </th>
                              <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                                Remaining Amount
                              </th>
                              <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                Payment Date
                              </th>
                              <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                                Payment Status
                              </th>
                              <th className="w-12 px-4 py-4 text-center">
                                <Paperclip className="mx-auto h-4 w-4 text-slate-400" />
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100 bg-white">
                            {selectedTransactions.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={10}
                                  className="px-4 py-14 text-center"
                                >
                                  <div className="mx-auto max-w-sm">
                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
                                      <FileText className="h-6 w-6" />
                                    </div>
                                    <p className="mt-4 text-sm font-semibold text-slate-700">
                                      No transactions found
                                    </p>
                                    <p className="mt-1 text-sm text-slate-400">
                                      Try adjusting your type, cheque number, or
                                      date filter.
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              selectedTransactions.map((transaction) => (
                                <tr
                                  key={transaction.id}
                                  className="transition hover:bg-slate-50"
                                >
                                  <td className="px-4 py-4">
                                    <div className="text-sm font-bold text-slate-900">
                                      {transaction.vendorName}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-400">
                                      {transaction.type}:{" "}
                                      {transaction.billNo ||
                                        transaction.requestId ||
                                        "-"}
                                    </div>
                                  </td>

                                  <td className="px-4 py-4">
                                    <Badge
                                      variant="outline"
                                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getTypeBadgeClass(
                                        transaction.requestType,
                                      )}`}
                                    >
                                      {transaction.requestType}
                                    </Badge>
                                  </td>

                                  <td className="max-w-[320px] px-4 py-4 text-sm text-slate-700">
                                    <p className="line-clamp-3 leading-5">
                                      {transaction.purpose || "-"}
                                    </p>
                                  </td>

                                  <td className="px-4 py-4 text-sm font-medium text-slate-700">
                                    {transaction.projectName}
                                  </td>

                                  <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-800">
                                    {transaction.chequeNumber || "-"}
                                  </td>

                                  <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-bold text-slate-900">
                                    {formatCurrency(transaction.paidAmount)}
                                  </td>

                                  <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-bold text-slate-900">
                                    {formatCurrency(
                                      transaction.remainingBalance,
                                    )}
                                  </td>

                                  <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-slate-700">
                                    {formatDate(transaction.paymentDate)}
                                  </td>

                                  <td className="px-4 py-4 text-center">
                                    <Badge
                                      variant="outline"
                                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                                        transaction.paymentStatus,
                                      )}`}
                                    >
                                      {transaction.paymentStatus}
                                    </Badge>
                                  </td>

                                  <td className="px-4 py-4 text-center text-slate-300">
                                    -
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "details" && (
                  <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-5">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Supplier Name
                      </p>
                      <p className="mt-2 text-sm font-bold text-slate-900">
                        {selectedVendor.vendorName}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Opening Balance
                      </p>
                      <p className="mt-2 text-sm font-bold text-slate-900">
                        {formatCurrency(selectedVendor.openingBalance)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Total Amount Paid
                      </p>
                      <p className="mt-2 text-sm font-bold text-emerald-700">
                        {formatCurrency(selectedVendor.paidAmount)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Remaining Amount
                      </p>
                      <p className="mt-2 text-sm font-bold text-amber-700">
                        {formatCurrency(selectedVendor.openBalance)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Company
                      </p>
                      <p className="mt-2 text-sm font-bold text-slate-900">
                        {selectedVendor.company || "-"}
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "notes" && (
                  <div className="p-5">
                    <div className="max-w-3xl rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Notes
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-700">
                        {selectedVendor.notes ||
                          "No notes available for this supplier."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}