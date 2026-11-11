import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { pastDate } from "../applicants";
import { dateToIso, formatGdsDate, isoToDate, parseTypedDate } from "../format";

interface DateFieldProps {
  id: string;
  /** yyyy-MM-dd */
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  /** A date of birth: a typed two-digit year is never in the future (59 → 1959). */
  birthDate?: boolean;
  /** An optional date: emptying the box removes it. */
  clearable?: boolean;
  /** Smaller box, for table rows. */
  compact?: boolean;
  "aria-label"?: string;
}

/** Type a date (22OCT26, 22/10/2026…) or pick one from the calendar. */
export function DateField({
  id,
  value,
  onChange,
  invalid,
  birthDate = false,
  clearable = false,
  compact = false,
  "aria-label": ariaLabel,
}: DateFieldProps) {
  const [text, setText] = useState(formatGdsDate(value));
  const [open, setOpen] = useState(false);
  const selected = isoToDate(value) ?? undefined;

  useEffect(() => {
    setText(formatGdsDate(value));
  }, [value]);

  const commitText = () => {
    if (clearable && !text.trim()) {
      onChange("");
      return;
    }

    const typed = parseTypedDate(text);
    const parsed = typed && birthDate ? pastDate(typed) : typed;
    if (parsed) {
      onChange(parsed);
      setText(formatGdsDate(parsed));
    } else {
      // Not a date: put back the last good value.
      setText(formatGdsDate(value));
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative">
        <Input
          id={id}
          value={text}
          placeholder="DDMMMYY"
          autoComplete="off"
          aria-invalid={invalid || undefined}
          aria-label={ariaLabel}
          title="Type a date like 22OCT26 or 22/10/2026"
          className={cn("pr-9 uppercase", compact && "h-8 text-xs", invalid && "border-destructive")}
          onChange={(event) => setText(event.target.value.toUpperCase())}
          onBlur={commitText}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitText();
            }
          }}
        />
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Pick a date"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-primary hover:bg-muted"
          >
            <CalendarDays className="h-4 w-4" />
          </button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            if (!date) return;
            onChange(dateToIso(date));
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
