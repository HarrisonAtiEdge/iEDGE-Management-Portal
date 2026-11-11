import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useTaxes } from "../lookups/directoryLists";
import type { FareTax } from "../types";

interface TaxSelectProps {
  id: string;
  value: FareTax[];
  onChange: (value: FareTax[]) => void;
}

const taxLabel = (tax: FareTax) => `${tax.name} (${tax.percent}%)`;

/** Dropdown of the taxes from Settings → Tax with a checkbox each; several can apply to one rate. */
export function TaxSelect({ id, value, onChange }: TaxSelectProps) {
  const { items: taxes, loading, error } = useTaxes();
  const [open, setOpen] = useState(false);

  // A tax already on the rate keeps its saved percent, and stays listed if it
  // has since been removed from Settings, so opening a quote never changes it.
  const options = useMemo(() => {
    const saved = new Map(value.map((tax) => [tax.id, tax]));
    return [
      ...taxes.map((tax) => saved.get(tax.id) ?? tax),
      ...value.filter((tax) => !taxes.some((item) => item.id === tax.id)),
    ];
  }, [taxes, value]);

  const toggle = (tax: FareTax, checked: boolean) => {
    const ids = new Set(value.map((item) => item.id));
    if (checked) ids.add(tax.id);
    else ids.delete(tax.id);
    onChange(options.filter((item) => ids.has(item.id)));
  };

  const summary = value.map(taxLabel).join(", ");

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
          <span className={cn("truncate", !summary && "text-muted-foreground")}>{summary || "Select taxes"}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-[16rem] p-0">
        <div className="max-h-64 overflow-y-auto p-1" role="group" aria-label="Taxes">
          {options.map((tax) => (
            <label
              key={tax.id}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
            >
              <Checkbox
                checked={value.some((item) => item.id === tax.id)}
                onCheckedChange={(checked) => toggle(tax, checked === true)}
              />
              <span className="truncate">{taxLabel(tax)}</span>
            </label>
          ))}
          {options.length === 0 && (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">
              {error ?? (loading ? "Loading taxes…" : "No taxes yet. Add them in Settings → Tax.")}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
