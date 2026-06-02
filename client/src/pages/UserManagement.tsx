// "use client";

// import { useEffect, useMemo, useState } from "react";
// import {
//   collection,
//   doc,
//   onSnapshot,
//   setDoc,
//   updateDoc,
//   query,
//   where,
//   deleteDoc,
// } from "firebase/firestore";
// import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
// import { db, secondaryAuth } from "@/lib/firebase";
// import { useAuth } from "@/contexts/AuthContext";
// import { useToast } from "@/hooks/use-toast";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Archive,
//   BarChart3,
//   BedDouble,
//   BriefcaseBusiness,
//   Building2,
//   CheckCircle2,
//   ChevronLeft,
//   ChevronRight,
//   CreditCard,
//   Eye,
//   FileText,
//   HandCoins,
//   Hotel,
//   LayoutDashboard,
//   LineChart,
//   Loader2,
//   Mail,
//   MapPin,
//   Pencil,
//   PieChart,
//   PlaneTakeoff,
//   Plus,
//   Power,
//   PowerOff,
//   Receipt,
//   Scroll,
//   ScrollText,
//   Search,
//   Settings,
//   ShieldCheck,
//   Smartphone,
//   Trash2,
//   UserCog,
//   UserPlus,
//   Users,
//   WalletCards,
//   XCircle,
//   CalendarCheck,
//   ReceiptText,
// } from "lucide-react";

// // --------------------
// // Sidebar / Static Tabs
// // --------------------
// const AVAILABLE_TABS = [
//   { path: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
//   {
//     path: "/account-statement",
//     label: "Account Statement",
//     icon: "LayoutDashboard",
//   },
//   { path: "/sales-dashboard", label: "Sales Dashboard", icon: "LineChart" },
//   { path: "/project", label: "Project", icon: "BarChart3" },
//   { path: "/clients", label: "Clients", icon: "Users" },
//   { path: "/accounts", label: "Account ledger", icon: "WalletCards" },
//   { path: "/expenses", label: "Expense Sheets", icon: "Receipt" },
//   { path: "/budget-requests", label: "Budget Request", icon: "HandCoins" },
//   { path: "/finance", label: "Finance", icon: "Receipt" },
//   { path: "/operation", label: "Operation", icon: "Settings" },
//   { path: "/estimate", label: "Estimates", icon: "Scroll" },
//   { path: "/sales-management", label: "Sales Management", icon: "PieChart" },
//   { path: "/travel/hotel", label: "Travel", icon: "PlaneTakeoff" },
//   { path: "/invoice-estimate", label: "Invoice Estimates", icon: "ScrollText" },
//   { path: "/usertravel", label: "Book Hotel", icon: "BedDouble" },
//   { path: "/booking", label: "Bookings", icon: "Hotel" },
//   { path: "/suppliers", label: "Suppliers", icon: "BookUser" },
//   { path: "/task-calendar", label: "Task Calendar", icon: "CalendarCheck" },
//   { path: "/reimbursement", label: "Reimbursement", icon: "HandCoins" },
//   { path: "/purchase-orders", label: "Purchase Orders", icon: "ReceiptText" },
//   {
//     path: "/claim-reimbursement",
//     label: "Claim Reimbursement",
//     icon: "ReceiptText",
//   },
// ];

// const PANEL_ID = "IEDGE-SYSTEM";
// const USERS_PER_PAGE = 8;

// const iconMap: Record<string, any> = {
//   LayoutDashboard,
//   LineChart,
//   BarChart3,
//   Users,
//   Archive,
//   CreditCard,
//   Receipt,
//   HandCoins,
//   Settings,
//   Scroll,
//   PieChart,
//   PlaneTakeoff,
//   ScrollText,
//   BedDouble,
//   Hotel,
//   FileText,
//   CalendarCheck,
//   ReceiptText,
// };

// // --------------------
// // Types
// // --------------------
// interface Role {
//   id: string;
//   name: string;
//   description?: string;
//   users?: number;
//   items: { path: string; label: string; icon?: string }[] | string[];
//   usersList?: User[];
// }

// interface User {
//   id: string;
//   displayName?: string;
//   email?: string;
//   role?: string;
//   accountStatus?: string;
//   isActive?: boolean;
//   createdAt?: any;
//   mobileCountryCode?: string;
//   mobileNo?: string;
//   region?: string;
//   reportingTo?: string;
//   financialLimit?: number;
//   designation?: string;
//   department?: string;
// }

// // --------------------
// // Small UI helpers
// // --------------------
// function formatDate(value: any) {
//   if (!value) return "-";
//   const date = value?.toDate ? value.toDate() : new Date(value);
//   if (Number.isNaN(date.getTime())) return "-";
//   return date.toLocaleDateString("en-GB", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// }

// function money(value?: number) {
//   return Number(value ?? 0).toLocaleString("en-PK");
// }

// function InfoRow({ label, value }: { label: string; value?: string | number }) {
//   return (
//     <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
//       <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
//         {label}
//       </p>
//       <p className="mt-1 text-sm font-semibold text-slate-800">
//         {value || "-"}
//       </p>
//     </div>
//   );
// }

// function EmptyState({
//   title,
//   description,
// }: {
//   title: string;
//   description: string;
// }) {
//   return (
//     <div className="flex min-h-[180px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
//       <div className="mb-3 rounded-2xl bg-white p-3 shadow-sm">
//         <Users className="h-5 w-5 text-slate-400" />
//       </div>
//       <p className="text-sm font-semibold text-slate-800">{title}</p>
//       <p className="mt-1 max-w-md text-xs text-slate-500">{description}</p>
//     </div>
//   );
// }

// function StatusBadge({ active }: { active?: boolean }) {
//   return active ? (
//     <Badge className="border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700 hover:bg-emerald-50">
//       <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
//       Active
//     </Badge>
//   ) : (
//     <Badge className="border border-rose-200 bg-rose-50 px-2.5 py-1 text-rose-700 hover:bg-rose-50">
//       <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
//       Inactive
//     </Badge>
//   );
// }

// function PermissionBadge({ label, icon }: { label: string; icon?: string }) {
//   const Icon = icon ? iconMap[icon] : undefined;

//   return (
//     <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
//       {Icon ? <Icon className="h-3.5 w-3.5 text-slate-400" /> : null}
//       {label}
//     </span>
//   );
// }

// // --------------------
// // Component
// // --------------------
// export default function UserManagement() {
//   const { userProfile } = useAuth();
//   const { toast } = useToast();

//   // base roles from Firestore
//   const [roles, setRoles] = useState<Role[]>([]);
//   const [editingRole, setEditingRole] = useState<Role | null>(null);
//   const [selectedTabs, setSelectedTabs] = useState<string[]>([]);

//   // users
//   const [pendingUsers, setPendingUsers] = useState<User[]>([]);
//   const [activeUsers, setActiveUsers] = useState<User[]>([]);

//   // filters / pagination
//   const [searchTerm, setSearchTerm] = useState("");
//   const [roleFilter, setRoleFilter] = useState("all");
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [activeUserPage, setActiveUserPage] = useState(1);

//   // create user
//   const [showCreateUser, setShowCreateUser] = useState(false);
//   const [creating, setCreating] = useState(false);

//   const [newUser, setNewUser] = useState({
//     displayName: "",
//     email: "",
//     password: "",
//     role: "",
//     mobileCountryCode: "+92",
//     mobileNo: "",
//     region: "",
//     reportingTo: "",
//     financialLimit: "",
//     designation: "",
//     department: "",
//   });

//   const [showPassword, setShowPassword] = useState(false);

//   // create role
//   const [showCreateRole, setShowCreateRole] = useState(false);
//   const [newRole, setNewRole] = useState({ name: "", description: "" });

//   // Delete role & user selection
//   const [showDeletePopup, setShowDeletePopup] = useState(false);
//   const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
//   const [confirmDeleteUser, setConfirmDeleteUser] = useState(false);
//   const [userIdToConfirmDelete, setUserIdToConfirmDelete] = useState<
//     string | null
//   >(null);

//   // View details modal
//   const [viewUser, setViewUser] = useState<User | null>(null);

//   // --------------------
//   // Helpers / Auth
//   // --------------------
//   async function toggleUserStatus(user: User) {
//     try {
//       await updateDoc(doc(db, "Panels", PANEL_ID, "users", user.id), {
//         isActive: !user.isActive,
//         updatedAt: new Date(),
//       });

//       toast({
//         title: "Status Updated",
//         description: `${user.displayName} is now ${!user.isActive ? "Active" : "Inactive"}.`,
//       });
//     } catch (err: any) {
//       toast({
//         title: "Error",
//         description: err.message,
//         variant: "destructive",
//       });
//     }
//   }

//   // --------------------
//   // Load roles from Firestore (dynamic)
//   // --------------------
//   useEffect(() => {
//     const unsub = onSnapshot(
//       collection(db, "Panels", PANEL_ID, "sidebarConfig"),
//       (snap) => {
//         const list: Role[] = snap.docs.map((d) => {
//           const data = d.data() as any;

//           let items: any[] = data.items ?? [];
//           if (items && items.length > 0 && typeof items[0] === "object") {
//             items = items.map((it: any) => it.path ?? it);
//           }

//           return {
//             id: d.id,
//             name: data.name ?? data.id,
//             description: data.description ?? "",
//             users: data.users ?? 0,
//             items,
//           } as Role;
//         });

//         setRoles(list);
//       },
//     );

//     return () => unsub();
//   }, []);

//   // --------------------
//   // Load users (pending & active) from PANEL path
//   // --------------------
//   useEffect(() => {
//     const usersRef = collection(db, "Panels", PANEL_ID, "users");

