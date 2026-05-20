// import React, { useEffect, useMemo, useState } from "react";
// import {
//   addDoc,
//   collection,
//   deleteDoc,
//   doc,
//   getDocs,
//   serverTimestamp,
//   setDoc,
// } from "firebase/firestore";
// import { Plus, Trash2, Save, FileText } from "lucide-react";

// import { db } from "@/lib/firebase";
// import { useToast } from "@/hooks/use-toast";
// import { useAuth } from "@/contexts/AuthContext";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Checkbox } from "@/components/ui/checkbox";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { TicketPrintable } from "./ticketPrintable";

// const PANEL_ID = "IEDGE-SYSTEM";

// export type PassengerInfo = {
//   title: string;
//   firstName: string;
//   lastName: string;
//   passportNo: string;
//   nationality: string;
//   dateOfBirth: string;
// };

// export type FlightInfo = {
//   airline: string;
//   flightNo: string;
//   pnr: string;
//   ticketNo: string;
//   from: string;
//   to: string;
//   departureDate: string;
//   departureTime: string;
//   arrivalDate: string;
//   arrivalTime: string;
//   baggage: string;
// };

// export type HotelInfo = {
//   hotelName: string;
//   city: string;
//   checkIn: string;
//   checkOut: string;
//   roomType: string;
//   mealPlan: string;
//   confirmationNo: string;
// };

// type ProjectOption = {
//   id: string;
//   projectName: string;
//   clientName: string;
//   contactPerson: string;
//   contactNo: string;
//   email: string;
//   destination: string;
// };

// export type TicketFormData = {
//   selectedProjectId: string;

//   referenceNo: string;
//   serviceType: string;
//   bookingStatus: string;

//   clientName: string;
//   contactPerson: string;
//   contactNo: string;
//   email: string;

//   projectName: string;
//   destination: string;
//   issueDate: string;
//   travelStartDate: string;
//   travelEndDate: string;

//   currency: string;
//   baseAmount: string;
//   taxAmount: string;
//   discountAmount: string;
//   totalAmount: string;
//   paidAmount: string;

//   showTicketPrice: boolean;

//   passengers: PassengerInfo[];
//   flights: FlightInfo[];
//   hotels: HotelInfo[];

//   notes: string;
//   termsAndConditions: string;
// };

// type TicketFormInitialData = Partial<TicketFormData> & {
//   createdAt?: any;
//   createdById?: string;
//   createdByName?: string;
// };

// type TicketFormProps = {
//   editingRecordId?: string | null;
//   editingSource?: "new" | "old" | null;
//   initialData?: TicketFormInitialData | null;
//   onSaved?: (recordId: string) => void;
//   onCancel?: () => void;
// };

// const emptyPassenger: PassengerInfo = {
//   title: "Mr",
//   firstName: "",
//   lastName: "",
//   passportNo: "",
//   nationality: "",
//   dateOfBirth: "",
// };

// const emptyFlight: FlightInfo = {
//   airline: "",
//   flightNo: "",
//   pnr: "",
//   ticketNo: "",
//   from: "",
//   to: "",
//   departureDate: "",
//   departureTime: "",
//   arrivalDate: "",
//   arrivalTime: "",
//   baggage: "",
// };

// const emptyHotel: HotelInfo = {
//   hotelName: "",
//   city: "",
//   checkIn: "",
//   checkOut: "",
//   roomType: "",
//   mealPlan: "",
//   confirmationNo: "",
// };

// const defaultFormData: TicketFormData = {
//   selectedProjectId: "",

//   referenceNo: "",
//   serviceType: "Air Ticket",
//   bookingStatus: "Draft",

//   clientName: "",
//   contactPerson: "",
//   contactNo: "",
//   email: "",

//   projectName: "",
//   destination: "",
//   issueDate: new Date().toISOString().slice(0, 10),
//   travelStartDate: "",
//   travelEndDate: "",

//   currency: "PKR",
//   baseAmount: "",
//   taxAmount: "",
//   discountAmount: "",
//   totalAmount: "",
//   paidAmount: "",

//   showTicketPrice: true,

//   passengers: [{ ...emptyPassenger }],
//   flights: [{ ...emptyFlight }],
//   hotels: [],

//   notes: "",
//   termsAndConditions: "",
// };

// function getNewTicketsCollectionRef() {
//   return collection(db, "Panels", PANEL_ID, "Travel", "Tickets", "Records");
// }

// function getNewTicketDocRef(ticketId: string) {
//   return doc(
//     db,
//     "Panels",
//     PANEL_ID,
//     "Travel",
//     "Tickets",
//     "Records",
//     ticketId
//   );
// }

// function getOldTicketDocRef(ticketId: string) {
//   return doc(db, "Panels", PANEL_ID, "Travel", ticketId);
// }

// function toNumber(value: string | number | undefined | null) {
//   const parsed = Number(value || 0);
//   return Number.isFinite(parsed) ? parsed : 0;
// }

// function normalizeString(value: any) {
//   if (value === undefined || value === null) return "";
//   return String(value);
// }

// function getFreshDefaultFormData(): TicketFormData {
//   return {
//     ...defaultFormData,
//     issueDate: new Date().toISOString().slice(0, 10),
//     passengers: [{ ...emptyPassenger }],
//     flights: [{ ...emptyFlight }],
//     hotels: [],
//   };
// }

// function buildInitialFormData(
//   initialData?: TicketFormInitialData | null
// ): TicketFormData {
//   const freshDefault = getFreshDefaultFormData();

//   if (!initialData) return freshDefault;

//   return {
//     ...freshDefault,

//     selectedProjectId: normalizeString(initialData.selectedProjectId),

//     referenceNo: normalizeString(initialData.referenceNo),
//     serviceType: normalizeString(
//       initialData.serviceType || freshDefault.serviceType
//     ),
//     bookingStatus: normalizeString(
//       initialData.bookingStatus || freshDefault.bookingStatus
//     ),

//     clientName: normalizeString(initialData.clientName),
//     contactPerson: normalizeString(initialData.contactPerson),
//     contactNo: normalizeString(initialData.contactNo),
//     email: normalizeString(initialData.email),

//     projectName: normalizeString(initialData.projectName),
//     destination: normalizeString(initialData.destination),
//     issueDate: normalizeString(initialData.issueDate || freshDefault.issueDate),
//     travelStartDate: normalizeString(initialData.travelStartDate),
//     travelEndDate: normalizeString(initialData.travelEndDate),

//     currency: normalizeString(initialData.currency || freshDefault.currency),
//     baseAmount: normalizeString(initialData.baseAmount),
//     taxAmount: normalizeString(initialData.taxAmount),
//     discountAmount: normalizeString(initialData.discountAmount),
//     totalAmount: normalizeString(initialData.totalAmount),
//     paidAmount: normalizeString(initialData.paidAmount),

//     showTicketPrice:
//       initialData.showTicketPrice ?? freshDefault.showTicketPrice,

//     passengers: initialData.passengers?.length
//       ? initialData.passengers
//       : freshDefault.passengers,
//     flights: initialData.flights?.length
//       ? initialData.flights
//       : freshDefault.flights,
//     hotels: initialData.hotels?.length
//       ? initialData.hotels
//       : freshDefault.hotels,

//     notes: normalizeString(initialData.notes),
//     termsAndConditions: normalizeString(initialData.termsAndConditions),
//   };
// }

// export default function TicketForm({
//   editingRecordId,
//   editingSource = "new",
//   initialData,
//   onSaved,
//   onCancel,
// }: TicketFormProps) {
//   const { toast } = useToast();
//   const { currentUser, userProfile } = useAuth();

//   const [loading, setLoading] = useState(false);
//   const [showPreview, setShowPreview] = useState(false);

//   const [projects, setProjects] = useState<ProjectOption[]>([]);
//   const [projectsLoading, setProjectsLoading] = useState(false);

//   const [formData, setFormData] = useState<TicketFormData>(() =>
//     buildInitialFormData(initialData)
//   );

//   useEffect(() => {
//     setFormData(buildInitialFormData(initialData));
//     setShowPreview(false);
//   }, [editingRecordId, initialData]);

//   useEffect(() => {
//     const fetchProjects = async () => {
//       setProjectsLoading(true);

//       try {
//         const projectsRef = collection(
//           db,
//           "Panels",
//           PANEL_ID,
//           "salesRecords"
//         );

//         const snapshot = await getDocs(projectsRef);

//         const list: ProjectOption[] = snapshot.docs.map((docSnap) => {
//           const data: any = docSnap.data();

//           return {
//             id: docSnap.id,
//             projectName:
//               data.projectName ||
//               data.projectTitle ||
//               data.name ||
//               data.title ||
//               `Project ${docSnap.id}`,
//             clientName: data.clientName || data.client || "",
//             contactPerson: data.contactPerson || "",
//             contactNo:
//               data.contactNo || data.contactMobile || data.mobile || "",
//             email: data.email || data.clientEmail || "",
//             destination: data.destination || "",
//           };
//         });

//         list.sort((a, b) =>
//           String(a.projectName || "").localeCompare(String(b.projectName || ""))
//         );

//         setProjects(list);
//       } catch (error) {
//         console.error("Error fetching projects:", error);

