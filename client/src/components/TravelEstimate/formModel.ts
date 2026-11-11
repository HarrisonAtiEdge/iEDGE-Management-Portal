import {
  BAGGAGE_PIECES,
  BAGGAGE_WEIGHTS_KG,
  DEFAULT_CURRENCY,
  MAX_EXPIRY_HOURS,
  MAX_EXPIRY_MINUTES,
  TICKET_EXPIRY_OPTIONS,
  DEFAULT_PASSENGER_CODES,
  ESTIMATE_CATEGORY_OPTIONS,
  LAP_INFANT_CODE,
  MAX_ADDITIONAL_BAGGAGE_KG,
  APPLICANT_STATUS_OPTIONS,
  MAX_ADDITIONAL_BAGGAGE_PIECES,
  MAX_APPLICANTS,
  MAX_FLIGHT_NUMBER_LENGTH,
  MAX_PASSENGERS_PER_TYPE,
  NON_ADULT_PASSENGER_CODES,
  tripTypeFor,
} from "./constants";
import { cleanName, cleanPassportNumber, createApplicant } from "./applicants";
import { fareTotals } from "./fareTotals";
import {
  arrivalFromDuration,
  departAfterLanding,
  flightMinutes,
  groupJourneys,
  inferArrivalDate,
  isPlausibleFlightTime,
  layoverMinutes,
  MAX_FLIGHT_MINUTES,
} from "./flightTimes";
import {
  addDaysIso,
  daysBetween,
  fareTypesText,
  flightAirlineCode,
  formatFlightNumber,
  isoToDate,
  isValidTime,
  passengerTotal,
  sameAirport,
  todayIso,
} from "./format";
import type {
  AirlineRef,
  Applicant,
  ApplicantStatus,
  AirportRef,
  BaggageAllowance,
  ClientRef,
  EstimateCategory,
  FareOption,
  FareTax,
  FlightSegment,
  FormErrors,
  PassengerEntry,
  QuoteOption,
  ServiceCharge,
  TicketExpiry,
  TravelEstimateFormValues,
} from "./types";

export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createSegment(overrides: Partial<FlightSegment> = {}): FlightSegment {
  const date = overrides.departDate ?? todayIso();
  return {
    id: newId(),
    from: null,
    to: null,
    departDate: date,
    departTime: "",
    arrivalDate: date,
    arrivalTime: "",
    durationMinutes: null,
    carrier: null,
    flightNumber: "",
    ...overrides,
  };
}

export const createFare = (overrides: Partial<FareOption> = {}): FareOption => ({
  id: newId(),
  fareTypes: [],
  amount: null,
  serviceCharge: { type: "percent", value: null },
  taxes: [],
  baggage: { weightKg: null, pieces: null },
  additionalBaggage: null,
  seats: "",
  refundFees: "",
  changeFees: "",
  ...overrides,
});

/** A new airline option: one flight (so one-way until more are added), one fare. */
export function createOption(overrides: Partial<QuoteOption> = {}): QuoteOption {
  return {
    id: newId(),
    airline: null,
    label: "",
    expiry: { type: "date", date: "", value: null },
    flights: [createSegment()],
    fares: [createFare()],
    ...overrides,
  };
}

/**
 * A new option for the same trip as `template`: one flight per journey, from
 * its start to its end on its date, ready for this airline's connections.
 */
export function createOptionLike(template: QuoteOption | undefined): QuoteOption {
  if (!template) return createOption();
  return createOption({
    flights: groupJourneys(template.flights).map(({ segments }) =>
      createSegment({
        from: segments[0]?.from ?? null,
        to: segments[segments.length - 1]?.to ?? null,
        departDate: segments[0]?.departDate || todayIso(),
      }),
    ),
  });
}

/** Copy of an option with new ids, for "Duplicate". */
export function duplicateOption(option: QuoteOption): QuoteOption {
  return {
    ...option,
    id: newId(),
    label: "",
    flights: option.flights.map((segment) => ({ ...segment, id: newId() })),
    fares: option.fares.map((fare) => ({ ...fare, id: newId() })),
  };
}