//     const pendingQ = query(usersRef, where("accountStatus", "==", "pending"));
//     const activeQ = query(usersRef, where("accountStatus", "==", "approved"));

//     const unsubPending = onSnapshot(pendingQ, (snap) => {
//       setPendingUsers(
//         snap.docs.map((d) => ({
//           ...(d.data() as User),
//           id: d.id,
//         })),
//       );
//     });

//     const unsubActive = onSnapshot(activeQ, (snap) => {
//       setActiveUsers(
//         snap.docs.map((d) => ({
//           ...(d.data() as User),
//           isActive: (d.data() as any)?.isActive ?? true,
//           id: d.id,
//         })),
//       );
//     });

//     return () => {
//       unsubPending();
//       unsubActive();
//     };
//   }, []);

//   // --------------------
//   // Compute displayRoles (attach users list + count)
//   // --------------------
//   const displayRoles = useMemo(() => {
//     return roles.map((role) => {
//       const usersInRole = activeUsers.filter((u) => {
//         if (!u.role) return false;
//         return u.role === role.id || u.role === role.name;
//       });

//       return {
//         ...role,
//         users: usersInRole.length,
//         usersList: usersInRole,
//       } as Role;
//     });
//   }, [roles, activeUsers]);

//   const getRoleName = (roleValue?: string) => {
//     if (!roleValue) return "-";
//     return (
//       roles.find((role) => role.id === roleValue || role.name === roleValue)
//         ?.name ?? roleValue
//     );
//   };

//   const getPermissionMeta = (item: any) => {
//     const path = typeof item === "string" ? item : (item.path ?? item);
//     const match = AVAILABLE_TABS.find((tab) => tab.path === path);
//     return {
//       path,
//       label: match?.label ?? path,
//       icon: match?.icon,
//     };
//   };

//   const inactiveUsersCount = activeUsers.filter(
//     (user) => !user.isActive,
//   ).length;
//   const filteredActiveUsers = useMemo(() => {
//     const keyword = searchTerm.trim().toLowerCase();

//     return activeUsers.filter((user) => {
//       const matchesSearch =
//         !keyword ||
//         user.displayName?.toLowerCase().includes(keyword) ||
//         user.email?.toLowerCase().includes(keyword) ||
//         user.department?.toLowerCase().includes(keyword) ||
//         user.designation?.toLowerCase().includes(keyword) ||
//         getRoleName(user.role).toLowerCase().includes(keyword);

//       const matchesRole =
//         roleFilter === "all" ||
//         user.role === roleFilter ||
//         getRoleName(user.role) === roleFilter;
//       const matchesStatus =
//         statusFilter === "all" ||
//         (statusFilter === "active" && user.isActive) ||
//         (statusFilter === "inactive" && !user.isActive);

//       return matchesSearch && matchesRole && matchesStatus;
//     });
//   }, [activeUsers, searchTerm, roleFilter, statusFilter, roles]);

//   const totalPages = Math.max(
//     1,
//     Math.ceil(filteredActiveUsers.length / USERS_PER_PAGE),
//   );
//   const paginatedActiveUsers = filteredActiveUsers.slice(
//     (activeUserPage - 1) * USERS_PER_PAGE,
//     activeUserPage * USERS_PER_PAGE,
//   );

//   useEffect(() => {
//     setActiveUserPage(1);
//   }, [searchTerm, roleFilter, statusFilter]);

//   // --------------------
//   // Approve / Reject user
//   // --------------------
//   async function handleApproveUser(user: User) {
//     try {
//       await updateDoc(doc(db, "Panels", PANEL_ID, "users", user.id), {
//         accountStatus: "approved",
//         updatedAt: new Date(),
//       });
//       toast({
//         title: "Success",
//         description: `User ${user.displayName} has been approved`,
//       });
//     } catch (error: any) {
//       toast({
//         title: "Error",
//         description: error.message || "Failed to approve user",
//         variant: "destructive",
//       });
//     }
//   }

//   async function handleRejectUser(user: User) {
//     try {
//       await updateDoc(doc(db, "Panels", PANEL_ID, "users", user.id), {
//         accountStatus: "rejected",
//         updatedAt: new Date(),
//       });
//       toast({
//         title: "Success",
//         description: `User ${user.displayName} has been rejected`,
//       });
//     } catch (error: any) {
//       toast({
//         title: "Error",
//         description: error.message || "Failed to reject user",
//         variant: "destructive",
//       });
//     }
//   }

//   function handleDeleteUserClick(userId: string) {
//     setUserIdToConfirmDelete(userId);
//     setConfirmDeleteUser(true);
//   }

//   async function confirmDeleteUserNow() {
//     if (!userIdToConfirmDelete) return;

//     try {
//       await deleteDoc(
//         doc(db, "Panels", PANEL_ID, "users", userIdToConfirmDelete),
//       );

//       toast({
//         title: "User Deleted",
//         description: "The selected user has been removed.",
//       });
//     } catch (err: any) {
//       toast({
//         title: "Error",
//         description: err.message,
//         variant: "destructive",
//       });
//     }

//     setConfirmDeleteUser(false);
//     setUserIdToConfirmDelete(null);
//   }

//   async function deleteRoleDocOnly(roleId: string) {
//     try {
//       await deleteDoc(doc(db, "Panels", PANEL_ID, "sidebarConfig", roleId));
//       toast({
//         title: "Role deleted",
//         description: "Role removed successfully.",
//       });
//     } catch (err: any) {
//       toast({
//         title: "Error",
//         description: err.message,
//         variant: "destructive",
//       });
//     }
//   }

//   // --------------------
//   // Create user (admin) -> save under Panels/PANEL_ID/users/{uid}
//   // --------------------
//   const handleCreateUser = async () => {
//     if (
//       !newUser.displayName ||
//       !newUser.email ||
//       !newUser.password ||
//       !newUser.role ||
//       !newUser.mobileCountryCode ||
//       !newUser.mobileNo ||
//       !newUser.region ||
//       !newUser.designation ||
//       !newUser.department
//     ) {
//       toast({
//         title: "Missing fields",
//         description: "Please fill all required fields",
//         variant: "destructive",
//       });
//       return;
//     }

//     const financialLimitNumber =
//       newUser.financialLimit?.trim() === ""
//         ? 0
//         : Number(newUser.financialLimit);

//     if (Number.isNaN(financialLimitNumber)) {
//       toast({
//         title: "Invalid financial limit",
//         description: "Financial limit must be a number",
//         variant: "destructive",
//       });
//       return;
//     }

//     setCreating(true);

//     try {
//       const cred = await createUserWithEmailAndPassword(
//         secondaryAuth,
//         newUser.email.trim(),
//         newUser.password,
//       );

//       await updateProfile(cred.user, { displayName: newUser.displayName });

//       // IMPORTANT: do NOT store password in Firestore
//       await setDoc(doc(db, "Panels", PANEL_ID, "users", cred.user.uid), {
//         displayName: newUser.displayName,
//         email: newUser.email.trim(),
//         role: newUser.role,
//         accountStatus: "approved",
//         isActive: true,
//         createdAt: new Date(),
//         mobileCountryCode: newUser.mobileCountryCode.trim(),
//         mobileNo: newUser.mobileNo.trim(),
//         region: newUser.region.trim(),
//         reportingTo: newUser.reportingTo.trim(),
//         financialLimit: financialLimitNumber,
//         designation: newUser.designation.trim(),
//         department: newUser.department.trim(),
//       });

//       toast({
//         title: "User Created",
//         description: `${newUser.displayName} created successfully.`,
//       });

//       setShowCreateUser(false);
//       setShowPassword(false);
//       setNewUser({
//         displayName: "",
//         email: "",
//         password: "",
//         role: "",
//         mobileCountryCode: "+92",
//         mobileNo: "",
//         region: "",
//         reportingTo: "",
//         financialLimit: "",
//         designation: "",
//         department: "",
//       });
//     } catch (err: any) {
//       toast({
//         title: "Error",
//         description: err.message,
//         variant: "destructive",
//       });
//     } finally {
//       setCreating(false);
//     }
//   };

//   // --------------------
//   // Create Role (dynamic)
//   // --------------------
//   async function handleCreateRole() {
//     if (!newRole.name.trim()) {
//       toast({ title: "Role name required", variant: "destructive" });
//       return;
//     }

//     try {
//       const id = newRole.name.toLowerCase().trim().replace(/\s+/g, "_");

//       await setDoc(doc(db, "Panels", PANEL_ID, "sidebarConfig", id), {
//         id,
//         name: newRole.name,
//         description: newRole.description,
//         users: 0,
//         items: [],
//         createdAt: new Date(),
//       });

//       toast({
//         title: "Role Created",
//         description: "New role added successfully.",
//       });

//       setShowCreateRole(false);
//       setNewRole({ name: "", description: "" });
//     } catch (err: any) {
//       toast({
//         title: "Error",
//         description: err.message,
//         variant: "destructive",
//       });
//     }
//   }

//   // --------------------
//   // Edit role: open modal and prepare selectedTabs
//   // --------------------
//   const openEditRole = (role: Role) => {
//     const base = roles.find((r) => r.id === role.id) || role;
//     setEditingRole(base);

//     const items = (base.items || []) as any[];
//     const paths = items.map((i) => (typeof i === "string" ? i : i.path || i));
//     setSelectedTabs(paths);
//   };

//   // --------------------
//   // Save edited role items
//   // --------------------
//   const handleSave = async () => {
//     if (!editingRole) return;

//     try {
//       const roleRef = doc(
//         db,
//         "Panels",
//         PANEL_ID,
//         "sidebarConfig",
//         editingRole.id,
//       );

