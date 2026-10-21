import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { canAccessRtgs } from "./rtgsData";

export const RTGS_TABS = [
  { path: "/RTGS/form", label: "RTGS Form" },
  { path: "/RTGS/list", label: "RTGS List" },
  { path: "/RTGS/vendors", label: "RTGS Vendors" },
  { path: "/RTGS/authorizers", label: "Authorizer" },
];

interface RtgsShellProps {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}

/** Page frame for every RTGS screen: role check, header and module tabs. */
export default function RtgsShell({ title, description, actions, children }: RtgsShellProps) {
  const { userProfile } = useAuth();
  const [location] = useLocation();

  if (!canAccessRtgs(userProfile?.role)) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-destructive" />
          <h2 className="mb-2 text-xl font-semibold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground">
            Only the finance team and main admins can use RTGS.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>

      <div className="flex flex-wrap gap-2">
        {RTGS_TABS.map((tab) => (
          <Link key={tab.path} href={tab.path}>
            <Button
              size="sm"
              variant={location.toLowerCase() === tab.path.toLowerCase() ? "default" : "outline"}
              className="rounded-2xl"
            >
              {tab.label}
            </Button>
          </Link>
        ))}
      </div>

      {children}
    </div>
  );
}
