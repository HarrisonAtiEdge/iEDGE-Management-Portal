import { useSyncExternalStore } from "react";
import {
  onSnapshot,
  type CollectionReference,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { clientsCol, taxesCol } from "../firestorePaths";
import type { ClientRef, FareTax } from "../types";

// Lists kept by other modules that the estimate form only reads: clients from
// the Contacts Directory and taxes from Settings → Tax.

interface ListState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
}

/** One listener for every field on the page, opened by the first and kept for the session. */
function createLiveList<T extends { name: string }>(
  col: () => CollectionReference<DocumentData>,
  read: (id: string, data: DocumentData) => T,
  loadError: string,
) {
  let state: ListState<T> = { items: [], loading: true, error: null };
  const listeners = new Set<() => void>();
  let stopListening: Unsubscribe | null = null;

  const setState = (next: ListState<T>) => {
    state = next;
    listeners.forEach((listener) => listener());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    if (!stopListening) {
      stopListening = onSnapshot(
        col(),
        (snapshot) => {
          const items = snapshot.docs
            .map((docSnap) => read(docSnap.id, docSnap.data()))
            .filter((item) => item.name)
            .sort((a, b) => a.name.localeCompare(b.name));
          setState({ items, loading: false, error: null });
        },
        (error) => {
          console.error(loadError, error);
          stopListening = null;
          setState({ ...state, loading: false, error: loadError });
        },
      );
    }
    return () => {
      listeners.delete(listener);
    };
  };

  return () => useSyncExternalStore(subscribe, () => state);
}

export const useClients = createLiveList<ClientRef>(
  clientsCol,
  (id, data) => ({ id, name: String(data.name ?? "").trim() }),
  "Couldn't load the clients.",
);

export const useTaxes = createLiveList<FareTax>(
  taxesCol,
  (id, data) => ({ id, name: String(data.name ?? "").trim(), percent: Number(data.percent) || 0 }),
  "Couldn't load the taxes.",
);
