// "use client";

// import { useEffect, useMemo, useState } from "react";
// import {
//   collection,
//   deleteDoc,
//   doc,
//   onSnapshot,
//   query,
//   setDoc,
//   updateDoc,
//   where,
// } from "firebase/firestore";
// import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
// import { db, secondaryAuth } from "@/lib/firebase";
// import { useAuth } from "@/contexts/AuthContext";
// import { useToast } from "@/hooks/use-toast";
// import {
//   Dialog,
//   DialogContent,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader } from "@/components/ui/card";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   type BudgetApprovalLevel,
//   type BudgetApprovalWorkflowConfig,
//   type BudgetRequestVisibility,
//   type RoleBudgetRequestVisibility,
//   createApprovalLevel,
//   enrichApprovalLevelsWithRoleMetadata,
//   normalizeWorkflowKey,
//   sanitizeApprovalLevels,
// } from "@/lib/budgetApprovalWorkflow";
// import {
//   Archive,
//   BarChart3,
//   BedDouble,
//   BookUser,
//   CalendarCheck,
//   ChevronDown,
//   ChevronLeft,
//   ChevronRight,
//   ChevronUp,
//   CreditCard,
//   Eye,
//   FileText,
//   HandCoins,
//   Hotel,
//   LayoutDashboard,
//   LineChart,
//   Loader2,
//   Mail,
//   Pencil,
//   PieChart,
//   PlaneTakeoff,
//   Plus,
//   Power,
//   PowerOff,
//   Receipt,
//   ReceiptText,
//   Scroll,
//   ScrollText,
//   Search,
//   Settings,
//   ShieldCheck,
//   Trash2,
//   UserPlus,
//   Users,
//   WalletCards,
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
//   { path: "/records", label: "Records", icon: "Archive" },
// ];

// const PANEL_ID = "IEDGE-SYSTEM";
// const USERS_PER_PAGE = 8;
// const PURCHASE_ORDER_PATH = "/purchase-orders";
// const PURCHASE_ORDER_WORKFLOW_CONFIG_ID = "purchase_order_approval";

// type PurchaseOrderVisibility = "own" | "all";

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
//   BookUser,
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
//   budgetRequestVisibility?: RoleBudgetRequestVisibility;
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
//   canViewAllBudgetRequests?: boolean;
//   budgetRequestVisibility?: BudgetRequestVisibility;
//   canViewAllPurchaseOrders?: boolean;
//   purchaseOrderVisibility?: PurchaseOrderVisibility;
// }

// type BudgetRoleOption = {
//   id: string;
//   key: string;
//   name: string;
// };

// type BudgetRoleWorkflowConfig = BudgetApprovalWorkflowConfig & {
//   budgetRole?: string;
//   budgetRoleId?: string;
//   budgetRoleKey?: string;
//   workflowScope?: "role";
// };

// function getBudgetRoleWorkflowConfigId(roleValue: any): string {
//   const roleKey = normalizeWorkflowKey(roleValue);
//   return roleKey ? `budgetRequests__role__${roleKey}` : "budgetRequests__role";
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

// function canRoleAccessPurchaseOrders(role?: Pick<Role, "id" | "name"> | null) {
//   return Boolean(role?.id || role?.name);
// }

// function canUserApprovePurchaseOrders(user: User, _roles: Role[]) {
//   return user.isActive !== false;
// }

// function getBudgetVisibilityLabel(value?: BudgetRequestVisibility) {
//   switch (value) {
//     case "all":
//       return "View all requests";
//     case "assigned":
//       return "Own + assigned approvals";
//     case "own":
//       return "Own requests only";
//     case "role":
//     default:
//       return "Use role default";
//   }
// }

// function getPurchaseOrderVisibilityLabel(value?: PurchaseOrderVisibility) {
//   return value === "all" ? "View all POs" : "Own / assigned POs";
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

//   // Role-specific Budget Request approval workflow
//   const [budgetWorkflow, setBudgetWorkflow] =
//     useState<BudgetRoleWorkflowConfig>({
//       module: "budget_requests",
//       budgetRole: "",
//       budgetRoleId: "",
//       budgetRoleKey: "",
//       workflowScope: "role",
//       enabled: true,
//       version: 0,
//       levels: [],
//     });
//   const [selectedBudgetRoleKey, setSelectedBudgetRoleKey] = useState("");
//   const [savingWorkflow, setSavingWorkflow] = useState(false);

//   // dynamic Purchase Order approval workflow
//   const [purchaseOrderWorkflow, setPurchaseOrderWorkflow] =
//     useState<BudgetApprovalWorkflowConfig>({
//       module: "purchase_orders",
//       enabled: true,
//       version: 0,
//       levels: [],
//     } as any);
//   const [savingPurchaseOrderWorkflow, setSavingPurchaseOrderWorkflow] =
//     useState(false);

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
//   const [showPassword, setShowPassword] = useState(false);
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
//     budgetRequestVisibility: "role" as BudgetRequestVisibility,
//     purchaseOrderVisibility: "own" as PurchaseOrderVisibility,
//   });

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
//         description: `${user.displayName || "User"} is now ${
//           !user.isActive ? "Active" : "Inactive"
//         }.`,
//       });
//     } catch (err: any) {
//       toast({
//         title: "Error",
//         description: err.message,
//         variant: "destructive",
//       });
//     }
//   }

//   async function updateBudgetRequestVisibility(
//     user: User,
//     budgetRequestVisibility: BudgetRequestVisibility,
//   ) {
//     try {
//       await updateDoc(doc(db, "Panels", PANEL_ID, "users", user.id), {
//         budgetRequestVisibility,
//         canViewAllBudgetRequests: budgetRequestVisibility === "all",
//         updatedAt: new Date(),
//       });

//       toast({
//         title: "Permission Updated",
//         description: `${user.displayName || "User"}'s Budget Request access has been updated.`,
//       });
//     } catch (err: any) {
//       toast({
//         title: "Error",
//         description:
//           err.message || "Failed to update budget request permission.",
//         variant: "destructive",
//       });
//     }
//   }

//   async function updatePurchaseOrderVisibility(
//     user: User,
//     purchaseOrderVisibility: PurchaseOrderVisibility,
//   ) {
//     try {
//       await updateDoc(doc(db, "Panels", PANEL_ID, "users", user.id), {
//         purchaseOrderVisibility,
//         canViewAllPurchaseOrders: purchaseOrderVisibility === "all",
//         updatedAt: new Date(),
//       });

//       toast({
//         title: "Permission Updated",
//         description: `${user.displayName || "User"}'s Purchase Order access has been updated.`,
//       });
//     } catch (err: any) {
//       toast({
//         title: "Error",
//         description:
//           err.message || "Failed to update Purchase Order permission.",
//         variant: "destructive",
//       });
//     }
//   }

//   function updateApprovalLevel(
//     levelId: string,
//     patch: Partial<BudgetApprovalLevel>,
//   ) {
//     setBudgetWorkflow((previous) => ({
//       ...previous,
//       levels: previous.levels.map((level) =>
//         level.id === levelId ? { ...level, ...patch } : level,
//       ),
//     }));
//   }

//   function moveApprovalLevel(levelId: string, direction: -1 | 1) {
//     setBudgetWorkflow((previous) => {
//       const levels = [...previous.levels];
//       const currentIndex = levels.findIndex((level) => level.id === levelId);
//       const targetIndex = currentIndex + direction;

//       if (currentIndex < 0 || targetIndex < 0 || targetIndex >= levels.length) {
//         return previous;
//       }

//       [levels[currentIndex], levels[targetIndex]] = [
//         levels[targetIndex],
//         levels[currentIndex],
//       ];

//       return { ...previous, levels: sanitizeApprovalLevels(levels) };
//     });
//   }

//   function toggleApprovalLevelAssignment(
//     levelId: string,
//     field: "userIds" | "roleIds",
//     value: string,
//     checked: boolean,
//   ) {
//     setBudgetWorkflow((previous) => ({
//       ...previous,
//       levels: previous.levels.map((level) => {
//         if (level.id !== levelId) return level;

//         const currentValues = Array.isArray(level[field]) ? level[field] : [];
//         const nextValues = checked
//           ? Array.from(new Set([...currentValues, value]))
//           : currentValues.filter((item) => item !== value);

//         return { ...level, [field]: nextValues };
//       }),
//     }));
//   }

//   function updatePurchaseOrderApprovalLevel(
//     levelId: string,
//     patch: Partial<BudgetApprovalLevel>,
//   ) {
//     setPurchaseOrderWorkflow((previous) => ({
//       ...previous,
//       levels: previous.levels.map((level) =>
//         level.id === levelId ? { ...level, ...patch } : level,
//       ),
//     }));
//   }

//   function movePurchaseOrderApprovalLevel(levelId: string, direction: -1 | 1) {
//     setPurchaseOrderWorkflow((previous) => {
//       const levels = [...previous.levels];
//       const currentIndex = levels.findIndex((level) => level.id === levelId);
//       const targetIndex = currentIndex + direction;

//       if (currentIndex < 0 || targetIndex < 0 || targetIndex >= levels.length) {
//         return previous;
//       }

//       [levels[currentIndex], levels[targetIndex]] = [
//         levels[targetIndex],
//         levels[currentIndex],
//       ];

//       return { ...previous, levels: sanitizeApprovalLevels(levels) };
//     });
//   }

//   function togglePurchaseOrderApprovalAssignment(
//     levelId: string,
//     field: "userIds" | "roleIds",
//     value: string,
//     checked: boolean,
//   ) {
//     setPurchaseOrderWorkflow((previous) => ({
//       ...previous,
//       levels: previous.levels.map((level) => {
//         if (level.id !== levelId) return level;

//         const currentValues = Array.isArray(level[field]) ? level[field] : [];
//         const nextValues = checked
//           ? Array.from(new Set([...currentValues, value]))
//           : currentValues.filter((item) => item !== value);

//         return { ...level, [field]: nextValues };
//       }),
//     }));
//   }

//   // --------------------
//   // Load roles from Firestore
//   // --------------------
//   useEffect(() => {
//     const unsubscribe = onSnapshot(
//       collection(db, "Panels", PANEL_ID, "sidebarConfig"),
//       (snapshot) => {
//         const list: Role[] = snapshot.docs.map((item) => {
//           const data = item.data() as any;

//           let items: any[] = data.items ?? [];
//           if (items.length > 0 && typeof items[0] === "object") {
//             items = items.map((entry: any) => entry.path ?? entry);
//           }

//           return {
//             id: item.id,
//             name: data.name ?? data.id ?? item.id,
//             description: data.description ?? "",
//             users: data.users ?? 0,
//             items,
//             budgetRequestVisibility: data.budgetRequestVisibility || "own",
//           } as Role;
//         });

//         setRoles(list);
//       },
//     );

//     return () => unsubscribe();
//   }, []);

//   // --------------------
//   // Load users
//   // --------------------
//   useEffect(() => {
//     const usersRef = collection(db, "Panels", PANEL_ID, "users");

//     const pendingQ = query(usersRef, where("accountStatus", "==", "pending"));
//     const activeQ = query(usersRef, where("accountStatus", "==", "approved"));

//     const unsubPending = onSnapshot(pendingQ, (snapshot) => {
//       setPendingUsers(
//         snapshot.docs.map((item) => ({
//           ...(item.data() as User),
//           id: item.id,
//         })),
//       );
//     });

//     const unsubActive = onSnapshot(activeQ, (snapshot) => {
//       setActiveUsers(
//         snapshot.docs.map((item) => ({
//           ...(item.data() as User),
//           isActive: (item.data() as any)?.isActive ?? true,
//           id: item.id,
//         })),
//       );
//     });

//     return () => {
//       unsubPending();
//       unsubActive();
//     };
//   }, []);

//   // --------------------
//   // Dynamic Budget Role list
//   // --------------------
//   const availableBudgetRoles = useMemo<BudgetRoleOption[]>(() => {
//     return roles
//       .map((role) => ({
//         id: role.id,
//         key: normalizeWorkflowKey(role.id || role.name),
//         name: role.name || role.id,
//       }))
//       .filter((role) => Boolean(role.key))
//       .sort((a, b) => a.name.localeCompare(b.name));
//   }, [roles]);

//   const selectedBudgetRole = useMemo(() => {
//     return (
//       availableBudgetRoles.find((role) => role.key === selectedBudgetRoleKey) ||
//       null
//     );
//   }, [availableBudgetRoles, selectedBudgetRoleKey]);

//   useEffect(() => {
//     if (selectedBudgetRoleKey) return;
//     if (availableBudgetRoles.length === 0) return;

//     setSelectedBudgetRoleKey(availableBudgetRoles[0].key);
//   }, [availableBudgetRoles, selectedBudgetRoleKey]);

