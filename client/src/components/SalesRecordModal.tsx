// import React, { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Calendar } from "@/components/ui/calendar";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { CalendarIcon, Plus, X, MessageSquare } from "lucide-react";
// import { Badge } from "@/components/ui/badge";
// import { format, addDays, formatDistanceToNow } from "date-fns";
// import { useAuth } from "@/contexts/AuthContext";
// import { createNotification } from "@/hooks/useNotifications";
// import { useToast } from "@/hooks/use-toast";
// import { useMeetingUpdates } from "@/hooks/useMeetingUpdates";
// import { useMeetingUpdateComments } from "@/hooks/useMeetingUpdateComments";
// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
// } from "@/components/ui/accordion";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//   collection,
//   addDoc,
//   updateDoc,
//   doc,
//   getDoc,
//   serverTimestamp,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import type {
//   SalesRecord,
//   SalesStatus,
//   MeetingUpdate,
//   InsertMeetingUpdate,
// } from "@shared/schema";

// interface SalesRecordModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   editingRecord?: SalesRecord | null;
//   clients: any[];
// }

// interface SalesFormData {
//   client: string;
//   contactPerson: string;
//   contactMobile: string;
//   projectCode: string;
//   projectName: string;
//   estimateNumber: string;
//   invoiceNumber: string;
//   paymentRef: string;
//   projectedValue: string;
//   wonValue: string;
//   visit: boolean;
//   needHelp: boolean;
//   goal: string;
//   actionItems: string[];
//   nextFollowUpDate: Date | null;
//   nextFollowUpActionItems: string[];
//   projectStatus: SalesStatus;
// }

// const STATUS_OPTIONS: { value: SalesStatus; label: string }[] = [
//   { value: "Lead", label: "Lead" },
//   { value: "Discussion", label: "Discussion" },
//   { value: "Negotiation", label: "Negotiation" },
//   { value: "Won", label: "Won" },
//   { value: "Lost", label: "Lost" },
//   { value: "Invoiced", label: "Invoiced" },
//   { value: "Payment Received", label: "Payment Received" },
// ];

// export function SalesRecordModal({
//   isOpen,
//   onClose,
//   editingRecord,
//   clients,
// }: SalesRecordModalProps) {
//   const { userProfile, currentUser } = useAuth();
//   const actorId = currentUser?.uid || userProfile?.id || "";
//   const { toast } = useToast();

//   const [loading, setLoading] = useState(false);
//   const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(
//     null,
//   );
//   const [newMeetingDate, setNewMeetingDate] = useState<Date | null>(null);
//   const [meetingComment, setMeetingComment] = useState("");
//   const [showNewMeetingForm, setShowNewMeetingForm] = useState(false);
//   const [newMeetingData, setNewMeetingData] = useState({
//     discussionNotes: "",
//     actionItems: [""],
//     visit: false,
//   });

//   // Meeting update hooks
//   const {
//     meetingUpdates,
//     loading: meetingUpdatesLoading,
//     createMeetingUpdate,
//     updateMeetingUpdate,
//   } = useMeetingUpdates(editingRecord?.id);

//   const selectedMeeting = meetingUpdates.find(
//     (meeting) => meeting.id === selectedMeetingId,
//   );
//   const { comments = [], addComment } = useMeetingUpdateComments(
//     editingRecord?.id,
//     selectedMeetingId || undefined,
//   );

//   // Auto-select first meeting when meetings load
//   React.useEffect(() => {
//     if (meetingUpdates.length > 0 && !selectedMeetingId) {
//       setSelectedMeetingId(meetingUpdates[0].id);
//     }
//   }, [meetingUpdates, selectedMeetingId]);

//   // Notification helpers
//   const getAdminRecipientIds = (recordData: any): string[] => {
//     const participantIds = Array.isArray(recordData?.adminParticipantIds)
//       ? recordData.adminParticipantIds.filter(
//           (id: string) => !!id && id !== actorId,
//         )
//       : [];

//     if (participantIds.length > 0) {
//       return Array.from(new Set(participantIds));
//     }

//     const fallbackAssignedAdminId = recordData?.assignedAdminId;
//     return fallbackAssignedAdminId && fallbackAssignedAdminId !== actorId
//       ? [fallbackAssignedAdminId]
//       : [];
//   };

//   const getSalesRecipientId = (recordData: any): string | undefined => {
//     return recordData?.salesPersonId && recordData.salesPersonId !== actorId
//       ? recordData.salesPersonId
//       : undefined;
//   };

//   // Meeting update helpers
//   const handleCreateMeeting = async () => {
//     if (!editingRecord?.id || !userProfile || !newMeetingDate) {
//       toast({
//         title: "Cannot create meeting",
//         description: "Please select a meeting date and ensure record is saved.",
//         variant: "destructive",
//       });
//       return;
//     }

//     const newMeeting: InsertMeetingUpdate = {
//       recordId: editingRecord.id,
//       meetingDate: format(newMeetingDate, "yyyy-MM-dd"),
//       discussionNotes: newMeetingData.discussionNotes,
//       actionItems: newMeetingData.actionItems.filter((item) => item.trim()),
//       visit: newMeetingData.visit,
//       createdById: actorId,
//       createdByName: userProfile.displayName,
//     };

//     try {
//       const recordDoc = doc(
//         db,
//         "Panels",
//         "IEDGE-SYSTEM",
//         "salesRecords",
//         editingRecord.id,
//       );
//       const recordSnap = await getDoc(recordDoc);
//       const latestRecord = recordSnap.exists()
//         ? (recordSnap.data() as any)
//         : {};

//       if (userProfile.role !== "sales") {
//         const existingAdminParticipantIds = Array.isArray(
//           latestRecord.adminParticipantIds,
//         )
//           ? latestRecord.adminParticipantIds
//           : [];

//         await updateDoc(recordDoc, {
//           assignedAdminId: actorId,
//           assignedAdminName: userProfile.displayName,
//           adminParticipantIds: Array.from(
//             new Set([...existingAdminParticipantIds, actorId]),
//           ),
//           updatedAt: serverTimestamp(),
//         });
//       }

//       const meetingRecipientId =
//         userProfile.role === "sales"
//           ? getAdminRecipientIds(latestRecord)[0]
//           : getSalesRecipientId(latestRecord);

//       const meetingId = await createMeetingUpdate(
//         newMeeting,
//         meetingRecipientId,
//       );
//       setSelectedMeetingId(meetingId);
//       setShowNewMeetingForm(false);
//       setNewMeetingDate(null);
//       setNewMeetingData({
//         discussionNotes: "",
//         actionItems: [""],
//         visit: false,
//       });
//       toast({
//         title: "Success",
//         description: "Meeting update created successfully.",
//       });
//     } catch (err) {
//       console.error("Error creating meeting:", err);
//       toast({
//         title: "Error",
//         description: "Failed to create meeting update.",
//         variant: "destructive",
//       });
//     }
//   };

//   // Meeting update action handlers
//   const handleMeetingCommentSubmit = async () => {
//     if (
//       !meetingComment.trim() ||
//       !selectedMeetingId ||
//       !editingRecord?.id ||
//       !userProfile
//     ) {
//       toast({
//         title: "Cannot add comment",
//         description: "Please select a meeting and ensure record is saved.",
//         variant: "destructive",
//       });
//       return;
//     }

//     try {
//       const recordDoc = doc(
//         db,
//         "Panels",
//         "IEDGE-SYSTEM",
//         "salesRecords",
//         editingRecord.id,
//       );
//       const recordSnap = await getDoc(recordDoc);
//       const latestRecord = recordSnap.exists()
//         ? (recordSnap.data() as any)
//         : {};

//       if (userProfile.role !== "sales") {
//         const existingAdminParticipantIds = Array.isArray(
//           latestRecord.adminParticipantIds,
//         )
//           ? latestRecord.adminParticipantIds
//           : [];

//         await updateDoc(recordDoc, {
//           assignedAdminId: actorId,
//           assignedAdminName: userProfile.displayName,
//           adminParticipantIds: Array.from(
//             new Set([...existingAdminParticipantIds, actorId]),
//           ),
//           updatedAt: serverTimestamp(),
//         });
//       }

//       const meetingCommentRecipientId =
//         userProfile.role === "sales"
//           ? getAdminRecipientIds(latestRecord)[0]
//           : getSalesRecipientId(latestRecord);

//       await addComment(
//         meetingComment,
//         meetingCommentRecipientId,
//         selectedMeetingId,
//       );
//       setMeetingComment("");
//       toast({
//         title: "Comment added",
//         description: "Your comment has been added to this meeting.",
//       });
//     } catch (err) {
//       console.error("Error adding comment:", err);
//       toast({
//         title: "Error",
//         description: "Failed to add comment.",
//         variant: "destructive",
//       });
//     }
//   };

//   // New meeting form handlers
//   const addNewMeetingActionItem = () => {
//     setNewMeetingData((prev) => ({
//       ...prev,
//       actionItems: [...prev.actionItems, ""],
//     }));
//   };

//   const updateNewMeetingActionItem = (index: number, value: string) => {
//     setNewMeetingData((prev) => ({
//       ...prev,
//       actionItems: prev.actionItems.map((item, i) =>
//         i === index ? value : item,
//       ),
//     }));
//   };

//   const removeNewMeetingActionItem = (index: number) => {
//     if (newMeetingData.actionItems.length > 1) {
//       setNewMeetingData((prev) => ({
//         ...prev,
//         actionItems: prev.actionItems.filter((_, i) => i !== index),
//       }));
//     }
//   };

//   // Main form state and helpers
//   const [formData, setFormData] = useState<SalesFormData>({
//     client: "",
//     contactPerson: "",
//     contactMobile: "",
//     projectCode: "",
//     projectName: "",
//     estimateNumber: "",
//     invoiceNumber: "",
//     paymentRef: "",
//     projectedValue: "",
//     wonValue: "",
//     visit: false,
//     needHelp: false,
//     goal: "",
//     actionItems: [""],
//     nextFollowUpDate: null,
//     nextFollowUpActionItems: [""],
//     projectStatus: "Lead",
//   });

//   const [comment, setComment] = useState("");

//   const addActionItem = () =>
//     setFormData((s) => ({ ...s, actionItems: [...s.actionItems, ""] }));
//   const removeActionItem = (i: number) =>
//     setFormData((s) => ({
//       ...s,
//       actionItems: s.actionItems.filter((_, idx) => idx !== i),
//     }));
//   const updateActionItem = (i: number, v: string) =>
//     setFormData((s) => {
//       const arr = [...s.actionItems];
//       arr[i] = v;
//       return { ...s, actionItems: arr };
//     });

//   const addFollowUpActionItem = () =>
//     setFormData((s) => ({
//       ...s,
//       nextFollowUpActionItems: [...s.nextFollowUpActionItems, ""],
//     }));
//   const removeFollowUpActionItem = (i: number) =>
//     setFormData((s) => ({
//       ...s,
//       nextFollowUpActionItems: s.nextFollowUpActionItems.filter(
//         (_, idx) => idx !== i,
//       ),
//     }));
//   const updateFollowUpActionItem = (i: number, v: string) =>
//     setFormData((s) => {
//       const arr = [...s.nextFollowUpActionItems];
//       arr[i] = v;
//       return { ...s, nextFollowUpActionItems: arr };
//     });

//   const salesRef = collection(db, "Panels", "IEDGE-SYSTEM", "salesRecords");

//   // Prefill when editingRecord changes
//   useEffect(() => {
//     if (editingRecord) {
//       setFormData({
//         client: editingRecord.client ?? "",
//         contactPerson: editingRecord.contactPerson ?? "",
//         contactMobile: editingRecord.contactMobile ?? "",
//         projectCode: editingRecord.projectCode ?? "",
//         projectName: editingRecord.projectName ?? "",
//         estimateNumber: editingRecord.estimateNumber ?? "",
//         invoiceNumber: editingRecord.invoiceNumber ?? "",
//         paymentRef: editingRecord.paymentRef ?? "",
//         projectedValue: String(
//           editingRecord.projectedValue ??
//             (editingRecord as any).projectValue ??
//             "",
//         ),
//         wonValue: String(editingRecord.wonValue ?? ""),
//         visit: editingRecord.visit ?? false,
//         needHelp: editingRecord.needHelp ?? false,
//         goal: editingRecord.goal ?? "",
//         actionItems: editingRecord.actionItems?.length
//           ? editingRecord.actionItems
//           : [""],
//         nextFollowUpDate: editingRecord.nextFollowUp?.date
//           ? editingRecord.nextFollowUp.date instanceof Date
//             ? editingRecord.nextFollowUp.date
//             : new Date(editingRecord.nextFollowUp.date)
//           : null,
//         nextFollowUpActionItems: editingRecord.nextFollowUp?.actionItems?.length
//           ? editingRecord.nextFollowUp.actionItems
//           : [""],
//         projectStatus: editingRecord.projectStatus ?? "Lead",
//       });
//     } else {
//       setFormData({
//         client: "",
//         contactPerson: "",
//         contactMobile: "",
//         projectCode: "",
//         projectName: "",
//         estimateNumber: "",
//         invoiceNumber: "",
//         paymentRef: "",
//         projectedValue: "",
//         wonValue: "",
//         visit: false,
//         needHelp: false,
//         goal: "",
//         actionItems: [""],
//         nextFollowUpDate: null,
//         nextFollowUpActionItems: [""],
//         projectStatus: "Lead",
//       });
//     }
//   }, [editingRecord, isOpen]);

//   // Save (create or update) sales record
//   const handleSave = async () => {
//     if (!userProfile) {
//       toast({
//         title: "Error",
//         description: "User not authenticated",
//         variant: "destructive",
//       });
//       return;
//     }

//     setLoading(true);
//     try {
//       const projectedValueNumber =
//         parseFloat(formData.projectedValue as unknown as string) || 0;
//       const wonValueNumber =
//         parseFloat(formData.wonValue as unknown as string) || 0;

//       const filteredActionItems = formData.actionItems.filter(
//         (it) => it.trim() !== "",
//       );
//       const filteredFollowUpActionItems =
//         formData.nextFollowUpActionItems.filter((it) => it.trim() !== "");

//       const recordData: any = {
//         client: formData.client,
//         contactPerson: formData.contactPerson,
//         contactMobile: formData.contactMobile,
//         projectCode: formData.projectCode,
//         projectName: formData.projectName,
//         estimateNumber: formData.estimateNumber,
//         invoiceNumber: formData.invoiceNumber,
//         paymentRef: formData.paymentRef,
//         projectedValue: projectedValueNumber,
//         wonValue: wonValueNumber,
//         visit: formData.visit,
//         needHelp: formData.needHelp,
//         goal: formData.goal,
//         actionItems: filteredActionItems,
//         nextFollowUp: {
//           date: formData.nextFollowUpDate ? formData.nextFollowUpDate : null,
//           actionItems: filteredFollowUpActionItems,
//         },
//         projectStatus: formData.projectStatus,
//         updatedAt: serverTimestamp(),
//       };

//       if (editingRecord) {
//         const recordDoc = doc(
//           db,
//           "Panels",
//           "IEDGE-SYSTEM",
//           "salesRecords",
//           editingRecord.id,
//         );

//         const existingSnap = await getDoc(recordDoc);
//         const existingData = existingSnap.exists()
//           ? (existingSnap.data() as any)
//           : {};

//         const existingAdminParticipantIds = Array.isArray(
//           existingData.adminParticipantIds,
//         )
//           ? existingData.adminParticipantIds
//           : [];

//         const finalRecordData: any = {
//           ...recordData,
//           assignedAdminId:
//             userProfile.role !== "sales"
//               ? actorId
//               : existingData.assignedAdminId || null,
//           assignedAdminName:
//             userProfile.role !== "sales"
//               ? userProfile.displayName
//               : existingData.assignedAdminName || null,
//           adminParticipantIds:
//             userProfile.role !== "sales"
//               ? Array.from(new Set([...existingAdminParticipantIds, actorId]))
//               : existingAdminParticipantIds,
//         };

