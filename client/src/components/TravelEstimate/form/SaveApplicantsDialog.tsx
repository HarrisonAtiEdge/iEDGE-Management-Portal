import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ApplicantListMissingError, MAX_LIST_NAME_LENGTH, saveApplicantList } from "../applicantLists";
import { formatFullDate, todayIso } from "../format";
import type { Applicant, LinkedApplicantList } from "../types";
import { useCurrentUserStamp } from "../useCurrentUserStamp";

interface SaveApplicantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicants: Applicant[];
  /** The saved list these applicants came from or were last saved to. */
  linked: LinkedApplicantList | null;
  /** Client or individual on the estimate, offered as the list name. */
  suggestedName: string;
  onSaved: (link: LinkedApplicantList) => void;
}

/** Saves Application Details as a list of their own, without saving the estimate. */
export function SaveApplicantsDialog({
  open,
  onOpenChange,
  applicants,
  linked,
  suggestedName,
  onSaved,
}: SaveApplicantsDialogProps) {
  const { toast } = useToast();
  const user = useCurrentUserStamp();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<"update" | "new" | null>(null);
  const count = applicants.length;
  const applicantsWord = `applicant${count === 1 ? "" : "s"}`;

  useEffect(() => {
    if (!open) return;
    const who = suggestedName.trim();
    setName(linked?.name ?? (who ? `${who} - ${formatFullDate(todayIso())}` : ""));
    setError("");
  }, [open, linked, suggestedName]);

  const save = async (asNew: boolean) => {
    if (saving) return;
    if (!name.trim()) {
      setError("Give the list a name, e.g. the group or client.");
      return;
    }
    if (!user) {
      setError("You're signed out. Sign in again to save.");
      return;
    }

    setSaving(asNew ? "new" : "update");
    setError("");
    try {
      const link = await saveApplicantList({ id: asNew ? undefined : linked?.id, name, applicants }, user);
      toast({
        title: asNew || !linked ? `Saved ${count} ${applicantsWord} as "${link.name}"` : `"${link.name}" updated`,
        description: "Load them into any estimate with Load saved list.",
      });
      onSaved(link);
    } catch (saveError) {
      if (saveError instanceof ApplicantListMissingError) {
        setError("This saved list has been deleted. Save the applicants as a new list instead.");
      } else {
        console.error("Error saving applicant list:", saveError);
        setError("Couldn't save the list. Check your connection and try again. Nothing was lost from the form.");
      }
    } finally {
      setSaving(null);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    // Keep the estimate form behind this dialog from submitting too.
    event.preventDefault();
    event.stopPropagation();
    save(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Save Application Details</DialogTitle>
            <DialogDescription>
              Saves these {count} {applicantsWord} on their own, so you can load them into any estimate later. The rest
              of the estimate isn't saved.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="applicant-list-name">List name *</Label>
            <Input
              id="applicant-list-name"
              value={name}
              maxLength={MAX_LIST_NAME_LENGTH}
              autoFocus
              placeholder="e.g. Acme Foods Umrah group"
              onChange={(event) => setName(event.target.value)}
            />
            {linked && (
              <p className="text-xs text-muted-foreground">
                Update replaces the applicants saved in "{linked.name}". Save as new list keeps it as it is.
              </p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" disabled={Boolean(saving)} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {linked && (
              <Button type="button" variant="outline" disabled={Boolean(saving) || !user} onClick={() => save(true)}>
                {saving === "new" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save as new list
              </Button>
            )}
            <Button type="submit" disabled={Boolean(saving) || !user}>
              {saving === "update" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {linked ? "Update list" : "Save list"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
