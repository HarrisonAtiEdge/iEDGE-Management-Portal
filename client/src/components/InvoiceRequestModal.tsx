// import { useState, useEffect } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import { Eye, Pencil, Copy, Trash2 } from "lucide-react";
// import {
//   collection,
//   addDoc,
//   serverTimestamp,
//   doc,
//   updateDoc,
//   runTransaction,
//   getDocs,
//   query,
//   orderBy,
//   getDoc,
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
// import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
// import { format } from "date-fns";
// import { CalendarIcon } from "lucide-react";

// const PANEL_ID = "IEDGE-SYSTEM";

// type InvoiceType = "general" | "project";

// export default function InvoiceRequestModal({
//   isOpen,
//   onClose,
//   onSuccess,
//   editingInvoice = null,
// }: any) {
//   const { userProfile } = useAuth();
//   const { toast } = useToast();
//   const [loading, setLoading] = useState(false);
//   const [invoiceType, setInvoiceType] = useState<InvoiceType>("general");
//   /* ===================== ESTIMATES ===================== */
//   const [estimates, setEstimates] = useState<any[]>([]);
//   const [selectedEstimateId, setSelectedEstimateId] = useState("");
//   const [subject, setSubject] = useState("");
//   const [message, setMessage] = useState("");
//   /* ===================== FORM DATA ===================== */
//   const [formData, setFormData] = useState({
//     requestId: "",
//     clientName: "",
//     project: "",
//     projectCode: "", // 🔥 MANUAL
//     title: "",
//     comment: "",
//   });

//   /* ===================== LINE ITEMS ===================== */
//   const [lineItems, setLineItems] = useState([
//     {
//       id: 1,
//       date: "",
//       service: "",
//       description: "",
//       vendor: "",
//       units: "",
//       unitRate: "",
//       tax: "",
//       total: 0,
//       comment: "",
//     },
//   ]);

//   /* ===================== FETCH ESTIMATES ===================== */
//   useEffect(() => {
//     if (!isOpen || invoiceType !== "project") return;

//     (async () => {
//       const snap = await getDocs(
//         collection(db, "Panels", PANEL_ID, "estimates")
//       );

//       setEstimates(
//         snap.docs.map((d) => ({
//           id: d.id,
//           ...d.data(),
//         }))
//       );
//     })();
//   }, [isOpen, invoiceType]);

//   useEffect(() => {
//     if (invoiceType === "general") {
//       setSubject("");
//       setMessage("");
//     }
//   }, [invoiceType]);

//   /* ===================== ESTIMATE SELECT ===================== */

//   function handleEstimateSelect(id: string) {
//     setSelectedEstimateId(id);

//     const est = estimates.find((e) => e.id === id);
//     if (!est) return;

//     console.log("Selected Estimate:", est); // debug (optional)

//     setFormData((prev) => ({
//       ...prev,
//       clientName: est.client || "", // ✅ FIX
//       title: est.subject || "", // ✅ FIX
//       project: est.projectOwner || "", // ✅ FIX
//       // ❌ projectCode yahan intentionally NAHI
//     }));
//   }

//   /* ===================== LINE ITEM LOGIC ===================== */

//   function updateLineItem(id: number, field: string, value: string) {
//     setLineItems((prev) =>
//       prev.map((item) => {
//         if (item.id !== id) return item;

//         const updated: any = { ...item, [field]: value };

//         const units =
//           updated.units === "" || updated.units === "."
//             ? 0
//             : parseFloat(updated.units);

//         const rate =
//           updated.unitRate === "" || updated.unitRate === "."
//             ? 0
//             : parseFloat(updated.unitRate);

//         const tax =
//           updated.tax === "" || updated.tax === "."
//             ? 0
//             : parseFloat(updated.tax);

//         updated.total = (units || 0) * (rate || 0) + (tax || 0);

//         return updated;
//       })
//     );
//   }

