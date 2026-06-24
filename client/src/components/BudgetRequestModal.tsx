// import {
//   useState,
//   useEffect,
//   useRef,
//   type FormEvent,
//   type TextareaHTMLAttributes,
// } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import { Trash2, CalendarIcon } from "lucide-react";
// import {
//   collection,
//   addDoc,
//   serverTimestamp,
//   doc,
//   updateDoc,
//   runTransaction,
//   getDocs,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { useToast } from "@/hooks/use-toast";
// import { Calendar } from "@/components/ui/calendar";
// import {
//   Popover,
//   PopoverTrigger,
//   PopoverContent,
// } from "@/components/ui/popover";
// import { format } from "date-fns";

// const PANEL_ID = "IEDGE-SYSTEM";

// type InvoiceType = "general" | "project";

// type LineItem = {
//   id: number;
//   date: string;
//   service: string;
//   description: string;
//   vendor: string;
//   units: string;
//   unitRate: string;
//   total: number;
//   comment: string;
// };

// type AutoResizeTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
//   minHeight?: number;
//   maxHeight?: number;
//   minWidthCh?: number;
//   maxWidthCh?: number;
// };

// function getAutoWidth(value: any, minWidthCh = 10, maxWidthCh = 45) {
//   const text = String(value || "");
//   const longestLine = text
//     .split("\n")
//     .reduce((longest, line) => Math.max(longest, line.length), 0);

//   return `${Math.min(Math.max(longestLine + 2, minWidthCh), maxWidthCh)}ch`;
// }

// function AutoResizeTextarea({
//   value,
//   onChange,
//   className = "",
//   minHeight = 36,
//   maxHeight = 140,
//   minWidthCh = 10,
//   maxWidthCh = 45,
//   style,
//   ...props
// }: AutoResizeTextareaProps) {
//   const textareaRef = useRef<HTMLTextAreaElement | null>(null);

//   function resizeTextarea() {
//     const el = textareaRef.current;
//     if (!el) return;

//     el.style.height = "auto";

//     const nextHeight = Math.min(
//       Math.max(el.scrollHeight, minHeight),
//       maxHeight,
//     );

//     el.style.height = `${nextHeight}px`;
//     el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
//   }

//   useEffect(() => {
//     resizeTextarea();
//   }, [value]);

//   return (
//     <Textarea
//       ref={textareaRef}
//       value={value}
//       rows={1}
//       onChange={(e) => {
//         onChange?.(e);
//         requestAnimationFrame(resizeTextarea);
//       }}
//       className={`resize-none overflow-hidden text-sm leading-5 ${className}`}
//       style={{
//         minHeight,
//         width: getAutoWidth(value, minWidthCh, maxWidthCh),
//         ...style,
//       }}
//       {...props}
//     />
//   );
// }

// function sanitizeDecimalInput(value: string) {
//   let cleanValue = value.replace(/[^\d.]/g, "");

//   const parts = cleanValue.split(".");
//   if (parts.length > 2) {
//     cleanValue = `${parts[0]}.${parts.slice(1).join("")}`;
//   }

//   return cleanValue;
// }

// function getRoleLabel(role: string) {
//   const normalizedRole = String(role || "").trim();

//   const roleLabels: Record<string, string> = {
//     admin: "Admin",
//     main_admin: "Admin",
//     finance_admin: "Finance Admin",
//     financial_admin: "Finance Admin",
//     finance: "Finance",
//     operation: "Operation",
//     operational_admin: "Operation Admin",
//     creative: "Creative",
//     sales: "Sales",
//   };

//   return (
//     roleLabels[normalizedRole] ||
//     normalizedRole
//       .replace(/_/g, " ")
//       .replace(/\b\w/g, (letter) => letter.toUpperCase())
//   );
// }

// function canRoleCreateBudgetRequest(role: string) {
//   const blockedRoles = [
//     "admin",
//     "main_admin",
//     "finance_admin",
//     "financial_admin",
//   ];
//   return !!role && !blockedRoles.includes(role);
// }

// export default function InvoiceRequestModal({
//   isOpen,
//   onClose,
//   onSuccess,
//   editingInvoice = null,
// }: any) {
//   const { userProfile } = useAuth();
//   const { toast } = useToast();

//   const currentUserRole = String(userProfile?.role || "");
//   const canSubmitBudgetRequest = canRoleCreateBudgetRequest(currentUserRole);

//   const [loading, setLoading] = useState(false);
//   const [invoiceType, setInvoiceType] = useState<InvoiceType>("general");

//   const [estimates, setEstimates] = useState<any[]>([]);
//   const [suppliers, setSuppliers] = useState<any[]>([]);
//   const [selectedEstimateId, setSelectedEstimateId] = useState("");
//   const [selectedEstimateInput, setSelectedEstimateInput] = useState("");
//   const [subject, setSubject] = useState("");
//   const [message, setMessage] = useState("");

//   const [formData, setFormData] = useState({
//     requestId: "",
//     clientName: "",
//     project: "",
//     projectCode: "",
//     title: "",
//     comment: "",
//   });

//   const [lineItems, setLineItems] = useState<LineItem[]>([
//     {
//       id: 1,
//       date: "",
//       service: "",
//       description: "",
//       vendor: "",
//       units: "",
//       unitRate: "",
//       total: 0,
//       comment: "",
//     },
//   ]);

//   function getEmptyLineItem(id = 1): LineItem {
//     return {
//       id,
//       date: "",
//       service: "",
//       description: "",
//       vendor: "",
//       units: "",
//       unitRate: "",
//       total: 0,
//       comment: "",
//     };
//   }

//   function resetForm() {
//     setInvoiceType("general");
//     setSelectedEstimateId("");
//     setSelectedEstimateInput("");
//     setSubject("");
//     setMessage("");
//     setFormData({
//       requestId: "",
//       clientName: "",
//       project: "",
//       projectCode: "",
//       title: "",
//       comment: "",
//     });
//     setLineItems([getEmptyLineItem(1)]);
//   }

//   function getSupplierDisplayName(supplier: any) {
//     return (
//       supplier?.supplierName ||
//       supplier?.vendorName ||
//       supplier?.name ||
//       supplier?.companyName ||
//       supplier?.businessName ||
//       supplier?.title ||
//       ""
//     );
//   }

//   function getEstimateProjectCode(estimate: any) {
//     return (
//       estimate?.projectCode ||
//       estimate?.projectcode ||
//       estimate?.project_code ||
//       estimate?.code ||
//       ""
//     );
//   }

//   function getEstimateTitle(estimate: any) {
//     return estimate?.subject || estimate?.title || "";
//   }

//   function getEstimateClientName(estimate: any) {
//     return estimate?.client || estimate?.clientName || "";
//   }

//   function getEstimateProjectName(estimate: any) {
//     return (
//       estimate?.projectOwner || estimate?.project || estimate?.projectName || ""
//     );
//   }

//   function getEstimateDisplayNo(estimate: any) {
//     return (
//       estimate?.estimateNo || estimate?.estimateNumber || estimate?.id || ""
//     );
//   }

//   useEffect(() => {
//     if (!isOpen || editingInvoice) return;
//     resetForm();
//   }, [isOpen, editingInvoice]);

//   /* ===================== FETCH SUPPLIERS ===================== */
//   useEffect(() => {
//     if (!isOpen) return;

//     const fetchSuppliers = async () => {
//       try {
//         const snap = await getDocs(
//           collection(db, "Panels", PANEL_ID, "suppliers"),
//         );

//         const data = snap.docs
//           .map((d) => ({
//             id: d.id,
//             ...d.data(),
//           }))
//           .sort((a, b) =>
//             getSupplierDisplayName(a).localeCompare(getSupplierDisplayName(b)),
//           );

//         setSuppliers(data);
//       } catch (error) {
//         console.error("Failed to fetch suppliers:", error);
//       }
//     };

//     fetchSuppliers();
//   }, [isOpen]);

//   /* ===================== FETCH ESTIMATES ===================== */
//   useEffect(() => {
//     if (!isOpen || invoiceType !== "project") return;

//     const fetchEstimates = async () => {
//       try {
//         const snap = await getDocs(
//           collection(db, "Panels", PANEL_ID, "estimates"),
//         );

//         setEstimates(
//           snap.docs.map((d) => ({
//             id: d.id,
//             ...d.data(),
//           })),
//         );
//       } catch (error) {
//         console.error("Failed to fetch estimates:", error);
//       }
//     };

//     fetchEstimates();
//   }, [isOpen, invoiceType]);

//   /* ===================== RESET WHEN GENERAL ===================== */
//   useEffect(() => {
//     if (invoiceType === "general") {
//       setSelectedEstimateId("");
//       setSelectedEstimateInput("");
//       setFormData((prev) => ({
//         ...prev,
//         clientName: "",
//         project: "",
//         projectCode: "",
//       }));
//     }
//   }, [invoiceType]);

//   /* ===================== KEEP INPUT DISPLAY IN SYNC ===================== */
//   useEffect(() => {
//     if (!selectedEstimateId || !estimates.length) return;

//     const matchedEstimate = estimates.find((e) => e.id === selectedEstimateId);
//     if (matchedEstimate) {
//       setSelectedEstimateInput(getEstimateDisplayNo(matchedEstimate));
//     }
//   }, [selectedEstimateId, estimates]);

//   /* ===================== ESTIMATE SELECT / MANUAL INPUT ===================== */
//   function handleEstimateSelect(value: string) {
//     setSelectedEstimateInput(value);

//     const normalizedValue = value.trim().toLowerCase();

//     const est = estimates.find((e) => {
//       const displayNo = getEstimateDisplayNo(e).trim().toLowerCase();
//       return e.id === value || displayNo === normalizedValue;
//     });

//     if (!est) {
//       setSelectedEstimateId(value);
//       setFormData((prev) => ({
//         ...prev,
//         clientName: "",
//         title: "",
//         project: "",
//         projectCode: "",
//       }));
//       return;
//     }

//     setSelectedEstimateId(est.id);

//     setFormData((prev) => ({
//       ...prev,
//       clientName: getEstimateClientName(est),
//       title: getEstimateTitle(est),
//       project: getEstimateProjectName(est),
//       projectCode: getEstimateProjectCode(est),
//     }));
//   }

//   /* ===================== LINE ITEM LOGIC ===================== */
//   function updateLineItem(id: number, field: keyof LineItem, value: string) {
//     setLineItems((prev) =>
//       prev.map((item) => {
//         if (item.id !== id) return item;

//         const updated = { ...item, [field]: value };

//         const units =
//           updated.units === "" || updated.units === "."
//             ? 0
//             : parseFloat(updated.units);

//         const rate =
//           updated.unitRate === "" || updated.unitRate === "."
//             ? 0
//             : parseFloat(updated.unitRate);

//         updated.total = (units || 0) * (rate || 0);

//         return updated;
//       }),
//     );
//   }

//   function addLineItem() {
//     setLineItems((prev) => {
//       const nextId =
//         prev.length > 0 ? Math.max(...prev.map((item) => item.id || 0)) + 1 : 1;

//       return [...prev, getEmptyLineItem(nextId)];
//     });
//   }

//   function removeLineItem(id: number) {
//     if (lineItems.length > 1) {
//       setLineItems((prev) => prev.filter((i) => i.id !== id));
//     }
//   }

//   function normalizeLineItemsForSave(items: any[]): LineItem[] {
//     return items.map((item, index) => ({
//       id: item.id || index + 1,
//       date: item.date || "",
//       service: item.service || "",
//       description: item.description || "",
//       vendor: item.vendor || "",
//       units: item.units || "",
//       unitRate: item.unitRate || "",
//       total: Number(item.total || 0),
//       comment: item.comment || "",
//     }));
//   }

//   const totalAmount = lineItems.reduce(
//     (sum, item) => sum + Number(item.total || 0),
//     0,
//   );

//   /* ===================== SUBMIT ===================== */
//   async function handleSubmit(e: FormEvent<HTMLFormElement>) {
//     e.preventDefault();

//     if (!userProfile || !canSubmitBudgetRequest) {
//       toast({
//         title: "Permission denied",
//         description: "Admin and Finance Admin cannot create Budget Requests.",
//         variant: "destructive",
//       });
//       return;
//     }

//     try {
//       setLoading(true);

//       const lineItemsForSave = normalizeLineItemsForSave(lineItems);
//       const submittedBy =
//         userProfile.id || (userProfile as any).uid || userProfile.email || "";
//       const submittedByName =
//         userProfile.displayName ||
//         (userProfile as any).name ||
//         userProfile.email ||
//         "";

//       if (!editingInvoice) {
//         const requestId = await generateRequestId();

//         await addDoc(collection(db, "Panels", PANEL_ID, "invoiceRequests"), {
//           requestId,
//           invoiceType,
//           estimateId: selectedEstimateId || "",
//           estimateNumber:
//             invoiceType === "project" ? selectedEstimateInput : "",
//           clientName: invoiceType === "project" ? formData.clientName : "",
//           project: invoiceType === "project" ? formData.project : "",
//           projectName: invoiceType === "project" ? formData.project : "",
//           projectCode: invoiceType === "project" ? formData.projectCode : "",
//           title: formData.title,
//           lineItems: lineItemsForSave,
//           items: lineItemsForSave,
//           totalAmount,
//           subject,
//           message,

//           // New approval flow: User -> Admin -> Finance
//           status: "pending_main_admin",
//           currentApprover: "main_admin",

//           // Return-to-role support
//           returnedToRole: "",
//           returnedToRoleLabel: "",
//           returnedToCreator: false,
//           needsCreatorRevision: false,

