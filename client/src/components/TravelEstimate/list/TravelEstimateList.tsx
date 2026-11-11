import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Download, Eye, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
import { estimateTitle, TRAVEL_ESTIMATE_ROUTES } from "../constants";
import { deleteTravelEstimate, subscribeTravelEstimates } from "../estimateService";
import {
  estimateClientText,
  estimateRouteText,
  estimateTravelDatesText,
  estimateTripTypesText,
  flightNumberKey,
  formatMoney,
  formatTimestamp,
  lowestTicketAmount,
  optionAirlinesText,
} from "../format";
import { downloadTravelEstimatePdf } from "../travelEstimatePdf";
import type { TravelEstimate } from "../types";
import { IconAction } from "./IconAction";
import { ListPagination, PAGE_SIZE_OPTIONS } from "./ListPagination";
import { TravelEstimatePreview } from "./TravelEstimatePreview";

/** Everything the search box matches against for one estimate. */
function searchText(estimate: TravelEstimate): string {
  const segments = estimate.options.flatMap((option) => option.flights);
  return [
    estimate.estimateNo,
    estimate.category && estimateTitle(estimate.category),
    estimateClientText(estimate),
    estimateTripTypesText(estimate),
    estimateRouteText(estimate),
    estimateTravelDatesText(estimate),
    ...estimate.options.flatMap((option) => [option.airline?.name, option.airline?.code, option.label]),
    ...estimate.options.flatMap((option) => option.fares.flatMap((fare) => fare.fareTypes)),
    ...segments.flatMap((segment) => [segment.from?.code, segment.from?.name, segment.to?.code, segment.to?.name]),
    // "QR 605" is found by typing QR605 too.
    ...segments.flatMap((segment) => [segment.flightNumber, flightNumberKey(segment.flightNumber)]),
    estimate.createdBy?.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function TravelEstimateList() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [estimates, setEstimates] = useState<TravelEstimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  // Kept as an id so an open preview shows live changes to the record.
  const [previewId, setPreviewId] = useState<string | null>(null);
  const previewing = estimates.find((estimate) => estimate.id === previewId) ?? null;
  const [deleting, setDeleting] = useState<TravelEstimate | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  useEffect(
    () =>
      subscribeTravelEstimates(
        (next) => {
          setEstimates(next);
          setLoading(false);
          setLoadError(null);
        },
        (error) => {
          console.error("Error loading travel estimates:", error);
          setLoading(false);
          setLoadError("Couldn't load travel estimates. Check your connection and reload the page.");
        },
      ),
    [],
  );

  const searchIndex = useMemo(
    () => new Map(estimates.map((estimate) => [estimate.id, searchText(estimate)])),
    [estimates],
  );

  const filtered = useMemo(() => {
    const terms = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return estimates;
    return estimates.filter((estimate) => {
      const haystack = searchIndex.get(estimate.id) ?? "";
      return terms.every((term) => haystack.includes(term));
    });
  }, [estimates, search, searchIndex]);

  // A new search starts from the first page.
  useEffect(() => setPage(1), [search, pageSize]);

  // Stay on a page that exists, e.g. after deleting the last estimate on it.
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const edit = (estimate: TravelEstimate) => setLocation(TRAVEL_ESTIMATE_ROUTES.edit(estimate.id));

  const downloadPdf = (estimate: TravelEstimate) => {
    try {
      downloadTravelEstimatePdf(estimate);
    } catch (error) {
      console.error("Error creating travel estimate PDF:", error);
      toast({ title: "Couldn't create the PDF", description: "Please try again.", variant: "destructive" });
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteTravelEstimate(deleting.id);
      if (previewId === deleting.id) setPreviewId(null);
      toast({ title: `${deleting.estimateNo} deleted` });
      setDeleting(null);
    } catch (error) {
      console.error("Error deleting travel estimate:", error);
      toast({ title: "Couldn't delete the estimate", description: "Please try again.", variant: "destructive" });
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
              placeholder="Search estimate no., client, airline, flight no., city…"
              className="pl-9"
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search travel estimates"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${filtered.length} of ${estimates.length} estimate${estimates.length === 1 ? "" : "s"}`}
          </span>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estimate No.</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Travel dates</TableHead>
                <TableHead>Airlines</TableHead>
                <TableHead className="text-right">Lowest ticket amount</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    Loading travel estimates…
                  </TableCell>
                </TableRow>
              ) : loadError ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-destructive">
                    {loadError}
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    {estimates.length === 0 ? (
                      <div className="space-y-3">
                        <p className="text-muted-foreground">No travel estimates yet.</p>
                        <Button size="sm" onClick={() => setLocation(TRAVEL_ESTIMATE_ROUTES.create)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Travel Estimate
                        </Button>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No estimates match "{search.trim()}".</p>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((estimate) => (
                  <TableRow key={estimate.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="font-medium">{estimate.estimateNo}</div>
                      {estimate.category && (
                        <div className="text-xs text-muted-foreground">{estimateTitle(estimate.category)}</div>
                      )}
                      {estimateClientText(estimate) && (
                        <div className="max-w-[14rem] truncate text-xs text-muted-foreground">
                          {estimateClientText(estimate)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      <div className="font-mono">{estimateRouteText(estimate)}</div>
                      <div className="text-xs text-muted-foreground">{estimateTripTypesText(estimate)}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{estimateTravelDatesText(estimate)}</TableCell>
                    <TableCell className="text-sm">{optionAirlinesText(estimate)}</TableCell>
                    <TableCell className="whitespace-nowrap text-right font-medium">
                      {formatMoney(lowestTicketAmount(estimate), estimate.currency)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      <div>{formatTimestamp(estimate.createdAt)}</div>
                      {estimate.createdBy && (
                        <div className="text-xs text-muted-foreground">{estimate.createdBy.name}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <IconAction label="Edit" onClick={() => edit(estimate)}>
                          <Pencil className="h-4 w-4" />
                        </IconAction>
                        <IconAction label="Preview" onClick={() => setPreviewId(estimate.id)}>
                          <Eye className="h-4 w-4" />
                        </IconAction>
                        <IconAction label="Save as PDF" onClick={() => downloadPdf(estimate)}>
                          <Download className="h-4 w-4" />
                        </IconAction>
                        <IconAction
                          label="Delete"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleting(estimate)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconAction>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
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

      <TravelEstimatePreview
        estimate={previewing}
        onOpenChange={(open) => !open && setPreviewId(null)}
        onEdit={edit}
        onDownloadPdf={downloadPdf}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && !deleteBusy && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.estimateNo}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the travel estimate{deleting && ` (${estimateRouteText(deleting)})`} and its applicant
              details for everyone. It can't be undone.
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
