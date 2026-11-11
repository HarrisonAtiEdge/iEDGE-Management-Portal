      import { useMemo, useState } from "react";
      import { MapPin } from "lucide-react";
      import { AddAirportDialog } from "../lookups/AddLookupDialog";
      import { LookupInput } from "../lookups/LookupInput";
      import { filterAirports } from "../lookups/lookupSearch";
      import { useTravelLookup } from "../lookups/useTravelLookup";
      import { airportLabel } from "../format";
      import type { AirportOption, AirportRef } from "../types";

      const toAirportRef = (airport: AirportOption): AirportRef => ({
        code: airport.code,
        cityCode: airport.cityCode,
        name: airport.name,
        timeZone: airport.timeZone,
      });

      interface AirportFieldProps {
        id: string;
        value: AirportRef | null;
        onChange: (value: AirportRef | null) => void;
        invalid?: boolean;
        "aria-label"?: string;
      }

      export function AirportField({ id, value, onChange, invalid, "aria-label": ariaLabel }: AirportFieldProps) {
        const { items, loading, seeding, error } = useTravelLookup("airports");
        const [addQuery, setAddQuery] = useState<string | null>(null);

        // City codes that group several airports, e.g. LON for LHR, LGW, STN.
        const multiAirportCities = useMemo(() => {
          const counts = new Map<string, number>();
          items.forEach((airport) => counts.set(airport.cityCode, (counts.get(airport.cityCode) ?? 0) + 1));
          return new Set(Array.from(counts).filter(([, count]) => count > 1).map(([cityCode]) => cityCode));
        }, [items]);

        return (
          <>
            <LookupInput
              id={id}
              aria-label={ariaLabel}
              items={items}
              getKey={(airport) => airport.code}
              filter={filterAirports}
              displayValue={airportLabel(value)}
              placeholder="City or Airport"
              loading={loading || seeding}
              loadingText={seeding ? "Setting up the airport list for first use…" : "Loading airports…"}
              error={error}
              invalid={invalid}
              onSelect={(airport) => onChange(toAirportRef(airport))}
              onClear={() => onChange(null)}
              onAddNew={(query) => setAddQuery(query)}
              addNewLabel={(query) => (query ? `Add "${query}" as a new city/airport` : "Add a new city/airport")}
              trailingIcon={<MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />}
              renderOption={(airport) => {
                const isCityGroup = airport.code === airport.cityCode && multiAirportCities.has(airport.cityCode);
                return (
                  <>
                    <span className="w-10 shrink-0 font-mono text-xs font-semibold">{airport.code}</span>
                    <span className="flex-1 truncate">{airport.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {isCityGroup
                        ? "All airports"
                        : airport.cityCode !== airport.code
                          ? `City ${airport.cityCode}`
                          : ""}
                    </span>
                  </>
                );
              }}
            />
            <AddAirportDialog
              open={addQuery !== null}
              initialQuery={addQuery ?? ""}
              onOpenChange={(open) => !open && setAddQuery(null)}
              onAdded={(airport) => {
                onChange(toAirportRef(airport));
                setAddQuery(null);
              }}
            />
          </>
        );
      }