//   function addLineItem() {
//     setLineItems((prev) => [
//       ...prev,
//       {
//         id: prev.length + 1,
//         date: "",
//         service: "",
//         description: "",
//         vendor: "",
//         units: "",
//         unitRate: "",
//         tax: "",
//         total: 0,
//         comment: "",
//       },
//     ]);
//   }

//   function removeLineItem(id: number) {
//     if (lineItems.length > 1) {
//       setLineItems((prev) => prev.filter((i) => i.id !== id));
//     }
//   }

//   const totalAmount = lineItems.reduce((s, i) => s + i.total, 0);

//   /* ===================== SUBMIT ===================== */

//   async function handleSubmit(e: any) {
//     e.preventDefault();
//     if (!userProfile) return;

//     try {
//       setLoading(true);

//       // 🔹 CREATE MODE
//       if (!editingInvoice) {
//         const requestId = await generateRequestId();

//         await addDoc(collection(db, "Panels", PANEL_ID, "invoiceRequests"), {
//           requestId,
//           invoiceType,
//           estimateId: selectedEstimateId,
//           clientName: formData.clientName,
//           project: formData.project,
//           projectCode: formData.projectCode,
//           title: formData.title,
//           lineItems,
//           totalAmount,
//           subject,
//           message,

//           status: "pending_main_admin", // ✅ changed
//           submittedAt: serverTimestamp(),
//           editDate: null,
//           submittedBy: userProfile.id,
//         });

//         toast({ title: "Payment request submitted" });
//       }

//       // 🔹 EDIT / RESUBMIT MODE
//       else {

//         await updateDoc(
//           doc(db, "Panels", PANEL_ID, "invoiceRequests", editingInvoice.id),
//           {
//             estimateId: selectedEstimateId,
//             clientName: formData.clientName,
//             project: formData.project,
//             projectCode: formData.projectCode,
//             title: formData.title,
//             lineItems,
//             totalAmount,
//             subject,
//             message,

//             status: "pending_main_admin", // ✅ changed
//             editDate: serverTimestamp(),
//           }
//         );

//         toast({ title: "Payment request resubmitted" });
//       }

//       onSuccess();
//     } catch (err) {
//       console.error(err);
//       toast({ title: "Error", variant: "destructive" });
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
//       "invoiceRequests"
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


//   useEffect(() => {
//     if (!editingInvoice) return;

//     setInvoiceType(editingInvoice.invoiceType || "project");
//     setSelectedEstimateId(editingInvoice.estimateId || "");

//     setFormData({
//       requestId: editingInvoice.requestId,
//       clientName: editingInvoice.clientName || "",
//       project: editingInvoice.project || "",
//       projectCode: editingInvoice.projectCode || "",
//       title: editingInvoice.title || "",
//       comment: editingInvoice.comment || "",
//     });

//     // ✅ SAFE LINE ITEMS (EDIT MODE FIX)
//     setLineItems(
//       editingInvoice.lineItems?.length
//         ? editingInvoice.lineItems
//         : [
//           {
//             id: 1,
//             date: "",
//             service: "",
//             description: "",
//             vendor: "",
//             units: "",
//             unitRate: "",
//             tax: "",
//             total: 0,
//             comment: "",
//           },
//         ]
//     );
//   }, [editingInvoice]);

//   /* ===================== UI ===================== */
//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       {/* <DialogContent className="max-w-6xl"> */}
//       <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle>New Payment Request</DialogTitle>
//         </DialogHeader>

//         <form onSubmit={handleSubmit} className="space-y-6">
//           {/* Tabs */}
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

//           {/* Estimate */}

//           {/* {invoiceType === "general" && (
//             <div className="grid grid-cols-1 gap-4">
              
//               <div>
//                 <Label>Subject *</Label>
//                 <Input
//                   value={subject}
//                   onChange={(e) => setSubject(e.target.value)}
//                   placeholder="Enter invoice subject"
//                   required
//                 />
//               </div>

             
//               <div>
//                 <Label>Message *</Label>
//                 <Textarea
//                   value={message}
//                   onChange={(e) => setMessage(e.target.value)}
//                   placeholder="Enter invoice message"
//                   rows={4}
//                   required
//                 />
//               </div>
//             </div>
//           )} */}