//         toast({
//           title: "Error",
//           description: "Failed to fetch projects.",
//           variant: "destructive",
//         });
//       } finally {
//         setProjectsLoading(false);
//       }
//     };

//     fetchProjects();
//   }, [toast]);

//   const calculatedTotal = useMemo(() => {
//     const base = toNumber(formData.baseAmount);
//     const tax = toNumber(formData.taxAmount);
//     const discount = toNumber(formData.discountAmount);

//     return Math.max(base + tax - discount, 0);
//   }, [formData.baseAmount, formData.taxAmount, formData.discountAmount]);

//   const remainingAmount = useMemo(() => {
//     return Math.max(calculatedTotal - toNumber(formData.paidAmount), 0);
//   }, [calculatedTotal, formData.paidAmount]);

//   const setField = <K extends keyof TicketFormData>(
//     field: K,
//     value: TicketFormData[K]
//   ) => {
//     setFormData((prev) => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   const handleProjectSelect = (projectId: string) => {
//     const selectedProject = projects.find((project) => project.id === projectId);

//     if (!selectedProject) return;

//     setFormData((prev) => ({
//       ...prev,
//       selectedProjectId: selectedProject.id,
//       projectName: selectedProject.projectName || "",
//       clientName: selectedProject.clientName || "",
//       contactPerson: selectedProject.contactPerson || "",
//       contactNo: selectedProject.contactNo || "",
//       email: selectedProject.email || "",
//       destination: selectedProject.destination || prev.destination,
//     }));
//   };

//   const updatePassenger = (
//     index: number,
//     field: keyof PassengerInfo,
//     value: string
//   ) => {
//     setFormData((prev) => ({
//       ...prev,
//       passengers: prev.passengers.map((item, i) =>
//         i === index ? { ...item, [field]: value } : item
//       ),
//     }));
//   };

//   const addPassenger = () => {
//     setFormData((prev) => ({
//       ...prev,
//       passengers: [...prev.passengers, { ...emptyPassenger }],
//     }));
//   };

//   const removePassenger = (index: number) => {
//     setFormData((prev) => ({
//       ...prev,
//       passengers:
//         prev.passengers.length > 1
//           ? prev.passengers.filter((_, i) => i !== index)
//           : prev.passengers,
//     }));
//   };

//   const updateFlight = (
//     index: number,
//     field: keyof FlightInfo,
//     value: string
//   ) => {
//     setFormData((prev) => ({
//       ...prev,
//       flights: prev.flights.map((item, i) =>
//         i === index ? { ...item, [field]: value } : item
//       ),
//     }));
//   };

//   const addFlight = () => {
//     setFormData((prev) => ({
//       ...prev,
//       flights: [...prev.flights, { ...emptyFlight }],
//     }));
//   };

//   const removeFlight = (index: number) => {
//     setFormData((prev) => ({
//       ...prev,
//       flights:
//         prev.flights.length > 1
//           ? prev.flights.filter((_, i) => i !== index)
//           : prev.flights,
//     }));
//   };

//   const updateHotel = (
//     index: number,
//     field: keyof HotelInfo,
//     value: string
//   ) => {
//     setFormData((prev) => ({
//       ...prev,
//       hotels: prev.hotels.map((item, i) =>
//         i === index ? { ...item, [field]: value } : item
//       ),
//     }));
//   };

//   const addHotel = () => {
//     setFormData((prev) => ({
//       ...prev,
//       hotels: [...prev.hotels, { ...emptyHotel }],
//     }));
//   };

//   const removeHotel = (index: number) => {
//     setFormData((prev) => ({
//       ...prev,
//       hotels: prev.hotels.filter((_, i) => i !== index),
//     }));
//   };

//   const validateForm = () => {
//     if (!formData.clientName.trim()) return "Client name is required.";
//     if (!formData.serviceType.trim()) return "Service type is required.";

//     if (!formData.passengers[0]?.firstName.trim()) {
//       return "At least one passenger first name is required.";
//     }

//     if (!formData.passengers[0]?.lastName.trim()) {
//       return "At least one passenger last name is required.";
//     }

//     return "";
//   };

//   const handleSave = async () => {
//     const validationError = validateForm();

//     if (validationError) {
//       toast({
//         title: "Missing information",
//         description: validationError,
//         variant: "destructive",
//       });
//       return;
//     }

//     setLoading(true);

//     try {
//       const cleanedPassengers = formData.passengers.filter(
//         (p) => p.firstName.trim() || p.lastName.trim() || p.passportNo.trim()
//       );

//       const cleanedFlights = formData.flights.filter(
//         (f) =>
//           f.airline.trim() ||
//           f.flightNo.trim() ||
//           f.pnr.trim() ||
//           f.ticketNo.trim()
//       );

//       const cleanedHotels = formData.hotels.filter(
//         (h) => h.hotelName.trim() || h.confirmationNo.trim()
//       );

//       const actorId = currentUser?.uid || userProfile?.id || "";
//       const actorName =
//         userProfile?.displayName || currentUser?.email || "Unknown User";

//       const payload: Record<string, any> = {
//         selectedProjectId: formData.selectedProjectId || null,

//         referenceNo: formData.referenceNo.trim(),
//         serviceType: formData.serviceType,
//         bookingStatus: formData.bookingStatus,

//         clientName: formData.clientName.trim(),
//         contactPerson: formData.contactPerson.trim(),
//         contactNo: formData.contactNo.trim(),
//         email: formData.email.trim(),

//         projectName: formData.projectName.trim(),
//         destination: formData.destination.trim(),
//         issueDate: formData.issueDate || null,
//         travelStartDate: formData.travelStartDate || null,
//         travelEndDate: formData.travelEndDate || null,

//         currency: formData.currency,
//         baseAmount: toNumber(formData.baseAmount),
//         taxAmount: toNumber(formData.taxAmount),
//         discountAmount: toNumber(formData.discountAmount),
//         totalAmount: calculatedTotal,
//         paidAmount: toNumber(formData.paidAmount),
//         remainingAmount,

//         showTicketPrice: formData.showTicketPrice,

//         passengers: cleanedPassengers,
//         flights: cleanedFlights,
//         hotels: cleanedHotels,

//         notes: formData.notes.trim(),
//         termsAndConditions: formData.termsAndConditions.trim(),

//         updatedAt: serverTimestamp(),
//         updatedById: actorId,
//         updatedByName: actorName,
//       };

//       let savedId = editingRecordId || "";

//       if (editingRecordId) {
//         await setDoc(
//           getNewTicketDocRef(editingRecordId),
//           {
//             ...payload,
//             migratedFromOldTravelPath: editingSource === "old",
//           },
//           { merge: true }
//         );

//         if (editingSource === "old") {
//           await deleteDoc(getOldTicketDocRef(editingRecordId));
//         }

//         savedId = editingRecordId;
//       } else {
//         const docRef = await addDoc(getNewTicketsCollectionRef(), {
//           ...payload,
//           createdAt: serverTimestamp(),
//           createdById: actorId,
//           createdByName: actorName,
//         });

//         savedId = docRef.id;

//         setFormData(getFreshDefaultFormData());
//         setShowPreview(false);
//       }

//       toast({
//         title: "Success",
//         description: editingRecordId
//           ? "Ticket record updated successfully."
//           : "Ticket record saved successfully.",
//       });

//       onSaved?.(savedId);
//     } catch (error) {
//       console.error("Error saving ticket record:", error);

//       toast({
//         title: "Error",
//         description: "Failed to save ticket record.",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="w-full space-y-6">
//       <div className="rounded-2xl border bg-white p-6 shadow-sm">
//         <div className="mb-6 flex flex-col gap-3 border-b pb-4 md:flex-row md:items-center md:justify-between">
//           <div>
//             <h2 className="text-xl font-semibold text-slate-900">
//               {editingRecordId ? "Edit Ticket Record" : "Create Ticket Record"}
//             </h2>
//             <p className="text-sm text-slate-500">
//               This will save under Panels / IEDGE-SYSTEM / Travel / Tickets /
//               Records.
//             </p>
//           </div>

//           <div className="flex gap-2">
//             <Button
//               type="button"
//               variant="outline"
//               onClick={() => setShowPreview((prev) => !prev)}
//             >
//               <FileText className="mr-2 h-4 w-4" />
//               {showPreview ? "Hide Preview" : "Show Preview"}
//             </Button>

//             <Button
//               type="button"
//               onClick={handleSave}
//               disabled={loading}
//               className="bg-slate-900 text-white hover:bg-slate-800"
//             >
//               <Save className="mr-2 h-4 w-4" />
//               {loading ? "Saving..." : "Save Ticket"}
//             </Button>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
//           <div>
//             <Label>Reference No.</Label>
//             <Input
//               value={formData.referenceNo}
//               onChange={(e) => setField("referenceNo", e.target.value)}
//               placeholder="TRV-0001"
//             />
//           </div>