//         await updateDoc(recordDoc, finalRecordData);

//         if (userProfile.role === "sales") {
//           const adminRecipientIds = getAdminRecipientIds({
//             ...existingData,
//             ...finalRecordData,
//           });

//           for (const recipientId of adminRecipientIds) {
//             await createNotification({
//               recipientId,
//               type: "record_update",
//               recordId: editingRecord.id,
//               message: `${userProfile.displayName} updated Project ${formData.projectName}`,
//               createdById: actorId,
//               createdByName: userProfile.displayName,
//             });
//           }
//         } else {
//           const salesRecipientId = getSalesRecipientId(existingData);

//           if (salesRecipientId) {
//             await createNotification({
//               recipientId: salesRecipientId,
//               type: "record_update",
//               recordId: editingRecord.id,
//               message: `${userProfile.displayName} updated Project ${formData.projectName}`,
//               createdById: actorId,
//               createdByName: userProfile.displayName,
//             });
//           }
//         }
//       } else {
//         await addDoc(salesRef, {
//           ...recordData,
//           createdAt: serverTimestamp(),
//           salesPersonId: actorId,
//           salesPersonName: userProfile.displayName,
//           assignedAdminId: userProfile.role !== "sales" ? actorId : null,
//           assignedAdminName:
//             userProfile.role !== "sales" ? userProfile.displayName : null,
//           adminParticipantIds: userProfile.role !== "sales" ? [actorId] : [],
//         });
//       }

//       toast({
//         title: "Success",
//         description: editingRecord
//           ? "Sales record updated successfully"
//           : "Sales record created successfully",
//       });
//       onClose();
//     } catch (err) {
//       console.error("Error saving sales record:", err);
//       toast({
//         title: "Error",
//         description: "Failed to save sales record",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Record-level comments
//   const handleCommentSubmit = async (recordId: string) => {
//     if (!comment.trim()) return;
//     if (!editingRecord) return;

//     const timestamp = new Date();
//     const userName = userProfile?.displayName ?? "Unknown User";

//     try {
//       const recordDoc = doc(
//         db,
//         "Panels",
//         "IEDGE-SYSTEM",
//         "salesRecords",
//         recordId,
//       );

//       const recordSnap = await getDoc(recordDoc);
//       if (!recordSnap.exists()) {
//         throw new Error("Record not found");
//       }

//       const latestRecord = recordSnap.data() as any;
//       const existingAdminParticipantIds = Array.isArray(
//         latestRecord.adminParticipantIds,
//       )
//         ? latestRecord.adminParticipantIds
//         : [];

//       const newComment = {
//         text: comment,
//         timestamp: timestamp.toISOString(),
//         userName,
//       };

//       const updatePayload: any = {
//         comments: [...(latestRecord.comments || []), newComment],
//         updatedAt: serverTimestamp(),
//       };

//       if (userProfile?.role !== "sales") {
//         updatePayload.assignedAdminId = actorId;
//         updatePayload.assignedAdminName = userName;
//         updatePayload.adminParticipantIds = Array.from(
//           new Set([...existingAdminParticipantIds, actorId]),
//         );
//       }

//       await updateDoc(recordDoc, updatePayload);

//       if (userProfile?.role === "sales") {
//         const adminRecipientIds = getAdminRecipientIds(latestRecord);

//         if (adminRecipientIds.length === 0) {
//           toast({
//             title: "No admin linked",
//             description:
//               "No admin has commented on this record yet, so there is no admin to notify.",
//             variant: "destructive",
//           });
//         }

//         for (const recipientId of adminRecipientIds) {
//           await createNotification({
//             recipientId,
//             type: "comment",
//             recordId,
//             message: `${userName} commented on Project ${latestRecord.projectName || editingRecord.projectName}: "${comment.substring(0, 50)}${comment.length > 50 ? "..." : ""}"`,
//             createdById: actorId,
//             createdByName: userName,
//           });
//         }
//       } else {
//         const salesRecipientId = getSalesRecipientId(latestRecord);

//         if (salesRecipientId) {
//           await createNotification({
//             recipientId: salesRecipientId,
//             type: "comment",
//             recordId,
//             message: `${userName} commented on Project ${latestRecord.projectName || editingRecord.projectName}: "${comment.substring(0, 50)}${comment.length > 50 ? "..." : ""}"`,
//             createdById: actorId,
//             createdByName: userName,
//           });
//         }
//       }

//       setComment("");
//       toast({
//         title: "Comment Added",
//         description: "Your comment has been added successfully.",
//       });
//     } catch (err) {
//       console.error("Error adding comment:", err);
//       toast({
//         title: "Error",
//         description: "Failed to add comment.",
//         variant: "destructive",
//       });
//     }
//   };

//   // UI: wider, slightly more compact — ensures buttons aren't clipped
//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-5xl w-[90vw] max-h-[85vh] overflow-visible">
//         <DialogHeader>
//           <DialogTitle data-testid="dialog-title">
//             {editingRecord ? "Edit Sales Record" : "Add New Sales Record"}
//           </DialogTitle>
//         </DialogHeader>

//         <div className="flex h-[78vh] gap-6 text-sm">
//           {/* Left form (scrollable) */}
//           <div className="w-[440px] flex-shrink-0 border-r pr-4">
//             <form
//               onSubmit={(e) => {
//                 e.preventDefault();
//                 handleSave();
//               }}
//               className="flex flex-col h-full"
//             >
//               <div className="overflow-y-auto pr-2 pb-4 space-y-4 max-h-[calc(78vh-72px)] ">
//                 <div className="space-y-3">
//                   <h3
//                     className="text-sm font-semibold"
//                     data-testid="section-details"
//                   >
//                     Project Details
//                   </h3>

//                   <div>
//                     <Label htmlFor="client" className="text-xs">
//                       Client *
//                     </Label>
//                     <Select
//                       value={formData.client}
//                       onValueChange={(value) =>
//                         setFormData((s) => ({ ...s, client: value }))
//                       }
//                     >
//                       <SelectTrigger
//                         className="h-8"
//                         data-testid="select-client"
//                       >
//                         <SelectValue placeholder="Select Client" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {clients.map((c) => (
//                           <SelectItem key={c.id} value={c.name}>
//                             {c.name}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   <div>
//                     <Label htmlFor="contactPerson" className="text-xs">
//                       Contact Person *
//                     </Label>
//                     <Input
//                       id="contactPerson"
//                       type="text"
//                       value={formData.contactPerson}
//                       onChange={(e) =>
//                         setFormData((s) => ({
//                           ...s,
//                           contactPerson: e.target.value,
//                         }))
//                       }
//                       required
//                       className="h-8"
//                       data-testid="input-contact-person"
//                     />
//                   </div>

//                   <div>
//                     <Label htmlFor="contactMobile" className="text-xs">
//                       Mobile
//                     </Label>
//                     <Input
//                       id="contactMobile"
//                       type="tel"
//                       required
//                       value={formData.contactMobile}
//                       onChange={(e) =>
//                         setFormData((s) => ({
//                           ...s,
//                           contactMobile: e.target.value,
//                         }))
//                       }
//                       placeholder="+92 300 1234567"
//                       className="h-8"
//                       data-testid="input-contact-mobile"
//                     />
//                   </div>

//                   <div className="grid grid-cols-2 gap-2">
//                     <div>
//                       <Label htmlFor="projectCode" className="text-xs">
//                         Project Code
//                       </Label>
//                       <Input
//                         id="projectCode"
//                         value={formData.projectCode}
//                         onChange={(e) =>
//                           setFormData((s) => ({
//                             ...s,
//                             projectCode: e.target.value,
//                           }))
//                         }
//                         className="h-8"
//                         data-testid="input-project-code"
//                       />
//                     </div>
//                     <div>
//                       <Label htmlFor="projectName" className="text-xs">
//                         Project Name *
//                       </Label>
//                       <Input
//                         id="projectName"
//                         value={formData.projectName}
//                         onChange={(e) =>
//                           setFormData((s) => ({
//                             ...s,
//                             projectName: e.target.value,
//                           }))
//                         }
//                         required
//                         className="h-8"
//                         data-testid="input-project-name"
//                       />
//                     </div>
//                   </div>
//                   <div>
//                     <Label htmlFor="goal" className="text-xs font-medium">
//                       Description
//                     </Label>
//                     <Textarea
//                       id="goal"
//                       required
//                       value={formData.goal}
//                       onChange={(e) =>
//                         setFormData((s) => ({ ...s, goal: e.target.value }))
//                       }
//                       placeholder="Project Description..."
//                       className="h-16 text-xs"
//                       data-testid="textarea-goal"
//                     />
//                   </div>
//                   <div className="grid grid-cols-2 gap-2">
//                     <div>
//                       <Label htmlFor="estimateNumber" className="text-xs">
//                         Estimate #
//                       </Label>
//                       <Input
//                         id="estimateNumber"
//                         value={formData.estimateNumber}
//                         onChange={(e) =>
//                           setFormData((s) => ({
//                             ...s,
//                             estimateNumber: e.target.value,
//                           }))
//                         }
//                         className="h-8"
//                         data-testid="input-estimate-number"
//                       />
//                     </div>
//                     <div>
//                       <Label htmlFor="invoiceNumber" className="text-xs">
//                         Invoice #
//                       </Label>
//                       <Input
//                         id="invoiceNumber"
//                         value={formData.invoiceNumber}
//                         onChange={(e) =>
//                           setFormData((s) => ({
//                             ...s,
//                             invoiceNumber: e.target.value,
//                           }))
//                         }
//                         className="h-8"
//                         data-testid="input-invoice-number"
//                       />
//                     </div>
//                   </div>

//                   <div>
//                     <Label htmlFor="paymentRef" className="text-xs">
//                       Payment Ref
//                     </Label>
//                     <Input
//                       id="paymentRef"
//                       value={formData.paymentRef}
//                       onChange={(e) =>
//                         setFormData((s) => ({
//                           ...s,
//                           paymentRef: e.target.value,
//                         }))
//                       }
//                       className="h-8"
//                       data-testid="input-payment-ref"
//                     />
//                   </div>

//                   <div className="grid grid-cols-2 gap-2">
//                     <div>
//                       <Label htmlFor="projectedValue" className="text-xs">
//                         Projected Value *
//                       </Label>
//                       <Input
//                         id="projectedValue"
//                         type="number"
//                         step="0.01"
//                         value={formData.projectedValue}
//                         onChange={(e) =>
//                           setFormData((s) => ({
//                             ...s,
//                             projectedValue: e.target.value,
//                           }))
//                         }
//                         required
//                         className="h-8"
//                         data-testid="input-projected-value"
//                       />
//                     </div>
//                     <div>
//                       <Label htmlFor="wonValue" className="text-xs">
//                         Won Value
//                       </Label>
//                       <Input
//                         id="wonValue"
//                         type="number"
//                         step="0.01"
//                         value={formData.wonValue}
//                         onChange={(e) =>
//                           setFormData((s) => ({
//                             ...s,
//                             wonValue: e.target.value,
//                           }))
//                         }
//                         className="h-8"
//                         data-testid="input-won-value"
//                       />
//                     </div>
//                   </div>

//                   <div className="flex items-center space-x-2">
//                     <Checkbox
//                       id="needHelp"
//                       checked={formData.needHelp}
//                       onCheckedChange={(checked) =>
//                         setFormData((s) => ({
//                           ...s,
//                           needHelp: checked === true,
//                         }))
//                       }
//                       data-testid="checkbox-need-help"
//                     />
//                     <Label htmlFor="needHelp" className="text-xs">
//                       Need Help
//                     </Label>
//                   </div>

//                   <div>
//                     <Label htmlFor="projectStatus" className="text-xs">
//                       Project Status *
//                     </Label>
//                     <Select
//                       value={formData.projectStatus}
//                       onValueChange={(value) =>
//                         setFormData((s) => ({
//                           ...s,
//                           projectStatus: value as SalesStatus,
//                         }))
//                       }
//                     >
//                       <SelectTrigger
//                         className="h-8"
//                         data-testid="select-project-status"
//                       >
//                         <SelectValue placeholder="Select project status" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {STATUS_OPTIONS.map((option) => (
//                           <SelectItem key={option.value} value={option.value}>
//                             {option.label}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 </div>

//                 {/* Day Wise Plan Tabs */}
//                 <div>
//                   <div className="flex items-center justify-between">
//                     <h3 className="text-sm font-semibold">Meeting Updates</h3>
//                     <Button
//                       type="button"
//                       variant="outline"
//                       size="sm"
//                       onClick={() => setShowNewMeetingForm(true)}
//                       className="flex items-center gap-1"
//                       data-testid="button-add-meeting"
//                     >
//                       <Plus className="h-3 w-3" /> Add Meeting
//                     </Button>
//                   </div>

//                   {/* Meeting List */}
//                   <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
//                     {meetingUpdatesLoading ? (
//                       <p className="text-xs text-gray-500">
//                         Loading meetings...
//                       </p>
//                     ) : meetingUpdates.length > 0 ? (
//                       meetingUpdates.map((meeting) => (
//                         <div
//                           key={meeting.id}
//                           className={`p-2 rounded border cursor-pointer text-xs transition-colors ${
//                             selectedMeetingId === meeting.id
//                               ? "bg-blue-50 border-blue-200"
//                               : "bg-gray-50 hover:bg-gray-100"
//                           }`}
//                           onClick={() => setSelectedMeetingId(meeting.id)}
//                           data-testid={`meeting-item-${meeting.id}`}
//                         >
//                           <div className="flex items-center justify-between">
//                             <span className="font-medium">
//                               {meeting.meetingDate}
//                             </span>
//                             <div className="flex items-center gap-1">
//                               {meeting.visit && (
//                                 <span className="text-green-600 text-xs">
//                                   Visit
//                                 </span>
//                               )}
//                               <span className="text-gray-500">
//                                 {meeting.actionItems.length} actions
//                               </span>
//                             </div>
//                           </div>
//                           {meeting.discussionNotes && (
//                             <p className="text-gray-600 truncate mt-1">
//                               {meeting.discussionNotes}
//                             </p>
//                           )}
//                         </div>
//                       ))
//                     ) : (
//                       <p className="text-xs text-gray-500 italic">
//                         No meetings yet. Add your first meeting above.
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Sticky footer inside left panel */}
//               <div className="mt-auto bottom-0 dark:bg-slate-900/60 backdrop-blur-sm border-t py-2 flex  gap-3">
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={onClose}
//                   data-testid="button-cancel"
//                 >
//                   Cancel
//                 </Button>
//                 <Button
//                   type="submit"
//                   disabled={loading}
//                   className="bg-green-600 hover:bg-green-700 text-white px-6"
//                   data-testid="button-save"
//                 >
//                   {loading
//                     ? editingRecord
//                       ? "Updating..."
//                       : "Saving..."
//                     : editingRecord
//                       ? "Update Record"
//                       : "Save Record"}
//                 </Button>
//               </div>
//             </form>
//           </div>

//           {/* Right content area */}
//           <div className="flex-1 overflow-y-auto">
//             <div className="space-y-4 p-4">
//               {showNewMeetingForm ? (
//                 <div>
//                   <div className="flex items-center justify-between mb-4">
//                     <h3 className="text-lg font-semibold">
//                       New Meeting Update
//                     </h3>
//                     <Button
//                       type="button"
//                       variant="outline"
//                       size="sm"
//                       onClick={() => setShowNewMeetingForm(false)}
//                       data-testid="button-cancel-meeting"
//                     >
//                       Cancel
//                     </Button>
//                   </div>

