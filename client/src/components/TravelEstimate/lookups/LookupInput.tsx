import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Loader2, Plus, X } from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Rendering is capped so a short query against ~700 airports stays fast.
const MAX_VISIBLE_OPTIONS = 60;

export interface LookupInputProps<T> {
  id?: string;
  items: T[];
  getKey: (item: T) => string;
  filter: (items: T[], query: string) => T[];
  renderOption: (item: T) => ReactNode;
  onSelect: (item: T) => void;
  /** Text shown while the field isn't being typed in (single selection). */
  displayValue?: string;
  placeholder?: string;
  loading?: boolean;
  loadingText?: string;
  error?: string | null;
  /** Shows the "Add new" row; receives what the user typed. */
  onAddNew?: (query: string) => void;
  addNewLabel?: (query: string) => string;
  onClear?: () => void;
  /** Rendered before the text box, e.g. chips for a multi-select. */
  prefix?: ReactNode;
  trailingIcon?: ReactNode;
  /** Keep the list open after a pick (multi-select). */
  keepOpenOnSelect?: boolean;
  isOptionDisabled?: (item: T) => boolean;
  /** Backspace in an empty box, e.g. to remove the last chip. */
  onBackspaceEmpty?: () => void;
  footerHint?: ReactNode;
  invalid?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
}

/**
 * Searchable dropdown you can type straight into. Typing filters the list;
 * Arrow keys move, Enter or Tab picks, Escape cancels. The last row offers to
 * add a new record when what you need isn't listed.
 */
export function LookupInput<T>({
  id,
  items,
  getKey,
  filter,
  renderOption,
  onSelect,
  displayValue = "",
  placeholder,
  loading = false,
  loadingText = "Loading…",
  error,
  onAddNew,
  addNewLabel,
  onClear,
  prefix,
  trailingIcon,
  keepOpenOnSelect = false,
  isOptionDisabled,
  onBackspaceEmpty,
  footerHint,
  invalid = false,
  disabled = false,
  "aria-label": ariaLabel,
}: LookupInputProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  // Until the user types, the full list is shown even though the box holds
  // the current value.
  const [typed, setTyped] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const anchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const trimmedQuery = query.trim();
  const results = useMemo(
    () => (typed && trimmedQuery ? filter(items, trimmedQuery) : items),
    [typed, trimmedQuery, items, filter],
  );
  const visibleResults = results.slice(0, MAX_VISIBLE_OPTIONS);
  const listboxId = id ? `${id}-listbox` : undefined;

  useEffect(() => {
    setActiveIndex(0);
  }, [trimmedQuery, typed]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const openList = () => {
    if (disabled || open) return;
    setQuery(displayValue);
    setTyped(false);
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.select());
  };

  const closeList = () => {
    setOpen(false);
    setTyped(false);
    setQuery("");
  };

  const choose = (item: T | undefined) => {
    if (!item || isOptionDisabled?.(item)) return;
    onSelect(item);
    if (keepOpenOnSelect) {
      setQuery("");
      setTyped(false);
    } else {
      closeList();
    }
  };

  const addNew = () => {
    const typedText = typed ? trimmedQuery : "";
    closeList();
    inputRef.current?.blur();
    onAddNew?.(typedText);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) openList();
        else setActiveIndex((index) => Math.min(index + 1, visibleResults.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        break;
      case "Enter":
        // Never let Enter in a dropdown submit the surrounding form.
        event.preventDefault();
        if (!open) {
          openList();
        } else if (visibleResults[activeIndex]) {
          choose(visibleResults[activeIndex]);
        } else if (onAddNew && trimmedQuery) {
          addNew();
        }
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          closeList();
        }
        break;
      case "Tab":
        // Type a code and tab on, like a GDS entry screen.
        if (open && typed && trimmedQuery && visibleResults[activeIndex]) {
          choose(visibleResults[activeIndex]);
        }
        closeList();
        break;
      case "Backspace":
        if (!query && onBackspaceEmpty) onBackspaceEmpty();
        break;
    }
  };

  const showClear = Boolean(onClear && displayValue && !disabled);

  return (
    <Popover open={open} onOpenChange={(next) => !next && closeList()}>
      <PopoverAnchor asChild>
        <div
          ref={anchorRef}
          className={cn(
            "flex min-h-10 w-full flex-wrap items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-within:ring-1 focus-within:ring-ring",
            invalid && "border-destructive focus-within:ring-destructive",
            disabled && "cursor-not-allowed opacity-50",
          )}
          onMouseDown={(event) => {
            // Clicking the box (not the text) should still focus the input.
            if (event.target !== inputRef.current) {
              event.preventDefault();
              inputRef.current?.focus();
              openList();
            }
          }}
        >
          {prefix}
          <input
            ref={inputRef}
            id={id}
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-invalid={invalid || undefined}
            aria-label={ariaLabel}
            autoComplete="off"
            spellCheck={false}
            disabled={disabled}
            className="h-7 min-w-[5rem] flex-1 bg-transparent px-1 outline-none placeholder:italic placeholder:text-muted-foreground disabled:cursor-not-allowed"
            placeholder={placeholder}
            value={open ? query : displayValue}
            onFocus={openList}
            onClick={openList}
            onChange={(event) => {
              setQuery(event.target.value);
              setTyped(true);
              setOpen(true);
            }}
            onBlur={closeList}
            onKeyDown={handleKeyDown}
          />
          {showClear && (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Clear"
              className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={() => onClear?.()}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {trailingIcon}
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-[var(--radix-popover-trigger-width)] min-w-[18rem] max-w-[32rem] p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          if (anchorRef.current?.contains(event.target as Node)) event.preventDefault();
        }}
        // Keep focus in the text box while clicking inside the list.
        onMouseDown={(event) => event.preventDefault()}
      >
        <div ref={listRef} id={listboxId} role="listbox" className="max-h-72 overflow-y-auto py-1">
          {loading && items.length === 0 ? (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {loadingText}
            </div>
          ) : visibleResults.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {trimmedQuery ? `No match for "${trimmedQuery}".` : "Nothing to show yet."}
            </div>
          ) : (
            visibleResults.map((item, index) => {
              const optionDisabled = isOptionDisabled?.(item) ?? false;
              return (
                <div
                  key={getKey(item)}
                  role="option"
                  data-index={index}
                  aria-selected={index === activeIndex}
                  aria-disabled={optionDisabled || undefined}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm",
                    index === activeIndex && "bg-accent text-accent-foreground",
                    optionDisabled && "cursor-not-allowed opacity-50",
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(item)}
                >
                  {renderOption(item)}
                </div>
              );
            })
          )}
          {results.length > MAX_VISIBLE_OPTIONS && (
            <div className="px-3 py-1.5 text-xs text-muted-foreground">
              Showing {MAX_VISIBLE_OPTIONS} of {results.length}. Keep typing to narrow the list.
            </div>
          )}
        </div>

        {error && <div className="border-t px-3 py-2 text-xs text-destructive">{error}</div>}
        {footerHint && (
          <div className="border-t px-3 py-1.5 text-xs text-muted-foreground">{footerHint}</div>
        )}
        {onAddNew && (
          <button
            type="button"
            className="flex w-full items-center gap-2 border-t px-3 py-2 text-left text-sm font-medium text-primary hover:bg-accent"
            onClick={addNew}
          >
            <Plus className="h-4 w-4 shrink-0" />
            {addNewLabel ? addNewLabel(typed ? trimmedQuery : "") : "Add new"}
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
