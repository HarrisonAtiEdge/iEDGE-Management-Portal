"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card } from "@/components/ui/card";

const PANEL_ID = "IEDGE-SYSTEM";

type Guest = { firstName: string; lastName: string; cnic?: string };
type Booking = {
  id: string;

  hotelId?: string;
  hotelName?: string;

  roomType?: string;
  stayType?: string;
  rate?: number;

  checkIn?: string;
  checkOut?: string;

  guests: Guest[];
  contact: { phone?: string; email?: string };
  extras: { [key: string]: boolean };

  clientId?: string;
  clientName?: string;

  projectOwnerName?: string;

  status?: string;
  createdAt?: any;
  createdBy?: string;

  estimateId?: string;
  estimateNo?: string;
};

function nightsBetween(checkIn?: string, checkOut?: string) {
  if (!checkIn || !checkOut) return 0;
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  const ms = b.getTime() - a.getTime();
  const n = Math.round(ms / (1000 * 60 * 60 * 24));
  return n > 0 ? n : 1;
}

function money(n?: number) {
  const x = Number(n || 0);
  return x.toLocaleString(undefined, { minimumFractionDigits: 0 });
}

function StatusPill({ status }: { status?: string }) {
  const s = (status || "pending").toLowerCase();
  const cls =
    s === "pending"
      ? "bg-yellow-100 text-yellow-800 border-yellow-300"
      : s === "approved"
        ? "bg-green-100 text-green-800 border-green-300"
        : s === "rejected"
          ? "bg-red-100 text-red-800 border-red-300"
          : "bg-gray-100 text-gray-800 border-gray-300";

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold border ${cls}`}
    >
      {status || "pending"}
    </span>
  );
}

function SkeletonCard() {
  return (
    <Card className="p-4">
      <div className="animate-pulse space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="h-3 bg-muted rounded w-2/3" />
          </div>
          <div className="h-6 bg-muted rounded w-24" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="h-12 bg-muted rounded" />
          <div className="h-12 bg-muted rounded" />
          <div className="h-12 bg-muted rounded" />
        </div>

        <div className="h-16 bg-muted rounded" />
      </div>
    </Card>
  );
}

export default function BookingPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "Panels", PANEL_ID, "Travel", "HotelRequests", "items"),
      orderBy("createdAt", "desc"),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const result = snap.docs.map((d) => {
          const data = d.data() as any;

          return {
            id: d.id,
            ...data,
            guests: Array.isArray(data.guests) ? data.guests : [],
            contact: data.contact ?? { phone: "", email: "" },
            extras: data.extras ?? {},
            status: data.status ?? "pending",
            estimateNo: data.estimateNo ?? "",
            estimateId: data.estimateId ?? "",
          } as Booking;
        });

        setBookings(result);
        setLoading(false);
      },
      (err) => {
        console.error("Bookings snapshot error:", err);
        setLoading(false);
      },
    );

    return () => unsub();
  }, []);

  const skeletonCount = 4;

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-semibold">Hotel Bookings</h1>

      {/* ✅ No layout shift: show skeleton cards instead of "Loading..." text */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && bookings.length === 0 && <div>No bookings yet.</div>}

      {!loading &&
        bookings.map((b) => {
          const nights = nightsBetween(b.checkIn, b.checkOut);
          const rate = Number(b.rate || 0);
          const total = nights * rate;

          const extrasTrue = Object.entries(b.extras || {})
            .filter(([, v]) => !!v)
            .map(([k]) => k);

          const guestNames = (b.guests || [])
            .map((g) => `${g.firstName} ${g.lastName}`.trim())
            .filter(Boolean);

          return (
            <Card key={b.id} className="p-4 space-y-3">
              {/* Top Row */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-base">
                      {b.hotelName || "—"}
                    </h2>

                    {/* ✅ Show estimateNo */}
                    {b.estimateNo ? (
                      <span className="text-xs px-2 py-1 rounded bg-black text-white">
                        {b.estimateNo}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                        No Estimate No
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {b.roomType || "—"} • {b.stayType || "—"}
                  </div>

                  <div className="text-sm">
                    <span className="font-medium">Dates:</span>{" "}
                    {b.checkIn || "—"} → {b.checkOut || "—"}{" "}
                    {nights ? (
                      <span className="text-muted-foreground">
                        ({nights} night{nights > 1 ? "s" : ""})
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="text-right">
                  <StatusPill status={b.status} />
                </div>
              </div>

              {/* Middle Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="border rounded p-3">
                  <div className="text-xs text-muted-foreground">Client</div>
                  <div className="font-medium">{b.clientName || "—"}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Project Owner
                  </div>
                  <div className="font-medium">{b.projectOwnerName || "—"}</div>
                </div>

                <div className="border rounded p-3">
                  <div className="text-xs text-muted-foreground">Contact</div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>{" "}
                    {b.contact?.phone || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>{" "}
                    {b.contact?.email || "—"}
                  </div>
                </div>

                <div className="border rounded p-3">
                  <div className="text-xs text-muted-foreground">Cost</div>
                  <div>
                    <span className="text-muted-foreground">Rate:</span> PKR{" "}
                    {money(rate)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total:</span>{" "}
                    <span className="font-semibold">PKR {money(total)}</span>
                  </div>
                </div>
              </div>

              {/* Guests */}
              <div className="border rounded p-3 text-sm space-y-2">
                <div className="text-xs text-muted-foreground">Guests</div>

                {guestNames.length ? (
                  <>
                    <div className="font-medium">{guestNames.join(", ")}</div>

                    {/* show CNICs (optional) */}
                    <div className="text-xs text-muted-foreground">
                      {(b.guests || [])
                        .map((g, idx) => {
                          const name = `${g.firstName} ${g.lastName}`.trim();
                          const cnic = (g.cnic || "").trim();
                          if (!name) return null;
                          return `${idx + 1}) ${name}${cnic ? ` — CNIC: ${cnic}` : ""}`;
                        })
                        .filter(Boolean)
                        .join(" | ")}
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground">—</div>
                )}
              </div>

              {/* Extras */}
              <div className="border rounded p-3 text-sm">
                <div className="text-xs text-muted-foreground mb-1">Extras</div>
                {extrasTrue.length ? (
                  <div className="flex flex-wrap gap-2">
                    {extrasTrue.map((x) => (
                      <span
                        key={x}
                        className="text-xs px-2 py-1 rounded bg-muted"
                      >
                        {x}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground">No extras</div>
                )}
              </div>
            </Card>
          );
        })}
    </div>
  );
}