//           {invoiceType === "general" && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

//               <div>
//                 <Label>Client Name *</Label>
//                 <Input
//                   value={formData.clientName}
//                   onChange={(e) =>
//                     setFormData({ ...formData, clientName: e.target.value })
//                   }
//                   placeholder="Enter client name"
//                   required
//                 />
//               </div>

//               <div>
//                 <Label>Title *</Label>
//                 <Input
//                   value={formData.title}
//                   onChange={(e) =>
//                     setFormData({ ...formData, title: e.target.value })
//                   }
//                   placeholder="Enter invoice title"
//                   required
//                 />
//               </div>

//               <div>
//                 <Label>Subject *</Label>
//                 <Input
//                   value={subject}
//                   onChange={(e) => setSubject(e.target.value)}
//                   placeholder="Enter invoice subject"
//                   required
//                 />
//               </div>

//               <div className="md:col-span-2">
//                 <Label>Message *</Label>
//                 <Textarea
//                   value={message}
//                   onChange={(e) => setMessage(e.target.value)}
//                   placeholder="Enter invoice message"
//                   rows={4}
//                   required
//                 />
//               </div>

//             </div>
//           )}

//           {invoiceType === "project" && (
//             <div>
//               <Label>Estimate No *</Label>
//               <select
//                 className="w-full border h-10 px-3"
//                 value={selectedEstimateId}
//                 onChange={(e) => handleEstimateSelect(e.target.value)}
//               >
//                 <option value="">Select Estimate</option>
//                 {estimates.map((e) => (
//                   <option key={e.id} value={e.id}>
//                     {e.estimateNo}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           )}

//           {invoiceType === "project" && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {/* Client Name */}
//               <div>
//                 <Label>Client Name</Label>
//                 <Input
//                   value={formData.clientName}
//                   readOnly
//                   className="bg-gray-100"
//                   placeholder="Auto-filled from estimate"
//                 />
//               </div>

//               {/* Subject */}
//               <div>
//                 <Label>Subject</Label>
//                 <Input
//                   value={formData.title}
//                   readOnly
//                   className="bg-gray-100"
//                   placeholder="Auto-filled from estimate"
//                 />
//               </div>

//               {/* Project */}
//               <div>
//                 <Label>Project</Label>
//                 <Input
//                   value={formData.project}
//                   readOnly
//                   className="bg-gray-100"
//                   placeholder="Auto-filled from estimate"
//                 />
//               </div>

//               {/* Project Code (Manual) */}
//               <div>
//                 <Label>Project Code *</Label>
//                 <Input
//                   value={formData.projectCode}
//                   onChange={(e) =>
//                     setFormData({ ...formData, projectCode: e.target.value })
//                   }
//                   placeholder="Enter project code manually"
//                 />
//               </div>
//             </div>
//           )}

//           {/* <table className="w-full border">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th>Date</th>
//                 <th>Service</th>
//                 <th>Description</th>
//                 <th>Vendor</th>
//                 <th>Units</th>
//                 <th>Rate</th>
//                 <th>Tax</th>
//                 <th>Total</th>
//                 <th>Comment</th>
//                 <th></th>
//               </tr>
//             </thead>

//             <tbody>
//               {lineItems.map((i) => (
//                 <tr key={i.id}> */}

