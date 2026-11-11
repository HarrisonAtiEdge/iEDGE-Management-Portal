import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, FileSpreadsheet, FolderOpen, Loader2, Plus, Save, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { applicantsForLoading, applicantsJson } from "../applicantLists";
import {
  applicantDisplayName,
  cleanPassportNumber,
  createApplicant,
  passportExpiredBy,
  readApplicantsFile,
  sixMonthsAfter,
  type ApplicantImport,
} from "../applicants";
import { APPLICANT_ACTIVE_LABEL, APPLICANT_STATUS_OPTIONS, applicantStatusLabel, MAX_APPLICANTS } from "../constants";
import { errorKeys } from "../formModel";
import type { Applicant, ApplicantStatus, FormErrors, LinkedApplicantList, SavedApplicantList } from "../types";
import { ApplicantImportDialog } from "./ApplicantImportDialog";
import { DateField } from "./DateField";
import { LoadApplicantsDialog } from "./LoadApplicantsDialog";
import { SaveApplicantsDialog } from "./SaveApplicantsDialog";

// Select can't hold "", so an applicant with no status uses this value.
const ACTIVE = "active";
type StatusFilter = "all" | ApplicantStatus;

const cell = "px-2 py-1.5 align-top";

interface ApplicantsSectionProps {
  value: Applicant[];
  onChange: (value: Applicant[]) => void;
  errors: FormErrors;
  /** First departure date, for the passport validity check; "" if not set. */
  travelDate: string;
  /** Client or individual on the estimate, offered as the name when saving the applicants as a list. */
  suggestedListName: string;
}

/**
 * Application Details: the applicants travelling, imported from Excel, added
 * by hand, or loaded from a list saved earlier. They can be saved as a list on
 * their own at any time, without saving the estimate.
 */