//       const itemsToSave = AVAILABLE_TABS.filter((t) =>
//         selectedTabs.includes(t.path),
//       ).map((t) => ({
//         path: t.path,
//         label: t.label,
//         icon: t.icon,
//       }));

//       await setDoc(
//         roleRef,
//         {
//           id: editingRole.id,
//           name: editingRole.name,
//           description: editingRole.description ?? "",
//           users: editingRole.users ?? 0,
//           items: itemsToSave,
//           updatedAt: new Date(),
//         },
//         { merge: true },
//       );

//       setEditingRole(null);
//       toast({
//         title: "Saved",
//         description: `Permissions updated for ${editingRole.name}`,
//       });
//     } catch (err: any) {
//       toast({
//         title: "Error",
//         description: err.message || "Failed to save role permissions",
//         variant: "destructive",
//       });
//     }
//   };

//   // --------------------
//   // UI: check main admin
//   // --------------------
//   const isMainAdmin = ["main_admin", "Main Admin"].includes(
//     userProfile?.role ?? "",
//   );

//   if (!isMainAdmin) {
//     return (
//       <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4">
//         <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
//           <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50">
//             <ShieldCheck className="h-7 w-7 text-rose-500" />
//           </div>
//           <h2 className="text-xl font-semibold text-slate-900">
//             Access Denied
//           </h2>
//           <p className="mt-2 text-sm text-slate-500">
//             Only main administrators can access user management.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   // --------------------
//   // Render
//   // --------------------
//   return (
//     <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eef6ff,transparent_30%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] p-4 text-slate-900">
//       <div className="mx-auto space-y-8">
//         {/* Header */}
//         <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/85 shadow-sm backdrop-blur">
//           <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
//             <div>
//               <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-4xl">
//                 User Management
//               </h1>
//               <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
//                 Manage users, approvals, roles, and page-level permissions from
//                 one clean dashboard.
//               </p>
//             </div>

//             <div className="flex flex-col gap-3 sm:flex-row">
//               <Button
//                 variant="outline"
//                 onClick={() => setShowCreateRole(true)}
//                 className="h-11 rounded-2xl border-slate-200 bg-white px-5 shadow-sm"
//               >
//                 <Plus className="mr-2 h-4 w-4" />
//                 New Role
//               </Button>
//               <Button
//                 onClick={() => setShowCreateUser(true)}
//                 className="h-11 rounded-2xl bg-slate-950 px-5 text-white shadow-sm hover:bg-slate-800"
//               >
//                 <UserPlus className="mr-2 h-4 w-4" />
//                 Create User
//               </Button>
//             </div>
//           </div>
//         </div>

//         {/* Stats */}
//         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
//           <Card className="rounded-[1.75rem] border-slate-200/80 bg-white/90 shadow-sm">
//             <CardContent className="flex items-center justify-between p-5">
//               <div>
//                 <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
//                   Approved Users
//                 </p>
//                 <p className="mt-2 text-3xl font-bold text-slate-950">
//                   {activeUsers.length}
//                 </p>
//               </div>
//               <div className="rounded-2xl bg-blue-50 p-3">
//                 <Users className="h-6 w-6 text-blue-600" />
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="rounded-[1.75rem] border-slate-200/80 bg-white/90 shadow-sm">
//             <CardContent className="flex items-center justify-between p-5">
//               <div>
//                 <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
//                   Pending Requests
//                 </p>
//                 <p className="mt-2 text-3xl font-bold text-slate-950">
//                   {pendingUsers.length}
//                 </p>
//               </div>
//               <div className="rounded-2xl bg-amber-50 p-3">
//                 <UserCog className="h-6 w-6 text-amber-600" />
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="rounded-[1.75rem] border-slate-200/80 bg-white/90 shadow-sm">
//             <CardContent className="flex items-center justify-between p-5">
//               <div>
//                 <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
//                   Inactive Users
//                 </p>
//                 <p className="mt-2 text-3xl font-bold text-slate-950">
//                   {inactiveUsersCount}
//                 </p>
//               </div>
//               <div className="rounded-2xl bg-rose-50 p-3">
//                 <PowerOff className="h-6 w-6 text-rose-600" />
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="rounded-[1.75rem] border-slate-200/80 bg-white/90 shadow-sm">
//             <CardContent className="flex items-center justify-between p-5">
//               <div>
//                 <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
//                   Total Roles
//                 </p>
//                 <p className="mt-2 text-3xl font-bold text-slate-950">
//                   {roles.length}
//                 </p>
//               </div>
//               <div className="rounded-2xl bg-violet-50 p-3">
//                 <ShieldCheck className="h-6 w-6 text-violet-600" />
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Pending Users */}
//         {/* <section className="space-y-4">
//           <div className="flex items-center justify-between">
//             <div>
//               <h2 className="text-xl font-bold tracking-tight text-slate-950">Pending Approvals</h2>
//               <p className="text-sm text-slate-500">Review new account requests before activation.</p>
//             </div>
//           </div>

//           <Card className="rounded-[2rem] border-slate-200/80 bg-white/90 shadow-sm">
//             <CardContent className="p-4 md:p-5">
//               {pendingUsers.length === 0 ? (
//                 <EmptyState title="No pending users" description="New registration requests will appear here for approval or rejection." />
//               ) : (
//                 <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
//                   {pendingUsers.map((user) => (
//                     <div
//                       key={user.id}
//                       className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-slate-50/60 p-4 transition hover:bg-white hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
//                     >
//                       <div className="flex items-center gap-3">
//                         <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-bold text-slate-700 shadow-sm">
//                           {(user.displayName || user.email || "U").slice(0, 1).toUpperCase()}
//                         </div>
//                         <div>
//                           <p className="font-semibold text-slate-900">{user.displayName || "Unnamed User"}</p>
//                           <p className="mt-0.5 text-xs text-slate-500">{user.email || "-"}</p>
//                           <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
//                             <span className="rounded-full bg-white px-2 py-1 shadow-sm">{getRoleName(user.role)}</span>
//                             <span className="rounded-full bg-white px-2 py-1 shadow-sm">{formatDate(user.createdAt)}</span>
//                           </div>
//                         </div>
//                       </div>

//                       <div className="flex gap-2">
//                         <Button
//                           size="sm"
//                           onClick={() => handleApproveUser(user)}
//                           className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
//                         >
//                           <CheckCircle2 className="mr-1.5 h-4 w-4" />
//                           Approve
//                         </Button>
//                         <Button
//                           size="sm"
//                           variant="outline"
//                           onClick={() => handleRejectUser(user)}
//                           className="rounded-xl border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
//                         >
//                           <XCircle className="mr-1.5 h-4 w-4" />
//                           Reject
//                         </Button>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </section> */}

//         {/* User Accounts */}
//         <section className="space-y-4">
//           <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
//             <div>
//               <h2 className="text-xl font-bold tracking-tight text-slate-950">
//                 Active User Accounts
//               </h2>
//               <p className="text-sm text-slate-500">
//                 Search, filter, view details, activate/deactivate, or delete
//                 users.
//               </p>
//             </div>
//           </div>

//           <Card className="overflow-hidden rounded-[2rem] border-slate-200/80 bg-white/90 shadow-sm">
//             <CardHeader className="border-b border-slate-100 bg-white/80 p-4 md:p-5">
//               <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_180px]">
//                 <div className="relative">
//                   <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
//                   <Input
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     placeholder="Search by name, email, role, department..."
//                     className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11 shadow-none focus-visible:ring-slate-300"
//                   />
//                 </div>

//                 <select
//                   className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
//                   value={roleFilter}
//                   onChange={(e) => setRoleFilter(e.target.value)}
//                 >
//                   <option value="all">All roles</option>
//                   {roles.map((role) => (
//                     <option key={role.id} value={role.id}>
//                       {role.name}
//                     </option>
//                   ))}
//                 </select>

//                 <select
//                   className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
//                   value={statusFilter}
//                   onChange={(e) => setStatusFilter(e.target.value)}
//                 >
//                   <option value="all">All status</option>
//                   <option value="active">Active</option>
//                   <option value="inactive">Inactive</option>
//                 </select>
//               </div>
//             </CardHeader>

