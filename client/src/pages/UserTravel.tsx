// // "use client";

// // import { useEffect, useMemo, useState } from "react";
// // import {
// //   collection,
// //   collectionGroup,
// //   onSnapshot,
// //   query,
// //   where,
// //   Timestamp,
// // } from "firebase/firestore";
// // import { db } from "@/lib/firebase";
// // import { pakistanCities } from "@/data/pakistanCities";

// // import { Button } from "@/components/ui/button";
// // import { Card } from "@/components/ui/card";
// // import { Input } from "@/components/ui/input";

// // import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// // import { Calendar } from "@/components/ui/calendar";
// // import { cn } from "@/lib/utils";

// // import { format } from "date-fns";
// // import { Calendar as CalendarIcon, ChevronDown, Minus, Plus, Users } from "lucide-react";

// // const PANEL_ID = "IEDGE-SYSTEM";

// // /**
// //  * Reads hotel branches:
// //  * Panels/IEDGE-SYSTEM/Travel/Hotels/items/{hotelId}/branches/{branchId}
// //  * We use collectionGroup("branches") so it works across all hotels.
// //  */
// // type BranchDoc = {
// //   id: string;
// //   cityId?: string;
// //   cityName: string;
// //   hotelName: string;

// //   address?: string;
// //   contactPerson?: string;
// //   contactNo?: string;
// //   email?: string;
// //   locationLink?: string;

// //   servicesOffered?: string;
// //   paymentTerm?: string;

// //   // rates / fields you already store
// //   roomBookingType?: "NON_BB" | "BB" | "HB" | "FB";
// //   roomType?: string; // e.g. Deluxe
// //   perNightRate?: number;

// //   taxLabel?: string;
// //   taxPercent?: number;

// //   servicesIncluded?: string;
// //   status?: "active" | "inactive";
// // };

// // function clamp(n: number, min: number, max: number) {
// //   return Math.max(min, Math.min(max, n));
// // }

// // function bookingTypeLabel(v?: BranchDoc["roomBookingType"]) {
// //   switch (v) {
// //     case "NON_BB":
// //       return "Non-BB";
// //     case "BB":
// //       return "BB";
// //     case "HB":
// //       return "HB";
// //     case "FB":
// //       return "FB";
// //     default:
// //       return v || "—";
// //   }
// // }

// // function nightsBetween(from?: Date, to?: Date) {
// //   if (!from || !to) return 0;
// //   const ms = to.getTime() - from.getTime();
// //   const nights = Math.ceil(ms / (1000 * 60 * 60 * 24));
// //   return Math.max(0, nights);
// // }

// // function fmtMoney(n?: number) {
// //   const x = Number(n || 0);
// //   return x.toLocaleString(undefined, { maximumFractionDigits: 0 });
// // }

// // export default function HotelSearch() {
// //   // search controls
// //   const [cityName, setCityName] = useState<string>("");
// //   const [from, setFrom] = useState<Date | undefined>(undefined);
// //   const [to, setTo] = useState<Date | undefined>(undefined);

// //   const [adults, setAdults] = useState(2);
// //   const [children, setChildren] = useState(0);
// //   const [rooms, setRooms] = useState(1);

// //   // UI state
// //   const [dateOpen, setDateOpen] = useState(false);
// //   const [guestOpen, setGuestOpen] = useState(false);

// //   // data
// //   const [branches, setBranches] = useState<BranchDoc[]>([]);
// //   const [loading, setLoading] = useState(true);

// //   // load ACTIVE branches (all cities) once; filter in UI
// //   useEffect(() => {
// //     setLoading(true);

// //     // If you want ONLY active:
// //     const q = query(
// //       collectionGroup(db, "branches"),
// //     //   where("status", "==", "active")
// //     );

// //     return onSnapshot(
// //       q,
// //       (snap) => {
// //         setBranches(
// //           snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
// //         );
// //         setLoading(false);
// //       },
// //       () => setLoading(false)
// //     );
// //   }, []);

// //   const nights = useMemo(() => nightsBetween(from, to), [from, to]);

// //   const filtered = useMemo(() => {
// //     const c = cityName.trim().toLowerCase();
// //     const base = branches.filter((b) => {
// //       if (!c) return true;
// //       return String(b.cityName || "")
// //         .trim()
// //         .toLowerCase()
// //         .includes(c);
// //     });

// //     // date filtering: your branch docs currently don’t have availability calendars;
// //     // so we only filter by city + show the selected date range in results header.
// //     return base.sort((a, b) => {
// //       const A = `${a.cityName} ${a.hotelName}`.toLowerCase();
// //       const B = `${b.cityName} ${b.hotelName}`.toLowerCase();
// //       return A.localeCompare(B);
// //     });
// //   }, [branches, cityName]);

// //   const summaryText = useMemo(() => {
// //     const a = adults;
// //     const ch = children;
// //     const r = rooms;
// //     const childLabel = ch === 1 ? "child" : "children";
// //     const roomLabel = r === 1 ? "room" : "rooms";
// //     return `${a} adults · ${ch} ${childLabel} · ${r} ${roomLabel}`;
// //   }, [adults, children, rooms]);

// //   const canSearch = Boolean(cityName.trim()) && Boolean(from) && Boolean(to) && to! > from!;

// //   return (
// //     <div className="space-y-4">
// //       {/* Search bar (minimal + Booking-style) */}
// <Card className="p-3 border border-amber-400/60 rounded-xl">
//   <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
//     {/* City */}
//     <div className="md:col-span-4">
//       <label className="text-xs text-muted-foreground">City</label>
//       <select
//         className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
//         value={cityName}
//         onChange={(e) => setCityName(e.target.value)}
//       >
//         <option value="">Select City</option>
//         {pakistanCities.map((c) => (
//           <option key={c.id} value={c.name}>
//             {c.name}
//           </option>
//         ))}
//       </select>
//     </div>

//     {/* Dates (from/to in one control) */}
//     <div className="md:col-span-5">
//       <label className="text-xs text-muted-foreground">Dates</label>
//       <Popover open={dateOpen} onOpenChange={setDateOpen}>
//         <PopoverTrigger asChild>
//           <button
//             type="button"
//             className={cn(
//               "w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-left text-sm flex items-center justify-between",
//               !from || !to ? "text-muted-foreground" : "text-gray-900"
//             )}
//           >
//             <span className="flex items-center gap-2">
//               <CalendarIcon className="h-4 w-4" />
//               {from && to ? (
//                 <>
//                   <span>{format(from, "EEE dd MMM")}</span>
//                   <span className="text-muted-foreground">—</span>
//                   <span>{format(to, "EEE dd MMM")}</span>
//                 </>
//               ) : (
//                 "Select check-in and check-out"
//               )}
//             </span>
//             <ChevronDown className="h-4 w-4 text-muted-foreground" />
//           </button>
//         </PopoverTrigger>

