import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { APPLICANT_COLUMN_LABELS, type ApplicantImport } from "../applicants";
import { applicantStatusLabel } from "../constants";
import { formatFullDate } from "../format";

// Warnings listed before "and N more".
const MAX_WARNINGS_SHOWN = 8;

const cell = "border-b px-2 py-1.5 text-left";

interface ApplicantImportDialogProps {
  pending: { fileName: string; result: ApplicantImport } | null;
  /** Where the applicants come from: an uploaded sheet, or a saved list (named in fileName). */
  source?: "file" | "list";
  /** Applicants already on the estimate; when there are some, the import can add to them or replace them. */
  existingCount: number;
  onCancel: () => void;
  onImport: (mode: "replace" | "add") => void;
}

/** What an uploaded sheet or saved list holds, checked before anything changes on the estimate. */
export function ApplicantImportDialog({
  pending,
  source = "file",
  existingCount,
  onCancel,
  onImport,
}: ApplicantImportDialogProps) {
  const result = pending?.result;
  const count = result?.applicants.length ?? 0;
  const applicantsWord = `applicant${count === 1 ? "" : "s"}`;
  const fromList = source === "list";
  const missing = result
    ? (Object.keys(APPLICANT_COLUMN_LABELS) as (keyof typeof APPLICANT_COLUMN_LABELS)[]).filter(
        (column) => !result.columns.includes(column),
      )
    : [];

  return (
    <Dialog open={pending !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        {pending && result && (
          <>
            <DialogHeader>
              <DialogTitle>{fromList ? "Load saved list" : "Import applicants"}</DialogTitle>
              <DialogDescription>
                {count} {applicantsWord} {fromList ? "saved in" : "found in"}{" "}
                <span className="font-medium">{pending.fileName}</span>. Check them, then {fromList ? "load" : "import"}.
              </DialogDescription>
            </DialogHeader>

            {!fromList && (
              <div className="space-y-1 text-sm">
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Columns read: {result.columns.map((column) => APPLICANT_COLUMN_LABELS[column]).join(", ")}</span>
                </p>
                {missing.length > 0 && (
                  <p className="pl-6 text-xs text-muted-foreground">
                    Not in the file (left blank): {missing.map((column) => APPLICANT_COLUMN_LABELS[column]).join(", ")}
                  </p>
                )}
              </div>
            )}

            {result.warnings.length > 0 && (
              <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
                <p className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  {result.warnings.length} row{result.warnings.length === 1 ? "" : "s"} to check
                </p>
                <ul className="mt-1 list-disc space-y-0.5 pl-6 text-xs">
                  {result.warnings.slice(0, MAX_WARNINGS_SHOWN).map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                  {result.warnings.length > MAX_WARNINGS_SHOWN && (
                    <li>and {result.warnings.length - MAX_WARNINGS_SHOWN} more</li>
                  )}
                </ul>
              </div>
            )}

            <div className="max-h-80 overflow-auto rounded-md border">
              <table className="w-full min-w-[52rem] border-collapse text-xs">
                <thead className="sticky top-0 bg-muted text-muted-foreground">
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
                  {result.applicants.map((applicant, index) => (
                    <tr key={applicant.id}>
                      <td className={cell}>{index + 1}</td>
                      <td className={cell}>{applicant.fullName || "-"}</td>
                      <td className={cell}>{applicant.givenName || "-"}</td>
                      <td className={cell}>{applicant.surname || "-"}</td>
                      <td className={`${cell} font-mono`}>{applicant.passportNumber || "-"}</td>
                      <td className={`${cell} whitespace-nowrap`}>{formatFullDate(applicant.passportExpiry)}</td>
                      <td className={`${cell} whitespace-nowrap`}>{formatFullDate(applicant.dateOfBirth)}</td>
                      <td className={cell}>{applicantStatusLabel(applicant.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              {existingCount > 0 ? (
                <>
                  <Button type="button" variant="outline" onClick={() => onImport("add")}>
                    Add to the {existingCount} on the list
                  </Button>
                  <Button type="button" onClick={() => onImport("replace")}>
                    Replace the list with these {count}
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={() => onImport("replace")}>
                  {fromList ? "Load" : "Import"} {count} {applicantsWord}
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
