// import React from "react";
// import { Printer } from "lucide-react";

// import { Button } from "@/components/ui/button";
// import type {
//   FlightInfo,
//   HotelInfo,
//   PassengerInfo,
//   TicketFormData,
// } from "./ticketForm";

// type TicketPrintableData = Omit<TicketFormData, "totalAmount"> & {
//   totalAmount?: string | number;
//   remainingAmount?: string | number;
//   createdAt?: any;
//   updatedAt?: any;
//   createdByName?: string;
//   updatedByName?: string;
// };

// type TicketPrintableProps = {
//   data: TicketPrintableData;
// };

// function formatDate(value?: string | null) {
//   if (!value) return "-";

//   if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
//     const [year, month, day] = value.split("-");
//     return `${day}/${month}/${year}`;
//   }

//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return String(value);

//   return date.toLocaleDateString("en-GB", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// }

// function formatTime(value?: string | null) {
//   if (!value) return "-";
//   return value;
// }

// function formatMoney(currency: string, amount?: string | number | null) {
//   const value = Number(amount || 0);
//   return `${currency || "PKR"} ${value.toLocaleString()}`;
// }

// function getPassengerName(passenger: PassengerInfo) {
//   return [passenger.title, passenger.firstName, passenger.lastName]
//     .filter(Boolean)
//     .join(" ")
//     .trim();
// }

// export function TicketPrintable({ data }: TicketPrintableProps) {
//   const passengers: PassengerInfo[] = Array.isArray(data.passengers)
//     ? data.passengers
//     : [];

//   const flights: FlightInfo[] = Array.isArray(data.flights)
//     ? data.flights
//     : [];

//   const hotels: HotelInfo[] = Array.isArray(data.hotels) ? data.hotels : [];

//   const baseAmount = Number(data.baseAmount || 0);
//   const taxAmount = Number(data.taxAmount || 0);
//   const discountAmount = Number(data.discountAmount || 0);
//   const paidAmount = Number(data.paidAmount || 0);

//   const calculatedTotal =
//     data.totalAmount !== undefined && data.totalAmount !== ""
//       ? Number(data.totalAmount || 0)
//       : Math.max(baseAmount + taxAmount - discountAmount, 0);

//   const remainingAmount =
//     data.remainingAmount !== undefined && data.remainingAmount !== ""
//       ? Number(data.remainingAmount || 0)
//       : Math.max(calculatedTotal - paidAmount, 0);

//   const handlePrint = () => {
//     window.print();
//   };

//   return (
//     <div className="w-full">
//       <div className="mb-4 flex justify-end print:hidden">
//         <Button
//           type="button"
//           onClick={handlePrint}
//           className="bg-slate-900 text-white hover:bg-slate-800"
//         >
//           <Printer className="mr-2 h-4 w-4" />
//           Print
//         </Button>
//       </div>

//       <div className="mx-auto max-w-5xl rounded-2xl border bg-white p-8 text-slate-900 shadow-sm print:border-0 print:shadow-none">
//         <div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-start md:justify-between">
//           <div>
//             <h1 className="text-3xl font-bold tracking-tight">
//               iEDGE Travel & Tours
//             </h1>
//             <p className="mt-1 text-sm text-slate-500">
//               Ticket / Travel Service Confirmation
//             </p>
//           </div>

//           <div className="rounded-xl bg-slate-900 px-5 py-4 text-white">
//             <p className="text-xs uppercase tracking-wide text-slate-300">
//               Reference No.
//             </p>
//             <p className="text-xl font-semibold">
//               {data.referenceNo || "-"}
//             </p>
//           </div>
//         </div>

//         <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
//           <InfoBox label="Service Type" value={data.serviceType || "-"} />
//           <InfoBox label="Booking Status" value={data.bookingStatus || "-"} />
//           <InfoBox label="Issue Date" value={formatDate(data.issueDate)} />
//           <InfoBox label="Destination" value={data.destination || "-"} />
//         </div>

//         <SectionTitle title="Client & Project Information" />

//         <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
//           <InfoBox label="Client Name" value={data.clientName || "-"} />
//           <InfoBox label="Contact Person" value={data.contactPerson || "-"} />
//           <InfoBox label="Contact No." value={data.contactNo || "-"} />
//           <InfoBox label="Email" value={data.email || "-"} />
//           <InfoBox
//             label="Project / Trip Name"
//             value={data.projectName || "-"}
//             className="md:col-span-2"
//           />
//           <InfoBox
//             label="Travel Period"
//             value={`${formatDate(data.travelStartDate)} to ${formatDate(
//               data.travelEndDate
//             )}`}
//             className="md:col-span-2"
//           />
//         </div>

