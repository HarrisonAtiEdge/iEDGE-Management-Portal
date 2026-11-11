import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  createDefaultFormValues,
  createTravelEstimate,
  TRAVEL_ESTIMATE_ROUTES,
  TravelEstimateForm,
  TravelEstimateShell,
  useCurrentUserStamp,
  type TravelEstimateFormValues,
} from "@/components/TravelEstimate";

export default function CreateTravelEstimate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const user = useCurrentUserStamp();
  // Remounting the form with a new key gives a fresh, empty estimate.
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = async (values: TravelEstimateFormValues) => {
    if (!user) {
      toast({ title: "You're signed out", description: "Sign in again to save.", variant: "destructive" });
      return;
    }

    try {
      const { estimateNo } = await createTravelEstimate(values, user);
      toast({ title: `Travel estimate ${estimateNo} saved` });
      setLocation(TRAVEL_ESTIMATE_ROUTES.list);
    } catch (error) {
      console.error("Error saving travel estimate:", error);
      toast({
        title: "Couldn't save the estimate",
        description: "Check your connection and try again. Nothing was lost from the form.",
        variant: "destructive",
      });
    }
  };

  return (
    <TravelEstimateShell
      title="Create Travel Estimate"
      description="Add the airline options, their flights and rates, and the passengers."
    >
      <TravelEstimateForm
        key={formKey}
        initialValues={createDefaultFormValues()}
        submitLabel="Save Estimate"
        onSubmit={handleSubmit}
        onCancel={() => setFormKey((key) => key + 1)}
      />
    </TravelEstimateShell>
  );
}
