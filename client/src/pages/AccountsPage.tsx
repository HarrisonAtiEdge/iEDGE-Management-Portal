import React, { useState } from "react";
import AccountsDashboard from "../components/Accounts/AccountsDashboard";
import PaymentTransactions from "../components/Accounts/PaymentTransactions";
import { Button } from "@/components/ui/button";

export default function AccountsPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "transactions">(
    "dashboard",
  );

  return (
    <div className="p-6">
      {/* TOP BUTTONS */}

      <div className="mb-4 flex gap-2">
        <Button
          variant={activeTab === "dashboard" ? "default" : "outline"}
          onClick={() => setActiveTab("dashboard")}
        >
          Accounts Dashboard
        </Button>

        <Button
          variant={activeTab === "transactions" ? "default" : "outline"}
          onClick={() => setActiveTab("transactions")}
        >
          Payment Transactions
        </Button>
      </div>

      {/* TAB CONTENT */}

      {activeTab === "dashboard" && <AccountsDashboard />}

      {activeTab === "transactions" && <PaymentTransactions />}
    </div>
  );
}
