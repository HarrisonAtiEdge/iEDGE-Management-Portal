import React, { useState, useEffect } from "react";
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
import { CalendarIcon, Plus, X, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, addDays, formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMeetingUpdates } from "@/hooks/useMeetingUpdates";
import { useMeetingUpdateComments } from "@/hooks/useMeetingUpdateComments";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  SalesRecord,
  SalesStatus,
  MeetingUpdate,
  InsertMeetingUpdate,
} from "@shared/schema";

interface SalesRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRecord?: SalesRecord | null;
  clients: any[];
}

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

export function SalesRecordModal({
  isOpen,
  onClose,
  editingRecord,
  clients,
}: SalesRecordModalProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(
    null,
  );
  const [newMeetingDate, setNewMeetingDate] = useState<Date | null>(null);
  const [meetingComment, setMeetingComment] = useState("");
  const [showNewMeetingForm, setShowNewMeetingForm] = useState(false);
  const [newMeetingData, setNewMeetingData] = useState({
    discussionNotes: "",
    actionItems: [""],
    visit: false,
  });

  // Meeting update hooks
  const {
    meetingUpdates,
    loading: meetingUpdatesLoading,
    createMeetingUpdate,
    updateMeetingUpdate,
  } = useMeetingUpdates(editingRecord?.id);

  const selectedMeeting = meetingUpdates.find(
    (meeting) => meeting.id === selectedMeetingId,
  );
  const { comments = [], addComment } = useMeetingUpdateComments(
    editingRecord?.id,
    selectedMeetingId || undefined,
  );

  // Auto-select first meeting when meetings load
  React.useEffect(() => {
    if (meetingUpdates.length > 0 && !selectedMeetingId) {
      setSelectedMeetingId(meetingUpdates[0].id);
    }
  }, [meetingUpdates, selectedMeetingId]);

  // Helper: recipient id for notifications (keeps your original logic)
  const getRecipientId = (): string | undefined => {
    if (userProfile?.role === "sales") {
      return editingRecord?.salesPersonId !== userProfile.id
        ? editingRecord?.salesPersonId
        : undefined;
    } else {
      return editingRecord?.salesPersonId;
    }
  };

  // Meeting update helpers
  const handleCreateMeeting = async () => {
    if (!editingRecord?.id || !userProfile || !newMeetingDate) {
      toast({
        title: "Cannot create meeting",
        description: "Please select a meeting date and ensure record is saved.",
        variant: "destructive",
      });
      return;
    }

    const newMeeting: InsertMeetingUpdate = {
      recordId: editingRecord.id,
      meetingDate: format(newMeetingDate, "yyyy-MM-dd"),
      discussionNotes: newMeetingData.discussionNotes,
      actionItems: newMeetingData.actionItems.filter((item) => item.trim()),
      visit: newMeetingData.visit,
      createdById: userProfile.id,
      createdByName: userProfile.displayName,
    };

    try {
      const meetingId = await createMeetingUpdate(newMeeting, getRecipientId());
      setSelectedMeetingId(meetingId);
      setShowNewMeetingForm(false);
      setNewMeetingDate(null);
      setNewMeetingData({
        discussionNotes: "",
        actionItems: [""],
        visit: false,
      });
      toast({
        title: "Success",
        description: "Meeting update created successfully.",
      });
    } catch (err) {
      console.error("Error creating meeting:", err);
      toast({
        title: "Error",
        description: "Failed to create meeting update.",
        variant: "destructive",
      });
    }
  };

  // Meeting update action handlers
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

    try {
      await addComment(meetingComment, getRecipientId(), selectedMeetingId);
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

  // New meeting form handlers
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
    if (newMeetingData.actionItems.length > 1) {
      setNewMeetingData((prev) => ({
        ...prev,
        actionItems: prev.actionItems.filter((_, i) => i !== index),
      }));
    }
  };

  // Main form state and helpers
  const [formData, setFormData] = useState<SalesFormData>({
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
  });

  const [comment, setComment] = useState("");

  const addActionItem = () =>
    setFormData((s) => ({ ...s, actionItems: [...s.actionItems, ""] }));
  const removeActionItem = (i: number) =>
    setFormData((s) => ({
      ...s,
      actionItems: s.actionItems.filter((_, idx) => idx !== i),
    }));
  const updateActionItem = (i: number, v: string) =>
    setFormData((s) => {
      const arr = [...s.actionItems];
      arr[i] = v;
      return { ...s, actionItems: arr };
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
  const updateFollowUpActionItem = (i: number, v: string) =>
    setFormData((s) => {
      const arr = [...s.nextFollowUpActionItems];
      arr[i] = v;
      return { ...s, nextFollowUpActionItems: arr };
    });

    const salesRef = collection(
  db,
  "Panels",
  "IEDGE-SYSTEM",
  "salesRecords"
);

  // Prefill when editingRecord changes
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
      });
    } else {
      setFormData({
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
      });
    }
  }, [editingRecord, isOpen]);

  // Save (create or update) sales record
  const handleSave = async () => {
    if (!userProfile) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const projectedValueNumber =
        parseFloat(formData.projectedValue as unknown as string) || 0;
      const wonValueNumber =
        parseFloat(formData.wonValue as unknown as string) || 0;

      const filteredActionItems = formData.actionItems.filter(
        (it) => it.trim() !== "",
      );
      const filteredFollowUpActionItems =
        formData.nextFollowUpActionItems.filter((it) => it.trim() !== "");

      const recordData: any = {
        client: formData.client,
        contactPerson: formData.contactPerson,
        contactMobile: formData.contactMobile,
        projectCode: formData.projectCode,
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
          date: formData.nextFollowUpDate ? formData.nextFollowUpDate : null,
          actionItems: filteredFollowUpActionItems,
        },
        projectStatus: formData.projectStatus,
        updatedAt: serverTimestamp(),
      };

      // if (editingRecord) {
      //   const recordDoc = doc(db, "salesRecords", editingRecord.id);
      //   await updateDoc(recordDoc, recordData);
      // } else {
      //   await addDoc(collection(db, "salesRecords"), {
      //     ...recordData,
      //     createdAt: serverTimestamp(),
      //     salesPersonId: userProfile.id,
      //     salesPersonName: userProfile.displayName,
      //   });
      // }

      if (editingRecord) {
  const recordDoc = doc(
    db,
    "Panels",
    "IEDGE-SYSTEM",
    "salesRecords",
    editingRecord.id
  );

  await updateDoc(recordDoc, {
    ...recordData,
    updatedAt: serverTimestamp(),
  });
} else {
  await addDoc(salesRef, {
    ...recordData,
    createdAt: serverTimestamp(),
    salesPersonId: userProfile.id,
    salesPersonName: userProfile.displayName,
  });
}

      toast({
        title: "Success",
        description: editingRecord
          ? "Sales record updated successfully"
          : "Sales record created successfully",
      });
      onClose();
    } catch (err) {
      console.error("Error saving sales record:", err);
      toast({
        title: "Error",
        description: "Failed to save sales record",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Record-level comments
  const handleCommentSubmit = async (recordId: string) => {
    if (!comment.trim()) return;
    if (!editingRecord) return;

    const timestamp = new Date();
    const userName = userProfile?.displayName ?? "Unknown User";
    const newComment = {
      text: comment,
      timestamp: timestamp.toISOString(),
      userName,
    };

  //   try {
  //     const recordDoc = doc(db, "salesRecords", recordId);
  //     await updateDoc(recordDoc, {
  //       comments: [...(editingRecord?.comments || []), newComment],
  //       updatedAt: serverTimestamp(),
  //     });
  //     setComment("");
  //     toast({
  //       title: "Comment Added",
  //       description: "Your comment has been added successfully.",
  //     });
  //   } catch (err) {
  //     console.error("Error adding comment:", err);
  //     toast({
  //       title: "Error",
  //       description: "Failed to add comment.",
  //       variant: "destructive",
  //     });
  //   }
  // };


  try {
  const recordDoc = doc(
    db,
    "Panels",
    "IEDGE-SYSTEM",
    "salesRecords",
    recordId
  );

  await updateDoc(recordDoc, {
    comments: [...(editingRecord?.comments || []), newComment],
    updatedAt: serverTimestamp(),
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


  // UI: wider, slightly more compact — ensures buttons aren't clipped
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[90vw] max-h-[85vh] overflow-visible">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">
            {editingRecord ? "Edit Sales Record" : "Add New Sales Record"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[78vh] gap-6 text-sm">
          {/* Left form (scrollable) */}
          <div className="w-[340px] flex-shrink-0 border-r pr-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="flex flex-col h-full"
            >
              <div className="overflow-y-auto pr-2 pb-4 space-y-4 max-h-[calc(78vh-72px)]">
                <div className="space-y-3">
                  <h3
                    className="text-sm font-semibold"
                    data-testid="section-details"
                  >
                    Project Details
                  </h3>

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

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="projectCode" className="text-xs">
                        Project Code
                      </Label>
                      <Input
                        id="projectCode"
                        value={formData.projectCode}
                        onChange={(e) =>
                          setFormData((s) => ({
                            ...s,
                            projectCode: e.target.value,
                          }))
                        }
                        className="h-8"
                        data-testid="input-project-code"
                      />
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
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="estimateNumber" className="text-xs">
                        Estimate #
                      </Label>
                      <Input
                        id="estimateNumber"
                        value={formData.estimateNumber}
                        onChange={(e) =>
                          setFormData((s) => ({
                            ...s,
                            estimateNumber: e.target.value,
                          }))
                        }
                        className="h-8"
                        data-testid="input-estimate-number"
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

                  <div className="grid grid-cols-2 gap-2">
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
                  </div>

                  <div className="flex items-center space-x-2">
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

                  <div>
                    <Label htmlFor="goal" className="text-xs font-medium">
                      Goal
                    </Label>
                    <Textarea
                      id="goal"
                      value={formData.goal}
                      onChange={(e) =>
                        setFormData((s) => ({ ...s, goal: e.target.value }))
                      }
                      placeholder="Enter your goal..."
                      className="h-16 text-xs"
                      data-testid="textarea-goal"
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
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Day Wise Plan Tabs */}
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Meeting Updates</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewMeetingForm(true)}
                      className="flex items-center gap-1"
                      data-testid="button-add-meeting"
                    >
                      <Plus className="h-3 w-3" /> Add Meeting
                    </Button>
                  </div>

                  {/* Meeting List */}
                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                    {meetingUpdatesLoading ? (
                      <p className="text-xs text-gray-500">
                        Loading meetings...
                      </p>
                    ) : meetingUpdates.length > 0 ? (
                      meetingUpdates.map((meeting) => (
                        <div
                          key={meeting.id}
                          className={`p-2 rounded border cursor-pointer text-xs transition-colors ${
                            selectedMeetingId === meeting.id
                              ? "bg-blue-50 border-blue-200"
                              : "bg-gray-50 hover:bg-gray-100"
                          }`}
                          onClick={() => setSelectedMeetingId(meeting.id)}
                          data-testid={`meeting-item-${meeting.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {meeting.meetingDate}
                            </span>
                            <div className="flex items-center gap-1">
                              {meeting.visit && (
                                <span className="text-green-600 text-xs">
                                  Visit
                                </span>
                              )}
                              <span className="text-gray-500">
                                {meeting.actionItems.length} actions
                              </span>
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

              {/* Sticky footer inside left panel */}
              <div className="mt-auto bottom-0 dark:bg-slate-900/60 backdrop-blur-sm border-t py-2 flex  gap-3">
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
                  disabled={loading}
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

          {/* Right content area */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4 p-4">
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

                  {/* New Meeting Form */}
                  <div className="space-y-4">
                    {/* Meeting Date */}
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
                            onSelect={(date) => setNewMeetingDate(date || null)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Discussion Notes */}
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

                    {/* Visit Checkbox */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="new-meeting-visit"
                        checked={newMeetingData.visit}
                        onCheckedChange={(checked) =>
                          setNewMeetingData((prev) => ({
                            ...prev,
                            visit: !!checked,
                          }))
                        }
                        data-testid="checkbox-new-meeting-visit"
                      />
                      <Label htmlFor="new-meeting-visit" className="text-sm">
                        Visit scheduled for this meeting
                      </Label>
                    </div>

                    {/* Action Items */}
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

                    {/* Create Meeting Button */}
                    <Button
                      type="button"
                      onClick={handleCreateMeeting}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      data-testid="button-create-meeting"
                    >
                      Create Meeting Update
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
                    <div className="flex items-center gap-2">
                      {selectedMeeting.visit && (
                        <Badge variant="secondary" className="text-xs">
                          Visit Scheduled
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Meeting Details */}
                  <div className="space-y-4">
                    {/* Discussion Notes */}
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

                    {/* Action Items */}
                    <div>
                      <Label className="text-sm font-medium">
                        Action Items
                      </Label>
                      <div className="mt-2 space-y-2">
                        {selectedMeeting.actionItems.length > 0 ? (
                          selectedMeeting.actionItems.map((item, idx) => (
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
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic">
                            No action items for this meeting
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Meeting Comments */}
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Comments for this meeting
                      </Label>

                      <div className="mt-3 space-y-2">
                        <Input
                          value={meetingComment}
                          onChange={(e) => setMeetingComment(e.target.value)}
                          placeholder="Add a comment for this meeting..."
                          className="text-sm"
                          data-testid="input-meeting-comment"
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleMeetingCommentSubmit();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={handleMeetingCommentSubmit}
                          disabled={!meetingComment.trim()}
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
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="button-create-first-meeting"
                  >
                    Create Your First Meeting
                  </Button>
                </div>
              )}

              {/* Next Follow-up */}
              <div className="p-4 border rounded-lg">
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
                            data-testid={`button-remove-follow-up-${idx}`}
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

              {/* Record-level comments (only when editing existing record) */}
              {editingRecord && (
                <div className="p-4 border rounded-lg">
                  <Label htmlFor="comment" className="text-sm font-medium">
                    Add a Comment:
                  </Label>
                  <div className="mt-2">
                    <Input
                      id="comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="mt-2"
                      data-testid="input-comment"
                    />
                    <Button
                      type="button"
                      onClick={() => handleCommentSubmit(editingRecord.id)}
                      className="bg-blue-600 text-white mt-2"
                      data-testid="button-submit-comment"
                    >
                      Submit Comment
                    </Button>
                  </div>

                  <h4
                    className="mt-4 text-sm font-semibold"
                    data-testid="section-comments"
                  >
                    Comments
                  </h4>
                  <div className="space-y-3 mt-4">
                    {editingRecord?.comments?.length ? (
                      editingRecord.comments.map((c, idx) => (
                        <div
                          key={idx}
                          className="border rounded-lg p-3 bg-white shadow-sm"
                          data-testid={`comment-${idx}`}
                        >
                          <p className="text-sm">
                            <strong>{c.userName ?? "Unknown"}</strong>: {c.text}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {c.timestamp
                              ? (c.timestamp instanceof Date
                                  ? c.timestamp
                                  : new Date(c.timestamp)
                                ).toLocaleString()
                              : "Pending..."}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p
                        className="text-sm text-gray-500 italic"
                        data-testid="text-no-comments"
                      >
                        No comments yet.
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
