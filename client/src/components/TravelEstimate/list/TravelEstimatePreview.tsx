import { Download, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { firstTravelDate } from "../applicants";
import { estimateTitle } from "../constants";
import { buildOptionTable, LOCAL_TIMES_NOTE } from "../document/optionTable";
import { OptionTableView } from "../document/OptionTableView";
import {
  estimateTravelDatesText,
  estimateTripTypesText,
  formatTimestamp,
  passengersText,
} from "../format";
import type { TravelEstimate } from "../types";
import { ApplicantsPreview } from "./ApplicantsPreview";

interface TravelEstimatePreviewProps {
  estimate: TravelEstimate | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (estimate: TravelEstimate) => void;
  onDownloadPdf: (estimate: TravelEstimate) => void;
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

export function TravelEstimatePreview({ estimate, onOpenChange, onEdit, onDownloadPdf }: TravelEstimatePreviewProps) {
  return (
    <Dialog open={estimate !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-6xl">
        {estimate && (
          <>
            <DialogHeader>
              <DialogTitle>
                {estimateTitle(estimate.category)} {estimate.estimateNo}
              </DialogTitle>
              <DialogDescription>
                Created {formatTimestamp(estimate.createdAt)}
                {estimate.createdBy && ` by ${estimate.createdBy.name}`}
                {estimate.updatedBy &&
                  estimate.updatedAt?.getTime() !== estimate.createdAt?.getTime() &&
                  ` · Updated ${formatTimestamp(estimate.updatedAt)} by ${estimate.updatedBy.name}`}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 rounded-md border bg-muted/40 px-4 py-3 sm:grid-cols-3">
              <SummaryItem label="Ticket type" value={estimateTripTypesText(estimate)} />
              <SummaryItem label="Travel dates" value={estimateTravelDatesText(estimate)} />
              <SummaryItem label="Passengers" value={passengersText(estimate.passengers)} />
            </div>

            <div className="space-y-6 overflow-x-auto pb-1">
              {estimate.options.map((option) => (
                <OptionTableView key={option.id} table={buildOptionTable(option, estimate.currency)} />
              ))}
            </div>
            <p className="text-xs italic text-muted-foreground">{LOCAL_TIMES_NOTE}</p>

            {estimate.applicants.length > 0 && (
              <ApplicantsPreview applicants={estimate.applicants} travelDate={firstTravelDate(estimate.options)} />
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => onEdit(estimate)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button onClick={() => onDownloadPdf(estimate)}>
                <Download className="mr-2 h-4 w-4" />
                Save as PDF
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
