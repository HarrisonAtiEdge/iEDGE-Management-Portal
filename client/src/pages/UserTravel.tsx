// "use client";

// import { useState, useEffect } from "react";
// import {
//   collection,
//   getDocs,
//   query,
//   where,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import HotelBookingModal from "@/components/HotelBookingModal";

// const PANEL_ID = "IEDGE-SYSTEM";

// export type Hotel = {
//   id: string;
//   hotelName: string;
//   cityId: string;
//   cityName: string;
//   servicesOffered: string;
//   imageUrl?: string;
//   address: string;
// };

// export type Room = {
//   id: string;
//   roomType: string;
//   stayType: string;
//   rate: number;
//   roomDetails: string;
//   rateStartDate: string;
//   rateEndDate: string;
// };

// export default function UserHotelsPage() {
//   const [loading, setLoading] = useState(false);

//   const [cityId, setCityId] = useState("");
//   const [checkIn, setCheckIn] = useState("");
//   const [checkOut, setCheckOut] = useState("");
//   const [adults, setAdults] = useState(1);
//   const [children, setChildren] = useState(0);

//   const [hotels, setHotels] = useState<
//     (Hotel & { rooms: Room[] })[]
//   >([]);

//   const [selected, setSelected] = useState<{
//     hotel: Hotel;
//     room: Room;
//   } | null>(null);

//   const totalGuests = adults + children;

//   // NEW STATE
//   const HOTELS_PER_PAGE = 10;

//   const [allHotels, setAllHotels] = useState<
//     (Hotel & { rooms: Room[] })[]
//   >([]);

//   const [currentPage, setCurrentPage] = useState(1);
//   // -----

// const searchHotels = async () => {
//   if (!cityId || !checkIn || !checkOut) {
//     alert("Select city and dates");
//     return;
//   }

//   setLoading(true);
//   setHotels([]);

//   try {
//     const hotelSnap = await getDocs(
//       query(
//         collection(db, "Panels", PANEL_ID, "Travel", "Hotels", "items"),
//         where("cityId", "==", cityId),
//         where("status", "==", "active")
//       )
//     );

//     const hotelPromises = hotelSnap.docs.map(async (doc) => {
//       const hotel = { id: doc.id, ...(doc.data() as any) };

//      const roomsSnap = await getDocs(
//   query(
//     collection(
//       db,
//       "Panels",
//       PANEL_ID,
//       "Travel",
//       "Hotels",
//       "items",
//       doc.id,
//       "rooms"
//     ),
//     where("rateStartDate", "<=", checkIn)
//   )
// );

//       const rooms = roomsSnap.docs.map((r) => ({
//         id: r.id,
//         ...(r.data() as any),
//       }));

//       return rooms.length ? { ...hotel, rooms } : null;
//     });

//     const results = (await Promise.all(hotelPromises)).filter(Boolean);

//     setHotels(results as any[]);
//     setCurrentPage(1);
//   } catch (err) {
//     console.error(err);
//   } finally {
//     setLoading(false);
//   }
// };

//   // DEFAULT FETCH (ALL HOTELS)
// const fetchAllHotels = async () => {
//   setLoading(true);

//   try {
//     const snap = await getDocs(
//       query(
//         collection(db, "Panels", PANEL_ID, "Travel", "Hotels", "items"),
//         where("status", "==", "active")
//       )
//     );

//     const hotelPromises = snap.docs.map(async (doc) => {
//       const hotel = { id: doc.id, ...(doc.data() as any) };

//       const roomsSnap = await getDocs(
//         collection(
//           db,
//           "Panels",
//           PANEL_ID,
//           "Travel",
//           "Hotels",
//           "items",
//           doc.id,
//           "rooms"
//         )
//       );

//       const rooms = roomsSnap.docs
//   .map((r) => ({
//     id: r.id,
//     ...(r.data() as any),
//   }))
//   .filter((r) => r.rateEndDate >= checkOut);

//       return rooms.length ? { ...hotel, rooms } : null;
//     });

//     const result = (await Promise.all(hotelPromises)).filter(Boolean);

//     setAllHotels(result as any[]);
//     setHotels(result as any[]);
//   } finally {
//     setLoading(false);
//   }
// };

//   // -----

//   useEffect(() => {
//     fetchAllHotels();
//   }, []);

//   const totalPages = Math.ceil(hotels.length / HOTELS_PER_PAGE);

//   const paginatedHotels = hotels.slice(
//     (currentPage - 1) * HOTELS_PER_PAGE,
//     currentPage * HOTELS_PER_PAGE
//   );