//                   {/* New Meeting Form */}
//                   <div className="space-y-4">
//                     {/* Meeting Date */}
//                     <div>
//                       <Label className="text-sm font-medium">
//                         Meeting Date
//                       </Label>
//                       <Popover>
//                         <PopoverTrigger asChild>
//                           <Button
//                             variant="outline"
//                             className="w-full justify-start text-left font-normal mt-1"
//                             data-testid="button-meeting-date"
//                           >
//                             <CalendarIcon className="mr-2 h-4 w-4" />
//                             {newMeetingDate ? (
//                               format(newMeetingDate, "PPP")
//                             ) : (
//                               <span>Pick a date</span>
//                             )}
//                           </Button>
//                         </PopoverTrigger>
//                         <PopoverContent className="w-auto p-0">
//                           <Calendar
//                             mode="single"
//                             selected={newMeetingDate || undefined}
//                             onSelect={(date) => setNewMeetingDate(date || null)}
//                             initialFocus
//                           />
//                         </PopoverContent>
//                       </Popover>
//                     </div>

//                     {/* Discussion Notes */}
//                     <div>
//                       <Label className="text-sm font-medium">
//                         Discussion Notes
//                       </Label>
//                       <Textarea
//                         value={newMeetingData.discussionNotes}
//                         onChange={(e) =>
//                           setNewMeetingData((prev) => ({
//                             ...prev,
//                             discussionNotes: e.target.value,
//                           }))
//                         }
//                         placeholder="What was discussed in this meeting?"
//                         className="mt-1"
//                         rows={3}
//                         data-testid="textarea-discussion-notes"
//                       />
//                     </div>

//                     {/* Visit Checkbox */}
//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="new-meeting-visit"
//                         checked={newMeetingData.visit}
//                         onCheckedChange={(checked) =>
//                           setNewMeetingData((prev) => ({
//                             ...prev,
//                             visit: !!checked,
//                           }))
//                         }
//                         data-testid="checkbox-new-meeting-visit"
//                       />
//                       <Label htmlFor="new-meeting-visit" className="text-sm">
//                         Visit scheduled for this meeting
//                       </Label>
//                     </div>

//                     {/* Action Items */}
//                     <div>
//                       <Label className="text-sm font-medium">
//                         Action Items
//                       </Label>
//                       <div className="mt-2 space-y-2">
//                         {newMeetingData.actionItems.map((item, idx) => (
//                           <div key={idx} className="flex gap-2">
//                             <Input
//                               value={item}
//                               onChange={(e) =>
//                                 updateNewMeetingActionItem(idx, e.target.value)
//                               }
//                               placeholder="Enter action item..."
//                               className="flex-1"
//                               data-testid={`input-new-action-${idx}`}
//                             />
//                             {newMeetingData.actionItems.length > 1 && (
//                               <Button
//                                 type="button"
//                                 variant="outline"
//                                 size="sm"
//                                 onClick={() => removeNewMeetingActionItem(idx)}
//                                 className="px-2"
//                                 data-testid={`button-remove-new-action-${idx}`}
//                               >
//                                 <X className="h-4 w-4" />
//                               </Button>
//                             )}
//                           </div>
//                         ))}
//                         <Button
//                           type="button"
//                           variant="outline"
//                           size="sm"
//                           onClick={addNewMeetingActionItem}
//                           className="flex items-center gap-1"
//                           data-testid="button-add-new-action"
//                         >
//                           <Plus className="h-4 w-4" /> Add More
//                         </Button>
//                       </div>
//                     </div>

//                     {/* Create Meeting Button */}
//                     <Button
//                       type="button"
//                       onClick={handleCreateMeeting}
//                       className="w-full bg-green-600 hover:bg-green-700 text-white"
//                       data-testid="button-create-meeting"
//                     >
//                       Create Meeting Update
//                     </Button>
//                   </div>
//                 </div>
//               ) : selectedMeetingId && selectedMeeting ? (
//                 <div>
//                   <div className="flex items-center justify-between mb-4">
//                     <h3 className="text-lg font-semibold">
//                       Meeting on{" "}
//                       {new Date(selectedMeeting.meetingDate).toLocaleDateString(
//                         "en-GB",
//                         {
//                           day: "numeric",
//                           month: "short",
//                           year: "numeric",
//                         },
//                       )}
//                     </h3>
//                     <div className="flex items-center gap-2">
//                       {selectedMeeting.visit && (
//                         <Badge variant="secondary" className="text-xs">
//                           Visit Scheduled
//                         </Badge>
//                       )}
//                     </div>
//                   </div>

//                   {/* Meeting Details */}
//                   <div className="space-y-4">
//                     {/* Discussion Notes */}
//                     <div>
//                       <Label className="text-sm font-medium">
//                         Discussion Notes
//                       </Label>
//                       <div className="mt-2 p-3 bg-gray-50 rounded border text-sm">
//                         {selectedMeeting.discussionNotes || (
//                           <span className="text-gray-400 italic">
//                             No discussion notes for this meeting
//                           </span>
//                         )}
//                       </div>
//                     </div>

//                     {/* Action Items */}
//                     <div>
//                       <Label className="text-sm font-medium">
//                         Action Items
//                       </Label>
//                       <div className="mt-2 space-y-2">
//                         {selectedMeeting.actionItems.length > 0 ? (
//                           selectedMeeting.actionItems.map((item, idx) => (
//                             <div
//                               key={idx}
//                               className="p-2 bg-gray-50 rounded border text-sm"
//                             >
//                               {item || (
//                                 <span className="text-gray-400 italic">
//                                   Empty action item
//                                 </span>
//                               )}
//                             </div>
//                           ))
//                         ) : (
//                           <p className="text-sm text-gray-500 italic">
//                             No action items for this meeting
//                           </p>
//                         )}
//                       </div>
//                     </div>

//                     {/* Meeting Comments */}
//                     <div>
//                       <Label className="text-sm font-medium flex items-center gap-2">
//                         <MessageSquare className="h-4 w-4" />
//                         Comments for this meeting
//                       </Label>

//                       <div className="mt-3 space-y-2">
//                         <Input
//                           value={meetingComment}
//                           onChange={(e) => setMeetingComment(e.target.value)}
//                           placeholder="Add a comment for this meeting..."
//                           className="text-sm"
//                           data-testid="input-meeting-comment"
//                           onKeyPress={(e) => {
//                             if (e.key === "Enter" && !e.shiftKey) {
//                               e.preventDefault();
//                               handleMeetingCommentSubmit();
//                             }
//                           }}
//                         />
//                         <Button
//                           type="button"
//                           onClick={handleMeetingCommentSubmit}
//                           disabled={!meetingComment.trim()}
//                           size="sm"
//                           className="w-full"
//                           data-testid="button-submit-meeting-comment"
//                         >
//                           Add Comment
//                         </Button>
//                       </div>

//                       <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
//                         {comments?.length > 0 ? (
//                           comments.map((c, idx) => (
//                             <div
//                               key={c.id ?? idx}
//                               className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg"
//                             >
//                               <p className="text-sm text-gray-900 dark:text-gray-100">
//                                 {c.text}
//                               </p>
//                               <div className="flex items-center gap-2 mt-1">
//                                 <span className="text-xs text-gray-500">
//                                   {c.authorName ?? "Unknown"}
//                                 </span>
//                                 <span className="text-xs text-gray-400">•</span>
//                                 <span className="text-xs text-gray-500">
//                                   {c.createdAt
//                                     ? formatDistanceToNow(
//                                         c.createdAt instanceof Date
//                                           ? c.createdAt
//                                           : new Date(c.createdAt),
//                                         { addSuffix: true },
//                                       )
//                                     : "Just now"}
//                                 </span>
//                               </div>
//                             </div>
//                           ))
//                         ) : (
//                           <p className="text-sm text-gray-500 italic">
//                             No comments for this meeting yet.
//                           </p>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="text-center py-8">
//                   <div className="text-gray-400 mb-4">
//                     <MessageSquare className="h-12 w-12 mx-auto" />
//                   </div>
//                   <h3 className="text-lg font-semibold text-gray-900 mb-2">
//                     No meeting selected
//                   </h3>
//                   <p className="text-sm text-gray-500 mb-4">
//                     Select a meeting from the list or create a new one to view
//                     details.
//                   </p>
//                   <Button
//                     type="button"
//                     onClick={() => setShowNewMeetingForm(true)}
//                     className="bg-blue-600 hover:bg-blue-700 text-white"
//                     data-testid="button-create-first-meeting"
//                   >
//                     Create Your First Meeting
//                   </Button>
//                 </div>
//               )}

//               {/* Next Follow-up */}
//               <div className="p-4 border rounded-lg">
//                 <Label className="text-sm font-medium">Next Follow-Up</Label>
//                 <div className="mt-2">
//                   <Label htmlFor="followUpDate" className="text-xs">
//                     Date
//                   </Label>
//                   <Popover>
//                     <PopoverTrigger asChild>
//                       <Button
//                         variant="outline"
//                         className="w-full justify-start text-left font-normal mt-1"
//                         data-testid="button-follow-up-date"
//                       >
//                         <CalendarIcon className="mr-2 h-4 w-4" />
//                         {formData.nextFollowUpDate ? (
//                           format(formData.nextFollowUpDate, "PPP")
//                         ) : (
//                           <span>Pick a date</span>
//                         )}
//                       </Button>
//                     </PopoverTrigger>
//                     <PopoverContent className="w-auto p-0">
//                       <Calendar
//                         mode="single"
//                         selected={formData.nextFollowUpDate || undefined}
//                         onSelect={(date) =>
//                           setFormData((s) => ({
//                             ...s,
//                             nextFollowUpDate: date || null,
//                           }))
//                         }
//                         initialFocus
//                       />
//                     </PopoverContent>
//                   </Popover>
//                 </div>

//                 <div className="mt-4">
//                   <Label className="text-xs font-medium">
//                     Action Items After Meeting
//                   </Label>
//                   <div className="mt-2 space-y-2">
//                     {formData.nextFollowUpActionItems.map((ai, idx) => (
//                       <div key={idx} className="flex gap-2">
//                         <Input
//                           value={ai}
//                           onChange={(e) =>
//                             updateFollowUpActionItem(idx, e.target.value)
//                           }
//                           placeholder="Enter follow-up action item..."
//                           className="flex-1"
//                           data-testid={`input-follow-up-action-${idx}`}
//                         />
//                         {formData.nextFollowUpActionItems.length > 1 && (
//                           <Button
//                             type="button"
//                             variant="outline"
//                             size="sm"
//                             onClick={() => removeFollowUpActionItem(idx)}
//                             className="px-2"
//                             data-testid={`button-remove-follow-up-${idx}`}
//                           >
//                             <X className="h-4 w-4" />
//                           </Button>
//                         )}
//                       </div>
//                     ))}
//                     <Button
//                       type="button"
//                       variant="outline"
//                       size="sm"
//                       onClick={addFollowUpActionItem}
//                       className="flex items-center gap-1"
//                       data-testid="button-add-follow-up-action"
//                     >
//                       <Plus className="h-4 w-4" /> Add More
//                     </Button>
//                   </div>
//                 </div>
//               </div>

//               {/* Record-level comments (only when editing existing record) */}
//               {editingRecord && (
//                 <div className="p-4 border rounded-lg">
//                   <Label htmlFor="comment" className="text-sm font-medium">
//                     Add a Comment:
//                   </Label>
//                   <div className="mt-2">
//                     <Input
//                       id="comment"
//                       value={comment}
//                       onChange={(e) => setComment(e.target.value)}
//                       placeholder="Add a comment..."
//                       className="mt-2"
//                       data-testid="input-comment"
//                     />
//                     <Button
//                       type="button"
//                       onClick={() => handleCommentSubmit(editingRecord.id)}
//                       className="bg-blue-600 text-white mt-2"
//                       data-testid="button-submit-comment"
//                     >
//                       Submit Comment
//                     </Button>
//                   </div>

//                   <h4
//                     className="mt-4 text-sm font-semibold"
//                     data-testid="section-comments"
//                   >
//                     Comments
//                   </h4>
//                   <div className="space-y-3 mt-4">
//                     {editingRecord?.comments?.length ? (
//                       editingRecord.comments.map((c, idx) => (
//                         <div
//                           key={idx}
//                           className="border rounded-lg p-3 bg-white shadow-sm"
//                           data-testid={`comment-${idx}`}
//                         >
//                           <p className="text-sm">
//                             <strong>{c.userName ?? "Unknown"}</strong>: {c.text}
//                           </p>
//                           <p className="text-xs text-gray-500 mt-1">
//                             {c.timestamp
//                               ? (c.timestamp instanceof Date
//                                   ? c.timestamp
//                                   : new Date(c.timestamp)
//                                 ).toLocaleString()
//                               : "Pending..."}
//                           </p>
//                         </div>
//                       ))
//                     ) : (
//                       <p
//                         className="text-sm text-gray-500 italic"
//                         data-testid="text-no-comments"
//                       >
//                         No comments yet.
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  ExternalLink,
  FileText,
  MessageSquare,
  Plus,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { createNotification } from "@/hooks/useNotifications";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useMeetingUpdates } from "@/hooks/useMeetingUpdates";
import { useMeetingUpdateComments } from "@/hooks/useMeetingUpdateComments";
import {
  addDoc,
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  InsertMeetingUpdate,
  SalesRecord,
  SalesStatus,
} from "@shared/schema";

interface ViewerPermissions {
  canViewRecord: boolean;
  canEditRecord: boolean;
  canManageMeetings: boolean;
  canCreateEstimate: boolean;
  canComment: boolean;
  isOwner?: boolean;
  isSupervisor?: boolean;
  isCustodian?: boolean;
  isAssignedAdmin?: boolean;
}

interface SalesRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRecord?: SalesRecord | null;
  clients: any[];
  viewerPermissions?: ViewerPermissions;
}

type FuelType = "bike" | "taxi" | "car";

type ReimbursementData = {
  enabled: boolean;
  amount: string;
  detail: string;
  attachBill: boolean;
  billFileName: string;
  billUrl: string;
  billPublicId: string;
  billMimeType: string;
  fuelClaimEnabled: boolean;
  fuelType: FuelType;
  kms: string;
  approvalStatus: string;
  approvalSubmittedAt: string;
  approvalSubmittedById: string;
  approvalSubmittedByName: string;
  approvalRecipientIds: string[];
};

interface SalesFormData {
  client: string;
  contactPerson: string;
  contactMobile: string;
  projectCode: string;
  projectName: string;
  estimateNumber: string;
  invoiceNumber: string;
  paymentRef: string;
  projectedValue: string;
  wonValue: string;
  visit: boolean;
  needHelp: boolean;
  goal: string;
  actionItems: string[];
  nextFollowUpDate: Date | null;
  nextFollowUpActionItems: string[];
  projectStatus: SalesStatus;
  projectCustodians: string[];
  supervisors: string[];
}

interface SalesDepartmentUser {
  id: string;
  displayName: string;
  email: string;
  role?: string;
  department?: string;
}
interface LinkedEstimateItem {
  id: string;
  source: string;
  estimateNumber: string;
  title: string;
  status: string;
  totalValue: string;
  createdAt?: unknown;
}

const STATUS_OPTIONS: { value: SalesStatus; label: string }[] = [
  { value: "Lead", label: "Lead" },
  { value: "Discussion", label: "Discussion" },
  { value: "Negotiation", label: "Negotiation" },
  { value: "Won", label: "Won" },
  { value: "Lost", label: "Lost" },
  { value: "Invoiced", label: "Invoiced" },
  { value: "Payment Received", label: "Payment Received" },
];

const EMPTY_REIMBURSEMENT: ReimbursementData = {
  enabled: false,
  amount: "",
  detail: "",
  attachBill: false,
  billFileName: "",
  billUrl: "",
  billPublicId: "",
  billMimeType: "",
  fuelClaimEnabled: false,
  fuelType: "bike",
  kms: "",
  approvalStatus: "not_submitted",
  approvalSubmittedAt: "",
  approvalSubmittedById: "",
  approvalSubmittedByName: "",
  approvalRecipientIds: [],
};

