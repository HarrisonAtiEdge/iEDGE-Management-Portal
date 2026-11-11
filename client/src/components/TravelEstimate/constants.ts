import type { ApplicantStatus, EstimateCategory, TicketExpiryType, TripType } from "./types";

export const PANEL_ID = "IEDGE-SYSTEM";

/**
 * Written on new records; bump when the stored shape changes incompatibly.
 * 1 = GDS-style search itinerary, 2 = airline options with journeys of
 * flights, 3 = airline options with one list of flights.
 */
export const TRAVEL_ESTIMATE_SCHEMA_VERSION = 3;

export const ESTIMATE_NO_PREFIX = "TE-";

export const TRAVEL_ESTIMATE_ROUTES = {
  create: "/travel-estimate/create",
  list: "/travel-estimate/list",
  edit: (id: string) => `/travel-estimate/edit/${id}`,
};

/** Chosen on every estimate; the label is the title of its PDF. */
export const ESTIMATE_CATEGORY_OPTIONS: { value: EstimateCategory; label: string }[] = [
  { value: "corporate", label: "Corporate" },
  { value: "individual", label: "Individual" },
];

/** PDF and preview title: the category, or "Travel Estimate" for older estimates without one. */
export const estimateTitle = (category: EstimateCategory | "") =>
  ESTIMATE_CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? "Travel Estimate";

/** Ways to give a ticket's expiry. */
export const TICKET_EXPIRY_OPTIONS: { value: TicketExpiryType; label: string }[] = [
  { value: "date", label: "Date" },
  { value: "hours", label: "Hours" },
  { value: "minutes", label: "Minutes" },
];

/** Filled in on choosing hours, the usual time limit. */
export const DEFAULT_EXPIRY_HOURS = 24;
export const MAX_EXPIRY_HOURS = 8760;
export const MAX_EXPIRY_MINUTES = 1440;

/** Statuses an applicant can be given in Application Details. */
export const APPLICANT_STATUS_OPTIONS: { value: Exclude<ApplicantStatus, "">; label: string }[] = [
  { value: "cancelled-refund", label: "Cancelled/Refund" },
  { value: "cancelled", label: "Cancelled" },
  { value: "cancelled-non-refundable", label: "Cancelled/Non Refundable" },
  { value: "no-show", label: "No-Show" },
];

/** Shown for an applicant with no status set. */
export const APPLICANT_ACTIVE_LABEL = "Active";

export const applicantStatusLabel = (status: ApplicantStatus) =>
  APPLICANT_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? APPLICANT_ACTIVE_LABEL;

/** Most applicants one estimate holds, imported or added. */
export const MAX_APPLICANTS = 500;

/** Flight numbers saved for suggestions, newest first, are loaded up to this many. */
export const MAX_SAVED_FLIGHT_NUMBERS = 1000;
export const MAX_FLIGHT_NUMBER_LENGTH = 10;

/** Ticket types, set automatically from the number of flights. */
export const TRIP_TYPE_OPTIONS: { value: TripType; label: string }[] = [
  { value: "one-way", label: "One-Way" },
  { value: "round-trip", label: "Round-Trip" },
  { value: "multi-city", label: "Multi-City" },
];

/** 1 flight → one-way, 2 → round-trip, 3 or more → multi-city. */
export const tripTypeFor = (flightCount: number): TripType =>
  flightCount <= 1 ? "one-way" : flightCount === 2 ? "round-trip" : "multi-city";

export const tripTypeLabel = (tripType: TripType) =>
  TRIP_TYPE_OPTIONS.find((option) => option.value === tripType)?.label ?? tripType;

export const CURRENCY_OPTIONS = ["PKR", "USD", "AED", "SAR", "QAR", "GBP", "EUR"];
export const DEFAULT_CURRENCY = "PKR";

/** Fare types always offered on a rate. Custom ones are added to a shared list (lookups/fareTypes.ts). */
export const FARE_TYPE_OPTIONS = [
  "Economy",
  "Economy Plus",
  "Economy Premium",
  "Business",
  "First Class",
  "Business Economy",
  "Business Standard",
];
export const MAX_FARE_TYPE_LENGTH = 40;

/** Standard baggage allowances: a weight, in one or two pieces. */
export const BAGGAGE_WEIGHTS_KG = [15, 20, 23, 25, 30, 35, 40];
export const BAGGAGE_PIECES = [1, 2];

/** Upper limits for typed additional baggage. */
export const MAX_ADDITIONAL_BAGGAGE_KG = 100;
export const MAX_ADDITIONAL_BAGGAGE_PIECES = 9;

export const PASSENGER_TYPE_OPTIONS: { code: string; label: string }[] = [
  { code: "ADT", label: "Adult" },
  { code: "CHD", label: "Child" },
  { code: "INF", label: "Infant (on lap)" },
  { code: "INS", label: "Infant (with seat)" },
  { code: "SRC", label: "Senior citizen" },
  { code: "STU", label: "Student" },
  { code: "YTH", label: "Youth" },
  { code: "LBR", label: "Labour" },
  { code: "SEA", label: "Seaman" },
  { code: "MIL", label: "Military" },
];

export const DEFAULT_PASSENGER_CODES = ["ADT", "CHD", "INF"];

/** Lap infants need an accompanying adult each. */
export const LAP_INFANT_CODE = "INF";
export const NON_ADULT_PASSENGER_CODES = ["CHD", "INF", "INS"];

export const MAX_PASSENGERS_PER_TYPE = 9;
