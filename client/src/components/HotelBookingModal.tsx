// "use client";

// import { useState } from "react";
// import { addDoc, collection, serverTimestamp } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Card } from "@/components/ui/card";
// import { Hotel, Room } from "@/pages/UserTravel";

// const PANEL_ID = "IEDGE-SYSTEM";

// export default function HotelBookingModal({
//   hotel,
//   room,
//   totalGuests,
//   checkIn,
//   checkOut,
//   onClose,
// }: {
//   hotel: Hotel;
//   room: Room;
//   totalGuests: number;
//   checkIn: string;
//   checkOut: string;
//   onClose: () => void;
// }) {
//   const [guests, setGuests] = useState(
//     Array.from({ length: totalGuests }, () => ({
//       firstName: "",
//       lastName: "",
//       cnic: "",
//     }))
//   );

//   const [contact, setContact] = useState({
//     phone: "",
//     email: "",
//   });

//   const [extras, setExtras] = useState({
//     sharedRoom: false,
//     pickDrop: false,
//     fullDayCar: false,
//   });

//   const submit = async () => {
//     if (guests.some((g) => !g.firstName || !g.lastName || !g.cnic)) {
//       alert("Fill all guest details");
//       return;
//     }

//     await addDoc(
//       collection(
//         db,
//         "Panels",
//         PANEL_ID,
//         "Travel",
//         "HotelRequests",
//         "items"
//       ),
//       {
//         hotelId: hotel.id,
//         hotelName: hotel.hotelName,
//         roomType: room.roomType,
//         stayType: room.stayType,
//         rate: room.rate,
//         checkIn,
//         checkOut,
//         guests,
//         contact,
//         extras,
//         status: "pending",
//         createdAt: serverTimestamp(),
//       }
//     );

//     alert("Booking request submitted");
//     onClose();
//   };

//   return (
//     <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
//       <Card className="w-full max-w-2xl p-4 space-y-4 overflow-y-auto max-h-[90vh]">
//         <h2 className="text-lg font-semibold">
//           {hotel.hotelName} – {room.roomType}
//         </h2>

//         {guests.map((g, i) => (
//           <div key={i} className="grid grid-cols-3 gap-2">
//             <Input
//               placeholder="First Name"
//               value={g.firstName}
//               onChange={(e) => {
//                 const copy = [...guests];
//                 copy[i].firstName = e.target.value;
//                 setGuests(copy);
//               }}
//             />
//             <Input
//               placeholder="Last Name"
//               value={g.lastName}
//               onChange={(e) => {
//                 const copy = [...guests];
//                 copy[i].lastName = e.target.value;
//                 setGuests(copy);
//               }}
//             />
//             <Input
//               placeholder="CNIC"
//               value={g.cnic}
//               onChange={(e) => {
//                 const copy = [...guests];
//                 copy[i].cnic = e.target.value;
//                 setGuests(copy);
//               }}
//             />
//           </div>
//         ))}

//         <div className="grid grid-cols-2 gap-2">
//           <Input
//             placeholder="Phone"
//             value={contact.phone}
//             onChange={(e) =>
//               setContact({ ...contact, phone: e.target.value })
//             }
//           />
//           <Input
//             placeholder="Email"
//             value={contact.email}
//             onChange={(e) =>
//               setContact({ ...contact, email: e.target.value })
//             }
//           />
//         </div>

//         <div className="flex gap-4 text-sm">
//           {Object.keys(extras).map((k) => (
//             <label key={k} className="flex gap-1 items-center">
//               <input
//                 type="checkbox"
//                 checked={(extras as any)[k]}
//                 onChange={(e) =>
//                   setExtras({ ...extras, [k]: e.target.checked })
//                 }
//               />
//               {k}
//             </label>
//           ))}
//         </div>

//         <div className="flex justify-end gap-2">
//           <Button variant="outline" onClick={onClose}>
//             Cancel
//           </Button>
//           <Button onClick={submit}>Submit Booking</Button>
//         </div>
//       </Card>
//     </div>
//   );
// }

// HotelBookingModal.tsx
import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Hotel, Room } from "@/pages/UserTravel";
import { updateDoc } from "firebase/firestore";

const PANEL_ID = "IEDGE-SYSTEM";

const CLIENTS_COLLECTION = collection(db, "Panels", PANEL_ID, "clients");
const ESTIMATES_COLLECTION = collection(db, "Panels", PANEL_ID, "estimates");
const COUNTER_DOC = doc(db, "Panels", PANEL_ID, "counters", "estimates");

