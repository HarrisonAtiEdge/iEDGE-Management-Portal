import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  getTravelEstimate,
  TRAVEL_ESTIMATE_ROUTES,
  TravelEstimateForm,
  TravelEstimateShell,
  updateTravelEstimate,
  useCurrentUserStamp,
  type TravelEstimate,
  type TravelEstimateFormValues,
} from "@/components/TravelEstimate";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; estimate: TravelEstimate }
  | { status: "missing" }
  | { status: "error" };

export default function EditTravelEstimate() {
  const { id = "" } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const user = useCurrentUserStamp();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    getTravelEstimate(id)
      .then((estimate) => {
        if (!cancelled) setState(estimate ? { status: "ready", estimate } : { status: "missing" });
      })
      .catch((error) => {
        console.error("Error loading travel estimate:", error);
        if (!cancelled) setState({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const goToList = () => setLocation(TRAVEL_ESTIMATE_ROUTES.list);

  const handleSubmit = async (values: TravelEstimateFormValues) => {
    if (state.status !== "ready") return;
    if (!user) {
      toast({ title: "You're signed out", description: "Sign in again to save.", variant: "destructive" });
      return;
    }

    try {
      await updateTravelEstimate(state.estimate.id, values, user);
      toast({ title: `Travel estimate ${state.estimate.estimateNo} updated` });
      goToList();
    } catch (error) {
      console.error("Error updating travel estimate:", error);
      toast({
        title: "Couldn't save your changes",
        description: "Check your connection and try again. Nothing was lost from the form.",
        variant: "destructive",
      });
    }
  };

  const title = state.status === "ready" ? `Edit Travel Estimate ${state.estimate.estimateNo}` : "Edit Travel Estimate";

  return (
    <TravelEstimateShell title={title} description="Change the airline options, flights, rates or passengers, then save.">
      {state.status === "loading" && (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading estimate…
        </div>
      )}

      {(state.status === "missing" || state.status === "error") && (
        <div className="flex h-40 flex-col items-center justify-center gap-3 text-center">
          <p className="text-muted-foreground">
            {state.status === "missing"
              ? "This travel estimate doesn't exist. It may have been deleted."
              : "Couldn't load this travel estimate. Check your connection and try again."}
          </p>
          <Button variant="outline" onClick={goToList}>
            Back to Travel Estimate List
          </Button>
        </div>
      )}

      {state.status === "ready" && (
        <TravelEstimateForm
          key={state.estimate.id}
          initialValues={state.estimate}
          submitLabel="Update Estimate"
          onSubmit={handleSubmit}
          onCancel={goToList}
        />
      )}
    </TravelEstimateShell>
  );
}