//         <SectionTitle title="Passenger Information" />

//         {passengers.length === 0 ? (
//           <EmptyState text="No passenger information added." />
//         ) : (
//           <div className="overflow-x-auto rounded-xl border">
//             <table className="w-full text-sm">
//               <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
//                 <tr>
//                   <th className="px-4 py-3">#</th>
//                   <th className="px-4 py-3">Passenger Name</th>
//                   <th className="px-4 py-3">Passport No.</th>
//                   <th className="px-4 py-3">Nationality</th>
//                   <th className="px-4 py-3">Date of Birth</th>
//                 </tr>
//               </thead>

//               <tbody className="divide-y">
//                 {passengers.map((passenger, index) => (
//                   <tr key={index}>
//                     <td className="px-4 py-3">{index + 1}</td>
//                     <td className="px-4 py-3 font-medium">
//                       {getPassengerName(passenger) || "-"}
//                     </td>
//                     <td className="px-4 py-3">
//                       {passenger.passportNo || "-"}
//                     </td>
//                     <td className="px-4 py-3">
//                       {passenger.nationality || "-"}
//                     </td>
//                     <td className="px-4 py-3">
//                       {formatDate(passenger.dateOfBirth)}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}

//         <SectionTitle title="Flight Information" />

//         {flights.length === 0 ? (
//           <EmptyState text="No flight information added." />
//         ) : (
//           <div className="space-y-4">
//             {flights.map((flight, index) => (
//               <div key={index} className="rounded-xl border p-4">
//                 <div className="mb-3 flex items-center justify-between">
//                   <p className="font-semibold">Flight {index + 1}</p>
//                   <p className="text-sm text-slate-500">
//                     {flight.airline || "-"} {flight.flightNo || ""}
//                   </p>
//                 </div>

//                 <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
//                   <InfoBox label="Airline" value={flight.airline || "-"} />
//                   <InfoBox label="Flight No." value={flight.flightNo || "-"} />
//                   <InfoBox label="PNR" value={flight.pnr || "-"} />
//                   <InfoBox label="Ticket No." value={flight.ticketNo || "-"} />
//                   <InfoBox label="From" value={flight.from || "-"} />
//                   <InfoBox label="To" value={flight.to || "-"} />
//                   <InfoBox
//                     label="Departure"
//                     value={`${formatDate(
//                       flight.departureDate
//                     )} ${formatTime(flight.departureTime)}`}
//                   />
//                   <InfoBox
//                     label="Arrival"
//                     value={`${formatDate(flight.arrivalDate)} ${formatTime(
//                       flight.arrivalTime
//                     )}`}
//                   />
//                   <InfoBox
//                     label="Baggage"
//                     value={flight.baggage || "-"}
//                     className="md:col-span-4"
//                   />
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}

//         {hotels.length > 0 && (
//           <>
//             <SectionTitle title="Hotel Information" />

//             <div className="space-y-4">
//               {hotels.map((hotel, index) => (
//                 <div key={index} className="rounded-xl border p-4">
//                   <div className="mb-3 flex items-center justify-between">
//                     <p className="font-semibold">Hotel {index + 1}</p>
//                     <p className="text-sm text-slate-500">
//                       {hotel.city || "-"}
//                     </p>
//                   </div>

//                   <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
//                     <InfoBox
//                       label="Hotel Name"
//                       value={hotel.hotelName || "-"}
//                     />
//                     <InfoBox label="City" value={hotel.city || "-"} />
//                     <InfoBox
//                       label="Check In"
//                       value={formatDate(hotel.checkIn)}
//                     />
//                     <InfoBox
//                       label="Check Out"
//                       value={formatDate(hotel.checkOut)}
//                     />
//                     <InfoBox label="Room Type" value={hotel.roomType || "-"} />
//                     <InfoBox label="Meal Plan" value={hotel.mealPlan || "-"} />
//                     <InfoBox
//                       label="Confirmation No."
//                       value={hotel.confirmationNo || "-"}
//                       className="md:col-span-2"
//                     />
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </>
//         )}

//         <SectionTitle title="Amount Details" />

//         {data.showTicketPrice ? (
//           <div className="flex justify-end">
//             <div className="w-full max-w-md rounded-xl border bg-slate-50 p-5">
//               <AmountRow
//                 label="Base Amount"
//                 value={formatMoney(data.currency, baseAmount)}
//               />
//               <AmountRow
//                 label="Tax Amount"
//                 value={formatMoney(data.currency, taxAmount)}
//               />
//               <AmountRow
//                 label="Discount"
//                 value={formatMoney(data.currency, discountAmount)}
//               />