//           <div>
//             <Label>Project</Label>
//             <Select
//               value={formData.selectedProjectId || undefined}
//               onValueChange={handleProjectSelect}
//             >
//               <SelectTrigger>
//                 <SelectValue
//                   placeholder={
//                     projectsLoading ? "Loading projects..." : "Select project"
//                   }
//                 />
//               </SelectTrigger>
//               <SelectContent>
//                 {projects.length === 0 ? (
//                   <SelectItem value="no-projects-found" disabled>
//                     No projects found
//                   </SelectItem>
//                 ) : (
//                   projects.map((project) => (
//                     <SelectItem key={project.id} value={project.id}>
//                       {project.projectName}
//                       {project.clientName ? ` - ${project.clientName}` : ""}
//                     </SelectItem>
//                   ))
//                 )}
//               </SelectContent>
//             </Select>
//           </div>

//           <div>
//             <Label>Service Type</Label>
//             <Select
//               value={formData.serviceType}
//               onValueChange={(value) => setField("serviceType", value)}
//             >
//               <SelectTrigger>
//                 <SelectValue placeholder="Select service" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="Air Ticket">Air Ticket</SelectItem>
//                 <SelectItem value="Hotel Booking">Hotel Booking</SelectItem>
//                 <SelectItem value="Visa">Visa</SelectItem>
//                 <SelectItem value="Travel Package">Travel Package</SelectItem>
//                 <SelectItem value="Transfer">Transfer</SelectItem>
//                 <SelectItem value="Insurance">Insurance</SelectItem>
//                 <SelectItem value="Other">Other</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           <div>
//             <Label>Booking Status</Label>
//             <Select
//               value={formData.bookingStatus}
//               onValueChange={(value) => setField("bookingStatus", value)}
//             >
//               <SelectTrigger>
//                 <SelectValue placeholder="Select status" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="Draft">Draft</SelectItem>
//                 <SelectItem value="Confirmed">Confirmed</SelectItem>
//                 <SelectItem value="Issued">Issued</SelectItem>
//                 <SelectItem value="Cancelled">Cancelled</SelectItem>
//                 <SelectItem value="Refunded">Refunded</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//         </div>

//         <div className="mt-8">
//           <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">
//             Client Information
//           </h3>

//           <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
//             <div>
//               <Label>Client Name *</Label>
//               <Input
//                 value={formData.clientName}
//                 onChange={(e) => setField("clientName", e.target.value)}
//                 placeholder="Client / Company"
//               />
//             </div>

//             <div>
//               <Label>Contact Person</Label>
//               <Input
//                 value={formData.contactPerson}
//                 onChange={(e) => setField("contactPerson", e.target.value)}
//                 placeholder="Contact person"
//               />
//             </div>

//             <div>
//               <Label>Contact No.</Label>
//               <Input
//                 value={formData.contactNo}
//                 onChange={(e) => setField("contactNo", e.target.value)}
//                 placeholder="+92..."
//               />
//             </div>

//             <div>
//               <Label>Email</Label>
//               <Input
//                 type="email"
//                 value={formData.email}
//                 onChange={(e) => setField("email", e.target.value)}
//                 placeholder="email@example.com"
//               />
//             </div>
//           </div>
//         </div>

//         <div className="mt-8">
//           <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">
//             Trip Information
//           </h3>

//           <div className="grid grid-cols-1 gap-5 md:grid-cols-5">
//             <div>
//               <Label>Project / Trip Name</Label>
//               <Input
//                 value={formData.projectName}
//                 onChange={(e) => setField("projectName", e.target.value)}
//                 placeholder="Conference / CME / Trip"
//               />
//             </div>

//             <div>
//               <Label>Destination</Label>
//               <Input
//                 value={formData.destination}
//                 onChange={(e) => setField("destination", e.target.value)}
//                 placeholder="Cape Town / Dubai / London"
//               />
//             </div>

//             <div>
//               <Label>Issue Date</Label>
//               <Input
//                 type="date"
//                 value={formData.issueDate}
//                 onChange={(e) => setField("issueDate", e.target.value)}
//               />
//             </div>

//             <div>
//               <Label>Travel Start</Label>
//               <Input
//                 type="date"
//                 value={formData.travelStartDate}
//                 onChange={(e) => setField("travelStartDate", e.target.value)}
//               />
//             </div>

//             <div>
//               <Label>Travel End</Label>
//               <Input
//                 type="date"
//                 value={formData.travelEndDate}
//                 onChange={(e) => setField("travelEndDate", e.target.value)}
//               />
//             </div>
//           </div>
//         </div>

//         <div className="mt-8">
//           <div className="mb-4 flex items-center justify-between">
//             <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
//               Passenger Information
//             </h3>

//             <Button
//               type="button"
//               variant="outline"
//               size="sm"
//               onClick={addPassenger}
//             >
//               <Plus className="mr-1 h-4 w-4" />
//               Add Passenger
//             </Button>
//           </div>

//           <div className="space-y-4">
//             {formData.passengers.map((passenger, index) => (
//               <div key={index} className="rounded-xl border bg-slate-50 p-4">
//                 <div className="mb-3 flex items-center justify-between">
//                   <p className="font-medium text-slate-800">
//                     Passenger {index + 1}
//                   </p>

//                   <Button
//                     type="button"
//                     variant="ghost"
//                     size="sm"
//                     onClick={() => removePassenger(index)}
//                     disabled={formData.passengers.length === 1}
//                     className="text-red-600 hover:text-red-700"
//                   >
//                     <Trash2 className="h-4 w-4" />
//                   </Button>
//                 </div>

//                 <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
//                   <div>
//                     <Label>Title</Label>
//                     <Select
//                       value={passenger.title}
//                       onValueChange={(value) =>
//                         updatePassenger(index, "title", value)
//                       }
//                     >
//                       <SelectTrigger>
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="Mr">Mr</SelectItem>
//                         <SelectItem value="Mrs">Mrs</SelectItem>
//                         <SelectItem value="Ms">Ms</SelectItem>
//                         <SelectItem value="Dr">Dr</SelectItem>
//                         <SelectItem value="Prof">Prof</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   <div>
//                     <Label>First Name *</Label>
//                     <Input
//                       value={passenger.firstName}
//                       onChange={(e) =>
//                         updatePassenger(index, "firstName", e.target.value)
//                       }
//                     />
//                   </div>

//                   <div>
//                     <Label>Last Name *</Label>
//                     <Input
//                       value={passenger.lastName}
//                       onChange={(e) =>
//                         updatePassenger(index, "lastName", e.target.value)
//                       }
//                     />
//                   </div>

//                   <div>
//                     <Label>Passport No.</Label>
//                     <Input
//                       value={passenger.passportNo}
//                       onChange={(e) =>
//                         updatePassenger(index, "passportNo", e.target.value)
//                       }
//                     />
//                   </div>

//                   <div>
//                     <Label>Nationality</Label>
//                     <Input
//                       value={passenger.nationality}
//                       onChange={(e) =>
//                         updatePassenger(index, "nationality", e.target.value)
//                       }
//                     />
//                   </div>

//                   <div>
//                     <Label>Date of Birth</Label>
//                     <Input
//                       type="date"
//                       value={passenger.dateOfBirth}
//                       onChange={(e) =>
//                         updatePassenger(index, "dateOfBirth", e.target.value)
//                       }
//                     />
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         <div className="mt-8">
//           <div className="mb-4 flex items-center justify-between">
//             <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
//               Flight Information
//             </h3>

//             <Button
//               type="button"
//               variant="outline"
//               size="sm"
//               onClick={addFlight}
//             >
//               <Plus className="mr-1 h-4 w-4" />
//               Add Flight
//             </Button>
//           </div>

//           <div className="space-y-4">
//             {formData.flights.map((flight, index) => (
//               <div key={index} className="rounded-xl border bg-slate-50 p-4">
//                 <div className="mb-3 flex items-center justify-between">
//                   <p className="font-medium text-slate-800">
//                     Flight {index + 1}
//                   </p>

//                   <Button
//                     type="button"
//                     variant="ghost"
//                     size="sm"
//                     onClick={() => removeFlight(index)}
//                     disabled={formData.flights.length === 1}
//                     className="text-red-600 hover:text-red-700"
//                   >
//                     <Trash2 className="h-4 w-4" />
//                   </Button>
//                 </div>

//                 <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
//                   <div>
//                     <Label>Airline</Label>
//                     <Input
//                       value={flight.airline}
//                       onChange={(e) =>
//                         updateFlight(index, "airline", e.target.value)
//                       }
//                     />
//                   </div>

//                   <div>
//                     <Label>Flight No.</Label>
//                     <Input
//                       value={flight.flightNo}
//                       onChange={(e) =>
//                         updateFlight(index, "flightNo", e.target.value)
//                       }
//                     />
//                   </div>

//                   <div>
//                     <Label>PNR</Label>
//                     <Input
//                       value={flight.pnr}
//                       onChange={(e) =>
//                         updateFlight(index, "pnr", e.target.value)
//                       }
//                     />
//                   </div>

//                   <div>
//                     <Label>Ticket No.</Label>
//                     <Input
//                       value={flight.ticketNo}
//                       onChange={(e) =>
//                         updateFlight(index, "ticketNo", e.target.value)
//                       }
//                     />
//                   </div>

//                   <div>
//                     <Label>From</Label>
//                     <Input
//                       value={flight.from}
//                       onChange={(e) =>
//                         updateFlight(index, "from", e.target.value)
//                       }
//                     />
//                   </div>

