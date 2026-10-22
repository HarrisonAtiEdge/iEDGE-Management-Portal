import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronsUpDown,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { paymentAccountPickerName } from "@/lib/payments/paymentAccounts";
import type { PaymentAccount } from "@/lib/payments/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { formatRs, roundMoney, type RtgsAllocation, type RtgsPayable, type RtgsProject } from "./rtgsPayables";
import { accountLabel } from "./rtgsTransfer";

export type RtgsPaymentMode = "payables" | "transfer";

const MODES: Array<[RtgsPaymentMode, string]> = [
  ["payables", "Project Code"],
  ["transfer", "Account to Account Transfer"],
];

const accountOptionLabel = (account: PaymentAccount) =>
  [paymentAccountPickerName(account), account.accountName ? account.bankName : "", account.accountNumber]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" · ");

interface LinkedPaymentsCardProps {
  mode: RtgsPaymentMode;
  onModeChange: (mode: RtgsPaymentMode) => void;
  /** The letter's From account, when it's one of the Finance → Accounts accounts. */
  transferFrom: PaymentAccount | null;
  /** Picking Account From also sets the letter's From account. */
  onTransferFromChange: (id: string) => void;
  transferToAccountId: string;
  onTransferToChange: (id: string) => void;
  canLink: boolean;
  loading: boolean;
  error: string | null;
  disabled: boolean;
  payables: RtgsPayable[];
  projects: RtgsProject[];
  projectCode: string;
  onProjectCodeChange: (code: string) => void;
  selectedKeys: string[];
  onSelectedKeysChange: (keys: string[]) => void;
  allocations: RtgsAllocation[];
  amount: number;
  problem: string | null;
  paymentAccounts: PaymentAccount[];
  paymentAccountId: string;
  onPaymentAccountChange: (id: string) => void;
  onReload: () => void;
}

const kindLabel = (payable: RtgsPayable) => (payable.kind === "budget_request" ? "Budget Request" : "PO");

