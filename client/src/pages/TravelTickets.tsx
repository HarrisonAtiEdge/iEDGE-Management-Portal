// import React, { useEffect, useMemo, useState } from "react";
// import { collection, onSnapshot, Timestamp } from "firebase/firestore";
// import {
//     Eye,
//     FileText,
//     Pencil,
//     RefreshCw,
//     Search,
// } from "lucide-react";

// import { db } from "@/lib/firebase";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//     Dialog,
//     DialogContent,
//     DialogHeader,
//     DialogTitle,
// } from "@/components/ui/dialog";
// import {
//     Tabs,
//     TabsContent,
//     TabsList,
//     TabsTrigger,
// } from "@/components/ui/tabs";

// import TicketForm, { TicketFormData } from "./ticketForm";
// import { TicketPrintable } from "./ticketPrintable";

// const PANEL_ID = "IEDGE-SYSTEM";

// type TicketSource = "new" | "old";

// type FlightPassengerType = "single" | "multiple";

// type TicketRecord = TicketFormData & {
//     id: string;
//     source: TicketSource;
//     createdAt?: any;
//     updatedAt?: any;
//     createdByName?: string;
//     updatedByName?: string;
//     remainingAmount?: any;

//     // New safe fields
//     projectNumber?: string;
//     flightPassengerType?: FlightPassengerType;
// };

// function getNewTicketsCollectionRef() {
//     return collection(db, "Panels", PANEL_ID, "Travel", "Tickets", "Records");
// }

// function getOldTicketsCollectionRef() {
//     return collection(db, "Panels", PANEL_ID, "Travel");
// }

// function toJsDate(value: any): Date | null {
//     if (!value) return null;

//     if (value instanceof Date) {
//         return Number.isNaN(value.getTime()) ? null : value;
//     }

//     if (value instanceof Timestamp) {
//         const d = value.toDate();
//         return Number.isNaN(d.getTime()) ? null : d;
//     }

//     if (typeof value?.toDate === "function") {
//         const d = value.toDate();
//         return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
//     }

//     if (typeof value?.seconds === "number") {
//         const d = new Date(value.seconds * 1000);
//         return Number.isNaN(d.getTime()) ? null : d;
//     }

//     if (typeof value === "string" || typeof value === "number") {
//         const d = new Date(value);
//         return Number.isNaN(d.getTime()) ? null : d;
//     }

//     return null;
// }

// function formatDate(value: any) {
//     if (!value) return "-";

//     if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
//         const [year, month, day] = value.split("-");
//         return `${day}/${month}/${year}`;
//     }

//     const date = toJsDate(value);
//     if (!date) return "-";

//     return date.toLocaleDateString("en-GB", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//     });
// }

// function formatMoney(currency: string, amount: any) {
//     const value = Number(amount || 0);
//     return `${currency || "PKR"} ${value.toLocaleString()}`;
// }

// function normalizeString(value: any) {
//     if (value === undefined || value === null) return "";
//     return String(value);
// }

// function normalizeFlight(flight: any) {
//     return {
//         ...flight,

//         from: normalizeString(flight?.from),
//         to: normalizeString(flight?.to),

//         // New fields for flight info
//         duration: normalizeString(flight?.duration),
//         isConnectingFlight: flight?.isConnectingFlight === true,
//         stopOverTime:
//             flight?.isConnectingFlight === true
//                 ? normalizeString(flight?.stopOverTime)
//                 : "",
//     };
// }

// function normalizeTicket(
//     id: string,
//     source: TicketSource,
//     data: any
// ): TicketRecord {
//     return {
//         id,
//         source,

//         selectedProjectId: normalizeString(data.selectedProjectId),

//         // New project number support.
//         // This checks multiple possible old/new field names safely.
//         projectNumber: normalizeString(
//             data.projectNumber ||
//                 data.projectNo ||
//                 data.selectedProjectNumber ||
//                 data.selectedProjectNo ||
//                 ""
//         ),

//         referenceNo: normalizeString(data.referenceNo),
//         serviceType: normalizeString(data.serviceType || "Air Ticket"),
//         bookingStatus: normalizeString(data.bookingStatus || "Draft"),

//         clientName: normalizeString(data.clientName),
//         contactPerson: normalizeString(data.contactPerson),
//         contactNo: normalizeString(data.contactNo),
//         email: normalizeString(data.email),