//           submittedAt: serverTimestamp(),
//           editDate: null,
//           submittedBy,
//           createdBy: submittedBy,
//           submittedByRole: currentUserRole,
//           submittedByRoleLabel: getRoleLabel(currentUserRole),
//           submittedByName,
//           createdByName: submittedByName,
//           updatedAt: serverTimestamp(),
//         });

//         toast({ title: "Budget request submitted" });
//       } else {
//         await updateDoc(
//           doc(db, "Panels", PANEL_ID, "invoiceRequests", editingInvoice.id),
//           {
//             invoiceType,
//             estimateId: selectedEstimateId || "",
//             estimateNumber:
//               invoiceType === "project" ? selectedEstimateInput : "",
//             clientName: invoiceType === "project" ? formData.clientName : "",
//             project: invoiceType === "project" ? formData.project : "",
//             projectName: invoiceType === "project" ? formData.project : "",
//             projectCode: invoiceType === "project" ? formData.projectCode : "",
//             title: formData.title,
//             lineItems: lineItemsForSave,
//             items: lineItemsForSave,
//             totalAmount,
//             subject,
//             message,

//             // Resubmit returned request back to Admin
//             status: "pending_main_admin",
//             currentApprover: "main_admin",
//             returnedToRole: "",
//             returnedToRoleLabel: "",
//             returnedToCreator: false,
//             needsCreatorRevision: false,

//             editDate: serverTimestamp(),
//             updatedAt: serverTimestamp(),
//           },
//         );

//         toast({ title: "Budget request resubmitted" });
//       }

//       onSuccess?.();
//       onClose?.();
//       window.location.reload();
//     } catch (err) {
//       console.error(err);
//       toast({
//         title: "Error",
//         description: "Failed to submit Budget Request.",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function generateRequestId() {
//     const counterRef = doc(
//       db,
//       "Panels",
//       PANEL_ID,
//       "counters",
//       "invoiceRequests",
//     );

//     return await runTransaction(db, async (transaction) => {
//       const snap = await transaction.get(counterRef);

//       let count = 1;

//       if (!snap.exists()) {
//         transaction.set(counterRef, { count: 1 });
//       } else {
//         count = (snap.data().count || 0) + 1;
//         transaction.update(counterRef, { count });
//       }

//       const year = new Date().getFullYear();
//       return `PR-${year}-${String(count).padStart(4, "0")}`;
//     });
//   }

//   /* ===================== EDIT MODE ===================== */
//   useEffect(() => {
//     if (!editingInvoice) return;

//     setInvoiceType(editingInvoice.invoiceType || "project");
//     setSelectedEstimateId(editingInvoice.estimateId || "");
//     setSelectedEstimateInput(
//       editingInvoice.estimateNumber || editingInvoice.estimateId || "",
//     );
//     setSubject(editingInvoice.subject || "");
//     setMessage(editingInvoice.message || "");

//     setFormData({
//       requestId: editingInvoice.requestId || "",
//       clientName: editingInvoice.clientName || "",
//       project: editingInvoice.project || "",
//       projectCode: editingInvoice.projectCode || "",
//       title: editingInvoice.title || "",
//       comment: editingInvoice.comment || "",
//     });

//     setLineItems(
//       editingInvoice.lineItems?.length
//         ? normalizeLineItemsForSave(editingInvoice.lineItems)
//         : [getEmptyLineItem(1)],
//     );
//   }, [editingInvoice]);

//   /* ===================== UI ===================== */
//   return (
//     <Dialog
//       open={isOpen}
//       onOpenChange={(open) => {
//         if (!open) onClose?.();
//       }}
//     >
//       <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle>
//             {editingInvoice ? "Edit Budget Request" : "New Budget Request"}
//           </DialogTitle>
//         </DialogHeader>

//         <form onSubmit={handleSubmit} className="space-y-6">
//           <div className="flex gap-2">
//             <Button
//               type="button"
//               variant={invoiceType === "general" ? "default" : "outline"}
//               onClick={() => setInvoiceType("general")}
//             >
//               General
//             </Button>

//             <Button
//               type="button"
//               variant={invoiceType === "project" ? "default" : "outline"}
//               onClick={() => setInvoiceType("project")}
//             >
//               Project
//             </Button>
//           </div>

//           {invoiceType === "general" && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <Label>Title *</Label>
//                 <Input
//                   value={formData.title}
//                   onChange={(e) =>
//                     setFormData({ ...formData, title: e.target.value })
//                   }
//                   placeholder="Enter request title"
//                   required
//                 />
//               </div>

//               <div>
//                 <Label>Subject</Label>
//                 <Input
//                   value={subject}
//                   onChange={(e) => setSubject(e.target.value)}
//                   placeholder="Enter request subject"
//                 />
//               </div>

//               <div className="md:col-span-2">
//                 <Label>Message</Label>
//                 <Textarea
//                   value={message}
//                   onChange={(e) => setMessage(e.target.value)}
//                   placeholder="Enter request message"
//                   rows={4}
//                 />
//               </div>
//             </div>
//           )}

//           {invoiceType === "project" && (
//             <div>
//               <Label>Estimate No *</Label>
//               <Input
//                 list="estimate-options"
//                 value={selectedEstimateInput}
//                 onChange={(e) => handleEstimateSelect(e.target.value)}
//                 placeholder="Select or type estimate number"
//                 required
//               />

//               <datalist id="estimate-options">
//                 {estimates.map((e) => (
//                   <option key={e.id} value={getEstimateDisplayNo(e)} />
//                 ))}
//               </datalist>
//             </div>
//           )}

//           {invoiceType === "project" && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <Label>Client Name</Label>
//                 <Input
//                   value={formData.clientName}
//                   readOnly
//                   className="bg-gray-100"
//                   placeholder="Auto-filled from estimate"
//                 />
//               </div>

//               <div>
//                 <Label>Subject</Label>
//                 <Input
//                   value={formData.title}
//                   readOnly
//                   className="bg-gray-100"
//                   placeholder="Auto-filled from estimate"
//                 />
//               </div>

//               <div>
//                 <Label>Project</Label>
//                 <Input
//                   value={formData.project}
//                   readOnly
//                   className="bg-gray-100"
//                   placeholder="Auto-filled from estimate"
//                 />
//               </div>

//               <div>
//                 <Label>Project Code *</Label>
//                 <Input
//                   value={formData.projectCode}
//                   onChange={(e) =>
//                     setFormData({ ...formData, projectCode: e.target.value })
//                   }
//                   placeholder="Auto-filled from estimate"
//                   required
//                 />
//               </div>
//             </div>
//           )}

//           <div className="border rounded-lg overflow-auto">
//             <table className="w-full text-sm border-collapse">
//               <thead className="bg-gray-100 text-gray-700">
//                 <tr className="h-12">
//                   <th className="px-2 min-w-[130px]">Date</th>
//                   <th className="px-2 min-w-[150px]">Service</th>
//                   <th className="px-2 min-w-[220px]">Description</th>
//                   <th className="px-2 min-w-[180px]">Vendor</th>
//                   <th className="px-2 w-[90px] text-center">Units</th>
//                   <th className="px-2 w-[110px] text-center">Rate</th>
//                   <th className="px-2 w-[120px] text-right">Total</th>
//                   <th className="px-2 min-w-[200px]">Comment</th>
//                   <th className="w-[50px]"></th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {lineItems.map((item) => (
//                   <tr key={item.id} className="border-t hover:bg-gray-50">
//                     <td className="px-2 py-2 align-top">
//                       <Popover>
//                         <PopoverTrigger asChild>
//                           <Button
//                             type="button"
//                             variant="outline"
//                             className="w-[180px] justify-start text-left font-normal"
//                           >
//                             <CalendarIcon className="mr-2 h-4 w-4" />
//                             {item.date
//                               ? format(new Date(item.date), "PPP")
//                               : "Pick date"}
//                           </Button>
//                         </PopoverTrigger>

//                         <PopoverContent className="w-auto p-0">
//                           <Calendar
//                             mode="single"
//                             selected={
//                               item.date ? new Date(item.date) : undefined
//                             }
//                             onSelect={(date) =>
//                               updateLineItem(
//                                 item.id,
//                                 "date",
//                                 date?.toISOString() || "",
//                               )
//                             }
//                             initialFocus
//                           />
//                         </PopoverContent>
//                       </Popover>
//                     </td>

//                     <td className="px-2 py-2 align-top">
//                       <Input
//                         className="h-9 text-sm"
//                         value={item.service}
//                         onChange={(e) =>
//                           updateLineItem(item.id, "service", e.target.value)
//                         }
//                         placeholder="Service"
//                       />
//                     </td>

//                     <td className="px-2 py-2 align-top">
//                       <AutoResizeTextarea
//                         value={item.description}
//                         minWidthCh={22}
//                         maxWidthCh={70}
//                         minHeight={36}
//                         maxHeight={160}
//                         placeholder="Enter description"
//                         onChange={(e) =>
//                           updateLineItem(item.id, "description", e.target.value)
//                         }
//                       />
//                     </td>

//                     <td className="px-2 py-2 align-top">
//                       <div>
//                         <Input
//                           list={`vendor-options-${item.id}`}
//                           className="h-9 text-sm"
//                           value={item.vendor}
//                           onChange={(e) =>
//                             updateLineItem(item.id, "vendor", e.target.value)
//                           }
//                           placeholder="Enter vendor name"
//                         />

//                         <datalist id={`vendor-options-${item.id}`}>
//                           {suppliers.map((supplier) => {
//                             const supplierName =
//                               getSupplierDisplayName(supplier);
//                             if (!supplierName) return null;

//                             return (
//                               <option key={supplier.id} value={supplierName}>
//                                 {supplierName}
//                               </option>
//                             );
//                           })}
//                         </datalist>
//                       </div>
//                     </td>

//                     <td className="px-2 py-2 align-top">
//                       <Input
//                         type="number"
//                         step="0.01"
//                         min="0"
//                         className="h-9 text-sm text-center"
//                         value={item.units}
//                         onChange={(e) =>
//                           updateLineItem(item.id, "units", e.target.value)
//                         }
//                         placeholder="0"
//                       />
//                     </td>

//                     <td className="px-2 py-2 align-top">
//                       <AutoResizeTextarea
//                         value={item.unitRate}
//                         inputMode="decimal"
//                         minWidthCh={8}
//                         maxWidthCh={18}
//                         minHeight={36}
//                         maxHeight={90}
//                         className="text-center"
//                         placeholder="0.00"
//                         onKeyDown={(e) => {
//                           if (e.key === "Enter") e.preventDefault();
//                         }}
//                         onChange={(e) =>
//                           updateLineItem(
//                             item.id,
//                             "unitRate",
//                             sanitizeDecimalInput(e.target.value),
//                           )
//                         }
//                       />
//                     </td>

//                     <td className="font-semibold text-right pr-3 align-top pt-4">
//                       {Number(item.total || 0).toFixed(2)}
//                     </td>

//                     <td className="px-2 py-2 align-top">
//                       <Input
//                         className="h-9 text-sm"
//                         value={item.comment}
//                         onChange={(e) =>
//                           updateLineItem(item.id, "comment", e.target.value)
//                         }
//                         placeholder="Comment"
//                       />
//                     </td>

//                     <td className="text-center px-2 py-2 align-top pt-4">
//                       <button
//                         type="button"
//                         onClick={() => removeLineItem(item.id)}
//                         className="text-red-600 hover:text-red-800"
//                         title="Delete row"
//                       >
//                         <Trash2 size={18} />
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           <Button type="button" onClick={addLineItem} className="mt-2">
//             + Add Service Row
//           </Button>

//           <div className="flex justify-end text-lg font-semibold mt-4">
//             Total: Rs {totalAmount.toFixed(2)}
//           </div>

//           <Button type="submit" disabled={loading}>
//             {loading
//               ? "Submitting..."
//               : editingInvoice
//                 ? "Update & Resubmit"
//                 : "Submit Request"}
//           </Button>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }

// import {
//   useEffect,
//   useRef,
//   useState,
//   type FormEvent,
//   type TextareaHTMLAttributes,
// } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import { Trash2, CalendarIcon } from "lucide-react";
// import {
//   collection,
//   addDoc,
//   serverTimestamp,
//   doc,
//   updateDoc,
//   runTransaction,
//   getDocs,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { useToast } from "@/hooks/use-toast";
// import { Calendar } from "@/components/ui/calendar";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { format } from "date-fns";

// const PANEL_ID = "IEDGE-SYSTEM";

// type InvoiceType = "general" | "project";

// type LineItem = {
//   id: number;
//   date: string;
//   service: string;
//   description: string;
//   vendor: string;
//   units: string;
//   unitRate: string;
//   total: number;
//   comment: string;
// };

// type BudgetRequestModalProps = {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess?: () => void;
//   editingInvoice?: any | null;
// };

// type AutoResizeTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
//   minHeight?: number;
//   maxHeight?: number;
//   minWidthCh?: number;
//   maxWidthCh?: number;
// };

// function parseAmount(value: any): number {
//   if (value === null || value === undefined || value === "") return 0;
//   const parsed = Number(String(value).replace(/,/g, ""));
//   return Number.isFinite(parsed) ? parsed : 0;
// }

// function formatNumberWithCommas(
//   value: any,
//   removeTrailingZeroes = false,
// ): string {
//   if (value === null || value === undefined || value === "") return "";

//   const rawValue = String(value).replace(/,/g, "").trim();
//   if (!rawValue || rawValue === ".") return rawValue;

//   const [integerPart, decimalPart] = rawValue.split(".");
//   const safeIntegerPart = integerPart || "0";
//   const formattedInteger = safeIntegerPart.replace(
//     /\B(?=(\d{3})+(?!\d))/g,
//     ",",
//   );