// ✅ hotel base doc path (for full address + taxType etc.)
const HOTEL_DOC = (hotelId: string) =>
  doc(db, "Panels", PANEL_ID, "Travel", "Hotels", "items", hotelId);

// ✅ room doc path (for tax fields stored in room info)
const ROOM_DOC = (hotelId: string, roomId: string) =>
  doc(
    db,
    "Panels",
    PANEL_ID,
    "Travel",
    "Hotels",
    "items",
    hotelId,
    "rooms",
    roomId,
  );

// ✅ travel terms conditions (adjust field name if yours differs)
const TERMS_COLLECTION = collection(db, "Panels", PANEL_ID, "termsConditions");

type ClientDoc = {
  id: string;
  name?: string;
  clientName?: string;
  rates?: {
    travel?: number; // service charge %
  };
};

type TermsDoc = {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  division?: string; // if you have
  company?: string; // if you have
  category?: string; // if you have
};

function formatYYYYMMDD(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function nightsBetween(checkIn: string, checkOut: string) {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  const ms = b.getTime() - a.getTime();
  const n = Math.round(ms / (1000 * 60 * 60 * 24));
  return n > 0 ? n : 1;
}

function pad(num: number, size: number) {
  return String(num).padStart(size, "0");
}

// ✅ helper to safely read numbers
const num = (v: any) =>
  v === null || v === undefined || v === "" ? 0 : Number(v) || 0;

export default function HotelBookingModal({
  hotel,
  room,
  totalGuests,
  checkIn,
  checkOut,
  onClose,
}: {
  hotel: Hotel;
  room: Room;
  totalGuests: number;
  checkIn: string;
  checkOut: string;
  onClose: () => void;
}) {
  const [guests, setGuests] = useState(
    Array.from({ length: totalGuests }, () => ({
      firstName: "",
      lastName: "",
      cnic: "", // ✅ optional
    })),
  );

  const [contact, setContact] = useState({
    phone: "",
    email: "",
  });

  const [extras, setExtras] = useState({
    sharedRoom: false,
    pickDrop: false,
    fullDayCar: false,
  });

  const [clients, setClients] = useState<ClientDoc[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");

  // ✅ Project Owner is input field
  const [projectOwnerName, setProjectOwnerName] = useState("");

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId),
    [clients, selectedClientId],
  );

  useEffect(() => {
    (async () => {
      try {
        const clientSnap = await getDocs(CLIENTS_COLLECTION);

        const clientList: ClientDoc[] = clientSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        setClients(clientList);

        if (!selectedClientId && clientList.length) {
          setSelectedClientId(clientList[0].id);
        }
      } catch (e) {
        console.error("Failed loading clients:", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    // ✅ validations
    if (!selectedClientId) {
      alert("Please select client");
      return;
    }

    if (!projectOwnerName.trim()) {
      alert("Please enter project owner name");
      return;
    }

    if (!checkIn || !checkOut) {
      alert("Please select check-in and check-out dates");
      return;
    }

    // CNIC optional ✅
    if (guests.some((g) => !g.firstName.trim() || !g.lastName.trim())) {
      alert("Fill all guest first/last names");
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert("Please login first");
        return;
      }

      // ✅ fetch full hotel data (address, cityName, taxType...)
      const hotelSnap = await getDoc(HOTEL_DOC(hotel.id));
      const hotelData = hotelSnap.exists() ? (hotelSnap.data() as any) : {};

      // ✅ fetch room data (GST/SST or any tax fields stored in room)
      const roomSnap = await getDoc(ROOM_DOC(hotel.id, room.id));
      const roomData = roomSnap.exists() ? (roomSnap.data() as any) : {};

      // ✅ fetch client doc (service charge % in rates.travel)
      const clientSnap = await getDoc(
        doc(db, "Panels", PANEL_ID, "clients", selectedClientId),
      );
      const clientData = clientSnap.exists() ? (clientSnap.data() as any) : {};

      // ✅ pick Travel & Tours terms (best-effort)
      // Adjust matching below if your terms docs have different fields.
      let termsConditionId = "";
      let termsConditionTitle = "";
      let termsConditionText = "";

      try {
        const termsSnap = await getDocs(TERMS_COLLECTION);
        const allTerms: TermsDoc[] = termsSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        const travelTerms =
          allTerms.find((t) =>
            String(
              t.company || t.division || t.category || t.name || t.title || "",
            )
              .toLowerCase()
              .includes("travel"),
          ) || allTerms[0];

        if (travelTerms) {
          termsConditionId = travelTerms.id;
          termsConditionTitle = String(
            travelTerms.name || travelTerms.title || "",
          );
          termsConditionText = String(travelTerms.description || "").replace(
            /\r\n/g,
            "\n",
          );
        }
      } catch (e) {
        console.warn("Terms not found / failed loading termsConditions:", e);
      }

      // ✅ compute nights/base
      const nights = nightsBetween(checkIn, checkOut);
      const roomRate = num(room.rate);
      const baseAmount = nights * roomRate;

      // ✅ tax: read from room info (preferred) else 0
      // You said: show as "GST + SST"
      // Put your actual room fields here if different:
      const gstPercent = num(
        roomData?.gstPercent ?? roomData?.gst ?? roomData?.GST,
      );
      const sstPercent = num(
        roomData?.sstPercent ?? roomData?.sst ?? roomData?.SST,
      );
      const totalTaxPercent = gstPercent + sstPercent;

      // ✅ apply tax on base (exclusive style)
      // If your hotel taxType is "inclusive", you may want different handling.
      // For now: calculate tax from % if provided.
      const taxAmount =
        totalTaxPercent > 0 ? (baseAmount * totalTaxPercent) / 100 : 0;

      // ✅ service charge percent from client rates.travel
      const servicePercent = num(
        clientData?.rates?.travel ?? selectedClient?.rates?.travel,
      );
      const serviceCharge =
        servicePercent > 0 ? (baseAmount * servicePercent) / 100 : 0;

      // ✅ totals
      const subTotal = baseAmount;
      const total = subTotal + taxAmount + serviceCharge;

      // 1) Create booking request doc first (save estimate placeholders)
      const bookingRef = await addDoc(
        collection(db, "Panels", PANEL_ID, "Travel", "HotelRequests", "items"),
        {
          hotelId: hotel.id,
          hotelName: hotel.hotelName,
          roomId: room.id,
          roomType: room.roomType,
          stayType: room.stayType,
          rate: roomRate,

          checkIn,
          checkOut,
          nights,

          // ✅ store full address/city as well for booking list page
          hotelAddress: hotelData?.address || hotel.address || "",
          cityId: hotelData?.cityId || hotel.cityId || "",
          cityName: hotelData?.cityName || hotel.cityName || "",

          guests,
          contact,
          extras,

          clientId: selectedClientId,
          clientName: selectedClient?.name || selectedClient?.clientName || "",

          projectOwnerName: projectOwnerName.trim(),

          // ✅ placeholders
          estimateId: "",
          estimateNo: "",

          // ✅ store service/tax breakdown for transparency
          servicePercent,
          serviceCharge,
          gstPercent,
          sstPercent,
          taxPercent: totalTaxPercent,
          taxLabel: totalTaxPercent > 0 ? "GST + SST" : "",

          status: "pending",
          createdBy: currentUser.uid,
          createdAt: serverTimestamp(),
        },
      );

      // 2) Generate estimateNo + create estimate in a transaction
      const { estimateId, estimateNo } = await runTransaction(
        db,
        async (tx) => {
          const counterSnap = await tx.get(COUNTER_DOC);

          let next = 1;
          if (!counterSnap.exists()) {
            tx.set(COUNTER_DOC, { next: 2 });
          } else {
            const data = counterSnap.data() as any;
            next = typeof data.next === "number" ? data.next : 1;
            tx.update(COUNTER_DOC, { next: next + 1 });
          }

          const estimateNo = `EST-${pad(next, 6)}`;

          // ✅ services rows
          const bookingRow = {
            rowId: `booking_${bookingRef.id}`,
            detail: `Hotel: ${hotel.hotelName} | ${room.roomType}`,
            description: [
              `Stay: ${checkIn} → ${checkOut} (${nights} night${nights > 1 ? "s" : ""})`,
              `Room: ${room.roomType} • ${room.stayType}`,
              `City: ${hotelData?.cityName || hotel.cityName || hotel.cityId}`,
              `Address: ${hotelData?.address || hotel.address || ""}`,
            ].join("\n"),
            units: nights,
            rate: roomRate,
            rateMode: "amount",
          };

          const serviceRow =
            servicePercent > 0
              ? {
                  rowId: `svc_${bookingRef.id}`,
                  detail: "Service Charges",
                  description: `Service charges @ ${servicePercent}% `,
                  units: 1,
                  rate: serviceCharge,
                  rateMode: "amount",
                }
              : null;

          const services = serviceRow ? [bookingRow, serviceRow] : [bookingRow];

          // ✅ IMPORTANT:
          // Your EstimateList uses e.total for Amount display.
          // Your estimatePdf/builder might read "subtotal" (lowercase) or "subTotal" (camel).
          // So we store BOTH keys to avoid mismatch.
          const estimateDoc: any = {
            estimateNo,
            date: formatYYYYMMDD(new Date()),
            company: "iEDGE - Travel & Tours",

            client: selectedClient?.name || selectedClient?.clientName || "",
            clientId: selectedClientId,

            // ✅ set BOTH (some parts might read projectOwner)
            projectOwnerName: projectOwnerName.trim(),
            projectOwner: projectOwnerName.trim(),

            subject: `Hotel Booking | ${hotel.hotelName} | ${checkIn} - ${checkOut}`,
            bookingRequestId: bookingRef.id,

            // ✅ address fields used in PDF/form
            address: hotelData?.address || hotel.address || "",

            // ✅ services
            services,
            items: services, // keep both if your form uses either

            // ✅ totals (store both styles)
            subTotal,
            subtotal: subTotal,
            tax: taxAmount,
            taxLabel: totalTaxPercent > 0 ? "GST + SST" : "",
            taxPercent: totalTaxPercent,
            taxType: totalTaxPercent > 0 ? "exclusive" : "none",

            serviceChargesPercent: servicePercent,
            serviceCharges: serviceCharge,

            total,

            status: "RFQ Sent",
            editCount: 0,

            // ✅ terms
            termsConditionId,
            termsConditionTitle,
            termsConditionText,

            createdBy: currentUser.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          const newEstimateRef = doc(ESTIMATES_COLLECTION);
          tx.set(newEstimateRef, estimateDoc);

          return { estimateId: newEstimateRef.id, estimateNo };
        },
      );

      // ✅ 3) Write estimate fields back to booking
      await updateDoc(
        doc(
          db,
          "Panels",
          PANEL_ID,
          "Travel",
          "HotelRequests",
          "items",
          bookingRef.id,
        ),
        {
          estimateId,
          estimateNo,
        },
      );

      alert(`Booking + Estimate created ✅ (${estimateNo})`);
      onClose(); // ✅ no redirect
    } catch (e) {
      console.error(e);
      alert("Failed to submit booking / create estimate.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <Card className="w-full max-w-2xl p-4 space-y-4 overflow-y-auto max-h-[90vh]">
        <h2 className="text-lg font-semibold">
          {hotel.hotelName} – {room.roomType}
        </h2>

        {/* Client + Project Owner */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-xs mb-1 font-medium">Client</div>
            <select
              className="border px-2 py-2 w-full rounded text-sm"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.clientName || "Unnamed Client"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-xs mb-1 font-medium">Project Owner</div>
            <Input
              placeholder="Enter project owner name"
              value={projectOwnerName}
              onChange={(e) => setProjectOwnerName(e.target.value)}
            />
          </div>
        </div>

        {/* Guests */}
        {guests.map((g, i) => (
          <div key={i} className="grid grid-cols-3 gap-2">
            <Input
              placeholder="First Name"
              value={g.firstName}
              onChange={(e) => {
                const copy = [...guests];
                copy[i].firstName = e.target.value;
                setGuests(copy);
              }}
            />
            <Input
              placeholder="Last Name"
              value={g.lastName}
              onChange={(e) => {
                const copy = [...guests];
                copy[i].lastName = e.target.value;
                setGuests(copy);
              }}
            />
            <Input
              placeholder="CNIC (optional)"
              value={g.cnic}
              onChange={(e) => {
                const copy = [...guests];
                copy[i].cnic = e.target.value;
                setGuests(copy);
              }}
            />
          </div>
        ))}

        {/* Contact */}
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Phone"
            value={contact.phone}
            onChange={(e) => setContact({ ...contact, phone: e.target.value })}
          />
          <Input
            placeholder="Email"
            value={contact.email}
            onChange={(e) => setContact({ ...contact, email: e.target.value })}
          />
        </div>

        {/* Extras */}
        <div className="flex gap-4 text-sm">
          {Object.keys(extras).map((k) => (
            <label key={k} className="flex gap-1 items-center">
              <input
                type="checkbox"
                checked={(extras as any)[k]}
                onChange={(e) =>
                  setExtras({ ...extras, [k]: e.target.checked })
                }
              />
              {k}
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Submit Booking</Button>
        </div>
      </Card>
    </div>
  );
}