export const optionTripType = (option: QuoteOption) => tripTypeFor(option.flights.length);

export function createPassenger(code: string, count = 0): PassengerEntry {
  return { id: newId(), code, count };
}

export function createDefaultFormValues(): TravelEstimateFormValues {
  return {
    // Chosen by the user on every new estimate.
    category: "",
    client: null,
    individualName: "",
    currency: DEFAULT_CURRENCY,
    options: [createOption()],
    passengers: DEFAULT_PASSENGER_CODES.map((code) =>
      createPassenger(code, code === "ADT" ? 1 : 0),
    ),
    applicants: [],
  };
}

// ---------------------------------------------------------------------------
// Editing flights. Dates and times fill themselves in down the list: each
// flight's arrival follows from its departure and duration (in the two
// airports' time zones), and each next flight leaves from where the previous
// one landed, no earlier than it landed. Everything stays editable.
// ---------------------------------------------------------------------------

const ARRIVAL_FIELDS: (keyof FlightSegment)[] = ["arrivalDate", "arrivalTime"];
const TIMING_FIELDS: (keyof FlightSegment)[] = ["from", "to", "departDate", "departTime", "durationMinutes"];

/** Sets the duration from the times when they give a sensible one. */
function withDurationFromTimes(segment: FlightSegment): FlightSegment {
  const minutes = flightMinutes(segment);
  return isPlausibleFlightTime(minutes) ? { ...segment, durationMinutes: minutes } : segment;
}

/**
 * Re-times a flight after an edit. Typing the arrival sets the duration.
 * Otherwise a known duration sets the arrival: a 9h 30m flight leaving KHI
 * 22:00 lands in LHR 02:30 the next day. With no duration, the arrival time
 * stays and only its date is worked out, or it keeps its day gap.
 */
function retime(before: FlightSegment, after: FlightSegment, changed: (keyof FlightSegment)[]): FlightSegment {
  if (changed.some((field) => ARRIVAL_FIELDS.includes(field))) {
    const date = changed.includes("arrivalTime") ? inferArrivalDate(after) : null;
    return withDurationFromTimes(date ? { ...after, arrivalDate: date } : after);
  }
  if (!changed.some((field) => TIMING_FIELDS.includes(field))) return after;

  if (after.durationMinutes) {
    const arrival = arrivalFromDuration(after, after.durationMinutes);
    if (arrival) return { ...after, ...arrival };
  }

  const inferred = inferArrivalDate(after);
  if (inferred) return withDurationFromTimes({ ...after, arrivalDate: inferred });
  if (after.departDate && after.departDate !== before.departDate) {
    const days = daysBetween(before.departDate, before.arrivalDate);
    return { ...after, arrivalDate: days !== null && days >= 0 ? addDaysIso(after.departDate, days) : after.departDate };
  }
  return after;
}

/**
 * Applies an edit to one flight and carries it down the list: the next
 * flight leaves from where this one now lands, and not before it lands.
 * Values the user has already set to something else are left alone.
 */
export function applyFlightChange(flights: FlightSegment[], index: number, patch: Partial<FlightSegment>) {
  const updated = [...flights];
  const changed = Object.keys(patch) as (keyof FlightSegment)[];
  let after: FlightSegment = { ...flights[index], ...patch };

  // A departure time picked on the date filled in from the previous landing
  // moves to the next day when needed (lands 23:30, leaves 01:15).
  if (index > 0 && changed.includes("departTime")) after = departAfterLanding(updated[index - 1], after);
  updated[index] = retime(flights[index], after, changed);

  for (let i = index + 1; i < updated.length; i += 1) {
    const previousBefore = flights[i - 1];
    const previousAfter = updated[i - 1];
    const next = updated[i];
    let moved = next;

    if (!sameAirport(previousBefore.to, previousAfter.to) && (!next.from || sameAirport(next.from, previousBefore.to))) {
      moved = { ...moved, from: previousAfter.to };
    }

    const landed = previousAfter.arrivalDate;
    if (
      landed &&
      landed !== previousBefore.arrivalDate &&
      (!next.departDate || next.departDate === previousBefore.arrivalDate || next.departDate < landed)
    ) {
      moved = { ...moved, departDate: landed };
    }
    moved = departAfterLanding(previousAfter, moved);

    if (moved === next) break;
    updated[i] = retime(next, moved, ["from", "departDate"]);
  }

  return updated;
}

