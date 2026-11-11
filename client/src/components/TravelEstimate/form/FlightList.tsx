import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { tripTypeFor, tripTypeLabel } from "../constants";
import {
  airportTimeZone,
  airportUtcOffsetText,
  arrivalDayOffset,
  changesCity,
  dayOffsetLabel,
  dayOffsetText,
  daysWord,
  flightMinutes,
  formatDuration,
  formatGap,
  groupJourneys,
  journeySummary,
  layoverMinutes,
  stopoverText,
  stopsLabel,
} from "../flightTimes";
import { daysBetween, retagFlightNumber, sameAirport } from "../format";
import { addFlight, applyFlightChange } from "../formModel";
import type { AirlineRef, FlightSegment, FormErrors, Journey } from "../types";
import { FLIGHT_COLUMNS, FLIGHT_GRID, FlightRow } from "./FlightRow";

const sameAirline = (a: AirlineRef | null, b: AirlineRef | null) => (a?.code ?? "") === (b?.code ?? "");

/**
 * When the option's airline changes, flights still on the old airline follow
 * it, flight numbers included (QR 605 → TK 605).
 */
export function applyAirlineChange(
  flights: FlightSegment[],
  from: AirlineRef | null,
  to: AirlineRef | null,
): FlightSegment[] {
  return flights.map((segment) =>
    !segment.carrier || sameAirline(segment.carrier, from)
      ? {
          ...segment,
          carrier: to,
          flightNumber: retagFlightNumber(segment.flightNumber, segment.carrier?.code || from?.code || "", to?.code || ""),
        }
      : segment,
  );
}

