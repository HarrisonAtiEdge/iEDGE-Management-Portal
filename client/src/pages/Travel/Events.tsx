import TravelTabs from "./TravelTabs";

export default function Events() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-3">Travel Settings</h2>
        <TravelTabs />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Events</h3>
        <p className="text-sm text-muted-foreground">
          Manage Events bookings, vendors, rates, confirmations, and vouchers
          here.
        </p>
      </div>
    </div>
  );
}
