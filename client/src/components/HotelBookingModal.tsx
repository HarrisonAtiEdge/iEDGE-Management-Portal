"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Hotel, Room } from "@/pages/UserTravel";

const PANEL_ID = "IEDGE-SYSTEM";

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
      cnic: "",
    }))
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

  const submit = async () => {
    if (guests.some((g) => !g.firstName || !g.lastName || !g.cnic)) {
      alert("Fill all guest details");
      return;
    }

    await addDoc(
      collection(
        db,
        "Panels",
        PANEL_ID,
        "Travel",
        "HotelRequests",
        "items"
      ),
      {
        hotelId: hotel.id,
        hotelName: hotel.hotelName,
        roomType: room.roomType,
        stayType: room.stayType,
        rate: room.rate,
        checkIn,
        checkOut,
        guests,
        contact,
        extras,
        status: "pending",
        createdAt: serverTimestamp(),
      }
    );

    alert("Booking request submitted");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <Card className="w-full max-w-2xl p-4 space-y-4 overflow-y-auto max-h-[90vh]">
        <h2 className="text-lg font-semibold">
          {hotel.hotelName} – {room.roomType}
        </h2>

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
              placeholder="CNIC"
              value={g.cnic}
              onChange={(e) => {
                const copy = [...guests];
                copy[i].cnic = e.target.value;
                setGuests(copy);
              }}
            />
          </div>
        ))}

        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Phone"
            value={contact.phone}
            onChange={(e) =>
              setContact({ ...contact, phone: e.target.value })
            }
          />
          <Input
            placeholder="Email"
            value={contact.email}
            onChange={(e) =>
              setContact({ ...contact, email: e.target.value })
            }
          />
        </div>

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
