"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { pakistanCities } from "@/data/pakistanCities";
// If you already have these, keep using them. If not, replace with your own.
import TravelTabs from "./TravelTabs";


import {
  Building2,
  Search,
  Plus,
  MapPin,
  User,
  Phone,
  Mail,
  BadgeCheck,
  BadgeX,
  CreditCard,
  Save,
  X,
  Pencil,
  Trash2,
  BedDouble,
  Clock,
  CalendarDays,
  Receipt,
  FileText,
  Link2,
  Filter,
  ChevronDown,
} from "lucide-react";

const PANEL_ID = "IEDGE-SYSTEM";

/**
 * ✅ New Firestore Structure (no branches)
 * Panels/IEDGE-SYSTEM/Travel/Hotels/items/{hotelId}
 *   - hotel fields
 * Panels/IEDGE-SYSTEM/Travel/Hotels/items/{hotelId}/rooms/{roomId}
 *   - room fields
 */
const hotelsCol = collection(db, "Panels", PANEL_ID, "Travel", "Hotels", "items");

// Hotel Settings (dynamic Room Types + Stay Types)
const roomTypesCol = collection(db, "Panels", PANEL_ID, "Travel", "HotelSettings", "roomTypes");
const stayTypesCol = collection(db, "Panels", PANEL_ID, "Travel", "HotelSettings", "stayTypes");

type RoomTypeItem = { id: string; name: string };
type StayTypeItem = { id: string; value: string; label: string };


// Lookups
const citiesCol = collection(db, "Panels", PANEL_ID, "Travel", "Cities", "items");
const paymentTermsCol = collection(db, "Panels", PANEL_ID, "paymentTerms");
const taxCol = collection(db, "Panels", PANEL_ID, "tax");

type CityDoc = { id: string; name: string };
type TaxDoc = { id: string; name: string; percent?: number };
type PaymentTerm = string;

type HotelStatus = "active" | "inactive";
type TaxType = "inclusive" | "exclusive";

type HotelDoc = {
  id: string;

  cityId: string;
  cityName: string;

  hotelName: string;
  address: string;
  locationLink: string;

  contactPerson: string;
  contactNo: string;
  email: string;

  status: HotelStatus;
  paymentTerm: string;

  taxType: TaxType;

  servicesOffered: string;
imageUrl?: string;

  createdAt?: any;
  updatedAt?: any;

  // helpful computed
  roomsCount?: number;
};

type StayType = string; // dynamic from Firestore
type RoomType = string; // dynamic from Firestore


type RoomDoc = {
  id: string;

  checkInTime: string; // "14:00"
  checkOutTime: string; // "12:00"

  roomType: RoomType;
  stayType: StayType;

  rate: number;

  taxId: string; // from tax table
  taxLabel: string;
  taxPercent: number;

  roomDetails: string;

  rateStartDate: string; // yyyy-mm-dd
  rateEndDate: string; // yyyy-mm-dd

  createdAt?: any;
  updatedAt?: any;
};



