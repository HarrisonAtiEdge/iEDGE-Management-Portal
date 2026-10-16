import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  saveAttendanceEntry,
  toTimeInputValue,
  type AttendanceRecord,
  type AttendanceSettings,
} from "@/lib/attendance";
import { formatDateValue, type RequestActor } from "@/lib/employeeRequests";
import { fieldInputClass, fieldLabelClass } from "./shared";

// Lets the main admin, finance or a financial admin add or correct one
// employee's check-in and check-out for a day, or excuse the day.
export default function AttendanceEditDialog({
  target,
  settings,
  actor,
  onClose,
}: {
  // The employee and day being edited, with their record if there is one.
  target: {
    employee: RequestActor;
    date: string;
    record: AttendanceRecord | null;
  } | null;
  settings: AttendanceSettings;
  actor: RequestActor;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [excused, setExcused] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!target) return;
    setCheckInTime(toTimeInputValue(target.record?.checkIn ?? null));
    setCheckOutTime(toTimeInputValue(target.record?.checkOut ?? null));
    setExcused(target.record?.excused ?? false);
    setNote(target.record?.note ?? "");
  }, [target]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!target) return;

    if (checkInTime && checkOutTime && checkOutTime <= checkInTime) {
      toast({
        title: "Check the times",
        description: "Check-out must be after check-in.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      await saveAttendanceEntry(
        target.employee,
        target.date,
        { checkInTime, checkOutTime, excused, note },
        settings,
        actor,
        target.record,
      );
      toast({ title: "Attendance saved" });
      onClose();
    } catch (error: any) {
      console.error("Failed to save attendance:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to save attendance",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-lg rounded-[1.75rem] border-0 p-0 shadow-2xl">
        {target && (
          <>
            <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-950">
                  {target.record ? "Edit attendance" : "Add attendance"}
                </DialogTitle>
              </DialogHeader>
              <p className="mt-1 text-sm text-slate-500">
                {target.employee.name} ·{" "}
                {formatDateValue(target.date, "EEEE, dd MMM yyyy")}
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-5 px-6 py-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={fieldLabelClass}>Check in</Label>
                  <Input
                    type="time"
                    value={checkInTime}
                    onChange={(event) => setCheckInTime(event.target.value)}
                    className={fieldInputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={fieldLabelClass}>Check out</Label>
                  <Input
                    type="time"
                    value={checkOutTime}
                    onChange={(event) => setCheckOutTime(event.target.value)}
                    className={fieldInputClass}
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <Checkbox
                  checked={excused}
                  onCheckedChange={(checked) => setExcused(checked === true)}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-semibold text-slate-900">Excuse this day.</span>{" "}
                  It won't count as late or leaving early, e.g. for a client
                  visit or traffic you approved.
                </span>
              </label>

              <div className="space-y-2">
                <Label className={fieldLabelClass}>Note</Label>
                <Textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="e.g. Forgot to check in, arrived 9:10"
                  className="min-h-[80px] rounded-2xl border-slate-200 bg-slate-50/80 shadow-none"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="h-11 rounded-2xl border-slate-200 bg-white px-5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="h-11 rounded-2xl bg-slate-950 px-6 text-white shadow-sm hover:bg-slate-800"
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
