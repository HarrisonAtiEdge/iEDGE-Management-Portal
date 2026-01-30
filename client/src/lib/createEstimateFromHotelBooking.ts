import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

const PANEL_ID = "IEDGE-SYSTEM";

const ymd = (d = new Date()) => d.toISOString().slice(0, 10);

const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return ymd(d);
};

const calcNights = (checkIn: string, checkOut: string) => {
  const a = new Date(checkIn).getTime();
  const b = new Date(checkOut).getTime();
  const n = Math.ceil((b - a) / (1000 * 60 * 60 * 24));
  return Number.isFinite(n) && n > 0 ? n : 1;
};

const makeRowId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `row_${Date.now()}_${Math.random().toString(16).slice(2)}`;

// ---- helpers for tax ----
function toNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function calcTaxFromSubtotal(
  subtotal: number,
  taxPercent: number,
  taxType: string,
) {
  const p = toNum(taxPercent);
  if (!p || !subtotal) return 0;

  if (taxType === "inclusive") {
    // tax portion inside subtotal
    const base = subtotal / (1 + p / 100);
    return subtotal - base;
  }

  // exclusive default
  return subtotal * (p / 100);
}

export async function createEstimateFromHotelBooking(input: {
  hotel: {
    id: string;
    hotelName: string;
    cityId: string;
    cityName?: string;
    address: string;
    // some setups store taxType at hotel-level
    taxType?: "none" | "inclusive" | "exclusive";
  };
  room: {
    id: string;
    roomType: string;
    stayType: string;
    rate: number;

    // if you already pass these from room doc, great:
    taxType?: "none" | "inclusive" | "exclusive";
    taxPercent?: number;
    taxId?: string;
    taxLabel?: string;
  };
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
}) {
  const uid = auth.currentUser?.uid || "";

  const nights = calcNights(input.checkIn, input.checkOut);
  const subtotal = (toNum(input.room.rate) || 0) * nights;

  // 1) --- pull tax from ROOM INFO (room doc in Firestore) ---
  // We do this robustly: use passed fields if present, else fetch room doc.
  let roomTaxType: "none" | "inclusive" | "exclusive" =
    (input.room.taxType as any) || (input.hotel.taxType as any) || "none";

  let roomTaxPercent = toNum((input.room as any).taxPercent);
  let roomTaxId = String((input.room as any).taxId || "");
  let roomTaxLabel = String((input.room as any).taxLabel || "");

  try {
    // If tax fields weren’t passed, fetch room doc directly
    if (!roomTaxPercent && !roomTaxId && !roomTaxLabel) {
      const roomRef = doc(
        db,
        "Panels",
        PANEL_ID,
        "Travel",
        "Hotels",
        "items",
        input.hotel.id,
        "rooms",
        input.room.id,
      );

      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists()) {
        const rd: any = roomSnap.data();

        // support multiple possible field names safely
        roomTaxType = (rd?.taxType as any) || roomTaxType || "none";

        roomTaxPercent =
          toNum(rd?.taxPercent) ||
          toNum(rd?.tax) ||
          toNum(rd?.gstPercent) ||
          toNum(rd?.gstSstPercent) ||
          roomTaxPercent;

        roomTaxId = String(rd?.taxId || roomTaxId || "");
        roomTaxLabel = String(
          rd?.taxLabel || rd?.taxName || roomTaxLabel || "",
        );
      }
    }
  } catch {
    // ignore fetch issues; keep defaults
  }

  // You want label shown as GST + SST
  const displayTaxLabel =
    roomTaxPercent > 0 && roomTaxType !== "none" ? "GST + SST" : "";

  // Estimate-level tax
  const tax = calcTaxFromSubtotal(subtotal, roomTaxPercent, roomTaxType);
  const whtTotal = 0;
  const total = subtotal + (roomTaxType === "exclusive" ? tax : 0) + whtTotal;

  // 2) --- pick Terms doc specifically for Travel & Tours ---
  // Adjust these filters to your actual fields (name/category/company/department).
  let termsConditionId = "";
  let termsConditionTitle = "";
  let termsConditionText = "";
  try {
    const tcSnap = await getDocs(
      query(
        collection(db, "Panels", PANEL_ID, "termsConditions"),
        // NOTE: If you have a field like company="iEDGE - Travel & Tours", use where() here.
        // Keeping limit(50) then picking best match so it works even without indexes.
        limit(50),
      ),
    );

    const all = tcSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

    // Try to find a travel/tours specific doc
    const best =
      all.find((t) =>
        String(t?.name || "")
          .toLowerCase()
          .includes("travel"),
      ) ||
      all.find((t) =>
        String(t?.category || "")
          .toLowerCase()
          .includes("travel"),
      ) ||
      all.find((t) =>
        String(t?.company || "")
          .toLowerCase()
          .includes("travel"),
      ) ||
      all[0];

    if (best) {
      termsConditionId = best.id;
      termsConditionTitle = String(best?.name || "");
      termsConditionText = String(best?.description || "").replace(
        /\r\n/g,
        "\n",
      );
    }
  } catch {
    // keep empty
  }

  // 3) --- services row (populate tax fields so Tax column & Tax summary show) ---
  const servicesRow = {
    rowId: makeRowId(),
    detail: `Hotel Accommodation - ${input.hotel.hotelName}`,
    description: `Room: ${input.room.roomType} • ${input.room.stayType}
City: ${input.hotel.cityName || input.hotel.cityId}
Address: ${input.hotel.address}
Dates: ${input.checkIn} → ${input.checkOut} (${nights} night(s))
Guests: Adults ${input.adults}, Children ${input.children}`,
    units: nights,
    unitsInput: String(nights),

    rate: toNum(input.room.rate) || 0,
    rateInput: String(toNum(input.room.rate) || 0),

    rateMode: "amount",

    // ✅ tax fields for row so "GST + SST" appears in tax column
    taxType: roomTaxType || "none",
    taxPercent: roomTaxPercent || 0,
    taxLabel: displayTaxLabel, // ✅ forces display as GST + SST
    taxId: roomTaxId || "",

    // keep existing fields your system expects
    taxCategory: displayTaxLabel, // ✅ helps summary in some templates
    whtId: "",
    whtLabel: "",
    whtPercent: 0,
  };

  const estimateBase: any = {
    estimateNo: "", // assigned inside transaction
    client: "", // user fills later
    date: ymd(),
    expiryDate: addDays(7),

    // ✅ project owner should show what user is logged in as
    projectOwner:
      auth.currentUser?.displayName || auth.currentUser?.email || "",
    projectOwnerName:
      auth.currentUser?.displayName || auth.currentUser?.email || "",

    subject: `Hotel Booking Estimate - ${input.hotel.hotelName} (${input.room.roomType})`,
    message: "Auto-created from hotel booking.",
    poNumber: "",
    paymentTerm: "",
    company: "iEDGE - Travel & Tours",
    status: "RFQ Sent",

    // ✅ address should appear
    address: input.hotel.address || "",

    // ✅ remove noisy info that prints HotelId
    info: "",

    // ✅ totals (important for tax summary rendering)
    subTotal: subtotal,
    subtotal: subtotal, // keep both just in case your UI uses lowercase
    tax: tax,
    total: total,

    taxType: roomTaxType || "none",
    taxPercent: roomTaxPercent || 0,
    taxCategory: displayTaxLabel, // ✅ shows “GST + SST” in summary areas
    whtTotal: whtTotal,

    // ✅ services
    services: [servicesRow],

    createdBy: uid,
    withLogo: true,
    approvalReceivedOn: "",

    // terms
    termsConditionId,
    termsConditionTitle,
    termsConditionText,

    // currencies off
    addCurrencies: false,
    usdRate: "",
    euroRate: "",
  };

  // 4) ✅ Estimate number: IE-T&T-20000 and increment
  const { estimateId, estimateNo } = await runTransaction(db, async (tx) => {
    const counterRef = doc(db, "Panels", PANEL_ID, "counters", "estimates");
    const counterSnap = await tx.get(counterRef);

    const lastIssued = Number(
      counterSnap.exists() ? (counterSnap.data() as any)?.current : 19999,
    );
    const nextNumber =
      Number.isFinite(lastIssued) && lastIssued >= 19999
        ? lastIssued + 1
        : 20000;

    tx.set(counterRef, { current: nextNumber }, { merge: true });

    const nextEstimateNo = `IE-T&T-${nextNumber}`;
    const newRef = doc(collection(db, "Panels", PANEL_ID, "estimates"));

    tx.set(newRef, {
      ...estimateBase,
      estimateNo: nextEstimateNo,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { estimateId: newRef.id, estimateNo: nextEstimateNo };
  });

  return { estimateId, estimateNo };
}
