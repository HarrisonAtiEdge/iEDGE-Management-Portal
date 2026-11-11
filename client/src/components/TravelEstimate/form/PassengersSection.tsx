import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { MAX_PASSENGERS_PER_TYPE, PASSENGER_TYPE_OPTIONS } from "../constants";
import { passengerTotal } from "../format";
import { createPassenger, errorKeys } from "../formModel";
import type { FormErrors, PassengerEntry } from "../types";

interface PassengersSectionProps {
  value: PassengerEntry[];
  onChange: (value: PassengerEntry[]) => void;
  errors: FormErrors;
}

export function PassengersSection({ value, onChange, errors }: PassengersSectionProps) {
  const [open, setOpen] = useState(true);
  const usedCodes = new Set(value.map((entry) => entry.code));
  const nextFreeCode = PASSENGER_TYPE_OPTIONS.find((option) => !usedCodes.has(option.code))?.code;
  const total = passengerTotal(value);
  const sectionError = errors[errorKeys.passengers];
  const hasErrors = Boolean(sectionError) || value.some((entry) => errors[errorKeys.passenger(entry.id)]);

  useEffect(() => {
    if (hasErrors) setOpen(true);
  }, [hasErrors]);

  const update = (id: string, patch: Partial<PassengerEntry>) =>
    onChange(value.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));

  const remove = (id: string) => onChange(value.filter((entry) => entry.id !== id));

  return (
    <Card className={cn(open && "ring-1 ring-foreground/80")}>
      <CardHeader className="p-0">
        <button
          type="button"
          className="flex w-full items-center justify-between px-6 py-4 text-left"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <CardTitle className="text-lg">Passengers</CardTitle>
          <span className="flex items-center gap-3 text-sm text-muted-foreground">
            {!open && `${total} passenger${total === 1 ? "" : "s"}`}
            {open ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />}
          </span>
        </button>
      </CardHeader>

      {open && (
        <CardContent className="space-y-3 border-t pt-4">
          <p className="text-sm font-semibold">
            Passenger Type Codes (PTCs)<span className="ml-0.5 text-destructive">*</span>
          </p>

          <div className="flex flex-wrap gap-3">
            {value.map((entry) => {
              const entryError = errors[errorKeys.passenger(entry.id)];
              return (
                <div key={entry.id} className="space-y-1">
                  <div
                    className={cn(
                      "flex items-center overflow-hidden rounded-md border border-input",
                      entryError && "border-destructive",
                    )}
                  >
                    <Input
                      type="number"
                      min={0}
                      max={MAX_PASSENGERS_PER_TYPE}
                      inputMode="numeric"
                      aria-label={`Number of ${entry.code || "passengers"}`}
                      className="h-9 w-20 rounded-none border-0 border-r focus-visible:ring-0 focus-visible:ring-offset-0"
                      value={entry.count}
                      onChange={(event) =>
                        update(entry.id, {
                          count: Math.max(0, Math.floor(Number(event.target.value) || 0)),
                        })
                      }
                    />
                    <Select value={entry.code || undefined} onValueChange={(code) => update(entry.id, { code })}>
                      <SelectTrigger
                        aria-label="Passenger type"
                        className="h-9 w-24 rounded-none border-0 focus:ring-0 focus:ring-offset-0"
                      >
                        <SelectValue placeholder="Type">{entry.code || undefined}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {PASSENGER_TYPE_OPTIONS.map((option) => (
                          <SelectItem
                            key={option.code}
                            value={option.code}
                            disabled={option.code !== entry.code && usedCodes.has(option.code)}
                          >
                            {option.code} · {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {value.length > 1 && (
                      <button
                        type="button"
                        aria-label={`Remove ${entry.code || "passenger type"}`}
                        className="px-1.5 text-muted-foreground hover:text-foreground"
                        onClick={() => remove(entry.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  {entryError && <p className="text-xs text-destructive">{entryError}</p>}
                </div>
              );
            })}
          </div>

          {sectionError && <p className="text-sm text-destructive">{sectionError}</p>}

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="link"
              className="h-auto p-0"
              disabled={!nextFreeCode}
              onClick={() => nextFreeCode && onChange([...value, createPassenger(nextFreeCode, 1)])}
            >
              Add passengers
            </Button>
            <span className="text-sm text-muted-foreground">
              Total: {total} passenger{total === 1 ? "" : "s"}
            </span>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
