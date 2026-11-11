// Travel Estimate data model.
//
// An estimate is a quote document: one or more airline options, each with its
// flights in order and the fares offered. The ticket type (one-way,
// round-trip, multi-city) and the journeys with their stops are worked out
// from the flights, never entered.
//
// Adding features later: give each new feature its own top-level key on the
// estimate record (e.g. `client`, `notes`, `terms`) and its own form section.
// Saving from the create/edit form only writes the keys in
// TRAVEL_ESTIMATE_FORM_KEYS (plus audit fields), so it never overwrites data
// another feature stored on the same record. Reading goes through
// normalizeTravelEstimate(), which fills defaults for anything missing, so
// older records keep opening after new fields are added.

export type LookupKind = "airports" | "airlines";

export type LookupSource = "seed" | "user";

/** A city or airport from Travel/Airports/items (doc id = code). */
export interface AirportOption {
  /** IATA airport code, or a city code for "all airports" entries such as LON. */
  code: string;
  /** IATA city code; several airports can share one (LHR, LGW → LON). */
  cityCode: string;
  name: string;
  aliases: string[];
  /** IANA time zone, e.g. Asia/Karachi; "" if not known. */
  timeZone: string;
  source: LookupSource;
}

export type AirlineKind = "airline" | "alliance";

/** An airline or alliance from Travel/Airlines/items (doc id = code). */
export interface AirlineOption {
  /** IATA airline designator (EK, 9P) or alliance code (*A, *O, *S). */
  code: string;
  name: string;
  kind: AirlineKind;
  aliases: string[];
  source: LookupSource;
}

export interface LookupItemMap {
  airports: AirportOption;
  airlines: AirlineOption;
}

/**
 * Copy of the chosen airport kept on the estimate, so the list and PDF never
 * need a lookup and an old estimate stays the same if the airport is renamed.
 */
export interface AirportRef {
  code: string;
  cityCode: string;
  name: string;
  /**
   * IANA time zone saved with the airport, "" if not known. Read it through
   * airportTimeZone(), which falls back to the built-in table.
   */
  timeZone: string;
}

/** Copy of the chosen airline kept on the estimate. */
export interface AirlineRef {
  code: string;
  name: string;
}

/**
 * One flight, e.g. KHI → DOH on QR. Dates and times are local at each
 * airport: departure in the From airport's time zone, arrival in the To
 * airport's. So the arrival date can be a day or two after the departure
 * date, or even the day before when crossing the date line.
 */
export interface FlightSegment {
  id: string;
  from: AirportRef | null;
  to: AirportRef | null;
  /** yyyy-MM-dd */
  departDate: string;
  /** HH:mm, or "" if not known. */
  departTime: string;
  /** yyyy-MM-dd */
  arrivalDate: string;
  /** HH:mm, or "" if not known. */
  arrivalTime: string;
  /**
   * Time in the air. Kept in step with the times: entering it (or changing
   * the departure) sets the arrival, entering the arrival time sets it.
   */
  durationMinutes: number | null;
  /** Operating carrier; blank means the option's airline. */
  carrier: AirlineRef | null;
  /**
   * e.g. "QR 605", "" if not entered. Starts with the carrier's code, filled
   * in from the airline; saved numbers are offered as suggestions.
   */
  flightNumber: string;
}

/**
 * Flights that connect into one way of the trip, e.g. KHI → DOH → IST. Worked
 * out from an option's flights (see groupJourneys), not stored.
 */
export interface Journey {
  id: string;
  segments: FlightSegment[];
}

/** Checked-in baggage, e.g. 23 kg in 2 pieces. Null parts aren't set. */
export interface BaggageAllowance {
  weightKg: number | null;
  pieces: number | null;
}

/** How a rate's service charges are entered. */
export type ServiceChargeType = "percent" | "fixed";

export interface ServiceCharge {
  type: ServiceChargeType;
  /** A percentage of the fare, or an amount in the estimate's currency; null when there's none. */
  value: number | null;
}

/**
 * A tax chosen on a rate. Name and percent are copied from Settings → Tax, so
 * a saved quote stays the same if the tax is changed or removed later.
 */
export interface FareTax {
  id: string;
  name: string;
  percent: number;
}