//   if (decimalPart !== undefined) {
//     const trimmedDecimal = removeTrailingZeroes
//       ? decimalPart.replace(/0+$/, "")
//       : decimalPart;

//     if (trimmedDecimal) return `${formattedInteger}.${trimmedDecimal}`;

//     // While typing editable fields, keep a trailing decimal point like "1,000."
//     // so the user can continue entering decimal digits naturally.
//     return removeTrailingZeroes ? formattedInteger : `${formattedInteger}.`;
//   }

//   return formattedInteger;
// }

// function formatAmount(value: any): string {
//   const amount = parseAmount(value);

//   return amount.toLocaleString("en-PK", {
//     minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
//     maximumFractionDigits: 2,
//   });
// }

// function sanitizeDecimalInput(value: string) {
//   let cleanValue = value.replace(/,/g, "").replace(/[^\d.]/g, "");

//   const parts = cleanValue.split(".");
//   if (parts.length > 2) {
//     cleanValue = `${parts[0]}.${parts.slice(1).join("")}`;
//   }

//   return cleanValue;
// }

// function getAutoWidth(value: any, minWidthCh = 10, maxWidthCh = 45) {
//   const text = String(value || "");
//   const longestLine = text
//     .split("\n")
//     .reduce((longest, line) => Math.max(longest, line.length), 0);

//   return `${Math.min(Math.max(longestLine + 2, minWidthCh), maxWidthCh)}ch`;
// }

// function AutoResizeTextarea({
//   value,
//   onChange,
//   className = "",
//   minHeight = 36,
//   maxHeight = 140,
//   minWidthCh = 10,
//   maxWidthCh = 45,
//   style,
//   ...props
// }: AutoResizeTextareaProps) {
//   const textareaRef = useRef<HTMLTextAreaElement | null>(null);

//   function resizeTextarea() {
//     const el = textareaRef.current;
//     if (!el) return;

//     el.style.height = "auto";

//     const nextHeight = Math.min(
//       Math.max(el.scrollHeight, minHeight),
//       maxHeight,
//     );

//     el.style.height = `${nextHeight}px`;
//     el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
//   }

//   useEffect(() => {
//     resizeTextarea();
//   }, [value]);

//   return (
//     <Textarea
//       ref={textareaRef}
//       value={value}
//       rows={1}
//       onChange={(e) => {
//         onChange?.(e);
//         requestAnimationFrame(resizeTextarea);
//       }}
//       className={`resize-none overflow-hidden text-sm leading-5 ${className}`}
//       style={{
//         minHeight,
//         width: getAutoWidth(value, minWidthCh, maxWidthCh),
//         ...style,
//       }}
//       {...props}
//     />
//   );
// }

// function getRoleLabel(role: string) {
//   const normalizedRole = String(role || "").trim();

//   const roleLabels: Record<string, string> = {
//     admin: "Admin",
//     main_admin: "Admin",
//     finance_admin: "Finance Admin",
//     financial_admin: "Finance Admin",
//     finance: "Finance",
//     operation: "Operation",
//     operational_admin: "Operation Admin",
//     creative: "Creative",
//     sales: "Sales",
//   };

//   return (
//     roleLabels[normalizedRole] ||
//     normalizedRole
//       .replace(/_/g, " ")
//       .replace(/\b\w/g, (letter) => letter.toUpperCase())
//   );
// }

// function canRoleCreateBudgetRequest(role: string) {
//   const blockedRoles = [
//     "admin",
//     "main_admin",
//     "finance_admin",
//     "financial_admin",
//   ];
//   return !!role && !blockedRoles.includes(role);
// }

// export default function InvoiceRequestModal({
//   isOpen,
//   onClose,
//   onSuccess,
//   editingInvoice = null,
// }: BudgetRequestModalProps) {
//   const { userProfile } = useAuth();
//   const { toast } = useToast();

//   const currentUserRole = String(userProfile?.role || "");
//   const canSubmitBudgetRequest = canRoleCreateBudgetRequest(currentUserRole);

//   const [loading, setLoading] = useState(false);
//   const [invoiceType, setInvoiceType] = useState<InvoiceType>("general");

//   const [estimates, setEstimates] = useState<any[]>([]);
//   const [suppliers, setSuppliers] = useState<any[]>([]);
//   const [selectedEstimateId, setSelectedEstimateId] = useState("");
//   const [selectedEstimateInput, setSelectedEstimateInput] = useState("");
//   const [subject, setSubject] = useState("");
//   const [message, setMessage] = useState("");

//   const [formData, setFormData] = useState({
//     requestId: "",
//     clientName: "",
//     project: "",
//     projectCode: "",
//     title: "",
//     comment: "",
//   });

//   const [lineItems, setLineItems] = useState<LineItem[]>([
//     {
//       id: 1,
//       date: "",
//       service: "",
//       description: "",
//       vendor: "",
//       units: "",
//       unitRate: "",
//       total: 0,
//       comment: "",
//     },
//   ]);

//   function getEmptyLineItem(id = 1): LineItem {
//     return {
//       id,
//       date: "",
//       service: "",
//       description: "",
//       vendor: "",
//       units: "",
//       unitRate: "",
//       total: 0,
//       comment: "",
//     };
//   }

//   function resetForm() {
//     setInvoiceType("general");
//     setSelectedEstimateId("");
//     setSelectedEstimateInput("");
//     setSubject("");
//     setMessage("");
//     setFormData({
//       requestId: "",
//       clientName: "",
//       project: "",
//       projectCode: "",
//       title: "",
//       comment: "",
//     });
//     setLineItems([getEmptyLineItem(1)]);
//   }

//   function getSupplierDisplayName(supplier: any) {
//     return (
//       supplier?.supplierName ||
//       supplier?.vendorName ||
//       supplier?.name ||
//       supplier?.companyName ||
//       supplier?.businessName ||
//       supplier?.title ||
//       ""
//     );
//   }

//   function getEstimateProjectCode(estimate: any) {
//     return (
//       estimate?.projectCode ||
//       estimate?.projectcode ||
//       estimate?.project_code ||
//       estimate?.code ||
//       ""
//     );
//   }

//   function getEstimateTitle(estimate: any) {
//     return estimate?.subject || estimate?.title || "";
//   }

//   function getEstimateClientName(estimate: any) {
//     return estimate?.client || estimate?.clientName || "";
//   }

//   function getEstimateProjectName(estimate: any) {
//     return (
//       estimate?.projectOwner || estimate?.project || estimate?.projectName || ""
//     );
//   }

//   function getEstimateDisplayNo(estimate: any) {
//     return (
//       estimate?.estimateNo || estimate?.estimateNumber || estimate?.id || ""
//     );
//   }

//   useEffect(() => {
//     if (!isOpen || editingInvoice) return;
//     resetForm();
//   }, [isOpen, editingInvoice]);

//   useEffect(() => {
//     if (!isOpen) return;

//     const fetchSuppliers = async () => {
//       try {
//         const snap = await getDocs(
//           collection(db, "Panels", PANEL_ID, "suppliers"),
//         );

//         const data = snap.docs
//           .map((d) => ({
//             id: d.id,
//             ...d.data(),
//           }))
//           .sort((a, b) =>
//             getSupplierDisplayName(a).localeCompare(getSupplierDisplayName(b)),
//           );

//         setSuppliers(data);
//       } catch (error) {
//         console.error("Failed to fetch suppliers:", error);
//       }
//     };

//     fetchSuppliers();
//   }, [isOpen]);

//   useEffect(() => {
//     if (!isOpen || invoiceType !== "project") return;

//     const fetchEstimates = async () => {
//       try {
//         const snap = await getDocs(
//           collection(db, "Panels", PANEL_ID, "estimates"),
//         );

//         setEstimates(
//           snap.docs.map((d) => ({
//             id: d.id,
//             ...d.data(),
//           })),
//         );
//       } catch (error) {
//         console.error("Failed to fetch estimates:", error);
//       }
//     };

//     fetchEstimates();
//   }, [isOpen, invoiceType]);

//   useEffect(() => {
//     if (invoiceType === "general") {
//       setSelectedEstimateId("");
//       setSelectedEstimateInput("");
//       setFormData((prev) => ({
//         ...prev,
//         clientName: "",
//         project: "",
//         projectCode: "",
//       }));
//     }
//   }, [invoiceType]);

//   useEffect(() => {
//     if (!selectedEstimateId || !estimates.length) return;

//     const matchedEstimate = estimates.find((e) => e.id === selectedEstimateId);
//     if (matchedEstimate) {
//       setSelectedEstimateInput(getEstimateDisplayNo(matchedEstimate));
//     }
//   }, [selectedEstimateId, estimates]);

//   function handleEstimateSelect(value: string) {
//     setSelectedEstimateInput(value);

//     const normalizedValue = value.trim().toLowerCase();

//     const est = estimates.find((e) => {
//       const displayNo = getEstimateDisplayNo(e).trim().toLowerCase();
//       return e.id === value || displayNo === normalizedValue;
//     });

//     if (!est) {
//       setSelectedEstimateId(value);
//       setFormData((prev) => ({
//         ...prev,
//         clientName: "",
//         title: "",
//         project: "",
//         projectCode: "",
//       }));
//       return;
//     }

//     setSelectedEstimateId(est.id);

//     setFormData((prev) => ({
//       ...prev,
//       clientName: getEstimateClientName(est),
//       title: getEstimateTitle(est),
//       project: getEstimateProjectName(est),
//       projectCode: getEstimateProjectCode(est),
//     }));
//   }

//   function updateLineItem(id: number, field: keyof LineItem, value: string) {
//     setLineItems((prev) =>
//       prev.map((item) => {
//         if (item.id !== id) return item;

//         const updated = { ...item, [field]: value };

//         const units = parseAmount(updated.units);
//         const rate = parseAmount(updated.unitRate);

//         updated.total = units * rate;

//         return updated;
//       }),
//     );
//   }

//   function addLineItem() {
//     setLineItems((prev) => {
//       const nextId =
//         prev.length > 0 ? Math.max(...prev.map((item) => item.id || 0)) + 1 : 1;

//       return [...prev, getEmptyLineItem(nextId)];
//     });
//   }

//   function removeLineItem(id: number) {
//     if (lineItems.length > 1) {
//       setLineItems((prev) => prev.filter((i) => i.id !== id));
//     }
//   }

//   function normalizeLineItemsForSave(items: any[]): LineItem[] {
//     return items.map((item, index) => ({
//       id: item.id || index + 1,
//       date: item.date || "",
//       service: item.service || "",
//       description: item.description || "",
//       vendor: item.vendor || "",
//       units: String(item.units || ""),
//       unitRate: String(parseAmount(item.unitRate) || ""),
//       total: parseAmount(item.total),
//       comment: item.comment || "",
//     }));
//   }

//   const totalAmount = lineItems.reduce(
//     (sum, item) => sum + parseAmount(item.total),
//     0,
//   );

//   async function generateRequestId() {
//     const counterRef = doc(
//       db,
//       "Panels",
//       PANEL_ID,
//       "counters",
//       "invoiceRequests",
//     );

//     return await runTransaction(db, async (transaction) => {
//       const snap = await transaction.get(counterRef);

//       let count = 1;

//       if (!snap.exists()) {
//         transaction.set(counterRef, { count: 1 });
//       } else {
//         count = (snap.data().count || 0) + 1;
//         transaction.update(counterRef, { count });
//       }

//       const year = new Date().getFullYear();
//       return `PR-${year}-${String(count).padStart(4, "0")}`;
//     });
//   }

//   async function handleSubmit(e: FormEvent<HTMLFormElement>) {
//     e.preventDefault();

//     if (!userProfile || !canSubmitBudgetRequest) {
//       toast({
//         title: "Permission denied",
//         description: "Admin and Finance Admin cannot create Budget Requests.",
//         variant: "destructive",
//       });
//       return;
//     }

//     try {
//       setLoading(true);

//       const lineItemsForSave = normalizeLineItemsForSave(lineItems);
//       const submittedBy =
//         (userProfile as any).id ||
//         (userProfile as any).uid ||
//         (userProfile as any).userId ||
//         userProfile.email ||
//         "";
//       const submittedByName =
//         userProfile.displayName ||
//         (userProfile as any).name ||
//         userProfile.email ||
//         "";

//       if (!editingInvoice) {
//         const requestId = await generateRequestId();

//         await addDoc(collection(db, "Panels", PANEL_ID, "invoiceRequests"), {
//           requestId,
//           invoiceType,
//           estimateId: selectedEstimateId || "",
//           estimateNumber:
//             invoiceType === "project" ? selectedEstimateInput : "",
//           clientName: invoiceType === "project" ? formData.clientName : "",
//           project: invoiceType === "project" ? formData.project : "",
//           projectName: invoiceType === "project" ? formData.project : "",
//           projectCode: invoiceType === "project" ? formData.projectCode : "",
//           title: formData.title,
//           lineItems: lineItemsForSave,
//           items: lineItemsForSave,
//           totalAmount,
//           subject,
//           message,

//           status: "pending_main_admin",
//           currentApprover: "main_admin",

//           returnedToRole: "",
//           returnedToRoleLabel: "",
//           returnedToCreator: false,
//           needsCreatorRevision: false,

//           submittedAt: serverTimestamp(),
//           editDate: null,
//           submittedBy,
//           createdBy: submittedBy,
//           submittedByRole: currentUserRole,
//           submittedByRoleLabel: getRoleLabel(currentUserRole),
//           submittedByName,
//           createdByName: submittedByName,
//           updatedAt: serverTimestamp(),
//         });

