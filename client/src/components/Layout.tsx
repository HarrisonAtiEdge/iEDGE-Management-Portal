// "use client";

// import { useEffect, useState } from "react";
// import { onAuthStateChanged, signOut } from "firebase/auth";
// import { doc, getDoc, onSnapshot } from "firebase/firestore";
// import { auth, db } from "@/lib/firebase";
// import { Button } from "@/components/ui/button";
// import type { LucideIcon } from "lucide-react";
// import {
//   ChevronLeft,
//   ChevronRight,
//   Loader2,
//   LogOut,
//   User,
//   LayoutDashboard,
//   LineChart,
//   BarChart3,
//   UserRound,
//   Archive,
//   Globe,
//   Receipt,
//   Users,
//   PieChart,
//   Settings,
//   Hotel,
//   FileText,
//   Scroll,
//   ScrollText,
//   BedDouble,
//   PlaneTakeoff,
//   CreditCard,
//   HandCoins,
// } from "lucide-react";
// import { Link, useLocation } from "wouter";
// import { NotificationBell } from "@/components/NotificationBell";
// import { useNotifications } from "@/hooks/useNotifications";
// import { ThemeToggle } from "@/components/theme-toggle";
// const PANEL_ID = "IEDGE-SYSTEM";

// // ✅ Lucide icon registry (use these keys in Firestore: icon: "LayoutDashboard", etc.)
// const LUCIDE_ICONS: Record<string, LucideIcon> = {
//   LayoutDashboard,
//   LineChart,
//   BarChart3,
//   UserRound,
//   Archive,
//   Globe,
//   Receipt,
//   Users,
//   PieChart,
//   Settings,
//   Hotel,
//   FileText,
//   Scroll,
//   ScrollText,
//   BedDouble,
//   PlaneTakeoff,
//   CreditCard,
//   HandCoins,
// };

// // ✅ Backward-compat: if Firestore still has old FontAwesome strings, map them to Lucide
// const FA_TO_LUCIDE: Record<string, LucideIcon> = {
//   "fas fa-tachometer-alt": LayoutDashboard,
//   "fas fa-chart-line": LineChart,
//   "fas fa-chart-bar": BarChart3,
//   "fas fa-user": UserRound,
//   "fas fa-archive": Archive,
//   "fas fa-globe": Globe,
//   "fas fa-receipt": Receipt,
//   "fas fa-users": Users,
//   "fas fa-chart-pie": PieChart,
//   "fas fa-hotel": Hotel,
// };

// const getSidebarIcon = (icon?: string): LucideIcon | null => {
//   if (!icon) return null;
//   return LUCIDE_ICONS[icon] ?? FA_TO_LUCIDE[icon] ?? null;
// };

// // 🔹 All available tabs (for main_admin full access)
// const AVAILABLE_TABS = [
//   { path: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
//   { path: "/sales-dashboard", label: "Sales Dashboard", icon: "LineChart" },
//   { path: "/project", label: "Project", icon: "BarChart3" },
//   { path: "/clients", label: "Clients", icon: "Users" },
//   { path: "/records", label: "Records", icon: "Archive" },
//   { path: "/online-accounts", label: "Online Accounts", icon: "CreditCard" },
//   { path: "/finance", label: "Finance", icon: "Receipt" },
//   { path: "/invoices", label: "Budget Request", icon: "HandCoins" },
//   { path: "/expenses", label: "Expenses", icon: "Receipt" },
//   { path: "/estimate", label: "Estimate", icon: "Scroll" },
//   {
//     path: "/estimateInternational",
//     label: "International Estimate",
//     icon: "Globe",
//   },
//   { path: "/users", label: "User Management", icon: "UserRound" },
//   { path: "/sales-management", label: "Sales Management", icon: "PieChart" },
//   { path: "/settings", label: "Settings", icon: "Settings" },
//   { path: "/travel/hotel", label: "Travel", icon: "PlaneTakeoff" },
//   { path: "/usertravel", label: "Book Hotel", icon: "BedDouble" },
//   { path: "/booking", label: "Bookings", icon: "Hotel" },
//   { path: "/invoice-estimate", label: "Invoice Estimate", icon: "ScrollText" },
//   { path: "/accounts", label: "Account ledger", icon: "WalletCards" },
//   { path: "/suppliers", label: "Suppliers", icon: "BookUser" },
//   { path: "/contact-persons", label: "Contact Persons", icon: "User" },
//   { path: "/reimbursement", label: "Reimbursement", icon: "Receipt" },
// ];

