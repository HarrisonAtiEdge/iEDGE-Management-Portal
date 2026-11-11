import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { MAX_FLIGHT_NUMBER_LENGTH } from "../constants";
import { flightNumberKey, formatFlightNumber } from "../format";
import { useSavedFlightNumbers, type SavedFlightNumber } from "../lookups/flightNumbers";

const MAX_SUGGESTIONS = 8;

interface FlightNumberFieldProps {
  id: string;
  value: string;
  /** The flight's airline code, put in front of the number, e.g. QR. */
  airlineCode: string;
  invalid?: boolean;
  onChange: (value: string) => void;
  "aria-label"?: string;
}

/**
 * Saved flight numbers matching what's typed: numbers starting with it
 * first, then any containing it. With nothing past the airline code typed,
 * that airline's numbers, most recently used first.
 */
function suggestionsFor(items: SavedFlightNumber[], value: string, airlineCode: string) {
  const typed = flightNumberKey(value);
  const onlyCode = !typed || typed === airlineCode;
  const matches = onlyCode
    ? items.filter((item) => !airlineCode || item.airlineCode === airlineCode)
    : [
        ...items.filter((item) => item.key.startsWith(typed)),
        ...items.filter((item) => !item.key.startsWith(typed) && item.key.includes(typed)),
      ];
  // Nothing to offer when the number typed is already a saved one.
  return matches.filter((item) => item.key !== typed).slice(0, MAX_SUGGESTIONS);
}

/** Flight number box. Starts with the airline's code; type the number, or pick a saved one. */
export function FlightNumberField({
  id,
  value,
  airlineCode,
  invalid,
  onChange,
  "aria-label": ariaLabel,
}: FlightNumberFieldProps) {
  const { items } = useSavedFlightNumbers();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const anchorRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => suggestionsFor(items, value, airlineCode), [items, value, airlineCode]);
  const showList = open && suggestions.length > 0;
  const listboxId = `${id}-suggestions`;

  useEffect(() => {
    setActiveIndex(0);
  }, [value]);

  const choose = (item: SavedFlightNumber | undefined) => {
    if (!item) return;
    onChange(item.number);
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) setOpen(true);
        else setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        break;
      case "Enter":
        if (showList) {
          event.preventDefault();
          choose(suggestions[activeIndex]);
        }
        break;
      case "Escape":
        if (showList) {
          event.preventDefault();
          setOpen(false);
        }
        break;
    }
  };

  return (
    <Popover open={showList} onOpenChange={(next) => !next && setOpen(false)}>
      <PopoverAnchor asChild>
        <div ref={anchorRef}>
          <input
            id={id}
            role="combobox"
            aria-expanded={showList}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-invalid={invalid || undefined}
            aria-label={ariaLabel}
            autoComplete="off"
            spellCheck={false}
            maxLength={MAX_FLIGHT_NUMBER_LENGTH}
            placeholder={airlineCode ? `${airlineCode} 000` : "e.g. QR 605"}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-2 py-2 font-mono text-sm uppercase ring-offset-background placeholder:font-sans placeholder:normal-case placeholder:italic placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              invalid && "border-destructive focus-visible:ring-destructive",
            )}
            value={value}
            onFocus={() => {
              // The airline's code is filled in, so only the number needs typing.
              if (!value.trim() && airlineCode) onChange(`${airlineCode} `);
              setOpen(true);
            }}
            onChange={(event) => {
              onChange(event.target.value.toUpperCase());
              setOpen(true);
            }}
            onBlur={() => {
              setOpen(false);
              const tidy = formatFlightNumber(value, airlineCode);
              if (tidy !== value) onChange(tidy);
            }}
            onKeyDown={handleKeyDown}
          />
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-auto min-w-[14rem] p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          if (anchorRef.current?.contains(event.target as Node)) event.preventDefault();
        }}
        // Keep focus in the text box while clicking a suggestion.
        onMouseDown={(event) => event.preventDefault()}
      >
        <div id={listboxId} role="listbox" aria-label="Saved flight numbers" className="max-h-64 overflow-y-auto py-1">
          <div className="px-3 pb-1 pt-1.5 text-xs font-medium text-muted-foreground">Saved flight numbers</div>
          {suggestions.map((item, index) => (
            <div
              key={item.key}
              role="option"
              aria-selected={index === activeIndex}
              className={cn(
                "flex cursor-pointer items-center gap-3 px-3 py-1.5 text-sm",
                index === activeIndex && "bg-accent text-accent-foreground",
              )}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(item)}
            >
              <span className="font-mono font-semibold">{item.number}</span>
              {item.from && item.to && (
                <span className="font-mono text-xs text-muted-foreground">
                  {item.from} → {item.to}
                </span>
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
