// import React, { useEffect, useMemo, useState } from "react";
// import {
//   addDoc,
//   collection,
//   deleteDoc,
//   doc,
//   getDocs,
//   onSnapshot,
//   query,
//   serverTimestamp,
//   updateDoc,
//   where,
// } from "firebase/firestore";
// import {
//   CalendarDays,
//   ChevronLeft,
//   ChevronRight,
//   Clock,
//   Edit,
//   Plus,
//   Trash2,
//   UserRound,
//   X,
// } from "lucide-react";

// import { db } from "@/lib/firebase";
// import { useAuth } from "@/contexts/AuthContext";
// import { useToast } from "@/hooks/use-toast";
// import { createNotification } from "@/hooks/useNotifications";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Badge } from "@/components/ui/badge";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { Checkbox } from "@/components/ui/checkbox";

// const PANEL_ID = "IEDGE-SYSTEM";

// type TaskStatus = "todo" | "in_progress" | "review" | "done";
// type TaskPriority = "low" | "medium" | "high" | "urgent";

// interface SystemUser {
//   id: string;
//   displayName: string;
//   email: string;
//   role?: string;
//   department?: string;
// }

// interface JiraTask {
//   id: string;
//   title: string;
//   description: string;
//   status: TaskStatus;
//   priority: TaskPriority;
//   startDate: string;
//   dueDate: string;
//   assigneeIds: string[];
//   assigneeNames: string[];
//   visibleTo: string[];
//   createdById: string;
//   createdByName: string;
//   createdAt?: any;
//   updatedAt?: any;
// }

// interface TaskFormData {
//   title: string;
//   description: string;
//   status: TaskStatus;
//   priority: TaskPriority;
//   startDate: string;
//   dueDate: string;
//   assigneeIds: string[];
// }

// const EMPTY_FORM: TaskFormData = {
//   title: "",
//   description: "",
//   status: "todo",
//   priority: "medium",
//   startDate: "",
//   dueDate: "",
//   assigneeIds: [],
// };

// const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
//   { value: "todo", label: "To Do" },
//   { value: "in_progress", label: "In Progress" },
//   { value: "review", label: "Review" },
//   { value: "done", label: "Done" },
// ];

// const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
//   { value: "low", label: "Low" },
//   { value: "medium", label: "Medium" },
//   { value: "high", label: "High" },
//   { value: "urgent", label: "Urgent" },
// ];

// function formatDateKey(date: Date) {
//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, "0");
//   const day = String(date.getDate()).padStart(2, "0");
//   return `${year}-${month}-${day}`;
// }

// function parseDateKey(dateKey: string) {
//   const [year, month, day] = dateKey.split("-").map(Number);
//   return new Date(year, month - 1, day);
// }

// function getMonthDays(monthDate: Date) {
//   const year = monthDate.getFullYear();
//   const month = monthDate.getMonth();

//   const firstDay = new Date(year, month, 1);
//   const lastDay = new Date(year, month + 1, 0);

//   const startOffset = firstDay.getDay();
//   const totalDays = lastDay.getDate();

//   const cells: Array<Date | null> = [];

//   for (let i = 0; i < startOffset; i++) {
//     cells.push(null);
//   }

//   for (let day = 1; day <= totalDays; day++) {
//     cells.push(new Date(year, month, day));
//   }

//   while (cells.length % 7 !== 0) {
//     cells.push(null);
//   }

//   return cells;
// }

// function getStatusBadgeClass(status: TaskStatus) {
//   switch (status) {
//     case "todo":
//       return "bg-slate-100 text-slate-700 border-slate-200";
//     case "in_progress":
//       return "bg-blue-100 text-blue-700 border-blue-200";
//     case "review":
//       return "bg-amber-100 text-amber-700 border-amber-200";
//     case "done":
//       return "bg-green-100 text-green-700 border-green-200";
//     default:
//       return "bg-slate-100 text-slate-700 border-slate-200";
//   }
// }

// function getPriorityBadgeClass(priority: TaskPriority) {
//   switch (priority) {
//     case "low":
//       return "bg-slate-50 text-slate-600 border-slate-200";
//     case "medium":
//       return "bg-blue-50 text-blue-700 border-blue-200";
//     case "high":
//       return "bg-orange-50 text-orange-700 border-orange-200";
//     case "urgent":
//       return "bg-red-50 text-red-700 border-red-200";
//     default:
//       return "bg-slate-50 text-slate-600 border-slate-200";
//   }
// }

// function getStatusLabel(status: TaskStatus) {
//   return STATUS_OPTIONS.find((item) => item.value === status)?.label || status;
// }

// function getPriorityLabel(priority: TaskPriority) {
//   return (
//     PRIORITY_OPTIONS.find((item) => item.value === priority)?.label || priority
//   );
// }

// function isAdminLike(role?: string, department?: string) {
//   const roleText = String(role || "").toLowerCase();
//   const deptText = String(department || "").toLowerCase();

//   return (
//     roleText.includes("admin") ||
//     roleText.includes("finance") ||
//     deptText.includes("admin") ||
//     deptText.includes("management")
//   );
// }

// function UserAssigneeSelect({
//   users,
//   selectedIds,
//   onChange,
// }: {
//   users: SystemUser[];
//   selectedIds: string[];
//   onChange: (ids: string[]) => void;
// }) {
//   const [query, setQuery] = useState("");

//   const filteredUsers = useMemo(() => {
//     const needle = query.trim().toLowerCase();

//     if (!needle) return users;

//     return users.filter((user) => {
//       const haystack = [
//         user.displayName,
//         user.email,
//         user.role,
//         user.department,
//       ]
//         .filter(Boolean)
//         .join(" ")
//         .toLowerCase();

//       return haystack.includes(needle);
//     });
//   }, [users, query]);

//   const selectedUsers = users.filter((user) => selectedIds.includes(user.id));

//   const toggleUser = (userId: string, checked: boolean) => {
//     if (checked) {
//       onChange(Array.from(new Set([...selectedIds, userId])));
//     } else {
//       onChange(selectedIds.filter((id) => id !== userId));
//     }
//   };

//   return (
//     <div className="space-y-2">
//       <Label className="text-xs font-medium">Assign To</Label>

//       <Popover>
//         <PopoverTrigger asChild>
//           <Button
//             type="button"
//             variant="outline"
//             className="h-10 w-full justify-between"
//           >
//             <span className="truncate text-sm">
//               {selectedUsers.length > 0
//                 ? selectedUsers.map((user) => user.displayName).join(", ")
//                 : "Select users"}
//             </span>
//             <UserRound className="h-4 w-4 text-muted-foreground" />
//           </Button>
//         </PopoverTrigger>