/** RTGS form section: what the letter pays (budget requests / POs, or an account transfer). */
export default function LinkedPaymentsCard({
  mode,
  onModeChange,
  transferFrom,
  onTransferFromChange,
  transferToAccountId,
  onTransferToChange,
  canLink,
  loading,
  error,
  disabled,
  payables,
  projects,
  projectCode,
  onProjectCodeChange,
  selectedKeys,
  onSelectedKeysChange,
  allocations,
  amount,
  problem,
  paymentAccounts,
  paymentAccountId,
  onPaymentAccountChange,
  onReload,
}: LinkedPaymentsCardProps) {
  const { toast } = useToast();
  const [projectOpen, setProjectOpen] = useState(false);
  const [itemsOpen, setItemsOpen] = useState(false);

  // Every project code, plus any code only found on a budget request / PO;
  // the ones with something to pay are listed first.
  const projectOptions = useMemo(() => {
    type Option = RtgsProject & { count: number; outstanding: number };
    const byCode = new Map<string, Option>();
    projects.forEach((project) => byCode.set(project.code, { ...project, count: 0, outstanding: 0 }));
    payables.forEach((payable) => {
      const option = byCode.get(payable.projectCode) || {
        code: payable.projectCode,
        projectName: "",
        client: "",
        count: 0,
        outstanding: 0,
      };
      option.count += 1;
      option.outstanding = roundMoney(option.outstanding + payable.outstanding);
      byCode.set(payable.projectCode, option);
    });
    const all = Array.from(byCode.values()).sort((a, b) => a.code.localeCompare(b.code));
    return {
      withOutstanding: all.filter((option) => option.count > 0),
      others: all.filter((option) => option.count === 0),
    };
  }, [projects, payables]);

  const selectedProject = [...projectOptions.withOutstanding, ...projectOptions.others].find(
    (option) => option.code === projectCode,
  );

  const projectPayables = payables.filter((payable) => payable.projectCode === projectCode);
  const budgetRequests = projectPayables.filter((payable) => payable.kind === "budget_request");
  const purchaseOrders = projectPayables.filter((payable) => payable.kind === "purchase_order");

  const paying = roundMoney(allocations.reduce((sum, allocation) => sum + allocation.amount, 0));
  const outstandingAfter = roundMoney(allocations.reduce((sum, allocation) => sum + allocation.outstandingAfter, 0));

  const toggle = (payable: RtgsPayable) => {
    if (selectedKeys.includes(payable.key)) {
      onSelectedKeysChange(selectedKeys.filter((key) => key !== payable.key));
      return;
    }
    const linked = payables.find((other) => payable.linkedKeys.includes(other.key) && selectedKeys.includes(other.key));
    if (linked) {
      toast({
        title: "Already being paid",
        description: `${payable.number} and ${linked.number} are the same spend (the PO was raised from the budget request). Pay only one of them.`,
        variant: "destructive",
      });
      return;
    }
    onSelectedKeysChange([...selectedKeys, payable.key]);
  };

  const move = (index: number, offset: number) => {
    const next = [...selectedKeys];
    const [key] = next.splice(index, 1);
    next.splice(index + offset, 0, key);
    onSelectedKeysChange(next);
  };

  const renderProject = (project: (typeof projectOptions.others)[number]) => (
    <CommandItem
      key={project.code}
      value={`${project.code} ${project.projectName} ${project.client}`}
      onSelect={() => {
        onProjectCodeChange(project.code);
        setProjectOpen(false);
      }}
    >
      <Check className={cn("mr-2 h-4 w-4 shrink-0", projectCode === project.code ? "opacity-100" : "opacity-0")} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {project.code}
          {project.projectName ? ` · ${project.projectName}` : ""}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {project.client ? `${project.client} · ` : ""}
          {project.count > 0
            ? `${project.count} outstanding · ${formatRs(project.outstanding)}`
            : "Nothing outstanding to pay"}
        </p>
      </div>
    </CommandItem>
  );

  const renderOption = (payable: RtgsPayable) => (
    <CommandItem
      key={payable.key}
      value={`${payable.number} ${payable.vendorName} ${payable.title} ${payable.key}`}
      onSelect={() => toggle(payable)}
    >
      <Check
        className={cn("mr-2 h-4 w-4 shrink-0", selectedKeys.includes(payable.key) ? "opacity-100" : "opacity-0")}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {payable.number} · {payable.vendorName || "No vendor"}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {payable.title ? `${payable.title} · ` : ""}Outstanding {formatRs(payable.outstanding)}
        </p>
      </div>
    </CommandItem>
  );

  return (
    <Card className="rounded-3xl shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            What This Letter Pays
          </span>
          {canLink && (
            <Button
              size="sm"
              variant="ghost"
              title="Reload budget requests and POs"
              onClick={onReload}
              disabled={loading || disabled}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canLink ? (
          <p className="text-sm text-muted-foreground">
            Only Finance and the main admin can mark budget requests and POs as paid, or record an account
            transfer, from an RTGS letter.
          </p>
        ) : (
          <>
            <RadioGroup
              value={mode}
              onValueChange={(value) => onModeChange(value as RtgsPaymentMode)}
              className="grid gap-2 sm:grid-cols-2"
              disabled={disabled}
            >
              {MODES.map(([value, label]) => (
                <Label
                  key={value}
                  htmlFor={`rtgs-mode-${value}`}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-xl border p-3 font-normal",
                    mode === value && "border-primary bg-primary/5",
                  )}
                >
                  <RadioGroupItem id={`rtgs-mode-${value}`} value={value} />
                  {label}
                </Label>
              ))}
            </RadioGroup>

            {error && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {mode === "transfer" ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Moves the amount between two company accounts. No project code is needed. Account From is also the
                  letter&apos;s From account, and the letter&apos;s To details come from Account To.
                </p>

                <div className="space-y-2">
                  <Label>Account From</Label>
                  <Select
                    value={transferFrom?.id ?? ""}
                    onValueChange={onTransferFromChange}
                    disabled={disabled || loading}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder={loading ? "Loading accounts..." : "Select the account to transfer from"} />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {accountOptionLabel(account)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Account To</Label>
                  <Select value={transferToAccountId} onValueChange={onTransferToChange} disabled={disabled || loading}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder={loading ? "Loading accounts..." : "Select the account to transfer to"} />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentAccounts
                        .filter((account) => account.id !== transferFrom?.id)
                        .map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {accountOptionLabel(account)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-2xl border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Transfer Amount</p>
                  <p className="font-semibold">{formatRs(amount)}</p>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Optional. Pick a project code, then the budget requests and POs this letter pays. The amount is
                  applied in the order listed below; anything not covered stays outstanding.
                </p>

                <div className="space-y-2">
                  <Label>Project Code</Label>
                  <Popover open={projectOpen} onOpenChange={setProjectOpen}>
                    {/* Anchored to the whole row, not the trigger: the clear button appearing on
                        select would shrink the trigger while the list is still closing, and
                        resizing the list then sets off a "ResizeObserver loop" browser error. */}
                    <PopoverAnchor asChild>
                      <div className="flex gap-2">
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={projectOpen}
                            className="w-full justify-between rounded-xl font-normal"
                            disabled={loading || disabled}
                          >
                            <span className={cn("truncate", !projectCode && "text-muted-foreground")}>
                              {loading
                                ? "Loading projects, budget requests and POs..."
                                : projectCode
                                  ? `${projectCode}${selectedProject?.projectName ? ` · ${selectedProject.projectName}` : ""}`
                                  : "Search project code, name or client"}
                            </span>
                            {loading ? (
                              <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
                            ) : (
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            )}
                          </Button>
                        </PopoverTrigger>
                        {projectCode && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 rounded-xl"
                            title="Clear project code"
                            onClick={() => onProjectCodeChange("")}
                            disabled={disabled}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </PopoverAnchor>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search project code, name or client..." />
                        <CommandList>
                          <CommandEmpty>No project found.</CommandEmpty>
                          {projectOptions.withOutstanding.length > 0 && (
                            <CommandGroup heading="Outstanding to pay">
                              {projectOptions.withOutstanding.map(renderProject)}
                            </CommandGroup>
                          )}
                          {projectOptions.others.length > 0 && (
                            <CommandGroup heading="Other projects">
                              {projectOptions.others.map(renderProject)}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {projectCode && projectPayables.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    {projectCode} has no approved budget requests or POs with an outstanding balance.
                  </p>
                )}

                {projectCode && projectPayables.length > 0 && (
                  <Popover open={itemsOpen} onOpenChange={setItemsOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full rounded-xl" disabled={disabled}>
                        <Plus className="mr-2 h-4 w-4" />
                        Select Budget Requests / POs
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search by number, vendor or title..." />
                        <CommandList>
                          <CommandEmpty>Nothing outstanding matches.</CommandEmpty>
                          {budgetRequests.length > 0 && (
                            <CommandGroup heading="Budget Requests">{budgetRequests.map(renderOption)}</CommandGroup>
                          )}
                          {purchaseOrders.length > 0 && (
                            <CommandGroup heading="Purchase Orders">{purchaseOrders.map(renderOption)}</CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}

                {allocations.length > 0 && (
                  <div className="space-y-3">
                    {allocations.map(({ payable, amount: payingNow, outstandingAfter: left }, index) => (
                      <div key={payable.key} className="rounded-2xl border p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex min-w-0 items-center gap-2">
                              <Badge variant="secondary" className="shrink-0">
                                {index + 1}. {kindLabel(payable)}
                              </Badge>
                              <span className="truncate font-medium">{payable.number}</span>
                            </div>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {payable.vendorName || "No vendor"}
                              {payable.title ? ` · ${payable.title}` : ""}
                            </p>
                          </div>
                          <div className="flex shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Pay earlier"
                              onClick={() => move(index, -1)}
                              disabled={disabled || index === 0}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Pay later"
                              onClick={() => move(index, 1)}
                              disabled={disabled || index === allocations.length - 1}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Remove"
                              onClick={() => toggle(payable)}
                              disabled={disabled}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <dt className="text-muted-foreground">Outstanding</dt>
                            <dd className="font-medium">{formatRs(payable.outstanding)}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Paying</dt>
                            <dd className="font-medium">{formatRs(payingNow)}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Left Outstanding</dt>
                            <dd
                              className={cn(
                                "font-medium",
                                left > 0.009 && "text-amber-600 dark:text-amber-400",
                              )}
                            >
                              {formatRs(left)}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    ))}

                    <dl className="grid grid-cols-3 gap-3 rounded-2xl border bg-muted/40 p-3">
                      <div>
                        <dt className="text-xs text-muted-foreground">RTGS Amount</dt>
                        <dd className="font-semibold">{formatRs(amount)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Paying</dt>
                        <dd className="font-semibold">{formatRs(paying)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Left Outstanding</dt>
                        <dd className="font-semibold">{formatRs(outstandingAfter)}</dd>
                      </div>
                    </dl>

                    <div className="space-y-2">
                      <Label>Record Payment Against</Label>
                      <Select value={paymentAccountId} onValueChange={onPaymentAccountChange} disabled={disabled}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select the payment account" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.accountName || account.bankName || "Unnamed account"}
                              {account.accountNumber ? ` · ${account.accountNumber}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Filled in from the From account&apos;s account number. Account balances use this account.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {problem && <p className="text-sm text-destructive">{problem}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}