const EMPTY_FORM: SalesFormData = {
  client: "",
  contactPerson: "",
  contactMobile: "",
  projectCode: "",
  projectName: "",
  estimateNumber: "",
  invoiceNumber: "",
  paymentRef: "",
  projectedValue: "",
  wonValue: "",
  visit: false,
  needHelp: false,
  goal: "",
  actionItems: [""],
  nextFollowUpDate: null,
  nextFollowUpActionItems: [""],
  projectStatus: "Lead",
  projectCustodians: [],
  supervisors: [],
};

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function uniqueUserIds(...groups: Array<unknown[] | unknown>): string[] {
  const seen = new Set<string>();
  const values = groups.flatMap((group) =>
    Array.isArray(group) ? group : [group],
  );

  values.forEach((value) => {
    const normalized = String(value || "").trim();
    if (normalized) {
      seen.add(normalized);
    }
  });

  return Array.from(seen);
}

function buildRecordAccessUserIds(params: {
  salesPersonId?: unknown;
  assignedAdminId?: unknown;
  adminParticipantIds?: unknown;
  projectCustodians?: unknown;
  supervisors?: unknown;
}) {
  return uniqueUserIds(
    params.salesPersonId,
    params.assignedAdminId,
    normalizeStringArray(params.adminParticipantIds),
    normalizeStringArray(params.projectCustodians),
    normalizeStringArray(params.supervisors),
  );
}

function getRelatedRecipientIds(recordData: any, actorId?: string) {
  return buildRecordAccessUserIds({
    salesPersonId: recordData?.salesPersonId,
    assignedAdminId: recordData?.assignedAdminId,
    adminParticipantIds: recordData?.adminParticipantIds,
    projectCustodians: recordData?.projectCustodians,
    supervisors: recordData?.supervisors,
  }).filter((id) => !!id && id !== actorId);
}

function buildRecordPermissionSets(params: {
  salesPersonId?: unknown;
  assignedAdminId?: unknown;
  adminParticipantIds?: unknown;
  projectCustodians?: unknown;
  supervisors?: unknown;
}) {
  const fullEditUserIds = uniqueUserIds(
    params.salesPersonId,
    params.assignedAdminId,
    normalizeStringArray(params.adminParticipantIds),
    normalizeStringArray(params.supervisors),
  );

  const meetingUpdateUserIds = uniqueUserIds(
    fullEditUserIds,
    normalizeStringArray(params.projectCustodians),
  );

  return {
    accessUserIds: meetingUpdateUserIds,
    canViewUserIds: meetingUpdateUserIds,
    canCommentUserIds: meetingUpdateUserIds,
    canManageMeetingUserIds: meetingUpdateUserIds,
    canEditUserIds: fullEditUserIds,
    canCreateEstimateUserIds: fullEditUserIds,
  };
}

function resolveViewerPermissions(
  recordData: any,
  actorId: string,
  explicitPermissions?: ViewerPermissions,
): ViewerPermissions {
  if (explicitPermissions) {
    return explicitPermissions;
  }

  if (!recordData || !actorId) {
    return {
      canViewRecord: true,
      canEditRecord: true,
      canManageMeetings: true,
      canCreateEstimate: true,
      canComment: true,
    };
  }

  const projectCustodians = normalizeStringArray(recordData?.projectCustodians);
  const supervisors = normalizeStringArray(recordData?.supervisors);
  const adminParticipantIds = normalizeStringArray(
    recordData?.adminParticipantIds,
  );
  const canViewUserIds = normalizeStringArray(
    recordData?.canViewUserIds?.length
      ? recordData.canViewUserIds
      : recordData?.accessUserIds,
  );
  const canEditUserIds = normalizeStringArray(recordData?.canEditUserIds);
  const canManageMeetingUserIds = normalizeStringArray(
    recordData?.canManageMeetingUserIds?.length
      ? recordData.canManageMeetingUserIds
      : canViewUserIds,
  );
  const canCreateEstimateUserIds = normalizeStringArray(
    recordData?.canCreateEstimateUserIds?.length
      ? recordData.canCreateEstimateUserIds
      : canEditUserIds,
  );
  const canCommentUserIds = normalizeStringArray(
    recordData?.canCommentUserIds?.length
      ? recordData.canCommentUserIds
      : canViewUserIds,
  );

  const isOwner = String(recordData?.salesPersonId || "") === actorId;
  const isSupervisor = supervisors.includes(actorId);
  const isCustodian = projectCustodians.includes(actorId);
  const isAssignedAdmin =
    String(recordData?.assignedAdminId || "") === actorId ||
    adminParticipantIds.includes(actorId);

  const canViewRecord =
    isOwner ||
    isSupervisor ||
    isCustodian ||
    isAssignedAdmin ||
    canViewUserIds.includes(actorId);

  const canEditRecord =
    isOwner ||
    isSupervisor ||
    isAssignedAdmin ||
    canEditUserIds.includes(actorId);

  const canManageMeetings =
    canViewRecord || canManageMeetingUserIds.includes(actorId);

  const canCreateEstimate =
    canEditRecord || canCreateEstimateUserIds.includes(actorId);

  const canComment = canViewRecord || canCommentUserIds.includes(actorId);

  return {
    canViewRecord,
    canEditRecord,
    canManageMeetings,
    canCreateEstimate,
    canComment,
    isOwner,
    isSupervisor,
    isCustodian,
    isAssignedAdmin,
  };
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameCalendarDay(a?: Date | null, b?: Date | null) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function generateProjectCode(client: string, projectName: string) {
  const clientCode = client
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0]?.toUpperCase() || "")
    .join("");

  const projectCode = projectName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0]?.toUpperCase() || "")
    .join("");

  const today = new Date();
  const y = today.getFullYear().toString().slice(-2);
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const random = Math.floor(100 + Math.random() * 900);

  const left = clientCode || "CLI";
  const right = projectCode || "PRJ";
  return `${left}-${right}-${y}${m}${d}-${random}`;
}

function normalizeRole(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isSalesUser(user: SalesDepartmentUser) {
  const role = normalizeRole(user.role);
  const department = normalizeRole(user.department);
  return role === "sales" || department.includes("sales");
}

function isAdminLikeUser(user: SalesDepartmentUser) {
  const role = normalizeRole(user.role);
  const department = normalizeRole(user.department);
  return role.includes("admin") || department.includes("admin");
}

function normalizeProjectCodeValue(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function matchesEstimateProjectCode(data: any, projectCode: string) {
  const target = normalizeProjectCodeValue(projectCode);
  if (!target) return false;

  return [
    data?.projectCode,
    data?.linkedProjectCode,
    data?.salesProjectCode,
    data?.project_code,
  ].some((value) => normalizeProjectCodeValue(value) === target);
}

function resolveEstimateNumber(data: any, fallbackId: string) {
  return (
    data?.estimateNumber ||
    data?.estimateNo ||
    data?.quotationNumber ||
    data?.number ||
    fallbackId
  );
}

function resolveEstimateTitle(data: any) {
  return (
    data?.projectName ||
    data?.title ||
    data?.subject ||
    data?.client ||
    "Estimate"
  );
}

function resolveEstimateStatus(data: any) {
  return data?.status || data?.recordStatus || data?.approvalStatus || "Saved";
}

function resolveEstimateTotal(data: any) {
  const total =
    data?.grandTotal ?? data?.total ?? data?.netAmount ?? data?.amount;
  if (total === undefined || total === null || total === "") return "";
  return String(total);
}

function userMatchesSupervisorSelection(
  user: SalesDepartmentUser,
  selectedValue: string,
) {
  const value = String(selectedValue || "").trim();
  if (!value) return false;
  return (
    value === user.id ||
    (!!user.email && value.toLowerCase() === user.email.toLowerCase()) ||
    value.toLowerCase() === user.displayName.toLowerCase()
  );
}

function TagInput({
  label,
  placeholder,
  values,
  onChange,
  testIdPrefix,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (next: string[]) => void;
  testIdPrefix: string;
}) {
  const [draft, setDraft] = useState("");

  const addValue = () => {
    const normalized = draft.trim();
    if (!normalized) return;
    if (values.includes(normalized)) {
      setDraft("");
      return;
    }
    onChange([...values, normalized]);
    setDraft("");
  };

  const removeValue = (value: string) => {
    onChange(values.filter((item) => item !== value));
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addValue();
            }
          }}
          className="h-8"
          placeholder={placeholder}
          data-testid={`${testIdPrefix}-input`}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addValue}
          data-testid={`${testIdPrefix}-add`}
        >
          Add
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <Badge key={value} variant="secondary" className="gap-1 text-xs">
              <span>{value}</span>
              <button
                type="button"
                onClick={() => removeValue(value)}
                data-testid={`${testIdPrefix}-remove-${value}`}
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

