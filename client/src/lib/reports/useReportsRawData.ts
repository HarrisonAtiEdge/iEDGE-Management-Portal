import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ReportsRawData } from "./types";

const PANEL_ID = "IEDGE-SYSTEM";

// One collection per constituent source. Kept as one subscription per
// collection (rather than a single combined query) so adding or removing a
// source later is a one-line change here, isolated from everything that
// reads `ReportsRawData` downstream.
const SOURCES: { key: keyof ReportsRawData; collection: string }[] = [
  { key: "estimates", collection: "estimates" },
  { key: "invoices", collection: "estimateInvoices" },
  { key: "budgetRequests", collection: "invoiceRequests" },
  { key: "reimbursements", collection: "claimReimbursements" },
  { key: "clients", collection: "clients" },
  { key: "salesRecords", collection: "salesRecords" },
  { key: "rtdRecords", collection: "rtdRecords" },
  { key: "rtdEstimates", collection: "rtdEstimates" },
  { key: "rtdInvoices", collection: "rtdInvoices" },
];

const emptyData: ReportsRawData = {
  estimates: [],
  invoices: [],
  budgetRequests: [],
  reimbursements: [],
  clients: [],
  salesRecords: [],
  rtdRecords: [],
  rtdEstimates: [],
  rtdInvoices: [],
};

export function useReportsRawData() {
  const [data, setData] = useState<ReportsRawData>(emptyData);
  const [loadedKeys, setLoadedKeys] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribers = SOURCES.map(({ key, collection: collectionName }) =>
      onSnapshot(
        collection(db, "Panels", PANEL_ID, collectionName),
        (snapshot) => {
          const rows = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));

          setData((previous) => ({
            ...previous,
            [key]: rows,
          }));

          setLoadedKeys((previous) => {
            const next = new Set(previous);
            next.add(key);
            return next;
          });
        },
        (loadError) => {
          console.error(`Reports: failed to load ${collectionName}:`, loadError);
          setError(`Failed to load ${collectionName} data.`);
        },
      ),
    );

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  return {
    data,
    loading: loadedKeys.size < SOURCES.length,
    error,
  };
}
