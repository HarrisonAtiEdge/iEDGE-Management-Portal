import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  getDocs,
  onSnapshot,
  type DocumentData,
  type QuerySnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  mapPaymentAccount,
  paymentAccountsCollection,
  sortPaymentAccounts,
} from "@/lib/payments/paymentAccounts";
import type {
  AccountLedgerData,
  MeetingUpdateDoc,
  SalesRecordDoc,
} from "@/lib/payments/accountBalances";

// The one place payment account data is read from. The Accounts tab and the
// Account Statement both use this hook, so they always work from the same
// documents, read the same way, and their numbers match.
//
// Everything is watched live except sales meeting reimbursements: they sit in
// a meetingUpdates subcollection under each sales record (at the panel path
// and the legacy root path) and a collection-group query is rejected by the
// Firestore rules, so they are re-read whenever the sales records change, the
// page comes back into view, refresh() is called, and every 2 minutes.

const PANEL_ID = "IEDGE-SYSTEM";
const MEETING_UPDATES_POLL_MS = 2 * 60 * 1000;

const WATCHED_COLLECTIONS = {
  payments: "payments",
  invoiceRequests: "invoiceRequests",
  purchaseOrders: "PO",
  claimReimbursements: "claimReimbursements",
  records: "Record",
  transfers: "accountTransfers",
  manualEntries: "accountStatementManualEntries",
} as const;

type WatchedKey = keyof typeof WATCHED_COLLECTIONS;
type SourceKey = "accounts" | WatchedKey | "meetingUpdates";

const SOURCE_LABELS: Record<SourceKey, string> = {
  accounts: "Payment accounts",
  payments: "Payments received",
  invoiceRequests: "Budget requests",
  purchaseOrders: "Purchase orders",
  claimReimbursements: "Claim reimbursements",
  records: "Cheque records",
  transfers: "Account transfers",
  manualEntries: "Manual statement entries",
  meetingUpdates: "Sales reimbursements",
};

const SOURCE_KEYS = Object.keys(SOURCE_LABELS) as SourceKey[];

const EMPTY_DATA: AccountLedgerData = {
  accounts: [],
  payments: [],
  invoiceRequests: [],
  purchaseOrders: [],
  claimReimbursements: [],
  records: [],
  transfers: [],
  manualEntries: [],
  salesRecords: [],
  meetingUpdates: [],
};

const toRows = (snapshot: QuerySnapshot<DocumentData>): any[] =>
  snapshot.docs.map((snapshotDoc) => ({
    id: snapshotDoc.id,
    ...snapshotDoc.data(),
  }));

