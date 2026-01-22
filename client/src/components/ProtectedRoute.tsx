import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@shared/schema";
import { Redirect } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireApproval?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles, 
  requireApproval = true 
}: ProtectedRouteProps) {
  const { currentUser, userProfile } = useAuth();

  if (!currentUser) {
    return <Redirect to="/login" />;
  }

  if (!userProfile) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>;
  }

  // Temporarily bypass approval check for main admins
  if (requireApproval && userProfile.accountStatus !== "approved" && userProfile.role !== "main_admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-card p-8 rounded-xl border border-border shadow-sm max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-clock text-yellow-600 text-2xl"></i>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Account Pending Approval</h2>
            <p className="text-muted-foreground mb-4">
              Your account is currently pending approval by the main administrator. 
              You will be notified once your account is approved.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Refresh Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-card p-8 rounded-xl border border-border shadow-sm max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