//           <div className="border rounded-lg overflow-auto">
//             <table className="w-full text-sm border-collapse">
//               <thead className="bg-gray-100 text-gray-700">
//                 <tr className="h-12">
//                   <th className="px-2 min-w-[130px]">Date</th>
//                   <th className="px-2 min-w-[150px]">Service</th>
//                   <th className="px-2 min-w-[220px]">Description</th>
//                   <th className="px-2 min-w-[160px]">Vendor</th>
//                   <th className="px-2 w-[90px] text-center">Units</th>
//                   <th className="px-2 w-[110px] text-center">Rate</th>
//                   <th className="px-2 w-[90px] text-center">Tax</th>
//                   <th className="px-2 w-[120px] text-right">Total</th>
//                   <th className="px-2 min-w-[200px]">Comment</th>
//                   <th className="w-[50px]"></th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {lineItems.map((i) => (
//                   <tr key={i.id} className="border-t hover:bg-gray-50 h-14">
//                     {/* DATE */}
//                     <td>
//                       {/* <Input
//                       type="date"
//                       value={i.date}
//                       onChange={(e) =>
//                         updateLineItem(i.id, "date", e.target.value)
//                       }
//                     /> */}
//                       <Popover>
//                         <PopoverTrigger asChild>
//                           <Button
//                             variant="outline"
//                             className="w-[180px] justify-start text-left font-normal"
//                           >
//                             <CalendarIcon className="mr-2 h-4 w-4" />
//                             {i.date ? format(new Date(i.date), "PPP") : "Pick date"}
//                           </Button>
//                         </PopoverTrigger>

//                         <PopoverContent className="w-auto p-0">
//                           <Calendar
//                             mode="single"
//                             selected={i.date ? new Date(i.date) : undefined}
//                             onSelect={(date) =>
//                               updateLineItem(i.id, "date", date?.toISOString() || "")
//                             }
//                             initialFocus
//                           />
//                         </PopoverContent>
//                       </Popover>
//                     </td>

//                     {/* SERVICE */}
//                     <td>
//                       {/* <Input
//                       value={i.service}
//                       onChange={(e) =>
//                         updateLineItem(i.id, "service", e.target.value)
//                       }
//                     /> */}
//                       <Input
//                         className="h-9 text-sm"
//                         value={i.service}
//                         onChange={(e) =>
//                           updateLineItem(i.id, "service", e.target.value)
//                         }
//                       />
//                     </td>

//                     {/* DESCRIPTION */}
//                     <td>
//                       {/* <Input
//                       value={i.description}
//                       onChange={(e) =>
//                         updateLineItem(i.id, "description", e.target.value)
//                       }
//                     /> */}
//                       <Input
//                         className="h-9 text-sm"
//                         value={i.description}
//                         onChange={(e) =>
//                           updateLineItem(i.id, "description", e.target.value)
//                         }
//                       />
//                     </td>

//                     {/* VENDOR */}
//                     <td>
//                       {/* <Input
//                       value={i.vendor}
//                       onChange={(e) =>
//                         updateLineItem(i.id, "vendor", e.target.value)
//                       }
//                     /> */}
//                       <Input
//                         className="h-9 text-sm"
//                         value={i.vendor}
//                         onChange={(e) =>
//                           updateLineItem(i.id, "vendor", e.target.value)
//                         }
//                       />
//                     </td>

//                     {/* UNITS */}
//                     <td>
//                       {/* <Input
//                       type="number"
//                       step="0.01"
//                       min="0"
//                       value={i.units}
//                       onChange={(e) =>
//                         updateLineItem(i.id, "units", e.target.value)
//                       }
//                     /> */}
//                       <Input
//                         type="number"
//                         step="0.01"
//                         min="0"
//                         className="h-9 text-sm text-center"
//                         value={i.units}
//                         onChange={(e) =>
//                           updateLineItem(i.id, "units", e.target.value)
//                         }
//                       />
//                     </td>

//                     {/* RATE */}
//                     <td>
//                       {/* <Input
//                       type="number"
//                       step="0.01"
//                       min="0"
//                       value={i.unitRate}
//                       onChange={(e) =>
//                         updateLineItem(i.id, "unitRate", e.target.value)
//                       }
//                     /> */}
//                       <Input
//                         type="number"
//                         step="0.01"
//                         min="0"
//                         className="h-9 text-sm text-center"
//                         value={i.unitRate}
//                         onChange={(e) =>
//                           updateLineItem(i.id, "unitRate", e.target.value)
//                         }
//                       />
//                     </td>

