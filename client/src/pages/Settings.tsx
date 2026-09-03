// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import ServicesSettings from "./ServicesSettings";
// import TaxSettings from "./TaxSettings";
// import CompanySettings from "./CompanySettings";
// import PaymentTerms from "./PaymentTerms";
// import TermsConditionsSettings from "./TermsConditionsSettings";
// import PackageSettings from "./PackageSettings"; // ✅ ADD
// import { Link } from "wouter";
// import { travelTabs } from "@/data/travelTabs";

// export default function Settings() {
//   const [activeTab, setActiveTab] = useState<
//     | "general"
//     | "services"
//     | "tax"
//     | "TermsConditionsSettings"
//     | "companySettings"
//     | "paymentTerms"
//     | "packageSettings" // ✅ ADD
//   >("general");

//   return (
//     <div className="p-6 space-y-6">
//       <h1 className="text-2xl font-semibold border-b pb-2">Settings</h1>

//       {/* Tab Navigation */}
//       <div className="flex flex-wrap gap-2">
//         <Button
//           variant={activeTab === "general" ? "default" : "outline"}
//           onClick={() => setActiveTab("general")}
//         >
//           General
//         </Button>

//         <Button
//           variant={activeTab === "services" ? "default" : "outline"}
//           onClick={() => setActiveTab("services")}
//         >
//           Services
//         </Button>

//         <Button
//           variant={activeTab === "packageSettings" ? "default" : "outline"} // ✅ ADD
//           onClick={() => setActiveTab("packageSettings")} // ✅ ADD
//         >
//           Package
//         </Button>

//         <Button
//           variant={activeTab === "tax" ? "default" : "outline"}
//           onClick={() => setActiveTab("tax")}
//         >
//           Tax
//         </Button>

//         <Button
//           variant={activeTab === "companySettings" ? "default" : "outline"}
//           onClick={() => setActiveTab("companySettings")}
//         >
//           Company
//         </Button>

//         <Button
//           variant={activeTab === "paymentTerms" ? "default" : "outline"}
//           onClick={() => setActiveTab("paymentTerms")}
//         >
//           Payment Terms
//         </Button>

//         <Button
//           variant={
//             activeTab === "TermsConditionsSettings" ? "default" : "outline"
//           }
//           onClick={() => setActiveTab("TermsConditionsSettings")}
//         >
//           Terms & Conditions
//         </Button>

//         {/* Travel Hover Dropdown */}
//         <div className="relative group">
//           <Button variant="outline">Travel</Button>

//           <div className="absolute left-0 top-full z-50 hidden min-w-[180px] rounded-md border bg-white shadow-md group-hover:block">
//             <div className="py-1">
//               {travelTabs.map((t) => (
//                 <Link key={t.path} href={t.path}>
//                   <button
//                     type="button"
//                     className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
//                   >
//                     {t.label}
//                   </button>
//                 </Link>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Tab Content */}
//       <div className="mt-4">
//         {activeTab === "general" && (
//           <div className="p-4 border rounded-lg bg-gray-50">
//             <h2 className="text-lg font-medium">General Settings</h2>
//             <p className="text-sm text-gray-600 mt-2">
//               Future general settings will go here.
//             </p>
//           </div>
//         )}
//         {activeTab === "services" && <ServicesSettings />}
//         {activeTab === "packageSettings" && <PackageSettings />} {/* ✅ ADD */}
//         {activeTab === "tax" && <TaxSettings />}
//         {activeTab === "companySettings" && <CompanySettings />}
//         {activeTab === "paymentTerms" && <PaymentTerms />}
//         {activeTab === "TermsConditionsSettings" && <TermsConditionsSettings />}
//       </div>
//     </div>
//   );
// }

import { useState } from "react";
import { Button } from "@/components/ui/button";
import ServicesSettings from "./ServicesSettings";
import TaxSettings from "./TaxSettings";
import CompanySettings from "./CompanySettings";
import PaymentTerms from "./PaymentTerms";
import TermsConditionsSettings from "./TermsConditionsSettings";
import FooterTextSettings from "./FooterTextSettings";
import PackageSettings from "./PackageSettings";
import PaymentWaiverSettings from "./PaymentWaiverSettings";
import { Link } from "wouter";
import { travelTabs } from "@/data/travelTabs";

type SettingsTab =
  | "general"
  | "services"
  | "tax"
  | "TermsConditionsSettings"
  | "footerTextSettings"
  | "companySettings"
  | "paymentTerms"
  | "packageSettings"
  | "paymentWaiver";

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold border-b pb-2">Settings</h1>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeTab === "general" ? "default" : "outline"}
          onClick={() => setActiveTab("general")}
        >
          General
        </Button>

        <Button
          variant={activeTab === "services" ? "default" : "outline"}
          onClick={() => setActiveTab("services")}
        >
          Services
        </Button>

        <Button
          variant={activeTab === "packageSettings" ? "default" : "outline"}
          onClick={() => setActiveTab("packageSettings")}
        >
          Package
        </Button>

        <Button
          variant={activeTab === "tax" ? "default" : "outline"}
          onClick={() => setActiveTab("tax")}
        >
          Tax
        </Button>

        <Button
          variant={activeTab === "companySettings" ? "default" : "outline"}
          onClick={() => setActiveTab("companySettings")}
        >
          Company
        </Button>

        <Button
          variant={activeTab === "paymentTerms" ? "default" : "outline"}
          onClick={() => setActiveTab("paymentTerms")}
        >
          Payment Terms
        </Button>

        <Button
          variant={activeTab === "paymentWaiver" ? "default" : "outline"}
          onClick={() => setActiveTab("paymentWaiver")}
        >
          Payment Waiver
        </Button>

        <Button
          variant={
            activeTab === "TermsConditionsSettings" ? "default" : "outline"
          }
          onClick={() => setActiveTab("TermsConditionsSettings")}
        >
          Terms & Conditions
        </Button>

        <Button
          variant={activeTab === "footerTextSettings" ? "default" : "outline"}
          onClick={() => setActiveTab("footerTextSettings")}
        >
          Footer Text
        </Button>

        <div className="relative group">
          <Button variant="outline">Travel</Button>

          <div className="absolute left-0 top-full z-50 hidden min-w-[180px] rounded-md border bg-white shadow-md group-hover:block">
            <div className="py-1">
              {travelTabs.map((tab) => (
                <Link key={tab.path} href={tab.path}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                  >
                    {tab.label}
                  </button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        {activeTab === "general" && (
          <div className="p-4 border rounded-lg bg-gray-50">
            <h2 className="text-lg font-medium">General Settings</h2>
            <p className="text-sm text-gray-600 mt-2">
              Future general settings will go here.
            </p>
          </div>
        )}

        {activeTab === "services" && <ServicesSettings />}
        {activeTab === "packageSettings" && <PackageSettings />}
        {activeTab === "tax" && <TaxSettings />}
        {activeTab === "companySettings" && <CompanySettings />}
        {activeTab === "paymentTerms" && <PaymentTerms />}
        {activeTab === "paymentWaiver" && <PaymentWaiverSettings />}
        {activeTab === "TermsConditionsSettings" && <TermsConditionsSettings />}
        {activeTab === "footerTextSettings" && <FooterTextSettings />}
      </div>
    </div>
  );
}