//         toast({ title: "Budget request submitted" });
//       } else {
//         await updateDoc(
//           doc(db, "Panels", PANEL_ID, "invoiceRequests", editingInvoice.id),
//           {
//             invoiceType,
//             estimateId: selectedEstimateId || "",
//             estimateNumber:
//               invoiceType === "project" ? selectedEstimateInput : "",
//             clientName: invoiceType === "project" ? formData.clientName : "",
//             project: invoiceType === "project" ? formData.project : "",
//             projectName: invoiceType === "project" ? formData.project : "",
//             projectCode: invoiceType === "project" ? formData.projectCode : "",
//             title: formData.title,
//             lineItems: lineItemsForSave,
//             items: lineItemsForSave,
//             totalAmount,
//             subject,
//             message,

//             status: "pending_main_admin",
//             currentApprover: "main_admin",
//             returnedToRole: "",
//             returnedToRoleLabel: "",
//             returnedToCreator: false,
//             needsCreatorRevision: false,

//             editDate: serverTimestamp(),
//             updatedAt: serverTimestamp(),
//           },
//         );

//         toast({ title: "Budget request resubmitted" });
//       }

//       onSuccess?.();
//       onClose?.();
//       resetForm();
//     } catch (err) {
//       console.error(err);
//       toast({
//         title: "Error",
//         description: "Failed to submit Budget Request.",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     if (!editingInvoice) return;

//     setInvoiceType(editingInvoice.invoiceType || "project");
//     setSelectedEstimateId(editingInvoice.estimateId || "");
//     setSelectedEstimateInput(
//       editingInvoice.estimateNumber || editingInvoice.estimateId || "",
//     );
//     setSubject(editingInvoice.subject || "");
//     setMessage(editingInvoice.message || "");

//     setFormData({
//       requestId: editingInvoice.requestId || "",
//       clientName: editingInvoice.clientName || "",
//       project: editingInvoice.project || editingInvoice.projectName || "",
//       projectCode: editingInvoice.projectCode || "",
//       title: editingInvoice.title || "",
//       comment: editingInvoice.comment || "",
//     });

//     const sourceItems = editingInvoice.lineItems?.length
//       ? editingInvoice.lineItems
//       : editingInvoice.items?.length
//         ? editingInvoice.items
//         : [];

//     setLineItems(
//       sourceItems.length
//         ? normalizeLineItemsForSave(sourceItems)
//         : [getEmptyLineItem(1)],
//     );
//   }, [editingInvoice]);

//   return (
//     <Dialog
//       open={isOpen}
//       onOpenChange={(open) => {
//         if (!open) onClose?.();
//       }}
//     >
//       <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle>
//             {editingInvoice ? "Edit Budget Request" : "New Budget Request"}
//           </DialogTitle>
//         </DialogHeader>

//         <form onSubmit={handleSubmit} className="space-y-6">
//           <div className="flex gap-2">
//             <Button
//               type="button"
//               variant={invoiceType === "general" ? "default" : "outline"}
//               onClick={() => setInvoiceType("general")}
//             >
//               General
//             </Button>

//             <Button
//               type="button"
//               variant={invoiceType === "project" ? "default" : "outline"}
//               onClick={() => setInvoiceType("project")}
//             >
//               Project
//             </Button>
//           </div>

//           {invoiceType === "general" && (
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//               <div>
//                 <Label>Title *</Label>
//                 <Input
//                   value={formData.title}
//                   onChange={(e) =>
//                     setFormData({ ...formData, title: e.target.value })
//                   }
//                   placeholder="Enter request title"
//                   required
//                 />
//               </div>

//               <div>
//                 <Label>Subject</Label>
//                 <Input
//                   value={subject}
//                   onChange={(e) => setSubject(e.target.value)}
//                   placeholder="Enter request subject"
//                 />
//               </div>

//               <div className="md:col-span-2">
//                 <Label>Message</Label>
//                 <Textarea
//                   value={message}
//                   onChange={(e) => setMessage(e.target.value)}
//                   placeholder="Enter request message"
//                   rows={4}
//                 />
//               </div>
//             </div>
//           )}

//           {invoiceType === "project" && (
//             <div>
//               <Label>Estimate No *</Label>
//               <Input
//                 list="estimate-options"
//                 value={selectedEstimateInput}
//                 onChange={(e) => handleEstimateSelect(e.target.value)}
//                 placeholder="Select or type estimate number"
//                 required
//               />

//               <datalist id="estimate-options">
//                 {estimates.map((e) => (
//                   <option key={e.id} value={getEstimateDisplayNo(e)} />
//                 ))}
//               </datalist>
//             </div>
//           )}

//           {invoiceType === "project" && (
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//               <div>
//                 <Label>Client Name</Label>
//                 <Input
//                   value={formData.clientName}
//                   readOnly
//                   className="bg-gray-100"
//                   placeholder="Auto-filled from estimate"
//                 />
//               </div>

//               <div>
//                 <Label>Subject</Label>
//                 <Input
//                   value={formData.title}
//                   readOnly
//                   className="bg-gray-100"
//                   placeholder="Auto-filled from estimate"
//                 />
//               </div>

//               <div>
//                 <Label>Project</Label>
//                 <Input
//                   value={formData.project}
//                   readOnly
//                   className="bg-gray-100"
//                   placeholder="Auto-filled from estimate"
//                 />
//               </div>

//               <div>
//                 <Label>Project Code *</Label>
//                 <Input
//                   value={formData.projectCode}
//                   onChange={(e) =>
//                     setFormData({ ...formData, projectCode: e.target.value })
//                   }
//                   placeholder="Auto-filled from estimate"
//                   required
//                 />
//               </div>
//             </div>
//           )}

//           <div className="overflow-auto rounded-lg border">
//             <table className="w-full border-collapse text-sm">
//               <thead className="bg-gray-100 text-gray-700">
//                 <tr className="h-12">
//                   <th className="min-w-[130px] px-2">Date</th>
//                   <th className="min-w-[150px] px-2">Service</th>
//                   <th className="min-w-[220px] px-2">Description</th>
//                   <th className="min-w-[180px] px-2">Vendor</th>
//                   <th className="w-[90px] px-2 text-center">Units</th>
//                   <th className="w-[120px] px-2 text-center">Rate</th>
//                   <th className="w-[130px] px-2 text-right">Total</th>
//                   <th className="min-w-[200px] px-2">Comment</th>
//                   <th className="w-[50px]"></th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {lineItems.map((item) => (
//                   <tr key={item.id} className="border-t hover:bg-gray-50">
//                     <td className="px-2 py-2 align-top">
//                       <Popover>
//                         <PopoverTrigger asChild>
//                           <Button
//                             type="button"
//                             variant="outline"
//                             className="w-[180px] justify-start text-left font-normal"
//                           >
//                             <CalendarIcon className="mr-2 h-4 w-4" />
//                             {item.date
//                               ? format(new Date(item.date), "PPP")
//                               : "Pick date"}
//                           </Button>
//                         </PopoverTrigger>

//                         <PopoverContent className="w-auto p-0">
//                           <Calendar
//                             mode="single"
//                             selected={
//                               item.date ? new Date(item.date) : undefined
//                             }
//                             onSelect={(date) =>
//                               updateLineItem(
//                                 item.id,
//                                 "date",
//                                 date?.toISOString() || "",
//                               )
//                             }
//                             initialFocus
//                           />
//                         </PopoverContent>
//                       </Popover>
//                     </td>

//                     <td className="px-2 py-2 align-top">
//                       <Input
//                         className="h-9 text-sm"
//                         value={item.service}
//                         onChange={(e) =>
//                           updateLineItem(item.id, "service", e.target.value)
//                         }
//                         placeholder="Service"
//                       />
//                     </td>

//                     <td className="px-2 py-2 align-top">
//                       <AutoResizeTextarea
//                         value={item.description}
//                         minWidthCh={22}
//                         maxWidthCh={70}
//                         minHeight={36}
//                         maxHeight={160}
//                         placeholder="Enter description"
//                         onChange={(e) =>
//                           updateLineItem(item.id, "description", e.target.value)
//                         }
//                       />
//                     </td>

//                     <td className="px-2 py-2 align-top">
//                       <Input
//                         list={`vendor-options-${item.id}`}
//                         className="h-9 text-sm"
//                         value={item.vendor}
//                         onChange={(e) =>
//                           updateLineItem(item.id, "vendor", e.target.value)
//                         }
//                         placeholder="Enter vendor name"
//                       />

//                       <datalist id={`vendor-options-${item.id}`}>
//                         {suppliers.map((supplier) => {
//                           const supplierName = getSupplierDisplayName(supplier);
//                           if (!supplierName) return null;

//                           return (
//                             <option key={supplier.id} value={supplierName}>
//                               {supplierName}
//                             </option>
//                           );
//                         })}
//                       </datalist>
//                     </td>

//                     <td className="px-2 py-2 align-top">
//                       <Input
//                         type="number"
//                         step="0.01"
//                         min="0"
//                         className="h-9 text-center text-sm"
//                         value={item.units}
//                         onChange={(e) =>
//                           updateLineItem(item.id, "units", e.target.value)
//                         }
//                         placeholder="0"
//                       />
//                     </td>

//                     <td className="px-2 py-2 align-top">
//                       <AutoResizeTextarea
//                         value={formatNumberWithCommas(item.unitRate)}
//                         inputMode="decimal"
//                         minWidthCh={8}
//                         maxWidthCh={18}
//                         minHeight={36}
//                         maxHeight={90}
//                         className="text-center"
//                         placeholder="0"
//                         onKeyDown={(e) => {
//                           if (e.key === "Enter") e.preventDefault();
//                         }}
//                         onChange={(e) =>
//                           updateLineItem(
//                             item.id,
//                             "unitRate",
//                             sanitizeDecimalInput(e.target.value),
//                           )
//                         }
//                       />
//                     </td>

//                     <td className="pr-3 pt-4 text-right align-top font-semibold">
//                       {formatAmount(item.total)}
//                     </td>

//                     <td className="px-2 py-2 align-top">
//                       <Input
//                         className="h-9 text-sm"
//                         value={item.comment}
//                         onChange={(e) =>
//                           updateLineItem(item.id, "comment", e.target.value)
//                         }
//                         placeholder="Comment"
//                       />
//                     </td>

//                     <td className="px-2 py-2 pt-4 text-center align-top">
//                       <button
//                         type="button"
//                         onClick={() => removeLineItem(item.id)}
//                         className="text-red-600 hover:text-red-800"
//                         title="Delete row"
//                       >
//                         <Trash2 size={18} />
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           <Button type="button" onClick={addLineItem} className="mt-2">
//             + Add Service Row
//           </Button>

//           <div className="mt-4 flex justify-end text-lg font-semibold">
//             Total: Rs {formatAmount(totalAmount)}
//           </div>

//           <Button type="submit" disabled={loading}>
//             {loading
//               ? "Submitting..."
//               : editingInvoice
//                 ? "Update & Resubmit"
//                 : "Submit Request"}
//           </Button>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }

// import {
//   useEffect,
//   useRef,
//   useState,
//   type FormEvent,
//   type TextareaHTMLAttributes,
// } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import { Trash2, CalendarIcon } from "lucide-react";
// import {
//   collection,
//   addDoc,
//   serverTimestamp,
//   doc,
//   updateDoc,
//   runTransaction,
//   getDocs,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { useToast } from "@/hooks/use-toast";
// import { Calendar } from "@/components/ui/calendar";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { format } from "date-fns";

// const PANEL_ID = "IEDGE-SYSTEM";

// type InvoiceType = "general" | "project";

// type LineItem = {
//   id: number;
//   date: string;
//   service: string;
//   description: string;
//   vendor: string;
//   units: string;
//   unitRate: string;
//   total: number;
//   comment: string;
// };

// type BudgetRequestModalProps = {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess?: () => void;
//   editingInvoice?: any | null;
// };

// type AutoResizeTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
//   minHeight?: number;
//   maxHeight?: number;
//   minWidthCh?: number;
//   maxWidthCh?: number;
// };

// function parseAmount(value: any): number {
//   if (value === null || value === undefined || value === "") return 0;
//   const parsed = Number(String(value).replace(/,/g, ""));
//   return Number.isFinite(parsed) ? parsed : 0;
// }

// function formatNumberWithCommas(
//   value: any,
//   removeTrailingZeroes = false,
// ): string {
//   if (value === null || value === undefined || value === "") return "";

//   const rawValue = String(value).replace(/,/g, "").trim();
//   if (!rawValue || rawValue === ".") return rawValue;

//   const [integerPart, decimalPart] = rawValue.split(".");
//   const safeIntegerPart = integerPart || "0";
//   const formattedInteger = safeIntegerPart.replace(
//     /\B(?=(\d{3})+(?!\d))/g,
//     ",",
//   );

//   if (decimalPart !== undefined) {
//     const trimmedDecimal = removeTrailingZeroes
//       ? decimalPart.replace(/0+$/, "")
//       : decimalPart;

//     if (trimmedDecimal) return `${formattedInteger}.${trimmedDecimal}`;

//     // While typing editable fields, keep a trailing decimal point like "1,000."
//     // so the user can continue entering decimal digits naturally.
//     return removeTrailingZeroes ? formattedInteger : `${formattedInteger}.`;
//   }

//   return formattedInteger;
// }

// function formatAmount(value: any): string {
//   const amount = parseAmount(value);

//   return amount.toLocaleString("en-PK", {
//     minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
//     maximumFractionDigits: 2,
//   });
// }

// function sanitizeDecimalInput(value: string) {
//   let cleanValue = value.replace(/,/g, "").replace(/[^\d.]/g, "");

//   const parts = cleanValue.split(".");
//   if (parts.length > 2) {
//     cleanValue = `${parts[0]}.${parts.slice(1).join("")}`;
//   }

//   return cleanValue;
// }

