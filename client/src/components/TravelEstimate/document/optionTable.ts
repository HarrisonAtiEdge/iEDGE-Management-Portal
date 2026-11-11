import { tripTypeLabel } from "../constants";
import { fareTotals } from "../fareTotals";
import {
  arrivalDayOffset,
  dayOffsetLabel,
  formatDuration,
  groupJourneys,
  journeySummary,
  stopoverText,
  stopsLabel,
} from "../flightTimes";
import {
  carrierCode,
  fareDetailLines,
  fareTypesText,
  flightAirlineCode,
  formatDocDate,
  formatFlightNumber,
  formatMoney,
  formatTime24,
  optionLabel,
  optionRouteText,
  segmentRouteText,
} from "../format";
import { optionTripType } from "../formModel";
import type { QuoteOption } from "../types";

/** Flight columns of the quote table, between the option label and the rates. */
export const FLIGHT_TABLE_COLUMNS = [
  "FROM-TO",
  "FLIGHT NO.",
  "DEPART DATE",
  "ARRIVAL DATE",
  "DEPART TIME",
  "ARRIVAL TIME",
  "No. of Stops",
  "Stopover time",
  "Total duration",
  "CARRIER",
];

/** Heading of each rate's column; the price under it includes service charges and taxes. */
export const RATE_COLUMN_HEADING = "Ticket Amount";

/** Printed under every quote: the times are as airlines show them. */
export const LOCAL_TIMES_NOTE =
  "All times are local to each airport. +1 means the flight lands the next day (local date at the destination).";

export interface FlightTableRow {
  key: string;
  route: string;
  departDate: string;
  arrivalDate: string;
  departTime: string;
  /** e.g. "04:30 +1" when it lands the next day. */
  arrivalTime: string;
  carrier: string;
  /** e.g. "QR 605", "-" if not entered. */
  flightNumber: string;
  /** Set on a journey's first flight; its stops, stopover and duration cells span the journey. */
  journey: { rowSpan: number; stops: string; stopover: string; duration: string } | null;
}

export interface FareColumn {
  name: string;
  price: string;
  details: string[];
}

/** One airline option laid out as in the quote sheet. Used by the preview and the PDF. */
export interface OptionTable {
  key: string;
  label: string;
  /** Airline, route and ticket type above the flights, e.g. "QATAR AIRWAYS · KHI → DOH → KHI · ROUND-TRIP". */
  heading: string;
  rows: FlightTableRow[];
  fares: FareColumn[];
}

export function buildOptionTable(option: QuoteOption, currency: string): OptionTable {
  // Connecting flights share one stops / stopover / duration cell per journey.
  const rows: FlightTableRow[] = groupJourneys(option.flights).flatMap((journey) => {
    const summary = journeySummary(journey);
    return journey.segments.map((segment, index) => {
      const arrivalTime = formatTime24(segment.arrivalTime);
      const dayOffset = dayOffsetLabel(arrivalDayOffset(segment));
      return {
        key: segment.id,
        route: segmentRouteText(segment),
        departDate: formatDocDate(segment.departDate),
        arrivalDate: formatDocDate(segment.arrivalDate),
        departTime: formatTime24(segment.departTime) || "-",
        arrivalTime: arrivalTime ? [arrivalTime, dayOffset].filter(Boolean).join(" ") : "-",
        carrier: carrierCode(segment, option),
        flightNumber: formatFlightNumber(segment.flightNumber, flightAirlineCode(segment, option)) || "-",
        journey:
          index === 0
            ? {
                rowSpan: journey.segments.length,
                stops: stopsLabel(summary.stops),
                // One stopover per line, e.g. "DOH 2h 20m".
                stopover: summary.stopovers.length ? summary.stopovers.map(stopoverText).join("\n") : "-",
                duration: summary.totalMinutes !== null ? formatDuration(summary.totalMinutes) : "-",
              }
            : null,
      };
    });
  });

  return {
    key: option.id,
    label: optionLabel(option),
    heading: [option.airline?.name, optionRouteText(option), tripTypeLabel(optionTripType(option))]
      .filter((part) => part && part !== "-")
      .join(" · ")
      .toUpperCase(),
    rows,
    fares: option.fares.map((fare) => ({
      name: fareTypesText(fare).toUpperCase(),
      price: formatMoney(fareTotals(fare).ticketAmount, currency),
      details: fareDetailLines(fare),
    })),
  };
}