export function ApplicantsSection({ value, onChange, errors, travelDate, suggestedListName }: ApplicantsSectionProps) {
  const { toast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(true);
  const [reading, setReading] = useState(false);
  // A sheet or saved list waiting to be checked; `list` is set for a saved list.
  const [pending, setPending] = useState<{
    fileName: string;
    result: ApplicantImport;
    list?: SavedApplicantList;
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [linked, setLinked] = useState<LinkedApplicantList | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);

  const currentJson = useMemo(() => (linked ? applicantsJson(value) : ""), [linked, value]);
  const unsavedListChanges = Boolean(linked) && currentJson !== linked?.savedJson;

  const hasErrors =
    Boolean(errors[errorKeys.applicants]) ||
    value.some((applicant) => Object.keys(errors).some((key) => key.startsWith(`applicant.${applicant.id}.`)));

  useEffect(() => {
    if (hasErrors) setOpen(true);
  }, [hasErrors]);

  const counts = useMemo(() => {
    const result = new Map<ApplicantStatus, number>();
    value.forEach((applicant) => result.set(applicant.status, (result.get(applicant.status) ?? 0) + 1));
    return result;
  }, [value]);
  const notTravelling = value.length - (counts.get("") ?? 0);

  // Each applicant keeps its number from the full list while filtering.
  const shown = value
    .map((applicant, index) => ({ applicant, number: index + 1 }))
    .filter(({ applicant }) => statusFilter === "all" || applicant.status === statusFilter);

  // Most countries want six months' validity from arrival.
  const validityDate = travelDate ? sixMonthsAfter(travelDate) : "";

  const update = (id: string, patch: Partial<Applicant>) =>
    onChange(value.map((applicant) => (applicant.id === id ? { ...applicant, ...patch } : applicant)));

  const remove = (id: string) => onChange(value.filter((applicant) => applicant.id !== id));

  const addApplicant = () => {
    if (value.length >= MAX_APPLICANTS) return;
    setStatusFilter("all");
    onChange([...value, createApplicant()]);
  };

  const clearAll = () => {
    if (window.confirm(`Remove all ${value.length} applicants from this estimate?`)) {
      onChange([]);
      setStatusFilter("all");
    }
  };

  const readFile = async (file: File) => {
    setReading(true);
    try {
      const result = await readApplicantsFile(file);
      if (result.error) {
        toast({ title: "Couldn't import this file", description: result.error, variant: "destructive" });
      } else {
        setPending({ fileName: file.name, result });
      }
    } catch (error) {
      console.error("Error reading applicants file:", error);
      toast({
        title: "Couldn't read this file",
        description: "Upload an Excel file (.xlsx or .xls) or a CSV file.",
        variant: "destructive",
      });
    } finally {
      setReading(false);
    }
  };

  const importApplicants = (mode: "replace" | "add") => {
    if (!pending) return;
    const incoming = pending.result.applicants;

    if (mode === "replace") {
      onChange(incoming);
      // Replaced by a saved list: saving again updates that list.
      if (pending.list) setLinked({ id: pending.list.id, name: pending.list.name, savedJson: applicantsJson(incoming) });
      toast({
        title: `${pending.list ? "Loaded" : "Imported"} ${incoming.length} applicant${incoming.length === 1 ? "" : "s"}`,
      });
    } else {
      // Applicants already on the list (same passport) aren't added twice.
      const existing = new Set(value.map((applicant) => cleanPassportNumber(applicant.passportNumber)).filter(Boolean));
      const added = incoming.filter((applicant) => !applicant.passportNumber || !existing.has(applicant.passportNumber));
      const skipped = incoming.length - added.length;
      if (value.length + added.length > MAX_APPLICANTS) {
        toast({
          title: "Too many applicants",
          description: `An estimate holds up to ${MAX_APPLICANTS}. Replace the list instead, or split the file.`,
          variant: "destructive",
        });
        return;
      }
      onChange([...value, ...added]);
      toast({
        title: `Added ${added.length} applicant${added.length === 1 ? "" : "s"}`,
        description: skipped ? `${skipped} already on the list (same passport number) were skipped.` : undefined,
      });
    }

    setPending(null);
    setStatusFilter("all");
    setOpen(true);
  };

  const pickSavedList = (list: SavedApplicantList) => {
    setLoadOpen(false);
    setPending({
      fileName: list.name,
      result: { applicants: applicantsForLoading(list), columns: [], warnings: [], error: null },
      list,
    });
  };

  const filterChip = (filter: StatusFilter, label: string, count: number) => (
    <button
      key={filter || ACTIVE}
      type="button"
      onClick={() => setStatusFilter(filter)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition",
        statusFilter === filter ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted",
      )}
    >
      {label}
      <span className={cn("rounded-full px-1.5 text-[11px]", statusFilter === filter ? "bg-white/20" : "bg-muted")}>
        {count}
      </span>
    </button>
  );

  return (
    <Card className={cn(open && "ring-1 ring-foreground/80")}>
      <CardHeader className="p-0">
        <button
          type="button"
          className="flex w-full items-center justify-between px-6 py-4 text-left"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <CardTitle className="text-lg">Application Details</CardTitle>
          <span className="flex items-center gap-3 text-sm text-muted-foreground">
            {!open &&
              (value.length
                ? `${value.length} applicant${value.length === 1 ? "" : "s"}${notTravelling ? ` · ${notTravelling} not travelling` : ""}`
                : "No applicants")}
            {open ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />}
          </span>
        </button>
      </CardHeader>

      {open && (
        <CardContent className="space-y-4 border-t pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Upload the applicants' passport details from Excel, or add them one by one. Set a status for anyone
              cancelled or not travelling.
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInput}
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = ""; // so the same file can be chosen again
                  if (file) readFile(file);
                }}
              />
              <Button type="button" size="sm" disabled={reading} onClick={() => fileInput.current?.click()}>
                {reading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Upload Excel
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={value.length >= MAX_APPLICANTS}
                onClick={addApplicant}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add applicant
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setLoadOpen(true)}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Load saved list
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={value.length === 0}
                title={value.length === 0 ? "Add applicants first" : "Save these applicants without saving the estimate"}
                onClick={() => setSaveOpen(true)}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Application Details
              </Button>
              {value.length > 0 && (
                <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={clearAll}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear all
                </Button>
              )}
            </div>
          </div>

          {linked && (
            <p className="text-xs text-muted-foreground">
              Saved list: <span className="font-medium text-foreground">{linked.name}</span>
              {" · "}
              {unsavedListChanges ? (
                <span className="text-amber-600 dark:text-amber-400">Changes not saved to the list</span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400">Up to date</span>
              )}
            </p>
          )}

          {errors[errorKeys.applicants] && <p className="text-sm text-destructive">{errors[errorKeys.applicants]}</p>}

          {value.length === 0 ? (
            <button
              type="button"
              disabled={reading}
              onClick={() => fileInput.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground transition hover:bg-muted/50"
            >
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              <span className="font-medium text-foreground">Upload the passport details Excel file</span>
              <span>
                Columns are read by their headings: Full Name, Given Name, Surname, Passport Number, Date of Expiry, Date
                of Birth and Cancel/Refund.
              </span>
            </button>
          ) : (
            <>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Show applicants by status">
                {filterChip("all", "All", value.length)}
                {filterChip("", APPLICANT_ACTIVE_LABEL, counts.get("") ?? 0)}
                {APPLICANT_STATUS_OPTIONS.map((option) =>
                  filterChip(option.value, option.label, counts.get(option.value) ?? 0),
                )}
              </div>

              <div className="overflow-x-auto rounded-md border">
                <table className="w-full min-w-[68rem] border-collapse text-sm">
                  <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className={cn(cell, "w-10 font-medium")}>S.No</th>
                      <th className={cn(cell, "font-medium")}>
                        Full Name<span className="ml-0.5 text-destructive">*</span>
                      </th>
                      <th className={cn(cell, "font-medium")}>Given Name</th>
                      <th className={cn(cell, "font-medium")}>Surname</th>
                      <th className={cn(cell, "w-36 font-medium")}>Passport No.</th>
                      <th className={cn(cell, "w-36 font-medium")}>Date of Expiry</th>
                      <th className={cn(cell, "w-36 font-medium")}>Date of Birth</th>
                      <th className={cn(cell, "w-52 font-medium")}>Status</th>
                      <th className={cn(cell, "w-10")} />
                    </tr>
                  </thead>
                  <tbody>
                    {shown.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-3 py-6 text-center text-sm text-muted-foreground">
                          No applicants with this status.
                        </td>
                      </tr>
                    )}
                    {shown.map(({ applicant, number }) => {
                      const error = (field: keyof Applicant) => errors[errorKeys.applicant(applicant.id, field)];
                      const label = applicantDisplayName(applicant) || `applicant ${number}`;
                      const fieldId = (name: string) => `applicant-${applicant.id}-${name}`;
                      const expiredAtTravel = passportExpiredBy(applicant, travelDate);
                      const shortValidity = !expiredAtTravel && passportExpiredBy(applicant, validityDate);

                      return (
                        <tr key={applicant.id} className={cn("border-t", applicant.status && "bg-rose-50/60 dark:bg-rose-950/20")}>
                          <td className={cn(cell, "pt-3 text-xs text-muted-foreground")}>{number}</td>
                          <td className={cell}>
                            <Input
                              id={fieldId("full-name")}
                              aria-label={`Full name of applicant ${number}`}
                              value={applicant.fullName}
                              placeholder={[applicant.givenName, applicant.surname].filter(Boolean).join(" ") || "Full name"}
                              className={cn("h-8 text-xs uppercase", error("fullName") && "border-destructive")}
                              onChange={(event) => update(applicant.id, { fullName: event.target.value.toUpperCase() })}
                            />
                            {error("fullName") && <p className="mt-1 text-xs text-destructive">{error("fullName")}</p>}
                          </td>
                          <td className={cell}>
                            <Input
                              aria-label={`Given name of ${label}`}
                              value={applicant.givenName}
                              className="h-8 text-xs uppercase"
                              onChange={(event) => update(applicant.id, { givenName: event.target.value.toUpperCase() })}
                            />
                          </td>
                          <td className={cell}>
                            <Input
                              aria-label={`Surname of ${label}`}
                              value={applicant.surname}
                              className="h-8 text-xs uppercase"
                              onChange={(event) => update(applicant.id, { surname: event.target.value.toUpperCase() })}
                            />
                          </td>
                          <td className={cell}>
                            <Input
                              aria-label={`Passport number of ${label}`}
                              value={applicant.passportNumber}
                              className={cn("h-8 font-mono text-xs uppercase", error("passportNumber") && "border-destructive")}
                              onChange={(event) =>
                                update(applicant.id, { passportNumber: cleanPassportNumber(event.target.value) })
                              }
                            />
                            {error("passportNumber") && (
                              <p className="mt-1 text-xs text-destructive">{error("passportNumber")}</p>
                            )}
                          </td>
                          <td className={cell}>
                            <DateField
                              id={fieldId("expiry")}
                              aria-label={`Passport expiry of ${label}`}
                              compact
                              value={applicant.passportExpiry}
                              invalid={Boolean(error("passportExpiry"))}
                              onChange={(passportExpiry) => update(applicant.id, { passportExpiry })}
                            />
                            {error("passportExpiry") ? (
                              <p className="mt-1 text-xs text-destructive">{error("passportExpiry")}</p>
                            ) : expiredAtTravel ? (
                              <p className="mt-1 text-xs text-destructive">Expired by the travel date.</p>
                            ) : shortValidity ? (
                              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                                Under 6 months' validity at travel.
                              </p>
                            ) : null}
                          </td>
                          <td className={cell}>
                            <DateField
                              id={fieldId("birth")}
                              aria-label={`Date of birth of ${label}`}
                              compact
                              birthDate
                              value={applicant.dateOfBirth}
                              invalid={Boolean(error("dateOfBirth"))}
                              onChange={(dateOfBirth) => update(applicant.id, { dateOfBirth })}
                            />
                            {error("dateOfBirth") && (
                              <p className="mt-1 text-xs text-destructive">{error("dateOfBirth")}</p>
                            )}
                          </td>
                          <td className={cell}>
                            <Select
                              value={applicant.status || ACTIVE}
                              onValueChange={(next) =>
                                update(applicant.id, { status: next === ACTIVE ? "" : (next as ApplicantStatus) })
                              }
                            >
                              <SelectTrigger
                                aria-label={`Status of ${label}`}
                                className={cn("h-8 text-xs", applicant.status && "border-rose-300 text-rose-700 dark:text-rose-300")}
                              >
                                <SelectValue>{applicantStatusLabel(applicant.status)}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={ACTIVE}>{APPLICANT_ACTIVE_LABEL}</SelectItem>
                                {APPLICANT_STATUS_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className={cell}>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary"
                              aria-label={`Remove ${label}`}
                              title={`Remove ${label}`}
                              onClick={() => remove(applicant.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-muted-foreground">
                {value.length} applicant{value.length === 1 ? "" : "s"}
                {notTravelling > 0 && ` · ${value.length - notTravelling} active, ${notTravelling} cancelled or no-show`}
                {travelDate && " · Passport validity is checked against the first departure date."}
              </p>
            </>
          )}
        </CardContent>
      )}

      <ApplicantImportDialog
        pending={pending}
        source={pending?.list ? "list" : "file"}
        existingCount={value.length}
        onCancel={() => setPending(null)}
        onImport={importApplicants}
      />
      <SaveApplicantsDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        applicants={value}
        linked={linked}
        suggestedName={suggestedListName}
        onSaved={(link) => {
          setLinked(link);
          setSaveOpen(false);
        }}
      />
      <LoadApplicantsDialog
        open={loadOpen}
        onOpenChange={setLoadOpen}
        linkedId={linked?.id ?? null}
        onPick={pickSavedList}
        onDeleted={(id) => setLinked((current) => (current?.id === id ? null : current))}
      />
    </Card>
  );
}