// function getAutoWidth(value: any, minWidthCh = 10, maxWidthCh = 45) {
//   const text = String(value || "");
//   const longestLine = text
//     .split("\n")
//     .reduce((longest, line) => Math.max(longest, line.length), 0);

//   return `${Math.min(Math.max(longestLine + 2, minWidthCh), maxWidthCh)}ch`;
// }

// function AutoResizeTextarea({
//   value,
//   onChange,
//   className = "",
//   minHeight = 36,
//   maxHeight = 140,
//   minWidthCh = 10,
//   maxWidthCh = 45,
//   style,
//   ...props
// }: AutoResizeTextareaProps) {
//   const textareaRef = useRef<HTMLTextAreaElement | null>(null);

//   function resizeTextarea() {
//     const el = textareaRef.current;
//     if (!el) return;

//     el.style.height = "auto";

//     const nextHeight = Math.min(
//       Math.max(el.scrollHeight, minHeight),
//       maxHeight,
//     );

//     el.style.height = `${nextHeight}px`;
//     el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
//   }

//   useEffect(() => {
//     resizeTextarea();
//   }, [value]);

//   return (
//     <Textarea
//       ref={textareaRef}
//       value={value}
//       rows={1}
//       onChange={(e) => {
//         onChange?.(e);
//         requestAnimationFrame(resizeTextarea);
//       }}
//       className={`resize-none overflow-hidden text-sm leading-5 ${className}`}
//       style={{
//         minHeight,
//         width: getAutoWidth(value, minWidthCh, maxWidthCh),
//         ...style,
//       }}
//       {...props}
//     />
//   );
// }

// function getRoleKey(role: any): string {
//   return String(role || "")
//     .toLowerCase()
//     .trim()
//     .replace(/[\s-]+/g, "_");
// }

// function getRoleLabel(role: string) {
//   const normalizedRole = getRoleKey(role);

//   const roleLabels: Record<string, string> = {
//     admin: "Admin",
//     main_admin: "Admin",
//     super_admin: "Super Admin",
//     finance_admin: "Finance Admin",
//     financial_admin: "Finance Admin",
//     finance: "Finance",
//     operation: "Operation",
//     operations: "Operation",
//     operational_admin: "Operation Admin",
//     operation_admin: "Operation Admin",
//     creative: "Creative",
//     sales: "Sales",
//   };

//   return (
//     roleLabels[normalizedRole] ||
//     normalizedRole
//       .replace(/_/g, " ")
//       .replace(/\b\w/g, (letter) => letter.toUpperCase())
//   );
// }

// function canRoleCreateBudgetRequest(role: string) {
//   const roleKey = getRoleKey(role);

//   // Only Admin roles are blocked. Finance and Finance Admin can create requests.
//   const blockedRoles = ["admin", "main_admin", "super_admin"];

//   return !!roleKey && !blockedRoles.includes(roleKey);
// }

// export default function InvoiceRequestModal({
//   isOpen,
//   onClose,
//   onSuccess,
//   editingInvoice = null,
// }: BudgetRequestModalProps) {
//   const { userProfile } = useAuth();
//   const { toast } = useToast();

//   const currentUserRole = getRoleKey(userProfile?.role || "");
//   const canSubmitBudgetRequest = canRoleCreateBudgetRequest(currentUserRole);

//   const [loading, setLoading] = useState(false);
//   const [invoiceType, setInvoiceType] = useState<InvoiceType>("general");

//   const [estimates, setEstimates] = useState<any[]>([]);
//   const [suppliers, setSuppliers] = useState<any[]>([]);
//   const [selectedEstimateId, setSelectedEstimateId] = useState("");
//   const [selectedEstimateInput, setSelectedEstimateInput] = useState("");
//   const [subject, setSubject] = useState("");
//   const [message, setMessage] = useState("");

//   const [formData, setFormData] = useState({
//     requestId: "",
//     clientName: "",
//     project: "",
//     projectCode: "",
//     title: "",
//     comment: "",
//   });

//   const [lineItems, setLineItems] = useState<LineItem[]>([
//     {
//       id: 1,
//       date: "",
//       service: "",
//       description: "",
//       vendor: "",
//       units: "",
//       unitRate: "",
//       total: 0,
//       comment: "",
//     },
//   ]);

//   function getEmptyLineItem(id = 1): LineItem {
//     return {
//       id,
//       date: "",
//       service: "",
//       description: "",
//       vendor: "",
//       units: "",
//       unitRate: "",
//       total: 0,
//       comment: "",
//     };
//   }

//   function resetForm() {
//     setInvoiceType("general");
//     setSelectedEstimateId("");
//     setSelectedEstimateInput("");
//     setSubject("");
//     setMessage("");
//     setFormData({
//       requestId: "",
//       clientName: "",
//       project: "",
//       projectCode: "",
//       title: "",
//       comment: "",
//     });
//     setLineItems([getEmptyLineItem(1)]);
//   }

//   function getSupplierDisplayName(supplier: any) {
//     return (
//       supplier?.supplierName ||
//       supplier?.vendorName ||
//       supplier?.name ||
//       supplier?.companyName ||
//       supplier?.businessName ||
//       supplier?.title ||
//       ""
//     );
//   }

//   function getEstimateProjectCode(estimate: any) {
//     return (
//       estimate?.projectCode ||
//       estimate?.projectcode ||
//       estimate?.project_code ||
//       estimate?.code ||
//       ""
//     );
//   }

//   function getEstimateTitle(estimate: any) {
//     return estimate?.subject || estimate?.title || "";
//   }

//   function getEstimateClientName(estimate: any) {
//     return estimate?.client || estimate?.clientName || "";
//   }

//   function getEstimateProjectName(estimate: any) {
//     return (
//       estimate?.projectOwner || estimate?.project || estimate?.projectName || ""
//     );
//   }

//   function getEstimateDisplayNo(estimate: any) {
//     return (
//       estimate?.estimateNo || estimate?.estimateNumber || estimate?.id || ""
//     );
//   }

//   useEffect(() => {
//     if (!isOpen || editingInvoice) return;
//     resetForm();
//   }, [isOpen, editingInvoice]);

//   useEffect(() => {
//     if (!isOpen) return;

//     const fetchSuppliers = async () => {
//       try {
//         const snap = await getDocs(
//           collection(db, "Panels", PANEL_ID, "suppliers"),
//         );

//         const data = snap.docs
//           .map((d) => ({
//             id: d.id,
//             ...d.data(),
//           }))
//           .sort((a, b) =>
//             getSupplierDisplayName(a).localeCompare(getSupplierDisplayName(b)),
//           );

//         setSuppliers(data);
//       } catch (error) {
//         console.error("Failed to fetch suppliers:", error);
//       }
//     };

//     fetchSuppliers();
//   }, [isOpen]);

//   useEffect(() => {
//     if (!isOpen || invoiceType !== "project") return;

//     const fetchEstimates = async () => {
//       try {
//         const snap = await getDocs(
//           collection(db, "Panels", PANEL_ID, "estimates"),
//         );

//         setEstimates(
//           snap.docs.map((d) => ({
//             id: d.id,
//             ...d.data(),
//           })),
//         );
//       } catch (error) {
//         console.error("Failed to fetch estimates:", error);
//       }
//     };

//     fetchEstimates();
//   }, [isOpen, invoiceType]);

//   useEffect(() => {
//     if (invoiceType === "general") {
//       setSelectedEstimateId("");
//       setSelectedEstimateInput("");
//       setFormData((prev) => ({
//         ...prev,
//         clientName: "",
//         project: "",
//         projectCode: "",
//       }));
//     }
//   }, [invoiceType]);

//   useEffect(() => {
//     if (!selectedEstimateId || !estimates.length) return;

//     const matchedEstimate = estimates.find((e) => e.id === selectedEstimateId);
//     if (matchedEstimate) {
//       setSelectedEstimateInput(getEstimateDisplayNo(matchedEstimate));
//     }
//   }, [selectedEstimateId, estimates]);

//   function handleEstimateSelect(value: string) {
//     setSelectedEstimateInput(value);

//     const normalizedValue = value.trim().toLowerCase();

//     const est = estimates.find((e) => {
//       const displayNo = getEstimateDisplayNo(e).trim().toLowerCase();
//       return e.id === value || displayNo === normalizedValue;
//     });

//     if (!est) {
//       setSelectedEstimateId(value);
//       setFormData((prev) => ({
//         ...prev,
//         clientName: "",
//         title: "",
//         project: "",
//         projectCode: "",
//       }));
//       return;
//     }

//     setSelectedEstimateId(est.id);

//     setFormData((prev) => ({
//       ...prev,
//       clientName: getEstimateClientName(est),
//       title: getEstimateTitle(est),
//       project: getEstimateProjectName(est),
//       projectCode: getEstimateProjectCode(est),
//     }));
//   }

//   function updateLineItem(id: number, field: keyof LineItem, value: string) {
//     setLineItems((prev) =>
//       prev.map((item) => {
//         if (item.id !== id) return item;

//         const updated = { ...item, [field]: value };

//         const units = parseAmount(updated.units);
//         const rate = parseAmount(updated.unitRate);

//         updated.total = units * rate;

//         return updated;
//       }),
//     );
//   }

//   function addLineItem() {
//     setLineItems((prev) => {
//       const nextId =
//         prev.length > 0 ? Math.max(...prev.map((item) => item.id || 0)) + 1 : 1;

//       return [...prev, getEmptyLineItem(nextId)];
//     });
//   }

//   function removeLineItem(id: number) {
//     if (lineItems.length > 1) {
//       setLineItems((prev) => prev.filter((i) => i.id !== id));
//     }
//   }

//   function normalizeLineItemsForSave(items: any[]): LineItem[] {
//     return items.map((item, index) => ({
//       id: item.id || index + 1,
//       date: item.date || "",
//       service: item.service || "",
//       description: item.description || "",
//       vendor: item.vendor || "",
//       units: String(item.units || ""),
//       unitRate: String(parseAmount(item.unitRate) || ""),
//       total: parseAmount(item.total),
//       comment: item.comment || "",
//     }));
//   }

//   const totalAmount = lineItems.reduce(
//     (sum, item) => sum + parseAmount(item.total),
//     0,
//   );

//   async function generateRequestId() {
//     const counterRef = doc(
//       db,
//       "Panels",
//       PANEL_ID,
//       "counters",
//       "invoiceRequests",
//     );

//     return await runTransaction(db, async (transaction) => {
//       const snap = await transaction.get(counterRef);

//       let count = 1;

//       if (!snap.exists()) {
//         transaction.set(counterRef, { count: 1 });
//       } else {
//         count = (snap.data().count || 0) + 1;
//         transaction.update(counterRef, { count });
//       }

//       const year = new Date().getFullYear();
//       return `PR-${year}-${String(count).padStart(4, "0")}`;
//     });
//   }

//   async function handleSubmit(e: FormEvent<HTMLFormElement>) {
//     e.preventDefault();

//     if (!userProfile || !canSubmitBudgetRequest) {
//       toast({
//         title: "Permission denied",
//         description: "Only Admin users cannot create Budget Requests.",
//         variant: "destructive",
//       });
//       return;
//     }

//     try {
//       setLoading(true);

//       const lineItemsForSave = normalizeLineItemsForSave(lineItems);
//       const submittedBy =
//         (userProfile as any).id ||
//         (userProfile as any).uid ||
//         (userProfile as any).userId ||
//         userProfile.email ||
//         "";
//       const submittedByName =
//         userProfile.displayName ||
//         (userProfile as any).name ||
//         userProfile.email ||
//         "";

//       if (!editingInvoice) {
//         const requestId = await generateRequestId();

//         await addDoc(collection(db, "Panels", PANEL_ID, "invoiceRequests"), {
//           requestId,
//           invoiceType,
//           estimateId: selectedEstimateId || "",
//           estimateNumber:
//             invoiceType === "project" ? selectedEstimateInput : "",
//           clientName: invoiceType === "project" ? formData.clientName : "",
//           project: invoiceType === "project" ? formData.project : "",
//           projectName: invoiceType === "project" ? formData.project : "",
//           projectCode: invoiceType === "project" ? formData.projectCode : "",
//           title: formData.title,
//           lineItems: lineItemsForSave,
//           items: lineItemsForSave,
//           totalAmount,
//           subject,
//           message,

//           status: "pending_main_admin",
//           currentApprover: "main_admin",

//           returnedToRole: "",
//           returnedToRoleLabel: "",
//           returnedToCreator: false,
//           needsCreatorRevision: false,

//           submittedAt: serverTimestamp(),
//           editDate: null,
//           submittedBy,
//           createdBy: submittedBy,
//           submittedByRole: currentUserRole,
//           submittedByRoleLabel: getRoleLabel(currentUserRole),
//           submittedByName,
//           createdByName: submittedByName,
//           updatedAt: serverTimestamp(),
//         });

//         toast({ title: "Budget request submitted" });
//       } else {
//         await updateDoc(
//           doc(db, "Panels", PANEL_ID, "invoiceRequests", editingInvoice.id),
//           {
//             invoiceType,
//             estimateId: selectedEstimateId || "",
//             estimateNumber:
//               invoiceType === "project" ? selectedEstimateInput : "",
//             clientName: invoiceType === "project" ? formData.clientName : "",
//             project: invoiceType === "project" ? formData.project : "",
//             projectName: invoiceType === "project" ? formData.project : "",
//             projectCode: invoiceType === "project" ? formData.projectCode : "",
//             title: formData.title,
//             lineItems: lineItemsForSave,
//             items: lineItemsForSave,
//             totalAmount,
//             subject,
//             message,