//               <div className="my-3 border-t" />

//               <AmountRow
//                 label="Total Amount"
//                 value={formatMoney(data.currency, calculatedTotal)}
//                 strong
//               />
//               <AmountRow
//                 label="Paid Amount"
//                 value={formatMoney(data.currency, paidAmount)}
//               />
//               <AmountRow
//                 label="Remaining Amount"
//                 value={formatMoney(data.currency, remainingAmount)}
//                 strong
//               />
//             </div>
//           </div>
//         ) : (
//           <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
//             Ticket price is hidden for this printable record.
//           </div>
//         )}

//         {(data.notes || data.termsAndConditions) && (
//           <>
//             <SectionTitle title="Notes & Terms" />

//             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//               <div className="rounded-xl border p-4">
//                 <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
//                   Notes
//                 </p>
//                 <p className="whitespace-pre-wrap text-sm text-slate-700">
//                   {data.notes || "-"}
//                 </p>
//               </div>

//               <div className="rounded-xl border p-4">
//                 <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
//                   Terms & Conditions
//                 </p>
//                 <p className="whitespace-pre-wrap text-sm text-slate-700">
//                   {data.termsAndConditions || "-"}
//                 </p>
//               </div>
//             </div>
//           </>
//         )}

//         <div className="mt-10 border-t pt-6 text-xs text-slate-500">
//           <p>
//             This document is generated from the iEDGE Travel Management System.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

// function SectionTitle({ title }: { title: string }) {
//   return (
//     <h2 className="mb-4 mt-8 border-b pb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
//       {title}
//     </h2>
//   );
// }

// function InfoBox({
//   label,
//   value,
//   className = "",
// }: {
//   label: string;
//   value: string;
//   className?: string;
// }) {
//   return (
//     <div className={`rounded-xl border bg-white p-4 ${className}`}>
//       <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
//         {label}
//       </p>
//       <p className="mt-1 break-words text-sm font-medium text-slate-900">
//         {value}
//       </p>
//     </div>
//   );
// }

// function AmountRow({
//   label,
//   value,
//   strong = false,
// }: {
//   label: string;
//   value: string;
//   strong?: boolean;
// }) {
//   return (
//     <div className="flex items-center justify-between py-1 text-sm">
//       <span className="text-slate-600">{label}</span>
//       <span
//         className={
//           strong
//             ? "text-base font-bold text-slate-950"
//             : "font-medium text-slate-800"
//         }
//       >
//         {value}
//       </span>
//     </div>
//   );
// }

// function EmptyState({ text }: { text: string }) {
//   return (
//     <div className="rounded-xl border border-dashed bg-slate-50 p-5 text-sm text-slate-500">
//       {text}
//     </div>
//   );
// }

import React from "react";

import { TicketFormData } from "./ticketForm";

type TicketPrintableProps = {
  data: TicketFormData;
};

