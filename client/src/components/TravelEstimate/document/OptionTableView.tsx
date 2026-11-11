import { cn } from "@/lib/utils";
import { FLIGHT_TABLE_COLUMNS, RATE_COLUMN_HEADING, type OptionTable } from "./optionTable";

const cell = "border border-foreground/70 px-2 py-1";

/** An airline option as a bordered table, laid out like the quote sheet. */
export function OptionTableView({ table }: { table: OptionTable }) {
  const rowCount = table.rows.length;

  return (
    <table className="w-full min-w-[68rem] border-collapse text-sm">
      <thead>
        <tr className="bg-muted/60">
          <th className={cell} />
          {FLIGHT_TABLE_COLUMNS.map((column) => (
            <th key={column} className={cn(cell, "whitespace-nowrap font-semibold")}>
              {column}
            </th>
          ))}
          {table.fares.map((_, index) => (
            <th key={index} className={cn(cell, "font-semibold")}>
              {RATE_COLUMN_HEADING}
            </th>
          ))}
        </tr>
        <tr>
          <th className={cell} />
          <th colSpan={FLIGHT_TABLE_COLUMNS.length} className={cn(cell, "text-base font-bold tracking-wide")}>
            {table.heading || "-"}
          </th>
          {table.fares.map((fare, index) => (
            <th key={index} className={cn(cell, "whitespace-nowrap text-xs font-semibold")}>
              {fare.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((row, rowIndex) => (
          <tr key={row.key} className="text-center">
            {rowIndex === 0 && (
              <td rowSpan={rowCount} className={cn(cell, "whitespace-nowrap font-bold")}>
                {table.label}
              </td>
            )}
            <td className={cn(cell, "whitespace-nowrap font-mono")}>{row.route}</td>
            <td className={cn(cell, "whitespace-nowrap font-mono")}>{row.flightNumber}</td>
            <td className={cn(cell, "whitespace-nowrap")}>{row.departDate}</td>
            <td className={cn(cell, "whitespace-nowrap")}>{row.arrivalDate}</td>
            <td className={cn(cell, "whitespace-nowrap")}>{row.departTime}</td>
            <td className={cn(cell, "whitespace-nowrap")}>{row.arrivalTime}</td>
            {row.journey && (
              <>
                <td rowSpan={row.journey.rowSpan} className={cn(cell, "whitespace-nowrap")}>
                  {row.journey.stops}
                </td>
                <td rowSpan={row.journey.rowSpan} className={cn(cell, "whitespace-pre-line")}>
                  {row.journey.stopover}
                </td>
                <td rowSpan={row.journey.rowSpan} className={cn(cell, "whitespace-nowrap")}>
                  {row.journey.duration}
                </td>
              </>
            )}
            <td className={cn(cell, "font-mono")}>{row.carrier}</td>
            {rowIndex === 0 &&
              table.fares.map((fare, index) => (
                <td
                  key={index}
                  rowSpan={rowCount}
                  className={cn(cell, "min-w-[12rem] text-left", fare.details.length ? "align-top" : "align-middle")}
                >
                  <div className="whitespace-nowrap text-center text-base font-bold">{fare.price}</div>
                  {fare.details.map((line) => (
                    <div key={line} className="mt-1 text-xs">
                      {line}
                    </div>
                  ))}
                </td>
              ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