//             <CardContent className="p-0">
//               {paginatedActiveUsers.length === 0 ? (
//                 <div className="p-5">
//                   <EmptyState
//                     title="No users found"
//                     description="Try clearing your filters or search with another keyword."
//                   />
//                 </div>
//               ) : (
//                 <div className="overflow-x-auto">
//                   <table className="w-full min-w-[980px] text-left">
//                     <thead>
//                       <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-400">
//                         <th className="px-5 py-4 font-semibold">User</th>
//                         <th className="px-5 py-4 font-semibold">Role</th>
//                         <th className="px-5 py-4 font-semibold">Department</th>
//                         <th className="px-5 py-4 font-semibold">Created</th>
//                         <th className="px-5 py-4 font-semibold">Status</th>
//                         <th className="px-5 py-4 text-right font-semibold">
//                           Actions
//                         </th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-slate-100">
//                       {paginatedActiveUsers.map((user) => (
//                         <tr
//                           key={user.id}
//                           className="bg-white transition hover:bg-slate-50/80"
//                         >
//                           <td className="px-5 py-4">
//                             <div className="flex items-center gap-3">
//                               <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-700">
//                                 {(user.displayName || user.email || "U")
//                                   .slice(0, 1)
//                                   .toUpperCase()}
//                               </div>
//                               <div>
//                                 <p className="font-semibold text-slate-900">
//                                   {user.displayName || "-"}
//                                 </p>
//                                 <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
//                                   <Mail className="h-3.5 w-3.5" />
//                                   {user.email || "-"}
//                                 </p>
//                               </div>
//                             </div>
//                           </td>
//                           <td className="px-5 py-4">
//                             <Badge className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-blue-700 hover:bg-blue-50">
//                               {getRoleName(user.role)}
//                             </Badge>
//                           </td>
//                           <td className="px-5 py-4">
//                             <p className="text-sm font-medium text-slate-700">
//                               {user.department || "-"}
//                             </p>
//                             <p className="mt-0.5 text-xs text-slate-400">
//                               {user.designation || "-"}
//                             </p>
//                           </td>
//                           <td className="px-5 py-4 text-sm text-slate-500">
//                             {formatDate(user.createdAt)}
//                           </td>
//                           <td className="px-5 py-4">
//                             <StatusBadge active={user.isActive} />
//                           </td>
//                           <td className="px-5 py-4">
//                             <div className="flex justify-end gap-2">
//                               <Button
//                                 variant="outline"
//                                 size="sm"
//                                 onClick={() => setViewUser(user)}
//                                 className="rounded-xl border-slate-200 bg-white"
//                               >
//                                 <Eye className="mr-1.5 h-4 w-4" />
//                                 View
//                               </Button>
//                               <Button
//                                 variant="outline"
//                                 size="sm"
//                                 onClick={() => toggleUserStatus(user)}
//                                 className={
//                                   user.isActive
//                                     ? "rounded-xl border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
//                                     : "rounded-xl border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
//                                 }
//                               >
//                                 {user.isActive ? (
//                                   <PowerOff className="mr-1.5 h-4 w-4" />
//                                 ) : (
//                                   <Power className="mr-1.5 h-4 w-4" />
//                                 )}
//                                 {user.isActive ? "Deactivate" : "Activate"}
//                               </Button>
//                               <Button
//                                 variant="outline"
//                                 size="sm"
//                                 onClick={() => handleDeleteUserClick(user.id)}
//                                 className="rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
//                               >
//                                 <Trash2 className="h-4 w-4" />
//                               </Button>
//                             </div>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               )}

//               <div className="flex flex-col gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
//                 <p className="text-xs text-slate-500">
//                   Showing{" "}
//                   {filteredActiveUsers.length === 0
//                     ? 0
//                     : (activeUserPage - 1) * USERS_PER_PAGE + 1}{" "}
//                   to{" "}
//                   {Math.min(
//                     activeUserPage * USERS_PER_PAGE,
//                     filteredActiveUsers.length,
//                   )}{" "}
//                   of {filteredActiveUsers.length} users
//                 </p>
//                 <div className="flex items-center gap-2">
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     disabled={activeUserPage === 1}
//                     onClick={() =>
//                       setActiveUserPage((page) => Math.max(1, page - 1))
//                     }
//                     className="rounded-xl border-slate-200 bg-white disabled:opacity-40"
//                   >
//                     <ChevronLeft className="h-4 w-4" />
//                   </Button>
//                   <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
//                     Page {activeUserPage} / {totalPages}
//                   </span>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     disabled={activeUserPage === totalPages}
//                     onClick={() =>
//                       setActiveUserPage((page) =>
//                         Math.min(totalPages, page + 1),
//                       )
//                     }
//                     className="rounded-xl border-slate-200 bg-white disabled:opacity-40"
//                   >
//                     <ChevronRight className="h-4 w-4" />
//                   </Button>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </section>

//         {/* Roles & Permissions */}
//         <section className="space-y-4">
//           <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
//             <div>
//               <h2 className="text-xl font-bold tracking-tight text-slate-950">
//                 Roles & Permissions
//               </h2>
//               <p className="text-sm text-slate-500">
//                 Control which modules each role can access.
//               </p>
//             </div>
//             <Button
//               variant="outline"
//               onClick={() => setShowCreateRole(true)}
//               className="h-10 rounded-2xl border-slate-200 bg-white shadow-sm"
//             >
//               <Plus className="mr-2 h-4 w-4" />
//               Create New Role
//             </Button>
//           </div>

//           {displayRoles.length === 0 ? (
//             <Card className="rounded-[2rem] border-slate-200/80 bg-white/90 p-5 shadow-sm">
//               <EmptyState
//                 title="No roles found"
//                 description="Create a new role and assign the required sidebar permissions."
//               />
//             </Card>
//           ) : (
//             <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
//               {displayRoles.map((role) => (
//                 <Card
//                   key={role.id}
//                   className="rounded-[2rem] border-slate-200/80 bg-white/90 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
//                 >
//                   <CardHeader className="border-b border-slate-100 p-5">
//                     <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
//                       <div className="flex gap-3">
//                         <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
//                           <ShieldCheck className="h-6 w-6" />
//                         </div>
//                         <div>
//                           <CardTitle className="text-lg font-bold text-slate-950">
//                             {role.name}
//                           </CardTitle>
//                           <p className="mt-1 text-sm text-slate-500">
//                             {role.description || "No description added"}
//                           </p>
//                           <div className="mt-3 flex flex-wrap gap-2">
//                             <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
//                               {role.users ?? 0} users
//                             </span>
//                             <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
//                               {Array.isArray(role.items)
//                                 ? role.items.length
//                                 : 0}{" "}
//                               permissions
//                             </span>
//                           </div>
//                         </div>
//                       </div>

//                       <div className="flex shrink-0 gap-2">
//                         <Button
//                           variant="outline"
//                           size="sm"
//                           onClick={() => openEditRole(role)}
//                           className="rounded-xl border-slate-200 bg-white"
//                         >
//                           <Pencil className="mr-1.5 h-4 w-4" />
//                           Edit
//                         </Button>
//                         <Button
//                           variant="outline"
//                           size="sm"
//                           onClick={() => {
//                             setRoleToDelete(role);
//                             setShowDeletePopup(true);
//                           }}
//                           className="rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
//                         >
//                           <Trash2 className="h-4 w-4" />
//                         </Button>
//                       </div>
//                     </div>
//                   </CardHeader>

//                   <CardContent className="space-y-5 p-5">
//                     <div>
//                       <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
//                         Enabled Modules
//                       </p>
//                       <div className="flex flex-wrap gap-2">
//                         {Array.isArray(role.items) && role.items.length > 0 ? (
//                           role.items.map((item: any, idx: number) => {
//                             const meta = getPermissionMeta(item);
//                             return (
//                               <PermissionBadge
//                                 key={`${meta.path}-${idx}`}
//                                 label={meta.label}
//                                 icon={meta.icon}
//                               />
//                             );
//                           })
//                         ) : (
//                           <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-400">
//                             No tabs enabled
//                           </p>
//                         )}
//                       </div>
//                     </div>

//                     <div>
//                       <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
//                         Users In This Role
//                       </p>
//                       {role.usersList && role.usersList.length > 0 ? (
//                         <div className="space-y-2">
//                           {role.usersList.slice(0, 5).map((user) => (
//                             <div
//                               key={user.id}
//                               className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2"
//                             >
//                               <div className="flex items-center gap-2">
//                                 <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-xs font-bold text-slate-700 shadow-sm">
//                                   {(user.displayName || user.email || "U")
//                                     .slice(0, 1)
//                                     .toUpperCase()}
//                                 </div>
//                                 <div>
//                                   <p className="text-sm font-semibold text-slate-800">
//                                     {user.displayName || "-"}
//                                   </p>
//                                   <p className="text-xs text-slate-400">
//                                     {user.email || "-"}
//                                   </p>
//                                 </div>
//                               </div>
//                               <StatusBadge active={user.isActive} />
//                             </div>
//                           ))}
//                           {role.usersList.length > 5 ? (
//                             <p className="text-xs text-slate-400">
//                               +{role.usersList.length - 5} more users
//                             </p>
//                           ) : null}
//                         </div>
//                       ) : (
//                         <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-400">
//                           No users assigned
//                         </p>
//                       )}
//                     </div>
//                   </CardContent>
//                 </Card>
//               ))}
//             </div>
//           )}
//         </section>
//       </div>

//       {/* FINAL CONFIRM DELETE USER CONFIRMATION */}
//       <Dialog open={confirmDeleteUser} onOpenChange={setConfirmDeleteUser}>
//         <DialogContent className="rounded-[2rem] border-slate-200 p-0 shadow-xl sm:max-w-md">
//           <div className="p-6">
//             <DialogHeader>
//               <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50">
//                 <Trash2 className="h-6 w-6 text-rose-600" />
//               </div>
//               <DialogTitle className="text-xl font-bold text-slate-950">
//                 Delete this account?
//               </DialogTitle>
//             </DialogHeader>

//             <p className="mt-3 text-sm leading-6 text-slate-500">
//               This user account will be removed from Firestore. This action
//               cannot be undone.
//             </p>
//           </div>

//           <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
//             <Button
//               variant="outline"
//               onClick={() => setConfirmDeleteUser(false)}
//               className="rounded-xl bg-white"
//             >
//               Cancel
//             </Button>
//             <Button
//               variant="destructive"
//               onClick={confirmDeleteUserNow}
//               className="rounded-xl"
//             >
//               Yes, Delete
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Confirm Delete Role */}
//       <Dialog open={showDeletePopup} onOpenChange={setShowDeletePopup}>
//         <DialogContent className="rounded-[2rem] border-slate-200 p-0 shadow-xl sm:max-w-md">
//           <div className="p-6">
//             <DialogHeader>
//               <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50">
//                 <Trash2 className="h-6 w-6 text-rose-600" />
//               </div>
//               <DialogTitle className="text-xl font-bold text-slate-950">
//                 Delete role?
//               </DialogTitle>
//             </DialogHeader>

