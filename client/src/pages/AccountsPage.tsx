// import React, { useState } from "react";
// import AccountsDashboard from "../components/Accounts/AccountsDashboard";
// import PaymentTransactions from "../components/Accounts/PaymentTransactions";
// import { Button } from "@/components/ui/button";

// export default function AccountsPage() {
//   const [activeTab, setActiveTab] = useState<"dashboard" | "transactions">(
//     "dashboard",
//   );

//   return (
//     <div className="p-6">
//       {/* TOP BUTTONS */}

//       <div className="mb-4 flex gap-2">
//         <Button
//           variant={activeTab === "dashboard" ? "default" : "outline"}
//           onClick={() => setActiveTab("dashboard")}
//         >
//           Accounts Dashboard
//         </Button>

//         <Button
//           variant={activeTab === "transactions" ? "default" : "outline"}
//           onClick={() => setActiveTab("transactions")}
//         >
//           Payment Transactions
//         </Button>
//       </div>

//       {/* TAB CONTENT */}

//       {activeTab === "dashboard" && <AccountsDashboard />}

//       {activeTab === "transactions" && <PaymentTransactions />}
//     </div>
//   );
// }




import React, { useState } from "react";
import AccountsDashboard from "../components/Accounts/AccountsDashboard";
import PaymentTransactions from "../components/Accounts/PaymentTransactions";
import { Button } from "@/components/ui/button";

export default function AccountsPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "transactions">(
    "dashboard"
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      {/* MODERN TAB BUTTONS */}
      <div className="mb-6 inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setActiveTab("dashboard")}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
            activeTab === "dashboard"
              ? "bg-slate-900 text-white shadow-md hover:bg-slate-900 hover:text-white"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          Accounts Dashboard
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={() => setActiveTab("transactions")}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
            activeTab === "transactions"
              ? "bg-slate-900 text-white shadow-md hover:bg-slate-900 hover:text-white"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          Payment Transactions
        </Button>
      </div>

      {/* TAB CONTENT */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        {activeTab === "dashboard" && <AccountsDashboard />}

        {activeTab === "transactions" && <PaymentTransactions />}
      </div>
    </div>
  );
}