/** The next flight: leaves from where the last one lands, on the day it lands. */
export function addFlight(flights: FlightSegment[], defaultCarrier: AirlineRef | null): FlightSegment[] {
  const last = flights[flights.length - 1];
  return [
    ...flights,
    createSegment({
      from: last?.to ?? null,
      departDate: last?.arrivalDate || last?.departDate || undefined,
      carrier: last?.carrier ?? defaultCarrier,
    }),
  ];
}

// ---------------------------------------------------------------------------
// Reading stored data. Anything missing or malformed falls back to a default
// so older or partly written records always open.
// ---------------------------------------------------------------------------

const text = (value: unknown) => (typeof value === "string" ? value : "");
const validDate = (value: unknown) => (isoToDate(text(value)) ? text(value) : "");
const validTime = (value: unknown) => (isValidTime(text(value)) ? text(value) : "");

function readAirport(value: any): AirportRef | null {
  if (!value || typeof value !== "object" || !value.code) return null;
  const code = String(value.code).toUpperCase();
  return {
    code,
    cityCode: text(value.cityCode).toUpperCase() || code,
    name: text(value.name) || code,
    // Older estimates have no zone; airportTimeZone() then uses the built-in table.
    timeZone: text(value.timeZone),
  };
}

function readAirline(value: any): AirlineRef | null {
  if (!value || typeof value !== "object" || !value.code) return null;
  const code = String(value.code).toUpperCase();
  return { code, name: text(value.name) || code };
}

/** A whole number from 1 up to `max`, else null. */
function positiveInt(value: unknown, max: number): number | null {
  const number = Number(value);
  return value !== null && value !== undefined && Number.isInteger(number) && number > 0 && number <= max ? number : null;
}

function readSegment(value: any): FlightSegment {
  const departDate = validDate(value?.departDate);
  const segment: FlightSegment = {
    id: text(value?.id) || newId(),
    from: readAirport(value?.from),
    to: readAirport(value?.to),
    departDate,
    departTime: validTime(value?.departTime),
    arrivalDate: validDate(value?.arrivalDate) || departDate,
    arrivalTime: validTime(value?.arrivalTime),
    durationMinutes: positiveInt(value?.durationMinutes, MAX_FLIGHT_MINUTES),
    carrier: readAirline(value?.carrier),
    flightNumber: text(value?.flightNumber).toUpperCase().trim().slice(0, MAX_FLIGHT_NUMBER_LENGTH),
  };
  // Flights saved before durations existed get theirs from the times.
  return segment.durationMinutes ? segment : withDurationFromTimes(segment);
}

function readBaggage(value: any, maxKg: number, maxPieces: number): BaggageAllowance {
  return { weightKg: positiveInt(value?.weightKg, maxKg), pieces: positiveInt(value?.pieces, maxPieces) };
}

/** Saved fare types, or an older estimate's free-text fare name as a single custom type. */
function readFareTypes(value: any): string[] {
  const saved = Array.isArray(value?.fareTypes)
    ? value.fareTypes.filter((item: unknown): item is string => typeof item === "string" && item.trim() !== "")
    : [];
  if (saved.length) return Array.from(new Set(saved.map((item: string) => item.trim())));
  const legacyName = text(value?.name).trim();
  return legacyName ? [legacyName] : [];
}

