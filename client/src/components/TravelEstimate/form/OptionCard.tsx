import { Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { optionLabel } from "../format";
import { errorKeys } from "../formModel";
import type { AirlineRef, FormErrors, QuoteOption } from "../types";
import { AirlineField } from "./AirlineField";
import { ExpiryField } from "./ExpiryField";
import { FaresEditor } from "./FaresEditor";
import { FieldShell } from "./FieldShell";
import { applyAirlineChange, FlightList } from "./FlightList";

interface OptionCardProps {
  option: QuoteOption;
  index: number;
  currency: string;
  errors: FormErrors;
  canRemove: boolean;
  onChange: (option: QuoteOption) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

export function OptionCard({
  option,
  index,
  currency,
  errors,
  canRemove,
  onChange,
  onRemove,
  onDuplicate,
}: OptionCardProps) {
  const fieldId = (name: string) => `option-${option.id}-${name}`;
  const airlineError = errors[errorKeys.optionAirline(option.id)];
  const autoLabel = optionLabel({ ...option, label: "" });

  const setAirline = (airline: AirlineRef | null) =>
    onChange({ ...option, airline, flights: applyAirlineChange(option.flights, option.airline, airline) });

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="text-lg">
          Option {index + 1}
          {option.airline && <span className="ml-2 font-normal text-muted-foreground">· {option.airline.name}</span>}
        </CardTitle>
        <div className="flex gap-1">
          <Button type="button" variant="outline" size="sm" onClick={onDuplicate}>
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            Duplicate
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canRemove}
            title={canRemove ? "Remove this option" : "An estimate needs at least one option"}
            onClick={onRemove}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Remove
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:max-w-5xl lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)]">
          <FieldShell htmlFor={fieldId("airline")} label="Airline" required error={airlineError}>
            <AirlineField
              id={fieldId("airline")}
              value={option.airline}
              invalid={Boolean(airlineError)}
              placeholder="e.g. Qatar Airways"
              onChange={setAirline}
            />
          </FieldShell>
          <FieldShell
            htmlFor={fieldId("label")}
            label="Option label"
            info="Shown beside the flights in the estimate. Leave blank to use the first city and airline code."
          >
            <Input
              id={fieldId("label")}
              value={option.label}
              placeholder={autoLabel || "e.g. KHI-QR"}
              onChange={(event) => onChange({ ...option, label: event.target.value })}
            />
          </FieldShell>
          <FieldShell
            htmlFor={fieldId("expiry")}
            label="Expiry"
            info="How long this ticket can be held: until a date, or for a number of hours or minutes."
          >
            <ExpiryField
              id={fieldId("expiry")}
              value={option.expiry}
              onChange={(expiry) => onChange({ ...option, expiry })}
            />
          </FieldShell>
        </div>

        <FlightList
          flights={option.flights}
          defaultCarrier={option.airline}
          errors={errors}
          onChange={(flights) => onChange({ ...option, flights })}
        />

        <Separator />

        <div className="space-y-2">
          <h3 className="font-semibold">Rates</h3>
          <FaresEditor
            fares={option.fares}
            currency={currency}
            errors={errors}
            onChange={(fares) => onChange({ ...option, fares })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
