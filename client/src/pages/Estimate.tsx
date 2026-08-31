// import React, { useState } from "react";
// import EstimateForm from "../components/Estimate/EstimateForm";
// import EstimateList from "../components/Estimate/EstimateList";
// import { Button } from "@/components/ui/button";
// import { Estimate } from "../types";

// export default function Estimates() {
//   const [activeTab, setActiveTab] = useState<"createNew" | "list">("createNew");
//   const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(
//     null,);
//   const [duplicateMode, setDuplicateMode] = useState(false);

//   // Called by EstimateList when user clicks Edit
//   const handleEdit = (estimate: Estimate) => {
//     setSelectedEstimate(estimate);
//     setDuplicateMode(false);
//     setActiveTab("createNew");
//   };

//   // Called by EstimateList when user clicks Duplicate
//   const handleDuplicate = (estimate: Estimate) => {
//     setSelectedEstimate(estimate);
//     setDuplicateMode(true); // enable duplicate mode
//     setActiveTab("createNew");
//   };

//   return (
//     <div className="p-6">
//       <div className="mb-4 flex gap-2">
//         <Button
//           variant={activeTab === "createNew" ? "default" : "outline"}
//           onClick={() => {
//             setSelectedEstimate(null);
//             setDuplicateMode(false);
//             setActiveTab("createNew");
//           }}
//         >
//           Create New
//         </Button>
//         <Button
//           variant={activeTab === "list" ? "default" : "outline"}
//           onClick={() => setActiveTab("list")}
//         >
//           Estimate List
//         </Button>
//       </div>

//       {activeTab === "createNew" && (
//         <EstimateForm
//           existingEstimate={selectedEstimate ?? undefined}
//           duplicateMode={duplicateMode}
//         />
//       )}

//       {activeTab === "list" && (
//         <EstimateList onEdit={handleEdit} onDuplicate={handleDuplicate} />
//       )}
//     </div>
//   );
// }




// import React, { useState } from "react";
// import EstimateForm from "../components/Estimate/EstimateForm";
// import EstimateList from "../components/Estimate/EstimateList";
// import { Button } from "@/components/ui/button";
// import { Estimate } from "../types";

// export default function Estimates() {
//   const [activeTab, setActiveTab] = useState<"createNew" | "list">("createNew");
//   const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
//   const [duplicateMode, setDuplicateMode] = useState(false);

//   // Called by EstimateList when user clicks Edit
//   const handleEdit = (estimate: Estimate) => {
//     setSelectedEstimate(estimate);
//     setDuplicateMode(false);
//     setActiveTab("createNew");
//   };

//   // Called by EstimateList when user clicks Duplicate
//   const handleDuplicate = (estimate: Estimate) => {
//     setSelectedEstimate(estimate);
//     setDuplicateMode(true);
//     setActiveTab("createNew");
//   };

//   return (
//     <div className="min-h-screen bg-slate-50 p-6">
//       {/* Modern Tabs */}
//       <div className="mb-6 flex w-fit items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
//         <Button
//           type="button"
//           variant="ghost"
//           onClick={() => {
//             setSelectedEstimate(null);
//             setDuplicateMode(false);
//             setActiveTab("createNew");
//           }}
//           className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
//             activeTab === "createNew"
//               ? "bg-slate-900 text-white shadow-md hover:bg-slate-900 hover:text-white"
//               : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
//           }`}
//         >
//           Create New
//         </Button>

//         <Button
//           type="button"
//           variant="ghost"
//           onClick={() => setActiveTab("list")}
//           className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
//             activeTab === "list"
//               ? "bg-slate-900 text-white shadow-md hover:bg-slate-900 hover:text-white"
//               : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
//           }`}
//         >
//           Estimate List
//         </Button>
//       </div>

//       {/* Content */}
//       <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//         {activeTab === "createNew" && (
//           <EstimateForm
//             existingEstimate={selectedEstimate ?? undefined}
//             duplicateMode={duplicateMode}
//           />
//         )}

//         {activeTab === "list" && (
//           <EstimateList onEdit={handleEdit} onDuplicate={handleDuplicate} />
//         )}
//       </div>
//     </div>
//   );
// }



import React, { useEffect, useState } from "react";
import EstimateForm from "../components/Estimate/EstimateForm";
import EstimateList from "../components/Estimate/EstimateList";
import { Button } from "@/components/ui/button";
import { Estimate } from "../types";
import { useLocation } from "wouter";

export default function Estimates() {
  // Default to Estimate List whenever the Estimate module is opened.
  const [activeTab, setActiveTab] = useState<"createNew" | "list">("list");
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
  const [duplicateMode, setDuplicateMode] = useState(false);
  const [initialEstimateNo, setInitialEstimateNo] = useState("");

  const [location, setLocation] = useLocation();

  // Read navigation coming from the global search, for example:
  // /estimate?tab=list&estimateNo=EST-001
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const requestedTab = params.get("tab");
    const requestedEstimateNo = params.get("estimateNo") || "";

    if (requestedTab === "list" || requestedEstimateNo) {
      setSelectedEstimate(null);
      setDuplicateMode(false);
      setInitialEstimateNo(requestedEstimateNo);
      setActiveTab("list");
      return;
    }

    // Opening /estimate directly should still land on Estimate List.
    setInitialEstimateNo("");
    setActiveTab("list");
  }, [location]);

  // Called by EstimateList when user clicks Edit.
  const handleEdit = (estimate: Estimate) => {
    setSelectedEstimate(estimate);
    setDuplicateMode(false);
    setActiveTab("createNew");
  };

  // Called by EstimateList when user clicks Duplicate.
  const handleDuplicate = (estimate: Estimate) => {
    setSelectedEstimate(estimate);
    setDuplicateMode(true);
    setActiveTab("createNew");
  };

  const handleCreateNew = () => {
    setSelectedEstimate(null);
    setDuplicateMode(false);
    setInitialEstimateNo("");
    setActiveTab("createNew");

    // Remove any global-search query so refreshing does not force List again.
    if (location !== "/estimate") {
      setLocation("/estimate", { replace: true } as any);
    }
  };

  const handleShowList = () => {
    setSelectedEstimate(null);
    setDuplicateMode(false);
    setInitialEstimateNo("");
    setActiveTab("list");

    // Keep the module on its clean list URL.
    setLocation("/estimate?tab=list", { replace: true } as any);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Modern Tabs */}
      <div className="mb-6 flex w-fit items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        <Button
          type="button"
          variant="ghost"
          onClick={handleCreateNew}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
            activeTab === "createNew"
              ? "bg-slate-900 text-white shadow-md hover:bg-slate-900 hover:text-white"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          Create New
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={handleShowList}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
            activeTab === "list"
              ? "bg-slate-900 text-white shadow-md hover:bg-slate-900 hover:text-white"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          Estimate List
        </Button>
      </div>

      {/* Content */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
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
            initialEstimateNo={initialEstimateNo}
          />
        )}
      </div>
    </div>
  );
}