//   return (
//     <div className="space-y-6">
//       {/* SEARCH BAR */}
//       <Card className="p-4 grid grid-cols-1 md:grid-cols-6 gap-3">
//         {/* Check In */}
//         <div className="space-y-1">
//           <label className="text-xs font-medium text-muted-foreground">
//             Check In
//           </label>
//           <Input
//             type="date"
//             value={checkIn}
//             onChange={(e) => setCheckIn(e.target.value)}
//           />
//         </div>

//         {/* Check Out */}
//         <div className="space-y-1">
//           <label className="text-xs font-medium text-muted-foreground">
//             Check Out
//           </label>
//           <Input
//             type="date"
//             value={checkOut}
//             onChange={(e) => setCheckOut(e.target.value)}
//           />
//         </div>

//         {/* City */}
//         <div className="space-y-1">
//           <label className="text-xs font-medium text-muted-foreground">
//             City
//           </label>
//           <Input
//             placeholder="Enter city name"
//             value={cityId}
//             onChange={(e) => setCityId(e.target.value)}
//           />
//         </div>

//         {/* Adults */}
//         <div className="space-y-1">
//           <label className="text-xs font-medium text-muted-foreground">
//             Adults
//           </label>
//           <Input
//             type="number"
//             min={1}
//             value={adults}
//             onChange={(e) => setAdults(+e.target.value)}
//           />
//         </div>

//         {/* Children */}
//         <div className="space-y-1">
//           <label className="text-xs font-medium text-muted-foreground">
//             Children
//           </label>
//           <Input
//             type="number"
//             min={0}
//             value={children}
//             onChange={(e) => setChildren(+e.target.value)}
//           />
//         </div>

//         {/* Search Button */}
//         <div className="flex items-end">
//          <Button className="w-full" onClick={searchHotels} disabled={loading}>
//   {loading ? "Searching..." : "Search"}
// </Button>

//         </div>
//       </Card>

//       {/* RESULTS */}
// {loading &&
//   Array.from({ length: 3 }).map((_, i) => (
//     <Card key={i} className="p-4 space-y-4 animate-pulse">
//       <div className="h-32 bg-muted rounded" />
//       <div className="h-4 bg-muted rounded w-1/2" />
//       <div className="h-4 bg-muted rounded w-1/3" />
//     </Card>
//   ))}

//       {!loading && paginatedHotels.map((hotel) => (

//         <Card key={hotel.id} className="p-4 space-y-4">
//           <div className="flex gap-4">
//             <img
//               src={hotel.imageUrl || "/placeholder.png"}
//               className="w-44 h-32 object-cover rounded"
//             />
//             <div>
//               <h2 className="text-lg font-semibold">{hotel.hotelName}</h2>
//               <h4 className="text-lg text-muted-foreground ">{hotel.address}</h4>
//               <p className="text-sm text-muted-foreground">
//                 {hotel.servicesOffered}
//               </p>
//             </div>
//           </div>

//           {hotel.rooms.map((room) => (
//             <div key={room.id} className="border p-3 rounded flex justify-between">
//               <div>
//                 <div className="font-medium">
//                   {room.roomType} • {room.stayType}
//                 </div>
//                 <div className="text-sm text-muted-foreground">
//                   {room.roomDetails}
//                 </div>
//               </div>

//               <div className="text-right">
//                 <div className="font-semibold">
//                   PKR {room.rate.toLocaleString()}
//                 </div>
//                 <Button
//                   className="mt-2"
//                   onClick={() => setSelected({ hotel, room })}
//                 >
//                   Select
//                 </Button>
//               </div>
//             </div>
//           ))}
//         </Card>
//       ))}

//       {/* PAGINATION UI (BOTTOM) */}
//       {totalPages > 1 && (
//         <div className="flex justify-center gap-2 pt-4">
//           <Button
//             variant="outline"
//             disabled={currentPage === 1}
//             onClick={() => setCurrentPage((p) => p - 1)}
//           >
//             Prev
//           </Button>

//           {Array.from({ length: totalPages }).map((_, i) => (
//             <Button
//               key={i}
//               variant={currentPage === i + 1 ? "default" : "outline"}
//               onClick={() => setCurrentPage(i + 1)}
//             >
//               {i + 1}
//             </Button>
//           ))}

//           <Button
//             variant="outline"
//             disabled={currentPage === totalPages}
//             onClick={() => setCurrentPage((p) => p + 1)}
//           >
//             Next
//           </Button>
//         </div>
//       )}

