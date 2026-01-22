
import React, { useState } from "react";
import EstimateForm from "../components/EstimateForm";
import EstimateList from "../components/EstimateList";
import { Button } from "@/components/ui/button";
import { Estimate } from "../types";

export default function Estimates() {
  const [activeTab, setActiveTab] = useState<"createNew" | "list">("createNew");
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
  const [duplicateMode, setDuplicateMode] = useState(false);

  // Called by EstimateList when user clicks Edit
  const handleEdit = (estimate: Estimate) => {
    setSelectedEstimate(estimate);
    setDuplicateMode(false);
    setActiveTab("createNew");
  };

  // Called by EstimateList when user clicks Duplicate
  const handleDuplicate = (estimate: Estimate) => {
    setSelectedEstimate(estimate);
    setDuplicateMode(true); // enable duplicate mode
    setActiveTab("createNew");
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex gap-2">
        <Button
          variant={activeTab === "createNew" ? "default" : "outline"}
          onClick={() => {
            setSelectedEstimate(null);
            setDuplicateMode(false);
            setActiveTab("createNew");
          }}
        >
          Create New
        </Button>
        <Button
          variant={activeTab === "list" ? "default" : "outline"}
          onClick={() => setActiveTab("list")}
        >
          Estimate List
        </Button>
      </div>

     {activeTab === "createNew" && (
  <EstimateForm
    existingEstimate={selectedEstimate ?? undefined}
    duplicateMode={duplicateMode}
  />
)}

{activeTab === "list" && (
  <EstimateList
    onEdit={handleEdit}
    onDuplicate={handleDuplicate}
  />
)}
    </div>
  );
}

