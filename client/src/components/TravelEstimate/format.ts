import { format, isValid, parse } from "date-fns";
import { PASSENGER_TYPE_OPTIONS, tripTypeFor, tripTypeLabel } from "./constants";
import { fareTotals } from "./fareTotals";
import type {
  AirlineRef,
  AirportRef,
  BaggageAllowance,
  FareOption,
  FlightSegment,
  PassengerEntry,
  QuoteOption,
  TravelEstimateFormValues,
} from "./types";

const ISO_DATE = "yyyy-MM-dd";

export function isoToDate(iso: string): Date | null {
  if (!iso) return null;
  const date = parse(iso, ISO_DATE, new Date());
  return isValid(date) ? date : null;
}

export const dateToIso = (date: Date) => format(date, ISO_DATE);

export const todayIso = () => dateToIso(new Date());

/** GDS style for typing, e.g. 24NOV26. */
export function formatGdsDate(iso: string): string {
  const date = isoToDate(iso);
  return date ? format(date, "ddMMMyy").toUpperCase() : "";
}

/** Quote document style, e.g. 24-Nov-26. */
export function formatDocDate(iso: string): string {
  const date = isoToDate(iso);
  return date ? format(date, "dd-MMM-yy") : "-";
}

/** With the full year, e.g. 11-Jul-1959, where a two-digit year could mislead (dates of birth). */
export function formatFullDate(iso: string): string {
  const date = isoToDate(iso);
  return date ? format(date, "dd-MMM-yyyy") : "-";
}

export function formatTimestamp(date: Date | null): string {
  return date ? format(date, "d MMM yyyy, h:mm a") : "-";
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function buildIso(year: number, monthIndex: number, day: number): string | null {
  const date = new Date(year, monthIndex, day);
  if (date.getFullYear() !== year || date.getMonth() !== monthIndex || date.getDate() !== day) {
    return null;
  }
  return dateToIso(date);
}

const fullYear = (year: string) => (year.length === 2 ? 2000 + Number(year) : Number(year));

/**
 * Reads a typed date: 24NOV26, 24NOV2026, 24NOV (next upcoming), 24-Nov-26,
 * 24/11/2026 or 2026-11-24. Returns yyyy-MM-dd, or null if it isn't a date.
 */
export function parseTypedDate(input: string): string | null {
  const text = input.trim().toUpperCase().replace(/\s+/g, "");
  if (!text) return null;

  const gds = text.match(/^(\d{1,2})-?([A-Z]{3})-?(\d{2}|\d{4})?$/);
  if (gds) {
    const day = Number(gds[1]);
    const monthIndex = MONTHS.indexOf(gds[2]);
    if (monthIndex < 0) return null;

    if (gds[3]) return buildIso(fullYear(gds[3]), monthIndex, day);

    // No year: the next time this day comes round.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisYear = buildIso(today.getFullYear(), monthIndex, day);
    if (thisYear && (isoToDate(thisYear) as Date) >= today) return thisYear;
    return buildIso(today.getFullYear() + 1, monthIndex, day);
  }

  const dmy = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/);
  if (dmy) return buildIso(fullYear(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));

  const ymd = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymd) return buildIso(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));

  return null;
}

/**
 * Reads a typed time: 9, 930, 0930, 9:30, 21:30, 2130, 21:30:00. A 12-hour
 * time pasted in (9pm, 4:20 AM) is still understood. Returns HH:mm, "" for
 * blank, or null if it isn't a time.
 */
