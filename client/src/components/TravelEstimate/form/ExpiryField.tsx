import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_EXPIRY_HOURS,
  MAX_EXPIRY_HOURS,
  MAX_EXPIRY_MINUTES,
  TICKET_EXPIRY_OPTIONS,
} from "../constants";
import type { TicketExpiry, TicketExpiryType } from "../types";
import { DateField } from "./DateField";
import { CountInput } from "./FaresEditor";

interface ExpiryFieldProps {
  id: string;
  value: TicketExpiry;
  onChange: (value: TicketExpiry) => void;
}

/** A date, or a number of hours or minutes, chosen from the dropdown beside it. */
export function ExpiryField({ id, value, onChange }: ExpiryFieldProps) {
  const changeType = (type: TicketExpiryType) =>
    onChange({ type, date: "", value: type === "hours" ? DEFAULT_EXPIRY_HOURS : null });

  return (
    <div className="flex gap-2">
      <Select value={value.type} onValueChange={(type) => changeType(type as TicketExpiryType)}>
        <SelectTrigger className="w-28 shrink-0" aria-label="Expiry type">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TICKET_EXPIRY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="min-w-0 flex-1">
        {value.type === "date" ? (
          <DateField id={id} value={value.date} clearable onChange={(date) => onChange({ ...value, date })} />
        ) : (
          <CountInput
            id={id}
            value={value.value}
            max={value.type === "hours" ? MAX_EXPIRY_HOURS : MAX_EXPIRY_MINUTES}
            placeholder={value.type === "hours" ? "e.g. 24" : "e.g. 30"}
            onChange={(next) => onChange({ ...value, value: next })}
          />
        )}
      </div>
    </div>
  );
}
