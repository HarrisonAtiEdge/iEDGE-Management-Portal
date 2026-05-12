"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import TravelTabs from "./TravelTabs";
import { Plus, Trash2, Save } from "lucide-react";

const PANEL_ID = "IEDGE-SYSTEM";

const roomTypesCol = collection(
  db,
  "Panels",
  PANEL_ID,
  "Travel",
  "HotelSettings",
  "roomTypes",
);
const stayTypesCol = collection(
  db,
  "Panels",
  PANEL_ID,
  "Travel",
  "HotelSettings",
  "stayTypes",
);

type RoomTypeItem = { id: string; name: string };
type StayTypeItem = { id: string; value: string; label: string };

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Date.now());

export default function HotelSettings() {
  const [roomTypes, setRoomTypes] = useState<RoomTypeItem[]>([]);
  const [stayTypes, setStayTypes] = useState<StayTypeItem[]>([]);

  const [newRoomType, setNewRoomType] = useState("");
  const [newStayValue, setNewStayValue] = useState("");
  const [newStayLabel, setNewStayLabel] = useState("");

  // ✅ Load room types
  useEffect(() => {
    return onSnapshot(query(roomTypesCol, orderBy("name", "asc")), (snap) => {
      setRoomTypes(
        snap.docs
          .map((d) => ({
            id: d.id,
            name: String((d.data() as any)?.name || "").trim(),
          }))
          .filter((x) => x.name),
      );
    });
  }, []);

  // ✅ Load stay types
  useEffect(() => {
    return onSnapshot(query(stayTypesCol, orderBy("value", "asc")), (snap) => {
      setStayTypes(
        snap.docs
          .map((d) => ({
            id: d.id,
            value: String((d.data() as any)?.value || "").trim(),
            label: String((d.data() as any)?.label || "").trim(),
          }))
          .filter((x) => x.value),
      );
    });
  }, []);

  const roomTypeNames = useMemo(
    () => roomTypes.map((r) => r.name.toLowerCase()),
    [roomTypes],
  );
  const stayTypeValues = useMemo(
    () => stayTypes.map((s) => s.value.toUpperCase()),
    [stayTypes],
  );

  const addRoomType = async () => {
    const name = newRoomType.trim();
    if (!name) return alert("Room Type is required");
    if (roomTypeNames.includes(name.toLowerCase()))
      return alert("Room Type already exists");

    const id = makeId();
    await setDoc(doc(roomTypesCol, id), {
      name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setNewRoomType("");
  };

  const deleteRoomType = async (id: string) => {
    const ok = confirm("Delete this room type?");
    if (!ok) return;
    await deleteDoc(doc(roomTypesCol, id));
  };

  const addStayType = async () => {
    const valueRaw = newStayValue.trim();
    const label = newStayLabel.trim();

    if (!valueRaw) return alert("Stay value is required (e.g., BB)");
    const value = valueRaw.toUpperCase();
    if (value.length > 6)
      return alert("Stay value too long (keep it short like BB/HB/FB)");
    if (stayTypeValues.includes(value))
      return alert("Stay Type value already exists");
    if (!label)
      return alert("Stay label is required (e.g., BB - Bed & Breakfast)");

    const id = makeId();
    await setDoc(doc(stayTypesCol, id), {
      value,
      label,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setNewStayValue("");
    setNewStayLabel("");
  };

  const deleteStayType = async (id: string) => {
    const ok = confirm("Delete this stay type?");
    if (!ok) return;
    await deleteDoc(doc(stayTypesCol, id));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold mb-3">Travel Settings</h2>
        <TravelTabs />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* ROOM TYPES */}
        <Card className="p-4 space-y-3">
          <div className="font-semibold">Room Types</div>

          <div className="flex gap-2">
            <Input
              placeholder="e.g., Deluxe"
              value={newRoomType}
              onChange={(e) => setNewRoomType(e.target.value)}
            />
            <Button onClick={addRoomType} className="gap-2">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          <div className="border rounded-md overflow-hidden">
            {roomTypes.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">
                No room types yet.
              </div>
            ) : (
              roomTypes.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-3 py-2 border-t first:border-t-0"
                >
                  <div className="text-sm">{r.name}</div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteRoomType(r.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* STAY TYPES */}
        <Card className="p-4 space-y-3">
          <div className="font-semibold">Stay Types</div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input
              placeholder="Value (e.g., BB)"
              value={newStayValue}
              onChange={(e) => setNewStayValue(e.target.value)}
            />
            <Input
              className="md:col-span-2"
              placeholder="Label (e.g., BB - Bed & Breakfast)"
              value={newStayLabel}
              onChange={(e) => setNewStayLabel(e.target.value)}
            />
          </div>

          <Button onClick={addStayType} className="gap-2">
            <Save className="h-4 w-4" />
            Add Stay Type
          </Button>

          <div className="border rounded-md overflow-hidden">
            {stayTypes.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">
                No stay types yet.
              </div>
            ) : (
              stayTypes.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-3 py-2 border-t first:border-t-0"
                >
                  <div className="text-sm">
                    <span className="font-medium">{s.value}</span> — {s.label}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteStayType(s.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