// interface SidebarItem {
//   path: string;
//   label: string;
//   icon?: string; // ✅ store lucide key (recommended) OR old FA string (supported)
// }

// export default function Layout({ children }: { children: React.ReactNode }) {
//   const [loading, setLoading] = useState(true);
//   const [role, setRole] = useState<string | null>(null);
//   const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);
//   const [userName, setUserName] = useState<string>("User");

//   const [location, setLocation] = useLocation();

//   // ✅ Sidebar collapse (icons-only) + hover-to-open
//   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
//   const [sidebarHoverOpen, setSidebarHoverOpen] = useState(false);

//   const effectiveCollapsed = sidebarCollapsed && !sidebarHoverOpen;

//   // ✅ Hook must be inside the component
//   const { unreadCount, notifications } = useNotifications();
//   console.log("Layout unreadCount:", unreadCount);
//   console.log("notif debug:", {
//     unreadCount,
//     notificationsLen: notifications?.length,
//   });

//   const handleLogout = async () => {
//     await signOut(auth);
//     localStorage.clear();
//     setLocation("/login");
//   };

//   useEffect(() => {
//     // restore sidebar state
//     try {
//       const saved = localStorage.getItem("iedge_sidebar_collapsed");
//       if (saved === "1") setSidebarCollapsed(true);
//     } catch {}
//   }, []);

//   useEffect(() => {
//     // persist sidebar state
//     try {
//       localStorage.setItem(
//         "iedge_sidebar_collapsed",
//         sidebarCollapsed ? "1" : "0",
//       );
//     } catch {}
//   }, [sidebarCollapsed]);

//   useEffect(() => {
//     let unsubRole: (() => void) | null = null;

//     const unsubAuth = onAuthStateChanged(auth, async (user) => {
//       if (unsubRole) {
//         unsubRole();
//         unsubRole = null;
//       }

//       if (!user) {
//         setRole(null);
//         setSidebarItems([]);
//         setUserName("Guest");
//         setLoading(false);
//         setLocation("/login");
//         return;
//       }

//       // ✅ USER PROFILE (Panel scoped)
//       const userRef = doc(db, "Panels", PANEL_ID, "users", user.uid);
//       const userSnap = await getDoc(userRef);

//       if (!userSnap.exists()) {
//         setSidebarItems([]);
//         setRole(null);
//         setLoading(false);
//         return;
//       }

//       const userData = userSnap.data();
//       const userRole = userData.role;

//       setRole(userRole);
//       setUserName(userData.displayName || user.displayName || "User");

//       // ✅ Main admin sees all tabs
//       if (userRole === "main_admin") {
//         setSidebarItems(AVAILABLE_TABS);
//         setLoading(false);
//         return;
//       }

//       // ✅ ROLE-BASED SIDEBAR (Panel scoped)
//       if (userRole) {
//         const roleRef = doc(db, "Panels", PANEL_ID, "sidebarConfig", userRole);

//         unsubRole = onSnapshot(roleRef, (snap) => {
//           if (snap.exists()) {
//             setSidebarItems(snap.data().items || []);
//           } else {
//             setSidebarItems([]);
//           }
//           setLoading(false);
//         });
//       } else {
//         setSidebarItems([]);
//         setLoading(false);
//       }
//     });

//     return () => {
//       unsubAuth();
//       if (unsubRole) unsubRole();
//     };
//   }, [setLocation]);

//   if (loading) {
//     return (
//       <div className="flex h-screen items-center justify-center">
//         <Loader2 className="h-6 w-6 animate-spin" />
//       </div>
//     );
//   }

//   const pageTitle =
//     sidebarItems.find((i) => i.path === location)?.label || "Dashboard";

