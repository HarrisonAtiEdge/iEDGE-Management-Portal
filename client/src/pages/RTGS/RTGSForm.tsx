import { useCallback, useEffect, useMemo, useState } from "react";
import type React from "react";
import { toWords } from "number-to-words";
import {
  Building2,
  Check,
  ChevronsUpDown,
  Download,
  Landmark,
  Loader2,
  PenLine,
  Plus,
  Printer,
  RefreshCw,
  Save,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { fetchPaymentAccounts } from "@/lib/payments/paymentAccounts";
import type { PaymentAccount } from "@/lib/payments/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RtgsShell from "@/components/RTGS/RtgsShell";
import LetterFrame from "@/components/RTGS/LetterFrame";
import LinkedPaymentsCard, { type RtgsPaymentMode } from "@/components/RTGS/LinkedPaymentsCard";
import {
  accountPrefix,
  ensureRtgsAccountId,
  fetchFromAccounts,
  fetchSignatures,
  fetchVendors,
  letterDate,
  nextSerial,
  saveLetter,
  SerialTakenError,
  splitDisplayName,
  type RtgsFromAccount,
  type RtgsLetterTo,
  type RtgsSignatory,
  type RtgsSignature,
  type RtgsVendor,
} from "@/components/RTGS/rtgsData";
import {
  accountLabel,
  letterTransferFor,
  newTransferId,
  TransferError,
  type RtgsTransferPlan,
} from "@/components/RTGS/rtgsTransfer";
import { buildLetterHTML, downloadLetterPdf, printLetter } from "@/components/RTGS/rtgsLetter";
import {
  allocateRtgsAmount,
  canLinkRtgsPayments,
  fetchRtgsPayables,
  fetchRtgsProjects,
  formatRs,
  linkedPaymentsFor,
  matchPaymentAccount,
  PayablesChangedError,
  roundMoney,
  type RtgsPayable,
  type RtgsPaymentPlan,
  type RtgsProject,
} from "@/components/RTGS/rtgsPayables";

const LAST_CHEQUE_KEY = "lastChequeNumber";

const readLastCheque = () => {
  try {
    return localStorage.getItem(LAST_CHEQUE_KEY);
  } catch {
    return null;
  }
};

const shorten = (value: string, max: number) => {
  const clean = String(value || "").trim();
  if (!clean) return "-";
  return clean.length <= max ? clean : `${clean.slice(0, max - 3)}...`;
};

const toSignatory = (record: RtgsSignature): RtgsSignatory => ({
  id: record.id,
  name: record.name,
  designation: record.designation || "No Designation",
  company: record.company || "No Company",
  contact: `${record.phoneNumber || "No Phone"} | ${record.email || "No Email"}`,
});

export default function RTGSForm() {
  const { userProfile, currentUser } = useAuth();
  const { toast } = useToast();

  const [accounts, setAccounts] = useState<RtgsFromAccount[]>([]);
  const [vendors, setVendors] = useState<RtgsVendor[]>([]);
  const [signatureRecords, setSignatureRecords] = useState<RtgsSignature[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedAccount, setSelectedAccount] = useState<RtgsFromAccount | null>(null);
  const [serialNo, setSerialNo] = useState("");
  const [serialLoading, setSerialLoading] = useState(false);

  const [selectedVendor, setSelectedVendor] = useState<RtgsVendor | null>(null);
  const [vendorOpen, setVendorOpen] = useState(false);

  const [signatories, setSignatories] = useState<RtgsSignatory[]>([]);
  // Index being replaced, or signatories.length when adding a new one.
  const [signatoryIndex, setSignatoryIndex] = useState<number | null>(null);

  const [chequeNumber, setChequeNumber] = useState("");
  const [suggestedCheque, setSuggestedCheque] = useState<string | null>(readLastCheque);
  const [amount, setAmount] = useState("");
  const [inWords, setInWords] = useState("");

  const [saving, setSaving] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Budget requests / POs this letter pays.
  const canLink = canLinkRtgsPayments(userProfile?.role);
  const [payables, setPayables] = useState<RtgsPayable[]>([]);
  const [projects, setProjects] = useState<RtgsProject[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [payablesLoading, setPayablesLoading] = useState(false);
  const [payablesError, setPayablesError] = useState<string | null>(null);
  const [projectCode, setProjectCode] = useState("");
  const [selectedPayableKeys, setSelectedPayableKeys] = useState<string[]>([]);
  const [paymentAccountId, setPaymentAccountId] = useState("");
  // Or: an account to account transfer, whose To account is the letter's "To".
  const [paymentMode, setPaymentMode] = useState<RtgsPaymentMode>("payables");
  const [transferToAccountId, setTransferToAccountId] = useState("");

  const prefix = selectedAccount
    ? accountPrefix({ id: selectedAccount.rtgsId, accountTitle: selectedAccount.accountTitle })
    : "";

  const { firstName, lastName } = splitDisplayName(userProfile?.displayName);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setDataLoading(true);
      setFetchError(null);
      try {
        const [accountList, vendorList, signatureList] = await Promise.all([
          fetchFromAccounts(),
          fetchVendors(),
          fetchSignatures(),
        ]);
        if (cancelled) return;
        setAccounts(accountList);
        setVendors(vendorList);
        setSignatureRecords(signatureList);
      } catch (error) {
        console.error("RTGS form data load failed:", error);
        if (!cancelled) setFetchError("Failed to load accounts, vendors or signatories. Please refresh.");
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadPayables = useCallback(async () => {
    setPayablesLoading(true);
    setPayablesError(null);
    try {
      const [payableList, accountList, projectList] = await Promise.all([
        fetchRtgsPayables(),
        fetchPaymentAccounts(),
        fetchRtgsProjects(),
      ]);
      setPayables(payableList);
      setProjects(projectList);
      setPaymentAccounts(accountList.filter((account) => account.isActive !== false));
      // Drop anything that's been fully paid since it was picked.
      setSelectedPayableKeys((keys) => keys.filter((key) => payableList.some((payable) => payable.key === key)));
    } catch (error) {
      console.error("RTGS payables load failed:", error);
      setPayablesError("Failed to load budget requests and POs. Use the refresh button to try again.");
    } finally {
      setPayablesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canLink) void loadPayables();
  }, [canLink, loadPayables]);

  // Follow the From account; picking an account by hand sticks until it changes.
  const matchedPaymentAccountId = useMemo(
    () =>
      selectedAccount?.paymentAccountId ||
      matchPaymentAccount(paymentAccounts, selectedAccount?.accountNumber)?.id ||
      "",
    [paymentAccounts, selectedAccount?.paymentAccountId, selectedAccount?.accountNumber],
  );
  useEffect(() => {
    setPaymentAccountId(matchedPaymentAccountId);
  }, [matchedPaymentAccountId]);

  const selectedPayables = useMemo(
    () =>
      selectedPayableKeys
        .map((key) => payables.find((payable) => payable.key === key))
        .filter((payable): payable is RtgsPayable => Boolean(payable)),
    [selectedPayableKeys, payables],
  );
  const amountValue = Number(amount.replace(/,/g, "")) || 0;
  const { allocations, unallocated } = useMemo(
    () => allocateRtgsAmount(selectedPayables, amountValue),
    [selectedPayables, amountValue],
  );
  const paymentAccount = paymentAccounts.find((account) => account.id === paymentAccountId) || null;
  const unpaidAllocation = allocations.find((allocation) => allocation.amount <= 0.009);

  const isTransfer = canLink && paymentMode === "transfer";
  const transferFrom = paymentAccounts.find((account) => account.id === matchedPaymentAccountId) || null;
  const transferTo = paymentAccounts.find((account) => account.id === transferToAccountId) || null;

  // The letter's "To": the chosen vendor, or the To account of a transfer.
  const letterTo = useMemo<RtgsLetterTo | null>(() => {
    if (isTransfer) {
      return transferTo
        ? {
            accountTitle: accountLabel(transferTo),
            address: "",
            mobileNumber: "",
            accountNo: transferTo.accountNumber || transferTo.iban || "",
            bank: transferTo.bankName || "",
            branch: transferTo.branchName || "",
          }
        : null;
    }
    return selectedVendor
      ? {
          accountTitle: selectedVendor.accountTitle,
          address: selectedVendor.address,
          mobileNumber: selectedVendor.mobileNumber,
          accountNo: selectedVendor.accountNo,
          bank: selectedVendor.bank,
          branch: selectedVendor.branch,
        }
      : null;
  }, [isTransfer, transferTo, selectedVendor]);

  const linkProblem = (() => {
    if (isTransfer) {
      if (!transferFrom) return "Select Account From.";
      if (!transferTo) return "Select Account To.";
      if (transferTo.id === transferFrom.id) return "The From and To accounts can't be the same.";
      if (amountValue <= 0) return "Enter the amount to transfer.";
      return null;
    }
    if (allocations.length === 0) return null;
    if (amountValue <= 0) return "Enter the amount to apply it to the selected items.";
    if (unallocated > 0.009) {
      return `The amount is ${formatRs(unallocated)} more than the selected items' outstanding total. Add another item or lower the amount.`;
    }
    if (unpaidAllocation) {
      return `Nothing is left to pay ${unpaidAllocation.payable.number}. Remove it or raise the amount.`;
    }
    if (!paymentAccount) return "Select the payment account to record this payment against.";
    return null;
  })();

  const handleProjectCodeChange = (code: string) => {
    setProjectCode(code);
    setSelectedPayableKeys([]);
  };

  const handlePaymentModeChange = (mode: RtgsPaymentMode) => {
    setPaymentMode(mode);
    setSelectedPayableKeys([]);
    setTransferToAccountId("");
  };

  const loadSerial = async (account: RtgsFromAccount) => {
    setSerialLoading(true);
    setSerialNo("");
    try {
      const serialPrefix = accountPrefix({ id: account.rtgsId, accountTitle: account.accountTitle });
      setSerialNo(await nextSerial(serialPrefix, account.rtgsId));
    } catch (error) {
      console.error("Error loading serial:", error);
      toast({
        title: "Could not generate the document number",
        description: "Please select the account again.",
        variant: "destructive",
      });
    } finally {
      setSerialLoading(false);
    }
  };

  const handleAccountChange = (key: string) => {
    const account = accounts.find((item) => item.key === key) || null;
    setSelectedAccount(account);
    if (account) void loadSerial(account);
    else setSerialNo("");
  };

  // Account From of a transfer is the letter's From account.
  const handleTransferFromChange = (id: string) => {
    const account = accounts.find((item) => item.paymentAccountId === id);
    if (account) handleAccountChange(account.key);
    if (id === transferToAccountId) setTransferToAccountId("");
  };

  const handleChequeChange = (value: string) => {
    setChequeNumber(value);
    setSuggestedCheque(value);
    try {
      localStorage.setItem(LAST_CHEQUE_KEY, value);
    } catch {
      // Remembering the last cheque number is only a convenience.
    }
  };

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = Number.parseInt(event.target.value.replace(/,/g, ""), 10);
    if (Number.isNaN(numericValue)) {
      setAmount(event.target.value);
      setInWords("");
      return;
    }
    setAmount(numericValue.toLocaleString("en-PK"));
    setInWords(`${toWords(numericValue).replace(/\b\w/g, (c) => c.toUpperCase())} Rupees`);
  };

  const selectSignatory = (record: RtgsSignature) => {
    if (signatoryIndex === null) return;
    const next = [...signatories];
    next[signatoryIndex] = toSignatory(record);
    setSignatories(next);
    setSignatoryIndex(null);
  };

  const letterHTML = useMemo(
    () =>
      buildLetterHTML({
        date: letterDate(),
        serialNo,
        from: selectedAccount
          ? {
              accountTitle: selectedAccount.accountTitle,
              accountNumber: selectedAccount.accountNumber,
              bank: selectedAccount.bank,
              branch: selectedAccount.branch,
              city: selectedAccount.city,
              chequeNumber,
              amount,
              inWords,
            }
          : undefined,
        to: letterTo ?? undefined,
        signatories,
        createdBy: `${firstName} - ${lastName}`,
      }),
    [selectedAccount, letterTo, signatories, serialNo, chequeNumber, amount, inWords, firstName, lastName],
  );

  const isComplete =
    !!selectedAccount &&
    !!letterTo &&
    signatories.length > 0 &&
    !!chequeNumber &&
    !!amount &&
    !!inWords;

  const ensureComplete = () => {
    if (isComplete) return true;
    toast({
      title: "Letter is incomplete",
      description:
        "Select the From account and the vendor (or the To account for a transfer), add a signatory, and enter cheque number and amount.",
      variant: "destructive",
    });
    return false;
  };

  const actor = {
    id: userProfile?.id || currentUser?.uid || "",
    name: userProfile?.displayName || currentUser?.displayName || currentUser?.email || "Unknown",
    email: currentUser?.email || userProfile?.email || "",
  };

  const handleSave = async () => {
    if (!ensureComplete() || !selectedAccount || !letterTo || !serialNo) return;
    if (linkProblem) {
      toast({
        title: isTransfer ? "Check the account transfer" : "Check the budget requests / POs",
        description: linkProblem,
        variant: "destructive",
      });
      return;
    }

    const transferPlan: RtgsTransferPlan | undefined =
      isTransfer && transferFrom && transferTo
        ? {
            transferId: newTransferId(),
            serialNo,
            amount: amountValue,
            chequeNumber,
            from: transferFrom,
            to: transferTo,
            // The Accounts page records transfers against the sign-in uid.
            actor: { uid: currentUser?.uid || actor.id, name: actor.name, email: actor.email },
          }
        : undefined;

    const plan: RtgsPaymentPlan | undefined =
      !isTransfer && allocations.length > 0 && paymentAccount
        ? {
            serialNo,
            projectCode,
            payeeName: letterTo.accountTitle || "",
            chequeNumber,
            account: paymentAccount,
            allocations,
            actor,
          }
        : undefined;

    setSaving(true);
    try {
      const rtgsId = await ensureRtgsAccountId(selectedAccount);
      if (rtgsId !== selectedAccount.rtgsId) {
        const linked = { ...selectedAccount, rtgsId };
        setSelectedAccount(linked);
        setAccounts((list) =>
          list.map((item) => (item.key === linked.key ? linked : item)),
        );
      }

      await saveLetter(rtgsId, serialNo, prefix, {
        serialNo,
        date: letterDate(),
        from: {
          accountTitle: selectedAccount.accountTitle,
          accountNumber: selectedAccount.accountNumber,
          bank: selectedAccount.bank,
          branch: selectedAccount.branch,
          city: selectedAccount.city,
          chequeNumber,
          amount,
          inWords,
        },
        to: letterTo,
        signatories,
        letterHTML,
        createdAt: new Date(),
        prefix,
        createdby: {
          firstName: { firstName },
          lastName: { lastName },
        },
        ...(plan
          ? {
              projectCode,
              linkedPayments: linkedPaymentsFor(plan),
              paymentAccountId: plan.account.id,
              paymentAccountName: plan.account.accountName || "",
            }
          : {}),
        ...(transferPlan ? { transfer: letterTransferFor(transferPlan) } : {}),
      }, { payments: plan, transfer: transferPlan });

      if (transferPlan) {
        toast({
          title: "Letter saved and transfer recorded",
          description: `Saved as ${serialNo}. ${formatRs(transferPlan.amount)} moved from ${accountLabel(
            transferPlan.from,
          )} to ${accountLabel(transferPlan.to)}.`,
        });
        // Clear the To account so saving again can't transfer twice.
        setTransferToAccountId("");
      } else if (plan) {
        const leftOutstanding = roundMoney(
          plan.allocations.reduce((sum, allocation) => sum + allocation.outstandingAfter, 0),
        );
        toast({
          title: "Letter saved and payments recorded",
          description: `Saved as ${serialNo}. ${plan.allocations.length} item${
            plan.allocations.length === 1 ? "" : "s"
          } paid${leftOutstanding > 0 ? `; ${formatRs(leftOutstanding)} left outstanding` : ""}.`,
        });
        // Clear the picks so saving again can't pay them twice.
        setSelectedPayableKeys([]);
        void loadPayables();
      } else {
        toast({ title: "Letter saved", description: `Saved as ${serialNo}.` });
      }
      // Move on to the next number so a second save can't reuse this one.
      await loadSerial({ ...selectedAccount, rtgsId });
    } catch (error) {
      console.error("RTGS save failed:", error);
      if (error instanceof PayablesChangedError) {
        toast({
          title: "Nothing was saved",
          description: `${error.message} The list has been refreshed. Check the amounts and save again.`,
          variant: "destructive",
        });
        await loadPayables();
      } else if (error instanceof TransferError) {
        toast({ title: "Nothing was saved", description: error.message, variant: "destructive" });
      } else if (error instanceof SerialTakenError) {
        toast({
          title: "Document number already used",
          description: "Someone saved a letter with this number first. A new number has been generated — please save again.",
          variant: "destructive",
        });
        await loadSerial(selectedAccount);
      } else {
        toast({ title: "Failed to save the letter", variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (!ensureComplete()) return;
    if (!printLetter(letterHTML)) {
      toast({ title: "Please allow pop-ups to print the letter.", variant: "destructive" });
    }
  };

  const handleDownloadPdf = async () => {
    if (!ensureComplete()) return;
    setPdfLoading(true);
    try {
      const day = new Date().toISOString().split("T")[0];
      await downloadLetterPdf(letterHTML, `RTGS_${serialNo || "Letter"}_${day}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast({ title: "Failed to generate the PDF", variant: "destructive" });
    } finally {
      setPdfLoading(false);
    }
  };

  const busy = saving || serialLoading || dataLoading;

  return (
    <RtgsShell
      title="RAAST Letter Generator"
      description="Create, save and print RAAST / OTC fund transfer letters."
      actions={
        <>
          <Button
            className="rounded-2xl"
            onClick={handleSave}
            disabled={busy || !isComplete || !serialNo || !!linkProblem}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save
          </Button>
          <Button variant="outline" className="rounded-2xl" onClick={handlePrint} disabled={busy || !isComplete}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl"
            onClick={handleDownloadPdf}
            disabled={busy || pdfLoading || !isComplete}
          >
            {pdfLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Download PDF
          </Button>
        </>
      }
    >
      {fetchError && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {fetchError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {/* Document information */}
          <Card className="rounded-3xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Landmark className="h-4 w-4 text-muted-foreground" />
                From
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Account</Label>
                <Select
                  value={selectedAccount?.key ?? ""}
                  onValueChange={handleAccountChange}
                  disabled={dataLoading || saving || accounts.length === 0}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder={dataLoading ? "Loading accounts..." : "Select the account to pay from"} />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.key} value={account.key}>
                        {accountPrefix({ id: account.rtgsId, accountTitle: account.accountTitle })} -{" "}
                        {shorten(account.accountTitle, 40)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!dataLoading && accounts.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No accounts found. Add one under Finance → Accounts.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Document Number</p>
                  <p className="mt-1 flex items-center gap-2 font-semibold">
                    {serialLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                      </>
                    ) : (
                      serialNo || "Select an account"
                    )}
                    {selectedAccount && !serialLoading && (
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        title="Refresh document number"
                        onClick={() => loadSerial(selectedAccount)}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </p>
                </div>
                <div className="rounded-2xl border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="mt-1 font-semibold">{letterDate()}</p>
                </div>
              </div>

              {selectedAccount && (
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                  <dt className="text-muted-foreground">Account Title</dt>
                  <dd>{selectedAccount.accountTitle}</dd>
                  <dt className="text-muted-foreground">Account Number</dt>
                  <dd>{selectedAccount.accountNumber || "-"}</dd>
                  <dt className="text-muted-foreground">Bank</dt>
                  <dd>{selectedAccount.bank || "-"}</dd>
                  <dt className="text-muted-foreground">Branch</dt>
                  <dd>{selectedAccount.branch || "-"}</dd>
                  <dt className="text-muted-foreground">City</dt>
                  <dd>{selectedAccount.city || "-"}</dd>
                </dl>
              )}
            </CardContent>
          </Card>

          {/* Payment details */}
          <Card className="rounded-3xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rtgs-cheque">Cheque Number</Label>
                <Input
                  id="rtgs-cheque"
                  className="rounded-xl"
                  value={chequeNumber}
                  onChange={(event) => handleChequeChange(event.target.value)}
                  placeholder="Enter cheque number"
                />
                {suggestedCheque && chequeNumber === "" && (
                  <button
                    type="button"
                    onClick={() => setChequeNumber(suggestedCheque)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                    title="Click to fill in"
                  >
                    Last used: <Badge variant="secondary">{suggestedCheque}</Badge>
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="rtgs-amount">Amount</Label>
                <Input
                  id="rtgs-amount"
                  className="rounded-xl"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="e.g. 100,000"
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rtgs-words">Amount in Words</Label>
                <Input
                  id="rtgs-words"
                  className="rounded-xl bg-muted/40"
                  value={inWords}
                  readOnly
                  placeholder="Filled in from the amount"
                />
              </div>
            </CardContent>
          </Card>

          <LinkedPaymentsCard
            mode={paymentMode}
            onModeChange={handlePaymentModeChange}
            transferFrom={transferFrom}
            onTransferFromChange={handleTransferFromChange}
            transferToAccountId={transferToAccountId}
            onTransferToChange={setTransferToAccountId}
            canLink={canLink}
            loading={payablesLoading}
            error={payablesError}
            disabled={saving}
            payables={payables}
            projects={projects}
            projectCode={projectCode}
            onProjectCodeChange={handleProjectCodeChange}
            selectedKeys={selectedPayableKeys}
            onSelectedKeysChange={setSelectedPayableKeys}
            allocations={allocations}
            amount={amountValue}
            problem={linkProblem}
            paymentAccounts={paymentAccounts}
            paymentAccountId={paymentAccountId}
            onPaymentAccountChange={setPaymentAccountId}
            onReload={() => void loadPayables()}
          />

          {/* Vendor */}
          <Card className="rounded-3xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                To
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isTransfer ? (
                letterTo ? (
                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                    <dt className="text-muted-foreground">Account Title</dt>
                    <dd>{letterTo.accountTitle || "-"}</dd>
                    <dt className="text-muted-foreground">Account No</dt>
                    <dd>{letterTo.accountNo || "-"}</dd>
                    <dt className="text-muted-foreground">Bank</dt>
                    <dd>{letterTo.bank || "-"}</dd>
                    <dt className="text-muted-foreground">Branch</dt>
                    <dd>{letterTo.branch || "-"}</dd>
                  </dl>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Account to account transfer: pick Account To under What This Letter Pays.
                  </p>
                )
              ) : (
                <>
                  <Popover open={vendorOpen} onOpenChange={setVendorOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={vendorOpen}
                        className="w-full justify-between rounded-xl font-normal"
                        disabled={dataLoading}
                      >
                        <span className={cn("truncate", !selectedVendor && "text-muted-foreground")}>
                          {selectedVendor
                            ? `${selectedVendor.accountTitle} · ${selectedVendor.accountNo}`
                            : "Search vendor by title or account number"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search vendors..." />
                        <CommandList>
                          <CommandEmpty>No vendor found.</CommandEmpty>
                          <CommandGroup>
                            {vendors.map((vendor) => (
                              <CommandItem
                                key={vendor.id}
                                value={`${vendor.accountTitle} ${vendor.accountNo} ${vendor.id}`}
                                onSelect={() => {
                                  setSelectedVendor(vendor);
                                  setVendorOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedVendor?.id === vendor.id ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                <div className="min-w-0">
                                  <p className="truncate font-medium">{vendor.accountTitle || "Unnamed Vendor"}</p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {vendor.accountNo || "No account number"} · {vendor.bank}
                                  </p>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {selectedVendor && (
                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                      <dt className="text-muted-foreground">Address</dt>
                      <dd>{selectedVendor.address || "-"}</dd>
                      <dt className="text-muted-foreground">Mobile</dt>
                      <dd>{selectedVendor.mobileNumber || "-"}</dd>
                      <dt className="text-muted-foreground">Bank</dt>
                      <dd>{selectedVendor.bank || "-"}</dd>
                      <dt className="text-muted-foreground">Branch</dt>
                      <dd>{selectedVendor.branch || "-"}</dd>
                    </dl>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Signatories */}
          <Card className="rounded-3xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <PenLine className="h-4 w-4 text-muted-foreground" />
                Signatories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {signatories.map((signatory, index) => (
                <div
                  key={`${signatory.id}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{signatory.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {signatory.designation} at {signatory.company}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Change signatory"
                      onClick={() => setSignatoryIndex(index)}
                    >
                      <PenLine className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Remove signatory"
                      onClick={() => setSignatories(signatories.filter((_, i) => i !== index))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Popover
                open={signatoryIndex !== null}
                onOpenChange={(open) => setSignatoryIndex(open ? signatories.length : null)}
              >
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full rounded-xl" disabled={dataLoading}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Signatory
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder={
                        signatoryIndex !== null && signatoryIndex < signatories.length
                          ? `Replace ${signatories[signatoryIndex]?.name}...`
                          : "Search signatories..."
                      }
                    />
                    <CommandList>
                      <CommandEmpty>No signatory found. Add one under Authorizer.</CommandEmpty>
                      <CommandGroup>
                        {signatureRecords.map((record) => (
                          <CommandItem
                            key={record.id}
                            value={`${record.name} ${record.designation} ${record.company} ${record.id}`}
                            onSelect={() => selectSignatory(record)}
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium">{record.name}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {record.designation || "No Designation"} at {record.company || "No Company"}
                              </p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>
        </div>

        {/* Letter preview */}
        <div className="xl:sticky xl:top-0 xl:self-start">
          <Card className="rounded-3xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Letter Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedAccount || selectedVendor || signatories.length > 0 ? (
                <LetterFrame html={letterHTML} />
              ) : (
                <div className="flex aspect-[210/297] w-full items-center justify-center rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Select the From account and vendor, add payment details and signatories to preview the letter.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </RtgsShell>
  );
}
