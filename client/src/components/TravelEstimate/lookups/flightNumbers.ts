import { useSyncExternalStore } from "react";
import {
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MAX_SAVED_FLIGHT_NUMBERS } from "../constants";
import { flightNumberDoc, flightNumbersCol } from "../firestorePaths";
import { flightAirlineCode, flightNumberAirline, flightNumberKey, formatFlightNumber } from "../format";
import type { TravelEstimateFormValues, UserStamp } from "../types";

// Flight numbers shared by everyone, remembered from saved estimates and
// offered as suggestions in the Flight No. field.

export interface SavedFlightNumber {
  /** "QR605" for "QR 605"; also the doc id. */
  key: string;
  number: string;
  airlineCode: string;
  /** Airport codes of the last flight saved with this number, "" if not known. */
  from: string;
  to: string;
}

interface FlightNumbersState {
  items: SavedFlightNumber[];
  error: string | null;
}

// One listener for every flight on the page, opened by the first field and
// kept for the session, like the fare types.
let state: FlightNumbersState = { items: [], error: null };
const listeners = new Set<() => void>();
let stopListening: Unsubscribe | null = null;

function setState(patch: Partial<FlightNumbersState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

const text = (value: unknown) => (typeof value === "string" ? value : "");

function start() {
  stopListening = onSnapshot(
    query(flightNumbersCol(), orderBy("lastUsedAt", "desc"), limit(MAX_SAVED_FLIGHT_NUMBERS)),
    (snapshot) => {
      const items = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data({ serverTimestamps: "estimate" });
          const number = formatFlightNumber(text(data.number));
          return {
            key: flightNumberKey(number),
            number,
            airlineCode: text(data.airlineCode) || flightNumberAirline(number),
            from: text(data.from),
            to: text(data.to),
          };
        })
        .filter((item) => item.key);
      setState({ items, error: null });
    },
    (error) => {
      console.error("Error loading flight numbers:", error);
      stopListening = null;
      setState({ error: "Couldn't load saved flight numbers." });
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

export const useSavedFlightNumbers = () => useSyncExternalStore(subscribe, () => state);

/**
 * Remembers every flight number on an estimate for future suggestions. A
 * number already saved is moved to the top of the list with its latest route.
 */
export async function rememberFlightNumbers(values: TravelEstimateFormValues, user: UserStamp): Promise<void> {
  const byKey = new Map<string, Omit<SavedFlightNumber, "key">>();
  values.options.forEach((option) =>
    option.flights.forEach((segment) => {
      const code = flightAirlineCode(segment, option);
      const number = formatFlightNumber(segment.flightNumber, code);
      const key = flightNumberKey(number);
      if (!key) return;
      byKey.set(key, {
        number,
        airlineCode: flightNumberAirline(number) || code,
        from: segment.from?.code ?? "",
        to: segment.to?.code ?? "",
      });
    }),
  );
  if (byKey.size === 0) return;

  const batch = writeBatch(db);
  byKey.forEach((data, key) =>
    batch.set(flightNumberDoc(key), { ...data, lastUsedAt: serverTimestamp(), lastUsedBy: user }, { merge: true }),
  );
  await batch.commit();
}