//                   <div>
//                     <Label>To</Label>
//                     <Input
//                       value={flight.to}
//                       onChange={(e) =>
//                         updateFlight(index, "to", e.target.value)
//                       }
//                     />
//                   </div>

//                   <div>
//                     <Label>Departure Date</Label>
//                     <Input
//                       type="date"
//                       value={flight.departureDate}
//                       onChange={(e) =>
//                         updateFlight(index, "departureDate", e.target.value)
//                       }
//                     />
//                   </div>

//                   <div>
//                     <Label>Departure Time</Label>
//                     <Input
//                       type="time"
//                       value={flight.departureTime}
//                       onChange={(e) =>
//                         updateFlight(index, "departureTime", e.target.value)
//                       }
//                     />
//                   </div>

//                   <div>
//                     <Label>Arrival Date</Label>
//                     <Input
//                       type="date"
//                       value={flight.arrivalDate}
//                       onChange={(e) =>
//                         updateFlight(index, "arrivalDate", e.target.value)
//                       }
//                     />
//                   </div>

//                   <div>
//                     <Label>Arrival Time</Label>
//                     <Input
//                       type="time"
//                       value={flight.arrivalTime}
//                       onChange={(e) =>
//                         updateFlight(index, "arrivalTime", e.target.value)
//                       }
//                     />
//                   </div>

//                   <div className="md:col-span-2">
//                     <Label>Baggage</Label>
//                     <Input
//                       value={flight.baggage}
//                       onChange={(e) =>
//                         updateFlight(index, "baggage", e.target.value)
//                       }
//                       placeholder="30 KG / 2 Pieces"
//                     />
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         <div className="mt-8">
//           <div className="mb-4 flex items-center justify-between">
//             <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
//               Hotel Information
//             </h3>

//             <Button
//               type="button"
//               variant="outline"
//               size="sm"
//               onClick={addHotel}
//             >
//               <Plus className="mr-1 h-4 w-4" />
//               Add Hotel
//             </Button>
//           </div>

