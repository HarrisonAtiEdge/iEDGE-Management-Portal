import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { TRAVEL_ESTIMATE_ROUTES } from "./constants";

/** Module tabs. Add a screen here and it shows on every Travel Estimate page. */
export const TRAVEL_ESTIMATE_TABS = [
  { path: TRAVEL_ESTIMATE_ROUTES.create, label: "Create Travel Estimate" },
  { path: TRAVEL_ESTIMATE_ROUTES.list, label: "Travel Estimate List" },
];

interface TravelEstimateShellProps {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}

/** Page frame for every Travel Estimate screen: header and module tabs. */
export function TravelEstimateShell({ title, description, actions, children }: TravelEstimateShellProps) {
  const [location] = useLocation();

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
        {TRAVEL_ESTIMATE_TABS.map((tab) => (
          <Link key={tab.path} href={tab.path}>
            <Button size="sm" variant={location === tab.path ? "default" : "outline"} className="rounded-2xl">
              {tab.label}
            </Button>
          </Link>
        ))}
      </div>

      {children}
    </div>
  );
}