function formatDate(value: any) {
  if (!value) return "-";

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }

  if (typeof value?.toDate === "function") {
    const date = value.toDate();
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

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

function passengerName(passenger: any) {
  return (
    [passenger?.title, passenger?.firstName, passenger?.lastName]
      .filter(Boolean)
      .join(" ") || "-"
  );
}

export function TicketPrintable({ data }: TicketPrintableProps) {
  return (
    <div className="space-y-6 rounded-2xl border bg-white p-6 text-sm text-slate-800 print:border-0 print:p-0">
      <div className="flex flex-col gap-3 border-b pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">
            Travel Ticket
          </h2>
          <p className="text-slate-500">Reference: {data.referenceNo || "-"}</p>
        </div>

        <div className="text-left md:text-right">
          <p className="font-medium text-slate-900">
            {data.bookingStatus || "Draft"}
          </p>
          <p className="text-slate-500">
            Issue Date: {formatDate(data.issueDate)}
          </p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Info label="Client" value={data.clientName} />
        <Info label="Contact Person" value={data.contactPerson} />
        <Info label="Contact No" value={data.contactNo} />
        <Info label="Email" value={data.email} />
        <Info label="Project Name" value={data.projectName} />
        <Info
          label="Project Number"
          value={data.projectNumber || data.selectedProjectId}
        />
        <Info label="Destination" value={data.destination} />
        <Info label="Travel Start" value={formatDate(data.travelStartDate)} />
        <Info label="Travel End" value={formatDate(data.travelEndDate)} />
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">Passengers</h3>
          <p className="text-xs text-slate-500">
            Passenger Type:{" "}
            {data.flightPassengerType === "multiple" ? "Multiple" : "Single"}
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Passport</th>
                <th className="px-3 py-2">Nationality</th>
                <th className="px-3 py-2">DOB</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(data.passengers || []).map((passenger: any, index: number) => (
                <tr key={passenger.id || index}>
                  <td className="px-3 py-2">{index + 1}</td>
                  <td className="px-3 py-2 font-medium">
                    {passengerName(passenger)}
                  </td>
                  <td className="px-3 py-2">{passenger.passportNo || "-"}</td>
                  <td className="px-3 py-2">{passenger.nationality || "-"}</td>
                  <td className="px-3 py-2">{formatDate(passenger.dob)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-slate-950">Flights</h3>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">From</th>
                <th className="px-3 py-2">To</th>
                <th className="px-3 py-2">Airline / Flight</th>
                <th className="px-3 py-2">Departure</th>
                <th className="px-3 py-2">Arrival</th>
                <th className="px-3 py-2">Duration</th>
                <th className="px-3 py-2">Connecting</th>
                <th className="px-3 py-2">Stop Over</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(data.flights || []).map((flight: any, index: number) => (
                <tr key={flight.id || index}>
                  <td className="px-3 py-2">{index + 1}</td>
                  <td className="px-3 py-2">{flight.from || "-"}</td>
                  <td className="px-3 py-2">{flight.to || "-"}</td>
                  <td className="px-3 py-2">
                    {[flight.airline, flight.flightNo]
                      .filter(Boolean)
                      .join(" / ") || "-"}
                  </td>
                  <td className="px-3 py-2">
                    {[formatDate(flight.departureDate), flight.departureTime]
                      .filter(Boolean)
                      .join(" ")}
                  </td>
                  <td className="px-3 py-2">
                    {[formatDate(flight.arrivalDate), flight.arrivalTime]
                      .filter(Boolean)
                      .join(" ")}
                  </td>
                  <td className="px-3 py-2">{flight.duration || "-"}</td>
                  <td className="px-3 py-2">
                    {flight.isConnectingFlight ? "Yes" : "No"}
                  </td>
                  <td className="px-3 py-2">
                    {flight.isConnectingFlight
                      ? flight.stopOverTime || "-"
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {(data.hotels || []).length > 0 && (
        <section className="space-y-3">
          <h3 className="text-base font-semibold text-slate-950">Hotels</h3>

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Hotel</th>
                  <th className="px-3 py-2">City</th>
                  <th className="px-3 py-2">Check In</th>
                  <th className="px-3 py-2">Check Out</th>
                  <th className="px-3 py-2">Room</th>
                  <th className="px-3 py-2">Nights</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(data.hotels || []).map((hotel: any, index: number) => (
                  <tr key={hotel.id || index}>
                    <td className="px-3 py-2">{hotel.hotelName || "-"}</td>
                    <td className="px-3 py-2">{hotel.city || "-"}</td>
                    <td className="px-3 py-2">{formatDate(hotel.checkIn)}</td>
                    <td className="px-3 py-2">{formatDate(hotel.checkOut)}</td>
                    <td className="px-3 py-2">{hotel.roomType || "-"}</td>
                    <td className="px-3 py-2">{hotel.nights || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {data.showTicketPrice && (
        <section className="space-y-3">
          <h3 className="text-base font-semibold text-slate-950">Payment</h3>

          <div className="grid gap-3 md:grid-cols-5">
            <Info
              label="Base Amount"
              value={formatMoney(data.currency, data.baseAmount)}
            />
            <Info
              label="Tax"
              value={formatMoney(data.currency, data.taxAmount)}
            />
            <Info
              label="Discount"
              value={formatMoney(data.currency, data.discountAmount)}
            />
            <Info
              label="Total"
              value={formatMoney(data.currency, data.totalAmount)}
            />
            <Info
              label="Remaining"
              value={formatMoney(data.currency, data.remainingAmount)}
            />
          </div>
        </section>
      )}

      {(data.notes || data.termsAndConditions) && (
        <section className="grid gap-4 md:grid-cols-2">
          {data.notes && <Info label="Notes" value={data.notes} />}
          {data.termsAndConditions && (
            <Info
              label="Terms and Conditions"
              value={data.termsAndConditions}
            />
          )}
        </section>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value?: any }) {
  return (
    <div className="rounded-xl border bg-slate-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap font-medium text-slate-900">
        {value || "-"}
      </p>
    </div>
  );
}
