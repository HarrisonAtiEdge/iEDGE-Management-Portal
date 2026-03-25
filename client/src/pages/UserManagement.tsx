"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { secondaryAuth } from "@/lib/firebase";

import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  LogOut,
  User,
  LayoutDashboard,
  LineChart,
  BarChart3,
  UserRound,
  Archive,
  Globe,
  Receipt,
  Users,
  PieChart,
  Settings,
  Hotel,
  FileText,
  Scroll,
  ScrollText,
  BedDouble,
  PlaneTakeoff,
  CreditCard,
  HandCoins,
} from "lucide-react";

// --------------------
// Sidebar / Static Tabs
// --------------------
const AVAILABLE_TABS = [
  { path: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { path: "/sales-dashboard", label: "Sales Dashboard", icon: "LineChart" },
  { path: "/sales", label: "Sales", icon: "BarChart3" },
  { path: "/clients", label: "Clients", icon: "Users" },
  { path: "/records", label: "Records", icon: "Archive" },
  { path: "/online-accounts", label: "Online Accounts", icon: "CreditCard" },
  { path: "/expenses", label: "Expense Sheets", icon: "Receipt" },
  { path: "/invoices", label: "Budget Request", icon: "HandCoins" },
  { path: "/finance", label: "Finance", icon: "Receipt" },
  { path: "/operation", label: "Operation", icon: "Settings" },
  { path: "/estimate", label: "Estimates", icon: "Scroll" },
  { path: "/sales-management", label: "Sales Management", icon: "PieChart" },
  { path: "/travel/hotel", label: "Travel", icon: "PlaneTakeoff" },
  { path: "/invoice-estimate", label: "Invoice Estimates", icon: "ScrollText" },
  { path: "/usertravel", label: "Book Hotel", icon: "BedDouble" },
  { path: "/booking", label: "Bookings", icon: "Hotel" },
  { path: "/accounts", label: "Account ledger", icon: "WalletCards" },
];

const PANEL_ID = "IEDGE-SYSTEM";

// --------------------
// Types
// --------------------
interface Role {
  id: string;
  name: string;
  description?: string;
  users?: number;
  items: { path: string; label: string; icon?: string }[] | string[];
  usersList?: User[];
}

interface User {
  id: string;
  displayName?: string;
  email?: string;
  role?: string;
  accountStatus?: string;
  isActive?: boolean;
  createdAt?: any;

  // new fields
  mobileCountryCode?: string; // e.g. +92
  mobileNo?: string; // e.g. 3001234567
  region?: string; // e.g. Karachi
  reportingTo?: string; // e.g. Manager name / UID / email
  financialLimit?: number; // e.g. 500000
  designation?: string; // e.g. Sales Exec
  department?: string; // e.g. Sales
}

// --------------------
// Component
// --------------------
export default function UserManagement() {
  const { userProfile } = useAuth();
  const { toast } = useToast();

  // base roles from Firestore
  const [roles, setRoles] = useState<Role[]>([]);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedTabs, setSelectedTabs] = useState<string[]>([]);

  // users
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);

  // create user
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newUser, setNewUser] = useState({
    displayName: "",
    email: "",
    password: "",
    role: "",
    mobileCountryCode: "+92",
    mobileNo: "",
    region: "",
    reportingTo: "",
    financialLimit: "", // keep as string for input; convert to number on save
    designation: "",
    department: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  // create role
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", description: "" });

  // Delete role & user selection
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(false);
  const [userIdToConfirmDelete, setUserIdToConfirmDelete] = useState<
    string | null
  >(null);

  // View details modal
  const [viewUser, setViewUser] = useState<User | null>(null);

  // --------------------
  // Helpers / Auth
  // --------------------
  async function toggleUserStatus(user: User) {
    try {
      await updateDoc(doc(db, "Panels", PANEL_ID, "users", user.id), {
        isActive: !user.isActive,
        updatedAt: new Date(),
      });

      toast({
        title: "Status Updated",
        description: `${user.displayName} is now ${!user.isActive ? "Active" : "Inactive"}.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  }

  // --------------------
  // Load roles from Firestore (dynamic)
  // --------------------
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "Panels", PANEL_ID, "sidebarConfig"),
      (snap) => {
        const list: Role[] = snap.docs.map((d) => {
          const data = d.data() as any;

          let items: any[] = data.items ?? [];
          if (items && items.length > 0 && typeof items[0] === "object") {
            items = items.map((it: any) => it.path ?? it);
          }

          return {
            id: d.id,
            name: data.name ?? data.id,
            description: data.description ?? "",
            users: data.users ?? 0,
            items,
          } as Role;
        });

        setRoles(list);
      },
    );

    return () => unsub();
  }, []);

  // --------------------
  // Load users (pending & active) from PANEL path
  // --------------------
  useEffect(() => {
    const usersRef = collection(db, "Panels", PANEL_ID, "users");

    const pendingQ = query(usersRef, where("accountStatus", "==", "pending"));
    const activeQ = query(usersRef, where("accountStatus", "==", "approved"));

    const unsubPending = onSnapshot(pendingQ, (snap) => {
      setPendingUsers(
        snap.docs.map((d) => ({
          ...(d.data() as User),
          id: d.id,
        })),
      );
    });

    const unsubActive = onSnapshot(activeQ, (snap) => {
      setActiveUsers(
        snap.docs.map((d) => ({
          ...(d.data() as User),
          isActive: (d.data() as any)?.isActive ?? true,
          id: d.id,
        })),
      );
    });

    return () => {
      unsubPending();
      unsubActive();
    };
  }, []);

  // --------------------
  // Compute displayRoles (attach users list + count)
  // --------------------
  const displayRoles = useMemo(() => {
    return roles.map((role) => {
      const usersInRole = activeUsers.filter((u) => {
        if (!u.role) return false;
        return u.role === role.id || u.role === role.name;
      });

      return {
        ...role,
        users: usersInRole.length,
        usersList: usersInRole,
      } as Role;
    });
  }, [roles, activeUsers]);

  // --------------------
  // Approve / Reject user
  // --------------------
  async function handleApproveUser(user: User) {
    try {
      await updateDoc(doc(db, "Panels", PANEL_ID, "users", user.id), {
        accountStatus: "approved",
        updatedAt: new Date(),
      });
      toast({
        title: "Success",
        description: `User ${user.displayName} has been approved`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve user",
        variant: "destructive",
      });
    }
  }

  async function handleRejectUser(user: User) {
    try {
      await updateDoc(doc(db, "Panels", PANEL_ID, "users", user.id), {
        accountStatus: "rejected",
        updatedAt: new Date(),
      });
      toast({
        title: "Success",
        description: `User ${user.displayName} has been rejected`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject user",
        variant: "destructive",
      });
    }
  }

  function handleDeleteUserClick(userId: string) {
    setUserIdToConfirmDelete(userId);
    setConfirmDeleteUser(true);
  }

  async function confirmDeleteUserNow() {
    if (!userIdToConfirmDelete) return;

    try {
      await deleteDoc(
        doc(db, "Panels", PANEL_ID, "users", userIdToConfirmDelete),
      );

      toast({
        title: "User Deleted",
        description: "The selected user has been removed.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }

    setConfirmDeleteUser(false);
    setUserIdToConfirmDelete(null);
  }

  async function deleteRoleDocOnly(roleId: string) {
    try {
      await deleteDoc(doc(db, "Panels", PANEL_ID, "sidebarConfig", roleId));
      toast({
        title: "Role deleted",
        description: "Role removed successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  }

  // --------------------
  // Create user (admin) -> save under Panels/PANEL_ID/users/{uid}
  // --------------------
  const handleCreateUser = async () => {
    if (
      !newUser.displayName ||
      !newUser.email ||
      !newUser.password ||
      !newUser.role ||
      !newUser.mobileCountryCode ||
      !newUser.mobileNo ||
      !newUser.region ||
      !newUser.designation ||
      !newUser.department
    ) {
      toast({
        title: "Missing fields",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    const financialLimitNumber =
      newUser.financialLimit?.trim() === ""
        ? 0
        : Number(newUser.financialLimit);

    if (Number.isNaN(financialLimitNumber)) {
      toast({
        title: "Invalid financial limit",
        description: "Financial limit must be a number",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);

    try {
      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        newUser.email.trim(),
        newUser.password,
      );

      await updateProfile(cred.user, { displayName: newUser.displayName });

      // IMPORTANT: do NOT store password in Firestore
      await setDoc(doc(db, "Panels", PANEL_ID, "users", cred.user.uid), {
        displayName: newUser.displayName,
        email: newUser.email.trim(),
        role: newUser.role,
        accountStatus: "approved",
        isActive: true,
        createdAt: new Date(),

        mobileCountryCode: newUser.mobileCountryCode.trim(),
        mobileNo: newUser.mobileNo.trim(),
        region: newUser.region.trim(),
        reportingTo: newUser.reportingTo.trim(),
        financialLimit: financialLimitNumber,
        designation: newUser.designation.trim(),
        department: newUser.department.trim(),
      });

      toast({
        title: "User Created",
        description: `${newUser.displayName} created successfully.`,
      });

      setShowCreateUser(false);
      setShowPassword(false);
      setNewUser({
        displayName: "",
        email: "",
        password: "",
        role: "",
        mobileCountryCode: "+92",
        mobileNo: "",
        region: "",
        reportingTo: "",
        financialLimit: "",
        designation: "",
        department: "",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  // --------------------
  // Create Role (dynamic)
  // --------------------
  async function handleCreateRole() {
    if (!newRole.name.trim()) {
      toast({ title: "Role name required", variant: "destructive" });
      return;
    }

    try {
      const id = newRole.name.toLowerCase().trim().replace(/\s+/g, "_");

      await setDoc(doc(db, "Panels", PANEL_ID, "sidebarConfig", id), {
        id,
        name: newRole.name,
        description: newRole.description,
        users: 0,
        items: [],
        createdAt: new Date(),
      });

      toast({
        title: "Role Created",
        description: "New role added successfully.",
      });

      setShowCreateRole(false);
      setNewRole({ name: "", description: "" });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  }

  // --------------------
  // Edit role: open modal and prepare selectedTabs
  // --------------------
  const openEditRole = (role: Role) => {
    const base = roles.find((r) => r.id === role.id) || role;
    setEditingRole(base);

    const items = (base.items || []) as any[];
    const paths = items.map((i) => (typeof i === "string" ? i : i.path || i));
    setSelectedTabs(paths);
  };

  // --------------------
  // Save edited role items
  // --------------------
  const handleSave = async () => {
    if (!editingRole) return;

    try {
      const roleRef = doc(
        db,
        "Panels",
        PANEL_ID,
        "sidebarConfig",
        editingRole.id,
      );

      const itemsToSave = AVAILABLE_TABS.filter((t) =>
        selectedTabs.includes(t.path),
      ).map((t) => ({ path: t.path, label: t.label, icon: t.icon }));

      await setDoc(
        roleRef,
        {
          id: editingRole.id,
          name: editingRole.name,
          description: editingRole.description ?? "",
          users: editingRole.users ?? 0,
          items: itemsToSave,
          updatedAt: new Date(),
        },
        { merge: true },
      );

      setEditingRole(null);
      toast({
        title: "Saved",
        description: `Permissions updated for ${editingRole.name}`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to save role permissions",
        variant: "destructive",
      });
    }
  };

  // --------------------
  // UI: check main admin
  // --------------------
  const isMainAdmin = ["main_admin", "Main Admin"].includes(
    userProfile?.role ?? "",
  );

  if (!isMainAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-500">
            Only main administrators can access user management.
          </p>
        </div>
      </div>
    );
  }

  // --------------------
  // Render
  // --------------------
  return (
    <div className="p-6 space-y-8">
      {/* Section: User Accounts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">User Accounts</h2>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowCreateUser(true)}>
              Create New User
            </Button>
          </div>
        </div>

        {/* FINAL CONFIRM DELETE USER CONFIRMATION */}
        <Dialog open={confirmDeleteUser} onOpenChange={setConfirmDeleteUser}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you sure?</DialogTitle>
            </DialogHeader>

            <p className="text-sm mb-4">
              Do you really want to delete this account? This action cannot be
              undone.
            </p>

            <DialogFooter>
              <Button variant="destructive" onClick={confirmDeleteUserNow}>
                Yes, Delete
              </Button>
              <Button onClick={() => setConfirmDeleteUser(false)}>No</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View User Details */}
        <Dialog open={!!viewUser} onOpenChange={() => setViewUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
            </DialogHeader>

            {viewUser && (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Name:</span>{" "}
                  {viewUser.displayName || "-"}
                </div>
                <div>
                  <span className="font-medium">Email:</span>{" "}
                  {viewUser.email || "-"}
                </div>
                <div>
                  <span className="font-medium">Role:</span>{" "}
                  {viewUser.role || "-"}
                </div>
                <div>
                  <span className="font-medium">Region:</span>{" "}
                  {viewUser.region || "-"}
                </div>
                <div>
                  <span className="font-medium">Mobile:</span>{" "}
                  {(viewUser.mobileCountryCode || "") +
                    " " +
                    (viewUser.mobileNo || "-")}
                </div>
                <div>
                  <span className="font-medium">Reporting To:</span>{" "}
                  {viewUser.reportingTo || "-"}
                </div>
                <div>
                  <span className="font-medium">Designation:</span>{" "}
                  {viewUser.designation || "-"}
                </div>
                <div>
                  <span className="font-medium">Department:</span>{" "}
                  {viewUser.department || "-"}
                </div>
                <div>
                  <span className="font-medium">Financial Limit:</span>{" "}
                  {Number(viewUser.financialLimit ?? 0).toLocaleString()}
                </div>

                <div className="mt-3 p-3 rounded border bg-muted/30 text-xs text-muted-foreground">
                  Passwords cannot be viewed/retrieved from Firebase Auth. If
                  needed, implement an admin password reset flow instead.
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="ghost" onClick={() => setViewUser(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Active Users</CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-muted border-b text-sm">
                <tr>
                  <th className="px-2 py-3 text-left">Name</th>
                  <th className="px-2 py-3 text-left">Email</th>
                  <th className="px-2 py-3 text-left">Role</th>
                  <th className="px-2 py-3 text-left">Date</th>
                  <th className="px-2 py-3 text-left">Status</th>
                  <th className="px-2 py-3 text-left">Action</th>
                </tr>
              </thead>

              <tbody>
                {activeUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50 text-xs">
                    <td className="px-2 py-1">{user.displayName}</td>
                    <td className="px-2 py-1">{user.email}</td>
                    <td className="px-2 py-1">
                      <Badge>{user.role}</Badge>
                    </td>
                    <td className="px-2 py-1">
                      {user.createdAt?.toDate
                        ? user.createdAt.toDate().toLocaleDateString()
                        : ""}
                    </td>
                    <td className="px-2 py-1">
                      {user.isActive ? (
                        <Badge className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          Inactive
                        </Badge>
                      )}
                    </td>
                    <td className="px-2 py-1 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewUser(user)}
                      >
                        View Details
                      </Button>

                      <Button
                        variant={user.isActive ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleUserStatus(user)}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUserClick(user.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Section: Roles & Permissions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Roles & Permissions</h2>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowCreateRole(true)}>
              Create New Role
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayRoles.map((role) => (
            <Card key={role.id} className="p-4">
              <CardHeader className="flex justify-between items-center">
                <div>
                  <span className="font-semibold">{role.name}</span>
                  <p className="text-xs text-gray-500">{role.description}</p>
                  <p className="text-xs text-gray-500">
                    {role.users ?? 0} users
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditRole(role)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setRoleToDelete(role);
                      setShowDeletePopup(true);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Array.isArray(role.items) && role.items.length > 0 ? (
                    role.items.map((it: any, idx: number) => {
                      const path =
                        typeof it === "string" ? it : (it.path ?? it);
                      const label =
                        AVAILABLE_TABS.find((t) => t.path === path)?.label ??
                        path;
                      return (
                        <Badge key={idx} className="px-2 py-1">
                          {label}
                        </Badge>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-400 mt-2">
                      No tabs enabled
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium">Users</h4>
                  {role.usersList && role.usersList.length > 0 ? (
                    <ul className="list-disc ml-5 mt-2 space-y-1">
                      {role.usersList.map((u) => (
                        <li key={u.id} className="text-sm">
                          <span className="font-medium">{u.displayName}</span>
                          <span className="text-gray-500"> — {u.email}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400 mt-2">
                      No users in this role
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Edit Role Modal */}
      <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Permissions: {editingRole?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {AVAILABLE_TABS.map((tab) => (
              <div key={tab.path} className="flex items-center gap-2">
                <Checkbox
                  checked={selectedTabs.includes(tab.path)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedTabs((prev) =>
                        Array.from(new Set([...prev, tab.path])),
                      );
                    } else {
                      setSelectedTabs((prev) =>
                        prev.filter((p) => p !== tab.path),
                      );
                    }
                  }}
                />
                <label>{tab.label}</label>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingRole(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Role Modal */}
      <Dialog open={showCreateRole} onOpenChange={setShowCreateRole}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div>
              <Label>Role Name</Label>
              <Input
                value={newRole.name}
                onChange={(e) =>
                  setNewRole({ ...newRole, name: e.target.value })
                }
                placeholder="e.g. HR Manager"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={newRole.description}
                onChange={(e) =>
                  setNewRole({ ...newRole, description: e.target.value })
                }
                placeholder="Short description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateRole(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRole}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Modal */}
      <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-name">Full name *</Label>
                <Input
                  id="create-name"
                  placeholder="Enter full name"
                  value={newUser.displayName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, displayName: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="create-email">Email *</Label>
                <Input
                  id="create-email"
                  type="email"
                  placeholder="user@example.com"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Mobile Country Code *</Label>
                <Input
                  placeholder="+92"
                  value={newUser.mobileCountryCode}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      mobileCountryCode: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label>Mobile No *</Label>
                <Input
                  placeholder="3001234567"
                  value={newUser.mobileNo}
                  onChange={(e) =>
                    setNewUser({ ...newUser, mobileNo: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Region *</Label>
                <Input
                  placeholder="Karachi / Lahore / Islamabad"
                  value={newUser.region}
                  onChange={(e) =>
                    setNewUser({ ...newUser, region: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Reporting to</Label>
                <Input
                  placeholder="Manager name / email"
                  value={newUser.reportingTo}
                  onChange={(e) =>
                    setNewUser({ ...newUser, reportingTo: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Financial Limit</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newUser.financialLimit}
                  onChange={(e) =>
                    setNewUser({ ...newUser, financialLimit: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Designation *</Label>
                <Input
                  placeholder="Sales Executive"
                  value={newUser.designation}
                  onChange={(e) =>
                    setNewUser({ ...newUser, designation: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Department *</Label>
                <Input
                  placeholder="Sales"
                  value={newUser.department}
                  onChange={(e) =>
                    setNewUser({ ...newUser, department: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="create-role">Role *</Label>
                <select
                  id="create-role"
                  className="w-full rounded-md border px-3 py-2"
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                >
                  <option value="">Select role</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="create-password">Password *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="create-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="min 6 characters"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPassword((p) => !p)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Password can be shown here only while creating. It won’t be
                  stored or retrievable later.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateUser(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={creating}>
              {creating ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
