import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import RTDRecords from "@/components/RTDManagement/RTDRecords";
import RTDEstimate, {
  RTDEstimateRecord,
} from "@/components/RTDManagement/RTDEstimate";
import RTDInvoice from "@/components/RTDManagement/RTDInvoice";

type RTDTab = "records" | "estimate" | "invoice";

export default function RTDManagement() {
  const [activeTab, setActiveTab] = useState<RTDTab>("records");
  const [estimateRecordIds, setEstimateRecordIds] = useState<string[]>([]);
  const [invoiceSourceEstimate, setInvoiceSourceEstimate] =
    useState<RTDEstimateRecord | null>(null);

  const openEstimateForRecords = (recordIds: string[]) => {
    setEstimateRecordIds(recordIds);
    setActiveTab("estimate");
  };

  const openInvoiceForEstimate = (estimate: RTDEstimateRecord) => {
    setInvoiceSourceEstimate(estimate);
    setActiveTab("invoice");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6 flex w-fit items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setActiveTab("records")}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
            activeTab === "records"
              ? "bg-slate-900 text-white shadow-md hover:bg-slate-900 hover:text-white"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          Records
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={() => setActiveTab("estimate")}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
            activeTab === "estimate"
              ? "bg-slate-900 text-white shadow-md hover:bg-slate-900 hover:text-white"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          Estimate
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={() => setActiveTab("invoice")}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
            activeTab === "invoice"
              ? "bg-slate-900 text-white shadow-md hover:bg-slate-900 hover:text-white"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          Invoice
        </Button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        {activeTab === "records" && (
          <RTDRecords onCreateEstimate={openEstimateForRecords} />
        )}

        {activeTab === "estimate" && (
          <RTDEstimate
            initialRecordIds={estimateRecordIds}
            onEstimateSaved={() => setEstimateRecordIds([])}
            onCreateInvoice={openInvoiceForEstimate}
          />
        )}

        {activeTab === "invoice" && (
          <RTDInvoice
            initialEstimate={invoiceSourceEstimate}
            onInvoiceSaved={() => setInvoiceSourceEstimate(null)}
          />
        )}
      </div>
    </div>
  );
}
