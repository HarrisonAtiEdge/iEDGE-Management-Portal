// Flight times across time zones.
//
// Every date and time on a flight is local to its airport, the way airlines
// print them: KHI 22:00 → DOH 23:30 is a 2h 30m flight because Doha is two
// hours behind Karachi. To get durations, stopovers and arrival dates right,
// each local time is turned into an exact instant using its airport's time
// zone (with daylight saving for that date), and instants are compared.
import { addDaysIso, daysBetween, isValidTime } from "./format";
import {
  builtInTimeZone,
  formatUtcOffset,
  isKnownTimeZone,
  utcOffsetMinutes,
  zonedDateTime,
  zonedToUtc,
} from "./timeZones";
import type { AirportRef, FlightSegment, Journey } from "./types";

/** No scheduled flight lasts a day; the longest are about 19 hours. */
export const MAX_FLIGHT_MINUTES = 24 * 60;

const MINUTE = 60_000;

/** The airport's time zone: the one saved with it, else the built-in table. "" if unknown. */
export function airportTimeZone(airport: AirportRef | null): string {
  if (!airport) return "";
  if (airport.timeZone && isKnownTimeZone(airport.timeZone)) return airport.timeZone;
  const builtIn = builtInTimeZone(airport.code, airport.cityCode);
  return isKnownTimeZone(builtIn) ? builtIn : "";
}

/** Take-off as UTC milliseconds; null if the date, time or From zone is missing. */
export function departureUtc(segment: FlightSegment): number | null {
  const zone = airportTimeZone(segment.from);
  return zone && segment.departTime ? zonedToUtc(segment.departDate, segment.departTime, zone) : null;
}

/** Landing as UTC milliseconds; null if the date, time or To zone is missing. */
export function arrivalUtc(segment: FlightSegment): number | null {
  const zone = airportTimeZone(segment.to);
  return zone && segment.arrivalTime ? zonedToUtc(segment.arrivalDate, segment.arrivalTime, zone) : null;
}

/** Time in the air; null if it can't be worked out. Negative means the times don't add up. */
export function flightMinutes(segment: FlightSegment): number | null {
  const departs = departureUtc(segment);
  const lands = arrivalUtc(segment);
  return departs === null || lands === null ? null : Math.round((lands - departs) / MINUTE);
}

/**
 * The local arrival date at the destination, from the departure date and
 * time, the arrival time and both airports' time zones. A flight lasts less
 * than a day, so of the dates around the departure date exactly one gives a
 * flight time between 0 and 24 hours: usually the same day or the next, the
 * day after that on long eastbound flights, the day before when flying east
 * to west over the date line. Null if a time or a zone is missing.
 */
export function inferArrivalDate(segment: FlightSegment): string | null {
  const departs = departureUtc(segment);
  const zone = airportTimeZone(segment.to);
  if (departs === null || !zone || !segment.arrivalTime || !isValidTime(segment.arrivalTime)) return null;

  for (let days = -1; days <= 2; days += 1) {
    const date = addDaysIso(segment.departDate, days);
    const lands = zonedToUtc(date, segment.arrivalTime, zone);
    if (lands !== null && lands > departs && lands - departs <= MAX_FLIGHT_MINUTES * MINUTE) return date;
  }
  return null;
}

/**
 * Local arrival date and time at the destination for a flight of the given
 * length, e.g. KHI 22:00 + 9h 30m → LHR 02:30 the next day. Null if the
 * departure time or either zone is missing.
 */
export function arrivalFromDuration(
  segment: FlightSegment,
  minutes: number,
): { arrivalDate: string; arrivalTime: string } | null {
  const departs = departureUtc(segment);
  const zone = airportTimeZone(segment.to);
  if (departs === null || !zone || !(minutes > 0)) return null;
  const local = zonedDateTime(departs + minutes * MINUTE, zone);
  return local && { arrivalDate: local.date, arrivalTime: local.time };
}

/** A flight time that makes sense: more than 0 and at most MAX_FLIGHT_MINUTES. */
export const isPlausibleFlightTime = (minutes: number | null): minutes is number =>
  minutes !== null && minutes > 0 && minutes <= MAX_FLIGHT_MINUTES;

