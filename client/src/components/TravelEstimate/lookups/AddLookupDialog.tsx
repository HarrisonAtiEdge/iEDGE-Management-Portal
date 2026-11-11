import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { allTimeZones, builtInTimeZone } from "../timeZones";
import type { AirlineKind, AirlineOption, AirportOption } from "../types";
import { useCurrentUserStamp } from "../useCurrentUserStamp";
import {
  addAirline,
  addAirport,
  LookupCodeExistsError,
  validateNewAirline,
  validateNewAirport,
} from "./lookupService";

/** Text that looks like a code goes into the code box, anything else into the name. */
function splitQuery(query: string, codePattern: RegExp) {
  const trimmed = query.trim();
  return codePattern.test(trimmed)
    ? { code: trimmed.toUpperCase(), name: "" }
    : { code: "", name: trimmed };
}

function FieldRow({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function saveErrorMessage(error: unknown, kindLabel: string) {
  if (error instanceof LookupCodeExistsError) {
    return `${error.code} is already in the list as "${error.existingName}". Search for it instead.`;
  }
  console.error(`Error adding ${kindLabel}:`, error);
  return `Couldn't save the ${kindLabel}. Check your connection and try again.`;
}

interface AddDialogProps<T> {
  open: boolean;
  initialQuery: string;
  onOpenChange: (open: boolean) => void;
  onAdded: (item: T) => void;
}

export function AddAirportDialog({
  open,
  initialQuery,
  onOpenChange,
  onAdded,
}: AddDialogProps<AirportOption>) {
  const { toast } = useToast();
  const user = useCurrentUserStamp();
  const [code, setCode] = useState("");
  const [cityCode, setCityCode] = useState("");
  const [name, setName] = useState("");
  const [timeZone, setTimeZone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const zoneOptions = useMemo(() => (open ? allTimeZones() : []), [open]);
  // Known city code (e.g. a new airport for LON): offer that city's zone.
  const suggestedZone = builtInTimeZone(code, cityCode || code);

  useEffect(() => {
    if (!open) return;
    const prefill = splitQuery(initialQuery, /^[A-Za-z]{3}$/);
    setCode(prefill.code);
    setCityCode("");
    setName(prefill.name);
    setTimeZone("");
    setErrors({});
  }, [open, initialQuery]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const input = { code, cityCode: cityCode || code, name, timeZone: timeZone.trim() || suggestedZone };
    const validation = validateNewAirport(input);
    setErrors(validation);
    if (Object.keys(validation).length > 0 || !user) return;

    setSaving(true);
    try {
      const airport = await addAirport(input, user);
      toast({ title: `${airport.name} (${airport.code}) added` });
      onAdded(airport);
    } catch (error) {
      setErrors({ form: saveErrorMessage(error, "airport") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add city or airport</DialogTitle>
            <DialogDescription>
              It's saved to the shared list, so everyone can pick it next time.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <FieldRow id="new-airport-code" label="Airport code *" error={errors.code}>
              <Input
                id="new-airport-code"
                value={code}
                maxLength={3}
                autoFocus
                className="uppercase"
                placeholder="e.g. MUX"
                onChange={(event) => setCode(event.target.value.toUpperCase())}
              />
            </FieldRow>
            <FieldRow
              id="new-airport-city-code"
              label="City code"
              error={errors.cityCode}
              hint="Leave blank if same as airport"
            >
              <Input
                id="new-airport-city-code"
                value={cityCode}
                maxLength={3}
                className="uppercase"
                placeholder={code || "e.g. MUX"}
                onChange={(event) => setCityCode(event.target.value.toUpperCase())}
              />
            </FieldRow>
          </div>

          <FieldRow id="new-airport-name" label="City / airport name *" error={errors.name}>
            <Input
              id="new-airport-name"
              value={name}
              placeholder="e.g. Multan"
              onChange={(event) => setName(event.target.value)}
            />
          </FieldRow>

          <FieldRow
            id="new-airport-time-zone"
            label="Time zone"
            error={errors.timeZone}
            hint="Used to work out flight times and arrival dates. Start typing the region or city, e.g. Asia/Karachi."
          >
            <Input
              id="new-airport-time-zone"
              value={timeZone}
              list="new-airport-time-zones"
              autoComplete="off"
              placeholder={suggestedZone || "e.g. Asia/Karachi"}
              onChange={(event) => setTimeZone(event.target.value)}
            />
            <datalist id="new-airport-time-zones">
              {zoneOptions.map((zone) => (
                <option key={zone} value={zone} />
              ))}
            </datalist>
          </FieldRow>

          {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !user}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save and select
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddAirlineDialog({
  open,
  initialQuery,
  onOpenChange,
  onAdded,
}: AddDialogProps<AirlineOption>) {
  const { toast } = useToast();
  const user = useCurrentUserStamp();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [kind, setKind] = useState<AirlineKind>("airline");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prefill = splitQuery(initialQuery, /^[A-Za-z0-9*]{2}$/);
    setCode(prefill.code);
    setName(prefill.name);
    setKind("airline");
    setErrors({});
  }, [open, initialQuery]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const input = { code, name, kind };
    const validation = validateNewAirline(input);
    setErrors(validation);
    if (Object.keys(validation).length > 0 || !user) return;

    setSaving(true);
    try {
      const airline = await addAirline(input, user);
      toast({ title: `${airline.name} (${airline.code}) added` });
      onAdded(airline);
    } catch (error) {
      setErrors({ form: saveErrorMessage(error, kind) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add airline or alliance</DialogTitle>
            <DialogDescription>
              It's saved to the shared list, so everyone can pick it next time.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <FieldRow id="new-airline-code" label="Code *" error={errors.code}>
              <Input
                id="new-airline-code"
                value={code}
                maxLength={3}
                autoFocus
                className="uppercase"
                placeholder="e.g. 9P"
                onChange={(event) => setCode(event.target.value.toUpperCase())}
              />
            </FieldRow>
            <FieldRow id="new-airline-kind" label="Type">
              <Select value={kind} onValueChange={(value) => setKind(value as AirlineKind)}>
                <SelectTrigger id="new-airline-kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="airline">Airline</SelectItem>
                  <SelectItem value="alliance">Alliance</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>
          </div>

          <FieldRow id="new-airline-name" label="Name *" error={errors.name}>
            <Input
              id="new-airline-name"
              value={name}
              placeholder="e.g. Fly Jinnah"
              onChange={(event) => setName(event.target.value)}
            />
          </FieldRow>

          {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !user}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save and select
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