//             <p className="mt-3 text-sm leading-6 text-slate-500">
//               Are you sure you want to delete{" "}
//               <span className="font-semibold text-slate-800">
//                 {roleToDelete?.name}
//               </span>
//               ? This will remove the role permissions document.
//             </p>
//           </div>

//           <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
//             <Button
//               variant="outline"
//               onClick={() => {
//                 setShowDeletePopup(false);
//                 setRoleToDelete(null);
//               }}
//               className="rounded-xl bg-white"
//             >
//               Cancel
//             </Button>
//             <Button
//               variant="destructive"
//               onClick={async () => {
//                 if (!roleToDelete) return;
//                 await deleteRoleDocOnly(roleToDelete.id);
//                 setShowDeletePopup(false);
//                 setRoleToDelete(null);
//               }}
//               className="rounded-xl"
//             >
//               Delete Role
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* View User Details */}
//       <Dialog
//         open={!!viewUser}
//         onOpenChange={(open) => !open && setViewUser(null)}
//       >
//         <DialogContent className="max-w-3xl rounded-[2rem] border-slate-200 p-0 shadow-xl">
//           <div className="border-b border-slate-100 p-6">
//             <DialogHeader>
//               <DialogTitle className="flex items-center gap-3 text-xl font-bold text-slate-950">
//                 <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
//                   {(viewUser?.displayName || viewUser?.email || "U")
//                     .slice(0, 1)
//                     .toUpperCase()}
//                 </span>
//                 User Details
//               </DialogTitle>
//             </DialogHeader>
//           </div>

//           {viewUser && (
//             <div className="space-y-5 p-6">
//               <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
//                 <InfoRow label="Full Name" value={viewUser.displayName} />
//                 <InfoRow label="Email" value={viewUser.email} />
//                 <InfoRow label="Role" value={getRoleName(viewUser.role)} />
//                 <InfoRow
//                   label="Mobile"
//                   value={`${viewUser.mobileCountryCode || ""} ${viewUser.mobileNo || ""}`.trim()}
//                 />
//                 <InfoRow label="Region" value={viewUser.region} />
//                 <InfoRow label="Reporting To" value={viewUser.reportingTo} />
//                 <InfoRow label="Designation" value={viewUser.designation} />
//                 <InfoRow label="Department" value={viewUser.department} />
//                 <InfoRow
//                   label="Financial Limit"
//                   value={money(viewUser.financialLimit)}
//                 />
//               </div>

//               <div className="rounded-3xl border border-amber-100 bg-amber-50/70 p-4 text-sm leading-6 text-amber-800">
//                 Passwords cannot be viewed or retrieved from Firebase Auth. If
//                 needed, implement an admin password reset flow instead.
//               </div>
//             </div>
//           )}

//           <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
//             <Button
//               variant="outline"
//               onClick={() => setViewUser(null)}
//               className="rounded-xl bg-white"
//             >
//               Close
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Edit Role Modal */}
//       <Dialog
//         open={!!editingRole}
//         onOpenChange={(open) => !open && setEditingRole(null)}
//       >
//         <DialogContent className="max-w-3xl rounded-[2rem] border-slate-200 p-0 shadow-xl">
//           <div className="border-b border-slate-100 p-6">
//             <DialogHeader>
//               <DialogTitle className="text-xl font-bold text-slate-950">
//                 Edit Permissions: {editingRole?.name}
//               </DialogTitle>
//             </DialogHeader>
//             <p className="mt-2 text-sm text-slate-500">
//               Select the modules this role can access.
//             </p>
//           </div>

//           <div className="grid max-h-[60vh] grid-cols-1 gap-3 overflow-y-auto p-6 md:grid-cols-2">
//             {AVAILABLE_TABS.map((tab) => {
//               const Icon = iconMap[tab.icon];
//               const checked = selectedTabs.includes(tab.path);

//               return (
//                 <label
//                   key={tab.path}
//                   className={
//                     checked
//                       ? "flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-300 bg-slate-950 p-4 text-white shadow-sm transition"
//                       : "flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-700 transition hover:bg-slate-50"
//                   }
//                 >
//                   <Checkbox
//                     checked={checked}
//                     onCheckedChange={(isChecked) => {
//                       if (isChecked) {
//                         setSelectedTabs((prev) =>
//                           Array.from(new Set([...prev, tab.path])),
//                         );
//                       } else {
//                         setSelectedTabs((prev) =>
//                           prev.filter((p) => p !== tab.path),
//                         );
//                       }
//                     }}
//                     className="border-slate-300"
//                   />
//                   <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
//                     {Icon ? (
//                       <Icon className="h-4 w-4" />
//                     ) : (
//                       <FileText className="h-4 w-4" />
//                     )}
//                   </span>
//                   <span>
//                     <span className="block text-sm font-semibold">
//                       {tab.label}
//                     </span>
//                     <span
//                       className={
//                         checked
//                           ? "block text-xs text-slate-300"
//                           : "block text-xs text-slate-400"
//                       }
//                     >
//                       {tab.path}
//                     </span>
//                   </span>
//                 </label>
//               );
//             })}
//           </div>

//           <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
//             <Button
//               variant="outline"
//               onClick={() => setEditingRole(null)}
//               className="rounded-xl bg-white"
//             >
//               Cancel
//             </Button>
//             <Button
//               onClick={handleSave}
//               className="rounded-xl bg-slate-950 text-white hover:bg-slate-800"
//             >
//               Save Permissions
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Create Role Modal */}
//       <Dialog open={showCreateRole} onOpenChange={setShowCreateRole}>
//         <DialogContent className="rounded-[2rem] border-slate-200 p-0 shadow-xl sm:max-w-lg">
//           <div className="border-b border-slate-100 p-6">
//             <DialogHeader>
//               <DialogTitle className="text-xl font-bold text-slate-950">
//                 Create New Role
//               </DialogTitle>
//             </DialogHeader>
//             <p className="mt-2 text-sm text-slate-500">
//               Add a new role, then assign permissions from the edit option.
//             </p>
//           </div>

//           <div className="space-y-4 p-6">
//             <div className="space-y-2">
//               <Label>Role Name</Label>
//               <Input
//                 value={newRole.name}
//                 onChange={(e) =>
//                   setNewRole({ ...newRole, name: e.target.value })
//                 }
//                 placeholder="e.g. HR Manager"
//                 className="h-11 rounded-2xl border-slate-200 bg-slate-50"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label>Description</Label>
//               <Input
//                 value={newRole.description}
//                 onChange={(e) =>
//                   setNewRole({ ...newRole, description: e.target.value })
//                 }
//                 placeholder="Short description"
//                 className="h-11 rounded-2xl border-slate-200 bg-slate-50"
//               />
//             </div>
//           </div>

//           <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
//             <Button
//               variant="outline"
//               onClick={() => setShowCreateRole(false)}
//               className="rounded-xl bg-white"
//             >
//               Cancel
//             </Button>
//             <Button
//               onClick={handleCreateRole}
//               className="rounded-xl bg-slate-950 text-white hover:bg-slate-800"
//             >
//               Create Role
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Create User Modal */}
//       <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
//         <DialogContent className="max-w-5xl rounded-[2rem] border-slate-200 p-0 shadow-xl">
//           <div className="border-b border-slate-100 p-6">
//             <DialogHeader>
//               <DialogTitle className="flex items-center gap-3 text-xl font-bold text-slate-950">
//                 <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
//                   <UserPlus className="h-5 w-5" />
//                 </span>
//                 Create New User
//               </DialogTitle>
//             </DialogHeader>
//             <p className="mt-2 text-sm text-slate-500">
//               Create a Firebase Auth account and save the user profile under
//               this panel.
//             </p>
//           </div>

//           <div className="max-h-[70vh] overflow-y-auto p-6">
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
//               <div className="space-y-2">
//                 <Label htmlFor="create-name">Full name *</Label>
//                 <div className="relative">
//                   <UserCog className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
//                   <Input
//                     id="create-name"
//                     placeholder="Enter full name"
//                     value={newUser.displayName}
//                     onChange={(e) =>
//                       setNewUser({ ...newUser, displayName: e.target.value })
//                     }
//                     className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11"
//                   />
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="create-email">Email *</Label>
//                 <div className="relative">
//                   <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
//                   <Input
//                     id="create-email"
//                     type="email"
//                     placeholder="user@example.com"
//                     value={newUser.email}
//                     onChange={(e) =>
//                       setNewUser({ ...newUser, email: e.target.value })
//                     }
//                     className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11"
//                   />
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="create-role">Role *</Label>
//                 <select
//                   id="create-role"
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
//                   value={newUser.role}
//                   onChange={(e) =>
//                     setNewUser({ ...newUser, role: e.target.value })
//                   }
//                 >
//                   <option value="">Select role</option>
//                   {roles.map((role) => (
//                     <option key={role.id} value={role.id}>
//                       {role.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div className="space-y-2">
//                 <Label>Mobile Country Code *</Label>
//                 <div className="relative">
//                   <Smartphone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
//                   <Input
//                     placeholder="+92"
//                     value={newUser.mobileCountryCode}
//                     onChange={(e) =>
//                       setNewUser({
//                         ...newUser,
//                         mobileCountryCode: e.target.value,
//                       })
//                     }
//                     className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11"
//                   />
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Label>Mobile No *</Label>
//                 <div className="relative">
//                   <Smartphone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
//                   <Input
//                     placeholder="3001234567"
//                     value={newUser.mobileNo}
//                     onChange={(e) =>
//                       setNewUser({ ...newUser, mobileNo: e.target.value })
//                     }
//                     className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11"
//                   />
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Label>Region *</Label>
//                 <div className="relative">
//                   <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
//                   <Input
//                     placeholder="Karachi / Lahore / Islamabad"
//                     value={newUser.region}
//                     onChange={(e) =>
//                       setNewUser({ ...newUser, region: e.target.value })
//                     }
//                     className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11"
//                   />
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Label>Reporting to</Label>
//                 <div className="relative">
//                   <Users className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
//                   <Input
//                     placeholder="Manager name / email"
//                     value={newUser.reportingTo}
//                     onChange={(e) =>
//                       setNewUser({ ...newUser, reportingTo: e.target.value })
//                     }
//                     className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11"
//                   />
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Label>Financial Limit</Label>
//                 <div className="relative">
//                   <WalletCards className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
//                   <Input
//                     type="number"
//                     placeholder="0"
//                     value={newUser.financialLimit}
//                     onChange={(e) =>
//                       setNewUser({ ...newUser, financialLimit: e.target.value })
//                     }
//                     className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11"
//                   />
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Label>Designation *</Label>
//                 <div className="relative">
//                   <BriefcaseBusiness className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
//                   <Input
//                     placeholder="Sales Executive"
//                     value={newUser.designation}
//                     onChange={(e) =>
//                       setNewUser({ ...newUser, designation: e.target.value })
//                     }
//                     className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11"
//                   />
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Label>Department *</Label>
//                 <div className="relative">
//                   <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
//                   <Input
//                     placeholder="Sales"
//                     value={newUser.department}
//                     onChange={(e) =>
//                       setNewUser({ ...newUser, department: e.target.value })
//                     }
//                     className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11"
//                   />
//                 </div>
//               </div>