/** Days between the local departure and arrival dates: 1 for an overnight flight. */
export const arrivalDayOffset = (segment: FlightSegment) => daysBetween(segment.departDate, segment.arrivalDate);

/** 1 → "+1", -1 → "-1", 0 → "". */
export const dayOffsetLabel = (days: number | null) => (!days ? "" : days > 0 ? `+${days}` : String(days));

export function dayOffsetText(days: number | null): string {
  if (!days) return "";
  if (days === 1) return "next day";
  if (days === -1) return "previous day";
  return days > 0 ? `${days} days later` : `${-days} days earlier`;
}

/** e.g. "UTC+5" for the airport at the given moment (or noon on the date). "" if unknown. */
export function airportUtcOffsetText(airport: AirportRef | null, isoDate: string, time: string): string {
  const zone = airportTimeZone(airport);
  if (!zone) return "";
  const instant = zonedToUtc(isoDate, time || "12:00", zone);
  const offset = instant === null ? null : utcOffsetMinutes(instant, zone);
  return offset === null ? "" : formatUtcOffset(offset);
}

/** True when the next flight leaves from another city than the one landed in, e.g. lands ZRH, leaves MUC. */
export function changesCity(arriving: FlightSegment, departing: FlightSegment): boolean {
  const landedAt = arriving.to;
  const leavesFrom = departing.from;
  if (!landedAt || !leavesFrom) return false;
  return landedAt.code !== leavesFrom.code && landedAt.cityCode !== leavesFrom.cityCode;
}

function localMinutes(isoDate: string, time: string): number | null {
  if (!time || !isValidTime(time)) return null;
  const days = daysBetween("2000-01-01", isoDate);
  if (days === null) return null;
  const [hours, minutes] = time.split(":").map(Number);
  return days * 1440 + hours * 60 + minutes;
}

/**
 * Time on the ground between landing on one flight and taking off on the
 * next. Uses the airports' time zones when known, which also covers changing
 * to an airport in another zone and clocks changing during the stopover.
 * Without zones it subtracts the two local times, which is only right when
 * both are in the same city. Null if a date, time or zone is missing.
 */
export function layoverMinutes(arriving: FlightSegment, departing: FlightSegment): number | null {
  const lands = arrivalUtc(arriving);
  const takesOff = departureUtc(departing);
  if (lands !== null && takesOff !== null) return Math.round((takesOff - lands) / MINUTE);
  if (changesCity(arriving, departing)) return null;
  const landed = localMinutes(arriving.arrivalDate, arriving.arrivalTime);
  const leaves = localMinutes(departing.departDate, departing.departTime);
  return landed === null || leaves === null ? null : leaves - landed;
}

/**
 * Moves a departure to the next day (or the one after) when, on its current
 * date, it would leave before the previous flight lands: land 23:30, next
 * flight 01:15 means 01:15 the following day. Otherwise unchanged.
 */
export function departAfterLanding(arriving: FlightSegment, departing: FlightSegment): FlightSegment {
  const layover = layoverMinutes(arriving, departing);
  if (layover === null || layover >= 0) return departing;
  for (let days = 1; days <= 2; days += 1) {
    const moved = { ...departing, departDate: addDaysIso(departing.departDate, days) };
    const movedLayover = layoverMinutes(arriving, moved);
    if (movedLayover !== null && movedLayover >= 0) return moved;
  }
  return departing;
}

/** Longest time on the ground that still counts as a connection rather than a new journey. */
export const MAX_CONNECTION_MINUTES = 24 * 60;

const sameCity = (a: AirportRef | null, b: AirportRef | null) =>
  Boolean(a && b && (a.code === b.code || a.cityCode === b.cityCode));

/**
 * True when the next flight continues the same journey: it leaves from the
 * city just landed in, within 24 hours. With the times unknown, a departure
 * the same local day counts.
 */
export function isConnection(arriving: FlightSegment, departing: FlightSegment): boolean {
  if (!arriving.to || !departing.from || changesCity(arriving, departing)) return false;
  const layover = layoverMinutes(arriving, departing);
  if (layover !== null) return layover >= 0 && layover < MAX_CONNECTION_MINUTES;
  const days = daysBetween(arriving.arrivalDate, departing.departDate);
  return days !== null && days <= 0;
}

