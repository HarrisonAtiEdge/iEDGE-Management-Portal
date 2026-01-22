import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { travelTabs } from "@/data/travelTabs";

export default function TravelTabs() {
  const [location] = useLocation();

  return (
    <div className="flex flex-wrap gap-2">
      {travelTabs.map((t) => (
        <Link key={t.path} href={t.path}>
          <Button variant={location === t.path ? "default" : "outline"}>
            {t.label}
          </Button>
        </Link>
      ))}
    </div>
  );
}
