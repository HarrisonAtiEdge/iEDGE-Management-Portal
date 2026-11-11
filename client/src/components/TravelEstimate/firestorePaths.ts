import { collection, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PANEL_ID } from "./constants";
import type { LookupKind } from "./types";

// Firestore layout, all under Panels/IEDGE-SYSTEM/Travel:
//
//   Estimates/Records/{autoId}  travel estimates
//   Estimates/Meta/counter      { lastNumber } behind TE-0001, TE-0002, …
//   Estimates/ApplicantLists/{autoId}
//                               Application Details saved on their own from
//                               the form, to load into any estimate later
//   Airports/items/{code}       cities and airports (seeded from the IATA PDF)
//   Airports/Meta/seed          { version, count, seededAt }
//   Airlines/items/{code}       airlines and alliances
//   Airlines/Meta/seed          { version, count, seededAt }
//   FareTypes/items/{key}       custom fare types added from a rate, e.g.
//                               "Premium Flex" (built-in ones are in constants.ts)
//   FlightNumbers/items/{key}   flight numbers from saved estimates, offered as
//                               suggestions (key = "QR605" for "QR 605")
//
// Read only, kept by other modules directly under Panels/IEDGE-SYSTEM:
//
//   clients/{autoId}            Contacts Directory clients ({ name, … })
//   tax/{autoId}                Settings → Tax ({ name, percent, … })
//
// Never write fields onto Travel/Estimates, Travel/Airports,
// Travel/Airlines, Travel/FareTypes or Travel/FlightNumbers themselves. The Ticketing page lists every document in the
// Travel collection as an old ticket record; a document that only holds
// subcollections does not show up in that query.

const travelDoc = (name: string) => doc(db, "Panels", PANEL_ID, "Travel", name);

const LOOKUP_DOC_NAME: Record<LookupKind, string> = {
  airports: "Airports",
  airlines: "Airlines",
};

export const travelEstimatesCol = () =>
  collection(travelDoc("Estimates"), "Records");

export const travelEstimateDoc = (id: string) => doc(travelEstimatesCol(), id);

export const travelEstimateCounterDoc = () =>
  doc(travelDoc("Estimates"), "Meta", "counter");

export const applicantListsCol = () => collection(travelDoc("Estimates"), "ApplicantLists");

export const applicantListDoc = (id: string) => doc(applicantListsCol(), id);

export const lookupItemsCol = (kind: LookupKind) =>
  collection(travelDoc(LOOKUP_DOC_NAME[kind]), "items");

export const lookupItemDoc = (kind: LookupKind, code: string) =>
  doc(lookupItemsCol(kind), code);

export const fareTypesCol = () => collection(travelDoc("FareTypes"), "items");

export const fareTypeDoc = (key: string) => doc(fareTypesCol(), key);

export const flightNumbersCol = () => collection(travelDoc("FlightNumbers"), "items");

export const flightNumberDoc = (key: string) => doc(flightNumbersCol(), key);

export const clientsCol = () => collection(db, "Panels", PANEL_ID, "clients");

export const taxesCol = () => collection(db, "Panels", PANEL_ID, "tax");

export const lookupSeedDoc = (kind: LookupKind) =>
  doc(travelDoc(LOOKUP_DOC_NAME[kind]), "Meta", "seed");
