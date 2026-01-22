import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import InvoiceRequestModal from "@/components/InvoiceRequestModal";
import { InvoiceRequest } from "@shared/schema";

interface DashboardStats {
  pending: number;
  approved: number;
  totalAmount: number;
  avgProcessing: string;
}

interface RecentActivity {
  id: string;
  description: string;
  timestamp: string;
  status: string;
}

export default function Dashboard() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    pending: 0,
    approved: 0,
    totalAmount: 0,
    avgProcessing: "0 days"
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      
      // Load invoices for stats
      const invoicesQuery = query(collection(db, "invoiceRequests"));
      const invoicesSnapshot = await getDocs(invoicesQuery);
      
      let pendingCount = 0;
      let approvedCount = 0;
      let totalAmount = 0;
      
      invoicesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === "approved" || data.status === "payment_released") {
          approvedCount++;
        } else {
          pendingCount++;
        }
        totalAmount += data.amount;
      });

      setStats({
        pending: pendingCount,
        approved: approvedCount,
        totalAmount,
        avgProcessing: "2.4 days" // This would be calculated based on actual data
      });

      // Load recent activity
      const recentQuery = query(
        collection(db, "invoiceRequests"),
        orderBy("submittedAt", "desc"),
        limit(5)
      );
      const recentSnapshot = await getDocs(recentQuery);
      
      const activities: RecentActivity[] = [];
      recentSnapshot.forEach((doc) => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          description: `Invoice #${data.invoiceNumber} ${getStatusDescription(data.status)}`,
          timestamp: formatTimestamp(data.submittedAt?.toDate()),
          status: data.status
        });
      });
      
      setRecentActivity(activities);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusDescription(status: string): string {
    switch (status) {
      case "pending_operational_admin": return "awaiting operational admin review";
      case "pending_main_admin": return "awaiting main admin approval"; 
      case "pending_finance": return "awaiting finance approval";
      case "approved": return "approved";
      case "payment_released": return "payment released";
      case "rejected": return "rejected";
      default: return "submitted";
    }
  }

  function formatTimestamp(date: Date): string {
    if (!date) return "Unknown";
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60); // minutes
    
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff} minutes ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`;
    return `${Math.floor(diff / 1440)} days ago`;
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case "approved":
      case "payment_released":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending_operational_admin":
      case "pending_main_admin":  
      case "pending_finance":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  }

  const canCreateInvoices = userProfile?.role === "operation";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Dashboard Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2" data-testid="text-dashboard-title">Dashboard</h2>
        <p className="text-muted-foreground">Welcome back! Here's what's happening with your invoices.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
                <p className="text-3xl font-bold text-foreground" data-testid="text-pending-count">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-clock text-primary text-xl"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600">+8%</span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved Today</p>
                <p className="text-3xl font-bold text-foreground" data-testid="text-approved-count">{stats.approved}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-check-circle text-green-600 text-xl"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600">+12%</span>
              <span className="text-muted-foreground ml-1">from yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-3xl font-bold text-foreground" data-testid="text-total-amount">
                  Rs {stats.totalAmount.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-rupee-sign text-blue-600 text-xl"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600">+5%</span>
              <span className="text-muted-foreground ml-1">from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Processing Time</p>
                <p className="text-3xl font-bold text-foreground" data-testid="text-processing-time">{stats.avgProcessing}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-stopwatch text-purple-600 text-xl"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-red-600">-0.2</span>
              <span className="text-muted-foreground ml-1">days improved</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* New Invoice Request */}
        {canCreateInvoices && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">New Invoice Request</h3>
              <Button
                onClick={() => setIsInvoiceModalOpen(true)}
                className="w-full"
                data-testid="button-create-invoice"
              >
                <i className="fas fa-plus mr-2"></i>
                Create Request
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card className={canCreateInvoices ? "lg:col-span-2" : "lg:col-span-3"}>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No recent activity</p>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-3 bg-muted rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(activity.status)}`}>
                      {activity.status.replace('_', ' ').replace('pending ', '')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Request Modal */}
      {canCreateInvoices && (
        <InvoiceRequestModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          onSuccess={() => {
            setIsInvoiceModalOpen(false);
            loadDashboardData();
          }}
        />
      )}
    </div>
  );
}