//         <PopoverContent align="start" className="w-[360px] p-3">
//           <div className="space-y-3">
//             <Input
//               value={query}
//               onChange={(event) => setQuery(event.target.value)}
//               placeholder="Search users..."
//               className="h-9"
//             />

//             <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border p-2">
//               {filteredUsers.length > 0 ? (
//                 filteredUsers.map((user) => {
//                   const checked = selectedIds.includes(user.id);

//                   return (
//                     <label
//                       key={user.id}
//                       className="flex cursor-pointer items-start gap-3 rounded-lg border bg-white p-3 hover:bg-muted/40"
//                     >
//                       <Checkbox
//                         checked={checked}
//                         onCheckedChange={(value) =>
//                           toggleUser(user.id, value === true)
//                         }
//                       />

//                       <div className="min-w-0">
//                         <p className="text-sm font-medium">
//                           {user.displayName}
//                         </p>
//                         <p className="text-xs text-muted-foreground">
//                           {[user.role, user.department]
//                             .filter(Boolean)
//                             .join(" • ") ||
//                             user.email ||
//                             "User"}
//                         </p>
//                       </div>
//                     </label>
//                   );
//                 })
//               ) : (
//                 <p className="p-3 text-xs text-muted-foreground">
//                   No users found.
//                 </p>
//               )}
//             </div>
//           </div>
//         </PopoverContent>
//       </Popover>

//       {selectedUsers.length > 0 && (
//         <div className="flex flex-wrap gap-2">
//           {selectedUsers.map((user) => (
//             <Badge key={user.id} variant="secondary" className="gap-1">
//               {user.displayName}
//               <button
//                 type="button"
//                 onClick={() =>
//                   onChange(selectedIds.filter((id) => id !== user.id))
//                 }
//               >
//                 <X className="h-3 w-3" />
//               </button>
//             </Badge>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// export default function JiraTaskCalendar() {
//   const { currentUser, userProfile } = useAuth();
//   const { toast } = useToast();

//   const actorId = currentUser?.uid || userProfile?.id || "";
//   const actorName =
//     userProfile?.displayName || currentUser?.email || "Unknown User";

//   const [tasks, setTasks] = useState<JiraTask[]>([]);
//   const [users, setUsers] = useState<SystemUser[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [usersLoading, setUsersLoading] = useState(true);

//   const [currentMonth, setCurrentMonth] = useState(() => {
//     const today = new Date();
//     return new Date(today.getFullYear(), today.getMonth(), 1);
//   });

//   const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()));
//   const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
//   const [assigneeFilter, setAssigneeFilter] = useState<"all" | string>("all");

//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [editingTask, setEditingTask] = useState<JiraTask | null>(null);
//   const [formData, setFormData] = useState<TaskFormData>(EMPTY_FORM);
//   const [saving, setSaving] = useState(false);

//   const canViewAllTasks = isAdminLike(userProfile?.role, userProfile?.department);

//   useEffect(() => {
//     let mounted = true;

//     const loadUsers = async () => {
//       setUsersLoading(true);

//       try {
//         const snap = await getDocs(
//           collection(db, "Panels", PANEL_ID, "users"),
//         );

//         const nextUsers: SystemUser[] = snap.docs
//           .map((userDoc) => {
//             const data = userDoc.data() as any;

//             return {
//               id: userDoc.id,
//               displayName:
//                 data.displayName ||
//                 data.name ||
//                 data.fullName ||
//                 data.email ||
//                 "Unknown User",
//               email: data.email || data.userEmail || "",
//               role: data.role || "",
//               department: data.department || data.dept || data.team || "",
//             };
//           })
//           .sort((a, b) => a.displayName.localeCompare(b.displayName));

//         if (mounted) {
//           setUsers(nextUsers);
//         }
//       } catch (error) {
//         console.error("Error loading users:", error);

//         if (mounted) {
//           setUsers([]);
//         }
//       } finally {
//         if (mounted) {
//           setUsersLoading(false);
//         }
//       }
//     };

//     loadUsers();

//     return () => {
//       mounted = false;
//     };
//   }, []);

//   useEffect(() => {
//     if (!actorId) {
//       setTasks([]);
//       setLoading(false);
//       return;
//     }

//     setLoading(true);

//     const taskCollection = collection(db, "Panels", PANEL_ID, "jiraTasks");

//     const taskQuery = canViewAllTasks
//       ? query(taskCollection)
//       : query(taskCollection, where("visibleTo", "array-contains", actorId));

//     const unsubscribe = onSnapshot(
//       taskQuery,
//       (snapshot) => {
//         const nextTasks: JiraTask[] = snapshot.docs.map((taskDoc) => {
//           const data = taskDoc.data() as any;

//           return {
//             id: taskDoc.id,
//             title: data.title || "",
//             description: data.description || "",
//             status: data.status || "todo",
//             priority: data.priority || "medium",
//             startDate: data.startDate || "",
//             dueDate: data.dueDate || "",
//             assigneeIds: Array.isArray(data.assigneeIds)
//               ? data.assigneeIds
//               : [],
//             assigneeNames: Array.isArray(data.assigneeNames)
//               ? data.assigneeNames
//               : [],
//             visibleTo: Array.isArray(data.visibleTo) ? data.visibleTo : [],
//             createdById: data.createdById || "",
//             createdByName: data.createdByName || "",
//             createdAt: data.createdAt,
//             updatedAt: data.updatedAt,
//           };
//         });

//         nextTasks.sort((a, b) => {
//           const dateCompare = String(a.dueDate).localeCompare(String(b.dueDate));
//           if (dateCompare !== 0) return dateCompare;
//           return a.title.localeCompare(b.title);
//         });

//         setTasks(nextTasks);
//         setLoading(false);
//       },
//       (error) => {
//         console.error("Error loading tasks:", error);
//         setLoading(false);
//       },
//     );

//     return () => unsubscribe();
//   }, [actorId, canViewAllTasks]);

//   const monthCells = useMemo(() => getMonthDays(currentMonth), [currentMonth]);

//   const filteredTasks = useMemo(() => {
//     return tasks.filter((task) => {
//       const statusMatches =
//         statusFilter === "all" || task.status === statusFilter;

//       const assigneeMatches =
//         assigneeFilter === "all" || task.assigneeIds.includes(assigneeFilter);

