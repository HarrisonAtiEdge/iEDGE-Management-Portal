

import { Switch, Route, Redirect, useLocation } from "wouter";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Estimates from "./pages/Estimate";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import InvoiceRequests from "@/pages/InvoiceRequests";
import ExpenseSheets from "@/pages/ExpenseSheets";
import Records from "@/pages/Records";
import UserManagement from "@/pages/UserManagement";
import ChequeAccounts from "@/pages/ChequeAccounts";
import OnlineAccounts from "@/pages/OnlineAccounts";
import AddAccount from "@/pages/AddAccount";
import { Sales } from "@/pages/Sales";
import { SalesManagement } from "@/pages/SalesManagement";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Clients } from "@/pages/Clients";
import Settings from "@/pages/Settings";
import SalesDashboard from "./components/SalesDashboard";
import {
  TravelHome,
  TravelHotel,
  TravelTransport,
  TravelTicketing,
  TravelEvents,
  TravelLtdLsp,
} from "@/pages/Travel";
import UserTravel from "./pages/UserTravel";
import HotelSettings from "./pages/Travel/HotelSettings";

function AuthenticatedApp() {
  const { currentUser } = useAuth();
  const [location, setLocation] = useLocation();

  if (!currentUser && location !== "/login") {
    setLocation("/login");
  }

  if (!currentUser) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/">
          <Redirect to="/login" />
        </Route>
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/login">
          <Redirect to="/dashboard" />
        </Route>

        {/* No more allowedRoles */}
        <Route path="/dashboard">
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </Route>

        <Route path="/invoices">
          <ProtectedRoute>
            <InvoiceRequests />
          </ProtectedRoute>
        </Route>

        <Route path="/expenses">
          <ProtectedRoute>
            <ExpenseSheets />
          </ProtectedRoute>
        </Route>

        <Route path="/sales">
          <ProtectedRoute>
            <Sales />
          </ProtectedRoute>
        </Route>

        <Route path="/sales-dashboard">
          <ProtectedRoute>
            <SalesDashboard />
          </ProtectedRoute>
        </Route>

        <Route path="/records">
          <ProtectedRoute>
            <Records />
          </ProtectedRoute>
        </Route>

        <Route path="/users">
          <ProtectedRoute>
            <UserManagement />
          </ProtectedRoute>
        </Route>

        <Route path="/estimate">
          <ProtectedRoute>
            <Estimates />
          </ProtectedRoute>
        </Route>

        <Route path="/settings">
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        </Route>

        <Route path="/sales-management">
          <ProtectedRoute>
            <SalesManagement />
          </ProtectedRoute>
        </Route>

        <Route path="/accounts/cheque">
          <ProtectedRoute>
            <ChequeAccounts />
          </ProtectedRoute>
        </Route>

        <Route path="/accounts/online">
          <ProtectedRoute>
            <OnlineAccounts />
          </ProtectedRoute>
        </Route>

        <Route path="/accounts/add-new">
          <ProtectedRoute>
            <AddAccount />
          </ProtectedRoute>
        </Route>

        <Route path="/clients">
          <ProtectedRoute>
            <Clients />
          </ProtectedRoute>
        </Route>

        <Route path="/">
          <Redirect to="/dashboard" />
        </Route>


        <Route path="/travel">
          <ProtectedRoute>
            <TravelHome />
          </ProtectedRoute>
        </Route>

        <Route path="/travel/hotel">
          <ProtectedRoute>
            <TravelHotel />
          </ProtectedRoute>
        </Route>
        <Route path="/travel/HotelSettings">
          <ProtectedRoute>
            <HotelSettings/>
          </ProtectedRoute>
        </Route>


        <Route path="/usertravel">

          <UserTravel />

        </Route>

        <Route path="/travel/transport">
          <ProtectedRoute>
            <TravelTransport />
          </ProtectedRoute>
        </Route>

        <Route path="/travel/ticketing">
          <ProtectedRoute>
            <TravelTicketing />
          </ProtectedRoute>
        </Route>

        <Route path="/travel/events">
          <ProtectedRoute>
            <TravelEvents />
          </ProtectedRoute>
        </Route>

        <Route path="/travel/ltd-lsp">
          <ProtectedRoute>
            <TravelLtdLsp />
          </ProtectedRoute>
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <AuthenticatedApp />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
