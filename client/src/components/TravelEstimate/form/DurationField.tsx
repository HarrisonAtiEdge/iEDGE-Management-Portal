import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatDuration, MAX_FLIGHT_MINUTES } from "../flightTimes";
import { parseTypedDuration } from "../format";

interface DurationFieldProps {
  id: string;
  value: number | null;
  onChange: (value: number | null) => void;
  "aria-label"?: string;
}

const display = (value: number | null) => (value ? formatDuration(value) : "");

/** Flight time box: type 2h 45m, 2:45 or 245; tidied up when you leave it. */
export function DurationField({ id, value, onChange, "aria-label": ariaLabel }: DurationFieldProps) {
  const [text, setText] = useState(display(value));

  useEffect(() => {
    setText(display(value));
  }, [value]);

  const commit = () => {
    if (!text.trim()) {
      if (value !== null) onChange(null);
      return;
    }
    const minutes = parseTypedDuration(text);
    if (minutes !== null && minutes <= MAX_FLIGHT_MINUTES) {
      if (minutes !== value) onChange(minutes);
      setText(display(minutes));
    } else {
      // Not a duration: put back the last good value.
      setText(display(value));
    }
  };

  return (
    <div className="relative">
      <Input
        id={id}
        value={text}
        placeholder="e.g. 2h 45m"
        autoComplete="off"
        aria-label={ariaLabel}
        title="Time in the air, e.g. 2h 45m, 2:45 or 245"
        className="pr-8"
        onChange={(event) => setText(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
        }}
      />
      <Timer className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" aria-hidden />
    </div>
  );
}