function readServiceCharge(value: any): ServiceCharge {
  const number = Number(value?.value);
  return {
    type: value?.type === "fixed" ? "fixed" : "percent",
    value: value?.value !== null && value?.value !== undefined && number > 0 && Number.isFinite(number) ? number : null,
  };
}

function readTaxes(value: unknown): FareTax[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object" && text(item.name))
    .map((item) => ({ id: text(item.id) || newId(), name: text(item.name), percent: Math.max(0, Number(item.percent) || 0) }));
}

function readFare(value: any): FareOption {
  const amount = Number(value?.amount);
  const additional = value?.additionalBaggage
    ? readBaggage(value.additionalBaggage, MAX_ADDITIONAL_BAGGAGE_KG, MAX_ADDITIONAL_BAGGAGE_PIECES)
    : null;
  return {
    id: text(value?.id) || newId(),
    fareTypes: readFareTypes(value),
    amount: value?.amount !== null && value?.amount !== undefined && Number.isFinite(amount) ? amount : null,
    serviceCharge: readServiceCharge(value?.serviceCharge),
    taxes: readTaxes(value?.taxes),
    baggage: readBaggage(value?.baggage, Math.max(...BAGGAGE_WEIGHTS_KG), Math.max(...BAGGAGE_PIECES)),
    additionalBaggage: additional && (additional.weightKg || additional.pieces) ? additional : null,
    seats: text(value?.seats),
    refundFees: text(value?.refundFees),
    changeFees: text(value?.changeFees),
  };
}

/** Flights in order; estimates saved before schema 3 kept them in journeys (outbound, return…). */
function readFlights(value: any): FlightSegment[] {
  if (Array.isArray(value?.flights)) return value.flights.map(readSegment);
  if (!Array.isArray(value?.journeys)) return [];
  return value.journeys.flatMap((journey: any) =>
    Array.isArray(journey?.segments) ? journey.segments.map(readSegment) : [],
  );
}

function readExpiry(value: any): TicketExpiry {
  const type = TICKET_EXPIRY_OPTIONS.find((option) => option.value === value?.type)?.value ?? "date";
  return {
    type,
    date: type === "date" ? validDate(value?.date) : "",
    value:
      type === "date" ? null : positiveInt(value?.value, type === "hours" ? MAX_EXPIRY_HOURS : MAX_EXPIRY_MINUTES),
  };
}

function readOption(value: any): QuoteOption {
  const flights = readFlights(value);
  const fares = Array.isArray(value?.fares) ? value.fares.map(readFare) : [];
  return {
    id: text(value?.id) || newId(),
    airline: readAirline(value?.airline),
    label: text(value?.label),
    expiry: readExpiry(value?.expiry),
    flights: flights.length ? flights : [createSegment()],
    fares: fares.length ? fares : [createFare()],
  };
}

/**
 * Estimates saved before airline options existed (schema 1) had a flat,
 * GDS-style itinerary. Each old flight becomes a flight of one option.
 */
function readLegacyItinerary(itinerary: unknown): QuoteOption | null {
  if (!Array.isArray(itinerary) || itinerary.length === 0) return null;
  return createOption({
    flights: itinerary.map((segment: any) =>
      createSegment({
        from: readAirport(segment?.from),
        to: readAirport(segment?.to),
        departDate: validDate(segment?.date) || todayIso(),
      }),
    ),
  });
}

function readPassengers(value: unknown): PassengerEntry[] {
  if (!Array.isArray(value) || value.length === 0) {
    return createDefaultFormValues().passengers;
  }
  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      id: text(item.id) || newId(),
      code: text(item.code).toUpperCase(),
      count: Math.max(0, Math.floor(Number(item.count) || 0)),
    }));
}

function readApplicantStatus(value: unknown): ApplicantStatus {
  return APPLICANT_STATUS_OPTIONS.find((option) => option.value === value)?.value ?? "";
}

