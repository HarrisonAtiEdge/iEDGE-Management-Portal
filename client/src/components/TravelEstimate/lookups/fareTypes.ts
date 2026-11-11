import { useSyncExternalStore } from "react";
import { onSnapshot, runTransaction, serverTimestamp, type Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FARE_TYPE_OPTIONS, MAX_FARE_TYPE_LENGTH } from "../constants";
import { fareTypeDoc, fareTypesCol } from "../firestorePaths";
import type { UserStamp } from "../types";

// Custom fare types shared by everyone, added from a rate's Fare type
// dropdown. The built-in ones live in FARE_TYPE_OPTIONS and are never stored.

/** Collapses spaces: "  Premium   Flex " → "Premium Flex". */
export const cleanFareType = (value: string) => value.trim().replace(/\s+/g, " ");

/** Doc id for a fare type, the same for any spelling of it: "Premium Flex" → "premium-flex". */
const fareTypeKey = (name: string) =>
  cleanFareType(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** The existing spelling of a fare type, matched ignoring case and spacing. */
export function findFareType(name: string, known: string[]): string | undefined {
  const key = fareTypeKey(name);
  return known.find((item) => fareTypeKey(item) === key);
}

export function validateFareType(name: string): string | null {
  const cleaned = cleanFareType(name);
  if (!cleaned) return "Type a fare type name.";
  if (cleaned.length > MAX_FARE_TYPE_LENGTH) return `Keep it under ${MAX_FARE_TYPE_LENGTH} characters.`;
  if (!fareTypeKey(cleaned)) return "Use letters or numbers.";
  return null;
}

interface FareTypesState {
  custom: string[];
  error: string | null;
}

// One listener for every rate on the page, opened by the first dropdown and
// kept for the session, like the airport and airline lists.
let state: FareTypesState = { custom: [], error: null };
const listeners = new Set<() => void>();
let stopListening: Unsubscribe | null = null;

function setState(patch: Partial<FareTypesState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function start() {
  stopListening = onSnapshot(
    fareTypesCol(),
    (snapshot) => {
      const custom = snapshot.docs
        .map((docSnap) => cleanFareType(String(docSnap.data().name || "")))
        .filter((name) => name && !findFareType(name, FARE_TYPE_OPTIONS))
        .sort((a, b) => a.localeCompare(b));
      setState({ custom, error: null });
    },
    (error) => {
      console.error("Error loading fare types:", error);
      stopListening = null;
      setState({ error: "Couldn't load the custom fare types." });
    },
  );
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!stopListening) start();
  return () => {
    listeners.delete(listener);
  };
}

export const useCustomFareTypes = () => useSyncExternalStore(subscribe, () => state);

/**
 * Saves a custom fare type to the shared list, unless it's already there
 * (any spelling). Returns the name as stored.
 */
export async function addCustomFareType(name: string, user: UserStamp): Promise<string> {
  const cleaned = cleanFareType(name);
  const ref = fareTypeDoc(fareTypeKey(cleaned));

  return runTransaction(db, async (tx) => {
    const existing = await tx.get(ref);
    if (existing.exists()) return cleanFareType(String(existing.data()?.name || cleaned));
    tx.set(ref, { name: cleaned, createdAt: serverTimestamp(), createdBy: user });
    return cleaned;
  });
}
