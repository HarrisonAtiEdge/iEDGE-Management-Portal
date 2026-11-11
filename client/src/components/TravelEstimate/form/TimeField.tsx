import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatTime24, isValidTime, parseTypedTime } from "../format";

interface TimeFieldProps {
  id: string;
  /** HH:mm, "" for blank; anything else is a typed value that isn't a time. */
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  "aria-label"?: string;
}

interface TimeParts {
  hour: number; // 0–23
  minute: number; // 0–59
}

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTES = Array.from({ length: 60 }, (_, minute) => minute);

const display = (value: string) => formatTime24(value) || value;
const pad = (value: number) => String(value).padStart(2, "0");

function toParts(value: string): TimeParts | null {
  if (!value || !isValidTime(value)) return null;
  const [hour, minute] = value.split(":").map(Number);
  return { hour, minute };
}

const fromParts = ({ hour, minute }: TimeParts) => `${pad(hour)}:${pad(minute)}`;

function PickerColumn<T extends string | number>({
  label,
  options,
  selected,
  format,
  onPick,
}: {
  label: string;
  options: T[];
  selected: T | undefined;
  format: (option: T) => string;
  onPick: (option: T) => void;
}) {
  return (
    <div className="flex flex-col">
      <div className="px-1 pb-1 text-center text-[11px] font-medium uppercase text-muted-foreground">{label}</div>
      <div data-picker-column className="h-48 w-14 overflow-y-auto rounded border" role="listbox" aria-label={label}>
        {options.map((option) => {
          const isSelected = option === selected;
          return (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={isSelected}
              data-selected={isSelected || undefined}
              tabIndex={-1}
              className={cn(
                "block w-full px-2 py-1 text-center text-sm hover:bg-accent",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary",
              )}
              onClick={() => onPick(option)}
            >
              {format(option)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 24-hour time box with a picker. Click it to choose the hour (00–23) and
 * minutes, or just type (16:20, 1620, 4:20, 420); typed text is tidied up to
 * HH:mm when you leave the box.
 */
export function TimeField({ id, value, onChange, invalid, "aria-label": ariaLabel }: TimeFieldProps) {
  const [text, setText] = useState(display(value));
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const parts = toParts(value);

  useEffect(() => {
    setText(display(value));
  }, [value]);

  // Show the chosen hour/minute in the middle of each column when opening.
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      pickerRef.current?.querySelectorAll<HTMLElement>("[data-picker-column]").forEach((column) => {
        const selected = column.querySelector<HTMLElement>("[data-selected]");
        if (selected) column.scrollTop = selected.offsetTop - column.clientHeight / 2 + selected.clientHeight / 2;
      });
    });
  }, [open]);

  const commitText = () => {
    const parsed = parseTypedTime(text);
    // Keep what was typed if it isn't a time, so validation can point at it.
    onChange(parsed ?? text.trim());
    if (parsed !== null) setText(display(parsed));
  };

  const pick = (patch: Partial<TimeParts>) => {
    const next = fromParts({ hour: 0, minute: 0, ...parts, ...patch });
    onChange(next);
    setText(display(next));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div
          ref={anchorRef}
          className={cn(
            "flex h-10 w-full items-center rounded-md border border-input bg-background pl-3 pr-2 text-sm ring-offset-background focus-within:ring-1 focus-within:ring-ring",
            invalid && "border-destructive focus-within:ring-destructive",
          )}
        >
          <input
            id={id}
            value={text}
            placeholder="HH:MM"
            title="24-hour time, e.g. 04:20 or 16:20"
            autoComplete="off"
            aria-label={ariaLabel}
            aria-invalid={invalid || undefined}
            aria-haspopup="dialog"
            aria-expanded={open}
            className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:italic placeholder:text-muted-foreground"
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onChange={(event) => setText(event.target.value)}
            onBlur={() => {
              commitText();
              setOpen(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitText();
                setOpen(false);
              } else if (event.key === "Escape") {
                setOpen(false);
              }
            }}
          />
          <Clock className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        </div>
      </PopoverAnchor>

      <PopoverContent
        ref={pickerRef}
        align="start"
        className="w-auto p-2"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          if (anchorRef.current?.contains(event.target as Node)) event.preventDefault();
        }}
        // Keep focus in the time box while picking, so leaving it closes the picker.
        onMouseDown={(event) => event.preventDefault()}
      >
        <div className="flex gap-2">
          <PickerColumn label="Hour" options={HOURS} selected={parts?.hour} format={pad} onPick={(hour) => pick({ hour })} />
          <PickerColumn label="Min" options={MINUTES} selected={parts?.minute} format={pad} onPick={(minute) => pick({ minute })} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
