import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { retagFlightNumber } from "../format";
import { errorKeys } from "../formModel";
import type { AirlineRef, FlightSegment, FormErrors } from "../types";
import { AirlineField } from "./AirlineField";
import { AirportField } from "./AirportField";
import { DateField } from "./DateField";
import { DurationField } from "./DurationField";
import { FieldShell } from "./FieldShell";
import { FlightNumberField } from "./FlightNumberField";
import { TimeField } from "./TimeField";

/** From | To | Flight no. | Depart date | Depart time | Duration | Arrival date | Arrival time | Carrier | remove */
export const FLIGHT_GRID =
  "grid grid-cols-1 gap-x-2 gap-y-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,0.95fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.95fr)_minmax(0,0.8fr)_minmax(0,0.7fr)_2.25rem]";

export const FLIGHT_COLUMNS = [
  "From",
  "To",
  "Flight No.",
  "Depart date",
  "Depart time",
  "Duration",
  "Arrival date",
  "Arrival time",
  "Carrier",
];

interface FlightRowProps {
  segment: FlightSegment;
  flightLabel: string;
  defaultCarrier: AirlineRef | null;
  errors: FormErrors;
  canRemove: boolean;
  onChange: (patch: Partial<FlightSegment>) => void;
  onRemove: () => void;
}

export function FlightRow({
  segment,
  flightLabel,
  defaultCarrier,
  errors,
  canRemove,
  onChange,
  onRemove,
}: FlightRowProps) {
  const fieldId = (name: string) => `flight-${segment.id}-${name}`;
  const error = (field: keyof FlightSegment) => errors[errorKeys.segment(segment.id, field)];
  const airlineCode = segment.carrier?.code || defaultCarrier?.code || "";

  // A new carrier moves the flight number to its code: QR 605 → TK 605.
  const setCarrier = (carrier: AirlineRef | null) =>
    onChange({
      carrier,
      flightNumber: retagFlightNumber(segment.flightNumber, airlineCode, carrier?.code || defaultCarrier?.code || ""),
    });

  return (
    <div className={FLIGHT_GRID}>
      <FieldShell htmlFor={fieldId("from")} label="From" required hideLabelOnWide error={error("from")}>
        <AirportField
          id={fieldId("from")}
          aria-label={`${flightLabel} from`}
          value={segment.from}
          invalid={Boolean(error("from"))}
          onChange={(from) => onChange({ from })}
        />
      </FieldShell>

      <FieldShell htmlFor={fieldId("to")} label="To" required hideLabelOnWide error={error("to")}>
        <AirportField
          id={fieldId("to")}
          aria-label={`${flightLabel} to`}
          value={segment.to}
          invalid={Boolean(error("to"))}
          onChange={(to) => onChange({ to })}
        />
      </FieldShell>

      <FieldShell
        htmlFor={fieldId("flight-number")}
        label="Flight No."
        hideLabelOnWide
        error={error("flightNumber")}
        info="Starts with the airline code; type the number after it, or pick a saved one."
      >
        <FlightNumberField
          id={fieldId("flight-number")}
          aria-label={`${flightLabel} flight number`}
          value={segment.flightNumber}
          airlineCode={airlineCode}
          invalid={Boolean(error("flightNumber"))}
          onChange={(flightNumber) => onChange({ flightNumber })}
        />
      </FieldShell>

      <FieldShell
        htmlFor={fieldId("depart-date")}
        label="Depart date"
        required
        hideLabelOnWide
        error={error("departDate")}
      >
        <DateField
          id={fieldId("depart-date")}
          value={segment.departDate}
          invalid={Boolean(error("departDate"))}
          onChange={(departDate) => onChange({ departDate })}
        />
      </FieldShell>

      <FieldShell htmlFor={fieldId("depart-time")} label="Depart time" hideLabelOnWide error={error("departTime")}>
        <TimeField
          id={fieldId("depart-time")}
          aria-label={`${flightLabel} depart time`}
          value={segment.departTime}
          invalid={Boolean(error("departTime"))}
          onChange={(departTime) => onChange({ departTime })}
        />
      </FieldShell>

      <FieldShell
        htmlFor={fieldId("duration")}
        label="Duration"
        hideLabelOnWide
        info="Time in the air. Enter it to fill in the arrival, or enter the arrival time and it's worked out."
      >
        <DurationField
          id={fieldId("duration")}
          aria-label={`${flightLabel} duration`}
          value={segment.durationMinutes}
          onChange={(durationMinutes) => onChange({ durationMinutes })}
        />
      </FieldShell>

      <FieldShell
        htmlFor={fieldId("arrival-date")}
        label="Arrival date"
        required
        hideLabelOnWide
        error={error("arrivalDate")}
      >
        <DateField
          id={fieldId("arrival-date")}
          value={segment.arrivalDate}
          invalid={Boolean(error("arrivalDate"))}
          onChange={(arrivalDate) => onChange({ arrivalDate })}
        />
      </FieldShell>

      <FieldShell htmlFor={fieldId("arrival-time")} label="Arrival time" hideLabelOnWide error={error("arrivalTime")}>
        <TimeField
          id={fieldId("arrival-time")}
          aria-label={`${flightLabel} arrival time`}
          value={segment.arrivalTime}
          invalid={Boolean(error("arrivalTime"))}
          onChange={(arrivalTime) => onChange({ arrivalTime })}
        />
      </FieldShell>

      <FieldShell htmlFor={fieldId("carrier")} label="Carrier" hideLabelOnWide>
        <AirlineField
          id={fieldId("carrier")}
          aria-label={`${flightLabel} carrier`}
          compact
          placeholder={defaultCarrier?.code ?? "Code"}
          value={segment.carrier}
          onChange={setCarrier}
        />
      </FieldShell>


      <div className="flex items-end sm:col-span-2 xl:col-span-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-primary"
          disabled={!canRemove}
          aria-label={`Remove ${flightLabel}`}
          title={canRemove ? `Remove ${flightLabel}` : "A journey needs at least one flight"}
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