//               <div className="space-y-2 md:col-span-2 xl:col-span-2">
//                 <Label htmlFor="create-password">Password *</Label>
//                 <div className="flex gap-2">
//                   <Input
//                     id="create-password"
//                     type={showPassword ? "text" : "password"}
//                     placeholder="min 6 characters"
//                     value={newUser.password}
//                     onChange={(e) =>
//                       setNewUser({ ...newUser, password: e.target.value })
//                     }
//                     className="h-11 rounded-2xl border-slate-200 bg-slate-50"
//                   />
//                   <Button
//                     type="button"
//                     variant="outline"
//                     onClick={() => setShowPassword((previous) => !previous)}
//                     className="h-11 rounded-2xl border-slate-200 bg-white px-5"
//                   >
//                     {showPassword ? "Hide" : "Show"}
//                   </Button>
//                 </div>
//                 <p className="text-xs text-slate-500">
//                   Password can be shown only while creating. It won’t be stored
//                   or retrievable later.
//                 </p>
//               </div>
//             </div>
//           </div>

//           <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
//             <Button
//               variant="outline"
//               onClick={() => setShowCreateUser(false)}
//               className="rounded-xl bg-white"
//             >
//               Cancel
//             </Button>
//             <Button
//               onClick={handleCreateUser}
//               disabled={creating}
//               className="rounded-xl bg-slate-950 text-white hover:bg-slate-800 disabled:opacity-60"
//             >
//               {creating ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Creating...
//                 </>
//               ) : (
//                 <>
//                   <UserPlus className="mr-2 h-4 w-4" />
//                   Create User
//                 </>
//               )}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

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
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { db, secondaryAuth } from "@/lib/firebase";
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
import {
  Archive,
  BarChart3,
  BedDouble,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  FileText,
  HandCoins,
  Hotel,
  LayoutDashboard,
  LineChart,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  PieChart,
  PlaneTakeoff,
  Plus,
  Power,
  PowerOff,
  Receipt,
  Scroll,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserCog,
  UserPlus,
  Users,
  WalletCards,
  XCircle,
  CalendarCheck,
  ReceiptText,
} from "lucide-react";

// --------------------
// Sidebar / Static Tabs
// --------------------
const AVAILABLE_TABS = [
  { path: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  {
    path: "/account-statement",
    label: "Account Statement",
    icon: "LayoutDashboard",
  },
  { path: "/sales-dashboard", label: "Sales Dashboard", icon: "LineChart" },
  { path: "/project", label: "Project", icon: "BarChart3" },
  { path: "/clients", label: "Clients", icon: "Users" },
  { path: "/accounts", label: "Account ledger", icon: "WalletCards" },
  { path: "/expenses", label: "Expense Sheets", icon: "Receipt" },
  { path: "/budget-requests", label: "Budget Request", icon: "HandCoins" },
  { path: "/finance", label: "Finance", icon: "Receipt" },
  { path: "/operation", label: "Operation", icon: "Settings" },
  { path: "/estimate", label: "Estimates", icon: "Scroll" },
  { path: "/sales-management", label: "Sales Management", icon: "PieChart" },
  { path: "/travel/hotel", label: "Travel", icon: "PlaneTakeoff" },
  { path: "/invoice-estimate", label: "Invoice Estimates", icon: "ScrollText" },
  { path: "/usertravel", label: "Book Hotel", icon: "BedDouble" },
  { path: "/booking", label: "Bookings", icon: "Hotel" },
  { path: "/suppliers", label: "Suppliers", icon: "BookUser" },
  { path: "/task-calendar", label: "Task Calendar", icon: "CalendarCheck" },
  { path: "/reimbursement", label: "Reimbursement", icon: "HandCoins" },
  { path: "/purchase-orders", label: "Purchase Orders", icon: "ReceiptText" },
  {
    path: "/claim-reimbursement",
    label: "Claim Reimbursement",
    icon: "ReceiptText",
  },
];

const PANEL_ID = "IEDGE-SYSTEM";
const USERS_PER_PAGE = 8;

const iconMap: Record<string, any> = {
  LayoutDashboard,
  LineChart,
  BarChart3,
  Users,
  Archive,
  CreditCard,
  Receipt,
  HandCoins,
  Settings,
  Scroll,
  PieChart,
  PlaneTakeoff,
  ScrollText,
  BedDouble,
  Hotel,
  FileText,
  CalendarCheck,
  ReceiptText,
};

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
  mobileCountryCode?: string;
  mobileNo?: string;
  region?: string;
  reportingTo?: string;
  financialLimit?: number;
  designation?: string;
  department?: string;
  canViewAllBudgetRequests?: boolean;
}

// --------------------
// Small UI helpers
// --------------------
function formatDate(value: any) {
  if (!value) return "-";
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function money(value?: number) {
  return Number(value ?? 0).toLocaleString("en-PK");
}

function getRoleKey(role?: string) {
  return String(role || "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");
}

function isOperationRole(role?: string) {
  const roleKey = getRoleKey(role);
  return ["operation", "operations"].includes(roleKey);
}

function InfoRow({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value || "-"}
      </p>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
      <div className="mb-3 rounded-2xl bg-white p-3 shadow-sm">
        <Users className="h-5 w-5 text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-1 max-w-md text-xs text-slate-500">{description}</p>
    </div>
  );
}

function StatusBadge({ active }: { active?: boolean }) {
  return active ? (
    <Badge className="border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700 hover:bg-emerald-50">
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Active
    </Badge>
  ) : (
    <Badge className="border border-rose-200 bg-rose-50 px-2.5 py-1 text-rose-700 hover:bg-rose-50">
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
      Inactive
    </Badge>
  );
}