//             status: "pending_main_admin",
//             currentApprover: "main_admin",
//             returnedToRole: "",
//             returnedToRoleLabel: "",
//             returnedToCreator: false,
//             needsCreatorRevision: false,

//             editDate: serverTimestamp(),
//             updatedAt: serverTimestamp(),
//           },
//         );

//         toast({ title: "Budget request resubmitted" });
//       }

//       onSuccess?.();
//       onClose?.();
//       resetForm();
//     } catch (err) {
//       console.error(err);
//       toast({
//         title: "Error",
//         description: "Failed to submit Budget Request.",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     if (!editingInvoice) return;

//     setInvoiceType(editingInvoice.invoiceType || "project");
//     setSelectedEstimateId(editingInvoice.estimateId || "");
//     setSelectedEstimateInput(
//       editingInvoice.estimateNumber || editingInvoice.estimateId || "",
//     );
//     setSubject(editingInvoice.subject || "");
//     setMessage(editingInvoice.message || "");

//     setFormData({
//       requestId: editingInvoice.requestId || "",
//       clientName: editingInvoice.clientName || "",
//       project: editingInvoice.project || editingInvoice.projectName || "",
//       projectCode: editingInvoice.projectCode || "",
//       title: editingInvoice.title || "",
//       comment: editingInvoice.comment || "",
//     });

//     const sourceItems = editingInvoice.lineItems?.length
//       ? editingInvoice.lineItems
//       : editingInvoice.items?.length
//         ? editingInvoice.items
//         : [];

//     setLineItems(
//       sourceItems.length
//         ? normalizeLineItemsForSave(sourceItems)
//         : [getEmptyLineItem(1)],
//     );
//   }, [editingInvoice]);

//   return (
//     <Dialog
//       open={isOpen}
//       onOpenChange={(open) => {
//         if (!open) onClose?.();
//       }}
//     >
//       <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle>
//             {editingInvoice ? "Edit Budget Request" : "New Budget Request"}
//           </DialogTitle>
//         </DialogHeader>

//         <form onSubmit={handleSubmit} className="space-y-6">
//           <div className="flex gap-2">
//             <Button
//               type="button"
//               variant={invoiceType === "general" ? "default" : "outline"}
//               onClick={() => setInvoiceType("general")}
//             >
//               General
//             </Button>

//             <Button
//               type="button"
//               variant={invoiceType === "project" ? "default" : "outline"}
//               onClick={() => setInvoiceType("project")}
//             >
//               Project
//             </Button>
//           </div>

//           {invoiceType === "general" && (
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//               <div>
//                 <Label>Title *</Label>
//                 <Input
//                   value={formData.title}
//                   onChange={(e) =>
//                     setFormData({ ...formData, title: e.target.value })
//                   }
//                   placeholder="Enter request title"
//                   required
//                 />
//               </div>

//               <div>
//                 <Label>Subject</Label>
//                 <Input
//                   value={subject}
//                   onChange={(e) => setSubject(e.target.value)}
//                   placeholder="Enter request subject"
//                 />
//               </div>

//               <div className="md:col-span-2">
//                 <Label>Message</Label>
//                 <Textarea
//                   value={message}
//                   onChange={(e) => setMessage(e.target.value)}
//                   placeholder="Enter request message"
//                   rows={4}
//                 />
//               </div>
//             </div>
//           )}

//           {invoiceType === "project" && (
//             <div>
//               <Label>Estimate No *</Label>
//               <Input
//                 list="estimate-options"
//                 value={selectedEstimateInput}
//                 onChange={(e) => handleEstimateSelect(e.target.value)}
//                 placeholder="Select or type estimate number"
//                 required
//               />

//               <datalist id="estimate-options">
//                 {estimates.map((e) => (
//                   <option key={e.id} value={getEstimateDisplayNo(e)} />
//                 ))}
//               </datalist>
//             </div>
//           )}

//           {invoiceType === "project" && (
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//               <div>
//                 <Label>Client Name</Label>
//                 <Input
//                   value={formData.clientName}
//                   readOnly
//                   className="bg-gray-100"
//                   placeholder="Auto-filled from estimate"
//                 />
//               </div>

//               <div>
//                 <Label>Subject</Label>
//                 <Input
//                   value={formData.title}
//                   readOnly
//                   className="bg-gray-100"
//                   placeholder="Auto-filled from estimate"
//                 />
//               </div>

//               <div>
//                 <Label>Project</Label>
//                 <Input
//                   value={formData.project}
//                   readOnly
//                   className="bg-gray-100"
//                   placeholder="Auto-filled from estimate"
//                 />
//               </div>

//               <div>
//                 <Label>Project Code *</Label>
//                 <Input
//                   value={formData.projectCode}
//                   onChange={(e) =>
//                     setFormData({ ...formData, projectCode: e.target.value })
//                   }
//                   placeholder="Auto-filled from estimate"
//                   required
//                 />
//               </div>
//             </div>
//           )}

//           <div className="overflow-auto rounded-lg border">
//             <table className="w-full border-collapse text-sm">
//               <thead className="bg-gray-100 text-gray-700">
//                 <tr className="h-12">
//                   <th className="min-w-[130px] px-2">Date</th>
//                   <th className="min-w-[150px] px-2">Service</th>
//                   <th className="min-w-[220px] px-2">Description</th>
//                   <th className="min-w-[180px] px-2">Vendor</th>
//                   <th className="w-[90px] px-2 text-center">Units</th>
//                   <th className="w-[120px] px-2 text-center">Rate</th>
//                   <th className="w-[130px] px-2 text-right">Total</th>
//                   <th className="min-w-[200px] px-2">Comment</th>
//                   <th className="w-[50px]"></th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {lineItems.map((item) => (
//                   <tr key={item.id} className="border-t hover:bg-gray-50">
//                     <td className="px-2 py-2 align-top">
//                       <Popover>
//                         <PopoverTrigger asChild>
//                           <Button
//                             type="button"
//                             variant="outline"
//                             className="w-[180px] justify-start text-left font-normal"
//                           >
//                             <CalendarIcon className="mr-2 h-4 w-4" />
//                             {item.date
//                               ? format(new Date(item.date), "PPP")
//                               : "Pick date"}
//                           </Button>
//                         </PopoverTrigger>

//                         <PopoverContent className="w-auto p-0">
//                           <Calendar
//                             mode="single"
//                             selected={
//                               item.date ? new Date(item.date) : undefined
//                             }
//                             onSelect={(date) =>
//                               updateLineItem(
//                                 item.id,
//                                 "date",
//                                 date?.toISOString() || "",
//                               )
//                             }
//                             initialFocus
//                           />
//                         </PopoverContent>
//                       </Popover>
//                     </td>

//                     <td className="px-2 py-2 align-top">
//                       <Input
//                         className="h-9 text-sm"
//                         value={item.service}
//                         onChange={(e) =>
//                           updateLineItem(item.id, "service", e.target.value)
//                         }
//                         placeholder="Service"
//                       />
//                     </td>

//                     <td className="px-2 py-2 align-top">
//                       <AutoResizeTextarea
//                         value={item.description}
//                         minWidthCh={22}
//                         maxWidthCh={70}
//                         minHeight={36}
//                         maxHeight={160}
//                         placeholder="Enter description"
//                         onChange={(e) =>
//                           updateLineItem(item.id, "description", e.target.value)
//                         }
//                       />
//                     </td>

//                     <td className="px-2 py-2 align-top">
//                       <Input
//                         list={`vendor-options-${item.id}`}
//                         className="h-9 text-sm"
//                         value={item.vendor}
//                         onChange={(e) =>
//                           updateLineItem(item.id, "vendor", e.target.value)
//                         }
//                         placeholder="Enter vendor name"
//                       />

//                       <datalist id={`vendor-options-${item.id}`}>
//                         {suppliers.map((supplier) => {
//                           const supplierName = getSupplierDisplayName(supplier);
//                           if (!supplierName) return null;

//                           return (
//                             <option key={supplier.id} value={supplierName}>
//                               {supplierName}
//                             </option>
//                           );
//                         })}
//                       </datalist>
//                     </td>

//                     <td className="px-2 py-2 align-top">
//                       <Input
//                         type="number"
//                         step="0.01"
//                         min="0"
//                         className="h-9 text-center text-sm"
//                         value={item.units}
//                         onChange={(e) =>
//                           updateLineItem(item.id, "units", e.target.value)
//                         }
//                         placeholder="0"
//                       />
//                     </td>

//                     <td className="px-2 py-2 align-top">
//                       <AutoResizeTextarea
//                         value={formatNumberWithCommas(item.unitRate)}
//                         inputMode="decimal"
//                         minWidthCh={8}
//                         maxWidthCh={18}
//                         minHeight={36}
//                         maxHeight={90}
//                         className="text-center"
//                         placeholder="0"
//                         onKeyDown={(e) => {
//                           if (e.key === "Enter") e.preventDefault();
//                         }}
//                         onChange={(e) =>
//                           updateLineItem(
//                             item.id,
//                             "unitRate",
//                             sanitizeDecimalInput(e.target.value),
//                           )
//                         }
//                       />
//                     </td>

//                     <td className="pr-3 pt-4 text-right align-top font-semibold">
//                       {formatAmount(item.total)}
//                     </td>

//                     <td className="px-2 py-2 align-top">
//                       <Input
//                         className="h-9 text-sm"
//                         value={item.comment}
//                         onChange={(e) =>
//                           updateLineItem(item.id, "comment", e.target.value)
//                         }
//                         placeholder="Comment"
//                       />
//                     </td>

//                     <td className="px-2 py-2 pt-4 text-center align-top">
//                       <button
//                         type="button"
//                         onClick={() => removeLineItem(item.id)}
//                         className="text-red-600 hover:text-red-800"
//                         title="Delete row"
//                       >
//                         <Trash2 size={18} />
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           <Button type="button" onClick={addLineItem} className="mt-2">
//             + Add Service Row
//           </Button>

//           <div className="mt-4 flex justify-end text-lg font-semibold">
//             Total: Rs {formatAmount(totalAmount)}
//           </div>

//           <Button type="submit" disabled={loading}>
//             {loading
//               ? "Submitting..."
//               : editingInvoice
//                 ? "Update & Resubmit"
//                 : "Submit Request"}
//           </Button>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type TextareaHTMLAttributes,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Trash2,
  CalendarIcon,
  X,
  FileText,
  FileSpreadsheet,
  Plus,
} from "lucide-react";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  runTransaction,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const PANEL_ID = "IEDGE-SYSTEM";

type InvoiceType = "general" | "project";

type LineItem = {
  id: number;
  date: string;
  service: string;
  description: string;
  vendor: string;
  units: string;
  unitRate: string;
  total: number;
  comment: string;
};

type BudgetRequestModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editingInvoice?: any | null;
};

type AutoResizeTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  minHeight?: number;
  maxHeight?: number;
  minWidthCh?: number;
  maxWidthCh?: number;
};

function parseAmount(value: any): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumberWithCommas(
  value: any,
  removeTrailingZeroes = false,
): string {
  if (value === null || value === undefined || value === "") return "";

  const rawValue = String(value).replace(/,/g, "").trim();
  if (!rawValue || rawValue === ".") return rawValue;

  const [integerPart, decimalPart] = rawValue.split(".");
  const safeIntegerPart = integerPart || "0";
  const formattedInteger = safeIntegerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ",",
  );

  if (decimalPart !== undefined) {
    const trimmedDecimal = removeTrailingZeroes
      ? decimalPart.replace(/0+$/, "")
      : decimalPart;

    if (trimmedDecimal) return `${formattedInteger}.${trimmedDecimal}`;

    // While typing editable fields, keep a trailing decimal point like "1,000."
    // so the user can continue entering decimal digits naturally.
    return removeTrailingZeroes ? formattedInteger : `${formattedInteger}.`;
  }

  return formattedInteger;
}

