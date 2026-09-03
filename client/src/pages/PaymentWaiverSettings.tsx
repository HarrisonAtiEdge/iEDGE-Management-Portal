import { useEffect, useState } from "react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

const PAYMENT_SETTINGS_PATH = [
  "Panels",
  "IEDGE-SYSTEM",
  "settings",
  "paymentSettings",
] as const;

export default function PaymentWaiverSettings() {
  const { toast } = useToast();
  const [waiverLimit, setWaiverLimit] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      try {
        setLoading(true);

        const settingsRef = doc(db, ...PAYMENT_SETTINGS_PATH);
        const settingsSnap = await getDoc(settingsRef);

        if (!mounted) return;

        if (!settingsSnap.exists()) {
          setWaiverLimit("0");
          return;
        }

        const savedLimit = Number(
          settingsSnap.data()?.paymentWaiverLimit || 0,
        );

        setWaiverLimit(
          Number.isFinite(savedLimit) && savedLimit >= 0
            ? String(savedLimit)
            : "0",
        );
      } catch (error) {
        console.error("Failed to load payment waiver settings:", error);

        if (mounted) {
          toast({
            title: "Error",
            description: "Failed to load the payment waiver limit.",
            variant: "destructive",
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      mounted = false;
    };
  }, [toast]);

  const handleSave = async () => {
    const parsedLimit = Number(waiverLimit);

    if (!Number.isFinite(parsedLimit) || parsedLimit < 0) {
      toast({
        title: "Invalid amount",
        description: "Waiver limit must be zero or a positive number.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const settingsRef = doc(db, ...PAYMENT_SETTINGS_PATH);

      await setDoc(
        settingsRef,
        {
          paymentWaiverLimit: Number(parsedLimit.toFixed(2)),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      toast({
        title: "Saved",
        description:
          parsedLimit > 0
            ? `Payments can now waive a remaining balance up to Rs ${parsedLimit.toLocaleString()}.`
            : "Payment waivers have been disabled.",
      });
    } catch (error) {
      console.error("Failed to save payment waiver settings:", error);

      toast({
        title: "Error",
        description: "Failed to save the payment waiver limit.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="max-w-2xl">
        <h2 className="text-lg font-semibold text-slate-900">
          Payment Waiver Settings
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Set the maximum remaining invoice balance that may be waived during
          Receive Payment. The user must still explicitly select the waiver
          checkbox before the invoice is marked as paid.
        </p>

        <div className="mt-6 space-y-2">
          <Label htmlFor="paymentWaiverLimit">Maximum Waiver Amount</Label>

          <Input
            id="paymentWaiverLimit"
            type="number"
            min="0"
            step="0.01"
            value={waiverLimit}
            disabled={loading || saving}
            onChange={(event) => setWaiverLimit(event.target.value)}
            placeholder="For example: 1500"
            className="max-w-md"
          />

          <p className="text-xs text-slate-500">
            Enter 0 to disable waivers. For example, a limit of Rs 1,500 allows
            a remaining balance of Rs 1,500 or less to be waived.
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          The waiver is recorded separately from the actual bank payment. It
          does not increase the amount received in the selected account.
        </div>

        <div className="mt-6">
          <Button onClick={handleSave} disabled={loading || saving}>
            {loading ? "Loading..." : saving ? "Saving..." : "Save Waiver Limit"}
          </Button>
        </div>
      </div>
    </div>
  );
}