//   return (
//     <div className="flex h-screen bg-background text-foreground">
//       {/* Sidebar */}
//       <aside
//         className={`bg-card border-r border-border shadow-sm flex flex-col transition-all duration-200 ${
//           effectiveCollapsed ? "w-16 px-2 py-4" : "w-64 p-4"
//         }`}
//         onMouseEnter={() => {
//           if (sidebarCollapsed) setSidebarHoverOpen(true);
//         }}
//         onMouseLeave={() => {
//           if (sidebarCollapsed) setSidebarHoverOpen(false);
//         }}
//       >
//         <div
//           className={`flex items-center mb-6 ${
//             effectiveCollapsed ? "justify-center gap-0" : "justify-between"
//           }`}
//         >
//           {effectiveCollapsed ? (
//             <div className="h-9 w-9 rounded-md pl-3 flex items-center font-bold"></div>
//           ) : (
//             <h2 className="text-sm font-bold pl-2">iEDGE Management</h2>
//           )}

//           <Button
//             variant="ghost"
//             className={`${effectiveCollapsed ? "ml-0" : ""} h-9 w-9 p-0`}
//             aria-label={
//               sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
//             }
//             title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
//             onClick={() => {
//               setSidebarCollapsed((v) => !v);
//               setSidebarHoverOpen(false);
//             }}
//           >
//             {sidebarCollapsed ? (
//               <ChevronRight className="h-4 w-4" />
//             ) : (
//               <ChevronLeft className="h-4 w-4" />
//             )}
//           </Button>
//         </div>

//         <nav className="space-y-2">
//           {sidebarItems.map((item) => {
//             const showDot =
//               unreadCount > 0 && item.path === "/sales-management";
//             const Icon = getSidebarIcon(item.icon);

//             return (
//               <Link key={item.path} href={item.path}>
//                 <Button
//                   variant={location === item.path ? "default" : "ghost"}
//                   className={`w-full ${effectiveCollapsed ? "justify-center px-2" : "justify-start"}`}
//                   title={effectiveCollapsed ? item.label : undefined}
//                   aria-label={item.label}
//                 >
//                   <div
//                     className={`flex w-full items-center ${
//                       effectiveCollapsed ? "justify-center" : "justify-between"
//                     }`}
//                   >
//                     <div className="flex items-center">
//                       <span className="relative inline-flex items-center justify-center">
//                         {Icon ? (
//                           <Icon
//                             className={`h-4 w-4 ${effectiveCollapsed ? "" : "mr-2"}`}
//                           />
//                         ) : (
//                           <span
//                             className={`font-semibold ${effectiveCollapsed ? "" : "mr-2"}`}
//                           >
//                             {item.label?.[0] || "•"}
//                           </span>
//                         )}

//                         {showDot && effectiveCollapsed && (
//                           <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
//                             <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
//                             <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
//                           </span>
//                         )}
//                       </span>

//                       {!effectiveCollapsed && <span>{item.label}</span>}
//                     </div>

//                     {showDot && !effectiveCollapsed && (
//                       <span className="relative flex h-2.5 w-2.5">
//                         <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
//                         <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
//                       </span>
//                     )}
//                   </div>
//                 </Button>
//               </Link>
//             );
//           })}
//         </nav>
//       </aside>

//       {/* Main content */}
//       <main className="flex-1 flex flex-col">
//         {/* Header */}
//         <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
//           <h1 className="text-lg font-semibold">{pageTitle}</h1>
//           <div className="flex items-center gap-4">
//             <ThemeToggle />
//             <NotificationBell />
//             <div className="flex items-center gap-2">
//               <div className="flex items-center space-x-2 bg-secondary px-3 py-3 rounded-full">
//                 <User className="h-4 w-4 text-muted-foreground" />
//                 <span className="text-sm font-medium text-secondary-foreground">
//                   {userName}
//                 </span>
//                 <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full capitalize">
//                   {role || "no-role"}
//                 </span>
//               </div>

//               <Button
//                 variant="outline"
//                 className="gap-2"
//                 onClick={handleLogout}
//               >
//                 Logout
//                 <LogOut className="h-5 w-5" />
//               </Button>
//             </div>
//           </div>
//         </header>

//         <div className="flex-1 overflow-y-auto p-6">{children}</div>
//       </main>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  LogOut,
  User,
  LayoutDashboard,
  LineChart,
  BarChart3,
  UserRound,
  Archive,
  Globe,
  Receipt,
  Users,
  PieChart,
  Settings,
  Hotel,
  FileText,
  Scroll,
  ScrollText,
  BedDouble,
  PlaneTakeoff,
  CreditCard,
  HandCoins,
  WalletCards,
  BookUser,
  CalendarCheck,
  ReceiptText,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { NotificationBell } from "@/components/NotificationBell";