//       {/* MODAL */}
//       {selected && (
//         <HotelBookingModal
//           hotel={selected.hotel}
//           room={selected.room}
//           totalGuests={totalGuests}
//           checkIn={checkIn}
//           checkOut={checkOut}
//           onClose={() => setSelected(null)}
//         />
//       )}
//     </div>
//   );
// }

"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import HotelBookingModal from "@/components/HotelBookingModal";

// ✅ add this import
import { pakistanCities } from "@/data/pakistanCities";

const PANEL_ID = "IEDGE-SYSTEM";

export type Hotel = {
  id: string;
  hotelName: string;
  cityId: string;
  cityName: string;
  servicesOffered: string;
  imageUrl?: string;
  address: string;
};

export type Room = {
  id: string;
  roomType: string;
  stayType: string;
  rate: number;
  roomDetails: string;
  rateStartDate: string;
  rateEndDate: string;
};

export default function UserHotelsPage() {
  const [loading, setLoading] = useState(false);

  const [cityId, setCityId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  const [hotels, setHotels] = useState<(Hotel & { rooms: Room[] })[]>([]);

  const [selected, setSelected] = useState<{
    hotel: Hotel;
    room: Room;
  } | null>(null);

  const totalGuests = adults + children;

  // ✅ REQUIRED DATES FLAG
  const datesSelected = Boolean(checkIn && checkOut);

  // ✅ OPTIONAL: enforce checkOut >= checkIn
  const validDateRange = useMemo(() => {
    if (!checkIn || !checkOut) return false;
    return new Date(checkOut) >= new Date(checkIn);
  }, [checkIn, checkOut]);

  const HOTELS_PER_PAGE = 10;
  const [allHotels, setAllHotels] = useState<(Hotel & { rooms: Room[] })[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // ✅ City dropdown/search state
  const [cityQuery, setCityQuery] = useState("");
  const [cityOpen, setCityOpen] = useState(false);
  const cityWrapRef = useRef<HTMLDivElement | null>(null);

  const filteredCities = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q) return pakistanCities.slice(0, 20);
    return pakistanCities
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [cityQuery]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!cityWrapRef.current) return;
      if (!cityWrapRef.current.contains(e.target as Node)) setCityOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selectCity = (c: { id: string; name: string }) => {
    setCityId(c.id);
    setCityQuery(c.name);
    setCityOpen(false);
  };

  const searchHotels = async () => {
    if (!cityId || !checkIn || !checkOut) {
      alert("Select city and dates");
      return;
    }
    if (!validDateRange) {
      alert("Check-out date must be the same as or after check-in date.");
      return;
    }

    setLoading(true);
    setHotels([]);

    try {
      const hotelSnap = await getDocs(
        query(
          collection(db, "Panels", PANEL_ID, "Travel", "Hotels", "items"),
          where("cityId", "==", cityId),
          where("status", "==", "active"),
        ),
      );

      const hotelPromises = hotelSnap.docs.map(async (doc) => {
        const hotel = { id: doc.id, ...(doc.data() as any) };

        const roomsSnap = await getDocs(
          query(
            collection(
              db,
              "Panels",
              PANEL_ID,
              "Travel",
              "Hotels",
              "items",
              doc.id,
              "rooms",
            ),
            where("rateStartDate", "<=", checkIn),
          ),
        );

        const rooms = roomsSnap.docs.map((r) => ({
          id: r.id,
          ...(r.data() as any),
        }));

        return rooms.length ? { ...hotel, rooms } : null;
      });

      const results = (await Promise.all(hotelPromises)).filter(Boolean);

      setHotels(results as any[]);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllHotels = async () => {
    setLoading(true);

    try {
      const snap = await getDocs(
        query(
          collection(db, "Panels", PANEL_ID, "Travel", "Hotels", "items"),
          where("status", "==", "active"),
        ),
      );

      const hotelPromises = snap.docs.map(async (doc) => {
        const hotel = { id: doc.id, ...(doc.data() as any) };

        const roomsSnap = await getDocs(
          collection(
            db,
            "Panels",
            PANEL_ID,
            "Travel",
            "Hotels",
            "items",
            doc.id,
            "rooms",
          ),
        );

        const rooms = roomsSnap.docs
          .map((r) => ({
            id: r.id,
            ...(r.data() as any),
          }))
          // ⚠️ this filter uses checkOut; if checkOut is empty, it will not filter correctly
          .filter((r) => (!checkOut ? true : r.rateEndDate >= checkOut));

        return rooms.length ? { ...hotel, rooms } : null;
      });

      const result = (await Promise.all(hotelPromises)).filter(Boolean);

      setAllHotels(result as any[]);
      setHotels(result as any[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllHotels();
  }, []);

  const totalPages = Math.ceil(hotels.length / HOTELS_PER_PAGE);

  const paginatedHotels = hotels.slice(
    (currentPage - 1) * HOTELS_PER_PAGE,
    currentPage * HOTELS_PER_PAGE,
  );

  return (
    <div className="space-y-6">
      {/* SEARCH BAR */}
      <Card className="p-4 grid grid-cols-1 md:grid-cols-6 gap-3">
        {/* Check In */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Check In
          </label>
          <Input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
          />
        </div>

        {/* Check Out */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Check Out
          </label>
          <Input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
          />
          {/* ✅ optional small hint */}
          {datesSelected && !validDateRange ? (
            <div className="text-[10px] text-red-600 pt-1">
              Check-out must be after check-in.
            </div>
          ) : null}
        </div>

        {/* City */}
        <div className="space-y-1 relative" ref={cityWrapRef}>
          <label className="text-xs font-medium text-muted-foreground">
            City
          </label>
          <Input
            placeholder="Search city..."
            value={cityQuery}
            onChange={(e) => {
              setCityQuery(e.target.value);
              setCityOpen(true);
              if (e.target.value.trim() === "") setCityId("");
            }}
            onFocus={() => setCityOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setCityOpen(false);
              if (e.key === "Enter") {
                const first = filteredCities[0];
                if (first) selectCity(first);
              }
            }}
          />

          {cityOpen && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-background shadow-md max-h-56 overflow-auto">
              {filteredCities.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No city found
                </div>
              ) : (
                filteredCities.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between"
                    onClick={() => selectCity(c)}
                  >
                    <span>{c.name}</span>
                  </button>
                ))
              )}
            </div>
          )}

          {!!cityId && (
            <div className="text-[10px] text-muted-foreground pt-1">
              Selected: {cityId}
            </div>
          )}
        </div>

        {/* Adults */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Adults
          </label>
          <Input
            type="number"
            min={1}
            value={adults}
            onChange={(e) => setAdults(+e.target.value)}
          />
        </div>

        {/* Children */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Children
          </label>
          <Input
            type="number"
            min={0}
            value={children}
            onChange={(e) => setChildren(+e.target.value)}
          />
        </div>

        {/* Search Button */}
        <div className="flex items-end">
          <Button className="w-full" onClick={searchHotels} disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </Button>
        </div>
      </Card>

      {/* RESULTS */}
      {loading &&
        Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4 space-y-4 animate-pulse">
            <div className="h-32 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-1/3" />
          </Card>
        ))}

      {!loading &&
        paginatedHotels.map((hotel) => (
          <Card key={hotel.id} className="p-4 space-y-4">
            <div className="flex gap-4">
              <img
                src={hotel.imageUrl || "/placeholder.png"}
                className="w-44 h-32 object-cover rounded"
              />
              <div>
                <h2 className="text-lg font-semibold">{hotel.hotelName}</h2>
                <h4 className="text-lg text-muted-foreground ">
                  {hotel.address}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {hotel.servicesOffered}
                </p>
              </div>
            </div>

            {hotel.rooms.map((room) => {
              // ✅ Select allowed only when dates exist + valid range
              const canSelect = datesSelected && validDateRange;

              return (
                <div
                  key={room.id}
                  className="border p-3 rounded flex justify-between"
                >
                  <div>
                    <div className="font-medium">
                      {room.roomType} • {room.stayType}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {room.roomDetails}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold">
                      PKR {room.rate.toLocaleString()}
                    </div>

                    <Button
                      className="mt-2"
                      disabled={!canSelect}
                      title={
                        !canSelect
                          ? "Please select check-in and check-out dates first"
                          : ""
                      }
                      onClick={() => {
                        if (!datesSelected) {
                          alert(
                            "Please select Check-in and Check-out dates first.",
                          );
                          return;
                        }
                        if (!validDateRange) {
                          alert(
                            "Check-out date must be the same as or after check-in date.",
                          );
                          return;
                        }
                        setSelected({ hotel, room });
                      }}
                    >
                      Select
                    </Button>

                    {!canSelect ? (
                      <div className="text-[10px] text-muted-foreground mt-1">
                        Select dates to continue
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </Card>
        ))}

      {/* PAGINATION UI */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Prev
          </Button>

          {Array.from({ length: totalPages }).map((_, i) => (
            <Button
              key={i}
              variant={currentPage === i + 1 ? "default" : "outline"}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}

          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* MODAL */}
      {selected && (
        <HotelBookingModal
          hotel={selected.hotel}
          room={selected.room}
          totalGuests={totalGuests}
          checkIn={checkIn}
          checkOut={checkOut}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