export function readApplicants(value: unknown): Applicant[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .slice(0, MAX_APPLICANTS)
    .map((item) =>
      createApplicant({
        ...(text(item.id) ? { id: text(item.id) } : {}),
        fullName: cleanName(item.fullName),
        givenName: cleanName(item.givenName),
        surname: cleanName(item.surname),
        passportNumber: cleanPassportNumber(item.passportNumber),
        passportExpiry: validDate(item.passportExpiry),
        dateOfBirth: validDate(item.dateOfBirth),
        status: readApplicantStatus(item.status),
      }),
    );
}

function readClient(value: any): ClientRef | null {
  return value && typeof value === "object" && text(value.name) ? { id: text(value.id), name: text(value.name) } : null;
}

function readCategory(value: unknown): EstimateCategory | "" {
  return ESTIMATE_CATEGORY_OPTIONS.find((option) => option.value === value)?.value ?? "";
}

export function readFormValues(data: Record<string, any> | undefined): TravelEstimateFormValues {
  const options = Array.isArray(data?.options) ? data!.options.map(readOption) : [];
  const legacy = options.length ? null : readLegacyItinerary(data?.itinerary);
  return {
    category: readCategory(data?.category),
    client: readClient(data?.client),
    individualName: text(data?.individualName),
    currency: text(data?.currency) || DEFAULT_CURRENCY,
    options: options.length ? options : legacy ? [legacy] : [createOption()],
    passengers: readPassengers(data?.passengers),
    applicants: readApplicants(data?.applicants),
  };
}

/** Exactly what the form writes to Firestore: no undefined values, no extra keys. */
export function toFirestoreFormValues(values: TravelEstimateFormValues) {
  const airport = (value: AirportRef | null) =>
    value ? { code: value.code, cityCode: value.cityCode, name: value.name, timeZone: value.timeZone } : null;
  const airline = (value: AirlineRef | null) => (value ? { code: value.code, name: value.name } : null);

  return {
    // Worked out from the first option's flights; saved so other screens can read it without the rules.
    tripType: values.options[0] ? optionTripType(values.options[0]) : tripTypeFor(0),
    category: values.category,
    // The form keeps both while switching category; only the chosen one is saved.
    client: values.category === "corporate" && values.client ? { id: values.client.id, name: values.client.name } : null,
    individualName: values.category === "individual" ? values.individualName.trim() : "",
    currency: values.currency,
    options: values.options.map((option) => ({
      id: option.id,
      airline: airline(option.airline),
      label: option.label.trim(),
      expiry: { type: option.expiry.type, date: option.expiry.date, value: option.expiry.value },
      tripType: optionTripType(option),
      flights: option.flights.map((segment) => ({
        id: segment.id,
        from: airport(segment.from),
        to: airport(segment.to),
        departDate: segment.departDate,
        departTime: segment.departTime,
        arrivalDate: segment.arrivalDate,
        arrivalTime: segment.arrivalTime,
        durationMinutes: segment.durationMinutes,
        carrier: airline(segment.carrier),
        flightNumber: formatFlightNumber(segment.flightNumber, flightAirlineCode(segment, option)),
      })),
      fares: option.fares.map((fare) => {
        const totals = fareTotals(fare);
        return {
          id: fare.id,
          fareTypes: fare.fareTypes,
          // Kept alongside fareTypes for anything that still reads the old field.
          name: fareTypesText(fare),
          amount: fare.amount,
          serviceCharge: { type: fare.serviceCharge.type, value: fare.serviceCharge.value },
          // Saved so other screens can read them; the form works them out again from the above.
          serviceChargeAmount: totals.serviceChargeAmount,
          taxes: totals.taxes,
          taxAmount: totals.taxAmount,
          ticketAmount: totals.ticketAmount,
          baggage: { weightKg: fare.baggage.weightKg, pieces: fare.baggage.pieces },
          additionalBaggage: fare.additionalBaggage
            ? { weightKg: fare.additionalBaggage.weightKg, pieces: fare.additionalBaggage.pieces }
            : null,
          seats: fare.seats.trim(),
          refundFees: fare.refundFees.trim(),
          changeFees: fare.changeFees.trim(),
        };
      }),
    })),
    passengers: values.passengers.map((entry) => ({ id: entry.id, code: entry.code, count: entry.count })),
    applicants: toFirestoreApplicants(values.applicants),
  };
}

