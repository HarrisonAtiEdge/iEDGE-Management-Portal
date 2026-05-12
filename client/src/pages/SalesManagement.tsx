import { useState, useEffect, useMemo } from "react";
import { ViewDetailModal } from "@/components/ViewDetailModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { SalesRecord } from "@shared/schema";

const STATUS_OPTIONS = [
  "Lead",
  "Discussion",
  "Negotiation",
  "Won",
  "Lost",
  "Invoiced",
  "Payment Received",
] as const;

const PAGE_SIZE = 6;

const ALLOWED_ROLES = ["main_admin", "operational_admin", "financial_admin"];

export function SalesManagement() {
  const { userProfile } = useAuth();

  const [allRecords, setAllRecords] = useState<SalesRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [projectOwnerFilter, setProjectOwnerFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewDetailModalOpen, setViewDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SalesRecord | null>(
    null,
  );

  useEffect(() => {
    if (!userProfile) return;
    if (!ALLOWED_ROLES.includes(userProfile.role)) return;

    const q = query(
      collection(db, "Panels", "IEDGE-SYSTEM", "salesRecords"),
      orderBy("updatedAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const recordsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.(),
          updatedAt: doc.data().updatedAt?.toDate?.(),
        })) as SalesRecord[];

        setAllRecords(recordsData);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to fetch sales records:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [userProfile]);

  const formatCurrency = (value?: number | string) => {
    return `₨ ${(Number(value) || 0).toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Lead":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "Discussion":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Negotiation":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "Won":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Lost":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Invoiced":
        return "bg-violet-50 text-violet-700 border-violet-200";
      case "Payment Received":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const uniqueProjectOwners = useMemo(() => {
    return Array.from(
      new Set(
        allRecords
          .map((record) => record.salesPersonName)
          .filter((name): name is string => !!name),
      ),
    );
  }, [allRecords]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: allRecords.length,
    };

    STATUS_OPTIONS.forEach((status) => {
      counts[status] = allRecords.filter(
        (record) => record.projectStatus === status,
      ).length;
    });

    return counts;
  }, [allRecords]);

  const filteredRecords = useMemo(() => {
    return allRecords.filter((record) => {
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        (record.client || "").toLowerCase().includes(search) ||
        (record.projectName || "").toLowerCase().includes(search) ||
        (record.projectCode || "").toLowerCase().includes(search) ||
        (record.salesPersonName || "").toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" || record.projectStatus === statusFilter;

      const matchesProjectOwner =
        projectOwnerFilter === "All" ||
        record.salesPersonName === projectOwnerFilter;

      return matchesSearch && matchesStatus && matchesProjectOwner;
    });
  }, [allRecords, searchTerm, statusFilter, projectOwnerFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, projectOwnerFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));

  const paginationItems = useMemo(() => {
    const pages: (number | string)[] = [];

    if (totalPages <= 5) {
      for (let page = 1; page <= totalPages; page++) {
        pages.push(page);
      }
      return pages;
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push("left-ellipsis");
    }

    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let page = startPage; page <= endPage; page++) {
      pages.push(page);
    }

    if (currentPage < totalPages - 2) {
      pages.push("right-ellipsis");
    }

    pages.push(totalPages);

    return pages;
  }, [currentPage, totalPages]);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredRecords.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredRecords, currentPage]);

  const showingStart =
    filteredRecords.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;

  const showingEnd = Math.min(currentPage * PAGE_SIZE, filteredRecords.length);

  const totalRecords = allRecords.length;

  const totalValue = allRecords.reduce(
    (sum, record) => sum + (Number(record.projectedValue) || 0),
    0,
  );

  const wonRecords = allRecords.filter(
    (record) => record.projectStatus === "Won",
  );

  const wonCount = wonRecords.length;

  const wonValue = wonRecords.reduce(
    (sum, record) => sum + (Number(record.projectedValue) || 0),
    0,
  );

  const handleViewDetails = (record: SalesRecord) => {
    setSelectedRecord(record);
    setViewDetailModalOpen(true);
  };

  if (!userProfile || !ALLOWED_ROLES.includes(userProfile.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <i className="fas fa-lock mb-4 text-4xl text-gray-400"></i>
          <p className="text-gray-500">
            Access denied. Only admins can view sales management.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin mb-4 text-4xl text-gray-400"></i>
          <p className="text-gray-500">Loading sales records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Pipeline Management
        </h1>
        <p className="text-sm text-slate-500">
          View and manage all sales records across the team.
        </p>
      </div>

      {/* Top Filter Pills Bar */}
      <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter("All")}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                statusFilter === "All"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>All</span>
              <span
                className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-xs ${
                  statusFilter === "All"
                    ? "bg-white/20 text-white"
                    : "bg-white text-slate-500"
                }`}
              >
                {statusCounts.All}
              </span>
            </button>

            {STATUS_OPTIONS.map((status) => {
              const active = statusFilter === status;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    active
                      ? "bg-orange-500 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span>{status}</span>
                  <span
                    className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-xs ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-white text-slate-500"
                    }`}
                  >
                    {statusCounts[status]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 xl:min-w-[280px]">
            <div className="hidden h-8 w-px bg-slate-200 xl:block" />

            <Select
              value={projectOwnerFilter}
              onValueChange={setProjectOwnerFilter}
            >
              <SelectTrigger
                data-testid="select-salesperson-filter"
                className="h-11 rounded-full border-slate-200 bg-slate-50 text-slate-700 shadow-none xl:min-w-[220px]"
              >
                <SelectValue placeholder="All Project Owners" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="All">All Project Owners</SelectItem>
                {uniqueProjectOwners.map((person) => (
                  <SelectItem key={person} value={person}>
                    {person}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Search Row */}
      <Card className="rounded-[24px] border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
              <Input
                placeholder="Search by client, project, code, or project owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-sales"
                className="h-11 rounded-full border-slate-200 bg-slate-50 pl-10 shadow-none"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("All");
                setProjectOwnerFilter("All");
              }}
              className="h-11 rounded-full border-slate-200 px-5 text-slate-700"
            >
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <CardContent className="p-0">
            <div className="h-1 w-full bg-sky-500" />
            <div className="p-5">
              <div className="mb-4 flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">
                    Total Records
                  </p>
                  <p
                    className="text-3xl font-bold tracking-tight text-slate-900"
                    data-testid="text-total-sales-records"
                  >
                    {totalRecords}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50">
                  <i className="fas fa-layer-group text-lg text-sky-600" />
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Total number of sales records available
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <CardContent className="p-0">
            <div className="h-1 w-full bg-emerald-500" />
            <div className="p-5">
              <div className="mb-4 flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">
                    Total Value
                  </p>
                  <p
                    className="text-3xl font-bold tracking-tight text-slate-900"
                    data-testid="text-total-sales-value"
                  >
                    {formatCurrency(totalValue)}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
                  <i className="fas fa-wallet text-lg text-emerald-600" />
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Combined projected value of all projects
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <CardContent className="p-0">
            <div className="h-1 w-full bg-amber-500" />
            <div className="p-5">
              <div className="mb-4 flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">
                    Won Projects
                  </p>
                  <p
                    className="text-3xl font-bold tracking-tight text-slate-900"
                    data-testid="text-won-sales-count"
                  >
                    {wonCount}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50">
                  <i className="fas fa-trophy text-lg text-amber-600" />
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Projects currently marked as won
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <CardContent className="p-0">
            <div className="h-1 w-full bg-violet-500" />
            <div className="p-5">
              <div className="mb-4 flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">
                    Won Value
                  </p>
                  <p
                    className="text-3xl font-bold tracking-tight text-slate-900"
                    data-testid="text-won-sales-value"
                  >
                    {formatCurrency(wonValue)}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50">
                  <i className="fas fa-award text-lg text-violet-600" />
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Total value of all won projects
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Sales Records - Card View */}
      <Card className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-white px-5 py-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">
                All Sales Records
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                View project details, owner, value, status, and latest update.
              </p>
            </div>

            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
              Showing{" "}
              <span className="font-bold text-slate-900">{showingStart}</span>{" "}
              to <span className="font-bold text-slate-900">{showingEnd}</span>{" "}
              of{" "}
              <span className="font-bold text-slate-900">
                {filteredRecords.length}
              </span>{" "}
              record(s)
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5">
          {filteredRecords.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                <i className="fas fa-folder-open text-xl text-slate-400" />
              </div>

              <h3 className="text-lg font-semibold text-slate-900">
                No records found
              </h3>

              <p className="mt-1 max-w-sm text-sm text-slate-500">
                {allRecords.length === 0
                  ? "No sales records are available yet."
                  : "No records match your current filters."}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {paginatedRecords.map((record) => {
                  const ownerInitial =
                    record.salesPersonName?.charAt(0)?.toUpperCase() || "U";

                  return (
                    <Card
                      key={record.id}
                      className="group rounded-[24px] border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
                              {ownerInitial}
                            </div>

                            <div className="min-w-0">
                              <p
                                className="truncate text-sm font-semibold text-slate-900"
                                data-testid={`text-sales-person-${record.id}`}
                              >
                                {record.salesPersonName || "N/A"}
                              </p>
                              <p className="text-xs text-slate-500">
                                Project Owner
                              </p>
                            </div>
                          </div>

                          <Badge
                            className={`rounded-full border px-3 py-1 text-xs font-medium shadow-none ${getStatusColor(
                              record.projectStatus || "",
                            )}`}
                          >
                            {record.projectStatus || "N/A"}
                          </Badge>
                        </div>

                        <div className="mt-5">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Project
                          </p>

                          <h3 className="mt-1 line-clamp-2 text-lg font-bold leading-snug text-slate-900">
                            {record.projectName || "Untitled Project"}
                          </h3>

                          <div className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            {record.projectCode || "No Project Code"}
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                          <div className="rounded-2xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-400">Client</p>
                            <p
                              className="mt-1 truncate text-sm font-semibold text-slate-900"
                              data-testid={`text-client-admin-${record.id}`}
                            >
                              {record.client || "N/A"}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-400">Value</p>
                            <p
                              className="mt-1 truncate text-sm font-semibold text-slate-900"
                              data-testid={`text-value-admin-${record.id}`}
                            >
                              {formatCurrency(
                                Number(record.projectedValue) || 0,
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2 rounded-2xl border border-slate-100 bg-white p-3">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <i className="fas fa-user text-xs text-slate-400" />
                            <span className="truncate">
                              {record.contactPerson || "No contact person"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <i className="fas fa-clock text-xs text-slate-400" />
                            <span>
                              {record.updatedAt?.toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }) || "N/A"}

                              {record.updatedAt
                                ? `, ${record.updatedAt.toLocaleString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}`
                                : ""}
                            </span>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleViewDetails(record)}
                          className="mt-5 h-11 w-full rounded-full bg-slate-900 text-white shadow-none transition-all hover:bg-slate-800"
                        >
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="mt-6 flex flex-col gap-4 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-600">
                  Showing{" "}
                  <span className="font-semibold text-slate-900">
                    {showingStart}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-slate-900">
                    {showingEnd}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-900">
                    {filteredRecords.length}
                  </span>{" "}
                  records
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((page) => Math.max(page - 1, 1))
                    }
                    className="h-10 rounded-full border-slate-200 bg-white px-4 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {paginationItems.map((item) => {
                      if (typeof item === "string") {
                        return (
                          <span
                            key={item}
                            className="flex h-10 min-w-10 items-center justify-center rounded-full px-2 text-sm font-semibold text-slate-400"
                          >
                            ...
                          </span>
                        );
                      }

                      const active = currentPage === item;

                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setCurrentPage(item)}
                          className={`flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition-all ${
                            active
                              ? "bg-orange-500 text-white shadow-sm"
                              : "bg-white text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((page) => Math.min(page + 1, totalPages))
                    }
                    className="h-10 rounded-full border-slate-200 bg-white px-4 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}

          {selectedRecord && (
            <ViewDetailModal
              isOpen={viewDetailModalOpen}
              onClose={() => setViewDetailModalOpen(false)}
              record={selectedRecord}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