//         projectName: normalizeString(data.projectName),
//         destination: normalizeString(data.destination),
//         issueDate: normalizeString(data.issueDate),
//         travelStartDate: normalizeString(data.travelStartDate),
//         travelEndDate: normalizeString(data.travelEndDate),

//         currency: normalizeString(data.currency || "PKR"),
//         baseAmount: normalizeString(data.baseAmount),
//         taxAmount: normalizeString(data.taxAmount),
//         discountAmount: normalizeString(data.discountAmount),
//         totalAmount: normalizeString(data.totalAmount),
//         paidAmount: normalizeString(data.paidAmount),

//         // Important:
//         // New records should save this as false by default from TicketForm.
//         // This keeps old records compatible and does not break existing saved data.
//         showTicketPrice:
//             typeof data.showTicketPrice === "boolean"
//                 ? data.showTicketPrice
//                 : false,

//         // New passenger type option for flight info.
//         flightPassengerType:
//             data.flightPassengerType === "multiple" ? "multiple" : "single",

//         passengers: Array.isArray(data.passengers) ? data.passengers : [],
//         flights: Array.isArray(data.flights)
//             ? data.flights.map((flight: any) => normalizeFlight(flight))
//             : [],
//         hotels: Array.isArray(data.hotels) ? data.hotels : [],

//         notes: normalizeString(data.notes),
//         termsAndConditions: normalizeString(data.termsAndConditions),

//         remainingAmount: data.remainingAmount ?? "",
//         createdAt: data.createdAt || null,
//         updatedAt: data.updatedAt || null,
//         createdByName: normalizeString(data.createdByName),
//         updatedByName: normalizeString(data.updatedByName),
//     };
// }

// export default function TravelTickets() {
//     const [activeTab, setActiveTab] = useState("create");
//     const [tickets, setTickets] = useState<TicketRecord[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [searchText, setSearchText] = useState("");

//     const [editingTicket, setEditingTicket] = useState<TicketRecord | null>(null);
//     const [viewTicket, setViewTicket] = useState<TicketRecord | null>(null);

//     useEffect(() => {
//         setLoading(true);

//         let newTickets: TicketRecord[] = [];
//         let oldTickets: TicketRecord[] = [];

//         const mergeTickets = () => {
//             const newIds = new Set(newTickets.map((item) => item.id));

//             const oldOnlyTickets = oldTickets.filter(
//                 (item) => item.id !== "Tickets" && !newIds.has(item.id)
//             );

//             const merged = [...newTickets, ...oldOnlyTickets].sort((a, b) => {
//                 const aDate =
//                     toJsDate(a.updatedAt || a.createdAt)?.getTime() || 0;
//                 const bDate =
//                     toJsDate(b.updatedAt || b.createdAt)?.getTime() || 0;

//                 return bDate - aDate;
//             });

//             setTickets(merged);
//             setLoading(false);
//         };

//         const unsubscribeNew = onSnapshot(
//             getNewTicketsCollectionRef(),
//             (snapshot) => {
//                 newTickets = snapshot.docs.map((docSnap) =>
//                     normalizeTicket(docSnap.id, "new", docSnap.data())
//                 );

//                 mergeTickets();
//             },
//             (error) => {
//                 console.error("Error loading new ticket records:", error);
//                 setLoading(false);
//             }
//         );

//         const unsubscribeOld = onSnapshot(
//             getOldTicketsCollectionRef(),
//             (snapshot) => {
//                 oldTickets = snapshot.docs
//                     .filter((docSnap) => docSnap.id !== "Tickets")
//                     .map((docSnap) =>
//                         normalizeTicket(docSnap.id, "old", docSnap.data())
//                     );

//                 mergeTickets();
//             },
//             (error) => {
//                 console.error("Error loading old ticket records:", error);
//                 setLoading(false);
//             }
//         );

//         return () => {
//             unsubscribeNew();
//             unsubscribeOld();
//         };
//     }, []);

//     const filteredTickets = useMemo(() => {
//         const value = searchText.trim().toLowerCase();

//         if (!value) return tickets;