import { useNotifications } from "@/hooks/useNotifications";
import { ThemeToggle } from "@/components/theme-toggle";

const PANEL_ID = "IEDGE-SYSTEM";

interface SidebarItem {
  path: string;
  label: string;
  icon?: string;
  children?: SidebarItem[];
}

// ✅ Lucide icon registry
const LUCIDE_ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  LineChart,
  BarChart3,
  UserRound,
  User,
  Archive,
  Globe,
  Receipt,
  Users,
  PieChart,
  Settings,
  Hotel,
  FileText,
  Scroll,
  ScrollText,
  BedDouble,
  PlaneTakeoff,
  CreditCard,
  HandCoins,
  WalletCards,
  BookUser,
  CalendarCheck,
  ReceiptText,
};

// ✅ Backward compatibility for old FontAwesome names
const FA_TO_LUCIDE: Record<string, LucideIcon> = {
  "fas fa-tachometer-alt": LayoutDashboard,
  "fas fa-chart-line": LineChart,
  "fas fa-chart-bar": BarChart3,
  "fas fa-user": User,
  "fas fa-archive": Archive,
  "fas fa-globe": Globe,
  "fas fa-receipt": Receipt,
  "fas fa-users": Users,
  "fas fa-chart-pie": PieChart,
  "fas fa-hotel": Hotel,
};

const getSidebarIcon = (icon?: string): LucideIcon | null => {
  if (!icon) return null;
  return LUCIDE_ICONS[icon] ?? FA_TO_LUCIDE[icon] ?? null;
};

const CONTACTS_DROPDOWN: SidebarItem = {
  path: "#",
  label: "Contacts Directory",
  icon: "BookUser",
  children: [
    { path: "/clients", label: "Clients", icon: "Users" },
    { path: "/suppliers", label: "Suppliers", icon: "BookUser" },
    { path: "/contact-persons", label: "Contact Persons", icon: "User" },
  ],
};

const FINANCE_DROPDOWN: SidebarItem = {
  path: "#",
  label: "Finance",
  icon: "WalletCards",
  children: [
    { path: "/account-statement", label: "Account Statement", icon: "Receipt" },
    { path: "/budget-requests", label: "Budget Requests", icon: "FileText" },
    { path: "/expenses", label: "Expenses", icon: "Receipt" },
    { path: "/accounts", label: "Accounts", icon: "WalletCards" },
    { path: "/reimbursement", label: "Reimbursement", icon: "HandCoins" },
    {
      path: "/claim-reimbursement",
      label: "Claim Reimbursement",
      icon: "ReceiptText",
    },
  ],
};

const TRAVEL_DROPDOWN: SidebarItem = {
  path: "#",
  label: "Travel",
  icon: "PlaneTakeoff",
  children: [
    { path: "/travel/ticketing", label: "Ticketing", icon: "PlaneTakeoff" },
    { path: "/usertravel", label: "Book Hotel", icon: "BedDouble" },
    { path: "/booking", label: "Bookings", icon: "Hotel" },
    { path: "/travel/hotel", label: "+ Add Hotels", icon: "Hotel" },
  ],
};

// ✅ Main admin fallback tabs
const AVAILABLE_TABS: SidebarItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { path: "/sales-dashboard", label: "Sales Dashboard", icon: "LineChart" },
  { path: "/project", label: "Projects", icon: "BarChart3" },
  { path: "/task-calendar", label: "Tasks", icon: "CalendarCheck" },
  { path: "/estimate", label: "Estimate", icon: "Scroll" },
  { path: "/invoice-estimate", label: "Invoice ", icon: "ScrollText" },
  { path: "/sales-management", label: "Pipeline Management", icon: "PieChart" },
  { path: "/users", label: "User Management", icon: "UserRound" },
  FINANCE_DROPDOWN,
  TRAVEL_DROPDOWN,
  CONTACTS_DROPDOWN,
  // { path: "/records", label: "Records", icon: "Archive" },

  // { path: "/budget-requests", label: "Budget Request", icon: "HandCoins" },
  // { path: "/expenses", label: "Expenses", icon: "Receipt" },
  // { path: "/accounts", label: "Account ledger", icon: "WalletCards" },
  // { path: "/reimbursement", label: "Reimbursement", icon: "Receipt" },
  // {
  //   path: "/estimateInternational",
  //   label: "International Estimate",
  //   icon: "Globe",
  // },

  { path: "/settings", label: "Settings", icon: "Settings" },

  // { path: "/accounts", label: "Account ledger", icon: "WalletCards" },
  // { path: "/reimbursement", label: "Reimbursement", icon: "Receipt" },
];

