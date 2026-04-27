import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import PaymentReleaseModal from "@/components/PaymentReleaseModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Users,
  Wallet,
  CheckCircle2,
  Clock3,
  XCircle,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Receipt,
  CircleDollarSign,
  RotateCcw,
  Layers3,
} from "lucide-react";

interface Reimbursement {
  id: string;
  recordId: string;
  client: string;
  amount: number;
  approvedAmount?: number;
  approvalRemarks?: string;
  approvalDecisionAt?: any;
  sourcePath?: "panel" | "root";
  status: string;
  rawStatus?: string;
  billUrl?: string;
  personName?: string;
  submittedDate?: any;
  fuelClaim?: number;
  details?: string;
  projectName?: string;
  approvedBy?: string;
  paymentStatus?: string;
  paidBy?: string;
}

const normalizeReimbursementStatus = (value: string) => {
  const status = String(value || "")
    .trim()
    .toLowerCase();

  if (status === "pending_admin_approval") return "pending";
  if (status === "pending") return "pending";
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";

  return "pending";
};

const formatStatusLabel = (value?: string) => {
  const raw = String(value || "").trim();
  if (!raw) return "Pending";

  return raw
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getSortableTime = (date: any) => {
  if (!date) return 0;

  try {
    if (date?.toDate) return date.toDate().getTime();
    if (date?.seconds) return date.seconds * 1000;

    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) return parsed.getTime();

    return 0;
  } catch {
    return 0;
  }
};

const formatDate = (date: any) => {
  if (!date) return "N/A";

  try {
    if (date?.toDate) return date.toDate().toLocaleDateString();

    if (date?.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString();
    }

    if (typeof date === "string") {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString();
      }
    }

    return "Invalid";
  } catch {
    return "Invalid";
  }
};

const formatCurrency = (value: number) => {
  return `Rs ${Number(value || 0).toLocaleString()}`;
};

const getApprovalBadgeClass = (status?: string) => {
  const normalized = normalizeReimbursementStatus(String(status || ""));

  switch (normalized) {
    case "approved":
      return "bg-green-100 text-green-700 border-green-200";
    case "rejected":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
  }
};

