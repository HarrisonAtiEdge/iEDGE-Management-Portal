import { useMemo, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { firstTravelDate } from "../applicants";
import { errorKeys, validateFormValues } from "../formModel";
import type { FormErrors, TravelEstimateFormValues } from "../types";
import { ApplicantsSection } from "./ApplicantsSection";
import { CategorySection } from "./CategorySection";
import { OptionsSection } from "./OptionsSection";
import { PassengersSection } from "./PassengersSection";

interface TravelEstimateFormProps {
  initialValues: TravelEstimateFormValues;
  submitLabel: string;
  onSubmit: (values: TravelEstimateFormValues) => Promise<void>;
  onCancel?: () => void;
}

const NO_ERRORS: FormErrors = {};

/**
 * Create/edit form. Each section edits its own keys of the form values, so a
 * new section (client, notes, terms…) is added here with its own key without
 * touching the existing ones.
 */
export function TravelEstimateForm({ initialValues, submitLabel, onSubmit, onCancel }: TravelEstimateFormProps) {
  const { toast } = useToast();
  const [values, setValues] = useState(initialValues);
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const errors = useMemo(() => validateFormValues(values), [values]);

  // First departure of the first option, for checking passport validity.
  const travelDate = useMemo(() => firstTravelDate(values.options), [values.options]);
  const visibleErrors = showErrors ? errors : NO_ERRORS;

  const setField =
    <K extends keyof TravelEstimateFormValues>(key: K) =>
    (next: TravelEstimateFormValues[K]) =>
      setValues((current) => ({ ...current, [key]: next }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    setShowErrors(true);
    if (Object.keys(errors).length > 0) {
      toast({
        title: "Some fields need attention",
        description: "Fix the fields marked in red, then save again.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <CategorySection
        value={values.category}
        client={values.client}
        individualName={values.individualName}
        onChange={setField("category")}
        onClientChange={setField("client")}
        onIndividualNameChange={setField("individualName")}
        error={visibleErrors[errorKeys.category]}
        clientError={visibleErrors[errorKeys.client]}
        individualNameError={visibleErrors[errorKeys.individualName]}
      />
      <OptionsSection
        options={values.options}
        currency={values.currency}
        errors={visibleErrors}
        onOptionsChange={setField("options")}
        onCurrencyChange={setField("currency")}
      />
      <PassengersSection value={values.passengers} onChange={setField("passengers")} errors={visibleErrors} />
      <ApplicantsSection
        value={values.applicants}
        onChange={setField("applicants")}
        errors={visibleErrors}
        travelDate={travelDate}
        suggestedListName={values.category === "corporate" ? values.client?.name ?? "" : values.individualName}
      />

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" disabled={submitting} onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