//         return tickets.filter((ticket) => {
//             const passengerText = ticket.passengers
//                 .map((passenger: any) =>
//                     [
//                         passenger.title,
//                         passenger.firstName,
//                         passenger.lastName,
//                         passenger.passportNo,
//                     ]
//                         .filter(Boolean)
//                         .join(" ")
//                 )
//                 .join(" ");

//             const flightText = ticket.flights
//                 .map((flight: any) =>
//                     [
//                         flight.from,
//                         flight.to,
//                         flight.airline,
//                         flight.flightNo,
//                         flight.duration,
//                         flight.stopOverTime,
//                     ]
//                         .filter(Boolean)
//                         .join(" ")
//                 )
//                 .join(" ");

//             return [
//                 ticket.referenceNo,
//                 ticket.clientName,
//                 ticket.contactPerson,

//                 // Project search support
//                 ticket.projectName,
//                 ticket.projectNumber,
//                 ticket.selectedProjectId,

//                 ticket.destination,
//                 ticket.serviceType,
//                 ticket.bookingStatus,
//                 passengerText,
//                 flightText,
//             ]
//                 .join(" ")
//                 .toLowerCase()
//                 .includes(value);
//         });
//     }, [tickets, searchText]);

//     const handleEditTicket = (ticket: TicketRecord) => {
//         setEditingTicket(ticket);
//         setActiveTab("create");
//     };

//     const handleSaved = () => {
//         setEditingTicket(null);
//         setActiveTab("list");
//     };

//     return (
//         <div className="w-full space-y-6 p-4 md:p-6">
//             <div className="flex flex-col gap-3 rounded-2xl border bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
//                 <div>
//                     <h1 className="text-2xl font-semibold text-slate-900">
//                         Travel Tickets
//                     </h1>
//                     <p className="text-sm text-slate-500">
//                         Create, view, edit and manage travel ticket records.
//                     </p>
//                 </div>
//             </div>

//             <Tabs value={activeTab} onValueChange={setActiveTab}>
//                 <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100">
//                     <TabsTrigger
//                         value="create"
//                         className="rounded-full border border-slate-300 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm"
//                     >
//                         {editingTicket ? "Edit Ticket" : "Create New"}
//                     </TabsTrigger>

//                     <TabsTrigger
//                         value="list"
//                         className="rounded-full border border-slate-300 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm"
//                     >
//                         Ticket List
//                     </TabsTrigger>
//                 </TabsList>

//                 <TabsContent value="create" className="mt-5">
//                     <TicketForm
//                         key={editingTicket?.id || "new-ticket"}
//                         editingRecordId={editingTicket?.id || null}
//                         editingSource={editingTicket?.source || "new"}
//                         initialData={editingTicket || null}
//                         onSaved={handleSaved}
//                         onCancel={() => {
//                             setEditingTicket(null);
//                             setActiveTab("list");
//                         }}
//                     />
//                 </TabsContent>

//                 <TabsContent value="list" className="mt-5">
//                     <div className="rounded-2xl border bg-white shadow-sm">
//                         <div className="flex flex-col gap-3 border-b p-5 md:flex-row md:items-center md:justify-between">
//                             <div>
//                                 <h2 className="text-lg font-semibold text-slate-900">
//                                     Previous Tickets
//                                 </h2>
//                                 <p className="text-sm text-slate-500">
//                                     Old tickets from the previous Travel path are also shown.
//                                     When you edit and save them, they move to the new nested path.
//                                 </p>
//                             </div>

//                             <div className="relative w-full md:w-96">
//                                 <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
//                                 <Input
//                                     value={searchText}
//                                     onChange={(e) => setSearchText(e.target.value)}
//                                     placeholder="Search by ticket, project name, project number..."
//                                     className="pl-9"
//                                 />
//                             </div>
//                         </div>

//                         {loading ? (
//                             <div className="flex items-center justify-center p-10 text-sm text-slate-500">
//                                 <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
//                                 Loading tickets...
//                             </div>
//                         ) : filteredTickets.length === 0 ? (
//                             <div className="p-10 text-center">
//                                 <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
//                                 <p className="font-medium text-slate-700">No tickets found</p>
//                                 <p className="mt-1 text-sm text-slate-500">
//                                     Create your first travel ticket from the Create New tab.
//                                 </p>
//                             </div>
//                         ) : (
//                             <div className="overflow-x-auto">
//                                 <table className="w-full text-sm">
//                                     <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
//                                         <tr>
//                                             <th className="px-4 py-3">Reference</th>
//                                             <th className="px-4 py-3">Client / Project</th>
//                                             <th className="px-4 py-3">Passenger</th>
//                                             <th className="px-4 py-3">Service</th>
//                                             <th className="px-4 py-3">Travel Date</th>
//                                             <th className="px-4 py-3">Amount</th>
//                                             <th className="px-4 py-3">Status</th>
//                                             <th className="px-4 py-3 text-right">Actions</th>
//                                         </tr>
//                                     </thead>

