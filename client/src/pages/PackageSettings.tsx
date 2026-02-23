"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    updateDoc,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PackageItem {
    id?: string;
    text: string;
}

export default function PackageSettings() {
    // ✅ Firestore refs (2 separate lists)
    const includesRef = collection(
        db,
        "Panels",
        "IEDGE-SYSTEM",
        "packageIncludes",
    );
    const excludesRef = collection(
        db,
        "Panels",
        "IEDGE-SYSTEM",
        "packageExcludes",
    );

    // ✅ State
    const [includes, setIncludes] = useState<PackageItem[]>([]);
    const [excludes, setExcludes] = useState<PackageItem[]>([]);

    const [includeText, setIncludeText] = useState("");
    const [excludeText, setExcludeText] = useState("");

    const [editingIncludeId, setEditingIncludeId] = useState<string | null>(
        null,
    );
    const [editingExcludeId, setEditingExcludeId] = useState<string | null>(
        null,
    );

    const [savingInclude, setSavingInclude] = useState(false);
    const [savingExclude, setSavingExclude] = useState(false);

    // ✅ Fetch both lists
    useEffect(() => {
        const fetchAll = async () => {
            const [includesSnap, excludesSnap] = await Promise.all([
                getDocs(includesRef),
                getDocs(excludesRef),
            ]);

            const includesData = includesSnap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<PackageItem, "id">),
            })) as PackageItem[];

            const excludesData = excludesSnap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<PackageItem, "id">),
            })) as PackageItem[];

            setIncludes(includesData);
            setExcludes(excludesData);
        };

        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ✅ Optional: keep display alphabetical (does not change DB order)
    const sortedIncludes = useMemo(() => {
        return [...includes].sort((a, b) =>
            (a.text || "").localeCompare(b.text || "", undefined, {
                sensitivity: "base",
            }),
        );
    }, [includes]);

    const sortedExcludes = useMemo(() => {
        return [...excludes].sort((a, b) =>
            (a.text || "").localeCompare(b.text || "", undefined, {
                sensitivity: "base",
            }),
        );
    }, [excludes]);

    // ✅ Save (Add / Update)
    const saveItem = async (type: "include" | "exclude") => {
        const isInclude = type === "include";
        const text = (isInclude ? includeText : excludeText).trim();
        if (!text) return alert("Text is required");

        const ref = isInclude ? includesRef : excludesRef;
        const editingId = isInclude ? editingIncludeId : editingExcludeId;

        isInclude ? setSavingInclude(true) : setSavingExclude(true);

        try {
            if (editingId) {
                await updateDoc(
                    doc(
                        db,
                        "Panels",
                        "IEDGE-SYSTEM",
                        isInclude ? "packageIncludes" : "packageExcludes",
                        editingId,
                    ),
                    {
                        text,
                    },
                );

                if (isInclude) {
                    setIncludes((prev) =>
                        prev.map((x) =>
                            x.id === editingId ? { ...x, text } : x,
                        ),
                    );
                    setEditingIncludeId(null);
                    setIncludeText("");
                } else {
                    setExcludes((prev) =>
                        prev.map((x) =>
                            x.id === editingId ? { ...x, text } : x,
                        ),
                    );
                    setEditingExcludeId(null);
                    setExcludeText("");
                }
            } else {
                const docRef = await addDoc(ref, { text });

                if (isInclude) {
                    setIncludes((prev) => [...prev, { id: docRef.id, text }]);
                    setIncludeText("");
                } else {
                    setExcludes((prev) => [...prev, { id: docRef.id, text }]);
                    setExcludeText("");
                }
            }
        } catch (err) {
            console.error("Error saving package item:", err);
        } finally {
            isInclude ? setSavingInclude(false) : setSavingExclude(false);
        }
    };

    // ✅ Edit
    const editItem = (type: "include" | "exclude", item: PackageItem) => {
        if (type === "include") {
            setEditingIncludeId(item.id || null);
            setIncludeText(item.text);
        } else {
            setEditingExcludeId(item.id || null);
            setExcludeText(item.text);
        }
    };

    // ✅ Delete
    const deleteItem = async (type: "include" | "exclude", id?: string) => {
        if (!id) return;
        if (!confirm("Delete this item?")) return;

        const path = type === "include" ? "packageIncludes" : "packageExcludes";
        await deleteDoc(doc(db, "Panels", "IEDGE-SYSTEM", path, id));

        if (type === "include") {
            setIncludes((prev) => prev.filter((x) => x.id !== id));
        } else {
            setExcludes((prev) => prev.filter((x) => x.id !== id));
        }
    };

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* ✅ Package Includes */}
            <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
                <div className="text-sm font-medium">Package Includes:</div>

                <div className="flex gap-2">
                    <Input
                        value={includeText}
                        placeholder="Add 1–2 line include text"
                        onChange={(e) => setIncludeText(e.target.value)}
                    />
                    <Button
                        onClick={() => saveItem("include")}
                        disabled={savingInclude}
                    >
                        {savingInclude
                            ? "Saving..."
                            : editingIncludeId
                              ? "Update"
                              : "Add"}
                    </Button>
                </div>

                <div className="space-y-2">
                    {sortedIncludes.length === 0 ? (
                        <p className="text-sm text-gray-600">No items.</p>
                    ) : (
                        sortedIncludes.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-start justify-between gap-3 border rounded-md bg-white p-2"
                            >
                                <div className="text-sm whitespace-pre-wrap break-words flex-1">
                                    {item.text}
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() =>
                                            editItem("include", item)
                                        }
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() =>
                                            deleteItem("include", item.id)
                                        }
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ✅ Package Excludes */}
            <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
                <div className="text-sm font-medium">Package Excludes:</div>

                <div className="flex gap-2">
                    <Input
                        value={excludeText}
                        placeholder="Add 1–2 line exclude text"
                        onChange={(e) => setExcludeText(e.target.value)}
                    />
                    <Button
                        onClick={() => saveItem("exclude")}
                        disabled={savingExclude}
                    >
                        {savingExclude
                            ? "Saving..."
                            : editingExcludeId
                              ? "Update"
                              : "Add"}
                    </Button>
                </div>

                <div className="space-y-2">
                    {sortedExcludes.length === 0 ? (
                        <p className="text-sm text-gray-600">No items.</p>
                    ) : (
                        sortedExcludes.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-start justify-between gap-3 border rounded-md bg-white p-2"
                            >
                                <div className="text-sm whitespace-pre-wrap break-words flex-1">
                                    {item.text}
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() =>
                                            editItem("exclude", item)
                                        }
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() =>
                                            deleteItem("exclude", item.id)
                                        }
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
