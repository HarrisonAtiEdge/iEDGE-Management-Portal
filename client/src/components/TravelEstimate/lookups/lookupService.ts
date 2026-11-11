import {
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  writeBatch,
  type DocumentData,
  type FirestoreError,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { lookupItemDoc, lookupItemsCol, lookupSeedDoc } from "../firestorePaths";
import { builtInTimeZone, isKnownTimeZone } from "../timeZones";
import type {
  AirlineKind,
  AirlineOption,
  AirportOption,
  LookupItemMap,
  LookupKind,
  UserStamp,
} from "../types";

/**
 * Bump a version to add newly listed seed records on the next load. Records
 * already in Firestore are never overwritten, but seed records someone
 * deleted will come back.
 */
const SEED_VERSION: Record<LookupKind, number> = {
  airports: 1,
  airlines: 1,
};

// Firestore allows 500 writes per batch.
const SEED_BATCH_SIZE = 400;

function readAliases(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((alias): alias is string => typeof alias === "string")
    : [];
}

function toAirport(id: string, data: DocumentData): AirportOption {
  const code = String(data.code || id).toUpperCase();
  const cityCode = String(data.cityCode || code).toUpperCase();
  const savedZone = typeof data.timeZone === "string" && isKnownTimeZone(data.timeZone) ? data.timeZone : "";
  return {
    code,
    cityCode,
    name: String(data.name || code),
    aliases: readAliases(data.aliases),
    // Seeded records don't store a zone; the built-in table has them.
    timeZone: savedZone || builtInTimeZone(code, cityCode),
    source: data.source === "user" ? "user" : "seed",
  };
}

function toAirline(id: string, data: DocumentData): AirlineOption {
  const code = String(data.code || id).toUpperCase();
  return {
    code,
    name: String(data.name || code),
    kind: data.kind === "alliance" ? "alliance" : "airline",
    aliases: readAliases(data.aliases),
    source: data.source === "user" ? "user" : "seed",
  };
}

const READERS: { [K in LookupKind]: (id: string, data: DocumentData) => LookupItemMap[K] } = {
  airports: toAirport,
  airlines: toAirline,
};

export function subscribeLookupItems<K extends LookupKind>(
  kind: K,
  onItems: (items: LookupItemMap[K][], fromCache: boolean) => void,
  onError: (error: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    lookupItemsCol(kind),
    (snapshot) => {
      const read = READERS[kind] as (id: string, data: DocumentData) => LookupItemMap[K];
      const items = snapshot.docs
        .map((docSnap) => read(docSnap.id, docSnap.data()))
        .sort((a, b) => a.name.localeCompare(b.name) || a.code.localeCompare(b.code));
      onItems(items, snapshot.metadata.fromCache);
    },
    onError,
  );
}

async function loadSeedRecords(kind: LookupKind): Promise<{ code: string; data: DocumentData }[]> {
  if (kind === "airports") {
    const { getAirportSeed } = await import("./seed/airportsSeed");
    return getAirportSeed().map(({ code, cityCode, name, aliases }) => ({
      code,
      data: aliases.length ? { code, cityCode, name, aliases } : { code, cityCode, name },
    }));
  }

  const { getAirlineSeed } = await import("./seed/airlinesSeed");
  return getAirlineSeed().map(({ code, name, kind: airlineKind }) => ({
    code,
    data: { code, name, kind: airlineKind },
  }));
}

/**
 * Writes the built-in list to Firestore the first time it is needed.
 * `existingCodes` must come from a server snapshot of the collection; only
 * codes missing from it are written, so edits made in Firestore are kept.
 * Returns the number of records added.
 */
export async function seedLookupIfNeeded(
  kind: LookupKind,
  existingCodes: Set<string>,
): Promise<number> {
  const seedRef = lookupSeedDoc(kind);
  const seedSnap = await getDoc(seedRef);
  const seededVersion = Number(seedSnap.data()?.version) || 0;

  if (seededVersion >= SEED_VERSION[kind]) return 0;

  const records = await loadSeedRecords(kind);
  const missing = records.filter((record) => !existingCodes.has(record.code));

  for (let start = 0; start < missing.length; start += SEED_BATCH_SIZE) {
    const batch = writeBatch(db);
    missing.slice(start, start + SEED_BATCH_SIZE).forEach((record) => {
      batch.set(lookupItemDoc(kind, record.code), {
        ...record.data,
        source: "seed",
        createdAt: serverTimestamp(),
      });
    });
    await batch.commit();
  }

  await setDoc(seedRef, {
    version: SEED_VERSION[kind],
    count: records.length,
    seededAt: serverTimestamp(),
  });

  return missing.length;
}

// ---------------------------------------------------------------------------
// Adding records from the dropdown
// ---------------------------------------------------------------------------

export interface NewAirportInput {
  code: string;
  cityCode: string;
  name: string;
  /** IANA time zone, e.g. Asia/Karachi; "" if not known. */
  timeZone: string;
}

export interface NewAirlineInput {
  code: string;
  name: string;
  kind: AirlineKind;
}

export class LookupCodeExistsError extends Error {
  constructor(
    public readonly code: string,
    public readonly existingName: string,
  ) {
    super(`${code} already exists (${existingName}).`);
    this.name = "LookupCodeExistsError";
  }
}

const cleanCode = (value: string) => value.trim().toUpperCase();
const cleanName = (value: string) => value.trim().replace(/\s+/g, " ");

export function validateNewAirport(input: NewAirportInput): Record<string, string> {
  const errors: Record<string, string> = {};
  const code = cleanCode(input.code);
  const cityCode = cleanCode(input.cityCode);

  if (!/^[A-Z]{3}$/.test(code)) errors.code = "Enter the 3-letter IATA code.";
  if (cityCode && !/^[A-Z]{3}$/.test(cityCode)) errors.cityCode = "City code must be 3 letters.";
  if (!cleanName(input.name)) errors.name = "Enter the city or airport name.";
  if (input.timeZone.trim() && !isKnownTimeZone(input.timeZone.trim())) {
    errors.timeZone = "Pick a time zone from the list, e.g. Asia/Karachi.";
  }

  return errors;
}

export function validateNewAirline(input: NewAirlineInput): Record<string, string> {
  const errors: Record<string, string> = {};
  const code = cleanCode(input.code);

  if (input.kind === "alliance") {
    if (!/^[A-Z0-9*]{2,3}$/.test(code)) errors.code = "Use 2–3 characters, e.g. *A.";
  } else if (!/^[A-Z0-9]{2,3}$/.test(code)) {
    errors.code = "Enter the 2-character IATA code (or 3-letter ICAO code).";
  }
  if (!cleanName(input.name)) errors.name = "Enter the airline name.";

  return errors;
}

async function createLookupItem(
  kind: LookupKind,
  code: string,
  data: DocumentData,
  user: UserStamp,
): Promise<void> {
  const ref = lookupItemDoc(kind, code);

  await runTransaction(db, async (tx) => {
    const existing = await tx.get(ref);
    if (existing.exists()) {
      throw new LookupCodeExistsError(code, String(existing.data()?.name || code));
    }
    tx.set(ref, {
      ...data,
      code,
      source: "user",
      createdAt: serverTimestamp(),
      createdBy: user,
    });
  });
}

export async function addAirport(input: NewAirportInput, user: UserStamp): Promise<AirportOption> {
  const code = cleanCode(input.code);
  const airport: AirportOption = {
    code,
    cityCode: cleanCode(input.cityCode) || code,
    name: cleanName(input.name),
    aliases: [],
    timeZone: input.timeZone.trim(),
    source: "user",
  };

  await createLookupItem(
    "airports",
    code,
    { cityCode: airport.cityCode, name: airport.name, timeZone: airport.timeZone },
    user,
  );
  return airport;
}

export async function addAirline(input: NewAirlineInput, user: UserStamp): Promise<AirlineOption> {
  const code = cleanCode(input.code);
  const airline: AirlineOption = {
    code,
    name: cleanName(input.name),
    kind: input.kind,
    aliases: [],
    source: "user",
  };

  await createLookupItem("airlines", code, { name: airline.name, kind: airline.kind }, user);
  return airline;
}
