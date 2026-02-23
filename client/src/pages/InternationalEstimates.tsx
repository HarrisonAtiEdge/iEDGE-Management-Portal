import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import EstimateInternational from "../components/Estimate/EstimateInternational";
import EstimateInternationalList from "../components/Estimate/EstimateInternationalList";
import { Estimate } from "../types";

export default function InternationalEstimates() {
  const [activeTab, setActiveTab] = useState<"createNew" | "list">("createNew");
  const [selectedEstimate, setSelectedEstimate] = useState<
    (Estimate & { id: string }) | null
  >(null);

  const openCreateNew = () => {
    setSelectedEstimate(null);
    setActiveTab("createNew");
  };

  const handleEdit = (estimate: Estimate & { id: string }) => {
    setSelectedEstimate(estimate);
    setActiveTab("createNew");
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeTab === "createNew" ? "default" : "outline"}
          onClick={openCreateNew}
        >
          Create New
        </Button>

        <Button
          variant={activeTab === "list" ? "default" : "outline"}
          onClick={() => setActiveTab("list")}
        >
          Estimate List
        </Button>

        {activeTab === "createNew" && (
          <Button variant="outline" onClick={() => setActiveTab("list")}>
            Back to List
          </Button>
        )}
      </div>

      {activeTab === "createNew" && (
        <EstimateInternational
          existingEstimate={selectedEstimate ?? undefined}
        />
      )}

      {activeTab === "list" && (
        <EstimateInternationalList onEdit={handleEdit} />
      )}
    </div>
  );
}