//                     {/* TAX */}
//                     <td>
//                       {/* <Input
//                       type="number"
//                       step="0.01"
//                       min="0"
//                       value={i.tax}
//                       onChange={(e) =>
//                         updateLineItem(i.id, "tax", e.target.value)
//                       }
//                     /> */}
//                       <Input
//                         type="number"
//                         step="0.01"
//                         min="0"
//                         className="h-9 text-sm text-center"
//                         value={i.tax}
//                         onChange={(e) =>
//                           updateLineItem(i.id, "tax", e.target.value)
//                         }
//                       />
//                     </td>

//                     {/* TOTAL */}
//                     {/* <td className="font-semibold text-right">
//                     {Number(i.total || 0).toFixed(2)}
//                   </td> */}
//                     <td className="font-semibold text-right pr-3">
//                       {Number(i.total || 0).toFixed(2)}
//                     </td>

//                     {/* COMMENT */}
//                     <td>
//                       {/* <Input
//                       value={i.comment}
//                       onChange={(e) =>
//                         updateLineItem(i.id, "comment", e.target.value)
//                       }
//                     /> */}
//                       <Input
//                         className="h-9 text-sm"
//                         value={i.comment}
//                         onChange={(e) =>
//                           updateLineItem(i.id, "comment", e.target.value)
//                         }
//                       />
//                     </td>

//                     {/* DELETE */}
//                     <td className="text-center">
//                       <button
//                         type="button"
//                         onClick={() => removeLineItem(i.id)}
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

//           {/* <Button type="button" onClick={addLineItem}>
//             Add Row
//           </Button> */}
//           <Button
//             type="button"
//             onClick={addLineItem}
//             className="mt-2"
//           >
//             + Add Service Row
//           </Button>

//           {/* <div className="text-right font-bold"> */}
//           <div className="flex justify-end text-lg font-semibold mt-4">
//             Total: Rs {totalAmount.toFixed(2)}
//           </div>

//           {/* <Button type="submit" disabled={loading}>
//             {loading ? "Submitting..." : "Submit Invoice"}
//           </Button> */}
//           <Button type="submit" disabled={loading}>
//             {loading
//               ? "Submitting..."
//               : editingInvoice
//                 ? "Update & Resubmit"
//                 : "Submit Invoice"}
//           </Button>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }

import { useState, useEffect } from "react";
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
  PopoverTrigger,
  PopoverContent,
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
  tax: string;
  total: number;
  comment: string;
};

