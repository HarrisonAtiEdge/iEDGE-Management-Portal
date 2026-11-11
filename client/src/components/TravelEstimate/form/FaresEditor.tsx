import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  BAGGAGE_PIECES,
  BAGGAGE_WEIGHTS_KG,
  MAX_ADDITIONAL_BAGGAGE_KG,
  MAX_ADDITIONAL_BAGGAGE_PIECES,
} from "../constants";
import { fareTotals } from "../fareTotals";
import { fareTypesText, formatMoney, parseAmount } from "../format";
import { createFare, errorKeys } from "../formModel";
import type { BaggageAllowance, FareOption, FormErrors, ServiceCharge, ServiceChargeType } from "../types";
import { FareTypeSelect } from "./FareTypeSelect";
import { FieldShell } from "./FieldShell";
import { TaxSelect } from "./TaxSelect";

const NO_BAGGAGE = "none";

/** Weight dropdown and 1 PC / 2 PCs buttons for the standard allowance. */
function BaggagePicker({
  id,
  value,
  onChange,
}: {
  id: string;
  value: BaggageAllowance;
  onChange: (value: BaggageAllowance) => void;
}) {
  return (
    <div className="flex gap-2">
      <Select
        value={value.weightKg ? String(value.weightKg) : NO_BAGGAGE}
        onValueChange={(weight) =>
          onChange(
            weight === NO_BAGGAGE
              ? { weightKg: null, pieces: null }
              : { weightKg: Number(weight), pieces: value.pieces ?? BAGGAGE_PIECES[0] },
          )
        }
      >
        <SelectTrigger id={id} className="min-w-0 flex-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_BAGGAGE}>Not set</SelectItem>
          {BAGGAGE_WEIGHTS_KG.map((weight) => (
            <SelectItem key={weight} value={String(weight)}>
              {weight} kg
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div role="radiogroup" aria-label="Baggage pieces" className="inline-flex shrink-0 rounded-md border p-0.5">
        {BAGGAGE_PIECES.map((pieces) => {
          const isSelected = value.weightKg !== null && value.pieces === pieces;
          return (
            <button
              key={pieces}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={value.weightKg === null}
              title={value.weightKg === null ? "Choose the weight first" : undefined}
              className={cn(
                "whitespace-nowrap rounded px-2.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                isSelected ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => onChange({ ...value, pieces })}
            >
              {pieces} PC{pieces === 1 ? "" : "s"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Whole-number box that holds null when empty. */
export function CountInput({
  id,
  value,
  max,
  placeholder,
  invalid,
  onChange,
}: {
  id: string;
  value: number | null;
  max: number;
  placeholder: string;
  invalid?: boolean;
  onChange: (value: number | null) => void;
}) {
  return (
    <Input
      id={id}
      type="number"
      min={1}
      max={max}
      inputMode="numeric"
      placeholder={placeholder}
      aria-invalid={invalid || undefined}
      className={cn(invalid && "border-destructive")}
      value={value ?? ""}
      onChange={(event) => {
        const number = Math.floor(Number(event.target.value));
        onChange(event.target.value === "" || !(number > 0) ? null : Math.min(number, max));
      }}
    />
  );
}

const showAmount = (amount: number | null) =>
  amount === null ? "" : amount.toLocaleString("en-US", { maximumFractionDigits: 2 });

function AmountInput({
  id,
  value,
  placeholder = "e.g. 283,535",
  invalid,
  onChange,
}: {
  id: string;
  value: number | null;
  placeholder?: string;
  invalid?: boolean;
  onChange: (value: number | null) => void;
}) {
  const [text, setText] = useState(showAmount(value));
  // The amount updates on every key, for the Ticket Amount; what's being typed is only tidied on leaving.
  const typing = useRef(false);

  useEffect(() => {
    if (!typing.current) setText(showAmount(value));
  }, [value]);

  const commit = () => {
    const amount = parseAmount(text);
    onChange(amount);
    setText(showAmount(amount));
  };

  return (
    <Input
      id={id}
      value={text}
      inputMode="decimal"
      placeholder={placeholder}
      autoComplete="off"
      aria-invalid={invalid || undefined}
      className={cn("text-right font-semibold", invalid && "border-destructive")}
      onFocus={() => {
        typing.current = true;
      }}
      onChange={(event) => {
        setText(event.target.value);
        onChange(parseAmount(event.target.value));
      }}
      onBlur={() => {
        typing.current = false;
        commit();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit();
        }
      }}
    />
  );
}

/** Amount box with a % / currency switch beside it. */
function ServiceChargeInput({
  id,
  value,
  currency,
  invalid,
  onChange,
}: {
  id: string;
  value: ServiceCharge;
  currency: string;
  invalid?: boolean;
  onChange: (value: ServiceCharge) => void;
}) {
  const types: { type: ServiceChargeType; label: string }[] = [
    { type: "percent", label: "%" },
    { type: "fixed", label: currency },
  ];

  return (
    <div className="flex gap-2">
      <div className="min-w-0 flex-1">
        <AmountInput
          id={id}
          value={value.value}
          placeholder={value.type === "percent" ? "e.g. 5" : "e.g. 2,500"}
          invalid={invalid}
          onChange={(next) => onChange({ ...value, value: next })}
        />
      </div>

      <div role="radiogroup" aria-label="Service charges in" className="inline-flex shrink-0 rounded-md border p-0.5">
        {types.map(({ type, label }) => (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={value.type === type}
            className={cn(
              "whitespace-nowrap rounded px-2.5 text-xs font-medium transition-colors",
              value.type === type ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => onChange({ ...value, type })}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** The fare, service charges and each tax with its amount; hidden until there's something to add. */
function FareBreakdown({ fare, currency }: { fare: FareOption; currency: string }) {
  const { serviceChargeAmount, taxes } = fareTotals(fare);
  if (serviceChargeAmount === 0 && taxes.length === 0) return null;

  const { type, value } = fare.serviceCharge;
  const lines: [string, number | null][] = [
    ["Fare", fare.amount],
    ...(serviceChargeAmount > 0
      ? ([[type === "percent" ? `Service Charges (${value}%)` : "Service Charges", serviceChargeAmount]] as [string, number][])
      : []),
    ...taxes.map((tax): [string, number] => [`${tax.name} (${tax.percent}%)`, tax.amount]),
  ];

  return (
    <dl className="space-y-1 rounded-md bg-muted/50 px-3 py-2 text-xs">
      {lines.map(([label, amount], index) => (
        <div key={index} className="flex justify-between gap-3">
          <dt className="min-w-0 text-muted-foreground">{label}</dt>
          <dd className="whitespace-nowrap font-medium">{formatMoney(amount, currency)}</dd>
        </div>
      ))}
    </dl>
  );
}

interface FaresEditorProps {
  fares: FareOption[];
  currency: string;
  errors: FormErrors;
  onChange: (fares: FareOption[]) => void;
}

/** The option's rate columns. Seats and fee lines are optional. */
export function FaresEditor({ fares, currency, errors, onChange }: FaresEditorProps) {
  const update = (id: string, patch: Partial<FareOption>) =>
    onChange(fares.map((fare) => (fare.id === id ? { ...fare, ...patch } : fare)));

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {fares.map((fare, index) => {
          const fieldId = (name: string) => `fare-${fare.id}-${name}`;
          const amountError = errors[errorKeys.fareAmount(fare.id)];
          const extraError = errors[errorKeys.fareAdditionalBaggage(fare.id)];
          const serviceChargeError = errors[errorKeys.fareServiceCharge(fare.id)];
          const { ticketAmount } = fareTotals(fare);
          const extra = fare.additionalBaggage;
          return (
            <div key={fare.id} className="space-y-3 rounded-md border p-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="truncate text-sm font-semibold">
                  Rate {index + 1}
                  {fare.fareTypes.length > 0 && (
                    <span className="ml-1.5 font-normal text-muted-foreground">· {fareTypesText(fare)}</span>
                  )}
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-primary"
                  disabled={fares.length <= 1}
                  aria-label={`Remove rate ${index + 1}`}
                  title={fares.length > 1 ? `Remove rate ${index + 1}` : "An option needs at least one rate"}
                  onClick={() => onChange(fares.filter((item) => item.id !== fare.id))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <FieldShell
                htmlFor={fieldId("fare-types")}
                label="Fare type"
                info="Tick every fare type this rate applies to. Add your own at the bottom of the list."
              >
                <FareTypeSelect
                  id={fieldId("fare-types")}
                  value={fare.fareTypes}
                  onChange={(fareTypes) => update(fare.id, { fareTypes })}
                />
              </FieldShell>

              <FieldShell htmlFor={fieldId("amount")} label={`Amount (${currency})`} required error={amountError}>
                <AmountInput
                  id={fieldId("amount")}
                  value={fare.amount}
                  invalid={Boolean(amountError)}
                  onChange={(amount) => update(fare.id, { amount })}
                />
              </FieldShell>

              <FieldShell
                htmlFor={fieldId("service-charge")}
                label="Service Charges"
                info={`A percentage of the fare, or a fixed amount in ${currency}.`}
                error={serviceChargeError}
              >
                <ServiceChargeInput
                  id={fieldId("service-charge")}
                  value={fare.serviceCharge}
                  currency={currency}
                  invalid={Boolean(serviceChargeError)}
                  onChange={(serviceCharge) => update(fare.id, { serviceCharge })}
                />
              </FieldShell>

              <FieldShell
                htmlFor={fieldId("taxes")}
                label="Tax"
                info="Tick every tax that applies. Each one is worked out on the fare."
              >
                <TaxSelect id={fieldId("taxes")} value={fare.taxes} onChange={(taxes) => update(fare.id, { taxes })} />
              </FieldShell>

              <FareBreakdown fare={fare} currency={currency} />

              <FieldShell
                htmlFor={fieldId("ticket-amount")}
                label="Ticket Amount"
                info="Fare plus service charges and taxes. This is the amount shown on the PDF."
              >
                <Input
                  id={fieldId("ticket-amount")}
                  readOnly
                  tabIndex={-1}
                  value={ticketAmount === null ? "" : formatMoney(ticketAmount, currency)}
                  placeholder="Worked out from the fare"
                  className="cursor-default border-dashed bg-muted/40 text-right font-bold"
                />
              </FieldShell>

              <FieldShell htmlFor={fieldId("baggage")} label="Baggage allowance">
                <BaggagePicker
                  id={fieldId("baggage")}
                  value={fare.baggage}
                  onChange={(baggage) => update(fare.id, { baggage })}
                />
              </FieldShell>

              <div className="space-y-2">
                <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={extra !== null}
                    onCheckedChange={(checked) =>
                      update(fare.id, { additionalBaggage: checked === true ? { weightKg: null, pieces: null } : null })
                    }
                  />
                  Additional baggage
                </label>
                {extra && (
                  <div className="space-y-1 pl-6">
                    <div className="grid grid-cols-2 gap-2">
                      <FieldShell htmlFor={fieldId("extra-kg")} label="Extra weight (kg)">
                        <CountInput
                          id={fieldId("extra-kg")}
                          value={extra.weightKg}
                          max={MAX_ADDITIONAL_BAGGAGE_KG}
                          placeholder="e.g. 10"
                          invalid={Boolean(extraError)}
                          onChange={(weightKg) => update(fare.id, { additionalBaggage: { ...extra, weightKg } })}
                        />
                      </FieldShell>
                      <FieldShell htmlFor={fieldId("extra-pieces")} label="Extra pieces">
                        <CountInput
                          id={fieldId("extra-pieces")}
                          value={extra.pieces}
                          max={MAX_ADDITIONAL_BAGGAGE_PIECES}
                          placeholder="e.g. 1"
                          invalid={Boolean(extraError)}
                          onChange={(pieces) => update(fare.id, { additionalBaggage: { ...extra, pieces } })}
                        />
                      </FieldShell>
                    </div>
                    {extraError && <p className="text-xs text-destructive">{extraError}</p>}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-2">
                <FieldShell htmlFor={fieldId("seats")} label="Seats">
                  <Input
                    id={fieldId("seats")}
                    value={fare.seats}
                    placeholder="e.g. 5+"
                    onChange={(event) => update(fare.id, { seats: event.target.value })}
                  />
                </FieldShell>
                <FieldShell htmlFor={fieldId("refund")} label="Refund fees">
                  <Input
                    id={fieldId("refund")}
                    value={fare.refundFees}
                    placeholder="e.g. As per Policy"
                    onChange={(event) => update(fare.id, { refundFees: event.target.value })}
                  />
                </FieldShell>
              </div>

              <FieldShell htmlFor={fieldId("change")} label="Change fees">
                <Input
                  id={fieldId("change")}
                  value={fare.changeFees}
                  placeholder="e.g. Charges will apply"
                  onChange={(event) => update(fare.id, { changeFees: event.target.value })}
                />
              </FieldShell>
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="link"
        size="sm"
        className="h-auto p-0"
        onClick={() => {
          // New rates start with the previous rate's charges and fee terms, which are usually the same.
          const last = fares[fares.length - 1];
          onChange([
            ...fares,
            createFare({
              ...(last && { serviceCharge: last.serviceCharge, taxes: last.taxes }),
              refundFees: last?.refundFees ?? "",
              changeFees: last?.changeFees ?? "",
            }),
          ]);
        }}
      >
        <Plus className="mr-1 h-3.5 w-3.5" />
        Add rate
      </Button>
    </div>
  );
}