export function SalesRecordModal({
  isOpen,
  onClose,
  editingRecord,
  clients,
  viewerPermissions,
}: SalesRecordModalProps) {
  const { userProfile, currentUser } = useAuth();
  const actorId = currentUser?.uid || userProfile?.id || "";
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const resolvedPermissions = useMemo(
    () => resolveViewerPermissions(editingRecord, actorId, viewerPermissions),
    [editingRecord, actorId, viewerPermissions],
  );

  const canEditRecord = editingRecord
    ? resolvedPermissions.canEditRecord
    : true;
  const canManageMeetings = editingRecord
    ? resolvedPermissions.canManageMeetings
    : true;
  const canCreateEstimate = editingRecord
    ? resolvedPermissions.canCreateEstimate
    : true;
  const canCommentOnRecord = editingRecord
    ? resolvedPermissions.canComment
    : true;
  const isMeetingOnlyUser =
    !!editingRecord && canManageMeetings && !canEditRecord;
  const isProjectOwner = editingRecord
    ? resolvedPermissions.isOwner === true
    : true;

  const [loading, setLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<SalesDepartmentUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [linkedEstimates, setLinkedEstimates] = useState<LinkedEstimateItem[]>(
    [],
  );
  const [estimatesLoading, setEstimatesLoading] = useState(false);
  const [billFile, setBillFile] = useState<File | null>(null);
  const [billUploading, setBillUploading] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<
    string | undefined
  >(undefined);
  const [newMeetingDate, setNewMeetingDate] = useState<Date | null>(null);
  const [meetingComment, setMeetingComment] = useState("");
  const [showNewMeetingForm, setShowNewMeetingForm] = useState(false);
  const [newMeetingData, setNewMeetingData] = useState({
    discussionNotes: "",
    actionItems: [""],
    visit: false,
    online: false,
    reimbursement: { ...EMPTY_REIMBURSEMENT },
  });

  const isVisitMeetingMode = newMeetingData.visit && !newMeetingData.online;
  const canSubmitReimbursementClaim =
    isProjectOwner && canManageMeetings && isVisitMeetingMode;

  const [formData, setFormData] = useState<SalesFormData>(EMPTY_FORM);
  const [comment, setComment] = useState("");

  const {
    meetingUpdates,
    loading: meetingUpdatesLoading,
    createMeetingUpdate,
  } = useMeetingUpdates(editingRecord?.id);

  const selectedMeeting = meetingUpdates.find(
    (meeting) => meeting.id === selectedMeetingId,
  ) as any;

  const { comments = [], addComment } = useMeetingUpdateComments(
    editingRecord?.id,
    selectedMeetingId || undefined,
  );

  React.useEffect(() => {
    if (meetingUpdates.length > 0 && !selectedMeetingId) {
      setSelectedMeetingId(meetingUpdates[0].id);
    }
  }, [meetingUpdates, selectedMeetingId]);

  useEffect(() => {
    if (editingRecord) {
      setFormData({
        client: editingRecord.client ?? "",
        contactPerson: editingRecord.contactPerson ?? "",
        contactMobile: editingRecord.contactMobile ?? "",
        projectCode: editingRecord.projectCode ?? "",
        projectName: editingRecord.projectName ?? "",
        estimateNumber: editingRecord.estimateNumber ?? "",
        invoiceNumber: editingRecord.invoiceNumber ?? "",
        paymentRef: editingRecord.paymentRef ?? "",
        projectedValue: String(
          editingRecord.projectedValue ??
            (editingRecord as any).projectValue ??
            "",
        ),
        wonValue: String(editingRecord.wonValue ?? ""),
        visit: editingRecord.visit ?? false,
        needHelp: editingRecord.needHelp ?? false,
        goal: editingRecord.goal ?? "",
        actionItems: editingRecord.actionItems?.length
          ? editingRecord.actionItems
          : [""],
        nextFollowUpDate: editingRecord.nextFollowUp?.date
          ? editingRecord.nextFollowUp.date instanceof Date
            ? editingRecord.nextFollowUp.date
            : new Date(editingRecord.nextFollowUp.date)
          : null,
        nextFollowUpActionItems: editingRecord.nextFollowUp?.actionItems?.length
          ? editingRecord.nextFollowUp.actionItems
          : [""],
        projectStatus: editingRecord.projectStatus ?? "Lead",
        projectCustodians: normalizeStringArray(
          (editingRecord as any).projectCustodians,
        ),
        supervisors: normalizeStringArray((editingRecord as any).supervisors),
      });
    } else {
      setFormData(EMPTY_FORM);
    }

    setNewMeetingDate(null);
    setMeetingComment("");
    setComment("");
    setShowNewMeetingForm(false);
    setBillFile(null);
    setNewMeetingData({
      discussionNotes: "",
      actionItems: [""],
      visit: false,
      online: false,
      reimbursement: { ...EMPTY_REIMBURSEMENT },
    });
  }, [editingRecord, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const usersSnap = await getDocs(
          collection(db, "Panels", "IEDGE-SYSTEM", "users"),
        );

        const nextUsers = usersSnap.docs
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
            } as SalesDepartmentUser;
          })
          .sort((a, b) => a.displayName.localeCompare(b.displayName));

        if (isMounted) {
          setAllUsers(nextUsers);
        }
      } catch (error) {
        console.error("Error loading users:", error);
        if (isMounted) {
          setAllUsers([]);
        }
      } finally {
        if (isMounted) {
          setUsersLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const salesDepartmentUsers = useMemo(
    () => allUsers.filter((user) => isSalesUser(user)),
    [allUsers],
  );

  const supervisorEligibleUsers = useMemo(
    () => allUsers.filter((user) => isSalesUser(user) || isAdminLikeUser(user)),
    [allUsers],
  );

  const autoGeneratedProjectCode = useMemo(
    () =>
      formData.client.trim() && formData.projectName.trim()
        ? generateProjectCode(formData.client, formData.projectName)
        : "",
    [formData.client, formData.projectName],
  );

  const generatedProjectCode =
    editingRecord?.projectCode ||
    formData.projectCode ||
    autoGeneratedProjectCode;

  useEffect(() => {
    if (editingRecord?.projectCode) return;
    if (!autoGeneratedProjectCode) return;

    setFormData((prev) =>
      prev.projectCode === autoGeneratedProjectCode
        ? prev
        : { ...prev, projectCode: autoGeneratedProjectCode },
    );
  }, [autoGeneratedProjectCode, editingRecord?.projectCode]);

  useEffect(() => {
    if (!isOpen || !generatedProjectCode) {
      setLinkedEstimates([]);
      return;
    }

    let isMounted = true;

    const fetchLinkedEstimates = async () => {
      setEstimatesLoading(true);
      try {
        const collectionNames = ["estimates", "estimateInvoices"];
        const nextItems: LinkedEstimateItem[] = [];

        for (const collectionName of collectionNames) {
          const snapshot = await getDocs(
            collection(db, "Panels", "IEDGE-SYSTEM", collectionName),
          );

          snapshot.docs.forEach((estimateDoc) => {
            const data = estimateDoc.data() as any;
            if (!matchesEstimateProjectCode(data, generatedProjectCode)) return;

            nextItems.push({
              id: estimateDoc.id,
              source: collectionName,
              estimateNumber: resolveEstimateNumber(data, estimateDoc.id),
              title: resolveEstimateTitle(data),
              status: resolveEstimateStatus(data),
              totalValue: resolveEstimateTotal(data),
              createdAt: data?.createdAt,
            });
          });
        }

        if (isMounted) {
          setLinkedEstimates(
            nextItems.sort((a, b) =>
              a.estimateNumber.localeCompare(b.estimateNumber),
            ),
          );
        }
      } catch (error) {
        console.error("Error loading linked estimates:", error);
        if (isMounted) {
          setLinkedEstimates([]);
        }
      } finally {
        if (isMounted) {
          setEstimatesLoading(false);
        }
      }
    };

    fetchLinkedEstimates();

    return () => {
      isMounted = false;
    };
  }, [generatedProjectCode, isOpen]);

  const salesRef = collection(db, "Panels", "IEDGE-SYSTEM", "salesRecords");

  const getAdminRecipientIds = (recordData: any): string[] => {
    const participantIds = Array.isArray(recordData?.adminParticipantIds)
      ? recordData.adminParticipantIds.filter(
          (id: string) => !!id && id !== actorId,
        )
      : [];

    if (participantIds.length > 0) {
      return Array.from(new Set(participantIds));
    }

    const fallbackAssignedAdminId = recordData?.assignedAdminId;
    return fallbackAssignedAdminId && fallbackAssignedAdminId !== actorId
      ? [fallbackAssignedAdminId]
      : [];
  };

  const getAdminApprovalRecipientIds = (recordData: any): string[] => {
    const recordAdmins = getAdminRecipientIds(recordData);
    if (recordAdmins.length > 0) {
      return recordAdmins;
    }

    return uniqueUserIds(
      allUsers.filter((user) => isAdminLikeUser(user)).map((user) => user.id),
    ).filter((id) => id !== actorId);
  };

  const getSalesRecipientId = (recordData: any): string | undefined => {
    return recordData?.salesPersonId && recordData.salesPersonId !== actorId
      ? recordData.salesPersonId
      : undefined;
  };

  const notifyRecipients = async ({
    recipientIds,
    type,
    recordId,
    meetingUpdateId,
    message,
  }: {
    recipientIds: string[];
    type: "record_update" | "comment" | "meeting_update";
    recordId: string;
    meetingUpdateId?: string;
    message: string;
  }) => {
    const uniqueRecipients = uniqueUserIds(recipientIds).filter(
      (id) => id !== actorId,
    );
    for (const recipientId of uniqueRecipients) {
      await createNotification({
        recipientId,
        type,
        recordId,
        meetingUpdateId,
        message,
        createdById: actorId,
        createdByName: userProfile?.displayName || "Unknown User",
      });
    }
  };

  const addActionItem = () =>
    setFormData((s) => ({ ...s, actionItems: [...s.actionItems, ""] }));

  const removeActionItem = (i: number) =>
    setFormData((s) => ({
      ...s,
      actionItems: s.actionItems.filter((_, idx) => idx !== i),
    }));

  const updateActionItem = (i: number, value: string) =>
    setFormData((s) => {
      const actionItems = [...s.actionItems];
      actionItems[i] = value;
      return { ...s, actionItems };
    });

  const addFollowUpActionItem = () =>
    setFormData((s) => ({
      ...s,
      nextFollowUpActionItems: [...s.nextFollowUpActionItems, ""],
    }));

  const removeFollowUpActionItem = (i: number) =>
    setFormData((s) => ({
      ...s,
      nextFollowUpActionItems: s.nextFollowUpActionItems.filter(
        (_, idx) => idx !== i,
      ),
    }));

  const updateFollowUpActionItem = (i: number, value: string) =>
    setFormData((s) => {
      const nextFollowUpActionItems = [...s.nextFollowUpActionItems];
      nextFollowUpActionItems[i] = value;
      return { ...s, nextFollowUpActionItems };
    });

  const addNewMeetingActionItem = () => {
    setNewMeetingData((prev) => ({
      ...prev,
      actionItems: [...prev.actionItems, ""],
    }));
  };

  const updateNewMeetingActionItem = (index: number, value: string) => {
    setNewMeetingData((prev) => ({
      ...prev,
      actionItems: prev.actionItems.map((item, i) =>
        i === index ? value : item,
      ),
    }));
  };

  const removeNewMeetingActionItem = (index: number) => {
    if (newMeetingData.actionItems.length <= 1) return;
    setNewMeetingData((prev) => ({
      ...prev,
      actionItems: prev.actionItems.filter((_, i) => i !== index),
    }));
  };

  const toggleCustodian = (user: SalesDepartmentUser, checked: boolean) => {
    setFormData((prev) => {
      const withoutUser = prev.projectCustodians.filter(
        (selectedValue) => !userMatchesSupervisorSelection(user, selectedValue),
      );

      return {
        ...prev,
        projectCustodians: checked ? [...withoutUser, user.id] : withoutUser,
      };
    });
  };

  const toggleSupervisor = (user: SalesDepartmentUser, checked: boolean) => {
    setFormData((prev) => {
      const withoutUser = prev.supervisors.filter(
        (selectedValue) => !userMatchesSupervisorSelection(user, selectedValue),
      );

      return {
        ...prev,
        supervisors: checked ? [...withoutUser, user.id] : withoutUser,
      };
    });
  };

  const selectedCustodianLabels = formData.projectCustodians.map(
    (selectedValue) => {
      const matchedUser = salesDepartmentUsers.find((user) =>
        userMatchesSupervisorSelection(user, selectedValue),
      );

      if (matchedUser) {
        return {
          key: matchedUser.id,
          label: matchedUser.displayName,
        };
      }

      return {
        key: selectedValue,
        label: selectedValue,
      };
    },
  );

  const selectedSupervisorLabels = formData.supervisors.map((selectedValue) => {
    const matchedUser = supervisorEligibleUsers.find((user) =>
      userMatchesSupervisorSelection(user, selectedValue),
    );

    if (matchedUser) {
      return {
        key: matchedUser.id,
        label: matchedUser.displayName,
      };
    }

    return {
      key: selectedValue,
      label: selectedValue,
    };
  });

  const today = startOfToday();
  const selectedMeetingDay = newMeetingDate ? new Date(newMeetingDate) : null;
  if (selectedMeetingDay) selectedMeetingDay.setHours(0, 0, 0, 0);

  const canClaimForSelectedMeeting =
    !!selectedMeetingDay && isSameCalendarDay(selectedMeetingDay, today);
  const claimDatePassed =
    !!selectedMeetingDay && selectedMeetingDay.getTime() < today.getTime();
  const claimDateInFuture =
    !!selectedMeetingDay && selectedMeetingDay.getTime() > today.getTime();

  const reimbursementNotice = !isProjectOwner
    ? "Only the project owner can submit a reimbursement claim for admin approval."
    : !isVisitMeetingMode
      ? "Claim Reimbursement is available only when Meeting Mode is Visit."
      : claimDatePassed
        ? "You cannot claim because the meeting date is passed."
        : claimDateInFuture
          ? "Reimbursement can only be claimed on the exact day of the meeting."
          : "Claim reimbursements on the day of meeting, otherwise you cannot claim after that date.";

  const onBillFileChange = (file?: File | null) => {
    setBillFile(file || null);
    setNewMeetingData((prev) => ({
      ...prev,
      reimbursement: {
        ...prev.reimbursement,
        attachBill: !!file,
        billFileName: file?.name || "",
        billUrl: "",
        billPublicId: "",
        billMimeType: file?.type || "",
      },
    }));
  };
  const uploadBillToCloudinary = async (file: File) => {
    const cloudName = "iedge-system-travel-uploads";
    const uploadPreset = "cloud-water";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "reimbursement");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await response.json();
    console.log("Cloudinary response:", data);

    if (!response.ok) {
      throw new Error(
        data?.error?.message || "Failed to upload bill to Cloudinary",
      );
    }

    return {
      billFileName: file.name,
      billUrl: data.secure_url || "",
      billPublicId: data.public_id || "",
      billMimeType: file.type || "",
    };
  };

  const handleCreateMeeting = async () => {
    if (!canManageMeetings) {
      toast({
        title: "Access restricted",
        description:
          "You do not have permission to add meeting updates for this project.",
        variant: "destructive",
      });
      return;
    }

    if (!editingRecord?.id || !userProfile || !newMeetingDate) {
      toast({
        title: "Cannot create meeting",
        description: "Please select a meeting date and ensure record is saved.",
        variant: "destructive",
      });
      return;
    }

    if (newMeetingData.reimbursement.enabled && !isProjectOwner) {
      toast({
        title: "Owner only action",
        description:
          "Only the project owner can submit a reimbursement claim for admin approval.",
        variant: "destructive",
      });
      return;
    }

    if (newMeetingData.reimbursement.enabled && !isVisitMeetingMode) {
      toast({
        title: "Visit meeting required",
        description:
          "Claim Reimbursement can only be made when the Meeting Mode is Visit.",
        variant: "destructive",
      });
      return;
    }

    if (newMeetingData.reimbursement.enabled && !canClaimForSelectedMeeting) {
      toast({
        title: "Reimbursement locked",
        description: claimDatePassed
          ? "You cannot claim because the meeting date is passed."
          : "Reimbursement can only be claimed on the exact meeting date.",
        variant: "destructive",
      });
      return;
    }

    if (newMeetingData.reimbursement.enabled && !billFile) {
      toast({
        title: "Bill attachment required",
        description:
          "Please attach the bill before submitting the reimbursement claim.",
        variant: "destructive",
      });
      return;
    }

    let uploadedBillData = {
      billFileName: newMeetingData.reimbursement.billFileName,
      billUrl: newMeetingData.reimbursement.billUrl,
      billPublicId: newMeetingData.reimbursement.billPublicId,
      billMimeType: newMeetingData.reimbursement.billMimeType,
    };

    if (newMeetingData.reimbursement.enabled && billFile) {
      try {
        setBillUploading(true);
        uploadedBillData = await uploadBillToCloudinary(billFile);
      } catch (error: any) {
        console.error("Error uploading bill:", error);
        toast({
          title: "Bill upload failed",
          description:
            error?.message || "Unable to upload the bill to Cloudinary.",
          variant: "destructive",
        });
        return;
      } finally {
        setBillUploading(false);
      }
    }

    const newMeeting: InsertMeetingUpdate = {
      recordId: editingRecord.id,
      meetingDate: format(newMeetingDate, "yyyy-MM-dd"),
      discussionNotes: newMeetingData.discussionNotes,
      actionItems: newMeetingData.actionItems.filter((item) => item.trim()),
      visit: newMeetingData.visit,
      createdById: actorId,
      createdByName: userProfile.displayName,
    };

    try {
      const recordDoc = doc(
        db,
        "Panels",
        "IEDGE-SYSTEM",
        "salesRecords",
        editingRecord.id,
      );
      const recordSnap = await getDoc(recordDoc);
      const latestRecord = recordSnap.exists()
        ? (recordSnap.data() as any)
        : {};

      let meetingRecordData: any = latestRecord;

      if (userProfile.role !== "sales") {
        const existingAdminParticipantIds = Array.isArray(
          latestRecord.adminParticipantIds,
        )
          ? latestRecord.adminParticipantIds
          : [];

        const mergedAdminParticipantIds = Array.from(
          new Set([...existingAdminParticipantIds, actorId]),
        );
        const mergedRecordData = {
          ...latestRecord,
          assignedAdminId: actorId,
          assignedAdminName: userProfile.displayName,
          adminParticipantIds: mergedAdminParticipantIds,
        };
        const permissionSets = buildRecordPermissionSets(mergedRecordData);

        await updateDoc(recordDoc, {
          assignedAdminId: actorId,
          assignedAdminName: userProfile.displayName,
          adminParticipantIds: mergedAdminParticipantIds,
          accessUserIds: permissionSets.accessUserIds,
          canViewUserIds: permissionSets.canViewUserIds,
          canCommentUserIds: permissionSets.canCommentUserIds,
          canManageMeetingUserIds: permissionSets.canManageMeetingUserIds,
          canEditUserIds: permissionSets.canEditUserIds,
          canCreateEstimateUserIds: permissionSets.canCreateEstimateUserIds,
          updatedAt: serverTimestamp(),
        });

        meetingRecordData = {
          ...mergedRecordData,
          accessUserIds: permissionSets.accessUserIds,
          canViewUserIds: permissionSets.canViewUserIds,
          canCommentUserIds: permissionSets.canCommentUserIds,
          canManageMeetingUserIds: permissionSets.canManageMeetingUserIds,
          canEditUserIds: permissionSets.canEditUserIds,
          canCreateEstimateUserIds: permissionSets.canCreateEstimateUserIds,
        };
      }

      const meetingRecipientIds = getRelatedRecipientIds(
        meetingRecordData,
        actorId,
      );
      const reimbursementAdminRecipientIds = newMeetingData.reimbursement
        .enabled
        ? getAdminApprovalRecipientIds(meetingRecordData)
        : [];

      const reimbursementPayload = {
        ...newMeetingData.reimbursement,
        ...uploadedBillData,
        attachBill: newMeetingData.reimbursement.enabled,
        amount: newMeetingData.reimbursement.amount.trim(),
        detail: newMeetingData.reimbursement.detail.trim(),
        kms: newMeetingData.reimbursement.kms.trim(),
        claimAllowed: canClaimForSelectedMeeting,
        claimStatus: claimDatePassed
          ? "date_passed"
          : claimDateInFuture
            ? "meeting_not_due"
            : "open_today_only",
        claimRuleText:
          "Claim reimbursements on the day of meeting otherwise you cannot claim after that date.",
        meetingDate: format(newMeetingDate, "yyyy-MM-dd"),
        approvalStatus: newMeetingData.reimbursement.enabled
          ? "pending_admin_approval"
          : "not_submitted",
        approvalSubmittedAt: newMeetingData.reimbursement.enabled
          ? new Date().toISOString()
          : "",
        approvalSubmittedById: newMeetingData.reimbursement.enabled
          ? actorId
          : "",
        approvalSubmittedByName: newMeetingData.reimbursement.enabled
          ? userProfile.displayName
          : "",
        approvalRecipientIds: reimbursementAdminRecipientIds,
      };

      const meetingId = await createMeetingUpdate(
        {
          ...(newMeeting as any),
          online: newMeetingData.online,
          reimbursement: reimbursementPayload,
        },
        meetingRecipientIds,
      );

      if (
        reimbursementPayload.enabled &&
        reimbursementAdminRecipientIds.length > 0
      ) {
        await notifyRecipients({
          recipientIds: reimbursementAdminRecipientIds,
          type: "meeting_update",
          recordId: editingRecord.id,
          meetingUpdateId: meetingId ?? undefined,
          message: `${userProfile.displayName} submitted a reimbursement claim for admin approval on Project ${meetingRecordData?.projectName || editingRecord.projectName || formData.projectName}`,
        });
      }

      setSelectedMeetingId(meetingId ?? undefined);
      setShowNewMeetingForm(false);
      setNewMeetingDate(null);
      setNewMeetingData({
        discussionNotes: "",
        actionItems: [""],
        visit: false,
        online: false,
        reimbursement: { ...EMPTY_REIMBURSEMENT },
      });
      setBillFile(null);
      toast({
        title: "Success",
        description: reimbursementPayload.enabled
          ? "Meeting update created and reimbursement claim submitted for admin approval."
          : "Meeting update created successfully.",
      });
    } catch (err) {
      console.error("Error creating meeting:", err);
      toast({
        title: "Error",
        description: "Failed to save meeting update.",
        variant: "destructive",
      });
    }
  };

  const handleMeetingCommentSubmit = async () => {
    if (
      !meetingComment.trim() ||
      !selectedMeetingId ||
      !editingRecord?.id ||
      !userProfile
    ) {
      toast({
        title: "Cannot add comment",
        description: "Please select a meeting and ensure record is saved.",
        variant: "destructive",
      });
      return;
    }

    if (!canCommentOnRecord) {
      toast({
        title: "Access restricted",
        description:
          "You do not have permission to comment on this meeting update.",
        variant: "destructive",
      });
      return;
    }

    try {
      const recordDoc = doc(
        db,
        "Panels",
        "IEDGE-SYSTEM",
        "salesRecords",
        editingRecord.id,
      );
      const recordSnap = await getDoc(recordDoc);
      const latestRecord = recordSnap.exists()
        ? (recordSnap.data() as any)
        : {};

      let meetingCommentRecordData: any = latestRecord;

      if (userProfile.role !== "sales") {
        const existingAdminParticipantIds = Array.isArray(
          latestRecord.adminParticipantIds,
        )
          ? latestRecord.adminParticipantIds
          : [];

        const mergedAdminParticipantIds = Array.from(
          new Set([...existingAdminParticipantIds, actorId]),
        );
        const mergedRecordData = {
          ...latestRecord,
          assignedAdminId: actorId,
          assignedAdminName: userProfile.displayName,
          adminParticipantIds: mergedAdminParticipantIds,
        };
        const permissionSets = buildRecordPermissionSets(mergedRecordData);

        await updateDoc(recordDoc, {
          assignedAdminId: actorId,
          assignedAdminName: userProfile.displayName,
          adminParticipantIds: mergedAdminParticipantIds,
          accessUserIds: permissionSets.accessUserIds,
          canViewUserIds: permissionSets.canViewUserIds,
          canCommentUserIds: permissionSets.canCommentUserIds,
          canManageMeetingUserIds: permissionSets.canManageMeetingUserIds,
          canEditUserIds: permissionSets.canEditUserIds,
          canCreateEstimateUserIds: permissionSets.canCreateEstimateUserIds,
          updatedAt: serverTimestamp(),
        });

        meetingCommentRecordData = {
          ...mergedRecordData,
          accessUserIds: permissionSets.accessUserIds,
          canViewUserIds: permissionSets.canViewUserIds,
          canCommentUserIds: permissionSets.canCommentUserIds,
          canManageMeetingUserIds: permissionSets.canManageMeetingUserIds,
          canEditUserIds: permissionSets.canEditUserIds,
          canCreateEstimateUserIds: permissionSets.canCreateEstimateUserIds,
        };
      }

      const meetingCommentRecipientIds = getRelatedRecipientIds(
        meetingCommentRecordData,
        actorId,
      );

      await addComment(
        meetingComment,
        meetingCommentRecipientIds,
        selectedMeetingId,
      );
      setMeetingComment("");
      toast({
        title: "Comment added",
        description: "Your comment has been added to this meeting.",
      });
    } catch (err) {
      console.error("Error adding comment:", err);
      toast({
        title: "Error",
        description: "Failed to add comment.",
        variant: "destructive",
      });
    }
  };

  const saveSalesRecord = async ({
    closeAfterSave = true,
    showSuccessToast = true,
  }: {
    closeAfterSave?: boolean;
    showSuccessToast?: boolean;
  } = {}) => {
    if (editingRecord && !canEditRecord && !isMeetingOnlyUser) {
      toast({
        title: "Access restricted",
        description:
          "Custodians can only add meeting updates, follow-ups, and comments. They cannot edit the main project record.",
        variant: "destructive",
      });
      return null;
    }

    if (!userProfile) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);
    try {
      const projectedValueNumber = parseFloat(formData.projectedValue) || 0;
      const wonValueNumber = parseFloat(formData.wonValue) || 0;
      const filteredActionItems = formData.actionItems.filter(
        (it) => it.trim() !== "",
      );
      const filteredFollowUpActionItems =
        formData.nextFollowUpActionItems.filter((it) => it.trim() !== "");

      const recordData: any = {
        client: formData.client,
        contactPerson: formData.contactPerson,
        contactMobile: formData.contactMobile,
        projectCode:
          generatedProjectCode ||
          formData.projectCode ||
          generateProjectCode(formData.client, formData.projectName),
        projectName: formData.projectName,
        estimateNumber: formData.estimateNumber,
        invoiceNumber: formData.invoiceNumber,
        paymentRef: formData.paymentRef,
        projectedValue: projectedValueNumber,
        wonValue: wonValueNumber,
        visit: formData.visit,
        needHelp: formData.needHelp,
        goal: formData.goal,
        actionItems: filteredActionItems,
        nextFollowUp: {
          date: formData.nextFollowUpDate || null,
          actionItems: filteredFollowUpActionItems,
        },
        projectStatus: formData.projectStatus,
        projectCustodians: formData.projectCustodians,
        supervisors: formData.supervisors,
        updatedAt: serverTimestamp(),
      };

      let savedRecordId: string;

      if (editingRecord && isMeetingOnlyUser) {
        const recordDoc = doc(
          db,
          "Panels",
          "IEDGE-SYSTEM",
          "salesRecords",
          editingRecord.id,
        );

        const existingSnap = await getDoc(recordDoc);
        const existingData = existingSnap.exists()
          ? (existingSnap.data() as any)
          : {};
        const existingAdminParticipantIds = Array.isArray(
          existingData.adminParticipantIds,
        )
          ? existingData.adminParticipantIds
          : [];

        const mergedAdminParticipantIds =
          userProfile.role !== "sales"
            ? Array.from(new Set([...existingAdminParticipantIds, actorId]))
            : existingAdminParticipantIds;

        const assignedAdminId =
          userProfile.role !== "sales"
            ? actorId
            : existingData.assignedAdminId || undefined;
        const assignedAdminName =
          userProfile.role !== "sales"
            ? userProfile.displayName
            : existingData.assignedAdminName || undefined;

        const permissionContext = {
          salesPersonId:
            existingData.salesPersonId ||
            editingRecord.salesPersonId ||
            actorId,
          assignedAdminId,
          adminParticipantIds: mergedAdminParticipantIds,
          projectCustodians:
            normalizeStringArray(existingData.projectCustodians).length > 0
              ? normalizeStringArray(existingData.projectCustodians)
              : formData.projectCustodians,
          supervisors:
            normalizeStringArray(existingData.supervisors).length > 0
              ? normalizeStringArray(existingData.supervisors)
              : formData.supervisors,
        };

        const permissionSets = buildRecordPermissionSets(permissionContext);
        const followUpOnlyPayload: any = {
          nextFollowUp: {
            date: formData.nextFollowUpDate || null,
            actionItems: filteredFollowUpActionItems,
          },
          updatedAt: serverTimestamp(),
          assignedAdminId: assignedAdminId ?? null,
          assignedAdminName: assignedAdminName ?? null,
          adminParticipantIds: mergedAdminParticipantIds,
          accessUserIds: permissionSets.accessUserIds,
          canViewUserIds: permissionSets.canViewUserIds,
          canCommentUserIds: permissionSets.canCommentUserIds,
          canManageMeetingUserIds: permissionSets.canManageMeetingUserIds,
          canEditUserIds: permissionSets.canEditUserIds,
          canCreateEstimateUserIds: permissionSets.canCreateEstimateUserIds,
        };

        await updateDoc(recordDoc, followUpOnlyPayload);
        savedRecordId = editingRecord.id;

        await notifyRecipients({
          recipientIds: getRelatedRecipientIds(
            {
              ...existingData,
              ...permissionContext,
              ...followUpOnlyPayload,
            },
            actorId,
          ),
          type: "record_update",
          recordId: editingRecord.id,
          message: `${userProfile.displayName} updated the next follow-up on Project ${existingData.projectName || editingRecord.projectName || formData.projectName}`,
        });
      } else if (editingRecord) {
        const recordDoc = doc(
          db,
          "Panels",
          "IEDGE-SYSTEM",
          "salesRecords",
          editingRecord.id,
        );

        const existingSnap = await getDoc(recordDoc);
        const existingData = existingSnap.exists()
          ? (existingSnap.data() as any)
          : {};

        const existingAdminParticipantIds = Array.isArray(
          existingData.adminParticipantIds,
        )
          ? existingData.adminParticipantIds
          : [];

        const finalRecordData: any = {
          ...recordData,
          visibleTo: deleteField(),
          visibilityRule: deleteField(),
          salesPersonId:
            existingData.salesPersonId ||
            editingRecord.salesPersonId ||
            actorId,
          salesPersonName:
            existingData.salesPersonName ||
            editingRecord.salesPersonName ||
            userProfile.displayName,
          assignedAdminId:
            userProfile.role !== "sales"
              ? actorId
              : (existingData.assignedAdminId ?? null),
          assignedAdminName:
            userProfile.role !== "sales"
              ? userProfile.displayName
              : (existingData.assignedAdminName ?? null),
          adminParticipantIds:
            userProfile.role !== "sales"
              ? Array.from(new Set([...existingAdminParticipantIds, actorId]))
              : existingAdminParticipantIds,
        };

        const permissionSets = buildRecordPermissionSets(finalRecordData);
        finalRecordData.accessUserIds = permissionSets.accessUserIds;
        finalRecordData.canViewUserIds = permissionSets.canViewUserIds;
        finalRecordData.canCommentUserIds = permissionSets.canCommentUserIds;
        finalRecordData.canManageMeetingUserIds =
          permissionSets.canManageMeetingUserIds;
        finalRecordData.canEditUserIds = permissionSets.canEditUserIds;
        finalRecordData.canCreateEstimateUserIds =
          permissionSets.canCreateEstimateUserIds;

        await updateDoc(recordDoc, finalRecordData);
        savedRecordId = editingRecord.id;

        await notifyRecipients({
          recipientIds: getRelatedRecipientIds(finalRecordData, actorId),
          type: "record_update",
          recordId: editingRecord.id,
          message: `${userProfile.displayName} updated Project ${formData.projectName}`,
        });
      } else {
        const salesPersonId = actorId;
        const assignedAdminId =
          userProfile.role !== "sales" ? actorId : undefined;
        const assignedAdminName =
          userProfile.role !== "sales" ? userProfile.displayName : undefined;
        const adminParticipantIds =
          userProfile.role !== "sales" ? [actorId] : [];
        const permissionSets = buildRecordPermissionSets({
          salesPersonId,
          assignedAdminId,
          adminParticipantIds,
          projectCustodians: formData.projectCustodians,
          supervisors: formData.supervisors,
        });

        const addedRecord = await addDoc(salesRef, {
          ...recordData,
          createdAt: serverTimestamp(),
          salesPersonId,
          salesPersonName: userProfile.displayName,
          assignedAdminId: assignedAdminId ?? null,
          assignedAdminName: assignedAdminName ?? null,
          adminParticipantIds,
          accessUserIds: permissionSets.accessUserIds,
          canViewUserIds: permissionSets.canViewUserIds,
          canCommentUserIds: permissionSets.canCommentUserIds,
          canManageMeetingUserIds: permissionSets.canManageMeetingUserIds,
          canEditUserIds: permissionSets.canEditUserIds,
          canCreateEstimateUserIds: permissionSets.canCreateEstimateUserIds,
        });

        savedRecordId = addedRecord.id;

        await notifyRecipients({
          recipientIds: permissionSets.accessUserIds,
          type: "record_update",
          recordId: addedRecord.id,
          message: `${userProfile.displayName} created Project ${formData.projectName}`,
        });
      }

      if (showSuccessToast) {
        toast({
          title: "Success",
          description: editingRecord
            ? "Sales record updated successfully"
            : "Sales record created successfully",
        });
      }

      if (closeAfterSave) {
        onClose();
      }

      return savedRecordId;
    } catch (err) {
      console.error("Error saving sales record:", err);
      toast({
        title: "Error",
        description: "Failed to save sales record",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    await saveSalesRecord();
  };

  const handleCreateEstimate = async () => {
    if (editingRecord && !canCreateEstimate) {
      toast({
        title: "Access restricted",
        description:
          "Only the project owner, supervisors, or admins can create estimates for this project.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.client.trim() || !formData.projectName.trim()) {
      toast({
        title: "Client and project required",
        description:
          "Please select the client and enter the project name before creating the estimate.",
        variant: "destructive",
      });
      return;
    }

    if (!generatedProjectCode) {
      toast({
        title: "Project code missing",
        description:
          "Project code is not ready yet. Please check the client and project name.",
        variant: "destructive",
      });
      return;
    }

    const savedRecordId = await saveSalesRecord({
      closeAfterSave: false,
      showSuccessToast: false,
    });

    if (!savedRecordId) return;

    const estimateContext = {
      source: "sales-record",
      salesRecordId: savedRecordId,
      projectCode: generatedProjectCode,
      projectName: formData.projectName,
      client: formData.client,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "iedge-estimate-context",
      JSON.stringify(estimateContext),
    );
    localStorage.setItem("iedge-estimate-project-code", generatedProjectCode);
    localStorage.setItem("iedge-estimate-project-name", formData.projectName);
    localStorage.setItem("iedge-estimate-client", formData.client);
    localStorage.setItem("iedge-estimate-sales-record-id", savedRecordId);

    toast({
      title: "Estimate context created",
      description:
        "Project code has been saved. Opening the Estimate module now.",
    });

    setLocation("/estimate");
  };

  const handleCommentSubmit = async (recordId: string) => {
    if (!comment.trim() || !editingRecord) return;

    if (!canCommentOnRecord) {
      toast({
        title: "Access restricted",
        description: "You do not have permission to comment on this record.",
        variant: "destructive",
      });
      return;
    }

    const timestamp = new Date();
    const userName = userProfile?.displayName ?? "Unknown User";

    try {
      const recordDoc = doc(
        db,
        "Panels",
        "IEDGE-SYSTEM",
        "salesRecords",
        recordId,
      );

      const recordSnap = await getDoc(recordDoc);
      if (!recordSnap.exists()) {
        throw new Error("Record not found");
      }

      const latestRecord = recordSnap.data() as any;
      const existingAdminParticipantIds = Array.isArray(
        latestRecord.adminParticipantIds,
      )
        ? latestRecord.adminParticipantIds
        : [];

      const newComment = {
        text: comment,
        timestamp: timestamp.toISOString(),
        userName,
        userId: actorId,
      };

      const mergedAdminParticipantIds =
        userProfile?.role !== "sales"
          ? Array.from(new Set([...existingAdminParticipantIds, actorId]))
          : existingAdminParticipantIds;

      const mergedRecordData = {
        ...latestRecord,
        assignedAdminId:
          userProfile?.role !== "sales"
            ? actorId
            : (latestRecord.assignedAdminId ?? null),
        assignedAdminName:
          userProfile?.role !== "sales"
            ? userName
            : (latestRecord.assignedAdminName ?? null),
        adminParticipantIds: mergedAdminParticipantIds,
        projectCustodians: normalizeStringArray(latestRecord.projectCustodians),
        supervisors: normalizeStringArray(latestRecord.supervisors),
      };
      const permissionSets = buildRecordPermissionSets(mergedRecordData);

      const updatePayload: any = {
        comments: [...(latestRecord.comments || []), newComment],
        updatedAt: serverTimestamp(),
        assignedAdminId: mergedRecordData.assignedAdminId,
        assignedAdminName: mergedRecordData.assignedAdminName,
        adminParticipantIds: mergedAdminParticipantIds,
        accessUserIds: permissionSets.accessUserIds,
        canViewUserIds: permissionSets.canViewUserIds,
        canCommentUserIds: permissionSets.canCommentUserIds,
        canManageMeetingUserIds: permissionSets.canManageMeetingUserIds,
        canEditUserIds: permissionSets.canEditUserIds,
        canCreateEstimateUserIds: permissionSets.canCreateEstimateUserIds,
      };

      await updateDoc(recordDoc, updatePayload);

      await notifyRecipients({
        recipientIds: getRelatedRecipientIds(mergedRecordData, actorId),
        type: "comment",
        recordId,
        message: `${userName} commented on Project ${latestRecord.projectName || editingRecord.projectName}: "${comment.substring(0, 50)}${comment.length > 50 ? "..." : ""}"`,
      });

      setComment("");
      toast({
        title: "Comment Added",
        description: "Your comment has been added successfully.",
      });
    } catch (err) {
      console.error("Error adding comment:", err);
      toast({
        title: "Error",
        description: "Failed to add comment.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="h-[96vh] w-[99vw] max-w-[99vw] overflow-hidden p-5">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">
            {editingRecord ? "Edit Sales Record" : "Add New Sales Record"}
          </DialogTitle>
        </DialogHeader>

        {isMeetingOnlyUser && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            You have custodian access on this project. You can view the project,
            add comments, and create meeting updates only. Main project fields
            and estimate creation are restricted.
          </div>
        )}

        <div className="grid h-[calc(96vh-88px)] gap-5 text-sm xl:grid-cols-[minmax(620px,1.15fr)_minmax(540px,1fr)]">
          <div className="min-w-0 rounded-lg border bg-background p-4 overflow-y-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="flex flex-col h-full"
            >
              <div className="pr-2 pb-4">
                <div className="grid gap-4 xl:grid-cols-2">
                  <div
                    className={`space-y-4 rounded-lg border p-4 xl:col-span-2 ${editingRecord && !canEditRecord ? "pointer-events-none opacity-60" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3
                          className="text-sm font-semibold"
                          data-testid="section-details"
                        >
                          Basic Information
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Project code is generated automatically and saved with
                          this sales record.
                        </p>
                      </div>
                      <div
                        className="min-w-[220px] rounded-md border bg-muted/40 px-3 py-2 text-xs font-semibold"
                        data-testid="project-code-display"
                      >
                        {generatedProjectCode ||
                          "Project code will generate automatically"}
                      </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                      <div>
                        <Label htmlFor="client" className="text-xs">
                          Client *
                        </Label>
                        <Select
                          value={formData.client}
                          onValueChange={(value) =>
                            setFormData((s) => ({ ...s, client: value }))
                          }
                        >
                          <SelectTrigger
                            className="h-8"
                            data-testid="select-client"
                          >
                            <SelectValue placeholder="Select Client" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((c) => (
                              <SelectItem key={c.id} value={c.name}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="projectName" className="text-xs">
                          Project Name *
                        </Label>
                        <Input
                          id="projectName"
                          value={formData.projectName}
                          onChange={(e) =>
                            setFormData((s) => ({
                              ...s,
                              projectName: e.target.value,
                            }))
                          }
                          required
                          className="h-8"
                          data-testid="input-project-name"
                        />
                      </div>

                      <div>
                        <Label htmlFor="contactPerson" className="text-xs">
                          Contact Person *
                        </Label>
                        <Input
                          id="contactPerson"
                          type="text"
                          value={formData.contactPerson}
                          onChange={(e) =>
                            setFormData((s) => ({
                              ...s,
                              contactPerson: e.target.value,
                            }))
                          }
                          required
                          className="h-8"
                          data-testid="input-contact-person"
                        />
                      </div>

                      <div>
                        <Label htmlFor="contactMobile" className="text-xs">
                          Mobile
                        </Label>
                        <Input
                          id="contactMobile"
                          type="tel"
                          required
                          value={formData.contactMobile}
                          onChange={(e) =>
                            setFormData((s) => ({
                              ...s,
                              contactMobile: e.target.value,
                            }))
                          }
                          placeholder="+92 300 1234567"
                          className="h-8"
                          data-testid="input-contact-mobile"
                        />
                      </div>

                      <div>
                        <Label htmlFor="projectedValue" className="text-xs">
                          Projected Value *
                        </Label>
                        <Input
                          id="projectedValue"
                          type="number"
                          step="0.01"
                          value={formData.projectedValue}
                          onChange={(e) =>
                            setFormData((s) => ({
                              ...s,
                              projectedValue: e.target.value,
                            }))
                          }
                          required
                          className="h-8"
                          data-testid="input-projected-value"
                        />
                      </div>

                      <div>
                        <Label htmlFor="wonValue" className="text-xs">
                          Won Value
                        </Label>
                        <Input
                          id="wonValue"
                          type="number"
                          step="0.01"
                          value={formData.wonValue}
                          onChange={(e) =>
                            setFormData((s) => ({
                              ...s,
                              wonValue: e.target.value,
                            }))
                          }
                          className="h-8"
                          data-testid="input-won-value"
                        />
                      </div>

                      <div>
                        <Label htmlFor="invoiceNumber" className="text-xs">
                          Invoice #
                        </Label>
                        <Input
                          id="invoiceNumber"
                          value={formData.invoiceNumber}
                          onChange={(e) =>
                            setFormData((s) => ({
                              ...s,
                              invoiceNumber: e.target.value,
                            }))
                          }
                          className="h-8"
                          data-testid="input-invoice-number"
                        />
                      </div>

                      <div>
                        <Label htmlFor="paymentRef" className="text-xs">
                          Payment Ref
                        </Label>
                        <Input
                          id="paymentRef"
                          value={formData.paymentRef}
                          onChange={(e) =>
                            setFormData((s) => ({
                              ...s,
                              paymentRef: e.target.value,
                            }))
                          }
                          className="h-8"
                          data-testid="input-payment-ref"
                        />
                      </div>

                      <div>
                        <Label htmlFor="projectStatus" className="text-xs">
                          Project Status *
                        </Label>
                        <Select
                          value={formData.projectStatus}
                          onValueChange={(value) =>
                            setFormData((s) => ({
                              ...s,
                              projectStatus: value as SalesStatus,
                            }))
                          }
                        >
                          <SelectTrigger
                            className="h-8"
                            data-testid="select-project-status"
                          >
                            <SelectValue placeholder="Select project status" />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2 pt-5">
                        <Checkbox
                          id="needHelp"
                          checked={formData.needHelp}
                          onCheckedChange={(checked) =>
                            setFormData((s) => ({
                              ...s,
                              needHelp: checked === true,
                            }))
                          }
                          data-testid="checkbox-need-help"
                        />
                        <Label htmlFor="needHelp" className="text-xs">
                          Need Help
                        </Label>
                      </div>

                      <div className="xl:col-span-2">
                        <Label htmlFor="goal" className="text-xs font-bold">
                          Description
                        </Label>
                        <Textarea
                          id="goal"
                          required
                          value={formData.goal}
                          onChange={(e) =>
                            setFormData((s) => ({ ...s, goal: e.target.value }))
                          }
                          placeholder="Project Description..."
                          className="min-h-[84px] text-xs"
                          data-testid="textarea-goal"
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`space-y-4 rounded-lg border p-4 ${editingRecord && !canEditRecord ? "pointer-events-none opacity-60" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">
                        Project Custodians
                      </h3>
                      <span className="text-[11px] text-muted-foreground">
                        Sales only
                      </span>
                    </div>

                    {usersLoading ? (
                      <p className="text-xs text-muted-foreground">
                        Loading users...
                      </p>
                    ) : salesDepartmentUsers.length > 0 ? (
                      <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border p-2">
                        {salesDepartmentUsers.map((user) => {
                          const checked = formData.projectCustodians.some(
                            (selectedValue) =>
                              userMatchesSupervisorSelection(
                                user,
                                selectedValue,
                              ),
                          );

                          return (
                            <label
                              key={`custodian-${user.id}`}
                              className="flex cursor-pointer items-start gap-3 rounded-md border p-2 hover:bg-muted/40"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(value) =>
                                  toggleCustodian(user, value === true)
                                }
                                data-testid={`checkbox-custodian-${user.id}`}
                              />
                              <div className="min-w-0">
                                <div className="text-sm font-medium">
                                  {user.displayName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {[user.role, user.department]
                                    .filter(Boolean)
                                    .join(" • ") ||
                                    user.email ||
                                    "Sales"}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No sales users found for project custodian selection.
                      </p>
                    )}

                    {selectedCustodianLabels.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedCustodianLabels.map((custodian) => (
                          <Badge
                            key={custodian.key}
                            variant="secondary"
                            className="text-xs"
                          >
                            {custodian.label}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div
                    className={`space-y-4 rounded-lg border p-4 ${editingRecord && !canEditRecord ? "pointer-events-none opacity-60" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">Supervisors</h3>
                      <span className="text-[11px] text-muted-foreground">
                        Sales + admins only
                      </span>
                    </div>

                    {usersLoading ? (
                      <p className="text-xs text-muted-foreground">
                        Loading users...
                      </p>
                    ) : supervisorEligibleUsers.length > 0 ? (
                      <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border p-2">
                        {supervisorEligibleUsers.map((user) => {
                          const checked = formData.supervisors.some(
                            (selectedValue) =>
                              userMatchesSupervisorSelection(
                                user,
                                selectedValue,
                              ),
                          );

                          return (
                            <label
                              key={`supervisor-${user.id}`}
                              className="flex cursor-pointer items-start gap-3 rounded-md border p-2 hover:bg-muted/40"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(value) =>
                                  toggleSupervisor(user, value === true)
                                }
                                data-testid={`checkbox-supervisor-${user.id}`}
                              />
                              <div className="min-w-0">
                                <div className="text-sm font-medium">
                                  {user.displayName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {[user.role, user.department]
                                    .filter(Boolean)
                                    .join(" • ") ||
                                    user.email ||
                                    "User"}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No sales or admin users found for supervisor selection.
                      </p>
                    )}

                    {selectedSupervisorLabels.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedSupervisorLabels.map((supervisor) => (
                          <Badge
                            key={supervisor.key}
                            variant="secondary"
                            className="text-xs"
                          >
                            {supervisor.label}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="hidden">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold">
                          Estimates Linked To This Project Code
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Create an estimate using this project code and see all
                          linked estimates here.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCreateEstimate}
                        disabled={
                          loading ||
                          !canCreateEstimate ||
                          !generatedProjectCode ||
                          !formData.client.trim() ||
                          !formData.projectName.trim()
                        }
                        className="gap-2"
                        data-testid="button-create-estimate"
                      >
                        <FileText className="h-4 w-4" /> Create Estimate
                      </Button>
                    </div>

                    <div className="rounded-md border bg-muted/20 p-3 text-xs">
                      <span className="font-medium">Project Code:</span>{" "}
                      {generatedProjectCode || "Not ready yet"}
                    </div>

                    {estimatesLoading ? (
                      <p className="text-xs text-muted-foreground">
                        Loading linked estimates...
                      </p>
                    ) : linkedEstimates.length > 0 ? (
                      <div className="grid gap-2 xl:grid-cols-2">
                        {linkedEstimates.map((estimate) => (
                          <div
                            key={`${estimate.source}-${estimate.id}`}
                            className="rounded-md border p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-medium">
                                  {estimate.estimateNumber}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {estimate.title}
                                </div>
                              </div>
                              <Badge
                                variant="secondary"
                                className="text-[10px] uppercase"
                              >
                                {estimate.source}
                              </Badge>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span>Status: {estimate.status}</span>
                              {estimate.totalValue ? (
                                <span>Total: {estimate.totalValue}</span>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No estimate has been linked with this project code yet.
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 rounded-lg border p-4 xl:col-span-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Meeting Updates</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNewMeetingForm(true)}
                        disabled={!canManageMeetings}
                        className="flex items-center gap-1"
                        data-testid="button-add-meeting"
                      >
                        <Plus className="h-3 w-3" /> Add Meeting
                      </Button>
                    </div>

                    <div className="grid gap-2 xl:grid-cols-2">
                      {meetingUpdatesLoading ? (
                        <p className="text-xs text-gray-500">
                          Loading meetings...
                        </p>
                      ) : meetingUpdates.length > 0 ? (
                        meetingUpdates.map((meeting: any) => (
                          <div
                            key={meeting.id}
                            className={`p-3 rounded border cursor-pointer text-xs transition-colors ${
                              selectedMeetingId === meeting.id
                                ? "bg-blue-50 border-blue-200"
                                : "bg-gray-50 hover:bg-gray-100"
                            }`}
                            onClick={() => setSelectedMeetingId(meeting.id)}
                            data-testid={`meeting-item-${meeting.id}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">
                                {meeting.meetingDate}
                              </span>
                              <div className="flex items-center gap-1 flex-wrap justify-end">
                                {meeting.visit && (
                                  <span className="text-green-600 text-xs">
                                    Visit
                                  </span>
                                )}
                                {meeting.online && (
                                  <span className="text-blue-600 text-xs">
                                    Online
                                  </span>
                                )}
                                {meeting.reimbursement?.enabled && (
                                  <span className="text-amber-600 text-xs">
                                    Reimbursement
                                  </span>
                                )}
                              </div>
                            </div>
                            {meeting.discussionNotes && (
                              <p className="text-gray-600 truncate mt-1">
                                {meeting.discussionNotes}
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500 italic">
                          No meetings yet. Add your first meeting above.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 z-20 mt-auto flex gap-3 border-t bg-background/95 py-3 backdrop-blur-sm">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    (editingRecord
                      ? !canEditRecord && !isMeetingOnlyUser
                      : false)
                  }
                  className="bg-green-600 hover:bg-green-700 text-white px-6"
                  data-testid="button-save"
                >
                  {loading
                    ? editingRecord
                      ? "Updating..."
                      : "Saving..."
                    : editingRecord
                      ? "Update Record"
                      : "Save Record"}
                </Button>
              </div>
            </form>
          </div>

          <div className="min-w-0 overflow-y-auto rounded-lg border bg-background">
            <div className="space-y-4 p-5">
              <div
                className={`rounded-lg border p-4 ${editingRecord && !canCreateEstimate ? "opacity-60" : ""}`}
              >
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">
                      Estimates Linked To This Project Code
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Create an estimate using this project code and see all
                      linked estimates here.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCreateEstimate}
                    disabled={
                      loading ||
                      !canCreateEstimate ||
                      !generatedProjectCode ||
                      !formData.client.trim() ||
                      !formData.projectName.trim()
                    }
                    className="gap-2"
                    data-testid="button-create-estimate"
                  >
                    <FileText className="h-4 w-4" /> Create Estimate
                  </Button>
                </div>

                <div className="mt-3 rounded-md border bg-muted/20 p-3 text-xs">
                  <span className="font-medium">Project Code:</span>{" "}
                  {generatedProjectCode || "Not ready yet"}
                </div>

                {estimatesLoading ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Loading linked estimates...
                  </p>
                ) : linkedEstimates.length > 0 ? (
                  <div className="mt-3 grid gap-2 xl:grid-cols-2">
                    {linkedEstimates.map((estimate) => (
                      <div
                        key={`${estimate.source}-${estimate.id}`}
                        className="rounded-md border p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium">
                              {estimate.estimateNumber}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {estimate.title}
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-[10px] uppercase"
                          >
                            {estimate.source}
                          </Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>Status: {estimate.status}</span>
                          {estimate.totalValue ? (
                            <span>Total: {estimate.totalValue}</span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">
                    No estimate has been linked with this project code yet.
                  </p>
                )}
              </div>

              {showNewMeetingForm ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      New Meeting Update
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewMeetingForm(false)}
                      data-testid="button-cancel-meeting"
                    >
                      Cancel
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">
                        Meeting Date
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal mt-1"
                            data-testid="button-meeting-date"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newMeetingDate ? (
                              format(newMeetingDate, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newMeetingDate || undefined}
                            onSelect={(date) => setNewMeetingDate(date ?? null)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">
                        Meeting Mode
                      </Label>
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        <label
                          className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 ${newMeetingData.visit ? "border-blue-500 bg-blue-50" : "hover:bg-muted/30"}`}
                        >
                          <input
                            type="radio"
                            name="meeting-mode"
                            checked={
                              newMeetingData.visit && !newMeetingData.online
                            }
                            onChange={() =>
                              setNewMeetingData((prev) => ({
                                ...prev,
                                visit: true,
                                online: false,
                              }))
                            }
                            data-testid="radio-new-meeting-visit"
                          />
                          <span className="text-sm font-medium">Visit</span>
                        </label>

                        <label
                          className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 ${newMeetingData.online ? "border-blue-500 bg-blue-50" : "hover:bg-muted/30"}`}
                        >
                          <input
                            type="radio"
                            name="meeting-mode"
                            checked={
                              newMeetingData.online && !newMeetingData.visit
                            }
                            onChange={() => {
                              setBillFile(null);
                              setNewMeetingData((prev) => ({
                                ...prev,
                                visit: false,
                                online: true,
                                reimbursement: { ...EMPTY_REIMBURSEMENT },
                              }));
                            }}
                            data-testid="radio-new-meeting-online"
                          />
                          <span className="text-sm font-medium">Online</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">
                        Discussion Notes
                      </Label>
                      <Textarea
                        value={newMeetingData.discussionNotes}
                        onChange={(e) =>
                          setNewMeetingData((prev) => ({
                            ...prev,
                            discussionNotes: e.target.value,
                          }))
                        }
                        placeholder="What was discussed in this meeting?"
                        className="mt-1"
                        rows={3}
                        data-testid="textarea-discussion-notes"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium">
                        Action Items
                      </Label>
                      <div className="mt-2 space-y-2">
                        {newMeetingData.actionItems.map((item, idx) => (
                          <div key={idx} className="flex gap-2">
                            <Input
                              value={item}
                              onChange={(e) =>
                                updateNewMeetingActionItem(idx, e.target.value)
                              }
                              placeholder="Enter action item..."
                              className="flex-1"
                              data-testid={`input-new-action-${idx}`}
                            />
                            {newMeetingData.actionItems.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeNewMeetingActionItem(idx)}
                                className="px-2"
                                data-testid={`button-remove-new-action-${idx}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addNewMeetingActionItem}
                          className="flex items-center gap-1"
                          data-testid="button-add-new-action"
                        >
                          <Plus className="h-4 w-4" /> Add More
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-lg border p-4 space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <Label className="text-sm font-medium">
                            Claim Reimbursement
                          </Label>
                          <p className="text-[11px] text-muted-foreground">
                            Only the project owner can submit this claim, and it
                            will be sent to admin for approval after saving the
                            meeting.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant={
                            newMeetingData.reimbursement.enabled
                              ? "outline"
                              : "default"
                          }
                          disabled={!isProjectOwner || !isVisitMeetingMode}
                          onClick={() =>
                            setNewMeetingData((prev) => ({
                              ...prev,
                              reimbursement: prev.reimbursement.enabled
                                ? { ...EMPTY_REIMBURSEMENT }
                                : {
                                    ...EMPTY_REIMBURSEMENT,
                                    enabled: true,
                                    attachBill: true,
                                  },
                            }))
                          }
                          data-testid="button-toggle-reimbursement"
                        >
                          {newMeetingData.reimbursement.enabled
                            ? "Remove Claim Reimbursement"
                            : "Claim Reimbursement"}
                        </Button>
                      </div>

                      <p
                        className={`text-xs ${claimDatePassed || !isProjectOwner ? "text-red-600" : "text-muted-foreground"}`}
                      >
                        {reimbursementNotice}
                      </p>

                      {newMeetingData.reimbursement.enabled && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Amount</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={newMeetingData.reimbursement.amount}
                                disabled={
                                  !canClaimForSelectedMeeting ||
                                  !canSubmitReimbursementClaim ||
                                  !isVisitMeetingMode
                                }
                                onChange={(e) =>
                                  setNewMeetingData((prev) => ({
                                    ...prev,
                                    reimbursement: {
                                      ...prev.reimbursement,
                                      amount: e.target.value,
                                    },
                                  }))
                                }
                                data-testid="input-reimbursement-amount"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Claim Date</Label>
                              <Input
                                value={
                                  newMeetingDate
                                    ? format(newMeetingDate, "PPP")
                                    : "Select meeting date first"
                                }
                                readOnly
                                disabled
                                data-testid="input-reimbursement-date"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs">Detail</Label>
                            <Textarea
                              value={newMeetingData.reimbursement.detail}
                              disabled={
                                !canClaimForSelectedMeeting ||
                                !canSubmitReimbursementClaim ||
                                !isVisitMeetingMode
                              }
                              onChange={(e) =>
                                setNewMeetingData((prev) => ({
                                  ...prev,
                                  reimbursement: {
                                    ...prev.reimbursement,
                                    detail: e.target.value,
                                  },
                                }))
                              }
                              rows={3}
                              data-testid="textarea-reimbursement-detail"
                            />
                          </div>

                          <div className="space-y-2 rounded-md border p-3">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <Label className="text-xs">
                                  Bill Attachment *
                                </Label>
                                <p className="text-[11px] text-muted-foreground">
                                  Bill attachment is mandatory. The file will be
                                  uploaded to Cloudinary in the reimbursement
                                  folder and submitted for admin approval.
                                </p>
                              </div>
                              {newMeetingData.reimbursement.billFileName ? (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  Attached
                                </Badge>
                              ) : null}
                            </div>
                            <Input
                              type="file"
                              disabled={
                                !canClaimForSelectedMeeting ||
                                !canSubmitReimbursementClaim ||
                                !isVisitMeetingMode ||
                                billUploading
                              }
                              onChange={(e) =>
                                onBillFileChange(e.target.files?.[0])
                              }
                              data-testid="input-bill-file"
                            />
                            {newMeetingData.reimbursement.billFileName && (
                              <p className="text-xs text-muted-foreground">
                                Selected bill:{" "}
                                {newMeetingData.reimbursement.billFileName}
                              </p>
                            )}
                          </div>

                          <div className="space-y-3 rounded-md border p-3">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="fuel-claim-enabled"
                                checked={
                                  newMeetingData.reimbursement.fuelClaimEnabled
                                }
                                disabled={
                                  !canClaimForSelectedMeeting ||
                                  !canSubmitReimbursementClaim ||
                                  !isVisitMeetingMode
                                }
                                onCheckedChange={(checked) =>
                                  setNewMeetingData((prev) => ({
                                    ...prev,
                                    reimbursement: {
                                      ...prev.reimbursement,
                                      fuelClaimEnabled: checked === true,
                                    },
                                  }))
                                }
                                data-testid="checkbox-fuel-claim-enabled"
                              />
                              <Label
                                htmlFor="fuel-claim-enabled"
                                className="text-sm font-medium"
                              >
                                Fuel Claim
                              </Label>
                            </div>

                            {newMeetingData.reimbursement.fuelClaimEnabled && (
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs">Transport</Label>
                                  <Select
                                    value={
                                      newMeetingData.reimbursement.fuelType
                                    }
                                    onValueChange={(value) =>
                                      setNewMeetingData((prev) => ({
                                        ...prev,
                                        reimbursement: {
                                          ...prev.reimbursement,
                                          fuelType: value as FuelType,
                                        },
                                      }))
                                    }
                                  >
                                    <SelectTrigger data-testid="select-fuel-type">
                                      <SelectValue placeholder="Select transport" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="bike">Bike</SelectItem>
                                      <SelectItem value="taxi">Taxi</SelectItem>
                                      <SelectItem value="car">Car</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-xs">KMs</Label>
                                  <Input
                                    type="number"
                                    value={newMeetingData.reimbursement.kms}
                                    disabled={
                                      !canClaimForSelectedMeeting ||
                                      !canSubmitReimbursementClaim ||
                                      !isVisitMeetingMode
                                    }
                                    onChange={(e) =>
                                      setNewMeetingData((prev) => ({
                                        ...prev,
                                        reimbursement: {
                                          ...prev.reimbursement,
                                          kms: e.target.value,
                                        },
                                      }))
                                    }
                                    data-testid="input-fuel-kms"
                                  />
                                </div>
                                <div className="col-span-2 rounded-md border bg-muted/20 p-3">
                                  <Label className="text-xs">
                                    Bill Attachment *
                                  </Label>
                                  <p className="mt-1 text-[11px] text-muted-foreground">
                                    Fuel Claim also requires the bill attachment
                                    above before submission for approval.
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {newMeetingData.reimbursement.billFileName
                                      ? `Attached bill: ${newMeetingData.reimbursement.billFileName}`
                                      : "No bill attached yet."}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      type="button"
                      onClick={handleCreateMeeting}
                      disabled={billUploading || !canManageMeetings}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      data-testid="button-create-meeting"
                    >
                      {billUploading
                        ? "Uploading Bill..."
                        : "Save Meeting Update"}
                    </Button>
                  </div>
                </div>
              ) : selectedMeetingId && selectedMeeting ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      Meeting on{" "}
                      {new Date(selectedMeeting.meetingDate).toLocaleDateString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedMeeting.visit && (
                        <Badge variant="secondary" className="text-xs">
                          Visit
                        </Badge>
                      )}
                      {selectedMeeting.online && (
                        <Badge variant="secondary" className="text-xs">
                          Online
                        </Badge>
                      )}
                      {selectedMeeting.reimbursement?.enabled && (
                        <Badge variant="secondary" className="text-xs">
                          Reimbursement
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">
                        Discussion Notes
                      </Label>
                      <div className="mt-2 p-3 bg-gray-50 rounded border text-sm">
                        {selectedMeeting.discussionNotes || (
                          <span className="text-gray-400 italic">
                            No discussion notes for this meeting
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">
                        Action Items
                      </Label>
                      <div className="mt-2 space-y-2">
                        {selectedMeeting.actionItems.length > 0 ? (
                          selectedMeeting.actionItems.map(
                            (item: string, idx: number) => (
                              <div
                                key={idx}
                                className="p-2 bg-gray-50 rounded border text-sm"
                              >
                                {item || (
                                  <span className="text-gray-400 italic">
                                    Empty action item
                                  </span>
                                )}
                              </div>
                            ),
                          )
                        ) : (
                          <p className="text-sm text-gray-500 italic">
                            No action items for this meeting
                          </p>
                        )}
                      </div>
                    </div>

                    {selectedMeeting.reimbursement?.enabled && (
                      <div className="rounded-lg border p-4 space-y-2">
                        <Label className="text-sm font-medium">
                          Reimbursement
                        </Label>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Amount:</span>{" "}
                            {selectedMeeting.reimbursement.amount || "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">Bill:</span>{" "}
                            {selectedMeeting.reimbursement.billFileName ||
                              "Not attached"}
                            {selectedMeeting.reimbursement.billUrl ? (
                              <a
                                href={selectedMeeting.reimbursement.billUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="ml-2 inline-flex items-center gap-1 text-blue-600 hover:underline"
                              >
                                View <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : null}
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium">Detail:</span>{" "}
                            {selectedMeeting.reimbursement.detail || "N/A"}
                          </div>
                          <div className="col-span-2 text-xs text-muted-foreground">
                            {selectedMeeting.reimbursement.claimRuleText ||
                              "Claim reimbursements on the day of meeting otherwise you cannot claim after that date."}
                          </div>
                          {selectedMeeting.reimbursement.approvalStatus ? (
                            <div>
                              <span className="font-medium">Approval:</span>{" "}
                              {String(
                                selectedMeeting.reimbursement.approvalStatus,
                              )
                                .replace(/_/g, " ")
                                .split(" ")
                                .filter(Boolean)
                                .map(
                                  (word: string) =>
                                    word.charAt(0).toUpperCase() +
                                    word.slice(1),
                                )
                                .join(" ")}
                            </div>
                          ) : null}
                          {selectedMeeting.reimbursement.fuelClaimEnabled && (
                            <>
                              <div>
                                <span className="font-medium">Fuel Type:</span>{" "}
                                {selectedMeeting.reimbursement.fuelType}
                              </div>
                              <div>
                                <span className="font-medium">KMs:</span>{" "}
                                {selectedMeeting.reimbursement.kms || "0"}
                              </div>
                            </>
                          )}
                          {selectedMeeting.reimbursement.claimStatus ===
                            "date_passed" && (
                            <div className="col-span-2 text-red-600 text-xs font-medium">
                              You cannot claim because the meeting date is
                              passed.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Comments for this meeting
                      </Label>

                      <div className="mt-3 space-y-2">
                        <Input
                          value={meetingComment}
                          disabled={!canCommentOnRecord}
                          onChange={(e) => setMeetingComment(e.target.value)}
                          placeholder="Add a comment for this meeting..."
                          className="text-sm"
                          data-testid="input-meeting-comment"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleMeetingCommentSubmit();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={handleMeetingCommentSubmit}
                          disabled={
                            !canCommentOnRecord || !meetingComment.trim()
                          }
                          size="sm"
                          className="w-full"
                          data-testid="button-submit-meeting-comment"
                        >
                          Add Comment
                        </Button>
                      </div>

                      <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                        {comments?.length > 0 ? (
                          comments.map((c, idx) => (
                            <div
                              key={c.id ?? idx}
                              className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg"
                            >
                              <p className="text-sm text-gray-900 dark:text-gray-100">
                                {c.text}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">
                                  {c.authorName ?? "Unknown"}
                                </span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500">
                                  {c.createdAt
                                    ? formatDistanceToNow(
                                        c.createdAt instanceof Date
                                          ? c.createdAt
                                          : new Date(c.createdAt),
                                        { addSuffix: true },
                                      )
                                    : "Just now"}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic">
                            No comments for this meeting yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <MessageSquare className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No meeting selected
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Select a meeting from the list or create a new one to view
                    details.
                  </p>
                  <Button
                    type="button"
                    onClick={() => setShowNewMeetingForm(true)}
                    disabled={!canManageMeetings}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="button-create-first-meeting"
                  >
                    Create Your First Meeting
                  </Button>
                </div>
              )}

              <div
                className={`p-4 border rounded-lg ${editingRecord && !canEditRecord && !canManageMeetings ? "pointer-events-none opacity-60" : ""}`}
              >
                <Label className="text-sm font-medium">Next Follow-Up</Label>
                <div className="mt-2">
                  <Label htmlFor="followUpDate" className="text-xs">
                    Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal mt-1"
                        data-testid="button-follow-up-date"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.nextFollowUpDate ? (
                          format(formData.nextFollowUpDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.nextFollowUpDate || undefined}
                        onSelect={(date) =>
                          setFormData((s) => ({
                            ...s,
                            nextFollowUpDate: date || null,
                          }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="mt-4">
                  <Label className="text-xs font-medium">
                    Action Items After Meeting
                  </Label>
                  <div className="mt-2 space-y-2">
                    {formData.nextFollowUpActionItems.map((ai, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          value={ai}
                          onChange={(e) =>
                            updateFollowUpActionItem(idx, e.target.value)
                          }
                          placeholder="Enter follow-up action item..."
                          className="flex-1"
                          data-testid={`input-follow-up-action-${idx}`}
                        />
                        {formData.nextFollowUpActionItems.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeFollowUpActionItem(idx)}
                            className="px-2"
                            data-testid={`button-remove-follow-up-action-${idx}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addFollowUpActionItem}
                      className="flex items-center gap-1"
                      data-testid="button-add-follow-up-action"
                    >
                      <Plus className="h-4 w-4" /> Add More
                    </Button>
                  </div>
                </div>
              </div>

              {editingRecord && (
                <div className="p-4 border rounded-lg">
                  <Label className="text-sm font-medium">Record Comments</Label>
                  <div className="mt-3 space-y-2">
                    <Input
                      value={comment}
                      disabled={!canCommentOnRecord}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment for this record..."
                      className="text-sm"
                      data-testid="input-record-comment"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleCommentSubmit(editingRecord.id);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => handleCommentSubmit(editingRecord.id)}
                      disabled={!canCommentOnRecord || !comment.trim()}
                      size="sm"
                      className="w-full"
                      data-testid="button-submit-record-comment"
                    >
                      Add Record Comment
                    </Button>
                  </div>

                  <div className="mt-4 space-y-2 max-h-44 overflow-y-auto">
                    {(editingRecord as any)?.comments?.length > 0 ? (
                      (editingRecord as any).comments.map(
                        (c: any, idx: number) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-900">{c.text}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {c.userName ?? "Unknown"}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">
                                {c.timestamp
                                  ? formatDistanceToNow(new Date(c.timestamp), {
                                      addSuffix: true,
                                    })
                                  : "Just now"}
                              </span>
                            </div>
                          </div>
                        ),
                      )
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        No comments for this record yet.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