/** Applicants as saved, on an estimate or a saved applicant list. */
export function toFirestoreApplicants(applicants: Applicant[]) {
  return applicants.map((applicant) => {
    const givenName = cleanName(applicant.givenName);
    const surname = cleanName(applicant.surname);
    return {
      id: applicant.id,
      fullName: cleanName(applicant.fullName) || [givenName, surname].filter(Boolean).join(" "),
      givenName,
      surname,
      passportNumber: cleanPassportNumber(applicant.passportNumber),
      passportExpiry: applicant.passportExpiry,
      dateOfBirth: applicant.dateOfBirth,
      status: applicant.status,
    };
  });
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export const errorKeys = {
  category: "category",
  client: "client",
  individualName: "individualName",
  options: "options",
  optionAirline: (optionId: string) => `option.${optionId}.airline`,
  segment: (segmentId: string, field: keyof FlightSegment) => `segment.${segmentId}.${field}`,
  fareAmount: (fareId: string) => `fare.${fareId}.amount`,
  fareServiceCharge: (fareId: string) => `fare.${fareId}.serviceCharge`,
  fareAdditionalBaggage: (fareId: string) => `fare.${fareId}.additionalBaggage`,
  passengers: "passengers",
  passenger: (passengerId: string) => `passengers.${passengerId}`,
  applicants: "applicants",
  applicant: (applicantId: string, field: keyof Applicant) => `applicant.${applicantId}.${field}`,
};

function validateApplicants(applicants: Applicant[], errors: FormErrors) {
  if (applicants.length > MAX_APPLICANTS) {
    errors[errorKeys.applicants] = `At most ${MAX_APPLICANTS} applicants.`;
  }

  const passports = new Map<string, number>();
  applicants.forEach((applicant, index) => {
    const key = (field: keyof Applicant) => errorKeys.applicant(applicant.id, field);
    const hasName = [applicant.fullName, applicant.givenName, applicant.surname].some((part) => part.trim());
    if (!hasName) errors[key("fullName")] = "Enter the name.";

    const passport = cleanPassportNumber(applicant.passportNumber);
    if (passport) {
      const first = passports.get(passport);
      if (first !== undefined) errors[key("passportNumber")] = `Same as applicant ${first + 1}.`;
      else passports.set(passport, index);
    }

    if (applicant.dateOfBirth && applicant.dateOfBirth > todayIso()) {
      errors[key("dateOfBirth")] = "In the future.";
    }
    if (applicant.dateOfBirth && applicant.passportExpiry && applicant.passportExpiry <= applicant.dateOfBirth) {
      errors[key("passportExpiry")] = "Before the date of birth.";
    }
  });
}

function validateFlights(flights: FlightSegment[], errors: FormErrors) {
  flights.forEach((segment, index) => {
    const key = (field: keyof FlightSegment) => errorKeys.segment(segment.id, field);

    if (!segment.from) errors[key("from")] = "Required.";
    if (!segment.to) errors[key("to")] = "Required.";
    if (segment.from && segment.to && segment.from.code === segment.to.code) {
      errors[key("to")] = "Same as From.";
    }

    if (!isoToDate(segment.departDate)) errors[key("departDate")] = "Enter a date.";

    // With both time zones known the check is exact, so a flight that lands
    // on an earlier local date (over the date line) is still accepted.
    const minutesInAir = flightMinutes(segment);
    if (!isoToDate(segment.arrivalDate)) {
      errors[key("arrivalDate")] = "Enter a date.";
    } else if (minutesInAir !== null) {
      if (minutesInAir <= 0) errors[key("arrivalDate")] = "Lands before take-off in local time. Check the date.";
      else if (minutesInAir > MAX_FLIGHT_MINUTES) errors[key("arrivalDate")] = "Over 24 hours in the air. Check the date.";
    } else if (isoToDate(segment.departDate) && segment.arrivalDate < segment.departDate) {
      errors[key("arrivalDate")] = "Before departure.";
    }

    if (segment.flightNumber.trim() && !/^[A-Z0-9 ]+$/i.test(segment.flightNumber.trim())) {
      errors[key("flightNumber")] = "Letters and numbers only, e.g. QR 605.";
    }

    if (!isValidTime(segment.departTime)) errors[key("departTime")] = "Use 24-hour time, e.g. 04:20 or 16:20.";
    if (!isValidTime(segment.arrivalTime)) errors[key("arrivalTime")] = "Use 24-hour time, e.g. 04:50 or 16:50.";

    // Each flight leaves after the one before it has landed.
    const previous = flights[index - 1];
    if (previous) {
      const layover = layoverMinutes(previous, segment);
      if (layover !== null) {
        if (layover < 0 && !errors[key("departTime")]) errors[key("departTime")] = "Leaves before the previous flight lands.";
      } else if (isoToDate(previous.arrivalDate) && segment.departDate < previous.arrivalDate) {
        errors[key("departDate")] ??= "Before the previous flight lands.";
      }
    }
  });
}

export function validateFormValues(values: TravelEstimateFormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.category) errors[errorKeys.category] = "Choose Corporate or Individual.";
  if (values.category === "corporate" && !values.client) errors[errorKeys.client] = "Choose the client.";
  if (values.category === "individual" && !values.individualName.trim()) {
    errors[errorKeys.individualName] = "Enter the name.";
  }
  if (values.options.length === 0) errors[errorKeys.options] = "Add at least one airline option.";

  values.options.forEach((option) => {
    if (!option.airline) errors[errorKeys.optionAirline(option.id)] = "Choose the airline.";
    validateFlights(option.flights, errors);

    option.fares.forEach((fare) => {
      if (fare.amount === null) errors[errorKeys.fareAmount(fare.id)] = "Enter the fare.";
      else if (fare.amount <= 0) errors[errorKeys.fareAmount(fare.id)] = "Must be more than 0.";

      if (fare.serviceCharge.type === "percent" && (fare.serviceCharge.value ?? 0) > 100) {
        errors[errorKeys.fareServiceCharge(fare.id)] = "Can't be more than 100%.";
      }

      const extra = fare.additionalBaggage;
      if (extra && !extra.weightKg && !extra.pieces) {
        errors[errorKeys.fareAdditionalBaggage(fare.id)] = "Enter the extra weight or pieces, or untick it.";
      }
    });
  });

  const codes = new Set<string>();
  values.passengers.forEach((entry) => {
    if (!entry.code) {
      errors[errorKeys.passenger(entry.id)] = "Choose a passenger type.";
    } else if (codes.has(entry.code)) {
      errors[errorKeys.passenger(entry.id)] = `${entry.code} is listed twice.`;
    } else if (entry.count > MAX_PASSENGERS_PER_TYPE) {
      errors[errorKeys.passenger(entry.id)] = `At most ${MAX_PASSENGERS_PER_TYPE} per type.`;
    }
    codes.add(entry.code);
  });

  const lapInfants = values.passengers
    .filter((entry) => entry.code === LAP_INFANT_CODE)
    .reduce((sum, entry) => sum + entry.count, 0);
  const adults = values.passengers
    .filter((entry) => entry.code && !NON_ADULT_PASSENGER_CODES.includes(entry.code))
    .reduce((sum, entry) => sum + entry.count, 0);

  validateApplicants(values.applicants, errors);

  if (passengerTotal(values.passengers) === 0) {
    errors[errorKeys.passengers] = "Add at least one passenger.";
  } else if (lapInfants > adults) {
    errors[errorKeys.passengers] = "Each infant on lap (INF) needs an adult travelling with them.";
  }

  return errors;
}
