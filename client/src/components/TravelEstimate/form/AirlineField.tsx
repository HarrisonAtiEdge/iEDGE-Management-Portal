      import { useMemo, useState } from "react";
      import { ChevronDown } from "lucide-react";
      import { AddAirlineDialog } from "../lookups/AddLookupDialog";
      import { LookupInput } from "../lookups/LookupInput";
      import { filterAirlines } from "../lookups/lookupSearch";
      import { useTravelLookup } from "../lookups/useTravelLookup";
      import { airlineLabel } from "../format";
      import type { AirlineOption, AirlineRef } from "../types";

      interface AirlineFieldProps {
        id: string;
        value: AirlineRef | null;
        onChange: (value: AirlineRef | null) => void;
        /** Show only the code once chosen (narrow table columns). */
        compact?: boolean;
        placeholder?: string;
        invalid?: boolean;
        "aria-label"?: string;
      }

      const toAirlineRef = (airline: AirlineOption): AirlineRef => ({ code: airline.code, name: airline.name });

      /** Searchable airline picker; anything missing can be added from the list. */
      export function AirlineField({
        id,
        value,
        onChange,
        compact = false,
        placeholder = "Airline",
        invalid,
        "aria-label": ariaLabel,
      }: AirlineFieldProps) {
        const { items, loading, seeding, error } = useTravelLookup("airlines");
        const [addQuery, setAddQuery] = useState<string | null>(null);

        // Alliances can't operate a flight.
        const airlines = useMemo(() => items.filter((airline) => airline.kind === "airline"), [items]);

        return (
          <>
            <LookupInput
              id={id}
              aria-label={ariaLabel}
              items={airlines}
              getKey={(airline) => airline.code}
              filter={filterAirlines}
              displayValue={compact ? (value?.code ?? "") : airlineLabel(value)}
              placeholder={placeholder}
              loading={loading || seeding}
              loadingText={seeding ? "Setting up the airline list for first use…" : "Loading airlines…"}
              error={error}
              invalid={invalid}
              onSelect={(airline) => onChange(toAirlineRef(airline))}
              onClear={compact ? undefined : () => onChange(null)}
              onAddNew={(query) => setAddQuery(query)}
              addNewLabel={(query) => (query ? `Add "${query}" as a new airline` : "Add a new airline")}
              trailingIcon={<ChevronDown className="h-4 w-4 shrink-0 text-primary" aria-hidden />}
              renderOption={(airline) => (
                <>
                  <span className="w-10 shrink-0 font-mono text-xs font-semibold">{airline.code}</span>
                  <span className="flex-1 truncate">{airline.name}</span>
                </>
              )}
            />
            <AddAirlineDialog
              open={addQuery !== null}
              initialQuery={addQuery ?? ""}
              onOpenChange={(open) => !open && setAddQuery(null)}
              onAdded={(airline) => {
                onChange(toAirlineRef(airline));
                setAddQuery(null);
              }}
            />
          </>
        );
      }
