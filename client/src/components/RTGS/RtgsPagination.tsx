import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RtgsPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/** Previous / page numbers / Next, showing the first, last and nearby pages. */
export default function RtgsPagination({ page, totalPages, onPageChange }: RtgsPaginationProps) {
  if (totalPages <= 1) return null;

  const visiblePages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-1">
      <Button size="sm" variant="outline" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}>
        <ChevronLeft className="mr-1 h-4 w-4" />
        Previous
      </Button>
      {visiblePages.map((p, index) => (
        <span key={p} className="flex items-center gap-1">
          {index > 0 && p - visiblePages[index - 1] > 1 && <span className="px-1 text-muted-foreground">…</span>}
          <Button
            size="sm"
            variant={p === page ? "default" : "outline"}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </Button>
        </span>
      ))}
      <Button
        size="sm"
        variant="outline"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
      >
        Next
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}