const getPaymentBadgeClass = (status?: string) => {
  const normalized = String(status || "pending").toLowerCase();

  switch (normalized) {
    case "paid":
      return "bg-green-100 text-green-700 border-green-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {title}
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {value}
            </p>
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="rounded-xl border bg-muted/40 p-2.5 text-muted-foreground">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReimbursementDashboard() {
  const { userProfile, currentUser } = useAuth();

  const [data, setData] = useState<Reimbursement[]>([]);
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [personFilter, setPersonFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Reimbursement | null>(null);

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<
    "approved" | "rejected" | null
  >(null);
  const [approvalAmount, setApprovalAmount] = useState("");
  const [approvalRemarks, setApprovalRemarks] = useState("");
  const [approvalSaving, setApprovalSaving] = useState(false);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailItem, setDetailItem] = useState<Reimbursement | null>(null);

  const getMeetingDocRef = (item: Reimbursement) => {
    if (item.sourcePath === "root") {
      return doc(db, "salesRecords", item.recordId, "meetingUpdates", item.id);
    }

    return doc(
      db,
      "Panels",
      "IEDGE-SYSTEM",
      "salesRecords",
      item.recordId,
      "meetingUpdates",
      item.id,
    );
  };

  const fetchData = useCallback(async () => {
    setLoading(data.length === 0);

    try {
      const panelRecordsSnap = await getDocs(
        collection(db, "Panels", "IEDGE-SYSTEM", "salesRecords"),
      );

      let legacyRecordDocs: any[] = [];

      try {
        const legacyRecordsSnap = await getDocs(collection(db, "salesRecords"));
        legacyRecordDocs = legacyRecordsSnap.docs;
      } catch (legacyRecordError) {
        console.warn(
          "Legacy salesRecords path not available:",
          legacyRecordError,
        );
      }

      const recordMap = new Map<
        string,
        {
          id: string;
          data: any;
        }
      >();

      panelRecordsSnap.docs.forEach((record) => {
        recordMap.set(record.id, {
          id: record.id,
          data: record.data(),
        });
      });

      legacyRecordDocs.forEach((record) => {
        if (!recordMap.has(record.id)) {
          recordMap.set(record.id, {
            id: record.id,
            data: record.data(),
          });
        }
      });

      const recordResults = await Promise.allSettled(
        Array.from(recordMap.values()).map(async (record) => {
          const recordId = record.id;
          const recordData = record.data;

          const meetingDocsWithSource: Array<{
            meetingDoc: any;
            sourcePath: "panel" | "root";
          }> = [];

          try {
            const panelMeetingsSnap = await getDocs(
              collection(
                db,
                "Panels",
                "IEDGE-SYSTEM",
                "salesRecords",
                recordId,
                "meetingUpdates",
              ),
            );

            panelMeetingsSnap.docs.forEach((meetingDoc) => {
              meetingDocsWithSource.push({
                meetingDoc,
                sourcePath: "panel",
              });
            });
          } catch (panelMeetingError) {
            console.error(
              `Error fetching panel meetingUpdates for record ${recordId}:`,
              panelMeetingError,
            );
          }

          try {
            const legacyMeetingsSnap = await getDocs(
              collection(db, "salesRecords", recordId, "meetingUpdates"),
            );

            legacyMeetingsSnap.docs.forEach((meetingDoc) => {
              meetingDocsWithSource.push({
                meetingDoc,
                sourcePath: "root",
              });
            });
          } catch (legacyMeetingError) {
            console.warn(
              `Legacy meetingUpdates path not available for record ${recordId}:`,
              legacyMeetingError,
            );
          }

          const seenMeetings = new Set<string>();

          return meetingDocsWithSource
            .map(({ meetingDoc, sourcePath }) => {
              const meetingKey = `${sourcePath}-${meetingDoc.id}`;

              if (seenMeetings.has(meetingKey)) return null;
              seenMeetings.add(meetingKey);

              const meeting: any = meetingDoc.data();
              const reimbursement = meeting?.reimbursement;

              if (!reimbursement?.enabled) return null;

              return {
                id: meetingDoc.id,
                recordId,
                client: recordData.client || "Unknown",
                projectName: recordData.projectName || "N/A",
                amount: Number(reimbursement.amount || 0),
                approvedAmount:
                  reimbursement.approvedAmount !== undefined
                    ? Number(reimbursement.approvedAmount || 0)
                    : undefined,
                approvalRemarks: reimbursement.approvalRemarks || "",
                approvalDecisionAt: reimbursement.approvalDecisionAt || null,
                sourcePath,
                rawStatus: String(
                  reimbursement.approvalStatus || "pending_admin_approval",
                ),
                status: normalizeReimbursementStatus(
                  reimbursement.approvalStatus || "pending_admin_approval",
                ),
                billUrl: reimbursement.billUrl || "",
                personName:
                  reimbursement.approvalSubmittedByName ||
                  reimbursement.personName ||
                  "Unknown",
                submittedDate:
                  reimbursement.approvalSubmittedAt ||
                  reimbursement.submittedAt ||
                  reimbursement.createdAt ||
                  reimbursement.date ||
                  reimbursement.meetingDate ||
                  meeting.reimbursementSubmittedAt ||
                  meeting.submittedAt ||
                  meeting.updatedAt ||
                  meeting.createdAt ||
                  meeting.meetingDate ||
                  null,
                fuelClaim: Number(reimbursement.kms || 0),
                details: reimbursement.detail || "N/A",
                approvedBy: reimbursement.approvedBy || "",
                paymentStatus: reimbursement.paymentStatus || "pending",
                paidBy: reimbursement.paidBy || "",
              } as Reimbursement;
            })
            .filter(Boolean) as Reimbursement[];
        }),
      );

      const rows = recordResults
        .filter(
          (result): result is PromiseFulfilledResult<Reimbursement[]> =>
            result.status === "fulfilled",
        )
        .flatMap((result) => result.value);

      rows.sort(
        (a, b) =>
          getSortableTime(b.submittedDate) - getSortableTime(a.submittedDate),
      );

      setData(rows);
    } catch (error) {
      console.error("Error fetching reimbursements:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const uniquePeople = useMemo(() => {
    return Array.from(
      new Set(
        data.map(
          (item) => String(item.personName || "Unknown").trim() || "Unknown",
        ),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();

    const rows = data.filter((item) => {
      const matchesApproval =
        approvalFilter === "all" || item.status === approvalFilter;

      const payment = String(item.paymentStatus || "pending").toLowerCase();
      const matchesPayment =
        paymentFilter === "all" || payment === paymentFilter;

      const person = String(item.personName || "Unknown").trim() || "Unknown";
      const matchesPerson = personFilter === "all" || person === personFilter;

      const matchesSearch =
        !query ||
        item.client?.toLowerCase().includes(query) ||
        item.personName?.toLowerCase().includes(query) ||
        item.projectName?.toLowerCase().includes(query) ||
        item.details?.toLowerCase().includes(query);

      return (
        matchesApproval && matchesPayment && matchesPerson && matchesSearch
      );
    });

    rows.sort((a, b) => {
      if (sortBy === "latest") {
        return (
          getSortableTime(b.submittedDate) - getSortableTime(a.submittedDate)
        );
      }

      if (sortBy === "oldest") {
        return (
          getSortableTime(a.submittedDate) - getSortableTime(b.submittedDate)
        );
      }

      if (sortBy === "amount_high") {
        return b.amount - a.amount;
      }

      if (sortBy === "amount_low") {
        return a.amount - b.amount;
      }

      if (sortBy === "client_az") {
        return String(a.client || "").localeCompare(String(b.client || ""));
      }

      return 0;
    });

    return rows;
  }, [data, approvalFilter, paymentFilter, personFilter, search, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [approvalFilter, paymentFilter, personFilter, search, sortBy, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const overallAmount = useMemo(() => {
    return data.reduce((sum, item) => sum + item.amount, 0);
  }, [data]);

  const pendingApprovalCount = useMemo(() => {
    return data.filter((item) => item.status === "pending").length;
  }, [data]);

  const approvedCount = useMemo(() => {
    return data.filter((item) => item.status === "approved").length;
  }, [data]);

  const paidAmount = useMemo(() => {
    return data
      .filter(
        (item) => String(item.paymentStatus || "").toLowerCase() === "paid",
      )
      .reduce((sum, item) => sum + item.amount, 0);
  }, [data]);

  const filteredAmount = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.amount, 0);
  }, [filteredData]);

  const clearFilters = () => {
    setApprovalFilter("all");
    setPaymentFilter("all");
    setPersonFilter("all");
    setSearch("");
    setSortBy("latest");
    setPage(1);
  };

  const openApprovalDialog = (
    item: Reimbursement,
    status: "approved" | "rejected",
  ) => {
    setSelectedItem(item);
    setApprovalAction(status);
    setApprovalAmount(String(item.approvedAmount ?? item.amount ?? 0));
    setApprovalRemarks(item.approvalRemarks || "");
    setShowApprovalModal(true);
  };

  const submitApprovalDecision = async () => {
    if (!selectedItem || !approvalAction) return;

    const finalAmount = Number(approvalAmount || 0);

    if (finalAmount < 0) {
      alert("Approved amount cannot be negative.");
      return;
    }

    if (!approvalRemarks.trim()) {
      alert("Please enter remarks before saving.");
      return;
    }

    setApprovalSaving(true);

    try {
      const payload: Record<string, any> = {
        "reimbursement.approvalStatus": approvalAction,
        "reimbursement.approvedAmount": finalAmount,
        "reimbursement.approvalRemarks": approvalRemarks.trim(),
        "reimbursement.approvedBy":
          userProfile?.displayName || currentUser?.email || "Unknown",
        "reimbursement.approvedById": currentUser?.uid || "",
        "reimbursement.approvalDecisionAt": serverTimestamp(),
      };

      if (approvalAction === "approved") {
        payload["reimbursement.paymentStatus"] = "pending";
      }

      await updateDoc(getMeetingDocRef(selectedItem), payload);

      setShowApprovalModal(false);
      setSelectedItem(null);
      setApprovalAction(null);
      setApprovalAmount("");
      setApprovalRemarks("");

      await fetchData();
    } catch (error) {
      console.error("Approval update failed:", error);
    } finally {
      setApprovalSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Reimbursement Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review, approve, and release reimbursement claims in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={clearFilters}
            className="gap-2"
            data-testid="button-clear-filters"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>

          <Button
            variant="outline"
            onClick={fetchData}
            className="gap-2"
            data-testid="button-refresh-reimbursements"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Overall Amount"
          value={formatCurrency(overallAmount)}
          subtitle={`${data.length} total claims`}
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard
          title="Pending Approval"
          value={String(pendingApprovalCount)}
          subtitle="Claims awaiting decision"
          icon={<Clock3 className="h-5 w-5" />}
        />
        <StatCard
          title="Approved Claims"
          value={String(approvedCount)}
          subtitle="Approved reimbursements"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          title="Paid Amount"
          value={formatCurrency(paidAmount)}
          subtitle="Released reimbursements"
          icon={<CircleDollarSign className="h-5 w-5" />}
        />
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg border bg-muted/40 p-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Filters</h2>
              <p className="text-xs text-muted-foreground">
                Search faster with person, approval, payment, and sorting
                filters.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Search
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  placeholder="Search by client, project, person, or details"
                  className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="input-search-reimbursements"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Person
              </label>
              <div className="relative">
                <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={personFilter}
                  onChange={(e) => setPersonFilter(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  data-testid="select-person-filter"
                >
                  <option value="all">All persons</option>
                  {uniquePeople.map((person) => (
                    <option key={person} value={person}>
                      {person}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Approval Status
              </label>
              <select
                value={approvalFilter}
                onChange={(e) => setApprovalFilter(e.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                data-testid="select-approval-filter"
              >
                <option value="all">All approval statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Payment / Sort
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  data-testid="select-payment-filter"
                >
                  <option value="all">All payments</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  data-testid="select-sort-filter"
                >
                  <option value="latest">Latest</option>
                  <option value="oldest">Oldest</option>
                  <option value="amount_high">Amount High</option>
                  <option value="amount_low">Amount Low</option>
                  <option value="client_az">Client A-Z</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1 rounded-full">
                <Layers3 className="h-3.5 w-3.5" />
                {filteredData.length} result(s)
              </Badge>
              <Badge variant="outline" className="gap-1 rounded-full">
                <Receipt className="h-3.5 w-3.5" />
                Visible amount: {formatCurrency(filteredAmount)}
              </Badge>
            </div>

            <div className="text-xs">
              Showing filtered claims based on your current filters
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/60 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              Loading reimbursement claims...
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <div className="rounded-2xl border bg-muted/40 p-3">
                <Receipt className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-base font-medium text-foreground">
                No reimbursement claims found
              </h3>
              <p className="max-w-md text-sm text-muted-foreground">
                Try changing your search or filters to see more results.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px] text-sm">
                  <thead className="bg-muted/50">
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Claim
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Person
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Fuel / Date
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Bill
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedData.map((item) => {
                      const paymentStatus = String(
                        item.paymentStatus || "pending",
                      ).toLowerCase();
                      const actionLocked =
                        item.status === "approved" ||
                        item.status === "rejected";
                      const canReleasePayment =
                        item.status === "approved" && paymentStatus !== "paid";

                      return (
                        <tr
                          key={`${item.sourcePath}-${item.recordId}-${item.id}`}
                          className="border-b transition-colors hover:bg-muted/20"
                        >
                          <td className="px-4 py-4 align-top">
                            <div className="space-y-1">
                              <p className="font-medium text-foreground">
                                {item.client}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {item.projectName}
                              </p>
                              <p className="line-clamp-2 max-w-[280px] text-xs text-muted-foreground">
                                {item.details || "No details"}
                              </p>
                            </div>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <div className="space-y-1">
                              <p className="font-medium text-foreground">
                                {item.personName || "Unknown"}
                              </p>
                              {item.approvedBy && (
                                <p className="text-xs text-muted-foreground">
                                  Approved by {item.approvedBy}
                                </p>
                              )}
                              {item.paidBy && paymentStatus === "paid" && (
                                <p className="text-xs text-green-700">
                                  Paid by {item.paidBy}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <div className="space-y-3">
                              <div>
                                <p className="font-semibold text-foreground">
                                  {formatCurrency(item.amount)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Claim amount
                                </p>
                              </div>

                              {(item.status === "approved" ||
                                item.status === "rejected") && (
                                <div>
                                  <p
                                    className={`font-semibold ${
                                      item.status === "rejected"
                                        ? "text-red-700"
                                        : "text-green-700"
                                    }`}
                                  >
                                    {formatCurrency(item.approvedAmount ?? 0)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Approved amount
                                  </p>
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <div className="space-y-1">
                              <p className="text-foreground">
                                {Number(item.fuelClaim || 0)} KM
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(item.submittedDate)}
                              </p>
                            </div>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <div className="flex flex-col items-start gap-2">
                              <Badge
                                variant="outline"
                                className={`rounded-full ${getApprovalBadgeClass(
                                  item.rawStatus || item.status,
                                )}`}
                              >
                                {formatStatusLabel(
                                  item.rawStatus || item.status,
                                )}
                              </Badge>

                              <Badge
                                variant="outline"
                                className={`rounded-full ${getPaymentBadgeClass(
                                  item.paymentStatus,
                                )}`}
                              >
                                {paymentStatus === "paid"
                                  ? "Payment Paid"
                                  : "Payment Pending"}
                              </Badge>
                            </div>
                          </td>

                          <td className="px-4 py-4 align-top">
                            {item.billUrl ? (
                              <a
                                href={item.billUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                              >
                                <Eye className="h-4 w-4" />
                                View Bill
                              </a>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                No Bill
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-4 align-top">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setDetailItem(item);
                                  setShowDetailModal(true);
                                }}
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition hover:bg-muted"
                                data-testid={`button-view-detail-${item.recordId}-${item.id}`}
                              >
                                <Eye className="h-4 w-4" />
                                View Detail
                              </button>

                              <button
                                disabled={actionLocked}
                                onClick={() =>
                                  openApprovalDialog(item, "approved")
                                }
                                className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition ${
                                  actionLocked
                                    ? "cursor-not-allowed bg-muted text-muted-foreground"
                                    : "bg-green-600 text-white hover:bg-green-700"
                                }`}
                                data-testid={`button-approve-${item.recordId}-${item.id}`}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Approve
                              </button>

                              <button
                                disabled={actionLocked}
                                onClick={() =>
                                  openApprovalDialog(item, "rejected")
                                }
                                className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition ${
                                  actionLocked
                                    ? "cursor-not-allowed bg-muted text-muted-foreground"
                                    : "bg-red-600 text-white hover:bg-red-700"
                                }`}
                                data-testid={`button-reject-${item.recordId}-${item.id}`}
                              >
                                <XCircle className="h-4 w-4" />
                                Reject
                              </button>

                              <button
                                disabled={!canReleasePayment}
                                onClick={() => {
                                  setSelectedItem(item);
                                  setShowPaymentModal(true);
                                }}
                                className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition ${
                                  canReleasePayment
                                    ? "bg-blue-600 text-white hover:bg-blue-700"
                                    : "cursor-not-allowed bg-muted text-muted-foreground"
                                }`}
                                data-testid={`button-release-payment-${item.recordId}-${item.id}`}
                              >
                                <Wallet className="h-4 w-4" />
                                {paymentStatus === "paid"
                                  ? "Paid"
                                  : "Release Payment"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t px-4 py-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center">
                  <span>
                    Showing {(page - 1) * pageSize + 1} to{" "}
                    {Math.min(page * pageSize, filteredData.length)} of{" "}
                    {filteredData.length} claim(s)
                  </span>

                  <div className="flex items-center gap-2">
                    <span>Rows</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="h-9 rounded-lg border border-input bg-background px-2 text-sm outline-none"
                      data-testid="select-page-size"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className="gap-1"
                    data-testid="button-pagination-prev"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>

                  <div className="rounded-lg border px-3 py-2 text-sm text-foreground">
                    Page {page} of {totalPages}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() =>
                      setPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    className="gap-1"
                    data-testid="button-pagination-next"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {approvalAction === "approved"
                ? "Approve Reimbursement"
                : "Reject Reimbursement"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">Claimed By</p>
              <p className="font-medium text-foreground">
                {selectedItem?.personName || "Unknown"}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Claim Amount</p>
                  <p className="font-semibold text-foreground">
                    {formatCurrency(selectedItem?.amount || 0)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Project</p>
                  <p className="font-medium text-foreground">
                    {selectedItem?.projectName || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="approvalAmount">Approved Amount</Label>
              <Input
                id="approvalAmount"
                type="number"
                value={approvalAmount}
                onChange={(e) => setApprovalAmount(e.target.value)}
                className="mt-1"
                placeholder="Enter final approved amount"
              />
            </div>

            <div>
              <Label htmlFor="approvalRemarks">Remarks</Label>
              <Textarea
                id="approvalRemarks"
                value={approvalRemarks}
                onChange={(e) => setApprovalRemarks(e.target.value)}
                className="mt-1"
                placeholder={
                  approvalAction === "approved"
                    ? "Enter approval remarks"
                    : "Enter rejection reason"
                }
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowApprovalModal(false)}
                disabled={approvalSaving}
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={submitApprovalDecision}
                disabled={approvalSaving}
                className={
                  approvalAction === "approved"
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-red-600 text-white hover:bg-red-700"
                }
              >
                {approvalSaving
                  ? "Saving..."
                  : approvalAction === "approved"
                    ? "Approve"
                    : "Reject"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reimbursement Detail</DialogTitle>
          </DialogHeader>

          {detailItem && (
            <div className="space-y-4">
              <div className="rounded-xl border bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground">Client</p>
                <p className="font-semibold text-foreground">
                  {detailItem.client}
                </p>

                <p className="mt-2 text-xs text-muted-foreground">Project</p>
                <p className="text-sm text-foreground">
                  {detailItem.projectName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">Claim Amount</p>
                  <p className="font-semibold text-foreground">
                    {formatCurrency(detailItem.amount)}
                  </p>
                </div>

                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">
                    Approved Amount
                  </p>
                  <p className="font-semibold text-green-700">
                    {formatCurrency(detailItem.approvedAmount ?? 0)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">Claimed By</p>
                  <p className="text-sm font-medium text-foreground">
                    {detailItem.personName || "Unknown"}
                  </p>
                </div>

                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">Fuel Claim</p>
                  <p className="text-sm font-medium text-foreground">
                    {Number(detailItem.fuelClaim || 0)} KM
                  </p>
                </div>
              </div>

              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Details</p>
                <p className="mt-1 text-sm text-foreground">
                  {detailItem.details || "No details"}
                </p>
              </div>

              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">
                  Approval Remarks
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {detailItem.approvalRemarks || "No remarks added"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">
                    Approval Status
                  </p>
                  <Badge
                    variant="outline"
                    className={`mt-1 rounded-full ${getApprovalBadgeClass(
                      detailItem.rawStatus || detailItem.status,
                    )}`}
                  >
                    {formatStatusLabel(
                      detailItem.rawStatus || detailItem.status,
                    )}
                  </Badge>
                </div>

                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">
                    Payment Status
                  </p>
                  <Badge
                    variant="outline"
                    className={`mt-1 rounded-full ${getPaymentBadgeClass(
                      detailItem.paymentStatus,
                    )}`}
                  >
                    {String(
                      detailItem.paymentStatus || "pending",
                    ).toLowerCase() === "paid"
                      ? "Payment Paid"
                      : "Payment Pending"}
                  </Badge>
                </div>
              </div>

              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Approved By</p>
                <p className="text-sm text-foreground">
                  {detailItem.approvedBy || "Not approved yet"}
                </p>
              </div>

              {detailItem.billUrl && (
                <a
                  href={detailItem.billUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <Eye className="h-4 w-4" />
                  View Bill
                </a>
              )}

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailModal(false);
                    setDetailItem(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PaymentReleaseModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedItem(null);
        }}
        onSuccess={fetchData}
        title="Release Reimbursement Payment"
        context={selectedItem}
        docPath={(item) =>
          item.sourcePath === "root"
            ? ["salesRecords", item.recordId, "meetingUpdates", item.id]
            : [
                "Panels",
                "IEDGE-SYSTEM",
                "salesRecords",
                item.recordId,
                "meetingUpdates",
                item.id,
              ]
        }
        amount={Number(
          selectedItem?.approvedAmount ?? selectedItem?.amount ?? 0,
        )}
        amountLabel="Approved Amount"
        partyLabel="Claimed By"
        parties={selectedItem?.personName ? [selectedItem.personName] : []}
        initialPaymentMethod="cash"
        buildUpdateData={({
          formData,
          receiptUrl,
          selectedAccount,
          actor,
        }) => ({
          "reimbursement.paymentStatus": "paid",
          "reimbursement.paidBy": actor.displayName || actor.email || "Unknown",
          "reimbursement.paidById": actor.uid || "",
          "reimbursement.paymentType": formData.paymentMethod,
          "reimbursement.paidAmount": Number(formData.amount),
          "reimbursement.transactionReference": formData.transactionReference,
          "reimbursement.paymentNotes": formData.paymentNotes,
          "reimbursement.paymentReceiptUrl": receiptUrl,
          "reimbursement.paymentReleasedAt": serverTimestamp(),
          ...(formData.chequeNumber
            ? { "reimbursement.chequeNumber": formData.chequeNumber }
            : {}),
          ...(selectedAccount
            ? { "reimbursement.selectedAccount": selectedAccount }
            : {}),
        })}
      />
    </div>
  );
}
