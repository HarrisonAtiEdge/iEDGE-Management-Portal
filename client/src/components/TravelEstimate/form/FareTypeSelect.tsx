import { Fragment, useMemo, useState } from "react";
import { ChevronDown, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { FARE_TYPE_OPTIONS, MAX_FARE_TYPE_LENGTH } from "../constants";
import {
  addCustomFareType,
  cleanFareType,
  findFareType,
  useCustomFareTypes,
  validateFareType,
} from "../lookups/fareTypes";
import { useCurrentUserStamp } from "../useCurrentUserStamp";

interface FareTypeSelectProps {
  id: string;
  value: string[];
  onChange: (value: string[]) => void;
}

/** Dropdown of fare types with a checkbox each; several can apply to one rate. */
export function FareTypeSelect({ id, value, onChange }: FareTypeSelectProps) {
  const { toast } = useToast();
  const user = useCurrentUserStamp();
  const { custom, error } = useCustomFareTypes();
  const [open, setOpen] = useState(false);
  const [newType, setNewType] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Built-in types, then the shared custom ones, then any on this rate that
  // are in neither (an older estimate's fare name, or one still saving).
  const options = useMemo(() => {
    const list = [...FARE_TYPE_OPTIONS, ...custom];
    value.forEach((name) => {
      if (!findFareType(name, list)) list.push(name);
    });
    return list;
  }, [custom, value]);

  // Selected types are kept in list order, so the quote reads the same way
  // every time. A type added just now isn't in the list yet and goes last.
  const select = (names: string[]) =>
    onChange([
      ...options.filter((name) => names.includes(name)),
      ...names.filter((name) => !options.includes(name)),
    ]);

  const toggle = (name: string, checked: boolean) =>
    select(checked ? [...value, name] : value.filter((item) => item !== name));

  const addType = async () => {
    const problem = validateFareType(newType);
    if (problem) {
      setAddError(problem);
      return;
    }

    setAddError(null);
    setNewType("");
    const existing = findFareType(newType, options);
    if (existing) {
      if (!value.includes(existing)) toggle(existing, true);
      return;
    }

    // Ticked straight away; it's saved with the rate even if the shared list can't be updated.
    const name = cleanFareType(newType);
    select([...value, name]);
    if (!user) return;

    setSaving(true);
    try {
      await addCustomFareType(name, user);
    } catch (saveError) {
      console.error("Error adding fare type:", saveError);
      toast({
        title: `"${name}" was added to this rate only`,
        description: "It couldn't be saved to the shared list. Check your connection and add it again later.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const summary = value.join(", ");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          title={summary || undefined}
          className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-left text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <span className={cn("truncate", !summary && "text-muted-foreground")}>{summary || "Select fare types"}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-[16rem] p-0">
        <div className="max-h-64 overflow-y-auto p-1" role="group" aria-label="Fare types">
          {options.map((name, index) => (
            <Fragment key={name}>
              {index === FARE_TYPE_OPTIONS.length && (
                <div className="px-2 pb-1 pt-2 text-xs font-medium text-muted-foreground">Custom</div>
              )}
              <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted">
                <Checkbox checked={value.includes(name)} onCheckedChange={(checked) => toggle(name, checked === true)} />
                <span className="truncate">{name}</span>
              </label>
            </Fragment>
          ))}
        </div>

        <div className="space-y-1 border-t p-2">
          <div className="flex gap-2">
            <Input
              value={newType}
              maxLength={MAX_FARE_TYPE_LENGTH}
              placeholder="Add a custom fare type"
              aria-label="New fare type"
              className="h-8"
              onChange={(event) => {
                setNewType(event.target.value);
                setAddError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addType();
                }
              }}
            />
            <Button type="button" size="sm" className="h-8 shrink-0" disabled={saving} onClick={addType}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              <span className="ml-1">Add</span>
            </Button>
          </div>
          {addError ? (
            <p className="text-xs text-destructive">{addError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {error ?? "Added types are shared, so everyone can pick them next time."}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
