import React, { useEffect, useState } from "react";
import { getDocs, orderBy, query } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Estimate } from "../../types";
import {
  EstimateHistoryEntry,
  estimateHistoryCollection,
  formatHistoryDateTime,
} from "@/lib/estimateHistory";

type Props = {
  estimate: Estimate | null;
  creatorName: string;
  onClose: () => void;
};

const ENTRY_TITLES: Record<EstimateHistoryEntry["type"], string> = {
  edit: "edited the estimate",
  status: "changed the status",
  copy: "made a copy",
  invoice: "created an invoice",
};

// Shows an estimate's recorded edits, newest first: who made each one, when,
// and every field's value before and after.
export default function EstimateHistoryDialog({
  estimate,
  creatorName,
  onClose,
}: Props) {
  const [entries, setEntries] = useState<EstimateHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const estimateId = estimate?.id || "";

  useEffect(() => {
    if (!estimateId) return;

    let cancelled = false;
    setLoading(true);
    setError("");
    setEntries([]);

    getDocs(
      query(estimateHistoryCollection(estimateId), orderBy("editedAt", "desc")),
    )
      .then((snap) => {
        if (cancelled) return;
        setEntries(
          snap.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as EstimateHistoryEntry,
          ),
        );
      })
      .catch((err) => {
        console.error("Error loading estimate history:", err);
        if (!cancelled) setError("Couldn't load the history. Try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [estimateId]);

  if (!estimate) return null;

  // Edits saved before history was recorded only exist in editCount.
  const trackedEditNumbers = entries
    .filter((e) => e.type === "edit" && typeof e.editNumber === "number")
    .map((e) => e.editNumber as number);
  const untrackedEdits = trackedEditNumbers.length
    ? Math.min(...trackedEditNumbers) - 1
    : Number(estimate.editCount ?? 0);

  const createdAt = formatHistoryDateTime((estimate as any).createdAt);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col rounded-2xl">
        <DialogHeader>
          <DialogTitle>History · {estimate.estimateNo || "Estimate"}</DialogTitle>
          <DialogDescription>
            Created by {creatorName || "Unknown"}
            {createdAt ? ` on ${createdAt}` : ""}
            {estimate.copyOfEstimateNo
              ? ` as a copy of ${estimate.copyOfEstimateNo}`
              : ""}
            .
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-6 flex-1 space-y-3 overflow-y-auto px-6">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Loading history…
            </p>
          ) : error ? (
            <p className="py-8 text-center text-sm text-red-600">{error}</p>
          ) : entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No changes have been recorded for this estimate yet.
            </p>
          ) : (
            entries.map((entry) => {
              const name = entry.editedByName || "Unknown user";
              const changes = entry.changes || [];

              return (
                <div
                  key={entry.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-900">
                        <span className="font-semibold">{name}</span>{" "}
                        {ENTRY_TITLES[entry.type] || "made a change"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatHistoryDateTime(entry.editedAt) || "Just now"}
                      </p>
                    </div>
                    {entry.isCreator ? (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        Creator
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        Not the creator
                      </span>
                    )}
                  </div>

                  {entry.type === "copy" ? (
                    <p className="mt-3 text-sm text-slate-700">
                      Saved as{" "}
                      <span className="font-semibold">
                        {entry.copyEstimateNo || "a copy"}
                      </span>
                      {entry.copyPurpose === "invoice" ? " for an invoice" : ""}
                      . This estimate was left unchanged.
                    </p>
                  ) : changes.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">
                      No field changes were recorded.
                    </p>
                  ) : (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[480px] text-left text-xs">
                        <thead>
                          <tr className="text-slate-500">
                            <th className="w-1/4 pb-2 pr-3 font-semibold">
                              Field
                            </th>
                            <th className="pb-2 pr-3 font-semibold">Before</th>
                            <th className="pb-2 font-semibold">After</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 align-top">
                          {changes.map((change, i) => (
                            <tr key={`${change.field}-${i}`}>
                              <td className="py-2 pr-3 font-semibold text-slate-700">
                                {change.label}
                              </td>
                              <td className="py-2 pr-3">
                                <div className="max-h-32 overflow-y-auto whitespace-pre-wrap break-words rounded bg-red-50 px-2 py-1 text-red-800">
                                  {change.before || "—"}
                                </div>
                              </td>
                              <td className="py-2">
                                <div className="max-h-32 overflow-y-auto whitespace-pre-wrap break-words rounded bg-emerald-50 px-2 py-1 text-emerald-800">
                                  {change.after || "—"}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {!loading && !error && untrackedEdits > 0 ? (
            <p className="pb-2 text-xs text-slate-500">
              {untrackedEdits} earlier edit{untrackedEdits === 1 ? " was" : "s were"}{" "}
              made before changes were recorded, so their details aren't
              available.
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