//         <PopoverContent className="w-auto p-3" align="start">
//           <div className="text-xs text-muted-foreground mb-2">
//             Pick a date range
//           </div>
//           <Calendar
//             mode="range"
//             numberOfMonths={2}
//             selected={{ from, to }}
//             onSelect={(range: any) => {
//               setFrom(range?.from);
//               setTo(range?.to);
//             }}
//             initialFocus
//           />
//           <div className="pt-3 flex justify-end gap-2">
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => {
//                 setFrom(undefined);
//                 setTo(undefined);
//               }}
//             >
//               Clear
//             </Button>
//             <Button size="sm" onClick={() => setDateOpen(false)}>
//               Done
//             </Button>
//           </div>
//         </PopoverContent>
//       </Popover>

//       {from && to && nights > 0 ? (
//         <div className="mt-1 text-xs text-muted-foreground">
//           {nights} night{nights === 1 ? "" : "s"}
//         </div>
//       ) : null}
//     </div>

//     {/* Guests */}
//     <div className="md:col-span-2">
//       <label className="text-xs text-muted-foreground">Guests</label>
//       <Popover open={guestOpen} onOpenChange={setGuestOpen}>
//         <PopoverTrigger asChild>
//           <button
//             type="button"
//             className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-left text-sm flex items-center justify-between"
//           >
//             <span className="flex items-center gap-2">
//               <Users className="h-4 w-4" />
//               <span className="truncate">{summaryText}</span>
//             </span>
//             <ChevronDown className="h-4 w-4 text-muted-foreground" />
//           </button>
//         </PopoverTrigger>

//         <PopoverContent className="w-80 p-3" align="end">
//           <div className="space-y-3">
//             <CounterRow
//               label="Adults"
//               value={adults}
//               onChange={(v) => setAdults(clamp(v, 1, 12))}
//               min={1}
//             />
//             <CounterRow
//               label="Children"
//               value={children}
//               onChange={(v) => setChildren(clamp(v, 0, 12))}
//               min={0}
//             />
//             <CounterRow
//               label="Rooms"
//               value={rooms}
//               onChange={(v) => setRooms(clamp(v, 1, 9))}
//               min={1}
//             />
//           </div>

//           <div className="pt-3 flex justify-end">
//             <Button size="sm" onClick={() => setGuestOpen(false)}>
//               Done
//             </Button>
//           </div>
//         </PopoverContent>
//       </Popover>
//     </div>

//     {/* Search button */}
//     <div className="md:col-span-1 flex items-end">
//       <Button
//         className="w-full h-10 rounded-lg"
//         disabled={!canSearch}
//         onClick={() => {
//           // no-op (filter is live); keep this for UX parity
//           // you can also push query params here if you want
//         }}
//       >
//         Search
//       </Button>
//     </div>
//   </div>
// </Card>

// //       {/* Results header */}
// //       <div className="flex items-center justify-between">
// //         <div>
// //           <div className="text-sm font-semibold">
// //             {cityName ? cityName : "All Cities"} Hotels
// //           </div>
// //           <div className="text-xs text-muted-foreground">
// //             {from && to ? `${format(from, "dd MMM yyyy")} → ${format(to, "dd MMM yyyy")}` : "Select dates to search"}
// //             {" · "}
// //             {summaryText}
// //           </div>
// //         </div>
// //         <div className="text-xs text-muted-foreground">
// //           {loading ? "Loading..." : `${filtered.length} result${filtered.length === 1 ? "" : "s"}`}
// //         </div>
// //       </div>

// //       {/* Results list (minimal cards) */}
// //       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
// //         {loading ? (
// //           <Card className="p-4 text-sm text-muted-foreground">Loading hotels...</Card>
// //         ) : filtered.length === 0 ? (
// //           <Card className="p-4 text-sm text-muted-foreground">No hotels found.</Card>
// //         ) : (
// //           filtered.map((b) => (
// //             <Card key={b.id} className="p-4">
// //               <div className="flex items-start justify-between gap-3">
// //                 <div className="min-w-0">
// //                   <div className="text-sm font-semibold truncate">
// //                     {b.hotelName}
// //                   </div>
// //                   <div className="text-xs text-muted-foreground truncate">
// //                     {b.cityName}
// //                   </div>
// //                 </div>

// //                 <div className="text-right">
// //                   <div className="text-xs text-muted-foreground">From</div>
// //                   <div className="text-sm font-semibold tabular-nums">
// //                     PKR {fmtMoney(b.perNightRate)}
// //                   </div>
// //                 </div>
// //               </div>

// //               <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
// //                 <Info label="Board" value={bookingTypeLabel(b.roomBookingType)} />
// //                 <Info label="Room" value={b.roomType || "—"} />
// //                 <Info
// //                   label="Tax"
// //                   value={
// //                     b.taxPercent
// //                       ? `${b.taxLabel || "Tax"} (${Number(b.taxPercent)}%)`
// //                       : "—"
// //                   }
// //                 />
// //                 <Info label="Payment" value={b.paymentTerm || "—"} />
// //               </div>

// //               {(b.address || b.servicesOffered) ? (
// //                 <div className="mt-3 text-xs text-muted-foreground space-y-1">
// //                   {b.address ? <div className="truncate">📍 {b.address}</div> : null}
// //                   {b.servicesOffered ? (
// //                     <div className="truncate">🧾 {b.servicesOffered}</div>
// //                   ) : null}
// //                 </div>
// //               ) : null}

// //               <div className="mt-3 flex gap-2">
// //                 {b.locationLink ? (
// //                   <Button
// //                     variant="outline"
// //                     size="sm"
// //                     onClick={() => window.open(b.locationLink, "_blank")}
// //                   >
// //                     Location
// //                   </Button>
// //                 ) : null}

// //                 {b.email ? (
// //                   <Button
// //                     variant="outline"
// //                     size="sm"
// //                     onClick={() => window.open(`mailto:${b.email}`, "_blank")}
// //                   >
// //                     Email
// //                   </Button>
// //                 ) : null}

// //                 {b.contactNo ? (
// //                   <Button
// //                     variant="outline"
// //                     size="sm"
// //                     onClick={() => window.open(`tel:${b.contactNo}`, "_blank")}
// //                   >
// //                     Call
// //                   </Button>
// //                 ) : null}

// //                 <Button size="sm" className="ml-auto">
// //                   View
// //                 </Button>
// //               </div>
// //             </Card>
// //           ))
// //         )}
// //       </div>
// //     </div>
// //   );
// // }

// // function CounterRow({
// //   label,
// //   value,
// //   onChange,
// //   min,
// // }: {
// //   label: string;
// //   value: number;
// //   onChange: (v: number) => void;
// //   min: number;
// // }) {
// //   return (
// //     <div className="flex items-center justify-between">
// //       <div className="text-sm">{label}</div>
// //       <div className="flex items-center gap-2">
// //         <button
// //           type="button"
// //           className="h-9 w-9 rounded-md border border-gray-300 flex items-center justify-center disabled:opacity-40"
// //           onClick={() => onChange(value - 1)}
// //           disabled={value <= min}
// //         >
// //           <Minus className="h-4 w-4" />
// //         </button>
// //         <div className="w-10 text-center text-sm tabular-nums">{value}</div>
// //         <button
// //           type="button"
// //           className="h-9 w-9 rounded-md border border-gray-300 flex items-center justify-center"
// //           onClick={() => onChange(value + 1)}
// //         >
// //           <Plus className="h-4 w-4" />
// //         </button>
// //       </div>
// //     </div>
// //   );
// // }

// // function Info({ label, value }: { label: string; value: string }) {
// //   return (
// //     <div className="flex items-center justify-between gap-2">
// //       <span className="text-muted-foreground">{label}</span>
// //       <span className="font-medium truncate">{value}</span>
// //     </div>
// //   );
// // }



// "use client";

// import { useEffect, useMemo, useState } from "react";
// import {
//   collection,
//   collectionGroup,
//   onSnapshot,
//   query,
//   serverTimestamp,
//   setDoc,
//   doc,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { pakistanCities } from "@/data/pakistanCities";

// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";

// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import { Calendar } from "@/components/ui/calendar";
// import { cn } from "@/lib/utils";

// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Label } from "@/components/ui/label";

// import { format } from "date-fns";
// import { Calendar as CalendarIcon, ChevronDown, Minus, Plus, Users } from "lucide-react";

// const PANEL_ID = "IEDGE-SYSTEM";

// // ✅ Booking requests will be saved here
// const requestsCol = collection(db, "Panels", PANEL_ID, "Travel", "HotelRequests", "items");

// type BranchDoc = {
//   id: string;
//   cityId?: string;
//   cityName: string;
//   hotelName: string;

//   address?: string;
//   contactPerson?: string;
//   contactNo?: string;
//   email?: string;
//   locationLink?: string;

//   servicesOffered?: string;
//   paymentTerm?: string;

//   roomBookingType?: "NON_BB" | "BB" | "HB" | "FB";
//   roomType?: string; // Deluxe / Executive / Suite / etc
//   perNightRate?: number;

//   taxLabel?: string;
//   taxPercent?: number;

//   servicesIncluded?: string;
//   status?: "active" | "inactive";
// };

// type GroupedHotel = {
//   key: string;
//   cityName: string;
//   hotelName: string;
//   roomBookingType?: BranchDoc["roomBookingType"];

//   address?: string;
//   contactNo?: string;
//   email?: string;
//   locationLink?: string;
//   paymentTerm?: string;
//   servicesOffered?: string;

//   taxes?: { taxLabel?: string; taxPercent?: number };

//   // roomType -> best record (in case duplicates)
//   rooms: Record<
//     string,
//     {
//       branchId: string;
//       roomType: string;
//       rate: number;
//       taxLabel?: string;
//       taxPercent?: number;
//       servicesIncluded?: string;
//     }
//   >;
// };

// function clamp(n: number, min: number, max: number) {
//   return Math.max(min, Math.min(max, n));
// }

// function bookingTypeLabel(v?: BranchDoc["roomBookingType"]) {
//   switch (v) {
//     case "NON_BB":
//       return "Non-BB";
//     case "BB":
//       return "BB";
//     case "HB":
//       return "HB";
//     case "FB":
//       return "FB";
//     default:
//       return v || "—";
//   }
// }

// function nightsBetween(from?: Date, to?: Date) {
//   if (!from || !to) return 0;
//   const ms = to.getTime() - from.getTime();
//   const nights = Math.ceil(ms / (1000 * 60 * 60 * 24));
//   return Math.max(0, nights);
// }

// function fmtMoney(n?: number) {
//   const x = Number(n || 0);
//   return x.toLocaleString(undefined, { maximumFractionDigits: 0 });
// }

// const makeId = () =>
//   typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());

// export default function HotelSearch() {
//   // search controls
//   const [cityName, setCityName] = useState<string>("");
//   const [from, setFrom] = useState<Date | undefined>(undefined);
//   const [to, setTo] = useState<Date | undefined>(undefined);

//   const [adults, setAdults] = useState(2);
//   const [children, setChildren] = useState(0);
//   const [rooms, setRooms] = useState(1);

//   // UI state
//   const [dateOpen, setDateOpen] = useState(false);
//   const [guestOpen, setGuestOpen] = useState(false);

//   // data
//   const [branches, setBranches] = useState<BranchDoc[]>([]);
//   const [loading, setLoading] = useState(true);

//   // ✅ Select modal
//   const [selectOpen, setSelectOpen] = useState(false);
//   const [selected, setSelected] = useState<{
//     hotelKey: string;
//     hotelName: string;
//     cityName: string;
//     board?: BranchDoc["roomBookingType"];
//     roomType: string;
//     rate: number;
//     branchId: string;
//   } | null>(null);

//   const [bookingForm, setBookingForm] = useState({
//     givenName: "",
//     lastName: "",
//     cnic: "",
//     phone: "",
//     email: "",
//     sharedRoom: false,
//     pickupDrop: false,
//     fullDayCar: false,
//   });

//   // load branches (all)
//   useEffect(() => {
//     setLoading(true);
//     const q = query(collectionGroup(db, "branches"));
//     return onSnapshot(
//       q,
//       (snap) => {
//         setBranches(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
//         setLoading(false);
//       },
//       () => setLoading(false)
//     );
//   }, []);

//   const nights = useMemo(() => nightsBetween(from, to), [from, to]);

//   const canSearch = Boolean(cityName.trim()) && Boolean(from) && Boolean(to) && (to as any) > (from as any);

//   // ✅ Filter then GROUP (Hotel + City + Board)
//   const grouped = useMemo(() => {
//     const c = cityName.trim().toLowerCase();
//     const activeOnly = branches.filter((b) => (b.status ? b.status === "active" : true));

//     const filtered = activeOnly.filter((b) => {
//       if (!c) return true;
//       return String(b.cityName || "").trim().toLowerCase().includes(c);
//     });

//     const map = new Map<string, GroupedHotel>();

//     for (const b of filtered) {
//       const hotel = String(b.hotelName || "").trim();
//       const city = String(b.cityName || "").trim();
//       if (!hotel || !city) continue;

//       const board = b.roomBookingType || "BB";
//       const key = `${city}__${hotel}__${board}`;

//       const roomType = String(b.roomType || "").trim() || "Room";
//       const rate = Number(b.perNightRate ?? 0) || 0;

//       if (!map.has(key)) {
//         map.set(key, {
//           key,
//           cityName: city,
//           hotelName: hotel,
//           roomBookingType: board,

//           address: b.address,
//           contactNo: b.contactNo,
//           email: b.email,
//           locationLink: b.locationLink,
//           paymentTerm: b.paymentTerm,
//           servicesOffered: b.servicesOffered,

//           taxes: { taxLabel: b.taxLabel, taxPercent: b.taxPercent },
//           rooms: {},
//         });
//       }

//       const g = map.get(key)!;

//       // keep the best/latest (simple rule: overwrite if rate > 0)
//       if (!g.rooms[roomType] || rate > 0) {
//         g.rooms[roomType] = {
//           branchId: b.id,
//           roomType,
//           rate,
//           taxLabel: b.taxLabel,
//           taxPercent: b.taxPercent,
//           servicesIncluded: b.servicesIncluded,
//         };
//       }
//     }

//     return Array.from(map.values()).sort((a, b) => {
//       const A = `${a.cityName} ${a.hotelName} ${a.roomBookingType}`.toLowerCase();
//       const B = `${b.cityName} ${b.hotelName} ${b.roomBookingType}`.toLowerCase();
//       return A.localeCompare(B);
//     });
//   }, [branches, cityName]);

//   const summaryText = useMemo(() => {
//     const childLabel = children === 1 ? "child" : "children";
//     const roomLabel = rooms === 1 ? "room" : "rooms";
//     return `${adults} adults · ${children} ${childLabel} · ${rooms} ${roomLabel}`;
//   }, [adults, children, rooms]);

//   const openSelect = (g: GroupedHotel, roomType: string) => {
//     const r = g.rooms[roomType];
//     if (!r) return;

//     setSelected({
//       hotelKey: g.key,
//       hotelName: g.hotelName,
//       cityName: g.cityName,
//       board: g.roomBookingType,
//       roomType: r.roomType,
//       rate: r.rate,
//       branchId: r.branchId,
//     });

//     setBookingForm({
//       givenName: "",
//       lastName: "",
//       cnic: "",
//       phone: "",
//       email: "",
//       sharedRoom: false,
//       pickupDrop: false,
//       fullDayCar: false,
//     });

//     setSelectOpen(true);
//   };

//   const submitRequest = async () => {
//     if (!selected) return;

//     if (!bookingForm.givenName.trim() || !bookingForm.lastName.trim() || !bookingForm.cnic.trim() || !bookingForm.phone.trim() || !bookingForm.email.trim()) {
//       alert("Please fill Given Name, Last Name, CNIC, Phone, Email");
//       return;
//     }

//     const id = makeId();

//     await setDoc(doc(requestsCol, id), {
//       panelId: PANEL_ID,

//       // selected offer
//       hotelKey: selected.hotelKey,
//       hotelName: selected.hotelName,
//       cityName: selected.cityName,
//       roomBookingType: selected.board || "BB",
//       roomType: selected.roomType,
//       perNightRate: selected.rate,
//       branchId: selected.branchId,

//       // search info
//       checkIn: from ? from.toISOString() : null,
//       checkOut: to ? to.toISOString() : null,
//       nights,
//       adults,
//       children,
//       rooms,

//       // customer
//       givenName: bookingForm.givenName.trim(),
//       lastName: bookingForm.lastName.trim(),
//       cnic: bookingForm.cnic.trim(),
//       phone: bookingForm.phone.trim(),
//       email: bookingForm.email.trim(),
//       sharedRoom: Boolean(bookingForm.sharedRoom),
//       pickupDropReq: Boolean(bookingForm.pickupDrop),
//       fullDayCarReq: Boolean(bookingForm.fullDayCar),

//       status: "new",
//       createdAt: serverTimestamp(),
//     });

//     setSelectOpen(false);
//     alert("Request submitted.");
//   };

//   return (
//     <div className="space-y-4">
//       {/* Search bar */}
//       <Card className="p-3 border border-gray-400/60 rounded-xl">
//         <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
//           <div className="md:col-span-4">
//             <label className="text-xs text-muted-foreground">City</label>
//             <select
//               className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
//               value={cityName}
//               onChange={(e) => setCityName(e.target.value)}
//             >
//               <option value="">Select City</option>
//               {pakistanCities.map((c) => (
//                 <option key={c.id} value={c.name}>
//                   {c.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div className="md:col-span-5">
//             <label className="text-xs text-muted-foreground">Dates</label>
//             <Popover open={dateOpen} onOpenChange={setDateOpen}>
//               <PopoverTrigger asChild>
//                 <button
//                   type="button"
//                   className={cn(
//                     "w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-left text-sm flex items-center justify-between",
//                     !from || !to ? "text-muted-foreground" : "text-gray-900"
//                   )}
//                 >
//                   <span className="flex items-center gap-2">
//                     <CalendarIcon className="h-4 w-4" />
//                     {from && to ? (
//                       <>
//                         <span>{format(from, "EEE dd MMM")}</span>
//                         <span className="text-muted-foreground">—</span>
//                         <span>{format(to, "EEE dd MMM")}</span>
//                       </>
//                     ) : (
//                       "Select check-in and check-out"
//                     )}
//                   </span>
//                   <ChevronDown className="h-4 w-4 text-muted-foreground" />
//                 </button>
//               </PopoverTrigger>

//               <PopoverContent className="w-auto p-3" align="start">
//                 <div className="text-xs text-muted-foreground mb-2">Pick a date range</div>
//                 <Calendar
//                   mode="range"
//                   numberOfMonths={2}
//                   selected={{ from, to }}
//                   onSelect={(range: any) => {
//                     setFrom(range?.from);
//                     setTo(range?.to);
//                   }}
//                   initialFocus
//                 />
//                 <div className="pt-3 flex justify-end gap-2">
//                   <Button variant="outline" size="sm" onClick={() => { setFrom(undefined); setTo(undefined); }}>
//                     Clear
//                   </Button>
//                   <Button size="sm" onClick={() => setDateOpen(false)}>
//                     Done
//                   </Button>
//                 </div>
//               </PopoverContent>
//             </Popover>

//             {from && to && nights > 0 ? (
//               <div className="mt-1 text-xs text-muted-foreground">
//                 {nights} night{nights === 1 ? "" : "s"}
//               </div>
//             ) : null}
//           </div>

//           <div className="md:col-span-2">
//             <label className="text-xs text-muted-foreground">Guests</label>
//             <Popover open={guestOpen} onOpenChange={setGuestOpen}>
//               <PopoverTrigger asChild>
//                 <button
//                   type="button"
//                   className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-left text-sm flex items-center justify-between"
//                 >
//                   <span className="flex items-center gap-2">
//                     <Users className="h-4 w-4" />
//                     <span className="truncate">{summaryText}</span>
//                   </span>
//                   <ChevronDown className="h-4 w-4 text-muted-foreground" />
//                 </button>
//               </PopoverTrigger>

//               <PopoverContent className="w-80 p-3" align="end">
//                 <div className="space-y-3">
//                   <CounterRow label="Adults" value={adults} onChange={(v) => setAdults(clamp(v, 1, 12))} min={1} />
//                   <CounterRow label="Children" value={children} onChange={(v) => setChildren(clamp(v, 0, 12))} min={0} />
//                   <CounterRow label="Rooms" value={rooms} onChange={(v) => setRooms(clamp(v, 1, 9))} min={1} />
//                 </div>
//                 <div className="pt-3 flex justify-end">
//                   <Button size="sm" onClick={() => setGuestOpen(false)}>Done</Button>
//                 </div>
//               </PopoverContent>
//             </Popover>
//           </div>

//           <div className="md:col-span-1 flex items-end">
//             <Button className="w-full h-10 rounded-lg" disabled={!canSearch}>
//               Search
//             </Button>
//           </div>
//         </div>
//       </Card>

//       {/* Results header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <div className="text-sm font-semibold">{cityName ? cityName : "All Cities"} Hotels</div>
//           <div className="text-xs text-muted-foreground">
//             {from && to ? `${format(from, "dd MMM yyyy")} → ${format(to, "dd MMM yyyy")}` : "Select dates to search"}
//             {" · "}
//             {summaryText}
//           </div>
//         </div>
//         <div className="text-xs text-muted-foreground">
//           {loading ? "Loading..." : `${grouped.length} result${grouped.length === 1 ? "" : "s"}`}
//         </div>
//       </div>

//       {/* Results */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//         {loading ? (
//           <Card className="p-4 text-sm text-muted-foreground">Loading hotels...</Card>
//         ) : grouped.length === 0 ? (
//           <Card className="p-4 text-sm text-muted-foreground">No hotels found.</Card>
//         ) : (
//           grouped.map((g) => {
//             const roomTypes = Object.keys(g.rooms).sort((a, b) => a.localeCompare(b));
//             return (
//               <Card key={g.key} className="p-4">
//                 <div className="flex items-start justify-between gap-3">
//                   <div className="min-w-0">
//                     <div className="text-sm font-semibold truncate">{g.hotelName}</div>
//                     <div className="text-xs text-muted-foreground truncate">
//                       {g.cityName} · {bookingTypeLabel(g.roomBookingType)}
//                     </div>
//                   </div>
//                 </div>

//                 {/* ✅ Room type prices */}
//                 <div className="mt-3 space-y-2">
//                   {roomTypes.length === 0 ? (
//                     <div className="text-xs text-muted-foreground">No room rates available.</div>
//                   ) : (
//                     roomTypes.map((rt) => (
//                       <div key={rt} className="flex items-center justify-between gap-2 border rounded-lg px-3 py-2">
//                         <div className="min-w-0">
//                           <div className="text-sm font-medium truncate">{rt}</div>
//                           <div className="text-[11px] text-muted-foreground truncate">
//                             {g.rooms[rt].taxPercent
//                               ? `${g.rooms[rt].taxLabel || "Tax"} ${Number(g.rooms[rt].taxPercent)}%`
//                               : "No tax"}
//                           </div>
//                         </div>
//                         <div className="text-right">
//                           <div className="text-[11px] text-muted-foreground">Per night</div>
//                           <div className="text-sm font-semibold tabular-nums">PKR {fmtMoney(g.rooms[rt].rate)}</div>
//                         </div>
//                         <Button size="sm" onClick={() => openSelect(g, rt)}>
//                           Select
//                         </Button>
//                       </div>
//                     ))
//                   )}
//                 </div>

//                 {(g.address || g.servicesOffered) ? (
//                   <div className="mt-3 text-xs text-muted-foreground space-y-1">
//                     {g.address ? <div className="truncate">📍 {g.address}</div> : null}
//                     {g.servicesOffered ? <div className="truncate">🧾 {g.servicesOffered}</div> : null}
//                   </div>
//                 ) : null}

//                 <div className="mt-3 flex gap-2">
//                   {g.locationLink ? (
//                     <Button variant="outline" size="sm" onClick={() => window.open(g.locationLink!, "_blank")}>
//                       Location
//                     </Button>
//                   ) : null}

//                   {g.email ? (
//                     <Button variant="outline" size="sm" onClick={() => window.open(`mailto:${g.email}`, "_blank")}>
//                       Email
//                     </Button>
//                   ) : null}

//                   {g.contactNo ? (
//                     <Button variant="outline" size="sm" onClick={() => window.open(`tel:${g.contactNo}`, "_blank")}>
//                       Call
//                     </Button>
//                   ) : null}
//                 </div>
//               </Card>
//             );
//           })
//         )}
//       </div>

//       {/* ✅ SELECT MODAL */}
//       <Dialog open={selectOpen} onOpenChange={setSelectOpen}>
//         <DialogContent className="max-w-lg">
//           <DialogHeader>
//             <DialogTitle>Booking Details</DialogTitle>
//           </DialogHeader>

//           {selected ? (
//             <div className="space-y-3">
//               <div className="text-sm">
//                 <div className="font-semibold">{selected.hotelName}</div>
//                 <div className="text-xs text-muted-foreground">
//                   {selected.cityName} · {bookingTypeLabel(selected.board)} · {selected.roomType} · PKR {fmtMoney(selected.rate)} / night
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
//                 <Input
//                   placeholder="Given Name *"
//                   value={bookingForm.givenName}
//                   onChange={(e) => setBookingForm((p) => ({ ...p, givenName: e.target.value }))}
//                 />
//                 <Input
//                   placeholder="Last Name *"
//                   value={bookingForm.lastName}
//                   onChange={(e) => setBookingForm((p) => ({ ...p, lastName: e.target.value }))}
//                 />
//                 <Input
//                   placeholder="CNIC No *"
//                   value={bookingForm.cnic}
//                   onChange={(e) => setBookingForm((p) => ({ ...p, cnic: e.target.value }))}
//                 />
//                 <Input
//                   placeholder="Phone *"
//                   value={bookingForm.phone}
//                   onChange={(e) => setBookingForm((p) => ({ ...p, phone: e.target.value }))}
//                 />
//                 <Input
//                   placeholder="Email *"
//                   value={bookingForm.email}
//                   onChange={(e) => setBookingForm((p) => ({ ...p, email: e.target.value }))}
//                 />
//               </div>

//               <div className="space-y-2">
//                 <CheckRow
//                   label="Shared room"
//                   checked={bookingForm.sharedRoom}
//                   onCheckedChange={(v) => setBookingForm((p) => ({ ...p, sharedRoom: Boolean(v) }))}
//                 />
//                 <CheckRow
//                   label="Pick & drop required"
//                   checked={bookingForm.pickupDrop}
//                   onCheckedChange={(v) => setBookingForm((p) => ({ ...p, pickupDrop: Boolean(v) }))}
//                 />
//                 <CheckRow
//                   label="Full day car required"
//                   checked={bookingForm.fullDayCar}
//                   onCheckedChange={(v) => setBookingForm((p) => ({ ...p, fullDayCar: Boolean(v) }))}
//                 />
//               </div>

//               <div className="flex justify-end gap-2 pt-2">
//                 <Button variant="outline" onClick={() => setSelectOpen(false)}>
//                   Cancel
//                 </Button>
//                 <Button onClick={submitRequest}>Submit</Button>
//               </div>
//             </div>
//           ) : null}
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

// function CounterRow({
//   label,
//   value,
//   onChange,
//   min,
// }: {
//   label: string;
//   value: number;
//   onChange: (v: number) => void;
//   min: number;
// }) {
//   return (
//     <div className="flex items-center justify-between">
//       <div className="text-sm">{label}</div>
//       <div className="flex items-center gap-2">
//         <button
//           type="button"
//           className="h-9 w-9 rounded-md border border-gray-300 flex items-center justify-center disabled:opacity-40"
//           onClick={() => onChange(value - 1)}
//           disabled={value <= min}
//         >
//           <Minus className="h-4 w-4" />
//         </button>
//         <div className="w-10 text-center text-sm tabular-nums">{value}</div>
//         <button
//           type="button"
//           className="h-9 w-9 rounded-md border border-gray-300 flex items-center justify-center"
//           onClick={() => onChange(value + 1)}
//         >
//           <Plus className="h-4 w-4" />
//         </button>
//       </div>
//     </div>
//   );
// }

// function CheckRow({
//   label,
//   checked,
//   onCheckedChange,
// }: {
//   label: string;
//   checked: boolean;
//   onCheckedChange: (v: boolean) => void;
// }) {
//   return (
//     <div className="flex items-center gap-2">
//       <Checkbox checked={checked} onCheckedChange={(v) => onCheckedChange(Boolean(v))} />
//       <Label className="text-sm">{label}</Label>
//     </div>
//   );
// }



// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { collection, getDocs, onSnapshot, query, orderBy } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { MapPin, BedDouble, Star, CreditCard, Receipt, Search, X } from "lucide-react";

// const PANEL_ID = "IEDGE-SYSTEM";
// const hotelsCol = collection(db, "Panels", PANEL_ID, "Travel", "Hotels", "items");

// type HotelDoc = {
//   id: string;
//   cityName: string;
//   hotelName: string;
//   address: string;
//   servicesOffered: string;
//   imageUrl?: string;
//   paymentTerm: string;
//   status: "active" | "inactive";
//   roomsCount?: number;
//   rating: number;
//   priceInPKR: number;
// };

// type RoomDoc = {
//   id: string;
//   roomType: string;
//   stayType: string;
//   rate: number;
//   roomDetails: string;
// };

// export default function UserPanel() {
//   const [hotels, setHotels] = useState<HotelDoc[]>([]);
//   const [rooms, setRooms] = useState<RoomDoc[]>([]);
//   const [qText, setQText] = useState("");
//   const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);

//   const filteredHotels = useMemo(() => {
//     const term = qText.trim().toLowerCase();

//     return hotels.filter((h) => {
//       return (
//         !term ||
//         h.hotelName.toLowerCase().includes(term) ||
//         h.cityName.toLowerCase().includes(term)
//       );
//     });
//   }, [hotels, qText]);

//   useEffect(() => {
//     const unsubHotels = onSnapshot(query(hotelsCol, orderBy("hotelName", "asc")), (snap) => {
//       const mapped = snap.docs.map((d) => ({
//         id: d.id,
//         cityName: d.data().cityName,
//         hotelName: d.data().hotelName,
//         address: d.data().address,
//         servicesOffered: d.data().servicesOffered,
//         imageUrl: d.data().imageUrl,
//         paymentTerm: d.data().paymentTerm,
//         status: d.data().status,
//         roomsCount: d.data().roomsCount,
//         rating: d.data().rating || 0, // Rating (out of 5 stars)
//         priceInPKR: d.data().priceInPKR || 0, // Price in PKR
//       })) as HotelDoc[];

//       setHotels(mapped);
//     });

//     return () => unsubHotels();
//   }, []);

//   useEffect(() => {
//     if (!selectedHotelId) {
//       setRooms([]);
//       return;
//     }

//     const roomsCol = collection(db, "Panels", PANEL_ID, "Travel", "Hotels", "items", selectedHotelId, "rooms");

//     const unsubRooms = onSnapshot(roomsCol, (snap) => {
//       const roomList = snap.docs.map((d) => ({
//         id: d.id,
//         roomType: d.data().roomType,
//         stayType: d.data().stayType,
//         rate: d.data().rate,
//         roomDetails: d.data().roomDetails,
//       })) as RoomDoc[];

//       setRooms(roomList);
//     });

//     return () => unsubRooms();
//   }, [selectedHotelId]);

//   return (
//     <div className="space-y-4">
//       <div className="space-y-2">
//         <h2 className="text-xl font-semibold">Hotels</h2>
//       </div>

//       <Card className="p-4">
//         <div className="relative flex items-center gap-3">
//           <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
//           <input
//             className="pl-9 w-full border rounded-md px-3 py-2 text-sm"
//             placeholder="Search by Hotel Name or City…"
//             value={qText}
//             onChange={(e) => setQText(e.target.value)}
//           />
//         </div>
//       </Card>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
//         {/* LEFT: Hotels list */}
//         <div className="lg:col-span-1 space-y-3">
//           {filteredHotels.length === 0 ? (
//             <Card className="p-4 text-sm text-muted-foreground">No hotels found.</Card>
//           ) : (
//             filteredHotels.map((h) => {
//               const isActive = h.status === "active";
//               const isSelected = selectedHotelId === h.id;

//               return (
//                 <Card
//                   key={h.id}
//                   className={`p-4 cursor-pointer hover:shadow-sm transition ${
//                     isSelected ? "ring-1 ring-black/10" : ""
//                   }`}
//                   onClick={() => setSelectedHotelId(h.id)}
//                 >
//                   <div className="flex items-start justify-between gap-3">
//                     <div className="min-w-0">
//                       <div className="flex items-center gap-2">
//                         <MapPin className="h-4 w-4 text-muted-foreground" />
//                         <div className="font-semibold text-sm truncate">{h.hotelName}</div>
//                       </div>

//                       <div className="mt-1 flex flex-wrap gap-2">
//                         <div className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
//                           <MapPin className="h-3 w-3" />
//                           {h.cityName || "—"}
//                         </div>
//                         <div className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
//                           {isActive ? <Receipt className="h-3 w-3" /> : <X className="h-3 w-3" />}
//                           {isActive ? "Active" : "Inactive"}
//                         </div>
//                         <div className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
//                           <BedDouble className="h-3 w-3" />
//                           {`${h.roomsCount ?? 0} rooms`}
//                         </div>
//                       </div>


//                     </div>
//                   </div>
//                 </Card>
//               );
//             })
//           )}
//         </div>

//         {/* RIGHT: Selected hotel details + rooms */}
//         <div className="lg:col-span-2 space-y-3">
//           {!selectedHotelId ? (
//             <Card className="p-6 text-sm text-muted-foreground">
//               Select a hotel to view details and rooms.
//             </Card>
//           ) : (
//             <Card className="p-4">
//               <div className="flex gap-6">
//                 {/* Hotel Image */}
//                 {filteredHotels.find((h) => h.id === selectedHotelId)?.imageUrl ? (
//                   <div className="w-1/3">
//                     <img
//                       src={filteredHotels.find((h) => h.id === selectedHotelId)?.imageUrl}
//                       alt="Hotel Image"
//                       className="w-full h-auto object-cover rounded-lg"
//                     />
//                   </div>
//                 ) : (
//                   <div className="w-1/3 bg-muted h-full flex items-center justify-center text-white rounded-lg">
//                     No image available
//                   </div>
//                 )}

//                 {/* Hotel Details */}
//                 <div className="w-2/3">
//                   <div className="font-semibold text-lg">
//                     {filteredHotels.find((h) => h.id === selectedHotelId)?.hotelName}
//                   </div>
//                     {/* Star rating */}
//                   {/* <div className="flex items-center gap-2 text-sm text-yellow-500 mt-1">
//                     {[...Array(5)].map((_, i) => (
//                       <Star
//                         key={i}
//                         className={`h-4 w-4 ${i < filteredHotels.find((h) => h.id === selectedHotelId)?.rating ? "text-yellow-500" : "text-muted-foreground"}`}
//                       />
//                     ))}
//                   </div> */}

//                   <div className="text-sm text-muted-foreground mt-2">
//                     <MapPin className="h-4 w-4 inline-block" />
//                     {filteredHotels.find((h) => h.id === selectedHotelId)?.address}
//                   </div>

//                   <div className="mt-4 text-sm">
//                     <div className="font-medium">Services Offered:</div>
//                     <span>{filteredHotels.find((h) => h.id === selectedHotelId)?.servicesOffered}</span>
//                   </div>




//                 </div>
//               </div>

//               {/* Rooms & Rates */}
//               <div className="mt-6">
//                 <div className="text-lg font-semibold">Rooms & Rates</div>
//                 {rooms.length === 0 ? (
//                   <div className="text-sm text-muted-foreground mt-2">No rooms added yet.</div>
//                 ) : (
//                   rooms.map((room) => (
//                     <Card key={room.id} className="p-4 mt-2">
//                       <div className="flex items-start justify-between">
//                         <div className="min-w-0">
//                           <div className="font-semibold text-sm">{room.roomType} - {room.stayType}</div>
//                           <div className="text-sm text-muted-foreground">{room.roomDetails}</div>
//                         </div>

//                         <div className="flex items-center gap-3">
//                           <div className="text-xl font-semibold">
//                             PKR {room.rate.toLocaleString()}
//                           </div>
//                         </div>
//                       </div>
//                     </Card>
//                   ))
//                 )}
//               </div>
//             </Card>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }




// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { collection, getDocs, onSnapshot, query, orderBy, setDoc, doc } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { MapPin, BedDouble, Receipt, Search, X, CalendarDays } from "lucide-react";
// import { DateRangePicker } from "react-date-range";
// import "react-date-range/dist/styles.css";
// import "react-date-range/dist/theme/default.css";

// const PANEL_ID = "IEDGE-SYSTEM";
// const hotelsCol = collection(db, "Panels", PANEL_ID, "Travel", "Hotels", "items");
// const hotelRequestsCol = collection(db, "Panels", PANEL_ID, "Travel", "HotelRequests", "items");

// type HotelDoc = {
//   id: string;
//   cityName: string;
//   hotelName: string;
//   address: string;
//   servicesOffered: string;
//   imageUrl?: string;
//   paymentTerm: string;
//   status: "active" | "inactive";
//   roomsCount?: number;
//   rating: number;
//   priceInPKR: number;
// };

// type RoomDoc = {
//   id: string;
//   roomType: string;
//   stayType: string;
//   rate: number;
//   roomDetails: string;
//   rateStartDate: string;
//   rateEndDate: string;
// };

// export default function UserPanel() {
//   const [hotels, setHotels] = useState<HotelDoc[]>([]);
//   const [rooms, setRooms] = useState<RoomDoc[]>([]);
//   const [qText, setQText] = useState("");
//   const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
//   const [selectedRoom, setSelectedRoom] = useState<RoomDoc | null>(null);
//   const [dateRange, setDateRange] = useState<any>({
//     startDate: new Date(),
//     endDate: new Date(),
//     key: "selection",
//   });

//   const [userForm, setUserForm] = useState({
//     name: "",
//     nic: "",
//     phone: "",
//     email: "",
//     sharedRoom: false,
//     pickAndDrop: false,
//     fullDayCar: false,
//   });

//   const filteredHotels = useMemo(() => {
//     const term = qText.trim().toLowerCase();
//     return hotels.filter((h) => {
//       return (
//         !term ||
//         h.hotelName.toLowerCase().includes(term) ||
//         h.cityName.toLowerCase().includes(term)
//       );
//     });
//   }, [hotels, qText]);

//   useEffect(() => {
//     const unsubHotels = onSnapshot(query(hotelsCol, orderBy("hotelName", "asc")), (snap) => {
//       const mapped = snap.docs.map((d) => ({
//         id: d.id,
//         cityName: d.data().cityName,
//         hotelName: d.data().hotelName,
//         address: d.data().address,
//         servicesOffered: d.data().servicesOffered,
//         imageUrl: d.data().imageUrl,
//         paymentTerm: d.data().paymentTerm,
//         status: d.data().status,
//         roomsCount: d.data().roomsCount,
//         rating: d.data().rating || 0,
//         priceInPKR: d.data().priceInPKR || 0,
//       })) as HotelDoc[];

//       setHotels(mapped);
//     });

//     return () => unsubHotels();
//   }, []);

//   useEffect(() => {
//     if (!selectedHotelId) {
//       setRooms([]);
//       return;
//     }

//     const roomsCol = collection(db, "Panels", PANEL_ID, "Travel", "Hotels", "items", selectedHotelId, "rooms");

//     const unsubRooms = onSnapshot(roomsCol, (snap) => {
//       const roomList = snap.docs.map((d) => ({
//         id: d.id,
//         roomType: d.data().roomType,
//         stayType: d.data().stayType,
//         rate: d.data().rate,
//         roomDetails: d.data().roomDetails,
//         rateStartDate: d.data().rateStartDate,
//         rateEndDate: d.data().rateEndDate,
//       })) as RoomDoc[];

//       setRooms(roomList);
//     });

//     return () => unsubRooms();
//   }, [selectedHotelId]);

//   const handleFormSubmit = async () => {
//     if (!selectedHotelId || !selectedRoom) {
//       alert("Please select a hotel and room.");
//       return;
//     }

//     const hotel = hotels.find((h) => h.id === selectedHotelId);
//     if (!hotel) return;

//     const requestData = {
//       hotelId: selectedHotelId,
//       hotelName: hotel.hotelName,
//       roomId: selectedRoom.id,
//       roomType: selectedRoom.roomType,
//       stayType: selectedRoom.stayType,
//       rate: selectedRoom.rate,
//       name: userForm.name,
//       nic: userForm.nic,
//       phone: userForm.phone,
//       email: userForm.email,
//       sharedRoom: userForm.sharedRoom,
//       pickAndDrop: userForm.pickAndDrop,
//       fullDayCar: userForm.fullDayCar,
//       requestedAt: new Date(),
//       startDate: dateRange.startDate,
//       endDate: dateRange.endDate,
//     };

//     try {
//       await setDoc(doc(hotelRequestsCol), requestData);
//       alert("Room request submitted successfully.");
//       setUserForm({
//         name: "",
//         nic: "",
//         phone: "",
//         email: "",
//         sharedRoom: false,
//         pickAndDrop: false,
//         fullDayCar: false,
//       });
//     } catch (error) {
//       console.error("Error submitting request:", error);
//       alert("Failed to submit request.");
//     }
//   };

//   return (
//     <div className="space-y-4">
//       <div className="space-y-2">
//         <h2 className="text-xl font-semibold">Hotels</h2>
//       </div>

//       <Card className="p-4">
//         <div className="relative flex items-center gap-3">
//           <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
//           <input
//             className="pl-9 w-full border rounded-md px-3 py-2 text-sm"
//             placeholder="Search by Hotel Name or City…"
//             value={qText}
//             onChange={(e) => setQText(e.target.value)}
//           />
//         </div>
//       </Card>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
//         {/* LEFT: Hotels list */}
//         <div className="lg:col-span-1 space-y-3">
//           {filteredHotels.length === 0 ? (
//             <Card className="p-4 text-sm text-muted-foreground">No hotels found.</Card>
//           ) : (
//             filteredHotels.map((h) => {
//               const isActive = h.status === "active";
//               const isSelected = selectedHotelId === h.id;

//               return (
//                 <Card
//                   key={h.id}
//                   className={`p-4 cursor-pointer hover:shadow-sm transition ${
//                     isSelected ? "ring-1 ring-black/10" : ""
//                   }`}
//                   onClick={() => setSelectedHotelId(h.id)}
//                 >
//                   <div className="flex items-start justify-between gap-3">
//                     <div className="min-w-0">
//                       <div className="flex items-center gap-2">
//                         <MapPin className="h-4 w-4 text-muted-foreground" />
//                         <div className="font-semibold text-sm truncate">{h.hotelName}</div>
//                       </div>

//                       <div className="mt-1 flex flex-wrap gap-2">
//                         <div className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
//                           <MapPin className="h-3 w-3" />
//                           {h.cityName || "—"}
//                         </div>
//                         <div className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
//                           {isActive ? <Receipt className="h-3 w-3" /> : <X className="h-3 w-3" />}
//                           {isActive ? "Active" : "Inactive"}
//                         </div>
//                         <div className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
//                           <BedDouble className="h-3 w-3" />
//                           {`${h.roomsCount ?? 0} rooms`}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </Card>
//               );
//             })
//           )}
//         </div>

//         {/* RIGHT: Selected hotel details + rooms */}
//         <div className="lg:col-span-2 space-y-3">
//           {!selectedHotelId ? (
//             <Card className="p-6 text-sm text-muted-foreground">
//               Select a hotel to view details and rooms.
//             </Card>
//           ) : (
//             <Card className="p-4">
//               <div className="flex gap-6">
//                 {/* Hotel Image */}
//                 {filteredHotels.find((h) => h.id === selectedHotelId)?.imageUrl ? (
//                   <div className="w-1/3">
//                     <img
//                       src={filteredHotels.find((h) => h.id === selectedHotelId)?.imageUrl}
//                       alt="Hotel Image"
//                       className="w-full h-auto object-cover rounded-lg"
//                     />
//                   </div>
//                 ) : (
//                   <div className="w-1/3 bg-muted h-full flex items-center justify-center text-white rounded-lg">
//                     No image available
//                   </div>
//                 )}

//                 {/* Hotel Details */}
//                 <div className="w-2/3">
//                   <div className="font-semibold text-lg">
//                     {filteredHotels.find((h) => h.id === selectedHotelId)?.hotelName}
//                   </div>
//                   <div className="text-sm text-muted-foreground mt-2">
//                     <MapPin className="h-4 w-4 inline-block" />
//                     {filteredHotels.find((h) => h.id === selectedHotelId)?.address}
//                   </div>

//                   <div className="mt-4 text-sm">
//                     <div className="font-medium">Services Offered:</div>
//                     <span>{filteredHotels.find((h) => h.id === selectedHotelId)?.servicesOffered}</span>
//                   </div>
//                 </div>
//               </div>

//               {/* Rooms & Rates */}
//               <div className="mt-6">
//                 <div className="text-lg font-semibold">Rooms & Rates</div>
//                 {rooms.length === 0 ? (
//                   <div className="text-sm text-muted-foreground mt-2">No rooms added yet.</div>
//                 ) : (
//                   rooms.map((room) => (
//                     <Card key={room.id} className="p-4 mt-2">
//                       <div className="flex items-start justify-between">
//                         <div className="min-w-0">
//                           <div className="font-semibold text-sm">{room.roomType} - {room.stayType}</div>
//                           <div className="text-sm text-muted-foreground">{room.roomDetails}</div>
//                         </div>

//                         <div className="flex items-center gap-3">
//                           <div className="text-xl font-semibold">
//                             PKR {room.rate.toLocaleString()}
//                           </div>
//                           <Button
//                             size="sm"
//                             variant="outline"
//                             className="gap-1"
//                             onClick={() => setSelectedRoom(room)}
//                           >
//                             Book Room
//                           </Button>
//                         </div>
//                       </div>
//                     </Card>
//                   ))
//                 )}
//               </div>

//               {/* Room Booking Form */}
//               {selectedRoom && (
//                 <div className="mt-6">
//                   <div className="text-lg font-semibold">Room Booking Form</div>
//                   <form
//                     onSubmit={(e) => {
//                       e.preventDefault();
//                       handleFormSubmit();
//                     }}
//                     className="space-y-4"
//                   >
//                     <div>
//                       <label>Name</label>
//                       <input
//                         type="text"
//                         value={userForm.name}
//                         onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
//                         className="w-full border rounded-md px-3 py-2 text-sm"
//                         required
//                       />
//                     </div>
//                     <div>
//                       <label>NIC</label>
//                       <input
//                         type="text"
//                         value={userForm.nic}
//                         onChange={(e) => setUserForm({ ...userForm, nic: e.target.value })}
//                         className="w-full border rounded-md px-3 py-2 text-sm"
//                         required
//                       />
//                     </div>
//                     <div>
//                       <label>Phone</label>
//                       <input
//                         type="text"
//                         value={userForm.phone}
//                         onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
//                         className="w-full border rounded-md px-3 py-2 text-sm"
//                         required
//                       />
//                     </div>
//                     <div>
//                       <label>Email</label>
//                       <input
//                         type="email"
//                         value={userForm.email}
//                         onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
//                         className="w-full border rounded-md px-3 py-2 text-sm"
//                         required
//                       />
//                     </div>
//                     <div>
//                       <label>
//                         <input
//                           type="checkbox"
//                           checked={userForm.sharedRoom}
//                           onChange={(e) => setUserForm({ ...userForm, sharedRoom: e.target.checked })}
//                         />{" "}
//                         Shared Room
//                       </label>
//                     </div>
//                     <div>
//                       <label>
//                         <input
//                           type="checkbox"
//                           checked={userForm.pickAndDrop}
//                           onChange={(e) => setUserForm({ ...userForm, pickAndDrop: e.target.checked })}
//                         />{" "}
//                         Pick and Drop Required
//                       </label>
//                     </div>
//                     <div>
//                       <label>
//                         <input
//                           type="checkbox"
//                           checked={userForm.fullDayCar}
//                           onChange={(e) => setUserForm({ ...userForm, fullDayCar: e.target.checked })}
//                         />{" "}
//                         Full Day Car Required
//                       </label>
//                     </div>
//                     <Button type="submit" className="gap-2">
//                       Submit Request
//                     </Button>
//                   </form>
//                 </div>
//               )}
//             </Card>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }





















// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { collection, getDocs, onSnapshot, query, orderBy, setDoc, doc } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { MapPin, BedDouble, Receipt, Search, X, CalendarDays } from "lucide-react";
// import { DateRangePicker } from "react-date-range";
// import "react-date-range/dist/styles.css";
// import "react-date-range/dist/theme/default.css";

// const PANEL_ID = "IEDGE-SYSTEM";
// const hotelsCol = collection(db, "Panels", PANEL_ID, "Travel", "Hotels", "items");
// const hotelRequestsCol = collection(db, "Panels", PANEL_ID, "Travel", "HotelRequests", "items");

// type HotelDoc = {
//   id: string;
//   cityName: string;
//   hotelName: string;
//   address: string;
//   servicesOffered: string;
//   imageUrl?: string;
//   paymentTerm: string;
//   status: "active" | "inactive";
//   roomsCount?: number;
//   rating: number;
//   priceInPKR: number;
// };

// type RoomDoc = {
//   id: string;
//   roomType: string;
//   stayType: string;
//   rate: number;
//   roomDetails: string;
//   rateStartDate: string;
//   rateEndDate: string;
// };

// export default function UserPanel() {
//   const [hotels, setHotels] = useState<HotelDoc[]>([]);
//   const [rooms, setRooms] = useState<RoomDoc[]>([]);
//   const [qText, setQText] = useState("");
//   const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
//   const [selectedRoom, setSelectedRoom] = useState<RoomDoc | null>(null);
//   const [dateRange, setDateRange] = useState<any>({
//     startDate: new Date(),
//     endDate: new Date(),
//     key: "selection",
//   });

//   const [userForm, setUserForm] = useState({
//     name: "",
//     nic: "",
//     phone: "",
//     email: "",
//     sharedRoom: false,
//     pickAndDrop: false,
//     fullDayCar: false,
//   });

//   const filteredHotels = useMemo(() => {
//     const term = qText.trim().toLowerCase();
//     return hotels.filter((h) => {
//       return (
//         !term ||
//         h.hotelName.toLowerCase().includes(term) ||
//         h.cityName.toLowerCase().includes(term)
//       );
//     });
//   }, [hotels, qText]);

//   useEffect(() => {
//     const unsubHotels = onSnapshot(query(hotelsCol, orderBy("hotelName", "asc")), (snap) => {
//       const mapped = snap.docs.map((d) => ({
//         id: d.id,
//         cityName: d.data().cityName,
//         hotelName: d.data().hotelName,
//         address: d.data().address,
//         servicesOffered: d.data().servicesOffered,
//         imageUrl: d.data().imageUrl,
//         paymentTerm: d.data().paymentTerm,
//         status: d.data().status,
//         roomsCount: d.data().roomsCount,
//         rating: d.data().rating || 0,
//         priceInPKR: d.data().priceInPKR || 0,
//       })) as HotelDoc[];

//       setHotels(mapped);
//     });

//     return () => unsubHotels();
//   }, []);

//   useEffect(() => {
//     if (!selectedHotelId) {
//       setRooms([]);
//       return;
//     }

//     const roomsCol = collection(db, "Panels", PANEL_ID, "Travel", "Hotels", "items", selectedHotelId, "rooms");

//     const unsubRooms = onSnapshot(roomsCol, (snap) => {
//       const roomList = snap.docs.map((d) => ({
//         id: d.id,
//         roomType: d.data().roomType,
//         stayType: d.data().stayType,
//         rate: d.data().rate,
//         roomDetails: d.data().roomDetails,
//         rateStartDate: d.data().rateStartDate,
//         rateEndDate: d.data().rateEndDate,
//       })) as RoomDoc[];

//       setRooms(roomList);
//     });

//     return () => unsubRooms();
//   }, [selectedHotelId]);

//   const handleFormSubmit = async () => {
//     if (!selectedHotelId || !selectedRoom) {
//       alert("Please select a hotel and room.");
//       return;
//     }

//     const hotel = hotels.find((h) => h.id === selectedHotelId);
//     if (!hotel) return;

//     const requestData = {
//       hotelId: selectedHotelId,
//       hotelName: hotel.hotelName,
//       roomId: selectedRoom.id,
//       roomType: selectedRoom.roomType,
//       stayType: selectedRoom.stayType,
//       rate: selectedRoom.rate,
//       name: userForm.name,
//       nic: userForm.nic,
//       phone: userForm.phone,
//       email: userForm.email,
//       sharedRoom: userForm.sharedRoom,
//       pickAndDrop: userForm.pickAndDrop,
//       fullDayCar: userForm.fullDayCar,
//       requestedAt: new Date(),
//       startDate: dateRange.startDate,
//       endDate: dateRange.endDate,
//     };

//     try {
//       await setDoc(doc(hotelRequestsCol), requestData);
//       alert("Room request submitted successfully.");
//       setUserForm({
//         name: "",
//         nic: "",
//         phone: "",
//         email: "",
//         sharedRoom: false,
//         pickAndDrop: false,
//         fullDayCar: false,
//       });
//     } catch (error) {
//       console.error("Error submitting request:", error);
//       alert("Failed to submit request.");
//     }
//   };

//   return (
//     <div className="space-y-4">
//       <div className="space-y-2">
//         <h2 className="text-xl font-semibold">Hotels</h2>
//       </div>

//       <Card className="p-4">
//         <div className="relative flex items-center gap-3">
//           <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
//           <input
//             className="pl-9 w-full border rounded-md px-3 py-2 text-sm"
//             placeholder="Search by Hotel Name or City…"
//             value={qText}
//             onChange={(e) => setQText(e.target.value)}
//           />
//         </div>
//       </Card>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
//         {/* LEFT: Hotels list */}
//         <div className="lg:col-span-1 space-y-3">
//           {filteredHotels.length === 0 ? (
//             <Card className="p-4 text-sm text-muted-foreground">No hotels found.</Card>
//           ) : (
//             filteredHotels.map((h) => {
//               const isActive = h.status === "active";
//               const isSelected = selectedHotelId === h.id;

//               return (
//                 <Card
//                   key={h.id}
//                   className={`p-4 cursor-pointer hover:shadow-sm transition ${
//                     isSelected ? "ring-1 ring-black/10" : ""
//                   }`}
//                   onClick={() => setSelectedHotelId(h.id)}
//                 >
//                   <div className="flex items-start justify-between gap-3">
//                     <div className="min-w-0">
//                       <div className="flex items-center gap-2">
//                         <MapPin className="h-4 w-4 text-muted-foreground" />
//                         <div className="font-semibold text-sm truncate">{h.hotelName}</div>
//                       </div>

//                       <div className="mt-1 flex flex-wrap gap-2">
//                         <div className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
//                           <MapPin className="h-3 w-3" />
//                           {h.cityName || "—"}
//                         </div>
//                         <div className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
//                           {isActive ? <Receipt className="h-3 w-3" /> : <X className="h-3 w-3" />}
//                           {isActive ? "Active" : "Inactive"}
//                         </div>
//                         <div className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
//                           <BedDouble className="h-3 w-3" />
//                           {`${h.roomsCount ?? 0} rooms`}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </Card>
//               );
//             })
//           )}
//         </div>

//         {/* RIGHT: Selected hotel details + rooms */}
//         <div className="lg:col-span-2 space-y-3">
//           {!selectedHotelId ? (
//             <Card className="p-6 text-sm text-muted-foreground">
//               Select a hotel to view details and rooms.
//             </Card>
//           ) : (
//             <Card className="p-4">
//               <div className="flex gap-6">
//                 {/* Hotel Image */}
//                 {filteredHotels.find((h) => h.id === selectedHotelId)?.imageUrl ? (
//                   <div className="w-1/3">
//                     <img
//                       src={filteredHotels.find((h) => h.id === selectedHotelId)?.imageUrl}
//                       alt="Hotel Image"
//                       className="w-full h-auto object-cover rounded-lg"
//                     />
//                   </div>
//                 ) : (
//                   <div className="w-1/3 bg-muted h-full flex items-center justify-center text-white rounded-lg">
//                     No image available
//                   </div>
//                 )}

//                 {/* Hotel Details */}
//                 <div className="w-2/3">
//                   <div className="font-semibold text-lg">
//                     {filteredHotels.find((h) => h.id === selectedHotelId)?.hotelName}
//                   </div>
//                   <div className="text-sm text-muted-foreground mt-2">
//                     <MapPin className="h-4 w-4 inline-block" />
//                     {filteredHotels.find((h) => h.id === selectedHotelId)?.address}
//                   </div>

//                   <div className="mt-4 text-sm">
//                     <div className="font-medium">Services Offered:</div>
//                     <span>{filteredHotels.find((h) => h.id === selectedHotelId)?.servicesOffered}</span>
//                   </div>
//                 </div>
//               </div>

//               {/* Rooms & Rates */}
//               <div className="mt-6">
//                 <div className="text-lg font-semibold">Rooms & Rates</div>
//                 {rooms.length === 0 ? (
//                   <div className="text-sm text-muted-foreground mt-2">No rooms added yet.</div>
//                 ) : (
//                   rooms.map((room) => (
//                     <Card key={room.id} className="p-4 mt-2">
//                       <div className="flex items-start justify-between">
//                         <div className="min-w-0">
//                           <div className="font-semibold text-sm">{room.roomType} - {room.stayType}</div>
//                           <div className="text-sm text-muted-foreground">{room.roomDetails}</div>
//                         </div>

//                         <div className="flex items-center gap-3">
//                           <div className="text-xl font-semibold">
//                             PKR {room.rate.toLocaleString()}
//                           </div>
//                           <Button
//                             size="sm"
//                             variant="outline"
//                             className="gap-1"
//                             onClick={() => setSelectedRoom(room)}
//                           >
//                             Book Room
//                           </Button>
//                         </div>
//                       </div>
//                     </Card>
//                   ))
//                 )}
//               </div>

//               {/* Room Booking Form */}
//               {selectedRoom && (
//                 <div className="mt-6">
//                   <div className="text-lg font-semibold">Room Booking Form</div>
//                   <form
//                     onSubmit={(e) => {
//                       e.preventDefault();
//                       handleFormSubmit();
//                     }}
//                     className="space-y-4"
//                   >
//                     <div>
//                       <label>Name</label>
//                       <input
//                         type="text"
//                         value={userForm.name}
//                         onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
//                         className="w-full border rounded-md px-3 py-2 text-sm"
//                         required
//                       />
//                     </div>
//                     <div>
//                       <label>NIC</label>
//                       <input
//                         type="text"
//                         value={userForm.nic}
//                         onChange={(e) => setUserForm({ ...userForm, nic: e.target.value })}
//                         className="w-full border rounded-md px-3 py-2 text-sm"
//                         required
//                       />
//                     </div>
//                     <div>
//                       <label>Phone</label>
//                       <input
//                         type="text"
//                         value={userForm.phone}
//                         onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
//                         className="w-full border rounded-md px-3 py-2 text-sm"
//                         required
//                       />
//                     </div>
//                     <div>
//                       <label>Email</label>
//                       <input
//                         type="email"
//                         value={userForm.email}
//                         onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
//                         className="w-full border rounded-md px-3 py-2 text-sm"
//                         required
//                       />
//                     </div>
//                     <div>
//                       <label>
//                         <input
//                           type="checkbox"
//                           checked={userForm.sharedRoom}
//                           onChange={(e) => setUserForm({ ...userForm, sharedRoom: e.target.checked })}
//                         />{" "}
//                         Shared Room
//                       </label>
//                     </div>
//                     <div>
//                       <label>
//                         <input
//                           type="checkbox"
//                           checked={userForm.pickAndDrop}
//                           onChange={(e) => setUserForm({ ...userForm, pickAndDrop: e.target.checked })}
//                         />{" "}
//                         Pick and Drop Required
//                       </label>
//                     </div>
//                     <div>
//                       <label>
//                         <input
//                           type="checkbox"
//                           checked={userForm.fullDayCar}
//                           onChange={(e) => setUserForm({ ...userForm, fullDayCar: e.target.checked })}
//                         />{" "}
//                         Full Day Car Required
//                       </label>
//                     </div>
//                     <Button type="submit" className="gap-2">
//                       Submit Request
//                     </Button>
//                   </form>
//                 </div>
//               )}
//             </Card>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
























// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { collection, getDocs, onSnapshot, query, orderBy, setDoc, doc } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { MapPin, BedDouble, Receipt, Search, X } from "lucide-react";
// import { DateRangePicker } from "react-date-range";
// import "react-date-range/dist/styles.css";
// import "react-date-range/dist/theme/default.css";

// const PANEL_ID = "IEDGE-SYSTEM";
// const hotelsCol = collection(db, "Panels", PANEL_ID, "Travel", "Hotels", "items");
// const hotelRequestsCol = collection(db, "Panels", PANEL_ID, "Travel", "HotelRequests", "items");

// type HotelDoc = {
//   id: string;
//   cityName: string;
//   hotelName: string;
//   address: string;
//   servicesOffered: string;
//   imageUrl?: string;
//   paymentTerm: string;
//   status: "active" | "inactive";
//   roomsCount?: number;
//   rating: number;
//   priceInPKR: number;
// };

// type RoomDoc = {
//   id: string;
//   roomType: string;
//   stayType: string;
//   rate: number;
//   roomDetails: string;
//   rateStartDate: string;
//   rateEndDate: string;
// };

// export default function UserPanel() {
//   const [hotels, setHotels] = useState<HotelDoc[]>([]);
//   const [rooms, setRooms] = useState<RoomDoc[]>([]);
//   const [qText, setQText] = useState("");
//   const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
//   const [selectedRoom, setSelectedRoom] = useState<RoomDoc | null>(null);
//   const [dateRange, setDateRange] = useState<any>({
//     startDate: new Date(),
//     endDate: new Date(),
//     key: "selection",
//   });

//   const [userForm, setUserForm] = useState<any[]>([{
//     name: "",
//     nic: "",
//     phone: "",
//     email: "",
//     sharedRoom: false,
//     pickAndDrop: false,
//     fullDayCar: false,
//   }]);

//   const [guestCount, setGuestCount] = useState(1);

//   const [selectedCity, setSelectedCity] = useState<string | null>(null);

//   const filteredHotels = useMemo(() => {
//     const term = qText.trim().toLowerCase();
//     return hotels.filter((h) => {
//       const isCityMatch = !selectedCity || h.cityName === selectedCity;
//       const isTextMatch = !term || h.hotelName.toLowerCase().includes(term) || h.cityName.toLowerCase().includes(term);
//       const isDateMatch = rooms.every((room) => {
//         const roomStartDate = new Date(room.rateStartDate);
//         const roomEndDate = new Date(room.rateEndDate);
//         return roomStartDate <= dateRange.endDate && roomEndDate >= dateRange.startDate;
//       });

//       return isTextMatch && isCityMatch && isDateMatch;
//     });
//   }, [hotels, qText, selectedCity, dateRange, rooms]);

//   useEffect(() => {
//     const unsubHotels = onSnapshot(query(hotelsCol, orderBy("hotelName", "asc")), (snap) => {
//       const mapped = snap.docs.map((d) => ({
//         id: d.id,
//         cityName: d.data().cityName,
//         hotelName: d.data().hotelName,
//         address: d.data().address,
//         servicesOffered: d.data().servicesOffered,
//         imageUrl: d.data().imageUrl,
//         paymentTerm: d.data().paymentTerm,
//         status: d.data().status,
//         roomsCount: d.data().roomsCount,
//         rating: d.data().rating || 0,
//         priceInPKR: d.data().priceInPKR || 0,
//       })) as HotelDoc[];

//       setHotels(mapped);
//     });

//     return () => unsubHotels();
//   }, []);

//   useEffect(() => {
//     if (!selectedHotelId) {
//       setRooms([]);
//       return;
//     }

//     const roomsCol = collection(db, "Panels", PANEL_ID, "Travel", "Hotels", "items", selectedHotelId, "rooms");

//     const unsubRooms = onSnapshot(roomsCol, (snap) => {
//       const roomList = snap.docs.map((d) => ({
//         id: d.id,
//         roomType: d.data().roomType,
//         stayType: d.data().stayType,
//         rate: d.data().rate,
//         roomDetails: d.data().roomDetails,
//         rateStartDate: d.data().rateStartDate,
//         rateEndDate: d.data().rateEndDate,
//       })) as RoomDoc[];

//       setRooms(roomList);
//     });

//     return () => unsubRooms();
//   }, [selectedHotelId]);

//   const handleFormSubmit = async () => {
//     if (!selectedHotelId || !selectedRoom) {
//       alert("Please select a hotel and room.");
//       return;
//     }

//     const hotel = hotels.find((h) => h.id === selectedHotelId);
//     if (!hotel) return;

//     const requestData = {
//       hotelId: selectedHotelId,
//       hotelName: hotel.hotelName,
//       roomId: selectedRoom.id,
//       roomType: selectedRoom.roomType,
//       stayType: selectedRoom.stayType,
//       rate: selectedRoom.rate,
//       guests: userForm,
//       requestedAt: new Date(),
//       startDate: dateRange.startDate,
//       endDate: dateRange.endDate,
//     };

//     try {
//       await setDoc(doc(hotelRequestsCol), requestData);
//       alert("Room request submitted successfully.");
//       setUserForm([{
//         name: "",
//         nic: "",
//         phone: "",
//         email: "",
//         sharedRoom: false,
//         pickAndDrop: false,
//         fullDayCar: false,
//       }]);
//     } catch (error) {
//       console.error("Error submitting request:", error);
//       alert("Failed to submit request.");
//     }
//   };

//   const handleAddGuest = () => {
//     setGuestCount((prev) => prev + 1);
//     setUserForm((prev) => [
//       ...prev,
//       { name: "", nic: "", phone: "", email: "", sharedRoom: false, pickAndDrop: false, fullDayCar: false },
//     ]);
//   };

//   const handleRemoveGuest = () => {
//     if (guestCount > 1) {
//       setGuestCount((prev) => prev - 1);
//       setUserForm((prev) => prev.slice(0, prev.length - 1));
//     }
//   };

//   return (
//     <div className="space-y-4">
//       <div className="space-y-2">
//         <h2 className="text-xl font-semibold">Hotels</h2>
//       </div>

//       {/* Filters */}
//       <Card className="p-4">
//         <div className="flex gap-4">
//           <div className="relative flex items-center gap-3">
//             <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
//             <input
//               className="pl-9 w-full border rounded-md px-3 py-2 text-sm"
//               placeholder="Search by Hotel Name or City"
//               value={qText}
//               onChange={(e) => setQText(e.target.value)}
//             />


//           </div>

//           <DateRangePicker
//             ranges={[dateRange]}
//             onChange={(ranges) => setDateRange(ranges.selection)}
//             className=" p-2 border rounded-md mt-2"
//             showSelectionPreview={false}
//             months={1}
//             direction="horizontal"
//           />




//           <div className="flex gap-3 mt-2">
//             <div>
//               <label>Guests</label>
//               <div className="flex gap-2 items-center">
//                 <button onClick={handleRemoveGuest} className="p-1 bg-gray-200 rounded">-</button>
//                 {guestCount}
//                 <button onClick={handleAddGuest} className="p-1 bg-gray-200 rounded">+</button>
//               </div>
//             </div>
//           </div>
//         </div>


//     <div className="flex gap-3 mt-2">
// <div>

// <Button>Search</Button>
// </div>

//     </div>

//       </Card>

//       {/* Hotels List */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
//         {filteredHotels.length === 0 ? (
//           <Card className="p-4 text-sm text-muted-foreground">No hotels found.</Card>
//         ) : (
//           filteredHotels.map((hotel) => (
//             <Card
//               key={hotel.id}
//               className="p-4 cursor-pointer hover:shadow-sm transition"
//               onClick={() => setSelectedHotelId(hotel.id)}
//             >
//               <div className="flex items-start justify-between gap-3">
//                 <div>
//                   <div className="font-semibold text-sm">{hotel.hotelName}</div>
//                   <div className="text-sm text-muted-foreground">{hotel.cityName}</div>
//                   <div>{hotel.roomsCount} Rooms</div>
//                 </div>
//                 {hotel.imageUrl && (
//                   <img
//                     src={hotel.imageUrl}
//                     alt="Hotel"
//                     className="w-24 h-24 object-cover rounded-md"
//                   />
//                 )}
//               </div>
//             </Card>
//           ))
//         )}
//       </div>

//       {/* Hotel Details */}
//       {selectedHotelId && (
//         <div className="lg:col-span-2 space-y-3">
//           <Card className="p-4">
//             <div className="flex gap-6">
//               {rooms.length > 0 ? (
//                 rooms.map((room) => (
//                   <Card key={room.id} className="p-4 mt-2">
//                     <div className="flex items-start justify-between">
//                       <div>
//                         <div className="font-semibold">{room.roomType}</div>
//                         <div className="text-sm text-muted-foreground">{room.roomDetails}</div>
//                       </div>
//                       <div className="text-xl font-semibold">PKR {room.rate}</div>
//                     </div>
//                     <Button onClick={() => setSelectedRoom(room)} className="mt-2">Select Room</Button>
//                   </Card>
//                 ))
//               ) : (
//                 <div>No rooms available</div>
//               )}
//             </div>

//             {/* Room Booking Form */}
//             {selectedRoom && (
//               <form
//                 onSubmit={(e) => {
//                   e.preventDefault();
//                   handleFormSubmit();
//                 }}
//                 className="space-y-4"
//               >
//                 {userForm.map((guest, index) => (
//                   <div key={index}>
//                     <h3>Guest {index + 1}</h3>
//                     <div>
//                       <label>First Name</label>
//                       <input
//                         type="text"
//                         value={guest.name}
//                         onChange={(e) =>
//                           setUserForm(
//                             userForm.map((g, i) =>
//                               i === index ? { ...g, name: e.target.value } : g
//                             )
//                           )
//                         }
//                         required
//                       />
//                     </div>
//                     <div>
//                       <label>NIC</label>
//                       <input
//                         type="text"
//                         value={guest.nic}
//                         onChange={(e) =>
//                           setUserForm(
//                             userForm.map((g, i) =>
//                               i === index ? { ...g, nic: e.target.value } : g
//                             )
//                           )
//                         }
//                         required
//                       />
//                     </div>
//                   </div>
//                 ))}

//                 <Button type="submit">Submit Request</Button>
//               </form>
//             )}
//           </Card>
//         </div>
//       )}
//     </div>
//   );
// }



// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { collection, onSnapshot, query, orderBy, setDoc, doc } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { MapPin, BedDouble, Receipt, Search } from "lucide-react";
// import { DateRangePicker } from "react-date-range";
// import "react-date-range/dist/styles.css";
// import "react-date-range/dist/theme/default.css";

// const PANEL_ID = "IEDGE-SYSTEM";
// const hotelsCol = collection(db, "Panels", PANEL_ID, "Travel", "Hotels", "items");
// const hotelRequestsCol = collection(db, "Panels", PANEL_ID, "Travel", "HotelRequests", "items");

// type HotelDoc = {
//   id: string;
//   cityName: string;
//   hotelName: string;
//   address: string;
//   servicesOffered: string;
//   imageUrl?: string;
//   paymentTerm: string;
//   status: "active" | "inactive";
//   roomsCount?: number;
//   rating: number;
//   priceInPKR: number;
// };

// type RoomDoc = {
//   id: string;
//   roomType: string;
//   stayType: string;
//   rate: number;
//   roomDetails: string;
//   rateStartDate: string;
//   rateEndDate: string;
// };

// export default function UserPanel() {
//   const [hotels, setHotels] = useState<HotelDoc[]>([]);
//   const [rooms, setRooms] = useState<RoomDoc[]>([]);
//   const [qText, setQText] = useState("");
//   const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
//   const [selectedRoom, setSelectedRoom] = useState<RoomDoc | null>(null);
//   const [dateRange, setDateRange] = useState<any>({
//     startDate: new Date(),
//     endDate: new Date(),
//     key: "selection",
//   });

//   const [userForm, setUserForm] = useState<any[]>([{
//     name: "",
//     nic: "",
//     phone: "",
//     email: "",
//     sharedRoom: false,
//     pickAndDrop: false,
//     fullDayCar: false,
//   }]);

//   const [guestCount, setGuestCount] = useState(1);

//   const [selectedCity, setSelectedCity] = useState<string | null>(null);

//   const filteredHotels = useMemo(() => {
//     const term = qText.trim().toLowerCase();
//     return hotels.filter((h) => {
//       const isCityMatch = !selectedCity || h.cityName === selectedCity;
//       const isTextMatch = !term || h.hotelName.toLowerCase().includes(term) || h.cityName.toLowerCase().includes(term);
//       const isDateMatch = rooms.every((room) => {
//         const roomStartDate = new Date(room.rateStartDate);
//         const roomEndDate = new Date(room.rateEndDate);
//         return roomStartDate <= dateRange.endDate && roomEndDate >= dateRange.startDate;
//       });

//       return isTextMatch && isCityMatch && isDateMatch;
//     });
//   }, [hotels, qText, selectedCity, dateRange, rooms]);

//   useEffect(() => {
//     const unsubHotels = onSnapshot(query(hotelsCol, orderBy("hotelName", "asc")), (snap) => {
//       const mapped = snap.docs.map((d) => ({
//         id: d.id,
//         cityName: d.data().cityName,
//         hotelName: d.data().hotelName,
//         address: d.data().address,
//         servicesOffered: d.data().servicesOffered,
//         imageUrl: d.data().imageUrl,
//         paymentTerm: d.data().paymentTerm,
//         status: d.data().status,
//         roomsCount: d.data().roomsCount,
//         rating: d.data().rating || 0,
//         priceInPKR: d.data().priceInPKR || 0,
//       })) as HotelDoc[];

//       setHotels(mapped);
//     });

//     return () => unsubHotels();
//   }, []);

//   useEffect(() => {
//     if (!selectedHotelId) {
//       setRooms([]);
//       return;
//     }

//     const roomsCol = collection(db, "Panels", PANEL_ID, "Travel", "Hotels", "items", selectedHotelId, "rooms");

//     const unsubRooms = onSnapshot(roomsCol, (snap) => {
//       const roomList = snap.docs.map((d) => ({
//         id: d.id,
//         roomType: d.data().roomType,
//         stayType: d.data().stayType,
//         rate: d.data().rate,
//         roomDetails: d.data().roomDetails,
//         rateStartDate: d.data().rateStartDate,
//         rateEndDate: d.data().rateEndDate,
//       })) as RoomDoc[];

//       setRooms(roomList);
//     });

//     return () => unsubRooms();
//   }, [selectedHotelId]);

//   const handleFormSubmit = async () => {
//     if (!selectedHotelId || !selectedRoom) {
//       alert("Please select a hotel and room.");
//       return;
//     }

//     const hotel = hotels.find((h) => h.id === selectedHotelId);
//     if (!hotel) return;

//     const requestData = {
//       hotelId: selectedHotelId,
//       hotelName: hotel.hotelName,
//       roomId: selectedRoom.id,
//       roomType: selectedRoom.roomType,
//       stayType: selectedRoom.stayType,
//       rate: selectedRoom.rate,
//       guests: userForm,
//       requestedAt: new Date(),
//       startDate: dateRange.startDate,
//       endDate: dateRange.endDate,
//     };

//     try {
//       await setDoc(doc(hotelRequestsCol), requestData);
//       alert("Room request submitted successfully.");
//       setUserForm([{
//         name: "",
//         nic: "",
//         phone: "",
//         email: "",
//         sharedRoom: false,
//         pickAndDrop: false,
//         fullDayCar: false,
//       }]);
//     } catch (error) {
//       console.error("Error submitting request:", error);
//       alert("Failed to submit request.");
//     }
//   };

//   const handleAddGuest = () => {
//     setGuestCount((prev) => prev + 1);
//     setUserForm((prev) => [
//       ...prev,
//       { name: "", nic: "", phone: "", email: "", sharedRoom: false, pickAndDrop: false, fullDayCar: false },
//     ]);
//   };

//   const handleRemoveGuest = () => {
//     if (guestCount > 1) {
//       setGuestCount((prev) => prev - 1);
//       setUserForm((prev) => prev.slice(0, prev.length - 1));
//     }
//   };

//   return (
//     <div className="space-y-4">
//       <div className="space-y-2">
//         <h2 className="text-xl font-semibold">Hotels</h2>
//       </div>

//       {/* Filters */}
//       <Card className="p-4">
//         <div className="flex gap-4">
//           <div className="relative flex items-center gap-3">
//             <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
//             <input
//               className="pl-9 w-full border rounded-md px-3 py-2 text-sm"
//               placeholder="Search by Hotel Name or City"
//               value={qText}
//               onChange={(e) => setQText(e.target.value)}
//             />
//           </div>

//           <DateRangePicker
//             ranges={[dateRange]}
//             onChange={(ranges) => setDateRange(ranges.selection)}
//             className=" p-2 border rounded-md mt-2"
//             showSelectionPreview={false}
//             months={1}
//             direction="horizontal"
//           />

//           <div className="flex gap-3 mt-2">
//             <div>
//               <label>Guests</label>
//               <div className="flex gap-2 items-center">
//                 <button onClick={handleRemoveGuest} className="p-1 bg-gray-200 rounded">-</button>
//                 {guestCount}
//                 <button onClick={handleAddGuest} className="p-1 bg-gray-200 rounded">+</button>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="flex gap-3 mt-2">
//           <Button onClick={() => {}}>Search</Button>
//         </div>
//       </Card>

//       {/* Hotels List */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
//         {filteredHotels.length === 0 ? (
//           <Card className="p-4 text-sm text-muted-foreground">No hotels found.</Card>
//         ) : (
//           filteredHotels.map((hotel) => (
//             <Card
//               key={hotel.id}
//               className="p-4 cursor-pointer hover:shadow-sm transition"
//               onClick={() => setSelectedHotelId(hotel.id)}
//             >
//               <div className="flex items-start justify-between gap-3">
//                 <div>
//                   <div className="font-semibold text-sm">{hotel.hotelName}</div>
//                   <div className="text-sm text-muted-foreground">{hotel.cityName}</div>
//                   <div>{hotel.roomsCount} Rooms</div>
//                 </div>
//                 {hotel.imageUrl && (
//                   <img
//                     src={hotel.imageUrl}
//                     alt="Hotel"
//                     className="w-24 h-24 object-cover rounded-md"
//                   />
//                 )}
//               </div>
//             </Card>
//           ))
//         )}
//       </div>

//       {/* Hotel Details */}
//       {selectedHotelId && (
//         <div className="lg:col-span-2 space-y-3">
//           <Card className="p-4">
//             <div className="flex gap-6">
//               {rooms.length > 0 ? (
//                 rooms.map((room) => (
//                   <Card key={room.id} className="p-4 mt-2">
//                     <div className="flex items-start justify-between">
//                       <div>
//                         <div className="font-semibold">{room.roomType}</div>
//                         <div className="text-sm text-muted-foreground">{room.roomDetails}</div>
//                       </div>
//                       <div className="text-xl font-semibold">PKR {room.rate}</div>
//                     </div>
//                     <Button onClick={() => setSelectedRoom(room)} className="mt-2">Select Room</Button>
//                   </Card>
//                 ))
//               ) : (
//                 <div>No rooms available</div>
//               )}
//             </div>

//             {/* Room Booking Form */}
//             {selectedRoom && (
//               <form
//                 onSubmit={(e) => {
//                   e.preventDefault();
//                   handleFormSubmit();
//                 }}
//                 className="space-y-4"
//               >
//                 {userForm.map((guest, index) => (
//                   <div key={index}>
//                     <h3>Guest {index + 1}</h3>
//                     <div>
//                       <label>First Name</label>
//                       <input
//                         type="text"
//                         value={guest.name}
//                         onChange={(e) =>
//                           setUserForm(
//                             userForm.map((g, i) =>
//                               i === index ? { ...g, name: e.target.value } : g
//                             )
//                           )
//                         }
//                         required
//                       />
//                     </div>
//                     <div>
//                       <label>NIC</label>
//                       <input
//                         type="text"
//                         value={guest.nic}
//                         onChange={(e) =>
//                           setUserForm(
//                             userForm.map((g, i) =>
//                               i === index ? { ...g, nic: e.target.value } : g
//                             )
//                           )
//                         }
//                         required
//                       />
//                     </div>
//                   </div>
//                 ))}

//                 <Button type="submit">Submit Request</Button>
//               </form>
//             )}
//           </Card>
//         </div>
//       )}
//     </div>
//   );
// }
















// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { collection, onSnapshot, query, orderBy, setDoc, doc } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { MapPin, BedDouble, Receipt, Search } from "lucide-react";
// import { DateRangePicker } from "react-date-range";
// import "react-date-range/dist/styles.css";
// import "react-date-range/dist/theme/default.css";

// const PANEL_ID = "IEDGE-SYSTEM";
// const hotelsCol = collection(db, "Panels", PANEL_ID, "Travel", "Hotels", "items");
// const hotelRequestsCol = collection(db, "Panels", PANEL_ID, "Travel", "HotelRequests", "items");

// type HotelDoc = {
//   id: string;
//   cityName: string;
//   hotelName: string;
//   address: string;
//   servicesOffered: string;
//   imageUrl?: string;
//   paymentTerm: string;
//   status: "active" | "inactive";
//   roomsCount?: number;
//   rating: number;
//   priceInPKR: number;
// };

// type RoomDoc = {
//   id: string;
//   roomType: string;
//   stayType: string;
//   rate: number;
//   roomDetails: string;
//   rateStartDate: string;
//   rateEndDate: string;
// };

// export default function UserPanel() {
//   const [hotels, setHotels] = useState<HotelDoc[]>([]);
//   const [rooms, setRooms] = useState<RoomDoc[]>([]);
//   const [qText, setQText] = useState("");
//   const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
//   const [selectedRoom, setSelectedRoom] = useState<RoomDoc | null>(null);
//   const [dateRange, setDateRange] = useState<any>({
//     startDate: new Date(),
//     endDate: new Date(),
//     key: "selection",
//   });

//   const [userForm, setUserForm] = useState<any[]>([{
//     name: "",
//     nic: "",
//     phone: "",
//     email: "",
//     sharedRoom: false,
//     pickAndDrop: false,
//     fullDayCar: false,
//   }]);

//   const [guestCount, setGuestCount] = useState(1);

//   const [selectedCity, setSelectedCity] = useState<string | null>(null);

//   const filteredHotels = useMemo(() => {
//     const term = qText.trim().toLowerCase();
//     return hotels.filter((h) => {
//       const isCityMatch = !selectedCity || h.cityName === selectedCity;
//       const isTextMatch = !term || h.hotelName.toLowerCase().includes(term) || h.cityName.toLowerCase().includes(term);
//       const isDateMatch = rooms.every((room) => {
//         const roomStartDate = new Date(room.rateStartDate);
//         const roomEndDate = new Date(room.rateEndDate);
//         return roomStartDate <= dateRange.endDate && roomEndDate >= dateRange.startDate;
//       });

//       return isTextMatch && isCityMatch && isDateMatch;
//     });
//   }, [hotels, qText, selectedCity, dateRange, rooms]);

//   useEffect(() => {
//     const unsubHotels = onSnapshot(query(hotelsCol, orderBy("hotelName", "asc")), (snap) => {
//       const mapped = snap.docs.map((d) => ({
//         id: d.id,
//         cityName: d.data().cityName,
//         hotelName: d.data().hotelName,
//         address: d.data().address,
//         servicesOffered: d.data().servicesOffered,
//         imageUrl: d.data().imageUrl,
//         paymentTerm: d.data().paymentTerm,
//         status: d.data().status,
//         roomsCount: d.data().roomsCount,
//         rating: d.data().rating || 0,
//         priceInPKR: d.data().priceInPKR || 0,
//       })) as HotelDoc[];

//       setHotels(mapped);
//     });

//     return () => unsubHotels();
//   }, []);

//   useEffect(() => {
//     if (!selectedHotelId) {
//       setRooms([]);
//       return;
//     }

//     const roomsCol = collection(db, "Panels", PANEL_ID, "Travel", "Hotels", "items", selectedHotelId, "rooms");

//     const unsubRooms = onSnapshot(roomsCol, (snap) => {
//       const roomList = snap.docs.map((d) => ({
//         id: d.id,
//         roomType: d.data().roomType,
//         stayType: d.data().stayType,
//         rate: d.data().rate,
//         roomDetails: d.data().roomDetails,
//         rateStartDate: d.data().rateStartDate,
//         rateEndDate: d.data().rateEndDate,
//       })) as RoomDoc[];

//       setRooms(roomList);
//     });

//     return () => unsubRooms();
//   }, [selectedHotelId]);

//   const handleFormSubmit = async () => {
//     if (!selectedHotelId || !selectedRoom) {
//       alert("Please select a hotel and room.");
//       return;
//     }

//     const hotel = hotels.find((h) => h.id === selectedHotelId);
//     if (!hotel) return;

//     const requestData = {
//       hotelId: selectedHotelId,
//       hotelName: hotel.hotelName,
//       roomId: selectedRoom.id,
//       roomType: selectedRoom.roomType,
//       stayType: selectedRoom.stayType,
//       rate: selectedRoom.rate,
//       guests: userForm,
//       requestedAt: new Date(),
//       startDate: dateRange.startDate,
//       endDate: dateRange.endDate,
//     };

//     try {
//       await setDoc(doc(hotelRequestsCol), requestData);
//       alert("Room request submitted successfully.");
//       setUserForm([{
//         name: "",
//         nic: "",
//         phone: "",
//         email: "",
//         sharedRoom: false,
//         pickAndDrop: false,
//         fullDayCar: false,
//       }]);
//     } catch (error) {
//       console.error("Error submitting request:", error);
//       alert("Failed to submit request.");
//     }
//   };

//   const handleAddGuest = () => {
//     setGuestCount((prev) => prev + 1);
//     setUserForm((prev) => [
//       ...prev,
//       { name: "", nic: "", phone: "", email: "", sharedRoom: false, pickAndDrop: false, fullDayCar: false },
//     ]);
//   };

//   const handleRemoveGuest = () => {
//     if (guestCount > 1) {
//       setGuestCount((prev) => prev - 1);
//       setUserForm((prev) => prev.slice(0, prev.length - 1));
//     }
//   };

//   return (
//     <div className="space-y-4">
//       <div className="space-y-2">
//         <h2 className="text-xl font-semibold">Hotels</h2>
//       </div>

//     {/* Filters */}
// <Card className="p-6 shadow-lg rounded-lg bg-white">
//   <div className="flex flex-wrap gap-6">



//     {/* Date Picker */}
//     <div className="flex-1 min-w-[250px]">
//       <DateRangePicker
//         ranges={[dateRange]}
//         onChange={(ranges) => setDateRange(ranges.selection)}
//         className="w-full p-3 border rounded-lg shadow-md focus:ring-2 focus:ring-blue-500"
//         showSelectionPreview={false}
//         months={1}
//         direction="horizontal"
//       />
//     </div>

//   {/* Search Box */}
//  <div className="relative flex-1 min-w-[300px]">
//       <div className="absolute left-3 top-2.5">
//         <Search className="h-4 w-4 text-gray-500" />
//       </div>
//       <input
//         className="pl-9 w-full border rounded-lg px-4 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
//         placeholder="Search by Hotel Name or City"
//         value={qText}
//         onChange={(e) => setQText(e.target.value)}
//       />
//     </div>

//     {/* Guest Selection */}
//     <div className="flex-1 min-w-[250px]">
//       <div className="mb-2">
//         <label className="block text-sm font-semibold">Guests</label>
//         <div className="flex items-center gap-4">
//           <button
//             onClick={handleRemoveGuest}
//             className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-all"
//           >
//             -
//           </button>
//           <span className="text-xl font-semibold">{guestCount}</span>
//           <button
//             onClick={handleAddGuest}
//             className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-all"
//           >
//             +
//           </button>
//         </div>
//       </div>
//     </div>
//   </div>

//   {/* Search Button */}
//   <div className="mt-4 flex justify-end">
//     <Button
//       onClick={() => {}}
//       className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-all"
//     >
//       Search
//     </Button>
//   </div>
// </Card>


//       {/* Hotels List */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
//         {filteredHotels.length === 0 ? (
//           <Card className="p-4 text-sm text-muted-foreground">No hotels found.</Card>
//         ) : (
//           filteredHotels.map((hotel) => (
//             <Card
//               key={hotel.id}
//               className="p-4 cursor-pointer hover:shadow-sm transition"
//               onClick={() => setSelectedHotelId(hotel.id)}
//             >
//               <div className="flex items-start justify-between gap-3">
//                 <div>
//                   <div className="font-semibold text-sm">{hotel.hotelName}</div>
//                   <div className="text-sm text-muted-foreground">{hotel.cityName}</div>
//                   <div>{hotel.roomsCount} Rooms</div>
//                 </div>
//                 {hotel.imageUrl && (
//                   <img
//                     src={hotel.imageUrl}
//                     alt="Hotel"
//                     className="w-24 h-24 object-cover rounded-md"
//                   />
//                 )}
//               </div>
//             </Card>
//           ))
//         )}
//       </div>

//       {/* Hotel Details */}
//       {selectedHotelId && (
//         <div className="lg:col-span-2 space-y-3">
//           <Card className="p-4">
//             <div className="flex gap-6">
//               {rooms.length > 0 ? (
//                 rooms.map((room) => (
//                   <Card key={room.id} className="p-4 mt-2">
//                     <div className="flex items-start justify-between">
//                       <div>
//                         <div className="font-semibold">{room.roomType}</div>
//                         <div className="text-sm text-muted-foreground">{room.roomDetails}</div>
//                       </div>
//                       <div className="text-xl font-semibold">PKR {room.rate}</div>
//                     </div>
//                     <Button onClick={() => setSelectedRoom(room)} className="mt-2">Select Room</Button>
//                   </Card>
//                 ))
//               ) : (
//                 <div>No rooms available</div>
//               )}
//             </div>

//             {/* Room Booking Form */}
//             {selectedRoom && (
//               <form
//                 onSubmit={(e) => {
//                   e.preventDefault();
//                   handleFormSubmit();
//                 }}
//                 className="space-y-4"
//               >
//                 {userForm.map((guest, index) => (
//                   <div key={index}>
//                     <h3>Guest {index + 1}</h3>
//                     <div>
//                       <label>First Name</label>
//                       <input
//                         type="text"
//                         value={guest.name}
//                         onChange={(e) =>
//                           setUserForm(
//                             userForm.map((g, i) =>
//                               i === index ? { ...g, name: e.target.value } : g
//                             )
//                           )
//                         }
//                         required
//                       />
//                     </div>
//                     <div>
//                       <label>NIC</label>
//                       <input
//                         type="text"
//                         value={guest.nic}
//                         onChange={(e) =>
//                           setUserForm(
//                             userForm.map((g, i) =>
//                               i === index ? { ...g, nic: e.target.value } : g
//                             )
//                           )
//                         }
//                         required
//                       />
//                     </div>
//                   </div>
//                 ))}

//                 <Button type="submit">Submit Request</Button>
//               </form>
//             )}
//           </Card>
//         </div>
//       )}
//     </div>
//   );
// }







"use client";

import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import HotelBookingModal from "@/components/HotelBookingModal";

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


  const [hotels, setHotels] = useState<
    (Hotel & { rooms: Room[] })[]
  >([]);

  const [selected, setSelected] = useState<{
    hotel: Hotel;
    room: Room;
  } | null>(null);

  const totalGuests = adults + children;

  // NEW STATE
  const HOTELS_PER_PAGE = 10;

  const [allHotels, setAllHotels] = useState<
    (Hotel & { rooms: Room[] })[]
  >([]);


  const [currentPage, setCurrentPage] = useState(1);
  // -----

const searchHotels = async () => {
  if (!cityId || !checkIn || !checkOut) {
    alert("Select city and dates");
    return;
  }

  setLoading(true);
  setHotels([]);

  try {
    const hotelSnap = await getDocs(
      query(
        collection(db, "Panels", PANEL_ID, "Travel", "Hotels", "items"),
        where("cityId", "==", cityId),
        where("status", "==", "active")
      )
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
            "rooms"
          ),
          where("rateStartDate", "<=", checkIn),
          where("rateEndDate", ">=", checkOut)
        )
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


  // DEFAULT FETCH (ALL HOTELS)
const fetchAllHotels = async () => {
  setLoading(true);

  try {
    const snap = await getDocs(
      query(
        collection(db, "Panels", PANEL_ID, "Travel", "Hotels", "items"),
        where("status", "==", "active")
      )
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
          "rooms"
        )
      );

      const rooms = roomsSnap.docs.map((r) => ({
        id: r.id,
        ...(r.data() as any),
      }));

      return rooms.length ? { ...hotel, rooms } : null;
    });

    const result = (await Promise.all(hotelPromises)).filter(Boolean);

    setAllHotels(result as any[]);
    setHotels(result as any[]);
  } finally {
    setLoading(false);
  }
};

  // -----

  useEffect(() => {
    fetchAllHotels();
  }, []);


  const totalPages = Math.ceil(hotels.length / HOTELS_PER_PAGE);

  const paginatedHotels = hotels.slice(
    (currentPage - 1) * HOTELS_PER_PAGE,
    currentPage * HOTELS_PER_PAGE
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
        </div>

        {/* City */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            City
          </label>
          <Input
            placeholder="Enter city name"
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
          />
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
          <Button className="w-full" onClick={searchHotels}>
            Search
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




      {paginatedHotels.map((hotel) => (

        <Card key={hotel.id} className="p-4 space-y-4">
          <div className="flex gap-4">
            <img
              src={hotel.imageUrl || "/placeholder.png"}
              className="w-44 h-32 object-cover rounded"
            />
            <div>
              <h2 className="text-lg font-semibold">{hotel.hotelName}</h2>
              <h4 className="text-lg text-muted-foreground ">{hotel.address}</h4>
              <p className="text-sm text-muted-foreground">
                {hotel.servicesOffered}
              </p>
            </div>
          </div>

          {hotel.rooms.map((room) => (
            <div key={room.id} className="border p-3 rounded flex justify-between">
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
                  onClick={() => setSelected({ hotel, room })}
                >
                  Select
                </Button>
              </div>
            </div>
          ))}
        </Card>
      ))}

      {/* PAGINATION UI (BOTTOM) */}
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
