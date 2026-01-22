"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { NotificationBell } from "@/components/NotificationBell";

const PANEL_ID = "IEDGE-SYSTEM";

// 🔹 All available tabs (for main_admin full access)
const AVAILABLE_TABS = [
  { path: "/dashboard", label: "Dashboard", icon: "fas fa-tachometer-alt" },
  { path: "/sales-dashboard", label: "Sales Dashboard", icon: "fas fa-chart-line" },
  { path: "/sales", label: "Sales", icon: "fas fa-chart-bar" },
  { path: "/clients", label: "Clients", icon: "fas fa-user" },
  { path: "/records", label: "Records", icon: "fas fa-archive" },
  { path: "/online-accounts", label: "Online Accounts", icon: "fas fa-globe" },
  { path: "/finance", label: "Finance", icon: "fas fa-receipt" },
  { path: "/invoices", label: "Invoices", icon: "fas fa-receipt" },
  { path: "/expenses", label: "Expenses", icon: "fas fa-receipt" },
  { path: "/estimate", label: "Estimate", icon: "fas fa-receipt" },
  { path: "/users", label: "User Management", icon: "fas fa-users" },
  { path: "/sales-management", label: "Sales Management", icon: "fas fa-chart-pie" },
  { path: "/settings", label: "Settings", icon: "fas fa-receipt" },
  { path: "/travel/hotel", label: "Travel ", icon: "fas fa-hotel" },
  { path: "/usertravel", label: "User Travel", icon: "fas fa-hotel" },


];

interface SidebarItem {
  path: string;
  label: string;
  icon?: string;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);
  const [userName, setUserName] = useState<string>("User");

  const [location, setLocation] = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.clear();
    setLocation("/login");
  };

 useEffect(() => {
  let unsubRole: (() => void) | null = null;

  const unsubAuth = onAuthStateChanged(auth, async (user) => {
    if (unsubRole) {
      unsubRole();
      unsubRole = null;
    }

    if (!user) {
      setRole(null);
      setSidebarItems([]);
      setUserName("Guest");
      setLoading(false);
      setLocation("/login");
      return;
    }

    // ✅ USER PROFILE (Panel scoped)
const userRef = doc(db, "Panels", "IEDGE-SYSTEM", "users", user.uid);

    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      setSidebarItems([]);
      setRole(null);
      setLoading(false);
      return;
    }

    const userData = userSnap.data();
    const userRole = userData.role;

    setRole(userRole);
    setUserName(userData.displayName || user.displayName || "User");

    // ✅ Main admin sees all tabs
    if (userRole === "main_admin") {
      setSidebarItems(AVAILABLE_TABS);
      setLoading(false);
      return;
    }

    // ✅ ROLE-BASED SIDEBAR (Panel scoped)
    if (userRole) {const roleRef = doc(db, "Panels", "IEDGE-SYSTEM", "sidebarConfig", userRole);

      unsubRole = onSnapshot(roleRef, (snap) => {
        if (snap.exists()) {
          setSidebarItems(snap.data().items || []);
        } else {
          setSidebarItems([]);
        }
        setLoading(false);
      });
    } else {
      setSidebarItems([]);
      setLoading(false);
    }
  });

  return () => {
    unsubAuth();
    if (unsubRole) unsubRole();
  };
}, [setLocation]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const pageTitle =
    sidebarItems.find((i) => i.path === location)?.label || "Dashboard";

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-4">
        <h2 className="text-xl font-bold mb-6">App</h2>
        <nav className="space-y-2">
          {sidebarItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <Button
                variant={location === item.path ? "default" : "ghost"}
                className="w-full justify-start"
              >
                {item.icon && <i className={`${item.icon} mr-2`} />}
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b bg-white">
          <h1 className="text-lg font-semibold">{pageTitle}</h1>
          <div className="flex items-center gap-4">
            <NotificationBell />

            <div className="flex items-center gap-2">
              <div className="flex items-center space-x-2 bg-secondary px-3 py-3 rounded-full">
                <i className="fas fa-user-circle text-muted-foreground"></i>
                <User className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-secondary-foreground">
                  {userName}
                </span>
                <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full capitalize">
                  {role || "no-role"}
                </span>
              </div>

              <Button
                variant="outline"
                className="text-slate-600 hover:text-slate-900"
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