//                                     <tbody className="divide-y">
//                                         {filteredTickets.map((ticket) => {
//                                             const firstPassenger = ticket.passengers?.[0];

//                                             return (
//                                                 <tr key={`${ticket.source}-${ticket.id}`}>
//                                                     <td className="px-4 py-4 align-top">
//                                                         <p className="font-medium text-slate-900">
//                                                             {ticket.referenceNo || "-"}
//                                                         </p>
//                                                         <p className="mt-1 text-xs text-slate-500">
//                                                             {ticket.source === "old"
//                                                                 ? "Old path"
//                                                                 : "New path"}
//                                                         </p>
//                                                     </td>

//                                                     <td className="px-4 py-4 align-top">
//                                                         <p className="font-medium text-slate-900">
//                                                             {ticket.clientName || "-"}
//                                                         </p>
//                                                         <p className="text-xs text-slate-500">
//                                                             {ticket.projectName || "-"}
//                                                         </p>
//                                                         <p className="text-xs text-slate-400">
//                                                             Project No:{" "}
//                                                             {ticket.projectNumber ||
//                                                                 ticket.selectedProjectId ||
//                                                                 "-"}
//                                                         </p>
//                                                     </td>

//                                                     <td className="px-4 py-4 align-top">
//                                                         <p className="font-medium text-slate-900">
//                                                             {firstPassenger
//                                                                 ? `${firstPassenger.title || ""} ${
//                                                                       firstPassenger.firstName || ""
//                                                                   } ${
//                                                                       firstPassenger.lastName || ""
//                                                                   }`.trim()
//                                                                 : "-"}
//                                                         </p>
//                                                         <p className="text-xs text-slate-500">
//                                                             {ticket.passengers?.length || 0} passenger(s)
//                                                         </p>
//                                                         <p className="text-xs text-slate-400">
//                                                             Flight type:{" "}
//                                                             {ticket.flightPassengerType === "multiple"
//                                                                 ? "Multiple"
//                                                                 : "Single"}
//                                                         </p>
//                                                     </td>

//                                                     <td className="px-4 py-4 align-top">
//                                                         <p>{ticket.serviceType || "-"}</p>
//                                                         <p className="text-xs text-slate-500">
//                                                             {ticket.destination || "-"}
//                                                         </p>
//                                                     </td>

//                                                     <td className="px-4 py-4 align-top">
//                                                         <p>{formatDate(ticket.travelStartDate)}</p>
//                                                         <p className="text-xs text-slate-500">
//                                                             Created: {formatDate(ticket.createdAt)}
//                                                         </p>
//                                                     </td>

//                                                     <td className="px-4 py-4 align-top">
//                                                         {ticket.showTicketPrice ? (
//                                                             <>
//                                                                 <p className="font-medium text-slate-900">
//                                                                     {formatMoney(
//                                                                         ticket.currency,
//                                                                         ticket.totalAmount
//                                                                     )}
//                                                                 </p>
//                                                                 <p className="text-xs text-slate-500">
//                                                                     Remaining:{" "}
//                                                                     {formatMoney(
//                                                                         ticket.currency,
//                                                                         ticket.remainingAmount
//                                                                     )}
//                                                                 </p>
//                                                             </>
//                                                         ) : (
//                                                             <p className="text-xs text-slate-500">
//                                                                 Price hidden
//                                                             </p>
//                                                         )}
//                                                     </td>

//                                                     <td className="px-4 py-4 align-top">
//                                                         <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
//                                                             {ticket.bookingStatus || "Draft"}
//                                                         </span>
//                                                     </td>