function normalizeRole(role: unknown): string {
  return String(role || "")
    .trim()
    .toLowerCase();
}

// ✅ Ensures admin/main_admin always get Contacts Directory dropdown
function ensureContactsDropdown(items: SidebarItem[]): SidebarItem[] {
  const safeItems = Array.isArray(items) ? items : [];

  const alreadyHasContactsDropdown = safeItems.some(
    (item) =>
      item.label === "Contacts Directory" ||
      item.children?.some(
        (child) =>
          child.path === "/clients" ||
          child.path === "/suppliers" ||
          child.path === "/contact-persons",
      ),
  );

  if (alreadyHasContactsDropdown) {
    return safeItems;
  }

  // Remove old standalone contact tabs if they exist, then insert dropdown
  const filteredItems = safeItems.filter(
    (item) =>
      item.path !== "/clients" &&
      item.path !== "/suppliers" &&
      item.path !== "/contact-persons",
  );

  const dashboardIndex = filteredItems.findIndex(
    (item) => item.path === "/dashboard",
  );

  if (dashboardIndex >= 0) {
    const updated = [...filteredItems];
    updated.splice(dashboardIndex + 1, 0, CONTACTS_DROPDOWN);
    return updated;
  }

  return [CONTACTS_DROPDOWN, ...filteredItems];
}