//       return statusMatches && assigneeMatches;
//     });
//   }, [tasks, statusFilter, assigneeFilter]);

//   const tasksByDate = useMemo(() => {
//     const map: Record<string, JiraTask[]> = {};

//     filteredTasks.forEach((task) => {
//       if (!task.dueDate) return;

//       if (!map[task.dueDate]) {
//         map[task.dueDate] = [];
//       }

//       map[task.dueDate].push(task);
//     });

//     return map;
//   }, [filteredTasks]);

//   const selectedDateTasks = tasksByDate[selectedDate] || [];

//   const selectedMonthName = currentMonth.toLocaleString("default", {
//     month: "long",
//     year: "numeric",
//   });

//   const openCreateDialog = (dateKey?: string) => {
//     const date = dateKey || selectedDate || formatDateKey(new Date());

//     setEditingTask(null);
//     setFormData({
//       ...EMPTY_FORM,
//       startDate: date,
//       dueDate: date,
//       assigneeIds: actorId ? [actorId] : [],
//     });
//     setDialogOpen(true);
//   };

//   const openEditDialog = (task: JiraTask) => {
//     setEditingTask(task);
//     setFormData({
//       title: task.title,
//       description: task.description,
//       status: task.status,
//       priority: task.priority,
//       startDate: task.startDate || task.dueDate,
//       dueDate: task.dueDate,
//       assigneeIds: task.assigneeIds || [],
//     });
//     setDialogOpen(true);
//   };

//   const notifyAssignees = async (taskId: string, assigneeIds: string[], message: string) => {
//     const uniqueAssignees = Array.from(new Set(assigneeIds)).filter(
//       (id) => id && id !== actorId,
//     );

//     await Promise.all(
//       uniqueAssignees.map((recipientId) =>
//         createNotification({
//           recipientId,
//           type: "day_plan_update",
//           recordId: taskId,
//           message,
//           createdById: actorId,
//           createdByName: actorName,
//         }),
//       ),
//     );
//   };

//   const handleSaveTask = async () => {
//     if (!actorId) {
//       toast({
//         title: "Login required",
//         description: "Please login before creating a task.",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!formData.title.trim()) {
//       toast({
//         title: "Task title required",
//         description: "Please enter a task title.",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!formData.dueDate) {
//       toast({
//         title: "Due date required",
//         description: "Please select a due date.",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (formData.assigneeIds.length === 0) {
//       toast({
//         title: "Assignee required",
//         description: "Please assign this task to at least one user.",
//         variant: "destructive",
//       });
//       return;
//     }

//     setSaving(true);

//     try {
//       const selectedUsers = users.filter((user) =>
//         formData.assigneeIds.includes(user.id),
//       );

//       const assigneeNames = selectedUsers.map((user) => user.displayName);

//       const visibleTo = Array.from(
//         new Set([actorId, ...formData.assigneeIds]),
//       ).filter(Boolean);

//       const payload = {
//         title: formData.title.trim(),
//         description: formData.description.trim(),
//         status: formData.status,
//         priority: formData.priority,
//         startDate: formData.startDate || formData.dueDate,
//         dueDate: formData.dueDate,
//         assigneeIds: formData.assigneeIds,
//         assigneeNames,
//         visibleTo,
//         updatedAt: serverTimestamp(),
//       };

//       if (editingTask) {
//         await updateDoc(
//           doc(db, "Panels", PANEL_ID, "Tasks", editingTask.id),
//           payload,
//         );

//         await notifyAssignees(
//           editingTask.id,
//           formData.assigneeIds,
//           `${actorName} updated task "${formData.title.trim()}"`,
//         );

//         toast({
//           title: "Task updated",
//           description: "Task has been updated successfully.",
//         });
//       } else {
//         const created = await addDoc(
//           collection(db, "Panels", PANEL_ID, "jiraTasks"),
//           {
//             ...payload,
//             createdById: actorId,
//             createdByName: actorName,
//             createdAt: serverTimestamp(),
//           },
//         );

//         await notifyAssignees(
//           created.id,
//           formData.assigneeIds,
//           `${actorName} assigned you a new task: "${formData.title.trim()}"`,
//         );

//         toast({
//           title: "Task created",
//           description: "Task has been assigned and added to users' calendars.",
//         });
//       }