export function parseTypedTime(input: string): string | null {
  const text = input.trim().toLowerCase().replace(/\s+/g, "");
  if (!text) return "";

  const match = text.match(/^(\d{1,2})(?::?(\d{2}))?(?::\d{2})?(am|pm|a|p)?$/);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  const suffix = match[3];

  if (suffix) {
    if (hours < 1 || hours > 12) return null;
    if (suffix.startsWith("p") && hours !== 12) hours += 12;
    if (suffix.startsWith("a") && hours === 12) hours = 0;
  }
  if (hours > 23 || minutes > 59) return null;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export const isValidTime = (value: string) => value === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

/** 24-hour clock as shown everywhere: "04:20", "16:20"; "" for blank or invalid. */
export const formatTime24 = (value: string): string => (value && isValidTime(value) ? value : "");

/** Calendar date `days` after (or before) a yyyy-MM-dd date. */
export function addDaysIso(iso: string, days: number): string {
  const date = isoToDate(iso);
  if (!date) return "";
  date.setDate(date.getDate() + days);
  return dateToIso(date);
}

/** Whole days from one yyyy-MM-dd date to another; null if either is missing. */
export function daysBetween(fromIso: string, toIso: string): number | null {
  const from = isoToDate(fromIso);
  const to = isoToDate(toIso);
  if (!from || !to) return null;
  const utc = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((utc(to) - utc(from)) / 86_400_000);
}

export const sameAirport = (a: AirportRef | null, b: AirportRef | null) => (a?.code ?? "") === (b?.code ?? "");

export const segmentRouteText = (segment: FlightSegment) =>
  `${segment.from?.code || "???"}-${segment.to?.code || "???"}`;

export const airportLabel = (airport: AirportRef | null) =>
  airport ? `${airport.name} (${airport.code})` : "";

export const airlineLabel = (airline: AirlineRef | null) =>
  airline ? `${airline.name} (${airline.code})` : "";

/** Carrier code shown for a flight; falls back to the option's airline. */
export const carrierCode = (segment: FlightSegment, option: QuoteOption) =>
  segment.carrier?.code || option.airline?.code || "-";

/** Code of the airline a flight is on: its own carrier, else the option's airline; "" if neither. */
export const flightAirlineCode = (segment: FlightSegment, option: QuoteOption) =>
  segment.carrier?.code || option.airline?.code || "";

// Airline code and number, e.g. QR 605, 9P 842, A3 123, PIA 301. Two-letter
// IATA codes always have a letter, so a bare number isn't read as one.
const FLIGHT_NUMBER = /^([A-Z]{3}|[A-Z]{2}|[A-Z][0-9]|[0-9][A-Z]) ?(\d{1,4}[A-Z]?)$/;
const BARE_FLIGHT_NUMBER = /^\d{1,4}[A-Z]?$/;

/**
 * Tidies a typed flight number: "qr605" → "QR 605", and a bare number gets
 * the airline's code, "605" → "QR 605". Just the code ("QR") means nothing
 * was entered and gives "". Anything else is kept as typed, in capitals.
 */
export function formatFlightNumber(input: string, airlineCode = ""): string {
  const text = input.toUpperCase().replace(/\s+/g, " ").trim();
  if (!text || text === airlineCode) return "";
  if (BARE_FLIGHT_NUMBER.test(text)) return airlineCode ? `${airlineCode} ${text}` : text;
  const match = text.match(FLIGHT_NUMBER);
  return match ? `${match[1]} ${match[2]}` : text;
}

/** Same for any spelling of a flight number: "QR 605" → "QR605". */
export const flightNumberKey = (number: string) => number.toUpperCase().replace(/[^A-Z0-9]/g, "");

/** The airline code a flight number starts with, e.g. "QR 605" → "QR"; "" if it has none. */
export const flightNumberAirline = (number: string) =>
  formatFlightNumber(number).match(FLIGHT_NUMBER)?.[1] ?? "";

/**
 * Moves a flight number to another airline: "QR 605" → "TK 605" when the
 * flight changes from QR to TK. A number on some other code is left alone.
 */
export function retagFlightNumber(number: string, fromCode: string, toCode: string): string {
  if (fromCode === toCode) return number;
  const parts = formatFlightNumber(number, fromCode).match(FLIGHT_NUMBER);
  if (parts && parts[1] === fromCode) return formatFlightNumber(parts[2], toCode);
  if (BARE_FLIGHT_NUMBER.test(number.trim().toUpperCase())) return formatFlightNumber(number, toCode);
  return number;
}

/** Label beside an option's flights, e.g. KHI-QR. */
export function optionLabel(option: QuoteOption): string {
  if (option.label.trim()) return option.label.trim();
  const origin = option.flights[0]?.from?.code;
  return [origin, option.airline?.code].filter(Boolean).join("-");
}

export function formatMoney(amount: number | null, currency: string): string {
  if (amount === null) return "-";
  return `${currency} ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Reads a typed amount: 283535, 283,535.00, PKR 283,535. Null if blank or not a number. */
export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
}

/** e.g. "Economy / Economy Plus"; "" if none chosen. */
export const fareTypesText = (fare: FareOption, separator = " / ") => fare.fareTypes.join(separator);

const piecesText = (pieces: number) => `${pieces} PC${pieces === 1 ? "" : "s"}`;

/** e.g. "23 KG, 2 PCs", "30 KG", "1 PC"; "" when nothing is set. */
export function baggageText(allowance: BaggageAllowance | null): string {
  if (!allowance) return "";
  return [allowance.weightKg ? `${allowance.weightKg} KG` : "", allowance.pieces ? piecesText(allowance.pieces) : ""]
    .filter(Boolean)
    .join(", ");
}

/** Lines shown under a fare's price. Blank details are left out. */
export function fareDetailLines(fare: FareOption): string[] {
  const baggage = baggageText(fare.baggage);
  const additional = baggageText(fare.additionalBaggage);
  return [
    baggage && `Baggage: ${baggage}`,
    additional && `Additional Baggage: +${additional}`,
    fare.seats.trim() && `Seats: ${fare.seats.trim()}`,
    fare.refundFees.trim() && `Refund Fees: ${fare.refundFees.trim()}`,
    fare.changeFees.trim() && `Change Fees: ${fare.changeFees.trim()}`,
  ].filter((line): line is string => Boolean(line));
}

type OptionsOnly = Pick<TravelEstimateFormValues, "options">;

/**
 * An option's flights as a chain of cities, e.g. "KHI → IST → KHI". Where a
 * flight doesn't leave from where the last one landed the chain breaks:
 * "KHI → IST / KHI → AYT".
 */
export function optionRouteText(option: Pick<QuoteOption, "flights"> | undefined, arrow = "→"): string {
  const parts: string[][] = [];
  (option?.flights ?? []).forEach((flight, index, flights) => {
    const from = flight.from?.code || "???";
    const to = flight.to?.code || "???";
    const current = parts[parts.length - 1];
    if (current && index > 0 && sameAirport(flights[index - 1].to, flight.from) && flight.from) current.push(to);
    else parts.push([from, to]);
  });
  return parts.map((codes) => codes.join(` ${arrow} `)).join(" / ") || "-";
}

/** The first option's route, see optionRouteText. */
export const estimateRouteText = (values: OptionsOnly, arrow = "→") => optionRouteText(values.options[0], arrow);

/** Ticket type of each option, e.g. "Round-Trip", or "One-Way / Round-Trip" when options differ. */
export function estimateTripTypesText(values: OptionsOnly): string {
  const labels = values.options.map((option) => tripTypeLabel(tripTypeFor(option.flights.length)));
  return Array.from(new Set(labels)).join(" / ") || "-";
}

/**
 * Typed flight time: 2h 45m, 2h45, 2:45, 0245, 245, 2h, 45m, 7 (hours), 50
 * (minutes, as no flight lasts 50 hours). Null if blank or not a duration.
 */
export function parseTypedDuration(input: string): number | null {
  const text = input.trim().toLowerCase().replace(/\s+/g, "");
  if (!text) return null;

  const hm = text.match(/^(?:(\d{1,2})h)?(?:(\d{1,2})m?)?$/);
  if (hm && (hm[1] || hm[2]) && /h|m$/.test(text)) {
    return Number(hm[1] || 0) * 60 + Number(hm[2] || 0) || null;
  }
  const colon = text.match(/^(\d{1,2}):(\d{2})$/);
  if (colon) return Number(colon[1]) * 60 + Number(colon[2]) || null;
  // Plain digits: up to 24 is hours, 25–99 minutes, 3–4 digits hours and
  // minutes like a clock (245 = 2h 45m).
  const digits = text.match(/^\d{1,4}$/);
  if (digits) {
    const number = Number(text);
    if (text.length <= 2) return (number <= 24 ? number * 60 : number) || null;
    const minutes = Number(text.slice(-2));
    return minutes < 60 ? Number(text.slice(0, -2)) * 60 + minutes || null : null;
  }
  return null;
}

/** First to last departure date of the first option, e.g. "24-Nov-26 – 29-Nov-26". */
export function estimateTravelDatesText(values: OptionsOnly): string {
  const dates = (values.options[0]?.flights ?? [])
    .map((segment) => segment.departDate)
    .filter((date) => isoToDate(date))
    .sort();
  if (dates.length === 0) return "-";
  const first = formatDocDate(dates[0]);
  const last = formatDocDate(dates[dates.length - 1]);
  return first === last ? first : `${first} – ${last}`;
}

/** The lowest Ticket Amount quoted, the same figure as on the PDF. */
export function lowestTicketAmount(values: OptionsOnly): number | null {
  const amounts = values.options
    .flatMap((option) => option.fares.map((fare) => fareTotals(fare).ticketAmount))
    .filter((amount): amount is number => amount !== null);
  return amounts.length ? Math.min(...amounts) : null;
}

/** Who the estimate is for: the client or the individual; "" if neither is set. */
export const estimateClientText = (values: Pick<TravelEstimateFormValues, "client" | "individualName">) =>
  values.client?.name || values.individualName;

export const optionAirlinesText = (values: OptionsOnly) =>
  values.options.map((option) => option.airline?.name).filter(Boolean).join(", ") || "-";

export const passengerTypeLabel = (code: string) =>
  PASSENGER_TYPE_OPTIONS.find((option) => option.code === code)?.label ?? code;

export const passengerTotal = (passengers: PassengerEntry[]) =>
  passengers.reduce((sum, entry) => sum + (entry.count || 0), 0);

export function passengersText(passengers: PassengerEntry[]): string {
  const parts = passengers.filter((entry) => entry.count > 0).map((entry) => `${entry.count} ${entry.code}`);
  return parts.length ? parts.join(", ") : "-";
}
