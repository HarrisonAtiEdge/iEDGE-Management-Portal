import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Download, Eye, Loader2, Plus, Search, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { applicantDisplayName } from "../applicants";
import { activeApplicants, downloadApplicantListPdf } from "../applicantListPdf";
import { deleteApplicantList, subscribeApplicantLists } from "../applicantLists";
import { APPLICANT_STATUS_OPTIONS, TRAVEL_ESTIMATE_ROUTES } from "../constants";
import { formatTimestamp } from "../format";
import type { SavedApplicantList } from "../types";
import { ApplicantsPreview } from "./ApplicantsPreview";
import { IconAction } from "./IconAction";
import { ListPagination, PAGE_SIZE_OPTIONS } from "./ListPagination";

/** List name, who saved it, and every applicant's name and passport, for the search box. */
function searchText(list: SavedApplicantList): string {
  return [
    list.name,
    list.updatedBy?.name,
    ...list.applicants.flatMap((applicant) => [applicantDisplayName(applicant), applicant.passportNumber]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/** "12 applicants", plus how many aren't travelling, e.g. "· 2 cancelled / no-show". */
function applicantsSummary(list: SavedApplicantList) {
  const notTravelling = list.applicants.filter((applicant) => applicant.status).length;
  const breakdown = APPLICANT_STATUS_OPTIONS.map((option) => ({
    label: option.label,
    count: list.applicants.filter((applicant) => applicant.status === option.value).length,
  })).filter(({ count }) => count > 0);
  return { notTravelling, breakdown };
}

/** Application Details saved on their own from the estimate form (Save Application Details). */
export function SavedApplicantLists() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [lists, setLists] = useState<SavedApplicantList[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  // Kept as an id so an open preview shows live changes to the list.
  const [viewId, setViewId] = useState<string | null>(null);
  const viewing = lists.find((list) => list.id === viewId) ?? null;
  const [deleting, setDeleting] = useState<SavedApplicantList | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  useEffect(
    () =>
      subscribeApplicantLists(
        (next) => {
          setLists(next);
          setLoading(false);
          setLoadError(null);
        },
        (error) => {
          console.error("Error loading saved applicant lists:", error);
          setLoading(false);
          setLoadError("Couldn't load the saved Application Details. Check your connection and reload the page.");
        },
      ),
    [],
  );

  const searchIndex = useMemo(() => new Map(lists.map((list) => [list.id, searchText(list)])), [lists]);

  const filtered = useMemo(() => {
    const terms = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return lists;
    return lists.filter((list) => {
      const haystack = searchIndex.get(list.id) ?? "";
      return terms.every((term) => haystack.includes(term));
    });
  }, [lists, search, searchIndex]);

  useEffect(() => setPage(1), [search, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const downloadPdf = (list: SavedApplicantList) => {
    if (activeApplicants(list).length === 0) {
      toast({
        title: "No active applicants",
        description: "The PDF lists Active applicants only, and everyone on this list is cancelled, refunded or a no-show.",
        variant: "destructive",
      });
      return;
    }
    try {
      downloadApplicantListPdf(list);
    } catch (error) {
      console.error("Error creating Application Details PDF:", error);
      toast({ title: "Couldn't create the PDF", description: "Please try again.", variant: "destructive" });
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteApplicantList(deleting.id);
      if (viewId === deleting.id) setViewId(null);
      toast({ title: `"${deleting.name}" deleted` });
      setDeleting(null);
    } catch (error) {
      console.error("Error deleting applicant list:", error);
      toast({ title: "Couldn't delete the list", description: "Please try again.", variant: "destructive" });
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              placeholder="Search list name, applicant, passport no.…"
              className="pl-9"
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search saved Application Details"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${filtered.length} of ${lists.length} saved list${lists.length === 1 ? "" : "s"}`}
          </span>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>List name</TableHead>
                <TableHead>Applicants</TableHead>
                <TableHead>Last saved</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    Loading saved Application Details…
                  </TableCell>
                </TableRow>
              ) : loadError ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-destructive">
                    {loadError}
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    {lists.length === 0 ? (
                      <div className="space-y-3">
                        <p className="text-muted-foreground">
                          No saved Application Details yet. Use Save Application Details on the estimate form to save
                          one.
                        </p>
                        <Button size="sm" onClick={() => setLocation(TRAVEL_ESTIMATE_ROUTES.create)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Travel Estimate
                        </Button>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No saved lists match "{search.trim()}".</p>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((list) => {
                  const { notTravelling, breakdown } = applicantsSummary(list);
                  return (
                    <TableRow key={list.id}>
                      <TableCell className="max-w-[22rem]">
                        <div className="truncate font-medium" title={list.name}>
                          {list.name}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        <div>
                          {list.applicants.length} applicant{list.applicants.length === 1 ? "" : "s"}
                        </div>
                        {notTravelling > 0 && (
                          <div
                            className="text-xs text-rose-700 dark:text-rose-300"
                            title={breakdown.map(({ label, count }) => `${count} ${label}`).join(", ")}
                          >
                            {notTravelling} not travelling
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        <div>{formatTimestamp(list.updatedAt)}</div>
                        {list.updatedBy && <div className="text-xs text-muted-foreground">{list.updatedBy.name}</div>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <IconAction label="View applicants" onClick={() => setViewId(list.id)}>
                            <Eye className="h-4 w-4" />
                          </IconAction>
                          <IconAction label="Download PDF (active applicants)" onClick={() => downloadPdf(list)}>
                            <Download className="h-4 w-4" />
                          </IconAction>
                          <IconAction
                            label="Delete"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleting(list)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </IconAction>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {!loading && !loadError && filtered.length > 0 && (
          <ListPagination
            page={currentPage}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </CardContent>

      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-6">{viewing.name}</DialogTitle>
                <DialogDescription>
                  Saved {formatTimestamp(viewing.updatedAt)}
                  {viewing.updatedBy ? ` by ${viewing.updatedBy.name}` : ""}. Load it into an estimate with Load saved
                  list in Application Details.
                </DialogDescription>
              </DialogHeader>
              {viewing.applicants.length > 0 ? (
                <ApplicantsPreview applicants={viewing.applicants} travelDate="" />
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">This list has no applicants.</p>
              )}
              <DialogFooter className="items-center gap-2 sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  The PDF lists the {activeApplicants(viewing).length} Active applicant
                  {activeApplicants(viewing).length === 1 ? "" : "s"} only.
                </p>
                <Button type="button" onClick={() => downloadPdf(viewing)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && !deleteBusy && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleting?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the saved list for everyone. Estimates that already have these applicants keep them. It
              can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteBusy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                // Keep the dialog open until the delete has finished.
                event.preventDefault();
                void confirmDelete();
              }}
            >
              {deleteBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
