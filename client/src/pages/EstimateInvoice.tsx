import React, { useState } from "react";
import EstimateInvoiceForm from "../components/EstimateInvoice/EstimateInvoiceForm";
import EstimateInvoiceList from "../components/EstimateInvoice/EstimateInvoiceList";
import { Button } from "@/components/ui/button";

export type EstimateInvoice = any;

export default function EstimateInvoicePage() {
  const [activeTab, setActiveTab] = useState<"createNew" | "list">("createNew");
  const [selectedInvoice, setSelectedInvoice] =
    useState<EstimateInvoice | null>(null);
  const [duplicateMode, setDuplicateMode] = useState(false);

  const handleEdit = (invoice: EstimateInvoice) => {
    setSelectedInvoice(invoice);
    setDuplicateMode(false);
    setActiveTab("createNew");
  };

  const handleDuplicate = (invoice: EstimateInvoice) => {
    setSelectedInvoice(invoice);
    setDuplicateMode(true);
    setActiveTab("createNew");
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex gap-2">
        <Button
          variant={activeTab === "createNew" ? "default" : "outline"}
          onClick={() => {
            setSelectedInvoice(null);
            setDuplicateMode(false);
            setActiveTab("createNew");
          }}
        >
          Create Estimate Invoice
        </Button>

        <Button
          variant={activeTab === "list" ? "default" : "outline"}
          onClick={() => setActiveTab("list")}
        >
          Estimate Invoice List
        </Button>
      </div>

      {activeTab === "createNew" && (
        <EstimateInvoiceForm
          existingInvoice={selectedInvoice ?? undefined}
          duplicateMode={duplicateMode}
        />
      )}

      {activeTab === "list" && (
        <EstimateInvoiceList
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
        />
      )}
    </div>
  );
}
