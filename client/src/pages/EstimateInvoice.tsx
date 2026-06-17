// import React, { useState } from "react";
// import EstimateInvoiceForm from "../components/EstimateInvoice/EstimateInvoiceForm";
// import EstimateInvoiceList from "../components/EstimateInvoice/EstimateInvoiceList";
// import { Button } from "@/components/ui/button";

// export type EstimateInvoice = any;

// export default function EstimateInvoicePage() {
//   const [activeTab, setActiveTab] = useState<"createNew" | "list">("createNew");
//   const [selectedInvoice, setSelectedInvoice] =
//     useState<EstimateInvoice | null>(null);
//   const [duplicateMode, setDuplicateMode] = useState(false);

//   const handleEdit = (invoice: EstimateInvoice) => {
//     setSelectedInvoice(invoice);
//     setDuplicateMode(false);
//     setActiveTab("createNew");
//   };

//   const handleDuplicate = (invoice: EstimateInvoice) => {
//     setSelectedInvoice(invoice);
//     setDuplicateMode(true);
//     setActiveTab("createNew");
//   };

//   return (
//     <div className="p-6">
//       <div className="mb-4 flex gap-2">
//         <Button
//           variant={activeTab === "createNew" ? "default" : "outline"}
//           onClick={() => {
//             setSelectedInvoice(null);
//             setDuplicateMode(false);
//             setActiveTab("createNew");
//           }}
//         >
//           Create Estimate Invoice
//         </Button>

//         <Button
//           variant={activeTab === "list" ? "default" : "outline"}
//           onClick={() => setActiveTab("list")}
//         >
//           Estimate Invoice List
//         </Button>
//       </div>

//       {activeTab === "createNew" && (
//         <EstimateInvoiceForm
//           existingInvoice={selectedInvoice ?? undefined}
//           duplicateMode={duplicateMode}
//         />
//       )}

//       {activeTab === "list" && (
//         <EstimateInvoiceList
//           onEdit={handleEdit}
//           onDuplicate={handleDuplicate}
//         />
//       )}
//     </div>
//   );
// }






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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6 flex w-fit items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        <Button
                    type="button"
          variant="ghost"
          onClick={() => {
            setSelectedInvoice(null);
            setDuplicateMode(false);
            setActiveTab("createNew");
          }}
           className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
            activeTab === "createNew"
              ? "bg-slate-900 text-white shadow-md hover:bg-slate-900 hover:text-white"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          Create Estimate Invoice
        </Button>

        <Button
              type="button"
          variant="ghost"
          onClick={() => setActiveTab("list")}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
            activeTab === "list"
              ? "bg-slate-900 text-white shadow-md hover:bg-slate-900 hover:text-white"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          Estimate Invoice List
        </Button>
      </div>

      {/* Content */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

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
    </div>
  );
}