//   // --------------------
//   // Load selected Budget Role workflow
//   // --------------------
//   useEffect(() => {
//     if (!selectedBudgetRole) {
//       setBudgetWorkflow({
//         module: "budget_requests",
//         budgetRole: "",
//         budgetRoleId: "",
//         budgetRoleKey: "",
//         workflowScope: "role",
//         enabled: true,
//         version: 0,
//         levels: [],
//       });
//       return;
//     }

//     const budgetRole = selectedBudgetRole.name;
//     const budgetRoleId = selectedBudgetRole.id;
//     const budgetRoleKey = selectedBudgetRole.key;
//     const configId = getBudgetRoleWorkflowConfigId(budgetRoleKey);

//     setBudgetWorkflow({
//       id: configId,
//       module: "budget_requests",
//       budgetRole,
//       budgetRoleId,
//       budgetRoleKey,
//       workflowScope: "role",
//       enabled: true,
//       version: 0,
//       levels: [],
//     });

//     const unsubscribe = onSnapshot(
//       doc(db, "Panels", PANEL_ID, "workflowConfigs", configId),
//       (snapshot) => {
//         if (!snapshot.exists()) {
//           setBudgetWorkflow({
//             id: configId,
//             module: "budget_requests",
//             budgetRole,
//             budgetRoleId,
//             budgetRoleKey,
//             workflowScope: "role",
//             enabled: true,
//             version: 0,
//             levels: [],
//           });
//           return;
//         }

//         const data = snapshot.data() as BudgetRoleWorkflowConfig;

//         setBudgetWorkflow({
//           ...data,
//           id: snapshot.id,
//           module: "budget_requests",
//           budgetRole: String(data?.budgetRole || budgetRole).trim(),
//           budgetRoleId: String(data?.budgetRoleId || budgetRoleId).trim(),
//           budgetRoleKey: normalizeWorkflowKey(
//             data?.budgetRoleKey || data?.budgetRoleId || budgetRoleKey,
//           ),
//           workflowScope: "role",
//           enabled: data.enabled !== false,
//           version: Number(data.version || 1),
//           levels: sanitizeApprovalLevels(data.levels || []),
//         });
//       },
//     );

//     return () => unsubscribe();
//   }, [selectedBudgetRole]);

//   // --------------------
//   // Load dynamic Purchase Order workflow
//   // --------------------
//   useEffect(() => {
//     const unsubscribe = onSnapshot(
//       doc(
//         db,
//         "Panels",
//         PANEL_ID,
//         "workflowConfigs",
//         PURCHASE_ORDER_WORKFLOW_CONFIG_ID,
//       ),
//       (snapshot) => {
//         if (!snapshot.exists()) {
//           setPurchaseOrderWorkflow({
//             module: "purchase_orders",
//             enabled: true,
//             version: 0,
//             levels: [],
//           } as any);
//           return;
//         }

//         const data = snapshot.data() as BudgetApprovalWorkflowConfig;
//         setPurchaseOrderWorkflow({
//           ...data,
//           id: snapshot.id,
//           module: "purchase_orders",
//           enabled: data.enabled !== false,
//           version: Number(data.version || 1),
//           levels: sanitizeApprovalLevels(data.levels || []),
//         } as any);
//       },
//     );

//     return () => unsubscribe();
//   }, []);

//   // --------------------
//   // Save selected Budget Role workflow
//   // --------------------
//   async function saveBudgetWorkflow() {
//     if (!selectedBudgetRole) {
//       toast({
//         title: "Budget Role required",
//         description:
//           "Select a Role before configuring its Budget Request approval workflow.",
//         variant: "destructive",
//       });
//       return;
//     }

//     const budgetRole = selectedBudgetRole.name;
//     const budgetRoleId = selectedBudgetRole.id;
//     const budgetRoleKey = selectedBudgetRole.key;
//     const configId = getBudgetRoleWorkflowConfigId(budgetRoleKey);

//     const levels = enrichApprovalLevelsWithRoleMetadata(
//       sanitizeApprovalLevels(budgetWorkflow.levels),
//       roles,
//       activeUsers,
//     );

//     if (levels.length === 0) {
//       toast({
//         title: "Approval level required",
//         description: `Add at least one approval level for ${budgetRole} before saving.`,
//         variant: "destructive",
//       });
//       return;
//     }

//     const invalidLevel = levels.find(
//       (level) => level.userIds.length === 0 && level.roleIds.length === 0,
//     );

//     if (invalidLevel) {
//       toast({
//         title: "Approver required",
//         description: `${invalidLevel.name} must have at least one assigned user or role.`,
//         variant: "destructive",
//       });
//       return;
//     }

//     setSavingWorkflow(true);

//     try {
//       const nextVersion = Number(budgetWorkflow.version || 0) + 1;

//       await setDoc(
//         doc(db, "Panels", PANEL_ID, "workflowConfigs", configId),
//         {
//           module: "budget_requests",
//           workflowScope: "role",
//           budgetRole,
//           budgetRoleId,
//           budgetRoleKey,
//           enabled: budgetWorkflow.enabled !== false,
//           version: nextVersion,
//           levels,
//           updatedAt: new Date(),
//           updatedBy:
//             userProfile?.displayName ||
//             userProfile?.email ||
//             userProfile?.id ||
//             "",
//         },
//         { merge: true },
//       );

//       setBudgetWorkflow((previous) => ({
//         ...previous,
//         id: configId,
//         module: "budget_requests",
//         workflowScope: "role",
//         budgetRole,
//         budgetRoleId,
//         budgetRoleKey,
//         version: nextVersion,
//         levels,
//       }));

//       toast({
//         title: "Budget Role workflow saved",
//         description: `${budgetRole} Budget Requests will now follow this approval hierarchy.`,
//       });
//     } catch (err: any) {
//       toast({
//         title: "Error",
//         description:
//           err.message || "Failed to save Budget Role approval workflow.",
//         variant: "destructive",
//       });
//     } finally {
//       setSavingWorkflow(false);
//     }
//   }

//   async function savePurchaseOrderWorkflow() {
//     const eligibleRoles = roles;
//     const eligibleUsers = activeUsers.filter((user) =>
//       canUserApprovePurchaseOrders(user, roles),
//     );

//     const levels = enrichApprovalLevelsWithRoleMetadata(
//       sanitizeApprovalLevels(purchaseOrderWorkflow.levels),
//       eligibleRoles,
//       eligibleUsers,
//     );

//     if (levels.length === 0) {
//       toast({
//         title: "Approval level required",
//         description:
//           "Add at least one Purchase Order approval level before saving.",
//         variant: "destructive",
//       });
//       return;
//     }

//     const invalidLevel = levels.find(
//       (level) => level.userIds.length === 0 && level.roleIds.length === 0,
//     );

//     if (invalidLevel) {
//       toast({
//         title: "Eligible approver required",
//         description: `${invalidLevel.name} must have at least one assigned role or user.`,
//         variant: "destructive",
//       });
//       return;
//     }

//     setSavingPurchaseOrderWorkflow(true);

//     try {
//       const nextVersion = Number(purchaseOrderWorkflow.version || 0) + 1;

//       await setDoc(
//         doc(
//           db,
//           "Panels",
//           PANEL_ID,
//           "workflowConfigs",
//           PURCHASE_ORDER_WORKFLOW_CONFIG_ID,
//         ),
//         {
//           module: "purchase_orders",
//           enabled: purchaseOrderWorkflow.enabled !== false,
//           version: nextVersion,
//           levels,
//           updatedAt: new Date(),
//           updatedBy:
//             userProfile?.displayName ||
//             userProfile?.email ||
//             userProfile?.id ||
//             "",
//         },
//         { merge: true },
//       );

//       setPurchaseOrderWorkflow((previous) => ({
//         ...previous,
//         version: nextVersion,
//         levels,
//       }));

//       toast({
//         title: "Workflow saved",
//         description:
//           "Purchase Orders will follow this approval hierarchy for the selected roles and users.",
//       });
//     } catch (err: any) {
//       toast({
//         title: "Error",
//         description: err.message || "Failed to save Purchase Order workflow.",
//         variant: "destructive",
//       });
//     } finally {
//       setSavingPurchaseOrderWorkflow(false);
//     }
//   }

//   // --------------------
//   // Compute displayRoles
//   // --------------------
//   const displayRoles = useMemo(() => {
//     return roles.map((role) => {
//       const usersInRole = activeUsers.filter((user) => {
//         if (!user.role) return false;
//         return user.role === role.id || user.role === role.name;
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
//   // User / Role actions
//   // --------------------
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

//   const handleCreateUser = async () => {
//     if (
//       !newUser.displayName ||
//       !newUser.email ||
//       !newUser.password ||
//       !newUser.role ||
//       !newUser.mobileCountryCode ||
//       !newUser.mobileNo ||
//       !newUser.region ||
//       !newUser.designation
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
//       const credential = await createUserWithEmailAndPassword(
//         secondaryAuth,
//         newUser.email.trim(),
//         newUser.password,
//       );

//       await updateProfile(credential.user, {
//         displayName: newUser.displayName,
//       });

//       await setDoc(doc(db, "Panels", PANEL_ID, "users", credential.user.uid), {
//         displayName: newUser.displayName.trim(),
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
//         budgetRequestVisibility: newUser.budgetRequestVisibility,
//         canViewAllBudgetRequests: newUser.budgetRequestVisibility === "all",
//         purchaseOrderVisibility: newUser.purchaseOrderVisibility,
//         canViewAllPurchaseOrders: newUser.purchaseOrderVisibility === "all",
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
//         budgetRequestVisibility: "role",
//         purchaseOrderVisibility: "own",
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

//   async function handleCreateRole() {
//     if (!newRole.name.trim()) {
//       toast({ title: "Role name required", variant: "destructive" });
//       return;
//     }

//     try {
//       const id = newRole.name.toLowerCase().trim().replace(/\s+/g, "_");

//       await setDoc(doc(db, "Panels", PANEL_ID, "sidebarConfig", id), {
//         id,
//         name: newRole.name.trim(),
//         description: newRole.description.trim(),
//         users: 0,
//         items: [],
//         budgetRequestVisibility: "own",
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

//   const openEditRole = (role: Role) => {
//     const base = roles.find((item) => item.id === role.id) || role;
//     setEditingRole(base);

//     const items = (base.items || []) as any[];
//     const paths = items.map((item) =>
//       typeof item === "string" ? item : item.path || item,
//     );

//     setSelectedTabs(
//       canRoleAccessPurchaseOrders(base)
//         ? paths
//         : paths.filter((path) => path !== PURCHASE_ORDER_PATH),
//     );
//   };

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

//       const allowedSelectedTabs = canRoleAccessPurchaseOrders(editingRole)
//         ? selectedTabs
//         : selectedTabs.filter((path) => path !== PURCHASE_ORDER_PATH);

//       const itemsToSave = AVAILABLE_TABS.filter((tab) =>
//         allowedSelectedTabs.includes(tab.path),
//       ).map((tab) => ({
//         path: tab.path,
//         label: tab.label,
//         icon: tab.icon,
//       }));

//       await setDoc(
//         roleRef,
//         {
//           id: editingRole.id,
//           name: editingRole.name,
//           description: editingRole.description ?? "",
//           users: editingRole.users ?? 0,
//           items: itemsToSave,
//           budgetRequestVisibility: editingRole.budgetRequestVisibility || "own",
//           updatedAt: new Date(),
//         },
//         { merge: true },
//       );

//       toast({
//         title: "Saved",
//         description: `Permissions updated for ${editingRole.name}`,
//       });

//       setEditingRole(null);
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
//                 Manage users, role-based Budget Request approval workflows,
//                 roles, and page-level permissions from one dashboard.
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
//                 <Users className="h-6 w-6 text-amber-600" />
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
//                   Budget Roles
//                 </p>
//                 <p className="mt-2 text-3xl font-bold text-slate-950">
//                   {availableBudgetRoles.length}
//                 </p>
//               </div>
//               <div className="rounded-2xl bg-violet-50 p-3">
//                 <ShieldCheck className="h-6 w-6 text-violet-600" />
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* User Accounts */}
//         <section className="space-y-4">
//           <div>
//             <h2 className="text-xl font-bold tracking-tight text-slate-950">
//               Active User Accounts
//             </h2>
//             <p className="text-sm text-slate-500">
//               Search, filter, view details, activate/deactivate, or delete
//               users.
//             </p>
//           </div>

//           <Card className="overflow-hidden rounded-[2rem] border-slate-200/80 bg-white/90 shadow-sm">
//             <CardHeader className="border-b border-slate-100 bg-white/80 p-4 md:p-5">
//               <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_180px]">
//                 <div className="relative">
//                   <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
//                   <Input
//                     value={searchTerm}
//                     onChange={(event) => setSearchTerm(event.target.value)}
//                     placeholder="Search by name, email, role, designation..."
//                     className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11 shadow-none focus-visible:ring-slate-300"
//                   />
//                 </div>

