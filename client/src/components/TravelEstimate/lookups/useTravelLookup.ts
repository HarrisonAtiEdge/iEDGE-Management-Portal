import { useSyncExternalStore } from "react";
import type { Unsubscribe } from "firebase/firestore";
import type { LookupItemMap, LookupKind } from "../types";
import { seedLookupIfNeeded, subscribeLookupItems } from "./lookupService";

export interface LookupState<T> {
  items: T[];
  loading: boolean;
  /** True while the built-in list is being written on first use. */
  seeding: boolean;
  error: string | null;
}

interface LookupStore<T> {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => LookupState<T>;
}

// One Firestore listener per list, shared by every field (each flight row
// has its own From/To/Carrier fields). It opens with the first field and then
// stays open for the session: the airport list is ~1,260 documents, so moving
// between Create, List and Edit doesn't read it all again. Later changes only
// cost reads for the documents that changed.
function createLookupStore<K extends LookupKind>(kind: K): LookupStore<LookupItemMap[K]> {
  let state: LookupState<LookupItemMap[K]> = {
    items: [],
    loading: true,
    seeding: false,
    error: null,
  };
  const listeners = new Set<() => void>();
  let stopListening: Unsubscribe | null = null;
  let seedChecked = false;

  const update = (patch: Partial<LookupState<LookupItemMap[K]>>) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  };

  const seedIfNeeded = (existingCodes: Set<string>) => {
    seedChecked = true;
    update({ seeding: true });

    seedLookupIfNeeded(kind, existingCodes)
      .then(() => update({ seeding: false }))
      .catch((error) => {
        console.error(`Couldn't set up the ${kind} list:`, error);
        seedChecked = false;
        update({
          seeding: false,
          error: `Couldn't set up the ${kind} list. Reload the page to try again.`,
        });
      });
  };

  const start = () => {
    stopListening = subscribeLookupItems(
      kind,
      (items, fromCache) => {
        update({ items, loading: false, error: null });
        // Only a server snapshot tells us which codes really exist.
        if (!fromCache && !seedChecked) {
          seedIfNeeded(new Set(items.map((item) => item.code)));
        }
      },
      (error) => {
        // Firestore ends the listener on error (e.g. after sign-out); let the
        // next field that mounts start a fresh one.
        console.error(`Error loading ${kind}:`, error);
        stopListening = null;
        seedChecked = false;
        update({ loading: false, error: `Couldn't load the ${kind} list.` });
      },
    );
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      if (!stopListening) start();

      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => state,
  };
}

const stores: { [K in LookupKind]: LookupStore<LookupItemMap[K]> } = {
  airports: createLookupStore("airports"),
  airlines: createLookupStore("airlines"),
};

export function useTravelLookup<K extends LookupKind>(kind: K): LookupState<LookupItemMap[K]> {
  const store = stores[kind] as LookupStore<LookupItemMap[K]>;
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