/** A rate column, e.g. Economy at PKR 283,535 with 25 kg baggage. */
export interface FareOption {
  id: string;
  /**
   * Fare types this rate applies to, e.g. ["Economy", "Economy Plus"]: the
   * built-in ones (FARE_TYPE_OPTIONS) and custom ones. Older estimates had a
   * free-text name, which is read as one custom type.
   */
  fareTypes: string[];
  /** The original fare. The final amount comes from fareTotals(). */
  amount: number | null;
  serviceCharge: ServiceCharge;
  taxes: FareTax[];
  /** Standard allowance; weight from BAGGAGE_WEIGHTS_KG, pieces from BAGGAGE_PIECES. */
  baggage: BaggageAllowance;
  /** Extra allowance on top of the standard one; null when there's none. */
  additionalBaggage: BaggageAllowance | null;
  seats: string;
  refundFees: string;
  changeFees: string;
}

/**
 * The kind of ticket, set by how many flights an option has (see
 * tripTypeFor): one-way for one flight, round-trip for two, multi-city for
 * three or more.
 */
export type TripType = "one-way" | "round-trip" | "multi-city";

export type TicketExpiryType = "date" | "hours" | "minutes";

/** How long the quoted ticket can be held; blank when not entered. */
export interface TicketExpiry {
  type: TicketExpiryType;
  /** yyyy-MM-dd; only for the "date" type. */
  date: string;
  /** Number of hours or minutes; null for the "date" type. */
  value: number | null;
}

/** One airline option offered to the client: its flights and fares. */
export interface QuoteOption {
  id: string;
  airline: AirlineRef | null;
  /** Shown beside the flights, e.g. KHI-QR. Blank = worked out from route and airline. */
  label: string;
  expiry: TicketExpiry;
  /** Every flight of the trip in order: connections, returns and onward flights alike. */
  flights: FlightSegment[];
  fares: FareOption[];
}

/** One Passenger Type Code row, e.g. 2 × ADT. */
export interface PassengerEntry {
  id: string;
  code: string;
  count: number;
}

/** Who the estimate is for; printed as the title of the PDF. */
export type EstimateCategory = "corporate" | "individual";

/** Copy of the chosen client kept on the estimate, like AirportRef. */
export interface ClientRef {
  /** Doc id in the Contacts Directory's clients collection. */
  id: string;
  name: string;
}

/** What happened to an applicant's booking; "" while it stands. */
export type ApplicantStatus =
  | ""
  | "cancelled-refund"
  | "cancelled"
  | "cancelled-non-refundable"
  | "no-show";

/**
 * One traveller in Application Details, usually imported from the
 * passport-details Excel sheet (one row each).
 */
export interface Applicant {
  id: string;
  fullName: string;
  givenName: string;
  surname: string;
  passportNumber: string;
  /** yyyy-MM-dd, or "" if not known. */
  passportExpiry: string;
  /** yyyy-MM-dd, or "" if not known. */
  dateOfBirth: string;
  status: ApplicantStatus;
}

/** The fields the create/edit form owns. One section per key. */
export interface TravelEstimateFormValues {
  /** "" on estimates saved before categories existed. */
  category: EstimateCategory | "";
  /** Corporate estimates; null on estimates saved before clients existed. */
  client: ClientRef | null;
  /** Individual estimates; "" on estimates saved before it existed. */
  individualName: string;
  currency: string;
  options: QuoteOption[];
  passengers: PassengerEntry[];
  /** Application Details; empty on estimates saved before it existed. */
  applicants: Applicant[];
}

export const TRAVEL_ESTIMATE_FORM_KEYS = [
  "category",
  "client",
  "individualName",
  "currency",
  "options",
  "passengers",
  "applicants",
] as const satisfies readonly (keyof TravelEstimateFormValues)[];

export interface UserStamp {
  uid: string;
  name: string;
}

/** Application Details saved on their own (Travel/Estimates/ApplicantLists), not tied to one estimate. */
export interface SavedApplicantList {
  id: string;
  name: string;
  applicants: Applicant[];
  updatedAt: Date | null;
  updatedBy: UserStamp | null;
}

/** The saved list the form's Application Details last came from or were saved to. */
export interface LinkedApplicantList {
  id: string;
  name: string;
  /** The applicants as saved, to tell whether they've changed since. */
  savedJson: string;
}

export interface TravelEstimate extends TravelEstimateFormValues {
  id: string;
  estimateNo: string;
  schemaVersion: number;
  createdAt: Date | null;
  updatedAt: Date | null;
  createdBy: UserStamp | null;
  updatedBy: UserStamp | null;
}

/** Validation messages keyed by field, see errorKeys in formModel.ts. */
export type FormErrors = Record<string, string>;