const uploadImageToCloudinary = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "cloud-water");

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/iedge-system-travel-uploads/image/upload`;
    
    const response = await fetch(cloudinaryUrl, {
      method: "POST",
      body: formData,
    });

    // Log response to see if it's a bad request or has additional error details
    const result = await response.json();

    if (response.ok) {
      return result.secure_url; // Return the URL of the uploaded image
    } else {
      console.error("Error uploading image to Cloudinary:", result);
      throw new Error(result.error.message); // Show the error message returned by Cloudinary
    }
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    throw new Error("Image upload failed");
  }
};





const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());

const toNum = (v: string) => Number(String(v || "").replace(/,/g, "").trim()) || 0;

function isValidUrlLike(v: string) {
  const s = String(v || "").trim();
  if (!s) return true;
  return /^https?:\/\/.+/i.test(s);
}

function isValidEmailLike(v: string) {
  const s = String(v || "").trim();
  if (!s) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

const cn = (...classes: (string | false | undefined | null)[]) => classes.filter(Boolean).join(" ");

function tinyChip(icon: ReactNode, text: string) {

  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
      {icon}
      {text}
    </span>
  );
}

export default function Hotel() {

  // Add this state for the image file
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Handle image file change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      setImageFile(file); // Save the selected file
    }
  };
  // ✅ dynamic settings
  const [roomTypes, setRoomTypes] = useState<RoomTypeItem[]>([]);
  const [stayTypes, setStayTypes] = useState<StayTypeItem[]>([]);

  // fallback options if settings are empty (optional but recommended)
  const roomTypeOptions = useMemo(
    () =>
      roomTypes.length > 0
        ? roomTypes.map((r) => r.name).filter(Boolean)
        : ["Standard"],
    [roomTypes]
  );

  const stayTypeOptions = useMemo(
    () =>
      stayTypes.length > 0
        ? stayTypes
          .map((s) => ({
            value: String(s.value || "").toUpperCase(),
            label: String(s.label || ""),
          }))
          .filter((s) => s.value)
        : [{ value: "BB", label: "BB - Bed & Breakfast" }],
    [stayTypes]
  );


  // lookups
  // ✅ load hotel settings (room types + stay types)
  useEffect(() => {
    const unsubRoomTypes = onSnapshot(query(roomTypesCol, orderBy("name", "asc")), (snap) => {
      setRoomTypes(
        snap.docs
          .map((d) => ({ id: d.id, name: String((d.data() as any)?.name || "").trim() }))
          .filter((x) => x.name)
      );
    });

    const unsubStayTypes = onSnapshot(query(stayTypesCol, orderBy("value", "asc")), (snap) => {
      setStayTypes(
        snap.docs
          .map((d) => ({
            id: d.id,
            value: String((d.data() as any)?.value || "").trim(),
            label: String((d.data() as any)?.label || "").trim(),
          }))
          .filter((x) => x.value)
      );
    });

    return () => {
      unsubRoomTypes();
      unsubStayTypes();
    };
  }, []);


  const [cities, setCities] = useState<CityDoc[]>([]);
  const cityOptions: CityDoc[] = useMemo(() => {
    const dbCities = cities.filter((c) => c?.id && c?.name);
    if (dbCities.length > 0) return dbCities.sort((a, b) => a.name.localeCompare(b.name));

    const fromJson =
      Array.isArray(pakistanCities) && pakistanCities.length > 0
        ? (pakistanCities as any[]).map((c, idx) => {
          if (typeof c === "string") return { id: `pk_${idx}`, name: c };
          return {
            id: String((c as any).id ?? `pk_${idx}`),
            name: String((c as any).name ?? ""),
          };
        })
        : [];

    return fromJson.filter((c) => c.name).sort((a, b) => a.name.localeCompare(b.name));
  }, [cities]);

  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
  const [taxes, setTaxes] = useState<TaxDoc[]>([]);

  // hotels
  const [hotels, setHotels] = useState<HotelDoc[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);

  // rooms (for selected hotel)
  const [rooms, setRooms] = useState<RoomDoc[]>([]);

  // top search + filters
  const [qText, setQText] = useState("");
  const [filterCityId, setFilterCityId] = useState("");
  const [filterStatus, setFilterStatus] = useState<"" | HotelStatus>("");
  const [filterPaymentTerm, setFilterPaymentTerm] = useState("");

  // add/edit hotel modal-ish state
  const [showHotelForm, setShowHotelForm] = useState(false);
  const [editingHotelId, setEditingHotelId] = useState<string | null>(null);
  const [hotelForm, setHotelForm] = useState<Partial<HotelDoc>>({
    status: "active",
    taxType: "exclusive",
  });

  // add/edit room
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomForm, setRoomForm] = useState<Partial<RoomDoc>>({});

  const selectedHotel = useMemo(
    () => hotels.find((h) => h.id === selectedHotelId) || null,
    [hotels, selectedHotelId]
  );

  // ✅ load lookups
  useEffect(() => {
    const unsubCities = onSnapshot(query(citiesCol, orderBy("name", "asc")), (snap) => {
      setCities(
        snap.docs
          .map((d) => ({ id: d.id, name: String((d.data() as any)?.name || "").trim() }))
          .filter((x) => x.name)
      );
    });

    const unsubPT = onSnapshot(paymentTermsCol, (snap) => {
      setPaymentTerms(
        snap.docs
          .map((d) => String((d.data() as any)?.name || "").trim())
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b))
      );
    });

    const unsubTax = onSnapshot(taxCol, (snap) => {
      setTaxes(
        snap.docs
          .map((d) => ({
            id: d.id,
            name: String((d.data() as any)?.name || "").trim(),
            percent: Number((d.data() as any)?.percent ?? 0),
          }))
          .filter((x) => x.name)
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    });

    return () => {
      unsubCities();
      unsubPT();
      unsubTax();
    };
  }, []);

  // ✅ load hotels (and roomsCount via subcollection size read when selected)
  useEffect(() => {
    return onSnapshot(query(hotelsCol, orderBy("hotelName", "asc")), async (snap) => {
      const raw = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as any[];

      // Ensure cityName fallback from stored field
      const mapped: HotelDoc[] = raw.map((x) => ({
        id: x.id,
        cityId: String(x.cityId || ""),
        cityName: String(x.cityName || ""),
        hotelName: String(x.hotelName || x.name || ""),
        address: String(x.address || ""),
        locationLink: String(x.locationLink || ""),
        contactPerson: String(x.contactPerson || ""),
        contactNo: String(x.contactNo || ""),
        email: String(x.email || ""),
        status: (x.status as any) || "active",
        paymentTerm: String(x.paymentTerm || ""),
        taxType: (x.taxType as any) || "exclusive",
        servicesOffered: String(x.servicesOffered || ""),
        createdAt: x.createdAt,
        updatedAt: x.updatedAt,
        roomsCount: Number(x.roomsCount ?? 0),
      }));

      setHotels(mapped);

      // if selected hotel was deleted
      if (selectedHotelId && !mapped.some((h) => h.id === selectedHotelId)) {
        setSelectedHotelId(null);
        setRooms([]);
      }
    });
  }, [selectedHotelId]);

  // ✅ load rooms for selected hotel
  useEffect(() => {
    if (!selectedHotelId) {
      setRooms([]);
      return;
    }

    const roomsCol = collection(
      db,
      "Panels",
      PANEL_ID,
      "Travel",
      "Hotels",
      "items",
      selectedHotelId,
      "rooms"
    );

    return onSnapshot(roomsCol, (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .map((r: any) => ({
          id: r.id,
          checkInTime: String(r.checkInTime || ""),
          checkOutTime: String(r.checkOutTime || ""),
          roomType: String(r.roomType || "Standard"),
          stayType: String(r.stayType || "BB"),


          rate: Number(r.rate ?? 0),
          taxId: String(r.taxId || ""),
          taxLabel: String(r.taxLabel || ""),
          taxPercent: Number(r.taxPercent ?? 0),
          roomDetails: String(r.roomDetails || ""),
          rateStartDate: String(r.rateStartDate || ""),
          rateEndDate: String(r.rateEndDate || ""),
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })) as RoomDoc[];

      // sort: by roomType then by start date
      list.sort((a, b) => {
        const rt = a.roomType.localeCompare(b.roomType);
        if (rt !== 0) return rt;
        return String(a.rateStartDate || "").localeCompare(String(b.rateStartDate || ""));
      });

      setRooms(list);

      // update roomsCount on hotel doc (admin helpful)
      const hotelRef = doc(db, "Panels", PANEL_ID, "Travel", "Hotels", "items", selectedHotelId);
      updateDoc(hotelRef, { roomsCount: list.length }).catch(() => { });
    });
  }, [selectedHotelId]);

  // ✅ filtered hotels (client-side)
  const filteredHotels = useMemo(() => {
    const term = qText.trim().toLowerCase();

    return hotels.filter((h) => {
      const matchText =
        !term ||
        h.hotelName.toLowerCase().includes(term) ||
        h.cityName.toLowerCase().includes(term);

      const matchCity = !filterCityId || h.cityId === filterCityId;
      const matchStatus = !filterStatus || h.status === filterStatus;
      const matchPay = !filterPaymentTerm || h.paymentTerm === filterPaymentTerm;

      return matchText && matchCity && matchStatus && matchPay;
    });
  }, [hotels, qText, filterCityId, filterStatus, filterPaymentTerm]);

  // ========= Hotel Form Helpers =========
  const openAddHotel = () => {
    setEditingHotelId(null);
    setHotelForm({
      status: "active",
      taxType: "exclusive",
      cityId: "",
      cityName: "",
      hotelName: "",
      address: "",
      locationLink: "",
      contactPerson: "",
      contactNo: "",
      email: "",
      paymentTerm: "",
      servicesOffered: "",
    });
    setShowHotelForm(true);
  };

  const openEditHotel = (h: HotelDoc) => {
    setEditingHotelId(h.id);
    setHotelForm({ ...h });
    setShowHotelForm(true);
  };

  const closeHotelForm = () => {
    setShowHotelForm(false);
    setEditingHotelId(null);
  };

const saveHotel = async () => {
  const cityId = String(hotelForm.cityId || "").trim();
  const cityName =
    cityOptions.find((c) => c.id === cityId)?.name || String(hotelForm.cityName || "");

  const hotelName = String(hotelForm.hotelName || "").trim();
  const address = String(hotelForm.address || "").trim();
  const locationLink = String(hotelForm.locationLink || "").trim();
  const contactPerson = String(hotelForm.contactPerson || "").trim();
  const contactNo = String(hotelForm.contactNo || "").trim();
  const email = String(hotelForm.email || "").trim();
  const status = (hotelForm.status as HotelStatus) || "active";
  const paymentTerm = String(hotelForm.paymentTerm || "").trim();
  const taxType = (hotelForm.taxType as TaxType) || "exclusive";
  const servicesOffered = String(hotelForm.servicesOffered || "").trim();

  // Image upload logic (if an image is selected)
  let imageUrl = "";
  if (imageFile) {
    try {
      imageUrl = await uploadImageToCloudinary(imageFile); // Upload to Cloudinary
    } catch (error) {
      alert("Image upload failed");
      return; // Stop further execution if upload fails
    }
  }

  if (!cityId) return alert("City is required");
  if (!hotelName) return alert("Hotel Name is required");
  if (!isValidUrlLike(locationLink)) return alert("Location link must start with http/https");
  if (!isValidEmailLike(email)) return alert("Email looks invalid");

  // ✅ If Cities table is empty, fallback to Pakistan Cities JSON
  const payload: any = {
    cityId,
    cityName,
    hotelName,
    address,
    locationLink,
    contactPerson,
    contactNo,
    email,
    status,
    paymentTerm,
    taxType,
    servicesOffered,
    updatedAt: serverTimestamp(),
  };

  // Only add imageUrl if it's defined
  if (imageUrl) {
    payload.imageUrl = imageUrl; // Add the image URL to the payload
  }

  if (!editingHotelId) {
    const id = makeId();
    await setDoc(doc(hotelsCol, id), {
      ...payload,
      roomsCount: 0,
      createdAt: serverTimestamp(),
    });
    setSelectedHotelId(id);
  } else {
    await setDoc(doc(hotelsCol, editingHotelId), payload, { merge: true });
  }

  closeHotelForm();
};


  const removeHotel = async (hotelId: string) => {
    const ok = confirm("Delete this hotel and all its rooms?");
    if (!ok) return;

    const hotelRef = doc(db, "Panels", PANEL_ID, "Travel", "Hotels", "items", hotelId);
    const roomsCol = collection(db, "Panels", PANEL_ID, "Travel", "Hotels", "items", hotelId, "rooms");

    const snap = await getDocs(roomsCol);
    const batch = writeBatch(db);

    snap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(hotelRef);

    await batch.commit();

    if (selectedHotelId === hotelId) {
      setSelectedHotelId(null);
      setRooms([]);
    }
  };

  // ========= Room Form Helpers =========
  const openAddRoom = () => {
    if (!selectedHotelId) return alert("Select a hotel first");
    setEditingRoomId(null);
    setRoomForm({
      checkInTime: "",
      checkOutTime: "",
      roomType: roomTypeOptions[0] || "Standard",
      stayType: stayTypeOptions[0]?.value || "BB",
      rate: 0,
      taxId: "",
      taxLabel: "",
      taxPercent: 0,
      roomDetails: "",
      rateStartDate: "",
      rateEndDate: "",
    });
    setShowRoomForm(true);
  };


  const openEditRoom = (r: RoomDoc) => {
    setEditingRoomId(r.id);
    setRoomForm({ ...r });
    setShowRoomForm(true);
  };

  const closeRoomForm = () => {
    setShowRoomForm(false);
    setEditingRoomId(null);
  };

  const saveRoom = async () => {
    if (!selectedHotelId) return;

    const checkInTime = String(roomForm.checkInTime || "").trim();
    const checkOutTime = String(roomForm.checkOutTime || "").trim();

    const roomType = String(roomForm.roomType || "").trim() || (roomTypeOptions[0] || "Standard");
    const stayType = String(roomForm.stayType || "").trim() || (stayTypeOptions[0]?.value || "BB");



    const rate = Number(roomForm.rate ?? 0) || 0;

    const taxId = String(roomForm.taxId || "").trim();
    const tax = taxes.find((t) => t.id === taxId);

    const roomDetails = String(roomForm.roomDetails || "").trim();

    const rateStartDate = String(roomForm.rateStartDate || "").trim();
    const rateEndDate = String(roomForm.rateEndDate || "").trim();

    // required checks (keep them simple)
    if (!checkInTime) return alert("Check-in time is required");
    if (!checkOutTime) return alert("Check-out time is required");
    if (!roomType) return alert("Room Type is required");
    if (!stayType) return alert("Stay Type is required");
    if (!rateStartDate) return alert("Rate Start Date is required");
    if (!rateEndDate) return alert("Rate End Date is required");

    if (rateEndDate < rateStartDate) return alert("Rate End Date must be after Start Date");

    const payload = {
      checkInTime,
      checkOutTime,
      roomType,
      stayType,
      rate,
      taxId: taxId || "",
      taxLabel: tax?.name || String(roomForm.taxLabel || ""),
      taxPercent: Number(tax?.percent ?? roomForm.taxPercent ?? 0),
      roomDetails,
      rateStartDate,
      rateEndDate,

      updatedAt: serverTimestamp(),
    };

    const roomsCol = collection(
      db,
      "Panels",
      PANEL_ID,
      "Travel",
      "Hotels",
      "items",
      selectedHotelId,
      "rooms"
    );

    if (!editingRoomId) {
      const id = makeId();
      await setDoc(doc(roomsCol, id), { ...payload, createdAt: serverTimestamp() }, { merge: true });
    } else {
      await setDoc(doc(roomsCol, editingRoomId), payload, { merge: true });
    }

    closeRoomForm();
  };

  const removeRoom = async (roomId: string) => {
    if (!selectedHotelId) return;
    const ok = confirm("Delete this room rate?");
    if (!ok) return;

    const roomRef = doc(
      db,
      "Panels",
      PANEL_ID,
      "Travel",
      "Hotels",
      "items",
      selectedHotelId,
      "rooms",
      roomId
    );

    await runTransaction(db, async (tx) => {
      tx.delete(roomRef);
    });
  };


  // ========= UI =========
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Travel</h2>
        <TravelTabs />
      </div>

      {/* ===================== TOP BAR: SEARCH + ADD ===================== */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by Hotel Name or City…"
              value={qText}
              onChange={(e) => setQText(e.target.value)}
            />
          </div>

          <Button onClick={openAddHotel} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Hotel
          </Button>
        </div>

        {/* ===================== FILTERS ROW ===================== */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <select
              value={filterCityId}
              onChange={(e) => setFilterCityId(e.target.value)}
              className="w-full border rounded-md pl-9 pr-3 py-2 text-sm bg-white"
            >
              <option value="">All Cities</option>
              {cityOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

          </div>

          <div className="relative">
            <BadgeCheck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full border rounded-md pl-9 pr-3 py-2 text-sm bg-white"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="relative">
            <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <select
              value={filterPaymentTerm}
              onChange={(e) => setFilterPaymentTerm(e.target.value)}
              className="w-full border rounded-md pl-9 pr-3 py-2 text-sm bg-white"
            >
              <option value="">All Payment Terms</option>
              {paymentTerms.map((t, i) => (
                <option key={i} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              setQText("");
              setFilterCityId("");
              setFilterStatus("");
              setFilterPaymentTerm("");
            }}
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* ===================== HOTELS GRID ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* LEFT: Hotels list */}
        <div className="lg:col-span-1 space-y-3">
          {filteredHotels.length === 0 ? (
            <Card className="p-4 text-sm text-muted-foreground">No hotels found.</Card>
          ) : (
            filteredHotels.map((h) => {
              const isActive = h.status === "active";
              const isSelected = selectedHotelId === h.id;

              return (
                <Card
                  key={h.id}
                  className={cn(
                    "p-4 cursor-pointer hover:shadow-sm transition",
                    isSelected && "ring-1 ring-black/10"
                  )}
                  onClick={() => setSelectedHotelId(h.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div className="font-semibold text-sm truncate">{h.hotelName}</div>
                      </div>

                      <div className="mt-1 flex flex-wrap gap-2">
                        {tinyChip(<MapPin className="h-3 w-3" />, h.cityName || "—")}
                        {tinyChip(
                          isActive ? <BadgeCheck className="h-3 w-3" /> : <BadgeX className="h-3 w-3" />,
                          isActive ? "Active" : "Inactive"
                        )}
                        {tinyChip(<BedDouble className="h-3 w-3" />, `${Number(h.roomsCount ?? 0)} rooms`)}
                      </div>

                      {h.paymentTerm ? (
                        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                          <CreditCard className="h-3.5 w-3.5" />
                          <span className="truncate">{h.paymentTerm}</span>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditHotel(h);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeHotel(h.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* RIGHT: Selected hotel details + rooms */}
        <div className="lg:col-span-2 space-y-3">
          {!selectedHotel ? (
            <Card className="p-6 text-sm text-muted-foreground">
              Select a hotel from the left to manage details and rooms.
            </Card>
          ) : (
            <>
              {/* Hotel Detail */}
              <Card className="p-4">

                <div className="flex flex-col md:flex-row md:items-start gap-3 md:justify-between">



                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div className="text-lg font-semibold">{selectedHotel.hotelName}</div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {tinyChip(<MapPin className="h-3 w-3" />, selectedHotel.cityName)}
                      {tinyChip(
                        selectedHotel.status === "active" ? (
                          <BadgeCheck className="h-3 w-3" />
                        ) : (
                          <BadgeX className="h-3 w-3" />
                        ),
                        selectedHotel.status === "active" ? "Active" : "Inactive"
                      )}
                      {selectedHotel.taxType
                        ? tinyChip(<Receipt className="h-3 w-3" />, `Tax: ${selectedHotel.taxType}`)
                        : null}
                      {selectedHotel.paymentTerm
                        ? tinyChip(<CreditCard className="h-3 w-3" />, selectedHotel.paymentTerm)
                        : null}
                    </div>

                    {selectedHotel.address ? (
                      <div className="text-sm text-muted-foreground flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5" />
                        <span>{selectedHotel.address}</span>
                      </div>
                    ) : null}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      {selectedHotel.contactPerson ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span className="text-foreground">{selectedHotel.contactPerson}</span>
                        </div>
                      ) : null}

                      {selectedHotel.contactNo ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span className="text-foreground">{selectedHotel.contactNo}</span>
                        </div>
                      ) : null}

                      {selectedHotel.email ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span className="text-foreground">{selectedHotel.email}</span>
                        </div>
                      ) : null}
                    </div>

                    {selectedHotel.locationLink ? (
                      <div className="text-sm flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                        <a
                          className="text-blue-600 hover:underline break-all"
                          href={selectedHotel.locationLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Google Maps
                        </a>
                      </div>
                    ) : null}
                  </div>

{/* Hotel Image */}
{selectedHotel?.imageUrl ? (
  <img
    src={selectedHotel.imageUrl}
    alt={selectedHotel.hotelName}
    className="w-full h-full object-cover"
    loading="lazy"
  />
) : (
  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
    No image available
  </div>
)}

                  {/* Map preview */}
                  <div className="w-full md:w-[340px]">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      Map Preview
                    </div>
                    <div className="w-full h-[220px] rounded-md overflow-hidden border bg-muted">
                      {selectedHotel.locationLink && isValidUrlLike(selectedHotel.locationLink) ? (
                        <iframe
                          title="map"
                          className="w-full h-full"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          // NOTE: For Google Maps *link* we can still try to load it.
                          // Best practice is to store "embed" URL, but you asked for normal link.
                          // This works for many shared links; if some don't render, store embed links.
                          src={selectedHotel.locationLink}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          Add a Google Maps link to preview
                        </div>
                      )}
                    </div>
                  </div>



                </div>

                {/* Services Offered */}
                {selectedHotel.servicesOffered ? (
                  <div className="mt-4">
                    <div className="text-xs font-semibold text-gray-700 flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4" />
                      Services Offered (General)
                    </div>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedHotel.servicesOffered}
                    </div>
                  </div>
                ) : null}
              </Card>

              {/* Rooms */}
              <Card className="p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
                  <div className="flex items-center gap-2">
                    <BedDouble className="h-5 w-5 text-muted-foreground" />
                    <div className="font-semibold">Rooms & Rates</div>
                    <span className="text-xs text-muted-foreground">
                      ({rooms.length} {rooms.length === 1 ? "item" : "items"})
                    </span>
                  </div>

                  <Button onClick={openAddRoom} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Room
                  </Button>
                </div>

                <div className="mt-3 overflow-auto border rounded-md bg-white">
                  <table className="min-w-[1200px] w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">Check-in</th>
                        <th className="p-2 text-left">Check-out</th>
                        <th className="p-2 text-left">Room Type</th>
                        <th className="p-2 text-left">Stay Type</th>
                        <th className="p-2 text-right">Rate</th>
                        <th className="p-2 text-left">Tax</th>
                        <th className="p-2 text-left">Start</th>
                        <th className="p-2 text-left">End</th>
                        <th className="p-2 text-left">Details</th>
                        <th className="p-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rooms.length === 0 ? (
                        <tr>
                          <td className="p-3 text-muted-foreground" colSpan={10}>
                            No rooms added yet.
                          </td>
                        </tr>
                      ) : (
                        rooms.map((r) => (
                          <tr key={r.id} className="border-t">
                            <td className="p-2">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {r.checkInTime}
                              </span>
                            </td>
                            <td className="p-2">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {r.checkOutTime}
                              </span>
                            </td>
                            <td className="p-2 font-medium">{r.roomType}</td>
                            <td className="p-2">{r.stayType}</td>
                            <td className="p-2 text-right tabular-nums">{Number(r.rate || 0).toLocaleString()}</td>
                            <td className="p-2">
                              {r.taxId ? `${r.taxLabel} (${Number(r.taxPercent ?? 0)}%)` : "—"}
                            </td>
                            <td className="p-2">
                              <span className="inline-flex items-center gap-1">
                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                {r.rateStartDate || "—"}
                              </span>
                            </td>
                            <td className="p-2">
                              <span className="inline-flex items-center gap-1">
                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                {r.rateEndDate || "—"}
                              </span>
                            </td>
                            <td className="p-2 max-w-[420px]">
                              <div className="line-clamp-2 text-muted-foreground">{r.roomDetails || "—"}</div>
                            </td>
                            <td className="p-2 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1"
                                  onClick={() => openEditRoom(r)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  Edit
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => removeRoom(r.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-2 text-[11px] text-muted-foreground">
                  Tip: Add separate rows for different date ranges (seasonal pricing).
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* ===================== HOTEL FORM (ADD/EDIT) ===================== */}
      {showHotelForm ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-3">
          <Card className="w-full max-w-3xl p-4 md:p-5 rounded-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div className="font-semibold">
                  {editingHotelId ? "Edit Hotel" : "Add New Hotel"}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={closeHotelForm} className="gap-2">
                <X className="h-4 w-4" />
                Close
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* City */}
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" /> City *
                </div>
                <select
                  value={String(hotelForm.cityId || "")}
                  onChange={(e) => {
                    const id = e.target.value;
                    const name = cityOptions.find((c) => c.id === id)?.name || "";
                    setHotelForm((p) => ({ ...p, cityId: id, cityName: name }));
                  }}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                >
                  <option value="">Select City *</option>
                  {cityOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

              </div>

              {/* Hotel Name */}
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5" /> Hotel Name *
                </div>
                <Input
                  placeholder="e.g., Marriott Karachi"
                  value={String(hotelForm.hotelName || "")}
                  onChange={(e) => setHotelForm((p) => ({ ...p, hotelName: e.target.value }))}
                />
              </div>

              {/* Address */}
              <div className="space-y-1 md:col-span-2">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" /> Address
                </div>
                <Input
                  placeholder="Full address"
                  value={String(hotelForm.address || "")}
                  onChange={(e) => setHotelForm((p) => ({ ...p, address: e.target.value }))}
                />
              </div>

              {/* Upload Image */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" /> Upload Image
                </label>
                <input
                  type="file"
                  accept="image/*" // Allows only image files
                  onChange={handleImageChange}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                />
              </div>




              {/* Location Link */}
              <div className="space-y-1 md:col-span-2">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Link2 className="h-3.5 w-3.5" /> Location link (Google Maps)
                </div>
                <Input
                  placeholder="https://maps.google.com/..."
                  value={String(hotelForm.locationLink || "")}
                  onChange={(e) => setHotelForm((p) => ({ ...p, locationLink: e.target.value }))}
                />
                <div className="text-[11px] text-muted-foreground">
                  If the map preview doesn’t load for some links, save an “embed” link next time.
                </div>
              </div>

              {/* Contact Person */}
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <User className="h-3.5 w-3.5" /> Contact Person at Hotel
                </div>
                <Input
                  placeholder="Name"
                  value={String(hotelForm.contactPerson || "")}
                  onChange={(e) => setHotelForm((p) => ({ ...p, contactPerson: e.target.value }))}
                />
              </div>

              {/* Contact No */}
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" /> Contact No
                </div>
                <Input
                  placeholder="+92..."
                  value={String(hotelForm.contactNo || "")}
                  onChange={(e) => setHotelForm((p) => ({ ...p, contactNo: e.target.value }))}
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" /> Email ID
                </div>
                <Input
                  placeholder="hotel@domain.com"
                  value={String(hotelForm.email || "")}
                  onChange={(e) => setHotelForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>

              {/* Status */}
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <BadgeCheck className="h-3.5 w-3.5" /> Status
                </div>
                <select
                  value={String(hotelForm.status || "active")}
                  onChange={(e) => setHotelForm((p) => ({ ...p, status: e.target.value as any }))}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Payment Terms */}
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <CreditCard className="h-3.5 w-3.5" /> Payment Terms
                </div>
                <select
                  value={String(hotelForm.paymentTerm || "")}
                  onChange={(e) => setHotelForm((p) => ({ ...p, paymentTerm: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                >
                  <option value="">Select Payment Terms</option>
                  {paymentTerms.map((t, i) => (
                    <option key={i} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tax Type */}
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Receipt className="h-3.5 w-3.5" /> Tax Type
                </div>
                <select
                  value={String(hotelForm.taxType || "exclusive")}
                  onChange={(e) => setHotelForm((p) => ({ ...p, taxType: e.target.value as any }))}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                >
                  <option value="inclusive">Inclusive</option>
                  <option value="exclusive">Exclusive</option>
                </select>
              </div>

              {/* Services Offered */}
              <div className="space-y-1 md:col-span-2">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" /> Services Offered (General)
                </div>
                <textarea
                  value={String(hotelForm.servicesOffered || "")}
                  onChange={(e) => setHotelForm((p) => ({ ...p, servicesOffered: e.target.value }))}
                  placeholder="Write detailed services, notes, inclusions, policies…"
                  className="w-full min-h-[110px] border rounded-md px-3 py-2 text-sm bg-white"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={closeHotelForm}>
                Cancel
              </Button>
              <Button onClick={saveHotel} className="gap-2">
                <Save className="h-4 w-4" />
                Save Hotel
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      {/* ===================== ROOM FORM (ADD/EDIT) ===================== */}
      {showRoomForm ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-3">
          <Card className="w-full max-w-3xl p-4 md:p-5 rounded-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BedDouble className="h-5 w-5 text-muted-foreground" />
                <div className="font-semibold">{editingRoomId ? "Edit Room" : "Add Room"}</div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm text-muted-foreground truncate">
                  {selectedHotel?.hotelName} • {selectedHotel?.cityName}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={closeRoomForm} className="gap-2">
                <X className="h-4 w-4" />
                Close
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" /> Check-in Time *
                  </div>
                  <Input
                    type="time"
                    value={String(roomForm.checkInTime || "")}
                    onChange={(e) => setRoomForm((p) => ({ ...p, checkInTime: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" /> Check-out Time *
                  </div>
                  <Input
                    type="time"
                    value={String(roomForm.checkOutTime || "")}
                    onChange={(e) => setRoomForm((p) => ({ ...p, checkOutTime: e.target.value }))}
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-1 md:col-span-2">
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <BedDouble className="h-3.5 w-3.5" /> Room Type *
                  </div>
                  <select
                    value={String(roomForm.roomType || roomTypeOptions[0] || "")}
                    onChange={(e) => setRoomForm((p) => ({ ...p, roomType: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                  >
                    {roomTypeOptions.map((rt) => (
                      <option key={rt} value={rt}>
                        {rt}
                      </option>
                    ))}
                  </select>

                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Receipt className="h-3.5 w-3.5" /> Stay Type *
                  </div>
                  <select
                    value={String(roomForm.stayType || stayTypeOptions[0]?.value || "")}
                    onChange={(e) => setRoomForm((p) => ({ ...p, stayType: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                  >
                    {stayTypeOptions.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>

                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5" /> Rate *
                  </div>
                  <Input
                    inputMode="decimal"
                    placeholder="0"
                    value={String(roomForm.rate ?? "")}
                    onChange={(e) => setRoomForm((p) => ({ ...p, rate: toNum(e.target.value) }))}
                  />
                </div>
              </div>

              {/* Tax dropdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Receipt className="h-3.5 w-3.5" /> Tax (from table)
                  </div>
                  <select
                    value={String(roomForm.taxId || "")}
                    onChange={(e) => {
                      const id = e.target.value;
                      const t = taxes.find((x) => x.id === id);
                      setRoomForm((p) => ({
                        ...p,
                        taxId: id,
                        taxLabel: t?.name || "",
                        taxPercent: Number(t?.percent ?? 0),
                      }));
                    }}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Select Tax (optional)</option>
                    {taxes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({Number(t.percent ?? 0)}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Receipt className="h-3.5 w-3.5" /> Hotel Tax Type (read-only)
                  </div>
                  <div className="w-full border rounded-md px-3 py-2 text-sm bg-muted text-muted-foreground">
                    {selectedHotel?.taxType ? `${selectedHotel.taxType}` : "—"}
                  </div>
                </div>
              </div>

              {/* Row 3: Details */}
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" /> Room Details (Services Included / Memo)
                </div>
                <textarea
                  value={String(roomForm.roomDetails || "")}
                  onChange={(e) => setRoomForm((p) => ({ ...p, roomDetails: e.target.value }))}
                  placeholder="e.g., breakfast included, Wi-Fi, cancellation policy, extra bed, view…"
                  className="w-full min-h-[110px] border rounded-md px-3 py-2 text-sm bg-white"
                />
              </div>

              {/* Row 4: Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5" /> Rate Start Date *
                  </div>
                  <Input
                    type="date"
                    value={String(roomForm.rateStartDate || "")}
                    onChange={(e) => setRoomForm((p) => ({ ...p, rateStartDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5" /> Rate End Date *
                  </div>
                  <Input
                    type="date"
                    value={String(roomForm.rateEndDate || "")}
                    onChange={(e) => setRoomForm((p) => ({ ...p, rateEndDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <Button variant="outline" onClick={closeRoomForm}>
                Cancel
              </Button>

              <div className="flex items-center gap-2">
                <Button onClick={saveRoom} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Room
                </Button>

                {/* after save, add new room (optional quick flow) */}
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={async () => {
                    await saveRoom();
                    // only reopen fresh form if we were adding (not editing)
                    if (!editingRoomId) openAddRoom();
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Save & Add New
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
