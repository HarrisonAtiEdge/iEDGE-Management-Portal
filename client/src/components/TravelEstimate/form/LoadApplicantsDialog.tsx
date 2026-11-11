import { useEffect, useState } from "react";
import { Loader2, Search, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { deleteApplicantList, subscribeApplicantLists } from "../applicantLists";
import { formatTimestamp } from "../format";
import type { SavedApplicantList } from "../types";

interface LoadApplicantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The saved list the form is linked to, marked in the list. */
  linkedId: string | null;
  onPick: (list: SavedApplicantList) => void;
  onDeleted: (id: string) => void;
}

/** Saved Application Details lists, to load one into the estimate. */
export function LoadApplicantsDialog({ open, onOpenChange, linkedId, onPick, onDeleted }: LoadApplicantsDialogProps) {
  const { toast } = useToast();
  const [lists, setLists] = useState<SavedApplicantList[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Listen only while open; each list holds its applicants, so this isn't kept for the session.
  useEffect(() => {
    if (!open) return;
    setSearch("");
    setLoading(true);
    setLoadError(false);
    return subscribeApplicantLists(
      (next) => {
        setLists(next);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading saved applicant lists:", error);
        setLoadError(true);
        setLoading(false);
      },
    );
  }, [open]);

  const term = search.trim().toLowerCase();
  const shown = term
    ? lists.filter((list) =>
        [list.name, list.updatedBy?.name ?? ""].some((value) => value.toLowerCase().includes(term)),
      )
    : lists;

  const remove = async (list: SavedApplicantList) => {
    if (!window.confirm(`Delete the saved list "${list.name}"? Estimates that already have these applicants keep them.`)) {
      return;
    }
    setDeletingId(list.id);
    try {
      await deleteApplicantList(list.id);
      toast({ title: `"${list.name}" deleted` });
      onDeleted(list.id);
    } catch (error) {
      console.error("Error deleting applicant list:", error);
      toast({ title: "Couldn't delete the list", description: "Check your connection and try again.", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Load saved list</DialogTitle>
          <DialogDescription>
            Application Details saved with Save Application Details. You'll see the applicants before anything changes.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search saved lists"
            value={search}
            placeholder="Search by list name or who saved it"
            className="pl-9"
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading saved lists…
          </div>
        ) : loadError ? (
          <p className="py-8 text-center text-sm text-destructive">
            Couldn't load the saved lists. Check your connection and try again.
          </p>
        ) : shown.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {lists.length === 0
              ? "No saved lists yet. Use Save Application Details to save one."
              : "No saved list matches your search."}
          </p>
        ) : (
          <ul className="divide-y rounded-md border">
            {shown.map((list) => {
              const count = list.applicants.length;
              return (
                <li
                  key={list.id}
                  className={cn("flex items-center gap-3 px-3 py-2.5", list.id === linkedId && "bg-primary/5")}
                >
                  <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" title={list.name}>
                      {list.name}
                      {list.id === linkedId && <span className="ml-2 text-xs font-normal text-primary">On this form</span>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {count} applicant{count === 1 ? "" : "s"} · Saved {formatTimestamp(list.updatedAt)}
                      {list.updatedBy?.name ? ` by ${list.updatedBy.name}` : ""}
                    </p>
                  </div>
                  <Button type="button" size="sm" disabled={count === 0} onClick={() => onPick(list)}>
                    Load
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    aria-label={`Delete ${list.name}`}
                    title={`Delete ${list.name}`}
                    disabled={deletingId === list.id}
                    onClick={() => remove(list)}
                  >
                    {deletingId === list.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