function ReadOnlyValue({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border bg-muted/60 px-2 py-1 text-xs" title={title}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}

const journeyRoute = (journey: Journey) =>
  [journey.segments[0]?.from?.code || "…", ...journey.segments.map((segment) => segment.to?.code || "…")].join(" → ");

/** Total duration, stops and stopovers of each journey worked out from the flights. */
function JourneySummaries({ journeys }: { journeys: Journey[] }) {
  return (
    <div className="space-y-1.5">
      {journeys.map((journey, index) => {
        const summary = journeySummary(journey);
        return (
          <div key={journey.id} className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium">{journeys.length > 1 ? `Journey ${index + 1}` : "Journey"}</span>
            <span className="font-mono text-xs text-muted-foreground">{journeyRoute(journey)}</span>
            <ReadOnlyValue
              label="Total duration"
              value={summary.totalMinutes !== null ? formatDuration(summary.totalMinutes) : "-"}
              title={
                summary.totalMinutes !== null
                  ? "First take-off to last landing, stopovers included, worked out in each airport's time zone"
                  : "Shown once every flight has its airports and times"
              }
            />
            <ReadOnlyValue label="Stops" value={stopsLabel(summary.stops)} />
            {summary.stopovers.length > 0 && (
              <ReadOnlyValue
                label="Via"
                value={summary.stopovers.map(stopoverText).join(", ")}
                title="Stopover airports and time on the ground"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

type Note = { text: string; warn: boolean };

/** A connecting flight: time on the ground in between. */
function connectionNote(arriving: FlightSegment, departing: FlightSegment, layover: number | null): Note {
  const airport = departing.from?.code || arriving.to?.code || "…";
  const changeOfAirport = Boolean(arriving.to && departing.from && !sameAirport(arriving.to, departing.from));
  const where = changeOfAirport
    ? `change of airport, lands ${arriving.to?.code}, departs ${departing.from?.code}`
    : `in ${airport}`;

  if (layover !== null && layover >= 0) return { text: `Stopover ${where}: ${formatDuration(layover)}`, warn: changeOfAirport };
  return { text: `Stopover in ${airport}: enter the arrival and depart times to calculate it.`, warn: false };
}

/** A flight that starts a new journey (the return, or the next city). */
function newJourneyNote(arriving: FlightSegment, departing: FlightSegment, layover: number | null): Note {
  const from = departing.from?.code || "…";
  if (layover !== null && layover < 0) {
    return { text: `Departs ${from} before the previous flight lands. Check the times and dates.`, warn: true };
  }
  if (layover !== null) {
    return { text: `New journey from ${from}, ${formatGap(layover)} after landing in ${arriving.to?.code || "…"}`, warn: false };
  }
  if (changesCity(arriving, departing) && !airportTimeZone(arriving.to)) {
    return { text: `New journey from ${from}`, warn: false };
  }
  const days = daysBetween(arriving.arrivalDate, departing.departDate);
  return {
    text: days !== null && days > 0 ? `New journey from ${from}, ${daysWord(days)} after landing` : `New journey from ${from}`,
    warn: false,
  };
}

/** Local time zones, flight time and day change for one flight. */
function FlightTimingNote({ segment }: { segment: FlightSegment }) {
  const { from, to } = segment;
  if (!from && !to) return null;

  const missingZone = [from, to].find((airport) => airport && !airportTimeZone(airport));
  if (missingZone) {
    return (
      <p className="pl-1 text-xs text-amber-600 dark:text-amber-400">
        No time zone is saved for {missingZone.code}, so the arrival can't be worked out from the duration. Enter the
        arrival date and time yourself.
      </p>
    );
  }

  const zones = [
    from && `${from.code} ${airportUtcOffsetText(from, segment.departDate, segment.departTime)}`,
    to && `${to.code} ${airportUtcOffsetText(to, segment.arrivalDate, segment.arrivalTime)}`,
  ].filter(Boolean);
  const minutes = flightMinutes(segment);
  const days = arrivalDayOffset(segment);

  const parts = [
    `Local times: ${zones.join(" → ")}`,
    minutes !== null && minutes > 0 && `Flight time ${formatDuration(minutes)}`,
    days ? `Arrives ${dayOffsetText(days)} (${dayOffsetLabel(days)})` : "",
  ].filter(Boolean);

  return <p className="pl-1 text-xs text-muted-foreground">{parts.join(" · ")}</p>;
}

interface FlightListProps {
  flights: FlightSegment[];
  defaultCarrier: AirlineRef | null;
  errors: FormErrors;
  onChange: (flights: FlightSegment[]) => void;
}

/**
 * An option's flights in order. The ticket type follows the number of
 * flights, and connecting flights are grouped into journeys automatically.
 */
export function FlightList({ flights, defaultCarrier, errors, onChange }: FlightListProps) {
  const journeys = groupJourneys(flights);
  const startsJourney = new Set(journeys.map((journey) => journey.segments[0].id));
  const tripType = tripTypeFor(flights.length);

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-sm font-semibold">Flights</h4>
        <span
          className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground"
          title="Set automatically: 1 flight is One-Way, 2 flights Round-Trip, 3 or more Multi-City"
        >
          {tripTypeLabel(tripType)}
        </span>
        <span className="text-xs text-muted-foreground">
          Set from the number of flights. Enter every time as the local time at its airport.
        </span>
      </div>

      <JourneySummaries journeys={journeys} />

      {/* Column titles, shown once on wide screens. */}
      <div className={cn(FLIGHT_GRID, "hidden text-xs font-medium text-muted-foreground xl:grid")} aria-hidden>
        {FLIGHT_COLUMNS.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>

      {flights.map((segment, index) => {
        const previous = flights[index - 1];
        const layover = previous ? layoverMinutes(previous, segment) : null;
        const note = previous
          ? startsJourney.has(segment.id)
            ? newJourneyNote(previous, segment, layover)
            : connectionNote(previous, segment, layover)
          : null;

        return (
          <div key={segment.id} className="space-y-2">
            <p className="pl-1 text-xs">
              <span className="font-semibold">Flight {index + 1}</span>
              {note && (
                <span className={cn("ml-2", note.warn ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
                  ↳ {note.text}
                </span>
              )}
            </p>
            <FlightRow
              segment={segment}
              flightLabel={`Flight ${index + 1}`}
              defaultCarrier={defaultCarrier}
              errors={errors}
              canRemove={flights.length > 1}
              onChange={(patch) => onChange(applyFlightChange(flights, index, patch))}
              onRemove={() => onChange(flights.filter((_, i) => i !== index))}
            />
            <FlightTimingNote segment={segment} />
          </div>
        );
      })}

      <Button
        type="button"
        variant="link"
        size="sm"
        className="h-auto p-0"
        onClick={() => onChange(addFlight(flights, defaultCarrier))}
      >
        <Plus className="mr-1 h-3.5 w-3.5" />
        Add connecting flight
      </Button>
    </div>
  );
}