//                 <select
//                   className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
//                   value={roleFilter}
//                   onChange={(event) => setRoleFilter(event.target.value)}
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
//                   onChange={(event) => setStatusFilter(event.target.value)}
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
//                   <table className="w-full min-w-[1320px] text-left">
//                     <thead>
//                       <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-400">
//                         <th className="px-5 py-4 font-semibold">User</th>
//                         <th className="px-5 py-4 font-semibold">Role</th>
//                         <th className="px-5 py-4 font-semibold">Created</th>
//                         <th className="px-5 py-4 font-semibold">Status</th>
//                         <th className="px-5 py-4 font-semibold">
//                           Budget Requests
//                         </th>
//                         <th className="px-5 py-4 font-semibold">
//                           Purchase Orders
//                         </th>
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

//                           <td className="px-5 py-4 text-sm text-slate-500">
//                             {formatDate(user.createdAt)}
//                           </td>

//                           <td className="px-5 py-4">
//                             <StatusBadge active={user.isActive} />
//                           </td>

//                           <td className="px-5 py-4">
//                             <select
//                               value={
//                                 user.budgetRequestVisibility ||
//                                 (user.canViewAllBudgetRequests ? "all" : "role")
//                               }
//                               onChange={(event) =>
//                                 updateBudgetRequestVisibility(
//                                   user,
//                                   event.target.value as BudgetRequestVisibility,
//                                 )
//                               }
//                               className="h-10 min-w-[190px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
//                             >
//                               <option value="role">Use role default</option>
//                               <option value="all">View all requests</option>
//                               <option value="assigned">
//                                 Own + assigned approvals
//                               </option>
//                               <option value="own">Own requests only</option>
//                             </select>
//                           </td>

//                           <td className="px-5 py-4">
//                             <select
//                               value={
//                                 user.purchaseOrderVisibility ||
//                                 (user.canViewAllPurchaseOrders ? "all" : "own")
//                               }
//                               onChange={(event) =>
//                                 updatePurchaseOrderVisibility(
//                                   user,
//                                   event.target.value as PurchaseOrderVisibility,
//                                 )
//                               }
//                               className="h-10 min-w-[180px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
//                             >
//                               <option value="own">Own / assigned POs</option>
//                               <option value="all">View all POs</option>
//                             </select>
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

//         {/* Role-based Budget Request Approval Workflows */}
//         <section className="space-y-4">
//           <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
//             <div>
//               <h2 className="text-xl font-bold tracking-tight text-slate-950">
//                 Budget Role Approval Workflows
//               </h2>
//               <p className="text-sm text-slate-500">
//                 Each User Management Role can have its own independent Budget
//                 Request approval sequence. The request creator's Role selects
//                 the workflow.
//               </p>
//             </div>

//             <div className="flex flex-wrap gap-2">
//               <Button
//                 type="button"
//                 variant="outline"
//                 disabled={!selectedBudgetRole}
//                 onClick={() =>
//                   setBudgetWorkflow((previous) => ({
//                     ...previous,
//                     levels: [
//                       ...previous.levels,
//                       createApprovalLevel(previous.levels.length + 1),
//                     ],
//                   }))
//                 }
//                 className="rounded-2xl border-slate-200 bg-white"
//               >
//                 <Plus className="mr-2 h-4 w-4" />
//                 Add Approval Level
//               </Button>

//               <Button
//                 type="button"
//                 onClick={saveBudgetWorkflow}
//                 disabled={savingWorkflow || !selectedBudgetRole}
//                 className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
//               >
//                 {savingWorkflow ? (
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                 ) : (
//                   <ShieldCheck className="mr-2 h-4 w-4" />
//                 )}
//                 Save Budget Role Workflow
//               </Button>
//             </div>
//           </div>

//           <Card className="rounded-[2rem] border-blue-200 bg-blue-50/70 shadow-sm">
//             <CardContent className="p-5 md:p-6">
//               <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
//                 <div>
//                   <p className="text-sm font-semibold text-slate-900">
//                     Select Budget Role
//                   </p>
//                   <p className="mt-1 text-xs leading-5 text-slate-500">
//                     Budget Roles come directly from the Roles you create in User
//                     Management. Creating a new Role automatically makes it
//                     available here.
//                   </p>
//                 </div>

//                 <select
//                   value={selectedBudgetRoleKey}
//                   onChange={(event) =>
//                     setSelectedBudgetRoleKey(event.target.value)
//                   }
//                   className="h-11 min-w-[280px] rounded-2xl border border-blue-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-200"
//                 >
//                   <option value="">Select Budget Role</option>
//                   {availableBudgetRoles.map((role) => (
//                     <option key={role.id} value={role.key}>
//                       {role.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {selectedBudgetRole && (
//                 <div className="mt-4 flex flex-wrap gap-2">
//                   <Badge className="rounded-full border border-blue-200 bg-white px-3 py-1 text-blue-700 hover:bg-white">
//                     Budget Role: {selectedBudgetRole.name}
//                   </Badge>
//                   <Badge className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600 hover:bg-white">
//                     {budgetWorkflow.levels.length} Approval Level
//                     {budgetWorkflow.levels.length === 1 ? "" : "s"}
//                   </Badge>
//                   <Badge
//                     className={`rounded-full border px-3 py-1 ${
//                       budgetWorkflow.enabled !== false
//                         ? "border-emerald-200 bg-emerald-50 text-emerald-700"
//                         : "border-rose-200 bg-rose-50 text-rose-700"
//                     }`}
//                   >
//                     {budgetWorkflow.enabled !== false
//                       ? "Workflow Enabled"
//                       : "Workflow Disabled"}
//                   </Badge>
//                 </div>
//               )}
//             </CardContent>
//           </Card>

//           {!selectedBudgetRole ? (
//             <Card className="rounded-[2rem] border-slate-200/80 bg-white/90 shadow-sm">
//               <CardContent className="p-5 md:p-6">
//                 <EmptyState
//                   title="Select a Budget Role"
//                   description="Choose a Role above to configure its Budget Request approval hierarchy."
//                 />
//               </CardContent>
//             </Card>
//           ) : (
//             <Card className="rounded-[2rem] border-slate-200/80 bg-white/90 shadow-sm">
//               <CardContent className="space-y-4 p-5 md:p-6">
//                 <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
//                   <Checkbox
//                     checked={budgetWorkflow.enabled !== false}
//                     onCheckedChange={(checked) =>
//                       setBudgetWorkflow((previous) => ({
//                         ...previous,
//                         enabled: checked === true,
//                       }))
//                     }
//                   />
//                   <span>
//                     <span className="block text-sm font-semibold text-slate-800">
//                       Enable {selectedBudgetRole.name} Budget Request workflow
//                     </span>
//                     <span className="block text-xs text-slate-500">
//                       New and resubmitted Budget Requests created by users with
//                       this Role use this sequence.
//                     </span>
//                   </span>
//                 </label>

//                 {budgetWorkflow.levels.length === 0 ? (
//                   <EmptyState
//                     title={`No workflow configured for ${selectedBudgetRole.name}`}
//                     description={`Add the first approval level for ${selectedBudgetRole.name}, assign users or roles, and save the workflow.`}
//                   />
//                 ) : (
//                   <div className="space-y-4">
//                     {budgetWorkflow.levels.map((level, index) => (
//                       <div
//                         key={level.id}
//                         className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4 md:p-5"
//                       >
//                         <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
//                           <div className="flex flex-1 items-center gap-3">
//                             <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
//                               {index + 1}
//                             </span>
//                             <div className="flex-1">
//                               <Input
//                                 value={level.name}
//                                 onChange={(event) =>
//                                   updateApprovalLevel(level.id, {
//                                     name: event.target.value,
//                                   })
//                                 }
//                                 placeholder={`Internal level title ${index + 1}`}
//                                 className="h-11 rounded-2xl border-slate-200 bg-white"
//                               />
//                               <p className="mt-1 text-xs text-slate-400">
//                                 Internal title only. Budget Request status uses
//                                 the assigned approver role/user information.
//                               </p>
//                             </div>
//                           </div>

//                           <div className="flex gap-2">
//                             <Button
//                               type="button"
//                               variant="outline"
//                               size="sm"
//                               disabled={index === 0}
//                               onClick={() => moveApprovalLevel(level.id, -1)}
//                               className="rounded-xl bg-white"
//                             >
//                               <ChevronUp className="h-4 w-4" />
//                             </Button>
//                             <Button
//                               type="button"
//                               variant="outline"
//                               size="sm"
//                               disabled={
//                                 index === budgetWorkflow.levels.length - 1
//                               }
//                               onClick={() => moveApprovalLevel(level.id, 1)}
//                               className="rounded-xl bg-white"
//                             >
//                               <ChevronDown className="h-4 w-4" />
//                             </Button>
//                             <Button
//                               type="button"
//                               variant="outline"
//                               size="sm"
//                               onClick={() =>
//                                 setBudgetWorkflow((previous) => ({
//                                   ...previous,
//                                   levels: sanitizeApprovalLevels(
//                                     previous.levels.filter(
//                                       (item) => item.id !== level.id,
//                                     ),
//                                   ),
//                                 }))
//                               }
//                               className="rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
//                             >
//                               <Trash2 className="h-4 w-4" />
//                             </Button>
//                           </div>
//                         </div>

//                         <div className="mt-4 grid gap-4 lg:grid-cols-2">
//                           <div className="rounded-2xl border border-slate-200 bg-white p-4">
//                             <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
//                               Assigned Approver Roles
//                             </p>
//                             <p className="mt-1 text-xs text-slate-400">
//                               Select one or more roles allowed to approve this
//                               level.
//                             </p>
//                             <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
//                               {roles.length === 0 ? (
//                                 <p className="text-sm text-slate-400">
//                                   No roles available.
//                                 </p>
//                               ) : (
//                                 roles.map((role) => (
//                                   <label
//                                     key={role.id}
//                                     className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50"
//                                   >
//                                     <Checkbox
//                                       checked={level.roleIds.includes(role.id)}
//                                       onCheckedChange={(checked) =>
//                                         toggleApprovalLevelAssignment(
//                                           level.id,
//                                           "roleIds",
//                                           role.id,
//                                           checked === true,
//                                         )
//                                       }
//                                     />
//                                     <span className="text-sm font-medium text-slate-700">
//                                       {role.name}
//                                     </span>
//                                   </label>
//                                 ))
//                               )}
//                             </div>
//                           </div>

//                           <div className="rounded-2xl border border-slate-200 bg-white p-4">
//                             <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
//                               Assigned Approver Users
//                             </p>
//                             <p className="mt-1 text-xs text-slate-400">
//                               Direct user assignments can be used together with
//                               role assignments.
//                             </p>
//                             <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
//                               {activeUsers.length === 0 ? (
//                                 <p className="text-sm text-slate-400">
//                                   No active users available.
//                                 </p>
//                               ) : (
//                                 activeUsers.map((user) => (
//                                   <label
//                                     key={user.id}
//                                     className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50"
//                                   >
//                                     <Checkbox
//                                       checked={level.userIds.includes(user.id)}
//                                       onCheckedChange={(checked) =>
//                                         toggleApprovalLevelAssignment(
//                                           level.id,
//                                           "userIds",
//                                           user.id,
//                                           checked === true,
//                                         )
//                                       }
//                                     />
//                                     <span>
//                                       <span className="block text-sm font-medium text-slate-700">
//                                         {user.displayName ||
//                                           user.email ||
//                                           "Unnamed User"}
//                                       </span>
//                                       <span className="block text-xs text-slate-400">
//                                         {getRoleName(user.role)}
//                                       </span>
//                                     </span>
//                                   </label>
//                                 ))
//                               )}
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           )}
//         </section>

//         {/* Dynamic Purchase Order Approval Workflow */}
//         <section className="space-y-4">
//           <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
//             <div>
//               <h2 className="text-xl font-bold tracking-tight text-slate-950">
//                 Purchase Order Approval Workflow
//               </h2>
//               <p className="text-sm text-slate-500">
//                 Configure the PO approval sequence using any role or active user
//                 from any Budget Role.
//               </p>
//             </div>

//             <div className="flex flex-wrap gap-2">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() =>
//                   setPurchaseOrderWorkflow((previous) => ({
//                     ...previous,
//                     levels: [
//                       ...previous.levels,
//                       createApprovalLevel(previous.levels.length + 1),
//                     ],
//                   }))
//                 }
//                 className="rounded-2xl border-slate-200 bg-white"
//               >
//                 <Plus className="mr-2 h-4 w-4" />
//                 Add PO Approval Level
//               </Button>

