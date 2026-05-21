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

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type TextareaHTMLAttributes,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Trash2, CalendarIcon } from "lucide-react";
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

function getRoleLabel(role: string) {
  const normalizedRole = String(role || "").trim();

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    main_admin: "Admin",
    finance_admin: "Finance Admin",
    financial_admin: "Finance Admin",
    finance: "Finance",
    operation: "Operation",
    operational_admin: "Operation Admin",
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
  const blockedRoles = [
    "admin",
    "main_admin",
    "finance_admin",
    "financial_admin",
  ];
  return !!role && !blockedRoles.includes(role);
}

export default function InvoiceRequestModal({
  isOpen,
  onClose,
  onSuccess,
  editingInvoice = null,
}: BudgetRequestModalProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const currentUserRole = String(userProfile?.role || "");
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
        description: "Admin and Finance Admin cannot create Budget Requests.",
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
      onClose?.();
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
      onOpenChange={(open) => {
        if (!open) onClose?.();
      }}
    >
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingInvoice ? "Edit Budget Request" : "New Budget Request"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={invoiceType === "general" ? "default" : "outline"}
              onClick={() => setInvoiceType("general")}
            >
              General
            </Button>

            <Button
              type="button"
              variant={invoiceType === "project" ? "default" : "outline"}
              onClick={() => setInvoiceType("project")}
            >
              Project
            </Button>
          </div>

          {invoiceType === "general" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter request title"
                  required
                />
              </div>

              <div>
                <Label>Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter request subject"
                />
              </div>

              <div className="md:col-span-2">
                <Label>Message</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter request message"
                  rows={4}
                />
              </div>
            </div>
          )}

          {invoiceType === "project" && (
            <div>
              <Label>Estimate No *</Label>
              <Input
                list="estimate-options"
                value={selectedEstimateInput}
                onChange={(e) => handleEstimateSelect(e.target.value)}
                placeholder="Select or type estimate number"
                required
              />

              <datalist id="estimate-options">
                {estimates.map((e) => (
                  <option key={e.id} value={getEstimateDisplayNo(e)} />
                ))}
              </datalist>
            </div>
          )}

          {invoiceType === "project" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Client Name</Label>
                <Input
                  value={formData.clientName}
                  readOnly
                  className="bg-gray-100"
                  placeholder="Auto-filled from estimate"
                />
              </div>

              <div>
                <Label>Subject</Label>
                <Input
                  value={formData.title}
                  readOnly
                  className="bg-gray-100"
                  placeholder="Auto-filled from estimate"
                />
              </div>

              <div>
                <Label>Project</Label>
                <Input
                  value={formData.project}
                  readOnly
                  className="bg-gray-100"
                  placeholder="Auto-filled from estimate"
                />
              </div>

              <div>
                <Label>Project Code *</Label>
                <Input
                  value={formData.projectCode}
                  onChange={(e) =>
                    setFormData({ ...formData, projectCode: e.target.value })
                  }
                  placeholder="Auto-filled from estimate"
                  required
                />
              </div>
            </div>
          )}

          <div className="overflow-auto rounded-lg border">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr className="h-12">
                  <th className="min-w-[130px] px-2">Date</th>
                  <th className="min-w-[150px] px-2">Service</th>
                  <th className="min-w-[220px] px-2">Description</th>
                  <th className="min-w-[180px] px-2">Vendor</th>
                  <th className="w-[90px] px-2 text-center">Units</th>
                  <th className="w-[120px] px-2 text-center">Rate</th>
                  <th className="w-[130px] px-2 text-right">Total</th>
                  <th className="min-w-[200px] px-2">Comment</th>
                  <th className="w-[50px]"></th>
                </tr>
              </thead>

              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.id} className="border-t hover:bg-gray-50">
                    <td className="px-2 py-2 align-top">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-[180px] justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {item.date
                              ? format(new Date(item.date), "PPP")
                              : "Pick date"}
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={
                              item.date ? new Date(item.date) : undefined
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

                    <td className="px-2 py-2 align-top">
                      <Input
                        className="h-9 text-sm"
                        value={item.service}
                        onChange={(e) =>
                          updateLineItem(item.id, "service", e.target.value)
                        }
                        placeholder="Service"
                      />
                    </td>

                    <td className="px-2 py-2 align-top">
                      <AutoResizeTextarea
                        value={item.description}
                        minWidthCh={22}
                        maxWidthCh={70}
                        minHeight={36}
                        maxHeight={160}
                        placeholder="Enter description"
                        onChange={(e) =>
                          updateLineItem(item.id, "description", e.target.value)
                        }
                      />
                    </td>

                    <td className="px-2 py-2 align-top">
                      <Input
                        list={`vendor-options-${item.id}`}
                        className="h-9 text-sm"
                        value={item.vendor}
                        onChange={(e) =>
                          updateLineItem(item.id, "vendor", e.target.value)
                        }
                        placeholder="Enter vendor name"
                      />

                      <datalist id={`vendor-options-${item.id}`}>
                        {suppliers.map((supplier) => {
                          const supplierName = getSupplierDisplayName(supplier);
                          if (!supplierName) return null;

                          return (
                            <option key={supplier.id} value={supplierName}>
                              {supplierName}
                            </option>
                          );
                        })}
                      </datalist>
                    </td>

                    <td className="px-2 py-2 align-top">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="h-9 text-center text-sm"
                        value={item.units}
                        onChange={(e) =>
                          updateLineItem(item.id, "units", e.target.value)
                        }
                        placeholder="0"
                      />
                    </td>

                    <td className="px-2 py-2 align-top">
                      <AutoResizeTextarea
                        value={formatNumberWithCommas(item.unitRate)}
                        inputMode="decimal"
                        minWidthCh={8}
                        maxWidthCh={18}
                        minHeight={36}
                        maxHeight={90}
                        className="text-center"
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

                    <td className="pr-3 pt-4 text-right align-top font-semibold">
                      {formatAmount(item.total)}
                    </td>

                    <td className="px-2 py-2 align-top">
                      <Input
                        className="h-9 text-sm"
                        value={item.comment}
                        onChange={(e) =>
                          updateLineItem(item.id, "comment", e.target.value)
                        }
                        placeholder="Comment"
                      />
                    </td>

                    <td className="px-2 py-2 pt-4 text-center align-top">
                      <button
                        type="button"
                        onClick={() => removeLineItem(item.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete row"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button type="button" onClick={addLineItem} className="mt-2">
            + Add Service Row
          </Button>

          <div className="mt-4 flex justify-end text-lg font-semibold">
            Total: Rs {formatAmount(totalAmount)}
          </div>

          <Button type="submit" disabled={loading}>
            {loading
              ? "Submitting..."
              : editingInvoice
                ? "Update & Resubmit"
                : "Submit Request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