export function useAccountLedgerData() {
  const [data, setData] = useState<AccountLedgerData>(EMPTY_DATA);
  const [loadedSources, setLoadedSources] = useState<SourceKey[]>([]);
  const [failedSources, setFailedSources] = useState<SourceKey[]>([]);
  const readMeetingUpdatesRef = useRef<() => void>(() => {});

  const markLoaded = useCallback((key: SourceKey, failed: boolean) => {
    setLoadedSources((previous) =>
      previous.includes(key) ? previous : [...previous, key],
    );
    setFailedSources((previous) =>
      failed
        ? previous.includes(key)
          ? previous
          : [...previous, key]
        : previous.filter((item) => item !== key),
    );
  }, []);

  useEffect(() => {
    const unsubscribers = [
      onSnapshot(
        paymentAccountsCollection(),
        (snapshot) => {
          setData((previous) => ({
            ...previous,
            accounts: sortPaymentAccounts(
              snapshot.docs.map((snapshotDoc) =>
                mapPaymentAccount(snapshotDoc.id, snapshotDoc.data()),
              ),
            ),
          }));
          markLoaded("accounts", false);
        },
        (error) => {
          console.error(`Failed to load ${SOURCE_LABELS.accounts}:`, error);
          markLoaded("accounts", true);
        },
      ),

      ...(Object.keys(WATCHED_COLLECTIONS) as WatchedKey[]).map((key) =>
        onSnapshot(
          collection(db, "Panels", PANEL_ID, WATCHED_COLLECTIONS[key]),
          (snapshot) => {
            setData((previous) => ({ ...previous, [key]: toRows(snapshot) }));
            markLoaded(key, false);
          },
          (error) => {
            console.error(`Failed to load ${SOURCE_LABELS[key]}:`, error);
            markLoaded(key, true);
          },
        ),
      ),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [markLoaded]);

  useEffect(() => {
    const salesRecords: Record<"panel" | "root", SalesRecordDoc[] | null> = {
      panel: null,
      root: null,
    };
    let panelRecordsFailed = false;
    let readVersion = 0;
    let readTimer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;

    const readMeetingUpdates = async () => {
      if (!salesRecords.panel || !salesRecords.root) return;

      const version = ++readVersion;
      const recordIds = Array.from(
        new Set(
          [...salesRecords.panel, ...salesRecords.root].map(
            (record) => record.id,
          ),
        ),
      );

      // Every sales record's reimbursements are read from both paths.
      const readPath = (sourcePath: "panel" | "root", recordId: string) =>
        getDocs(
          sourcePath === "panel"
            ? collection(
                db,
                "Panels",
                PANEL_ID,
                "salesRecords",
                recordId,
                "meetingUpdates",
              )
            : collection(db, "salesRecords", recordId, "meetingUpdates"),
        ).then((snapshot) =>
          snapshot.docs
            .map(
              (meetingDoc): MeetingUpdateDoc => ({
                id: meetingDoc.id,
                recordId,
                sourcePath,
                data: meetingDoc.data(),
              }),
            )
            .filter((meeting) => meeting.data?.reimbursement?.enabled),
        );

      const reads = recordIds.flatMap((recordId) => [
        { sourcePath: "panel" as const, read: readPath("panel", recordId) },
        { sourcePath: "root" as const, read: readPath("root", recordId) },
      ]);
      const results = await Promise.allSettled(reads.map(({ read }) => read));

      if (disposed || version !== readVersion) return;

      const meetingUpdates = results.flatMap((result) =>
        result.status === "fulfilled" ? result.value : [],
      );

      // The legacy root path may not exist or be readable for every record;
      // only failures at the panel path mean reimbursements are missing.
      const failedPanelReads = results.filter(
        (result, index) =>
          result.status === "rejected" && reads[index].sourcePath === "panel",
      );
      if (failedPanelReads.length > 0) {
        console.error(
          `Failed to load ${failedPanelReads.length} sales reimbursement list(s):`,
          (failedPanelReads[0] as PromiseRejectedResult).reason,
        );
      }

      setData((previous) => ({ ...previous, meetingUpdates }));
      markLoaded(
        "meetingUpdates",
        panelRecordsFailed || failedPanelReads.length > 0,
      );
    };

    // Coalesces bursts of sales record changes into one read.
    const scheduleRead = () => {
      clearTimeout(readTimer);
      readTimer = setTimeout(() => void readMeetingUpdates(), 300);
    };
    readMeetingUpdatesRef.current = scheduleRead;

    const watchSalesRecords = (sourcePath: "panel" | "root") =>
      onSnapshot(
        sourcePath === "panel"
          ? collection(db, "Panels", PANEL_ID, "salesRecords")
          : collection(db, "salesRecords"),
        (snapshot) => {
          if (sourcePath === "panel") panelRecordsFailed = false;
          salesRecords[sourcePath] = snapshot.docs.map((recordDoc) => ({
            id: recordDoc.id,
            sourcePath,
            data: recordDoc.data(),
          }));
          setData((previous) => ({
            ...previous,
            salesRecords: [
              ...(salesRecords.panel || []),
              ...(salesRecords.root || []),
            ],
          }));
          scheduleRead();
        },
        (error) => {
          // The legacy root path may not exist or be readable; the panel
          // path is the primary source, so only its failure is reported.
          if (sourcePath === "panel") {
            console.error("Failed to load sales records:", error);
            panelRecordsFailed = true;
          }

          salesRecords[sourcePath] = [];
          scheduleRead();
        },
      );

    const unsubscribers = [
      watchSalesRecords("panel"),
      watchSalesRecords("root"),
    ];

    const pollTimer = setInterval(() => {
      if (document.visibilityState === "visible") scheduleRead();
    }, MEETING_UPDATES_POLL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") scheduleRead();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      disposed = true;
      clearTimeout(readTimer);
      clearInterval(pollTimer);
      document.removeEventListener("visibilitychange", handleVisibility);
      readMeetingUpdatesRef.current = () => {};
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [markLoaded]);

  // Everything else is live, so a refresh only needs to re-read the sales
  // meeting reimbursements.
  const refresh = useCallback(() => readMeetingUpdatesRef.current(), []);

  const loading = SOURCE_KEYS.some((key) => !loadedSources.includes(key));
  const failedSourceLabels = useMemo(
    () => failedSources.map((key) => SOURCE_LABELS[key]),
    [failedSources],
  );

  return { data, loading, failedSources: failedSourceLabels, refresh };
}
