import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCY_OPTIONS } from "../constants";
import { createOptionLike, duplicateOption, errorKeys } from "../formModel";
import type { FormErrors, QuoteOption } from "../types";
import { OptionCard } from "./OptionCard";

interface OptionsSectionProps {
  options: QuoteOption[];
  currency: string;
  errors: FormErrors;
  onOptionsChange: (options: QuoteOption[]) => void;
  onCurrencyChange: (currency: string) => void;
}

/** The airline options quoted to the client, e.g. Qatar Airways and Turkish Airlines. */
export function OptionsSection({ options, currency, errors, onOptionsChange, onCurrencyChange }: OptionsSectionProps) {
  const currencies = CURRENCY_OPTIONS.includes(currency) ? CURRENCY_OPTIONS : [currency, ...CURRENCY_OPTIONS];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Airline options</h2>
          <p className="text-sm text-muted-foreground">
            Add each airline you're quoting, its flights and its rates. Enter every time as the local time at its
            airport.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="estimate-currency" className="text-sm">
            Currency
          </Label>
          <Select value={currency} onValueChange={onCurrencyChange}>
            <SelectTrigger id="estimate-currency" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((code) => (
                <SelectItem key={code} value={code}>
                  {code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {errors[errorKeys.options] && <p className="text-sm text-destructive">{errors[errorKeys.options]}</p>}

      {options.map((option, index) => (
        <OptionCard
          key={option.id}
          option={option}
          index={index}
          currency={currency}
          errors={errors}
          canRemove={options.length > 1}
          onChange={(next) => onOptionsChange(options.map((item) => (item.id === option.id ? next : item)))}
          onRemove={() => onOptionsChange(options.filter((item) => item.id !== option.id))}
          onDuplicate={() =>
            onOptionsChange([...options.slice(0, index + 1), duplicateOption(option), ...options.slice(index + 1)])
          }
        />
      ))}

      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed"
        onClick={() => onOptionsChange([...options, createOptionLike(options[0])])}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add airline option
      </Button>
    </section>
  );
}