//           {formData.hotels.length === 0 ? (
//             <div className="rounded-xl border border-dashed bg-slate-50 p-5 text-sm text-slate-500">
//               No hotel added. Click Add Hotel if this ticket includes hotel
//               booking.
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {formData.hotels.map((hotel, index) => (
//                 <div key={index} className="rounded-xl border bg-slate-50 p-4">
//                   <div className="mb-3 flex items-center justify-between">
//                     <p className="font-medium text-slate-800">
//                       Hotel {index + 1}
//                     </p>

//                     <Button
//                       type="button"
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => removeHotel(index)}
//                       className="text-red-600 hover:text-red-700"
//                     >
//                       <Trash2 className="h-4 w-4" />
//                     </Button>
//                   </div>

//                   <div className="grid grid-cols-1 gap-4 md:grid-cols-7">
//                     <div>
//                       <Label>Hotel Name</Label>
//                       <Input
//                         value={hotel.hotelName}
//                         onChange={(e) =>
//                           updateHotel(index, "hotelName", e.target.value)
//                         }
//                       />
//                     </div>

//                     <div>
//                       <Label>City</Label>
//                       <Input
//                         value={hotel.city}
//                         onChange={(e) =>
//                           updateHotel(index, "city", e.target.value)
//                         }
//                       />
//                     </div>

//                     <div>
//                       <Label>Check In</Label>
//                       <Input
//                         type="date"
//                         value={hotel.checkIn}
//                         onChange={(e) =>
//                           updateHotel(index, "checkIn", e.target.value)
//                         }
//                       />
//                     </div>

//                     <div>
//                       <Label>Check Out</Label>
//                       <Input
//                         type="date"
//                         value={hotel.checkOut}
//                         onChange={(e) =>
//                           updateHotel(index, "checkOut", e.target.value)
//                         }
//                       />
//                     </div>

//                     <div>
//                       <Label>Room Type</Label>
//                       <Input
//                         value={hotel.roomType}
//                         onChange={(e) =>
//                           updateHotel(index, "roomType", e.target.value)
//                         }
//                       />
//                     </div>

//                     <div>
//                       <Label>Meal Plan</Label>
//                       <Input
//                         value={hotel.mealPlan}
//                         onChange={(e) =>
//                           updateHotel(index, "mealPlan", e.target.value)
//                         }
//                       />
//                     </div>

//                     <div>
//                       <Label>Confirmation No.</Label>
//                       <Input
//                         value={hotel.confirmationNo}
//                         onChange={(e) =>
//                           updateHotel(index, "confirmationNo", e.target.value)
//                         }
//                       />
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <div className="mt-8">
//           <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">
//             Amount Details
//           </h3>

//           <div className="mb-4 flex items-center gap-2 rounded-xl border bg-slate-50 p-4">
//             <Checkbox
//               id="showTicketPrice"
//               checked={formData.showTicketPrice}
//               onCheckedChange={(checked) =>
//                 setField("showTicketPrice", checked === true)
//               }
//             />
//             <Label htmlFor="showTicketPrice" className="cursor-pointer">
//               Show ticket price on printable / PDF
//             </Label>
//           </div>

//           <div className="grid grid-cols-1 gap-5 md:grid-cols-7">
//             <div>
//               <Label>Currency</Label>
//               <Select
//                 value={formData.currency}
//                 onValueChange={(value) => setField("currency", value)}
//               >
//                 <SelectTrigger>
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="PKR">PKR</SelectItem>
//                   <SelectItem value="USD">USD</SelectItem>
//                   <SelectItem value="EUR">EUR</SelectItem>
//                   <SelectItem value="GBP">GBP</SelectItem>
//                   <SelectItem value="AED">AED</SelectItem>
//                   <SelectItem value="SAR">SAR</SelectItem>
//                   <SelectItem value="ZAR">ZAR</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>

//             <div>
//               <Label>Base Amount</Label>
//               <Input
//                 type="number"
//                 value={formData.baseAmount}
//                 onChange={(e) => setField("baseAmount", e.target.value)}
//               />
//             </div>

//             <div>
//               <Label>Tax Amount</Label>
//               <Input
//                 type="number"
//                 value={formData.taxAmount}
//                 onChange={(e) => setField("taxAmount", e.target.value)}
//               />
//             </div>

//             <div>
//               <Label>Discount</Label>
//               <Input
//                 type="number"
//                 value={formData.discountAmount}
//                 onChange={(e) => setField("discountAmount", e.target.value)}
//               />
//             </div>

//             <div>
//               <Label>Total</Label>
//               <Input value={String(calculatedTotal)} disabled />
//             </div>

//             <div>
//               <Label>Paid</Label>
//               <Input
//                 type="number"
//                 value={formData.paidAmount}
//                 onChange={(e) => setField("paidAmount", e.target.value)}
//               />
//             </div>

//             <div>
//               <Label>Remaining</Label>
//               <Input value={String(remainingAmount)} disabled />
//             </div>
//           </div>
//         </div>

//         <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
//           <div>
//             <Label>Notes</Label>
//             <Textarea
//               value={formData.notes}
//               onChange={(e) => setField("notes", e.target.value)}
//               rows={4}
//               placeholder="Internal or customer notes..."
//             />
//           </div>

//           <div>
//             <Label>Terms & Conditions</Label>
//             <Textarea
//               value={formData.termsAndConditions}
//               onChange={(e) =>
//                 setField("termsAndConditions", e.target.value)
//               }
//               rows={4}
//               placeholder="Ticket terms, refund rules, hotel policy, etc."
//             />
//           </div>
//         </div>

//         <div className="mt-8 flex justify-end gap-3 border-t pt-5">
//           {onCancel && (
//             <Button type="button" variant="outline" onClick={onCancel}>
//               Cancel
//             </Button>
//           )}

//           <Button
//             type="button"
//             onClick={handleSave}
//             disabled={loading}
//             className="bg-green-600 text-white hover:bg-green-700"
//           >
//             {loading
//               ? "Saving..."
//               : editingRecordId
//                 ? "Update Record"
//                 : "Save Record"}
//           </Button>
//         </div>
//       </div>

//       {showPreview && (
//         <TicketPrintable
//           data={{
//             ...formData,
//             totalAmount: String(calculatedTotal),
//           }}
//         />
//       )}
//     </div>
//   );
// }

import React, { useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PANEL_ID = "IEDGE-SYSTEM";

type FlightPassengerType = "single" | "multiple";

export type PassengerItem = {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  passportNo: string;
  nationality?: string;
  dob?: string;
};

export type FlightItem = {
  id: string;
  from: string;
  to: string;
  airline: string;
  flightNo: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  duration: string;
  isConnectingFlight: boolean;
  stopOverTime: string;
};

export type HotelItem = {
  id: string;
  hotelName: string;
  city: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  nights: string;
};

export type TicketFormData = {
  selectedProjectId: string;
  projectCode?: string;
  projectNumber?: string;

  referenceNo: string;
  serviceType: string;
  bookingStatus: string;

  clientName: string;
  contactPerson: string;
  contactNo: string;
  email: string;

  projectName: string;
  destination: string;
  issueDate: string;
  travelStartDate: string;
  travelEndDate: string;

  currency: string;
  baseAmount: string;
  taxAmount: string;
  discountAmount: string;
  totalAmount: string;
  paidAmount: string;
  remainingAmount?: string;

  showTicketPrice: boolean;
  flightPassengerType: FlightPassengerType;

  passengers: PassengerItem[];
  flights: FlightItem[];
  hotels: HotelItem[];

  notes: string;
  termsAndConditions: string;

  createdAt?: any;
  updatedAt?: any;
  createdByName?: string;
  updatedByName?: string;
};

type TicketFormProps = {
  editingRecordId?: string | null;
  editingSource?: "new" | "old";
  initialData?: Partial<TicketFormData> | null;
  onSaved?: () => void;
  onCancel?: () => void;
};

const AIRPORT_OPTIONS = [
  "Abu Dhabi - Zayed International Airport (AUH), United Arab Emirates",
  "Accra - Kotoka International Airport (ACC), Ghana",
  "Addis Ababa - Bole International Airport (ADD), Ethiopia",
  "Ahmedabad - Sardar Vallabhbhai Patel International Airport (AMD), India",
  "Almaty - Almaty International Airport (ALA), Kazakhstan",
  "Amman - Queen Alia International Airport (AMM), Jordan",
  "Amsterdam - Amsterdam Airport Schiphol (AMS), Netherlands",
  "Athens - Athens International Airport (ATH), Greece",
  "Atlanta - Hartsfield-Jackson Atlanta International Airport (ATL), United States",
  "Auckland - Auckland Airport (AKL), New Zealand",
  "Bahrain - Bahrain International Airport (BAH), Bahrain",
  "Baku - Heydar Aliyev International Airport (GYD), Azerbaijan",
  "Bali / Denpasar - Ngurah Rai International Airport (DPS), Indonesia",
  "Bangkok - Suvarnabhumi Airport (BKK), Thailand",
  "Barcelona - Josep Tarradellas Barcelona-El Prat Airport (BCN), Spain",
  "Beijing - Beijing Capital International Airport (PEK), China",
  "Berlin - Berlin Brandenburg Airport (BER), Germany",
  "Birmingham - Birmingham Airport (BHX), United Kingdom",
  "Boston - Boston Logan International Airport (BOS), United States",
  "Brussels - Brussels Airport (BRU), Belgium",
  "Cairo - Cairo International Airport (CAI), Egypt",
  "Cape Town - Cape Town International Airport (CPT), South Africa",
  "Casablanca - Mohammed V International Airport (CMN), Morocco",
  "Chicago - O'Hare International Airport (ORD), United States",
  "Colombo - Bandaranaike International Airport (CMB), Sri Lanka",
  "Copenhagen - Copenhagen Airport (CPH), Denmark",
  "Dallas / Fort Worth - Dallas Fort Worth International Airport (DFW), United States",
  "Dammam - King Fahd International Airport (DMM), Saudi Arabia",
  "Delhi - Indira Gandhi International Airport (DEL), India",
  "Doha - Hamad International Airport (DOH), Qatar",
  "Dubai - Dubai International Airport (DXB), United Arab Emirates",
  "Dublin - Dublin Airport (DUB), Ireland",
  "Edinburgh - Edinburgh Airport (EDI), United Kingdom",
  "Frankfurt - Frankfurt Airport (FRA), Germany",
  "Guangzhou - Guangzhou Baiyun International Airport (CAN), China",
  "Hanoi - Noi Bai International Airport (HAN), Vietnam",
  "Hong Kong - Hong Kong International Airport (HKG), Hong Kong",
  "Houston - George Bush Intercontinental Airport (IAH), United States",
  "Istanbul - Istanbul Airport (IST), Turkiye",
  "Jakarta - Soekarno-Hatta International Airport (CGK), Indonesia",
  "Jeddah - King Abdulaziz International Airport (JED), Saudi Arabia",
  "Johannesburg - O. R. Tambo International Airport (JNB), South Africa",
  "Kabul - Hamid Karzai International Airport (KBL), Afghanistan",
  "Karachi - Jinnah International Airport (KHI), Pakistan",
  "Kathmandu - Tribhuvan International Airport (KTM), Nepal",
  "Kuala Lumpur - Kuala Lumpur International Airport (KUL), Malaysia",
  "Kuwait City - Kuwait International Airport (KWI), Kuwait",
  "Lahore - Allama Iqbal International Airport (LHE), Pakistan",
  "Larnaca - Larnaca International Airport (LCA), Cyprus",
  "Las Vegas - Harry Reid International Airport (LAS), United States",
  "Lisbon - Humberto Delgado Airport (LIS), Portugal",
  "London - Heathrow Airport (LHR), United Kingdom",
  "London - Gatwick Airport (LGW), United Kingdom",
  "Los Angeles - Los Angeles International Airport (LAX), United States",
  "Madrid - Adolfo Suarez Madrid-Barajas Airport (MAD), Spain",
  "Male - Velana International Airport (MLE), Maldives",
  "Manchester - Manchester Airport (MAN), United Kingdom",
  "Manila - Ninoy Aquino International Airport (MNL), Philippines",
  "Medina - Prince Mohammad bin Abdulaziz International Airport (MED), Saudi Arabia",
  "Melbourne - Melbourne Airport (MEL), Australia",
  "Miami - Miami International Airport (MIA), United States",
  "Milan - Milan Malpensa Airport (MXP), Italy",
  "Montreal - Montreal-Trudeau International Airport (YUL), Canada",
  "Moscow - Sheremetyevo International Airport (SVO), Russia",
  "Multan - Multan International Airport (MUX), Pakistan",
  "Mumbai - Chhatrapati Shivaji Maharaj International Airport (BOM), India",
  "Muscat - Muscat International Airport (MCT), Oman",
  "Nairobi - Jomo Kenyatta International Airport (NBO), Kenya",
  "New York - John F. Kennedy International Airport (JFK), United States",
  "Osaka - Kansai International Airport (KIX), Japan",
  "Oslo - Oslo Airport Gardermoen (OSL), Norway",
  "Paris - Charles de Gaulle Airport (CDG), France",
  "Peshawar - Bacha Khan International Airport (PEW), Pakistan",
  "Phuket - Phuket International Airport (HKT), Thailand",
  "Prague - Vaclav Havel Airport Prague (PRG), Czech Republic",
  "Quetta - Quetta International Airport (UET), Pakistan",
  "Riyadh - King Khalid International Airport (RUH), Saudi Arabia",
  "Rome - Leonardo da Vinci-Fiumicino Airport (FCO), Italy",
  "San Francisco - San Francisco International Airport (SFO), United States",
  "Seoul - Incheon International Airport (ICN), South Korea",
  "Shanghai - Shanghai Pudong International Airport (PVG), China",
  "Sharjah - Sharjah International Airport (SHJ), United Arab Emirates",
  "Singapore - Singapore Changi Airport (SIN), Singapore",
  "Stockholm - Stockholm Arlanda Airport (ARN), Sweden",
  "Sydney - Sydney Kingsford Smith Airport (SYD), Australia",
  "Tashkent - Islam Karimov Tashkent International Airport (TAS), Uzbekistan",
  "Tehran - Imam Khomeini International Airport (IKA), Iran",
  "Tokyo - Haneda Airport (HND), Japan",
  "Tokyo - Narita International Airport (NRT), Japan",
  "Toronto - Toronto Pearson International Airport (YYZ), Canada",
  "Vienna - Vienna International Airport (VIE), Austria",
  "Warsaw - Warsaw Chopin Airport (WAW), Poland",
  "Washington, DC - Dulles International Airport (IAD), United States",
  "Zurich - Zurich Airport (ZRH), Switzerland",
];

function getTicketsCollectionRef() {
  return collection(db, "Panels", PANEL_ID, "Travel", "Tickets", "Records");
}

function getProjectsCollectionRef() {
  return collection(db, "Panels", PANEL_ID, "Projects");
}

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createPassenger(): PassengerItem {
  return {
    id: newId("passenger"),
    title: "Mr",
    firstName: "",
    lastName: "",
    passportNo: "",
    nationality: "",
    dob: "",
  };
}

function createFlight(): FlightItem {
  return {
    id: newId("flight"),
    from: "",
    to: "",
    airline: "",
    flightNo: "",
    departureDate: "",
    departureTime: "",
    arrivalDate: "",
    arrivalTime: "",
    duration: "",
    isConnectingFlight: false,
    stopOverTime: "",
  };
}

function createHotel(): HotelItem {
  return {
    id: newId("hotel"),
    hotelName: "",
    city: "",
    checkIn: "",
    checkOut: "",
    roomType: "",
    nights: "",
  };
}

function normalizeString(value: any) {
  if (value === undefined || value === null) return "";
  return String(value);
}

function getValueByKeys(source: any, keys: string[]) {
  if (!source) return "";

  for (const key of keys) {
    const value = source[key];

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }
  }

  return "";
}

function withExistingValue(nextValue: string, currentValue: string) {
  const normalizedNextValue = normalizeString(nextValue).trim();
  return normalizedNextValue || normalizeString(currentValue);
}

function normalizePassenger(passenger: any): PassengerItem {
  return {
    id: normalizeString(passenger?.id) || newId("passenger"),
    title: normalizeString(passenger?.title) || "Mr",
    firstName: normalizeString(passenger?.firstName),
    lastName: normalizeString(passenger?.lastName),
    passportNo: normalizeString(passenger?.passportNo),
    nationality: normalizeString(passenger?.nationality),
    dob: normalizeString(passenger?.dob),
  };
}

function normalizeFlight(flight: any): FlightItem {
  const isConnectingFlight = flight?.isConnectingFlight === true;

  return {
    id: normalizeString(flight?.id) || newId("flight"),
    from: normalizeString(flight?.from),
    to: normalizeString(flight?.to),
    airline: normalizeString(flight?.airline),
    flightNo: normalizeString(flight?.flightNo),
    departureDate: normalizeString(flight?.departureDate),
    departureTime: normalizeString(flight?.departureTime),
    arrivalDate: normalizeString(flight?.arrivalDate),
    arrivalTime: normalizeString(flight?.arrivalTime),
    duration: normalizeString(flight?.duration),
    isConnectingFlight,
    stopOverTime: isConnectingFlight
      ? normalizeString(flight?.stopOverTime)
      : "",
  };
}

function normalizeHotel(hotel: any): HotelItem {
  return {
    id: normalizeString(hotel?.id) || newId("hotel"),
    hotelName: normalizeString(hotel?.hotelName),
    city: normalizeString(hotel?.city),
    checkIn: normalizeString(hotel?.checkIn),
    checkOut: normalizeString(hotel?.checkOut),
    roomType: normalizeString(hotel?.roomType),
    nights: normalizeString(hotel?.nights),
  };
}

function createInitialData(
  initialData?: Partial<TicketFormData> | null,
): TicketFormData {
  return {
    selectedProjectId: normalizeString(initialData?.selectedProjectId),
    projectCode: normalizeString(
      initialData?.projectCode ||
        (initialData as any)?.code ||
        (initialData as any)?.selectedProjectCode,
    ),
    projectNumber: normalizeString(
      initialData?.projectNumber ||
        (initialData as any)?.projectNo ||
        (initialData as any)?.selectedProjectNumber ||
        (initialData as any)?.selectedProjectNo,
    ),

    referenceNo: normalizeString(initialData?.referenceNo),
    serviceType: normalizeString(initialData?.serviceType || "Air Ticket"),
    bookingStatus: normalizeString(initialData?.bookingStatus || "Draft"),

    clientName: normalizeString(initialData?.clientName),
    contactPerson: normalizeString(initialData?.contactPerson),
    contactNo: normalizeString(initialData?.contactNo),
    email: normalizeString(initialData?.email),

    projectName: normalizeString(initialData?.projectName),
    destination: normalizeString(initialData?.destination),
    issueDate: normalizeString(initialData?.issueDate),
    travelStartDate: normalizeString(initialData?.travelStartDate),
    travelEndDate: normalizeString(initialData?.travelEndDate),

    currency: normalizeString(initialData?.currency || "PKR"),
    baseAmount: normalizeString(initialData?.baseAmount),
    taxAmount: normalizeString(initialData?.taxAmount),
    discountAmount: normalizeString(initialData?.discountAmount),
    totalAmount: normalizeString(initialData?.totalAmount),
    paidAmount: normalizeString(initialData?.paidAmount),
    remainingAmount: normalizeString(initialData?.remainingAmount),

    showTicketPrice:
      typeof initialData?.showTicketPrice === "boolean"
        ? initialData.showTicketPrice
        : false,
    flightPassengerType:
      initialData?.flightPassengerType === "multiple" ? "multiple" : "single",

    passengers:
      Array.isArray(initialData?.passengers) &&
      initialData.passengers.length > 0
        ? initialData.passengers.map(normalizePassenger)
        : [createPassenger()],
    flights:
      Array.isArray(initialData?.flights) && initialData.flights.length > 0
        ? initialData.flights.map(normalizeFlight)
        : [createFlight()],
    hotels: Array.isArray(initialData?.hotels)
      ? initialData.hotels.map(normalizeHotel)
      : [],

    notes: normalizeString(initialData?.notes),
    termsAndConditions: normalizeString(initialData?.termsAndConditions),

    createdAt: initialData?.createdAt || null,
    updatedAt: initialData?.updatedAt || null,
    createdByName: normalizeString(initialData?.createdByName),
    updatedByName: normalizeString(initialData?.updatedByName),
  };
}

function parseMoney(value: any) {
  const numberValue = Number(String(value || "").replace(/,/g, ""));
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function moneyToString(value: number) {
  return String(Math.max(0, Number.isFinite(value) ? value : 0));
}

const labelClass = "mb-1 block text-xs font-medium text-slate-600";
const inputClass =
  "h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";
const textareaClass =
  "min-h-[90px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900";

export default function TicketForm({
  editingRecordId = null,
  editingSource = "new",
  initialData = null,
  onSaved,
  onCancel,
}: TicketFormProps) {
  const [form, setForm] = useState<TicketFormData>(() =>
    createInitialData(initialData),
  );
  const [saving, setSaving] = useState(false);
  const [projectLookupLoading, setProjectLookupLoading] = useState(false);
  const [projectLookupMessage, setProjectLookupMessage] = useState("");
  const [error, setError] = useState("");

  const calculatedAmounts = useMemo(() => {
    const baseAmount = parseMoney(form.baseAmount);
    const taxAmount = parseMoney(form.taxAmount);
    const discountAmount = parseMoney(form.discountAmount);
    const paidAmount = parseMoney(form.paidAmount);
    const totalAmount = Math.max(0, baseAmount + taxAmount - discountAmount);
    const remainingAmount = Math.max(0, totalAmount - paidAmount);

    return { totalAmount, remainingAmount };
  }, [form.baseAmount, form.taxAmount, form.discountAmount, form.paidAmount]);

  const setField = <K extends keyof TicketFormData>(
    field: K,
    value: TicketFormData[K],
  ) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const updatePassenger = (index: number, patch: Partial<PassengerItem>) => {
    setForm((previous) => {
      const passengers = [...previous.passengers];
      passengers[index] = { ...passengers[index], ...patch };
      return { ...previous, passengers };
    });
  };

  const updateFlight = (index: number, patch: Partial<FlightItem>) => {
    setForm((previous) => {
      const flights = [...previous.flights];
      const nextFlight = { ...flights[index], ...patch };

      if (patch.isConnectingFlight === false) {
        nextFlight.stopOverTime = "";
      }

      flights[index] = nextFlight;
      return { ...previous, flights };
    });
  };

  const updateHotel = (index: number, patch: Partial<HotelItem>) => {
    setForm((previous) => {
      const hotels = [...previous.hotels];
      hotels[index] = { ...hotels[index], ...patch };
      return { ...previous, hotels };
    });
  };

  const handlePassengerTypeChange = (value: FlightPassengerType) => {
    setForm((previous) => {
      const passengers =
        value === "single"
          ? [previous.passengers[0] || createPassenger()]
          : previous.passengers.length > 0
            ? previous.passengers
            : [createPassenger()];

      return { ...previous, flightPassengerType: value, passengers };
    });
  };

  const handleProjectCodeLookup = async (
    projectCodeValue = form.projectCode || "",
  ) => {
    const codeValue = normalizeString(projectCodeValue).trim();

    if (!codeValue) {
      setProjectLookupMessage("");
      return;
    }

    setProjectLookupLoading(true);
    setProjectLookupMessage("");

    try {
      const projectsCollectionRef = getProjectsCollectionRef();
      const projectCodeFields = [
        "projectCode",
        "code",
        "projectNo",
        "projectNumber",
        "selectedProjectCode",
        "selectedProjectNo",
      ];

      let projectData: any = null;
      let projectId = "";

      const directDocSnap = await getDoc(doc(projectsCollectionRef, codeValue));

      if (directDocSnap.exists()) {
        projectData = directDocSnap.data();
        projectId = directDocSnap.id;
      }

      if (!projectData) {
        for (const fieldName of projectCodeFields) {
          const projectQuery = query(
            projectsCollectionRef,
            where(fieldName, "==", codeValue),
            limit(1),
          );
          const projectSnapshot = await getDocs(projectQuery);

          if (!projectSnapshot.empty) {
            const projectDoc = projectSnapshot.docs[0];
            projectData = projectDoc.data();
            projectId = projectDoc.id;
            break;
          }
        }
      }

      if (!projectData) {
        setProjectLookupMessage("No project found for this project code.");
        return;
      }

      const nextClientName = getValueByKeys(projectData, [
        "clientName",
        "Client Name",
        "client",
        "customerName",
        "customer",
      ]);
      const nextContactPerson = getValueByKeys(projectData, [
        "contactPerson",
        "Contact Person",
        "contactName",
        "representativeName",
      ]);
      const nextContactNo = getValueByKeys(projectData, [
        "contactNo",
        "Contact No",
        "contactNumber",
        "phone",
        "phoneNo",
        "mobile",
      ]);
      const nextProjectName = getValueByKeys(projectData, [
        "projectName",
        "Project Name",
        "name",
        "title",
      ]);
      const nextProjectNumber = getValueByKeys(projectData, [
        "projectNumber",
        "Project Number",
        "projectNo",
        "Project No",
        "selectedProjectNumber",
        "selectedProjectNo",
      ]);
      const nextEmail = getValueByKeys(projectData, [
        "email",
        "Email",
        "clientEmail",
        "contactEmail",
      ]);

      setForm((previous) => ({
        ...previous,
        projectCode: codeValue,
        selectedProjectId: withExistingValue(
          projectId,
          previous.selectedProjectId,
        ),
        projectName: withExistingValue(nextProjectName, previous.projectName),
        projectNumber: withExistingValue(
          nextProjectNumber || codeValue,
          previous.projectNumber || "",
        ),
        clientName: withExistingValue(nextClientName, previous.clientName),
        contactPerson: withExistingValue(
          nextContactPerson,
          previous.contactPerson,
        ),
        contactNo: withExistingValue(nextContactNo, previous.contactNo),
        email: withExistingValue(nextEmail, previous.email),
      }));

      setProjectLookupMessage("Project data loaded from database.");
    } catch (lookupError) {
      console.error("Error loading project by code:", lookupError);
      setProjectLookupMessage(
        "Project data could not be loaded. Please check the project code.",
      );
    } finally {
      setProjectLookupLoading(false);
    }
  };

  const addPassenger = () => {
    setForm((previous) => ({
      ...previous,
      flightPassengerType: "multiple",
      passengers: [...previous.passengers, createPassenger()],
    }));
  };

  const removePassenger = (index: number) => {
    setForm((previous) => {
      const passengers = previous.passengers.filter(
        (_, passengerIndex) => passengerIndex !== index,
      );
      return {
        ...previous,
        passengers: passengers.length > 0 ? passengers : [createPassenger()],
        flightPassengerType: passengers.length > 1 ? "multiple" : "single",
      };
    });
  };

  const addFlight = () => {
    setForm((previous) => ({
      ...previous,
      flights: [...previous.flights, createFlight()],
    }));
  };

  const removeFlight = (index: number) => {
    setForm((previous) => ({
      ...previous,
      flights: previous.flights.filter(
        (_, flightIndex) => flightIndex !== index,
      ).length
        ? previous.flights.filter((_, flightIndex) => flightIndex !== index)
        : [createFlight()],
    }));
  };

  const addHotel = () => {
    setForm((previous) => ({
      ...previous,
      hotels: [...previous.hotels, createHotel()],
    }));
  };

  const removeHotel = (index: number) => {
    setForm((previous) => ({
      ...previous,
      hotels: previous.hotels.filter((_, hotelIndex) => hotelIndex !== index),
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const totalAmount = moneyToString(calculatedAmounts.totalAmount);
      const remainingAmount = moneyToString(calculatedAmounts.remainingAmount);

      const cleanedFlights = form.flights.map((flight) => ({
        ...flight,
        from: normalizeString(flight.from),
        to: normalizeString(flight.to),
        duration: normalizeString(flight.duration),
        isConnectingFlight: flight.isConnectingFlight === true,
        stopOverTime:
          flight.isConnectingFlight === true
            ? normalizeString(flight.stopOverTime)
            : "",
      }));

      const payload: TicketFormData = {
        ...form,
        selectedProjectId: normalizeString(form.selectedProjectId),
        projectCode: normalizeString(form.projectCode),
        projectNumber: normalizeString(form.projectNumber),
        serviceType: normalizeString(form.serviceType || "Air Ticket"),
        bookingStatus: normalizeString(form.bookingStatus || "Draft"),
        currency: normalizeString(form.currency || "PKR"),
        totalAmount,
        remainingAmount,
        showTicketPrice: form.showTicketPrice === true,
        flightPassengerType:
          form.flightPassengerType === "multiple" ? "multiple" : "single",
        passengers: form.passengers.map(normalizePassenger),
        flights: cleanedFlights,
        hotels: form.hotels.map(normalizeHotel),
        createdAt: form.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (editingRecordId) {
        await setDoc(doc(getTicketsCollectionRef(), editingRecordId), payload, {
          merge: true,
        });
      } else {
        await addDoc(getTicketsCollectionRef(), payload);
      }

      onSaved?.();
    } catch (saveError) {
      console.error("Error saving ticket:", saveError);
      setError(
        "Ticket could not be saved. Please check the form and try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border bg-white p-5 shadow-sm"
    >
      <div className="flex flex-col gap-3 border-b pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {editingRecordId ? "Edit Ticket" : "Create Travel Ticket"}
          </h2>
          <p className="text-sm text-slate-500">
            {editingRecordId && editingSource === "old"
              ? "This old ticket will be saved into the new Tickets / Records database path."
              : "Fill ticket, project, passenger and flight information."}
          </p>
        </div>

        <label className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.showTicketPrice}
            onChange={(event) =>
              setField("showTicketPrice", event.target.checked)
            }
          />
          Show ticket price on printable / PDF
        </label>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="space-y-4">
        <h3 className="text-base font-semibold text-slate-900">
          Project & Client
        </h3>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className={labelClass}>Project Code</label>
            <div className="flex gap-2">
              <Input
                value={form.projectCode || ""}
                onChange={(event) => {
                  setField("projectCode", event.target.value);
                  setProjectLookupMessage("");
                }}
                onBlur={(event) => handleProjectCodeLookup(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleProjectCodeLookup(form.projectCode || "");
                  }
                }}
                placeholder="Project code"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => handleProjectCodeLookup(form.projectCode || "")}
                disabled={
                  projectLookupLoading ||
                  !normalizeString(form.projectCode).trim()
                }
              >
                {projectLookupLoading ? "Loading" : "Load"}
              </Button>
            </div>
            {projectLookupMessage && (
              <p className="mt-1 text-xs text-slate-500">
                {projectLookupMessage}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Project Name</label>
            <Input
              value={form.projectName}
              onChange={(event) => setField("projectName", event.target.value)}
              placeholder="Project name"
            />
          </div>

          <div>
            <label className={labelClass}>Project Number</label>
            <Input
              value={form.projectNumber || ""}
              onChange={(event) =>
                setField("projectNumber", event.target.value)
              }
              placeholder="Project number"
            />
          </div>

          <div>
            <label className={labelClass}>Project ID / Reference</label>
            <Input
              value={form.selectedProjectId}
              onChange={(event) =>
                setField("selectedProjectId", event.target.value)
              }
              placeholder="Optional project ID"
            />
          </div>

          <div>
            <label className={labelClass}>Client Name</label>
            <Input
              value={form.clientName}
              onChange={(event) => setField("clientName", event.target.value)}
              placeholder="Client name"
            />
          </div>

          <div>
            <label className={labelClass}>Contact Person</label>
            <Input
              value={form.contactPerson}
              onChange={(event) =>
                setField("contactPerson", event.target.value)
              }
              placeholder="Contact person"
            />
          </div>

          <div>
            <label className={labelClass}>Contact No</label>
            <Input
              value={form.contactNo}
              onChange={(event) => setField("contactNo", event.target.value)}
              placeholder="Contact number"
            />
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <Input
              type="email"
              value={form.email}
              onChange={(event) => setField("email", event.target.value)}
              placeholder="Email"
            />
          </div>

          <div>
            <label className={labelClass}>Destination</label>
            <Input
              value={form.destination}
              onChange={(event) => setField("destination", event.target.value)}
              placeholder="Destination"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-base font-semibold text-slate-900">
          Ticket Details
        </h3>

        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className={labelClass}>Reference No</label>
            <Input
              value={form.referenceNo}
              onChange={(event) => setField("referenceNo", event.target.value)}
              placeholder="Reference no"
            />
          </div>

          <div>
            <label className={labelClass}>Service Type</label>
            <Input
              value={form.serviceType}
              onChange={(event) => setField("serviceType", event.target.value)}
              placeholder="Air Ticket"
            />
          </div>

          <div>
            <label className={labelClass}>Booking Status</label>
            <select
              value={form.bookingStatus}
              onChange={(event) =>
                setField("bookingStatus", event.target.value)
              }
              className={inputClass}
            >
              <option value="Draft">Draft</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Issued">Issued</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Issue Date</label>
            <Input
              type="date"
              value={form.issueDate}
              onChange={(event) => setField("issueDate", event.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Travel Start Date</label>
            <Input
              type="date"
              value={form.travelStartDate}
              onChange={(event) =>
                setField("travelStartDate", event.target.value)
              }
            />
          </div>

          <div>
            <label className={labelClass}>Travel End Date</label>
            <Input
              type="date"
              value={form.travelEndDate}
              onChange={(event) =>
                setField("travelEndDate", event.target.value)
              }
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Passenger Information
            </h3>
            <p className="text-sm text-slate-500">
              Select single or multiple passengers so the flight record is
              connected correctly.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-slate-700">
              <input
                type="radio"
                name="flightPassengerType"
                checked={form.flightPassengerType === "single"}
                onChange={() => handlePassengerTypeChange("single")}
              />
              Single passenger
            </label>

            <label className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-slate-700">
              <input
                type="radio"
                name="flightPassengerType"
                checked={form.flightPassengerType === "multiple"}
                onChange={() => handlePassengerTypeChange("multiple")}
              />
              Multiple passengers
            </label>
          </div>
        </div>

        <div className="space-y-3">
          {form.passengers.map((passenger, index) => (
            <div
              key={passenger.id}
              className="rounded-xl border bg-slate-50 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-medium text-slate-900">
                  Passenger {index + 1}
                </h4>
                {form.passengers.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removePassenger(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-6">
                <div>
                  <label className={labelClass}>Title</label>
                  <select
                    value={passenger.title}
                    onChange={(event) =>
                      updatePassenger(index, { title: event.target.value })
                    }
                    className={inputClass}
                  >
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Ms">Ms</option>
                    <option value="Miss">Miss</option>
                    <option value="Master">Master</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>First Name</label>
                  <Input
                    value={passenger.firstName}
                    onChange={(event) =>
                      updatePassenger(index, { firstName: event.target.value })
                    }
                    placeholder="First name"
                  />
                </div>

                <div>
                  <label className={labelClass}>Last Name</label>
                  <Input
                    value={passenger.lastName}
                    onChange={(event) =>
                      updatePassenger(index, { lastName: event.target.value })
                    }
                    placeholder="Last name"
                  />
                </div>

                <div>
                  <label className={labelClass}>Passport No</label>
                  <Input
                    value={passenger.passportNo}
                    onChange={(event) =>
                      updatePassenger(index, { passportNo: event.target.value })
                    }
                    placeholder="Passport no"
                  />
                </div>

                <div>
                  <label className={labelClass}>Nationality</label>
                  <Input
                    value={passenger.nationality || ""}
                    onChange={(event) =>
                      updatePassenger(index, {
                        nationality: event.target.value,
                      })
                    }
                    placeholder="Nationality"
                  />
                </div>

                <div>
                  <label className={labelClass}>Date of Birth</label>
                  <Input
                    type="date"
                    value={passenger.dob || ""}
                    onChange={(event) =>
                      updatePassenger(index, { dob: event.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {form.flightPassengerType === "multiple" && (
          <Button type="button" variant="outline" onClick={addPassenger}>
            Add Passenger
          </Button>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Flight Information
            </h3>
            <p className="text-sm text-slate-500">
              From and To include city, airport name and airport code. Duration
              is saved for every flight.
            </p>
          </div>

          <Button type="button" variant="outline" onClick={addFlight}>
            Add Flight
          </Button>
        </div>

        <datalist id="airport-options">
          {AIRPORT_OPTIONS.map((airport) => (
            <option key={airport} value={airport} />
          ))}
        </datalist>

        <div className="space-y-3">
          {form.flights.map((flight, index) => (
            <div key={flight.id} className="rounded-xl border bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-medium text-slate-900">
                  Flight {index + 1}
                </h4>
                {form.flights.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeFlight(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className={labelClass}>From</label>
                  <Input
                    list="airport-options"
                    value={flight.from}
                    onChange={(event) =>
                      updateFlight(index, { from: event.target.value })
                    }
                    placeholder="City - Airport Name (Code)"
                  />
                </div>

                <div>
                  <label className={labelClass}>To</label>
                  <Input
                    list="airport-options"
                    value={flight.to}
                    onChange={(event) =>
                      updateFlight(index, { to: event.target.value })
                    }
                    placeholder="City - Airport Name (Code)"
                  />
                </div>

                <div>
                  <label className={labelClass}>Airline</label>
                  <Input
                    value={flight.airline}
                    onChange={(event) =>
                      updateFlight(index, { airline: event.target.value })
                    }
                    placeholder="Airline"
                  />
                </div>

                <div>
                  <label className={labelClass}>Flight No</label>
                  <Input
                    value={flight.flightNo}
                    onChange={(event) =>
                      updateFlight(index, { flightNo: event.target.value })
                    }
                    placeholder="Flight no"
                  />
                </div>

                <div>
                  <label className={labelClass}>Departure Date</label>
                  <Input
                    type="date"
                    value={flight.departureDate}
                    onChange={(event) =>
                      updateFlight(index, { departureDate: event.target.value })
                    }
                  />
                </div>

                <div>
                  <label className={labelClass}>Departure Time</label>
                  <Input
                    type="time"
                    value={flight.departureTime}
                    onChange={(event) =>
                      updateFlight(index, { departureTime: event.target.value })
                    }
                  />
                </div>

                <div>
                  <label className={labelClass}>Arrival Date</label>
                  <Input
                    type="date"
                    value={flight.arrivalDate}
                    onChange={(event) =>
                      updateFlight(index, { arrivalDate: event.target.value })
                    }
                  />
                </div>

                <div>
                  <label className={labelClass}>Arrival Time</label>
                  <Input
                    type="time"
                    value={flight.arrivalTime}
                    onChange={(event) =>
                      updateFlight(index, { arrivalTime: event.target.value })
                    }
                  />
                </div>

                <div>
                  <label className={labelClass}>Duration</label>
                  <Input
                    value={flight.duration}
                    onChange={(event) =>
                      updateFlight(index, { duration: event.target.value })
                    }
                    placeholder="Example: 3h 20m"
                  />
                </div>

                <div>
                  <label className={labelClass}>Stop Over Time</label>
                  <Input
                    value={flight.stopOverTime}
                    onChange={(event) =>
                      updateFlight(index, { stopOverTime: event.target.value })
                    }
                    placeholder="Example: 2h 15m"
                    disabled={!flight.isConnectingFlight}
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex h-10 w-full items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={flight.isConnectingFlight}
                      onChange={(event) =>
                        updateFlight(index, {
                          isConnectingFlight: event.target.checked,
                        })
                      }
                    />
                    Connecting flight
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="text-base font-semibold text-slate-900">
            Hotel Information
          </h3>
          <Button type="button" variant="outline" onClick={addHotel}>
            Add Hotel
          </Button>
        </div>

        {form.hotels.length === 0 ? (
          <div className="rounded-xl border border-dashed p-4 text-sm text-slate-500">
            No hotel added.
          </div>
        ) : (
          <div className="space-y-3">
            {form.hotels.map((hotel, index) => (
              <div key={hotel.id} className="rounded-xl border bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-medium text-slate-900">
                    Hotel {index + 1}
                  </h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeHotel(index)}
                  >
                    Remove
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <label className={labelClass}>Hotel Name</label>
                    <Input
                      value={hotel.hotelName}
                      onChange={(event) =>
                        updateHotel(index, { hotelName: event.target.value })
                      }
                      placeholder="Hotel name"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>City</label>
                    <Input
                      value={hotel.city}
                      onChange={(event) =>
                        updateHotel(index, { city: event.target.value })
                      }
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Check In</label>
                    <Input
                      type="date"
                      value={hotel.checkIn}
                      onChange={(event) =>
                        updateHotel(index, { checkIn: event.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Check Out</label>
                    <Input
                      type="date"
                      value={hotel.checkOut}
                      onChange={(event) =>
                        updateHotel(index, { checkOut: event.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Room Type</label>
                    <Input
                      value={hotel.roomType}
                      onChange={(event) =>
                        updateHotel(index, { roomType: event.target.value })
                      }
                      placeholder="Room type"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Nights</label>
                    <Input
                      value={hotel.nights}
                      onChange={(event) =>
                        updateHotel(index, { nights: event.target.value })
                      }
                      placeholder="Nights"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="text-base font-semibold text-slate-900">Payment</h3>

        <div className="grid gap-4 md:grid-cols-6">
          <div>
            <label className={labelClass}>Currency</label>
            <Input
              value={form.currency}
              onChange={(event) => setField("currency", event.target.value)}
              placeholder="PKR"
            />
          </div>

          <div>
            <label className={labelClass}>Base Amount</label>
            <Input
              type="number"
              min="0"
              value={form.baseAmount}
              onChange={(event) => setField("baseAmount", event.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <label className={labelClass}>Tax Amount</label>
            <Input
              type="number"
              min="0"
              value={form.taxAmount}
              onChange={(event) => setField("taxAmount", event.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <label className={labelClass}>Discount</label>
            <Input
              type="number"
              min="0"
              value={form.discountAmount}
              onChange={(event) =>
                setField("discountAmount", event.target.value)
              }
              placeholder="0"
            />
          </div>

          <div>
            <label className={labelClass}>Paid Amount</label>
            <Input
              type="number"
              min="0"
              value={form.paidAmount}
              onChange={(event) => setField("paidAmount", event.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <label className={labelClass}>Total Amount</label>
            <Input
              value={moneyToString(calculatedAmounts.totalAmount)}
              readOnly
            />
          </div>

          <div>
            <label className={labelClass}>Remaining Amount</label>
            <Input
              value={moneyToString(calculatedAmounts.remainingAmount)}
              readOnly
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-base font-semibold text-slate-900">
          Notes & Terms
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={form.notes}
              onChange={(event) => setField("notes", event.target.value)}
              className={textareaClass}
              placeholder="Notes"
            />
          </div>

          <div>
            <label className={labelClass}>Terms and Conditions</label>
            <textarea
              value={form.termsAndConditions}
              onChange={(event) =>
                setField("termsAndConditions", event.target.value)
              }
              className={textareaClass}
              placeholder="Terms and conditions"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </Button>
        )}

        <Button
          type="submit"
          disabled={saving}
          className="bg-slate-900 text-white hover:bg-slate-800"
        >
          {saving
            ? "Saving..."
            : editingRecordId
              ? "Update Ticket"
              : "Save Ticket"}
        </Button>
      </div>
    </form>
  );
}