//                                                     <td className="px-4 py-4 align-top">
//                                                         <div className="flex justify-end gap-2">
//                                                             <Button
//                                                                 type="button"
//                                                                 variant="outline"
//                                                                 size="sm"
//                                                                 onClick={() => setViewTicket(ticket)}
//                                                             >
//                                                                 <Eye className="mr-1 h-4 w-4" />
//                                                                 View
//                                                             </Button>

//                                                             <Button
//                                                                 type="button"
//                                                                 size="sm"
//                                                                 onClick={() => handleEditTicket(ticket)}
//                                                                 className="bg-slate-900 text-white hover:bg-slate-800"
//                                                             >
//                                                                 <Pencil className="mr-1 h-4 w-4" />
//                                                                 Edit
//                                                             </Button>
//                                                         </div>
//                                                     </td>
//                                                 </tr>
//                                             );
//                                         })}
//                                     </tbody>
//                                 </table>
//                             </div>
//                         )}
//                     </div>
//                 </TabsContent>
//             </Tabs>

//             <Dialog open={!!viewTicket} onOpenChange={() => setViewTicket(null)}>
//                 <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
//                     <DialogHeader>
//                         <DialogTitle>
//                             Ticket Preview
//                             {viewTicket?.referenceNo ? ` - ${viewTicket.referenceNo}` : ""}
//                         </DialogTitle>
//                     </DialogHeader>

//                     {viewTicket && (
//                         <div className="space-y-5">
//                             <TicketPrintable data={viewTicket} />

//                             <div className="flex justify-end gap-2">
//                                 <Button
//                                     type="button"
//                                     variant="outline"
//                                     onClick={() => setViewTicket(null)}
//                                 >
//                                     Close
//                                 </Button>

//                                 <Button
//                                     type="button"
//                                     onClick={() => {
//                                         const selected = viewTicket;
//                                         setViewTicket(null);
//                                         handleEditTicket(selected);
//                                     }}
//                                     className="bg-slate-900 text-white hover:bg-slate-800"
//                                 >
//                                     Edit Ticket
//                                 </Button>
//                             </div>
//                         </div>
//                     )}
//                 </DialogContent>
//             </Dialog>
//         </div>
//     );
// }

import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
import { Eye, FileText, Pencil, RefreshCw, Search } from "lucide-react";

import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import TicketForm, { TicketFormData } from "./ticketForm";
import { TicketPrintable } from "./ticketPrintable";

const PANEL_ID = "IEDGE-SYSTEM";

type TicketSource = "new" | "old";

type FlightPassengerType = "single" | "multiple";

type TicketRecord = TicketFormData & {
    id: string;
    source: TicketSource;
    createdAt?: any;
    updatedAt?: any;
    createdByName?: string;
    updatedByName?: string;
    remainingAmount?: any;

    // New safe fields
    projectCode?: string;
    projectNumber?: string;
    flightPassengerType?: FlightPassengerType;
};

function getNewTicketsCollectionRef() {
    return collection(db, "Panels", PANEL_ID, "Travel", "Tickets", "Records");
}

function getOldTicketsCollectionRef() {
    return collection(db, "Panels", PANEL_ID, "Travel");
}

