import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

const tabs = [
  { label: "Hotel", path: "/travel/hotel" },
  { label: "Transport", path: "/travel/transport" },
  { label: "Ticketing", path: "/travel/ticketing" },
  { label: "Events", path: "/travel/events" },
  { label: "LTD/LSP", path: "/travel/ltd-lsp" },
];

export default function Home() {
  const [location] = useLocation();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Travel</h2>
        <p className="text-sm text-muted-foreground">
          Choose a module to manage travel operations.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link key={t.path} href={t.path}>
            <Button variant={location === t.path ? "default" : "outline"}>
              {t.label}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
