import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { ESTIMATE_CATEGORY_OPTIONS } from "../constants";
import type { ClientRef, EstimateCategory } from "../types";
import { ClientField } from "./ClientField";
import { FieldShell } from "./FieldShell";

interface CategorySectionProps {
  value: EstimateCategory | "";
  client: ClientRef | null;
  individualName: string;
  onChange: (value: EstimateCategory) => void;
  onClientChange: (client: ClientRef) => void;
  onIndividualNameChange: (name: string) => void;
  error?: string;
  clientError?: string;
  individualNameError?: string;
}

/** Corporate or Individual, printed as the title of the PDF, and who the estimate is for. */
export function CategorySection({
  value,
  client,
  individualName,
  onChange,
  onClientChange,
  onIndividualNameChange,
  error,
  clientError,
  individualNameError,
}: CategorySectionProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8">
        <div>
          <p id="estimate-category-label" className="text-sm font-semibold">
            Category<span className="ml-0.5 text-destructive">*</span>
          </p>
          <p className="text-xs text-muted-foreground">Shown as the title of the estimate and its PDF.</p>
        </div>

        <div className="space-y-1">
          <RadioGroup
            value={value}
            onValueChange={(next) => onChange(next as EstimateCategory)}
            aria-labelledby="estimate-category-label"
            className="flex flex-wrap gap-3"
          >
            {ESTIMATE_CATEGORY_OPTIONS.map((option) => (
              <Label
                key={option.value}
                htmlFor={`estimate-category-${option.value}`}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-normal",
                  value === option.value && "border-primary bg-primary/5 font-medium",
                  error && "border-destructive",
                )}
              >
                <RadioGroupItem id={`estimate-category-${option.value}`} value={option.value} />
                {option.label}
              </Label>
            ))}
          </RadioGroup>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        {value === "corporate" && (
          <FieldShell
            htmlFor="estimate-client"
            label="Client"
            required
            error={clientError}
            className="w-full sm:w-80"
          >
            <ClientField id="estimate-client" value={client} invalid={Boolean(clientError)} onChange={onClientChange} />
          </FieldShell>
        )}

        {value === "individual" && (
          <FieldShell
            htmlFor="estimate-individual-name"
            label="Individual name"
            required
            error={individualNameError}
            className="w-full sm:w-80"
          >
            <Input
              id="estimate-individual-name"
              value={individualName}
              placeholder="e.g. Ali Raza"
              autoComplete="off"
              aria-invalid={Boolean(individualNameError) || undefined}
              className={cn(individualNameError && "border-destructive")}
              onChange={(event) => onIndividualNameChange(event.target.value)}
            />
          </FieldShell>
        )}
      </CardContent>
    </Card>
  );
}
