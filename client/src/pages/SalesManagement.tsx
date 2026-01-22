import { useState, useEffect } from "react";
import { SalesRecordModal } from "@/components/SalesRecordModal";
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

export function SalesManagement() {
  const { userProfile } = useAuth();
  const [allRecords, setAllRecords] = useState<SalesRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [salesPersonFilter, setSalesPersonFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [viewDetailModalOpen, setViewDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SalesRecord | null>(
    null,
  );

  // useEffect(() => {
  //   if (!userProfile) return;

  //   const allowedRoles = ["main_admin", "operational_admin", "financial_admin"];
  //   if (!allowedRoles.includes(userProfile.role)) return;

  //   const q = query(
  //     collection(db, "salesRecords"),
  //     orderBy("updatedAt", "desc"),
  //   );

  //   const unsubscribe = onSnapshot(q, (snapshot) => {
  //     const recordsData = snapshot.docs.map((doc) => ({
  //       id: doc.id,
  //       ...doc.data(),
  //       createdAt: doc.data().createdAt?.toDate(),
  //       updatedAt: doc.data().updatedAt?.toDate(),
  //     })) as SalesRecord[];

  //     setAllRecords(recordsData);
  //     setLoading(false);
  //   });

  //   return () => unsubscribe();
  // }, [userProfile]);

  useEffect(() => {
  if (!userProfile) return;

  const allowedRoles = ["main_admin", "operational_admin", "financial_admin"];
  if (!allowedRoles.includes(userProfile.role)) return;

  const q = query(
    collection(db, "Panels", "IEDGE-SYSTEM", "salesRecords"),
    orderBy("updatedAt", "desc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const recordsData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as SalesRecord[];

    setAllRecords(recordsData);
    setLoading(false);
  });

  return () => unsubscribe();
}, [userProfile]);


  const getStatusColor = (status: string) => {
    switch (status) {
      case "Lead":
        return "bg-blue-100 text-blue-800";
      case "Discussion":
        return "bg-yellow-100 text-yellow-800";
      case "Negotiation":
        return "bg-orange-100 text-orange-800";
      case "Won":
        return "bg-green-100 text-green-800";
      case "Lost":
        return "bg-red-100 text-red-800";
      case "Invoiced":
        return "bg-purple-100 text-purple-800";
      case "Payment Received":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const uniqueSalesPersons = Array.from(
    new Set(allRecords.map((record) => record.salesPersonName)),
  );

  const filteredRecords = allRecords.filter((record) => {
    const matchesSearch =
      record.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.projectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.salesPersonName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || record.projectStatus === statusFilter;
    const matchesSalesPerson =
      salesPersonFilter === "All" ||
      record.salesPersonName === salesPersonFilter;
    return matchesSearch && matchesStatus && matchesSalesPerson;
  });

  const totalRecords = allRecords.length;
  const totalValue = allRecords.reduce(
    (sum, record) => sum + (Number(record.projectedValue) || 0),
    0,
  );
  const wonValue = allRecords
    .filter((r) => r.projectStatus === "Won")
    .reduce((sum, record) => sum + record.projectedValue, 0);
  const wonCount = allRecords.filter((r) => r.projectStatus === "Won").length;

  const allowedRoles = ["main_admin", "operational_admin", "financial_admin"];
  if (!userProfile || !allowedRoles.includes(userProfile.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <i className="fas fa-lock text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-500">
            Access denied. Only admins can view sales management.
          </p>
        </div>
      </div>
    );
  }

  const handleViewDetails = (record: SalesRecord) => {
    setSelectedRecord(record);
    setViewDetailModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-500">Loading sales records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Sales Management</h1>
        <p className="text-muted-foreground">
          View and manage sales records from all sales team members
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Records
                </p>
                <p
                  className="text-3xl font-bold text-foreground"
                  data-testid="text-total-sales-records"
                >
                  {totalRecords}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-chart-line text-blue-600 text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Value
                </p>
                <p
                  className="text-3xl font-bold text-foreground"
                  data-testid="text-total-sales-value"
                >
                  Rs {totalValue.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-rupee-sign text-green-600 text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Won Projects
                </p>
                <p
                  className="text-3xl font-bold text-foreground"
                  data-testid="text-won-sales-count"
                >
                  {wonCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-trophy text-emerald-600 text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Won Value
                </p>
                <p
                  className="text-3xl font-bold text-foreground"
                  data-testid="text-won-sales-value"
                >
                  Rs {wonValue.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-award text-purple-600 text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by client, project, or sales person..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-sales"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter-sales">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Lead">Lead</SelectItem>
                  <SelectItem value="Discussion">Discussion</SelectItem>
                  <SelectItem value="Negotiation">Negotiation</SelectItem>
                  <SelectItem value="Won">Won</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                  <SelectItem value="Invoiced">Invoiced</SelectItem>
                  <SelectItem value="Payment Received">
                    Payment Received
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={salesPersonFilter}
                onValueChange={setSalesPersonFilter}
              >
                <SelectTrigger data-testid="select-salesperson-filter">
                  <SelectValue placeholder="All Sales Persons" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Sales Persons</SelectItem>
                  {uniqueSalesPersons.map((person) => (
                    <SelectItem key={person} value={person}>
                      {person}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Sales Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                    Sales Person
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                    Project
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                    Value
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                    Updated
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-muted-foreground"
                    >
                      {allRecords.length === 0
                        ? "No sales records available."
                        : "No records match your search criteria."}
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p
                            className="text-sm font-medium text-foreground"
                            data-testid={`text-sales-person-${record.id}`}
                          >
                            {record.salesPersonName}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p
                            className="text-sm font-medium text-foreground"
                            data-testid={`text-client-admin-${record.id}`}
                          >
                            {record.client}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {record.contactPerson}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {record.projectName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {record.projectCode}
                          </p>
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-foreground"
                        data-testid={`text-value-admin-${record.id}`}
                      >
                        Rs{" "}
                        {record.projectedValue !== undefined
                          ? record.projectedValue.toLocaleString()
                          : "0"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={getStatusColor(record.projectStatus)}>
                          {record.projectStatus}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        <span className="text-foreground">
                          {" "}
                          {record.updatedAt?.toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>{" "}
                        <br />
                        {record.updatedAt?.toLocaleString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <Button onClick={() => handleViewDetails(record)}>
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {selectedRecord && (
              <ViewDetailModal
                isOpen={viewDetailModalOpen}
                onClose={() => setViewDetailModalOpen(false)}
                record={selectedRecord}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
