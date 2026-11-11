import { cn } from "@/lib/utils";
import { applicantDisplayName, passportExpiredBy, sixMonthsAfter } from "../applicants";
import { APPLICANT_ACTIVE_LABEL, APPLICANT_STATUS_OPTIONS, applicantStatusLabel } from "../constants";
import { formatFullDate } from "../format";
import type { Applicant } from "../types";

const cell = "border-b px-2 py-1.5 text-left align-top";

interface ApplicantsPreviewProps {
  applicants: Applicant[];
  /** First departure date, for the passport validity check; "" if not set. */
  travelDate: string;
}

/** Application Details on the estimate preview, read-only. */
export function ApplicantsPreview({ applicants, travelDate }: ApplicantsPreviewProps) {
  const active = applicants.filter((applicant) => !applicant.status).length;
  const statusCounts = [
    { label: APPLICANT_ACTIVE_LABEL, count: active },
    ...APPLICANT_STATUS_OPTIONS.map((option) => ({
      label: option.label,
      count: applicants.filter((applicant) => applicant.status === option.value).length,
    })),
  ].filter(({ count }) => count > 0);
  const validityDate = travelDate ? sixMonthsAfter(travelDate) : "";

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide">Application Details</h3>
        <p className="text-xs text-muted-foreground">
          {applicants.length} applicant{applicants.length === 1 ? "" : "s"}
          {statusCounts.map(({ label, count }) => ` · ${count} ${label}`).join("")}
        </p>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[52rem] border-collapse text-xs">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className={cell}>S.No</th>
              <th className={cell}>Full Name</th>
              <th className={cell}>Given Name</th>
              <th className={cell}>Surname</th>
              <th className={cell}>Passport No.</th>
              <th className={cell}>Date of Expiry</th>
              <th className={cell}>Date of Birth</th>
              <th className={cell}>Status</th>
            </tr>
          </thead>
          <tbody>
            {applicants.map((applicant, index) => {
              const expiredAtTravel = passportExpiredBy(applicant, travelDate);
              const shortValidity = !expiredAtTravel && passportExpiredBy(applicant, validityDate);
              const fullName = applicantDisplayName(applicant);

              return (
                <tr key={applicant.id} className={cn(applicant.status && "bg-rose-50/60 dark:bg-rose-950/20")}>
                  <td className={cell}>{index + 1}</td>
                  <td className={cn(cell, "font-medium")}>{fullName || "-"}</td>
                  <td className={cell}>{applicant.givenName || "-"}</td>
                  <td className={cell}>{applicant.surname || "-"}</td>
                  <td className={cn(cell, "font-mono")}>{applicant.passportNumber || "-"}</td>
                  <td className={cn(cell, "whitespace-nowrap")}>
                    {formatFullDate(applicant.passportExpiry)}
                    {expiredAtTravel ? (
                      <div className="text-destructive">Expired by travel date</div>
                    ) : shortValidity ? (
                      <div className="text-amber-600 dark:text-amber-400">Under 6 months at travel</div>
                    ) : null}
                  </td>
                  <td className={cn(cell, "whitespace-nowrap")}>{formatFullDate(applicant.dateOfBirth)}</td>
                  <td className={cn(cell, applicant.status && "font-medium text-rose-700 dark:text-rose-300")}>
                    {applicantStatusLabel(applicant.status)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