/**
 * Splits an option's flights into journeys: connecting flights stay together
 * (KHI → DOH → IST is one journey with a stop in DOH); a flight days later,
 * from another city, or heading back to where the journey began starts a new
 * one (IST → KHI after a week is the return journey).
 */
export function groupJourneys(flights: FlightSegment[]): Journey[] {
  const journeys: Journey[] = [];
  flights.forEach((flight, index) => {
    const current = journeys[journeys.length - 1];
    const goesBack = current && sameCity(flight.to, current.segments[0].from);
    if (current && index > 0 && isConnection(flights[index - 1], flight) && !goesBack) {
      current.segments.push(flight);
    } else {
      journeys.push({ id: flight.id, segments: [flight] });
    }
  });
  return journeys;
}

/** 1 → "1 day", 3 → "3 days". */
export const daysWord = (days: number) => `${days} day${days === 1 ? "" : "s"}`;

/** Gap between journeys, e.g. "6 days 4h", "18h 30m". */
export function formatGap(minutes: number): string {
  const days = Math.floor(minutes / 1440);
  if (days === 0) return formatDuration(minutes);
  const hours = Math.floor((minutes % 1440) / 60);
  return `${daysWord(days)}${hours ? ` ${hours}h` : ""}`;
}

export const journeyStops = (journey: Journey) => Math.max(0, journey.segments.length - 1);

/** Ground time per connection; null where it can't be worked out. */
export function journeyLayovers(journey: Journey): (number | null)[] {
  return journey.segments
    .slice(1)
    .map((segment, index) => layoverMinutes(journey.segments[index], segment));
}

export interface Stopover {
  /** Where the previous flight lands, e.g. DOH. */
  arrivesAt: string;
  /** Where the next flight leaves from; differs from arrivesAt on a change of airport. */
  departsFrom: string;
  minutes: number | null;
}

export interface JourneySummary {
  stops: number;
  stopovers: Stopover[];
  /** First take-off to last landing, stopovers included; null if any time or zone is missing. */
  totalMinutes: number | null;
}

export function journeySummary(journey: Journey): JourneySummary {
  const { segments } = journey;
  const layovers = journeyLayovers(journey);
  const stopovers = segments.slice(1).map((segment, index) => ({
    arrivesAt: segments[index].to?.code || "?",
    departsFrom: segment.from?.code || segments[index].to?.code || "?",
    minutes: layovers[index],
  }));

  const first = segments[0];
  const last = segments[segments.length - 1];
  const start = first ? departureUtc(first) : null;
  const end = last ? arrivalUtc(last) : null;
  const total = start !== null && end !== null ? Math.round((end - start) / MINUTE) : null;

  return {
    stops: journeyStops(journey),
    stopovers,
    totalMinutes: total !== null && total > 0 ? total : null,
  };
}

/** 280 → "4h 40m", 45 → "45m". */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h ${String(rest).padStart(2, "0")}m` : `${rest}m`;
}

/** 0 → "Non-stop", 1 → "1 stop", 2 → "2 stops". */
export const stopsLabel = (stops: number) => (stops === 0 ? "Non-stop" : `${stops} stop${stops === 1 ? "" : "s"}`);

/** e.g. "DOH 2h 20m", "ZRH/MUC 5h 10m" on a change of airport, "DOH" when the time isn't known. */
export function stopoverText(stopover: Stopover): string {
  const where =
    stopover.departsFrom === stopover.arrivesAt ? stopover.arrivesAt : `${stopover.arrivesAt}/${stopover.departsFrom}`;
  return stopover.minutes !== null && stopover.minutes >= 0 ? `${where} ${formatDuration(stopover.minutes)}` : where;
}

/** e.g. "DOH 2h 20m, IST 1h 05m"; "-" for a non-stop journey. */
export function journeyStopoverText(journey: Journey, separator = ", "): string {
  const { stopovers } = journeySummary(journey);
  return stopovers.length ? stopovers.map(stopoverText).join(separator) : "-";
}
