import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FieldShellProps {
  htmlFor?: string;
  label: string;
  required?: boolean;
  info?: string;
  error?: string;
  className?: string;
  /** Hide the label on wide screens where a table header names the column. */
  hideLabelOnWide?: boolean;
  children: ReactNode;
}

/** Label above, error below. */
export function FieldShell({
  htmlFor,
  label,
  required,
  info,
  error,
  className,
  hideLabelOnWide,
  children,
}: FieldShellProps) {
  return (
    <div className={cn("min-w-0 space-y-1", className)}>
      <div className={cn("flex items-center gap-1", hideLabelOnWide && "xl:sr-only")}>
        <Label htmlFor={htmlFor} className="text-sm font-normal">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
        {info && <InfoTip text={info} />}
      </div>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="text-muted-foreground hover:text-foreground" aria-label={text}>
          <Info className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">{text}</TooltipContent>
    </Tooltip>
  );
}