function ensureFinanceDropdown(items: SidebarItem[]): SidebarItem[] {
  const safeItems = Array.isArray(items) ? items : [];

  const alreadyHasFinanceDropdown = safeItems.some(
    (item) =>
      item.label === "Finance" &&
      item.children?.some(
        (child) =>
          child.path === "/budget-requests" ||
          child.path === "/expenses" ||
          child.path === "/accounts" ||
          child.path === "/reimbursement",
      ),
  );

  if (alreadyHasFinanceDropdown) {
    return safeItems;
  }

  const filteredItems = safeItems.filter(
    (item) =>
      item.path !== "/finance" &&
      item.path !== "/budget-requests" &&
      item.path !== "/expenses" &&
      item.path !== "/accounts" &&
      item.path !== "/reimbursement" &&
      item.label !== "Finance" &&
      item.label !== "Account ledger",
  );

  const contactsIndex = filteredItems.findIndex(
    (item) => item.label === "Contacts Directory",
  );

  if (contactsIndex >= 0) {
    const updated = [...filteredItems];
    updated.splice(contactsIndex + 1, 0, FINANCE_DROPDOWN);
    return updated;
  }

  const dashboardIndex = filteredItems.findIndex(
    (item) => item.path === "/dashboard",
  );

  if (dashboardIndex >= 0) {
    const updated = [...filteredItems];
    updated.splice(dashboardIndex + 1, 0, FINANCE_DROPDOWN);
    return updated;
  }

  return [FINANCE_DROPDOWN, ...filteredItems];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);
  const [userName, setUserName] = useState<string>("User");

  const [location, setLocation] = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarHoverOpen, setSidebarHoverOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>(
    {},
  );

  const effectiveCollapsed = sidebarCollapsed && !sidebarHoverOpen;

  const { unreadCount } = useNotifications();

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.clear();
    setLocation("/login");
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("iedge_sidebar_collapsed");
      if (saved === "1") setSidebarCollapsed(true);
    } catch {
      // ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "iedge_sidebar_collapsed",
        sidebarCollapsed ? "1" : "0",
      );
    } catch {
      // ignore localStorage errors
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    let unsubRole: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubRole) {
        unsubRole();
        unsubRole = null;
      }

      setLoading(true);

      if (!user) {
        setRole(null);
        setSidebarItems([]);
        setUserName("Guest");
        setLoading(false);
        setLocation("/login");
        return;
      }

      try {
        const userRef = doc(db, "Panels", PANEL_ID, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          setRole(null);
          setSidebarItems([]);
          setUserName(user.displayName || "User");
          setLoading(false);
          return;
        }

        const userData = userSnap.data();

        const userRole = normalizeRole(userData.role);

        setRole(userRole);
        setUserName(userData.displayName || user.displayName || "User");

        if (!userRole) {
          setSidebarItems([]);
          setLoading(false);
          return;
        }

        // ✅ Always read saved Firestore sidebar config first
        const roleRef = doc(db, "Panels", PANEL_ID, "sidebarConfig", userRole);

        unsubRole = onSnapshot(
          roleRef,
          (snap) => {
            const savedItems = snap.exists()
              ? ((snap.data().items || []) as SidebarItem[])
              : [];

            let finalItems: SidebarItem[] = [];

            if (savedItems.length > 0) {
              finalItems = savedItems;
            } else if (userRole === "main_admin") {
              finalItems = AVAILABLE_TABS;
            } else {
              finalItems = [];
            }

            // ✅ Force Contacts Directory dropdown for admin/main_admin
            if (userRole === "admin" || userRole === "main_admin") {
              finalItems = ensureContactsDropdown(finalItems);
              finalItems = ensureFinanceDropdown(finalItems);
            }

            if (userRole === "finance") {
              finalItems = ensureFinanceDropdown(finalItems);
            }

            setSidebarItems(finalItems);
            setLoading(false);
          },
          (error) => {
            console.error("Sidebar config load error:", error);

            if (userRole === "main_admin") {
              setSidebarItems(AVAILABLE_TABS);
            } else {
              setSidebarItems([]);
            }

            setLoading(false);
          },
        );
      } catch (error) {
        console.error("Layout auth/sidebar error:", error);
        setRole(null);
        setSidebarItems([]);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubRole) unsubRole();
    };
  }, [setLocation]);

  useEffect(() => {
    // ✅ Auto-open dropdown if current page is inside it
    const nextOpenDropdowns: Record<string, boolean> = {};

    sidebarItems.forEach((item) => {
      const key = `${item.label}-${item.path}`;
      const hasActiveChild = item.children?.some(
        (child) => child.path === location,
      );

      if (hasActiveChild) {
        nextOpenDropdowns[key] = true;
      }
    });

    setOpenDropdowns((prev) => ({
      ...prev,
      ...nextOpenDropdowns,
    }));
  }, [sidebarItems, location]);

  const getPageTitle = (items: SidebarItem[], currentPath: string): string => {
    for (const item of items) {
      if (item.path === currentPath) return item.label;

      if (item.children?.length) {
        const childTitle = getPageTitle(item.children, currentPath);
        if (childTitle !== "Dashboard") return childTitle;
      }
    }

    return "Dashboard";
  };

  const pageTitle = getPageTitle(sidebarItems, location);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside
        className={`bg-card border-r border-border shadow-sm flex flex-col transition-all duration-200 ${
          effectiveCollapsed ? "w-16 px-2 py-4" : "w-64 p-4"
        }`}
        onMouseEnter={() => {
          if (sidebarCollapsed) setSidebarHoverOpen(true);
        }}
        onMouseLeave={() => {
          if (sidebarCollapsed) setSidebarHoverOpen(false);
        }}
      >
        <div
          className={`flex items-center mb-6 ${
            effectiveCollapsed ? "justify-center gap-0" : "justify-between"
          }`}
        >
          {effectiveCollapsed ? (
            <div className="h-9 w-9 rounded-md pl-3 flex items-center font-bold" />
          ) : (
            <h2 className="text-sm font-bold pl-2">iEDGE Management</h2>
          )}

          <Button
            variant="ghost"
            className={`${effectiveCollapsed ? "ml-0" : ""} h-9 w-9 p-0`}
            aria-label={
              sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => {
              setSidebarCollapsed((v) => !v);
              setSidebarHoverOpen(false);
            }}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <nav className="space-y-2 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = getSidebarIcon(item.icon);
            const hasChildren = !!item.children?.length;
            const dropdownKey = `${item.label}-${item.path}`;
            const isDropdownOpen = !!openDropdowns[dropdownKey];

            const hasActiveChild = item.children?.some(
              (child) => child.path === location,
            );

            const isActive = location === item.path || hasActiveChild;

            const showDot =
              unreadCount > 0 &&
              (item.path === "/sales-management" ||
                item.children?.some(
                  (child) => child.path === "/sales-management",
                ));

            if (hasChildren) {
              return (
                <div key={dropdownKey} className="space-y-1">
                  <Button
                    type="button"
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full ${
                      effectiveCollapsed
                        ? "justify-center px-2"
                        : "justify-start"
                    }`}
                    title={effectiveCollapsed ? item.label : undefined}
                    aria-label={item.label}
                    onClick={() => {
                      if (effectiveCollapsed) {
                        setSidebarHoverOpen(true);
                        return;
                      }

                      setOpenDropdowns((prev) => ({
                        ...prev,
                        [dropdownKey]: !prev[dropdownKey],
                      }));
                    }}
                  >
                    <div
                      className={`flex w-full items-center ${
                        effectiveCollapsed
                          ? "justify-center"
                          : "justify-between"
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="relative inline-flex items-center justify-center">
                          {Icon ? (
                            <Icon
                              className={`h-4 w-4 ${
                                effectiveCollapsed ? "" : "mr-2"
                              }`}
                            />
                          ) : (
                            <span
                              className={`font-semibold ${
                                effectiveCollapsed ? "" : "mr-2"
                              }`}
                            >
                              {item.label?.[0] || "•"}
                            </span>
                          )}

                          {showDot && effectiveCollapsed && (
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                            </span>
                          )}
                        </span>

                        {!effectiveCollapsed && <span>{item.label}</span>}
                      </div>

                      {!effectiveCollapsed && (
                        <div className="flex items-center gap-2">
                          {showDot && (
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                            </span>
                          )}

                          {isDropdownOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      )}
                    </div>
                  </Button>

                  {!effectiveCollapsed && isDropdownOpen && (
                    <div className="ml-6 space-y-1 border-l pl-3">
                      {item.children?.map((child) => {
                        const ChildIcon = getSidebarIcon(child.icon);

                        const childShowDot =
                          unreadCount > 0 && child.path === "/sales-management";

                        return (
                          <Link key={child.path} href={child.path}>
                            <Button
                              variant={
                                location === child.path ? "default" : "ghost"
                              }
                              className="w-full justify-start"
                              aria-label={child.label}
                            >
                              <div className="flex w-full items-center justify-between">
                                <div className="flex items-center">
                                  {ChildIcon ? (
                                    <ChildIcon className="mr-2 h-4 w-4" />
                                  ) : (
                                    <span className="mr-2 font-semibold">
                                      {child.label?.[0] || "•"}
                                    </span>
                                  )}

                                  <span>{child.label}</span>
                                </div>

                                {childShowDot && (
                                  <span className="relative flex h-2.5 w-2.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                                  </span>
                                )}
                              </div>
                            </Button>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={location === item.path ? "default" : "ghost"}
                  className={`w-full ${
                    effectiveCollapsed ? "justify-center px-2" : "justify-start"
                  }`}
                  title={effectiveCollapsed ? item.label : undefined}
                  aria-label={item.label}
                >
                  <div
                    className={`flex w-full items-center ${
                      effectiveCollapsed ? "justify-center" : "justify-between"
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="relative inline-flex items-center justify-center">
                        {Icon ? (
                          <Icon
                            className={`h-4 w-4 ${
                              effectiveCollapsed ? "" : "mr-2"
                            }`}
                          />
                        ) : (
                          <span
                            className={`font-semibold ${
                              effectiveCollapsed ? "" : "mr-2"
                            }`}
                          >
                            {item.label?.[0] || "•"}
                          </span>
                        )}

                        {showDot && effectiveCollapsed && (
                          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                          </span>
                        )}
                      </span>

                      {!effectiveCollapsed && <span>{item.label}</span>}
                    </div>

                    {showDot && !effectiveCollapsed && (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                      </span>
                    )}
                  </div>
                </Button>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <h1 className="text-lg font-semibold">{pageTitle}</h1>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <NotificationBell />

            <div className="flex items-center gap-2">
              <div className="flex items-center space-x-2 bg-secondary px-3 py-3 rounded-full">
                <User className="h-4 w-4 text-muted-foreground" />

                <span className="text-sm font-medium text-secondary-foreground">
                  {userName}
                </span>

                <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full capitalize">
                  {role || "no-role"}
                </span>
              </div>

              <Button
                variant="outline"
                className="gap-2"
                onClick={handleLogout}
              >
                Logout
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
}