function PermissionBadge({ label, icon }: { label: string; icon?: string }) {
  const Icon = icon ? iconMap[icon] : undefined;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
      {Icon ? <Icon className="h-3.5 w-3.5 text-slate-400" /> : null}
      {label}
    </span>
  );
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

  // filters / pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeUserPage, setActiveUserPage] = useState(1);

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
    financialLimit: "",
    designation: "",
    department: "",
    canViewAllBudgetRequests: false,
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

  async function toggleBudgetRequestViewPermission(user: User, checked: any) {
    const canViewAllBudgetRequests = checked === true;

    try {
      await updateDoc(doc(db, "Panels", PANEL_ID, "users", user.id), {
        canViewAllBudgetRequests,
        updatedAt: new Date(),
      });

      toast({
        title: "Permission Updated",
        description: canViewAllBudgetRequests
          ? `${user.displayName || "User"} can now view all budget requests.`
          : `${user.displayName || "User"} can now view only their own budget requests.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err.message || "Failed to update budget request permission.",
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

  const getRoleName = (roleValue?: string) => {
    if (!roleValue) return "-";
    return (
      roles.find((role) => role.id === roleValue || role.name === roleValue)
        ?.name ?? roleValue
    );
  };

  const getPermissionMeta = (item: any) => {
    const path = typeof item === "string" ? item : (item.path ?? item);
    const match = AVAILABLE_TABS.find((tab) => tab.path === path);
    return {
      path,
      label: match?.label ?? path,
      icon: match?.icon,
    };
  };

  const inactiveUsersCount = activeUsers.filter(
    (user) => !user.isActive,
  ).length;
  const filteredActiveUsers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return activeUsers.filter((user) => {
      const matchesSearch =
        !keyword ||
        user.displayName?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword) ||
        user.department?.toLowerCase().includes(keyword) ||
        user.designation?.toLowerCase().includes(keyword) ||
        getRoleName(user.role).toLowerCase().includes(keyword);

      const matchesRole =
        roleFilter === "all" ||
        user.role === roleFilter ||
        getRoleName(user.role) === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.isActive) ||
        (statusFilter === "inactive" && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [activeUsers, searchTerm, roleFilter, statusFilter, roles]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredActiveUsers.length / USERS_PER_PAGE),
  );
  const paginatedActiveUsers = filteredActiveUsers.slice(
    (activeUserPage - 1) * USERS_PER_PAGE,
    activeUserPage * USERS_PER_PAGE,
  );

  useEffect(() => {
    setActiveUserPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

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
        canViewAllBudgetRequests: isOperationRole(newUser.role)
          ? Boolean(newUser.canViewAllBudgetRequests)
          : false,
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
        canViewAllBudgetRequests: false,
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
      ).map((t) => ({
        path: t.path,
        label: t.label,
        icon: t.icon,
      }));

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
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50">
            <ShieldCheck className="h-7 w-7 text-rose-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-slate-500">
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eef6ff,transparent_30%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] p-4 text-slate-900">
      <div className="mx-auto space-y-8">
        {/* Header */}
        <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/85 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-4xl">
                User Management
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Manage users, approvals, roles, and page-level permissions from
                one clean dashboard.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => setShowCreateRole(true)}
                className="h-11 rounded-2xl border-slate-200 bg-white px-5 shadow-sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Role
              </Button>
              <Button
                onClick={() => setShowCreateUser(true)}
                className="h-11 rounded-2xl bg-slate-950 px-5 text-white shadow-sm hover:bg-slate-800"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Create User
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-[1.75rem] border-slate-200/80 bg-white/90 shadow-sm">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Approved Users
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-950">
                  {activeUsers.length}
                </p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-slate-200/80 bg-white/90 shadow-sm">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Pending Requests
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-950">
                  {pendingUsers.length}
                </p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-3">
                <UserCog className="h-6 w-6 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-slate-200/80 bg-white/90 shadow-sm">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Inactive Users
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-950">
                  {inactiveUsersCount}
                </p>
              </div>
              <div className="rounded-2xl bg-rose-50 p-3">
                <PowerOff className="h-6 w-6 text-rose-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-slate-200/80 bg-white/90 shadow-sm">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Total Roles
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-950">
                  {roles.length}
                </p>
              </div>
              <div className="rounded-2xl bg-violet-50 p-3">
                <ShieldCheck className="h-6 w-6 text-violet-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Users */}
        {/* <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-950">Pending Approvals</h2>
              <p className="text-sm text-slate-500">Review new account requests before activation.</p>
            </div>
          </div>

          <Card className="rounded-[2rem] border-slate-200/80 bg-white/90 shadow-sm">
            <CardContent className="p-4 md:p-5">
              {pendingUsers.length === 0 ? (
                <EmptyState title="No pending users" description="New registration requests will appear here for approval or rejection." />
              ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {pendingUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-slate-50/60 p-4 transition hover:bg-white hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-bold text-slate-700 shadow-sm">
                          {(user.displayName || user.email || "U").slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{user.displayName || "Unnamed User"}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{user.email || "-"}</p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                            <span className="rounded-full bg-white px-2 py-1 shadow-sm">{getRoleName(user.role)}</span>
                            <span className="rounded-full bg-white px-2 py-1 shadow-sm">{formatDate(user.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveUser(user)}
                          className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="mr-1.5 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectUser(user)}
                          className="rounded-xl border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
                        >
                          <XCircle className="mr-1.5 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section> */}

        {/* User Accounts */}
        <section className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-950">
                Active User Accounts
              </h2>
              <p className="text-sm text-slate-500">
                Search, filter, view details, activate/deactivate, or delete
                users.
              </p>
            </div>
          </div>

          <Card className="overflow-hidden rounded-[2rem] border-slate-200/80 bg-white/90 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-white/80 p-4 md:p-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_180px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, email, role, department..."
                    className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11 shadow-none focus-visible:ring-slate-300"
                  />
                </div>

                <select
                  className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">All roles</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>

                <select
                  className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {paginatedActiveUsers.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    title="No users found"
                    description="Try clearing your filters or search with another keyword."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1120px] text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-400">
                        <th className="px-5 py-4 font-semibold">User</th>
                        <th className="px-5 py-4 font-semibold">Role</th>
                        <th className="px-5 py-4 font-semibold">Department</th>
                        <th className="px-5 py-4 font-semibold">Created</th>
                        <th className="px-5 py-4 font-semibold">Status</th>
                        <th className="px-5 py-4 font-semibold">
                          Budget Requests
                        </th>
                        <th className="px-5 py-4 text-right font-semibold">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedActiveUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="bg-white transition hover:bg-slate-50/80"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-700">
                                {(user.displayName || user.email || "U")
                                  .slice(0, 1)
                                  .toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {user.displayName || "-"}
                                </p>
                                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                                  <Mail className="h-3.5 w-3.5" />
                                  {user.email || "-"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <Badge className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-blue-700 hover:bg-blue-50">
                              {getRoleName(user.role)}
                            </Badge>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm font-medium text-slate-700">
                              {user.department || "-"}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-400">
                              {user.designation || "-"}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-500">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge active={user.isActive} />
                          </td>
                          <td className="px-5 py-4">
                            {isOperationRole(user.role) ? (
                              <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
                                <Checkbox
                                  checked={Boolean(
                                    user.canViewAllBudgetRequests,
                                  )}
                                  onCheckedChange={(checked) =>
                                    toggleBudgetRequestViewPermission(
                                      user,
                                      checked,
                                    )
                                  }
                                  className="border-slate-300"
                                />
                                <span>
                                  {user.canViewAllBudgetRequests
                                    ? "Can view all"
                                    : "Own only"}
                                </span>
                              </label>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                                Role based
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setViewUser(user)}
                                className="rounded-xl border-slate-200 bg-white"
                              >
                                <Eye className="mr-1.5 h-4 w-4" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleUserStatus(user)}
                                className={
                                  user.isActive
                                    ? "rounded-xl border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                    : "rounded-xl border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                }
                              >
                                {user.isActive ? (
                                  <PowerOff className="mr-1.5 h-4 w-4" />
                                ) : (
                                  <Power className="mr-1.5 h-4 w-4" />
                                )}
                                {user.isActive ? "Deactivate" : "Activate"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUserClick(user.id)}
                                className="rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  Showing{" "}
                  {filteredActiveUsers.length === 0
                    ? 0
                    : (activeUserPage - 1) * USERS_PER_PAGE + 1}{" "}
                  to{" "}
                  {Math.min(
                    activeUserPage * USERS_PER_PAGE,
                    filteredActiveUsers.length,
                  )}{" "}
                  of {filteredActiveUsers.length} users
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={activeUserPage === 1}
                    onClick={() =>
                      setActiveUserPage((page) => Math.max(1, page - 1))
                    }
                    className="rounded-xl border-slate-200 bg-white disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                    Page {activeUserPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={activeUserPage === totalPages}
                    onClick={() =>
                      setActiveUserPage((page) =>
                        Math.min(totalPages, page + 1),
                      )
                    }
                    className="rounded-xl border-slate-200 bg-white disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Roles & Permissions */}
        <section className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-950">
                Roles & Permissions
              </h2>
              <p className="text-sm text-slate-500">
                Control which modules each role can access.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowCreateRole(true)}
              className="h-10 rounded-2xl border-slate-200 bg-white shadow-sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Role
            </Button>
          </div>

          {displayRoles.length === 0 ? (
            <Card className="rounded-[2rem] border-slate-200/80 bg-white/90 p-5 shadow-sm">
              <EmptyState
                title="No roles found"
                description="Create a new role and assign the required sidebar permissions."
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {displayRoles.map((role) => (
                <Card
                  key={role.id}
                  className="rounded-[2rem] border-slate-200/80 bg-white/90 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <CardHeader className="border-b border-slate-100 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
                          <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold text-slate-950">
                            {role.name}
                          </CardTitle>
                          <p className="mt-1 text-sm text-slate-500">
                            {role.description || "No description added"}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              {role.users ?? 0} users
                            </span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              {Array.isArray(role.items)
                                ? role.items.length
                                : 0}{" "}
                              permissions
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditRole(role)}
                          className="rounded-xl border-slate-200 bg-white"
                        >
                          <Pencil className="mr-1.5 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRoleToDelete(role);
                            setShowDeletePopup(true);
                          }}
                          className="rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-5 p-5">
                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Enabled Modules
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(role.items) && role.items.length > 0 ? (
                          role.items.map((item: any, idx: number) => {
                            const meta = getPermissionMeta(item);
                            return (
                              <PermissionBadge
                                key={`${meta.path}-${idx}`}
                                label={meta.label}
                                icon={meta.icon}
                              />
                            );
                          })
                        ) : (
                          <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-400">
                            No tabs enabled
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Users In This Role
                      </p>
                      {role.usersList && role.usersList.length > 0 ? (
                        <div className="space-y-2">
                          {role.usersList.slice(0, 5).map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2"
                            >
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-xs font-bold text-slate-700 shadow-sm">
                                  {(user.displayName || user.email || "U")
                                    .slice(0, 1)
                                    .toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-800">
                                    {user.displayName || "-"}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {user.email || "-"}
                                  </p>
                                </div>
                              </div>
                              <StatusBadge active={user.isActive} />
                            </div>
                          ))}
                          {role.usersList.length > 5 ? (
                            <p className="text-xs text-slate-400">
                              +{role.usersList.length - 5} more users
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-400">
                          No users assigned
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* FINAL CONFIRM DELETE USER CONFIRMATION */}
      <Dialog open={confirmDeleteUser} onOpenChange={setConfirmDeleteUser}>
        <DialogContent className="rounded-[2rem] border-slate-200 p-0 shadow-xl sm:max-w-md">
          <div className="p-6">
            <DialogHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50">
                <Trash2 className="h-6 w-6 text-rose-600" />
              </div>
              <DialogTitle className="text-xl font-bold text-slate-950">
                Delete this account?
              </DialogTitle>
            </DialogHeader>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              This user account will be removed from Firestore. This action
              cannot be undone.
            </p>
          </div>

          <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteUser(false)}
              className="rounded-xl bg-white"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteUserNow}
              className="rounded-xl"
            >
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Role */}
      <Dialog open={showDeletePopup} onOpenChange={setShowDeletePopup}>
        <DialogContent className="rounded-[2rem] border-slate-200 p-0 shadow-xl sm:max-w-md">
          <div className="p-6">
            <DialogHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50">
                <Trash2 className="h-6 w-6 text-rose-600" />
              </div>
              <DialogTitle className="text-xl font-bold text-slate-950">
                Delete role?
              </DialogTitle>
            </DialogHeader>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-800">
                {roleToDelete?.name}
              </span>
              ? This will remove the role permissions document.
            </p>
          </div>

          <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeletePopup(false);
                setRoleToDelete(null);
              }}
              className="rounded-xl bg-white"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!roleToDelete) return;
                await deleteRoleDocOnly(roleToDelete.id);
                setShowDeletePopup(false);
                setRoleToDelete(null);
              }}
              className="rounded-xl"
            >
              Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Details */}
      <Dialog
        open={!!viewUser}
        onOpenChange={(open) => !open && setViewUser(null)}
      >
        <DialogContent className="max-w-3xl rounded-[2rem] border-slate-200 p-0 shadow-xl">
          <div className="border-b border-slate-100 p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl font-bold text-slate-950">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
                  {(viewUser?.displayName || viewUser?.email || "U")
                    .slice(0, 1)
                    .toUpperCase()}
                </span>
                User Details
              </DialogTitle>
            </DialogHeader>
          </div>

          {viewUser && (
            <div className="space-y-5 p-6">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <InfoRow label="Full Name" value={viewUser.displayName} />
                <InfoRow label="Email" value={viewUser.email} />
                <InfoRow label="Role" value={getRoleName(viewUser.role)} />
                <InfoRow
                  label="Mobile"
                  value={`${viewUser.mobileCountryCode || ""} ${viewUser.mobileNo || ""}`.trim()}
                />
                <InfoRow label="Region" value={viewUser.region} />
                <InfoRow label="Reporting To" value={viewUser.reportingTo} />
                <InfoRow label="Designation" value={viewUser.designation} />
                <InfoRow label="Department" value={viewUser.department} />
                <InfoRow
                  label="Financial Limit"
                  value={money(viewUser.financialLimit)}
                />
                {isOperationRole(viewUser.role) && (
                  <InfoRow
                    label="Budget Request Access"
                    value={
                      viewUser.canViewAllBudgetRequests
                        ? "Can view all budget requests"
                        : "Own budget requests only"
                    }
                  />
                )}
              </div>

              <div className="rounded-3xl border border-amber-100 bg-amber-50/70 p-4 text-sm leading-6 text-amber-800">
                Passwords cannot be viewed or retrieved from Firebase Auth. If
                needed, implement an admin password reset flow instead.
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setViewUser(null)}
              className="rounded-xl bg-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Modal */}
      <Dialog
        open={!!editingRole}
        onOpenChange={(open) => !open && setEditingRole(null)}
      >
        <DialogContent className="max-w-3xl rounded-[2rem] border-slate-200 p-0 shadow-xl">
          <div className="border-b border-slate-100 p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-950">
                Edit Permissions: {editingRole?.name}
              </DialogTitle>
            </DialogHeader>
            <p className="mt-2 text-sm text-slate-500">
              Select the modules this role can access.
            </p>
          </div>

          <div className="grid max-h-[60vh] grid-cols-1 gap-3 overflow-y-auto p-6 md:grid-cols-2">
            {AVAILABLE_TABS.map((tab) => {
              const Icon = iconMap[tab.icon];
              const checked = selectedTabs.includes(tab.path);

              return (
                <label
                  key={tab.path}
                  className={
                    checked
                      ? "flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-300 bg-slate-950 p-4 text-white shadow-sm transition"
                      : "flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-700 transition hover:bg-slate-50"
                  }
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(isChecked) => {
                      if (isChecked) {
                        setSelectedTabs((prev) =>
                          Array.from(new Set([...prev, tab.path])),
                        );
                      } else {
                        setSelectedTabs((prev) =>
                          prev.filter((p) => p !== tab.path),
                        );
                      }
                    }}
                    className="border-slate-300"
                  />
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                    {Icon ? (
                      <Icon className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">
                      {tab.label}
                    </span>
                    <span
                      className={
                        checked
                          ? "block text-xs text-slate-300"
                          : "block text-xs text-slate-400"
                      }
                    >
                      {tab.path}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>

          <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setEditingRole(null)}
              className="rounded-xl bg-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="rounded-xl bg-slate-950 text-white hover:bg-slate-800"
            >
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Role Modal */}
      <Dialog open={showCreateRole} onOpenChange={setShowCreateRole}>
        <DialogContent className="rounded-[2rem] border-slate-200 p-0 shadow-xl sm:max-w-lg">
          <div className="border-b border-slate-100 p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-950">
                Create New Role
              </DialogTitle>
            </DialogHeader>
            <p className="mt-2 text-sm text-slate-500">
              Add a new role, then assign permissions from the edit option.
            </p>
          </div>

          <div className="space-y-4 p-6">
            <div className="space-y-2">
              <Label>Role Name</Label>
              <Input
                value={newRole.name}
                onChange={(e) =>
                  setNewRole({ ...newRole, name: e.target.value })
                }
                placeholder="e.g. HR Manager"
                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={newRole.description}
                onChange={(e) =>
                  setNewRole({ ...newRole, description: e.target.value })
                }
                placeholder="Short description"
                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateRole(false)}
              className="rounded-xl bg-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRole}
              className="rounded-xl bg-slate-950 text-white hover:bg-slate-800"
            >
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Modal */}
      <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <DialogContent className="max-w-5xl rounded-[2rem] border-slate-200 p-0 shadow-xl">
          <div className="border-b border-slate-100 p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl font-bold text-slate-950">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <UserPlus className="h-5 w-5" />
                </span>
                Create New User
              </DialogTitle>
            </DialogHeader>
            <p className="mt-2 text-sm text-slate-500">
              Create a Firebase Auth account and save the user profile under
              this panel.
            </p>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="create-name">Full name *</Label>
                <div className="relative">
                  <UserCog className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="create-name"
                    placeholder="Enter full name"
                    value={newUser.displayName}
                    onChange={(e) =>
                      setNewUser({ ...newUser, displayName: e.target.value })
                    }
                    className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-email">Email *</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="create-email"
                    type="email"
                    placeholder="user@example.com"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-role">Role *</Label>
                <select
                  id="create-role"
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                  value={newUser.role}
                  onChange={(e) => {
                    const selectedRole = e.target.value;

                    setNewUser((previous) => ({
                      ...previous,
                      role: selectedRole,
                      canViewAllBudgetRequests: isOperationRole(selectedRole)
                        ? previous.canViewAllBudgetRequests
                        : false,
                    }));
                  }}
                >
                  <option value="">Select role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              {isOperationRole(newUser.role) && (
                <div className="space-y-2 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 md:col-span-2 xl:col-span-3">
                  <label className="flex cursor-pointer items-start gap-3">
                    <Checkbox
                      checked={Boolean(newUser.canViewAllBudgetRequests)}
                      onCheckedChange={(checked) =>
                        setNewUser((previous) => ({
                          ...previous,
                          canViewAllBudgetRequests: checked === true,
                        }))
                      }
                      className="mt-0.5 border-slate-300"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-800">
                        Can View All Budget Requests
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">
                        Enable this only for Operation users who should be able
                        to view details of all budget requests. If disabled,
                        they will only see their own requests.
                      </span>
                    </span>
                  </label>
                </div>
              )}

              <div className="space-y-2">
                <Label>Mobile Country Code *</Label>
                <div className="relative">
                  <Smartphone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="+92"
                    value={newUser.mobileCountryCode}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        mobileCountryCode: e.target.value,
                      })
                    }
                    className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mobile No *</Label>
                <div className="relative">
                  <Smartphone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="3001234567"
                    value={newUser.mobileNo}
                    onChange={(e) =>
                      setNewUser({ ...newUser, mobileNo: e.target.value })
                    }
                    className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Region *</Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Karachi / Lahore / Islamabad"
                    value={newUser.region}
                    onChange={(e) =>
                      setNewUser({ ...newUser, region: e.target.value })
                    }
                    className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reporting to</Label>
                <div className="relative">
                  <Users className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Manager name / email"
                    value={newUser.reportingTo}
                    onChange={(e) =>
                      setNewUser({ ...newUser, reportingTo: e.target.value })
                    }
                    className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Financial Limit</Label>
                <div className="relative">
                  <WalletCards className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="number"
                    placeholder="0"
                    value={newUser.financialLimit}
                    onChange={(e) =>
                      setNewUser({ ...newUser, financialLimit: e.target.value })
                    }
                    className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Designation *</Label>
                <div className="relative">
                  <BriefcaseBusiness className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Sales Executive"
                    value={newUser.designation}
                    onChange={(e) =>
                      setNewUser({ ...newUser, designation: e.target.value })
                    }
                    className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Department *</Label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Sales"
                    value={newUser.department}
                    onChange={(e) =>
                      setNewUser({ ...newUser, department: e.target.value })
                    }
                    className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2 xl:col-span-2">
                <Label htmlFor="create-password">Password *</Label>
                <div className="flex gap-2">
                  <Input
                    id="create-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="min 6 characters"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                    className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="h-11 rounded-2xl border-slate-200 bg-white px-5"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  Password can be shown only while creating. It won’t be stored
                  or retrievable later.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateUser(false)}
              className="rounded-xl bg-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={creating}
              className="rounded-xl bg-slate-950 text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