function toJsDate(value: any): Date | null {
    if (!value) return null;

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    if (value instanceof Timestamp) {
        const d = value.toDate();
        return Number.isNaN(d.getTime()) ? null : d;
    }

    if (typeof value?.toDate === "function") {
        const d = value.toDate();
        return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
    }

    if (typeof value?.seconds === "number") {
        const d = new Date(value.seconds * 1000);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    if (typeof value === "string" || typeof value === "number") {
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    return null;
}

function formatDate(value: any) {
    if (!value) return "-";

    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split("-");
        return `${day}/${month}/${year}`;
    }

    const date = toJsDate(value);
    if (!date) return "-";

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatMoney(currency: string, amount: any) {
    const value = Number(amount || 0);
    return `${currency || "PKR"} ${value.toLocaleString()}`;
}

function normalizeString(value: any) {
    if (value === undefined || value === null) return "";
    return String(value);
}

function normalizeFlight(flight: any) {
    return {
        ...flight,

        from: normalizeString(flight?.from),
        to: normalizeString(flight?.to),

        // New fields for flight info
        duration: normalizeString(flight?.duration),
        isConnectingFlight: flight?.isConnectingFlight === true,
        stopOverTime:
            flight?.isConnectingFlight === true
                ? normalizeString(flight?.stopOverTime)
                : "",
    };
}

function normalizeTicket(
    id: string,
    source: TicketSource,
    data: any,
): TicketRecord {
    return {
        id,
        source,

        selectedProjectId: normalizeString(data.selectedProjectId),
        projectCode: normalizeString(
            data.projectCode || data.code || data.selectedProjectCode || "",
        ),

        // New project number support.
        // This checks multiple possible old/new field names safely.
        projectNumber: normalizeString(
            data.projectNumber ||
                data.projectNo ||
                data.selectedProjectNumber ||
                data.selectedProjectNo ||
                "",
        ),

        referenceNo: normalizeString(data.referenceNo),
        serviceType: normalizeString(data.serviceType || "Air Ticket"),
        bookingStatus: normalizeString(data.bookingStatus || "Draft"),

        clientName: normalizeString(data.clientName),
        contactPerson: normalizeString(data.contactPerson),
        contactNo: normalizeString(data.contactNo),
        email: normalizeString(data.email),

        projectName: normalizeString(data.projectName),
        destination: normalizeString(data.destination),
        issueDate: normalizeString(data.issueDate),
        travelStartDate: normalizeString(data.travelStartDate),
        travelEndDate: normalizeString(data.travelEndDate),

        currency: normalizeString(data.currency || "PKR"),
        baseAmount: normalizeString(data.baseAmount),
        taxAmount: normalizeString(data.taxAmount),
        discountAmount: normalizeString(data.discountAmount),
        totalAmount: normalizeString(data.totalAmount),
        paidAmount: normalizeString(data.paidAmount),

        // Important:
        // New records should save this as false by default from TicketForm.
        // This keeps old records compatible and does not break existing saved data.
        showTicketPrice:
            typeof data.showTicketPrice === "boolean"
                ? data.showTicketPrice
                : false,

        // New passenger type option for flight info.
        flightPassengerType:
            data.flightPassengerType === "multiple" ? "multiple" : "single",

        passengers: Array.isArray(data.passengers) ? data.passengers : [],
        flights: Array.isArray(data.flights)
            ? data.flights.map((flight: any) => normalizeFlight(flight))
            : [],
        hotels: Array.isArray(data.hotels) ? data.hotels : [],

        notes: normalizeString(data.notes),
        termsAndConditions: normalizeString(data.termsAndConditions),

        remainingAmount: data.remainingAmount ?? "",
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null,
        createdByName: normalizeString(data.createdByName),
        updatedByName: normalizeString(data.updatedByName),
    };
}

export default function TravelTickets() {
    const [activeTab, setActiveTab] = useState("create");
    const [tickets, setTickets] = useState<TicketRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");

    const [editingTicket, setEditingTicket] = useState<TicketRecord | null>(
        null,
    );
    const [viewTicket, setViewTicket] = useState<TicketRecord | null>(null);

    useEffect(() => {
        setLoading(true);

        let newTickets: TicketRecord[] = [];
        let oldTickets: TicketRecord[] = [];

        const mergeTickets = () => {
            const newIds = new Set(newTickets.map((item) => item.id));

            const oldOnlyTickets = oldTickets.filter(
                (item) => item.id !== "Tickets" && !newIds.has(item.id),
            );

            const merged = [...newTickets, ...oldOnlyTickets].sort((a, b) => {
                const aDate =
                    toJsDate(a.updatedAt || a.createdAt)?.getTime() || 0;
                const bDate =
                    toJsDate(b.updatedAt || b.createdAt)?.getTime() || 0;

                return bDate - aDate;
            });

            setTickets(merged);
            setLoading(false);
        };

        const unsubscribeNew = onSnapshot(
            getNewTicketsCollectionRef(),
            (snapshot) => {
                newTickets = snapshot.docs.map((docSnap) =>
                    normalizeTicket(docSnap.id, "new", docSnap.data()),
                );

                mergeTickets();
            },
            (error) => {
                console.error("Error loading new ticket records:", error);
                setLoading(false);
            },
        );

        const unsubscribeOld = onSnapshot(
            getOldTicketsCollectionRef(),
            (snapshot) => {
                oldTickets = snapshot.docs
                    .filter((docSnap) => docSnap.id !== "Tickets")
                    .map((docSnap) =>
                        normalizeTicket(docSnap.id, "old", docSnap.data()),
                    );

                mergeTickets();
            },
            (error) => {
                console.error("Error loading old ticket records:", error);
                setLoading(false);
            },
        );

        return () => {
            unsubscribeNew();
            unsubscribeOld();
        };
    }, []);

    const filteredTickets = useMemo(() => {
        const value = searchText.trim().toLowerCase();

        if (!value) return tickets;

        return tickets.filter((ticket) => {
            const passengerText = ticket.passengers
                .map((passenger: any) =>
                    [
                        passenger.title,
                        passenger.firstName,
                        passenger.lastName,
                        passenger.passportNo,
                    ]
                        .filter(Boolean)
                        .join(" "),
                )
                .join(" ");

            const flightText = ticket.flights
                .map((flight: any) =>
                    [
                        flight.from,
                        flight.to,
                        flight.airline,
                        flight.flightNo,
                        flight.duration,
                        flight.stopOverTime,
                    ]
                        .filter(Boolean)
                        .join(" "),
                )
                .join(" ");

            return [
                ticket.referenceNo,
                ticket.clientName,
                ticket.contactPerson,

                // Project search support
                ticket.projectName,
                ticket.projectCode,
                ticket.projectNumber,
                ticket.selectedProjectId,

                ticket.destination,
                ticket.serviceType,
                ticket.bookingStatus,
                passengerText,
                flightText,
            ]
                .join(" ")
                .toLowerCase()
                .includes(value);
        });
    }, [tickets, searchText]);

    const handleEditTicket = (ticket: TicketRecord) => {
        setEditingTicket(ticket);
        setActiveTab("create");
    };

    const handleSaved = () => {
        setEditingTicket(null);
        setActiveTab("list");
    };

    return (
        <div className="w-full space-y-6 p-4 md:p-6">
            <div className="flex flex-col gap-3 rounded-2xl border bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">
                        Travel Tickets
                    </h1>
                    <p className="text-sm text-slate-500">
                        Create, view, edit and manage travel ticket records.
                    </p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100">
                    <TabsTrigger
                        value="create"
                        className="rounded-full border border-slate-300 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm"
                    >
                        {editingTicket ? "Edit Ticket" : "Create New"}
                    </TabsTrigger>

                    <TabsTrigger
                        value="list"
                        className="rounded-full border border-slate-300 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm"
                    >
                        Ticket List
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="create" className="mt-5">
                    <TicketForm
                        key={editingTicket?.id || "new-ticket"}
                        editingRecordId={editingTicket?.id || null}
                        editingSource={editingTicket?.source || "new"}
                        initialData={editingTicket || null}
                        onSaved={handleSaved}
                        onCancel={() => {
                            setEditingTicket(null);
                            setActiveTab("list");
                        }}
                    />
                </TabsContent>

                <TabsContent value="list" className="mt-5">
                    <div className="rounded-2xl border bg-white shadow-sm">
                        <div className="flex flex-col gap-3 border-b p-5 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Previous Tickets
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Old tickets from the previous Travel path
                                    are also shown. When you edit and save them,
                                    they move to the new nested path.
                                </p>
                            </div>

                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    value={searchText}
                                    onChange={(e) =>
                                        setSearchText(e.target.value)
                                    }
                                    placeholder="Search by ticket, project code, project name, project number..."
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center p-10 text-sm text-slate-500">
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Loading tickets...
                            </div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="p-10 text-center">
                                <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                                <p className="font-medium text-slate-700">
                                    No tickets found
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Create your first travel ticket from the
                                    Create New tab.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3">
                                                Reference
                                            </th>
                                            <th className="px-4 py-3">
                                                Client / Project
                                            </th>
                                            <th className="px-4 py-3">
                                                Passenger
                                            </th>
                                            <th className="px-4 py-3">
                                                Service
                                            </th>
                                            <th className="px-4 py-3">
                                                Travel Date
                                            </th>
                                            <th className="px-4 py-3">
                                                Amount
                                            </th>
                                            <th className="px-4 py-3">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y">
                                        {filteredTickets.map((ticket) => {
                                            const firstPassenger =
                                                ticket.passengers?.[0];

                                            return (
                                                <tr
                                                    key={`${ticket.source}-${ticket.id}`}
                                                >
                                                    <td className="px-4 py-4 align-top">
                                                        <p className="font-medium text-slate-900">
                                                            {ticket.referenceNo ||
                                                                "-"}
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {ticket.source ===
                                                            "old"
                                                                ? "Old path"
                                                                : "New path"}
                                                        </p>
                                                    </td>

                                                    <td className="px-4 py-4 align-top">
                                                        <p className="font-medium text-slate-900">
                                                            {ticket.clientName ||
                                                                "-"}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {ticket.projectName ||
                                                                "-"}
                                                        </p>
                                                        <p className="text-xs text-slate-400">
                                                            Project Code:{" "}
                                                            {ticket.projectCode ||
                                                                "-"}
                                                        </p>
                                                        <p className="text-xs text-slate-400">
                                                            Project No:{" "}
                                                            {ticket.projectNumber ||
                                                                ticket.selectedProjectId ||
                                                                "-"}
                                                        </p>
                                                    </td>

                                                    <td className="px-4 py-4 align-top">
                                                        <p className="font-medium text-slate-900">
                                                            {firstPassenger
                                                                ? `${firstPassenger.title || ""} ${
                                                                      firstPassenger.firstName ||
                                                                      ""
                                                                  } ${
                                                                      firstPassenger.lastName ||
                                                                      ""
                                                                  }`.trim()
                                                                : "-"}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {ticket.passengers
                                                                ?.length ||
                                                                0}{" "}
                                                            passenger(s)
                                                        </p>
                                                        <p className="text-xs text-slate-400">
                                                            Flight type:{" "}
                                                            {ticket.flightPassengerType ===
                                                            "multiple"
                                                                ? "Multiple"
                                                                : "Single"}
                                                        </p>
                                                    </td>

                                                    <td className="px-4 py-4 align-top">
                                                        <p>
                                                            {ticket.serviceType ||
                                                                "-"}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {ticket.destination ||
                                                                "-"}
                                                        </p>
                                                    </td>

                                                    <td className="px-4 py-4 align-top">
                                                        <p>
                                                            {formatDate(
                                                                ticket.travelStartDate,
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            Created:{" "}
                                                            {formatDate(
                                                                ticket.createdAt,
                                                            )}
                                                        </p>
                                                    </td>

                                                    <td className="px-4 py-4 align-top">
                                                        {ticket.showTicketPrice ? (
                                                            <>
                                                                <p className="font-medium text-slate-900">
                                                                    {formatMoney(
                                                                        ticket.currency,
                                                                        ticket.totalAmount,
                                                                    )}
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    Remaining:{" "}
                                                                    {formatMoney(
                                                                        ticket.currency,
                                                                        ticket.remainingAmount,
                                                                    )}
                                                                </p>
                                                            </>
                                                        ) : (
                                                            <p className="text-xs text-slate-500">
                                                                Price hidden
                                                            </p>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-4 align-top">
                                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                                            {ticket.bookingStatus ||
                                                                "Draft"}
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-4 align-top">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    setViewTicket(
                                                                        ticket,
                                                                    )
                                                                }
                                                            >
                                                                <Eye className="mr-1 h-4 w-4" />
                                                                View
                                                            </Button>

                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleEditTicket(
                                                                        ticket,
                                                                    )
                                                                }
                                                                className="bg-slate-900 text-white hover:bg-slate-800"
                                                            >
                                                                <Pencil className="mr-1 h-4 w-4" />
                                                                Edit
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            <Dialog
                open={!!viewTicket}
                onOpenChange={() => setViewTicket(null)}
            >
                <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Ticket Preview
                            {viewTicket?.referenceNo
                                ? ` - ${viewTicket.referenceNo}`
                                : ""}
                        </DialogTitle>
                    </DialogHeader>

                    {viewTicket && (
                        <div className="space-y-5">
                            <TicketPrintable data={viewTicket} />

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setViewTicket(null)}
                                >
                                    Close
                                </Button>

                                <Button
                                    type="button"
                                    onClick={() => {
                                        const selected = viewTicket;
                                        setViewTicket(null);
                                        handleEditTicket(selected);
                                    }}
                                    className="bg-slate-900 text-white hover:bg-slate-800"
                                >
                                    Edit Ticket
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