function formatAmount(value: any): string {
  const amount = parseAmount(value);

  return amount.toLocaleString("en-PK", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function sanitizeDecimalInput(value: string) {
  let cleanValue = value.replace(/,/g, "").replace(/[^\d.]/g, "");

  const parts = cleanValue.split(".");
  if (parts.length > 2) {
    cleanValue = `${parts[0]}.${parts.slice(1).join("")}`;
  }

  return cleanValue;
}

function formatDateForDisplay(value: any) {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return format(date, "dd MMM yyyy");
}

function safeExportFileName(value: string) {
  return value
    .trim()
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function getAutoWidth(value: any, minWidthCh = 10, maxWidthCh = 45) {
  const text = String(value || "");
  const longestLine = text
    .split("\n")
    .reduce((longest, line) => Math.max(longest, line.length), 0);

  return `${Math.min(Math.max(longestLine + 2, minWidthCh), maxWidthCh)}ch`;
}

function AutoResizeTextarea({
  value,
  onChange,
  className = "",
  minHeight = 36,
  maxHeight = 140,
  minWidthCh = 10,
  maxWidthCh = 45,
  style,
  ...props
}: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  function resizeTextarea() {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";

    const nextHeight = Math.min(
      Math.max(el.scrollHeight, minHeight),
      maxHeight,
    );

    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }

  useEffect(() => {
    resizeTextarea();
  }, [value]);

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      rows={1}
      onChange={(e) => {
        onChange?.(e);
        requestAnimationFrame(resizeTextarea);
      }}
      className={`resize-none overflow-hidden text-sm leading-5 ${className}`}
      style={{
        minHeight,
        width: getAutoWidth(value, minWidthCh, maxWidthCh),
        ...style,
      }}
      {...props}
    />
  );
}

function getRoleKey(role: any): string {
  return String(role || "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");
}

function getRoleLabel(role: string) {
  const normalizedRole = getRoleKey(role);

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    main_admin: "Admin",
    super_admin: "Super Admin",
    finance_admin: "Finance Admin",
    financial_admin: "Finance Admin",
    finance: "Finance",
    operation: "Operation",
    operations: "Operation",
    operational_admin: "Operation Admin",
    operation_admin: "Operation Admin",
    creative: "Creative",
    sales: "Sales",
  };

  return (
    roleLabels[normalizedRole] ||
    normalizedRole
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function canRoleCreateBudgetRequest(role: string) {
  const roleKey = getRoleKey(role);

  // Only Admin roles are blocked. Finance and Finance Admin can create requests.
  const blockedRoles = ["admin", "main_admin", "super_admin"];

  return !!roleKey && !blockedRoles.includes(roleKey);
}

export default function InvoiceRequestModal({
  isOpen,
  onClose,
  onSuccess,
  editingInvoice = null,
}: BudgetRequestModalProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const currentUserRole = getRoleKey(userProfile?.role || "");
  const canSubmitBudgetRequest = canRoleCreateBudgetRequest(currentUserRole);

  const [loading, setLoading] = useState(false);
  const [invoiceType, setInvoiceType] = useState<InvoiceType>("general");

  const [estimates, setEstimates] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedEstimateId, setSelectedEstimateId] = useState("");
  const [selectedEstimateInput, setSelectedEstimateInput] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    requestId: "",
    clientName: "",
    project: "",
    projectCode: "",
    title: "",
    comment: "",
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: 1,
      date: "",
      service: "",
      description: "",
      vendor: "",
      units: "",
      unitRate: "",
      total: 0,
      comment: "",
    },
  ]);

  function getEmptyLineItem(id = 1): LineItem {
    return {
      id,
      date: "",
      service: "",
      description: "",
      vendor: "",
      units: "",
      unitRate: "",
      total: 0,
      comment: "",
    };
  }

  function resetForm() {
    setInvoiceType("general");
    setSelectedEstimateId("");
    setSelectedEstimateInput("");
    setSubject("");
    setMessage("");
    setFormData({
      requestId: "",
      clientName: "",
      project: "",
      projectCode: "",
      title: "",
      comment: "",
    });
    setLineItems([getEmptyLineItem(1)]);
  }

  function getSupplierDisplayName(supplier: any) {
    return (
      supplier?.supplierName ||
      supplier?.vendorName ||
      supplier?.name ||
      supplier?.companyName ||
      supplier?.businessName ||
      supplier?.title ||
      ""
    );
  }

  function getEstimateProjectCode(estimate: any) {
    return (
      estimate?.projectCode ||
      estimate?.projectcode ||
      estimate?.project_code ||
      estimate?.code ||
      ""
    );
  }

  function getEstimateTitle(estimate: any) {
    return estimate?.subject || estimate?.title || "";
  }

  function getEstimateClientName(estimate: any) {
    return estimate?.client || estimate?.clientName || "";
  }

  function getEstimateProjectName(estimate: any) {
    return (
      estimate?.projectOwner || estimate?.project || estimate?.projectName || ""
    );
  }

  function getEstimateDisplayNo(estimate: any) {
    return (
      estimate?.estimateNo || estimate?.estimateNumber || estimate?.id || ""
    );
  }

  useEffect(() => {
    if (!isOpen || editingInvoice) return;
    resetForm();
  }, [isOpen, editingInvoice]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchSuppliers = async () => {
      try {
        const snap = await getDocs(
          collection(db, "Panels", PANEL_ID, "suppliers"),
        );

        const data = snap.docs
          .map((d) => ({
            id: d.id,
            ...d.data(),
          }))
          .sort((a, b) =>
            getSupplierDisplayName(a).localeCompare(getSupplierDisplayName(b)),
          );

        setSuppliers(data);
      } catch (error) {
        console.error("Failed to fetch suppliers:", error);
      }
    };

    fetchSuppliers();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || invoiceType !== "project") return;

    const fetchEstimates = async () => {
      try {
        const snap = await getDocs(
          collection(db, "Panels", PANEL_ID, "estimates"),
        );

        setEstimates(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })),
        );
      } catch (error) {
        console.error("Failed to fetch estimates:", error);
      }
    };

    fetchEstimates();
  }, [isOpen, invoiceType]);

  useEffect(() => {
    if (invoiceType === "general") {
      setSelectedEstimateId("");
      setSelectedEstimateInput("");
      setFormData((prev) => ({
        ...prev,
        clientName: "",
        project: "",
        projectCode: "",
      }));
    }
  }, [invoiceType]);

  useEffect(() => {
    if (!selectedEstimateId || !estimates.length) return;

    const matchedEstimate = estimates.find((e) => e.id === selectedEstimateId);
    if (matchedEstimate) {
      setSelectedEstimateInput(getEstimateDisplayNo(matchedEstimate));
    }
  }, [selectedEstimateId, estimates]);

  function handleEstimateSelect(value: string) {
    setSelectedEstimateInput(value);

    const normalizedValue = value.trim().toLowerCase();

    const est = estimates.find((e) => {
      const displayNo = getEstimateDisplayNo(e).trim().toLowerCase();
      return e.id === value || displayNo === normalizedValue;
    });

    if (!est) {
      setSelectedEstimateId(value);
      setFormData((prev) => ({
        ...prev,
        clientName: "",
        title: "",
        project: "",
        projectCode: "",
      }));
      return;
    }

    setSelectedEstimateId(est.id);

    setFormData((prev) => ({
      ...prev,
      clientName: getEstimateClientName(est),
      title: getEstimateTitle(est),
      project: getEstimateProjectName(est),
      projectCode: getEstimateProjectCode(est),
    }));
  }

  function updateLineItem(id: number, field: keyof LineItem, value: string) {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        const units = parseAmount(updated.units);
        const rate = parseAmount(updated.unitRate);

        updated.total = units * rate;

        return updated;
      }),
    );
  }

  function addLineItem() {
    setLineItems((prev) => {
      const nextId =
        prev.length > 0 ? Math.max(...prev.map((item) => item.id || 0)) + 1 : 1;

      return [...prev, getEmptyLineItem(nextId)];
    });
  }

  function removeLineItem(id: number) {
    if (lineItems.length > 1) {
      setLineItems((prev) => prev.filter((i) => i.id !== id));
    }
  }

  function normalizeLineItemsForSave(items: any[]): LineItem[] {
    return items.map((item, index) => ({
      id: item.id || index + 1,
      date: item.date || "",
      service: item.service || "",
      description: item.description || "",
      vendor: item.vendor || "",
      units: String(item.units || ""),
      unitRate: String(parseAmount(item.unitRate) || ""),
      total: parseAmount(item.total),
      comment: item.comment || "",
    }));
  }

  const totalAmount = lineItems.reduce(
    (sum, item) => sum + parseAmount(item.total),
    0,
  );

  function getRequestNumber() {
    return formData.requestId || editingInvoice?.requestId || "DRAFT";
  }

  function getRequestTitle() {
    return formData.title || subject || "Budget Request";
  }

  function getExportFileName(extension: "pdf" | "xlsx") {
    const baseName = safeExportFileName(
      `${getRequestNumber()}-${getRequestTitle()}`,
    );

    return `${baseName || "budget-request"}.${extension}`;
  }

  function getExportMetaRows() {
    return [
      ["Request ID", getRequestNumber()],
      ["Request Type", invoiceType === "project" ? "Project" : "General"],
      ["Title", getRequestTitle()],
      ["Subject", subject || formData.title || "-"],
      [
        "Estimate No",
        invoiceType === "project" ? selectedEstimateInput || "-" : "-",
      ],
      ["Client", invoiceType === "project" ? formData.clientName || "-" : "-"],
      ["Project", invoiceType === "project" ? formData.project || "-" : "-"],
      [
        "Project Code",
        invoiceType === "project" ? formData.projectCode || "-" : "-",
      ],
      [
        "Prepared By",
        userProfile?.displayName ||
          (userProfile as any)?.name ||
          userProfile?.email ||
          "-",
      ],
      ["Prepared On", formatDateForDisplay(new Date())],
      ["Total", `Rs ${formatAmount(totalAmount)}`],
    ];
  }

  function handleExportPdf() {
    try {
      const exportItems = normalizeLineItemsForSave(lineItems);
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });
      const pageWidth = doc.internal.pageSize.getWidth();
      const metaRows = getExportMetaRows();

      doc.setProperties({ title: `Budget Request - ${getRequestNumber()}` });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("Budget Request", 40, 44);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(90);
      doc.text(
        `Generated ${formatDateForDisplay(new Date())}`,
        pageWidth - 40,
        44,
        {
          align: "right",
        },
      );

      doc.setTextColor(30);
      metaRows.forEach(([label, value], index) => {
        const column = index % 3;
        const row = Math.floor(index / 3);
        const x = 40 + column * 260;
        const y = 78 + row * 34;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(label, x, y);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(25);
        doc.text(String(value || "-"), x, y + 14, { maxWidth: 220 });
      });

      autoTable(doc, {
        startY: 220,
        head: [
          [
            "#",
            "Date",
            "Service",
            "Description",
            "Vendor",
            "Units",
            "Rate",
            "Total",
            "Comment",
          ],
        ],
        body: exportItems.map((item, index) => [
          String(index + 1),
          formatDateForDisplay(item.date) || "-",
          item.service || "-",
          item.description || "-",
          item.vendor || "-",
          item.units || "0",
          formatAmount(item.unitRate),
          formatAmount(item.total),
          item.comment || "-",
        ]),
        foot: [
          [
            "",
            "",
            "",
            "",
            "",
            "",
            "Total",
            `Rs ${formatAmount(totalAmount)}`,
            "",
          ],
        ],
        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 5,
          lineColor: [229, 231, 235],
          lineWidth: 0.5,
          overflow: "linebreak",
          valign: "top",
        },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        footStyles: {
          fillColor: [248, 250, 252],
          textColor: [15, 23, 42],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 24, halign: "center" },
          1: { cellWidth: 70 },
          2: { cellWidth: 90 },
          3: { cellWidth: 150 },
          4: { cellWidth: 100 },
          5: { cellWidth: 45, halign: "right" },
          6: { cellWidth: 65, halign: "right" },
          7: { cellWidth: 70, halign: "right" },
          8: { cellWidth: 120 },
        },
        margin: { left: 40, right: 40 },
      });

      const lastTableY = (doc as any).lastAutoTable?.finalY || 220;
      if (message && lastTableY < doc.internal.pageSize.getHeight() - 70) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("Message", 40, lastTableY + 28);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(message, 40, lastTableY + 44, { maxWidth: pageWidth - 80 });
      }

      doc.save(getExportFileName("pdf"));
      toast({ title: "PDF exported" });
    } catch (error) {
      console.error("Failed to export PDF:", error);
      toast({
        title: "Export failed",
        description: "Could not export the Budget Request PDF.",
        variant: "destructive",
      });
    }
  }

  function handleExportExcel() {
    try {
      const exportItems = normalizeLineItemsForSave(lineItems);
      const rows: Array<Array<string | number>> = [
        ["Budget Request"],
        [],
        ...getExportMetaRows(),
        [],
        ["Line Items"],
        [
          "#",
          "Date",
          "Service",
          "Description",
          "Vendor",
          "Units",
          "Rate",
          "Total",
          "Comment",
        ],
        ...exportItems.map((item, index) => [
          index + 1,
          formatDateForDisplay(item.date),
          item.service,
          item.description,
          item.vendor,
          parseAmount(item.units),
          parseAmount(item.unitRate),
          parseAmount(item.total),
          item.comment,
        ]),
        ["", "", "", "", "", "", "Total", totalAmount, ""],
      ];

      if (message) {
        rows.push([], ["Message", message]);
      }

      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      worksheet["!cols"] = [
        { wch: 6 },
        { wch: 14 },
        { wch: 24 },
        { wch: 36 },
        { wch: 24 },
        { wch: 10 },
        { wch: 14 },
        { wch: 14 },
        { wch: 28 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Budget Request");
      XLSX.writeFile(workbook, getExportFileName("xlsx"));

      toast({ title: "Excel exported" });
    } catch (error) {
      console.error("Failed to export Excel:", error);
      toast({
        title: "Export failed",
        description: "Could not export the Budget Request Excel file.",
        variant: "destructive",
      });
    }
  }

  async function generateRequestId() {
    const counterRef = doc(
      db,
      "Panels",
      PANEL_ID,
      "counters",
      "invoiceRequests",
    );

    return await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(counterRef);

      let count = 1;

      if (!snap.exists()) {
        transaction.set(counterRef, { count: 1 });
      } else {
        count = (snap.data().count || 0) + 1;
        transaction.update(counterRef, { count });
      }

      const year = new Date().getFullYear();
      return `PR-${year}-${String(count).padStart(4, "0")}`;
    });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!userProfile || !canSubmitBudgetRequest) {
      toast({
        title: "Permission denied",
        description: "Only Admin users cannot create Budget Requests.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const lineItemsForSave = normalizeLineItemsForSave(lineItems);
      const submittedBy =
        (userProfile as any).id ||
        (userProfile as any).uid ||
        (userProfile as any).userId ||
        userProfile.email ||
        "";
      const submittedByName =
        userProfile.displayName ||
        (userProfile as any).name ||
        userProfile.email ||
        "";

      if (!editingInvoice) {
        const requestId = await generateRequestId();

        await addDoc(collection(db, "Panels", PANEL_ID, "invoiceRequests"), {
          requestId,
          invoiceType,
          estimateId: selectedEstimateId || "",
          estimateNumber:
            invoiceType === "project" ? selectedEstimateInput : "",
          clientName: invoiceType === "project" ? formData.clientName : "",
          project: invoiceType === "project" ? formData.project : "",
          projectName: invoiceType === "project" ? formData.project : "",
          projectCode: invoiceType === "project" ? formData.projectCode : "",
          title: formData.title,
          lineItems: lineItemsForSave,
          items: lineItemsForSave,
          totalAmount,
          subject,
          message,

          status: "pending_main_admin",
          currentApprover: "main_admin",

          returnedToRole: "",
          returnedToRoleLabel: "",
          returnedToCreator: false,
          needsCreatorRevision: false,

          submittedAt: serverTimestamp(),
          editDate: null,
          submittedBy,
          createdBy: submittedBy,
          submittedByRole: currentUserRole,
          submittedByRoleLabel: getRoleLabel(currentUserRole),
          submittedByName,
          createdByName: submittedByName,
          updatedAt: serverTimestamp(),
        });

        toast({ title: "Budget request submitted" });
      } else {
        await updateDoc(
          doc(db, "Panels", PANEL_ID, "invoiceRequests", editingInvoice.id),
          {
            invoiceType,
            estimateId: selectedEstimateId || "",
            estimateNumber:
              invoiceType === "project" ? selectedEstimateInput : "",
            clientName: invoiceType === "project" ? formData.clientName : "",
            project: invoiceType === "project" ? formData.project : "",
            projectName: invoiceType === "project" ? formData.project : "",
            projectCode: invoiceType === "project" ? formData.projectCode : "",
            title: formData.title,
            lineItems: lineItemsForSave,
            items: lineItemsForSave,
            totalAmount,
            subject,
            message,

            status: "pending_main_admin",
            currentApprover: "main_admin",
            returnedToRole: "",
            returnedToRoleLabel: "",
            returnedToCreator: false,
            needsCreatorRevision: false,

            editDate: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
        );

        toast({ title: "Budget request resubmitted" });
      }

      onSuccess?.();
      resetForm();
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to submit Budget Request.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!editingInvoice) return;

    setInvoiceType(editingInvoice.invoiceType || "project");
    setSelectedEstimateId(editingInvoice.estimateId || "");
    setSelectedEstimateInput(
      editingInvoice.estimateNumber || editingInvoice.estimateId || "",
    );
    setSubject(editingInvoice.subject || "");
    setMessage(editingInvoice.message || "");

    setFormData({
      requestId: editingInvoice.requestId || "",
      clientName: editingInvoice.clientName || "",
      project: editingInvoice.project || editingInvoice.projectName || "",
      projectCode: editingInvoice.projectCode || "",
      title: editingInvoice.title || "",
      comment: editingInvoice.comment || "",
    });

    const sourceItems = editingInvoice.lineItems?.length
      ? editingInvoice.lineItems
      : editingInvoice.items?.length
        ? editingInvoice.items
        : [];

    setLineItems(
      sourceItems.length
        ? normalizeLineItemsForSave(sourceItems)
        : [getEmptyLineItem(1)],
    );
  }, [editingInvoice]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        // Keep the popup open for overlay clicks, Escape, and Radix default close events.
        // The modal only closes through the explicit close button below.
      }}
    >
      <DialogContent
        className="left-0 top-0 h-[100dvh] max-h-none w-screen max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-none border-0 bg-slate-50 p-0 text-slate-950 shadow-none sm:rounded-none [&>button]:hidden"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <div className="flex h-full min-h-0 flex-col">
          <DialogHeader className="border-b border-slate-200 bg-white/95 px-6 py-4 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                    Budget Request
                  </span>
                  <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500">
                    {editingInvoice ? "Editing draft" : "New submission"}
                  </span>
                </div>

                <DialogTitle className="text-2xl font-semibold tracking-tight text-slate-950">
                  {editingInvoice
                    ? "Edit Budget Request"
                    : "Create Budget Request"}
                </DialogTitle>

                <p className="mt-1 text-sm text-slate-500">
                  Full-screen workspace with controlled close, clean line items,
                  and export-ready request data.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* <Button
                  type="button"
                  variant="outline"
                  onClick={handleExportPdf}
                  className="gap-2 rounded-full border-slate-200 bg-white shadow-sm hover:bg-slate-50"
                >
                  <FileText className="h-4 w-4" />
                  Export PDF
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleExportExcel}
                  className="gap-2 rounded-full border-slate-200 bg-white shadow-sm hover:bg-slate-50"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Export Excel
                </Button> */}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  aria-label="Close budget request popup"
                  className="rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      Total Amount
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">
                      Rs {formatAmount(totalAmount)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      Request Type
                    </p>
                    <p className="mt-2 text-2xl font-semibold capitalize text-slate-950">
                      {invoiceType}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      Service Rows
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">
                      {lineItems.length}
                    </p>
                  </div>
                </div>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-950">
                        Request Details
                      </h3>
                      <p className="text-sm text-slate-500">
                        Select the request mode and fill the required details.
                      </p>
                    </div>

                    <div className="inline-flex w-fit rounded-full bg-slate-100 p-1">
                      <Button
                        type="button"
                        variant={
                          invoiceType === "general" ? "default" : "ghost"
                        }
                        onClick={() => setInvoiceType("general")}
                        className="rounded-full px-5"
                      >
                        General
                      </Button>

                      <Button
                        type="button"
                        variant={
                          invoiceType === "project" ? "default" : "ghost"
                        }
                        onClick={() => setInvoiceType("project")}
                        className="rounded-full px-5"
                      >
                        Project
                      </Button>
                    </div>
                  </div>

                  {invoiceType === "general" && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Title *
                        </Label>
                        <Input
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          placeholder="Enter request title"
                          required
                          className="h-11 rounded-xl border-slate-200 bg-slate-50/60"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Subject
                        </Label>
                        <Input
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Enter request subject"
                          className="h-11 rounded-xl border-slate-200 bg-slate-50/60"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Message
                        </Label>
                        <Textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Enter request message"
                          rows={4}
                          className="rounded-xl border-slate-200 bg-slate-50/60"
                        />
                      </div>
                    </div>
                  )}

                  {invoiceType === "project" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Estimate No *
                        </Label>
                        <Input
                          list="estimate-options"
                          value={selectedEstimateInput}
                          onChange={(e) => handleEstimateSelect(e.target.value)}
                          placeholder="Select or type estimate number"
                          required
                          className="h-11 rounded-xl border-slate-200 bg-slate-50/60"
                        />

                        <datalist id="estimate-options">
                          {estimates.map((e) => (
                            <option
                              key={e.id}
                              value={getEstimateDisplayNo(e)}
                            />
                          ))}
                        </datalist>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Client Name
                          </Label>
                          <Input
                            value={formData.clientName}
                            readOnly
                            className="h-11 rounded-xl border-slate-200 bg-slate-100 text-slate-600"
                            placeholder="Auto-filled from estimate"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Subject
                          </Label>
                          <Input
                            value={formData.title}
                            readOnly
                            className="h-11 rounded-xl border-slate-200 bg-slate-100 text-slate-600"
                            placeholder="Auto-filled from estimate"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Project
                          </Label>
                          <Input
                            value={formData.project}
                            readOnly
                            className="h-11 rounded-xl border-slate-200 bg-slate-100 text-slate-600"
                            placeholder="Auto-filled from estimate"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Project Code *
                          </Label>
                          <Input
                            value={formData.projectCode}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                projectCode: e.target.value,
                              })
                            }
                            placeholder="Auto-filled from estimate"
                            required
                            className="h-11 rounded-xl border-slate-200 bg-slate-50/60"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-950">
                        Services & Costing
                      </h3>
                      <p className="text-sm text-slate-500">
                        Add each service row with vendor, units, rate, and
                        comments.
                      </p>
                    </div>

                    <Button
                      type="button"
                      onClick={addLineItem}
                      variant="outline"
                      className="gap-2 rounded-full border-slate-200 bg-white shadow-sm hover:bg-slate-50"
                    >
                      <Plus className="h-4 w-4" />
                      Add Service Row
                    </Button>
                  </div>

                  <div className="overflow-auto">
                    <table className="w-full min-w-[1250px] border-collapse text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr className="h-12 border-b border-slate-200">
                          <th className="min-w-[150px] px-3 text-left font-semibold">
                            Date
                          </th>
                          <th className="min-w-[160px] px-3 text-left font-semibold">
                            Service
                          </th>
                          <th className="min-w-[240px] px-3 text-left font-semibold">
                            Description
                          </th>
                          <th className="min-w-[190px] px-3 text-left font-semibold">
                            Vendor
                          </th>
                          <th className="w-[100px] px-3 text-center font-semibold">
                            Units
                          </th>
                          <th className="w-[130px] px-3 text-center font-semibold">
                            Rate
                          </th>
                          <th className="w-[130px] px-3 text-right font-semibold">
                            Total
                          </th>
                          <th className="min-w-[210px] px-3 text-left font-semibold">
                            Comment
                          </th>
                          <th className="w-[60px] px-3"></th>
                        </tr>
                      </thead>

                      <tbody>
                        {lineItems.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-slate-100 transition-colors hover:bg-slate-50/70"
                          >
                            <td className="px-3 py-3 align-top">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="h-10 w-[180px] justify-start rounded-xl border-slate-200 bg-white text-left font-normal"
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                                    {item.date
                                      ? format(new Date(item.date), "PPP")
                                      : "Pick date"}
                                  </Button>
                                </PopoverTrigger>

                                <PopoverContent className="w-auto rounded-xl p-0">
                                  <Calendar
                                    mode="single"
                                    selected={
                                      item.date
                                        ? new Date(item.date)
                                        : undefined
                                    }
                                    onSelect={(date) =>
                                      updateLineItem(
                                        item.id,
                                        "date",
                                        date?.toISOString() || "",
                                      )
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </td>

                            <td className="px-3 py-3 align-top">
                              <Input
                                className="h-10 rounded-xl border-slate-200 bg-slate-50/60 text-sm"
                                value={item.service}
                                onChange={(e) =>
                                  updateLineItem(
                                    item.id,
                                    "service",
                                    e.target.value,
                                  )
                                }
                                placeholder="Service"
                              />
                            </td>

                            <td className="px-3 py-3 align-top">
                              <AutoResizeTextarea
                                value={item.description}
                                minWidthCh={24}
                                maxWidthCh={78}
                                minHeight={40}
                                maxHeight={160}
                                placeholder="Enter description"
                                className="rounded-xl border-slate-200 bg-slate-50/60"
                                onChange={(e) =>
                                  updateLineItem(
                                    item.id,
                                    "description",
                                    e.target.value,
                                  )
                                }
                              />
                            </td>

                            <td className="px-3 py-3 align-top">
                              <Input
                                list={`vendor-options-${item.id}`}
                                className="h-10 rounded-xl border-slate-200 bg-slate-50/60 text-sm"
                                value={item.vendor}
                                onChange={(e) =>
                                  updateLineItem(
                                    item.id,
                                    "vendor",
                                    e.target.value,
                                  )
                                }
                                placeholder="Enter vendor name"
                              />

                              <datalist id={`vendor-options-${item.id}`}>
                                {suppliers.map((supplier) => {
                                  const supplierName =
                                    getSupplierDisplayName(supplier);
                                  if (!supplierName) return null;

                                  return (
                                    <option
                                      key={supplier.id}
                                      value={supplierName}
                                    >
                                      {supplierName}
                                    </option>
                                  );
                                })}
                              </datalist>
                            </td>

                            <td className="px-3 py-3 align-top">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                className="h-10 rounded-xl border-slate-200 bg-slate-50/60 text-center text-sm"
                                value={item.units}
                                onChange={(e) =>
                                  updateLineItem(
                                    item.id,
                                    "units",
                                    e.target.value,
                                  )
                                }
                                placeholder="0"
                              />
                            </td>

                            <td className="px-3 py-3 align-top">
                              <AutoResizeTextarea
                                value={formatNumberWithCommas(item.unitRate)}
                                inputMode="decimal"
                                minWidthCh={8}
                                maxWidthCh={18}
                                minHeight={40}
                                maxHeight={90}
                                className="rounded-xl border-slate-200 bg-slate-50/60 text-center"
                                placeholder="0"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") e.preventDefault();
                                }}
                                onChange={(e) =>
                                  updateLineItem(
                                    item.id,
                                    "unitRate",
                                    sanitizeDecimalInput(e.target.value),
                                  )
                                }
                              />
                            </td>

                            <td className="px-3 py-4 text-right align-top font-semibold text-slate-950">
                              {formatAmount(item.total)}
                            </td>

                            <td className="px-3 py-3 align-top">
                              <Input
                                className="h-10 rounded-xl border-slate-200 bg-slate-50/60 text-sm"
                                value={item.comment}
                                onChange={(e) =>
                                  updateLineItem(
                                    item.id,
                                    "comment",
                                    e.target.value,
                                  )
                                }
                                placeholder="Comment"
                              />
                            </td>

                            <td className="px-3 py-4 text-center align-top">
                              <button
                                type="button"
                                onClick={() => removeLineItem(item.id)}
                                className="rounded-full p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                                title="Delete row"
                                disabled={lineItems.length === 1}
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white px-6 py-4 shadow-[0_-8px_30px_rgba(15,23,42,0.04)]">
              <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                    Request Total
                  </p>
                  <p className="text-xl font-semibold text-slate-950">
                    Rs {formatAmount(totalAmount)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleExportPdf}
                    className="gap-2 rounded-full border-slate-200 bg-white"
                  >
                    <FileText className="h-4 w-4" />
                    PDF
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleExportExcel}
                    className="gap-2 rounded-full border-slate-200 bg-white"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel
                  </Button>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="rounded-full px-7"
                  >
                    {loading
                      ? "Submitting..."
                      : editingInvoice
                        ? "Update & Resubmit"
                        : "Submit Request"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