export default function InvoiceRequestModal({
  isOpen,
  onClose,
  onSuccess,
  editingInvoice = null,
}: any) {
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [invoiceType, setInvoiceType] = useState<InvoiceType>("general");

  const [estimates, setEstimates] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedEstimateId, setSelectedEstimateId] = useState("");
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
      tax: "",
      total: 0,
      comment: "",
    },
  ]);

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
    return estimate?.projectOwner || estimate?.project || estimate?.projectName || "";
  }

  /* ===================== FETCH SUPPLIERS ===================== */
  useEffect(() => {
    if (!isOpen) return;

    const fetchSuppliers = async () => {
      try {
        const snap = await getDocs(
          collection(db, "Panels", PANEL_ID, "suppliers")
        );

        const data = snap.docs
          .map((d) => ({
            id: d.id,
            ...d.data(),
          }))
          .sort((a, b) =>
            getSupplierDisplayName(a).localeCompare(getSupplierDisplayName(b))
          );

        setSuppliers(data);
      } catch (error) {
        console.error("Failed to fetch suppliers:", error);
      }
    };

    fetchSuppliers();
  }, [isOpen]);

  /* ===================== FETCH ESTIMATES ===================== */
  useEffect(() => {
    if (!isOpen || invoiceType !== "project") return;

    const fetchEstimates = async () => {
      try {
        const snap = await getDocs(
          collection(db, "Panels", PANEL_ID, "estimates")
        );

        setEstimates(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
      } catch (error) {
        console.error("Failed to fetch estimates:", error);
      }
    };

    fetchEstimates();
  }, [isOpen, invoiceType]);

  /* ===================== RESET WHEN GENERAL ===================== */
  useEffect(() => {
    if (invoiceType === "general") {
      setSelectedEstimateId("");
      setFormData((prev) => ({
        ...prev,
        clientName: "",
        project: "",
        projectCode: "",
      }));
    }
  }, [invoiceType]);

  /* ===================== ESTIMATE SELECT ===================== */
  function handleEstimateSelect(id: string) {
    setSelectedEstimateId(id);

    const est = estimates.find((e) => e.id === id);
    if (!est) return;

    setFormData((prev) => ({
      ...prev,
      clientName: getEstimateClientName(est),
      title: getEstimateTitle(est),
      project: getEstimateProjectName(est),
      projectCode: getEstimateProjectCode(est),
    }));
  }

  /* ===================== LINE ITEM LOGIC ===================== */
  function updateLineItem(id: number, field: keyof LineItem, value: string) {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        const units =
          updated.units === "" || updated.units === "."
            ? 0
            : parseFloat(updated.units);

        const rate =
          updated.unitRate === "" || updated.unitRate === "."
            ? 0
            : parseFloat(updated.unitRate);

        const tax =
          updated.tax === "" || updated.tax === "."
            ? 0
            : parseFloat(updated.tax);

        updated.total = (units || 0) * (rate || 0) + (tax || 0);

        return updated;
      })
    );
  }

  function addLineItem() {
    setLineItems((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        date: "",
        service: "",
        description: "",
        vendor: "",
        units: "",
        unitRate: "",
        tax: "",
        total: 0,
        comment: "",
      },
    ]);
  }

  function removeLineItem(id: number) {
    if (lineItems.length > 1) {
      setLineItems((prev) => prev.filter((i) => i.id !== id));
    }
  }

  const totalAmount = lineItems.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );

  /* ===================== SUBMIT ===================== */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userProfile) return;

    try {
      setLoading(true);

      if (!editingInvoice) {
        const requestId = await generateRequestId();

        await addDoc(collection(db, "Panels", PANEL_ID, "invoiceRequests"), {
          requestId,
          invoiceType,
          estimateId: selectedEstimateId || "",
          clientName: invoiceType === "project" ? formData.clientName : "",
          project: invoiceType === "project" ? formData.project : "",
          projectCode: invoiceType === "project" ? formData.projectCode : "",
          title: formData.title,
          lineItems,
          totalAmount,
          subject,
          message,
          status: "pending_main_admin",
          submittedAt: serverTimestamp(),
          editDate: null,
          submittedBy: userProfile.id,
        });

        toast({ title: "Payment request submitted" });
      } else {
        await updateDoc(
          doc(db, "Panels", PANEL_ID, "invoiceRequests", editingInvoice.id),
          {
            invoiceType,
            estimateId: selectedEstimateId || "",
            clientName: invoiceType === "project" ? formData.clientName : "",
            project: invoiceType === "project" ? formData.project : "",
            projectCode: invoiceType === "project" ? formData.projectCode : "",
            title: formData.title,
            lineItems,
            totalAmount,
            subject,
            message,
            status: "pending_main_admin",
            editDate: serverTimestamp(),
          }
        );

        toast({ title: "Payment request resubmitted" });
      }

      onSuccess();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function generateRequestId() {
    const counterRef = doc(
      db,
      "Panels",
      PANEL_ID,
      "counters",
      "invoiceRequests"
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

  /* ===================== EDIT MODE ===================== */
  useEffect(() => {
    if (!editingInvoice) return;

    setInvoiceType(editingInvoice.invoiceType || "project");
    setSelectedEstimateId(editingInvoice.estimateId || "");
    setSubject(editingInvoice.subject || "");
    setMessage(editingInvoice.message || "");

    setFormData({
      requestId: editingInvoice.requestId || "",
      clientName: editingInvoice.clientName || "",
      project: editingInvoice.project || "",
      projectCode: editingInvoice.projectCode || "",
      title: editingInvoice.title || "",
      comment: editingInvoice.comment || "",
    });

    setLineItems(
      editingInvoice.lineItems?.length
        ? editingInvoice.lineItems
        : [
            {
              id: 1,
              date: "",
              service: "",
              description: "",
              vendor: "",
              units: "",
              unitRate: "",
              tax: "",
              total: 0,
              comment: "",
            },
          ]
    );
  }, [editingInvoice]);

  /* ===================== UI ===================== */
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingInvoice ? "Edit Payment Request" : "New Payment Request"}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter invoice title"
                  required
                />
              </div>

              <div>
                <Label>Subject *</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter invoice subject"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label>Message *</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter invoice message"
                  rows={4}
                  required
                />
              </div>
            </div>
          )}

          {invoiceType === "project" && (
            <div>
              <Label>Estimate No *</Label>
              <select
                className="w-full border rounded-md h-10 px-3"
                value={selectedEstimateId}
                onChange={(e) => handleEstimateSelect(e.target.value)}
                required
              >
                <option value="">Select Estimate</option>
                {estimates.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.estimateNo || e.estimateNumber || e.id}
                  </option>
                ))}
              </select>
            </div>
          )}

          {invoiceType === "project" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="border rounded-lg overflow-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-100 text-gray-700">
                <tr className="h-12">
                  <th className="px-2 min-w-[130px]">Date</th>
                  <th className="px-2 min-w-[150px]">Service</th>
                  <th className="px-2 min-w-[220px]">Description</th>
                  <th className="px-2 min-w-[180px]">Vendor</th>
                  <th className="px-2 w-[90px] text-center">Units</th>
                  <th className="px-2 w-[110px] text-center">Rate</th>
                  <th className="px-2 w-[90px] text-center">Tax</th>
                  <th className="px-2 w-[120px] text-right">Total</th>
                  <th className="px-2 min-w-[200px]">Comment</th>
                  <th className="w-[50px]"></th>
                </tr>
              </thead>

              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.id} className="border-t hover:bg-gray-50 h-14">
                    <td className="px-2 py-2">
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
                            selected={item.date ? new Date(item.date) : undefined}
                            onSelect={(date) =>
                              updateLineItem(
                                item.id,
                                "date",
                                date?.toISOString() || ""
                              )
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </td>

                    <td className="px-2 py-2">
                      <Input
                        className="h-9 text-sm"
                        value={item.service}
                        onChange={(e) =>
                          updateLineItem(item.id, "service", e.target.value)
                        }
                      />
                    </td>

                    <td className="px-2 py-2">
                      <Input
                        className="h-9 text-sm"
                        value={item.description}
                        onChange={(e) =>
                          updateLineItem(item.id, "description", e.target.value)
                        }
                      />
                    </td>

                    <td className="px-2 py-2">
                      <div>
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
                      </div>
                    </td>

                    <td className="px-2 py-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="h-9 text-sm text-center"
                        value={item.units}
                        onChange={(e) =>
                          updateLineItem(item.id, "units", e.target.value)
                        }
                      />
                    </td>

                    <td className="px-2 py-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="h-9 text-sm text-center"
                        value={item.unitRate}
                        onChange={(e) =>
                          updateLineItem(item.id, "unitRate", e.target.value)
                        }
                      />
                    </td>

                    <td className="px-2 py-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="h-9 text-sm text-center"
                        value={item.tax}
                        onChange={(e) =>
                          updateLineItem(item.id, "tax", e.target.value)
                        }
                      />
                    </td>

                    <td className="font-semibold text-right pr-3">
                      {Number(item.total || 0).toFixed(2)}
                    </td>

                    <td className="px-2 py-2">
                      <Input
                        className="h-9 text-sm"
                        value={item.comment}
                        onChange={(e) =>
                          updateLineItem(item.id, "comment", e.target.value)
                        }
                      />
                    </td>

                    <td className="text-center px-2 py-2">
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

          <div className="flex justify-end text-lg font-semibold mt-4">
            Total: Rs {totalAmount.toFixed(2)}
          </div>

          <Button type="submit" disabled={loading}>
            {loading
              ? "Submitting..."
              : editingInvoice
              ? "Update & Resubmit"
              : "Submit Invoice"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}