import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useClients } from "../lookups/directoryLists";
import type { ClientRef } from "../types";

interface ClientFieldProps {
  id: string;
  value: ClientRef | null;
  invalid?: boolean;
  onChange: (value: ClientRef) => void;
}

// Every word must appear as typed: the default fuzzy match also offers clients
// that merely share some letters, and a quote for the wrong client is costly.
function matchClient(_value: string, search: string, keywords: string[] = []) {
  const name = keywords.join(" ").toLowerCase();
  return search.toLowerCase().split(/\s+/).every((term) => name.includes(term)) ? 1 : 0;
}

/** Searchable list of the Contacts Directory's clients. */
export function ClientField({ id, value, invalid, onChange }: ClientFieldProps) {
  const { items: clients, loading, error } = useClients();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          className={cn("w-full justify-between font-normal", invalid && "border-destructive")}
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value?.name ?? (loading ? "Loading clients…" : "Select a client")}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[16rem] p-0" align="start">
        <Command filter={matchClient}>
          <CommandInput placeholder="Search clients…" />
          <CommandList>
            <CommandEmpty>{error ?? (loading ? "Loading clients…" : "No client found.")}</CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.id}
                  keywords={[client.name]}
                  onSelect={() => {
                    onChange(client);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4 shrink-0", value?.id === client.id ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{client.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
