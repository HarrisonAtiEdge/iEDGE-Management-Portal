import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Estimate } from "../../types";
import {
  EstimateEditChoice,
  getEstimateCreatorId,
  getEstimateRoot,
} from "@/lib/estimateHistory";

type Props = {
  estimate: Estimate | null;
  currentUserId: string;
  creatorName: string;
  onCancel: () => void;
  onConfirm: (choice: EstimateEditChoice) => void;
};

// One tickable option. Options in a group are exclusive: ticking one clears
// the others, and ticking the ticked one clears it.
function ChoiceOption({
  id,
  checked,
  onToggle,
  title,
  description,
}: {
  id: string;
  checked: boolean;
  onToggle: () => void;
  title: string;
  description: string;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
        checked
          ? "border-slate-900 bg-slate-50"
          : "border-slate-200 hover:bg-slate-50"
      }`}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onToggle}
        className="mt-0.5"
      />
      <span>
        <span className="block text-sm font-semibold text-slate-900">
          {title}
        </span>
        <span className="mt-0.5 block text-xs text-slate-500">
          {description}
        </span>
      </span>
    </label>
  );
}

// Asked before the edit form opens. Everyone gets two options: save the
// changes as a copy that starts from the same fields, or edit the estimate
// directly (recorded in its History). For the estimate's creator the copy
// keeps the current estimate as the first copy; for anyone else it is a copy
// for an invoice.
export default function EstimateEditChoiceDialog({
  estimate,
  currentUserId,
  creatorName,
  onCancel,
  onConfirm,
}: Props) {
  const [choice, setChoice] = useState<"copy" | "edit" | null>(null);

  useEffect(() => {
    setChoice(null);
  }, [estimate]);

  if (!estimate) return null;

  const isCreator =
    Boolean(currentUserId) && getEstimateCreatorId(estimate) === currentUserId;
  const estimateNo = estimate.estimateNo || "this estimate";
  const root = getEstimateRoot(estimate);
  const isCopy = Boolean(estimate.copyOfEstimateId);

  const handleContinue = () => {
    if (choice === "edit") {
      onConfirm({ kind: "edit" });
    } else if (choice === "copy") {
      onConfirm({ kind: "copy", purpose: isCreator ? "revision" : "invoice" });
    }
  };

  const toggle = (next: "copy" | "edit") =>
    setChoice(choice === next ? null : next);

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>Edit {estimateNo}</DialogTitle>
          <DialogDescription>
            {isCreator
              ? "You created this estimate. How do you want to save your changes?"
              : `This estimate was created by ${creatorName || "another user"}.`}
          </DialogDescription>
        </DialogHeader>

        {isCopy ? (
          <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-900">
            {estimateNo} is a copy of {root.estimateNo}. New copies are numbered
            from {root.estimateNo}.
          </p>
        ) : null}

        <div className="space-y-2">
          <ChoiceOption
            id="edit-choice-copy"
            checked={choice === "copy"}
            onToggle={() => toggle("copy")}
            title={
              isCreator
                ? "Keep the previous estimate as the first copy"
                : "This edit is for an invoice"
            }
            description={`${estimateNo} stays exactly as it is. Your changes are saved as a new copy that starts with all of its fields, numbered ${root.estimateNo}-1, ${root.estimateNo}-2 and so on.`}
          />

          <ChoiceOption
            id="edit-choice-same"
            checked={choice === "edit"}
            onToggle={() => toggle("edit")}
            title="Edit the same estimate"
            description={
              isCreator
                ? `Your changes overwrite ${estimateNo}. What changed is kept in its History.`
                : `Your changes update ${estimateNo} directly. Your name, the date and time, and everything you change are recorded in its History.`
            }
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleContinue} disabled={choice === null}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