//       setDialogOpen(false);
//       setEditingTask(null);
//       setFormData(EMPTY_FORM);
//     } catch (error) {
//       console.error("Error saving task:", error);
//       toast({
//         title: "Error",
//         description: "Failed to save task.",
//         variant: "destructive",
//       });
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleDeleteTask = async (task: JiraTask) => {
//     const confirmed = window.confirm(
//       `Are you sure you want to delete "${task.title}"?`,
//     );

//     if (!confirmed) return;

//     try {
//       await deleteDoc(doc(db, "Panels", PANEL_ID, "jiraTasks", task.id));

//       await notifyAssignees(
//         task.id,
//         task.assigneeIds,
//         `${actorName} deleted task "${task.title}"`,
//       );

//       toast({
//         title: "Task deleted",
//         description: "Task has been removed from the calendar.",
//       });
//     } catch (error) {
//       console.error("Error deleting task:", error);
//       toast({
//         title: "Error",
//         description: "Failed to delete task.",
//         variant: "destructive",
//       });
//     }
//   };

//   const handleDropTaskOnDate = async (taskId: string, dateKey: string) => {
//     const task = tasks.find((item) => item.id === taskId);
//     if (!task) return;

//     try {
//       await updateDoc(doc(db, "Panels", PANEL_ID, "jiraTasks", taskId), {
//         dueDate: dateKey,
//         updatedAt: serverTimestamp(),
//       });

//       await notifyAssignees(
//         taskId,
//         task.assigneeIds,
//         `${actorName} moved task "${task.title}" to ${dateKey}`,
//       );

//       toast({
//         title: "Task moved",
//         description: `Task moved to ${dateKey}.`,
//       });
//     } catch (error) {
//       console.error("Error moving task:", error);
//       toast({
//         title: "Error",
//         description: "Failed to move task.",
//         variant: "destructive",
//       });
//     }
//   };

//   const goToPreviousMonth = () => {
//     setCurrentMonth(
//       new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
//     );
//   };

//   const goToNextMonth = () => {
//     setCurrentMonth(
//       new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
//     );
//   };

//   const goToToday = () => {
//     const today = new Date();
//     setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
//     setSelectedDate(formatDateKey(today));
//   };

//   return (
//     <div className="min-h-screen bg-slate-50 p-4 md:p-6">
//       <div className="mx-auto max-w-[1500px] space-y-5">
//         <div className="flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
//           <div>
//             <div className="flex items-center gap-2">
//               <div className="rounded-xl bg-slate-950 p-2 text-white">
//                 <CalendarDays className="h-5 w-5" />
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold text-slate-950">
//                   Task Calendar
//                 </h1>
//                 <p className="text-sm text-muted-foreground">
//                   Jira-style task planning, assignment, and calendar tracking.
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div className="flex flex-wrap items-center gap-2">
//             <Select
//               value={statusFilter}
//               onValueChange={(value) =>
//                 setStatusFilter(value as "all" | TaskStatus)
//               }
//             >
//               <SelectTrigger className="w-[160px] bg-white">
//                 <SelectValue placeholder="Status" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Status</SelectItem>
//                 {STATUS_OPTIONS.map((option) => (
//                   <SelectItem key={option.value} value={option.value}>
//                     {option.label}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>

//             <Select
//               value={assigneeFilter}
//               onValueChange={(value) => setAssigneeFilter(value)}
//             >
//               <SelectTrigger className="w-[180px] bg-white">
//                 <SelectValue placeholder="Assignee" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Users</SelectItem>
//                 {users.map((user) => (
//                   <SelectItem key={user.id} value={user.id}>
//                     {user.displayName}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>

//             <Button type="button" variant="outline" onClick={goToToday}>
//               Today
//             </Button>

//             <Button
//               type="button"
//               className="gap-2 bg-slate-950 text-white hover:bg-slate-800"
//               onClick={() => openCreateDialog()}
//             >
//               <Plus className="h-4 w-4" />
//               Add Task
//             </Button>
//           </div>
//         </div>

//         <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
//           <div className="rounded-2xl border bg-white p-4 shadow-sm">
//             <div className="mb-4 flex items-center justify-between">
//               <div className="flex items-center gap-2">
//                 <Button
//                   type="button"
//                   variant="outline"
//                   size="icon"
//                   onClick={goToPreviousMonth}
//                 >
//                   <ChevronLeft className="h-4 w-4" />
//                 </Button>

//                 <Button
//                   type="button"
//                   variant="outline"
//                   size="icon"
//                   onClick={goToNextMonth}
//                 >
//                   <ChevronRight className="h-4 w-4" />
//                 </Button>

//                 <h2 className="ml-2 text-xl font-semibold">
//                   {selectedMonthName}
//                 </h2>
//               </div>

//               <p className="text-sm text-muted-foreground">
//                 {loading ? "Loading tasks..." : `${filteredTasks.length} tasks`}
//               </p>
//             </div>

//             <div className="grid grid-cols-7 border-y bg-slate-50 text-center text-xs font-semibold uppercase text-muted-foreground">
//               {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
//                 <div key={day} className="border-r p-3 last:border-r-0">
//                   {day}
//                 </div>
//               ))}
//             </div>

//             <div className="grid grid-cols-7">
//               {monthCells.map((date, index) => {
//                 const dateKey = date ? formatDateKey(date) : "";
//                 const dayTasks = date ? tasksByDate[dateKey] || [] : [];
//                 const isToday = dateKey === formatDateKey(new Date());
//                 const isSelected = selectedDate === dateKey;

//                 return (
//                   <div
//                     key={index}
//                     onClick={() => date && setSelectedDate(dateKey)}
//                     onDragOver={(event) => {
//                       if (date) event.preventDefault();
//                     }}
//                     onDrop={(event) => {
//                       if (!date) return;
//                       const taskId = event.dataTransfer.getData("taskId");
//                       if (taskId) handleDropTaskOnDate(taskId, dateKey);
//                     }}
//                     className={`min-h-[145px] border-b border-r p-2 transition last:border-r-0 ${
//                       date
//                         ? "cursor-pointer bg-white hover:bg-slate-50"
//                         : "bg-slate-50"
//                     } ${isSelected ? "ring-2 ring-slate-950 ring-inset" : ""}`}
//                   >
//                     {date && (
//                       <>
//                         <div className="mb-2 flex items-center justify-between">
//                           <span
//                             className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
//                               isToday
//                                 ? "bg-slate-950 text-white"
//                                 : "text-slate-700"
//                             }`}
//                           >
//                             {date.getDate()}
//                           </span>

//                           <button
//                             type="button"
//                             onClick={(event) => {
//                               event.stopPropagation();
//                               openCreateDialog(dateKey);
//                             }}
//                             className="rounded-md p-1 text-muted-foreground hover:bg-slate-100 hover:text-slate-950"
//                           >
//                             <Plus className="h-3.5 w-3.5" />
//                           </button>
//                         </div>

//                         <div className="space-y-1.5">
//                           {dayTasks.slice(0, 4).map((task) => (
//                             <div
//                               key={task.id}
//                               draggable
//                               onDragStart={(event) => {
//                                 event.dataTransfer.setData("taskId", task.id);
//                               }}
//                               onClick={(event) => {
//                                 event.stopPropagation();
//                                 openEditDialog(task);
//                               }}
//                               className="rounded-lg border bg-white p-2 text-xs shadow-sm hover:border-slate-400"
//                             >
//                               <div className="line-clamp-1 font-medium text-slate-900">
//                                 {task.title}
//                               </div>
//                               <div className="mt-1 flex items-center justify-between gap-1">
//                                 <span
//                                   className={`rounded-full border px-1.5 py-0.5 text-[10px] ${getStatusBadgeClass(
//                                     task.status,
//                                   )}`}
//                                 >
//                                   {getStatusLabel(task.status)}
//                                 </span>
//                                 <span className="text-[10px] text-muted-foreground">
//                                   {task.assigneeNames.length}
//                                 </span>
//                               </div>
//                             </div>
//                           ))}

//                           {dayTasks.length > 4 && (
//                             <p className="text-xs text-muted-foreground">
//                               +{dayTasks.length - 4} more
//                             </p>
//                           )}
//                         </div>
//                       </>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//           </div>

//           <div className="rounded-2xl border bg-white p-4 shadow-sm">
//             <div className="mb-4 flex items-start justify-between gap-3">
//               <div>
//                 <h3 className="text-lg font-semibold">Selected Day</h3>
//                 <p className="text-sm text-muted-foreground">
//                   {parseDateKey(selectedDate).toLocaleDateString("en-GB", {
//                     weekday: "long",
//                     day: "numeric",
//                     month: "long",
//                     year: "numeric",
//                   })}
//                 </p>
//               </div>

//               <Button
//                 type="button"
//                 size="sm"
//                 className="gap-1 bg-slate-950 text-white hover:bg-slate-800"
//                 onClick={() => openCreateDialog(selectedDate)}
//               >
//                 <Plus className="h-4 w-4" />
//                 Add
//               </Button>
//             </div>

//             <div className="space-y-3">
//               {selectedDateTasks.length > 0 ? (
//                 selectedDateTasks.map((task) => (
//                   <div
//                     key={task.id}
//                     className="rounded-xl border bg-white p-4 shadow-sm"
//                   >
//                     <div className="flex items-start justify-between gap-3">
//                       <div className="min-w-0">
//                         <h4 className="font-semibold text-slate-950">
//                           {task.title}
//                         </h4>

//                         {task.description && (
//                           <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
//                             {task.description}
//                           </p>
//                         )}
//                       </div>

//                       <div className="flex shrink-0 gap-1">
//                         <Button
//                           type="button"
//                           variant="ghost"
//                           size="icon"
//                           onClick={() => openEditDialog(task)}
//                         >
//                           <Edit className="h-4 w-4" />
//                         </Button>

//                         <Button
//                           type="button"
//                           variant="ghost"
//                           size="icon"
//                           onClick={() => handleDeleteTask(task)}
//                         >
//                           <Trash2 className="h-4 w-4 text-red-600" />
//                         </Button>
//                       </div>
//                     </div>

//                     <div className="mt-3 flex flex-wrap gap-2">
//                       <Badge
//                         variant="outline"
//                         className={getStatusBadgeClass(task.status)}
//                       >
//                         {getStatusLabel(task.status)}
//                       </Badge>

//                       <Badge
//                         variant="outline"
//                         className={getPriorityBadgeClass(task.priority)}
//                       >
//                         {getPriorityLabel(task.priority)}
//                       </Badge>

//                       <Badge variant="outline" className="gap-1">
//                         <Clock className="h-3 w-3" />
//                         {task.dueDate}
//                       </Badge>
//                     </div>

//                     <div className="mt-3">
//                       <p className="text-xs font-medium text-muted-foreground">
//                         Assigned To
//                       </p>
//                       <div className="mt-1 flex flex-wrap gap-1.5">
//                         {task.assigneeNames.length > 0 ? (
//                           task.assigneeNames.map((name) => (
//                             <Badge key={name} variant="secondary">
//                               {name}
//                             </Badge>
//                           ))
//                         ) : (
//                           <span className="text-xs text-muted-foreground">
//                             No assignee
//                           </span>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 ))
//               ) : (
//                 <div className="rounded-xl border border-dashed p-8 text-center">
//                   <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground" />
//                   <p className="mt-3 text-sm font-medium">No tasks today</p>
//                   <p className="text-xs text-muted-foreground">
//                     Add a task or drag any task into this date.
//                   </p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
//         <DialogContent className="max-w-2xl">
//           <DialogHeader>
//             <DialogTitle>
//               {editingTask ? "Edit Task" : "Add New Task"}
//             </DialogTitle>
//           </DialogHeader>

//           <div className="grid gap-4">
//             <div>
//               <Label htmlFor="task-title" className="text-xs font-medium">
//                 Task Title *
//               </Label>
//               <Input
//                 id="task-title"
//                 value={formData.title}
//                 onChange={(event) =>
//                   setFormData((prev) => ({
//                     ...prev,
//                     title: event.target.value,
//                   }))
//                 }
//                 placeholder="Enter task title"
//                 className="mt-1"
//               />
//             </div>

//             <div>
//               <Label htmlFor="task-description" className="text-xs font-medium">
//                 Description
//               </Label>
//               <Textarea
//                 id="task-description"
//                 value={formData.description}
//                 onChange={(event) =>
//                   setFormData((prev) => ({
//                     ...prev,
//                     description: event.target.value,
//                   }))
//                 }
//                 placeholder="Task details..."
//                 className="mt-1 min-h-[90px]"
//               />
//             </div>

//             <div className="grid gap-4 md:grid-cols-2">
//               <div>
//                 <Label className="text-xs font-medium">Status</Label>
//                 <Select
//                   value={formData.status}
//                   onValueChange={(value) =>
//                     setFormData((prev) => ({
//                       ...prev,
//                       status: value as TaskStatus,
//                     }))
//                   }
//                 >
//                   <SelectTrigger className="mt-1">
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {STATUS_OPTIONS.map((option) => (
//                       <SelectItem key={option.value} value={option.value}>
//                         {option.label}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div>
//                 <Label className="text-xs font-medium">Priority</Label>
//                 <Select
//                   value={formData.priority}
//                   onValueChange={(value) =>
//                     setFormData((prev) => ({
//                       ...prev,
//                       priority: value as TaskPriority,
//                     }))
//                   }
//                 >
//                   <SelectTrigger className="mt-1">
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {PRIORITY_OPTIONS.map((option) => (
//                       <SelectItem key={option.value} value={option.value}>
//                         {option.label}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>

//             <div className="grid gap-4 md:grid-cols-2">
//               <div>
//                 <Label htmlFor="start-date" className="text-xs font-medium">
//                   Start Date
//                 </Label>
//                 <Input
//                   id="start-date"
//                   type="date"
//                   value={formData.startDate}
//                   onChange={(event) =>
//                     setFormData((prev) => ({
//                       ...prev,
//                       startDate: event.target.value,
//                     }))
//                   }
//                   className="mt-1"
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="due-date" className="text-xs font-medium">
//                   Due Date *
//                 </Label>
//                 <Input
//                   id="due-date"
//                   type="date"
//                   value={formData.dueDate}
//                   onChange={(event) =>
//                     setFormData((prev) => ({
//                       ...prev,
//                       dueDate: event.target.value,
//                     }))
//                   }
//                   className="mt-1"
//                 />
//               </div>
//             </div>

//             <UserAssigneeSelect
//               users={users}
//               selectedIds={formData.assigneeIds}
//               onChange={(ids) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   assigneeIds: ids,
//                 }))
//               }
//             />

//             {usersLoading && (
//               <p className="text-xs text-muted-foreground">
//                 Loading users...
//               </p>
//             )}

//             <div className="flex justify-end gap-2 pt-3">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => setDialogOpen(false)}
//                 disabled={saving}
//               >
//                 Cancel
//               </Button>

//               <Button
//                 type="button"
//                 onClick={handleSaveTask}
//                 disabled={saving}
//                 className="bg-slate-950 text-white hover:bg-slate-800"
//               >
//                 {saving
//                   ? "Saving..."
//                   : editingTask
//                     ? "Update Task"
//                     : "Create Task"}
//               </Button>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }




import React, { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  Plus,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { createNotification } from "@/hooks/useNotifications";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const PANEL_ID = "IEDGE-SYSTEM";
const TASKS_COLLECTION = "tasks";

type TaskStatus = "todo" | "in_progress" | "review" | "done";
type TaskPriority = "low" | "medium" | "high" | "urgent";

interface SystemUser {
  id: string;
  displayName: string;
  email: string;
  role?: string;
  department?: string;
}

interface CalendarTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string;
  dueDate: string;
  assigneeIds: string[];
  assigneeNames: string[];
  visibleTo: string[];
  createdById: string;
  createdByName: string;
  createdAt?: any;
  updatedAt?: any;
}

interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string;
  dueDate: string;
  assigneeIds: string[];
}

const EMPTY_FORM: TaskFormData = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  startDate: "",
  dueDate: "",
  assigneeIds: [],
};

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getMonthCells(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const cells: Array<Date | null> = [];

  for (let i = 0; i < firstDay.getDay(); i++) {
    cells.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function getStatusLabel(status: TaskStatus) {
  return STATUS_OPTIONS.find((item) => item.value === status)?.label || status;
}

function getPriorityLabel(priority: TaskPriority) {
  return (
    PRIORITY_OPTIONS.find((item) => item.value === priority)?.label || priority
  );
}

function getStatusBadgeClass(status: TaskStatus) {
  switch (status) {
    case "todo":
      return "border-slate-200 bg-slate-100 text-slate-700";
    case "in_progress":
      return "border-blue-200 bg-blue-100 text-blue-700";
    case "review":
      return "border-amber-200 bg-amber-100 text-amber-700";
    case "done":
      return "border-green-200 bg-green-100 text-green-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function getPriorityBadgeClass(priority: TaskPriority) {
  switch (priority) {
    case "low":
      return "border-slate-200 bg-slate-50 text-slate-600";
    case "medium":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "high":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "urgent":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function isAdminLikeRole(role?: string) {
  const normalizedRole = String(role || "")
    .trim()
    .toLowerCase();

  return (
    normalizedRole === "main_admin" ||
    normalizedRole === "operational_admin" ||
    normalizedRole === "financial_admin" ||
    normalizedRole === "finance"
  );
}

function UserAssigneeSelect({
  users,
  selectedIds,
  onChange,
}: {
  users: SystemUser[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    const needle = search.trim().toLowerCase();

    if (!needle) return users;

    return users.filter((user) => {
      const haystack = [
        user.displayName,
        user.email,
        user.role,
        user.department,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [users, search]);

  const selectedUsers = users.filter((user) => selectedIds.includes(user.id));

  const toggleUser = (userId: string, checked: boolean) => {
    if (checked) {
      onChange(Array.from(new Set([...selectedIds, userId])));
    } else {
      onChange(selectedIds.filter((id) => id !== userId));
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">Assign To *</Label>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full justify-between"
          >
            <span className="truncate text-sm">
              {selectedUsers.length > 0
                ? selectedUsers.map((user) => user.displayName).join(", ")
                : "Select users"}
            </span>
            <UserRound className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-[360px] p-3">
          <div className="space-y-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users..."
              className="h-9"
            />

            <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border p-2">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const checked = selectedIds.includes(user.id);

                  return (
                    <label
                      key={user.id}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border bg-white p-3 hover:bg-muted/40"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) =>
                          toggleUser(user.id, value === true)
                        }
                      />

                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {user.displayName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {[user.role, user.department]
                            .filter(Boolean)
                            .join(" • ") ||
                            user.email ||
                            "User"}
                        </p>
                      </div>
                    </label>
                  );
                })
              ) : (
                <p className="p-3 text-xs text-muted-foreground">
                  No users found.
                </p>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <Badge key={user.id} variant="secondary" className="gap-1">
              {user.displayName}
              <button
                type="button"
                onClick={() =>
                  onChange(selectedIds.filter((id) => id !== user.id))
                }
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TaskCalendar() {
  const { currentUser, userProfile } = useAuth();
  const { toast } = useToast();

  const actorId = currentUser?.uid || userProfile?.id || "";
  const actorName =
    userProfile?.displayName || currentUser?.email || "Unknown User";

  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()));

  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<"all" | string>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CalendarTask | null>(null);
  const [formData, setFormData] = useState<TaskFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const canViewAllTasks = isAdminLikeRole(userProfile?.role);

  useEffect(() => {
    let mounted = true;

    const loadUsers = async () => {
      setUsersLoading(true);

      try {
        const snapshot = await getDocs(
          collection(db, "Panels", PANEL_ID, "users"),
        );

        const nextUsers: SystemUser[] = snapshot.docs
          .map((userDoc) => {
            const data = userDoc.data() as any;

            return {
              id: userDoc.id,
              displayName:
                data.displayName ||
                data.name ||
                data.fullName ||
                data.email ||
                "Unknown User",
              email: data.email || data.userEmail || "",
              role: data.role || "",
              department: data.department || data.dept || data.team || "",
            };
          })
          .sort((a, b) => a.displayName.localeCompare(b.displayName));

        if (mounted) {
          setUsers(nextUsers);
        }
      } catch (error) {
        console.error("Error loading users:", error);

        if (mounted) {
          setUsers([]);
        }

        toast({
          title: "Users not loaded",
          description: "Could not load users for task assignment.",
          variant: "destructive",
        });
      } finally {
        if (mounted) {
          setUsersLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      mounted = false;
    };
  }, [toast]);

  useEffect(() => {
    if (!actorId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const tasksRef = collection(db, "Panels", PANEL_ID, TASKS_COLLECTION);

    const tasksQuery = canViewAllTasks
      ? query(tasksRef)
      : query(tasksRef, where("visibleTo", "array-contains", actorId));

    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const nextTasks: CalendarTask[] = snapshot.docs.map((taskDoc) => {
          const data = taskDoc.data() as any;

          return {
            id: taskDoc.id,
            title: data.title || "",
            description: data.description || "",
            status: data.status || "todo",
            priority: data.priority || "medium",
            startDate: data.startDate || "",
            dueDate: data.dueDate || "",
            assigneeIds: Array.isArray(data.assigneeIds)
              ? data.assigneeIds
              : [],
            assigneeNames: Array.isArray(data.assigneeNames)
              ? data.assigneeNames
              : [],
            visibleTo: Array.isArray(data.visibleTo) ? data.visibleTo : [],
            createdById: data.createdById || "",
            createdByName: data.createdByName || "",
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          };
        });

        nextTasks.sort((a, b) => {
          const dateCompare = String(a.dueDate).localeCompare(
            String(b.dueDate),
          );

          if (dateCompare !== 0) return dateCompare;

          return a.title.localeCompare(b.title);
        });

        setTasks(nextTasks);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading tasks:", error);
        setLoading(false);

        toast({
          title: "Tasks not loaded",
          description: "Could not load task calendar data.",
          variant: "destructive",
        });
      },
    );

    return () => unsubscribe();
  }, [actorId, canViewAllTasks, toast]);

  const monthCells = useMemo(() => {
    return getMonthCells(currentMonth);
  }, [currentMonth]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const statusMatches =
        statusFilter === "all" || task.status === statusFilter;

      const assigneeMatches =
        assigneeFilter === "all" || task.assigneeIds.includes(assigneeFilter);

      return statusMatches && assigneeMatches;
    });
  }, [tasks, statusFilter, assigneeFilter]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, CalendarTask[]> = {};

    filteredTasks.forEach((task) => {
      if (!task.dueDate) return;

      if (!map[task.dueDate]) {
        map[task.dueDate] = [];
      }

      map[task.dueDate].push(task);
    });

    return map;
  }, [filteredTasks]);

  const selectedDateTasks = tasksByDate[selectedDate] || [];

  const selectedMonthName = currentMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const openCreateDialog = (dateKey?: string) => {
    const defaultDate = dateKey || selectedDate || formatDateKey(new Date());

    setEditingTask(null);
    setFormData({
      ...EMPTY_FORM,
      startDate: defaultDate,
      dueDate: defaultDate,
      assigneeIds: actorId ? [actorId] : [],
    });
    setDialogOpen(true);
  };

  const openEditDialog = (task: CalendarTask) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      startDate: task.startDate || task.dueDate,
      dueDate: task.dueDate,
      assigneeIds: task.assigneeIds || [],
    });
    setDialogOpen(true);
  };

  const notifyAssignees = async (
    taskId: string,
    assigneeIds: string[],
    message: string,
  ) => {
    const uniqueAssignees = Array.from(new Set(assigneeIds)).filter(
      (id) => id && id !== actorId,
    );

    await Promise.all(
      uniqueAssignees.map((recipientId) =>
        createNotification({
          recipientId,
          type: "meeting_update",
          recordId: taskId,
          message,
          createdById: actorId,
          createdByName: actorName,
        }),
      ),
    );
  };

  const handleSaveTask = async () => {
    if (!actorId) {
      toast({
        title: "Login required",
        description: "Please login before creating a task.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Task title required",
        description: "Please enter a task title.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.dueDate) {
      toast({
        title: "Due date required",
        description: "Please select a due date.",
        variant: "destructive",
      });
      return;
    }

    if (formData.assigneeIds.length === 0) {
      toast({
        title: "Assignee required",
        description: "Please assign this task to at least one user.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const selectedUsers = users.filter((user) =>
        formData.assigneeIds.includes(user.id),
      );

      const assigneeNames = selectedUsers.map((user) => user.displayName);

      const visibleTo = Array.from(
        new Set([actorId, ...formData.assigneeIds]),
      ).filter(Boolean);

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        startDate: formData.startDate || formData.dueDate,
        dueDate: formData.dueDate,
        assigneeIds: formData.assigneeIds,
        assigneeNames,
        visibleTo,
        updatedAt: serverTimestamp(),
      };

      if (editingTask) {
        await updateDoc(
          doc(db, "Panels", PANEL_ID, TASKS_COLLECTION, editingTask.id),
          payload,
        );

        await notifyAssignees(
          editingTask.id,
          formData.assigneeIds,
          `${actorName} updated task "${formData.title.trim()}"`,
        );

        toast({
          title: "Task updated",
          description: "Task has been updated successfully.",
        });
      } else {
        const createdTask = await addDoc(
          collection(db, "Panels", PANEL_ID, TASKS_COLLECTION),
          {
            ...payload,
            createdById: actorId,
            createdByName: actorName,
            createdAt: serverTimestamp(),
          },
        );

        await notifyAssignees(
          createdTask.id,
          formData.assigneeIds,
          `${actorName} assigned you a new task: "${formData.title.trim()}"`,
        );

        toast({
          title: "Task created",
          description: "Task has been assigned and added to users' calendars.",
        });
      }

      setDialogOpen(false);
      setEditingTask(null);
      setFormData(EMPTY_FORM);
    } catch (error) {
      console.error("Error saving task:", error);

      toast({
        title: "Error",
        description: "Failed to save task.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (task: CalendarTask) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"?`,
    );

    if (!confirmed) return;

    try {
      await deleteDoc(
        doc(db, "Panels", PANEL_ID, TASKS_COLLECTION, task.id),
      );

      await notifyAssignees(
        task.id,
        task.assigneeIds,
        `${actorName} deleted task "${task.title}"`,
      );

      toast({
        title: "Task deleted",
        description: "Task has been removed from the calendar.",
      });
    } catch (error) {
      console.error("Error deleting task:", error);

      toast({
        title: "Error",
        description: "Failed to delete task.",
        variant: "destructive",
      });
    }
  };

  const handleDropTaskOnDate = async (taskId: string, dateKey: string) => {
    const task = tasks.find((item) => item.id === taskId);

    if (!task) return;

    try {
      await updateDoc(doc(db, "Panels", PANEL_ID, TASKS_COLLECTION, taskId), {
        dueDate: dateKey,
        updatedAt: serverTimestamp(),
      });

      await notifyAssignees(
        taskId,
        task.assigneeIds,
        `${actorName} moved task "${task.title}" to ${dateKey}`,
      );

      toast({
        title: "Task moved",
        description: `Task moved to ${dateKey}.`,
      });
    } catch (error) {
      console.error("Error moving task:", error);

      toast({
        title: "Error",
        description: "Failed to move task.",
        variant: "destructive",
      });
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const goToToday = () => {
    const today = new Date();

    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(formatDateKey(today));
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <div className="flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-slate-950 p-2 text-white">
                <CalendarDays className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-950">
                  Task Calendar
                </h1>
                <p className="text-sm text-muted-foreground">
                  Add tasks, assign users, and show tasks on each assigned
                  user&apos;s calendar.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as "all" | TaskStatus)
              }
            >
              <SelectTrigger className="w-[160px] bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>

                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={assigneeFilter}
              onValueChange={(value) => setAssigneeFilter(value)}
            >
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>

                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="button" variant="outline" onClick={goToToday}>
              Today
            </Button>

            <Button
              type="button"
              className="gap-2 bg-slate-950 text-white hover:bg-slate-800"
              onClick={() => openCreateDialog()}
            >
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={goToNextMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <h2 className="ml-2 text-xl font-semibold">
                  {selectedMonthName}
                </h2>
              </div>

              <p className="text-sm text-muted-foreground">
                {loading ? "Loading tasks..." : `${filteredTasks.length} tasks`}
              </p>
            </div>

            <div className="grid grid-cols-7 border-y bg-slate-50 text-center text-xs font-semibold uppercase text-muted-foreground">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="border-r p-3 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {monthCells.map((date, index) => {
                const dateKey = date ? formatDateKey(date) : "";
                const dayTasks = date ? tasksByDate[dateKey] || [] : [];
                const isToday = dateKey === formatDateKey(new Date());
                const isSelected = selectedDate === dateKey;

                return (
                  <div
                    key={`${dateKey || "empty"}-${index}`}
                    onClick={() => date && setSelectedDate(dateKey)}
                    onDragOver={(event) => {
                      if (date) event.preventDefault();
                    }}
                    onDrop={(event) => {
                      if (!date) return;

                      const taskId = event.dataTransfer.getData("taskId");

                      if (taskId) {
                        handleDropTaskOnDate(taskId, dateKey);
                      }
                    }}
                    className={`min-h-[145px] border-b border-r p-2 transition last:border-r-0 ${
                      date
                        ? "cursor-pointer bg-white hover:bg-slate-50"
                        : "bg-slate-50"
                    } ${isSelected ? "ring-2 ring-slate-950 ring-inset" : ""}`}
                  >
                    {date && (
                      <>
                        <div className="mb-2 flex items-center justify-between">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                              isToday
                                ? "bg-slate-950 text-white"
                                : "text-slate-700"
                            }`}
                          >
                            {date.getDate()}
                          </span>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openCreateDialog(dateKey);
                            }}
                            className="rounded-md p-1 text-muted-foreground hover:bg-slate-100 hover:text-slate-950"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          {dayTasks.slice(0, 4).map((task) => (
                            <div
                              key={task.id}
                              draggable
                              onDragStart={(event) => {
                                event.dataTransfer.setData("taskId", task.id);
                              }}
                              onClick={(event) => {
                                event.stopPropagation();
                                openEditDialog(task);
                              }}
                              className="rounded-lg border bg-white p-2 text-xs shadow-sm hover:border-slate-400"
                            >
                              <div className="line-clamp-1 font-medium text-slate-900">
                                {task.title}
                              </div>

                              <div className="mt-1 flex items-center justify-between gap-1">
                                <span
                                  className={`rounded-full border px-1.5 py-0.5 text-[10px] ${getStatusBadgeClass(
                                    task.status,
                                  )}`}
                                >
                                  {getStatusLabel(task.status)}
                                </span>

                                <span className="text-[10px] text-muted-foreground">
                                  {task.assigneeNames.length}
                                </span>
                              </div>
                            </div>
                          ))}

                          {dayTasks.length > 4 && (
                            <p className="text-xs text-muted-foreground">
                              +{dayTasks.length - 4} more
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Selected Day</h3>

                <p className="text-sm text-muted-foreground">
                  {parseDateKey(selectedDate).toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                className="gap-1 bg-slate-950 text-white hover:bg-slate-800"
                onClick={() => openCreateDialog(selectedDate)}
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>

            <div className="space-y-3">
              {selectedDateTasks.length > 0 ? (
                selectedDateTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl border bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-slate-950">
                          {task.title}
                        </h4>

                        {task.description && (
                          <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                            {task.description}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(task)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTask(task)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className={getStatusBadgeClass(task.status)}
                      >
                        {getStatusLabel(task.status)}
                      </Badge>

                      <Badge
                        variant="outline"
                        className={getPriorityBadgeClass(task.priority)}
                      >
                        {getPriorityLabel(task.priority)}
                      </Badge>

                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {task.dueDate}
                      </Badge>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        Assigned To
                      </p>

                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {task.assigneeNames.length > 0 ? (
                          task.assigneeNames.map((name) => (
                            <Badge key={name} variant="secondary">
                              {name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No assignee
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground" />

                  <p className="mt-3 text-sm font-medium">No tasks today</p>

                  <p className="text-xs text-muted-foreground">
                    Add a task or drag any task into this date.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Edit Task" : "Add New Task"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div>
              <Label htmlFor="task-title" className="text-xs font-medium">
                Task Title *
              </Label>

              <Input
                id="task-title"
                value={formData.title}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
                placeholder="Enter task title"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="task-description" className="text-xs font-medium">
                Description
              </Label>

              <Textarea
                id="task-description"
                value={formData.description}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="Task details..."
                className="mt-1 min-h-[90px]"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-xs font-medium">Status</Label>

                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: value as TaskStatus,
                    }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium">Priority</Label>

                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      priority: value as TaskPriority,
                    }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="start-date" className="text-xs font-medium">
                  Start Date
                </Label>

                <Input
                  id="start-date"
                  type="date"
                  value={formData.startDate}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      startDate: event.target.value,
                    }))
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="due-date" className="text-xs font-medium">
                  Due Date *
                </Label>

                <Input
                  id="due-date"
                  type="date"
                  value={formData.dueDate}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      dueDate: event.target.value,
                    }))
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <UserAssigneeSelect
              users={users}
              selectedIds={formData.assigneeIds}
              onChange={(ids) =>
                setFormData((prev) => ({
                  ...prev,
                  assigneeIds: ids,
                }))
              }
            />

            {usersLoading && (
              <p className="text-xs text-muted-foreground">Loading users...</p>
            )}

            <div className="flex justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleSaveTask}
                disabled={saving}
                className="bg-slate-950 text-white hover:bg-slate-800"
              >
                {saving
                  ? "Saving..."
                  : editingTask
                    ? "Update Task"
                    : "Create Task"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}