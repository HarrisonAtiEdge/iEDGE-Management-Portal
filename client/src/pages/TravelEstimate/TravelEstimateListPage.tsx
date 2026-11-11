import { useState } from "react";
import { Link } from "wouter";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SavedApplicantLists,
  TRAVEL_ESTIMATE_ROUTES,
  TravelEstimateList,
  TravelEstimateShell,
} from "@/components/TravelEstimate";

type ListView = "estimates" | "applicants";

export default function TravelEstimateListPage() {
  const [view, setView] = useState<ListView>("estimates");

  return (
    <TravelEstimateShell
      title="Travel Estimate List"
      description="All saved travel estimates and saved Application Details. Edit, preview or save any estimate as a PDF."
      actions={
        <Link href={TRAVEL_ESTIMATE_ROUTES.create}>
          <Button className="rounded-2xl">
            <Plus className="mr-2 h-4 w-4" />
            Create Travel Estimate
          </Button>
        </Link>
      }
    >
      <Tabs value={view} onValueChange={(next) => setView(next as ListView)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="estimates">Estimates</TabsTrigger>
          <TabsTrigger value="applicants">Saved Application Details</TabsTrigger>
        </TabsList>
        <TabsContent value="estimates" className="mt-0">
          <TravelEstimateList />
        </TabsContent>
        <TabsContent value="applicants" className="mt-0">
          <SavedApplicantLists />
        </TabsContent>
      </Tabs>
    </TravelEstimateShell>
  );
}
