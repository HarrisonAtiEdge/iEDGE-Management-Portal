import { useEffect, useState } from "react";
import { LogIn, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_ATTENDANCE_SETTINGS,
  checkIn,
  checkOut,
  formatClock,
  formatMinutes,
  getAttendanceStatus,
  subscribeToAttendanceDay,
  subscribeToAttendanceSettings,
  type AttendanceRecord,
  type AttendanceSettings,
} from "@/lib/attendance";
import { toDateValue } from "@/lib/employeeRequests";

// Check In / Check Out for the signed-in user, shown in the top bar on
// every page.
export function AttendanceCheckButton({
  userId,
  userName,
  role,
}: {
  userId: string;
  userName: string;
  role: string;
}) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AttendanceSettings>(
    DEFAULT_ATTENDANCE_SETTINGS,
  );
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [today, setToday] = useState(() => toDateValue(new Date()));

  // Roll over to the new day if the page stays open past midnight.
  useEffect(() => {
    const timer = window.setInterval(
      () => setToday(toDateValue(new Date())),
      60 * 1000,
    );
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => subscribeToAttendanceSettings(setSettings), []);

  useEffect(() => {
    setLoaded(false);
    return subscribeToAttendanceDay(userId, today, (next) => {
      setRecord(next);
      setLoaded(true);
    });
  }, [userId, today]);

  if (!loaded) return null;

  async function run(action: () => Promise<void>, done: string) {
    try {
      setSaving(true);
      await action();
      toast({ title: done });
    } catch (error: any) {
      console.error("Attendance update failed:", error);
      toast({
        title: "Error",
        description: error?.message || "Could not save your attendance",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (!record?.checkIn) {
    return (
      <Button
        type="button"
        disabled={saving}
        onClick={() =>
          run(
            () => checkIn({ id: userId, name: userName, role }, settings),
            "Checked in",
          )
        }
        className="h-10 gap-2 rounded-xl bg-emerald-600 px-4 text-white hover:bg-emerald-700"
      >
        <LogIn className="h-4 w-4" />
        Check in
      </Button>
    );
  }

  const status = getAttendanceStatus(record);

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-2 py-1">
      <div className="px-1 text-xs leading-4">
        <div className="font-semibold text-foreground">
          In {formatClock(record.checkIn)}
          {record.checkOut && ` · Out ${formatClock(record.checkOut)}`}
        </div>
        <div
          className={
            status.isLate ? "font-medium text-amber-600" : "text-muted-foreground"
          }
        >
          {status.isLate
            ? `Late ${formatMinutes(status.lateMinutes)}`
            : record.excused
              ? "Excused"
              : "On time"}
          {status.leftEarly && ` · Left ${formatMinutes(status.earlyMinutes)} early`}
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={saving}
        onClick={() =>
          run(
            () => checkOut(userId, record.date),
            record.checkOut ? "Check-out time updated" : "Checked out",
          )
        }
        className="h-8 gap-1.5 rounded-lg px-3"
      >
        <LogOut className="h-3.5 w-3.5" />
        {record.checkOut ? "Update" : "Check out"}
      </Button>
    </div>
  );
}