//               <Button
//                 type="button"
//                 onClick={savePurchaseOrderWorkflow}
//                 disabled={savingPurchaseOrderWorkflow}
//                 className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
//               >
//                 {savingPurchaseOrderWorkflow ? (
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                 ) : (
//                   <ShieldCheck className="mr-2 h-4 w-4" />
//                 )}
//                 Save PO Workflow
//               </Button>
//             </div>
//           </div>

//           <Card className="rounded-[2rem] border-slate-200/80 bg-white/90 shadow-sm">
//             <CardContent className="space-y-4 p-5 md:p-6">
//               <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
//                 <Checkbox
//                   checked={purchaseOrderWorkflow.enabled !== false}
//                   onCheckedChange={(checked) =>
//                     setPurchaseOrderWorkflow((previous) => ({
//                       ...previous,
//                       enabled: checked === true,
//                     }))
//                   }
//                 />
//                 <span>
//                   <span className="block text-sm font-semibold text-slate-800">
//                     Enable Purchase Order approval workflow
//                   </span>
//                   <span className="block text-xs text-slate-500">
//                     Active Purchase Orders must complete this sequence before
//                     payment can be released.
//                   </span>
//                 </span>
//               </label>

//               {purchaseOrderWorkflow.levels.length === 0 ? (
//                 <EmptyState
//                   title="No Purchase Order approval levels configured"
//                   description="Add the first level and assign one or more roles or active users."
//                 />
//               ) : (
//                 <div className="space-y-4">
//                   {purchaseOrderWorkflow.levels.map((level, index) => {
//                     const eligibleRoles = roles.filter((role) =>
//                       canRoleAccessPurchaseOrders(role),
//                     );
//                     const eligibleUsers = activeUsers.filter((user) =>
//                       canUserApprovePurchaseOrders(user, roles),
//                     );

//                     return (
//                       <div
//                         key={level.id}
//                         className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4 md:p-5"
//                       >
//                         <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
//                           <div className="flex flex-1 items-center gap-3">
//                             <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
//                               {index + 1}
//                             </span>
//                             <div className="flex-1">
//                               <Input
//                                 value={level.name}
//                                 onChange={(event) =>
//                                   updatePurchaseOrderApprovalLevel(level.id, {
//                                     name: event.target.value,
//                                   })
//                                 }
//                                 placeholder={`PO approval level ${index + 1}`}
//                                 className="h-11 rounded-2xl border-slate-200 bg-white"
//                               />
//                             </div>
//                           </div>

//                           <div className="flex gap-2">
//                             <Button
//                               type="button"
//                               variant="outline"
//                               size="sm"
//                               disabled={index === 0}
//                               onClick={() =>
//                                 movePurchaseOrderApprovalLevel(level.id, -1)
//                               }
//                               className="rounded-xl bg-white"
//                             >
//                               <ChevronUp className="h-4 w-4" />
//                             </Button>
//                             <Button
//                               type="button"
//                               variant="outline"
//                               size="sm"
//                               disabled={
//                                 index ===
//                                 purchaseOrderWorkflow.levels.length - 1
//                               }
//                               onClick={() =>
//                                 movePurchaseOrderApprovalLevel(level.id, 1)
//                               }
//                               className="rounded-xl bg-white"
//                             >
//                               <ChevronDown className="h-4 w-4" />
//                             </Button>
//                             <Button
//                               type="button"
//                               variant="outline"
//                               size="sm"
//                               onClick={() =>
//                                 setPurchaseOrderWorkflow((previous) => ({
//                                   ...previous,
//                                   levels: sanitizeApprovalLevels(
//                                     previous.levels.filter(
//                                       (item) => item.id !== level.id,
//                                     ),
//                                   ),
//                                 }))
//                               }
//                               className="rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
//                             >
//                               <Trash2 className="h-4 w-4" />
//                             </Button>
//                           </div>
//                         </div>

//                         <div className="mt-4 grid gap-4 lg:grid-cols-2">
//                           <div className="rounded-2xl border border-slate-200 bg-white p-4">
//                             <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
//                               Assigned Roles
//                             </p>
//                             <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
//                               {eligibleRoles.length === 0 ? (
//                                 <p className="text-sm text-slate-400">
//                                   Create a role first.
//                                 </p>
//                               ) : (
//                                 eligibleRoles.map((role) => (
//                                   <label
//                                     key={role.id}
//                                     className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50"
//                                   >
//                                     <Checkbox
//                                       checked={level.roleIds.includes(role.id)}
//                                       onCheckedChange={(checked) =>
//                                         togglePurchaseOrderApprovalAssignment(
//                                           level.id,
//                                           "roleIds",
//                                           role.id,
//                                           checked === true,
//                                         )
//                                       }
//                                     />
//                                     <span className="text-sm font-medium text-slate-700">
//                                       {role.name}
//                                     </span>
//                                   </label>
//                                 ))
//                               )}
//                             </div>
//                           </div>

//                           <div className="rounded-2xl border border-slate-200 bg-white p-4">
//                             <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
//                               Assigned Users
//                             </p>
//                             <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
//                               {eligibleUsers.length === 0 ? (
//                                 <p className="text-sm text-slate-400">
//                                   No eligible active users are available.
//                                 </p>
//                               ) : (
//                                 eligibleUsers.map((user) => (
//                                   <label
//                                     key={user.id}
//                                     className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50"
//                                   >
//                                     <Checkbox
//                                       checked={level.userIds.includes(user.id)}
//                                       onCheckedChange={(checked) =>
//                                         togglePurchaseOrderApprovalAssignment(
//                                           level.id,
//                                           "userIds",
//                                           user.id,
//                                           checked === true,
//                                         )
//                                       }
//                                     />
//                                     <span>
//                                       <span className="block text-sm font-medium text-slate-700">
//                                         {user.displayName ||
//                                           user.email ||
//                                           "Unnamed User"}
//                                       </span>
//                                       <span className="block text-xs text-slate-400">
//                                         {getRoleName(user.role)}
//                                         {user.designation
//                                           ? ` · ${user.designation}`
//                                           : ""}
//                                       </span>
//                                     </span>
//                                   </label>
//                                 ))
//                               )}
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               )}
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
//                           <ShieldCheck className="h-5 w-5" />
//                         </div>
//                         <div>
//                           <h3 className="text-lg font-bold text-slate-950">
//                             {role.name}
//                           </h3>
//                           <p className="mt-1 text-sm text-slate-500">
//                             {role.description || "No description"}
//                           </p>
//                           <div className="mt-3 flex flex-wrap gap-2">
//                             <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
//                               {role.users || 0} users
//                             </span>
//                             <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
//                               {Array.isArray(role.items)
//                                 ? role.items.length
//                                 : 0}{" "}
//                               permissions
//                             </span>
//                             <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
//                               {getBudgetVisibilityLabel(
//                                 role.budgetRequestVisibility || "own",
//                               )}
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
//                           role.items.map((item: any, index: number) => {
//                             const meta = getPermissionMeta(item);
//                             return (
//                               <PermissionBadge
//                                 key={`${meta.path}-${index}`}
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

//       {/* Confirm Delete User */}
//       <Dialog open={confirmDeleteUser} onOpenChange={setConfirmDeleteUser}>
//         <DialogContent className="rounded-[2rem] border-slate-200 p-0 shadow-xl sm:max-w-md">
//           <div className="p-6">
//             <DialogHeader>
//               <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50">
//                 <Trash2 className="h-6 w-6 text-rose-600" />
//               </div>
//               <DialogTitle className="text-xl font-bold text-slate-950">
//                 Delete User?
//               </DialogTitle>
//             </DialogHeader>
//             <p className="mt-3 text-sm leading-6 text-slate-500">
//               This will remove the selected user document from User Management.
//             </p>
//           </div>

//           <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
//             <Button
//               variant="outline"
//               onClick={() => {
//                 setConfirmDeleteUser(false);
//                 setUserIdToConfirmDelete(null);
//               }}
//               className="rounded-xl bg-white"
//             >
//               Cancel
//             </Button>
//             <Button
//               variant="destructive"
//               onClick={confirmDeleteUserNow}
//               className="rounded-xl"
//             >
//               Delete User
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
//                 Delete Role?
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
//                   value={`${viewUser.mobileCountryCode || ""} ${
//                     viewUser.mobileNo || ""
//                   }`.trim()}
//                 />
//                 <InfoRow label="Region" value={viewUser.region} />
//                 <InfoRow label="Reporting To" value={viewUser.reportingTo} />
//                 <InfoRow label="Designation" value={viewUser.designation} />
//                 <InfoRow
//                   label="Financial Limit"
//                   value={money(viewUser.financialLimit)}
//                 />
//                 <InfoRow
//                   label="Budget Request Access"
//                   value={getBudgetVisibilityLabel(
//                     viewUser.budgetRequestVisibility ||
//                       (viewUser.canViewAllBudgetRequests ? "all" : "role"),
//                   )}
//                 />
//                 <InfoRow
//                   label="Purchase Order Access"
//                   value={getPurchaseOrderVisibilityLabel(
//                     viewUser.purchaseOrderVisibility ||
//                       (viewUser.canViewAllPurchaseOrders ? "all" : "own"),
//                   )}
//                 />
//               </div>

//               <div className="rounded-3xl border border-amber-100 bg-amber-50/70 p-4 text-sm leading-6 text-amber-800">
//                 Passwords cannot be viewed or retrieved from Firebase Auth. If
//                 needed, use your admin password reset flow.
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

//           <div className="max-h-[60vh] space-y-5 overflow-y-auto p-6">
//             <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
//               <Label htmlFor="role-budget-visibility">
//                 Default Budget Request visibility
//               </Label>
//               <select
//                 id="role-budget-visibility"
//                 value={editingRole?.budgetRequestVisibility || "own"}
//                 onChange={(event) =>
//                   setEditingRole((previous) =>
//                     previous
//                       ? {
//                           ...previous,
//                           budgetRequestVisibility: event.target
//                             .value as RoleBudgetRequestVisibility,
//                         }
//                       : previous,
//                   )
//                 }
//                 className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
//               >
//                 <option value="all">View all requests</option>
//                 <option value="assigned">Own + assigned approvals</option>
//                 <option value="own">Own requests only</option>
//               </select>
//             </div>

//             <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
//               {AVAILABLE_TABS.map((tab) => {
//                 const Icon = iconMap[tab.icon];
//                 const purchaseOrderRestricted =
//                   tab.path === PURCHASE_ORDER_PATH &&
//                   !canRoleAccessPurchaseOrders(editingRole);
//                 const checked =
//                   !purchaseOrderRestricted && selectedTabs.includes(tab.path);

//                 return (
//                   <label
//                     key={tab.path}
//                     className={
//                       purchaseOrderRestricted
//                         ? "flex cursor-not-allowed items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 opacity-80"
//                         : checked
//                           ? "flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-900 bg-slate-950 p-4 text-white"
//                           : "flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-700 hover:bg-slate-50"
//                     }
//                   >
//                     <Checkbox
//                       checked={checked}
//                       disabled={purchaseOrderRestricted}
//                       onCheckedChange={(value) => {
//                         if (purchaseOrderRestricted) return;

//                         setSelectedTabs((previous) =>
//                           value === true
//                             ? Array.from(new Set([...previous, tab.path]))
//                             : previous.filter((path) => path !== tab.path),
//                         );
//                       }}
//                     />
//                     <span className="flex items-center gap-2 text-sm font-semibold">
//                       {Icon ? <Icon className="h-4 w-4" /> : null}
//                       {tab.label}
//                     </span>
//                   </label>
//                 );
//               })}
//             </div>
//           </div>

//           <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
//             <Button
//               variant="outline"
//               onClick={() => setEditingRole(null)}
//               className="rounded-xl bg-white"
//             >
//               Cancel
//             </Button>
//             <Button onClick={handleSave} className="rounded-xl bg-slate-950">
//               Save Permissions
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Create Role */}
//       <Dialog open={showCreateRole} onOpenChange={setShowCreateRole}>
//         <DialogContent className="rounded-[2rem] border-slate-200 p-0 shadow-xl sm:max-w-lg">
//           <div className="border-b border-slate-100 p-6">
//             <DialogHeader>
//               <DialogTitle className="text-xl font-bold text-slate-950">
//                 Create New Role
//               </DialogTitle>
//             </DialogHeader>
//             <p className="mt-2 text-sm text-slate-500">
//               Create the role first, then edit it to assign module permissions.
//             </p>
//           </div>

//           <div className="space-y-4 p-6">
//             <div className="space-y-2">
//               <Label>Role Name *</Label>
//               <Input
//                 value={newRole.name}
//                 onChange={(event) =>
//                   setNewRole((previous) => ({
//                     ...previous,
//                     name: event.target.value,
//                   }))
//                 }
//                 placeholder="e.g. Creative Manager"
//                 className="h-11 rounded-2xl"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label>Description</Label>
//               <Input
//                 value={newRole.description}
//                 onChange={(event) =>
//                   setNewRole((previous) => ({
//                     ...previous,
//                     description: event.target.value,
//                   }))
//                 }
//                 placeholder="Short role description"
//                 className="h-11 rounded-2xl"
//               />
//             </div>
//           </div>

