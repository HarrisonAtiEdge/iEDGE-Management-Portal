import {
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type FirestoreError,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ESTIMATE_NO_PREFIX, TRAVEL_ESTIMATE_SCHEMA_VERSION } from "./constants";
import {
  travelEstimateCounterDoc,
  travelEstimateDoc,
  travelEstimatesCol,
} from "./firestorePaths";
import { readFormValues, toFirestoreFormValues } from "./formModel";
import { rememberFlightNumbers } from "./lookups/flightNumbers";
import type { TravelEstimate, TravelEstimateFormValues, UserStamp } from "./types";

export const formatEstimateNo = (number: number) =>
  `${ESTIMATE_NO_PREFIX}${String(number).padStart(4, "0")}`;

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();
  return null;
}

/** Adds the estimate's flight numbers to the suggestions, without holding up or failing the save. */
function rememberFlightNumbersLater(values: TravelEstimateFormValues, user: UserStamp) {
  rememberFlightNumbers(values, user).catch((error) => console.error("Error saving flight number suggestions:", error));
}

function readUserStamp(value: any): UserStamp | null {
  return value && typeof value === "object" && value.uid
    ? { uid: String(value.uid), name: String(value.name || "") }
    : null;
}

export function normalizeTravelEstimate(id: string, data: DocumentData): TravelEstimate {
  return {
    ...readFormValues(data),
    id,
    estimateNo: String(data.estimateNo || id),
    schemaVersion: Number(data.schemaVersion) || 1,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    createdBy: readUserStamp(data.createdBy),
    updatedBy: readUserStamp(data.updatedBy),
  };
}

/** Saves a new estimate and gives it the next TE- number in one transaction. */
export async function createTravelEstimate(
  values: TravelEstimateFormValues,
  user: UserStamp,
): Promise<{ id: string; estimateNo: string }> {
  const estimateRef = doc(travelEstimatesCol());

  const estimateNo = await runTransaction(db, async (tx) => {
    const counterRef = travelEstimateCounterDoc();
    const counterSnap = await tx.get(counterRef);
    const nextNumber = (Number(counterSnap.data()?.lastNumber) || 0) + 1;
    const nextEstimateNo = formatEstimateNo(nextNumber);

    tx.set(counterRef, { lastNumber: nextNumber, updatedAt: serverTimestamp() }, { merge: true });
    tx.set(estimateRef, {
      ...toFirestoreFormValues(values),
      estimateNo: nextEstimateNo,
      estimateNumber: nextNumber,
      schemaVersion: TRAVEL_ESTIMATE_SCHEMA_VERSION,
      createdAt: serverTimestamp(),
      createdBy: user,
      updatedAt: serverTimestamp(),
      updatedBy: user,
    });

    return nextEstimateNo;
  });

  rememberFlightNumbersLater(values, user);
  return { id: estimateRef.id, estimateNo };
}

/**
 * Updates only the fields the form owns, so data other features keep on the
 * same record is left alone.
 */
export async function updateTravelEstimate(
  id: string,
  values: TravelEstimateFormValues,
  user: UserStamp,
): Promise<void> {
  await updateDoc(travelEstimateDoc(id), {
    ...toFirestoreFormValues(values),
    updatedAt: serverTimestamp(),
    updatedBy: user,
  });
  rememberFlightNumbersLater(values, user);
}

/** Removes the estimate for good. Its TE- number is not given out again. */
export async function deleteTravelEstimate(id: string): Promise<void> {
  await deleteDoc(travelEstimateDoc(id));
}

export async function getTravelEstimate(id: string): Promise<TravelEstimate | null> {
  const snap = await getDoc(travelEstimateDoc(id));
  return snap.exists() ? normalizeTravelEstimate(snap.id, snap.data()) : null;
}

/** Live list, newest first. */
export function subscribeTravelEstimates(
  onEstimates: (estimates: TravelEstimate[]) => void,
  onError: (error: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    query(travelEstimatesCol(), orderBy("createdAt", "desc")),
    (snapshot) => {
      onEstimates(
        snapshot.docs.map((docSnap) =>
          normalizeTravelEstimate(docSnap.id, docSnap.data({ serverTimestamps: "estimate" })),
        ),
      );
    },
    onError,
  );
}
