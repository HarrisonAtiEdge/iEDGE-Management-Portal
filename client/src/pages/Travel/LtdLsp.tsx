import TravelTabs from "./TravelTabs";

export default function Ticketing() {
  return (
  <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Travel</h2>
          <TravelTabs />
        </div>
  
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">LtdLsp</h3>
          <p className="text-sm text-muted-foreground">
            Manage LtdLsp bookings, vendors, rates, confirmations, and vouchers here.
          </p>
        </div>
      </div>
  );
}