//           <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
//             <Button
//               variant="outline"
//               onClick={() => {
//                 setShowCreateRole(false);
//                 setNewRole({ name: "", description: "" });
//               }}
//               className="rounded-xl bg-white"
//             >
//               Cancel
//             </Button>
//             <Button
//               onClick={handleCreateRole}
//               className="rounded-xl bg-slate-950"
//             >
//               Create Role
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Create User */}
//       <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
//         <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-[2rem] border-slate-200 p-0 shadow-xl">
//           <div className="border-b border-slate-100 p-6">
//             <DialogHeader>
//               <DialogTitle className="text-xl font-bold text-slate-950">
//                 Create User
//               </DialogTitle>
//             </DialogHeader>
//             <p className="mt-2 text-sm text-slate-500">
//               The user's Role is used as the Budget Role for Budget Request
//               approval workflow selection. Department remains profile
//               information.
//             </p>
//           </div>

//           <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
//             <div className="space-y-2">
//               <Label>Full Name *</Label>
//               <Input
//                 value={newUser.displayName}
//                 onChange={(event) =>
//                   setNewUser((previous) => ({
//                     ...previous,
//                     displayName: event.target.value,
//                   }))
//                 }
//                 placeholder="Full name"
//                 className="h-11 rounded-2xl"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label>Email *</Label>
//               <Input
//                 type="email"
//                 value={newUser.email}
//                 onChange={(event) =>
//                   setNewUser((previous) => ({
//                     ...previous,
//                     email: event.target.value,
//                   }))
//                 }
//                 placeholder="name@example.com"
//                 className="h-11 rounded-2xl"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label>Password *</Label>
//               <div className="flex gap-2">
//                 <Input
//                   type={showPassword ? "text" : "password"}
//                   value={newUser.password}
//                   onChange={(event) =>
//                     setNewUser((previous) => ({
//                       ...previous,
//                       password: event.target.value,
//                     }))
//                   }
//                   placeholder="Password"
//                   className="h-11 rounded-2xl"
//                 />
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={() => setShowPassword((value) => !value)}
//                   className="h-11 rounded-2xl"
//                 >
//                   {showPassword ? "Hide" : "Show"}
//                 </Button>
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label>Role *</Label>
//               <select
//                 value={newUser.role}
//                 onChange={(event) =>
//                   setNewUser((previous) => ({
//                     ...previous,
//                     role: event.target.value,
//                   }))
//                 }
//                 className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
//               >
//                 <option value="">Select role</option>
//                 {roles.map((role) => (
//                   <option key={role.id} value={role.id}>
//                     {role.name}
//                   </option>
//                 ))}
//               </select>
//               <p className="text-xs text-slate-400">
//                 This Role is also the user's Budget Role. Budget Request
//                 approval routing uses this Role and does not require a
//                 Department assignment.
//               </p>
//             </div>

//             <div className="space-y-2">
//               <Label>Designation *</Label>
//               <Input
//                 value={newUser.designation}
//                 onChange={(event) =>
//                   setNewUser((previous) => ({
//                     ...previous,
//                     designation: event.target.value,
//                   }))
//                 }
//                 placeholder="Designation"
//                 className="h-11 rounded-2xl"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label>Mobile *</Label>
//               <div className="grid grid-cols-[110px_1fr] gap-2">
//                 <Input
//                   value={newUser.mobileCountryCode}
//                   onChange={(event) =>
//                     setNewUser((previous) => ({
//                       ...previous,
//                       mobileCountryCode: event.target.value,
//                     }))
//                   }
//                   placeholder="+92"
//                   className="h-11 rounded-2xl"
//                 />
//                 <Input
//                   value={newUser.mobileNo}
//                   onChange={(event) =>
//                     setNewUser((previous) => ({
//                       ...previous,
//                       mobileNo: event.target.value,
//                     }))
//                   }
//                   placeholder="3001234567"
//                   className="h-11 rounded-2xl"
//                 />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label>Region *</Label>
//               <Input
//                 value={newUser.region}
//                 onChange={(event) =>
//                   setNewUser((previous) => ({
//                     ...previous,
//                     region: event.target.value,
//                   }))
//                 }
//                 placeholder="Region"
//                 className="h-11 rounded-2xl"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label>Reporting To</Label>
//               <Input
//                 value={newUser.reportingTo}
//                 onChange={(event) =>
//                   setNewUser((previous) => ({
//                     ...previous,
//                     reportingTo: event.target.value,
//                   }))
//                 }
//                 placeholder="Manager / reporting person"
//                 className="h-11 rounded-2xl"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label>Financial Limit</Label>
//               <Input
//                 type="number"
//                 value={newUser.financialLimit}
//                 onChange={(event) =>
//                   setNewUser((previous) => ({
//                     ...previous,
//                     financialLimit: event.target.value,
//                   }))
//                 }
//                 placeholder="0"
//                 className="h-11 rounded-2xl"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label>Budget Request Access</Label>
//               <select
//                 value={newUser.budgetRequestVisibility}
//                 onChange={(event) =>
//                   setNewUser((previous) => ({
//                     ...previous,
//                     budgetRequestVisibility: event.target
//                       .value as BudgetRequestVisibility,
//                   }))
//                 }
//                 className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
//               >
//                 <option value="role">Use role default</option>
//                 <option value="all">View all requests</option>
//                 <option value="assigned">Own + assigned approvals</option>
//                 <option value="own">Own requests only</option>
//               </select>
//             </div>

//             <div className="space-y-2">
//               <Label>Purchase Order Access</Label>
//               <select
//                 value={newUser.purchaseOrderVisibility}
//                 onChange={(event) =>
//                   setNewUser((previous) => ({
//                     ...previous,
//                     purchaseOrderVisibility: event.target
//                       .value as PurchaseOrderVisibility,
//                   }))
//                 }
//                 className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
//               >
//                 <option value="own">Own / assigned POs</option>
//                 <option value="all">View all POs</option>
//               </select>
//             </div>
//           </div>

//           <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
//             <Button
//               variant="outline"
//               disabled={creating}
//               onClick={() => setShowCreateUser(false)}
//               className="rounded-xl bg-white"
//             >
//               Cancel
//             </Button>
//             <Button
//               disabled={creating}
//               onClick={handleCreateUser}
//               className="rounded-xl bg-slate-950"
//             >
//               {creating ? (
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//               ) : (
//                 <UserPlus className="mr-2 h-4 w-4" />
//               )}
//               {creating ? "Creating..." : "Create User"}
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
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createEmployeeWithAccount } from "@/lib/employeeProfiles";
import {
  employeeProfileToDraft,
  initialEmployeeProfile,
} from "@/lib/employeeProfileModel";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type BudgetApprovalLevel,
  type BudgetApprovalWorkflowConfig,
  type BudgetRequestVisibility,
  type RoleBudgetRequestVisibility,
  createApprovalLevel,
  enrichApprovalLevelsWithRoleMetadata,
  normalizeWorkflowKey,
  sanitizeApprovalLevels,
} from "@/lib/budgetApprovalWorkflow";
import {
  Archive,
  BarChart3,
  BedDouble,
  BookUser,
  CalendarCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CreditCard,
  Eye,
  FileText,
  HandCoins,
  Hotel,
  LayoutDashboard,
  LineChart,
  Loader2,
  Mail,
  Pencil,
  PieChart,
  PlaneTakeoff,
  Plus,
  Power,
  PowerOff,
  Receipt,
  ReceiptText,
  Scroll,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  WalletCards,
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
  { path: "/records", label: "Records", icon: "Archive" },
];

const PANEL_ID = "IEDGE-SYSTEM";
const USERS_PER_PAGE = 8;
const PURCHASE_ORDER_PATH = "/purchase-orders";
const PURCHASE_ORDER_WORKFLOW_CONFIG_ID = "purchase_order_approval";

type PurchaseOrderVisibility = "own" | "all";

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
  BookUser,
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
  budgetRequestVisibility?: RoleBudgetRequestVisibility;
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
  budgetRequestVisibility?: BudgetRequestVisibility;
  canViewAllPurchaseOrders?: boolean;
  purchaseOrderVisibility?: PurchaseOrderVisibility;
}

type BudgetRoleOption = {
  id: string;
  key: string;
  name: string;
};

type BudgetRoleWorkflowConfig = BudgetApprovalWorkflowConfig & {
  budgetRole?: string;
  budgetRoleId?: string;
  budgetRoleKey?: string;
  workflowScope?: "role";
};

function getBudgetRoleWorkflowConfigId(roleValue: any): string {
  const roleKey = normalizeWorkflowKey(roleValue);
  return roleKey ? `budgetRequests__role__${roleKey}` : "budgetRequests__role";
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

function canRoleAccessPurchaseOrders(role?: Pick<Role, "id" | "name"> | null) {
  return Boolean(role?.id || role?.name);
}

function canUserApprovePurchaseOrders(user: User, _roles: Role[]) {
  return user.isActive !== false;
}

function getBudgetVisibilityLabel(value?: BudgetRequestVisibility) {
  switch (value) {
    case "all":
      return "View all requests";
    case "assigned":
      return "Own + assigned approvals";
    case "own":
      return "Own requests only";
    case "role":
    default:
      return "Use role default";
  }
}

function getPurchaseOrderVisibilityLabel(value?: PurchaseOrderVisibility) {
  return value === "all" ? "View all POs" : "Own / assigned POs";
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

  // Role-specific Budget Request approval workflow
  const [budgetWorkflow, setBudgetWorkflow] =
    useState<BudgetRoleWorkflowConfig>({
      module: "budget_requests",
      budgetRole: "",
      budgetRoleId: "",
      budgetRoleKey: "",
      workflowScope: "role",
      enabled: true,
      version: 0,
      levels: [],
    });
  const [selectedBudgetRoleKey, setSelectedBudgetRoleKey] = useState("");
  const [savingWorkflow, setSavingWorkflow] = useState(false);

  // dynamic Purchase Order approval workflow
  const [purchaseOrderWorkflow, setPurchaseOrderWorkflow] =
    useState<BudgetApprovalWorkflowConfig>({
      module: "purchase_orders",
      enabled: true,
      version: 0,
      levels: [],
    } as any);
  const [savingPurchaseOrderWorkflow, setSavingPurchaseOrderWorkflow] =
    useState(false);

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
  const [showPassword, setShowPassword] = useState(false);
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
    budgetRequestVisibility: "role" as BudgetRequestVisibility,
    purchaseOrderVisibility: "own" as PurchaseOrderVisibility,
  });

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
        description: `${user.displayName || "User"} is now ${
          !user.isActive ? "Active" : "Inactive"
        }.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  }

  async function updateBudgetRequestVisibility(
    user: User,
    budgetRequestVisibility: BudgetRequestVisibility,
  ) {
    try {
      await updateDoc(doc(db, "Panels", PANEL_ID, "users", user.id), {
        budgetRequestVisibility,
        canViewAllBudgetRequests: budgetRequestVisibility === "all",
        updatedAt: new Date(),
      });

      toast({
        title: "Permission Updated",
        description: `${user.displayName || "User"}'s Budget Request access has been updated.`,
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

  async function updatePurchaseOrderVisibility(
    user: User,
    purchaseOrderVisibility: PurchaseOrderVisibility,
  ) {
    try {
      await updateDoc(doc(db, "Panels", PANEL_ID, "users", user.id), {
        purchaseOrderVisibility,
        canViewAllPurchaseOrders: purchaseOrderVisibility === "all",
        updatedAt: new Date(),
      });

      toast({
        title: "Permission Updated",
        description: `${user.displayName || "User"}'s Purchase Order access has been updated.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err.message || "Failed to update Purchase Order permission.",
        variant: "destructive",
      });
    }
  }

  function updateApprovalLevel(
    levelId: string,
    patch: Partial<BudgetApprovalLevel>,
  ) {
    setBudgetWorkflow((previous) => ({
      ...previous,
      levels: previous.levels.map((level) =>
        level.id === levelId ? { ...level, ...patch } : level,
      ),
    }));
  }

  function moveApprovalLevel(levelId: string, direction: -1 | 1) {
    setBudgetWorkflow((previous) => {
      const levels = [...previous.levels];
      const currentIndex = levels.findIndex((level) => level.id === levelId);
      const targetIndex = currentIndex + direction;

      if (currentIndex < 0 || targetIndex < 0 || targetIndex >= levels.length) {
        return previous;
      }

      [levels[currentIndex], levels[targetIndex]] = [
        levels[targetIndex],
        levels[currentIndex],
      ];

      return { ...previous, levels: sanitizeApprovalLevels(levels) };
    });
  }

  function toggleApprovalLevelAssignment(
    levelId: string,
    field: "userIds" | "roleIds",
    value: string,
    checked: boolean,
  ) {
    setBudgetWorkflow((previous) => ({
      ...previous,
      levels: previous.levels.map((level) => {
        if (level.id !== levelId) return level;

        const currentValues = Array.isArray(level[field]) ? level[field] : [];
        const nextValues = checked
          ? Array.from(new Set([...currentValues, value]))
          : currentValues.filter((item) => item !== value);

        return { ...level, [field]: nextValues };
      }),
    }));
  }

  function updatePurchaseOrderApprovalLevel(
    levelId: string,
    patch: Partial<BudgetApprovalLevel>,
  ) {
    setPurchaseOrderWorkflow((previous) => ({
      ...previous,
      levels: previous.levels.map((level) =>
        level.id === levelId ? { ...level, ...patch } : level,
      ),
    }));
  }

  function movePurchaseOrderApprovalLevel(levelId: string, direction: -1 | 1) {
    setPurchaseOrderWorkflow((previous) => {
      const levels = [...previous.levels];
      const currentIndex = levels.findIndex((level) => level.id === levelId);
      const targetIndex = currentIndex + direction;

      if (currentIndex < 0 || targetIndex < 0 || targetIndex >= levels.length) {
        return previous;
      }

      [levels[currentIndex], levels[targetIndex]] = [
        levels[targetIndex],
        levels[currentIndex],
      ];

      return { ...previous, levels: sanitizeApprovalLevels(levels) };
    });
  }

  function togglePurchaseOrderApprovalAssignment(
    levelId: string,
    field: "userIds" | "roleIds",
    value: string,
    checked: boolean,
  ) {
    setPurchaseOrderWorkflow((previous) => ({
      ...previous,
      levels: previous.levels.map((level) => {
        if (level.id !== levelId) return level;

        const currentValues = Array.isArray(level[field]) ? level[field] : [];
        const nextValues = checked
          ? Array.from(new Set([...currentValues, value]))
          : currentValues.filter((item) => item !== value);

        return { ...level, [field]: nextValues };
      }),
    }));
  }

  // --------------------
  // Load roles from Firestore
  // --------------------
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "Panels", PANEL_ID, "sidebarConfig"),
      (snapshot) => {
        const list: Role[] = snapshot.docs.map((item) => {
          const data = item.data() as any;

          let items: any[] = data.items ?? [];
          if (items.length > 0 && typeof items[0] === "object") {
            items = items.map((entry: any) => entry.path ?? entry);
          }

          return {
            id: item.id,
            name: data.name ?? data.id ?? item.id,
            description: data.description ?? "",
            users: data.users ?? 0,
            items,
            budgetRequestVisibility: data.budgetRequestVisibility || "own",
          } as Role;
        });

        setRoles(list);
      },
    );

    return () => unsubscribe();
  }, []);

  // --------------------
  // Load users
  // --------------------
  useEffect(() => {
    const usersRef = collection(db, "Panels", PANEL_ID, "users");

    const pendingQ = query(usersRef, where("accountStatus", "==", "pending"));
    const activeQ = query(usersRef, where("accountStatus", "==", "approved"));

    const unsubPending = onSnapshot(pendingQ, (snapshot) => {
      setPendingUsers(
        snapshot.docs.map((item) => ({
          ...(item.data() as User),
          id: item.id,
        })),
      );
    });

    const unsubActive = onSnapshot(activeQ, (snapshot) => {
      setActiveUsers(
        snapshot.docs.map((item) => ({
          ...(item.data() as User),
          isActive: (item.data() as any)?.isActive ?? true,
          id: item.id,
        })),
      );
    });

    return () => {
      unsubPending();
      unsubActive();
    };
  }, []);

  // --------------------
  // Dynamic Budget Role list
  // --------------------
  const availableBudgetRoles = useMemo<BudgetRoleOption[]>(() => {
    return roles
      .map((role) => ({
        id: role.id,
        key: normalizeWorkflowKey(role.id || role.name),
        name: role.name || role.id,
      }))
      .filter((role) => Boolean(role.key))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [roles]);

  const selectedBudgetRole = useMemo(() => {
    return (
      availableBudgetRoles.find((role) => role.key === selectedBudgetRoleKey) ||
      null
    );
  }, [availableBudgetRoles, selectedBudgetRoleKey]);

  useEffect(() => {
    if (selectedBudgetRoleKey) return;
    if (availableBudgetRoles.length === 0) return;

    setSelectedBudgetRoleKey(availableBudgetRoles[0].key);
  }, [availableBudgetRoles, selectedBudgetRoleKey]);

  // --------------------
  // Load selected Budget Role workflow
  // --------------------
  useEffect(() => {
    if (!selectedBudgetRole) {
      setBudgetWorkflow({
        module: "budget_requests",
        budgetRole: "",
        budgetRoleId: "",
        budgetRoleKey: "",
        workflowScope: "role",
        enabled: true,
        version: 0,
        levels: [],
      });
      return;
    }

    const budgetRole = selectedBudgetRole.name;
    const budgetRoleId = selectedBudgetRole.id;
    const budgetRoleKey = selectedBudgetRole.key;
    const configId = getBudgetRoleWorkflowConfigId(budgetRoleKey);

    setBudgetWorkflow({
      id: configId,
      module: "budget_requests",
      budgetRole,
      budgetRoleId,
      budgetRoleKey,
      workflowScope: "role",
      enabled: true,
      version: 0,
      levels: [],
    });

    const unsubscribe = onSnapshot(
      doc(db, "Panels", PANEL_ID, "workflowConfigs", configId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setBudgetWorkflow({
            id: configId,
            module: "budget_requests",
            budgetRole,
            budgetRoleId,
            budgetRoleKey,
            workflowScope: "role",
            enabled: true,
            version: 0,
            levels: [],
          });
          return;
        }

        const data = snapshot.data() as BudgetRoleWorkflowConfig;

        setBudgetWorkflow({
          ...data,
          id: snapshot.id,
          module: "budget_requests",
          budgetRole: String(data?.budgetRole || budgetRole).trim(),
          budgetRoleId: String(data?.budgetRoleId || budgetRoleId).trim(),
          budgetRoleKey: normalizeWorkflowKey(
            data?.budgetRoleKey || data?.budgetRoleId || budgetRoleKey,
          ),
          workflowScope: "role",
          enabled: data.enabled !== false,
          version: Number(data.version || 1),
          levels: sanitizeApprovalLevels(data.levels || []),
        });
      },
    );

    return () => unsubscribe();
  }, [selectedBudgetRole]);

  // --------------------
  // Load dynamic Purchase Order workflow
  // --------------------
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(
        db,
        "Panels",
        PANEL_ID,
        "workflowConfigs",
        PURCHASE_ORDER_WORKFLOW_CONFIG_ID,
      ),
      (snapshot) => {
        if (!snapshot.exists()) {
          setPurchaseOrderWorkflow({
            module: "purchase_orders",
            enabled: true,
            version: 0,
            levels: [],
          } as any);
          return;
        }

        const data = snapshot.data() as BudgetApprovalWorkflowConfig;
        setPurchaseOrderWorkflow({
          ...data,
          id: snapshot.id,
          module: "purchase_orders",
          enabled: data.enabled !== false,
          version: Number(data.version || 1),
          levels: sanitizeApprovalLevels(data.levels || []),
        } as any);
      },
    );

    return () => unsubscribe();
  }, []);

  // --------------------
  // Save selected Budget Role workflow
  // --------------------
  async function saveBudgetWorkflow() {
    if (!selectedBudgetRole) {
      toast({
        title: "Budget Role required",
        description:
          "Select a Role before configuring its Budget Request approval workflow.",
        variant: "destructive",
      });
      return;
    }

    const budgetRole = selectedBudgetRole.name;
    const budgetRoleId = selectedBudgetRole.id;
    const budgetRoleKey = selectedBudgetRole.key;
    const configId = getBudgetRoleWorkflowConfigId(budgetRoleKey);

    const levels = enrichApprovalLevelsWithRoleMetadata(
      sanitizeApprovalLevels(budgetWorkflow.levels),
      roles,
      activeUsers,
    );

    if (levels.length === 0) {
      toast({
        title: "Approval level required",
        description: `Add at least one approval level for ${budgetRole} before saving.`,
        variant: "destructive",
      });
      return;
    }

    const invalidLevel = levels.find(
      (level) => level.userIds.length === 0 && level.roleIds.length === 0,
    );

    if (invalidLevel) {
      toast({
        title: "Approver required",
        description: `${invalidLevel.name} must have at least one assigned user or role.`,
        variant: "destructive",
      });
      return;
    }

    setSavingWorkflow(true);

    try {
      const nextVersion = Number(budgetWorkflow.version || 0) + 1;

      await setDoc(
        doc(db, "Panels", PANEL_ID, "workflowConfigs", configId),
        {
          module: "budget_requests",
          workflowScope: "role",
          budgetRole,
          budgetRoleId,
          budgetRoleKey,
          enabled: budgetWorkflow.enabled !== false,
          version: nextVersion,
          levels,
          updatedAt: new Date(),
          updatedBy:
            userProfile?.displayName ||
            userProfile?.email ||
            userProfile?.id ||
            "",
        },
        { merge: true },
      );

      setBudgetWorkflow((previous) => ({
        ...previous,
        id: configId,
        module: "budget_requests",
        workflowScope: "role",
        budgetRole,
        budgetRoleId,
        budgetRoleKey,
        version: nextVersion,
        levels,
      }));

      toast({
        title: "Budget Role workflow saved",
        description: `${budgetRole} Budget Requests will now follow this approval hierarchy.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err.message || "Failed to save Budget Role approval workflow.",
        variant: "destructive",
      });
    } finally {
      setSavingWorkflow(false);
    }
  }

  async function savePurchaseOrderWorkflow() {
    const eligibleRoles = roles;
    const eligibleUsers = activeUsers.filter((user) =>
      canUserApprovePurchaseOrders(user, roles),
    );

    const levels = enrichApprovalLevelsWithRoleMetadata(
      sanitizeApprovalLevels(purchaseOrderWorkflow.levels),
      eligibleRoles,
      eligibleUsers,
    );

    if (levels.length === 0) {
      toast({
        title: "Approval level required",
        description:
          "Add at least one Purchase Order approval level before saving.",
        variant: "destructive",
      });
      return;
    }

    const invalidLevel = levels.find(
      (level) => level.userIds.length === 0 && level.roleIds.length === 0,
    );

    if (invalidLevel) {
      toast({
        title: "Eligible approver required",
        description: `${invalidLevel.name} must have at least one assigned role or user.`,
        variant: "destructive",
      });
      return;
    }

    setSavingPurchaseOrderWorkflow(true);

    try {
      const nextVersion = Number(purchaseOrderWorkflow.version || 0) + 1;

      await setDoc(
        doc(
          db,
          "Panels",
          PANEL_ID,
          "workflowConfigs",
          PURCHASE_ORDER_WORKFLOW_CONFIG_ID,
        ),
        {
          module: "purchase_orders",
          enabled: purchaseOrderWorkflow.enabled !== false,
          version: nextVersion,
          levels,
          updatedAt: new Date(),
          updatedBy:
            userProfile?.displayName ||
            userProfile?.email ||
            userProfile?.id ||
            "",
        },
        { merge: true },
      );

      setPurchaseOrderWorkflow((previous) => ({
        ...previous,
        version: nextVersion,
        levels,
      }));

      toast({
        title: "Workflow saved",
        description:
          "Purchase Orders will follow this approval hierarchy for the selected roles and users.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to save Purchase Order workflow.",
        variant: "destructive",
      });
    } finally {
      setSavingPurchaseOrderWorkflow(false);
    }
  }

  // --------------------
  // Compute displayRoles
  // --------------------
  const displayRoles = useMemo(() => {
    return roles.map((role) => {
      const usersInRole = activeUsers.filter((user) => {
        if (!user.role) return false;
        return user.role === role.id || user.role === role.name;
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
  // User / Role actions
  // --------------------
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

  const handleCreateUser = async () => {
    if (
      !newUser.displayName ||
      !newUser.email ||
      !newUser.password ||
      !newUser.role ||
      !newUser.mobileCountryCode ||
      !newUser.mobileNo ||
      !newUser.region ||
      !newUser.designation
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
      const profile = initialEmployeeProfile({
        id: "",
        displayName: newUser.displayName.trim(),
        email: newUser.email.trim(),
        role: newUser.role,
        mobileCountryCode: newUser.mobileCountryCode.trim(),
        mobileNo: newUser.mobileNo.trim(),
        region: newUser.region.trim(),
        reportingTo: newUser.reportingTo.trim(),
        designation: newUser.designation.trim(),
      });
      await createEmployeeWithAccount(employeeProfileToDraft(profile), {
        role: newUser.role,
        password: newUser.password,
        mobileCountryCode: newUser.mobileCountryCode.trim(),
        financialLimit: financialLimitNumber,
        budgetRequestVisibility: newUser.budgetRequestVisibility,
        purchaseOrderVisibility: newUser.purchaseOrderVisibility,
      });

      toast({
        title: "User Created",
        description: `${newUser.displayName}'s login account and employee profile were created successfully.`,
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
        budgetRequestVisibility: "role",
        purchaseOrderVisibility: "own",
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

  async function handleCreateRole() {
    if (!newRole.name.trim()) {
      toast({ title: "Role name required", variant: "destructive" });
      return;
    }

    try {
      const id = newRole.name.toLowerCase().trim().replace(/\s+/g, "_");

      await setDoc(doc(db, "Panels", PANEL_ID, "sidebarConfig", id), {
        id,
        name: newRole.name.trim(),
        description: newRole.description.trim(),
        users: 0,
        items: [],
        budgetRequestVisibility: "own",
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

  const openEditRole = (role: Role) => {
    const base = roles.find((item) => item.id === role.id) || role;
    setEditingRole(base);

    const items = (base.items || []) as any[];
    const paths = items.map((item) =>
      typeof item === "string" ? item : item.path || item,
    );

    setSelectedTabs(
      canRoleAccessPurchaseOrders(base)
        ? paths
        : paths.filter((path) => path !== PURCHASE_ORDER_PATH),
    );
  };

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

      const allowedSelectedTabs = canRoleAccessPurchaseOrders(editingRole)
        ? selectedTabs
        : selectedTabs.filter((path) => path !== PURCHASE_ORDER_PATH);

      const itemsToSave = AVAILABLE_TABS.filter((tab) =>
        allowedSelectedTabs.includes(tab.path),
      ).map((tab) => ({
        path: tab.path,
        label: tab.label,
        icon: tab.icon,
      }));

      await setDoc(
        roleRef,
        {
          id: editingRole.id,
          name: editingRole.name,
          description: editingRole.description ?? "",
          users: editingRole.users ?? 0,
          items: itemsToSave,
          budgetRequestVisibility: editingRole.budgetRequestVisibility || "own",
          updatedAt: new Date(),
        },
        { merge: true },
      );

      toast({
        title: "Saved",
        description: `Permissions updated for ${editingRole.name}`,
      });

      setEditingRole(null);
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
                Manage users, role-based Budget Request approval workflows,
                roles, and page-level permissions from one dashboard.
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
                <Users className="h-6 w-6 text-amber-600" />
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
                  Budget Roles
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-950">
                  {availableBudgetRoles.length}
                </p>
              </div>
              <div className="rounded-2xl bg-violet-50 p-3">
                <ShieldCheck className="h-6 w-6 text-violet-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Accounts */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-950">
              Active User Accounts
            </h2>
            <p className="text-sm text-slate-500">
              Search, filter, view details, activate/deactivate, or delete
              users.
            </p>
          </div>

          <Card className="overflow-hidden rounded-[2rem] border-slate-200/80 bg-white/90 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-white/80 p-4 md:p-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_180px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by name, email, role, designation..."
                    className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11 shadow-none focus-visible:ring-slate-300"
                  />
                </div>

                <select
                  className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
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
                  onChange={(event) => setStatusFilter(event.target.value)}
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
                  <table className="w-full min-w-[1320px] text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-400">
                        <th className="px-5 py-4 font-semibold">User</th>
                        <th className="px-5 py-4 font-semibold">Role</th>
                        <th className="px-5 py-4 font-semibold">Created</th>
                        <th className="px-5 py-4 font-semibold">Status</th>
                        <th className="px-5 py-4 font-semibold">
                          Budget Requests
                        </th>
                        <th className="px-5 py-4 font-semibold">
                          Purchase Orders
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

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {formatDate(user.createdAt)}
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge active={user.isActive} />
                          </td>

                          <td className="px-5 py-4">
                            <select
                              value={
                                user.budgetRequestVisibility ||
                                (user.canViewAllBudgetRequests ? "all" : "role")
                              }
                              onChange={(event) =>
                                updateBudgetRequestVisibility(
                                  user,
                                  event.target.value as BudgetRequestVisibility,
                                )
                              }
                              className="h-10 min-w-[190px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
                            >
                              <option value="role">Use role default</option>
                              <option value="all">View all requests</option>
                              <option value="assigned">
                                Own + assigned approvals
                              </option>
                              <option value="own">Own requests only</option>
                            </select>
                          </td>

                          <td className="px-5 py-4">
                            <select
                              value={
                                user.purchaseOrderVisibility ||
                                (user.canViewAllPurchaseOrders ? "all" : "own")
                              }
                              onChange={(event) =>
                                updatePurchaseOrderVisibility(
                                  user,
                                  event.target.value as PurchaseOrderVisibility,
                                )
                              }
                              className="h-10 min-w-[180px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
                            >
                              <option value="own">Own / assigned POs</option>
                              <option value="all">View all POs</option>
                            </select>
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

        {/* Role-based Budget Request Approval Workflows */}
        <section className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-950">
                Budget Role Approval Workflows
              </h2>
              <p className="text-sm text-slate-500">
                Each User Management Role can have its own independent Budget
                Request approval sequence. The request creator's Role selects
                the workflow.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!selectedBudgetRole}
                onClick={() =>
                  setBudgetWorkflow((previous) => ({
                    ...previous,
                    levels: [
                      ...previous.levels,
                      createApprovalLevel(previous.levels.length + 1),
                    ],
                  }))
                }
                className="rounded-2xl border-slate-200 bg-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Approval Level
              </Button>

              <Button
                type="button"
                onClick={saveBudgetWorkflow}
                disabled={savingWorkflow || !selectedBudgetRole}
                className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
              >
                {savingWorkflow ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="mr-2 h-4 w-4" />
                )}
                Save Budget Role Workflow
              </Button>
            </div>
          </div>

          <Card className="rounded-[2rem] border-blue-200 bg-blue-50/70 shadow-sm">
            <CardContent className="p-5 md:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Select Budget Role
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Budget Roles come directly from the Roles you create in User
                    Management. Creating a new Role automatically makes it
                    available here.
                  </p>
                </div>

                <select
                  value={selectedBudgetRoleKey}
                  onChange={(event) =>
                    setSelectedBudgetRoleKey(event.target.value)
                  }
                  className="h-11 min-w-[280px] rounded-2xl border border-blue-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Select Budget Role</option>
                  {availableBudgetRoles.map((role) => (
                    <option key={role.id} value={role.key}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedBudgetRole && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge className="rounded-full border border-blue-200 bg-white px-3 py-1 text-blue-700 hover:bg-white">
                    Budget Role: {selectedBudgetRole.name}
                  </Badge>
                  <Badge className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600 hover:bg-white">
                    {budgetWorkflow.levels.length} Approval Level
                    {budgetWorkflow.levels.length === 1 ? "" : "s"}
                  </Badge>
                  <Badge
                    className={`rounded-full border px-3 py-1 ${
                      budgetWorkflow.enabled !== false
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {budgetWorkflow.enabled !== false
                      ? "Workflow Enabled"
                      : "Workflow Disabled"}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {!selectedBudgetRole ? (
            <Card className="rounded-[2rem] border-slate-200/80 bg-white/90 shadow-sm">
              <CardContent className="p-5 md:p-6">
                <EmptyState
                  title="Select a Budget Role"
                  description="Choose a Role above to configure its Budget Request approval hierarchy."
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-[2rem] border-slate-200/80 bg-white/90 shadow-sm">
              <CardContent className="space-y-4 p-5 md:p-6">
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <Checkbox
                    checked={budgetWorkflow.enabled !== false}
                    onCheckedChange={(checked) =>
                      setBudgetWorkflow((previous) => ({
                        ...previous,
                        enabled: checked === true,
                      }))
                    }
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">
                      Enable {selectedBudgetRole.name} Budget Request workflow
                    </span>
                    <span className="block text-xs text-slate-500">
                      New and resubmitted Budget Requests created by users with
                      this Role use this sequence.
                    </span>
                  </span>
                </label>

                {budgetWorkflow.levels.length === 0 ? (
                  <EmptyState
                    title={`No workflow configured for ${selectedBudgetRole.name}`}
                    description={`Add the first approval level for ${selectedBudgetRole.name}, assign users or roles, and save the workflow.`}
                  />
                ) : (
                  <div className="space-y-4">
                    {budgetWorkflow.levels.map((level, index) => (
                      <div
                        key={level.id}
                        className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4 md:p-5"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="flex flex-1 items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <Input
                                value={level.name}
                                onChange={(event) =>
                                  updateApprovalLevel(level.id, {
                                    name: event.target.value,
                                  })
                                }
                                placeholder={`Internal level title ${index + 1}`}
                                className="h-11 rounded-2xl border-slate-200 bg-white"
                              />
                              <p className="mt-1 text-xs text-slate-400">
                                Internal title only. Budget Request status uses
                                the assigned approver role/user information.
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={index === 0}
                              onClick={() => moveApprovalLevel(level.id, -1)}
                              className="rounded-xl bg-white"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={
                                index === budgetWorkflow.levels.length - 1
                              }
                              onClick={() => moveApprovalLevel(level.id, 1)}
                              className="rounded-xl bg-white"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setBudgetWorkflow((previous) => ({
                                  ...previous,
                                  levels: sanitizeApprovalLevels(
                                    previous.levels.filter(
                                      (item) => item.id !== level.id,
                                    ),
                                  ),
                                }))
                              }
                              className="rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Assigned Approver Roles
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              Select one or more roles allowed to approve this
                              level.
                            </p>
                            <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
                              {roles.length === 0 ? (
                                <p className="text-sm text-slate-400">
                                  No roles available.
                                </p>
                              ) : (
                                roles.map((role) => (
                                  <label
                                    key={role.id}
                                    className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50"
                                  >
                                    <Checkbox
                                      checked={level.roleIds.includes(role.id)}
                                      onCheckedChange={(checked) =>
                                        toggleApprovalLevelAssignment(
                                          level.id,
                                          "roleIds",
                                          role.id,
                                          checked === true,
                                        )
                                      }
                                    />
                                    <span className="text-sm font-medium text-slate-700">
                                      {role.name}
                                    </span>
                                  </label>
                                ))
                              )}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Assigned Approver Users
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              Direct user assignments can be used together with
                              role assignments.
                            </p>
                            <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
                              {activeUsers.length === 0 ? (
                                <p className="text-sm text-slate-400">
                                  No active users available.
                                </p>
                              ) : (
                                activeUsers.map((user) => (
                                  <label
                                    key={user.id}
                                    className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50"
                                  >
                                    <Checkbox
                                      checked={level.userIds.includes(user.id)}
                                      onCheckedChange={(checked) =>
                                        toggleApprovalLevelAssignment(
                                          level.id,
                                          "userIds",
                                          user.id,
                                          checked === true,
                                        )
                                      }
                                    />
                                    <span>
                                      <span className="block text-sm font-medium text-slate-700">
                                        {user.displayName ||
                                          user.email ||
                                          "Unnamed User"}
                                      </span>
                                      <span className="block text-xs text-slate-400">
                                        {getRoleName(user.role)}
                                      </span>
                                    </span>
                                  </label>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </section>

        {/* Dynamic Purchase Order Approval Workflow */}
        <section className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-950">
                Purchase Order Approval Workflow
              </h2>
              <p className="text-sm text-slate-500">
                Configure the PO approval sequence using any role or active user
                from any Budget Role.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setPurchaseOrderWorkflow((previous) => ({
                    ...previous,
                    levels: [
                      ...previous.levels,
                      createApprovalLevel(previous.levels.length + 1),
                    ],
                  }))
                }
                className="rounded-2xl border-slate-200 bg-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add PO Approval Level
              </Button>

              <Button
                type="button"
                onClick={savePurchaseOrderWorkflow}
                disabled={savingPurchaseOrderWorkflow}
                className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
              >
                {savingPurchaseOrderWorkflow ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="mr-2 h-4 w-4" />
                )}
                Save PO Workflow
              </Button>
            </div>
          </div>

          <Card className="rounded-[2rem] border-slate-200/80 bg-white/90 shadow-sm">
            <CardContent className="space-y-4 p-5 md:p-6">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <Checkbox
                  checked={purchaseOrderWorkflow.enabled !== false}
                  onCheckedChange={(checked) =>
                    setPurchaseOrderWorkflow((previous) => ({
                      ...previous,
                      enabled: checked === true,
                    }))
                  }
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    Enable Purchase Order approval workflow
                  </span>
                  <span className="block text-xs text-slate-500">
                    Active Purchase Orders must complete this sequence before
                    payment can be released.
                  </span>
                </span>
              </label>

              {purchaseOrderWorkflow.levels.length === 0 ? (
                <EmptyState
                  title="No Purchase Order approval levels configured"
                  description="Add the first level and assign one or more roles or active users."
                />
              ) : (
                <div className="space-y-4">
                  {purchaseOrderWorkflow.levels.map((level, index) => {
                    const eligibleRoles = roles.filter((role) =>
                      canRoleAccessPurchaseOrders(role),
                    );
                    const eligibleUsers = activeUsers.filter((user) =>
                      canUserApprovePurchaseOrders(user, roles),
                    );

                    return (
                      <div
                        key={level.id}
                        className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4 md:p-5"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="flex flex-1 items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <Input
                                value={level.name}
                                onChange={(event) =>
                                  updatePurchaseOrderApprovalLevel(level.id, {
                                    name: event.target.value,
                                  })
                                }
                                placeholder={`PO approval level ${index + 1}`}
                                className="h-11 rounded-2xl border-slate-200 bg-white"
                              />
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={index === 0}
                              onClick={() =>
                                movePurchaseOrderApprovalLevel(level.id, -1)
                              }
                              className="rounded-xl bg-white"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={
                                index ===
                                purchaseOrderWorkflow.levels.length - 1
                              }
                              onClick={() =>
                                movePurchaseOrderApprovalLevel(level.id, 1)
                              }
                              className="rounded-xl bg-white"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setPurchaseOrderWorkflow((previous) => ({
                                  ...previous,
                                  levels: sanitizeApprovalLevels(
                                    previous.levels.filter(
                                      (item) => item.id !== level.id,
                                    ),
                                  ),
                                }))
                              }
                              className="rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Assigned Roles
                            </p>
                            <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
                              {eligibleRoles.length === 0 ? (
                                <p className="text-sm text-slate-400">
                                  Create a role first.
                                </p>
                              ) : (
                                eligibleRoles.map((role) => (
                                  <label
                                    key={role.id}
                                    className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50"
                                  >
                                    <Checkbox
                                      checked={level.roleIds.includes(role.id)}
                                      onCheckedChange={(checked) =>
                                        togglePurchaseOrderApprovalAssignment(
                                          level.id,
                                          "roleIds",
                                          role.id,
                                          checked === true,
                                        )
                                      }
                                    />
                                    <span className="text-sm font-medium text-slate-700">
                                      {role.name}
                                    </span>
                                  </label>
                                ))
                              )}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Assigned Users
                            </p>
                            <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
                              {eligibleUsers.length === 0 ? (
                                <p className="text-sm text-slate-400">
                                  No eligible active users are available.
                                </p>
                              ) : (
                                eligibleUsers.map((user) => (
                                  <label
                                    key={user.id}
                                    className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50"
                                  >
                                    <Checkbox
                                      checked={level.userIds.includes(user.id)}
                                      onCheckedChange={(checked) =>
                                        togglePurchaseOrderApprovalAssignment(
                                          level.id,
                                          "userIds",
                                          user.id,
                                          checked === true,
                                        )
                                      }
                                    />
                                    <span>
                                      <span className="block text-sm font-medium text-slate-700">
                                        {user.displayName ||
                                          user.email ||
                                          "Unnamed User"}
                                      </span>
                                      <span className="block text-xs text-slate-400">
                                        {getRoleName(user.role)}
                                        {user.designation
                                          ? ` · ${user.designation}`
                                          : ""}
                                      </span>
                                    </span>
                                  </label>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-950">
                            {role.name}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {role.description || "No description"}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              {role.users || 0} users
                            </span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              {Array.isArray(role.items)
                                ? role.items.length
                                : 0}{" "}
                              permissions
                            </span>
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                              {getBudgetVisibilityLabel(
                                role.budgetRequestVisibility || "own",
                              )}
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
                          role.items.map((item: any, index: number) => {
                            const meta = getPermissionMeta(item);
                            return (
                              <PermissionBadge
                                key={`${meta.path}-${index}`}
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

      {/* Confirm Delete User */}
      <Dialog open={confirmDeleteUser} onOpenChange={setConfirmDeleteUser}>
        <DialogContent className="rounded-[2rem] border-slate-200 p-0 shadow-xl sm:max-w-md">
          <div className="p-6">
            <DialogHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50">
                <Trash2 className="h-6 w-6 text-rose-600" />
              </div>
              <DialogTitle className="text-xl font-bold text-slate-950">
                Delete User?
              </DialogTitle>
            </DialogHeader>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              This will remove the selected user document from User Management.
            </p>
          </div>

          <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDeleteUser(false);
                setUserIdToConfirmDelete(null);
              }}
              className="rounded-xl bg-white"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteUserNow}
              className="rounded-xl"
            >
              Delete User
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
                Delete Role?
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
                  value={`${viewUser.mobileCountryCode || ""} ${
                    viewUser.mobileNo || ""
                  }`.trim()}
                />
                <InfoRow label="Region" value={viewUser.region} />
                <InfoRow label="Reporting To" value={viewUser.reportingTo} />
                <InfoRow label="Designation" value={viewUser.designation} />
                <InfoRow
                  label="Financial Limit"
                  value={money(viewUser.financialLimit)}
                />
                <InfoRow
                  label="Budget Request Access"
                  value={getBudgetVisibilityLabel(
                    viewUser.budgetRequestVisibility ||
                      (viewUser.canViewAllBudgetRequests ? "all" : "role"),
                  )}
                />
                <InfoRow
                  label="Purchase Order Access"
                  value={getPurchaseOrderVisibilityLabel(
                    viewUser.purchaseOrderVisibility ||
                      (viewUser.canViewAllPurchaseOrders ? "all" : "own"),
                  )}
                />
              </div>

              <div className="rounded-3xl border border-amber-100 bg-amber-50/70 p-4 text-sm leading-6 text-amber-800">
                Passwords cannot be viewed or retrieved from Firebase Auth. If
                needed, use your admin password reset flow.
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

          <div className="max-h-[60vh] space-y-5 overflow-y-auto p-6">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
              <Label htmlFor="role-budget-visibility">
                Default Budget Request visibility
              </Label>
              <select
                id="role-budget-visibility"
                value={editingRole?.budgetRequestVisibility || "own"}
                onChange={(event) =>
                  setEditingRole((previous) =>
                    previous
                      ? {
                          ...previous,
                          budgetRequestVisibility: event.target
                            .value as RoleBudgetRequestVisibility,
                        }
                      : previous,
                  )
                }
                className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="all">View all requests</option>
                <option value="assigned">Own + assigned approvals</option>
                <option value="own">Own requests only</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {AVAILABLE_TABS.map((tab) => {
                const Icon = iconMap[tab.icon];
                const purchaseOrderRestricted =
                  tab.path === PURCHASE_ORDER_PATH &&
                  !canRoleAccessPurchaseOrders(editingRole);
                const checked =
                  !purchaseOrderRestricted && selectedTabs.includes(tab.path);

                return (
                  <label
                    key={tab.path}
                    className={
                      purchaseOrderRestricted
                        ? "flex cursor-not-allowed items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 opacity-80"
                        : checked
                          ? "flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-900 bg-slate-950 p-4 text-white"
                          : "flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-700 hover:bg-slate-50"
                    }
                  >
                    <Checkbox
                      checked={checked}
                      disabled={purchaseOrderRestricted}
                      onCheckedChange={(value) => {
                        if (purchaseOrderRestricted) return;

                        setSelectedTabs((previous) =>
                          value === true
                            ? Array.from(new Set([...previous, tab.path]))
                            : previous.filter((path) => path !== tab.path),
                        );
                      }}
                    />
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      {Icon ? <Icon className="h-4 w-4" /> : null}
                      {tab.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setEditingRole(null)}
              className="rounded-xl bg-white"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} className="rounded-xl bg-slate-950">
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Role */}
      <Dialog open={showCreateRole} onOpenChange={setShowCreateRole}>
        <DialogContent className="rounded-[2rem] border-slate-200 p-0 shadow-xl sm:max-w-lg">
          <div className="border-b border-slate-100 p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-950">
                Create New Role
              </DialogTitle>
            </DialogHeader>
            <p className="mt-2 text-sm text-slate-500">
              Create the role first, then edit it to assign module permissions.
            </p>
          </div>

          <div className="space-y-4 p-6">
            <div className="space-y-2">
              <Label>Role Name *</Label>
              <Input
                value={newRole.name}
                onChange={(event) =>
                  setNewRole((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
                placeholder="e.g. Creative Manager"
                className="h-11 rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={newRole.description}
                onChange={(event) =>
                  setNewRole((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
                placeholder="Short role description"
                className="h-11 rounded-2xl"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateRole(false);
                setNewRole({ name: "", description: "" });
              }}
              className="rounded-xl bg-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRole}
              className="rounded-xl bg-slate-950"
            >
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User */}
      <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-[2rem] border-slate-200 p-0 shadow-xl">
          <div className="border-b border-slate-100 p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-950">
                Create User
              </DialogTitle>
            </DialogHeader>
            <p className="mt-2 text-sm text-slate-500">
              The user's Role is used as the Budget Role for Budget Request
              approval workflow selection. Department remains profile
              information.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={newUser.displayName}
                onChange={(event) =>
                  setNewUser((previous) => ({
                    ...previous,
                    displayName: event.target.value,
                  }))
                }
                placeholder="Full name"
                className="h-11 rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(event) =>
                  setNewUser((previous) => ({
                    ...previous,
                    email: event.target.value,
                  }))
                }
                placeholder="name@example.com"
                className="h-11 rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Password *</Label>
              <div className="flex gap-2">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newUser.password}
                  onChange={(event) =>
                    setNewUser((previous) => ({
                      ...previous,
                      password: event.target.value,
                    }))
                  }
                  placeholder="Password"
                  className="h-11 rounded-2xl"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPassword((value) => !value)}
                  className="h-11 rounded-2xl"
                >
                  {showPassword ? "Hide" : "Show"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role *</Label>
              <select
                value={newUser.role}
                onChange={(event) =>
                  setNewUser((previous) => ({
                    ...previous,
                    role: event.target.value,
                  }))
                }
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="">Select role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400">
                This Role is also the user's Budget Role. Budget Request
                approval routing uses this Role and does not require a
                Department assignment.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Designation *</Label>
              <Input
                value={newUser.designation}
                onChange={(event) =>
                  setNewUser((previous) => ({
                    ...previous,
                    designation: event.target.value,
                  }))
                }
                placeholder="Designation"
                className="h-11 rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Mobile *</Label>
              <div className="grid grid-cols-[110px_1fr] gap-2">
                <Input
                  value={newUser.mobileCountryCode}
                  onChange={(event) =>
                    setNewUser((previous) => ({
                      ...previous,
                      mobileCountryCode: event.target.value,
                    }))
                  }
                  placeholder="+92"
                  className="h-11 rounded-2xl"
                />
                <Input
                  value={newUser.mobileNo}
                  onChange={(event) =>
                    setNewUser((previous) => ({
                      ...previous,
                      mobileNo: event.target.value,
                    }))
                  }
                  placeholder="3001234567"
                  className="h-11 rounded-2xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Region *</Label>
              <Input
                value={newUser.region}
                onChange={(event) =>
                  setNewUser((previous) => ({
                    ...previous,
                    region: event.target.value,
                  }))
                }
                placeholder="Region"
                className="h-11 rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Reporting To</Label>
              <Input
                value={newUser.reportingTo}
                onChange={(event) =>
                  setNewUser((previous) => ({
                    ...previous,
                    reportingTo: event.target.value,
                  }))
                }
                placeholder="Manager / reporting person"
                className="h-11 rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Financial Limit</Label>
              <Input
                type="number"
                value={newUser.financialLimit}
                onChange={(event) =>
                  setNewUser((previous) => ({
                    ...previous,
                    financialLimit: event.target.value,
                  }))
                }
                placeholder="0"
                className="h-11 rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Budget Request Access</Label>
              <select
                value={newUser.budgetRequestVisibility}
                onChange={(event) =>
                  setNewUser((previous) => ({
                    ...previous,
                    budgetRequestVisibility: event.target
                      .value as BudgetRequestVisibility,
                  }))
                }
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="role">Use role default</option>
                <option value="all">View all requests</option>
                <option value="assigned">Own + assigned approvals</option>
                <option value="own">Own requests only</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Purchase Order Access</Label>
              <select
                value={newUser.purchaseOrderVisibility}
                onChange={(event) =>
                  setNewUser((previous) => ({
                    ...previous,
                    purchaseOrderVisibility: event.target
                      .value as PurchaseOrderVisibility,
                  }))
                }
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="own">Own / assigned POs</option>
                <option value="all">View all POs</option>
              </select>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
            <Button
              variant="outline"
              disabled={creating}
              onClick={() => setShowCreateUser(false)}
              className="rounded-xl bg-white"
            >
              Cancel
            </Button>
            <Button
              disabled={creating}
              onClick={handleCreateUser}
              className="rounded-xl bg-slate-950"
            >
              {creating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              {creating ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
